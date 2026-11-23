// ============================================================
//  lad/engine.js — 정리 회의 S-E-R 대화 엔진 (규칙 기반 RuleBrain)
//  ------------------------------------------------------------
//  · 차시 대본(lessons/L*.json)의 노드를 따라간다: say → free/choice/blank → … → end
//  · 한 턴: 안전망 검사 → 판정 → 다음 노드 → 이어지는 say 노드를 모아 보낸다
//  · 학생 응답 1번 = 기록 이벤트 1건 (emit). 끝나면 lesson-complete 이벤트와 칠판 정리(summary)
//  · 응답에는 정답 키워드(match·accept·on·선택지 result)를 절대 넣지 않는다
//  · BrainAdapter 자리: start/turn 두 함수만 바깥에 보인다. LLM 두뇌(LlmBrain)는 만들지 않았다
// ============================================================
'use strict';
const crypto = require('crypto');
const R = require('./rules');

const TTL = 3 * 3600 * 1000;          // 대화 상태 보관 시간
const MAX_TURNS = 40;                 // 넘으면 R단계 빈칸으로
const LOCK_MS = { danger: 2 * 60 * 1000, profanity: 5 * 60 * 1000 };
const GOOD = r => r === 'correct' || r === 'partial';

class ReflectEngine {
  constructor({ lessons, emit, now }) {
    this.lessons = lessons || {};
    this.emit = emit || (() => {});
    this.now = now || (() => Date.now());
    this.store = new Map();           // dialogueId → state
    this.locks = new Map();           // pid|lesson → 풀리는 시각
  }

  /* ----- 찾기 ----- */
  lesson(id) { return this.lessons[id] || null; }
  sweep() {
    const t = this.now();
    for (const [k, s] of this.store) if (t - s.touched > TTL) this.store.delete(k);
    for (const [k, u] of this.locks) if (u < t) this.locks.delete(k);
  }
  own(player, dialogueId) {
    const s = this.store.get(String(dialogueId || ''));
    return s && s.pid === player.id ? s : null;
  }

  /* ----- 시작 · 이어 하기 ----- */
  start(player, lessonId, resumeId) {
    this.sweep();
    const L = this.lesson(lessonId);
    if (!L) return { error: 'no_lesson' };
    if (resumeId) {
      const s = this.own(player, resumeId);
      if (s && !s.done && !s.locked && s.lessonId === lessonId) {
        s.touched = this.now();
        return { dialogueId: s.id, resumed: true, messages: s.lastMessages.slice(-2), view: this.view(L, L.nodes[s.nodeId]), board: s.board };
      }
    }
    const lk = this.locks.get(player.id + '|' + lessonId);
    if (lk && lk > this.now()) return { locked: true, waitSec: Math.ceil((lk - this.now()) / 1000) };
    for (const [k, s] of this.store) if (s.pid === player.id && s.lessonId === lessonId) this.store.delete(k);   // 같은 차시 대화는 하나만
    const s = {
      id: crypto.randomUUID(), pid: player.id, lessonId, nodeId: L.start, visits: {}, strikes: 0, offStreak: 0, turns: 0,
      reflection: '', blankText: '', blankTries: 0, flags: new Set(), cps: {}, maxHint: 0, reached: { E: false, R: false },
      startedAt: this.now(), touched: this.now(), done: false, locked: null, lastMessages: [], board: [],
    };
    this.store.set(s.id, s);
    const messages = [];
    this.advance(L, s, L.start, messages, player);
    s.lastMessages = messages;
    return { dialogueId: s.id, messages, view: this.view(L, L.nodes[s.nodeId]), npcs: L.npcs, title: L.title };
  }

