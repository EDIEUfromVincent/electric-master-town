/* =========================================================
   7-2. 에필로그 — 번개 트럭을 타고 우리 집으로
   · 주차장 뒤편에 각진 은색 전기 트럭(번개 트럭)이 서 있다. 활동 10개를 모두 마치면(점등식 뒤) 시장님이 선물로 준다.
   · 트럭에 타면 화면이 바뀌어 밤길을 직접 운전해 우리 집으로 간다(↑ 가속 · ↓ 브레이크 · ←→ 핸들).
   · 차고 앞에 닿으면 트럭이 스스로 차고에 들어가고, 카메라가 차고를 가까이 비추며 문이 내려온다.
     주인공이 옆문으로 나와 현관으로 들어가면 창에 불이 켜지고 화면이 어두워진다.
   ========================================================= */
const EPI = {on:false, ph:'off', t:0, x:0, z:0, a:Math.PI, v:0, door:0, px:0, pz:0, pa:0, walk:0, fade:0, win:0, house:0, bump:0, built:false};
const EO = {x:30, z:-10};   /* 에필로그 무대 원점: 마을 북쪽 바깥 */
const EPATH = [[0, 2], [0, -20], [7, -29], [9, -47]];   /* 도로 가운데 선 (무대 좌표) */
const EGAR = {x:9, z:-52.6, w:4.2, d:5.4, h:2.8};       /* 차고: 앞(+z)이 도로 쪽 */
const EHOUSE = {x:15.4, z:-53.2};
const ETRUCK_TOWN = {x:43.4, z:41.45};                   /* 마을 주차장의 번개 트럭 */
const epiState = () => { if (!SAVE.epi || typeof SAVE.epi !== 'object') SAVE.epi = {got:false, done:0}; return SAVE.epi; };
const E3 = (x, y, z, ry = 0, s = 1) => M4.trs(EO.x + x, y, EO.z + z, ry, s);

/* ----- 길까지의 거리 ----- */
function epiRoadDist(x, z){
  let best = 1e9, bx = 0, bz = 0, seg = 0;
  for (let i = 0; i < EPATH.length - 1; i++){
    const [ax, az] = EPATH[i], [cx, cz] = EPATH[i + 1], dx = cx - ax, dz = cz - az, L = dx * dx + dz * dz;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / L, 0, 1), px = ax + dx * t, pz = az + dz * t, d = Math.hypot(x - px, z - pz);
    if (d < best){ best = d; bx = px; bz = pz; seg = i + t; }
  }
  return {d:best, x:bx, z:bz, seg};
}

