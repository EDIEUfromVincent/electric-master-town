/* =========================================================
   🚪 구역 엔진 — 차시 구역 문 · 방 · 포털 (무엇을 넣을지는 course.js)
   · 마을 광장에 차시마다 큰 문이 하나씩 선다. 문 앞에서 E를 누르면 카메라가 문을 가까이 비추고,
     주인공이 빛 속으로 걸어 들어가면 화면이 하얘지며 구역의 첫 방(또는 아직 못 끝낸 방)으로 바뀐다.
   · 구역 안의 방들은 옆으로 이어져 있다. 방 양쪽 벽의 포털에 다가가면 옆 방으로 넘어간다.
     오른쪽 포털은 그 방의 활동을 끝내야 열린다. 첫 방 왼쪽과 끝 방 오른쪽 포털은 마을로 나가는 출구다.
   · 구역은 차시 순서와 상관없이 들어갈 수 있다(open에 적은 것만 먼저 갖추면). 구역마다 '끝내는 데 필요한 것(need)'과
     '처음 들어갈 때 타고 와야 하는 것(ride)'을 둘 수 있다.
   ========================================================= */
const ZONE = {zone:null, idx:0, room:null, town:null, borrow:null, gate:null, hop:null, ease:0, focus:null, armed:true,
  saveT:0, tickT:0, lockT:0, teaseAt:0, cardT:null};

/* ----- 필요한 것 · 탈것 (course.js에서 이름으로 부른다) ----- */
const ZONE_NEEDS = {
  bike:{label:'🚲 길가 친구를 모두 만나 전기 자전거 받기',
    ok:() => !!(SAVE.bike && SAVE.bike.got) && bikeUnlocked(),
    route:() => {   /* 아직 못 만난 가장 가까운 친구 → 다 만났으면 자전거 거치대 */
      if (!(SAVE.bike && SAVE.bike.got)) return null;
      if (bikeUnlocked()) return null;
      let best = null, bd = 1e9;
      for (const w of (WORLD.walkers || [])){ if (friendMet(w.def) || walkerHidden(w)) continue; const d = Math.hypot(w.x + .5 - player.x, w.y + .5 - player.y); if (d < bd){ bd = d; best = w; } }
      return best ? {x:Math.round(best.x), y:Math.round(best.y), label:`💬 ${best.name}`} : null;
    }},
};
const ZONE_RIDES = {
  bike:{label:'전기 자전거', on:() => !!(SAVE.bike && SAVE.bike.on) && bikeUnlocked(), hint:'충전소 옆 거치대에서 자전거를 꺼내 타고(B) 와요.', rack:{x:30, y:40, label:'🚲 전기 자전거 거치대'}},
};

/* ----- 저장 ----- */
function zState(){
  if (!SAVE.zone || typeof SAVE.zone !== 'object'){
    SAVE.zone = {cur:null, room:0, pos:null, seen:{}, clear:{}, teased:false};
    for (const z of COURSE.zones) if (zoneDone(z)) SAVE.zone.clear[z.id] = true;   /* 예전 기록: 이미 끝낸 구역은 축하 창 없이 */
  }
  const s = SAVE.zone; s.seen = s.seen || {}; s.clear = s.clear || {};
  return s;
}

/* ----- 찾기 ----- */
const zoneById = id => COURSE.zones.find(z => z.id === id) || (COURSE.places || []).find(z => z.id === id) || (COURSE.finale && COURSE.finale.id === id ? COURSE.finale : undefined);
const zoneLabel = z => z.free ? z.name : `${z.no}차시 · ${z.name}`;
const zoneTag = z => z.free ? (z.tag || '자유 탐험') : `${z.no}차시`;
const zoneAll = () => COURSE.zones.concat(COURSE.places || [], COURSE.finale ? [COURSE.finale] : []);
const inRoom = () => !!(WORLD && WORLD.kind === 'room');
const ROOM_NO = '①②③④⑤⑥⑦⑧⑨';
/* '로/으로' 고르기: 받침이 없거나 ㄹ이면 '로' */
const euro = w => { const c = String(w).charCodeAt(String(w).length - 1), k = c >= 0xAC00 && c <= 0xD7A3 ? (c - 0xAC00) % 28 : 0; return k === 0 || k === 8 ? '로' : '으로'; };
function zoneOfAct(id){
  for (const z of COURSE.zones){
    const r = z.rooms.findIndex(q => q.act === id); if (r >= 0) return {z, r};
    if ((z.town || []).includes(id)) return {z, r:-1};
  }
  return null;
}
const zoneActs = z => z.rooms.map(r => r.act).concat(z.town || []).map(actById).filter(Boolean);
const zoneNeedsOk = z => (z.need || []).every(k => ZONE_NEEDS[k] && ZONE_NEEDS[k].ok());
const zoneDone = z => zoneActs(z).every(actDone) && zoneNeedsOk(z) && wrapOk(z);   /* 정리 회의까지 마쳐야 차시 완료 (wrap.js) */
const zoneRoomOk = (z, i) => z.rooms.slice(0, i).every(r => !r.act || actDone(actById(r.act)));   /* 앞 방을 다 끝내야 들어갈 수 있다 */
/* 구역 문은 차시 순서와 상관없이 열린다. open에 적은 것(예: 3차시의 전기 자전거)만 먼저 갖춰야 한다 */
const zoneOpen = z => z.final ? !!(SAVE.story && SAVE.story.finale) : !!(SAVE.met && SAVE.met.volt) && (z.free || (z.open || []).every(k => ZONE_NEEDS[k] && ZONE_NEEDS[k].ok()));
function zoneLockText(z){
  if (z.final) return '세 차시 정리 회의를 모두 마치고 광장의 점등식이 끝나면 열려요.';
  if (!SAVE.met || !SAVE.met.volt) return '먼저 볼트 박사와 이야기해요.';
  return `${(z.open || []).filter(k => !ZONE_NEEDS[k].ok()).map(k => ZONE_NEEDS[k].label).join(', ')} 해야 열려요. (2차시 마지막 미션)`;
}
const zoneNow = () => COURSE.zones.find(z => !zoneDone(z)) || null;   /* 차시 순서로 볼 때 다음 구역 (추천) */
/* 지금 붙잡고 있는 구역: 방 안이면 그 구역, 마을이면 마지막으로 들어갔던 구역(아직 덜 끝냈으면), 아니면 추천 구역 */
function zoneFocus(){
  if (inRoom()) return ZONE.zone;
  const last = zoneById(zState().last || '');
  return last && !zoneDone(last) ? last : zoneNow();
}

/* 활동 a를 지금 있는 곳에서 할 수 있나 (마을 활동은 마을, 방 활동은 그 방) */
function zoneActHere(a){
  if (!WORLD) return false;
  const L = a && zoneOfAct(a.id);
  if (!L || L.r < 0) return WORLD.kind === 'story';
  return inRoom() && ZONE.zone === L.z && ZONE.idx === L.r;
}
/* 활동 a를 맡은 사람이 있는 곳 (말로 안내할 때) */
function actWhere(a){
  const L = a && zoneOfAct(a.id);
  if (!L || L.r < 0) return ACT_WHERE[a && a.giver] || '마을';
  return `${zoneLabel(L.z)} 구역 「${L.z.rooms[L.r].name}」`;
}

/* ----- 처음 한 번: 활동 장소 이름을 방 이름으로 · 방 지도 검사 ----- */
(function zoneInit(){
  for (const p of COURSE.places || []) p.free = true;
  for (const z of zoneAll()) z.rooms.forEach(r => {
    const a = r.act && actById(r.act);
    if (a){ a.place = r.station.id; a.placeName = `${r.name}의 ${r.station.emoji} ${r.station.name}`; }
    const w = r.map[0].length;
    r.map.forEach((row, j) => { if (row.length !== w) console.warn(`방 지도 줄 길이가 달라요: ${z.id}/${r.id} ${j}번째 줄`); });
    if (a && (!r.map.some(row => row.includes('N')) || !r.map.some(row => row.includes('S')))) console.warn(`방 지도에 N(맡은 사람)이나 S(활동 장소)가 없어요: ${z.id}/${r.id}`);
  });
})();

