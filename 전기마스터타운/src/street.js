/* =========================================================
   5-3. 거리 사람들(행인) · 부딪힘 · 전기 자전거
   · 행인: 할아버지 · 할머니 · 유모차 끄는 아주머니 · 자전거 타는 아이 · 뛰어다니는 아이 · 대학생.
     보도로 다니고 횡단보도로 길을 건넌다(차가 멈춘다). 뛰어다니는 아이는 가끔 무단 횡단을 한다 → 차에 치이면 다친다.
   · 사람과 부딪히면 서로 밀려나며 휘청인다. 같은 사람을 자꾸 치거나 세게 부딪히면 다툼이 일어난다.
   · 전기 자전거(시장님 선물, 충전소 옆 거치대): 길가 친구를 모두 만나야 탈 수 있다. 빠르기 2배.
     자전거로 사람을 치면 그 사람이 다치고 내 경험치(레벨)가 깎인다. ❤️는 차에 치일 때만 줄어든다.
   ========================================================= */
Object.assign(LOOKS, {
  grandpa:   {shirt:'#8d6e63', pants:'#4e4e4e', skin:'#f0c8a0', hair:'#e6e6e6', hat:'#6d4c41'},
  grandma2:  {shirt:'#e57373', pants:'#5a4a6a', skin:'#f2c9a0', hair:'#dcdcdc'},
  mom:       {shirt:'#f48fb1', pants:'#37474f', skin:'#f2c9a0', hair:'#3a2a1d'},
  kidBike:   {shirt:'#29b6f6', pants:'#2a3341', skin:'#f6d0a8', hair:'#2a1d14', hat:'#e53935', scale:.78},
  kidRun:    {shirt:'#ff7043', pants:'#1e88e5', skin:'#f1c9a0', hair:'#2a1d14', scale:.76},
  kidRun2:   {shirt:'#ab47bc', pants:'#43a047', skin:'#f6d0a8', hair:'#5a3a22', scale:.74},
  collegian: {shirt:'#5c6bc0', pants:'#263238', skin:'#f0c8a0', hair:'#1d1d2b'},
  collegian2:{shirt:'#26a69a', pants:'#3e2723', skin:'#e9bd92', hair:'#4a2f1d', hat:'#37474f'},
});
/* 사람마다 말투가 다르다: bump(살짝) · angry(다툼이 길어질수록 1→2→3) · sorry(사과를 받았을 때) · talk(그냥 말 걸 때) · ouch(다쳤을 때) */
const PEDS = [
  {id:'p_gpa', look:'grandpa', name:'할아버지', sp:.7, elder:true,
   bump:['허허, 이 늙은이 넘어질 뻔했구먼.', '어이쿠, 지팡이 놓칠 뻔했네!', '에잉, 눈 좀 뜨고 다니게.'],
   angry:['이 녀석! 어른한테 부딪히고 그냥 가는 게냐?', '허, 말대꾸까지 하는구먼! 요즘 아이들은 예의가 없어!', '에잉, 안전 지킴이를 불러야겠구먼! 괘씸한지고!'],
   sorry:'그래그래, 사과할 줄 알면 됐다. 조심히 다니거라.', ouch:'아이고 허리야… 일어나질 못하겠구먼.',
   talk:['허허, 우리 땐 전기가 귀했지. 아껴 쓰거라.', '저 큰 전구탑 불 켜지는 날만 기다린다네.', '횡단보도에서는 손을 들고 건너야 하는 게야.']},
  {id:'p_mom', look:'mom', name:'유모차 끄는 아주머니', sp:.85, stroller:true,
   bump:['어머! 유모차에 아기 있어요!', '앗, 아기 깰 뻔했잖아요. 쉿!', '조심! 유모차 바퀴에 발 밟혀요.'],
   angry:['아기가 깼잖아요! 어떻게 할 거예요?', '지금 그게 할 말이에요? 아기가 울잖아요!', '정말 속상하네요. 안전 지킴이를 불러야겠어요!'],
   sorry:'사과해 줘서 고마워요. 우리 아기도 괜찮대요. 까꿍!', ouch:'아야… 유모차는요? 아기는 괜찮아요?',
   talk:['쉿, 아기가 자고 있어요.', '아기 방 콘센트에는 안전 덮개를 꽂아 뒀어요.', '유모차는 보도 가장자리로 다녀요.']},
  {id:'p_run', look:'kidRun', name:'뛰어다니는 아이', sp:2.2, jay:true, fast:true,
   bump:['앗 따거! 미안, 술래한테 쫓기는 중이야!', '으앗, 부딪혔다! 너 술래 아니지?', '헉헉, 비켜 줘!'],
   angry:['아야! 왜 앞을 막고 있어!', '네가 먼저 부딪혔잖아! 사과해!', '흥, 엄마한테 다 이를 거야!'],
   sorry:'히히, 나도 미안! 우리 같이 술래잡기 할래?', ouch:'으앙… 다리가 너무 아파…',
   talk:['술래잡기 중이야! 나 잡아 봐!', '차도로 뛰어가면 지름길인데… 아, 위험하다고?']},
  {id:'p_uni', look:'collegian', name:'대학생 형', sp:1.25,
   bump:['앗, 미안! 휴대 전화 보느라 앞을 못 봤어.', '어이쿠, 커피 쏟을 뻔!', '헉, 이어폰 끼고 있어서 못 들었어.'],
   angry:['저기, 일부러 그러는 거 아니지? 이게 몇 번째야?', '말이 좀 심하네. 형한테 그러면 안 되지.', '하… 수업 늦겠다. 너 때문에 시간만 가잖아.'],
   sorry:'그래, 나도 걸으면서 휴대 전화 본 게 잘못이야. 서로 조심하자!', ouch:'윽… 발목을 접질린 것 같아.',
   talk:['전기 전자 공학과 다녀. 전자석 공부 재밌지?', '걸으면서 휴대 전화 보면 위험해. 나도 고칠게.']},
];
/* 길가 친구(퀘스트 친구 · 동물)가 부딪혔을 때: 대사와 몸짓(jump 깡충 · fly 날아오름 · flee 도망 · spin 빙글) */
const WALKER_REACT = {
  w_cat:['냐아앙! (털을 곤두세우고 펄쩍 뛰었다)', '하악! 꼬리 밟을 뻔했다냥!', 'jump'],
  w_dog:['멍멍! 왈왈! (꼬리를 흔들며 빙글빙글)', '낑! 깜짝 놀랐잖아 멍!', 'spin'],
  w_squirrel:['찍찍! 도토리 떨어뜨렸잖아!', '찍! (쪼르르 도망갔다)', 'flee'],
  w_frog:['개굴! (폴짝 높이 뛰어올랐다)', '개굴개굴! 연못으로 돌아갈 테다!', 'jump'],
  w_bird:['구구구! (푸드덕 날아올랐다)', '구구! 깃털 빠지겠다!', 'fly'],
  w_reporter:['앗, 취재 수첩! 특종인 줄 알았잖아요.', '부딪힘 사고 현장 취재 중… 농담이에요!', 'hop'],
  w_student:['어이쿠, 숙제 노트 떨어뜨릴 뻔!', '하랑이 깜짝 놀랐네!', 'hop'],
  w_grandma:['아이고, 손주 같은 녀석이 힘도 세구나.', '에구구, 조심하렴.', 'hop'],
  w_tech:['어이쿠! 공구 상자 쏟을 뻔했다.', '허허, 안전모 쓰길 잘했네.', 'hop'],
  w_bibi:['삐빅! 충돌 감지! 회피 경로 다시 계산 중…', '삐삐! 센서 점검 필요!', 'spin'],
};
const STREET = {cool:0, pair:new Map(), fights:[], quarrel:null, alarmT:null};
const pick = a => a[Math.floor(Math.random() * a.length)];
function streetState(){ if (!SAVE.street || typeof SAVE.street !== 'object') SAVE.street = {delay:0, quarrels:0, mediated:0, helped:0, hq:null, hqDone:0}; return SAVE.street; }

