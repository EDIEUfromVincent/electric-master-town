/* =========================================================
   6-4. 전자석 단원 게임의 3D 무대 (박진감 판)
   · 전자석 실험 게임
     1단계 클립 옮기기: 케이블에 매달린 코일이 흔들리고, 큰 유리 수조가 점점 빨리 움직인다. 클립은 진짜로 떨어진다.
     2단계 주문 러시: 인내심 막대가 줄어드는 주문을 전지 개수로 맞힌다. ❤️ 3개.
     3단계 극의 방향: 나침반 속사 + 다가오는 자석 자동차를 밀어내거나 끌어당긴다. ❤️ 3개.
   · 전자석 탐정: 교실 찾기(콤보) · 떨어지는 기기 분류 · 움직이는 목표 높이 공중 부양
   ========================================================= */
const TOPY = .92, BRDY = 3.15, RAILY = 3.55, L0 = 1.0, LDOWN = 1.62;
const ease3 = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

/* ----- 실험실 · 실험대 · 기중기 틀 ----- */
function mkLab3(b){
  mkRoom3(b, {w:18, d:3.4, h:4.6, sideD:2.4, wallCol:'#eef1ea'});
  mkWindow3(b, -7.8, 1.6, -5.6, 3.3, -3.4); mkWindow3(b, 5.6, 1.6, 7.8, 3.3, -3.4);
  BX(b, -4.2, 3.0, -3.4, 4.2, 3.08, -3.0, '#8f6a3a');
  const cols = ['#3a8ee6', '#25a862', '#e5483a', '#ffd23f', '#c58bff'];
  for (let i = 0; i < 10; i++){ const x = -3.9 + i * .8; BX(b, x, 3.08, -3.3, x + .26, 3.36 + (i % 3) * .1, -3.06, cols[i % 5]); }
  BX(b, -1.5, 3.7, -3.4, 1.5, 4.3, -3.32, '#2f5d46'); BX(b, -1.58, 3.65, -3.4, 1.58, 3.7, -3.28, '#8a6a48');
}
function mkLabBench3(b){
  BX(b, -5.8, TOPY - .14, -.8, 5.8, TOPY - .02, .8, '#b07a45'); BX(b, -5.8, TOPY - .02, -.8, 5.8, TOPY, .8, '#c89b5e');
  for (const x of [-5.55, 5.55]) for (const z of [-.65, .65]) BX(b, x - .07, 0, z - .07, x + .07, TOPY - .14, z + .07, '#6b4523');
  BX(b, -5.6, .2, -.65, 5.6, .26, .65, '#8f6a3a');
}
function mkGantry3(b){
  for (const x of [-5.35, 5.35]){ BX(b, x - .09, TOPY, -.09, x + .09, RAILY, .09, '#e2a93a'); BX(b, x - .26, TOPY, -.26, x + .26, TOPY + .08, .26, '#39424e'); BX(b, x - .07, TOPY + 1.2, -.3, x + .07, TOPY + 1.32, .3, '#b88426'); }
  BX(b, -5.45, RAILY, -.11, 5.45, RAILY + .16, .11, '#e2a93a'); BX(b, -5.45, RAILY + .16, -.14, 5.45, RAILY + .2, .14, '#b88426');
}
function mkBoard3(b){
  BX(b, -1.02, 0, -.28, 1.02, .08, .28, '#4a5563');
  for (const x of [-.72, .72]){ BX(b, x - .03, .08, -.03, x + .03, RAILY - BRDY, .03, '#2b323b'); BX(b, x - .12, RAILY - BRDY - .02, -.14, x + .12, RAILY - BRDY + .06, -.11, '#2b323b'); BX(b, x - .12, RAILY - BRDY - .02, .11, x + .12, RAILY - BRDY + .06, .14, '#2b323b'); }
  BX(b, .15, .08, .14, .4, .1, .17, '#2b2f36'); BX(b, -.98, .08, .19, .9, .1, .22, '#e5483a');
  BX(b, -.08, -.08, -.06, .08, 0, .06, '#2b323b');
}
function mkHolder3(b, n){ const w = n * .34 + .08; BX(b, -.95, .08, -.17, -.95 + w, .15, .17, '#2f6fb4'); BX(b, -.95, .08, -.17, -.91, .3, .17, '#1c3f6e'); BX(b, -.95 + w - .04, .08, -.17, -.95 + w, .3, .17, '#1c3f6e'); }
function mkBatt3(b, dir){
  BX(b, -.15, -.075, -.075, .15, .075, .075, '#d6dbe2'); BX(b, -.1, -.077, -.077, .06, .077, .077, '#3a8ee6');
  const px = dir > 0 ? .15 : -.15; BX(b, px, -.04, -.04, px + dir * .035, .04, .04, '#c87533');
}
function mkSwBase3(b){ BX(b, .36, .08, -.15, .9, .14, .15, '#eef1f4'); BX(b, .41, .14, -.05, .49, .2, .05, '#9aa3ad'); BX(b, .79, .14, -.05, .87, .2, .05, '#9aa3ad'); }
function mkLever3(b){ BX(b, 0, -.025, -.03, .42, .025, .03, '#3a3f47'); BX(b, .36, -.045, -.05, .46, .045, .05, '#e5483a'); }
function mkCoil3(b, on){
  BX(b, -.85, -.07, -.07, .85, .07, .07, '#9aa3ad'); BX(b, -.93, -.17, -.17, -.81, .17, .17, '#8a939d');
  BX(b, -.56, -.17, -.17, .56, .17, .17, on ? '#ee9446' : '#c87533', on ? 2 : -1);
  for (let x = -.52; x < .54; x += .1) BX(b, x, -.176, -.176, x + .022, .176, .176, '#8a4a1c');
  for (const x of [-.5, .5]) BX(b, x - .05, .17, -.05, x + .05, .24, .05, '#39424e');
}
function clipXZ(b, cx, y, cz, along = true, col = '#aab3bd'){
  const t = .02, L = .32, W = .12;
  const R = (x0, z0, x1, z1) => along ? BX(b, cx + x0, y, cz + z0, cx + x1, y + t * 2, cz + z1, col) : BX(b, cx + z0, y, cz + x0, cx + z1, y + t * 2, cz + x1, col);
  R(-L / 2, -W / 2, L / 2, -W / 2 + t * 2); R(-L / 2, W / 2 - t * 2, L / 2, W / 2); R(-L / 2, -W / 2, -L / 2 + t * 2, W / 2); R(L / 2 - t * 2, -W / 2, L / 2, W / 2);
  R(-L / 2 + .05, -W / 2 + .03, L / 2 - .04, -W / 2 + .03 + t * 2); R(-L / 2 + .05, W / 2 - .03 - t * 2, L / 2 - .09, W / 2 - .03);
}
function mkTray3(b){
  BX(b, -.8, 0, -.45, .8, .05, .45, '#c89b5e'); BX(b, -.8, 0, -.45, .8, .22, -.4, '#b07a45'); BX(b, -.8, 0, .4, .8, .22, .45, '#b07a45');
  BX(b, -.8, 0, -.45, -.75, .22, .45, '#b07a45'); BX(b, .75, 0, -.45, .8, .22, .45, '#b07a45');
  const r = mgRnd(7); for (let k = 0; k < 30; k++) clipXZ(b, -.55 + r() * 1.1, .05 + (k > 16 ? .04 : 0), -.28 + r() * .56, r() > .5);
}
function mkPile3(b){ const r = mgRnd(11); for (let k = 0; k < 54; k++){ const a = r() * Math.PI * 2, d = Math.sqrt(r()) * .8; clipXZ(b, Math.cos(a) * d * 1.25, .01 + (d < .35 ? .08 : d < .55 ? .04 : 0), Math.sin(a) * d * .45, r() > .5); } }
/* 큰 유리 수조 (테두리만 블록, 유리는 반투명 면) */
const TANK = {w:1.65, d:.48, h:.55};
function mkTank3(b){
  const {w, d, h} = TANK, c = '#7fb4d6';
  BX(b, -w, 0, -d, w, .04, d, '#cfe5f2');
  for (const x of [-w, w - .05]) for (const z of [-d, d - .05]) BX(b, x, 0, z, x + .05, h, z + .05, c);
  BX(b, -w, h - .05, -d, w, h, -d + .05, c); BX(b, -w, h - .05, d - .05, w, h, d, c); BX(b, -w, h - .05, -d, -w + .05, h, d, c); BX(b, w - .05, h - .05, -d, w, h, d, c);
}
function mkBasket3(b){ BX(b, -.5, 0, -.35, .5, .05, .35, '#a8743f'); BX(b, -.5, 0, -.35, .5, .3, -.3, '#b07a45'); BX(b, -.5, 0, .3, .5, .3, .35, '#b07a45'); BX(b, -.5, 0, -.35, -.45, .3, .35, '#b07a45'); BX(b, .45, 0, -.35, .5, .3, .35, '#b07a45'); }
function mkOrderBoard3(b){ BX(b, -.05, 0, -.05, .05, .5, .05, '#6b4523'); BX(b, -.95, .5, -.06, .95, 1.85, .02, '#fffdf4'); BX(b, -1.0, .45, -.08, 1.0, .5, .04, '#6b4523'); BX(b, -1.0, 1.85, -.08, 1.0, 1.9, .04, '#6b4523'); }
function mkCompass3(b){
  BX(b, -.38, 0, -.24, .38, .06, .24, '#5b6573'); BX(b, -.24, 0, -.38, .24, .06, .38, '#5b6573');
  BX(b, -.32, .06, -.2, .32, .08, .2, '#f4f6f8'); BX(b, -.2, .06, -.32, .2, .08, .32, '#f4f6f8');
  BX(b, -.035, .08, -.31, .035, .09, -.24, '#e5483a'); BX(b, -.03, .08, -.03, .03, .13, .03, '#39424e');
}
function mkNeedle3(b){ BX(b, 0, 0, -.035, .27, .04, .035, '#e5483a'); BX(b, .2, 0, -.05, .27, .04, .05, '#e5483a'); BX(b, -.27, 0, -.035, 0, .04, .035, '#3a8ee6'); }
function mkTrack3(b){ BX(b, -2.1, 0, -.22, 2.1, .04, -.17, '#5b6573'); BX(b, -2.1, 0, .17, 2.1, .04, .22, '#5b6573'); for (let x = -2.0; x <= 2.01; x += .35) BX(b, x - .05, 0, -.26, x + .05, .02, .26, '#8f6a3a'); BX(b, -2.2, 0, -.3, -2.1, .3, .3, '#e5483a'); }
function mkMagCar3(b, pole){
  BX(b, -.36, .08, -.22, .36, .42, .22, '#ffd23f'); BX(b, -.41, .1, -.2, -.36, .4, .2, pole === 'N' ? '#e5483a' : '#3a8ee6');
  for (const x of [-.22, .22]) for (const z of [-.25, .2]) BX(b, x - .08, 0, z, x + .08, .14, z + .05, '#2b2f36');
  BX(b, -.12, .42, -.12, .12, .5, .12, '#39424e');
}
/* 코일 아래 매달린 클립 자리 (코일 기준, 양 끝 두 줄로 송이송이) */
function hangL(k){ const e = k % 2 ? 1 : -1, i = Math.floor(k / 2), col = i % 2, row = Math.floor(i / 2); return {lx:e * (.85 + (col ? .08 : -.05)), ly:-.27 - row * .25, r:(col ? .3 : -.25) * e}; }
function coilPos(S){ return {x:S.x + S.L * Math.sin(S.th), y:BRDY - S.L * Math.cos(S.th)}; }
function hangW(k, c, th){ const h = hangL(k), cs = Math.cos(th), sn = Math.sin(th); return {x:c.x + h.lx * cs - h.ly * sn, y:c.y + h.lx * sn + h.ly * cs, r:h.r + th}; }
function magInit3(st){ return {st, x:0, v:0, th:0, om:0, L:L0, tw:null, busy:0, on:false, batt:1, dir:1, hang:[], att:1, fromY:TOPY + .1, fall:[], floor:[], inT:[], cup:0, needle:-Math.PI / 2, car:null, round:null, hearts:3, combo:0, score:0, tankX:2.65, tankAmp:0, tankPh:0, tankLv:0, basketN:0, fly:[], happy:0}; }
function magWinch(S, to, d, f){ S.tw = {a:S.L, b:to, t:0, d, f}; }
function magStep(S, dt, vT, dragX){
  if (S.tw){ S.tw.t += dt; const k = Math.min(1, S.tw.t / S.tw.d); S.L = lerp(S.tw.a, S.tw.b, ease3(k)); if (k >= 1){ const f = S.tw.f; S.tw = null; if (f) f(); } }
  const v0 = S.v;
  if (dragX != null){ const nx = S.x + (clamp(dragX, -4.3, 4.3) - S.x) * Math.min(1, dt * 5); S.v = clamp((nx - S.x) / Math.max(dt, 1e-3), -3.8, 3.8); S.x += S.v * dt; }   /* 끌기: 미끄러지듯 따라가기 */
  else { S.v += clamp(vT - S.v, -5.5 * dt, 5.5 * dt); S.x += S.v * dt; }
  if (S.x < -4.3 || S.x > 4.3){ S.x = clamp(S.x, -4.3, 4.3); S.v = 0; }
  const a = clamp((S.v - v0) / Math.max(dt, 1e-3), -14, 14);
  S.om += (-(9.8 / S.L) * Math.sin(S.th) - (a / S.L) * Math.cos(S.th) - 2.2 * S.om) * dt; S.th = clamp(S.th + S.om * dt, -.6, .6);
  S.att = Math.min(1, S.att + dt * 4);
}
function magRig3(S, t){
  const B = S3(S.x, BRDY, 0), c = coilPos(S), cs = Math.cos(S.th), sn = Math.sin(S.th);
  drawM(M3('board', mkBoard3), B); drawM(M3('holder' + S.batt, b => mkHolder3(b, S.batt)), B);
  for (let i = 0; i < S.batt; i++) drawM(M3('batt' + S.dir, b => mkBatt3(b, S.dir)), mMul(B, M4.trs(-.74 + i * .34, .165, 0)));
  drawM(M3('swbase', mkSwBase3), B); drawM(M3('lever', mkLever3), mMul(B, M4.trs(.45, .2, 0), mRZ(S.on ? -.03 : .62)));
  for (const [e, col] of [[-1, '#e5483a'], [1, '#2b2f36']]){ const ex = c.x + e * .5 * cs - .24 * sn, ey = c.y + e * .5 * sn + .24 * cs; bar3(col, col, S.x + e * .6, BRDY - .02, ex, ey, 0, .022); }
  drawM(M3(S.on ? 'coilOn' : 'coil', b => mkCoil3(b, S.on)), mMul(S3(c.x, c.y, 0), mRZ(S.th)));
  const a = ease3(S.att);
  S.hang.forEach((h, k) => { const p = hangW(k, c, S.th), sx = c.x + (k % 2 ? 1 : -1) * (.3 + (k % 5) * .12); clipHang(lerp(sx, p.x, a), lerp(S.fromY, p.y, a), 0, p.r); });
  for (const f of S.fall) clipHang(f.x, f.y, f.z, f.r);
  SH3(c.x, 0, .6, TOPY);
}
function magField3(U, S){
  if (!S.on) return;
  const ring = model('ringB', () => flatRing(.9, 1.0, [.25, .6, 1, 1])), al = [0, .38, .55, .75][S.batt], c = coilPos(S), cs = Math.cos(S.th), sn = Math.sin(S.th);
  for (const e of [-1, 1]) for (let k = 0; k < 3; k++){ const ph = (TIME * 1.4 + k / 3) % 1, r = .28 + ph * .55, d = .9 + ph * .3; flatDraw(U, ring, mMul(S3(c.x + e * d * cs, c.y + e * d * sn, 0), mRZ(Math.PI / 2 + S.th), mSC(r, 1, r)), [1, 1, 1, al * (1 - ph)]); }
}
function magTag3(S){ const c = coilPos(S), m = P3(S.x + 1.45, BRDY + .45, 0); if (m.ok) mg3Tag(m.x, m.y, S.on ? `ON · 전지 ${S.batt}개` : `OFF · 전지 ${S.batt}개`, {col:S.on ? '#ffd23f' : '#c9d4de'}); return c; }
const LAB3 = (S, extra) => ({
  draw(t, dt){ D3('lab', mkLab3); D3('bench', mkLabBench3); D3('gantry', mkGantry3); magRig3(S, t); extra.draw && extra.draw(t, dt); },
  flats(U){ magField3(U, S); extra.flats && extra.flats(U); },
  overlay(){ magTag3(S); extra.overlay && extra.overlay(); },
  cam:extra.cam,
});

