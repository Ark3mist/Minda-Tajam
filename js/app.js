/* Brain Bots: offline math practice for ages 4–10, with player profiles and rewards.
   No network, no tracking. Everything is stored on this device only. */
(function () {
  'use strict';
  const MATH = window.MATH;
  const { pick } = MATH;

  /* ---------------- Rewards catalogue ---------------- */
  const AVATARS = ['🤖', '🐱', '🐶', '🐰', '🦁', '🐸', '🐵', '🐧'];
  const STICKERS = [
    { e: '🦊', cost: 50 }, { e: '🐼', cost: 80 }, { e: '🦖', cost: 120 }, { e: '🚀', cost: 150 },
    { e: '🦄', cost: 200 }, { e: '🐙', cost: 250 }, { e: '🛸', cost: 300 }, { e: '🐉', cost: 400 },
    { e: '🦾', cost: 500 }, { e: '👑', cost: 750 }, { e: '🌋', cost: 900 }, { e: '🏆', cost: 1200 }
  ];
  const BADGES = [
    { id: 'first', e: '🎉', name: 'First Round', desc: 'Finish your first round' },
    { id: 'perfect', e: '💯', name: 'Perfect!', desc: 'Get every question right in a round' },
    { id: 'speedy', e: '⚡', name: 'Lightning Brain', desc: '5 super-fast right answers in one round' },
    { id: 'streak5', e: '🔥', name: 'On Fire', desc: '5 right answers in a row' },
    { id: 'master', e: '🎂', name: 'Age Master', desc: 'Get 3 stars at your age' },
    { id: 'century', e: '💪', name: 'Hundred Club', desc: '100 right answers' },
    { id: 'brain', e: '🧠', name: 'Big Brain', desc: '500 right answers' },
    { id: 'loyal', e: '📅', name: 'Keep Going', desc: 'Play 20 rounds' },
    { id: 'rich', e: '💰', name: 'Coin Collector', desc: 'Earn 1,000 coins in total' },
    { id: 'collector', e: '⭐', name: 'Sticker Fan', desc: 'Own 5 stickers' }
  ];

  /* ---------------- Profiles (localStorage, this device only) ---------------- */
  const KEY = 'brainbots_v2', OLD_KEY = 'brainbots_v1';
  const MIN_AGE = 4, MAX_AGE = 10;

  function newProfile(name, age, avatar) {
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name, age, avatar,
      coins: 0, lifetimeCoins: 0, xp: 0, rounds: 0, bestScore: 0, right: 0,
      badges: [], stickers: [], bestStars: {},
      history: [], // one entry per finished round, for the parent progress charts

      relaxed: false, sound: true, readAloud: true
    };
  }
  function clampAge(a) { return Math.max(MIN_AGE, Math.min(MAX_AGE, a | 0)); }
  function loadDB() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      if (d && Array.isArray(d.profiles)) {
        d.profiles = d.profiles.map((p) => Object.assign(newProfile(p.name, p.age, p.avatar), p));
        return d;
      }
    } catch (e) { /* fall through */ }
    const db = { profiles: [], current: null };
    // Carry over the player from the earlier single-player version.
    try {
      const o = JSON.parse(localStorage.getItem(OLD_KEY));
      if (o && o.name) {
        const p = Object.assign(newProfile(o.name, clampAge(o.mathAge || 8), o.avatar || AVATARS[0]), {
          coins: o.coins || 0, lifetimeCoins: o.lifetimeCoins || 0, xp: o.xp || 0, rounds: o.rounds || 0,
          bestScore: o.bestScore || 0, right: (o.correct && o.correct.math) || 0, stickers: o.stickers || [],
          bestStars: o.mathStars || {}, relaxed: !!o.relaxed, sound: o.sound !== false,
          badges: (o.badges || []).filter((id) => BADGES.some((b) => b.id === id))
        });
        db.profiles.push(p); db.current = p.id; db.migrated = true;
      }
    } catch (e) { /* ignore */ }
    return db;
  }
  let DB = loadDB();
  let P = DB.profiles.find((p) => p.id === DB.current) || null;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { /* storage blocked: play continues */ } }
  if (DB.migrated) { delete DB.migrated; save(); }
  function useProfile(p) { P = p; DB.current = p ? p.id : null; save(); }

  const level = () => 1 + Math.floor(Math.sqrt(P.xp / 150));
  const xpForLevel = (l) => 150 * (l - 1) * (l - 1);

  /* ---------------- Sound effects (generated, no audio files) ---------------- */
  let ctx = null;
  function tone(freq, dur, delay, type) {
    if (!P || !P.sound) return;
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

  /* ---------------- Read aloud (device voices; offline on most devices) ---------------- */
  const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  function spoken(s) {
    return String(s)
      .replace(/(\d+)\/(\d+)/g, '$1 over $2')
      .replace(/−/g, ' minus ').replace(/×/g, ' times ').replace(/÷/g, ' divided by ')
      .replace(/\+/g, ' plus ').replace(/=/g, ' equals ').replace(/²/g, ' squared').replace(/%/g, ' percent')
      .replace(/(^|[\s,])\?(?=[\s,.]|$)/g, '$1 what');
  }
  function speak(s, force) {
    if (!canSpeak || (!force && !(P && P.readAloud))) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(spoken(s));
      u.rate = 0.9; u.lang = 'en';
      speechSynthesis.speak(u);
    } catch (e) { /* no voice installed */ }
  }
  function hush() { try { if (canSpeak) speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
  // Auto-read for players who may not read yet.
  const autoRead = () => P.age <= 6;

  /* ---------------- Helpers ---------------- */
  const app = document.getElementById('app');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (id) => document.getElementById(id);
  const on = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };
  const starsText = (n) => '⭐'.repeat(n) + '☆'.repeat(3 - n);
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
  function leave() { stopTimer(); hush(); redraw = null; }

  /* ---------------- Start: who is playing? ---------------- */
  function start() {
    leave();
    if (!DB.profiles.length) return profileForm(null);
    if (P) return home();
    whoIsPlaying();
  }

  function whoIsPlaying() {
    leave();
    app.innerHTML = `
      <header class="hero"><div class="avatar">🤖</div><h1>Who is playing?</h1></header>
      <div class="profiles">
        ${DB.profiles.map((p) => `<button class="ptile" data-id="${p.id}"><span>${p.avatar}</span><b>${esc(p.name)}</b><small>Age ${p.age}</small></button>`).join('')}
        <button class="ptile add" id="add"><span>➕</span><b>New player</b></button>
      </div>`;
    app.querySelectorAll('[data-id]').forEach((b) => b.onclick = () => {
      useProfile(DB.profiles.find((p) => p.id === b.dataset.id)); sfx.tap(); home();
    });
    on('add', () => profileForm(null));
  }

  /* Create a profile (existing = null) or edit one. */
  function profileForm(existing) {
    leave();
    let age = existing ? existing.age : null;
    let avatar = existing ? existing.avatar : AVATARS[0];
    app.innerHTML = `
      <div class="qhead">${DB.profiles.length ? '<button class="icon" id="back" aria-label="Back">⬅</button>' : '<span></span>'}
        <span>${existing ? 'Edit player' : 'New player'}</span><span></span></div>
      ${existing ? '' : '<header class="hero"><h1>Welcome to Brain Bots!</h1><p>Let\'s make your player.</p></header>'}
      <form id="pf" class="card" autocomplete="off">
        <label class="lbl" for="nm">1. Your name</label>
        <input id="nm" maxlength="16" placeholder="Name" value="${existing ? esc(existing.name) : ''}">
        <span class="lbl">2. How old are you?</span>
        <div class="agepick">${Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i)
          .map((a) => `<button type="button" class="agebtn ${a === age ? 'on' : ''}" data-age="${a}" aria-pressed="${a === age}">${a}</button>`).join('')}</div>
        <p class="muted" id="agehint">${age ? esc(MATH.AGES[age].topics) : 'Questions are picked to match your age.'}</p>
        <span class="lbl">3. Pick your buddy</span>
        <div class="avpick">${AVATARS.map((e) => `<button type="button" class="avbtn ${e === avatar ? 'on' : ''}" data-av="${e}" aria-pressed="${e === avatar}">${e}</button>`).join('')}</div>
        <p class="err" id="err" role="alert"></p>
        <button class="btn">${existing ? 'Save ✔' : 'Start playing 🚀'}</button>
      </form>`;
    on('back', () => (existing ? settingsPanel() : (P ? home() : whoIsPlaying())));
    app.querySelectorAll('[data-age]').forEach((b) => b.onclick = () => {
      age = +b.dataset.age; sfx.tap();
      app.querySelectorAll('[data-age]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      $('agehint').textContent = MATH.AGES[age].topics; $('err').textContent = '';
    });
    app.querySelectorAll('[data-av]').forEach((b) => b.onclick = () => {
      avatar = b.dataset.av; sfx.tap();
      app.querySelectorAll('[data-av]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    });
    $('pf').onsubmit = (e) => {
      e.preventDefault();
      const name = $('nm').value.trim().slice(0, 16);
      if (!name) { $('err').textContent = 'Please type a name.'; $('nm').focus(); return; }
      if (!age) { $('err').textContent = 'Please tap your age.'; return; }
      if (existing) {
        Object.assign(existing, { name, age, avatar }); save(); toast('Saved'); settingsPanel();
      } else {
        const p = newProfile(name, age, avatar);
        DB.profiles.push(p); useProfile(p); sfx.win(); home();
      }
    };
    if (!existing) $('nm').focus();
  }

  /* ---------------- Home ---------------- */
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
    leave();
    if (!P) return start();
    const info = MATH.AGES[P.age], best = P.bestStars[P.age] || 0;
    app.innerHTML = `
      <div class="topbar"><button class="btn alt small" id="switch">👥 ${DB.profiles.length > 1 ? 'Switch player' : 'Players'}</button></div>
      <header class="hero">
        <div class="avatar">${P.avatar}</div>
        <h1>Hi, ${esc(P.name)}!</h1>
      </header>
      ${statsBar()}
      <button class="play" id="play">
        <span class="big">▶</span>
        <span><b>Play math</b><small>Age ${P.age}: ${esc(info.title)}</small><small class="beststars">Best: ${starsText(best)}</small></span>
      </button>
      <p class="muted center">Right answers earn coins. Fast right answers earn more!</p>
      <div class="row">
        <button class="btn alt" id="shop">🛒 Stickers</button>
        <button class="btn alt" id="badges">🏅 Badges</button>
        <button class="btn alt" id="settings">⚙️ Grown-ups</button>
      </div>
      <p class="muted center">Best score: ${P.bestScore} · Rounds played: ${P.rounds}</p>`;
    on('play', () => { sfx.tap(); startRound(); });
    on('switch', whoIsPlaying);
    on('shop', shop);
    on('badges', badges);
    on('settings', settings);
  }

  /* ---------------- Round ---------------- */
  let R = null;
  function startRound() {
    R = { age: P.age, n: MATH.LEN[P.age], i: 0, score: 0, streak: 0, best: 0, right: 0, fast: 0, times: [], allTimes: [], seen: {} };
    showQuestion();
  }

  // Next question for the player's age; harder variants while on a 3+ streak; no repeats in a round.
  function nextQuestion() {
    let q;
    for (let tries = 0; tries < 8; tries++) {
      q = MATH.make(R.age, R.streak >= 3);
      if (!R.seen[q.prompt + '|' + q.answer]) break;
    }
    R.seen[q.prompt + '|' + q.answer] = true;
    return q;
  }

  /* Timer */
  let timer = null, tStart = 0, tLimit = 20;
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function startTimer(limit, onTimeout) {
    stopTimer(); tStart = performance.now(); tLimit = limit;
    const bar = $('tbar');
    if (P.relaxed) { if (bar) bar.parentNode.style.display = 'none'; return; }
    timer = setInterval(() => {
      const left = Math.max(0, tLimit - (performance.now() - tStart) / 1000);
      if (bar) { bar.style.width = (100 * left / tLimit) + '%'; bar.className = left < tLimit * 0.25 ? 'low' : ''; }
      if (left <= 0) { stopTimer(); onTimeout(); }
    }, 100);
  }
  const elapsed = () => (performance.now() - tStart) / 1000;

  function renderVisual(v) {
    if (!v) return '';
    return '<div class="visual" aria-hidden="true">' + v.map((t) => {
      if (typeof t === 'string') return `<span class="vop">${esc(t)}</span>`;
      let html = '';
      for (let i = 0; i < t.n; i++) {
        html += `<span class="${t.cross && i >= t.n - t.cross ? 'x' : ''}">${t.e}</span>`;
        if ((i + 1) % 5 === 0 && i + 1 < t.n) html += '<br>'; // rows of 5 help children see amounts
      }
      return `<span class="grp">${html}</span>`;
    }).join('') + '</div>';
  }

  function showQuestion() {
    const q = R.q = nextQuestion();
    R.done = false;
    app.innerHTML = `
      <div class="qhead">
        <button class="icon" id="quit" aria-label="Quit round">✖</button>
        <span>➗ ${R.i + 1}/${R.n}</span>
        <span class="chip">🏁 ${R.score}</span>
        <span class="chip ${R.streak >= 3 ? 'hot' : ''}">🔥 ${R.streak}</span>
      </div>
      <div class="timer"><div id="tbar"></div></div>
      <div class="card question">
        ${canSpeak ? '<button class="icon say" id="say" aria-label="Read the question aloud">🔊</button>' : ''}
        <h2>${esc(q.prompt)}</h2>${renderVisual(q.visual)}</div>
      <div class="options ${q.bigOpts ? 'big' : ''} ${q.options.length === 3 ? 'three' : ''}">
        ${q.options.map((o) => `<button class="opt" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
      <div id="fb"></div>`;
    const mark = () => app.querySelectorAll('.opt').forEach((x) => {
      x.disabled = true;
      if (x.dataset.v === q.answer) x.classList.add('right');
    });
    app.querySelectorAll('.opt').forEach((b) => b.onclick = () => {
      if (R.done) return;
      mark();
      const ok = b.dataset.v === q.answer;
      if (!ok) b.classList.add('wrong');
      answer(ok, false);
    });
    on('quit', () => { if (confirm('Quit this round? Points from this round will be lost.')) home(); });
    on('say', () => speak(q.prompt, true));
    if (autoRead()) speak(q.prompt);
    startTimer(q.limit, () => { if (!R.done) { mark(); answer(false, true); } });
  }

  /* Scoring
     correct = 100 pts
     speed bonus = up to +100, shrinking as the timer runs down (right answers only)
     streak multiplier: x1.5 from 3 in a row, x2 from 5 in a row
     A wrong answer resets the streak, so fast guessing costs more than it earns. */
  function answer(ok, timedOut) {
    R.done = true; stopTimer();
    const q = R.q, t = timedOut ? q.limit : elapsed();
    R.allTimes.push(t);
    let html;
    if (ok) {
      R.streak++; R.best = Math.max(R.best, R.streak); R.right++; R.times.push(t);
      if (t < q.limit / 4) R.fast++; // "super fast" scales with the age's time limit
      const speed = P.relaxed ? 25 : Math.round(100 * Math.max(0, q.limit - t) / q.limit);
      const mult = R.streak >= 5 ? 2 : R.streak >= 3 ? 1.5 : 1;
      const pts = Math.round((100 + speed) * mult);
      R.score += pts; P.right++;
      sfx.good(); confetti(10);
      html = `<div class="fb good">
        <h3>${pick(['Awesome!', 'Correct!', 'Brilliant!', 'Nailed it!', 'Super!'])} +${pts}</h3>
        <p class="breakdown">100 correct + ${speed} ${P.relaxed ? 'bonus' : 'speed'}${mult > 1 ? ` × ${mult} streak 🔥` : ''} · ${t.toFixed(1)}s</p>
        <p>${esc(q.fact)}</p></div>`;
    } else {
      R.streak = 0; sfx.bad();
      html = `<div class="fb bad">
        <h3>${timedOut ? '⏰ Time\'s up!' : 'Not quite!'}</h3>
        <p>Answer: <b>${esc(q.answer)}</b></p>
        <p>${esc(q.fact)}</p></div>`;
    }
    save();
    const last = R.i === R.n - 1;
    $('fb').innerHTML = html + `<button class="btn" id="next">${last ? 'See results 🏁' : 'Next ➜'}</button>`;
    if (autoRead()) speak((ok ? 'Correct! ' : 'The answer is ' + q.answer + '. ') + q.fact);
    const nx = $('next');
    nx.onclick = () => { hush(); R.i++; last ? results() : showQuestion(); };
    nx.focus();
    nx.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------------- Results + rewards ---------------- */
  function results() {
    leave();
    const acc = R.right / R.n;
    const stars = acc === 1 ? 3 : acc >= 0.7 ? 2 : acc >= 0.4 ? 1 : 0;
    const starBonus = [0, 10, 25, 50][stars];
    const prev = P.bestStars[R.age] || 0;
    const masterBonus = stars === 3 && prev < 3 ? 100 : 0; // first 3-star round at this age
    if (stars > prev) P.bestStars[R.age] = stars;
    const coins = Math.floor(R.score / 10) + starBonus + masterBonus;
    const before = level();
    P.coins += coins; P.lifetimeCoins += coins; P.xp += R.score; P.rounds++;
    const newBest = R.score > P.bestScore; if (newBest) P.bestScore = R.score;
    const newBadges = checkBadges(acc === 1, stars);
    // Record the finished round for the parent's progress charts.
    P.history.push({
      t: Date.now(), age: R.age, n: R.n, right: R.right,
      acc: Math.round(acc * 100),
      sec: Math.round(10 * R.allTimes.reduce((a, b) => a + b, 0) / R.allTimes.length) / 10, // avg seconds per question
      stars, score: R.score, relaxed: !!P.relaxed
    });
    if (P.history.length > 1000) P.history.splice(0, P.history.length - 1000);
    save();
    const levelUp = level() > before;
    const avg = R.times.length ? (R.times.reduce((a, b) => a + b, 0) / R.times.length).toFixed(1) : '–';
    stars >= 2 ? (sfx.win(), confetti(30)) : sfx.good();
    const title = ['Keep practising!', 'Good try!', 'Great job!', 'PERFECT!'][stars];
    if (autoRead()) speak(`${title} You got ${R.right} out of ${R.n}.`);
    app.innerHTML = `
      <header class="hero"><h1>${title}</h1><div class="stars">${starsText(stars)}</div></header>
      <div class="card results">
        <div><b>${R.right}/${R.n}</b><span>right</span></div>
        <div><b>${R.score}</b><span>points${newBest ? ' 🆕' : ''}</span></div>
        <div><b>${R.best}</b><span>best streak</span></div>
        <div><b>${avg}s</b><span>avg right answer</span></div>
      </div>
      <div class="card reward">🪙 +${coins} coins
        <small>(${Math.floor(R.score / 10)} from points + ${starBonus} star bonus${masterBonus ? ` + ${masterBonus} Age Master bonus` : ''})</small></div>
      ${levelUp ? `<div class="card reward lvl">⬆️ Level up! You are now level ${level()}</div>` : ''}
      ${newBadges.map((b) => `<div class="card reward badge">${b.e} New badge: <b>${b.name}</b></div>`).join('')}
      <div class="row">
        <button class="btn" id="again">Play again 🔁</button>
        <button class="btn alt" id="home">Home 🏠</button>
      </div>`;
    on('again', startRound);
    on('home', home);
  }

  function checkBadges(perfect, stars) {
    const earned = [];
    const give = (id) => { if (P.badges.indexOf(id) < 0) { P.badges.push(id); earned.push(BADGES.find((b) => b.id === id)); } };
    if (stars != null) {
      give('first');
      if (perfect) give('perfect');
      if (R.fast >= 5) give('speedy');
      if (R.best >= 5) give('streak5');
      if (stars === 3 && R.age === P.age) give('master');
    }
    if (P.right >= 100) give('century');
    if (P.right >= 500) give('brain');
    if (P.rounds >= 20) give('loyal');
    if (P.lifetimeCoins >= 1000) give('rich');
    if (P.stickers.length >= 5) give('collector');
    return earned;
  }

  /* ---------------- Sticker shop ---------------- */
  function shop() {
    leave();
    app.innerHTML = `
      <div class="qhead"><button class="icon" id="back" aria-label="Back">⬅</button><span>Sticker Shop</span><span class="chip">🪙 ${P.coins}</span></div>
      <p class="muted center">Spend coins on stickers. Tap a sticker you own to make it your buddy.</p>
      <div class="shop">${STICKERS.map((s) => {
        const own = P.stickers.indexOf(s.e) >= 0;
        return `<button class="sticker ${own ? 'own' : ''} ${P.avatar === s.e ? 'active' : ''}" data-e="${s.e}" data-c="${s.cost}" ${!own && P.coins < s.cost ? 'disabled' : ''}>
          <span>${s.e}</span>${own ? (P.avatar === s.e ? 'Wearing' : 'Use') : '🪙 ' + s.cost}</button>`;
      }).join('')}</div>`;
    on('back', home);
    app.querySelectorAll('.sticker').forEach((b) => b.onclick = () => {
      const e = b.dataset.e, cost = +b.dataset.c;
      if (P.stickers.indexOf(e) < 0) {
        if (P.coins < cost) return;
        P.coins -= cost; P.stickers.push(e); sfx.win(); confetti(15);
        checkBadges(false, null).forEach((x) => toast(`${x.e} New badge: <b>${x.name}</b>`));
      }
      P.avatar = e; save(); shop();
    });
  }

  function badges() {
    leave();
    app.innerHTML = `
      <div class="qhead"><button class="icon" id="back" aria-label="Back">⬅</button><span>Badges</span><span class="chip">🏅 ${P.badges.length}/${BADGES.length}</span></div>
      <div class="badges">${BADGES.map((b) => {
        const has = P.badges.indexOf(b.id) >= 0;
        return `<div class="badgecard ${has ? 'has' : ''}"><span>${has ? b.e : '🔒'}</span><b>${b.name}</b><small>${b.desc}</small></div>`;
      }).join('')}</div>`;
    on('back', home);
  }

  /* ---------------- Grown-ups ---------------- */
  function settings() {
    leave();
    const a = Math.floor(Math.random() * 6) + 6, b = Math.floor(Math.random() * 6) + 6;
    app.innerHTML = `
      <div class="qhead"><button class="icon" id="back" aria-label="Back">⬅</button><span>Grown-ups</span><span></span></div>
      <form class="card" id="gate"><p>Grown-ups only: what is ${a} × ${b}?</p>
        <input id="ga" inputmode="numeric" autocomplete="off"><button class="btn">Open</button></form>`;
    on('back', home);
    $('gate').onsubmit = (e) => {
      e.preventDefault();
      if (+$('ga').value === a * b) settingsPanel(); else toast('Not quite!');
    };
  }
  function settingsPanel() {
    leave();
    const starsRow = Object.keys(MATH.AGES).filter((g) => P.bestStars[g]).map((g) => `Age ${g}: ${starsText(P.bestStars[g])}`).join(' · ') || 'No rounds yet';
    app.innerHTML = `
      <div class="qhead"><button class="icon" id="back" aria-label="Back">⬅</button><span>Grown-ups</span><span></span></div>
      <div class="card">
        <h3>${P.avatar} ${esc(P.name)} · age ${P.age}</h3>
        <p class="muted">${esc(MATH.AGES[P.age].topics)}</p>
        <button class="btn alt" id="edit">✏️ Edit name, age or buddy</button>
      </div>
      <div class="card">
        <label class="toggle"><input type="checkbox" id="relaxed" ${P.relaxed ? 'checked' : ''}> Relaxed mode: no timer, flat +25 bonus instead of the speed bonus</label>
        <label class="toggle"><input type="checkbox" id="sound" ${P.sound ? 'checked' : ''}> Sound effects</label>
        ${canSpeak ? `<label class="toggle"><input type="checkbox" id="readAloud" ${P.readAloud ? 'checked' : ''}> Read questions aloud automatically for ages 4–6 (the 🔊 button always works)</label>` : ''}
      </div>
      <div class="card">
        <h3>Progress</h3>
        <p>Right answers: ${P.right} · Rounds: ${P.rounds} · Best score: ${P.bestScore}</p>
        <p>Level ${level()} · Lifetime coins: ${P.lifetimeCoins}</p>
        <p>Best stars: ${starsRow}</p>
        <button class="btn" id="charts">📈 Accuracy &amp; speed charts</button>
        <p class="muted">Progress is stored only on this device. Nothing is sent anywhere.</p>
      </div>
      <div class="row">
        <button class="btn alt" id="switch">👥 Switch player</button>
        <button class="btn danger" id="del">🗑 Delete ${esc(P.name)}</button>
      </div>`;
    on('back', home);
    on('edit', () => profileForm(P));
    on('charts', () => progressScreen());
    on('switch', whoIsPlaying);
    $('relaxed').onchange = (e) => { P.relaxed = e.target.checked; save(); };
    $('sound').onchange = (e) => { P.sound = e.target.checked; save(); };
    const ra = $('readAloud'); if (ra) ra.onchange = (e) => { P.readAloud = e.target.checked; save(); };
    on('del', () => {
      if (!confirm(`Delete ${P.name} and all their coins, stickers and badges?`)) return;
      DB.profiles = DB.profiles.filter((p) => p !== P);
      useProfile(null); start();
    });
  }

  /* ---------------- Parent progress charts ----------------
     Two separate charts (accuracy %, seconds per question): different units, so never one dual-axis chart.
     Drawn as inline SVG so they work offline with no chart library. */
  const view = { pid: null, age: null, range: 30 };
  let redraw = null;
  let resizeT = null;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => redraw && redraw(), 150); });

  function fmtDate(t, withTime) {
    const d = new Date(t);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) +
      (withTime ? ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '');
  }
  const mean = (rows, f) => rows.reduce((s, h) => s + h[f], 0) / rows.length;

  // First rounds vs latest rounds in the current view.
  function compareTiles(rows) {
    if (rows.length < 2) return '<p class="muted">Play at least 2 rounds to compare.</p>';
    const k = rows.length >= 10 ? 5 : Math.floor(rows.length / 2);
    const a = rows.slice(0, k), b = rows.slice(-k);
    const a1 = mean(a, 'acc'), a2 = mean(b, 'acc'), s1 = mean(a, 'sec'), s2 = mean(b, 'sec');
    const dA = Math.round(a2 - a1), dS = Math.round((s2 - s1) * 10) / 10;
    const accTxt = Math.abs(dA) < 3 ? 'About the same' : dA > 0 ? `▲ ${dA} points better` : `▼ ${-dA} points lower`;
    const secTxt = Math.abs(dS) < 0.5 ? 'About the same' : dS < 0 ? `▲ ${-dS}s faster` : `▼ ${dS}s slower`;
    const lbl = k === 1 ? ['First round', 'Latest round'] : [`First ${k} rounds`, `Latest ${k} rounds`];
    return `<div class="tiles">
      <div class="tile"><span class="tl">Accuracy</span><b>${Math.round(a2)}%</b>
        <small>${lbl[0]}: ${Math.round(a1)}% → ${lbl[1].toLowerCase()}: ${Math.round(a2)}%</small><span class="delta">${accTxt}</span></div>
      <div class="tile"><span class="tl">Time per question</span><b>${s2.toFixed(1)}s</b>
        <small>${lbl[0]}: ${s1.toFixed(1)}s → ${lbl[1].toLowerCase()}: ${s2.toFixed(1)}s</small><span class="delta">${secTxt}</span></div>
    </div>`;
  }

  function niceMax(v) {
    const steps = [5, 10, 15, 20, 30, 40, 50, 60];
    return steps.find((s) => s >= v) || Math.ceil(v / 10) * 10;
  }

  function drawChart(el, rows, o) {
    const W = Math.max(260, el.clientWidth), H = 210, m = { l: 44, r: 48, t: 22, b: 30 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b, n = rows.length;
    const yMax = o.yMax || niceMax(Math.max(...rows.map(o.get)) * 1.1);
    const ticks = o.ticks || [0, yMax / 2, yMax];
    const x = (i) => m.l + (n === 1 ? iw / 2 : iw * i / (n - 1));
    const y = (v) => m.t + ih - ih * v / yMax;
    let s = '';
    ticks.forEach((t) => {
      s += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/>`;
      s += `<text class="axis" x="${m.l - 8}" y="${y(t) + 4}" text-anchor="end">${o.fmt(t)}</text>`;
    });
    // Age changes: questions get harder, so mark where they happen.
    rows.forEach((h, i) => {
      if (i && h.age !== rows[i - 1].age) {
        const xi = (x(i) + x(i - 1)) / 2;
        s += `<line class="agemark" x1="${xi}" x2="${xi}" y1="${m.t}" y2="${m.t + ih}"/>`;
        s += `<text class="axis" x="${xi + 4}" y="${m.t - 8}">Age ${h.age}</text>`;
      }
    });
    const pts = rows.map((h, i) => [x(i), y(o.get(h))]);
    if (n > 1) s += `<path class="line" d="M${pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L')}"/>`;
    // Markers only while they don't crowd the line; the hover dot still shows every round.
    if (n <= 15) pts.forEach((p) => { s += `<circle class="dot" cx="${p[0]}" cy="${p[1]}" r="4"/>`; });
    else s += `<circle class="dot" cx="${pts[n - 1][0]}" cy="${pts[n - 1][1]}" r="4"/>`;
    // Selective direct label: the latest value only.
    const lp = pts[n - 1];
    s += n === 1
      ? `<text class="vlabel" x="${lp[0]}" y="${lp[1] - 10}" text-anchor="middle">${o.fmt(o.get(rows[0]))}</text>`
      : `<text class="vlabel" x="${lp[0] + 8}" y="${lp[1] + 4}">${o.fmt(o.get(rows[n - 1]))}</text>`;
    s += `<text class="axis" x="${x(0)}" y="${H - 8}" text-anchor="${n === 1 ? 'middle' : 'start'}">${fmtDate(rows[0].t)}</text>`;
    if (n > 1) s += `<text class="axis" x="${x(n - 1)}" y="${H - 8}" text-anchor="end">${fmtDate(rows[n - 1].t)}</text>`;
    s += `<line class="cross" id="${el.id}-x" y1="${m.t}" y2="${m.t + ih}" visibility="hidden"/>`;
    s += `<circle class="dot hot" id="${el.id}-h" r="6" visibility="hidden"/>`;
    el.innerHTML = `<svg width="${W}" height="${H}" role="img" aria-label="${esc(o.title)}: latest ${esc(o.fmt(o.get(rows[n - 1])))} over ${n} rounds">${s}
      <rect x="${m.l - 10}" y="0" width="${iw + 20}" height="${H}" fill="transparent"/></svg><div class="tip" hidden></div>`;

    const svg = el.querySelector('svg'), tip = el.querySelector('.tip');
    const cross = $(el.id + '-x'), hot = $(el.id + '-h');
    const show = (e) => {
      const r = svg.getBoundingClientRect();
      const i = n === 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round((e.clientX - r.left - m.l) / iw * (n - 1))));
      const h = rows[i], p = pts[i];
      cross.setAttribute('x1', p[0]); cross.setAttribute('x2', p[0]); cross.setAttribute('visibility', 'visible');
      hot.setAttribute('cx', p[0]); hot.setAttribute('cy', p[1]); hot.setAttribute('visibility', 'visible');
      tip.innerHTML = `<b>${o.fmt(o.get(h))}</b> · round ${h.idx}<br>${fmtDate(h.t, true)}<br>Age ${h.age}: ${h.right}/${h.n} right (${h.acc}%)<br>${h.sec}s per question${h.relaxed ? ' · relaxed' : ''}`;
      tip.hidden = false;
      const tw = tip.offsetWidth;
      tip.style.left = Math.max(0, Math.min(W - tw, p[0] - tw / 2)) + 'px';
      tip.style.top = Math.max(0, p[1] - tip.offsetHeight - 14) + 'px';
    };
    const hide = () => { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); hot.setAttribute('visibility', 'hidden'); };
    svg.addEventListener('pointermove', show);
    svg.addEventListener('pointerdown', show);
    svg.addEventListener('pointerleave', hide);
  }

  function progressScreen() {
    leave();
    if (view.pid !== P.id) { view.pid = P.id; view.age = null; view.range = 30; }
    const all = P.history.map((h, i) => Object.assign({ idx: i + 1 }, h));
    const ages = [...new Set(all.map((h) => h.age))].sort((a, b) => a - b);
    // Default to the player's current age: mixing ages mixes difficulty.
    if (view.age !== 'all' && ages.indexOf(view.age) < 0) view.age = ages.indexOf(P.age) >= 0 ? P.age : (ages.length ? ages[ages.length - 1] : 'all');
    let rows = all.filter((h) => view.age === 'all' || h.age === view.age);
    if (view.range) rows = rows.slice(-view.range);

    const chip = (attr, val, label, active) => `<button class="fchip ${active ? 'on' : ''}" data-${attr}="${val}" aria-pressed="${active}">${label}</button>`;
    const filters = `<div class="filters">
      ${ages.length > 1 ? chip('fage', 'all', 'All ages', view.age === 'all') : ''}
      ${ages.map((a) => chip('fage', a, 'Age ' + a, view.age === a)).join('')}
      <span class="fsep"></span>
      ${[[10, 'Last 10'], [30, 'Last 30'], [0, 'All rounds']].map(([v, l]) => chip('frange', v, l, view.range === v)).join('')}
    </div>`;
    const table = `<details class="card"><summary>Show as table</summary><div class="tablewrap"><table>
      <thead><tr><th>#</th><th>Date</th><th>Age</th><th>Right</th><th>Accuracy</th><th>Sec / question</th><th>Stars</th></tr></thead>
      <tbody>${rows.slice().reverse().map((h) => `<tr><td>${h.idx}</td><td>${fmtDate(h.t, true)}</td><td>${h.age}</td><td>${h.right}/${h.n}</td><td>${h.acc}%</td><td>${h.sec}${h.relaxed ? ' (relaxed)' : ''}</td><td>${starsText(h.stars)}</td></tr>`).join('')}</tbody>
    </table></div></details>`;

    app.innerHTML = `
      <div class="qhead"><button class="icon" id="back" aria-label="Back">⬅</button><span>📈 ${esc(P.name)}'s progress</span><span></span></div>
      ${!all.length ? '<div class="card"><p>No finished rounds yet. Each finished round adds a point to the charts.</p></div>' : `
        ${filters}
        ${view.age === 'all' && ages.length > 1 ? '<p class="muted">Mixing ages: questions get harder at each new age, so a dip right after an age change is normal. Dashed lines mark the changes.</p>' : ''}
        ${compareTiles(rows)}
        <div class="card"><h3>Accuracy per round</h3><p class="muted">Share of questions answered right. Higher is better.</p><div class="chart" id="chA"></div></div>
        <div class="card"><h3>Time per question</h3><p class="muted">Average seconds per question, including wrong answers and time-outs. Lower is faster.</p><div class="chart" id="chS"></div></div>
        ${table}`}`;
    on('back', settingsPanel);
    app.querySelectorAll('[data-fage]').forEach((b) => b.onclick = () => { view.age = b.dataset.fage === 'all' ? 'all' : +b.dataset.fage; progressScreen(); });
    app.querySelectorAll('[data-frange]').forEach((b) => b.onclick = () => { view.range = +b.dataset.frange; progressScreen(); });
    if (!rows.length) return;
    redraw = () => {
      if (!$('chA')) { redraw = null; return; }
      drawChart($('chA'), rows, { title: 'Accuracy per round', get: (h) => h.acc, yMax: 100, ticks: [0, 50, 100], fmt: (v) => Math.round(v) + '%' });
      drawChart($('chS'), rows, { title: 'Time per question', get: (h) => h.sec, fmt: (v) => (Math.round(v * 10) / 10) + 's' });
    };
    redraw();
  }

  /* ---------------- Offline install ---------------- */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  start();
})();
