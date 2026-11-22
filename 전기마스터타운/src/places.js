/* =========================================================
   🧭 자유 탐험 장소 — 전자석 제품 상점 · 병원 MRI 영상관 · 과학 박물관
   어디에 무엇이 있는지는 course.js의 places, 들어가고 나오는 길은 zone.js가 맡는다.
   여기서는 방 안의 볼거리(thing)를 그리고, 다가가 E를 눌렀을 때 할 일을 정한다.
   ========================================================= */
const PLACE = {sit:null, playing:false};
const MRI_VIDEO = {embed:'https://www.youtube-nocookie.com/embed/eklazh-U1KM?rel=0', url:'https://youtu.be/eklazh-U1KM'};
function placeState(){
  if (!SAVE.places || typeof SAVE.places !== 'object') SAVE.places = {};
  const P = SAVE.places; P.museum = P.museum || {}; P.video = P.video || 0; return P;
}

/* ===== 박물관 액자 ===== */
const MUSEUM = {
  e1:{icon:'💡', year:'1879', title:'오래 켜지는 백열전구', text:'에디슨은 수많은 재료로 필라멘트를 시험한 끝에, 집에서 오래 쓸 수 있는 백열전구를 만들었어요.', link:'전구는 전기 에너지를 빛으로 바꿔요. 오늘날에는 같은 밝기에 전기를 훨씬 덜 쓰는 LED 전구를 써요. (3차시 효율 등급과 이어져요)'},
  e2:{icon:'🏭', year:'1882', title:'펄 스트리트 발전소', text:'뉴욕에 전기를 만들어 여러 건물에 전선으로 보내는 발전소를 열었어요. 발전기 안에서는 전자석과 코일이 돌며 전기를 만들었어요.', link:'전자석은 전기를 쓰는 곳뿐 아니라 전기를 만드는 발전기 안에도 들어 있어요.'},
  e3:{icon:'🎵', year:'1877', title:'축음기', text:'소리를 녹음했다가 다시 들려주는 기계를 발명했어요. 사람들은 처음으로 녹음된 목소리를 들었어요.', link:'오늘날 스피커는 전자석의 세기를 빠르게 바꿔 진동판을 떨게 해서 소리를 내요. (1차시 교실 속 전자석)'},
  e4:{icon:'🧪', year:'1876~', title:'발명 연구소와 1,093개의 특허', text:'멘로파크에 여러 사람이 함께 실험하는 연구소를 세우고, 미국에서만 특허를 1,093개 받았어요.', link:'예상하고, 실험하고, 틀리면 고쳐서 다시 해 보는 방법은 우리가 AI를 가르칠 때와 같아요.'},
  e5:{icon:'💬', year:'에디슨의 말', title:'“천재는 1%의 영감과 99%의 노력으로 이루어진다.”', text:'전구를 완성하기까지 셀 수 없이 실패했지만, 그때마다 “안 되는 방법 하나를 찾았다”고 생각했대요.', link:'AI 크레인 두뇌가 틀렸을 때 질문을 고쳐 다시 굴려 본 것처럼, 실패도 배움이에요.'},
  t1:{icon:'🌀', year:'1888', title:'교류 유도 전동기', text:'테슬라는 전자석 여러 개에 차례로 전류를 흘려 빙글빙글 도는 자기장을 만들고, 그 힘으로 전동기를 돌렸어요.', link:'선풍기·세탁기·전기 자동차의 전동기 속 전자석이 바로 이렇게 극을 바꿔 가며 돌아가요.'},
  t2:{icon:'🌊', year:'1895~1896', title:'나이아가라 폭포 수력 발전', text:'테슬라의 교류(AC) 방식으로 나이아가라 폭포에서 만든 전기를 멀리 떨어진 도시 버펄로까지 보냈어요.', link:'우리 집 콘센트에 들어오는 전기도 교류예요. 교류는 멀리 보내기 좋아요.'},
  t3:{icon:'⚡', year:'1891', title:'테슬라 코일', text:'아주 높은 전압을 만들어 공기 중에 번개 같은 불꽃을 일으키는 장치예요. 전선 없이 전기를 보내는 꿈을 꾸었어요.', link:'옆에 있는 테슬라 코일 모형을 봐요. 높은 전압은 위험하니 실제로는 전문가만 다뤄요.'},
  t4:{icon:'🧲', year:'단위', title:'자기장의 세기 단위 ‘테슬라(T)’', text:'자석이 얼마나 센지를 나타내는 단위에 테슬라의 이름이 붙었어요.', link:'병원 MRI의 전자석은 보통 1.5~3 테슬라로, 냉장고 자석보다 수백 배나 세요. (병원 MRI 영상관에서 더 알아봐요)'},
  t5:{icon:'⚔️', year:'1880년대 말', title:'전류 전쟁: 직류와 교류', text:'에디슨은 직류(DC), 테슬라와 웨스팅하우스는 교류(AC)를 내세워 경쟁했어요. 결국 멀리 보내기 좋은 교류가 널리 쓰이게 되었어요.', link:'건전지는 직류, 집 콘센트는 교류예요. 두 사람 모두 오늘날 전기 생활의 바탕을 만들었어요.'},
};
const BUSTS = {
  edison:{name:'토머스 에디슨 (1847~1931)', lines:['미국의 발명가예요. 전구, 축음기, 발전소처럼 전기를 생활 속으로 가져온 발명을 많이 했어요.', '벽에 걸린 액자 네 개와 가운데 안내판을 모두 살펴보면 관람 도장을 받을 수 있어요.']},
  tesla:{name:'니콜라 테슬라 (1856~1943)', lines:['세르비아계 미국 발명가예요. 교류 전기와 전자석으로 도는 전동기를 만들어 오늘날 전기 생활의 바탕을 놓았어요.', '전기 자동차 회사 이름도 그의 이름에서 따왔대요. 액자를 모두 살펴봐요!']},
};
function openFrame(key){
  const f = MUSEUM[key]; if (!f) return;
  const P = placeState(), first = !P.museum[key];
  P.museum[key] = true; persist();
  const n = Object.keys(MUSEUM).filter(k => P.museum[k]).length, all = n === Object.keys(MUSEUM).length;
  if (first){ award(key[0] === 't' ? 'em' : 'eco', 3); SFX.ping(); }
  openPanel(`<div class="museum-frame"><div class="mf-art"><span>${f.icon}</span><small>${esc(f.year)}</small></div>
    <h2>${esc(f.title)}</h2><p>${esc(f.text)}</p><div class="note">🔗 ${esc(f.link)}</div>
    <p class="mf-stamp">🏛️ 관람 도장 ${n}/${Object.keys(MUSEUM).length}${all ? ' · 완성!' : ''}</p><button class="btn primary" data-close>계속 관람하기</button></div>`);
  if (first && all){ award('em', 10); award('eco', 10); rpgToast('🏛️ <b>박물관 관람 도장 완성!</b> 에디슨과 테슬라의 업적을 모두 살펴봤어요.', 'item'); SFX.win(); }
  updateHUD();
}

