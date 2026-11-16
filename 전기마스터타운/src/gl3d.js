/* =========================================================
   2b. 3D 엔진 바탕 — WebGL 행렬 · 셰이더 · 블록 텍스처 · 아이콘
   2D 타일 마을을 3D 블록 세상으로 바꾼다. 참고한 코드:
   - jdah/minecraft-weekend : 청크 메시(보이는 면만), 면 방향별 밝기(위 1.0 · 동서 0.8 · 남북 0.6 · 아래 0.5),
     빛 단계 0~15와 햇빛 번짐(BFS), 빛끼리는 더하지 않고 큰 값(max), DDA 광선으로 블록 고르기,
     축마다 따로 미는 충돌, 하늘색과 안개
   - fogleman/Minecraft : 드러난 면만 그리기, 시야 벡터, 선형 안개, 16픽셀 텍스처 지도(atlas)
   - conservation-lab(선생님 저장소) : 상자로 만든 인물, 따라가는 카메라, 대화 클로즈업, 조이스틱
   WebGL을 못 쓰면 G3.ok = false 로 두고 예전 2D 그리기를 그대로 쓴다.
   ========================================================= */
const G3 = {ok:false, gl:null, cv:null, gl2:false, uint:false, P:{}, cur:null, atlas:null, icons:null,
  W:0, H:0, dpr:1, iconCv:null, iconMap:new Map(), iconKeys:[], iconN:0, iconDirty:false, sky:null};

