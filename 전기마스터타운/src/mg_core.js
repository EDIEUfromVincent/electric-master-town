/* =========================================================
   6. 미니 게임 — 아이스크림 교재 활동을 게임으로 (게임 기반 학습)
   교재 활동 하나 = 게임 하나. 게임마다 3단계, 단계마다 ⚡(번개) 1~3개.
   앞 단계를 깨면 다음 단계가 열리고, 결과는 미션(마스터 배지)과 RPG 경험치에 이어진다.
   ========================================================= */
const MG = {cur:null, st:0, raf:0, last:0, loopFn:null, keyFn:null, keyUpFn:null, ptr:null, timers:[], ended:false, from:null, stat:''};
const MG_GAMES = [];
function mgReg(def){ MG_GAMES.push(def); MG_GAMES.sort((a, b) => (a.order || 99) - (b.order || 99)); }
const mgDef = id => MG_GAMES.find(g => g.id === id);
function mgRec(id){ if (!SAVE.mg || typeof SAVE.mg !== 'object') SAVE.mg = {}; if (!Array.isArray(SAVE.mg[id])) SAVE.mg[id] = [0, 0, 0]; return SAVE.mg[id]; }
const mgBolts = (id, st) => (SAVE.mg && Array.isArray(SAVE.mg[id]) ? SAVE.mg[id][st] || 0 : 0);
const mgOpen = (id, st) => st === 0 || mgBolts(id, st - 1) > 0;
const mgCleared = (id, st) => mgBolts(id, st) > 0;
const mgTotal = () => MG_GAMES.reduce((n, d) => n + [0, 1, 2].reduce((a, s) => a + mgBolts(d.id, s), 0), 0);
function mgSetBolts(id, st, b){ const r = mgRec(id); if (b > (r[st] || 0)){ r[st] = b; persist(); return true; } return false; }
const boltsHTML = n => `<span class="bolts" aria-label="번개 ${n}개">${[0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}">⚡</i>`).join('')}</span>`;
const heartsTxt = (n, max) => '❤️'.repeat(Math.max(0, n)) + '🤍'.repeat(Math.max(0, max - n));

/* ----- 그리기 도우미 ----- */
function mgEmoji(g, s, x, y, size){
  const n = emojiCount(s), sz = n >= 3 ? size * .55 : n === 2 ? size * .72 : size;
  g.font = `${Math.round(sz)}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1c2733'; g.fillText(s, x, y);
}
function mgText(g, s, x, y, size, col = '#1c2733', align = 'center', weight = 800){
  g.font = `${weight} ${size}px ${FONT_B}`; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y);
}
function mgBox(g, x, y, w, h, fill, stroke, r = 14, lw = 3){ rr(g, x, y, w, h, r); g.fillStyle = fill; g.fill(); if (stroke){ g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); } }
const mgRnd = seed => { let s = (seed >>> 0) || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };
function mgShuffle(a, r = Math.random){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function mgDot(g, x, y, r, col){ g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
/* 캔버스 글 줄바꿈: 띄어쓰기로 먼저 나누고, 너무 긴 낱말은 글자로 나눈다 */
function mgLines(g, s, maxW){
  const out = []; let cur = '';
  const chars = w => { for (const ch of w){ if (cur && g.measureText(cur + ch).width > maxW){ out.push(cur); cur = ch; } else cur += ch; } };
  for (const w of String(s).split(/\s+/).filter(Boolean)){
    const t = cur ? cur + ' ' + w : w;
    if (g.measureText(t).width <= maxW) cur = t; else { if (cur) out.push(cur); cur = ''; chars(w); }
  }
  if (cur) out.push(cur);
  return out;
}
function mgWrap(g, s, x, y, maxW, lh, size, col = '#1c2733', align = 'center', weight = 700){
  g.font = `${weight} ${size}px ${FONT_B}`; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'middle';
  const L = mgLines(g, s, maxW); L.forEach((l, i) => g.fillText(l, x, y + i * lh)); return L.length;
}

/* ----- 게임판에 넘겨주는 것 ----- */
const MGAPI = {
  W:960, H:540,
  get g(){ return $('#mgCv').getContext('2d'); },
  d3:false,
  canvas(on){ $('#mgCv').hidden = !on; $('#mgBox').classList.toggle('dom', !on); },
  /* 3D 무대 장면 바꾸기 (게임 상태를 그리는 함수 묶음) */
  scene(sc){ if (MG3.on && sc) MG3.sc = sc; },
  pick(list, x, y){ return mg3Pick(list, x, y); },
  /* 화면 좌표(3D 장면 위)에 고르기 창 */
  popAt(sx, sy, html){
    const el = $('#mgPop');
    if (!html){ el.hidden = true; el.innerHTML = ''; return el; }
    el.innerHTML = html; el.hidden = false;
    const b = $('#mgBox').getBoundingClientRect(), px = sx - b.left, py = sy - b.top, w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = `${clamp(px - w / 2, 6, Math.max(6, b.width - w - 6))}px`;
    el.style.top = `${py + 30 + h <= b.height - 6 ? py + 30 : Math.max(6, py - h - 30)}px`;
    return el;
  },
  /* 그림 위 말풍선 고르기 창: (x, y)는 960×540 그림 좌표. html 없이 부르면 닫힌다 */
  pop(x, y, html){
    const el = $('#mgPop');
    if (!html){ el.hidden = true; el.innerHTML = ''; return el; }
    el.innerHTML = html; el.hidden = false;
    const b = $('#mgBox').getBoundingClientRect(), px = x * b.width / 960, py = y * b.height / 540, w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = `${clamp(px - w / 2, 6, Math.max(6, b.width - w - 6))}px`;
    el.style.top = `${py + 38 + h <= b.height - 6 ? py + 38 : Math.max(6, py - h - 38)}px`;
    return el;
  },
  dom(html){ const el = $('#mgDom'); el.innerHTML = html || ''; el.hidden = !html; return el; },
  bot(html){ const el = $('#mgBot'); el.innerHTML = html || ''; return el; },
  stat(html){ if (html !== MG.stat){ MG.stat = html; $('#mgStat').innerHTML = html; } },
  say(html, kind){ const el = $('#mgSay'); el.innerHTML = html || ''; el.className = 'mg-say ' + (kind || ''); el.hidden = !html; },
  loop(fn){ MG.loopFn = fn; },
  keys(down, up){ MG.keyFn = down; MG.keyUpFn = up || null; },
  pointer(h){ MG.ptr = h; },
  after(ms, fn){ const t = setTimeout(() => { if (MG.cur && !MG.ended) fn(); }, ms); MG.timers.push(t); return t; },
  end(bolts, msg, extra){ mgEnd(bolts, msg, extra); },
  holdBtn(el, on, off){
    el.addEventListener('pointerdown', e => { e.preventDefault(); on(); try { el.setPointerCapture(e.pointerId); } catch (er) {} });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, off);
  },
};

/* ----- 미니 게임 목록 · 게임 하나 화면 ----- */
function mgStageBtns(d){
  if (d.single) return `<button class="btn small primary" data-play="${d.id}:0">${mgBolts(d.id, 0) ? '다시 하기' : '시작'}</button> ${boltsHTML(mgBolts(d.id, 0))}`;
  return [0, 1, 2].map(s => mgOpen(d.id, s)
    ? `<button class="mg-st" data-play="${d.id}:${s}" title="${esc(d.stages[s].name)}"><b>${s + 1}단계</b>${boltsHTML(mgBolts(d.id, s))}</button>`
    : `<span class="mg-st locked" title="앞 단계를 깨면 열려요"><b>${s + 1}단계</b>🔒</span>`).join('');
}
/* 바깥 활동으로 하는 단계(맵 만들기·크레인 조종)는 그 활동의 결과를 번개로 옮겨 온다 */
function mgSync(){
  if (SAVE.badges && SAVE.badges.es3 && !mgBolts('campaign', 2)) mgSetBolts('campaign', 2, 3);
}
function openGames(){
  mgSync();
  const p = openPanel(`<h2>🎮 미니 게임</h2>
    <p class="sub">교재 활동을 게임으로 해요. 단계마다 ⚡을 모아요(최대 3개). 앞 단계를 깨면 다음 단계가 열려요. 모은 번개 <b>${mgTotal()}</b>개</p>
    <div class="mg-cards">${MG_GAMES.map(d => `<div class="mg-gcard">
      <div class="mg-gh"><span class="mg-gi">${d.icon}</span><div><b>${esc(d.title)}</b><small>${esc(d.book)}</small></div></div>
      <div class="mg-sts">${mgStageBtns(d)}</div>
      <button class="btn small ghost" data-game="${d.id}">자세히</button></div>`).join('')}</div>`, {wide:true});
  p.querySelectorAll('[data-play]').forEach(b => b.onclick = () => { const [id, s] = b.dataset.play.split(':'); MG.from = 'hub'; mgStart(id, +s); });
  p.querySelectorAll('[data-game]').forEach(b => b.onclick = () => mgOpenGame(b.dataset.game));
}
function mgOpenGame(id){
  const d = mgDef(id); if (!d) return; mgSync();
  const p = openPanel(`<h2>${d.icon} ${esc(d.title)}</h2>
    <p class="sub"><b>교재 활동</b> · ${esc(d.book)}${d.ai ? `<br><b>AI 프로그램 개발</b> · ${esc(d.ai)}` : ''}</p>
    <div class="mg-stlist">${(d.single ? [d.stages[0]] : d.stages).map((s, i) => `<div class="mg-strow ${mgOpen(id, i) ? '' : 'locked'}">
      <div><b>${d.single ? '' : `${i + 1}단계 · `}${esc(s.name)}</b><p>${esc(s.goal)}</p></div>
      <div class="mg-stright">${boltsHTML(mgBolts(id, i))}${mgOpen(id, i) ? `<button class="btn ${i === 0 || mgCleared(id, i - 1) ? 'primary' : ''}" data-play="${id}:${i}">${mgBolts(id, i) ? '다시 하기' : '시작'}</button>` : '<span class="mg-lock">🔒 앞 단계를 깨요</span>'}</div></div>`).join('')}</div>
    ${d.extra ? `<div class="row" style="margin-top:12px">${d.extra.map((x, i) => `<button class="btn small" data-extra="${i}">${esc(x.label)}</button>`).join('')}</div>` : ''}
    <div class="row" style="margin-top:10px"><button class="btn small ghost" id="mgAll">🎮 다른 미니 게임</button></div>`, {wide:true});
  p.querySelectorAll('[data-play]').forEach(b => b.onclick = () => { const [gid, s] = b.dataset.play.split(':'); MG.from = 'game'; mgStart(gid, +s); });
  p.querySelectorAll('[data-extra]').forEach(b => b.onclick = () => d.extra[+b.dataset.extra].fn());
  p.querySelector('#mgAll').onclick = openGames;
}

/* ----- 시작 · 끝 ----- */
function mgStart(id, st){
  const d = mgDef(id); if (!d || !mgOpen(id, st)) return;
  const sd = d.stages[st];
  if (sd.launch){ closePanelSilently(); sd.launch(); return; }
  closePanelSilently(); $('#dialog').hidden = true; UI.dialog = null;
  UI.mg = true; MG.cur = d; MG.st = st; MG.ended = false; MG.stat = '';
  const sc3 = mg3Ready() && d.scene3 ? d.scene3(st) : null;   /* 3D 무대가 있으면 마을과 같은 3D 화면에서 */
  MGAPI.d3 = !!sc3; if (sc3) mg3Enter(sc3); else mg3Leave();
  KEYS.clear(); JOY.x = JOY.y = 0; PATH3.nodes = null;
  $('#mg').hidden = false; $('#mgTitle').textContent = `${d.icon} ${d.title}`;
  $('#mgStage').textContent = d.single ? sd.name : `${st + 1}단계 · ${sd.name}`;
  mgReset();
  mgCard(`<div class="mg-ci">${d.icon}</div><h3>${d.single ? '' : `${st + 1}단계 · `}${esc(sd.name)}</h3>
    <p class="mg-book">📘 ${esc(d.book)}</p><p class="mg-goal">🎯 ${sd.goal}</p>${sd.how ? `<p class="mg-how">🕹️ ${sd.how}</p>` : ''}
    <div class="row" style="justify-content:center;margin-top:10px"><button class="btn primary big" id="mgGo">시작!</button><button class="btn" id="mgBack">돌아가기</button></div>`);
  $('#mgGo').onclick = () => mgCountdown(() => d.start(st, MGAPI));
  $('#mgBack').onclick = () => mgQuit();
  setTimeout(() => { const b = $('#mgGo'); if (b) b.focus(); }, 30);
}
function mgReset(){
  cancelAnimationFrame(MG.raf); MG.timers.forEach(clearTimeout); MG.timers = [];
  MG.loopFn = MG.keyFn = MG.keyUpFn = MG.ptr = null;
  MGAPI.canvas(false); MGAPI.dom(''); MGAPI.bot(''); MGAPI.say(''); MGAPI.pop();
  MG.stat = ''; $('#mgStat').innerHTML = ''; fxReset();
  const g = MGAPI.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 960, 540);
  $('#mgCard').hidden = true;
}
function mgCard(html){ const c = $('#mgCard'); c.innerHTML = html; c.hidden = false; }
function mgCountdown(go){
  $('#mgCard').hidden = true; let n = 3;
  const c = $('#mgCount'); c.hidden = false; c.textContent = n; SND.beep(520, .08);
  const tick = () => { n--; if (n > 0){ c.textContent = n; SND.beep(520, .08); MG.timers.push(setTimeout(tick, 550)); } else { c.textContent = '시작!'; SND.beep(880, .14); MG.timers.push(setTimeout(() => { c.hidden = true; MG.last = performance.now(); MG.raf = requestAnimationFrame(mgFrame); go(); }, 450)); } };
  MG.timers.push(setTimeout(tick, 550));
}
function mgFrame(now){
  if (!MG.cur || MG.ended) return;
  const dt = Math.min(.05, Math.max(0, (now - MG.last) / 1000)); MG.last = now;
  try { if (MG.loopFn) MG.loopFn(dt); } catch (e) { console.error(e); }
  MG.raf = requestAnimationFrame(mgFrame);
}
function mgEnd(bolts, msg, extra){
  if (!MG.cur || MG.ended) return;
  MG.ended = true; cancelAnimationFrame(MG.raf); MG.timers.forEach(clearTimeout); MG.timers = [];
  MG.loopFn = MG.keyFn = MG.keyUpFn = MG.ptr = null; MGAPI.bot(''); MGAPI.pop();
  const d = MG.cur, st = MG.st, prev = mgBolts(d.id, st), best = Math.max(prev, bolts);
  mgSetBolts(d.id, st, bolts);
  if (bolts > 0){ if (!prev) award(d.stat, 15); if (bolts > prev) award(d.stat, 5 * (bolts - Math.max(prev, 1))); }
  if (d.cleared && bolts > 0) d.cleared(st, bolts);
  persist(); checkMasters();
  bolts > 0 ? SND.ok() : SND.bad();
  /* 활동 길에서는 다음 단계가 '같은 활동'일 때만 바로 이어 간다. 다른 활동이면 마을로 돌아가 인물의 안내를 받는다 */
  const chain = typeof actChainOn === 'function' && actChainOn();
  const next = !d.single && st < 2 && bolts > 0 && (!chain || actSameAct(d.id, st, st + 1));
  mgCard(`<div class="mg-ci">${bolts > 0 ? (bolts === 3 ? '🏆' : '🎉') : '💪'}</div><h3>${bolts > 0 ? (bolts === 3 ? '완벽해요!' : '성공!') : '아쉬워요, 다시 해 봐요!'}</h3>
    <div class="mg-big">${boltsHTML(bolts)}</div>${best > bolts ? `<p class="mg-small">최고 기록 ${boltsHTML(best)}</p>` : ''}
    <p>${msg || ''}</p>${bolts > 0 && d.learn && d.learn[st] ? `<div class="mg-learn"><b>📘 교재와 이어 보기</b><br>${d.learn[st]}</div>` : ''}${extra || ''}
    <div class="row" style="justify-content:center;margin-top:12px">${next ? `<button class="btn primary" id="mgNext">${st + 2}단계로</button>` : ''}<button class="btn" id="mgAgain">다시 하기</button>${chain ? '' : '<button class="btn" id="mgList">게임 목록</button>'}<button class="btn ${next ? 'ghost' : 'primary'}" id="mgOut">${(WORLD && WORLD.kind === 'room' ? '방으로' : '마을로') + (chain && !next && bolts > 0 ? ' 돌아가기 ▶' : '')}</button></div>`);
  if (next) $('#mgNext').onclick = () => mgStart(d.id, st + 1);
  $('#mgAgain').onclick = () => mgStart(d.id, st);
  if ($('#mgList')) $('#mgList').onclick = () => { mgQuit(true); mgOpenGame(d.id); };
  $('#mgOut').onclick = () => mgQuit();
  if (d.afterEnd) d.afterEnd(st, bolts);
}
function mgQuit(silent){
  if (!MG.cur && $('#mg').hidden) return;
  mgReset(); MG.cur = null; MG.ended = true; UI.mg = false;
  $('#mg').hidden = true; $('#mgCount').hidden = true;
  mg3Leave();
  updateHUD(); updateRpgHUD();
  if (!silent) runPending();
}
function mgPointer(type, e){
  if (!MG.ptr || !MG.ptr[type]) return;
  const r = $('#mgCv').getBoundingClientRect(); if (!r.width) return;
  MG.ptr[type]((e.clientX - r.left) * 960 / r.width, (e.clientY - r.top) * 540 / r.height, e);
}
function mgKey(e, down){
  if (down && e.code === 'Escape'){ mgQuit(); return; }
  if (!MG.cur || MG.ended) return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();   /* 누른 단추가 스페이스로 한 번 더 눌리지 않게 */
  if (down && MG.keyFn) MG.keyFn(e); else if (!down && MG.keyUpFn) MG.keyUpFn(e);
}
/* 미션과 잇기: 교재 활동 게임을 깨면 같은 미션을 마을 탐험 대신 해낸 것으로 친다 */
function mgMissionFlags(){
  return {
    em4:mgCleared('detect', 1), es1:mgCleared('home', 1), es2:mgCleared('robot', 2), es3:mgCleared('campaign', 1),
  };
}
