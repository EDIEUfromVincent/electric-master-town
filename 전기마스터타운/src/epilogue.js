/* =========================================================
   7-2. 에필로그 — 번개 트럭을 타고 우리 집으로 (밤의 도시 운전 미션)
   · 주차장 뒤편의 각진 은색 전기 트럭(번개 트럭)은 3차시까지 마치고 점등식이 끝나면 시장님이 선물로 준다.
   · 트럭에 타면 밤의 도시로 바뀐다. 사거리 · 삼거리 · 로터리 · 횡단보도 · 어린이 보호구역을 지나 집 차고까지 운전한다.
     (↑ 가속 · ↓ 브레이크 · ←→ 핸들). 다른 차들이 다니고, 사람과 동물이 길을 건넌다.
   · 길마다 제한 속도가 있다. 과속하거나 다른 차 · 가로수 · 사람 · 동물을 치면 '압수 경고'가 한 칸씩 찬다(트럭이 워낙 세서
     차는 찌그러지고, 가로수는 부러지고, 사람과 동물은 다친다). 4칸이 차면 트럭을 압수당하고 걸어가야 한다.
   · 걸어가는 도중 경찰이 딱 한 번 더 기회를 준다. 이때 또 난폭 운전을 하면 경찰에게 잡히고 전기 마스터의 명예(경험치)를 잃는다.
   · 차고 앞에 닿으면 트럭이 스스로 차고에 들어가고, 문이 내려오고, 주인공이 현관으로 들어가며 하루가 끝난다.
   ========================================================= */
const EPI = {on:false, ph:'off', t:0, x:0, z:0, a:Math.PI, v:0, door:0, px:0, pz:0, pa:0, walk:0, fade:0, win:0, bump:0,
  strikes:0, last:false, foot:false, asked:false, viol:[], speedT:0, speedCD:0, flash:0, msg:'', msgT:0, footT:0, tx:0, tz:0, ta:0};
const EO = {x:30, z:-10};   /* 에필로그 무대 원점: 마을 북쪽 바깥 */
const EGAR = {x:20, z:-82.7, w:4.2, d:5.4, h:2.8};      /* 차고: 앞(+z)이 도로 쪽 */
const EHOUSE = {x:26.4, z:-83.3};
const ETRUCK_TOWN = {x:43.4, z:41.45};                   /* 마을 주차장의 번개 트럭 */
const EPI_STRIKES = 4;
const epiState = () => { if (!SAVE.epi || typeof SAVE.epi !== 'object') SAVE.epi = {got:false, done:0}; return SAVE.epi; };
const E3 = (x, y, z, ry = 0, s = 1) => M4.trs(EO.x + x, y, EO.z + z, ry, s);

