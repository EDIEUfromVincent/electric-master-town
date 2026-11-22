/* =========================================================
   📋 정리 회의 · 📮 선생님 편지 · 📜 시청 기록실(배움 기록 문서)
   · 정리 교실(course.js의 wrap 방): 그 차시 퀘스트를 맡은 인물들이 큰 칠판 앞에 모여 S-E-R 정리 회의를 연다.
     학급 서버(server.js)로 열면 서버의 규칙 엔진(lad/)이 판정한다. 정답 낱말은 서버에만 있고, 대화 한 줄 한 줄이
     구글 시트(LAD)로 간다. 파일로 열면(서버 없음) 같은 질문을 이 기기 안에서만 묻고 기록한다.
   · 우체부: 선생님이 시트에서 '승인'한 편지를 다음 차시 구역에 들어올 때 전해 준다. 답장도 시트로 간다.
   · 시청 기록실: 점등식이 끝나면 시장님과 볼트 박사가 세 차시 문장과 편지를 모아 문서로 만들어 준다 → 게임 끝.
   · 화면에 넣는 NPC·학생 글은 모두 textContent 또는 esc()를 거친다.
   ========================================================= */
const LAD = {st:null, sid:'', queue:[], qKey:'', flushing:false, entered:{}, letterChecked:false, letterBusy:false, timer:null, mail:null};
const WRAP = {z:null, lesson:null, did:null, msgs:[], mi:0, view:null, board:[], log:[], summary:null, busy:false, speak:null, off:null, phase:'', blankOk:null, prevBlank:{}, locked:false, typer:null};
const WRAPB = {cv:null, tex:null, key:'', quad:null};
const FIN = {shown:-1};
const NPC_EXTRA = {mayor:{name:'시장님', look:'mayor'}, evdriver:{name:'전기차 운전자', look:'driver'}};
const STAGE_TXT = {S:'S · 개념 떠올리기', E:'E · 생활·안전과 잇기', R:'R · 한 문장 정리'};
const CP_MARK = {self:'✔ 스스로', hint:'💡 힌트 보고', support:'🤝 함께 다시', write:'✏️ 내 말로', skip:'—'};
const RES_MARK = {correct:'✔', partial:'◐', miss:'💡', avoid:'💡', misconception:'💡', write:'✏️'};

function npcDef(id){
  const n = NPCS.find(q => q.id === id);
  if (n) return {id, name:n.name, look:n.look};
  if (NPC_EXTRA[id]) return {id, ...NPC_EXTRA[id]};
  return {id, name:ACT_WHO[id] || id, look:'guide'};
}
function ladUUID(){
  try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
  const h = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  return `${h()}${h()}-${h()}-4${h().slice(1)}-${h()}-${h()}${h()}${h()}`;
}
/* 이 기기에만 남기는 글도 형식이 뚜렷한 개인정보는 가린다 */
function ladMask(t){
  return String(t || '').normalize('NFC').replace(/[\u0000-\u001F\u007F​-‏‪-‮⁠-⁤﻿]/g, '').replace(/\s+/g, ' ').trim().slice(0, 200)
    .replace(/\d{6}\s*-\s*[1-4]\d{6}/g, '[주민번호]').replace(/01[016789][\s.\-]?\d{3,4}[\s.\-]?\d{4}/g, '[전화번호]')
    .replace(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g, '[이메일]').replace(/[가-힣]{2,10}초등학교/g, '[학교]')
    .replace(/((?:내|제|우리\s*[가-힣]{1,4})\s*이름은)\s*[가-힣]{2,4}/g, '$1 [이름]');
}

/* ===== 저장 ===== */
function wrapSave(){ if (!SAVE.reflect || typeof SAVE.reflect !== 'object') SAVE.reflect = {}; return SAVE.reflect; }
function letterSave(){ if (!SAVE.letters || typeof SAVE.letters !== 'object') SAVE.letters = {}; return SAVE.letters; }

/* ===== 정리 회의가 필요한가 · 끝났나 ===== */
const wrapRoomOf = z => (z && z.rooms ? z.rooms.find(r => r.wrap) : null);
const wrapLessonOf = z => { const r = wrapRoomOf(z); return r ? r.wrap : null; };
const wrapDoneL = id => !!(id && wrapSave()[id] && wrapSave()[id].done);
const wrapOff = () => !!(LAD.st && LAD.st.reflect === false);   /* 학급 서버 NPC_REFLECTION_ENABLED=false → 정리 회의 없이 예전처럼 */
function wrapOk(z){ const id = wrapLessonOf(z); return !id || wrapOff() || wrapDoneL(id); }
function wrapReady(z){ return !!z && !z.free && zoneActs(z).every(actDone) && zoneNeedsOk(z); }
const wrapsAllDone = () => COURSE.zones.every(wrapOk);
/* 지금 정리 회의로 안내할 구역: 방 안이면 그 구역, 마을이면 붙잡고 있던 구역, 활동을 다 했으면 남은 구역 */
function wrapFocus(){
  if (!SAVE.met || !SAVE.met.volt || !WORLD) return null;
  const want = z => z && !z.free && wrapReady(z) && !wrapOk(z);
  if (inRoom()) return want(ZONE.zone) ? ZONE.zone : null;
  if (WORLD.kind !== 'story') return null;
  const f = zoneFocus(); if (want(f)) return f;
  return actAllDone() ? COURSE.zones.find(want) || null : null;
}
const hallPending = () => !!(SAVE.story && SAVE.story.finale && !SAVE.story.docMade && COURSE.finale);
function wrapLeft(z){
  return zoneActs(z).filter(a => !actDone(a)).map(a => `「${a.title}」`).concat((z.need || []).filter(k => !ZONE_NEEDS[k].ok()).map(k => ZONE_NEEDS[k].label));
}
/* 길 안내 (가리켰으면 true) */
function wrapRoute(){
  if (!WORLD || ZONE.borrow) return false;
  if (hallPending()){
    if (inRoom() && ZONE.room && ZONE.room.finale){ const b = WORLD.objects.find(o => o.kind === 'wrapBoard'); if (b) UI.waypoint = {x:b.x, y:b.y + 1, label:'📜 배움 기록 칠판', wrap:true}; return true; }
    if (WORLD.kind === 'story'){ const g = COURSE.finale.gate; UI.waypoint = {x:g.x, y:g.y + 1, label:'📜 시청 기록실', wrap:true}; return true; }
  }
  const z = wrapFocus(); if (!z) return false;
  const wi = z.rooms.findIndex(r => r.wrap);
  if (inRoom()){
    if (ZONE.idx === wi){ const b = WORLD.objects.find(o => o.kind === 'wrapBoard'); if (b) UI.waypoint = {x:b.x, y:b.y + 1, label:'📋 정리 칠판', wrap:true}; return true; }
    const ok = zonePointPortal(wi > ZONE.idx ? 1 : -1); if (ok && UI.waypoint) UI.waypoint.wrap = true; return ok;
  }
  UI.waypoint = {x:z.gate.x, y:z.gate.y + 1, label:`🚪 ${z.no}차시 구역 문 (정리 회의)`, wrap:true};
  return true;
}
function wrapObjective(){
  if (hallPending()){
    if (inRoom() && ZONE.room && ZONE.room.finale) return '<b>📜 마지막</b> 시장님이나 큰 칠판 앞에서 <kbd>E</kbd> — 세 차시 정리를 모아 배움 기록 문서를 받아요';
    if (!inRoom()) return '<b>📜 마지막</b> 시청 앞 「시청 기록실」 문으로 들어가 시장님과 볼트 박사를 만나요';
  }
  const z = wrapFocus(); if (!z) return null;
  const r = wrapRoomOf(z), wi = z.rooms.indexOf(r);
  if (inRoom()){
    if (ZONE.idx === wi) return `<b>${z.no}차시 정리 회의</b> 📋 칠판 앞에서 <kbd>E</kbd> — 친구들과 오늘 배운 것을 네 말로 정리해요`;
    return `<b>${z.no}차시 ✅ 퀘스트 완료</b> ${wi > ZONE.idx ? '오른쪽' : '왼쪽'} 포털을 지나 ${ROOM_NO[wi]} 「${esc(r.name)}」${euro(r.name)} 가요`;
  }
  return `<b>${z.no}차시 정리 회의</b> 광장의 ${z.no}번 문으로 들어가 「${esc(r.name)}」에서 칠판 정리를 해요`;
}
function wrapNextText(z){
  const r = wrapRoomOf(z), wi = z.rooms.indexOf(r), here = inRoom() && ZONE.zone === z;
  return `👉 ${z.no}차시 퀘스트를 모두 마쳤어요! ${here ? (wi > ZONE.idx ? '오른쪽' : '왼쪽') + ' 포털을 지나 ' : `광장의 ${z.no}번 문으로 들어가 `}「${r.name}」에서 친구들과 큰 칠판 앞에 모여 오늘 배운 것을 정리해요.`;
}
/* 회의를 여는 사람이 폴짝폴짝 (act.js의 actGiverHere가 부른다) */
function wrapHop(o){
  const r = ZONE.room; if (!r || UI.wrap) return false;
  if (r.finale) return o.id === r.npcs[0] && !!(SAVE.story && SAVE.story.finale) && !SAVE.story.docMade;
  return o.id === r.npcs[0] && wrapReady(ZONE.zone) && !wrapOk(ZONE.zone);
}
function wrapBoardDone(o){
  if (o.final) return !!(SAVE.story && SAVE.story.docMade);
  const z = ZONE.zone; return !z || UI.wrap || !wrapReady(z) || wrapOk(z);
}
function wrapRoomEnter(z, i){
  const r = z.rooms[i]; if (!r) return;
  if (r.finale){ setTimeout(() => { if (inRoom() && ZONE.room === r && MODE === 'play' && !uiBlocking() && SAVE.story.finale && !SAVE.story.docMade) finaleCeremony(); }, 900); return; }
  if (r.wrap && wrapReady(z) && !wrapOk(z)) setTimeout(() => toast('📋 큰 칠판 앞에서 E를 누르면 정리 회의가 시작돼요!', 'ok'), 3400);
}

