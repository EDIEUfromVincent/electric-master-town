#!/usr/bin/env node
// ============================================================
//  과학 내용 검사 — npm run lint:content
//  · 게임 소스(전기마스터타운/src)와 정리 회의 대본(lessons/L*.json)에서 과학 설명이 서로 맞는지 본다
//  · 오류(✗)가 있으면 실패, 주의(△)는 알려만 준다
//  · 검사 항목을 바꿀 때는 docs/science-review.md도 함께 고친다
// ============================================================
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, '전기마스터타운', 'src');
const errors = [], warns = [];
const read = f => fs.readFileSync(f, 'utf8');
const srcFiles = fs.readdirSync(SRC).filter(f => f.endsWith('.js')).map(f => path.join(SRC, f));
const lessonFiles = fs.readdirSync(path.join(ROOT, 'lessons')).filter(f => /^L\d+\.json$/.test(f)).map(f => path.join(ROOT, 'lessons', f));

/* 소스 안의 배열 상수를 꺼내 값으로 읽는다 (순수한 객체 배열만) */
function arrayConst(name){
  for (const f of srcFiles){
    const s = read(f), i = s.indexOf(`const ${name} = [`); if (i < 0) continue;
    let d = 0, j = s.indexOf('[', i);
    for (let k = j; k < s.length; k++){ const c = s[k]; if (c === '[') d++; else if (c === ']'){ d--; if (!d) return { file: path.basename(f), value: new Function('return ' + s.slice(j, k + 1))() }; } }
  }
  return null;
}

/* 1. MRI: 검사할 때마다 켜고 끈다는 설명이 남아 있지 않다 (초전도 MRI는 늘 켜져 있다) */
const MRI_BAD = [/검사할 때만 켜/, /켜고 끈다/, /켜고 끈대/, /전자석은 켜고 끌 수 있지/, /영구 자석으로는 이렇게 못/];
for (const f of srcFiles.concat(lessonFiles)){
  read(f).split('\n').forEach((line, n) => { for (const re of MRI_BAD) if (re.test(line)) errors.push(`${path.relative(ROOT, f)}:${n + 1} MRI 설명에 "${line.match(re)[0]}"가 남아 있어요`); });
}

/* 2. 도감 기기: 설명에 '극'이 나오면 성질에 극의 방향(pole)이 있어야 한다 */
const DEV = arrayConst('DEVICES');
if (!DEV) errors.push('DEVICES를 찾지 못했어요');
else for (const d of DEV.value){
  if (/극/.test(d.desc) && !(d.props || []).includes('pole')) warns.push(`DEVICES.${d.id}: 설명에 '극'이 있는데 props에 pole이 없어요`);
  if (!(d.props || []).length) errors.push(`DEVICES.${d.id}: props가 비어 있어요`);
}

/* 3. 스피커: 어느 화면에서나 같은 설명 (영구 자석 + 코일, 세기와 방향) */
const speakerTexts = [];
if (DEV) { const s = DEV.value.find(d => d.id === 'speaker'); if (s){ speakerTexts.push(['DEVICES.speaker', s.desc]); if (!s.props.includes('pole') || !s.props.includes('power')) errors.push('DEVICES.speaker: props는 power와 pole 둘 다'); } }
const CS = arrayConst('CLASS_SPOTS'), C3 = arrayConst('CLASS3'), SHOP = arrayConst('SHOP_ITEMS');
if (CS) { const s = CS.value.find(x => x.name === '스피커'); if (s) speakerTexts.push(['CLASS_SPOTS 스피커 (2D 교실)', s.why]); }
if (C3) { const s = C3.value.find(x => x.id === 'spk'); if (s) speakerTexts.push(['CLASS3 스피커 (3D 교실)', s.why]); }
if (SHOP) { const s = SHOP.value.find(x => x.id === 'speaker'); if (s) speakerTexts.push(['SHOP_ITEMS 스피커 단서', s.clues.join(' ')]); }
for (const [where, t] of speakerTexts) if (!/코일/.test(t) || !/방향/.test(t)) errors.push(`${where}: 스피커 설명에 '코일'과 '방향'이 있어야 해요 → "${t}"`);
if (DEV){ const fan = DEV.value.find(d => d.id === 'fan'); if (fan && !fan.props.includes('pole')) errors.push('DEVICES.fan: 설명대로 props에 pole도 있어야 해요'); }

/* 4. 교실 찾기: 오답 물건이 모두 '전기와 무관한 물건'뿐이면 경계 판단이 없다 (P1에서 kind·why를 넣는다) */
for (const [label, arr] of [['CLASS_SPOTS (2D)', CS], ['CLASS3 (3D)', C3]]){
  if (!arr) { errors.push(`${label}를 찾지 못했어요`); continue; }
  const withKind = arr.value.filter(x => x.kind);
  if (!withKind.length) warns.push(`${label}: 아직 kind(전자석/열/빛/영구 자석/전기 없음)가 없어요 — P1에서 경계 사례와 함께 넣어요`);
  else arr.value.forEach(x => { if (!x.kind || !x.why) errors.push(`${label} ${x.name}: kind와 why가 모두 있어야 해요`); });
}

