/* =========================================================
   📘 활동 — 교과서(아이스크림) 활동 순서대로 이어지는 한 줄 길
   - 활동마다 '맡은 사람(giver)'이 있다. 그 사람에게 말을 걸면 활동이 시작된다.
   - 활동을 끝내면 맡은 사람이 정리해 주고, 다음에 만날 사람을 알려 준다.
   - 다음 사람은 머리 위에 ! 가 뜨고 제자리에서 폴짝폴짝 뛴다. 노란 화살표가 길을 알려 준다.
   ========================================================= */
const ACTS = [
  {id:'a1', icon:'🔍', title:'교실에서 전자석 찾기', place:'m_detect', placeName:'광장의 🔍 전자석 탐정 게임기', giver:'volt', games:[['detect', 0]],
   book:'전자석을 사용하는 예 조사하기 — 모둠별로 교실에서 전자석을 사용하는 예를 찾아봅시다.',
   intro:['혹시 전자석으로 책을 공중에 띄우는 제품 뉴스 봤어요? 자석인데 떴다가 내려왔다가 한대요!', '전자석은 생각보다 가까이에 숨어 있어요. 먼저 교실에서 전자석을 사용하는 물건을 찾아봐요. 스피커, 선풍기, 컴퓨터…!'],
   done:['교실 곳곳에 전자석이 숨어 있었죠? 소리를 내는 스피커, 바람을 만드는 선풍기 속에도요.'],
   check:{q:'스피커와 선풍기에 공통으로 들어 있는 것은?', o:['전자석', '건전지', '나침반'], a:0, why:'스피커는 전자석으로 판을 떨게 해 소리를 내고, 선풍기는 전동기 속 전자석으로 날개를 돌려요.'}},
  {id:'a2', icon:'📺', title:'생활 속 전자석과 성질', place:'m_tv', placeName:'해님네 집 📺 텔레비전', giver:'sun', games:[['detect', 1], ['detect', 2]],
   book:'영상에서 전자석을 사용하는 예를 알아보고 전자석의 어떤 성질을 이용하는지 살펴봅시다. · 새롭게 알게 된 점 공유하기',
   intro:['안녕! 우리 집 세탁기, 헤어드라이어, 로봇 청소기에도 전자석이 있대. 정말일까?', '떨어지는 기기들을 전자석의 성질 칸에 넣어 줘. 그다음엔 공중 부양 제품도 직접 띄워 보고, 새롭게 알게 된 점을 써 줘!'],
   done:['드론, 세탁기, 자기 공명 영상 장치, 전기 자동차까지! 전자석이 이렇게 많은 곳에 쓰이다니 놀랐어.', '그런데 그 기기들이 이용한 성질, 정확히 기억나? 볼트 박사님께 다시 정리해 달라고 하자.'],
   check:{q:'로봇 청소기 바퀴를 돌리는 전동기에는 무엇이 들어 있을까요?', o:['영구 자석만', '전자석', '아무 자석도 없다'], a:1, why:'전동기 속 전자석에 전기가 흐르면 자석이 되어 바퀴를 돌려요.'}},
  {id:'a3', icon:'🧲', title:'전자석의 성질 떠올리기', place:'m_exp', placeName:'공장 지대 전자석 실험실의 🧪 실험대', giver:'volt', games:[['mag', 0], ['mag', 1], ['mag', 2]],
   book:'전자석의 성질을 떠올려 봅시다. — 전기가 흐를 때만 자석이 된다 · 자석의 세기를 바꿀 수 있다 · 극의 방향을 바꿀 수 있다',
   intro:['조사한 기기들이 어떤 성질을 이용했는지 알려면, 전자석의 성질부터 떠올려야 해요.', '스위치를 켜고 끄고, 전지를 하나 더 연결하고, 전지 방향을 바꿔 봐요. 세 가지 성질을 모두 찾아요!'],
   done:['정리해 볼까요? ① 전기가 흐를 때만 자석이 된다 ② 전지 수로 세기를 바꿀 수 있다 ③ 전지 방향으로 극을 바꿀 수 있다.', '이 세 가지가 실제로 일하는 곳이 고철장이에요. 크레인이 하루 종일 전기를 쓰고 있대요!'],
   check:{q:'전자석의 극의 방향을 바꾸려면?', o:['전지를 하나 더 연결한다', '전지의 방향을 바꾼다', '스위치를 끈다'], a:1, why:'전지 방향을 바꾸면 전류의 방향이 바뀌어 극이 바뀌어요.'}},
  {id:'a4', icon:'🏗️', title:'전자석 기중기', place:'m_crane', placeName:'고철장 🕹️ 크레인 조종석', giver:'boss', games:[['crane', 0]],
   book:'조사한 예는 전자석의 어떤 성질을 이용한 것인지 설명해 봅시다. — 전자석 기중기는 전기가 흐를 때만 자석이 되는 성질로 무거운 철을 들어 옮긴다.',
   intro:['고철장에 온 걸 환영한다! 크레인 끝의 둥근 판이 바로 전자석이지.', '철 고철만 골라 철 고철함에 옮겨 줘. 무거운 건 전지 2개로 세게, 가벼운 건 1개로! 전기는 아껴야 한다!'],
   done:['고맙다! 켜서 들고, 꺼서 내려놓고, 무게에 맞게 세기를 바꾸고. 전자석 기중기는 그 성질로 일하는 거야.', '그런데 매번 사람이 크레인을 몰 순 없잖아? 저기 자동 크레인 두뇌 자동이가 고집을 부리고 있어. 가서 좀 도와줘!'],
   check:{q:'전자석 기중기가 철을 원하는 곳에 내려놓을 수 있는 까닭은?', o:['전기를 끊으면 자석의 성질이 사라져서', '철이 가벼워서', '극이 바뀌어서'], a:0, why:'전자석은 전기가 흐를 때만 자석이 돼요.'}},
  {id:'a5', icon:'🛝', title:'AI 크레인 두뇌 만들기', place:'m_tree', placeName:'AI 연구소 🖥️ 크레인 두뇌 컴퓨터', giver:'auto', games:[['slide', 0], ['slide', 1], ['slide', 2]], ai:true,
   book:'(AI 프로그램 개발) 전자석 기중기가 스스로 판단하도록 예/아니요 질문 길(의사결정트리)을 만들고, 처음 보는 고철로 시험해 고치기',
   intro:['삐릭! 내 규칙은 완벽하다! 번쩍이면 철! 크면 무겁다!', '…알루미늄 캔이 섞였다고? 흥, 그럼 네가 내 두뇌를 새로 짜 봐라. 질문으로 나눠서 처음 보는 고철도 맞히면 인정하지!'],
   done:['삐릭… 처음 보는 고철도 맞혔다고? 내 규칙이 틀렸다는 걸 인정한다. 겉모습보다 재료를 물어야 했다.', 'AI도 틀릴 수 있다. 틀리면 고치고, 사람이 시험해 봐야 안다! 그런데 저기 도로에 초록 전기차가 헐떡이며 달리던데… 붙잡아서 이야기를 들어 봐라.'],
   check:{q:'질문 길이 처음 보는 고철에서 틀렸다. 무엇을 해야 할까?', o:['시험 고철의 답을 외워 넣는다', '틀린 고철을 보고 질문을 고쳐 다시 시험한다', '그냥 그대로 쓴다'], a:1, why:'처음 보는 데이터로 시험하고, 틀린 까닭을 찾아 고치는 것이 AI를 만드는 과정이에요.'}},
  {id:'a6', icon:'⚡', title:'전기 자동차와 충전소', giver:'evdriver', ev:true,
   book:'영상 속 전자석 예: 전기 자동차 — 전동기 속 전자석. 시장님께 충전소가 필요한 까닭(에너지 절약 · 전자석)과 세울 곳(안전)을 설득하기',
   done:['충전소 덕분에 배터리가 쑥쑥 차고 있어! 전기차는 전기 에너지를 효율적으로 쓰는 탈것이란다.', '그런데 효율적으로 쓰는 것만큼 안전하게 쓰는 것도 중요해. 안전 마을의 안전이가 집집마다 위험한 곳을 찾고 있대. 도와주겠니?']},
  {id:'a7', icon:'🏠', title:'전기를 효율적·안전하게 쓰는 방법 조사', place:'m_home', placeName:'안전 마을 🏠 우리 집 안전 탐정 게임기', giver:'guard', games:[['home', 0], ['home', 1]],
   book:'모둠별로 전기를 효율적이고 안전하게 사용하는 방법을 조사해 봅시다.',
   intro:['안전 지킴이 안전이예요! 집집마다 전기를 위험하게 쓰거나 낭비하는 곳이 숨어 있어요.', '거실, 부엌, 욕실을 살피며 바른 사용인지, 위험한지, 낭비인지 판단해 주세요. 위험을 내버려 두면 불이 나요!'],
   done:['멀티탭 문어발, 젖은 손, 안 보는 TV… 위험과 낭비를 잘 찾았어요!', '그런데 마을에는 집이 수백 채예요. 사람 혼자서 다 살필 수는 없어요. 볼트 박사님이 AI 안전 로봇을 준비하고 계세요. 연구소로 가 봐요!'],
   check:{q:'하나의 콘센트에 플러그를 여러 개 꽂아 쓰면?', o:['바른 사용', '위험', '낭비'], a:1, why:'한꺼번에 많은 전기가 흘러 열이 나고 불이 날 수 있어요.'}},
  {id:'a8', icon:'🤖', title:'AI 안전 로봇 가르치기', place:'m_nb', placeName:'AI 연구소 🖥️ 안전 로봇 컴퓨터', giver:'volt', games:[['robot', 0], ['robot', 1], ['robot', 2]], ai:true,
   book:'(AI 프로그램 개발) 조사한 방법을 바른 사용·위험·낭비 데이터로 만들어 로봇을 학습시키고, 처음 보는 장면으로 시험해 고치기',
   intro:['견습생이 조사한 방법이 로봇의 학습 데이터가 돼요. 문장마다 바른 사용·위험·낭비 이름표를 붙여 가르쳐요.', '관계없는 문장과 개인정보는 빼고, 처음 보는 장면으로 시험해요. 틀리면 로봇 탓보다 데이터부터 살펴봐요!'],
   done:['로봇이 처음 보는 장면도 판단하게 됐어요! 하지만 로봇도 틀릴 수 있으니 마지막 확인은 사람이 해요.', '이제 우리가 배운 것을 마을 사람들에게 알릴 차례예요. 안전 마을의 달님이 역할놀이를 준비하고 있대요!'],
   check:{q:'로봇이 위험한 장면을 바른 사용이라고 했다. 가장 먼저 살필 것은?', o:['로봇에게 준 학습 데이터', '태블릿 밝기', '로봇의 이름'], a:0, why:'비슷한 예시가 부족하거나 이름표가 틀렸는지 데이터부터 살펴요.'}},
  {id:'a9', icon:'📣', title:'다양한 방법으로 표현하기', place:'m_stage', placeName:'달님네 집 📣 역할놀이 무대', giver:'moon', games:[['campaign', 0], ['campaign', 1]],
   book:'전기를 효율적이고 안전하게 사용하는 방법을 다양한 활동(역할놀이 · 과학 글쓰기 · 그림 그리기)으로 표현해 봅시다.',
   intro:['나 달님이야! 우리 집 콘센트가 문어발이었던 거 기억나? 다른 집도 그럴지 몰라.', '"만약 ~라면, ~한다. 왜냐하면 ~" 수칙 카드를 만들고, 역할놀이 만화로 마을에 알려 줘!'],
   done:['네 만화 덕분에 이웃들이 플러그를 머리 잡고 뽑기 시작했어!', '별님이 마트에서 가전제품을 고르는데 에너지 소비 효율 등급이 헷갈린대. 별님네 집에 가 봐!'],
   check:{q:'전기를 절약하려고 플러그를 뽑을 때 안전한 방법은?', o:['전선을 잡아당긴다', '플러그의 머리 부분을 잡고 뽑는다', '젖은 손으로 뽑는다'], a:1, why:'전선을 당기면 피복이 벗겨져 감전되거나 불이 날 수 있어요.'}},
  {id:'a10', icon:'🏷️', title:'효율 등급과 까닭 정리', place:'m_mart', placeName:'별님네 집 🏷️ 가전제품 카탈로그', giver:'star', games:[['home', 2]],
   book:'에너지 소비 효율 등급이 높은 전기 기구 선택하기 · 전기를 효율적이고 안전하게 사용해야 하는 까닭을 이야기해 봅시다.',
   intro:['나는 별님! 냉장고를 새로 사야 하는데 1등급, 3등급… 뭘 골라야 할까?', '예산 안에서 한 달 전기 요금이 가장 적게 드는 걸 골라 줘. 그리고 전기를 아끼고 안전하게 써야 하는 까닭도 정리해 줘!'],
   done:['전기를 절약할 수 있고, 감전 사고나 화재를 막을 수 있고, 안전하고 지속가능한 사회를 만들 수 있어서! 이제 확실히 알겠어.', '마을 전력이 다 찼대! 볼트 박사님이 점등식을 준비하고 계셔. 광장으로 가 보자!'],
   check:{q:'전기를 효율적이고 안전하게 써야 하는 까닭이 아닌 것은?', o:['전기를 절약할 수 있어서', '감전 사고나 화재를 막을 수 있어서', '전기 요금을 더 많이 내려고'], a:2, why:'절약 · 안전 · 지속가능한 사회가 까닭이에요.'}},
];
const actById = id => ACTS.find(a => a.id === id);
const actIdxOf = id => ACTS.findIndex(a => a.id === id);
const ACT_WHO = {volt:'볼트 박사', sun:'해님', boss:'무쇠 사장님', auto:'자동이', evdriver:'전기차 운전자', guard:'안전이', moon:'달님', star:'별님', mayor:'시장님'};
const ACT_WHERE = {volt:'AI 연구소 앞', sun:'안전 마을 해님네 집', boss:'공장 지대 고철장', auto:'고철장 크레인 옆', evdriver:'도로를 달리는 초록 전기차', guard:'안전 마을 입구', moon:'안전 마을 달님네 집', star:'안전 마을 별님네 집', mayor:'시청 옆'};