/* ----- 1단계 · 켜고 끄기: 흔들리는 코일로 움직이는 수조에 클립 넣기 ----- */
function mag1Scene(S){
  const TRAY = -3.6;
  return LAB3(S, {cam:{x:0, y:2.0, z:0, w:11.9, h:3.3, pitch:.24},
    draw(){
      D3('tray', mkTray3, TRAY, TOPY, 0); D3('tank', mkTank3, S.tankX, TOPY, 0); SH3(S.tankX, 0, 1.2, TOPY);
      for (const q of S.inT) clipFlat(S.tankX + q.rx, q.y, q.z, q.r);
      for (const f of S.floor) clipFlat(f.x, f.y, f.z, f.r);
    },
    flats(U){
      const {w, d, h} = TANK, x = S.tankX;
      fBox(U, x - w, TOPY + .04, -d, x + w, TOPY + h, d, [.7, .9, 1, .16]);
      if (S.hang.length && !S.busy){ const c = coilPos(S); for (const e of [-1, 1]){ const p = hangW(e > 0 ? 1 : 0, c, S.th); fBox(U, p.x - .035, TOPY, -.035, p.x + .035, p.y - .1, .035, [1, 1, .5, .22]); } }
    },
    overlay(){
      tag3(TRAY, TOPY + .55, .5, '클립 상자');
      tag3(S.tankX, TOPY + TANK.h + .32, .5, `수조 ${Math.min(S.cup, 12)}/12`, {col:'#8fd3ff', size:14});
    }});
}
function mag3S1(api){
  const S = magInit3(0), GOAL = 12, TRAY = -3.6; let t = 50, hold = 0, drag = false, tx = 0;
  S.x = -1; api.scene(mag1Scene(S)); MG.dbg = S;
  const bot = api.bot(`<button class="btn hold" id="mL" aria-label="왼쪽">◀</button><button class="btn hold" id="mR" aria-label="오른쪽">▶</button><button class="btn primary big" id="mSw">스위치 켜기 <kbd>스페이스</kbd></button>`);
  api.holdBtn(bot.querySelector('#mL'), () => hold = -1, () => { if (hold < 0) hold = 0; });
  api.holdBtn(bot.querySelector('#mR'), () => hold = 1, () => { if (hold > 0) hold = 0; });
  const lbl = () => { bot.querySelector('#mSw').firstChild.textContent = S.on ? '스위치 끄기 ' : '스위치 켜기 '; };
  const release = () => {
    const c = coilPos(S), vb = {x:S.v + S.L * S.om * Math.cos(S.th), y:S.L * S.om * Math.sin(S.th)}, grp = {n:S.hang.length, inn:0, out:0};
    S.hang.forEach((h, k) => { const p = hangW(k, c, S.th); S.fall.push({x:p.x, y:p.y, z:(Math.random() - .5) * .25, vx:vb.x + (Math.random() - .5) * .25, vy:vb.y, r:p.r, vr:(Math.random() - .5) * 8, st:'air', grp}); });
    S.drops = (S.drops || []).concat(grp); S.hang = []; SFX.whoosh();
  };
  const sw = () => {
    if (MG.ended || S.busy) return;
    S.on = !S.on; lbl();
    if (S.on){
      const c = coilPos(S), d = Math.abs(c.x - TRAY);
      if (d < .95 && !S.hang.length){
        S.busy = 1; SFX.zap();
        magWinch(S, LDOWN, .26, () => {
          const n = d <= .32 ? 4 : d <= .62 ? 3 : 2, cc = coilPos(S);
          S.hang = [...Array(n).keys()].map(k => ({k})); S.att = 0; S.fromY = TOPY + .18;
          fxBurst(cc.x, TOPY + .5, 0, 12, ['#7cc6ff', '#ffffff'], 1.3, .05); fxPop(cc.x, TOPY + 1.3, .4, n === 4 ? '딱 가운데! 4개' : `${n}개 붙었어요`, n === 4 ? '#8ff0b9' : '#ffd23f', n === 4 ? 24 : 20);
          if (n === 4) SFX.ping();
          magWinch(S, L0, .3, () => { S.busy = 0; });
        });
        api.say('찰칵! 전기가 흐르자 클립이 붙었어요. 상자 <b>가운데</b>에 맞출수록 많이 붙어요.', 'ok');
      } else api.say('전기가 흘러 자석이 됐어요. 클립 상자 위에서 켜야 클립이 붙어요.');
    } else if (S.hang.length){ release(); api.say('스위치를 끄면 자석이 아니게 돼서 클립이 떨어져요. 흔들림까지 계산해서 수조에 넣어요!'); }
  };
  bot.querySelector('#mSw').onclick = sw;
  api.keys(e => { if (e.code === 'Space'){ if (!e.repeat) sw(); } else if (e.code === 'ArrowLeft' || e.code === 'KeyA'){ hold = -1; drag = false; } else if (e.code === 'ArrowRight' || e.code === 'KeyD'){ hold = 1; drag = false; } },
    e => { if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && hold < 0) hold = 0; if ((e.code === 'ArrowRight' || e.code === 'KeyD') && hold > 0) hold = 0; });
  const toX = sx => lerp(-4.3, 4.3, mg3LineT(sx, [-4.3, BRDY, 0], [4.3, BRDY, 0]));
  api.pointer({down:sx => { drag = true; tx = toX(sx); }, move:sx => { if (drag) tx = toX(sx); }, up:() => { drag = false; }});
  api.say('◀ ▶(또는 화면을 끌어서)로 기중기를 움직여요. 클립 상자 위에서 켜고, <b>흔들리며 움직이는 수조</b> 위에서 꺼서 클립을 넣어요!');
  api.loop(dt => {
    t -= dt;
    magStep(S, dt, S.busy ? 0 : hold * 3.8, S.busy || !drag ? null : tx);
    S.tankAmp += ([0, .55, .9, 1.2][S.tankLv] - S.tankAmp) * Math.min(1, dt * 1.2); S.tankPh += dt * [0, .75, 1.05, 1.4][S.tankLv]; S.tankX = 2.65 + S.tankAmp * Math.sin(S.tankPh);
    const rim = TOPY + TANK.h;
    for (const f of S.fall){
      const py = f.y; f.vy -= 13 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.r += f.vr * dt;
      const tl = S.tankX - TANK.w, tr = S.tankX + TANK.w;
      if (f.st === 'air'){
        if (py > rim && f.y <= rim){
          if (f.x > tl + .06 && f.x < tr - .06){ f.st = 'in'; f.rx = f.x - S.tankX; f.vx = 0; }
          else if (Math.abs(f.x - tl) <= .1 || Math.abs(f.x - tr) <= .1){ f.y = rim + .01; f.vy = Math.abs(f.vy) * .4; f.vx = (f.x < S.tankX ? -1 : 1) * (.8 + Math.random() * .8); SFX.clink(); }
        }
        const ground = Math.abs(f.x) < 5.8 ? TOPY + .005 : .005;
        if (f.st === 'air' && f.y <= ground){ f.done = true; S.floor.push({x:f.x, y:ground, z:f.z, r:f.r}); S.lost = (S.lost || 0) + 1; f.grp.out++; SFX.clatter(); fxPop(f.x, ground + .35, f.z, '−1', '#ff8a80', 20); fxShake(.07); }
      } else {
        f.x = S.tankX + f.rx; const fy = TOPY + .04 + Math.min(.24, Math.floor(S.cup / 8) * .035);
        if (f.y <= fy){ f.done = true; S.cup++; S.inT.push({rx:clamp(f.rx, -1.2, 1.2), y:fy, z:clamp(f.z, -.38, .38), r:f.r}); f.grp.inn++; SFX.clink(); fxBurst(f.x, fy + .15, f.z, 6, ['#bfe6ff', '#ffffff'], .9, .045); }
      }
    }
    S.fall = S.fall.filter(f => !f.done);
    for (const g of (S.drops || [])) if (!g.fin && g.inn + g.out >= g.n){
      g.fin = true;
      if (g.out === 0){ S.combo++; const pts = 10 * g.n * S.combo; S.score += pts; fxPop(S.tankX, TOPY + 1.3, 0, `+${pts}`, '#ffd23f', 30); fxBurst(S.tankX, TOPY + .8, 0, 34); SFX.combo(S.combo); fxFlash('#ffffff', .12); if (S.combo >= 2) fxBanner(`콤보 x${S.combo}!`, '#ffd23f'); }
      else { S.combo = 0; S.score += 10 * g.inn; if (g.inn) fxPop(S.tankX, TOPY + 1.2, 0, `+${10 * g.inn}`, '#ffffff', 22); }
      const lv = Math.min(3, S.drops.filter(d => d.fin).length);
      if (lv > S.tankLv && S.cup < GOAL){ S.tankLv = lv; fxBanner(lv === 1 ? '수조가 움직여요!' : '더 빨라져요!', '#7cc6ff', 1.2, 40); SFX.ping(); }
    }
    api.stat(`📎 수조 ${Math.min(S.cup, GOAL)}/${GOAL} · ⭐ ${S.score}${S.combo >= 2 ? ` · 🔥 콤보 x${S.combo}` : ''} · 떨어뜨림 ${S.lost || 0} · ${mgClock(t)}`);
    if (S.cup >= GOAL && !S.fall.length){ const used = 50 - t, lost = S.lost || 0; fxBurst(S.tankX, 2, 0, 70); SFX.win(); return api.end(lost <= 1 && used <= 40 ? 3 : lost <= 4 ? 2 : 1, `클립 ${GOAL}개를 ${Math.round(used)}초 만에 옮겼어요. 떨어뜨린 클립 ${lost}개 · 점수 ${S.score}`); }
    if (t <= 0) return api.end(S.cup >= 8 ? 1 : 0, `시간이 끝났어요. 수조에 ${S.cup}개를 옮겼어요. 점수 ${S.score}`);
  });
}

