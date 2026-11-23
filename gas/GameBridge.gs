// ============================================================
//  전기 마스터 타운 ↔ 구글 시트 브리지  (GameBridge.gs)
//  ------------------------------------------------------------
//  ■ 게임 서버(lad/relay.js · lad/engine.js)와 이벤트 형식·허용 목록을 맞춰 두었습니다. 그대로 붙여 넣으면 됩니다.
//    차시 ID: L1(1차시 전자석 탐구관) · L2(2차시 고철장 AI 공장) · L3(3차시 안전 마을 연구소)
//  ■ 붙여 넣을 곳: 게임 전용 '새 스프레드시트' → [확장 프로그램 → Apps Script]
//      (기존 소크라테스 튜터 프로젝트에 넣지 마세요. 기존 LAD를 건드리지 않기 위함)
//  ■ 같은 프로젝트에 Analysis.gs 도 함께 넣습니다.
//  ■ 이 웹앱은 '게임 서버(Railway)'만 호출합니다. 학생 브라우저는 이 주소를 모릅니다.
//  ■ 정리 회의 AI 튜터: 게임 서버가 보낸 대화(tutor_turn)를 스크립트 속성 GEMINI_API_KEYS의 키로 Gemini에 물어 돌려줍니다.
//    (Railway에 GEMINI_API_KEY를 넣으면 게임 서버가 직접 부르므로 이 길은 쓰지 않습니다)
//    학생 이름·반·번호는 오지 않습니다. 게임 서버가 개인정보를 가린 대화만 보냅니다.
//
//  [스크립트 속성]  프로젝트 설정(⚙️) → 스크립트 속성
//    GAME_SHARED_SECRET   : 게임 서버와 똑같이 맞춘 긴 무작위 문자열 (40자 이상 권장)
//    TEACHER_ALERT_EMAIL  : (선택) 위험 신호 알림을 받을 교사 메일
//    GEMINI_API_KEYS      : (Analysis.gs용) '결제 계정이 연결된' 프로젝트의 키만
// ============================================================


// ⚙️ 운영 설정 (비밀 정보 아님)
const GB = {
  SECRET_PROPERTY: 'GAME_SHARED_SECRET',
  ALERT_EMAIL_PROPERTY: 'TEACHER_ALERT_EMAIL',
  TIMEZONE: 'Asia/Seoul',
  SHEETS: {
    LOG: '게임로그',
    SUMMARY: '차시요약',
    LESSONS: '차시설정',
    ERROR: '오류기록'
  },
  MAX_EVENTS_PER_CALL: 200,     // 서버가 한 번에 보내는 최대 이벤트 수 (넘으면 거절 → 서버가 나눠 보냄)
  MAX_TEXT: 500,                // 발화 1개 최대 글자 수
  DEDUPE_TTL_SECONDS: 21600,    // 같은 이벤트 중복 기록 방지 기억 시간 (6시간)
  ALERT_THROTTLE_SECONDS: 600   // 같은 학생 위험 알림 최소 간격 (10분)
};

const GB_LOG_HEADERS = [
  '서버수신시각', '차시', '반코드', '번호', '플레이어키', '세션ID', 'NPC', '노드ID',
  '단계', '태그', 'NPC발화', '학생응답', '판정', '힌트단계', '플래그', '클라이언트시각', '이벤트ID'
];

const GB_SUMMARY_HEADERS = [
  '차시', '반코드', '번호', '플레이어키',
  '규칙엔진단계', 'AI단계', '단계일치', 'S턴', 'E턴', 'R턴', '최대힌트', '플래그',
  '성찰문장', 'AI요약', '오개념', 'AI피드백초안',
  '교사수정피드백', '승인', '전달시각', '학생반응',      // ← 교사·학생 영역: 분석이 덮어쓰지 않음
  '분석시각', '분석상태'
];

const GB_ALLOWED = {
  STAGE: ['S', 'E', 'R', ''],
  RESULT: ['correct', 'partial', 'miss', 'misconception', 'avoid', 'offtopic', 'blocked', 'info', 'skip'],
  FLAG: ['이탈', '욕설', '욕설-3회', '개인정보', '위험', '지원필요', '중단'],
  TAG: ['', 'reflection', 'blank', 'feedback-reply', 'session-start', 'session-end', 'quest-complete', 'lesson-complete', 'judgment']
};