/* ===== 다가가 E ===== */
function placeInteract(o){
  if (o.kind === 'wrapBoard') return wrapBoardTalk(o);
  if (o.kind === 'shopDesk') return mgOpenGame('shop');
  if (o.kind === 'screen' || o.kind === 'seat') return watchVideo(o);
  if (o.kind === 'mri') return mriThing();
  if (o.kind === 'frame') return openFrame(o.key);
  if (o.kind === 'bust'){ const B = BUSTS[o.who]; return showDialog(B.name, B.lines); }
}
/* 장소 사람들 (상점 주인 · 의사 선생님): 처리했으면 true */
function placeNpcTalk(o){
  if (o.id === 'shopkeeper'){
    let play = false;
    showDialog(o.name, ['어서 오세요! 전자석 제품 상점이에요. 전자석이 든 물건, 안 든 물건, 그리고 영구 자석까지 다 있지요.',
      {who:o.name, text:'저랑 게임 한 판 할래요? 이기면 번개(⚡)를 드려요!', choices:[{label:'좋아요, 게임 할래요!', fn:() => { play = true; }}, {label:'구경만 할게요'}]}],
      () => { if (play) mgOpenGame('shop'); });
    return true;
  }
  if (o.id === 'doctor'){
    const quest = typeof streetMRIReady === 'function' && streetMRIReady();
    showDialog(o.name, quest ? ['어서 오렴! 다친 분이 MRI 검사를 받으러 왔단다. 저 안쪽의 MRI 앞에서 E를 눌러 볼래?']
      : ['여기는 병원 MRI 영상관이란다. 의자에 앉으면 MRI가 어떻게 전자석으로 몸속을 보는지 영상을 볼 수 있어.', '오른쪽 위의 커다란 통이 진짜 MRI야. 가까이 가서 살펴보렴.']);
    return true;
  }
  return false;
}
function placeThingDone(o){
  if (o.kind === 'wrapBoard') return wrapBoardDone(o);
  if (o.kind === 'frame') return !!placeState().museum[o.key];
  if (o.kind === 'seat') return true;   /* ! 표시는 화면에만 */
  if (o.kind === 'screen') return placeState().video > 0;
  if (o.kind === 'mri') return !(typeof streetMRIReady === 'function' && streetMRIReady());
  if (o.kind === 'shopDesk') return [0, 1, 2].some(s => mgBolts('shop', s) > 0);
  return true;
}
function mriThing(){
  const dev = DEVICES.find(d => d.id === 'mri');
  if (typeof streetMRIReady === 'function' && streetMRIReady()) return mriFinale(dev, () => { SAVE.dex.mri = {done:true}; persist(); updateHUD(); checkMasters(); });
  showDialog('MRI (자기 공명 영상 장치)', ['커다란 둥근 통 안에 아주 센 전자석이 들어 있어요. 전류를 크게 흘려 냉장고 자석보다 수백 배 센 자석을 만들어요.',
    '검사할 때만 켜고, 전류의 세기로 자석의 세기를 조절해요. 그래서 시계·열쇠 같은 쇠붙이는 꼭 빼고 들어가야 해요.', '의자에 앉아 영상을 보면 더 자세히 알 수 있어요!']);
}
/* 영상관: 의자에 앉으면 카메라가 화면을 비추고, 영상 창이 열린다 */
function watchVideo(o){
  const seats = WORLD.objects.filter(q => q.kind === 'seat'), scr = WORLD.objects.find(q => q.kind === 'screen');
  const seat = o.kind === 'seat' ? o : seats.sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];
  if (!seat || !scr) return;
  PLACE.sit = {x:seat.x + .5, y:seat.y + .62}; player.x = PLACE.sit.x; player.y = PLACE.sit.y; player.ang = Math.PI; player.moving = false;
  PLACE.playing = true; ZONE.focus = {x:scr.x + .5, z:scr.y + 1.1, ty:1.5, dist:4.6, pitch:.3};   /* 좌석 뒤 방 안에서 화면을 본다 */ SFX.tone(330, .4, 'sine', .03, 120);
  setTimeout(() => {
    if (!PLACE.playing) return;
    const P = placeState();
    const p = openPanel(`<div class="cinema"><h2>🎬 MRI는 어떻게 몸속을 볼까?</h2>
      <div class="cine-frame"><iframe src="${MRI_VIDEO.embed}" title="MRI 영상" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>
      <p class="sub">영상이 안 보이면 <a href="${MRI_VIDEO.url}" target="_blank" rel="noopener">유튜브에서 열기</a></p>
      <div class="cine-q"><b>보고 나서 답해 봐요 · MRI는 전자석의 어떤 성질을 이용할까요?</b>
        <div class="choice-grid">${mgShuffle([['ok', '전류를 크게 흘려 아주 센 자석을 만든다 (세기)'], ['x1', '전기가 없어도 늘 자석이라 끌 수 없다'], ['x2', '전자석과는 상관없고 빛으로만 찍는다']]).map(([k, t]) => `<button class="btn choice" data-a="${k}">${t}</button>`).join('')}</div><div id="cineRes"></div></div>
      <div class="row" style="margin-top:10px"><button class="btn" data-close>일어나기</button></div></div>`, {wide:true, onClose:standUp});
    p.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
      const ok = b.dataset.a === 'ok';
      if (ok){ SND.ok(); p.querySelector('#cineRes').innerHTML = '<div class="okbox"><b>맞아요!</b> MRI는 전자석에 큰 전류를 흘려 아주 센 자석을 만들고, 검사할 때만 켜요. 전자석의 세기를 바꿀 수 있는 성질을 이용해요.</div>'; if (!P.video){ P.video = 1; persist(); award('em', 8); } }
      else { SND.bad(); b.disabled = true; p.querySelector('#cineRes').innerHTML = '<div class="warnbox">다시 생각해 봐요. 이름에 ‘자기’가 들어 있고, 의사 선생님이 켜고 끈대요.</div>'; }
    });
  }, 1300);
}
function standUp(){
  if (!PLACE.sit) return;
  PLACE.sit = null; PLACE.playing = false; ZONE.focus = null; player.y += .8; updateHUD();
}

