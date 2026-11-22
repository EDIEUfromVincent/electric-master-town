// 정리 회의 규칙 엔진 테스트 — 실행: npm test  (Node 18+ 내장 test 러너, 설치할 것 없음)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const R = require('../lad/rules');
const { ReflectEngine, loadLessons } = require('../lad/engine');

const LESSONS = loadLessons(path.join(__dirname, '..', 'lessons'), fs, path, { warn() {} });
const L1 = LESSONS.L1, L2 = LESSONS.L2, L3 = LESSONS.L3;
const player = (n = 1) => ({ id: 'n:test' + n, playerKey: 'pk_test_' + n + 'xxxxxxxx', classCode: 'TEST', studentNo: n, sessionId: 'sess-0000-' + n });
function mk() { const events = []; const e = new ReflectEngine({ lessons: LESSONS, emit: ev => events.push(ev) }); return { e, events }; }

/* ---------- 1. 안전망 (screen) ---------- */
test('전기 안전 답은 위험 신호로 걸리지 않는다', () => {
  for (const t of ['감전되면 다칠 수 있어', '죽을 수도 있어', '불이 날 수 있어', '화재가 나서 사람이 죽을 수도 있어요', '불이 꺼져요', '전등이 꺼져서 어두워']) {
    const k = R.screen(t, L3).kind;
    assert.ok(k !== 'danger' && k !== 'profanity', `${t} → ${k}`);
  }
});
test('위험 신호 · 비속어 · 개인정보를 가려낸다', () => {
  assert.equal(R.screen('요즘 너무 죽고 싶어', L3).kind, 'danger');
  assert.equal(R.screen('친구들한테 괴롭힘당해서 힘들어', L3).kind, 'danger');
  assert.equal(R.screen('시발 몰라', L1).kind, 'profanity');
  assert.equal(R.screen('ㅅㅂ', L1).kind, 'profanity');
  assert.equal(R.screen('내 번호는 010-1234-5678이야', L1).kind, 'pii');
  assert.equal(R.screen('행복초등학교 다녀요', L1).kind, 'pii');
  assert.equal(R.screen('내 이름은 김철수야', L1).kind, 'pii');
  assert.equal(R.screen('바보 같은 질문이네 붙어요', L1).kind, 'mild');
  assert.equal(R.screen('어제 축구를 했는데 재밌었다', L1).kind, 'offtopic-candidate');
});
test('개인정보는 가린 글만 남는다', () => {
  const m = R.maskPII('연락은 010 1234 5678, 메일 abc@test.com');
  assert.ok(m.found); assert.ok(!/1234/.test(m.text)); assert.ok(m.text.includes('[이메일]'));
});
test('제어문자·방향 전환 문자를 지운다', () => {
  assert.equal(R.cleanText('붙​어‮요'), '붙어요');
});