/* ----- 도시의 길: 선분(a→b, 반폭 w, 제한 속도 lim km/h)과 로터리 ----- */
const EROADS = [
  {a:[0, 6], b:[0, -33], w:2.2, lim:50, name:'중앙로'},
  {a:[-20, -20], b:[36, -20], w:2.2, lim:50, name:'번개로'},
  {a:[7, -40], b:[20, -40], w:2.2, lim:40, name:'로터리 동쪽 길'},
  {a:[-7, -40], b:[-20, -40], w:2.2, lim:40, name:'로터리 서쪽 길'},
  {a:[0, -47], b:[0, -64], w:2.2, lim:40, name:'로터리 북쪽 길'},
  {a:[20, -20], b:[20, -79], w:2.2, lim:40, name:'우리 동네 길', school:[-67, -45]},
];
const ERING = {c:[0, -40], r:6, w:2.1, lim:30, name:'로터리'};
const ECROSS = [{x:0, z:-11, ax:'x'}, {x:9, z:-20, ax:'z'}, {x:20, z:-56, ax:'x'}, {x:20, z:-30, ax:'x'}];   /* 횡단보도 (ax: 사람이 건너는 방향) */
function epiRoad(x, z){
  let best = {d:1e9, lim:20, name:'', w:2.2, off:true};
  for (const R of EROADS){
    const [ax, az] = R.a, [bx, bz] = R.b, dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / L, 0, 1), d = Math.hypot(x - ax - dx * t, z - az - dz * t);
    if (d < best.d){ const sc = R.school && z <= R.school[1] && z >= R.school[0]; best = {d, w:R.w, lim:sc ? 30 : R.lim, name:sc ? '어린이 보호구역' : R.name, school:sc, seg:R, px:ax + dx * t, pz:az + dz * t}; }
  }
  const rr = Math.hypot(x - ERING.c[0], z - ERING.c[1]), dr = Math.abs(rr - ERING.r);
  if (dr < best.d) best = {d:dr, w:ERING.w, lim:ERING.lim, name:ERING.name, ring:true, rr};
  best.on = best.d < best.w; best.side = best.d < best.w + 1.1;
  return best;
}
const epiBld = (x, z) => EPI.bld && EPI.bld.has(Math.floor(x) + ',' + Math.floor(z));

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
/* ----- 밤의 도시: 길 · 인도 · 횡단보도 · 로터리 · 건물 · 가로등 · 우리 집 ----- */
function mkEpiCity(){
  const b = new VB(), lamps = [], trees = [], bld = new Set(), signs = [];
  const X0 = -26, X1 = 42, Z0 = -92, Z1 = 10, home = (x, z) => x > 11 && x < 35 && z < -75;
  BX(b, X0, -.32, Z0, X1, -.04, Z1, '#3d6b34');                                   // 풀밭
  const drive = (x, z) => Math.abs(x - EGAR.x) < 2.1 && z < -78 && z > EGAR.z + EGAR.d / 2 - .2;
  for (let x = X0; x < X1; x++) for (let z = Z0; z < Z1; z++){
    const r = epiRoad(x + .5, z + .5);
    if (r.on || drive(x + .5, z + .5)) BX(b, x, -.04, z, x + 1, 0, z + 1, r.school ? '#5c3434' : '#30353d');
    else if (r.side && !home(x, z)) BX(b, x, -.04, z, x + 1, .08, z + 1, '#8d939b');
    else if (r.ring && r.rr < ERING.r - ERING.w) BX(b, x, -.04, z, x + 1, .12, z + 1, '#4f8a3c');
  }
  /* 가운데 노란 점선 (교차로·로터리 안에서는 그리지 않는다) */
  for (const R of EROADS){
    const [ax, az] = R.a, [bx, bz] = R.b, L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
    for (let s = 1; s < L - 1; s += 2.4){
      const x = ax + ux * s, z = az + uz * s;
      if (EROADS.some(Q => Q !== R && epiRoadOne(Q, x, z) < Q.w + .8) || Math.abs(Math.hypot(x - ERING.c[0], z - ERING.c[1]) - ERING.r) < ERING.w + 1) continue;
      BX(b, x - .07 - ux * .55, 0, z - .07 - uz * .55, x + .07 + ux * .55, .012, z + .07 + uz * .55, '#ffd23f', 1);
    }
  }
  /* 횡단보도 줄무늬 */
  for (const C of ECROSS) for (let k = -2; k <= 2; k++){
    if (C.ax === 'x') BX(b, C.x + k * .85 - .28, 0, C.z - .8, C.x + k * .85 + .28, .014, C.z + .8, '#f4f6f8', 1);
    else BX(b, C.x - .8, 0, C.z + k * .85 - .28, C.x + .8, .014, C.z + k * .85 + .28, '#f4f6f8', 1);
  }
  /* 로터리 가운데: 번개 기념탑 */
  const [cx, cz] = ERING.c;
  BX(b, cx - .8, .12, cz - .8, cx + .8, .6, cz + .8, '#8d939b'); BX(b, cx - .25, .6, cz - .25, cx + .25, 3.2, cz + .25, '#c9ced6');
  BX(b, cx - .5, 3.2, cz - .1, cx + .5, 3.5, cz + .1, '#ffd23f', 3); BX(b, cx - .1, 3.5, cz - .1, cx + .3, 4.1, cz + .1, '#ffd23f', 3);
  /* 건물: 길에서 떨어진 곳에 블록 빌딩 (창문에 불) */
  for (let bx0 = X0; bx0 < X1 - 4; bx0 += 6) for (let bz0 = Z0; bz0 < Z1 - 4; bz0 += 6){
    let ok = hash2(bx0, bz0, 91) > .2;
    for (let x = bx0; x < bx0 + 5 && ok; x++) for (let z = bz0; z < bz0 + 5 && ok; z++){ const r = epiRoad(x + .5, z + .5); if (r.d < r.w + 3 || home(x, z)) ok = false; }
    if (!ok) continue;
    const H = 3 + Math.floor(hash2(bz0, bx0, 7) * 6), col = ['#4a5568', '#5b6573', '#3d4757', '#6b5b4f', '#4f5d6e'][Math.floor(hash2(bx0, bz0, 3) * 5)];
    BX(b, bx0, 0, bz0, bx0 + 5, H, bz0 + 5, col);
    for (let y = 1; y < H - .6; y += 1.25) for (let k = 0; k < 2; k++) for (const zf of [bz0 + 5, bz0 - .02]){
      const lit = hash2(bx0 + k * 3 + y * 7, bz0 + (zf > bz0 ? 1 : 0), 13) > .45;
      BX(b, bx0 + .7 + k * 2.3, y, zf, bx0 + 1.9 + k * 2.3, y + .65, zf + .02, lit ? '#ffe9a8' : '#22303f', lit ? 2 : -1);
    }
    for (let x = bx0; x < bx0 + 5; x++) for (let z = bz0; z < bz0 + 5; z++) bld.add(x + ',' + z);
  }
  /* 가로등 · 가로수 · 제한 속도 표지판 */
  for (const R of EROADS){
    const [ax, az] = R.a, [bx, bz] = R.b, L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, nx = -uz, nz = ux;
    const clear = (x, z) => !bld.has(Math.floor(x) + ',' + Math.floor(z)) && !home(x, z) && EROADS.every(Q => Q === R || epiRoadOne(Q, x, z) > Q.w + 1.6) && Math.abs(Math.hypot(x - cx, z - cz) - ERING.r) > ERING.w + 1.4 && ECROSS.every(C => Math.hypot(C.x - x, C.z - z) > 3.4);
    for (let s = 4; s < L - 2; s += 10) for (const sd of [-1, 1]){ const x = ax + ux * s + nx * sd * (R.w + .9), z = az + uz * s + nz * sd * (R.w + .9); if (!clear(x, z)) continue;
      lamps.push([x, z]); BX(b, x - .07, 0, z - .07, x + .07, 3.2, z + .07, '#39424e'); BX(b, x - .3, 3.0, z - .3, x + .3, 3.15, z + .3, '#fff3b8', 3); }
    for (let s = 2; s < L - 1; s += 4.5) for (const sd of [-1, 1]){ const x = ax + ux * s + nx * sd * (R.w + 1.9), z = az + uz * s + nz * sd * (R.w + 1.9); if (clear(x, z) && hash2(Math.floor(x), Math.floor(z), 5) > .15) trees.push({x, z, broken:false}); }
    for (const [s, sd] of [[2.5, 1], [L - 2.5, -1]]){ const x = ax + ux * s + nx * sd * (R.w + .7), z = az + uz * s + nz * sd * (R.w + .7); if (!clear(x, z)) continue;
      signs.push({x, z, lim:R.school ? 40 : R.lim}); BX(b, x - .05, 0, z - .05, x + .05, 2.0, z + .05, '#9aa3ad'); }
    if (R.school){ const z = R.school[1] - 1, x = ax + nx * (R.w + .7); signs.push({x, z, lim:30, school:true}); BX(b, x - .05, 0, z - .05, x + .05, 2.0, z + .05, '#9aa3ad'); }
  }
  signs.push({x:cx + ERING.r + ERING.w + .8, z:cz + 4, lim:30, ring:true});
  /* 우리 집 + 차고 */
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
  return {mesh:b.mesh(), lamps, trees, bld, signs};
}
function epiRoadOne(R, x, z){
  const [ax, az] = R.a, [bx, bz] = R.b, dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, t = clamp(((x - ax) * dx + (z - az) * dz) / L, 0, 1);
  return Math.hypot(x - ax - dx * t, z - az - dz * t);
}
function mkTree3(broken){
  const b = new VB();
  if (!broken){ BX(b, -.15, 0, -.15, .15, 1.8, .15, '#6b4a2b'); BX(b, -.85, 1.6, -.85, .85, 2.8, .85, '#2f6b35'); BX(b, -.5, 2.8, -.5, .5, 3.3, .5, '#3a7d40'); }
  else { BX(b, -.16, 0, -.16, .16, .45, .16, '#6b4a2b'); BX(b, .1, 0, -.15, 1.9, .3, .15, '#6b4a2b'); BX(b, 1.6, 0, -.7, 2.9, .9, .7, '#2f6b35'); }
  return b.mesh();
}
function mkPoliceBar(col){ const b = new VB(); BX(b, -.3, 0, -.08, .3, .14, .08, col, 3); return b.mesh(); }
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