/* ===== 마을: 구역 문 세우기, 방으로 옮긴 것 치우기 ===== */
function zoneTownSync(){
  if (!WORLD || WORLD.kind !== 'story') return;
  const H = COURSE.townHide || {}, keep = new Set(COURSE.townKeep || []), moved = new Set(H.ids || []);
  for (const z of COURSE.zones) for (const r of z.rooms){
    if (r.station) moved.add(r.station.id);
    const a = actById(r.act); if (a && a.giver && !keep.has(a.giver)) moved.add(a.giver);
  }
  WORLD.objects = WORLD.objects.filter(o => o.type !== 'gate' && !moved.has(o.id) && !(H.types || []).includes(o.type));
  for (const z of zoneAll()){ const door = z.gate.style === 'door';
    WORLD.objects.push({type:'gate', id:'gate_' + z.id, zone:z.id, x:z.gate.x, y:z.gate.y, span:door ? 0 : 1, door, dir:z.gate.face === 'N' ? -1 : 1, name:`🚪 ${z.free ? z.icon + ' ' : ''}${zoneLabel(z)} 들어가기`}); }
  rebuildSolidMap();
}
function zoneTownWorld(){ if (!ZONE.town || ZONE.town.kind !== 'story') ZONE.town = buildStoryWorld(); return ZONE.town; }

/* ===== 방 만들기: 글자 지도 → 세계 ===== */
function zoneBuildRoom(z, i){
  const r = z.rooms[i], H = r.map.length, W = r.map[0].length, tiles = [], objects = [], a = actById(r.act);
  let spawnL = null, spawnR = null;
  for (let y = 0; y < H; y++){
    const row = [];
    for (let x = 0; x < W; x++){
      const ch = r.map[y][x] || '#';
      if (ch === '#'){ row.push('#'); continue; }
      if (ch === '<' || ch === '>'){
        const side = ch === '>' ? 1 : -1, to = i + side, exit = to < 0 || to >= z.rooms.length;
        row.push('D');
        objects.push({type:'portal', id:'portal' + side, side, to:exit ? -1 : to, x, y,
          name:exit ? '🚪 구역 출구 (마을로)' : `${side > 0 ? '▶' : '◀'} ${ROOM_NO[to]} ${z.rooms[to].name}`});
        if (side > 0) spawnR = {x:x - 1.1, y:y + .6}; else spawnL = {x:x + 2.1, y:y + .6};
        continue;
      }
      row.push('_');
      if (/[1-4]/.test(ch) && r.npcs && r.npcs[+ch - 1]){   /* 정리 교실 · 시청 기록실: 그 차시 인물들이 모인다 */
        const n = npcDef(r.npcs[+ch - 1]);
        objects.push({type:'npc', id:n.id, x, y, name:n.name, look:n.look});
      } else if (ch === 'N' && (r.npc || (a && a.giver))){
        const n = r.npc || NPCS.find(q => q.id === a.giver) || {id:a.giver, name:ACT_WHO[a.giver] || a.giver, look:'guide'};
        objects.push({type:'npc', id:n.id || a.giver, x, y, name:n.name, look:n.look});
      } else if (r.things && r.things[ch]){   /* 장소의 볼거리·놀거리 (places.js가 그리고 다룬다) */
        const t = r.things[ch];
        objects.push({...t, type:'thing', id:`${t.kind}_${t.key || x + '_' + y}`, x, y, span:t.span || 0, name:t.name || ''});
      } else if (ch === 'S' && r.station){
        objects.push({type:'mission', id:r.station.id, act:r.station.act, x, y, name:r.station.name, emoji:r.station.emoji});
      } else if (r.props && r.props[ch]){
        const [prop, span = 0, rot = 0, walk = false, badge = null] = r.props[ch];
        objects.push({type:'deco', kind:'prop', prop, id:`prop_${x}_${y}`, x, y, span, ry:rot * Math.PI / 2, walk, badge});
      }
    }
    tiles.push(row);
  }
  const mid = {x:W / 2, y:H / 2};
  return {kind:'room', title:`${zoneLabel(z)} · ${r.name}`, zone:z.id, room:i, w:W, h:H, tiles, objects,
    spawn:spawnL || mid, spawnL:spawnL || mid, spawnR:spawnR || mid, cars:[]};
}

/* ===== 구역 문: 다가가 E ===== */
function zoneGateTalk(o){
  const z = zoneById(o.zone), st = zState();
  if (!zoneOpen(z)) return showDialog('구역 문', [`${z.icon} ${zoneLabel(z)}`, `🔒 ${zoneLockText(z)}`]);
  const R = z.ride && ZONE_RIDES[z.ride];
  if (R && !st.seen[z.id] && !R.on()){
    return showDialog('구역 문', [`${z.icon} ${zoneLabel(z)}`, `🔒 처음 들어갈 때는 ${josa(R.label, '을', '를')} 타고 와야 문이 열려요.`, R.hint],
      () => { UI.waypoint = {...R.rack}; });
  }
  zoneGateStart(z, o);
}
/* 문 클로즈업: 문 앞까지 걸어가 → 문 안으로 → 빛이 차오르고 → 하얗게 → 방 */
function zoneGateStart(z, o){
  closePanelSilently(); UI.waypoint = null;
  /* 문 앞 빈 칸 수: 카메라가 뒤쪽 건물 벽 속으로 들어가지 않게 이만큼만 물러난다 */
  const wallAt = (x, y) => y < 0 || y >= WORLD.h || isSolidTile((WORLD.tiles[y] || [])[x]);   /* 가로등 같은 가는 물체는 빼고 벽·건물·나무만 */
  const d = o.dir || 1, cy = o.y + .5;   /* d = 1: 문이 남쪽(+y)을 본다, -1: 북쪽 */
  let free = 0; while (free < 9 && !wallAt(o.x, o.y + d * (1 + free))) free++;
  ZONE.gate = {z, o, d, ph:'walk', t:0, glow:0, wi:0, free,
    pts:[[o.x + .5, d > 0 ? Math.max(player.y, cy + 1.2) : Math.min(player.y, cy - 1.2)], [o.x + .5, cy + d * .25]]};
  MODE = 'gate'; KEYS.clear(); JOY.x = JOY.y = 0; PATH3.nodes = null; NEAR = null; showHUD(false);
  SND.beep(392, .08, 'triangle', .04);
}
function zoneGateUpdate(dt){
  const G = ZONE.gate; if (!G) return;
  G.t += dt;
  if (G.ph === 'walk'){
    const [tx, ty] = G.pts[G.wi], dx = tx - player.x, dy = ty - player.y, d = Math.hypot(dx, dy), sp = 3.2 * dt * bikeMulAny();
    if (d < .05){ if (++G.wi >= G.pts.length){ G.ph = 'open'; G.t = 0; SFX.ping(); } }
    else { player.x += dx / d * Math.min(sp, d); player.y += dy / d * Math.min(sp, d); player.ang = Math.atan2(dx, dy); player.moving = true; player.walk += dt; }
    if (G.t > 6){ G.ph = 'open'; G.t = 0; }
    return;
  }
  player.moving = false;
  G.glow = clamp(G.t / .8, 0, 1);
  if (G.t > .5 && !G.white){ G.white = true; zoneFade(1, '#ffffff', .45); }
  if (G.t > 1.05) zoneGateFinish();
}
const bikeMulAny = () => (SAVE.bike && SAVE.bike.on && bikeUnlocked() ? 1.6 : 1);
function zoneGateCam(){
  const G = ZONE.gate; if (!G) return null;
  const o = G.o, d = G.d, close = G.ph !== 'walk', room = G.free + .4,   /* 눈 위치가 문 앞 빈칸 안에 머물게 */ want = (close ? 4.6 : 7.6) * (o.door ? .75 : 1), dist = clamp(Math.min(want, room), 2.4, want);
  return {tx:o.x + .5, ty:(close ? 1.9 : 1.6) * (o.door ? .8 : 1), tz:o.y + .5 + d * .1, yaw:d > 0 ? 0 : Math.PI, pitch:(close ? .14 : .24) + (want - dist) * .08, dist, rate:close ? .05 : .02};
}
function zoneGateFinish(){
  const G = ZONE.gate; if (!G) return;
  ZONE.gate = null;
  const z = G.z, st = zState(), first = !st.seen[z.id];
  ZONE.town = WORLD;   /* 마을은 그대로 두었다가 나올 때 다시 쓴다 (차·행인 자리 그대로) */
  const k = z.rooms.findIndex(r => r.act && !actDone(actById(r.act))), w = z.rooms.findIndex(r => r.wrap);
  const i = k >= 0 ? k : w >= 0 && !wrapOk(z) ? w : 0;   /* 방 활동을 다 했으면 정리 교실로 */
  zoneLoadRoom(z, i, 'left');
  zoneCard(z, z.rooms.length > 1 ? `${ROOM_NO[i]} ${z.rooms[i].name} · 방 ${i + 1}/${z.rooms.length}` : z.goal || z.rooms[i].name);
  st.seen[z.id] = true; persist();
  if (first && z.gift && !st.teased) ZONE.teaseAt = TIME + 3.2;
  if (!z.free) ladZoneEnter(z);   /* 차시 첫 진입 기록 · 반 번호 · 선생님 편지 (wrap.js) */
}
function zoneSkip(){
  if (ZONE.gate) zoneGateFinish();
  else if (ZONE.hop) ZONE.hop.t = 99;
}

