// ============================================================
//  lad/index.js — 정리 회의 · 기록 · 선생님 편지 API (server.js가 부른다)
//  ------------------------------------------------------------
//  POST /api/lad/status      내 반·번호, 시트 연결 여부, 쓸 수 있는 차시
//  POST /api/lad/class       반 코드 + 번호 저장 (이름 대신 시트에 남는 것)
//  POST /api/reflect/start   정리 회의 시작(또는 이어 하기)
//  POST /api/reflect/turn    학생 답 한 번
//  POST /api/events          게임 이벤트(차시 첫 진입 · 활동 완료) 묶음
//  POST /api/feedback/get    선생님이 승인한 편지
//  POST /api/feedback/ack    편지 받음 + 답장
//  · 모든 요청은 로그인 표(token)로 확인하고, 반·번호·플레이어키는 서버가 정한다 (브라우저 값은 믿지 않는다)
//  · 시트에는 이름을 보내지 않는다. 반코드·번호·플레이어키(이름에서 만든 되돌릴 수 없는 열쇠)만 보낸다
// ============================================================
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { ReflectEngine, loadLessons } = require('./engine');
const { SheetRelay } = require('./relay');
const R = require('./rules');

const flag = (v, def) => v == null || v === '' ? def : !/^(0|false|no|off)$/i.test(String(v).trim());
const CLASS_RE = /^[A-Za-z0-9-]{1,20}$/, ID_RE = /^[A-Za-z0-9-]{8,64}$/, NODE_RE = /^[A-Za-z0-9_-]{1,60}$/;
const CLIENT_TAGS = ['session-start', 'session-end', 'quest-complete'];

