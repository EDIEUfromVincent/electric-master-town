#!/usr/bin/env node
// ============================================================
//  구글 시트(GAS) 연결 확인 — 게임 서버와 같은 환경 변수로 실행한다
//    npm run gas:ping   → 비밀키가 맞는지, 웹앱이 응답하는지
//    npm run gas:smoke  → 반코드 TEST로 시험 기록 3건을 보내 [게임로그] 탭에 찍히는지
//  필요한 환경 변수: GAS_WEBAPP_URL, GAS_SHARED_SECRET
//  (Railway에서는 서비스 Shell에서 실행하거나, 이 두 값을 넣고 내 컴퓨터에서 실행)
// ============================================================
'use strict';
const crypto = require('crypto');
const { SheetRelay } = require('../lad/relay');
const mode = process.argv[2] || 'ping';
const url = process.env.GAS_WEBAPP_URL, secret = process.env.GAS_SHARED_SECRET;
if (!url || !secret) { console.log('❌ GAS_WEBAPP_URL과 GAS_SHARED_SECRET 환경 변수를 넣고 실행하세요.'); process.exit(1); }
const relay = new SheetRelay({ url, secret, logger: { warn() {}, log() {} } });
const explain = e => ({ unauthorized: '비밀 문자열이 달라요. 스크립트 속성 GAME_SHARED_SECRET과 Railway의 GAS_SHARED_SECRET이 똑같은지 확인하세요.',
  network_TimeoutError: '30초 안에 응답이 없어요. 웹앱 주소(/exec로 끝나는지)를 확인하세요.',
  non_json_200: '웹앱이 JSON이 아닌 화면을 돌려줬어요. 배포의 "액세스 권한"이 "모든 사용자"인지, 새 버전으로 배포했는지 확인하세요.' }[e] || e);
(async () => {
  const p = await relay.ping();
  if (!p.ok) { console.log('❌ 연결 실패: ' + explain(p.error)); process.exit(1); }
  console.log('✅ GAS 웹앱 응답: ' + p.time + (p.mock ? ' (가짜 GAS)' : ''));
  if (mode !== 'smoke') return;
  const now = new Date().toISOString(), base = { lesson: 'L1', classCode: 'TEST', studentNo: 1, playerKey: 'smoketest0001', sessionId: 'smoke-' + Date.now(), npc: 'volt', stage: 'S', hintLevel: 0, flags: [] };
  const events = [
    { ...base, eventId: crypto.randomUUID(), clientTime: now, nodeId: 'z1', tag: 'session-start', npcText: '', studentText: '', result: 'info', stage: '' },
    { ...base, eventId: crypto.randomUUID(), clientTime: now, nodeId: 'S1', tag: '', npcText: '연결 시험 질문', studentText: '연결 시험 답', result: 'correct' },
    { ...base, eventId: crypto.randomUUID(), clientTime: now, nodeId: 'Rend', tag: 'lesson-complete', npcText: '연결 시험 끝', studentText: '', result: 'info', stage: 'R' },
  ];
  const r = await relay.call('log_events', { events });
  if (!r.ok) { console.log('❌ 기록 실패: ' + explain(r.error)); process.exit(1); }
  console.log(`✅ 시험 기록 ${r.written}건을 보냈어요. 시트의 [게임로그] 탭에서 반코드 TEST 줄을 확인하고, 확인했으면 그 줄들은 지워도 돼요.`);
})();
