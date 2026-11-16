/* =========================================================
   4. 실험실·크레인·AI 연구소 (의사결정트리 / 분류 학습)
   ========================================================= */

/* ---------- 4-1. 전자석 실험실 ---------- */
const EXP_CARDS = [
  {n:1, q:'스위치를 열어 전기를 끊으면, 전자석에 붙어 있던 클립은 어떻게 될까요?', opts:['그대로 붙어 있다', '떨어진다', '더 많이 붙는다'], ans:1,
   how:'클립 보기에서 스위치를 닫았다가(켜기) 다시 열어(끄기) 보세요.', result:'스위치를 끄자 클립이 모두 떨어졌어요.', prop:'전자석은 <b>전기가 흐를 때만 자석이 돼요.</b>'},
  {n:2, q:'전지를 1개에서 2개(직렬)로 늘리면 붙는 클립 수는 어떻게 될까요?', opts:['줄어든다', '똑같다', '늘어난다'], ans:2,
   how:'클립 보기에서 전지 1개로 켜 보고, 전지 2개로도 켜 보세요.', result:'전지 1개일 때 양쪽에 4개씩, 2개일 때 9개씩 붙었어요.', prop:'전자석은 <b>세기를 바꿀 수 있어요.</b> (전지를 직렬로 더 연결하면 세져요)'},
  {n:3, q:'전지의 방향을 반대로 바꾸면 나침반 바늘은 어떻게 될까요?', opts:['그대로다', '반대쪽을 가리킨다', '빙글빙글 계속 돈다'], ans:1,
   how:'나침반 보기에서 스위치를 켠 채로 전지 방향을 바꿔 보세요.', result:'전지 방향을 바꾸자 나침반 바늘이 반대쪽을 가리켰어요.', prop:'전자석은 <b>극의 방향을 바꿀 수 있어요.</b>'},
];
function openExperiment(){
  const st = {on:false, batt:1, dir:1, view:'clip', clipP:0, needle:-Math.PI / 2, seen:{}};
  const p = openPanel(`<h2>전자석 실험실</h2>
    <p class="sub">아래 카드에서 <b>예상을 먼저 고른 뒤</b> 장치를 조작해 확인해요. 세 카드를 모두 완성하면 미션 성공!</p>
    <div class="exp-wrap"><canvas id="expC" width="1280" height="700" aria-label="전자석 실험 장치"></canvas></div>
    <div class="exp-ctrl">
      <button class="btn primary" id="xSw">스위치 닫기 (켜기)</button>
      <button class="btn" id="xBat">전지 2개로 늘리기</button>
      <button class="btn" id="xDir">전지 방향 바꾸기</button>
      <button class="btn on" id="xV1">클립 보기</button><button class="btn" id="xV2">나침반 보기</button>
    </div>
    <div class="grid3" id="xCards"></div>`, {wide:true});
  const c = p.querySelector('#expC'), g = c.getContext('2d');
  const clips = {L:[], R:[]};
  for (let k = 0; k < 14; k++){ clips.L.push([170 + (hash2(k, 1, 5) - .5) * 70, 322 + hash2(k, 2, 5) * 22]); clips.R.push([470 + (hash2(k, 3, 5) - .5) * 70, 322 + hash2(k, 4, 5) * 22]); }
  const renderCards = () => {
    const obs = {1:!!st.seen.ex1, 2:!!(st.seen.b1 && st.seen.b2), 3:!!(st.seen.dA && st.seen.dB)};
    p.querySelector('#xCards').innerHTML = EXP_CARDS.map(cd => {
      const s = SAVE.exp[cd.n] || {}; const done = s.done;
      const pred = s.pred;
      let res = '';
      if (done) res = `<div class="result">관찰: ${cd.result}<br>→ ${cd.prop}<br>내 예상: ${cd.opts[pred]} — ${pred === cd.ans ? '예상과 같았어요!' : '예상과 달랐어요. 왜 그럴까요?'}</div>`;
      else if (obs[cd.n]) res = `<div class="result"><b>관찰 완료!</b> 예상을 골라야 결과가 열려요.</div>`;
      else res = `<div class="result">${pred != null ? '이제 확인해요: ' : ''}${cd.how}</div>`;
      return `<div class="exp-card ${done ? 'done' : ''}"><div class="q">${done ? '✅' : `실험 ${cd.n}`} · ${cd.q}</div>
        ${cd.opts.map((o, i) => `<label><input type="radio" name="xp${cd.n}" value="${i}" ${pred === i ? 'checked' : ''} ${done ? 'disabled' : ''}> ${o}</label>`).join('')}${res}</div>`;
    }).join('');
    p.querySelectorAll('#xCards input').forEach(inp => inp.onchange = () => {
      const n = +inp.name.slice(2); SAVE.exp[n] = Object.assign(SAVE.exp[n] || {}, {pred:+inp.value}); persist(); check();
    });
  };
  const check = () => {
    const obs = {1:!!st.seen.ex1, 2:!!(st.seen.b1 && st.seen.b2), 3:!!(st.seen.dA && st.seen.dB)};
    let changed = false;
    for (const cd of EXP_CARDS){ const s = SAVE.exp[cd.n]; if (s && s.pred != null && obs[cd.n] && !s.done){ s.done = true; changed = true; SND.ok(); } }
    if (changed) persist();
    renderCards();
    if (EXP_CARDS.every(cd => SAVE.exp[cd.n] && SAVE.exp[cd.n].done) && !SAVE.badges.em1){
      SAVE.badges.em1 = true; persist(); toast('전자석 실험실 미션 성공! 세 가지 성질을 모두 찾았어요.', 'ok'); checkMasters();
    }
  };
  const observe = () => {
    if (st.view === 'clip' && st.on){ st.seen.clipOn = true; st.seen[st.batt === 1 ? 'b1' : 'b2'] = true; }
    if (st.view === 'compass' && st.on) st.seen[st.dir === 1 ? 'dA' : 'dB'] = true;
    check();
  };
  const sw = p.querySelector('#xSw'), bat = p.querySelector('#xBat'), dir = p.querySelector('#xDir');
  const labelSw = () => { sw.textContent = st.on ? '스위치 열기 (끄기)' : '스위치 닫기 (켜기)'; bat.textContent = st.batt === 1 ? '전지 2개로 늘리기' : '전지 1개로 줄이기'; };
  sw.onclick = () => { if (st.on && st.view === 'clip' && st.seen.clipOn) st.seen.ex1 = true; st.on = !st.on; SND.tick(); labelSw(); observe(); };
  bat.onclick = () => { st.batt = st.batt === 1 ? 2 : 1; SND.tick(); labelSw(); observe(); };
  dir.onclick = () => { st.dir *= -1; SND.tick(); observe(); };
  p.querySelector('#xV1').onclick = () => { st.view = 'clip'; p.querySelector('#xV1').classList.add('on'); p.querySelector('#xV2').classList.remove('on'); observe(); };
  p.querySelector('#xV2').onclick = () => { st.view = 'compass'; p.querySelector('#xV2').classList.add('on'); p.querySelector('#xV1').classList.remove('on'); observe(); };
  renderCards();
  let last = performance.now();
  const loop = now => {
    if (!document.body.contains(c)) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    st.clipP = clamp(st.clipP + (st.on ? 3 : -4) * dt, 0, 1);
    const target = st.on ? (st.dir === 1 ? Math.PI : 0) : -Math.PI / 2;
    let da = target - st.needle; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
    st.needle += da * Math.min(1, dt * 6);
    drawExp(g, c, st, clips, now / 1000);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
function drawBattery(g, x, y, w, h, dir){
  g.fillStyle = '#2b2f36'; rr(g, x, y, w, h, 5); g.fill();
  const plusLeft = dir === 1;
  g.fillStyle = '#d9a43a'; g.fillRect(plusLeft ? x + 4 : x + w - w * .32, y + 2, w * .28, h - 4);
  g.fillStyle = '#9aa3ad'; g.fillRect(plusLeft ? x - 5 : x + w, y + h * .3, 5, h * .4);
  g.fillStyle = '#fff'; g.font = `bold 18px ${FONT_B}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('+', plusLeft ? x + 14 : x + w - 14, y + h / 2 + 1); g.fillText('−', plusLeft ? x + w - 14 : x + 14, y + h / 2 + 1);
}
function drawExp(g, c, st, clips, t){
  const W = 640, H = 350, s = c.width / W; g.setTransform(s, 0, 0, s, 0, 0);
  g.fillStyle = '#f3efe6'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(0,0,0,.05)'; g.lineWidth = 1;
  for (let x = 0; x < W; x += 32){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y < H; y += 32){ g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // 전지
  const bw = st.batt === 1 ? 130 : 260, bx = 320 - bw / 2, by = 44;
  g.fillStyle = '#2f5fb0'; rr(g, bx - 12, by - 8, bw + 24, 52, 8); g.fill();
  for (let i = 0; i < st.batt; i++){ const w = bw / st.batt; drawBattery(g, bx + i * w + 8, by + 2, w - 16, 32, st.dir); }
  const Lx = bx - 12, Rx = bx + bw + 12, Ty = by + 18;
  // 전선
  const wire = (pts, col) => { g.strokeStyle = col; g.lineWidth = 5; g.lineJoin = 'round'; g.beginPath(); g.moveTo(...pts[0]); for (const q of pts.slice(1)) g.lineTo(...q); g.stroke(); };
  wire([[Lx, Ty], [60, Ty], [60, 196], [215, 196], [215, 230]], '#d94141');
  wire([[Rx, Ty], [590, Ty], [590, 104]], '#2b2f36');
  wire([[590, 168], [590, 196], [425, 196], [425, 230]], '#2b2f36');
  // 스위치
  g.fillStyle = '#e9e3d6'; rr(g, 566, 98, 48, 76, 6); g.fill(); g.strokeStyle = '#9a8f7c'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#9aa3ad'; g.fillRect(584, 100, 12, 8); g.fillRect(584, 160, 12, 8);
  g.strokeStyle = '#6f7b88'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(590, 164);
  if (st.on) g.lineTo(590, 106); else g.lineTo(626, 118); g.stroke();
  g.fillStyle = '#e5483a'; g.beginPath(); g.arc(st.on ? 590 : 626, st.on ? 106 : 118, 6, 0, 7); g.fill();
  // 자기장
  if (st.on){
    const a = st.batt === 1 ? .25 : .45; g.strokeStyle = `rgba(58,142,230,${a})`; g.lineWidth = 2; g.setLineDash([6, 6]); g.lineDashOffset = -t * 30 * st.dir;
    for (const [rx, ry] of [[175, 44], [205, 66], [235, 88]]){ g.beginPath(); g.ellipse(320, 250, rx, ry, 0, 0, 7); g.stroke(); }
    g.setLineDash([]);
  }
  // 볼트와 에나멜선
  g.fillStyle = '#9aa3ad'; g.fillRect(190, 240, 260, 20); g.fillStyle = '#7d8691'; g.fillRect(190, 254, 260, 6);
  g.fillStyle = '#6f7882'; rr(g, 174, 230, 18, 40, 3); g.fill();
  for (let x = 215; x <= 425; x += 5){ g.strokeStyle = '#c8742b'; g.lineWidth = 3.2; g.beginPath(); g.moveTo(x, 231); g.lineTo(x + 3, 269); g.stroke(); g.strokeStyle = 'rgba(255,220,170,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 1, 233); g.lineTo(x + 1, 250); g.stroke(); }
  // 이름표
  g.fillStyle = '#5a6878'; g.font = `700 13px ${FONT_B}`; g.textAlign = 'center';
  g.fillText(`전지 ${st.batt}개`, 320, 112); g.fillText('스위치', 590, 190); g.fillText('에나멜선을 감은 철 볼트 (전자석)', 320, 292);
  g.textAlign = 'left'; g.fillStyle = st.on ? '#25a862' : '#e5483a'; g.font = `18px ${FONT_D}`;
  g.fillText(st.on ? '● 전기가 흘러요' : '○ 전기가 끊겼어요', 16, 26);
  if (st.view === 'clip'){
    const n = st.batt === 1 ? 4 : 9, P = st.clipP;
    for (const side of ['L', 'R']){
      const ex = side === 'L' ? 186 : 452;
      clips[side].forEach(([px, py], k) => {
        let x = px, y = py;
        if (k < n && P > 0){ const tx = ex + (k % 2 ? 5 : -5), ty = 272 + k * 7.5; x = lerp(px, tx, P); y = lerp(py, ty, P); }
        g.strokeStyle = '#7d8691'; g.lineWidth = 2.2; g.beginPath(); g.ellipse(x, y, 7, 4.2, k * .7, 0, 7); g.stroke();
      });
    }
  } else {
    for (const cx of [112, 530]){
      g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, 250, 30, 0, 7); g.fill(); g.strokeStyle = '#8a96a3'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#5a6878'; g.font = `12px ${FONT_D}`; g.textAlign = 'center'; g.fillText('N', cx, 232);
      g.save(); g.translate(cx, 250); g.rotate(st.needle);
      g.fillStyle = '#e5483a'; g.beginPath(); g.moveTo(24, 0); g.lineTo(0, -6); g.lineTo(0, 6); g.closePath(); g.fill();
      g.fillStyle = '#c9d4de'; g.beginPath(); g.moveTo(-24, 0); g.lineTo(0, -6); g.lineTo(0, 6); g.closePath(); g.fill();
      g.restore(); g.fillStyle = '#39424e'; g.beginPath(); g.arc(cx, 250, 3, 0, 7); g.fill();
    }
  }
}

/* ---------- 4-2. 고철 그리기 ---------- */
const ITEM_DIMS = {can:[32, 40], pipe:[70, 18], bottle:[24, 46], wire:[42, 28], bike:[72, 46], box:[56, 44], bolt:[42, 20],
  dumbbell:[58, 24], basket:[60, 40], ladder:[74, 24], pan:[60, 18], pot:[48, 32], chair:[50, 50], door:[68, 22]};
function drawItem(g, it, cx, by, sc = 1){
  const [w, h] = ITEM_DIMS[it.shape] || [40, 30], col = COLOR_HEX[it.colorName] || '#999';
  g.save(); g.translate(cx, by); g.scale(sc, sc);
  g.lineWidth = 2; g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineJoin = 'round'; g.lineCap = 'round';
  const s = it.shape;
  if (s === 'can'){
    g.fillStyle = col; g.fillRect(-w / 2, -h, w, h); g.strokeRect(-w / 2, -h, w, h);
    g.fillStyle = it.material === '철' ? '#d94141' : '#3a8ee6'; g.fillRect(-w / 2, -h * .64, w, h * .26);
    g.fillStyle = shade(col, .3); g.beginPath(); g.ellipse(0, -h, w / 2, 5, 0, 0, 7); g.fill(); g.stroke();
  } else if (s === 'pipe'){
    g.fillStyle = col; g.fillRect(-w / 2, -h, w, h); g.strokeRect(-w / 2, -h, w, h);
    g.fillStyle = shade(col, -.35); g.beginPath(); g.ellipse(w / 2, -h / 2, 5, h / 2, 0, 0, 7); g.fill(); g.stroke();
  } else if (s === 'bottle'){
    g.fillStyle = it.material === '유리' ? 'rgba(150,215,190,.75)' : 'rgba(200,230,245,.8)';
    g.fillRect(-w / 2, -h * .7, w, h * .7); g.strokeRect(-w / 2, -h * .7, w, h * .7);
    g.fillRect(-w / 5, -h, w * .4, h * .32); g.strokeRect(-w / 5, -h, w * .4, h * .32);
  } else if (s === 'wire'){
    g.strokeStyle = col; g.lineWidth = 4;
    for (let k = 0; k < 4; k++){ g.beginPath(); g.ellipse(-12 + k * 8, -h / 2, 9, h / 2 - 2, 0, 0, 7); g.stroke(); }
  } else if (s === 'bike'){
    g.strokeStyle = '#2f343b'; g.lineWidth = 4; for (const x of [-w * .3, w * .3]){ g.beginPath(); g.arc(x, -15, 14, 0, 7); g.stroke(); }
    g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.moveTo(-w * .3, -15); g.lineTo(-4, -34); g.lineTo(w * .3, -15); g.moveTo(-4, -34); g.lineTo(-10, -h); g.moveTo(-4, -34); g.lineTo(14, -36); g.lineTo(w * .3, -15); g.stroke();
  } else if (s === 'box'){
    g.fillStyle = col; g.fillRect(-w / 2, -h, w, h); g.strokeRect(-w / 2, -h, w, h);
    g.fillStyle = '#e8d7b3'; g.fillRect(-5, -h, 10, h);
  } else if (s === 'bolt'){
    g.fillStyle = col; for (let k = 0; k < 4; k++){ const x = -15 + k * 10, a = (k % 2 ? -.3 : .2); g.save(); g.translate(x, -8); g.rotate(a); g.fillRect(-2, -10, 4, 18); g.fillRect(-5, -12, 10, 4); g.restore(); }
  } else if (s === 'dumbbell'){
    g.fillStyle = col; rr(g, -w / 2, -h, 14, h, 3); g.fill(); rr(g, w / 2 - 14, -h, 14, h, 3); g.fill();
    g.fillStyle = '#8a9099'; g.fillRect(-w / 2 + 14, -h / 2 - 3, w - 28, 6);
  } else if (s === 'basket'){
    g.strokeStyle = '#6f7882'; g.lineWidth = 2.5; g.strokeRect(-w / 2, -h, w, h);
    g.lineWidth = 1.5; for (let x = -w / 2 + 8; x < w / 2; x += 8){ g.beginPath(); g.moveTo(x, -h); g.lineTo(x, 0); g.stroke(); }
    for (let y = -h + 8; y < 0; y += 8){ g.beginPath(); g.moveTo(-w / 2, y); g.lineTo(w / 2, y); g.stroke(); }
  } else if (s === 'ladder'){
    g.fillStyle = col; g.fillRect(-w / 2, -h, w, 5); g.fillRect(-w / 2, -6, w, 5);
    for (let x = -w / 2 + 6; x < w / 2; x += 12) g.fillRect(x, -h, 4, h - 2);
    g.strokeRect(-w / 2, -h, w, h - 1);
  } else if (s === 'pan'){
    g.fillStyle = col; g.beginPath(); g.ellipse(-8, -h / 2, 22, h / 2, 0, 0, 7); g.fill(); g.stroke();
    g.fillRect(12, -h / 2 - 3, 18, 6);
  } else if (s === 'pot'){
    g.fillStyle = col; rr(g, -w / 2 + 4, -h, w - 8, h, 5); g.fill(); g.stroke();
    g.fillRect(-w / 2 - 2, -h + 6, 6, 4); g.fillRect(w / 2 - 4, -h + 6, 6, 4);
    g.fillStyle = shade(col, .25); g.fillRect(-w / 2 + 4, -h, w - 8, 5);
  } else if (s === 'chair'){
    g.fillStyle = col; g.fillRect(-w / 2, -h * .5, w, 7); g.fillRect(w / 2 - 8, -h, 8, h * .5);
    g.fillRect(-w / 2 + 2, -h * .5, 5, h * .5); g.fillRect(w / 2 - 7, -h * .5, 5, h * .5);
  } else if (s === 'door'){
    g.fillStyle = col; g.fillRect(-w / 2, -h, w, h); g.strokeRect(-w / 2, -h, w, h);
    g.fillStyle = '#9aa3ad'; g.fillRect(w / 2 - 16, -h + 6, 10, 4);
  }
  g.restore();
}
const ITEM_URL = {};
function itemThumbURL(it){
  if (ITEM_URL[it.id]) return ITEM_URL[it.id];
  const c = mkCanvas(160, 96), g = c.getContext('2d'); drawItem(g, it, 80, 84, 1.45);
  return (ITEM_URL[it.id] = c.toDataURL());
}

/* ---------- 4-3. 크레인 장면 (직접 조종·자동) ---------- */
class CraneScene {
  constructor(canvas, items, opts = {}){
    this.c = canvas; this.g = canvas.getContext('2d'); this.W = 820; this.H = 380;
    this.GROUND = 330; this.RAIL = 40; this.BIN = {x0:666, x1:806};
    this.items = items.map((it, i) => ({...it, x:66 + i * 74, y:330, inBin:false, held:false, falling:false, vy:0}));
    this.trolley = 120; this.cable = 50; this.on = false; this.batt = 1; this.carry = null; this.busy = false;
    this.energy = 0; this.speed = 1; this.anims = []; this.bubble = null; this.msg = ''; this.hold = 0; this.binCount = 0;
    this.onEvent = opts.onEvent || (() => {}); this.alive = true; this.last = performance.now();
    requestAnimationFrame(t => this.loop(t));
  }
  tween(set, from, to, dur){ return new Promise(res => this.anims.push({set, from, to, dur:Math.max(.05, dur / this.speed), t:0, res})); }
  sleep(ms){ return new Promise(r => setTimeout(r, ms / this.speed)); }
  moveTo(x){ x = clamp(x, 60, 790); return this.tween(v => { this.trolley = v; }, this.trolley, x, Math.abs(x - this.trolley) / 320); }
  setCable(v){ return this.tween(x => { this.cable = x; }, this.cable, v, .42); }
  magBottom(){ return this.RAIL + 18 + this.cable + 16; }
  overBin(){ return this.trolley > this.BIN.x0 + 12 && this.trolley < this.BIN.x1 - 12; }
  itemUnder(){
    let best = null, bd = 34;
    for (const it of this.items){ if (it.inBin || it.held || it.falling) continue; const d = Math.abs(it.x - this.trolley); if (d < bd){ bd = d; best = it; } }
    return best;
  }
  fall(it, to, bin){ it.falling = true; it.vy = 0; it.fallTo = to; it.fallBin = !!bin; }
  async grab(){
    this.busy = true;
    const it = this.itemUnder(), h = it ? ITEM_DIMS[it.shape][1] : 6;
    const down = (this.GROUND - h) - (this.RAIL + 34);
    await this.setCable(down);
    let kind = 'none';
    if (it){
      if (it.material !== '철') kind = 'nostick';
      else if (it.heavy && this.batt < 2){
        kind = 'drop'; it.held = true; this.carry = it; await this.setCable(down - 24);
        this.carry = null; it.held = false; this.fall(it, this.GROUND);
      } else { kind = (!it.heavy && this.batt === 2) ? 'waste' : 'ok'; this.carry = it; it.held = true; }
    }
    await this.setCable(50);
    this.busy = false;
    return {kind, it};
  }
  release(){
    const it = this.carry; this.on = false;
    if (!it) return null;
    this.carry = null; it.held = false;
    if (this.overBin()){ it.x = clamp(this.trolley, this.BIN.x0 + 26, this.BIN.x1 - 26); this.fall(it, this.GROUND - 8, true); return 'bin'; }
    this.fall(it, this.GROUND); return 'ground';
  }
  setBatt(n){
    if (this.busy) return;
    this.batt = n;
    if (this.carry && this.carry.heavy && n < 2){ const it = this.carry; this.carry = null; it.held = false; this.fall(it, this.GROUND); this.onEvent('weakdrop', {it}); }
  }
  async toggle(){
    if (this.busy) return;
    if (!this.on){ this.on = true; const r = await this.grab(); this.onEvent('grab', r); }
    else { const r = this.release(); this.onEvent('release', {where:r}); }
  }
  update(dt){
    for (const a of this.anims){
      a.t += dt; const k = Math.min(1, a.t / a.dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      a.set(a.from + (a.to - a.from) * e); if (k >= 1){ a.done = true; a.res(); }
    }
    this.anims = this.anims.filter(a => !a.done);
    if (this.hold && !this.busy) this.trolley = clamp(this.trolley + this.hold * 280 * dt, 60, 790);
    if (this.on) this.energy += this.batt * dt * 10;
    for (const it of this.items){
      if (it.held){ it.x = this.trolley; it.y = this.magBottom() + ITEM_DIMS[it.shape][1]; }
      else if (it.falling){
        it.vy += 1700 * dt; it.y += it.vy * dt;
        if (it.y >= it.fallTo){ it.y = it.fallTo; it.falling = false; if (it.fallBin){ it.inBin = true; it.slot = this.binCount++; this.onEvent('inbin', {it}); } }
      }
    }
  }
  draw(){
    const g = this.g, W = this.W, H = this.H, s = this.c.width / W; g.setTransform(s, 0, 0, s, 0, 0);
    g.fillStyle = '#cfe3ef'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#b9d3e2'; for (let k = 0; k < 6; k++) g.fillRect(k * 150 + 20, 200 - (k % 3) * 30, 90, 130 + (k % 3) * 30);
    g.fillStyle = '#a69d8f'; g.fillRect(0, this.GROUND, W, H - this.GROUND);
    for (let k = 0; k < 60; k++){ g.fillStyle = k % 2 ? '#8f8678' : '#bdb4a6'; g.fillRect(hash2(k, 7, 1) * W, this.GROUND + 4 + hash2(k, 9, 1) * 44, 4, 3); }
    // 레일
    g.fillStyle = '#e2b13a'; g.fillRect(24, this.RAIL - 6, W - 40, 12); g.fillRect(24, this.RAIL - 6, 12, this.GROUND - this.RAIL + 6); g.fillRect(W - 28, this.RAIL - 6, 12, this.GROUND - this.RAIL + 6);
    g.fillStyle = '#2b2f36'; for (let x = 40; x < W - 30; x += 28) g.fillRect(x, this.RAIL - 2, 14, 4);
    // 고철함 뒤
    const B = this.BIN; g.fillStyle = '#4d6b52'; g.fillRect(B.x0, this.GROUND - 70, B.x1 - B.x0, 70);
    // 바닥 고철
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    for (const it of this.items){
      if (it.inBin || it.held) continue;
      drawItem(g, it, it.x, it.y);
      if (!it.falling && it.y >= this.GROUND - 1){ g.fillStyle = '#1c2733'; g.font = `700 12px ${FONT_B}`; g.fillText(it.name, it.x, this.GROUND + 20); }
    }
    for (const it of this.items){ if (!it.inBin) continue; const k = it.slot; drawItem(g, it, B.x0 + 26 + (k % 3) * 44, this.GROUND - 10 - Math.floor(k / 3) * 22, .6); }
    g.fillStyle = '#5f8a66'; g.fillRect(B.x0 - 4, this.GROUND - 34, B.x1 - B.x0 + 8, 34);
    g.fillStyle = '#fff'; g.font = `16px ${FONT_D}`; g.fillText('철 고철함', (B.x0 + B.x1) / 2, this.GROUND - 12);
    // 트롤리·케이블·전자석
    const tx = this.trolley;
    g.fillStyle = '#39424e'; rr(g, tx - 26, this.RAIL - 10, 52, 28, 5); g.fill();
    g.strokeStyle = '#2b2f36'; g.lineWidth = 3; g.beginPath(); g.moveTo(tx, this.RAIL + 18); g.lineTo(tx, this.RAIL + 18 + this.cable); g.stroke();
    const my = this.RAIL + 18 + this.cable;
    if (this.on){
      const a = this.batt === 1 ? .35 : .65;
      for (let k = 1; k <= 3; k++){ g.strokeStyle = `rgba(58,142,230,${a / k})`; g.lineWidth = 3; g.beginPath(); g.ellipse(tx, my + 18, 30 + k * 8, 8 + k * 5, 0, 0, Math.PI); g.stroke(); }
    }
    g.fillStyle = this.on ? '#e2782b' : '#6f7882'; rr(g, tx - 30, my, 60, 16, 5); g.fill();
    g.fillStyle = '#c8742b'; for (let x = tx - 24; x < tx + 24; x += 6) g.fillRect(x, my + 3, 3, 10);
    g.fillStyle = this.on ? '#ffd23f' : '#c9d4de'; g.font = `13px ${FONT_D}`; g.fillText(this.on ? `ON · 전지 ${this.batt}개` : 'OFF', tx, my - 6 - (this.cable < 70 ? 0 : 0));
    for (const it of this.items) if (it.held) drawItem(g, it, it.x, it.y);
    if (this.bubble){
      g.font = `700 14px ${FONT_B}`; const tw = Math.min(W - 40, g.measureText(this.bubble).width + 24);
      const bx = clamp(tx, tw / 2 + 10, W - tw / 2 - 10);
      g.fillStyle = 'rgba(21,32,43,.94)'; rr(g, bx - tw / 2, 64, tw, 32, 8); g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(this.bubble, bx, 81, tw - 16); g.textBaseline = 'alphabetic';
    }
  }
  loop(now){
    if (!this.alive || !document.body.contains(this.c)){ this.alive = false; return; }
    const dt = Math.min(.05, (now - this.last) / 1000); this.last = now;
    this.update(dt); this.draw();
    requestAnimationFrame(t => this.loop(t));
  }
  async runAuto(tree, onItem){
    for (const it of this.items.slice()){
      if (!this.alive) return;
      await this.moveTo(it.x);
      const tr = traceTree(tree, it);
      this.bubble = tr.path.map(p => `${QUESTIONS[p.q].text.replace('?', '')}? ${p.ans ? '예' : '아니요'}`).join(' → ') + ` ⇒ ${ACTIONS[tr.action].short}`;
      await this.sleep(1100);
      const out = craneOutcome(it, tr.action);
      if (tr.action !== 'skip'){
        this.batt = tr.action === 'strong' ? 2 : 1; this.on = true;
        await this.grab();
        if (this.carry){ await this.moveTo((this.BIN.x0 + this.BIN.x1) / 2); this.release(); await this.sleep(450); }
        else { this.on = false; await this.sleep(250); }
      } else await this.sleep(300);
      this.bubble = null; onItem(it, tr, out);
    }
  }
}
function openCraneMenu(){
  const q = Q();
  const p = openPanel(`<h2>크레인 조종석</h2><p class="sub">크레인 끝의 전자석으로 철 고철만 골라 철 고철함에 옮겨요.</p>
    <div class="grid2">
      <div class="card"><h4>${q.em2 ? '✅ ' : ''}직접 조종하기</h4><p style="font-size:14px;color:var(--text-dim)">전지 개수와 자석 켜기·끄기를 직접 조작해요. 어떤 물체가 붙고, 언제 센 전자석이 필요한지 찾아봐요.</p><button class="btn primary" id="cmManual">시작</button></div>
      <div class="card"><h4>${q.em3 ? '✅ ' : ''}AI 두뇌로 자동 운전</h4><p style="font-size:14px;color:var(--text-dim)">내가 만든 질문 길(스무고개)대로 크레인이 스스로 판단해요.</p><button class="btn" id="cmAuto">AI 크레인 두뇌 열기</button></div>
    </div>`);
  p.querySelector('#cmManual').onclick = () => crane3Ready() ? startCrane3D('manual') : openCraneManual();
  p.querySelector('#cmAuto').onclick = openTreeLab;
}
function openCraneManual(){
  const p = openPanel(`<h2>고철장 크레인 조종</h2>
    <p class="sub">◀ ▶로 움직이고 [자석 켜기]로 고철을 집어요. 고철함 위에서 [자석 끄기]를 누르면 내려놓아요. 키보드: <kbd>←</kbd><kbd>→</kbd> 이동, <kbd>스페이스</kbd> 자석, <kbd>1</kbd><kbd>2</kbd> 전지 개수</p>
    <div class="crane-wrap"><canvas id="crC" width="1640" height="760" aria-label="크레인 조종 화면"></canvas></div>
    <div class="crane-ctrl">
      <button class="btn hold" id="crL" aria-label="왼쪽">◀</button><button class="btn hold" id="crR" aria-label="오른쪽">▶</button>
      <button class="btn primary" id="crMag">자석 켜기</button>
      <button class="btn on" id="crB1">전지 1개</button><button class="btn" id="crB2">전지 2개</button>
      <span class="meter">전기 사용량 <b id="crE">0</b></span><span class="meter">옮긴 철 <b id="crN">0</b>/4</span>
    </div>
    <div id="crMsg" class="note" style="margin-top:10px">철 고철은 모두 4개예요. 어떤 물체가 전자석에 붙을지 예상하며 시작해요!</div>
    <div id="crDone"></div>`, {wide:true, onClose:() => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); }});
  const nm = (it, a, b) => `<b>${esc(josa(it.name, a, b))}</b>`;
  const sc = new CraneScene(p.querySelector('#crC'), TRAIN_ITEMS, {onEvent:(type, r) => {
    const msg = p.querySelector('#crMsg'); if (!msg) return;
    if (type === 'grab'){
      if (r.kind === 'none') msg.innerHTML = '아래에 아무것도 없어요. 고철 바로 위로 옮겨 보세요. (자석이 켜져 있으면 전기가 계속 쓰여요!)';
      if (r.kind === 'nostick'){ msg.innerHTML = `${nm(r.it, '은', '는')} 전자석에 붙지 않아요. 왜 그럴까요? 자석을 끄고 다른 고철로 가요.`; SND.bad(); stats.nostick++; }
      if (r.kind === 'drop'){ msg.innerHTML = `${nm(r.it, '이', '가')} 너무 무거워 떨어졌어요! 전자석을 더 세게 하려면 어떻게 할까요?`; SND.bad(); stats.drop++; }
      if (r.kind === 'ok'){ msg.innerHTML = `${nm(r.it, '이', '가')} 붙었어요! 철 고철함 위로 옮겨 자석을 꺼요.`; SND.ok(); }
      if (r.kind === 'waste'){ msg.innerHTML = `${nm(r.it, '이', '가')} 붙었어요. 그런데 가벼운 고철에 전지 2개는 전기 낭비일지도 몰라요.`; SND.ok(); stats.waste++; }
    }
    if (type === 'weakdrop'){ msg.innerHTML = '세기를 약하게 바꾸자 무거운 고철이 떨어졌어요!'; SND.bad(); }
    if (type === 'release' && r.where === 'ground') msg.innerHTML = '고철함 밖에 떨어뜨렸어요. 다시 집어 고철함 위에서 꺼요.';
    if (type === 'inbin'){ SND.tick(); const n = sc.items.filter(i => i.inBin && i.material === '철').length; msg.innerHTML = `철 고철함에 넣었어요! (${n}/4)`; if (n >= 4) finish(); }
    if (type === 'inbin' && r.it.material !== '철') msg.innerHTML = '철이 아닌 물체가 고철함에 들어갔어요.';
    updBtns();
  }});
  const stats = {nostick:0, drop:0, waste:0};
  const updBtns = () => {
    p.querySelector('#crMag').textContent = sc.on ? '자석 끄기' : '자석 켜기';
    p.querySelector('#crB1').classList.toggle('on', sc.batt === 1); p.querySelector('#crB2').classList.toggle('on', sc.batt === 2);
  };
  const tick = setInterval(() => {
    const eE = p.querySelector('#crE'), eN = p.querySelector('#crN');
    if (!sc.alive || !eE || !eN){ clearInterval(tick); return; }
    eE.textContent = Math.round(sc.energy);
    eN.textContent = sc.items.filter(i => i.inBin && i.material === '철').length;
  }, 150);
  const bindHold = (el, d) => {
    el.addEventListener('pointerdown', e => { e.preventDefault(); sc.hold = d; el.setPointerCapture(e.pointerId); });
    const up = () => { if (sc.hold === d) sc.hold = 0; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
  };
  bindHold(p.querySelector('#crL'), -1); bindHold(p.querySelector('#crR'), 1);
  p.querySelector('#crMag').onclick = () => { sc.toggle(); setTimeout(updBtns, 30); };
  p.querySelector('#crB1').onclick = () => { sc.setBatt(1); updBtns(); };
  p.querySelector('#crB2').onclick = () => { sc.setBatt(2); updBtns(); };
  function kd(e){
    if (e.target.closest && e.target.closest('input,textarea,select')) return;
    if (e.code === 'ArrowLeft'){ sc.hold = -1; e.preventDefault(); }
    else if (e.code === 'ArrowRight'){ sc.hold = 1; e.preventDefault(); }
    else if (e.code === 'Space'){ e.preventDefault(); if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur(); if (!e.repeat){ sc.toggle(); setTimeout(updBtns, 30); } }
    else if (e.code === 'Digit1'){ sc.setBatt(1); updBtns(); } else if (e.code === 'Digit2'){ sc.setBatt(2); updBtns(); }
  }
  function ku(e){ if ((e.code === 'ArrowLeft' && sc.hold === -1) || (e.code === 'ArrowRight' && sc.hold === 1)) sc.hold = 0; }
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  let finished = false;
  function finish(){
    if (finished) return; finished = true;
    const e = Math.round(sc.energy);
    SAVE.crane = {energy:e, ...stats, time:Date.now()};
    const bolts = mgCraneBolts(stats);
    if (!SAVE.badges.em2){ SAVE.badges.em2 = true; toast('크레인 조종 미션 성공!', 'ok'); }
    persist(); checkMasters();
    p.querySelector('#crDone').innerHTML = `<div class="okbox" style="margin-top:10px"><b>미션 성공!</b> 철 고철 4개를 모두 옮겼어요. 전기 사용량 ${e}. 미니 게임 ${boltsHTML(bolts)}<br>
      붙지 않은 물체 시도 ${stats.nostick}번 · 무거워서 떨어뜨림 ${stats.drop}번 · 가벼운 고철에 전지 2개 ${stats.waste}번<br>
      <b>생각해 볼까요?</b> 나는 무엇을 보고 '집을지 말지', '얼마나 세게 할지' 정했나요? 그 판단 기준을 AI 크레인 두뇌에 가르쳐 봐요.</div>
      <div class="row" style="margin-top:10px"><button class="btn primary" id="crGoTree">AI 크레인 두뇌 만들러 가기</button><button class="btn" data-close>닫기</button></div>`;
    p.querySelector('#crGoTree').onclick = openTreeLab;
  }
}

/* ---------- 4-4. AI 크레인 두뇌 (질문 길 = 의사결정트리) ---------- */
function traceTree(n, it){
  const path = [];
  while (n && n.t === 'q'){ const ans = QUESTIONS[n.q].f(it); path.push({q:n.q, ans}); n = ans ? n.yes : n.no; }
  return {action:n && n.t === 'a' ? n.a : null, path};
}
function treeComplete(n){ return !!n && (n.t === 'a' || (n.t === 'q' && treeComplete(n.yes) && treeComplete(n.no))); }
function treeSize(n){ return !n || n.t !== 'q' ? 0 : 1 + treeSize(n.yes) + treeSize(n.no); }
function nodeAt(root, path){ let n = root; for (const ch of path.slice(1)) n = ch === 'y' ? n.yes : n.no; return n; }
function setNode(path, val){
  if (path === 'r'){ SAVE.tree = val; return; }
  const parent = nodeAt(SAVE.tree, path.slice(0, -1)); if (path.endsWith('y')) parent.yes = val; else parent.no = val;
}
/* 질문 길 그리기: 위에서 아래로 갈라지는 '예/아니요' 길. 칸 아래에는 그 칸까지 내려온 연습 고철이 보인다.
   한 길에서 이미 물어본 특징(재료·무게·크기·색)은 다시 고를 수 없다. */
const TREE_UI = {open:null, kind:null};
function treeArrivals(root, items){
  const map = {};
  for (const it of items){
    let n = root, path = 'r';
    while (n && n.t === 'q'){ const a = QUESTIONS[n.q].f(it); path += a ? 'y' : 'n'; n = a ? n.yes : n.no; }
    (map[path] = map[path] || []).push(it);
  }
  return map;
}
function qCard(q, path){
  const Qd = QUESTIONS[q], A = ATTR[Qd.key];
  return `<button class="qcard ${A.cls}" data-path="${path}" data-q="${q}"><span class="qk">${A.icon} ${Qd.key}</span>${Qd.text}</button>`;
}
function treeHTML(n, path, depth, keys = [], arr = {}){
  const here = arr[path] || [];
  const who = (n && n.t === 'q') ? '' : here.length
    ? `<div class="tarr">${here.map(it => { const ok = n && n.t === 'a' ? correctAction(it) === n.a : null; return `<span class="tchip ${ok === true ? 'ok' : ok === false ? 'bad' : ''}">${ok === true ? '✓ ' : ok === false ? '✗ ' : ''}${esc(it.name)}</span>`; }).join('')}</div>`
    : (depth ? '<div class="tarr none">여기로 오는 연습 고철이 없어요</div>' : '');
  if (!n || n.t === 'e'){
    const avail = Q_ORDER.filter(q => !keys.includes(QUESTIONS[q].key));
    const open = TREE_UI.open === path ? TREE_UI.kind : null;
    let inner;
    if (open === 'q') inner = `<div class="tpick-t">어떤 특징을 물어볼까요?</div><div class="tpick">${avail.map(q => qCard(q, path)).join('')}</div><button class="btn small ghost" data-cancel>닫기</button>`;
    else if (open === 'a') inner = `<div class="tpick-t">크레인이 어떻게 할까요?</div><div class="tpick">${Object.entries(ACTIONS).map(([k, v]) => `<button class="chip ${k} big" data-path="${path}" data-a="${k}">${v.text}</button>`).join('')}</div><button class="btn small ghost" data-cancel>닫기</button>`;
    else inner = `<div class="tadd">${depth < 3 && avail.length ? `<button class="btn small" data-open="${path}" data-kind="q">＋ 질문 넣기</button>` : ''}<button class="btn small" data-open="${path}" data-kind="a">＋ 결정 넣기</button></div>`;
    return `<div class="tnode"><div class="tbox empty${open ? ' open' : ''}">${inner}</div>${who}</div>`;
  }
  if (n.t === 'a') return `<div class="tnode"><div class="tbox act"><span class="chip ${n.a}">${ACTIONS[n.a].text}</span><button class="del" data-del="${path}" aria-label="지우기">×</button></div>${who}</div>`;
  const Qd = QUESTIONS[n.q], A = ATTR[Qd.key], dup = keys.includes(Qd.key), nk = keys.concat(Qd.key);
  const warn = dup ? `<div class="qwarn">⚠️ 위에서 이미 ${josa(Qd.key, '을', '를')} 물어봤어요. 이 질문은 지워도 돼요.</div>`
    : Qd.legacy ? '<div class="qwarn">예전 질문이에요. 금속에는 철·알루미늄·구리가 모두 들어가요. \'철로 만들었나요?\'로 바꿔 볼까요?</div>' : '';
  return `<div class="tnode"><div class="tbox q ${A.cls}${dup ? ' dup' : ''}"><span class="qk">${A.icon} ${Qd.key}</span><div class="qt">${Qd.text}</div>${warn}<button class="del" data-del="${path}" aria-label="지우기">×</button></div>
    <div class="tbr"><div class="tb"><span class="tlab yes">예</span>${treeHTML(n.yes, path + 'y', depth + 1, nk, arr)}</div><div class="tb"><span class="tlab no">아니요</span>${treeHTML(n.no, path + 'n', depth + 1, nk, arr)}</div></div></div>`;
}
const HINTS = [
  '크레인을 직접 조종할 때 어떤 고철이 전자석에 붙었나요? <b>재료</b>를 먼저 물어보면 어떨까요?',
  '알루미늄 캔과 철 캔은 둘 다 <b>은색</b>이에요. 색으로 나누면 어떻게 될까요?',
  '세게 집어야 하는 건 <b>큰</b> 고철일까요, <b>무거운</b> 고철일까요? 작지만 무거운 물건도 있어요.',
];
function attrChips(it){
  return `<div class="attrs"><span class="ac mat">🧱 ${it.material}</span><span class="ac wt">⚖️ ${it.heavy ? '무거움' : '가벼움'}</span><span class="ac sz">📏 ${it.big ? '큼' : '작음'}</span><span class="ac col">🎨 ${it.colorName}</span></div>`;
}
function itemCard(it, showAnswer = true){
  const a = correctAction(it);
  return `<div class="icard"><img src="${itemThumbURL(it)}" alt=""><b>${esc(it.name)}</b>${attrChips(it)}
    ${showAnswer ? `<div class="lbl"><span class="chip ${a}">정답: ${ACTIONS[a].short}</span></div>` : ''}</div>`;
}
function openTreeLab(){
  if (!SAVE.tree) SAVE.tree = {t:'e'};
  let hintN = 0; TREE_UI.open = null;
  const p = openPanel(`<h2>AI 크레인 두뇌 만들기</h2>
    <p class="sub">크레인 두뇌는 <b>스무고개</b>처럼 '예/아니요' 질문을 차례로 해서 고철을 나눠요. 고철은 <b>질문 길</b>을 따라 내려가 마지막 칸에 적힌 대로 움직여요. 필요한 만큼만 세게 집으면 전기도 아낄 수 있어요.</p>
    <p class="note" style="margin:0 0 6px">어른들은 이렇게 질문으로 나누는 AI를 '의사결정트리'라고 불러요.</p>
    <h3>① 연습 고철 (정답이 적혀 있어요)</h3><div class="items">${TRAIN_ITEMS.map(it => itemCard(it)).join('')}</div>
    <h3>② 질문 길 만들기</h3>
    <p class="sub" style="margin-top:0">물어볼 수 있는 특징은 <b>🧱 재료 · ⚖️ 무게 · 📏 크기 · 🎨 색</b> 네 가지예요. 한 길에서 같은 특징은 한 번만 물어요. 칸 아래에 그 칸까지 내려온 연습 고철이 보여요.</p>
    <div class="tree" id="tBox"></div>
    <div class="row"><button class="btn small" id="tClear">처음부터</button><button class="btn small" id="tHint">힌트 보기</button><span id="tInfo" style="font-size:13px;color:var(--text-dim)"></span></div>
    <div id="tHintBox" style="margin-top:8px"></div>
    <h3>③ 시험하기</h3>
    <div class="row"><button class="btn" id="tTrain">연습 고철로 시험</button><button class="btn primary" id="tTest">새 고철 트럭으로 시험</button></div>
    <div id="tRes" style="margin-top:10px"></div>
    <h3>시험 기록</h3><div id="tHist"></div>`, {wide:true});
  const render = () => {
    p.querySelector('#tBox').innerHTML = treeHTML(SAVE.tree, 'r', 0, [], treeArrivals(SAVE.tree, TRAIN_ITEMS));
    const done = treeComplete(SAVE.tree), n = treeSize(SAVE.tree);
    p.querySelector('#tInfo').textContent = done ? `완성! 질문 ${n}개${n > 3 ? ' · 질문을 줄여도 될지 살펴봐요' : ''}` : '빈칸을 모두 채우면 완성돼요';
    p.querySelectorAll('#tBox [data-open]').forEach(b => b.onclick = () => { TREE_UI.open = b.dataset.open; TREE_UI.kind = b.dataset.kind; render(); });
    p.querySelectorAll('#tBox [data-cancel]').forEach(b => b.onclick = () => { TREE_UI.open = null; render(); });
    p.querySelectorAll('#tBox [data-q]').forEach(b => b.onclick = () => { setNode(b.dataset.path, {t:'q', q:b.dataset.q, yes:{t:'e'}, no:{t:'e'}}); TREE_UI.open = null; persist(); SND.tick(); render(); });
    p.querySelectorAll('#tBox [data-a]').forEach(b => b.onclick = () => { setNode(b.dataset.path, {t:'a', a:b.dataset.a}); TREE_UI.open = null; persist(); SND.tick(); render(); });
    p.querySelectorAll('#tBox [data-del]').forEach(b => b.onclick = () => { setNode(b.dataset.del, {t:'e'}); TREE_UI.open = null; persist(); render(); });
    renderHist();
  };
  const renderHist = () => {
    const runs = SAVE.treeRuns.slice(-12);
    p.querySelector('#tHist').innerHTML = runs.length ? `<div class="hist">${runs.map(r => `<div title="${r.kind === 'test' ? '새 고철' : '연습'} ${Math.round(r.acc * 100)}%" style="height:${Math.max(4, r.acc * 60)}px;background:${r.kind === 'test' ? 'var(--volt)' : 'var(--info)'}"><span>${Math.round(r.acc * 100)}</span></div>`).join('')}</div>
      <p class="sub" style="margin-top:6px">파랑: 연습 고철 · 노랑: 새 고철 트럭. 고칠 때마다 정확도가 어떻게 바뀌었나요?</p>` : '<p class="sub">아직 시험 기록이 없어요.</p>';
  };
  p.querySelector('#tClear').onclick = () => { SAVE.tree = {t:'e'}; TREE_UI.open = null; persist(); render(); };
  p.querySelector('#tHint').onclick = () => { hintN = Math.min(HINTS.length, hintN + 1); p.querySelector('#tHintBox').innerHTML = HINTS.slice(0, hintN).map((h, i) => `<div class="note" style="margin-bottom:6px">힌트 ${i + 1}. ${h}</div>`).join(''); };
  p.querySelector('#tTrain').onclick = () => {
    if (!treeComplete(SAVE.tree)) return toast('질문 길의 빈칸을 먼저 채워요.', 'bad');
    const rows = TRAIN_ITEMS.map(it => { const tr = traceTree(SAVE.tree, it); return {it, tr, out:craneOutcome(it, tr.action)}; });
    const acc = rows.filter(r => r.out.ok).length / rows.length;
    SAVE.treeRuns.push({kind:'train', acc, size:treeSize(SAVE.tree), time:Date.now()}); persist();
    p.querySelector('#tRes').innerHTML = `<div class="row"><span class="big-score">${Math.round(acc * 100)}%</span><span>연습 고철 8개 중 ${rows.filter(r => r.out.ok).length}개를 알맞게 처리했어요.</span></div>` + resultTable(rows);
    acc === 1 ? SND.ok() : SND.bad(); renderHist(); rpgSync();
  };
  p.querySelector('#tTest').onclick = () => {
    if (!treeComplete(SAVE.tree)) return toast('질문 길의 빈칸을 먼저 채워요.', 'bad');
    p.querySelector('#tRes').innerHTML = `<div class="card"><b>먼저 예상해요.</b> 처음 보는 고철 8개 중 내 크레인 두뇌가 몇 개를 알맞게 처리할까요?
      <div class="row" style="margin-top:8px"><input id="tPred" type="number" min="0" max="8" value="6" style="width:80px" aria-label="예상 개수"> 개 <button class="btn primary" id="tGo">시험 시작</button></div></div>`;
    p.querySelector('#tGo').onclick = () => runTreeTest(clamp(+p.querySelector('#tPred').value || 0, 0, 8));
  };
  render();
}
function resultTable(rows){
  return `<div class="tblwrap" style="margin-top:8px"><table class="tbl"><thead><tr><th>고철</th><th>크레인 두뇌가 물어본 질문</th><th>결정</th><th>결과</th></tr></thead><tbody>${rows.map(r => `
    <tr><td>${esc(r.it.name)}<br><small style="color:var(--text-dim)">🧱${r.it.material} · ⚖️${r.it.heavy ? '무거움' : '가벼움'} · 📏${r.it.big ? '큼' : '작음'} · 🎨${r.it.colorName}</small></td>
    <td>${r.tr.path.map(x => `${QUESTIONS[x.q].text} <b>${x.ans ? '예' : '아니요'}</b>`).join('<br>')}</td>
    <td><span class="chip ${r.tr.action}">${ACTIONS[r.tr.action].short}</span></td>
    <td class="${r.out.ok ? 'res-ok' : r.out.kind === 'waste' ? 'res-mid' : 'res-bad'}">${r.out.ok ? '✓' : r.out.kind === 'waste' ? '△' : '✗'} ${r.out.msg}</td></tr>`).join('')}</tbody></table></div>`;
}
function treeTestReport(tree, pred, p, holder){
    const all = TEST_ITEMS.map(it => { const tr = traceTree(tree, it); return {it, tr, out:craneOutcome(it, tr.action)}; });
    const ok = all.filter(r => r.out.ok).length, acc = ok / all.length;
    SAVE.treeRuns.push({kind:'test', acc, pred, size:treeSize(tree), time:Date.now()});
    let badge = '';
    if (acc >= .85 && !SAVE.badges.em3){ SAVE.badges.em3 = true; badge = '<div class="okbox" style="margin-top:8px"><b>AI 크레인 두뇌 미션 성공!</b></div>'; }
    else if (acc < .85) badge = '<div class="note" style="margin-top:8px">미션 성공 기준은 85% 이상이에요. 틀린 고철을 보고 질문을 고쳐 다시 도전해요.</div>';
    if (acc === 1) badge += '<div class="okbox" style="margin-top:8px">⭐ <b>완벽한 두뇌!</b> 처음 보는 고철도 모두 알맞게 처리했어요. 질문을 더 줄일 수 있을지 도전해 봐요.</div>';
    persist(); acc >= .85 ? SND.ok() : SND.bad();
    holder.innerHTML = `<div class="row" style="margin-top:10px"><span class="big-score">${Math.round(acc * 100)}%</span>
      <span>새 고철 8개 중 <b>${ok}개</b>를 알맞게 처리했어요. 내 예상은 ${pred}개였어요.</span></div>${badge}${resultTable(all)}
      <div class="fieldset" style="margin-top:12px"><label for="atNote">AI가 틀린 고철은 무엇이고, 어떤 질문이나 결정을 바꾸면 좋을까요?</label>
      <textarea id="atNote" rows="2" maxlength="200">${esc(SAVE.treeNote)}</textarea></div>
      <div class="row"><button class="btn primary" id="atBack">두뇌 고치러 가기</button><button class="btn" data-close>닫기</button></div>`;
    p.querySelector('#atNote').oninput = e => { SAVE.treeNote = e.target.value; persist(); };
    p.querySelector('#atBack').onclick = openTreeLab;
    checkMasters();
}
function runTreeTest(pred){
  const tree = JSON.parse(JSON.stringify(SAVE.tree));
  if (crane3Ready()) return startCrane3D('auto', {tree, pred});
  const p = openPanel(`<h2>새 고철 트럭 시험</h2><p class="sub">처음 보는 고철 8개를 내 크레인 두뇌가 스스로 판단해요. 말풍선에 AI의 판단 경로가 나와요.</p>
    <div class="crane-wrap"><canvas id="atC" width="1640" height="760" aria-label="자동 크레인 시험 화면"></canvas></div>
    <div class="crane-ctrl"><button class="btn" id="atFast">빠르게</button><button class="btn" id="atSkip">결과 바로 보기</button><span class="meter">처리 <b id="atN">0</b>/8</span></div>
    <div id="atRes"></div>`, {wide:true});
  const sc = new CraneScene(p.querySelector('#atC'), TEST_ITEMS);
  const rows = []; let shown = false;
  const show = () => { if (shown) return; shown = true; sc.alive = false; treeTestReport(tree, pred, p, p.querySelector('#atRes')); };
  p.querySelector('#atFast').onclick = e => { sc.speed = sc.speed === 1 ? 2.5 : 1; e.target.classList.toggle('on', sc.speed > 1); };
  p.querySelector('#atSkip').onclick = show;
  sc.runAuto(tree, (it, tr, out) => { rows.push(out); const n = p.querySelector('#atN'); if (n) n.textContent = rows.length; if (rows.length === TEST_ITEMS.length) setTimeout(show, 500); });
}

/* ---------- 4-5. AI 안전 로봇 (나이브 베이즈 분류) ---------- */
const NB = {
  STOP:new Set(['있다', '있어요', '있는', '하고', '하는', '한다', '했다', '그리고', '그', '저', '것', '수', '때', '더', '안', '이다', '입니다', '두었다', '둔다', '모두', '계속', '그대로']),
  PARTICLES:['에서는', '으로는', '에게서', '에서', '으로', '에게', '까지', '부터', '처럼', '하고', '이랑', '이나', '을', '를', '이', '가', '은', '는', '에', '로', '와', '과', '도', '의', '만'],
  ENDINGS:['했습니다', '합니다', '했어요', '해요', '하였다', '했다', '한다', '하다', '었다', '았다', '였다', '는다', '다'],
  norm(s){ return String(s || '').toLowerCase().replace(/[^0-9a-z가-힣\s]/g, ' ').replace(/\s+/g, ' ').trim(); },
  stem(w){
    let s = w;
    for (const e of this.ENDINGS) if (s.length > e.length && s.endsWith(e)){ s = s.slice(0, -e.length); break; }
    for (const p of this.PARTICLES) if (s.length > p.length && s.endsWith(p)){ s = s.slice(0, -p.length); break; }
    return s;
  },
  tokens(s){
    const out = [];
    for (const w of this.norm(s).split(' ').filter(Boolean)){
      out.push('w:' + w); const st = this.stem(w); if (st !== w) out.push('w:' + st);
      const pw = '^' + w + '$'; for (let i = 0; i < pw.length - 1; i++) out.push('b:' + pw.slice(i, i + 2));
    }
    return out;
  },
  train(data){
    const m = {classes:{}, vocab:new Set(), total:0};
    for (const c of LABEL_KEYS){
      const cnt = new Map(); let tot = 0;
      for (const s of data[c] || []) for (const t of this.tokens(s)){ cnt.set(t, (cnt.get(t) || 0) + 1); tot++; m.vocab.add(t); }
      m.classes[c] = {n:(data[c] || []).length, cnt, tot}; m.total += (data[c] || []).length;
    }
    return m;
  },
  lp(m, c, t){ const k = m.classes[c]; return Math.log(((k.cnt.get(t) || 0) + 1) / (k.tot + m.vocab.size)); },
  predict(m, s){
    const toks = this.tokens(s).filter(t => m.vocab.has(t)), sc = {};
    for (const c of LABEL_KEYS){ let v = Math.log((m.classes[c].n + 1) / (m.total + 3)); for (const t of toks) v += this.lp(m, c, t); sc[c] = v; }
    const mx = Math.max(...Object.values(sc)); let z = 0; const p = {};
    for (const c of LABEL_KEYS){ p[c] = Math.exp(sc[c] - mx); z += p[c]; }
    for (const c of LABEL_KEYS) p[c] /= z;
    const label = LABEL_KEYS.slice().sort((a, b) => p[b] - p[a])[0];
    return {label, p};
  },
  wordScore(m, c, t){ let o = 0; for (const x of LABEL_KEYS) if (x !== c) o += Math.exp(this.lp(m, x, t)); return this.lp(m, c, t) - Math.log(o / 2); },
  keyWords(m, c, n = 6){
    const res = [];
    for (const [t] of m.classes[c].cnt){ if (!t.startsWith('w:')) continue; const w = t.slice(2); if (w.length < 2 || this.STOP.has(w) || this.stem(w) !== w) continue; res.push([w, this.wordScore(m, c, t)]); }
    res.sort((a, b) => b[1] - a[1]);
    const out = []; for (const [w, v] of res){ if (v <= .3) break; if (!out.some(o => o.includes(w) || w.includes(o))) out.push(w); if (out.length >= n) break; }
    return out;
  },
  explain(m, s, label){
    const res = [];
    for (const t of this.tokens(s)){ if (!t.startsWith('w:') || !m.vocab.has(t)) continue; const w = t.slice(2); if (w.length < 2 || this.STOP.has(w) || this.stem(w) !== w) continue; const v = this.wordScore(m, label, t); if (v > .3) res.push([w, v]); }
    res.sort((a, b) => b[1] - a[1]);
    const out = []; for (const [w] of res){ if (!out.some(o => o.includes(w) || w.includes(o))) out.push(w); if (out.length >= 3) break; }
    return out;
  },
};
function bigramSet(s){ const t = NB.norm(s).replace(/ /g, ''); const b = new Set(); for (let i = 0; i < t.length - 1; i++) b.add(t.slice(i, i + 2)); return b; }
function similarity(a, b){ const A = bigramSet(a), B = bigramSet(b); if (!A.size || !B.size) return 0; let i = 0; for (const x of A) if (B.has(x)) i++; return i / (A.size + B.size - i); }
function privacyIssue(s){ return /\d{6,}/.test(String(s).replace(/[\s-]/g, '')) || /학교|010/.test(s); }
function trainedModel(){ return SAVE.trainedData ? NB.train(SAVE.trainedData) : null; }
function modelDirty(){ return !SAVE.trainedData || JSON.stringify(SAVE.trainedData) !== JSON.stringify(SAVE.train); }
const NB_HINT = {good:'예: 플러그 머리를 잡고 뽑았다', danger:'예: 젖은 손으로 콘센트를 만졌다', waste:'예: 빈방에 불을 켜 두었다'};
const NB_EXAMPLES = {
  good:['다 쓴 다리미 플러그를 머리 부분을 잡고 뽑았다', '전기를 덜 쓰는 전구로 바꾸었다', '외출 전에 안 쓰는 전기 기구의 전원을 껐다'],
  danger:['물기 있는 손으로 콘센트를 만졌다', '전선이 찢어진 선풍기를 그냥 썼다', '한 콘센트에 난로와 전기밥솥을 같이 꽂았다'],
  waste:['아무도 없는데 컴퓨터를 켜 두었다', '보지도 않는 텔레비전을 하루 종일 틀어 놓았다', '충전이 끝난 충전기를 계속 꽂아 두었다'],
};
function openNBLab(){
  const p = openPanel(`<h2>AI 안전 로봇 가르치기</h2>
    <p class="sub">로봇은 '젖은 손으로 플러그를 만진다' 같은 문장을 읽고 <b>✅ 바른 사용 · ⚠️ 위험 · 💸 낭비</b> 중 하나로 골라요. 처음에는 아무것도 몰라서 우리가 예시 문장으로 가르쳐야 해요.</p>
    <div class="steps3"><span><b>①</b> 예시 문장 넣기</span><span><b>②</b> 로봇 가르치기</span><span><b>③</b> 시험해 보기</span></div>
    <h3>① 예시 문장 넣기 <small style="font-size:13px;color:var(--text-dim)">칸마다 3개 이상</small></h3>
    <p class="sub" style="margin-top:0">장면을 한 문장으로 쓰고 알맞은 칸에 넣어요. 예: '물 묻은 손으로 드라이어를 켰다' → ⚠️ 위험 칸</p>
    <div class="note">같은 뜻도 여러 가지 말로 써 보면 로봇이 처음 보는 문장도 잘 알아봐요. 실제 이름·학교·연락처는 쓰지 않아요.</div>
    <div class="buckets" id="nbB" style="margin-top:10px"></div>
    <h4 style="margin:14px 0 4px">안전 마을에서 살펴본 장면을 바로 넣기</h4><p class="sub" style="margin-top:0">알맞은 칸 버튼을 누르면 그 장면 문장이 그 칸에 들어가요.</p><div class="cards-src" id="nbSrc"></div>
    <details style="margin-top:8px"><summary style="cursor:pointer;color:var(--text-dim)">예시 문장 보기 (막힐 때)</summary><div class="grid3" style="margin-top:8px">${LABEL_KEYS.map(k => `<div class="card"><h4>${LABELS[k].icon} ${LABELS[k].name}</h4>${NB_EXAMPLES[k].map(s => `<div style="font-size:14px;margin:4px 0">· ${s}</div>`).join('')}</div>`).join('')}</div></details>
    <h3>② 로봇 가르치기</h3>
    <p class="sub" style="margin-top:0">모은 문장을 로봇이 공부해요. 이것을 '학습'이라고 해요.</p>
    <div class="row"><button class="btn primary" id="nbTrain">가르치기 (학습)</button><span id="nbStat" style="font-size:14px"></span></div>
    <div id="nbKW" style="margin-top:8px"></div>
    <h3>③ 시험해 보기</h3>
    <p class="sub" style="margin-top:0">내가 새 문장을 써서 물어보거나, 로봇이 한 번도 본 적 없는 시험 마을을 돌며 판단하게 해요.</p>
    <div class="row" style="margin-top:6px"><input id="nbTry" maxlength="60" placeholder="예: 동생이 젓가락을 콘센트에 넣으려 한다" style="flex:1;min-width:200px" aria-label="로봇에게 물어볼 문장"><button class="btn" id="nbAsk">로봇에게 물어보기</button></div>
    <div id="nbAns" style="margin-top:8px"></div>
    <div class="row" style="margin-top:12px"><button class="btn volt" id="nbPatrol">시험 마을 순찰 보내기</button>${WORLD && WORLD.kind === 'custom' ? '<button class="btn volt" id="nbPatrolC">지금 맵 순찰 보내기</button>' : ''}</div>
    <div id="nbPre"></div>
    <h3>순찰 점수 기록</h3><div id="nbHist"></div>`, {wide:true});
  const renderBuckets = () => {
    p.querySelector('#nbB').innerHTML = LABEL_KEYS.map(k => `<div class="bucket ${k}"><h4><span>${LABELS[k].icon} ${LABELS[k].name}</span><span>${SAVE.train[k].length}개</span></h4>
      <div class="add"><input data-in="${k}" maxlength="60" placeholder="${NB_HINT[k]}" aria-label="${LABELS[k].name} 칸에 넣을 문장"><button class="btn small" data-add="${k}">넣기</button></div>
      <ul>${SAVE.train[k].map((s, i) => `<li><span>${esc(s)}</span><button data-rm="${k}:${i}" aria-label="지우기">×</button></li>`).join('')}</ul></div>`).join('');
    p.querySelectorAll('[data-add]').forEach(b => b.onclick = () => addSentence(b.dataset.add, p.querySelector(`[data-in="${b.dataset.add}"]`)));
    p.querySelectorAll('[data-in]').forEach(inp => inp.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing){ e.preventDefault(); addSentence(inp.dataset.in, inp); } });
    p.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { const [k, i] = b.dataset.rm.split(':'); SAVE.train[k].splice(+i, 1); persist(); renderAll(); });
  };
  const addSentence = (k, inp) => {
    const s = inp.value.trim().replace(/\s+/g, ' ');
    if (s.length < 4) return toast('조금 더 길게 써 주세요.', 'bad');
    if (privacyIssue(s)) return toast('실제 연락처·학교 같은 개인정보는 쓰지 않아요.', 'bad');
    if (LABEL_KEYS.some(x => SAVE.train[x].includes(s))) return toast('이미 넣은 문장이에요.', 'bad');
    const leak = TEST_SCENES.find(t => similarity(t.text, s) >= .6);
    if (leak) return toast('시험 마을 문장과 거의 같아요. 시험 문제를 외운 AI는 진짜 실력을 알 수 없어요. 내 말로 바꿔 써 보세요.', 'bad');
    SAVE.train[k].push(s); persist(); SND.tick(); renderAll();
    const ni = p.querySelector(`[data-in="${k}"]`); if (ni) ni.focus();
  };
  const renderSrc = () => {
    const judged = SCENES.filter(s => SAVE.judged[s.id]);
    p.querySelector('#nbSrc').innerHTML = judged.length ? judged.map(s => {
      const used = LABEL_KEYS.find(k => SAVE.train[k].includes(s.text));
      return `<div class="src"><span>${esc(s.icon)} ${esc(s.text)}</span>${used ? `<span class="chip ${used}" style="flex:none">${LABELS[used].name}에 넣음</span>` : LABEL_KEYS.map(k => `<button class="btn small" data-src="${s.id}:${k}">${LABELS[k].name}</button>`).join('')}</div>`;
    }).join('') : '<p class="sub">아직 살펴본 장면이 없어요. 안전 마을 집 안의 느낌표(!) 장면을 먼저 살펴보거나, 위 칸에 내 말로 직접 써도 돼요.</p>';
    p.querySelectorAll('[data-src]').forEach(b => b.onclick = () => { const [id, k] = b.dataset.src.split(':'); SAVE.train[k].push(SCENES.find(s => s.id === id).text); persist(); SND.tick(); renderAll(); });
  };
  const renderModel = () => {
    const can = LABEL_KEYS.every(k => SAVE.train[k].length >= 3);
    p.querySelector('#nbTrain').disabled = !can;
    const stat = p.querySelector('#nbStat');
    if (!can) stat.textContent = `칸마다 3개 이상 넣으면 가르칠 수 있어요. (${LABEL_KEYS.map(k => `${LABELS[k].icon} ${SAVE.train[k].length}`).join(' · ')})`;
    else if (!SAVE.trainedData) stat.textContent = '준비 완료! [가르치기]를 눌러요.';
    else if (modelDirty()) stat.innerHTML = '<span style="color:var(--waste)">문장이 바뀌었어요. 다시 가르쳐야 로봇이 새 문장을 배워요.</span>';
    else stat.innerHTML = `<span style="color:#7fe0a6">가르치기 완료! 문장 ${LABEL_KEYS.reduce((a, k) => a + SAVE.trainedData[k].length, 0)}개를 배웠어요.</span>`;
    const m = trainedModel();
    p.querySelector('#nbKW').innerHTML = m ? `<div class="grid3">${LABEL_KEYS.map(k => `<div class="card"><h4>${LABELS[k].icon} 로봇이 '${LABELS[k].name}'라고 볼 때 중요하게 보는 낱말</h4><div class="kw">${NB.keyWords(m, k).map(w => `<span>${esc(w)}</span>`).join('') || '<span>-</span>'}</div></div>`).join('')}</div>
      <p class="sub" style="margin-top:6px">이 낱말들이 정말 그 칸과 어울리나요? 상관없는 낱말(사람 이름, 장소 등)이 보이면 문장이 한쪽으로 치우친 거예요.</p>` : '';
    p.querySelector('#nbPatrol').disabled = !m;
    const pc = p.querySelector('#nbPatrolC'); if (pc) pc.disabled = !m;
  };
  const renderHist = () => {
    const runs = SAVE.robotRuns.slice(-12);
    p.querySelector('#nbHist').innerHTML = runs.length ? `<div class="hist">${runs.map(r => `<div title="${r.kind === 'story' ? '시험 마을' : '맵'} ${Math.round(r.acc * 100)}%" style="height:${Math.max(4, r.acc * 60)}px;background:${r.kind === 'story' ? 'var(--volt)' : 'var(--copper)'}"><span>${Math.round(r.acc * 100)}</span></div>`).join('')}</div>
      <p class="sub" style="margin-top:6px">노랑: 시험 마을 · 주황: 직접 만든 맵·친구 맵. 데이터를 고친 뒤 정확도가 어떻게 바뀌었나요?</p>` : '<p class="sub">아직 순찰 기록이 없어요.</p>';
  };
  const renderAll = () => { renderBuckets(); renderSrc(); renderModel(); renderHist(); };
  p.querySelector('#nbTrain').onclick = () => { SAVE.trainedData = JSON.parse(JSON.stringify(SAVE.train)); persist(); SND.ok(); toast('가르치기 완료! 로봇이 새 문장으로 배웠어요.', 'ok'); renderModel(); };
  p.querySelector('#nbAsk').onclick = () => {
    const m = trainedModel(), s = p.querySelector('#nbTry').value.trim();
    if (!m) return toast('먼저 ② 로봇 가르치기를 해요.', 'bad'); if (!s) return;
    const r = NB.predict(m, s), w = NB.explain(m, s, r.label);
    p.querySelector('#nbAns').innerHTML = `<div class="card">로봇의 판단: <span class="chip ${r.label}">${LABELS[r.label].icon} ${LABELS[r.label].name}</span> 확신 ${Math.round(r.p[r.label] * 100)}%
      ${r.p[r.label] < .5 ? ' · <b>잘 모르겠대요</b>' : ''}<br><small style="color:var(--text-dim)">${w.length ? `이렇게 판단한 낱말: ${w.map(esc).join(', ')}` : '아는 낱말이 거의 없어서 글자 조각으로 짐작했어요.'}</small>
      ${modelDirty() ? '<br><small style="color:var(--waste)">새로 넣은 문장은 아직 안 배웠어요. 다시 가르쳐요.</small>' : ''}</div>`;
  };
  p.querySelector('#nbTry').onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) p.querySelector('#nbAsk').click(); };
  const askPred = kind => {
    const n = kind === 'story' ? TEST_SCENES.length : WORLD.objects.filter(o => o.type === 'scene').length;
    if (kind === 'custom' && n < 1) return toast('이 맵에는 상황 카드가 없어요.', 'bad');
    p.querySelector('#nbPre').innerHTML = `<div class="card" style="margin-top:10px">${modelDirty() ? '<div class="warnbox" style="margin-bottom:8px">새로 넣은 문장은 아직 안 배웠어요. 마지막으로 가르친 로봇이 순찰해요.</div>' : ''}
      <b>먼저 예상해요.</b> 장면 ${n}개 중 로봇이 몇 개를 맞힐까요?
      <div class="row" style="margin-top:8px"><input id="nbPred" type="number" min="0" max="${n}" value="${Math.round(n * .7)}" style="width:80px" aria-label="예상 개수"> 개 <button class="btn volt" id="nbGo">순찰 시작</button></div></div>`;
    p.querySelector('#nbGo').onclick = () => startPatrol(kind, clamp(+p.querySelector('#nbPred').value || 0, 0, n));
  };
  p.querySelector('#nbPatrol').onclick = () => askPred('story');
  const pc = p.querySelector('#nbPatrolC'); if (pc) pc.onclick = () => askPred('custom');
  renderAll();
}
function startPatrol(kind, pred){
  const m = trainedModel(); if (!m) return toast('먼저 로봇을 가르쳐요.', 'bad');
  closePanel();
  if (kind === 'story' && (!WORLD || WORLD.kind !== 'story' || MODE !== 'play')) enterStory();
  let list, sx, sy;
  if (kind === 'story'){
    list = WORLD.objects.filter(o => o.type === 'test').map(o => ({obj:o, sc:TEST_SCENES.find(s => s.id === o.id)}));
    sx = 38.5; sy = 28.6;
  } else {
    list = WORLD.objects.filter(o => o.type === 'scene').map(o => ({obj:o, sc:{id:o.id, text:o.text, label:o.label, why:o.why, icon:o.icon}}));
    sx = WORLD.spawn.x; sy = WORLD.spawn.y;
  }
  const targets = list.map(({obj, sc}) => { const r = NB.predict(m, sc.text); return {obj, sc, label:r.label, p:r.p[r.label], words:NB.explain(m, sc.text, r.label)}; });
  $('#patrolBar').hidden = false; $('#patrolText').textContent = `AI 안전 로봇 순찰 중… (장면 ${targets.length}개)`;
  UI.waypoint = null;
  startRobot(sx, sy, targets, results => { $('#patrolBar').hidden = true; showPatrolResults(results, kind, pred); });
}
function showPatrolResults(results, kind, pred){
  const judged = results.filter(r => !r.unreachable), un = results.filter(r => r.unreachable);
  const ok = judged.filter(r => r.label === r.sc.label).length, n = judged.length, acc = n ? ok / n : 0;
  const size = SAVE.trainedData ? LABEL_KEYS.reduce((a, k) => a + SAVE.trainedData[k].length, 0) : 0;
  SAVE.robotRuns.push({kind, acc, n, ok, pred, size, time:Date.now()});
  let badge = '';
  if (kind === 'story'){
    SAVE.lastTest = {}; for (const r of judged) SAVE.lastTest[r.sc.id] = r.label;
    if (acc >= .7 && !SAVE.badges.es2){ SAVE.badges.es2 = true; badge = '<div class="okbox" style="margin-top:8px"><b>AI 안전 로봇 미션 성공!</b></div>'; }
    if (acc >= .85) badge += '<div class="okbox" style="margin-top:8px">⭐ <b>우수 로봇!</b> 처음 보는 장면도 잘 알아봤어요.</div>';
  } else if (n >= 3 && !SAVE.badges.es3){ SAVE.badges.es3 = true; badge = '<div class="okbox" style="margin-top:8px"><b>우리 동네 맵 미션 성공!</b> 직접 만든 맵에서 로봇을 시험했어요.</div>'; }
  persist(); acc >= .7 ? SND.ok() : SND.bad();
  const confusion = LABEL_KEYS.map(k => { const wrong = judged.filter(r => r.sc.label === k && r.label !== k).length; return wrong ? `${LABELS[k].name} 장면을 ${wrong}번 틀림` : ''; }).filter(Boolean).join(' · ');
  const p = openPanel(`<h2>순찰 결과${kind === 'custom' ? ` · ${esc(WORLD.title)}` : ' · 시험 마을'}</h2>
    <div class="row"><span class="big-score">${Math.round(acc * 100)}%</span><span>장면 ${n}개 중 <b>${ok}개</b>를 맞혔어요. 내 예상은 ${pred}개였어요.${confusion ? `<br><small style="color:var(--text-dim)">${confusion}</small>` : ''}</span></div>${badge}
    ${un.length ? `<div class="warnbox" style="margin-top:8px">로봇이 갈 수 없는 장면이 ${un.length}개 있었어요. 맵 점검으로 길을 확인해요.</div>` : ''}
    <div class="tblwrap" style="margin-top:10px"><table class="tbl"><thead><tr><th>장면 (로봇이 읽은 문장)</th><th>로봇의 판단</th><th>정답</th><th>결과</th></tr></thead><tbody>
      ${judged.map(r => `<tr><td>${esc(r.sc.icon || '')} ${esc(r.sc.text)}${r.sc.why ? `<br><small style="color:var(--text-dim)">${esc(r.sc.why)}</small>` : ''}</td>
        <td><span class="chip ${r.label}">${LABELS[r.label].name}</span> ${Math.round(r.p * 100)}%${r.words.length ? `<br><small style="color:var(--text-dim)">본 낱말: ${r.words.map(esc).join(', ')}</small>` : ''}</td>
        <td><span class="chip ${r.sc.label}">${LABELS[r.sc.label].name}</span></td><td class="${r.label === r.sc.label ? 'res-ok' : 'res-bad'}">${r.label === r.sc.label ? '✓' : '✗'}</td></tr>`).join('')}
    </tbody></table></div>
    <div class="fieldset" style="margin-top:12px"><label for="prNote">로봇이 틀린 까닭은 무엇일까요? 데이터가 부족했나요, 치우쳤나요? 어떤 문장을 더 가르치면 좋을까요?</label>
      <textarea id="prNote" rows="2" maxlength="240">${esc(SAVE.robotNote)}</textarea></div>
    <div class="row"><button class="btn primary" id="prFix">데이터 고치러 가기</button><button class="btn" data-close>닫기</button></div>`, {wide:true});
  p.querySelector('#prNote').oninput = e => { SAVE.robotNote = e.target.value; persist(); };
  p.querySelector('#prFix').onclick = openNBLab;
  checkMasters();
}
