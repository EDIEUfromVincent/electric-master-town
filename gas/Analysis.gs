// ============================================================
//  전기 마스터 타운 — 교사용 사후 분석  (Analysis.gs)
//  ------------------------------------------------------------
//  ■ GameBridge.gs와 같은 프로젝트에 넣습니다. 차시 ID는 L1 · L2 · L3 입니다.
//  ■ 학생이 게임하는 동안에는 실행되지 않습니다. 교사가 수업 후 메뉴로 실행합니다.
//    → Gemini를 쓰는 주체는 '교사'이며, 학생은 AI와 직접 대화하지 않습니다.
//  ■ GEMINI_API_KEYS는 반드시 '결제 계정(Cloud Billing)이 연결된' 프로젝트의 키를 쓰세요.
//    (무료 사용분은 입력 내용이 Google 제품 개선에 쓰일 수 있음)
//  ■ AI에게는 반코드·번호·플레이어키를 보내지 않습니다. 대화 내용만 보냅니다.
// ============================================================

const GB_AI = {
  KEY_PROPERTY: 'GEMINI_API_KEYS',
  MODEL: 'gemini-3.5-flash-lite',        // 기존 튜터 CONFIG.MODEL과 같은 값으로 맞추세요
  TEMPERATURE: 0.3,
  MAX_OUTPUT_TOKENS: 900,
  TIME_BUDGET_MS: 4.5 * 60 * 1000,       // Apps Script 6분 제한 안에서 끊고 이어 하기
  PAUSE_MS: 400,                         // 호출 사이 쉬는 시간 (분당 요청 한도 보호)
  STATE_PROPERTY: 'GB_ANALYSIS_LESSON'
};

// 차시 성찰표의 '강점/보완 후보' 자동 판정 기준 (교사가 바꿔도 됨)
const GB_REFLECT = {
  R_RATE_STRONG: 0.7,           // 교육적: R 도달률
  REFLECTION_RATE_STRONG: 0.7,  // 학습자: 성찰문장 작성률
  BLANK_RATE_MAX: 0.3,          // 학습자: 빈칸 문장으로 넘어간 비율 상한
  COMPLETE_RATE_STRONG: 0.9,    // 기술적: 완료율
  AGREEMENT_STRONG: 0.7,        // 평가: 규칙엔진-AI 단계 일치율
  DELIVERY_STRONG: 0.8,         // 평가: 승인된 피드백 전달률
  HINT3_RATE_MAX: 0.2,          // 실행: 힌트 3단계까지 간 학생 비율 상한
  INCOMPLETE_RATE_MAX: 0.1      // 실행: 미완료 비율 상한
};


// ============================================================
//  📋 메뉴 (시트를 열면 자동 생성)
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi().createMenu('🎮 게임 LAD')
    .addItem('🔑 비밀 문자열 만들기 (처음 한 번)', 'gbMenuMakeSecret')
    .addItem('① 연결 점검', 'gbMenuTestSetup')
    .addItem('② 차시 분석 실행 (AI 요약·피드백 초안)', 'gbMenuRunAnalysis')
    .addItem('③ 승인 체크박스 정리', 'gbMenuPrepareSummary')
    .addSeparator()
    .addItem('④ 차시 성찰표 만들기 (여섯 관점)', 'gbMenuBuildReflection')
    .addToUi();
}

// 처음 한 번: GAME_SHARED_SECRET을 만들어 저장하고, Railway에 넣을 수 있게 보여 줍니다
function gbMenuMakeSecret() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty(GB.SECRET_PROPERTY) || '';
  if (secret.length >= 20) {
    const again = ui.alert('비밀 문자열', '이미 만들어 둔 비밀 문자열이 있어요. 다시 보여 줄까요?\n(새로 만들면 Railway 값도 바꿔야 해요)', ui.ButtonSet.YES_NO);
    if (again !== ui.Button.YES) return;
  } else {
    secret = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 16);
    props.setProperty(GB.SECRET_PROPERTY, secret);
  }
  const html = HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;line-height:1.6">' +
    '<p>아래 글자를 모두 복사해서 <b>Railway → web 서비스 → Variables</b>의 <code>GAS_SHARED_SECRET</code> 값으로 넣으세요.</p>' +
    '<textarea readonly style="width:100%;height:70px;font-size:14px" onclick="this.select()">' + secret + '</textarea>' +
    '<p style="color:#a33">채팅·문서·시트 칸에는 붙여 넣지 마세요. 스크립트 속성과 Railway 두 곳에만 둡니다.</p></div>'
  ).setWidth(460).setHeight(240);
  ui.showModalDialog(html, '🔑 GAS_SHARED_SECRET');
}

function gbMenuTestSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();
  const secret = props.getProperty(GB.SECRET_PROPERTY) || '';
  const keys = gbAiKeys_();
  const lines = [];
  lines.push('시트: ' + ss.getName());
  [GB.SHEETS.LOG, GB.SHEETS.SUMMARY, GB.SHEETS.LESSONS].forEach(function (n) {
    const sh = ss.getSheetByName(n);
    lines.push((sh ? '✅ ' : '⬜ ') + n + (sh ? ' (' + Math.max(0, sh.getLastRow() - 1) + '행)' : ' (첫 기록 때 자동 생성)'));
  });
  lines.push((secret.length >= 20 ? '✅' : '❌') + ' GAME_SHARED_SECRET ' + (secret.length >= 20 ? '설정됨' : '없음 또는 20자 미만'));
  lines.push((props.getProperty(GB.ALERT_EMAIL_PROPERTY) ? '✅' : '⬜') + ' TEACHER_ALERT_EMAIL (선택)');
  lines.push((keys.length ? '✅' : '⬜') + ' GEMINI_API_KEYS ' + keys.length + '개 (정리 회의 AI 튜터 + 수업 후 분석. 없으면 규칙 엔진으로 진행)');
  if (keys.length) {
    const r = gbCallGemini_('연결 점검입니다. {"ok":true} 만 JSON으로 답하세요.', '점검', null);
    lines.push('Gemini 응답: ' + (r.ok ? '✅ 정상' : '❌ ' + r.error));
  }
  SpreadsheetApp.getUi().alert('연결 점검 결과', lines.join('\n'), SpreadsheetApp.getUi().ButtonSet.OK);
}

function gbMenuRunAnalysis() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt('차시 분석', '분석할 차시 ID를 입력하세요 (L1 · L2 · L3)', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const lesson = gbStr_(res.getResponseText(), 20);
  if (!lesson) return;
  PropertiesService.getScriptProperties().setProperty(GB_AI.STATE_PROPERTY, lesson);
  const done = gbAnalyzeLesson_(lesson);
  gbToast_(done ? lesson + ' 분석 완료' : lesson + ' 분석이 길어 1분 뒤 자동으로 이어서 합니다');
}

// 시간 트리거가 부르는 함수 (이어서 분석)
function gbContinueAnalysis() {
  gbDeleteTriggers_('gbContinueAnalysis');
  const lesson = PropertiesService.getScriptProperties().getProperty(GB_AI.STATE_PROPERTY);
  if (lesson) gbAnalyzeLesson_(lesson);
}

function gbMenuPrepareSummary() {
  const sh = gbSheet_(GB.SHEETS.SUMMARY, GB_SUMMARY_HEADERS);
  gbApplyCheckboxes_(sh);
  gbToast_('승인 열에 체크박스를 정리했습니다');
}

function gbMenuBuildReflection() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt('차시 성찰표', '성찰표를 만들 차시 ID를 입력하세요 (L1 · L2 · L3)', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const lesson = gbStr_(res.getResponseText(), 20);
  if (!lesson) return;
  gbBuildReflection_(lesson);
  gbToast_('차시성찰_' + lesson + ' 탭을 만들었습니다');
}


