/* מנוע האוטומציות של מערכת הניהול – יוסי אזולאי
   רץ בחשבון הגוגל של יוסי, כל 10 דקות.
   שלב 1: סנכרון יומן גוגל (כמו האוטומציה של מנדיי). */

const PROJECT = 'yossi-azulay';
const CRM_URL = 'https://yossiazulaysales.github.io/yossi-azulay-site/admin.html';
const STAGE = {lead:'פנייה חדשה',checking:'בדיקת זמינות',quote:'הצעת מחיר נשלחה',contract:'חוזה נשלח',deposit:'ממתין למקדמה',
  booked:'סגור · מקדמה התקבלה',prep:'הכנה לאירוע',ready:'טופס אירוע אושר',done:'האירוע בוצע',closed:'סגור סופית',
  nurture:'לא סגר',irrelevant:'לא רלוונטי',taken:'תאריך תפוס'};
const ETYPE = {wedding:'חתונה – כניסה לחופה',tefillin:'בר מצווה – הנחת תפילין',aliyah:'בר מצווה – עלייה לתורה',henna:'חינה – מופע מזרחי',other:'אירוע'};
const CUR = {ILS:'₪',EUR:'€',USD:'$'};

/* הפעלה ראשונה: מריצים פעם אחת את setup (מאשרים הרשאות), והוא קובע ריצה אוטומטית כל 10 דקות */
function setup() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('run').timeBased().everyMinutes(10).create();
  run();
}

function run() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try { syncCalendar(); } finally { lock.releaseLock(); }
}

/* ---------- Firestore (קריאה בלבד, בהרשאות של החשבון) ---------- */
function fsList(coll) {
  const out = []; let tok = '';
  do {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${coll}?pageSize=300` + (tok ? '&pageToken=' + tok : '');
    const r = UrlFetchApp.fetch(url, {headers: {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()}, muteHttpExceptions: true});
    if (r.getResponseCode() !== 200) throw new Error('Firestore ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 300));
    const j = JSON.parse(r.getContentText());
    (j.documents || []).forEach(d => out.push(d));
    tok = j.nextPageToken || '';
  } while (tok);
  return out;
}

/* ---------- יומן גוגל ---------- */
function money(n, cur) { return n ? Number(n).toLocaleString('en-US') + ' ' + (CUR[cur] || '₪') : ''; }

function calText(e) {
  const d = e.doc || {}, q = e.quote || {}, p = e.pay || {};
  const where = e.venue || e.city || '';
  const title = [STAGE[e.status] || e.status, ETYPE[e.etype] || '', where ? 'ב"' + where + '"' : '', e.client || '', e.phone || '']
    .filter(Boolean).join(' · ');
  const fee = q.basePrice || d.fee || '';
  const times = [d.startTime && 'התחלת אירוע ' + d.startTime, d.showTime && 'מופע ' + d.showTime, d.endTime && 'סיום ' + d.endTime, e.hours].filter(Boolean).join(' · ');
  const dep = p.deposit || {};
  const lines = [
    ['איש קשר + טלפון', [e.client, e.couple, e.phone].filter(Boolean).join(' · ')],
    ['מייל', e.email],
    ['מקום', [e.venue, e.city, e.country].filter(Boolean).join(', ')],
    ['שעות', times],
    ['צוות', d.team],
    ['הצעת מחיר מס׳', e.quoteNo],
    ['טופס הזמנה מס׳', e.contractNo],
    ['חוזה', e.contract === 'signed' ? 'חתום' : e.contract === 'sent' ? 'נשלח' : ''],
    ['מחיר', money(fee, q.cur || d.cur)],
    ['מקדמה', dep.received ? 'התקבלה' + (dep.method ? ' · ' + dep.method : '') + (dep.date ? ' · ' + dep.date : '') : ''],
    ['חשבונית מקדמה', dep.receipt && dep.receipt !== 'pending' ? dep.receipt : ''],
    ['הגברה', e.sound],
    ['מוסיקה', e.music],
    ['הערות', e.notes],
  ].filter(x => x[1]).map(x => x[0] + ': ' + x[1]);
  lines.push('', 'במערכת: ' + CRM_URL);
  return {title, desc: lines.join('\n'), loc: [e.venue, e.city, e.country].filter(Boolean).join(', ')};
}

function syncCalendar() {
  const cal = CalendarApp.getDefaultCalendar();
  const P = PropertiesService.getScriptProperties();
  const map = JSON.parse(P.getProperty('gcal') || '{}');
  const seen = {};
  fsList('events').forEach(doc => {
    const id = doc.name.split('/').pop();
    const raw = doc.fields && doc.fields.data && doc.fields.data.stringValue;
    if (!raw) return;
    const e = JSON.parse(raw);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date || '')) return;
    seen[id] = 1;
    const t = calText(e);
    const h = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, [t.title, t.desc, t.loc, e.date].join('|'), Utilities.Charset.UTF_8));
    const m = map[id];
    if (m && m.h === h) return;
    const day = Utilities.parseDate(e.date, 'Asia/Jerusalem', 'yyyy-MM-dd');
    let ce = null;
    if (m && m.c) { try { ce = cal.getEventById(m.c); } catch (_) {} }
    if (!ce) ce = cal.createAllDayEvent(t.title, day, {description: t.desc, location: t.loc});
    else { ce.setTitle(t.title); ce.setDescription(t.desc); ce.setLocation(t.loc); ce.setAllDayDate(day); }
    map[id] = {c: ce.getId(), h: h};
  });
  // אירוע שנמחק מהמערכת – נמחק גם מהיומן (רק אירועים שהמנוע עצמו יצר)
  Object.keys(map).forEach(id => {
    if (seen[id]) return;
    try { const ce = cal.getEventById(map[id].c); if (ce) ce.deleteEvent(); } catch (_) {}
    delete map[id];
  });
  P.setProperty('gcal', JSON.stringify(map));
}