/* ----- 4×4 행렬 (열 우선, WebGL 방식) ----- */
const M4 = {
  I(){ const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  mul(a, b){
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++){
      const b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
      o[c * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
      o[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
      o[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
      o[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
    }
    return o;
  },
  /* 원근 투영. sx·sy만큼 화면 중심을 옮긴다(패널이 가리는 쪽을 피할 때) */
  persp(fovy, asp, n, f, sx = 0, sy = 0){
    const t = 1 / Math.tan(fovy / 2), m = new Float32Array(16);
    m[0] = t / asp; m[5] = t; m[8] = -sx; m[9] = -sy; m[10] = (f + n) / (n - f); m[11] = -1; m[14] = 2 * f * n / (n - f);
    return m;
  },
  look(ex, ey, ez, tx, ty, tz, yaw = 0){
    let zx = ex - tx, zy = ey - ty, zz = ez - tz, l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
    let xx = zz, xz = -zx; l = Math.hypot(xx, xz);
    if (l < 1e-5){ xx = Math.cos(yaw); xz = -Math.sin(yaw); } else { xx /= l; xz /= l; }
    const yx = zy * xz, yy = zz * xx - zx * xz, yz = -zy * xx;
    const m = new Float32Array(16);
    m[0] = xx; m[4] = 0;  m[8] = xz;
    m[1] = yx; m[5] = yy; m[9] = yz;
    m[2] = zx; m[6] = zy; m[10] = zz;
    m[12] = -(xx * ex + xz * ez); m[13] = -(yx * ex + yy * ey + yz * ez); m[14] = -(zx * ex + zy * ey + zz * ez); m[15] = 1;
    return m;
  },
  /* 옮기기 · y축 돌리기 · 크기(세로만 따로 늘일 수도 있다) */
  trs(x, y, z, ry = 0, s = 1, sy = s){
    const c = Math.cos(ry), sn = Math.sin(ry), m = new Float32Array(16);
    m[0] = c * s; m[2] = -sn * s; m[5] = sy; m[8] = sn * s; m[10] = c * s; m[12] = x; m[13] = y; m[14] = z; m[15] = 1;
    return m;
  },
  /* 팔다리: 관절 위치로 옮긴 뒤 x축으로 흔들기 */
  joint(px, py, pz, rx){
    const c = Math.cos(rx), s = Math.sin(rx), m = new Float32Array(16);
    m[0] = 1; m[5] = c; m[6] = s; m[9] = -s; m[10] = c; m[12] = px; m[13] = py; m[14] = pz; m[15] = 1;
    return m;
  },
  inv(m){
    const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3], a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
    const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11], a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
    const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
    let d = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; if (!d) return M4.I(); d = 1 / d;
    const o = new Float32Array(16);
    o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * d; o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * d;
    o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * d; o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * d;
    o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * d; o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * d;
    o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * d; o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * d;
    o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * d; o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * d;
    o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * d; o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * d;
    o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * d; o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * d;
    o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * d; o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * d;
    return o;
  },
};

/* ----- 셰이더 ----- */
const FS_HEAD = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
const NLIGHT = 24;
/* 블록·인물: 텍스처 × 색 × 빛. 빛 = max(햇빛 × 하늘빛 단계, 가로등 빛) × 면 방향 밝기 × 구석 그늘(AO) */
const VOX_VS = `precision highp float;
attribute vec3 aPos; attribute vec2 aUV; attribute vec3 aCol; attribute vec2 aLit; attribute float aEmit;
uniform mat4 uVP; uniform mat4 uM; uniform vec3 uSun; uniform vec3 uAmb;
uniform vec4 uL[${NLIGHT}]; uniform vec3 uLC[${NLIGHT}]; uniform float uWave;
varying vec2 vUV; varying vec3 vCol; varying vec3 vLight; varying float vEmit; varying vec3 vW;
void main(){
  vec4 w = uM * vec4(aPos, 1.0);
  if (uWave > 0.0) w.y += sin(w.x * 1.9 + uWave * 2.1) * 0.03 + cos(w.z * 1.6 + uWave * 1.7) * 0.03;
  vec3 t = vec3(0.0);
  for (int i = 0; i < ${NLIGHT}; i++){
    vec3 d = abs(w.xyz - uL[i].xyz);
    float k = clamp((uL[i].w - d.x - d.z - d.y * 0.6) / 15.0, 0.0, 1.0);
    t = max(t, uLC[i] * k);
  }
  vLight = (max(uSun * aLit.y, t) + uAmb) * aLit.x;
  vUV = aUV; vCol = aCol; vEmit = aEmit; vW = w.xyz;
  gl_Position = uVP * w;
}`;
const VOX_FS = FS_HEAD + `uniform sampler2D uTex; uniform vec3 uFogC; uniform vec2 uFog; uniform vec3 uEye;
uniform vec4 uCut; uniform vec3 uCutEye; uniform float uStab; uniform float uTime; uniform float uGlow; uniform float uAlpha;
varying vec2 vUV; varying vec3 vCol; varying vec3 vLight; varying float vEmit; varying vec3 vW;
float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec4 tx = texture2D(uTex, vUV);
  if (tx.a < 0.25) discard;
  if (uCut.w > 0.0 && vW.y > 0.25){
    vec3 ab = uCut.xyz - uCutEye;
    float t = dot(vW - uCutEye, ab) / dot(ab, ab);
    if (t > 0.0 && t < 0.97){
      float dd = length(vW - (uCutEye + ab * t)), r = uCut.w * (0.45 + 0.55 * t);
      if (dd < r){ vec2 fc = floor(gl_FragCoord.xy); if (dd < r * 0.62 || mod(fc.x + fc.y, 2.0) < 1.0) discard; }
    }
  }
  vec3 base = tx.rgb * vCol, c;
  if (vEmit > -0.5 && vEmit < 1.5 && tx.a < 0.75){
    float on = step(vEmit, uStab);
    if (on > 0.5 && uStab - vEmit < 0.06) on = step(0.38, h21(vec2(floor(uTime * 9.0), vEmit * 977.0))) * 0.88 + 0.12;
    c = mix(vec3(0.24, 0.32, 0.45) * vLight, base * 1.12, on);
  } else {
    c = base * vLight;
    if (vEmit > 2.5) c = base * 1.1;
    else if (vEmit > 1.5) c = mix(c, base * 1.1, uGlow);
  }
  float f = smoothstep(uFog.x, uFog.y, distance(vW, uEye));
  gl_FragColor = vec4(mix(c, uFogC, f), uAlpha);
}`;
/* 색만 있는 면: 그림자 원판, 차선, 표시 상자, 안내 기둥 */
const FLAT_VS = `precision highp float;
attribute vec3 aPos; attribute vec4 aCol; uniform mat4 uVP; uniform mat4 uM; varying vec4 vC; varying vec3 vW;
void main(){ vec4 w = uM * vec4(aPos, 1.0); vW = w.xyz; vC = aCol; gl_Position = uVP * w; }`;
const FLAT_FS = FS_HEAD + `uniform vec4 uTint; uniform vec3 uFogC; uniform vec2 uFog; uniform vec3 uEye; varying vec4 vC; varying vec3 vW;
void main(){ vec4 c = vC * uTint; float f = smoothstep(uFog.x, uFog.y, distance(vW, uEye)); gl_FragColor = vec4(mix(c.rgb, uFogC, f), c.a * (1.0 - f)); }`;
/* 늘 카메라를 보는 아이콘(기기·상황 카드·미션) */
const SPR_VS = `precision highp float;
attribute vec3 aC; attribute vec2 aK; attribute vec2 aUV; attribute float aS; uniform mat4 uV; uniform mat4 uP;
varying vec2 vUV; varying float vD;
void main(){ vec4 v = uV * vec4(aC, 1.0); v.xy += aK * aS; vD = -v.z; vUV = aUV; gl_Position = uP * v; }`;
const SPR_FS = FS_HEAD + `uniform sampler2D uTex; uniform float uBright; uniform vec3 uFogC; uniform vec2 uFog; varying vec2 vUV; varying float vD;
void main(){ vec4 t = texture2D(uTex, vUV); if (t.a < 0.45 || vD < 2.4) discard; vec3 c = t.rgb / t.a * uBright; float f = smoothstep(uFog.x, uFog.y, vD);
  gl_FragColor = vec4(mix(c, uFogC, f * 0.85), 1.0); }`;
/* 불꽃놀이 알갱이 */
const PT_VS = `precision highp float;
attribute vec3 aPos; attribute vec4 aCol; attribute float aSz; uniform mat4 uVP; uniform float uPx; varying vec4 vC;
void main(){ gl_Position = uVP * vec4(aPos, 1.0); gl_PointSize = clamp(aSz * uPx / max(gl_Position.w, 0.1), 1.0, 96.0); vC = aCol; }`;
const PT_FS = FS_HEAD + `varying vec4 vC;
void main(){ vec2 p = gl_PointCoord * 2.0 - 1.0; float r = dot(p, p); if (r > 1.0) discard; gl_FragColor = vec4(vC.rgb * vC.a * (1.0 - r * 0.75), 1.0); }`;
/* 하늘: 지평선 → 꼭대기 색, 해, 별 */
const SKY_VS = `precision highp float; attribute vec2 aP; varying vec2 vP; void main(){ vP = aP; gl_Position = vec4(aP, 0.0, 1.0); }`;
const SKY_FS = FS_HEAD + `varying vec2 vP; uniform mat4 uInv; uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSunD; uniform vec3 uSunC;
uniform float uStars; uniform float uTime;
float h31(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
void main(){
  vec4 a = uInv * vec4(vP, 1.0, 1.0); vec3 d = normalize(a.xyz / a.w); float h = d.y;
  vec3 c = h > 0.0 ? mix(uHor, uTop, pow(h, 0.5)) : uHor * (1.0 + h * 0.6);
  float s = max(dot(d, uSunD), 0.0);
  c += uSunC * (pow(s, 900.0) * 2.0 + pow(s, 12.0) * 0.35);
  if (uStars > 0.0 && h > 0.04){
    float n = h31(floor(d * 160.0));
    if (n > 0.9972) c += vec3(0.9, 0.92, 1.0) * uStars * (0.55 + 0.45 * sin(uTime * 2.0 + n * 90.0)) * smoothstep(0.04, 0.3, h);
  }
  gl_FragColor = vec4(c, 1.0);
}`;
const LAYOUT = {vox:[3, 2, 3, 2, 1], flat:[3, 4], spr:[3, 2, 2, 1], pt:[3, 4, 1], sky:[2]};
const ATTRS = {vox:['aPos', 'aUV', 'aCol', 'aLit', 'aEmit'], flat:['aPos', 'aCol'], spr:['aC', 'aK', 'aUV', 'aS'], pt:['aPos', 'aCol', 'aSz'], sky:['aP']};
const STRIDE = {}; for (const k in LAYOUT) STRIDE[k] = LAYOUT[k].reduce((a, b) => a + b, 0);

function g3Prog(name, vs, fs){
  const gl = G3.gl;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(name + ': ' + gl.getShaderInfoLog(s)); return s; };
  const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
  ATTRS[name].forEach((a, i) => gl.bindAttribLocation(p, i, a));
  gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(name + ': ' + gl.getProgramInfoLog(p));
  const U = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++){ const info = gl.getActiveUniform(p, i); U[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name); }
  return (G3.P[name] = {p, U, name});
}
function g3Use(name){ const P = G3.P[name]; if (G3.cur !== P){ G3.gl.useProgram(P.p); G3.cur = P; } return P.U; }

