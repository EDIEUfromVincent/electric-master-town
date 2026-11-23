/* =========================================================
   ⚖️ 판단 기준 '조절과 그 대가' (EM 재설계 P2)
   · 개념 렌즈: 조절(control)과 대가(cost)
   · 개념적 일반화: "사람은 자기력을 켜고 끄거나, 세기와 방향을 조절해야 할 때 전기 에너지를 들여 전자석을 쓴다."
   · 반례 사냥(a2 뒤): 영구 자석을 쓰는 곳으로 이 문장을 시험한다 (자유 응답 → 판단 기록)
   · 크레인 정전 사건(a4, 한 판에 한 번): X1 "고철은 어떻게 될까?" → X2 "어떻게 대비할까?" (근거가 있으면 여러 답 인정)
   · 판단 기록: tag 'judgment', nodeId '<활동>.<질문>.<이유태그>', result correct(인정)·partial(되묻기)·miss(다시 생각)
   ========================================================= */
const CONCEPT_GEN = '사람은 자기력을 켜고 끄거나, 세기와 방향을 조절해야 할 때 전기 에너지를 들여 전자석을 쓴다.';
function p2State(){ if (!SAVE.p2 || typeof SAVE.p2 !== 'object') SAVE.p2 = {}; return SAVE.p2; }
/* ACTS 밖의 선택 활동은 놓인 차시로 기록한다 (a11 스마트 기기 설계실 = 3차시 AI 안전 로봇실) */
const JUDGE_LESSON = {a11:'L3', shop:'L1'};   /* 상점(자유 탐험)은 1차시 '전자석의 쓰임'과 이어진다 */
const lessonOfAct = id => { if (JUDGE_LESSON[id]) return JUDGE_LESSON[id]; const L = zoneOfAct(id); return L ? wrapLessonOf(L.z) : null; };

/* 판단 기록: 학급 서버가 있으면 시트로, 없어도 이 기기에 남긴다 (배움 기록 문서용) */
function ladJudge(actId, nodeId, studentText, result, npcText, npc){
  const st = p2State(); st.log = Array.isArray(st.log) ? st.log : [];
  const text = ladMask(studentText).slice(0, 200);
  st.log.push({at:Date.now(), act:actId, node:nodeId, text, result, q:String(npcText || '').slice(0, 90)}); if (st.log.length > 60) st.log.splice(0, st.log.length - 60);
  persist();
  const lesson = lessonOfAct(actId);
  if (!ACC.server || !ACC.id || !lesson) return;
  LAD.queue.push({eventId:ladUUID(), clientTime:new Date().toISOString(), tag:'judgment', lesson, nodeId:String(nodeId).slice(0, 60), studentText:text, result,
    npcText:String(npcText || '').slice(0, 300), npc:npc || ''});
  if (LAD.queue.length > 500) LAD.queue.splice(0, LAD.queue.length - 500);
  lsSet(LAD.qKey, JSON.stringify(LAD.queue));
  setTimeout(ladFlush, 1200);
}

