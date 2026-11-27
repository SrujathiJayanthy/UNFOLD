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

No build step, no dependencies, no server and no API keys. It's plain HTML, CSS and JavaScript.

## Pages

`#home` · `#sessions` · `#s01` (learn) · `#s01-play` (BUILD MODE: SHIP IT mission) · `#s01-drill` (concept drill) · `#s02` (learn) · `#s02-play` (AGENCY MODE: THE HANDOFF) · `#s02-drill` (concept drill) · `#s03` (learn) · `#s03-play` (FIELD MODE: THE DIG) · `#s03-drill` (concept drill) · `#progress` · `#about`

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

### AGENCY MODE simulation (optional per session)

Session 02 uses a second game type, THE HANDOFF: an agency simulator where the student is the Marketing Director. A session can have an `agency` block instead of a `mission`:

- `name`, `tagline`, `role`, `boot` (the lines of the opening AGENCY OS sequence), `brief` (`situation`, `objective`, `disclaimer`, `source`)
- `stations`: one desk each. Fields: `id`, `agent`, `team`, `code`, `persona`, `personality`, `does`, `input`, `output`, `memo`, `after` (the desks it takes input from) and `steps`
- each step is one of: `pick` (`options` with one `correct` and a `result` each; `cards: true` shows them as comparison cards with `art` and `meta`), `multi`, `match` and `order` (`items` in the **correct** order). Every step takes `prompt`, `concept`, `skill` and `source`.
- `simNote`, `draft`, `validated`, `reveal`, `recap`, `ratings` (the agency ranks), `xpPerDecision`

**How it plays.** A short boot sequence plays on the first visit only and can be skipped; under reduced motion it's shown complete at once. Then come the mission briefing and team roster, and then the pipeline: Brief Writer → Brief Validator → Strategist → you (the human checkpoint) → Designer and Copywriter in parallel → Reviewer. A desk unlocks only when every desk in its `after` list is complete, so the approval can't be skipped and the Reviewer waits for both production desks. Each desk shows Idle, Working, Needs revision, Awaiting approval or Complete, and is labelled Simulated or Human.

**Scoring.** Each desk is worth `xpPerDecision` (100), shared across its steps: the full share for a step right first time, half when it's right after a retry. Every step is tagged with one of six skills (`decision`, `gaps`, `improve`, `strategy`, `oversight`, `review`), and the end screen breaks XP down by desk and by skill. The rank comes from how many desks were right first time. Results are saved to `sessions.<id>.agency` (`plays`, `best` = best run XP, `bestFirst`, `runs`, `flags`); global XP uses the best run, never a sum of runs.

**The agency OS.** A dashboard shows role, client, campaign status, agency level with progress to the next level, and mission XP. An activity feed logs handoffs, decisions, revisions and unlocks. A wrong call marks the desk "Needs revision" until it's fixed. Every desk is laid out as 01 Task, 02 Received, 03 Output (labelled Simulated or Your desk) and 04 Your decisions. A `pick` step can carry an `output` (a simulated agent output or scenario, shown as a card) and a `revised` version, which appears once the student makes the right call.

**Saving.** An unfinished mission is saved inside the same progress key (`sessions.<id>.agencyRun`), so a refresh offers Resume or Start new. It's cleared at sign-off.

**The end** is a campaign folder (brief, validator feedback, Research & Strategy Foundation, approved Big Idea, messaging hierarchy, selected key visual, creative review, final status) with an agency credentials card, plus an archive of achievement cards and milestones.

**Pixel art** for the agents and the key visual sketches is drawn in code from small character maps (`AVATARS`, `KV_ART` in `app.js`), in the brand colours only. The KV images are sketches of the compositions, not the session's renders.

**Sound** is optional, off by default and never saved.

The code lives in the AGENCY MODE section of `app.js`; styles are scoped to `.game--agency`.

### FIELD MODE investigation (optional per session)