/* ----- 버퍼 ----- */
function g3Mesh(lay, verts, idx, dynamic){ const m = {lay, vbo:G3.gl.createBuffer(), ibo:null, n:0, it:0}; g3Upload(m, verts, idx, dynamic); return m; }
function g3Upload(m, verts, idx, dynamic){
  const gl = G3.gl, usage = dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;
  const v = verts instanceof Float32Array ? verts : new Float32Array(verts), nv = v.length / STRIDE[m.lay];
  gl.bindBuffer(gl.ARRAY_BUFFER, m.vbo); gl.bufferData(gl.ARRAY_BUFFER, v, usage);
  if (idx){
    const big = nv > 65535 && G3.uint;
    if (!m.ibo) m.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, big ? new Uint32Array(idx) : new Uint16Array(idx), usage);
    m.n = idx.length; m.it = big ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
  } else m.n = nv;
}
function g3Free(m){ if (!m || !G3.gl) return; G3.gl.deleteBuffer(m.vbo); if (m.ibo) G3.gl.deleteBuffer(m.ibo); }
function g3Draw(m, prim, count){
  if (!m || !m.n) return;
  const gl = G3.gl, L = LAYOUT[m.lay], stride = STRIDE[m.lay] * 4;
  gl.bindBuffer(gl.ARRAY_BUFFER, m.vbo);
  let off = 0;
  for (let i = 0; i < 5; i++){
    if (i < L.length){ gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, L[i], gl.FLOAT, false, stride, off); off += L[i] * 4; }
    else gl.disableVertexAttribArray(i);
  }
  const p = prim === undefined ? gl.TRIANGLES : prim;
  if (m.ibo){ gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ibo); gl.drawElements(p, count || m.n, m.it, 0); }
  else gl.drawArrays(p, 0, count || m.n);
}