// ============================================================
//  ② 차시 분석 — 학생별 규칙 통계 + (키가 있으면) AI 요약·피드백 초안
//  반환값: true = 모두 끝남 / false = 시간 부족으로 이어서 할 예정
// ============================================================
function gbAnalyzeLesson_(lesson) {
  const started = Date.now();
  const groups = gbGroupEvents_(lesson);
  const meta = gbLessonMeta_(lesson);
  const keys = gbAiKeys_();

  const sh = gbSheet_(GB.SHEETS.SUMMARY, GB_SUMMARY_HEADERS);
  const C = gbColMap_(GB_SUMMARY_HEADERS);
  const index = gbSummaryIndex_(sh, C, lesson);

  const groupKeys = Object.keys(groups);
  for (let gi = 0; gi < groupKeys.length; gi++) {
    if (Date.now() - started > GB_AI.TIME_BUDGET_MS) {
      gbDeleteTriggers_('gbContinueAnalysis');
      ScriptApp.newTrigger('gbContinueAnalysis').timeBased().after(60 * 1000).create();
      return false;
    }
    const g = groups[groupKeys[gi]];
    const existing = index[groupKeys[gi]];
    const statusTag = '이벤트 ' + g.events.length;
    if (existing && String(existing.status).indexOf(statusTag) >= 0) continue;   // 새 기록 없음 → 건너뜀

    const stats = gbRuleStats_(g.events);
    let ai = null;
    let status;
    if (stats.flags.indexOf('위험') >= 0) {
      status = '교사직접확인(위험 신호, AI 미사용) · ' + statusTag;
    } else if (!keys.length) {
      status = '규칙분석만(키 없음) · ' + statusTag;
    } else {
      ai = gbAiAnalyze_(meta, g.events);
      status = (ai.ok ? '완료' : 'AI실패(' + ai.error + ')') + ' · ' + statusTag;
      Utilities.sleep(GB_AI.PAUSE_MS);
    }

    const left = [
      lesson, g.classCode, g.studentNo, g.playerKey,
      stats.ruleStage,
      ai && ai.ok ? ai.data.stage : '',
      ai && ai.ok ? (ai.data.stage === stats.ruleStage ? 'O' : 'X') : '',
      stats.turns.S, stats.turns.E, stats.turns.R, stats.maxHint,
      stats.flags.join(', '),
      stats.reflection,
      ai && ai.ok ? (ai.data.summary + (ai.data.evidence ? ' (근거: ' + ai.data.evidence + ')' : '')) : '',
      ai && ai.ok ? (ai.data.misconceptions || []).join(' / ') : '',
      ai && ai.ok ? ai.data.feedback : ''
    ].map(gbSafeCell_);
    const right = [new Date(), status];

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      if (existing) {
        // 교사 영역(교사수정피드백·승인·전달시각·학생반응)은 절대 덮어쓰지 않음
        sh.getRange(existing.row, 1, 1, left.length).setValues([left]);
        sh.getRange(existing.row, C['분석시각'], 1, right.length).setValues([right]);
      } else {
        const row = left.concat(['', false, '', '']).concat(right);
        sh.appendRow(row);
        const rowNo = sh.getLastRow();
        sh.getRange(rowNo, C['승인']).insertCheckboxes();
        index[groupKeys[gi]] = { row: rowNo, status: status };
      }
    } finally {
      lock.releaseLock();
    }
  }
  PropertiesService.getScriptProperties().deleteProperty(GB_AI.STATE_PROPERTY);
  return true;
}

// [게임로그]에서 해당 차시 이벤트를 학생별로 묶음
function gbGroupEvents_(lesson) {
  const sh = gbSheet_(GB.SHEETS.LOG, GB_LOG_HEADERS);
  const last = sh.getLastRow();
  const groups = {};
  if (last < 2) return groups;
  const C = gbColMap_(GB_LOG_HEADERS);
  const values = sh.getRange(2, 1, last - 1, GB_LOG_HEADERS.length).getValues();
  values.forEach(function (r) {
    if (String(r[C['차시'] - 1]) !== lesson) return;
    const classCode = String(r[C['반코드'] - 1]);
    const playerKey = String(r[C['플레이어키'] - 1]);
    const key = classCode + '|' + playerKey;
    if (!groups[key]) {
      groups[key] = { classCode: classCode, playerKey: playerKey, studentNo: r[C['번호'] - 1], events: [] };
    }
    groups[key].events.push({
      time: r[C['서버수신시각'] - 1],
      clientTime: String(r[C['클라이언트시각'] - 1]),
      npc: String(r[C['NPC'] - 1]),
      nodeId: String(r[C['노드ID'] - 1]),
      stage: String(r[C['단계'] - 1]),
      tag: String(r[C['태그'] - 1]),
      npcText: String(r[C['NPC발화'] - 1]),
      studentText: String(r[C['학생응답'] - 1]),
      result: String(r[C['판정'] - 1]),
      hintLevel: Number(r[C['힌트단계'] - 1]) || 0,
      flags: String(r[C['플래그'] - 1] || '').split(',').map(function (s) { return s.trim(); }).filter(String)
    });
  });
  return groups;
}