function createLad({ ROOT, DATA_DIR, SECRET, env = process.env, readStu, writeStu, idFromToken, send, logger = console }) {
  const cfg = {
    reflect: flag(env.NPC_REFLECTION_ENABLED, true),
    letters: flag(env.FEEDBACK_LETTER_ENABLED, true),
    aiLabel: flag(env.SHOW_AI_LABEL, true),
    classCodes: String(env.CLASS_CODES || '').split(',').map(s => s.trim()).filter(s => CLASS_RE.test(s)),
  };
  const PK_SALT = env.PLAYER_KEY_SALT || ('pk-salt:' + SECRET);
  const playerKey = id => crypto.createHmac('sha256', PK_SALT).update('pk:' + id).digest('base64url').slice(0, 16);
  const lessonsDir = path.join(ROOT, 'lessons');
  const lessons = loadLessons(lessonsDir, fs, path, logger);
  let npcMail = {};
  try { npcMail = JSON.parse(fs.readFileSync(path.join(lessonsDir, '_feedback-npc.json'), 'utf8')); } catch (e) {}
  const relay = new SheetRelay({ url: env.GAS_WEBAPP_URL, secret: env.GAS_SHARED_SECRET, dir: path.join(DATA_DIR, 'lad'), logger });
  const engine = new ReflectEngine({ lessons, emit: ev => relay.enqueue(ev) });
  relay.start();
  if (relay.enabled) {
    const meta = Object.values(lessons).map(L => ({ lessonId: L.lessonId, title: L.title, standards: L.standards, concepts: L.concepts, rubric: L.rubric }));
    relay.upsertLessons(meta).then(r => logger.log(`[lad] 구글 시트 연결: 차시 설정 ${r.ok ? '동기화됨' : '실패(' + r.error + ')'}`)).catch(() => {});
  }
  logger.log(`[lad] 정리 회의 대본 ${Object.keys(lessons).length}개 · 구글 시트 ${relay.enabled ? '연결됨' : '아직 연결 안 함 (기록은 대기열에 모아 둠)'} · 대기 ${relay.buffer.length}건`);

  /* 학생별 분당 요청 수 제한 */
  const HITS = new Map();
  const tooMany = (key, max) => {
    const now = Date.now(), arr = (HITS.get(key) || []).filter(t => now - t < 60000); arr.push(now); HITS.set(key, arr);
    if (HITS.size > 5000) HITS.clear();
    return arr.length > max;
  };
  const seenIds = new Set();
  const remember = id => { seenIds.add(id); if (seenIds.size > 20000) { const it = seenIds.values(); for (let i = 0; i < 5000; i++) seenIds.delete(it.next().value); } };

  function who(body) {
    const id = idFromToken(body.token); if (!id) return null;
    const s = readStu(id); if (!s) return null;
    const cls = s.cls || null, sid = typeof body.sessionId === 'string' && ID_RE.test(body.sessionId) ? body.sessionId : '';
    return { id, s, player: { id, playerKey: playerKey(id), classCode: cls ? cls.code : 'NOCLASS', studentNo: cls ? cls.no : '', sessionId: sid } };
  }
  const ladOf = s => { if (!s.lad || typeof s.lad !== 'object') s.lad = {}; s.lad.reflect = s.lad.reflect || {}; s.lad.letters = s.lad.letters || {}; return s.lad; };

  async function handle(req, res, p, body) {
    if (!p.startsWith('/api/lad/') && !p.startsWith('/api/reflect/') && p !== '/api/events' && !p.startsWith('/api/feedback/')) return false;
    const W = who(body);
    if (!W) { send(res, 401, { error: '다시 로그인해요' }); return true; }
    const { id, s, player } = W;

    if (p === '/api/lad/status') {
      const L = ladOf(s);
      send(res, 200, {
        reflect: cfg.reflect, letters: cfg.letters && relay.enabled, gas: relay.enabled, cls: s.cls || null,
        fixedClass: cfg.classCodes.length === 1 ? cfg.classCodes[0] : null, lessons: Object.keys(lessons),
        reflected: Object.fromEntries(Object.entries(L.reflect).map(([k, v]) => [k, { at: v.at, sentence: v.sentence }])),
      });
      return true;
    }
    if (p === '/api/lad/class') {
      const code = R.cleanText(body.classCode, 20).replace(/\s/g, ''), no = Number(body.no);
      if (!CLASS_RE.test(code)) { send(res, 400, { error: '반 코드는 숫자·영어로 적어요 (예: 6301)' }); return true; }
      if (cfg.classCodes.length && !cfg.classCodes.includes(code)) { send(res, 400, { error: '선생님이 알려 준 반 코드가 아니에요. 다시 확인해요.' }); return true; }
      if (!Number.isInteger(no) || no < 1 || no > 60) { send(res, 400, { error: '번호는 1~60 사이 숫자예요' }); return true; }
      s.cls = { code, no, at: Date.now() }; writeStu(id, s);
      send(res, 200, { ok: true, cls: s.cls });
      return true;
    }
    if (p === '/api/reflect/start') {
      if (!cfg.reflect) { send(res, 409, { error: 'off' }); return true; }
      if (tooMany('rs:' + id, 20)) { send(res, 429, { error: '잠시 뒤에 다시 해요' }); return true; }
      const r = engine.start(player, String(body.lessonId || ''), body.resume);
      if (r.error) { send(res, 404, { error: '정리 회의 대본이 없어요' }); return true; }
      send(res, 200, r);
      return true;
    }
    if (p === '/api/reflect/turn') {
      if (tooMany('rt:' + id, 40)) { send(res, 429, { error: '천천히 생각하고 답해요' }); return true; }
      let r;
      try { r = engine.turn(player, body.dialogueId, body.input || {}); }
      catch (e) { logger.error('[lad] 대화 처리 오류: ' + e.message); send(res, 500, { error: '잠시 문제가 생겼어요' }); return true; }
      if (r.error) { send(res, r.error === 'no_dialogue' ? 410 : 400, { error: r.error }); return true; }
      if (r.done && r.summary) {   /* 학생 기록에도 칠판 정리를 남긴다 (여러 기기에서 이어 보기) */
        const L = ladOf(s), sm = r.summary;
        L.reflect[sm.lessonId] = { at: Date.now(), sentence: sm.sentence, stage: sm.stage, praise: sm.praise, question: sm.question, checkpoints: sm.checkpoints.map(c => ({ key: c.key, status: c.status })) };
        writeStu(id, s);
        r.summary.sent = relay.enabled;
      }
      send(res, 200, r);
      return true;
    }
    if (p === '/api/events') {
      const list = Array.isArray(body.events) ? body.events.slice(0, 40) : [];
      const accepted = [];
      for (const e of list) {
        if (!e || !ID_RE.test(String(e.eventId || ''))) continue;
        if (seenIds.has(e.eventId)) { accepted.push(e.eventId); continue; }
        if (tooMany('ev:' + id, 60)) break;
        const tag = CLIENT_TAGS.includes(e.tag) ? e.tag : null, lesson = String(e.lesson || '');
        if (!tag || !/^L\d{1,3}$/.test(lesson)) { accepted.push(e.eventId); continue; }   // 모르는 것은 받았다고만 하고 버린다
        relay.enqueue({
          eventId: e.eventId, clientTime: R.cleanText(e.clientTime, 40), lesson, classCode: player.classCode, studentNo: player.studentNo,
          playerKey: player.playerKey, sessionId: player.sessionId, npc: '', nodeId: NODE_RE.test(String(e.nodeId || '')) ? e.nodeId : '',
          stage: '', tag, npcText: '', studentText: '', result: 'info', hintLevel: 0, flags: [],
        });
        remember(e.eventId); accepted.push(e.eventId);
      }
      send(res, 200, { accepted });
      return true;
    }
    if (p === '/api/feedback/get') {
      if (!cfg.letters || !relay.enabled || !s.cls) { send(res, 200, { letters: [] }); return true; }
      if (tooMany('fg:' + id, 10)) { send(res, 200, { letters: [] }); return true; }
      let items = null;
      try { items = await relay.getFeedback(player.classCode, player.playerKey); } catch (e) {}
      const L = ladOf(s);
      const letters = (items || []).filter(it => !(L.letters[it.lesson] && L.letters[it.lesson].acked))
        .map(it => ({ lesson: String(it.lesson).slice(0, 20), text: R.maskPII(R.cleanText(it.text, 500)).text, ai: !!it.aiAssisted && cfg.aiLabel }));
      send(res, 200, { letters, npc: npcMail.npc || { name: '마을 우체부' }, lines: npcMail.lines || {} });
      return true;
    }
    if (p === '/api/feedback/ack') {
      const lesson = R.cleanText(body.lesson, 20);
      if (!/^L\d{1,3}$/.test(lesson)) { send(res, 400, { error: 'bad_lesson' }); return true; }
      let reply = R.cleanText(body.reply, 200), flags = [];
      if (reply) {
        const sc = R.screen(reply, null);
        if (sc.kind === 'danger') flags.push('위험');
        if (sc.kind === 'profanity') { send(res, 400, { error: '바른 말로 다시 답장해 줄래요?' }); return true; }
        if (sc.kind === 'pii') flags.push('개인정보');
        reply = sc.masked;
      }
      const L = ladOf(s);
      L.letters[lesson] = Object.assign(L.letters[lesson] || {}, { acked: Date.now(), reply });
      writeStu(id, s);
      relay.enqueue({
        eventId: crypto.randomUUID(), clientTime: new Date().toISOString(), lesson, classCode: player.classCode, studentNo: player.studentNo,
        playerKey: player.playerKey, sessionId: player.sessionId, npc: 'mailbox', nodeId: 'letter', stage: '', tag: 'feedback-reply',
        npcText: String((npcMail.lines || {}).ask || '').slice(0, 500), studentText: reply, result: reply ? 'info' : 'skip', hintLevel: 0, flags,
      });
      relay.ackFeedback(lesson, player.classCode, player.playerKey, reply).catch(() => {});
      send(res, 200, { ok: true, flagged: flags.includes('위험') });
      return true;
    }
    send(res, 404, { error: '없는 주소' });
    return true;
  }

  return { handle, relay, engine, lessons, cfg, playerKey, shutdown: () => relay.shutdown() };
}

module.exports = { createLad };