/* 고르는 질문 판: 인정(ok) · 되묻기(part, 이어지는 질문) · 다시 생각(no, 같은 질문 다시) */
function quizPanel(def, onDone){
  const ask = (q, resolve) => {
    const opts = def.shuffle === false ? q.opts : mgShuffle(q.opts);
    const p = openPanel(`<div class="quizp"><div class="qp-who">${esc(def.icon || '💬')} ${esc(def.who)}</div><p class="qp-q"></p>
      <div class="qp-opts">${opts.map((o, k) => `<button class="btn qp-o" data-k="${k}"></button>`).join('')}</div><div class="qp-fb" id="qpFb"></div></div>`, {onClose:() => resolve(null)});
    p.querySelector('.qp-q').textContent = q.q;
    p.querySelectorAll('[data-k]').forEach(b => { const o = opts[+b.dataset.k]; b.textContent = o.t; b.onclick = () => pick(o); });
    let done = false;
    const pick = o => {
      if (done) return;
      const fbBox = p.querySelector('#qpFb');
      fbBox.innerHTML = `<div class="${o.ok === 'no' ? 'warnbox' : 'okbox'}"></div>`; fbBox.firstChild.textContent = o.r;
      if (o.ok === 'no'){ SND.bad(); p.querySelectorAll('[data-k]').forEach(b => { if (b.textContent === o.t) b.disabled = true; }); if (def.onPick) def.onPick(q, o); return; }
      done = true; SND.ok(); if (def.onPick) def.onPick(q, o);
      p.querySelectorAll('[data-k]').forEach(b => { b.disabled = true; b.classList.toggle('good', b.textContent === o.t); });
      const nb = document.createElement('div'); nb.className = 'row'; nb.style.cssText = 'justify-content:center;margin-top:8px';
      nb.innerHTML = '<button class="btn primary">다음 ▶</button>'; fbBox.appendChild(nb);
      nb.firstChild.onclick = () => { UI.panelClose = null; closePanel(); o.follow ? ask(o.follow, resolve) : resolve(o); };
    };
  };
  let result = null;
  const resolve = o => { if (result !== null) return; result = o || false; if (onDone) onDone(o); };
  ask(def.q, resolve);
}