/* ===== 방 불러오기 · 포털 · 나가기 ===== */
function zoneLoadRoom(z, i, from){
  const def = zoneBuildRoom(z, i), st = zState();
  loadWorld(def);
  ZONE.zone = z; ZONE.idx = i; ZONE.room = z.rooms[i];
  st.cur = z.id; st.room = i; if (!z.free) st.last = z.id;
  const sp = from === 'resume' && st.pos ? st.pos : from === 'right' ? def.spawnR : def.spawnL;
  st.pos = null; persist();
  MODE = 'play'; showHUD(true);
  placePlayer(sp.x, sp.y); player.ang = from === 'right' ? -Math.PI / 2 : Math.PI / 2;
  ZONE.armed = false; ZONE.ease = 1; ZONE.focus = null;
  zoneFade(0, null, .6);
  updateHUD(); zoneBar(); actWaypoint();
  wrapRoomEnter(z, i);
}
function zonePortalOpen(o){
  if (o.side < 0) return true;
  const r = ZONE.room; return !r || !r.act || actDone(actById(r.act));
}
function zonePortal(o, auto){
  if (!inRoom()) return;
  if (!zonePortalOpen(o)){
    const msg = `🔒 「${ZONE.room.name}」 활동을 끝내야 ${o.to < 0 ? '출구' : '다음 방 포털'}가 열려요.`;
    if (!auto) return showDialog('포털', [msg]);
    if (TIME - ZONE.lockT > 3){ ZONE.lockT = TIME; toast(msg, 'bad'); SFX.buzz(); }
    return;
  }
  ZONE.hop = {t:0, o}; MODE = 'gate'; KEYS.clear(); JOY.x = JOY.y = 0; PATH3.nodes = null; NEAR = null;
  zoneFade(1, '#0b1220', .25); SFX.tone(520, .12, 'triangle', .035, 260);
}
function zoneHopUpdate(dt){
  const H = ZONE.hop; if (!H) return;
  H.t += dt; player.moving = false;
  if (H.t < .3) return;
  ZONE.hop = null;
  if (H.o.to < 0) return zoneExitNow();
  const z = ZONE.zone, to = H.o.to;
  zoneLoadRoom(z, to, H.o.side > 0 ? 'left' : 'right');
  showBanner(zoneTag(z), `${ROOM_NO[to]} ${z.rooms[to].name}`);
}
function zoneExit(){ if (inRoom()){ ZONE.hop = {t:0, o:{to:-1}}; MODE = 'gate'; NEAR = null; zoneFade(1, '#0b1220', .25); } }
function zoneExitNow(){
  const z = ZONE.zone, st = zState();
  loadWorld(zoneTownWorld());
  ZONE.zone = null; ZONE.room = null; ZONE.focus = null; st.cur = null; st.pos = null; persist();
  MODE = 'play'; showHUD(true);
  if (z){ const d = z.gate.face === 'N' ? -1 : 1; placePlayer(z.gate.x + .5, z.gate.y + .5 + d * 1.8); player.ang = d > 0 ? 0 : Math.PI; }
  ZONE.ease = .7; ZONE.armed = true;
  zoneFade(0, null, .6);
  updateHUD(); zoneBar(); actWaypoint();
}
/* 처음 화면에서 이어 하기: 방 안에 있었으면 그 방으로 */
function zoneResume(){
  const st = zState(), z = st.cur && zoneById(st.cur);
  if (!z || !zoneOpen(z)){ st.cur = null; return false; }
  ZONE.town = WORLD;
  zoneLoadRoom(z, clamp(st.room | 0, 0, z.rooms.length - 1), 'resume');
  return true;
}
/* 크레인처럼 마을 고철장을 빌려 쓰는 활동: 잠깐 마을로 바꿨다가 끝나면 방으로 */
function zoneBorrowTown(){
  if (!inRoom()) return;
  ZONE.borrow = {world:WORLD, x:player.x, y:player.y, ang:player.ang};
  loadWorld(zoneTownWorld());
}
function zoneReturn(){
  const B = ZONE.borrow; if (!B) return;
  ZONE.borrow = null;
  loadWorld(B.world); placePlayer(B.x, B.y); player.ang = B.ang;
  updateHUD(); zoneBar();
}

/* ===== 화면: 하얗게·까맣게 · 구역 이름 카드 · 방 띠 ===== */
function zoneFade(to, color, sec){
  const f = $('#zoneFade'); if (!f) return;
  if (color) f.style.background = color;
  f.style.transition = `opacity ${sec || .4}s ease`;
  f.style.opacity = to;
}
function zoneCard(z, sub){
  const c = $('#zoneCard'); if (!c) return;
  c.style.setProperty('--zc', z.color);
  c.querySelector('.zc-no').textContent = zoneTag(z);
  c.querySelector('.zc-name').textContent = `${z.icon} ${z.name}`;
  c.querySelector('.zc-room').textContent = sub || '';
  c.hidden = false; c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
  clearTimeout(ZONE.cardT); ZONE.cardT = setTimeout(() => { c.hidden = true; }, 3300);
  SFX.win();
}
function zoneBar(){
  const el = $('#zoneBar'); if (!el) return;
  if (!inRoom()){ el.hidden = true; return; }
  const z = ZONE.zone;
  el.style.setProperty('--zc', z.color);
  el.innerHTML = `<span class="zb-z">${z.icon} ${zoneTag(z)} ${esc(z.name)}</span>` + z.rooms.map((r, i) => {
    const done = r.wrap ? wrapOk(z) : r.act && actDone(actById(r.act)), cls = i === ZONE.idx ? 'on' : done ? 'done' : zoneRoomOk(z, i) ? '' : 'lock';
    return `<span class="zb-r ${cls}">${ROOM_NO[i]} ${r.wrap ? '📋 ' : ''}${esc(r.name)}</span>`;
  }).join('<i>›</i>');
  el.hidden = false;
}