/* ----- 블록 텍스처 지도 (16×16 픽셀 타일, 코드로 그린다) ----- */
const TX = {};
const ATN = 16, ATP = 16;
function uvRect(i){
  const s = 1 / ATN, e = .5 / (ATN * ATP), u0 = (i % ATN) * s + e, v0 = Math.floor(i / ATN) * s + e;
  return [u0, v0, u0 + s - 2 * e, v0 + s - 2 * e];
}
function g3BuildAtlas(){
  const S = ATN * ATP, img = new ImageData(S, S), D = img.data;
  let next = 0;
  const pick = (arr, r) => arr[Math.min(arr.length - 1, Math.floor(r * arr.length))];
  const tile = (name, fn) => {
    const i = next++, ox = (i % ATN) * ATP, oy = Math.floor(i / ATN) * ATP; TX[name] = i;
    const px = (x, y, hex, a = 255) => {
      if (x < 0 || y < 0 || x >= ATP || y >= ATP) return;
      const n = parseInt(hex.slice(1), 16), o = ((oy + y) * S + ox + x) * 4;
      D[o] = n >> 16; D[o + 1] = (n >> 8) & 255; D[o + 2] = n & 255; D[o + 3] = a;
    };
    const fill = f => { for (let y = 0; y < ATP; y++) for (let x = 0; x < ATP; x++) f(x, y); };
    fn(px, fill, i);
  };
  const noise = (px, fill, pal, seed, w) => fill((x, y) => { const r = hash2(x, y, seed); px(x, y, w ? (r < w[0] ? pal[0] : r < w[1] ? pal[1] : r < w[2] ? pal[2] : pal[3]) : pick(pal, r)); });
  tile('white', (px, fill) => fill((x, y) => px(x, y, '#ffffff')));
  tile('grassTop', (px, fill) => noise(px, fill, ['#6db542', '#76bd48', '#62aa3b', '#83c954'], 11, [.46, .72, .9]));
  tile('dirt', (px, fill) => noise(px, fill, ['#8b5a34', '#7c4f2d', '#986741', '#6d4426'], 12, [.4, .7, .9]));
  tile('grassSide', (px, fill) => {
    noise(px, fill, ['#8b5a34', '#7c4f2d', '#986741', '#6d4426'], 13, [.4, .7, .9]);
    for (let x = 0; x < ATP; x++){
      const h = 3 + (hash2(x, 0, 5) < .45 ? 1 : 0) + (hash2(x, 1, 6) < .2 ? 1 : 0);
      for (let y = 0; y < h; y++) px(x, y, hash2(x, y, 14) < .5 ? '#6db542' : '#62aa3b');
    }
  });
  tile('road', (px, fill) => fill((x, y) => { const r = hash2(x, y, 15); px(x, y, r < .12 ? '#596070' : r > .94 ? '#3c414c' : '#4b515d'); }));
  tile('walk', (px, fill) => fill((x, y) => {
    const row = y >> 3, mx = (x + (row % 2) * 4) % 8;
    if (y % 8 === 0 || mx === 0) px(x, y, '#a99f8d'); else px(x, y, hash2(x, y, 16) < .3 ? '#c7beac' : '#d4ccbb');
  }));
  tile('curb', (px, fill) => fill((x, y) => px(x, y, y < 3 ? '#e4dfd6' : hash2(x, y, 17) < .3 ? '#bdb7ad' : '#c9c4bb')));
  tile('floor', (px, fill) => fill((x, y) => {
    const j = y >> 2, seam = (j * 5 + 3) % 16;
    if (y % 4 === 3) px(x, y, '#9a7046'); else if (x === seam) px(x, y, '#a87a4c');
    else px(x, y, pick(['#d4aa76', '#cb9f6b', '#dcb382'], hash2(x >> 2, y, 18 + j)));
  }));
  tile('gravel', (px, fill) => noise(px, fill, ['#a39a8b', '#8f8678', '#b7af9f', '#7b7367'], 19, [.4, .66, .88]));
  tile('water', (px, fill) => fill((x, y) => {
    const wv = (x + (y >> 2) * 3) % 8 < 2 && y % 4 === 1;
    px(x, y, wv ? '#6cb0ee' : hash2(x, y, 20) < .1 ? '#3278bf' : '#3d8bd6');
  }));
  tile('sand', (px, fill) => noise(px, fill, ['#e3cf9b', '#d6c08a', '#eddcae', '#cdb67f'], 21, [.5, .78, .93]));
  tile('wall', (px, fill) => fill((x, y) => { const r = hash2(x, y, 22); px(x, y, y === 15 ? '#cfc6b3' : r < .2 ? '#e2dac8' : r > .9 ? '#f6f1e6' : '#ece5d6'); }));
  tile('wallBase', (px, fill) => fill((x, y) => {
    const row = y >> 2, mx = (x + (row % 2) * 4) % 8;
    if (y % 4 === 0 || mx === 0) px(x, y, '#8f8778'); else px(x, y, pick(['#b4ab9b', '#a89f8f', '#bfb6a6'], hash2(x >> 1, y, 23 + row)));
  }));
  tile('wallTop', (px, fill) => fill((x, y) => px(x, y, (x === 0 || y === 0 || x === 15 || y === 15) ? '#c2b8a3' : hash2(x, y, 24) < .25 ? '#cfc5b1' : '#dbd2c0')));
  tile('bldg', (px, fill) => fill((x, y) => {
    const inWin = (x >= 2 && x <= 6) || (x >= 9 && x <= 13), wy = y >= 3 && y <= 11;
    if (y >= 14) px(x, y, '#7d8fa3');
    else if (inWin && wy){
      const edge = x === 2 || x === 6 || x === 9 || x === 13 || y === 3 || y === 11;
      if (edge) px(x, y, '#5f7388'); else px(x, y, (x === 3 || x === 10) && y < 7 ? '#fff4cf' : '#ffd98a', 128);
    } else px(x, y, hash2(x, y, 25) < .25 ? '#899bae' : '#95a7ba');
  }));
  tile('roof', (px, fill) => fill((x, y) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return px(x, y, '#4a5159');
    if (x >= 9 && x <= 12 && y >= 4 && y <= 7) return px(x, y, x === 9 || y === 4 ? '#8a939d' : '#737c86');
    px(x, y, hash2(x, y, 26) < .3 ? '#545c66' : '#5f6872');
  }));
  tile('logSide', (px, fill) => fill((x, y) => px(x, y, x % 4 === 0 ? '#5e3e22' : hash2(x, y, 27) < .25 ? '#86603a' : '#7a5230')));
  tile('logTop', (px, fill) => fill((x, y) => { const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)); px(x, y, d > 6.5 ? '#6b4526' : (Math.floor(d) % 2 ? '#a87b45' : '#c79a5f')); }));
  tile('leaves', (px, fill) => fill((x, y) => { const r = hash2(x, y, 28); px(x, y, r < .08 ? '#22601f' : r < .4 ? '#3f9b3a' : r < .72 ? '#2f7f2c' : r < .92 ? '#4fae45' : '#2a7027'); }));
  tile('fence', (px, fill) => fill((x, y) => px(x, y, x % 5 === 0 ? '#a77d47' : hash2(x, y, 29) < .3 ? '#b98c50' : '#c89b5e')));
  tile('door', (px, fill) => fill((x, y) => px(x, y, y % 5 === 4 ? '#5e3a19' : hash2(x, y, 30) < .3 ? '#7a4e24' : '#8a5a2b')));
  tile('crate', (px, fill) => {
    fill((x, y) => { const e = x < 2 || y < 2 || x > 13 || y > 13; px(x, y, e ? '#6b4523' : (y % 4 === 1 ? '#9c6a3b' : '#b07a45')); });
    const Qm = ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'];
    Qm.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') px(5 + i, 4 + j, '#fff3c4'); }));
  });
  const flower = (col, seed) => (px) => {
    for (let y = 7; y < 16; y++) px(7, y, '#3f8f35');
    px(6, 11, '#4aa040'); px(5, 10, '#4aa040'); px(8, 12, '#4aa040'); px(9, 11, '#4aa040');
    for (let y = 2; y < 8; y++) for (let x = 4; x < 11; x++){ const d = Math.hypot(x - 7, y - 4.6); if (d < 2.7 && hash2(x, y, seed) > .08) px(x, y, col); }
    px(7, 4, '#fff1a0'); px(7, 5, '#fff1a0'); px(6, 4, '#ffe066');
  };
  tile('flowerR', flower('#ff5b5b', 31)); tile('flowerY', flower('#ffd23f', 32)); tile('flowerW', flower('#ffffff', 33)); tile('flowerP', flower('#c58bff', 34));
  tile('tgrass', (px) => {
    for (let b = 0; b < 7; b++){
      const x0 = 1 + b * 2 + Math.floor(hash2(b, 0, 35) * 2), h = 5 + Math.floor(hash2(b, 1, 36) * 8), lean = hash2(b, 2, 37) < .5 ? -1 : 1;
      for (let k = 0; k < h; k++) px(x0 + (k > h * .6 ? lean : 0), 15 - k, k > h - 3 ? '#8fd162' : (b % 2 ? '#5fa838' : '#6db542'));
    }
  });
  G3.atlas = g3Texture(img, false);
}
function g3Texture(src, mip, premul){
  const gl = G3.gl, t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !!premul);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (mip){ gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); }
  else { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); }
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  return t;
}

