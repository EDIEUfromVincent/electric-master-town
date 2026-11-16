/* =========================================================
   3. 저장·미션·화면 UI·상호작용
   ========================================================= */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const IS_TOUCH = ('ontouchstart' in window) || !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);

/* ----- 저장 (이 기기 브라우저) ----- */
const SAVE_KEY = 'emt.save.v1';
const DEFAULT_SAVE = () => ({met:{}, exp:{}, badges:{}, dex:{}, judged:{}, tree:null, treeRuns:[], treeNote:'',
  train:{good:[], danger:[], waste:[]}, model:null, robotRuns:[], lastTest:{}, robotNote:'', crane:{},
  pos:null, nickname:'', sound:true, maps:[], rpg:null, hp:5, evq:null, mg:{}, notes:{}, works:[], mgTree:null, mgTree1:null, mgTreeDraft:null,
  story:{init:false, openingSeen:false, chapter:0, done:{}, queue:[], finale:false}});
let SAVE = DEFAULT_SAVE();
function loadSave(){
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && typeof s === 'object') SAVE = Object.assign(DEFAULT_SAVE(), s); } catch (e) {}
  for (const k of LABEL_KEYS) if (!Array.isArray(SAVE.train[k])) SAVE.train[k] = [];
  SAVE.story = Object.assign({init:false, openingSeen:false, chapter:0, done:{}, queue:[], finale:false}, SAVE.story || {});
  if (!Array.isArray(SAVE.story.queue)) SAVE.story.queue = [];
  if (!SAVE.story.done || typeof SAVE.story.done !== 'object') SAVE.story.done = {};
  rpgNormalize();
}
let saveTimer = null;
function persist(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {} }, 120);
}

/* ----- 소리 ----- */
const SND = {
  ac:null,
  beep(f, d = .08, type = 'square', v = .045){
    if (!SAVE.sound) return;
    try {
      this.ac = this.ac || new (window.AudioContext || window.webkitAudioContext)();
      const ac = this.ac, o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
      o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + .02);
    } catch (e) {}
  },
  tick(){ this.beep(880, .04, 'square', .03); },
  ok(){ this.beep(660, .09); setTimeout(() => this.beep(990, .14), 90); },
  bad(){ this.beep(170, .22, 'sawtooth', .04); },
  fanfare(){ [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.beep(f, .16, 'square', .05), i * 120)); },
};

/* ----- 미션 ----- */
const MISSIONS = [
  {key:'em1', group:'em', game:'mag', title:'전자석 실험실', where:{x:52, y:5}, whereText:'공장 지대 · 전자석 실험실',
   desc:'🧲 전자석 실험 게임 3단계(켜고 끄기 · 세기 · 극의 방향)를 모두 깨서 전자석의 세 가지 성질을 확인해요.'},
  {key:'em4', group:'em', game:'detect', title:'전자석 도감', where:'dex', whereText:'마을 곳곳 (? 표시) · 광장 🔍 게임기',
   desc:'마을 곳곳의 기기 10개를 찾아 전자석의 어떤 성질을 이용하는지 판단해요. 🔍 전자석 탐정 2단계를 깨도 돼요.'},
  {key:'em2', group:'em', game:'crane', title:'고철장 크레인 조종', where:{x:40, y:5}, whereText:'공장 지대 · 고철장 조종석',
   desc:'크레인을 직접 조종해 철 고철만 고철함에 옮겨요. 전기는 아껴서!'},
  {key:'em3', group:'em', game:'slide', title:'AI 크레인 두뇌', where:{x:34, y:26}, whereText:'AI 연구소 · 왼쪽 컴퓨터',
   desc:'🛝 질문 미끄럼틀에서 예/아니요 질문 길을 만들고 새 고철 트럭으로 시험해요. (새 고철 8개 중 7개 이상)'},
  {key:'es1', group:'es', game:'home', title:'안전 마을 점검', where:'scene', whereText:'안전 마을 집 3채 (! 표시) · 🏠 게임기',
   desc:'세 집 안의 장면 14개를 바른 사용·위험·낭비로 판단해요. 🏠 우리 집 안전 탐정 2단계를 깨도 돼요.'},
  {key:'es2', group:'es', game:'robot', title:'AI 안전 로봇', where:{x:41, y:26}, whereText:'AI 연구소 · 오른쪽 컴퓨터',
   desc:'🤖 로봇 훈련소 3단계(라벨 붙이기 → 데이터 고르기 → 시험하고 고치기)를 깨요. 예시 문장을 직접 써서 가르치고 시험 마을을 순찰시켜도 돼요(정확도 70% 이상).'},
  {key:'es3', group:'es', game:'campaign', title:'우리 동네 맵', where:{x:39, y:33}, whereText:'광장 · 맵 만들기 공방',
   desc:'맵 만들기에서 상황 카드 3개 이상이 있는 맵을 짓고 로봇을 순찰시켜요. 📣 전기 안전 캠페인 2단계(수칙 카드 · 3컷 대본)를 깨도 돼요.'},
];
function Q(){
  const dexDone = DEVICES.filter(d => SAVE.dex[d.id] && SAVE.dex[d.id].done).length;
  const judged = SCENES.filter(s => SAVE.judged[s.id]).length;
  const judgedOk = SCENES.filter(s => SAVE.judged[s.id] && SAVE.judged[s.id].correct).length;
  let mf = {}; try { mf = mgMissionFlags(); } catch (e) {}   /* 교재 활동 미니 게임으로도 같은 미션을 해낼 수 있다 */
  return {met:!!SAVE.met.volt, em1:!!SAVE.badges.em1, em2:!!SAVE.badges.em2, em3:!!SAVE.badges.em3,
    em4:dexDone >= DEVICES.length || !!mf.em4, dexDone, es1:judged >= SCENES.length || !!mf.es1, judged, judgedOk,
    es2:!!SAVE.badges.es2 || !!mf.es2, es3:!!SAVE.badges.es3 || !!mf.es3};
}
function masterCounts(){ const q = Q(); return {em:[q.em1, q.em2, q.em3, q.em4].filter(Boolean).length, es:[q.es1, q.es2, q.es3].filter(Boolean).length}; }
function nextMission(){ const q = Q(); if (!q.met) return null; for (const m of MISSIONS) if (!q[m.key]) return m; return 'done'; }
function missionTarget(m){
  if (!m || m === 'done') return null;
  const near = list => { let best = null, bd = 1e9; for (const o of list){ const d = (o.x - player.x) ** 2 + (o.y - player.y) ** 2; if (d < bd){ bd = d; best = o; } } return best; };
  if (m.where === 'dex') return near(DEVICES.filter(d => !(SAVE.dex[d.id] && SAVE.dex[d.id].done)));
  if (m.where === 'scene') return near(SCENES.filter(s => !SAVE.judged[s.id]));
  return m.where;
}
function setWaypointFor(m){
  const t = missionTarget(m);
  UI.waypoint = t ? {x:t.x, y:t.y, label:m.title} : null;
}
function objectiveHTML(){
  const q = Q();
  if (!q.met) return '<b>프롤로그</b> AI 연구소의 볼트 박사와 이야기하기';
  const m = nextMission();
  if (m === 'done') return SAVE.story.finale
    ? '<b>점등식 성공!</b> 마을의 불이 환하게 켜졌어요. 이웃 마을의 안전 지도(친구 맵 코드)로 내 로봇을 시험해 봐도 좋아요.'
    : '<b>D-DAY · 점등식</b> 모든 준비가 끝났어요. 곧 점등식이 시작돼요.';
  const extra = m.key === 'em4' ? ` (${q.dexDone}/10)` : m.key === 'es1' ? ` (${q.judged}/14)` : '';
  return `<b>${esc(chapterLabel(currentChapter()))}</b> ${m.title}${extra} · ${m.whereText}`;
}
function checkMasters(){
  rpgSync();
  storySync();
  const c = masterCounts();
  if (c.em === 4 && !SAVE.badges.emMaster){
    SAVE.badges.emMaster = true; persist();
    celebrate('전자석 마스터', '🧲', '전자석의 세 가지 성질을 실험하고, 생활 속 기기를 조사하고, 크레인을 조종하고, AI 크레인 두뇌까지 만들었어요!');
  }
  if (c.es === 3 && !SAVE.badges.esMaster){
    SAVE.badges.esMaster = true; persist();
    celebrate('전기 안전 마스터', '⚡', '집 안의 위험과 낭비를 찾아내고, AI 안전 로봇을 학습시키고, 우리 동네 맵에서 로봇을 시험했어요!');
  }
  updateHUD();
}