function actState(){ if (!SAVE.act || typeof SAVE.act !== 'object') SAVE.act = {}; return SAVE.act; }
function actDone(a){
  if (a.ev) return !!(SAVE.evq && SAVE.evq.step >= 2);
  return a.games.every(([g, s]) => {
    if (g === 'crane') return mgCleared('crane', 0) || !!(SAVE.badges && SAVE.badges.em2);
    if (mgCleared(g, s)) return true;
    if (g === 'detect' && s === 1) return DEVICES.every(d => SAVE.dex[d.id] && SAVE.dex[d.id].done);   /* 마을 곳곳 기기 도감으로 해도 된다 */
    if (g === 'home' && s <= 1) return SCENES.every(sc => SAVE.judged[sc.id]);                       /* 안전 마을 장면 14개로 해도 된다 */
    return false;
  });
}
/* 순서대로: 앞 활동을 끝내야 다음 활동이 '지금 할 일'이 된다 */
function actIdx(){ for (let i = 0; i < ACTS.length; i++) if (!actDone(ACTS[i])) return i; return ACTS.length; }
const actCur = () => (SAVE.met && SAVE.met.volt ? ACTS[actIdx()] || null : null);
const actAllDone = () => actIdx() >= ACTS.length;
const actReached = id => !!(SAVE.met && SAVE.met.volt) && actIdx() >= actIdxOf(id);
/* 지금 만나야 할 사람: 처음엔 볼트 박사, 다 끝나면 점등식을 위해 볼트 박사 */
function actGiverNow(){
  if (!SAVE.met || !SAVE.met.volt) return 'volt';
  const a = actCur(); if (!a) return SAVE.story && SAVE.story.finale ? null : 'volt';
  if (a.ev){ const st = SAVE.evq ? SAVE.evq.step : 0; return st >= 1 ? 'mayor' : 'evcar'; }
  return actTold(a) ? 'place' : a.giver;
}
/* 이야기를 들었으면 다음 신호는 '장소': 직접 걸어가서 E로 시작한다 */
const actTold = a => !!(a && a.place && actState().told && actState().told[a.id]);
function actPlaceNow(){ const a = actCur(); return a && actTold(a) ? a.place : null; }
function actPlaceObj(){ const id = actPlaceNow(); return id && WORLD && WORLD.objects ? WORLD.objects.find(o => o.id === id) : null; }
function actGiverObj(id = actGiverNow()){ return id && WORLD && WORLD.objects ? WORLD.objects.find(o => o.type === 'npc' && o.id === id) : null; }
function actWaypoint(){
  const id = actGiverNow(); if (!id) { UI.waypoint = null; return; }
  if (id === 'evcar'){ if (typeof evGuide === 'function') evGuide(); return; }
  if (id === 'place'){ const p = actPlaceObj(); if (p) UI.waypoint = {x:p.x, y:p.y, label:p.name}; return; }
  const o = actGiverObj(id); if (o) UI.waypoint = {x:o.x, y:o.y, label:ACT_WHO[id] || o.name};
}
/* 화면 위 목표 줄 */
function actObjective(){
  if (!SAVE.met || !SAVE.met.volt) return '<b>시작</b> AI 연구소 앞의 볼트 박사와 이야기하기';
  const a = actCur();
  if (!a) return SAVE.story.finale ? '<b>점등식 성공!</b> 모든 활동을 마쳤어요. [📘 활동]에서 다시 해 볼 수 있어요.' : '<b>모든 활동 완료!</b> 곧 점등식이 시작돼요.';
  const id = actGiverNow(), who = id === 'evcar' ? '달리는 초록 전기차를 붙잡기' : id === 'place' ? `📍 ${a.placeName}(으)로 가서 E` : `${ACT_WHO[id]}에게 말 걸기`;
  return `<b>활동 ${actIdx() + 1}/${ACTS.length}</b> ${a.icon} ${esc(a.title)} · ${id === 'place' ? '' : '👤 '}${who}`;
}

