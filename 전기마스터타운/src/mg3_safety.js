/* =========================================================
   6-5. 전기 안전 단원 게임의 3D 무대
   · 우리 집 안전 탐정: 블록 거실 · 부엌과 욕실 (장면을 눌러 판단) · 에너지 라벨 마트
   · 로봇 훈련소: AI 연구소 — 고른 문장 카드가 로봇 앞 칸으로 날아간다
   ========================================================= */
const hsl3 = (h, s, l) => { const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return [f(0), f(8), f(4)]; };

/* ----- 거실 ----- */
function mkLiving3(b){
  mkRoom3(b, {w:18, d:6, h:4.2, wallCol:'#f6ecd9'});
  mkWindow3(b, -7.4, 1.4, -4.6, 3.2, -6, '#a9dcf7');
  BX(b, -.03, 3.72, -3.03, .03, 4.2, -2.97, '#c9b77a'); BX(b, -.75, 3.56, -3.4, .75, 3.72, -2.6, '#fffbe2'); BX(b, -.65, 3.5, -3.3, .65, 3.56, -2.7, '#fff3a0', 3);
  BX(b, 1.3, 0, -6, 4.3, .72, -5.25, '#8a6a48'); BX(b, 1.35, .72, -5.95, 4.25, .76, -5.3, '#6b4f33');
  BX(b, 1.6, .8, -5.95, 4.0, 2.2, -5.78, '#1c2733'); BX(b, 2.7, .72, -5.9, 2.9, .82, -5.8, '#5b6573');
  BX(b, 5.6, 2.95, -6, 7.4, 3.45, -5.62, '#fbfcfd'); BX(b, 5.75, 2.99, -5.64, 7.25, 3.05, -5.6, '#c9d4de'); BX(b, 5.72, 3.3, -5.63, 5.8, 3.36, -5.6, '#25a862', 2);
  BX(b, -4, 0, -4.8, 1, .02, -2.8, '#e8c9a0');
  BX(b, -3.4, 0, -2.6, .4, .45, -1.55, '#5b8bd0'); BX(b, -3.4, .45, -1.8, .4, 1.05, -1.55, '#4f7fc4'); BX(b, -3.6, 0, -2.6, -3.4, .75, -1.55, '#4f7fc4'); BX(b, .4, 0, -2.6, .6, .75, -1.55, '#4f7fc4');
  const tx = 6.6, tz = -1.2;
  BX(b, tx - .62, .66, tz - .42, tx + .62, .72, tz + .42, '#c89b5e'); for (const x of [-.54, .54]) for (const z of [-.34, .34]) BX(b, tx + x - .04, 0, tz + z - .04, tx + x + .04, .66, tz + z + .04, '#8f6a3a');
  BX(b, tx - .15, .72, tz - .15, tx + .15, .78, tz + .15, '#39424e'); BX(b, tx - .03, .78, tz - .03, tx + .03, 1.32, tz + .03, '#39424e');
  BX(b, tx - .28, 1.3, tz - .2, tx + .28, 1.45, tz + .2, '#39424e'); BX(b, tx - .2, 1.26, tz - .14, tx + .2, 1.3, tz + .14, '#fffbe0', 3);
  const px = 1.3; BX(b, px, 0, -.38, px + 1.8, .14, -.06, '#f4f6f8'); BX(b, px + 1.62, .14, -.28, px + 1.72, .17, -.18, '#e5483a', 2);
  for (let i = 0; i < 5; i++){ const x = px + .2 + i * .33; BX(b, x - .1, .14, -.34, x + .1, .34, -.12, '#3a4048'); }
  for (const [x, z1] of [[1.5, -5.3], [2.16, -5.3], [2.82, -5.3]]) BX(b, x - .02, 0, z1, x + .02, .04, -.34, '#2b2f36');
  BX(b, -3.6, 0, -.24, px, .04, -.2, '#2b2f36'); BX(b, px + 1.8, 0, -.26, 6.1, .04, -.22, '#2b2f36');
}
function livingDraw3(t){
  D3('living', mkLiving3);
  D3('outC', b => mkOutlet3(b, true), .9, .5, -5.99); D3('outB', b => mkOutlet3(b, false), -8.99, .5, -4.2, Math.PI / 2);
  spr3(-6, 2.75, -5.85, '☀️', .38); spr3(-7.9, .45, -3.45, '👶', .42); spr3(-7.45, .32, -2.85, '🧸', .3); spr3(2.8, 1.5, -5.62, '🎵', .3);
  sprAdd(ST.x + 7.78, ST.y + 3.2, ST.z - 5.68, elabel3(1), .3);
}
function livingFlats3(U){
  const c = hsl3((TIME * 40) % 360, .7, .55); fBox(U, 1.7, .9, -5.777, 3.9, 2.1, -5.772, [c[0], c[1], c[2], 1]);
  fBox(U, -7.4, .02, -5.9, -4.0, .04, -2.0, [1, .93, .6, .22]);
  fBox(U, -1.3, .03, -3.9, 1.3, 3.5, -2.1, [1, .96, .7, .06]);
  fBox(U, 1.25, .14, -.44, 3.15, .52, -.02, [1, .3, .2, .1 + Math.max(0, Math.sin(TIME * 7)) * .12]);
}
/* ----- 부엌 · 욕실 ----- */
function mkKitchen3(b){
  mkRoom3(b, {w:18, d:6, h:4.2, wallCol:'#eef4ea'});
  for (let x = .75; x < 9; x += .5) for (let y = 0; y < 4.2; y += .5) BX(b, x, y, -5.99, Math.min(9, x + .48), Math.min(4.2, y + .48), -5.97, ((x * 2 + y * 2) | 0) % 2 ? '#e4eff9' : '#d6e7f5');
  for (let x = .75; x < 9; x += .5) for (let z = -6; z < 2; z += .5) BX(b, x, 0, z, Math.min(9, x + .48), .012, z + .48, ((x * 2 + z * 2) | 0) % 2 ? '#dfeaf3' : '#cddde9');
  BX(b, .45, 0, -6, .75, 4.2, -3.4, '#d8c8a8');
  BX(b, -8.6, 0, -6, -8.48, 2.4, -5.0, '#e9eef3'); BX(b, -7.32, 0, -6, -7.2, 2.4, -5.0, '#e9eef3'); BX(b, -8.6, 2.28, -6, -7.2, 2.4, -5.0, '#e9eef3');
  BX(b, -8.6, 0, -6, -7.2, .12, -5.0, '#e9eef3'); BX(b, -8.48, .12, -5.98, -7.32, 2.28, -5.92, '#d5ecf8', 2);
  for (const y of [.8, 1.5]) BX(b, -8.48, y, -5.92, -7.32, y + .03, -5.1, '#b5cfdf');
  BX(b, -8.3, .83, -5.6, -8.05, 1.3, -5.35, '#ffffff'); BX(b, -7.8, .83, -5.6, -7.55, 1.08, -5.38, '#e5483a');
  BX(b, -8.3, 1.53, -5.65, -8.0, 1.85, -5.4, '#f29a38'); BX(b, -7.8, 1.53, -5.6, -7.5, 1.66, -5.35, '#f4ead2');
  BX(b, -6.6, 0, -6, -.2, .95, -5.2, '#cdb48a'); BX(b, -6.7, .95, -6, -.1, 1.02, -5.15, '#b9a27a');
  for (let x = -6.4; x < -.3; x += 1.2) BX(b, x + .55, .3, -5.19, x + .65, .6, -5.17, '#8f7a55');
  const kx = -4.85; BX(b, kx - .22, 1.02, -5.78, kx + .22, 1.44, -5.42, '#dfe5ea'); BX(b, kx - .26, 1.42, -5.82, kx + .26, 1.47, -5.38, '#6f7b88'); BX(b, kx + .22, 1.12, -5.62, kx + .34, 1.32, -5.56, '#6f7b88');
  BX(b, kx + .3, 1.03, -5.75, -4.32, 1.07, -5.71, '#2b2f36'); BX(b, -4.16, 1.03, -5.75, -3.95, 1.07, -5.71, '#2b2f36'); BX(b, -3.97, 1.03, -5.98, -3.93, 1.38, -5.94, '#2b2f36');
  BX(b, -4.32, 1.035, -5.745, -4.16, 1.065, -5.715, '#e2782b', 3);
  BX(b, -2.3, 1.02, -5.75, -1.7, 1.34, -5.38, '#c9ced6'); BX(b, -2.2, 1.34, -5.65, -1.8, 1.35, -5.6, '#5b6573'); BX(b, -2.2, 1.34, -5.52, -1.8, 1.35, -5.47, '#5b6573');
  BX(b, -1.7, 1.08, -5.6, -1.5, 1.12, -5.56, '#2b2f36'); BX(b, -1.5, 1.1, -5.62, -1.3, 1.45, -5.58, '#2b2f36');
  BX(b, -2.98, 2.0, -5.95, -2.82, 2.22, -5.81, '#ffffff'); BX(b, -2.92, 1.68, -5.86, -2.88, 2.0, -5.83, '#f4f6f8'); BX(b, -2.94, 1.6, -5.87, -2.86, 1.68, -5.82, '#9aa3ad');
  BX(b, 2.25, 0, -5.9, 2.55, .8, -5.6, '#eef3f8'); BX(b, 1.8, .8, -6, 3.0, 1.0, -5.2, '#f7fbff'); BX(b, 1.9, .96, -5.9, 2.9, 1.0, -5.3, '#cfe3f2');
  BX(b, 2.35, 1.0, -5.95, 2.45, 1.25, -5.85, '#9aa3ad'); BX(b, 2.35, 1.2, -5.95, 2.45, 1.25, -5.7, '#9aa3ad');
  BX(b, 1.8, 1.6, -6, 3.0, 2.8, -5.95, '#d8eefc', 2); BX(b, 1.74, 1.54, -6, 3.06, 1.6, -5.93, '#9aa3ad'); BX(b, 1.74, 2.8, -6, 3.06, 2.86, -5.93, '#9aa3ad');
  BX(b, 1.55, 1.1, -5.62, 1.95, 1.3, -5.42, '#e05a8a'); BX(b, 1.62, .82, -5.58, 1.76, 1.1, -5.46, '#c4416f'); BX(b, 1.3, 1.18, -5.95, 1.55, 1.22, -5.5, '#2b2f36');
  BX(b, 5.05, .3, -5.97, 5.09, 1.12, -5.93, '#2b2f36');
  BX(b, 6.0, 0, -6, 7.4, 1.4, -5.0, '#f4f6f8'); BX(b, 6.0, 1.22, -5.02, 7.4, 1.4, -4.98, '#c9d4de'); BX(b, 7.05, 1.27, -4.98, 7.25, 1.33, -4.97, '#e5483a', 2);
  BX(b, 6.35, .28, -5.0, 7.05, .98, -4.96, '#4f8fd6'); BX(b, 6.47, .4, -4.96, 6.93, .86, -4.95, '#9cc7ee', 2);
}
function kitchenDraw3(t){
  D3('kitchen', mkKitchen3);
  drawM(M3('fdoor', b => { BX(b, -1.4, 0, 0, 0, 2.4, .12, '#f4f7fa'); BX(b, -1.32, .1, .12, -.1, 2.3, .2, '#e9eef3'); BX(b, -1.28, .6, .2, -.14, .66, .3, '#b5cfdf'); BX(b, -1.28, 1.4, .2, -.14, 1.46, .3, '#b5cfdf'); }), S3(-7.2, 0, -5.0, 1.87));
  mkPersonAt('kidSun', -6.3, -3.9, -Math.PI / 2 + .3);
  spr3(-6.35, 2.55, -3.9, '🤔', .32);
  for (const [k, x, y] of [['outK1', -3.9, 1.5], ['outK2', -1.2, 1.5], ['outK3', -2.9, 2.2], ['outB1', 1.15, 1.35], ['outB2', 5.0, 1.3]]) D3(k, b => mkOutlet3(b, false), x, y, -5.99);
  D3('plugK', mkPlug3, -1.2, 1.5, -5.86); D3('plugB', mkPlug3, 5.0, 1.3, -5.84);
  if (Math.sin(t * 9) > .1) spr3(-4.22, 1.2, -5.65, '✨', .2);
  spr3(-1.55, 1.36, -5.5, '✊', .26); spr3(1.4, 1.32, -5.55, '🤚', .3); spr3(5.22, 1.3, -5.6, '🤏', .26);
  for (let i = 0; i < 3; i++){ const o = (t * 1.3 + i / 3) % 1; spr3(1.3 + i * .12, 1.15 - o * .5, -5.5, '💧', .13); }
  spr3(2.4, 1.15 - ((t * 1.6) % 1) * .12, -5.7, '💧', .1);
  sprAdd(ST.x + 7.62, ST.y + 1.15, ST.z - 4.95, elabel3(1), .3);
}
function kitchenFlats3(U){
  for (let i = 0; i < 4; i++){ const o = (TIME * .5 + i * .25) % 1; fBox(U, -8.4 + o * .8, .1 + i * .45, -4.9 + o * 1.4, -7.6 + o * 1.0, .4 + i * .45, -4.6 + o * 1.4, [.75, .9, 1, .22 * (1 - o)]); }
}
const HOME3 = [
  {draw:livingDraw3, flats:livingFlats3, cam:{x:0, y:1.75, z:-2.7, w:18.6, h:4.6, pitch:.4}, light:(add) => { add(0, 3.3, -3, 10, [1, .95, .7]); add(2.8, 1.5, -4.9, 6, [.6, .7, 1]); },
    pos:{light:[0, 3.6, -3.0, .75], tv:[2.8, 1.5, -5.7, .95], ac:[6.5, 3.2, -5.7, .7], strip:[2.2, .3, -.2, .75], bare:[-8.85, .5, -4.2, .45], cover:[.9, .5, -5.9, .42], led:[6.6, 1.35, -1.2, .5]}},
  {draw:kitchenDraw3, flats:kitchenFlats3, cam:{x:-.6, y:1.5, z:-4.4, w:17.6, h:3.4, pitch:.3}, light:(add) => { add(-7.9, 1.4, -5.2, 6, [.7, .9, 1]); },
    pos:{fridge:[-7.6, 1.2, -4.9, .95], fray:[-4.24, 1.12, -5.72, .36], pull:[-1.55, 1.35, -5.6, .42], charger:[-2.9, 2.12, -5.88, .36], wet:[1.4, 1.32, -5.7, .46], head:[5.15, 1.3, -5.7, .42], washer:[6.7, .75, -4.95, .75]}},
];
function home3Spots(k){ return HOME_ROOMS[k].spots.map(s => { const p = HOME3[k].pos[s.id]; return Object.assign({}, s, {x:p[0], y:p[1], z:p[2], r:p[3]}); }); }
function home3Scene(k, S){
  const H = HOME3[k], spots = S ? S.spots : home3Spots(k);
  return {cam:H.cam, draw:H.draw, flats:H.flats, lights:H.light,
    overlay(){
      if (k === 0) tag3(7.0, 1.6, -.9, 'LED', {bg:'#25a862', size:11});
      if (!S) return;
      for (const sp of spots){
        const d = S.done[sp.id];
        if (d){ const L = LABELS[sp.label]; mark3(sp.x, sp.y + sp.r * .7 + .15, sp.z, d === 'ok'); tag3(sp.x, sp.y - sp.r * .5 - .1, sp.z + .1, `${L.icon} ${L.name}`, {bg:d === 'ok' ? '#123d27' : '#43181a', border:L.color, size:12}); }
        else if (S.open === sp) tag3(sp.x, sp.y + sp.r * .7 + .2, sp.z, '🔍', {bg:'#ffd23f', col:'#1c2733', size:14});
        else if (S.el > 20){ const p = P3(sp.x, sp.y + sp.r * .6, sp.z); if (p.ok) mg3Tag(p.x + 14, p.y - 14 - Math.abs(Math.sin(S.el * 4)) * 4, '?', {bg:'#ffd23f', col:'#1c2733', size:14}); }
        const ht = S.heat ? S.heat[sp.id] || 0 : 0;
        if (!d && ht >= .45){ const p = P3(sp.x, sp.y + sp.r + .25, sp.z); if (p.ok){ const w = 54, k = clamp(ht, 0, 1); ctx.fillStyle = 'rgba(21,32,43,.85)'; rr(ctx, p.x - w / 2 - 3, p.y - 9, w + 6, 18, 8); ctx.fill(); ctx.fillStyle = k > .8 && Math.sin(TIME * 18) > 0 ? '#ffd23f' : '#ff5a3a'; rr(ctx, p.x - w / 2, p.y - 6, w * k, 12, 6); ctx.fill(); mg3Tag(p.x, p.y - 20, '🔥 위험!', {bg:'rgba(0,0,0,0)', col:'#ff8a80', size:12}); } }
      }
    }};
}
function home3Room(api, k){
  const R = HOME_ROOMS[k], S = {t:75, el:0, hearts:3, miss:0, done:{}, open:null, spots:home3Spots(k), heat:{}, bill:0, last:-9, combo:0, sparkT:0};
  api.scene(home3Scene(k, S)); MG.dbg = S;
  api.say(`${R.name}에서 전기를 쓰는 장면을 눌러 살펴봐요. <b>✅ 바른 사용 · ⚠️ 위험 · 💸 낭비</b> 중 하나로 판단해요. 위험한 곳을 내버려 두면 <b>불이 나고</b>, 낭비하는 곳은 <b>전기 요금</b>이 올라가요!`);
  const choose = lab => {
    const sp = S.open; if (!sp || MG.ended) return;
    api.pop(); S.open = null;
    const ok = lab === sp.label, L = LABELS[sp.label]; S.done[sp.id] = ok ? 'ok' : 'bad';
    if (ok){
      S.combo = S.el - S.last <= 6 ? S.combo + 1 : 1; S.last = S.el;
      fxBurst(sp.x, sp.y, sp.z, 24, sp.label === 'danger' ? ['#ff8a80', '#ffd23f', '#ffffff'] : sp.label === 'waste' ? ['#ffd38a', '#ffd23f'] : ['#8ff0b9', '#ffd23f']);
      fxPop(sp.x, sp.y + .7, sp.z, sp.label === 'danger' ? '위험 막았다!' : sp.label === 'waste' ? '낭비 멈춤!' : '잘 쓰고 있어요!', L.color === '#25a862' ? '#8ff0b9' : L.color, 22);
      if (S.combo >= 2){ fxBanner(`콤보 x${S.combo}!`, '#ffd23f', .9); SFX.combo(S.combo); } else SFX.ping();
      SND.ok(); api.say(`✓ <b>${L.icon} ${L.name}</b> — ${sp.why}`, 'ok');
    }
    else { S.miss++; S.hearts--; S.combo = 0; SFX.buzz(); fxShake(.14); fxFlash('#ff5040', .16); api.say(`✗ 이 장면은 <b>${L.icon} ${L.name}</b>이에요. ${sp.why}`, 'bad'); }
  };
  api.pointer({down:(sx, sy) => {
    if (MG.ended) return;
    if (S.open){ api.pop(); S.open = null; }
    const hit = api.pick(S.spots.filter(s => !S.done[s.id]), sx, sy); if (!hit) return;
    S.open = hit; SND.tick();
    const p = P3(hit.x, hit.y, hit.z);
    const el = api.popAt(p.x, p.y, `<p>🔍 ${esc(hit.cap)}</p><div class="pop-row">${LABEL_KEYS.map((l, i) => `<button class="btn small pop-${l}" data-l="${l}">${LABELS[l].icon} ${LABELS[l].name} <kbd>${i + 1}</kbd></button>`).join('')}</div>`);
    el.querySelectorAll('[data-l]').forEach(b => b.onclick = e => { e.stopPropagation(); choose(b.dataset.l); });
  }});
  api.keys(e => { const l = {Digit1:'good', Digit2:'danger', Digit3:'waste', Numpad1:'good', Numpad2:'danger', Numpad3:'waste'}[e.code]; if (l && S.open) choose(l); });
  api.loop(dt => {
    S.t -= dt; S.el += dt; S.sparkT -= dt;
    let waste = 0;
    for (const sp of S.spots){
      if (S.done[sp.id]) continue;
      if (sp.label === 'waste') waste++;
      if (sp.label !== 'danger') continue;
      const h = S.heat[sp.id] = (S.heat[sp.id] || 0) + dt / 26;
      if (h >= .5 && S.sparkT <= 0) fxBurst(sp.x, sp.y, sp.z, 5 + Math.round(h * 8), ['#ff8a3a', '#ffd23f'], .9 + h, .05);
      if (h >= 1){
        S.done[sp.id] = 'bad'; S.hearts--; S.miss++; S.combo = 0;
        if (S.open === sp){ api.pop(); S.open = null; }
        fxBanner('불이 났어요! 🔥', '#ff8a80', 1.2, 44); SFX.boom(); fxShake(.26); fxFlash('#ff6a30', .32); fxBurst(sp.x, sp.y, sp.z, 40, ['#ff5a3a', '#ffd23f', '#555555'], 2.2, .09);
        api.say(`🔥 ${esc(sp.cap)} — ${sp.why}`, 'bad');
      }
    }
    if (S.sparkT <= 0) S.sparkT = .35;
    S.bill += dt * 85 * waste;
    const n = Object.keys(S.done).length;
    api.stat(`🔍 ${n}/${R.spots.length} · ${heartsTxt(S.hearts, 3)} · 💸 새는 전기 ${won(Math.round(S.bill / 10) * 10)}원${S.combo >= 2 ? ` · 🔥 x${S.combo}` : ''} · ${mgClock(S.t)}`);
    if (S.hearts <= 0) return api.end(0, '❤️를 모두 잃었어요. 설명을 떠올리며 다시 해 봐요.', homeSummary(R, S));
    if (n >= R.spots.length){ if (S.miss === 0) SFX.win(); return api.end(S.miss === 0 && S.el <= 50 ? 3 : S.miss <= 1 ? 2 : 1, `${R.name}의 장면 ${n}곳을 모두 판단했어요. 틀린 판단 ${S.miss}번 · ${Math.round(S.el)}초 · 새어 나간 전기 ${won(Math.round(S.bill / 10) * 10)}원`, homeSummary(R, S)); }
    if (S.t <= 0) return api.end(n >= 5 ? 1 : 0, `시간이 끝났어요. ${n}곳을 판단했어요.`, homeSummary(R, S));
  });
}
/* ----- 에너지 라벨 마트 (카드는 글 창, 뒤로 블록 마트) ----- */
function mkMart3(b){
  mkRoom3(b, {w:18, d:5, h:4.2, wallCol:'#f3f6f9', floor:TX.walk});
  BX(b, -8.4, 0, -5, 8.4, .1, -3.6, '#9aa3ad');
  for (let i = 0; i < 4; i++){ const x = -7.6 + i * 1.6; BX(b, x - .6, .1, -4.9, x + .6, 2.5, -3.9, '#f4f7fa'); BX(b, x - .56, .2, -3.9, x + .56, 2.4, -3.86, '#e9eef3'); BX(b, x + .4, 1.0, -3.86, x + .48, 1.7, -3.8, '#9aa3ad'); }
  for (let i = 0; i < 3; i++){ const x = 1.2 + i * 1.5; BX(b, x - .6, .1, -4.9, x + .6, 1.3, -3.9, '#f4f6f8'); BX(b, x - .3, .4, -3.9, x + .3, 1.0, -3.86, '#4f8fd6'); }
  BX(b, 5.6, 0, -5, 8.6, 2.2, -4.5, '#8f6a3a'); for (const y of [.7, 1.4, 2.1]) BX(b, 5.6, y, -5, 8.6, y + .06, -4.2, '#b07a45');
  for (let i = 0; i < 6; i++){ const x = 5.9 + i * .45, y = .76 + (i % 3) * .7; BX(b, x, y, -4.7, x + .2, y + .3, -4.5, '#fffbe0', 2); }
  BX(b, -3, 3.2, -5, 3, 3.9, -4.92, '#e5483a');
}
function martDraw3(){
  D3('mart', mkMart3);
  [1, 3, 5, 1].forEach((g, i) => sprAdd(ST.x - 7.6 + i * 1.6, ST.y + 2.85, ST.z - 3.8, elabel3(g), .34));
  [1, 3, 5].forEach((g, i) => sprAdd(ST.x + 1.2 + i * 1.5, ST.y + 1.65, ST.z - 3.8, elabel3(g), .3));
}
const MART3_SCENE = () => ({cam:{x:0, y:1.6, z:-2.4, w:18, h:4.6, pitch:.3}, draw:martDraw3, overlay(){ tag3(0, 3.55, -4.85, '에너지 라벨 마트', {bg:'rgba(0,0,0,0)', col:'#fff', size:20}); }});
mg3Attach('home', [() => home3Scene(0), () => home3Scene(1), MART3_SCENE], [api => home3Room(api, 0), api => home3Room(api, 1), null]);