/* ----- 길 찾기: 맵 어디든 (큰길은 횡단보도로만, 주차장 바닥은 안 감) ----- */
function npcPass(tx, ty){
  const ch = tileAt(tx, ty); if (!ch || solidAt(tx, ty)) return false;
  return ch !== '=' || onCrosswalk(tx + .5, ty + .5);
}
function npcPath(sx, sy){
  const W = WORLD; let gx, gy;
  for (let k = 0; k < 40; k++){ gx = Math.floor(Math.random() * W.w); gy = Math.floor(Math.random() * W.h); if (npcPass(gx, gy) && Math.hypot(gx - sx, gy - sy) > 6) break; gx = null; }
  if (gx == null) return null;
  const N = W.w * W.h, prev = new Int32Array(N).fill(-1), start = sy * W.w + sx; if (start < 0 || start >= N) return null;
  prev[start] = start; const q = [start], goal = gy * W.w + gx;
  for (let qi = 0; qi < q.length; qi++){
    const cur = q[qi];
    if (cur === goal){ const path = []; let p = cur; while (p !== start){ path.push(p); p = prev[p]; } return path.reverse().map(i => ({x:i % W.w + .5, y:((i / W.w) | 0) + .5})); }
    const cx = cur % W.w, cy = (cur / W.w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
      const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W.w || ny >= W.h) continue;
      const ni = ny * W.w + nx; if (prev[ni] !== -1 || !npcPass(nx, ny)) continue;
      prev[ni] = cur; q.push(ni);
    }
  }
  return null;
}

/* ----- 행인 만들기 · 걷기 ----- */
function initPeds(world){
  STREET.fights = [];
  if (world.kind !== 'story'){ world.peds = []; return; }
  const spots = [];
  for (let k = 0; k < 600 && spots.length < PEDS.length; k++){ const x = Math.floor(Math.random() * world.w), y = Math.floor(Math.random() * world.h); if (npcPass(x, y)) spots.push([x + .5, y + .5]); }
  world.peds = PEDS.map((d, i) => ({type:'ped', id:d.id, def:d, name:d.name, x:(spots[i] || [30.5, 24.5])[0], y:(spots[i] || [30.5, 24.5])[1], path:null, tx:null, ty:null, wait:Math.random() * 3, ry:Math.random() * 6, walk:0, moving:false,
    hurt:0, injured:false, angry:0, bump:0, bumps:[], kx:0, ky:0, fight:null, check:false, say:null}));
}
function pedSpotFix(p){ if (!npcPass(Math.floor(p.x), Math.floor(p.y)) && tileAt(Math.floor(p.x), Math.floor(p.y)) !== '='){ const [x, y] = pedNearSafe(p); p.x = x; p.y = y; } }
function pedNearSafe(p){
  for (let r = 1; r <= 6; r++) for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++){
    const x = Math.floor(p.x) + dx, y = Math.floor(p.y) + dy, ch = tileAt(x, y);
    if (ch && ch !== '=' && !solidAt(x, y)) return [x + .5, y + .5];
  }
  return [p.x, p.y];
}
function pedPick(p){
  pedSpotFix(p);
  if (p.def.jay && Math.random() < .2){   /* 무단 횡단: 차도를 가로질러 바로 간다 */
    for (let k = 0; k < 12; k++){
      const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 5, x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r, tx = Math.floor(x), ty = Math.floor(y);
      const ch = tileAt(tx, ty); if (!ch || solidAt(tx, ty) || ch === '=') continue;
      let ok = true; const n = Math.ceil(r / .3); for (let i = 1; i <= n && ok; i++){ const sx = Math.floor(p.x + (x - p.x) * i / n), sy = Math.floor(p.y + (y - p.y) * i / n); ok = !!tileAt(sx, sy) && !solidAt(sx, sy); }
      if (ok){ p.path = [{x, y}]; p.jayNow = true; return; }
    }
  }
  p.jayNow = false; p.path = npcPath(Math.floor(p.x), Math.floor(p.y)); if (!p.path) p.wait = 1;
}
function pedHurt(p, why){
  if (p.hurt > 0) return;
  p.hurt = why === 'car' || why === 'bike' ? 999 : 6; p.injured = why === 'car' || why === 'bike'; p.moving = false; p.path = null; p.angry = 0; endFight(p);
  if (why === 'car'){ const [sx, sy] = pedNearSafe(p); p.x = sx; p.y = sy; }
  SFX.boom(); if (Math.hypot(player.x - p.x, player.y - p.y) < 14) fxShake(.18);
}
const pedSpeedNow = p => (p.moving ? p.def.sp : 0);
const PERSONLIKE = w => w.def && w.def.kind === 'person';
const entXY = e => (e.type === 'ped' ? [e.x, e.y] : [e.x + .5, e.y + .5]);
function entMove(e, dx, dy){
  if (e.type === 'ped'){ const nx = e.x + dx, ny = e.y + dy; const t = tileAt(Math.floor(nx), Math.floor(ny)); if (t && !solidAt(Math.floor(nx), Math.floor(ny))){ e.x = nx; e.y = ny; } }
  else { const nx = e.x + .5 + dx, ny = e.y + .5 + dy; if (walkOK(nx, ny)){ e.x += dx; e.y += dy; } }
}

