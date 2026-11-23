"""Builds music/ (the wedding repertoire page, like the original /wmusic) from the Dropbox folder
'Songs/שירים לאתר'. Order and titles follow the original page. Run: python3 tools/build_music.py <source folder>"""
import shutil, json, subprocess, re, sys, pathlib
src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/uploads/Yossi Azulay 2027/Songs/שירים לאתר")
root = pathlib.Path(__file__).resolve().parent.parent
P = "Yossi Azulay Hupot - "
T = [  # (title, file in the Dropbox folder or None if missing, note)
 ("Boei Kala (Evita – Don't Cry For Me Argentina)", P+"Boei kala (Evita - Don't Cry For me Argentina) - full.mp3", ""),
 ("The Lion King – Circle Of Life", "Yossi Azulay - Circal of life (mehera)web edit.mp3", "קטע מקוצר"),
 ("Boey Beshalom (Time to Say Goodbye)", P+"Boey Beshalom (Time to say goodbye).mp3", ""),
 ("Boi Kala (Hallelujah – Leonard Cohen)", P+"Boi Kala (hallelujah leonard cohen) - full.mp3", ""),
 ("Boei Kala vs Shallow", "Yossi Azulay - Shallow VS shir Lammalot (Boei Kala)web edit.mp3", "קטע מקוצר"),
 ("O Sole Mio Hebrew (Od Ishama + Boei Beshalom)", P+"Osolomio Hebrew (Od Ishama + Boei Beshalom) - full.mp3", ""),
 ("Eshet Chayil", P+"Eshet Hail Final - full.mp3", ""),
 ("Im Eshkachech Yerushalayim", P+"Im Eshkachech.mp3", ""),
 ("Ana Be-Koach", P+"Ana Be-Koah - full.mp3", ""),
 ("You Raised Me Up (Hebrew)", P+"You Raised Me (Hebrew Mix).mp3", ""),
 ("Mehera (Kol Sason)", P+"Mehera ( Kol Sason) - full.mp3", ""),
 ("Vezakeni", P+"Vezakeni Final - full.mp3", ""),
 ("Mi Adir", P+"Mi Adir Final - full.mp3", ""),
 ("Bereshit", P+"Bereshit - full.mp3", ""),
 ("Tfila (Shmor Na)", P+"Tfila (Shmor Na) Final Mix - full.mp3", ""),
 ("Melech Malchei Hamelachim", P+"melech melech hamelachim (Mix) - full.mp3", ""),
 ("Adon Olam", None, ""),
 ("Adon Olam Kendji (Les Yeux de la Mama)", P+"Adon Olma Kendji (les yeux de mama) - full.mp3", ""),
 ("Al Tashlicheni Le'et Zikna", None, ""),
 ("Amen", P+"Amen mix metukan - full.mp3", ""),
 ("Birkat Hakohanim", P+"Birkat Hakohanim - full.mp3", ""),
 ("Boey Beshalom (Nights in White Satin)", P+"Boey beshalon (night's in white satin) final with intro - full.mp3", ""),
 ("Boi Kala", P+"Boi Kala.mp3", ""),
 ("Ein Od Milvado", P+"Ein od Milvado - full.mp3", ""),
 ("El Adon", P+"El Adon ( No Intro ).mp3", "גרסה בלי פתיח"),
 ("Katonti", None, ""),
 ("Nishba", P+"Nisba (more violins) - full.mp3", ""),
 ("Ose Shalom Bimromav", None, ""),
 ("Rachem", P+"rachem (CD) - full.mp3", ""),
 ("Shalom Aleichem", None, ""),
 ("Shirat Ha-Navad", None, ""),
 ("Tfilat Av", None, ""),
 ("Ve-Ha'er Eineinu", None, ""),
 ("Vehi She-Amda", P+"Vehi Sheamda - full.mp3", ""),
 ("Vezakeni", P+"Vezakeni Final.mp3", ""),
 ("Yasmin", P+"Yasmin 2 - full.mp3", ""),
 ("Yeh Li Chalom", P+"Yeh Li Halom - Final - full.mp3", ""),
 ("Yerushalayim Shel Zahav", P+"Yerushalahaym Shel Zahav (CD) - full.mp3", ""),
 ("Tzur Mishelo Achalnu", None, ""),
 ("Tfilat Haderech", None, ""),
 ("Erev Shel Shoshanim", None, ""),
 ("Tfilat Kala", None, ""),
 ("Shma Israel", P+"Shma Israel.mp3", ""),
 ("Shir La-Ma'alot", P+"Shir Lamalot - full (2).mp3", ""),
 ("Yerushalayim Shel Zahav – Piano", None, ""),
 ("Brit Olam", None, ""),
]
out, missing = [], []
mdir = root / 'music'
shutil.rmtree(mdir, ignore_errors=True); mdir.mkdir()
n = 0
for t, f, note in T:
    if not f or not (src / f).exists():
        missing.append(t); continue
    n += 1
    name = f"{n:02d}-" + re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')[:40] + ".mp3"
    shutil.copy(src / f, mdir / name)
    d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(mdir / name)]).decode())
    out.append({'t': t, 'f': 'music/' + name, 'len': f"{int(d // 60)}:{int(d % 60):02d}", 'note': note})
(mdir / 'tracks.json').write_text(json.dumps({'title': {'he': 'חתונות', 'en': 'Weddings'}, 'tracks': out, 'missing': missing}, ensure_ascii=False, indent=1), encoding='utf-8')
print(len(out), 'tracks;', len(missing), 'missing:', ', '.join(missing))
