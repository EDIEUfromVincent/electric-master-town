/* =========================================================
   4-3b. 3D 고철장 크레인 — 마을 고철장에서 직접 조종하고, AI 크레인 두뇌가 같은 크레인을 운전한다
   규칙은 2D 크레인 창(CraneScene)과 같다: 철만 붙고, 무거운 철은 전지 2개라야 들리고,
   가벼운 고철에 전지 2개는 전기 낭비. 점수·미션 성공 기준도 그대로다.
   WebGL이 없거나 친구 맵에 있을 때는 예전 2D 크레인 창을 쓴다.
   ========================================================= */
const CRZ = 2.5, CR_BEAM = 4.85, CR_REST = 3.0, CR_X0 = 32.6, CR_X1 = 45.4;
const CR_BIN = {x0:43.3, x1:45.1, cx:44.2};
/* 고철 모양별 크기 (가로 x · 높이 · 깊이 z, 블록 단위) */
const IT3 = {can:[.34, .46, .34], pipe:[1.04, .26, .26], bottle:[.26, .54, .26], wire:[.5, .26, .5], bike:[1.05, .6, .3], box:[.72, .53, .52],
  bolt:[.5, .07, .36], dumbbell:[.8, .26, .26], basket:[.84, .5, .58], ladder:[1.1, .07, .5], pan:[.7, .1, .46], pot:[.58, .38, .46],
  chair:[.6, .78, .6], door:[1.0, .19, .62]};
const itH = it => (IT3[it.shape] || [.5, .4, .5])[1];
const CR3 = {mode:null, from:null, items:[], trolley:38.6, magY:CR_REST, on:false, batt:1, carry:null, busy:false, energy:0, speed:1,
  anims:[], hold:0, binCount:0, stats:{nostick:0, drop:0, waste:0}, finished:false, bubble:null, tree:null, pred:0, rows:0, gen:0, idleKey:'', ui:{}};
/* 방 안(2차시 고철장 조종실)에서도 연다: 시작할 때 마을 고철장을 잠깐 빌려 쓴다 */
const crane3Ready = () => G3.ok && WORLD && (WORLD.kind === 'story' || WORLD.kind === 'room');