/* 활동 길이 켜져 있나 (로그인한 학생이 이야기 마을에서 볼트 박사를 만난 뒤) */
const actChainOn = () => !!(WORLD && WORLD.kind === 'story' && SAVE.met && SAVE.met.volt);
function actOf(g, s){ return ACTS.find(a => a.games && a.games.some(([x, y]) => x === g && y === s)); }
function actSameAct(g, s1, s2){ const a = actOf(g, s1), b = actOf(g, s2); return !!a && a === b; }
/* 끝낸 활동 다시 하기: 그 활동의 단계만 */
function actReplay(a){
  if (!a.games) return;
  if (a.games.length === 1){ MG.from = 'act'; mgStart(a.games[0][0], a.games[0][1]); return; }
  const p = openPanel(`<h2>${a.icon} ${esc(a.title)} 다시 하기</h2><p class="sub">📘 ${esc(a.book)}</p>
    <div class="row" style="gap:8px">${a.games.map(([g, s]) => { const d = mgDef(g); return `<button class="btn" data-rp="${g}:${s}">${d.icon} ${esc(d.title)}${d.single ? '' : ` ${s + 1}단계`} ${boltsHTML(mgBolts(g, s))}</button>`; }).join('')}</div>`);
  p.querySelectorAll('[data-rp]').forEach(b => b.onclick = () => { const [g, s] = b.dataset.rp.split(':'); MG.from = 'act'; mgStart(g, +s); });
}

