#!/usr/bin/env python3
# Genera las diapositivas de quiz interactivo (tarjetas) y el visor de guías,
# y anota el modelo (forQuiz en respuestas, scoreCard en el cierre del cuestionario).
import json, html

OUT = "/Users/jonathanf/Desktop/GRI Tutorias/2026 GRI TUTORIAS/Curso Blueprint/curso-html5"
qx = json.load(open('quizx_data.json'))['quizzes']
frags = json.load(open(OUT + '/data/slides_html.json'))
model = json.load(open(OUT + '/data/course_model.json'))

def esc(t):
    return html.escape(t or '', quote=True)

# --- quizzes ---
for sid, q in qx.items():
    parts = ['<div class="quizx">',
             '<div class="qx-band"></div>',
             '<div class="qx-logo">GRI</div>',
             '<div class="qx-badge">%s</div>' % esc(q['badge'].upper())]
    step = 0
    if q['title']:
        parts.append('<div class="qx-title" data-step="%d">%s</div>' % (step, esc(q['title'])))
        step += 1
    parts.append('<div class="qx-q" data-step="%d">%s</div>' % (step, esc(q['question'])))
    step += 1
    parts.append('<div class="qx-opts" data-n="%d">' % len(q['options']))
    for o in q['options']:
        parts.append(
            '<button class="qx-opt" type="button" data-letter="%s" data-step="%d">'
            '<span class="qx-l">%s</span><span class="qx-t">%s</span><span class="qx-mark"></span></button>'
            % (o['letter'], step, o['letter'].upper(), esc(o['text'])))
        step += 1
    parts.append('</div></div>')
    frags[sid] = ''.join(parts)

# --- guías ---
GUIAS = {
    'm5': (4, 'Guia-modulo-5.pdf', 'Módulo 5 · Guía: técnicas de visualización de datos'),
    'm6': (6, 'Guia-modulo-6.pdf', 'Módulo 6 · Guía: inteligencia artificial para informes'),
}
for mod, (pages, pdf, titulo) in GUIAS.items():
    for i in range(1, pages + 1):
        frags['%ss%02d' % (mod, i)] = (
            '<div class="guidex">'
            '<div class="gx-head"><div class="gx-ico">📘</div>'
            '<div class="gx-meta"><div class="gx-t">%s</div>'
            '<div class="gx-p">Página %d de %d · desplázate para ver todo el contenido</div></div>'
            '<a class="gx-dl" href="anexos/%s" target="_blank">⬇ Descargar PDF</a></div>'
            '<div class="gx-body"><img src="img/slides/%s_%02d.png" alt=""></div>'
            '<div class="gx-fade"></div><div class="gx-hint">▼</div>'
            '</div>' % (esc(titulo), i, pages, pdf, mod, i))

# --- modelo: enlazar respuestas y marcar el cierre del cuestionario ---
byid = {s['id']: s for s in model['slides']}
for sid, q in qx.items():
    ans = q.get('answerSlide')
    if ans and ans in byid:
        byid[ans]['forQuiz'] = sid
byid['qs39']['scoreCard'] = True

json.dump(frags, open(OUT + '/data/slides_html.json', 'w'), ensure_ascii=False)
json.dump(model, open(OUT + '/data/course_model.json', 'w'), ensure_ascii=False)
print('quizzes:', len(qx), '| guías:', sum(g[0] for g in GUIAS.values()), '| respuestas enlazadas:', sum(1 for s in model['slides'] if s.get('forQuiz')))
