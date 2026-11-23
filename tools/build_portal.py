"""Builds portal.html (client personal area) from admin.html. Run after every change to admin.html:
   python3 tools/build_portal.py"""
import pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
s = (root / 'admin.html').read_text(encoding='utf-8')
def rep(a, b):
    global s
    assert s.count(a) == 1, a[:60]
    s = s.replace(a, b)
rep('<title>מערכת ניהול · יוסי אזולאי</title>', '<title>האזור האישי · יוסי אזולאי</title>')
rep('<script src="docs.js"></script>', '<script>window.__PORTAL={token:location.hash.slice(1)}</script>\n<script src="docs.js"></script>')
s = re.sub(r'<div id="crmbar" hidden>.*?</div>\n', '', s, count=1, flags=re.S)
m = s.index('<script type="module">')
end = s.index('</script>', m) + len('</script>')
s = s[:m] + (root / 'tools' / 'portal_module.js').read_text(encoding='utf-8').strip() + s[end:]
(root / 'portal.html').write_text(s, encoding='utf-8')
print('portal.html built', len(s))