/* ---------- 2. 자유 응답 판정 (evaluateFree) ---------- */
const cases = [
  [L1, 'S1', '켜면 클립이 붙고 끄면 떨어져요', 'correct'],
  [L1, 'S1', '몰라 근데 켜면 붙고 끄면 떨어져', 'correct'],
  [L1, 'S1', '스위치 켜니까 클립이 붙었어', 'partial'],
  [L1, 'S1', '끄니까 다 떨어졌어요', 'partial'],
  [L1, 'S1', '항상 붙어 있어요', 'misconception'],
  [L1, 'S1', '몰라요', 'avoid'],
  [L1, 'S1', '음 잘 기억이 안 나', 'miss'],
  [L1, 'E1', '스피커는 전자석 세기를 바꿔서 소리를 내요', 'correct'],
  [L1, 'E1', '선풍기요', 'partial'],
  [L1, 'E1', '세기를 조절해요', 'partial'],
  [L1, 'E2', '전지를 더 많이 연결하면 돼요', 'correct'],
  [L1, 'E2', '에나멜선을 더 감아요', 'correct'],
  [L1, 'E2', '전지요', 'partial'],
  [L1, 'E3', '바늘이 반대로 돌아갔어요', 'correct'],
  [L1, 'E3', '극이 바뀌어요', 'correct'],
  [L1, 'E3', '안 바뀌어요', 'misconception'],
  [L1, 'E3', '나침반 바늘이요', 'partial'],
  [L1, 'R1', '전자석은 전기가 흐를 때만 자석이 되고 전지를 더 연결하면 세기가 세져요', 'correct'],
  [L1, 'R1', '전자석은 켜면 자석이 돼요', 'partial'],
  [L1, 'R1', '전지 방향을 바꾸면 극이 바뀌고 전지를 많이 연결하면 세게 돼요', 'correct'],
  [L2, 'S1', '철로 만들었는지 봐야 해요', 'correct'],
  [L2, 'S1', '색깔이요', 'misconception'],
  [L2, 'S1', '번쩍이는지요', 'misconception'],
  [L2, 'S1', '색은 상관없고 전자석에 붙는지 봐요', 'correct'],
  [L2, 'E1', '철로 만들었나요를 먼저 물어야 해요 은색이어도 알루미늄 캔은 안 붙으니까', 'correct'],
  [L2, 'E1', '철로 만들었나요', 'partial'],
  [L2, 'E2', '틀린 고철을 보고 질문을 고쳐서 다시 시험해요', 'correct'],
  [L2, 'E2', '고쳐요', 'partial'],
  [L2, 'E2', '그대로 믿어요', 'misconception'],
  [L2, 'E3', '전자석이 들어 있어요', 'correct'],
  [L2, 'E3', '모터요', 'partial'],
  [L2, 'E3', '엔진', 'misconception'],
  [L2, 'R1', '재료를 묻는 질문이 좋고 AI가 틀리면 고쳐서 다시 시험해요', 'correct'],
  [L3, 'S1', '젖은 손으로 플러그를 만지면 감전될 수 있어요', 'correct'],
  [L3, 'S1', '문어발 멀티탭은 불이 날 수 있어서 위험해', 'correct'],
  [L3, 'S1', '멀티탭', 'partial'],
  [L3, 'E1', '안 쓰는 플러그는 뽑아요', 'correct'],
  [L3, 'E1', '계속 켜 둬요', 'misconception'],
  [L3, 'E2', '정답과 같은 예시 문장을 더 골라서 다시 가르쳤어요', 'correct'],
  [L3, 'E2', '로봇 탓이에요', 'misconception'],
  [L3, 'E3', '사람이 다칠 수 있으니까 사람이 마지막에 확인해야 해요', 'correct'],
  [L3, 'E3', '감전될 수 있어요', 'partial'],
  [L3, 'R1', '쓰지 않는 플러그를 뽑을 거야 전기를 절약하기 위해서', 'correct'],
  [L3, 'R1', '젖은 손으로 만지지 않을래요', 'partial'],
];
for (const [L, node, text, want] of cases) {
  test(`${L.lessonId} ${node}: "${text}" → ${want}`, () => {
    assert.equal(R.evaluateFree(text, L.nodes[node].match).result, want);
  });
}
test('빈칸 판정', () => {
  const b = L1.nodes.R1blank.blanks;
  assert.equal(R.evaluateBlanks({ '①': '자석', '②': '세기', '③': '극' }, b).result, 'correct');
  assert.equal(R.evaluateBlanks({ '①': '자석', '②': '몰라', '③': '' }, b).result, 'partial');
  assert.equal(R.evaluateBlanks({}, b).result, 'miss');
});

