'use strict';
/* =========================================================
   1. 데이터 — 타일, 스토리 맵, 기기, 상황 장면, 고철
   ========================================================= */

const TILES = {
  '.': {n:'잔디',     solid:false, h:0,   c:'#7cc24c', c2:'#6db541', pat:'grass'},
  ',': {n:'꽃밭',     solid:false, h:0,   c:'#7cc24c', c2:'#6db541', pat:'flower'},
  '=': {n:'도로',     solid:false, h:0,   c:'#4d5462', c2:'#464c59', pat:'road'},
  ':': {n:'인도',     solid:false, h:0,   c:'#cdc6b8', c2:'#bfb7a7', pat:'brick'},
  '_': {n:'실내 바닥', solid:false, h:0,   c:'#dcbc8e', c2:'#cfae80', pat:'wood'},
  'g': {n:'자갈',     solid:false, h:0,   c:'#a69d8f', c2:'#978e81', pat:'gravel'},
  'D': {n:'문',       solid:false, h:0,   c:'#a8743f', c2:'#986635', pat:'door'},
  '~': {n:'물',       solid:true,  h:0,   c:'#3f90d8', c2:'#3681c4', pat:'water'},
  '#': {n:'벽',       solid:true,  h:.55, c:'#ece6da', c2:'#ddd5c5', side:'#bcae96', pat:'wall'},
  'B': {n:'건물',     solid:true,  h:.95, c:'#90a4b9', c2:'#8297ad', side:'#5f7388', pat:'building'},
  'T': {n:'나무',     solid:true,  h:.9,  c:'#3f9b3a', c2:'#368a32', side:'#7a5230', pat:'tree'},
  'F': {n:'울타리',   solid:true,  h:.4,  c:'#c89b5e', c2:'#b98c50', side:'#8f6a3a', pat:'fence'},
  'r': {n:'선로',     solid:true,  h:.14, c:'#857d74', c2:'#776f67', side:'#57514b', pat:'rail'},
};
const GROUND_OF = {'#':'_', 'T':'.', 'B':':', 'F':'.', 'r':'g'};
/* 받침에 따라 조사 고르기: josa('철 캔','이','가') → '철 캔이' */
function josa(word, withB, noB){
  const w = String(word), c = w.charCodeAt(w.length - 1);
  if (c >= 0xAC00 && c <= 0xD7A3) return w + ((c - 0xAC00) % 28 ? withB : noB);
  return w + withB + '(' + noB + ')';
}
const isSolidTile = ch => !TILES[ch] || TILES[ch].solid;

function makeGrid(w, h, ch){ return Array.from({length:h}, () => Array(w).fill(ch)); }
function fillR(g, x, y, w, h, ch){
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && i >= 0 && i < g[j].length) g[j][i] = ch;
}
function room(g, x, y, w, h, dx, dy){ fillR(g, x, y, w, h, '#'); fillR(g, x+1, y+1, w-2, h-2, '_'); g[dy][dx] = 'D'; }