/* ===== 길 안내: 다른 방·다른 구역에 있으면 포털이나 구역 문을 가리킨다 (가리켰으면 true) ===== */
function zonePointPortal(side){
  const p = WORLD.objects.find(o => o.type === 'portal' && o.side === side); if (!p) return false;
  UI.waypoint = {x:p.x - side, y:p.y, label:p.to < 0 ? '🚪 구역 출구' : `포털 ${ROOM_NO[p.to]} ${ZONE.zone.rooms[p.to].name}`};
  return true;
}
function zoneRoute(a){
  if (!WORLD || ZONE.borrow) return false;
  const L = a ? zoneOfAct(a.id) : null, toTown = !L || L.r < 0;
  if (inRoom()){
    if (ZONE.zone.free){ UI.waypoint = null; return true; }   /* 자유 탐험 장소에서는 길 안내를 쉬게 한다 */
    if (!toTown && L.z === ZONE.zone){ if (L.r === ZONE.idx) return false; return zonePointPortal(L.r > ZONE.idx ? 1 : -1); }
    const last = ZONE.idx === ZONE.zone.rooms.length - 1, R = WORLD.objects.find(o => o.type === 'portal' && o.side > 0);
    return zonePointPortal(last && R && zonePortalOpen(R) ? 1 : -1);
  }
  if (WORLD.kind !== 'story' || toTown) return false;
  const z = L.z, st = zState();
  if (!zoneOpen(z)){
    for (const k of z.open || []){ const w = ZONE_NEEDS[k].route && ZONE_NEEDS[k].route(); if (w){ UI.waypoint = w; return true; } }
    return false;
  }
  const R = z.ride && ZONE_RIDES[z.ride];
  if (R && !st.seen[z.id] && !R.on()){ UI.waypoint = {...R.rack}; return true; }
  UI.waypoint = {x:z.gate.x, y:z.gate.y + 1, label:`🚪 ${z.no}차시 구역 문`};
  return true;
}
/* 화면 위 목표 줄 (구역 이야기가 필요할 때만, 아니면 null) */
function zoneObjective(){
  const a = actCur(), L = a && zoneOfAct(a.id), wo = wrapObjective();
  if (wo) return wo;
  if (inRoom()){
    const z = ZONE.zone;
    if (z.free) return `<b>${z.icon} ${esc(z.name)}</b> ${esc(z.goal || '')} · 다 보면 🚪 출구로 나가요`;
    if (L && L.z === z && L.r === ZONE.idx) return null;
    if (L && L.z === z && L.r >= 0) return `<b>${z.no}차시</b> 포털을 지나 ${ROOM_NO[L.r]} 「${esc(z.rooms[L.r].name)}」${euro(z.rooms[L.r].name)} 가요`;
    if (L && L.z === z) return `<b>${z.no}차시</b> 방 활동을 마쳤어요 · 🚪 출구로 나가 마을에서 「${esc(a.title)}」 하기`;
    return `<b>${z.no}차시 ✅</b> 이 구역 활동을 모두 마쳤어요 · 🚪 출구로 나가 마을로 가요`;
  }
  if (!WORLD || WORLD.kind !== 'story') return null;
  const now = zoneFocus();
  if (now && zoneActs(now).every(actDone) && !zoneNeedsOk(now)){
    const n = helpedCount(), N = WALKERS.length;
    return `<b>${now.no}차시 마지막</b> 🚲 길가 친구 ${n}/${N}명 만나기 → 다 만나면 전기 자전거를 탈 수 있어요`;
  }
  if (!L || L.r < 0) return null;
  const z = L.z, R = z.ride && ZONE_RIDES[z.ride];
  if (!zoneOpen(z)) return null;
  if (R && !zState().seen[z.id] && !R.on()) return `<b>${z.no}차시</b> 🚲 ${josa(R.label, '을', '를')} 타고(B) ${z.no}차시 구역 문으로 가요`;
  return `<b>${z.no}차시</b> ${z.icon} 마을 광장의 「${esc(z.name)}」 구역 문으로 가서 E`;
}
/* 활동을 끝냈을 때 '다음에 갈 곳' 한 줄 */
function zoneNextText(nx, nid){
  const L = zoneOfAct(nx.id), who = ACT_WHO[nid] || '';
  if (nid === 'evcar') return `👉 다음 활동: 「${nx.title}」 — ${inRoom() ? '🚪 구역 출구로 나가서 ' : ''}도로를 달리는 초록 전기차를 옆이나 뒤에서 붙잡아요!`;
  if (L && L.r >= 0){
    if (inRoom() && ZONE.zone === L.z){
      if (L.r === ZONE.idx) return `👉 다음 활동: 「${nx.title}」 — 이 방의 ${josa(who, '을', '를')} 만나요!`;
      return `👉 다음 활동: 「${nx.title}」 — ${L.r > ZONE.idx ? '오른쪽' : '왼쪽'} 포털이 열렸어요! ${ROOM_NO[L.r]} 「${L.z.rooms[L.r].name}」의 ${josa(who, '을', '를')} 만나요.`;
    }
    const here = inRoom() ? ZONE.zone : zoneFocus();
    if (here && zoneActs(here).every(actDone) && !zoneNeedsOk(here)) return `👉 ${zoneLabel(here)}의 마지막 미션: ${(here.need || []).map(k => ZONE_NEEDS[k].label).join(', ')}!`;
    if (!zoneOpen(L.z)) return `👉 ${zoneLabel(L.z)} 구역 문은 ${zoneLockText(L.z)}`;
    return `👉 이번 구역을 모두 마쳤어요! 다음은 ${zoneLabel(L.z)} 구역이에요. ${inRoom() ? '🚪 출구로 나가 ' : ''}마을 광장의 ${L.z.no}번 문으로 가요.`;
  }
  return `👉 다음 활동: 「${nx.title}」 — ${ACT_WHERE[nid] ? ACT_WHERE[nid] + '의 ' : ''}${josa(who, '을', '를')} 만나요! 노란 화살표를 따라가요.`;
}

