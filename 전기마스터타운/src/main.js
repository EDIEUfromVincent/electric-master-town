/* =========================================================
   6. 시작 · 게임 루프 · 입력 연결
   ========================================================= */
function frame(now){
  const dt = Math.min(.05, Math.max(0, (now - (frame.last || now)) / 1000)); frame.last = now; TIME += dt;
  try {
    if (UI.mg && !MG3.on && !UI.cutscene){ requestAnimationFrame(frame); return; }   /* 2D 미니 게임 중에는 마을을 그리지 않는다 */
    if (G3.ok){
      if (MODE === 'editor') renderEditor3D(dt);
      else if (WORLD){
        if (MODE === 'play'){ if (!uiBlocking()) updatePlayer3D(dt); else { player.moving = false; PATH3.nodes = null; } updateJump(dt); }
        if (MODE === 'patrol') updateRobot(dt);
        if (MODE === 'crane') updateCrane3D(dt);
        updateWalkers(dt); updatePet(dt);
        updateCars(dt); carHitCheck(dt); evUpdate();
        updateStoryFx(dt);
        storyPoll();
        render3D(dt);
        if (MODE !== 'title') drawMinimap();
      }
    }
    else if (MODE === 'editor') renderEditor();
    else if (WORLD){
      if (MODE === 'play'){ if (!uiBlocking()) updatePlayer(dt); else player.moving = false; updateJump(dt); }
      if (MODE === 'patrol') updateRobot(dt);
      updateWalkers(dt);
      updateCars(dt); carHitCheck(dt); evUpdate();
      updateStoryFx(dt);
      storyPoll();
      if (MODE === 'title'){ cam.x = WORLD.w / 2 + Math.sin(TIME * .06) * 16; cam.y = WORLD.h / 2 + Math.cos(TIME * .045) * 9; clampCam(); }
      else updateCamera(dt, STORYFX.cam || (MODE === 'patrol' ? ROBOT : player));
      renderWorld(TIME);
      if (MODE !== 'title') drawMinimap();
    }
  } catch (e) { console.error(e); }
  requestAnimationFrame(frame);
}
function closeDialogAll(){ const D = UI.dialog; if (!D) return; D.wait = false; D.i = D.lines.length - 1; advanceDialog(); }

