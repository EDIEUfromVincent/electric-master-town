/* =========================================================
   🛠️ a11 스마트 기기 설계실 (EM 재설계 P4 · X2~X3 · Y3 교과 + AI 지식 창출 · 선택 활동)
   Z1 민원 카드 고르기 → Z2 필요한 전자석 성질 → Z3 감지(센서 · 인식) → 판단(예/아니요 질문 길 · 표현·추론) → 행동(전자석)
   → Z4 처음 보는 장면 8개로 시험(상호작용 · 정확도와 전기 사용량) → Z5 성찰(틀린 까닭 · 센서가 틀리면 · 설계 한 문장 · 확장 질문, 사회적 영향)
   · 질문 길 모양(slBlank · slNodes · slPos · sl3Pos · sl3W · mkSlideRoom3)은 a5 질문 미끄럼틀과 같은 것을 빌려 쓰고, a5 코드는 바꾸지 않는다
   · 센서 값이 '?'(고장 · 못 읽음)이면 모든 질문의 답은 '아니요'로 간다 → '아니요' 쪽이 안전하도록 질문을 고르는 것도 설계의 한 부분
   · 결과는 선택 배지 'AI 발명가'(SAVE.badges.inventor) · 캠페인 갤러리 · 판단 기록(a11.*)으로만 남는다.
     ACTS(활동 1~10) · 전자석 배지 · 인증서 · 차시 완료 조건은 바꾸지 않는다 (배치와 필수 여부는 교사 확인 뒤)
   ========================================================= */
const DS_SENSORS = {
  camera:{icon:'📷', name:'카메라', sub:'사람·동물·물건을 구별하고 표지를 읽어요', c:'#2f74c0'},
  distance:{icon:'📏', name:'거리 센서', sub:'얼마나 가까운지 재요', c:'#1f8a4c'},
  weight:{icon:'⚖️', name:'무게 센서', sub:'무거운지, 한쪽으로 쏠렸는지 재요', c:'#c4621f'},
  height:{icon:'📐', name:'높이 센서', sub:'높이나 물 높이를 재요', c:'#6b7a8f'},
  power:{icon:'🔌', name:'정전 감지기', sub:'전기가 끊겼는지 알아채요', c:'#b8862b'},
  door:{icon:'🚪', name:'문 센서', sub:'문이 닫혔는지 알아채요', c:'#8456c2'},
  place:{icon:'📍', name:'위치 센서', sub:'지금 어디에 있는지 알아채요', c:'#2a9d8f'},
};
/* 행동: use = 전기 사용량(전지 칸). 극 바꾸기는 약한 세기로 반대로 도는 것으로 친다 */
const DS_ACT = {
  off:{t:'끄기 · 멈추기', short:'끄기', c:'#5b6573', use:0},
  weak:{t:'약하게 (전지 1개)', short:'약하게', c:'#1f8a4c', use:1},
  strong:{t:'세게 (전지 2개)', short:'세게', c:'#c4621f', use:2},
  flip:{t:'극 바꾸기 (반대로)', short:'반대로', c:'#8456c2', use:1},
};
/* 민원 카드 (교사 검토용 초안 · docs/science-review.md 26~30번)
   needProps = Z2 정답 집합, okProps = 골라도 감점하지 않는 성질, questions[].f(read) = 센서 값으로 예/아니요, best = 모범 설계(검사 스크립트가 8개 모두 맞는지 본다) */
