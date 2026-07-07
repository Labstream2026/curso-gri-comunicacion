#!/usr/bin/env python3
# MIX definitivo desde PDF: fondo = página sin texto (gráficos idénticos al PPT)
# + texto real HTML (posición/tamaño/color exactos del PDF) con data-step por bloque.
import fitz, os, json, html, sys

BASE = "/Users/jonathanf/Desktop/GRI Tutorias/2026 GRI TUTORIAS/Curso Blueprint"
OUT = BASE + "/curso-html5"
GFXDIR = OUT + "/img/gfx"

def esc(t):
    return html.escape(t, quote=True)

def bold(sp):
    # los títulos del deck usan una fuente pesada que no se marca como bold en el PDF
    return bool(sp['flags'] & 16) or 'bold' in sp['font'].lower() or sp['size'] >= 15.5

def italic(sp):
    return bool(sp['flags'] & 2) or 'italic' in sp['font'].lower() or 'oblique' in sp['font'].lower()

def page_html(page, imgname):
    W = page.rect.width; H = page.rect.height
    k = 1280.0 / W
    d = page.get_text('dict')
    blocks = []
    for b in d['blocks']:
        if b['type'] != 0:
            continue
        spans = []
        for ln in b['lines']:
            for sp in ln['spans']:
                if sp['text'].strip():
                    spans.append(sp)
        if spans:
            blocks.append({'bbox': b['bbox'], 'spans': spans})

    # número de página (dígitos, esquina inferior): fuera del HTML y del fondo
    def is_pageno(bl):
        txt = ''.join(s['text'] for s in bl['spans']).strip()
        x0, y0, x1, y1 = bl['bbox']
        return txt.isdigit() and y0 > H * 0.88 and (x0 > W * 0.85 or x1 < W * 0.15)
    pagenos = [b for b in blocks if is_pageno(b)]
    blocks = [b for b in blocks if not is_pageno(b)]

    # pasos por bloque en orden visual; notas pequeñas al pie = "always" (aparecen al inicio)
    def is_foot(bl):
        sz = max(s['size'] for s in bl['spans'])
        return sz < 8.6 and bl['bbox'][1] > H * 0.86
    stepped = [i for i, b in enumerate(blocks) if not is_foot(b)]
    order = sorted(stepped, key=lambda i: (round(blocks[i]['bbox'][1] * k / 42), blocks[i]['bbox'][0]))
    stepof = {bi: si for si, bi in enumerate(order)}

    parts = ['<img class="gfx" src="img/gfx/%s" alt="" style="position:absolute;inset:0;width:100%%;height:100%%">' % imgname]
    for bi, bl in enumerate(blocks):
        ds = 'always' if bi not in stepof else str(stepof[bi])
        for sp in bl['spans']:
            x0, y0, x1, y1 = sp['bbox']
            st = ('position:absolute;left:%.1fpx;top:%.1fpx;font-size:%.1fpx;color:#%06x;'
                  'white-space:pre;line-height:%.1fpx'
                  % (x0 * k, y0 * k, sp['size'] * k, sp['color'], (y1 - y0) * k))
            if bold(sp):
                st += ';font-weight:700'
            if italic(sp):
                st += ';font-style:italic'
            parts.append('<div data-step="%s" data-w="%.1f" style="%s">%s</div>'
                         % (ds, (x1 - x0) * k, st, esc(sp['text'])))

    # fondo: quitar TODO el texto (incl. nº de página), conservar imágenes y vectores
    for bl in blocks + pagenos:
        for sp in bl['spans']:
            page.add_redact_annot(fitz.Rect(sp['bbox']))
    if blocks or pagenos:
        page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                              graphics=fitz.PDF_REDACT_LINE_ART_NONE)
    pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
    pix.save(os.path.join(GFXDIR, imgname))
    return ''.join(parts)

def run(pdf_rel, prefix, idp, nmax=None, only=None):
    doc = fitz.open(BASE + "/" + pdf_rel)
    out = {}
    n = min(len(doc), nmax or len(doc))
    for i in range(1, n + 1):
        if only and i not in only:
            continue
        img = '%s_%02d.png' % (prefix, i)
        out['%s%02d' % (idp, i)] = page_html(doc[i - 1], img)
    return out

if __name__ == '__main__':
    os.makedirs(GFXDIR, exist_ok=True)
    which = sys.argv[1] if len(sys.argv) > 1 else 'all'
    JOBS = [
        ("Introducción/Introducción_vf.pdf", "intro", "s", 9),
        ("Módulo 1/Módulo 1_vf.pdf", "m1", "m1s", None),
        ("Módulo 2/Módulo 2_vf.pdf", "m2", "m2s", None),
        ("Módulo 3/Módulo 3_vf.pdf", "m3", "m3s", None),
        ("Módulo 4/Módulo 4_vf.pdf", "m4", "m4s", None),
        ("Cuestionario final/Cuestionario final_vf.pdf", "cuest", "qs", None),
    ]
    d = json.load(open(OUT + "/data/slides_html.json"))
    total = 0
    for pdf, pfx, idp, nmax in JOBS:
        if which != 'all' and which != pfx:
            continue
        frags = run(pdf, pfx, idp, nmax)
        d.update(frags)
        total += len(frags)
        print(pfx, len(frags), 'diapositivas')
    json.dump(d, open(OUT + "/data/slides_html.json", "w"), ensure_ascii=False)
    print('total regeneradas:', total)