/* ----- 패널·대화·알림 ----- */
const UI = {modal:false, dialog:null, cutscene:null, waypoint:null, panelClose:null, pending:[]};
function uiBlocking(){ return UI.modal || !!UI.dialog || !!UI.cutscene || !!UI.mg; }
function openPanel(html, opts = {}){
  const m = $('#modal'), p = $('#panel');
  if (UI.modal && UI.panelClose){ const f = UI.panelClose; UI.panelClose = null; f(); }
  p.className = 'panel' + (opts.wide ? ' wide' : '');
  p.innerHTML = `<button class="xbtn" aria-label="닫기" data-close>×</button>` + html;
  m.hidden = false; UI.modal = true; UI.panelClose = opts.onClose || null; p.scrollTop = 0;
  KEYS.clear(); JOY.x = JOY.y = 0;
  return p;
}
function closePanel(){
  const m = $('#modal'); if (m.hidden) return;
  m.hidden = true; UI.modal = false;
  const f = UI.panelClose; UI.panelClose = null;
  $('#panel').innerHTML = '';
  if (f) f();
  runPending();
}
function runPending(){ if (!UI.modal && !UI.dialog && !UI.cutscene && !UI.mg && UI.pending.length) UI.pending.shift()(); }
/* lines: 글자 또는 {who, text}. 말하는 사람이 바뀌는 대화도 돼요. */
function dlgShow(i){
  const D = UI.dialog, L = D.lines[i], d = $('#dialog');
  d.querySelector('.who').textContent = typeof L === 'object' ? L.who : D.who;
  d.querySelector('.line').textContent = typeof L === 'object' ? L.text : L;
  /* 고르는 대화: 버튼(또는 숫자 키)으로 하나를 고르면 그 대답이 이어진다 */
  const box = $('#dlgChoices'), ch = L && typeof L === 'object' && L.choices;
  D.wait = !!ch; box.hidden = !ch; $('#dlgNext').hidden = !!ch;
  box.innerHTML = ch ? ch.map((c, k) => `<button class="btn" data-k="${k}">${k + 1}. ${esc(c.label)}</button>`).join('') : '';
  if (ch) box.querySelectorAll('[data-k]').forEach(b => b.onclick = e => { e.stopPropagation(); pickChoice(+b.dataset.k); });
}
function pickChoice(k){
  const D = UI.dialog; if (!D || !D.wait) return;
  const c = D.lines[D.i].choices[k]; if (!c) return;
  D.wait = false; SND.tick();
  if (c.next) D.lines.splice(D.i + 1, 0, ...c.next);
  if (c.fn) c.fn();
  advanceDialog();
}
function showDialog(who, lines, onDone){
  UI.dialog = {who, lines, i:0, onDone};
  $('#dialog').hidden = false; dlgShow(0);
  KEYS.clear(); JOY.x = JOY.y = 0;
}
function advanceDialog(){
  const D = UI.dialog; if (!D || D.wait) return;
  D.i++;
  if (D.i >= D.lines.length){ $('#dialog').hidden = true; UI.dialog = null; if (D.onDone) D.onDone(); runPending(); return; }
  dlgShow(D.i); SND.tick();
}
let toastT = null;
function toast(msg, kind = ''){
  const t = $('#toast'); t.textContent = msg; t.className = kind; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2800);
}
function celebrate(title, icon, text){
  const run = () => {
    SND.fanfare();
    openPanel(`<div style="text-align:center;display:grid;gap:12px;justify-items:center;padding:8px 0">
      <div style="font-size:84px;line-height:1">${icon}</div><h2 style="margin:0">${title} 달성!</h2>
      <p style="max-width:460px;margin:0">${text}</p><button class="btn primary" data-close>계속하기</button></div>`);
  };
  if (uiBlocking()) UI.pending.push(run); else run();
}
function updateHUD(){
  updateHpHUD();
  const c = masterCounts();
  $('#pillEM').innerHTML = `🧲 전자석 마스터 <b>${c.em}/4</b>`; $('#pillEM').classList.toggle('done', c.em === 4);
  $('#pillES').innerHTML = `⚡ 전기 안전 마스터 <b>${c.es}/3</b>`; $('#pillES').classList.toggle('done', c.es === 3);
  $('#objective').innerHTML = WORLD && WORLD.kind === 'custom' ? `<b>친구 맵</b> ${esc(WORLD.title)} · 상황 카드와 기기를 찾아 판단해요` : objectiveHTML();
  const pw = Math.round(stability() * 100), pp = $('#pillPower');
  pp.innerHTML = `💡 마을 전력 <b>${pw}%</b>`; pp.style.setProperty('--p', pw + '%');
  pp.classList.toggle('low', pw < 35); pp.classList.toggle('full', pw >= 100);
  STORYFX.s = MODE === 'title' ? STORYFX.s : stability();
}
function showHUD(on){
  $('#hud').hidden = !on; $('#touch').hidden = !(on && IS_TOUCH);
  $('#objective').hidden = false;
}

