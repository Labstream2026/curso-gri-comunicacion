# PLAYBOOK — Construir un curso e-learning idéntico a "Comunicación efectiva GRI"

Instrucciones completas para convertir un curso en PPT + guion Word en un curso HTML5
interactivo con narración sincronizada, quizzes clicables, guías, vista previa web y
paquete SCORM descargable. Ejecutable de principio a fin en una sola sesión.

Repo de referencia (motor + herramientas): `Labstream2026/curso-gri-comunicacion`
Vista previa de referencia: https://labstream2026.github.io/curso-gri-comunicacion/

---

## 0. Insumos requeridos (antes de empezar)

Por cada módulo del curso:
1. **PPTX** final (`Módulo N_vf.pptx`).
2. **PDF exportado desde PowerPoint** del mismo PPTX (`Módulo N_vf.pdf`) — **imprescindible**:
   el pipeline saca la fidelidad visual del PDF, no del PPTX. Exportar con PowerPoint
   (Archivo → Exportar → PDF), nunca con conversores externos.
3. **Guion .docx** con una tabla por diapositiva: `N° | Título | Texto en pantalla | Narración del locutor | Notas`.
   Las diapositivas de pregunta de quiz llevan una nota tipo "Dejar unos segundos…".

Globales: caso de estudio u otros anexos (PDF), y las guías/infografías altas si las hay
(PPT de página alta, p.ej. 600×1500 pt, también exportadas a PDF).

---

## 1. Preparar el proyecto

```bash
# clonar el motor desde el curso de referencia
git clone https://github.com/Labstream2026/curso-gri-comunicacion.git curso-NUEVO
cd curso-NUEVO
rm -rf .git && git init && git branch -m main
# limpiar contenido del curso anterior; el motor se queda
rm -rf audio/* img/gfx/* img/slides/* anexos/*
: > data/slides_html.json && echo '{}' > data/slides_html.json
```

**Qué es motor (NO tocar salvo estilos de marca):** `index.html`, `css/course.css`,
`js/course.js` (player: sincronía narrationSync, quizzes mountQuizX, guías, noauto,
scoreCard), `js/slides.js`, `js/quiz.js`, `js/modules.js`, `js/overrides.js`,
`scorm.js`, `tools/*.py`, `.nojekyll`, `.gitignore`.

**Qué es contenido (se regenera por curso):** `data/course_model.json`,
`data/slides_html.json`, `img/gfx/`, `img/slides/`, `audio/`, `anexos/`.

Personalizar en `index.html`: título, subtítulo, cifras del overlay (módulos/diapositivas/
evaluaciones/horas) y el `href` del botón `#btn-scorm` (paso 9). En `tools/build_scorm.py`:
la constante `TITLE` y el nombre del zip.

---

## 2. Diapositivas: fondo fiel + texto real (pdfmix)

Editar la lista `JOBS` de `tools/pdfmix.py` con los PDF del curso nuevo:
`("<carpeta>/Módulo 1_vf.pdf", "m1", "m1s", None), …` y ajustar rutas BASE/OUT.

```bash
python3 tools/pdfmix.py all
```

Qué hace por página: (a) extrae cada línea de texto del PDF como `<div>` absoluto con
posición/tamaño/color/negrilla exactos, `data-step` por bloque y `data-w` (ancho para el
ajuste fino de fuente), (b) borra el texto del PDF por redacción (conservando fotos y
vectores) y renderiza el fondo a PNG 1.5x en `img/gfx/`, (c) escribe todo en
`data/slides_html.json` (`{slideId: htmlFragment}`).

Reglas ya integradas (no tocar): texto blanco #ffffff = invisible (residuos del PPT);
notas al pie <8.6 pt = `data-step="always"`; números de página eliminados; tamaños
≥15.5 pt en negrilla (la fuente display del deck no se marca bold en el PDF).

**Verificar:** abrir 3-4 diapositivas variadas en el preview y compararlas contra el PDF.

---

## 3. Guiones → JSON

Parsear cada `Guion módulo N_vf.docx` (python-docx, la tabla) a
`mN_guion.json`: `[{n, titulo, texto, narr, notas}, …]`.

**OBLIGATORIO — detectar desfases:** comparar el título de cada fila del guion contra el
primer texto de cada diapositiva del PPTX (o del fragmento). Si el guion tiene filas de
más/de menos, construir el mapeo explícito (en el curso de referencia, el guion de M3
tenía una fila extra en la posición 22 → diapos 22-31 = filas 23-32).

---

## 4. Modelo del curso (course_model.json)

Adaptar `tools/build_model.py`-equivalente (ver el histórico del repo de referencia) para
generar `data/course_model.json`:

```
{ "modules": {"0": "Introducción", "1": "Módulo 1: …", …},
  "slides": [ {id, ppt, module, type:"content", title, screen_text, media:[], parts:[…],
               noauto?, correct?, forQuiz?, scoreCard?}, … ] }
```

