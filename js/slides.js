/* ============================================================
   Tutorías GRI — Vistas de diapositivas (arquetipos + overrides)
   ============================================================ */
(function () {
  'use strict';

  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const IMG = 'img/';

  // ---------- iconos SVG reutilizables ----------
  const SVG = {
    globe: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm6.9 6h-2.5a15 15 0 00-1.2-3.2A8 8 0 0118.9 8zM12 4c.7 1 1.3 2.4 1.7 4h-3.4C10.7 6.4 11.3 5 12 4zM4.3 14a8 8 0 010-4h2.9a17 17 0 000 4H4.3zm.8 2h2.5a15 15 0 001.2 3.2A8 8 0 015.1 16zm2.5-8H5.1a8 8 0 013.7-3.2A15 15 0 007.6 8zM12 20c-.7-1-1.3-2.4-1.7-4h3.4c-.4 1.6-1 3-1.7 4zm2.1-6H9.9a15 15 0 010-4h4.2a15 15 0 010 4zm.6 5.2a15 15 0 001.2-3.2h2.5a8 8 0 01-3.7 3.2zm2.2-5.2a17 17 0 000-4h2.9a8 8 0 010 4h-2.9z"/></svg>',
    dd: '<svg viewBox="0 0 24 24"><path d="M12 4a8 8 0 00-8 8H1l4 4 4-4H6a6 6 0 016-6V4zm7 4l-4 4h3a6 6 0 01-6 6v2a8 8 0 008-8h3l-4-4z"/></svg>',
    topic: '<svg viewBox="0 0 24 24"><path d="M3 5h18v2H3zM3 9h18v2H3zM3 13h12v2H3zM3 17h12v2H3zM17 13l4 3-4 3z"/></svg>',
    people: '<svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>',
    clip: '<svg viewBox="0 0 24 24"><path d="M17 3h-2.2a3 3 0 00-5.6 0H7a2 2 0 00-2 2v15a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2zm-5 0a1 1 0 110 2 1 1 0 010-2zM9 8h6v2H9zM9 12h6v2H9zM9 16h4v2H9z"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M12 3v10l3.5-3.5L17 11l-5 5-5-5 1.5-1.5L12 13V3zM5 19h14v2H5z"/></svg>',
    target: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12zm0 3a3 3 0 100 6 3 3 0 000-6z"/></svg>',
    scale: '<svg viewBox="0 0 24 24"><path d="M12 3v2H8v2h3v10a2 2 0 002 2h3v-2h-3V7h3V5h-4V3z"/></svg>',
    leaf: '<svg viewBox="0 0 24 24"><path d="M17 8C8 10 5 16 5 21h2c0-1 .5-2 1-3 8 0 12-5 13-13-1 1-3 1.5-5 2-1 .5-2 1-3 1z"/></svg>',
    factory: '<svg viewBox="0 0 24 24"><path d="M2 20V9l6 4V9l6 4V4h6v16H2zm4-3h2v2H6v-2zm4 0h2v2h-2v-2z"/></svg>',
    truck: '<svg viewBox="0 0 24 24"><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7zM6.5 17a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm11 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/></svg>',
    box: '<svg viewBox="0 0 24 24"><path d="M12 2l9 4v12l-9 4-9-4V6zm0 2.2L5 7l7 3 7-3zm-7 5.3v7l6 2.7v-7zm14 0l-6 2.7v7l6-2.7z"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 20V4h2v14h14v2zM8 16v-5h2v5zm4 0V8h2v8zm4 0v-3h2v3z"/></svg>',
    warn: '<svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2zm0-4h-2V9h2z"/></svg>',
  };

  // ---------- badge GRI ----------
  const gri = (inv) => '<div class="gri-badge' + (inv ? ' inv' : '') + '">GRI</div>';

  // ---------- helpers de imagen ----------
  const has = (s, name) => (s.media || []).includes(name);
  const firstImg = (s, exts) => {
    exts = exts || ['png', 'jpeg', 'jpg'];
    return (s.media || []).find(f => exts.some(e => f.toLowerCase().endsWith(e)));
  };

  // ============================================================
  //  DISPATCH
  // ============================================================
  const V = {};
  window.SlideViews = {
    render(s) {
      const d = mergedDef(s);
      const fn = V[d.kind] || V.bullets;
      return fn(s, d);
    }
  };

  // merge auto def + overrides
  function mergedDef(s) {
    const auto = (window.SLIDEDEFS_AUTO && window.SLIDEDEFS_AUTO[s.ppt]) || { kind: s.type === 'quiz' ? 'quiz' : (s.type === 'closing' ? 'closing' : 'bullets'), title: s.title, bullets: [] };
    const ov = (window.SLIDE_OVERRIDES && window.SLIDE_OVERRIDES[s.ppt]) || {};
    return Object.assign({}, auto, ov);
  }

  // reveal helper: bullets con data-step incremental
  function stepList(items, opts) {
    opts = opts || {};
    return items.map((t, i) => {
      const anim = opts.anim ? ' data-anim="' + opts.anim + '"' : '';
      return '<div class="' + (opts.cls || 'vitem') + '" data-step="' + i + '"' + anim + '>' + t + '</div>';
    }).join('');
  }

  // ============================================================
  //  ARQUETIPOS
  // ============================================================

  // ---- portada ----
  V.cover = function (s, d) {
    const photo = d.photo || 'image1.jpeg';
    return gri(false) +
      '<div class="sl-cover">' +
      '<img class="photo" src="' + IMG + photo + '" alt="">' +
      '<div class="panel">' +
      '<h1>' + esc(d.h1 || 'Materialidad de impacto') + '</h1>' +
      '<div class="sub">' + esc(d.sub || 'Tutorías GRI') + '</div>' +
      '</div></div>';
  };

  // ---- divisor módulo/paso ----
  V.divider = function (s, d) {
    const isStep = d.variant === 'step';
    const photo = d.photo || (isStep ? 'image8.jpeg' : 'image10.jpeg');
    let title = esc(d.title || s.title);
    let stepno = '';
    if (isStep) {
      const mm = (d.title || s.title || '').match(/^Paso\s*\d+/i);
      if (mm) { stepno = '<div class="stepno">' + mm[0].toUpperCase() + '</div>'; title = esc((d.title || s.title).replace(/^Paso\s*\d+\s*/i, '').trim()); }
    }
    return gri(false) +
      '<div class="sl-divider">' +
      '<img class="photo" src="' + IMG + photo + '" alt="" data-step="always">' +
      '<div class="panel"><div>' + stepno + '<h1>' + title + '</h1></div></div>' +
      '</div>';
  };

  // ---- objetivos numerados ----
  V.objectives = function (s, d) {
    const items = (d.items && d.items.length ? d.items : (d.bullets || []));
    const rows = items.map((t, i) =>
      '<div class="obj-item" data-step="' + i + '"><div class="num">' + (i + 1) + '</div><div class="txt">' + esc(t) + '</div></div>'
    ).join('');
    return gri(false) +
      '<div class="sl-panel"><div class="pt">' + esc(d.title || 'Objetivos de aprendizaje') + '</div></div>' +
      '<div class="obj-list">' + rows + '</div>';
  };

  // ---- TOC de módulo ----
  V.toc = function (s, d) {
    const items = (d.items && d.items.length ? d.items : (d.bullets || []));
    const icons = d.icons || [SVG.globe, SVG.topic, SVG.people, SVG.check, SVG.doc, SVG.target];
    const rows = items.map((t, i) =>
      '<div class="toc-item" data-step="' + i + '"><div class="ic">' + (d.numbered ? (i + 1) : (icons[i % icons.length])) + '</div><div>' + esc(t) + '</div></div>'
    ).join('');
    const heading = d.moduleLabel || s.title;
    return gri(false) +
      '<div class="sl-panel"><div class="pt">' + esc(heading) + '</div></div>' +
      '<div class="sl-body" style="left:440px"><div class="toc-list">' + rows + '</div></div>';
  };

  // ---- ¡Pongámonos a prueba! ----
  V.prooftest = function (s, d) {
    return '<div style="position:absolute;inset:0;background:linear-gradient(135deg,#173A6F,#22549E 60%,#2E67BC)"></div>' +
      gri(true) +
      '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center">' +
      '<div data-step="always" style="width:92px;height:92px;border-radius:50%;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;margin-bottom:24px">' +
      '<svg viewBox="0 0 24 24" style="width:46px;height:46px;fill:#fff"><path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2zm-3 17h6v2H9zm1 3h4v1h-4z"/></svg></div>' +
      '<h1 style="font-size:44px">¡Pongámonos a prueba!</h1>' +
      '<p style="font-size:18px;color:#C9DAF4;margin-top:12px;max-width:620px">' + esc(d.sub || 'Comprobemos lo aprendido en esta sección.') + '</p>' +
      '</div>';
  };

  // ---- qué hemos aprendido ----
  V.learned = function (s, d) {
    const items = (d.items && d.items.length ? d.items : (d.bullets || []));
    const rows = items.map((t, i) =>
      '<div class="sum-item" data-step="' + i + '"><div class="ck">' + SVG.check + '</div><div>' + esc(t) + '</div></div>'
    ).join('');
    return gri(false) +
      '<div class="sl-title">' + esc(d.title || '¿Qué hemos aprendido?') + '</div>' +
      '<div class="sl-body"><div class="sum-list">' + rows + '</div></div>';
  };

  // ---- lista de bullets genérica ----
  V.bullets = function (s, d) {
    const items = (d.bullets && d.bullets.length ? d.bullets : []);
    const body = items.length
      ? '<div class="vlist">' + items.map((t, i) =>
          '<div class="vitem" data-step="' + i + '"><div class="bd-ic">' + (i + 1) + '</div><div>' + fmtBullet(t) + '</div></div>'
        ).join('') + '</div>'
      : '<div class="callout" data-step="always">' + esc(s.screen_text || '') + '</div>';
    const sub = d.sub ? '<div class="sl-sub" data-step="always">' + esc(d.sub) + '</div>' : '';
    const bodyTop = d.sub ? 'top:140px' : '';
    return gri(false) +
      '<div class="sl-title' + (d.title && d.title.length > 42 ? ' sm' : '') + '">' + esc(d.title || s.title) + '</div>' +
      sub +
      '<div class="sl-body" style="' + bodyTop + '">' + body + '</div>';
  };
  function fmtBullet(t) {
    // negrita hasta ':' inicial
    const m = String(t).match(/^([^:]{2,42}):\s*(.+)$/);
    if (m) return '<b>' + esc(m[1]) + ':</b> ' + esc(m[2]);
    return esc(t);
  }

  // ---- panel izquierdo + bullets (concepto texto) ----
  V.panelBullets = function (s, d) {
    const items = d.bullets || [];
    const rows = items.map((t, i) => '<div class="vitem" data-step="' + i + '"><div class="bd-ic">' + SVG.check + '</div><div>' + fmtBullet(t) + '</div></div>').join('');
    return gri(false) +
      '<div class="sl-panel"><div class="pt">' + esc(d.title) + '</div></div>' +
      '<div class="sl-body"><div class="vlist">' + rows + '</div></div>';
  };

  // ---- closing ----
  V.closing = function (s, d) {
    return '<div class="sl-closing">' +
      '<svg class="arrow" viewBox="0 0 200 200" style="fill:#5C7CB0"><path d="M20 60h60v-40l100 80-100 80v-40H20z"/></svg>' +
      gri(true) +
      '<div class="box"><div style="width:96px;height:96px;border-radius:50%;background:#fff;color:#22549E;font-weight:bold;font-size:30px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px">GRI</div>' +
      '<h1>¡Gracias por acompañarnos!</h1>' +
      '<p>Has completado la tutoría de Materialidad de impacto.</p>' +
      '<button class="big-btn" onclick="location.reload()">Volver al inicio</button></div></div>';
  };

  // ---- quiz (delegado) ----
  V.quiz = function (s, d) {
    return window.QuizUI.render(s, d);
  };

  window.__V = V; window.__SVG = SVG; window.__esc = esc;
  window.SlideArch = { stepList, fmtBullet, gri, SVG, IMG, esc, firstImg };
})();
