#!/usr/bin/env python3
# Extrae enunciado + opciones (texto EXACTO, en orden) de las 30 diapositivas de pregunta
import json, re, html

OUT = "/Users/jonathanf/Desktop/GRI Tutorias/2026 GRI TUTORIAS/Curso Blueprint/curso-html5"
frags = json.load(open('quiz_orig_frags.json'))
model = json.load(open(OUT + '/data/course_model.json'))
quiz_data = json.load(open('quiz_data.json'))['quizzes']

LINE = re.compile(r'<div data-step="([^"]+)"[^>]*style="([^"]*)"[^>]*>(.*?)</div>', re.S)

def lines_of(frag):
    out = []
    for m in LINE.finditer(frag):
        step, style, inner = m.groups()
        if 'color:#ffffff' in style or 'color:#fefefe' in style:
            continue  # texto blanco sobre fondo blanco: invisible en la diapositiva original
        pl = re.search(r'left:([\d.]+)px;top:([\d.]+)px', style)
        if not pl:
            continue
        left, top = float(pl.group(1)), float(pl.group(2))
        txt = html.unescape(re.sub(r'<[^>]+>', '', inner))
        if txt.strip():
            out.append({'step': step, 'left': left, 'top': top, 'txt': txt})
    out.sort(key=lambda l: (l['top'], l['left']))
    return out

TITULOS = re.compile(r'^\s*(¡?pong[aá]monos a prueba!?|cuestionario( final)?)\s*$', re.I)
OPT = re.compile(r'^\s*([a-e])\)\s*')

res = {}
problemas = []
# número de pregunta por módulo / cuestionario
seq = {}
for s in model['slides']:
    sid = s['id']
    if sid not in quiz_data:
        continue
    mod = s['module']
    seq.setdefault(mod, []).append(sid)

for s in model['slides']:
    sid = s['id']
    if sid not in quiz_data:
        continue
    ls = lines_of(frags[sid])
    ls = [l for l in ls if l['step'] != 'always']   # fuera notas al pie
    title = None
    q_parts = []
    opts = []      # [(letter, [textos])]
    anchors = []   # [(letter, left, top)] de la línea que abre cada opción
    started = False
    for l in ls:
        t = l['txt'].strip()
        m = OPT.match(t)
        if m:
            started = True
            anchors.append((m.group(1), l['left'], l['top']))
            opts.append((m.group(1), [OPT.sub('', t).strip()]))
            continue
        if not started:
            if title is None and TITULOS.match(t):
                title = t
                continue
            q_parts.append(t)
        else:
            # continuación: pertenece a la opción de su MISMA COLUMNA más cercana por arriba
            # (los layouts a dos columnas rompen el orden por altura)
            cands = [(a in 'abcde', abs(l['left'] - left) <= 60, top)
                     for (a, left, top) in anchors]
            best = None
            for (letter, left, top) in anchors:
                if abs(l['left'] - left) <= 60 and top <= l['top'] + 2:
                    if best is None or top > best[2]:
                        best = (letter, left, top)
            if best is None:   # sin columna clara: la más cercana por arriba
                for (letter, left, top) in anchors:
                    if top <= l['top'] + 2 and (best is None or top > best[2]):
                        best = (letter, left, top)
            dest = best[0] if best else opts[-1][0]
            for o in opts:
                if o[0] == dest:
                    o[1].append(t)
                    break
    def joinp(parts):
        return re.sub(r'\s+', ' ', ' '.join(parts)).strip()
    opts.sort(key=lambda o: o[0])   # cajas a dos columnas: orden canónico por letra
    letters = [o[0] for o in opts]
    if letters != sorted(set(letters)) or len(letters) < 3:
        problemas.append('%s: letras %s' % (sid, letters))
    mod = s['module']
    idx = seq[mod].index(sid) + 1
    total = len(seq[mod])
    if sid.startswith('qs'):
        badge = 'Cuestionario final · Pregunta %d de %d' % (idx, total)
    else:
        badge = '%s · Pregunta %d de %d' % (model['modules'][str(mod)].split(':')[0], idx, total)
    res[sid] = {
        'badge': badge,
        'title': title,
        'question': joinp(q_parts),
        'options': [{'letter': o[0], 'text': joinp(o[1])} for o in opts],
        'correct': quiz_data[sid]['correct'],
        'answerSlide': quiz_data[sid].get('answerSlide'),
    }

json.dump({'quizzes': res, 'problemas': problemas}, open('quizx_data.json', 'w'), ensure_ascii=False, indent=1)
print('extraidas:', len(res), '| problemas:', problemas)
for sid in ['m2s15', 'qs03']:
    q = res[sid]
    print('---', sid, '|', q['badge'], '| title:', q['title'])
    print('  Q:', q['question'][:90])
    for o in q['options']:
        print('  %s) %s' % (o['letter'], o['text'][:70]))
