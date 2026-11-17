// 전기 마스터 타운 — 학급 서버 (Railway용). 의존 패키지 없음.
//  - 정적 파일: 게임은 index.html 한 파일
//  - /api/*  : 학생 로그인 · 학생별 기록 저장 · 교사 계기판
//  - 기록은 DATA_DIR(기본 ./data, Railway에서는 볼륨 /data)에 학생마다 JSON 파일 하나로 저장한다
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 3000, ROOT = __dirname;
// Railway에 /data 볼륨을 붙이면 자동으로 그곳에 저장한다 (재배포해도 기록이 남는다)
const DATA_DIR = path.resolve(process.env.DATA_DIR || (fs.existsSync('/data') ? '/data' : path.join(ROOT, 'data')));
const STU_DIR = path.join(DATA_DIR, 'students');
fs.mkdirSync(STU_DIR, {recursive:true});
// 교사 코드: 환경 변수 TEACHER_CODE가 있으면 그것을, 없으면 기본 코드의 해시를 쓴다 (공백은 무시)
const norm = s => String(s || '').replace(/\s+/g, '');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const TEACHER_HASH = process.env.TEACHER_CODE ? sha(norm(process.env.TEACHER_CODE)) : 'eb61b0b69df5042ed4be1cac89b0ce9fe673ca7d387d7d54fbe3f5dc2d157105';
// 로그인 표(token)를 서명하는 비밀값: 환경 변수 SECRET, 없으면 DATA_DIR에 한 번 만들어 둔다
const SECRET = process.env.SECRET || (() => {
  const f = path.join(DATA_DIR, 'secret.txt');
  try { return fs.readFileSync(f, 'utf8').trim(); } catch (e) { const s = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(f, s); return s; }
})();

const TYPES = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon'};
const STATIC_OK = new Set(['/index.html', '/전기마스터타운.html', '/favicon.ico']);

