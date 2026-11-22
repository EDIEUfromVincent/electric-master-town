/* =========================================================
   6-1. 전자석 단원 게임
   · 전자석 실험 게임 — 교재 '전자석의 성질을 떠올려 봅시다' (스위치 · 전지 2개 · 전지 방향과 나침반)
   · 전자석 탐정     — 교재 '전자석을 사용하는 예 조사하기' (교실에서 찾기 · 생활 속 예와 성질 · 공중 부양 제품 뉴스)
   ========================================================= */
const MAG_CAP = [0, 4, 9, 14];   // 전지 n개(직렬)일 때 한쪽 끝에 붙는 클립 수 (교재: 1개 4개씩, 2개 9개씩)

/* ----- 실험 장치 그리기: 전지 끼우개 · 스위치 · 집게 전선 · 나사못 코일 ----- */
function magClip(g, x, y, rot = 0){ g.save(); g.translate(x, y); g.rotate(rot); g.strokeStyle = '#7d8691'; g.lineWidth = 3; rr(g, -6, -10, 12, 20, 6); g.stroke(); g.beginPath(); g.moveTo(-2, -5); g.lineTo(-2, 7); g.stroke(); g.restore(); }
function magRig(g, o){
  const n = o.batt || 1, bw = 78, hx = 480 - n * bw / 2, hy = 40, cx = o.x, cy = o.y, L = 150;
  /* 전선 */
  g.lineWidth = 5; g.lineCap = 'round';
  g.strokeStyle = '#e5483a'; g.beginPath(); g.moveTo(hx - 10, hy + 22); g.bezierCurveTo(hx - 120, hy + 40, cx - L - 60, cy - 150, cx - L + 8, cy - 4); g.stroke();
  g.strokeStyle = '#2b2f36'; g.beginPath(); g.moveTo(hx + n * bw + 10, hy + 22); g.bezierCurveTo(720, hy + 20, 800, 80, 812, 118); g.stroke();
  g.beginPath(); g.moveTo(862, 132); g.bezierCurveTo(900, 200, cx + L + 70, cy - 150, cx + L - 8, cy - 4); g.stroke();
  /* 전지 끼우개 */
  mgBox(g, hx - 14, hy - 6, n * bw + 28, 56, '#2f6fb4', '#1c3f6e', 10);
  for (let i = 0; i < n; i++){
    const x = hx + i * bw, plus = o.dir > 0;
    mgBox(g, x + 4, hy + 4, bw - 8, 36, '#d6dbe2', '#6f7b88', 8);
    g.fillStyle = '#c87533'; g.fillRect(plus ? x + bw - 12 : x + 4, hy + 12, 8, 20);
    mgText(g, plus ? '−' : '+', x + 16, hy + 22, 20, '#1c2733'); mgText(g, plus ? '+' : '−', x + bw - 24, hy + 22, 20, '#1c2733');
  }
  /* 스위치 */
  mgBox(g, 792, 112, 76, 30, '#eef1f4', '#6f7b88', 6);
  g.fillStyle = '#9aa3ad'; g.beginPath(); g.arc(808, 127, 6, 0, 7); g.arc(852, 127, 6, 0, 7); g.fill();
  g.strokeStyle = '#3a3f47'; g.lineWidth = 6; g.beginPath(); g.moveTo(808, 127);
  if (o.on) g.lineTo(856, 124); else g.lineTo(846, 96); g.stroke();
  mgText(g, o.on ? '켜짐' : '꺼짐', 830, 160, 15, o.on ? '#1f8a4c' : '#6f7b88');
  /* 코일 */
  if (o.on){ for (let k = 1; k <= 3; k++){ g.strokeStyle = `rgba(58,142,230,${.32 / k})`; g.lineWidth = 4; g.beginPath(); g.ellipse(cx, cy, L + 24 * k, 36 + 18 * k, 0, 0, 7); g.stroke(); } }
  mgBox(g, cx - L, cy - 9, L * 2, 18, '#9aa3ad', '#6f7b88', 6, 2);
  mgBox(g, cx - L - 16, cy - 16, 18, 32, '#8a939d', '#6f7b88', 5, 2);
  mgBox(g, cx - 112, cy - 19, 224, 38, '#c87533', '#8a4a1c', 8, 2);
  g.strokeStyle = 'rgba(90,40,10,.45)'; g.lineWidth = 2; for (let x = cx - 104; x < cx + 108; x += 8){ g.beginPath(); g.moveTo(x, cy - 18); g.lineTo(x + 4, cy + 18); g.stroke(); }
  /* 붙은 클립 */
  const half = [Math.ceil((o.hang || 0) / 2), Math.floor((o.hang || 0) / 2)];
  [cx - L - 4, cx + L - 4].forEach((tx, side) => { for (let k = 0; k < half[side]; k++){ const row = k % 5, col = Math.floor(k / 5); magClip(g, tx + (col - 1) * 14 + (row % 2) * 6, cy + 26 + row * 17, (row % 2 ? .25 : -.2)); } });
  if (o.poles && o.on){
    const right = o.dir > 0 ? 'N' : 'S', left = right === 'N' ? 'S' : 'N';
    for (const [x, t] of [[cx - L - 40, left], [cx + L + 26, right]]){ mgBox(g, x - 17, cy - 17, 34, 34, t === 'N' ? '#e5483a' : '#3a8ee6', '#1c2733', 17, 2); mgText(g, t, x, cy + 1, 18, '#fff'); }
  }
}
function magTable(g){
  g.fillStyle = '#e9f1f7'; g.fillRect(0, 0, 960, 540);
  g.fillStyle = '#c9a477'; g.fillRect(0, 410, 960, 130); g.fillStyle = '#b48d5f'; g.fillRect(0, 410, 960, 8);
}

