# UNFOLD

Ideas worth opening up. An interactive learning site for every guest-speaker session of the semester.

## Files

| File | What it holds |
|---|---|
| `index.html` | The page shell: header, navigation, footer. Open this to run the site. |
| `styles.css` | The look: brand colours, type, layout, phone vs laptop. |
| `sessions.js` | **All session content.** One entry per speaker, including each game. |
| `app.js` | The behaviour: page routing, the game engine, scoring, progress saving. |
| `artifact.html` | Same shell without the `<!doctype>` wrapper, used only for the Claude artifact preview. Safe to delete. |

No build step and no dependencies. It's plain HTML, CSS and JavaScript.

## Pages

`#home` · `#sessions` · `#s01` (learn) · `#s01-play` (BUILD MODE: SHIP IT mission) · `#s01-drill` (concept drill) · `#progress` · `#about`

### Look and feel notes

- **Homepage hero:** one `<canvas>` (`.hero__signal`) draws analogue interference behind the whole hero. A mask built from the measured text boxes keeps a calm zone behind the wordmark, tagline, body and buttons; the text itself is on a separate layer and is never touched. Pauses off-screen; one still frame under reduced motion.
- **Paper planes:** three folded notes (`planeStrip("p1" | "p2" | "p3")`): two on the homepage, one on the archive. Each unfolds into a sheet quoting a Session 01 takeaway word for word from `sessions.js`, with a link (read, play, drill). Enter/click opens, Escape or "Fold it back" closes.
- **BUILD MODE · Fold World:** the SHIP IT mission runs inside a CRT set in a pixel landscape: title screen (START / skip), a level map whose nodes are the four stages (free to visit in any order), a launchpad with one lamp per decision, pixel feedback (snap, glitch on a wrong move, stage-clear banners, unlocks) and a pixel launch. All sprites are drawn in `app.js` (the PIXEL KIT section); the pixel font is Silkscreen from Google Fonts with a monospace fallback.

## Add a new session

1. Open `sessions.js`.
2. Replace the placeholder (e.g. `{ id: "s02", number: "02", status: "upcoming", title: null }`) with a full entry using the same fields as Session 01: `title`, `host`, `event`, `dateLabel`, `topics`, `summary`, `objectives`, `takeaways`, `chapters`, `glossary` (optional), `achievements` (optional), `game`.
3. Set `status: "live"`.
4. To hold a slot for another future speaker, add `{ id: "s04", number: "04", status: "upcoming", title: null }`.

### BUILD MODE mission (optional per session)

A session can have a `mission`: `brief` (situation, objective, tools), `workflow` (steps in correct order, decoys with a `why`, `rules` explaining each order constraint), `incidents` (report, clues, system-state `nodes`, `actions` with one `correct` and a `result` each), `ship` (deploy log + one `final` decision), `decisions`, `recap`, `ratings`, `xpPerDecision`. The rating is the number of decisions solved first try. Every item takes a `source` slide.

### Concept drill

Each session's `game` is a list of `stages` (rounds). Each stage has `label`, `title`, `brief`, `points` (per challenge) and `challenges`. Pick the stages and mechanics that fit the session; nothing forces the same five rounds.

Challenge types:

- `mcq`: `prompt`, `options: [{id, text}]`, `answer` (option id)
- `spot`: `prompt`, `statements` (one is wrong), `wrong` (its index)
- `order`: `prompt`, `items` listed in the **correct** order (the game shuffles them)
- `match`: `prompt`, `categories`, `items: [{text, answer}]`

Every challenge also takes `concept` (a key in the session's `concepts`), `hint`, `explain` and `source` (the slide it comes from).

Achievements use `rule` types: `plays`, `pct` (best accuracy), `flag` (`noHints`, `perfect`, `stage:<stageId>`), `terms` (glossary cards opened).

## Scoring and XP

- A fully correct challenge answered without its hint gets a bonus (`game.bonus`, 25% for BUILD MODE).
- Accuracy ignores bonuses. Titles, mastered concepts and "pct" achievements use accuracy.
- XP = best mission score + best drill score in each session + 50 per unlocked achievement.

## Run locally

Open `index.html` in a browser, or ask Claude Code: "Serve this folder on localhost."

## Deploy

- **tiiny.host:** zip the folder with `index.html` at the top level and upload it.
- **GitHub + Vercel:** create a public repo, ask Claude Code to "Push this project to GitHub. Initialise a git repo, commit everything with a clear message, and push it to <repo URL>." Then on vercel.com: New Project → Import Git Repository → Deploy. Every later push updates the live site.

## Progress data

Scores and achievements are stored in the browser's localStorage under `unfold.progress.v2`. They stay on that device and browser only. Cross-device progress would need a backend such as Supabase.
