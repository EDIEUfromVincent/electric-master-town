#!/usr/bin/env node
// 차시 대본 JSON 검사기 (참조 구현) — 사용: node tools/lint-lessons.js data/lessons/*.json
// 검사: 노드 연결, 필수 분기, 3문장 제한, 예/아니오 유도질문, 종료 도달성
'use strict';
const fs = require('fs');

const TYPES = ['say', 'free', 'choice', 'blank', 'end'];
const STAGES = ['S', 'E', 'R', ''];
const FREE_KEYS = ['correct', 'partial', 'miss', 'avoid', 'misconception'];
const BLANK_KEYS = ['correct', 'partial', 'miss'];
const YESNO = /(맞지|맞아|맞니|그렇지|아니지|알겠지|있니|있었니|했니|봤니|나니|좋지|되지)\s*\?/;

function sentences(text) {
  return String(text || '')
    .replace(/'[^']*'|"[^"]*"/g, 'Q')          // 따옴표 안은 한 덩어리로
    .split(/[.!?]+(?:\s|$)/)
    .map(s => s.trim()).filter(Boolean).length;
}

function lint(file) {
  const errors = [], warns = [];
  let L;
  try { L = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return { errors: ['JSON 파싱 실패: ' + e.message], warns }; }
  if (!L.nodes) return { errors: ['nodes 없음 (대본 파일이 아니면 무시)'], warns, skip: true };
  const N = L.nodes;
  if (!N[L.start]) errors.push('start 노드 없음: ' + L.start);

  const edges = {};
  for (const [id, n] of Object.entries(N)) {
    const out = [];
    if (!TYPES.includes(n.type)) errors.push(`${id}: 알 수 없는 type ${n.type}`);
    if (!STAGES.includes(n.stage || '')) errors.push(`${id}: stage는 S/E/R/'' 중 하나`);
    if (n.hintLevel !== undefined && !(n.hintLevel >= 0 && n.hintLevel <= 3)) errors.push(`${id}: hintLevel 0~3`);
    const sc = sentences(n.say);
    if (sc > 3) errors.push(`${id}: ${sc}문장 (3문장 이내 규칙 위반)`);
    if (YESNO.test(n.say || '')) warns.push(`${id}: 예/아니오 유도질문 의심 → "${n.say}"`);

    if (n.type === 'say') { if (!N[n.next]) errors.push(`${id}: next 없음 ${n.next}`); else out.push(n.next); }
    if (n.type === 'free') {
      const src = n.match ? n : N[n.matchRef];
      if (!src || !src.match) errors.push(`${id}: match 또는 유효한 matchRef 필요`);
      else {
        const g = src.match.groups || {};
        [...(src.match.correct || []), ...(src.match.partial || [])].flat()
          .forEach(k => { if (!g[k]) errors.push(`${id}: match 조합에 없는 그룹 ${k}`); });
      }
      FREE_KEYS.forEach(k => { const t = n.on && n.on[k]; if (!N[t]) errors.push(`${id}: on.${k} 대상 없음 (${t})`); else out.push(t); });
    }
    if (n.type === 'choice') {
      if (!Array.isArray(n.options) || n.options.length < 2) errors.push(`${id}: 선택지 2개 이상 필요`);
      else {
        if (!n.options.some(o => o.result === 'correct')) errors.push(`${id}: correct 선택지 없음`);
        n.options.forEach((o, i) => { if (!N[o.next]) errors.push(`${id}: options[${i}].next 없음`); else out.push(o.next); });
      }
    }
    if (n.type === 'blank') {
      if (!n.template || !Array.isArray(n.blanks) || !n.blanks.length) errors.push(`${id}: template/blanks 필요`);
      else n.blanks.forEach(b => { if (!n.template.includes('[' + b.id + ']')) errors.push(`${id}: 템플릿에 [${b.id}] 없음`); });
      BLANK_KEYS.forEach(k => { const t = n.on && n.on[k]; if (!N[t]) errors.push(`${id}: on.${k} 대상 없음`); else out.push(t); });
    }
    edges[id] = out;
  }

  // 도달성: start에서 모든 노드에 닿는가 / 모든 노드에서 end에 닿는가
  const seen = new Set(); const stack = [L.start];
  while (stack.length) { const x = stack.pop(); if (!x || seen.has(x) || !N[x]) continue; seen.add(x); (edges[x] || []).forEach(y => stack.push(y)); }
  Object.keys(N).forEach(id => { if (!seen.has(id)) warns.push(`${id}: start에서 도달 불가`); });
  const canEnd = new Set(Object.keys(N).filter(id => N[id].type === 'end'));
  if (!canEnd.size) errors.push('end 노드 없음');
  let changed = true;
  while (changed) { changed = false; for (const id of Object.keys(N)) if (!canEnd.has(id) && (edges[id] || []).some(y => canEnd.has(y))) { canEnd.add(id); changed = true; } }
  Object.keys(N).forEach(id => { if (!canEnd.has(id)) errors.push(`${id}: 종료(end)에 도달하는 경로 없음`); });

  // 단계 순서: E 노드와 R 노드가 각각 하나 이상
  const st = new Set(Object.values(N).map(n => n.stage));
  ['S', 'E', 'R'].forEach(s => { if (!st.has(s)) warns.push(`${s} 단계 노드가 없음`); });
  return { errors, warns };
}

const files = process.argv.slice(2);
if (!files.length) { console.log('사용: node tools/lint-lessons.js <대본.json> ...'); process.exit(1); }
let fail = 0;
files.forEach(f => {
  const r = lint(f);
  if (r.skip) { console.log(`- ${f}: 대본 아님, 건너뜀`); return; }
  console.log(`${r.errors.length ? '✗' : '✓'} ${f}`);
  r.errors.forEach(e => console.log('   오류: ' + e));
  r.warns.forEach(w => console.log('   주의: ' + w));
  if (r.errors.length) fail++;
});
process.exit(fail ? 1 : 0);