/* ----- 2단계 · 세기: 주문 러시 ----- */
function mag2Scene(S){
  return LAB3(S, {cam:{x:-1.0, y:2.0, z:0, w:13.8, h:3.4, pitch:.24},
    draw(t){
      D3('pile', mkPile3, 0, TOPY, 0); D3('order', mkOrderBoard3, -3.4, TOPY, -.3); D3('basket', mkBasket3, -5.0, TOPY, .3);
      const r = mgRnd(3); for (let k = 0; k < Math.min(S.basketN, 30); k++) clipFlat(-5.0 - .35 + r() * .7, TOPY + .06 + Math.floor(k / 8) * .035, .3 - .2 + r() * .4, r() * 3);
      for (const f of S.fly){ const a = ease3(f.t); clipHang(lerp(f.x, -5.0, a), lerp(f.y, TOPY + .3, a) + Math.sin(a * Math.PI) * .6, lerp(0, .3, a), f.r + a * 4); }
      const hop = S.happy > 0 ? Math.abs(Math.sin(t * 14)) * .22 : 0;
      person3('doctor', ST.x - 6.5, ST.y + hop, ST.z + .5, Math.PI * .55, 0); SH3(-6.5, .5, .38);
    },
    overlay(){
      const want = S.orders ? S.orders[Math.min(S.i, S.orders.length - 1)] : 9;
      tag3(-3.4, TOPY + 1.62, -.25, '🧑‍🔬 볼트 박사의 주문', {bg:'rgba(0,0,0,0)', col:'#b85a19', size:13});
      tag3(-3.4, TOPY + 1.2, -.25, `클립 ${want}개`, {bg:'rgba(0,0,0,0)', col:'#1c2733', size:28});
      if (S.pMax){ const a = P3(-4.2, TOPY + .78, -.25), b = P3(-2.6, TOPY + .78, -.25), k = clamp(S.p / S.pMax, 0, 1);
        if (a.ok && b.ok){ const w = b.x - a.x; ctx.fillStyle = '#dfe7ee'; rr(ctx, a.x, a.y - 7, w, 14, 7); ctx.fill(); ctx.fillStyle = k > .5 ? '#25a862' : k > .25 ? '#ee9a1c' : '#e5483a'; rr(ctx, a.x, a.y - 7, Math.max(6, w * k), 14, 7); ctx.fill(); } }
      if (S.hang.length && !S.busy) { const c = coilPos(S); tag3(c.x, c.y - 1.15, .3, `${S.hang.length}개`, {size:20}); }
      tag3(-5.0, TOPY + .6, .4, `바구니 ${S.basketN}개`, {size:12});
    }});
}
function mag3S2(api){
  const S = magInit3(1); S.orders = mgShuffle([4, 4, 4, 4, 9, 9, 9, 9, 14, 14, 14, 14]); S.i = 0; S.pMax = 7; S.p = 7; let wait = 0;
  api.scene(mag2Scene(S)); MG.dbg = S;
  const bot = api.bot(`${[1, 2, 3].map(n => `<button class="btn${n === 1 ? ' on' : ''}" data-b="${n}">전지 ${n}개 <kbd>${n}</kbd></button>`).join('')}<button class="btn primary big" id="mAt">스위치 켜서 붙이기 <kbd>스페이스</kbd></button>`);
  const setB = n => { if (S.on || S.busy) return; S.batt = n; bot.querySelectorAll('[data-b]').forEach(b => b.classList.toggle('on', +b.dataset.b === n)); SND.tick(); };
  bot.querySelectorAll('[data-b]').forEach(b => b.onclick = () => setB(+b.dataset.b));
  const finish = () => api.end(S.hearts >= 3 ? 3 : S.hearts === 2 ? 2 : 1, `주문 ${S.orders.length}개를 해냈어요. 남은 ❤️ ${S.hearts}개 · 점수 ${S.score}`);
  const next = () => {
    S.i++; if (S.i >= S.orders.length){ fxBurst(0, 2.2, 0, 70); SFX.win(); return finish(); }
    S.pMax = Math.max(3.4, 7 - S.i * .33); S.p = S.pMax;
    if (S.i === 4 || S.i === 8) fxBanner('더 빨리!', '#ffd23f', 1, 44);
  };
  const lose = msg => { S.hearts--; S.combo = 0; SFX.buzz(); fxShake(.14); fxFlash('#ff5040', .18); api.say(msg, 'bad'); if (S.hearts <= 0){ MG.loopFn = null; api.after(500, () => api.end(0, `❤️를 모두 잃었어요. 주문 ${S.i}개를 해냈어요. 전지 개수와 클립 수(4·9·14개)를 떠올려 봐요.`)); return true; } return false; };
  const evaluate = () => {
    const want = S.orders[S.i], n = S.hang.length, c = coilPos(S);
    if (n === want){
      S.combo++; const pts = (10 + Math.round(S.p * 4)) * S.combo; S.score += pts;
      fxPop(c.x, c.y + .6, .3, `+${pts}`, '#ffd23f', 30); fxBurst(c.x, c.y - .4, 0, 26); SFX.combo(S.combo); if (S.combo >= 2) fxBanner(`콤보 x${S.combo}!`, '#ffd23f');
      S.happy = .9; api.say(`✓ 주문 성공! 전지 ${S.batt}개 → 클립 ${n}개`, 'ok');
      S.hang.forEach((h, k) => { const p = hangW(k, c, S.th); S.fly.push({x:p.x, y:p.y, r:p.r, t:0}); }); S.hang = []; S.on = false; wait = .45;
    } else {
      const over = n > want;
      fxPop(c.x, c.y - 1.2, .4, over ? '너무 많아요!' : '모자라요!', '#ff8a80', 24);
      S.hang.forEach((h, k) => { const p = hangW(k, c, S.th); S.fall.push({x:p.x, y:p.y, z:0, vx:0, vy:0, r:p.r, vr:(Math.random() - .5) * 6}); }); S.hang = []; S.on = false;
      lose(over ? `클립 ${n}개, 너무 많아요! 전지를 줄이면 약해져요.` : `클립 ${n}개뿐이에요. 더 세게 하려면 전지를 더 연결해요!`);
    }
    S.busy = 0;
  };
  const attach = () => {
    if (S.on || S.busy || S.i >= S.orders.length || MG.ended || wait > 0) return;
    S.on = true; S.busy = 1; SFX.zap();
    magWinch(S, LDOWN, .24, () => { S.hang = [...Array(MAG_CAP[S.batt]).keys()].map(k => ({k})); S.att = 0; S.fromY = TOPY + .12; magWinch(S, L0, .3, evaluate); });
  };
  bot.querySelector('#mAt').onclick = attach;
  api.keys(e => { if (e.code === 'Space'){ if (!e.repeat) attach(); } else if (/^(Digit|Numpad)[123]$/.test(e.code)) setB(+e.code.slice(-1)); });
  api.say('볼트 박사의 주문이 밀려와요! <b>인내심 막대</b>가 다 줄기 전에 전지 개수를 골라 클립을 붙여요. 틀리거나 늦으면 ❤️가 줄어요.');
  api.loop(dt => {
    magStep(S, dt, 0);
    for (const f of S.fly) f.t += dt * 2.2; const landed = S.fly.filter(f => f.t >= 1).length; if (landed){ S.basketN += landed; SFX.clink(); } S.fly = S.fly.filter(f => f.t < 1);
    for (const f of S.fall){ f.vy -= 12 * dt; f.y += f.vy * dt; f.r += f.vr * dt; if (f.y <= TOPY + .05) f.done = true; } S.fall = S.fall.filter(f => !f.done);
    S.happy = Math.max(0, S.happy - dt);
    if (wait > 0){ wait -= dt; if (wait <= 0) next(); }
    else if (!S.busy && S.i < S.orders.length){ S.p -= dt; if (S.p <= 0){ fxBanner('시간 초과!', '#ff8a80', 1, 44); if (!lose(`늦었어요! 주문은 클립 ${S.orders[S.i]}개였어요.`)) next(); } }
    api.stat(`🧾 주문 ${Math.min(S.i + 1, S.orders.length)}/${S.orders.length} · ${heartsTxt(S.hearts, 3)} · ⭐ ${S.score}${S.combo >= 2 ? ` · 🔥 x${S.combo}` : ''}`);
  });
}