/* 1단계: 켜고 끄기 — 클립을 집어 컵에 옮기기 */
function magS1(api){
  const S = {x:420, tx:420, hold:0, on:false, carry:0, cup:0, lost:0, t:45, floor:[], drag:false}, GOAL = 12;
  const overTray = () => Math.abs(S.x - 220) < 120, overCup = () => Math.abs(S.x - 760) < 110;
  const bot = api.bot(`<button class="btn hold" id="mL" aria-label="왼쪽">◀</button><button class="btn hold" id="mR" aria-label="오른쪽">▶</button><button class="btn primary big" id="mSw">스위치 켜기 <kbd>스페이스</kbd></button>`);
  api.holdBtn(bot.querySelector('#mL'), () => S.hold = -1, () => { if (S.hold < 0) S.hold = 0; });
  api.holdBtn(bot.querySelector('#mR'), () => S.hold = 1, () => { if (S.hold > 0) S.hold = 0; });
  const sw = () => {
    S.on = !S.on; bot.querySelector('#mSw').firstChild.textContent = S.on ? '스위치 끄기 ' : '스위치 켜기 ';
    if (S.on){
      if (overTray() && !S.carry){ S.carry = MAG_CAP[1]; SND.tick(); api.say('찰칵! 전기가 흐르자 클립이 붙었어요.', 'ok'); }
      else api.say(overTray() ? '이미 클립을 들고 있어요. 컵 위로 옮겨요.' : '전기가 흘러 자석이 됐어요. 클립 상자 위로 가서 켜 봐요.');
    } else if (S.carry){
      if (overCup()){ S.cup += S.carry; SND.ok(); api.say(`컵에 쏙! (${S.cup}/${GOAL})`, 'ok'); }
      else { S.lost += S.carry; for (let k = 0; k < S.carry; k++) S.floor.push([S.x + (Math.random() - .5) * 280, 455 + Math.random() * 60, Math.random() * 3]); SND.bad(); api.say('앗! 전기를 끊으면 자석이 아니게 돼서 클립이 떨어져요. 컵 위에서 꺼요.', 'bad'); }
      S.carry = 0;
    }
  };
  bot.querySelector('#mSw').onclick = sw;
  api.keys(e => { if (e.code === 'Space'){ if (!e.repeat) sw(); } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') S.hold = -1; else if (e.code === 'ArrowRight' || e.code === 'KeyD') S.hold = 1; },
    e => { if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && S.hold < 0) S.hold = 0; if ((e.code === 'ArrowRight' || e.code === 'KeyD') && S.hold > 0) S.hold = 0; });
  api.pointer({down:(x, y) => { if (y > 150) { S.drag = true; S.tx = x; } }, move:x => { if (S.drag) S.tx = x; }, up:() => { S.drag = false; }});
  api.canvas(true); api.say('◀ ▶로 전자석을 움직이고, 클립 상자 위에서 스위치를 켜요. 컵 위에서 끄면 내려놓아요.');
  api.loop(dt => {
    S.t -= dt;
    if (S.hold) S.tx += S.hold * 430 * dt;
    S.tx = clamp(S.tx, 200, 800); S.x += (S.tx - S.x) * Math.min(1, dt * 12);
    const g = api.g; magTable(g);
    mgBox(g, 96, 438, 250, 70, '#f3e6c8', '#b07a45', 10); mgText(g, '클립 상자', 221, 524, 15, '#6b4523');
    for (let k = 0; k < 26; k++) magClip(g, 112 + (k % 13) * 17, 456 + Math.floor(k / 13) * 22, (k % 3 - 1) * .4);
    g.fillStyle = 'rgba(190,225,245,.55)'; g.fillRect(690, 372, 140, 130); g.strokeStyle = '#6fa8c8'; g.lineWidth = 4; g.strokeRect(690, 372, 140, 130);
    for (let k = 0; k < Math.min(S.cup, 24); k++) magClip(g, 708 + (k % 6) * 20, 488 - Math.floor(k / 6) * 16, (k % 2 ? .5 : -.4));
    mgText(g, `컵 ${S.cup}/${GOAL}`, 760, 524, 16, '#1c4f6e');
    for (const [x, y, r] of S.floor) magClip(g, x, y, r);
    magRig(g, {x:S.x, y:250, batt:1, dir:1, on:S.on, hang:S.carry});
    api.stat(`📎 컵 ${S.cup}/${GOAL} · 떨어뜨림 ${S.lost} · ⏱ ${Math.max(0, Math.ceil(S.t))}초`);
    if (S.cup >= GOAL){ const used = 45 - S.t; return api.end(S.lost === 0 && used <= 34 ? 3 : S.lost <= 4 ? 2 : 1, `클립 ${GOAL}개를 ${Math.round(used)}초 만에 옮겼어요. 떨어뜨린 클립 ${S.lost}개.`); }
    if (S.t <= 0) return api.end(S.cup >= 8 ? 1 : 0, `시간이 끝났어요. 컵에 ${S.cup}개를 옮겼어요.`);
  });
}
/* 2단계: 세기 — 주문받은 만큼 전지를 연결해 클립 붙이기 */
function magS2(api){
  const orders = mgShuffle([4, 9, 14, 4, 9, 14]), S = {batt:1, on:false, hang:0, i:0, miss:0, t:60, wait:0, ok:false};
  const bot = api.bot(`${[1, 2, 3].map(n => `<button class="btn${n === 1 ? ' on' : ''}" data-b="${n}">전지 ${n}개 <kbd>${n}</kbd></button>`).join('')}<button class="btn primary big" id="mAt">스위치 켜서 붙이기 <kbd>스페이스</kbd></button>`);
  const setB = n => { if (S.on) return; S.batt = n; bot.querySelectorAll('[data-b]').forEach(b => b.classList.toggle('on', +b.dataset.b === n)); SND.tick(); };
  bot.querySelectorAll('[data-b]').forEach(b => b.onclick = () => setB(+b.dataset.b));
  const attach = () => {
    if (S.on || S.i >= orders.length) return;
    S.on = true; S.hang = MAG_CAP[S.batt]; const want = orders[S.i];
    S.ok = S.hang === want; S.wait = 1.3;
    if (S.ok){ SND.ok(); api.say(`✓ 주문 성공! 전지 ${S.batt}개 → 클립 ${S.hang}개`, 'ok'); }
    else { S.miss++; SND.bad(); api.say(S.hang < want ? `클립 ${S.hang}개뿐이에요. 더 세게 하려면 전지를 더 연결해요!` : `클립 ${S.hang}개, 너무 많아요! 전지를 줄이면 약해져요.`, 'bad'); }
  };
  bot.querySelector('#mAt').onclick = attach;
  api.keys(e => { if (e.code === 'Space'){ if (!e.repeat) attach(); } else if (/^Digit[123]$/.test(e.code)) setB(+e.code.slice(5)); });
  api.canvas(true); api.say('볼트 박사의 주문만큼 클립을 붙여요. 전지 개수를 먼저 고르고 스위치를 켜요.');
  api.loop(dt => {
    S.t -= dt;
    if (S.wait > 0){ S.wait -= dt; if (S.wait <= 0){ S.on = false; S.hang = 0; if (S.ok) S.i++; if (S.i >= orders.length) return api.end(S.miss === 0 ? 3 : S.miss <= 2 ? 2 : 1, `주문 ${orders.length}개를 모두 해냈어요. 실수 ${S.miss}번.`); } }
    const g = api.g; magTable(g);
    for (let k = 0; k < 40; k++) magClip(g, 300 + (k % 20) * 18, 452 + Math.floor(k / 20) * 22, (k % 3 - 1) * .4);
    magRig(g, {x:480, y:270, batt:S.batt, dir:1, on:S.on, hang:S.hang});
    const want = orders[Math.min(S.i, orders.length - 1)];
    mgBox(g, 24, 170, 210, 110, '#fffdf4', '#1c2733', 16); mgText(g, '🧑‍🔬 볼트 박사', 129, 196, 15, '#b85a19');
    mgText(g, `클립 ${want}개`, 129, 232, 30, '#1c2733'); mgText(g, '붙여 주세요!', 129, 262, 15, '#5a6878');
    if (S.on) mgText(g, `${S.hang}개`, 480, 400, 26, S.ok ? '#1f8a4c' : '#e5483a');
    api.stat(`🧾 주문 ${Math.min(S.i + 1, orders.length)}/${orders.length} · 실수 ${S.miss} · ⏱ ${Math.max(0, Math.ceil(S.t))}초`);
    if (S.t <= 0 && !MG.ended) api.end(S.i >= 4 ? 1 : 0, `시간이 끝났어요. 주문 ${S.i}개를 해냈어요.`);
  });
}
/* 3단계: 극의 방향 — 전지 방향을 바꿔 나침반 바늘과 자석 자동차를 맞히기 */
function magS3(api){
  const R = mgShuffle([{k:'compass', want:1}, {k:'compass', want:-1}, {k:'compass', want:1}, {k:'compass', want:-1}]).concat(mgShuffle([{k:'car', want:1}, {k:'car', want:-1}, {k:'car', want:1}, {k:'car', want:-1}]));
  const S = {dir:1, on:false, i:0, miss:0, t:70, wait:0, ok:false, needle:-Math.PI / 2, car:0};
  const bot = api.bot(`<button class="btn big" id="mFlip">⇄ 전지 방향 바꾸기 <kbd>F</kbd></button><button class="btn primary big" id="mChk">스위치 켜서 확인 <kbd>스페이스</kbd></button>`);
  const flip = () => { if (S.on) return; S.dir *= -1; SND.tick(); };
  const check = () => {
    if (S.on || S.i >= R.length) return;
    S.on = true; S.wait = 1.5; S.ok = S.dir === R[S.i].want;
    if (S.ok){ SND.ok(); api.say(R[S.i].k === 'compass' ? '✓ 바늘이 원하는 쪽을 가리켰어요!' : (R[S.i].want > 0 ? '✓ 같은 극끼리 밀어냈어요!' : '✓ 다른 극끼리 끌어당겼어요!'), 'ok'); }
    else { S.miss++; SND.bad(); api.say('반대예요! 전지 방향을 바꾸면 전자석의 극이 바뀌어요. 바꿔서 다시 켜 봐요.', 'bad'); }
  };
  bot.querySelector('#mFlip').onclick = flip; bot.querySelector('#mChk').onclick = check;
  api.keys(e => { if (e.code === 'Space'){ if (!e.repeat) check(); } else if (e.code === 'KeyF' || e.code === 'ArrowLeft' || e.code === 'ArrowRight'){ if (!e.repeat) flip(); } });
  api.canvas(true); api.say('전지 방향을 정한 뒤 스위치를 켜서 확인해요. 바늘의 빨간 쪽(N극)이 가리킬 곳을 맞혀요.');
  api.loop(dt => {
    S.t -= dt;
    const r = R[Math.min(S.i, R.length - 1)];
    if (S.wait > 0){ S.wait -= dt; if (S.wait <= 0){ S.on = false; if (S.ok) S.i++; if (S.i >= R.length) return api.end(S.miss === 0 ? 3 : S.miss <= 2 ? 2 : 1, `${R.length}번 모두 맞혔어요. 실수 ${S.miss}번.`); } }
    const wantNeedle = S.on ? (S.dir > 0 ? 0 : Math.PI) : -Math.PI / 2;
    S.needle += angDiff(wantNeedle, S.needle) * Math.min(1, dt * 6);
    S.car += ((S.on ? (S.dir > 0 ? 70 : -60) : 0) - S.car) * Math.min(1, dt * 4);
    const g = api.g; magTable(g);
    magRig(g, {x:400, y:270, batt:1, dir:S.dir, on:S.on, hang:0, poles:true});
    if (r.k === 'compass'){
      const ccx = 690, ccy = 270; mgBox(g, ccx - 58, ccy - 58, 116, 116, '#f4f6f8', '#6f7b88', 58);
      mgText(g, 'N', ccx, ccy - 44, 13, '#9aa3ad'); g.save(); g.translate(ccx, ccy); g.rotate(S.needle);
      g.fillStyle = '#e5483a'; g.beginPath(); g.moveTo(44, 0); g.lineTo(0, -9); g.lineTo(0, 9); g.fill();
      g.fillStyle = '#3a8ee6'; g.beginPath(); g.moveTo(-44, 0); g.lineTo(0, -9); g.lineTo(0, 9); g.fill(); g.restore();
      mgBox(g, 600, 360, 180, 46, '#fff7d6', '#e2a93a', 12); mgText(g, `목표: 빨간 바늘 ${r.want > 0 ? '→ 오른쪽' : '← 왼쪽'}`, 690, 383, 16, '#6b4523');
    } else {
      const x = 680 + S.car; g.fillStyle = '#9aa3ad'; g.fillRect(600, 300, 300, 8);
      mgBox(g, x - 46, 250, 92, 48, '#ffd23f', '#1c2733', 10); mgBox(g, x - 46, 250, 30, 48, '#e5483a', '#1c2733', 6); mgText(g, 'N', x - 31, 274, 16, '#fff');
      g.fillStyle = '#2b2f36'; g.beginPath(); g.arc(x - 26, 302, 9, 0, 7); g.arc(x + 26, 302, 9, 0, 7); g.fill();
      mgBox(g, 600, 360, 220, 46, '#fff7d6', '#e2a93a', 12); mgText(g, `목표: 자동차를 ${r.want > 0 ? '밀어내기 →' : '끌어당기기 ←'}`, 710, 383, 16, '#6b4523');
    }
    api.stat(`🧭 ${Math.min(S.i + 1, R.length)}/${R.length}번째 · 실수 ${S.miss} · ⏱ ${Math.max(0, Math.ceil(S.t))}초`);
    if (S.t <= 0 && !MG.ended) api.end(S.i >= 5 ? 1 : 0, `시간이 끝났어요. ${S.i}번 맞혔어요.`);
  });
}
mgReg({id:'mag', order:1, icon:'🧲', title:'전자석 실험 게임', stat:'em', book:'전자석의 성질을 떠올려 봅시다 (스위치 · 전지 2개 · 전지 방향과 나침반)',
  stages:[
    {name:'켜고 끄기', goal:'전자석으로 클립 12개를 컵에 옮겨요. 컵 위가 아닌 곳에서 끄면 클립이 떨어져요.', how:'◀ ▶ 또는 끌어서 움직이기 · 스페이스로 스위치'},
    {name:'세기', goal:'볼트 박사가 주문한 개수만큼 클립을 붙여요. 전지 개수로 세기를 정해요.', how:'1·2·3으로 전지 개수 · 스페이스로 붙이기'},
    {name:'극의 방향', goal:'전지 방향을 바꿔 나침반 바늘과 자석 자동차를 원하는 대로 움직여요.', how:'F로 전지 방향 바꾸기 · 스페이스로 확인'}],
  learn:[
    '전자석은 <b>전기가 흐를 때만 자석</b>이 돼요. 그래서 원하는 곳에서 전기를 끊어 내려놓을 수 있어요. (전자석 기중기)',
    '전지를 더 많이 연결하면 전자석이 <b>세져서</b> 클립이 더 많이 붙어요. 세기를 바꿀 수 있어요. (선풍기 바람 세기 · 스피커 소리 크기)',
    '전지의 방향을 바꾸면 전자석의 <b>극의 방향</b>이 바뀌어요. 같은 극끼리는 밀어내고 다른 극끼리는 끌어당겨요. (세탁기 · 자기 부상 열차)'],
  start(st, api){ [magS1, magS2, magS3][st](api); },
  cleared(){ if ([0, 1, 2].every(s => mgCleared('mag', s)) && !SAVE.badges.em1){ SAVE.badges.em1 = true; toast('전자석 실험실 미션 성공! 세 가지 성질을 모두 찾았어요.', 'ok'); } },
  extra:[{label:'예전 실험실 화면 (예상 → 실험 카드)', fn:() => openExperiment()}]});

