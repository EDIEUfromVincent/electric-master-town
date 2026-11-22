#!/usr/bin/env node
// ============================================================
//  가짜 GAS 웹앱 — 구글 시트를 연결하기 전에 게임 서버의 기록 흐름을 시험한다
//  · GameBridge.gs의 doPost(ping · log_events · get_feedback · ack_feedback · upsert_lessons)를 흉내 낸다
//  · 기록은 MOCK_DIR(기본 ./data/mock-gas)에 CSV로 쓴다: 게임로그.csv · 차시요약.json · 차시설정.json
//  · 시험용 추가 동작: {action:'mock_approve', lesson, classCode, playerKey, text} → 교사가 '승인'한 것처럼 편지를 만든다
//  · MOCK_AI=1 이면 tutor_turn에 '가짜 AI 튜터'가 답한다 (진짜 Gemini가 아님 · 화면과 기록 흐름 시험용)
//  실행: GAS_SHARED_SECRET=비밀 npm run dev:mock   (기본 주소 http://127.0.0.1:8790/exec)
//  게임 서버는 GAS_WEBAPP_URL=http://127.0.0.1:8790/exec 로 켠다
// ============================================================
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = +process.env.MOCK_PORT || 8790;
const SECRET = process.env.GAS_SHARED_SECRET || '';
const DIR = path.resolve(process.env.MOCK_DIR || path.join(__dirname, '..', 'data', 'mock-gas'));
fs.mkdirSync(DIR, { recursive: true });
if (SECRET.length < 20) { console.error('GAS_SHARED_SECRET(20자 이상)을 넣고 실행하세요.'); process.exit(1); }