/* ----- 고철 모형 ----- */
function mkItem3(it){
  const b = new VB(), col = COLOR_HEX[it.colorName] || '#999999';
  const B = (x0, y0, z0, x1, y1, z1, c) => vbBox(b, x0, y0, z0, x1, y1, z1, c || col);
  const ringV = (cx, cy, r, c) => { B(cx - r, cy - r, -.02, cx + r, cy - r + .05, .02, c); B(cx - r, cy + r - .05, -.02, cx + r, cy + r, .02, c); B(cx - r, cy - r, -.02, cx - r + .05, cy + r, .02, c); B(cx + r - .05, cy - r, -.02, cx + r, cy + r, .02, c); };
  switch (it.shape){
    case 'can': B(-.17, 0, -.17, .17, .44, .17); B(-.175, .16, -.175, .175, .29, .175, it.material === '철' ? '#d94141' : '#3a8ee6'); B(-.13, .44, -.13, .13, .46, .13, hexShade(col, .3)); break;
    case 'pipe': B(-.5, 0, -.13, .5, .26, .13); B(.5, .03, -.1, .52, .23, .1, '#3a3f47'); B(-.52, .03, -.1, -.5, .23, .1, '#3a3f47'); break;
    case 'bottle': { const c1 = it.material === '유리' ? '#96d7be' : '#d6ecf6', c2 = it.material === '유리' ? '#7cc6a8' : '#bcdcea';
      B(-.13, 0, -.13, .13, .36, .13, c1); B(-.05, .36, -.05, .05, .5, .05, c2); B(-.06, .5, -.06, .06, .54, .06, '#e5483a'); break; }
    case 'wire': for (let k = 0; k < 3; k++){ const y = k * .085, r = .25 - k * .025; B(-r, y, -r, r, y + .06, -r + .05); B(-r, y, r - .05, r, y + .06, r); B(-r, y, -r, -r + .05, y + .06, r); B(r - .05, y, -r, r, y + .06, r); } break;
    case 'bike': ringV(-.32, .2, .2, '#2f343b'); ringV(.32, .2, .2, '#2f343b'); B(-.32, .18, -.025, .32, .23, .025); B(-.08, .2, -.025, -.03, .48, .025);
      B(-.08, .43, -.025, .27, .48, .025); B(.22, .2, -.025, .27, .56, .025); B(-.18, .48, -.06, .02, .53, .06, '#2f343b'); B(.15, .55, -.15, .35, .6, .15, '#2f343b'); break;
    case 'box': B(-.36, 0, -.26, .36, .52, .26); B(-.05, .52, -.265, .05, .53, .265, '#e8d7b3'); B(-.365, .2, -.05, .365, .32, .05, '#e8d7b3'); break;
    case 'bolt': for (let k = 0; k < 5; k++){ const x = -.2 + k * .1, z = (hash2(k, 1, 7) - .5) * .2; B(x - .015, 0, z - .14, x + .015, .03, z + .14); B(x - .035, 0, z + .12, x + .035, .06, z + .17); } break;
    case 'dumbbell': B(-.4, 0, -.13, -.26, .26, .13); B(.26, 0, -.13, .4, .26, .13); B(-.26, .1, -.03, .26, .16, .03, '#8a9099'); break;
    case 'basket': { const c = '#6f7882';
      B(-.42, 0, -.29, .42, .03, .29, c);
      for (const x of [-.4, .4]) for (const z of [-.27, .27]) B(x - .02, 0, z - .02, x + .02, .5, z + .02, c);
      B(-.42, .47, -.29, .42, .5, -.25, c); B(-.42, .47, .25, .42, .5, .29, c); B(-.42, .47, -.27, -.38, .5, .27, c); B(.38, .47, -.27, .42, .5, .27, c);
      for (let x = -.24; x <= .25; x += .16){ B(x - .01, 0, -.29, x + .01, .5, -.27, c); B(x - .01, 0, .27, x + .01, .5, .29, c); }
      break; }
    case 'ladder': B(-.55, 0, -.25, .55, .07, -.19); B(-.55, 0, .19, .55, .07, .25); for (let x = -.45; x <= .46; x += .18) B(x - .025, 0, -.19, x + .025, .05, .19); break;
    case 'pan': B(-.24, 0, -.23, .24, .09, .23); B(-.2, .09, -.19, .2, .1, .19, hexShade(col, .2)); B(.24, .03, -.03, .46, .07, .03); break;
    case 'pot': B(-.23, 0, -.23, .23, .36, .23); B(-.29, .24, -.04, -.23, .3, .04); B(.23, .24, -.04, .29, .3, .04); B(-.2, .36, -.2, .2, .38, .2, hexShade(col, .25)); break;
    case 'chair': B(-.28, .36, -.28, .28, .42, .28); for (const x of [-.24, .24]) for (const z of [-.24, .24]) B(x - .03, 0, z - .03, x + .03, .36, z + .03); B(-.28, .42, -.28, .28, .78, -.22); break;
    case 'door': B(-.5, 0, -.31, .5, .14, .31); B(-.47, .14, -.28, .47, .15, .28, '#e3e6ea'); B(.25, .14, -.22, .38, .19, -.14, '#9aa3ad'); break;
    default: B(-.25, 0, -.25, .25, .4, .25);
  }
  return b.mesh();
}
/* ----- 문형 크레인: 고철장을 가로지르는 노란 들보, 양쪽 다리는 울타리 위에 선다 ----- */
function mkGantry(){
  const b = new VB(), Y = '#e2a93a', D = '#b88426', G = '#39424e';
  for (const x of [31.5, 46.5]){
    for (const z of [1.7, 3.3]) vbBox(b, x - .11, 0, z - .11, x + .11, CR_BEAM, z + .11, Y);
    vbBox(b, x - .1, 1.6, 1.7, x + .1, 1.75, 3.3, D); vbBox(b, x - .1, 3.3, 1.7, x + .1, 3.45, 3.3, D);
    vbBox(b, x - .3, 0, 1.4, x + .3, .3, 3.6, G);
  }
  vbBox(b, 31.2, CR_BEAM, CRZ - .22, 46.8, CR_BEAM + .38, CRZ + .22, Y);
  vbBox(b, 31.2, CR_BEAM + .38, CRZ - .26, 46.8, CR_BEAM + .44, CRZ + .26, D);
  vbBox(b, 31.3, CR_BEAM - .06, CRZ - .3, 46.7, CR_BEAM, CRZ - .24, '#2b2f36'); vbBox(b, 31.3, CR_BEAM - .06, CRZ + .24, 46.7, CR_BEAM, CRZ + .3, '#2b2f36');
  return b.mesh();
}
function mkTrolley3(){ const b = new VB(); vbBox(b, -.32, 0, -.3, .32, .24, .3, '#39424e'); vbBox(b, -.2, .04, .3, .2, .16, .31, '#ffd23f', 3); return b.mesh(); }
function mkMagnet3(on){
  const b = new VB();
  vbBox(b, -.45, 0, -.45, .45, .24, .45, '#3a3f47');
  vbBox(b, -.47, .08, -.47, .47, .16, .47, on ? '#ff9a3a' : '#9a4a3a', on ? 3 : -1);
  vbBox(b, -.12, .24, -.12, .12, .36, .12, '#2b323b');
  return b.mesh();
}
function mkBin3(){
  const b = new VB(), c1 = '#4d6b52', c2 = '#5f8a66';
  vbBox(b, -.9, 0, -.55, .9, .08, .55, c1);
  vbBox(b, -.9, 0, -.55, .9, .72, -.47, c2); vbBox(b, -.9, 0, .47, .9, .72, .55, c2);
  vbBox(b, -.9, 0, -.55, -.82, .72, .55, c2); vbBox(b, .82, 0, -.55, .9, .72, .55, c2);
  vbBox(b, -.92, .6, .55, .92, .7, .58, '#ffd23f');
  return b.mesh();
}

