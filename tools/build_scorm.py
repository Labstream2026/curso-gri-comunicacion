#!/usr/bin/env python3
# Empaqueta el curso como SCORM 1.2 (zip listo para subir a un LMS).
# - index.html: quita el botón "Descargar SCORM" (marcadores SCORM-DL-*) e inyecta scorm.js
# - imsmanifest.xml con el listado completo de archivos
# Uso: python3 tools/build_scorm.py [salida.zip]
import json, os, re, shutil, sys, zipfile
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTZIP = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'curso-gri-comunicacion-scorm12.zip')
STAGE = os.path.join(os.path.dirname(OUTZIP), '_scorm_stage')

TITLE = 'Tutorías GRI · Comunicación efectiva en los reportes de sostenibilidad'

def collect_files():
    files = ['scorm.js']
    for d in ['css', 'js', 'data', 'anexos']:
        for fn in sorted(os.listdir(os.path.join(ROOT, d))):
            if not fn.startswith('.'):
                files.append(d + '/' + fn)
    for fn in sorted(os.listdir(os.path.join(ROOT, 'audio'))):
        if fn.endswith('.mp3'):
            files.append('audio/' + fn)
    # imágenes: exactamente las referenciadas por los fragmentos
    frags = json.load(open(os.path.join(ROOT, 'data/slides_html.json')))
    refs = set()
    for v in frags.values():
        refs.update(re.findall(r'img/[A-Za-z0-9_./-]+', v))
    for r in sorted(refs):
        if os.path.exists(os.path.join(ROOT, r)):
            files.append(r)
        else:
            print('AVISO: referencia sin archivo:', r)
    return files

def scorm_index():
    src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    # quitar el botón de descarga (esta versión ES la descarga)
    src = re.sub(r'\s*<!-- SCORM-DL-START.*?SCORM-DL-END -->', '', src, flags=re.S)
    assert 'btn-scorm' not in src, 'el botón SCORM no se eliminó'
    # inyectar el adaptador antes del motor
    m = re.search(r'course\.js\?v=(\d+)', src)
    v = m.group(1) if m else '1'
    src = src.replace('<script src="js/course.js',
                      '<script src="scorm.js?v=%s"></script>\n  <script src="js/course.js' % v)
    return src

def manifest(files):
    entries = '\n'.join('      <file href="%s"/>' % escape(f) for f in ['index.html', 'imsmanifest.xml'] + files)
    return '''<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="com.labstream.gri.comunicacion" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                      http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG-GRI">
    <organization identifier="ORG-GRI">
      <title>%s</title>
      <item identifier="ITEM-CURSO" identifierref="RES-CURSO" isvisible="true">
        <title>%s</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES-CURSO" type="webcontent" adlcp:scormtype="sco" href="index.html">
%s
    </resource>
  </resources>
</manifest>
''' % (escape(TITLE), escape(TITLE), entries)

def main():
    if os.path.exists(STAGE):
        shutil.rmtree(STAGE)
    os.makedirs(STAGE)
    files = collect_files()
    for f in files:
        dst = os.path.join(STAGE, f)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(os.path.join(ROOT, f), dst)
    open(os.path.join(STAGE, 'index.html'), 'w', encoding='utf-8').write(scorm_index())
    open(os.path.join(STAGE, 'imsmanifest.xml'), 'w', encoding='utf-8').write(manifest(files))

    if os.path.exists(OUTZIP):
        os.remove(OUTZIP)
    zf = zipfile.ZipFile(OUTZIP, 'w', zipfile.ZIP_DEFLATED)
    for base, _, fns in os.walk(STAGE):
        for fn in sorted(fns):
            full = os.path.join(base, fn)
            zf.write(full, os.path.relpath(full, STAGE))
    zf.close()
    n = len(files) + 2
    print('SCORM: %d archivos -> %s (%.1f MB)' % (n, OUTZIP, os.path.getsize(OUTZIP) / 1e6))

if __name__ == '__main__':
    main()