function buildStoryTiles(){
  const W = 60, H = 44, g = makeGrid(W, H, '.');
  // 인도 먼저, 도로는 나중 (교차로에서 도로가 이어지도록)
  fillR(g, 1, 19, W-2, 1, ':'); fillR(g, 1, 22, W-2, 1, ':');
  fillR(g, 27, 1, 1, H-2, ':'); fillR(g, 30, 1, 1, H-2, ':');
  fillR(g, 1, 20, W-2, 2, '='); fillR(g, 28, 1, 2, H-2, '=');
  // 북서: 안전 마을
  room(g, 2, 2, 10, 7, 6, 8); room(g, 14, 2, 11, 7, 19, 8); room(g, 2, 11, 10, 7, 6, 17);
  fillR(g, 3, 9, 24, 2, ':'); fillR(g, 12, 9, 2, 10, ':');
  fillR(g, 14, 11, 12, 7, ','); fillR(g, 16, 13, 4, 2, '~');
  // 북동: 공장 지대
  fillR(g, 31, 1, 16, 11, 'F'); fillR(g, 32, 2, 14, 9, 'g'); fillR(g, 38, 11, 2, 1, 'g');
  room(g, 48, 2, 10, 7, 52, 8);
  fillR(g, 31, 14, 28, 1, 'r'); fillR(g, 31, 15, 28, 2, ':'); fillR(g, 44, 17, 6, 2, 'B');
  // 남동: 광장·상가
  room(g, 32, 24, 12, 8, 37, 24); fillR(g, 37, 23, 1, 1, ':');
  fillR(g, 46, 24, 12, 4, ':');
  room(g, 46, 30, 12, 7, 51, 30);
  room(g, 32, 34, 8, 6, 35, 34); room(g, 41, 34, 5, 6, 43, 34);
  fillR(g, 31, 32, 15, 2, ':'); fillR(g, 46, 38, 12, 4, '_');
  // 남서: 시험 마을
  room(g, 2, 24, 11, 7, 7, 24); room(g, 15, 24, 11, 7, 20, 24);
  room(g, 2, 33, 11, 7, 7, 33); room(g, 15, 33, 11, 7, 20, 33);
  fillR(g, 1, 31, 26, 2, ':'); fillR(g, 13, 23, 2, 18, ':');
  // 남쪽 주차장 (전기차 충전소 퀘스트)
  fillR(g, 31, 40, 15, 3, '=');
  // 나무
  const trees = [[12,2],[13,4],[12,6],[26,3],[25,6],[15,18],[20,18],[24,18],[23,12],[15,16],
    [47,2],[49,10],[56,10],[33,12],[41,12],[50,12],[57,12],[33,17],[38,18],[53,17],[57,18],
    [33,23],[44,23],[58,23],[45,25],[44,29],[58,28],[33,41],[38,41],[44,41],
    [3,23],[10,23],[17,23],[24,23],[4,41],[9,41],[18,41],[23,41],[26,27],[26,36]];
  for (const [x, y] of trees) if (g[y][x] === '.' || g[y][x] === ',') g[y][x] = 'T';
  for (let x = 0; x < W; x++){ g[0][x] = 'T'; g[H-1][x] = 'T'; }
  for (let y = 0; y < H; y++){ g[y][0] = 'T'; g[y][W-1] = 'T'; }
  return g;
}

/* ===== 전자석의 세 가지 성질 ===== */
const PROPS = {
  onoff: {short:'켜고 끄기', text:'전기가 흐를 때만 자석이 된다'},
  power: {short:'세기',      text:'자석의 세기를 바꿀 수 있다'},
  pole:  {short:'극의 방향', text:'극의 방향을 바꿀 수 있다'},
};

