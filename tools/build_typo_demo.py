"""Builds typo-demo.html (typography demo, noindex) from index.html + typo-demo.css + tools/typo_demo_tail.html."""
import pathlib
root=pathlib.Path(__file__).resolve().parent.parent
s=(root/'index.html').read_text(encoding='utf-8')
tail=(root/'tools/typo_demo_tail.html').read_text(encoding='utf-8')
s=s.replace('<html lang="he" dir="rtl">','<html lang="he" dir="rtl" class="typo">',1)
assert 'class="typo"' in s
s=s.replace('<head>','<head>\n<meta name="robots" content="noindex,nofollow">\n<script>try{if(/[?&]vid\\b/.test(location.search))sessionStorage.removeItem("heroVid")}catch(e){}</script>',1)
s=s.replace('</head>','<link rel="stylesheet" href="typo-demo.css">\n</head>',1)
s=s.replace('</body>',tail+'</body>',1)
(root/'typo-demo.html').write_text(s,encoding='utf-8')
print('typo-demo.html built',len(s))