const DESIGN_CARDS = [
  {id:'d_fan', giver:'sun', icon:'🌀', title:'알아서 바람 세기를 바꾸는 선풍기',
   problem:'우리 할머니는 선풍기 앞에 가까이 앉으시면 바람이 너무 세서 추워하셔. 멀리 계실 때는 시원하게, 아무도 없을 때는 꺼지면 좋겠어.',
   examples:['할머니가 바로 앞에 앉으심 → 약하게', '할머니가 멀리 소파에 계심 → 세게', '아무도 없음 → 끄기'],
   needProps:['power'], okProps:['pole'],
   propWhy:{power:'가까우면 약하게, 멀면 세게 — 전자석의 세기로 바람 세기를 바꿔요.', pole:'선풍기 전동기 안에서는 극이 계속 바뀌며 돌아요. 하지만 이번 문제(바람 세기)를 푸는 열쇠는 세기예요.', onoff:'선풍기를 끄는 건 스위치로 전기를 끊는 일이에요. 붙였다 떼는 전자석의 ‘켜고 끄기’ 성질을 쓰는 건 아니에요.'},
   sensors:['distance', 'camera', 'weight', 'power'], maxSensors:2,
   questions:[
     {id:'person', s:'camera', text:'앞에 있는 것이 사람인가요?', cond:'앞에 사람이 있음', f:r => r.person === true},
     {id:'near', s:'distance', text:'1m 안으로 가까운가요?', cond:'사람이 1m 안으로 가까이 있음', f:r => typeof r.dist === 'number' && r.dist < 1},
     {id:'far', s:'distance', text:'1m보다 먼가요?', cond:'사람이 1m보다 멀리 있음', f:r => typeof r.dist === 'number' && r.dist > 1},
     {id:'top', s:'weight', text:'선풍기 위에 무거운 것이 올려져 있나요?', cond:'선풍기 위의 무거운 물건', f:r => r.top === true},
     {id:'blackout', s:'power', text:'정전인가요?', cond:'정전', f:r => r.blackout === true}],
   actions:['off', 'weak', 'strong'],
   scenarios:[
     {icon:'👵', desc:'할머니가 50cm 앞에 앉으심', read:{person:true, dist:0.5}, expect:'weak'},
     {icon:'🛋️', desc:'할머니가 3m 떨어진 소파에 계심', read:{person:true, dist:3}, expect:'strong'},
     {icon:'🌙', desc:'아무도 없는 방', read:{person:false, dist:null}, expect:'off'},
     {icon:'🐱', desc:'고양이가 1.2m 앞을 지나감', read:{person:false, dist:1.2}, expect:'off', note:'사람이 아니면 바람이 필요 없어요'},
     {icon:'✏️', desc:'아이가 30cm 앞에서 숙제를 함', read:{person:true, dist:0.3}, expect:'weak'},
     {icon:'📺', desc:'할머니가 2m 거리에서 텔레비전을 보심', read:{person:true, dist:2}, expect:'strong'},
     {icon:'❓', desc:'거리 센서가 먼지로 가려져 값이 ?, 할머니가 앉아 계심', read:{person:true, dist:'?'}, expect:'weak', note:'모르면 안전한 쪽(약하게)으로'},
     {icon:'💡', desc:'정전 뒤 다시 전기가 들어옴, 방에 아무도 없음', read:{person:false, dist:null}, expect:'off'}],
   best:{t:'q', q:'person', yes:{t:'q', q:'far', yes:{t:'a', a:'strong'}, no:{t:'a', a:'weak'}}, no:{t:'a', a:'off'}},
   hints:['아무도 없으면 바람이 필요 없어요. 먼저 <b>사람인지</b> 물어보면 어떨까요?', '고양이도 가까이 올 수 있어요. 거리만 물으면 고양이에게도 바람이 가요.', '센서 값이 ‘?’이면 질문의 답은 ‘아니요’가 돼요. ‘가까운가요?’와 ‘먼가요?’ 중 어느 쪽을 물어야 ‘?’일 때 약하게 갈까요?'],
   reflectQ:'카메라가 할머니를 사람으로 알아보지 못하면 어떤 일이 생길까? 사람이 무엇을 확인해야 할까?', ext:'aircon'},
  {id:'d_crane', giver:'boss', icon:'🏗️', title:'정전에도 안전한 고철장 크레인',
   problem:'정전이 나면 들고 있던 고철이 떨어질까 걱정이야. 크레인이 아래에 누가 있는지, 전기가 끊겼는지, 고철이 얼마나 무거운지 보고 알아서 전자석을 다루면 좋겠어.',
   examples:['무거운 철을 옮기는 중 → 세게', '정전! 아래에 아무도 없음 → 끄기(얼른 내려놓기)', '아래로 사람이 지나감 → 세게(절대 놓치지 않기)'],
   needProps:['onoff', 'power'], okProps:[],
   propWhy:{onoff:'고철을 내려놓으려면 전자석을 꺼서 자석의 성질을 없애요. 붙였다 떼는 ‘켜고 끄기’예요.', power:'무거운 고철은 세게, 가벼운 고철은 약하게 — 세기를 바꿔요.', pole:'철은 N극에도 S극에도 붙어요. 극의 방향을 바꿔도 고철을 드는 데는 달라지는 게 없어요.'},
   sensors:['camera', 'power', 'weight', 'distance'], maxSensors:3,
   questions:[
     {id:'life', s:'camera', text:'아래에 사람이나 동물이 있나요?', cond:'아래에 있는 사람이나 동물', f:r => r.life === true},
     {id:'blackout', s:'power', text:'정전인가요? (비상 배터리로 버티는 중)', cond:'정전', f:r => r.blackout === true},
     {id:'heavy', s:'weight', text:'무거운가요?', cond:'무거운 고철', f:r => r.weight === 'heavy'},
     {id:'light', s:'weight', text:'가벼운가요?', cond:'가벼운 고철', f:r => r.weight === 'light'},
     {id:'low', s:'distance', text:'땅에서 1m 안으로 낮게 들었나요?', cond:'낮게 든 고철', f:r => typeof r.h === 'number' && r.h < 1}],
   actions:['off', 'weak', 'strong'], actLabel:{off:'끄기 · 내려놓기'},
   scenarios:[
     {icon:'🔩', desc:'무거운 철 기둥을 옮기는 중, 아래에 아무도 없음', read:{weight:'heavy', life:false, blackout:false, h:2}, expect:'strong'},
     {icon:'🥫', desc:'가벼운 철 캔을 옮기는 중, 아래에 아무도 없음', read:{weight:'light', life:false, blackout:false, h:2}, expect:'weak'},
     {icon:'⚡', desc:'정전! 무거운 철을 든 채 비상 배터리로 버티는 중, 아래에 아무도 없음', read:{weight:'heavy', life:false, blackout:true, h:2}, expect:'off', note:'아무도 없을 때 얼른 내려놓아야 배터리가 닳기 전에 안전해요'},
     {icon:'🚶', desc:'정전! 비상 배터리로 버티는 중, 아래로 사람이 지나감', read:{weight:'light', life:true, blackout:true, h:2}, expect:'strong', note:'사람 위에서는 절대 놓지 않아요'},
     {icon:'👷', desc:'무거운 철을 옮기는데 아래로 일꾼이 지나감', read:{weight:'heavy', life:true, blackout:false, h:2}, expect:'strong'},
     {icon:'🐈', desc:'가벼운 철 캔을 옮기는데 아래로 고양이가 지나감', read:{weight:'light', life:true, blackout:false, h:2}, expect:'strong', note:'생명 위에서는 넉넉히 세게'},
     {icon:'❓', desc:'무게 센서가 고장 나 값이 ?, 아래에 아무도 없음', read:{weight:'?', life:false, blackout:false, h:2}, expect:'strong', note:'모르면 떨어지지 않게 세게'},
     {icon:'🌑', desc:'정전! 가벼운 철 캔을 든 채 비상 배터리로 버티는 중, 아래에 아무도 없음', read:{weight:'light', life:false, blackout:true, h:2}, expect:'off'}],
   best:{t:'q', q:'life', yes:{t:'a', a:'strong'}, no:{t:'q', q:'blackout', yes:{t:'a', a:'off'}, no:{t:'q', q:'light', yes:{t:'a', a:'weak'}, no:{t:'a', a:'strong'}}}},
   hints:['가장 먼저 지켜야 할 것은 <b>아래에 있는 생명</b>이에요. 그 질문을 맨 위에 두면 어떨까요?', '정전이 났는데 아래에 아무도 없다면, 배터리가 다 닳기 전에 어떻게 하는 게 안전할까요?', '무게 센서 값이 ‘?’이면 답은 ‘아니요’예요. ‘무거운가요?’와 ‘가벼운가요?’ 중 어느 쪽이 ‘?’일 때 세게 갈까요?'],
   reflectQ:'카메라가 아래에 있는 사람을 알아보지 못하면 어떤 일이 생길까? 사람이 무엇을 확인해야 할까?', ext:'aircon'},
  {id:'d_wash', giver:'moon', icon:'🧺', title:'엉킴을 푸는 똑똑한 세탁기',
   problem:'우리 세탁기는 한쪽으로만 돌아서 빨래가 자꾸 엉켜. 빨래 양에 맞게 돌고, 문이 열리면 꼭 멈추면 좋겠어.',
   examples:['빨래가 한쪽으로 엉킴 → 극 바꾸기(반대로 돌기)', '빨래가 많음 → 세게', '문이 열림 → 끄기'],
   needProps:['pole', 'power'], okProps:[],
   propWhy:{pole:'세탁기는 전자석의 극의 방향을 바꿔 통을 왼쪽·오른쪽으로 번갈아 돌려요. 엉킨 빨래를 푸는 열쇠예요.', power:'빨래가 많으면 세게, 적으면 약하게 — 세기를 바꿔요.', onoff:'문이 열리면 멈추는 건 스위치로 전기를 끊는 일이에요. 붙였다 떼는 전자석의 ‘켜고 끄기’ 성질을 쓰는 건 아니에요.'},
   sensors:['door', 'weight', 'camera', 'height'], maxSensors:2,
   questions:[
     {id:'closed', s:'door', text:'문이 닫혔나요?', cond:'문이 닫힘', f:r => r.door === true},
     {id:'open', s:'door', text:'문이 열렸나요?', cond:'문이 열림', f:r => r.door === false},
     {id:'tangle', s:'weight', text:'빨래가 한쪽으로 쏠렸나요? (엉킴)', cond:'빨래 엉킴', f:r => r.tangle === true},
     {id:'many', s:'weight', text:'빨래가 많나요?', cond:'많은 빨래', f:r => r.load === 'many'},
     {id:'dirty', s:'camera', text:'빨래가 많이 더러운가요?', cond:'더러운 빨래', f:r => r.dirty === true},
     {id:'water', s:'height', text:'물이 가득 찼나요?', cond:'가득 찬 물', f:r => r.water === true}],
   actions:['off', 'weak', 'strong', 'flip'],
   scenarios:[
     {icon:'👕', desc:'문 닫힘, 빨래가 많고 고르게 펴짐', read:{door:true, load:'many', tangle:false}, expect:'strong'},
     {icon:'🧦', desc:'문 닫힘, 양말 몇 켤레뿐', read:{door:true, load:'few', tangle:false}, expect:'weak'},
     {icon:'🌀', desc:'문 닫힘, 이불이 한쪽으로 엉킴', read:{door:true, load:'many', tangle:true}, expect:'flip'},
     {icon:'🚪', desc:'빨래를 넣으려고 문을 엶', read:{door:false, load:'few', tangle:false}, expect:'off'},
     {icon:'🙀', desc:'엉킨 채로 누가 문을 엶', read:{door:false, load:'many', tangle:true}, expect:'off', note:'문이 열리면 무엇보다 먼저 멈춰요'},
     {icon:'🧣', desc:'문 닫힘, 목도리 하나가 엉킴', read:{door:true, load:'few', tangle:true}, expect:'flip'},
     {icon:'❓', desc:'문 센서가 고장 나 값이 ?', read:{door:'?', load:'many', tangle:false}, expect:'off', note:'문이 닫혔는지 모르면 멈추는 게 안전해요'},
     {icon:'⚖️', desc:'문 닫힘, 무게 센서 값이 ? (빨래 양을 모름)', read:{door:true, load:'?', tangle:false}, expect:'weak', note:'모르면 약하게'}],
   best:{t:'q', q:'closed', yes:{t:'q', q:'tangle', yes:{t:'a', a:'flip'}, no:{t:'q', q:'many', yes:{t:'a', a:'strong'}, no:{t:'a', a:'weak'}}}, no:{t:'a', a:'off'}},
   hints:['문이 열리면 무엇보다 먼저 멈춰야 해요. 문 질문을 맨 위에 두면 어떨까요?', '엉킨 빨래는 세게 돌린다고 풀리지 않아요. 도는 방향을 바꾸려면 어떤 행동이 필요할까요?', '문 센서 값이 ‘?’이면 답은 ‘아니요’예요. ‘문이 닫혔나요?’와 ‘문이 열렸나요?’ 중 어느 쪽을 물어야 ‘?’일 때 멈출까요?'],
   reflectQ:'문 센서가 고장 나 열린 문을 닫혔다고 읽으면 어떤 일이 생길까? 사람이 무엇을 확인해야 할까?', ext:'ev'},
  {id:'d_park', giver:'evdriver', icon:'🚗', title:'주차장에서 조심하는 전기차',
   problem:'주차장에서는 천천히, 큰길에서는 힘차게 달리고, 가는 길에 사람이나 동물이 있으면 꼭 멈추는 전기차를 만들고 싶어. 바닥 화살표가 뒤를 가리키면 뒤로 들어가 주차해야 해.',
   examples:['주차장 안 빈 길 → 약하게(천천히)', '큰길 빈 도로 → 세게(빠르게)', '바닥 화살표가 뒤 → 극 바꾸기(뒤로)'],
   needProps:['power', 'pole'], okProps:[],
   propWhy:{power:'얼마나 빠르게 갈지는 바퀴를 돌리는 전동기 전자석의 세기로 정해요.', pole:'앞으로 갈지 뒤로 갈지는 전자석의 극의 방향을 바꿔 정해요.', onoff:'멈추는 건 스위치로 전동기의 전기를 끊는 일이에요. 붙였다 떼는 전자석의 ‘켜고 끄기’ 성질을 쓰는 건 아니에요.'},
   sensors:['camera', 'place', 'weight', 'height'], maxSensors:2,
   questions:[
     {id:'life', s:'camera', text:'가는 길에 사람이나 동물이 있나요?', cond:'가는 길의 사람이나 동물', f:r => r.life === true},
     {id:'back', s:'camera', text:'바닥 화살표가 뒤를 가리키나요?', cond:'뒤를 가리키는 화살표', f:r => r.arrow === 'back'},
     {id:'road', s:'place', text:'큰길인가요?', cond:'큰길', f:r => r.where === 'road'},
     {id:'lot', s:'place', text:'주차장 안인가요?', cond:'주차장 안', f:r => r.where === 'lot'},
     {id:'cargo', s:'weight', text:'짐을 많이 실었나요?', cond:'많은 짐', f:r => r.cargo === true},
     {id:'slope', s:'height', text:'오르막길인가요?', cond:'오르막길', f:r => r.slope === true}],
   actions:['off', 'weak', 'strong', 'flip'], actLabel:{weak:'약하게 (천천히)', strong:'세게 (빠르게)', flip:'극 바꾸기 (뒤로 천천히)'},
   scenarios:[
     {icon:'🅿️', desc:'주차장 안, 빈 길', read:{where:'lot', life:false, arrow:'front'}, expect:'weak'},
     {icon:'🚶', desc:'주차장 안, 앞에 사람이 걸어감', read:{where:'lot', life:true, arrow:'front'}, expect:'off'},
     {icon:'🛣️', desc:'큰길, 빈 도로', read:{where:'road', life:false, arrow:'none'}, expect:'strong'},
     {icon:'🚸', desc:'큰길, 횡단보도에 어린이가 있음', read:{where:'road', life:true, arrow:'none'}, expect:'off'},
     {icon:'⬇️', desc:'주차장 안, 바닥 화살표가 뒤를 가리킴', read:{where:'lot', life:false, arrow:'back'}, expect:'flip'},
     {icon:'🐈', desc:'주차장 안, 고양이가 앞을 지나감', read:{where:'lot', life:true, arrow:'front'}, expect:'off'},
     {icon:'❓', desc:'지하 주차장이라 위치 센서 값이 ?, 빈 길', read:{where:'?', life:false, arrow:'front'}, expect:'weak', note:'어디인지 모르면 천천히'},
     {icon:'🧒', desc:'뒤로 주차하려는데 뒤에 아이가 있음', read:{where:'lot', life:true, arrow:'back'}, expect:'off', note:'사람이 먼저예요'}],
   best:{t:'q', q:'life', yes:{t:'a', a:'off'}, no:{t:'q', q:'road', yes:{t:'a', a:'strong'}, no:{t:'q', q:'back', yes:{t:'a', a:'flip'}, no:{t:'a', a:'weak'}}}},
   hints:['무엇보다 먼저 <b>가는 길의 생명</b>을 지켜야 해요. 그 질문을 맨 위에 두면 어떨까요?', '뒤로 가려면 전동기를 반대로 돌려야 해요. 어떤 행동 통이 필요할까요?', '위치 센서 값이 ‘?’이면 답은 ‘아니요’예요. ‘큰길인가요?’와 ‘주차장 안인가요?’ 중 어느 쪽을 물어야 ‘?’일 때 천천히 갈까요?'],
   reflectQ:'카메라가 길을 건너는 어린이를 알아보지 못하면 어떤 일이 생길까? 사람이 무엇을 확인해야 할까?', ext:'ev'},
];
/* Z5 확장 질문 (교사 아이디어를 다듬은 것 · 용어는 '빠르기'와 '방향') */
const DS_EXT = {
  aircon:{q:'에어컨과 열선 전기난로 중, 전자석이 꼭 필요한 쪽은 어디일까? 왜 그럴까?', opts:[
    {t:'에어컨 — 찬 공기를 만드는 압축기와 바람을 보내는 팬을 전동기가 돌려서', ok:'ok', tag:'aircon-motor', r:'맞아요! 에어컨에는 전동기(전자석)가 있어요. 냉방 원리(냉매가 돌며 열을 옮김) 자체는 전자석이 아니고, 그것을 돌리는 전동기에 전자석이 있어요.'},
    {t:'열선 전기난로 — 전기를 많이 써서', ok:'no', tag:'heater-power', r:'전기를 많이 쓴다고 전자석이 있는 건 아니에요. 열선 난로는 전기가 열선을 뜨겁게 하는 원리예요. 다시 골라 볼래요?'},
    {t:'둘 다 — 전기를 쓰는 기기에는 모두 전자석이 있어서', ok:'no', tag:'both', r:'전기를 써도 열이나 빛만 내는 기기에는 전자석이 없을 수 있어요. 다시 골라 볼래요?'}]},
  ev:{q:'전기차가 어느 쪽으로, 얼마나 빠르게 갈지 정하려면 전자석의 어떤 두 성질이 필요할까?', opts:[
    {t:'극의 방향(앞·뒤)과 세기(빠르기)', ok:'ok', tag:'pole-power', r:'맞아요! 극의 방향을 바꾸면 도는 방향이, 세기를 바꾸면 빠르기가 달라져요.'},
    {t:'켜고 끄기만 있으면 돼요', ok:'no', tag:'onoff-only', r:'켜고 끄기로는 가고 서는 것만 정할 수 있어요. 방향과 빠르기는 무엇으로 바꿀까요?'},
    {t:'세기만 있으면 돼요', ok:'no', tag:'power-only', r:'세기로 빠르기는 바꿀 수 있지만, 뒤로 가려면 무엇을 바꿔야 할까요?'}]},
};
const DS_CHECK = [
  {t:'센서를 닦고 고장 났는지 자주 점검한다', ok:'ok', tag:'maintain', r:'좋아요! 센서가 가려지거나 고장 나면 AI는 엉뚱한 값을 그대로 믿어요.'},
  {t:'사람이 다칠 수 있는 결정은 사람이 한 번 더 확인한다', ok:'ok', tag:'human', r:'좋아요! 중요한 결정일수록 마지막에는 사람이 확인해야 해요.'},
  {t:'센서가 모를 때(?)는 안전한 쪽으로 움직이게 만든다', ok:'ok', tag:'failsafe', r:'좋아요! 방금 질문 길에서 해 본 것처럼, 모를 때 안전한 쪽으로 가게 설계할 수 있어요.'},
  {t:'AI는 틀리지 않으니까 확인할 필요가 없다', ok:'no', tag:'trust', r:'AI도 센서가 틀리면 틀린 판단을 해요. 오늘 시험에서도 보았지요? 다시 골라 볼래요?'}];
