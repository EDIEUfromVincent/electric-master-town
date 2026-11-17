// 전기 마스터 타운 — 학급 서버 (Railway용). 의존 패키지 없음.
//  - 정적 파일: 게임은 index.html 한 파일
//  - /api/*  : 학생 로그인 · 학생별 기록 저장
//  - 기록은 DATA_DIR(기본 ./data, Railway에서는 볼륨 /data)에 학생마다 JSON 파일 하나로 저장한다
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 3000, ROOT = __dirname;
// Railway에 /data 볼륨을 붙이면 자동으로 그곳에 저장한다 (재배포해도 기록이 남는다)
const DATA_DIR = path.resolve(process.env.DATA_DIR || (fs.existsSync('/data') ? '/data' : path.join(ROOT, 'data')));
const STU_DIR = path.join(DATA_DIR, 'students');
fs.mkdirSync(STU_DIR, {recursive:true});
const norm = s => String(s || '').replace(/\s+/g, '');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
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
const cleanName = s => String(s || '').normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, 12);
const nameId = n => 'n:' + n.toLowerCase();
/* 예전 방식(반 · 번호) 기록: 이름 → 파일 목록을 시작할 때 한 번만 모아 둔다 (로그인마다 폴더 전체를 읽지 않게) */
const LEGACY = new Map();
try { for (const f of fs.readdirSync(STU_DIR)){ if (!f.endsWith('.json')) continue; try { const o = JSON.parse(fs.readFileSync(path.join(STU_DIR, f), 'utf8')); if (o && o.id && !String(o.id).startsWith('n:') && !o.migrated){ const k = cleanName(o.name); LEGACY.set(k, (LEGACY.get(k) || []).concat(f)); } } catch (e) {} } } catch (e) {}
/* 어떤 오류가 나도 서버가 꺼지지 않게 기록만 남긴다 */
process.on('uncaughtException', e => console.error('uncaught', e));
process.on('unhandledRejection', e => console.error('unhandled', e));

/* ----- API ----- */
async function handleApi(req, res, p){
  if (p === '/api/ping') return send(res, 200, {emt:true});
  if (req.method !== 'POST') return send(res, 405, {error:'POST만 돼요'});
  let body;
  try { body = await readBody(req, p === '/api/save' ? 4 * 1024 * 1024 : 16 * 1024); }
  catch (e) { return send(res, e.code || 400, {error:'잘못된 요청'}); }

  if (p === '/api/login'){
    /* 전국 어디서든: 이름(또는 별명) + 비밀번호(숫자 4~8자리)만으로 들어온다. 같은 이름은 한 사람만 쓸 수 있다 */
    if (limited(req, 'login', 30)) return send(res, 429, {error:'잠시 뒤에 다시 해요'});
    const name = cleanName(body.name), pin = String(body.pin || '');
    if (!name || !/^\d{4,8}$/.test(pin)) return send(res, 400, {error:'이름(별명)과 비밀번호(숫자 4~8자리)를 확인해요'});
    const id = nameId(name);
    let s = readStu(id), created = false, moved = false;
    if (!s){
      /* 예전 방식(반 · 번호)으로 만든 기록이 같은 이름 · 같은 비밀번호로 있으면 이어받는다 */
      for (const f of (LEGACY.get(name) || [])){
        let o; try { o = JSON.parse(fs.readFileSync(path.join(STU_DIR, f), 'utf8')); } catch (e) { continue; }
        if (!o || o.migrated || o.id === id || cleanName(o.name) !== name || !o.hash || pinHash(o.salt, pin) !== o.hash) continue;
        s = {id, name, salt:o.salt, hash:o.hash, created:o.created, save:o.save, sum:o.sum, updated:o.updated, from:o.id};
        o.migrated = id; writeStu(o.id, o); moved = true; break;
      }
    }
    if (!s){ const salt = crypto.randomBytes(12).toString('hex'); s = {id, name, salt, hash:pinHash(salt, pin), created:Date.now(), save:null, sum:null, updated:0}; created = true; }
    else if (!moved){
      if (!s.hash){ s.salt = crypto.randomBytes(12).toString('hex'); s.hash = pinHash(s.salt, pin); }   // 교사가 비밀번호를 지운 뒤 처음 로그인
      else if (pinHash(s.salt, pin) !== s.hash) return send(res, 401, {error:'비밀번호가 달라요', code:'pin'});
    }
    s.lastLogin = Date.now(); writeStu(id, s);
    return send(res, 200, {token:tokenFor(id), save:s.save, created, moved});
  }
  if (p === '/api/save'){
    const id = idFromToken(body.token); if (!id) return send(res, 401, {error:'다시 로그인해요'});
    const s = readStu(id); if (!s) return send(res, 401, {error:'다시 로그인해요'});
    if (!body.save || typeof body.save !== 'object') return send(res, 400, {error:'기록이 없어요'});
    s.save = body.save; s.sum = body.sum && typeof body.sum === 'object' ? body.sum : s.sum; s.updated = Date.now();
    writeStu(id, s);
    return send(res, 200, {ok:true, updated:s.updated});
  }
  return send(res, 404, {error:'없는 주소'});
}

/* ----- 서버 ----- */
const server = http.createServer((req, res) => {
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
/* 새 배포로 바뀔 때 Railway가 보내는 종료 신호: 받던 요청을 마치고 조용히 끝낸다 (오류 종료로 보이지 않게) */
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => {
  console.log('종료 신호 ' + sig + ' — 정상 종료합니다');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
});
