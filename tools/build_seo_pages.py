"""Builds real pages for the old Wix addresses Google already knows (/bio, /albums, /gallery ...),
so they answer 200 with their own title and canonical instead of 404. Run after every change to index.html:
python3 tools/build_seo_pages.py"""
import pathlib, re, html
root = pathlib.Path(__file__).resolve().parent.parent
SITE = 'https://yossi-azulay.com'
PAGES = [  # path, start page, language, title, description
 ('bio','about','he','ביוגרפיה · Bio | יוסי אזולאי','הסיפור של יוסי אזולאי: נולד בירושלים, מ-1996 בלהקה צבאית, אלבומי "תפילות" שהפכו לפלטינה כפולה, ומאז 2004 זמר חופות בישראל ובעולם.'),
 ('englishbio','about','en','Biography | Yossi Azulay','Yossi Azulay, singer, songwriter and music producer from Jerusalem. Chuppah entrances, Bar Mitzvahs and Jewish ceremonies in Israel and worldwide since 2004.'),
 ('frenchbio','about','fr','Biographie | Yossi Azulay','Yossi Azulay, chanteur, auteur et producteur de Jérusalem. Entrées sous la houppa, Bar Mitzvah et cérémonies juives en Israël et dans le monde depuis 2004.'),
 ('albums','albums','he','אלבומים · Albums | יוסי אזולאי','הדיסקוגרפיה של יוסי אזולאי: "תפילות" (פלטינה כפולה), "יום אחד איתך", "אנדלוס", Retromantica ועוד. להאזנה בספוטיפיי, Apple Music ו-YouTube Music.'),
 ('gallery','videos','he','גלריה · Gallery | יוסי אזולאי','רגעים בלתי נשכחים: תמונות וסרטונים של יוסי אזולאי מחופות, בר מצוות וטקסים בישראל ובעולם.'),
 ('videos','videos','he','סרטונים · Videos | יוסי אזולאי','סרטונים של יוסי אזולאי: כניסות לחופה, בר מצוות וטקסים יהודיים. "עוד ישמע", "אוחילה", "בואי כלה" ועוד.'),
 ('contact','booking','he','צור קשר · Contact | יוסי אזולאי','לבדיקת תאריך פנוי והזמנת יוסי אזולאי לחופה, בר מצווה או טקס. ניהול והזמנות: איתמר לשנסקי, 054-977-7758.'),
]
src = (root/'index.html').read_text(encoding='utf-8')
urls = ['']
for path, start, lang, title, desc in PAGES:
    s = src
    url = f'{SITE}/{path}/'
    s = s.replace('<head>', '<head>\n<base href="/">', 1)
    s = re.sub(r'<title>.*?</title>', f'<title>{html.escape(title)}</title>', s, 1, flags=re.S)
    s = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{html.escape(desc)}">', s, 1)
    s = s.replace(f'<link rel="canonical" href="{SITE}/">', f'<link rel="canonical" href="{url}">', 1)
    s = s.replace(f'<meta property="og:url" content="{SITE}/">', f'<meta property="og:url" content="{url}">', 1)
    s = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{html.escape(title)}">', s, 1)
    s = s.replace('<html lang="he" dir="rtl">', f'<html lang="{lang}" dir="{"rtl" if lang=="he" else "ltr"}">', 1)
    s = s.replace('</head>', f'<script>window.__START={start!r};window.__LANG={lang!r}</script>\n</head>', 1)
    assert 'window.__START' in s and url in s
    d = root/path; d.mkdir(exist_ok=True)
    (d/'index.html').write_text(s, encoding='utf-8')
    urls.append(path + '/')
(root/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    ''.join(f'  <url><loc>{SITE}/{u}</loc></url>\n' for u in urls) + '</urlset>\n', encoding='utf-8')
print('built', len(PAGES), 'pages + sitemap.xml')