/* ===== 볼트 박사의 구역 안내 · 구역 지도 ===== */
function zoneVoltTalk(o){
  const z = zoneNow(), lines = [];
  if (!z) lines.push(SAVE.story.finale ? '점등식은 대성공이에요! 구역 문으로 들어가면 어느 활동이든 다시 해 볼 수 있어요.' : '세 구역을 모두 마쳤어요! 곧 광장에서 점등식이 시작돼요.');
  else if (wrapReady(z) && !wrapOk(z)){
    lines.push(`찌릿! ${z.icon} ${zoneLabel(z)} 퀘스트를 모두 마쳤군요!`);
    lines.push(`이제 구역 안 「${wrapRoomOf(z).name}」에서 친구들과 큰 칠판 앞에 모여 오늘 배운 것을 정리해요. 광장의 ${z.no}번 문으로 들어가요!`);
  } else {
    lines.push(`찌릿! 지금은 ${z.icon} ${zoneLabel(z)} 차례예요.`);
    lines.push(z.goal);
    lines.push(zoneOpen(z) ? `광장의 ${z.no}번 문으로 들어가요. 노란 화살표가 길을 알려 줄 거예요!` : `🔒 ${zoneLockText(z)}`);
  }
  showDialog(o.name, lines, () => openZoneMap());
}
function zoneStatus(z){
  if (zoneDone(z)) return {cls:'done', txt:'✅ 완료 · 다시 해 볼 수 있어요'};
  if (!zoneOpen(z)) return {cls:'lock', txt:'🔒 ' + zoneLockText(z)};
  if (wrapReady(z) && !wrapOk(z)) return {cls:'cur', txt:'📋 퀘스트 완료! 정리 교실의 정리 회의만 남았어요'};
  if (z === zoneNow()) return {cls:'cur', txt:'▶ 차시 순서로 다음 구역 (다른 구역도 들어갈 수 있어요)'};
  return {cls:'', txt:''};
}
function openZoneMap(){
  const canGo = MODE === 'play' && WORLD && WORLD.kind === 'story';
  const card = z => {
    const s = zoneStatus(z), acts = z.rooms.map((r, i) => ({a:actById(r.act), where:`${ROOM_NO[i]} ${r.name}`})).filter(q => q.a).concat((z.town || []).map(id => ({a:actById(id), where:'마을'})));
    return `<div class="zone-card ${s.cls}" style="--zc:${z.color}">
      <div class="zc-head"><span class="zc-chip">${z.no}차시</span><b>${z.icon} ${esc(z.name)}</b></div>
      <p class="zc-goal">${esc(z.goal)}</p>
      <ul class="zc-acts">${acts.map(({a, where}) => `<li class="${actDone(a) ? 'ok' : ''}">${actDone(a) ? '✅' : '⬜'} ${ACTS.indexOf(a) + 1}. ${esc(a.title)} <small>${esc(where)}</small></li>`).join('')}
        ${(z.need || []).map(k => `<li class="${ZONE_NEEDS[k].ok() ? 'ok' : ''}">${ZONE_NEEDS[k].ok() ? '✅' : '⬜'} ${ZONE_NEEDS[k].label}</li>`).join('')}
        ${wrapLessonOf(z) ? `<li class="${wrapOk(z) ? 'ok' : ''}">${wrapOk(z) ? '✅' : '⬜'} 📋 정리 회의 <small>${esc(wrapRoomOf(z).name)} · 칠판 앞에서 오늘 배운 것 정리</small></li>` : ''}</ul>
      ${z.ride ? `<p class="zc-note">🚲 처음 들어갈 때는 ${josa(ZONE_RIDES[z.ride].label, '을', '를')} 타고 와야 해요.</p>` : ''}
      ${z.gift ? '<p class="zc-note">🎁 이 구역을 마치면 시장님의 큰 선물이 기다려요.</p>' : ''}
      <div class="zc-foot"><small>${s.txt}</small>${canGo && zoneOpen(z) ? `<button class="btn small ${s.cls === 'cur' ? 'primary' : ''}" data-zgo="${z.id}">🚪 문까지 길 안내</button>` : ''}</div></div>`;
  };
  const p = openPanel(`<h2>🗺️ 차시 구역</h2><p class="sub">${esc(COURSE.intro)}</p>
    <div class="zone-cards">${COURSE.zones.map(card).join('')}</div>
    ${(COURSE.places || []).length ? `<h3>🧭 자유 탐험 장소 <small style="font-size:13px;color:var(--text-dim)">(활동을 일찍 마친 친구에게 추천)</small></h3>
    <div class="zone-cards">${COURSE.places.map(z => `<div class="zone-card" style="--zc:${z.color}"><div class="zc-head"><b>${z.icon} ${esc(z.name)}</b></div><p class="zc-goal">${esc(z.goal || '')}</p>
      <div class="zc-foot"><small>${esc(z.where || '')}</small>${canGo && zoneOpen(z) ? `<button class="btn small" data-zgo="${z.id}">🚪 문까지 길 안내</button>` : ''}</div></div>`).join('')}</div>` : ''}
    <div class="row" style="margin-top:12px;gap:8px"><button class="btn" id="zmActs">📘 활동 목록</button></div>`, {wide:true});
  p.querySelectorAll('[data-zgo]').forEach(b => b.onclick = () => {
    const z = zoneById(b.dataset.zgo), R = z.ride && ZONE_RIDES[z.ride]; closePanel();
    if (R && !zState().seen[z.id] && !R.on()){ UI.waypoint = {...R.rack}; return toast(`먼저 ${josa(R.label, '을', '를')} 타요! ${R.hint}`); }
    UI.waypoint = {x:z.gate.x, y:z.gate.y + (z.gate.face === 'N' ? -1 : 1), label:`🚪 ${z.free ? z.name : z.no + '차시 구역 문'}`};
    toast('노란 화살표를 따라 문으로 가요!');
  });
  p.querySelector('#zmActs').onclick = openActs;
}
/* 구역을 처음 끝냈을 때 축하 창 */
function zoneClearCard(z){
  const i = COURSE.zones.indexOf(z), nx = COURSE.zones[i + 1];
  const next = nx ? `<p>다음은 <b>${nx.icon} ${zoneLabel(nx)}</b> 구역이에요.${nx.ride ? ` 🚲 ${josa(ZONE_RIDES[nx.ride].label, '을', '를')} 타고 광장의 ${nx.no}번 문으로 가요!` : ` 광장의 ${nx.no}번 문으로 가요.`}</p>`
    : COURSE.zones.every(zoneDone) ? '<p>세 구역을 모두 마쳤어요! 구역 출구로 나가 광장에서 <b>점등식</b>을 지켜봐요.</p>' : '<p>아직 끝내지 않은 구역이 있어요. 🗺️ 차시 구역 지도에서 확인해요.</p>';
  SND.fanfare();
  openPanel(`<div class="zone-clear" style="--zc:${z.color}"><div class="zcl-icon">${z.icon}</div>
    <span class="zc-chip">${z.no}차시 완료!</span><h2>${esc(z.name)}</h2>
    <ul class="zc-acts">${zoneActs(z).map(a => `<li class="ok">✅ ${ACTS.indexOf(a) + 1}. ${esc(a.title)}</li>`).join('')}${(z.need || []).map(k => `<li class="ok">✅ ${ZONE_NEEDS[k].label}</li>`).join('')}${wrapLessonOf(z) ? '<li class="ok">✅ 📋 정리 회의</li>' : ''}</ul>
    ${next}<button class="btn primary" data-close>계속하기</button></div>`, {onClose:() => { actWaypoint(); updateHUD(); }});
  award('em', 5); award('eco', 5);
}
/* 3차시 첫 입장: 시장님의 선물(천에 덮인 트럭 그림자) 보여 주기 */
function zoneTease(){
  const st = zState(), o = WORLD.objects.find(q => q.prop === 'truckSil');
  ZONE.teaseAt = 0;
  if (!o){ st.teased = true; persist(); return; }
  ZONE.focus = {x:o.x + .5, z:o.y + .9};
  const M = t => ({who:'📺 시장님의 영상 편지', text:t});
  showDialog('📺 시장님의 영상 편지', [
    M('전기 마스터, 3차시 구역에 온 걸 환영해요! 전기 자전거를 타고 왔군요.'),
    M('저기 그림자 보이나요? 각진 몸체에 번쩍이는 ⚡ 표시… 바퀴마다 전동기 속 전자석이 힘차게 도는 전기 트럭이에요.'),
    M('3차시 활동을 모두 마치고 광장의 점등식을 성공시키면, 이 트럭이 여러분 거예요. 그 트럭을 타고 집까지 가게 될 거예요!'),
    M('먼저 이 방의 안전이를 도와 우리 집의 위험과 낭비부터 찾아봐요. 응원할게요!'),
  ], () => { ZONE.focus = null; st.teased = true; persist(); actWaypoint(); updateHUD(); });
}