const DS_WHY = [
  {tag:'sensor', t:'센서가 그 상황을 제대로 읽지 못했다 (감지)'},
  {tag:'split', t:'질문 길이 그 상황을 따로 나누지 못했다 (판단)'},
  {tag:'action', t:'통에 넣은 행동이 그 상황에 맞지 않았다 (행동)'}];

/* ----- 질문 길 계산 (센서 값 '?'는 모든 질문에서 '아니요') ----- */
const dsQ = (card, id) => card.questions.find(q => q.id === id);
const dsAct = (card, a) => (card.actLabel && card.actLabel[a]) || DS_ACT[a].t;
function dsValid(card, n){ return !!n && (n.t === 'a' ? !!n.a : n.t === 'q' && !!dsQ(card, n.q) && dsValid(card, n.yes) && dsValid(card, n.no)); }
function dsTrace(card, n, read){
  const path = []; let p = 'r';
  while (n && n.t === 'q'){ const q = dsQ(card, n.q), ans = !!q.f(read); path.push({q:n.q, ans, p}); p += ans ? 'y' : 'n'; n = ans ? n.yes : n.no; }
  return {action:n ? n.a : null, path, leaf:p};
}
function dsTest(card, T){
  const res = card.scenarios.map(sc => { const tr = dsTrace(card, T, sc.read); return {sc, tr, ok:tr.action === sc.expect}; });
  return {res, ok:res.filter(r => r.ok).length, use:res.reduce((s, r) => s + DS_ACT[r.tr.action].use, 0), need:card.scenarios.reduce((s, sc) => s + DS_ACT[sc.expect].use, 0)};
}
/* 틀린 장면의 까닭: 센서 값 ? → 감지 · 같은 통에 다른 행동이 필요한 장면이 섞임 → 판단 · 그 밖 → 행동 */
function dsCause(card, test, r){
  if (Object.values(r.sc.read).includes('?')) return 'sensor';
  const mates = test.res.filter(x => x.tr.leaf === r.tr.leaf);
  return mates.some(x => x.sc.expect !== r.sc.expect) ? 'split' : 'action';
}
const DS_CAUSE_TXT = {
  sensor:'센서 값이 ?이면 질문의 답이 ‘아니요’로 가요. ‘아니요’ 쪽이 안전한 행동으로 이어지게 질문을 바꾸면 모를 때도 안전해요.',
  split:'같은 통에 서로 다른 행동이 필요한 장면이 섞였어요. 질문을 하나 더 두거나, 그 차이를 알아챌 감지 카드를 골라야 해요.',
  action:'이 통에 온 장면들은 모두 같은 행동이 필요했는데, 통에 넣은 행동이 달랐어요. 통의 행동을 바꾸면 돼요.'};
