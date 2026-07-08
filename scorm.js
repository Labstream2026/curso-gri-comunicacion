/* ============================================================
   Adaptador SCORM 1.2 — Tutorías GRI
   Solo se incluye en el paquete SCORM (no en la vista previa web).
   Busca la API del LMS, inicializa, y reporta:
   - cmi.core.lesson_status: incomplete → completed (al terminar el curso)
   - cmi.core.score.raw: % de aciertos del cuestionario final (0-100)
   Si no hay LMS (p.ej. abierto directo en un navegador), no hace nada.
   ============================================================ */
(function () {
  'use strict';

  var API = null;
  var inited = false;
  var finished = false;

  function findAPI(win) {
    var tries = 0;
    while (win && tries < 12) {
      if (win.API) return win.API;
      if (win.parent && win.parent !== win) { win = win.parent; tries++; continue; }
      break;
    }
    return null;
  }

  function locate() {
    try {
      API = findAPI(window);
      if (!API && window.opener) API = findAPI(window.opener);
    } catch (e) { API = null; }
    return API;
  }

  function init() {
    if (inited || !locate()) return;
    try {
      API.LMSInitialize('');
      inited = true;
      var st = API.LMSGetValue('cmi.core.lesson_status');
      if (!st || st === 'not attempted' || st === 'unknown') {
        API.LMSSetValue('cmi.core.lesson_status', 'incomplete');
        API.LMSCommit('');
      }
    } catch (e) { inited = false; }
  }

  function finish() {
    if (!inited || finished) return;
    try { API.LMSCommit(''); API.LMSFinish(''); finished = true; } catch (e) {}
  }

  var lastPayload = '';

  // Llamado por course.js en cada saveProgress(State)
  function sync(State) {
    if (!inited) init();
    if (!inited || finished) return;
    try {
      var total = State.slides.length;
      var visited = Object.keys(State.visited || {}).length;
      var qs = State.slides.filter(function (s) { return s.correct && s.id.indexOf('qs') === 0; });
      var answered = qs.filter(function (s) { return typeof State.quizAnswered[s.id] === 'string'; });
      var good = answered.filter(function (s) { return State.quizAnswered[s.id] === s.correct; }).length;
      var done = visited >= total;

      var payload = visited + '|' + answered.length + '|' + good + '|' + done;
      if (payload === lastPayload) return;   // sin cambios: no spamear al LMS
      lastPayload = payload;

      if (qs.length && answered.length) {
        var raw = Math.round(good / qs.length * 100);
        API.LMSSetValue('cmi.core.score.min', '0');
        API.LMSSetValue('cmi.core.score.max', '100');
        API.LMSSetValue('cmi.core.score.raw', String(raw));
      }
      if (done) API.LMSSetValue('cmi.core.lesson_status', 'completed');
      API.LMSCommit('');
    } catch (e) {}
  }

  window.ScormBridge = { sync: sync, finish: finish };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('pagehide', finish);
  window.addEventListener('beforeunload', finish);
})();
