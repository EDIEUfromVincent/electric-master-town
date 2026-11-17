/* =========================================================
   5. RPG — 능력치 · 경험치 · 레벨, 가방(도구 장착), 돌아다니는 행인·동물과의 대화, 심부름
   선생님의 conservation-lab RPG와 같은 틀: 능력치 4개, 경험치가 쌓이면 레벨 업, 도구를 모아 장착,
   길가 친구와 이야기하고 맞히면 경험치, 도구는 '찾을 가능성(확률)'으로 얻는다.
   원칙: 확률은 도구 찾기에만 쓴다. 미션 성공·정답·평가에는 운이 끼어들지 않는다.
   ========================================================= */
const STATS = {
  em:  {name:'전자석 이해', short:'전자석', icon:'🧲', col:'#3ec6f0'},
  safe:{name:'안전 감각',   short:'안전',   icon:'🛡️', col:'#ff8a7a'},
  eco: {name:'절약 감각',   short:'절약',   icon:'🌱', col:'#5fd38d'},
  ai:  {name:'AI 다루기',   short:'AI',     icon:'🤖', col:'#b48cff'},
};
const STAT_KEYS = ['em', 'safe', 'eco', 'ai'];
const RPG_XP = {perStat:40, perLevel:60, talk:5, solve:10, quest:20};
const LV_TITLES = ['견습생', '꼬마 전기공', '전기 탐험가', '전자석 조수', '안전 지킴이', '에너지 지킴이', '전기 기술자', '전기 박사', '전기 영웅'];
const ITEMS = [
  {id:'coil',     name:'코일 뭉치',       stat:'em',   bonus:2, icon:'🌀', about:'에나멜선을 촘촘히 감은 코일이에요. 전자석의 심장!', from:'전자석 실험실 미션'},
  {id:'compass',  name:'나침반',          stat:'em',   bonus:1, icon:'🧭', about:'장착하면 아직 못 찾은 도감 기기 쪽을 화살표로 알려 줘요.', from:'역 앞 비둘기'},
  {id:'gloves',   name:'고무장갑',        stat:'safe', bonus:2, icon:'🧤', about:'전기가 잘 통하지 않는 고무로 만들었어요. 그래도 젖은 손으로는 만지면 안 돼요!', from:'꽃밭 고양이'},
  {id:'cover',    name:'콘센트 안전 덮개', stat:'safe', bonus:1, icon:'🔒', about:'안 쓰는 콘센트 구멍을 막아 어린 동생을 지켜요.', from:'광장 할머니의 심부름'},
  {id:'label',    name:'효율 등급 돋보기', stat:'eco',  bonus:1, icon:'🔍', about:'에너지 소비 효율 등급 라벨을 꼼꼼히 읽어요.', from:'꽃밭 다람쥐'},
  {id:'led',      name:'LED 손전등',      stat:'eco',  bonus:2, icon:'🔦', about:'적은 전기로 밝게! 장착하면 어두울 때 내 주변이 더 밝아져요.', from:'전기 기사의 심부름'},
  {id:'notebook', name:'데이터 공책',      stat:'ai',   bonus:1, icon:'📒', about:'AI에게 가르칠 예시를 고르게 모아 적어요.', from:'AI 크레인 두뇌 미션'},
  {id:'bibi',     name:'꼬마 로봇 삐삐',   stat:'ai',   bonus:2, icon:'🤖', about:'장착하면 삐삐가 졸졸 따라다녀요. 삐삐도 가끔 틀린대요!', from:'AI 연구소의 꼬마 로봇'},
];
const itemById = id => ITEMS.find(i => i.id === id);
/* '바른 사용' 장면이 어느 감각에 들어가는지 */
const GOOD_STAT = {s3:'safe', s10:'safe', s4:'eco', s7:'eco', s12:'eco'};
const sceneStat = s => s.label === 'danger' ? 'safe' : s.label === 'waste' ? 'eco' : (GOOD_STAT[s.id] || 'safe');

/* ----- 돌아다니는 친구들: 교과서 활동(효율 등급, LED, 플러그 뽑기, 젖은 손, 문어발, 안전 덮개,
         효율·안전하게 써야 하는 까닭, 교실 속 전자석, 공중 부양 제품, 전자석 기중기)과 이어진 질문 ----- */
