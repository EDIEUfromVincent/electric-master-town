/* =========================================================
   7. 이야기 — 점등식 D-5 · 장(章)·컷신·대사·마을 전력·조명·불꽃놀이
   ========================================================= */
const STORYFX = {cam:null, s:.1, sT:0, flash:0, towerOn:false, forceLit:false, fw:[], fw3:[], fwUntil:0, fwT:0, nextFest:6};

/* ===== 장(章) : 차시 구역을 따라 흘러가요 (프롤로그 → 1·2·3차시 구역 → 점등식 → 에필로그) ===== */
function chapters(){
  return [{day:'', title:'프롤로그'}, ...COURSE.zones.map(z => ({day:`${z.no}차시`, title:z.name})), {day:'D-DAY', title:'점등식'}, {day:'', title:'에필로그'}];
}
function currentChapter(){
  if (!Q().met) return 0;
  const n = COURSE.zones.length;
  if (SAVE.story.finale) return n + 2;
  if (actAllDone() && wrapsAllDone()) return n + 1;
  const z = zoneNow(); return z ? z.no : n + 1;
}
function chapterLabel(n){ const C = chapters(), c = C[Math.min(n, C.length - 1)]; return c.day ? `${c.day} · ${c.title}` : c.title; }

/* ===== 마을 전력 안정도 (이야기의 위험 게이지) ===== */
function stability(){
  if (SAVE.story.finale) return 1;
  const q = Q();
  let s = .10;
  s += q.em1 ? .10 : 0;
  s += .10 * Math.min(1, q.dexDone / DEVICES.length);
  s += q.em2 ? .12 : 0;
  s += q.em3 ? .18 : 0;
  s += .12 * Math.min(1, q.judged / SCENES.length);
  s += q.es2 ? .18 : 0;
  s += q.es3 ? .10 : 0;
  return Math.min(.98, s);
}

/* ===== 컷신 데이터 ===== */
const OPENING = {day:'D-5', title:'전기 마스터 타운', sub:'점등식까지 5일', cam:{x:53.5, y:24.5}, slides:[
  {who:'', text:'전기 마스터 타운에는 해마다 가을이면 광장의 큰 전구탑에 불을 켜는 점등식이 열립니다.', cam:{x:53.5, y:24.5}},
  {who:'', text:'그런데 올해는 이상해요. 가로등은 깜빡이고, 고철장은 멈췄고, 집집마다 전기가 줄줄 새고 있어요.', cam:{x:30, y:21}},
  {who:'', text:'마을 발전소의 전기가 바닥나면 점등식은 열리지 못합니다. 남은 시간은 5일.', cam:{x:40, y:6.5}},
  {who:'', text:'그때, 새로운 견습 전기 마스터가 마을에 도착했습니다. 바로 당신이에요.', cam:{x:37.5, y:27}},
]};
function chapterCutscene(n){
  const sub = `마을 전력 ${Math.round(stability() * 100)}%`;
  const C = {
    fin:{day:'D-DAY', title:'점등식', sub:'마을 전력 100%', cam:{x:53.5, y:24}, slides:[
      {who:'', text:'점등식 저녁. 마을 사람들이 광장의 큰 전구탑 앞에 모였어요.'},
      {who:'볼트 박사', text:'발전소 계기판이 안정 구간이에요! 고철장은 필요한 만큼만 전기를 쓰고, 집집마다 위험과 낭비를 줄였고, 안전 로봇이 마을을 순찰하고 있어요.'},
      {who:'무쇠 사장님', text:'자동이도 새 두뇌로 척척이다!'},
      {who:'자동이', text:'삐릭! 틀리면 숨기지 않고 고친다. 사람이 시험해 봐야 안다. 이제 나도 안다!'},
      {who:'안전이', text:'이웃 마을과도 안전 지도를 나눴어요. 우리 마을만 안전하면 안 되니까요!'},
      {who:'', text:'3… 2… 1…', fx:'count'},
      {who:'볼트 박사', text:'점등!', fx:'light'},
      {who:'', text:'전구탑이 환하게 켜지고, 마을 곳곳의 가로등이 한꺼번에 밝아집니다.', fx:'fireworks'},
      {who:'볼트 박사', text:'견습생, 아니 이제는 진짜 전기 마스터예요! AI는 틀릴 수 있어요. 그래서 확인하는 사람이 필요하죠. 마을의 불을 지키는 건 결국 사람의 몫이에요.'},
    ]},
  };
  return C[n];
}
function outroBeat(key){
  const q = Q();
  if (key === 'em1'){
    if (q.em4) return null;
    return {wp:'em4', lines:[
      {who:'볼트 박사', text:'예상하고, 실험하고, 확인했죠? 전자석의 세 가지 성질은 ① 전기가 흐를 때만 자석이 된다 ② 세기를 바꿀 수 있다 ③ 극의 방향을 바꿀 수 있다예요.'},
      {who:'볼트 박사', text:'이제 마을 곳곳의 전자석 기기 10개를 찾아봐요. 가로등을 깜빡이게 하는 범인이 숨어 있을지도 몰라요!'},
    ]};
  }
  if (key === 'es1'){
    if (q.es2) return null;
    return {wp:'es2', lines:[
      {who:'안전이', text:`14개 중 ${q.judgedOk}개를 맞혔어요! 수고했어요.`},
      {who:'안전이', text:'그런데 마을에는 집이 수백 채예요. 사람 혼자서 다 살필 수는 없어요.'},
      {who:'볼트 박사', text:'그래서 AI 안전 로봇이 필요해요! 방금 판단한 장면들이 로봇의 학습 카드가 돼요. 연구소 오른쪽 컴퓨터로 오세요.'},
      {who:'볼트 박사', text:'단, 로봇은 가르친 만큼만 알아요. 틀리면 로봇 탓을 하기 전에 우리가 준 데이터부터 살펴봐요.'},
    ]};
  }
  return null;
}
const OUTRO_KEYS = [];

