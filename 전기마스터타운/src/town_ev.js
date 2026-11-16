/* =========================================================
   5-2. 길 건너기 안전(❤️) · 전기차 충전소 프로젝트
   · 차가 다니는 길은 횡단보도로 건너야 한다. 차는 횡단보도 위의 사람에게만 멈춘다.
     횡단보도 밖에서 차에 부딪히면 ❤️ 하나를 잃고 보도로 튕겨 나간다. ❤️가 0이 되면 병원 앞에서 깨어난다(진행은 그대로).
     ❤️는 40초마다 하나씩 다시 찬다. 길 찾기(눌러서 가기)도 횡단보도로만 길을 건넌다.
   · 퀘스트: 도로를 달리는 초록 전기차(⚡)를 붙잡아 운전자 이야기를 듣고, 시청 앞 시장님께
     ① 전기차가 에너지를 아끼는 까닭 ② 전자석이 쓰이는 실제 예 ③ 충전소를 세울 곳(안전 · 편리)을 설득한다.
     설득하면 주차장 입구에 충전소가 생기고 전기차가 충전한다.
   ========================================================= */
const HP_MAX = 5;
const HP = {inv:0, regen:0};
const hpNow = () => (typeof SAVE.hp === 'number' ? SAVE.hp : (SAVE.hp = HP_MAX));
function updateHpHUD(){ const el = $('#hpBar'); if (!el) return; const h = hpNow(); el.textContent = '❤️'.repeat(h) + '🤍'.repeat(Math.max(0, HP_MAX - h)); el.classList.toggle('low', h <= 1); el.hidden = !(WORLD && WORLD.kind === 'story'); }
function onCrosswalk(x, y){ return ((WORLD && WORLD.crosswalks) || []).some(c => x >= c.x - .05 && x <= c.x + c.w + .05 && y >= c.y - .05 && y <= c.y + c.h + .05); }
/* 차가 다니는 큰길(가로 20~21줄, 세로 28~29칸). 주차장 바닥은 큰길이 아니다 */
function isRoadLane(tx, ty){ if (!WORLD || WORLD.kind !== 'story') return false; const ch = WORLD.tiles[ty] && WORLD.tiles[ty][tx]; return ch === '=' && (ty === 20 || ty === 21 || tx === 28 || tx === 29); }
function hitFlash(){ const el = $('#hitFlash'); if (!el) return; el.classList.add('on'); setTimeout(() => el.classList.remove('on'), 60); }
/* 부딪힌 차의 옆쪽(보도)으로 비켜 세우기 */
function carSafeSpot(c, perp){
  const s = perp >= 0 ? 1 : -1, tryDir = (axis, sg) => {
    for (let k = 1; k <= 7; k++){
      const nx = axis === 'x' ? Math.floor(player.x) : Math.floor(player.x) + sg * k, ny = axis === 'x' ? Math.floor(player.y) + sg * k : Math.floor(player.y);
      if (nx < 0 || ny < 0 || nx >= WORLD.w || ny >= WORLD.h) return null;
      if (!isRoadLane(nx, ny) && !solidAt(nx, ny)) return {x:nx + .5, y:ny + .6};
    }
    return null;
  };
  return tryDir(c.axis, s) || tryDir(c.axis, -s) || tryDir(c.axis === 'x' ? 'y' : 'x', 1) || tryDir(c.axis === 'x' ? 'y' : 'x', -1);
}
function carHitCheck(dt){
  if (!WORLD || WORLD.kind !== 'story') return;
  HP.inv = Math.max(0, HP.inv - dt);
  if (MODE === 'play' && FX3.shk > 0) FX3.shk = Math.max(0, FX3.shk - dt * .8);
  if (MODE !== 'play' || uiBlocking()) return;
  if (hpNow() < HP_MAX){ HP.regen += dt; if (HP.regen >= 40){ HP.regen = 0; SAVE.hp = hpNow() + 1; persist(); updateHpHUD(); toast('❤️ 하나가 다시 찼어요.'); } }
  if (HP.inv > 0) return;
  for (const c of (WORLD.cars || [])){
    if (c.parked) continue;
    const [cx, cy] = carXY(c), px = player.x, py = player.y - .2;
    const along = c.axis === 'x' ? px - cx : py - cy, perp = c.axis === 'x' ? py - cy : px - cx;
    if (Math.abs(along) < .85 && Math.abs(perp) < .5){ carHit(c, perp); return; }
  }
}
function carHit(c, perp){
  const h = Math.max(0, hpNow() - 1); SAVE.hp = h; HP.inv = 2.4; HP.regen = 0; persist(); updateHpHUD();
  const p = carSafeSpot(c, perp); if (p){ player.x = p.x; player.y = p.y; }
  player.moving = false; PATH3.nodes = null; PATH3.goal = null; KEYS.clear(); JOY.x = JOY.y = 0;
  SFX.boom(); fxShake(.35); hitFlash(); if (typeof cam3Snap === 'function' && !G3.ok) clampCam();
  if (h <= 0) return carFaint();
  toast(`빵빵! 차에 부딪혀 ❤️ 하나를 잃었어요 (${h}/${HP_MAX}). 길은 꼭 횡단보도로 건너요!`, 'bad');
}
function carFaint(){
  SAVE.hp = HP_MAX; HP.inv = 3; persist(); updateHpHUD();
  const f = $('#faint'); if (f) f.hidden = false;
  setTimeout(() => {
    placePlayer(51.5, 28.7); if (G3.ok) cam3Snap(); if (f) f.hidden = true;
    showDialog('간호사', ['어머, 정신이 드니? 차에 부딪혀서 병원으로 왔단다. 다행히 크게 다치진 않았어.',
      '길을 건널 때는 꼭 횡단보도로 건너렴. 왼쪽, 오른쪽을 살피고, 차가 멈춘 걸 본 다음에 건너야 해.',
      '❤️를 다시 가득 채워 줬어. 조심해서 다녀!']);
  }, 900);
}