/* ----- 활동 시작 ----- */
function actLaunch(a){
  if (a.ev){ closePanelSilently(); if (MODE !== 'play') enterStory(); evGuide(); return; }
  const next = a.games.find(([g, s]) => !(g === 'crane' ? actDone(a) : mgCleared(g, s))) || a.games[0];
  const [g, s] = next;
  if (!mgOpen(g, s)){ mgOpenGame(g); return; }
  MG.from = 'act'; mgStart(g, s);
}
/* 맡은 사람에게 말을 걸었을 때 */
function actTalk(a, o){
  const started = a.games && a.games.some(([g, s]) => mgCleared(g, s));
  const lines = (started ? [`${a.title}, 이어서 해 볼까?`] : a.intro).map(t => ({who:o.name, text:t}));
  lines.push({who:o.name, text:`📘 교과서 활동 · ${a.book}`});
  lines.push({who:o.name, text:`📍 ${a.placeName}(으)로 가 봐요. 그 앞에서 E(또는 살펴보기)를 누르면 시작돼요. 노란 화살표와 바닥의 빛나는 동그라미가 길을 알려 줄 거예요!`, choices:[
    {label:'알겠어요, 가 볼게요!', fn:() => { const S = actState(); S.told = S.told || {}; S.told[a.id] = true; persist(); }},
    {label:'어디라고요? 다시 말해 주세요', next:[{who:o.name, text:`${a.placeName}이에요. 화살표를 따라가요!`}], fn:() => { const S = actState(); S.told = S.told || {}; S.told[a.id] = true; persist(); }},
  ]});
  showDialog(o.name, lines, () => { actWaypoint(); updateHUD(); if (actTold(a)) toast(`📍 ${a.placeName}(으)로 가요!`, 'ok'); });
}
/* 마을의 장소(게임기 · 실험대 · 컴퓨터 …)에서 E를 눌렀을 때 */
function actAtPlace(objId){
  const A = ACTS.find(a => a.place === objId);
  if (!A) return false;
  if (actDone(A)){ actReplay(A); return true; }
  const cur = actCur();
  if (!cur || cur.id !== A.id){
    const id = actGiverNow();
    showDialog('안내', [cur ? `아직 이 활동 차례가 아니에요. 지금은 「${cur.title}」 차례예요. ${id === 'evcar' ? '달리는 초록 전기차를 붙잡아요!' : id === 'place' ? `${cur.placeName}(으)로 가요.` : `${ACT_WHERE[id]}의 ${ACT_WHO[id]}에게 가 봐요.`}` : '먼저 AI 연구소 앞의 볼트 박사와 이야기해요.'], () => actWaypoint());
    return true;
  }
  if (!actTold(A)){
    showDialog('안내', [`여기가 「${A.title}」 하는 곳이에요. 먼저 ${ACT_WHERE[A.giver]}의 ${ACT_WHO[A.giver]}에게 이야기를 들어요!`], () => { const o = actGiverObj(A.giver); if (o) UI.waypoint = {x:o.x, y:o.y, label:ACT_WHO[A.giver]}; });
    return true;
  }
  UI.waypoint = null; actLaunch(A); return true;
}
/* 맡은 사람이 아닌 사람에게 말을 걸면, 하던 말 끝에 지금 만날 사람을 알려 준다 */
function actHintLine(o){
  const a = actCur(); if (!a) return null;
  const id = actGiverNow(); if (id === o.id) return null;
  if (id === 'place') return {who:o.name, text:`「${a.title}」 하러 가는 중이지? ${a.placeName}(으)로 가 봐요!`};
  if (id === 'evcar') return {who:o.name, text:'지금은 도로를 달리는 초록 전기차를 붙잡아 운전자의 이야기를 들어 볼 차례예요. 차 앞은 위험하니 옆이나 뒤에서!'};
  return {who:o.name, text:`지금 할 활동은 「${a.title}」이에요. ${ACT_WHERE[id] ? ACT_WHERE[id] + '의 ' : ''}${ACT_WHO[id]}에게 가 봐요!`};
}