/* 4-2. 판단 카드 경계 사례: kind·why가 있고, DEVICES와 id가 겹치지 않는다 (겹치면 a2 완료 판정이 흔들린다) */
const BI = arrayConst('BOUNDARY_ITEMS');
if (!BI) warns.push('BOUNDARY_ITEMS가 아직 없어요');
else for (const b of BI.value){
  if (!b.kind || !b.why) errors.push(`BOUNDARY_ITEMS.${b.id}: kind와 why가 모두 있어야 해요`);
  if (b.kind === 'em' && !(b.props || []).length) errors.push(`BOUNDARY_ITEMS.${b.id}: 전자석이 있으면 props가 있어야 해요`);
  if (b.kind !== 'em' && (b.props || []).length) errors.push(`BOUNDARY_ITEMS.${b.id}: 전자석이 없으면 props는 비워요`);
  if (DEV && DEV.value.some(d => d.id === b.id)) errors.push(`BOUNDARY_ITEMS.${b.id}: DEVICES와 id가 겹쳐요`);
}

/* 5. 배기가스: 전기차는 '달릴 때' 배기가스가 없다 */
for (const f of srcFiles) read(f).split('\n').forEach((line, n) => { if (/배기가스(도|가)? 나오지 않/.test(line) && !/달릴 때/.test(line)) errors.push(`${path.relative(ROOT, f)}:${n + 1} 배기가스 문장에 '달릴 때'가 빠졌어요`); });

/* 6. 판단 기준 (P2): 전이 질문 X2는 근거가 있는 답을 2개 이상 인정하고, X1에는 정답이 하나 있어야 한다 */
function objectConst(name){
  for (const f of srcFiles){
    const s = read(f), i = s.indexOf(`const ${name} = {`); if (i < 0) continue;
    let d = 0, j = s.indexOf('{', i);
    for (let k = j; k < s.length; k++){ const c = s[k]; if (c === '{') d++; else if (c === '}'){ d--; if (!d) return { file: path.basename(f), value: new Function('return ' + s.slice(j, k + 1))() }; } }
  }
  return null;
}
const X1 = objectConst('BLACKOUT_Q1'), X2 = objectConst('BLACKOUT_Q2');
if (!X1 || !X2) warns.push('크레인 정전 질문(BLACKOUT_Q1·Q2)이 아직 없어요');
else {
  if (X1.value.opts.filter(o => o.ok === 'ok').length !== 1) errors.push('BLACKOUT_Q1: 정답(ok)은 하나여야 해요');
  if (X2.value.opts.filter(o => o.ok === 'ok').length < 2) errors.push('BLACKOUT_Q2: 근거가 있는 답(ok)을 2개 이상 인정해야 해요 (지시서 5-3)');
  for (const o of X1.value.opts.concat(X2.value.opts)){
    if (!o.tag || !/^[a-z-]+$/.test(o.tag)) errors.push(`정전 질문 "${o.t}": 기록용 tag(영어 소문자)가 있어야 해요`);
    if (o.ok === 'part' && !(o.follow && o.follow.opts && o.follow.opts.some(x => x.ok === 'ok'))) errors.push(`정전 질문 "${o.t}": 되묻기(part)에는 이어지는 질문과 정답이 있어야 해요`);
  }
}
/* 6-2. 시장의 후속 질문 (P3): 근거가 있는 답 2개 이상 인정, 발전소 = 전기의 출처로 다룬다 (석탄을 전기와 같은 층위의 '대안'으로 내지 않는다) */
const EVS = objectConst('EV_SOURCE_Q');
if (!EVS) warns.push('시장의 후속 질문(EV_SOURCE_Q)이 아직 없어요');
else {
  if (EVS.value.opts.filter(o => o.ok === 'ok').length < 2) errors.push('EV_SOURCE_Q: 근거가 있는 답(ok)을 2개 이상 인정해야 해요 (지시서 6장)');
  if (!/발전소/.test(EVS.value.q) || !/어디서/.test(EVS.value.q)) errors.push("EV_SOURCE_Q: 질문은 '전기는 어디서 오나(발전소)'를 묻는 형태여야 해요");
  for (const o of EVS.value.opts){
    if (!o.tag || !/^[a-z-]+$/.test(o.tag)) errors.push(`EV_SOURCE_Q "${o.t}": 기록용 tag(영어 소문자)가 있어야 해요`);
    if (!o.r) errors.push(`EV_SOURCE_Q "${o.t}": 시장의 반응(r)이 있어야 해요`);
  }
}
/* 7. a11 스마트 기기 설계실 (P4): 카드마다 장면 8개, 기대 행동은 고를 수 있는 행동, 모범 설계가 8개 모두 맞힘,
      센서 값 '?' 장면이 하나 이상(안전한 쪽 설계), 감지 카드마다 질문이 있음, 용어는 '빠르기'·'방향' ('속도'는 교사 확인 전까지 쓰지 않음) */