/* ===== 반례 사냥 (a2를 마친 뒤 · 볼트 박사의 무전) ===== */
/* 낱말 기준이라 거칠다: 점수에는 넣지 않고 기록·되묻기에만 쓴다. '문'(문장), '스피커'(영구 자석+전자석 함께), '클립'(자석이 아님)은 넣지 않는다 */
const PERM_PLACES = ['냉장고', '나침반', '칠판', '필통', '메모', '가방', '지갑', '자석 다트', '다트', '장난감', '자석 보드', '화이트보드', '병따개', '휴대폰 케이스', '케이스', '마그넷', '자석 블록', '방충망'];
const PERM_WHY = ['늘', '항상', '계속', '붙어', '붙여', '끌 필요', '조절', '필요 없', '필요없', '바꿀 필요', '안 바꿔', '전기 없이', '전기가 없어도', '전기를 안', '전기 안', '전기가 안', '전기가 들지', '전기를 쓰지'];
function counterTag(text){
  const t = String(text || '').replace(/\s+/g, ' '), place = PERM_PLACES.find(w => t.includes(w)), why = PERM_WHY.some(w => t.includes(w));
  return {place, why, tag:place && why ? 'fits' : place ? 'place' : 'none'};
}
function counterHunt(force){
  const st = p2State();
  if (st.counter && !force) return;
  let tries = 0;
  const p = openPanel(`<div class="radio"><div class="rd-head">📡 볼트 박사의 무전 · 반례 사냥</div>
    <p>해님네 거실에서 기기들이 쓰는 성질을 판단해 봤지요? 그걸 한 문장으로 모아 봤어요.</p>
    <blockquote class="rd-gen"></blockquote>
    <p><b>이 문장이 틀리는 경우가 있을까요?</b> 전자석 대신 <b>영구 자석</b>을 쓰는 곳을 찾아서 이 문장을 시험해 봐요.</p>
    <label class="rd-lab">영구 자석을 쓰는 곳 한 군데와, 그곳에 전자석이 필요 없는 까닭</label>
    <input id="rdIn" maxlength="200" autocomplete="off" placeholder="예: ○○에는 영구 자석을 써요. 왜냐하면 …">
    <div id="rdFb"></div>
    <div class="row"><button class="btn primary" id="rdGo">시험해 보기 🔍</button><button class="btn" id="rdLater">나중에</button></div></div>`, {wide:true});
  p.querySelector('.rd-gen').textContent = '“' + CONCEPT_GEN + '”';
  const inp = p.querySelector('#rdIn'), fb = p.querySelector('#rdFb');
  const go = () => {
    const t = inp.value.trim(); if (t.length < 4) return inp.focus();
    tries++;
    const c = counterTag(t), say = (cls, html) => { fb.innerHTML = `<div class="${cls}">${html}</div>`; };
    if (c.tag === 'fits'){
      say('okbox', `🔍 좋은 시험이에요! <b>${esc(c.place)}</b>의 자석은 켜고 끄거나 세기·방향을 바꿀 필요가 없지요. 그래서 전기를 들이지 않고 영구 자석을 써요. 문장은 틀리지 않았고, 오히려 <b>“조절이 필요 없으면 영구 자석”</b>이라는 반대쪽까지 확인했어요.`);
    } else if (c.tag === 'place' && tries < 2){
      say('warnbox', `좋아요, <b>${esc(c.place)}</b>! 그런데 그곳의 자석은 켜고 꺼지거나 세기·방향이 바뀌어야 할까요? 그렇지 않다면 왜 영구 자석으로 충분한지 까닭을 덧붙여 볼래요?`);
      ladJudge('a2', 'a2.counterexample.place', t, 'partial', '반례 사냥: 영구 자석을 쓰는 곳과 까닭', 'volt'); return;
    } else if (c.tag === 'none' && tries < 2){
      say('warnbox', '영구 자석을 쓰는 물건을 하나 떠올려 봐요. 냉장고 문, 나침반, 칠판 자석은 어때요? 그곳에서 자석이 무엇을 하는지도 함께 적어 봐요.');
      ladJudge('a2', 'a2.counterexample.none', t, 'miss', '반례 사냥: 영구 자석을 쓰는 곳과 까닭', 'volt'); return;
    } else {
      say('okbox', `고마워요! 선생님께 전해 둘게요. 기억할 점: <b>조절이 필요하면 전자석(대가는 전기), 늘 붙어 있기만 하면 되면 영구 자석</b>이에요.`);
    }
    st.counter = {text:ladMask(t), tag:c.tag, at:Date.now()}; persist();
    ladJudge('a2', 'a2.counterexample.' + c.tag, t, c.tag === 'fits' ? 'correct' : 'partial', '반례 사냥: 영구 자석을 쓰는 곳과 까닭', 'volt');
    if (tries === 1 && c.tag === 'fits'){ award('em', 6); award('eco', 3); }
    p.querySelector('#rdGo').disabled = true; inp.disabled = true;
    p.querySelector('#rdLater').textContent = '닫기';
  };
  p.querySelector('#rdGo').onclick = go;
  p.querySelector('#rdLater').onclick = () => closePanel();
  inp.onkeydown = e => { if (e.isComposing || e.keyCode === 229) return; if (e.key === 'Enter'){ e.preventDefault(); go(); } };
  setTimeout(() => { if (!IS_TOUCH) inp.focus(); }, 60);
}
/* a2를 이미 마친 학생도 1차시 구역에 들어오면 한 번 권한다 (세션마다 한 번) */
function counterHuntOffer(){
  const st = p2State(), a2 = actById('a2');
  if (st.counter || !a2 || !actDone(a2) || LAD.counterOffered) return;
  LAD.counterOffered = true;
  if (uiBlocking()) UI.pending.push(() => counterHunt()); else counterHunt();
}

/* ===== 크레인 정전 사건 (3D 크레인 조종, 한 판에 한 번) ===== */
const BLACKOUT_Q1 = {q:'앗, 정전이다! 전기가 끊기면 크레인에 붙어 있던 고철은 어떻게 될까?', opts:[
  {t:'떨어진다', ok:'ok', tag:'drop', r:'맞아! 전자석은 전기가 흐를 때만 자석이니까, 전기가 끊기면 고철을 놓쳐 버려.'},
  {t:'그대로 붙어 있다', ok:'no', tag:'stay', r:'그건 영구 자석일 때야. 전자석은 언제 자석이 되었지? 다시 골라 볼래?'},
  {t:'더 세게 붙는다', ok:'no', tag:'stronger', r:'전기가 끊기면 세지는 게 아니라 자석이 아니게 돼. 다시 골라 볼래?'}]};
