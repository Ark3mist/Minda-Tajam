/* Math engine: question generators for ages 4–10.
   Each age has its own set of question types. `hard` is switched on during a
   round when the child is on a streak, so difficulty adapts inside an age. */
(function () {
  'use strict';
  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const AGES = {
    4: { title: 'Counting to 5', topics: 'Count pictures, more or less, what comes next' },
    5: { title: 'Numbers to 10', topics: 'Count, add and take away with pictures' },
    6: { title: 'Numbers to 20', topics: 'Add, subtract, make 10, skip counting, doubles' },
    7: { title: 'Numbers to 100', topics: '2-digit sums, 2/5/10 times tables, halves, odd & even' },
    8: { title: 'Numbers to 1,000', topics: 'Times tables, division, simple fractions' },
    9: { title: 'Tables to 12', topics: 'Big sums, rounding, fractions of amounts' },
    10: { title: 'Big number skills', topics: 'Long ×, ÷, decimals, percentages, order of operations' }
  };
  // Seconds per question, and questions per round. Young children read slowly
  // (or are listening to the read-aloud), so they get more time and shorter rounds.
  const LIMIT = { 4: 45, 5: 40, 6: 30, 7: 25, 8: 20, 9: 20, 10: 25 };
  const LEN = { 4: 6, 5: 8, 6: 10, 7: 10, 8: 10, 9: 10, 10: 10 };

  const THINGS = [['🍎', 'apples'], ['⭐', 'stars'], ['🐟', 'fish'], ['🚗', 'cars'], ['🎈', 'balloons'],
    ['🐥', 'chicks'], ['🍪', 'cookies'], ['⚽', 'balls'], ['🌸', 'flowers'], ['🦋', 'butterflies']];
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const decimals = (step) => (String(step).split('.')[1] || '').length;
  const fmt = (n, d) => (d ? n.toFixed(d) : String(Math.round(n)));

  // Wrong answers close to the right one, because near-misses are the mistakes children actually make.
  function numOptions(ans, o) {
    const d = decimals(o.step);
    const set = new Set([fmt(ans, d)]);
    const ks = [1, -1, 2, -2, 3, -3, 5, -5, 10, -10];
    for (let guard = 0; set.size < o.n && guard < 300; guard++) {
      const v = ans + pick(ks) * o.step;
      if (v >= o.min && v <= o.max) set.add(fmt(v, d));
    }
    for (let v = ans + o.step; set.size < o.n; v += o.step) set.add(fmt(v, d));
    return shuffle([...set]);
  }

  // Distinct numbers, used for "which is biggest / even" questions.
  function distinct(count, lo, hi, test) {
    const s = new Set();
    for (let g = 0; s.size < count && g < 500; g++) { const v = rnd(lo, hi); if (!test || test(v)) s.add(v); }
    return [...s];
  }

  const GEN = {
    4: [
      (h) => { const t = pick(THINGS), n = rnd(1, h ? 7 : 5);
        return { prompt: `How many ${t[1]}?`, visual: [{ e: t[0], n }], answer: n, min: 1, max: h ? 9 : 6,
          fact: `Count them: ${range(1, n).join(', ')}. There are ${n}!` }; },
      (h) => { const t = pick(THINGS), max = h ? 7 : 5, a = rnd(1, max); let b = rnd(1, max); while (b === a) b = rnd(1, max);
        const A = t[0].repeat(a), B = t[0].repeat(b);
        return { prompt: `Which group has MORE ${t[1]}?`, options: shuffle([A, B]), answer: a > b ? A : B, bigOpts: true,
          fact: `${Math.max(a, b)} is more than ${Math.min(a, b)}.` }; },
      (h) => { const s = rnd(1, h ? 6 : 3);
        return { prompt: `What comes next? ${s}, ${s + 1}, ${s + 2}, ?`, answer: s + 3, min: 1, max: 10,
          fact: `Counting up: ${s}, ${s + 1}, ${s + 2}, ${s + 3}.` }; },
      (h) => { const n = rnd(1, h ? 10 : 5);
        return { prompt: `Find the number ${WORDS[n]}.`, answer: n, min: 1, max: h ? 10 : 6, fact: `${n} is ${WORDS[n]}.` }; }
    ],
    5: [
      (h) => { const t = pick(THINGS), n = rnd(h ? 6 : 3, 10);
        return { prompt: `How many ${t[1]}?`, visual: [{ e: t[0], n }], answer: n, min: 1, max: 12,
          fact: n > 5 ? `5 in the top row and ${n - 5} more makes ${n}.` : `Count them: ${range(1, n).join(', ')}.` }; },
      (h) => { const t = pick(THINGS), top = h ? 10 : 5, a = rnd(1, top - 1), b = rnd(1, top - a);
        return { prompt: `${a} + ${b} = ?`, visual: [{ e: t[0], n: a }, '+', { e: t[0], n: b }], answer: a + b, max: 12,
          fact: `${a} ${t[1]} and ${b} more makes ${a + b}.` }; },
      (h) => { const t = pick(THINGS), n = rnd(2, h ? 10 : 5), k = rnd(1, n - 1);
        return { prompt: `${n} − ${k} = ?`, visual: [{ e: t[0], n, cross: k }], answer: n - k, max: 10,
          fact: `Start with ${n}, take away ${k}, and ${n - k} ${n - k === 1 ? "is" : "are"} left.` }; },
      (h) => { const n = rnd(2, h ? 19 : 9), after = Math.random() < 0.5;
        return { prompt: `What number comes ${after ? 'after' : 'before'} ${n}?`, answer: after ? n + 1 : n - 1, min: 0, max: 21,
          fact: after ? `${n}, then ${n + 1}.` : `${n - 1} comes just before ${n}.` }; },
      (h) => { const t = pick(THINGS), a = rnd(1, 10); let b = rnd(1, 10); while (Math.abs(a - b) < (h ? 1 : 2)) b = rnd(1, 10);
        const A = t[0].repeat(a), B = t[0].repeat(b);
        return { prompt: `Which group has FEWER ${t[1]}?`, options: shuffle([A, B]), answer: a < b ? A : B, bigOpts: true,
          fact: `${Math.min(a, b)} is fewer than ${Math.max(a, b)}.` }; }
    ],
    6: [
      (h) => { let a, b;
        if (h) { a = rnd(5, 12); b = rnd(Math.max(1, 11 - a), Math.min(9, 20 - a)); } else { a = rnd(1, 9); b = rnd(1, 10 - a); }
        return { prompt: `${a} + ${b} = ?`, answer: a + b,
          fact: h && a < 10 ? `Make 10 first: ${a} + ${10 - a} = 10, then add ${b - (10 - a)} more = ${a + b}.` : `${a} + ${b} = ${a + b}.` }; },
      (h) => { const n = h ? rnd(11, 20) : rnd(5, 10), k = h ? rnd(2, 9) : rnd(1, n);
        return { prompt: `${n} − ${k} = ?`, answer: n - k, fact: `Count back ${k} from ${n} and you land on ${n - k}.` }; },
      (h) => { const target = h ? 20 : 10, k = rnd(1, target - 1);
        return { prompt: `? + ${k} = ${target}`, answer: target - k, fact: `${target - k} and ${k} make ${target}.` }; },
      (h) => { const st = pick(h ? [2, 5, 10] : [2, 10]), s = st * rnd(0, 3);
        return { prompt: `Count on: ${s}, ${s + st}, ${s + 2 * st}, ?`, answer: s + 3 * st,
          fact: `Jump ${st} each time: ${s + 2 * st} + ${st} = ${s + 3 * st}.` }; },
      (h) => { const nums = distinct(4, 1, 20), big = Math.random() < 0.5 || !h;
        const ans = big ? Math.max(...nums) : Math.min(...nums);
        return { prompt: `Which number is the ${big ? 'BIGGEST' : 'SMALLEST'}?`, options: shuffle(nums.map(String)), answer: ans,
          fact: `${ans} is the ${big ? 'biggest' : 'smallest'}.` }; },
      (h) => { const n = rnd(1, h ? 10 : 5);
        return { prompt: `Double ${n} = ?`, answer: 2 * n, fact: `Double means add it to itself: ${n} + ${n} = ${2 * n}.` }; }
    ],
    7: [
      (h) => { let a, b;
        if (h) { a = rnd(15, 60); b = rnd(15, 99 - a); }
        else { const ta = rnd(1, 7), oa = rnd(0, 8); a = ta * 10 + oa; b = rnd(0, 8 - ta) * 10 + rnd(1, 9 - oa); }
        return { prompt: `${a} + ${b} = ?`, answer: a + b,
          fact: `Tens: ${a - a % 10} + ${b - b % 10} = ${a - a % 10 + b - b % 10}. Ones: ${a % 10} + ${b % 10} = ${a % 10 + b % 10}. Total ${a + b}.` }; },
      (h) => { let a, b;
        if (h) { a = rnd(30, 99); b = rnd(11, a - 5); }
        else { const ta = rnd(2, 9), oa = rnd(1, 9); a = ta * 10 + oa; b = rnd(0, ta - 1) * 10 + rnd(0, oa); if (b === 0) b = 1; }
        return { prompt: `${a} − ${b} = ?`, answer: a - b, fact: `${a} − ${b} = ${a - b}. Check: ${a - b} + ${b} = ${a}.` }; },
      (h) => { const x = pick([2, 5, 10]), y = rnd(1, h ? 12 : 10);
        return { prompt: `${x} × ${y} = ?`, answer: x * y, fact: `${y} jumps of ${x}: ${x} × ${y} = ${x * y}.` }; },
      (h) => { const n = 2 * rnd(1, h ? 20 : 10);
        return { prompt: `Half of ${n} = ?`, answer: n / 2, fact: `Split ${n} into 2 equal parts: ${n / 2} and ${n / 2}.` }; },
      () => { const n = rnd(11, 99);
        return { prompt: `How many TENS are in ${n}?`, answer: Math.floor(n / 10), min: 0, max: 9,
          fact: `${n} is ${Math.floor(n / 10)} tens and ${n % 10} ones.` }; },
      (h) => { const top = h ? 99 : 20, even = 2 * rnd(1, Math.floor(top / 2)), odd = distinct(3, 1, top, (v) => v % 2 === 1);
        return { prompt: 'Which number is EVEN?', options: shuffle([even].concat(odd).map(String)), answer: even,
          fact: 'Even numbers end in 0, 2, 4, 6 or 8. They split into 2 equal groups.' }; },
      (h) => { const a = rnd(5, h ? 50 : 20), b = rnd(5, h ? 40 : 20);
        return { prompt: `You have ${a} stickers and get ${b} more. How many stickers now?`, answer: a + b, fact: `${a} + ${b} = ${a + b}.` }; }
    ],
    8: [
      (h) => { const a = rnd(100, h ? 699 : 499), b = h ? rnd(100, 999 - a) : rnd(10, 99);
        return { prompt: `${a} + ${b} = ?`, answer: a + b, fact: `Add hundreds, then tens, then ones: ${a} + ${b} = ${a + b}.` }; },
      (h) => { const a = rnd(200, 999), b = h ? rnd(100, a - 50) : rnd(10, 99);
        return { prompt: `${a} − ${b} = ?`, answer: a - b, fact: `${a} − ${b} = ${a - b}. Check: ${a - b} + ${b} = ${a}.` }; },
      (h) => { const x = pick(h ? [3, 4, 8] : [2, 3, 4, 5, 10]), y = rnd(2, 12);
        return { prompt: `${x} × ${y} = ?`, answer: x * y, fact: `${x} × ${y} = ${x * y}.` }; },
      (h) => { const d = pick(h ? [3, 4, 8] : [2, 5, 10]), q = rnd(2, 12);
        return { prompt: `${d * q} ÷ ${d} = ?`, answer: q, fact: `${d} × ${q} = ${d * q}, so ${d * q} ÷ ${d} = ${q}.` }; },
      (h) => { const d = pick(h ? [2, 3, 4, 5, 10] : [2, 4]), q = rnd(2, 10), num = h && d === 4 && Math.random() < 0.5 ? 3 : 1;
        return { prompt: `What is ${num}/${d} of ${q * d}?`, answer: num * q,
          fact: `${q * d} ÷ ${d} = ${q}${num > 1 ? `, then × ${num} = ${num * q}` : ''}.` }; },
      (h) => { const amt = pick([10, 100]), n = rnd(120, 880), up = Math.random() < 0.5 || !h;
        return { prompt: `${n} ${up ? '+' : '−'} ${amt} = ?`, answer: up ? n + amt : n - amt, step: amt,
          fact: `Only the ${amt === 10 ? 'tens' : 'hundreds'} digit changes: ${up ? n + amt : n - amt}.` }; },
      (h) => { const a = rnd(20, h ? 500 : 200), b = rnd(5, 99);
        return { prompt: `${a} + ? = ${a + b}`, answer: b, fact: `${a + b} − ${a} = ${b}.` }; },
      (h) => { const g = rnd(3, h ? 10 : 6), n = rnd(3, 10);
        return { prompt: `There are ${g} boxes with ${n} crayons in each. How many crayons in total?`, answer: g * n, fact: `${g} × ${n} = ${g * n}.` }; }
    ],
    9: [
      (h) => { const x = pick(h ? [6, 7, 8, 9, 11, 12] : [3, 4, 6, 7, 8, 9]), y = rnd(2, 12);
        return { prompt: `${x} × ${y} = ?`, answer: x * y, fact: `${x} × ${y} = ${x * y}.` }; },
      (h) => { const d = pick(h ? [6, 7, 8, 9, 11, 12] : [3, 4, 5, 6]), q = rnd(2, 12);
        return { prompt: `${d * q} ÷ ${d} = ?`, answer: q, fact: `${d} × ${q} = ${d * q}, so ${d * q} ÷ ${d} = ${q}.` }; },
      (h) => { const a = rnd(1000, 4999), b = h ? rnd(1000, 4999) : rnd(100, 999);
        return { prompt: `${a} + ${b} = ?`, answer: a + b, step: h ? 10 : 1, fact: `${a} + ${b} = ${a + b}.` }; },
      (h) => { const a = rnd(2000, 9999), b = h ? rnd(1000, a - 500) : rnd(100, 999);
        return { prompt: `${a} − ${b} = ?`, answer: a - b, step: h ? 10 : 1, fact: `${a} − ${b} = ${a - b}. Check by adding back.` }; },
      (h) => { const to = h ? 100 : 10, n = h ? rnd(101, 9999) : rnd(11, 999), ans = Math.round(n / to) * to;
        return { prompt: `Round ${n} to the nearest ${to}.`, answer: ans, step: to,
          fact: `Look at the ${to === 10 ? 'ones' : 'tens'} digit: 5 or more rounds up, 4 or less rounds down. So ${n} → ${ans}.` }; },
      (h) => { const d = pick([3, 4, 5, 8, 10]), num = h ? rnd(1, d - 1) : 1, q = rnd(2, 10);
        return { prompt: `What is ${num}/${d} of ${q * d}?`, answer: num * q,
          fact: `${q * d} ÷ ${d} = ${q}${num > 1 ? `, then × ${num} = ${num * q}` : ''}.` }; },
      (h) => { const a = rnd(6, 12), b = rnd(3, h ? 12 : 9);
        return { prompt: `A pack holds ${a} pencils. How many pencils are in ${b} packs?`, answer: a * b, fact: `${b} × ${a} = ${a * b}.` }; },
      (h) => { const k = rnd(3, 9), e = rnd(4, h ? 15 : 10);
        return { prompt: `${k * e} sweets are shared equally between ${k} friends. How many does each friend get?`, answer: e,
          fact: `${k * e} ÷ ${k} = ${e}.` }; }
    ],
    10: [
      (h) => { const a = h ? rnd(11, 30) : rnd(12, 99), b = h ? rnd(11, 20) : rnd(3, 9);
        return { prompt: `${a} × ${b} = ?`, answer: a * b, step: h ? 10 : 1,
          fact: `Split it: ${a} × ${b} = ${a - a % 10} × ${b} + ${a % 10} × ${b} = ${(a - a % 10) * b} + ${(a % 10) * b} = ${a * b}.` }; },
      (h) => { const d = rnd(3, 9), q = rnd(12, h ? 150 : 50);
        return { prompt: `${d * q} ÷ ${d} = ?`, answer: q, fact: `${d} × ${q} = ${d * q}, so the answer is ${q}.` }; },
      (h) => { const A = rnd(h ? 15 : 5, 95), B = h ? rnd(5, A - 1) : rnd(5, 95), add = !h || Math.random() < 0.3;
        const ans = add ? (A + B) / 10 : (A - B) / 10;
        return { prompt: `${(A / 10).toFixed(1)} ${add ? '+' : '−'} ${(B / 10).toFixed(1)} = ?`, answer: ans, step: 0.1,
          fact: `Line up the decimal points: ${(A / 10).toFixed(1)} ${add ? '+' : '−'} ${(B / 10).toFixed(1)} = ${ans.toFixed(1)}.` }; },
      (h) => { const p = pick(h ? [5, 20, 25, 75] : [10, 50]), base = 20 * rnd(1, 25), ans = base * p / 100;
        const tip = { 10: 'divide by 10', 50: 'halve it', 25: 'halve it twice', 75: 'find 25% and times by 3', 20: 'find 10% and double it', 5: 'find 10% and halve it' }[p];
        return { prompt: `What is ${p}% of ${base}?`, answer: ans, fact: `To find ${p}%, ${tip}: ${p}% of ${base} = ${ans}.` }; },
      (h) => { const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9);
        const right = h ? (a + b) * c : a + b * c, trap = h ? a + b * c : (a + b) * c;
        return { prompt: h ? `(${a} + ${b}) × ${c} = ?` : `${a} + ${b} × ${c} = ?`, answer: right, trap,
          fact: h ? `Brackets first: ${a} + ${b} = ${a + b}, then × ${c} = ${right}.` : `Multiply before you add: ${b} × ${c} = ${b * c}, then + ${a} = ${right}.` }; },
      (h) => { const d = pick([2, 3, 4, 5]), m = rnd(2, h ? 6 : 4), n = h ? rnd(1, d - 1) : 1;
        return { prompt: `${n}/${d} = ?/${d * m}`, answer: n * m, min: 1,
          fact: `The bottom was multiplied by ${m}, so multiply the top by ${m} too: ${n} × ${m} = ${n * m}.` }; },
      (h) => { const n = rnd(2, h ? 15 : 10);
        return { prompt: `${n}² = ?`, answer: n * n, fact: `${n}² means ${n} × ${n} = ${n * n}.` }; },
      (h) => { const a = rnd(3, 9), b = rnd(6, 12), c = rnd(5, a * b - 5);
        return { prompt: `A robot buys ${a} packs of ${b} bolts and uses ${c} of them. How many bolts are left?`, answer: a * b - c,
          fact: `${a} × ${b} = ${a * b}, then ${a * b} − ${c} = ${a * b - c}.` }; }
    ]
  };

  function make(age, hard) {
    age = Math.max(4, Math.min(10, age | 0));
    const r = pick(GEN[age])(!!hard);
    const step = r.step || 1, d = decimals(step);
    const answer = typeof r.answer === 'number' ? fmt(r.answer, d) : r.answer;
    let options = r.options;
    if (!options) {
      options = numOptions(r.answer, { step, n: age === 4 ? 3 : 4, min: r.min != null ? r.min : 0, max: r.max != null ? r.max : Infinity });
      // Put the classic mistake (e.g. wrong order of operations) among the choices.
      if (r.trap != null && options.indexOf(fmt(r.trap, d)) < 0 && fmt(r.trap, d) !== answer) {
        const i = options.findIndex((o) => o !== answer); options[i] = fmt(r.trap, d);
      }
    }
    return { subject: 'math', kind: 'mcq', prompt: r.prompt, visual: r.visual, bigOpts: r.bigOpts, answer, options, fact: r.fact, limit: LIMIT[age], age };
  }

  window.MATH = { AGES, LIMIT, LEN, make, pick, shuffle };
})();