const WALKERS = [
  {id:'w_cat', kind:'cat', name:'고양이 나비', home:[19.5, 12.5], r:2.2, stat:'safe', drop:'gloves', chance:.35,
   hi:'야옹~ 나는 꽃밭에 사는 나비야.', ask:'비를 맞아서 털이 다 젖었어. 저기 콘센트 옆 드라이어로 바로 말려도 될까?',
   choices:[['몸을 먼저 닦고, 손이 마른 사람에게 부탁해!', true], ['응, 젖은 채로 바로 꽂아도 돼!', false]],
   right:'야옹! 물이 묻으면 전기가 몸으로 잘 흘러서 감전될 수 있구나. 먼저 닦을게!', wrong:'으앗, 젖은 손이나 털로 전기 기구를 만지면 감전될 수 있대. 다시 생각해 줄래?'},
  {id:'w_dog', kind:'dog', name:'강아지 콩이', home:[45.5, 22.5], r:3, stat:'safe', bonus:15,
   hi:'멍멍! 나는 산책 중인 콩이야.', ask:'우리 집 멀티탭 하나에 전기난로랑 다리미랑 밥솥을 한꺼번에 꽂으려고 해. 괜찮을까?',
   choices:[['여러 콘센트에 나눠 꽂아야 해', true], ['한꺼번에 꽂을수록 편하지!', false]],
   right:'멍! 한꺼번에 많이 꽂으면 전선이 뜨거워져 불이 날 수 있구나. 나눠 꽂을게!', wrong:'멍? 하나의 콘센트에 여러 플러그를 꽂으면 전선이 뜨거워져 위험하대.'},
  {id:'w_squirrel', kind:'squirrel', name:'다람쥐 도토리', home:[23.5, 15.5], r:2, stat:'eco', drop:'label', chance:.35,
   hi:'찍찍! 도토리 모으느라 바빠.', ask:'도토리 창고에 아무도 없는데 불을 켜 두고 나왔어. 어떻게 하지?',
   choices:[['다시 가서 끄고, 안 쓰는 플러그는 뽑자', true], ['괜찮아, 그냥 켜 둬', false]],
   right:'찍! 쓰지 않을 때는 전원을 끄거나 플러그를 뽑아야 전기를 아낄 수 있구나.', wrong:'찍찍… 아무도 없는데 불을 켜 두면 전기가 낭비돼. 다시 골라 줄래?'},
  {id:'w_frog', kind:'frog', name:'개구리 퐁당', home:[20.5, 14.5], r:1.2, stat:'safe', bonus:15,
   hi:'개굴! 연못이 우리 집이야.', ask:'충전기를 뺄 때 선을 쭉 잡아당기면 빨리 빠지던데, 그래도 될까?',
   choices:[['플러그 머리를 잡고 똑바로 뽑아야 해', true], ['선을 잡아당기는 게 제일 빨라', false]],
   right:'개굴! 선을 당기면 전선 속이 끊어지거나 껍질이 벗겨져 위험하구나.', wrong:'개굴… 선을 잡아당기면 전선이 상해서 위험하대. 다시 생각해 볼래?'},
  {id:'w_bird', kind:'bird', name:'비둘기 구구', home:[37.5, 12.8], r:1.6, stat:'em', drop:'compass', chance:.35,
   hi:'구구! 고철장 구경하는 게 제일 재밌어.', ask:'크레인 끝의 둥근 판은 고철을 붙였다가 원하는 곳에 딱 떨어뜨려. 어떻게 그럴 수 있을까?',
   choices:[['전기가 흐를 때만 자석이 되니까 껐다 켰다 해서', true], ['아주 센 영구 자석이라서', false]],
   right:'구구! 전기를 끊으면 자석이 아니게 돼서 원하는 곳에 내려놓을 수 있구나.', wrong:'구구? 영구 자석이면 고철이 붙은 채 안 떨어질 거야. 다시 생각해 볼래?'},
  {id:'w_reporter', kind:'person', look:'reporter', name:'꼬마 기자 소리', home:[55.5, 26.5], r:1.8, stat:'em', bonus:15,
   hi:'안녕하세요! 마을 소식을 전하는 꼬마 기자 소리예요.', ask:'요즘 전자석으로 만든 공중 부양 제품이 인기래요! 물체를 공중에 띄우려면 전자석의 어떤 성질을 써야 할까요?',
   choices:[['극의 방향과 세기를 조절해 밀어내는 성질', true], ['아무 물체나 끌어당기는 성질', false]],
   right:'정답! 같은 극끼리 밀어내는 힘을 세기로 맞추면 물체가 둥실 떠요. 기사에 꼭 쓸게요!', wrong:'음… 전자석은 철 같은 물체만 끌어당겨요. 띄우려면 밀어내는 힘이 필요해요!'},
  {id:'w_student', kind:'person', look:'student', name:'친구 하랑', home:[8.5, 10.5], r:2.5, stat:'em', bonus:15,
   hi:'안녕! 나는 전자석 조사 숙제를 하는 하랑이야.', ask:'교실에 있는 컴퓨터랑 스마트 기기에도 전자석이 들어 있을까?',
   choices:[['응, 스피커나 진동 장치 같은 곳에 들어 있어', true], ['아니, 전자석은 공장에만 있어', false]],
   right:'와, 교실에도 전자석이 숨어 있구나! 조사한 걸 모둠 친구들과 나눠야지.', wrong:'그래? 컴퓨터 스피커에도 전자석이 있다던데… 다시 생각해 볼래?'},
  {id:'w_grandma', kind:'person', look:'grandma', name:'할머니', home:[50.5, 27.5], r:1.5, stat:'eco', quest:'q_cover', bonus:10,
   hi:'아이고, 반가워라. 이 할미가 물어볼 게 있단다.', ask:'냉장고를 새로 사려는데, 무엇을 보고 고르면 전기를 아낄 수 있을까?',
   choices:[['에너지 소비 효율 등급이 높은(1등급) 것', true], ['크기가 가장 큰 것', false]],
   right:'그렇지! 효율 등급이 높으면 같은 일을 해도 전기를 덜 쓴단다.', wrong:'글쎄다… 크다고 좋은 건 아니란다. 라벨의 효율 등급을 보렴.'},
  {id:'w_tech', kind:'person', look:'tech', name:'전기 기사 아저씨', home:[13.5, 27.5], r:1.5, stat:'safe', quest:'q_battery', bonus:10,
   hi:'안녕! 마을 전기를 고치는 전기 기사란다.', ask:'전기를 효율적이고 안전하게 써야 하는 까닭으로 알맞지 않은 것은?',
   choices:[['전기를 절약할 수 있어서', false], ['감전 사고나 화재를 막을 수 있어서', false], ['전기 기구를 빨리 망가뜨리려고', true]],
   right:'맞아! 까닭은 세 가지야. 전기를 절약하고, 감전·화재를 막고, 안전하고 지속가능한 사회를 만들기 위해서지.', wrong:'그것도 맞는 까닭이야. 알맞지 않은 하나를 골라 볼래?'},
  {id:'w_bibi', kind:'robot', name:'꼬마 로봇 삐삐', home:[39.5, 29.5], r:2, stat:'ai', drop:'bibi', chance:.3,
   hi:'삐빅! 나는 AI 연구소에서 공부하는 꼬마 로봇 삐삐!', ask:'나는 예시를 보고 배운 AI야. 내가 판단한 건 언제나 맞을까?',
   choices:[['아니, 틀릴 수 있으니 사람이 꼭 확인해야 해', true], ['응, AI는 절대 틀리지 않아', false]],
   right:'삐빅! 맞아. 배운 예시가 적거나 치우치면 나도 틀려. 그래서 사람이 확인해야 해!', wrong:'삐… 나도 자주 틀려. 배운 예시가 적거나 치우치면 더 그래!'},
];
const WALKER_ICON = {cat:'🐱', dog:'🐶', squirrel:'🐿️', frog:'🐸', bird:'🐦', robot:'🤖'};
const walkerIcon = d => d.kind === 'person' ? '🧑' : WALKER_ICON[d.kind] || '🙂';
const QUESTS = {
  q_cover:{giver:'w_grandma', giverName:'할머니', title:'할머니의 안전 덮개', need:1, icon:'🔒', pickName:'콘센트 안전 덮개', item:'cover', stat:'safe',
    start:['그런데 얘야, 손주가 놀러 오기로 했는데 꽃밭 어딘가에 콘센트 안전 덮개를 떨어뜨렸지 뭐냐.', '찾아다 주면 정말 고맙겠구나. 반짝이는 걸 찾아보렴!'],
    wait:() => '안전 덮개는 아직이니? 안전 마을 꽃밭 쪽에서 반짝이는 걸 찾아보렴.',
    done:['아이고, 찾아 줬구나! 안 쓰는 콘센트에 덮개를 꽂아 두면 아이들이 젓가락을 넣는 사고를 막을 수 있단다.', '고마움의 선물이야. 하나 더 있으니 너도 가지렴!'],
    spots:[[24.5, 16.6]]},
  q_battery:{giver:'w_tech', giverName:'전기 기사 아저씨', title:'다 쓴 건전지 모으기', need:3, icon:'🔋', pickName:'다 쓴 건전지', item:'led', stat:'eco',
    start:['부탁이 하나 있단다. 마을 곳곳에 다 쓴 건전지가 버려져 있어. 아무 데나 버리면 흙과 물이 오염되거든.', '3개를 찾아서 나한테 가져다줄래? 역 앞, 광장, 시험 마을 쪽을 살펴보렴.'],
    wait:n => `건전지 ${n}/3개 모았구나. 나머지도 찾아보렴! 역 앞, 광장, 시험 마을 쪽이야.`,
    done:['3개 모두 모았구나! 다 쓴 건전지는 수거함에 모아야 다시 쓸 수 있는 자원이 돼. 이런 작은 실천이 지속가능한 사회를 만든단다.', '고마워서 주는 선물이야. LED 손전등이란다!'],
    spots:[[34.5, 16.5], [57.5, 24.5], [5.5, 31.5]]},
};

