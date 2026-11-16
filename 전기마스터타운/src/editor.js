/* =========================================================
   5. 맵 만들기 (크리에이티브 모드) · 친구 맵 플레이
   ========================================================= */
const ED = {map:null, id:null, tool:'.', down:false, rect:null, hover:null, from:'title', area:null};
const PAL_TILES = ['.', ',', '=', ':', '_', 'g', '~', '#', 'B', 'T', 'F', 'D'];
const SCENE_ICONS = ['🔌', '🔌🔌', '💧🔌', '✋🔌', '👶🔌', '📺', '💡', '☀️💡', '🧊', '❄️', '💨', '🔋', '🍳', '🖥️', '➰⚡', '🌀'];
const DEV_ICONS = ['⚡', '🧲', '🔔', '🚪', '🎮', '🔦', '🚲', '🧸'];

function blankMap(w = 32, h = 22){
  const tiles = makeGrid(w, h, '.');
  for (let x = 0; x < w; x++){ tiles[0][x] = 'T'; tiles[h - 1][x] = 'T'; }
  for (let y = 0; y < h; y++){ tiles[y][0] = 'T'; tiles[y][w - 1] = 'T'; }
  return {title:'', team:'', w, h, tiles, objects:[], spawn:{x:Math.floor(w / 2), y:h - 3}};
}
function sampleMap(){
  const m = blankMap(28, 18); const g = m.tiles;
  fillR(g, 1, 9, 26, 2, ':'); fillR(g, 13, 1, 2, 16, ':');
  room(g, 2, 2, 9, 6, 6, 7); room(g, 17, 2, 9, 6, 21, 7); room(g, 2, 11, 9, 6, 6, 11);
  fillR(g, 17, 12, 8, 4, ','); g[13][19] = 'T'; g[14][23] = 'T';
  m.title = '예시 마을'; m.spawn = {x:14, y:10};
  m.objects = [
    {type:'scene', x:4, y:4, icon:'💧🔌', label:'danger', text:'욕실에서 젖은 손으로 드라이어를 켰다', why:'물기 있는 손은 감전 위험이 커요.'},
    {type:'scene', x:8, y:4, icon:'📺', label:'waste', text:'아무도 안 보는 TV가 켜져 있다', why:'보지 않을 때는 꺼서 전기를 아껴요.'},
    {type:'scene', x:20, y:4, icon:'✋🔌', label:'good', text:'플러그 머리를 잡고 뽑았다', why:'전선을 당기지 않아야 안전해요.'},
    {type:'device', x:23, y:4, name:'선풍기', icon:'fan', props:['power'], desc:'전동기 전자석의 세기를 바꿔 바람 세기를 조절해요.'},
    {type:'device', x:5, y:14, name:'세탁기', icon:'washer', props:['pole'], desc:'극의 방향을 번갈아 바꿔 세탁통을 좌우로 돌려요.'},
    {type:'sign', x:12, y:8, text:'예시 마을이에요. 고쳐서 우리 모둠 맵으로 만들어 보세요!'},
  ];
  return m;
}
function cloneMap(m){ return JSON.parse(JSON.stringify(m)); }

/* ----- 맵 코드 ----- */
function rleEncode(tiles){
  const s = tiles.map(r => r.join('')).join(''); let out = '', i = 0;
  while (i < s.length){ let j = i; while (j < s.length && s[j] === s[i] && j - i < 999) j++; out += (j - i > 1 ? j - i : '') + s[i]; i = j; }
  return out;
}
function rleDecode(str, w, h){
  const flat = []; let num = '';
  for (const ch of String(str)){ if (ch >= '0' && ch <= '9'){ num += ch; continue; } const n = Math.min(+num || 1, w * h); for (let k = 0; k < n; k++) flat.push(ch); num = ''; }
  const g = [];
  for (let y = 0; y < h; y++){ const row = []; for (let x = 0; x < w; x++){ const ch = flat[y * w + x]; row.push(TILES[ch] && ch !== 'r' ? ch : '.'); } g.push(row); }
  return g;
}
function encodeMap(m){
  const o = {v:1, t:m.title, g:m.team, w:m.w, h:m.h, r:rleEncode(m.tiles), s:[m.spawn.x, m.spawn.y],
    o:m.objects.map(x => x.type === 'scene' ? ['s', x.x, x.y, x.text, x.label, x.why, x.icon] : x.type === 'device' ? ['d', x.x, x.y, x.name, x.icon, x.props, x.desc] : ['n', x.x, x.y, x.text])};
  const bytes = new TextEncoder().encode(JSON.stringify(o)); let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return 'EMT1-' + btoa(bin);
}
function cut(s, n){ return String(s == null ? '' : s).slice(0, n); }
function decodeMap(code){
  code = String(code || '').trim().replace(/\s+/g, '');
  if (!code.startsWith('EMT1-')) throw new Error('맵 코드는 EMT1- 로 시작해요.');
  const bin = atob(code.slice(5)), bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  const o = JSON.parse(new TextDecoder().decode(bytes));
  const w = clamp(Math.floor(+o.w) || 0, 12, 48), h = clamp(Math.floor(+o.h) || 0, 10, 40);
  const m = {title:cut(o.t, 20), team:cut(o.g, 12), w, h, tiles:rleDecode(o.r, w, h), objects:[], spawn:{x:clamp(Math.floor(+(o.s || [])[0]) || 1, 0, w - 1), y:clamp(Math.floor(+(o.s || [])[1]) || 1, 0, h - 1)}};
  const used = new Set();
  for (const a of Array.isArray(o.o) ? o.o.slice(0, 80) : []){
    if (!Array.isArray(a)) continue;
    const x = Math.floor(+a[1]), y = Math.floor(+a[2]);
    if (!(x >= 0 && y >= 0 && x < w && y < h) || used.has(x + ',' + y)) continue;
    if (a[0] === 's' && LABELS[a[4]]) m.objects.push({type:'scene', x, y, text:cut(a[3], 60), label:a[4], why:cut(a[5], 80), icon:cut(a[6], 12) || '❓'});
    else if (a[0] === 'd') m.objects.push({type:'device', x, y, name:cut(a[3], 16) || '전기 기기', icon:cut(a[4], 12) || '⚡', props:(Array.isArray(a[5]) ? a[5] : []).filter(k => PROPS[k]), desc:cut(a[6], 100)});
    else if (a[0] === 'n') m.objects.push({type:'sign', x, y, text:cut(a[3], 60)});
    else continue;
    used.add(x + ',' + y);
  }
  return m;
}

