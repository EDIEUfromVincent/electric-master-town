/* =========================================================
   6-0. 미니 게임 3D 무대
   미니 게임도 마을과 같은 블록 3D 화면에서 한다. 무대는 마을 남쪽 바깥에 있어 뒤로 마을이 보이고,
   카메라가 날아가 무대를 비춘다. 게임 글(위 막대 · 말풍선 · 단추)은 3D 화면 위에 떠 있다.
   WebGL이 없으면(예전 기기) 2D 그림판 게임으로 한다.
   ========================================================= */
const MG3 = {on:false, from:null, sc:null, area:{top:0, bot:0, h:1}};
const ST = {x:30, y:.06, z:56};
const mg3Ready = () => !!(G3.ok && !G3.lost && WORLD);
function S3(x, y, z, ry = 0, s = 1, sy = s){ return M4.trs(ST.x + x, ST.y + y, ST.z + z, ry, s, sy); }
function P3(x, y, z){ return proj3(ST.x + x, ST.y + y, ST.z + z); }
const mRZ = a => { const c = Math.cos(a), s = Math.sin(a), m = M4.I(); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; };
const mRX = a => { const c = Math.cos(a), s = Math.sin(a), m = M4.I(); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; };
const mSC = (x, y, z) => { const m = M4.I(); m[0] = x; m[5] = y; m[10] = z; return m; };
const mMul = (...ms) => ms.reduce((a, b) => M4.mul(a, b));
const M3 = (key, fn) => model('mg3:' + key, () => { const b = new VB(); fn(b); return b.mesh(); });
const BX = (b, x0, y0, z0, x1, y1, z1, col, emit = -1, tile = -1) => vbBox(b, Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1), Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1), col, emit, tile);
const D3 = (key, fn, x = 0, y = 0, z = 0, ry = 0, s = 1) => drawM(M3(key, fn), S3(x, y, z, ry, s));
const SH3 = (x, z, r, y = 0) => SHADOWS.push([ST.x + x, ST.y + y, ST.z + z, r]);
const FCUBE = () => model('mg3:fcube', () => flatCube([1, 1, 1, 1]));
/* 반투명 상자 (유리컵 · 목표 칸 · 빛) */
function fBox(U, x0, y0, z0, x1, y1, z1, rgba){ flatDraw(U, FCUBE(), mMul(S3(x0, y0, z0), mSC(x1 - x0, y1 - y0, z1 - z0)), rgba); }