/* ----- 상태 ----- */
const rpgDefault = () => ({xp:{em:0, safe:0, eco:0, ai:0}, items:[], equipped:{}, talked:{}, solved:{}, quests:{}, picked:{}, firsts:{}});
function rpgNormalize(){
  const d = rpgDefault(), r = SAVE.rpg && typeof SAVE.rpg === 'object' ? SAVE.rpg : {};
  SAVE.rpg = Object.assign(d, r);
  SAVE.rpg.xp = Object.assign({em:0, safe:0, eco:0, ai:0}, r.xp || {});
  for (const k of ['equipped', 'talked', 'solved', 'quests', 'picked', 'firsts']) if (!SAVE.rpg[k] || typeof SAVE.rpg[k] !== 'object') SAVE.rpg[k] = {};
  if (!Array.isArray(SAVE.rpg.items)) SAVE.rpg.items = [];
  SAVE.rpg.items = SAVE.rpg.items.filter(id => itemById(id));
}
const RPG = {silent:false};
const statLevel = k => 1 + Math.floor((SAVE.rpg.xp[k] || 0) / RPG_XP.perStat);
const equipBonus = k => { const it = itemById(SAVE.rpg.equipped[k]); return it && SAVE.rpg.items.includes(it.id) ? it.bonus : 0; };
const statVal = k => statLevel(k) + equipBonus(k);
const rpgTotal = () => STAT_KEYS.reduce((n, k) => n + (SAVE.rpg.xp[k] || 0), 0);
const rpgLevel = () => 1 + Math.floor(rpgTotal() / RPG_XP.perLevel);
const rpgProgress = () => (rpgTotal() % RPG_XP.perLevel) / RPG_XP.perLevel;
const rpgToNext = () => RPG_XP.perLevel - rpgTotal() % RPG_XP.perLevel;
const rpgTitle = (lv = rpgLevel()) => LV_TITLES[Math.min(LV_TITLES.length - 1, lv - 1)];
const hasItem = id => SAVE.rpg.items.includes(id);
const hasEquipped = id => { const it = itemById(id); return !!it && hasItem(id) && SAVE.rpg.equipped[it.stat] === id; };
const rpgSpeed = () => 1 + Math.min(.2, (rpgLevel() - 1) * .025);