/* ===== 전자석 도감 기기 10개 ===== */
const DEVICES = [
  {id:'fan',     name:'선풍기',          icon:'fan',      x:10, y:3,  props:['power'],
   desc:'안에 있는 전동기 전자석의 세기를 바꿔 날개가 도는 빠르기, 곧 바람 세기를 조절해요. 극이 계속 바뀌면서 날개가 돌아가요.'},
  {id:'robovac', name:'로봇 청소기',      icon:'robovac',  x:19, y:4,  props:['power','pole'],
   desc:'바퀴와 흡입 장치에 전동기가 들어 있어요. 세기로 흡입력과 속도를, 극의 방향으로 바퀴가 도는 방향을 바꿔요.'},
  {id:'drone',   name:'드론',            icon:'drone',    x:22, y:15, props:['power'],
   desc:'날개를 돌리는 전동기 4개의 세기를 각각 조절해서 떠오르고, 내려오고, 방향을 바꿔요.'},
  {id:'crane',   name:'전자석 기중기',    icon:'🏗️',       x:35, y:5,  props:['onoff'],
   desc:'전기가 흐를 때만 자석이 되는 성질을 써요. 전기를 넣어 무거운 철 고철을 붙이고, 전기를 끊어 원하는 곳에 내려놓아요.'},
  {id:'maglev',  name:'자기 부상 열차',   icon:'🚄',       x:44, y:14, props:['pole','power'],
   desc:'같은 극끼리 밀어내는 힘으로 선로 위에 떠오르고, 극의 방향을 차례로 바꿔 가며 앞으로 나아가요. 세기로 뜨는 힘을 조절해요.'},
  {id:'ev',      name:'전기 자동차',      icon:'🚗',       x:49, y:25, props:['power','pole'],
   desc:'바퀴를 돌리는 전동기의 세기로 빠르기를 조절하고, 극의 방향을 바꿔 뒤로도 갈 수 있어요.'},
  {id:'mri',     name:'자기 공명 영상 장치', icon:'mri',   x:51, y:33, props:['power'],
   desc:'아주 센 전자석으로 몸속을 사진처럼 찍어요. 전류를 크게 해서 자석의 세기를 아주 세게 만들어요.'},
  {id:'washer',  name:'세탁기',          icon:'washer',   x:35, y:37, props:['pole'],
   desc:'전동기의 극의 방향을 번갈아 바꿔 세탁통을 왼쪽, 오른쪽으로 돌려요. 그래서 빨래가 한쪽으로 엉키지 않아요.'},
  {id:'dryer',   name:'머리 말리개',      icon:'dryer',    x:43, y:37, props:['power'],
   desc:'안에 있는 전동기 전자석의 세기를 바꿔 약한 바람과 센 바람을 만들어요.'},
  {id:'speaker', name:'스피커',          icon:'🔊',       x:49, y:39, props:['power'],
   desc:'전자석의 세기를 빠르게 바꿔 진동판을 떨게 해요. 세기가 크면 진동판이 크게 떨려 소리가 커져요.'},
];

/* ===== 판단 무리 ===== */
const LABELS = {
  good:   {name:'바른 사용', icon:'✅', color:'#25a862'},
  danger: {name:'위험',     icon:'⚠️', color:'#e5483a'},
  waste:  {name:'낭비',     icon:'💸', color:'#ee9a1c'},
};
const LABEL_KEYS = ['good', 'danger', 'waste'];

/* ===== 안전 마을 장면 14개 (사람이 판단, 로봇 학습 카드) ===== */
const SCENES = [
  {id:'s1',  x:4,  y:4,  icon:'💧🔌', label:'danger', text:'젖은 손으로 플러그를 꽂고 있다',
   why:'물이 묻은 손은 전기가 잘 통해서 감전될 수 있어요. 손을 먼저 닦아요.'},
  {id:'s2',  x:7,  y:4,  icon:'📺',   label:'waste',  text:'아무도 없는 방에 TV가 켜져 있다',
   why:'보는 사람이 없는데 켜 두면 전기가 그냥 낭비돼요. 안 볼 때는 꺼요.'},
  {id:'s3',  x:4,  y:6,  icon:'✋🔌', label:'good',   text:'플러그의 머리 부분을 잡고 뽑는다',
   why:'전선이 아니라 플러그 머리를 잡고 뽑아야 전선이 상하지 않아요.'},
  {id:'s4',  x:8,  y:6,  icon:'💡',   label:'good',   text:'형광등 대신 LED 등을 쓴다',
   why:'LED 등은 같은 밝기를 내면서 형광등보다 전기를 적게 써요.'},
  {id:'s13', x:10, y:6,  icon:'➰⚡', label:'danger', text:'피복이 벗겨진 전선을 그대로 쓰고 있다',
   why:'피복이 벗겨진 전선은 감전과 합선의 원인이 돼요. 바로 바꿔야 해요.'},
  {id:'s5',  x:16, y:4,  icon:'🔌🔌🔌', label:'danger', text:'콘센트 하나에 플러그를 여러 개 꽂아 쓰고 있다',
   why:'한 콘센트에 여러 기기를 꽂으면 전기가 한꺼번에 많이 흘러 전선이 뜨거워지고 불이 날 수 있어요.'},
  {id:'s6',  x:22, y:4,  icon:'➰🔌', label:'danger', text:'전선을 잡아당겨 플러그를 뽑고 있다',
   why:'전선을 당기면 속의 구리선이 끊어지거나 피복이 벗겨져 합선이나 화재가 날 수 있어요.'},
  {id:'s7',  x:16, y:6,  icon:'🧊',   label:'good',   text:'에너지 소비 효율 1등급 냉장고를 골랐다',
   why:'효율 등급이 높은(1등급) 제품은 같은 일을 하면서 전기를 덜 써요.'},
  {id:'s8',  x:22, y:6,  icon:'🧊🚪', label:'waste',  text:'냉장고 문을 열어 둔 채 무엇을 먹을지 고민한다',
   why:'문을 열어 두면 찬 공기가 빠져나가 냉장고가 전기를 더 많이 써요.'},
  {id:'s9',  x:4,  y:13, icon:'👶🔌', label:'danger', text:'아기 방 콘센트에 안전 덮개가 없다',
   why:'아이가 콘센트 구멍에 쇠붙이를 넣으면 감전될 수 있어요. 안 쓰는 콘센트엔 안전 덮개를 꽂아요.'},
  {id:'s10', x:8,  y:13, icon:'🛡️🔌', label:'good',   text:'사용하지 않는 콘센트에 안전 덮개를 꽂아 두었다',
   why:'안전 덮개는 콘센트 구멍을 막아 감전 사고를 막아 줘요.'},
  {id:'s14', x:10, y:12, icon:'☀️💡', label:'waste',  text:'낮인데도 방 전등을 모두 켜 두었다',
   why:'햇빛이 충분한 낮에는 전등을 꺼서 전기를 아껴요.'},
  {id:'s11', x:4,  y:15, icon:'🔋🔌', label:'waste',  text:'쓰지 않는 휴대폰 충전기를 콘센트에 계속 꽂아 두었다',
   why:'쓰지 않아도 꽂혀 있으면 대기 전력이 조금씩 새어 나가요.'},
  {id:'s12', x:9,  y:15, icon:'🚶🔌', label:'good',   text:'외출할 때 멀티탭 스위치를 끈다',
   why:'멀티탭 스위치를 끄면 대기 전력까지 막을 수 있어요.'},
];

