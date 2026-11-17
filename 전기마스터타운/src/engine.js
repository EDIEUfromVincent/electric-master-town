/* =========================================================
   2. 엔진 — 화면 크기, 스프라이트, 그리기, 이동·충돌, 자동차, 로봇
   ========================================================= */
const cv = document.getElementById('world');
const ctx = cv.getContext('2d');
let DPR = 1, CW = 0, CH = 0, TS = 40;
let MODE = 'title';           // title | play | patrol | editor | crane | mg3 | epi | gate(구역 문·포털을 지나는 중)
let WORLD = null;
let TIME = 0;
const SPR = new Map();
const MINI = {base:null, big:false};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Segoe UI Symbol",sans-serif';
const FONT_D = '"Do Hyeon","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif';
const FONT_B = '"Nanum Gothic","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif';

function resizeCanvas(){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  CW = window.innerWidth; CH = window.innerHeight;
  cv.width = Math.round(CW * DPR); cv.height = Math.round(CH * DPR);
  TS = Math.round(clamp(Math.min(CW / 21, CH / 13), 30, 54));
  SPR.clear(); MINI.base = null;
}

function hash2(x, y, s){
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function shade(hex, amt){
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0){ r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
function mkCanvas(w, h){ const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
function rr(g, x, y, w, h, r){
  r = Math.min(r, w / 2, h / 2);
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/* ----- 바닥 타일 스프라이트 (블록 질감) ----- */
function groundSprite(ch, v){
  const key = 'g' + ch + v; let c = SPR.get(key); if (c) return c;
  const d = TILES[ch] || TILES['.'];
  const P = Math.round(TS * DPR); c = mkCanvas(P, P); const g = c.getContext('2d');
  const n = 8, cs = P / n, seed = ch.charCodeAt(0) * 7 + v * 131;
  g.fillStyle = d.c; g.fillRect(0, 0, P, P);
  const cell = (i, j, col) => { g.fillStyle = col; g.fillRect(Math.floor(i * cs), Math.floor(j * cs), Math.ceil(cs), Math.ceil(cs)); };
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
    const r = hash2(i, j, seed);
    if (d.pat === 'road') { if (r < .14) cell(i, j, d.c2); }
    else if (d.pat === 'water' || d.pat === 'wood' || d.pat === 'door') { if (r < .15) cell(i, j, d.c2); }
    else { if (r < .3) cell(i, j, d.c2); else if (r > .93) cell(i, j, shade(d.c, .12)); }
  }
  g.lineWidth = Math.max(1, P / 40);
  if (d.pat === 'brick'){
    g.strokeStyle = shade(d.c, -.16);
    for (let k = 0; k < 4; k++){
      const y = Math.round(k * P / 4) + .5; g.beginPath(); g.moveTo(0, y); g.lineTo(P, y); g.stroke();
      const off = (k % 2) * P / 4;
      for (let x = off; x < P; x += P / 2){ g.beginPath(); g.moveTo(Math.round(x) + .5, y); g.lineTo(Math.round(x) + .5, y + P / 4); g.stroke(); }
    }
  }
  if (d.pat === 'wood' || d.pat === 'door'){
    g.strokeStyle = shade(d.c, -.18);
    for (let k = 1; k < 4; k++){ const y = Math.round(k * P / 4) + .5; g.beginPath(); g.moveTo(0, y); g.lineTo(P, y); g.stroke(); }
    for (let k = 0; k < 4; k++){ const x = Math.round(((k * 3 + v * 5) % 8) * P / 8) + .5; g.beginPath(); g.moveTo(x, k * P / 4); g.lineTo(x, (k + 1) * P / 4); g.stroke(); }
  }
  if (d.pat === 'door'){
    g.strokeStyle = '#6b4523'; g.lineWidth = P / 12; g.strokeRect(P * .1, P * .1, P * .8, P * .8);
    g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(P * .72, P * .5, P * .06, 0, 7); g.fill();
  }
  if (d.pat === 'gravel'){
    for (let k = 0; k < 16; k++){ g.fillStyle = k % 2 ? shade(d.c, -.22) : shade(d.c, .18); g.fillRect(hash2(k, v, 9) * P, hash2(v, k, 11) * P, P / 16, P / 16); }
  }
  if (d.pat === 'flower'){
    const cols = ['#ff6b6b', '#ffd23f', '#ffffff', '#c58bff'];
    for (let k = 0; k < 3; k++){
      const x = (.15 + hash2(k, v, 3) * .7) * P, y = (.15 + hash2(v, k, 5) * .7) * P;
      g.fillStyle = cols[(k + v) % 4]; g.fillRect(x - P / 14, y - P / 14, P / 7, P / 7);
      g.fillStyle = '#fff1a0'; g.fillRect(x - P / 36, y - P / 36, P / 18, P / 18);
    }
  }
  if (d.pat === 'grass'){
    g.fillStyle = shade(d.c, -.18);
    for (let k = 0; k < 3; k++) g.fillRect(hash2(k, v, 21) * P, hash2(v, k, 23) * P, P / 28, P / 9);
  }
  SPR.set(key, c); return c;
}

/* ----- 블록 (벽·건물·울타리·선로) ----- */
function blockTopSprite(ch){
  const key = 't' + ch; let c = SPR.get(key); if (c) return c;
  const d = TILES[ch]; const P = Math.round(TS * DPR); c = mkCanvas(P, P); const g = c.getContext('2d');
  g.fillStyle = d.c; g.fillRect(0, 0, P, P);
  const n = 8, cs = P / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
    if (hash2(i, j, ch.charCodeAt(0)) < .22){ g.fillStyle = d.c2; g.fillRect(Math.floor(i * cs), Math.floor(j * cs), Math.ceil(cs), Math.ceil(cs)); }
  }
  if (d.pat === 'building'){ g.strokeStyle = shade(d.c, -.22); g.lineWidth = P / 18; g.strokeRect(P * .12, P * .12, P * .76, P * .76); }
  if (d.pat === 'fence'){ g.fillStyle = shade(d.c, -.2); g.fillRect(0, P * .44, P, P * .12); g.fillRect(P * .42, 0, P * .16, P); }
  if (d.pat === 'rail'){
    g.fillStyle = '#5b4a3a'; for (let k = 0; k < 4; k++) g.fillRect(k * P / 4 + P / 16, P * .12, P / 8, P * .76);
    g.fillStyle = '#d3d8df'; g.fillRect(0, P * .26, P, P / 11); g.fillRect(0, P * .64, P, P / 11);
  }
  SPR.set(key, c); return c;
}
function blockFrontSprite(ch){
  const key = 'f' + ch; let c = SPR.get(key); if (c) return c;
  const d = TILES[ch]; const P = Math.round(TS * DPR), H = Math.max(2, Math.round(TS * d.h * DPR));
  c = mkCanvas(P, H); const g = c.getContext('2d');
  g.fillStyle = d.side; g.fillRect(0, 0, P, H);
  g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(0, H - Math.max(2, H * .14), P, Math.max(2, H * .14));
  if (d.pat === 'building'){
    const ww = P * .24, wh = H * .3;
    for (let k = 0; k < 2; k++){ g.fillStyle = '#cfe6ff'; g.fillRect(P * (.14 + k * .48), H * .2, ww, wh); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(P * (.14 + k * .48), H * .2, ww * .35, wh); }
  }
  if (d.pat === 'wall'){ g.fillStyle = shade(d.side, .12); g.fillRect(0, 0, P, Math.max(1, H * .12)); }
  if (d.pat === 'fence'){ g.fillStyle = shade(d.side, -.2); for (let k = 0; k < 4; k++) g.fillRect(k * P / 4, 0, Math.max(1, P / 30), H); }
  SPR.set(key, c); return c;
}
function treeSprite(v){
  const key = 'tree' + v; let c = SPR.get(key); if (c) return c;
  const P = Math.round(TS * DPR), H = Math.round(P * 1.9); c = mkCanvas(P, H); const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(P / 2, H - P * .2, P * .44, P * .16, 0, 0, 7); g.fill();
  g.fillStyle = '#7a5230'; g.fillRect(P * .4, H - P * .78, P * .2, P * .62);
  g.fillStyle = '#5e3e22'; g.fillRect(P * .52, H - P * .78, P * .08, P * .62);
  const top = H - P * 1.75, cs = P / 6;
  for (let j = 0; j < 7; j++) for (let i = 0; i < 6; i++){
    const dx = i - 2.5, dy = j - 3; if (dx * dx / 7.6 + dy * dy / 11 > 1) continue;
    const r = hash2(i, j, v * 3 + 1);
    g.fillStyle = r < .25 ? '#2f7f2c' : r > .86 ? '#62c552' : (j > 4 ? '#2f7f2c' : '#3f9b3a');
    g.fillRect(Math.floor(i * cs), Math.floor(top + j * cs), Math.ceil(cs), Math.ceil(cs));
  }
  SPR.set(key, c); return c;
}
function tileAt(x, y){ const W = WORLD; if (!W || x < 0 || y < 0 || x >= W.w || y >= W.h) return null; return W.tiles[y][x]; }
function drawBlock(ch, x, y, S){
  const d = TILES[ch];
  if (d.pat === 'tree'){ ctx.drawImage(treeSprite((x * 3 + y) & 1), x * S, (y + 1) * S - S * 1.9, S, S * 1.9); return; }
  const H = d.h * S;
  ctx.drawImage(blockTopSprite(ch), x * S, y * S - H, S, S);
  const below = tileAt(x, y + 1), bd = below && TILES[below];
  if (!(bd && bd.h >= d.h && bd.pat !== 'tree')) ctx.drawImage(blockFrontSprite(ch), x * S, y * S + S - H, S, H);
  if (d.pat === 'wall' || d.pat === 'building'){
    ctx.fillStyle = 'rgba(30,30,30,.22)';
    const same = (xx, yy) => tileAt(xx, yy) === ch;
    if (!same(x, y - 1)) ctx.fillRect(x * S, y * S - H, S, 2);
    if (!same(x - 1, y)) ctx.fillRect(x * S, y * S - H, 2, S);
    if (!same(x + 1, y)) ctx.fillRect(x * S + S - 2, y * S - H, 2, S);
  }
}

/* ----- 기기 아이콘 (그림으로 그리는 것) ----- */
const DEV_DRAWN = ['fan', 'washer', 'drone', 'dryer', 'mri', 'robovac'];
function drawDevIcon(g, id, cx, cy, s, t){
  g.save(); g.translate(cx, cy); const u = s / 40; g.scale(u, u); g.lineJoin = 'round'; g.lineCap = 'round';
  if (id === 'fan'){
    g.fillStyle = '#5b6573'; g.fillRect(-3, 6, 6, 12); g.fillRect(-11, 16, 22, 4);
    g.fillStyle = '#eef3f8'; g.beginPath(); g.arc(0, -4, 14, 0, 7); g.fill(); g.strokeStyle = '#5b6573'; g.lineWidth = 2.5; g.stroke();
    g.save(); g.translate(0, -4); g.rotate(t * 9); g.fillStyle = '#3a8ee6';
    for (let i = 0; i < 3; i++){ g.rotate(Math.PI * 2 / 3); g.beginPath(); g.ellipse(0, -6.5, 3.8, 6.5, 0, 0, 7); g.fill(); }
    g.restore(); g.fillStyle = '#5b6573'; g.beginPath(); g.arc(0, -4, 2.6, 0, 7); g.fill();
  } else if (id === 'washer'){
    g.fillStyle = '#f4f6f8'; rr(g, -15, -17, 30, 34, 4); g.fill(); g.strokeStyle = '#7d8a97'; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = '#7d8a97'; g.fillRect(-15, -11, 30, 2.5); g.fillStyle = '#e5483a'; g.fillRect(8, -15, 4, 2.5);
    g.fillStyle = '#4f8fd6'; g.beginPath(); g.arc(0, 4, 9.5, 0, 7); g.fill(); g.strokeStyle = '#c9d4de'; g.lineWidth = 3; g.stroke();
    g.save(); g.translate(0, 4); g.rotate(Math.sin(t * 3) * 2.4); g.strokeStyle = '#d6ecff'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 5, 0, 3.6); g.stroke(); g.restore();
  } else if (id === 'drone'){
    g.strokeStyle = '#39424e'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-12, -9); g.lineTo(12, 9); g.moveTo(12, -9); g.lineTo(-12, 9); g.stroke();
    g.fillStyle = '#eef3f8'; rr(g, -7, -6, 14, 12, 3); g.fill(); g.lineWidth = 2; g.stroke();
    g.fillStyle = '#e2782b'; g.fillRect(-2, -2, 4, 4);
    for (const [x, y] of [[-12, -9], [12, -9], [-12, 9], [12, 9]]){ g.save(); g.translate(x, y); g.rotate(t * 22); g.fillStyle = 'rgba(58,142,230,.6)'; g.beginPath(); g.ellipse(0, 0, 8.5, 2.6, 0, 0, 7); g.fill(); g.restore(); }
  } else if (id === 'dryer'){
    g.fillStyle = '#e05a8a'; rr(g, -16, -11, 26, 15, 7); g.fill();
    g.fillStyle = '#c4416f'; rr(g, -6, 1, 9, 17, 3); g.fill();
    g.fillStyle = '#39424e'; g.fillRect(8, -9, 4, 11);
    g.strokeStyle = 'rgba(90,160,240,.9)'; g.lineWidth = 2;
    for (let i = 0; i < 3; i++){ const o = (t * 30 + i * 6) % 14; g.beginPath(); g.moveTo(14 + o, -7 + i * 4); g.lineTo(18 + o, -7 + i * 4); g.stroke(); }
  } else if (id === 'mri'){
    g.fillStyle = '#eef3f8'; g.beginPath(); g.arc(-3, -3, 16, 0, 7); g.fill(); g.strokeStyle = '#7d8a97'; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = '#26303b'; g.beginPath(); g.arc(-3, -3, 7.5, 0, 7); g.fill();
    g.fillStyle = '#9fb3c8'; g.fillRect(-3, 1, 23, 6); g.fillStyle = '#3a8ee6'; g.fillRect(-15, 11, 7, 3);
  } else if (id === 'robovac'){
    g.fillStyle = '#d5dbe2'; g.beginPath(); g.arc(0, 0, 15, 0, 7); g.fill(); g.strokeStyle = '#6f7b88'; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = '#39424e'; g.beginPath(); g.arc(0, 1, 8.5, 0, 7); g.fill();
    g.fillStyle = Math.sin(t * 4) > 0 ? '#25a862' : '#1d6f45'; g.beginPath(); g.arc(0, -10, 2.6, 0, 7); g.fill();
  }
  g.restore();
}
const DEV_URL = {};
function devIconURL(id){
  if (DEV_URL[id]) return DEV_URL[id];
  const c = mkCanvas(96, 96); drawDevIcon(c.getContext('2d'), id, 48, 50, 84, .4);
  return (DEV_URL[id] = c.toDataURL());
}
function devIconHTML(icon, cls = ''){
  return DEV_DRAWN.includes(icon) ? `<img class="${cls}" src="${devIconURL(icon)}" alt="">` : `<div class="emo ${cls}">${esc(icon || '⚡')}</div>`;
}
function emojiCount(str){ return [...(str || '')].filter(ch => ch !== '️' && ch !== '‍').length; }
function drawEmoji(str, x, y, size){
  const n = emojiCount(str); const sz = n >= 3 ? size * .52 : n === 2 ? size * .7 : size;
  ctx.font = `${Math.round(sz)}px ${EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#1c2733';
  ctx.fillText(str, x, y);
}

/* ----- 사람·로봇·자동차 ----- */
const LOOKS = {
  player: {shirt:'#2d4f7c', pants:'#2a3341', skin:'#f2c9a0', hat:'#ffd23f', vest:'#ff8a2a', hair:'#3a2a1d'},
  doctor: {shirt:'#f4f6f8', pants:'#4a5563', skin:'#f0c8a0', hair:'#d5d9df', coat:true},
  worker: {shirt:'#2f6fb4', pants:'#264f80', skin:'#e9bd92', hat:'#e2782b', hair:'#3a2a1d'},
  guard:  {shirt:'#2f9e5b', pants:'#2a3341', skin:'#f2c9a0', hat:'#2f9e5b', vest:'#d4f03a', hair:'#3a2a1d'},
  guide:  {shirt:'#7a5cc7', pants:'#2a3341', skin:'#f0c8a0', hair:'#2a1d14'},
  kidSun:  {shirt:'#ffb347', pants:'#3d5a80', skin:'#f6d0a8', hair:'#5a3a22', scale:.82},
  kidMoon: {shirt:'#8fa8ff', pants:'#2a3341', skin:'#f1c9a0', hair:'#1d1d2b', scale:.82},
  kidStar: {shirt:'#ffe066', pants:'#6a4c93', skin:'#ecc19a', hair:'#2a1d14', hat:'#ffe066', scale:.82},
  reporter:{shirt:'#ffffff', pants:'#3a5a8c', skin:'#f6d0a8', hair:'#5a3a22', hat:'#e5483a', scale:.82},
  student: {shirt:'#4fae45', pants:'#2a3341', skin:'#f1c9a0', hair:'#2a1d14', scale:.82},
  grandma: {shirt:'#c58bff', pants:'#5a4a6a', skin:'#f0c8a0', hair:'#e8e8e8'},
  tech:    {shirt:'#455a64', pants:'#2a3341', skin:'#e9bd92', hat:'#ffd23f', hair:'#3a2a1d'},
  mayor:   {shirt:'#2b3a55', pants:'#1f2633', skin:'#f0c8a0', hair:'#6b6b6b', vest:'#e5483a'},
  driver:  {shirt:'#2fb36b', pants:'#2a3341', skin:'#e9bd92', hat:'#1f8a4c', hair:'#2a1d14'},
};
function drawPerson(px, py, S, look, dir, walk){
  const L = LOOKS[look] || LOOKS.player; const u = S / 40 * (L.scale || 1);
  ctx.save(); ctx.translate(px, py); ctx.scale(u, u);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 4.5, 0, 0, 7); ctx.fill();
  const sw = walk ? Math.sin(walk * 14) * 2.5 : 0, a = Math.max(0, sw), b = Math.max(0, -sw);
  ctx.fillStyle = L.pants; ctx.fillRect(-6, -11 + a, 5, 11 - a); ctx.fillRect(1, -11 + b, 5, 11 - b);
  ctx.fillStyle = L.coat ? '#f4f6f8' : L.shirt; ctx.fillRect(-8, -25, 16, 15);
  if (L.vest){ ctx.fillStyle = L.vest; ctx.fillRect(-8, -25, 16, 13); ctx.fillStyle = '#fff7c2'; ctx.fillRect(-8, -18, 16, 2); ctx.fillStyle = L.shirt; ctx.fillRect(-2, -25, 4, 5); }
  if (L.coat){ ctx.fillStyle = '#cfd6de'; ctx.fillRect(-1, -25, 2, 15); ctx.fillStyle = '#3a8ee6'; ctx.fillRect(-6, -22, 3, 4); }
  ctx.fillStyle = L.coat ? '#e6eaef' : L.shirt; ctx.fillRect(-12, -24 - sw * .6, 4, 12); ctx.fillRect(8, -24 + sw * .6, 4, 12);
  ctx.fillStyle = L.skin; ctx.fillRect(-12, -13 - sw * .6, 4, 3); ctx.fillRect(8, -13 + sw * .6, 4, 3);
  ctx.fillStyle = L.skin; ctx.fillRect(-7, -38, 14, 13);
  ctx.fillStyle = L.hair; if (dir === 'up') ctx.fillRect(-7, -38, 14, 11); else ctx.fillRect(-7, -38, 14, 4);
  if (L.hat){
    ctx.fillStyle = L.hat; ctx.fillRect(-8, -42, 16, 6);
    if (dir === 'down') ctx.fillRect(-8, -36, 16, 2); else if (dir === 'left') ctx.fillRect(-11, -37, 8, 2); else if (dir === 'right') ctx.fillRect(3, -37, 8, 2);
  }
  ctx.fillStyle = '#1c2733';
  if (dir === 'down'){ ctx.fillRect(-4, -31, 2, 3); ctx.fillRect(2, -31, 2, 3); }
  else if (dir === 'left') ctx.fillRect(-5, -31, 2, 3);
  else if (dir === 'right') ctx.fillRect(3, -31, 2, 3);
  ctx.restore();
}
function drawRobot(px, py, S, t){
  const u = S / 40; ctx.save(); ctx.translate(px, py); ctx.scale(u, u);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 4.5, 0, 0, 7); ctx.fill();
  const b = Math.sin(t * 8) * 1.2;
  ctx.fillStyle = '#39424e'; ctx.fillRect(-10, -6, 6, 6); ctx.fillRect(4, -6, 6, 6);
  ctx.strokeStyle = '#6f7b88'; ctx.lineWidth = 2;
  ctx.fillStyle = '#d5dbe2'; rr(ctx, -11, -24 + b, 22, 19, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(-4, -17 + b, 8, 5);
  ctx.fillStyle = '#eef3f8'; rr(ctx, -9, -37 + b, 18, 13, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1b2a3a'; rr(ctx, -7, -34 + b, 14, 7, 3); ctx.fill();
  ctx.fillStyle = '#3ee0ff'; ctx.fillRect(-5, -32 + b, 3, 3); ctx.fillRect(2, -32 + b, 3, 3);
  ctx.beginPath(); ctx.moveTo(0, -37 + b); ctx.lineTo(0, -43 + b); ctx.stroke();
  ctx.fillStyle = Math.sin(t * 6) > 0 ? '#ff5a4f' : '#ffd23f'; ctx.beginPath(); ctx.arc(0, -44 + b, 2.6, 0, 7); ctx.fill();
  ctx.restore();
}
function carXY(c){ return c.axis === 'x' ? [c.pos, c.lane] : [c.lane, c.pos]; }
function drawCar(c, S){
  const [x, y] = carXY(c); ctx.save(); ctx.translate(x * S, y * S);
  if (c.axis === 'y') ctx.rotate(Math.PI / 2);
  if (c.dir < 0) ctx.rotate(Math.PI);
  const L = 1.5 * S, Wd = .76 * S;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(ctx, -L / 2 + 2, -Wd / 2 + 4, L, Wd, S * .18); ctx.fill();
  ctx.fillStyle = c.color; rr(ctx, -L / 2, -Wd / 2, L, Wd, S * .18); ctx.fill();
  ctx.fillStyle = shade(c.color, -.25); rr(ctx, -L * .22, -Wd * .36, L * .42, Wd * .72, S * .1); ctx.fill();
  ctx.fillStyle = '#bfe3ff'; ctx.fillRect(L * .2, -Wd * .33, L * .1, Wd * .66);
  ctx.fillStyle = '#9cc8e8'; ctx.fillRect(-L * .34, -Wd * .3, L * .08, Wd * .6);
  ctx.fillStyle = '#fff6b0'; ctx.fillRect(L / 2 - 4, -Wd * .38, 3, Wd * .2); ctx.fillRect(L / 2 - 4, Wd * .18, 3, Wd * .2);
  if (c.ev){ ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(2, -Wd * .3); ctx.lineTo(-5, 1); ctx.lineTo(0, 1); ctx.lineTo(-3, Wd * .3); ctx.lineTo(6, -2); ctx.lineTo(1, -2); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}

/* ----- 물체 그리기 ----- */
function objDone(o){
  if (WORLD.kind === 'custom'){
    if (o.type === 'scene') return !!CUSTOM.judged[o.id];
    if (o.type === 'device') return !!CUSTOM.devDone[o.id];
    return true;
  }
  if (o.type === 'device') return !!(SAVE.dex[o.dev] && SAVE.dex[o.dev].done);
  if (o.type === 'scene') return !!SAVE.judged[o.id];
  if (o.type === 'npc') return !actGiverHere(o);
  if (o.type === 'mission') return WORLD.kind === 'story' || WORLD.kind === 'room' ? o.id !== actPlaceNow() : true;   /* 지금 가야 할 장소만 빛난다 */
  return true;
}
function testRevealed(){ return SAVE.robotRuns.some(r => r.kind === 'story'); }
function drawShadow(cx, cy, S, w = .34){ ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(cx, cy, S * w, S * .12, 0, 0, 7); ctx.fill(); }
function drawObject(o, S, t){
  if (zoneDraw2D(o, S)) return;
  const cx = (o.x + .5) * S, cy = (o.y + .5) * S;
  if (o.type === 'npc'){
    if (o.look === 'robot') drawRobot(cx, (o.y + .82) * S, S, t); else drawPerson(cx, (o.y + .82) * S, S, o.look, 'down', 0);
    return;
  }
  if (o.type === 'deco' && o.kind === 'lamp'){ drawLamp(o, cx, S, t); return; }
  if (o.type === 'deco' && o.kind === 'tower'){ drawTower(o, cx, S, t); return; }
  if (o.type === 'device'){
    drawShadow(cx, cy + S * .32, S);
    const icon = WORLD.kind === 'story' ? DEVICES.find(d => d.id === o.dev).icon : (o.icon || '⚡');
    const bob = Math.sin(t * 2 + o.x) * S * .04;
    if (DEV_DRAWN.includes(icon)) drawDevIcon(ctx, icon, cx, cy - S * .08 + bob, S * .82, t);
    else drawEmoji(icon, cx, cy - S * .08 + bob, S * .72);
    return;
  }
  if (o.type === 'scene' || (o.type === 'test' && testRevealed())){
    drawShadow(cx, cy + S * .3, S, .3);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(cx, cy - S * .05, S * .36, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(28,39,51,.35)'; ctx.lineWidth = 2; ctx.stroke();
    const icon = o.type === 'test' ? TEST_SCENES.find(s => s.id === o.id).icon : (WORLD.kind === 'story' ? SCENES.find(s => s.id === o.id).icon : (o.icon || '❓'));
    drawEmoji(icon, cx, cy - S * .05, S * .56);
    return;
  }
  if (o.type === 'test'){
    const x = o.x * S + S * .14, y = o.y * S + S * .02, w = S * .72;
    drawShadow(cx, cy + S * .32, S);
    ctx.fillStyle = '#b07a45'; ctx.fillRect(x, y + S * .12, w, w); ctx.fillStyle = '#c89b5e'; ctx.fillRect(x, y, w, S * .16);
    ctx.strokeStyle = '#6b4523'; ctx.lineWidth = 2; ctx.strokeRect(x, y + S * .12, w, w);
    ctx.font = `${Math.round(S * .4)}px ${FONT_D}`; ctx.fillStyle = '#fff3c4'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', cx, y + S * .5);
    return;
  }
  if (o.type === 'mission'){
    const pulse = .5 + Math.sin(t * 3) * .5;
    ctx.fillStyle = `rgba(255,210,63,${.18 + pulse * .18})`; ctx.beginPath(); ctx.ellipse(cx, cy + S * .25, S * .46, S * .2, 0, 0, 7); ctx.fill();
    drawEmoji(o.emoji, cx, cy - S * .1, S * .66);
    return;
  }
  if (o.type === 'sign'){
    ctx.fillStyle = '#6b4523'; ctx.fillRect(cx - S * .05, cy - S * .1, S * .1, S * .5);
    ctx.fillStyle = '#e9d3a8'; rr(ctx, cx - S * .38, cy - S * .42, S * .76, S * .38, 5); ctx.fill();
    ctx.strokeStyle = '#6b4523'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#6b4523'; ctx.fillRect(cx - S * .26, cy - S * .3, S * .52, 2); ctx.fillRect(cx - S * .26, cy - S * .2, S * .36, 2);
    return;
  }
  if (o.type === 'deco' && o.kind === 'scrap'){
    drawShadow(cx, cy + S * .28, S, .42);
    const parts = [['#8a9099', -.3, .05, .34, .22], ['#a0663a', .02, -.05, .3, .2], ['#c9ced6', -.12, -.2, .26, .16], ['#5b6573', .12, .1, .26, .18], ['#d94141', -.02, -.32, .16, .1]];
    for (const [col, dx, dy, w, h] of parts){ ctx.fillStyle = col; ctx.fillRect(cx + dx * S, cy + dy * S, w * S, h * S); }
    return;
  }
  if (o.type === 'deco' && o.kind === 'evflag'){ drawEmoji('🚩', cx, cy - S * .2, S * .6); drawBubble(cx, cy - S * .6, ['①', '②', '③'][o.n] || '🚩', '#fff6d8', '#1c2733'); return; }
  if (o.type === 'deco' && o.kind === 'charger'){
    ctx.fillStyle = '#2f3a46'; rr(ctx, cx - S * .16, cy - S * .4, S * .32, S * .7, 4); ctx.fill();
    ctx.fillStyle = '#25a862'; ctx.fillRect(cx - S * .1, cy - S * .3, S * .2, S * .14);
    drawEmoji('⚡', cx, cy + S * .05, S * .3);
  }
}
function drawBubble(x, y, txt, bg, fg){
  ctx.font = `${Math.round(TS * .36)}px ${FONT_D}`;
  const w = Math.max(TS * .44, ctx.measureText(txt).width + TS * .26), h = TS * .44;
  ctx.fillStyle = bg; ctx.strokeStyle = '#1c2733'; ctx.lineWidth = 2;
  rr(ctx, x - w / 2, y - h, w, h, h * .35); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 5, y - 1); ctx.lineTo(x, y + 6); ctx.lineTo(x + 5, y - 1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y - h / 2 + 1);
}
function drawLabel(x, y, txt){
  ctx.font = `700 ${Math.round(clamp(TS * .32, 12, 16))}px ${FONT_B}`;
  const w = ctx.measureText(txt).width + 18, h = Math.round(clamp(TS * .32, 12, 16)) + 12;
  ctx.fillStyle = 'rgba(21,32,43,.92)'; rr(ctx, x - w / 2, y - h, w, h, 7); ctx.fill();
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y - h / 2 + 1);
}

/* ----- 세계 불러오기 ----- */
const player = {x:0, y:0, dir:'down', walk:0, moving:false, jz:0, jv:0};
/* 점프: 스페이스 · 점프 버튼. 보기만 하는 점프라서 차를 피하는 데는 쓸 수 없다 (길은 횡단보도로!) */
function playerJump(){
  if (MODE !== 'play' || uiBlocking() || player.jz > .02) return;
  player.jv = 7.4; SND.beep(392, .05, 'square', .035); setTimeout(() => SND.beep(587, .06, 'square', .03), 50);
}
function updateJump(dt){
  if (!player.jv && !player.jz) return;
  player.jv -= 26 * dt; player.jz = Math.max(0, player.jz + player.jv * dt);
  if (player.jz === 0 && player.jv < 0) player.jv = 0;
}
const cam = {x:0, y:0};
let NEAR = null;
function loadWorld(def){
  WORLD = def;
  WORLD.cars = (def.cars || []).map(c => ({...c}));
  WORLD.objects = def.objects;
  rebuildSolidMap();
  initWalkers(WORLD); initPeds(WORLD);
  if (WORLD.kind === 'story'){ zoneTownSync(); evSyncWorld(); epiTownSync(); }
  MINI.base = null;
}
function rebuildSolidMap(){
  const W = WORLD; W.solid = new Uint8Array(W.w * W.h);
  /* 물체가 선 칸은 막힌다. span(좌우로 더 막을 칸 수)이 있으면 넓게, walk(깔개 등)는 막지 않는다 */
  for (const o of W.objects){
    if (o.walk) continue;
    const s = o.span || 0;
    for (let x = o.x - s; x <= o.x + s; x++) if (x >= 0 && o.y >= 0 && x < W.w && o.y < W.h) W.solid[o.y * W.w + x] = 1;
  }
}
function solidAt(tx, ty){
  const W = WORLD; if (tx < 0 || ty < 0 || tx >= W.w || ty >= W.h) return true;
  if (isSolidTile(W.tiles[ty][tx])) return true;
  return !!W.solid[ty * W.w + tx];
}
function blockedAt(x, y){
  const r = .25;
  for (const [px, py] of [[x - r, y - .22], [x + r, y - .22], [x - r, y + .06], [x + r, y + .06]])
    if (solidAt(Math.floor(px), Math.floor(py))) return true;
  return false;
}
function placePlayer(x, y){
  player.x = x; player.y = y;
  if (blockedAt(x, y)){ // 막힌 곳이면 가까운 빈칸 찾기
    const W = WORLD; let best = null, bd = 1e9;
    for (let j = 0; j < W.h; j++) for (let i = 0; i < W.w; i++){
      if (solidAt(i, j)) continue; const d = (i + .5 - x) ** 2 + (j + .6 - y) ** 2; if (d < bd){ bd = d; best = [i + .5, j + .6]; }
    }
    if (best){ player.x = best[0]; player.y = best[1]; }
  }
  cam.x = player.x; cam.y = player.y;
  if (G3.ok){ player.h = surfY(player.x, player.y); PATH3.nodes = null; cam3Snap(); }
}
function findNear(){
  let best = null, bd = 1.45;
  for (const o of WORLD.objects){
    if (o.type === 'deco') continue;
    const d = Math.hypot(player.x - (o.x + .5), (player.y - .3) - (o.y + .5));
    if (d < bd){ bd = d; best = o; }
  }
  for (const w of (WORLD.walkers || [])){ if (walkerHidden(w)) continue; const d = Math.hypot(player.x - (w.x + .5), (player.y - .3) - (w.y + .5)); if (d < bd){ bd = d; best = w; } }
  for (const p of (WORLD.peds || [])){ if (p.hospital) continue; const d = Math.hypot(player.x - p.x, (player.y - .3) - p.y); if (d < bd){ bd = d; best = p; } }
  return best;
}

/* ----- 입력 ----- */
const KEYS = new Set();
const JOY = {x:0, y:0, id:null};
function inputVector(){
  let x = 0, y = 0;
  if (KEYS.has('ArrowLeft') || KEYS.has('KeyA')) x -= 1;
  if (KEYS.has('ArrowRight') || KEYS.has('KeyD')) x += 1;
  if (KEYS.has('ArrowUp') || KEYS.has('KeyW')) y -= 1;
  if (KEYS.has('ArrowDown') || KEYS.has('KeyS')) y += 1;
  x += JOY.x; y += JOY.y;
  const m = Math.hypot(x, y); if (m > 1){ x /= m; y /= m; }
  return {x, y};
}
function updatePlayer(dt){
  const v = inputVector();
  if (Math.abs(v.x) + Math.abs(v.y) > .05){
    const sp = 4.6 * dt * rpgSpeed() * bikeMul();
    if (!blockedAt(player.x + v.x * sp, player.y)) player.x += v.x * sp;
    if (!blockedAt(player.x, player.y + v.y * sp)) player.y += v.y * sp;
    player.dir = Math.abs(v.x) > Math.abs(v.y) ? (v.x < 0 ? 'left' : 'right') : (v.y < 0 ? 'up' : 'down');
    player.walk += dt; player.moving = true;
  } else { player.moving = false; player.walk = 0; }
  NEAR = evNear(findNear());
  checkPickups();
  if (WORLD.kind === 'story'){
    updatePlayer.saveT = (updatePlayer.saveT || 0) + dt;
    if (updatePlayer.saveT > 3){ updatePlayer.saveT = 0; SAVE.pos = {x:+player.x.toFixed(2), y:+player.y.toFixed(2)}; persist(); }
  }
}
function updateCamera(dt, target){
  const k = 1 - Math.pow(.002, dt);
  cam.x = lerp(cam.x, target.x, k); cam.y = lerp(cam.y, target.y - .4, k);
  clampCam();
}
function clampCam(){
  const W = WORLD, hw = CW / TS / 2, hh = CH / TS / 2;
  cam.x = W.w <= hw * 2 ? W.w / 2 : clamp(cam.x, hw, W.w - hw);
  cam.y = W.h <= hh * 2 ? W.h / 2 : clamp(cam.y, hh - .6, W.h - hh);
}

/* ----- 자동차 ----- */
function updateCars(dt){
  const W = WORLD; if (!W.cars || !W.cars.length) return;
  const inBox = (x, y) => x > 27.6 && x < 30.4 && y > 19.6 && y < 22.4;
  for (const c of W.cars){
    if (c.parked || c.hold) continue;
    let go = true;
    const ahead = (ex, ey) => {
      const along = c.axis === 'x' ? (ex - c.pos) * c.dir : (ey - c.pos) * c.dir;
      const perp = Math.abs(c.axis === 'x' ? ey - c.lane : ex - c.lane);
      return along > 0 && along < 1.9 && perp < .75;
    };
    if (ahead(player.x, player.y - .2) && (MODE !== 'play' || W.kind !== 'story' || onCrosswalk(player.x, player.y))) go = false;   /* 횡단보도 위의 사람에게만 멈춘다 */
    if (ROBOT.active && ahead(ROBOT.x, ROBOT.y - .2)) go = false;
    for (const p of (W.peds || [])) if (p.hurt <= 0 && ahead(p.x, p.y) && onCrosswalk(p.x, p.y)) go = false;   /* 횡단보도의 행인에게도 멈춘다 */
    for (const o of W.cars){ if (o !== c && o.axis === c.axis && o.lane === c.lane){ const al = (o.pos - c.pos) * c.dir; if (al > 0 && al < 2.1) go = false; } }
    const [cx, cy] = carXY(c);
    if (go && !inBox(cx, cy)){
      const nx = c.axis === 'x' ? cx + c.dir * .4 : cx, ny = c.axis === 'y' ? cy + c.dir * .4 : cy;
      if (inBox(nx, ny) && W.cars.some(o => o !== c && o.axis !== c.axis && inBox(...carXY(o)))) go = false;
    }
    if (go){
      c.pos += c.speed * dt * c.dir;
      const hi = (c.axis === 'x' ? W.w : W.h) - .8;
      if (c.pos > hi) c.pos = .8; if (c.pos < .8) c.pos = hi;
    }
  }
}

/* ----- AI 로봇 순찰 ----- */
const ROBOT = {active:false, x:0, y:0, path:[], targets:[], cur:null, wait:0, results:[], onDone:null, bubble:null};
function bfsPath(sx, sy, goal){
  const W = WORLD, N = W.w * W.h, prev = new Int32Array(N).fill(-1);
  const start = sy * W.w + sx; prev[start] = start; const q = [start];
  for (let qi = 0; qi < q.length; qi++){
    const cur = q[qi], cx = cur % W.w, cy = (cur / W.w) | 0;
    if (goal(cx, cy)){
      const path = []; let p = cur; while (p !== start){ path.push(p); p = prev[p]; }
      return path.reverse().map(i => ({x:i % W.w, y:(i / W.w) | 0}));
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
      const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W.w || ny >= W.h) continue;
      const ni = ny * W.w + nx; if (prev[ni] !== -1 || solidAt(nx, ny)) continue;
      if (isRoadLane(nx, ny) && !onCrosswalk(nx + .5, ny + .5)) continue;   /* 큰길은 횡단보도로만 건넌다 */
      prev[ni] = cur; q.push(ni);
    }
  }
  return null;
}
function startRobot(startX, startY, targets, onDone){
  // targets: [{obj, label, p, text}] — 순서는 가까운 순
  const rest = targets.slice(), ordered = []; let px = startX, py = startY;
  while (rest.length){
    let bi = 0, bd = 1e9;
    rest.forEach((t, i) => { const d = (t.obj.x - px) ** 2 + (t.obj.y - py) ** 2; if (d < bd){ bd = d; bi = i; } });
    const t = rest.splice(bi, 1)[0]; ordered.push(t); px = t.obj.x; py = t.obj.y;
  }
  Object.assign(ROBOT, {active:true, x:startX, y:startY, path:[], targets:ordered, cur:null, wait:0, results:[], onDone, bubble:null});
  MODE = 'patrol';
}
function nextRobotTarget(){
  const t = ROBOT.targets.shift();
  if (!t){ finishRobot(); return; }
  ROBOT.cur = t;
  const path = bfsPath(Math.floor(ROBOT.x), Math.floor(ROBOT.y), (x, y) => Math.abs(x - t.obj.x) + Math.abs(y - t.obj.y) === 1);
  if (!path){ t.unreachable = true; ROBOT.results.push(t); ROBOT.cur = null; return; }
  ROBOT.path = path;
}
function updateRobot(dt){
  if (!ROBOT.active) return;
  if (ROBOT.wait > 0){
    ROBOT.wait -= dt;
    if (ROBOT.wait <= 0){ ROBOT.results.push(ROBOT.cur); ROBOT.cur = null; ROBOT.bubble = null; }
    return;
  }
  if (!ROBOT.cur){ nextRobotTarget(); return; }
  if (ROBOT.path.length){
    const n = ROBOT.path[0], tx = n.x + .5, ty = n.y + .62;
    const dx = tx - ROBOT.x, dy = ty - ROBOT.y, d = Math.hypot(dx, dy), sp = 7 * dt;
    if (d <= sp){ ROBOT.x = tx; ROBOT.y = ty; ROBOT.path.shift(); } else { ROBOT.x += dx / d * sp; ROBOT.y += dy / d * sp; }
    return;
  }
  ROBOT.wait = .75; ROBOT.bubble = ROBOT.cur; SND.tick();
}
function finishRobot(){
  if (!ROBOT.active) return;
  if (ROBOT.cur){ ROBOT.results.push(ROBOT.cur); ROBOT.cur = null; }
  ROBOT.results.push(...ROBOT.targets); ROBOT.targets = [];
  ROBOT.active = false; ROBOT.bubble = null;
  MODE = 'play';
  const f = ROBOT.onDone; ROBOT.onDone = null;
  if (f) f(ROBOT.results.slice());
}

/* ----- 그리기 ----- */
function renderWorld(t){
  const W = WORLD, S = TS;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#10181f'; ctx.fillRect(0, 0, CW, CH);
  const camPX = Math.round(cam.x * S - CW / 2), camPY = Math.round(cam.y * S - CH / 2);
  ctx.save(); ctx.translate(-camPX, -camPY);
  const x0 = Math.max(0, Math.floor(camPX / S) - 1), x1 = Math.min(W.w - 1, Math.ceil((camPX + CW) / S) + 1);
  const y0 = Math.max(0, Math.floor(camPY / S) - 1), y1 = Math.min(W.h - 1, Math.ceil((camPY + CH) / S) + 2);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){
    const ch = W.tiles[y][x], d = TILES[ch] || TILES['.'];
    const gch = d.h > 0 ? (GROUND_OF[ch] || '.') : ch;
    ctx.drawImage(groundSprite(gch, (x * 7 + y * 13) & 3), x * S, y * S, S + .5, S + .5);
    if (gch === '~'){
      ctx.fillStyle = 'rgba(255,255,255,.28)';
      const o = ((t * 12 + x * 9 + y * 5) % S);
      ctx.fillRect(x * S + o * .6, y * S + S * .3, S * .3, 2); ctx.fillRect(x * S + (S - o) * .5, y * S + S * .7, S * .26, 2);
    }
  }
  // 차선·횡단보도
  ctx.fillStyle = '#f2d24b';
  for (const L of (W.lines || [])){
    for (let k = L.from; k <= L.to; k++){
      if (k >= L.skip[0] && k < L.skip[1]) continue;
      if (L.axis === 'x') ctx.fillRect(k * S + S * .2, L.at * S - 1.5, S * .55, 3);
      else ctx.fillRect(L.at * S - 1.5, k * S + S * .2, 3, S * .55);
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  for (const c of (W.crosswalks || [])){
    for (let i = 0; i < c.w; i++) for (let j = 0; j < c.h; j++){
      const bx = (c.x + i) * S, by = (c.y + j) * S;
      for (let k = 0; k < 4; k++){ if (c.v) ctx.fillRect(bx + S * .1, by + k * S / 4 + S * .04, S * .8, S * .14); else ctx.fillRect(bx + k * S / 4 + S * .04, by + S * .1, S * .14, S * .8); }
    }
  }
  // 깊이 순서대로: 물체·사람·자동차
  const ents = [];
  for (const o of W.objects){ if (o.x >= x0 - 1 && o.x <= x1 + 1 && o.y >= y0 - 1 && o.y <= y1 + 1) ents.push({y:o.y + .8, f:() => drawObject(o, S, t)}); }
  for (const c of (W.cars || [])){ const [cx, cy] = carXY(c); ents.push({y:cy + (c.axis === 'y' ? .7 : .35), f:() => drawCar(c, S)}); }
  if (MODE !== 'title' && !(HP.inv > 0 && Math.floor(TIME * 12) % 2)) ents.push({y:player.y, f:() => drawPerson(player.x * S, (player.y - (player.jz || 0)) * S, S, 'player', player.dir, player.moving ? player.walk : 0)});
  if (ROBOT.active) ents.push({y:ROBOT.y, f:() => drawRobot(ROBOT.x * S, ROBOT.y * S, S, t)});
  rpgEnts2D(S, ents, x0, x1, y0, y1);
  ents.sort((a, b) => a.y - b.y);
  let ei = 0;
  for (let y = y0; y <= y1; y++){
    while (ei < ents.length && ents[ei].y < y){ ents[ei].f(); ei++; }
    for (let x = x0; x <= x1; x++){ const ch = W.tiles[y][x]; if (TILES[ch] && TILES[ch].h > 0) drawBlock(ch, x, y, S); }
  }
  while (ei < ents.length){ ents[ei].f(); ei++; }
  drawTownLight(camPX, camPY, S, t);
  drawFireworks(S);
  // 말풍선·표시
  if (MODE !== 'title'){
    for (const o of W.objects){
      if (o.x < x0 - 1 || o.x > x1 + 1 || o.y < y0 - 1 || o.y > y1 + 1) continue;
      const bx = (o.x + .5) * S, by = o.y * S - (o.type === 'npc' ? S * .75 : S * .05);
      if (o.type === 'test'){
        if (testRevealed() && SAVE.lastTest[o.id]){ const ok = SAVE.lastTest[o.id] === TEST_SCENES.find(s => s.id === o.id).label; drawBubble(bx, by, ok ? '✓' : '✗', ok ? '#8ff0b9' : '#ffaaa1', '#1c2733'); }
        continue;
      }
      if (o.type === 'deco' || o.type === 'sign') continue;
      if (objDone(o)){ if (o.type === 'device' || o.type === 'scene' || o.type === 'mission') drawBubble(bx, by, '✓', '#8ff0b9', '#1c2733'); }
      else {
        const lift = Math.abs(Math.sin(t * 3 + o.x)) * 4;
        if (o.type === 'device') drawBubble(bx, by - lift, '?', '#ffd23f', '#1c2733');
        else drawBubble(bx, by - lift, '!', o.type === 'scene' ? '#ffffff' : '#ffd23f', '#1c2733');
      }
    }
    for (const w of (W.walkers || [])){ if (walkerHidden(w)) continue; const bb = walkerBubble(w); if (bb) drawBubble((w.x + .5) * S, w.y * S - S * .55, bb, bb === '★' ? '#ffd23f' : '#ffffff', '#1c2733'); }
    if (ROBOT.bubble){
      const b = ROBOT.bubble, lb = LABELS[b.label];
      drawBubble((b.obj.x + .5) * S, b.obj.y * S - S * .1, `${lb.icon} ${lb.name} ${Math.round(b.p * 100)}%`, '#ffffff', '#1c2733');
    }
    if (MODE === 'play' && NEAR && !uiBlocking()){
      const name = (NEAR.type === 'npc' || NEAR.type === 'walker' || NEAR.type === 'ped') ? `${josa(NEAR.name, '과', '와')} 이야기` : NEAR.type === 'sign' ? '표지판 읽기' : NEAR.name;
      drawLabel((NEAR.x + .5) * S, NEAR.y * S - S * (NEAR.type === 'npc' || NEAR.type === 'walker' ? 1.25 : .62), `${IS_TOUCH ? '' : 'E · '}${name}`);
    }
  }
  ctx.restore();
  if (MODE === 'play') drawWaypoint(camPX, camPY, S, t);
}
function drawWaypoint(camPX, camPY, S, t){
  const wp = UI.waypoint; if (!wp || (WORLD.kind !== 'story' && WORLD.kind !== 'room')) return;
  if (Math.hypot(player.x - (wp.x + .5), player.y - (wp.y + .5)) < 1.8){ UI.waypoint = null; return; }
  const tx = (wp.x + .5) * S - camPX, ty = (wp.y + .1) * S - camPY;
  const top = 70, m = 40;
  ctx.save();
  if (tx > m && tx < CW - m && ty > top && ty < CH - m){
    const by = ty - S * .8 - Math.abs(Math.sin(t * 4)) * 10;
    ctx.translate(tx, by); ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#1c2733'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-13, -14); ctx.lineTo(13, -14); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else {
    const cx = CW / 2, cy = CH / 2, ang = Math.atan2(ty - cy, tx - cx);
    const ex = clamp(tx, m, CW - m), ey = clamp(ty, top + 10, CH - m);
    ctx.translate(ex, ey); ctx.rotate(ang);
    ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#1c2733'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -13); ctx.lineTo(-4, 0); ctx.lineTo(-10, 13); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.rotate(-ang);
    ctx.font = `700 13px ${FONT_B}`; const w = ctx.measureText(wp.label).width + 14;
    const lx = clamp(-Math.cos(ang) * 46, -CW, CW), ly = -Math.sin(ang) * 30;
    ctx.fillStyle = 'rgba(21,32,43,.9)'; rr(ctx, lx - w / 2, ly - 11, w, 22, 6); ctx.fill();
    ctx.fillStyle = '#ffd23f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(wp.label, lx, ly + 1);
  }
  ctx.restore();
}

/* ----- 미니맵 ----- */
function drawMinimap(){
  const mc = document.getElementById('minimap'); if (!WORLD || document.getElementById('hud').hidden) return;
  const W = WORLD, sc = Math.max(2, Math.min(MINI.big ? 5 : 3, Math.floor((MINI.big ? 300 : 180) / W.w)));
  const w = W.w * sc, h = W.h * sc;
  if (mc.width !== w || mc.height !== h){ mc.width = w; mc.height = h; MINI.base = null; }
  if (!MINI.base){
    const b = mkCanvas(w, h), g = b.getContext('2d');
    for (let y = 0; y < W.h; y++) for (let x = 0; x < W.w; x++){ const d = TILES[W.tiles[y][x]] || TILES['.']; g.fillStyle = d.pat === 'tree' ? '#2f7f2c' : d.pat === 'wall' ? '#6f6656' : d.c; g.fillRect(x * sc, y * sc, sc, sc); }
    MINI.base = b;
  }
  const g = mc.getContext('2d'); g.drawImage(MINI.base, 0, 0);
  for (const o of W.objects){
    let col = null;
    if (o.type === 'mission' && !objDone(o)) col = '#ffd23f';
    else if (o.type === 'npc') col = SAVE.met[o.id] ? '#c58bff' : '#ffd23f';
    else if (o.type === 'device' && !objDone(o)) col = '#3ee0ff';
    else if (o.type === 'scene' && !objDone(o)) col = '#ffffff';
    else if (o.type === 'test' && WORLD.kind === 'story') col = '#b07a45';
    if (col){ g.fillStyle = col; g.fillRect(o.x * sc, o.y * sc, sc, sc); }
  }
  if (UI.waypoint && Math.sin(TIME * 8) > 0){ g.strokeStyle = '#ffd23f'; g.lineWidth = 2; g.strokeRect(UI.waypoint.x * sc - 2, UI.waypoint.y * sc - 2, sc + 4, sc + 4); }
  if (ROBOT.active){ g.fillStyle = '#3ee0ff'; g.fillRect(ROBOT.x * sc - 2, ROBOT.y * sc - 3, 5, 5); }
  for (const w of (W.walkers || [])) if (!walkerHidden(w) && walkerBubble(w)){ g.fillStyle = '#ff9ad5'; g.fillRect((w.x + .5) * sc - 2, (w.y + .5) * sc - 2, 4, 4); }
  for (const p of questPickups()){ g.fillStyle = Math.sin(TIME * 6) > 0 ? '#ffd23f' : '#fff6b0'; g.fillRect(p.x * sc - 3, p.y * sc - 3, 6, 6); }
  g.fillStyle = '#1c2733'; g.fillRect(player.x * sc - 3, player.y * sc - 4, 7, 7);
  g.fillStyle = '#ff8a2a'; g.fillRect(player.x * sc - 2, player.y * sc - 3, 5, 5);
  if (G3.ok && MODE === 'play'){ // 3D: 카메라가 보는 쪽
    const a = -Math.PI / 2 - CAM3.uYaw, px = player.x * sc, py = player.y * sc, r = sc * 7;
    g.fillStyle = 'rgba(255,210,63,.32)'; g.beginPath(); g.moveTo(px, py); g.arc(px, py, r, a - .5, a + .5); g.closePath(); g.fill();
  }
}