function updatePeds(dt){
  const W = WORLD; if (!W || !W.peds) return;
  STREET.cool = Math.max(0, STREET.cool - dt);
  const playing = MODE === 'play' && W.kind === 'story';
  for (const p of W.peds){
    p.bump = Math.max(0, p.bump - dt); p.angry = Math.max(0, p.angry - dt);
    if (p.say){ p.say.t -= dt; if (p.say.t <= 0) p.say = null; }
    if (p.kx || p.ky){ entMove(p, p.kx * dt, p.ky * dt); const k = Math.pow(.02, dt); p.kx *= k; p.ky *= k; if (Math.abs(p.kx) + Math.abs(p.ky) < .05) p.kx = p.ky = 0; }
    if (p.hurt > 0){ p.hurt -= dt; if (p.hurt <= 0 || (p.injured && p.hurt < 999 - 120)){ p.hurt = 0; p.injured = false; p.wait = 1.5; } continue; }
    if (p.fight){ p.moving = false; continue; }
    if (p.hospital){ continue; }
    /* 차에 치이기: 횡단보도 밖 차도에 있을 때 */
    for (const c of (W.cars || [])){
      if (c.parked) continue;
      const [cx, cy] = carXY(c), along = c.axis === 'x' ? p.x - cx : p.y - cy, perp = c.axis === 'x' ? p.y - cy : p.x - cx;
      if (Math.abs(along) < .8 && Math.abs(perp) < .45){
        pedHurt(p, 'car');
        if (playing && Math.hypot(player.x - p.x, player.y - p.y) < 18){ toast(`🚑 ${p.name}가 차에 치였어요! 가서 도와줄까요? (가까이 가서 E)`, 'bad'); UI.waypoint = {x:Math.floor(p.x), y:Math.floor(p.y), label:'다친 사람 🆘'}; }
        break;
      }
    }
    if (p.hurt > 0) continue;
    if (UI.dialog && STREET.talking === p){ p.moving = false; p.ry = angLerp(p.ry || 0, Math.atan2(player.x - p.x, player.y - p.y), .2); continue; }
    if (p.wait > 0){ p.wait -= dt; p.moving = false; continue; }
    if (!p.path || !p.path.length){ pedPick(p); if (!p.path) continue; }
    const n = p.path[0], dx = n.x - p.x, dz = n.y - p.y, d = Math.hypot(dx, dz), sp = p.def.sp * dt;
    if (d < .12){ p.path.shift(); if (!p.path.length){ p.path = null; p.wait = (p.def.fast ? .3 : 1) + Math.random() * 3; p.moving = false; p.jayNow = false; } continue; }
    const s = Math.min(sp, d), nx = p.x + dx / d * s, nz = p.y + dz / d * s;
    /* 횡단보도 앞: 차가 가까우면 기다린다 (무단 횡단하는 아이는 안 기다린다!) */
    if (!p.jayNow && tileAt(Math.floor(nx), Math.floor(nz)) === '=' && tileAt(Math.floor(p.x), Math.floor(p.y)) !== '=' && (W.cars || []).some(c => !c.parked && Math.hypot(carXY(c)[0] - nx, carXY(c)[1] - nz) < 3.2)){ p.moving = false; continue; }
    const tx = Math.floor(nx), tz = Math.floor(nz); if (!tileAt(tx, tz) || solidAt(tx, tz)){ p.path = null; p.wait = .5; continue; }
    p.x = nx; p.y = nz; p.moving = true; p.walk += dt * (p.def.fast ? 1.6 : 1);
    p.ry = angLerp(p.ry || 0, Math.atan2(dx, dz), 1 - Math.pow(.001, dt));
  }
  /* 길가 친구 몸짓(깡충 · 도망) */
  for (const w of (W.walkers || [])){ if (w.hop > 0) w.hop = Math.max(0, w.hop - dt); if (w.kx || w.ky){ entMove(w, w.kx * dt, w.ky * dt); const k = Math.pow(.03, dt); w.kx *= k; w.ky *= k; if (Math.abs(w.kx) + Math.abs(w.ky) < .05) w.kx = w.ky = 0; } if (w.say){ w.say.t -= dt; if (w.say.t <= 0) w.say = null; } }
  npcBumps(dt);
  updateFights(dt);
  if (playing && !uiBlocking()) bumpCheck(dt);
  if (playing) updatePlayerKnock(dt);
  if (playing && !uiBlocking()) checkStuck(dt);
}
/* 길가 친구가 부딪혔을 때 몸짓 */
function walkerReact(w, nx, ny, strong, quiet){
  const R = WALKER_REACT[w.id] || ['어이쿠!', '앗!', 'hop'], kind = R[2];
  if (!quiet) w.say = {t:2.2, txt:pick(R.slice(0, 2))};
  w.hopT = kind === 'fly' ? 1.4 : kind === 'jump' ? .7 : .45; w.hop = w.hopT; w.hopH = kind === 'fly' ? 1.5 : kind === 'jump' ? .7 : .25;
  const f = kind === 'flee' ? 4.5 : kind === 'fly' ? 1 : 2.2 * (strong ? 1.5 : 1);
  w.kx = nx * f; w.ky = ny * f; w.tx = null; w.wait = kind === 'flee' ? .2 : 1.2;
  if (kind === 'spin') w.ry = (w.ry || 0) + Math.PI;
  if (!quiet){ SFX.tone(kind === 'fly' ? 900 : 520, .08, 'square', .035); SFX.tone(kind === 'fly' ? 1200 : 400, .08, 'square', .03, 0, .07); }
}

/* ----- NPC끼리 부딪힘 · 다툼 ----- */
function npcBumps(dt){
  const W = WORLD, list = W.peds.filter(p => p.hurt <= 0 && !p.hospital).concat((W.walkers || []).filter(w => !walkerHidden(w)));
  STREET.fightCool = Math.max(0, (STREET.fightCool || 0) - dt);
  for (const [k, v] of STREET.pair) { const nv = v - dt; if (nv <= 0) STREET.pair.delete(k); else STREET.pair.set(k, nv); }
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++){
    const a = list[i], b = list[j], [ax, ay] = entXY(a), [bx, by] = entXY(b), dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
    if (d > .46 || d < 1e-4) continue;
    const nx = dx / d, ny = dy / d, over = .46 - d;
    entMove(a, -nx * over * .5, -ny * over * .5); entMove(b, nx * over * .5, ny * over * .5);
    const key = a.id + '|' + b.id; if (STREET.pair.has(key)) continue; STREET.pair.set(key, 4);
    const fastA = a.type === 'ped' ? pedSpeedNow(a) : 0, fastB = b.type === 'ped' ? pedSpeedNow(b) : 0, strong = fastA + fastB > 2;
    /* NPC끼리 부딪히면 말없이 몸짓만 (도로가 시끄럽지 않게) */
    const react = (e, sx, sy) => { if (e.type === 'ped'){ e.bump = .6; e.kx = sx * 1.6; e.ky = sy * 1.6; e.path = null; e.wait = .8; } else walkerReact(e, sx, sy, strong, true); };
    react(a, -nx, -ny); react(b, nx, ny);
    /* 세게 부딪힌 사람끼리는 다툰다. 빠른 아이가 어르신을 세게 치면 어르신이 넘어져 다친다 */
    if (a.type === 'ped' && b.type === 'ped' && strong && !a.fight && !b.fight && STREET.fightCool <= 0 && !STREET.fights.length && Math.random() < .12){
      STREET.fightCool = 120;
      const elder = a.def.elder ? a : b.def.elder ? b : null, kid = elder === a ? b : a;
      if (elder && kid.def.fast && Math.random() < .45){ pedHurt(elder, 'fall'); elder.hurt = 999; elder.injured = true; nearToast(elder, `🆘 ${elder.name}가 넘어졌어요! 가서 도와줄까요?`); }
      else startFight(a, b);
    }
  }
}
function nearToast(p, msg){ if (MODE === 'play' && Math.hypot(player.x - p.x, player.y - p.y) < 16){ toast(msg, 'bad'); UI.waypoint = {x:Math.floor(p.x), y:Math.floor(p.y), label:'🆘'}; } }
function startFight(a, b){
  const f = {a, b, t:0, line:0, next:0};
  a.fight = f; b.fight = f; a.path = b.path = null; STREET.fights.push(f);
  nearToast(a, `💢 ${a.name}와 ${b.name}가 다투고 있어요! 말려 줄까요? (가까이 가서 E)`);
}
function endFight(p){ const f = p && p.fight; if (!f) return; f.a.fight = null; f.b.fight = null; STREET.fights = STREET.fights.filter(x => x !== f); }
function updateFights(dt){
  for (const f of STREET.fights.slice()){
    f.t += dt; f.next -= dt;
    const {a, b} = f; a.ry = angLerp(a.ry || 0, Math.atan2(b.x - a.x, b.y - a.y), .2); b.ry = angLerp(b.ry || 0, Math.atan2(a.x - b.x, a.y - b.y), .2);
    if (f.next <= 0){ const s = f.line % 2 ? b : a; s.bump = .4; f.line++; f.next = 1.9; }
    if (f.t > 40){ endFight(a); a.wait = b.wait = 2; }   /* 아무도 안 말리면 씩씩대며 헤어진다 */
  }
}

