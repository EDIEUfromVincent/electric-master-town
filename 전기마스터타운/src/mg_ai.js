/* =========================================================
   6-3. 기중기 · AI 두뇌 · 표현 게임
   · 질문 미끄럼틀   — 전자석 기중기의 판단을 예/아니요 질문 길로 (규칙 세우기 → 다듬기 → 새 데이터로 시험)
   · 전기 안전 캠페인 — 교재 '표현하기' (과학 글쓰기 · 역할놀이 · 그림)
   · 고철장 크레인 조종 — 3D 고철장 조종석으로 바로 가기
   ========================================================= */

/* ===== 질문 미끄럼틀 ===== */
const SLIDE = {pred:0, tree:null};
const SL_S1_ITEMS = ['i1', 'i2', 'i8', 'i4'];
const SL_ACT = {skip:{t:'안 집기', c:'#5b6573'}, weak:{t:'약하게 (전지 1개)', c:'#1f8a4c'}, strong:{t:'세게 (전지 2개)', c:'#c4621f'}};
const SL_KEYCOL = {재료:'#c4621f', 무게:'#2f74c0', 크기:'#1f8a4c', 색:'#8456c2'};
const slBlank = () => ({t:'q', q:null, yes:{t:'a', a:null}, no:{t:'a', a:null}});
const slClone = n => JSON.parse(JSON.stringify(n));
function slDepth(n){ return !n || n.t !== 'q' ? 0 : 1 + Math.max(slDepth(n.yes), slDepth(n.no)); }
function slValid(n){ return !!n && (n.t === 'a' ? !!n.a : n.t === 'q' && !!n.q && !!QUESTIONS[n.q] && slValid(n.yes) && slValid(n.no)); }
const slOnlyQ = n => !n || n.t !== 'q' || (Q_ORDER.includes(n.q) && slOnlyQ(n.yes) && slOnlyQ(n.no));
function slPos(path){ const d = path.length - 1; let idx = 0; for (const ch of path.slice(1)) idx = idx * 2 + (ch === 'n' ? 1 : 0); return {x:(idx + .5) * 960 / (1 << d), y:104 + d * 118, d}; }
function slNodes(n, path = 'r', out = []){ if (!n) return out; out.push({n, path}); if (n.t === 'q'){ slNodes(n.yes, path + 'y', out); slNodes(n.no, path + 'n', out); } return out; }
function slKeysAbove(root, path){ const keys = []; let n = root; for (const ch of path.slice(1)){ if (n.t === 'q' && n.q) keys.push(QUESTIONS[n.q].key); n = ch === 'y' ? n.yes : n.no; } return keys; }
function slFixDup(n, keys = []){ if (!n || n.t !== 'q') return; if (n.q && keys.includes(QUESTIONS[n.q].key)) n.q = null; const k = n.q ? keys.concat(QUESTIONS[n.q].key) : keys; slFixDup(n.yes, k); slFixDup(n.no, k); }
function slLoad2(){ for (const t of [SAVE.mgTree, SAVE.tree]) if (t && slValid(t) && slOnlyQ(t) && slDepth(t) <= 2) return slClone(t); return slBlank(); }
const slW = d => [250, 210, 170, 116][d] || 110;
function slDraw(g, ctx){
  const T = ctx.T;
  g.fillStyle = '#16212d'; g.fillRect(0, 0, 960, 540);
  g.strokeStyle = 'rgba(255,255,255,.035)'; g.lineWidth = 1; for (let x = 0; x < 960; x += 40){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 540); g.stroke(); }
  mgBox(g, 420, 4, 120, 30, '#2b3a4c', '#3b5068', 8, 2); mgText(g, '🚚 고철 투입구', 480, 19, 12, '#a9b9cb');
  g.strokeStyle = '#3b5068'; g.lineWidth = 6; g.beginPath(); g.moveTo(480, 34); g.lineTo(480, 78); g.stroke();
  const nodes = slNodes(T);
  for (const {n, path} of nodes) if (n.t === 'q'){
    const p = slPos(path);
    for (const [c, lab, col] of [['y', '예', '#25a862'], ['n', '아니요', '#e5483a']]){
      const q = slPos(path + c); g.strokeStyle = col; g.lineWidth = 6; g.beginPath(); g.moveTo(p.x, p.y + 25); g.lineTo(q.x, q.y - 28); g.stroke();
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2; mgBox(g, mx - 30, my - 13, 60, 26, '#0f1a26', col, 13, 2); mgText(g, lab, mx, my, 13, col);
    }
  }
  for (const {n, path} of nodes){
    const p = slPos(path), w = slW(p.d), sel = ctx.sel === path;
    if (n.t === 'q'){
      if (n.q){ const Qd = QUESTIONS[n.q]; mgBox(g, p.x - w / 2, p.y - 25, w, 50, SL_KEYCOL[Qd.key] || '#3b5068', sel ? '#ffd23f' : '#0f1a26', 12, sel ? 4 : 3); mgText(g, `${ATTR[Qd.key] ? ATTR[Qd.key].icon : '❓'} ${Qd.text}`, p.x, p.y + 1, p.d ? 15 : 17, '#fff'); }
      else { g.setLineDash([8, 6]); mgBox(g, p.x - w / 2, p.y - 25, w, 50, '#22303f', sel ? '#ffd23f' : '#ffd23f88', 12, 3); g.setLineDash([]); mgText(g, '❓ 질문을 골라요', p.x, p.y + 1, 15, '#ffd23f'); }
      if (ctx.ans && ctx.ans.path === path){ const col = ctx.ans.yes ? '#25a862' : '#e5483a'; mgBox(g, p.x + w / 2 - 6, p.y - 44, 72, 28, col, '#0f1a26', 14, 2); mgText(g, ctx.ans.yes ? '예!' : '아니요!', p.x + w / 2 + 30, p.y - 30, 14, '#fff'); }
    } else {
      const bw = Math.min(w, 150), col = n.a ? SL_ACT[n.a].c : '#22303f';
      g.beginPath(); g.moveTo(p.x - bw / 2, p.y - 26); g.lineTo(p.x + bw / 2, p.y - 26); g.lineTo(p.x + bw / 2 - 14, p.y + 30); g.lineTo(p.x - bw / 2 + 14, p.y + 30); g.closePath();
      g.fillStyle = col; g.fill(); if (!n.a) g.setLineDash([8, 6]); g.lineWidth = sel ? 4 : 3; g.strokeStyle = sel ? '#ffd23f' : n.a ? '#0f1a26' : '#ffd23f88'; g.stroke(); g.setLineDash([]);
      mgText(g, n.a ? (ctx.s1 && n.a === 'weak' ? '🧲 집기' : n.a === 'skip' ? '🚫 안 집기' : SL_ACT[n.a].t) : '결정을 골라요', p.x, p.y + 2, n.a ? 14 : 13, n.a ? '#fff' : '#ffd23f');
      const rs = (ctx.results || {})[path] || [];
      rs.forEach((r, i) => { const x = p.x - (rs.length - 1) * 19 + i * 38, y = p.y + 70; drawItem(g, r.it, x, y, .5); mgText(g, r.ok ? '✓' : '✗', x, y + 13, 16, r.ok ? '#8ff0b9' : '#ff8a80'); });
    }
  }
  if (ctx.item){ const it = ctx.item; drawItem(g, it.it, it.x, it.y - 24, .66); mgBox(g, it.x - 58, it.y - 86, 116, 22, 'rgba(15,26,38,.88)', null, 8); mgText(g, it.it.name, it.x, it.y - 75, 12, '#fff'); }
}
function slHit(T, x, y){
  for (const {n, path} of slNodes(T)){ const p = slPos(path), w = n.t === 'q' ? slW(p.d) : Math.min(slW(p.d), 150); if (Math.abs(x - p.x) <= w / 2 && y >= p.y - 30 && y <= p.y + 34) return path; }
  return null;
}
function slEditPop(api, ctx, path, after){
  const n = nodeAt(ctx.T, path), p = slPos(path);
  let html;
  if (n.t === 'q'){
    const used = slKeysAbove(ctx.T, path);
    html = `<p><b>어떤 질문으로 나눌까요?</b></p><div class="pop-col">${Q_ORDER.map(q => { const Qd = QUESTIONS[q], dis = used.includes(Qd.key);
      return `<button class="btn small" data-q="${q}"${dis ? ' disabled title="이 길에서 이미 물어본 특징이에요"' : ''}>${ATTR[Qd.key].icon} ${Qd.text}</button>`; }).join('')}${!ctx.s1 && p.d > 0 ? '<button class="btn small ghost" data-x="leaf">질문 지우고 바로 결정하기</button>' : ''}</div>`;
  } else {
    const acts = ctx.s1 ? [['weak', '🧲 집기'], ['skip', '🚫 안 집기']] : [['skip', '🚫 안 집기'], ['weak', '🔋 약하게 (전지 1개)'], ['strong', '🔋🔋 세게 (전지 2개)']];
    html = `<p><b>여기에 온 고철은?</b></p><div class="pop-col">${acts.map(([a, t]) => `<button class="btn small" data-a="${a}">${t}</button>`).join('')}${!ctx.s1 && p.d < 2 ? '<button class="btn small ghost" data-x="q">❓ 질문 하나 더 하기</button>' : ''}</div>`;
  }
  ctx.sel = path;
  const el = ctx.d3 ? (() => { const q = sl3Pos(path), s = P3(q.x, q.y, SL3.Z + .2); return api.popAt(s.x, s.y, html); })() : api.pop(p.x, p.y, html);
  const close = () => { api.pop(); ctx.sel = null; slFixDup(ctx.T); SND.tick(); after(); };
  el.querySelectorAll('[data-q]').forEach(b => b.onclick = e => { e.stopPropagation(); n.q = b.dataset.q; close(); });
  el.querySelectorAll('[data-a]').forEach(b => b.onclick = e => { e.stopPropagation(); n.a = b.dataset.a; close(); });
  el.querySelectorAll('[data-x]').forEach(b => b.onclick = e => {
    e.stopPropagation(); const parent = nodeAt(ctx.T, path.slice(0, -1)), val = b.dataset.x === 'q' ? slBlank() : {t:'a', a:null};
    if (path.endsWith('y')) parent.yes = val; else parent.no = val; close();
  });
}
/* 굴리기: 고철이 질문 칸마다 예/아니요 길로 미끄러져 통에 떨어진다 */
function slRoll(api, ctx, items, onDone){
  ctx.rolling = true; ctx.results = {}; ctx.ans = null; api.pop(); ctx.sel = null; ctx.pTotal = ctx.pHit = ctx.pScore = ctx.pCombo = 0; ctx.craneFx = null;
  const R = {i:-1, pts:null, k:0, x:0, y:0, wait:0, after:null, res:[]};
  const next = () => {
    R.i++; if (R.i >= items.length){ ctx.rolling = false; ctx.item = null; ctx.ans = null; if (ctx.d3){ const ok = R.res.filter(r => r.out.ok).length; if (ok === R.res.length){ fxBanner('전부 성공!', '#8ff0b9', 1.2); SFX.win(); fxBurst(0, 6, -.5, 60); } else fxBanner(`${ok} / ${R.res.length}`, '#ffd23f', 1.1); } onDone(R.res); return; }
    const it = items[R.i], tr = traceTree(ctx.T, it), POS = ctx.d3 ? sl3Pos : slPos, pts = [ctx.d3 ? {x:0, y:8.3} : {x:480, y:-10}]; let n = ctx.T, path = 'r';
    while (n && n.t === 'q'){ const ans = QUESTIONS[n.q].f(it), p = POS(path); pts.push({x:p.x, y:p.y, ans, path}); path += ans ? 'y' : 'n'; n = ans ? n.yes : n.no; }
    const lp = POS(path); pts.push({x:lp.x, y:lp.y + (ctx.d3 ? -.1 : 6), leaf:path});
    Object.assign(R, {pts, k:1, x:pts[0].x, y:pts[0].y, it, tr}); ctx.item = {it, x:R.x, y:R.y};
    /* 예측: 굴리기 전에 '어느 통으로 갈까?'를 맞히면 점수와 콤보 (질문 길을 눈으로 따라가 보기) */
    if (ctx.d3 && !ctx.demo){ ctx.predicting = true; ctx.guess = null; ctx.predT = ctx.predMax = Math.max(2.2, 3.6 - R.i * .18) / (ctx.fast ? 2 : 1); api.say(`🔮 <b>${esc(it.name)}</b> (🧱${it.material} · ⚖️${it.heavy ? '무거움' : '가벼움'} · 📏${it.big ? '큼' : '작음'} · 🎨${it.colorName}) — 어느 통으로 갈까요? 통을 눌러 예측해요!`); }
  };
  ctx.step = dt => {
    if (ctx.predicting){ ctx.predT -= dt; if (ctx.predT <= 0) ctx.predicting = false; else return; }
    if (R.wait > 0){ R.wait -= dt; if (R.wait <= 0 && R.after){ const f = R.after; R.after = null; f(); } return; }
    if (!R.pts) return;
    const tgt = R.pts[R.k], dx = tgt.x - R.x, dy = tgt.y - R.y, dist = Math.hypot(dx, dy), sp = (ctx.d3 ? 5.4 : 640) * dt * (ctx.fast ? 2.4 : 1);
    if (dist <= sp){
      R.x = tgt.x; R.y = tgt.y;
      if (tgt.leaf){
        const out = craneOutcome(R.it, R.tr.action);
        (ctx.results[tgt.leaf] = ctx.results[tgt.leaf] || []).push({it:R.it, ok:out.ok}); R.res.push({it:R.it, tr:R.tr, out});
        out.ok ? SND.ok() : SND.bad(); api.say(`${out.ok ? '✓' : '✗'} <b>${esc(R.it.name)}</b> — ${out.msg}`, out.ok ? 'ok' : 'bad');
        if (ctx.d3){ const lp = sl3Pos(tgt.leaf); if (out.ok){ fxBurst(lp.x, lp.y, SL3.Z + .4, 20); fxPop(lp.x, lp.y + 1.0, SL3.Z + .4, '✓', '#8ff0b9', 34); } else { SFX.buzz(); fxShake(.12); fxPop(lp.x, lp.y + 1.0, SL3.Z + .4, '✗', '#ff8a80', 34); } }
        if (ctx.d3){
          const lp = sl3Pos(tgt.leaf), KT = {ok:R.tr.action === 'skip' ? '통과!' : '집었다!', nostick:'붙지 않아요!', drop:'무거워서 떨어졌어요!', waste:'전기 낭비!', miss:'철을 놓쳤어요!'};
          fxPop(lp.x, lp.y + 1.6, SL3.Z + .4, KT[out.kind] || '', out.ok ? '#8ff0b9' : '#ff8a80', 20);
          ctx.craneFx = {leaf:tgt.leaf, kind:out.kind, act:R.tr.action, it:R.it, t:0, d:ctx.fast ? .5 : 1.0};
          ctx.pTotal = (ctx.pTotal || 0) + 1;
          if (ctx.guess === tgt.leaf){ ctx.pHit = (ctx.pHit || 0) + 1; ctx.pCombo = (ctx.pCombo || 0) + 1; const pts = 10 * ctx.pCombo; ctx.pScore = (ctx.pScore || 0) + pts; fxBanner(`예측 적중! +${pts}`, '#8ff0b9', .9, 36); SFX.combo(ctx.pCombo); }
          else { ctx.pCombo = 0; if (ctx.guess) fxBanner('예측 빗나감!', '#ff8a80', .8, 32); }
        }
        ctx.item = null; ctx.ans = null; R.pts = null; R.wait = ctx.d3 ? (ctx.fast ? .55 : 1.05) : (ctx.fast ? .3 : .6); R.after = next;
      } else { ctx.ans = {path:tgt.path, yes:tgt.ans}; ctx.d3 ? SFX.ping() : SND.tick(); R.k++; R.wait = ctx.fast ? .14 : .32; }
    } else { R.x += dx / dist * sp; R.y += dy / dist * sp; }
    if (ctx.item){ ctx.item.x = R.x; ctx.item.y = R.y; }
  };
  next();
}
/* ===== 자동이의 시범 · 힌트 =====
   처음 하는 학생에게 '질문 칸 고르기 → 통 정하기 → 굴려 보기'를 자동이가 먼저 보여 준다.
   자동이는 일부러 겉모습 규칙(은색 · 무게 · 크기)으로 만들어 틀리는 모습을 보이고, 무엇을 물어야 할지 생각할 거리를 남긴다 */
