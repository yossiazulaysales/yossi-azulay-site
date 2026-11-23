/* מנוע האוטומציות של מערכת הניהול – יוסי אזולאי
   רץ בחשבון הגוגל של יוסי (yossiazulaysales).
   1. יומן גוגל: כל אירוע במערכת = אירוע ביומן (כל 10 דקות).
   2. תיקיות לקוח בדרייב: תיקייה לכל לקוח, וקליטת קבצים מהמערכת ומהאזור האישי (Web App).
   3. סיכום בוקר במייל ליוסי: מה צריך לעשות היום.
   4. גיבוי שבועי ל-Dropbox (יום ראשון 03:00), אחרי חיבור חד-פעמי.
   הפעלה ראשונה: להריץ את setup ולאשר הרשאות. */

const PROJECT = 'yossi-azulay';
const API_KEY = 'AIzaSyBQg7PvR6yxFbU_Lkpd4MvAq88fROldjZ0';   // מפתח ציבורי של אפליקציית האתר (לא סודי)
const ADMINS = ['yossiazulaysales@gmail.com'];
const OWNER_EMAIL = 'yossiazulaysales@gmail.com';
const CRM_URL = 'https://yossiazulaysales.github.io/yossi-azulay-site/admin.html';
const ROOT_FOLDER = 'מערכת ניהול – יוסי אזולאי';
const STAGE = {lead:'פנייה חדשה',checking:'בדיקת זמינות',quote:'הצעת מחיר נשלחה',contract:'חוזה נשלח',deposit:'ממתין למקדמה',
  booked:'סגור · מקדמה התקבלה',prep:'הכנה לאירוע',ready:'טופס אירוע אושר',done:'האירוע בוצע',closed:'סגור סופית',
  nurture:'לא סגר',irrelevant:'לא רלוונטי',taken:'תאריך תפוס'};
const ORDER = ['lead','checking','quote','contract','deposit','booked','prep','ready','done','closed'];
const SIDE = ['nurture','irrelevant','taken'];
const ETYPE = {wedding:'חתונה – כניסה לחופה',tefillin:'בר מצווה – הנחת תפילין',aliyah:'בר מצווה – עלייה לתורה',henna:'חינה – מופע מזרחי',other:'אירוע'};
const CUR = {ILS:'₪',EUR:'€',USD:'$'};
const TZ = 'Asia/Jerusalem';

/* ================= הפעלה ================= */
function setup() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('run').timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger('morningDigest').timeBased().everyDays(1).atHour(8).inTimezone(TZ).create();
  ScriptApp.newTrigger('weeklyBackup').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(3).inTimezone(TZ).create();
  rootFolder_();
  run();
  Logger.log('הכול מוכן. היומן מסונכרן, סיכום בוקר ב-08:00, גיבוי ביום ראשון ב-03:00.');
}

function run() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    const events = loadEvents_();
    syncCalendar_(events);
    syncFolders_(events);
  } finally { lock.releaseLock(); }
}