/* ===== 매 장면 ===== */
function zoneUpdate(dt){
  if (MODE === 'gate'){ zoneGateUpdate(dt); zoneHopUpdate(dt); return; }
  if (ZONE.ease > 0) ZONE.ease = Math.max(0, ZONE.ease - dt / 1.3);
  if (MODE !== 'play' || ZONE.borrow) return;
  if (inRoom() && !uiBlocking()){
    /* 포털에 다가가면 옆 방으로 (도착한 뒤에는 한 번 떨어져야 다시 작동) */
    let near = 9, hit = null;
    for (const o of WORLD.objects){ if (o.type !== 'portal') continue; const d = Math.hypot(player.x - (o.x + .5), player.y - (o.y + .5)); if (d < near){ near = d; hit = o; } }
    if (!ZONE.armed){ if (near > 1.35) ZONE.armed = true; }
    else if (hit && near < 1.0){ ZONE.armed = false; zonePortal(hit, true); }
    ZONE.saveT += dt; if (ZONE.saveT > 3){ ZONE.saveT = 0; zState().pos = {x:+player.x.toFixed(2), y:+player.y.toFixed(2)}; persist(); }
  }
  if (ZONE.teaseAt && TIME > ZONE.teaseAt && inRoom() && !uiBlocking()) zoneTease();
  ZONE.tickT += dt; if (ZONE.tickT < .6) return; ZONE.tickT = 0;
  if (uiBlocking() || !SAVE.met || !SAVE.met.volt) return;
  updateHUD();   /* 친구 수·자전거처럼 대화 밖에서 바뀌는 목표 줄을 고쳐 쓴다 */
  if ((SAVE.story.queue || []).some(id => id.startsWith('act:'))) return;   /* 활동 정리 대사가 먼저 */
  const st = zState();
  for (const z of COURSE.zones) if (!st.clear[z.id] && zoneDone(z)){ st.clear[z.id] = true; persist(); zoneBar(); updateHUD(); zoneClearCard(z); return; }
  /* 친구 찾기처럼 움직이는 목표는 화살표를 계속 고쳐 준다 */
  if (WORLD.kind === 'story' && !(UI.wpEV && evq().step === 0)){
    const now = zoneFocus(), a = actCur(), L = a && zoneOfAct(a.id);
    const needPending = now && zoneActs(now).every(actDone) && !zoneNeedsOk(now);
    const ridePending = L && L.r >= 0 && L.z.ride && zoneOpen(L.z) && !st.seen[L.z.id];
    if (needPending){ for (const k of now.need || []){ const w = ZONE_NEEDS[k].route && ZONE_NEEDS[k].route(); if (w){ UI.waypoint = w; break; } } }
    else if (!(UI.waypoint && UI.waypoint.wrap) && wrapFocus()) wrapRoute();   /* 자전거까지 받으면 정리 회의로 안내 */
    else if (ridePending) zoneRoute(a);
  }
}
/* 카메라: 문 클로즈업 · 방에 들어온 직후 가까이서 물러나기 · 선물 비추기 */
function zoneCamAdjust(C){
  const F = ZONE.focus; if (F){ return {tx:F.x, ty:F.ty || .9, tz:F.z, yaw:0, pitch:F.pitch || .42, dist:F.dist || 7.2, rate:.02}; }
  return null;
}