const DC = arrayConst('DESIGN_CARDS'), DSX = objectConst('DS_EXT');
if (!DC) warns.push('DESIGN_CARDS가 아직 없어요');
else {
  const PK = ['onoff', 'power', 'pole'], ACTS_OK = ['off', 'weak', 'strong', 'flip'];
  const trace = (card, n, read) => { while (n && n.t === 'q'){ const q = card.questions.find(x => x.id === n.q); if (!q) return null; n = q.f(read) ? n.yes : n.no; } return n ? n.a : null; };
  for (const c of DC.value){
    const at = `DESIGN_CARDS.${c.id}`;
    if (!Array.isArray(c.scenarios) || c.scenarios.length !== 8) errors.push(`${at}: 처음 보는 장면은 8개여야 해요`);
    if (!(c.needProps || []).length || c.needProps.some(k => !PK.includes(k))) errors.push(`${at}: needProps는 onoff·power·pole 중에서 하나 이상`);
    if ((c.actions || []).some(a => !ACTS_OK.includes(a))) errors.push(`${at}: 행동은 off·weak·strong·flip 중에서`);
    for (const k of PK) if (!c.propWhy || !c.propWhy[k]) errors.push(`${at}: propWhy.${k}(성질마다 피드백)가 있어야 해요`);
    for (const q of c.questions) if (!c.sensors.includes(q.s)) errors.push(`${at}: 질문 ${q.id}의 감지 카드 ${q.s}가 sensors에 없어요`);
    for (const s of c.sensors) if (!c.questions.some(q => q.s === s)) errors.push(`${at}: 감지 카드 ${s}로 물을 질문이 없어요`);
    for (const sc of c.scenarios || []) if (!c.actions.includes(sc.expect)) errors.push(`${at} "${sc.desc}": 기대 행동 ${sc.expect}을 고를 수 없어요`);
    if (!(c.scenarios || []).some(sc => Object.values(sc.read).includes('?'))) warns.push(`${at}: 센서 값이 '?'인 장면이 없어요 (모를 때 안전한 쪽 설계)`);
    const ok = (c.scenarios || []).filter(sc => trace(c, c.best, sc.read) === sc.expect).length;
    if (ok !== 8) errors.push(`${at}: 모범 설계(best)가 ${ok}/8만 맞혀요 — 장면이나 질문을 고쳐요`);
    const bestSensors = new Set(); (function walk(n){ if (n && n.t === 'q'){ bestSensors.add(c.questions.find(q => q.id === n.q).s); walk(n.yes); walk(n.no); } })(c.best);
    if (bestSensors.size > c.maxSensors) errors.push(`${at}: 모범 설계에 감지 카드가 ${bestSensors.size}장 필요해서 maxSensors(${c.maxSensors})를 넘어요`);
    if (/속도/.test(JSON.stringify(c))) warns.push(`${at}: '속도'라는 말이 있어요 ('빠르기'·'방향'을 쓰기로 함)`);
  }
}
if (DSX){
  for (const [k, E] of Object.entries(DSX.value)) if (E.opts.filter(o => o.ok === 'ok').length < 1) errors.push(`DS_EXT.${k}: 정답이 있어야 해요`);
  if (/속도/.test(JSON.stringify(DSX.value))) warns.push("DS_EXT: '속도'라는 말이 있어요");
}

const GEN = srcFiles.map(read).join('\n').match(/const CONCEPT_GEN = '([^']+)'/);
if (!GEN) warns.push('개념적 일반화(CONCEPT_GEN)가 아직 없어요');
else if (!/조절/.test(GEN[1]) || !/전기/.test(GEN[1])) errors.push("CONCEPT_GEN: '조절'과 '전기'(대가)가 들어 있어야 해요");
else if (!read(path.join(SRC, 'ui.js')).includes(GEN[1])) errors.push('CONCEPT_GEN: 교사용 안내(ui.js)의 일반화 문장과 같아야 해요');

warns.forEach(w => console.log('△ ' + w));
errors.forEach(e => console.log('✗ ' + e));
console.log(errors.length ? `\n과학 내용 검사: 오류 ${errors.length}개` : `✓ 과학 내용 검사 통과 (주의 ${warns.length}개)`);
process.exit(errors.length ? 1 : 0);