/* ===== 3D 그리기 ===== */
function mkThing(kind, arg){
  const b = new VB(), B = (x0, y0, z0, x1, y1, z1, c, e) => vbBox(b, x0, y0, z0, x1, y1, z1, c, e == null ? -1 : e);
  if (kind === 'screen'){ B(-1.55, .7, -.52, 1.55, 2.7, -.42, '#1d2228'); B(-1.45, .8, -.43, 1.45, 2.6, -.41, arg ? '#5ec8ff' : '#2a3a4a', arg ? 3 : -1); B(-1.6, 2.7, -.55, 1.6, 2.85, -.38, '#8a2b2b'); }
  else if (kind === 'seat'){ B(-.3, 0, -.3, .3, .42, .28, '#4a1f24'); B(-.3, .42, -.3, .3, .5, .28, '#b8283f'); B(-.3, .5, .2, .3, 1.0, .3, '#b8283f'); B(-.36, .3, -.3, -.3, .7, .3, '#3a1a1e'); B(.3, .3, -.3, .36, .7, .3, '#3a1a1e'); }
  else if (kind === 'mri'){
    for (let k = 0; k < 18; k++){ const a = k / 18 * Math.PI * 2, y = 1.15 + Math.sin(a) * .78, z = Math.cos(a) * .78; B(-.55, y - .2, z - .2, .55, y + .2, z + .2, '#eef3f8'); }
    for (let k = 0; k < 18; k++){ const a = k / 18 * Math.PI * 2, y = 1.15 + Math.sin(a) * .5, z = Math.cos(a) * .5; B(-.57, y - .05, z - .05, -.55, y + .05, z + .05, '#5ec8ff', 3); }
    B(-1.6, .5, -.28, 1.4, .62, .28, '#c9ced6'); B(-1.6, 0, -.2, -1.3, .5, .2, '#8a9099'); B(-1.5, .62, -.24, -.9, .7, .24, '#ffffff');
  } else if (kind === 'bust'){
    const br = '#b07a45', dk = '#7a5233';
    B(-.34, 0, -.34, .34, 1.0, .34, '#3a3f47'); B(-.38, .95, -.38, .38, 1.02, .38, '#5b6573');
    B(-.36, 1.02, -.18, .36, 1.32, .18, br); B(-.12, 1.32, -.1, .12, 1.42, .1, br);
    B(-.17, 1.42, -.17, .17, 1.82, .17, br); B(-.05, 1.55, .17, .05, 1.65, .21, dk);
    if (arg === 'edison'){ B(-.19, 1.74, -.19, .19, 1.9, .17, '#d8d1c3'); B(-.2, 1.6, -.19, -.17, 1.8, .1, '#d8d1c3'); B(.17, 1.6, -.19, .2, 1.8, .1, '#d8d1c3'); }
    else { B(-.19, 1.76, -.19, -.01, 1.92, .17, dk); B(.01, 1.76, -.19, .19, 1.92, .17, dk); B(-.09, 1.5, .17, .09, 1.54, .2, dk); }
  } else if (kind === 'frame'){
    if (arg){ B(-.04, 0, -.04, .04, 1.2, .04, '#6b4523'); B(-.5, 1.0, -.08, .5, 1.95, -.02, '#d4a72c'); B(-.44, 1.06, -.02, .44, 1.89, 0, '#fff8e6'); }
    else { B(-.55, 1.05, -.5, .55, 2.15, -.42, '#d4a72c'); B(-.48, 1.12, -.42, .48, 2.08, -.4, '#fff8e6'); }
  } else if (kind === 'shopDesk'){ B(-.5, 0, -.3, .5, .95, .3, '#8a2b6a'); B(-.52, .95, -.32, .52, 1.0, .32, '#ff7ad9'); B(-.2, 1.0, -.15, .2, 1.25, .1, '#2f343b'); B(-.15, 1.05, .1, .15, 1.2, .11, '#ffd23f', 2); }
  return b.mesh();
}
function placeDraw3D(o, t, gy){
  if (o.kind === 'wrapBoard') return wrapBoardDraw3D(o, t, gy);
  const cx = o.x + .5, cz = o.y + .5;
  if (o.kind === 'screen') drawM(model('thing:screen' + (PLACE.playing ? 1 : 0), () => mkThing('screen', PLACE.playing)), M4.trs(cx, gy, cz));
  else if (o.kind === 'frame'){ drawM(model('thing:frame' + (o.stand ? 1 : 0), () => mkThing('frame', o.stand)), M4.trs(cx, gy, cz)); const f = MUSEUM[o.key]; if (f) sprAdd(cx, gy + (o.stand ? 1.48 : 1.6), cz + (o.stand ? .02 : -.36), iconBadge('scene', f.icon), .34); }
  else drawM(model('thing:' + o.kind + (o.who || ''), () => mkThing(o.kind, o.who)), M4.trs(cx, gy, cz));
  if (o.kind === 'shopDesk') sprAdd(cx, gy + 1.7 + Math.sin(t * 2.4) * .06, cz, iconBadge('mis', '🎲'), .38);
  if (o.kind === 'screen' && !PLACE.playing) sprAdd(cx, gy + 1.7, cz - .3, iconBadge('mis', '▶️'), .45);
  if (o.kind !== 'frame' && o.kind !== 'screen') SHADOWS.push([cx, gy, cz, o.kind === 'mri' ? 1.3 : .45]);
  return true;
}
function placeLights(){
  if (!WORLD || WORLD.kind !== 'room') return;
  for (const o of WORLD.objects){
    if (o.type !== 'thing') continue;
    if (o.kind === 'screen' && PLACE.playing) addLight(o.x + .5, 1.6, o.y + 1.2, 10, [.5, .8, 1]);
    else if (o.kind === 'mri') addLight(o.x + .5, 1.2, o.y + 1.2, 5, [.6, .9, 1]);
    else if (o.kind === 'frame') addLight(o.x + .5, 2.4, o.y + .9, 4, [1, .9, .7]);
  }
}