/* ----- 활동을 끝냈을 때: 맡은 사람이 정리 → 확인 질문 → 다음 사람 안내 ----- */
function actSync(){
  const S = actState(), i = actIdx();
  if (S.idx == null || !SAVE.met || !SAVE.met.volt){ S.idx = i; return; }
  if (i > S.idx){
    const doneAct = ACTS[S.idx] && actDone(ACTS[S.idx]) ? ACTS[S.idx] : ACTS[i - 1];   /* 방금 끝낸 활동 (전기차처럼 미리 해 둔 활동은 건너뛴다) */
    S.idx = i; persist();
    if (SAVE.story && Array.isArray(SAVE.story.queue)) storyEnqueue('act:' + doneAct.id);
  } else if (i < S.idx) S.idx = i;
}
function actDoneBeat(id){
  const a = actById(id); if (!a) return;
  const whoId = a.ev ? 'evdriver' : a.giver, who = ACT_WHO[whoId];
  const lines = [{who, text:`🎉 「${a.title}」 활동 완료!`}, ...a.done.map(t => ({who, text:t}))];
  if (a.check){
    const c = a.check;
    lines.push({who, text:`확인 질문! ${c.q}`, choices:c.o.map((op, k) => ({label:op, fn:() => { const r = actState(); r.check = r.check || {}; if (r.check[a.id] == null) r.check[a.id] = k === c.a; persist(); k === c.a ? SND.ok() : SND.bad(); },
      next:[{who, text:`${k === c.a ? '⭕ 맞아요!' : '❌ 아쉬워요.'} ${c.why}`}]}))});
  }
  const nx = actCur(), nid = actGiverNow();
  if (nx){
    lines.push({who, text:nid === 'evcar' ? '👉 다음 활동: 「' + nx.title + '」 — 도로를 달리는 초록 전기차를 옆이나 뒤에서 붙잡아요!' : `👉 다음 활동: 「${nx.title}」 — ${ACT_WHERE[nid]}의 ${josa(ACT_WHO[nid], '을', '를')} 만나요! 노란 화살표를 따라가요.`});
  }
  showDialog(who, lines, () => { actWaypoint(); updateHUD(); });
}