/* ===== 전기차 충전소 프로젝트 ===== */
const EVQ = {miss:0};
const EVOBJ = {type:'evcar', name:'전기차 붙잡기', x:0, y:0};
const EV_FLAGS = [[31, 39, '① 주차장 입구 옆'], [20, 13, '② 연못 옆'], [19, 12, '③ 꽃밭 놀이터 한가운데']];
function evq(){ if (!SAVE.evq || typeof SAVE.evq !== 'object') SAVE.evq = {step:0, intro:false, miss:0}; return SAVE.evq; }
const evCar = () => ((WORLD && WORLD.cars) || []).find(c => c.quest);
const evOn = () => !!(WORLD && WORLD.kind === 'story' && typeof actReached === 'function' && actReached('a6'));
/* 붙잡기: 차의 옆이나 뒤에서 가까이 가면 'E · 전기차 붙잡기'가 뜬다 (앞에 서면 부딪힌다!) */
function evNear(near){
  const q = evq(), c = evCar();
  if (!evOn() || q.step !== 0 || !c || c.parked || MODE !== 'play') return near;
  const [cx, cy] = carXY(c), py = player.y - .2, d = Math.hypot(cx - player.x, cy - py);
  const along = c.axis === 'x' ? (player.x - cx) * c.dir : (py - cy) * c.dir;
  if (d < 2.1 && along < .5){
    const nd = near ? Math.hypot(near.x + .5 - player.x, near.y + .5 - player.y) : 9;
    if (d < nd + .4){ EVOBJ.x = cx - .5; EVOBJ.y = cy - .5; return EVOBJ; }
  }
  return near;
}
function evUpdate(){
  if (!WORLD || WORLD.kind !== 'story') return;
  const q = evq();
  if (evOn() && !q.intro && MODE === 'play' && !uiBlocking()){ q.intro = true; persist(); toast('⚡ 새 퀘스트: 도로를 달리는 초록 전기차(⚡)를 붙잡아 운전자 이야기를 들어 봐요! (미션 창에서 길 안내)', 'ok'); }
  const c = evCar();
  if (UI.wpEV && q.step === 0 && c && !c.parked){ const [cx, cy] = carXY(c); UI.waypoint = {x:cx - .5, y:cy - .5, label:'전기차'}; }
}
function evCatch(){
  const c = evCar(); if (!c) return;
  c.hold = true; SFX.ping(); UI.wpEV = false; UI.waypoint = null;
  showDialog('전기차 운전자', [
    '어이쿠, 깜짝이야! 나를 세운 거니? 마침 잘됐다. 배터리가 거의 바닥이라 천천히 달리던 참이었어.',
    '이 차는 기름 대신 전기로 달려. 바퀴를 돌리는 전동기 안에 전자석이 있어서, 전기가 흐르면 자석이 되어 바퀴를 빙글빙글 돌린단다.',
    '그런데 우리 마을엔 충전소가 하나도 없어. 충전하려면 이웃 마을까지 가야 해.',
    {who:'전기차 운전자', text:'마을 남쪽 주차장에 충전소가 생기면 정말 좋을 텐데… 시청 옆에 계신 시장님께 이야기해 줄 수 있겠니?', choices:[
      {label:'네! 제가 시장님을 설득해 볼게요.', next:[{who:'전기차 운전자', text:'고마워! 나는 주차장에서 기다릴게. 시장님은 꼼꼼하셔서 "왜 필요한지"와 "어디에 세울지"를 꼭 물어보실 거야.'}]},
      {label:'전기차가 정말 에너지를 아껴요?', next:[
        {who:'전기차 운전자', text:'그럼! 전기차는 전기 에너지의 대부분을 바퀴를 돌리는 데 써. 기름차는 많은 에너지가 열로 빠져나가지. 그래서 같은 거리를 가는 데 드는 에너지가 훨씬 적어.'},
        {who:'전기차 운전자', text:'시장님께 그 이야기도 꼭 해 주렴! 나는 주차장에서 기다릴게.'}]},
    ]},
  ], () => {
    const q = evq(); q.step = 1; persist(); c.hold = false; evSyncWorld();
    award('eco', 10); SFX.ping();
    UI.waypoint = {x:50, y:18, label:'시장님'};
    toast('⚡ 퀘스트: 시청 옆 시장님을 설득해 주차장에 충전소를 세워요! (노란 화살표)', 'ok');
  });
}
function evAsk(text, opts){
  const qq = {who:'시장님', text, choices:[]};
  qq.choices = mgShuffle(opts).map(op => ({label:op.label, fn:() => { if (op.ok) SFX.ping(); else { EVQ.miss++; SFX.buzz(); } }, next:op.ok ? [{who:'시장님', text:op.reply}] : [{who:'시장님', text:op.reply}, qq]}));
  return qq;
}
function evMayorTalk(){
  const q = evq();
  if (q.step === 0) return showDialog('시장님', ['어서 와요, 꼬마 전기 마스터! 마을을 위한 좋은 생각이 있다면 언제든 이야기해 줘요.', '요즘 도로에서 초록 전기차가 자주 보이던데… 운전자에게 무슨 고민이 있는 것 같더군요.']);
  if (q.step >= 2) return showDialog('시장님', ['주차장 충전소 덕분에 전기차가 늘고 있어요. 에너지도 아끼고, 아이들은 전자석이 실제로 쓰이는 모습을 보며 배우고요. 정말 고마워요!']);
  EVQ.miss = 0;
  showDialog('시장님', [
    '주차장에 전기차 충전소를요? 흠… 충전소를 세우려면 마을 돈이 많이 들어요. 내가 고개를 끄덕일 수 있게 설득해 볼래요?',
    evAsk('먼저, 전기차가 정말 에너지를 아끼나요?', [
      {ok:true, label:'전기차는 전기 에너지 대부분을 바퀴를 돌리는 데 써요. 같은 거리를 가는 데 기름차보다 에너지가 훨씬 적게 들고, 배기가스도 나오지 않아요.', reply:'같은 일을 하면서 에너지를 덜 쓴다… 효율이 높다는 말이군요! 공기도 깨끗해지고요.'},
      {label:'충전소가 생기면 전기를 공짜로 마음껏 쓸 수 있어요.', reply:'공짜라니요? 전기도 요금을 내고 아껴 써야 해요. 에너지를 아끼는 까닭을 다시 말해 볼래요?'},
      {label:'전기차는 조용하고 멋있게 생겼어요.', reply:'멋있는 건 좋지만, 그게 에너지를 아끼는 까닭은 아니에요. 다시 말해 볼래요?'},
    ]),
    evAsk('좋아요. 그런데 전기차가 우리 아이들이 배우는 전자석과 무슨 상관이죠?', [
      {ok:true, label:'바퀴를 돌리는 전동기 안에 전자석이 있어요. 전기가 흐를 때만 자석이 되고, 극의 방향을 바꿔 가며 돌고, 세기를 바꿔 빠르기를 조절해요.', reply:'켜고 끄기, 극의 방향, 세기… 전자석의 세 가지 성질이 다 들어 있군요! 아이들에게 살아 있는 공부가 되겠어요.'},
      {label:'전기차 지붕에 큰 영구 자석이 붙어 있어서 그 힘으로 굴러가요.', reply:'지붕의 자석으로 차가 움직이지는 않아요. 전기가 흐를 때만 자석이 되는 것이 무엇이었죠? 다시 생각해 볼래요?'},
      {label:'전자석이랑은 상관없지만 그냥 빨라서 좋아요.', reply:'상관이 없다면 아이들에게 설명하기 어렵겠네요. 다시 생각해 볼래요?'},
    ]),
    '필요한 까닭은 알겠어요. 그럼 충전소를 어디에 세우면 좋을까요? 마을에 깃발 세 개(①②③)를 꽂아 두었어요.',
    evAsk('어디가 가장 좋을까요? 까닭도 함께 말해 줘요.', [
      {ok:true, label:'① 주차장 입구 옆이요. 차가 드나들기 쉽고, 아이들이 노는 곳과 물에서 떨어져 있어서 안전해요.', reply:'차가 쉽게 오가고, 사람과 물에서 떨어진 곳이라… 안전하고 편리하군요!'},
      {label:'② 연못 옆이요. 시원하고 경치가 좋아요.', reply:'물과 전기가 함께 있으면 감전 위험이 커요! 비가 오면 물에 잠길 수도 있고요. 다른 곳을 골라 볼래요?'},
      {label:'③ 꽃밭 놀이터 한가운데요. 사람이 많아서 눈에 잘 띄어요.', reply:'아이들이 뛰노는 곳에 차가 드나들면 위험해요. 차가 들어오기도 어렵고요. 다른 곳을 골라 볼래요?'},
    ]),
    '설득 완료! 좋아요, 주차장 입구 옆에 전기차 충전소를 세우겠어요. 고마워요, 꼬마 전기 마스터!',
  ], () => evBuild());
}
function evDriverTalk(){
  const q = evq();
  if (q.step >= 2) return showDialog('전기차 운전자', ['충전소 덕분에 배터리가 쑥쑥 차고 있어! 전기가 흐르면 전동기 속 전자석이 바퀴를 돌리고, 나는 이웃 마을까지 기름 한 방울 없이 갈 수 있지.', '네 설득이 마을을 바꿨어. 정말 고마워, 꼬마 전기 마스터!']);
  showDialog('전기차 운전자', ['배터리가 바닥이라 여기서 기다리는 중이야. 시청 옆 시장님을 설득해 줘!', '"왜 필요한지"는 에너지 절약과 전자석으로, "어디에 세울지"는 안전과 편리함으로 말하면 좋을 거야.'], () => { UI.waypoint = {x:50, y:18, label:'시장님'}; });
}
function evBuild(){
  const q = evq(); q.step = 2; q.miss = EVQ.miss; persist();
  evSyncWorld();
  SFX.win(); if (G3.ok) for (let k = 0; k < 5; k++) setTimeout(() => fwBurst3(31 + Math.random() * 4, 3.5 + Math.random() * 2, 40.5 + Math.random() * 1.5), k * 320);
  award('eco', 25); award('em', 15);
  UI.waypoint = {x:31, y:40, label:'충전소'};
  toast(`⚡ 전기차 충전소 완공! 주차장 입구에 충전소가 생겼어요.${EVQ.miss ? '' : ' 한 번에 설득 성공! 🏅'}`, 'ok');
  setTimeout(() => bikeGift(), 900);   /* 시장님의 선물: 전기 자전거 */
  checkMasters();
}
/* 퀘스트 단계에 맞게 마을을 꾸민다 (불러올 때 · 단계가 바뀔 때) */
function evSyncWorld(){
  if (!WORLD || WORLD.kind !== 'story') return;
  const q = evq(), c = evCar();
  WORLD.objects = WORLD.objects.filter(o => !o.ev);
  if (q.step >= 1){
    WORLD.objects.push({type:'npc', id:'evdriver', name:'전기차 운전자', x:34, y:42, look:'driver', ev:true});
    if (c){ Object.assign(c, {parked:true, hold:false, axis:'x', dir:-1, lane:41.45, pos:q.step >= 2 ? 32.9 : 36.9}); }
  }
  if (q.step === 1) EV_FLAGS.forEach(([x, y, label], i) => WORLD.objects.push({type:'deco', kind:'evflag', id:'evflag' + i, n:i, label, x, y, ev:true}));
  if (q.step >= 2) WORLD.objects.push({type:'deco', kind:'charger', id:'evcharger', x:31, y:40, ev:true});
  if (q.step >= 2 && SAVE.bike && SAVE.bike.got) WORLD.objects.push({type:'bikerack', id:'bikerack', x:30, y:40, name:'전기 자전거 거치대', ev:true});
  rebuildSolidMap();
}
function evQuestCard(){
  const q = evq(), canGo = WORLD && WORLD.kind === 'story' && MODE === 'play';
  const steps = ['초록 전기차(⚡)를 따라가 옆이나 뒤에서 붙잡기 (앞에 서면 부딪혀요!)', '시청 옆 시장님 설득하기: 에너지 절약 · 전자석의 실제 예 · 세울 곳', '완공! 주차장 입구의 충전소에서 전기차가 충전해요'];
  return `<h3>⚡ 특별 퀘스트</h3><div class="card" style="display:grid;gap:6px;border-color:${q.step >= 2 ? 'var(--ok)' : 'var(--volt)'}">
    <div class="row" style="justify-content:space-between"><h4 style="margin:0">${q.step >= 2 ? '✅' : '⚡'} 전기차 충전소 프로젝트</h4>${canGo && q.step < 2 ? '<button class="btn small" id="evGo">길 안내</button>' : ''}</div>
    <div style="font-size:14px;color:var(--text-dim);line-height:1.5">마을을 달리는 전기차 운전자의 고민을 듣고, 시장님께 주차장 충전소가 왜 필요한지, 어디에 세울지 설득해요.</div>
    <div style="font-size:13px">${steps.map((s, i) => `${i < q.step ? '✅' : i === q.step ? '👉' : '⬜'} ${s}`).join('<br>')}</div></div>`;
}
function evGuide(){
  const q = evq();
  if (q.step === 0){ UI.wpEV = true; evUpdate(); toast('노란 화살표가 달리는 전기차를 따라가요. 횡단보도로 건너요!'); }
  else if (q.step === 1){ UI.waypoint = {x:50, y:18, label:'시장님'}; toast('노란 화살표를 따라 시청 옆 시장님께 가요!'); }
}
/* 3D 이름표: 달리는 전기차 · 깃발 세 곳 */
function evOverlay3D(){
  if (!WORLD || WORLD.kind !== 'story' || !evOn()) return;
  const q = evq(), c = evCar(), ox = CAM3.tx, oz = CAM3.tz;
  if (c){ const [cx, cy] = carXY(c); if (Math.hypot(cx - ox, cy - oz) < 26){ const p = proj3(cx, 3.2, cy); if (p.ok) drawLabel(p.x, p.y, q.step === 0 ? '⚡ 전기차 — 옆이나 뒤에서 붙잡아요' : q.step === 1 ? '🪫 충전을 기다리는 중' : '⚡ 충전 중'); } }
  if (q.step === 1) for (const [x, y, label] of EV_FLAGS){ if (Math.hypot(x + .5 - ox, y + .5 - oz) > 26) continue; const p = proj3(x + .5, 2.85, y + .5); if (p.ok) drawLabel(p.x, p.y, label); }
}