/* ----- 얻은 것 알림 ----- */
function rpgToast(html, cls){
  const box = $('#rpgToasts'); if (!box) return;
  const t = document.createElement('div'); t.className = 'rpg-toast ' + (cls || ''); t.innerHTML = html;
  box.appendChild(t); setTimeout(() => t.remove(), 3800);
  while (box.children.length > 5) box.firstChild.remove();
}
let lvTimer = null;
function showLevelUp(lv){
  const el = $('#levelUp'); if (!el) return;
  el.querySelector('.lu-lv').textContent = `Lv.${lv}`; el.querySelector('.lu-tt').textContent = rpgTitle(lv);
  el.hidden = false; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  SND.fanfare(); clearTimeout(lvTimer); lvTimer = setTimeout(() => { el.hidden = true; }, 2800);
}
function award(stat, amt){
  if (!amt) return;
  const R = SAVE.rpg, lv0 = rpgLevel(), st0 = statLevel(stat);
  R.xp[stat] = (R.xp[stat] || 0) + amt; persist();
  if (!RPG.silent){
    rpgToast(`+${amt} XP · ${STATS[stat].icon} ${STATS[stat].name}`, 'xp');
    if (statLevel(stat) > st0) rpgToast(`${STATS[stat].icon} ${STATS[stat].name} <b>Lv.${statLevel(stat)}</b>!`, 'stat');
    if (rpgLevel() > lv0) showLevelUp(rpgLevel());
  }
  updateRpgHUD();
}
function rpgGive(id){
  const it = itemById(id), R = SAVE.rpg;
  if (!it || R.items.includes(id)) return false;
  R.items.push(id);
  if (equipBonus(it.stat) < it.bonus) R.equipped[it.stat] = id;
  persist();
  if (!RPG.silent) rpgToast(`<span class="ti">${it.icon}</span><span><b>새 도구!</b><br>${it.name} (${STATS[it.stat].short} +${it.bonus})</span>`, 'item');
  updateRpgHUD();
  return true;
}
/* 도구 찾기: 기본 가능성 + 그 능력치 × 6% (최대 90%). 이 게임에서 운이 들어가는 곳은 여기뿐이다 */
function rpgRoll(d){
  const chance = Math.min(.9, d.chance + statVal(d.stat) * .06), found = Math.random() < chance;
  rpgToast(`🎲 도구를 찾을 가능성 ${Math.round(chance * 100)}% → ${found ? '<b>찾았어요!</b>' : '이번엔 못 찾았어요. 다음에 또 말을 걸어 봐요!'}`, 'roll' + (found ? ' found' : ''));
  if (found) rpgGive(d.drop);
  return found;
}
/* 미션·도감·장면 판단으로 얻는 경험치(한 번씩). checkMasters()가 부른다 */
function rpgSync(silent){
  if (!SAVE.rpg) rpgNormalize();
  const R = SAVE.rpg, q = Q(); RPG.silent = !!silent;
  const once = (k, cond, fn) => { if (cond && !R.firsts[k]){ R.firsts[k] = 1; fn(); } };
  try {
    for (const d of DEVICES) once('dex:' + d.id, SAVE.dex[d.id] && SAVE.dex[d.id].done, () => award('em', 10));
    for (const s of SCENES){ const j = SAVE.judged[s.id]; once('sc:' + s.id, !!j, () => award(sceneStat(s), j.correct ? 8 : 3)); }
    once('m:em1', q.em1, () => { award('em', 20); rpgGive('coil'); });
    once('m:em2', q.em2, () => award('em', 20));
    once('m:em3', q.em3, () => { award('ai', 20); rpgGive('notebook'); });
    once('m:em4', q.em4, () => award('em', 15));
    once('m:es1', q.es1, () => { award('safe', 10); award('eco', 10); });
    once('m:es2', q.es2, () => award('ai', 20));
    once('m:es3', q.es3, () => award('ai', 20));
    for (let k = 1; k <= Math.min(3, SAVE.treeRuns.length); k++) once('tr' + k, true, () => award('ai', 5));
    for (let k = 1; k <= Math.min(3, SAVE.robotRuns.length); k++) once('rr' + k, true, () => award('ai', 8));
    once('maps', SAVE.maps.length > 0, () => award('ai', 10));
    once('fin', SAVE.story.finale, () => STAT_KEYS.forEach(k => award(k, 15)));
  } finally { RPG.silent = false; }
  updateRpgHUD();
}
function updateRpgHUD(){
  const b = $('#bBag'); if (!b || !SAVE.rpg) return;
  b.innerHTML = `🎒 Lv.${rpgLevel()}<i class="xpb"><i style="width:${Math.round(rpgProgress() * 100)}%"></i></i>`;
  b.title = `가방 (I) · Lv.${rpgLevel()} ${rpgTitle()} · 다음 레벨까지 ${rpgToNext()} XP`;
}