/* ===== 시험 마을 장면 13개 (로봇 시험용, 순찰 뒤 공개) ===== */
const TEST_SCENES = [
  {id:'t1',  x:4,  y:26, icon:'💧💨', label:'danger', text:'물 묻은 손으로 헤어드라이어를 콘센트에 꽂는다',
   why:'물이 묻은 손으로 전기 기구를 만지면 감전될 수 있어요.'},
  {id:'t2',  x:10, y:26, icon:'❄️',   label:'waste',  text:'아무도 없는 거실에 에어컨이 계속 돌아간다',
   why:'사람이 없는 곳의 냉방은 전기 낭비예요.'},
  {id:'t3',  x:9,  y:28, icon:'💡',   label:'good',   text:'오래된 전구를 LED 전구로 바꿔 달았다',
   why:'LED 전구는 전기를 적게 쓰는 효율적인 조명이에요.'},
  {id:'t4',  x:17, y:26, icon:'🔌🔌', label:'danger', text:'멀티탭 하나에 전기난로와 다리미, 밥솥을 한꺼번에 꽂았다',
   why:'전기를 많이 쓰는 기기를 한곳에 꽂으면 과열되어 불이 날 수 있어요.'},
  {id:'t5',  x:23, y:26, icon:'💻🔌', label:'waste',  text:'다 쓴 노트북 충전기가 하루 종일 꽂혀 있다',
   why:'쓰지 않는 충전기도 대기 전력을 써요.'},
  {id:'t6',  x:18, y:28, icon:'✋🔌', label:'good',   text:'전기 기구를 다 쓰고 플러그 머리를 잡고 뺐다',
   why:'플러그 머리를 잡고 빼는 것이 안전한 방법이에요.'},
  {id:'t7',  x:4,  y:35, icon:'➰🔋', label:'danger', text:'선을 쭉 당겨서 충전기를 뺐다',
   why:'선을 당기면 전선이 손상되어 합선이 날 수 있어요.'},
  {id:'t8',  x:10, y:35, icon:'🧊🚪', label:'waste',  text:'냉장고 문을 활짝 열어 놓고 간식을 고른다',
   why:'냉장고 문을 오래 열면 전기를 더 써요.'},
  {id:'t9',  x:9,  y:37, icon:'🧺',   label:'good',   text:'에너지 효율 1등급 세탁기를 샀다',
   why:'효율 등급이 높은 제품은 전기를 덜 써요.'},
  {id:'t10', x:17, y:35, icon:'🥢🔌', label:'danger', text:'동생이 콘센트 구멍에 젓가락을 넣으려고 한다',
   why:'쇠붙이를 콘센트에 넣으면 감전돼요. 안전 덮개가 필요해요.'},
  {id:'t11', x:23, y:35, icon:'☀️💡', label:'waste',  text:'햇빛이 환한 낮에 거실 형광등이 켜져 있다',
   why:'밝은 낮에 켜 둔 전등은 전기 낭비예요.'},
  {id:'t12', x:18, y:37, icon:'🌙🔌', label:'good',   text:'잠자기 전에 멀티탭 스위치를 껐다',
   why:'멀티탭 스위치를 끄면 대기 전력을 막아요.'},
  {id:'t13', x:23, y:37, icon:'➰⚡', label:'danger', text:'껍질이 벗겨져 구리선이 보이는 전선을 계속 쓴다',
   why:'구리선이 드러난 전선은 감전과 합선 위험이 커요.'},
];