/* ===== 🧲 전자석 제품 상점 게임 ===== */
const SHOP_ITEMS = [
  {id:'fan', name:'선풍기', icon:'🌀', price:31800, em:true, clues:['안에 든 전동기가 전자석의 힘으로 돌아가요.', '전자석의 세기를 바꿔 바람 세기를 조절해요.', '여름에 날개를 돌려 바람을 만들어요.']},
  {id:'speaker', name:'스피커', icon:'🔊', price:17600, em:true, clues:['전자석의 세기를 아주 빠르게 바꿔 얇은 판을 떨게 해요.', '판이 크게 떨리면 큰 소리가 나요.', '음악을 들을 때 써요.']},
  {id:'dryer', name:'헤어드라이어', icon:'💨', price:24900, em:true, clues:['전동기 속 전자석으로 작은 날개를 돌려요.', '약한 바람과 센 바람을 골라요.', '젖은 머리를 말릴 때 써요.']},
  {id:'bell', name:'전기 초인종', icon:'🔔', price:8900, em:true, clues:['버튼을 누를 때만 전자석이 쇠막대를 끌어당겨요.', '전기가 끊기면 쇠막대가 제자리로 돌아가요.', '딩동 소리로 손님이 온 것을 알려요.']},
  {id:'robovac', name:'로봇 청소기', icon:'🤖', price:58700, em:true, clues:['바퀴 전동기의 극의 방향을 바꿔 앞뒤로 움직여요.', '먼지를 빨아들이는 힘의 세기를 바꿔요.', '스스로 집 안을 돌아다니며 청소해요.']},
  {id:'washer', name:'세탁기', icon:'🧺', price:89900, em:true, clues:['전동기의 극의 방향을 번갈아 바꿔 통을 좌우로 돌려요.', '빨래가 한쪽으로 엉키지 않아요.', '물과 세제로 옷을 빨아요.']},
  {id:'drone', name:'장난감 드론', icon:'🚁', price:26300, em:true, clues:['전동기 4개의 세기를 따로따로 바꿔 방향을 틀어요.', '날개가 빨리 돌면 떠올라요.', '하늘을 나는 장난감이에요.']},
  {id:'crane', name:'장난감 전자석 기중기', icon:'🏗️', price:13400, em:true, clues:['스위치를 켤 때만 클립을 끌어당겨요.', '전지 수를 늘리면 더 많이 들어 올려요.', '공사장 크레인을 닮은 장난감이에요.']},
  {id:'magnet', name:'영구 자석 세트', icon:'🧲', price:4800, perm:true},
  {id:'fridge', name:'냉장고 자석', icon:'🧷', price:2600, perm:true},
  {id:'compass', name:'나침반', icon:'🧭', price:6700, perm:true},
  {id:'torch', name:'LED 손전등', icon:'🔦', price:7900},
  {id:'calc', name:'계산기', icon:'🧮', price:5600},
  {id:'lamp', name:'LED 스탠드', icon:'💡', price:11800},
];
const SHOP_BUDGET = 60000;
const shopTag = it => it.em ? '<span class="chip good">⚡ 전자석</span>' : it.perm ? '<span class="chip waste">🧲 영구 자석</span>' : '<span class="chip skip">✖ 전자석 없음</span>';
/* 1. 가진 돈으로 전자석 제품을 가장 많이 사기 */
function shopBuy(api){
  const shelf = mgShuffle(mgShuffle(SHOP_ITEMS.filter(i => i.em)).slice(0, 6).concat(mgShuffle(SHOP_ITEMS.filter(i => !i.em)).slice(0, 5)));
  const best = (() => { let left = SHOP_BUDGET, n = 0; for (const p of shelf.filter(i => i.em).map(i => i.price).sort((a, b) => a - b)) if (p <= left){ left -= p; n++; } return n; })();
  const S = {cart:new Set(), t:75, done:false};
  api.canvas(false);
  api.say(`예산 <b>${won(SHOP_BUDGET)}원</b>으로 <b>전자석이 들어간 제품</b>을 가장 많이 사요. 영구 자석이나 전자석이 없는 물건을 사면 손해! 75초 안에 [계산하기].`);
  const el = api.dom(`<div class="shop"><div class="shop-grid">${shelf.map((it, i) => `<button class="shop-it" data-i="${i}"><span class="si-ic">${it.icon}</span><b>${esc(it.name)}</b><small>${won(it.price)}원</small></button>`).join('')}</div>
    <div class="shop-bar"><span id="shSum"></span><span id="shN"></span></div></div>`);
  const bot = api.bot('<button class="btn primary big" id="shPay">🧾 계산하기</button>');
  const sum = () => [...S.cart].reduce((s, i) => s + shelf[i].price, 0);
  const upd = () => { const t = sum(); $('#shSum').innerHTML = `장바구니 <b class="${t > SHOP_BUDGET ? 'over' : ''}">${won(t)}원</b> / ${won(SHOP_BUDGET)}원`; $('#shN').textContent = `${S.cart.size}개 담음`; };
  el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
    if (S.done || MG.ended) return;
    const i = +b.dataset.i;
    if (S.cart.has(i)) S.cart.delete(i); else { if (sum() + shelf[i].price > SHOP_BUDGET){ SFX.buzz(); return api.say('그건 예산을 넘어요! 다른 물건을 빼고 담아요.', 'bad'); } S.cart.add(i); }
    b.classList.toggle('on', S.cart.has(i)); SND.tick(); upd();
  });
  const pay = () => {
    if (S.done) return; S.done = true;
    const got = [...S.cart].map(i => shelf[i]), em = got.filter(i => i.em).length, wrong = got.length - em;
    const bolts = em === best && !wrong ? 3 : em >= best - 1 && wrong <= 1 ? 2 : em >= 1 ? 1 : 0;
    api.end(bolts, `전자석 제품 <b>${em}개</b>를 샀어요 (이 예산으로 살 수 있는 최대 ${best}개). 전자석이 없는 물건 ${wrong}개.`,
      `<div class="tblwrap"><table class="tbl"><thead><tr><th>물건</th><th>값</th><th>전자석?</th><th>샀나요</th></tr></thead><tbody>${shelf.map((it, i) => `<tr><td>${it.icon} ${esc(it.name)}</td><td>${won(it.price)}원</td><td>${shopTag(it)}</td><td>${S.cart.has(i) ? '🛒' : ''}</td></tr>`).join('')}</tbody></table></div>
      <div class="mg-learn">💡 <b>값이 싼 전자석 제품부터</b> 담으면 가장 많이 살 수 있어요. 영구 자석(나침반·냉장고 자석)은 늘 자석이라 끄거나 세기를 바꿀 수 없어요.</div>`);
  };
  bot.querySelector('#shPay').onclick = pay;
  api.loop(dt => { if (S.done) return; S.t -= dt; api.stat(`⏱️ ${mgClock(S.t)} · 🛒 ${S.cart.size}`); if (S.t <= 0){ api.say('⏰ 시간 끝! 담은 물건으로 계산해요.', 'bad'); pay(); } });
  upd();
}
/* 2. 전자석 제품 값 어림하기 */
function shopGuess(api){
  const S = {r:0, ok:0, combo:0, pts:0, t:15, lock:false}, R = 5;
  api.canvas(false);
  const round = () => {
    const items = mgShuffle(SHOP_ITEMS.filter(i => i.em)).slice(0, 3), total = items.reduce((s, i) => s + i.price, 0), ans = Math.round(total / 10000) * 10000;
    const opts = mgShuffle([ans].concat(mgShuffle([-40000, -20000, 20000, 40000].map(d => ans + d).filter(v => v > 0)).slice(0, 3)));   /* 보기는 2만 원씩 떨어져 있어 어림하면 고를 수 있다 */
    S.t = 15; S.lock = false; S.items = items; S.total = total; S.ans = ans;
    api.say(`${S.r + 1}/${R}번 · 세 물건을 모두 사면 <b>대략</b> 얼마일까요? 💡 만 원 단위로 반올림한 값끼리 더하면 빨라요.`);
    const el = api.dom(`<div class="shop"><div class="shop-grid three">${items.map(it => `<div class="shop-it static"><span class="si-ic">${it.icon}</span><b>${esc(it.name)}</b><small>${won(it.price)}원</small></div>`).join('')}</div>
      <h4 style="text-align:center">모두 합치면 대략?</h4><div class="shop-opts">${opts.map(v => `<button class="btn big" data-v="${v}">약 ${won(v)}원</button>`).join('')}</div></div>`);
    el.querySelectorAll('[data-v]').forEach(b => b.onclick = () => answer(+b.dataset.v, b));
  };
  const answer = (v, b) => {
    if (S.lock || MG.ended) return; S.lock = true;
    const ok = v === S.ans;
    if (ok){ S.ok++; S.combo++; const p = 10 * S.combo + Math.ceil(S.t); S.pts += p; SND.ok(); fxBanner(S.combo >= 2 ? `콤보 x${S.combo}! +${p}` : `정답! +${p}`, '#8ff0b9', .9, 34); }
    else { S.combo = 0; SND.bad(); fxShake(.1); if (b) b.classList.add('shake'); }
    api.say(`${ok ? '⭕' : '❌'} 실제 합계는 <b>${won(S.total)}원</b>, 어림한 값은 약 ${won(S.ans)}원이에요. (${S.items.map(i => `${won(i.price)} → 약 ${won(Math.round(i.price / 10000) * 10000)}`).join(' · ')})`, ok ? 'ok' : 'bad');
    api.after(2300, () => { S.r++; if (S.r >= R) api.end(S.ok >= 5 ? 3 : S.ok >= 4 ? 2 : S.ok >= 2 ? 1 : 0, `${R}번 중 <b>${S.ok}번</b> 맞혔어요. 점수 ${S.pts}점.`); else round(); });
  };
  api.loop(dt => { if (S.lock || MG.ended) return; S.t -= dt; api.stat(`🧮 ${S.r + 1}/${R} · ⭐ ${S.pts}${S.combo >= 2 ? ` · 🔥x${S.combo}` : ''} · ${mgClock(S.t)}`); if (S.t <= 0){ api.say('⏰ 시간이 지났어요!', 'bad'); answer(-1); } });
  round();
}
/* 3. 특징을 보고 어떤 전자석 제품인지 맞히기 (단서가 하나씩 늘어난다: 빨리 맞힐수록 점수가 커요) */
function shopClue(api){
  const pool = mgShuffle(SHOP_ITEMS.filter(i => i.em)), S = {r:0, hearts:3, pts:0, ok:0, shown:1, ct:0, lock:false}, R = 5;
  api.canvas(false);
  const round = () => {
    const it = pool[S.r % pool.length], opts = mgShuffle([it].concat(mgShuffle(pool.filter(x => x !== it)).slice(0, 3)));
    Object.assign(S, {it, opts, shown:1, ct:0, lock:false});
    draw();
  };
  const draw = () => {
    const el = api.dom(`<div class="shop"><div class="shop-clues">${S.it.clues.map((c, i) => `<div class="clue ${i < S.shown ? 'on' : ''}">${i < S.shown ? `🔎 단서 ${i + 1}. ${esc(c)}` : `🔒 단서 ${i + 1}`}</div>`).join('')}</div>
      <div class="shop-grid four">${S.opts.map((o, k) => `<button class="shop-it" data-k="${k}"><span class="si-ic">${o.icon}</span><b>${esc(o.name)}</b></button>`).join('')}</div></div>`);
    el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => answer(+b.dataset.k, b));
    api.say(`${S.r + 1}/${R}번 · 어떤 전자석 제품일까요? 단서가 적을 때 맞히면 점수가 커요!`);
  };
  const answer = (k, b) => {
    if (S.lock || MG.ended) return;
    if (S.opts[k] === S.it){
      S.lock = true; S.ok++; const p = [30, 20, 10][S.shown - 1] || 10; S.pts += p; SND.ok(); fxBanner(`${S.it.name}! +${p}`, '#8ff0b9', .9, 34);
      api.say(`⭕ <b>${esc(S.it.name)}</b>! ${S.it.clues.map(esc).join(' ')}`, 'ok');
      api.after(2200, next);
    } else {
      S.hearts--; SND.bad(); fxShake(.1); b.disabled = true; b.classList.add('shake');
      if (S.hearts <= 0){ S.lock = true; api.say(`💔 하트를 모두 잃었어요. 정답은 ${esc(S.it.name)}였어요.`, 'bad'); return api.after(1600, () => api.end(S.ok >= 3 ? 1 : 0, `${R}번 중 ${S.ok}번 맞혔어요. 점수 ${S.pts}점.`)); }
      if (S.shown < 3){ S.shown++; S.ct = 0; draw(); }
    }
  };
  const next = () => { S.r++; if (S.r >= R) api.end(S.pts >= 120 ? 3 : S.pts >= 80 ? 2 : S.ok >= 2 ? 1 : 0, `${R}번 중 <b>${S.ok}번</b> 맞혔어요. 점수 ${S.pts}점 · 남은 하트 ${S.hearts}개.`); else round(); };
  api.loop(dt => { if (S.lock || MG.ended) return; S.ct += dt; if (S.ct > 4 && S.shown < 3){ S.shown++; S.ct = 0; SFX.tick(); draw(); } api.stat(`🔎 ${S.r + 1}/${R} · ⭐ ${S.pts} · ${'❤️'.repeat(S.hearts)}${'🤍'.repeat(3 - S.hearts)}`); });
  round();
}
mgReg({id:'shop', order:9, icon:'🧲', title:'전자석 제품 상점', stat:'em', free:true, book:'생활 속 전자석을 사용하는 예 (자유 탐험 · 상점 주인과 게임)',
  stages:[
    {name:'전자석 제품 많이 사기', goal:`예산 ${won(SHOP_BUDGET)}원으로 전자석이 들어간 제품을 가장 많이 사요. 영구 자석과 전자석이 없는 물건은 피해요.`, how:'물건을 눌러 담기 · 계산하기 (75초)'},
    {name:'값 어림하기', goal:'전자석 제품 세 개를 모두 사면 대략 얼마인지 어림해서 맞혀요. 5번!', how:'보기 중 고르기 (한 번에 15초)'},
    {name:'특징 보고 제품 맞히기', goal:'전자석을 어떻게 쓰는지 단서를 보고 어떤 제품인지 맞혀요. 단서가 적을 때 맞히면 점수가 커요.', how:'제품 카드 고르기 · 하트 3개'}],
  learn:['전자석이 든 제품은 전기를 켜고 끄거나, 세기와 극의 방향을 바꿀 수 있어요. 나침반·냉장고 자석 같은 영구 자석은 늘 자석이에요.',
    '값을 만 원 단위로 반올림해 더하면 대략의 합계를 빨리 알 수 있어요. 장 볼 때 예산을 넘지 않게 어림하는 데 써요.',
    '선풍기·헤어드라이어·드론은 전동기의 세기를, 세탁기·로봇 청소기는 극의 방향을, 초인종·기중기는 켜고 끄기를 주로 이용해요.'],
  start(st, api){ [shopBuy, shopGuess, shopClue][st](api); }});
/* 액자 이름표: 다가가면 'E · 🖼️ 제목'이 뜨게 */
(function placeNames(){ for (const z of COURSE.places || []) for (const r of z.rooms) for (const t of Object.values(r.things || {})) if (t.kind === 'frame' && MUSEUM[t.key]) t.name = '🖼️ ' + MUSEUM[t.key].title.replace(/[“”]/g, ''); })();