// 규칙 기반 통계 — 게임 엔진의 판정을 그대로 집계 (AI와 독립된 두 번째 평가자)
function gbRuleStats_(events) {
  const turns = { S: 0, E: 0, R: 0 };
  const flagSet = {};
  let maxHint = 0;
  let reached = { E: false, R: false };
  let reflection = '';
  let usedBlank = false;
  let completed = false;
  events.forEach(function (ev) {
    if (ev.studentText && turns.hasOwnProperty(ev.stage)) turns[ev.stage]++;
    if (ev.hintLevel > maxHint) maxHint = ev.hintLevel;
    ev.flags.forEach(function (f) { flagSet[f] = true; });
    const good = ev.result === 'correct' || ev.result === 'partial';
    if (good && ev.stage === 'E') reached.E = true;
    if (good && ev.stage === 'R') reached.R = true;
    if (ev.tag === 'reflection' && ev.studentText) reflection = ev.studentText;
    if (ev.tag === 'blank') {
      usedBlank = true;
      if (ev.studentText && !reflection) reflection = '(빈칸) ' + ev.studentText;
    }
    if (ev.tag === 'lesson-complete') completed = true;
  });
  return {
    turns: turns,
    maxHint: maxHint,
    flags: Object.keys(flagSet),
    ruleStage: reached.R ? 'R' : (reached.E ? 'E' : 'S'),
    reflection: reflection,
    usedBlank: usedBlank,
    completed: completed
  };
}

function gbLessonMeta_(lesson) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(GB.SHEETS.LESSONS);
  const fallback = {
    lessonId: lesson, title: '', standards: '', concepts: '',
    S: '목표 개념을 하나도 자기 말로 설명하지 못하거나 오개념이 있음',
    E: '목표 개념 일부를 자기 말로 바르게 설명함',
    R: '목표 개념을 모두 설명하고 생활·안전과 연결함'
  };
  if (!sh || sh.getLastRow() < 2) return fallback;
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, GB_LESSON_HEADERS.length).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === lesson) {
      return {
        lessonId: lesson, title: rows[i][1], standards: rows[i][2], concepts: rows[i][3],
        S: rows[i][4] || fallback.S, E: rows[i][5] || fallback.E, R: rows[i][6] || fallback.R
      };
    }
  }
  return fallback;
}

function gbSummaryIndex_(sh, C, lesson) {
  // 키: '반코드|플레이어키' (해당 차시 행만)
  const index = {};
  const last = sh.getLastRow();
  if (last < 2) return index;
  const values = sh.getRange(2, 1, last - 1, GB_SUMMARY_HEADERS.length).getValues();
  values.forEach(function (r, i) {
    if (String(r[C['차시'] - 1]) !== lesson) return;
    const key = String(r[C['반코드'] - 1]) + '|' + String(r[C['플레이어키'] - 1]);
    index[key] = { row: i + 2, status: r[C['분석상태'] - 1] };
  });
  return index;
}