function dsState(){
  if (!SAVE.design || typeof SAVE.design !== 'object') SAVE.design = {};
  const D = SAVE.design; D.trees = D.trees || {}; D.sensors = D.sensors || {}; D.done = D.done || {}; return D;
}

/* ----- 3D 무대: 질문 미끄럼틀과 같은 나무판, 표지판 색 = 감지 카드, 통 색 = 행동, 장면 카드가 미끄러진다 ----- */
const dsW3 = d => sl3W(d) * (d >= 2 ? .8 : 1);
function ds3Scene(ctx){
  return {cam:{x:0, y:4.3, z:-.8, w:13.8, h:8.8, pitch:.1},
    draw(t, dt){
      D3('slideRoom', mkSlideRoom3);
      const T = ctx.T; if (!T) return;
      const nodes = slNodes(T), rY = M3('railY', b => BX(b, 0, -.07, -.07, 1, .07, .07, '#2f8f5b')), rN = M3('railN', b => BX(b, 0, -.07, -.07, 1, .07, .07, '#c4473b'));
      for (const {n, path} of nodes) if (n.t === 'q'){
        const p = sl3Pos(path);
        for (const c of ['y', 'n']){ const q = sl3Pos(path + c), x0 = p.x, y0 = p.y - .36, x1 = q.x, y1 = q.y + .4, len = Math.hypot(x1 - x0, y1 - y0); drawM(c === 'y' ? rY : rN, mMul(S3(x0, y0, SL3.Z + .1), mRZ(Math.atan2(y1 - y0, x1 - x0)), mSC(len, 1, 1))); }
      }
      for (const {n, path} of nodes){
        const p = sl3Pos(path), sc = p.d >= 3 ? .78 : 1;
        if (n.t === 'q'){ const w = dsW3(p.d), q = n.q && dsQ(ctx.card, n.q), col = q ? DS_SENSORS[q.s].c : '#3b5068'; drawM(M3('dsSign' + p.d + col, b => { BX(b, -w / 2, -.36, 0, w / 2, .36, .16, col); BX(b, -w / 2 + .06, -.3, .16, w / 2 - .06, .3, .18, hexShade(col, .12)); }), S3(p.x, p.y, SL3.Z)); }
        else { const col = n.a ? DS_ACT[n.a].c : '#5b6573'; drawM(M3('bucket' + col, b => { BX(b, -.86, -.45, -.4, .86, -.37, .4, col); BX(b, -.86, -.45, -.4, .86, .32, -.32, col); BX(b, -.86, -.45, .32, .86, .02, .4, col); BX(b, -.86, -.45, -.4, -.78, .32, .4, col); BX(b, .78, -.45, -.4, .86, .32, .4, col); }), S3(p.x, p.y, SL3.Z + .2, 0, sc)); }
      }
      const tok = ctx.tok;
      if (tok){ drawM(M3('dsTok', b => { BX(b, -.36, -.26, -.06, .36, .26, .06, '#fff8e6'); BX(b, -.36, -.26, .06, .36, -.2, .08, '#ffd23f'); }), S3(tok.x, tok.y, SL3.Z + .55)); spr3(tok.x, tok.y + .02, SL3.Z + .66, tok.sc.icon, .3); }
    },
    overlay(){
      const T = ctx.T; if (!T) return;
      tag3(0, 8.85, SL3.Z, `${ctx.card.icon} ${ctx.card.title}`, {size:12});
      const nodes = slNodes(T);
      for (const {n, path} of nodes) if (n.t === 'q') for (const [c, lab, col] of [['y', '예', '#8ff0b9'], ['n', '아니요', '#ffaaa1']]){ const p = sl3Pos(path), q = sl3Pos(path + c); tag3((p.x + q.x) / 2, (p.y + q.y) / 2, SL3.Z + .2, lab, {col, size:12, border:col}); }
      for (const {n, path} of nodes){
        const p = sl3Pos(path), sel = ctx.sel === path;
        if (n.t === 'q'){
          const q = n.q && dsQ(ctx.card, n.q);
          tag3(p.x, p.y, SL3.Z + .2, q ? `${DS_SENSORS[q.s].icon} ${q.text}` : '❓ 질문을 골라요', {bg:sel ? 'rgba(255,210,63,.95)' : 'rgba(0,0,0,0)', col:sel ? '#1c2733' : q ? '#fff' : '#ffd23f', size:p.d >= 2 ? 11 : p.d ? 13 : 15});
          if (ctx.ans && ctx.ans.path === path) tag3(p.x + dsW3(p.d) / 2 + .5, p.y + .4, SL3.Z + .2, ctx.ans.yes ? '예!' : '아니요!', {bg:ctx.ans.yes ? '#25a862' : '#e5483a', size:14});
        } else {
          tag3(p.x, p.y + .6, SL3.Z + .3, n.a ? DS_ACT[n.a].short : '행동을 골라요', {bg:sel ? 'rgba(255,210,63,.95)' : 'rgba(21,32,43,.85)', col:sel ? '#1c2733' : n.a ? '#fff' : '#ffd23f', size:p.d >= 3 ? 11 : 12});
          const rs = (ctx.results || {})[path] || [];
          rs.forEach((r, i) => mark3(p.x - (rs.length - 1) * .17 + i * .34, p.y + .15, SL3.Z + .3, r.ok));
        }
      }
      if (ctx.tok) tag3(ctx.tok.x, ctx.tok.y + .55, SL3.Z + .6, ctx.tok.sc.desc.length > 22 ? ctx.tok.sc.desc.slice(0, 21) + '…' : ctx.tok.sc.desc, {size:11});
    }};
}
const ds3Nodes = ctx => slNodes(ctx.T).map(({n, path}) => { const p = sl3Pos(path); return {path, x:p.x, y:p.y, z:SL3.Z + .2, r:n.t === 'q' ? dsW3(p.d) / 2 : (p.d >= 3 ? .7 : .9)}; });
/* 2D (3D가 안 될 때) */
const dsW2 = d => [250, 210, 150, 104][d] || 100;
function ds2Draw(g, ctx){
  g.fillStyle = '#16212d'; g.fillRect(0, 0, 960, 540);
  const T = ctx.T; if (!T) return;
  mgText(g, `${ctx.card.icon} ${ctx.card.title}`, 480, 22, 14, '#a9b9cb');
  const nodes = slNodes(T);
  for (const {n, path} of nodes) if (n.t === 'q'){
    const p = slPos(path);
    for (const [c, lab, col] of [['y', '예', '#25a862'], ['n', '아니요', '#e5483a']]){ const q = slPos(path + c); g.strokeStyle = col; g.lineWidth = 5; g.beginPath(); g.moveTo(p.x, p.y + 22); g.lineTo(q.x, q.y - 24); g.stroke(); mgText(g, lab, (p.x + q.x) / 2, (p.y + q.y) / 2, 12, col); }
  }
  for (const {n, path} of nodes){
    const p = slPos(path), w = dsW2(p.d), sel = ctx.sel === path;
    if (n.t === 'q'){ const q = n.q && dsQ(ctx.card, n.q); mgBox(g, p.x - w / 2, p.y - 22, w, 44, q ? DS_SENSORS[q.s].c : '#22303f', sel ? '#ffd23f' : '#0f1a26', 10, sel ? 4 : 3); mgWrap(g, q ? `${DS_SENSORS[q.s].icon} ${q.text}` : '❓ 질문을 골라요', p.x, p.y - (p.d >= 2 ? 8 : 0), w - 12, 15, p.d >= 2 ? 11 : 13, q ? '#fff' : '#ffd23f'); }
    else {
      const bw = Math.min(w, 120); mgBox(g, p.x - bw / 2, p.y - 22, bw, 44, n.a ? DS_ACT[n.a].c : '#22303f', sel ? '#ffd23f' : '#0f1a26', 10, sel ? 4 : 3); mgText(g, n.a ? DS_ACT[n.a].short : '행동?', p.x, p.y, 13, n.a ? '#fff' : '#ffd23f');
      const rs = (ctx.results || {})[path] || []; rs.forEach((r, i) => mgText(g, r.ok ? '✓' : '✗', p.x - (rs.length - 1) * 9 + i * 18, p.y + 34, 14, r.ok ? '#8ff0b9' : '#ff8a80'));
    }
    if (ctx.ans && ctx.ans.path === path) mgText(g, ctx.ans.yes ? '예!' : '아니요!', p.x + w / 2 + 26, p.y - 20, 13, ctx.ans.yes ? '#8ff0b9' : '#ff8a80');
  }
  if (ctx.tok){ mgEmoji(g, ctx.tok.sc.icon, ctx.tok.x, ctx.tok.y - 18, 26); }
}
function ds2Hit(T, x, y){ for (const {n, path} of slNodes(T)){ const p = slPos(path), w = n.t === 'q' ? dsW2(p.d) : Math.min(dsW2(p.d), 120); if (Math.abs(x - p.x) <= w / 2 && Math.abs(y - p.y) <= 26) return path; } return null; }