/* ===== 🤖 로봇 훈련소: AI 연구소 ===== */
const ROBO3 = {count:{}, fly:[], think:0, bins:['good', 'danger', 'waste', 'trash'], belt:{p:0, on:false}};
const ROBO3_BIN = {good:[-3.3, '#25a862', '✅'], danger:[-1.1, '#e5483a', '⚠️'], waste:[1.1, '#ee9a1c', '💸'], trash:[3.3, '#7d8691', '🗑️']};
function mkAiLab3(b){
  mkRoom3(b, {w:18, d:5, h:4.4, wallCol:'#e9eef5'});
  for (const x of [-6.2, -2.0, 2.2]){ BX(b, x, 1.8, -5, x + 3.6, 3.6, -4.94, '#1c2733'); BX(b, x + .12, 1.92, -4.94, x + 3.48, 3.48, -4.92, '#3a8ee6', 2); }
  for (const x of [6.4, 7.6]){ BX(b, x - .5, 0, -5, x + .5, 2.6, -4.2, '#2b323b'); for (let y = .3; y < 2.5; y += .35) BX(b, x - .4, y, -4.2, x + .4, y + .05, -4.18, '#3ee0ff', 2); }
  BX(b, -8.4, 0, -5, -6.4, .9, -4.2, '#4a5563'); BX(b, -8.3, .9, -4.9, -6.5, 1.2, -4.4, '#9aa3ad');
}
function mkBin3c(b, col){ BX(b, -.75, 0, -.5, .75, .08, .5, col); BX(b, -.75, 0, -.5, .75, .7, -.42, col); BX(b, -.75, 0, .42, .75, .7, .5, col); BX(b, -.75, 0, -.5, -.67, .7, .5, col); BX(b, .67, 0, -.5, .75, .7, .5, col); BX(b, -.77, .62, .5, .77, .7, .53, '#ffffff'); }
function robo3Scene(){
  return {cam:{x:0, y:1.3, z:-1.8, w:11.5, h:6.2, pitch:.3, sy:-.36},
    draw(t, dt){
      D3('ailab', mkAiLab3);
      const bob = ROBO3.think > 0 ? Math.abs(Math.sin(t * 9)) * .12 : Math.sin(t * 2) * .03;
      robot3(ST.x, ST.y + bob, ST.z - 3.0, 0, t, 1.6); SH3(0, -3.0, .9);
      if (ROBO3.think > 0){ ROBO3.think -= dt || 0; spr3(0, 3.4 + Math.sin(t * 6) * .05, -3.0, '💡', .32); }
      for (const k of ROBO3.bins){ const [x, col, ic] = ROBO3_BIN[k]; D3('bin3' + k, b => mkBin3c(b, col), x, 0, -1.2); SH3(x, -1.2, .9); spr3(x, 1.25, -1.2, ic, .26); }
      D3('belt3', b => { BX(b, -5.6, .9, -2.35, 5.6, 1.02, -1.85, '#2b323b'); for (let x = -5.4; x <= 5.41; x += .6) BX(b, x - .04, .95, -2.38, x + .04, 1.03, -1.82, '#5b6573'); for (const x of [-5.3, 0, 5.3]) BX(b, x - .06, 0, -2.2, x + .06, .9, -2.0, '#39424e'); });
      const CARD = b => { BX(b, -.32, 0, -.22, .32, .03, .22, '#fffdf4'); BX(b, -.24, .03, -.12, .2, .035, -.07, '#5a6878'); BX(b, -.24, .03, .02, .1, .035, .07, '#5a6878'); };
      if (ROBO3.belt.on){ const bx = lerp(-5.2, 4.6, ROBO3.belt.p); D3('card3', CARD, bx, 1.04, -2.1, 0); if (ROBO3.belt.p > .75 && Math.sin(t * 16) > 0) spr3(bx, 1.5, -2.1, '⏰', .2); }
      for (const f of ROBO3.fly){ f.t += (dt || 0) * 1.8; const [x] = ROBO3_BIN[f.bin], a = ease3(f.t); D3('card3', CARD, lerp(f.sx, x, a), lerp(1.06, .3, a) + Math.sin(a * Math.PI) * .9, lerp(-2.1, -1.2, a), a * 3); }
      ROBO3.fly = ROBO3.fly.filter(f => f.t < 1);
    },
    overlay(){ for (const k of ROBO3.bins){ const n = ROBO3.count[k]; if (n) tag3(ROBO3_BIN[k][0], .95, -.6, `${n}장`, {size:12}); } }};
}
function robo3Reset(){ ROBO3.count = {}; ROBO3.fly = []; ROBO3.think = 0; ROBO3.belt = {p:0, on:false}; }
function robo3Pick(b){
  if (!MGAPI.d3) return;
  const sx = lerp(-5.2, 4.6, ROBO3.belt.p); ROBO3.belt.on = false;
  if (ROBO3_BIN[b]){ ROBO3.count[b] = (ROBO3.count[b] || 0) + 1; ROBO3.fly.push({bin:b, t:0, sx}); SFX.whoosh(); fxPop(ROBO3_BIN[b][0], 1.6, -1.2, `${ROBO3_BIN[b][2]} +1`, '#ffffff', 18); }
  else if (b === 'none'){ SFX.buzz(); fxPop(4.6, 1.6, -2.1, '시간 초과!', '#ff8a80', 20); }
}
mg3Attach('robot', [robo3Scene, robo3Scene, robo3Scene], [null, null, null]);