const BLACKOUT_Q2 = {q:'정전이 또 일어나도 고철장이 안전하려면 어떻게 하면 좋을까? (근거가 있으면 여러 답이 될 수 있어)', opts:[
  {t:'비상 전원(배터리)을 달아 둔다', ok:'ok', tag:'battery', r:'좋은 생각이야! 정전이 나도 비상 전원으로 잠깐 버티며 고철을 안전하게 내려놓을 수 있지. 대신 배터리를 늘 충전해 두어야 해.'},
  {t:'사람이 없는 길로만, 낮게 들어 옮긴다', ok:'ok', tag:'lowpath', r:'좋아! 떨어져도 다치는 사람이 없고 충격도 작지. 대신 다니는 길이 정해져서 시간이 더 걸릴 수 있어.'},
  {t:'영구 자석 집게로 바꾼다', ok:'part', tag:'permanent', r:'좋은 생각! 정전이 나도 영구 자석은 계속 붙어 있지.', follow:{q:'그런데 영구 자석이면 원하는 곳에 고철을 내려놓을 때는 어떻게 하지?', opts:[
    {t:'떼어 내는 장치가 따로 있어야 해서 더 번거로워요', ok:'ok', tag:'permanent-cost', r:'맞아! 정전에는 강하지만 내려놓기가 어려워. 켜고 끄는 조절이 필요한 일에는 전자석, 그 대가는 전기야. 무엇이 더 중요한지 저울질해야 해.'},
    {t:'그냥 두면 저절로 떨어져요', ok:'no', tag:'permanent-drop', r:'영구 자석은 늘 자석이라 저절로 떨어지지 않아. 다시 생각해 볼래?'}]}},
  {t:'괜찮다, 그냥 쓴다', ok:'no', tag:'ignore', r:'고철이 떨어지면 아래에 있는 사람이 다칠 수 있어. 다시 골라 볼래?'}]};
/* 철 고철을 하나 이상 넣어 본 뒤, 다음 고철을 들고 있을 때 한 번 (끝까지 답한 학생은 다시 하기에서 건너뛴다) */
function craneBlackoutMaybe(){
  if (CR3.mode !== 'manual' || CR3.blackDone || CR3.finished || !CR3.carry || p2State().blackout) return;
  const n = ironIn(); if (n < 1 || n > 2) return;
  CR3.blackDone = true;
  const gen = CR3.gen;
  setTimeout(() => { if (gen === CR3.gen && MODE === 'crane' && CR3.carry && !CR3.finished && !CR3.busy) craneBlackout(); else CR3.blackDone = false; }, 1100);
}
function craneBlackout(){
  CR3.frozen = true; CR3.hold = 0; CR3.blackT = TIME;
  SFX.buzz(); cr3Msg('⚡ <b>정전!</b> 고철장의 전기가 끊겼어요. 크레인이 멈췄어요!');
  const npc = '무쇠 사장님';
  quizPanel({who:npc, icon:'🏗️', q:BLACKOUT_Q1, shuffle:false, onPick:(q, o) => ladJudge('a4', 'a4.blackout.' + o.tag, o.t, o.ok === 'ok' ? 'correct' : 'miss', q.q, 'boss')}, () => {
    /* 1단계를 마치면 실제로 고철이 떨어지는 모습을 보여 주고 2단계로 (떨어뜨림 횟수에는 넣지 않는다) */
    if (MODE !== 'crane'){ CR3.frozen = false; return; }
    cr3Release(); cr3UI(true);
    cr3Msg('⬇️ 전기가 끊기자 전자석이 자석의 성질을 잃고 고철을 놓쳤어요.');
    setTimeout(() => {
      if (MODE !== 'crane'){ CR3.frozen = false; return; }
      quizPanel({who:npc, icon:'🏗️', q:BLACKOUT_Q2, onPick:(q, o) => ladJudge('a4', 'a4.blackout.' + o.tag, o.t, o.ok === 'ok' ? 'correct' : o.ok === 'part' ? 'partial' : 'miss', q.q, 'boss')}, () => {
        CR3.frozen = false; SND.ok();
        cr3Msg('💡 전기가 다시 들어왔어요! 떨어진 고철을 다시 집어 철 고철함으로 옮겨요.');
        p2State().blackout = (p2State().blackout || 0) + 1; persist();
      });
    }, 1300);
  });
}