/* ----- 게임 본체 ----- */
function dsBuild(api){
  const D = dsState(), d3 = !!api.d3;
  const ctx = {phase:'z1', card:null, T:null, sel:null, results:{}, tok:null, ans:null, rolling:false, tries:0, fast:false, step:null, sensors:[], test:null, hint:0, props:null};
  if (d3) api.scene(ds3Scene(ctx));
  const dom = html => { if (!d3) api.canvas(!html); return api.dom(html); };
  const pathQs = path => { const ids = []; let n = ctx.T; for (const ch of path.slice(1)){ if (n.t === 'q' && n.q) ids.push(n.q); n = ch === 'y' ? n.yes : n.no; } return ids; };
  const qsOn = () => ctx.card.questions.filter(q => ctx.sensors.includes(q.s));
  const upd = () => { const c = $('#dsQ'); if (c) c.textContent = `질문 ${treeSize(ctx.T)}개 · 시험 ${ctx.tries}번`; };
  const save = () => { D.trees[ctx.card.id] = slClone(ctx.T); D.sensors[ctx.card.id] = ctx.sensors.slice(); persist(); };

  /* Z1 민원 카드 */
  const z1 = () => {
    ctx.phase = 'z1'; ctx.T = null; ctx.test = null; ctx.tries = 0; ctx.hint = 0; api.bot(''); api.pop();
    api.say('🛠️ <b>Z1 문제 이해</b> · 마을 사람들의 민원 카드 하나를 골라요. 감지(센서) → 판단(질문 길) → 행동(전자석)을 이어 똑똑한 기기를 설계해요.');
    const el = dom(`<div class="ds"><h3 class="mg-h">📮 마을 민원 카드</h3><div class="ds-cards">${DESIGN_CARDS.map(c => `<button class="ds-card" data-c="${c.id}">
      <span class="ds-ci">${c.icon}</span><b>${esc(c.title)}</b><small>👤 ${esc(ACT_WHO[c.giver] || '')}${D.done[c.id] ? ` · ✅ ${D.done[c.id]}/8` : ''}</small><p>${esc(c.problem)}</p></button>`).join('')}</div></div>`);
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { ctx.card = DESIGN_CARDS.find(c => c.id === b.dataset.c); SND.tick(); z2(); });
  };
  /* Z2 필요한 성질 */
  const z2 = () => {
    const c = ctx.card, pick = new Set(); ctx.phase = 'z2';
    api.say(`🔎 <b>Z2 분석</b> · 「${esc(c.title)}」 문제를 풀려면 전자석의 어떤 성질이 필요할까요? 필요한 것을 <b>모두</b> 골라요.`);
    const el = dom(`<div class="ds"><h3 class="mg-h">${c.icon} ${esc(ACT_WHO[c.giver] || '')}의 민원</h3><blockquote class="ds-prob"></blockquote>
      <ul class="ds-ex">${c.examples.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="ds-props">${Object.keys(PROPS).map(k => `<button class="btn ds-prop" data-p="${k}"><b>${esc(PROPS[k].short)}</b><small>${esc(PROPS[k].text)}</small></button>`).join('')}</div>
      <div id="dsFb"></div><div class="row" style="justify-content:center;margin-top:8px"><button class="btn primary" id="dsOk">이 성질로 정하기</button><button class="btn" id="dsBack">다른 민원 고르기</button></div></div>`);
    el.querySelector('.ds-prob').textContent = c.problem;
    el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const k = b.dataset.p; pick.has(k) ? pick.delete(k) : pick.add(k); b.classList.toggle('on', pick.has(k)); SND.tick(); });
    el.querySelector('#dsBack').onclick = z1;
    el.querySelector('#dsOk').onclick = () => {
      if (!pick.size) return api.say('성질을 하나 이상 골라요.', 'bad');
      let score = 0;
      const rows = Object.keys(PROPS).map(k => {
        const need = c.needProps.includes(k), okx = c.okProps.includes(k), on = pick.has(k);
        const good = need ? on : (okx || !on); if (good) score++;
        const mark = need && on ? '✅' : need ? '⬜ 빠졌어요' : on && okx ? '🟡 괜찮아요' : on ? '❌ 이번엔 필요 없어요' : '✅';
        return `<li><b>${esc(PROPS[k].short)}</b> ${mark}<br><small>${esc(c.propWhy[k] || '')}</small></li>`;
      });
      ctx.props = {pick:[...pick], score};
      const exact = c.needProps.every(k => pick.has(k)) && [...pick].every(k => c.needProps.includes(k) || c.okProps.includes(k));
      ladJudge('a11', `a11.props.${c.id.slice(2)}`, [...pick].map(k => PROPS[k].short).join(', '), exact ? 'correct' : 'partial', `${c.title}: 필요한 전자석 성질`, 'volt');
      exact ? SND.ok() : SND.bad();
      el.querySelector('#dsFb').innerHTML = `<div class="${exact ? 'okbox' : 'warnbox'}">성질 판단 <b>${score}/3</b>${exact ? ' · 딱 맞아요!' : ''}<ul class="ds-fb">${rows.join('')}</ul></div>`;
      const ok = el.querySelector('#dsOk'); ok.textContent = '다음: 감지 카드 고르기 ▶'; ok.onclick = z3s;
      el.querySelectorAll('[data-p]').forEach(b => { b.disabled = true; });
    };
  };
  /* Z3-1 감지 카드 */
  const z3s = () => {
    const c = ctx.card, pick = new Set((D.sensors[c.id] || []).filter(s => c.sensors.includes(s))); ctx.phase = 'z3s'; api.pop(); ctx.sel = null;
    api.say(`📡 <b>Z3 탐구 ① 감지(인식)</b> · 기기가 상황을 알아챌 감지 카드를 <b>${c.maxSensors}장까지</b> 골라요. 고른 카드로 물어볼 수 있는 질문이 생겨요.`);
    const el = dom(`<div class="ds"><h3 class="mg-h">📡 감지 카드 <small>(${c.maxSensors}장까지)</small></h3><div class="ds-sens">${c.sensors.map(s => { const S = DS_SENSORS[s];
      return `<button class="ds-sen${pick.has(s) ? ' on' : ''}" data-s="${s}" style="--c:${S.c}"><span>${S.icon}</span><b>${esc(S.name)}</b><small>${esc(S.sub)}</small></button>`; }).join('')}</div>
      <div class="row" style="justify-content:center;margin-top:8px"><button class="btn primary" id="dsSenGo">질문 길 만들기 ▶</button></div></div>`);
    el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => {
      const s = b.dataset.s;
      if (pick.has(s)) pick.delete(s); else { if (pick.size >= c.maxSensors) return api.say(`감지 카드는 ${c.maxSensors}장까지예요. 하나를 빼고 골라요.`, 'bad'); pick.add(s); }
      b.classList.toggle('on', pick.has(s)); SND.tick();
    });
    el.querySelector('#dsSenGo').onclick = () => {
      if (!pick.size) return api.say('감지 카드를 하나 이상 골라요.', 'bad');
      ctx.sensors = c.sensors.filter(s => pick.has(s));
      const keep = D.trees[c.id];
      ctx.T = keep && slNodes(keep).every(({n}) => n.t !== 'q' || !n.q || ctx.sensors.includes((dsQ(c, n.q) || {}).s)) ? slClone(keep) : slBlank();
      save(); z3t();
    };
  };
  /* Z3-2 판단(질문 길) · 행동(통) */
  const z3t = () => {
    const c = ctx.card; dom(''); ctx.results = {}; ctx.sel = null; ctx.phase = 'tree';
    api.say(`🧠 <b>Z3 탐구 ② 판단 → ③ 행동</b> · 표지판을 눌러 질문을, 통을 눌러 전자석 행동을 정해요. 예시: ${c.examples.map(esc).join(' · ')}. <small>센서 값이 ‘?’이면 답은 ‘아니요’로 가요.</small>`);
    const bot = api.bot(`<span class="mg-chip" id="dsQ"></span><button class="btn primary big" id="dsGo">▶ 처음 보는 장면 8개로 시험</button><button class="btn" id="dsFast">빠르게</button><button class="btn" id="dsHint">💡 힌트</button><button class="btn" id="dsSen">📡 감지 카드 바꾸기</button><button class="btn" id="dsZ5" hidden>Z5 성찰로 ▶</button>`);
    upd();
    bot.querySelector('#dsFast').onclick = e => { ctx.fast = !ctx.fast; e.currentTarget.classList.toggle('on', ctx.fast); };
    bot.querySelector('#dsHint').onclick = () => { if (ctx.rolling) return; api.say(`💡 힌트 ${ctx.hint % c.hints.length + 1}/${c.hints.length} · ${c.hints[ctx.hint % c.hints.length]}`); ctx.hint++; SND.tick(); };
    bot.querySelector('#dsSen').onclick = () => { if (!ctx.rolling){ api.bot(''); z3s(); } };
    bot.querySelector('#dsZ5').onclick = () => { if (!ctx.rolling) z5(); };
    bot.querySelector('#dsGo').onclick = () => {
      if (ctx.rolling || MG.ended) return;
      if (!dsValid(c, ctx.T)) return api.say('아직 정하지 않은 칸(❓ 질문을 골라요 · 행동을 골라요)이 있어요. 모두 정한 뒤 시험해요.', 'bad');
      ctx.tries++; upd(); save(); roll();
    };
  };
  const editPop = path => {
    const c = ctx.card, n = nodeAt(ctx.T, path), p = d3 ? sl3Pos(path) : slPos(path);
    let html;
    if (n.t === 'q'){
      const used = pathQs(path);
      html = `<p><b>어떤 질문으로 나눌까요?</b></p><div class="pop-col">${qsOn().map(q => `<button class="btn small" data-q="${q.id}"${used.includes(q.id) ? ' disabled title="이 길에서 이미 물어본 질문이에요"' : ''}>${DS_SENSORS[q.s].icon} ${esc(q.text)}</button>`).join('')}${p.d > 0 ? '<button class="btn small ghost" data-x="leaf">질문 지우고 바로 행동 정하기</button>' : ''}</div>`;
    } else html = `<p><b>여기에 온 장면에서 전자석은?</b></p><div class="pop-col">${c.actions.map(a => `<button class="btn small" data-a="${a}">${esc(dsAct(c, a))}</button>`).join('')}${p.d < 3 ? '<button class="btn small ghost" data-x="q">❓ 질문 하나 더 하기</button>' : ''}</div>`;
    ctx.sel = path;
    const el = d3 ? (() => { const s = P3(p.x, p.y, SL3.Z + .2); return api.popAt(s.x, s.y, html); })() : api.pop(p.x, p.y, html);
    const close = () => { api.pop(); ctx.sel = null; SND.tick(); upd(); };
    el.querySelectorAll('[data-q]').forEach(b => b.onclick = e => { e.stopPropagation(); n.q = b.dataset.q; close(); });
    el.querySelectorAll('[data-a]').forEach(b => b.onclick = e => { e.stopPropagation(); n.a = b.dataset.a; close(); });
    el.querySelectorAll('[data-x]').forEach(b => b.onclick = e => {
      e.stopPropagation(); const parent = nodeAt(ctx.T, path.slice(0, -1)), val = b.dataset.x === 'q' ? slBlank() : {t:'a', a:null};
      if (path.endsWith('y')) parent.yes = val; else parent.no = val; close();
    });
  };
  /* Z4 시험: 장면 카드가 질문 길을 따라 미끄러진다 */
  const roll = () => {
    const c = ctx.card, test = dsTest(c, ctx.T), POS = d3 ? sl3Pos : slPos, list = mgShuffle(test.res);
    ctx.rolling = true; ctx.results = {}; ctx.sel = null; api.pop(); ctx.test = test;
    api.say(`🧪 <b>Z4 해결</b> · 처음 보는 장면 8개가 내 설계를 지나가요.`);
    let i = -1, pts = null, k = 0, wait = 0, after = null, cur = null;
    const next = () => {
      i++;
      if (i >= list.length){ ctx.rolling = false; ctx.tok = null; ctx.ans = null; done(test); return; }
      cur = list[i];
      pts = [d3 ? {x:0, y:8.3} : {x:480, y:40}].concat(cur.tr.path.map(s => ({...POS(s.p), ans:s.ans, path:s.p, q:s.q}))).concat([{...POS(cur.tr.leaf), leaf:cur.tr.leaf}]);
      k = 1; ctx.tok = {sc:cur.sc, x:pts[0].x, y:pts[0].y};
      api.say(`${cur.sc.icon} <b>${esc(cur.sc.desc)}</b>`);
    };
    ctx.step = dt => {
      if (wait > 0){ wait -= dt; if (wait <= 0 && after){ const f = after; after = null; f(); } return; }
      if (!pts) return;
      const tgt = pts[k], dx = tgt.x - ctx.tok.x, dy = tgt.y - ctx.tok.y, dist = Math.hypot(dx, dy), sp = (d3 ? 5.4 : 640) * dt * (ctx.fast ? 2.4 : 1);
      if (dist > sp){ ctx.tok.x += dx / dist * sp; ctx.tok.y += dy / dist * sp; return; }
      ctx.tok.x = tgt.x; ctx.tok.y = tgt.y;
      if (tgt.leaf){
        const ok = cur.ok; (ctx.results[tgt.leaf] = ctx.results[tgt.leaf] || []).push({ok});
        ok ? SND.ok() : SND.bad();
        api.say(`${ok ? '✓' : '✗'} ${cur.sc.icon} <b>${esc(cur.sc.desc)}</b> → ${esc(DS_ACT[cur.tr.action].short)}${ok ? '' : ` <small>(필요한 행동: ${esc(DS_ACT[cur.sc.expect].short)}${cur.sc.note ? ' · ' + esc(cur.sc.note) : ''})</small>`}`, ok ? 'ok' : 'bad');
        if (d3){ const lp = sl3Pos(tgt.leaf); if (ok){ fxBurst(lp.x, lp.y, SL3.Z + .4, 16); fxPop(lp.x, lp.y + 1, SL3.Z + .4, '✓', '#8ff0b9', 30); } else { SFX.buzz(); fxShake(.1); fxPop(lp.x, lp.y + 1, SL3.Z + .4, '✗', '#ff8a80', 30); } }
        ctx.tok = null; ctx.ans = null; pts = null; wait = d3 ? (ctx.fast ? .5 : 1.0) : (ctx.fast ? .3 : .6); after = next;
      } else {
        const q = dsQ(c, tgt.q), unk = q && Object.prototype.hasOwnProperty.call(cur.sc.read, dsQKey(q)) && cur.sc.read[dsQKey(q)] === '?';
        ctx.ans = {path:tgt.path, yes:tgt.ans}; d3 ? SFX.ping() : SND.tick();
        if (unk) api.say(`${cur.sc.icon} ${esc(q.text)} → 센서 값이 <b>?</b> 이라 <b>아니요</b>로 가요`);
        k++; wait = ctx.fast ? .14 : .34;
      }
    };
    next();
  };
  const done = test => {
    const c = ctx.card, wrong = test.res.filter(r => !r.ok);
    if (test.ok > (D.done[c.id] || 0)) D.done[c.id] = test.ok;
    persist();
    if (d3){ test.ok === 8 ? (fxBanner('8개 모두 성공!', '#8ff0b9', 1.2), SFX.win()) : fxBanner(`${test.ok} / 8`, '#ffd23f', 1.1); }
    const pass = test.ok >= 6 || ctx.tries >= 3;
    api.say(`🧪 처음 보는 장면 <b>${test.ok}/8</b> 맞힘 · ⚡ 전기 사용량 전지 <b>${test.use}칸</b> (꼭 필요한 만큼 ${test.need}칸)${wrong.length ? ` · ✗ 장면: ${wrong.map(r => r.sc.icon).join(' ')}` : ''}<br>${test.ok === 8 ? '완벽한 설계예요! 성찰로 가요.' : pass ? '고쳐서 다시 시험해도 되고, 지금 성찰로 가도 돼요.' : '✗ 장면을 보고 질문이나 행동을 고쳐 다시 시험해요. 💡 힌트도 있어요.'}`, test.ok === 8 ? 'ok' : pass ? '' : 'bad');
    const b = $('#dsZ5'); if (b) b.hidden = !pass;
  };
  /* Z5 성찰: ① 틀린 장면의 까닭 ② 센서가 틀리면 ③ 설계 한 문장 ④ 확장 질문 */
  const z5 = () => {
    const c = ctx.card, test = ctx.test || dsTest(c, ctx.T), wrong = test.res.filter(r => !r.ok);
    api.bot(''); api.pop(); ctx.tok = null; ctx.sel = null; ctx.phase = 'z5';
    const steps = [];
    if (wrong.length) steps.push(why1); steps.push(check2, sentence3, ext4, meta5);
    let si = 0; const go = () => (si < steps.length ? steps[si++](go) : finish());
    function why1(nx){
      const r = wrong[0], cause = dsCause(c, test, r);
      api.say('🪞 <b>Z5 평가·성찰 ①</b> · 틀린 장면 하나를 골라 까닭을 생각해요.');
      const el = dom(`<div class="ds"><h3 class="mg-h">① 왜 틀렸을까?</h3><p class="ds-sc">${r.sc.icon} <b></b><br><small>내 설계: ${esc(DS_ACT[r.tr.action].short)} · 필요한 행동: ${esc(DS_ACT[r.sc.expect].short)}</small></p>
        <div class="ds-opts">${DS_WHY.map(w => `<button class="btn" data-w="${w.tag}">${esc(w.t)}</button>`).join('')}</div><div id="dsFb"></div></div>`);
      el.querySelector('.ds-sc b').textContent = r.sc.desc;
      el.querySelectorAll('[data-w]').forEach(b => b.onclick = () => {
        const tag = b.dataset.w, hit = tag === cause;
        ladJudge('a11', `a11.wrongWhy.${tag}`, `${r.sc.desc} → ${DS_WHY.find(w => w.tag === tag).t}`, hit ? 'correct' : 'partial', '틀린 장면의 까닭', 'volt');
        hit ? SND.ok() : SND.tick();
        el.querySelector('#dsFb').innerHTML = `<div class="${hit ? 'okbox' : 'warnbox'}">${hit ? '맞아요! ' : '그럴 수도 있어요. 그런데 이 장면은 '}${esc(DS_CAUSE_TXT[cause])}<div class="row" style="justify-content:center;margin-top:6px"><button class="btn primary" id="dsNx">다음 ▶</button></div></div>`;
        el.querySelectorAll('[data-w]').forEach(x => { x.disabled = true; });
        el.querySelector('#dsNx').onclick = nx;
      });
    }
    function choose(title, q, opts, node, nx){
      const el = dom(`<div class="ds"><h3 class="mg-h">${title}</h3><p class="ds-q"></p><div class="ds-opts">${opts.map((o, i) => `<button class="btn" data-o="${i}"></button>`).join('')}</div><div id="dsFb"></div></div>`);
      el.querySelector('.ds-q').textContent = q;
      el.querySelectorAll('[data-o]').forEach(b => { const o = opts[+b.dataset.o]; b.textContent = o.t; b.onclick = () => {
        const ok = o.ok === 'ok';
        ladJudge('a11', `${node}.${o.tag}`, o.t, ok ? 'correct' : 'miss', q, 'volt');
        const fb = el.querySelector('#dsFb'); fb.innerHTML = `<div class="${ok ? 'okbox' : 'warnbox'}"></div>`; fb.firstChild.textContent = o.r;
        if (!ok){ SND.bad(); b.disabled = true; return; }
        SND.ok(); el.querySelectorAll('[data-o]').forEach(x => { x.disabled = true; });
        const row = document.createElement('div'); row.className = 'row'; row.style.cssText = 'justify-content:center;margin-top:6px'; row.innerHTML = '<button class="btn primary">다음 ▶</button>'; fb.firstChild.appendChild(row);
        row.firstChild.onclick = nx;
      }; });
    }
    function check2(nx){ api.say('🪞 <b>Z5 평가·성찰 ②</b> · AI 기기가 틀리면 어떻게 될지 생각해요. (근거가 있으면 여러 답이 맞아요)'); choose('② 센서가 틀리면?', c.reflectQ, mgShuffle(DS_CHECK), 'a11.sensorCheck', nx); }
    function sentence3(nx){
      api.say('🪞 <b>Z5 평가·성찰 ③</b> · 내 설계를 한 문장으로 정리해요. 갤러리에 저장돼요.');
      const qs = qsOn(), props = Object.keys(PROPS), verbs = {onoff:['꺼지게', '켜지게'], power:['약하게', '세게'], pole:['반대로']};
      const el = dom(`<div class="ds"><h3 class="mg-h">③ 설계 한 문장</h3>
        <div class="ds-sent">만약 <select id="dsA">${qs.map((q, i) => `<option value="${i}">${esc(q.cond)}</option>`).join('')}</select>을(를) 감지하면,
        전자석의 <select id="dsB">${props.map(k => `<option value="${k}">${esc(PROPS[k].short)}</option>`).join('')}</select>을(를) <select id="dsC"></select> 한다.
        <label for="dsD">왜냐하면</label><input id="dsD" maxlength="80" autocomplete="off" placeholder="예: 할머니가 춥지 않게 하려고"></div>
        <p class="ds-prev" id="dsPrev"></p><div id="dsFb"></div><div class="row" style="justify-content:center;margin-top:6px"><button class="btn primary" id="dsSave">갤러리에 저장 ▶</button></div></div>`);
      const A = el.querySelector('#dsA'), B = el.querySelector('#dsB'), C = el.querySelector('#dsC'), Dd = el.querySelector('#dsD');
      B.value = c.needProps[0];
      const fillC = () => { C.innerHTML = verbs[B.value].map(v => `<option>${v}</option>`).join(''); };
      const text = () => { const q = qs[+A.value], b = B.value; return `만약 ${josa(q.cond, '을', '를')} 감지하면, ${b === 'onoff' ? '전자석을' : `전자석의 ${josa(PROPS[b].short, '을', '를')}`} ${C.value} 한다. 왜냐하면 ${Dd.value.trim() || '___'}.`; };
      const prev = () => { el.querySelector('#dsPrev').textContent = '📝 ' + text(); };
      fillC(); prev();
      B.onchange = () => { fillC(); prev(); }; A.onchange = C.onchange = prev; Dd.oninput = prev;
      Dd.onkeydown = e => { if (e.isComposing || e.keyCode === 229) return; if (e.key === 'Enter'){ e.preventDefault(); el.querySelector('#dsSave').click(); } };
      let warned = false;
      el.querySelector('#dsSave').onclick = () => {
        const why = Dd.value.trim();
        if (why.length < 4){ api.say('‘왜냐하면’ 뒤에 까닭을 네 글자 이상 써요.', 'bad'); return Dd.focus(); }
        const okProp = c.needProps.includes(B.value) || c.okProps.includes(B.value);
        if (!okProp && !warned){ warned = true; el.querySelector('#dsFb').innerHTML = `<div class="warnbox">이 기기의 문제를 푸는 열쇠는 <b>${c.needProps.map(k => esc(PROPS[k].short)).join('·')}</b>였어요. 그 성질로 바꿔 볼래요? (그대로 저장하려면 한 번 더 눌러요)</div>`; return; }
        const s = ladMask(text());
        cpWorks().push({kind:'design', card:c.id, sentence:s, acc:test.ok, time:Date.now()}); persist();
        ladJudge('a11', `a11.design.${c.id.slice(2)}`, s, okProp ? 'correct' : 'partial', '설계 한 문장: 만약 ___을 감지하면, 전자석의 ___을 ___ 한다. 왜냐하면 ___', 'volt');
        SND.ok(); ctx.sentence = s; nx();
      };
      setTimeout(() => { if (!IS_TOUCH) Dd.focus(); }, 60);
    }
    function ext4(nx){ const E = DS_EXT[c.ext]; api.say('🚀 <b>확장 질문</b> · 오늘 설계한 것을 다른 기기로 넓혀 봐요.'); choose('🚀 확장 질문', E.q, mgShuffle(E.opts), 'a11.ext', nx); }
    /* 상호작용 메타 질문 (P5): 지금까지 대화한 마을 사람들은 AI일까, 규칙일까? — 정직하게 밝힌다 */
    function meta5(nx){
      api.say('🤖 <b>마지막 질문</b> · 볼트 박사가 묻는 AI와 상호작용 이야기예요.');
      choose('🤖 볼트 박사의 질문', '그런데 지금까지 너랑 대화한 시장님과 마을 사람들은 AI일까, 자동이처럼 규칙으로 움직일까?', mgShuffle([
        {t:'게임을 만든 사람이 미리 만든 규칙(대본)대로 대답했다', ok:'ok', tag:'rules', r:`맞아요! 마을 사람들은 미리 만든 규칙(대본)과 선택지 안에서만 대답해요. 오늘 만든 기기와 자동이의 질문 길도 규칙이에요.`},
        {t:'스스로 생각하는 AI라서 무엇이든 알아서 대답했다', ok:'no', tag:'ai', r:'그렇게 느껴질 수 있어요! 그런데 시장님은 정해진 질문과 선택지 안에서만 대답했지요? 다시 골라 볼래요?'},
        {t:'화면 뒤에서 진짜 사람이 대답했다', ok:'no', tag:'human', r:'화면 뒤에 사람이 있는 건 아니에요. 대답이 늘 정해진 모양이었던 걸 떠올려 다시 골라 볼래요?'}]), 'a11.meta', nx);
    }
    function finish(){
      dom('');
      const ok = test.ok, bolts = ok === 8 ? (ctx.tries <= 2 ? 3 : 2) : ok >= 6 ? (ctx.tries <= 2 ? 2 : 1) : 1;
      if (ok >= 6 && !SAVE.badges.inventor){ SAVE.badges.inventor = true; toast('🏅 선택 배지 ‘AI 발명가’를 받았어요!', 'ok'); }
      persist();
      api.end(bolts, `「${esc(c.title)}」 설계 완성! 처음 보는 장면 <b>${ok}/8</b> · 시험 ${ctx.tries}번 · 성질 판단 ${ctx.props ? ctx.props.score : '-'}/3`,
        `<div class="mg-power">⚡ <b>전기 사용량</b>: 전지 ${test.use}칸 (꼭 필요한 만큼 ${test.need}칸). 정확도가 같다면 전기를 덜 쓰는 설계가 더 좋아요.</div>${ctx.sentence ? `<div class="mg-learn"><b>📝 내 설계 한 문장</b><br>${esc(ctx.sentence)}<br><small>📣 캠페인 갤러리에 저장했어요.</small></div>` : ''}`);
    }
    go();
  };
  /* 포인터 */
  api.pointer({down:(x, y) => {
    if (MG.ended || ctx.rolling || !ctx.T || ctx.phase !== 'tree') return;
    const hit = d3 ? (api.pick(ds3Nodes(ctx), x, y) || {}).path : ds2Hit(ctx.T, x, y);
    if (ctx.sel){ api.pop(); ctx.sel = null; if (!hit) return; }
    if (!hit) return;
    ctx.results = {}; editPop(hit);
  }});
  api.loop(dt => { if (ctx.rolling && ctx.step) ctx.step(dt); if (!d3) ds2Draw(api.g, ctx); });
  z1();
}
/* 센서 값 키 찾기: 질문의 f가 읽는 값 이름 (r.xxx) — 화면에 '?'를 알려 줄 때만 쓴다 */
function dsQKey(q){ const m = String(q.f).match(/r\.(\w+)/); return m ? m[1] : ''; }