/* ===== 인물 대사 (이야기 진행에 따라 달라져요) ===== */
function npcLines(id){
  const q = Q(), ch = currentChapter();
  if (id === 'volt'){
    if (SAVE.story.finale) return ['점등식은 대성공이에요! 마을 불빛이 환하죠?', 'AI는 틀릴 수 있어서 사람이 확인해야 한다는 것, 잊지 마요.'];
    return [`찌릿! 마을 전력이 ${Math.round(stability() * 100)}%까지 올라왔어요.`];
  }
  if (id === 'boss'){
    if (!q.em2) return ['고철장에 온 걸 환영한다! 여긴 마을 재활용 공장에 보낼 고철을 모으는 곳이야.', '그런데 큰일이야. 철 말고도 알루미늄 캔, 플라스틱, 종이 상자가 마구 섞여서 공장이 멈췄어!', '크레인 끝의 둥근 판이 전자석이지. 철만 골라 오른쪽 철 고철함에 넣어 줘. 전기를 세게 켜면 마을 불이 더 깜빡이니까 아껴 써야 해!'];
    if (!q.em3) return ['철 고철을 척척 옮겼구나! 공장이 다시 돌고 있다.', '그런데 매번 사람이 크레인을 몰 순 없지. 자동이의 두뇌를 제대로 가르쳐 줘!'];
    return ['자동이가 새 두뇌로 척척 일한다! 가벼운 건 약하게, 무거운 건 세게. 그게 비결이었구나!', '전기도 훨씬 덜 쓰고 있어. 고맙다, 견습생!'];
  }
  if (id === 'auto'){
    if (!q.em3) return ['삐릭! 나는 자동이! 고철장 최고의 자동 크레인 두뇌다!', '내 규칙은 완벽하다! 번쩍이면 철! 크면 무겁다! 틀릴 리 없다!', '…알루미늄 캔이 섞였다고? 그건 캔이 잘못한 거다, 삐릭!'];
    const b = bestTreeTest();
    return [b == null ? '삐릭… 새 두뇌로 처음 보는 고철도 잘 골라낸다고?' : `삐릭… 새 두뇌로 처음 보는 고철을 ${pct(b)}나 맞혔다고?`, '내 규칙이 틀렸다는 걸 인정한다. AI도 틀릴 수 있다!', '틀리면 숨기지 않고 고치면 된다. 그리고 사람이 시험해 봐야 안다. 고맙다, 견습생!'];
  }
  if (id === 'guard'){
    if (!q.es1) return ['안전 지킴이 안전이예요! 손은 물기 없이! 플러그는 머리 잡고!', `해님네, 달님네, 별님네 집 안에 살펴볼 장면이 14개 숨어 있어요. (지금 ${q.judged}/14)`, '느낌표(!)를 찾아 바른 사용 · 위험 · 낭비 중에서 먼저 내 생각으로 판단해 주세요.', '판단한 장면은 AI 안전 로봇의 학습 카드가 돼요.'];
    return [`14개 중 ${q.judgedOk}개를 맞혔어요! 수고했어요.`, '마을에는 집이 수백 채예요. 사람 혼자서 다 살필 수는 없죠. 안전 로봇이 잘 배우도록 도와줘요!'];
  }
  if (id === 'guide'){
    if (!testRevealed()) return ['여기는 AI 안전 로봇의 시험 마을이에요.', '로봇이 한 번도 본 적 없는 집들이라서 실력을 공정하게 시험할 수 있어요.', '집 안 장면은 순찰이 끝난 뒤에 공개돼요. 정답을 미리 보고 외우면 공정한 시험이 아니니까요!'];
    return [`로봇의 최고 정확도는 ${pct(bestRobot())}예요.`, '틀린 장면의 상자를 열어 보세요. 왜 틀렸는지, 어떤 문장을 더 가르치면 좋을지 생각해 봐요.'];
  }
  if (id === 'sun') return q.es1 ? ['고마워요! 이제 안 볼 때는 TV를 꺼요. 낮에는 전등도 꺼요!'] : ['나는 해님이야! 요즘 우리 집 불이 자꾸 깜빡여.', 'TV도 전등도 자주 켜 두는데… 그게 문제일까?'];
  if (id === 'moon') return q.es1 ? ['멀티탭 하나에 여러 개 꽂으면 불이 날 수 있다니! 이제 나눠서 쓸게요.'] : ['나는 달님이야. 우리 집 콘센트에는 플러그가 가득 꽂혀 있어.', '따뜻하고 좋다고 했는데… 혹시 위험한 걸까?'];
  if (id === 'star') return q.es1 ? ['우리 집 방법을 이웃에도 알려 줘야겠다! 안전 지도에 넣어 줄래요?'] : ['나는 별님이야! 우리 집엔 아기 동생이 있어서 콘센트에 덮개를 꽂아 뒀어.', '그런데 다른 집은 어떨까?'];
  return ['안녕하세요!'];
}