/* ---------- 3. 대화 시나리오 ---------- */
const NO_KEYS = r => {
  const s = JSON.stringify(r), v = JSON.stringify(r.view || {});
  for (const k of ['"match"', '"accept"', '"on"', '"groups"', 'matchRef', '"flagsOn"']) assert.ok(!s.includes(k), '응답에 정답 키가 들어 있음: ' + k);
  for (const k of ['"result"', '"next"']) assert.ok(!v.includes(k), '질문 화면에 선택지 정답이 들어 있음: ' + k);
};
function talk(e, p, lessonId, answers) {
  let r = e.start(p, lessonId); NO_KEYS(r);
  const id = r.dialogueId, seen = [r.view && r.view.type];
  for (const a of answers) {
    if (r.done || r.locked) break;
    r = e.turn(p, id, a); NO_KEYS(r); seen.push(r.view && r.view.type);
  }
  return r;
}
test('1차시 정답 직행 → 칠판 정리 · 잘한 점 · 한 문장', () => {
  const { e, events } = mk();
  const r = talk(e, player(1), 'L1', [
    { text: '켜면 클립이 붙고 끄면 떨어져요' }, { text: '스피커는 전자석 세기를 바꿔서 소리를 내요' }, { text: '전지를 더 많이 연결해요' },
    { text: '바늘이 반대로 돌아갔어요' }, { text: '전자석은 전기가 흐를 때만 자석이 되고 전지를 더 연결하면 세기가 세져요' },
  ]);
  assert.ok(r.done); assert.equal(r.summary.stage, 'R');
  assert.ok(r.summary.checkpoints.every(c => c.status === 'self'));
  assert.ok(r.summary.sentence.includes('흐를 때만'));
  assert.equal(r.summary.praise, L1.checkpoints.R1.praise);
  assert.equal(r.summary.question, L1.nextAll);
  assert.ok(events.some(ev => ev.tag === 'lesson-complete'));
  assert.ok(events.some(ev => ev.tag === 'reflection'));
  assert.ok(events.every(ev => ev.classCode === 'TEST' && ev.playerKey && !JSON.stringify(ev).includes('n:test')), '이벤트에 계정 이름이 들어가면 안 됨');
});
test('1차시 전부 모름 → 힌트 사다리 → 지원필요 → 빈칸 문장', () => {
  const { e, events } = mk(), p = player(2);
  let r = e.start(p, 'L1'); const id = r.dialogueId; let guard = 0;
  while (!r.done && guard++ < 40) {
    const v = r.view;
    if (v.type === 'free') r = e.turn(p, id, { text: '몰라' });
    else if (v.type === 'choice') r = e.turn(p, id, { optionIndex: 0 });   // 첫 선택지는 늘 틀린 쪽
    else if (v.type === 'blank') r = e.turn(p, id, { blanks: { '①': '자석', '②': '세기', '③': '극' } });
    NO_KEYS(r);
  }
  assert.ok(r.done);
  assert.ok(r.summary.flags.includes('지원필요'));
  assert.ok(r.summary.checkpoints.filter(c => c.key !== 'R1').every(c => c.status === 'support'));
  assert.ok(r.summary.sentence.includes('자석'));
  assert.equal(r.summary.question, L1.checkpoints.S1.next);
  assert.ok(events.some(ev => ev.tag === 'blank'));
  assert.ok(events.some(ev => ev.result === 'avoid'));
});
test('빈칸에서 한 번 틀리면 맞은 칸을 알려 주고 다시 묻는다', () => {
  const { e } = mk(), p = player(3);
  let r = e.start(p, 'L2'); const id = r.dialogueId; let guard = 0;
  while (r.view.type !== 'blank' && guard++ < 40) r = r.view.type === 'free' ? e.turn(p, id, { text: '몰라' }) : e.turn(p, id, { optionIndex: 1 });
  r = e.turn(p, id, { blanks: { '①': '재료', '②': '몰라' } });
  assert.equal(r.view.type, 'blank'); assert.equal(r.blankOk['①'], true); assert.equal(r.blankOk['②'], false);
  r = e.turn(p, id, { blanks: { '①': '재료', '②': '고쳐서' } });
  assert.ok(r.done);
});
test('비속어 3번이면 정리 회의가 잠긴다', () => {
  const { e, events } = mk(), p = player(4);
  const r0 = e.start(p, 'L3'), id = r0.dialogueId;
  let r = e.turn(p, id, { text: '시발' }); assert.equal(r.locked, false); assert.equal(r.view.type, 'free');
  r = e.turn(p, id, { text: '존나 몰라' }); assert.equal(r.locked, false);
  r = e.turn(p, id, { text: '병신' }); assert.equal(r.locked, 'profanity');
  assert.ok(events.some(ev => ev.flags.includes('욕설-3회')));
  const again = e.start(p, 'L3'); assert.ok(again.locked && again.waitSec > 0);
});
test('위험 신호면 멈추고 위험 플래그를 남긴다', () => {
  const { e, events } = mk(), p = player(5);
  const r0 = e.start(p, 'L3');
  const r = e.turn(p, r0.dialogueId, { text: '사실 죽고 싶어' });
  assert.equal(r.locked, 'danger');
  assert.ok(r.messages[0].text.includes('선생님'));
  assert.ok(events.some(ev => ev.flags.includes('위험') && ev.result === 'blocked'));
});
test('개인정보는 다시 말하게 하고, 가린 글만 기록한다', () => {
  const { e, events } = mk(), p = player(6);
  const r0 = e.start(p, 'L1');
  const r = e.turn(p, r0.dialogueId, { text: '내 이름은 김민수고 010-2222-3333이야' });
  assert.equal(r.view.type, 'free'); assert.equal(r.view.cp, 'S1');
  const ev = events.find(x => x.flags.includes('개인정보'));
  assert.ok(ev && !ev.studentText.includes('2222') && !ev.studentText.includes('김민수'));
});
test('주제 이탈은 두 번까지 다시 묻고, 세 번째는 힌트로 넘어간다', () => {
  const { e } = mk(), p = player(7);
  const r0 = e.start(p, 'L2'), id = r0.dialogueId;
  let r = e.turn(p, id, { text: '오늘 점심 메뉴가 궁금해요' }); assert.equal(r.view.cp, 'S1'); assert.equal(r.view.hintLevel, 0);
  r = e.turn(p, id, { text: '어제 본 영화가 재밌었다' }); assert.equal(r.view.hintLevel, 0);
  r = e.turn(p, id, { text: '주말에 여행을 가고 싶다' }); assert.ok(r.view.hintLevel >= 1);
});
test('다른 학생의 대화는 이어 할 수 없다', () => {
  const { e } = mk();
  const r0 = e.start(player(8), 'L1');
  assert.equal(e.turn(player(9), r0.dialogueId, { text: '붙어요' }).error, 'no_dialogue');
});
test('이어 하기: 같은 대화를 다시 열면 지금 질문이 나온다', () => {
  const { e } = mk(), p = player(10);
  const r0 = e.start(p, 'L1');
  e.turn(p, r0.dialogueId, { text: '켜면 붙고 끄면 떨어져' });
  const r = e.start(p, 'L1', r0.dialogueId);
  assert.ok(r.resumed); assert.equal(r.view.cp, 'E1');
});
test('세 차시 모든 경로가 끝까지 간다 (정답 · 부분 · 선택지 정답)', () => {
  for (const L of [L1, L2, L3]) {
    const { e } = mk(), p = player(20);
    let r = e.start(p, L.lessonId); const id = r.dialogueId; let guard = 0;
    while (!r.done && guard++ < 40) {
      const v = r.view;
      if (v.type === 'free') r = e.turn(p, id, { text: '음' });
      else if (v.type === 'choice') r = e.turn(p, id, { optionIndex: 1 });
      else r = e.turn(p, id, { blanks: Object.fromEntries(L.nodes.R1blank.blanks.map(b => [b.id, b.accept[0]])) });
    }
    assert.ok(r.done, L.lessonId + ' 끝나지 않음');
    assert.ok(r.summary.checkpoints.every(c => c.status !== 'self'));
  }
});
test('두 번에 나눠 바르게 말하면 "힌트 보고"로 정리된다', () => {
  const { e } = mk(), p = player(30);
  const r0 = e.start(p, 'L1'), id = r0.dialogueId;
  e.turn(p, id, { text: '켜니까 붙었어요' });          // 부분 → S1p
  const r = e.turn(p, id, { text: '끄면 떨어져요' });   // 부분이지만 정답 쪽으로 받아 줌
  assert.equal(r.view.cp, 'E1');
  let s = r; const ans = ['스피커는 세기를 바꿔서 소리를 내요', '전지를 더 연결해요', '바늘이 반대로 돌아갔어요', '전자석은 전기가 흐를 때만 자석이 되고 전지를 더 연결하면 세기가 세져요'];
  for (const a of ans) s = e.turn(p, id, { text: a });
  assert.ok(s.done);
  assert.equal(s.summary.checkpoints.find(c => c.key === 'S1').status, 'hint');
});