/* ================= Firestore ================= */
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
function fsReq_(method, path, body) {
  const opt = {method, headers: {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()}, muteHttpExceptions: true, contentType: 'application/json'};
  if (body) opt.payload = JSON.stringify(body);
  const r = UrlFetchApp.fetch(FS + path, opt);
  const c = r.getResponseCode();
  if (c === 404) return null;
  if (c >= 300) throw new Error('Firestore ' + c + ': ' + r.getContentText().slice(0, 300));
  return JSON.parse(r.getContentText() || '{}');
}
function fsList_(coll) {
  const out = []; let tok = '';
  do {
    const j = fsReq_('get', `/${coll}?pageSize=300` + (tok ? '&pageToken=' + tok : ''));
    ((j && j.documents) || []).forEach(d => out.push(d));
    tok = (j && j.nextPageToken) || '';
  } while (tok);
  return out;
}
function toVal_(v) {
  if (v === null || v === undefined) return {nullValue: null};
  if (typeof v === 'boolean') return {booleanValue: v};
  if (typeof v === 'number') return Number.isInteger(v) ? {integerValue: String(v)} : {doubleValue: v};
  if (Array.isArray(v)) return {arrayValue: {values: v.map(toVal_)}};
  if (typeof v === 'object') { const f = {}; Object.keys(v).forEach(k => f[k] = toVal_(v[k])); return {mapValue: {fields: f}}; }
  return {stringValue: String(v)};
}
function fromVal_(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromVal_);
  if ('mapValue' in v) { const o = {}; const f = v.mapValue.fields || {}; Object.keys(f).forEach(k => o[k] = fromVal_(f[k])); return o; }
  return null;
}
function fsGet_(path) { const d = fsReq_('get', path); if (!d) return null; const o = {}; const f = d.fields || {}; Object.keys(f).forEach(k => o[k] = fromVal_(f[k])); return o; }
/* כתיבה חלקית: מעדכנת רק את השדות שנשלחו */
function fsMerge_(path, obj) {
  const fields = {}; Object.keys(obj).forEach(k => fields[k] = toVal_(obj[k]));
  const mask = Object.keys(obj).map(k => 'updateMask.fieldPaths=' + encodeURIComponent(k)).join('&');
  return fsReq_('patch', path + '?' + mask, {fields});
}
function loadEvents_() {
  return fsList_('events').map(d => {
    const raw = d.fields && d.fields.data && d.fields.data.stringValue;
    if (!raw) return null;
    const e = JSON.parse(raw); e._id = d.name.split('/').pop(); return e;
  }).filter(Boolean);
}

/* ================= עזרים ================= */
function money_(n, cur) { return n ? Number(n).toLocaleString('en-US') + ' ' + (CUR[cur] || '₪') : ''; }
function day_(iso) { return Utilities.parseDate(iso, TZ, 'yyyy-MM-dd'); }
function todayIso_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function daysTo_(iso) { return Math.round((day_(iso) - day_(todayIso_())) / 864e5); }
function daysSince_(iso) { return iso ? -daysTo_(iso) : null; }
function fmt_(iso) { return iso ? iso.split('-').reverse().join('/') : ''; }
function isSide_(e) { return SIDE.indexOf(e.status) >= 0; }
function idx_(e) { return ORDER.indexOf(e.status); }