/* ===== 3D 모형 ===== */
function mkGate(color, open){
  const b = new VB(), stone = '#d8d1c3', dark = '#8f8778';
  for (const sx of [-1, 1]){
    vbBox(b, sx * 1.25 - .32, 0, -.42, sx * 1.25 + .32, 3.9, .42, stone);
    vbBox(b, sx * 1.25 - .38, 0, -.48, sx * 1.25 + .38, .3, .48, dark);
    vbBox(b, sx * 1.25 - .34, 3.9, -.44, sx * 1.25 + .34, 4.05, .44, color, 2);
  }
  vbBox(b, -1.7, 3.9, -.5, 1.7, 4.55, .5, stone);
  vbBox(b, -1.72, 4.1, .5, 1.72, 4.3, .54, color, 3);
  vbBox(b, -.62, 4.55, -.2, .62, 5.15, .2, color, 2);
  if (!open){
    vbBox(b, -.93, 0, -.08, -.02, 3.85, .08, '#5b4a3a'); vbBox(b, .02, 0, -.08, .93, 3.85, .08, '#5b4a3a');
    vbBox(b, -.95, 1.7, .08, .95, 1.9, .14, '#9aa3ad'); vbBox(b, -.12, 1.5, .12, .12, 1.95, .2, '#ffd23f');
  }
  return b.mesh();
}
function mkDoorFrame(color){
  const b = new VB();
  for (const sx of [-1, 1]) vbBox(b, sx * .58 - .1, 0, -.12, sx * .58 + .1, 2.35, .12, '#e8e2d4');
  vbBox(b, -.7, 2.25, -.14, .7, 2.5, .14, color, 2);
  return b.mesh();
}
function mkGateLight(color){ const b = new VB(); vbBox(b, -.93, 0, -.04, .93, 3.85, .04, color, 3); return b.mesh(); }
function mkGateCurtain(color){ const b = new VB(); for (let k = 0; k < 7; k++){ const x = -.84 + k * .28; vbBox(b, x - .025, .05, -.03, x + .025, 3.8, .03, color, 3); } return b.mesh(); }
function mkPortalFrame(color, open){
  const b = new VB(), c = open ? color : '#6f7883';
  vbBox(b, -.08, 0, -.62, .08, 2.15, -.5, c, open ? 2 : -1); vbBox(b, -.08, 0, .5, .08, 2.15, .62, c, open ? 2 : -1);
  vbBox(b, -.08, 2.05, -.62, .08, 2.2, .62, c, open ? 2 : -1);
  if (!open){ for (let k = 0; k < 4; k++) vbBox(b, -.04, .25 + k * .5, -.5, .04, .33 + k * .5, .5, '#4a5563'); }
  return b.mesh();
}
function mkPortalDot(color){ const b = new VB(); vbBox(b, -.05, -.07, -.07, .05, .07, .07, color, 3); return b.mesh(); }
/* 방 소품: 모두 블록 상자 몇 개로 (앞쪽이 +z) */
function mkProp(kind){
  const b = new VB(), B = (x0, y0, z0, x1, y1, z1, c, e) => vbBox(b, x0, y0, z0, x1, y1, z1, c, e == null ? -1 : e);
  switch (kind){
    case 'desk': B(-.42, .66, -.3, .42, .72, .26, '#c89b5e'); for (const [x, z] of [[-.36, -.24], [.36, -.24], [-.36, .2], [.36, .2]]) B(x - .03, 0, z - .03, x + .03, .66, z + .03, '#5b6573');
      B(-.2, .4, .34, .2, .45, .62, '#3a8ee6'); B(-.2, .45, .58, .2, .82, .62, '#3a8ee6'); B(-.18, 0, .36, -.15, .4, .39, '#5b6573'); B(.15, 0, .36, .18, .4, .39, '#5b6573'); break;
    case 'board': B(-1.45, .85, -.5, 1.45, 2.25, -.42, '#7a5233'); B(-1.36, .93, -.43, 1.36, 2.17, -.4, '#2f6b4f'); B(-1.3, .86, -.4, 1.3, .9, -.3, '#7a5233');
      B(-.9, 1.7, -.4, -.2, 1.73, -.39, '#f4f6f8'); B(-.9, 1.5, -.4, .4, 1.53, -.39, '#f4f6f8'); break;
    case 'speaker': B(-.24, 0, -.2, .24, 1.1, .2, '#2f343b'); B(-.15, .6, .2, .15, .9, .22, '#5b6573'); B(-.1, .2, .2, .1, .4, .22, '#5b6573'); B(-.04, .7, .22, .04, .8, .23, '#3ee0ff', 2); break;
    case 'fan': B(-.2, 0, -.2, .2, .06, .2, '#f4f6f8'); B(-.03, .06, -.03, .03, 1.1, .03, '#d5dbe2'); B(-.3, .9, -.06, .3, 1.5, .02, '#bfe6ff'); B(-.06, 1.14, .02, .06, 1.26, .06, '#3a8ee6'); break;
    case 'plant': B(-.18, 0, -.18, .18, .32, .18, '#b5651d'); B(-.28, .32, -.28, .28, .7, .28, '#3a9a46'); B(-.16, .7, -.16, .16, 1.0, .16, '#4fb35a'); break;
    case 'tv': B(-.6, 0, -.3, .6, .45, .1, '#7a5233'); B(-.85, .55, -.2, .85, 1.5, -.12, '#1d2228'); B(-.8, .6, -.12, .8, 1.45, -.11, '#2a4a7a', 2); B(-.05, .45, -.18, .05, .55, -.14, '#1d2228'); break;
    case 'washer': B(-.38, 0, -.36, .38, .9, .36, '#f4f6f8'); B(-.24, .2, .36, .24, .66, .38, '#9fc9e8', 1); B(-.3, .76, .36, .3, .84, .37, '#5b6573'); break;
    case 'shelf': B(-.48, 0, -.22, .48, 1.8, .22, '#8a5a32'); for (let k = 0; k < 3; k++){ B(-.44, .2 + k * .55, -.18, .44, .24 + k * .55, .2, '#6b4523'); B(-.4, .24 + k * .55, -.1, -.1, .6 + k * .55, .12, ['#d94141', '#3a8ee6', '#25a862'][k]); B(.05, .24 + k * .55, -.1, .35, .52 + k * .55, .12, ['#ffd23f', '#c58bff', '#ee9a1c'][k]); } break;
    case 'sofa': B(-.5, 0, -.38, .5, .42, .36, '#c0504d'); B(-.5, .42, -.38, .5, .9, -.2, '#a84440'); B(-.5, .42, -.38, -.38, .62, .36, '#a84440'); B(.38, .42, -.38, .5, .62, .36, '#a84440'); break;
    case 'rug': B(-1.3, 0, -.8, 1.3, .03, .8, '#3a7bd5'); B(-1.1, .03, -.6, 1.1, .04, .6, '#5b95e6'); break;
    case 'robovac': B(-.24, 0, -.24, .24, .12, .24, '#2f343b'); B(-.06, .12, -.06, .06, .15, .06, '#25d17a', 3); break;
    case 'lamp': B(-.18, 0, -.18, .18, .05, .18, '#2f343b'); B(-.03, .05, -.03, .03, 1.4, .03, '#5b6573'); B(-.24, 1.35, -.24, .24, 1.65, .24, '#fff3b8', 3); break;
    case 'bench': B(-.46, .78, -.32, .46, .86, .32, '#eef3f8'); B(-.42, 0, -.28, .42, .78, .28, '#9aa3ad');
      B(-.3, .86, -.1, -.1, 1.0, .1, '#c87533'); B(-.27, .86, -.03, -.13, 1.16, .03, '#8a9099'); B(.08, .86, -.12, .3, 1.04, .08, '#2f3a46'); B(.1, 1.04, -.1, .28, 1.08, .06, '#ffd23f'); break;
    case 'coil': B(-.3, 0, -.3, .3, .5, .3, '#5b6573'); B(-.06, .5, -.06, .06, 1.25, .06, '#9aa0a6'); for (let k = 0; k < 6; k++) B(-.13, .58 + k * .1, -.13, .13, .63 + k * .1, .13, '#c87533'); B(-.1, 1.25, -.1, .1, 1.33, .1, '#3ee0ff', 3); break;
    case 'crate': B(-.38, 0, -.38, .38, .72, .38, '#b07a45'); B(-.4, .3, -.4, .4, .38, .4, '#8a5a32'); break;
    case 'window': B(-1.4, .9, -.5, 1.4, 2.3, -.42, '#5b6573'); B(-1.3, 1.0, -.43, 1.3, 2.2, -.4, '#9fd6f5', 2); B(-.04, 1.0, -.42, .04, 2.2, -.39, '#5b6573'); break;
    case 'server': B(-.32, 0, -.3, .32, 1.9, .3, '#1d2228'); for (let k = 0; k < 6; k++){ B(-.26, .2 + k * .28, .3, .2, .3 + k * .28, .31, '#2f3a46'); B(.12, .23 + k * .28, .31, .18, .27 + k * .28, .32, k % 2 ? '#25d17a' : '#3ee0ff', 3); } break;
    case 'screen': B(-1.35, .9, -.5, 1.35, 2.3, -.42, '#1d2228'); B(-1.28, .97, -.42, 1.28, 2.23, -.41, '#123a52', 2);
      for (let k = 0; k < 4; k++) B(-1.1 + k * .6, 1.2, -.41, -.75 + k * .6, 1.2 + .2 + (k % 3) * .25, -.4, '#3ee0ff', 3); break;
    case 'outlet': B(-.5, .2, -.5, .5, 1.1, -.4, '#eef3f8'); B(-.36, .45, -.4, -.08, .75, -.37, '#d5dbe2'); B(.08, .45, -.4, .36, .75, -.37, '#d5dbe2');
      B(-.3, 0, -.36, .3, .1, -.2, '#f4f6f8'); for (let k = 0; k < 3; k++) B(-.24 + k * .18, .1, -.32, -.16 + k * .18, .26, -.24, '#2f343b'); B(-.06, .26, -.3, .06, .6, -.26, '#e5483a', 2); break;
    case 'truckSil': return mkBoltTruck(true);
    case 'giftSign': B(-.05, 0, -.05, .05, 1.1, .05, '#6b4523'); B(-.45, .8, -.06, .45, 1.35, .06, '#ffd23f', 1); B(-.38, .86, .06, .38, 1.29, .08, '#c0392b'); break;
    case 'fridge': B(-.4, 0, -.36, .4, 1.85, .34, '#eef3f8'); B(-.4, 1.15, .34, .4, 1.18, .36, '#c9ced6'); B(.26, .4, .34, .3, 1.05, .38, '#9aa3ad'); B(.26, 1.3, .34, .3, 1.7, .38, '#9aa3ad'); B(-.3, 1.4, .34, -.06, 1.62, .36, '#25a862', 2); break;
    case 'heater': B(-.3, 0, -.16, .3, .7, .16, '#c9ced6'); for (let k = 0; k < 3; k++) B(-.24, .18 + k * .16, .16, .24, .24 + k * .16, .18, '#ff6b2a', 3); break;
    case 'robotDock': B(-.5, 0, -.5, .5, .12, .5, '#2f3a46'); B(-.4, .12, -.4, .4, .14, .4, '#3ee0ff', 2); break;
    case 'curtain': B(-.5, 0, -.5, .5, 2.4, -.36, '#a8323a'); for (let k = 0; k < 4; k++) B(-.48 + k * .26, 0, -.36, -.4 + k * .26, 2.4, -.32, '#8c2930'); break;
    case 'stageDeck': B(-.5, 0, -.5, .5, .42, .5, '#9c6b3e'); B(-.5, .42, -.5, .5, .46, .5, '#b98451'); B(-.5, .3, .5, .5, .34, .52, '#ffd23f', 2); break;
    case 'chair': B(-.2, .4, -.2, .2, .45, .2, '#c0504d'); B(-.2, .45, -.24, .2, .85, -.2, '#c0504d'); B(-.18, 0, -.18, -.14, .4, -.14, '#5b6573'); B(.14, 0, -.18, .18, .4, -.14, '#5b6573'); B(-.18, 0, .14, -.14, .4, .18, '#5b6573'); B(.14, 0, .14, .18, .4, .18, '#5b6573'); break;
    case 'aircon': B(-.3, 0, -.3, .3, 1.8, .3, '#f4f6f8'); B(-.24, 1.2, .3, .24, 1.6, .32, '#c9ced6'); B(-.24, .3, .3, .24, .34, .31, '#3ee0ff', 2); B(-.1, 1.0, .3, .1, 1.1, .32, '#25a862', 2); break;
    case 'bed': B(-.45, 0, -.8, .45, .5, .8, '#d5dbe2'); B(-.42, .5, -.78, .42, .6, .78, '#ffffff'); B(-.38, .6, -.74, .38, .7, -.42, '#bfe6ff'); B(-.45, .5, -.85, .45, .95, -.78, '#9aa3ad'); break;
    case 'tcoil': B(-.35, 0, -.35, .35, .3, .35, '#2f343b'); B(-.14, .3, -.14, .14, 1.6, .14, '#c87533'); for (let k = 0; k < 8; k++){ const a = k / 8 * Math.PI * 2; B(Math.cos(a) * .32 - .1, 1.6, Math.sin(a) * .32 - .1, Math.cos(a) * .32 + .1, 1.78, Math.sin(a) * .32 + .1, '#c9ced6'); } B(-.08, 1.78, -.08, .08, 1.95, .08, '#b9a7ff', 3); break;
    case 'counter': B(-.5, 0, -.3, .5, .95, .3, '#7a5233'); B(-.52, .95, -.32, .52, 1.0, .32, '#c89b5e'); B(-.2, 1.0, -.15, .2, 1.25, .1, '#2f343b'); B(-.15, 1.05, .1, .15, 1.2, .11, '#25d17a', 2); break;
    default: B(-.3, 0, -.3, .3, .6, .3, '#c9ced6');
  }
  return b.mesh();
}