/* ----- 방 (바닥 블록 + 뒤 벽 + 양옆 벽 일부) ----- */
function mkRoom3(b, o){
  const W = o.w / 2, D = o.d, H = o.h, fl = o.floor == null ? TX.floor : o.floor, wl = o.wall == null ? TX.wall : o.wall, sd = o.sideD == null ? 3 : o.sideD;
  for (let x = -W; x < W; x++) for (let z = -D; z < (o.front == null ? 7 : o.front); z++) vbBox(b, x, -.3, z, x + 1, 0, z + 1, o.floorCol || null, -1, fl);
  const wb = (x0, y0, z0, x1, y1, z1, y) => vbBox(b, x0, y0, z0, x1, y1, z1, o.wallCol || null, -1, y === 0 && o.base !== false ? TX.wallBase : wl);
  for (let x = -W; x < W; x++) for (let y = 0; y < H; y++) wb(x, y, -D - .3, x + 1, y + 1, -D, y);
  if (sd > 0) for (const sx of [-W - .3, W]) for (let z = -D; z < -D + sd; z++) for (let y = 0; y < H; y++) wb(sx, y, z, sx + .3, y + 1, z + 1, y);
  vbBox(b, -W - .3, H, -D - .3, W + .3, H + .2, -D, o.trim || '#cdbf9f');
  if (sd > 0) for (const sx of [-W - .3, W]) vbBox(b, sx, H, -D, sx + .3, H + .2, -D + sd, o.trim || '#cdbf9f');
}
function mkWindow3(b, x0, y0, x1, y1, z, sky = '#bfe6ff'){
  BX(b, x0, y0, z, x1, y1, z + .06, sky, 2);
  BX(b, x0 - .08, y0 - .08, z, x1 + .08, y0, z + .12, '#8a6a48'); BX(b, x0 - .08, y1, z, x1 + .08, y1 + .08, z + .12, '#8a6a48');
  BX(b, x0 - .08, y0, z, x0, y1, z + .12, '#8a6a48'); BX(b, x1, y0, z, x1 + .08, y1, z + .12, '#8a6a48');
  BX(b, (x0 + x1) / 2 - .04, y0, z, (x0 + x1) / 2 + .04, y1, z + .1, '#8a6a48'); BX(b, x0, (y0 + y1) / 2 - .04, z, x1, (y0 + y1) / 2 + .04, z + .1, '#8a6a48');
}
function mkOutlet3(b, cover){   /* 벽에 붙은 콘센트, 앞면이 +z */
  BX(b, -.16, -.2, 0, .16, .2, .05, '#fbfaf6');
  if (cover) BX(b, -.11, -.14, .05, .11, .14, .09, '#ffd23f');
  else { BX(b, -.08, -.03, .05, -.04, .03, .06, '#3a4048'); BX(b, .04, -.03, .05, .08, .03, .06, '#3a4048'); }
}
function mkPlug3(b, col = '#f4f6f8'){ BX(b, -.1, -.12, 0, .1, .12, .16, col); BX(b, -.06, -.02, -.08, -.04, .02, 0, '#9aa3ad'); BX(b, .04, -.02, -.08, .06, .02, 0, '#9aa3ad'); }
function mkDesk3(b, w = 1.4, d = .8, h = .78, top = '#c89b5e', leg = '#8f6a3a'){
  BX(b, -w / 2, h - .06, -d / 2, w / 2, h, d / 2, top);
  for (const x of [-w / 2 + .08, w / 2 - .08]) for (const z of [-d / 2 + .08, d / 2 - .08]) BX(b, x - .05, 0, z - .05, x + .05, h - .06, z + .05, leg);
}
/* 손 · 물방울처럼 작은 것은 블록 세상의 아이템 그림(빌보드)으로 */
function emo3(icon){ return g3Icon('e3:' + icon, (g, S) => { g.font = `${Math.round(S * .78)}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(icon, S / 2, S / 2 + S * .04); }); }
function spr3(x, y, z, icon, s = .32){ sprAdd(ST.x + x, ST.y + y, ST.z + z, emo3(icon), s); }
/* 에너지 소비 효율 등급 딱지 (빌보드) */
function elabel3(gr){
  return g3Icon('el3:' + gr, (g, S) => {
    g.fillStyle = '#ffffff'; rr(g, S * .16, S * .06, S * .68, S * .88, S * .06); g.fill(); g.strokeStyle = '#1c2733'; g.lineWidth = S * .03; g.stroke();
    for (let i = 0; i < 5; i++){ g.fillStyle = EL_COL[i]; g.fillRect(S * .22, S * (.14 + i * .12), S * (.2 + i * .06), S * .09); }
    const y = S * (.14 + (gr - 1) * .12); g.fillStyle = '#1c2733'; g.fillRect(S * .6, y - S * .01, S * .2, S * .11);
    g.fillStyle = '#fff'; g.font = `800 ${Math.round(S * .1)}px ${FONT_B}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(gr), S * .7, y + S * .045);
    g.fillStyle = '#1c2733'; g.font = `800 ${Math.round(S * .12)}px ${FONT_B}`; g.fillText(`${gr}등급`, S * .5, S * .84);
  });
}

/* ----- 화면 위 글 (2D 덧그림, 화면 좌표) ----- */
function mg3Tag(x, y, s, o = {}){
  const size = o.size || 13; ctx.font = `800 ${size}px ${FONT_B}`;
  const w = ctx.measureText(s).width + (o.pad || 14), h = size + 10;
  ctx.fillStyle = o.bg || 'rgba(21,32,43,.86)'; rr(ctx, x - w / 2, y - h / 2, w, h, 7); ctx.fill();
  if (o.border){ ctx.strokeStyle = o.border; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.fillStyle = o.col || '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y + 1);
  return w;
}
function tag3(x, y, z, s, o){ const p = P3(x, y, z); if (p.ok) mg3Tag(p.x, p.y, s, o); return p; }
function mark3(x, y, z, ok){ const p = P3(x, y, z); if (p.ok) drawBubble(p.x, p.y, ok ? '✓' : '✗', ok ? '#8ff0b9' : '#ffaaa1', '#1c2733'); return p; }
function mg3Bubble(px, py, text, o = {}){
  const size = o.size || 15, maxW = o.maxW || 230; ctx.font = `700 ${size}px ${FONT_B}`;
  const L = mgLines(ctx, text, maxW); if (!L.length) return;
  const w = Math.max(...L.map(l => ctx.measureText(l).width)) + 24, h = L.length * (size + 5) + 14;
  const cx = o.cx == null ? px : o.cx, x = clamp(cx - w / 2, 6, Math.max(6, CW - w - 6)), y = Math.max(4, py - h - 12), tx = clamp(px, x + 16, x + w - 16);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1c2733'; ctx.lineWidth = 2.5;
  rr(ctx, x, y, w, h, 12); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tx - 8, y + h - 1); ctx.lineTo(tx, y + h + 11); ctx.lineTo(tx + 8, y + h - 1); ctx.fill(); ctx.stroke();
  ctx.fillRect(tx - 7, y + h - 3, 14, 4);
  ctx.fillStyle = '#1c2733'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  L.forEach((l, i) => ctx.fillText(l, x + w / 2, y + 7 + (size + 5) * i + size / 2 + 1));
}