/* ----- 끼임 방지: 벽·물체 속에 들어가거나, 움직이려 해도 사방이 막혀 있으면 가까운 빈자리로 옮긴다 ----- */
const STUCK = {t:0, lx:0, ly:0};
const pBlocked = (x, y) => (G3.ok ? blocked3(x, y) : blockedAt(x, y));
function unstickPlayer(manual){
  const x0 = player.x, y0 = player.y;
  for (let r = 0; r <= 8; r++) for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++){
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const tx = Math.floor(x0) + dx, ty = Math.floor(y0) + dy, cx = tx + .5, cy = ty + .6;
    if (cx < 1 || cy < 1 || cx > WORLD.w - 1 || cy > WORLD.h - 1) continue;
    if (pBlocked(cx, cy) || (typeof isRoadLane === 'function' && isRoadLane(tx, ty) && !onCrosswalk(cx, cy))) continue;
    if (r === 0 && !manual) return false;
    if (r === 0 && manual) continue;
    player.x = cx; player.y = cy; player.kx = player.ky = 0; PATH3.nodes = null; STUCK.t = 0;
    if (G3.ok && typeof cam3Snap === 'function') cam3Snap();
    toast(manual ? '빠져나왔어요!' : '끼어 있어서 옆으로 옮겨 줬어요.', 'ok');
    return true;
  }
  return false;
}
function checkStuck(dt){
  if (pBlocked(player.x, player.y)){ unstickPlayer(false); return; }   /* 벽·물체 속 */
  const v = inputVector(), want = Math.hypot(v.x, v.y) > .3 || !!PATH3.nodes, moved = Math.hypot(player.x - STUCK.lx, player.y - STUCK.ly);
  STUCK.lx = player.x; STUCK.ly = player.y;
  if (!want || moved > .004){ STUCK.t = 0; return; }
  STUCK.t += dt;
  const s = .2, boxed = pBlocked(player.x + s, player.y) && pBlocked(player.x - s, player.y) && pBlocked(player.x, player.y + s) && pBlocked(player.x, player.y - s);
  if (STUCK.t > 1.2 && boxed) unstickPlayer(false);   /* 사방이 막힘 */
  else if (STUCK.t > 4){ STUCK.t = 0; toast('막혀서 못 가나요? 메뉴의 [🆘 끼었을 때 빠져나오기]를 눌러요.'); }
}

/* ----- 나와 부딪힘 ----- */
function updatePlayerKnock(dt){
  if (!player.kx && !player.ky) return;
  const blk = (x, y) => (G3.ok ? blocked3(x, y) : blockedAt(x, y));
  const nx = player.x + player.kx * dt, ny = player.y + player.ky * dt;
  if (!blk(nx, player.y)) player.x = nx; if (!blk(player.x, ny)) player.y = ny;
  const k = Math.pow(.02, dt); player.kx *= k; player.ky *= k; player.bump = Math.max(0, (player.bump || 0) - dt);
  if (Math.abs(player.kx) + Math.abs(player.ky) < .05) player.kx = player.ky = 0;
}
function bumpCheck(dt){
  if ((player.jz || 0) > .55) return;   /* 높이 뛰어오르면 머리 위로 지나간다 */
  const riding = bikeOn(), mySp = player.moving ? 4.6 * rpgSpeed() * (riding ? 2 : 1) : 0;
  const people = WORLD.peds.filter(p => p.hurt <= 0 && !p.hospital && !p.fight).concat((WORLD.walkers || []).filter(w => !walkerHidden(w)));
  for (const p of people){
    const isPed = p.type === 'ped', [px, py] = entXY(p);
    const dx = px - player.x, dy = py - (player.y - .05), d = Math.hypot(dx, dy), R = riding ? .62 : .5;
    if (d > R || d < 1e-4) continue;
    const nx = dx / d, ny = dy / d, over = R - d;
    { const blk = (x, y) => (G3.ok ? blocked3(x, y) : blockedAt(x, y)), qx = player.x - nx * over * .6, qy = player.y - ny * over * .6; if (!blk(qx, player.y)) player.x = qx; if (!blk(player.x, qy)) player.y = qy; } entMove(p, nx * over * .4, ny * over * .4);
    if (STREET.cool > 0 || (isPed && p.bump > 0)) continue;
    STREET.cool = .7;
    player.bump = .45; player.kx = -nx * 2.4; player.ky = -ny * 2.4;
    if (!isPed){   /* 길가 친구 · 동물 */
      if (riding && mySp > 1 && PERSONLIKE(p)){ p.say = {t:2.4, txt:'아야! 자전거로 치면 어떡해!'}; walkerReact(p, nx, ny, true); rpgPenalty(10, '자전거로 사람을 쳤어요'); continue; }
      walkerReact(p, nx, ny, riding); continue;
    }
    const rel = mySp + pedSpeedNow(p);
    p.bump = .6; p.kx = nx * 2.2; p.ky = ny * 2.2;
    if (riding && mySp > 1) return bikeHitPerson(p);
    const now = TIME; p.bumps = p.bumps.filter(t => now - t < 9); p.bumps.push(now);
    if (rel > 5.2 || p.bumps.length >= 3) return startQuarrel(p);
    SFX.tone(260, .08, 'square', .04); SFX.tone(200, .1, 'square', .03, 0, .06);
    p.say = {t:2, txt:pick(p.def.bump)};
  }
}

