#!/usr/bin/env node
// ============================================================
//  가짜 GAS 웹앱 — 구글 시트를 연결하기 전에 게임 서버의 기록 흐름을 시험한다
//  · GameBridge.gs의 doPost(ping · log_events · get_feedback · ack_feedback · upsert_lessons)를 흉내 낸다
//  · 기록은 MOCK_DIR(기본 ./data/mock-gas)에 CSV로 쓴다: 게임로그.csv · 차시요약.json · 차시설정.json
//  · 시험용 추가 동작: {action:'mock_approve', lesson, classCode, playerKey, text} → 교사가 '승인'한 것처럼 편지를 만든다
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
function handle(b) {
  stats.calls++;
  if (b.secret !== SECRET) return { ok: false, error: 'unauthorized' };
  switch (b.action) {
    case 'ping': return { ok: true, time: new Date().toISOString(), mock: true };
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