/* ----- 고르기: 물체의 화면 위치로 누른 곳 찾기 ----- */
function mg3Pick(list, sx, sy){
  let best = null, bd = 1e9;
  for (const o of list){
    if (o.skip) continue;
    const p = P3(o.x, o.y, o.z); if (!p.ok) continue;
    const q = P3(o.x + (o.r || .5), o.y, o.z), rp = Math.max(22, Math.abs(q.x - p.x) * 1.15), d = Math.hypot(p.x - sx, p.y - sy);
    if (d < rp && d < bd){ bd = d; best = o; }
  }
  return best;
}
/* 화면 x를 3D 선분(a→b) 위의 비율로 */
function mg3LineT(sx, a, b){ const pa = P3(a[0], a[1], a[2]), pb = P3(b[0], b[1], b[2]); return clamp((sx - pa.x) / ((pb.x - pa.x) || 1), 0, 1); }

/* ----- 카메라: 무대가 게임 글 사이의 빈 곳에 꽉 차게 ----- */
function mg3Area(){
  const r = $('#mgBox').getBoundingClientRect();
  MG3.area = r.height > 0 ? {top:r.top, bot:Math.max(0, CH - r.bottom), h:r.height} : {top:0, bot:0, h:CH};
  return MG3.area;
}
function mg3CamParams(){
  const c = MG3.sc.cam, asp = G3.W / Math.max(1, G3.H), fov = asp < 1 ? Math.min(1.3, .8 / Math.sqrt(Math.max(.4, asp))) : .8, tf = Math.tan(fov / 2);
  const A = mg3Area(), frac = clamp(A.h / Math.max(1, CH), .25, 1);
  const dist = Math.max((c.w / 2) / (tf * asp), (c.h / 2) / (tf * frac)) * (c.k || 1.06);
  return {tx:ST.x + c.x, ty:ST.y + c.y, tz:ST.z + c.z, yaw:c.yaw || 0, pitch:(c.pitch == null ? .3 : c.pitch) + (asp < 1 ? .14 : 0), dist,
    sy:clamp((A.bot - A.top) / Math.max(1, CH) + (c.sy || 0), -.7, .7)};
}

/* ----- 들어가기 · 나오기 ----- */
function mg3Enter(sc){
  if (!mg3Ready() || !sc) return false;
  if (!MG3.on){
    MG3.from = MODE; MG3.on = true; MODE = 'mg3';
    showHUD(false); $('#title').hidden = true; KEYS.clear(); JOY.x = JOY.y = 0; PATH3.nodes = null; NEAR = null;
    ST.x = Math.round(WORLD.w / 2); ST.z = WORLD.h + 12;
  }
  MG3.sc = sc; $('#mg').classList.add('d3');
  return true;
}
function mg3Leave(){
  $('#mg').classList.remove('d3');
  if (!MG3.on) return;
  MG3.on = false; MG3.sc = null;
  const from = MG3.from;
  if (from === 'title') showTitle();
  else { MODE = 'play'; showHUD(true); updateHUD(); }
  cam3Snap();
}
/* world3d.js의 그리기 순서 안에서 부른다 */
function mg3Draw(env, dt){ fxUpdate(dt || 0); const sc = MG3.sc; if (sc && sc.draw) try { sc.draw(TIME, dt); } catch (e) { console.error(e); } }
function mg3Flats(U){ const sc = MG3.sc; if (sc && sc.flats) try { sc.flats(U); } catch (e) { console.error(e); } }
function mg3Overlay(){ const sc = MG3.sc; if (sc && sc.overlay) try { sc.overlay(); } catch (e) { console.error(e); } fxDraw(); }
function mg3Lights(){
  addLight(ST.x - 4.5, ST.y + 4.3, ST.z + .8, 13, [1, .97, .9]); addLight(ST.x + 4.5, ST.y + 4.3, ST.z + .8, 13, [1, .97, .9]);
  addLight(ST.x, ST.y + 3.2, ST.z + 4.2, 12, [1, .95, .86]);
  const sc = MG3.sc; if (sc && sc.lights) sc.lights((x, y, z, lv, c) => addLight(ST.x + x, ST.y + y, ST.z + z, lv, c));
}
function mgPointer3(type, e){ if (MG.ptr && MG.ptr[type]) MG.ptr[type](e.clientX, e.clientY, e); }
/* 3D 장면 그대로 그림 파일 만들기: 같은 일 안에서 다시 그린 뒤 바로 옮겨 담는다 */
function mg3Snapshot(){
  render3D(0);
  const A = MG3.area, gW = G3.cv.width, gH = G3.cv.height, s = gH / Math.max(1, CH), top = Math.round(A.top * s), h = Math.max(1, Math.round(A.h * s));
  const c = mkCanvas(gW, h), g = c.getContext('2d');
  g.drawImage(G3.cv, 0, top, gW, h, 0, 0, gW, h);
  const oc = ctx.canvas, so = oc.height / Math.max(1, CH);
  g.drawImage(oc, 0, Math.round(A.top * so), oc.width, Math.round(A.h * so), 0, 0, gW, h);
  return c;
}