/* ----- 나와의 다툼: 사과하지 않으면 길어지고, 길어질수록 시간이 지체된다 ----- */
function delayAlarm(on){
  const el = $('#delayAlarm'); if (!el) return;
  clearInterval(STREET.alarmT);
  if (!on){ el.hidden = true; return; }
  el.hidden = false;
  const tick = () => { const Q = STREET.quarrel; if (!Q) return; if (!UI.dialog){ quarrelEnd(Q.p, false, true); return; } const s = Math.round((performance.now() - Q.t0) / 1000) + Q.extra; el.innerHTML = `⏰ 다툼 중 <b>${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</b> · 활동 시간이 흘러가고 있어요!`; el.classList.toggle('hot', Q.round >= 1); };
  tick(); STREET.alarmT = setInterval(tick, 500);
}
function startQuarrel(p){
  p.angry = 30; p.bumps = []; p.say = {t:2.5, txt:'💢'}; p.path = null;
  SFX.buzz(); fxShake(.12);
  STREET.quarrel = {p, t0:performance.now(), round:0, extra:0}; STREET.talking = p;
  streetState().quarrels++;
  const L = t => ({who:p.name, text:t});
  const ask = r => ({who:p.name, text:r === 0 ? '…할 말 없어?' : r === 1 ? '그래서, 어쩔 건데?' : '마지막으로 묻는다. 어떻게 할 거야?', choices:[
    {label:'정말 죄송합니다! 앞을 잘 보고 다닐게요.', next:[L(p.def.sorry)], fn:() => quarrelEnd(p, true)},
    {label:r === 0 ? '저도 일부러 그런 거 아니에요…' : '아니, 별로 안 세게 부딪혔잖아요.', fn:() => quarrelUp(p), next:quarrelNext(p, r + 1)},
    {label:r === 0 ? '그쪽이 먼저 부딪혔잖아요!' : '흥, 저는 잘못 없어요!', fn:() => quarrelUp(p, true), next:quarrelNext(p, r + 1)},
  ]});
  STREET.ask = ask;
  showDialog(p.name, [L(p.def.angry[0]), ask(0)], () => { if (STREET.quarrel) quarrelEnd(p, false, true); });
  delayAlarm(true);
}
function quarrelNext(p, r){
  const L = t => ({who:p.name, text:t});
  if (r >= 3) return [L(p.def.angry[2]), {who:'안전이', text:'삐익! 거기 둘, 그만! 길 한가운데서 이렇게 오래 다투면 모두가 시간을 잃어요. 서로 사과하고 각자 갈 길 가요!'}, {who:'', text:'다툼이 너무 길어져 안전이가 말렸어요. 먼저 사과했다면 금방 끝났을 거예요.', }];
  return [L(p.def.angry[Math.min(2, r)]), {who:'', text:`⏰ 다툼이 길어져 15초가 더 지체됐어요! 사과하면 바로 끝나요.`}, STREET.ask(r)];
}
function quarrelUp(p, rude){ const Q = STREET.quarrel; if (!Q) return; Q.round++; Q.extra += 15; p.bump = .5; SFX.buzz(); fxShake(.1); if (rude) rpgPenalty(5, '다툼'); }
function quarrelEnd(p, sorry, closed){
  const Q = STREET.quarrel; if (!Q) return;
  STREET.quarrel = null; STREET.talking = null; delayAlarm(false);
  const s = Math.round((performance.now() - Q.t0) / 1000) + Q.extra, st = streetState();
  st.delay = (st.delay || 0) + s; persist();
  p.angry = sorry ? 0 : 8; p.wait = 1; if (sorry){ award('safe', 2); p.say = {t:2, txt:'😊'}; }
  if (!sorry && Q.round >= 3) rpgPenalty(10, '다툼이 길어졌어요');
  setTimeout(() => toast(sorry && s < 15 ? `🙂 바로 사과해서 다툼이 금방 끝났어요 (${s}초).` : `⏰ 다툼으로 ${s}초가 지체됐어요. (지금까지 모두 ${st.delay}초)`, sorry && s < 15 ? 'ok' : 'bad'), closed ? 0 : 50);
}
function bikeHitPerson(p){
  pedHurt(p, 'bike');
  SFX.boom(); fxShake(.3); hitFlash();
  player.moving = false; PATH3.nodes = null; KEYS.clear(); JOY.x = JOY.y = 0;
  const lost = rpgPenalty(20, '자전거로 사람을 쳤어요');
  STREET.talking = p;
  showDialog(p.name, [
    {who:p.name, text:p.def.ouch},
    {who:p.name, text:'자전거로 사람을 치면 어떡해! 사람 사이에서는 내려서 끌고 가야지!'},
    {who:'', text:`🚲 사람을 다치게 해서 경험치를 ${lost} 잃었어요. 다친 사람에게 말을 걸어 도와줘요.`},
  ], () => { STREET.talking = null; });
}