/* ===== 고철 데이터 (의사결정트리) ===== */
const TRAIN_ITEMS = [
  {id:'i1', name:'철 캔',          shape:'can',    material:'철',      heavy:false, big:false, colorName:'은색'},
  {id:'i2', name:'알루미늄 캔',     shape:'can',    material:'알루미늄', heavy:false, big:false, colorName:'은색'},
  {id:'i3', name:'철 파이프',       shape:'pipe',   material:'철',      heavy:true,  big:true,  colorName:'회색'},
  {id:'i4', name:'플라스틱 병',     shape:'bottle', material:'플라스틱', heavy:false, big:false, colorName:'투명'},
  {id:'i5', name:'구리 전선 뭉치',   shape:'wire',   material:'구리',    heavy:false, big:false, colorName:'주황'},
  {id:'i6', name:'철 자전거',       shape:'bike',   material:'철',      heavy:true,  big:true,  colorName:'빨강'},
  {id:'i7', name:'종이 상자',       shape:'box',    material:'종이',    heavy:false, big:true,  colorName:'갈색'},
  {id:'i8', name:'철 못 한 줌',     shape:'bolt',   material:'철',      heavy:false, big:false, colorName:'회색'},
];
const TEST_ITEMS = [
  {id:'j1', name:'철 아령',         shape:'dumbbell', material:'철',      heavy:true,  big:false, colorName:'검정'},
  {id:'j2', name:'철망 바구니',      shape:'basket',   material:'철',      heavy:false, big:true,  colorName:'회색'},
  {id:'j3', name:'알루미늄 사다리',  shape:'ladder',   material:'알루미늄', heavy:true,  big:true,  colorName:'은색'},
  {id:'j4', name:'철 프라이팬',      shape:'pan',      material:'철',      heavy:false, big:false, colorName:'검정'},
  {id:'j5', name:'구리 냄비',        shape:'pot',      material:'구리',    heavy:false, big:false, colorName:'주황'},
  {id:'j6', name:'플라스틱 의자',    shape:'chair',    material:'플라스틱', heavy:false, big:true,  colorName:'초록'},
  {id:'j7', name:'냉장고 철 문짝',   shape:'door',     material:'철',      heavy:true,  big:true,  colorName:'흰색'},
  {id:'j8', name:'유리병',          shape:'bottle',   material:'유리',    heavy:false, big:false, colorName:'투명'},
];
const COLOR_HEX = {'은색':'#c9ced6','회색':'#8a9099','빨강':'#d94141','투명':'#cfe8f3','주황':'#d9822b',
  '갈색':'#b07a45','검정':'#2f343b','파랑':'#4f7fbf','초록':'#3fae5a','흰색':'#f4f4f2'};