/* ===== 말 걸기 ===== */
function wrapNpcTalk(o){
  SAVE.met[o.id] = true;
  if (ZONE.room.finale) return finaleTalk(o);
  const z = ZONE.zone, r = ZONE.room, lead = npcDef(r.npcs[0]);
  const after = () => { const f = UI.wrapAfter; UI.wrapAfter = null; if (f) f(); else { actWaypoint(); updateHUD(); } };
  if (wrapOff()) return showDialog(o.name, ['오늘은 정리 회의를 쉬어요. 선생님 안내를 따라요!']);
  if (wrapOk(z)){
    const rec = wrapSave()[r.wrap] || {};
    return showDialog(o.name, [{who:o.name, text:rec.sentence ? `오늘 네가 칠판에 남긴 문장은 「${rec.sentence}」이었어요. 멋졌어요!` : '정리 회의를 마쳤어요. 수고했어요!',
      choices:[{label:'📋 칠판 정리 크게 보기', fn:() => { UI.wrapAfter = () => wrapSummaryPanel(r.wrap); }}, {label:'🔁 정리 회의 다시 하기', fn:() => { UI.wrapAfter = () => wrapStart(z, true); }}, {label:'괜찮아요'}]}], after);
  }
  if (!wrapReady(z)) return showDialog(o.name, [`아직 이 차시에 남은 퀘스트가 있어요: ${wrapLeft(z).join(', ')}.`, '퀘스트를 모두 마치고 오면 이 칠판 앞에서 함께 오늘 배운 것을 정리해요!'], after);
  showDialog(o.name, [{who:o.name, text:o.id === lead.id ? `모두 모였어요! ${z.no}차시 정리 회의를 열어 볼게요.` : `${lead.name}이(가) 회의를 열어 줄 거예요. 모두 칠판 앞에 모였어요!`,
    choices:[{label:'📋 정리 회의 시작하기', fn:() => { UI.wrapAfter = () => wrapStart(z); }}, {label:'조금 있다가요'}]}], after);
}
function wrapBoardTalk(o){
  if (o.final) return finaleTalk(npcDef(ZONE.room.npcs[0]));
  const r = ZONE.room, n = npcDef(r.npcs[0]);
  wrapNpcTalk({id:n.id, name:n.name});
}

/* ===== 정리 회의 진행 ===== */
async function wrapStart(z, redo){
  const lesson = wrapLessonOf(z); if (!lesson || UI.wrap) return;
  if (ACC.server){
    if (!ACC.token) return toast('다시 로그인해 주세요. (처음 화면 → 학생 바꾸기)', 'bad');
    if (!LAD.st) await ladStatus();
    if (!LAD.st) return showDialog('정리 회의', ['학급 서버와 연결이 잠시 끊겼어요. 조금 뒤에 칠판 앞에서 다시 E를 눌러요.']);
    if (LAD.st.reflect === false) return showDialog('정리 회의', ['오늘은 정리 회의를 쉬어요.']);
    if (!LAD.st.cls) return ladAskClass(() => wrapStart(z, redo));
  }
  wrapOpen(z, lesson);
  if (!ACC.server) return wrapOfflineStart();
  try {
    const run = !redo && SAVE.wrapRun && SAVE.wrapRun.lesson === lesson ? SAVE.wrapRun.did : null;
    const r = await api('api/reflect/start', {token:ACC.token, sessionId:LAD.sid, lessonId:lesson, resume:run});
    if (r.locked){ wrapClose(); return showDialog('정리 회의', [`정리 회의가 잠시 멈춰 있어요. ${Math.max(1, Math.ceil(r.waitSec / 60))}분 뒤에 다시 해요.`, '걱정되는 일이 있으면 선생님께 꼭 말씀드려요.']); }
    WRAP.did = r.dialogueId; SAVE.wrapRun = {lesson, did:r.dialogueId}; persist();
    if (r.resumed && Array.isArray(r.board)) WRAP.board = r.board;
    ladFlush();
    wrapPlay(r.messages || [], r.view);
  } catch (e){
    wrapClose();
    if (e.status === 401){ ACC.token = null; return toast('다시 로그인해 주세요.', 'bad'); }
    showDialog('정리 회의', [e.status === 429 ? '너무 빨리 여러 번 눌렀어요. 잠시 뒤에 다시 해요.' : '학급 서버와 연결이 잠시 끊겼어요. 조금 뒤에 칠판 앞에서 다시 E를 눌러요.']);
  }
}
function wrapOpen(z, lesson){
  Object.assign(WRAP, {z, lesson, did:null, msgs:[], mi:0, view:null, board:[], log:[], summary:null, busy:true, speak:null, off:null, phase:'load', blankOk:null, prevBlank:{}, locked:false});
  UI.wrap = true; KEYS.clear(); JOY.x = JOY.y = 0; PATH3.nodes = null; NEAR = null;
  const b = WORLD.objects.find(o => o.kind === 'wrapBoard');
  wrapStandAside(b); showHUD(false);
  $('#wrapUI').hidden = false; $('#wrapUI').style.setProperty('--zc', z.color);
  $('#wuZone').textContent = `${z.icon} ${z.no}차시 정리 회의`;
  wrapLine('', '🪑 모두 칠판 앞에 모이는 중…'); wrapInput(null);
  SFX.ping();
}
/* 회의 동안 주인공은 칠판 왼쪽 옆에 선다 (카메라 앞을 가리지 않게) */
function wrapStandAside(b){
  if (!b) return;
  placePlayer(b.x + .5 - 3.9, b.y + 1.9); player.ang = Math.atan2(3.9, -1.4); player.moving = false;
  ZONE.focus = wrapCamFocus(b);
}
/* 칠판이 화면 위쪽에 꽉 차게 (아래쪽은 대화판이 가린다) */
function wrapCamFocus(b){
  const a = (G3.W || CW) / Math.max(1, G3.H || CH), dist = clamp(4.2 / Math.min(1.25, a) + 2.2, 5.6, 9.5);
  return {x:b.x + .5, z:b.y + .45, ty:1.05, dist, pitch:.1};
}
function wrapPlay(msgs, view){
  WRAP.busy = false;
  const q = (msgs || []).slice();
  if (view && view.prompt && q.length && q[q.length - 1].text === view.prompt) q.pop();   /* 같은 질문을 두 번 보이지 않게 */
  WRAP.msgs = q; WRAP.mi = 0; WRAP.view = view;
  wrapStep();
}
function wrapStep(){
  if (WRAP.mi < WRAP.msgs.length){
    const m = WRAP.msgs[WRAP.mi]; WRAP.phase = 'msg'; WRAP.speak = m.npc;
    wrapLine(m.who, m.text); wrapInput('next'); SND.tick(); return;
  }
  const v = WRAP.view;
  if (!v){ if (WRAP.locked){ WRAP.phase = 'locked'; wrapInput('locked'); } return; }
  if (v.type === 'end') return wrapFinish();
  WRAP.phase = 'ask'; WRAP.speak = v.npc;
  wrapLine(v.who, v.prompt); wrapInput(v);
}
function wrapKey(e){
  if (!UI.wrap || WRAP.busy) return;
  const code = e && e.code || 'Enter';
  if (WRAP.typer){ wrapTypeEnd(); return; }
  if (WRAP.phase === 'msg'){ WRAP.mi++; wrapStep(); return; }
  if (WRAP.phase === 'ask' && WRAP.view && WRAP.view.type === 'choice' && /^(Digit|Numpad)[1-4]$/.test(code)){ const k = +code.slice(-1) - 1, o = WRAP.view.options[k]; if (o) wrapSubmit({optionIndex:o.index}, o.text); return; }
  if (WRAP.phase === 'ask'){ const i = $('#wrapUI input'); if (i) i.focus(); return; }
  if (WRAP.phase === 'done' || WRAP.phase === 'locked') wrapClose(true);
}
async function wrapSubmit(input, shown){
  if (WRAP.busy || !UI.wrap) return;
  const v = WRAP.view; WRAP.busy = true; wrapInput('wait');
  if (WRAP.off) return wrapOfflineTurn(shown);
  try {
    const r = await api('api/reflect/turn', {token:ACC.token, sessionId:LAD.sid, dialogueId:WRAP.did, input});
    if (!UI.wrap) return;
    if (r.last){
      WRAP.log.push({who:v.who, q:v.prompt, a:r.last.text, stage:v.stage, result:r.last.result, label:r.last.label, hint:r.last.hintLevel});
      wrapBoardSet(r.last);
    }
    WRAP.blankOk = r.blankOk || null;
    if (r.locked){ WRAP.locked = r.locked; SAVE.wrapRun = null; persist(); }
    if (r.done) WRAP.summary = r.summary;
    wrapPlay(r.messages, r.view);
  } catch (e){
    WRAP.busy = false;
    if (!UI.wrap) return;
    if (e.status === 410 || (e.status === 400 && /done|locked/.test(e.message))){   /* 서버가 다시 켜져 대화가 사라졌으면 처음부터 */
      SAVE.wrapRun = null; persist(); const z = WRAP.z;
      wrapLine('', '학급 서버가 새로 켜져서 정리 회의를 처음부터 다시 열게요.'); wrapInput(null);
      setTimeout(() => { wrapClose(); wrapStart(z, true); }, 1500);
      return;
    }
    toast(e.status === 429 ? '천천히 생각하고 답해요.' : '연결이 잠시 끊겼어요. 한 번 더 눌러 볼래요?', 'bad');
    wrapInput(v);
  }
}
function wrapBoardSet(last){
  const i = WRAP.board.findIndex(b => b.cp === last.cp);
  if (i >= 0) WRAP.board[i] = last; else WRAP.board.push(last);
}
function wrapFinish(){
  const sm = WRAP.summary || {}, L = WRAP.lesson, z = WRAP.z;
  const rec = {done:true, at:Date.now(), lesson:L, zone:z.id, sentence:sm.sentence || '', stage:sm.stage || '', praise:sm.praise || '', question:sm.question || '',
    checkpoints:sm.checkpoints || [], log:WRAP.log, sent:!!sm.sent, offline:!!WRAP.off, minutes:sm.minutes || 0};
  wrapSave()[L] = rec; SAVE.wrapRun = null; persist(); ladFlush();
  WRAP.phase = 'filing'; WRAP.speak = null;
  wrapLine('📋 칠판', '🗂️ 오늘의 정리를 칠판에 모으는 중…'); wrapInput(null); SFX.tone(660, .2, 'triangle', .04, 990);
  setTimeout(() => {
    if (!UI.wrap) return;
    const where = rec.offline ? '💾 이 기기에 저장했어요. (학급 서버로 열면 선생님께도 전해져요)'
      : rec.sent ? '✅ 선생님의 기록장(구글 시트)으로 보냈어요. 선생님이 읽고 다음 시간에 편지를 보내 주실 거예요.'
      : '📦 학급 서버에 모아 두었어요. 선생님이 구글 시트를 연결하면 그대로 보내져요.';
    WRAP.phase = 'done'; wrapLine('📋 칠판 정리 끝!', where); wrapInput('done');
    SND.fanfare(); award(z.no === 1 ? 'em' : z.no === 2 ? 'ai' : 'safe', 6); award('ai', 4);
  }, 1500);
}
function wrapClose(done){
  if (WRAP.typer){ clearInterval(WRAP.typer.t); WRAP.typer = null; }
  UI.wrap = false; $('#wrapUI').hidden = true; ZONE.focus = null; WRAP.speak = null;
  if (MODE === 'play') showHUD(true);
  if (done && WRAP.phase === 'done') toast(`📋 ${WRAP.z.no}차시 정리 회의 완료!`, 'ok');
  WRAP.phase = '';
  zoneBar(); updateHUD(); actWaypoint();
  runPending();
}
function wrapPause(){
  if (!UI.wrap) return;
  if (WRAP.phase === 'done' || WRAP.phase === 'locked') return wrapClose(true);
  if (WRAP.phase === 'filing') return;
  wrapClose();
  toast(WRAP.off ? '정리 회의를 멈췄어요. 칠판 앞에서 E를 누르면 처음부터 다시 해요.' : '정리 회의를 잠시 멈췄어요. 칠판 앞에서 E를 누르면 이어서 해요.');
}