/* ----- 가방 ----- */
function openBag(){
  rpgSync();
  const R = SAVE.rpg, lv = rpgLevel();
  const statRows = STAT_KEYS.map(k => {
    const S = STATS[k], base = statLevel(k), plus = equipBonus(k), eq = R.equipped[k] && hasItem(R.equipped[k]) ? itemById(R.equipped[k]) : null;
    return `<div class="rstat"><span class="ri">${S.icon}</span><span class="rn">${S.name}</span><span class="rbar"><i style="width:${Math.min(100, base * 10)}%;background:${S.col}"></i><b style="width:${Math.min(100, plus * 10)}%"></b></span><strong>${base + plus}</strong><small>${eq ? `${eq.icon} ${esc(eq.name)} +${eq.bonus}` : ''}</small></div>`;
  }).join('');
  const slots = ITEMS.map(it => {
    const own = hasItem(it.id), on = R.equipped[it.stat] === it.id;
    return own ? `<button class="rslot${on ? ' on' : ''}" data-item="${it.id}"><span class="ricon">${it.icon}</span><b>${esc(it.name)}</b><small>${STATS[it.stat].icon} ${STATS[it.stat].short} +${it.bonus}${on ? ' · 장착 중' : ''}</small><span class="rabout">${esc(it.about)}</span></button>`
      : `<div class="rslot empty"><span class="ricon">?</span><b>아직 몰라요</b><small>힌트: ${esc(it.from)}</small></div>`;
  }).join('');
  const friends = WALKERS.map(d => `<span class="rfriend ${R.solved[d.id] ? 'ok' : R.talked[d.id] ? 'met' : ''}">${walkerIcon(d)} ${esc(d.name)}${R.solved[d.id] ? ' ✓' : ''}</span>`).join('');
  const quests = Object.entries(QUESTS).map(([qid, q]) => { const st = R.quests[qid]; return `<div class="rquest">${q.icon} <b>${esc(q.title)}</b> · ${st === 'done' ? '✅ 완료' : st === 'active' ? `진행 중 (${questCount(qid)}/${q.need})` : `${esc(josa(q.giverName, '을', '를'))} 도우면 시작돼요`}</div>`; }).join('');
  const p = openPanel(`<h2>🎒 가방</h2>
    <div class="rhead"><b>Lv.${lv} ${rpgTitle(lv)}</b><span class="rxp"><i style="width:${Math.round(rpgProgress() * 100)}%"></i></span><small>다음 레벨까지 ${rpgToNext()} XP · 레벨이 오를수록 걸음이 조금씩 빨라져요</small></div>
    <h3>능력치</h3><div class="rstats">${statRows}</div>
    <h3>도구 <small style="font-size:13px;color:var(--text-dim)">누르면 장착해요 · 능력치마다 하나씩</small></h3><div class="rgrid">${slots}</div>
    <h3>도와준 친구 ${WALKERS.filter(d => R.solved[d.id]).length}/${WALKERS.length}</h3><div class="rfriends">${friends}</div>
    <h3>심부름</h3>${quests}
    <p class="note">경험치는 미션·도감·장면 판단·친구 돕기로 얻어요. 도구를 찾을 때만 운(확률)이 들어가고, 미션 성공과 점수에는 운이 끼어들지 않아요.</p>`, {wide:true});
  p.querySelectorAll('[data-item]').forEach(b => b.onclick = () => {
    const it = itemById(b.dataset.item); R.equipped[it.stat] = R.equipped[it.stat] === it.id ? null : it.id;
    persist(); SND.tick(); updateRpgHUD(); openBag();
  });
}