/* 크레인 두뇌의 질문: 재료·무게·크기·색 네 가지 특징을 하나씩만 묻는다(겹치는 질문 없음).
   metal(금속)은 철과 뜻이 겹쳐 학생이 헷갈려서 뺐다. 예전에 저장한 두뇌를 읽을 때만 쓴다. */
const QUESTIONS = {
  iron:   {text:'철로 만들었나요?', key:'재료', f: it => it.material === '철'},
  heavy:  {text:'무거운가요?',      key:'무게', f: it => it.heavy},
  big:    {text:'큰가요?',         key:'크기', f: it => it.big},
  silver: {text:'은색인가요?',      key:'색',   f: it => it.colorName === '은색'},
  metal:  {text:'금속인가요?',      key:'재료', f: it => ['철','알루미늄','구리'].includes(it.material), legacy:true},
};
const Q_ORDER = ['iron', 'heavy', 'big', 'silver'];
const ATTR = {재료:{icon:'🧱', cls:'mat'}, 무게:{icon:'⚖️', cls:'wt'}, 크기:{icon:'📏', cls:'sz'}, 색:{icon:'🎨', cls:'col'}};
const ACTIONS = {
  skip:   {text:'안 집기',             short:'안 집기'},
  weak:   {text:'약하게 집기 (전지 1개)', short:'약하게 (전지 1개)'},
  strong: {text:'세게 집기 (전지 2개)',   short:'세게 (전지 2개)'},
};
function correctAction(it){ return it.material === '철' ? (it.heavy ? 'strong' : 'weak') : 'skip'; }
function craneOutcome(it, act){
  const iron = it.material === '철';
  if (act === 'skip') return iron
    ? {ok:false, kind:'miss',    msg:'철 고철인데 그냥 지나쳤어요.'}
    : {ok:true,  kind:'ok',      msg:'전자석에 붙지 않는 물체라 지나친 게 맞아요.'};
  if (!iron)               return {ok:false, kind:'nostick', msg:`${josa(it.material, '은', '는')} 전자석에 붙지 않아요.`};
  if (act === 'weak' && it.heavy)  return {ok:false, kind:'drop',  msg:'너무 무거워서 전지 1개 전자석으로는 들 수 없어요.'};
  if (act === 'strong' && !it.heavy) return {ok:false, kind:'waste', msg:'옮기긴 했지만 가벼운 고철에 전기를 낭비했어요.'};
  return {ok:true, kind:'ok', msg:'알맞은 세기로 옮겼어요.'};
}

/* ===== 등장인물 ===== */
const NPCS = [
  {id:'volt',  name:'볼트 박사',      x:37, y:27, look:'doctor'},
  {id:'boss',  name:'무쇠 사장님',     x:41, y:9,  look:'worker'},
  {id:'auto',  name:'자동이',         x:38, y:7,  look:'robot'},
  {id:'guard', name:'안전이',         x:14, y:10, look:'guard'},
  {id:'sun',   name:'해님',           x:9,  y:4,  look:'kidSun'},
  {id:'moon',  name:'달님',           x:21, y:5,  look:'kidMoon'},
  {id:'star',  name:'별님',           x:6,  y:13, look:'kidStar'},
  {id:'guide', name:'시험 마을 안내원', x:15, y:23, look:'guide'},
];
const SIGNS = [
  {id:'sg1', x:26, y:18, text:'← 안전 마을: 해님네 · 달님네 · 별님네 집'},
  {id:'sg2', x:31, y:18, text:'↑ 공장 지대: 고철장 · 전자석 실험실 · 기차역'},
  {id:'sg3', x:12, y:23, text:'↓ 시험 마을: AI 안전 로봇 시험장 (집 안 장면은 순찰 뒤 공개)'},
  {id:'sg4', x:31, y:23, text:'→ AI 연구소 · 충전소 · 병원 · 빨래방 · 미용실 · 공연 무대'},
];