/* ----- 대화판 그리기 ----- */
function wrapLine(who, text){
  const v = WRAP.view, st = WRAP.phase === 'ask' && v ? v.stage : (WRAP.msgs[WRAP.mi] && v ? v.stage : '');
  $('#wuStage').textContent = STAGE_TXT[st] || '정리 회의'; $('#wuStage').dataset.s = st || '';
  $('#wuWho').textContent = who || '';
  if (WRAP.typer){ clearInterval(WRAP.typer.t); WRAP.typer = null; }
  const line = $('#wuLine'); let n = 0; line.textContent = '';
  const s = String(text || '');
  WRAP.typer = {s, t:setInterval(() => { n += 2; line.textContent = s.slice(0, n); if (n >= s.length) wrapTypeEnd(); }, 22)};
}
function wrapTypeEnd(){ if (!WRAP.typer) return; clearInterval(WRAP.typer.t); $('#wuLine').textContent = WRAP.typer.s; WRAP.typer = null; }
function wrapInput(kind){
  const box = $('#wuInput'); box.innerHTML = ''; box.className = 'wu-input';
  const btn = (label, cls, fn) => { const b = document.createElement('button'); b.className = 'btn ' + (cls || ''); b.textContent = label; b.onclick = e => { e.stopPropagation(); fn(); }; box.appendChild(b); return b; };
  if (!kind) return;
  if (kind === 'wait'){ const s = document.createElement('span'); s.className = 'wu-wait'; s.textContent = '🤔 생각을 칠판에 적는 중…'; box.appendChild(s); return; }
  if (kind === 'next'){ btn('다음 ▶', 'primary', () => wrapKey({code:'Enter'})); return; }
  if (kind === 'done'){ btn('📋 칠판 정리 크게 보기', '', () => wrapSummaryPanel(WRAP.lesson)); btn('계속하기 ▶', 'primary', () => wrapClose(true)); return; }
  if (kind === 'locked'){ btn('알겠어요', 'primary', () => wrapClose(true)); return; }
  const v = kind;
  if (v.type === 'free'){
    box.classList.add('free');
    const inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = v.maxLength || 200; inp.autocomplete = 'off';
    inp.placeholder = '내 말로 적어요 · 이름이나 전화번호는 쓰지 않아요'; inp.setAttribute('aria-label', '내 대답');
    const cnt = document.createElement('small'); cnt.className = 'wu-cnt'; cnt.textContent = `0/${inp.maxLength}`;
    inp.oninput = () => { cnt.textContent = `${inp.value.length}/${inp.maxLength}`; };
    const go = () => { const t = inp.value.trim(); if (!t){ inp.focus(); return toast('한 낱말이라도 좋아요. 적어 볼래요?'); } wrapSubmit({text:t}, t); };
    inp.onkeydown = e => { if (e.isComposing || e.keyCode === 229) return; if (e.key === 'Enter'){ e.preventDefault(); go(); } if (e.key === 'Escape'){ e.preventDefault(); wrapPause(); } };
    box.appendChild(inp); box.appendChild(cnt); btn('말하기 ✓', 'primary', go);
    setTimeout(() => { if (UI.wrap && !IS_TOUCH) inp.focus(); }, 60);
    return;
  }
  if (v.type === 'choice'){
    box.classList.add('choice');
    v.options.forEach((o, k) => btn(`${k + 1}. ${o.text}`, '', () => wrapSubmit({optionIndex:o.index}, o.text)));
    return;
  }
  if (v.type === 'blank'){
    box.classList.add('blank');
    const p = document.createElement('div'); p.className = 'wu-tpl';
    const parts = String(v.template).split(/\[([^\]]+)\]/), inputs = {};
    parts.forEach((s, k) => {
      if (k % 2 === 0){ if (s) p.appendChild(document.createTextNode(s)); return; }
      const i = document.createElement('input'); i.type = 'text'; i.maxLength = 20; i.size = 6; i.autocomplete = 'off'; i.placeholder = s; i.dataset.id = s; i.setAttribute('aria-label', '빈칸 ' + s);
      if (WRAP.blankOk && WRAP.blankOk[s] && WRAP.prevBlank[s]){ i.value = WRAP.prevBlank[s]; i.classList.add('ok'); }
      else if (WRAP.blankOk && WRAP.blankOk[s] === false) i.classList.add('retry');
      i.onkeydown = e => { if (e.isComposing || e.keyCode === 229) return; if (e.key === 'Enter'){ e.preventDefault(); go(); } };
      inputs[s] = i; p.appendChild(i);
    });
    const go = () => {
      const blanks = {}; for (const [id, i] of Object.entries(inputs)) blanks[id] = i.value.trim();
      if (!Object.values(blanks).some(Boolean)) return toast('빈칸에 들어갈 낱말을 적어 볼래요?');
      WRAP.prevBlank = blanks;
      const shown = parts.map((s, k) => k % 2 ? (blanks[s] || '___') : s).join('');
      wrapSubmit({blanks}, shown);
    };
    box.appendChild(p); btn('완성 ✓', 'primary', go);
    setTimeout(() => { const f = Object.values(inputs).find(i => !i.value); if (f && UI.wrap && !IS_TOUCH) f.focus(); }, 60);
  }
}