/* ===== 판단 기록 모아 보기 (EM 재설계 P5): 정리 회의 화면 · 배움 기록 문서 =====
   질문마다 한 줄: 같은 질문에 여러 번 답했으면 마지막으로 인정받은 답(없으면 마지막 답) */
const JUDGE_RES = {correct:'✔ 인정', partial:'◐ 되물음', miss:'💡 다시 생각', info:''};
function judgeList(filter){
  const st = p2State(), log = Array.isArray(st.log) ? st.log : [], by = new Map();
  for (const l of log){
    if (!l || !filter(l)) continue;
    const key = l.act + '|' + String(l.node || '').replace(/\.[^.]+$/, '') + '|' + (l.q || '');
    const prev = by.get(key);
    if (!prev || l.result !== 'miss' || prev.result === 'miss') by.set(key, l);
  }
  return [...by.values()].sort((a, b) => a.at - b.at);
}
const judgeOfLesson = lesson => judgeList(l => lessonOfAct(l.act) === lesson);
const judgeOfAct = id => judgeList(l => l.act === id);
/* 질문 글이 없는 예전 기록은 노드ID 앞부분으로 이름을 붙인다 */
const JUDGE_LABEL = {'a2.counterexample':'반례 사냥: 영구 자석을 쓰는 곳과 까닭', 'a2.fridge':'냉장고 문에 영구 자석을 쓰는 까닭', 'a2.judge':'판단 카드: 이 물건에 전자석이 있을까?', 'shop.perm':'목적에 맞게 고르기',
  'a4.blackout':'크레인 정전 사건', 'a6.energySource':'충전소 전기는 어디서 오나', 'a11.props':'설계: 필요한 전자석 성질', 'a11.wrongWhy':'설계: 틀린 장면의 까닭', 'a11.sensorCheck':'설계: 센서가 틀리면',
  'a11.design':'설계 한 문장', 'a11.ext':'설계: 확장 질문', 'a11.meta':'설계: AI일까, 규칙일까'};
const judgeQ = l => l.q || (Object.entries(JUDGE_LABEL).find(([k]) => String(l.node || '').startsWith(k)) || [])[1] || l.node;
const judgeLine = l => `${judgeQ(l)} → ${l.text}${JUDGE_RES[l.result] ? ` (${JUDGE_RES[l.result]})` : ''}`;
function judgeListHTML(list){ return `<ul class="jd-list">${list.map(l => `<li><small>${esc(judgeQ(l))}</small><br>「${esc(l.text)}」 <b class="jd-${esc(l.result)}">${esc(JUDGE_RES[l.result] || '')}</b></li>`).join('')}</ul>`; }
/* 정리 회의 화면: 이 차시에 게임에서 한 판단을 펼쳐 볼 수 있다 */
function judgeWrapUI(lesson){
  const b = $('#wuJudge'), box = $('#wuJudgeList'); if (!b || !box) return;
  const list = judgeOfLesson(lesson);
  b.hidden = !list.length; box.hidden = true; box.innerHTML = '';
  if (!list.length) return;
  b.textContent = `🧭 내 판단 ${list.length}`;
  b.onclick = () => { box.hidden = !box.hidden; if (!box.hidden) box.innerHTML = '<p class="jd-head">게임에서 내가 한 판단이에요. 정리 회의에서 떠올려 써도 좋아요.</p>' + judgeListHTML(list); };
}