/* ----- 행인에게 말 걸기: 다친 사람 돕기 · 다툼 말리기 · MRI 권하기 ----- */
function talkPed(p){
  STREET.talking = p;
  const done = () => { STREET.talking = null; updateHUD(); };
  if (p.hurt > 0 && p.injured) return helpInjured(p);
  if (p.fight) return mediateFight(p.fight);
  if (p.check) return recommendMRI(p);
  if (p.angry > 0) return showDialog(p.name, [{who:p.name, text:'흥, 말 걸지 마!'}], done);
  showDialog(p.name, [{who:p.name, text:pick(p.def.talk)}], done);
}
function helpInjured(p){
  const L = t => ({who:p.name, text:t});
  const q = {who:'', text:`${p.name}가 쓰러져 있어요. 어떻게 도울까요?`, choices:[
    {label:'"움직이지 마세요!" 하고 어른께 알리고 119에 신고한다', next:[{who:'', text:'잘했어요! 다친 사람을 함부로 움직이면 더 다칠 수 있어요. 어른께 알리고 119에 신고하는 게 먼저예요.'}, L('고맙구나… 구급대원 선생님이 괜찮다고 하는구나.')], fn:() => { p.hurt = 0; p.injured = false; const st = streetState(); st.helped = (st.helped || 0) + 1; if (!st.mriAsked && !st.hqDone && st.hq !== 'mri'){ st.mriAsked = true; p.check = true; p.wait = 99; } else p.wait = 1.5; persist(); award('safe', 6); }},
    {label:'얼른 일으켜서 걸어 보라고 한다', next:[{who:'', text:'잠깐! 뼈나 머리를 다쳤을 수도 있어요. 다친 사람을 억지로 일으키면 더 위험해요. 다시 골라 봐요.'}]},
    {label:'모른 척하고 지나간다', next:[{who:'', text:'다친 사람을 그냥 지나치면 안 돼요. 어른께 알리기만 해도 큰 도움이 돼요. 다시 골라 봐요.'}]},
  ]};
  q.choices[1].next.push(q); q.choices[2].next.push(q);
  showDialog(p.name, [L(p.def.ouch), q], () => { STREET.talking = null; if (p.check) recommendMRI(p); });
}
function mediateFight(f){
  const {a, b} = f, A = t => ({who:a.name, text:t}), B = t => ({who:b.name, text:t});
  const q = {who:'', text:'두 사람이 씩씩대며 다투고 있어요. 어떻게 할까요?', choices:[
    {label:'"잠깐만요! 다친 데는 없으세요? 서로 한 번씩 사과해 볼까요?"', next:[A('…그래, 나도 앞을 잘 못 봤어. 미안해.'), B('나도 미안. 괜히 소리 질렀네.'), {who:'', text:'두 사람이 화해했어요! 먼저 다친 데가 없는지 묻고, 서로 사과하게 도우면 다툼이 금방 끝나요.'}], fn:() => { f.ok = true; }},
    {label:'"누가 이기나 보자!" 하고 구경한다', next:[A(a.def.angry[2]), B(b.def.angry[2]), {who:'', text:'다툼이 더 커졌어요. 구경하거나 부추기면 안 돼요. 다시 골라 봐요.'}], fn:() => rpgPenalty(5, '다툼을 부추겼어요')},
    {label:'"그쪽이 잘못했네요!" 한쪽 편을 든다', next:[B('뭐? 너까지 왜 그래!'), {who:'', text:'한쪽 편만 들면 다툼이 더 길어져요. 두 사람 모두의 이야기를 들어 봐요.'}]},
  ]};
  q.choices[1].next.push(q); q.choices[2].next.push(q);
  showDialog(a.name, [A(a.def.angry[0]), B(b.def.angry[1]), q], () => {
    STREET.talking = null;
    if (!f.ok) return;
    endFight(a); const st = streetState(); st.mediated = (st.mediated || 0) + 1; persist(); award('safe', 8);
    a.say = {t:2, txt:'😊'}; b.say = {t:2, txt:'😊'};
    a.wait = b.wait = 1.5; toast('🤝 다툼을 말렸어요! 안전 경험치 +8', 'ok');
  });
}
/* 숨은 퀘스트: 병원의 전자석 — MRI(자기 공명 영상 장치)를 권하고, 병원에서 직접 확인한다 */
function recommendMRI(p){
  STREET.talking = p;
  const L = t => ({who:p.name, text:t});
  const q = {who:p.name, text:'구급대원이 혹시 모르니 병원에서 MRI를 찍어 보라는데… MRI가 뭐니? 무섭구나.', choices:[
    {label:'자기 공명 영상 장치예요. 아주 센 전자석으로 몸속을 찍어서, 칼로 열지 않고도 다친 곳을 볼 수 있어요.', fn:() => { p.mriOK = true; }, next:[L('전자석으로 몸속을 본다고? 신기하구나! 그럼 무섭지 않겠네.'), {who:p.name, text:'그런데 들어갈 때 조심할 게 있니?', choices:[
      {label:'시계·열쇠 같은 쇠붙이는 빼야 해요. 센 전자석이 철을 끌어당기거든요.', next:[L('그렇구나! 전자석이 철을 끌어당기니까. 고맙다, 병원에 다녀올게!')], fn:() => { p.mriOK2 = true; }},
      {label:'아무것도 안 빼도 돼요.', next:[L('정말? 전자석은 철을 끌어당긴다던데… 다시 말해 줄래?')]},
    ]}]},
    {label:'방사선을 엄청 쏘는 무서운 기계예요.', next:[L('어머, 그래? 그런데 MRI는 이름에 \'자기\'가 들어가던데… 다시 말해 줄래?')]},
    {label:'그냥 커다란 영구 자석이에요.', next:[L('영구 자석이면 끄지도 못하겠네? 의사 선생님이 켜고 끈다던데… 다시 말해 줄래?')]},
  ]};
  q.choices[1].next.push(q); q.choices[2].next.push(q);
  q.choices[0].next[1].choices[1].next.push(q.choices[0].next[1]);
  showDialog(p.name, [q], () => {
    STREET.talking = null;
    if (!(p.mriOK && p.mriOK2)) return;
    p.check = false; p.hospital = true; p.wait = 0; p.say = {t:3, txt:'🏥 병원 다녀올게!'};
    const st = streetState(); if (st.hq !== 'mri') st.hq = 'mri'; persist(); award('em', 6);
    UI.waypoint = {x:51, y:29, label:'🏥 병원 MRI 영상관'};
    rpgToast('🔎 <b>숨은 퀘스트</b> · 병원의 전자석: 광장 남쪽 병원(MRI 영상관)에 들어가 MRI를 살펴봐요!', 'item');
    setTimeout(() => { p.x = 50.5; p.y = 31.5; pedSpotFix(p); p.hospital = false; p.wait = 20; }, 4000);
  });
}
const streetMRIReady = () => streetState().hq === 'mri';
function mriFinale(dev, onSolved){
  const st = streetState(), first = !st.hqDone;
  const D = t => ({who:'병원 의사 선생님', text:t});
  const q = {who:'병원 의사 선생님', text:'MRI의 커다란 전자석은 전자석의 어떤 성질을 이용할까요?', choices:[
    {label:'전기가 흐를 때만 자석이 되고, 전류로 세기를 아주 세게 조절할 수 있어요.', next:[D('정답! 검사할 때만 켜고, 전기를 많이 흘려 아주 센 자석을 만들지. 영구 자석으로는 이렇게 못 한단다.')], fn:() => { st.ok = true; }},
    {label:'항상 자석이라서 끌 수 없어요.', next:[D('그건 영구 자석이란다. 전자석은 켜고 끌 수 있지. 다시 생각해 볼래?')]},
    {label:'자석과는 관계없어요.', next:[D('이름에 \'자기\'가 들어 있잖니? 다시 생각해 볼래?')]},
  ]};
  q.choices[1].next.push(q); q.choices[2].next.push(q);
  showDialog('병원 의사 선생님', [D('어서 오렴! 네가 MRI를 잘 설명해 줘서 환자분이 무서워하지 않고 검사를 받았단다.'), D('이게 자기 공명 영상 장치, MRI야. 안에 아주 커다란 전자석이 들어 있지.'), q], () => {
    if (!st.ok) return;
    st.ok = false; st.hq = null; st.hqDone = (st.hqDone || 0) + 1; persist();
    if (first){ award('em', 20); award('safe', 10); rpgToast('🔎 <b>숨은 퀘스트 완료!</b> 병원의 전자석 (MRI)', 'item'); SFX.win(); }
    else award('em', 5);
    if (onSolved) onSolved();
  });
}
/* 경험치 깎기: 많이 쌓인 능력치부터 */
function rpgPenalty(amt, why){
  const R = SAVE.rpg; if (!R) return 0;
  const lv0 = rpgLevel(); let left = amt, lost = 0;
  while (left > 0){
    const k = STAT_KEYS.slice().sort((a, b) => (R.xp[b] || 0) - (R.xp[a] || 0))[0];
    if (!(R.xp[k] > 0)) break;
    const take = Math.min(left, R.xp[k], 5); R.xp[k] -= take; left -= take; lost += take;
  }
  persist(); updateRpgHUD();
  if (lost) rpgToast(`−${lost} XP · ${why}`, 'xp minus');
  if (rpgLevel() < lv0) toast(`📉 레벨이 Lv.${rpgLevel()}로 내려갔어요!`, 'bad');
  return lost;
}