  /* ----- 한 턴 ----- */
  turn(player, dialogueId, input) {
    const s = this.own(player, dialogueId);
    if (!s) return { error: 'no_dialogue' };
    if (s.done) return { error: 'done' };
    if (s.locked) return { error: 'locked', locked: s.locked };
    const L = this.lesson(s.lessonId), node = L.nodes[s.nodeId];
    s.touched = this.now();
    const msgs = [], say = (text, npc) => msgs.push(this.msg(L, npc || node.who, text));
    const stay = extra => Object.assign({ messages: msgs, view: this.view(L, node), done: false, locked: false }, extra || {});
    let result, studentText = '', next, flags = [];

    if (node.type === 'free') {
      const text = R.cleanText(input && input.text, 200);
      if (!text) { say(L.messages.empty || '한 낱말이라도 좋아. 생각나는 대로 적어 줄래?'); return stay(); }
      const sc = R.screen(text, L);
      if (sc.kind === 'danger') {
        s.locked = 'danger'; this.locks.set(player.id + '|' + s.lessonId, this.now() + LOCK_MS.danger);
        this.record(L, s, node, player, { studentText: sc.masked, result: 'blocked', flags: ['위험'] });
        say(L.messages.danger);
        return { messages: msgs, view: null, done: false, locked: 'danger' };
      }
      if (sc.kind === 'profanity') {
        s.strikes++;
        const limit = s.strikes >= 3;
        this.record(L, s, node, player, { studentText: sc.masked, result: 'blocked', flags: limit ? ['욕설', '욕설-3회'] : ['욕설'] });
        if (limit) {
          s.locked = 'profanity'; this.locks.set(player.id + '|' + s.lessonId, this.now() + LOCK_MS.profanity);
          say(L.messages.profanityLimit);
          return { messages: msgs, view: null, done: false, locked: 'profanity' };
        }
        say(L.messages.profanity); say(node.say);
        return stay();
      }
      if (sc.kind === 'pii') {
        this.record(L, s, node, player, { studentText: sc.masked, result: 'blocked', flags: ['개인정보'] });
        say(L.messages.pii); say(node.say);
        return stay();
      }
      if (sc.kind === 'mild') say(L.messages.mild || '친구를 배려하는 말로 이야기해 주면 더 좋겠어.');
      const match = node.match || (L.nodes[node.matchRef] && L.nodes[node.matchRef].match);
      const ev = R.evaluateFree(text, match);
      studentText = sc.masked;
      if (sc.kind === 'offtopic-candidate' && ev.result === 'miss' && !ev.matchedGroups.length) {
        s.offStreak++;
        if (s.offStreak < 3) {
          this.record(L, s, node, player, { studentText, result: 'offtopic', flags: ['이탈'] });
          say(L.messages.offtopic); say(node.say);
          return stay();
        }
        flags.push('이탈');          // 세 번째 이탈은 '못 찾음'으로 보고 힌트로 넘어간다
      }
      s.offStreak = 0;
      result = ev.result;
      if (result === 'avoid') say(L.messages.avoidPrefix);
      if (node.tag === 'reflection' && GOOD(result)) s.reflection = (node.hintLevel > 0 && s.reflection) ? s.reflection + ' ' + studentText : studentText;
      next = node.on[result];
    } else if (node.type === 'choice') {
      const k = Number(input && input.optionIndex), opt = Number.isInteger(k) ? node.options[k] : null;
      if (!opt) return { error: 'bad_option' };
      result = opt.result; studentText = opt.text; next = opt.next;
    } else if (node.type === 'blank') {
      const raw = (input && input.blanks) || {}, answers = {};
      for (const b of node.blanks) answers[b.id] = R.cleanText(raw[b.id], 30);
      const joined = Object.values(answers).join(' ');
      if (!joined.trim()) { say('빈칸에 들어갈 낱말을 적어 줄래?'); return stay(); }
      const sc = R.screen(joined, L);
      if (sc.kind === 'danger' || sc.kind === 'profanity' || sc.kind === 'pii') {
        // 빈칸에서도 같은 안전망: 위험은 멈추고, 나머지는 다시 쓰게 한다
        if (sc.kind === 'danger') {
          s.locked = 'danger'; this.locks.set(player.id + '|' + s.lessonId, this.now() + LOCK_MS.danger);
          this.record(L, s, node, player, { studentText: sc.masked, result: 'blocked', flags: ['위험'] });
          say(L.messages.danger);
          return { messages: msgs, view: null, done: false, locked: 'danger' };
        }
        if (sc.kind === 'profanity') s.strikes++;
        this.record(L, s, node, player, { studentText: sc.masked, result: 'blocked', flags: [sc.kind === 'pii' ? '개인정보' : '욕설'] });
        say(sc.kind === 'pii' ? L.messages.pii : L.messages.profanity);
        return stay();
      }
      const ev = R.evaluateBlanks(answers, node.blanks);
      const filled = R.maskPII(R.fillTemplate(node.template, answers)).text;
      s.blankTries++;
      if (ev.result !== 'correct' && s.blankTries <= (node.maxRetries || 0)) {
        this.record(L, s, node, player, { studentText: filled, result: ev.result, flags: [] });
        say(node.retrySay);
        return stay({ blankOk: ev.perBlank });
      }
      result = ev.result; studentText = filled; next = node.on[result];
      if (node.tag === 'blank'){ s.blankText = filled; if (!s.reflection) s.reflection = filled; }   /* R 빈칸만 '오늘의 한 문장'이 된다 */
    } else {
      return { error: 'not_interactive' };
    }

    // 결과별 플래그 · 단계 도달 · 확인점(checkpoint)
    flags = flags.concat((node.flagsOn && node.flagsOn[result]) || []);
    flags.forEach(f => s.flags.add(f));
    if (node.hintLevel > s.maxHint) s.maxHint = node.hintLevel;
    if (GOOD(result) && (node.stage === 'E' || node.stage === 'R')) s.reached[node.stage] = true;
    if (node.cp) {
      const c = s.cps[node.cp] || (s.cps[node.cp] = { first: null, ok: false, support: false, text: '' });
      if (c.first === null) c.first = result;
      // 정답이거나, 부분 답이라도 정답과 같은 다음 단계로 받아 준 경우(두 번에 나눠 바르게 말함)는 해낸 것으로 본다
      if (result === 'correct' || (result === 'partial' && (node.type === 'blank' || (node.on && node.on.correct === next)))) c.ok = true;
      if (flags.includes('지원필요')) c.support = true;
      if (studentText) c.text = studentText;
      c.last = result;
    }
    this.record(L, s, node, player, { studentText, result, flags });
    const last = node.cp ? { cp: node.cp, label: (L.checkpoints[node.cp] || {}).label || '', stage: node.stage, result, text: studentText, hintLevel: node.hintLevel || 0 } : null;
    if (last) {
      const i = s.board.findIndex(b => b.cp === last.cp);
      if (i >= 0) s.board[i] = last; else s.board.push(last);
    }

    s.turns++;
    if (s.turns > (L.maxTurns || MAX_TURNS) && !L.nodes[next].tag) next = L.fallbackNode || next;   /* 차시 대본이 한도를 정할 수 있다 (L1: 52) */
    const fin = this.advance(L, s, next, msgs, player);
    s.lastMessages = msgs;
    if (fin) return { messages: msgs, view: { type: 'end' }, done: true, locked: false, last, summary: fin };
    return { messages: msgs, view: this.view(L, L.nodes[s.nodeId]), done: false, locked: false, last };
  }