/* ----- 학급 서버 없이(파일로 열었을 때): 같은 질문을 이 기기 안에서만 ----- */
const WRAP_OFFLINE = {
  L1:{lead:'volt', npcs:{volt:'볼트 박사', sun:'해님'}, next:'오늘 배운 세 성질 가운데 크레인이 고철을 내려놓을 때 쓰는 성질은 무엇일까요?',
    qs:[{who:'volt', stage:'S', label:'전기가 흐를 때만 자석', q:'실험실에서 스위치를 켰을 때와 껐을 때, 클립은 각각 어떻게 됐나요?'},
      {who:'sun', stage:'E', label:'생활 속 전자석', q:'우리 집 거실에서 찾은 전자석 물건 하나와, 그 물건이 쓰는 전자석의 성질을 말해 줄래?'},
      {who:'volt', stage:'E', label:'전자석의 세기', q:'전자석을 더 세게 만들려면 어떻게 하면 될까요?'},
      {who:'volt', stage:'R', label:'오늘의 한 문장', q:'오늘 알게 된 전자석의 성질 두 가지 이상을 넣어 한 문장으로 말해 줄래요?'}],
    end:"멋져요! 네가 정리한 문장 '{{reflection}}'을 칠판에 남길게요."},
  L2:{lead:'boss', npcs:{boss:'무쇠 사장님', auto:'자동이'}, next:'AI 안전 로봇은 크레인 두뇌처럼 규칙을 짜서 가르칠 수 있을까요, 예시로 가르쳐야 할까요?',
    qs:[{who:'boss', stage:'S', label:'철을 고르는 기준', q:'크레인으로 철만 골라 옮길 때, 고철의 무엇을 보고 판단해야 했지?'},
      {who:'auto', stage:'E', label:'좋은 첫 질문과 까닭', q:'질문 길을 고칠 때 어떤 질문을 먼저 해야 하는지, 그 까닭과 함께 말해 줘.'},
      {who:'auto', stage:'E', label:'AI가 틀렸을 때', q:'고친 두뇌도 처음 보는 고철을 틀릴 수 있다. 그럴 때 사람은 무엇을 해야 할까?'},
      {who:'boss', stage:'R', label:'오늘의 한 문장', q:"'좋은 질문'과 'AI가 틀렸을 때 할 일'을 넣어 한 문장으로 말해 볼래?"}],
    end:"고맙다! 네가 정리한 문장 '{{reflection}}'을 칠판에 남길게."},
  L3:{lead:'guard', npcs:{guard:'안전이', volt:'볼트 박사', moon:'달님'}, next:'오늘 정한 실천을 가족에게 소개한다면 어떻게 설명할지 생각해 볼래요?',
    qs:[{who:'guard', stage:'S', label:'위험한 장면과 까닭', q:'우리 집에서 위험하다고 판단한 장면 하나를 골라, 왜 위험한지 말해 줄래요?'},
      {who:'guard', stage:'E', label:'전기를 아끼는 방법', q:'낭비라고 판단한 장면은 어떻게 바꾸면 전기를 아낄 수 있을까요?'},
      {who:'volt', stage:'E', label:'사람이 확인해야 하는 까닭', q:"로봇이 위험한 장면을 '바른 사용'이라고 판단하면 어떤 일이 생길까요? 누가 마지막에 확인해야 할까요?"},
      {who:'moon', stage:'R', label:'이번 주 실천할 일', q:'이번 주에 내가 실천할 일 한 가지와 그 까닭을 한 문장으로 말해 줄래?'}],
    end:"고마워요! 네가 정리한 문장 '{{reflection}}'을 칠판에 남길게요."},
};
function wrapOfflineView(){
  const D = WRAP_OFFLINE[WRAP.lesson], q = D && D.qs[WRAP.off.i];
  return q ? {type:'free', prompt:q.q, npc:q.who, who:D.npcs[q.who], stage:q.stage, cp:'q' + WRAP.off.i, maxLength:200} : {type:'end'};
}
function wrapOfflineStart(){
  const D = WRAP_OFFLINE[WRAP.lesson]; if (!D){ wrapClose(); return; }
  WRAP.off = {i:0, answers:[]};
  wrapPlay([{npc:D.lead, who:D.npcs[D.lead], text:`${WRAP.z.no}차시 정리 회의예요! 이 기기는 학급 서버에 연결되지 않아서, 오늘 정리는 이 기기에만 남고 선생님께는 전해지지 않아요.`}], wrapOfflineView());
}
function wrapOfflineTurn(text){
  const D = WRAP_OFFLINE[WRAP.lesson], q = D.qs[WRAP.off.i], t = ladMask(text);
  if (t.length < 2){ WRAP.busy = false; toast('조금 더 적어 볼래요?'); wrapInput(WRAP.view); return; }
  WRAP.log.push({who:D.npcs[q.who], q:q.q, a:t, stage:q.stage, result:'write', label:q.label});
  wrapBoardSet({cp:'q' + WRAP.off.i, label:q.label, stage:q.stage, result:'write', text:t});
  WRAP.off.answers.push(t); WRAP.off.i++;
  const next = wrapOfflineView();
  if (next.type === 'end'){
    const sentence = t;
    WRAP.summary = {sentence, stage:'R', praise:'질문마다 네 말로 끝까지 정리했어요.', question:D.next, sent:false,
      checkpoints:D.qs.map((x, i) => ({key:'q' + i, label:x.label, stage:x.stage, status:'write', text:WRAP.off.answers[i] || ''}))};
    wrapPlay([{npc:D.lead, who:D.npcs[D.lead], text:D.end.replace('{{reflection}}', sentence)}], {type:'end'});
    return;
  }
  wrapPlay([{npc:q.who, who:D.npcs[q.who], text:'좋아요, 칠판에 적었어요!'}], next);
}

/* ----- 칠판 정리 크게 보기 ----- */
function wrapSummaryPanel(lesson){
  const rec = wrapSave()[lesson] || {}, z = COURSE.zones.find(q => wrapLessonOf(q) === lesson);
  const p = openPanel(`<div class="chalk"><div class="ch-title">${z ? `${z.icon} ${z.no}차시 정리 회의 · ${esc(z.name)}` : '정리 회의'}</div>
    <div class="ch-one"><small>오늘의 한 문장</small><p></p></div>
    <div class="ch-two"><div><small>⭐ 잘한 점</small><p class="ch-praise"></p></div><div><small>❓ 다음에 생각해 볼 질문</small><p class="ch-q"></p></div></div>
    <div class="ch-cps">${(rec.checkpoints || []).map(c => `<span class="ch-cp ${esc(c.status)}">${esc(c.label)} <b>${esc(CP_MARK[c.status] || '')}</b></span>`).join('')}</div>
    ${(rec.log || []).length ? `<details class="ch-log"><summary>정리 회의에서 주고받은 말 (${rec.log.length})</summary><ol>${rec.log.map(l => `<li><span class="ch-st">${esc(l.stage)}</span> <b>${esc(l.who)}</b> ${esc(l.q)}<br>✏️ ${esc(l.a)} <i>${esc(RES_MARK[l.result] || '')}</i></li>`).join('')}</ol></details>` : ''}
    <p class="ch-sent">${rec.offline ? '💾 이 기기에만 저장된 정리예요.' : rec.sent ? '✅ 선생님의 기록장(구글 시트)으로 보냈어요.' : rec.fromServer ? '☁️ 학급 서버에 저장된 정리예요.' : '📦 학급 서버에 모아 두었어요.'}</p></div>
    <div class="row"><button class="btn primary" data-close>닫기</button></div>`, {wide:true});
  p.querySelector('.ch-one p').textContent = rec.sentence || '(아직 없음)';
  p.querySelector('.ch-praise').textContent = rec.praise || '—';
  p.querySelector('.ch-q').textContent = rec.question || '—';
}

/* ===== 3D 칠판 ===== */
function mkWrapBoard(final){
  const b = new VB(), B = (x0, y0, z0, x1, y1, z1, c, e) => vbBox(b, x0, y0, z0, x1, y1, z1, c, e == null ? -1 : e);
  const wood = final ? '#b8862b' : '#7a5233';
  B(-3.38, .52, -.5, 3.38, 2.98, -.41, wood);
  B(-3.24, .64, -.41, 3.24, 2.86, -.39, '#24493a');
  B(-3.32, .5, -.41, 3.32, .58, -.24, wood);
  B(-2.6, .58, -.36, -2.36, .63, -.31, '#f4f6f8'); B(-2.2, .58, -.35, -2.02, .63, -.31, '#ffd23f'); B(-1.9, .58, -.35, -1.74, .63, -.31, '#ff8fb0');
  B(1.9, .58, -.38, 2.36, .7, -.27, '#3a4a5a'); B(1.92, .7, -.37, 2.34, .74, -.28, '#c9ced6');
  if (final) for (const sx of [-1, 1]) B(sx * 3.1 - .14, 2.74, -.39, sx * 3.1 + .14, 2.98, -.33, '#ffd23f', 2);
  return b.mesh();
}
function mkBoardQuad(){
  const b = new VB();
  b.quad([[-3.15, .72, -.37], [3.15, .72, -.37], [3.15, 2.78, -.37], [-3.15, 2.78, -.37]], [0, 1, 1, 1, 1, 0, 0, 0], [1, 1, 1], [1, 1, 1, 1], 1, 3, false);
  return b.mesh();
}
function wrapBoardDraw3D(o, t, gy){
  const cx = o.x + .5, cz = o.y + .5, gl = G3.gl;
  drawM(model('wrapBoard' + (o.final ? 1 : 0), () => mkWrapBoard(o.final)), M4.trs(cx, gy, cz));
  if (!WRAPB.quad) WRAPB.quad = mkBoardQuad();
  const tex = wrapBoardTexture(o);
  if (tex){ gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); drawM(WRAPB.quad, M4.trs(cx, gy, cz)); gl.bindTexture(gl.TEXTURE_2D, G3.atlas); }
  return true;
}
function wrapBoardTexture(o){
  const gl = G3.gl; if (!gl) return null;
  if (!WRAPB.cv) WRAPB.cv = mkCanvas(1280, 420);
  if (!WRAPB.tex || WRAPB.gl !== gl){
    WRAPB.tex = gl.createTexture(); WRAPB.gl = gl; WRAPB.key = '';
    gl.bindTexture(gl.TEXTURE_2D, WRAPB.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }
  const m = wrapBoardModel(o), key = JSON.stringify(m);
  if (key !== WRAPB.key){
    WRAPB.key = key; wrapBoardPaint(WRAPB.cv.getContext('2d'), m, WRAPB.cv.width, WRAPB.cv.height);
    gl.bindTexture(gl.TEXTURE_2D, WRAPB.tex); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, WRAPB.cv);
  }
  return WRAPB.tex;
}
/* 칠판에 쓸 것 */
function wrapBoardModel(o){
  if (o.final){
    return {mode:'finale', shown:FIN.shown, rows:COURSE.zones.map(z => { const r = wrapSave()[wrapLessonOf(z)]; return {t:`${z.icon} ${z.no}차시 · ${z.name}`, s:r && r.sentence || ''}; }),
      letters:Object.keys(letterSave()).length, made:!!(SAVE.story && SAVE.story.docMade)};
  }
  const z = ZONE.zone; if (!z) return {mode:'off'};
  const L = wrapLessonOf(z), head = `${z.icon} ${z.no}차시 정리 회의`;
  if (UI.wrap && WRAP.z === z){
    if ((WRAP.phase === 'filing' || WRAP.phase === 'done') && WRAP.summary) return wrapSumModel(head, WRAP.summary, WRAP.phase === 'filing');
    return {mode:'meet', head, board:WRAP.board.map(b => ({st:b.stage, l:b.label, t:b.text, r:b.result}))};
  }
  if (wrapOff()) return {mode:'off', head};
  const rec = wrapSave()[L];
  if (rec && rec.done) return wrapSumModel(head, rec, false);
  const ready = wrapReady(z);
  const items = zoneActs(z).map(a => ({t:`${ACTS.indexOf(a) + 1}. ${a.title}`, ok:actDone(a)})).concat((z.need || []).map(k => ({t:ZONE_NEEDS[k].label.replace(/^🚲\s*/, ''), ok:ZONE_NEEDS[k].ok()})));
  return {mode:ready ? 'ready' : 'todo', head, items};
}
const wrapSumModel = (head, s, filing) => ({mode:'sum', head, filing, one:s.sentence || '', praise:s.praise || '', q:s.question || '',
  cps:(s.checkpoints || []).map(c => ({l:c.label, s:c.status})), sent:s.offline ? 'off' : s.sent ? 'sent' : 'kept'});