/* ----- 전기 자전거 ----- */
function bikeState(){ if (!SAVE.bike || typeof SAVE.bike !== 'object') SAVE.bike = {got:false, on:false}; return SAVE.bike; }
/* 자전거 조건: 길가 친구(동물 3 · 로봇 삐삐 · 사람 4) 8명을 모두 만나서 대화하기 */
const friendMet = d => !!(SAVE.rpg && ((SAVE.rpg.talked && SAVE.rpg.talked[d.id]) || (SAVE.rpg.solved && SAVE.rpg.solved[d.id])));
const helpedCount = () => WALKERS.filter(friendMet).length;
const bikeUnlocked = () => helpedCount() >= WALKERS.length;
const friendsLeft = () => WALKERS.filter(d => !friendMet(d)).map(d => (d.kind === 'person' ? '🧑' : WALKER_ICON[d.kind] || '') + ' ' + d.name);
const bikeOn = () => !!(SAVE.bike && SAVE.bike.on && bikeUnlocked() && WORLD && WORLD.kind === 'story');
const bikeMul = () => (bikeOn() && MODE === 'play' ? 2 : 1);
function bikeGift(){
  const b = bikeState(); if (b.got) return;
  b.got = true; persist(); evSyncWorld(); updateBikeHUD();
  showDialog('시장님', [
    '정말 고마워요! 감사의 뜻으로 선물을 준비했어요. 짜잔, 전기 자전거예요!',
    '페달을 밟으면 바퀴 속 전동기가 도와줘요. 전동기 안의 전자석이 전기가 흐를 때 자석이 되어 바퀴를 힘차게 돌리지요. 전기차와 같은 원리예요!',
    '충전소 바로 옆에 전기 자전거 거치대를 세워 두었어요.',
    `단, 자전거는 마을 이웃을 잘 아는 사람만 탈 수 있어요. 마을을 돌아다니는 동물 친구들, 꼬마 로봇 삐삐, 길가 사람들까지 ${WALKERS.length}명을 모두 만나서 이야기해 보면 탈 수 있게 해 줄게요.`,
    '이게 2차시의 마지막 미션이에요! 자전거를 타야 멀리 있는 3차시 구역 문이 열려요. 노란 화살표가 아직 못 만난 친구를 알려 줄 거예요.',
    `지금까지 만나서 이야기한 친구는 ${helpedCount()}/${WALKERS.length}명이에요. 자전거를 탈 때는 사람을 치지 않게 조심해요!`,
  ], () => { if (!zoneRoute(actCur())) UI.waypoint = {x:30, y:40, label:'전기 자전거 거치대'}; updateHUD(); });
}
function bikeRack(){
  const b = bikeState(), n = helpedCount();
  if (!b.got) return;
  if (b.on) return showDialog('전기 자전거 거치대', ['자전거를 거치대에 세웠어요. 걸어서 다녀요.'], () => { b.on = false; persist(); updateBikeHUD(); });
  if (n < WALKERS.length) return showDialog('전기 자전거 거치대', [`🔒 길가 친구 ${WALKERS.length}명(동물 · 로봇 · 사람)을 모두 만나서 이야기해야 탈 수 있어요. (지금 ${n}/${WALKERS.length}명)`, `아직 못 만난 친구: ${friendsLeft().join(', ')}`, '말풍선(💬)이 떠 있는 친구에게 다가가 E로 말을 걸어요. 지도(M)의 분홍 점이 친구들이에요.']);
  showDialog('전기 자전거 거치대', ['🚲 전기 자전거를 꺼냈어요! 이제 2배 빠르게 달릴 수 있어요.', '사람과 부딪히면 그 사람이 다치고 경험치가 깎여요. 사람이 많은 곳에서는 화면 위 🚲 단추로 내려요.'], () => { b.on = true; persist(); updateBikeHUD(); SFX.win(); });
}
function toggleBike(){
  const b = bikeState(); if (!b.got || MODE !== 'play' || uiBlocking()) return;
  if (b.on){ b.on = false; persist(); updateBikeHUD(); toast('자전거에서 내렸어요. (끌고 다녀요)'); return; }
  if (!bikeUnlocked()){ toast(`🔒 길가 친구 ${WALKERS.length}명을 모두 만나 이야기해야 탈 수 있어요 (${helpedCount()}/${WALKERS.length}) · 남은 친구: ${friendsLeft().join(', ')}`, 'bad'); return; }
  b.on = true; persist(); updateBikeHUD(); SFX.ping(); toast('🚲 출발! 사람을 조심해요.', 'ok');
}
function updateBikeHUD(){
  const el = $('#bBike'); if (!el) return;
  const b = bikeState(); el.hidden = !b.got;
  el.textContent = b.on ? '🚲 내리기' : `🚲 타기${helpedCount() < WALKERS.length ? ` 🔒${helpedCount()}/${WALKERS.length}` : ''}`;
  el.classList.toggle('on', !!b.on);
}

