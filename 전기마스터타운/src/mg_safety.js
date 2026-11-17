/* =========================================================
   6-2. 전기 안전 단원 게임
   · 우리 집 안전 탐정 — 교재 '전기를 안전하게 사용하고 절약하는 방법' (집 안 점검 · 효율 등급 · 까닭 3가지)
   · 로봇 훈련소     — 사람의 판단을 AI에게 가르치기 (라벨 붙이기 → 데이터 고르기 → 시험하고 고치기)
   ========================================================= */

/* ----- 집 안 그림 도우미 ----- */
function homeOutlet(g, x, y, cover){
  mgBox(g, x - 19, y - 23, 38, 46, '#fbfaf6', '#a7aeb6', 8, 2);
  if (cover){ mgBox(g, x - 13, y - 16, 26, 32, '#ffd23f', '#c99a17', 7, 2); g.fillStyle = '#c99a17'; g.fillRect(x - 6, y - 2, 12, 4); }
  else { mgDot(g, x - 6, y, 3.6, '#3a4048'); mgDot(g, x + 6, y, 3.6, '#3a4048'); }
}
function homePlug(g, x, y, col = '#f4f6f8'){
  g.fillStyle = '#9aa3ad'; g.fillRect(x - 7, y - 30, 3, 10); g.fillRect(x + 4, y - 30, 3, 10);
  mgBox(g, x - 12, y - 22, 24, 26, col, '#6f7b88', 6, 2);
}
const EL_COL = ['#1f9d55', '#7cc242', '#f2d024', '#f39c34', '#e5483a'];
function energyLabel(g, x, y, grade, s = 1){
  g.save(); g.translate(x, y); g.scale(s, s);
  mgBox(g, -24, -32, 48, 64, '#ffffff', '#1c2733', 5, 2);
  for (let i = 0; i < 5; i++){ g.fillStyle = EL_COL[i]; g.fillRect(-19, -26 + i * 9, 12 + i * 4, 7); }
  const yy = -26 + (grade - 1) * 9;
  g.fillStyle = '#1c2733'; g.beginPath(); g.moveTo(21, yy - 1); g.lineTo(10, yy - 1); g.lineTo(6, yy + 3.5); g.lineTo(10, yy + 8); g.lineTo(21, yy + 8); g.closePath(); g.fill();
  mgText(g, String(grade), 15, yy + 3.6, 8, '#fff');
  mgText(g, `${grade}등급`, 0, 23, 10, '#1c2733');
  g.restore();
}
function homeLiving(g, t){
  g.fillStyle = '#f3e9d6'; g.fillRect(0, 0, 960, 380);
  g.fillStyle = '#e6d6b8'; g.fillRect(0, 372, 960, 10);
  g.fillStyle = '#c99a6a'; g.fillRect(0, 380, 960, 160);
  g.strokeStyle = 'rgba(110,70,35,.22)'; g.lineWidth = 2;
  for (let x = -40; x < 1000; x += 90){ g.beginPath(); g.moveTo(x + 40, 382); g.lineTo(x, 540); g.stroke(); }
  /* 창문: 해가 쨍쨍한 낮 */
  mgBox(g, 36, 64, 210, 168, '#a9dcf7', '#8a6a48', 6, 7);
  mgEmoji(g, '☀️', 190, 112, 52); mgEmoji(g, '☁️', 84, 196, 30);
  g.strokeStyle = '#8a6a48'; g.lineWidth = 6; g.beginPath(); g.moveTo(141, 64); g.lineTo(141, 232); g.moveTo(36, 150); g.lineTo(246, 150); g.stroke();
  g.fillStyle = 'rgba(255,238,160,.28)'; g.beginPath(); g.moveTo(40, 232); g.lineTo(244, 232); g.lineTo(350, 530); g.lineTo(70, 530); g.closePath(); g.fill();
  /* 천장 전등: 낮인데도 켜져 있음 */
  g.fillStyle = `rgba(255,246,190,${.34 + Math.sin(t * 3) * .05})`; g.beginPath(); g.moveTo(300, 62); g.lineTo(420, 62); g.lineTo(520, 330); g.lineTo(200, 330); g.closePath(); g.fill();
  g.fillStyle = '#c9b77a'; g.fillRect(354, 0, 12, 30);
  mgBox(g, 292, 28, 136, 32, '#fffbe2', '#c9b77a', 10, 3); g.fillStyle = '#fff38a'; g.fillRect(304, 38, 112, 12);
  /* 에어컨 1등급 */
  mgBox(g, 752, 36, 178, 70, '#fbfcfd', '#9aa3ad', 12, 3); g.fillStyle = '#c9d4de'; g.fillRect(770, 88, 120, 7); mgDot(g, 772, 52, 4, '#25a862');
  energyLabel(g, 906, 70, 1, .6);
  /* TV: 아무도 없는데 켜져 있음 */
  mgBox(g, 588, 132, 228, 150, '#1c2733', '#0b1118', 8, 4);
  const hue = (t * 40) % 360, sg = g.createLinearGradient(600, 144, 804, 270);
  sg.addColorStop(0, `hsl(${hue},70%,62%)`); sg.addColorStop(1, `hsl(${(hue + 120) % 360},70%,46%)`);
  g.fillStyle = sg; g.fillRect(600, 144, 204, 126);
  mgEmoji(g, '🎵', 702, 206, 40);
  g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.moveTo(600, 144); g.lineTo(680, 144); g.lineTo(620, 270); g.lineTo(600, 270); g.closePath(); g.fill();
  g.fillStyle = '#5b6573'; g.fillRect(694, 282, 16, 18);
  mgBox(g, 620, 300, 164, 62, '#8a6a48', '#6b4f33', 8, 3);
  /* 소파: 비어 있음 */
  mgBox(g, 110, 360, 310, 70, '#5b8bd0', '#3d6aa8', 18, 3);
  mgBox(g, 96, 410, 338, 60, '#6a9be0', '#3d6aa8', 16, 3);
  mgBox(g, 84, 392, 40, 90, '#4f7fc4', '#3d6aa8', 14, 3); mgBox(g, 406, 392, 40, 90, '#4f7fc4', '#3d6aa8', 14, 3);
  /* 콘센트 둘: 아기 곁은 덮개 없음, 오른쪽은 덮개 있음 */
  homeOutlet(g, 96, 330, false); homeOutlet(g, 300, 322, true);
  mgEmoji(g, '👶', 42, 438, 44); mgEmoji(g, '🧸', 40, 500, 38);
  /* LED 스탠드 */
  mgBox(g, 846, 342, 100, 14, '#8a6a48', '#6b4f33', 4, 2); g.fillStyle = '#6b4f33'; g.fillRect(856, 356, 8, 70); g.fillRect(928, 356, 8, 70);
  g.fillStyle = 'rgba(255,255,225,.55)'; g.beginPath(); g.moveTo(898, 280); g.lineTo(934, 280); g.lineTo(952, 340); g.lineTo(882, 340); g.closePath(); g.fill();
  g.strokeStyle = '#39424e'; g.lineWidth = 5; g.beginPath(); g.moveTo(884, 340); g.lineTo(874, 298); g.lineTo(904, 272); g.stroke();
  mgBox(g, 892, 258, 46, 22, '#39424e', null, 8);
  mgBox(g, 836, 298, 36, 18, '#25a862', null, 5); mgText(g, 'LED', 854, 307, 11, '#fff');
  /* 멀티탭: 플러그를 잔뜩 꽂음 */
  g.strokeStyle = '#2b2f36'; g.lineWidth = 4;
  for (let i = 0; i < 5; i++){ const px = 458 + i * 30; g.beginPath(); g.moveTo(px, 462); g.bezierCurveTo(px - 20 + i * 10, 430, 380 + i * 90, 424, 300 + i * 120, 404 + (i % 2) * 26); g.stroke(); }
  mgBox(g, 436, 464, 168, 34, '#f4f6f8', '#7d8691', 8, 3);
  for (let i = 0; i < 5; i++) mgBox(g, 449 + i * 30, 452, 18, 22, '#3a4048', null, 4);
  mgDot(g, 590, 481, 5, '#e5483a');
  g.strokeStyle = `rgba(229,72,58,${.45 + Math.sin(t * 8) * .25})`; g.lineWidth = 3;
  for (let i = 0; i < 3; i++){ const bx = 470 + i * 45; g.beginPath(); g.moveTo(bx, 446); g.quadraticCurveTo(bx + 8, 436, bx, 426); g.quadraticCurveTo(bx - 8, 416, bx, 406); g.stroke(); }
}
function homeKitchen(g, t){
  /* 부엌 */
  g.fillStyle = '#eef3e8'; g.fillRect(0, 0, 556, 540);
  g.fillStyle = '#dfe9d6'; for (let y = 150; y < 330; y += 30) for (let x = (y / 30 % 2) * 20 - 20; x < 556; x += 40) g.fillRect(x + 2, y + 2, 36, 26);
  g.fillStyle = '#d6c19b'; g.fillRect(0, 420, 556, 120);
  /* 욕실 */
  g.fillStyle = '#e4eff9'; g.fillRect(564, 0, 396, 540);
  g.strokeStyle = 'rgba(110,150,190,.3)'; g.lineWidth = 1.5;
  for (let x = 564; x <= 960; x += 44){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 440); g.stroke(); }
  for (let y = 0; y <= 440; y += 44){ g.beginPath(); g.moveTo(564, y); g.lineTo(960, y); g.stroke(); }
  g.fillStyle = '#a9c1d6'; g.fillRect(564, 440, 396, 100);
  g.fillStyle = '#c9b48f'; g.fillRect(552, 0, 14, 540);
  for (const [x, s] of [[278, '부엌'], [762, '욕실']]){ mgBox(g, x - 46, 10, 92, 30, 'rgba(28,39,51,.78)', null, 10); mgText(g, s, x, 25, 16, '#fff'); }
  /* 냉장고: 문을 열어 둔 채 고민 */
  mgBox(g, 26, 104, 156, 316, '#e9eef3', '#8a96a3', 10, 3);
  mgBox(g, 38, 116, 132, 292, '#d5ecf8', null, 6);
  g.fillStyle = '#b5cfdf'; for (const y of [186, 256, 326]) g.fillRect(40, y, 128, 5);
  mgEmoji(g, '🥛', 70, 160, 34); mgEmoji(g, '🍎', 132, 162, 30); mgEmoji(g, '🧃', 80, 230, 30); mgEmoji(g, '🥚', 136, 300, 28);
  g.fillStyle = '#f4f7fa'; g.strokeStyle = '#8a96a3'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(182, 106); g.lineTo(246, 132); g.lineTo(246, 396); g.lineTo(182, 418); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#8a96a3'; g.fillRect(232, 220, 6, 60);
  for (let i = 0; i < 4; i++){ const o = (t * 40 + i * 30) % 120; g.strokeStyle = `rgba(120,190,240,${.6 - o / 200})`; g.lineWidth = 4; g.beginPath(); g.moveTo(60 + i * 30, 412); g.quadraticCurveTo(80 + i * 30 + o * .3, 440 + o * .4, 70 + i * 34 + o * .8, 470 + o * .3); g.stroke(); }
  mgEmoji(g, '🧒', 286, 372, 62); mgEmoji(g, '🤔', 308, 312, 30);
  /* 조리대 */
  mgBox(g, 330, 330, 222, 16, '#b9a27a', '#8f7a55', 4, 2); mgBox(g, 334, 346, 214, 76, '#cdb48a', '#8f7a55', 4, 2);
  g.fillStyle = '#8f7a55'; g.fillRect(440, 346, 3, 76);
  /* 전기 주전자: 피복이 벗겨진 전선 */
  homeOutlet(g, 430, 240, false);
  g.strokeStyle = '#2b2f36'; g.lineWidth = 5; g.beginPath(); g.moveTo(386, 300); g.quadraticCurveTo(392, 268, 408, 262); g.stroke();
  g.beginPath(); g.moveTo(420, 258); g.lineTo(430, 250); g.stroke();
  g.strokeStyle = '#e2782b'; g.lineWidth = 3; g.beginPath(); g.moveTo(406, 262); g.lineTo(421, 257); g.stroke();
  if (Math.sin(t * 9) > .2) mgEmoji(g, '✨', 414, 246, 18);
  mgBox(g, 352, 284, 40, 46, '#dfe5ea', '#6f7b88', 10, 2); g.fillStyle = '#6f7b88'; g.fillRect(346, 278, 52, 8);
  /* 토스터: 전선을 잡아당겨 뽑음 */
  homeOutlet(g, 506, 236, false);
  g.strokeStyle = '#2b2f36'; g.lineWidth = 5; g.beginPath(); g.moveTo(468, 306); g.quadraticCurveTo(476, 280, 486, 268); g.lineTo(500, 252); g.stroke();
  homePlug(g, 500, 262, '#e9eef3');
  mgEmoji(g, '✊', 482, 276, 30);
  g.strokeStyle = 'rgba(28,39,51,.55)'; g.lineWidth = 2; for (let i = 0; i < 3; i++){ g.beginPath(); g.moveTo(462 - i * 6, 282 + i * 7); g.lineTo(450 - i * 6, 290 + i * 7); g.stroke(); }
  mgBox(g, 448, 300, 70, 30, '#c9ced6', '#6f7b88', 8, 2); g.fillStyle = '#6f7b88'; g.fillRect(458, 302, 18, 4); g.fillRect(486, 302, 18, 4);
  /* 휴대폰 없이 꽂힌 충전기 */
  homeOutlet(g, 452, 150, false);
  mgBox(g, 442, 140, 20, 26, '#ffffff', '#9aa3ad', 5, 2);
  g.strokeStyle = '#f4f6f8'; g.lineWidth = 4; g.beginPath(); g.moveTo(452, 166); g.bezierCurveTo(452, 196, 430, 196, 432, 210); g.stroke();
  g.fillStyle = '#9aa3ad'; g.fillRect(428, 208, 8, 10);
  /* 욕실: 젖은 손으로 드라이어 플러그 꽂기 */
  mgBox(g, 650, 70, 130, 120, '#d8eefc', '#9aa3ad', 10, 4); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 4; g.beginPath(); g.moveTo(676, 90); g.lineTo(700, 130); g.stroke();
  g.fillStyle = '#f7fbff'; g.strokeStyle = '#9aa3ad'; g.lineWidth = 3; g.beginPath(); g.ellipse(716, 300, 70, 22, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = '#dfe9f2'; g.fillRect(700, 320, 32, 120);
  g.fillStyle = '#9aa3ad'; g.fillRect(712, 252, 8, 30);
  const drip = (t * 1.6) % 1; mgEmoji(g, '💧', 716, 286 + drip * 12, 14);
  homeOutlet(g, 600, 230, false);
  drawDevIcon(g, 'dryer', 752, 246, 64, t);
  g.strokeStyle = '#2b2f36'; g.lineWidth = 4; g.beginPath(); g.moveTo(744, 262); g.bezierCurveTo(720, 300, 650, 284, 628, 246); g.stroke();
  mgEmoji(g, '🤚', 650, 246, 40);
  for (let i = 0; i < 3; i++){ const o = ((t * 1.3) + i / 3) % 1; mgEmoji(g, '💧', 636 + i * 16, 262 + o * 40, 14); }
  /* 플러그 머리를 잡고 뽑기 */
  homeOutlet(g, 884, 200, false);
  g.strokeStyle = '#2b2f36'; g.lineWidth = 4; g.beginPath(); g.moveTo(884, 252); g.quadraticCurveTo(880, 290, 900, 320); g.stroke();
  homePlug(g, 884, 252, '#f4f6f8');
  mgEmoji(g, '🤏', 906, 236, 32);
  /* 1등급 세탁기 */
  drawDevIcon(g, 'washer', 820, 392, 150, t);
  energyLabel(g, 912, 356, 1, .72);
}
const HOME_ROOMS = [
  {name:'거실', draw:homeLiving, spots:[
    {id:'light', x:360, y:52, r:62, label:'waste', cap:'해가 쨍쨍한 낮인데 천장 전등이 모두 켜져 있어요.', why:'햇빛이 충분한 낮에는 전등을 꺼서 전기를 아껴요.'},
    {id:'tv', x:702, y:212, r:84, label:'waste', cap:'아무도 없는 거실에 TV가 켜져 있어요.', why:'보는 사람이 없는데 켜 두면 전기가 그냥 낭비돼요.'},
    {id:'ac', x:840, y:72, r:64, label:'good', cap:'에너지 소비 효율 1등급 에어컨이에요.', why:'1등급 제품은 같은 일을 하면서 전기를 덜 써요.'},
    {id:'strip', x:520, y:470, r:72, label:'danger', cap:'멀티탭 하나에 플러그를 잔뜩 꽂았어요.', why:'한꺼번에 많은 전기가 흐르면 전선이 뜨거워져 불이 날 수 있어요.'},
    {id:'bare', x:90, y:340, r:60, label:'danger', cap:'아기가 노는 곳 콘센트에 안전 덮개가 없어요.', why:'아이가 구멍에 쇠붙이를 넣으면 감전될 수 있어요. 안전 덮개를 꽂아요.'},
    {id:'cover', x:300, y:322, r:52, label:'good', cap:'안 쓰는 콘센트에 안전 덮개를 꽂아 두었어요.', why:'안전 덮개는 콘센트 구멍을 막아 감전 사고를 막아 줘요.'},
    {id:'led', x:892, y:300, r:60, label:'good', cap:'책상 스탠드에 LED 전구를 끼웠어요.', why:'LED는 같은 밝기를 내면서 전기를 적게 써요.'}]},
  {name:'부엌·욕실', draw:homeKitchen, spots:[
    {id:'fridge', x:110, y:262, r:88, label:'waste', cap:'냉장고 문을 활짝 열어 둔 채 무엇을 먹을지 고민해요.', why:'문을 열어 두면 찬 공기가 빠져나가 냉장고가 전기를 더 써요.'},
    {id:'fray', x:404, y:272, r:44, label:'danger', cap:'전기 주전자 전선의 피복이 벗겨져 구리선이 보여요.', why:'피복이 벗겨진 전선은 감전과 합선의 원인이 돼요. 쓰지 말고 바꿔요.'},
    {id:'pull', x:490, y:280, r:44, label:'danger', cap:'토스터 전선을 잡아당겨서 플러그를 뽑고 있어요.', why:'전선을 당기면 속의 구리선이 끊어지거나 피복이 벗겨져 불이 날 수 있어요.'},
    {id:'charger', x:452, y:160, r:44, label:'waste', cap:'휴대폰 없이 충전기만 콘센트에 계속 꽂혀 있어요.', why:'쓰지 않아도 꽂혀 있으면 대기 전력이 조금씩 새어 나가요.'},
    {id:'wet', x:640, y:252, r:60, label:'danger', cap:'물이 뚝뚝 떨어지는 손으로 헤어드라이어 플러그를 꽂아요.', why:'물 묻은 손은 전기가 잘 통해 감전될 수 있어요. 손을 먼저 닦아요.'},
    {id:'head', x:888, y:226, r:50, label:'good', cap:'다 쓴 전기 기구의 플러그 머리를 잡고 뽑아요.', why:'플러그 머리를 잡고 뽑아야 전선이 상하지 않아요.'},
    {id:'washer', x:826, y:394, r:74, label:'good', cap:'에너지 소비 효율 1등급 세탁기를 써요.', why:'1등급 세탁기는 같은 빨래를 하면서 전기를 덜 써요.'}]},
];
function homeSummary(R, S){
  return `<div class="rb-sec"><b>📋 ${R.name} 점검표</b><div class="rb-list">${R.spots.map(sp => { const d = S.done[sp.id], L = LABELS[sp.label];
    return `<div class="rb-row ${d || ''}"><i>${d === 'ok' ? '✓' : d === 'bad' ? '✗' : '·'}</i><span class="chip ${sp.label}">${L.icon} ${L.name}</span><span>${esc(sp.cap)}</span></div>`; }).join('')}</div></div>`;
}
function homeRoom(api, k){
  const R = HOME_ROOMS[k], S = {t:75, el:0, hearts:3, miss:0, done:{}, open:null};
  api.canvas(true);
  api.say(`${R.name} 그림에서 전기를 쓰는 장면을 눌러 살펴봐요. <b>✅ 바른 사용 · ⚠️ 위험 · 💸 낭비</b> 중 하나로 판단해요.`);
  const choose = lab => {
    const sp = S.open; if (!sp || MG.ended) return;
    api.pop(); S.open = null;
    const ok = lab === sp.label, L = LABELS[sp.label]; S.done[sp.id] = ok ? 'ok' : 'bad';
    if (ok){ SND.ok(); api.say(`✓ <b>${L.icon} ${L.name}</b> — ${sp.why}`, 'ok'); }
    else { S.miss++; S.hearts--; SND.bad(); api.say(`✗ 이 장면은 <b>${L.icon} ${L.name}</b>이에요. ${sp.why}`, 'bad'); }
  };
  api.pointer({down:(x, y) => {
    if (S.open){ api.pop(); S.open = null; return; }
    let hit = null, bd = 1e9;
    for (const sp of R.spots){ if (S.done[sp.id]) continue; const d = Math.hypot(sp.x - x, sp.y - y); if (d < sp.r && d < bd){ bd = d; hit = sp; } }
    if (!hit) return;
    S.open = hit; SND.tick();
    const el = api.pop(hit.x, hit.y, `<p>🔍 ${esc(hit.cap)}</p><div class="pop-row">${LABEL_KEYS.map((l, i) => `<button class="btn small pop-${l}" data-l="${l}">${LABELS[l].icon} ${LABELS[l].name} <kbd>${i + 1}</kbd></button>`).join('')}</div>`);
    el.querySelectorAll('[data-l]').forEach(b => b.onclick = e => { e.stopPropagation(); choose(b.dataset.l); });
  }});
  api.keys(e => { const l = {Digit1:'good', Digit2:'danger', Digit3:'waste'}[e.code]; if (l && S.open) choose(l); });
  api.loop(dt => {
    S.t -= dt; S.el += dt;
    const g = api.g; R.draw(g, S.el);
    for (const sp of R.spots){
      const d = S.done[sp.id];
      if (d){
        const ok = d === 'ok', L = LABELS[sp.label];
        g.strokeStyle = ok ? '#25a862' : '#e5483a'; g.lineWidth = 5; g.beginPath(); g.arc(sp.x, sp.y, 34, 0, Math.PI * 2); g.stroke();
        mgBox(g, sp.x - 54, sp.y + 24, 108, 26, ok ? '#123d27' : '#43181a', L.color, 9, 2); mgText(g, `${L.icon} ${L.name}`, sp.x, sp.y + 37, 13, '#fff');
      } else if (S.open === sp){
        g.strokeStyle = '#ffd23f'; g.lineWidth = 5; g.setLineDash([8, 6]); g.beginPath(); g.arc(sp.x, sp.y, 40, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      } else if (S.el > 20){
        const a = .55 + Math.sin(S.el * 5) * .3; mgDot(g, sp.x + 26, sp.y - 26, 13, `rgba(255,210,63,${a})`); mgText(g, '?', sp.x + 26, sp.y - 25, 16, '#1c2733');
      }
    }
    const n = Object.keys(S.done).length;
    api.stat(`🔍 ${n}/${R.spots.length} · ${heartsTxt(S.hearts, 3)} · ⏱ ${Math.max(0, Math.ceil(S.t))}초`);
    if (S.hearts <= 0) return api.end(0, '❤️를 모두 잃었어요. 설명을 떠올리며 다시 해 봐요.', homeSummary(R, S));
    if (n >= R.spots.length) return api.end(S.miss === 0 && S.el <= 50 ? 3 : S.miss <= 1 ? 2 : 1, `${R.name}의 장면 ${n}곳을 모두 판단했어요. 틀린 판단 ${S.miss}번 · ${Math.round(S.el)}초`, homeSummary(R, S));
    if (S.t <= 0) return api.end(n >= 5 ? 1 : 0, `시간이 끝났어요. ${n}곳을 판단했어요.`, homeSummary(R, S));
  });
}

/* ----- 3단계: 에너지 라벨 마트 + 까닭 3가지 영수증 ----- */
const MART = [
  {k:'fridge', icon:'🧊', name:'냉장고', tip:'하루 종일 켜 두는 제품', opts:[{g:1, price:120, bill:23000}, {g:3, price:95, bill:31000}, {g:5, price:80, bill:41000}]},
  {k:'washer', icon:'🧺', name:'세탁기', tip:'빨래할 때만 켜는 제품', opts:[{g:1, price:90, bill:6000}, {g:3, price:70, bill:9000}, {g:5, price:55, bill:13000}]},
  {k:'light', icon:'💡', name:'전등 10개', tip:'저녁마다 켜는 제품', opts:[{g:1, nm:'LED 등', price:15, bill:4000}, {g:3, nm:'형광등', price:10, bill:9000}, {g:5, nm:'백열등', price:5, bill:20000}]},
];
const MART_BUDGET = 200;
const won = n => Number(n).toLocaleString('ko-KR');
function martBest(){ let best = Infinity; for (const a of MART[0].opts) for (const b of MART[1].opts) for (const c of MART[2].opts) if (a.price + b.price + c.price <= MART_BUDGET) best = Math.min(best, a.bill + b.bill + c.bill); return best; }
const elabelHTML = gr => `<span class="elabel" aria-label="에너지 소비 효율 ${gr}등급">${[1, 2, 3, 4, 5].map(n => `<i class="e${n}${n === gr ? ' on' : ''}">${n === gr ? n : ''}</i>`).join('')}</span>`;
function homeMart(api){
  const pick = {}, rows = MART.map(r => Object.assign({}, r, {opts:mgShuffle(r.opts)}));
  api.canvas(false);
  api.say(`예산 <b>${MART_BUDGET}만 원</b> 안에서 품목마다 하나씩 골라요. <b>효율 등급</b>과 <b>한 달 전기 요금</b>을 꼭 살펴봐요!`);
  const el = api.dom(`<div class="mart"><h3 class="mg-h">🏪 에너지 라벨 마트 <small>목표: 예산 안에서 한 달 전기 요금을 가장 적게</small></h3>${rows.map(r => `<div class="mart-row"><div class="mart-h"><span>${r.icon}</span><b>${r.name}</b><small>${r.tip}</small></div>
    <div class="mart-opts">${r.opts.map((o, i) => `<button class="mart-c" data-k="${r.k}" data-i="${i}">${elabelHTML(o.g)}<b>${o.nm ? `${o.nm} · ` : ''}${o.g}등급</b><span class="mart-p">${o.price}만 원</span><small>한 달 전기 요금 <b>${won(o.bill)}원</b></small></button>`).join('')}</div></div>`).join('')}</div>`);
  const bot = api.bot(`<div class="mart-sum">🛒 <b id="mtSum">0</b> / ${MART_BUDGET}만 원 · ⚡ 한 달 전기 요금 <b id="mtBill">0</b>원</div><button class="btn primary big" id="mtPay">계산하기</button>`);
  const upd = () => {
    const s = rows.map(r => pick[r.k] != null ? r.opts[pick[r.k]] : null), sum = s.reduce((a, o) => a + (o ? o.price : 0), 0), bill = s.reduce((a, o) => a + (o ? o.bill : 0), 0);
    const se = $('#mtSum'); se.textContent = sum; se.classList.toggle('over', sum > MART_BUDGET); $('#mtBill').textContent = won(bill);
    return {s, sum, bill};
  };
  el.querySelectorAll('.mart-c').forEach(b => b.onclick = () => {
    pick[b.dataset.k] = +b.dataset.i; el.querySelectorAll(`.mart-c[data-k="${b.dataset.k}"]`).forEach(x => x.classList.toggle('on', x === b)); SND.tick();
    const u = upd(); if (u.sum > MART_BUDGET) api.say(`예산을 <b>${u.sum - MART_BUDGET}만 원</b> 넘었어요. 어느 제품을 바꿀까요?`, 'bad'); else api.say(`합계 ${u.sum}만 원 · 한 달 전기 요금 ${won(u.bill)}원`);
  });
  bot.querySelector('#mtPay').onclick = () => {
    const u = upd();
    if (u.s.some(o => !o)) return api.say('냉장고·세탁기·전등을 하나씩 모두 골라요.', 'bad');
    if (u.sum > MART_BUDGET) return api.say(`예산 ${MART_BUDGET}만 원을 넘었어요! 하나를 값이 싼 제품으로 바꿔 봐요.`, 'bad');
    const best = martBest(); SND.ok();
    martReceipt(api, rows, u, best, u.bill <= best ? 3 : u.bill <= best + 1000 ? 2 : 1);
  };
}
function martReceipt(api, rows, u, best, bolts){
  const BL = [['전기 요금'], ['감전', '화재'], ['감전', '화재'], ['자원'], ['환경']], fill = [], used = {};
  const CH = mgShuffle(['전기 요금', '감전', '화재', '자원', '환경', '게임 시간', '간식']);
  api.bot('');
  const el = api.dom(`<div class="receipt"><h3 class="mg-h">🧾 영수증</h3>
    <div class="rc-items">${rows.map((r, i) => `<div><span>${r.icon} ${r.name} · ${u.s[i].nm ? u.s[i].nm + ' ' : ''}${u.s[i].g}등급</span><b>${u.s[i].price}만 원</b></div>`).join('')}
      <div class="rc-tot"><span>합계</span><b>${u.sum}만 원</b></div><div class="rc-tot"><span>⚡ 한 달 전기 요금</span><b>${won(u.bill)}원</b></div></div>
    <p class="rc-best">${u.bill <= best ? '🏆 예산 안에서 가장 적은 전기 요금이에요!' : `예산 안에서 가장 적게 내는 방법은 한 달 <b>${won(best)}원</b>이에요. 어디에 1등급을 쓰면 가장 많이 아낄 수 있을까요?`}</p>
    <h4>영수증 아래 빈칸을 채워요 — 왜 전기를 아끼고 안전하게 써야 할까요?</h4>
    <p class="rc-s">① 전기를 아껴 쓰면 우리 집 <span class="blank"></span>을 줄일 수 있어요.</p>
    <p class="rc-s">② 전기를 안전하게 쓰면 <span class="blank"></span>이나 <span class="blank"></span> 사고를 막을 수 있어요.</p>
    <p class="rc-s">③ 전기를 아끼면 전기를 만드는 데 쓰는 <span class="blank"></span>을 아끼고 <span class="blank"></span>을 지킬 수 있어요.</p>
    <div class="rc-chips">${CH.map(c => `<button class="btn small rc-chip" data-c="${c}">${c}</button>`).join('')}</div></div>`);
  const mark = () => el.querySelectorAll('.blank').forEach((b, i) => { b.textContent = fill[i] || ''; b.classList.toggle('now', i === fill.length); b.classList.toggle('full', !!fill[i]); });
  mark(); api.say('반짝이는 빈칸에 알맞은 낱말을 차례로 눌러요.');
  el.querySelectorAll('.rc-chip').forEach(c => c.onclick = () => {
    const w = c.dataset.c, i = fill.length; if (i >= 5 || used[w] || MG.ended) return;
    if (BL[i].includes(w)){
      fill.push(w); used[w] = 1; c.disabled = true; SND.tick(); mark();
      if (fill.length === 5){ api.say('까닭 3가지를 모두 채웠어요!', 'ok'); api.after(700, () => api.end(bolts, `한 달 전기 요금 ${won(u.bill)}원 (예산 안에서 가장 적은 값 ${won(best)}원). 전기를 아끼고 안전하게 써야 하는 까닭 3가지도 정리했어요.`)); }
    } else {
      SND.bad(); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
      api.say(['게임 시간', '간식'].includes(w) ? '전기와 관계있는 낱말을 골라요.' : '그 낱말은 다른 빈칸에 더 어울려요.', 'bad');
    }
  });
}
mgReg({id:'home', order:5, icon:'🏠', title:'우리 집 안전 탐정', stat:'safe', book:'전기를 안전하게 사용하고 절약하는 방법 (집 안 점검 · 효율 등급 · 까닭 정리)',
  stages:[
    {name:'거실 점검', goal:'거실 그림에서 전기를 바르게 쓴 곳, 위험한 곳, 낭비하는 곳 7곳을 찾아 판단해요.', how:'그림을 눌러 살펴보고 ✅·⚠️·💸 고르기 (1·2·3 키)'},
    {name:'부엌·욕실 점검', goal:'부엌과 욕실의 장면 7곳을 찾아 판단해요. 물과 전선을 특히 조심해요.', how:'그림을 눌러 살펴보고 ✅·⚠️·💸 고르기 (1·2·3 키)'},
    {name:'에너지 라벨 마트', goal:`예산 ${MART_BUDGET}만 원으로 냉장고·세탁기·전등을 골라 한 달 전기 요금을 가장 적게 만들어요. 계산한 뒤 영수증에 까닭 3가지를 채워요.`, how:'품목마다 하나씩 누르기 · 계산하기'}],
  learn:[
    '콘센트 하나에 플러그를 많이 꽂으면 전선이 뜨거워져 <b>불이 날 수 있어요</b>. 안 쓰는 콘센트에는 <b>안전 덮개</b>를 꽂고, 보지 않는 TV와 낮의 전등은 <b>꺼서</b> 전기를 아껴요.',
    '물이 묻은 손은 전기가 잘 통해 <b>감전</b>될 수 있어요. 플러그는 <b>머리 부분을 잡고</b> 뽑고, 피복이 벗겨진 전선은 바로 바꿔요. 냉장고 문을 오래 열어 두거나 충전기를 꽂아 두면 전기가 새어 나가요.',
    '<b>에너지 소비 효율 1등급</b> 제품은 값이 조금 비싸도 전기를 덜 써요. 하루 종일 켜 두는 냉장고나 오래 켜는 전등을 1등급으로 고르면 많이 아낄 수 있어요. 전기를 아끼고 안전하게 쓰면 <b>요금을 줄이고, 사고를 막고, 자원과 환경을 지킬 수 있어요</b>.'],
  start(st, api){ if (st < 2) homeRoom(api, st); else homeMart(api); }});

/* ===== 로봇 훈련소 (분류 AI 개발: 데이터 → 학습 → 시험 → 고치기) ===== */
const RB_TRAIN = ['s1', 's13', 's5', 's6', 's2', 's8', 's14', 's11', 's3', 's4', 's7', 's12'];
const RB_TEST1 = ['t1', 't10', 't13', 't2', 't5', 't8', 't3', 't9', 't12'];
const RB_BINS = {good:{icon:'✅', name:'바른 사용'}, danger:{icon:'⚠️', name:'위험'}, waste:{icon:'💸', name:'낭비'}, trash:{icon:'🗑️', name:'버리기'}};
const RB_REL = [
  {label:'danger', icon:'💧', text:'물기 있는 손으로 콘센트를 만졌다'}, {label:'danger', icon:'➰', text:'전선이 찢어진 선풍기를 그냥 썼다'},
  {label:'danger', icon:'🔌', text:'한 콘센트에 난로와 전기밥솥을 같이 꽂았다'}, {label:'danger', icon:'👶', text:'아기 방 콘센트에 안전 덮개가 없다'},
  {label:'waste', icon:'💻', text:'아무도 없는데 컴퓨터를 켜 두었다'}, {label:'waste', icon:'📺', text:'보지도 않는 텔레비전을 하루 종일 틀어 놓았다'},
  {label:'waste', icon:'🔋', text:'충전이 끝난 충전기를 계속 꽂아 두었다'}, {label:'waste', icon:'🧊', text:'냉장고 문을 열어 둔 채 먹을 것을 고른다'},
  {label:'good', icon:'✋', text:'다 쓴 다리미 플러그를 머리 부분을 잡고 뽑았다'}, {label:'good', icon:'💡', text:'전기를 덜 쓰는 LED 전구로 바꾸었다'},
  {label:'good', icon:'🚪', text:'외출 전에 안 쓰는 전기 기구의 전원을 껐다'}, {label:'good', icon:'🛡️', text:'사용하지 않는 콘센트에 안전 덮개를 꽂아 두었다'}];
const RB_JUNK = [
  {label:'trash', icon:'⚽', text:'민수는 축구를 정말 좋아한다', kind:'전기와 상관없는 문장'}, {label:'trash', icon:'🍛', text:'오늘 급식 반찬은 카레였다', kind:'전기와 상관없는 문장'},
  {label:'trash', icon:'📞', text:'지아네 전화번호는 010-1234-5678이다', kind:'개인정보', pii:true}, {label:'trash', icon:'🏫', text:'우리 학교 6학년 3반 김민수', kind:'개인정보', pii:true}];
const RB_PROBE = '오늘 급식은 맛있었다';
const RB_CAND = [
  {label:'waste', text:'충전이 다 된 휴대폰 충전기가 하루 종일 꽂혀 있다'}, {label:'good', text:'다 쓴 다리미의 플러그 머리를 잡고 뺐다'},
  {label:'danger', text:'충전기 선을 쭉 잡아당겨서 뺐다'}, {label:'waste', text:'햇빛이 환한 낮에 교실 전등이 켜져 있다'},
  {label:'danger', text:'물기 있는 손으로 콘센트를 만졌다'}, {label:'good', text:'형광등 대신 LED 전구를 달았다'},
  {label:'waste', text:'아무도 없는 방에 TV가 켜져 있다'}, {label:'danger', text:'콘센트 하나에 플러그를 여러 개 꽂았다'}];
const rbScene = id => SCENES.find(s => s.id === id), rbTest = id => TEST_SCENES.find(s => s.id === id);
/* 3단계에서 고를 수 있는 예시 문장 (겹치는 문장은 하나만) */
const RB_POOL = (() => { const seen = new Set(); return RB_CAND.concat(RB_REL).filter(c => !seen.has(c.text) && seen.add(c.text)); })();
/* 같은 라벨 카드가 몰리지 않게: 라벨별로 섞은 뒤, 남은 장수가 많은 라벨부터 바로 앞과 다른 라벨을 하나씩 꺼낸다 */
function rbSpread(cards){
  const g = {}; for (const c of mgShuffle(cards)) (g[c.label] = g[c.label] || []).push(c);
  const out = []; let last = null;
  while (out.length < cards.length){
    const ks = Object.keys(g).filter(k => g[k].length).sort((a, b) => g[b].length - g[a].length || Math.random() - .5);
    const k = ks.find(x => x !== last) || ks[0]; out.push(g[k].shift()); last = k;
  }
  return out;
}
const rbSim = (a, b) => { const A = bigramSet(a), B = bigramSet(b); let n = 0; for (const x of A) if (B.has(x)) n++; return n / Math.max(1, A.size + B.size - n); };
function rbModel(pairs){ const d = {good:[], danger:[], waste:[]}; for (const [l, t] of pairs) if (d[l]) d[l].push(t); return NB.train(d); }
/* 카드 고르기: 문장 카드가 하나씩 나오고, 정해진 시간 안에 칸을 고른다. 고른 칸은 바로 알려 주지 않는다(로봇은 내가 고른 그대로 믿는다). */
function rbSort(api, cards, bins, sec, done){
  const S = {i:0, t:sec, picks:[], lock:0};
  const el = api.dom(`<div class="rb"><div class="rb-head"><span class="rb-bot">🤖</span><span id="rbMsg">무엇이든 가르쳐 주세요! 고른 칸을 정답이라고 믿고 배울게요.</span></div>
    <div class="rb-card" id="rbCard"></div>
    <div class="rb-bins">${bins.map((b, k) => `<button class="btn rb-bin ${b}" data-b="${b}"><span>${RB_BINS[b].icon}</span><b>${RB_BINS[b].name}</b><small id="rbN_${b}">0장</small><kbd>${k + 1}</kbd></button>`).join('')}</div></div>`);
  const show = () => { const c = cards[S.i]; S.lim = Math.max(5, sec - S.i * .28); S.t = S.lim; S.tk = 3; ROBO3.belt = {p:0, on:true}; const card = $('#rbCard'); card.className = 'rb-card'; card.innerHTML = `<div class="rb-ico">${esc(c.icon || '📝')}</div><p>${esc(c.text)}</p><div class="mg-timer"><i id="rbTm"></i></div><small>${S.i + 1} / ${cards.length}</small>`; };
  const pick = b => {
    if (S.lock > 0 || S.i >= cards.length || MG.ended) return;
    S.picks.push(b); SND.tick(); robo3Pick(b);
    const n = $('#rbN_' + b); if (n) n.textContent = `${S.picks.filter(x => x === b).length}장`;
    $('#rbCard').classList.add('fly', 'to-' + b);
    $('#rbMsg').textContent = b === 'none' ? '앗, 시간이 지났어요. 이 문장은 건너뛸게요.' : b === 'trash' ? '이 문장은 배우지 않고 버릴게요.' : `‘${RB_BINS[b].name}’ 칸으로 기억할게요!`;
    S.lock = .4;
  };
  el.querySelectorAll('[data-b]').forEach(x => x.onclick = () => pick(x.dataset.b));
  api.keys(e => { const m = e.code.match(/^(?:Digit|Numpad)([1-4])$/); if (m && bins[+m[1] - 1]) pick(bins[+m[1] - 1]); });
  show();
  api.loop(dt => {
    if (S.lock > 0){ S.lock -= dt; if (S.lock <= 0){ S.i++; if (S.i >= cards.length){ api.loop(null); done(S.picks); return; } show(); } return; }
    S.t -= dt; const tm = $('#rbTm'); if (tm) tm.style.width = `${Math.max(0, S.t / S.lim * 100)}%`;
    ROBO3.belt.p = clamp(1 - S.t / S.lim, 0, 1);
    if (S.t < S.tk && S.tk > 0){ S.tk--; if (S.tk < 2) SFX.tick(); }
    if (S.t <= 0) pick('none');
    api.stat(`🗂️ ${Math.min(S.i + 1, cards.length)}/${cards.length}`);
  });
}
function rbThinking(api, fn){ ROBO3.think = 1.4; api.bot(''); api.dom(`<div class="rb-think"><div class="rb-bot big">🤖</div><p>로봇이 공부하는 중…</p><div class="rb-dots"><i></i><i></i><i></i></div></div>`); api.after(1200, fn); }
const rbChip = (l, pre = '') => l && LABELS[l] ? `<span class="chip ${l}">${pre}${LABELS[l].icon} ${LABELS[l].name}</span>` : l === 'trash' ? `<span class="chip skip">${pre}🗑️ 버리기</span>` : `<span class="chip skip">${pre}시간 초과</span>`;
function rbClues(m){
  return `<div class="rb-sec"><b>🧠 로봇이 찾은 단서 낱말</b>${LABEL_KEYS.map(c => { const w = NB.keyWords(m, c, 4);
    return `<div class="rb-clue">${rbChip(c)} ${w.length ? w.map(x => `<code>${esc(x)}</code>`).join(' ') : '<small>아직 없어요</small>'}</div>`; }).join('')}</div>`;
}
function rbTestHTML(res, title = '📝 처음 보는 시험 문장'){
  return `<div class="rb-sec"><b>${title}</b><div class="rb-list">${res.map(({t, r}) => { const ok = r.label === t.label;
    return `<div class="rb-row ${ok ? 'ok' : 'bad'}"><i>${ok ? '✓' : '✗'}</i><span>${esc(t.text)}</span>${rbChip(r.label, '🤖 ')}${ok ? '' : `<small>정답 ${LABELS[t.label].icon} ${LABELS[t.label].name}</small>`}</div>`; }).join('')}</div></div>`;
}
function rbBadHTML(bad, title = '🔁 다시 볼 라벨'){
  if (!bad.length) return '<div class="okbox">모든 카드를 알맞은 칸에 넣었어요!</div>';
  return `<div class="rb-sec"><b>${title}</b><div class="rb-list">${bad.map(({c, p}) => `<div class="rb-row bad"><i>✗</i><span>${esc(c.text)}${c.kind ? ` <small>(${c.kind})</small>` : ''}</span>${rbChip(p, '내가 고른 칸 ')}<small>→ ${c.label === 'trash' ? '🗑️ 버리기' : `${LABELS[c.label].icon} ${LABELS[c.label].name}`}</small></div>`).join('')}</div></div>`;
}
function robotS1(api){
  robo3Reset();
  const cards = rbSpread(RB_TRAIN.map(rbScene));
  api.canvas(false); api.say('문장을 읽고 알맞은 칸을 골라요. 로봇은 내가 고른 칸을 <b>정답(라벨)</b>이라고 믿고 배워요!');
  rbSort(api, cards, ['good', 'danger', 'waste'], 8, picks => {
    let ok = 0; const bad = [], pairs = [];
    cards.forEach((c, i) => { const p = picks[i]; if (p === c.label) ok++; else bad.push({c, p}); if (LABELS[p]) pairs.push([p, c.text]); });
    const m = rbModel(pairs), tests = rbSpread(RB_TEST1.map(rbTest)), res = tests.map(t => ({t, r:NB.predict(m, t.text)})), score = res.filter(x => x.r.label === x.t.label).length;
    let fair = '';
    if (bad.length){ const m2 = rbModel(cards.map(c => [c.label, c.text])), s2 = tests.filter(t => NB.predict(m2, t.text).label === t.label).length;
      fair = `<div class="note" style="margin-top:8px">라벨을 모두 바르게 붙였다면 로봇은 <b>${s2}개</b>를 맞혔을 거예요. 라벨이 틀리면 AI도 틀리게 배워요.</div>`; }
    rbThinking(api, () => api.end(ok === 12 ? 3 : ok >= 10 ? 2 : ok >= 8 ? 1 : 0,
      `라벨 ${cards.length}개 중 <b>${ok}개</b>를 바르게 붙였어요. 내 라벨로 배운 로봇은 처음 보는 문장 ${tests.length}개 중 <b>${score}개</b>를 맞혔어요.`,
      rbBadHTML(bad) + fair + rbClues(m) + rbTestHTML(res)));
  });
}
function robotS2(api){
  robo3Reset();
  const cards = rbSpread(RB_REL.concat(RB_JUNK));
  api.canvas(false); api.say('로봇에게 줄 데이터를 골라요. <b>전기와 상관없는 문장</b>과 <b>개인정보</b>는 🗑️에 버리고, 나머지는 알맞은 칸에 넣어요.');
  rbSort(api, cards, ['good', 'danger', 'waste', 'trash'], 8, picks => {
    let ok = 0, pii = 0; const bad = [], pairs = [], cleanPairs = [];
    cards.forEach((c, i) => {
      const p = picks[i]; if (p === c.label) ok++; else bad.push({c, p});
      if (LABELS[p]){ pairs.push([p, c.text]); if (c.label !== 'trash') cleanPairs.push([p, c.text]); if (c.pii) pii++; }
    });
    const kidDirty = pairs.length !== cleanPairs.length, clean = rbModel(cleanPairs), dirty = kidDirty ? rbModel(pairs) : rbModel(cleanPairs.concat(RB_JUNK.map(j => ['good', j.text])));
    const box = (m, title) => { const r = NB.predict(m, RB_PROBE), pc = Math.round(r.p[r.label] * 100);
      return `<div class="rb-probe"><b>${title}</b>${rbChip(r.label, `${pc}% `)}<small>${pc >= 70 ? '상관없는 문장인데도 자신 있게 대답해요!' : '잘 모르는 문장이라 망설여요'}</small></div>`; };
    const probe = `<div class="rb-sec"><b>🔎 로봇에게 ‘${RB_PROBE}’를 물어보면?</b><div class="rb-probes">${box(clean, '🧹 쓰레기를 버린 로봇')}${box(dirty, kidDirty ? '🗑️ 내 로봇 (쓰레기가 섞임)' : '🗑️ 쓰레기를 섞었다면?')}</div>
      <p class="mg-small">전기와 상관없는 문장을 배운 로봇은 엉뚱한 낱말(오늘, 급식, 민수…)을 단서로 삼아 버려요.</p></div>`;
    const warn = pii ? `<div class="warnbox" style="margin-top:8px">⚠️ <b>개인정보 ${pii}장</b>이 로봇의 학습 데이터에 들어갔어요! AI는 배운 것을 기억하기 때문에 전화번호·학교·이름 같은 개인정보는 절대 넣으면 안 돼요.</div>` : '';
    let b = ok >= 16 ? 3 : ok >= 14 ? 2 : ok >= 11 ? 1 : 0; if (pii) b = Math.min(b, 1);
    rbThinking(api, () => api.end(b, `카드 ${cards.length}장 중 <b>${ok}장</b>을 알맞게 골랐어요.${pii ? ' 개인정보가 들어가서 번개는 1개까지만 받을 수 있어요.' : ''}`, warn + rbBadHTML(bad, '🔁 다시 볼 카드') + probe));
  });
}
/* 3단계: 틀린 장면마다 '이 장면을 바로잡으려면 어떤 예시를 더 가르칠까?'를 두 개 중에서 고른다.
   하나는 정답 라벨의 비슷한 문장(도움이 됨), 하나는 로봇이 틀리게 답한 라벨의 비슷한 문장(더 헷갈리게 함). 고른 예시는 쌓여서 계속 배운다 */
function rbOptions(t, robotLabel, taught, used = new Set()){
  const left = RB_POOL.filter(c => !taught.some(x => x.text === c.text) && !used.has(c.text));   /* 장면마다 서로 다른 예시가 나오게 */
  const best = lab => left.filter(c => c.label === lab).map(c => ({c, s:rbSim(c.text, t.text)})).sort((a, b) => b.s - a.s)[0];
  const wrongLab = robotLabel && robotLabel !== t.label ? robotLabel : LABEL_KEYS.find(l => l !== t.label);
  const out = [best(t.label), best(wrongLab)].filter(Boolean).map(x => x.c);
  out.forEach(c => used.add(c.text));
  return mgShuffle(out);
}
function robotS3(api){
  robo3Reset();
  const base = RB_TRAIN.map(rbScene).map(s => [s.label, s.text]), tests = TEST_SCENES, taught = [], hist = [];
  const run = () => { const m = rbModel(base.concat(taught.map(c => [c.label, c.text]))); const res = tests.map(t => ({t, r:NB.predict(m, t.text)})); return {res, score:res.filter(x => x.r.label === x.t.label).length}; };
  let cur = run(), tries = 0, best = cur.score, wrong = [], opts = [], pick = {};
  hist.push(cur.score); api.canvas(false);
  const el = api.dom(`<div class="rb3">
    <div class="rb3-top"><div><span class="rb3-lbl">🤖 로봇의 시험 점수</span><b class="rb-score" id="r3S"></b></div><div id="r3H" class="rb-hist"></div></div>
    <ol class="rb3-steps"><li id="r3s1">① 로봇이 틀린 장면을 읽어요</li><li id="r3s2">② 장면마다 더 가르칠 예시를 하나씩 골라요</li><li id="r3s3">③ 다시 가르치고 시험해요</li></ol>
    <div id="r3L" class="rb3-list"></div><div id="r3T" class="rb3-taught"></div></div>`);
  const bot = api.bot(`<button class="btn primary big" id="r3Go">🔁 고른 예시로 다시 가르치기 <small id="r3N"></small></button><button class="btn" id="r3End" disabled>이대로 끝내기</button>`);
  const draw = () => {
    $('#r3S').textContent = `${cur.score} / ${tests.length}`;
    $('#r3H').innerHTML = hist.map((s, i) => `<span class="${i === hist.length - 1 ? 'on' : ''}">${i ? `${i}번째` : '처음'} <b>${s}</b></span>`).join('<i>→</i>');
    wrong = cur.res.filter(x => x.r.label !== x.t.label); const used = new Set(); opts = wrong.map(x => rbOptions(x.t, x.r.label, taught, used)); pick = {};
    $('#r3L').innerHTML = wrong.length ? wrong.map((x, i) => `<div class="rb3-row" data-row="${i}">
        <div class="rb3-q"><p><b>❌ ${esc(x.t.text)}</b></p><div class="rb3-ans">${rbChip(x.r.label, '🤖 로봇 ')} <span>정답</span> ${rbChip(x.t.label)}</div></div>
        <div class="rb3-opts"><small>이 장면을 바로잡으려면 어떤 예시를 더 가르칠까요?</small>${opts[i].length ? opts[i].map((c, k) => `<button class="rb3-o" data-i="${i}" data-k="${k}">${rbChip(c.label)}<span>${esc(c.text)}</span></button>`).join('') : '<em>더 가르칠 예시가 없어요</em>'}</div></div>`).join('')
      : '<div class="okbox">🏆 시험 장면 13개를 모두 맞혔어요!</div>';
    $('#r3T').innerHTML = taught.length ? `<b>지금까지 더 가르친 예시 ${taught.length}개</b> ${taught.map(c => rbChip(c.label)).join(' ')}` : '';
    $('#r3N').textContent = `(남은 기회 ${3 - tries}번)`;
    el.querySelectorAll('.rb3-o').forEach(b => b.onclick = () => {
      const i = +b.dataset.i, k = +b.dataset.k;
      pick[i] = pick[i] === k ? undefined : k; SND.tick();
      el.querySelectorAll(`.rb3-o[data-i="${i}"]`).forEach(x => x.classList.toggle('on', +x.dataset.k === pick[i]));
      el.querySelector(`[data-row="${i}"]`).classList.toggle('picked', pick[i] != null); stepOn();
    });
    stepOn();
  };
  const nPick = () => Object.values(pick).filter(v => v != null).length;
  const stepOn = () => { const n = nPick(); $('#r3s1').className = 'done'; $('#r3s2').className = n ? 'done' : 'on'; $('#r3s3').className = n ? 'on' : ''; };
  const finish = () => api.end(best >= 13 ? 3 : best >= 12 ? 2 : best >= 11 ? 1 : 0, `시험 점수가 처음 ${hist[0]}개에서 최고 <b>${best}개</b>가 되었어요. (기회 ${tries}번 사용 · 더 가르친 예시 ${taught.length}개)`,
    `<div class="rb-sec"><b>📈 점수 변화</b><div class="rb-hist">${hist.map((s, i) => `<span>${i ? `${i}번째` : '처음'} <b>${s}</b></span>`).join('<i>→</i>')}</div></div>`);
  bot.querySelector('#r3Go').onclick = () => {
    if (MG.ended || tries >= 3) return;
    const chosen = Object.entries(pick).filter(([, k]) => k != null).map(([i, k]) => ({c:opts[+i][k], t:wrong[+i].t}));
    if (!chosen.length) return api.say('틀린 장면 아래에서 더 가르칠 예시를 하나 이상 골라요.', 'bad');
    const misled = chosen.filter(x => x.c.label !== x.t.label).length;
    chosen.forEach(x => taught.push(x.c));
    tries++; const prev = cur.score; cur = run(); hist.push(cur.score); best = Math.max(best, cur.score);
    $('#r3End').disabled = false; draw();
    const d = cur.score - prev;
    if (cur.score >= 13){ SND.ok(); api.say('🏆 모두 맞혔어요! 틀린 장면과 비슷하고 정답 라벨이 같은 예시를 보탠 덕분이에요.', 'ok'); api.after(1200, finish); return; }
    if (d > 0){ SND.ok(); api.say(`점수가 ${d}개 올랐어요!${misled ? ` 그런데 고른 예시 중 ${misled}개는 로봇이 틀린 쪽 라벨이었어요. 정답 라벨과 같은 예시를 골라 봐요.` : ' 남은 틀린 장면도 같은 방법으로 고쳐 봐요.'}`, 'ok'); }
    else { SND.bad(); api.say(misled ? `점수가 ${d < 0 ? '내려갔어요' : '그대로예요'}. 고른 예시 ${misled}개가 로봇이 틀린 쪽 라벨이라 로봇이 더 헷갈렸어요. 정답 라벨(오른쪽 칩)과 같은 예시를 골라요.` : '점수가 그대로예요. 다른 예시를 골라 한 번 더 가르쳐 봐요.', 'bad'); }
    if (tries >= 3) api.after(1600, finish);
  };
  bot.querySelector('#r3End').onclick = () => { if (tries) finish(); };
  api.say('① 로봇이 틀린 장면을 읽고, ② 장면마다 아래 예시 두 개 중 <b>로봇에게 더 가르칠 예시</b>를 하나씩 골라요. ③ 다 고르면 [다시 가르치기]! 기회는 3번이에요.');
  draw();
}
mgReg({id:'robot', order:6, icon:'🤖', title:'로봇 훈련소', stat:'ai', ai:'데이터에 라벨 붙이기 → 데이터 고르기(개인정보 빼기) → 시험하고 틀린 것을 보고 고치기',
  book:'전기를 바르게 쓰는 장면 · 위험한 장면 · 낭비하는 장면 판단하기 → AI 안전 로봇 학습',
  stages:[
    {name:'라벨 붙이기', goal:'문장 12개에 ✅ 바른 사용 · ⚠️ 위험 · 💸 낭비 라벨을 붙여 로봇을 가르쳐요. 로봇은 내가 붙인 라벨을 그대로 믿고 배운 뒤 처음 보는 문장을 풀어요.', how:'버튼 또는 1·2·3 키 · 한 장에 8초'},
    {name:'데이터 고르기', goal:'문장 16장 중 전기와 상관없는 문장과 개인정보는 🗑️에 버리고, 나머지는 알맞은 칸에 넣어요.', how:'버튼 또는 1·2·3·4 키 · 한 장에 8초'},
    {name:'시험하고 고치기', goal:'로봇이 틀린 시험 장면마다, 바로잡는 데 도움이 될 예시를 두 개 중에서 골라 다시 가르쳐요. 13개를 모두 맞히게 해 봐요.', how:'틀린 장면 아래 예시 고르기 → 다시 가르치기 (기회 3번)'}],
  learn:[
    'AI는 사람이 붙인 <b>라벨(정답)</b>을 보고 배워요. 라벨이 틀리면 AI도 틀리게 배워요. 그래서 데이터를 만드는 사람의 바른 판단이 중요해요.',
    '상관없는 문장을 섞으면 AI가 엉뚱한 낱말을 단서로 삼고, <b>개인정보</b>를 넣으면 AI가 그것까지 기억해요. AI에게 줄 데이터는 <b>골라서</b> 줘야 해요.',
    'AI를 시험해 <b>틀린 문제를 살펴보고</b>, 그와 비슷한 예시를 보태 다시 가르치면 더 똑똑해져요. 시험 → 고치기 → 다시 시험을 되풀이하는 것이 AI 프로그램 개발이에요.'],
  start(st, api){ [robotS1, robotS2, robotS3][st](api); },
  extra:[{label:'AI 안전 로봇 연구실 (문장 직접 쓰기)', fn:() => openNBLab()}]});