/* ---------- 4. 시트 중계 (SheetRelay) ---------- */
const os = require('os');
const { SheetRelay } = require('../lad/relay');
const quiet = { warn() {}, log() {} };
const ev = n => ({ eventId: 'evt-0000-' + String(n).padStart(4, '0'), lesson: 'L1', classCode: 'TEST', playerKey: 'pk_test_xxxxxxxx', result: 'info', flags: [] });
test('연결 전: 기록을 대기열 파일에 모아 두고, 다시 켜면 그대로 읽는다', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lad-'));
  const r1 = new SheetRelay({ dir, logger: quiet });
  assert.equal(r1.enabled, false);
  r1.enqueue([ev(1), ev(2)]); await r1.shutdown();
  const r2 = new SheetRelay({ dir, logger: quiet });
  assert.equal(r2.buffer.length, 2);
  assert.equal((await r2.call('ping')).error, 'not_configured');
});
test('연결 뒤: 모아 둔 기록을 묶어 보내고, 실패하면 남겨 두었다가 다시 보낸다', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lad-'));
  new SheetRelay({ dir, logger: quiet }).enqueue([ev(1), ev(2), ev(3)]);
  await new Promise(r => setTimeout(r, 1700));   // 대기열 파일 저장 기다리기
  let fail = true; const got = [];
  const fetchImpl = async (url, o) => { const b = JSON.parse(o.body); if (fail) return { status: 500, text: async () => '<html>오류</html>' }; got.push(...b.events.map(e => e.eventId)); return { status: 200, text: async () => JSON.stringify({ ok: true, written: b.events.length }) }; };
  const r = new SheetRelay({ url: 'http://x/exec', secret: 's'.repeat(40), dir, logger: quiet, fetchImpl, options: { backoffMs: [0] } });
  assert.equal(r.buffer.length, 3);
  await r.flush(); assert.equal(r.buffer.length, 3, '실패하면 버리지 않는다');
  fail = false; r.nextAllowedAt = 0; await r.flush();
  assert.equal(r.buffer.length, 0); assert.deepEqual(got.sort(), [ev(1), ev(2), ev(3)].map(e => e.eventId));
  await r.shutdown();
});