/* ----- 모형 ----- */
/* sil: 3차시 구역에 걸어 둔 '선물 그림자' — 같은 모양을 까맣게, ⚡ 표시만 빛나게 */
function mkBoltTruck(sil){
  const b = new VB(), body = sil ? '#1a1e25' : '#c3c9cf', dark = sil ? '#13161b' : '#8d959d', glass = sil ? '#22272f' : '#1d2733', W = .98;
  const keep = c => !sil || c === '#ffd23f', dim = c => (c === '#ffffff' || c === '#ff3b30' ? '#3a4250' : c);
  const BX = (b, x0, y0, z0, x1, y1, z1, col, emit = -1) => vbBox(b, Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1), Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1), keep(col) ? col : dim(col), keep(col) ? emit : -1);
  BX(b, -W, .38, -2.45, W, .95, 2.45, body);                                  // 차체 아래
  BX(b, -W - .02, .38, -2.45, W + .02, .5, 2.45, dark);                       // 아래 띠
  /* 각진 지붕: 앞(+z) 끝에서 꼭대기(z=-.2)까지 곧게 올라가고, 짐칸 끝(-z)까지 곧게 내려간다. 잘게 쌓아 매끈한 빗면처럼 */
  const N1 = 22, N2 = 22, zp = -.2, top = 1.86;
  for (let i = 0; i < N1; i++){ const z1 = 2.45 - i * (2.65 / N1), z0 = z1 - 2.65 / N1, h = .95 + (i + 1) / N1 * (top - .95); BX(b, -W + .04, .95, z0, W - .04, h, z1, i >= N1 * .45 ? glass : body); }
  for (let i = 0; i < N2; i++){ const z1 = zp - i * (2.25 / N2), z0 = z1 - 2.25 / N2, h = top - (i + 1) / N2 * (top - 1.15); BX(b, -W + .04, .95, z0, W - .04, h, z1, i < N2 * .25 ? glass : body); }
  BX(b, -W - .01, 1.12, -.9, W + .01, 1.55, .9, glass);                      // 옆 창
  BX(b, -W, .82, 2.44, W, .9, 2.5, '#ffffff', 3);                             // 앞 빛줄
  BX(b, -W, .82, -2.5, W, .9, -2.44, '#ff3b30', 2);                           // 뒤 빛줄
  for (const sx of [-1, 1]) for (const sz of [-1.55, 1.55]){
    BX(b, sx * W - .16, .02, sz - .4, sx * W + .16, .78, sz + .4, '#14181d');
    BX(b, sx * (W + .17) - .02, .28, sz - .14, sx * (W + .17) + .02, .52, sz + .14, '#9aa3ad');
    BX(b, sx * W - .2, .78, sz - .5, sx * W + .2, .86, sz + .5, dark);       // 바퀴 덮개
  }
  BX(b, -.18, .96, 2.2, .18, 1.0, 2.36, '#ffd23f', 3);                        // ⚡ 표시
  return b.mesh();
}
function mkEpiWorld(){
  const b = new VB(), lamps = [], trees = [];
  for (let x = -10; x <= 22; x++) for (let z = -62; z <= 6; z++){
    const r = epiRoadDist(x + .5, z + .5), drive = Math.abs(x + .5 - EGAR.x) < 2.1 && z + .5 < -47 && z + .5 > EGAR.z + EGAR.d / 2 - .2;
    if (r.d < 1.75 || drive){
      BX(b, x, -.3, z, x + 1, 0, z + 1, '#3b4048');
      if (!drive && r.d < .25 && (Math.floor(r.seg * 6) % 2 === 0)) BX(b, x + .4, 0, z + .4, x + .6, .01, z + .6, '#ffd23f', 1);
    } else if (r.d < 2.6) BX(b, x, -.3, z, x + 1, .08, z + 1, '#9aa1a9');
    else {
      const h = (x * 73856093 ^ z * 19349663) >>> 0;
      BX(b, x, -.3, z, x + 1, 0, z + 1, h % 3 ? '#4f8a3c' : '#5a9645');
      if (r.d > 4 && h % 11 === 0 && !(x > 2 && z < -34)) trees.push([x + .5, z + .5, 2 + h % 3]);
    }
  }
  for (const [x, z, n] of trees){ BX(b, x - .15, 0, z - .15, x + .15, n, z + .15, '#6b4a2b'); BX(b, x - 1, n, z - 1, x + 1, n + 1.4, z + 1, '#2f6b35'); BX(b, x - .6, n + 1.4, z - .6, x + .6, n + 2, z + .6, '#3a7d40'); }
  for (let s = 0; s < 3; s += .45){ const i = Math.floor(s), t = s - i, [ax, az] = EPATH[i], [cx, cz] = EPATH[i + 1], x = ax + (cx - ax) * t + 2.3, z = az + (cz - az) * t; lamps.push([x, z]); BX(b, x - .07, 0, z - .07, x + .07, 3.2, z + .07, '#39424e'); BX(b, x - .5, 3.1, z - .1, x + .07, 3.25, z + .1, '#39424e'); BX(b, x - .55, 3.0, z - .12, x - .3, 3.1, z + .12, '#fff3b8', 3); }
  /* 우리 집 + 차고 */
  const G = EGAR, gx0 = G.x - G.w / 2, gx1 = G.x + G.w / 2, gz0 = G.z - G.d / 2, gz1 = G.z + G.d / 2;
  BX(b, gx0, 0, gz0, gx1, .02, gz1, '#2a2f38');
  BX(b, gx0 - .2, 0, gz0, gx0, G.h, gz1, '#d9cdb5'); BX(b, gx1, 0, gz0, gx1 + .2, G.h, gz1, '#d9cdb5'); BX(b, gx0 - .2, 0, gz0 - .2, gx1 + .2, G.h, gz0, '#d9cdb5');
  BX(b, gx0 - .2, G.h - .55, gz1 - .2, gx1 + .2, G.h, gz1, '#d9cdb5');       // 문 위 벽
  BX(b, gx0 - .4, G.h, gz0 - .4, gx1 + .4, G.h + .25, gz1 + .3, '#7a4a3a');
  BX(b, G.x - .3, G.h - .45, gz1, G.x + .3, G.h - .3, gz1 + .15, '#fff3b8', 3);   // 차고 등
  BX(b, gx1 + .2, 0, gz0 + 1.2, gx1 + .22, 1.9, gz0 + 2.0, '#6b4a2b');       // 차고 옆문
  const H = EHOUSE, hx0 = H.x - 3.2, hx1 = H.x + 3.2, hz0 = H.z - 3, hz1 = H.z + 3;
  BX(b, hx0, 0, hz0, hx1, 3.6, hz1, '#efe6d2');
  for (let i = 0; i < 5; i++) BX(b, hx0 - .4 + i * .35, 3.6 + i * .42, hz0 - .4, hx1 + .4 - i * .35, 4.02 + i * .42, hz1 + .4, i % 2 ? '#8a4b3c' : '#9c5444');
  BX(b, H.x - .55, 0, hz1, H.x + .55, 2.1, hz1 + .06, '#7a5233');           // 현관문
  BX(b, H.x - .9, 0, hz1, H.x + .9, .18, hz1 + 1.1, '#b8ad98');              // 현관 계단
  BX(b, H.x + .6, 2.2, hz1 + .05, H.x + .8, 2.5, hz1 + .2, '#fff3b8', 3);   // 현관등
  BX(b, hx0 + .2, 0, hz1 + 1.5, gx1 + .6, .04, hz1 + 2.4, '#b8ad98');        // 옆문 → 현관 길
  BX(b, gx1 + .2, 0, gz0 + 1.2, gx1 + 1.4, .04, gz0 + 2.0, '#b8ad98');
  BX(b, H.x + .2, 0, hz1 + .2, gx1 + 1.4, .04, hz1 + 1.6, '#b8ad98');
  for (let x = 6; x < 22; x++) BX(b, x, 0, hz1 + 4.6, x + .1, .7, hz1 + 4.7, '#f4f6f8');   // 낮은 울타리
  return {mesh:b.mesh(), lamps};
}
function mkGarageDoor(){ const b = new VB(); for (let i = 0; i < 5; i++) BX(b, -EGAR.w / 2, i * .45, 0, EGAR.w / 2, i * .45 + .43, .1, i % 2 ? '#e6e9ec' : '#d3d8dd'); return b.mesh(); }
function mkHouseWin(on){ const b = new VB(); for (const dx of [-2.1, 1.6]) BX(b, EHOUSE.x + dx - .5, 1.2, EHOUSE.z + 3, EHOUSE.x + dx + .5, 2.2, EHOUSE.z + 3.07, on ? '#ffe9a8' : '#2a3b55', on ? 3 : 1); return b.mesh(); }

