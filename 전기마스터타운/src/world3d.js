/* =========================================================
   2c. 3D 세계 — 블록 지도 · 청크 메시 · 빛 · 모형 · 카메라 · 그리기 · 맵 만들기
   타일 한 칸 = 블록 한 개(1m). 타일 좌표 (x, y) → 3D (x, z). 땅의 윗면이 높이 0이다.
   ========================================================= */
const BK = {AIR:0, GRASS:1, DIRT:2, ROAD:3, WALK:4, FLOOR:5, GRAVEL:6, WATER:7, WALL:8, WALLB:9, BLDG:10, LOG:11, LEAF:12, FENCE:13, RAIL:14, FLOWER:15, TGRASS:16, SLAB:17, LINTEL:18};
const YMAX = 12;   // 블록 층: 0 = 땅(-1~0), 1 = 땅 위 첫 층(0~1) …
let BDEF = [];
function g3BlockDefs(){
  const T = TX, d = [];
  d[BK.AIR] = {m:'none', op:0};
  d[BK.GRASS] = {m:'cube', op:1, t:[T.grassTop, T.dirt, T.grassSide]};
  d[BK.DIRT] = {m:'cube', op:1, t:[T.dirt, T.dirt, T.dirt]};
  d[BK.ROAD] = {m:'cube', op:1, t:[T.road, T.dirt, T.road]};
  d[BK.WALK] = {m:'cube', op:1, t:[T.walk, T.dirt, T.curb]};
  d[BK.FLOOR] = {m:'cube', op:1, t:[T.floor, T.dirt, T.floor]};
  d[BK.GRAVEL] = {m:'cube', op:1, t:[T.gravel, T.dirt, T.gravel]};
  d[BK.WATER] = {m:'water', op:0, tr:1};
  d[BK.WALL] = {m:'cube', op:1, t:[T.wallTop, T.wall, T.wall]};
  d[BK.WALLB] = {m:'cube', op:1, t:[T.wallTop, T.wallBase, T.wallBase]};
  d[BK.BLDG] = {m:'cube', op:1, t:[T.roof, T.bldg, T.bldg], win:1};
  d[BK.LOG] = {m:'cube', op:1, t:[T.logTop, T.logTop, T.logSide]};
  d[BK.LEAF] = {m:'cube', op:1, t:[T.leaves, T.leaves, T.leaves]};
  d[BK.FENCE] = {m:'fence', op:0};
  d[BK.RAIL] = {m:'rail', op:0};
  d[BK.FLOWER] = {m:'cross', op:0};
  d[BK.TGRASS] = {m:'cross', op:0};
  d[BK.SLAB] = {m:'slab', op:0, h:.125, t:[T.walk, T.walk, T.curb]};
  d[BK.LINTEL] = {m:'cube', op:1, t:[T.wallTop, T.door, T.door]};
  BDEF = d;
}
/* 면 6개: 방향, 밝기(minecraft-weekend chunk.vs), AO를 볼 두 축, 바깥에서 볼 때 반시계 방향 꼭짓점 */
const FACES = [
  {d:[0, 1, 0],  sh:1.0, ax:[0, 2], c:[[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]]},
  {d:[0, -1, 0], sh:.5,  ax:[0, 2], c:[[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]]},
  {d:[1, 0, 0],  sh:.8,  ax:[1, 2], c:[[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]]},
  {d:[-1, 0, 0], sh:.8,  ax:[1, 2], c:[[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]]},
  {d:[0, 0, 1],  sh:.6,  ax:[0, 1], c:[[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]]},
  {d:[0, 0, -1], sh:.6,  ax:[0, 1], c:[[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]]},
];
const DIR6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const AO_K = [.52, .7, .85, 1];
const WHITE = [1, 1, 1];
const RGBC = new Map();
function rgb(h){ let c = RGBC.get(h); if (!c){ const n = parseInt(h.slice(1), 16); c = [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; RGBC.set(h, c); } return c; }
function hexShade(h, amt){ const c = rgb(h).map(v => Math.round(clamp(amt < 0 ? v * (1 + amt) : v + (1 - v) * amt, 0, 1) * 255)); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); }
const UVC = [];
function UV(tile){ let u = UVC[tile]; if (!u){ const r = uvRect(tile); u = UVC[tile] = [r[0], r[3], r[2], r[3], r[2], r[1], r[0], r[1]]; } return u; }
const angDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const angLerp = (a, b, k) => a + angDiff(b, a) * k;

/* ----- 메시 쌓기 (위치3 · uv2 · 색3 · 밝기2 · 빛남1) ----- */
class VB {
  constructor(){ this.v = []; this.i = []; this.nv = 0; }
  quad(P, U, c, sh, sky, emit, flip){
    const v = this.v, b = this.nv;
    for (let k = 0; k < 4; k++) v.push(P[k][0], P[k][1], P[k][2], U[k * 2], U[k * 2 + 1], c[0], c[1], c[2], sh[k], sky, emit);
    if (flip) this.i.push(b + 1, b + 2, b + 3, b + 1, b + 3, b); else this.i.push(b, b + 1, b + 2, b, b + 2, b + 3);
    this.nv += 4;
  }
  mesh(){ return this.nv ? g3Mesh('vox', this.v, this.i) : null; }
}
/* 상자 하나 (인물·기기·울타리처럼 블록이 아닌 모형) */
function vbBox(b, x0, y0, z0, x1, y1, z1, col, emit = -1, tile = -1, sky = 1, skipBottom = false){
  const c = typeof col === 'string' ? rgb(col) : (col || WHITE), U = UV(tile >= 0 ? tile : TX.white);
  for (let f = 0; f < 6; f++){
    if (skipBottom && f === 1) continue;
    const F = FACES[f], P = [];
    for (let k = 0; k < 4; k++){ const q = F.c[k]; P.push([q[0] ? x1 : x0, q[1] ? y1 : y0, q[2] ? z1 : z0]); }
    b.quad(P, U, c, [F.sh, F.sh, F.sh, F.sh], sky, emit, false);
  }
}

/* ===== 블록 세상 ===== */
const W3 = {src:null, kind:'', w:0, h:0, vox:null, meta:null, sky:null, chunks:[], ncx:0, ncz:0, decal:null, ground:null, rows:null};
function w3B(x, y, z){
  if (y < 0) return BK.DIRT;
  if (y >= YMAX) return BK.AIR;
  if (x < 0 || z < 0 || x >= W3.w || z >= W3.h) return y === 0 ? BK.GRASS : BK.AIR;
  return W3.vox[(z * W3.w + x) * YMAX + y];
}
function w3Sky(x, y, z){
  if (y < 0 || y >= YMAX || x < 0 || z < 0 || x >= W3.w || z >= W3.h) return 15;
  return W3.sky[(z * W3.w + x) * YMAX + y];
}
const occ = (x, y, z) => BDEF[w3B(x, y, z)].op ? 1 : 0;

