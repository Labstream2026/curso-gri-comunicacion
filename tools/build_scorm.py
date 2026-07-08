#!/usr/bin/env python3
# Empaqueta el curso como SCORM 1.2 (zip listo para subir a un LMS).
# - index.html: quita el botón "Descargar SCORM" (marcadores SCORM-DL-*) e inyecta scorm.js
# - AUDIO COMPRIMIDO: los mp3 (128k) se transcodifican a AAC .m4a 64k mono con
#   afconvert (macOS) — mitad de peso, calidad de voz casi intacta. La vista
#   previa web conserva los mp3 originales; SOLO el paquete descargable comprime.
#   Usa --keep-mp3 para empaquetar los mp3 originales sin comprimir.
# - imsmanifest.xml con el listado completo de archivos
# Uso: python3 tools/build_scorm.py [salida.zip] [--keep-mp3]
import json, os, re, shutil, subprocess, sys, zipfile
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
KEEP_MP3 = '--keep-mp3' in sys.argv
OUTZIP = args[0] if args else os.path.join(ROOT, 'curso-gri-comunicacion-scorm12.zip')
STAGE = os.path.join(os.path.dirname(OUTZIP) or '.', '_scorm_stage')
CACHE = os.path.join(os.path.dirname(OUTZIP) or '.', '_scorm_audio_cache')

TITLE = 'Tutorías GRI · Comunicación efectiva en los reportes de sostenibilidad'
AAC_BITRATE = '64000'   # voz: 64k mono AAC ≈ transparente

def audio_files():
    return sorted(f for f in os.listdir(os.path.join(ROOT, 'audio')) if f.endswith('.mp3'))

def transcode_audio():
    """mp3 -> m4a AAC en CACHE (incremental). Devuelve lista de rutas relativas del paquete."""
    os.makedirs(CACHE, exist_ok=True)
    out = []
    for fn in audio_files():
        src = os.path.join(ROOT, 'audio', fn)
        m4a = fn[:-4] + '.m4a'
        dst = os.path.join(CACHE, m4a)
        if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
            r = subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', AAC_BITRATE, src, dst],
                               capture_output=True)
            if r.returncode != 0 or not os.path.exists(dst) or os.path.getsize(dst) < 5000:
                raise SystemExit('afconvert falló en %s: %s' % (fn, r.stderr.decode()[:200]))
        out.append('audio/' + m4a)
    return out

def collect_static():
    files = ['scorm.js']
    for d in ['css', 'js', 'data', 'anexos']:
        for fn in sorted(os.listdir(os.path.join(ROOT, d))):
            if not fn.startswith('.'):
                files.append(d + '/' + fn)
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

    static = collect_static()
    for f in static:
        dst = os.path.join(STAGE, f)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(os.path.join(ROOT, f), dst)

    # audio: comprimido (m4a) o mp3 original
    os.makedirs(os.path.join(STAGE, 'audio'), exist_ok=True)
    if KEEP_MP3:
        audios = []
        for fn in audio_files():
            shutil.copy2(os.path.join(ROOT, 'audio', fn), os.path.join(STAGE, 'audio', fn))
            audios.append('audio/' + fn)
    else:
        audios = transcode_audio()
        for rel in audios:
            shutil.copy2(os.path.join(CACHE, os.path.basename(rel)), os.path.join(STAGE, rel))
        # el modelo del paquete debe apuntar a los .m4a
        mp = os.path.join(STAGE, 'data/course_model.json')
        model = json.load(open(mp))
        n = 0
        for s in model['slides']:
            for p in s['parts']:
                if p.get('file', '').endswith('.mp3'):
                    p['file'] = p['file'][:-4] + '.m4a'
                    n += 1
        json.dump(model, open(mp, 'w'), ensure_ascii=False)
        print('modelo del paquete: %d referencias de audio -> .m4a' % n)

    files = static + audios
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
    print('SCORM: %d archivos -> %s (%.1f MB, audio %s)' %
          (len(files) + 2, OUTZIP, os.path.getsize(OUTZIP) / 1e6,
           'mp3 original' if KEEP_MP3 else 'AAC 64k'))

if __name__ == '__main__':
    main()
