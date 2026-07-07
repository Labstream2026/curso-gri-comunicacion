/* ============================================================
   Tutorías GRI — Motor de quizzes interactivos
   ============================================================ */
(function () {
  'use strict';
  const esc = window.__esc || (s => String(s == null ? '' : s));
  const IMG = 'img/';
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  // fotos de quiz por índice de aparición (variedad)
  const QUIZ_PHOTOS = ['image34.jpeg', 'image34.jpeg'];

  function photoFor(s) {
    const q = window.SlideArch && window.SlideArch.firstImg(s, ['jpeg', 'jpg']);
    return q || 'image34.jpeg';
  }

  // ---------- estado por diapositiva ----------
  const store = {}; // id -> {selected:Set, matched:{}, resolved:bool}

  function render(s, d) {
    const quiz = s.quiz || {};
    const kind = quiz.kind || 'single';
    const photo = (d && d.photo) || photoFor(s);
    const gri = window.SlideArch.gri;
    let body = '';
    if (kind === 'single') body = renderSingle(s, quiz);
    else if (kind === 'multi') body = renderChips(s, quiz, 'multi');
    else if (kind === 'reflect') body = renderChips(s, quiz, 'reflect');
    else if (kind === 'match') body = renderMatch(s, quiz);

    return gri(false) +
      '<div class="sl-quiz">' +
      '<img class="qphoto" src="' + IMG + photo + '" alt="">' +
      '<div class="qstripes"><i class="s1"></i><i class="s2"></i><i class="s3"></i></div>' +
      '<div class="qlabel">' + (s.type === 'quiz' ? 'Comprobación<br>de conocimiento' : '') + '</div>' +
      '<div class="qbody">' + body + '</div>' +
      '</div>';
  }

  function renderSingle(s, quiz) {
    const opts = quiz.options.map((o, i) =>
      '<button class="q-opt" data-step="' + (i + 1) + '" data-oi="' + i + '">' +
        '<span class="let">' + LETTERS[i] + '</span><span class="txt">' + esc(o) + '</span></button>'
    ).join('');
    return '<div class="qq" data-step="0">' + esc(quiz.question) + '</div>' +
      '<div class="qhint" data-step="' + quiz.promptStep + '">Selecciona la opción que consideres correcta.</div>' +
      '<div class="q-opts">' + opts + '</div>' +
      '<div class="q-fb" data-step="__fb" style="display:none"></div>';
  }

  function renderChips(s, quiz, mode) {
    const chips = quiz.options.map((o, i) =>
      '<button class="q-chip" data-oi="' + i + '">' + esc(o) + '</button>'
    ).join('');
    return '<div class="qq" data-step="0">' + esc(quiz.question) + '</div>' +
      '<div class="qhint" data-step="0">' + (mode === 'reflect'
        ? 'Selecciona los que consideres relevantes y confirma.'
        : 'Selecciona todas las opciones correctas y confirma.') + '</div>' +
      '<div class="q-chips" data-step="0">' + chips + '</div>' +
      '<button class="q-confirm" data-step="' + quiz.promptStep + '" disabled>Confirmar respuesta</button>' +
      '<div class="q-fb" data-step="__fb" style="display:none"></div>';
  }

  function renderMatch(s, quiz) {
    const left = quiz.left.map((t, i) =>
      '<button class="q-mitem q-left" data-li="' + i + '">' + esc(t) + '</button>'
    ).join('');
    const right = quiz.right.map((t, i) =>
      '<button class="q-mitem q-right" data-ri="' + i + '">' + esc(t) + '</button>'
    ).join('');
    return '<div class="qq" data-step="0">' + esc(quiz.question) + '</div>' +
      '<div class="qhint" data-step="0">Toca un tema y luego el contenido que le corresponde.</div>' +
      '<div class="q-match" data-step="0">' +
        '<div class="mcol"><div class="mhd">Temas materiales</div>' + left + '</div>' +
        '<div class="mcol"><div class="mhd">Contenidos GRI</div>' + right + '</div>' +
      '</div>' +
      '<button class="q-confirm" data-step="' + quiz.promptStep + '" disabled>Confirmar relaciones</button>' +
      '<div class="q-fb" data-step="__fb" style="display:none"></div>';
  }

  // ---------- montaje / interacción ----------
  function mount(node, s, onResolved) {
    const quiz = s.quiz || {};
    const kind = quiz.kind || 'single';
    store[s.id] = store[s.id] || { selected: new Set(), matched: {}, resolved: false, pendLeft: null };
    const st = store[s.id];

    if (kind === 'single') {
      node.querySelectorAll('.q-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          if (st.resolved || !btn.classList.contains('enabled')) return;
          resolveSingle(node, s, +btn.dataset.oi, onResolved);
        });
      });
    } else if (kind === 'multi' || kind === 'reflect') {
      node.querySelectorAll('.q-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          if (st.resolved || !btn.classList.contains('enabled')) return;
          const oi = +btn.dataset.oi;
          if (st.selected.has(oi)) { st.selected.delete(oi); btn.classList.remove('sel'); }
          else { st.selected.add(oi); btn.classList.add('sel'); }
          const cf = node.querySelector('.q-confirm');
          cf.disabled = st.selected.size === 0;
        });
      });
      node.querySelector('.q-confirm').addEventListener('click', () => {
        if (st.resolved) return;
        resolveChips(node, s, kind, onResolved);
      });
    } else if (kind === 'match') {
      node.querySelectorAll('.q-left').forEach(btn => {
        btn.addEventListener('click', () => {
          if (st.resolved || !btn.classList.contains('enabled')) return;
          node.querySelectorAll('.q-left').forEach(b => b.classList.remove('sel'));
          btn.classList.add('sel'); st.pendLeft = +btn.dataset.li;
        });
      });
      node.querySelectorAll('.q-right').forEach(btn => {
        btn.addEventListener('click', () => {
          if (st.resolved || !btn.classList.contains('enabled')) return;
          if (st.pendLeft == null) return;
          const li = st.pendLeft, ri = +btn.dataset.ri;
          // limpiar emparejamientos previos de ese li o ri
          Object.keys(st.matched).forEach(k => { if (+k === li || st.matched[k] === ri) delete st.matched[k]; });
          st.matched[li] = ri;
          st.pendLeft = null;
          paintMatch(node, s);
          const cf = node.querySelector('.q-confirm');
          cf.disabled = Object.keys(st.matched).length < s.quiz.left.length;
        });
      });
      node.querySelector('.q-confirm').addEventListener('click', () => {
        if (st.resolved) return; resolveMatch(node, s, onResolved);
      });
    }

    // si ya se resolvió antes (revisita), re-pintar estado final
    if (window.__revisitQuiz && window.__revisitQuiz[s.id]) { /* opcional */ }
  }

  // habilitar interacción cuando llega el prompt step
  function onStep(node, s, k) {
    const quiz = s.quiz || {};
    if (k === quiz.promptStep) enableInputs(node, s);
  }
  function enableInputs(node, s) {
    const st = store[s.id]; if (st && st.resolved) return;
    node.classList.add('quiz-wait');
    node.querySelectorAll('.q-opt,.q-chip,.q-mitem').forEach(b => b.classList.add('enabled'));
    const cf = node.querySelector('.q-confirm');
    if (cf) { /* queda disabled hasta selección */ }
  }

  // ---------- resolución ----------
  function resolveSingle(node, s, oi, onResolved) {
    const st = store[s.id]; st.resolved = true;
    const correct = s.quiz.correct[0];
    node.classList.remove('quiz-wait');
    node.querySelectorAll('.q-opt').forEach(btn => {
      const i = +btn.dataset.oi;
      btn.classList.remove('enabled');
      if (i === correct) btn.classList.add('correct');
      else if (i === oi) btn.classList.add('wrong');
      else btn.classList.add('dim');
    });
    const fb = node.querySelector('.q-fb');
    const ok = oi === correct;
    fb.innerHTML = '<b>' + (ok ? '¡Correcto! ' : 'Respuesta correcta: ' + LETTERS[correct] + '. ') + '</b>' + feedbackText(s);
    fb.style.display = '';
    fb.classList.add('on');
    if (onResolved) onResolved(s);
  }

  function resolveChips(node, s, kind, onResolved) {
    const st = store[s.id]; st.resolved = true;
    node.classList.remove('quiz-wait');
    const sel = st.selected;
    let correct;
    if (kind === 'multi') correct = new Set(s.quiz.correct);
    else correct = new Set(s.quiz.relevant);
    const notRel = new Set(s.quiz.notRelevant || []);
    node.querySelectorAll('.q-chip').forEach(btn => {
      const i = +btn.dataset.oi; btn.classList.remove('enabled', 'sel');
      const chosen = sel.has(i);
      if (correct.has(i)) btn.classList.add(chosen ? 'correct' : 'missed');
      else if (chosen) btn.classList.add('wrong');
      else if (notRel.has(i)) btn.classList.add('neutral');
      else btn.classList.add('neutral');
    });
    node.querySelector('.q-confirm').style.display = 'none';
    const fb = node.querySelector('.q-fb');
    fb.innerHTML = '<b>Análisis: </b>' + feedbackText(s);
    fb.style.display = ''; fb.classList.add('on');
    if (onResolved) onResolved(s);
  }

  function paintMatch(node, s) {
    const st = store[s.id];
    node.querySelectorAll('.q-left').forEach(b => {
      const li = +b.dataset.li;
      b.classList.remove('paired', 'pair-c1', 'pair-c2', 'pair-c3', 'pair-c4');
      const tag = b.querySelector('.tagm'); if (tag) tag.remove();
      if (st.matched[li] != null) {
        b.classList.add('paired', 'pair-c' + ((li % 4) + 1));
        b.insertAdjacentHTML('beforeend', '<span class="tagm">↔ ' + (st.matched[li] + 1) + '</span>');
      }
    });
    node.querySelectorAll('.q-right').forEach(b => {
      const ri = +b.dataset.ri;
      b.classList.remove('paired', 'pair-c1', 'pair-c2', 'pair-c3', 'pair-c4');
      const tag = b.querySelector('.tagm'); if (tag) tag.remove();
      const li = Object.keys(st.matched).find(k => st.matched[k] === ri);
      if (li != null) {
        b.classList.add('paired', 'pair-c' + ((+li % 4) + 1));
        b.insertAdjacentHTML('beforeend', '<span class="tagm">' + (+li + 1) + ' ↔</span>');
      }
    });
  }

  function resolveMatch(node, s, onResolved) {
    const st = store[s.id]; st.resolved = true;
    node.classList.remove('quiz-wait');
    const pairs = {}; s.quiz.pairs.forEach(p => pairs[p[0]] = p[1]);
    node.querySelectorAll('.q-left').forEach(b => {
      const li = +b.dataset.li; b.classList.remove('enabled');
      const good = st.matched[li] === pairs[li];
      b.classList.add(good ? 'okp' : 'badp');
    });
    node.querySelectorAll('.q-right').forEach(b => { b.classList.remove('enabled'); });
    node.querySelector('.q-confirm').style.display = 'none';
    const fb = node.querySelector('.q-fb');
    fb.innerHTML = '<b>Relaciones correctas: </b>' + s.quiz.pairs.map(p =>
      esc(s.quiz.left[p[0]].split(' ')[0]) + ' → ' + esc(s.quiz.right[p[1]].split(':')[0])
    ).join(' · ') + '. ' + feedbackText(s);
    fb.style.display = ''; fb.classList.add('on');
    if (onResolved) onResolved(s);
  }

  // texto de feedback tomado de la narración de retroalimentación
  function feedbackText(s) {
    const fParts = (s.parts || []).filter(p => p.phase === 'f');
    if (fParts.length) return esc(fParts.map(p => p.text).join(' ')).slice(0, 600);
    return s.quiz && s.quiz.explain ? esc(s.quiz.explain) : '';
  }

  window.QuizUI = { render, mount, onStep };
})();