function w3Build(src, kind){
  for (const C of W3.chunks){ g3Free(C.op); g3Free(C.tr); }
  g3Free(W3.decal); g3Free(W3.ground);
  W3.src = src; W3.kind = kind; W3.w = src.w; W3.h = src.h;
  w3Voxelize(src.tiles);
  W3.ncx = Math.ceil(W3.w / 16); W3.ncz = Math.ceil(W3.h / 16);
  W3.chunks = []; for (let i = 0; i < W3.ncx * W3.ncz; i++) W3.chunks.push({op:null, tr:null, dirty:true});
  w3MeshDirty();
  w3Decals(src);
  const G = 70, gc = kind === 'room' ? [.2, .23, .28, 1] : [.43, .71, .26, 1],   /* 방 밖은 어두운 바닥 */ gv = [-G, -.02, W3.h + G, ...gc, W3.w + G, -.02, W3.h + G, ...gc, W3.w + G, -.02, -G, ...gc, -G, -.02, -G, ...gc];
  W3.ground = g3Mesh('flat', gv, [0, 1, 2, 0, 2, 3]);
  W3.rows = src.tiles.map(r => r.join(''));
}
/* 타일 글자 → 블록 기둥 */
function w3Voxelize(tiles){
  const w = W3.w, h = W3.h, Y = YMAX, V = new Uint8Array(w * h * Y), M = new Uint8Array(w * h * Y), trees = [];
  for (let z = 0; z < h; z++) for (let x = 0; x < w; x++){
    const base = (z * w + x) * Y, set = (y, b, m) => { V[base + y] = b; if (m) M[base + y] = m; };
    switch (tiles[z][x]){
      case '.': set(0, BK.GRASS); if (hash2(x, z, 77) < .13) set(1, BK.TGRASS); break;
      case ',': set(0, BK.GRASS); set(1, BK.FLOWER, (hash2(x, z, 5) * 4) | 0); break;
      case '=': set(0, BK.ROAD); break;
      case ':': set(0, BK.WALK); set(1, BK.SLAB); break;
      case '_': set(0, BK.FLOOR); break;
      case 'g': set(0, BK.GRAVEL); break;
      case 'D': set(0, BK.FLOOR); set(3, BK.LINTEL); break;
      case '~': set(0, BK.WATER); break;
      case '#': set(0, BK.FLOOR); set(1, BK.WALLB); set(2, BK.WALL); set(3, BK.WALL); break;
      case 'B': set(0, BK.WALK); for (let y = 1; y <= 5; y++) set(y, BK.BLDG); break;
      case 'T': set(0, BK.GRASS); set(1, BK.LOG); set(2, BK.LOG); trees.push([x, z]); break;
      case 'F': set(0, BK.GRASS); set(1, BK.FENCE); break;
      case 'r': set(0, BK.GRAVEL); set(1, BK.RAIL); break;
      default: set(0, BK.GRASS);
    }
  }
  const leaf = (x, y, z) => { if (x < 0 || z < 0 || x >= w || z >= h || y >= Y) return; const i = (z * w + x) * Y + y; if (!V[i]) V[i] = BK.LEAF; };
  for (const [x, z] of trees){
    const tall = hash2(x, z, 41) > .55 ? 1 : 0;
    if (tall) V[(z * w + x) * Y + 3] = BK.LOG;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++){
      leaf(x + dx, 3 + tall, z + dz);
      if (!(dx && dz)) leaf(x + dx, 4 + tall, z + dz);
    }
    if (hash2(x, z, 42) > .3) leaf(x, 5 + tall, z);
  }
  W3.vox = V; W3.meta = M;
  w3SkyLight();
}
/* 하늘빛 번짐: 위에서 곧장 내려오면 줄지 않고, 옆으로 퍼질 때마다 1씩 준다 (minecraft-weekend light.c) */
function w3SkyLight(){
  const w = W3.w, h = W3.h, Y = YMAX, V = W3.vox, S = new Uint8Array(w * h * Y), q = [];
  const solid = b => BDEF[b].op && b !== BK.LEAF, dim = b => (b === BK.LEAF || b === BK.WATER) ? 2 : 0;
  for (let z = 0; z < h; z++) for (let x = 0; x < w; x++){
    let lv = 15;
    for (let y = Y - 1; y >= 0; y--){
      const i = (z * w + x) * Y + y, b = V[i];
      lv = solid(b) ? 0 : Math.max(0, lv - dim(b));
      S[i] = lv; if (lv > 1) q.push(i);
    }
  }
  for (let qi = 0; qi < q.length; qi++){
    const i = q[qi], lv = S[i]; if (lv <= 1) continue;
    const y = i % Y, col = (i - y) / Y, x = col % w, z = (col - x) / w;
    for (const d of DIR6){
      const nx = x + d[0], ny = y + d[1], nz = z + d[2];
      if (nx < 0 || nz < 0 || ny < 0 || nx >= w || nz >= h || ny >= Y) continue;
      const ni = (nz * w + nx) * Y + ny, nb = V[ni]; if (solid(nb)) continue;
      const nl = lv - 1 - dim(nb); if (nl > S[ni]){ S[ni] = nl; q.push(ni); }
    }
  }
  W3.sky = S;
}
function w3MeshDirty(){
  for (let ci = 0; ci < W3.chunks.length; ci++){ const C = W3.chunks[ci]; if (C.dirty){ w3MeshChunk(ci); C.dirty = false; } }
}
/* 청크(16×16 기둥) 한 개의 메시: 이웃이 막힌 면은 그리지 않는다 */
function w3MeshChunk(ci){
  const C = W3.chunks[ci], cx = ci % W3.ncx, cz = (ci / W3.ncx) | 0;
  g3Free(C.op); g3Free(C.tr);
  const ob = new VB(), tb = new VB(), Y = YMAX, w = W3.w, V = W3.vox;
  const x0 = cx * 16, z0 = cz * 16, x1 = Math.min(W3.w, x0 + 16), z1 = Math.min(W3.h, z0 + 16);
  for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++){
    const base = (z * w + x) * Y;
    for (let y = 0; y < Y; y++){
      const b = V[base + y]; if (!b) continue;
      const D = BDEF[b];
      if (D.m === 'cube') meshCube(ob, x, y, z, b, D);
      else if (D.m === 'slab') meshSlab(ob, x, y, z, D);
      else if (D.m === 'cross') meshCross(ob, x, y, z, b, W3.meta[base + y]);
      else if (D.m === 'fence') meshFence(ob, x, y, z);
      else if (D.m === 'rail') meshRail(ob, x, y, z);
      else if (D.m === 'water') meshWater(ob, tb, x, y, z);
    }
  }
  C.op = ob.mesh(); C.tr = tb.mesh();
}
function meshCube(ob, x, y, z, b, D){
  for (let f = 0; f < 6; f++){
    const F = FACES[f], nx = x + F.d[0], ny = y + F.d[1], nz = z + F.d[2], nb = w3B(nx, ny, nz);
    if (BDEF[nb].op) continue;
    const sk = w3Sky(nx, ny, nz) / 15, a0 = F.ax[0], a1 = F.ax[1], P = [], sh = [0, 0, 0, 0], ao = [0, 0, 0, 0];
    for (let k = 0; k < 4; k++){
      const q = F.c[k]; P.push([x + q[0], y - 1 + q[1], z + q[2]]);
      const o1 = [0, 0, 0], o2 = [0, 0, 0]; o1[a0] = q[a0] ? 1 : -1; o2[a1] = q[a1] ? 1 : -1;
      const s1 = occ(nx + o1[0], ny + o1[1], nz + o1[2]), s2 = occ(nx + o2[0], ny + o2[1], nz + o2[2]);
      const cr = occ(nx + o1[0] + o2[0], ny + o1[1] + o2[1], nz + o1[2] + o2[2]);
      const a = (s1 && s2) ? 0 : 3 - (s1 + s2 + cr); ao[k] = a; sh[k] = F.sh * AO_K[a];
    }
    const tile = f === 0 ? D.t[0] : f === 1 ? D.t[1] : D.t[2];
    const emit = D.win && f >= 2 ? +(.14 + .76 * hash2(x * 7 + f * 3, z * 11 + y * 5, 23)).toFixed(3) : -1;
    ob.quad(P, UV(tile), WHITE, sh, sk, emit, ao[0] + ao[2] < ao[1] + ao[3]);
  }
}
function meshSlab(ob, x, y, z, D){
  const h = D.h, yb = y - 1, yt = yb + h, sk = w3Sky(x, y, z) / 15;
  ob.quad([[x, yt, z + 1], [x + 1, yt, z + 1], [x + 1, yt, z], [x, yt, z]], UV(D.t[0]), WHITE, [1, 1, 1, 1], sk, -1, false);
  const r = uvRect(D.t[2]), vt = r[3] - (r[3] - r[1]) * h * 3;
  for (let f = 2; f < 6; f++){
    const F = FACES[f], nb = w3B(x + F.d[0], y, z + F.d[2]);
    if (BDEF[nb].op || nb === BK.SLAB) continue;
    ob.quad(F.c.map(q => [x + q[0], yb + q[1] * h, z + q[2]]), [r[0], r[3], r[2], r[3], r[2], vt, r[0], vt], WHITE, [F.sh, F.sh, F.sh, F.sh], sk, -1, false);
  }
}
function meshCross(ob, x, y, z, b, m){
  const tile = b === BK.TGRASS ? TX.tgrass : [TX.flowerR, TX.flowerY, TX.flowerW, TX.flowerP][m & 3];
  const U = UV(tile), yb = y - 1, ht = b === BK.TGRASS ? .72 : .85, sk = w3Sky(x, y, z) / 15, s = [.95, .95, .95, .95], a = .15, e = .85;
  const q1 = [[x + a, yb, z + a], [x + e, yb, z + e], [x + e, yb + ht, z + e], [x + a, yb + ht, z + a]];
  const q2 = [[x + e, yb, z + a], [x + a, yb, z + e], [x + a, yb + ht, z + e], [x + e, yb + ht, z + a]];
  for (const q of [q1, q2]){ ob.quad(q, U, WHITE, s, sk, -1, false); ob.quad([q[1], q[0], q[3], q[2]], U, WHITE, s, sk, -1, false); }
}
function meshFence(ob, x, y, z){
  const yb = y - 1, sk = w3Sky(x, y, z) / 15;
  vbBox(ob, x + .4, yb, z + .4, x + .6, yb + 1, z + .6, null, -1, TX.fence, sk, true);
  const con = (dx, dz) => { const nb = w3B(x + dx, y, z + dz); return nb === BK.FENCE || BDEF[nb].op; };
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
    if (!con(dx, dz)) continue;
    for (const [ya, yc] of [[.32, .46], [.68, .82]]){
      if (dx) vbBox(ob, dx > 0 ? x + .6 : x, yb + ya, z + .44, dx > 0 ? x + 1 : x + .4, yb + yc, z + .56, null, -1, TX.fence, sk);
      else vbBox(ob, x + .44, yb + ya, dz > 0 ? z + .6 : z, x + .56, yb + yc, dz > 0 ? z + 1 : z + .4, null, -1, TX.fence, sk);
    }
  }
}
function meshRail(ob, x, y, z){
  const yb = y - 1, sk = w3Sky(x, y, z) / 15, ax = w3B(x - 1, y, z) === BK.RAIL || w3B(x + 1, y, z) === BK.RAIL;
  for (let k = 0; k < 4; k++){
    const t = k * .25 + .07;
    if (ax) vbBox(ob, x + t, yb, z + .1, x + t + .12, yb + .07, z + .9, '#5b4a3a', -1, -1, sk, true);
    else vbBox(ob, x + .1, yb, z + t, x + .9, yb + .07, z + t + .12, '#5b4a3a', -1, -1, sk, true);
  }
  for (const r of [.26, .66]){
    if (ax) vbBox(ob, x, yb + .07, z + r, x + 1, yb + .15, z + r + .08, '#cfd5dc', -1, -1, sk, true);
    else vbBox(ob, x + r, yb + .07, z, x + r + .08, yb + .15, z + 1, '#cfd5dc', -1, -1, sk, true);
  }
}
function meshWater(ob, tb, x, y, z){
  const yt = y - .15, yf = y - .92;
  tb.quad([[x, yt, z + 1], [x + 1, yt, z + 1], [x + 1, yt, z], [x, yt, z]], UV(TX.water), WHITE, [1, 1, 1, 1], 1, -1, false);
  ob.quad([[x, yf, z + 1], [x + 1, yf, z + 1], [x + 1, yf, z], [x, yf, z]], UV(TX.sand), WHITE, [.8, .8, .8, .8], .9, -1, false);
}
/* 차선·횡단보도는 도로 위에 얇게 붙인다 */
function w3Decals(src){
  const v = [], idx = [], Y = .012;
  const quad = (x0, z0, x1, z1, c) => { const b = v.length / 7; v.push(x0, Y, z1, ...c, x1, Y, z1, ...c, x1, Y, z0, ...c, x0, Y, z0, ...c); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); };
  const yel = [.96, .83, .3, 1], wht = [1, 1, 1, .92];
  for (const L of (src.lines || [])) for (let k = L.from; k <= L.to; k++){
    if (k >= L.skip[0] && k < L.skip[1]) continue;
    if (L.axis === 'x') quad(k + .2, L.at - .05, k + .75, L.at + .05, yel); else quad(L.at - .05, k + .2, L.at + .05, k + .75, yel);
  }
  for (const c of (src.crosswalks || [])) for (let i = 0; i < c.w; i++) for (let j = 0; j < c.h; j++){
    const bx = c.x + i, bz = c.y + j;
    for (let k = 0; k < 4; k++){
      if (c.v) quad(bx + .1, bz + k * .25 + .04, bx + .9, bz + k * .25 + .18, wht);
      else quad(bx + k * .25 + .04, bz + .1, bx + k * .25 + .18, bz + .9, wht);
    }
  }
  W3.decal = v.length ? g3Mesh('flat', v, idx) : null;
}
/* 타일 윗면 높이: 인도는 연석만큼 높다 */
function surfY(tx, ty){ const ch = tileAt(Math.floor(tx), Math.floor(ty)); return ch === ':' ? .125 : 0; }
function colTopOf(ch){ return {'#':3, 'B':5, 'T':4.2, 'F':1, 'D':3, ':':.125, 'r':.15}[ch] || .02; }

/* ----- DDA 광선: 화면에서 누른 곳의 블록 찾기 (minecraft-weekend ray_block) ----- */
function w3Ray(o, d, maxD, hit){
  let x = Math.floor(o[0]), y = Math.floor(o[1]), z = Math.floor(o[2]);
  const sx = Math.sign(d[0]), sy = Math.sign(d[1]), sz = Math.sign(d[2]);
  const ib = (s, ds) => ds > 0 ? (Math.ceil(s) - s) / ds : ds < 0 ? (s - Math.floor(s)) / -ds : Infinity;
  let tx = ib(o[0], d[0]), ty = ib(o[1], d[1]), tz = ib(o[2], d[2]);
  const dx = sx ? Math.abs(1 / d[0]) : Infinity, dy = sy ? Math.abs(1 / d[1]) : Infinity, dz = sz ? Math.abs(1 / d[2]) : Infinity;
  for (let i = 0; i < 700; i++){
    if (hit(x, y, z)) return {x, y, z};
    if (tx < ty && tx < tz){ if (tx > maxD) break; x += sx; tx += dx; }
    else if (ty < tz){ if (ty > maxD) break; y += sy; ty += dy; }
    else { if (tz > maxD) break; z += sz; tz += dz; }
  }
  return null;
}
function ray3(clientX, clientY){
  const nx = clientX / CW * 2 - 1, ny = 1 - clientY / CH * 2, inv = M4.inv(CAM3.VP);
  const un = z => { const w = inv[3] * nx + inv[7] * ny + inv[11] * z + inv[15]; return [(inv[0] * nx + inv[4] * ny + inv[8] * z + inv[12]) / w, (inv[1] * nx + inv[5] * ny + inv[9] * z + inv[13]) / w, (inv[2] * nx + inv[6] * ny + inv[10] * z + inv[14]) / w]; };
  const a = un(-1), b = un(1), l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1;
  return {o:a, d:[(b[0] - a[0]) / l, (b[1] - a[1]) / l, (b[2] - a[2]) / l]};
}
function pickTile(clientX, clientY){
  const r = ray3(clientX, clientY);
  const hit = w3Ray(r.o, r.d, 260, (x, y, z) => {
    if (x < 0 || z < 0 || x >= W3.w || z >= W3.h) return false;
    if (y < -1) return true;
    const b = w3B(x, y + 1, z); return b !== BK.AIR && b !== BK.FLOWER && b !== BK.TGRASS;
  });
  if (hit) return {x:hit.x, y:hit.z};
  if (r.d[1] < -1e-4){
    const t = -r.o[1] / r.d[1], gx = Math.floor(r.o[0] + r.d[0] * t), gz = Math.floor(r.o[2] + r.d[2] * t);
    if (gx >= 0 && gz >= 0 && gx < W3.w && gz < W3.h) return {x:gx, y:gz};
  }
  return null;
}