// ============================================================
//  🌐 웹앱 진입점 — 게임 서버만 호출
//  요청 본문(JSON): { secret, action, ... }
//  ※ Apps Script는 요청 헤더를 읽을 수 없어서 비밀키를 본문에 넣습니다.
//    그래서 반드시 '서버 → 서버'로만 호출해야 합니다.
// ============================================================
function doPost(e) {
  let body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return gbJson_({ ok: false, error: 'bad_json' });
  }
  if (!gbCheckSecret_(body.secret)) {
    return gbJson_({ ok: false, error: 'unauthorized' });
  }

  try {
    switch (body.action) {
      case 'ping':
        return gbJson_({ ok: true, time: new Date().toISOString(), ai: gbTutorKeys_().length > 0 });
      case 'tutor_turn':
        return gbJson_(gbHandleTutorTurn_(body));
      case 'log_events':
        return gbJson_(gbHandleLogEvents_(body.events));
      case 'get_feedback':
        return gbJson_(gbHandleGetFeedback_(body.classCode, body.playerKey));
      case 'ack_feedback':
        return gbJson_(gbHandleAckFeedback_(body.lesson, body.classCode, body.playerKey, body.reply));
      case 'upsert_lessons':
        return gbJson_(gbHandleUpsertLessons_(body.lessons));
      default:
        return gbJson_({ ok: false, error: 'unknown_action' });
    }
  } catch (err) {
    gbLogError_('doPost:' + String(body.action), err);
    return gbJson_({ ok: false, error: 'server_error' });
  }
}


