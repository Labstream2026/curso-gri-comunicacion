/* ============================================================
   Tutorías GRI — Comunicación efectiva · Vistas a medida
   Introducción (diapositivas 1–10)
   ============================================================ */
(function () {
  'use strict';
  const A = window.SlideArch;
  const V = window.__V;
  const SVG = A.SVG, IMG = A.IMG, esc = A.esc, gri = A.gri;

  // ---- PORTADA (slide 1) — usa la portada oficial image1.jpg ----
  V.covIntro = function (s, d) {
    return '<div style="position:absolute;inset:0;background:#1f4e96">' +
      '<img src="' + IMG + 'image1.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" alt="">' +
      '<div style="position:absolute;left:59%;right:4.5%;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;color:#fff;text-shadow:0 1px 10px rgba(11,21,38,.35)" data-step="always">' +
      '<div style="font-size:15px;letter-spacing:2.5px;text-transform:uppercase;color:#C3D6F0;font-weight:bold;margin-bottom:16px">Tutoría GRI · MiPymes</div>' +
      '<h1 style="font-size:31px;line-height:1.22;font-weight:bold;margin-bottom:18px">Comunicación efectiva en los reportes de sostenibilidad</h1>' +
      '<div style="width:54px;height:4px;background:var(--orange-strong);margin-bottom:18px;border-radius:2px"></div>' +
      '<div style="font-size:19px;color:#DCE7F7">Introducción a la tutoría</div>' +
      '</div></div>';
  };

  // ---- ¿Qué es el GRI? (slide 2) — panel + bullets ----
  V.griwhat = function (s, d) {
    const items = [
      'Organización internacional independiente que ayuda a las organizaciones a asumir la responsabilidad de sus impactos en cuestiones de sostenibilidad.',
      'Aborda temas como el cambio climático, los derechos humanos, la gobernanza y el bienestar social.',
      'Empodera la toma de decisiones para generar beneficios sociales, ambientales y económicos, con un lenguaje global para divulgar impactos.',
    ];
    const rows = items.map((t, i) => '<div class="vitem" data-step="' + i + '"><div class="bd-ic">' + SVG.check + '</div><div>' + esc(t) + '</div></div>').join('');
    return gri(false) +
      '<div class="sl-panel" style="width:322px"><div class="pt" style="font-size:25px">¿Qué es el Global Reporting Initiative?<br><span style="font-size:19px;color:#C3D6F0">GRI</span></div></div>' +
      '<div class="sl-body" style="left:352px;right:322px;top:0;bottom:0"><div class="vlist">' + rows + '</div></div>' +
      '<img src="' + IMG + 'image53.jpg" data-step="always" style="position:absolute;right:0;top:0;bottom:0;width:300px;height:100%;object-fit:cover" alt="">';
  };

  // ---- Sistema de los Estándares GRI (slide 3) — reconstrucción animada del diagrama ----
  V.stdsystem = function (s, d) {
    const uni = [
      ['GRI 1', 'Requerimientos y principios para el uso de los Estándares GRI'],
      ['GRI 2', 'Contenidos sobre la organización informante'],
      ['GRI 3', 'Contenidos y orientaciones sobre los temas materiales'],
    ];
    const uniRows = uni.map(u => '<div class="std-book"><div class="bk">' + u[0] + '</div><div>' + esc(u[1]) + '</div></div>').join('');
    const grid = (codes) => '<div class="std-grid">' + codes.map(c => '<div class="bk">' + c + '</div>').join('') + '</div>';
    return gri(false) +
      '<div class="sl-title">Sistema de los Estándares GRI</div>' +
      '<div class="std-wrap">' +
      '<div class="std-top" data-step="0">Estándares GRI</div>' +
      '<div class="std-cols">' +
      '<div class="std-col g" data-step="1"><div class="hd">Estándares Universales</div><div class="bd">' + uniRows + '</div></div>' +
      '<div class="std-col o" data-step="2"><div class="hd">Estándares Sectoriales</div><div class="bd" style="justify-content:center">' + grid(['GRI 11', 'GRI 12', 'GRI 13', 'GRI 14', 'GRI 15', 'GRI 16', 'GRI 17', 'GRI 18', '…']) + '</div></div>' +
      '<div class="std-col p" data-step="3"><div class="hd">Estándares Temáticos</div><div class="bd" style="justify-content:center">' + grid(['GRI 201', 'GRI 403', 'GRI 305', 'GRI 415', 'GRI 303', 'GRI 202', 'GRI 304', 'GRI 205', '…']) + '</div></div>' +
      '</div></div>';
  };

  // ---- GRI 1: Requerimientos "De conformidad" (slide 4) — 9 requisitos ----
  V.req9 = function (s, d) {
    const reqs = [
      'Aplicar los principios para la elaboración de informes.',
      'Presentar los contenidos correspondientes a GRI 2: Contenidos Generales.',
      'Determinar los temas materiales.',
      'Presentar los contenidos correspondientes a GRI 3: Temas Materiales.',
      'Presentar contenidos de los Estándares Temáticos GRI para cada tema material.',
      'Proporcionar los motivos para la omisión relativos al contenido o requisito que no se pueda cumplir.',
      'Publicar un índice de contenidos GRI.',
      'Proporcionar una declaración de uso.',
      'Notificar a GRI.',
    ];
    const rows = reqs.map((r, i) =>
      '<div data-step="' + i + '" style="display:flex;align-items:center;gap:14px;background:var(--gray-card);border-radius:8px;padding:8px 14px">' +
      '<span style="flex:0 0 32px;width:32px;height:32px;border-radius:8px;background:var(--blue);color:#fff;font-weight:bold;font-size:14px;display:flex;align-items:center;justify-content:center">' + (i + 1) + '</span>' +
      '<span style="font-size:13.5px;color:#2A3240">' + esc(r) + '</span></div>').join('');
    return gri(false) +
      '<div class="sl-title" style="font-size:30px">GRI 1: Fundamentos 2021 · Requerimientos</div>' +
      '<div class="sl-sub" data-step="always" style="top:92px"><b>Informe de conformidad</b> con los Estándares GRI</div>' +
      '<div style="position:absolute;left:112px;right:64px;top:138px;bottom:28px;display:flex;flex-direction:column;gap:7px;justify-content:center">' + rows + '</div>';
  };

  // ---- Motivos de omisión (slide 6) — 4 tarjetas ----
  V.omissions = function (s, d) {
    const cards = [
      ['01', 'No procede', 'Por las características de la organización o sus impactos, el requerimiento no aplica a su contexto.'],
      ['02', 'Prohibiciones legales', 'La ley prohíbe recoger la información solicitada o hacerla pública.'],
      ['03', 'Restricciones de confidencialidad', 'La organización considera que la información es confidencial y no puede publicarla.'],
      ['04', 'Información no disponible o incompleta', 'Se dispone del contenido, pero la información no está disponible o está en construcción.'],
    ];
    const grid = cards.map((c, i) =>
      '<div class="gcard" data-step="' + i + '"><b style="display:flex;align-items:center;gap:10px"><span style="background:var(--orange-strong);color:#fff;border-radius:6px;padding:2px 9px;font-size:15px">' + c[0] + '</span>' + esc(c[1]) + '</b>' + esc(c[2]) + '</div>'
    ).join('');
    return gri(false) +
      '<div class="sl-title">Motivos de omisión</div>' +
      '<div class="sl-sub" data-step="always" style="top:92px">Cuando no se puede cumplir un contenido o requisito, se declara uno de estos cuatro motivos:</div>' +
      '<div class="sl-body" style="top:140px"><div class="grid2">' + grid + '</div></div>';
  };

  // ---- Objetivo general (slide 7) ----
  V.objGeneral = function (s, d) {
    return gri(false) +
      '<div class="sl-panel"><div class="pt">Objetivos<br>de la tutoría</div></div>' +
      '<div class="sl-body" style="left:440px;right:56px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">' +
      '<div class="tag-step" data-step="always">Objetivo general</div>' +
      '<div class="callout" data-step="0" style="font-size:16.5px;line-height:1.65">Desarrollar <b>habilidades efectivas</b> en las personas encargadas de elaborar informes de sostenibilidad en las <b>MiPymes</b>, ayudando a quienes no necesariamente son profesionales de la sostenibilidad o de la comunicación y que pueden carecer de las herramientas óptimas para transmitir mensajes de manera efectiva al redactar el informe.</div>' +
      '</div>';
  };

  // ---- Objetivos de aprendizaje (slide 8) — 7 numerados compactos ----
  V.learnobjectives = function (s, d) {
    const items = [
      'Comprender metodologías, formatos y estilos para la redacción de informes.',
      'Explorar diversas técnicas y estilos de redacción adaptados a estos informes.',
      'Conocer y aplicar estrategias de organización y jerarquización de la información.',
      'Reforzar conocimientos fundamentales de gramática y redacción.',
      'Entender y aplicar los Estándares GRI y sus principios.',
      'Aplicar técnicas de visualización de datos.',
      'Explorar el uso de la inteligencia artificial como potencializador del trabajo humano.',
    ];
    const rows = items.map((t, i) =>
      '<div data-step="' + i + '" style="display:flex;align-items:center;position:relative">' +
      '<div style="flex:0 0 40px;width:40px;height:40px;border-radius:50%;background:var(--blue);color:#fff;font-size:16px;font-weight:bold;display:flex;align-items:center;justify-content:center;z-index:2">' + (i + 1) + '</div>' +
      '<div style="background:var(--gray-card);padding:10px 18px 10px 32px;margin-left:-20px;font-size:13.5px;flex:1;color:#242A33">' + esc(t) + '</div></div>').join('');
    return gri(false) +
      '<div class="sl-panel" style="width:352px"><div class="pt" style="font-size:29px">Objetivos<br>de aprendizaje</div></div>' +
      '<div style="position:absolute;left:398px;right:48px;top:36px;bottom:28px;display:flex;flex-direction:column;gap:8px;justify-content:center">' + rows + '</div>';
  };

  // ---- Contenidos de la tutoría (slide 9) — 6 módulos ----
  V.contents6 = function (s, d) {
    const mods = [
      ['Módulo 1', 'Tipos de texto · Proceso de escritura · Estructura del texto · Estilo y tono'],
      ['Módulo 2', 'Organización y jerarquización de la información'],
      ['Módulo 3', 'Principios de redacción · Conexión de ideas · Estilo y presentación'],
      ['Módulo 4', 'Estructura del informe · Principios de elaboración · Proceso de construcción (GRI)'],
      ['Módulo 5', 'Guía: visualización de datos'],
      ['Módulo 6', 'Guía: inteligencia artificial'],
    ];
    const cards = mods.map((m, i) =>
      '<div data-step="' + i + '" style="background:var(--gray-card);border-left:5px solid var(--blue);border-radius:8px;padding:11px 15px;display:flex;flex-direction:column;justify-content:center">' +
      '<div style="font-size:15px;font-weight:bold;color:var(--blue-deep);margin-bottom:5px">' + m[0] + '</div>' +
      '<div style="font-size:12px;color:#3d4655;line-height:1.5">' + esc(m[1]) + '</div></div>').join('');
    return gri(false) +
      '<div class="sl-title">Contenidos de la tutoría</div>' +
      '<div style="position:absolute;left:112px;right:64px;top:118px;bottom:30px;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:13px">' + cards + '</div>';
  };

  // ---- Cierre (slide 10) ----
  V.closing = function (s, d) {
    return '<div class="sl-closing">' +
      '<svg class="arrow" viewBox="0 0 200 200" style="fill:#5C7CB0"><path d="M20 60h60v-40l100 80-100 80v-40H20z"/></svg>' +
      gri(true) +
      '<div class="box"><div style="width:96px;height:96px;border-radius:50%;background:#fff;color:#22549E;font-weight:bold;font-size:30px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px">GRI</div>' +
      '<h1>Fin de la Introducción</h1>' +
      '<p>A continuación, el Módulo 1: tipos de texto, proceso de escritura, estructura y estilo.</p>' +
      '<button class="big-btn" onclick="location.reload()">Volver al inicio</button></div></div>';
  };

  // ============================================================
  //  OVERRIDES por número de diapositiva (ppt)
  // ============================================================
  window.SLIDE_OVERRIDES = {
    1: { kind: 'covIntro', navTitle: 'Portada' },
    2: { kind: 'griwhat', navTitle: '¿Qué es el GRI?' },
    3: { kind: 'stdsystem', navTitle: 'Sistema de los Estándares GRI' },
    4: { kind: 'req9', navTitle: 'GRI 1 · Requerimientos (de conformidad)' },
    5: {
      kind: 'bullets', title: 'GRI 1: Fundamentos 2021 · Requerimientos',
      sub: 'Informe referenciando los Estándares GRI',
      bullets: [
        'Publicar un índice de contenidos GRI.',
        'Proporcionar una declaración de uso.',
        'Notificar a GRI.',
        'Se recomienda aplicar los principios de elaboración de informes e iniciar la transición hacia la opción "de conformidad".',
      ],
      navTitle: 'GRI 1 · Requerimientos (en referencia)',
    },
    6: { kind: 'omissions', navTitle: 'Motivos de omisión' },
    7: { kind: 'objGeneral', navTitle: 'Objetivo general' },
    8: { kind: 'learnobjectives', navTitle: 'Objetivos de aprendizaje' },
    9: { kind: 'contents6', navTitle: 'Contenidos de la tutoría' },
    10: { kind: 'closing', navTitle: 'Cierre' },

    // ===================== MÓDULO 1 =====================
    101: { kind: 'mcover', module: 'Módulo 1', title: 'Redacción de informes de sostenibilidad', navTitle: 'Portada del módulo' },
    102: { kind: 'magenda', title: 'Contenido del módulo', items: ['Objetivos de aprendizaje', 'Tipos de texto', 'El proceso de escritura', 'Estructura de un informe de sostenibilidad', 'Adaptación al estilo y al tono', 'Lecciones aprendidas', 'Cuestionario'], navTitle: 'Agenda' },
    103: { kind: 'mdivider', section: 'Sección 1', title: 'Objetivos de aprendizaje', navTitle: 'Sección 1 · Objetivos' },
    104: { kind: 'objectives', title: 'Objetivos de aprendizaje', items: ['Comprender metodologías, formatos y estilos para la redacción de informes de sostenibilidad.', 'Explorar diversas técnicas y estilos de redacción adaptados a estos informes.'], navTitle: 'Objetivos de aprendizaje' },
    105: { kind: 'mdivider', section: 'Sección 2', title: 'Tipos de texto', photo: 'm1_image57.jpeg', navTitle: 'Sección 2 · Tipos de texto' },
    106: { kind: 'mdef', tag: 'Texto descriptivo', icon: SVG.doc, text: 'El texto descriptivo se utiliza para brindar una idea clara y detallada de una persona, lugar, objeto o situación. Su función principal es ofrecer una representación precisa de la realidad. En los informes de sostenibilidad permite detallar aspectos específicos, como los impactos ambientales o sociales de la organización.', example: 'En el año 2023, la organización redujo sus emisiones de carbono en un 18 %, mediante un programa de eficiencia energética que optimizó el uso de maquinaria y electricidad en sus instalaciones.', navTitle: 'Texto descriptivo' },
    107: { kind: 'mdef', tag: 'Texto narrativo', icon: SVG.people, text: 'El texto narrativo se utiliza cuando queremos contar la historia de cómo la organización ha evolucionado en su enfoque hacia la sostenibilidad. Crea una conexión personal y atractiva con el lector mediante una secuencia lógica o cronológica de hechos.', example: 'Hace cinco años, la organización se dio cuenta de que su impacto ambiental era mayor de lo estimado. Fue entonces cuando decidió reestructurar su cadena de suministro para incluir proveedores locales y reducir las emisiones del transporte.', navTitle: 'Texto narrativo' },
    108: { kind: 'mdef', tag: 'Texto argumentativo', icon: SVG.scale, text: 'El texto argumentativo es útil cuando se necesita persuadir al lector sobre la validez de un punto de vista o decisión, usando evidencias y razonamientos, para justificar decisiones o defender posturas relacionadas con la sostenibilidad.', example: 'Si bien algunas organizaciones prefieren opciones de transporte más económicas, nosotros hemos decidido invertir en vehículos eléctricos para nuestras entregas. Esta elección reduce nuestra huella de carbono y demuestra nuestro compromiso con la sostenibilidad a largo plazo.', navTitle: 'Texto argumentativo' },
    109: { kind: 'mdivider', section: 'Sección 3', title: 'El proceso de escritura', photo: 'm1_image58.png', navTitle: 'Sección 3 · Proceso de escritura' },
    110: { kind: 'msteps', title: 'Etapas del proceso de escritura', steps: ['Preescritura', 'Primer borrador', 'Revisión', 'Edición'], navTitle: 'Las 4 etapas' },
    111: { kind: 'mstepdetail', stepno: 1, illus: 'm1_image59.png', title: 'Preescritura', points: [{ h: 'Recolección y análisis de datos', text: 'Reunir cifras (emisiones, energía, iniciativas) y tenerlas actualizadas y organizadas en categorías, según los Contenidos Generales y Temáticos a reportar.' }, { h: 'Organización de las ideas', text: 'Armar un esquema con las secciones principales —logros, retos y futuras acciones— que sirva de guía durante la escritura.' }], navTitle: 'Etapa 1 · Preescritura' },
    112: { kind: 'mstepdetail', stepno: 2, illus: 'm1_image61.png', title: 'Primer borrador', points: [{ h: 'Plasmar las ideas', text: 'Escribir las primeras ideas, narrativas y datos sin preocuparse aún por el estilo o el formato; el objetivo es sentar las bases del informe.' }, { h: 'Alinear con los Estándares GRI', text: 'Relacionar cifras y logros con los compromisos de sostenibilidad y asegurar que cada sección responda a los requerimientos de los Estándares GRI, identificando vacíos por completar.' }], navTitle: 'Etapa 2 · Primer borrador' },
    113: { kind: 'mstepdetail', stepno: 3, illus: 'm1_image63.png', title: 'Revisión', points: [{ h: 'Coherencia y estructura', text: 'Ideas en orden lógico; secciones que fluyen de manera natural con transiciones claras entre párrafos.' }, { h: 'Claridad', text: 'Lenguaje comprensible para todos; simplificar lo muy técnico o agregar ejemplos.' }, { h: 'Revisión de datos', text: 'Números y estadísticas precisos y respaldados por fuentes confiables.' }], navTitle: 'Etapa 3 · Revisión' },
    114: { kind: 'mstepdetail', stepno: 4, illus: 'm1_image65.png', title: 'Edición', points: [{ h: 'Corrección ortográfica y gramatical', text: 'Eliminar errores que puedan restar credibilidad al informe.' }, { h: 'Consistencia en el tono y el estilo', text: 'Tono y estilo consistentes en todo el documento, con lenguaje profesional.' }, { h: 'Formato final', text: 'Informe bien organizado (títulos, subtítulos, gráficos, tablas), con un diseño limpio y atractivo.' }], navTitle: 'Etapa 4 · Edición' },
  };
})();