/* ===== 전자석 탐정 ===== */
const CLASS_SPOTS = [
  {x:118, y:118, s:'🔊', name:'스피커', ok:true, why:'스피커 안에는 영구 자석과 코일(전자석)이 있어요. 코일에 흐르는 전기의 세기와 방향이 빠르게 바뀌면서 진동판이 떨려 소리가 나요.'},
  {x:858, y:318, s:'fan', name:'선풍기', ok:true, why:'선풍기 속 전동기에 전자석이 있어요. 세기를 바꿔 바람 세기를 조절해요.'},
  {x:486, y:262, s:'🖥️', name:'컴퓨터', ok:true, why:'컴퓨터의 스피커와 열을 식히는 팬(전동기)에 전자석이 들어 있어요.'},
  {x:262, y:398, s:'📱', name:'스마트 기기', ok:true, why:'스마트폰·태블릿의 스피커와 진동 장치에 전자석이 들어 있어요.'},
  {x:676, y:404, s:'📚', name:'책'}, {x:350, y:420, s:'✏️', name:'연필'}, {x:56, y:436, s:'🪴', name:'화분'}, {x:598, y:262, s:'🌍', name:'지구본'},
  {x:906, y:486, s:'⚽', name:'공'}, {x:440, y:470, s:'✂️', name:'가위'}, {x:770, y:430, s:'📏', name:'자'}, {x:842, y:110, s:'🗓️', name:'달력'},
];
function detS1(api){
  const S = {found:{}, hearts:3, t:45, pops:[], wrong:{}}, need = CLASS_SPOTS.filter(s => s.ok).length;
  api.canvas(true); api.say('교실 그림에서 <b>전자석이 들어 있는 물건</b>을 모두 찾아 눌러요. 전기가 흐르지 않는 물건을 누르면 ❤️가 줄어요.');
  api.pointer({down:(x, y) => {
    let hit = null, bd = 44; for (const s of CLASS_SPOTS){ const d = Math.hypot(s.x - x, s.y - y); if (d < bd){ bd = d; hit = s; } }
    if (!hit || S.found[hit.name] || S.wrong[hit.name]) return;
    if (hit.ok){ S.found[hit.name] = 1; SND.ok(); api.say(`✓ <b>${hit.name}</b>: ${hit.why}`, 'ok'); }
    else { S.wrong[hit.name] = 1; S.hearts--; SND.bad(); api.say(`✗ ${josa(hit.name, '에는', '에는')} 전기가 흐르지 않아서 전자석이 없어요.`, 'bad'); }
  }});
  api.loop(dt => {
    S.t -= dt; const g = api.g, n = Object.keys(S.found).length;
    g.fillStyle = '#f3ecdf'; g.fillRect(0, 0, 960, 540); g.fillStyle = '#d9c3a0'; g.fillRect(0, 330, 960, 210);
    mgBox(g, 300, 34, 360, 150, '#2f5d46', '#6b4523', 6, 8); mgText(g, '전자석을 찾아라!', 480, 108, 26, '#eef7ee', 'center', 400);
    for (const [x, w] of [[30, 150], [780, 150]]) mgBox(g, x, 160, w, 110, '#cfe6f5', '#9aa3ad', 4, 4);
    mgBox(g, 400, 280, 260, 30, '#b07a45', '#6b4523', 4, 3); g.fillStyle = '#6b4523'; g.fillRect(420, 310, 14, 60); g.fillRect(626, 310, 14, 60);
    for (const x of [200, 600]) { mgBox(g, x, 420, 190, 22, '#c89b5e', '#8f6a3a', 4, 2); g.fillStyle = '#8f6a3a'; g.fillRect(x + 12, 442, 10, 50); g.fillRect(x + 168, 442, 10, 50); }
    g.fillStyle = '#5b6573'; g.fillRect(852, 340, 10, 120); g.fillRect(826, 456, 62, 10);
    for (const s of CLASS_SPOTS){
      if (s.s === 'fan') drawDevIcon(g, 'fan', s.x, s.y - 6, 64, TIME); else mgEmoji(g, s.s, s.x, s.y, 44);
      if (S.found[s.name]){ g.strokeStyle = '#25a862'; g.lineWidth = 5; g.beginPath(); g.arc(s.x, s.y, 34, 0, 7); g.stroke(); mgBox(g, s.x - 44, s.y + 30, 88, 24, '#123d27', null, 8); mgText(g, s.name, s.x, s.y + 42, 13, '#8ff0b9'); }
      if (S.wrong[s.name]){ g.strokeStyle = '#e5483a'; g.lineWidth = 5; g.beginPath(); g.moveTo(s.x - 22, s.y - 22); g.lineTo(s.x + 22, s.y + 22); g.moveTo(s.x + 22, s.y - 22); g.lineTo(s.x - 22, s.y + 22); g.stroke(); }
    }
    api.stat(`🔍 찾은 전자석 ${n}/${need} · ${heartsTxt(S.hearts, 3)} · ⏱ ${Math.max(0, Math.ceil(S.t))}초`);
    if (n >= need){ const used = 45 - S.t; return api.end(S.hearts === 3 && used <= 30 ? 3 : S.hearts >= 2 ? 2 : 1, `교실에서 전자석 ${need}개를 모두 찾았어요! (${Math.round(used)}초)`); }
    if (S.hearts <= 0) return api.end(0, '❤️를 모두 잃었어요. 전기가 흐르는 물건을 찾아봐요.');
    if (S.t <= 0) return api.end(n >= 3 ? 1 : 0, `시간이 끝났어요. ${n}개를 찾았어요.`);
  });
}
const DEV_HINT = {fan:'바람 세기를 1단·2단·3단으로 바꿔요', robovac:'흡입 세기와 바퀴 도는 방향을 바꿔요', drone:'날개를 빠르게 회전해 공중에 떠올라요', crane:'철 고철을 붙였다가 원하는 곳에 내려놓아요',
  maglev:'선로 위에 둥둥 떠서 앞으로 나아가요', ev:'빠르기를 조절하고 뒤로도 가요', mri:'아주 센 자석으로 몸속을 사진처럼 찍어요', washer:'세탁통을 왼쪽·오른쪽으로 번갈아 돌려요', dryer:'약한 바람·센 바람을 골라요', speaker:'소리를 크게·작게 바꿔요'};