  /* ----- 노드 따라가기: say는 모아 보내고, 묻는 노드나 끝에서 멈춘다 ----- */
  advance(L, s, id, msgs, player) {
    let guard = 0;
    while (guard++ < 60) {
      const n = L.nodes[id];
      if (!n) throw new Error('missing node ' + id);
      s.visits[id] = (s.visits[id] || 0) + 1;
      if (n.stuck && s.visits[id] > n.stuck.after){ id = n.stuck.to; continue; }   /* 같은 되묻기에서 여러 번 막히면 그 개념만 빈칸으로 확인 */
      (n.flags || []).forEach(f => s.flags.add(f));
      if (n.cp && (n.flags || []).includes('지원필요')) {
        const c = s.cps[n.cp] || (s.cps[n.cp] = { first: null, ok: false, support: false, text: '' });
        c.support = true;
      }
      if (n.type === 'say') { msgs.push(this.msg(L, n.who, n.say)); id = n.next; continue; }
      if (n.type === 'end') {
        s.done = true; s.nodeId = id;
        const summary = this.summary(L, s);
        const text = String(n.say).replace('{{reflection}}', summary.sentence || '오늘 배운 것');
        msgs.push(this.msg(L, n.who, text));
        this.record(L, s, n, player, { studentText: '', result: 'info', flags: [], npcText: text, tag: 'lesson-complete' });
        return summary;
      }
      if (s.visits[id] >= 4 && n.type === 'free' && n.on && n.on.miss !== id) { id = n.on.miss; continue; }   // 같은 질문 네 번째면 다음 단계로
      s.nodeId = id;
      return null;
    }
    throw new Error('loop at ' + id);
  }

