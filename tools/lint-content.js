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

warns.forEach(w => console.log('△ ' + w));
errors.forEach(e => console.log('✗ ' + e));
console.log(errors.length ? `\n과학 내용 검사: 오류 ${errors.length}개` : `✓ 과학 내용 검사 통과 (주의 ${warns.length}개)`);
process.exit(errors.length ? 1 : 0);
