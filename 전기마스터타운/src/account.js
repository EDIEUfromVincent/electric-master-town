/* =========================================================
   👤 학생 로그인 · 학생별 기록
   - 서버(Railway의 server.js)에서 열면: 기록이 서버에 저장돼서 어느 기기에서든 이어 한다.
   - 파일·게시본으로 열면: 이 기기 안에 학생별로 따로 저장된다.
   ========================================================= */
const ACC = {id:null, label:'', token:null, server:false, ready:false, syncT:null, dirty:false};
const ACC_LIST_KEY = 'emt.accounts.v1', ACC_LAST_KEY = 'emt.lastLogin.v1', LEGACY_KEY = 'emt.save.v1';

async function sha256hex(s){
  if (window.crypto && crypto.subtle){
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  let h1 = 0x811c9dc5, h2 = 0x1234567;   /* 아주 오래된 브라우저용 대체 (로컬 저장 비밀번호에만 쓴다) */
  for (const ch of s){ const c = ch.codePointAt(0); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul(h2 + c, 2246822519) >>> 0; }
  return 'x' + h1.toString(16) + h2.toString(16);
}
const normCode = s => String(s || '').replace(/\s+/g, '');
const normName = s => String(s || '').normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, 12);
const accId = name => 'n:' + normName(name).toLowerCase();
function lsGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v){ try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function localAccounts(){ try { return JSON.parse(lsGet(ACC_LIST_KEY) || '{}') || {}; } catch (e) { return {}; } }

/* 저장 요약: 교사 계기판에 보여 줄 것만 */
function accSummary(){
  let lv = 1, title = '';
  try { lv = rpgLevel(); title = rpgTitle(); } catch (e) {}
  const done = ACTS.filter(a => actDone(a)).map(a => a.id), cur = actCur();
  const chk = (SAVE.act && SAVE.act.check) || {};
  let mc = {em:0, es:0}; try { mc = masterCounts(); } catch (e) {}
  return {lv, title, done, cur:cur ? cur.id : null, met:!!(SAVE.met && SAVE.met.volt), finale:!!(SAVE.story && SAVE.story.finale),
    checkOk:Object.values(chk).filter(Boolean).length, checkN:Object.keys(chk).length, bolts:mgTotal(), em:mc.em, es:mc.es,
    delay:(SAVE.street && SAVE.street.delay) || 0, quarrels:(SAVE.street && SAVE.street.quarrels) || 0, helped:((SAVE.street && SAVE.street.helped) || 0) + ((SAVE.street && SAVE.street.mediated) || 0), hq:(SAVE.street && SAVE.street.hqDone) || 0, t:Date.now()};
}

/* ----- 서버 ----- */
async function api(path, body){
  const r = await fetch(path, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body || {})});
  let j = null; try { j = await r.json(); } catch (e) {}
  if (!r.ok) throw Object.assign(new Error((j && j.error) || '서버 오류'), {status:r.status, code:j && j.code});
  return j;
}
async function detectServer(){
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return false;
  try {
    const c = new AbortController(), t = setTimeout(() => c.abort(), 2500);
    const r = await fetch('api/ping', {signal:c.signal, cache:'no-store'}); clearTimeout(t);
    if (!r.ok) return false; const j = await r.json(); return !!(j && j.emt);
  } catch (e) { return false; }
}

/* ----- 저장 (ui.js의 persist가 부른다) ----- */
function accPersist(){
  if (!ACC.id) return;
  lsSet(SAVE_KEY, JSON.stringify(SAVE));
  if (!ACC.server) { lsSet('emt.sum.v1:' + ACC.id, JSON.stringify(accSummary())); return; }
  ACC.dirty = true; clearTimeout(ACC.syncT); ACC.syncT = setTimeout(accPush, 2500);
}
async function accPush(){
  if (!ACC.server || !ACC.token || !ACC.dirty) return;
  ACC.dirty = false;
  try { await api('api/save', {token:ACC.token, save:SAVE, sum:accSummary()}); $('#accSync') && ($('#accSync').textContent = '☁️ 저장됨'); }
  catch (e){
    ACC.dirty = true; if ($('#accSync')) $('#accSync').textContent = '⚠️ 저장 대기';
    if (e.status === 401){ ACC.token = null; toast('다시 로그인해 주세요. (기록은 이 기기에 남아 있어요)', 'bad'); }
    else { clearTimeout(ACC.syncT); ACC.syncT = setTimeout(accPush, 10000); }
  }
}
window.addEventListener('pagehide', () => {
  if (ACC.server && ACC.token && ACC.dirty && navigator.sendBeacon){
    try { navigator.sendBeacon('api/save', new Blob([JSON.stringify({token:ACC.token, save:SAVE, sum:accSummary()})], {type:'application/json'})); ACC.dirty = false; } catch (e) {}
  }
});