/* ----- 3D 그리기 ----- */
function mkBike(){
  const b = new VB(), wheel = (z) => { vbBox(b, -.03, .02, z - .3, .03, .62, z + .3, '#1d2228'); vbBox(b, -.035, .27, z - .05, .035, .37, z + .05, '#9aa3ad'); };
  wheel(-.48); wheel(.48);
  vbBox(b, -.04, .3, -.48, .04, .38, .48, '#e5483a');           // 아래 뼈대
  vbBox(b, -.04, .3, .3, .04, .82, .38, '#e5483a');             // 앞 기둥
  vbBox(b, -.26, .82, .3, .26, .88, .38, '#2a2f38');            // 손잡이
  vbBox(b, -.04, .3, -.22, .04, .66, -.14, '#e5483a');          // 안장 기둥
  vbBox(b, -.11, .66, -.3, .11, .72, -.06, '#1d2228');          // 안장
  vbBox(b, -.1, .38, -.1, .1, .58, .14, '#ffd23f', 2);          // 배터리
  vbBox(b, -.06, .25, .42, .06, .37, .54, '#3ee0ff', 3);        // 바퀴 전동기(전자석)
  return b.mesh();
}
function mkStroller(){
  const b = new VB();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) vbBox(b, sx * .2 - .04, 0, sz * .22 - .07, sx * .2 + .04, .14, sz * .22 + .07, '#2a2f38');
  vbBox(b, -.22, .14, -.3, .22, .48, .3, '#f8bbd0'); vbBox(b, -.23, .38, -.3, .23, .68, -.05, '#ec407a');
  vbBox(b, -.2, .48, .28, .2, .52, .5, '#9aa3ad'); vbBox(b, -.2, .5, .48, .2, .9, .52, '#9aa3ad');
  return b.mesh();
}
function personPose3(look, x, y, z, ry, pitch, walk){
  const P = model('p:' + look, () => mkPerson(look)), sw = walk ? Math.sin(walk * 10) * .62 : 0;
  const M = M4.mul(M4.trs(x, y, z, ry, P.s), M4.joint(0, 0, 0, pitch));
  drawM(P.body, M);
  drawM(P.leg, M4.mul(M, M4.joint(-.12, .74, 0, sw))); drawM(P.leg, M4.mul(M, M4.joint(.12, .74, 0, -sw)));
  drawM(P.arm, M4.mul(M, M4.joint(-.37, 1.33, 0, -sw * .8 - (pitch ? 0 : 0)))); drawM(P.arm, M4.mul(M, M4.joint(.37, 1.33, 0, sw * .8)));
  SHADOWS.push([x, y, z, .42 * P.s]);
}
function mkBikeRack(){
  const b = new VB();
  vbBox(b, -.7, 0, -.1, .7, .06, .1, '#6f7b88');
  for (const x of [-.55, -.2, .15, .5]) vbBox(b, x - .03, 0, -.03, x + .03, .5, .03, '#9aa3ad');
  vbBox(b, -.7, .45, -.04, .7, .5, .04, '#9aa3ad');
  vbBox(b, -.12, .6, -.02, .12, .9, .02, '#25d17a', 2);
  return b.mesh();
}
function drawPlayerBike3D(){
  const a = player.ang || 0, gy = (player.h || 0) + (player.jz || 0);
  drawM(model('bike', mkBike), M4.trs(player.x, gy, player.y, a, 1));
  return gy + .42;
}
function drawPeds3D(t){
  const rack = WORLD.objects.find(o => o.type === 'bikerack');
  if (rack){ const cx = rack.x + .5, cz = rack.y + .5, gy = surfY(cx, cz); drawM(model('bikerack', mkBikeRack), M4.trs(cx, gy, cz, Math.PI / 2)); if (!bikeOn()) drawM(model('bike', mkBike), M4.trs(cx + .05, gy, cz, 0, .9)); sprAdd(cx, gy + 1.5 + Math.sin(t * 2.5) * .06, cz, iconBadge('mis', '🚲'), .36); }
  for (const p of (WORLD.peds || [])){
    const gy = surfY(p.x, p.y), hop = p.bump > 0 ? Math.sin(p.bump / .6 * Math.PI) * .18 : 0, wob = p.bump > 0 ? Math.sin(p.bump * 30) * .25 : 0;
    if (p.hurt > 0){ personPose3(p.def.look, p.x, gy + .22, p.y, p.ry || 0, -Math.PI / 2 + .05, 0); continue; }
    if (p.def.bike){
      drawM(model('bike', mkBike), M4.trs(p.x, gy + hop, p.y, p.ry || 0, .8));
      personPose3(p.def.look, p.x, gy + .36 + hop, p.y - Math.cos(p.ry || 0) * .05, p.ry || 0, wob * .5, p.moving ? p.walk : 0);
      continue;
    }
    if (p.def.stroller) drawM(model('stroller', mkStroller), M4.trs(p.x + Math.sin(p.ry || 0) * .62, gy, p.y + Math.cos(p.ry || 0) * .62, p.ry || 0));
    personPose3(p.def.look, p.x, gy + hop, p.y, p.ry || 0, wob * .35 + (p.def.sp > 2 && p.moving ? .18 : 0), p.moving ? p.walk : 0);
  }
}
/* 화면 위 말풍선: 사람마다 다른 말 · 🆘 도움 요청 · 💢 다툼 · ❓ 병원 이야기 */
function pedOverlay3D(){
  if (!WORLD || !WORLD.peds) return;
  const ox = CAM3.tx, oz = CAM3.tz, t = TIME;
  for (const p of WORLD.peds){
    if (Math.hypot(p.x - ox, p.y - oz) > 24) continue;
    let txt = null, bg = '#ffffff';
    if (p.hurt > 0 && p.injured){ txt = Math.sin(t * 4) > 0 ? '🆘 도와주세요!' : '🤕 ' + p.def.ouch.slice(0, 14); bg = '#ffd0cc'; }
    else if (p.hurt > 0) txt = '🤕';
    else if (p.say) { txt = p.say.txt; if (p.fight) bg = '#ffaaa1'; }
    else if (p.fight){ txt = '💢'; bg = '#ffaaa1'; }
    else if (p.check){ txt = '❓ 병원에 가 봐야 할까…'; bg = '#fff3b0'; }
    else if (p.angry > 0){ txt = '💢'; bg = '#ffaaa1'; }
    if (!txt) continue;
    const pr = proj3(p.x, surfY(p.x, p.y) + (p.hurt > 0 ? 1.0 : 2.3) + (p.bump > 0 ? .15 : 0), p.y);
    if (pr.ok) drawBubble(pr.x, pr.y - (p.fight ? Math.abs(Math.sin(t * 9)) * 4 : 0), txt, bg, '#1c2733');
  }
  for (const w of (WORLD.walkers || [])){
    if (!w.say || walkerHidden(w)) continue;
    const cx = w.x + .5, cz = w.y + .5; if (Math.hypot(cx - ox, cz - oz) > 24) continue;
    const hop = w.hop > 0 ? Math.sin((1 - w.hop / w.hopT) * Math.PI) * w.hopH : 0;
    const pr = proj3(cx, surfY(cx, cz) + (w.def.kind === 'person' ? 2.3 : 1.3) + hop, cz);
    if (pr.ok) drawBubble(pr.x, pr.y, w.say.txt, '#ffffff', '#1c2733');
  }
}
/* 2D 화면 */
function pedEnts2D(S, list){
  for (const p of (WORLD.peds || [])){
    const px = p.x * S, py = (p.y + .32) * S;
    list.push({y:p.y + .3, f:() => { if (p.hurt > 0) drawEmoji('🤕', px, py - S * .3, S * .6); else { drawPerson(px, py, S, p.def.look, 'down', p.moving ? p.walk : 0); if (p.def.bike) drawEmoji('🚲', px, py - S * .1, S * .5); if (p.def.stroller) drawEmoji('👶', px + S * .4, py - S * .2, S * .4); } }});
  }
}