function detS2(api){
  const deck = mgShuffle(DEVICES), S = {i:0, miss:0, combo:0, score:0, t:9, wait:0};
  api.canvas(false);
  const show = () => {
    const d = deck[S.i]; S.t = 9;
    api.dom(`<div class="mg-flash"><div class="mg-dev">${devIconHTML(d.icon, 'big')}</div><h3>${esc(d.name)}</h3><p>${DEV_HINT[d.id] || ''}</p>
      <div class="mg-timer"><i id="dTm"></i></div>
      <div class="mg-choices">${[['onoff', '🔌', '켜고 끄기', '전기가 흐를 때만 자석'], ['power', '🔆', '세기 조절', '자석의 세기를 바꿈'], ['pole', '🧭', '극의 방향', '극의 방향을 바꿈']].map(([k, i, t, s]) => `<button class="btn mg-ch" data-p="${k}"><span>${i}</span><b>${t}</b><small>${s}</small></button>`).join('')}</div><div id="dFb"></div></div>`)
      .querySelectorAll('[data-p]').forEach(b => b.onclick = () => answer(b.dataset.p));
  };
  const answer = p => {
    if (S.wait > 0) return;
    const d = deck[S.i], ok = d.props.includes(p);
    if (ok){ S.combo++; S.score += 10 + S.combo * 2; SND.ok(); } else { S.miss++; S.combo = 0; SND.bad(); }
    const fb = $('#dFb'); if (fb) fb.innerHTML = `<div class="${ok ? 'okbox' : 'warnbox'}">${ok ? '✓ 맞아요!' : '✗ 아쉬워요.'} ${esc(d.name)}: ${d.props.map(k => `<b>${PROPS[k].short}</b>`).join(' · ')} — ${esc(d.desc)}</div>`;
    document.querySelectorAll('[data-p]').forEach(b => { b.disabled = true; b.classList.toggle('good', d.props.includes(b.dataset.p)); });
    S.wait = ok ? 1.6 : 2.6;
  };
  api.keys(e => { const k = {Digit1:'onoff', Digit2:'power', Digit3:'pole'}[e.code]; if (k) answer(k); });
  api.say('기기가 전자석의 어떤 성질을 이용하는지 골라요. 두 가지를 쓰는 기기는 어느 하나만 골라도 맞아요. (1·2·3 키)');
  show();
  api.loop(dt => {
    if (S.wait > 0){ S.wait -= dt; if (S.wait <= 0){ S.i++; if (S.i >= deck.length) return api.end(S.miss === 0 ? 3 : S.miss <= 2 ? 2 : 1, `기기 ${deck.length}개 중 ${deck.length - S.miss}개를 맞혔어요. 점수 ${S.score}.`); show(); } }
    else { S.t -= dt; const tm = $('#dTm'); if (tm) tm.style.width = `${Math.max(0, S.t / 9 * 100)}%`; if (S.t <= 0) answer('none'); }
    api.stat(`🗂️ ${Math.min(S.i + 1, deck.length)}/${deck.length} · 연속 ${S.combo} · 실수 ${S.miss}`);
  });
}
function detS3(api){
  /* 세기 조절 다이얼: ▲ ▼를 누르는 동안 전자석의 세기가 바뀌고, 손을 떼면 그 세기를 유지한다 */
  const S = {h:0, p:0, dir:0, t:24, inb:0, books:2, ev:[8, 16], el:0};
  const LO = 120, HI = 190;
  const bot = api.bot(`<button class="btn big hold" id="lvDn">▼ 약하게 <kbd>↓</kbd></button><button class="btn primary big hold" id="lvUp">▲ 세게 <kbd>↑</kbd></button>`);
  api.holdBtn(bot.querySelector('#lvUp'), () => S.dir = 1, () => { if (S.dir > 0) S.dir = 0; });
  api.holdBtn(bot.querySelector('#lvDn'), () => S.dir = -1, () => { if (S.dir < 0) S.dir = 0; });
  const UP = ['ArrowUp', 'KeyW', 'Space'], DN = ['ArrowDown', 'KeyS'];
  api.keys(e => { if (UP.includes(e.code)) S.dir = 1; else if (DN.includes(e.code)) S.dir = -1; },
    e => { if ((UP.includes(e.code) && S.dir > 0) || (DN.includes(e.code) && S.dir < 0)) S.dir = 0; });
  api.canvas(true); api.say('📰 뉴스 속 <b>공중 부양 제품</b>을 만들어요! <b>▲ 세게 · ▼ 약하게</b>로 전자석의 세기를 조절해 책을 초록 칸 높이에 띄워요. 책이 늘어나면 더 세게 해야 해요.');
  api.loop(dt => {
    S.t -= dt; S.el += dt;
    if (S.ev.length && S.el >= S.ev[0]){ S.ev.shift(); S.books++; SND.tick(); api.say('📚 책을 한 권 더 얹었어요! 더 무거워졌으니 세기를 올려요.', 'bad'); }
    S.p = clamp(S.p + S.dir * .35 * dt, 0, 1);
    const heq = Math.max(0, S.p * 330 - (S.books - 2) * 55 + Math.sin(S.el * 1.7) * 10);
    S.h = clamp(S.h + (heq - S.h) * Math.min(1, dt * 2.2), 0, 330);
    if (S.h >= LO && S.h <= HI) S.inb += dt;
    const g = api.g; g.fillStyle = '#eaf2f8'; g.fillRect(0, 0, 960, 540); g.fillStyle = '#d8c4a4'; g.fillRect(0, 440, 960, 100);
    const by = 430, bx = 480, inBand = S.h >= LO && S.h <= HI;
    mgBox(g, 40, 430 - HI - 10, 60, HI - LO + 20, inBand ? 'rgba(37,168,98,.32)' : 'rgba(37,168,98,.16)', '#25a862', 6, 2); mgText(g, '목표', 70, 430 - (LO + HI) / 2, 14, '#1f8a4c');
    g.strokeStyle = '#9aa3ad'; g.lineWidth = 2; g.beginPath(); g.moveTo(110, 100); g.lineTo(110, 430); g.stroke();
    for (let k = 0; k <= 6; k++){ g.beginPath(); g.moveTo(104, 430 - k * 55); g.lineTo(116, 430 - k * 55); g.stroke(); }
    const yb = by - 34 - S.h;
    g.strokeStyle = '#ffd23f'; g.lineWidth = 3; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(110, yb + 30); g.lineTo(bx - 100, yb + 30); g.stroke(); g.setLineDash([]);
    if (S.p > .02) for (let k = 1; k <= 3; k++){ g.strokeStyle = `rgba(58,142,230,${S.p * .5 / k})`; g.lineWidth = 3; g.beginPath(); g.ellipse(bx, (by - 30 + yb + 40) / 2, 70 + k * 20, Math.max(10, (by - 30 - yb) / 2), 0, 0, Math.PI * 2); g.stroke(); }
    mgBox(g, bx - 110, by - 36, 220, 40, '#39424e', '#1c2733', 12); mgBox(g, bx - 80, by - 32, 160, 14, '#c87533', null, 6);
    mgBox(g, bx - 24, by - 54, 48, 22, '#e5483a', '#1c2733', 6); mgText(g, 'N', bx, by - 43, 14, '#fff');
    for (let k = 0; k < S.books; k++){ const c = ['#3a8ee6', '#e2782b', '#25a862', '#c58bff', '#e5483a'][k % 5]; mgBox(g, bx - 90 + (k % 2) * 8, yb - k * 26, 180, 24, c, '#1c2733', 5, 2); }
    mgBox(g, bx - 24, yb + 24, 48, 18, '#e5483a', '#1c2733', 5); mgText(g, 'N', bx, yb + 33, 12, '#fff');
    mgText(g, '같은 극끼리 밀어내요', bx + 210, by - 46, 15, '#5a6878');
    mgBox(g, 740, 56, 190, 30, '#dfe7ee', '#9aa3ad', 8, 2); mgBox(g, 744, 60, 182 * S.p, 22, '#3a8ee6', null, 6); mgText(g, `전자석 세기 ${Math.round(S.p * 100)}%`, 835, 102, 14, '#1c2733');
    mgText(g, `책 ${S.books}권`, 835, 128, 14, '#5a6878');
    api.stat(`🎈 목표 높이에 있던 시간 ${S.inb.toFixed(1)}초 · ⏱ ${Math.max(0, Math.ceil(S.t))}초`);
    if (S.t <= 0){ const r = S.inb / 24; return api.end(r >= .75 ? 3 : r >= .55 ? 2 : r >= .35 ? 1 : 0, `24초 중 ${S.inb.toFixed(1)}초 동안 목표 높이에 띄웠어요.`, mgNoteBox('detect')); }
  });
}
/* 교재 '공유하기': 새롭게 알게 된 점 한 줄 쓰기 */
function mgNoteBox(key){
  setTimeout(() => { const t = $('#mgNote'); if (t){ t.oninput = () => { SAVE.notes = SAVE.notes || {}; SAVE.notes[key] = t.value; persist(); }; } }, 0);
  return `<div class="fieldset" style="margin-top:10px;text-align:left"><label for="mgNote">💬 새롭게 알게 된 점이나 전자석으로 만들어 보고 싶은 것을 한 줄로 써요 (모둠 공유용)</label>
    <textarea id="mgNote" rows="2" maxlength="120">${esc((SAVE.notes || {})[key] || '')}</textarea></div>`;
}
mgReg({id:'detect', order:2, icon:'🔍', title:'전자석 탐정', stat:'em', book:'전자석을 사용하는 예 조사하기 (교실 · 생활 속 기기 · 공중 부양 제품)',
  stages:[
    {name:'교실에서 찾기', goal:'교실 곳곳에 숨은, 전자석이 들어 있는 물건(기기 모형 포함)을 모두 찾아요. 전기가 흐르지 않는 물건을 누르면 ❤️가 줄어요.', how:'화면에서 물건을 눌러 고르기'},
    {name:'생활 속 기기와 성질', goal:'생활 속 기기 10개가 전자석의 어떤 성질을 이용하는지 골라요.', how:'버튼 또는 1·2·3 키'},
    {name:'공중 부양 제품 만들기', goal:'전자석의 세기를 조절해 책을 목표 높이에 띄워요. 책이 늘어나면 세기를 올려요. 끝나면 새롭게 알게 된 점을 써요.', how:'▲ 세게 · ▼ 약하게 (화살표 ↑ ↓)'}],
  learn:[
    '스피커, 선풍기, 컴퓨터, 스마트 기기, 로봇 청소기, 드론, 세탁기, 머리 말리개, 전기 자동차, 기중기, 자기 부상 열차, 자기 공명 영상 장치처럼 <b>전기로 움직이거나 소리를 내는 물건</b>에는 전자석이 들어 있어요.',
    '기기마다 쓰는 성질이 달라요. 기중기는 <b>켜고 끄기</b>, 선풍기는 <b>세기</b>(전동기 안에서는 극도 계속 바뀌며 돌아요), 스피커는 <b>세기와 극의 방향</b>, 세탁기는 <b>극의 방향</b>을 바꿔요.',
    '같은 극끼리 밀어내는 힘을 <b>세기로 조절</b>하면 물체를 띄울 수 있어요. 높이를 재고 → 세기를 고치고 → 다시 재기를 되풀이하는 것이 컴퓨터 프로그램의 반복과 같아요.'],
  start(st, api){ [detS1, detS2, detS3][st](api); }});