/* ----- 맵 점검 ----- */
function checkMap(m){
  const out = [], occ = new Set(m.objects.map(o => o.x + ',' + o.y));
  const free = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !isSolidTile(m.tiles[y][x]) && !occ.has(x + ',' + y);
  const scenes = m.objects.filter(o => o.type === 'scene'), devs = m.objects.filter(o => o.type === 'device');
  if (!free(m.spawn.x, m.spawn.y)) out.push(['bad', '시작 위치(🚩)가 벽이나 물체로 막혀 있어요.']); else out.push(['ok', '시작 위치가 괜찮아요.']);
  out.push(scenes.length >= 3 ? ['ok', `상황 카드 ${scenes.length}개`] : ['warn', `상황 카드를 3개 이상 놓아요. (지금 ${scenes.length}개)`]);
  const kinds = new Set(scenes.map(s => s.label));
  out.push(kinds.size >= 3 ? ['ok', '바른 사용·위험·낭비가 모두 있어요.'] : ['warn', '바른 사용·위험·낭비를 골고루 넣으면 로봇을 더 공정하게 시험할 수 있어요.']);
  out.push(devs.length >= 2 ? ['ok', `전자석 기기 ${devs.length}개`] : ['warn', `전자석 기기를 2개 이상 놓아 보세요. (지금 ${devs.length}개)`]);
  const noProp = devs.filter(d => !d.props.length).length; if (noProp) out.push(['bad', `이용하는 성질을 고르지 않은 기기가 ${noProp}개 있어요.`]);
  const noWhy = scenes.filter(s => !s.why.trim()).length; if (noWhy) out.push(['warn', `까닭을 쓰지 않은 상황 카드가 ${noWhy}개 있어요.`]);
  // 닿을 수 있는지
  const seen = new Set(); const q = []; if (free(m.spawn.x, m.spawn.y)){ q.push([m.spawn.x, m.spawn.y]); seen.add(m.spawn.x + ',' + m.spawn.y); }
  while (q.length){ const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!seen.has(k) && free(nx, ny)){ seen.add(k); q.push([nx, ny]); } } }
  const unreach = m.objects.filter(o => ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((o.x + dx) + ',' + (o.y + dy))));
  out.push(unreach.length ? ['bad', `시작 위치에서 갈 수 없는 물체가 ${unreach.length}개 있어요. 문이나 길을 만들어 주세요.`] : ['ok', '모든 물체에 걸어서 갈 수 있어요.']);
  const priv = m.objects.some(o => privacyIssue((o.text || '') + (o.why || '') + (o.desc || '') + (o.name || ''))) || privacyIssue(m.title + m.team);
  if (priv) out.push(['warn', '실제 연락처·학교 같은 개인정보로 보이는 글이 있어요. 지워 주세요.']);
  return out;
}