/* ----- 3단계 · 극의 방향: 나침반 속사 → 자석 자동차 막기 ----- */
function mag3Scene(S){
  return LAB3(S, {cam:{x:1.2, y:1.75, z:.2, w:10.6, h:3.2, pitch:.42},
    draw(){
      const r = S.round;
      if (r && r.k === 'compass'){ D3('compass', mkCompass3, 3.0, TOPY, 0, 0, 2.1); drawM(M3('needle', mkNeedle3), S3(3.0, TOPY + .21, 0, -S.needle, 2.1)); }
      else { D3('track', mkTrack3, 3.6, TOPY, 0, 0, 1); if (S.car) D3('magcar' + S.car.pole, b => mkMagCar3(b, S.car.pole), S.car.x, TOPY + (S.car.fall || 0), 0, 0, 1.3); }
    },
    flats(U){
      const r = S.round; if (!r || r.k === 'compass') return;
      if (r.k === 'push') fBox(U, 1.85, TOPY + .045, -.3, 2.05, TOPY + .06, .3, [1, .25, .2, .75]);
      else fBox(U, 1.75, TOPY + .045, -.3, 2.55, TOPY + .06, .3, [.2, .85, .4, .55]);
    },
    overlay(){
      const r = S.round, c = coilPos(S);
      if (S.on){ const right = S.dir > 0 ? 'N' : 'S', left = right === 'N' ? 'S' : 'N';
        tag3(c.x + 1.1, c.y + .02, .2, right, {bg:right === 'N' ? '#e5483a' : '#3a8ee6', size:16}); tag3(c.x - 1.15, c.y + .02, .2, left, {bg:left === 'N' ? '#e5483a' : '#3a8ee6', size:16}); }
      tag3(S.x - .74 + S.dir * .26, BRDY + .5, 0, '+', {size:15, bg:'#c87533'});
      if (!r) return;
      if (r.k === 'compass'){ tag3(3.0, TOPY + 1.35, .3, `목표: 빨간 바늘 ${r.want > 0 ? '→ 오른쪽' : '← 왼쪽'}`, {bg:'#fff7d6', col:'#6b4523', border:'#e2a93a', size:14}); }
      else if (S.car){ tag3(S.car.x - .55, TOPY + .5, .35, S.car.pole, {bg:S.car.pole === 'N' ? '#e5483a' : '#3a8ee6', size:14}); tag3(3.6, TOPY + 1.35, .3, r.k === 'push' ? '목표: 빨간 선 전에 밀어내기!' : '목표: 초록 칸으로 끌어당기기!', {bg:'#fff7d6', col:'#6b4523', border:'#e2a93a', size:14}); }
      if (S.rt != null && S.rt > 0 && (r.k === 'compass' || r.k === 'pull')){ const p = P3(3.0, TOPY + 1.8, .3); if (p.ok) mg3Tag(p.x, p.y, `⏱ ${S.rt.toFixed(1)}초`, {col:S.rt < 1.5 ? '#ff8a80' : '#fff', size:14}); }
    }});
}
function mag3S3(api){
  const R = mgShuffle([1, -1, 1, -1]).map(w => ({k:'compass', want:w})).concat([{k:'push', pole:'N'}, {k:'push', pole:'S'}, {k:'pull', pole:'S'}, {k:'push', pole:'S'}, {k:'push', pole:'N'}, {k:'pull', pole:'N'}]);
  const S = magInit3(2); let i = 0, wait = 0, settled = false;
  api.scene(mag3Scene(S)); MG.dbg = S;
  const bot = api.bot(`<button class="btn big" id="mFlip">⇄ 전지 방향 바꾸기 <kbd>F</kbd></button><button class="btn primary big" id="mChk">스위치 <kbd>스페이스</kbd></button>`);
  const finish = () => api.end(S.hearts >= 3 ? 3 : S.hearts === 2 ? 2 : 1, `${R.length}판을 모두 마쳤어요. 남은 ❤️ ${S.hearts}개 · 점수 ${S.score}`);
  const start = () => {
    const r = R[i]; S.round = r; S.on = false; settled = false; S.needle = -Math.PI / 2;
    if (r.k === 'compass'){ S.rt = Math.max(3.2, 4.6 - i * .3); S.car = null; fxBanner(`바늘을 ${r.want > 0 ? '오른쪽 →' : '← 왼쪽'}으로!`, '#ffd23f', .9, 38); }
    else if (r.k === 'push'){ S.rt = null; S.car = {x:5.6, v:-(.8 + (i - 4) * .12), pole:r.pole}; fxBanner('자동차를 밀어내요!', '#ffd23f', .9, 38); }
    else { S.rt = 5; S.car = {x:4.3, v:0, pole:r.pole}; fxBanner('초록 칸으로 끌어당겨요!', '#8ff0b9', .9, 38); }
  };
  const win = msg => { if (settled) return; settled = true; S.combo++; const pts = 20 * S.combo; S.score += pts; SFX.combo(S.combo); fxBurst(S.car ? S.car.x : 3.0, TOPY + .8, 0, 28); fxPop(S.car ? S.car.x : 3.0, TOPY + 1.2, .4, `+${pts}`, '#ffd23f', 28); if (S.combo >= 2) fxBanner(`콤보 x${S.combo}!`, '#ffd23f', .9); api.say(`✓ ${msg}`, 'ok'); wait = 1.0; };
  const fail = msg => { if (settled) return; settled = true; S.hearts--; S.combo = 0; SFX.boom(); fxShake(.2); fxFlash('#ff5040', .2); api.say(`✗ ${msg}`, 'bad'); wait = 1.1; if (S.hearts <= 0){ MG.loopFn = null; api.after(700, () => api.end(0, `❤️를 모두 잃었어요. 전지 방향을 바꾸면 전자석의 극이 바뀌는 것을 떠올려 봐요.`)); } };
  const flip = () => { if (S.on || MG.ended || settled) return; S.dir *= -1; SND.tick(); fxPop(S.x - .74 + S.dir * .26, BRDY + .8, 0, '⇄', '#ffd23f', 22); };
  const toggle = () => {
    if (MG.ended || settled || !S.round) return;
    S.on = !S.on; SFX.zap();
    if (S.round.k === 'compass' && S.on){ const ok = S.dir === S.round.want; if (ok) win('바늘이 원하는 쪽을 가리켰어요!'); else fail('반대예요! 전지 방향을 바꾸면 전자석의 극이 바뀌어요.'); }
  };
  bot.querySelector('#mFlip').onclick = flip; bot.querySelector('#mChk').onclick = toggle;
  api.keys(e => { if (e.code === 'Space'){ if (!e.repeat) toggle(); } else if (e.code === 'KeyF' || e.code === 'ArrowLeft' || e.code === 'ArrowRight'){ if (!e.repeat) flip(); } });
  api.say('전지 방향(구리색 + 끝)을 정하고 스위치를 켜요. 같은 극끼리는 밀어내고, 다른 극끼리는 끌어당겨요. 스위치를 켠 채로는 전지를 못 바꿔요!');
  start();
  api.loop(dt => {
    magStep(S, dt, 0);
    const r = S.round, rightPole = S.dir > 0 ? 'N' : 'S';
    const wantNeedle = S.on ? (S.dir > 0 ? 0 : Math.PI) : -Math.PI / 2; S.needle += angDiff(wantNeedle, S.needle) * Math.min(1, dt * 7);
    if (S.rt != null && !settled){ S.rt -= dt; if (S.rt <= 0){ if (r.k === 'compass') fail('시간이 지났어요!'); else fail('시간 안에 끌어당기지 못했어요.'); } }
    if (S.car && !settled){
      const car = S.car, gap = Math.max(.3, car.x - 1.4);
      if (S.on){ const f = (rightPole === car.pole ? 1 : -1) * 4.6 / (gap * gap); car.v += clamp(f, -10, 10) * dt; }
      car.v *= Math.pow(.92, dt); car.x += car.v * dt;
      if (r.k === 'push'){ if (car.x <= 2.0){ car.x = 2.0; car.v = 1.2; fail('쾅! 자동차가 부딪쳤어요. 같은 극이어야 밀어내요.'); } else if (car.v > .2 && car.x > 3.1 && S.on) win('같은 극끼리 밀어냈어요!'); }
      else { if (car.x <= 2.2){ car.x = 2.2; car.v = 0; win('다른 극끼리 끌어당겼어요!'); } else if (car.x >= 5.65){ car.fall = -.5; fail('자동차가 밀려 떨어졌어요. 다른 극이어야 끌어당겨요.'); } }
    } else if (S.car && settled){ S.car.v *= Math.pow(.5, dt); S.car.x = clamp(S.car.x + S.car.v * dt, 1.9, 5.7); }
    if (wait > 0){ wait -= dt; if (wait <= 0 && !MG.ended && S.hearts > 0){ i++; if (i >= R.length){ fxBurst(2, 2, 0, 60); SFX.win(); return finish(); } S.on = false; start(); } }
    api.stat(`🧭 ${Math.min(i + 1, R.length)}/${R.length}판 · ${heartsTxt(S.hearts, 3)} · ⭐ ${S.score}${S.combo >= 2 ? ` · 🔥 x${S.combo}` : ''}`);
  });
}