/* ----- 아이콘 지도: 기기·상황 카드·미션 그림을 둥근 배지로 그려 둔다 ----- */
const ICON_CELL = 128, ICON_COLS = 8, ICON_ROWS = 16;
function g3Icon(key, draw){
  let e = G3.iconMap.get(key); if (e) return e;
  const n = ICON_COLS * ICON_ROWS, i = G3.iconN++ % n;
  if (G3.iconKeys[i]) G3.iconMap.delete(G3.iconKeys[i]);
  G3.iconKeys[i] = key;
  const x = (i % ICON_COLS) * ICON_CELL, y = Math.floor(i / ICON_COLS) * ICON_CELL, g = G3.iconCv.getContext('2d');
  g.clearRect(x, y, ICON_CELL, ICON_CELL); g.save(); g.translate(x, y); try { draw(g, ICON_CELL); } catch (er) {} g.restore();
  const W = ICON_COLS * ICON_CELL, H = ICON_ROWS * ICON_CELL, e2 = 1.5;
  e = [(x + e2) / W, (y + e2) / H, (x + ICON_CELL - e2) / W, (y + ICON_CELL - e2) / H];
  G3.iconMap.set(key, e); G3.iconDirty = true;
  return e;
}
const BADGE = {dev:['#eaf8ff', '#3ec6f0'], scene:['#ffffff', '#1c2733'], mis:['#fff3c4', '#e2a93a'], test:['#ffffff', '#b07a45'], sign:['#f3e6c8', '#6b4523'], pick:['#fff6d8', '#ffd23f']};
function iconBadge(kind, icon, extra){
  return g3Icon(kind + ':' + icon + ':' + (extra || ''), (g, S) => {
    const c = S / 2, r = S * .43, st = BADGE[kind];
    if (st){
      g.beginPath(); g.arc(c, c, r, 0, 7); g.fillStyle = st[0]; g.fill(); g.lineWidth = S * .06; g.strokeStyle = st[1]; g.stroke();
    }
    if (DEV_DRAWN.includes(icon)) drawDevIcon(g, icon, c, c + S * .02, S * .6, .4);
    else {
      const n = emojiCount(icon), sz = (n >= 3 ? .3 : n === 2 ? .38 : .52) * S;
      g.font = `${Math.round(sz)}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1c2733';
      g.fillText(icon, c, c + S * .03);
    }
    if (extra && LABELS[extra]){ g.fillStyle = LABELS[extra].color; g.strokeStyle = '#1c2733'; g.lineWidth = 3; g.beginPath(); g.arc(S * .8, S * .2, S * .12, 0, 7); g.fill(); g.stroke(); }
  });
}

/* ----- 시작 ----- */
function g3Init(){
  try { if (/[?&]2d\b/.test(location.search)) return false; } catch (e) {}
  const cv = document.getElementById('gl'); if (!cv) return false;
  const opt = {antialias:true, alpha:false, premultipliedAlpha:false, powerPreference:'high-performance'};
  let gl = null;
  try { gl = cv.getContext('webgl2', opt); G3.gl2 = !!gl; if (!gl) gl = cv.getContext('webgl', opt) || cv.getContext('experimental-webgl', opt); } catch (e) { gl = null; }
  if (!gl) return false;
  G3.gl = gl; G3.cv = cv; G3.uint = G3.gl2 || !!gl.getExtension('OES_element_index_uint');
  try {
    g3Prog('vox', VOX_VS, VOX_FS); g3Prog('flat', FLAT_VS, FLAT_FS); g3Prog('spr', SPR_VS, SPR_FS); g3Prog('pt', PT_VS, PT_FS); g3Prog('sky', SKY_VS, SKY_FS);
    g3BuildAtlas();
    G3.iconCv = mkCanvas(ICON_COLS * ICON_CELL, ICON_ROWS * ICON_CELL);
    G3.icons = gl.createTexture();
    G3.sky = g3Mesh('sky', [-1, -1, 3, -1, -1, 3]);
    g3BlockDefs();
  } catch (e) { console.warn('3D 시작 실패, 2D로 그립니다:', e); G3.gl = null; return false; }
  gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); gl.frontFace(gl.CCW);
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); G3.lost = true; });
  G3.ok = true; document.body.classList.add('gl3d');
  return true;
}
function g3Resize(){
  const dpr = Math.min(window.devicePixelRatio || 1, IS_TOUCH ? 1.25 : 1.5);
  const W = Math.max(1, Math.round(window.innerWidth * dpr)), H = Math.max(1, Math.round(window.innerHeight * dpr));
  if (G3.cv.width !== W || G3.cv.height !== H){ G3.cv.width = W; G3.cv.height = H; }
  G3.W = W; G3.H = H; G3.dpr = dpr;
}
function g3UploadIcons(){
  if (!G3.iconDirty) return;
  const gl = G3.gl; gl.bindTexture(gl.TEXTURE_2D, G3.icons);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, G3.iconCv);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  G3.iconDirty = false;
}
