// ============================================================
//  lad/ai.js — 정리 회의 AI 튜터가 Gemini를 부르는 길
//  · 1순위: Railway 환경 변수 GEMINI_API_KEY가 있으면 게임 서버가 Gemini를 바로 부른다 (가장 빠름)
//  · 2순위: 없으면 구글 앱스 스크립트(GAS)의 스크립트 속성 GEMINI_API_KEYS로 GAS가 대신 부른다
//           (선생님이 시트 분석용으로 넣는 키를 그대로 쓴다 → 시트만 연결하면 AI 튜터도 켜진다)
//  · 둘 다 없으면 AI 없이 규칙 엔진(lad/engine.js)으로 정리 회의를 한다
//  · 키는 URL이 아니라 헤더로 보낸다. 로그에 키·학생 글을 남기지 않는다
// ============================================================
'use strict';

const SAFETY = ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT']
  .map(category => ({ category, threshold: 'BLOCK_MEDIUM_AND_ABOVE' }));

function geminiPayload(system, contents, schema, opt) {
  const generationConfig = { temperature: opt.temperature, maxOutputTokens: opt.maxTokens, responseMimeType: 'application/json' };
  if (schema) generationConfig.responseSchema = schema;
  return { systemInstruction: { parts: [{ text: system }] }, contents, generationConfig, safetySettings: SAFETY };
}
function pickText(json) {
  const c = json && json.candidates && json.candidates[0];
  const text = c && c.content && c.content.parts ? c.content.parts.filter(p => p.text && !p.thought).map(p => p.text).join('') : '';
  return text ? { ok: true, text } : { ok: false, error: 'empty_' + ((c && c.finishReason) || 'blocked') };
}

function createAi({ env = process.env, relay, logger = console, fetchImpl = globalThis.fetch }) {
  const off = /^(0|false|no|off)$/i.test(String(env.AI_TUTOR_ENABLED || '').trim());
  const keys = String(env.GEMINI_API_KEY || env.GEMINI_API_KEYS || '').split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
  const opt = { model: env.GEMINI_MODEL || 'gemini-3.5-flash-lite', temperature: 0.6, maxTokens: 900, timeoutMs: 25000 };
  const st = { mode: off ? 'off' : keys.length ? 'direct' : 'none', gasAi: false, checkedAt: 0, fails: 0, calls: 0 };

  async function direct(system, contents, schema) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(opt.model) + ':generateContent';
    const order = keys.slice().sort(() => Math.random() - 0.5);
    let last = 'busy';
    for (const key of order) {
      let res;
      try {
        res = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify(geminiPayload(system, contents, schema, opt)), signal: AbortSignal.timeout(opt.timeoutMs) });
      } catch (e) { last = 'network_' + (e.name || 'error'); continue; }
      const code = res.status;
      let json = {}; try { json = JSON.parse(await res.text()); } catch (e) {}
      if (code === 429 || code >= 500) { last = 'HTTP ' + code; continue; }
      if (code !== 200 || json.error) return { ok: false, error: 'HTTP ' + code + ' ' + ((json.error && json.error.status) || '') };
      return pickText(json);
    }
    return { ok: false, error: last };
  }
  async function viaGas(system, contents, schema) {
    const r = await relay.call('tutor_turn', { system, contents, schema, temperature: opt.temperature });
    return r && r.ok ? { ok: true, text: String(r.text || '') } : { ok: false, error: (r && r.error) || 'gas_error' };
  }
  /* GAS에 Gemini 키가 들어 있는지 가끔 확인한다 (선생님이 나중에 키를 넣어도 서버를 다시 켤 필요 없게) */
  async function refresh(force) {
    if (st.mode === 'off' || st.mode === 'direct' || !relay || !relay.enabled) return;
    if (!force && Date.now() - st.checkedAt < 5 * 60 * 1000) return;
    st.checkedAt = Date.now();
    const p = await relay.ping().catch(() => null);
    st.gasAi = !!(p && p.ok && p.ai);
    st.mode = st.gasAi ? 'gas' : 'none';
  }
  async function ask(system, contents, schema) {
    st.calls++;
    const r = st.mode === 'direct' ? await direct(system, contents, schema) : st.mode === 'gas' ? await viaGas(system, contents, schema) : { ok: false, error: 'no_ai' };
    if (!r.ok) { st.fails++; logger.warn('[lad] AI 튜터 응답 실패: ' + r.error); }
    return r;
  }
  return {
    ask, refresh,
    ready: () => st.mode === 'direct' || st.mode === 'gas',
    status: () => ({ mode: st.mode, model: opt.model, calls: st.calls, fails: st.fails }),
  };
}

module.exports = { createAi, geminiPayload, pickText };