/* ----- 돌아다니는 친구들 ----- */
function initWalkers(world){
  world.walkers = world.kind === 'story' ? WALKERS.map(d => ({type:'walker', id:d.id, def:d, name:d.name, x:d.home[0] - .5, y:d.home[1] - .5, tx:null, ty:null, wait:Math.random() * 2, ry:0, walk:0, moving:false})) : [];
}
const walkerHidden = w => w.def.drop === 'bibi' && hasEquipped('bibi');
function walkOK(x, y){
  const tx = Math.floor(x), ty = Math.floor(y), ch = tileAt(tx, ty);
  return !!ch && (ch !== '=' || onCrosswalk(x, y)) && !solidAt(tx, ty);
}
function pickWalkTarget(w){
  /* 맵 여기저기: 먼 곳을 골라 길을 따라 간다 (가끔은 근처만 어슬렁) */
  if (Math.random() < .75 && typeof npcPath === 'function'){ const P = npcPath(Math.floor(w.x + .5), Math.floor(w.y + .5)); if (P && P.length){ w.path = P; w.tx = P[0].x; w.ty = P[0].y; return; } }
  const d = w.def, cx = w.x + .5, cz = w.y + .5;
  for (let k = 0; k < 10; k++){
    const a = Math.random() * Math.PI * 2, r = .4 + Math.random() * d.r, x = d.home[0] + Math.cos(a) * r, y = d.home[1] + Math.sin(a) * r;
    if (!walkOK(x, y)) continue;
    let ok = true; const n = Math.ceil(Math.hypot(x - cx, y - cz) / .3);
    for (let i = 1; i <= n && ok; i++) ok = walkOK(cx + (x - cx) * i / n, cz + (y - cz) * i / n);
    if (ok){ w.tx = x; w.ty = y; return; }
  }
  w.wait = 1.5;
}
function updateWalkers(dt){
  updatePeds(dt);
  const W = WORLD; if (!W || !W.walkers || !W.walkers.length) return;
  const talk = UI.dialog ? dialogNPC() : null;
  for (const w of W.walkers){
    if (walkerHidden(w)) continue;
    const cx = w.x + .5, cz = w.y + .5, dp = MODE === 'title' ? 99 : Math.hypot(player.x - cx, player.y - cz);
    if (dp < 2.4 || talk === w){ w.moving = false; w.ry = angLerp(w.ry || 0, Math.atan2(player.x - cx, player.y - cz), 1 - Math.pow(.003, dt)); continue; }
    if (w.wait > 0){ w.wait -= dt; w.moving = false; continue; }
    if (w.tx == null){ pickWalkTarget(w); if (w.tx == null) continue; }
    const dx = w.tx - cx, dz = w.ty - cz, d = Math.hypot(dx, dz), sp = (w.def.kind === 'person' ? 1.1 : w.def.kind === 'bird' ? 1.5 : 1.25) * dt;
    if (d < .08){
      if (w.path && w.path.length > 1){ w.path.shift(); w.tx = w.path[0].x; w.ty = w.path[0].y; continue; }
      w.path = null; w.tx = null; w.wait = 1.2 + Math.random() * 3; w.moving = false; continue;
    }
    const s = Math.min(sp, d), nx = cx + dx / d * s, nz = cz + dz / d * s;
    if (!walkOK(nx, nz)){ w.tx = null; w.path = null; w.wait = .8; continue; }
    w.x = nx - .5; w.y = nz - .5; w.moving = true; w.walk += dt;
    w.ry = angLerp(w.ry || 0, Math.atan2(dx, dz), 1 - Math.pow(.001, dt));
  }
}
/* 꼬마 로봇 삐삐: 장착하면 뒤에서 졸졸 따라온다 */
const PET = {x:0, y:0, ry:0, on:false};
function updatePet(dt){
  const on = hasEquipped('bibi') && WORLD && MODE !== 'title' && MODE !== 'editor' && MODE !== 'crane';
  if (!on){ PET.on = false; return; }
  const a = player.ang || 0, bx = player.x - Math.sin(a) * .95 + Math.cos(a) * .35, by = player.y - Math.cos(a) * .95 - Math.sin(a) * .35;
  if (!PET.on){ PET.x = bx; PET.y = by; PET.on = true; }
  const k = 1 - Math.pow(.03, dt), ox = PET.x, oy = PET.y;
  PET.x += (bx - PET.x) * k; PET.y += (by - PET.y) * k;
  if (Math.hypot(PET.x - ox, PET.y - oy) > .002) PET.ry = angLerp(PET.ry, Math.atan2(PET.x - ox, PET.y - oy), .3);
}
function walkerBubble(w){
  const R = SAVE.rpg, q = w.def.quest && QUESTS[w.def.quest];
  if (q && R.quests[w.def.quest] === 'active') return questCount(w.def.quest) >= q.need ? '★' : '…';
  return R.solved[w.def.id] ? null : '💬';
}