// ============================================================
//  🤖 AI 분석 1명분 — 구조화된 JSON으로만 받음
// ============================================================
function gbAiAnalyze_(meta, events) {
  const transcript = events
    .filter(function (ev) { return ev.npcText || ev.studentText; })
    .map(function (ev) {
      const head = '[' + (ev.stage || '-') + '|' + ev.result + '|힌트' + ev.hintLevel + (ev.tag ? '|' + ev.tag : '') + ']';
      return head + ' NPC: ' + ev.npcText + (ev.studentText ? '\n    학생: ' + ev.studentText : '');
    })
    .join('\n');

  const system = [
    '너는 초등학교 6학년 과학 수업의 과정중심평가를 돕는 보조 평가자다. 최종 판단은 교사가 한다.',
    '',
    '[차시] ' + meta.lessonId + ' ' + meta.title,
    '[성취기준] ' + meta.standards,
    '[목표 개념] ' + meta.concepts,
    '[단계 판정 기준]',
    '- S: ' + meta.S,
    '- E: ' + meta.E,
    '- R: ' + meta.R,
    '',
    '[입력] 게임 NPC와 학생의 대화 기록. 각 줄 머리의 [단계|판정|힌트]는 게임 규칙 엔진의 자동 판정이다.',
    '규칙 엔진 판정을 그대로 따르지 말고, 학생 발화 자체를 근거로 독립적으로 판단하라.',
    '',
    '[출력 규칙]',
    '- stage: S, E, R 중 하나.',
    '- evidence: 판정 근거가 된 학생 발화를 짧게 인용한 1문장.',
    '- misconceptions: 학생 발화에 드러난 오개념 목록. 없으면 빈 배열.',
    '- summary: 학생의 탐구 흐름을 교사에게 보고하는 1~2문장.',
    '- feedback: 다음 차시 시작 때 학생에게 전할 편지 초안. 다음을 지켜라.',
    '  · 2~3문장, 다정한 반말, 초등 6학년 교과서 어휘만 사용.',
    '  · 첫 문장은 학생이 스스로 말한 내용을 구체적으로 인정한다.',
    '  · 부족한 점은 정답을 말하지 말고, 다음 시간에 생각해 볼 질문 1개로 남긴다.',
    '  · 점수·등급·다른 학생과의 비교, 이름 부르기, 학생이 쓴 개인정보 반복은 금지.',
    '  · 목표 개념과 어긋나는 과학적 내용은 절대 쓰지 않는다.'
  ].join('\n');

  const schema = {
    type: 'OBJECT',
    properties: {
      stage: { type: 'STRING', enum: ['S', 'E', 'R'] },
      evidence: { type: 'STRING' },
      misconceptions: { type: 'ARRAY', items: { type: 'STRING' } },
      summary: { type: 'STRING' },
      feedback: { type: 'STRING' }
    },
    required: ['stage', 'evidence', 'misconceptions', 'summary', 'feedback']
  };

  const r = gbCallGemini_(transcript || '(대화 없음)', system, schema);
  if (!r.ok) return r;
  try {
    const data = JSON.parse(r.text);
    if (['S', 'E', 'R'].indexOf(data.stage) < 0) return { ok: false, error: 'bad_stage' };
    data.feedback = gbMask_(String(data.feedback || '')).text.substring(0, GB.MAX_TEXT);
    return { ok: true, data: data };
  } catch (e) {
    return { ok: false, error: 'bad_json' };
  }
}

