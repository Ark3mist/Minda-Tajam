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
| ➗ Math | Unlimited generated questions: + − × ÷, missing numbers, fractions of a number, word problems. Difficulty grows with player level, and steps up during a round while the player is on a streak. |
| 🔬 Science | 30 multiple-choice questions with an explanation after each answer, plus 11 tap-to-place engineering puzzles (conductors, magnets, buoyancy, levers, pulleys, insulation, structures, light, sound, gears). |
| 📚 Words | 32 questions on spelling, synonyms, antonyms, plurals, past tense, parts of speech, punctuation, homophones and contractions. |
| 🎲 Mix | A round with all three subjects. |

Each round has 10 questions.

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
js/questions.js       question banks, math generator, engineering puzzles
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
