// ============================================================
//  lad/rules.js — 정리 회의 NPC의 판정 규칙 (서버에서만 실행)
//  ------------------------------------------------------------
//  - LLM을 쓰지 않는다. 학생이 게임하는 동안 외부 AI 호출이 없고, 프롬프트 탈옥도 없다.
//  - 정답 키워드는 이 서버에만 있다. 브라우저로 보내지 않는다.
//  - 출발점: npc-feedback-kit/server-reference/dialogueRules.js
//    바꾼 점: '꺼져'(불이 꺼져)는 전기 단원에서 자주 쓰는 말이라 비속어 목록에서 뺐다.
// ============================================================
'use strict';

// 보이지 않는 제어문자·방향 전환 문자를 지우고 길이를 자른다
function cleanText(s, max = 200) {
  let t = String(s == null ? '' : s).normalize('NFC');
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠-⁤﻿]/g, '');
  t = t.replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max) : t;
}

// 공백·문장부호 제거 + 소문자 → 띄어쓰기가 달라도 같은 말로 본다
function normalize(s) {
  return String(s || '').normalize('NFC').toLowerCase()
    .replace(/[\s.,!?~'"“”‘’()\[\]{}…·\-_/\\:;]+/g, '');
}

const AVOID = ['몰라', '모르', '모름', '너가', '니가', '네가해', '대신써', '대신해', '알려줘', '답알려', '정답', '정리해줘', '써줘', '해줘', '귀찮', '패스', '그냥넘어'];

// 위험 신호: 자해·괴롭힘·학대 맥락만. 전기 안전 답("감전되면 다칠 수 있어", "죽을 수도 있어", "불이 날 수 있어")은 걸리면 안 된다
const DANGER = ['죽고싶', '죽어버리', '자해', '살기싫', '사라지고싶', '괴롭혀', '괴롭힘당', '왕따당', '학대', '때려서아파', '맞아서아파', '맞고있어', '집에가기싫', '아무도없어'];

// 강한 비속어 → 경고 + 누적 (3회면 이번 대화 잠금)
const PROFANITY_STRONG = ['시발', '씨발', '씨바', 'ㅅㅂ', 'ㅆㅂ', '병신', 'ㅂㅅ', '개새', '새끼', 'ㅅㄲ', '좆', '존나', 'ㅈㄴ', '지랄', 'ㅈㄹ', '엿먹', '죽을래', '닥쳐'];
// 가벼운 말 → 부드러운 안내만 (누적 없음, 판정은 그대로)
const PROFANITY_MILD = ['바보', '멍청', '미친', 'ㅁㅊ'];

const PII_RULES = [
  [/\d{6}\s*-\s*[1-4]\d{6}/g, '[주민번호]'],
  [/01[016789][\s.\-]?\d{3,4}[\s.\-]?\d{4}/g, '[전화번호]'],
  [/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g, '[이메일]'],
  [/[가-힣]{2,10}초등학교/g, '[학교]'],
  [/((?:내|제|우리\s*[가-힣]{1,4})\s*이름은)\s*[가-힣]{2,4}/g, '$1 [이름]'],
];

function maskPII(text) {
  let t = String(text || '');
  let found = false;
  for (const [re, rep] of PII_RULES) {
    const next = t.replace(re, rep);
    if (next !== t) found = true;
    t = next;
  }
  return { text: t, found };
}

const has = (norm, words) => (words || []).some(w => { const k = normalize(w); return k && norm.includes(k); });

// 1단계: 안전망 검사 — 판정보다 먼저. 우선순위: 위험 > 강한 비속어 > 개인정보 > 가벼운 말 > 이탈 후보
function screen(text, lesson) {
  const masked = maskPII(text);
  const norm = normalize(text);
  if (has(norm, DANGER)) return { kind: 'danger', masked: masked.text };
  if (has(norm, PROFANITY_STRONG)) return { kind: 'profanity', masked: masked.text };
  if (masked.found) return { kind: 'pii', masked: masked.text };
  if (has(norm, PROFANITY_MILD)) return { kind: 'mild', masked: masked.text };
  const vocab = (lesson && lesson.vocabulary) || [];
  if (norm.length >= 6 && !has(norm, vocab) && !has(norm, AVOID)) return { kind: 'offtopic-candidate', masked: masked.text };
  return { kind: 'ok', masked: masked.text };
}

// 2단계: 자유 응답 판정
//   match = { groups: {이름: [키워드...]}, correct: [[그룹...]...], partial: [[...]...], misconception: [...] }
//   순서: correct > misconception > partial > avoid > miss  ("몰라, 근데 켜면 붙고 끄면 떨어져" → correct)
function evaluateFree(text, match) {
  const norm = normalize(text);
  const hit = {};
  for (const [name, words] of Object.entries(match.groups || {})) hit[name] = has(norm, words);
  const matchedGroups = Object.keys(hit).filter(k => hit[k]);
  const combo = list => (list || []).some(c => c.length && c.every(g => hit[g]));
  if (combo(match.correct)) return { result: 'correct', matchedGroups };
  if (has(norm, match.misconception)) return { result: 'misconception', matchedGroups };
  if (combo(match.partial)) return { result: 'partial', matchedGroups };
  if (has(norm, AVOID)) return { result: 'avoid', matchedGroups };
  return { result: 'miss', matchedGroups };
}

// 빈칸 판정: 모든 빈칸 정답 → correct / 일부 → partial / 없음 → miss
function evaluateBlanks(answers, blanks) {
  const perBlank = {};
  let ok = 0;
  for (const b of blanks) {
    const a = normalize(answers && answers[b.id]);
    const good = a.length > 0 && b.accept.some(w => a.includes(normalize(w)));
    perBlank[b.id] = good;
    if (good) ok++;
  }
  return { result: ok === blanks.length ? 'correct' : ok > 0 ? 'partial' : 'miss', perBlank };
}

function fillTemplate(template, answers) {
  return String(template).replace(/\[([^\]]+)\]/g, (m, id) => (answers && answers[id]) ? answers[id] : '___');
}

module.exports = { cleanText, normalize, maskPII, screen, evaluateFree, evaluateBlanks, fillTemplate, AVOID, DANGER, PROFANITY_STRONG, PROFANITY_MILD };
