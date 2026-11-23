/* Yossi Azulay — document templates (quotation + performance agreement), new ivory/espresso design.
   window.YDOC.quote(d) / window.YDOC.order(d)  ->  full HTML document string, ready to print / save as PDF.
   d.lang: 'he' | 'en'. Every field is optional; empty fields print as blank lines to fill by hand. */
(function(){
const BIZ='034392076', PHONE='+972 54 977 7758', MAIL='yossiazulaysales@gmail.com', WEB='www.yossi-azulay.com';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const P=s=>esc(s).split(/\n{2,}/).map(p=>`<p>${p.replace(/\n/g,'<br>')}</p>`).join('');
const blank=(v,w=36)=>v?`<b class="fill">${esc(v)}</b>`:`<span class="ln" style="min-width:${w}mm"></span>`;
const d2=iso=>iso?iso.split('-').reverse().join('/'):'';
const heDay=iso=>iso?new Date(iso+'T12:00').toLocaleDateString('he-IL',{weekday:'long'}).replace('יום ',''):'';
const heLong=iso=>{const t=iso?new Date(iso+'T12:00'):new Date();return t.toLocaleDateString('he-IL',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).replace(/,/g,'')};
const enLong=iso=>{const t=iso?new Date(iso+'T12:00'):new Date();return t.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})};
const num=n=>Number(n||0).toLocaleString('en-US');
const money=(n,cur)=>!n&&n!==0?'':cur==='EUR'?num(n)+'€':cur==='USD'?'$'+num(n):num(n)+' ₪';
const todayIso=()=>{const t=new Date();return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`};

const CSS=(lang,fontCss)=>`${fontCss||'<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Heebo:wght@300;400;500;700&display=swap" rel="stylesheet">'}
<style>
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;background:#f5f0e8;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:${lang==='he'?'Heebo,Lato':'Lato,Heebo'},Arial,sans-serif;color:#2b211c;font-size:12.5pt;line-height:1.42;font-weight:${lang==='he'?300:400}}
.pg{width:210mm;height:297mm;position:relative;padding:0 23mm;overflow:hidden;page-break-after:always;break-after:page;background:#f5f0e8}
.pg:last-of-type{page-break-after:auto;break-after:auto}
.hd{position:absolute;top:13mm;left:23mm;right:23mm;height:11mm;border-bottom:.8pt solid #c2b19f;display:flex;justify-content:space-between;align-items:center;direction:ltr}
.wm{font-family:Lato,Arial,sans-serif;font-size:12pt;letter-spacing:.42em;color:#2a211d}
.hn{font-family:Lato,Arial,sans-serif;font-size:8.5pt;color:#806b5e;letter-spacing:.02em}
.ft{position:absolute;bottom:12mm;left:23mm;right:23mm;border-top:.8pt solid #c2b19f;padding-top:3.2mm;display:flex;justify-content:space-between;direction:ltr;font-family:Lato,Arial,sans-serif;font-size:6.8pt;color:#806b5e;letter-spacing:.02em}
.body{position:absolute;top:30mm;bottom:24mm;left:23mm;right:23mm}
h1{font-weight:400;font-size:33pt;line-height:1.1;margin:0;color:#2b211c}
.sub{font-size:13.5pt;color:#6d4c3d;margin-top:2mm}
.where{font-size:15.5pt;color:#806b5e;margin-top:2mm}
.lab{font-size:9pt;font-weight:700;color:#6d4c3d;letter-spacing:.03em;text-transform:uppercase;text-decoration:underline;text-underline-offset:2px;margin:0 0 3mm}
.lab.plain{text-decoration:none}
.cn{font-size:17pt;font-weight:700;margin:0}
.co{font-size:12pt;font-weight:700;color:#806b5e;text-transform:uppercase;margin-top:1mm}
.short{width:19mm;border-top:.8pt solid #d8ccbe;margin:9mm 0 7mm}
.rule{border-top:.8pt solid #c2b19f;margin:5mm 0 4mm}
p{margin:0 0 3.6mm}
.fee{font-size:21.5pt;margin:2mm 0 4mm}
.note{font-size:10.5pt;color:#806b5e}
ul{margin:0 0 4mm;padding-inline-start:5mm}li{margin:0 0 .6mm}
.sign{display:flex;justify-content:space-between;align-items:flex-end;margin-top:6mm}
.sign .r{text-align:end;font-size:9pt;color:#806b5e;line-height:2.1;direction:ltr}
.mt{font-size:8.6pt;color:#806b5e}
/* agreement */
.ag{font-size:10.4pt;line-height:1.43;padding-bottom:14mm}
.ag p{margin:0 0 1.9mm}
.ag ol{margin:0;padding:0;list-style:none}
.ag li{margin:0 0 1.9mm;display:flex;gap:2.4mm}
.ag li>i{font-style:normal;min-width:7mm;color:#6d4c3d;font-weight:500}
.ag li>div{flex:1}
.ag .fill{font-weight:${lang==='he'?500:700};color:#2b211c}
.ln{display:inline-block;border-bottom:.7pt solid #8f7b6d;height:1.1em;vertical-align:baseline;margin:0 1mm}
.ag u{text-underline-offset:2px}
.meta{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3mm}
.meta .l{font-size:10pt;color:#806b5e;line-height:1.55}
.meta .l b{color:#2b211c;font-weight:${lang==='he'?500:700}}
.t2{font-size:19pt;font-weight:400;margin:0 0 3mm;color:#2b211c}
.sigs{position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;gap:20mm;font-size:10pt;color:#6d4c3d}
.sigs div{flex:1;border-top:.7pt solid #8f7b6d;padding-top:1.6mm;text-align:center}
.white,.white .pg{background:#fff}
.hdl{position:absolute;top:9mm;left:23mm;right:23mm;height:34mm}
.hdl img{position:absolute;left:50%;top:0;transform:translateX(-50%);width:46mm}
.hdl .mt2{position:absolute;right:0;top:2mm;font-size:8.6pt;line-height:1.6;color:#806b5e;text-align:right;direction:rtl}
.hdl .mt2.en{right:auto;left:0;text-align:left;direction:ltr}
.body.bl{top:44mm}
.white .ag{line-height:1.37}.white .ag li,.white .ag p{margin-bottom:1.5mm}
.ag .fill{text-decoration:underline;text-underline-offset:2px}
.fee b.fill{color:#8a6a4f;text-decoration:none}
.box{border:.7pt solid #d8ccbe;padding:3mm 4mm;margin:0 0 3mm;background:#f8f4ee}
</style>`;

const shell=(lang,title,pages,fontCss)=>`<!DOCTYPE html><html lang="${lang}" dir="${lang==='he'?'rtl':'ltr'}"><head><meta charset="utf-8"><title>${esc(title)}</title>${CSS(lang,fontCss)}</head><body>${pages.join('')}</body></html>`;
const page=(inner,n,N,right)=>`<section class="pg"><div class="hd"><span class="wm">YOSSI AZULAY</span><span class="hn">${right||''}</span></div><div class="body">${inner}</div><div class="ft"><span>YOSSI AZULAY MANAGEMENT &nbsp;/&nbsp; VAT NO. ${BIZ}</span><span>${n} &nbsp;/&nbsp; ${N}</span></div></section>`;

const logoUrl=()=>{try{return new URL('doc-logo.png',location.href).href}catch(_){return 'doc-logo.png'}};
const pageL=(inner,n,N,meta,logo,en)=>`<section class="pg"><div class="hdl"><img src="${esc(logo||logoUrl())}" alt="Yossi Azulay"><div class="mt2${en?' en':''}">${meta}</div></div><div class="body bl">${inner}</div><div class="ft"><span>YOSSI AZULAY MANAGEMENT &nbsp;/&nbsp; VAT NO. ${BIZ}</span><span>${n} &nbsp;/&nbsp; ${N}</span></div></section>`;

/* ---------------- texts ---------------- */
const ET={
 wedding:{en:'Wedding Ceremony',he:'כניסה לחופה',enW:'the wedding ceremony',heW:'טקס החופה'},
 aliyah:{en:'Bar Mitzvah – Aliyah',he:'בר מצווה – עלייה לתורה',enW:'the Bar Mitzvah celebration',heW:'חגיגת בר המצווה'},
 tefillin:{en:'Bar Mitzvah – Tefillin',he:'בר מצווה – הנחת תפילין',enW:'the Bar Mitzvah celebration',heW:'חגיגת בר המצווה'},
 barevent:{en:'Bar Mitzvah – Event',he:'בר מצווה – אירוע',enW:'the Bar Mitzvah celebration',heW:'חגיגת בר המצווה'},
 henna:{en:'Henna – Oriental Show',he:'חינה – מופע אוריינטלי',enW:'the henna celebration',heW:'חגיגת החינה'},
 other:{en:'Performance',he:'הופעה',enW:'the event',heW:'האירוע'}
};
const T={
 en:{sub:'Performance Quotation',pf:'Prepared for',dear:n=>`Dear ${n},`,
  open:(w,where,dt)=>`Following our conversation, I am pleased to present this proposal for Yossi Azulay's participation in ${w} taking place in ${where} on ${dt}.`,
  art:`At the heart of the musical program is Yossi's distinctive and deeply expressive voice, complemented by an extensive repertoire spanning classical works and traditional prayer.\n\nYossi brings more than two decades of experience performing at distinguished events around the world. Together, we have developed a precise working process that meets the level of coordination required for high-profile private celebrations, with careful attention to every detail.`,
  cerL:'The ceremony',
  cer:`Yossi will perform during the principal moments of the ceremony, with up to six songs selected in advance from his repertoire.\n\nUpon signing the agreement, the couple will receive access to Yossi's online repertoire. As plans may change while the event takes shape, there is no need to make a final choice at this stage. The songs and final musical details will be coordinated with the couple and the production team approximately six weeks before the ceremony.`,
  feeL:'Artist fee',inc:`The fee includes Yossi Azulay's performance and the attendance of his show manager.\nTravel and production expenses are not included.`,
  trL:'Travel & production',tr:n=>['Two round-trip flight tickets',`Two hotel rooms for ${n===1?'one night':n===3?'three nights':(n||2)===2?'two nights':n+' nights'}`,'Local transportation between the airport, hotel and venue','Stage, sound, lighting and amplification in accordance with the technical rider'],
  tr2:`All travel arrangements are coordinated by our office to align with Yossi's international performance schedule.\n\nThe client will receive the travel quotation no later than 30 days before the event, based on prevailing market rates at the time of booking and generally based on EL AL fares.`,
  resL:'Date reservation',res:`Due to the demand for Yossi's performances, particularly during the peak event season, the proposed date will be held exclusively for seven days from the date of this proposal.\n\nIf the booking does not progress to contract within this period, the date will be released and made available for other enquiries.`,
  conL:'Confirmation',con:p=>`The agreement will become effective upon signature and receipt of a ${p}% advance payment.`,
  bye:'Warm regards,',mgr:'Artist Manager',qn:'QUOTATION'},
 he:{sub:'הצעת מחיר להופעה',pf:'עבור',dear:n=>`${n} שלום,`,
  open:(w,where,dt)=>`בהמשך לשיחתנו, אני שמח להגיש הצעה להשתתפותו של יוסי אזולאי ב${w}, שיתקיים ב${where} בתאריך ${dt}.`,
  art:`בלב התוכנית המוזיקלית עומד קולו הייחודי והמרגש של יוסי, לצד רפרטואר רחב הנע בין יצירות קלאסיות לתפילה מסורתית.\n\nליוסי ניסיון של יותר משני עשורים בהופעות באירועים יוקרתיים בארץ ובעולם. יחד פיתחנו תהליך עבודה מדויק, שעומד ברמת התיאום הנדרשת באירועים פרטיים ברמה הגבוהה ביותר, עם תשומת לב לכל פרט.`,
  cerL:'הטקס',
  cer:`יוסי ילווה את הרגעים המרכזיים של הטקס, עם עד שישה שירים שייבחרו מראש מתוך הרפרטואר שלו.\n\nעם חתימת ההסכם תקבלו גישה לרפרטואר המקוון של יוסי. מאחר שהתוכניות עשויות להשתנות בזמן שהאירוע מתגבש, אין צורך לבחור כבר בשלב זה. השירים והפרטים המוזיקליים הסופיים יתואמו איתכם ועם צוות ההפקה כשישה שבועות לפני הטקס.`,
  feeL:'שכר האמן',inc:`המחיר כולל מע״מ, את הופעתו של יוסי אזולאי ואת נוכחות מנהל המופע.`,
  trL:'נסיעות והפקה',tr:n=>['שני כרטיסי טיסה הלוך-חזור',`שני חדרי מלון ל-${n||2} לילות`,'הסעות בין שדה התעופה, המלון ומקום האירוע','במה, הגברה ותאורה בהתאם למפרט הטכני'],
  tr2:`כל סידורי הנסיעה מתואמים על ידי המשרד שלנו, בהתאם ללוח ההופעות של יוסי בעולם.\n\nהצעת המחיר לנסיעות תישלח עד 30 יום לפני האירוע, לפי מחירי השוק במועד ההזמנה, ובדרך כלל לפי מחירי אל על.`,
  resL:'שמירת תאריך',res:`בשל הביקוש להופעותיו של יוסי, במיוחד בעונת האירועים, התאריך המוצע יישמר עבורכם באופן בלעדי למשך שבעה ימים ממועד הצעה זו.\n\nאם ההזמנה לא תתקדם לחתימה על הסכם בתוך תקופה זו, התאריך ישוחרר ויהיה פתוח לפניות נוספות.`,
  conL:'אישור ההזמנה',con:p=>`ההסכם ייכנס לתוקף עם חתימתו וקבלת מקדמה בשיעור ${p}% מהתמורה.`,
  bye:'בברכה,',mgr:'מנהל האמן',qn:'הצעת מחיר'}
};

/* ---------------- quotation ---------------- */
function quote(d,fontCss){
 const L=d.lang==='he'?'he':'en',t=T[L],et=ET[d.etype]||ET.other;
 const abroad=!!d.abroad, dep=d.depositPct||(abroad?50:25);
 const dt=d2(d.date), where=d.place||'';
 const title=d.title||(L==='he'?et.he:et.en);
 const opening=d.opening||t.open(L==='he'?et.heW:et.enW,where||'—',dt||'—');
 const p1=`<h1>${esc(title)}</h1><div class="sub">${esc(t.sub)}</div><div class="where">${esc([where,dt].filter(Boolean).join(' / '))}</div>
  <div style="margin-top:8mm" class="lab plain">${esc(t.pf)}</div><div class="cn">${esc(d.client||'')}</div>${d.company?`<div class="co">${esc(d.company)}</div>`:''}
  <div class="short"></div>
  ${d.contact||d.client?`<p>${esc(t.dear(d.contact||d.client))}</p>`:''}${P(opening)}<div style="height:2mm"></div>${P(d.art||t.art)}
  <div class="lab" style="margin-top:5mm">${esc(d.cerLabel||t.cerL)}</div>${P(d.ceremony||t.cer)}`;
 const inc=d.includes||(abroad?T.en.inc:t.inc);
 const p2=`<div class="lab" style="margin-top:4mm">${esc(t.feeL)}</div><div class="fee">${esc(money(d.fee,d.cur||(abroad?'EUR':'ILS')))}</div><div class="note">${P(L==='he'&&abroad?`המחיר כולל את הופעתו של יוסי אזולאי ואת נוכחות מנהל המופע.\nהוצאות הנסיעה וההפקה אינן כלולות.`:inc)}</div>
  ${abroad?`<div class="rule"></div><div class="lab">${esc(t.trL)}</div><ul>${t.tr(d.nights).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${P(t.tr2)}`:''}
  <div class="rule"></div><div class="lab">${esc(t.resL)}</div>${P(t.res)}
  <div class="lab" style="margin-top:6mm">${esc(t.conL)}</div>${P(t.con(dep))}
  <div class="sign"><div><p style="margin-bottom:3mm">${esc(t.bye)}</p><div style="font-size:12.7pt">${esc(t.mgr)}</div></div><div class="r">${PHONE}<br>${MAIL}<br>${WEB}</div></div>`;
 const right=L==='he'?`<span dir="rtl">הצעת מחיר ${esc(d.no||'')} &nbsp;/&nbsp; ${d2(d.docDate||todayIso())}</span>`:`QUOTATION &nbsp;${esc(d.no||'')} &nbsp;/&nbsp; ${d2(d.docDate||todayIso())}`;
 const dd=(d.docDate||todayIso()).split('-').reverse().join('.');
 const meta=L==='he'?`הצעת מחיר מס׳ ${esc(d.no||'')}<br>תאריך: ${dd}`:`Quotation no. ${esc(d.no||'')}<br>Date: ${dd}`;
 return shell(L,`${t.qn} ${d.no||''} · ${d.client||''}`,[pageL(p1,1,2,meta,d.logo,L!=='he'),pageL(p2,2,2,meta,d.logo,L!=='he')],fontCss).replace('<body>','<body class="white">');
}

/* ---------------- agreement / order form ---------------- */
function orderHe(d,fontCss){
 const fee=d.fee?num(d.fee):'';const dep=d.depositPct||25;
 const dd=(d.docDate||todayIso()).split('-').reverse().join('.');
 const meta=`בס״ד<br>יוסי אזולאי · עוסק מורשה ${BIZ}<br>הזמנה מס׳ ${esc(d.no||'')}<br>תאריך: ${dd}`;
 const c1=`<h2 class="t2" style="text-align:center">הסכם להזמנת הופעה – יוסי אזולאי</h2>
 <div class="ag">
 <p>אני/אנו הח״מ המזמין: ${blank(d.client,60)} ת.ז / ח.פ: ${blank(d.idno,34)}</p>
 <p>רחוב ${blank(d.street,34)} מס׳ ${blank(d.house,10)} יישוב ${blank(d.city,28)} טל׳: ${blank(d.phone2,30)}</p>
 <p>טל׳ נייד: ${blank(d.phone,40)} דוא״ל: ${blank(d.email,60)}</p>
 <p>מזמין בזאת מאת <b>יוסי אזולאי</b> ע.מ ${BIZ} (להלן: <b>״האמן״</b>) את הופעת האמן, בתנאים שמפורטים בהסכם זה להלן:</p>
 <ol>
 <li><i>1.</i><div>מהות ההופעה: ${blank(d.nature,30)} &nbsp; סוג האירוע: ${blank(d.etypeHe,24)}<br>
 מקום ההופעה: ${blank(d.venue,50)} &nbsp; תאריך: ${blank(d2(d.date),22)} &nbsp; יום: ${blank(heDay(d.date),14)}<br>
 שעת התחלת האירוע: ${blank(d.startTime,16)} &nbsp; שעת המופע: ${blank(d.showTime,16)} &nbsp; שעת סיום: ${blank(d.endTime,16)}<br>
 <u>צוות:</u> ${blank(d.team,60)}<br>
 <u>הערות:</u> ${d.notes?`<b class="fill">${esc(d.notes)}</b>`:''}<br>
 <u><b>התמורה:</b></u> המזמין ישלם לאמן עבור ההופעה, בצירוף מע״מ כדין ובסה״כ סך של ${fee?`<span class="fee" style="font-size:inherit;margin:0"><b class="fill">${fee}</b></span> ₪`:blank('',26)}. (כשכר קבלן עצמאי המספק שירותי בידור).</div></li>
 <li><i>2.</i><div><u><b>תנאי תשלום:</b></u> חתימת הסכם זה, תשלום ופירעון המקדמה מהווים תנאי לתוקפו של הסכם זה. ככל והמזמין לא חתם על ההסכם ו/או המקדמה לא תשולם ו/או לא תיפרע, במלואה ובמועדה, לא יהיה להסכם זה שום תוקף.</div></li>
 <li><i>2.1</i><div>המזמין ישלם לאמן <b>מקדמה</b> בשיעור <b>${dep}%</b> מהתמורה במועד חתימת הסכם זה.<br>המזמין ישלם לאמן את יתרת התמורה, כתנאי לקיום ההופעה, <b>עד 5 ימים לפני האירוע,</b> ככל שיתרת התמורה לא שולמה ו/או נפרעה במועדה, האמן יהיה רשאי שלא לקיים את ההופעה, מבלי לגרוע מחובת המזמין לשלם לאמן את מלוא סכום התמורה ולמזמין לא תהיה שום עילת תביעה נגד האמן בגין אי קיום ההופעה.</div></li>
 <li><i>3.</i><div>המזמין מתחייב בזאת לספק לאמן, לצורך ההופעה, תנאים נאותים ומתאימים, לרבות נקודות חשמל תקינות, ולהעמידם לרשות האמן עד ל- 3 שעות טרם מועד האירוע.</div></li>
 <li><i>4.</i><div>המזמין מתחייב לדאוג כי מקום האירוע ממלא את כל הדרישות הבטיחותיות עפ״י החוק, בהתאם לדרישות כל הרשויות הרלוונטיות, ומצהיר כי בדק וכי למקום האירוע כל האישורים והרישיונות הנדרשים.</div></li>
 <li><i>5.</i><div>במקרה בו יחולו תקלות ו/או שיבושים שאינם תלויים באמן, לרבות הפסקות חשמל הנגרמות מעומס יתר במקום ו/או התנהגות פרועה של הקהל ו/או חלק ממנו, רשאי האמן, על פי שיקול דעתו, שלא לקיים את ההופעה והמזמין מתחייב לשלם לאמן את מלוא התמורה, גם אם לא קוימה ההופעה ולא תהיה לו שום טענה ו/או דרישה ו/או תביעה נגד האמן עקב כך.</div></li>
 <li><i>6.</i><div><u><b>ביטול/שינוי מועד הופעה:</b></u> המזמין רשאי לבטל את תוקפו של הסכם זה, תוך 48 שעות ממועד חתימתו. במקרה כאמור, האמן יחזיר לידי המזמין את סכום המקדמה ששולם לידיו ונפרע, ככל ששולם ונפרע.</div></li>
 <li><i>6.1</i><div>ככל שהמזמין יבטל את הזמנת ההופעה עד ל- 30 ימים טרם מועד ההופעה המוזמן, ישלם המזמין לאמן פיצוי מוסכם וקבוע מראש, ללא הוכחת נזק, בסך מחצית מסכום התמורה שנקבעה עבור ההופעה כאמור לעיל.</div></li>
 <li><i>6.2</i><div>ככל שהמזמין יבטל את הזמנת ההופעה במועד שהוא פחות מ- 30 ימים טרם מועד ההופעה המוזמן, ישלם המזמין לאמן פיצוי מוסכם וקבוע מראש, ללא הוכחת נזק, בסך מלוא סכום התמורה בגין ההזמנה.</div></li>
 <li><i>7.</i><div>במקרה בו, מכל סיבה שהיא, שאינה תלויה באמן, יחול עיכוב בתחילת ההופעה של למעלה מ- 60 דקות מהמועד שהוזמן כאמור לעיל, רשאי האמן, על פי שיקול דעתו, שלא לקיים את ההופעה, מבלי לגרוע מחובת המזמין לשלם לאמן את מלוא התמורה דלעיל.</div></li>
 </ol></div>`;
 const c2=`<div class="ag"><ol>
 <li><i>8.</i><div>איחור של האמן עד ל- 20 דקות מהמועד שהוזמן לעיל, מכל סיבה שהיא, בין אם התקיימה ההופעה ובין אם לא התקיימה, לא יחשב כהפרה של התחייבויות האמן והמזמין ישלם לאמן את מלוא התמורה הנקובה לעיל. במקרה בו האמן איחר להופעה בפרק זמן של למעלה מ- 20 דקות כאמור והמזמין <b>הסכים</b> להופעתו באיחור, ישלם המזמין לאמן את מלוא התמורה הנקובה לעיל ולא תהיה לו כל טענה ו/או דרישה ו/או תביעה נגד האמן.</div></li>
 <li><i>9.</i><div>במקרה של כוח עליון, לרבות מלחמה, מצב חירום, גיוס האמן, שביתה ו/או השבתה שתמנע הגעה ו/או את קיום ההופעה, מחלת האמן, אבל, לרבות אבל לאומי, פגעי טבע, חוסר אפשרות לנוע בכבישים, צווים, מצב כוננות ו/או כל פעולה או מעשה או מחדל שאינם מאפשרים את קיום הופעה תקינה ואינם תלויים באמן ו/או שאינם בשליטתו, האמן יהא פטור ממילוי התחייבויותיו לקיום הופעה במועד שהוזמן כמפורט לעיל. במקרה כאמור, האמן יחזיר למזמין את התמורה ששילם לידיו עבור ההופעה, ככל ששילם ולמזמין לא תהיה שום טענה ו/או דרישה ו/או תביעה נגד האמן והוא לא יהיה זכאי לשום פיצוי מכל סוג שהוא.</div></li>
 <li><i>10.</i><div><b>ביטול או דחיית הופעה עקב נסיבות חירום</b><br>לנוכח הניסיון שנצבר בישראל ובעולם באשר לשינויים במצב הביטחוני, הבריאותי ובהנחיות הרשויות, מוסכם כי ביטול ההופעה או שינוי מועדה עקב נסיבות אלה ייעשו רק ככל שהנחיות מחייבות של הרשויות המוסמכות, לרבות <b>פיקוד העורף</b>, מונעות את קיום ההופעה במתכונת המוסכמת, או בהסכמה מראש ובכתב של שני הצדדים. חשש או שיקול דעת של המזמין בלבד לא יקנו זכות לביטול או לדחייה כאמור.<br><br>
 <b>המקדמה משולמת עבור שריון מועד ההופעה</b> וההיערכות לקראתה, <b>ולא תוחזר במקרה של ביטול ביוזמת המזמין</b>, בכפוף להוראות הדין.<br>
 ככל שהנחיות כאמור ימנעו את קיום ההופעה, יפעלו הצדדים בתום לב ובמאמץ סביר למציאת מועד חלופי או פתרון אחר המוסכם על שניהם, והמקדמה תיזקף לזכות המזמין במסגרת הפתרון שיוסכם.<br>
 רק אם, לאחר בחינת החלופות בתוך פרק זמן סביר, לא יימצא פתרון המתאים לשני הצדדים, תבוטל ההזמנה ויוחזרו למזמין 50% מהמקדמה ששולמה בפועל.<br>יתרת המקדמה תישאר בידי נותן השירות.<br><br>
 אין באמור כדי לגרוע מזכויות שלא ניתן להתנות עליהן על פי דין.</div></li>
 <li><i>11.</i><div>לאמן אין ולא תהיה כל אחריות לאיכות הצליל (סאונד) בכל הקלטת וידאו ו/או אודיו שבוצעה במהלך הופעתו, לרבות באמצעות צלם המתעד את האירוע מטעם המזמין והאחריות לכך היא של הצלם מטעם המזמין בלבד. למזמין אין ולא תהיה והוא מוותר על כל טענה ו/או דרישה ו/או תביעה נגד האמן בגין האמור.</div></li>
 <li><i>12.</i><div>במקרה בו המזמין יפר הוראה מהוראות הסכם זה, ישלם המזמין לאמן, עם דרישה, את מלוא התמורה המפורטת לעיל. מובהר ומוסכם כי הסכומים ומועדי התשלומים כמפורט לעיל הם תנאים יסודיים ומהותיים בהסכם זה. לכל תשלום שלא יפרע במועד הקבוע בהסכם זה תתווסף ריבית חריגה כמקובל בבנק לאומי לישראל, מהמועד שנקבע לתשלום ועד הפירעון המלא בפועל בנוסף לכל סעד אחר העומד לזכות האמן.</div></li>
 <li><i>13.</i><div>הסכם זה מהווה את כל המוסכם בין הצדדים ומבטל כל הסכם, זיכרון דברים, מצג, התחייבות, הבנה וכד׳ קודמים שבין האמן למזמין, בעל-פה ו/או בכתב, כל שינוי ו/או תיקון בהסכם זה יעשה בכתב.</div></li>
 <li><i>14.</i><div>מוסכם בזאת כי כל מחלוקת בין הצדדים תידון בבית המשפט המוסמך בת״א לו מקנים הצדדים סמכות שיפוט בלעדית.</div></li>
 </ol><p style="margin-top:3mm">בברכה,<br>מנהל האמן</p></div>`;
 const sig=`<div class="sigs"><div>חתימת המזמין</div><div>מנהל האמן</div></div>`;
 return shell('he',`הזמנה ${d.no||''} · ${d.client||''}`,[pageL(c1,1,2,meta,d.logo),pageL(c2+sig,2,2,meta,d.logo)],fontCss).replace('<body>','<body class="white">');
}

function orderEn(d,fontCss){
 const dep=d.depositPct||50;
 const dd=(d.docDate||todayIso()).split('-').reverse().join('.');
 const meta=`Bs”d<br>Yossi Azulay · Licensed Dealer No. ${BIZ}<br>Order no. ${esc(d.no||'')}<br>Date: ${dd}`;
 const head='';
 const right=`ORDER &nbsp;${esc(d.no||'')}`;
 const nights=d.nights||2;
 const c1=`<h2 class="t2" style="text-align:center">Performance Agreement</h2><div class="ag">
 <p>I/We the undersigned (hereinafter: the “Client”): ${blank(d.client,70)}</p>
 <p>Passport no. ${blank(d.idno,36)} Address: ${blank(d.street,70)}</p>
 <p>Country: ${blank(d.country,40)} Mobile: ${blank(d.phone,40)}</p>
 <p>E-mail: ${blank(d.email,80)}</p>
 <p>Hereby order from Yossi Azulay (hereinafter: the “Artist”) the Artist’s performance, under the conditions specified herein below:</p>
 <div class="box">The date of the performance: ${blank(d2(d.date),24)} &nbsp; The type of the performance: ${blank(d.typeEn,40)}<br>
 Location of the performance: ${blank(d.venue,90)}<br>
 Start time of the performance: ${blank(d.showTime,20)} &nbsp; Staff: ${blank(d.team||'Yossi Azulay + Show manager',60)}<br>
 <b>Fee:</b> The Client will pay the Artist for the performance, a total fee of ${d.fee?`<b class="fill">${esc(money(d.fee,d.cur||'EUR'))}</b>`:blank('',26)}<br>
 The price is not including expenses (Flights, Hotels etc).${d.notes?`<br>Notes: <b class="fill">${esc(d.notes)}</b>`:''}</div>
 <ol>
 <li><i>1.</i><div><b>Terms of Payment:</b> This contract will come into force upon receiving the contract signed by the client, and our office receiving a ${dep}% advance payment.</div></li>
 <li><i>2.1</i><div>The Client commits to pay the Artist the balance of the fee as a condition for staging the performance, up to 5 days before the event, as a condition for the artist going on stage or cash before the show.</div></li>
 <li><i>2.</i><div>The Client commits to provide the Artist with appropriate conditions, including a stage (according to specification), intact power points, lighting, and appropriate amplification (per specifications provided by the Artist), and make sure they are available to the Artist at least 3 hours prior to the event. In case the Client does not provide all of the above in a way that enables staging the performance in the Artist's opinion, the Artist is permitted, at his discretion, not to stage the performance, and the Client agrees to pay the Artist the full fee, even if the performance was not staged, and consequently the Client shall have no complaint, demand, or claim against the Artist.</div></li>
 <li><i>3.</i><div>Any payment required for playing music in a public place is under the Client's responsibility.</div></li>
 <li><i>4.</i><div>The Client commits to ensure that the event venue fulfills all safety requirements by law, in accordance with all the relevant authorities’ requirements, and declares that he has checked the matter and that the event venue holds all required permits and licenses.</div></li>
 <li><i>5.</i><div>The Artist is not responsible for the quality of the sound amplification system which is installed at the performance venue. The responsibility for the quality of the sound will be borne only by the sound company. Also, the Artist is not responsible for the quality of the sound in any video and/or audio recording made during his performance.</div></li>
 </ol></div>`;
 const c2=`<div class="ag"><ol>
 <li><i>6.</i><div><b>Cancellation/Change in performance schedule:</b> The Client may cancel this Agreement within 48 hours from the time of its signing. In such a case, the Artist shall return to the Client the advance payment that was paid, in so far as such was paid.</div></li>
 <li><i>6.1</i><div>In so far as the Client cancels the order for the performance "Non COVID related" 30 days or more prior to the date of the performance, the Client shall pay the Artist half of the fee agreed upon above for the performance.</div></li>
 <li><i>6.2</i><div>In so far as the Client cancels the order for the performance "Non COVID related" less than 30 days prior to the date of the performance, the Client shall pay the Artist the full amount of the fee agreed upon above for the performance.</div></li>
 <li><i>7.</i><div>In the event that the Client breaches any provision of this Agreement, the Client shall pay the Artist, upon demand, the full fee specified above. It is clarified and agreed that the amounts and payment dates set forth above are fundamental and material conditions of this Agreement.</div></li>
 <li><i>8.</i><div>At the client's request, any visual content, photography, video, or other documentation from the event will not be uploaded to the internet, published, or used for any other purpose without the client's explicit prior written consent. We undertake to respect the client's privacy and act in accordance with their instructions on this matter.</div></li>
 <li><i>9.</i><div>In the case of force majeure on the part of both sides, including war, a state of emergency, the Artist being drafted into the Army, a strike and/or lockout that prevents the arrival of the Artist, mourning, natural disasters, or any omission that doesn't enable staging a proper performance and are not dependent on the Artist/Client, both sides will be released from fulfilling their obligations.<br>In such a case, in accordance with a prior agreement between the parties, the Client will be given the option to postpone the date – accordingly to Yossi's availability, which will be approved in advance, before choosing the new date.<br>* The client understands that Israel is currently in a state of war and therefore this section speaks of a worsening situation.</div></li>
 </ol>
 <p style="margin-top:3mm"><b>Additional costs:</b></p><ol>
 <li><i>1.</i><div>Flights: 2 tickets for Yossi Azulay and his show manager. We prefer to book the tickets by ourselves, it's effective in case of schedule changes that need to be made. The fares for the tickets will be charged according to the current price on the same day of booking. The client is required to make the wire transfer of that amount.</div></li>
 <li><i>2.</i><div>2 Hotel rooms for ${nights} nights.</div></li>
 <li><i>3.</i><div>Travel transport: airport &gt; hotel &gt; show &gt; hotel &gt; airport</div></li>
 <li><i>4.</i><div>Technical Equipment: The customer commits to provide a stage, lighting, and amplification for the show according to the technical specifications which will be provided by us.</div></li>
 </ol><p style="margin-top:4mm">Regards,<br>The Artist’s Manager</p></div>`;
 const sig=`<div class="sigs"><div>The Client</div><div>The Artist’s Manager</div></div>`;
 return shell('en',`Order ${d.no||''} · ${d.client||''}`,[pageL(c1,1,2,meta,d.logo,true),pageL(c2+sig,2,2,meta,d.logo,true)],fontCss).replace('<body>','<body class="white">');
}
const order=(d,f)=>d.lang==='he'?orderHe(d,f):orderEn(d,f);
const api={quote,order,ET};
if(typeof window!=='undefined')window.YDOC=api;
if(typeof module!=='undefined')module.exports=api;
})();