/* ===== 진행·대기열 ===== */
function storyInit(){
  const S = SAVE.story; if (S.init) return;
  S.init = true;
  if (SAVE.met.volt){
    const q = Q(); S.openingSeen = true;
    for (const m of MISSIONS) S.done[m.key] = !!q[m.key];
    S.chapter = Math.min(currentChapter(), 5);
  }
  persist();
}
function storyEnqueue(id){ const S = SAVE.story; if (!S.queue.includes(id)) S.queue.push(id); persist(); }
function storySync(){
  const S = SAVE.story; if (!S.init || !SAVE.met.volt) return;
  const q = Q();
  for (const m of MISSIONS){
    if (q[m.key] && !S.done[m.key]){ S.done[m.key] = true; if (OUTRO_KEYS.includes(m.key)) storyEnqueue('out:' + m.key); }
  }
  S.chapter = Math.max(S.chapter || 0, currentChapter());   /* 장이 바뀌는 장면은 구역 문을 지날 때 이름 카드로 보여 준다 */
  if (actAllDone() && wrapsAllDone() && !S.finale && !S.finQ){ S.finQ = true; storyEnqueue('fin'); }   /* 세 차시 정리 회의까지 마쳐야 점등식 */
  persist();
}
function storyPoll(){
  const S = SAVE.story;
  if (!S.queue.length || MODE !== 'play' || !WORLD || uiBlocking() || ROBOT.active) return;
  /* 방 안에서는 활동 정리 대사만, 마을 전체를 비추는 장면(점등식)은 마을로 나왔을 때 */
  let k = 0;
  if (WORLD.kind === 'room'){ k = S.queue.findIndex(id => id.startsWith('act:')); if (k < 0) return; }
  else if (WORLD.kind !== 'story') return;
  const id = S.queue.splice(k, 1)[0]; persist(); runBeat(id);
}
function runBeat(id){
  if (id.startsWith('out:')){
    const b = outroBeat(id.slice(4)); if (!b) return;
    showDialog('', b.lines, () => { const m = MISSIONS.find(x => x.key === b.wp); if (m) setWaypointFor(m); });
    return;
  }
  if (id.startsWith('act:')){ actDoneBeat(id.slice(4)); return; }
  if (id === 'fin'){ const def = chapterCutscene('fin'); if (def) showCutscene(def, () => afterChapter('fin')); }
  /* 예전 기록의 'ch:' 장면은 구역 이름 카드로 바뀌어 건너뛴다 */
}
function afterChapter(n){
  updateHUD();
  if (n !== 'fin') return;
  SAVE.story.finale = true; persist(); updateHUD(); rpgSync();
  toast('점등식 성공! 마을이 환하게 밝아졌어요.', 'ok');
  UI.pending.push(() => finaleInvite());   /* 시장님과 볼트 박사가 시청 기록실에서 배움 기록 문서를 만들어 준다 → 게임 끝 (wrap.js) */
}
function startPrologue(){
  const S = SAVE.story;
  const go = () => showDialog('볼트 박사', LINES.voltIntro, () => {
    SAVE.met.volt = true; S.chapter = Math.max(S.chapter, 1); actState().seen = ACTS.filter(actDone).map(a => a.id); persist();
    updateHUD(); showBanner('D-5', '깜빡이는 마을');
    actWaypoint(); openZoneMap();   /* 볼트 박사의 안내: 차시 구역 고르기 */
  });
  if (!S.openingSeen){ S.openingSeen = true; persist(); showCutscene(OPENING, go); } else go();
}