/* ----- 여러 게임이 같이 쓰는 모형 ----- */
function mkClip3(b, col = '#aab3bd'){
  const t = .02, L = .32, W = .12;
  BX(b, -L / 2, 0, -t, L / 2, t * 2, t, col); BX(b, -L / 2, W - t * 2, -t, L / 2, W, t, col);
  BX(b, -L / 2, 0, -t, -L / 2 + t * 2, W, t, col); BX(b, L / 2 - t * 2, 0, -t, L / 2, W, t, col);
  BX(b, -L / 2 + .045, .026, -t, L / 2 - .03, .026 + t * 2, t, col); BX(b, -L / 2 + .045, W - .026 - t * 2, -t, L / 2 - .07, W - .026, t, col);
  BX(b, -L / 2 + .045, .026, -t, -L / 2 + .045 + t * 2, W - .026, t, col);
}
const CLIP = () => M3('clip', b => mkClip3(b));
function clipFlat(x, y, z, r){ drawM(CLIP(), mMul(S3(x, y, z, r), mRX(-Math.PI / 2))); }
function clipHang(x, y, z, r){ drawM(CLIP(), mMul(S3(x, y, z), mRZ(Math.PI / 2 + r))); }
function mkPersonAt(look, x, z, ry = 0){ person3(look, ST.x + x, ST.y, ST.z + z, ry, 0); SH3(x, z, .38); }