const SL_DEMO = [
  [{path:'r', say:'🤖 자동이: 삐릭! 내가 먼저 해 보겠다. 맨 위 <b>질문 칸</b>을 누르면 물어볼 질문을 고를 수 있다.'},
   {path:'r', set:n => { n.q = 'silver'; }, say:'🤖 번쩍이는 건 철이다! <b>‘은색인가요?’</b>를 골랐다.'},
   {path:'ry', set:n => { n.a = 'weak'; }, say:'🤖 <b>예</b> 쪽 통을 눌러 <b>🧲 집기</b>로 정한다.'},
   {path:'rn', set:n => { n.a = 'skip'; }, say:'🤖 <b>아니요</b> 쪽 통은 <b>🚫 안 집기</b>. 다 정했으니 ▶ 굴려 보기!'},
   {roll:true},
   {say:'🤖 삐릭…? 은색 알루미늄 캔은 전자석에 붙지 않았고, 회색 철 못은 놓쳤다. <b>색</b>으로는 안 되는 건가? 이제 네 차례다. 무엇을 물어야 할까?', wait:5200}],
  [{path:'r', set:n => { n.q = 'heavy'; }, say:'🤖 이번엔 세기도 정해야 한다. 맨 위 질문은 <b>‘무거운가요?’</b>!'},
   {path:'ry', set:n => { n.a = 'strong'; }, say:'🤖 무거우면 <b>🔋🔋 세게 (전지 2개)</b>.'},
   {path:'rn', set:n => { n.a = null; }, say:'🤖 가벼운 쪽은 더 나눠 보자. 통을 누르고 <b>‘❓ 질문 하나 더 하기’</b>를 고르면 길이 하나 더 생긴다!'},
   {path:'rn', set:(n, T) => { T.no = {t:'q', q:'big', yes:{t:'a', a:'weak'}, no:{t:'a', a:'skip'}}; }, say:'🤖 새 질문은 <b>‘큰가요?’</b> — 크면 약하게, 작으면 안 집기!'},
   {roll:true},
   {say:'🤖 삐릭… 큰 종이 상자는 붙지 않았고, 작은 철 캔과 철 못은 놓쳤다! 무게나 크기보다 <b>먼저</b> 물어야 할 게 있다. 이제 네 차례! 막히면 💡 힌트를 눌러라.', wait:5600}],
];
const SL_HINTS = [
  ['크레인을 직접 조종할 때 어떤 고철이 전자석에 붙었나요? <b>재료</b>를 물어보면 어떨까요?', '알루미늄 캔과 철 캔은 둘 다 <b>은색</b>이에요. 색으로 나누면 어떻게 될까요?', '전자석에 붙는 고철은 <b>🧲 집기</b>, 붙지 않는 고철은 <b>🚫 안 집기</b>로 보내요.'],
  ['먼저 <b>‘철로 만들었나요?’</b>로 나누면, 전자석에 붙지 않는 고철은 바로 안 집기로 보낼 수 있어요.', '세게 집어야 하는 건 <b>큰</b> 고철일까요, <b>무거운</b> 고철일까요? 작지만 무거운 물건도 있어요.', '철인 쪽 통을 눌러 <b>‘❓ 질문 하나 더 하기’</b>로 무게를 한 번 더 물어봐요. 질문 2개면 충분해요!'],
];
function slDemo(api, ctx, st, items, done){
  const steps = SL_DEMO[st], keep = ctx.T; let i = 0, over = false;
  Object.assign(ctx, {demo:true, T:slBlank(), results:{}, sel:null});
  const finish = () => {
    if (over) return; over = true;
    Object.assign(ctx, {demo:false, T:keep, sel:null, results:{}, rolling:false, step:null, item:null, ans:null, craneFx:null});
    api.pop(); SAVE.slDemo = SAVE.slDemo || {}; SAVE.slDemo[st] = true; persist(); done();
  };
  const run = () => {
    if (over || MG.ended) return;
    const s = steps[i++]; if (!s) return finish();
    if (s.roll){ ctx.sel = null; return slRoll(api, ctx, items, () => api.after(700, run)); }
    if (s.path){ ctx.sel = s.path; if (s.set) s.set(nodeAt(ctx.T, s.path), ctx.T); SND.tick(); }
    if (s.say) api.say(s.say);
    api.after(s.wait || 2600, run);
  };
  run();
  return finish;
}
/* 아래 단추 줄의 💡 힌트 · 🤖 시범 */
function slHelp(api, ctx, st, items, intro){
  let hint = 0, skip = null;
  const demoBtn = $('#slDemo'), go = $('#slGo');
  const setDemoUi = on => { if (demoBtn) demoBtn.textContent = on ? '⏭ 시범 건너뛰기' : '🤖 시범 다시 보기'; if (go) go.disabled = on; };
  const startDemo = () => { setDemoUi(true); skip = slDemo(api, ctx, st, items, () => { skip = null; setDemoUi(false); api.say(intro); }); };
  if (demoBtn) demoBtn.onclick = () => { if (ctx.rolling && !ctx.demo) return; if (skip) skip(); else startDemo(); };
  const hb = $('#slHint'); if (hb) hb.onclick = () => { if (ctx.demo) return; const H = SL_HINTS[st]; api.say(`💡 힌트 ${hint % H.length + 1}/${H.length} · ${H[hint % H.length]}`); hint++; SND.tick(); };
  if (!(SAVE.slDemo && SAVE.slDemo[st])) startDemo(); else api.say(intro);
}
function slideBuild(api, st){
  const s1 = st === 0, items = s1 ? SL_S1_ITEMS.map(id => TRAIN_ITEMS.find(i => i.id === id)) : TRAIN_ITEMS;
  const ctx = {s1, T:s1 ? (SAVE.mgTree1 && slValid(SAVE.mgTree1) && slDepth(SAVE.mgTree1) === 1 ? slClone(SAVE.mgTree1) : slBlank()) : slLoad2(), sel:null, results:{}, rolling:false, tries:0, item:null, ans:null, fast:false};
  api.canvas(true);
  const intro = slIntro(s1);
  const bot = api.bot(SL_BOT);
  const upd = () => { const q = $('#slQ'); if (q) q.textContent = `질문 ${treeSize(ctx.T)}개 · 굴린 횟수 ${ctx.tries}번`; };
  bot.querySelector('#slFast').onclick = e => { ctx.fast = !ctx.fast; e.currentTarget.classList.toggle('on', ctx.fast); };
  bot.querySelector('#slGo').onclick = () => {
    if (ctx.rolling || ctx.demo || MG.ended) return;
    if (!slValid(ctx.T)) return api.say('아직 정하지 않은 칸(❓ 질문을 골라요 · 결정을 골라요)이 있어요. 모두 정한 뒤 굴려요.', 'bad');
    ctx.tries++; upd(); if (s1) SAVE.mgTree1 = slClone(ctx.T); else SAVE.mgTreeDraft = slClone(ctx.T); persist();
    slRoll(api, ctx, mgShuffle(items), res => {
      const ok = res.filter(r => r.out.ok).length, n = res.length, size = treeSize(ctx.T);
      if (s1 && ok === n) return api.end(ctx.tries === 1 ? 3 : ctx.tries === 2 ? 2 : 1, `고철 ${n}개를 모두 알맞게 처리했어요! (굴린 횟수 ${ctx.tries}번)`, resultTable(res));
      if (!s1 && ok >= 7){
        SAVE.mgTree = slClone(ctx.T); if (!SAVE.tree || !treeComplete(SAVE.tree)) SAVE.tree = slClone(ctx.T);
        if (!SAVE.badges.em3){ SAVE.badges.em3 = true; toast('AI 크레인 두뇌 미션 성공!', 'ok'); }
        persist();
        return api.end(ok === 8 && size <= 2 ? 3 : ok === 8 ? 2 : 1, `연습 고철 ${n}개 중 <b>${ok}개</b>를 알맞게 처리했어요. 질문 ${size}개.${ok === 8 && size > 2 ? ' 질문을 2개로 줄여도 모두 맞힐 수 있을까요?' : ok < 8 ? ' 틀린 고철까지 맞히면 번개가 늘어요.' : ''}`, resultTable(res));
      }
      api.say(`${n}개 중 ${ok}개를 알맞게 처리했어요. <b>✗</b>가 붙은 고철을 보고 질문이나 결정을 고쳐 다시 굴려요.`, 'bad');
    });
  };
  api.pointer({down:(x, y) => {
    if (ctx.rolling || ctx.demo || MG.ended) return;
    const hit = slHit(ctx.T, x, y);
    if (ctx.sel){ api.pop(); ctx.sel = null; if (!hit) return; }
    if (!hit) return;
    ctx.results = {}; slEditPop(api, ctx, hit, upd);
  }});
  api.loop(dt => { if (ctx.rolling && ctx.step) ctx.step(dt); slDraw(api.g, ctx); });
  upd(); slHelp(api, ctx, st, items, intro);
}
const SL_BOT = `<span class="mg-chip" id="slQ"></span><button class="btn primary big" id="slGo">▶ 굴려 보기</button><button class="btn" id="slFast">빠르게</button><button class="btn" id="slHint">💡 힌트</button><button class="btn" id="slDemo">🤖 시범 다시 보기</button>`;
const slIntro = s1 => s1 ? '맨 위 <b>질문 칸</b>을 눌러 질문을 고르고, 아래 두 <b>통</b>을 눌러 ‘집기’나 ‘안 집기’를 정해요. 다 정하면 ▶ 굴려 보기!'
  : '연습 고철 8개를 알맞게 처리하는 질문 길을 만들어요. 통을 눌러 <b>‘❓ 질문 하나 더 하기’</b>로 길을 늘릴 수 있어요. 질문은 적을수록 좋아요!';