/* ===== 컷신 화면 (영화 같은 상하 띠 + 타자기 자막) ===== */
function showCutscene(def, onDone){
  const el = $('#cutscene');
  const st = UI.cutscene = {def, i:-1, onDone, typing:null, phase:def.title ? 'card' : 'slides', cardTimer:null};
  KEYS.clear(); JOY.x = JOY.y = 0;
  STORYFX.cam = def.cam ? {x:def.cam.x, y:def.cam.y} : null;
  $('#csWho').textContent = ''; $('#csLine').textContent = '';
  el.hidden = false; document.body.classList.add('cs-on');
  const card = $('#csCard');
  if (def.title){
    card.hidden = false;
    card.querySelector('.cs-day').textContent = def.day || '';
    card.querySelector('.cs-title').textContent = def.title;
    card.querySelector('.cs-sub').textContent = def.sub || '';
    st.cardTimer = setTimeout(() => { if (UI.cutscene === st && st.phase === 'card') csAdvance(); }, 2800);
  } else { card.hidden = true; csNext(); }
}
function csAdvance(){
  const st = UI.cutscene; if (!st) return;
  if (st.phase === 'card'){ clearTimeout(st.cardTimer); $('#csCard').hidden = true; st.phase = 'slides'; csNext(); return; }
  if (st.typing){ csFinishTyping(); return; }
  csNext();
}
function csNext(){
  const st = UI.cutscene; if (!st) return;
  st.i++;
  const s = st.def.slides[st.i];
  if (!s){ csEnd(); return; }
  $('#csWho').textContent = s.who || '';
  if (s.cam) STORYFX.cam = {x:s.cam.x, y:s.cam.y};
  if (s.fx) csFx(s.fx);
  SND.tick();
  csType(s.text);
}
function csType(text){
  const st = UI.cutscene, line = $('#csLine'); let n = 0; line.textContent = '';
  st.typing = {text, timer:setInterval(() => {
    n++; line.textContent = text.slice(0, n);
    if (n >= text.length){ clearInterval(st.typing.timer); st.typing = null; }
  }, 26)};
}
function csFinishTyping(){ const st = UI.cutscene; if (!st || !st.typing) return; clearInterval(st.typing.timer); $('#csLine').textContent = st.typing.text; st.typing = null; }
function csFx(name, quiet){
  if (name === 'count'){ if (!quiet){ SND.beep(440, .12); setTimeout(() => SND.beep(440, .12), 600); setTimeout(() => SND.beep(660, .2), 1200); } }
  if (name === 'light'){ STORYFX.towerOn = true; STORYFX.forceLit = true; STORYFX.flash = 1; if (!quiet) SND.fanfare(); }
  if (name === 'fireworks'){ STORYFX.fwUntil = TIME + 9; }
}
function csEnd(){
  const st = UI.cutscene; if (!st) return;
  clearTimeout(st.cardTimer); if (st.typing) clearInterval(st.typing.timer);
  $('#cutscene').hidden = true; UI.cutscene = null; STORYFX.cam = null; document.body.classList.remove('cs-on');
  if (st.onDone) st.onDone();
  runPending();
}
function csSkip(){
  const st = UI.cutscene; if (!st) return;
  for (let k = st.i + 1; k < st.def.slides.length; k++){ const s = st.def.slides[k]; if (s && s.fx) csFx(s.fx, true); }
  csEnd();
}
let bannerT = null;
function showBanner(day, title){
  const b = $('#banner'); b.querySelector('.b-day').textContent = day; b.querySelector('.b-title').textContent = title;
  b.hidden = false; b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  clearTimeout(bannerT); bannerT = setTimeout(() => { b.hidden = true; }, 4200);
}