/* ----- 상태 ----- */
function cr3Place(list){ return list.map((it, i) => ({...it, x:33.4 + i * 1.2, y:0, z:CRZ, inBin:false, held:false, falling:false, toBin:false, vy:0, slot:-1})); }
function cr3BinPos(k){ return {x:CR_BIN.cx + ((k % 3) - 1) * .5, z:CRZ + (Math.floor(k / 3) % 2 ? .2 : -.2), y:.08 + Math.floor(k / 6) * .26}; }
/* 미션 밖에서의 고철장: 미션 전에는 전자석이 켜진 채 전기를 낭비하고, 성공한 뒤에는 철 4개가 고철함에 들어 있다 */
function cr3Idle(){
  const done = !!(SAVE.badges && SAVE.badges.em2);
  CR3.items = cr3Place(TRAIN_ITEMS); CR3.binCount = 0;
  if (done) for (const it of CR3.items) if (it.material === '철'){ it.inBin = true; it.slot = CR3.binCount++; }
  Object.assign(CR3, {trolley:38.6, magY:CR_REST, on:!done, batt:1, carry:null, busy:false, hold:0, bubble:null, idleKey:done ? 'done' : 'todo'});
}
function cr3Tween(set, from, to, dur){
  const gen = CR3.gen;
  return new Promise(res => { if (gen !== CR3.gen) return res(); CR3.anims.push({set, from, to, dur:Math.max(.05, dur / CR3.speed), t:0, res, gen}); });
}
const cr3Sleep = ms => cr3Tween(() => {}, 0, 1, ms / 1000);
function cr3Move(x){ x = clamp(x, CR_X0, CR_X1); return cr3Tween(v => { CR3.trolley = v; }, CR3.trolley, x, Math.abs(x - CR3.trolley) / 3.6); }
function cr3Under(){
  let best = null, bd = .5;
  for (const it of CR3.items){ if (it.inBin || it.held || it.falling) continue; const d = Math.abs(it.x - CR3.trolley); if (d < bd){ bd = d; best = it; } }
  return best;
}
const cr3OverBin = () => CR3.trolley > CR_BIN.x0 + .15 && CR3.trolley < CR_BIN.x1 - .15;
function cr3Fall(it, toY, toBin){ it.falling = true; it.vy = 0; it.fallTo = toY; it.toBin = !!toBin; }
async function cr3Grab(){
  CR3.busy = true;
  const gen = CR3.gen, it = cr3Under(), top = it ? it.y + itH(it) : .05;
  await cr3Tween(v => { CR3.magY = v; }, CR3.magY, top + .02, .55);
  if (gen !== CR3.gen) return {kind:'none', it:null};
  let kind = 'none';
  if (it){
    if (it.material !== '철') kind = 'nostick';
    else if (it.heavy && CR3.batt < 2){
      kind = 'drop'; it.held = true; CR3.carry = it;
      await cr3Tween(v => { CR3.magY = v; }, CR3.magY, CR3.magY + .45, .3);
      CR3.carry = null; it.held = false; cr3Fall(it, 0);
    } else { kind = (!it.heavy && CR3.batt === 2) ? 'waste' : 'ok'; CR3.carry = it; it.held = true; }
  }
  await cr3Tween(v => { CR3.magY = v; }, CR3.magY, CR_REST, .55);
  CR3.busy = false;
  return {kind, it};
}
function cr3Release(){
  const it = CR3.carry; CR3.on = false;
  if (!it) return null;
  CR3.carry = null; it.held = false;
  if (cr3OverBin()){ const s = cr3BinPos(CR3.binCount); it.slot = CR3.binCount; it.x = s.x; it.z = s.z; cr3Fall(it, s.y, true); return 'bin'; }
  it.x = CR3.trolley; it.z = CRZ; cr3Fall(it, 0); return 'ground';
}
function cr3SetBatt(n){
  if (CR3.busy || CR3.frozen) return;
  CR3.batt = n;
  if (CR3.carry && CR3.carry.heavy && n < 2){ const it = CR3.carry; CR3.carry = null; it.held = false; cr3Fall(it, 0); cr3Event('weakdrop', {it}); }
  cr3UI(true);
}
async function cr3Toggle(){
  if (CR3.busy || CR3.finished || CR3.frozen) return;
  if (!CR3.on){ CR3.on = true; cr3UI(true); const r = await cr3Grab(); cr3Event('grab', r); }
  else { const r = cr3Release(); cr3Event('release', {where:r}); }
  cr3UI(true);
}
function updateCrane3D(dt){
  const done = [];
  for (const a of CR3.anims){
    a.t += dt; const k = Math.min(1, a.t / a.dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    a.set(a.from + (a.to - a.from) * e); if (k >= 1) done.push(a);
  }
  if (done.length){ CR3.anims = CR3.anims.filter(a => !done.includes(a)); done.forEach(a => a.res()); }
  if (CR3.hold && !CR3.busy && !CR3.frozen && CR3.mode === 'manual' && !CR3.finished) CR3.trolley = clamp(CR3.trolley + CR3.hold * 3.4 * dt, CR_X0, CR_X1);
  if (CR3.on && CR3.mode && !CR3.frozen) CR3.energy += CR3.batt * dt * 10;   /* 정전 중(frozen)에는 전기가 쓰이지 않는다 */
  for (const it of CR3.items){
    if (it.held){ it.x = CR3.trolley; it.z = CRZ; it.y = CR3.magY - itH(it); }
    else if (it.falling){
      it.vy += 16 * dt; it.y -= it.vy * dt;
      if (it.y <= it.fallTo){
        it.y = it.fallTo; it.falling = false;
        if (it.toBin){ it.inBin = true; CR3.binCount++; cr3Event('inbin', {it}); } else if (CR3.mode) SND.tick();
      }
    }
  }
  if (CR3.mode) cr3UI();
}

/* ----- 화면 아래 조종판 ----- */
const ironIn = () => CR3.items.filter(i => i.inBin && i.material === '철').length;
function cr3Msg(html){ const m = $('#cbMsg'); if (m) m.innerHTML = html; }
function cr3UI(force){
  const U = CR3.ui, e = Math.round(CR3.energy), n = CR3.mode === 'auto' ? CR3.rows : ironIn();
  if (force || U.e !== e){ U.e = e; $('#cbE').textContent = e; }
  if (force || U.n !== n){ U.n = n; $('#cbN').textContent = n; }
  const key = (CR3.on ? 1 : 0) + ':' + CR3.batt;
  if (force || U.k !== key){ U.k = key; $('#cbMag').textContent = CR3.on ? '자석 끄기' : '자석 켜기'; $('#cbB1').classList.toggle('on', CR3.batt === 1); $('#cbB2').classList.toggle('on', CR3.batt === 2); }
}
function cr3Event(type, r){
  if (CR3.mode !== 'manual') return;
  const nm = (it, a, b) => `<b>${esc(josa(it.name, a, b))}</b>`, S = CR3.stats;
  if (type === 'grab'){
    if (r.kind === 'none') cr3Msg('아래에 아무것도 없어요. 고철 바로 위로 옮겨 보세요. (자석이 켜져 있으면 전기가 계속 쓰여요!)');
    if (r.kind === 'nostick'){ cr3Msg(`${nm(r.it, '은', '는')} 전자석에 붙지 않아요. 왜 그럴까요? 자석을 끄고 다른 고철로 가요.`); SND.bad(); S.nostick++; }
    if (r.kind === 'drop'){ cr3Msg(`${nm(r.it, '이', '가')} 너무 무거워 떨어졌어요! 전자석을 더 세게 하려면 어떻게 할까요?`); SND.bad(); S.drop++; }
    if (r.kind === 'ok'){ cr3Msg(`${nm(r.it, '이', '가')} 붙었어요! 철 고철함 위로 옮겨 자석을 꺼요.`); SND.ok(); }
    if (r.kind === 'waste'){ cr3Msg(`${nm(r.it, '이', '가')} 붙었어요. 그런데 가벼운 고철에 전지 2개는 전기 낭비일지도 몰라요.`); SND.ok(); S.waste++; }
    if (r.kind === 'ok' || r.kind === 'waste') craneBlackoutMaybe();   /* 정전 사건 X1→X2 (judge.js) */
  }
  if (type === 'weakdrop'){ cr3Msg('세기를 약하게 바꾸자 무거운 고철이 떨어졌어요!'); SND.bad(); }
  if (type === 'release' && r.where === 'ground') cr3Msg('고철함 밖에 떨어뜨렸어요. 다시 집어 고철함 위에서 꺼요.');
  if (type === 'inbin'){
    SND.tick();
    if (r.it.material !== '철') cr3Msg('철이 아닌 물체가 고철함에 들어갔어요.');
    else { const n = ironIn(); cr3Msg(`철 고철함에 넣었어요! (${n}/4)`); if (n >= 4) cr3Finish(); }
  }
}
function cr3Finish(){
  if (CR3.finished) return; CR3.finished = true;
  const e = Math.round(CR3.energy), S = CR3.stats;
  SAVE.crane = {energy:e, ...S, time:Date.now()};
  const bolts = mgCraneBolts(S);
  if (!SAVE.badges.em2){ SAVE.badges.em2 = true; toast('크레인 조종 미션 성공!', 'ok'); }
  persist(); checkMasters();
  $('#cbCtrl').hidden = true;
  $('#cbDone').innerHTML = `<div class="okbox"><b>미션 성공!</b> 철 고철 4개를 모두 옮겼어요. 전기 사용량 ${e}. 미니 게임 ${boltsHTML(bolts)}<br>
    붙지 않은 물체 시도 ${S.nostick}번 · 무거워서 떨어뜨림 ${S.drop}번 · 가벼운 고철에 전지 2개 ${S.waste}번<br>
    <b>생각해 볼까요?</b> 나는 무엇을 보고 '집을지 말지', '얼마나 세게 할지' 정했나요? 그 판단 기준을 AI 크레인 두뇌에 가르쳐 봐요.</div>
    <div class="row" style="margin-top:8px"><button class="btn primary" id="cbBack">${ZONE.borrow ? '방으로 돌아가기 ▶' : '마을로 돌아가기'}</button></div>`;
  $('#cbBack').onclick = () => exitCrane3D();
}

/* ----- 들어가기 · 나오기 ----- */
function startCrane3D(mode, opt = {}){
  closePanelSilently(); $('#dialog').hidden = true; UI.dialog = null;
  if (MODE !== 'crane') zoneBorrowTown();
  CR3.from = MODE === 'crane' ? CR3.from : MODE; CR3.mode = mode; CR3.gen++; CR3.anims = [];
  CR3.items = cr3Place(mode === 'auto' ? TEST_ITEMS : TRAIN_ITEMS);
  Object.assign(CR3, {trolley:33.4, magY:CR_REST, on:false, batt:1, carry:null, busy:false, energy:0, speed:1, hold:0, binCount:0,
    stats:{nostick:0, drop:0, waste:0}, finished:false, frozen:false, blackDone:false, bubble:null, rows:0, ui:{}, tree:opt.tree || null, pred:opt.pred || 0});
  MODE = 'crane'; KEYS.clear(); JOY.x = JOY.y = 0; PATH3.nodes = null; NEAR = null;
  $('#title').hidden = true; showHUD(false); $('#craneBar').hidden = false;
  $('#cbTitle').textContent = mode === 'auto' ? 'AI 크레인 두뇌 시험 · 새 고철 트럭' : '고철장 크레인 조종';
  $('#cbNLabel').textContent = mode === 'auto' ? '처리' : '옮긴 철';
  $('#cbNMax').textContent = mode === 'auto' ? '8' : '4';
  $('#cbCtrl').hidden = mode !== 'manual'; $('#cbAuto').hidden = mode !== 'auto'; $('#cbDone').innerHTML = '';
  $('#cbFast').classList.remove('on');
  cr3UI(true);
  if (mode === 'auto'){ cr3Msg('처음 보는 고철 8개를 내 크레인 두뇌가 스스로 판단해요. 말풍선에 AI의 판단 경로가 나와요.'); cr3RunAuto(); }
  else cr3Msg(`◀ ▶로 움직이고 [자석 켜기]로 고철을 집어요. 고철함 위에서 [자석 끄기]를 누르면 내려놓아요.${IS_TOUCH ? '' : ' 키보드: <kbd>←</kbd><kbd>→</kbd> 이동, <kbd>스페이스</kbd> 자석, <kbd>1</kbd><kbd>2</kbd> 전지 개수'}<br>철 고철은 모두 4개예요. 어떤 물체가 전자석에 붙을지 예상하며 시작해요!`);
}
function exitCrane3D(then){
  if (MODE !== 'crane') return;
  CR3.gen++; const pend = CR3.anims; CR3.anims = []; pend.forEach(a => a.res());
  CR3.mode = null; CR3.hold = 0; CR3.frozen = false;
  $('#craneBar').hidden = true;
  cr3Idle();
  const from = CR3.from;
  if (from === 'title') showTitle();
  else { MODE = 'play'; showHUD(true); updateHUD(); zoneReturn(); }
  if (then) then();
}
async function cr3RunAuto(){
  const gen = CR3.gen, tree = CR3.tree;
  for (const it of CR3.items.slice()){
    if (gen !== CR3.gen) return;
    await cr3Move(it.x); if (gen !== CR3.gen) return;
    const tr = traceTree(tree, it);
    CR3.bubble = `${it.name} ⇒ ${ACTIONS[tr.action].short}`;
    cr3Msg(`<b>${esc(it.name)}</b>: ` + tr.path.map(p => `${QUESTIONS[p.q].text.replace('?', '')}? <b>${p.ans ? '예' : '아니요'}</b>`).join(' → ') + ` ⇒ <b>${ACTIONS[tr.action].short}</b>`);
    await cr3Sleep(1100); if (gen !== CR3.gen) return;
    if (tr.action !== 'skip'){
      CR3.batt = tr.action === 'strong' ? 2 : 1; CR3.on = true;
      await cr3Grab(); if (gen !== CR3.gen) return;
      if (CR3.carry){ await cr3Move(CR_BIN.cx); if (gen !== CR3.gen) return; cr3Release(); await cr3Sleep(450); }
      else { CR3.on = false; await cr3Sleep(250); }
    } else await cr3Sleep(300);
    if (gen !== CR3.gen) return;
    CR3.bubble = null; CR3.rows++;
  }
  await cr3Sleep(500);
  if (gen === CR3.gen) cr3AutoDone();
}
function cr3AutoDone(){
  if (MODE !== 'crane' || CR3.mode !== 'auto') return;
  const tree = CR3.tree, pred = CR3.pred;
  exitCrane3D(() => {
    const p = openPanel(`<h2>새 고철 트럭 시험 결과</h2><p class="sub">처음 보는 고철 8개를 내 크레인 두뇌가 스스로 판단했어요.</p><div id="atRes"></div>`, {wide:true});
    treeTestReport(tree, pred, p, p.querySelector('#atRes'));
  });
}
function cr3Key(e, down){
  const c = e.code;
  if (CR3.mode !== 'manual' || CR3.finished || CR3.frozen) return;
  if (c === 'ArrowLeft' || c === 'KeyA'){ e.preventDefault(); if (down) CR3.hold = -1; else if (CR3.hold === -1) CR3.hold = 0; }
  else if (c === 'ArrowRight' || c === 'KeyD'){ e.preventDefault(); if (down) CR3.hold = 1; else if (CR3.hold === 1) CR3.hold = 0; }
  else if (!down) return;
  else if (c === 'Space' || c === 'KeyE' || c === 'Enter' || c === 'NumpadEnter'){
    e.preventDefault(); if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();
    if (!e.repeat) cr3Toggle();
  }
  else if (c === 'Digit1' || c === 'Numpad1') cr3SetBatt(1);
  else if (c === 'Digit2' || c === 'Numpad2') cr3SetBatt(2);
}

/* ----- 3D 그리기 (world3d.js의 그리기 순서 안에서 부른다) ----- */
function drawCrane3D(t){
  if (!CR3.mode){ const key = SAVE.badges && SAVE.badges.em2 ? 'done' : 'todo'; if (CR3.idleKey !== key) cr3Idle(); }
  const x = CR3.trolley;
  drawM(model('gantry', mkGantry), M4.I());
  drawM(model('trolley3', mkTrolley3), M4.trs(x, CR_BEAM - .24, CRZ));
  const top = CR_BEAM - .24, mt = CR3.magY + .36;
  drawM(model('cable', () => mkUnit('#2b323b', .025)), M4.trs(x, mt, CRZ, 0, 1, Math.max(.01, top - mt)));
  drawM(CR3.on && !CR3.frozen ? model('mag3on', () => mkMagnet3(true)) : model('mag3', () => mkMagnet3(false)), M4.trs(x, CR3.magY, CRZ));
  for (const it of CR3.items){
    const m = model('it:' + it.id, () => mkItem3(it));
    if (it.inBin && !it.falling){ const s = cr3BinPos(it.slot); drawM(m, M4.trs(s.x, s.y, s.z, (it.slot % 2 ? .3 : -.3), .55)); continue; }
    drawM(m, M4.trs(it.x, it.y, it.z, 0, it.toBin && it.falling ? .55 : 1));
    if (!it.held && it.y < .05) SHADOWS.push([it.x, 0, it.z, (IT3[it.shape] || [.5])[0] * .62]);
  }
  drawM(model('bin3', mkBin3), M4.trs(CR_BIN.cx, 0, CRZ));
  if (MODE === 'crane') for (const fx of [35.6, 42.4]) drawM(model('flood', () => { const v = new VB(); vbBox(v, -.18, -.14, -.16, .18, 0, .16, '#2b323b'); vbBox(v, -.14, -.17, -.12, .14, -.14, .12, '#fff6d8', 3); return v.mesh(); }), M4.trs(fx, CR_BEAM, CRZ + .42));
  SHADOWS.push([x, 0, CRZ, .55], [CR_BIN.cx, 0, CRZ, 1.1]);
}
function craneFlats(U){
  if (!CR3.on || CR3.frozen) return;
  const ring = model('ringB', () => flatRing(.9, 1.0, [.25, .6, 1, 1])), a = CR3.batt === 1 ? .38 : .7;
  for (let k = 1; k <= 3; k++){
    const ph = (TIME * 1.6 + k / 3) % 1, r = .45 + ph * .55;
    flatDraw(U, ring, M4.trs(CR3.trolley, CR3.magY - .04 - k * .08, CRZ, 0, r, 1), [1, 1, 1, a * (1 - ph)]);
  }
}
function cr3Tag(x, y, s, col){
  ctx.font = `700 12px ${FONT_B}`; const w = ctx.measureText(s).width + 12;
  ctx.fillStyle = 'rgba(21,32,43,.84)'; rr(ctx, x - w / 2, y - 10, w, 20, 6); ctx.fill();
  ctx.fillStyle = col || '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y + 1);
}
function craneOverlay(){
  const b = proj3(CR_BIN.cx, 1.3, CRZ); if (b.ok) drawLabel(b.x, b.y, '철 고철함');
  /* 좁은 화면에서는 이름표가 겹치므로 수레 아래(가장 가까운) 고철 이름만 보인다 */
  const narrow = CW < 640, near = narrow ? CR3.items.filter(it => !it.inBin && !it.held && !it.falling).sort((p, q) => Math.abs(p.x - CR3.trolley) - Math.abs(q.x - CR3.trolley))[0] : null;
  CR3.items.forEach((it, i) => {
    if (it.inBin || it.held || it.falling || (narrow && it !== near)) return;
    const q = proj3(it.x, it.y + itH(it) + .3 + (narrow ? 0 : (i % 2) * .42), it.z); if (q.ok) cr3Tag(q.x, q.y, it.name);
  });
  const m = proj3(CR3.trolley, CR3.magY + .62, CRZ);
  if (m.ok) cr3Tag(m.x + 46, m.y, CR3.on ? `ON · 전지 ${CR3.batt}개` : 'OFF', CR3.on ? '#ffd23f' : '#c9d4de');
  if (CR3.bubble){ const q = proj3(CR3.trolley, CR3.magY + 1.25, CRZ); if (q.ok) drawBubble(clamp(q.x, 120, CW - 120), q.y, CR3.bubble, '#ffffff', '#1c2733'); }
}