/* ----- 화면 전환 ----- */
function ensureStoryWorld(){ if (!WORLD || WORLD.kind !== 'story') loadWorld(buildStoryWorld()); }
function showTitle(){
  closePanelSilently(); $('#dialog').hidden = true; UI.dialog = null;
  if (UI.cutscene){ $('#cutscene').hidden = true; UI.cutscene = null; STORYFX.cam = null; document.body.classList.remove('cs-on'); }
  storyInit();
  ensureStoryWorld(); MODE = 'title'; STORYFX.s = SAVE.story.finale ? 1 : .22;
  $('#title').hidden = false; $('#editor').hidden = true; showHUD(false);
  $('#patrolBar').hidden = true; $('#customBar').hidden = true;
  const c = masterCounts();
  $('#titleBadges').innerHTML = `<span class="pill ${c.em === 4 ? 'done' : ''}">🧲 전자석 마스터 <b>${c.em}/4</b></span><span class="pill ${c.es === 3 ? 'done' : ''}">⚡ 전기 안전 마스터 <b>${c.es}/3</b></span>`;
  const chN = currentChapter();
  $('#mStartSub').textContent = !SAVE.met.volt ? '처음 시작' : chN >= 7 ? '점등식 성공 · 이어하기' : `이어하기 · ${chapterLabel(chN)}`;
  $('#storyTeaser').textContent = chN >= 7 ? '점등식 성공! 마을이 환하게 밝아졌어요.' : !SAVE.met.volt ? '점등식까지 D-5 · 깜빡이는 마을의 불을 지켜라' : `${chapterLabel(chN)} · 마을 전력 ${Math.round(stability() * 100)}%`;
  $('#mSound').textContent = SAVE.sound ? '소리 켜짐' : '소리 꺼짐';
}
function closePanelSilently(){ $('#modal').hidden = true; UI.modal = false; UI.panelClose = null; $('#panel').innerHTML = ''; }
function enterStory(){
  $('#title').hidden = true; $('#editor').hidden = true;
  ensureStoryWorld(); MODE = 'play'; showHUD(true);
  $('#customBar').hidden = true; $('#patrolBar').hidden = true;
  const sp = SAVE.pos || WORLD.spawn; placePlayer(sp.x, sp.y); clampCam();
  storyInit(); storySync(); updateHUD();
  if (!SAVE.met.volt) setTimeout(() => { if (MODE === 'play' && !uiBlocking()) startPrologue(); }, 500);
}