/* world3d.js의 물체 그리기 안에서: 처리했으면 true */
function zoneDraw3D(o, t, gy){
  const cx = o.x + .5, cz = o.y + .5;
  if (o.type === 'gate'){
    const z = zoneById(o.zone), open = zoneOpen(z), G = ZONE.gate, ry = (o.dir || 1) > 0 ? 0 : Math.PI, k = o.door ? .62 : 1;
    if (o.door) drawM(model('door:' + z.color, () => mkDoorFrame(z.color)), M4.trs(cx, gy, cz, ry));
    else drawM(model('gate:' + z.color + (open ? 1 : 0), () => mkGate(z.color, open)), M4.trs(cx, gy, cz, ry));
    if (open){
      if (G && G.o === o && G.glow > 0) drawM(model('gateL:' + z.color, () => mkGateLight(z.color)), M4.trs(cx, gy, cz, ry, k, G.glow * k));   /* 들어갈 때 빛이 차오른다 */
      else drawM(model('gateC:' + z.color, () => mkGateCurtain(z.color)), M4.trs(cx, gy, cz, ry, k, (.92 + Math.sin(t * 3) * .08) * k));
    }
    sprAdd(cx, gy + (o.door ? 3.1 : 5.75) + Math.sin(t * 2) * .06, cz, iconBadge('mis', z.free ? z.icon : ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][z.no - 1] || z.icon), o.door ? .5 : .62);
    if (!o.door) SHADOWS.push([cx, gy, cz, 1.4]);
    return true;
  }
  if (o.type === 'portal'){
    const z = ZONE.zone || COURSE.zones[0], open = zonePortalOpen(o), col = o.to < 0 ? '#ffd23f' : z.color;
    drawM(model('pf:' + col + (open ? 1 : 0), () => mkPortalFrame(col, open)), M4.trs(cx, gy, cz));   /* 포털 면은 처음부터 옆벽(y-z 면)에 맞춰 만든다 */
    if (open){
      const dot = model('pd:' + col, () => mkPortalDot(col));
      for (let k = 0; k < 14; k++){ const a = k / 14 * Math.PI * 2 + t * 2.2, r = .52 + Math.sin(t * 3 + k) * .04; drawM(dot, M4.trs(cx, gy + 1.08 + Math.sin(a) * r * 1.5, cz + Math.cos(a) * r)); }
      for (let k = 0; k < 6; k++){ const a = -k / 6 * Math.PI * 2 - t * 3.4; drawM(dot, M4.trs(cx, gy + 1.08 + Math.sin(a) * .22, cz + Math.cos(a) * .16, 0, .8)); }
    } else sprAdd(cx, gy + 2.6, cz, iconBadge('pick', '🔒'), .38);
    return true;
  }
  if (o.type === 'thing') return placeDraw3D(o, t, gy);
  if (o.kind === 'prop'){
    if (o.prop === 'scrap'){ const n = (o.x * 3 + o.y) % 4 + 1; drawM(model('scrap' + n, () => mkScrap(n)), M4.trs(cx, gy, cz)); }
    else if (o.prop === 'truckSil'){
      drawM(model('prop:truckSil', () => mkProp('truckSil')), M4.trs(cx, gy, cz + .35, o.ry, .62));
      sprAdd(cx, gy + 2.1 + Math.sin(t * 2.5) * .08, cz + .35, iconBadge('pick', '❓'), .5);
    } else {
      drawM(model('prop:' + o.prop, () => mkProp(o.prop)), M4.trs(cx, gy, cz, o.ry || 0));
      if (o.prop === 'robotDock') robot3(cx, gy + .14, cz, Math.sin(t * .7) * .6, t, .9);
      if (o.prop === 'giftSign') sprAdd(cx, gy + 1.75, cz, iconBadge('pick', '🎁'), .4);
      if (o.badge) sprAdd(cx, gy + 2.1 + Math.sin(t * 2 + o.x) * .05, cz, iconBadge('dev', o.badge), .36);
    }
    if (o.prop !== 'rug' && o.prop !== 'board' && o.prop !== 'window' && o.prop !== 'screen') SHADOWS.push([cx, gy, cz, .45]);
    return true;
  }
  return false;
}
/* 3D 이름표: 마을의 구역 문 · 방의 포털 */
function zoneOverlay3D(){
  if (!WORLD || UI.dialog || UI.cutscene) return;
  const ox = CAM3.tx, oz = CAM3.tz;
  for (const o of WORLD.objects){
    if (o.type === 'gate'){
      const z = zoneById(o.zone), cx = o.x + .5, cz = o.y + .5; if (Math.hypot(cx - ox, cz - oz) > 30) continue;
      const p = proj3(cx, 6.5, cz); if (!p.ok) continue;
      if (z.free){ const q = proj3(o.x + .5, 3.7, o.y + .5); if (q.ok) drawLabel(q.x, q.y, `${z.icon} ${z.name}`); continue; }
      const s = zoneStatus(z); drawLabel(p.x, p.y, `${z.no}차시 · ${z.name}${s.cls === 'done' ? ' ✅' : s.cls === 'lock' ? ' 🔒' : ''}`);
    } else if (o.type === 'portal'){
      const p = proj3(o.x + .5, 2.75, o.y + .5); if (!p.ok) continue;
      drawLabel(p.x, p.y, (zonePortalOpen(o) ? '' : '🔒 ') + o.name);
    }
  }
}
function zoneLights(){
  if (!WORLD) return;
  for (const o of WORLD.objects){
    if (o.type === 'gate'){ const z = zoneById(o.zone); if (zoneOpen(z)) addLight(o.x + .5, 2.4, o.y + .5 + (o.dir || 1) * .7, (o.door ? 6 : 8) + (ZONE.gate && ZONE.gate.o === o ? ZONE.gate.glow * 7 : 0), hexRGB(z.color)); }
    else if (o.type === 'portal' && zonePortalOpen(o)) addLight(o.x + .5 - o.side * .6, 1.3, o.y + .5, 7, hexRGB(o.to < 0 ? '#ffd23f' : ZONE.zone ? ZONE.zone.color : '#3ee0ff'));
  }
}
const hexRGB = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
/* 2D 화면(3D가 안 될 때) */
function zoneDraw2D(o, S){
  const cx = (o.x + .5) * S, cy = (o.y + .5) * S;
  if (o.type === 'gate'){ const z = zoneById(o.zone); ctx.fillStyle = z.color; rr(ctx, cx - S * 1.4, cy - S * .6, S * 2.8, S * 1.1, 6); ctx.fill(); drawEmoji(zoneOpen(z) ? z.icon : '🔒', cx, cy - S * .05, S * .7); return true; }
  if (o.type === 'portal'){ drawEmoji(zonePortalOpen(o) ? (o.to < 0 ? '🚪' : '🌀') : '🔒', cx, cy, S * .8); return true; }
  if (o.kind === 'prop'){ ctx.fillStyle = 'rgba(28,39,51,.25)'; rr(ctx, o.x * S + S * .15, o.y * S + S * .15, S * .7, S * .7, 5); ctx.fill(); return true; }
  return false;
}