/* ----- 도시에 사는 것들: 다른 차 · 횡단보도의 사람 · 동물 ----- */
const ECAR_DEF = [
  {p:[[-24, -19], [40, -19]], c:'#d94141', sp:5.4}, {p:[[40, -21], [-24, -21]], c:'#3a8ee6', sp:5.0},
  {ring:true, th:0, c:'#ffd23f', sp:3.4}, {ring:true, th:Math.PI, c:'#2fb36b', sp:3.4},
  {p:[[-1, -31], [-1, 8]], c:'#c58bff', sp:5.0}, {p:[[19, -78], [19, -22]], c:'#ff8a2a', sp:4.0},
];
const EPED_LOOK = ['student', 'grandma', 'reporter', 'tech'];
function epiPopulate(){
  const C = EPI.city;
  EPI.trees = C.trees.map(t => ({...t, broken:false}));
  EPI.cars = ECAR_DEF.map(d => ({...d, s:d.ring ? 0 : Math.random() * 30, th:d.th || 0, x:0, z:0, a:0, dent:false}));
  EPI.peds = ECROSS.map((cw, i) => ({cw, u:i % 2 ? 1 : -1, dir:i % 2 ? -1 : 1, wait:1 + i, look:EPED_LOOK[i % EPED_LOOK.length], hurt:false, x:0, z:0, walk:0}));
  EPI.animals = [{kind:'dog', home:[23.6, -50]}, {kind:'cat', home:[16.4, -62]}, {kind:'dog', home:[-3.6, -6]}].map(a => ({...a, x:a.home[0], z:a.home[1], tx:a.home[0], tz:a.home[1], wait:2 + Math.random() * 3, hurt:false, ry:0, walk:0}));
  EPI.police = null;
}
function epiCarStep(c, dt){
  if (c.dent) return;
  const E = EPI, fw = [Math.sin(c.a), Math.cos(c.a)];
  const ahead = (x, z, r) => { const dx = x - c.x, dz = z - c.z, along = dx * fw[0] + dz * fw[1], side = Math.abs(dx * fw[1] - dz * fw[0]); return along > 0 && along < r && side < 1.6; };
  let go = !(E.ph === 'drive' && ahead(E.x, E.z, 4.2)) && !E.peds.some(p => !p.hurt && Math.abs(p.u) < 1 && ahead(p.x, p.z, 3.4)) && !E.cars.some(o => o !== c && ahead(o.x, o.z, 3.6));
  if (E.ph === 'foot' && ahead(E.px, E.pz, 3)) go = false;
  if (c.ring){
    if (go) c.th -= c.sp / ERING.r * dt;
    const nx = ERING.c[0] + Math.cos(c.th) * ERING.r, nz = ERING.c[1] + Math.sin(c.th) * ERING.r;
    if (c.x || c.z) c.a = Math.atan2(nx - c.x, nz - c.z) || c.a; c.x = nx; c.z = nz; return;
  }
  const [[ax, az], [bx, bz]] = c.p, L = Math.hypot(bx - ax, bz - az);
  if (go) c.s += c.sp * dt; if (c.s > L) c.s = 0;
  c.x = ax + (bx - ax) * c.s / L; c.z = az + (bz - az) * c.s / L; c.a = Math.atan2(bx - ax, bz - az);
}
function epiPedStep(p, dt){
  if (p.hurt) return;
  const C = p.cw, E = EPI;
  if (p.wait > 0){ p.wait -= dt; p.walk = 0;
    if (p.wait <= 0 && E.ph === 'drive' && Math.hypot(E.x - C.x, E.z - C.z) < 9 && Math.abs(E.v) > 2) p.wait = .6;   /* 빠른 차가 가까우면 조금 더 기다린다 */
  } else { p.u += p.dir * 1.15 / 3.6 * dt; p.walk += dt; if (Math.abs(p.u) >= 1){ p.u = Math.sign(p.u); p.dir = -p.dir; p.wait = 2 + Math.random() * 3; } }
  if (C.ax === 'x'){ p.x = C.x + p.u * 3.6; p.z = C.z + .3; p.ry = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
  else { p.x = C.x + .3; p.z = C.z + p.u * 3.6; p.ry = p.dir > 0 ? 0 : Math.PI; }
}
function epiAnimalStep(a, dt){
  if (a.hurt) return;
  const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
  if (d < .1){ a.walk = 0; a.wait -= dt; if (a.wait <= 0){
    const r = epiRoad(a.home[0], a.home[1]), cross = Math.random() < .35 && r.px != null;   /* 가끔 길을 건너간다 */
    if (cross){ a.tx = 2 * r.px - a.x; a.tz = 2 * r.pz - a.z; } else { a.tx = a.home[0] + (Math.random() - .5) * 4; a.tz = a.home[1] + (Math.random() - .5) * 4; }
    if (epiBld(a.tx, a.tz)){ a.tx = a.home[0]; a.tz = a.home[1]; }
    a.wait = 3 + Math.random() * 6; } return; }
  const sp = 1.3 * dt; a.x += dx / d * Math.min(sp, d); a.z += dz / d * Math.min(sp, d); a.ry = Math.atan2(dx, dz); a.walk += dt;
}

/* ----- 시작 · 끝 ----- */
function epiStart(){
  if (!G3.ok || G3.lost){ return epiEndCard(); }
  closePanelSilently(); $('#dialog').hidden = true; UI.dialog = null;
  if (bikeOn()) SAVE.bike.on = false;
  EO.x = Math.round(WORLD.w / 2) - 4; EO.z = -14;
  if (!EPI.city){ EPI.city = mkEpiCity(); EPI.bld = EPI.city.bld; }
  Object.assign(EPI, {on:true, ph:'intro', t:0, x:1, z:3, a:Math.PI, v:0, door:0, walk:0, fade:1, win:0, bump:0, px:0, pz:0, pa:0, wi:0, carded:false,
    strikes:0, last:false, foot:false, asked:false, viol:[], speedT:0, speedCD:0, flash:0, msg:'', msgT:0, footT:0, hitCD:0, grace:2.5, walked:false});
  epiPopulate();
  MODE = 'epi'; showHUD(false); $('#title').hidden = true; KEYS.clear(); JOY.x = JOY.y = 0; PATH3.nodes = null; NEAR = null; UI.waypoint = null;
  $('#epiBar').hidden = false; $('#touch').hidden = !IS_TOUCH; $('#actBtn').hidden = true; $('#jumpBtn').hidden = true;
  CAM3.snap = true; SFX.win();
}
function epiSkip(){
  const E = EPI;
  if (E.ph === 'drive' || E.ph === 'intro' || E.ph === 'foot'){ E.ph = 'park'; E.t = 0; E.foot = false; }
  else if (E.ph === 'seized' || E.ph === 'caught'){ E.t = 99; }
  else if (E.ph !== 'end'){ E.ph = 'end'; E.t = 0; }
}
function epiExit(toTitle){
  EPI.on = false; EPI.ph = 'off';
  $('#epiBar').hidden = true; $('#actBtn').hidden = false; $('#jumpBtn').hidden = false;
  closePanelSilently();
  if (toTitle) return showTitle();
  MODE = 'play'; showHUD(true); updateHUD(); placePlayer(ETRUCK_TOWN.x - 2.5, ETRUCK_TOWN.z - 1.6); cam3Snap();
}
function epiEndCard(){
  const st = epiState(), E = EPI, n = E.viol.length; st.done = (st.done || 0) + 1; persist();
  if (st.done === 1){ award('eco', 10); award('em', 10); }
  const clean = n === 0 && !E.foot;
  if (clean && !st.clean){ st.clean = true; persist(); award('safe', 15); rpgToast('🏅 <b>모범 운전자</b> · 위반 없이 집까지 운전했어요!', 'item'); }
  openPanel(`<div style="text-align:center;display:grid;gap:12px;justify-items:center;padding:8px 0">
    <div style="font-size:72px;line-height:1">${clean ? '🏅' : '🏠'}</div><h2 style="margin:0">에필로그 · 집으로</h2>
    <p style="max-width:500px;margin:0;line-height:1.7">${clean ? '<b>모범 운전자!</b> 제한 속도를 지키고 아무것도 다치게 하지 않고 집에 왔어요.' : `운전 기록: 위반 <b>${n}번</b>${E.walked ? ' · 트럭을 압수당해 걸어서 왔어요' : ''}.`}<br>
      전자석을 찾고, AI 두뇌를 가르치고, 마을의 위험과 낭비를 줄인 하루였어요. 번개 트럭의 전동기도, 집 안의 냉장고와 선풍기도 전자석 덕분에 움직여요.<br><b>오늘도 전기를 안전하고 알뜰하게. 잘 자요, 전기 마스터!</b></p>
    ${n ? `<div class="note" style="text-align:left;max-width:480px">${E.viol.map(v => '· ' + esc(v)).join('<br>')}</div>` : ''}
    <div class="row" style="justify-content:center;gap:8px"><button class="btn primary" id="epBack">마을로 돌아가기</button><button class="btn" id="epAgain">한 번 더 운전하기</button><button class="btn ghost" id="epTitle">처음 화면</button></div></div>`, {onClose:() => { if (EPI.on) epiExit(); }});
  $('#epBack').onclick = () => { closePanelSilently(); epiExit(); };
  $('#epAgain').onclick = () => { closePanelSilently(); epiStart(); };
  $('#epTitle').onclick = () => { closePanelSilently(); epiExit(true); };
}
function epiCaughtCard(){
  const st = epiState(); st.caught = (st.caught || 0) + 1; persist();
  rpgPenalty(30, '에필로그 난폭 운전 · 전기 마스터의 명예');
  openPanel(`<div style="text-align:center;display:grid;gap:12px;justify-items:center;padding:8px 0">
    <div style="font-size:72px;line-height:1">🚓</div><h2 style="margin:0">경찰에게 잡혔어요</h2>
    <p style="max-width:480px;margin:0;line-height:1.7">마지막 기회에서도 난폭 운전을 해서 경찰서로 가게 되었어요. <b>전기 마스터의 명예(경험치 30)</b>를 잃었어요.<br>힘이 센 전기 트럭일수록 더 조심해서 운전해야 해요. 다시 도전해 볼까요?</p>
    <div class="note" style="text-align:left;max-width:480px">${EPI.viol.map(v => '· ' + esc(v)).join('<br>')}</div>
    <div class="row" style="justify-content:center;gap:8px"><button class="btn primary" id="epAgain">처음부터 다시 운전하기</button><button class="btn" id="epBack">마을로 돌아가기</button></div></div>`, {onClose:() => { if (EPI.on) epiExit(); }});
  $('#epBack').onclick = () => { closePanelSilently(); epiExit(); };
  $('#epAgain').onclick = () => { closePanelSilently(); epiStart(); };
}

/* ----- 위반 · 압수 · 마지막 기회 ----- */
function epiSay(msg, t = 2.6){ EPI.msg = msg; EPI.msgT = t; }
function epiViolation(text){
  const E = EPI; E.viol.push(text); E.flash = 1; SFX.buzz(); fxShakeEpi();
  if (E.last){ epiSay(`🚨 ${text} — 마지막 기회였는데…`, 3); E.ph = 'caught'; E.t = 0; epiPolice(); return; }
  E.strikes++;
  if (E.strikes >= EPI_STRIKES){ epiSay(`🚓 ${text} — 압수 경고 ${EPI_STRIKES}칸이 다 찼어요! 트럭을 압수합니다.`, 3.4); E.ph = 'seized'; E.t = 0; E.v = 0; epiPolice(); return; }
  epiSay(`⚠️ ${text} · 압수 경고 ${E.strikes}/${EPI_STRIKES}`);
}
function fxShakeEpi(){ EPI.bump = .5; }
function epiPolice(){
  const E = EPI, fx = Math.sin(E.a), fz = Math.cos(E.a);
  E.police = {x:E.x - fx * 14, z:E.z - fz * 14, a:E.a, tx:E.x - fz * 2.6 - fx * 3, tz:E.z + fx * 2.6 - fz * 3};
  SFX.tone(700, .4, 'square', .03, 300); SFX.tone(900, .4, 'square', .03, -300, .4);
}
function epiSecondChance(){
  const E = EPI; E.asked = true;
  const C = t => ({who:'🚓 경찰관', text:t});
  let again = false;
  showDialog('🚓 경찰관', [C('잠깐! 걸어서 가는 모습을 보니 반성하고 있군요.'), C('딱 한 번만 더 트럭을 돌려줄게요. 하지만 이번에도 과속하거나 무언가를 치면 바로 경찰서로 가야 하고, 전기 마스터의 명예도 사라질 수 있어요.'),
    {who:'🚓 경찰관', text:'어떻게 할래요?', choices:[{label:'⚠️ 약속해요. 조심해서 다시 운전할게요', fn:() => { again = true; }}, {label:'🚶 끝까지 걸어갈게요'}]}],
    () => {
      if (!again) return epiSay('🚶 좋아요, 끝까지 걸어가요. 집은 지도 오른쪽 위 🏠!', 3);
      const r = epiRoad(E.px, E.pz);
      E.x = r.px != null ? r.px : E.px; E.z = r.pz != null ? r.pz : E.pz; E.v = 0; E.last = true; E.foot = false; E.police = null; E.ph = 'drive'; E.t = 0;
      if (r.seg){ const [ax, az] = r.seg.a, [bx, bz] = r.seg.b; let a = Math.atan2(bx - ax, bz - az); const toHome = Math.atan2(EGAR.x - E.x, EGAR.z - E.z); if (Math.cos(a - toHome) < 0) a += Math.PI; E.a = a; }
      for (const c of E.cars) if (Math.hypot(c.x - E.x, c.z - E.z) < 7){ if (c.ring) c.th += 2.2; else c.s += 14; epiCarStep(c, 0); }   /* 돌려받은 자리의 차는 비켜 준다 */
      E.grace = 2.5; epiSay('⚠️ 마지막 기회! 한 번만 더 위반하면 경찰에게 잡혀요.', 4); SFX.ping();
    });
}

/* ----- 매 장면 ----- */
function epiUpdate(dt){
  if (!EPI.on) return;
  const E = EPI; E.t += dt; E.bump = Math.max(0, E.bump - dt); E.flash = Math.max(0, E.flash - dt * 2); E.msgT -= dt; E.speedCD -= dt; E.hitCD -= dt;
  if (uiBlocking()) return;
  if (['intro', 'drive', 'foot', 'seized', 'caught'].includes(E.ph)){ for (const c of E.cars) epiCarStep(c, dt); for (const p of E.peds) epiPedStep(p, dt); for (const a of E.animals) epiAnimalStep(a, dt); }
  if (E.ph === 'intro'){ E.fade = Math.max(0, 1 - E.t / 1.2); if (E.t > 1.4){ E.ph = 'drive'; E.t = 0; epiSay('🏠 우리 집까지 운전해요! 제한 속도를 지키고 사람 · 동물 · 가로수 · 다른 차를 조심해요.', 5); } return; }
  if (E.ph === 'drive') return epiDrive(dt);
  if (E.ph === 'seized' || E.ph === 'caught'){
    const P = E.police; if (P){ const k = 1 - Math.pow(.2, dt); P.x += (P.tx - P.x) * k; P.z += (P.tz - P.z) * k; }
    if (E.ph === 'seized' && E.t > 3.4){ E.ph = 'foot'; E.foot = true; E.walked = true; E.t = 0; E.footT = 0; E.px = E.x - Math.cos(E.a) * 2.2; E.pz = E.z + Math.sin(E.a) * 2.2; E.pa = E.a; epiSay('🚶 트럭을 압수당했어요. 집까지 걸어가요. (지도 오른쪽 위 🏠)', 4); }
    if (E.ph === 'caught' && E.t > 3 && !E.carded){ E.carded = true; epiCaughtCard(); }
    return;
  }
  if (E.ph === 'foot'){
    const v = inputVector(), sp = 3.4 * dt;
    if (Math.abs(v.x) + Math.abs(v.y) > .05){
      const nx = E.px + v.x * sp, nz = E.pz + v.y * sp;
      if (!epiBld(nx, E.pz)) E.px = clamp(nx, -25, 41); if (!epiBld(E.px, nz)) E.pz = clamp(nz, -91, 9);
      E.pa = Math.atan2(v.x, v.y); E.walk += dt;
    } else E.walk = 0;
    E.footT += dt;
    if (!E.asked && !E.last && E.footT > 6) epiSecondChance();
    if (Math.hypot(E.px - EHOUSE.x, E.pz - (EHOUSE.z + 3.9)) < 2.2){ E.ph = 'walk'; E.t = 0; E.wi = 2; }
    return;
  }
  if (E.ph === 'park'){   /* 스스로 차고 안으로 */
    const tx = EGAR.x, tz = EGAR.z - .1;
    if (E.t < .05){ E.sx = E.x; E.sz = E.z; E.sa = E.a; }
    const u = clamp(E.t / 2.6, 0, 1), s = u * u * (3 - 2 * u);
    E.x = lerp(E.sx, tx, s); E.z = lerp(E.sz, tz, s); E.a = E.sa + angDiff(Math.PI, E.sa) * Math.min(1, s * 1.4); E.v = 0;
    if (E.t > 2.8){ E.ph = 'door'; E.t = 0; SFX.tone(220, 1.6, 'sawtooth', .02, -60); }
    return;
  }
  if (E.ph === 'door'){ E.door = clamp(E.t / 2.2, 0, 1); if (E.t > 2.6){ E.ph = 'walk'; E.t = 0; E.wi = 0; E.px = EGAR.x + EGAR.w / 2 + .7; E.pz = EGAR.z - EGAR.d / 2 + 1.6; } return; }
  if (E.ph === 'walk'){   /* 옆문(또는 걸어온 길) → 현관 */
    const pts = [[EGAR.x + EGAR.w / 2 + .7, EGAR.z - EGAR.d / 2 + 1.6], [EGAR.x + EGAR.w / 2 + 1.0, EHOUSE.z + 3.9], [EHOUSE.x, EHOUSE.z + 3.9], [EHOUSE.x, EHOUSE.z + 3.05]];
    const sp = 1.6 * dt; const [tx, tz] = pts[Math.min(pts.length - 1, E.wi || 0)];
    const dx = tx - E.px, dz = tz - E.pz, d = Math.hypot(dx, dz);
    if (d < .06){ E.wi = (E.wi || 0) + 1; if (E.wi >= pts.length){ E.ph = 'inside'; E.t = 0; SFX.tone(660, .1, 'square', .03); SFX.tone(880, .14, 'square', .03, 0, .12); } }
    else { E.px += dx / d * Math.min(sp, d); E.pz += dz / d * Math.min(sp, d); E.pa = Math.atan2(dx, dz); E.walk += dt; }
    return;
  }
  if (E.ph === 'inside'){ E.win = clamp((E.t - .5) / .6, 0, 1); if (E.t > 2.4){ E.ph = 'end'; E.t = 0; } return; }
  if (E.ph === 'end'){ E.fade = clamp(E.t / 1.4, 0, 1); if (E.t > 1.6 && !E.carded){ E.carded = true; epiEndCard(); } }
}
function epiDrive(dt){
  const E = EPI, K = k => KEYS.has(k);
  const acc = (K('ArrowUp') || K('KeyW') ? 1 : 0) - (K('ArrowDown') || K('KeyS') ? 1 : 0) - JOY.y;
  const steer = (K('ArrowLeft') || K('KeyA') ? 1 : 0) - (K('ArrowRight') || K('KeyD') ? 1 : 0) - JOY.x;
  E.v += (acc > 0 ? acc * 7 : acc < 0 ? acc * 10 : -Math.sign(E.v) * 2.5) * dt;
  if (Math.abs(E.v) < .05 && !acc) E.v = 0;
  const r = epiRoad(E.x, E.z);
  E.v = clamp(E.v, -3, r.on ? 11 : 6);                                   /* 길 밖(풀밭)에서는 느려진다 */
  E.a += steer * dt * 1.8 * clamp(Math.abs(E.v) / 4, 0, 1) * Math.sign(E.v || 1);
  const fx = Math.sin(E.a), fz = Math.cos(E.a), nx = E.x + fx * E.v * dt, nz = E.z + fz * E.v * dt;
  if (epiBld(nx + fx * 2, nz + fz * 2) || epiBld(nx, nz)){ if (Math.abs(E.v) > 2){ SFX.tone(140, .12, 'square', .04); E.bump = .4; } E.v *= -.25; }
  else { E.x = clamp(nx, -24, 40); E.z = clamp(nz, -90, 8); }
  if (E.grace > 0){ E.grace -= dt; E.kmh = Math.round(Math.abs(E.v) * 6); E.lim = r.on ? r.lim : 30; E.road = r; return; }   /* 출발 직후 잠깐은 봐준다 */
  /* 부딪힘: 트럭 앞뒤 두 점 */
  const pts = [[E.x + fx * 1.4, E.z + fz * 1.4], [E.x - fx * 1.2, E.z - fz * 1.2]];
  const near = (x, z, rad) => pts.some(([px, pz]) => Math.hypot(px - x, pz - z) < rad);
  for (const c of E.cars) if (!c.dent && near(c.x, c.z, 1.9)){ c.dent = true; E.v *= -.3; SFX.boom(); epiViolation('🚗 다른 차를 들이받았어요 (그 차가 찌그러졌어요)'); if (E.ph !== 'drive') return; }
  for (const t of E.trees) if (!t.broken && near(t.x, t.z, 1.0)){ t.broken = true; t.fall = E.a; E.v *= .4; SFX.boom(); epiViolation('🌳 가로수를 들이받아 부러뜨렸어요'); if (E.ph !== 'drive') return; }
  for (const p of E.peds) if (!p.hurt && near(p.x, p.z, 1.1)){ p.hurt = true; E.v *= .2; SFX.buzz(); epiViolation('🧑 사람을 쳤어요! 사람이 다쳤어요'); if (E.ph !== 'drive') return; }
  for (const a of E.animals) if (!a.hurt && near(a.x, a.z, .9)){ a.hurt = true; E.v *= .5; SFX.buzz(); epiViolation(`${a.kind === 'cat' ? '🐱' : '🐶'} 동물을 쳤어요! 동물이 다쳤어요`); if (E.ph !== 'drive') return; }
  /* 과속: 제한 속도보다 5 km/h 넘게 1초 가까이 달리면 단속 */
  const kmh = Math.round(Math.abs(E.v) * 6), lim = r.on ? r.lim : 30;
  if (kmh > lim + 4){ E.speedT += dt; if (E.speedT > .9 && E.speedCD <= 0){ E.speedT = 0; E.speedCD = 5; epiViolation(`📸 과속 단속! ${r.on ? r.name + ' ' : ''}제한 ${lim} km/h인데 ${kmh} km/h`); if (E.ph !== 'drive') return; } }
  else E.speedT = Math.max(0, E.speedT - dt);
  E.kmh = kmh; E.lim = lim; E.road = r;
  if (Math.hypot(E.x - EGAR.x, E.z - (EGAR.z + EGAR.d / 2 + 4.5)) < 3.4){ E.ph = 'park'; E.t = 0; SFX.ping(); }
}
function epiHint(){
  const E = EPI, x = E.foot ? E.px : E.x, z = E.foot ? E.pz : E.z, rr = Math.hypot(x - ERING.c[0], z - ERING.c[1]);
  if (Math.abs(x - EGAR.x) < 5 && z < -70) return '🏠 집이 보여요! 차고 앞까지 천천히';
  if (rr < 10) return '🔄 로터리: 시계 반대 방향으로 돌다가 ➡ 동쪽 출구로 나가요 (제한 30)';
  if (Math.abs(x - 20) < 4 && z < -42) return '🏫 어린이 보호구역 제한 30! 횡단보도의 사람과 동물을 조심해요';
  if (Math.abs(z + 40) < 4 && x > 6) return '↖ 삼거리: 북쪽(왼쪽)으로 꺾어 우리 동네 길로';
  if (Math.abs(z + 20) < 4) return x < 17 ? '✚ 사거리 · 번개로: 직진해 로터리로 가거나, 동쪽으로 가다 삼거리에서 북쪽으로' : '↖ 삼거리: 북쪽(왼쪽)으로 꺾어 우리 동네 길로';
  if (Math.abs(x) < 4 && z > -20) return '⬆ 중앙로 직진 (제한 50) · 앞에 횡단보도와 사거리';
  if (Math.abs(x - 20) < 4) return '⬆ 우리 동네 길을 따라 북쪽으로';
  return E.foot ? '🚶 지도의 🏠를 보고 걸어가요' : '길을 벗어났어요. 오른쪽 위 지도를 보고 도로로 돌아가요';
}
function epiCam(){
  const E = EPI, C = {rate:.02, sy:.12};
  if (E.ph === 'intro' || E.ph === 'drive' || E.ph === 'park'){
    const fx = Math.sin(E.a), fz = Math.cos(E.a);
    return Object.assign(C, {tx:EO.x + E.x + fx * 3, ty:1.4, tz:EO.z + E.z + fz * 3, yaw:E.a + Math.PI, pitch:.4, dist:12.5, rate:.008});
  }
  if (E.ph === 'seized' || E.ph === 'caught') return Object.assign(C, {tx:EO.x + E.x, ty:1.2, tz:EO.z + E.z, yaw:E.a + Math.PI / 2, pitch:.38, dist:12, rate:.02});
  if (E.ph === 'foot') return Object.assign(C, {tx:EO.x + E.px, ty:1, tz:EO.z + E.pz, yaw:0, pitch:.62, dist:9, rate:.01});
  if (E.ph === 'door') return Object.assign(C, {tx:EO.x + EGAR.x, ty:1.3, tz:EO.z + EGAR.z + EGAR.d / 2, yaw:.15, pitch:.12, dist:6.2, rate:.03});
  return Object.assign(C, {tx:EO.x + (EGAR.x + EHOUSE.x) / 2 + 1, ty:1.6, tz:EO.z + EHOUSE.z + 3.6, yaw:.35, pitch:.22, dist:10.5, rate:.03});
}
function epiDraw(env, dt){
  const E = EPI, t = TIME;
  if (!E.city) return;
  drawM(model('epiCity', () => E.city.mesh), E3(0, 0, 0));
  for (const tr of E.trees) drawM(model(tr.broken ? 'etreeB' : 'etree', () => mkTree3(tr.broken)), E3(tr.x, 0, tr.z, tr.broken ? (tr.fall || 0) - Math.PI / 2 : 0));
  for (const c of E.cars){
    drawM(model('car:' + c.c + (c.dent ? ':d' : ''), () => mkCar(c.dent ? hexShade(c.c, -.35) : c.c, false)), M4.mul(E3(c.x, 0, c.z, c.a + (c.dent ? .3 : 0)), M4.trs(0, 0, 0, 0, 1.7, c.dent ? 1.28 : 1.7)));
    SHADOWS.push([EO.x + c.x, 0, EO.z + c.z, 1.1]); if (c.dent) sprAdd(EO.x + c.x, 1.9, EO.z + c.z, iconBadge('pick', '💥'), .4);
  }
  for (const p of E.peds){
    if (p.hurt){ personPose3(p.look, EO.x + p.x, .1, EO.z + p.z, p.ry || 0, Math.PI / 2, 0); sprAdd(EO.x + p.x, 1.1, EO.z + p.z, iconBadge('pick', '🤕'), .36); }
    else person3(p.look, EO.x + p.x, 0, EO.z + p.z, p.ry || 0, p.walk);
  }
  for (const a of E.animals){ animal3(a.kind, EO.x + a.x, 0, EO.z + a.z, a.ry, a.hurt ? 0 : a.walk, t); if (a.hurt) sprAdd(EO.x + a.x, .9, EO.z + a.z, iconBadge('pick', '🤕'), .32); }
  if (E.police){ const P = E.police; drawM(model('car:#1d2433', () => mkCar('#1d2433', false)), M4.mul(E3(P.x, 0, P.z, P.a), M4.trs(0, 0, 0, 0, 1.7)));
    drawM(model(Math.sin(t * 12) > 0 ? 'pbarR' : 'pbarB', () => mkPoliceBar(Math.sin(t * 12) > 0 ? '#ff3b30' : '#2f7bff')), E3(P.x, .95, P.z, P.a)); SHADOWS.push([EO.x + P.x, 0, EO.z + P.z, 1.1]); }
  const truckShown = !(E.ph === 'foot' && !E.police);
  if (truckShown){ drawM(model('boltTruck', mkBoltTruck), E3(E.x, 0, E.z, E.a)); SHADOWS.push([EO.x + E.x, 0, EO.z + E.z, 1.2]); }
  const dy = E.door * (EGAR.h - .55);
  if (E.door > 0) drawM(model('garageDoor', mkGarageDoor), M4.trs(EO.x + EGAR.x, (EGAR.h - .55) - dy, EO.z + EGAR.z + EGAR.d / 2 - .25, 0, 1, E.door));
  drawM(model('houseWin' + (E.win > .5 ? 1 : 0), () => mkHouseWin(E.win > .5)), E3(0, 0, 0));
  if (E.ph === 'walk' || E.ph === 'foot') person3('player', EO.x + E.px, 0, EO.z + E.pz, E.pa, E.walk, hasEquipped('gloves'));
  sprAdd(EO.x + EHOUSE.x, 6.4 + Math.sin(t * 2) * .1, EO.z + EHOUSE.z, iconBadge('mis', '🏠'), .7);
}
function epiLights(){
  const E = EPI, px = E.foot ? E.px : E.x, pz = E.foot ? E.pz : E.z;
  const L = (E.city ? E.city.lamps : []).map(l => [l, Math.hypot(l[0] - px, l[1] - pz)]).sort((a, b) => a[1] - b[1]).slice(0, 14);
  for (const [[x, z]] of L) addLight(EO.x + x, 3, EO.z + z, 9, [1, .85, .55]);
  const fx = Math.sin(E.a), fz = Math.cos(E.a);
  if (['intro', 'drive', 'park', 'seized', 'caught'].includes(E.ph)) addLight(EO.x + E.x + fx * 3.4, 1, EO.z + E.z + fz * 3.4, 9, [1, 1, .95]);
  if (E.police) addLight(EO.x + E.police.x, 1.6, EO.z + E.police.z, 10, Math.sin(TIME * 12) > 0 ? [1, .2, .2] : [.2, .4, 1]);
  addLight(EO.x + EHOUSE.x + .7, 2.4, EO.z + EHOUSE.z + 3.4, 7, [1, .9, .6]);
  addLight(EO.x + EGAR.x, 2.7, EO.z + EGAR.z + EGAR.d / 2 + .8, 9, [1, .9, .65]);
  if (E.win > 0) addLight(EO.x + EHOUSE.x, 1.8, EO.z + EHOUSE.z + 3.6, 10 * E.win, [1, .88, .55]);
}
/* ----- 화면 위 글: 속도 · 제한 속도 · 압수 경고 · 안내 · 지도 ----- */
function epiOverlay(){
  const E = EPI, top = 78;
  const driving = E.ph === 'drive' || E.ph === 'intro';
  if (driving || E.ph === 'foot'){
    const x = E.foot ? E.px : E.x, z = E.foot ? E.pz : E.z, left = Math.max(0, Math.round(Math.hypot(x - EGAR.x, z - EGAR.z) * 4));
    mg3Tag(CW / 2, top, `${E.foot ? '🚶 걸어서' : '⚡ 번개 트럭'} · 🏠 우리 집까지 ${left} m${E.road && E.road.on && !E.foot ? ' · ' + E.road.name : ''}`, {size:15, border:'#ffd23f'});
    mg3Tag(CW / 2, CH - (IS_TOUCH ? 200 : 54), epiHint(), {size:14});
    /* 압수 경고 */
    const sx = 16, sy = top - 14;
    ctx.font = `800 14px ${FONT_B}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const lbl = E.last ? '⚠️ 마지막 기회 · 한 번만 더 위반하면 경찰!' : E.foot ? '🚓 트럭 압수됨' : '🚓 압수 경고';
    const w = Math.max(ctx.measureText(lbl).width + 24, E.last || E.foot ? 0 : 170);
    ctx.fillStyle = E.last ? 'rgba(120,20,20,.9)' : 'rgba(21,32,43,.9)'; rr(ctx, sx, sy, w, E.last || E.foot ? 30 : 54, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(lbl, sx + 12, sy + 15);
    if (!E.last && !E.foot) for (let i = 0; i < EPI_STRIKES; i++){ ctx.fillStyle = i < E.strikes ? '#ff5b4f' : 'rgba(255,255,255,.18)'; rr(ctx, sx + 12 + i * 36, sy + 30, 30, 14, 4); ctx.fill(); }
  }
  if (driving && E.kmh != null){
    const bx = 22, by = CH - (IS_TOUCH ? 300 : 120), over = E.kmh > E.lim + 4;
    ctx.fillStyle = 'rgba(21,32,43,.9)'; rr(ctx, bx, by, 150, 84, 12); ctx.fill();
    ctx.fillStyle = over ? '#ff5b4f' : '#fff'; ctx.font = `900 34px ${FONT_D}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(String(E.kmh), bx + 12, by + 36);
    ctx.font = `700 12px ${FONT_B}`; ctx.fillStyle = '#cfd8e3'; ctx.fillText('km/h', bx + 14, by + 66);
    const cx = bx + 112, cy = by + 42; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 26, 0, 7); ctx.fill();
    ctx.lineWidth = 7; ctx.strokeStyle = '#e5483a'; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 7); ctx.stroke();
    ctx.fillStyle = '#1c2733'; ctx.font = `900 18px ${FONT_D}`; ctx.textAlign = 'center'; ctx.fillText(String(E.lim), cx, cy + 1);
  }
  /* 길가의 제한 속도 표지판 */
  if (E.city && driving) for (const s of E.city.signs){
    if (Math.hypot(s.x - E.x, s.z - E.z) > 22) continue;
    const p = proj3(EO.x + s.x, 2.3, EO.z + s.z); if (!p.ok) continue;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, 7); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#e5483a'; ctx.beginPath(); ctx.arc(p.x, p.y, 13, 0, 7); ctx.stroke();
    ctx.fillStyle = '#1c2733'; ctx.font = `900 12px ${FONT_D}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(s.lim), p.x, p.y + 1);
    if (s.school){ ctx.font = `800 11px ${FONT_B}`; ctx.fillStyle = '#ffd23f'; ctx.fillText('어린이 보호구역', p.x, p.y - 24); }
  }
  if (driving || E.ph === 'foot') epiMinimap();
  if (E.msgT > 0 && E.msg) mg3Tag(CW / 2, CH * .3, E.msg, {size:17, border:E.msg.startsWith('⚠️') || E.msg.startsWith('🚓') || E.msg.startsWith('🚨') ? '#ff5b4f' : '#ffd23f'});
  if (E.ph === 'seized') mg3Tag(CW / 2, top, '🚓 트럭을 압수하는 중…', {size:16, border:'#ff5b4f'});
  if (E.ph === 'caught') mg3Tag(CW / 2, top, '🚨 경찰에게 잡혔어요', {size:16, border:'#ff5b4f'});
  if (E.ph === 'door') mg3Tag(CW / 2, top, '차고 문이 닫혀요…', {size:16});
  else if (E.ph === 'walk' || E.ph === 'inside') mg3Tag(CW / 2, top, '집으로 들어가요', {size:16});
  if (driving && E.t < 7 && !IS_TOUCH) mg3Tag(CW / 2, CH - 22, '↑ 가속 · ↓ 브레이크 · ← → 핸들 · Esc 건너뛰기', {size:13});
  if (E.flash > 0){ ctx.fillStyle = `rgba(255,70,60,${E.flash * .28})`; ctx.fillRect(0, 0, CW, CH); }
  if (E.ph === 'intro'){ ctx.fillStyle = `rgba(255,255,255,${E.fade})`; ctx.fillRect(0, 0, CW, CH); }
  if (E.ph === 'end'){ ctx.fillStyle = `rgba(6,10,18,${E.fade})`; ctx.fillRect(0, 0, CW, CH); }
}
function epiMinimap(){
  const E = EPI, W = 104, H = 156, x0 = CW - W - 14, y0 = 64, sx = W / 68, sz = H / 102;
  const P = (x, z) => [x0 + (x + 26) * sx, y0 + (z + 92) * sz];
  ctx.fillStyle = 'rgba(21,32,43,.88)'; rr(ctx, x0 - 6, y0 - 6, W + 12, H + 12, 10); ctx.fill();
  ctx.strokeStyle = '#7f8b99'; ctx.lineCap = 'round';
  for (const R of EROADS){ const [a, b] = [P(...R.a), P(...R.b)]; ctx.lineWidth = R.school ? 4 : 3.5; ctx.strokeStyle = R.school ? '#b3646b' : '#7f8b99'; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  const [rx, rz] = P(...ERING.c); ctx.strokeStyle = '#7f8b99'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.ellipse(rx, rz, ERING.r * sx, ERING.r * sz, 0, 0, 7); ctx.stroke();
  for (const c of E.cars){ const [x, y] = P(c.x, c.z); ctx.fillStyle = c.dent ? '#555' : c.c; ctx.fillRect(x - 2, y - 2, 4, 4); }
  const [hx, hy] = P(EHOUSE.x, EHOUSE.z); ctx.font = '14px ' + EMOJI_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🏠', hx, hy);
  const [mx, my] = P(E.foot ? E.px : E.x, E.foot ? E.pz : E.z); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(mx, my, 4, 0, 7); ctx.fill(); ctx.strokeStyle = '#1c2733'; ctx.lineWidth = 2; ctx.stroke();
}