/* ----- 도우미 ----- */
const send = (res, code, obj) => { res.writeHead(code, {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store'}); res.end(JSON.stringify(obj)); };
const fileOf = id => path.join(STU_DIR, Buffer.from(id, 'utf8').toString('hex') + '.json');
function readStu(id){ try { return JSON.parse(fs.readFileSync(fileOf(id), 'utf8')); } catch (e) { return null; } }
function writeStu(id, obj){ const f = fileOf(id), tmp = f + '.' + process.pid + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(obj)); fs.renameSync(tmp, f); }
const hmac = s => crypto.createHmac('sha256', SECRET).update(s).digest('hex').slice(0, 32);
const tokenFor = id => Buffer.from(id, 'utf8').toString('base64url') + '.' + hmac('t:' + id);
function idFromToken(t){
  const [a, b] = String(t || '').split('.'); if (!a || !b) return null;
  let id; try { id = Buffer.from(a, 'base64url').toString('utf8'); } catch (e) { return null; }
  const want = hmac('t:' + id);
  return want.length === b.length && crypto.timingSafeEqual(Buffer.from(want), Buffer.from(b)) ? id : null;
}
const pinHash = (salt, pin) => crypto.scryptSync(String(pin), salt, 32).toString('hex');
function readBody(req, max){
  return new Promise((ok, no) => {
    let n = 0; const chunks = [];
    req.on('data', c => { n += c.length; if (n > max){ no(Object.assign(new Error('too big'), {code:413})); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { ok(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { no(Object.assign(new Error('bad json'), {code:400})); } });
    req.on('error', no);
  });
}
// 같은 주소에서 너무 자주 시도하면 잠시 막는다 (로그인 · 교사 코드)
const HITS = new Map();
function limited(req, key, max){
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(), k = key + ':' + ip, now = Date.now();
  const arr = (HITS.get(k) || []).filter(t => now - t < 60000); arr.push(now); HITS.set(k, arr);
  if (HITS.size > 5000) HITS.clear();
  return arr.length > max;
}
const cleanCls = s => String(s || '').trim().slice(0, 20) || '우리반';

/* ----- API ----- */
async function handleApi(req, res, p){
  if (p === '/api/ping') return send(res, 200, {emt:true});
  if (req.method !== 'POST') return send(res, 405, {error:'POST만 돼요'});
  let body;
  try { body = await readBody(req, p === '/api/save' ? 4 * 1024 * 1024 : 16 * 1024); }
  catch (e) { return send(res, e.code || 400, {error:'잘못된 요청'}); }

  if (p === '/api/login'){
    if (limited(req, 'login', 30)) return send(res, 429, {error:'잠시 뒤에 다시 해요'});
    const cls = cleanCls(body.cls), no = parseInt(body.no, 10), name = String(body.name || '').trim().slice(0, 12), pin = String(body.pin || '');
    if (!(no >= 1 && no <= 99999) || !name || !/^\d{4}$/.test(pin)) return send(res, 400, {error:'번호 · 이름 · 비밀번호(숫자 4자리)를 확인해요'});
    const id = `${cls}-${no}`;
    let s = readStu(id), created = false;
    if (!s){ const salt = crypto.randomBytes(12).toString('hex'); s = {id, cls, no, name, salt, hash:pinHash(salt, pin), created:Date.now(), save:null, sum:null, updated:0}; created = true; }
    else {
      if (s.name !== name) return send(res, 403, {error:'이름이 달라요', code:'name'});
      if (!s.hash){ s.salt = crypto.randomBytes(12).toString('hex'); s.hash = pinHash(s.salt, pin); }   // 교사가 비밀번호를 지운 뒤 처음 로그인
      else if (pinHash(s.salt, pin) !== s.hash) return send(res, 401, {error:'비밀번호가 달라요', code:'pin'});
    }
    s.lastLogin = Date.now(); writeStu(id, s);
    return send(res, 200, {token:tokenFor(id), save:s.save, created});
  }
  if (p === '/api/save'){
    const id = idFromToken(body.token); if (!id) return send(res, 401, {error:'다시 로그인해요'});
    const s = readStu(id); if (!s) return send(res, 401, {error:'다시 로그인해요'});
    if (!body.save || typeof body.save !== 'object') return send(res, 400, {error:'기록이 없어요'});
    s.save = body.save; s.sum = body.sum && typeof body.sum === 'object' ? body.sum : s.sum; s.updated = Date.now();
    writeStu(id, s);
    return send(res, 200, {ok:true, updated:s.updated});
  }
  if (p === '/api/teacher' || p === '/api/teacher/reset'){
    if (limited(req, 'teacher', 20)) return send(res, 429, {error:'잠시 뒤에 다시 해요'});
    if (sha(norm(body.code)) !== TEACHER_HASH) return send(res, 403, {error:'교사 코드가 달라요'});
    if (p === '/api/teacher/reset'){
      const s = readStu(String(body.id || '')); if (!s) return send(res, 404, {error:'학생이 없어요'});
      s.hash = null; s.salt = null; writeStu(s.id, s); return send(res, 200, {ok:true});
    }
    const students = [];
    for (const f of fs.readdirSync(STU_DIR)){
      if (!f.endsWith('.json')) continue;
      try { const s = JSON.parse(fs.readFileSync(path.join(STU_DIR, f), 'utf8')); students.push({id:s.id, cls:s.cls, no:s.no, name:s.name, sum:s.sum, updated:s.updated || s.lastLogin || s.created, pinReset:!s.hash}); } catch (e) {}
    }
    return send(res, 200, {students});
  }
  return send(res, 404, {error:'없는 주소'});
}

/* ----- 서버 ----- */
http.createServer((req, res) => {
  let p; try { p = decodeURIComponent(req.url.split('?')[0]); } catch (e) { res.writeHead(400); return res.end('bad request'); }
  if (p.startsWith('/api/')) return handleApi(req, res, p).catch(e => { console.error(e); send(res, 500, {error:'서버 오류'}); });
  if (p === '/' || p === '') p = '/index.html';
  if (!STATIC_OK.has(p)){ res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); return res.end('not found'); }
  fs.readFile(path.join(ROOT, p), (err, buf) => {
    if (err){ res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); return res.end('not found'); }
    res.writeHead(200, {'Content-Type':TYPES[path.extname(p)] || 'application/octet-stream', 'Cache-Control':'no-cache'});
    res.end(buf);
  });
}).listen(PORT, () => console.log('전기 마스터 타운: http://localhost:' + PORT + ' · 기록 폴더 ' + DATA_DIR));
