// ============================================================
//  lad/relay.js — 게임 서버 → 구글 앱스 스크립트(GAS) 웹앱 중계
//  ------------------------------------------------------------
//  · 학생 브라우저는 이 모듈을 거치지 않고, GAS 주소도 비밀키도 모른다
//  · 10초마다 묶어서 보낸다. 실패하면 5초→15초→1분→2분 뒤 다시 보낸다 (eventId로 중복 방지)
//  · 아직 연결하지 않았으면(GAS_WEBAPP_URL·GAS_SHARED_SECRET 없음) 기록을 DATA_DIR/lad/queue.json에 모아 두었다가,
//    연결한 뒤 서버가 켜지면 한꺼번에 보낸다. 그래서 연결 전 수업 기록도 시트로 들어간다
//  · 로그에는 학생 발화를 남기지 않는다 (건수·오류 코드만)
//  · 출발점: npc-feedback-kit/server-reference/sheetRelay.js
// ============================================================
'use strict';
const fs = require('fs'), path = require('path');

const DEFAULTS = {
  flushMs: 10000, maxBatch: 150, maxBuffer: 20000, timeoutMs: 30000,
  feedbackCacheMs: 3 * 60 * 1000, backoffMs: [5000, 15000, 60000, 120000], saveMs: 1500,
};

class SheetRelay {
  constructor({ url, secret, dir, logger = console, fetchImpl = globalThis.fetch, options = {} }) {
    this.url = String(url || '').trim();
    this.secret = String(secret || '').trim();
    this.enabled = !!(this.url && this.secret);
    this.log = logger;
    this.fetch = fetchImpl;
    this.opt = Object.assign({}, DEFAULTS, options);
    this.file = dir ? path.join(dir, 'queue.json') : null;
    this.buffer = [];
    this.flushing = false;
    this.failures = 0;
    this.nextAllowedAt = 0;
    this.dropped = 0;
    this.sent = 0;
    this.lastOkAt = 0;
    this.lastError = '';
    this.feedbackCache = new Map();
    this.timer = null;
    this.saveT = null;
    if (dir) { try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {} }
    this.load();
  }

  /* ----- 모아 둔 기록 읽기 · 쓰기 ----- */
  load() {
    if (!this.file) return;
    try {
      const arr = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      if (Array.isArray(arr)) this.buffer = arr.filter(e => e && typeof e.eventId === 'string');
    } catch (e) { /* 처음이면 파일이 없다 */ }
  }
  saveSoon() {
    if (!this.file || this.saveT) return;
    this.saveT = setTimeout(() => { this.saveT = null; this.saveNow(); }, this.opt.saveMs);
    if (this.saveT.unref) this.saveT.unref();
  }
  saveNow() {
    if (!this.file) return;
    try { const tmp = this.file + '.' + process.pid + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(this.buffer)); fs.renameSync(tmp, this.file); }
    catch (e) { this.log.warn('[lad] 기록 대기열 저장 실패: ' + e.code); }
  }

  start() {
    if (this.timer || !this.enabled) return;
    this.timer = setInterval(() => { this.flush().catch(() => {}); }, this.opt.flushMs);
    if (this.timer.unref) this.timer.unref();
    if (this.buffer.length) setTimeout(() => this.flush().catch(() => {}), 1500).unref?.();
  }
  async shutdown() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.saveT) { clearTimeout(this.saveT); this.saveT = null; }
    if (this.enabled) { this.nextAllowedAt = 0; await this.flush().catch(() => {}); }
    this.saveNow();
  }

  enqueue(events) {
    const list = Array.isArray(events) ? events : [events];
    for (const ev of list) if (ev && typeof ev.eventId === 'string') this.buffer.push(ev);
    if (this.buffer.length > this.opt.maxBuffer) {
      const over = this.buffer.length - this.opt.maxBuffer;
      this.buffer.splice(0, over); this.dropped += over;
      this.log.warn(`[lad] 대기열이 가득 차 오래된 기록 ${over}건을 버렸어요 (누적 ${this.dropped}건) — 구글 시트 연결을 확인하세요`);
    }
    this.saveSoon();
    if (this.enabled && this.buffer.length >= this.opt.maxBatch) this.flush().catch(() => {});
  }

  async flush() {
    if (!this.enabled || this.flushing || !this.buffer.length) return;
    if (Date.now() < this.nextAllowedAt) return;
    this.flushing = true;
    try {
      while (this.buffer.length) {
        const batch = this.buffer.slice(0, this.opt.maxBatch);
        const res = await this.call('log_events', { events: batch });
        if (!res.ok) throw new Error(res.error || 'unknown');
        this.buffer.splice(0, batch.length);   // 형식 오류로 skipped된 것도 다시 보내면 또 실패하니 함께 뺀다
        this.sent += res.written || 0; this.failures = 0; this.lastOkAt = Date.now(); this.lastError = '';
        this.saveSoon();
      }
    } catch (e) {
      const wait = this.opt.backoffMs[Math.min(this.failures, this.opt.backoffMs.length - 1)];
      this.failures++; this.nextAllowedAt = Date.now() + wait; this.lastError = e.message;
      this.log.warn(`[lad] 시트 전송 실패(${e.message}) — ${Math.round(wait / 1000)}초 뒤 다시, 대기 ${this.buffer.length}건`);
    } finally { this.flushing = false; }
  }

  async call(action, payload = {}) {
    if (!this.enabled) return { ok: false, error: 'not_configured' };
    let res;
    try {
      res = await this.fetch(this.url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ secret: this.secret, action }, payload)),
        redirect: 'follow',                          // GAS는 302로 결과 주소를 돌려준다 → 따라가야 JSON
        signal: AbortSignal.timeout(this.opt.timeoutMs),
      });
    } catch (e) { return { ok: false, error: 'network_' + (e.name || 'error') }; }
    const text = await res.text();
    try { return JSON.parse(text); } catch (e) { return { ok: false, error: 'non_json_' + res.status }; }
  }

  ping() { return this.call('ping'); }

  // 반 단위로 3분 캐시 → 한 반이 동시에 접속해도 GAS 호출은 1번
  async getFeedback(classCode, playerKey) {
    if (!this.enabled || !classCode) return null;
    const hit = this.feedbackCache.get(classCode);
    let items;
    if (hit && Date.now() - hit.at < this.opt.feedbackCacheMs) items = hit.items;
    else {
      const res = await this.call('get_feedback', { classCode });
      if (!res.ok) return null;
      items = (res.items || []).filter(it => it && typeof it.text === 'string' && it.text.trim());
      this.feedbackCache.set(classCode, { at: Date.now(), items });
    }
    return items.filter(it => it.playerKey === playerKey);
  }
  async ackFeedback(lesson, classCode, playerKey, reply) {
    const res = await this.call('ack_feedback', { lesson, classCode, playerKey, reply: reply || '' });
    const hit = this.feedbackCache.get(classCode);
    if (hit) hit.items = hit.items.filter(it => !(it.playerKey === playerKey && it.lesson === lesson));
    return res;
  }
  upsertLessons(lessons) { return this.call('upsert_lessons', { lessons }); }

  status() {
    return { enabled: this.enabled, pending: this.buffer.length, sent: this.sent, dropped: this.dropped, lastOkAt: this.lastOkAt, lastError: this.lastError };
  }
}

module.exports = { SheetRelay };