window.addEventListener('keydown', e => {
  const typing = e.target && e.target.closest && e.target.closest('input,textarea,select');
  if (UI.mg && !UI.modal && !UI.cutscene){ if (typing && e.code !== 'Escape') return; mgKey(e, true); return; }
  if (e.code === 'Escape'){
    if (UI.cutscene) csSkip(); else if (UI.dialog) closeDialogAll(); else if (UI.modal) closePanel(); else if (MODE === 'crane') exitCrane3D(); else if (MODE === 'play') openMenu();
    return;
  }
  if (typing) return;
  if (MODE === 'crane'){ if (!UI.modal) cr3Key(e, true); return; }
  const act = e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter';
  if (UI.cutscene){ if (act){ e.preventDefault(); if (!e.repeat) csAdvance(); } return; }
  if (UI.dialog){
    if (UI.dialog.wait && /^(Digit|Numpad)[1-4]$/.test(e.code)){ pickChoice(+e.code.slice(-1) - 1); return; }
    if (act){ e.preventDefault(); if (!e.repeat) advanceDialog(); } return;
  }
  if (UI.modal) return;
  if ((MODE === 'play' || MODE === 'patrol' || MODE === 'editor') && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (MODE === 'play'){
    if (e.code === 'Space'){ e.preventDefault(); if (!e.repeat) playerJump(); return; }
    if (act){ if (!e.repeat) onAction(); return; }
    if (e.code === 'KeyQ' && !e.repeat){ if (WORLD.kind === 'story') openActs(); return; }
    if (e.code === 'KeyM' && !e.repeat){ MINI.big = !MINI.big; MINI.base = null; return; }
    if (e.code === 'KeyI' && !e.repeat){ openBag(); return; }
    if (e.code === 'KeyB' && !e.repeat){ toggleBike(); return; }

    if (G3.ok && e.code === 'KeyV' && !e.repeat){ toggleView(); return; }
    if (G3.ok && (e.code === 'KeyZ' || e.code === 'KeyC') && !e.repeat){ rotateView(e.code === 'KeyZ' ? 1 : -1); return; }
  }
  KEYS.add(e.code);
});
window.addEventListener('keyup', e => {
  KEYS.delete(e.code);
  if (UI.mg){ if (!(e.target && e.target.closest && e.target.closest('input,textarea,select'))) mgKey(e, false); return; }
  if (MODE === 'crane') cr3Key(e, false);
});
window.addEventListener('blur', () => { KEYS.clear(); JOY.x = JOY.y = 0; CR3.hold = 0; });
window.addEventListener('resize', () => { resizeCanvas(); ED.area = null; });

/* 캔버스: 에디터 그리기 / 게임에서 물체 누르기 */
cv.addEventListener('pointerdown', e => {
  if (MG3.on){ if (UI.mg && !UI.modal) mgPointer3('down', e); return; }
  if (G3.ok){ g3PointerDown(e); return; }
  if (MODE === 'editor'){ edPointerDown(e); return; }
  if (MODE !== 'play' || uiBlocking() || !NEAR) return;
  const camPX = Math.round(cam.x * TS - CW / 2), camPY = Math.round(cam.y * TS - CH / 2);
  const wx = (e.clientX + camPX) / TS, wy = (e.clientY + camPY) / TS;
  if (wx >= NEAR.x - .3 && wx <= NEAR.x + 1.3 && wy >= NEAR.y - 1.3 && wy <= NEAR.y + 1.2) interact(NEAR);
});
cv.addEventListener('pointermove', e => { if (MG3.on){ if (UI.mg) mgPointer3('move', e); return; } if (G3.ok) g3PointerMove(e); else if (MODE === 'editor') edPointerMove(e); });
cv.addEventListener('pointerup', e => { if (MG3.on){ if (UI.mg) mgPointer3('up', e); return; } if (G3.ok) g3PointerUp(e); else if (MODE === 'editor') edPointerUp(e); });
cv.addEventListener('pointercancel', e => { if (MG3.on){ if (UI.mg) mgPointer3('up', e); return; } if (G3.ok) g3PointerUp(e); else if (MODE === 'editor') edPointerUp(e); });
cv.addEventListener('pointerleave', () => { if (MODE === 'editor') ED.hover = null; });
cv.addEventListener('wheel', e => { if (MG3.on){ e.preventDefault(); return; } if (G3.ok) g3Wheel(e); }, {passive:false});
cv.addEventListener('contextmenu', e => { if (G3.ok) e.preventDefault(); });

/* 터치 조이스틱 */
(() => {
  const joy = $('#joy'), knob = $('#joyKnob');
  const upd = e => {
    const r = joy.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const max = r.width / 2 - 12, m = Math.hypot(dx, dy), k = m > max ? max / m : 1;
    knob.style.transform = `translate(${dx * k}px,${dy * k}px)`;
    JOY.x = dx * k / max; JOY.y = dy * k / max; if (Math.hypot(JOY.x, JOY.y) < .18) JOY.x = JOY.y = 0;
  };
  joy.addEventListener('pointerdown', e => { JOY.id = e.pointerId; try { joy.setPointerCapture(e.pointerId); } catch (er) {} upd(e); });
  joy.addEventListener('pointermove', e => { if (e.pointerId === JOY.id) upd(e); });
  const end = e => { if (e.pointerId === JOY.id){ JOY.id = null; JOY.x = JOY.y = 0; knob.style.transform = ''; } };
  joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
  $('#actBtn').addEventListener('click', onAction);
})();

/* 대화·패널·컷신 */
$('#dialog').addEventListener('click', advanceDialog);
$('#cutscene').addEventListener('click', e => { if (e.target.closest('#csSkip')) return; csAdvance(); });
$('#csSkip').addEventListener('click', e => { e.stopPropagation(); csSkip(); });
$('#panel').addEventListener('click', e => { if (e.target.closest('[data-close]')) closePanel(); });

/* HUD */
$('#bQuest').onclick = () => { if (WORLD.kind === 'story') openQuests(); else toast('친구 맵에서는 화면 위의 진행 상황을 봐요.'); };
$('#bMenu').onclick = openMenu;
$('#bBag').onclick = openBag;
$('#bBike').onclick = toggleBike;

$('#minimap').onclick = () => { MINI.big = !MINI.big; MINI.base = null; };
$('#bSkipPatrol').onclick = finishRobot;
$('#bCustomExit').onclick = exitCustom;
$('#bCamL').onclick = () => rotateView(1);
$('#bCamR').onclick = () => rotateView(-1);
$('#bView').onclick = toggleView;
document.querySelectorAll('#edCam [data-ec]').forEach(b => b.onclick = () => ed3Button(b.dataset.ec));

/* 3D 크레인 조종판: ◀ ▶는 누르고 있는 동안 움직인다 */
for (const [id, d] of [['#cbL', -1], ['#cbR', 1]]){
  const el = $(id);
  el.addEventListener('pointerdown', e => { e.preventDefault(); CR3.hold = d; try { el.setPointerCapture(e.pointerId); } catch (er) {} });
  const up = () => { if (CR3.hold === d) CR3.hold = 0; };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
}
$('#cbMag').onclick = () => cr3Toggle();
$('#cbB1').onclick = () => cr3SetBatt(1);
$('#cbB2').onclick = () => cr3SetBatt(2);
$('#cbExit').onclick = () => exitCrane3D();
$('#cbFast').onclick = e => { CR3.speed = CR3.speed === 1 ? 2.5 : 1; e.currentTarget.classList.toggle('on', CR3.speed > 1); };
$('#cbSkip').onclick = () => cr3AutoDone();

/* 처음 화면 */
$('#mStart').onclick = () => { SND.tick(); enterStory(); };
$('#mEditor').onclick = () => enterEditor('title');
$('#mGuide').onclick = openGuide;
$('#mActs').onclick = () => { SND.tick(); openActs(); };
$('#mLogout').onclick = logout;
$('#lgForm').onsubmit = e => { e.preventDefault(); doLogin(); };
$('#lgTeacher').onclick = openGuide;
$('#jumpBtn').addEventListener('pointerdown', e => { e.preventDefault(); playerJump(); });

/* 미니 게임 화면 */
(() => {
  const mcv = $('#mgCv');
  mcv.addEventListener('pointerdown', e => { e.preventDefault(); try { mcv.setPointerCapture(e.pointerId); } catch (er) {} mgPointer('down', e); });
  mcv.addEventListener('pointermove', e => mgPointer('move', e));
  mcv.addEventListener('pointerup', e => mgPointer('up', e));
  mcv.addEventListener('pointercancel', e => mgPointer('up', e));
  mcv.addEventListener('contextmenu', e => e.preventDefault());
  $('#mgQuit').onclick = () => mgQuit();
})();
$('#mCert').onclick = openCert;
$('#mSound').onclick = () => { SAVE.sound = !SAVE.sound; persist(); $('#mSound').textContent = SAVE.sound ? '소리 켜짐' : '소리 꺼짐'; SND.tick(); };
$('#mReset').onclick = openReset;

/* 맵 만들기 위쪽 버튼 */
$('#edTitle').oninput = e => { ED.map.title = e.target.value; saveDraft(); };
$('#edTeam').oninput = e => { ED.map.team = e.target.value; saveDraft(); };
$('#edNew').onclick = () => {
  const p = openPanel(`<h2>새 맵</h2><p class="sub">지금 맵을 저장하지 않았다면 먼저 [저장]을 눌러요.</p>
    <div class="row"><button class="btn" data-sz="24,16">작게 24×16</button><button class="btn primary" data-sz="32,22">보통 32×22</button><button class="btn" data-sz="40,28">크게 40×28</button><button class="btn" data-sz="sample">예시 맵</button></div>`);
  p.querySelectorAll('[data-sz]').forEach(b => b.onclick = () => {
    if (b.dataset.sz === 'sample') ED.map = sampleMap(); else { const [w, h] = b.dataset.sz.split(',').map(Number); ED.map = blankMap(w, h); }
    ED.id = null; $('#edTitle').value = ED.map.title; $('#edTeam').value = ''; saveDraft(); edStatus(); closePanel();
  });
};
$('#edSave').onclick = saveMapToList;
$('#edOpen').onclick = openMapList;
$('#edCode').onclick = openCodePanel;
$('#edCheck').onclick = openCheckPanel;
$('#edPlay').onclick = () => { saveDraft(); loadCustomWorld(cloneMap(ED.map), true); };
$('#edPatrol').onclick = () => {
  if (!trainedModel()) return toast('먼저 AI 연구소에서 로봇을 가르쳐요.', 'bad');
  if (!ED.map.objects.some(o => o.type === 'scene')) return toast('상황 카드를 먼저 놓아요.', 'bad');
  saveDraft(); loadCustomWorld(cloneMap(ED.map), true); askCustomPatrol();
};
$('#edExit').onclick = () => { saveDraft(); if (ED.from === 'story') enterStory(); else showTitle(); };

function boot(){
  loadSave(); rpgSync(true); storyInit(); resizeCanvas(); g3Init(); updateRpgHUD();
  if (IS_TOUCH) document.body.classList.add('touch');
  loadWorld(buildStoryWorld());
  showTitle();
  requestAnimationFrame(frame);
  accBoot();
}
const HOT = window.claude && window.claude.hot;
if (HOT && typeof HOT.ready === 'function') HOT.ready(boot); else boot();
