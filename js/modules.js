/* ============================================================
   Tutorías GRI — Arquetipos reutilizables para los módulos
   (se cargan antes que overrides.js)
   ============================================================ */
(function () {
  'use strict';
  const A = window.SlideArch;
  const V = window.__V;
  const SVG = A.SVG, IMG = A.IMG, esc = A.esc, gri = A.gri;

  // ---- Portada de módulo ----
  V.mcover = function (s, d) {
    return '<div style="position:absolute;inset:0;background:linear-gradient(135deg,#173A6F 0%,#22549E 60%,#2E67BC 100%)"></div>' +
      gri(true) +
      '<div style="position:absolute;left:96px;right:96px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;color:#fff" data-step="always">' +
      '<div style="font-size:17px;letter-spacing:3px;text-transform:uppercase;color:#BCD3F2;font-weight:bold;margin-bottom:20px">' + esc(d.module || 'Módulo') + '</div>' +
      '<h1 style="font-size:46px;line-height:1.14;font-weight:bold;max-width:900px">' + esc(d.title || s.title) + '</h1>' +
      '<div style="width:70px;height:5px;background:var(--orange-strong);margin:24px 0;border-radius:3px"></div>' +
      '<div style="font-size:20px;color:#D5E3F6">' + esc(d.sub || 'Tutorías GRI · Comunicación efectiva en sostenibilidad') + '</div>' +
      '</div>';
  };

  // ---- Agenda / contenido del módulo (numerada) ----
  V.magenda = function (s, d) {
    const items = d.items || [];
    const rows = items.map((t, i) =>
      '<div class="toc-item" data-step="' + i + '"><div class="ic">' + (i + 1) + '</div><div>' + esc(t) + '</div></div>'
    ).join('');
    return gri(false) +
      '<div class="sl-panel"><div class="pt">' + esc(d.title || 'Agenda') + '</div></div>' +
      '<div class="sl-body" style="left:440px;right:56px"><div class="toc-list">' + rows + '</div></div>';
  };

  // ---- Divisor de sección (con foto opcional del PPT) ----
  V.mdivider = function (s, d) {
    const hasPhoto = !!d.photo;
    const photo = hasPhoto
      ? '<img class="mdiv-photo" src="' + IMG + d.photo + '" alt="" data-step="always"><div class="mdiv-photo-grad" data-step="always"></div>'
      : '';
    const rightBound = hasPhoto ? 'right:47%' : 'right:120px';
    return '<div style="position:absolute;inset:0;background:#fff"></div>' + photo +
      '<div style="position:absolute;left:0;top:0;bottom:0;width:14px;background:var(--orange-strong);z-index:3" data-step="always"></div>' +
      '<div style="position:absolute;left:120px;' + rightBound + ';top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;z-index:3" data-step="always">' +
      '<div style="font-size:20px;letter-spacing:2px;text-transform:uppercase;color:var(--orange-strong);font-weight:bold;margin-bottom:14px">' + esc(d.section || 'Sección') + '</div>' +
      '<h1 style="font-size:44px;line-height:1.16;color:var(--blue-deep);font-weight:bold">' + esc(d.title || s.title) + '</h1>' +
      '</div>';
  };

  // ---- Definición + ejemplo (tipos de texto, tonos) ----
  V.mdef = function (s, d) {
    const ic = d.icon ? '<div style="width:64px;height:64px;border-radius:16px;background:var(--blue);display:flex;align-items:center;justify-content:center;margin-bottom:18px"><div style="width:34px;height:34px;fill:#fff">' + d.icon + '</div></div>' : '';
    const ex = d.example ? '<div class="quote" data-step="1" style="font-size:18px;margin-top:20px;border-left:5px solid var(--orange-strong);padding-left:20px">“' + esc(d.example) + '”</div>' : '';
    return gri(false) +
      (d.tag ? '<div class="case-tag" style="font-size:30px;top:36px"><div class="ic" style="width:34px;height:34px">' + (d.icon || SVG.doc) + '</div>' + esc(d.tag) + '</div>' : '<div class="sl-title">' + esc(d.title || s.title) + '</div>') +
      '<div class="sl-body" style="top:120px"><div class="callout" data-step="0" style="font-size:17px;line-height:1.65">' + esc(d.text || '') + '</div>' + ex + '</div>';
  };

  // ---- Grid de tarjetas (2 col) ----
  V.mcards = function (s, d) {
    const cards = (d.cards || []).map((c, i) =>
      '<div class="gcard' + (c.blue ? ' blue' : '') + '" data-step="' + i + '" style="display:flex;flex-direction:column;justify-content:center">' +
      (c.title ? '<b>' + esc(c.title) + '</b>' : '') + '<span style="font-size:13.5px;line-height:1.5">' + esc(c.text || '') + '</span></div>'
    ).join('');
    const cols = d.cols || 2;
    return gri(false) +
      '<div class="sl-title' + ((d.title || '').length > 42 ? ' sm' : '') + '">' + esc(d.title || s.title) + '</div>' +
      (d.sub ? '<div class="sl-sub" data-step="always" style="top:92px">' + esc(d.sub) + '</div>' : '') +
      '<div style="position:absolute;left:112px;right:64px;top:' + (d.sub ? 142 : 120) + 'px;bottom:34px;display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:16px">' + cards + '</div>';
  };

  // ---- Pasos numerados (proceso) ----
  V.msteps = function (s, d) {
    const steps = d.steps || [];
    const rows = steps.map((t, i) =>
      '<div data-step="' + i + '" style="display:flex;align-items:center;position:relative;flex:1">' +
      '<div style="flex:0 0 50px;width:50px;height:50px;border-radius:50%;background:var(--blue);color:#fff;font-size:20px;font-weight:bold;display:flex;align-items:center;justify-content:center;z-index:2">' + (i + 1) + '</div>' +
      '<div style="background:var(--gray-card);padding:14px 20px 14px 34px;margin-left:-18px;font-size:16px;flex:1;color:#242A33;font-weight:bold">' + esc(t) + '</div></div>'
    ).join('');
    return gri(false) +
      '<div class="sl-title">' + esc(d.title || s.title) + '</div>' +
      '<div class="sl-body" style="top:130px;display:flex;flex-direction:column;gap:16px;justify-content:center">' + rows + '</div>';
  };

  // ---- Detalle de una etapa/paso (sub-puntos + ilustración opcional del PPT) ----
  V.mstepdetail = function (s, d) {
    const pts = (d.points || []).map((p, i) =>
      '<div class="vitem" data-step="' + i + '"><div class="bd-ic">' + SVG.check + '</div><div>' + (p.h ? '<b>' + esc(p.h) + ':</b> ' : '') + esc(p.text || p) + '</div></div>'
    ).join('');
    const illus = d.illus
      ? '<div style="background:rgba(255,255,255,.95);border-radius:16px;padding:14px;width:236px;height:172px;display:flex;align-items:center;justify-content:center;margin-top:24px" data-step="always"><img src="' + IMG + d.illus + '" style="max-width:100%;max-height:100%;object-fit:contain" alt=""></div>'
      : '';
    return gri(false) +
      '<div class="sl-panel" style="width:356px;flex-direction:column;padding:0 40px">' +
      '<div class="pt" style="font-size:28px">' + (d.stepno ? '<div style="font-size:18px;color:#BCD3F2;margin-bottom:8px">Etapa ' + d.stepno + '</div>' : '') + esc(d.title || s.title) + '</div>' + illus +
      '</div>' +
      '<div class="sl-body" style="left:404px;right:56px"><div class="vlist">' + pts + '</div></div>';
  };

  // ---- Comparación dos columnas (estilo activo/pasivo) ----
  V.mcompare = function (s, d) {
    const col = (c, i) => '<div data-step="' + i + '" style="flex:1;background:' + (c.blue ? 'var(--blue)' : 'var(--gray-card)') + ';color:' + (c.blue ? '#fff' : '#242A33') + ';border-radius:12px;padding:22px 24px;display:flex;flex-direction:column">' +
      '<div style="font-size:20px;font-weight:bold;color:' + (c.blue ? '#fff' : 'var(--blue-deep)') + ';margin-bottom:12px">' + esc(c.h) + '</div>' +
      '<div style="font-size:14.5px;line-height:1.6;flex:1">' + esc(c.text) + '</div>' +
      (c.example ? '<div style="margin-top:14px;font-style:italic;font-size:14px;border-left:4px solid ' + (c.blue ? 'rgba(255,255,255,.6)' : 'var(--orange-strong)') + ';padding-left:14px">“' + esc(c.example) + '”</div>' : '') +
      '</div>';
    return gri(false) +
      '<div class="sl-title">' + esc(d.title || s.title) + '</div>' +
      '<div style="position:absolute;left:112px;right:64px;top:130px;bottom:40px;display:flex;gap:24px;align-items:stretch">' +
      col(d.left, 0) + col(d.right, 1) + '</div>';
  };

  // ---- Lista de contenidos GRI (códigos 2-x / 3-x) ----
  V.mcontents = function (s, d) {
    const rows = (d.contents || []).map((c, i) =>
      '<div data-step="' + i + '" style="display:flex;align-items:flex-start;gap:14px;background:var(--gray-card);border-radius:8px;padding:10px 15px">' +
      '<span style="flex:0 0 auto;background:var(--teal);color:#fff;font-weight:bold;font-size:12.5px;padding:3px 10px;border-radius:6px;white-space:nowrap">' + esc(c.code) + '</span>' +
      '<span style="font-size:13.5px;color:#2A3240;line-height:1.45">' + esc(c.label) + '</span></div>'
    ).join('');
    return gri(false) +
      '<div class="sl-title' + ((d.title || '').length > 42 ? ' sm' : '') + '">' + esc(d.title || s.title) + '</div>' +
      (d.sub ? '<div class="sl-sub" data-step="always" style="top:92px">' + esc(d.sub) + '</div>' : '') +
      '<div style="position:absolute;left:112px;right:64px;top:' + (d.sub ? 140 : 120) + 'px;bottom:32px;display:flex;flex-direction:column;gap:9px;justify-content:center">' + rows + '</div>';
  };

  // ---- Estructura por fases (introducción/desarrollo/conclusión) ----
  V.mstruct = function (s, d) {
    const colors = ['var(--blue)', 'var(--teal)', 'var(--orange-strong)'];
    const cols = (d.groups || []).map((g, i) =>
      '<div data-step="' + i + '" style="flex:1;border-top:5px solid ' + colors[i % 3] + ';background:var(--gray-card);border-radius:0 0 10px 10px;padding:16px 18px;display:flex;flex-direction:column">' +
      '<div style="font-size:18px;font-weight:bold;color:' + colors[i % 3] + ';margin-bottom:12px">' + esc(g.phase) + '</div>' +
      g.items.map(it => '<div style="font-size:13px;color:#2A3240;padding:4px 0;line-height:1.4">' + esc(it) + '</div>').join('') +
      '</div>'
    ).join('');
    return gri(false) +
      '<div class="sl-title">' + esc(d.title || s.title) + '</div>' +
      '<div style="position:absolute;left:112px;right:64px;top:130px;bottom:40px;display:flex;gap:20px;align-items:stretch">' + cols + '</div>';
  };

  window.__MODV = true;
})();