function buildStoryWorld(){
  const tiles = buildStoryTiles();
  const objects = [];
  for (const d of DEVICES) objects.push({type:'device', id:'dev_' + d.id, dev:d.id, x:d.x, y:d.y, name:d.name});
  for (const s of SCENES) objects.push({type:'scene', id:s.id, x:s.x, y:s.y, name:'살펴볼 장면'});
  for (const t of TEST_SCENES) objects.push({type:'test', id:t.id, x:t.x, y:t.y, name:'시험 장면'});
  objects.push({type:'mission', id:'m_exp',   act:'exp',    x:52, y:5,  name:'전자석 실험대',        emoji:'🧪'});
  objects.push({type:'mission', id:'m_crane', act:'crane',  x:40, y:5,  name:'크레인 조종석',        emoji:'🕹️'});
  objects.push({type:'mission', id:'m_tree',  act:'tree',   x:34, y:26, name:'AI 크레인 두뇌 컴퓨터', emoji:'🖥️'});
  objects.push({type:'mission', id:'m_nb',    act:'nb',     x:41, y:26, name:'AI 안전 로봇 컴퓨터',   emoji:'🖥️'});
  objects.push({type:'mission', id:'m_build', act:'editor', x:39, y:33, name:'맵 만들기 공방',       emoji:'🧱'});
  objects.push({type:'mission', id:'m_detect', act:'g_detect', x:45, y:27, name:'전자석 탐정 게임기',  emoji:'🔍'});
  objects.push({type:'mission', id:'m_home', act:'g_home', x:12, y:15, name:'우리 집 안전 탐정 게임기', emoji:'🏠'});
  objects.push({type:'mission', id:'m_tv',    act:'p_tv',    x:10, y:5,  name:'해님네 텔레비전',      emoji:'📺'});
  objects.push({type:'mission', id:'m_stage', act:'p_stage', x:19, y:5,  name:'달님네 역할놀이 무대',  emoji:'📣'});
  objects.push({type:'mission', id:'m_mart',  act:'p_mart',  x:7,  y:14, name:'별님네 가전제품 카탈로그', emoji:'🏷️'});
  for (const n of NPCS) objects.push({type:'npc', id:n.id, x:n.x, y:n.y, name:n.name, look:n.look});
  objects.push({type:'npc', id:'mayor', x:50, y:18, name:'시장님', look:'mayor'});
  objects.push({type:'sign', id:'sgCity', x:43, y:18, text:'🏛️ 시청 — 시장님(오른쪽)이 마을 일을 의논해요.'});
  objects.push({type:'sign', id:'sgPark', x:40, y:39, text:'🅿️ 주차장 — 차는 천천히, 사람은 보도로!'});
  for (const s of SIGNS) objects.push({type:'sign', id:s.id, x:s.x, y:s.y, name:'표지판', text:s.text});
  for (const [x, y] of [[33,3],[44,3],[33,9],[44,8]]) objects.push({type:'deco', kind:'scrap', id:'scrap'+x+y, x, y});
  objects.push({type:'deco', kind:'tower', id:'tower', x:53, y:25});
  // 가로등: 연구소에서 가까운 것부터 마을 전력이 오르면 하나씩 켜져요
  const spots = [];
  for (const x of [4, 10, 16, 22, 33, 40, 47, 54]) spots.push([x, 19]);
  for (const x of [7, 14, 21, 35, 42, 49, 56]) spots.push([x, 22]);
  spots.push([47, 27], [57, 27]);
  spots.sort((a, b) => Math.hypot(a[0] - 37.5, a[1] - 26.5) - Math.hypot(b[0] - 37.5, b[1] - 26.5));
  spots.forEach(([x, y], i) => objects.push({type:'deco', kind:'lamp', id:'lamp' + i, x, y, thr:+(.14 + .74 * i / (spots.length - 1)).toFixed(3)}));
  return {
    kind:'story', title:'전기 마스터 타운', w:60, h:44, tiles, objects,
    spawn:{x:37.5, y:26.6},
    lines:[{axis:'x', at:21, from:1, to:58, skip:[28,30]}, {axis:'y', at:29, from:1, to:42, skip:[20,22]}],
    crosswalks:[{x:26, y:20, w:1, h:2, v:true}, {x:31, y:20, w:1, h:2, v:true}, {x:28, y:18, w:2, h:1, v:false}, {x:28, y:23, w:2, h:1, v:false},
      {x:8, y:20, w:1, h:2, v:true}, {x:50, y:20, w:1, h:2, v:true}, {x:28, y:32, w:2, h:1, v:false}, {x:28, y:39, w:2, h:1, v:false}],
    cars:[
      {axis:'x', dir:1,  lane:21.5, pos:6,  speed:3.2, color:'#d94141'},
      {axis:'x', dir:-1, lane:20.5, pos:42, speed:2.7, color:'#3a8ee6', ev:true},
      {axis:'y', dir:1,  lane:28.5, pos:8,  speed:3.0, color:'#ffd23f'},
      {axis:'y', dir:-1, lane:29.5, pos:36, speed:2.6, color:'#2fb36b', ev:true, quest:true},
      {axis:'x', dir:1, lane:41.45, pos:40.2, speed:0, color:'#c58bff', parked:true},
    ],
  };
}