Session 03 uses a third game type, THE DIG. The student is a Field Investigator working an illustrative Sephora brief (Sephora is the session's own class-discussion example). A session can have a `field` block:

- `name`, `role`, `tagline`, `simNote`, `budget`, `currency`, `max` (1,000), `caseId`, `brief`, `objective`, `ranks` (five FIELD ranks with a `min` percentage), `recap`, `exhibits`
- `stages`: seven stages, each with `code`, `name`, `mechanic`, `intro` and `tasks`. Every task has `id`, `type`, `pts`, `cat` (score category), `h`, `ask`, and `well` / `improve` lines for the end-of-case feedback.
- Task types:
  - `sort`: drag cards into zones (`items` with accepted `zone` ids, per-item `pts`, `ok` / `bad` field notes; `zones`). `layout` picks the look and behaviour: `board` (case file, evidence tags), `stack` (one card at a time: the interrogation), `claims` (an AI report with an inspector: the AI trap), `matrix` (the customer quality 2×2).
  - `multi` (pick `need` options, partial credit on the first try), `pin` (a lifecycle timeline), `pick` (one answer).
  - `tools`: the research lab. Research `questions` with accepted `tools` and a `why` note for each wrong tool; a right tool collects an evidence card.
  - `slider`: the synthetic-respondent panel (10–20% guidance).
  - `builder`: the audience builder. Its model lives in `field.builder` (locations, platforms, ages, interests, behaviours, lifestyle); every control moves the estimate, the on-target share, the wasted spend, the dot landscape and the funnel, with warnings when the audience is too loose or too small.
  - `linkedin`: LinkedIn side brief on `field.linkedin` (location required, 300 to serve, 50,000+ recommended, as on the slides).
  - `alloc` (budget split on `field.invest`, live reach vs profit bars) and `roi` (the student types the ROI of their own split).

**Drag and drop.** Every draggable card has a tap/keyboard twin: tap the card, then tap the zone. Drag uses native HTML5 events, so it works with a mouse; on touch screens the tap route is the one that works.

**Scoring.** 1,000 XP across the seven stages (120 / 120 / 180 / 170 / 180 / 160 / 70). Right first time earns the full points, right after a retry half; multi-select keeps partial credit from the first try; the builder scores relevance and size at lock (wasted spend and a too-small audience cost points); the budget split scores by its ROI. The end screen shows XP by stage and by category (evidence, tool choice, critical thinking, audience, investment, recommendations), the wasted spend, a rank, what went well and what to work on, and the Audience Dossier (ten sections built from the run).

**Ranks.** Rookie Investigator 0+, Signal Seeker 500+, Audience Detective 700+, Field Strategist 850+, Master Planner 950+.

**Achievements** with `fieldFlag` unlock the moment the action happens (first evidence, a weak signal spotted first time, the tool matches, every unsupported AI claim caught, a sweet-spot audience, a strong split with the ROI right first time). `fieldPlays` and `fieldPct` unlock at the end.

**Saving.** Results go to `sessions.<id>.field` (`plays`, `best`, `bestPct`, `runs`, `flags`, `scale`); the last finished case is kept in `sessions.<id>.fieldLast` so the dossier can be reopened; an unfinished case is in `sessions.<id>.fieldRun` (version 2), so a refresh offers Resume. Runs saved by the first version of THE DIG (out of 700) are rescaled once to 1,000.

**Learn tab and landing.** A session with a `landing` block gets its own intro (tagline, three cards, Learn vs Play) in place of the takeaways/objectives panels, and its own closing line. Learn blocks with `special: "dig-…"` render small interactive widgets (lifecycle, strategy vs plan, tools, mining flow, AI proof, synthetic cap, LinkedIn sizer, quality matrix, ROI calculator).

**Sources.** Content follows the Session 03 teaching deck. It carries the title of Cindy Leong's LinkedIn guest session and her bio, and a GEO agenda line, but no slides for either talk, so neither is taught; the LinkedIn material is the audience-size guidance on the slides. Two investment principles named without detail ("Design to learn", "Long-term incrementality") are labelled as such. The lecturer is not named on the Session 03 pages.

The code lives in the FIELD MODE section of `app.js`; styles are scoped to `.game--field`, `.dig-*` and `[data-session="s03"]`.

**Sound (FIELD MODE only).** Short effects generated with the Web Audio API (no audio files, no libraries): a tap for options, bleeps for picks and right/wrong calls, a glitch stinger between stages, jingles for a filed stage, unlocked evidence and achievements, and a fanfare at the end. Nothing loops, nothing plays on load (the audio context is created on the first click inside FIELD MODE), and each effect stops the previous one. The Sound on/off control sits on the intro and in the HUD; the choice is stored in its own `localStorage` key, `unfold.fieldSound`, outside the progress save.

### Concept drill

Each session's `game` is a list of `stages` (rounds). Each stage has `label`, `title`, `brief`, `points` (per challenge) and `challenges`. Pick the stages and mechanics that fit the session; nothing forces the same five rounds.

Challenge types:

- `mcq`: `prompt`, `options: [{id, text}]`, `answer` (option id)
- `spot`: `prompt`, `statements` (one is wrong), `wrong` (its index)
- `order`: `prompt`, `items` listed in the **correct** order (the game shuffles them)
- `match`: `prompt`, `categories`, `items: [{text, answer}]`

Every challenge also takes `concept` (a key in the session's `concepts`), `hint`, `explain` and `source` (the slide it comes from).

Achievements use `rule` types: `plays`, `pct` (best accuracy), `flag` (`noHints`, `perfect`, `stage:<stageId>`), `terms` (glossary cards opened), `missionPlays` / `mission` (SHIP IT), `agencyPlays` / `agency` / `agencyFlag` (THE HANDOFF; `agencyFlag` is set by a right-first-time call at a given desk: `gaps`, `oversight`, `review`), `fieldPlays` / `fieldFlag` / `fieldPct` (THE DIG).

Once earned, an achievement stays earned: unlocked ids are kept in an `earned` list in the saved progress, so opening a new session never takes one away. Browsers that saved progress before this list existed are credited with what they had earned against the archive as it was then (Session 01 only).

### A simulation, not live AI

THE HANDOFF simulates the session's agentic marketing workflow. It is not six autonomous AI agents. Every agent output (the Brief Writer's draft, the validator's report and top fixes, the Strategist's foundation, the key visuals, the copy, the creative scores) is scripted in `sessions.js` from the session's material, and no AI or external API runs on the page. The briefs are `agency.draft` (the Marketing Brief Builder's draft, with gaps marked [to confirm]) and `agency.validated` (the session's top fixes applied). A `multi` step can show the draft (`doc: "draft"`) or a validator `report` above its options.

## Scoring and XP

- A fully correct challenge answered without its hint gets a bonus (`game.bonus`, 25% for BUILD MODE).
- Accuracy ignores bonuses. Titles, mastered concepts and "pct" achievements use accuracy.
- XP = best main-game score (SHIP IT mission, THE HANDOFF or THE DIG) + best drill score in each session + 50 per unlocked achievement.
- Levels are unchanged: Folded 0 · Creased 400 · Opening up 1,200 · Unfolding 2,400 · Wide open 3,200.

## Run locally

Open `index.html` in a browser. Everything works offline.

## Deploy

- **tiiny.host:** zip the folder with `index.html` at the top level and upload it.
- **GitHub + Vercel:** upload the files to a public GitHub repository (Add file → Upload files → Commit changes). On vercel.com: Add New → Project → Import the repository → Deploy. Every later commit to the repository updates the live site.

## Progress data

Scores and achievements are stored in the browser's localStorage under `unfold.progress.v2`. They stay on that device and browser only. Cross-device progress would need a backend such as Supabase.

## WHO AM I??

The last section of the homepage. Its content lives at the bottom of `sessions.js` in `window.UNFOLD_WHOAMI` (title, kicker, hello line, three folds, ID-card facts, LinkedIn URL, CTA label). Text written in [square brackets] renders as a marked placeholder: replace it with your own words and drop the brackets. Styles are scoped to `.who`.