function chalkWrap(g, text, maxW, maxLines){
  const out = []; let line = '';
  for (const ch of String(text || '')){
    const t = line + ch;
    if (g.measureText(t).width > maxW && line && !/[.,!?)」』'"…]/.test(ch)){ out.push(line); line = ch.trim() ? ch : ''; if (out.length >= maxLines) break; }   /* 문장부호만 다음 줄로 넘기지 않는다 */
    else line = t;
  }
  if (out.length < maxLines && line) out.push(line);
  if (out.length === maxLines && (out.join('').length < String(text).length)) out[maxLines - 1] = out[maxLines - 1].slice(0, -1) + '…';
  return out;
}
function wrapBoardPaint(g, m, W, H){
  const F = (w, s) => `${w} ${s}px 'Do Hyeon','Jua','Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif`;
  g.fillStyle = '#24493a'; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 260; k++){ g.fillStyle = `rgba(255,255,255,${Math.random() * .035})`; g.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 40, 1 + Math.random() * 3); }
  g.textBaseline = 'top'; g.textAlign = 'left';
  const chalk = '#f4f1e6', yellow = '#ffe27a', pink = '#ffb3c8', blue = '#a8dcff', green = '#b6f0b0';
  const title = (t, c) => { g.font = F('', 42); g.fillStyle = c || chalk; g.fillText(t, 40, 22); g.fillStyle = 'rgba(244,241,230,.5)'; g.fillRect(40, 76, W - 80, 3); };
  const para = (t, x, y, w, size, color, lines) => { g.font = F('', size); g.fillStyle = color; const L = chalkWrap(g, t, w, lines); L.forEach((s, k) => g.fillText(s, x, y + k * size * 1.22)); return y + L.length * size * 1.22; };
  if (m.mode === 'off'){ title(m.head || '정리 회의'); para('오늘은 정리 회의를 쉬어요.', 40, 160, W - 80, 48, yellow, 2); return; }
  if (m.mode === 'todo' || m.mode === 'ready'){
    title(m.head);
    para(m.mode === 'ready' ? '✨ 모두 모였어요! 칠판 앞에서 E를 눌러 정리 회의를 시작해요' : '이 차시 퀘스트를 모두 마치고 이 칠판 앞에 모여요', 40, 96, W - 80, 34, m.mode === 'ready' ? yellow : blue, 1);
    const col = Math.ceil(m.items.length / 2);
    m.items.forEach((it, k) => { const x = 40 + Math.floor(k / col) * (W / 2 - 20), y = 162 + (k % col) * 58; g.font = F('', 32); g.fillStyle = it.ok ? green : chalk; g.fillText(`${it.ok ? '✅' : '⬜'} ${chalkWrap(g, it.t, W / 2 - 110, 1)[0] || ''}`, x, y); });
    return;
  }
  if (m.mode === 'meet'){
    title(m.head + ' — 내 말로 정리하는 중');
    const cols = [['S', '개념 떠올리기', yellow], ['E', '생활·안전과 잇기', blue], ['R', '오늘의 한 문장', pink]], cw = (W - 80) / 3;
    cols.forEach(([st, name, c], k) => {
      const x = 40 + k * cw; g.font = F('', 30); g.fillStyle = c; g.fillText(`${st} · ${name}`, x, 92);
      if (k) { g.fillStyle = 'rgba(244,241,230,.25)'; g.fillRect(x - 12, 96, 2, H - 120); }
      let y = 136;
      for (const b of m.board.filter(q => q.st === st)){
        if (y > H - 60) break;
        g.font = F('', 22); g.fillStyle = c; g.fillText(`${RES_MARK[b.r] || '·'} ${b.l}`, x, y); y += 28;
        y = para(b.t, x, y, cw - 30, 24, chalk, st === 'R' ? 6 : 3) + 12;
      }
      if (!m.board.some(q => q.st === st)){ g.font = F('', 24); g.fillStyle = 'rgba(244,241,230,.35)'; g.fillText('…', x, 140); }
    });
    return;
  }
  if (m.mode === 'sum'){
    title(m.head + (m.filing ? ' — 정리 중…' : ' — 칠판 정리'));
    g.font = F('', 26); g.fillStyle = pink; g.fillText('📌 오늘의 한 문장', 40, 92);
    para(m.one || '—', 40, 128, W * .56 - 60, 34, chalk, 5);
    const x2 = W * .58;
    g.font = F('', 26); g.fillStyle = yellow; g.fillText('⭐ 잘한 점', x2, 92);
    let y = para(m.praise || '—', x2, 126, W - x2 - 40, 25, chalk, 3) + 10;
    g.font = F('', 26); g.fillStyle = blue; g.fillText('❓ 다음에 생각해 볼 질문', x2, y); y += 34;
    para(m.q || '—', x2, y, W - x2 - 40, 25, chalk, 3);
    let cx = 40; g.font = F('', 21);
    for (const c of m.cps){ const t = `${c.l} ${(CP_MARK[c.s] || '').split(' ')[0]}`, w = g.measureText(t).width + 24; if (cx + w > W - 300) break; g.fillStyle = 'rgba(244,241,230,.14)'; g.fillRect(cx, H - 58, w, 36); g.fillStyle = c.s === 'self' ? green : c.s === 'support' ? pink : chalk; g.fillText(t, cx + 12, H - 52); cx += w + 10; }
    g.font = F('', 21); g.fillStyle = m.sent === 'sent' ? green : blue; g.textAlign = 'right';
    g.fillText(m.filing ? '🗂️ 기록 정리 중…' : m.sent === 'sent' ? '✅ 선생님 기록장(구글 시트)으로 보냄' : m.sent === 'off' ? '💾 이 기기에 저장' : '📦 학급 서버에 모아 둠', W - 40, H - 52);
    g.textAlign = 'left';
    return;
  }
  if (m.mode === 'finale'){
    title('📜 전기 마스터 배움 기록', yellow);
    m.rows.forEach((r, k) => {
      const y = 98 + k * 98, show = m.made || m.shown < 0 || k < m.shown;
      g.font = F('', 28); g.fillStyle = [yellow, blue, pink][k % 3]; g.fillText(r.t, 40, y);
      para(show ? (r.s ? `「${r.s}」` : '(정리 문장이 없어요)') : '…', 60, y + 36, W - 120, 26, chalk, 2);
    });
    g.font = F('', 22); g.fillStyle = green; g.textAlign = 'right';
    g.fillText(m.made ? '✅ 배움 기록 문서 완성' : `📮 선생님 편지 ${m.letters}통 · 문서로 묶는 중`, W - 40, H - 40); g.textAlign = 'left';
  }
}