mgReg({id:'slide', order:4, icon:'🛝', title:'질문 미끄럼틀', stat:'ai', ai:'규칙 세우기(예/아니요 질문 길) → 연습 고철로 굴려 보고 고치기',
  book:'전자석 기중기 — 철만 붙이고, 무거운 고철은 세게 (켜고 끄기 · 세기)',
  stages:[
    {name:'질문 하나로 나누기', goal:'고철 4개가 질문 하나를 지나 ‘집기’ 통과 ‘안 집기’ 통으로 미끄러져요. 전자석에 붙는 고철만 집도록 질문과 통을 정해요. 처음에는 자동이가 시범을 보여 줘요.', how:'질문 칸·통을 눌러 고르기 · ▶ 굴려 보기 · 💡 힌트'},
    {name:'질문 길 만들기', goal:'연습 고철 8개를 안 집기 · 약하게(전지 1개) · 세게(전지 2개)로 알맞게 처리하는 질문 길을 만들어요. 질문은 적을수록 좋아요.', how:'통을 눌러 ‘질문 하나 더 하기’ · ▶ 굴려 보기 · 💡 힌트'}],
  learn:[
    '전자석에는 <b>철로 만든 물체</b>만 붙어요. ‘철로 만들었나요?’처럼 딱 맞는 질문 하나로 물체를 나눌 수 있어요. 이렇게 예/아니요로 나누는 것이 AI가 판단하는 한 가지 방법이에요.',
    '무거운 철은 전지 2개로 <b>세게</b>, 가벼운 철은 전지 1개로 <b>약하게</b> 들어요. 굴려 보고 틀린 고철을 보며 질문을 고치는 것이 AI를 만드는 과정이에요. 색이나 크기처럼 겉모습만 보는 질문은 틀리기 쉬워요.'],
  start(st, api){ slideBuild(api, st); }});

