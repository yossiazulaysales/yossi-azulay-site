<script type="module">
/* Client personal area: reads one portal/{token} document, writes back only the client's answers (resp). */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const app = initializeApp({
  apiKey: "AIzaSyBQg7PvR6yxFbU_Lkpd4MvAq88fROldjZ0", authDomain: "yossi-azulay.firebaseapp.com", projectId: "yossi-azulay",
  storageBucket: "yossi-azulay.firebasestorage.app", messagingSenderId: "884186379961", appId: "1:884186379961:web:9d6559a66c97fc7ead8d68"
});
const db = getFirestore(app);
const C = window.__crm, gate = document.getElementById('gate');
const token = (window.__PORTAL && window.__PORTAL.token || '').trim();
const msg = (he, en) => { gate.innerHTML = `<div class="gbox"><img src="logo-mark.png" alt=""><h2>${he}</h2><p>${en}</p></div>`; };
if (!/^[A-Za-z0-9]{16,64}$/.test(token)) msg('הקישור לא תקין', 'This link is not valid. Please use the link you received.');
else {
  msg('טוען…', 'Loading…');
  const ref = doc(db, 'portal', token);
  let first = true, lastResp = '';
  const respOf = e => ({
    quoteApproved: !!e.quoteApproved, quoteApprovedAt: e.quoteApprovedAt || '',
    signed: e.contract === 'signed', sigImg: e.contract === 'signed' ? (e.sigImg || '') : '', signedAt: e.signedAt || '',
    eventForm: e.eventForm || null, songs: e.songs || null, songsFinal: !!e.songsFinal,
    refs: Object.fromEntries(['deposit','balance','flights'].map(k => [k, {name: (e.pay[k]||{}).ref || '', url: (e.pay[k]||{}).refUrl || ''}]))
  });
  const overlay = (e, r) => {           // the client's own answers, until the office confirms them
    if (!r) return;
    if (r.quoteApproved) { e.quoteApproved = true; e.quoteApprovedAt = e.quoteApprovedAt || r.quoteApprovedAt; }
    if (r.signed && e.contractNo) { e.contract = 'signed'; e.sigImg = e.sigImg || r.sigImg; e.signedAt = e.signedAt || r.signedAt; }
    if (r.eventForm && !e.eventForm) e.eventForm = r.eventForm;
    if (r.songs) e.songs = r.songs; if (r.songsFinal) e.songsFinal = true;
    for (const k of ['deposit','balance','flights']) { const x = (r.refs||{})[k]; if (x && x.name && !e.pay[k].ref) { e.pay[k].ref = x.name; e.pay[k].refUrl = x.url; } }
  };
  onSnapshot(ref, d => {
    if (!d.exists()) { msg('הקישור לא נמצא', 'This link was not found. Please contact us.'); return; }
    const x = d.data();
    const busy = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.querySelector('#modal.on');
    if (!first && busy) return;
    Object.assign(window.SETTINGS, x.settings || {});
    const e = JSON.parse(x.data || '{}');
    e.log = []; e.pay = e.pay || {}; for (const k of ['deposit','balance','flights']) e.pay[k] = Object.assign({received: false, ref: ''}, e.pay[k] || {});
    overlay(e, x.resp);
    C.EVENTS.length = 0; C.EVENTS.push(e); C.S.portalEv = e.id;
    lastResp = JSON.stringify(respOf(e));
    if (first) {
      first = false; gate.innerHTML = ''; C.S.view = 'portal';
      C.S.ptab = e.contract === 'signed' ? (e.pay.deposit.received ? 'songs' : 'pay') : e.quoteApproved && e.contractNo ? 'contract' : 'quote';
      document.title = (e.lang === 'he' ? 'האזור האישי · ' : 'Personal area · ') + 'Yossi Azulay';
    }
    origRender();
  }, err => msg('לא ניתן לטעון את האזור האישי', 'Could not load your personal area (' + (err.code || err.message) + ').'));
  /* after every client action: push the answers */
  const origRender = C.render;
  const push = () => { const e = C.EVENTS[0]; if (!e || first) return;
    const j = JSON.stringify(respOf(e));
    if (j !== lastResp) { lastResp = j; updateDoc(ref, {resp: JSON.parse(j), respAt: serverTimestamp()}).catch(err => C.toast('השמירה לא הצליחה / Could not save: ' + (err.code || err.message))); } };
  let pt = null; const later = () => { clearTimeout(pt); pt = setTimeout(push, 400); };
  ['click','change','submit','input'].forEach(t => document.addEventListener(t, later, true));
  setInterval(push, 3000);
  const b64 = f => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(f); });
  window.__upload = async (file, kind) => {
    const url = (window.SETTINGS || {}).uploadUrl; if (!url) throw new Error('—');
    if (file.size > 15 * 1024 * 1024) throw new Error('> 15MB');
    const res = await fetch(url, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify({auth: {token}, kind, name: file.name, mime: file.type, data: await b64(file)})});
    const j = await res.json(); if (!j.ok) throw new Error(j.error || 'error'); return j.file;
  };
  window.addEventListener('hashchange', () => location.reload());
}
</script>
