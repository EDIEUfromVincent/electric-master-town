/* =========================================================
   6-6. 질문 미끄럼틀 · 전기 안전 캠페인의 3D 무대
   · 질문 미끄럼틀: 큰 나무판에 질문 표지판과 미끄럼 레일, 고철장의 그 고철 모형이 미끄러져 통에 떨어진다
   · 캠페인: 무대 위 블록 친구들, 3컷 대본은 무대 위 세 장면으로 연기한다
   ========================================================= */
const SL3 = {W:12.4, Y0:6.7, DY:1.95, Z:-1.0};
function sl3Pos(path){ const d = path.length - 1; let idx = 0; for (const ch of path.slice(1)) idx = idx * 2 + (ch === 'n' ? 1 : 0); return {x:(idx + .5) * SL3.W / (1 << d) - SL3.W / 2, y:SL3.Y0 - d * SL3.DY, d}; }
const sl3W = d => [3.4, 2.9, 2.4, 1.7][d] || 1.6;
function mkSlideRoom3(b){
  mkRoom3(b, {w:18, d:2.2, h:9, sideD:1.6, wallCol:'#e8edf2'});
  BX(b, -6.8, 0, -1.62, 6.8, 8.6, -1.36, '#c89b5e');
  BX(b, -6.95, 0, -1.65, -6.8, 8.75, -1.3, '#8a6a48'); BX(b, 6.8, 0, -1.65, 6.95, 8.75, -1.3, '#8a6a48'); BX(b, -6.95, 8.6, -1.65, 6.95, 8.75, -1.3, '#8a6a48');
  BX(b, -.62, 8.05, -1.36, .62, 8.6, -.62, '#4a5563'); BX(b, -.48, 8.05, -1.3, .48, 8.1, -.7, '#2b323b');
}
function sl3Scene(ctx){
  return {cam:{x:0, y:4.3, z:-.8, w:13.8, h:8.8, pitch:.1},
    draw(t, dt){
      D3('slideRoom', mkSlideRoom3);
      const nodes = slNodes(ctx.T), rY = M3('railY', b => BX(b, 0, -.07, -.07, 1, .07, .07, '#2f8f5b')), rN = M3('railN', b => BX(b, 0, -.07, -.07, 1, .07, .07, '#c4473b'));
      for (const {n, path} of nodes) if (n.t === 'q'){
        const p = sl3Pos(path);
        for (const c of ['y', 'n']){ const q = sl3Pos(path + c), x0 = p.x, y0 = p.y - .36, x1 = q.x, y1 = q.y + .4, len = Math.hypot(x1 - x0, y1 - y0); drawM(c === 'y' ? rY : rN, mMul(S3(x0, y0, SL3.Z + .1), mRZ(Math.atan2(y1 - y0, x1 - x0)), mSC(len, 1, 1))); }
      }
      for (const {n, path} of nodes){
        const p = sl3Pos(path);
        if (n.t === 'q'){ const w = sl3W(p.d), col = n.q ? SL_KEYCOL[QUESTIONS[n.q].key] : '#3b5068'; drawM(M3('sign' + p.d + col, b => { BX(b, -w / 2, -.36, 0, w / 2, .36, .16, col); BX(b, -w / 2 + .06, -.3, .16, w / 2 - .06, .3, .18, hexShade(col, .12)); }), S3(p.x, p.y, SL3.Z)); }
        else {
          const col = n.a ? SL_ACT[n.a].c : '#5b6573';
          drawM(M3('bucket' + col, b => { BX(b, -.86, -.45, -.4, .86, -.37, .4, col); BX(b, -.86, -.45, -.4, .86, .32, -.32, col); BX(b, -.86, -.45, .32, .86, .02, .4, col); BX(b, -.86, -.45, -.4, -.78, .32, .4, col); BX(b, .78, -.45, -.4, .86, .32, .4, col); }), S3(p.x, p.y, SL3.Z + .2));
          const rs = (ctx.results || {})[path] || [];
          rs.forEach((r, i) => drawM(model('it:' + r.it.id, () => mkItem3(r.it)), S3(p.x - (rs.length - 1) * .2 + i * .4, p.y - .37, SL3.Z + .22, 0, .4)));
        }
      }
      if (ctx.item){ const it = ctx.item; drawM(model('it:' + it.it.id, () => mkItem3(it.it)), S3(it.x, it.y - .25 + (ctx.predicting ? Math.sin(TIME * 6) * .06 : 0), SL3.Z + .55, ctx.predicting ? TIME * 2 : 0, .58)); }
      /* 통 위 꼬마 전자석: 결정대로 집어 본다 (집힘 · 안 붙음 · 떨어뜨림 · 낭비) */
      const cf = ctx.craneFx;
      if (cf){
        cf.t += (dt || 0); const k = Math.min(1, cf.t / cf.d), p = sl3Pos(cf.leaf), z = SL3.Z + .25;
        if (cf.act !== 'skip'){
          const my = p.y + 1.75 - Math.sin(k * Math.PI) * 1.25;
          bar3('slc', '#2b323b', p.x, p.y + 2.2, p.x, my + .22, z, .02);
          drawM(model('mag3on', () => mkMagnet3(true)), S3(p.x, my, z, 0, .55));
          const lift = cf.kind === 'ok' || cf.kind === 'waste' || (cf.kind === 'drop' && k < .78);
          if (k > .5 && lift) drawM(model('it:' + cf.it.id, () => mkItem3(cf.it)), S3(p.x, my - .3, z, 0, .45));
          if (cf.kind === 'waste' && k > .55 && !cf.sm){ cf.sm = 1; fxBurst(p.x, my + .3, z, 14, ['#777777', '#aaaaaa', '#ff9a3a'], 1.2, .07); }
          if (cf.kind === 'drop' && k >= .78 && !cf.sm){ cf.sm = 1; SFX.clatter(); fxShake(.14); }
        } else if (cf.kind === 'miss' && Math.sin(TIME * 20) > 0) spr3(p.x, p.y + 1.5, z, '🚨', .3);
        if (k >= 1) ctx.craneFx = null;
      }
    },
    overlay(){
      tag3(0, 8.85, SL3.Z, '🚚 고철 투입구', {size:12});
      const nodes = slNodes(ctx.T);
      for (const {n, path} of nodes) if (n.t === 'q') for (const [c, lab, col] of [['y', '예', '#8ff0b9'], ['n', '아니요', '#ffaaa1']]){ const p = sl3Pos(path), q = sl3Pos(path + c); tag3((p.x + q.x) / 2, (p.y + q.y) / 2, SL3.Z + .2, lab, {col, size:12, border:col}); }
      for (const {n, path} of nodes){
        const p = sl3Pos(path), sel = ctx.sel === path;
        if (n.t === 'q'){
          const Qd = n.q && QUESTIONS[n.q];
          tag3(p.x, p.y, SL3.Z + .2, Qd ? `${ATTR[Qd.key] ? ATTR[Qd.key].icon : '❓'} ${Qd.text}` : '❓ 질문을 골라요', {bg:sel ? 'rgba(255,210,63,.95)' : 'rgba(0,0,0,0)', col:sel ? '#1c2733' : Qd ? '#fff' : '#ffd23f', size:p.d ? 13 : 15});
          if (ctx.ans && ctx.ans.path === path) tag3(p.x + sl3W(p.d) / 2 + .55, p.y + .4, SL3.Z + .2, ctx.ans.yes ? '예!' : '아니요!', {bg:ctx.ans.yes ? '#25a862' : '#e5483a', size:14});
        } else {
          tag3(p.x, p.y + .6, SL3.Z + .3, n.a ? (ctx.s1 && n.a === 'weak' ? '🧲 집기' : n.a === 'skip' ? '🚫 안 집기' : SL_ACT[n.a].t) : '결정을 골라요', {bg:sel ? 'rgba(255,210,63,.95)' : 'rgba(21,32,43,.85)', col:sel ? '#1c2733' : n.a ? '#fff' : '#ffd23f', size:12});
          const rs = (ctx.results || {})[path] || [];
          rs.forEach((r, i) => mark3(p.x - (rs.length - 1) * .2 + i * .4, p.y + .15, SL3.Z + .3, r.ok));
        }
      }
      if (ctx.item) tag3(ctx.item.x, ctx.item.y + .55, SL3.Z + .6, ctx.item.it.name, {size:12});
      if (ctx.predicting){
        tag3(1.9, 8.3, SL3.Z + .6, `🔮 어느 통? ⏱ ${Math.max(0, ctx.predT).toFixed(1)}초`, {bg:'#ffd23f', col:'#1c2733', size:14});
        sl3Leaves(ctx).forEach((l, i) => tag3(l.x, l.y - .75, SL3.Z + .4, ctx.guess === l.path ? '👆 내 예측' : `${i + 1}`, {bg:ctx.guess === l.path ? '#25a862' : 'rgba(21,32,43,.9)', border:'#ffd23f', size:13}));
      }
    }};
}
function sl3Leaves(ctx){ return slNodes(ctx.T).filter(o => o.n.t === 'a').map(({path}) => { const p = sl3Pos(path); return {path, x:p.x, y:p.y, z:SL3.Z + .2, r:.95}; }).sort((a, b) => a.x - b.x); }
function sl3Guess(api, ctx, sx, sy, idx){
  if (!ctx.predicting) return false;
  const L = sl3Leaves(ctx), hit = idx != null ? L[idx] : api.pick(L, sx, sy);
  if (hit){ ctx.guess = hit.path; ctx.predT = Math.min(ctx.predT, .3); SFX.ping(); }
  return true;
}
const sl3Stat = ctx => ctx.pTotal ? `🔮 예측 ${ctx.pHit || 0}/${ctx.pTotal} · ⭐ ${ctx.pScore || 0}${ctx.pCombo >= 2 ? ` · 🔥 x${ctx.pCombo}` : ''}` : '';
function sl3Nodes(ctx){ return slNodes(ctx.T).map(({n, path}) => { const p = sl3Pos(path); return {path, x:p.x, y:p.y, z:SL3.Z + .2, r:n.t === 'q' ? sl3W(p.d) / 2 : .9}; }); }
function sl3Build(api, st){
  const s1 = st === 0, items = s1 ? SL_S1_ITEMS.map(id => TRAIN_ITEMS.find(i => i.id === id)) : TRAIN_ITEMS;
  const ctx = {d3:true, s1, T:s1 ? (SAVE.mgTree1 && slValid(SAVE.mgTree1) && slDepth(SAVE.mgTree1) === 1 ? slClone(SAVE.mgTree1) : slBlank()) : slLoad2(), sel:null, results:{}, rolling:false, tries:0, item:null, ans:null, fast:false};
  api.scene(sl3Scene(ctx));
  api.say(s1 ? '맨 위 <b>질문 표지판</b>을 눌러 질문을 고르고, 아래 두 <b>통</b>을 눌러 ‘집기’나 ‘안 집기’를 정해요. 다 정하면 ▶ 굴려 보기!'
    : '연습 고철 8개를 알맞게 처리하는 질문 길을 만들어요. 통을 눌러 <b>‘질문 하나 더 하기’</b>로 길을 늘릴 수 있어요. 질문은 적을수록 좋아요!');
  const bot = api.bot(`<span class="mg-chip" id="slQ"></span><button class="btn primary big" id="slGo">▶ 굴려 보기</button><button class="btn" id="slFast">빠르게</button>`);
  const upd = () => { const q = $('#slQ'); if (q) q.textContent = `질문 ${treeSize(ctx.T)}개 · 굴린 횟수 ${ctx.tries}번`; };
  bot.querySelector('#slFast').onclick = e => { ctx.fast = !ctx.fast; e.currentTarget.classList.toggle('on', ctx.fast); };
  bot.querySelector('#slGo').onclick = () => {
    if (ctx.rolling || MG.ended) return;
    if (!slValid(ctx.T)) return api.say('아직 정하지 않은 칸(❓ 질문을 골라요 · 결정을 골라요)이 있어요. 모두 정한 뒤 굴려요.', 'bad');
    ctx.tries++; upd(); if (s1) SAVE.mgTree1 = slClone(ctx.T); else SAVE.mgTreeDraft = slClone(ctx.T); persist();
    slRoll(api, ctx, mgShuffle(items), res => {
      const ok = res.filter(r => r.out.ok).length, n = res.length, size = treeSize(ctx.T);
      if (s1 && ok === n) return api.end(ctx.tries === 1 ? 3 : ctx.tries === 2 ? 2 : 1, `고철 ${n}개를 모두 알맞게 처리했어요! (굴린 횟수 ${ctx.tries}번)`, resultTable(res));
      if (!s1 && ok >= 7){
        SAVE.mgTree = slClone(ctx.T); if (!SAVE.tree || !treeComplete(SAVE.tree)) SAVE.tree = slClone(ctx.T); persist();
        return api.end(ok === 8 && size <= 2 ? 3 : ok === 8 ? 2 : 1, `연습 고철 ${n}개 중 <b>${ok}개</b>를 알맞게 처리했어요. 질문 ${size}개.${ok === 8 && size > 2 ? ' 질문을 2개로 줄여도 모두 맞힐 수 있을까요?' : ok < 8 ? ' 틀린 고철까지 맞히면 번개가 늘어요.' : ''}`, resultTable(res));
      }
      api.say(`${n}개 중 ${ok}개를 알맞게 처리했어요. <b>✗</b>가 붙은 고철을 보고 질문이나 결정을 고쳐 다시 굴려요.`, 'bad');
    });
  };
  api.keys(e => { const m = e.code.match(/^(?:Digit|Numpad)([1-9])$/); if (m) sl3Guess(api, ctx, 0, 0, +m[1] - 1); });
  api.pointer({down:(sx, sy) => {
    if (MG.ended) return;
    if (ctx.rolling){ sl3Guess(api, ctx, sx, sy); return; }
    const hit = api.pick(sl3Nodes(ctx), sx, sy);
    if (ctx.sel){ api.pop(); ctx.sel = null; if (!hit) return; }
    if (!hit) return;
    ctx.results = {}; slEditPop(api, ctx, hit.path, upd);
  }});
  api.loop(dt => { if (ctx.rolling && ctx.step) ctx.step(dt); api.stat(sl3Stat(ctx)); });
  upd();
}
function sl3Test(api){
  const T = [SAVE.mgTree, SAVE.tree].find(t => t && slValid(t) && slDepth(t) <= 3);
  if (!T) return api.end(0, '먼저 2단계에서 질문 길을 완성해요.');
  const ctx = {d3:true, s1:false, T:slClone(T), sel:null, results:{}, rolling:false, item:null, ans:null, fast:false};
  api.scene(sl3Scene(ctx));
  api.say('2단계에서 만든 질문 길이에요. 처음 보는 <b>새 고철 8개</b>를 몇 개나 알맞게 처리할지 먼저 예상해요.');
  const bot = api.bot(`<span class="mg-chip">내 예상</span>${[...Array(9).keys()].map(n => `<button class="btn small" data-p="${n}">${n}개</button>`).join('')}`);
  bot.querySelectorAll('[data-p]').forEach(b => b.onclick = () => {
    if (ctx.rolling || MG.ended) return;
    SLIDE.pred = +b.dataset.p; SND.tick();
    api.bot(`<span class="mg-chip">내 예상 ${SLIDE.pred}개</span><button class="btn" id="slFast">빠르게</button>`);
    $('#slFast').onclick = e => { ctx.fast = !ctx.fast; e.currentTarget.classList.toggle('on', ctx.fast); };
    api.say('새 고철 트럭이 도착했어요! 질문 길을 따라 미끄러져요.');
    slRoll(api, ctx, TEST_ITEMS.slice(), res => {
      const ok = res.filter(r => r.out.ok).length, acc = ok / res.length;
      SAVE.treeRuns.push({kind:'test', acc, pred:SLIDE.pred, size:treeSize(ctx.T), time:Date.now()});
      let badge = '';
      if (ok >= 7 && !SAVE.badges.em3){ SAVE.badges.em3 = true; badge = '<div class="okbox"><b>AI 크레인 두뇌 미션 성공!</b> 처음 보는 고철도 알맞게 처리했어요.</div>'; }
      persist(); SLIDE.tree = slClone(ctx.T);
      api.end(ok >= 8 ? 3 : ok >= 7 ? 2 : ok >= 6 ? 1 : 0, `새 고철 8개 중 <b>${ok}개</b>를 알맞게 처리했어요. 내 예상은 ${SLIDE.pred}개였어요.`,
        badge + resultTable(res) + `<div class="row" style="justify-content:center;margin-top:10px"><button class="btn volt" id="sl3D">🏗️ 3D 고철장에서 크레인으로 보기</button><button class="btn" id="slFix">✏️ 질문 길 고치기 (2단계)</button></div>`);
    });
  });
  api.keys(e => { const m = e.code.match(/^(?:Digit|Numpad)([1-9])$/); if (m) sl3Guess(api, ctx, 0, 0, +m[1] - 1); });
  api.pointer({down:(sx, sy) => { if (!MG.ended && ctx.rolling) sl3Guess(api, ctx, sx, sy); }});
  api.loop(dt => { if (ctx.rolling && ctx.step) ctx.step(dt); api.stat(sl3Stat(ctx)); });
}
mg3Attach('slide', [() => sl3Scene({T:SAVE.mgTree1 && slValid(SAVE.mgTree1) ? slClone(SAVE.mgTree1) : slBlank(), s1:true}), () => sl3Scene({T:slLoad2()}),
  () => sl3Scene({T:slClone([SAVE.mgTree, SAVE.tree].find(t => t && slValid(t) && slDepth(t) <= 3) || slBlank())})], [api => sl3Build(api, 0), api => sl3Build(api, 1), sl3Test]);