/* ===== 학급 서버: 상태 · 반 번호 · 기록 이벤트 ===== */
function ladInit(){
  LAD.sid = ladUUID(); LAD.st = null; LAD.entered = {}; LAD.letterChecked = false; LAD.letterBusy = false;
  LAD.qKey = 'emt_event_queue_v1:' + (ACC.id || '');
  try { LAD.queue = JSON.parse(lsGet(LAD.qKey) || '[]') || []; } catch (e) { LAD.queue = []; }
  if (!Array.isArray(LAD.queue)) LAD.queue = [];
  if (ACC.server && ACC.token) ladStatus();
  if (!LAD.timer) LAD.timer = setInterval(ladFlush, 15000);
}
async function ladStatus(){
  if (!ACC.server || !ACC.token) return null;
  try {
    const r = await api('api/lad/status', {token:ACC.token, sessionId:LAD.sid});
    LAD.st = r;
    if (r.cls) SAVE.cls = {code:r.cls.code, no:r.cls.no};
    for (const [k, v] of Object.entries(r.reflected || {})) if (!wrapDoneL(k)) wrapSave()[k] = {done:true, at:v.at, lesson:k, sentence:v.sentence || '', log:[], fromServer:true};
    persist(); zoneBar(); updateHUD();
    ladFlush();
    return r;
  } catch (e){ if (e.status === 401) ACC.token = null; return null; }
}
function ladAskClass(then){
  const fx = LAD.st && LAD.st.fixedClass, cur = (LAD.st && LAD.st.cls) || SAVE.cls || {};
  const p = openPanel(`<h2>🏫 반 코드와 번호</h2>
    <p>정리 회의 기록은 <b>이름 대신 반 코드와 번호</b>로 선생님께 전해져요. 선생님이 알려 준 반 코드와 내 번호를 적어요.</p>
    <div class="row cls-row"><label>반 코드<input id="clsCode" maxlength="20" autocomplete="off" placeholder="예: 6301"></label><label>번호<input id="clsNo" type="number" min="1" max="60" inputmode="numeric" placeholder="1~60"></label></div>
    <p id="clsMsg" class="cls-msg"></p>
    <div class="row"><button class="btn primary" id="clsGo">확인</button></div>
    <p class="note">이름·전화번호 같은 개인정보는 어디에도 쓰지 않기로 약속해요.</p>`);
  const ci = p.querySelector('#clsCode'), ni = p.querySelector('#clsNo'), msg = p.querySelector('#clsMsg');
  ci.value = fx || cur.code || ''; if (fx) ci.readOnly = true; if (cur.no) ni.value = cur.no;
  const go = async () => {
    const code = ci.value.replace(/\s/g, ''), no = parseInt(ni.value, 10);
    if (!/^[A-Za-z0-9-]{1,20}$/.test(code)){ msg.textContent = '반 코드는 숫자·영어로 적어요. (예: 6301)'; return ci.focus(); }
    if (!(no >= 1 && no <= 60)){ msg.textContent = '번호는 1~60 사이 숫자예요.'; return ni.focus(); }
    p.querySelector('#clsGo').disabled = true; msg.textContent = '저장하는 중…';
    try {
      const r = await api('api/lad/class', {token:ACC.token, sessionId:LAD.sid, classCode:code, no});
      if (LAD.st) LAD.st.cls = r.cls; SAVE.cls = {code:r.cls.code, no:r.cls.no}; persist();
      closePanel(); toast(`${r.cls.code}반 ${r.cls.no}번으로 기록해요.`, 'ok'); ladFlush();
      if (then) then();
    } catch (e){ p.querySelector('#clsGo').disabled = false; msg.textContent = e.message || '저장하지 못했어요. 다시 해 볼래요?'; }
  };
  p.querySelector('#clsGo').onclick = go;
  [ci, ni].forEach(i => i.onkeydown = e => { if (e.isComposing || e.keyCode === 229) return; if (e.key === 'Enter'){ e.preventDefault(); go(); } });
  setTimeout(() => (ci.value ? ni : ci).focus(), 60);
}
function ladEvent(tag, lesson, nodeId){
  if (!ACC.server || !ACC.id || !lesson) return;
  LAD.queue.push({eventId:ladUUID(), clientTime:new Date().toISOString(), tag, lesson, nodeId:nodeId || ''});
  if (LAD.queue.length > 500) LAD.queue.splice(0, LAD.queue.length - 500);
  lsSet(LAD.qKey, JSON.stringify(LAD.queue));
  setTimeout(ladFlush, 1500);
}
async function ladFlush(){
  if (!ACC.server || !ACC.token || LAD.flushing || !LAD.queue.length) return;
  if (!LAD.st || !LAD.st.cls) return;   /* 반·번호를 정한 뒤에 보낸다 (시트에서 한 학생 기록이 둘로 갈라지지 않게) */
  LAD.flushing = true;
  try {
    const r = await api('api/events', {token:ACC.token, sessionId:LAD.sid, events:LAD.queue.slice(0, 40)});
    const ok = new Set(r.accepted || []);
    LAD.queue = LAD.queue.filter(e => !ok.has(e.eventId)); lsSet(LAD.qKey, JSON.stringify(LAD.queue));
  } catch (e){} finally { LAD.flushing = false; }
}
window.addEventListener('pagehide', () => {
  if (!ACC.server || !ACC.token || !LAD.queue.length || !LAD.st || !LAD.st.cls || !navigator.sendBeacon) return;
  try { navigator.sendBeacon('api/events', new Blob([JSON.stringify({token:ACC.token, sessionId:LAD.sid, events:LAD.queue.slice(0, 40)})], {type:'application/json'})); } catch (e) {}
});
/* 차시 구역에 들어올 때: 첫 진입 기록 · 반 번호 · 선생님 편지 */
function ladZoneEnter(z){
  const L = wrapLessonOf(z); if (!L) return;
  if (!LAD.entered[z.id]){ LAD.entered[z.id] = true; ladEvent('session-start', L, z.id); }
  if (!ACC.server) return;
  const go = () => { if (LAD.st && !LAD.st.cls) ladAskClass(() => ladCheckLetters()); else ladCheckLetters(); };
  setTimeout(() => { if (MODE !== 'play') return; if (uiBlocking()) UI.pending.push(go); else go(); }, 3600);
}
function ladOnEnter(){
  if (LAD.letterChecked || !ACC.server) return;
  LAD.letterChecked = true;
  setTimeout(() => { if (MODE === 'play') ladCheckLetters(); }, 1600);
}

/* ===== 📮 선생님 편지 ===== */
async function ladCheckLetters(done){
  const fin = () => { if (done) done(); };
  if (!ACC.server || !ACC.token || LAD.letterBusy) return fin();
  if (!LAD.st) await ladStatus();
  if (!LAD.st || !LAD.st.letters || !LAD.st.cls) return fin();
  LAD.letterBusy = true;
  let r = null;
  try { r = await api('api/feedback/get', {token:ACC.token, sessionId:LAD.sid}); } catch (e) {}
  LAD.letterBusy = false;
  const list = ((r && r.letters) || []).filter(l => l && l.text && !(letterSave()[l.lesson] && letterSave()[l.lesson].acked));
  if (!list.length) return fin();
  LAD.mail = {npc:(r && r.npc) || {name:'마을 우체부'}, lines:(r && r.lines) || {}};
  const next = i => (i >= list.length ? fin() : ladDeliver(list[i], () => next(i + 1)));
  if (uiBlocking()) UI.pending.push(() => next(0)); else next(0);
}
function ladDeliver(L, done){
  const who = '📮 ' + (LAD.mail.npc.name || '마을 우체부');
  SFX.ping();
  showDialog(who, [{who, text:LAD.mail.lines.intro || '딩동! 선생님이 편지를 남기셨어요.'}], () => openLetter(L, done));
}
function openLetter(L, done){
  const ln = LAD.mail.lines, z = COURSE.zones.find(q => wrapLessonOf(q) === L.lesson);
  let sent = false;
  const p = openPanel(`<div class="letter"><div class="lt-head">📮 ${z ? `${z.no}차시 ${esc(z.name)} · ` : ''}선생님 편지</div>
    <p class="lt-body"></p><p class="lt-ai" hidden></p>
    <label class="lt-ask"></label><input id="ltReply" maxlength="200" autocomplete="off" placeholder="한 문장 답장 · 이름이나 전화번호는 쓰지 않아요">
    <p class="cls-msg" id="ltMsg"></p>
    <div class="row"><button class="btn primary" id="ltSend">답장 보내기 ✉️</button><button class="btn" id="ltSkip">나중에 · 건너뛰기</button></div></div>`,
    {onClose:() => { if (!sent){ sent = true; ladAck(L, ''); } if (done) setTimeout(done, 50); }});
  p.querySelector('.lt-body').textContent = L.text;
  if (L.ai){ const a = p.querySelector('.lt-ai'); a.hidden = false; a.textContent = ln.aiLabel || '(선생님이 AI의 도움을 받아 쓰고 직접 확인한 편지예요)'; }
  p.querySelector('.lt-ask').textContent = ln.ask || '편지를 읽고 드는 생각을 한 문장으로 답장해 줄래요?';
  const inp = p.querySelector('#ltReply'), msg = p.querySelector('#ltMsg');
  const send = async reply => {
    p.querySelector('#ltSend').disabled = true; p.querySelector('#ltSkip').disabled = true;
    const r = await ladAck(L, reply);
    if (r && r.error){ msg.textContent = r.error; p.querySelector('#ltSend').disabled = false; p.querySelector('#ltSkip').disabled = false; return; }
    sent = true; closePanel();
    toast(reply ? (ln.thanks || '답장 고마워요!') : (ln.skipThanks || '편지는 시청 기록실에서 다시 볼 수 있어요.'), 'ok');
    if (r && r.flagged) UI.pending.unshift(() => showDialog('📮 마을 우체부', ['그 이야기를 들으니 걱정돼요. 지금 바로 선생님이나 보호자께 꼭 말씀드려요.']));
  };
  p.querySelector('#ltSend').onclick = () => { const t = inp.value.trim(); if (!t) return inp.focus(); send(t); };
  p.querySelector('#ltSkip').onclick = () => send('');
  inp.onkeydown = e => { if (e.isComposing || e.keyCode === 229) return; if (e.key === 'Enter'){ e.preventDefault(); p.querySelector('#ltSend').click(); } };
}
async function ladAck(L, reply){
  const t = ladMask(reply);
  try {
    const r = await api('api/feedback/ack', {token:ACC.token, sessionId:LAD.sid, lesson:L.lesson, reply:t});
    letterSave()[L.lesson] = {text:L.text, ai:!!L.ai, reply:t, at:Date.now(), acked:true}; persist();
    return r;
  } catch (e){
    if (e.status === 400) return {error:e.message || '다시 써 볼래요?'};
    letterSave()[L.lesson] = {text:L.text, ai:!!L.ai, reply:t, at:Date.now(), acked:true, pendingAck:true}; persist();
    return {ok:false};
  }
}

