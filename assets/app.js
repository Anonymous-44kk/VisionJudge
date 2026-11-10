(() => {
  const D = window.VJ_DATA, RS = window.VJ_RESULTS, REC = window.VJ_REC || {};
  D.tasks.forEach(t => {
    const rec = REC[t.key] || [];
    t.candidates.forEach(c => {
      c.encodings.forEach(e => { const k = rec.findIndex(r => r[0] === e.id); e.rank = k < 0 ? null : k + 1; e.med = k < 0 ? null : rec[k][2]; });
      c.encodings.sort((x, y) => (x.rank || 99) - (y.rank || 99));
    });
  });
  const CIRC = n => '①②③④⑤⑥⑦⑧⑨⑩'[n - 1] || n;
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const preload = src => new Promise(r => { if (!src) return r(); const i = new Image(); i.onload = i.onerror = () => r(); i.src = src; });

  /* ---------- theme + nav ---------- */
  const root = document.documentElement;
  try { const t = localStorage.getItem('vj-theme'); if (t) root.dataset.theme = t; } catch (e) {}
  $('#themeToggle').onclick = () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('vj-theme', root.dataset.theme); } catch (e) {}
  };
  addEventListener('scroll', () => $('#topnav').classList.toggle('scrolled', scrollY > 8), { passive: true });

  /* ---------- hero mosaic: each tile wipes through encodings of one prediction ---------- */
  const mosaic = $('#mosaic');
  D.tasks.forEach((t, ti) => {
    const encs = t.candidates[0].encodings.filter(e => e.src);
    const tile = document.createElement('div'); tile.className = 'tile';
    tile.innerHTML = `<img class="t-base" alt=""><img class="t-top" alt=""><div class="t-seam"></div>
      <div class="t-cap"><span class="t-task">${esc(t.title)}</span><span class="t-enc"></span></div>`;
    mosaic.appendChild(tile);
    const base = $('.t-base', tile), top = $('.t-top', tile), seam = $('.t-seam', tile), lab = $('.t-enc', tile);
    let i = 0; base.src = encs[0].src; lab.textContent = encs[0].label;
    tile.onclick = () => { selectTask(ti); document.getElementById('explorer').scrollIntoView({ behavior: 'smooth' }); };
    if (reduce || encs.length < 2) return;
    const step = async () => {
      const j = (i + 1) % encs.length; await preload(encs[j].src);
      top.src = encs[j].src; lab.style.opacity = 0;
      const t0 = performance.now(), dur = 1100;
      const f = now => {
        const p = ease(Math.min(1, (now - t0) / dur));
        top.style.clipPath = `inset(0 ${100 - p * 100}% 0 0)`; seam.style.left = `${p * 100}%`; seam.style.opacity = p < 1 ? 1 : 0;
        if (p < 1) requestAnimationFrame(f);
        else { base.src = encs[j].src; top.style.clipPath = 'inset(0 100% 0 0)'; lab.textContent = encs[j].label; lab.style.opacity = 1; i = j; setTimeout(step, 1900); }
      };
      requestAnimationFrame(f);
    };
    setTimeout(step, 900 + ti * 420);
  });

  /* ---------- explorer ---------- */
  const st = { task: 0, cand: 0, enc: 0, mode: 'auto', cmpA: 0, cmpB: 1, timer: null, anim: null, split: .5, typing: null };
  const stage = $('#stage'), L0 = $('#layerBase'), L1 = $('#layerTop'), seam = $('#seam'), code = $('#codeLayer'), codeText = $('#codeText');
  const tabs = $('#taskTabs');
  D.tasks.forEach((t, i) => {
    const b = document.createElement('button');
    b.innerHTML = `${esc(t.title)}<span class="cnt">${t.candidates[0].encodings.length}</span>`; b.onclick = () => selectTask(i); tabs.appendChild(b);
  });
  const T = () => D.tasks[st.task], C = () => T().candidates[st.cand], E = i => C().encodings[i];
  const imgOf = e => e.src || T().orig;
  const label = (e, side) => `<span class="bid">${e.rank ? CIRC(e.rank) : '#' + e.id}</span>${esc(e.label)}${e.base ? ' · base' : ''}${e.med ? ` <span class="bid">≈${e.med.toFixed(3)}</span>` : ''}`;

  function typeCode(text, side) {
    clearInterval(st.typing); code.className = 'code-layer show' + (side ? ' side' : '');
    if (reduce) { codeText.textContent = text; return; }
    let n = 0; const total = text.length, chunk = Math.max(6, Math.ceil(total / 55));
    st.typing = setInterval(() => {
      n = Math.min(total, n + chunk); codeText.innerHTML = esc(text.slice(0, n)) + (n < total ? '<span class="cursor"></span>' : '');
      if (n >= total) clearInterval(st.typing);
    }, 16);
  }
  function hideCode() { clearInterval(st.typing); code.className = 'code-layer'; }
  function showStatic(i) {                      // put encoding i on the base layer
    const e = E(i); L0.src = imgOf(e); L1.style.clipPath = 'inset(0 100% 0 0)';
    if (e.kind === 'txt') typeCode(e.text, false); else if (e.kind === 'combo') typeCode(e.text, true); else hideCode();
  }
  function renderSide() {
    const t = T(), c = C();
    $$('button', tabs).forEach((b, i) => b.classList.toggle('on', i === st.task));
    stage.style.aspectRatio = `${t.w} / ${t.h}`;
    $('#candSeg').innerHTML = t.candidates.map((cd, i) =>
      `<button class="${i === st.cand ? 'on' : ''}" data-i="${i}">Rank ${cd.rank}${i === 0 ? ' · best' : i === t.candidates.length - 1 ? ' · worst' : ''}${cd.score != null ? `<small>${cd.score}</small>` : ''}</button>`).join('');
    $$('#candSeg button').forEach(b => b.onclick = () => { st.cand = +b.dataset.i; restart(); });
    const meta = [`<span class="chip">Candidate <b>${st.cand + 1}/${t.candidates.length}</b> of one ranked group</span>`];
    if (t.coi && t.coi.length) meta.push(`<span class="chip">Classes of interest: <b>${esc(t.coi.join(', '))}</b></span>`);
    if (t.expr) meta.push(`<span class="chip">Referring expression: <b>“${esc(t.expr)}”</b></span>`);
    meta.push(`<span class="chip">${c.encodings.filter(e => e.kind === 'img').length} image · ${c.encodings.filter(e => e.kind === 'txt').length} text · ${c.encodings.filter(e => e.kind === 'combo').length} mixed</span>`);
    $('#stageMeta').innerHTML = meta.join('');
    $('#encList').innerHTML = c.encodings.map((e, i) => `<li data-i="${i}"><span class="rnk ${e.rank ? '' : 'none'}">${e.rank ? CIRC(e.rank) : '·'}</span><span>${esc(e.label)}</span>${e.base ? '<span class="basetag">BASE</span>' : ''}<span class="kind ${e.kind}">${e.kind === 'combo' ? 'img+txt' : e.kind}</span></li>`).join('');
    $$('#encList li').forEach(li => li.onclick = ev => {
      const i = +li.dataset.i;
      if (st.mode === 'compare') { if (ev.shiftKey || ev.altKey) st.cmpB = i; else { st.cmpA = i; if (st.cmpB === i) st.cmpB = (i + 1) % C().encodings.length; } drawCompare(); }
      else { goTo(i); }
    });
    $('#encHint').textContent = st.mode === 'compare' ? 'click = left · shift-click = right' : 'click to jump';
  }
  function markList() {
    $$('#encList li').forEach((li, i) => {
      li.classList.toggle('on', st.mode === 'compare' ? i === st.cmpA : i === st.enc);
      li.classList.toggle('cmp', st.mode === 'compare' && i === st.cmpB);
    });
    const e = st.mode === 'compare' ? E(st.cmpA) : E(st.enc);
    $('#fmtText').textContent = e.fmt || '';
  }
  function setLabels(a, b) {
    $('#labelL').innerHTML = a ? label(a) : ''; $('#labelL').style.opacity = a ? 1 : 0;
    $('#labelR').innerHTML = b ? label(b) : ''; $('#labelR').style.opacity = b ? 1 : 0;
  }
  function stopAuto() { clearTimeout(st.timer); cancelAnimationFrame(st.anim); $('#progressBar').style.width = '0'; }
  async function wipeTo(j, dur = 1000) {
    const e = E(j); await preload(imgOf(e));
    cancelAnimationFrame(st.anim); hideCode(); L1.src = imgOf(e); const t0 = performance.now();
    return new Promise(res => {
      const f = now => {
        const p = reduce ? 1 : ease(Math.min(1, (now - t0) / dur));
        L1.style.clipPath = `inset(0 ${100 - p * 100}% 0 0)`; seam.style.left = `${p * 100}%`; seam.style.opacity = p < 1 ? 1 : 0;
        if (p < 1) st.anim = requestAnimationFrame(f); else { st.enc = j; showStatic(j); res(); }
      };
      st.anim = requestAnimationFrame(f);
    });
  }
  function hold(ms) {
    const bar = $('#progressBar'), t0 = performance.now();
    return new Promise(res => {
      const f = now => { const p = Math.min(1, (now - t0) / ms); bar.style.width = `${p * 100}%`; if (p < 1 && st.mode === 'auto') st.anim = requestAnimationFrame(f); else res(); };
      st.anim = requestAnimationFrame(f);
    });
  }
  let runId = 0;
  async function autoLoop() {
    const my = ++runId;
    while (st.mode === 'auto' && my === runId) {
      const e = E(st.enc); await hold(e.kind === 'img' ? 2200 : 3600); if (st.mode !== 'auto' || my !== runId) return;
      const j = (st.enc + 1) % C().encodings.length; setLabels(E(j)); markListTo(j); await wipeTo(j);
    }
  }
  function markListTo(j) { const k = st.enc; st.enc = j; markList(); st.enc = k; }
  async function goTo(i) { runId++; stopAuto(); setLabels(E(i)); markListTo(i); await wipeTo(i, 650); markList(); if (st.mode === 'auto') autoLoop(); }
  function drawCompare() {
    const a = E(st.cmpA), b = E(st.cmpB);
    hideCode(); L0.src = imgOf(b); L1.src = imgOf(a);
    const txt = [a, b].find(e => e.kind !== 'img');
    if (txt) typeCode(txt.text, true);
    L1.style.clipPath = `inset(0 ${100 - st.split * 100}% 0 0)`; seam.style.left = `${st.split * 100}%`;
    setLabels(a, b); markList();
  }
  function restart() {
    runId++; stopAuto(); renderSide();
    if (st.mode === 'auto') { st.enc = 0; showStatic(0); setLabels(E(0)); markList(); autoLoop(); }
    else { st.cmpA = 0; st.cmpB = Math.min(1, C().encodings.length - 1); drawCompare(); }
  }
  function selectTask(i) { st.task = i; st.cand = 0; restart(); }
  $$('#modeSeg button').forEach(b => b.onclick = () => {
    st.mode = b.dataset.mode; $$('#modeSeg button').forEach(x => x.classList.toggle('on', x === b));
    stage.classList.toggle('compare', st.mode === 'compare'); seam.style.opacity = ''; restart();
  });
  // drag seam in compare mode
  const setSplit = x => { const r = stage.getBoundingClientRect(); st.split = Math.min(.98, Math.max(.02, (x - r.left) / r.width)); L1.style.clipPath = `inset(0 ${100 - st.split * 100}% 0 0)`; seam.style.left = `${st.split * 100}%`; };
  let dragging = false;
  stage.addEventListener('pointerdown', e => { if (st.mode !== 'compare') return; dragging = true; stage.setPointerCapture(e.pointerId); setSplit(e.clientX); });
  stage.addEventListener('pointermove', e => { if (dragging) setSplit(e.clientX); });
  stage.addEventListener('pointerup', () => dragging = false);
  // hold to see the input image
  const peek = $('#peekBtn'); let peekSrc = null;
  const peekOn = e => { e.preventDefault(); peekSrc = [L0.src, L1.src]; L0.src = T().orig; L1.style.visibility = 'hidden'; code.style.visibility = 'hidden'; };
  const peekOff = () => { if (!peekSrc) return; L0.src = peekSrc[0]; L1.style.visibility = ''; code.style.visibility = ''; peekSrc = null; };
  peek.addEventListener('pointerdown', peekOn); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => peek.addEventListener(ev, peekOff));
  // pause auto when the explorer is off-screen
  new IntersectionObserver(es => es.forEach(en => {
    if (st.mode !== 'auto') return;
    if (en.isIntersecting) { if (!st.visible) { st.visible = true; restartAuto(); } } else { st.visible = false; runId++; stopAuto(); }
  }), { threshold: .2 }).observe(stage);
  function restartAuto() { runId++; stopAuto(); showStatic(st.enc); setLabels(E(st.enc)); markList(); autoLoop(); }
  renderSide(); showStatic(0); setLabels(E(0)); markList();

  /* ---------- recommended order ---------- */
  const recGrid = $('#recGrid');
  D.tasks.forEach((t, ti) => {
    const rec = REC[t.key]; if (!rec) return;
    const encs = t.candidates[0].encodings, lo = .45, hi = .65;
    const card = document.createElement('div'); card.className = 'rec-card';
    card.innerHTML = `<div class="rec-h"><h4>${esc(t.title)}</h4><span class="small muted">${rec.length} encodings ranked</span></div>
      <ol class="rec-list">${rec.map((r, k) => {
        const ei = encs.findIndex(e => e.id === r[0]), e = encs[ei];
        const th = e ? (e.src ? `<img loading="lazy" src="${e.src}" alt="">` : `<span class="txt-th">{ }</span>`) : `<span class="txt-th na">—</span>`;
        const w = Math.max(2, (r[2] - lo) / (hi - lo) * 100), c50 = (.5 - lo) / (hi - lo) * 100;
        return `<li class="${k === 0 ? 'top' : ''} ${e ? 'link' : ''}" data-ei="${ei}"><span class="rnk">${CIRC(k + 1)}</span><span class="th">${th}</span>
          <span class="rl">${esc(r[1])}${e && e.base ? ' <span class="basetag">BASE</span>' : ''}${e ? '' : ' <span class="small muted">(not previewed)</span>'}</span>
          <span class="bar"><span class="fill" style="width:${w}%"></span><span class="chance" style="left:${c50}%"></span></span><span class="med">${r[2].toFixed(3)}</span></li>`;
      }).join('')}</ol>`;
    recGrid.appendChild(card);
    $$('li.link', card).forEach(li => li.onclick = () => {
      if (st.mode !== 'auto') $('#modeSeg button[data-mode="auto"]').click();
      selectTask(ti); goTo(+li.dataset.ei); document.getElementById('explorer').scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- gallery ---------- */
  const gal = $('#gallery');
  D.gallery.forEach((g, gi) => {
    const n = g.cands.length, order = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) { const j = (gi * 7 + i * 3 + 1) % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }
    if (order.every((v, i) => v === i)) order.reverse();
    const card = document.createElement('div'); card.className = 'gcard';
    card.innerHTML = `<div class="gcard-h"><h4>${esc(g.title)}</h4><button class="reveal">Reveal ranking</button></div>
      ${g.prompt ? `<p class="gprompt">“${esc(g.prompt.length > 160 ? g.prompt.slice(0, 160) + '…' : g.prompt)}”</p>` : ''}
      <div class="grow" style="grid-template-columns: repeat(${n + 1}, 1fr)">
        <div class="gimg"><img loading="lazy" src="${g.input}" alt="input"><span class="gl">Input</span></div>
        ${order.map((r, k) => `<div class="gimg" data-r="${r}" data-k="${k}"><img loading="lazy" src="${g.cands[r]}" alt="candidate"><span class="gl">${String.fromCharCode(65 + k)}</span><span class="gr r${r + 1}">#${r + 1}</span></div>`).join('')}
      </div>`;
    gal.appendChild(card);
    $('.reveal', card).onclick = ev => {
      const on = card.classList.toggle('revealed'); ev.target.textContent = on ? 'Shuffle back' : 'Reveal ranking';
      const cells = $$('.gimg[data-r]', card), w = cells[0].getBoundingClientRect().width + 8;
      cells.forEach(c => { const d = on ? (+c.dataset.r - +c.dataset.k) : 0; c.style.transform = `translateX(${d * w}px)`; });
    };
  });

  /* ---------- coverage ---------- */
  $('#covTable tbody').innerHTML = RS.coverage.map(r => `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td class="r">${r[2].toLocaleString()}</td><td class="r">${r[3].toLocaleString()}</td><td class="r">${r[4].toLocaleString()}</td><td>${esc(r[5])}</td><td>${esc(r[6])}</td></tr>`).join('');

  /* ---------- counters, copy, reveal-on-scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return; io.unobserve(en.target);
    if (en.target.id === 'stats') $$('.num', en.target).forEach(n => {
      const to = +n.dataset.to, t0 = performance.now(), dur = reduce ? 0 : 1400;
      const f = now => { const p = dur ? Math.min(1, (now - t0) / dur) : 1; n.textContent = Math.round(to * ease(p)).toLocaleString(); if (p < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    });
    else en.target.classList.add('in');
  }), { threshold: .15 });
  io.observe($('#stats'));
  $$('.pcard, .rule, .gcard, .pipeline li, .rec-card').forEach(el => { el.classList.add('reveal-up'); io.observe(el); });
  $$('.copy').forEach(b => b.onclick = async () => {
    try { await navigator.clipboard.writeText($('#' + b.dataset.copy).innerText); b.textContent = 'copied'; } catch (e) { b.textContent = 'select & copy'; }
    setTimeout(() => b.textContent = 'copy', 1400);
  });
})();