mgReg({id:'design', order:9, icon:'🛠️', title:'스마트 기기 설계실', stat:'ai', single:true, ai:'감지(센서·인식) → 판단(예/아니요 질문 길) → 행동(전자석)을 잇고, 처음 보는 장면으로 시험한 뒤 성찰하기',
  book:'전자석의 성질(켜고 끄기 · 세기 · 극의 방향)을 골라 마을 문제를 푸는 기기 설계 (선택 · AI 발명가 배지)',
  stages:[{name:'민원을 푸는 기기 설계', goal:'마을 민원 카드 하나를 골라 필요한 전자석 성질을 정하고, 감지 카드와 질문 길로 똑똑한 기기를 설계해요. 처음 보는 장면 8개로 시험한 뒤, 틀린 까닭과 설계 한 문장을 남겨요. (선택 활동)', how:'카드 고르기 · 표지판과 통을 눌러 정하기 · ▶ 시험 · 💡 힌트'}],
  learn:['기기는 <b>감지(센서)</b>로 상황을 알아채고, <b>판단(질문 길)</b>으로 무엇을 할지 정하고, <b>행동(전자석의 켜고 끄기 · 세기 · 극의 방향)</b>으로 움직여요. 센서가 틀리거나 모를 때를 대비해 안전한 쪽으로 설계하고, 중요한 결정은 사람이 확인해야 해요.'],
  start(st, api){ dsBuild(api); }});
mg3Attach('design', [() => ds3Scene({card:DESIGN_CARDS[0], T:null})], [api => dsBuild(api)]);