/* ----- 로그인 화면: 이름(별명) + 비밀번호만 ----- */
function showLogin(msg){
  ACC.ready = false;
  const last = (() => { try { return JSON.parse(lsGet(ACC_LAST_KEY) || 'null'); } catch (e) { return null; } })() || {};
  const el = $('#login'); el.hidden = false; $('#title').hidden = true;
  $('#lgName').value = last.name || ''; $('#lgPin').value = '';
  $('#lgMode').textContent = ACC.server ? '☁️ 전국 어디서든 같은 이름(별명)과 비밀번호로 들어오면 전에 하던 기록이 이어져요.' : '💾 이 기기에 학생별로 따로 저장돼요.';
  $('#lgMsg').textContent = msg || ''; $('#lgMsg').className = msg ? 'bad' : '';
  setTimeout(() => { const i = last.name ? $('#lgPin') : $('#lgName'); if (i) i.focus(); }, 50);
}
async function doLogin(){
  const name = normName($('#lgName').value), pin = $('#lgPin').value.trim();
  const say = (m, ok) => { $('#lgMsg').textContent = m; $('#lgMsg').className = ok ? 'ok' : 'bad'; };
  if (!name) return say('이름(또는 별명)을 써요.');
  if (!/^\d{4,8}$/.test(pin)) return say('비밀번호는 숫자 4~8자리예요.');
  const id = accId(name), btn = $('#lgGo'); btn.disabled = true; say('들어가는 중…', true);
  try {
    let save = null, fresh = false, moved = false;
    if (ACC.server){
      const j = await api('api/login', {name, pin});
      ACC.token = j.token; save = j.save; fresh = !!j.created; moved = !!j.moved;
      const local = (() => { try { return JSON.parse(lsGet('emt.save.v1:' + id) || 'null'); } catch (e) { return null; } })();
      if (local && local._t && (!save || !save._t || local._t > save._t)) save = local;   /* 서버에 못 올린 최근 기록이 이 기기에 있으면 그것을 쓴다 */
    } else {
      const L = localAccounts(), h = await sha256hex(id + ':' + pin);
      if (L[id]){
        if (L[id].hash !== h) throw new Error('이 이름은 이미 쓰고 있거나 비밀번호가 달라요. 비밀번호를 확인하거나 다른 별명을 써요.');
      } else {
        /* 예전 방식(반 · 번호) 계정이 같은 이름 · 비밀번호로 있으면 그 기록을 이어받는다 */
        for (const [oid, a] of Object.entries(L)){
          if (oid.startsWith('n:') || a.migrated || normName(a.name) !== name) continue;
          if (await sha256hex(oid + ':' + pin) !== a.hash) continue;
          const old = lsGet('emt.save.v1:' + oid); if (old) lsSet('emt.save.v1:' + id, old);
          const os = lsGet('emt.sum.v1:' + oid); if (os) lsSet('emt.sum.v1:' + id, os);
          a.migrated = id; moved = true; break;
        }
        fresh = !moved; L[id] = {name, hash:h, created:Date.now()};
        if (!lsSet(ACC_LIST_KEY, JSON.stringify(L))) throw new Error('이 기기에는 저장할 수 없어요.');
      }
      try { save = JSON.parse(lsGet('emt.save.v1:' + id) || 'null'); } catch (e) {}
      if (!save && fresh){   /* 로그인 기능 전에 이 기기에서 하던 기록이 있으면 처음 만든 학생에게 넘겨준다 */
        const old = lsGet(LEGACY_KEY);
        if (old && !Object.values(L).some(a => a.legacy)){ try { save = JSON.parse(old); L[id].legacy = true; lsSet(ACC_LIST_KEY, JSON.stringify(L)); } catch (e) {} }
      }
    }
    lsSet(ACC_LAST_KEY, JSON.stringify({name}));
    ACC.id = id; ACC.label = name;
    SAVE_KEY = 'emt.save.v1:' + id;
    applySave(save); SAVE.nickname = name;
    ACC.ready = true; persist();
    $('#login').hidden = true; btn.disabled = false;
    afterLogin(fresh, moved);
  } catch (e){
    btn.disabled = false;
    say(e.code === 'pin' ? '이 이름(별명)은 이미 누가 쓰고 있거나 비밀번호가 달라요. 비밀번호를 확인하거나, 처음이라면 다른 별명을 써요.' : e.status === 429 ? '너무 여러 번 시도했어요. 1분 뒤에 다시 해요.' : (e.message || '들어가지 못했어요.'));
  }
}
function applySave(s){
  SAVE = Object.assign(DEFAULT_SAVE(), s && typeof s === 'object' ? s : {});
  for (const k of LABEL_KEYS) if (!Array.isArray(SAVE.train[k])) SAVE.train[k] = [];
  SAVE.story = Object.assign({init:false, openingSeen:false, chapter:0, done:{}, queue:[], finale:false}, SAVE.story || {});
  if (!Array.isArray(SAVE.story.queue)) SAVE.story.queue = [];
  if (!SAVE.story.done || typeof SAVE.story.done !== 'object') SAVE.story.done = {};
  rpgNormalize();
}
function afterLogin(fresh, moved){
  HP.inv = 0; UI.waypoint = null;
  rpgSync(true); storyInit(); updateRpgHUD();
  ladInit();   /* 정리 회의 · 기록 (wrap.js) */
  loadWorld(buildStoryWorld());
  if (G3.ok && SAVE.pos){ player.x = SAVE.pos.x; player.y = SAVE.pos.y; }
  showTitle();
  $('#accName').textContent = ACC.label;
  $('#accSync').textContent = ACC.server ? '☁️ 학급 서버' : '💾 이 기기';
  toast(moved ? `${ACC.label}, 전에 하던 기록을 이어 왔어요!` : fresh ? `${ACC.label}, 환영해요! 이 이름과 비밀번호를 꼭 기억해요.` : `${ACC.label}, 다시 왔군요!`, 'ok');
}
function logout(){
  if (ACC.server && ACC.dirty) accPush();
  ACC.id = null; ACC.token = null; ACC.label = '';
  closePanelSilently(); if (MODE !== 'title') showTitle();
  showLogin();
}
async function accBoot(){
  ACC.server = await detectServer();
  showLogin();
}