/* ================= 1. יומן גוגל ================= */
function calText_(e) {
  const d = e.doc || {}, q = e.quote || {}, p = e.pay || {};
  const where = e.venue || e.city || '';
  const title = [STAGE[e.status] || e.status, ETYPE[e.etype] || '', where ? 'ב"' + where + '"' : '', e.client || '', e.phone || ''].filter(Boolean).join(' · ');
  const fee = q.basePrice || d.fee || '';
  const times = [d.startTime && 'התחלת אירוע ' + d.startTime, d.showTime && 'מופע ' + d.showTime, d.endTime && 'סיום ' + d.endTime, e.hours].filter(Boolean).join(' · ');
  const dep = p.deposit || {}, bal = p.balance || {};
  const lines = [
    ['איש קשר + טלפון', [e.client, e.couple, e.phone].filter(Boolean).join(' · ')],
    ['מייל', e.email],
    ['מקום', [e.venue, e.city, e.country].filter(Boolean).join(', ')],
    ['שעות', times],
    ['צוות', d.team],
    ['הצעת מחיר מס׳', e.quoteNo],
    ['טופס הזמנה מס׳', e.contractNo],
    ['חוזה', e.contract === 'signed' ? 'חתום' : e.contract === 'sent' ? 'נשלח' : ''],
    ['מחיר', money_(fee, q.cur || d.cur)],
    ['מקדמה', dep.received ? 'התקבלה' + (dep.method ? ' · ' + dep.method : '') + (dep.date ? ' · ' + fmt_(dep.date) : '') : ''],
    ['חשבונית מקדמה', dep.receipt && dep.receipt !== 'pending' ? dep.receipt : ''],
    ['יתרה', bal.received ? 'התקבלה' + (bal.date ? ' · ' + fmt_(bal.date) : '') : ''],
    ['הגברה', e.sound],
    ['מוסיקה', e.music],
    ['הערות', e.notes],
  ].filter(x => x[1]).map(x => x[0] + ': ' + x[1]);
  lines.push('', 'במערכת: ' + CRM_URL);
  return {title, desc: lines.join('\n'), loc: [e.venue, e.city, e.country].filter(Boolean).join(', ')};
}
function syncCalendar_(events) {
  const cal = CalendarApp.getDefaultCalendar();
  const P = PropertiesService.getScriptProperties();
  const map = JSON.parse(P.getProperty('gcal') || '{}');
  const seen = {};
  events.forEach(e => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date || '')) return;
    seen[e._id] = 1;
    const t = calText_(e);
    const h = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, [t.title, t.desc, t.loc, e.date].join('|'), Utilities.Charset.UTF_8));
    const m = map[e._id];
    if (m && m.h === h) return;
    let ce = null;
    if (m && m.c) { try { ce = cal.getEventById(m.c); } catch (_) {} }
    if (!ce) ce = cal.createAllDayEvent(t.title, day_(e.date), {description: t.desc, location: t.loc});
    else { ce.setTitle(t.title); ce.setDescription(t.desc); ce.setLocation(t.loc); ce.setAllDayDate(day_(e.date)); }
    map[e._id] = {c: ce.getId(), h};
  });
  Object.keys(map).forEach(id => {        // אירוע שנמחק מהמערכת נמחק גם מהיומן (רק אירועים שהמנוע יצר)
    if (seen[id]) return;
    try { const ce = cal.getEventById(map[id].c); if (ce) ce.deleteEvent(); } catch (_) {}
    delete map[id];
  });
  P.setProperty('gcal', JSON.stringify(map));
}