/* ----- 마을 주차장의 번개 트럭 ----- */
function epiTownSync(){
  if (!WORLD || WORLD.kind !== 'story') return;
  WORLD.objects = WORLD.objects.filter(o => o.type !== 'truck');
  WORLD.objects.push({type:'truck', id:'bolt_truck', x:Math.floor(ETRUCK_TOWN.x), y:Math.floor(ETRUCK_TOWN.z), name:'번개 트럭'});
}
function epiTownDraw(t){
  if (!WORLD || WORLD.kind !== 'story') return;
  const x = ETRUCK_TOWN.x, z = ETRUCK_TOWN.z;
  drawM(model('boltTruck', mkBoltTruck), M4.trs(x, 0, z, -Math.PI / 2, .82)); SHADOWS.push([x, 0, z, 1]);
  if (actAllDone()) sprAdd(x, 2.4 + Math.sin(t * 3) * .08, z, iconBadge('pick', epiState().got ? '🔑' : '🎁'), .42);
}
function talkTruck(){
  const n = ACTS.filter(a => actDone(a)).length, st = epiState();
  if (!actAllDone()) return showDialog('번개 트럭', [`각진 은색 전기 트럭이 서 있어요. 앞에 '모든 활동을 마친 전기 마스터에게'라는 쪽지가 붙어 있어요.`, `🔒 활동 10개를 모두 마치면 받을 수 있어요. (지금 ${n}/${ACTS.length})`]);
  if (!st.got) return epiOffer();
  showDialog('번개 트럭', [{who:'', text:'번개 트럭에 탈까요?', choices:[{label:'🔑 우리 집까지 운전하기', fn:() => { UI.epiGo = true; }}, {label:'아니요, 조금 더 둘러볼게요'}]}], () => { if (UI.epiGo){ UI.epiGo = false; epiStart(); } });
}
function epiOffer(){
  const st = epiState();
  showDialog('시장님', [
    {who:'시장님', text:'전기 마스터! 활동을 모두 마치고 점등식까지 성공시켰군요. 마을을 대표해 큰 선물을 준비했어요.'},
    {who:'시장님', text:'3차시 구역에서 본 그 그림자, 기억나요? 바로 주차장 뒤편의 이 은색 트럭이에요. 이름은 번개 트럭! 바퀴마다 달린 전동기 속 전자석이 힘차게 바퀴를 돌리는 전기 트럭이지요.'},
    {who:'시장님', text:'오늘 밤은 이 트럭을 타고 집에 가요. 운전할 때도 횡단보도와 사람을 조심하고요!', choices:[
      {label:'🔑 열쇠를 받고 집으로 운전해 가기', fn:() => { UI.epiGo = true; }},
      {label:'열쇠만 받고 조금 더 둘러볼게요'},
    ]},
  ], () => { st.got = true; persist(); rpgToast('🔑 <b>번개 트럭 열쇠</b>를 받았어요! 주차장 뒤편의 트럭에서 언제든 집으로 갈 수 있어요.', 'item'); if (UI.epiGo){ UI.epiGo = false; epiStart(); } else UI.waypoint = {x:Math.floor(ETRUCK_TOWN.x), y:Math.floor(ETRUCK_TOWN.z), label:'번개 트럭'}; });
}