/* ===== 전기 안전 캠페인 (교재 표현하기) ===== */
const CP_RULES = [
  {icon:'💧', sit:'손에 물이 묻어 있다면', act:'수건으로 물기를 닦은 뒤 플러그를 만진다', why:'물은 전기가 잘 통해서 감전될 수 있기 때문이다', bad:'젖은 손으로 재빨리 플러그를 꽂는다'},
  {icon:'🔌', sit:'멀티탭 하나에 여러 기기를 꽂으려 한다면', act:'쓰지 않는 플러그를 뽑고 나누어 꽂는다', why:'한꺼번에 많은 전기가 흐르면 전선이 뜨거워져 불이 날 수 있기 때문이다', bad:'멀티탭을 하나 더 이어서 모두 꽂는다'},
  {icon:'✋', sit:'플러그를 뽑을 때라면', act:'플러그 머리를 잡고 뽑는다', why:'전선을 당기면 전선이 상해 합선이나 화재가 날 수 있기 때문이다', bad:'전선을 잡고 힘껏 당긴다'},
  {icon:'🚪', sit:'방에서 나갈 때라면', act:'전등과 전기 기구를 끈다', why:'아무도 없는 방에서 쓰는 전기는 낭비되기 때문이다', bad:'금방 올 테니 모두 켜 둔다'},
  {icon:'🧊', sit:'새 냉장고를 산다면', act:'에너지 소비 효율 1등급 제품을 고른다', why:'1등급 제품은 같은 일을 하면서 전기를 덜 쓰기 때문이다', bad:'등급은 보지 않고 가장 싼 제품을 고른다'},
  {icon:'➰', sit:'전선의 피복이 벗겨졌다면', act:'그 전선을 쓰지 않고 어른께 알려 바꾼다', why:'드러난 구리선은 감전과 합선의 원인이 되기 때문이다', bad:'조심해서 그냥 계속 쓴다'},
  {icon:'🔋', sit:'충전이 다 끝났다면', act:'충전기를 콘센트에서 뽑는다', why:'꽂아 두기만 해도 대기 전력이 새어 나가기 때문이다', bad:'다음에 또 쓸 테니 계속 꽂아 둔다'},
];
const cpCard = x => `<div class="cp-card"><span>${x.icon}</span><p><b>만약</b> ${esc(x.sit)}, ${esc(x.act)}.</p><small>왜냐하면 ${esc(x.why)}.</small></div>`;
function cpWorks(){ if (!Array.isArray(SAVE.works)) SAVE.works = []; return SAVE.works; }
function campRules(api){
  const R = mgShuffle(CP_RULES).slice(0, 3), S = {i:0, step:0, miss:0, made:[], lock:false, rt:16};
  api.canvas(false);
  api.say('상황에 알맞은 행동과 까닭을 골라 <b>‘만약 ~라면, ~한다. 왜냐하면 ~’</b> 안전 수칙 카드를 만들어요.');
  api.dom(`<div class="cp"><div class="cp-rule" id="cpR"></div><div class="cp-opts" id="cpO"></div><div class="cp-made" id="cpM"></div></div>`);
  let opts = [];
  const show = () => {
    const r = R[S.i];
    $('#cpR').innerHTML = `<div class="cp-n">수칙 카드 ${S.i + 1} / ${R.length}</div><p><span class="cp-if">만약</span> <b>${r.icon} ${esc(r.sit)}</b>,</p>
      <p><span class="cp-slot ${S.step > 0 ? 'full' : 'now'}">${S.step > 0 ? esc(r.act) : '어떻게 할까요?'}</span></p>
      <p><span class="cp-if why">왜냐하면</span> <span class="cp-slot ${S.step > 1 ? 'full' : S.step === 1 ? 'now' : ''}">${S.step > 1 ? esc(r.why) : '까닭은?'}</span></p>`;
    if (S.step > 1){ $('#cpO').innerHTML = ''; return; }
    const others = mgShuffle(CP_RULES.filter(x => x !== r));
    opts = S.step === 0 ? mgShuffle([r.act, r.bad, others[0].act]) : mgShuffle([r.why, others[0].why, others[1].why]);
    $('#cpO').innerHTML = `<h4>${S.step === 0 ? '🛠️ 알맞은 행동을 골라요' : '💡 알맞은 까닭을 골라요'}</h4>${opts.map((o, k) => `<button class="btn cp-o" data-o="${k}"><kbd>${k + 1}</kbd> ${esc(o)}</button>`).join('')}`;
    $('#cpO').querySelectorAll('[data-o]').forEach(b => b.onclick = () => answer(b, opts[+b.dataset.o]));
  };
  const finish = () => {
    cpWorks().push({kind:'rules', items:S.made.map(x => ({icon:x.icon, sit:x.sit, act:x.act, why:x.why})), time:Date.now()}); persist();
    api.end(S.miss === 0 ? 3 : S.miss <= 2 ? 2 : 1, `안전 수칙 카드 ${S.made.length}장을 만들었어요. 틀린 고르기 ${S.miss}번. 캠페인 갤러리에 저장했어요.`, `<div class="cp-made">${S.made.map(cpCard).join('')}</div>`);
  };
  const answer = (b, o) => {
    if (MG.ended || S.lock) return;
    const r = R[S.i], right = S.step === 0 ? r.act : r.why;
    if (o === right){
      SND.ok(); S.step++; api.say(S.step === 1 ? '✓ 좋아요! 이제 까닭을 골라요.' : '✓ 수칙 카드 완성!', 'ok'); show();
      if (S.step === 2){ S.made.push(r); $('#cpM').innerHTML = S.made.map(cpCard).join(''); S.lock = true; if (S.rt > 8){ fxBanner('빠르고 정확해요!', '#8ff0b9', .9, 38); SFX.combo(1); } api.after(1100, () => { S.lock = false; S.i++; S.step = 0; S.rt = 16; FX3.lastSec = null; if (S.i >= R.length) finish(); else show(); }); }
    } else {
      S.miss++; SND.bad(); b.disabled = true; b.classList.add('shake');
      api.say(S.step === 0 ? (o === r.bad ? '그렇게 하면 위험하거나 전기가 낭비돼요. 다시 골라요.' : '이 상황과 어울리지 않는 행동이에요. 다시 골라요.') : '이 행동의 까닭으로는 어울리지 않아요. 다시 골라요.', 'bad');
    }
  };
  api.keys(e => { const m = e.code.match(/^(?:Digit|Numpad)([1-3])$/); if (m){ const b = $(`#cpO [data-o="${+m[1] - 1}"]`); if (b && !b.disabled) b.click(); } });
  api.loop(dt => {
    if (S.lock || MG.ended || S.i >= R.length) return;
    S.rt -= dt; api.stat(`📝 수칙 카드 ${S.i + 1}/${R.length} · 틀림 ${S.miss} · ${mgClock(S.rt)}`);
    if (S.rt <= 0){ const r = R[S.i]; S.miss++; SFX.buzz(); fxShake(.1); api.say(`⏰ 시간이 지났어요! 정답: 만약 ${esc(r.sit)}, ${esc(r.act)}. 왜냐하면 ${esc(r.why)}.`, 'bad'); S.step = 2; show(); S.made.push(r); $('#cpM').innerHTML = S.made.map(cpCard).join(''); S.lock = true; api.after(1800, () => { S.lock = false; S.i++; S.step = 0; S.rt = 16; FX3.lastSec = null; if (S.i >= R.length) finish(); else show(); }); }
  });
  show();
}
const CP_PLAYS = [
  {id:'wet', title:'젖은 손과 헤어드라이어', icon:'💧', bg:'#dcecf8', props:['💧', '🛑', '✅'],
   p1:'머리 다 감았다! 얼른 드라이어 플러그 꽂아야지.',
   p2:['잠깐! 젖은 손은 전기가 잘 통해서 감전될 수 있어. 손부터 닦자.', '잠깐! 젖은 손으로 만지면 드라이어가 빨리 고장 나.', '빨리 꽂아! 늦겠다.'],
   p3:['(수건으로 손을 닦고) 이제 플러그를 꽂을게. 고마워!', '괜찮아, 조심해서 빨리 꽂으면 돼.', '드라이어 대신 선풍기로 말릴래.']},
  {id:'strip', title:'문어발 멀티탭', icon:'🔌', bg:'#f5ead6', props:['🔌', '🔥', '✅'],
   p1:'게임기, 난로, 전기밥솥까지 멀티탭 하나에 다 꽂자!',
   p2:['그러면 전선이 뜨거워져서 불이 날 수 있어. 나눠서 꽂자.', '그러면 전기 요금이 조금 오를 뿐이야.', '와, 멋지다! 더 꽂아 봐.'],
   p3:['(쓰지 않는 플러그를 뽑고) 난로는 다른 콘센트에 꽂을게.', '멀티탭을 하나 더 이어서 모두 꽂자.', '불이 나면 그때 끄면 되지.']},
  {id:'pull', title:'전선 당기기', icon:'➰', bg:'#eef3e8', props:['➰', '⚡', '✅'],
   p1:'토스터 다 썼다. 전선 잡고 쭉 당겨서 뽑아야지.',
   p2:['전선을 당기면 속의 선이 끊어져 불이 날 수 있어. 플러그 머리를 잡아.', '전선을 당기면 손이 아프니까 하지 마.', '더 세게 당겨!'],
   p3:['(플러그 머리를 잡고) 이렇게 뽑아야지!', '발로 전선을 밟고 당기면 쉽게 빠져.', '그냥 계속 꽂아 둘래.']},
  {id:'tv', title:'아무도 없는 방의 TV', icon:'📺', bg:'#e9e4f5', props:['📺', '💸', '✅'],
   p1:'놀이터 다녀올게! TV는 그냥 켜 둬야지.',
   p2:['아무도 없는데 켜 두면 전기가 낭비돼. 끄고 가자.', 'TV를 켜 두면 집이 덜 심심해.', '응, 잘 다녀와!'],
   p3:['(TV와 멀티탭 스위치를 끄고) 다녀오겠습니다!', '소리만 줄이고 갈게.', 'TV를 더 크게 틀어 놓을게.']},
];
function cpComic(g, P, lines, names = ['하늘', '바다']){
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#fffaf0'; g.fillRect(0, 0, 960, 540);
  mgText(g, `📣 ${P.title}`, 480, 30, 22, '#1c2733');
  const W = 296, H = 456, Y = 60;
  [0, 1, 2].forEach(i => {
    const X = 16 + i * (W + 16), who = i === 1 ? 1 : 0;
    mgBox(g, X, Y, W, H, P.bg, '#1c2733', 10, 4);
    mgDot(g, X + 26, Y + 26, 17, '#1c2733'); mgText(g, String(i + 1), X + 26, Y + 27, 16, '#fff');
    g.font = `700 17px ${FONT_B}`; const L = mgLines(g, lines[i] || '', W - 64), bx = X + 18, by = Y + 54, bw = W - 36, bh = 22 + L.length * 24;
    mgBox(g, bx, by, bw, bh, '#ffffff', '#1c2733', 14, 3);
    const tx = who === 0 ? X + 92 : X + W - 82, tip = who === 0 ? -8 : 8;
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(tx - 12, by + bh - 2); g.lineTo(tx + 12, by + bh - 2); g.lineTo(tx + tip, by + bh + 22); g.closePath(); g.fill();
    g.strokeStyle = '#1c2733'; g.lineWidth = 3; g.beginPath(); g.moveTo(tx - 12, by + bh); g.lineTo(tx + tip, by + bh + 22); g.lineTo(tx + 12, by + bh); g.stroke();
    L.forEach((l, k) => mgText(g, l, X + W / 2, by + 23 + k * 24, 17, '#1c2733', 'center', 700));
    mgEmoji(g, P.props[i], X + W / 2, Y + H - 196, 54);
    mgEmoji(g, '👦', X + 92, Y + H - 92, 96); mgEmoji(g, '👧', X + W - 82, Y + H - 92, 96);
    mgText(g, names[0], X + 92, Y + H - 26, 14, '#1c2733'); mgText(g, names[1], X + W - 82, Y + H - 26, 14, '#1c2733');
  });
}
/* 3컷 대본: 장면 네 개를 모두 만든다. 목록에서 아무 장면이나 골라 만들고, 저장하면 목록으로 돌아온다 */
function campComic(api){
  const S = {P:null, step:0, miss:0, lines:[], done:{}};
  api.canvas(false);
  const list = () => {
    S.P = null; api.canvas(false); api.bot(''); if (api.d3) api.scene(cp3Backdrop());
    const n = Object.keys(S.done).length;
    api.say(n ? `만화 ${n}/${CP_PLAYS.length}개 완성! 남은 장면을 골라 계속 만들어요.` : '네 장면을 모두 3컷 대본으로 만들어요. 먼저 만들 장면을 골라요.');
    const el = api.dom(`<div class="cp"><h3 class="mg-h">🎭 3컷 대본 만들기 <small>(${n}/${CP_PLAYS.length} 완성)</small></h3><div class="cp-plays">${CP_PLAYS.map((P, i) => `<button class="cp-play ${S.done[P.id] ? 'done' : ''}" data-i="${i}" ${S.done[P.id] ? 'disabled' : ''}><span>${S.done[P.id] ? '✅' : P.icon}</span><b>${esc(P.title)}</b><small>${esc(P.p1)}</small></button>`).join('')}</div></div>`);
    el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { S.P = CP_PLAYS[+b.dataset.i]; S.lines = [S.P.p1]; S.step = 1; SND.tick(); stepUI(); });
  };
  const stepUI = () => {
    const P = S.P, n = Object.keys(S.done).length + 1;
    if (S.step <= 2){
      const opts = mgShuffle((S.step === 1 ? P.p2 : P.p3).map((t, k) => ({t, ok:k === 0})));
      api.say(`만화 ${n}/${CP_PLAYS.length} · ${S.step === 1 ? '2컷: 친구 바다는 뭐라고 말려야 할까요? <b>까닭이 바른 말</b>을 골라요.' : '3컷: 하늘이는 어떻게 바르게 행동할까요?'}`);
      const el = api.dom(`<div class="cp"><h4>${P.icon} ${esc(P.title)}</h4><div class="cp-strip">${[0, 1, 2].map(i => `<div class="cp-cut ${i < S.step ? 'full' : i === S.step ? 'now' : ''}"><b>${i + 1}컷 · ${i === 1 ? '👧 바다' : '👦 하늘'}</b><p>${i < S.lines.length ? esc(S.lines[i]) : i === S.step ? '?' : ''}</p></div>`).join('')}</div>
        <h4>${S.step === 1 ? '👧 바다의 말 고르기' : '👦 하늘이의 행동 고르기'}</h4><div class="cp-opts">${opts.map((o, k) => `<button class="btn cp-o" data-k="${k}"><kbd>${k + 1}</kbd> ${esc(o.t)}</button>`).join('')}</div></div>`);
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
        if (MG.ended) return;
        const o = opts[+b.dataset.k];
        if (o.ok){ SND.ok(); S.lines.push(o.t); S.step++; stepUI(); }
        else { S.miss++; SND.bad(); b.disabled = true; b.classList.add('shake'); api.say(S.step === 1 ? '까닭이 바르지 않거나 친구를 말리지 못하는 말이에요. 다시 골라요.' : '그렇게 하면 여전히 위험하거나 전기가 낭비돼요. 다시 골라요.', 'bad'); }
      });
      return;
    }
    api.say('대사를 내 말로 바꿔도 좋아요. 다 되면 <b>만화 완성!</b>을 눌러요.');
    const el = api.dom(`<div class="cp"><h3 class="mg-h">✏️ 대사 다듬기 <small>(한 컷에 40자까지)</small></h3>${S.lines.map((l, i) => `<div class="fieldset"><label for="cpL${i}">${i + 1}컷 · ${i === 1 ? '👧 바다' : '👦 하늘'}</label><input id="cpL${i}" maxlength="40" value="${esc(l)}"></div>`).join('')}
      <div class="row"><button class="btn primary big" id="cpDone">🎬 만화 완성!</button></div></div>`);
    el.querySelector('#cpDone').onclick = () => { S.lines = S.lines.map((l, i) => ($('#cpL' + i).value || '').trim() || l); render(); };
  };
  const render = () => {
    api.dom(''); if (api.d3) api.scene(cp3ComicScene(S.P, S.lines)); else { api.canvas(true); cpComic(api.g, S.P, S.lines); }
    const last = Object.keys(S.done).length + 1 >= CP_PLAYS.length;
    api.say(`${api.d3 ? '무대 위에서 3컷 역할놀이가 펼쳐졌어요!' : '3컷 만화가 완성됐어요!'} 갤러리에 저장해요.`);
    const bot = api.bot(`<button class="btn primary big" id="cpSave">${last ? '갤러리에 저장하고 끝내기' : '갤러리에 저장하고 다음 장면 ▶'}</button><button class="btn" id="cpPng" hidden>🖼️ 그림 파일로 저장</button><button class="btn ghost" id="cpEdit">대사 고치기</button>`);
    const png = bot.querySelector('#cpPng');
    mgCanSave().then(ok => { if (ok && png.isConnected) png.hidden = false; });
    png.onclick = () => mgSavePng(api.d3 ? mg3Snapshot() : $('#mgCv'), `전기안전캠페인_${S.P.title}.png`);
    bot.querySelector('#cpEdit').onclick = () => { api.bot(''); api.canvas(false); if (api.d3) api.scene(cp3Backdrop()); S.step = 3; stepUI(); };
    bot.querySelector('#cpSave').onclick = () => {
      cpWorks().push({kind:'comic', play:S.P.id, lines:S.lines.slice(), time:Date.now()}); persist();
      S.done[S.P.id] = true; SND.ok();
      if (Object.keys(S.done).length < CP_PLAYS.length) return list();
      api.end(S.miss === 0 ? 3 : S.miss <= 2 ? 2 : 1, `3컷 대본 ${CP_PLAYS.length}개를 모두 만들어 캠페인 갤러리에 저장했어요. 틀린 고르기 ${S.miss}번.`);
    };
  };
  api.keys(e => { const m = e.code.match(/^(?:Digit|Numpad)([1-3])$/); if (m && S.P && S.step <= 2){ const b = document.querySelector(`#mgDom [data-k="${+m[1] - 1}"]`); if (b && !b.disabled) b.click(); } });
  list();
}
/* 그림 파일 저장: claude.ai 게시본에서는 downloads 기능으로 묻고 저장, 내려받은 HTML 파일에서는 보통 내려받기.
   저장할 수 없는 화면이면 단추를 숨긴다. */