/* ----- 상호작용 ----- */
function onAction(){
  if (UI.cutscene){ csAdvance(); return; }
  if (UI.dialog){ advanceDialog(); return; }
  if (UI.modal || MODE !== 'play' || !NEAR) return;
  interact(NEAR);
}
function interact(o){
  SND.tick();
  if (o.type === 'evcar') return evCatch();
  if (o.type === 'walker') return talkWalker(o);
  if (WORLD.kind === 'custom') return interactCustom(o);
  if (o.type === 'npc') return talkNPC(o);
  if (o.type === 'sign') return showDialog('표지판', [o.text]);
  if (o.type === 'device'){
    const dev = DEVICES.find(d => d.id === o.dev);
    return openDeviceQuiz(dev, () => { SAVE.dex[dev.id] = {done:true}; persist(); updateHUD(); checkMasters(); if (Q().em4) toast('전자석 도감 완성!', 'ok'); }, SAVE.dex[dev.id] && SAVE.dex[dev.id].done);
  }
  if (o.type === 'scene'){
    const sc = SCENES.find(s => s.id === o.id);
    return openSceneJudge(sc, choice => {
      SAVE.judged[sc.id] = {choice, correct:choice === sc.label}; persist(); updateHUD(); checkMasters();
      const q = Q(); if (q.es1) toast(`안전 마을 점검 완료! 14개 중 ${q.judgedOk}개를 맞혔어요.`, 'ok');
    }, SAVE.judged[sc.id], true);
  }
  if (o.type === 'test') return openTestInfo(TEST_SCENES.find(t => t.id === o.id));
  if (o.type === 'mission') return openMission(o.act);
}
function talkNPC(o){
  if (!o) return;
  if (o.id === 'volt' && !SAVE.met.volt) return startPrologue();
  SAVE.met[o.id] = true; persist();
  if (o.id === 'mayor') return evMayorTalk();
  if (o.id === 'evdriver') return evDriverTalk();
  const lines = npcLines(o.id);
  showDialog(o.name, lines, () => {
    if (o.id === 'volt'){ const m = nextMission(); if (m && m !== 'done') setWaypointFor(m); }
    updateHUD();
  });
}
function openMission(act){
  if (act === 'exp') return mgOpenGame('mag');
  if (act === 'crane') return openCraneMenu();
  if (act === 'tree') return mgOpenGame('slide');
  if (act === 'nb') return mgOpenGame('robot');
  if (act === 'editor') return enterEditor();
  if (act === 'g_detect') return mgOpenGame('detect');
  if (act === 'g_home') return mgOpenGame('home');
}
function openDeviceQuiz(dev, onSolved, solved){
  const p = openPanel(`<div class="dev-head">${devIconHTML(dev.icon)}<div><h2>${esc(dev.name)}</h2><div class="sub" style="margin:0">전자석 도감</div></div></div>
    <h3>이 기기는 전자석의 어떤 성질을 이용할까요?</h3>
    <div class="choice-grid">${Object.entries(PROPS).map(([k, v]) => `<button class="btn choice" data-p="${k}"><span>${v.short}<br><small style="font-family:var(--font-body);font-size:13px">${v.text}</small></span></button>`).join('')}</div>
    <div id="dqRes" style="margin-top:12px"></div>`);
  const res = p.querySelector('#dqRes'), btns = p.querySelectorAll('[data-p]');
  const win = () => {
    btns.forEach(x => { x.disabled = true; if ((dev.props || []).includes(x.dataset.p)) x.classList.add('on'); });
    res.innerHTML = `<div class="okbox"><b>맞아요!</b> ${esc(dev.desc || '')}<br><small>이 기기가 이용하는 성질: ${(dev.props || []).map(x => PROPS[x].short).join(', ')}</small></div>`;
  };
  if (solved){ win(); return; }
  btns.forEach(b => b.onclick = () => {
    if ((dev.props || []).includes(b.dataset.p)){ SND.ok(); win(); if (onSolved) onSolved(); }
    else { SND.bad(); b.disabled = true; res.innerHTML = `<div class="warnbox"><b>다시 생각해 봐요.</b> 이 기기는 무엇을 하나요? 무언가를 세게·약하게 <b>조절</b>하나요, 켰다 껐다 하며 <b>붙였다 떼나요</b>, 도는 <b>방향</b>을 바꾸나요?</div>`; }
  });
}
function openSceneJudge(sc, onJudged, prev, isStory){
  const p = openPanel(`<h2>살펴볼 장면</h2>
    <div class="scene-card"><div class="ico">${esc(sc.icon || '❓')}</div><div class="txt">${esc(sc.text)}</div></div>
    <h3>이 장면은 어떤가요? 먼저 내 생각으로 골라요.</h3>
    <div class="choice-grid">${LABEL_KEYS.map(k => `<button class="btn choice ${k}" data-l="${k}">${LABELS[k].icon} ${LABELS[k].name}</button>`).join('')}</div>
    <div id="sjRes" style="margin-top:12px"></div>`);
  const res = p.querySelector('#sjRes'), btns = p.querySelectorAll('[data-l]');
  const show = choice => {
    const ok = choice === sc.label;
    btns.forEach(b => { b.disabled = true; if (b.dataset.l === sc.label) b.classList.add('on'); });
    res.innerHTML = `<div class="${ok ? 'okbox' : 'warnbox'}"><b>${ok ? '내 판단이 맞았어요!' : `정답은 '${LABELS[sc.label].name}'이에요.`}</b> ${esc(sc.why || '')}</div>`
      + (prev ? `<p class="sub" style="margin-top:8px">내가 처음 고른 답: ${LABELS[prev.choice].name}</p>` : '')
      + (isStory ? `<p class="sub" style="margin-top:8px">이 장면 문장은 AI 안전 로봇 컴퓨터에서 학습 카드로 쓸 수 있어요.</p>` : '');
  };
  if (prev){ show(prev.choice); return; }
  btns.forEach(b => b.onclick = () => { const c = b.dataset.l; c === sc.label ? SND.ok() : SND.bad(); if (onJudged) onJudged(c); show(c); });
}
function openTestInfo(t){
  if (!testRevealed()) return showDialog('시험 장면', ['상자 속 장면은 AI 안전 로봇이 순찰을 마친 뒤에 공개돼요.', 'AI 연구소 오른쪽 컴퓨터에서 로봇을 학습시키고 순찰을 보내 보세요.']);
  const pred = SAVE.lastTest[t.id];
  openPanel(`<h2>시험 장면</h2>
    <div class="scene-card"><div class="ico">${esc(t.icon)}</div><div class="txt">${esc(t.text)}</div></div>
    <div class="grid2" style="margin-top:12px">
      <div class="card"><h4>로봇의 판단 (최근 순찰)</h4>${pred ? `<span class="chip ${pred}">${LABELS[pred].icon} ${LABELS[pred].name}</span>` : '기록 없음'}</div>
      <div class="card"><h4>정답</h4><span class="chip ${t.label}">${LABELS[t.label].icon} ${LABELS[t.label].name}</span><p style="margin:8px 0 0;font-size:14px">${esc(t.why)}</p></div>
    </div>
    <p class="note" style="margin-top:12px">로봇이 틀렸다면, 어떤 학습 문장이 더 있었으면 좋았을까요? 이 문장을 그대로 베끼지 말고 <b>내 말로</b> 비슷한 상황을 써 보세요.</p>`);
}