// ============================================================
//  ① 이벤트 기록 (묶음)
// ============================================================
function gbHandleLogEvents_(events) {
  if (!Array.isArray(events)) return { ok: false, error: 'events_not_array' };
  if (events.length === 0) return { ok: true, written: 0, skipped: 0, acceptedIds: [] };
  if (events.length > GB.MAX_EVENTS_PER_CALL) return { ok: false, error: 'too_many_events' };

  const cache = CacheService.getScriptCache();
  const idKeys = events
    .map(function (ev) { return ev && typeof ev.eventId === 'string' ? 'ev:' + ev.eventId : ''; })
    .filter(function (k) { return k && k.length <= 200; });
  const seen = idKeys.length ? cache.getAll(idKeys) : {};

  const now = new Date();
  const rows = [];
  const acceptedIds = [];
  const duplicateIds = [];
  const inBatch = {};
  const alerts = [];
  let skipped = 0;

  events.forEach(function (raw) {
    const ev = gbValidateEvent_(raw);
    if (!ev) { skipped++; return; }
    if (seen['ev:' + ev.eventId] || inBatch[ev.eventId]) {
      duplicateIds.push(ev.eventId);       // 이미 기록됨 → 서버는 '성공'으로 처리해도 됨
      return;
    }
    inBatch[ev.eventId] = true;
    rows.push([
      now, ev.lesson, gbCodeCell_(ev.classCode), ev.studentNo, ev.playerKey, ev.sessionId, ev.npc, ev.nodeId,
      ev.stage, ev.tag, ev.npcText, ev.studentText, ev.result, ev.hintLevel,
      ev.flags.join(', '), ev.clientTime, ev.eventId
    ].map(gbSafeCell_));
    acceptedIds.push(ev.eventId);
    if (ev.flags.indexOf('위험') >= 0) alerts.push(ev);
  });

  if (rows.length) {
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);                  // 실패하면 예외 → server_error → 게임 서버가 재시도
    try {
      const sh = gbSheet_(GB.SHEETS.LOG, GB_LOG_HEADERS);
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, GB_LOG_HEADERS.length).setValues(rows);
      gbEnsureClassTabs_(rows.map(function (r) { return String(r[2]).replace(/^'/, ''); }));   // 새 반 코드면 반별 탭을 만든다 (실패해도 기록은 남음)
    } finally {
      lock.releaseLock();
    }
    const put = {};
    acceptedIds.forEach(function (id) { put['ev:' + id] = '1'; });
    cache.putAll(put, GB.DEDUPE_TTL_SECONDS);
  }

  if (alerts.length) gbSendAlert_(alerts);

  return {
    ok: true,
    written: rows.length,
    skipped: skipped,
    acceptedIds: acceptedIds,
    duplicateIds: duplicateIds
  };
}

// 서버가 보낸 이벤트를 다시 검사합니다. (서버 검사가 있어도 여기서 한 번 더: 방어선 2중)
function gbValidateEvent_(ev) {
  if (!ev || typeof ev !== 'object') return null;
  const id = gbStr_(ev.eventId, 64);
  if (!/^[A-Za-z0-9\-]{8,64}$/.test(id)) return null;

  const classCode = gbStr_(ev.classCode, 20);
  const playerKey = gbStr_(ev.playerKey, 64);
  if (!/^[A-Za-z0-9\-]{1,20}$/.test(classCode)) return null;
  if (!/^[A-Za-z0-9_\-]{8,64}$/.test(playerKey)) return null;

  const studentNo = Number(ev.studentNo);
  const stage = GB_ALLOWED.STAGE.indexOf(ev.stage) >= 0 ? ev.stage : '';
  const result = GB_ALLOWED.RESULT.indexOf(ev.result) >= 0 ? ev.result : 'info';
  const tag = GB_ALLOWED.TAG.indexOf(ev.tag) >= 0 ? ev.tag : '';
  const flags = (Array.isArray(ev.flags) ? ev.flags : [])
    .filter(function (f) { return GB_ALLOWED.FLAG.indexOf(f) >= 0; });

  const masked = gbMask_(gbStr_(ev.studentText, GB.MAX_TEXT));
  if (masked.found && flags.indexOf('개인정보') < 0) flags.push('개인정보');

  return {
    eventId: id,
    clientTime: gbStr_(ev.clientTime, 40),
    lesson: gbStr_(ev.lesson, 20),
    classCode: classCode,
    studentNo: (studentNo >= 1 && studentNo <= 60) ? Math.floor(studentNo) : '',
    playerKey: playerKey,
    sessionId: gbStr_(ev.sessionId, 64),
    npc: gbStr_(ev.npc, 40),
    nodeId: gbStr_(ev.nodeId, 60),
    stage: stage,
    tag: tag,
    npcText: gbStr_(ev.npcText, GB.MAX_TEXT),
    studentText: masked.text,
    result: result,
    hintLevel: Math.max(0, Math.min(3, Number(ev.hintLevel) || 0)),
    flags: flags
  };
}


// ============================================================
//  ② 피드백 편지 조회 — 교사가 '승인'한 것만, 아직 전달 안 된 것만
//     playerKey를 비우면 그 반 전체 목록을 돌려줌 (게임 서버가 몇 분 캐시)
// ============================================================
function gbHandleGetFeedback_(classCode, playerKey) {
  classCode = gbStr_(classCode, 20);
  playerKey = gbStr_(playerKey, 64);
  if (!/^[A-Za-z0-9\-]{1,20}$/.test(classCode)) return { ok: false, error: 'bad_class' };

  const sh = gbSheet_(GB.SHEETS.SUMMARY, GB_SUMMARY_HEADERS);
  const last = sh.getLastRow();
  if (last < 2) return { ok: true, items: [] };

  const C = gbColMap_(GB_SUMMARY_HEADERS);
  const values = sh.getRange(2, 1, last - 1, GB_SUMMARY_HEADERS.length).getValues();
  const items = [];
  values.forEach(function (r) {
    if (String(r[C['반코드'] - 1]) !== classCode) return;
    if (playerKey && String(r[C['플레이어키'] - 1]) !== playerKey) return;
    if (r[C['승인'] - 1] !== true) return;
    if (r[C['전달시각'] - 1]) return;
    const teacherText = String(r[C['교사수정피드백'] - 1] || '').trim();
    const aiText = String(r[C['AI피드백초안'] - 1] || '').trim();
    const text = teacherText || aiText;
    if (!text) return;
    items.push({
      lesson: String(r[C['차시'] - 1]),
      classCode: classCode,
      playerKey: String(r[C['플레이어키'] - 1]),
      text: text.substring(0, GB.MAX_TEXT),
      editedByTeacher: !!teacherText,
      aiAssisted: true                    // 게임 화면에 'AI 도움 + 선생님 확인' 표시용
    });
  });
  return { ok: true, items: items };
}


// ============================================================
//  ③ 피드백 전달 확인 + 학생 답장 기록
// ============================================================
function gbHandleAckFeedback_(lesson, classCode, playerKey, reply) {
  lesson = gbStr_(lesson, 20);
  classCode = gbStr_(classCode, 20);
  playerKey = gbStr_(playerKey, 64);
  if (!lesson || !classCode || !playerKey) return { ok: false, error: 'bad_params' };

  const masked = gbMask_(gbStr_(reply, GB.MAX_TEXT));
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = gbSheet_(GB.SHEETS.SUMMARY, GB_SUMMARY_HEADERS);
    const last = sh.getLastRow();
    if (last < 2) return { ok: false, error: 'not_found' };
    const C = gbColMap_(GB_SUMMARY_HEADERS);
    const keys = sh.getRange(2, 1, last - 1, C['플레이어키']).getValues();
    for (let i = 0; i < keys.length; i++) {
      const r = keys[i];
      if (String(r[C['차시'] - 1]) === lesson &&
          String(r[C['반코드'] - 1]) === classCode &&
          String(r[C['플레이어키'] - 1]) === playerKey) {
        const rowNo = i + 2;
        sh.getRange(rowNo, C['전달시각']).setValue(new Date());
        if (masked.text) sh.getRange(rowNo, C['학생반응']).setValue(gbSafeCell_(masked.text));
        return { ok: true };
      }
    }
    return { ok: false, error: 'not_found' };
  } finally {
    lock.releaseLock();
  }
}


// ============================================================
//  ③-2 차시 설정 동기화 — 게임의 차시 대본 JSON이 '단일 원본'
//      게임 서버가 시작할 때 한 번 보내면 [차시설정] 탭이 갱신되고,
//      Analysis.gs가 이 탭의 목표 개념·판정 기준으로 AI 분석을 합니다.
// ============================================================
const GB_LESSON_HEADERS = ['차시', '제목', '성취기준', '목표개념', 'S기준', 'E기준', 'R기준', '갱신시각'];

function gbHandleUpsertLessons_(lessons) {
  if (!Array.isArray(lessons) || lessons.length === 0 || lessons.length > 50) {
    return { ok: false, error: 'bad_lessons' };
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = gbSheet_(GB.SHEETS.LESSONS, GB_LESSON_HEADERS);
    const last = sh.getLastRow();
    const ids = last >= 2 ? sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
    let updated = 0;
    lessons.forEach(function (l) {
      const id = gbStr_(l && l.lessonId, 20);
      if (!/^[A-Za-z0-9\-]{1,20}$/.test(id)) return;
      const row = [
        id,
        gbStr_(l.title, 100),
        gbStr_(Array.isArray(l.standards) ? l.standards.join(' / ') : l.standards, 600),
        gbStr_(Array.isArray(l.concepts) ? l.concepts.join(', ') : l.concepts, 400),
        gbStr_(l.rubric && l.rubric.S, 300),
        gbStr_(l.rubric && l.rubric.E, 300),
        gbStr_(l.rubric && l.rubric.R, 300),
        new Date()
      ].map(gbSafeCell_);
      const idx = ids.indexOf(id);
      if (idx >= 0) {
        sh.getRange(idx + 2, 1, 1, row.length).setValues([row]);
      } else {
        sh.appendRow(row);
        ids.push(id);
      }
      updated++;
    });
    return { ok: true, updated: updated };
  } finally {
    lock.releaseLock();
  }
}


// ============================================================
//  ③-3 정리 회의 AI 튜터 — 게임 서버가 만든 지시문·대화를 Gemini에 묻고 글만 돌려준다
// ============================================================
const GB_TUTOR = {
  KEY_PROPERTY: 'GEMINI_API_KEYS',
  MODEL: 'gemini-3.5-flash-lite',      // 기존 소크라테스 튜터와 같은 모델
  MAX_OUTPUT_TOKENS: 900,
  PER_MINUTE: 150                       // 앱 전체 분당 상한 (한 반이 동시에 써도 넉넉하게)
};
function gbTutorKeys_() {
  const raw = PropertiesService.getScriptProperties().getProperty(GB_TUTOR.KEY_PROPERTY) || '';
  return raw.split(',').map(function (k) { return k.trim().replace(/['"]/g, ''); }).filter(String);
}
function gbHandleTutorTurn_(b) {
  const keys = gbTutorKeys_();
  if (!keys.length) return { ok: false, error: 'no_key' };
  const system = gbStr_(b.system, 24000);
  const contents = Array.isArray(b.contents) ? b.contents.slice(-60) : [];
  if (!system || !contents.length) return { ok: false, error: 'bad_request' };
  const clean = [];
  for (let i = 0; i < contents.length; i++) {
    const c = contents[i] || {};
    const role = c.role === 'model' ? 'model' : 'user';
    const text = gbStr_(c.parts && c.parts[0] && c.parts[0].text, 4000);
    if (text) clean.push({ role: role, parts: [{ text: text }] });
  }
  // 분당 상한 (선생님 할당량 보호)
  const cache = CacheService.getScriptCache();
  const k = 'tutor:' + Math.floor(Date.now() / 60000);
  const n = Number(cache.get(k) || 0) + 1;
  cache.put(k, String(n), 120);
  if (n > GB_TUTOR.PER_MINUTE) return { ok: false, error: 'busy' };

  const generationConfig = { temperature: Math.max(0, Math.min(1, Number(b.temperature) || 0.6)), maxOutputTokens: GB_TUTOR.MAX_OUTPUT_TOKENS, responseMimeType: 'application/json' };
  if (b.schema && typeof b.schema === 'object') generationConfig.responseSchema = b.schema;
  const payload = {
    systemInstruction: { parts: [{ text: system }] }, contents: clean, generationConfig: generationConfig,
    safetySettings: ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT']
      .map(function (c) { return { category: c, threshold: 'BLOCK_MEDIUM_AND_ABOVE' }; })
  };
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(GB_TUTOR.MODEL) + ':generateContent';
  const order = keys.slice().sort(function () { return Math.random() - 0.5; });
  let last = 'busy';
  for (let i = 0; i < order.length; i++) {
    let res;
    try {
      res = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', headers: { 'x-goog-api-key': order[i] }, payload: JSON.stringify(payload), muteHttpExceptions: true });
    } catch (e) { last = 'fetch_failed'; continue; }
    const code = res.getResponseCode();
    if (code === 429 || code >= 500) { last = 'HTTP ' + code; continue; }
    let json = {};
    try { json = JSON.parse(res.getContentText()); } catch (e) { json = {}; }
    if (code !== 200 || json.error) { gbLogError_('tutor_turn', 'HTTP ' + code + ' ' + ((json.error && json.error.status) || '')); return { ok: false, error: 'HTTP ' + code }; }
    const cand = json.candidates && json.candidates[0];
    const text = cand && cand.content && cand.content.parts
      ? cand.content.parts.filter(function (p) { return p.text && !p.thought; }).map(function (p) { return p.text; }).join('') : '';
    if (!text) return { ok: false, error: 'empty_' + ((cand && cand.finishReason) || 'blocked') };
    return { ok: true, text: text };
  }
  return { ok: false, error: last };
}


// ============================================================
//  ④ 위험 신호 메일 알림 (선택 — TEACHER_ALERT_EMAIL 속성이 있을 때만)
//     학생 화면 문구는 게임이 즉시 보여 주고, 이 메일은 교사용 보조 알림입니다.
// ============================================================
function gbSendAlert_(events) {
  const to = PropertiesService.getScriptProperties().getProperty(GB.ALERT_EMAIL_PROPERTY);
  if (!to) return;
  const cache = CacheService.getScriptCache();
  const lines = [];
  events.forEach(function (ev) {
    const k = 'alert:' + ev.playerKey;
    if (cache.get(k)) return;              // 같은 학생 10분 내 중복 알림 방지
    cache.put(k, '1', GB.ALERT_THROTTLE_SECONDS);
    lines.push([
      '· 시각: ' + Utilities.formatDate(new Date(), GB.TIMEZONE, 'yyyy-MM-dd HH:mm'),
      '  차시: ' + ev.lesson + ' / 반: ' + ev.classCode + ' / 번호: ' + ev.studentNo,
      '  대화 위치: ' + ev.npc + ' · ' + ev.nodeId,
      '  학생 응답(개인정보 가림): ' + ev.studentText
    ].join('\n'));
  });
  if (!lines.length) return;
  try {
    MailApp.sendEmail(to,
      '[전기 마스터 타운] 위험 신호 확인 필요',
      '게임 대화에서 위험 신호로 분류된 응답이 있습니다. 학생을 직접 확인해 주세요.\n\n' +
      lines.join('\n\n') +
      '\n\n(자동 분류이므로 오탐일 수 있습니다. 시트 [' + GB.SHEETS.LOG + '] 탭에서 맥락을 확인하세요.)');
  } catch (err) {
    gbLogError_('gbSendAlert_', err);
  }
}


// ============================================================
//  🔧 공용 도우미 (이름 끝 _ = 외부 호출 불가)
//  ※ 모든 이름에 gb 접두어 → 다른 파일과 이름 충돌 방지
// ============================================================
function gbJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// 길이가 같을 때 끝까지 비교 (시간 차로 비밀키를 추측하는 것 방지)
function gbCheckSecret_(given) {
  const expected = PropertiesService.getScriptProperties().getProperty(GB.SECRET_PROPERTY) || '';
  if (expected.length < 20 || typeof given !== 'string' || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

function gbStr_(v, max) {
  let s = (v === null || v === undefined) ? '' : String(v);
  // 보이지 않는 제어문자·방향 전환 문자 제거
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠-⁤﻿]/g, '');
  s = s.trim();
  return s.length > max ? s.substring(0, max) : s;
}

// 형식이 뚜렷한 개인정보만 가립니다. (실명 자체는 기계적으로 완벽히 가려낼 수 없음)
function gbMask_(text) {
  const rules = [
    [/\d{6}\s*-\s*[1-4]\d{6}/g, '[주민번호]'],
    [/01[016789][\s.\-]?\d{3,4}[\s.\-]?\d{4}/g, '[전화번호]'],
    [/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g, '[이메일]'],
    [/[가-힣]{2,10}초등학교/g, '[학교]'],
    [/((?:내|제|우리\s*[가-힣]{1,4})\s*이름은)\s*[가-힣]{2,4}/g, '$1 [이름]']
  ];
  let t = String(text || '');
  let found = false;
  rules.forEach(function (r) {
    const next = t.replace(r[0], r[1]);
    if (next !== t) found = true;
    t = next;
  });
  return { text: t, found: found };
}

// 시트 수식 주입 방지: = + - @ 로 시작하면 앞에 ' 를 붙여 글자로만 저장
function gbSafeCell_(v) {
  if (v instanceof Date) return v;
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  let s = String(v === null || v === undefined ? '' : v);
  if (s.length > 45000) s = s.substring(0, 45000) + '…(잘림)';
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}

// 0으로 시작하는 숫자 반 코드(예: 0601)가 숫자 601로 바뀌지 않게 글자로 저장
function gbCodeCell_(code) {
  const s = String(code == null ? '' : code);
  return /^0\d+$/.test(s) ? "'" + s : s;
}

// ============================================================
//  ⑤ 반별 탭 — 반 코드마다 '게임로그'와 '차시요약'을 걸러 보여 주는 탭 (보기 전용 · 수식이라 저절로 갱신)
//  · 원본은 하나(게임로그 · 차시요약)입니다. 분석 · 편지 · 승인은 모두 원본에서 하고, 반별 탭은 보기만 합니다.
//  · 새 반 코드의 기록이 처음 들어오면 '6301 기록' · '6301 요약' 탭이 저절로 생깁니다. (TEST · NOCLASS는 만들지 않음)
//  · 탭을 지웠거나 모양이 깨졌으면 메뉴 ⑤로 다시 만듭니다.
// ============================================================
const GB_CLASS = { SKIP: ['', 'TEST', 'NOCLASS'], PROP: 'GB_CLASS_TABS', LOG: ' 기록', SUM: ' 요약' };

function gbClassOk_(code) {
  return /^[A-Za-z0-9\-]{1,20}$/.test(code) && GB_CLASS.SKIP.indexOf(code) < 0;
}

function gbColLetter_(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// 한 반의 보기 탭 하나를 만들거나 다시 만든다. kind: 'log'(게임로그) | 'sum'(차시요약)
function gbClassTab_(code, kind) {
  if (!gbClassOk_(code)) return null;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const isLog = kind === 'log';
  const src = isLog ? GB.SHEETS.LOG : GB.SHEETS.SUMMARY;
  const headers = isLog ? GB_LOG_HEADERS : GB_SUMMARY_HEADERS;
  gbSheet_(src, headers);                                  // 원본 탭이 있어야 수식이 맞는다
  const name = code + (isLog ? GB_CLASS.LOG : GB_CLASS.SUM);
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name); else sh.clear();
  const C = gbColMap_(headers), lastCol = gbColLetter_(headers.length), codeCol = gbColLetter_(C['반코드']);
  sh.getRange(1, 1).setValue('📋 ' + code + '반 ' + (isLog ? '게임 기록 (최신 기록이 위)' : '차시 요약 (차시 · 번호 순)') +
    " — '" + src + "' 탭에서 " + code + '반만 걸러 보여 줘요. 보기 전용이라 저절로 바뀌어요.' +
    (isLog ? '' : " 피드백 수정과 승인은 '" + src + "' 탭에서 해요.")).setFontWeight('bold');
  sh.getRange(2, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#cfdcf5');
  const range = "'" + src + "'!A2:" + lastCol, codes = "'" + src + "'!" + codeCol + '2:' + codeCol;
  const sort = isLog ? C['서버수신시각'] + ', FALSE' : C['차시'] + ', TRUE, ' + C['번호'] + ', TRUE';
  sh.getRange(3, 1).setFormula('=IFERROR(SORT(FILTER(' + range + ', TO_TEXT(' + codes + ')="' + code + '"), ' + sort + '), "아직 기록이 없어요")');
  const dateCols = isLog ? ['서버수신시각'] : ['전달시각', '분석시각'];
  dateCols.forEach(function (h) { const c = gbColLetter_(C[h]); sh.getRange(c + '3:' + c).setNumberFormat('yyyy-mm-dd hh:mm'); });
  sh.setFrozenRows(2);
  return sh;
}

// 기록에 처음 보이는 반 코드면 두 탭을 만든다 (이미 만든 반은 스크립트 속성에 기억)
function gbEnsureClassTabs_(codes) {
  try {
    const props = PropertiesService.getScriptProperties();
    const known = JSON.parse(props.getProperty(GB_CLASS.PROP) || '[]');
    const fresh = codes.filter(function (c, i) { return gbClassOk_(c) && codes.indexOf(c) === i && known.indexOf(c) < 0; });
    if (!fresh.length) return [];
    fresh.forEach(function (c) { gbClassTab_(c, 'log'); gbClassTab_(c, 'sum'); known.push(c); });
    props.setProperty(GB_CLASS.PROP, JSON.stringify(known.slice(-60)));
    return fresh;
  } catch (err) {
    gbLogError_('classTabs', err);
    return [];
  }
}

function gbColMap_(headers) {
  const m = {};
  headers.forEach(function (h, i) { m[h] = i + 1; });
  return m;
}

function gbSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function gbLogError_(where, err) {
  const msg = String((err && err.stack) || err).replace(/AIza[0-9A-Za-z_\-]{20,}/g, '[API_KEY]');
  console.error(where + ': ' + msg);
  try {
    const sh = gbSheet_(GB.SHEETS.ERROR, ['시각', '위치', '내용']);
    sh.appendRow([new Date(), where, msg].map(gbSafeCell_));
  } catch (e) { /* 기록 실패는 무시 */ }
}