function gbCallGemini_(userText, systemText, schema) {
  const keys = gbAiKeys_();
  if (!keys.length) return { ok: false, error: 'no_key' };
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(GB_AI.MODEL) + ':generateContent';
  const generationConfig = {
    temperature: GB_AI.TEMPERATURE,
    maxOutputTokens: GB_AI.MAX_OUTPUT_TOKENS,
    responseMimeType: 'application/json'
  };
  if (schema) generationConfig.responseSchema = schema;
  const payload = {
    systemInstruction: { parts: [{ text: systemText }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: generationConfig
  };

  const order = keys.slice().sort(function () { return Math.random() - 0.5; });
  let lastErr = '';
  for (let i = 0; i < order.length; i++) {
    let res;
    try {
      res = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        headers: { 'x-goog-api-key': order[i] },     // 키는 URL이 아니라 헤더로
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
    } catch (e) {
      lastErr = 'fetch_failed';
      continue;
    }
    const code = res.getResponseCode();
    if (code === 429 || code >= 500) { lastErr = 'HTTP ' + code; continue; }
    let json = {};
    try { json = JSON.parse(res.getContentText()); } catch (e) { json = {}; }
    if (code !== 200 || json.error) {
      return { ok: false, error: 'HTTP ' + code + ' ' + ((json.error && json.error.status) || '') };
    }
    const c = json.candidates && json.candidates[0];
    const text = c && c.content && c.content.parts
      ? c.content.parts.filter(function (p) { return p.text && !p.thought; }).map(function (p) { return p.text; }).join('')
      : '';
    if (!text) return { ok: false, error: 'empty(' + ((c && c.finishReason) || 'blocked') + ')' };
    return { ok: true, text: text };
  }
  return { ok: false, error: lastErr || 'busy' };
}

function gbAiKeys_() {
  const raw = PropertiesService.getScriptProperties().getProperty(GB_AI.KEY_PROPERTY) || '';
  return raw.split(',').map(function (k) { return k.trim().replace(/['"]/g, ''); }).filter(String);
}


// ============================================================
//  ④ 차시 성찰표 — AIEDAP '여섯 관점 점검표' 형식을 데이터로 채움
//     자동 칸: 데이터 근거, 강점/보완 '후보'   /   교사 칸: 최종 판단, 근거 수업 장면, 4칸 성찰
//     다시 만들어도 교사가 쓴 칸은 보존됩니다.
// ============================================================
function gbBuildReflection_(lesson) {
  const m = gbReflectionMetrics_(lesson);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const name = '차시성찰_' + lesson;
  let sh = ss.getSheetByName(name);

  // 교사가 이미 쓴 내용 보존
  const keep = {};
  if (sh && sh.getLastRow() > 0) {
    sh.getDataRange().getValues().forEach(function (r) {
      if (r[0]) keep[String(r[0])] = [r[5], r[6]];
    });
  } else {
    sh = ss.insertSheet(name);
  }
  sh.clear();

  const pct = function (a, b) { return b ? Math.round((a / b) * 100) + '%' : '-'; };
  const cand = function (ok, hasData) { return !hasData ? ['', ''] : (ok ? ['○', ''] : ['', '○']); };

  const rows = [
    ['관점', '판단 기준', '데이터 근거 (자동)', '강점 후보', '보완 후보', '교사 판단 (강점/보완)', '근거 수업 장면 (교사 서술)']
  ];
  const add = function (label, criterion, evidence, ok, hasData) {
    const c = cand(ok, hasData);
    const k = keep[label] || ['', ''];
    rows.push([label, criterion, evidence, c[0], c[1], k[0], k[1]]);
  };

  add('교육적', '학습목표와 AI 역할',
    'R 도달 ' + m.rReached + '/' + m.players + '명(' + pct(m.rReached, m.players) + '). ' +
    '첫 시도 정답률: ' + (m.nodeRates.length ? m.nodeRates.join(', ') : '데이터 없음'),
    m.players && m.rReached / m.players >= GB_REFLECT.R_RATE_STRONG, m.players > 0);

  add('학습자', '학생의 선택 · 판단 · 설명',
    '성찰문장 작성 ' + m.reflections + '명(' + pct(m.reflections, m.players) + '), ' +
    '빈칸 문장으로 넘어감 ' + m.blankUsers + '명(' + pct(m.blankUsers, m.players) + '), ' +
    '자유응답 평균 ' + m.avgLen + '자',
    m.players && m.reflections / m.players >= GB_REFLECT.REFLECTION_RATE_STRONG &&
      m.blankUsers / m.players <= GB_REFLECT.BLANK_RATE_MAX, m.players > 0);

  add('기술적', '도구의 적합성과 접근성',
    '완료 ' + m.completed + '/' + m.players + '명(' + pct(m.completed, m.players) + '), ' +
    '오류기록 ' + m.errors + '건, 평균 소요 ' + (m.avgMinutes === null ? '-' : m.avgMinutes + '분'),
    m.players && m.completed / m.players >= GB_REFLECT.COMPLETE_RATE_STRONG && m.errors === 0, m.players > 0);

  add('평가', '과정 · 결과 · 성찰 증거',
    '규칙엔진-AI 단계 일치 ' + pct(m.agree, m.agree + m.disagree) + ' (' + m.agree + '/' + (m.agree + m.disagree) + '), ' +
    '피드백 승인 ' + m.approved + '건 · 전달 ' + m.delivered + '건(' + pct(m.delivered, m.approved) + ') · 학생 답장 ' + m.replies + '건',
    (m.agree + m.disagree) > 0 && m.agree / (m.agree + m.disagree) >= GB_REFLECT.AGREEMENT_STRONG &&
      (m.approved === 0 || m.delivered / m.approved >= GB_REFLECT.DELIVERY_STRONG), (m.agree + m.disagree) > 0);

  add('윤리적', '오류 · 편향 · 개인정보',
    '개인정보 가림 ' + m.flags['개인정보'] + '건, 욕설 ' + m.flags['욕설'] + '건, 이탈 ' + m.flags['이탈'] + '건, 위험 ' + m.flags['위험'] + '건. ' +
    'AI 초안을 교사가 고친 비율 ' + pct(m.teacherEdited, m.approved) + ' (AI 오류의 간접 지표)',
    m.flags['위험'] === 0 && m.flags['욕설'] === 0, m.players > 0);

  add('실행', '시간 · 기기 · 수준차',
    '최대 힌트 단계 분포 0/1/2/3 = ' + m.hintDist.join('/') + '명, 미완료 ' + (m.players - m.completed) + '명',
    m.players && m.hintDist[3] / m.players <= GB_REFLECT.HINT3_RATE_MAX &&
      (m.players - m.completed) / m.players <= GB_REFLECT.INCOMPLETE_RATE_MAX, m.players > 0);

  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows.map(function (r) { return r.map(gbSafeCell_); }));
  sh.getRange(1, 1, 1, rows[0].length).setFontWeight('bold').setBackground('#cfdcf5');
  sh.setFrozenRows(1);

  // 4칸 성찰 (슬라이드 '내 수업의 성찰 결과 정리하기' 형식)
  const weakest = rows.slice(1).filter(function (r) { return r[4] === '○'; }).map(function (r) { return r[0]; });
  const start = rows.length + 2;
  const box = [
    ['성찰 항목', '자동 제안', '', '', '', '교사 작성', ''],
    ['보완이 필요한 관점', weakest.length ? weakest.join(', ') : '(자동 후보 없음)', '', '', '', (keep['보완이 필요한 관점'] || [''])[0], ''],
    ['근거 수업 장면', '위 표의 데이터 근거 중 보완 후보 행을 참고', '', '', '', (keep['근거 수업 장면'] || [''])[0], ''],
    ['개선점 1개', '', '', '', '', (keep['개선점 1개'] || [''])[0], ''],
    ['바꿀 활동', '', '', '', '', (keep['바꿀 활동'] || [''])[0], '']
  ];
  sh.getRange(start, 1, box.length, 7).setValues(box.map(function (r) { return r.map(gbSafeCell_); }));
  sh.getRange(start, 1, 1, 7).setFontWeight('bold').setBackground('#fde3cf');
  sh.getRange(start + box.length + 1, 1).setValue(
    '※ 강점/보완 "후보"는 GB_REFLECT 기준에 따른 자동 표시입니다. 최종 판단은 교사 칸에 적으세요. ' +
    '표를 다시 만들어도 교사 칸은 보존됩니다.');
  sh.autoResizeColumns(1, 7);
}

function gbReflectionMetrics_(lesson) {
  const groups = gbGroupEvents_(lesson);
  const keys = Object.keys(groups);
  const m = {
    players: keys.length, rReached: 0, reflections: 0, blankUsers: 0, completed: 0,
    avgLen: 0, avgMinutes: null, hintDist: [0, 0, 0, 0], nodeRates: [],
    flags: { '개인정보': 0, '욕설': 0, '이탈': 0, '위험': 0, '지원필요': 0 },
    errors: 0, agree: 0, disagree: 0, approved: 0, delivered: 0, replies: 0, teacherEdited: 0
  };
  let lenSum = 0, lenCount = 0, minuteSum = 0, minuteCount = 0;
  const nodeFirst = {};       // nodeId → { total, correct } (학생별 첫 시도만)
  let firstTime = null;

  keys.forEach(function (k) {
    const evs = groups[k].events;
    const st = gbRuleStats_(evs);
    if (st.ruleStage === 'R') m.rReached++;
    if (st.reflection && st.reflection.indexOf('(빈칸)') !== 0) m.reflections++;
    if (st.usedBlank) m.blankUsers++;
    if (st.completed) m.completed++;
    m.hintDist[Math.min(3, st.maxHint)]++;

    const seenNode = {};
    let tStart = null, tEnd = null;
    evs.forEach(function (ev) {
      ev.flags.forEach(function (f) { if (m.flags.hasOwnProperty(f)) m.flags[f]++; });
      if (ev.studentText && ev.result !== 'info') { lenSum += ev.studentText.length; lenCount++; }
      if (ev.stage && ev.studentText && !seenNode[ev.nodeId] && ev.hintLevel === 0) {
        seenNode[ev.nodeId] = true;
        nodeFirst[ev.nodeId] = nodeFirst[ev.nodeId] || { total: 0, correct: 0 };
        nodeFirst[ev.nodeId].total++;
        if (ev.result === 'correct') nodeFirst[ev.nodeId].correct++;
      }
      const t = new Date(ev.clientTime);
      if (!isNaN(t.getTime())) {
        if (ev.tag === 'session-start' && !tStart) tStart = t;
        if (ev.tag === 'lesson-complete') tEnd = t;
      }
      if (ev.time instanceof Date && (!firstTime || ev.time < firstTime)) firstTime = ev.time;
    });
    if (tStart && tEnd && tEnd > tStart) { minuteSum += (tEnd - tStart) / 60000; minuteCount++; }
  });

  m.avgLen = lenCount ? Math.round(lenSum / lenCount) : 0;
  m.avgMinutes = minuteCount ? Math.round(minuteSum / minuteCount) : null;
  m.nodeRates = Object.keys(nodeFirst).map(function (n) {
    return n + ' ' + nodeFirst[n].correct + '/' + nodeFirst[n].total;
  });

  // 오류기록: 이 차시 첫 기록 이후 건수
  const err = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(GB.SHEETS.ERROR);
  if (err && err.getLastRow() >= 2 && firstTime) {
    err.getRange(2, 1, err.getLastRow() - 1, 1).getValues().forEach(function (r) {
      if (r[0] instanceof Date && r[0] >= firstTime) m.errors++;
    });
  }

  // 차시요약: 일치율·피드백 흐름
  const sum = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(GB.SHEETS.SUMMARY);
  if (sum && sum.getLastRow() >= 2) {
    const C = gbColMap_(GB_SUMMARY_HEADERS);
    sum.getRange(2, 1, sum.getLastRow() - 1, GB_SUMMARY_HEADERS.length).getValues().forEach(function (r) {
      if (String(r[C['차시'] - 1]) !== lesson) return;
      const a = r[C['단계일치'] - 1];
      if (a === 'O') m.agree++;
      if (a === 'X') m.disagree++;
      if (r[C['승인'] - 1] === true) {
        m.approved++;
        if (String(r[C['교사수정피드백'] - 1] || '').trim()) m.teacherEdited++;
      }
      if (r[C['전달시각'] - 1]) m.delivered++;
      if (String(r[C['학생반응'] - 1] || '').trim()) m.replies++;
    });
  }
  return m;
}


// ============================================================
//  🔧 도우미
// ============================================================
function gbApplyCheckboxes_(sh) {
  const C = gbColMap_(GB_SUMMARY_HEADERS);
  const last = sh.getLastRow();
  if (last >= 2) sh.getRange(2, C['승인'], last - 1, 1).insertCheckboxes();
}

function gbDeleteTriggers_(handler) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === handler) ScriptApp.deleteTrigger(t);
  });
}

function gbToast_(msg) {
  try { SpreadsheetApp.getActiveSpreadsheet().toast(msg, '게임 LAD', 6); } catch (e) { /* 트리거 실행 중엔 무시 */ }
}