/* ----- 에디터 화면 ----- */
function enterEditor(from){
  closePanelSilently(); $('#dialog').hidden = true; UI.dialog = null;
  ED.from = from || (WORLD && WORLD.kind === 'story' && MODE !== 'title' ? 'story' : ED.from || 'title');
  if (!ED.map){
    try { ED.map = SAVE.draft ? decodeMap(SAVE.draft) : blankMap(); ED.id = SAVE.draftId || null; } catch (e) { ED.map = blankMap(); }
  }
  MODE = 'editor'; showHUD(false); $('#title').hidden = true; $('#editor').hidden = false;
  $('#patrolBar').hidden = true; $('#customBar').hidden = true;
  $('#edTitle').value = ED.map.title; $('#edTeam').value = ED.map.team;
  renderPalette(); edStatus();
}
function saveDraft(){ try { SAVE.draft = encodeMap(ED.map); SAVE.draftId = ED.id; persist(); } catch (e) {} }
function renderPalette(){
  const tileBtn = ch => { const d = TILES[ch]; return `<button class="tool ${ED.tool === ch ? 'sel' : ''}" data-tool="${ch}"><i style="background:${d.pat === 'tree' ? '#2f7f2c' : d.c}"></i>${d.n}</button>`; };
  const objBtn = (k, ico, name) => `<button class="tool ${ED.tool === k ? 'sel' : ''}" data-tool="${k}"><i style="background:#f7f2e8;border-color:#c9bda6">${ico}</i>${name}</button>`;
  $('#edPal').innerHTML = `<h5>땅</h5>${['.', ',', '=', ':', '_', 'g', '~'].map(tileBtn).join('')}
    <h5>블록</h5>${['#', 'B', 'T', 'F', 'D'].map(tileBtn).join('')}${objBtn('house', '🏠', '집 짓기 (끌기)')}
    <h5>놓기</h5>${objBtn('scene', '🃏', '상황 카드')}${objBtn('device', '⚡', '전자석 기기')}${objBtn('sign', '🪧', '표지판')}${objBtn('spawn', '🚩', '시작 위치')}
    <h5>고치기</h5>${objBtn('select', '👆', '물체 고치기')}${objBtn('erase', '🧽', '물체 지우기')}
    <button class="tool" id="edSample"><i style="background:#3a3110">📄</i>예시 맵 불러오기</button>`;
  $('#edPal').querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { ED.tool = b.dataset.tool; renderPalette(); edStatus(); });
  $('#edSample').onclick = () => { ED.map = sampleMap(); ED.id = null; $('#edTitle').value = ED.map.title; $('#edTeam').value = ''; saveDraft(); edStatus(); toast('예시 맵을 불러왔어요. 고쳐서 우리 맵으로 만들어요.'); };
}
function edStatus(){
  const m = ED.map, sc = m.objects.filter(o => o.type === 'scene').length, dv = m.objects.filter(o => o.type === 'device').length;
  const tip = {house:'끌어서 네모를 그리면 벽·바닥·문이 생겨요', scene:'칸을 누르면 상황 카드를 만들어요', device:'칸을 누르면 전자석 기기를 놓아요', sign:'칸을 누르면 표지판을 놓아요', spawn:'시작 위치를 정해요', select:'물체를 누르면 고칠 수 있어요', erase:'물체를 누르면 지워요'}[ED.tool] || '누르거나 끌어서 칠해요';
  $('#edStatus').textContent = `${m.w}×${m.h} · 상황 카드 ${sc} · 기기 ${dv} · ${tip}`;
}
function edLayout(){
  const r = $('#edArea').getBoundingClientRect(), m = ED.map;
  const et = clamp(Math.floor(Math.min((r.width - 16) / m.w, (r.height - 16) / m.h)), 8, 44);
  ED.area = {et, ox:Math.round(r.left + (r.width - m.w * et) / 2), oy:Math.round(r.top + (r.height - m.h * et) / 2)};
  return ED.area;
}
function edTileFromEvent(e){
  if (G3.ok) return ed3Pick(e);
  const A = ED.area || edLayout(); const x = Math.floor((e.clientX - A.ox) / A.et), y = Math.floor((e.clientY - A.oy) / A.et);
  return (x >= 0 && y >= 0 && x < ED.map.w && y < ED.map.h) ? {x, y} : null;
}
function objAtMap(m, x, y){ return m.objects.find(o => o.x === x && o.y === y); }
function renderEditor(){
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = '#10181f'; ctx.fillRect(0, 0, CW, CH);
  if (!ED.map) return;
  const m = ED.map, A = edLayout(), et = A.et;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++){
    const ch = m.tiles[y][x], d = TILES[ch], px = A.ox + x * et, py = A.oy + y * et;
    if (d.h > 0 && d.pat !== 'tree'){ ctx.drawImage(blockTopSprite(ch), px, py, et, et); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(px, py + et - Math.max(2, et * .18), et, Math.max(2, et * .18)); }
    else { ctx.drawImage(groundSprite(d.h > 0 ? (GROUND_OF[ch] || '.') : ch, (x * 7 + y * 13) & 3), px, py, et + .5, et + .5);
      if (d.pat === 'tree'){ ctx.fillStyle = '#2f7f2c'; ctx.beginPath(); ctx.arc(px + et / 2, py + et / 2, et * .44, 0, 7); ctx.fill(); ctx.fillStyle = '#4fae45'; ctx.beginPath(); ctx.arc(px + et * .42, py + et * .4, et * .2, 0, 7); ctx.fill(); } }
  }
  ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1;
  for (let x = 0; x <= m.w; x++){ ctx.beginPath(); ctx.moveTo(A.ox + x * et + .5, A.oy); ctx.lineTo(A.ox + x * et + .5, A.oy + m.h * et); ctx.stroke(); }
  for (let y = 0; y <= m.h; y++){ ctx.beginPath(); ctx.moveTo(A.ox, A.oy + y * et + .5); ctx.lineTo(A.ox + m.w * et, A.oy + y * et + .5); ctx.stroke(); }
  for (const o of m.objects){
    const cx = A.ox + (o.x + .5) * et, cy = A.oy + (o.y + .5) * et;
    ctx.fillStyle = o.type === 'scene' ? 'rgba(255,255,255,.85)' : o.type === 'device' ? 'rgba(255,210,63,.75)' : 'rgba(233,211,168,.9)';
    ctx.beginPath(); ctx.arc(cx, cy, et * .46, 0, 7); ctx.fill();
    if (o.type === 'device' && DEV_DRAWN.includes(o.icon)) drawDevIcon(ctx, o.icon, cx, cy, et * .85, TIME);
    else drawEmoji(o.type === 'sign' ? '🪧' : (o.icon || '❓'), cx, cy, et * .7);
    if (o.type === 'scene'){ ctx.fillStyle = LABELS[o.label].color; ctx.fillRect(cx + et * .18, cy - et * .46, et * .26, et * .26); }
  }
  drawEmoji('🚩', A.ox + (m.spawn.x + .5) * et, A.oy + (m.spawn.y + .5) * et, et * .75);
  if (ED.rect){
    const x0 = Math.min(ED.rect.x0, ED.rect.x1), y0 = Math.min(ED.rect.y0, ED.rect.y1), x1 = Math.max(ED.rect.x0, ED.rect.x1), y1 = Math.max(ED.rect.y0, ED.rect.y1);
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.strokeRect(A.ox + x0 * et, A.oy + y0 * et, (x1 - x0 + 1) * et, (y1 - y0 + 1) * et); ctx.setLineDash([]);
  } else if (ED.hover){
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.strokeRect(A.ox + ED.hover.x * et + 1, A.oy + ED.hover.y * et + 1, et - 2, et - 2);
  }
}
function edApply(t, isMove){
  const m = ED.map, tool = ED.tool;
  if (TILES[tool]){ if (m.tiles[t.y][t.x] !== tool){ m.tiles[t.y][t.x] = tool; } return; }
  if (tool === 'erase'){ const i = m.objects.findIndex(o => o.x === t.x && o.y === t.y); if (i >= 0){ m.objects.splice(i, 1); edStatus(); } return; }
  if (isMove) return;
  if (tool === 'spawn'){ m.spawn = {x:t.x, y:t.y}; return; }
  const ex = objAtMap(m, t.x, t.y);
  if (tool === 'select'){ if (ex) openObjForm(ex.type, t, ex); return; }
  if (['scene', 'device', 'sign'].includes(tool)){
    if (ex) return openObjForm(ex.type, t, ex);
    if (m.objects.length >= 80) return toast('물체는 80개까지 놓을 수 있어요.', 'bad');
    openObjForm(tool, t, null);
  }
}
function edPointerDown(e){
  if (uiBlocking()) return;
  const t = edTileFromEvent(e); if (!t) return;
  ED.down = true; try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  if (ED.tool === 'house'){ ED.rect = {x0:t.x, y0:t.y, x1:t.x, y1:t.y}; return; }
  edApply(t, false);
}
function edPointerMove(e){
  const t = edTileFromEvent(e); ED.hover = t;
  if (!ED.down || !t) return;
  if (ED.tool === 'house' && ED.rect){ ED.rect.x1 = t.x; ED.rect.y1 = t.y; return; }
  if (TILES[ED.tool] || ED.tool === 'erase') edApply(t, true);
}
function edPointerUp(){
  if (!ED.down) return; ED.down = false;
  if (ED.tool === 'house' && ED.rect){
    const r = ED.rect, x0 = Math.min(r.x0, r.x1), y0 = Math.min(r.y0, r.y1), w = Math.abs(r.x1 - r.x0) + 1, h = Math.abs(r.y1 - r.y0) + 1;
    ED.rect = null;
    if (w < 4 || h < 4) return toast('집은 가로·세로 4칸 이상으로 끌어 주세요.', 'bad');
    room(ED.map.tiles, x0, y0, w, h, x0 + Math.floor(w / 2), y0 + h - 1);
    ED.map.objects = ED.map.objects.filter(o => !(o.x >= x0 && o.x < x0 + w && o.y >= y0 && o.y < y0 + h && (o.x === x0 || o.y === y0 || o.x === x0 + w - 1 || o.y === y0 + h - 1)));
    SND.tick();
  }
  saveDraft(); edStatus();
}
function openObjForm(type, t, ex){
  const m = ED.map;
  if (type === 'scene'){
    const o = ex || {type:'scene', x:t.x, y:t.y, text:'', label:'danger', why:'', icon:'🔌'};
    const p = openPanel(`<h2>상황 카드</h2><p class="sub">친구가 판단하고 AI 로봇이 읽을 장면이에요. 로봇은 <b>문장</b>만 보고 판단해요.</p>
      <div class="fieldset"><label for="fT">상황 문장</label><input id="fT" maxlength="60" value="${esc(o.text)}" placeholder="예: 멀티탭 하나에 전기난로와 다리미를 꽂았다"></div>
      <div class="fieldset"><label>정답</label><div class="row">${LABEL_KEYS.map(k => `<label class="btn small ${o.label === k ? 'on' : ''}" style="cursor:pointer"><input type="radio" name="fL" value="${k}" ${o.label === k ? 'checked' : ''} style="display:none">${LABELS[k].icon} ${LABELS[k].name}</label>`).join('')}</div></div>
      <div class="fieldset"><label for="fW">까닭 (정답을 확인할 때 보여 줘요)</label><input id="fW" maxlength="80" value="${esc(o.why)}" placeholder="예: 한꺼번에 많은 전기가 흐르면 불이 날 수 있어요."></div>
      <div class="fieldset"><label>그림</label><div class="row" id="fI">${SCENE_ICONS.map(ic => `<button class="btn small ${o.icon === ic ? 'on' : ''}" data-ic="${esc(ic)}">${ic}</button>`).join('')}</div></div>
      <p class="note">실제 이름·학교·연락처는 쓰지 않아요.</p>
      <div class="row"><button class="btn primary" id="fSave">저장</button>${ex ? '<button class="btn" id="fDel">지우기</button>' : ''}<button class="btn" data-close>취소</button></div>`);
    let icon = o.icon;
    p.querySelectorAll('[name="fL"]').forEach(r => r.onchange = () => p.querySelectorAll('[name="fL"]').forEach(x => x.parentElement.classList.toggle('on', x.checked)));
    p.querySelectorAll('[data-ic]').forEach(b => b.onclick = () => { icon = b.dataset.ic; p.querySelectorAll('[data-ic]').forEach(x => x.classList.toggle('on', x === b)); });
    p.querySelector('#fSave').onclick = () => {
      const text = p.querySelector('#fT').value.trim(); if (text.length < 4) return toast('상황 문장을 써 주세요.', 'bad');
      if (privacyIssue(text + p.querySelector('#fW').value)) return toast('개인정보로 보이는 글은 쓰지 않아요.', 'bad');
      Object.assign(o, {text, label:p.querySelector('[name="fL"]:checked').value, why:p.querySelector('#fW').value.trim(), icon});
      if (!ex) m.objects.push(o); saveDraft(); edStatus(); closePanel();
    };
    if (ex) p.querySelector('#fDel').onclick = () => { m.objects.splice(m.objects.indexOf(ex), 1); saveDraft(); edStatus(); closePanel(); };
  } else if (type === 'device'){
    const o = ex || {type:'device', x:t.x, y:t.y, name:'선풍기', icon:'fan', props:['power'], desc:DEVICES[0].desc};
    const preset = DEVICES.find(d => d.name === o.name && d.icon === o.icon);
    const p = openPanel(`<h2>전자석 기기</h2><p class="sub">친구가 이 기기를 찾으면 "어떤 성질을 이용할까?" 퀴즈가 나와요.</p>
      <div class="fieldset"><label for="fK">기기 종류</label><select id="fK">${DEVICES.map(d => `<option value="${d.id}" ${preset && preset.id === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}<option value="custom" ${preset ? '' : 'selected'}>직접 입력</option></select></div>
      <div id="fCustom" ${preset ? 'hidden' : ''}><div class="fieldset"><label for="fN">기기 이름</label><input id="fN" maxlength="16" value="${esc(o.name)}"></div>
        <div class="fieldset"><label>그림</label><div class="row">${DEV_ICONS.map(ic => `<button class="btn small ${o.icon === ic ? 'on' : ''}" data-ic="${ic}">${ic}</button>`).join('')}</div></div></div>
      <div class="fieldset"><label>이용하는 전자석의 성질 (여러 개 고를 수 있어요)</label><div class="row">${Object.entries(PROPS).map(([k, v]) => `<label class="btn small" style="cursor:pointer"><input type="checkbox" value="${k}" ${o.props.includes(k) ? 'checked' : ''}> ${v.short}</label>`).join('')}</div></div>
      <div class="fieldset"><label for="fD">설명 (퀴즈를 맞히면 보여 줘요)</label><textarea id="fD" rows="2" maxlength="100">${esc(o.desc)}</textarea></div>
      <div class="row"><button class="btn primary" id="fSave">저장</button>${ex ? '<button class="btn" id="fDel">지우기</button>' : ''}<button class="btn" data-close>취소</button></div>`);
    let icon = o.icon;
    const sel = p.querySelector('#fK');
    sel.onchange = () => {
      const d = DEVICES.find(x => x.id === sel.value); p.querySelector('#fCustom').hidden = !!d;
      if (d){ icon = d.icon; p.querySelector('#fN').value = d.name; p.querySelector('#fD').value = d.desc; p.querySelectorAll('[type=checkbox]').forEach(c => { c.checked = d.props.includes(c.value); }); }
      else { icon = DEV_ICONS[0]; p.querySelector('#fN').value = ''; }
    };
    p.querySelectorAll('[data-ic]').forEach(b => b.onclick = () => { icon = b.dataset.ic; p.querySelectorAll('[data-ic]').forEach(x => x.classList.toggle('on', x === b)); });
    p.querySelector('#fSave').onclick = () => {
      const d = DEVICES.find(x => x.id === sel.value);
      const name = d ? d.name : p.querySelector('#fN').value.trim();
      const props = [...p.querySelectorAll('[type=checkbox]:checked')].map(c => c.value);
      if (!name) return toast('기기 이름을 써 주세요.', 'bad'); if (!props.length) return toast('이용하는 성질을 하나 이상 골라요.', 'bad');
      if (privacyIssue(name + p.querySelector('#fD').value)) return toast('개인정보로 보이는 글은 쓰지 않아요.', 'bad');
      Object.assign(o, {name, icon:d ? d.icon : icon, props, desc:p.querySelector('#fD').value.trim()});
      if (!ex) m.objects.push(o); saveDraft(); edStatus(); closePanel();
    };
    if (ex) p.querySelector('#fDel').onclick = () => { m.objects.splice(m.objects.indexOf(ex), 1); saveDraft(); edStatus(); closePanel(); };
  } else {
    const o = ex || {type:'sign', x:t.x, y:t.y, text:''};
    const p = openPanel(`<h2>표지판</h2><div class="fieldset"><label for="fT">표지판 글</label><input id="fT" maxlength="60" value="${esc(o.text)}" placeholder="예: ← 우리 모둠 집"></div>
      <div class="row"><button class="btn primary" id="fSave">저장</button>${ex ? '<button class="btn" id="fDel">지우기</button>' : ''}<button class="btn" data-close>취소</button></div>`);
    p.querySelector('#fSave').onclick = () => {
      const text = p.querySelector('#fT').value.trim(); if (!text) return toast('글을 써 주세요.', 'bad');
      if (privacyIssue(text)) return toast('개인정보로 보이는 글은 쓰지 않아요.', 'bad');
      o.text = text; if (!ex) m.objects.push(o); saveDraft(); closePanel();
    };
    if (ex) p.querySelector('#fDel').onclick = () => { m.objects.splice(m.objects.indexOf(ex), 1); saveDraft(); closePanel(); };
  }
}
function openCheckPanel(){
  const res = checkMap(ED.map);
  openPanel(`<h2>맵 점검</h2><p class="sub">친구에게 보내기 전에 확인해요. 빨간 항목은 꼭 고쳐요.</p>
    <div style="display:grid;gap:6px">${res.map(([k, t]) => `<div class="${k === 'ok' ? 'okbox' : k === 'bad' ? 'warnbox' : 'note'}">${k === 'ok' ? '✓' : k === 'bad' ? '✗' : '!'} ${t}</div>`).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn" data-close>닫기</button></div>`);
}
function saveMapToList(){
  const m = ED.map; m.title = $('#edTitle').value.trim() || '이름 없는 맵'; m.team = $('#edTeam').value.trim();
  if (privacyIssue(m.title + m.team)) return toast('맵 이름이나 모둠 이름에 개인정보를 쓰지 않아요.', 'bad');
  const code = encodeMap(m), now = Date.now();
  const ex = ED.id && SAVE.maps.find(x => x.id === ED.id);
  if (ex) Object.assign(ex, {title:m.title, team:m.team, code, updated:now});
  else { if (SAVE.maps.length >= 20) return toast('맵은 20개까지 저장할 수 있어요. 안 쓰는 맵을 지워 주세요.', 'bad'); ED.id = 'm' + now; SAVE.maps.push({id:ED.id, title:m.title, team:m.team, code, updated:now}); }
  saveDraft(); persist(); SND.ok(); toast(`'${m.title}' 저장했어요.`, 'ok');
}
function openMapList(){
  const p = openPanel(`<h2>내 맵</h2><p class="sub">이 기기에 저장한 맵이에요.</p>
    ${SAVE.maps.length ? `<div style="display:grid;gap:8px">${SAVE.maps.slice().reverse().map(x => `<div class="card row" style="justify-content:space-between"><div><b>${esc(x.title)}</b> <small style="color:var(--text-dim)">${esc(x.team)} · ${new Date(x.updated).toLocaleString('ko-KR')}</small></div>
      <div class="row"><button class="btn small" data-e="${x.id}">편집</button><button class="btn small" data-p="${x.id}">플레이</button><button class="btn small" data-d="${x.id}">지우기</button></div></div>`).join('')}</div>` : '<p>아직 저장한 맵이 없어요.</p>'}
    <div class="row" style="margin-top:12px"><button class="btn" data-close>닫기</button></div>`);
  const get = id => SAVE.maps.find(x => x.id === id);
  p.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { const x = get(b.dataset.e); try { ED.map = decodeMap(x.code); ED.id = x.id; $('#edTitle').value = ED.map.title; $('#edTeam').value = ED.map.team; saveDraft(); edStatus(); closePanel(); } catch (e) { toast('맵을 열 수 없어요.', 'bad'); } });
  p.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { try { const m = decodeMap(get(b.dataset.p).code); closePanel(); loadCustomWorld(m, true); } catch (e) { toast('맵을 열 수 없어요.', 'bad'); } });
  p.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
    if (b.dataset.sure){ SAVE.maps = SAVE.maps.filter(x => x.id !== b.dataset.d); if (ED.id === b.dataset.d) ED.id = null; persist(); openMapList(); }
    else { b.dataset.sure = '1'; b.textContent = '정말 지울까요?'; b.classList.add('primary'); }
  });
}
function openCodePanel(){
  const m = ED.map; m.title = $('#edTitle').value.trim() || '이름 없는 맵'; m.team = $('#edTeam').value.trim();
  const code = encodeMap(m);
  const p = openPanel(`<h2>맵 코드</h2><p class="sub">이 코드를 복사해 패들렛에 올리면 친구가 [친구 맵 불러오기]로 우리 맵을 열 수 있어요.</p>
    <textarea id="cdOut" rows="5" readonly style="font-family:monospace;font-size:12px">${esc(code)}</textarea>
    <div class="row" style="margin-top:8px"><button class="btn primary" id="cdCopy">복사하기</button><span class="sub" style="margin:0">코드 길이 ${code.length}자</span></div>
    <h3>친구 맵 코드 붙여넣기</h3><textarea id="cdIn" rows="4" placeholder="EMT1-로 시작하는 코드를 붙여 넣어요" style="font-family:monospace;font-size:12px" aria-label="맵 코드 입력"></textarea>
    <div class="row" style="margin-top:8px"><button class="btn" id="cdLoad">불러와서 편집하기</button><button class="btn" data-close>닫기</button></div>`);
  const ta = p.querySelector('#cdOut');
  p.querySelector('#cdCopy').onclick = () => {
    const done = () => toast('복사했어요!', 'ok');
    try { navigator.clipboard.writeText(code).then(done, () => { ta.select(); toast('코드를 길게 눌러 복사해 주세요.'); }); } catch (e) { ta.select(); toast('코드를 선택했어요. 복사해 주세요.'); }
  };
  p.querySelector('#cdLoad').onclick = () => {
    try { ED.map = decodeMap(p.querySelector('#cdIn').value); ED.id = null; $('#edTitle').value = ED.map.title; $('#edTeam').value = ED.map.team; saveDraft(); edStatus(); closePanel(); toast('불러왔어요. 저장하면 내 맵이 돼요.', 'ok'); }
    catch (e) { toast('코드를 읽을 수 없어요. 처음부터 끝까지 빠짐없이 붙여 넣었는지 확인해요.', 'bad'); }
  };
}
function openImport(){
  const p = openPanel(`<h2>친구 맵 불러오기</h2><p class="sub">패들렛 등에서 받은 맵 코드(EMT1-로 시작)를 붙여 넣어요.</p>
    <textarea id="imIn" rows="5" style="font-family:monospace;font-size:12px" aria-label="맵 코드 입력"></textarea>
    <div class="row" style="margin-top:8px"><button class="btn primary" id="imGo">불러오기</button><button class="btn" data-close>닫기</button></div><div id="imRes" style="margin-top:10px"></div>`);
  p.querySelector('#imGo').onclick = () => {
    let m; try { m = decodeMap(p.querySelector('#imIn').value); } catch (e) { p.querySelector('#imRes').innerHTML = '<div class="warnbox">코드를 읽을 수 없어요. 처음부터 끝까지 빠짐없이 붙여 넣었는지 확인해요.</div>'; return; }
    const sc = m.objects.filter(o => o.type === 'scene').length, dv = m.objects.filter(o => o.type === 'device').length;
    p.querySelector('#imRes').innerHTML = `<div class="card"><h4>${esc(m.title || '이름 없는 맵')}</h4><p style="margin:0 0 8px;font-size:14px;color:var(--text-dim)">${esc(m.team)} · ${m.w}×${m.h} · 상황 카드 ${sc}개 · 기기 ${dv}개</p>
      <div class="row"><button class="btn primary" id="imPlay">플레이</button><button class="btn volt" id="imPatrol">내 로봇으로 순찰</button><button class="btn" id="imEdit">편집해서 내 맵으로</button></div></div>`;
    p.querySelector('#imPlay').onclick = () => { closePanel(); loadCustomWorld(m, false); };
    p.querySelector('#imPatrol').onclick = () => { if (!trainedModel()) return toast('먼저 AI 연구소에서 로봇을 가르쳐요.', 'bad'); closePanel(); loadCustomWorld(m, false); askCustomPatrol(); };
    p.querySelector('#imEdit').onclick = () => { ED.map = m; ED.id = null; saveDraft(); closePanel(); enterEditor('title'); };
  };
}
function askCustomPatrol(){
  const n = WORLD.objects.filter(o => o.type === 'scene').length;
  if (!n) return toast('이 맵에는 상황 카드가 없어요.', 'bad');
  if (!trainedModel()) return toast('먼저 AI 연구소에서 로봇을 가르쳐요.', 'bad');
  const p = openPanel(`<h2>로봇 순찰</h2><p>내가 학습시킨 AI 안전 로봇이 <b>${esc(WORLD.title)}</b>의 상황 카드 ${n}개를 판단해요. 로봇에게는 처음 보는 장면이에요.</p>
    <div class="row"><b>먼저 예상해요.</b> 몇 개를 맞힐까요? <input id="cpPred" type="number" min="0" max="${n}" value="${Math.round(n * .7)}" style="width:80px" aria-label="예상 개수"> 개 <button class="btn volt" id="cpGo">순찰 시작</button></div>`);
  p.querySelector('#cpGo').onclick = () => startPatrol('custom', clamp(+p.querySelector('#cpPred').value || 0, 0, n));
}