- `id`: `sNN` (introducción), `mNsNN` (módulos), `qsNN` (cuestionario). Deben coincidir
  con las claves de `slides_html.json`.
- `ppt` = módulo×100 + n (evita choques de overrides).
- `parts`: 1 parte por diapositiva: `{phase:"m", steps:[], text: narr, tts: narr_limpio,
  file: "audio/<id>.mp3"}`.
- **tts** (lo que lee el locutor): partir de `narr` y (1) `\bGRI\b` → `"ge erre i"`,
  (2) eliminar líneas "Fuente(s): …", URLs y "Link:", (3) nada más. `text` conserva el
  original para la transcripción.
- **noauto: true** en: preguntas de quiz, páginas de guía y TODO el cuestionario final
  (no avanzan solas; el motor muestra "continúa con →").
- Guías M5/M6 y cuestionario (salvo su portada): `parts: []` (sin audio, autoguiadas).
- La narración del cierre/portadas sale del guion como cualquier diapositiva.

---

## 5. Audios (voz Julian vía MCP de Higgsfield)

Parámetros EXACTOS (aprobados): `generate_audio` con
`{"model":"text2speech_v2","variant":"elevenlabs","voice_type":"preset",
  "voice_id":"95429266-c0ac-4137-a209-63b8812b0f23","prompt":"<tts>"}`.

Procedimiento (delegable a un subagente):
1. Listar faltantes: todo `parts[].file` sin archivo en disco, con su `tts`.
2. Lotes de **máximo 6** llamadas en paralelo (más → error 429; esperar 45 s y reintentar).
3. Tras ~30 s, `job_display(jobId)` → cuando `status=completed`, descargar `rawUrl` con
   `curl -sL -o audio/<id>.mp3`.
4. Validar: mp3 > 15 KB; regenerar 1 vez si falla; registrar avance en un log.

OJO: el campo de narración en `parts` es `text`; el del locutor es `tts` — el motor lee
`p.tts || p.text` (no romper esa convención).

---

## 6. Quizzes interactivos (tarjetas)

Patrón del guion: diapositiva PREGUNTA (nota "dejar unos segundos") + diapositiva
RESPUESTA cuya narración dice "La respuesta/opción correcta es la X)".

1. **Letras correctas**: regex `(respuesta|opción) correcta es la\s*([a-e])` sobre la narr
   de cada respuesta → `quiz_data.json` `{preguntaId: {correct, answerSlide}}`.
2. **Extraer texto exacto** con `tools/extract_quizx.py` (ajustar rutas/ids):
   - ⚠️ SIEMPRE desde los fragmentos pdfmix ORIGINALES. Si ya se reemplazaron por
     tarjetas, regenerarlos con `pdfmix.run(pdf, pfx, idp, only={páginas})`.
   - Ya maneja: texto blanco invisible (excluir), numeración "1." al inicio, título
     tipo "¡Pongámonos a prueba!", y **opciones a dos columnas** (las continuaciones de
     línea se asignan por COLUMNA — por altura se entremezclan).
3. **Verificar** (crítico): cada línea visible de la diapositiva debe quedar contenida en
   lo extraído (script determinista de cobertura) y, si hay presupuesto, un agente por
   pregunta comparando contra el original.
4. **Construir tarjetas** con `tools/build_quizx.py`: escribe los fragmentos `.quizx`
   (insignia "Módulo N · Pregunta X de Y", enunciado, botones a-d) en slides_html.json y
   anota el modelo: `correct` en la pregunta, `forQuiz` en la respuesta, `scoreCard: true`
   en la diapositiva de cierre del cuestionario.

El motor hace el resto: clic → verde/rojo + ✔/✘ + chip + auto-avance a la justificación
(franja "Tu respuesta"), y tarjeta de puntaje "N de 18" al cierre.

---

## 7. Guías altas (infografías)

Por cada página del PDF de la guía: render a PNG con PyMuPDF `matrix 2x` →
`img/slides/<pfx>_NN.png`, copiar el PDF a `anexos/Guia-modulo-N.pdf`, y generar el
fragmento `.guidex` (lo hace `tools/build_quizx.py`, sección GUIAS: título, "Página X de Y",
botón ⬇ PDF, imagen desplazable con pista de scroll).

---

## 8. Verificación local (antes de desplegar)

```bash
node server.js   # o el preview configurado (puerto en .claude/launch.json)
```
1. **Barrido de sincronía**: recorrer todas las diapositivas con
   `__course.goTo(i,false)` y contar `State.stepTiming` (sincronizada) vs fallback —
   ≥60-70% sincronizadas es lo esperado; portadas/divisores caen a reparto uniforme y está bien.