/* ----- 시작 · 끝 ----- */
function epiStart(){
  if (!G3.ok || G3.lost){ return epiEndCard(); }
  closePanelSilently(); $('#dialog').hidden = true; UI.dialog = null;
  if (bikeOn()) SAVE.bike.on = false;
  EO.x = Math.round(WORLD.w / 2) - 4; EO.z = -14;
  Object.assign(EPI, {on:true, ph:'intro', t:0, x:0, z:1, a:Math.PI, v:0, door:0, walk:0, fade:1, win:0, bump:0, px:0, pz:0, pa:0});
  MODE = 'epi'; showHUD(false); $('#title').hidden = true; KEYS.clear(); JOY.x = JOY.y = 0; PATH3.nodes = null; NEAR = null; UI.waypoint = null;
  $('#epiBar').hidden = false; $('#touch').hidden = !IS_TOUCH; $('#actBtn').hidden = true; $('#jumpBtn').hidden = true;
  CAM3.snap = true; SFX.win();
}
function epiSkip(){ if (EPI.ph === 'drive' || EPI.ph === 'intro'){ EPI.ph = 'park'; EPI.t = 0; } else if (EPI.ph !== 'end'){ EPI.ph = 'end'; EPI.t = 0; } }
function epiExit(toTitle){
  EPI.on = false; EPI.ph = 'off';
  $('#epiBar').hidden = true; $('#actBtn').hidden = false; $('#jumpBtn').hidden = false;
  closePanelSilently();
  if (toTitle) return showTitle();
  MODE = 'play'; showHUD(true); updateHUD(); placePlayer(ETRUCK_TOWN.x - 2.5, ETRUCK_TOWN.z - 1.6); cam3Snap();
}
function epiEndCard(){
  const st = epiState(); st.done = (st.done || 0) + 1; persist();
  if (st.done === 1){ award('eco', 10); award('em', 10); }
  openPanel(`<div style="text-align:center;display:grid;gap:12px;justify-items:center;padding:8px 0">
    <div style="font-size:72px;line-height:1">🏠</div><h2 style="margin:0">에필로그 · 집으로</h2>
    <p style="max-width:480px;margin:0;line-height:1.7">전자석을 찾고, AI 두뇌를 가르치고, 마을의 위험과 낭비를 줄인 하루였어요.<br>번개 트럭의 전동기도, 집 안의 냉장고와 선풍기도 전자석 덕분에 움직여요.<br><b>오늘도 전기를 안전하고 알뜰하게. 잘 자요, 전기 마스터!</b></p>
    <div class="row" style="justify-content:center;gap:8px"><button class="btn primary" id="epBack">마을로 돌아가기</button><button class="btn" id="epAgain">한 번 더 운전하기</button><button class="btn ghost" id="epTitle">처음 화면</button></div></div>`, {onClose:() => { if (EPI.on) epiExit(); }});
  $('#epBack').onclick = () => { closePanelSilently(); epiExit(); };
  $('#epAgain').onclick = () => { closePanelSilently(); epiStart(); };
  $('#epTitle').onclick = () => { closePanelSilently(); epiExit(true); };
}

