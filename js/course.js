/* ============================================================
   Tutorías GRI — Motor del curso (player)
   ============================================================ */
(function () {
  'use strict';

  const LS_KEY = 'gri_materialidad_progress_v1';
  const MODEL_URL = 'data/course_model.json';

  const State = {
    model: null,
    slides: [],
    i: 0,                 // índice de diapositiva actual
    partIdx: 0,           // parte de audio actual dentro de la diapositiva
    playing: false,
    autoplay: true,
    rate: 1,
    volume: 1,
    fontScale: 0,         // 0 normal, 1 grande, 2 extra
    revealed: 0,          // steps revelados en la diapositiva actual
    quizAnswered: {},     // id -> bool
    quizGatePassed: {},   // id -> bool (ya se puede avanzar)
    visited: {},          // id -> true
    audio: null,
    revealTimers: [],
    partStartTs: 0,
    scheduledReveals: [],
    plan: [],
    stepTiming: null,     // step -> fracción dentro de su parte (sincronía con la narración)
    booted: false,
  };

  // ---------- def combinada (auto + overrides) ----------
  function mergedDef(s) {
    const auto = (window.SLIDEDEFS_AUTO && window.SLIDEDEFS_AUTO[s.ppt]) || {};
    const ov = (window.SLIDE_OVERRIDES && window.SLIDE_OVERRIDES[s.ppt]) || {};
    return Object.assign({}, auto, ov);
  }

  // ---------- utilidades ----------
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = (s) => { s = Math.max(0, Math.round(s || 0)); const m = Math.floor(s / 60); const r = s % 60; return m + ':' + String(r).padStart(2, '0'); };

  function saveProgress() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        i: State.i, visited: State.visited, quizAnswered: State.quizAnswered,
        quizGate: State.quizGatePassed, rate: State.rate, volume: State.volume,
        autoplay: State.autoplay, fontScale: State.fontScale, t: Date.now(),
      }));
    } catch (e) {}
  }
  function loadProgress() {
    try {
      const raw = localStorage.getItem(LS_KEY); if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  // ============================================================
  //  ARRANQUE
  // ============================================================
  async function boot() {
    const V = '?v=13';
    const [modelRes, defsRes, phRes] = await Promise.all([
      fetch(MODEL_URL + V),
      fetch('data/slidedefs_auto.json' + V),
      fetch('data/slides_html.json' + V).catch(() => null),
    ]);
    State.model = await modelRes.json();
    window.SLIDEDEFS_AUTO = await defsRes.json();
    try { window.PPTX_HTML = phRes ? await phRes.json() : {}; } catch (e) { window.PPTX_HTML = {}; }
    State.slides = State.model.slides;
    // vincula defs de vista (auto + overrides)
    State.slides.forEach(s => { s.def = mergedDef(s); });

    const saved = loadProgress();
    if (saved) {
      State.visited = saved.visited || {};
      State.quizAnswered = saved.quizAnswered || {};
      State.quizGatePassed = saved.quizGate || {};
      State.rate = saved.rate || 1;
      State.volume = saved.volume == null ? 1 : saved.volume;
      State.autoplay = saved.autoplay !== false;
      State.fontScale = saved.fontScale || 0;
    }

    buildSidebar();
    bindControls();
    bindKeys();
    fitStage();
    applyFontScale();
    window.addEventListener('resize', fitStage);

    // overlay de inicio
    const hasProgress = saved && Object.keys(State.visited).length > 1;
    setupStartOverlay(hasProgress ? (saved.i || 0) : 0, hasProgress);
  }

  function setupStartOverlay(resumeIndex, hasProgress) {
    const ov = $('#overlay');
    const cont = $('#ov-continue');
    if (hasProgress) {
      cont.classList.remove('hidden');
      cont.onclick = () => { hideOverlay(); goTo(resumeIndex, true); };
    } else {
      cont.classList.add('hidden');
    }
    $('#ov-start').onclick = () => { hideOverlay(); goTo(0, true); };
    // reflejar ajustes guardados
    $('#rate-sel').value = String(State.rate);
    $('#vol').value = String(State.volume);
    setToggle($('#autoplay-toggle'), State.autoplay);
  }
  function hideOverlay() { $('#overlay').classList.add('hidden'); }

  // ============================================================
  //  ESCALA DEL STAGE (1280x720 responsive)
  // ============================================================
  function fitStage() {
    const box = $('#stagebox');
    const stage = $('#stage');
    const pad = 28;
    const w = box.clientWidth - pad * 2;
    const h = box.clientHeight - pad * 2;
    const scale = Math.min(w / 1280, h / 720);
    stage.style.transform = 'scale(' + scale + ')';
  }
  function applyFontScale() { const st = $('#stage'); if (st) st.dataset.fs = String(State.fontScale || 0); }

  // ============================================================
  //  ÍNDICE LATERAL
  // ============================================================
  function buildSidebar() {
    const list = $('#sb-list');
    list.innerHTML = '';
    let curMod = -1, group = null;
    State.slides.forEach((s, idx) => {
      if (s.module !== curMod) {
        curMod = s.module;
        const mod = el('div', 'sb-mod');
        const mt = el('span', 'mtitle'); mt.textContent = State.model.modules[curMod];
        const chev = el('span', 'chev'); chev.textContent = '▼';
        mod.appendChild(mt); mod.appendChild(chev);
        const grp = el('div', 'sb-group');
        mod.onclick = () => { mod.classList.toggle('collapsed'); grp.classList.toggle('collapsed'); };
        list.appendChild(mod); list.appendChild(grp);
        group = grp;
      }
      const item = el('button', 'sb-item');
      item.dataset.idx = idx;
      const badge = s.type === 'quiz' ? '<span class="qz">QUIZ</span>' : '';
      const label = sidebarLabel(s);
      item.innerHTML = '<span class="st">○</span><span class="n">' + label + '</span>' + badge;
      item.onclick = () => { goTo(idx, true); };
      (group || list).appendChild(item);
    });
    refreshSidebar();
  }
  function sidebarLabel(s) {
    if (s.def && s.def.navTitle) return s.def.navTitle;
    let t = (s.title || '').replace(/\s+/g, ' ').trim();
    t = t.replace(/^Contenido\s*Módulo\s*\d+:\s*/i, 'Contenido: ');
    if (!t) t = s.screen_text ? s.screen_text.split('\n')[0] : s.id;
    return t.length > 46 ? t.slice(0, 44) + '…' : t;
  }
  function refreshSidebar() {
    $$('.sb-item').forEach(it => {
      const idx = +it.dataset.idx;
      const s = State.slides[idx];
      it.classList.toggle('current', idx === State.i);
      const done = State.visited[s.id];
      it.classList.toggle('done', !!done);
      $('.st', it).textContent = done ? '✓' : (idx === State.i ? '▸' : '○');
    });
    const total = State.slides.length;
    const done = Object.keys(State.visited).length;
    const pct = Math.round(done / total * 100);
    $('#sb-fill').style.width = pct + '%';
    $('#sb-pct').textContent = done + ' de ' + total + ' diapositivas · ' + pct + '%';
    const cur = $('.sb-item.current');
    if (cur) {
      const grp = cur.closest('.sb-group');
      if (grp && grp.classList.contains('collapsed')) {
        grp.classList.remove('collapsed');
        if (grp.previousElementSibling) grp.previousElementSibling.classList.remove('collapsed');
      }
      cur.scrollIntoView({ block: 'nearest' });
    }
  }

  // ============================================================
  //  NAVEGACIÓN
  // ============================================================
  function goTo(index, autoStart) {
    index = clamp(index, 0, State.slides.length - 1);
    stopAudio();
    State.i = index;
    State.partIdx = 0;
    State.revealed = 0;
    const s = State.slides[index];
    State.visited[s.id] = true;

    renderSlide(s);
    updateChrome();
    refreshSidebar();
    saveProgress();

    // ¿el autoplay avanza aquí?
    const shouldPlay = autoStart !== false && State.autoplay;
    if (s.type === 'closing') { showEndState(); return; }
    if (shouldPlay) { playFromPart(0); }
    else { State.playing = false; updatePlayBtn(); prepareStaticReveal(s); }
  }
  function next() {
    if (State.i >= State.slides.length - 1) { showEndState(); return; }
    goTo(State.i + 1, true);
  }
  function prev() { goTo(State.i - 1, true); }

  // Gate de quiz: no auto-avanzar hasta responder
  function canAutoAdvance(s) {
    if (s.noauto) return false;  // preguntas y guías: el usuario avanza cuando esté listo
    if (s.type === 'quiz') return !!State.quizGatePassed[s.id];
    return true;
  }

  // aviso al terminar una diapositiva autoguiada: seguir con la flecha
  function showNextHint() {
    const node = $('#stage .sl');
    if (!node || $('.next-hint', node)) return;
    const h = el('div', 'next-hint', 'Cuando estés listo, continúa con <b>→</b>');
    node.appendChild(h);
  }

  // ============================================================
  //  RENDER DE DIAPOSITIVA
  // ============================================================
  function renderSlide(s) {
    const stage = $('#stage');
    stage.innerHTML = '';
    const node = el('div', 'sl');
    node.dataset.id = s.id;
    // llamar renderer de la def o fallback
    let inner = '';
    try {
      inner = (window.SlideViews && window.SlideViews.render)
        ? window.SlideViews.render(s)
        : '<div class="sl-body"><h1>' + (s.title || '') + '</h1></div>';
    } catch (e) {
      inner = '<div class="sl-body"><h2>' + (s.title || s.id) + '</h2><pre style="white-space:pre-wrap;font-size:13px">' + (s.screen_text || '') + '</pre></div>';
      console.error('render error', s.id, e);
    }
    node.innerHTML = inner;
    stage.appendChild(node);
    fitPptxText(node);

    // calcular plan de revelado (qué steps del DOM aparecen en cada parte)
    State.plan = computeRevealPlan(node, s);

    // quiz: enlazar interacción
    if (s.type === 'quiz') { window.QuizUI && window.QuizUI.mount(node, s, onQuizResolved); }

    // enlazar CTA de anexo si existe
    $$('.anexo-cta', node).forEach(a => { a.setAttribute('target', '_blank'); });

    buildTranscript(s);
    buildSegDots(s);
  }

  // Ajusta cada línea de texto del PDF a su ancho original (nuestra fuente
  // difiere unos % de la del PPT); usa la propiedad `scale` para no pisar
  // el transform de la animación de revelado.
  function fitPptxText(node) {
    $$('.pptx-slide [data-w]', node).forEach(e => {
      const w = parseFloat(e.dataset.w);
      const cw = e.scrollWidth;
      if (!w || !cw) return;
      const r = w / cw;
      if (r > 0.75 && r < 1.35 && Math.abs(r - 1) > 0.02) {
        e.style.transformOrigin = 'left center';
        e.style.scale = r.toFixed(4) + ' 1';
      }
    });
  }

  // Calcula, para cada parte de audio, la lista de índices data-step del DOM
  // que deben revelarse mientras esa parte se reproduce.
  function computeRevealPlan(node, s) {
    const parts = s.parts || [];
    State.stepTiming = null;
    // steps numéricos presentes en el DOM
    const dom = Array.from(new Set(
      $$('[data-step]', node)
        .map(e => e.dataset.step)
        .filter(v => v !== 'always' && v !== '__fb' && v !== '')
        .map(Number)
        .filter(n => !isNaN(n))
    )).sort((a, b) => a - b);

    if (!parts.length) return [];
    // Quiz: usar los steps del modelo tal cual (narración por opción/segmento)
    if (s.type === 'quiz') return parts.map(p => (p.steps || []).slice());

    if (!dom.length) return parts.map(() => []);

    // ¿los steps del modelo ya cubren el DOM? -> mapeo natural
    const modelSteps = new Set();
    parts.forEach(p => (p.steps || []).forEach(k => modelSteps.add(k)));
    const covered = dom.every(k => modelSteps.has(k));
    if (covered && parts.length > 1) {
      return parts.map(p => (p.steps || []).filter(k => dom.includes(k)));
    }

    // Sincronía con la narración: cada bloque de texto aparece cuando el locutor lo dice
    const sync = narrationSync(node, s, dom);
    if (sync) { State.stepTiming = sync.timing; return sync.plan; }

    // Distribuir los reveals del DOM entre las partes, proporcional a su longitud
    const weights = parts.map(p => Math.max(1, (p.tts || p.text || '').length));
    const total = weights.reduce((a, b) => a + b, 0);
    const plan = parts.map(() => []);
    let assigned = 0, cum = 0;
    for (let i = 0; i < parts.length; i++) {
      cum += weights[i];
      let target = Math.round(cum / total * dom.length);
      if (i === parts.length - 1) target = dom.length;
      while (assigned < target) { plan[i].push(dom[assigned]); assigned++; }
    }
    return plan;
  }

  // normaliza texto para comparar contra la narración (minúsculas, sin tildes ni signos)
  function normTxt(t) {
    return (t || '').toLowerCase()
      .replace(/ge\s+erre\s+i/g, 'gri')          // el guion TTS deletrea "GRI"
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  // Busca dónde menciona el locutor cada bloque de texto y devuelve:
  //  plan[i]  = steps que se revelan durante la parte i
  //  timing[k]= fracción (0-1) dentro de esa parte en que debe aparecer el step k
  function narrationSync(node, s, dom) {
    const parts = s.parts || [];
    const nt = parts.map(p => normTxt(p.tts || p.text || ''));
    const full = nt.join(' ');
    if (full.length < 40) return null;
    const bounds = []; let c = 0;
    nt.forEach(t => { bounds.push({ a: c, b: c + t.length }); c += t.length + 1; });
    const N = full.length;

    // 1) anclar cada step por RAÍCES de palabras (tolera inflexiones: "procede"/"proceda")
    //    con una ventana de coincidencia; no exige orden monótono (layouts en columnas)
    const narrWords = full.split(' ');
    const wpos = []; { let o = 0; narrWords.forEach(w => { wpos.push(o); o += w.length + 1; }); }
    const STOP = {para:1,esta:1,este:1,estas:1,estos:1,como:1,cada:1,sobre:1,entre:1,cuando:1,donde:1,tambien:1,ademas:1,pero:1,porque:1,segun:1,hacia:1,desde:1,hasta:1,otros:1,otras:1,todos:1,todas:1,unos:1,unas:1,debe:1,deben:1,puede:1,pueden:1,tiene:1,tienen:1,manera:1,parte:1,traves:1};
    const sig = w => !STOP[w] && (w.length >= 4 || /^\d+$/.test(w));
    const stem = w => (/^\d+$/.test(w) ? w : w.slice(0, 5));
    const nstems = narrWords.map(w => (sig(w) ? stem(w) : null));

    const pos = {}; let cursor = 0; let matched = 0; let considered = 0;
    dom.forEach(k => {
      let words = normTxt($$('[data-step="' + k + '"]', node).map(e => e.textContent || '').join(' ')).split(' ').filter(Boolean);
      if (words.length > 1 && /^\d+$/.test(words[0])) words = words.slice(1);  // "1. Título" -> quitar numeración
      const bs = words.filter(sig).slice(0, 8).map(stem);
      if (!bs.length) return;
      if (bs.every(b => /^\d+$/.test(b))) return;  // chips numéricos: nunca se pronuncian, se interpolan
      considered++;
      const need = bs.length >= 5 ? 3 : Math.min(2, bs.length);  // bloques largos: exigir más raíces (evita falsos anclajes)
      const find = from => {
        for (let i = from; i < narrWords.length; i++) {
          if (!nstems[i] || bs.indexOf(nstems[i]) < 0) continue;
          const seen = {}; seen[nstems[i]] = 1; let cnt = 1;
          for (let j = i + 1; j < Math.min(narrWords.length, i + 25) && cnt < need; j++) {
            if (nstems[j] && bs.indexOf(nstems[j]) >= 0 && !seen[nstems[j]]) { seen[nstems[j]] = 1; cnt++; }
          }
          if (cnt >= need) return i;
        }
        return -1;
      };
      let wi = find(cursor);
      if (wi < 0 && need >= 2) wi = find(0);  // columna anterior: buscar desde el inicio
      if (wi >= 0) { pos[k] = wpos[wi]; matched++; if (wi >= cursor) cursor = wi + 1; }
    });
    if (!considered) return null;
    if (matched < Math.max(considered >= 4 ? 2 : 1, Math.ceil(considered * 0.34))) return null;  // pocos anclajes: no fiable

    // 2) interpolar los steps sin anclaje entre sus vecinos del DOM
    const anch = dom.map(k => (pos[k] !== undefined ? pos[k] : null));
    let prevPos = 0, prevIdx = -1;
    for (let i = 0; i < dom.length; i++) {
      if (anch[i] !== null) { prevPos = anch[i]; prevIdx = i; continue; }
      let j = i + 1; while (j < dom.length && anch[j] === null) j++;
      let nextPos = j < dom.length ? anch[j] : Math.min(N, prevPos + 0.15 * N);
      if (nextPos < prevPos) nextPos = Math.min(N, prevPos + 0.05 * N);  // vecino fuera de orden (columnas)
      anch[i] = prevPos + (nextPos - prevPos) * ((i - prevIdx) / (j - prevIdx));
    }

    // el primer bloque (normalmente el título) no debe esperar al final de la locución
    if (anch.length && anch[0] > 0.15 * N) anch[0] = 0.15 * N;

    // 3) posición global -> (parte, fracción dentro de la parte)
    const plan = parts.map(() => []); const timing = {};
    dom.forEach((k, idx) => {
      const p = clamp(anch[idx], 0, N - 1);
      let pi = bounds.findIndex(b => p >= b.a && p < b.b);
      if (pi < 0) pi = parts.length - 1;
      const len = Math.max(1, bounds[pi].b - bounds[pi].a);
      timing[k] = clamp((p - bounds[pi].a) / len - 0.03, 0, 0.92);  // leve adelanto
      plan[pi].push(k);
    });
    return { plan, timing };
  }

  // revela todos los pasos sin audio (modo pausa/manual)
  function prepareStaticReveal(s) {
    // deja lo estático visible; si se pausó, muestra hasta lo ya revelado
    revealUpTo(999);
  }

  function revealUpTo(n) {
    const node = $('#stage .sl');
    if (!node) return;
    $$('[data-step]', node).forEach(e => {
      const st = e.dataset.step;
      if (st === 'always') { e.classList.add('on'); return; }
      if (+st <= n) e.classList.add('on');
    });
  }
  function revealStep(k) {
    const node = $('#stage .sl');
    if (!node) return;
    $$('[data-step="' + k + '"]', node).forEach(e => e.classList.add('on'));
    // quizzes: activar animaciones especiales por step
    if (window.QuizUI && window.QuizUI.onStep) window.QuizUI.onStep(node, State.slides[State.i], k);
  }

  // ============================================================
  //  AUDIO / SINCRONÍA
  // ============================================================
  function playFromPart(pIdx) {
    const s = State.slides[State.i];
    const parts = s.parts || [];
    if (!parts.length) {
      // sin audio: revela todo, espera avance manual/auto
      revealUpTo(999);
      State.playing = false; updatePlayBtn();
      if (State.autoplay && canAutoAdvance(s)) { setTimeout(() => { if (State.i === indexOf(s)) next(); }, 2500); }
      else if (s.noauto) { showNextHint(); }
      return;
    }
    State.partIdx = clamp(pIdx, 0, parts.length - 1);

    // quiz: si llegamos a la parte de feedback pero aún no respondió, detener en el gate
    if (s.type === 'quiz' && s.quiz) {
      const gateStep = s.quiz.promptStep;
      const part = parts[State.partIdx];
      const isFeedback = part.phase === 'f';
      if (isFeedback && !State.quizAnswered[s.id]) {
        // parar: esperar respuesta del usuario
        State.playing = false; updatePlayBtn();
        markWaitingQuiz(true);
        return;
      }
    }
    loadAndPlayPart();
  }

  function loadAndPlayPart() {
    const s = State.slides[State.i];
    const part = s.parts[State.partIdx];
    clearRevealTimers();
    stopAudioElementOnly();

    // revela de golpe los steps de partes anteriores (para saltos/retrocesos)
    for (let i = 0; i < State.partIdx; i++) {
      ((State.plan && State.plan[i]) || (s.parts[i] && s.parts[i].steps) || []).forEach(revealStep);
    }

    const a = new Audio();
    a.src = encodeURI(part.file);
    a.playbackRate = State.rate;
    a.volume = State.volume;
    State.audio = a;

    a.addEventListener('loadedmetadata', () => {
      scheduleReveals(part, a.duration || estDuration(part));
    });
    a.addEventListener('ended', onPartEnded);
    a.addEventListener('error', () => {
      // si falta el audio, usa duración estimada y revela igual
      const dur = estDuration(part);
      scheduleReveals(part, dur);
      setTimeout(onPartEnded, dur * 1000 / State.rate);
    });

    State.playing = true;
    updatePlayBtn();
    highlightTranscript(State.partIdx);
    a.play().catch(() => { /* autoplay bloqueado: se reintenta con gesto */ });
  }

  function estDuration(part) {
    // ~14 caracteres por segundo de locución en español
    return clamp((part.tts || part.text || '').length / 14, 2.2, 60);
  }

  // programa el revelado de cada step: sincronizado con la narración si hay
  // timing calculado; si no, reparto uniforme dentro de la parte
  function scheduleReveals(part, dur) {
    clearRevealTimers();
    const steps = (State.plan && State.plan[State.partIdx]) || part.steps || [];
    const n = steps.length;
    const tm = State.stepTiming;
    steps.forEach((stp, k) => {
      const frac = (tm && tm[stp] !== undefined) ? tm[stp] : (n <= 1 ? 0 : (k / n) * 0.9);
      const delay = frac * dur * 1000 / State.rate;
      const t = setTimeout(() => {
        revealStep(stp);
        State.revealed = Math.max(State.revealed, stp);
        bumpSegDot(stp);
      }, delay);
      State.revealTimers.push(t);
    });
    revealAlways();
    startProgressLoop(dur);
  }
  function revealAlways() {
    const node = $('#stage .sl'); if (!node) return;
    $$('[data-step="always"]', node).forEach(e => e.classList.add('on'));
  }

  function onPartEnded() {
    const s = State.slides[State.i];
    const parts = s.parts || [];
    // asegura que los steps de esta parte queden revelados
    ((State.plan && State.plan[State.partIdx]) || parts[State.partIdx].steps || []).forEach(revealStep);
    if (State.partIdx < parts.length - 1) {
      // ¿siguiente parte es feedback de quiz sin responder?
      const nextPart = parts[State.partIdx + 1];
      if (s.type === 'quiz' && nextPart.phase === 'f' && !State.quizAnswered[s.id]) {
        State.playing = false; updatePlayBtn();
        markWaitingQuiz(true);
        stopProgressLoop();
        return;
      }
      State.partIdx++;
      loadAndPlayPart();
    } else {
      // fin de la diapositiva
      State.playing = false; updatePlayBtn();
      stopProgressLoop();
      if (s.type === 'quiz') State.quizGatePassed[s.id] = true;
      saveProgress();
      if (State.autoplay && canAutoAdvance(s)) {
        setTimeout(() => { if (State.playing === false && State.slides[State.i] === s) next(); }, 650);
      } else if (s.noauto) {
        showNextHint();
      }
    }
  }

  function indexOf(s) { return State.slides.indexOf(s); }

  // ---------- control de audio ----------
  function stopAudioElementOnly() {
    if (State.audio) { try { State.audio.pause(); } catch (e) {} State.audio.onended = null; State.audio = null; }
  }
  function stopAudio() {
    stopAudioElementOnly();
    clearRevealTimers();
    stopProgressLoop();
    State.playing = false;
    markWaitingQuiz(false);
  }
  function clearRevealTimers() { State.revealTimers.forEach(clearTimeout); State.revealTimers = []; }

  function togglePlay() {
    const s = State.slides[State.i];
    if (s.type === 'closing') { goTo(0, true); return; }
    if (State.playing) {
      if (State.audio) State.audio.pause();
      State.playing = false;
      pauseProgressLoop();
      updatePlayBtn();
    } else {
      if (State.audio && State.audio.currentime !== undefined && !State.audio.ended && State.audio.src) {
        State.audio.playbackRate = State.rate;
        State.audio.play().then(() => { State.playing = true; resumeProgressLoop(); updatePlayBtn(); }).catch(() => {});
      } else {
        playFromPart(State.partIdx);
      }
    }
  }

  function replaySlide() { goTo(State.i, true); }
  function replayPart() { clearRevealTimers(); loadAndPlayPart(); }

  function prevPart() {
    if (State.partIdx > 0) { State.partIdx--; State.playing && stopAudioElementOnly(); loadAndPlayPart(); }
    else { prev(); }
  }
  function nextPart() {
    const s = State.slides[State.i];
    const parts = s.parts || [];
    if (State.partIdx < parts.length - 1) {
      // respeta gate de quiz
      const np = parts[State.partIdx + 1];
      if (s.type === 'quiz' && np.phase === 'f' && !State.quizAnswered[s.id]) { markWaitingQuiz(true); return; }
      ((State.plan && State.plan[State.partIdx]) || parts[State.partIdx].steps || []).forEach(revealStep);
      State.partIdx++;
      loadAndPlayPart();
    } else { next(); }
  }

  // ============================================================
  //  QUIZ callback
  // ============================================================
  function onQuizResolved(s) {
    State.quizAnswered[s.id] = true;
    markWaitingQuiz(false);
    saveProgress();
    // reproducir feedback: busca primera parte 'f'
    const parts = s.parts || [];
    const fIdx = parts.findIndex(p => p.phase === 'f');
    if (fIdx >= 0) { State.partIdx = fIdx; loadAndPlayPart(); }
    else { State.quizGatePassed[s.id] = true; if (State.autoplay) setTimeout(next, 800); }
  }

  function markWaitingQuiz(on) {
    const node = $('#stage .sl'); if (!node) return;
    node.classList.toggle('quiz-wait', !!on);
  }

  // ============================================================
  //  TRANSCRIPCIÓN
  // ============================================================
  function buildTranscript(s) {
    const body = $('#tr-body');
    body.innerHTML = '';
    (s.parts || []).forEach((p, i) => {
      const seg = el('div', 'tr-seg');
      seg.dataset.part = i;
      seg.textContent = p.text || p.tts;
      body.appendChild(seg);
    });
    if (!(s.parts || []).length) body.innerHTML = '<div class="tr-seg" style="color:#8a94a6">Esta diapositiva no tiene narración.</div>';
  }
  function highlightTranscript(pIdx) {
    $$('#tr-body .tr-seg').forEach(sg => {
      const on = +sg.dataset.part === pIdx;
      sg.classList.toggle('live', on);
      if (on) sg.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  // ============================================================
  //  PUNTOS DE SEGMENTO (dots) y barra
  // ============================================================
  function buildSegDots(s) {
    const wrap = $('#segdots');
    wrap.innerHTML = '';
    const parts = s.parts || [];
    if (parts.length <= 1) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'flex';
    parts.forEach((p, i) => {
      const d = el('span', 'dot');
      d.title = 'Segmento ' + (i + 1);
      d.onclick = () => {
        const s2 = State.slides[State.i];
        if (s2.type === 'quiz' && p.phase === 'f' && !State.quizAnswered[s2.id]) { markWaitingQuiz(true); return; }
        State.partIdx = i; loadAndPlayPart();
      };
      wrap.appendChild(d);
    });
  }
  function bumpSegDot(/*step*/) {
    const parts = State.slides[State.i].parts || [];
    $$('#segdots .dot').forEach((d, i) => {
      d.classList.toggle('now', i === State.partIdx);
      d.classList.toggle('played', i < State.partIdx);
    });
  }

  // ---------- barra de progreso interna de la parte ----------
  let progRAF = null, progStart = 0, progDur = 0, progPausedAt = 0, progAccum = 0;
  function startProgressLoop(dur) {
    stopProgressLoop();
    progDur = dur / State.rate;
    progStart = performance.now();
    progAccum = 0;
    tickProg();
  }
  function tickProg() {
    const s = State.slides[State.i];
    const parts = s.parts || [];
    // progreso global: partes completas + fracción de la actual
    let frac = 0;
    if (State.audio && State.audio.duration) {
      frac = clamp(State.audio.currentTime / State.audio.duration, 0, 1);
    } else if (progDur) {
      frac = clamp((performance.now() - progStart + progAccum) / (progDur * 1000), 0, 1);
    }
    const overall = parts.length ? (State.partIdx + frac) / parts.length : 0;
    $('#prog .fill').style.width = (overall * 100) + '%';
    // tiempos
    $('#t-cur').textContent = fmt((State.audio && State.audio.currentTime) || 0);
    $('#t-dur').textContent = fmt((State.audio && State.audio.duration) || progDur);
    progRAF = requestAnimationFrame(tickProg);
  }
  function stopProgressLoop() { if (progRAF) cancelAnimationFrame(progRAF); progRAF = null; }
  function pauseProgressLoop() { progAccum += performance.now() - progStart; stopProgressLoop(); }
  function resumeProgressLoop() { progStart = performance.now(); tickProg(); }

  // ============================================================
  //  CHROME (barras superior/inferior)
  // ============================================================
  function updateChrome() {
    const s = State.slides[State.i];
    $('#mod-chip').textContent = State.model.modules[s.module];
    $('#slidecount').textContent = 'Diapositiva ' + (State.i + 1) + ' / ' + State.slides.length;
    updatePlayBtn();
    // habilitar/deshabilitar prev-next
    $('#btn-prev').disabled = State.i === 0;
  }
  function updatePlayBtn() {
    const s = State.slides[State.i];
    const b = $('#btn-play');
    if (s && s.type === 'closing') { b.innerHTML = ICONS.replay; b.title = 'Reiniciar'; return; }
    b.innerHTML = State.playing ? ICONS.pause : ICONS.play;
    b.title = State.playing ? 'Pausar (espacio)' : 'Reproducir (espacio)';
  }

  // ============================================================
  //  FIN DEL CURSO
  // ============================================================
  function showEndState() {
    const s = State.slides[State.slides.length - 1];
    State.i = State.slides.length - 1;
    State.visited[s.id] = true;
    renderSlide(s);
    updateChrome(); refreshSidebar(); saveProgress();
    State.playing = false; updatePlayBtn();
  }

  // ============================================================
  //  CONTROLES / EVENTOS
  // ============================================================
  function bindControls() {
    $('#btn-play').onclick = togglePlay;
    $('#btn-prev').onclick = prev;
    $('#btn-next').onclick = next;
    $('#btn-rewind').onclick = prevPart;
    $('#btn-forward').onclick = nextPart;
    $('#btn-replay').onclick = replaySlide;

    $('#btn-index').onclick = () => { $('#sidebar').classList.toggle('hidden'); toggleActive('#btn-index', !$('#sidebar').classList.contains('hidden')); setTimeout(fitStage, 260); };
    $('#btn-transcript').onclick = () => { $('#transcript').classList.toggle('hidden'); toggleActive('#btn-transcript', !$('#transcript').classList.contains('hidden')); setTimeout(fitStage, 260); };
    $('#btn-anexo').onclick = () => window.open('anexos/Caso-de-estudio.pdf', '_blank');
    $('#btn-fs').onclick = toggleFullscreen;

    $('#rate-sel').onchange = (e) => { State.rate = parseFloat(e.target.value); if (State.audio) State.audio.playbackRate = State.rate; saveProgress(); };
    $('#vol').oninput = (e) => { State.volume = parseFloat(e.target.value); if (State.audio) State.audio.volume = State.volume; saveProgress(); };
    $('#autoplay-toggle').onclick = () => { State.autoplay = !State.autoplay; setToggle($('#autoplay-toggle'), State.autoplay); saveProgress(); };
    $('#fs-inc').onclick = () => { State.fontScale = clamp((State.fontScale || 0) + 1, 0, 2); applyFontScale(); saveProgress(); };
    $('#fs-dec').onclick = () => { State.fontScale = clamp((State.fontScale || 0) - 1, 0, 2); applyFontScale(); saveProgress(); };

    // clic en barra de progreso -> saltar dentro de la parte
    $('#prog').onclick = (e) => {
      if (!State.audio || !State.audio.duration) return;
      const s = State.slides[State.i];
      const parts = s.parts || [];
      const r = $('#prog').getBoundingClientRect();
      const frac = clamp((e.clientX - r.left) / r.width, 0, 1);
      const targetPart = clamp(Math.floor(frac * parts.length), 0, parts.length - 1);
      if (targetPart !== State.partIdx) {
        if (s.type === 'quiz' && parts[targetPart].phase === 'f' && !State.quizAnswered[s.id]) { markWaitingQuiz(true); return; }
        State.partIdx = targetPart; loadAndPlayPart();
      } else {
        const within = (frac * parts.length) - targetPart;
        State.audio.currentTime = within * State.audio.duration;
      }
    };

    // sincronizar estado inicial de paneles
    toggleActive('#btn-index', true);
  }

  function toggleActive(sel, on) { $(sel).classList.toggle('active', !!on); }
  function setToggle(node, on) { node.classList.toggle('on', !!on); }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  }

  function bindKeys() {
    document.addEventListener('keydown', (e) => {
      if (!State.model) return;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); if ($('#overlay').classList.contains('hidden')) togglePlay(); else $('#ov-start').click(); break;
        case 'ArrowRight': e.preventDefault(); next(); break;
        case 'ArrowLeft': e.preventDefault(); prev(); break;
        case 'ArrowDown': e.preventDefault(); nextPart(); break;
        case 'ArrowUp': e.preventDefault(); prevPart(); break;
        case 'r': replaySlide(); break;
        case 'i': $('#btn-index').click(); break;
        case 't': $('#btn-transcript').click(); break;
        case 'f': toggleFullscreen(); break;
        case 'm': State.volume = State.volume > 0 ? 0 : 1; $('#vol').value = State.volume; if (State.audio) State.audio.volume = State.volume; break;
      }
    });
  }

  // ============================================================
  //  ICONOS
  // ============================================================
  const ICONS = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M7 6h2v12H7zM10 12l9 6V6z" transform="scale(-1,1) translate(-24,0)"/></svg>',
    replay: '<svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg>',
  };
  window.__ICONS = ICONS;

  // hook de depuración/QA
  window.__course = {
    goTo, next, prev, get i() { return State.i; },
    get slides() { return State.slides; },
    revealAll: () => revealUpTo(999),
    State,
  };

  document.addEventListener('DOMContentLoaded', boot);
})();