/* ===== 모형 (상자로 짓는다, 앞은 +z) ===== */
const MODELS = new Map();
function model(key, build){ let m = MODELS.get(key); if (m === undefined){ m = build(); MODELS.set(key, m); } return m; }
function mkPerson(look, gloves){
  const L = LOOKS[look] || LOOKS.player, body = new VB(), leg = new VB(), arm = new VB();
  vbBox(leg, -.11, -.74, -.13, .11, 0, .13, L.pants);
  vbBox(leg, -.12, -.74, -.14, .12, -.62, .16, '#2a2f38');
  const shirt = L.coat ? '#f4f6f8' : L.shirt;
  vbBox(body, -.28, .72, -.16, .28, 1.36, .16, shirt);
  if (L.coat){
    vbBox(body, -.3, .42, -.17, .3, .74, .17, '#eef1f4');
    vbBox(body, -.02, .46, .17, .02, 1.34, .18, '#cfd6de');
    vbBox(body, -.22, 1.1, .17, -.1, 1.24, .185, '#3a8ee6');
  }
  if (L.vest){
    vbBox(body, -.29, .78, -.17, .29, 1.3, .17, L.vest);
    vbBox(body, -.295, .98, -.175, .295, 1.04, .175, '#fff7c2');
    vbBox(body, -.08, 1.14, .17, .08, 1.36, .18, L.shirt);
  }
  vbBox(body, -.24, 1.38, -.22, .24, 1.86, .22, L.skin);
  vbBox(body, -.25, 1.74, -.23, .25, 1.89, .23, L.hair);
  vbBox(body, -.25, 1.44, -.235, .25, 1.89, -.12, L.hair);
  vbBox(body, -.135, 1.58, .22, -.06, 1.67, .235, '#1c2733');
  vbBox(body, .06, 1.58, .22, .135, 1.67, .235, '#1c2733');
  vbBox(body, -.08, 1.47, .22, .08, 1.5, .23, '#c9786a');
  if (L.hat){ vbBox(body, -.26, 1.86, -.24, .26, 1.99, .24, L.hat); vbBox(body, -.26, 1.86, .24, .26, 1.9, .4, L.hat); }
  const sleeve = L.coat ? '#e6eaef' : L.shirt;
  vbBox(arm, -.085, -.5, -.1, .085, 0, .1, sleeve);
  vbBox(arm, -.08, -.6, -.09, .08, -.5, .09, gloves ? '#ffd23f' : L.skin);
  if (gloves) vbBox(arm, -.09, -.5, -.1, .09, -.42, .1, '#ffd23f');
  return {body:body.mesh(), leg:leg.mesh(), arm:arm.mesh(), s:L.scale || 1};
}
function mkRobot(){
  const b = new VB();
  vbBox(b, -.33, 0, -.22, -.15, .22, .26, '#39424e'); vbBox(b, .15, 0, -.22, .33, .22, .26, '#39424e');
  vbBox(b, -.3, .2, -.22, .3, .78, .22, '#d5dbe2');
  vbBox(b, -.12, .42, .22, .12, .58, .235, '#ffd23f');
  vbBox(b, -.4, .45, -.08, -.3, .72, .08, '#b9c2cc'); vbBox(b, .3, .45, -.08, .4, .72, .08, '#b9c2cc');
  vbBox(b, -.26, .8, -.2, .26, 1.14, .2, '#eef3f8');
  vbBox(b, -.21, .87, .2, .21, 1.07, .215, '#1b2a3a');
  vbBox(b, -.15, .94, .214, -.06, 1.0, .226, '#3ee0ff', 3); vbBox(b, .06, .94, .214, .15, 1.0, .226, '#3ee0ff', 3);
  vbBox(b, -.02, 1.14, -.02, .02, 1.34, .02, '#6f7b88');
  return b.mesh();
}
function mkBall(col){ const b = new VB(); vbBox(b, -.06, 1.32, -.06, .06, 1.44, .06, col, 3); return b.mesh(); }
function mkCar(color, ev){
  const b = new VB(), dark = hexShade(color, -.25);
  vbBox(b, -.38, .14, -.75, .38, .5, .75, color);
  vbBox(b, -.33, .5, -.4, .33, .82, .3, dark);
  vbBox(b, -.31, .53, .3, .31, .79, .31, '#bfe3ff');
  vbBox(b, -.31, .53, -.41, .31, .79, -.4, '#9cc8e8');
  vbBox(b, -.335, .55, -.32, -.33, .79, .26, '#a9d4f2'); vbBox(b, .33, .55, -.32, .335, .79, .26, '#a9d4f2');
  for (const [x, z] of [[-.38, .45], [.38, .45], [-.38, -.45], [.38, -.45]]) vbBox(b, x - .07, 0, z - .17, x + .07, .32, z + .17, '#1d2228');
  vbBox(b, -.32, .3, .75, -.18, .4, .765, '#fff6b0', 3); vbBox(b, .18, .3, .75, .32, .4, .765, '#fff6b0', 3);
  vbBox(b, -.32, .3, -.765, -.2, .38, -.75, '#ff5a4f', 3); vbBox(b, .2, .3, -.765, .32, .38, -.75, '#ff5a4f', 3);
  if (ev){ vbBox(b, -.06, .82, -.18, .06, .835, .12, '#ffd23f'); vbBox(b, -.39, .3, -.2, -.38, .4, .2, '#3a8ee6'); vbBox(b, .38, .3, -.2, .39, .4, .2, '#3a8ee6'); }
  return b.mesh();
}
function mkLampPole(){
  const b = new VB();
  vbBox(b, -.2, 0, -.2, .2, .12, .2, '#2b323b');
  vbBox(b, -.06, 0, -.06, .06, 3.3, .06, '#39424e');
  vbBox(b, -.05, 3.2, -.05, .05, 3.28, .74, '#39424e');
  vbBox(b, -.15, 3.08, .5, .15, 3.24, .84, '#2f3740');
  return b.mesh();
}
function mkLampBulb(col, emit){ const b = new VB(); vbBox(b, -.11, 2.98, .56, .11, 3.08, .78, col, emit); return b.mesh(); }
function mkTower(){
  const b = new VB();
  vbBox(b, -.62, 0, -.62, .62, .45, .62, '#8a8f98'); vbBox(b, -.64, .38, -.64, .64, .45, .64, '#6f757e');
  for (let k = 0; k < 9; k++){
    const y0 = .45 + k * .8, r = .5 - k * .035, t = .07;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) vbBox(b, sx * r - t, y0, sz * r - t, sx * r + t, y0 + .8, sz * r + t, '#39424e');
    vbBox(b, -r, y0 + .72, -r - .03, r, y0 + .78, -r + .03, '#4a525c'); vbBox(b, -r, y0 + .72, r - .03, r, y0 + .78, r + .03, '#4a525c');
    vbBox(b, -r - .03, y0 + .72, -r, -r + .03, y0 + .78, r, '#4a525c'); vbBox(b, r - .03, y0 + .72, -r, r + .03, y0 + .78, r, '#4a525c');
  }
  vbBox(b, -.45, 7.65, -.45, .45, 7.8, .45, '#39424e'); vbBox(b, -.2, 7.8, -.2, .2, 8.0, .2, '#39424e');
  return b.mesh();
}
function mkBigBulb(col, emit){
  const b = new VB();
  vbBox(b, -.34, 8.0, -.34, .34, 8.15, .34, col, emit); vbBox(b, -.46, 8.15, -.46, .46, 8.78, .46, col, emit); vbBox(b, -.34, 8.78, -.34, .34, 8.98, .34, col, emit);
  vbBox(b, -.05, 8.3, .46, .11, 8.62, .48, emit > 0 ? '#e2782b' : '#5d646e', emit > 0 ? 3 : -1);
  return b.mesh();
}
function mkPedestal(ring){
  const b = new VB();
  vbBox(b, -.32, 0, -.32, .32, .42, .32, '#4a5563'); vbBox(b, -.37, .42, -.37, .37, .5, .37, '#39424e');
  vbBox(b, -.26, .5, -.26, .26, .53, .26, ring, 3);
  return b.mesh();
}
function mkStand(){ const b = new VB(); vbBox(b, -.22, 0, -.22, .22, .06, .22, '#6b4523'); vbBox(b, -.05, .06, -.05, .05, .82, .05, '#8f6a3a'); return b.mesh(); }
function mkCrate(){ const b = new VB(); vbBox(b, -.36, 0, -.36, .36, .72, .36, null, -1, TX.crate); return b.mesh(); }
function mkSign(){
  const b = new VB();
  vbBox(b, -.05, 0, -.05, .05, 1.2, .05, '#6b4523');
  vbBox(b, -.44, .95, -.04, .44, 1.45, .04, '#e9d3a8');
  vbBox(b, -.3, 1.27, .04, .3, 1.31, .05, '#6b4523'); vbBox(b, -.3, 1.14, .04, .12, 1.18, .05, '#6b4523'); vbBox(b, -.3, 1.04, .04, .2, 1.08, .05, '#6b4523');
  return b.mesh();
}
function mkScrap(seed){
  const b = new VB(), cols = ['#8a9099', '#a0663a', '#c9ced6', '#5b6573', '#d94141', '#7d8691'];
  for (let k = 0; k < 9; k++){
    const r = i => hash2(k, i, seed), sx = .15 + r(1) * .3, sy = .1 + r(2) * .25, sz = .15 + r(3) * .3;
    const x = (r(4) - .5) * .7, z = (r(5) - .5) * .7, y = k < 5 ? 0 : .18 + r(6) * .22;
    vbBox(b, x - sx / 2, y, z - sz / 2, x + sx / 2, y + sy, z + sz / 2, cols[k % cols.length]);
  }
  return b.mesh();
}
function mkCharger(){
  const b = new VB();
  vbBox(b, -.22, 0, -.16, .22, 1.3, .16, '#2f3a46'); vbBox(b, -.14, .85, .16, .14, 1.1, .17, '#25d17a', 3);
  vbBox(b, -.24, 1.3, -.18, .24, 1.36, .18, '#39424e'); vbBox(b, -.05, .45, .16, .05, .55, .36, '#1d2228');
  return b.mesh();
}
function tableBox(b, top, w = .45, d = .3, h = .76){
  vbBox(b, -w, h, -d, w, h + .06, d, top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) vbBox(b, sx * (w - .06) - .03, 0, sz * (d - .06) - .03, sx * (w - .06) + .03, h, sz * (d - .06) + .03, '#6f757e');
}
function mkStation(act){
  const b = new VB();
  if (act === 'exp'){
    tableBox(b, '#eef3f8');
    vbBox(b, -.34, .82, -.12, -.14, 1.02, .08, '#2f3a46'); vbBox(b, -.32, 1.02, -.1, -.16, 1.06, .06, '#ffd23f');
    vbBox(b, .02, .82, -.08, .26, .98, .08, '#c87533'); vbBox(b, .11, .98, -.02, .17, 1.14, .02, '#9aa0a6');
    vbBox(b, -.14, .84, .1, .3, .86, .13, '#d94141');
  } else if (act === 'crane'){
    vbBox(b, -.42, 0, -.26, .42, .86, .26, '#4a5563'); vbBox(b, -.45, .86, -.28, .45, .93, .28, '#39424e');
    vbBox(b, -.32, .93, -.1, -.1, .96, .1, '#ffd23f', 3);
    vbBox(b, .12, .93, -.03, .18, 1.2, .03, '#2b323b'); vbBox(b, .08, 1.2, -.07, .22, 1.33, .07, '#d94141', 3);
    vbBox(b, -.32, .56, .26, .32, .8, .27, '#3ee0ff', 3);
  } else if (act === 'g_detect'){
    tableBox(b, '#eef3f8');
    vbBox(b, -.34, .82, -.12, -.1, 1.08, .1, '#39424e'); vbBox(b, -.3, .88, .1, -.14, 1.02, .11, '#9aa3ad');
    vbBox(b, .16, .82, -.02, .2, 1.0, .02, '#8a6a48');
    vbBox(b, .02, 1.0, -.02, .34, 1.04, .02, '#ffd23f'); vbBox(b, .02, 1.28, -.02, .34, 1.32, .02, '#ffd23f');
    vbBox(b, .02, 1.0, -.02, .06, 1.32, .02, '#ffd23f'); vbBox(b, .3, 1.0, -.02, .34, 1.32, .02, '#ffd23f');
    vbBox(b, .06, 1.04, -.005, .3, 1.28, .005, '#bfe6ff', 3);
  } else if (act === 'g_home'){
    tableBox(b, '#b07a45');
    vbBox(b, -.24, .82, -.18, .24, 1.1, .18, '#f3e9d6');
    vbBox(b, -.28, 1.1, -.22, .28, 1.16, .22, '#d94141'); vbBox(b, -.2, 1.16, -.16, .2, 1.22, .16, '#d94141'); vbBox(b, -.1, 1.22, -.1, .1, 1.28, .1, '#d94141');
    vbBox(b, -.05, .82, .18, .05, .98, .19, '#8a6a48'); vbBox(b, .09, .96, .18, .19, 1.04, .19, '#ffd23f', 3);
  } else if (act === 'tree' || act === 'nb'){
    tableBox(b, '#b07a45');
    vbBox(b, -.31, .82, -.13, .31, 1.3, -.06, '#2b323b');
    vbBox(b, -.27, .86, -.06, .27, 1.26, -.05, act === 'tree' ? '#3ee0ff' : '#8ff0b9', 3);
    vbBox(b, -.05, .82, -.1, .05, .88, -.06, '#2b323b'); vbBox(b, -.24, .82, .05, .24, .84, .2, '#d5dbe2');
  } else {
    tableBox(b, '#b07a45');
    vbBox(b, -.32, .82, -.16, -.12, 1.02, .04, '#d94141'); vbBox(b, -.06, .82, -.1, .14, 1.02, .1, '#3a8ee6');
    vbBox(b, .18, .82, -.16, .38, 1.0, .02, '#25a862'); vbBox(b, -.22, 1.02, -.13, -.02, 1.22, .07, '#ffd23f');
  }
  return b.mesh();
}
function mkFlag(){ const b = new VB(); vbBox(b, -.04, 0, -.04, .04, 1.7, .04, '#e9e1cf'); vbBox(b, .04, 1.2, -.02, .62, 1.62, .02, '#e5483a'); return b.mesh(); }
function mkMaglev(){
  const b = new VB();
  vbBox(b, -1.25, .28, -.42, 1.25, 1.05, .42, '#eef3f8');
  vbBox(b, 1.25, .28, -.36, 1.55, .9, .36, '#dfe6ee'); vbBox(b, 1.55, .28, -.28, 1.72, .7, .28, '#cfd8e2');
  vbBox(b, -1.55, .28, -.36, -1.25, .9, .36, '#dfe6ee'); vbBox(b, -1.72, .28, -.28, -1.55, .7, .28, '#cfd8e2');
  vbBox(b, -1.26, .5, -.43, 1.26, .58, .43, '#3a8ee6');
  vbBox(b, -1.2, .68, -.425, 1.2, .9, .425, '#2b3a4a', 2);
  vbBox(b, -1.3, .2, -.34, 1.3, .28, .34, '#3ee0ff', 3);
  return b.mesh();
}
function mkUnit(col, w){ const b = new VB(); vbBox(b, -w, 0, -w, w, 1, w, col); return b.mesh(); }
function flatDisc(n = 18){
  const v = [0, 0, 0, 0, 0, 0, .34], idx = [];
  for (let i = 0; i < n; i++){ const a = -i / n * Math.PI * 2; v.push(Math.cos(a), 0, Math.sin(a), 0, 0, 0, 0); }
  for (let i = 0; i < n; i++) idx.push(0, 1 + i, 1 + (i + 1) % n);
  return g3Mesh('flat', v, idx);
}
function flatRing(r0, r1, col, n = 28){
  const v = [], idx = [];
  for (let i = 0; i <= n; i++){ const a = -i / n * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); v.push(c * r0, 0, s * r0, ...col, c * r1, 0, s * r1, ...col); }
  for (let i = 0; i < n; i++){ const b = i * 2; idx.push(b, b + 1, b + 3, b, b + 3, b + 2); }
  return g3Mesh('flat', v, idx);
}
function flatBeam(){
  const v = [], idx = [], H = 14, w = .32, lo = [1, .82, .25, .5], hi = [1, .82, .25, 0];
  for (const [ax, az] of [[1, 0], [0, 1]]){
    const b = v.length / 7;
    v.push(-ax * w, 0, -az * w, ...lo, ax * w, 0, az * w, ...lo, ax * w, H, az * w, ...hi, -ax * w, H, -az * w, ...hi);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  return g3Mesh('flat', v, idx);
}
function flatCube(col){
  const v = [], idx = [];
  for (const F of FACES){ const b = v.length / 7; for (const q of F.c) v.push(q[0], q[1], q[2], ...col); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  return g3Mesh('flat', v, idx);
}

/* ===== 카메라: 3인칭(돌리기·당기기) · 1인칭 · 처음 화면 · 컷신 · 대화 클로즈업 ===== */
const CAM3 = {yaw:0, pitch:.92, dist:13, tx:30, ty:0, tz:22, sx:0, sy:0, uYaw:0, uPitch:.92, uDist:13, fp:false, fpPitch:-.12,
  fpActive:false, eye:[0, 0, 0], V:null, P:null, VP:null, fov:.8, csYaw:0, inCs:false, snap:true};
function cam3Snap(){ CAM3.snap = true; }
function dialogNPC(){
  const D = UI.dialog; if (!D || !WORLD || MODE !== 'play') return null;
  const ln = D.lines[D.i], who = (ln && typeof ln === 'object' && ln.who) || D.who; if (!who) return null;
  const o = WORLD.objects.find(q => q.type === 'npc' && q.name === who) || (WORLD.walkers || []).find(q => q.name === who);
  return o && Math.hypot(o.x + .5 - player.x, o.y + .5 - player.y) < 5.5 ? o : null;
}
function cam3Update(dt){
  const C = CAM3, talk = dialogNPC();
  let tx, ty, tz, yaw = C.uYaw, pitch = C.uPitch, dist = C.uDist, sx = 0, sy = 0, rate = .004;
  if (STORYFX.cam && !C.inCs){ C.inCs = true; C.csYaw = C.yaw; } else if (!STORYFX.cam) C.inCs = false;
  if (MODE === 'title'){
    tx = WORLD.w / 2 + 2; ty = 0; tz = WORLD.h / 2; yaw = TIME * .045; pitch = .58; dist = Math.max(WORLD.w, WORLD.h) * .74; sx = CW > 760 ? .3 : 0; rate = .05;
  } else if (STORYFX.cam){
    tx = STORYFX.cam.x; ty = 1; tz = STORYFX.cam.y; C.csYaw += dt * .05; yaw = C.csYaw; pitch = .62; dist = 17; sy = .1; rate = .03;
    const tw = WORLD.objects.find(o => o.kind === 'tower');
    if (tw && Math.hypot(tx - tw.x - .5, tz - tw.y - .5) < 3){ ty = 4.6; pitch = .4; dist = 19; }
    if (TIME < STORYFX.fwUntil || STORYFX.towerOn){ ty = 6.5; pitch = .26; dist = 24; }
  } else if (MODE === 'crane'){
    /* 고철 줄(가로 약 14칸)이 화면에 다 들어오게 거리를 정하고, 아래 조종판이 가리는 만큼 장면을 위로 올린다 */
    const a = G3.W / Math.max(1, G3.H), fe = a < 1 ? Math.min(1.3, .8 / Math.sqrt(Math.max(.4, a))) : .8;
    const bar = $('#craneBar'), bh = bar && !bar.hidden ? bar.getBoundingClientRect().height : 0;
    tx = 39; ty = 2.1; tz = 2.7; yaw = 0; pitch = .42; dist = Math.max(12.2, 7.4 / (Math.tan(fe / 2) * a)); sy = clamp(bh / Math.max(1, CH), .2, .5); rate = .02;
  } else if (MODE === 'epi'){
    const c = epiCam(); tx = c.tx; ty = c.ty; tz = c.tz; yaw = c.yaw; pitch = c.pitch; dist = c.dist; sy = c.sy; rate = c.rate;
  } else if (MODE === 'gate' && ZONE.gate){
    const c = zoneGateCam(); tx = c.tx; ty = c.ty; tz = c.tz; yaw = c.yaw; pitch = c.pitch; dist = c.dist; rate = c.rate;
  } else if (MODE === 'play' && ZONE.focus){
    const c = zoneCamAdjust(C); tx = c.tx; ty = c.ty; tz = c.tz; yaw = c.yaw; pitch = c.pitch; dist = c.dist; rate = c.rate;
  } else if (MODE === 'mg3' && MG3.sc){
    /* 미니 게임 무대: 게임 글 사이 빈 곳에 무대가 꽉 차게 */
    const c = mg3CamParams(); tx = c.tx; ty = c.ty; tz = c.tz; yaw = c.yaw; pitch = c.pitch; dist = c.dist; sy = c.sy; rate = .012;
  } else if (talk){
    /* 대화 클로즈업: 두 사람을 옆에서 잡는다. 벽·물체가 덜 가리는 쪽을 고르고, 양쪽 다 막히면 위에서 본다 */
    const nx = talk.x + .5, nz = talk.y + .5, dx = nx - player.x, dz = nz - player.y, d = Math.hypot(dx, dz) || 1;
    const mx = (player.x + nx) / 2, mz = (player.y + nz) / 2, D = 5.4 + d * .5;
    const block = (px, pz) => { let c = 0; for (let s = .8; s <= D; s += .4){ const x = mx + px * s, z = mz + pz * s; if (x < 0 || z < 0 || x >= WORLD.w || z >= WORLD.h) break; if (solidAt(Math.floor(x), Math.floor(z))) c += s < 3 ? 2 : 1; } return c; };
    let px = dz / d, pz = -dx / d;
    const b1 = block(px, pz), b2 = block(-px, -pz), pref = px * Math.sin(C.uYaw) + pz * Math.cos(C.uYaw) >= 0;
    if (b2 < b1 || (b2 === b1 && !pref)){ px = -px; pz = -pz; }
    const blocked = Math.min(b1, b2) > 0;
    yaw = Math.atan2(px, pz); pitch = blocked ? .55 : .26; dist = D; tx = mx; tz = mz; ty = 1.15; sy = .2; rate = .01;
  } else if (MODE === 'patrol'){ tx = ROBOT.x; tz = ROBOT.y; ty = 1; }
  else {
    tx = player.x; tz = player.y; ty = (player.h || 0) + 1;
    if (ZONE.ease > 0){ const e = ZONE.ease * ZONE.ease; dist = lerp(dist, 4.4, e); pitch = lerp(pitch, .3, e); rate = .03; }   /* 문을 지나온 직후: 가까이서 천천히 물러난다 */
  }
  if (C.snap){ Object.assign(C, {tx, ty, tz, yaw, pitch, dist, sx, sy, snap:false}); return; }
  const k = 1 - Math.pow(rate, dt), ka = 1 - Math.pow(Math.min(rate, .0002), dt);
  C.tx += (tx - C.tx) * k; C.ty += (ty - C.ty) * k; C.tz += (tz - C.tz) * k;
  C.yaw += angDiff(yaw, C.yaw) * ka; C.pitch += (pitch - C.pitch) * ka; C.dist += (dist - C.dist) * k;
  C.sx += (sx - C.sx) * k; C.sy += (sy - C.sy) * k;
}
function cam3Matrices(){
  const C = CAM3, asp = G3.W / G3.H;
  let ex, ey, ez, tx, ty, tz;
  C.fpActive = C.fp && MODE === 'play' && !STORYFX.cam && !dialogNPC();
  if (C.fpActive){
    ex = player.x; ey = (player.h || 0) + 1.58; ez = player.y;
    const cp = Math.cos(C.fpPitch); tx = ex - Math.sin(C.uYaw) * cp; ty = ey + Math.sin(C.fpPitch); tz = ez - Math.cos(C.uYaw) * cp;
    C.fov = 1.1; C.yaw = C.uYaw;
  } else {
    const cp = Math.cos(C.pitch); tx = C.tx; ty = C.ty; tz = C.tz;
    ex = tx + Math.sin(C.yaw) * cp * C.dist; ey = ty + Math.sin(C.pitch) * C.dist; ez = tz + Math.cos(C.yaw) * cp * C.dist; C.fov = .8;
  }
  if ((MODE === 'mg3' || MODE === 'play') && FX3.shk > 0){ const a = FX3.shk, dx = (Math.random() - .5) * a, dy = (Math.random() - .5) * a; ex += dx; ey += dy; tx += dx; ty += dy; }   // 미니 게임 흔들림
  if (asp < 1) C.fov = Math.min(1.3, C.fov / Math.sqrt(Math.max(.4, asp)));   // 세로 화면은 시야를 넓힌다
  C.eye = [ex, ey, ez];
  C.V = M4.look(ex, ey, ez, tx, ty, tz, C.yaw);
  C.P = M4.persp(C.fov, asp, .08, 240, C.sx, C.sy);
  C.VP = M4.mul(C.P, C.V);
}
function proj3(x, y, z){
  const m = CAM3.VP, w = m[3] * x + m[7] * y + m[11] * z + m[15];
  const px = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w, py = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  return {x:(px * .5 + .5) * CW, y:(.5 - py * .5) * CH, ok:w > .05};
}

/* ===== 걷기 · 가까운 물체 · 눌러서 가기 ===== */
const PATH3 = {nodes:null, goal:null, stuck:0, arrived:null, mark:null};
function blocked3(x, y){
  for (const [px, py] of [[x - .26, y - .22], [x + .26, y - .22], [x - .26, y + .22], [x + .26, y + .22]]) if (solidAt(Math.floor(px), Math.floor(py))) return true;
  return false;
}
function findNear3(){
  let best = null, bd = 1e9;
  const fx = -Math.sin(CAM3.uYaw), fz = -Math.cos(CAM3.uYaw);
  for (const o of WORLD.objects){
    if (o.type === 'deco') continue;
    const dx = o.x + .5 - player.x, dz = o.y + .5 - player.y, d = Math.hypot(dx, dz);
    if (CAM3.fp){
      if (d > 2.6) continue;
      const dot = d > .01 ? (dx * fx + dz * fz) / d : 1;
      if (d > 1.3 && dot < .55) continue;
      const sc = d * (1.4 - Math.max(0, dot)); if (sc < bd){ bd = sc; best = o; }
    } else if (d < 1.6 && d < bd){ bd = d; best = o; }
  }
  for (const w of (WORLD.walkers || [])){
    if (walkerHidden(w)) continue;
    const d = Math.hypot(w.x + .5 - player.x, w.y + .5 - player.y), lim = CAM3.fp ? 2.2 : 1.8;
    if (d < lim && (CAM3.fp ? d * .9 : d) < bd){ bd = CAM3.fp ? d * .9 : d; best = w; }
  }
  for (const p of (WORLD.peds || [])){
    if (p.hospital) continue;
    const d = Math.hypot(p.x - player.x, p.y - player.y), lim = p.injured || p.fight ? 2.4 : 1.6;
    if (d < lim && d * (p.injured || p.fight || p.check ? .6 : 1) < bd){ bd = d * (p.injured || p.fight || p.check ? .6 : 1); best = p; }
  }
  return best;
}
function updatePlayer3D(dt){
  const C = CAM3, K = k => KEYS.has(k);
  let mx = 0, mz = 0;
  if (C.fp){
    const turn = (K('ArrowRight') ? 1 : 0) - (K('ArrowLeft') ? 1 : 0); if (turn) C.uYaw -= turn * dt * 2.3;
    const f = (K('KeyW') || K('ArrowUp') ? 1 : 0) - (K('KeyS') || K('ArrowDown') ? 1 : 0) - JOY.y;
    const s = (K('KeyD') ? 1 : 0) - (K('KeyA') ? 1 : 0) + JOY.x, sn = Math.sin(C.uYaw), cs = Math.cos(C.uYaw);
    mx = -sn * f + cs * s; mz = -cs * f - sn * s;
  } else {
    const v = inputVector(), sn = Math.sin(C.uYaw), cs = Math.cos(C.uYaw);
    mx = v.x * cs + v.y * sn; mz = -v.x * sn + v.y * cs;
  }
  let m = Math.hypot(mx, mz); if (m > 1){ mx /= m; mz /= m; m = 1; }
  if (m > .05){ PATH3.nodes = null; PATH3.goal = null; }
  else if (PATH3.nodes){
    const n = PATH3.nodes[0];
    if (!n){ PATH3.arrived = PATH3.goal; PATH3.nodes = null; PATH3.goal = null; }
    else {
      const dx = n.x + .5 - player.x, dz = n.y + .5 - player.y, d = Math.hypot(dx, dz);
      if (d < .16){ PATH3.nodes.shift(); if (!PATH3.nodes.length){ PATH3.arrived = PATH3.goal; PATH3.nodes = null; PATH3.goal = null; } }
      else { mx = dx / d; mz = dz / d; m = 1; }
    }
  }
  if (m > .05){
    const sp = (C.fp ? 4.0 : 4.6) * dt * Math.min(1, m) * rpgSpeed() * bikeMul(), ox = player.x, oz = player.y;
    if (!blocked3(player.x + mx * sp, player.y)) player.x += mx * sp;
    if (!blocked3(player.x, player.y + mz * sp)) player.y += mz * sp;
    const moved = Math.hypot(player.x - ox, player.y - oz);
    if (PATH3.nodes){ if (moved < sp * .25){ PATH3.stuck += dt; if (PATH3.stuck > .8){ PATH3.nodes = null; PATH3.goal = null; } } else PATH3.stuck = 0; }
    player.moving = moved > .0005; if (player.moving) player.walk += dt;
    if (!C.fp && player.moving) player.ang = angLerp(player.ang || 0, Math.atan2(mx, mz), 1 - Math.pow(.0004, dt));
  } else { player.moving = false; player.walk = 0; }
  if (C.fp) player.ang = Math.atan2(-Math.sin(C.uYaw), -Math.cos(C.uYaw));
  player.h = lerp(player.h || 0, surfY(player.x, player.y), 1 - Math.pow(.0001, dt));
  NEAR = evNear(findNear3());
  checkPickups();
  if (PATH3.arrived){ const g = PATH3.arrived; PATH3.arrived = null; if (g && NEAR === g && !uiBlocking()) interact(g); }
  if (WORLD.kind === 'story'){
    updatePlayer.saveT = (updatePlayer.saveT || 0) + dt;
    if (updatePlayer.saveT > 3){ updatePlayer.saveT = 0; SAVE.pos = {x:+player.x.toFixed(2), y:+player.y.toFixed(2)}; persist(); }
  }
}
function objMidY(o){ return ({npc:1.1, device:1.2, scene:1.0, mission:1.1, test:.5, sign:1.1, walker:.8, gate:2.2, portal:1.1})[o.type] || .8; }
function walkTo(tx, ty, obj){
  const sx = Math.floor(player.x), sy = Math.floor(player.y);
  const path = (obj || solidAt(tx, ty)) ? bfsPath(sx, sy, (x, y) => Math.abs(x - tx) + Math.abs(y - ty) === 1) : bfsPath(sx, sy, (x, y) => x === tx && y === ty);
  if (!path){ toast('거기로는 갈 수 없어요.'); return; }
  PATH3.nodes = path; PATH3.goal = obj; PATH3.stuck = 0; PATH3.mark = {x:tx, y:ty, t:TIME};
  if (!path.length){ PATH3.nodes = null; PATH3.arrived = obj; }
}
function tap3(cx, cy){
  if (NEAR){ const s = proj3(NEAR.x + .5, objMidY(NEAR) + surfY(NEAR.x, NEAR.y), NEAR.y + .5); if (s.ok && Math.hypot(s.x - cx, s.y - cy) < Math.max(64, TS * 1.7)) return interact(NEAR); }
  if (CAM3.fp) return;
  let best = null, bd = 48;
  for (const o of WORLD.objects.concat((WORLD.walkers || []).filter(w => !walkerHidden(w)))){
    if (o.type === 'deco') continue;
    const s = proj3(o.x + .5, objMidY(o), o.y + .5); if (!s.ok) continue;
    const d = Math.hypot(s.x - cx, s.y - cy); if (d < bd){ bd = d; best = o; }
  }
  if (best) return walkTo(best.x, best.y, best);
  const t = pickTile(cx, cy); if (t) walkTo(t.x, t.y, null);
}

/* ===== 하늘·햇빛·안개: 마을 전력이 낮으면 해 질 녘, 점등식 뒤에는 축제의 밤 ===== */
const ENV = {dark:.7, story:null};
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function envNow(dt){
  const story = !!(WORLD && WORLD.kind === 'story' && MODE !== 'editor' && MODE !== 'mg3');   // 미니 게임 무대는 늘 낮
  const F = STORYFX, fin = story && (SAVE.story.finale || F.forceLit);
  const target = story ? (fin ? .82 : clamp(1 - (F.s - .1) / .8, 0, 1)) : 0;
  if (ENV.story !== story){ ENV.story = story; ENV.dark = target; }
  ENV.dark += (target - ENV.dark) * (1 - Math.pow(.2, dt));
  const dk = clamp(ENV.dark + (story ? townFlicker(TIME, F.s) * .45 : 0), 0, 1), bright = lerp(1, .42, dk);
  let top = mixc([.49, .75, .94], [.14, .16, .38], dk), hor = mixc([.98, .9, .74], [.93, .52, .37], dk), sun = mixc([1, .97, .9], [.55, .52, .78], dk).map(v => v * bright);
  let sunD = [-.82, .08 + (1 - dk) * .5, -.42], sunC = mixc([1, .95, .82], [1, .55, .3], dk).map(v => v * .8), stars = clamp((dk - .55) * 2.2, 0, 1) * .8;
  if (fin){ top = mixc(top, [.03, .05, .17], .85); hor = mixc(hor, [.14, .18, .38], .85); sun = [.13, .15, .29]; sunD = [.4, .55, -.7]; sunC = [.5, .55, .7]; stars = 1; }
  const l = Math.hypot(...sunD); sunD = sunD.map(v => v / l);
  const fog = MODE === 'title' ? [55, 130] : CAM3.fpActive ? [22, 60] : [CAM3.dist + 14, CAM3.dist + 60];
  return {story, fin, dk, bright, top, hor, sun, amb:[.09, .1, .14], sunD, sunC, stars, fog, stab:story ? (fin ? 1 : F.s) : -1};
}

/* ===== 가로등·전구탑 빛 (블록 빛 단계처럼 거리마다 1씩 준다) ===== */
const LBUF = new Float32Array(NLIGHT * 4), LCOL = new Float32Array(NLIGHT * 3);
let LN = 0;
function addLight(x, y, z, lv, c){ if (LN >= NLIGHT || lv <= 0) return; LBUF[LN * 4] = x; LBUF[LN * 4 + 1] = y; LBUF[LN * 4 + 2] = z; LBUF[LN * 4 + 3] = lv; LCOL[LN * 3] = c[0]; LCOL[LN * 3 + 1] = c[1]; LCOL[LN * 3 + 2] = c[2]; LN++; }
function lampArm(o){ if (o._arm === undefined) o._arm = tileAt(o.x, o.y + 1) === '=' ? 1 : tileAt(o.x, o.y - 1) === '=' ? -1 : 1; return o._arm; }
function collectLights(env){
  LN = 0; LBUF.fill(0); LCOL.fill(0);
  if (!WORLD || MODE === 'editor') return;
  const t = TIME, fin = env.fin;
  if (WORLD.kind === 'story'){
    for (const o of WORLD.objects){
      if (o.kind === 'lamp'){ const k = lampLevel(o, t, fin); if (k > 0){ const a = lampArm(o); addLight(o.x + .5, surfY(o.x, o.y) + 3, o.y + .5 + a * .66, 12.5 * k, [1, .8, .48]); } }
      else if (o.kind === 'tower' && (fin || STORYFX.towerOn)) addLight(o.x + .5, 8.4, o.y + .5, 15, [1, .9, .66]);
      else if (o.kind === 'charger') addLight(o.x + .5, 1, o.y + .9, 4, [.4, 1, .6]);
    }
  }
  if (MODE === 'crane'){ addLight(35.6, 4.4, 3.4, 13, [1, .97, .9]); addLight(42.4, 4.4, 3.4, 13, [1, .97, .9]); }   // 크레인 작업등
  if (MODE === 'mg3') mg3Lights();
  if (MODE === 'epi') epiLights();
  else { zoneLights(); placeLights(); }
  const talk = dialogNPC();
  if (talk && env.dk > .15) addLight((player.x + talk.x + .5) / 2 + Math.sin(CAM3.yaw) * 1.5, 2.2, (player.y + talk.y + .5) / 2 + Math.cos(CAM3.yaw) * 1.5, 10, [1, .95, .85]);
  if (env.dk > .25 && MODE !== 'title'){
    addLight(player.x, (player.h || 0) + 1.6, player.y, 4.5 + env.dk * 2 + (hasEquipped('led') ? 4.5 : 0), [.9, .88, .78]);
    if (ROBOT.active) addLight(ROBOT.x, 1.4, ROBOT.y, 6, [.5, .9, 1]);
  }
}

/* ===== 그리기 ===== */
const SHADOWS = [];
const SPRB = {buf:new Float32Array(32 * 220), mesh:null, n:0};
const PTB = {buf:new Float32Array(8 * 3000), mesh:null};
let VOXU = null, CUT = null;
function voxSetup(env, cut){
  const gl = G3.gl, U = g3Use('vox');
  gl.uniformMatrix4fv(U.uVP, false, CAM3.VP); gl.uniformMatrix4fv(U.uM, false, M4.I());
  gl.uniform3fv(U.uSun, env.sun); gl.uniform3fv(U.uAmb, env.amb);
  gl.uniform4fv(U.uL, LBUF); gl.uniform3fv(U.uLC, LCOL);
  gl.uniform3fv(U.uFogC, env.hor); gl.uniform2f(U.uFog, env.fog[0], env.fog[1]); gl.uniform3fv(U.uEye, CAM3.eye);
  gl.uniform1f(U.uStab, env.stab); gl.uniform1f(U.uTime, TIME); gl.uniform1f(U.uGlow, 1); gl.uniform1f(U.uAlpha, 1); gl.uniform1f(U.uWave, 0);
  setCut(U, cut);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, G3.atlas); gl.uniform1i(U.uTex, 0);
  VOXU = U; return U;
}
function setCut(U, cut){ const gl = G3.gl; if (cut){ gl.uniform4f(U.uCut, cut[0], cut[1], cut[2], cut[3]); gl.uniform3fv(U.uCutEye, CAM3.eye); } else gl.uniform4f(U.uCut, 0, 0, 0, 0); }
function drawM(mesh, M){ if (!mesh) return; G3.gl.uniformMatrix4fv(VOXU.uM, false, M); g3Draw(mesh); }
function sprAdd(x, y, z, uv, s){
  if (SPRB.n >= 220) return;
  const b = SPRB.buf, o = SPRB.n * 32, K = [-1, -1, 1, -1, 1, 1, -1, 1], T = [uv[0], uv[3], uv[2], uv[3], uv[2], uv[1], uv[0], uv[1]];
  for (let k = 0; k < 4; k++){ const p = o + k * 8; b[p] = x; b[p + 1] = y; b[p + 2] = z; b[p + 3] = K[k * 2]; b[p + 4] = K[k * 2 + 1]; b[p + 5] = T[k * 2]; b[p + 6] = T[k * 2 + 1]; b[p + 7] = s; }
  SPRB.n++;
}
function g3Sub(mesh, arr, n){ const gl = G3.gl; gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo); gl.bufferSubData(gl.ARRAY_BUFFER, 0, arr.subarray(0, n)); }
function drawSprites(env){
  if (!SPRB.n || MODE === 'crane') return;
  const gl = G3.gl; g3UploadIcons();
  if (!SPRB.mesh){ const idx = []; for (let i = 0; i < 220; i++){ const b = i * 4; idx.push(b, b + 1, b + 2, b, b + 2, b + 3); } SPRB.mesh = g3Mesh('spr', SPRB.buf, idx, true); }
  else g3Sub(SPRB.mesh, SPRB.buf, SPRB.n * 32);
  const U = g3Use('spr');
  gl.uniformMatrix4fv(U.uV, false, CAM3.V); gl.uniformMatrix4fv(U.uP, false, CAM3.P);
  gl.uniform1f(U.uBright, Math.max(.86, env.bright)); gl.uniform3fv(U.uFogC, env.hor); gl.uniform2f(U.uFog, env.fog[0], env.fog[1]);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, G3.icons); gl.uniform1i(U.uTex, 0);
  g3Draw(SPRB.mesh, gl.TRIANGLES, SPRB.n * 6);
}
function flatSetup(env){
  const gl = G3.gl, U = g3Use('flat');
  gl.uniformMatrix4fv(U.uVP, false, CAM3.VP); gl.uniform3fv(U.uFogC, env.hor); gl.uniform2f(U.uFog, env.fog[0], env.fog[1]); gl.uniform3fv(U.uEye, CAM3.eye);
  return U;
}
function flatDraw(U, mesh, M, tint, prim){ const gl = G3.gl; gl.uniformMatrix4fv(U.uM, false, M); gl.uniform4fv(U.uTint, tint); g3Draw(mesh, prim); }
function drawSky(env){
  const gl = G3.gl, U = g3Use('sky'), V = CAM3.V.slice(); V[12] = V[13] = V[14] = 0;
  gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
  gl.uniformMatrix4fv(U.uInv, false, M4.inv(M4.mul(CAM3.P, V)));
  gl.uniform3fv(U.uTop, env.top); gl.uniform3fv(U.uHor, env.hor); gl.uniform3fv(U.uSunD, env.sunD); gl.uniform3fv(U.uSunC, env.sunC);
  gl.uniform1f(U.uStars, env.stars); gl.uniform1f(U.uTime, TIME);
  g3Draw(G3.sky);
  gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
}
function drawChunks(water){
  const gl = G3.gl;
  if (!water){ for (const C of W3.chunks) if (C.op) drawM(C.op, M4.I()); return; }
  gl.uniform1f(VOXU.uWave, TIME); gl.uniform1f(VOXU.uAlpha, .78); setCut(VOXU, null);
  for (const C of W3.chunks) if (C.tr) drawM(C.tr, M4.I());
  gl.uniform1f(VOXU.uWave, 0); gl.uniform1f(VOXU.uAlpha, 1);
}