const LOG = path.join(DIR, '게임로그.csv'), SUM = path.join(DIR, '차시요약.json'), LES = path.join(DIR, '차시설정.json');
const HEAD = ['서버수신시각', '차시', '반코드', '번호', '플레이어키', '세션ID', 'NPC', '노드ID', '단계', '태그', 'NPC발화', '학생응답', '판정', '힌트단계', '플래그', '클라이언트시각', '이벤트ID'];
if (!fs.existsSync(LOG)) fs.writeFileSync(LOG, '﻿' + HEAD.join(',') + '\n');
const seen = new Set();
try { for (const line of fs.readFileSync(LOG, 'utf8').split('\n').slice(1)) { const id = line.split(',').pop(); if (id) seen.add(id.replace(/"/g, '')); } } catch (e) {}
const readJ = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } };
const writeJ = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2));
const cell = v => { let s = String(v == null ? '' : v); if (/^[=+\-@]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const TAGS = ['', 'reflection', 'blank', 'feedback-reply', 'session-start', 'session-end', 'quest-complete', 'lesson-complete'];
const RESULTS = ['correct', 'partial', 'miss', 'misconception', 'avoid', 'offtopic', 'blocked', 'info', 'skip'];
const FLAGS = ['이탈', '욕설', '욕설-3회', '개인정보', '위험', '지원필요', '중단'];
let stats = { calls: 0, written: 0, dup: 0, skipped: 0 };

function valid(ev) {
  if (!ev || !/^[A-Za-z0-9-]{8,64}$/.test(String(ev.eventId || ''))) return null;
  if (!/^[A-Za-z0-9-]{1,20}$/.test(String(ev.classCode || ''))) return null;
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(String(ev.playerKey || ''))) return null;
  if (!TAGS.includes(ev.tag || '')) ev.tag = '';
  if (!RESULTS.includes(ev.result)) ev.result = 'info';
  ev.flags = (ev.flags || []).filter(f => FLAGS.includes(f));
  return ev;
}
/* 가짜 AI 튜터: 지금 상황(시스템 지시문 끝부분)과 학생 말만 보고 규칙대로 답한다 */
function fakeTutor(b) {
  const sys = String(b.system || ''), last = (b.contents || []).slice(-1)[0], said = String(last && last.parts && last.parts[0].text || '').replace(/<\/?student_message>/g, '').trim();
  const now = (sys.match(/지금 질문의 단계 (\w), 확인점 (\w+), 힌트 단계 (\d)/) || []).slice(1);
  const [stage, cp, hint] = [now[0] || 'S', now[1] || 'S1', +(now[2] || 0)];
  const ids = [...sys.matchAll(/^- (\w+): /gm)].map(m => m[1]).filter(x => !/^[SER]\d$/.test(x));
  const cps = [...sys.matchAll(/^- ([SER]\d) (.+?): (.+)$/gm)].map(m => ({ id: m[1], label: m[2], st: m[3] }));
  const sp = ids[0] || 'volt', sp2 = ids[1] || sp;
  const avoid = /몰라|모르|알려줘|대신/.test(said), wasIf = /만약/.test(String((b.contents || []).slice(-2)[0]?.parts?.[0]?.text || ''));
  const base = { cp, nextCp: cp, concept: (cps.find(c => c.id === cp) || {}).label || cp, choices: [], blankTemplate: '', flag: '없음', done: false, praise: '', nextQuestion: '' };
  if (avoid) {
    if (hint >= 2) return { ...base, speaker: sp, reply: '괜찮아, 두 생각 가운데 실험 결과와 더 맞는 쪽을 골라 볼래?', judge: { result: 'avoid' }, boardNote: '', stage, hintLevel: 3, choices: ['늘 같다', '상황에 따라 달라진다'] };
    return { ...base, speaker: sp2, reply: `괜찮아, 같이 천천히 떠올려 보자. 게임에서 본 장면을 하나만 떠올리면 어떤 모습이었어? (힌트 ${hint + 1}단계)`, judge: { result: 'avoid' }, boardNote: '', stage, hintLevel: hint + 1 };
  }
  if (stage === 'R') return { ...base, speaker: sp, cp: 'R1', nextCp: 'R1', concept: '오늘의 한 문장', reply: `「${said}」 멋진 문장이에요! 칠판에 남기고 선생님께도 전해 둘게요.`, judge: { result: 'correct' }, boardNote: said.slice(0, 40), stage: 'R', hintLevel: 0, done: true, praise: '핵심 개념을 네 말로 한 문장에 담았어요.', nextQuestion: '오늘 배운 것을 집에서 어디에 써 볼 수 있을까요?' };
  if (!wasIf) return { ...base, nextCp: cp, speaker: sp, reply: '좋아, 네 말로 잘 설명했어! 그럼 만약 그 조건이 반대로 바뀌면 어떻게 될까?', judge: { result: 'correct' }, boardNote: said.slice(0, 40), stage, hintLevel: 0 };
  const next = cps.find(c => c.st.startsWith('아직') && c.id !== cp && c.id !== 'R1');
  if (next) return { ...base, speaker: sp2, reply: `만약 질문까지 해냈어! 이번엔 「${next.label}」 이야기를 해 보자. 게임에서 무엇을 보았는지 말해 줄래?`, judge: { result: 'correct' }, boardNote: said.slice(0, 40), stage: next.id[0], hintLevel: 0, cp, nextCp: next.id };
  return { ...base, nextCp: 'R1', speaker: sp, reply: '이제 칠판에 남길 한 문장을 써 볼까? 오늘 알게 된 것을 한 문장으로 말해 줄래?', judge: { result: 'correct' }, boardNote: said.slice(0, 40), stage: 'R', hintLevel: 0 };
}
function handle(b) {
  stats.calls++;
  if (b.secret !== SECRET) return { ok: false, error: 'unauthorized' };
  switch (b.action) {
    case 'ping': return { ok: true, time: new Date().toISOString(), mock: true, ai: !!process.env.MOCK_AI };
    case 'tutor_turn': return process.env.MOCK_AI ? { ok: true, text: JSON.stringify(fakeTutor(b)) } : { ok: false, error: 'no_key' };
    case 'log_events': {
      if (!Array.isArray(b.events)) return { ok: false, error: 'events_not_array' };
      if (b.events.length > 200) return { ok: false, error: 'too_many_events' };
      const rows = [], accepted = [], dup = [];
      let skipped = 0;
      for (const raw of b.events) {
        const ev = valid(raw); if (!ev) { skipped++; continue; }
        if (seen.has(ev.eventId)) { dup.push(ev.eventId); continue; }
        seen.add(ev.eventId); accepted.push(ev.eventId);
        rows.push([new Date().toISOString(), ev.lesson, ev.classCode, ev.studentNo, ev.playerKey, ev.sessionId, ev.npc, ev.nodeId, ev.stage, ev.tag, ev.npcText, ev.studentText, ev.result, ev.hintLevel, ev.flags.join(', '), ev.clientTime, ev.eventId].map(cell).join(','));
        if (ev.flags.includes('위험')) console.log(`[mock-gas] ⚠️ 위험 신호 알림 메일(가짜): ${ev.lesson} ${ev.classCode}반 ${ev.studentNo}번`);
      }
      if (rows.length) fs.appendFileSync(LOG, rows.join('\n') + '\n');
      stats.written += rows.length; stats.dup += dup.length; stats.skipped += skipped;
      return { ok: true, written: rows.length, skipped, acceptedIds: accepted, duplicateIds: dup };
    }
    case 'get_feedback': {
      const items = readJ(SUM, []).filter(r => r.classCode === b.classCode && (!b.playerKey || r.playerKey === b.playerKey) && r.approved && !r.deliveredAt && (r.teacherText || r.aiText))
        .map(r => ({ lesson: r.lesson, classCode: r.classCode, playerKey: r.playerKey, text: r.teacherText || r.aiText, editedByTeacher: !!r.teacherText, aiAssisted: true }));
      return { ok: true, items };
    }
    case 'ack_feedback': {
      const all = readJ(SUM, []), r = all.find(x => x.lesson === b.lesson && x.classCode === b.classCode && x.playerKey === b.playerKey);
      if (!r) return { ok: false, error: 'not_found' };
      r.deliveredAt = new Date().toISOString(); if (b.reply) r.reply = String(b.reply).slice(0, 500);
      writeJ(SUM, all); return { ok: true };
    }
    case 'upsert_lessons': {
      if (!Array.isArray(b.lessons) || !b.lessons.length) return { ok: false, error: 'bad_lessons' };
      const all = readJ(LES, {}); for (const l of b.lessons) all[l.lessonId] = { title: l.title, standards: l.standards, concepts: l.concepts, rubric: l.rubric, at: new Date().toISOString() };
      writeJ(LES, all); return { ok: true, updated: b.lessons.length };
    }
    case 'mock_approve': {
      const all = readJ(SUM, []);
      let r = all.find(x => x.lesson === b.lesson && x.classCode === b.classCode && x.playerKey === b.playerKey);
      if (!r) { r = { lesson: b.lesson, classCode: b.classCode, playerKey: b.playerKey }; all.push(r); }
      Object.assign(r, { aiText: String(b.text || ''), teacherText: '', approved: true, deliveredAt: '' });
      writeJ(SUM, all); return { ok: true };
    }
    case 'mock_stats': return { ok: true, stats, rows: seen.size };
    default: return { ok: false, error: 'unknown_action' };
  }
}
http.createServer((req, res) => {
  if (req.method !== 'POST') { res.writeHead(405); return res.end(); }
  let n = 0; const chunks = [];
  req.on('data', c => { n += c.length; if (n < 2e6) chunks.push(c); });
  req.on('end', () => {
    let out; try { out = handle(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { out = { ok: false, error: 'bad_json' }; }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(out));
  });
}).listen(PORT, '127.0.0.1', () => console.log(`[mock-gas] http://127.0.0.1:${PORT}/exec · 기록 폴더 ${DIR}`));