/* ================= 2. תיקיות לקוח בדרייב ================= */
function rootFolder_() {
  const P = PropertiesService.getScriptProperties();
  const id = P.getProperty('root');
  if (id) { try { return DriveApp.getFolderById(id); } catch (_) {} }
  const it = DriveApp.getFoldersByName(ROOT_FOLDER);
  const f = it.hasNext() ? it.next() : DriveApp.createFolder(ROOT_FOLDER);
  P.setProperty('root', f.getId());
  return f;
}
function folderName_(e) {
  return [e.date || 'ללא תאריך', (e.client || 'לקוח').replace(/[\/\\:*?"<>|]/g, ' ').trim(), e.contractNo || e.quoteNo || ''].filter(Boolean).join(' · ');
}
function clientFolder_(e) {
  const P = PropertiesService.getScriptProperties();
  const map = JSON.parse(P.getProperty('folders') || '{}');
  const name = folderName_(e);
  let f = null;
  if (map[e._id]) { try { f = DriveApp.getFolderById(map[e._id]); } catch (_) {} }
  if (!f) { f = rootFolder_().createFolder(name); map[e._id] = f.getId(); P.setProperty('folders', JSON.stringify(map)); }
  else if (f.getName() !== name) f.setName(name);
  return f;
}
/* תיקייה נפתחת ללקוח מהשלב "הצעת מחיר" והלאה, והקישור אליה נשמר במערכת */
function syncFolders_(events) {
  const P = PropertiesService.getScriptProperties();
  const done = JSON.parse(P.getProperty('foldersLinked') || '{}');
  events.forEach(e => {
    if (isSide_(e) || idx_(e) < 2) return;
    const f = clientFolder_(e);
    const name = f.getName();
    if (done[e._id] === name) return;
    fsMerge_('/engine/' + e._id, {folderId: f.getId(), folderUrl: f.getUrl(), folderName: name, updated: new Date().toISOString()});
    done[e._id] = name;
  });
  P.setProperty('foldersLinked', JSON.stringify(done));
}

/* ================= קליטת קבצים (Web App) =================
   שולחים POST עם JSON: {auth:{idToken} או {token}, eventId, kind, name, mime, data(base64)}
   - מהמערכת: idToken של יוסי (נבדק מול Firebase)
   - מהאזור האישי: הטוקן האישי של הלקוח (נבדק מול portal/{token}) */
function doPost(req) {
  try {
    const b = JSON.parse(req.postData.contents);
    let eventId = null, who = '';
    if (b.auth && b.auth.idToken) {
      const r = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + API_KEY,
        {method: 'post', contentType: 'application/json', payload: JSON.stringify({idToken: b.auth.idToken}), muteHttpExceptions: true});
      const u = (JSON.parse(r.getContentText()).users || [])[0];
      if (!u || ADMINS.indexOf(u.email) < 0 || !u.emailVerified) return json_({ok: false, error: 'auth'});
      eventId = b.eventId; who = 'admin';
    } else if (b.auth && b.auth.token) {
      const p = fsGet_('/portal/' + encodeURIComponent(b.auth.token));
      if (!p || !p.eventId) return json_({ok: false, error: 'token'});
      eventId = p.eventId; who = 'client';
    } else return json_({ok: false, error: 'auth'});
    const raw = fsReq_('get', '/events/' + eventId);
    if (!raw) return json_({ok: false, error: 'event'});
    const e = JSON.parse(raw.fields.data.stringValue); e._id = eventId;
    const bytes = Utilities.base64Decode(b.data);
    if (bytes.length > 15 * 1024 * 1024) return json_({ok: false, error: 'size'});
    const kinds = {ref: 'אסמכתאות', receipt: 'קבלות', contract: 'חוזים', quote: 'הצעות מחיר', supplier: 'חשבוניות ספקים', other: 'קבצים'};
    const folder = clientFolder_(e);
    const sub = kinds[b.kind] || kinds.other;
    const it = folder.getFoldersByName(sub);
    const target = it.hasNext() ? it.next() : folder.createFolder(sub);
    const file = target.createFile(Utilities.newBlob(bytes, b.mime || 'application/octet-stream', (b.name || 'file').replace(/[\/\\]/g, '_')));
    const rec = {id: file.getId(), name: file.getName(), url: file.getUrl(), kind: b.kind || 'other', by: who, at: new Date().toISOString()};
    const cur = fsGet_('/engine/' + eventId) || {};
    const files = (cur.files || []).concat([rec]);
    fsMerge_('/engine/' + eventId, {files, folderId: folder.getId(), folderUrl: folder.getUrl(), folderName: folder.getName()});
    return json_({ok: true, file: rec});
  } catch (err) {
    return json_({ok: false, error: String(err).slice(0, 200)});
  }
}
function doGet() { return json_({ok: true, service: 'yossi-azulay-engine'}); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ================= 3. סיכום בוקר ================= */
function digestItems_(events) {
  const out = [];
  const add = (e, txt, urgent) => out.push({e, txt, urgent});
  events.forEach(e => {
    if (isSide_(e) || e.status === 'closed') return;
    const i = idx_(e), p = e.pay || {}, dep = p.deposit || {}, bal = p.balance || {};
    const to = e.date ? daysTo_(e.date) : null;
    const age = daysSince_(e.createdOn);
    if (i <= 1 && age !== null && age >= 1) add(e, `פנייה מלפני ${age} ימים בלי הצעת מחיר`, age >= 3);
    const qs = daysSince_(e.quoteSentOn);
    if (e.status === 'quote' && qs !== null) {
      if (qs >= 2 && !e.fu1) add(e, 'פולו-אפ ראשון על הצעת המחיר', qs >= 4);
      if (qs >= 7 && !e.fu2) add(e, qs === 7 ? 'פולו-אפ שני + שריון התאריך מסתיים היום' : 'פולו-אפ שני (שריון התאריך הסתיים)', true);
    }
    const cs = daysSince_(e.contractSentOn);
    if (cs !== null && cs >= 2 && !dep.received && i < 5) add(e, `טופס הזמנה נשלח לפני ${cs} ימים, מקדמה עוד לא התקבלה`, true);
    ['deposit', 'balance', 'flights'].forEach(k => { const x = p[k] || {}; if (x.received && x.receipt === 'pending') add(e, `להפיק קבלה ב-YAZ (${({deposit:'מקדמה',balance:'יתרה',flights:'טיסות'})[k]})`, true); });
    if (to !== null && i >= 5) {
      if (to === 45) add(e, '45 יום לאירוע: לוודא הגברה ובמה', false);
      if (to === 30) add(e, '30 יום לאירוע: מוזיקה סגורה + טופס אירוע ללקוח', false);
      if (to === 28 && !e.call) add(e, 'שיחת טלפון עם הלקוח על כל הפרטים', false);
      if (to <= 14 && to > 5 && !bal.received && !(e.sent || {}).balance) add(e, `${to} ימים לאירוע: תזכורת יתרה`, false);
      if (to <= 5 && to >= 0 && !bal.received) add(e, `${to} ימים לאירוע והיתרה לא התקבלה`, true);
      if (to === 1) add(e, 'מחר האירוע', true);
      if (to === 0) add(e, 'היום האירוע', true);
      if (to === -1) add(e, 'תודה + בקשת המלצה', false);
    }
  });
  return out.sort((a, b) => (b.urgent - a.urgent) || String(a.e.date).localeCompare(String(b.e.date)));
}
function morningDigest() {
  const events = loadEvents_();
  const items = digestItems_(events);
  const leads = events.filter(e => e.status === 'lead').length;
  const upcoming = events.filter(e => !isSide_(e) && e.date && daysTo_(e.date) >= 0 && daysTo_(e.date) <= 14 && idx_(e) >= 5)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!items.length && !upcoming.length) return;
  const row = it => `<tr><td style="padding:8px 10px;border-bottom:1px solid #eee;color:${it.urgent ? '#a3301f' : '#2b211c'}">${it.urgent ? '● ' : ''}${esc_(it.txt)}</td><td style="padding:8px 10px;border-bottom:1px solid #eee"><b>${esc_(it.e.client || '')}</b><br><span style="color:#806b5e">${fmt_(it.e.date)} · ${esc_(ETYPE[it.e.etype] || '')}</span></td></tr>`;
  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;color:#2b211c;max-width:640px">
   <h2 style="font-weight:400;margin:0 0 4px">בוקר טוב, יוסי</h2>
   <p style="color:#806b5e;margin:0 0 16px">${items.length} דברים לטיפול היום · ${leads} פניות חדשות על הלוח</p>
   ${items.length ? `<table style="border-collapse:collapse;width:100%;font-size:14px">${items.map(row).join('')}</table>` : ''}
   ${upcoming.length ? `<h3 style="font-weight:400;margin:22px 0 6px">אירועים בשבועיים הקרובים</h3><ul style="padding-right:18px;margin:0">${upcoming.map(e => `<li>${fmt_(e.date)} · ${esc_(e.client)} · ${esc_(e.venue || e.city || '')}</li>`).join('')}</ul>` : ''}
   <p style="margin-top:22px"><a href="${CRM_URL}" style="background:#2b211c;color:#f5f0e8;padding:10px 20px;border-radius:999px;text-decoration:none">פתיחת מערכת הניהול</a></p></div>`;
  MailApp.sendEmail({to: OWNER_EMAIL, subject: `סיכום בוקר · ${items.length} לטיפול`, htmlBody: html, name: 'מערכת ניהול – יוסי אזולאי'});
}
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])); }

/* ================= 4. גיבוי שבועי ל-Dropbox =================
   חיבור חד-פעמי: ב"הגדרות הפרויקט" > "מאפייני סקריפט" מוסיפים DROPBOX_KEY ו-DROPBOX_SECRET,
   פותחים את הקישור שמחזירה dropboxLink(), מאשרים, ומדביקים את הקוד ב-DROPBOX_CODE, ואז מריצים dropboxConnect. */
function dropboxLink() {
  const key = PropertiesService.getScriptProperties().getProperty('DROPBOX_KEY');
  const url = 'https://www.dropbox.com/oauth2/authorize?client_id=' + key + '&response_type=code&token_access_type=offline';
  Logger.log(url); return url;
}
function dropboxConnect() {
  const P = PropertiesService.getScriptProperties();
  const r = UrlFetchApp.fetch('https://api.dropboxapi.com/oauth2/token', {method: 'post', muteHttpExceptions: true,
    payload: {code: P.getProperty('DROPBOX_CODE'), grant_type: 'authorization_code', client_id: P.getProperty('DROPBOX_KEY'), client_secret: P.getProperty('DROPBOX_SECRET')}});
  const j = JSON.parse(r.getContentText());
  if (!j.refresh_token) throw new Error('Dropbox: ' + r.getContentText().slice(0, 200));
  P.setProperty('DROPBOX_REFRESH', j.refresh_token); P.deleteProperty('DROPBOX_CODE');
  Logger.log('Dropbox מחובר. מריץ גיבוי ראשון…'); weeklyBackup();
}
function dropboxToken_() {
  const P = PropertiesService.getScriptProperties();
  const rt = P.getProperty('DROPBOX_REFRESH'); if (!rt) return null;
  const r = UrlFetchApp.fetch('https://api.dropboxapi.com/oauth2/token', {method: 'post', muteHttpExceptions: true,
    payload: {refresh_token: rt, grant_type: 'refresh_token', client_id: P.getProperty('DROPBOX_KEY'), client_secret: P.getProperty('DROPBOX_SECRET')}});
  return JSON.parse(r.getContentText()).access_token || null;
}
function weeklyBackup() {
  const snap = {exportedAt: new Date().toISOString(), events: loadEvents_(),
    leads: fsList_('leads').map(d => { const o = {}; const f = d.fields || {}; Object.keys(f).forEach(k => o[k] = fromVal_(f[k])); o._id = d.name.split('/').pop(); return o; }),
    engine: fsList_('engine').map(d => { const o = {}; const f = d.fields || {}; Object.keys(f).forEach(k => o[k] = fromVal_(f[k])); o._id = d.name.split('/').pop(); return o; })};
  const body = JSON.stringify(snap, null, 1);
  const name = 'גיבוי ' + todayIso_() + '.json';
  // עותק גם בדרייב, בתיקיית "גיבויים"
  const root = rootFolder_(); const it = root.getFoldersByName('גיבויים');
  (it.hasNext() ? it.next() : root.createFolder('גיבויים')).createFile(name, body, 'application/json');
  const tok = dropboxToken_();
  if (!tok) { Logger.log('Dropbox עוד לא מחובר: הגיבוי נשמר בדרייב בלבד.'); return; }
  const r = UrlFetchApp.fetch('https://content.dropboxapi.com/2/files/upload', {method: 'post', muteHttpExceptions: true, contentType: 'application/octet-stream',
    headers: {Authorization: 'Bearer ' + tok, 'Dropbox-API-Arg': JSON.stringify({path: '/backup-' + todayIso_() + '.json', mode: 'overwrite'})},
    payload: Utilities.newBlob(body).getBytes()});
  if (r.getResponseCode() !== 200) throw new Error('Dropbox upload ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 200));
}