2. Reproducir con audio 2-3 diapositivas por módulo: gráficos al inicio, texto siguiendo la voz.
3. Un quiz bien + uno mal (colores, chip, franja en la justificación, puntaje al cierre).
4. Una guía (scroll + descarga) y el caso de estudio.
5. Subir versión de caché: `sed -i '' 's/?v=OLD/?v=NEW/g' index.html js/course.js`.

---

## 9. Despliegue + SCORM

```bash
# Pages
gh repo create Labstream2026/curso-NUEVO --public --source . --push
# activar Pages (rama main, raíz) — igual que el repo de referencia

# SCORM (el paquete descargable COMPRIME el audio a AAC 64k mono; la web queda a 128k)
python3 tools/build_scorm.py /ruta/curso-NUEVO-scorm12.zip
gh release create scorm-v1 --title "Paquete SCORM 1.2 · v1" --notes "…" /ruta/curso-NUEVO-scorm12.zip
# actualizar el href del botón #btn-scorm en index.html con la URL del asset y push
```

- El botón "Descargar SCORM" vive entre los marcadores `<!-- SCORM-DL-START -->…<!-- SCORM-DL-END -->`
  de index.html; `build_scorm.py` lo ELIMINA del paquete (la descarga no se ofrece a sí misma).
- El zip va como **release** (nunca al repo: >100 MB prohibido en git/Pages).
- `build_scorm.py` transcodifica con `afconvert` (macOS) a `.m4a` y reescribe las
  referencias del modelo interno; `--keep-mp3` genera la variante sin comprimir.
- El paquete reporta al LMS (scorm.js): `lesson_status` incomplete→completed y
  `score.raw` = % de aciertos del cuestionario final.
- Tras cambios del curso: `python3 tools/build_scorm.py <zip> && gh release upload scorm-v1 <zip> --clobber`
  (misma URL, el botón no cambia).

---

## 10. Auditoría final (checklist)

```bash
# todos los assets desplegados responden 200 (imágenes de fragmentos + audios del
# modelo + anexos + js/css/data); ver script en el histórico o rehacer:
#  1) descargar course_model.json y slides_html.json del sitio
#  2) derivar todas las URLs (regex img/… + parts[].file + anexos + estáticos)
#  3) curl -o /dev/null -w "%{http_code} %{size_download}" con xargs -P8
```
- [ ] modelo: N slides = claves de slides_html = expectativa; módulos completos
- [ ] audios: todos los `parts[].file` existen, >15 KB; sin huérfanos
- [ ] quizzes: 100% con `correct`+`noauto`, opciones presentes, `forQuiz` recíproco, scoreCard
- [ ] tts: sin "http", sin "Fuente", sin "GRI" sin deletrear
- [ ] noauto en guías + cuestionario; versión ?v= consistente; git limpio
- [ ] descarga SCORM: asset 200, tamaño esperado, sin botón interno, modelo → .m4a

---

## Gotchas acumulados (leer antes de pelear con un bug)

| Síntoma | Causa/solución |
|---|---|
| python-pptx no abre el PPTX (Bad CRC) | fuentes incrustadas corruptas: rezipear sin `ppt/fonts/*.fntdata` |
| Texto cortado / tamaños raros | NO usar el conversor PPTX (legacy `pptx2html.py`); pdfmix ya resuelve autofit/herencia |
| Texto fantasma en extracciones | líneas `color:#ffffff` del PPT (invisibles): excluirlas |
| Opciones de quiz entremezcladas | layout a 2 columnas: asignar continuaciones por COLUMNA (extract_quizx ya lo hace) |
| El contenido se corta en el borde | `#stage{flex-shrink:0}` debe existir en course.css |
| data-step perdidos al convertir PPTX | usar `shape_id` como clave (id() de lxml no es estable) — solo aplica al legacy |
| La sincronía no anda en una diapo | normal si el guion no lee el texto en pantalla: cae a reparto proporcional |
| 429 al generar audio | máx 6 concurrentes; esperar 45 s |
| LibreOffice para renderizar | NO funciona en esta Mac (crashea); el pipeline no lo necesita |

---

## Prompt sugerido para ejecutar todo en una sesión nueva

> En la carpeta `<RUTA>` está el curso "<NOMBRE>" fragmentado: PPTX + PDF exportado por
> módulo y guiones .docx con la narración. Construye el curso HTML5 completo siguiendo
> `tools/PLAYBOOK-NUEVO-CURSO.md` del repo `Labstream2026/curso-gri-comunicacion`
> (clónalo como motor): diapositivas pdfmix con sincronía de voz, audios con la voz
> Julian de Higgsfield (GRI se deletrea "ge erre i"), quizzes interactivos de tarjetas,
> guías desplazables, vista previa en GitHub Pages con botón "Descargar SCORM", y paquete
> SCORM 1.2 con audio comprimido publicado como release. Verifica en el preview local
> antes de cada despliegue y termina con la auditoría del punto 10. Hazlo de una vez,
> completo, sin preguntarme; repórtame al final con el enlace y el resultado de la auditoría.