/* ===== 조명 : 마을 전력이 오를수록 가로등이 하나씩 켜져요 ===== */
function lampLevel(o, t, fin){
  if (fin) return 1;
  const s = STORYFX.s; if (s < o.thr) return 0;
  if (s - o.thr < .06) return hash2(Math.floor(t * 9), o.x * 5 + o.y, 11) > .38 ? 1 : .12;
  return 1;
}
function townFlicker(t, s){
  if (SAVE.story.finale || STORYFX.forceLit || s > .72) return 0;
  const ph = t % 19;
  return (ph > 17.6 && ph < 18.4 && Math.sin(t * 66) > 0) ? (1 - s) : 0;
}
const DARK = {c:null, g:null};
function drawTownLight(camPX, camPY, S, t){
  if (!WORLD || WORLD.kind !== 'story') return;
  const F = STORYFX, fin = SAVE.story.finale || F.forceLit, s = F.s;
  let alpha = fin ? .32 : lerp(.58, .03, clamp((s - .1) / .8, 0, 1));
  alpha = clamp(alpha + townFlicker(t, s) * .24, 0, .7);
  if (alpha < .02 && F.flash <= 0) return;
  if (!DARK.c || DARK.c.width !== CW || DARK.c.height !== CH){ DARK.c = mkCanvas(CW, CH); DARK.g = DARK.c.getContext('2d'); }
  const g = DARK.g;
  g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, CW, CH);
  g.fillStyle = `rgba(4,9,26,${alpha})`; g.fillRect(0, 0, CW, CH);
  g.globalCompositeOperation = 'destination-out';
  const punch = (x, y, r, a) => {
    const gr = g.createRadialGradient(x, y, r * .1, x, y, r);
    gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(.6, `rgba(0,0,0,${a * .55})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const lamps = WORLD._lamps || (WORLD._lamps = WORLD.objects.filter(o => o.kind === 'lamp'));
  const lit = [];
  for (const o of lamps){
    const k = lampLevel(o, t, fin); if (k <= 0) continue;
    const x = (o.x + .5) * S - camPX, y = (o.y - .35) * S - camPY;
    if (x < -S * 5 || x > CW + S * 5 || y < -S * 5 || y > CH + S * 5) continue;
    punch(x, y, S * 3.6, .92 * k); lit.push([x, y, k]);
  }
  if (MODE !== 'title') punch(player.x * S - camPX, (player.y - .6) * S - camPY, S * 3.8, .92);
  if (ROBOT.active) punch(ROBOT.x * S - camPX, (ROBOT.y - .6) * S - camPY, S * 4, .9);
  const tw = WORLD._tower || (WORLD._tower = WORLD.objects.find(o => o.kind === 'tower'));
  let tx = 0, ty = 0; const tOn = !!tw && (fin || F.towerOn);
  if (tw){ tx = (tw.x + .5) * S - camPX; ty = (tw.y + .85 - 2.55) * S - camPY; punch(tx, ty, S * (tOn ? 9 : 2.4), tOn ? 1 : .55); }
  ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.drawImage(DARK.c, 0, 0, CW, CH);
  ctx.globalCompositeOperation = 'lighter';
  for (const [x, y, k] of lit){
    const gr = ctx.createRadialGradient(x, y, 0, x, y, S * 2.6);
    gr.addColorStop(0, `rgba(255,205,120,${.24 * k})`); gr.addColorStop(1, 'rgba(255,205,120,0)');
    ctx.fillStyle = gr; ctx.fillRect(x - S * 2.6, y - S * 2.6, S * 5.2, S * 5.2);
  }
  if (tOn){
    const gr = ctx.createRadialGradient(tx, ty, 0, tx, ty, S * 4.5);
    gr.addColorStop(0, 'rgba(255,235,170,.4)'); gr.addColorStop(1, 'rgba(255,235,170,0)');
    ctx.fillStyle = gr; ctx.fillRect(tx - S * 4.5, ty - S * 4.5, S * 9, S * 9);
  }
  if (F.flash > 0){ ctx.fillStyle = `rgba(255,250,225,${F.flash * .4})`; ctx.fillRect(0, 0, CW, CH); }
  ctx.restore();
}

/* ===== 불꽃놀이 ===== */
const FW_COLORS = ['255,210,63', '255,120,90', '120,220,255', '170,255,170', '255,160,230'];
function fwBurst(x, y){
  const c = FW_COLORS[(Math.random() * FW_COLORS.length) | 0], n = 26, r0 = Math.random() * 6;
  for (let k = 0; k < n; k++){
    const a = Math.PI * 2 * k / n + r0, sp = 2.2 + Math.random() * 2.2;
    STORYFX.fw.push({x, y, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp, life:1.2 + Math.random() * .5, max:1.6, c});
  }
}
function updateStoryFx(dt){
  const F = STORYFX;
  F.sT -= dt;
  if (F.sT <= 0){ F.sT = .25; F.s = MODE === 'title' ? (SAVE.story.finale ? 1 : .22) : stability(); }
  if (F.flash > 0) F.flash = Math.max(0, F.flash - dt * .8);
  if (TIME < F.fwUntil){
    F.fwT -= dt;
    if (F.fwT <= 0){
      F.fwT = .3 + Math.random() * .35;
      if (G3.ok) fwBurst3(53.5 + (Math.random() - .5) * 11, 12.5 + Math.random() * 5, 25.5 + (Math.random() - .5) * 7);
      else fwBurst(53.5 + (Math.random() - .5) * 11, 18.6 + Math.random() * 3.4);
    }
  } else if (SAVE.story.finale && WORLD && WORLD.kind === 'story' && MODE !== 'editor' && TIME > F.nextFest){
    F.fwUntil = TIME + 2; F.nextFest = TIME + 14 + Math.random() * 8;
  }
  if (F.fw.length){
    for (const p of F.fw){ p.vy += 3.4 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    F.fw = F.fw.filter(p => p.life > 0);
  }
  if (G3.ok) updateFw3(dt);
}
function drawFireworks(S){
  const F = STORYFX; if (!F.fw.length || !WORLD || WORLD.kind !== 'story') return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const p of F.fw){
    const a = clamp(p.life / p.max, 0, 1), sz = S * .14 * (.6 + a);
    ctx.fillStyle = `rgba(${p.c},${a})`; ctx.fillRect(p.x * S - sz / 2, p.y * S - sz / 2, sz, sz);
  }
  ctx.restore();
}

/* ===== 가로등·전구탑 그리기 ===== */
function drawLamp(o, cx, S, t){
  const base = (o.y + .92) * S, top = (o.y - .55) * S;
  drawShadow(cx, base - S * .04, S, .2);
  ctx.fillStyle = '#39424e'; ctx.fillRect(cx - S * .05, top, S * .1, base - top);
  ctx.fillStyle = '#2b323b'; ctx.fillRect(cx - S * .16, base - S * .1, S * .32, S * .1);
  ctx.fillStyle = '#39424e'; ctx.fillRect(cx - S * .05, top, S * .3, S * .07);
  const on = lampLevel(o, t, SAVE.story.finale || STORYFX.forceLit) > .5;
  ctx.fillStyle = on ? '#fff0b8' : '#7b8590'; rr(ctx, cx + S * .1, top + S * .06, S * .2, S * .12, 3); ctx.fill();
}
function drawTower(o, cx, S, t){
  const base = (o.y + .85) * S, h = 2.55 * S, top = base - h, on = SAVE.story.finale || STORYFX.towerOn;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, base, S * .5, S * .16, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#8a8f98'; ctx.fillRect(cx - S * .42, base - S * .32, S * .84, S * .32);
  ctx.fillStyle = '#6f757e'; ctx.fillRect(cx - S * .42, base - S * .32, S * .84, S * .07);
  ctx.strokeStyle = '#39424e'; ctx.lineWidth = Math.max(2, S * .06); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - S * .26, base - S * .32); ctx.lineTo(cx - S * .1, top + S * .3); ctx.moveTo(cx + S * .26, base - S * .32); ctx.lineTo(cx + S * .1, top + S * .3); ctx.stroke();
  ctx.lineWidth = Math.max(1, S * .035);
  const span = h - S * .62;
  for (let k = 0; k < 5; k++){
    const yy = base - S * .32 - k * span / 5, w = lerp(.25, .11, k / 5) * S;
    ctx.beginPath(); ctx.moveTo(cx - w, yy); ctx.lineTo(cx + w, yy - span / 5); ctx.moveTo(cx + w, yy); ctx.lineTo(cx - w, yy - span / 5); ctx.stroke();
  }
  const cy = top + S * .02, r = S * .34;
  const blink = STORYFX.s > .85 && Math.sin(t * 5) > 0;
  ctx.fillStyle = on ? '#fff3b8' : (blink ? '#c9b46a' : '#8a8f98');
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
  ctx.strokeStyle = '#39424e'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#39424e'; ctx.fillRect(cx - S * .14, cy + r - 2, S * .28, S * .1);
  ctx.fillStyle = on ? '#e2782b' : '#5d646e';
  ctx.beginPath(); ctx.moveTo(cx + S * .04, cy - S * .2); ctx.lineTo(cx - S * .1, cy + S * .03); ctx.lineTo(cx - S * .01, cy + S * .03); ctx.lineTo(cx - S * .05, cy + S * .2); ctx.lineTo(cx + S * .11, cy - S * .05); ctx.lineTo(cx + S * .02, cy - S * .05); ctx.closePath(); ctx.fill();
}