/* ----- 미션·연구소·메뉴 패널 ----- */
function openQuests(){
  const q = Q();
  const row = m => {
    const done = q[m.key];
    const prog = m.key === 'em4' ? ` · ${q.dexDone}/10` : m.key === 'es1' ? ` · ${q.judged}/14 (맞힘 ${q.judgedOk})` : '';
    const canGo = !done && WORLD && WORLD.kind === 'story' && MODE === 'play';
    return `<div class="card" style="display:grid;gap:6px;border-color:${done ? 'var(--ok)' : 'var(--line)'}">
      <div class="row" style="justify-content:space-between"><h4 style="margin:0">${done ? '✅' : '⬜'} ${m.title}<small style="color:var(--text-dim)">${prog}</small></h4>
      <span class="row" style="gap:6px">${m.game ? `<button class="btn small volt" data-qg="${m.game}">🎮 게임</button>` : ''}${canGo ? `<button class="btn small" data-go="${m.key}">길 안내</button>` : ''}</span></div>
      <div style="font-size:14px;color:var(--text-dim);line-height:1.5">${m.desc}</div><div style="font-size:13px">📍 ${m.whereText}</div></div>`;
  };
  const p = openPanel(`<h2>미션</h2><p class="sub">두 배지를 모두 모으면 전기 마스터! [길 안내]를 누르면 노란 화살표가 길을 알려 줘요.</p>
    <h3>🧲 전자석 마스터</h3><div class="grid2">${MISSIONS.filter(m => m.group === 'em').map(row).join('')}</div>
    <h3>⚡ 전기 안전 마스터</h3><div class="grid2">${MISSIONS.filter(m => m.group === 'es').map(row).join('')}</div>${SAVE.met && SAVE.met.volt ? evQuestCard() : ''}`);
  const eg = p.querySelector('#evGo'); if (eg) eg.onclick = () => { closePanel(); evGuide(); };
  p.querySelectorAll('[data-go]').forEach(b => b.onclick = () => {
    setWaypointFor(MISSIONS.find(x => x.key === b.dataset.go)); closePanel(); toast('노란 화살표를 따라가요!');
  });
  p.querySelectorAll('[data-qg]').forEach(b => b.onclick = () => mgOpenGame(b.dataset.qg));
}
function bestTreeTest(){ const v = SAVE.treeRuns.filter(r => r.kind === 'test').map(r => r.acc); return v.length ? Math.max(...v) : null; }
function bestRobot(kind = 'story'){ const v = SAVE.robotRuns.filter(r => r.kind === kind).map(r => r.acc); return v.length ? Math.max(...v) : null; }
function pct(v){ return v == null ? '-' : Math.round(v * 100) + '%'; }
function openLabHub(){
  const p = openPanel(`<h2>AI 연구소</h2>
    <p class="sub">AI가 판단하는 방법은 크게 두 가지예요. 사람이 질문 규칙을 직접 짜 주는 방법과, 예시 데이터를 보고 스스로 규칙을 찾게 하는 방법이에요.</p>
    <div class="grid3">
      <div class="card"><h4>AI 크레인 두뇌</h4><p style="margin:0 0 8px;font-size:14px;color:var(--text-dim)">질문 길(스무고개) · 내가 질문과 결정을 짜요</p>
        <p style="margin:0 0 10px;font-size:14px">새 고철 최고 정확도 <b>${pct(bestTreeTest())}</b></p><button class="btn primary" data-open="tree">열기</button></div>
      <div class="card"><h4>AI 안전 로봇</h4><p style="margin:0 0 8px;font-size:14px;color:var(--text-dim)">분류 학습 · 예시 문장으로 가르쳐요</p>
        <p style="margin:0 0 10px;font-size:14px">시험 마을 최고 정확도 <b>${pct(bestRobot())}</b></p><button class="btn primary" data-open="nb">열기</button></div>
      <div class="card"><h4>맵 만들기 공방</h4><p style="margin:0 0 8px;font-size:14px;color:var(--text-dim)">우리 동네 맵을 짓고 로봇을 시험해요</p>
        <p style="margin:0 0 10px;font-size:14px">저장한 맵 <b>${SAVE.maps.length}개</b></p><button class="btn primary" data-open="editor">열기</button></div>
    </div>`);
  p.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openMission(b.dataset.open));
}
function openMenu(){
  const p = openPanel(`<h2>메뉴</h2><div class="menu" style="max-width:420px">
    <button class="btn primary" data-m="resume">계속하기</button>
    <button class="btn" data-m="quest">미션 보기</button>
    <button class="btn" data-m="cert">마스터 인증서</button>
    <button class="btn" data-m="guide">교사용 안내</button>
    <button class="btn" data-m="sound">${SAVE.sound ? '소리 끄기' : '소리 켜기'}</button>
    <button class="btn" data-m="title">처음 화면으로</button></div>
    <p class="note" style="margin-top:14px">조작: <kbd>W A S D</kbd>·화살표 이동, <kbd>E</kbd>·<kbd>스페이스</kbd> 살펴보기, <kbd>Q</kbd> 미션, <kbd>M</kbd> 지도 크게, <kbd>Esc</kbd> 닫기</p>`);
  p.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
    const m = b.dataset.m;
    if (m === 'resume') closePanel();
    else if (m === 'quest') openQuests();
    else if (m === 'cert') openCert();
    else if (m === 'guide') openGuide();
    else if (m === 'sound'){ SAVE.sound = !SAVE.sound; persist(); b.textContent = SAVE.sound ? '소리 끄기' : '소리 켜기'; }
    else if (m === 'title'){ closePanel(); if (WORLD.kind === 'custom') exitCustom(); showTitle(); }
  });
}
function openGuide(){
  openPanel(`<h2>교사용 안내</h2>
    <p class="sub">전기 마스터 타운은 초6 과학 '전기의 이용'([6과15-03], [6과15-04])과 실과 '인공지능이 만들어지는 과정 체험'([6실05-05])을 잇는 AI 프로그램 개발 수업용 게임이에요. 학생은 코드를 쓰지 않고 AI의 판단 방법을 설계·학습·시험·개선해요.</p>
    <h3>6차시 흐름과 이야기(장)</h3>
    <p class="sub">이야기는 '점등식까지 D-5'예요. 마을 전기가 모자라 가로등이 깜빡이고, 학생은 전자석과 AI로 낭비와 위험을 찾아 점등식 날 큰 전구탑을 켜요. 장(D-5~D-DAY)이 차시와 같은 걸음으로 흘러요.</p>
    <div class="tblwrap"><table class="tbl"><thead><tr><th>차시</th><th>이야기 장</th><th>단계</th><th>게임에서 하는 일</th></tr></thead><tbody>
      <tr><td>1</td><td>프롤로그 · D-5 깜빡이는 마을</td><td>도구 학습 · 문제 발견</td><td>오프닝 컷신, 볼트 박사의 부탁, 전자석 실험실(예상 → 실험), 전자석 도감</td></tr>
      <tr><td>2</td><td>D-4 고철장 소동</td><td>문제 분석</td><td>고철장 크레인 직접 조종, 판단 기준(특징) 찾기, 종이 트리 초안</td></tr>
      <tr><td>3 ★</td><td>D-3 자동이의 고집</td><td>해결안 도출 · 구현</td><td>옛 자동 크레인 '자동이'의 틀린 규칙을 AI 크레인 두뇌(의사결정트리)로 고치기 → 새 고철 시험 → 디버깅</td></tr>
      <tr><td>4 ★</td><td>D-2 집집마다 숨은 위험</td><td>해결안 도출 · 구현</td><td>안전 마을 점검, AI 안전 로봇 데이터 구성 → 학습 → 시험 마을 순찰</td></tr>
      <tr><td>5</td><td>D-1 우리 동네 안전 지도</td><td>문제 해결 · 개선</td><td>틀린 까닭 분석·데이터 보완·재학습, 맵 만들기로 우리 동네 안전 지도 짓기, 로봇 순찰</td></tr>
      <tr><td>6</td><td>D-DAY 점등식</td><td>공유 · 성찰</td><td>맵 코드 교환, 친구 맵 순찰(처음 보는 데이터), 모든 미션을 마치면 점등식 컷신과 인증서</td></tr>
    </tbody></table></div>
    <h3>🎮 미니 게임 — 교재 활동을 게임으로</h3>
    <p class="sub">아이스크림 교재 활동 하나를 게임 하나로 바꿨어요. 게임마다 3단계이고 단계마다 ⚡ 1~3개를 받아요. 앞 단계를 깨면 다음 단계가 열려요. 화면 위 [🎮 미니 게임] 단추(<kbd>G</kbd>), 미션 창의 [🎮 게임], 마을의 실험대·컴퓨터·게임기, 처음 화면에서 열 수 있어요. 같은 미션을 마을 탐험으로 해도, 게임으로 해도 인정돼요.</p>
    <p class="sub">미니 게임도 마을과 같은 <b>블록 3D 화면</b>에서 해요. 카메라가 마을 남쪽의 게임 무대로 날아가요: 실험실 실험대의 작은 전자석 기중기, 블록 교실 · 거실 · 부엌과 욕실, 질문 미끄럼틀 나무판, AI 연구소의 로봇과 분류 칸, 무대 위 3컷 역할놀이. 물건을 화면에서 바로 눌러 고르고, WebGL이 없는 옛 기기에서는 같은 규칙의 2D 판으로 자동으로 바뀌어요. 게임마다 ❤️ · 콤보 · 점수 · 마지막 10초 초읽기 · 효과음 · 불꽃과 화면 흔들림이 있어 긴장감 있게 해요.</p>
    <div class="tblwrap"><table class="tbl"><thead><tr><th>게임</th><th>교재 활동</th><th>1 · 2 · 3단계</th><th>이어지는 미션</th></tr></thead><tbody>
      <tr><td>🧲 전자석 실험 게임</td><td>전자석의 성질 떠올리기 (스위치 · 전지 2개 · 전지 방향과 나침반)</td><td>켜고 끄기(흔들리는 코일로 움직이는 수조에 클립 넣기) · 세기(주문 러시: 인내심 막대) · 극의 방향(나침반 속사 · 다가오는 자석 자동차 막기)</td><td>전자석 실험실 (3단계 모두)</td></tr>
      <tr><td>🔍 전자석 탐정</td><td>전자석을 사용하는 예 조사하기</td><td>교실 곳곳에 흩어진 전자석 예시 모형 12개 찾기(콤보) · 떨어지는 기기를 성질 칸으로 · 공중 부양 제품(오르내리는 목표 높이) + 새롭게 알게 된 점</td><td>전자석 도감 (2단계)</td></tr>
      <tr><td>🏗️ 고철장 크레인 조종</td><td>전자석 기중기</td><td>3D 고철장 조종석 (실수가 적을수록 ⚡)</td><td>크레인 조종</td></tr>
      <tr><td>🛝 질문 미끄럼틀</td><td>전자석 기중기의 판단 → AI 크레인 두뇌</td><td>질문 하나로 나누기 · 질문 길 만들기 · 새 고철 트럭 시험(예상 먼저). 고철마다 '어느 통으로 갈까?'를 예측하면 점수·콤보, 통 위 꼬마 전자석이 결정대로 집어 봄</td><td>AI 크레인 두뇌 (3단계 8개 중 7개 이상)</td></tr>
      <tr><td>🏠 우리 집 안전 탐정</td><td>전기를 안전하게 사용하고 절약하는 방법</td><td>거실 점검 · 부엌·욕실 점검(위험을 내버려 두면 불이 나고, 낭비하면 전기 요금이 올라감) · 에너지 라벨 마트 + 까닭 3가지 영수증</td><td>안전 마을 점검 (2단계)</td></tr>
      <tr><td>🤖 로봇 훈련소</td><td>바른 사용 · 위험 · 낭비 판단 → AI 안전 로봇</td><td>라벨 붙이기(카드가 컨베이어로 점점 빨리) · 데이터 고르기(상관없는 문장 · 개인정보 버리기) · 시험하고 고치기</td><td>AI 안전 로봇 (3단계)</td></tr>
      <tr><td>📣 전기 안전 캠페인</td><td>표현하기 (과학 글쓰기 · 역할놀이 · 그림)</td><td>만약 ~라면 수칙 카드 · 역할놀이 3컷 대본 · 우리 동네 안전 지도(맵 만들기) + 갤러리 · 공유 글 복사</td><td>우리 동네 맵 (2단계)</td></tr>
    </tbody></table></div>
    <p class="note">AI 프로그램 개발 흐름이 게임 단계에 그대로 들어 있어요. 질문 미끄럼틀은 <b>규칙 세우기 → 다듬기 → 처음 보는 데이터로 시험</b>, 로봇 훈련소는 <b>라벨 붙이기 → 데이터 고르기 → 시험하고 고치기</b>예요. 로봇 훈련소의 정확도는 학생이 붙인 라벨로 실제로 학습해서 계산해요(바른 라벨 12개로 배우면 처음 보는 문장 9개 중 8개, 라벨 2개가 틀리면 6개). ⚡과 경험치는 동기 부여용이고, 평가는 결과 카드의 기록 · 영수증 · 수칙 카드 · 3컷 만화 · 새롭게 알게 된 점으로 해요.</p>
    <h3>길 건너기 안전(❤️)과 전기차 충전소 퀘스트</h3>
    <p>마을 도로에는 차가 다녀요. 차는 <b>횡단보도 위의 사람에게만</b> 멈추고, 횡단보도 밖에서 부딪히면 ❤️(5개) 하나를 잃어요. ❤️가 0이 되면 병원 앞에서 깨어나고(진행은 그대로) 40초마다 하나씩 다시 차요. 눌러서 가기도 횡단보도로만 길을 건너요.</p>
    <p><b>⚡ 전기차 충전소 프로젝트</b>(미션 창 아래): ① 도로를 달리는 초록 전기차를 옆이나 뒤에서 붙잡아 운전자 이야기를 듣고 ② 시청 옆 시장님께 <b>왜 필요한지</b>(전기차는 에너지를 아낀다 · 전동기 속 전자석의 실제 예)와 <b>어디에 세울지</b>(깃발 세 곳 중 안전하고 편리한 곳)를 설득해요. 틀린 근거를 고르면 시장님이 반박하고 다시 물어요. 설득하면 남쪽 주차장 입구에 충전소가 생겨요. [6과15-03]의 전자석 이용 예와 [6과15-04]의 효율·안전을 근거로 말하는 활동이에요.</p>
    <h3>이야기와 인물</h3>
    <p><b>볼트 박사</b>(AI 연구소장) · <b>무쇠 사장님</b>(고철장) · <b>자동이</b>(번쩍이면 철, 크면 무겁다고 우기는 옛 자동 크레인 두뇌) · <b>안전이</b>(안전 지킴이) · <b>해님·달님·별님</b>(안전 마을 아이들). 자동이는 "AI도 틀릴 수 있다, 틀리면 고친다, 사람이 시험해 봐야 안다"를 이야기로 보여 주는 인물이에요. 화면 위 '마을 전력' 게이지는 미션을 마칠수록 오르고, 가로등이 연구소에서 가까운 곳부터 하나씩 켜져요.</p>
    <p class="note">컷신은 <kbd>Esc</kbd>나 [건너뛰기]로 넘길 수 있어요. 이야기 진행(점등식)은 평가에 반영하지 않고, 평가는 트리·학습 데이터·오류 분석 기록과 활동지로 해요.</p>
    <h3>RPG 요소 (레벨 · 가방 · 길가 친구)</h3>
    <p>학생은 미션·도감·장면 판단·친구 돕기로 경험치를 얻어 레벨이 올라요(🎒 버튼이나 <kbd>I</kbd> 키로 가방). 능력치는 🧲 전자석 이해 · 🛡️ 안전 감각 · 🌱 절약 감각 · 🤖 AI 다루기 네 가지예요. 마을을 돌아다니는 행인과 동물 10명에게 말을 걸면 교과서 활동과 이어진 질문(효율 등급, LED, 플러그 뽑기, 젖은 손, 문어발, 안전 덮개, 효율·안전하게 써야 하는 까닭, 교실 속 전자석, 공중 부양 제품, 전자석 기중기, AI 확인)을 하고, 맞히면 보너스 경험치와 도구를 얻어요. 심부름 2개(안전 덮개 찾기, 다 쓴 건전지 모으기)도 있어요.</p>
    <p class="note">도구를 찾을 때만 확률(운)이 들어가요. 미션 성공 기준·정답·평가에는 운이나 레벨이 끼어들지 않아요. 크레인 두뇌는 학생 화면에 '질문 길(스무고개)'로 나오고, 질문은 재료·무게·크기·색 네 가지 특징만 고를 수 있으며 한 길에서 같은 특징을 두 번 묻지 못해요.</p>
    <h3>저장과 공유</h3>
    <p>진행 상황·트리·학습 데이터·맵은 <b>이 기기의 브라우저</b>에 자동 저장돼요. 다른 기기로 옮기거나 친구와 나눌 때는 맵 만들기의 <b>맵 코드</b>를 패들렛 등에 붙여 넣어요. 공용 기기라면 수업이 끝날 때 처음 화면의 '진행 초기화'를 눌러요.</p>
    <h3>개인정보와 안전</h3>
    <p>학습 문장·상황 카드·모둠 이름에 실명, 학교, 연락처를 쓰지 않도록 지도해 주세요. 숫자가 길게 이어지거나 '학교'가 들어간 문장은 프로그램이 경고해요. 위험 장면은 게임 속에서만 다루고 실제 콘센트로 따라 하지 않도록 지도해요.</p>
    <h3>AI 모델에 대해</h3>
    <p>AI 크레인 두뇌는 학생이 짠 규칙을 그대로 따르는 의사결정트리예요. AI 안전 로봇은 장면을 설명하는 문장의 낱말과 글자 조각이 각 무리에 얼마나 자주 나왔는지 세어 판단하는 간단한 분류 모델(나이브 베이즈)이에요. 그래서 데이터가 적거나 치우치면 틀려요. 그 오류 자체가 성찰 소재예요.</p>
    <h3>조작</h3>
    <p>키보드: <kbd>W A S D</kbd>·화살표 이동, <kbd>E</kbd>·<kbd>스페이스</kbd> 살펴보기, <kbd>Q</kbd> 미션, <kbd>M</kbd> 지도 크게, <kbd>G</kbd> 미니 게임(게임마다 첫 화면에 조작이 나와요, <kbd>Esc</kbd> 그만하기). 태블릿: 왼쪽 조이스틱으로 이동, 오른쪽 버튼으로 살펴보기.</p>
    <p>3D 화면: 화면을 끌면 카메라가 돌고, 휠·두 손가락으로 가까이·멀리 볼 수 있어요. 땅이나 물체를 짧게 누르면 그곳까지 걸어가요. <kbd>Z</kbd>·<kbd>C</kbd> 카메라 돌리기, <kbd>V</kbd> 1인칭·3인칭 바꾸기. 맵 만들기에서는 끌어서 칠하고, 오른쪽 버튼으로 끌거나 <kbd>Q</kbd>·<kbd>E</kbd>로 돌리고, <kbd>W A S D</kbd>로 옮겨요. 크레인 조종과 AI 크레인 두뇌 시험은 고철장의 3D 크레인으로 해요(<kbd>←</kbd><kbd>→</kbd> 이동, <kbd>스페이스</kbd> 자석, <kbd>1</kbd><kbd>2</kbd> 전지 개수, <kbd>Esc</kbd> 그만하기). 오래된 기기에서 3D가 켜지지 않으면 예전 2D 화면으로 자동으로 바뀌어요.</p>`, {wide:true});
}
function openCert(){
  const q = Q(), c = masterCounts();
  const p = openPanel(`<h2>마스터 인증서</h2>
    <div class="card paper" style="text-align:center;display:grid;gap:10px;padding:22px">
      <div style="font-family:var(--font-display);font-size:30px;color:#b85a19">전기 마스터 타운 인증서</div>
      <div style="font-size:16px"><input id="certName" maxlength="10" placeholder="별명 (실명 X)" value="${esc(SAVE.nickname)}" style="background:#fff;color:#1c2733;text-align:center;width:180px" aria-label="별명"> 견습생은</div>
      <div class="row" style="justify-content:center;gap:16px">
        <div style="font-size:18px;font-weight:800">${c.em === 4 ? '🧲 전자석 마스터 ✔' : `🧲 전자석 마스터 ${c.em}/4`}</div>
        <div style="font-size:18px;font-weight:800">${c.es === 3 ? '⚡ 전기 안전 마스터 ✔' : `⚡ 전기 안전 마스터 ${c.es}/3`}</div>
      </div>
      <div style="font-size:14px;color:#5a6878;line-height:1.7">전자석 도감 ${q.dexDone}/10 · 안전 마을 판단 ${q.judgedOk}/14 정답<br>
        AI 크레인 두뇌 새 고철 최고 정확도 ${pct(bestTreeTest())} · AI 안전 로봇 시험 마을 최고 정확도 ${pct(bestRobot())}<br>
        만든 맵 ${SAVE.maps.length}개${SAVE.story.finale ? '<br>🎆 점등식 성공 · 마을 전력 100%' : ''}</div>
      <div style="font-size:15px">${c.em === 4 && c.es === 3 ? '두 배지를 모두 모아 <b>전기 마스터</b>가 되었음을 인증합니다.' : '남은 미션을 마치면 전기 마스터가 될 수 있어요!'}</div>
      <div style="font-size:13px;color:#5a6878">${new Date().toLocaleDateString('ko-KR')}</div>
    </div>
    <p class="sub" style="margin-top:10px">화면을 캡처해서 패들렛에 올려요.</p>`);
  p.querySelector('#certName').oninput = e => { SAVE.nickname = e.target.value.slice(0, 10); persist(); };
}
function openReset(){
  const p = openPanel(`<h2>진행 초기화</h2><p>이 기기에 저장된 진행 상황, 크레인 두뇌, 로봇 학습 데이터, 저장한 맵이 모두 지워져요. 되돌릴 수 없어요.</p>
    <div class="row"><button class="btn" data-close>취소</button><button class="btn primary" id="doReset">모두 지우기</button></div>`);
  p.querySelector('#doReset').onclick = () => {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    SAVE = DEFAULT_SAVE(); rpgNormalize(); persist(); UI.waypoint = null; updateRpgHUD();
    loadWorld(buildStoryWorld()); closePanel(); showTitle(); toast('초기화했어요.');
  };
}