/* ===== 대사 ===== */
const LINES = {
  voltIntro: [
    '어서 와요, 견습생! 나는 AI 연구소를 맡은 볼트 박사예요. 찌릿!',
    '보다시피 마을 불이 깜빡이죠? 발전소 계기판을 보니 전기가 점점 모자라요. 이대로면 점등식 날 전구탑을 켤 전기가 남지 않을 거예요.',
    '원인은 두 가지로 보여요. 하나는 고철장 크레인이 전기를 마구 쓰는 것, 다른 하나는 집집마다 전기를 위험하게 쓰거나 낭비하는 것이에요.',
    '그래서 두 가지를 배워야 해요. 전자석이 어떻게 일하는지, 그리고 전기를 안전하게 아껴 쓰는 방법이요.',
    '마을이 너무 넓어서 사람 혼자서는 다 못 살펴요. 그래서 AI를 직접 가르쳐 도움을 받을 거예요. 단, AI는 틀릴 수 있으니 우리가 꼭 확인해야 해요!',
    '배울 것은 세 구역에 나눠 두었어요. 광장의 큰 문 세 개가 바로 1차시 · 2차시 · 3차시 구역이에요. 앞 구역을 끝내야 다음 구역 문이 열려요.',
    '구역 안에는 방이 이어져 있어요. 방마다 맡은 사람에게 말을 걸고 활동을 끝내면 오른쪽 포털이 열려 다음 방으로 갈 수 있어요. 그 사람은 머리 위에 ! 가 뜨고 폴짝폴짝 뛰어요!',
    '마을 사람들과 동물 친구들도 도움이 필요해요. 특히 2차시 마지막에는 친구들을 모두 만나야 전기 자전거를 탈 수 있어요. 자, 오늘 들어갈 구역부터 골라 볼까요?',
  ],
  boss: [
    '고철장에 온 걸 환영해요! 저기 크레인 끝에 달린 둥근 판이 바로 전자석이에요.',
    '철 고철만 골라서 오른쪽 고철함에 넣어야 해요. 그런데 전기는 아껴 써야 해요!',
    '크레인 조종석에서 직접 해 보고, 익숙해지면 AI 연구소에서 AI 크레인 두뇌를 만들어 줘요. 새 고철 트럭이 곧 오거든요.',
  ],
  guard: [
    '안녕하세요! 저는 안전 마을 지킴이예요.',
    '해님네, 달님네, 별님네 집 안에 살펴볼 장면이 14개 숨어 있어요. 느낌표(!)를 찾아보세요.',
    '각 장면이 바른 사용인지, 위험한지, 전기 낭비인지 판단해 주세요. 판단한 장면은 AI 안전 로봇을 가르칠 학습 카드가 돼요.',
  ],
  guide: [
    '여기는 AI 안전 로봇의 시험 마을이에요.',
    '로봇이 한 번도 본 적 없는 집들이라서 로봇 실력을 공정하게 시험할 수 있어요.',
    '집 안 장면은 로봇이 순찰을 마친 뒤에 공개돼요. 정답을 미리 보고 외우게 하면 공정한 시험이 아니니까요!',
  ],
};