/* ===== 📣 전기 안전 캠페인: 블록 무대 ===== */
function mkStage3(b){
  mkRoom3(b, {w:18, d:5, h:5.4, wallCol:'#4a3a52', base:false, sideD:0});
  BX(b, -8, 0, -5, 8, 5.4, -4.9, '#9b2335'); for (let x = -7.8; x < 8; x += .8) BX(b, x, 0, -4.9, x + .18, 5.4, -4.86, '#7f1c2b');
  BX(b, -7.2, 0, -4.86, 7.2, .6, .5, '#b07a45'); BX(b, -7.2, 0, .5, 7.2, .6, .56, '#8a5a2b'); BX(b, -7.25, .6, .44, 7.25, .66, .6, '#c89b5e');
  BX(b, -8.4, 0, -4.86, -6.8, 5.4, -.4, '#b8283f'); BX(b, 6.8, 0, -4.86, 8.4, 5.4, -.4, '#b8283f');
  BX(b, -3.6, 4.2, -4.86, 3.6, 4.95, -4.8, '#ffd23f'); BX(b, -3.7, 4.12, -4.86, 3.7, 4.2, -4.78, '#b88426');
  for (const x of [-5, 0, 5]){ BX(b, x - .3, 5.15, -3, x + .3, 5.4, -2.4, '#2b323b'); BX(b, x - .22, 5.1, -2.92, x + .22, 5.15, -2.48, '#fff6d8', 3); }
}
const CP3_LOOK = ['kidSun', 'kidMoon'];
function cp3Backdrop(){
  return {cam:{x:0, y:1.6, z:-2.4, w:12, h:6, pitch:.24, sy:-.26},
    draw(){ D3('stage3', mkStage3); mkPersonAt('kidSun', -1.3, -2.2, .2); mkPersonAt('kidMoon', 1.3, -2.2, -.2); },
    overlay(){ tag3(0, 4.57, -4.8, '📣 전기 안전 캠페인', {bg:'rgba(0,0,0,0)', col:'#1c2733', size:18}); },
    lights(add){ add(0, 4.4, -1.5, 12, [1, .95, .85]); }};
}
/* 3컷 대본을 무대 위 세 장면으로: 1컷 위험한 행동(하늘) · 2컷 말리는 말(바다) · 3컷 바른 행동(하늘) */
function cp3ComicScene(P, lines){
  const SETS = [-4.5, 0, 4.5];
  return {cam:{x:0, y:2.2, z:-2.4, w:14.2, h:5, pitch:.16},
    draw(){
      D3('stage3', mkStage3);
      SETS.forEach((x, i) => {
        drawM(M3('cut' + P.id, b => { BX(b, -2.05, .6, -4.3, 2.05, 3.8, -4.2, P.bg); BX(b, -2.15, .6, -4.32, -2.05, 3.9, -4.15, '#1c2733'); BX(b, 2.05, .6, -4.32, 2.15, 3.9, -4.15, '#1c2733'); BX(b, -2.15, 3.8, -4.32, 2.15, 3.9, -4.15, '#1c2733'); }), S3(x, 0, 0));
        person3(CP3_LOOK[0], ST.x + x - 1.0, ST.y + .6, ST.z - 2.7, .45, 0); person3(CP3_LOOK[1], ST.x + x + 1.0, ST.y + .6, ST.z - 2.7, -.45, 0);
        SH3(x - 1, -2.7, .38, .6); SH3(x + 1, -2.7, .38, .6);
        spr3(x, 1.25, -3.6, P.props[i], .4);
      });
    },
    overlay(){
      tag3(0, 4.57, -4.8, `📣 ${P.title}`, {bg:'rgba(0,0,0,0)', col:'#1c2733', size:18});
      SETS.forEach((x, i) => {
        tag3(x - 1.75, 3.55, -4.1, String(i + 1), {bg:'#1c2733', size:14});
        tag3(x - 1.0, .45, -2.4, '하늘', {size:11}); tag3(x + 1.0, .45, -2.4, '바다', {size:11});
        const spk = i === 1 ? x + 1.0 : x - 1.0, p = P3(spk, 2.75, -2.7), l = P3(x - 2, 2.75, -2.7), r = P3(x + 2, 2.75, -2.7);
        if (p.ok && l.ok && r.ok) mg3Bubble(p.x, p.y, lines[i] || '', {cx:(l.x + r.x) / 2, maxW:Math.max(90, (r.x - l.x) * .8 - 24), size:CW < 700 ? 11 : 14});
      });
    },
    lights(add){ add(-4.5, 4, -1.6, 11, [1, .96, .88]); add(4.5, 4, -1.6, 11, [1, .96, .88]); }};
}
mg3Attach('campaign', [cp3Backdrop, cp3Backdrop], [null, null]);