/* ----- 활동 목록 (Q) ----- */
function openActs(){
  const i = actIdx(), met = SAVE.met && SAVE.met.volt;
  const row = (a, k) => {
    const done = actDone(a), cur = met && k === i, lock = !done && !cur;
    const who = a.ev ? '전기차 운전자 → 시장님' : ACT_WHO[a.giver];
    return `<div class="act-row ${done ? 'done' : ''} ${cur ? 'cur' : ''} ${lock ? 'lock' : ''}">
      <div class="act-n">${done ? '✅' : cur ? '▶' : '🔒'}</div>
      <div class="act-b"><b>${k + 1}. ${a.icon} ${esc(a.title)}</b>${a.ai ? ' <span class="ls-star">AI 개발</span>' : ''}<p>📘 ${esc(a.book)}</p><small>👤 ${esc(who)}</small></div>
      <div class="act-r">${done && a.games ? `<button class="btn small" data-replay="${a.id}">다시 하기</button>` : cur && MODE === 'play' ? '<button class="btn small primary" data-go>길 안내</button>' : ''}</div></div>`;
  };
  const p = openPanel(`<h2>📘 활동</h2>
    <p class="sub">교과서 활동 순서대로 하나씩 해요. <b>맡은 사람(👤)에게 말을 걸면</b> 활동할 장소를 알려 줘요. 그 장소까지 걸어가 E를 누르면 시작되고, 끝나면 다음에 만날 사람을 알려 줘요. 다음 사람은 머리 위에 <b>!</b>가 뜨고 폴짝폴짝 뛰어요.</p>
    ${met ? '' : '<div class="okbox" style="margin-bottom:10px">먼저 AI 연구소 앞의 <b>볼트 박사</b>와 이야기해요.</div>'}
    <div class="act-list">${ACTS.map(row).join('')}</div>
    ${met && typeof evQuestCard === 'function' ? evQuestCard() : ''}
    <div class="row" style="margin-top:12px;gap:8px"><button class="btn" id="actRec">🗂️ 배움 기록</button></div>`, {wide:true});
  const eg = p.querySelector('#evGo'); if (eg) eg.onclick = () => { closePanel(); evGuide(); };
  p.querySelectorAll('[data-replay]').forEach(b => b.onclick = () => actReplay(actById(b.dataset.replay)));
  const go = p.querySelector('[data-go]'); if (go) go.onclick = () => { closePanel(); actWaypoint(); toast('노란 화살표를 따라가요!'); };
  p.querySelector('#actRec').onclick = openPortfolio;
}