  /* ----- 칠판 정리: 확인점마다 스스로/힌트로/도움 필요 · 잘한 점 · 다음에 생각할 질문 ----- */
  summary(L, s) {
    const order = Object.keys(L.checkpoints || {}).filter(k => !L.checkpoints[k].ext);   /* '만약' 질문(ext)은 칠판에만 적고 정리 칩에서는 뺀다 */
    const cps = order.map(k => {
      const c = s.cps[k] || { first: null, ok: false, support: false, text: '' };
      const status = c.support || (!c.ok && c.first !== null) ? 'support' : c.first === 'correct' ? 'self' : c.ok ? 'hint' : 'skip';
      return { key: k, label: L.checkpoints[k].label, stage: L.checkpoints[k].stage || '', status, text: c.text || '' };
    });
    const pick = st => cps.slice().reverse().find(c => c.status === st);
    const best = pick('self') || pick('hint');
    const praise = best ? (best.status === 'self' ? L.checkpoints[best.key].praise : (L.checkpoints[best.key].praiseHint || L.praiseHint)) : L.praiseDefault;
    const weak = cps.find(c => c.status === 'support') || cps.find(c => c.status === 'hint');
    const question = weak ? L.checkpoints[weak.key].next : L.nextAll;
    return {
      lessonId: L.lessonId, title: L.title, sentence: s.reflection || s.blankText || '',
      stage: s.reached.R ? 'R' : s.reached.E ? 'E' : 'S', checkpoints: cps, praise, question,
      maxHint: s.maxHint, flags: [...s.flags], turns: s.turns, minutes: Math.max(1, Math.round((this.now() - s.startedAt) / 60000)),
    };
  }

  /* ----- 화면에 보낼 것 (정답 키는 빼고) ----- */
  msg(L, npc, text) {
    const id = npc || L.lead, n = (L.npcs && L.npcs[id]) || { name: id };
    return { npc: id, who: n.name, text: String(text || '') };
  }
  view(L, n) {
    if (!n) return null;
    const v = { type: n.type, prompt: n.say, npc: n.who || L.lead, who: ((L.npcs || {})[n.who || L.lead] || {}).name || '', stage: n.stage || '', hintLevel: n.hintLevel || 0, maxLength: 200 };
    if (n.type === 'choice') v.options = n.options.map((o, i) => ({ index: i, text: o.text }));
    if (n.type === 'blank') { v.template = n.template; v.blanks = n.blanks.map(b => ({ id: b.id })); }
    if (n.cp) v.cp = n.cp;
    return v;
  }

  /* ----- 기록 이벤트 (GameBridge.gs gbValidateEvent_ 형식과 같게) ----- */
  record(L, s, n, player, o) {
    this.emit({
      eventId: crypto.randomUUID(), clientTime: new Date(this.now()).toISOString(), lesson: L.lessonId,
      classCode: player.classCode || 'NOCLASS', studentNo: player.studentNo || '', playerKey: player.playerKey, sessionId: player.sessionId || '',
      npc: n.who || L.lead, nodeId: n.id || s.nodeId, stage: n.stage || '', tag: o.tag || n.tag || '',
      npcText: String(o.npcText || n.say || '').slice(0, 500), studentText: String(o.studentText || '').slice(0, 500),
      result: o.result, hintLevel: n.hintLevel || 0, flags: [...new Set(o.flags || [])],
    });
  }
}

/* 대본 읽기: id를 노드에 붙이고, draft는 쓰지 않는다 */
function loadLessons(dir, fs, path, log) {
  const out = {};
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => /^L[^_].*\.json$/.test(f)); } catch (e) { return out; }
  for (const f of files) {
    try {
      const L = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      if (!L.nodes || !L.lessonId) continue;
      if (L.status === 'draft') { (log || console).warn(`[lad] ${f}: draft 대본이라 쓰지 않아요`); continue; }
      for (const [id, n] of Object.entries(L.nodes)) n.id = id;
      /* 판정 낱말은 모두 '주제 어휘'로 친다 (맞는 말이 이탈로 잘못 걸리지 않게) */
      const vocab = new Set(L.vocabulary || []);
      for (const n of Object.values(L.nodes)) for (const ws of Object.values((n.match && n.match.groups) || {})) ws.forEach(w => vocab.add(w));
      L.vocabulary = [...vocab];
      L.messages = Object.assign({
        avoidPrefix: '괜찮아, 같이 천천히 찾아보자.', offtopic: '재미있는 이야기지만, 지금은 오늘 배운 것에 집중해 볼까?',
        profanity: '그 말은 우리 약속과 맞지 않아. 바른 말로 다시 이야기해 줄래?', profanityLimit: '규칙 위반이 세 번이라 정리 회의를 잠시 멈출게. 선생님께 도움을 요청하자.',
        pii: '개인정보는 적지 않기로 약속했지? 그 부분은 빼고 다시 말해 줄래?', danger: '그 이야기를 들으니 걱정돼. 지금 바로 선생님이나 보호자께 꼭 말씀드리자.',
      }, L.messages || {});
      out[L.lessonId] = L;
    } catch (e) { (log || console).warn(`[lad] ${f}: 대본을 읽지 못했어요 (${e.message})`); }
  }
  return out;
}

module.exports = { ReflectEngine, loadLessons };
