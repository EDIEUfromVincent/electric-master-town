/* =========================================================
   👤 학생 로그인 · 학생별 기록 · 교사 계기판
   - 학급 서버(Railway의 server.js)에서 열면: 기록이 서버에 저장돼서 어느 기기에서든 이어 하고, 교사 계기판에 모인다.
   - 파일·게시본으로 열면: 이 기기 안에 학생별로 따로 저장된다. 계기판은 이 기기의 학생만 보여 준다.
   ========================================================= */
const ACC = {id:null, label:'', token:null, server:false, ready:false, syncT:null, dirty:false};
const TEACHER_HASH = 'eb61b0b69df5042ed4be1cac89b0ce9fe673ca7d387d7d54fbe3f5dc2d157105';   /* 교사 코드의 해시 (코드 자체는 적지 않는다) */
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

/* ----- 교사 계기판 ----- */
const DASH = {code:null, rows:null, timer:null};
function openTeacherGate(){
  const p = openPanel(`<h2>📊 교사 계기판</h2><p class="sub">선생님만 들어올 수 있어요. 교사 코드를 입력하세요.</p>
    <div class="row" style="gap:8px"><input id="tcCode" type="password" placeholder="교사 코드" autocomplete="off" style="width:220px"><button class="btn primary" id="tcGo">들어가기</button></div><p id="tcMsg" class="ls-tip"></p>`);
  const go = async () => {
    const code = normCode(p.querySelector('#tcCode').value);
    if (!code) return;
    if (ACC.server){
      try { const j = await api('api/teacher', {code}); DASH.code = code; DASH.rows = j.students; openDashboard(); }
      catch (e){ p.querySelector('#tcMsg').textContent = e.status === 429 ? '너무 여러 번 시도했어요. 1분 뒤에 다시 해요.' : '코드가 맞지 않아요.'; }
      return;
    }
    if (await sha256hex(code) === TEACHER_HASH){ DASH.code = code; DASH.rows = null; openDashboard(); }
    else p.querySelector('#tcMsg').textContent = '코드가 맞지 않아요.';
  };
  p.querySelector('#tcGo').onclick = go;
  p.querySelector('#tcCode').onkeydown = e => { if (e.key === 'Enter') go(); };
  setTimeout(() => { const i = p.querySelector('#tcCode'); if (i) i.focus(); }, 50);
}
function localRows(){
  const L = localAccounts();
  return Object.entries(L).filter(([id, a]) => !a.migrated).map(([id, a]) => {
    let sum = null; try { sum = JSON.parse(lsGet('emt.sum.v1:' + id) || 'null'); } catch (e) {}
    return a.migrated ? null : {id, name:a.name, sum, updated:sum ? sum.t : a.created};
  });
}
function ago(t){
  if (!t) return '-';
  const s = (Date.now() - t) / 1000;
  return s < 60 ? '방금' : s < 3600 ? `${Math.floor(s / 60)}분 전` : s < 86400 ? `${Math.floor(s / 3600)}시간 전` : new Date(t).toLocaleDateString('ko-KR');
}
async function dashRefresh(){
  if (!ACC.server){ DASH.rows = localRows(); return; }
  try { const j = await api('api/teacher', {code:DASH.code}); DASH.rows = j.students; } catch (e) {}
}
async function openDashboard(){
  if (!DASH.code) return openTeacherGate();
  if (!DASH.rows) await dashRefresh();
  const q = (DASH.q || '').trim().toLowerCase();
  const rows = (DASH.rows || []).filter(r => r && (!q || String(r.name).toLowerCase().includes(q))).sort((a, b) => (b.updated || 0) - (a.updated || 0));
  const cnt = ACTS.map(a => rows.filter(r => r.sum && r.sum.done && r.sum.done.includes(a.id)).length);
  const head = `<tr><th>이름(별명)</th><th>레벨</th><th>진행</th>${ACTS.map((a, k) => `<th title="${esc(a.title)}">${k + 1}<br><span style="font-size:15px">${a.icon}</span></th>`).join('')}<th>확인 질문</th><th title="다툼으로 지체된 시간 (다툼 횟수)">⏰ 다툼 지체</th><th title="다친 사람 돕기 · 다툼 말리기 / 숨은 퀘스트(MRI)">🤝 도움 · 🔎</th><th>마지막</th>${ACC.server ? '<th></th>' : ''}</tr>`;
  const body = rows.map(r => {
    const s = r.sum || {}, done = s.done || [], n = done.length;
    return `<tr><td>${esc(r.name)}</td><td><b>Lv.${s.lv || 1}</b><br><small>${esc(s.title || '')}</small></td>
      <td><div class="dash-bar"><i style="width:${Math.round(n / ACTS.length * 100)}%"></i></div><small>${n}/${ACTS.length}${s.finale ? ' 🎆' : ''}</small></td>
      ${ACTS.map(a => `<td class="dash-c">${done.includes(a.id) ? '✅' : s.cur === a.id ? '🔸' : ''}</td>`).join('')}
      <td>${s.checkN ? `${s.checkOk}/${s.checkN}` : '-'}</td><td>${s.delay ? `<b style="color:${s.delay >= 60 ? '#ff9b90' : 'inherit'}">${s.delay}초</b><br><small>${s.quarrels || 0}번</small>` : '-'}</td><td>${s.helped || 0} · ${s.hq ? '🔎' + s.hq : '-'}</td><td><small>${ago(r.updated)}</small></td>
      ${ACC.server ? `<td><button class="btn small ghost" data-pin="${esc(r.id)}" title="비밀번호를 지우면 학생이 다음 로그인 때 새로 정해요">🔑 초기화</button></td>` : ''}</tr>`;
  }).join('');
  const p = openPanel(`<h2>📊 교사 계기판</h2>
    <p class="sub">${ACC.server ? '서버에 저장된 전국 모든 학생(최근에 한 순서). 우리 반 학생은 이름으로 찾아요' : '이 기기에서 로그인한 학생만 보여요. 학급 서버 주소로 열면 모두 모여요.'} · ✅ 성공한 활동 · 🔸 지금 하는 활동 · 학생 ${rows.length}명</p>
    <div class="row" style="gap:8px;margin-bottom:8px"><input id="dsQ" placeholder="이름(별명)으로 찾기 — 우리 반 학생 이름을 넣어요" value="${esc(DASH.q || '')}" style="width:260px"><button class="btn small" id="dsRe">↻ 새로 고침</button><button class="btn small ghost" id="dsCsv">📋 표 복사</button><button class="btn small ghost" id="dsBack">← 교사용 안내</button></div>
    <div class="tblwrap"><table class="tbl dash">${head}${body || `<tr><td colspan="${ACTS.length + 8}">${q ? '찾는 이름이 없어요.' : '아직 로그인한 학생이 없어요.'}</td></tr>`}
      <tr class="dash-sum"><td colspan="3"><b>활동별 성공한 학생</b></td>${cnt.map(c => `<td class="dash-c"><b>${c}</b></td>`).join('')}<td colspan="${ACC.server ? 5 : 4}"></td></tr></table></div>
    <details style="margin-top:10px"><summary>활동 번호 보기</summary><ol style="line-height:1.7;margin:8px 0">${ACTS.map(a => `<li>${a.icon} ${esc(a.title)}${a.ai ? ' (AI 개발)' : ''}</li>`).join('')}</ol></details>`, {wide:true, onClose:() => { clearInterval(DASH.timer); DASH.timer = null; }});
  p.querySelector('#dsRe').onclick = async () => { await dashRefresh(); openDashboard(); };
  p.querySelector('#dsBack').onclick = () => { clearInterval(DASH.timer); DASH.timer = null; openGuide(); };
  p.querySelector('#dsCsv').onclick = () => cpCopy(['이름\t레벨\t진행\t' + ACTS.map((a, k) => `${k + 1}.${a.title}`).join('\t'), ...rows.map(r => { const s = r.sum || {}, d = s.done || []; return `${r.name}\t${s.lv || 1}\t${d.length}/${ACTS.length}\t` + ACTS.map(a => d.includes(a.id) ? 'O' : '').join('\t'); })].join('\n'));
  const fq = p.querySelector('#dsQ'); if (fq){ fq.oninput = () => { DASH.q = fq.value; clearTimeout(DASH.qt); DASH.qt = setTimeout(() => { openDashboard(); const n = $('#dsQ'); if (n){ n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); }; }
  p.querySelectorAll('[data-pin]').forEach(b => b.onclick = async () => {
    if (!confirm('이 학생의 비밀번호를 지울까요? 학생이 다음에 로그인할 때 새 비밀번호를 정해요. 기록은 그대로예요.')) return;
    try { await api('api/teacher/reset', {code:DASH.code, id:b.dataset.pin}); toast('비밀번호를 지웠어요.', 'ok'); } catch (e) { toast('하지 못했어요.', 'bad'); }
  });
  clearInterval(DASH.timer);
  if (ACC.server) DASH.timer = setInterval(async () => { if (!$('#panel .dash')) { clearInterval(DASH.timer); return; } await dashRefresh(); if ($('#panel .dash')) openDashboard(); }, 20000);
}