/* ===== 🔍 전자석 탐정 3D ===== */
function mkClass3(b){
  mkRoom3(b, {w:18, d:6, h:4.4, wallCol:'#f6efe2'});
  BX(b, -2.9, 1.45, -6, 2.9, 3.35, -5.92, '#2f5d46'); BX(b, -3.0, 1.38, -6, 3.0, 1.45, -5.8, '#8a6a48');
  BX(b, -3.0, 3.35, -6, 3.0, 3.42, -5.9, '#8a6a48'); BX(b, -3.0, 1.45, -6, -2.9, 3.35, -5.9, '#8a6a48'); BX(b, 2.9, 1.45, -6, 3.0, 3.35, -5.9, '#8a6a48');
  mkWindow3(b, -8.2, 1.6, -5.8, 3.3, -6); mkWindow3(b, 5.8, 1.6, 8.2, 3.3, -6);
}
function mkPC3(b){ BX(b, -.42, .12, -.06, .42, .66, .04, '#2b2f36'); BX(b, -.36, .18, .04, .36, .6, .05, '#7cc6ff', 2); BX(b, -.06, 0, -.06, .06, .12, .02, '#2b2f36'); BX(b, -.2, 0, -.12, .2, .02, .02, '#2b2f36'); BX(b, -.38, 0, .16, .38, .03, .38, '#3a3f47'); }
function mkSpeaker3(b){ BX(b, -.26, -.36, 0, .26, .36, .3, '#2b2f36'); BX(b, -.16, .02, .3, .16, .28, .32, '#6f7b88'); BX(b, -.1, -.28, .3, .1, -.08, .32, '#6f7b88'); BX(b, -.06, .1, .32, .06, .2, .33, '#3a3f47'); }
function mkFanBody3(b){ BX(b, -.32, 0, -.32, .32, .08, .32, '#5b6573'); BX(b, -.04, .08, -.04, .04, 1.55, .04, '#5b6573'); BX(b, -.16, 1.52, -.22, .16, 1.88, .12, '#eef3f8'); }
function mkFanBlades3(b){ for (const [x0, y0, x1, y1] of [[-.05, .04, .05, .42], [.03, -.05, .4, .05], [-.42, -.05, -.03, .05], [-.05, -.42, .05, -.04]]) BX(b, x0, y0, -.02, x1, y1, .02, '#3a8ee6'); BX(b, -.07, -.07, -.03, .07, .07, .04, '#5b6573'); }
function mkTablet3(b){ BX(b, -.24, 0, -.32, .24, .03, .32, '#2b2f36'); BX(b, -.2, .03, -.28, .2, .036, .28, '#7cc6ff', 2); }
function mkBooks3(b){ BX(b, -.3, 0, -.22, .3, .1, .22, '#3a8ee6'); BX(b, -.27, .1, -.2, .27, .2, .2, '#e2782b'); BX(b, -.3, .2, -.22, .3, .28, .22, '#25a862'); }
function mkPencil3(b){ BX(b, -.26, 0, -.025, .26, .05, .025, '#ffd23f'); BX(b, .26, .01, -.015, .32, .04, .015, '#3a2a1d'); BX(b, -.3, 0, -.025, -.26, .05, .025, '#e5483a'); }
function mkPlant3(b){ BX(b, -.26, 0, -.26, .26, .46, .26, '#b07a45'); for (const [x, y, z, s] of [[0, .62, 0, .22], [-.15, .52, .1, .14], [.16, .55, -.08, .15], [.02, .82, .04, .14]]) BX(b, x - s, y - s, z - s, x + s, y + s, z + s, '#3fae5a'); }
function mkGlobe3(b){ BX(b, -.05, 0, -.05, .05, .2, .05, '#8f6a3a'); BX(b, -.18, 0, -.12, .18, .03, .12, '#8f6a3a'); BX(b, -.22, .22, -.22, .22, .62, .22, '#3a8ee6'); BX(b, -.17, .17, -.17, .17, .67, .17, '#3a8ee6'); BX(b, -.12, .34, .2, .06, .52, .23, '#25a862'); BX(b, .1, .26, -.12, .23, .4, .08, '#25a862'); }
function mkBall3(b){ BX(b, -.2, 0, -.2, .2, .4, .2, '#ffffff'); BX(b, -.07, .14, .2, .07, .26, .21, '#2b2f36'); BX(b, .2, .1, -.06, .21, .22, .06, '#2b2f36'); BX(b, -.06, .4, -.06, .06, .41, .06, '#2b2f36'); }
function mkRuler3(b){ BX(b, -.42, 0, -.06, .42, .02, .06, '#f2d024'); for (let x = -.38; x <= .39; x += .08) BX(b, x, .02, -.06, x + .012, .025, -.02, '#3a2a1d'); }
function mkCalendar3(b){ BX(b, -.36, -.42, 0, .36, .42, .04, '#ffffff'); BX(b, -.36, .26, .04, .36, .42, .05, '#e5483a'); for (let i = 0; i < 3; i++) BX(b, -.3, -.3 + i * .16, .04, .3, -.29 + i * .16, .045, '#9aa3ad'); }
function mkChair3(b){ BX(b, -.25, .42, -.25, .25, .47, .25, '#8f6a3a'); for (const x of [-.21, .21]) for (const z of [-.21, .21]) BX(b, x - .03, 0, z - .03, x + .03, .42, z + .03, '#6b4523'); BX(b, -.25, .47, .2, .25, .85, .25, '#8f6a3a'); }
/* 교실 곳곳의 전자석 예시 모형 (교재 · 전자석 도감의 예시를 모두) */
function mkCabinet3(b){ BX(b, -1.2, 0, -.35, 1.2, .95, .35, '#b07a45'); BX(b, -1.25, .95, -.4, 1.25, 1.02, .4, '#c89b5e'); for (const x of [-.6, .6]) BX(b, x - .02, .1, .35, x + .02, .85, .36, '#8f6a3a'); }
function mkRobovac3(b){ BX(b, -.32, 0, -.2, .32, .1, .2, '#d5dbe2'); BX(b, -.2, 0, -.32, .2, .1, .32, '#d5dbe2'); BX(b, -.18, .1, -.18, .18, .13, .18, '#39424e'); BX(b, -.04, .13, -.24, .04, .15, -.18, '#25a862', 2); }
function mkDroneToy3(b){ BX(b, -.4, -.02, -.03, .4, .02, .03, '#39424e'); BX(b, -.03, -.02, -.4, .03, .02, .4, '#39424e'); BX(b, -.12, -.06, -.12, .12, .06, .12, '#eef3f8'); BX(b, -.04, -.02, -.04, .04, .02, .04, '#e2782b', 2); for (const [x, z] of [[-.4, 0], [.4, 0], [0, -.4], [0, .4]]) BX(b, x - .04, .02, z - .04, x + .04, .07, z + .04, '#39424e'); }
function mkRotor3(b){ BX(b, -.16, 0, -.02, .16, .012, .02, '#7cc6ff'); BX(b, -.02, 0, -.16, .02, .012, .16, '#7cc6ff'); }
function mkCraneToy3(b){ BX(b, -.25, 0, -.25, .25, .06, .25, '#39424e'); BX(b, -.04, .06, -.04, .04, .9, .04, '#e2a93a'); BX(b, -.15, .86, -.04, .55, .92, .04, '#e2a93a'); BX(b, .5, .5, -.012, .512, .86, .012, '#2b2f36'); BX(b, .4, .38, -.1, .62, .5, .1, '#3a3f47'); BX(b, .41, .41, -.11, .61, .45, .11, '#ff9a3a', 2); BX(b, .38, 0, -.12, .64, .08, .12, '#8a9099'); }
function mkMaglevToy3(b){ BX(b, -.75, 0, -.12, .75, .05, .12, '#9aa3ad'); BX(b, -.7, .05, -.1, .7, .07, .1, '#5b6573'); BX(b, -.55, .12, -.11, .45, .34, .11, '#eef3f8'); BX(b, .45, .12, -.09, .62, .28, .09, '#dfe6ee'); BX(b, -.55, .2, -.115, .45, .24, .115, '#3a8ee6'); BX(b, .3, .25, -.116, .44, .31, .116, '#1c2733'); }
function mkMriToy3(b){ BX(b, -.3, 0, -.22, .3, .55, .22, '#eef3f8'); BX(b, -.16, .14, -.23, .16, .42, .23, '#26303b'); BX(b, -.08, .18, .22, .08, .24, .62, '#9fb3c8'); BX(b, -.06, 0, .5, .06, .18, .56, '#9aa3ad'); }
function mkWasherToy3(b){ BX(b, -.25, 0, -.24, .25, .5, .24, '#f4f6f8'); BX(b, -.25, .4, .24, .25, .5, .25, '#c9d4de'); BX(b, -.14, .1, .24, .14, .36, .26, '#4f8fd6'); BX(b, -.09, .15, .26, .09, .31, .27, '#9cc7ee', 2); }
function mkDryer3(b){ BX(b, -.22, .14, -.07, .14, .3, .07, '#e05a8a'); BX(b, .14, .17, -.05, .24, .27, .05, '#39424e'); BX(b, -.12, 0, -.05, -.02, .16, .05, '#c4416f'); }
function mkEraser3(b){ BX(b, -.12, 0, -.07, .12, .08, .07, '#ffffff'); BX(b, -.12, 0, -.07, -.02, .08, .07, '#3a8ee6'); }
function mkCup3(b){ BX(b, -.1, 0, -.1, .1, .24, .1, '#e5483a'); BX(b, .1, .07, -.02, .15, .18, .02, '#e5483a'); }
const CLASS3 = [
  {id:'spk', name:'스피커', ok:true, x:-4.2, y:3.0, z:-5.75, r:.45, why:'스피커 속 전자석의 세기를 빠르게 바꿔 진동판을 떨게 해요. 그래서 소리가 나요.'},
  {id:'fan', name:'선풍기', ok:true, x:6.4, y:1.6, z:-3.1, r:.55, why:'선풍기 속 전동기에 전자석이 있어요. 세기를 바꿔 바람 세기를 조절해요.'},
  {id:'pc', name:'컴퓨터', ok:true, x:0, y:1.2, z:-4.35, r:.48, why:'컴퓨터의 스피커와 열을 식히는 팬(전동기)에 전자석이 들어 있어요.'},
  {id:'tab', name:'스마트 기기', ok:true, x:-3.6, y:.8, z:-1.55, r:.36, why:'스마트폰·태블릿의 스피커와 진동 장치에 전자석이 들어 있어요.'},
  {id:'robovac', name:'로봇 청소기', ok:true, x:-1.4, y:.12, z:.3, r:.4, why:'로봇 청소기의 바퀴와 흡입 장치를 돌리는 전동기에 전자석이 있어요. 극의 방향을 바꿔 뒤로도 가요.'},
  {id:'drone', name:'드론', ok:true, x:4.1, y:1.15, z:1.2, r:.42, why:'드론 날개를 돌리는 전동기 4개 속 전자석의 세기를 조절해서 떠오르고 방향을 바꿔요.'},
  {id:'crane', name:'전자석 기중기 모형', ok:true, x:-6.9, y:1.45, z:-5.55, r:.45, why:'전기를 켜면 자석이 되어 철을 붙이고, 끄면 내려놓아요. 켜고 끄기 성질이에요.'},
  {id:'maglev', name:'자기 부상 열차 모형', ok:true, x:7.0, y:1.2, z:-5.55, r:.55, why:'전자석의 극을 차례로 바꿔 가며 선로 위에 떠서 달려요.'},
  {id:'ev', name:'전기 자동차 장난감', ok:true, x:2.3, y:.25, z:-.2, r:.4, why:'바퀴를 돌리는 전동기에 전자석이 들어 있어요. 세기로 빠르기를, 극의 방향으로 앞뒤를 바꿔요.'},
  {id:'mri', name:'자기 공명 영상 장치 모형', ok:true, x:-1.8, y:1.05, z:-4.35, r:.38, why:'아주 센 전자석으로 몸속을 사진처럼 찍는 병원 기계예요.'},
  {id:'washer', name:'세탁기 장난감', ok:true, x:-4.3, y:.95, z:1.1, r:.34, why:'전동기 전자석의 극의 방향을 바꿔 세탁통을 왼쪽·오른쪽으로 돌려요.'},
  {id:'dryer', name:'머리 말리개', ok:true, x:3.5, y:.92, z:-1.5, r:.34, why:'머리 말리개 속 전동기 전자석의 세기를 바꿔 약한 바람·센 바람을 만들어요.'},
  {id:'book', name:'책', x:4.4, y:.88, z:-1.55, r:.34}, {id:'pencil', name:'연필', x:-4.55, y:.78, z:-1.15, r:.3},
  {id:'plant', name:'화분', x:-7.8, y:.55, z:-1.4, r:.45}, {id:'globe', name:'지구본', x:1.75, y:1.3, z:-4.3, r:.36},
  {id:'ball', name:'공', x:5.4, y:.2, z:.9, r:.32}, {id:'sci', name:'가위', x:4.7, y:.86, z:1.0, r:.28},
  {id:'ruler', name:'자', x:-3.4, y:.76, z:1.35, r:.34}, {id:'cal', name:'달력', x:4.4, y:2.6, z:-5.85, r:.42},
  {id:'eraser', name:'지우개', x:-4.6, y:.78, z:-1.7, r:.26}, {id:'cup', name:'컵', x:-.9, y:.95, z:-4.05, r:.26},
];
function classDraw3(t){
  D3('class', mkClass3);
  D3('tdesk', b => mkDesk3(b, 2.6, .95, .82), 0, 0, -4.3); D3('pc3', mkPC3, 0, .82, -4.45);
  D3('globe3', mkGlobe3, 1.75, .82, -4.3); D3('mri3', mkMriToy3, -1.8, .82, -4.45); D3('cup3', mkCup3, -.9, .82, -4.05);
  for (const x of [-4, 4]){ D3('sdesk', b => mkDesk3(b, 1.6, .8, .72), x, 0, -1.4); D3('chair3', mkChair3, x, 0, -.55); SH3(x, -1.4, .9); }
  for (const x of [-4, 4]){ D3('sdesk', b => mkDesk3(b, 1.6, .8, .72), x, 0, 1.2); D3('chair3', mkChair3, x, 0, 2.0); SH3(x, 1.2, .9); }
  D3('tablet3', mkTablet3, -3.6, .72, -1.55); D3('pencil3', mkPencil3, -4.55, .72, -1.15); D3('eraser3', mkEraser3, -4.6, .72, -1.7);
  D3('books3', mkBooks3, 4.4, .72, -1.55); D3('dryer3', mkDryer3, 3.5, .72, -1.5);
  D3('washerT', mkWasherToy3, -4.3, .72, 1.1); D3('ruler3', mkRuler3, -3.4, .72, 1.35); spr3(4.7, .84, 1.0, '✂️', .2);
  D3('cab3', mkCabinet3, -7.0, 0, -5.55); D3('cab3', mkCabinet3, 7.0, 0, -5.55);
  D3('craneT', mkCraneToy3, -7.0, 1.02, -5.55); D3('maglevT', mkMaglevToy3, 7.0, 1.02 + Math.sin(t * 2.2) * .02, -5.55);
  D3('spk3', mkSpeaker3, -4.2, 3.0, -6); D3('cal3', mkCalendar3, 4.4, 2.6, -6);
  D3('plant3', mkPlant3, -7.8, 0, -1.4); D3('ball3', mkBall3, 5.4, 0, .9); SH3(5.4, .9, .28);
  D3('robovac3', mkRobovac3, -1.4 + Math.sin(t * .6) * .6, 0, .3 + Math.cos(t * .6) * .25, t * .6); SH3(-1.4, .3, .35);
  drawM(model('car:#2fb36b:ev', () => mkCar('#2fb36b', true)), S3(2.3, 0, -.2, Math.PI / 2 + .4, .4)); SH3(2.3, -.2, .32);
  const dy = .9 + Math.sin(t * 3) * .08; D3('droneT', mkDroneToy3, 4.1, .72 + dy * .5, 1.2);
  for (const [x, z] of [[-.4, 0], [.4, 0], [0, -.4], [0, .4]]) drawM(M3('rotor3', mkRotor3), S3(4.1 + x, .72 + dy * .5 + .07, 1.2 + z, t * 30)); SH3(4.1, 1.2, .3, .72);
  D3('fanBody', mkFanBody3, 6.4, 0, -3.2); drawM(M3('fanBlades', mkFanBlades3), mMul(S3(6.4, 1.7, -3.06), mRZ(t * 9))); SH3(6.4, -3.2, .4);
}
/* 1단계 · 교실에서 찾기: 빨리 이어서 찾으면 콤보와 시간 보너스 */
function det3S1(api){
  const S = {found:{}, wrong:{}, hearts:3, t:80, last:-9, combo:0, el:0};
  const need = CLASS3.filter(s => s.ok).length; MG.dbg = S;
  api.scene({cam:{x:0, y:1.6, z:-2.6, w:17.4, h:4.6, pitch:.36}, draw:classDraw3,
    overlay(){
      tag3(0, 2.45, -5.85, '전자석을 찾아라!', {bg:'rgba(0,0,0,0)', col:'#eef7ee', size:20});
      for (const s of CLASS3){ const o = s.id === 'robovac' ? {x:-1.4 + Math.sin(TIME * .6) * .6, z:.3 + Math.cos(TIME * .6) * .25} : s; if (S.found[s.id]){ mark3(o.x, s.y + s.r + .2, o.z, true); tag3(o.x, s.y - s.r - .05, o.z, s.name, {col:'#8ff0b9', size:12}); } else if (S.wrong[s.id]) mark3(o.x, s.y + s.r + .2, o.z, false); }
    }});
  api.say('교실 곳곳에 <b>전자석이 들어 있는 물건 12개</b>가 숨어 있어요(모형 포함)! 모두 찾아 눌러요. 빨리 이어서 찾으면 <b>콤보</b>와 시간 보너스! 틀리면 ❤️가 줄어요.');
  api.pointer({down:(sx, sy) => {
    const live = CLASS3.filter(s => !S.found[s.id] && !S.wrong[s.id]).map(s => s.id === 'robovac' ? Object.assign({}, s, {x:-1.4 + Math.sin(TIME * .6) * .6, z:.3 + Math.cos(TIME * .6) * .25}) : s);
    const hit = api.pick(live, sx, sy); if (!hit || MG.ended) return;
    if (hit.ok){
      S.found[hit.id] = 1; S.combo = S.el - S.last <= 5 ? S.combo + 1 : 1; S.last = S.el;
      fxBurst(hit.x, hit.y, hit.z, 26); fxPop(hit.x, hit.y + .6, hit.z, `${hit.name}!`, '#8ff0b9', 24);
      if (S.combo >= 2){ S.t += 3; fxBanner(`콤보 x${S.combo}! +3초`, '#ffd23f', 1); SFX.combo(S.combo); } else SFX.ping();
      SND.ok(); api.say(`✓ <b>${hit.name}</b>: ${hit.why}`, 'ok');
    } else { S.wrong[hit.id] = 1; S.hearts--; S.combo = 0; SFX.buzz(); fxShake(.14); fxFlash('#ff5040', .16); api.say(`✗ ${hit.name}에는 전기가 흐르지 않아서 전자석이 없어요.`, 'bad'); }
  }});
  api.loop(dt => {
    S.t -= dt; S.el += dt; const n = Object.keys(S.found).length;
    api.stat(`🔍 찾은 전자석 ${n}/${need} · ${heartsTxt(S.hearts, 3)}${S.combo >= 2 ? ` · 🔥 x${S.combo}` : ''} · ${mgClock(S.t)}`);
    if (n >= need){ SFX.win(); const used = S.el; return api.end(S.hearts === 3 && used <= 55 ? 3 : S.hearts >= 2 ? 2 : 1, `교실에 숨은 전자석 ${need}개를 모두 찾았어요! (${Math.round(used)}초)`); }
    if (S.hearts <= 0) return api.end(0, '❤️를 모두 잃었어요. 전기가 흐르는 물건을 찾아봐요.');
    if (S.t <= 0) return api.end(n >= 8 ? 1 : 0, `시간이 끝났어요. ${need}개 중 ${n}개를 찾았어요.`);
  });
}
/* 2단계 · 생활 속 기기와 성질: 위에서 떨어지는 기기를 땅에 닿기 전에 성질 칸으로! */
const DET_BINS = [['onoff', '🔌', '켜고 끄기', -3.4, '#3a8ee6'], ['power', '🔆', '세기', 0, '#ee9a1c'], ['pole', '🧭', '극의 방향', 3.4, '#c58bff']];
function mkPropBin3(b, col){ BX(b, -1.1, 0, -.55, 1.1, .08, .55, col); BX(b, -1.1, 0, -.55, 1.1, .75, -.47, col); BX(b, -1.1, 0, .47, 1.1, .6, .55, col); BX(b, -1.1, 0, -.55, -1.02, .75, .55, col); BX(b, 1.02, 0, -.55, 1.1, .75, .55, col); BX(b, -1.12, .52, .55, 1.12, .6, .58, '#ffffff'); }
function det3S2(api){
  const deck = mgShuffle(DEVICES), S = {i:0, hearts:3, miss:0, combo:0, score:0, cur:null, fly:null, wait:.6}; MG.dbg = S;
  const spawn = () => { const d = deck[S.i]; S.cur = {d, x:(Math.random() - .5) * 4, y:4.3, z:-1.6, v:.5 + S.i * .07}; api.say(`🔽 <b>${esc(d.name)}</b> — ${DEV_HINT[d.id] || ''} 어떤 성질을 쓸까요? (1·2·3 또는 칸 누르기)`); };
  const finish = () => { SFX.win(); api.end(S.hearts >= 3 ? 3 : S.hearts === 2 ? 2 : 1, `기기 ${deck.length}개 중 ${deck.length - S.miss}개를 알맞게 넣었어요. 점수 ${S.score}`); };
  const send = k => {
    if (!S.cur || S.fly || MG.ended) return;
    const c = S.cur, bin = DET_BINS.find(b => b[0] === k); S.fly = {c, k, bx:bin[3], t:0}; S.cur = null; SFX.whoosh();
  };
  const judge = (c, k) => {
    const ok = k && c.d.props.includes(k), bin = DET_BINS.find(b => b[0] === k);
    if (ok){ S.combo++; const pts = 10 * S.combo; S.score += pts; fxBurst(bin[3], 1.0, -.2, 26); fxPop(bin[3], 1.6, -.2, `+${pts}`, '#ffd23f', 26); SFX.combo(S.combo); if (S.combo >= 3) fxBanner(`콤보 x${S.combo}!`, '#ffd23f', .9); api.say(`✓ ${esc(c.d.name)}: ${c.d.props.map(p => `<b>${PROPS[p].short}</b>`).join(' · ')} — ${esc(c.d.desc)}`, 'ok'); }
    else { S.miss++; S.hearts--; S.combo = 0; SFX.buzz(); fxShake(.15); fxFlash('#ff5040', .16); api.say(`✗ ${k ? '아쉬워요.' : '땅에 떨어졌어요!'} ${esc(c.d.name)}: ${c.d.props.map(p => `<b>${PROPS[p].short}</b>`).join(' · ')} — ${esc(c.d.desc)}`, 'bad'); }
    S.i++; S.wait = ok ? .6 : 1.8;
    if (S.hearts <= 0){ MG.loopFn = null; api.after(800, () => api.end(0, `❤️를 모두 잃었어요. 기기마다 쓰는 성질을 다시 살펴봐요.`)); }
  };
  api.bot(DET_BINS.map((b, i) => `<button class="btn big" data-k="${b[0]}">${b[1]} ${b[2]} <kbd>${i + 1}</kbd></button>`).join('')).querySelectorAll('[data-k]').forEach(btn => btn.onclick = () => send(btn.dataset.k));
  api.keys(e => { const m = e.code.match(/^(?:Digit|Numpad)([1-3])$/); if (m) send(DET_BINS[+m[1] - 1][0]); });
  api.pointer({down:(sx, sy) => { const hit = api.pick(DET_BINS.map(b => ({k:b[0], x:b[3], y:.5, z:-.2, r:1.1})), sx, sy); if (hit) send(hit.k); }});
  api.scene({cam:{x:0, y:2.0, z:-1.2, w:11, h:4.8, pitch:.22},
    draw(t){
      classDraw3(t);
      for (const [k, ic, , x, col] of DET_BINS){ D3('pbin' + k, b => mkPropBin3(b, col), x, 0, -.2); spr3(x, 1.25, -.2, ic, .32); }
      const c = S.cur; if (c) sprAdd(ST.x + c.x, ST.y + c.y, ST.z + c.z, iconBadge('dev', c.d.icon), .55);
      if (S.fly){ const f = S.fly, a = ease3(f.t); sprAdd(ST.x + lerp(f.c.x, f.bx, a), ST.y + lerp(f.c.y, .6, a) + Math.sin(a * Math.PI) * .5, ST.z + lerp(f.c.z, -.2, a), iconBadge('dev', f.c.d.icon), .55 * (1 - a * .4)); }
    },
    overlay(){
      for (const [, , name, x] of DET_BINS) tag3(x, .95, .45, name, {size:14});
      const c = S.cur; if (c){ tag3(c.x, c.y + .7, c.z, c.d.name, {size:16, border:'#ffd23f'}); const g = P3(c.x, .3, c.z); if (g.ok){ ctx.strokeStyle = 'rgba(255,90,70,.5)'; ctx.setLineDash([6, 6]); ctx.beginPath(); const p = P3(c.x, c.y - .4, c.z); ctx.moveTo(p.x, p.y); ctx.lineTo(g.x, g.y); ctx.stroke(); ctx.setLineDash([]); } }
    }});
  api.say('기기가 위에서 떨어져요! 바닥에 닿기 전에 그 기기가 쓰는 <b>전자석의 성질</b> 칸으로 보내요. 점점 빨라져요.');
  api.loop(dt => {
    if (S.fly){ S.fly.t += dt * 2.6; if (S.fly.t >= 1){ const f = S.fly; S.fly = null; judge(f.c, f.k); } }
    else if (S.cur){ S.cur.y -= S.cur.v * dt; if (S.cur.y <= .55){ const c = S.cur; S.cur = null; SFX.boom(); judge(c, null); } }
    else if (S.i < deck.length && S.hearts > 0){ S.wait -= dt; if (S.wait <= 0) spawn(); }
    else if (S.i >= deck.length && !MG.ended && S.hearts > 0) return finish();
    api.stat(`🗂️ ${Math.min(S.i + 1, deck.length)}/${deck.length} · ${heartsTxt(S.hearts, 3)} · ⭐ ${S.score}${S.combo >= 2 ? ` · 🔥 x${S.combo}` : ''}`);
  });
}
/* 3단계 · 공중 부양 제품: 목표 높이가 오르내리고 책이 늘어난다 */
function mkLevBase3(b, on){ BX(b, -.95, 0, -.55, .95, .32, .55, '#39424e'); BX(b, -.72, .32, -.38, .72, .4, .38, on ? '#ee9446' : '#c87533', on ? 2 : -1); BX(b, -.26, .4, -.16, .26, .47, .16, '#e5483a'); }
function mkBook3(b, col){ BX(b, -.78, 0, -.48, .78, .19, .48, col); BX(b, -.8, .02, -.46, -.76, .17, .46, '#f7f2e8'); }
function mkRuler3v(b){ BX(b, -.035, 0, -.035, .035, 2.6, .035, '#9aa3ad'); for (let k = 0; k <= 7; k++) BX(b, -.1, k * .367 - .01, -.02, .1, k * .367 + .01, .02, '#5b6573'); }
function det3S3(api){
  const S = {h:0, p:0, dir:0, t:24, inb:0, books:2, ev:[8, 16], el:0, streak:0, mid:155}, TB = .82, BASE = TB + .47, HALF = 35;
  const bot = api.bot(`<button class="btn big hold" id="lvDn">▼ 약하게 <kbd>↓</kbd></button><button class="btn primary big hold" id="lvUp">▲ 세게 <kbd>↑</kbd></button>`);
  api.holdBtn(bot.querySelector('#lvUp'), () => S.dir = 1, () => { if (S.dir > 0) S.dir = 0; });
  api.holdBtn(bot.querySelector('#lvDn'), () => S.dir = -1, () => { if (S.dir < 0) S.dir = 0; });
  const UP = ['ArrowUp', 'KeyW', 'Space'], DN = ['ArrowDown', 'KeyS'];
  api.keys(e => { if (UP.includes(e.code)) S.dir = 1; else if (DN.includes(e.code)) S.dir = -1; },
    e => { if ((UP.includes(e.code) && S.dir > 0) || (DN.includes(e.code) && S.dir < 0)) S.dir = 0; });
  const COLS = ['#3a8ee6', '#e2782b', '#25a862', '#c58bff', '#e5483a'];
  const inBand = () => S.h >= S.mid - HALF && S.h <= S.mid + HALF;
  api.scene({cam:{x:0, y:2.0, z:0, w:6.8, h:3.9, pitch:.2},
    draw(){
      D3('lab', mkLab3); D3('levdesk', b => mkDesk3(b, 2.8, 1.5, TB), 0, 0, 0); SH3(0, 0, 1.4);
      D3(S.p > .02 ? 'levOn' : 'lev', b => mkLevBase3(b, S.p > .02), 0, TB, 0);
      D3('ruler3v', mkRuler3v, -1.9, TB, 0);
      const yb = BASE + .06 + S.h / 150;
      D3('npl', b => BX(b, -.26, 0, -.16, .26, .07, .16, '#e5483a'), 0, yb - .07, 0);
      for (let k = 0; k < S.books; k++) drawM(M3('book' + k % 5, b => mkBook3(b, COLS[k % 5])), S3((k % 2) * .06, yb + k * .2, 0));
    },
    flats(U){
      fBox(U, -1.0, BASE + (S.mid - HALF) / 150, -.62, 1.0, BASE + (S.mid + HALF) / 150, .62, inBand() ? [.15, .8, .42, .24] : [.15, .66, .38, .12]);
      if (S.p > .02){ const ring = model('ringB', () => flatRing(.9, 1.0, [.25, .6, 1, 1])), top = BASE + S.h / 150;
        for (let k = 0; k < 3; k++){ const ph = (TIME * 1.2 + k / 3) % 1; flatDraw(U, ring, mMul(S3(0, BASE + .05 + (top - BASE) * ph, 0), mSC(.55 + S.p * .3, 1, .4 + S.p * .2)), [1, 1, 1, S.p * .55 * (1 - ph)]); } }
    },
    overlay(){
      tag3(-1.9, BASE + S.mid / 150, .3, '목표 높이', {col:'#8ff0b9', border:'#25a862'});
      tag3(1.45, TB + .2, .6, `전자석 세기 ${Math.round(S.p * 100)}%`, {col:'#8fd3ff'});
      tag3(1.45, BASE + S.h / 150 + S.books * .2 + .15, 0, `책 ${S.books}권`, {size:12});
    }});
  api.say('📰 뉴스 속 <b>공중 부양 제품</b>을 만들어요! <b>▲ 세게 · ▼ 약하게</b>로 책을 초록 칸에 띄워요. <b>초록 칸이 오르내리고</b> 책도 늘어나요!');
  api.loop(dt => {
    S.t -= dt; S.el += dt;
    if (S.ev.length && S.el >= S.ev[0]){ S.ev.shift(); S.books++; SFX.plop(); fxShake(.08); fxBanner('📚 책 추가!', '#ffd23f', .9, 38); api.say('📚 책을 한 권 더 얹었어요! 더 무거워졌으니 세기를 올려요.', 'bad'); }
    S.mid = 155 + (S.el > 4 ? Math.sin((S.el - 4) * .7) * 30 : 0);
    S.p = clamp(S.p + S.dir * .35 * dt, 0, 1);
    const heq = Math.max(0, S.p * 330 - (S.books - 2) * 55 + Math.sin(S.el * 1.7) * 10);
    S.h = clamp(S.h + (heq - S.h) * Math.min(1, dt * 2.2), 0, 330);
    if (inBand()){ S.inb += dt; S.streak += dt; if (S.streak >= 3){ S.streak = 0; fxPop(0, BASE + S.h / 150 + .9, 0, '유지 3초! 👍', '#8ff0b9', 22); SFX.ping(); } } else S.streak = 0;
    api.stat(`🎈 목표 높이에 있던 시간 ${S.inb.toFixed(1)}초 · ${mgClock(S.t)}`);
    if (S.t <= 0){ const r = S.inb / 24; if (r >= .55) SFX.win(); return api.end(r >= .7 ? 3 : r >= .5 ? 2 : r >= .32 ? 1 : 0, `24초 중 ${S.inb.toFixed(1)}초 동안 목표 높이에 띄웠어요.`, mgNoteBox('detect')); }
  });
}

