# Brain Bots

An offline math game for kids aged 4–10. Each child has a profile with their name and age, and the questions match that age. Right answers earn coins, and fast right answers earn more.

No internet, accounts, ads or tracking. Everything is saved only on the device, in `localStorage`.

## Play

- **Quickest:** open `index.html` in any browser. Everything runs from local files.
- **Install as an app (phone or tablet):** host the folder once on any HTTPS server (GitHub Pages works) or on `localhost`, open it, then choose *Add to Home Screen* or *Install*. A service worker (`sw.js`) caches every file, so after the first visit the app works with no connection.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Profiles

- **First launch:** a player is created with three steps: name, age (4–10) and a buddy avatar. Name and age are both required.
- **More than one child:** add more players from *Players / Switch player*. Each player has their own coins, stickers, badges, stars and settings.
- **Picking a player:** the last player is remembered. The *Who is playing?* screen shows each player's buddy, which lets young children find their own profile without reading.
- **Editing:** a player's name, age and buddy can be changed in the Grown-ups panel. Change the age on the child's birthday, because the app does not move it up by itself.

## Math by age

The player's age decides which questions they get.

| Age | Question types | Time per question | Questions per round |
|---|---|---|---|
| 4 | Count pictures (1–5), which group has more, what comes next, find the number said aloud | 45 s | 6 (3 choices each) |
| 5 | Count to 10 (rows of 5), add and take away with pictures, number before/after, which group has fewer | 40 s | 8 |
| 6 | Add/subtract within 20, make 10 / make 20, skip counting by 2, 5, 10, biggest/smallest, doubles | 30 s | 10 |
| 7 | 2-digit add/subtract, 2/5/10 times tables, halves, tens in a number, odd/even, word problems | 25 s | 10 |
| 8 | 3-digit add/subtract, tables 2–5, 8, 10, division, 1/2, 1/4, 3/4 of a number, ±10/100, missing numbers | 20 s | 10 |
| 9 | Tables to 12, division, 4-digit add/subtract, rounding to 10/100, fractions of amounts, × ÷ word problems | 20 s | 10 |
| 10 | 2-digit × 1- and 2-digit, 3-digit ÷ 1-digit, decimals, percentages, order of operations, equivalent fractions, square numbers | 25 s | 10 |

- **Adapts inside an age:** after 3 right answers in a row the harder variant of each question type is used (for example, at age 6 sums cross 10, at age 9 rounding goes to the nearest 100). One wrong answer drops back to the normal variant.
- **No repeats:** a question does not come up twice in the same round.
- **Wrong answers are believable:** the choices sit next to the right answer (±1, ±10, …). At age 10 the order-of-operations questions always include the answer you get by working left to right.
- **Explanations:** every answer is followed by a short explanation.
- **Young players:** ages 4–5 show pictures, and ages 4–6 hear the question, the explanation and the result read aloud with the device's built-in voice. The 🔊 button reads any question on demand. Most phones and tablets have these voices offline.

## Rewards

| Reward | How it is earned |
|---|---|
| Points | 100 for a right answer, plus a **speed bonus** of up to 100 that shrinks as the timer runs down. |
| Streak multiplier | ×1.5 from 3 right answers in a row, ×2 from 5 in a row. A wrong answer resets the streak, so fast guessing costs more than it earns. |
| Stars | 1–3 per round, based on accuracy. The best stars at the player's age show on the Play button. |
| Coins | Points ÷ 10, plus a star bonus, plus a one-off 100-coin *Age Master* bonus the first time a player gets 3 stars at an age. Spend coins on stickers in the shop; an owned sticker can be worn as the player's buddy. |
| XP and levels | Every point is XP. |
| Badges | 10 badges: First Round, Perfect, Lightning Brain, On Fire, Age Master, Hundred Club, Big Brain, Keep Going, Coin Collector, Sticker Fan. |

## Grown-ups panel

The panel sits behind a multiplication question so young players can't open it by accident. Settings are per player. In the panel you can:

- edit the player's name, age or buddy
- turn on **Relaxed mode**, which hides the timer and gives a flat +25 bonus instead of the speed bonus
- turn sound on or off
- turn automatic read-aloud on or off (it applies to ages 4–6)
- see progress: right answers, rounds, best score, best stars per age
- switch to another player or delete this one

## Files

```
index.html            app shell
css/style.css         styles (light and dark mode, phone-first)
js/math.js            math question generators for ages 4–10
js/app.js             profiles, game flow, scoring, rewards, storage
sw.js                 offline cache
manifest.webmanifest  install metadata
icon.svg              app icon
```

## Changing the math

Each age in `js/math.js` has a list of generator functions in `GEN[age]`. A generator receives `hard` (true while the player is on a streak) and returns:

```js
{ prompt: '7 × 8 = ?', answer: 56, fact: '7 × 8 = 56.' }
```

These fields are optional:

- `visual`: pictures, for example `[{ e: '🍎', n: 3 }, '+', { e: '🍎', n: 2 }]`; `cross: k` crosses out the last k pictures
- `options`: your own answer choices
- `step`: spacing of the wrong answers, for example `0.1` or `10`
- `min` / `max`: limits for the wrong answers
- `trap`: a common wrong answer that must appear among the choices

Time limits and round lengths per age are in `LIMIT` and `LEN`.

When you change files, bump `CACHE` in `sw.js` so installed copies update.