/* ===== 📜 시청 기록실 · 배움 기록 문서 · 엔딩 ===== */
function finaleInvite(){
  showDialog('시장님', [
    {who:'시장님', text:'점등식 대성공이에요! 전기 마스터 덕분에 마을이 환해졌어요.'},
    {who:'볼트 박사', text:'세 차시 동안 정리 회의에서 남긴 문장을 모아 두었어요. 시청 기록실의 큰 칠판에 모아서 한 권의 배움 기록으로 묶어 줄게요.'},
    {who:'시장님', text:'시청 기록실로 함께 가요!', choices:[{label:'📜 시청 기록실로 가기', fn:() => { UI.finGo = true; }}, {label:'조금 있다가 갈게요 (시청 앞 문으로)'}]},
  ], () => { if (UI.finGo){ UI.finGo = false; finaleGo(); } else wrapRoute(); });
}
function finaleGo(){
  if (!COURSE.finale || inRoom()) return;
  UI.waypoint = null; ZONE.town = WORLD; zoneFade(1, '#ffffff', .4); SFX.ping();
  setTimeout(() => { zoneLoadRoom(COURSE.finale, 0, 'left'); zoneCard(COURSE.finale, COURSE.finale.goal); }, 450);
}
function finaleTalk(o){
  const made = !!(SAVE.story && SAVE.story.docMade);
  if (!SAVE.story.finale) return showDialog(o.name, ['점등식이 끝나면 여기서 배움 기록 문서를 만들어 줄게요.']);
  if (!made) return finaleCeremony();
  showDialog(o.name, [{who:o.name, text:'배움 기록 문서를 다시 만들어 줄까요? 선생님 편지가 새로 왔으면 함께 묶여요.', choices:[
    {label:'📜 문서 다시 만들기', fn:() => { UI.wrapAfter = () => ladCheckLetters(() => openLearningDoc(false)); }},
    {label:'🎉 엔딩 다시 보기', fn:() => { UI.wrapAfter = openEnding; }}, {label:'괜찮아요'}]}],
    () => { const f = UI.wrapAfter; UI.wrapAfter = null; if (f) f(); });
}
function finaleCeremony(){
  if (uiBlocking()) return;
  const b = WORLD.objects.find(o => o.kind === 'wrapBoard');
  wrapStandAside(b); showHUD(false);
  FIN.shown = 0;
  ladCheckLetters(() => {
    const steps = [{who:'시장님', text:'어서 와요, 전기 마스터! 이 큰 칠판에 세 차시 정리 회의에서 남긴 문장을 하나씩 모아 볼게요.'}];
    COURSE.zones.forEach((z, k) => {
      const r = wrapSave()[wrapLessonOf(z)];
      steps.push({who:'볼트 박사', text:`${z.no}차시 「${z.name}」에서 네가 남긴 문장이에요. ${r && r.sentence ? `「${r.sentence}」` : '(정리 문장이 없어요)'}`, fx:() => { FIN.shown = k + 1; SFX.tone(520 + k * 120, .18, 'triangle', .04, 780 + k * 120); }});
    });
    const n = Object.keys(letterSave()).length;
    steps.push({who:'시장님', text:n ? `선생님이 보내 주신 편지 ${n}통과 네 답장도 함께 묶었어요.` : '선생님 편지는 아직 도착하지 않았어요. 편지가 오면 이 기록실에서 문서를 다시 만들 수 있어요.'});
    steps.push({who:'볼트 박사', text:'AI는 틀릴 수 있어서 확인하는 사람이 필요하다고 했지요? 이 기록은 네가 직접 생각하고 확인해서 정리한 배움의 증거예요.'});
    steps.push({who:'시장님', text:'자, 문서로 만들어 줄게요. 내려받아서 선생님과 가족에게 보여 드려요!'});
    const run = i => {
      if (!inRoom() || !ZONE.room || !ZONE.room.finale){ FIN.shown = -1; ZONE.focus = null; if (MODE === 'play') showHUD(true); return; }   /* 기록실을 벗어났으면 멈춘다 */
      if (i >= steps.length){ FIN.shown = -1; return openLearningDoc(true); }
      const s = steps[i]; if (s.fx) s.fx();
      showDialog(s.who, [{who:s.who, text:s.text}], () => run(i + 1));
    };
    run(0);
  });
}
const DOC_MARK = {correct:'✔ 스스로', partial:'◐ 반쯤', miss:'💡 힌트로', avoid:'💡 힌트로', misconception:'💡 다시 생각', write:'✏️'};
function docName(){ return String(SAVE.docName != null ? SAVE.docName : (SAVE.nickname || '')).slice(0, 12).trim() || '전기 마스터'; }
function buildLearningDoc(){
  const name = docName(), date = new Date().toLocaleDateString('ko-KR'), cls = SAVE.cls ? `반 코드 ${SAVE.cls.code} · ${SAVE.cls.no}번` : '';
  const T = [], H = [];
  T.push(`전기 마스터 타운 · 나의 배움 기록`, `${name}${cls ? ' (' + cls + ')' : ''} · ${date}`, '');
  H.push(`<header><div class="kicker">6학년 과학 · 전기의 이용 · AI 융합 수업</div><h1>⚡ 전기 마스터 타운 · 나의 배움 기록</h1>
    <p class="who"><b>${esc(name)}</b>${cls ? ` · ${esc(cls)}` : ''} · ${esc(date)}</p></header>`);
  for (const z of COURSE.zones){
    const L = wrapLessonOf(z), rec = wrapSave()[L] || null, letter = letterSave()[L] || null;
    const acts = zoneActs(z);
    T.push(`■ ${z.no}차시 · ${z.name}`);
    T.push('한 활동: ' + acts.map(a => `${actDone(a) ? '✔' : '□'} ${a.title}`).join(' / '));
    let h = `<section><h2><span class="no">${z.no}차시</span> ${esc(z.icon)} ${esc(z.name)}</h2>
      <p class="acts">${acts.map(a => `<span class="${actDone(a) ? 'ok' : ''}">${actDone(a) ? '✔' : '□'} ${esc(a.title)}</span>`).join('')}</p>`;
    if (rec && rec.done){
      h += `<div class="one"><small>📌 오늘의 한 문장</small><p>${esc(rec.sentence || '—')}</p></div>`;
      T.push(`오늘의 한 문장: ${rec.sentence || '—'}`);
      const log = (rec.log || []).filter(l => l.a);
      if (log.length){
        h += `<table><thead><tr><th>단계</th><th>정리 회의 질문</th><th>나의 대답</th><th></th></tr></thead><tbody>${log.map(l => `<tr><td class="st">${esc(l.stage)}</td><td><b>${esc(l.who)}</b> ${esc(l.q)}</td><td>${esc(l.a)}</td><td class="mk">${esc(DOC_MARK[l.result] || '')}</td></tr>`).join('')}</tbody></table>`;
        log.forEach(l => T.push(`  [${l.stage}] ${l.who}: ${l.q}`, `      → ${l.a}`));
      }
      h += `<div class="fb"><div><small>⭐ 잘한 점</small><p>${esc(rec.praise || '—')}</p></div><div><small>❓ 다음에 생각해 볼 질문</small><p>${esc(rec.question || '—')}</p></div></div>`;
      if ((rec.checkpoints || []).length) h += `<p class="cps">${rec.checkpoints.map(c => `<span class="${esc(c.status)}">${esc(c.label)} · ${esc(CP_MARK[c.status] || '')}</span>`).join('')}</p>`;
      T.push(`잘한 점: ${rec.praise || '—'}`, `다음에 생각해 볼 질문: ${rec.question || '—'}`);
    } else {
      h += '<p class="none">정리 회의 기록이 없어요.</p>'; T.push('정리 회의 기록이 없어요.');
    }
    if (letter && letter.text){
      h += `<div class="letter"><small>📮 선생님 편지${letter.ai ? ' <i>(선생님이 AI의 도움을 받아 쓰고 직접 확인한 편지)</i>' : ''}</small><p>${esc(letter.text)}</p>${letter.reply ? `<p class="reply">✉️ 나의 답장: ${esc(letter.reply)}</p>` : ''}</div>`;
      T.push(`선생님 편지: ${letter.text}`); if (letter.reply) T.push(`나의 답장: ${letter.reply}`);
    }
    H.push(h + '</section>'); T.push('');
  }
  const plan = (wrapSave().L3 && wrapSave().L3.sentence) || '';
  H.push(`<section class="end"><h2>🎆 마지막 정리</h2>
    <p><b>시장님</b> “전기 마스터 덕분에 마을의 불이 다시 켜졌어요. 이번 주에 실천하기로 한 일을 꼭 지켜 봐요!”</p>
    <p><b>볼트 박사</b> “AI는 틀릴 수 있어요. 그래서 확인하고 고치는 사람이 필요해요. 그 사람이 바로 여러분이에요.”</p>
    ${plan ? `<div class="one"><small>✅ 이번 주 나의 실천</small><p>${esc(plan)}</p></div>` : ''}
    <p class="note">이 문서는 학생 기기에서 만들어졌어요. 정리 회의의 판정(✔·◐·💡)은 게임 속 규칙이 붙인 표시로, 성적이 아니에요.</p></section>`);
  if (plan) T.push(`이번 주 나의 실천: ${plan}`);
  const css = `body{font-family:'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif;color:#1c2733;max-width:820px;margin:24px auto;padding:0 18px;line-height:1.6}
    header{border-bottom:4px solid #ffd23f;margin-bottom:18px}.kicker{color:#6b7a8a;font-size:13px}h1{margin:4px 0;font-size:26px}.who{margin:4px 0 12px;color:#3a4a5a}
    section{border:1px solid #d5dbe2;border-radius:12px;padding:14px 16px;margin:14px 0;page-break-inside:avoid}h2{margin:0 0 8px;font-size:20px}.no{background:#1c2733;color:#ffd23f;border-radius:6px;padding:1px 8px;font-size:14px;margin-right:6px}
    .acts span{display:inline-block;margin:0 10px 4px 0;font-size:13px;color:#6b7a8a}.acts span.ok{color:#1d7a46}
    .one{background:#24493a;color:#f4f1e6;border-radius:10px;padding:10px 14px;margin:10px 0}.one small{color:#ffe27a}.one p{margin:4px 0 0;font-size:18px}
    table{width:100%;border-collapse:collapse;font-size:13.5px;margin:8px 0}th,td{border-bottom:1px solid #e3e8ee;padding:6px;text-align:left;vertical-align:top}th{background:#f3f6f9}td.st{font-weight:700;width:34px}td.mk{white-space:nowrap;color:#6b7a8a;width:84px}
    .fb{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fb div{background:#fff8e1;border-radius:10px;padding:8px 12px}.fb div+div{background:#eaf5ff}.fb p{margin:2px 0 0}
    .cps span{display:inline-block;font-size:12px;border:1px solid #d5dbe2;border-radius:999px;padding:1px 8px;margin:6px 6px 0 0}.cps .self{border-color:#25a862;color:#1d7a46}.cps .support{border-color:#e5737f;color:#b23a48}
    .letter{background:#fdf4e3;border-left:5px solid #e2a93a;border-radius:8px;padding:8px 12px;margin-top:10px}.letter i{font-weight:400;color:#8a6d3b}.letter p{margin:4px 0}.reply{color:#3a4a5a}
    .none{color:#8a96a3}.note{color:#6b7a8a;font-size:12.5px}small{font-weight:700}
    @media print{body{margin:0}section{border-color:#bbb}}`;
  const body = H.join('\n');
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>전기 마스터 타운 · 나의 배움 기록</title><style>${css}</style></head><body>${body}</body></html>`;
  return {html, body, css, text:T.join('\n'), name, date};
}
function docDownload(file, mime, content){
  try {
    const url = URL.createObjectURL(new Blob([content], {type:mime})), a = document.createElement('a');
    a.href = url; a.download = file; a.rel = 'noopener'; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
    return true;
  } catch (e){ return false; }
}
function openLearningDoc(final){
  let D = buildLearningDoc();
  const p = openPanel(`<h2>📜 나의 배움 기록 문서</h2>
    <p class="sub" style="margin-top:0">세 차시 정리 회의 문장 · 칠판 정리 · 선생님 편지를 한 문서로 묶었어요.</p>
    <div class="row doc-name"><label>문서에 쓸 별명 <input id="docName" maxlength="12" autocomplete="off"></label><small>실명 대신 별명을 써요</small></div>
    <iframe class="doc-frame" sandbox title="문서 미리보기"></iframe>
    <div class="row doc-btns"><button class="btn primary" id="docHtml">📄 문서 내려받기</button><button class="btn" id="docWord">📝 한글·워드용 (.doc)</button><button class="btn" id="docPrint">🖨️ 인쇄 · PDF</button><button class="btn" id="docCopy">📋 글만 복사</button></div>
    <p class="note" id="docMsg">문서는 이 기기에서만 만들어져요.</p>
    <div class="row">${final ? '<button class="btn primary" id="docEnd">🎉 게임 끝내기</button>' : '<button class="btn" data-close>닫기</button>'}</div>`,
    {wide:true, onClose:() => { ZONE.focus = null; if (MODE === 'play') showHUD(true); if (final && !SAVE.story.ended) UI.pending.push(openEnding); }});
  const prev = p.querySelector('.doc-frame'), ni = p.querySelector('#docName'), msg = p.querySelector('#docMsg');
  const draw = () => { D = buildLearningDoc(); prev.srcdoc = D.html; };   /* 미리보기는 따로 떨어진 틀(스크립트 없음)에서 */
  ni.value = docName(); draw();
  ni.oninput = () => { SAVE.docName = ni.value.slice(0, 12); persist(); draw(); };
  const made = how => { SAVE.story.docMade = true; persist(); msg.textContent = how; SFX.ping(); };
  const fileBase = () => `전기마스터타운_배움기록_${D.name.replace(/[^가-힣A-Za-z0-9_-]/g, '') || '학생'}_${new Date().toISOString().slice(0, 10)}`;
  p.querySelector('#docHtml').onclick = () => { draw(); if (docDownload(fileBase() + '.html', 'text/html;charset=utf-8', D.html)) made('📄 내려받았어요! 브라우저의 내려받기 폴더를 확인해요. 열어서 인쇄하면 PDF로도 저장돼요.'); else msg.textContent = '이 화면에서는 내려받기가 막혀 있어요. [인쇄 · PDF]나 [글만 복사]를 써요.'; };
  p.querySelector('#docWord').onclick = () => {
    draw();
    const word = `﻿<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>나의 배움 기록</title><style>${D.css}</style></head><body>${D.body}</body></html>`;
    if (docDownload(fileBase() + '.doc', 'application/msword', word)) made('📝 .doc 파일로 내려받았어요. 한글이나 워드에서 열 수 있어요.'); else msg.textContent = '이 화면에서는 내려받기가 막혀 있어요. [글만 복사]를 써요.';
  };
  p.querySelector('#docPrint').onclick = () => {
    draw();
    const w = window.open('', '_blank');
    if (w){ w.document.open(); w.document.write(D.html); w.document.close(); setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 400); made('🖨️ 인쇄 창을 열었어요. 대상에서 "PDF로 저장"을 고르면 PDF가 돼요.'); return; }
    const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f);
    f.contentDocument.open(); f.contentDocument.write(D.html); f.contentDocument.close();
    setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); made('🖨️ 인쇄 창을 열었어요.'); } catch (e){ msg.textContent = '인쇄 창을 열지 못했어요. [글만 복사]를 써요.'; } setTimeout(() => f.remove(), 4000); }, 300);
  };
  p.querySelector('#docCopy').onclick = async () => {
    draw();
    try { await navigator.clipboard.writeText(D.text); made('📋 글을 복사했어요. 패들렛이나 한글 문서에 붙여 넣어요.'); }
    catch (e){ const ta = document.createElement('textarea'); ta.value = D.text; p.appendChild(ta); ta.select(); try { document.execCommand('copy'); made('📋 글을 복사했어요.'); } catch (er){ msg.textContent = '복사하지 못했어요.'; } ta.remove(); }
  };
  const end = p.querySelector('#docEnd'); if (end) end.onclick = () => closePanel();
}
function openEnding(){
  SAVE.story.ended = true; persist(); SND.fanfare();
  STORYFX.fwUntil = TIME + 6;
  const n = COURSE.zones.filter(z => wrapDoneL(wrapLessonOf(z))).length, c = masterCounts();
  const p = openPanel(`<div class="ending"><div class="end-icon">🎆</div><span class="zc-chip">THE END</span><h2>전기 마스터 타운 완주!</h2>
    <p>세 차시 동안 전자석과 전기 안전을 탐구하고, AI 두 가지를 직접 가르치고, 배운 것을 네 말로 정리했어요.</p>
    <ul class="end-list"><li>🧲 전자석 마스터 ${c.em}/4 · ⚡ 전기 안전 마스터 ${c.es}/3</li><li>📋 정리 회의 ${n}/${COURSE.zones.length}차시 · 📮 선생님 편지 ${Object.keys(letterSave()).length}통</li><li>📜 배움 기록 문서 ${SAVE.story.docMade ? '완성' : '아직 내려받지 않음'}</li></ul>
    <div class="row end-btns"><button class="btn" id="endCert">🏅 마스터 인증서</button><button class="btn" id="endDoc">📜 문서 다시 보기</button><button class="btn" id="endTruck">🚚 보너스: 번개 트럭 타고 집에 가기</button><button class="btn primary" data-close>마을 둘러보기</button></div>
    <p class="note">고마워요, 전기 마스터! 마을은 언제든 다시 둘러볼 수 있어요.</p></div>`, {wide:true});
  p.querySelector('#endCert').onclick = () => { closePanel(); openCert(); };
  p.querySelector('#endDoc').onclick = () => { closePanel(); openLearningDoc(false); };
  p.querySelector('#endTruck').onclick = () => {
    closePanel();
    if (inRoom()){ zoneExit(); setTimeout(() => { if (!uiBlocking()) epiOffer(); }, 900); } else epiOffer();
  };
}
(function wrapUIInit(){
  const ui = $('#wrapUI'); if (!ui) return;
  $('#wuPause').onclick = e => { e.stopPropagation(); wrapPause(); };
  ui.addEventListener('click', e => { if (e.target.closest('button,input,textarea')) return; if (WRAP.phase === 'msg' || WRAP.typer) wrapKey({code:'Enter'}); });
})();