/* ----- 대화 ----- */
function talkWalker(w){
  const d = w.def, R = SAVE.rpg, first = !R.talked[d.id], L = t => ({who:d.name, text:t});
  const qid = d.quest, q = qid && QUESTS[qid];
  if (q && R.quests[qid] === 'active'){
    const got = questCount(qid);
    if (got >= q.need) return showDialog(d.name, q.done.map(L), () => completeQuest(qid));
    return showDialog(d.name, [L(q.wait(got))]);
  }
  let result = null;
  const greet = first ? d.hi : R.solved[d.id] ? (d.drop && !hasItem(d.drop) ? '또 왔구나! 한 번 더 물어봐도 될까?' : '또 만났네! 다시 한번 확인해 볼까?') : d.hi;
  const lines = [L(greet), {who:d.name, text:d.ask, choices:d.choices.map(([label, ok]) => ({label, next:[L(ok ? d.right : d.wrong)], fn:() => { result = ok; }}))}];
  showDialog(d.name, lines, () => {
    if (first){ R.talked[d.id] = 1; award(d.stat, RPG_XP.talk); }
    if (result){
      if (!R.solved[d.id]){ R.solved[d.id] = 1; award(d.stat, d.bonus || RPG_XP.solve); }
      if (d.drop && !hasItem(d.drop)) rpgRoll(d);
      if (q && !R.quests[qid]) showDialog(d.name, q.start.map(L), () => startQuest(qid));
    }
    persist(); updateRpgHUD();
  });
}
function questCount(qid){ return QUESTS[qid].spots.filter((s, i) => SAVE.rpg.picked[qid + i]).length; }
function startQuest(qid){ SAVE.rpg.quests[qid] = 'active'; persist(); toast(`📜 심부름 시작: ${QUESTS[qid].title}`, 'ok'); }
function completeQuest(qid){
  const q = QUESTS[qid]; if (SAVE.rpg.quests[qid] === 'done') return;
  SAVE.rpg.quests[qid] = 'done'; persist(); SND.fanfare();
  award(q.stat, RPG_XP.quest); rpgGive(q.item);
}
function questPickups(){
  const out = [];
  if (!WORLD || WORLD.kind !== 'story' || !SAVE.rpg) return out;
  for (const [qid, q] of Object.entries(QUESTS)) if (SAVE.rpg.quests[qid] === 'active') q.spots.forEach((s, i) => { if (!SAVE.rpg.picked[qid + i]) out.push({qid, i, x:s[0], y:s[1], icon:q.icon}); });
  return out;
}
function checkPickups(){
  for (const p of questPickups()){
    if (Math.hypot(player.x - p.x, player.y - p.y) > .85) continue;
    SAVE.rpg.picked[p.qid + p.i] = 1; persist(); SND.ok();
    const q = QUESTS[p.qid], n = questCount(p.qid);
    toast(n >= q.need ? `${q.icon} ${josa(q.pickName, '을', '를')} 모두 찾았어요! ${q.giverName}에게 돌아가요.` : `${q.icon} ${josa(q.pickName, '을', '를')} 주웠어요! (${n}/${q.need})`, 'ok');
  }
}

