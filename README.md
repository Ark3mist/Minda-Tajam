# Brain Bots

An offline quiz game for kids aged 8–10. Players answer **math**, **science** and **language (English)** questions and earn rewards for answers that are right *and* fast.

No internet, accounts, ads or tracking. Progress is saved only on the device, in `localStorage`.

## Play

- **Quickest:** open `index.html` in any browser. Everything runs from local files.
- **Install as an app (phone or tablet):** host the folder once on any HTTPS server (GitHub Pages works) or on `localhost`, open it, then choose *Add to Home Screen* or *Install*. A service worker (`sw.js`) caches every file, so after the first visit the app works with no connection.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Game modes

| Mode | Content |
|---|---|
| ➗ Math | Ages 4–10, chosen by the player each time (see below). Unlimited generated questions. |
| 🔬 Science | 30 multiple-choice questions with an explanation after each answer, plus 11 tap-to-place engineering puzzles (conductors, magnets, buoyancy, levers, pulleys, insulation, structures, light, sound, gears). |
| 📚 Words | 32 questions on spelling, synonyms, antonyms, plurals, past tense, parts of speech, punctuation, homophones and contractions. |
| 🎲 Mix | A round with all three subjects. |

Each round has 10 questions (math: 6 at age 4, 8 at age 5).

## Math by age

Tapping **Math** opens an age picker. The player chooses any age from 4 to 10; the last choice is highlighted and each age shows the best stars earned there.

| Age | Question types | Time per question |
|---|---|---|
| 4 | Count pictures (1–5), which group has more, what comes next, find the number said aloud | 45 s |
| 5 | Count to 10 (rows of 5), add and take away with pictures, number before/after, which group has fewer | 40 s |
| 6 | Add/subtract within 20, make 10 / make 20, skip counting by 2, 5, 10, biggest/smallest, doubles | 30 s |
| 7 | 2-digit add/subtract, 2/5/10 times tables, halves, tens in a number, odd/even, word problems | 25 s |
| 8 | 3-digit add/subtract, tables 2–5, 8, 10, division, 1/2, 1/4, 3/4 of a number, ±10/100, missing numbers | 20 s |
| 9 | Tables to 12, division, 4-digit add/subtract, rounding to 10/100, fractions of amounts, × ÷ word problems | 20 s |
| 10 | 2-digit × 1- and 2-digit, 3-digit ÷ 1-digit, decimals, percentages, order of operations, equivalent fractions, square numbers | 25 s |

- **Adapts inside an age:** after 3 right answers in a row the harder variant of each question type is used (for example, at age 6 sums cross 10, at age 9 rounding goes to the nearest 100). One wrong answer drops back to the normal variant.
- **Wrong answers are believable:** the choices sit next to the right answer (±1, ±10, …). At age 10 the order-of-operations questions always include the answer you get by working left to right.
- **Young players:** ages 4–5 show pictures, and ages 4–6 read the question and the explanation aloud with the device's built-in voice. Age 4 gets 3 answer choices instead of 4. The 🔊 button reads any math question on demand. Read-aloud uses the device's own voices, which most phones and tablets have offline.
- **Moving up:** the first 3-star round at an age pays a one-off 100-coin bonus and offers "Try Age N+1". A round with 0–1 stars offers the age below.
- **Mix mode** uses the last chosen math age, but never below 8, because its science and word questions are written for ages 8–10.

## Rewards

| Reward | How it is earned |
|---|---|
| Points | 100 for a right answer, plus a **speed bonus** of up to 100 that shrinks as the timer runs down (20 s per question, 30 s per puzzle). |
| Streak multiplier | ×1.5 from 3 right answers in a row, ×2 from 5 in a row. A wrong answer resets the streak, so fast guessing costs more than it earns. |
| Stars | 1–3 per round, based on accuracy. |
| Coins | Points ÷ 10, plus a star bonus. Spend them on stickers in the shop; an owned sticker can be worn as the player's avatar. |
| XP and levels | Every point is XP. Higher levels unlock harder math. |
| Badges | 11 badges, for example Perfect round, Lightning Brain (5 answers in under 5 s), On Fire (5-answer streak), Engineer (all puzzles solved). |

## Grown-ups panel

The panel sits behind a multiplication question so young players can't open it by accident. In the panel you can:

- turn on **Relaxed mode**, which hides the timer and gives a flat +25 bonus instead of the speed bonus. Use it for children who get anxious under time pressure.
- turn sound on or off
- see answer counts per subject
- rename the player or reset all progress

## Files

```
index.html            app shell
css/style.css         styles (light and dark mode, phone-first)
js/questions.js       science and word question banks, engineering puzzles
js/math.js            math generators for ages 4–10
js/app.js             game logic, scoring, rewards, storage
sw.js                 offline cache
manifest.webmanifest  install metadata
icon.svg              app icon
```

## Adding questions

In `js/questions.js`, add an entry to `science` or `language`:

```js
{ q: 'Question?', a: 'Right answer', w: ['Wrong 1', 'Wrong 2', 'Wrong 3'], f: 'Short explanation shown after answering.' }
```

To add puzzles, use the `puzzles` schema: `drag_and_drop_slot` asks for one right item and `multi_select_tap` asks for all right items. Give any new item an emoji in `ITEM_EMOJI`.

When you change files, bump `CACHE` in `sw.js` so installed copies update.