/* ----- 매 장면 ----- */
function epiUpdate(dt){
  if (!EPI.on) return;
  const E = EPI; E.t += dt; E.bump = Math.max(0, E.bump - dt);
  if (E.ph === 'intro'){ E.fade = Math.max(0, 1 - E.t / 1.2); if (E.t > 1.4){ E.ph = 'drive'; E.t = 0; } return; }
  if (E.ph === 'drive'){
    const K = k => KEYS.has(k);
    const acc = (K('ArrowUp') || K('KeyW') ? 1 : 0) - (K('ArrowDown') || K('KeyS') ? 1 : 0) - JOY.y;
    const steer = (K('ArrowLeft') || K('KeyA') ? 1 : 0) - (K('ArrowRight') || K('KeyD') ? 1 : 0) - JOY.x;
    E.v += (acc > 0 ? acc * 7 : acc < 0 ? acc * 10 : -Math.sign(E.v) * 2.5) * dt;
    if (Math.abs(E.v) < .05 && !acc) E.v = 0;
    E.v = clamp(E.v, -3, 10);
    E.a += steer * dt * 1.7 * clamp(Math.abs(E.v) / 4, 0, 1) * Math.sign(E.v || 1);
    E.x += Math.sin(E.a) * E.v * dt; E.z += Math.cos(E.a) * E.v * dt;
    const r = epiRoadDist(E.x, E.z);
    if (r.d > 1.9 && !(E.z < -46 && Math.abs(E.x - EGAR.x) < 2.5)){   /* 길 밖으로 나가면 살짝 밀려 돌아온다 */
      const k = (r.d - 1.9) / r.d; E.x -= (E.x - r.x) * k; E.z -= (E.z - r.z) * k;
      if (E.bump <= 0 && Math.abs(E.v) > 2){ E.bump = .6; SFX.tone(140, .12, 'square', .04); } E.v *= .97;
    }
    if (Math.hypot(E.x - EGAR.x, E.z - (EGAR.z + EGAR.d / 2 + 4.5)) < 3.4){ E.ph = 'park'; E.t = 0; SFX.ping(); }
    return;
  }
  if (E.ph === 'park'){   /* 스스로 차고 안으로 */
    const tx = EGAR.x, tz = EGAR.z - .1, k = 1 - Math.pow(.35, dt);
    if (E.t < .05){ E.sx = E.x; E.sz = E.z; E.sa = E.a; }
    const u = clamp(E.t / 2.6, 0, 1), s = u * u * (3 - 2 * u);
    E.x = lerp(E.sx, tx, s); E.z = lerp(E.sz, tz, s); E.a = E.sa + angDiff(Math.PI, E.sa) * Math.min(1, s * 1.4); E.v = 0;
    if (E.t > 2.8){ E.ph = 'door'; E.t = 0; SFX.tone(220, 1.6, 'sawtooth', .02, -60); }
    return;
  }
  if (E.ph === 'door'){ E.door = clamp(E.t / 2.2, 0, 1); if (E.t > 2.6){ E.ph = 'walk'; E.t = 0; E.px = EGAR.x + EGAR.w / 2 + .7; E.pz = EGAR.z - EGAR.d / 2 + 1.6; } return; }
  if (E.ph === 'walk'){   /* 옆문 → 현관 */
    const pts = [[EGAR.x + EGAR.w / 2 + .7, EGAR.z - EGAR.d / 2 + 1.6], [EGAR.x + EGAR.w / 2 + 1.0, EHOUSE.z + 3.9], [EHOUSE.x, EHOUSE.z + 3.9], [EHOUSE.x, EHOUSE.z + 3.05]];
    const sp = 1.6 * dt; let [tx, tz] = pts[Math.min(pts.length - 1, E.wi || 0)];
    const dx = tx - E.px, dz = tz - E.pz, d = Math.hypot(dx, dz);
    if (d < .06){ E.wi = (E.wi || 0) + 1; if (E.wi >= pts.length){ E.ph = 'inside'; E.t = 0; SFX.tone(660, .1, 'square', .03); SFX.tone(880, .14, 'square', .03, 0, .12); } }
    else { E.px += dx / d * Math.min(sp, d); E.pz += dz / d * Math.min(sp, d); E.pa = Math.atan2(dx, dz); E.walk += dt; }
    return;
  }
  if (E.ph === 'inside'){ E.win = clamp((E.t - .5) / .6, 0, 1); if (E.t > 2.4){ E.ph = 'end'; E.t = 0; } return; }
  if (E.ph === 'end'){ E.fade = clamp(E.t / 1.4, 0, 1); if (E.t > 1.6 && !E.carded){ E.carded = true; epiEndCard(); } }
}
function epiCam(){
  const E = EPI, C = {rate:.02, sy:.12};
  if (E.ph === 'intro' || E.ph === 'drive' || E.ph === 'park'){
    const fx = Math.sin(E.a), fz = Math.cos(E.a);
    return Object.assign(C, {tx:EO.x + E.x + fx * 3, ty:1.4, tz:EO.z + E.z + fz * 3, yaw:E.a + Math.PI, pitch:.36, dist:12, rate:.008});
  }
  if (E.ph === 'door') return Object.assign(C, {tx:EO.x + EGAR.x, ty:1.3, tz:EO.z + EGAR.z + EGAR.d / 2, yaw:.15, pitch:.12, dist:6.2, rate:.03});
  return Object.assign(C, {tx:EO.x + (EGAR.x + EHOUSE.x) / 2 + 1, ty:1.6, tz:EO.z + EHOUSE.z + 3.6, yaw:.35, pitch:.22, dist:10.5, rate:.03});
}
function epiDraw(env, dt){
  const E = EPI, t = TIME;
  const W = model('epiWorld', () => { const w = mkEpiWorld(); EPI.lamps = w.lamps; return w.mesh; });
  drawM(W, E3(0, 0, 0));
  drawM(model('boltTruck', mkBoltTruck), E3(E.x, 0, E.z, E.a)); SHADOWS.push([EO.x + E.x, 0, EO.z + E.z, 1.2]);
  const dy = E.door * (EGAR.h - .55);   /* 문은 위에서 아래로 내려온다 */
  if (E.door > 0) drawM(model('garageDoor', mkGarageDoor), M4.trs(EO.x + EGAR.x, (EGAR.h - .55) - dy, EO.z + EGAR.z + EGAR.d / 2 - .25, 0, 1, E.door));
  drawM(model('houseWin' + (E.win > .5 ? 1 : 0), () => mkHouseWin(E.win > .5)), E3(0, 0, 0));
  if (E.ph === 'walk') person3('player', EO.x + E.px, 0, EO.z + E.pz, E.pa, E.walk, hasEquipped('gloves'));
}
function epiLights(){
  const E = EPI;
  for (const [x, z] of (EPI.lamps || [])) addLight(EO.x + x - .4, 3, EO.z + z, 9, [1, .85, .55]);
  const fx = Math.sin(E.a), fz = Math.cos(E.a);
  if (E.ph !== 'walk' && E.ph !== 'inside' && E.ph !== 'end') addLight(EO.x + E.x + fx * 3.4, 1, EO.z + E.z + fz * 3.4, 9, [1, 1, .95]);
  addLight(EO.x + EHOUSE.x + .7, 2.4, EO.z + EHOUSE.z + 3.4, 7, [1, .9, .6]);
  addLight(EO.x + EGAR.x, 2.7, EO.z + EGAR.z + EGAR.d / 2 + .8, 9, [1, .9, .65]);   // 차고 문 위 등
  if (E.win > 0) addLight(EO.x + EHOUSE.x, 1.8, EO.z + EHOUSE.z + 3.6, 10 * E.win, [1, .88, .55]);
}
function epiOverlay(){
  const E = EPI;
  if (E.ph === 'drive' || E.ph === 'intro'){
    const left = Math.max(0, Math.round(Math.hypot(E.x - EGAR.x, E.z - EGAR.z) * 4)), kmh = Math.round(Math.abs(E.v) * 6);
    mg3Tag(CW / 2, 78, `🏠 우리 집까지 ${left} m · ⚡ 번개 트럭 ${kmh} km/h`, {size:16, border:'#ffd23f'});
    if (E.t < 6 || E.ph === 'intro') mg3Tag(CW / 2, CH - (IS_TOUCH ? 190 : 46), IS_TOUCH ? '조이스틱 위: 가속 · 아래: 브레이크 · 좌우: 핸들' : '↑ 가속 · ↓ 브레이크 · ← → 핸들 · Esc 건너뛰기', {size:14});
  } else if (E.ph === 'door') mg3Tag(CW / 2, 78, '차고 문이 닫혀요…', {size:16});
  else if (E.ph === 'walk' || E.ph === 'inside') mg3Tag(CW / 2, 78, '집으로 들어가요', {size:16});
  if (E.ph === 'intro'){ ctx.fillStyle = `rgba(255,255,255,${E.fade})`; ctx.fillRect(0, 0, CW, CH); }
  if (E.ph === 'end'){ ctx.fillStyle = `rgba(6,10,18,${E.fade})`; ctx.fillRect(0, 0, CW, CH); }
}