/* ----- 3D 모형: 동물 (앞이 +z) ----- */
function mkAnimal(kind){
  const b = new VB(), B = (x0, y0, z0, x1, y1, z1, c) => vbBox(b, x0, y0, z0, x1, y1, z1, c);
  const eyes = (y, z, w = .07) => { B(-.13, y, z, -.13 + w, y + .07, z + .015, '#1d2a2a'); B(.13 - w, y, z, .13, y + .07, z + .015, '#1d2a2a'); };
  if (kind === 'cat'){
    for (const [x, z] of [[-.13, -.26], [.13, -.26], [-.13, .26], [.13, .26]]) B(x - .06, 0, z - .06, x + .06, .26, z + .06, '#f4f1ea');
    B(-.2, .24, -.4, .2, .56, .4, '#e08a3c'); B(-.205, .5, -.2, .205, .56, -.12, '#b8692a'); B(-.205, .5, .06, .205, .56, .14, '#b8692a');
    B(-.21, .46, .3, .21, .84, .66, '#e08a3c'); B(-.2, .84, .4, -.08, .98, .54, '#e08a3c'); B(.08, .84, .4, .2, .98, .54, '#e08a3c');
    B(-.12, .52, .66, .12, .62, .68, '#f4f1ea'); eyes(.68, .66); B(-.035, .46, -.62, .035, .92, -.55, '#e08a3c');
  } else if (kind === 'dog'){
    for (const [x, z] of [[-.13, -.26], [.13, -.26], [-.13, .26], [.13, .26]]) B(x - .07, 0, z - .07, x + .07, .3, z + .07, '#8a5a34');
    B(-.22, .28, -.42, .22, .62, .42, '#c48a52'); B(-.2, .5, .32, .2, .9, .66, '#c48a52'); B(-.1, .54, .66, .1, .7, .82, '#e8c69c');
    B(-.04, .66, .82, .04, .72, .84, '#1d2a2a'); eyes(.76, .66); B(-.26, .62, .38, -.18, .9, .52, '#6b4526'); B(.18, .62, .38, .26, .9, .52, '#6b4526');
    B(-.04, .58, -.6, .04, .9, -.5, '#c48a52');
  } else if (kind === 'squirrel'){
    for (const x of [-.09, .09]) B(x - .05, 0, .02, x + .05, .16, .14, '#7e4a2a');
    B(-.15, .14, -.2, .15, .48, .2, '#a0633a'); B(-.14, .44, .08, .14, .7, .32, '#a0633a'); B(-.13, .7, .1, -.05, .8, .18, '#a0633a'); B(.05, .7, .1, .13, .8, .18, '#a0633a');
    eyes(.58, .32, .05); B(-.13, .3, -.42, .13, .8, -.2, '#c27d47'); B(-.13, .72, -.36, .13, .92, -.14, '#c27d47');
  } else if (kind === 'bird'){
    for (const x of [-.07, .07]) B(x - .025, 0, -.02, x + .025, .14, .02, '#e08a3c');
    B(-.16, .14, -.24, .16, .42, .2, '#8d96a3'); B(-.13, .38, .08, .13, .6, .3, '#8d96a3'); B(-.05, .45, .3, .05, .5, .4, '#f2b632');
    B(-.12, .5, .3, -.06, .55, .305, '#1d2a2a'); B(.06, .5, .3, .12, .55, .305, '#1d2a2a');
    B(-.19, .18, -.16, -.16, .38, .14, '#5d6670'); B(.16, .18, -.16, .19, .38, .14, '#5d6670'); B(-.1, .2, -.36, .1, .26, -.22, '#8d96a3');
    B(-.165, .3, .1, .165, .36, .2, '#6fae8f');
  } else { // frog
    B(-.26, 0, -.24, .26, .24, .24, '#4f9a4a'); for (const x of [-.15, .15]){ B(x - .08, .2, .06, x + .08, .34, .2, '#4f9a4a'); B(x - .04, .26, .2, x + .04, .32, .21, '#1d2a2a'); }
    B(-.16, .1, .24, .16, .13, .25, '#2f6a2c'); B(-.36, 0, -.18, -.24, .1, .1, '#3f8a3a'); B(.24, 0, -.18, .36, .1, .1, '#3f8a3a');
  }
  return b.mesh();
}
function animal3(kind, x, y, z, ry, walk, t){
  const hop = walk ? Math.abs(Math.sin(walk * (kind === 'frog' ? 7 : 12))) * (kind === 'frog' ? .18 : .05) : 0;
  drawM(model('an:' + kind, () => mkAnimal(kind)), M4.trs(x, y + hop, z, ry));
  SHADOWS.push([x, y, z, kind === 'dog' || kind === 'cat' ? .4 : .26]);
}
function drawRpg3D(t){
  const W = WORLD;
  for (const w of (W.walkers || [])){
    if (walkerHidden(w)) continue;
    const cx = w.x + .5, cz = w.y + .5, gy = surfY(cx, cz), walk = w.moving ? w.walk : 0;
    const hop = w.hop > 0 ? Math.sin((1 - w.hop / w.hopT) * Math.PI) * w.hopH : 0;   /* 부딪혀서 깡충 · 날아오름 */
    if (w.def.kind === 'person') person3(w.def.look, cx, gy + hop, cz, w.ry || 0, walk);
    else if (w.def.kind === 'robot') robot3(cx, gy + hop, cz, w.ry || 0, t, .62);
    else animal3(w.def.kind, cx, gy + hop, cz, w.ry || 0, hop ? 0 : walk, t);
  }
  for (const p of questPickups()){
    const gy = surfY(p.x, p.y);
    sprAdd(p.x, gy + .6 + Math.sin(t * 3 + p.i) * .08, p.y, iconBadge('pick', p.icon), .3);
    SHADOWS.push([p.x, gy, p.y, .22]);
  }
  if (PET.on) robot3(PET.x, surfY(PET.x, PET.y), PET.y, PET.ry, t, .5);
  drawPeds3D(t);
  epiTownDraw(t);
}
/* 2D 화면(3D를 못 쓸 때)에서 친구들 그리기 */
function rpgEnts2D(S, list, x0, x1, y0, y1){
  pedEnts2D(S, list);
  for (const w of (WORLD.walkers || [])){
    if (walkerHidden(w) || w.x < x0 - 2 || w.x > x1 + 2 || w.y < y0 - 2 || w.y > y1 + 2) continue;
    const px = (w.x + .5) * S, py = (w.y + .82) * S;
    if (w.def.kind === 'person'){ const dir = Math.abs(Math.sin(w.ry)) > .7 ? (Math.sin(w.ry) > 0 ? 'right' : 'left') : (Math.cos(w.ry) < 0 ? 'up' : 'down'); list.push({y:w.y + .8, f:() => drawPerson(px, py, S, w.def.look, dir, w.moving ? w.walk : 0)}); }
    else list.push({y:w.y + .8, f:() => { drawShadow(px, py - S * .05, S, .26); drawEmoji(WALKER_ICON[w.def.kind] || '🙂', px, py - S * .35, S * .62); }});
  }
  for (const p of questPickups()) list.push({y:p.y, f:() => drawEmoji(p.icon, p.x * S, (p.y - .2) * S + Math.sin(TIME * 3 + p.i) * 3, S * .5)});
}