/* ----- 게임에 3D 무대 붙이기: 2D 판은 그대로 두고, 3D가 되면 3D로 ----- */
function mg3Attach(id, scenes, starts){
  const d = mgDef(id); if (!d) return;
  const s2 = d.start;
  d.scene3 = st => scenes[st] ? scenes[st]() : null;
  d.start = (st, api) => (api.d3 && starts[st]) ? starts[st](api) : s2.call(d, st, api);
}
mg3Attach('mag', [() => mag1Scene(Object.assign(magInit3(0), {x:-1})), () => { const S = magInit3(1); S.orders = [9]; S.i = 0; return mag2Scene(S); }, () => { const S = magInit3(2); S.round = {k:'compass', want:1}; return mag3Scene(S); }], [mag3S1, mag3S2, mag3S3]);
mg3Attach('detect', [() => ({cam:{x:0, y:1.6, z:-2.6, w:17.4, h:4.6, pitch:.36}, draw:classDraw3}), () => ({cam:{x:0, y:2.0, z:-1.2, w:11, h:4.8, pitch:.22}, draw:classDraw3}),
  () => ({cam:{x:0, y:2.0, z:0, w:6.8, h:3.9, pitch:.2}, draw(){ D3('lab', mkLab3); D3('levdesk', b => mkDesk3(b, 2.8, 1.5, .82), 0, 0, 0); D3('lev', b => mkLevBase3(b, false), 0, .82, 0); D3('ruler3v', mkRuler3v, -1.9, .82, 0); }})],
  [det3S1, det3S2, det3S3]);