let MG_DL = null;
function mgDownloads(){
  if (!MG_DL) MG_DL = window.claude && typeof window.claude.use === 'function' ? Promise.resolve(window.claude.use('downloads')).catch(() => null) : Promise.resolve(null);
  return MG_DL;
}
const mgCanSave = () => mgDownloads().then(dl => !!dl || !window.claude);
async function mgSavePng(canvas, filename){
  const dl = await mgDownloads();
  if (dl){
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    if (!blob) return toast('그림을 만들지 못했어요.', 'bad');
    try { await dl.save({filename, data:blob}); toast('그림을 저장했어요.', 'ok'); }
    catch (e){ if (!e || e.code !== 'declined') toast(e && e.code === 'rate_limited' ? '잠시 뒤에 다시 눌러 주세요.' : '이 화면에서는 그림을 저장할 수 없어요.', 'bad'); }
    return;
  }
  if (window.claude) return toast('이 화면에서는 그림을 저장할 수 없어요.', 'bad');
  const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = filename; document.body.appendChild(a); a.click(); a.remove();
}
function cpCopy(txt){
  const done = () => toast('복사했어요. 학급 게시판에 붙여 넣어요.', 'ok');
  const fallback = () => { const t = document.createElement('textarea'); t.value = txt; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('복사하지 못했어요. 글을 직접 골라 복사해요.', 'bad'); } t.remove(); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fallback); else fallback();
}
function openCampaignGallery(){
  const W = cpWorks(), notes = SAVE.notes || {}, comics = W.filter(w => w.kind === 'comic').slice(-4), rules = W.filter(w => w.kind === 'rules').slice(-3).flatMap(r => r.items || []);
  const imgs = comics.map(w => { const P = CP_PLAYS.find(p => p.id === w.play); if (!P) return ''; const c = mkCanvas(960, 540); cpComic(c.getContext('2d'), P, w.lines || []); return `<img class="cp-img" src="${c.toDataURL()}" alt="${esc(P.title)} 3컷 만화">`; }).filter(Boolean);
  const p = openPanel(`<h2>📣 캠페인 갤러리</h2><p class="sub">내가 만든 안전 수칙 카드와 3컷 만화예요. 모둠 친구와 나누고, 학급 게시판(패들렛 등)에 붙여 넣어 공유해요.</p>
    <h3>안전 수칙 카드</h3>${rules.length ? `<div class="cp-made">${rules.map(cpCard).join('')}</div>` : '<p class="sub">아직 없어요. 전기 안전 캠페인 1단계에서 만들어요.</p>'}
    <h3>3컷 만화</h3>${imgs.length ? `<div class="cp-gal">${imgs.join('')}</div>` : '<p class="sub">아직 없어요. 전기 안전 캠페인 2단계에서 만들어요.</p>'}
    <h3>새롭게 알게 된 점</h3>
    <div class="fieldset"><label for="cgNote">전기를 안전하게 쓰고 아끼는 방법에 대해 새롭게 알게 된 점을 한두 줄로 써요</label><textarea id="cgNote" rows="2" maxlength="160">${esc(notes.campaign || '')}</textarea></div>
    ${notes.detect ? `<p class="sub">🔍 전자석 탐정에서 쓴 글: ${esc(notes.detect)}</p>` : ''}
    <div class="row"><button class="btn primary" id="cgCopy">📋 게시판에 붙여 넣을 글 복사</button><button class="btn" data-close>닫기</button></div>`, {wide:true});
  p.querySelector('#cgNote').oninput = e => { SAVE.notes = SAVE.notes || {}; SAVE.notes.campaign = e.target.value; persist(); };
  p.querySelector('#cgCopy').onclick = () => {
    const n = SAVE.notes || {};
    cpCopy(['[우리 모둠 전기 안전 캠페인]', ...rules.map(x => `· 만약 ${x.sit}, ${x.act}. 왜냐하면 ${x.why}.`),
      ...comics.map(w => { const P = CP_PLAYS.find(q => q.id === w.play); return P ? `· 3컷 대본 「${P.title}」 ${(w.lines || []).join(' / ')}` : ''; }),
      n.campaign ? `· 새롭게 알게 된 점: ${n.campaign}` : '', n.detect ? `· 전자석으로 만들고 싶은 것: ${n.detect}` : ''].filter(Boolean).join('\n'));
  };
}
mgReg({id:'campaign', order:7, icon:'📣', title:'전기 안전 캠페인', stat:'safe', book:'전기를 안전하게 사용하고 절약하는 방법 표현하기 (과학 글쓰기 · 역할놀이 · 그림)',
  stages:[
    {name:'만약 ~라면 수칙', goal:'상황에 알맞은 행동과 까닭을 골라 ‘만약 ~라면, ~한다. 왜냐하면 ~’ 안전 수칙 카드 3장을 만들어요.', how:'버튼 또는 1·2·3 키'},
    {name:'역할놀이 3컷 대본', goal:'위험한 장면 → 친구의 말 → 바른 행동 순서로, 네 장면(젖은 손 · 문어발 · 전선 당기기 · 빈방 TV)을 모두 3컷 대본으로 만들어 만화로 저장해요.', how:'장면 고르기 → 대사 고르기 · 내 말로 다듬기 (4개 모두)'},
    {name:'우리 동네 안전 지도', goal:'맵 만들기 공방에서 상황 카드 3개 이상이 있는 우리 동네 지도를 만들고 로봇을 순찰시켜요. 해내면 ⚡ 3개!', how:'맵 만들기 공방이 열려요', launch:() => enterEditor()}],
  learn:[
    '‘만약 ~라면, ~한다’는 컴퓨터 프로그램의 <b>조건문</b>과 같아요. 상황(조건)마다 할 일을 정해 두면 누구나 같은 규칙으로 안전하게 행동할 수 있어요.',
    '위험한 행동을 <b>까닭과 함께</b> 말리면 친구가 더 잘 이해해요. 만든 만화는 캠페인 갤러리에서 다시 보고 나눌 수 있어요.',
    '우리 동네의 위험한 곳과 바른 곳을 지도로 나타내면 전기 안전을 더 넓게 알릴 수 있어요.'],
  start(st, api){ [campRules, campComic][st](api); },
  extra:[{label:'📣 캠페인 갤러리 (작품 보기 · 공유 글 복사)', fn:() => openCampaignGallery()}]});

/* ===== 고철장 크레인 조종 (3D 조종석으로 바로 가기) ===== */
function mgCraneBolts(S){ const miss = (S.nostick || 0) + (S.drop || 0) + (S.waste || 0), b = miss === 0 ? 3 : miss <= 2 ? 2 : 1; mgSetBolts('crane', 0, b); return b; }
mgReg({id:'crane', order:3, icon:'🏗️', title:'고철장 크레인 조종', stat:'em', single:true, book:'전자석 기중기 — 켜고 끄기 · 세기 (전지 1개 · 2개)',
  stages:[{name:'크레인 조종', goal:'크레인을 직접 조종해 철 고철만 고철함에 옮겨요. 무거운 고철은 전지 2개로 세게, 전기는 아껴서! 실수가 없을수록 번개가 많아요.', how:'고철장 조종석이 열려요',
    launch:() => (crane3Ready() ? startCrane3D('manual') : openCraneManual())}],
  learn:['전자석 기중기는 <b>전기가 흐를 때만 자석</b>이 되는 성질로 고철을 들었다 내려놓고, <b>전지 개수로 세기</b>를 바꿔 무거운 고철도 들어요.'],
  start(){}});
