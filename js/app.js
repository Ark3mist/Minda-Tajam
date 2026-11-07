/* Brain Bots: offline quiz game with rewards. No network, no tracking. */
(function () {
  'use strict';
  const { pick, shuffle, makeMath, science, language, puzzles, ITEM_EMOJI } = window.QB;

  /* ---------------- Persistent progress (localStorage, this device only) ---------------- */
  const KEY = 'brainbots_v1';
  const DEFAULT = {
    name: '', coins: 0, lifetimeCoins: 0, xp: 0, rounds: 0, bestScore: 0,
    correct: { math: 0, science: 0, language: 0 },
    modes: {}, puzzlesSolved: [], badges: [], stickers: [], avatar: '🤖',
    relaxed: false, sound: true
  };
  function fresh() { return JSON.parse(JSON.stringify(DEFAULT)); }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (!s) return fresh();
      const d = Object.assign(fresh(), s);
      d.correct = Object.assign(fresh().correct, s.correct || {});
      return d;
    } catch (e) { return fresh(); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* storage blocked: play continues */ } }
  let P = load();

  const level = () => 1 + Math.floor(Math.sqrt(P.xp / 150));
  const xpForLevel = (l) => 150 * (l - 1) * (l - 1);

  /* ---------------- Rewards catalogue ---------------- */
  const STICKERS = [
    { e: '🦊', cost: 50 }, { e: '🐼', cost: 80 }, { e: '🦖', cost: 120 }, { e: '🚀', cost: 150 },
    { e: '🦄', cost: 200 }, { e: '🐙', cost: 250 }, { e: '🛸', cost: 300 }, { e: '🐉', cost: 400 },
    { e: '🦾', cost: 500 }, { e: '👑', cost: 750 }, { e: '🌋', cost: 900 }, { e: '🏆', cost: 1200 }
  ];
  const BADGES = [
    { id: 'first', e: '🎉', name: 'First Mission', desc: 'Finish your first round' },
    { id: 'perfect', e: '💯', name: 'Perfect!', desc: 'Get every question right in a round' },
    { id: 'speedy', e: '⚡', name: 'Lightning Brain', desc: '5 right answers in under 5 seconds in one round' },
    { id: 'streak5', e: '🔥', name: 'On Fire', desc: '5 right answers in a row' },
    { id: 'mathlete', e: '➗', name: 'Mathlete', desc: '50 math answers right' },
    { id: 'scientist', e: '🔬', name: 'Scientist', desc: '50 science answers right' },
    { id: 'wordsmith', e: '📚', name: 'Wordsmith', desc: '50 language answers right' },
    { id: 'engineer', e: '🛠️', name: 'Engineer', desc: 'Solve every engineering puzzle' },
    { id: 'explorer', e: '🧭', name: 'Explorer', desc: 'Play all four modes' },
    { id: 'rich', e: '💰', name: 'Coin Collector', desc: 'Earn 1,000 coins in total' },
    { id: 'collector', e: '⭐', name: 'Sticker Fan', desc: 'Own 5 stickers' }
  ];

  /* ---------------- Sound (generated, no audio files) ---------------- */
  let ctx = null;
  function tone(freq, dur, delay, type) {
    if (!P.sound) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime + (delay || 0);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur);
    } catch (e) { /* audio unavailable */ }
  }
  const sfx = {
    good: () => { tone(660, 0.12); tone(880, 0.18, 0.1); },
    bad: () => { tone(220, 0.25, 0, 'square'); },
    win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, i * 0.12)); },
    tap: () => tone(500, 0.05)
  };

  /* ---------------- Helpers ---------------- */
  const app = document.getElementById('app');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const human = (s) => String(s).replace(/_/g, ' ');
  function confetti(n) {
    const bits = ['⭐', '🎉', '✨', '🪙', '💥'];
    for (let i = 0; i < (n || 18); i++) {
      const s = document.createElement('span');
      s.className = 'confetti';
      s.textContent = pick(bits);
      s.style.left = Math.random() * 100 + 'vw';
      s.style.animationDelay = Math.random() * 0.3 + 's';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1600);
    }
  }
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  /* ---------------- Screens ---------------- */
  function statsBar() {
    const l = level();
    const pct = Math.min(100, Math.round(100 * (P.xp - xpForLevel(l)) / (xpForLevel(l + 1) - xpForLevel(l))));
    return `<div class="stats">
      <span class="chip">🪙 ${P.coins}</span>
      <span class="chip">⭐ Level ${l}</span>
      <span class="chip">🏅 ${P.badges.length}/${BADGES.length}</span>
    </div>
    <div class="xpbar" title="XP to next level"><div style="width:${pct}%"></div></div>`;
  }

  function home() {
    stopTimer();
    if (!P.name) return askName();
    app.innerHTML = `
      <header class="hero">
        <div class="avatar">${P.avatar}</div>
        <h1>Hi, ${esc(P.name)}!</h1>
        <p>Pick a mission. Right answers earn coins. Fast right answers earn more!</p>
      </header>
      ${statsBar()}
      <div class="modes">
        <button class="mode m-math" data-mode="math"><span>➗</span>Math</button>
        <button class="mode m-sci" data-mode="science"><span>🔬</span>Science</button>
        <button class="mode m-lang" data-mode="language"><span>📚</span>Words</button>
        <button class="mode m-mix" data-mode="mix"><span>🎲</span>Mix</button>
      </div>
      <div class="row">
        <button class="btn alt" id="shop">🛒 Stickers</button>
        <button class="btn alt" id="badges">🏅 Badges</button>
        <button class="btn alt" id="settings">⚙️ Grown-ups</button>
      </div>
      <p class="muted center">Best score: ${P.bestScore} · Rounds played: ${P.rounds}</p>`;
    app.querySelectorAll('[data-mode]').forEach((b) => b.onclick = () => { sfx.tap(); startRound(b.dataset.mode); });
    document.getElementById('shop').onclick = shop;
    document.getElementById('badges').onclick = badges;
    document.getElementById('settings').onclick = settings;
  }

  function askName() {
    app.innerHTML = `
      <header class="hero"><div class="avatar">🤖</div><h1>Welcome to Brain Bots!</h1>
      <p>What should we call you?</p></header>
      <form id="nf" class="card">
        <input id="nm" maxlength="16" placeholder="Your name" autocomplete="off" required>
        <button class="btn">Let's go! 🚀</button>
      </form>`;
    document.getElementById('nf').onsubmit = (e) => {
      e.preventDefault();
      P.name = document.getElementById('nm').value.trim().slice(0, 16) || 'Explorer';
      save(); home();
    };
    document.getElementById('nm').focus();
  }

  /* ---------------- Round building ---------------- */
  const ROUND_LEN = 10;
  let R = null; // current round state

  function mcq(item, subject) {
    return { subject, kind: 'mcq', prompt: item.q, answer: item.a, options: shuffle([item.a].concat(item.w)), fact: item.f, limit: 20 };
  }
  function puzzle(p) {
    return {
      subject: 'science', kind: 'puzzle', id: p.id, prompt: p.scenario_text,
      mode: p.interactive_type === 'multi_select_tap' ? 'all' : 'one',
      items: shuffle(p.correct_items.concat(p.distractor_items)),
      correct: p.correct_items, success: p.physics_effect_success, failure: p.physics_effect_failure,
      fact: 'Skill: ' + p.target_skill + '.', limit: 30
    };
  }
  function buildRound(mode) {
    const sci = shuffle(science), lang = shuffle(language);
    // Prefer puzzles not solved yet so the Engineer badge is reachable.
    const unsolved = puzzles.filter((p) => P.puzzlesSolved.indexOf(p.id) < 0);
    const puz = shuffle(unsolved).concat(shuffle(puzzles.filter((p) => unsolved.indexOf(p) < 0)));
    let list = [];
    if (mode === 'math') for (let i = 0; i < ROUND_LEN; i++) list.push({ gen: 'math' });
    if (mode === 'science') list = sci.slice(0, 7).map((q) => mcq(q, 'science')).concat(puz.slice(0, 3).map(puzzle));
    if (mode === 'language') list = lang.slice(0, ROUND_LEN).map((q) => mcq(q, 'language'));
    if (mode === 'mix') {
      list = [{ gen: 'math' }, { gen: 'math' }, { gen: 'math' }, { gen: 'math' }]
        .concat(sci.slice(0, 2).map((q) => mcq(q, 'science')), [puzzle(puz[0])], lang.slice(0, 3).map((q) => mcq(q, 'language')));
    }
    return shuffle(list);
  }

  function startRound(mode) {
    R = { mode, list: buildRound(mode), i: 0, score: 0, streak: 0, best: 0, right: 0, fast: 0, times: [], startCoins: P.coins };
    P.modes[mode] = true; save();
    showQuestion();
  }

  function mathTier() {
    // Grows with player level, and steps up inside a round when the child is on a streak.
    const base = Math.min(2, Math.floor((level() - 1) / 3));
    return Math.min(2, base + (R.streak >= 3 ? 1 : 0));
  }

  /* ---------------- Timer ---------------- */
  let timer = null, tStart = 0, tLimit = 20;
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function startTimer(limit, onTimeout) {
    stopTimer(); tStart = performance.now(); tLimit = limit;
    const bar = document.getElementById('tbar');
    if (P.relaxed) { if (bar) bar.parentNode.style.display = 'none'; return; }
    timer = setInterval(() => {
      const left = Math.max(0, tLimit - (performance.now() - tStart) / 1000);
      if (bar) {
        bar.style.width = (100 * left / tLimit) + '%';
        bar.className = left < tLimit * 0.25 ? 'low' : '';
      }
      if (left <= 0) { stopTimer(); onTimeout(); }
    }, 100);
  }
  const elapsed = () => (performance.now() - tStart) / 1000;

  /* ---------------- Question screen ---------------- */
  function showQuestion() {
    let q = R.list[R.i];
    if (q.gen === 'math') q = R.list[R.i] = makeMath(mathTier());
    R.q = q; R.done = false;
    const label = { math: '➗ Math', science: q.kind === 'puzzle' ? '🛠️ Engineering' : '🔬 Science', language: '📚 Words' }[q.subject];
    const head = `
      <div class="qhead">
        <button class="icon" id="quit" aria-label="Quit round">✖</button>
        <span>${label} · ${R.i + 1}/${R.list.length}</span>
        <span class="chip">🏁 ${R.score}</span>
        <span class="chip ${R.streak >= 3 ? 'hot' : ''}">🔥 ${R.streak}</span>
      </div>
      <div class="timer"><div id="tbar"></div></div>`;

    if (q.kind === 'mcq') {
      app.innerHTML = head + `
        <div class="card question ${q.subject}"><h2>${esc(q.prompt)}</h2></div>
        <div class="options">${q.options.map((o) => `<button class="opt" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
        <div id="fb"></div>`;
      app.querySelectorAll('.opt').forEach((b) => b.onclick = () => {
        if (R.done) return;
        const ok = b.dataset.v === q.answer;
        app.querySelectorAll('.opt').forEach((x) => {
          x.disabled = true;
          if (x.dataset.v === q.answer) x.classList.add('right');
        });
        if (!ok) b.classList.add('wrong');
        answer(ok, false);
      });
    } else {
      const hint = q.mode === 'one' ? 'Tap the ONE item that fixes it.' : 'Tap ALL the items that work, then press Check.';
      app.innerHTML = head + `
        <div class="card question science"><h2>${esc(q.prompt)}</h2><p class="muted">${hint}</p></div>
        <div class="items">${q.items.map((it) => `<button class="item" data-v="${it}"><span>${ITEM_EMOJI[it] || '🔩'}</span>${esc(human(it))}</button>`).join('')}</div>
        ${q.mode === 'all' ? '<button class="btn" id="check" disabled>Check ✔</button>' : ''}
        <div id="fb"></div>`;
      const sel = new Set();
      const reveal = () => app.querySelectorAll('.item').forEach((x) => {
        x.disabled = true;
        if (q.correct.indexOf(x.dataset.v) >= 0) x.classList.add('right');
        else if (sel.has(x.dataset.v)) x.classList.add('wrong');
      });
      app.querySelectorAll('.item').forEach((b) => b.onclick = () => {
        if (R.done) return;
        sfx.tap();
        if (q.mode === 'one') {
          sel.add(b.dataset.v); reveal();
          answer(q.correct.indexOf(b.dataset.v) >= 0, false);
        } else {
          sel.has(b.dataset.v) ? sel.delete(b.dataset.v) : sel.add(b.dataset.v);
          b.classList.toggle('picked');
          document.getElementById('check').disabled = sel.size === 0;
        }
      });
      const chk = document.getElementById('check');
      if (chk) chk.onclick = () => {
        if (R.done) return;
        const ok = sel.size === q.correct.length && q.correct.every((c) => sel.has(c));
        chk.disabled = true; reveal(); answer(ok, false);
      };
    }
    document.getElementById('quit').onclick = () => { if (confirm('Quit this round? Coins from this round will be lost.')) { P.coins = R.startCoins; save(); home(); } };
    startTimer(q.limit, () => {
      if (R.done) return;
      app.querySelectorAll('.opt, .item').forEach((x) => {
        x.disabled = true;
        const v = x.dataset.v;
        if (v === R.q.answer || (R.q.correct && R.q.correct.indexOf(v) >= 0)) x.classList.add('right');
      });
      const c = document.getElementById('check'); if (c) c.disabled = true;
      answer(false, true);
    });
  }

  /* ---------------- Scoring ----------------
     correct = 100 pts
     speed bonus = up to +100, shrinking as the timer runs down (only for correct answers)
     streak multiplier: x1.5 from 3 in a row, x2 from 5 in a row
     A wrong answer resets the streak, so wild guessing for speed costs more than it gains. */
  function answer(ok, timedOut) {
    R.done = true; stopTimer();
    const q = R.q, t = elapsed();
    let html;
    if (ok) {
      R.streak++; R.best = Math.max(R.best, R.streak); R.right++;
      R.times.push(t);
      if (t < 5) R.fast++;
      const speed = P.relaxed ? 25 : Math.round(100 * Math.max(0, q.limit - t) / q.limit);
      const mult = R.streak >= 5 ? 2 : R.streak >= 3 ? 1.5 : 1;
      const pts = Math.round((100 + speed) * mult);
      R.score += pts;
      P.correct[q.subject]++;
      if (q.kind === 'puzzle' && P.puzzlesSolved.indexOf(q.id) < 0) P.puzzlesSolved.push(q.id);
      sfx.good(); confetti(10);
      html = `<div class="fb good">
        <h3>${pick(['Awesome!', 'Correct!', 'Brilliant!', 'Nailed it!', 'Super!'])} +${pts}</h3>
        <p class="breakdown">100 correct + ${speed} ${P.relaxed ? 'bonus' : 'speed'}${mult > 1 ? ` × ${mult} streak 🔥` : ''} · ${t.toFixed(1)}s</p>
        ${q.kind === 'puzzle' ? `<p>✨ ${esc(human(q.success))}</p>` : ''}
        <p>${esc(q.fact)}</p></div>`;
    } else {
      R.streak = 0;
      sfx.bad();
      const correctTxt = q.kind === 'puzzle' ? q.correct.map(human).join(', ') : q.answer;
      html = `<div class="fb bad">
        <h3>${timedOut ? '⏰ Time\'s up!' : 'Not quite!'}</h3>
        ${q.kind === 'puzzle' ? `<p>💤 ${esc(human(q.failure))}</p>` : ''}
        <p>Answer: <b>${esc(correctTxt)}</b></p>
        <p>${esc(q.fact)}</p></div>`;
    }
    const last = R.i === R.list.length - 1;
    document.getElementById('fb').innerHTML = html + `<button class="btn" id="next">${last ? 'See results 🏁' : 'Next ➜'}</button>`;
    const nx = document.getElementById('next');
    nx.onclick = () => { R.i++; last ? results() : showQuestion(); };
    nx.focus();
    nx.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------------- Results + rewards ---------------- */
  function results() {
    stopTimer();
    const n = R.list.length, acc = R.right / n;
    const stars = acc === 1 ? 3 : acc >= 0.7 ? 2 : acc >= 0.4 ? 1 : 0;
    const starBonus = [0, 10, 25, 50][stars];
    const coins = Math.floor(R.score / 10) + starBonus;
    const before = level();
    P.coins += coins; P.lifetimeCoins += coins; P.xp += R.score; P.rounds++;
    const newBest = R.score > P.bestScore; if (newBest) P.bestScore = R.score;
    const newBadges = checkBadges(acc === 1);
    save();
    const levelUp = level() > before;
    const avg = R.times.length ? (R.times.reduce((a, b) => a + b, 0) / R.times.length).toFixed(1) : '–';
    stars >= 2 ? (sfx.win(), confetti(30)) : sfx.good();
    app.innerHTML = `
      <header class="hero"><h1>${['Keep practising!', 'Good try!', 'Great job!', 'PERFECT!'][stars]}</h1>
        <div class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div></header>
      <div class="card results">
        <div><b>${R.right}/${n}</b><span>right</span></div>
        <div><b>${R.score}</b><span>points${newBest ? ' 🆕' : ''}</span></div>
        <div><b>${R.best}</b><span>best streak</span></div>
        <div><b>${avg}s</b><span>avg right answer</span></div>
      </div>
      <div class="card reward">🪙 +${coins} coins <small>(${Math.floor(R.score / 10)} from points + ${starBonus} star bonus)</small></div>
      ${levelUp ? `<div class="card reward lvl">⬆️ Level up! You are now level ${level()}</div>` : ''}
      ${newBadges.map((b) => `<div class="card reward badge">${b.e} New badge: <b>${b.name}</b></div>`).join('')}
      <div class="row">
        <button class="btn" id="again">Play again 🔁</button>
        <button class="btn alt" id="home">Home 🏠</button>
      </div>`;
    document.getElementById('again').onclick = () => startRound(R.mode);
    document.getElementById('home').onclick = home;
  }

  function checkBadges(perfect) {
    const earned = [];
    const give = (id) => {
      if (P.badges.indexOf(id) < 0) { P.badges.push(id); earned.push(BADGES.find((b) => b.id === id)); }
    };
    if (R) {
      give('first');
      if (perfect) give('perfect');
      if (R.fast >= 5) give('speedy');
      if (R.best >= 5) give('streak5');
    }
    if (P.correct.math >= 50) give('mathlete');
    if (P.correct.science >= 50) give('scientist');
    if (P.correct.language >= 50) give('wordsmith');
    if (puzzles.every((p) => P.puzzlesSolved.indexOf(p.id) >= 0)) give('engineer');
    if (['math', 'science', 'language', 'mix'].every((m) => P.modes[m])) give('explorer');
    if (P.lifetimeCoins >= 1000) give('rich');
    if (P.stickers.length >= 5) give('collector');
    return earned;
  }

  /* ---------------- Sticker shop ---------------- */
  function shop() {
    app.innerHTML = `
      <div class="qhead"><button class="icon" id="back" aria-label="Back">⬅</button><span>Sticker Shop</span><span class="chip">🪙 ${P.coins}</span></div>
      <p class="muted center">Spend coins on stickers. Tap a sticker you own to make it your avatar.</p>
      <div class="shop">${STICKERS.map((s) => {
        const own = P.stickers.indexOf(s.e) >= 0;
        return `<button class="sticker ${own ? 'own' : ''} ${P.avatar === s.e ? 'active' : ''}" data-e="${s.e}" data-c="${s.cost}" ${!own && P.coins < s.cost ? 'disabled' : ''}>
          <span>${s.e}</span>${own ? (P.avatar === s.e ? 'Wearing' : 'Use') : '🪙 ' + s.cost}</button>`;
      }).join('')}</div>`;
    document.getElementById('back').onclick = home;
    app.querySelectorAll('.sticker').forEach((b) => b.onclick = () => {
      const e = b.dataset.e, cost = +b.dataset.c;
      if (P.stickers.indexOf(e) < 0) {
        if (P.coins < cost) return;
        P.coins -= cost; P.stickers.push(e); sfx.win(); confetti(15);
        const nb = checkBadges(false);
        nb.forEach((x) => toast(`${x.e} New badge: <b>${x.name}</b>`));
      }
      P.avatar = e; save(); shop();
    });
  }

  function badges() {
    app.innerHTML = `
      <div class="qhead"><button class="icon" id="back" aria-label="Back">⬅</button><span>Badges</span><span class="chip">🏅 ${P.badges.length}/${BADGES.length}</span></div>
      <div class="badges">${BADGES.map((b) => {
        const has = P.badges.indexOf(b.id) >= 0;
        return `<div class="badgecard ${has ? 'has' : ''}"><span>${has ? b.e : '🔒'}</span><b>${b.name}</b><small>${b.desc}</small></div>`;
      }).join('')}</div>
      <p class="muted center">Engineering puzzles solved: ${P.puzzlesSolved.length}/${puzzles.length}</p>`;
    document.getElementById('back').onclick = home;
  }

  /* ---------------- Grown-ups ---------------- */
  function settings() {
    const a = Math.floor(Math.random() * 6) + 6, b = Math.floor(Math.random() * 6) + 6;
    app.innerHTML = `
      <div class="qhead"><button class="icon" id="back" aria-label="Back">⬅</button><span>Grown-ups</span><span></span></div>
      <form class="card" id="gate"><p>Grown-ups only: what is ${a} × ${b}?</p>
        <input id="ga" inputmode="numeric" autocomplete="off"><button class="btn">Open</button></form>`;
    document.getElementById('back').onclick = home;
    document.getElementById('gate').onsubmit = (e) => {
      e.preventDefault();
      if (+document.getElementById('ga').value === a * b) settingsPanel(); else toast('Not quite!');
    };
  }
  function settingsPanel() {
    const acc = P.correct;
    app.innerHTML = `
      <div class="qhead"><button class="icon" id="back" aria-label="Back">⬅</button><span>Grown-ups</span><span></span></div>
      <div class="card">
        <label class="toggle"><input type="checkbox" id="relaxed" ${P.relaxed ? 'checked' : ''}> Relaxed mode (no timer, flat +25 bonus instead of speed bonus)</label>
        <label class="toggle"><input type="checkbox" id="sound" ${P.sound ? 'checked' : ''}> Sound effects</label>
      </div>
      <div class="card">
        <h3>Progress</h3>
        <p>Right answers: Math ${acc.math} · Science ${acc.science} · Words ${acc.language}</p>
        <p>Rounds: ${P.rounds} · Best score: ${P.bestScore} · Level ${level()} · Lifetime coins: ${P.lifetimeCoins}</p>
        <p class="muted">All progress is stored only on this device. Nothing is sent anywhere.</p>
      </div>
      <div class="card">
        <label>Player name <input id="rn" maxlength="16" value="${esc(P.name)}"></label>
        <div class="row"><button class="btn alt" id="saveName">Save name</button>
        <button class="btn danger" id="reset">Reset all progress</button></div>
      </div>`;
    document.getElementById('back').onclick = home;
    document.getElementById('relaxed').onchange = (e) => { P.relaxed = e.target.checked; save(); };
    document.getElementById('sound').onchange = (e) => { P.sound = e.target.checked; save(); };
    document.getElementById('saveName').onclick = () => { P.name = document.getElementById('rn').value.trim().slice(0, 16) || P.name; save(); toast('Saved'); };
    document.getElementById('reset').onclick = () => {
      if (confirm('Erase all coins, stickers, badges and progress?')) { P = fresh(); save(); home(); }
    };
  }

  /* ---------------- Offline install ---------------- */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  home();
})();