/* 사람: 몸통 + 다리 2 + 팔 2, 걸을 때 흔든다 (conservation-lab 연구원 모형처럼) */
function person3(look, x, y, z, ry, walk, gloves){
  const P = model('p:' + look + (gloves ? ':g' : ''), () => mkPerson(look, gloves)), sw = walk ? Math.sin(walk * 10) * .62 : 0;
  const M = M4.trs(x, y + (walk ? Math.abs(Math.sin(walk * 10)) * .05 : 0), z, ry, P.s);
  drawM(P.body, M);
  drawM(P.leg, M4.mul(M, M4.joint(-.12, .74, 0, sw))); drawM(P.leg, M4.mul(M, M4.joint(.12, .74, 0, -sw)));
  drawM(P.arm, M4.mul(M, M4.joint(-.37, 1.33, 0, -sw * .8))); drawM(P.arm, M4.mul(M, M4.joint(.37, 1.33, 0, sw * .8)));
  SHADOWS.push([x, y, z, .42 * P.s]);
}
function robot3(x, y, z, ry, t, s = 1){
  const M = M4.trs(x, y + Math.abs(Math.sin(t * 8)) * .02 * s, z, ry, s);
  drawM(model('robot', mkRobot), M);
  drawM(Math.sin(t * 6) > 0 ? model('ballR', () => mkBall('#ff5a4f')) : model('ballY', () => mkBall('#ffd23f')), M);
  SHADOWS.push([x, y, z, .45 * s]);
}
function faceTo(o, tx, tz, dt, def){
  const want = (tx == null) ? def : Math.atan2(tx - (o.x + .5), tz - (o.y + .5));
  o._ry = angLerp(o._ry == null ? def : o._ry, want, 1 - Math.pow(.002, dt));
  return o._ry;
}
function drawObjects3D(env, dt){
  if (MODE === 'mg3'){ mg3Draw(env, dt); return; }
  if (MODE === 'epi'){ epiDraw(env, dt); return; }   // 에필로그: 집으로 가는 밤길   // 미니 게임 무대: 마을 물체 대신 무대 모형만
  const W = WORLD, t = TIME, story = W.kind === 'story', talk = dialogNPC(), playing = MODE !== 'title';
  for (const o of W.objects){
    const cx = o.x + .5, cz = o.y + .5, gy = surfY(cx, cz);
    if (zoneDraw3D(o, t, gy)) continue;
    if (o.type === 'npc'){
      const near = playing && Math.hypot(player.x - cx, player.y - cz) < 3.2;
      const ry = faceTo(o, (talk === o || near) ? player.x : null, player.y, dt, 0);
      const hop = playing && actGiverHere(o) && talk !== o ? Math.abs(Math.sin(t * 5.5)) * .38 : 0;   /* 다음에 만날 사람은 폴짝폴짝 */
      if (o.look === 'robot') robot3(cx, gy + hop, cz, ry, t); else person3(o.look, cx, gy + hop, cz, ry, 0);
    } else if (o.type === 'device'){
      const done = objDone(o), icon = story ? DEVICES.find(d => d.id === o.dev).icon : (o.icon || '⚡');
      let iy = 1.35;
      if (story && o.dev === 'maglev'){ drawM(model('maglev', mkMaglev), M4.trs(cx, Math.sin(t * 2) * .05, cz, Math.PI / 2 * 0)); iy = 1.9; }
      else if (story && o.dev === 'ev'){ drawM(model('car:#2fb36b:ev', () => mkCar('#2fb36b', true)), M4.trs(cx, gy, cz, -Math.PI / 2)); iy = 1.75; SHADOWS.push([cx, gy, cz, .7]); }
      else { drawM(model(done ? 'ped1' : 'ped0', () => mkPedestal(done ? '#25d17a' : '#3ee0ff')), M4.trs(cx, gy, cz)); SHADOWS.push([cx, gy, cz, .5]); }
      sprAdd(cx, gy + iy + Math.sin(t * 2 + o.x) * .06, cz, iconBadge('dev', icon), .42);
    } else if (o.type === 'scene' || (o.type === 'test' && testRevealed())){
      drawM(model('stand', mkStand), M4.trs(cx, gy, cz));
      const icon = o.type === 'test' ? TEST_SCENES.find(s => s.id === o.id).icon : (story ? SCENES.find(s => s.id === o.id).icon : (o.icon || '❓'));
      sprAdd(cx, gy + 1.22 + Math.sin(t * 2 + o.y) * .05, cz, iconBadge(o.type === 'test' ? 'test' : 'scene', icon), .4);
      SHADOWS.push([cx, gy, cz, .35]);
    } else if (o.type === 'test'){
      drawM(model('crate', mkCrate), M4.trs(cx, gy, cz, (hash2(o.x, o.y, 3) - .5) * .5)); SHADOWS.push([cx, gy, cz, .5]);
    } else if (o.type === 'mission'){
      drawM(model('st:' + o.act, () => mkStation(o.act)), M4.trs(cx, gy, cz));
      sprAdd(cx, gy + 1.85 + Math.sin(t * 2.4 + o.x) * .07, cz, iconBadge('mis', o.emoji), .4);
      SHADOWS.push([cx, gy, cz, .55]);
    } else if (o.type === 'sign'){
      drawM(model('sign', mkSign), M4.trs(cx, gy, cz)); SHADOWS.push([cx, gy, cz, .3]);
    } else if (o.type === 'deco'){
      if (o.kind === 'lamp'){
        const a = lampArm(o), k = lampLevel(o, t, env.fin), M = M4.trs(cx, gy, cz, a > 0 ? 0 : Math.PI);
        drawM(model('lampPole', mkLampPole), M);
        drawM(k > .5 ? model('bulbOn', () => mkLampBulb('#fff0b8', 3)) : model('bulbOff', () => mkLampBulb('#7b8590', -1)), M);
        SHADOWS.push([cx, gy, cz, .3]);
      } else if (o.kind === 'tower'){
        const on = env.fin || STORYFX.towerOn, blink = !on && STORYFX.s > .85 && Math.sin(t * 5) > 0, M = M4.trs(cx, gy, cz);
        drawM(model('tower', mkTower), M);
        drawM(on ? model('tbOn', () => mkBigBulb('#fff3b8', 3)) : blink ? model('tbBlink', () => mkBigBulb('#c9b46a', -1)) : model('tbOff', () => mkBigBulb('#8a8f98', -1)), M);
        SHADOWS.push([cx, gy, cz, .9]);
      } else if (o.kind === 'scrap'){ drawM(model('scrap' + (o.x * 3 + o.y) % 4, () => mkScrap((o.x * 3 + o.y) % 4 + 1)), M4.trs(cx, gy, cz)); SHADOWS.push([cx, gy, cz, .5]); }
      else if (o.kind === 'charger'){ drawM(model('charger', mkCharger), M4.trs(cx, gy, cz, -Math.PI / 2)); SHADOWS.push([cx, gy, cz, .3]); }
      else if (o.kind === 'evflag'){ drawM(model('flag', mkFlag), M4.trs(cx, gy, cz)); sprAdd(cx, gy + 2.1, cz, iconBadge('pick', ['①', '②', '③'][o.n] || '🚩'), .36); SHADOWS.push([cx, gy, cz, .2]); }
    }
  }
  for (const c of (W.cars || [])){
    const [x, z] = carXY(c), ry = c.axis === 'x' ? (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (c.dir > 0 ? 0 : Math.PI);
    drawM(model('car:' + c.color + (c.ev ? ':ev' : ''), () => mkCar(c.color, c.ev)), M4.trs(x, 0, z, ry));
    SHADOWS.push([x, 0, z, .75]);
    if (c.quest && story && evOn()){ const st = evq().step; if (st === 0) sprAdd(x, 2.0 + Math.sin(t * 4) * .08, z, iconBadge('pick', '⚡'), .42); else if (st === 1) sprAdd(x, 1.7, z, iconBadge('pick', '🪫'), .34); else if (Math.sin(t * 3) > -.3) sprAdd(x, 1.7, z, iconBadge('pick', '⚡'), .34); }
  }
  if (story) drawCrane3D(t);
  drawRpg3D(t);
  if (ROBOT.active){
    const dx = ROBOT.x - (ROBOT._px == null ? ROBOT.x : ROBOT._px), dz = ROBOT.y - (ROBOT._pz == null ? ROBOT.y : ROBOT._pz);
    if (Math.hypot(dx, dz) > .001) ROBOT._ry = angLerp(ROBOT._ry || 0, Math.atan2(dx, dz), .3);
    ROBOT._px = ROBOT.x; ROBOT._pz = ROBOT.y;
    robot3(ROBOT.x, surfY(ROBOT.x, ROBOT.y), ROBOT.y, ROBOT._ry || 0, t);
  }
  if (playing && !CAM3.fpActive && !(MODE === 'crane' && CR3.from === 'title')){
    if (talk) player.ang = angLerp(player.ang || 0, Math.atan2(talk.x + .5 - player.x, talk.y + .5 - player.y), 1 - Math.pow(.002, dt));
    setCut(VOXU, null);
    if (!(HP.inv > 0 && Math.floor(TIME * 12) % 2)){
      const py = bikeOn() ? drawPlayerBike3D() : (player.h || 0) + (player.jz || 0) + (player.bump > 0 ? Math.sin(player.bump / .45 * Math.PI) * .12 : 0) + (PLACE.sit ? .1 : 0);   /* 영화관 의자에 앉으면 좌석 높이 */
      person3('player', player.x, py, player.y, player.ang || 0, player.moving && !player.jz ? player.walk : 0, hasEquipped('gloves'));
    }
  }
}
function drawFlats(env, U){
  const gl = G3.gl;
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.disable(gl.CULL_FACE);
  gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -2);
  if (W3.decal) flatDraw(U, W3.decal, M4.I(), [env.bright * .95 + .05, env.bright * .95 + .05, env.bright * .95 + .05, 1]);
  const disc = model('disc', flatDisc);
  for (const [x, y, z, r] of SHADOWS) flatDraw(U, disc, M4.trs(x, y + .015, z, 0, r, 1), [1, 1, 1, .8 + env.dk * .2]);
  gl.polygonOffset(-2, -4);
  if (WORLD && MODE === 'play'){
    const ring = model('ring', () => flatRing(.55, .72, [1, .82, .25, 1])), pulse = .35 + Math.sin(TIME * 3) * .2;
    for (const o of WORLD.objects) if (o.type === 'mission' && !objDone(o)) flatDraw(U, ring, M4.trs(o.x + .5, surfY(o.x, o.y) + .02, o.y + .5, 0, 1 + Math.sin(TIME * 3) * .06), [1, 1, 1, pulse]);
    const mk = PATH3.mark;
    if (mk && (PATH3.nodes || TIME - mk.t < .6)){ const a = PATH3.nodes ? .7 : .7 * (1 - (TIME - mk.t) / .6); flatDraw(U, model('ringW', () => flatRing(.25, .4, [1, 1, 1, 1])), M4.trs(mk.x + .5, surfY(mk.x, mk.y) + .02, mk.y + .5, 0, 1 + Math.sin(TIME * 6) * .08), [1, 1, 1, a]); }
  }
  gl.disable(gl.POLYGON_OFFSET_FILL);
  if (WORLD && WORLD.kind === 'story' && MODE !== 'mg3') craneFlats(U);
  if (MODE === 'mg3') mg3Flats(U);
  if (WORLD && MODE === 'play' && (WORLD.kind === 'story' || WORLD.kind === 'room') && UI.waypoint && !uiBlocking()){
    const wp = UI.waypoint; flatDraw(U, model('beam', flatBeam), M4.trs(wp.x + .5, 0, wp.y + .5, TIME * .6), [1, 1, 1, .75 + Math.sin(TIME * 4) * .15]);
  }
  gl.enable(gl.CULL_FACE); gl.depthMask(true); gl.disable(gl.BLEND);
}
function drawParticles(){
  const L = STORYFX.fw3; if (!L || !L.length) return;
  const gl = G3.gl, b = PTB.buf; let n = 0;
  for (const p of L){ if (n >= 3000) break; const a = clamp(p.life / p.max, 0, 1), o = n * 8; b[o] = p.x; b[o + 1] = p.y; b[o + 2] = p.z; b[o + 3] = p.c[0]; b[o + 4] = p.c[1]; b[o + 5] = p.c[2]; b[o + 6] = a; b[o + 7] = (p.sz || .5) * (.5 + a); n++; }
  if (!PTB.mesh) PTB.mesh = g3Mesh('pt', PTB.buf, null, true); else g3Sub(PTB.mesh, PTB.buf, n * 8);
  const U = g3Use('pt');
  gl.uniformMatrix4fv(U.uVP, false, CAM3.VP); gl.uniform1f(U.uPx, G3.H * CAM3.P[5] / 2);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
  g3Draw(PTB.mesh, gl.POINTS, n);
  gl.depthMask(true); gl.disable(gl.BLEND);
}
function fwBurst3(x, y, z){
  const c = FW_COLORS[(Math.random() * FW_COLORS.length) | 0].split(',').map(v => v / 255);
  for (let k = 0; k < 64; k++){
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u), sp = 4.2 + Math.random() * 2.4;
    STORYFX.fw3.push({x, y, z, vx:r * Math.cos(th) * sp, vy:u * sp, vz:r * Math.sin(th) * sp, life:1.3 + Math.random() * .6, max:1.9, c});
  }
}
function updateFw3(dt){
  const L = STORYFX.fw3; if (!L.length) return;
  const drag = Math.pow(.55, dt);
  for (const p of L){ p.vy -= 3 * dt; p.vx *= drag; p.vy *= drag; p.vz *= drag; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.life -= dt; }
  STORYFX.fw3 = L.filter(p => p.life > 0);
}
function beginFrame(env){
  const gl = G3.gl;
  gl.viewport(0, 0, G3.W, G3.H);
  gl.clearColor(env.hor[0], env.hor[1], env.hor[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  SHADOWS.length = 0; SPRB.n = 0;
}
function render3D(dt){
  if (!G3.gl || G3.lost) return;
  g3Resize();
  if (W3.src !== WORLD) w3Build(WORLD, WORLD.kind);
  cam3Update(dt);
  cam3Matrices();
  const env = envNow(dt);
  collectLights(env);
  beginFrame(env);
  drawSky(env);
  const third = (MODE === 'play' || MODE === 'patrol') && !CAM3.fpActive && !STORYFX.cam && !ZONE.focus;
  const fx = MODE === 'patrol' ? ROBOT.x : dialogNPC() ? CAM3.tx : player.x, fz = MODE === 'patrol' ? ROBOT.y : dialogNPC() ? CAM3.tz : player.y;
  CUT = third ? [fx, (MODE === 'patrol' ? 0 : (player.h || 0)) + 1, fz, 2.3] : MODE === 'crane' ? [39, 1.2, 5.6, G3.W < G3.H ? 6 : 4] : null;
  const FU = flatSetup(env); flatDraw(FU, W3.ground, M4.I(), [env.sun[0] + env.amb[0], env.sun[1] + env.amb[1], env.sun[2] + env.amb[2], 1]);
  voxSetup(env, CUT);
  drawChunks(false);
  drawObjects3D(env, dt);
  drawSprites(env);
  drawFlats(env, flatSetup(env));
  const gl = G3.gl;
  voxSetup(env, null);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  drawChunks(true);
  gl.depthMask(true); gl.disable(gl.BLEND);
  drawParticles();
  overlay3D();
}

/* ----- 화면 위 2D 덧그림: 말풍선 · 이름표 · 안내 화살표 · 조준점 · 번쩍임 ----- */
function overlay3D(){
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, CW, CH);
  if (MODE === 'crane') craneOverlay();
  else if (MODE === 'mg3') mg3Overlay();
  else if (MODE === 'epi') epiOverlay();
  else if (WORLD && MODE !== 'title' && MODE !== 'editor'){
    const W = WORLD, t = TIME, ox = CAM3.fpActive ? player.x : CAM3.tx, oz = CAM3.fpActive ? player.y : CAM3.tz;
    if (!UI.dialog && !UI.cutscene) for (const o of W.objects){
      if (o.type === 'deco' || o.type === 'sign') continue;
      if (o.type === 'gate' || o.type === 'portal') continue;
      if (W.kind === 'story' && ((o.type === 'device' && !actReached('a2')) || (o.type === 'scene' && !actReached('a7')))) continue;   /* 활동 순서가 오기 전에는 표시를 숨긴다 */
      if ((W.kind === 'story' || W.kind === 'room') && o.type === 'mission' && o.id !== actPlaceNow() && !objDoneAct(o)) continue;
      const cx = o.x + .5, cz = o.y + .5; if (Math.hypot(cx - ox, cz - oz) > 24) continue;
      const hy = surfY(cx, cz) + (o.type === 'npc' ? 2.35 : o.type === 'device' ? (o.dev === 'maglev' || o.dev === 'ev' ? 2.55 : 2.0) : o.type === 'mission' ? 2.45 : o.type === 'test' ? (testRevealed() ? 1.85 : 1.2) : 1.85);
      const p = proj3(cx, hy, cz); if (!p.ok || p.x < -40 || p.x > CW + 40 || p.y < -40 || p.y > CH + 40) continue;
      if (o.type === 'test'){
        if (testRevealed() && SAVE.lastTest[o.id]){ const ok = SAVE.lastTest[o.id] === TEST_SCENES.find(s => s.id === o.id).label; drawBubble(p.x, p.y, ok ? '✓' : '✗', ok ? '#8ff0b9' : '#ffaaa1', '#1c2733'); }
        continue;
      }
      if (objDone(o)){ if (o.type === 'device' || o.type === 'scene' || o.type === 'mission') drawBubble(p.x, p.y, '✓', '#8ff0b9', '#1c2733'); }
      else {
        const lift = Math.abs(Math.sin(t * 3 + o.x)) * 4;
        if (o.type === 'device') drawBubble(p.x, p.y - lift, '?', '#ffd23f', '#1c2733');
        else drawBubble(p.x, p.y - lift, '!', o.type === 'scene' ? '#ffffff' : '#ffd23f', '#1c2733');
      }
    }
    if (!UI.dialog && !UI.cutscene) for (const w of (W.walkers || [])){
      if (walkerHidden(w)) continue;
      const bb = walkerBubble(w), cx = w.x + .5, cz = w.y + .5; if (!bb || Math.hypot(cx - ox, cz - oz) > 24) continue;
      const p = proj3(cx, surfY(cx, cz) + (w.def.kind === 'person' ? 2.3 : w.def.kind === 'robot' ? 1.3 : 1.25), cz);
      if (p.ok) drawBubble(p.x, p.y - Math.abs(Math.sin(t * 3 + w.x)) * 3, bb, bb === '★' ? '#ffd23f' : '#ffffff', '#1c2733');
    }
    if (ROBOT.bubble){
      const b = ROBOT.bubble, lb = LABELS[b.label], p = proj3(b.obj.x + .5, 2.2, b.obj.y + .5);
      if (p.ok) drawBubble(p.x, p.y, `${lb.icon} ${lb.name} ${Math.round(b.p * 100)}%`, '#ffffff', '#1c2733');
    }
    if (MODE === 'play' && NEAR && !uiBlocking()){
      const ped = NEAR.type === 'ped', talkable = NEAR.type === 'npc' || NEAR.type === 'walker' || ped;
      const name = ped && NEAR.injured ? `${NEAR.name} 도와주기` : ped && NEAR.fight ? '다툼 말리기' : talkable ? `${josa(NEAR.name, '과', '와')} 이야기` : NEAR.type === 'sign' ? '표지판 읽기' : NEAR.name;
      const hy = ped ? (NEAR.hurt > 0 ? 1.6 : 2.85) : NEAR.type === 'walker' ? (NEAR.def.kind === 'person' ? 2.85 : 1.8) : NEAR.type === 'npc' ? 2.95 : 2.55;
      const ox = ped ? NEAR.x : NEAR.x + .5, oz = ped ? NEAR.y : NEAR.y + .5;
      const p = proj3(ox, surfY(ox, oz) + hy, oz);
      if (p.ok) drawLabel(p.x, p.y, `${IS_TOUCH ? '' : 'E · '}${name}`);
    }
    if (MODE === 'play' && !uiBlocking()) evOverlay3D();
    if (MODE === 'play' || MODE === 'gate') zoneOverlay3D();
    if (MODE === 'play' && !UI.cutscene) pedOverlay3D();
    if (MODE === 'play' && !uiBlocking()) waypoint3D();
    if (MODE === 'play' && !uiBlocking() && hasEquipped('compass')) compass3D();
    if (CAM3.fpActive && !uiBlocking()){
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(CW / 2 - 9, CH / 2); ctx.lineTo(CW / 2 + 9, CH / 2); ctx.moveTo(CW / 2, CH / 2 - 9); ctx.lineTo(CW / 2, CH / 2 + 9); ctx.stroke();
    }
  }
  if (STORYFX.flash > 0){ ctx.fillStyle = `rgba(255,250,225,${STORYFX.flash * .4})`; ctx.fillRect(0, 0, CW, CH); }
}
/* 나침반(도구): 아직 못 찾은 가장 가까운 도감 기기 쪽을 내 발밑에서 가리킨다 */
function compass3D(){
  if (!WORLD || WORLD.kind !== 'story') return;
  let best = null, bd = 1e9;
  for (const o of WORLD.objects){ if (o.type !== 'device' || objDone(o)) continue; const d = Math.hypot(o.x + .5 - player.x, o.y + .5 - player.y); if (d < bd){ bd = d; best = o; } }
  if (!best || bd < 2) return;
  const a = proj3(player.x, (player.h || 0) + .05, player.y), b = proj3(best.x + .5, .05, best.y + .5);
  if (!a.ok) return;
  let ang = Math.atan2(b.y - a.y, b.x - a.x); if (!b.ok) ang += Math.PI;
  const r = 46, x = a.x + Math.cos(ang) * r, y = a.y + Math.sin(ang) * r;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = 'rgba(62,198,240,.95)'; ctx.strokeStyle = '#1c2733'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-3, 0); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.font = `700 12px ${FONT_B}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const lx = a.x + Math.cos(ang) * (r + 26), ly = a.y + Math.sin(ang) * (r + 18), txt = `🧭 ${Math.round(bd)}칸`;
  const w = ctx.measureText(txt).width + 12; ctx.fillStyle = 'rgba(21,32,43,.85)'; rr(ctx, lx - w / 2, ly - 10, w, 20, 6); ctx.fill();
  ctx.fillStyle = '#9fe6ff'; ctx.fillText(txt, lx, ly + 1);
}
function waypoint3D(){
  const wp = UI.waypoint; if (!wp || (WORLD.kind !== 'story' && WORLD.kind !== 'room')) return;
  if (Math.hypot(player.x - (wp.x + .5), player.y - (wp.y + .5)) < 1.8){ UI.waypoint = null; return; }
  const p = proj3(wp.x + .5, 2.9, wp.y + .5), top = 70, m = 40, t = TIME;
  let tx = p.x, ty = p.y;
  ctx.save();
  if (p.ok && tx > m && tx < CW - m && ty > top && ty < CH - m){
    ctx.translate(tx, ty - Math.abs(Math.sin(t * 4)) * 10); ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#1c2733'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-13, -14); ctx.lineTo(13, -14); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else {
    if (!p.ok){ tx = CW - tx; ty = CH - ty; }
    const cx = CW / 2, cy = CH / 2, ang = Math.atan2(ty - cy, tx - cx);
    const ex = clamp(cx + Math.cos(ang) * CW, m, CW - m), ey = clamp(cy + Math.sin(ang) * CH, top + 10, CH - m);
    ctx.translate(ex, ey); ctx.rotate(ang);
    ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#1c2733'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -13); ctx.lineTo(-4, 0); ctx.lineTo(-10, 13); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.rotate(-ang);
    ctx.font = `700 13px ${FONT_B}`; const w = ctx.measureText(wp.label).width + 14, lx = -Math.cos(ang) * 46, ly = -Math.sin(ang) * 30;
    ctx.fillStyle = 'rgba(21,32,43,.9)'; rr(ctx, lx - w / 2, ly - 11, w, 22, 6); ctx.fill();
    ctx.fillStyle = '#ffd23f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(wp.label, lx, ly + 1);
  }
  ctx.restore();
}

/* ----- 놀이 화면 손가락·마우스: 끌면 카메라 돌리기, 두 손가락은 당기기, 짧게 누르면 그곳으로 걷기 ----- */
const PP = new Map(); let PINCH = null;
function g3PointerDown(e){
  if (MODE === 'editor') return ed3PointerDown(e);
  PP.set(e.pointerId, {x:e.clientX, y:e.clientY, sx:e.clientX, sy:e.clientY, moved:false});
  try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  PINCH = null;
}
function g3PointerMove(e){
  if (MODE === 'editor') return ed3PointerMove(e);
  const p = PP.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (Math.hypot(p.x - p.sx, p.y - p.sy) > 8) p.moved = true;
  if (MODE !== 'play' && MODE !== 'patrol') return;
  if (PP.size >= 2){
    const [a, b] = [...PP.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    if (PINCH) CAM3.uDist = clamp(CAM3.uDist * PINCH / Math.max(1, d), 5, 26);
    PINCH = d; for (const q of PP.values()) q.moved = true; return;
  }
  if (!p.moved || UI.modal || UI.cutscene) return;
  if (CAM3.fp){ CAM3.uYaw -= dx * .0055; CAM3.fpPitch = clamp(CAM3.fpPitch - dy * .0045, -1.25, 1.2); }
  else { CAM3.uYaw -= dx * .0065; CAM3.uPitch = clamp(CAM3.uPitch + dy * .0045, .2, 1.4); }
}
function g3PointerUp(e){
  if (MODE === 'editor') return ed3PointerUp(e);
  const p = PP.get(e.pointerId); PP.delete(e.pointerId); if (PP.size < 2) PINCH = null;
  if (!p || p.moved || MODE !== 'play' || uiBlocking() || e.type === 'pointercancel') return;
  tap3(e.clientX, e.clientY);
}
function g3Wheel(e){
  if (MODE === 'editor'){ ED3.tdist = clamp(ED3.tdist * Math.exp(e.deltaY * .0012), 5, 110); e.preventDefault(); return; }
  if ((MODE === 'play' || MODE === 'patrol') && !UI.modal){ CAM3.uDist = clamp(CAM3.uDist * Math.exp(e.deltaY * .0012), 5, 26); e.preventDefault(); }
}
function toggleView(){
  CAM3.fp = !CAM3.fp; PATH3.nodes = null;
  if (CAM3.fp) CAM3.fpPitch = -.12;
  const b = $('#bView'); if (b) b.textContent = CAM3.fp ? '3인칭' : '1인칭';
  toast(CAM3.fp ? '1인칭 시점: 끌어서 둘러보고 W·S로 걸어요. V를 누르면 돌아와요.' : '3인칭 시점: 끌어서 카메라를 돌리고 휠로 당겨요.');
}
function rotateView(dir){ CAM3.uYaw += dir * Math.PI / 4; }

/* ===== 맵 만들기 3D: 위에서 비스듬히 내려다보며 블록을 칠한다 ===== */
const ED3 = {yaw:0, pitch:1.0, dist:30, cx:16, cz:11, tyaw:0, tpitch:1.0, tdist:30, tcx:16, tcz:11, map:null, snap:true, ptr:new Map(), mode:null, g:null, top:false};
function ed3Area(){
  const r = $('#edArea').getBoundingClientRect();
  return r.width > 10 ? r : {left:0, top:0, width:CW, height:CH};
}
function ed3Fit(){
  const m = ED.map, A = ed3Area(), asp = Math.max(.5, A.width / Math.max(1, A.height));
  ED3.tcx = m.w / 2; ED3.tcz = m.h / 2 + .5; ED3.tyaw = 0; ED3.tpitch = ED3.top ? 1.5 : 1.0;
  ED3.tdist = Math.max(m.h * 1.45, m.w * 1.3 / asp) + 4;
}
function ed3Sync(m){
  let x0 = 1e9, z0 = 1e9, x1 = -1, z1 = -1;
  for (let z = 0; z < m.h; z++){
    const r = m.tiles[z].join(''), old = W3.rows[z];
    if (r === old) continue;
    for (let x = 0; x < m.w; x++) if (r[x] !== old[x]){ x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    z0 = Math.min(z0, z); z1 = Math.max(z1, z); W3.rows[z] = r;
  }
  if (x1 < 0) return;
  w3Voxelize(m.tiles);
  for (let cz = Math.max(0, (z0 - 2) >> 4); cz <= Math.min(W3.ncz - 1, (z1 + 2) >> 4); cz++)
    for (let cx = Math.max(0, (x0 - 2) >> 4); cx <= Math.min(W3.ncx - 1, (x1 + 2) >> 4); cx++) W3.chunks[cz * W3.ncx + cx].dirty = true;
  w3MeshDirty();
}
function ed3Cam(dt){
  const E = ED3, K = k => KEYS.has(k), pan = E.tdist * .9 * dt;
  const rx = Math.cos(E.tyaw), rz = -Math.sin(E.tyaw), fx = -Math.sin(E.tyaw), fz = -Math.cos(E.tyaw);
  const mx = (K('KeyD') || K('ArrowRight') ? 1 : 0) - (K('KeyA') || K('ArrowLeft') ? 1 : 0), my = (K('KeyW') || K('ArrowUp') ? 1 : 0) - (K('KeyS') || K('ArrowDown') ? 1 : 0);
  E.tcx += (rx * mx + fx * my) * pan; E.tcz += (rz * mx + fz * my) * pan;
  if (K('KeyQ')) E.tyaw += dt * 1.6; if (K('KeyE')) E.tyaw -= dt * 1.6;
  if (K('Equal') || K('NumpadAdd')) E.tdist *= Math.pow(.4, dt); if (K('Minus') || K('NumpadSubtract')) E.tdist /= Math.pow(.4, dt);
  const m = ED.map; E.tcx = clamp(E.tcx, -2, m.w + 2); E.tcz = clamp(E.tcz, -2, m.h + 2); E.tdist = clamp(E.tdist, 5, 110);
  if (E.snap){ Object.assign(E, {yaw:E.tyaw, pitch:E.tpitch, dist:E.tdist, cx:E.tcx, cz:E.tcz, snap:false}); }
  else {
    const k = 1 - Math.pow(.0005, dt);
    E.yaw += angDiff(E.tyaw, E.yaw) * k; E.pitch += (E.tpitch - E.pitch) * k; E.dist += (E.tdist - E.dist) * k; E.cx += (E.tcx - E.cx) * k; E.cz += (E.tcz - E.cz) * k;
  }
  const A = ed3Area(), sx = (A.left + A.width / 2 - CW / 2) / (CW / 2), sy = -(A.top + A.height / 2 - CH / 2) / (CH / 2);
  const cp = Math.cos(E.pitch), ex = E.cx + Math.sin(E.yaw) * cp * E.dist, ey = Math.sin(E.pitch) * E.dist, ez = E.cz + Math.cos(E.yaw) * cp * E.dist;
  CAM3.eye = [ex, ey, ez]; CAM3.fov = .8; CAM3.fpActive = false;
  CAM3.V = M4.look(ex, ey, ez, E.cx, 0, E.cz, E.yaw);
  CAM3.P = M4.persp(.8, G3.W / G3.H, .1, 400, sx, sy);
  CAM3.VP = M4.mul(CAM3.P, CAM3.V);
}
function ed3Pick(e){ if (!CAM3.VP || !ED.map || W3.src !== ED.map) return null; return pickTile(e.clientX, e.clientY); }
function renderEditor3D(dt){
  if (!G3.gl || G3.lost) return;
  const gl = G3.gl, m = ED.map;
  g3Resize();
  if (!m){ gl.clearColor(.06, .09, .12, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, CW, CH); return; }
  if (W3.src !== m) w3Build(m, 'editor'); else ed3Sync(m);
  if (ED3.map !== m){ ED3.map = m; ed3Fit(); ED3.snap = true; }
  ed3Cam(dt);
  const env = envNow(dt); env.fog = [ED3.dist * 1.6, ED3.dist * 3.4];
  LN = 0; LBUF.fill(0); LCOL.fill(0);
  beginFrame(env); drawSky(env);
  const FU = flatSetup(env); flatDraw(FU, W3.ground, M4.I(), [1, 1, 1, 1]);
  voxSetup(env, null);
  drawChunks(false);
  const t = TIME;
  for (const o of m.objects){
    const cx = o.x + .5, cz = o.y + .5, gy = m.tiles[o.y] && m.tiles[o.y][o.x] === ':' ? .125 : 0;
    if (o.type === 'scene'){ drawM(model('stand', mkStand), M4.trs(cx, gy, cz)); sprAdd(cx, gy + 1.22, cz, iconBadge('scene', o.icon || '❓', o.label), .42); SHADOWS.push([cx, gy, cz, .35]); }
    else if (o.type === 'device'){ drawM(model('ped0', () => mkPedestal('#3ee0ff')), M4.trs(cx, gy, cz)); sprAdd(cx, gy + 1.35 + Math.sin(t * 2 + o.x) * .05, cz, iconBadge('dev', o.icon || '⚡'), .42); SHADOWS.push([cx, gy, cz, .5]); }
    else if (o.type === 'sign'){ drawM(model('sign', mkSign), M4.trs(cx, gy, cz)); SHADOWS.push([cx, gy, cz, .3]); }
  }
  drawM(model('flag', mkFlag), M4.trs(m.spawn.x + .5, 0, m.spawn.y + .5));
  drawSprites(env);
  const U = flatSetup(env);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  if (!ED3.grid || ED3.gridKey !== m.w + 'x' + m.h){
    g3Free(ED3.grid); const v = [], c = [0, 0, 0, .16];
    for (let x = 0; x <= m.w; x++) v.push(x, .02, 0, ...c, x, .02, m.h, ...c);
    for (let z = 0; z <= m.h; z++) v.push(0, .02, z, ...c, m.w, .02, z, ...c);
    ED3.grid = g3Mesh('flat', v); ED3.gridKey = m.w + 'x' + m.h;
  }
  flatDraw(U, ED3.grid, M4.I(), [1, 1, 1, 1], gl.LINES);
  gl.disable(gl.CULL_FACE);
  const disc = model('disc', flatDisc);
  gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -2);
  for (const [x, y, z, r] of SHADOWS) flatDraw(U, disc, M4.trs(x, y + .015, z, 0, r, 1), [1, 1, 1, .8]);
  gl.disable(gl.POLYGON_OFFSET_FILL);
  const box = model('hbox', () => flatCube([1, .82, .25, 1])), pulse = .22 + (Math.sin(t * 6) * .5 + .5) * .16;
  if (ED.rect){
    const r = ED.rect, x0 = Math.min(r.x0, r.x1), z0 = Math.min(r.y0, r.y1), x1 = Math.max(r.x0, r.x1) + 1, z1 = Math.max(r.y0, r.y1) + 1;
    flatDraw(U, box, boxM(x0, 0, z0, x1 - x0, 1.4, z1 - z0), [1, 1, 1, pulse]);
  } else if (ED.hover){
    const ch = m.tiles[ED.hover.y][ED.hover.x], h = Math.max(.35, colTopOf(ch) + .06);
    flatDraw(U, box, boxM(ED.hover.x - .02, -.02, ED.hover.y - .02, 1.04, h, 1.04), [1, 1, 1, pulse + .06]);
  }
  gl.enable(gl.CULL_FACE);
  voxSetup(env, null); drawChunks(true);
  gl.depthMask(true); gl.disable(gl.BLEND);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, CW, CH);
}
function boxM(x, y, z, sx, sy, sz){ const m = new Float32Array(16); m[0] = sx; m[5] = sy; m[10] = sz; m[12] = x; m[13] = y; m[14] = z; m[15] = 1; return m; }
function ed3PointerDown(e){
  if (uiBlocking()) return;
  ED3.ptr.set(e.pointerId, {x:e.clientX, y:e.clientY});
  try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  if (ED3.ptr.size >= 2){ if (ED.down){ ED.down = false; ED.rect = null; saveDraft(); } ED3.mode = 'gesture'; ED3.g = null; return; }
  if (e.button === 2 || (e.button === 0 && e.altKey)){ ED3.mode = 'rotate'; return; }
  if (e.button === 1 || (e.button === 0 && e.shiftKey)){ ED3.mode = 'pan'; return; }
  ED3.mode = 'paint'; edPointerDown(e);
}
function ed3PointerMove(e){
  const p = ED3.ptr.get(e.pointerId);
  if (!p || ED3.mode === 'paint' || !ED3.mode){ edPointerMove(e); if (p){ p.x = e.clientX; p.y = e.clientY; } return; }
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  const E = ED3, k = E.dist * .0016;
  if (E.mode === 'rotate'){ E.tyaw -= dx * .007; E.tpitch = clamp(E.tpitch + dy * .005, .35, 1.5); }
  else if (E.mode === 'pan'){ const rx = Math.cos(E.yaw), rz = -Math.sin(E.yaw), fx = -Math.sin(E.yaw), fz = -Math.cos(E.yaw); E.tcx += -rx * dx * k + fx * dy * k; E.tcz += -rz * dx * k + fz * dy * k; }
  else if (E.mode === 'gesture' && E.ptr.size >= 2){
    const [a, b] = [...E.ptr.values()], cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2, d = Math.hypot(a.x - b.x, a.y - b.y), an = Math.atan2(b.y - a.y, b.x - a.x);
    if (E.g){
      const gx = cx - E.g.cx, gy = cy - E.g.cy, rx = Math.cos(E.yaw), rz = -Math.sin(E.yaw), fx = -Math.sin(E.yaw), fz = -Math.cos(E.yaw);
      E.tcx += -rx * gx * k + fx * gy * k; E.tcz += -rz * gx * k + fz * gy * k;
      E.tdist = clamp(E.tdist * E.g.d / Math.max(1, d), 5, 110); E.tyaw -= angDiff(an, E.g.an);
    }
    E.g = {cx, cy, d, an};
  }
}
function ed3PointerUp(e){
  ED3.ptr.delete(e.pointerId);
  if (ED3.mode === 'paint') edPointerUp(e);
  if (!ED3.ptr.size){ ED3.mode = null; ED3.g = null; } else if (ED3.mode === 'gesture') ED3.g = null;
}
function ed3Button(k){
  const E = ED3;
  if (k === 'l') E.tyaw += Math.PI / 4; else if (k === 'r') E.tyaw -= Math.PI / 4;
  else if (k === 'in') E.tdist = clamp(E.tdist * .8, 5, 110); else if (k === 'out') E.tdist = clamp(E.tdist * 1.25, 5, 110);
  else if (k === 'top'){ E.top = !E.top; E.tpitch = E.top ? 1.5 : 1.0; }
  else if (k === 'fit') ed3Fit();
}