/* ----- 미니 게임 결과 기록 (평가 증거) ----- */
function mgLogArr(){ if (!Array.isArray(SAVE.mgLog)) SAVE.mgLog = []; return SAVE.mgLog; }
const lsPlain = h => String(h || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const _actMgEnd = mgEnd;
mgEnd = function(bolts, msg, extra){
  const d = MG.cur, st = MG.st, ended = MG.ended;
  _actMgEnd(bolts, msg, extra);
  if (!d || ended) return;
  const log = mgLogArr();
  log.push({g:d.id, st, b:bolts, msg:lsPlain(msg).slice(0, 220), t:Date.now()});
  if (log.length > 150) log.splice(0, log.length - 150);
  persist();
};

/* ----- 배움 기록 ----- */
function portfolioText(){
  const lines = [`전기 마스터 타운 · 배움 기록`, `학생: ${ACC && ACC.label ? ACC.label : (SAVE.nickname || '')}`, `저장한 때: ${new Date().toLocaleString('ko-KR')}`, `레벨: Lv.${rpgLevel()} ${rpgTitle()}`, ''];
  const chk = actState().check || {}, log = mgLogArr();
  ACTS.forEach((a, k) => {
    const done = actDone(a);
    lines.push(`■ 활동 ${k + 1}. ${a.title} — ${done ? '완료' : k === actIdx() ? '하는 중' : '아직'}`);
    if (a.check && chk[a.id] != null) lines.push(`- 확인 질문: ${chk[a.id] ? '맞힘' : '틀림'} (${a.check.q})`);
    for (const [g, s] of a.games || []){
      const es = log.filter(e => e.g === g && e.st === s); if (!es.length) continue;
      const d = mgDef(g), last = es[es.length - 1];
      lines.push(`- ${d ? d.icon + ' ' + d.title + (d.single ? '' : ` ${s + 1}단계`) : g}: ${es.length}번 도전 · 최근 ⚡${last.b} ${last.msg}`);
    }
    if (a.id === 'a5'){ const runs = (SAVE.treeRuns || []).filter(t => t.kind === 'test'); if (runs.length) lines.push(`- 새 고철 시험: ${runs.length}번 · 처음 ${Math.round(runs[0].acc * 100)}% → 가장 좋을 때 ${Math.round(Math.max(...runs.map(x => x.acc)) * 100)}%`); }
    if (a.ev && SAVE.evq && SAVE.evq.step >= 2) lines.push(`- 시장님 설득: ${SAVE.evq.miss ? `다시 말한 횟수 ${SAVE.evq.miss}번` : '한 번에 성공'}`);
    lines.push('');
  });
  return lines.join('\n');
}
function portfolioHTMLDoc(){
  const body = esc(portfolioText()).replace(/^■ (.*)$/gm, '<h2>$1</h2>').replace(/\n/g, '<br>');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>배움 기록</title><style>body{font-family:system-ui,sans-serif;max-width:720px;margin:24px auto;padding:0 16px;line-height:1.7;color:#1c2733}h2{font-size:17px;margin:16px 0 4px;border-bottom:2px solid #f5c542}</style></head><body>${body}</body></html>`;
}
async function savePortfolio(){
  const name = `배움기록_${((ACC && ACC.label) || '학생').replace(/[^\w가-힣-]/g, '')}.html`;
  const blob = new Blob([portfolioHTMLDoc()], {type:'text/html'});
  const dl = await mgDownloads();
  if (dl){
    try { await dl.save({filename:name, data:blob}); toast('배움 기록을 저장했어요.', 'ok'); }
    catch (e){ if (!e || e.code !== 'declined') toast('이 화면에서는 저장할 수 없어요. [글 복사]를 써요.', 'bad'); }
    return;
  }
  if (window.claude) return toast('이 화면에서는 저장할 수 없어요. [글 복사]를 써요.', 'bad');
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('배움 기록 파일을 내려받았어요.', 'ok');
}
function openPortfolio(){
  const p = openPanel(`<h2>🗂️ 배움 기록</h2>
    <p class="sub">활동마다 확인 질문과 게임 결과가 모여요. <b>파일로 저장</b>하거나 <b>글 복사</b>로 패들렛에 제출해요.</p>
    <pre class="ls-pf">${esc(portfolioText())}</pre>
    <div class="row" style="gap:8px"><button class="btn primary" id="pfSave">💾 파일로 저장</button><button class="btn" id="pfCopy">📋 글 복사</button><button class="btn ghost" id="pfBack">← 활동 목록</button></div>`, {wide:true});
  p.querySelector('#pfSave').onclick = savePortfolio;
  p.querySelector('#pfCopy').onclick = () => cpCopy(portfolioText());
  p.querySelector('#pfBack').onclick = openActs;
}