/* ----- 친구 맵(직접 만든 맵) 플레이 ----- */
const CUSTOM = {judged:{}, devDone:{}, fromEditor:false};
function loadCustomWorld(m, fromEditor){
  let k = 0;
  const objects = m.objects.map(o => ({...o, id:'c' + (k++), name:o.type === 'scene' ? '살펴볼 장면' : o.type === 'device' ? o.name : '표지판'}));
  loadWorld({kind:'custom', title:m.title || '이름 없는 맵', w:m.w, h:m.h, tiles:m.tiles.map(r => r.slice()), objects,
    spawn:{x:m.spawn.x + .5, y:m.spawn.y + .62}, lines:[], crosswalks:[], cars:[]});
  CUSTOM.judged = {}; CUSTOM.devDone = {}; CUSTOM.fromEditor = !!fromEditor;
  $('#title').hidden = true; $('#editor').hidden = true;
  MODE = 'play'; showHUD(true); $('#customBar').hidden = false; $('#patrolBar').hidden = true; UI.waypoint = null;
  placePlayer(WORLD.spawn.x, WORLD.spawn.y); clampCam(); updateCustomBar(); updateHUD();
}
function updateCustomBar(){
  const sc = WORLD.objects.filter(o => o.type === 'scene'), dv = WORLD.objects.filter(o => o.type === 'device');
  const js = sc.filter(o => CUSTOM.judged[o.id]), ok = js.filter(o => CUSTOM.judged[o.id].choice === o.label).length;
  $('#customText').textContent = `${WORLD.title} · 상황 카드 ${js.length}/${sc.length} (맞힘 ${ok}) · 기기 ${dv.filter(o => CUSTOM.devDone[o.id]).length}/${dv.length}`;
  if (sc.length && js.length === sc.length && dv.every(o => CUSTOM.devDone[o.id]) && !CUSTOM.doneToast){ CUSTOM.doneToast = true; toast('이 맵을 모두 살펴봤어요! 만든 친구에게 피드백을 남겨요.', 'ok'); }
}
function interactCustom(o){
  if (o.type === 'scene') return openSceneJudge(o, c => { CUSTOM.judged[o.id] = {choice:c}; updateCustomBar(); }, CUSTOM.judged[o.id], false);
  if (o.type === 'device') return openDeviceQuiz(o, () => { CUSTOM.devDone[o.id] = true; updateCustomBar(); }, CUSTOM.devDone[o.id]);
  if (o.type === 'sign') return showDialog('표지판', [o.text]);
}
function exitCustom(){
  CUSTOM.doneToast = false;
  if (ROBOT.active){ ROBOT.active = false; ROBOT.onDone = null; }
  if (CUSTOM.fromEditor) enterEditor(); else showTitle();
}