/* ----- 박진감: 효과음 · 점수 팝업 · 콤보 큰 글씨 · 흔들림 · 번쩍임 · 불꽃 · 10초 초읽기 ----- */
const FX3 = {pops:[], banners:[], shk:0, flash:null, lastSec:null};
const SFX = {
  ac(){ SND.ac = SND.ac || new (window.AudioContext || window.webkitAudioContext)(); return SND.ac; },
  tone(f, d, type = 'square', v = .05, slide = 0, delay = 0){
    if (!SAVE.sound) return;
    try { const ac = this.ac(), t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + .03); } catch (e) {}
  },
  noise(d = .2, v = .08, hp = 800, delay = 0){
    if (!SAVE.sound) return;
    try { const ac = this.ac(), t = ac.currentTime + delay, n = Math.max(1, Math.floor(ac.sampleRate * d)), buf = ac.createBuffer(1, n, ac.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = buf; f.type = 'highpass'; f.frequency.value = hp; g.gain.value = v;
      s.connect(f); f.connect(g); g.connect(ac.destination); s.start(t); } catch (e) {}
  },
  clink(){ this.tone(2100 + Math.random() * 700, .06, 'triangle', .045); },
  plop(){ this.tone(420, .12, 'sine', .08, 380); },
  whoosh(){ this.noise(.2, .06, 1400); },
  zap(){ this.tone(150, .22, 'sawtooth', .045, 260); this.noise(.12, .03, 3000); },
  clatter(){ for (let i = 0; i < 4; i++) this.tone(1500 + Math.random() * 1000, .05, 'triangle', .035, 0, i * .055); },
  combo(n){ for (let i = 0; i < Math.min(6, n + 2); i++) this.tone(523 * Math.pow(1.19, i), .1, 'square', .045, 0, i * .065); },
  tick(){ this.tone(1320, .035, 'square', .04); },
  boom(){ this.noise(.4, .14, 90); this.tone(95, .32, 'sine', .12, -55); },
  buzz(){ this.tone(120, .3, 'sawtooth', .05); },
  ping(){ this.tone(1560, .08, 'sine', .05); },
  win(){ [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, .15, 'square', .05, 0, i * .09)); },
};
function fxPop(x, y, z, text, col = '#ffd23f', size = 22){ if (MG3.on) FX3.pops.push({x, y, z, text, col, size, t:0}); }
function fxBanner(text, col = '#ffd23f', dur = 1.1, size = 46){ FX3.banners = [{text, col, dur, size, t:0}]; }
function fxBurst(x, y, z, n = 24, cols = ['#ffd23f', '#8ff0b9', '#7cc6ff', '#ff9ad5'], sp = 2.2, sz = .08){
  if (!MG3.on) return;
  for (let k = 0; k < n; k++){
    const c = rgb(cols[k % cols.length]), u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u), s = sp * (.45 + Math.random() * .75);
    STORYFX.fw3.push({x:ST.x + x, y:ST.y + y, z:ST.z + z, vx:r * Math.cos(th) * s, vy:Math.abs(u) * s + .9, vz:r * Math.sin(th) * s * .6, life:.55 + Math.random() * .55, max:1.1, c, sz});
  }
}
function fxShake(a = .15){ FX3.shk = Math.max(FX3.shk, a); }
function fxFlash(col = '#ffffff', a = .35){ FX3.flash = {col, a}; }
function fxReset(){ FX3.pops = []; FX3.banners = []; FX3.shk = 0; FX3.flash = null; FX3.lastSec = null; const el = $('#mgStat'); if (el) el.classList.remove('urgent'); }
function fxUpdate(dt){
  for (const p of FX3.pops) p.t += dt; FX3.pops = FX3.pops.filter(p => p.t < 1.1);
  for (const b of FX3.banners) b.t += dt; FX3.banners = FX3.banners.filter(b => b.t < b.dur);
  FX3.shk = Math.max(0, FX3.shk - dt * .8);
  if (FX3.flash){ FX3.flash.a -= dt * 1.8; if (FX3.flash.a <= 0) FX3.flash = null; }
}
function fxDraw(){
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const p of FX3.pops){
    const q = P3(p.x, p.y + p.t * .9, p.z); if (!q.ok) continue;
    ctx.globalAlpha = clamp(1.4 - p.t * 1.3, 0, 1); ctx.font = `${p.size}px ${FONT_D}`; ctx.lineWidth = 5; ctx.strokeStyle = '#1c2733';
    ctx.strokeText(p.text, q.x, q.y); ctx.fillStyle = p.col; ctx.fillText(p.text, q.x, q.y);
  }
  ctx.globalAlpha = 1;
  for (const b of FX3.banners){
    const A = MG3.area, k = b.t / b.dur, sc = k < .14 ? .5 + k / .14 * .65 : 1.15 - Math.min(1, (k - .14) / .3) * .15;
    ctx.save(); ctx.globalAlpha = k > .78 ? Math.max(0, 1 - (k - .78) / .22) : 1; ctx.translate(CW / 2, A.top + A.h * .32); ctx.scale(sc, sc);
    ctx.font = `${b.size}px ${FONT_D}`; ctx.lineWidth = 9; ctx.strokeStyle = '#1c2733'; ctx.strokeText(b.text, 0, 0); ctx.fillStyle = b.col; ctx.fillText(b.text, 0, 0); ctx.restore();
  }
  if (FX3.flash){ ctx.globalAlpha = clamp(FX3.flash.a, 0, 1); ctx.fillStyle = FX3.flash.col; ctx.fillRect(0, 0, CW, CH); ctx.globalAlpha = 1; }
}
/* 초읽기: 10초부터 째깍째깍, 3·2·1은 큰 글씨, 남은 시간이 빨갛게 뛴다 */
function mgClock(t){
  const s = Math.max(0, Math.ceil(t)), el = $('#mgStat');
  if (s <= 10 && s > 0 && FX3.lastSec !== s){ FX3.lastSec = s; SFX.tick(); if (s <= 3) fxBanner(String(s), '#ff8a80', .75, 70); }
  if (el) el.classList.toggle('urgent', s <= 10 && s > 0);
  return `⏱ ${s}초`;
}
/* 3D 막대: 두 점을 잇는 가는 상자 (케이블 · 레일) */
function bar3(key, col, ax, ay, bx, by, z = 0, w = .025){
  const len = Math.hypot(bx - ax, by - ay); if (len < .001) return;
  drawM(M3('bar:' + key, b => BX(b, 0, -w, -w, 1, w, w, col)), mMul(S3(ax, ay, z), mRZ(Math.atan2(by - ay, bx - ax)), mSC(len, 1, 1)));
}
