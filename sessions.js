/* ==========================================================================
   UNFOLD — Session registry
   --------------------------------------------------------------------------
   Every guest-speaker session lives in this one array. The app builds the
   home strip, archive, session pages, games and progress from it.

   TO ADD A SESSION: replace a placeholder below (or copy one) and fill in
   the fields used by Session 01. Set status to "live" when it is ready.
   Only use content from the speaker's own materials.
   ========================================================================== */

window.UNFOLD_SESSIONS = [
  {
    id: "s01",
    number: "01",
    status: "live",
    title: "Vibe Coding with LaunchLab",
    shortTitle: "Vibe Coding",
    host: "LaunchLab",
    event: "ESSEC × LaunchLab",
    dateLabel: "9 Oct",
    presenters: ["Yibo", "Nirvan", "Rishabh"],
    topics: ["Claude Design", "Claude Code", "GitHub", "Vercel", "Supabase"],
    summary:
      "A hands-on walkthrough of going from an idea to a live website with AI tools. Design the front end in Claude Design, hand it to Claude Code to build, store and share the code on GitHub, deploy it with Vercel, and add a backend with Supabase when the site needs to remember its users.",

    objectives: [
      "Explain the Design → Build → Deploy workflow and which tool handles each step.",
      "Write a structured prompt: role, goal, audience, pages, style, outputs and features.",
      "Use GitHub vocabulary correctly: repository, fork, clone, commit, push, pull request, merge.",
      "Connect a GitHub repository to Vercel so every push updates the live site.",
      "Recognise when a site needs a backend, and what Supabase provides."
    ],

    takeaways: [
      "Design first. Claude Design builds the visual shell of a site from a description, with no code.",
      "Find “Handoff to Claude Code…” in the Share menu before you start building. It is easy to miss.",
      "A commit saves a snapshot on your computer. Nothing reaches GitHub until you push.",
      "GitHub stores your code. Vercel turns it into a website and redeploys on every push.",
      "A front end on its own forgets users and only knows its own files. Logins and saved data need a backend such as Supabase."
    ],

    chapters: [
      {
        label: "Part 1",
        title: "Design, build, deploy",
        intro: "The whole workflow in three moves: make it look right, make it real, put it online.",
        blocks: [
          {
            h: "Design your front end first",
            p: "Claude Design lets you build the visual shell of your site. You describe how it should look and it lays out the pages, without any code."
          },
          {
            h: "The art of prompting",
            p: "Vague prompts get vague sites. The session contrasted two weak prompts with a structured one.",
            bad: [
              "Create a website for my course",
              "Create a modern website for my coding course with a homepage and lessons."
            ],
            items: [
              { t: "Role", d: "Who Claude should act as, e.g. an expert educational web designer and full-stack developer." },
              { t: "Goal", d: "What to build, named precisely: a responsive site for a 15-lesson course." },
              { t: "Target audience", d: "Who it is for, e.g. high-school and early-college students with little coding experience." },
              { t: "Core pages", d: "Each page and what it contains: landing, curriculum, lesson template, about, resources." },
              { t: "Design style", d: "The feel: modern, playful, light background, bold headings, friendly type." },
              { t: "Output required", d: "Folder structure, page code, a reusable template, and a short design rationale." },
              { t: "Key features", d: "Clean UI, clear call-to-action buttons, mobile-first, easy navigation." }
            ]
          },
          {
            h: "Export your design",
            p: "When the design is done, open the Share menu in the top right and choose “Handoff to Claude Code…”. It sends the finished design into Claude Code, which turns it into a working site. The same menu also offers a .zip download, PDF, PPTX, Send to Canva and standalone HTML.",
            note: "Locate the handoff button before you start building."
          },
          {
            h: "What is Claude Code?",
            p: "An agentic, terminal-based coding system. It reads entire codebases, runs shell commands and pipelines, and debugs failures, so builders can describe features in plain language.",
            items: [
              { t: "Routines", d: "Repeated background workflows in your project, e.g. “Check this folder for errors every hour.”" },
              { t: "Refactoring", d: "Reorganise code without changing what it does, e.g. “Rename this variable everywhere it appears.”" },
              { t: "Session context", d: "Keeps track of commands run, earlier errors, files changed and what you were trying to fix." }
            ]
          },
          {
            h: "What can you build?",
            p: "Apps, Chrome extensions, websites, trading algorithms and more. The session showed two examples: the Snapiq Chrome extension (snapiq.tools) and Doq, a competition finder for high-school students (doq.world)."
          },
          {
            h: "Deploy",
            p: "Launch the finished site on localhost, or upload it to tiiny.host. For tiiny.host, the session suggested this prompt for Claude Code:",
            prompt: "Put all my website files into one folder and zip it, with index.html at the top level, so I can upload it to tiiny.host."
          }
        ]
      },
      {
        label: "Part 2",
        title: "GitHub and Vercel",
        intro: "GitHub keeps your code and its history. Vercel turns that code into a public website.",
        blocks: [
          {
            h: "What GitHub does",
            items: [
              { t: "Store", d: "Keep all project files and their history in one place, called the repository." },
              { t: "Share", d: "Make your work public so anyone can see, use and learn from it." },
              { t: "Collaborate", d: "Work with friends or coworkers without overwriting each other's code." }
            ]
          },
          { h: "Key terms", special: "glossary", p: "Tap each card to unfold its meaning." },
          {
            h: "How it works",
            special: "twocopies",
            p: "There are two copies of your project: one on your computer and one on GitHub. Most Git actions just move your work between them."
          },
          {
            h: "Push vs pull request",
            items: [
              { t: "Push", d: "Uploads commits straight to the repo with no review. Use it when working solo or on your own branch." },
              { t: "Pull request", d: "Proposes changes for teammates to comment on, approve or reject before merging. Use it on a team or someone else's project." }
            ]
          },
          {
            h: "Vercel",
            p: "Similar to tiiny.host, but connected to GitHub. GitHub stores your code, and nothing there is a website yet. Vercel reads the repo, builds the site and hosts it at a public link.",
            items: [
              { t: "Connect", d: "Link your GitHub repo to Vercel once. From then on Vercel watches it." },
              { t: "Deploy", d: "Every push updates the live site in seconds. No manual uploading." },
              { t: "Preview", d: "Every pull request gets its own preview link so the team can check changes before merging." }
            ]
          },
          {
            h: "Step 1: get your code into GitHub",
            ordered: true,
            items: [
              { t: "Make a repo", d: "Sign in to github.com, click New repository, name it, keep it Public, click Create." },
              { t: "Let Claude Code push it", d: "Copy the repo URL and give Claude Code the prompt below. It runs the git commands for you." },
              { t: "Check it worked", d: "Refresh the repo page. Your files should be there: your first commit and push." }
            ],
            prompt: "Push this project to GitHub. Initialise a git repo, commit everything with a clear message, and push it to <paste your repo URL>.",
            note: "Using Lovable instead? Open your project, then Settings → GitHub → Connect. Lovable creates the repo and keeps it in sync, so skip to Step 2."
          },
          {
            h: "Step 2: connect to Vercel",
            ordered: true,
            items: [
              { t: "Sign in with GitHub", d: "Go to vercel.com and sign up with your GitHub account so Vercel can see your repos." },
              { t: "Import your repo", d: "New Project → Import Git Repository → pick the repo from Step 1. Authorise Vercel when GitHub asks." },
              { t: "Deploy", d: "Vercel detects your setup. Click Deploy and you get a live public link." }
            ]
          },
          {
            h: "Claude → GitHub",
            p: "To let Claude work in a repository directly: connect your GitHub account, install the Claude GitHub App on GitHub, then select the repository to work in."
          },
          {
            h: "File types to remember",
            items: [
              { t: "index.html", d: "The words and structure: every heading, button and paragraph people read." },
              { t: "styles.css", d: "The look: colours, fonts, spacing, and how it changes on a phone versus a laptop." },
              { t: "script.js", d: "The behaviour: what happens when somebody clicks, types or hits submit." }
            ]
          }
        ]
      },
      {
        label: "Part 3",
        title: "When your site needs a backend",
        intro: "A front end alone has two blind spots. A backend fixes both.",
        blocks: [
          {
            h: "Two things your site still can't do",
            items: [
              { t: "It forgets everyone", d: "Build a Wordle clone and close the tab: it has no idea who you were. It can't keep track of users or saved games." },
              { t: "It knows only its own files", d: "It can't show anything live, like the weather. It only displays what you typed into the code." }
            ]
          },
          {
            h: "How logging in works",
            items: [
              { t: "Sign up", d: "Creates a new row in the user table with your email and a scrambled version of your password." },
              { t: "Log in", d: "Checks your email and password against the user table. If they match, your browser gets a token." },
              { t: "Log out", d: "Throws the token away, so the site stops recognising you until you log in again." },
              { t: "Token", d: "A temporary sticker that says “this is James”. Your browser shows it on every request, and it expires on its own." }
            ],
            note: "All three actions send a request to another computer and get an answer back. Logging in is just an API call."
          },
          {
            h: "Supabase",
            p: "An open-source backend-as-a-service platform for authentication, verification and a database for your users. It connects closely with GitHub and Vercel, installs automatically in Lovable, and shows usage statistics for your project."
          },
          {
            h: "The session's task",
            p: "Create a website with a tab for each guest-speaker session this semester, where each tab can be an interactive game that consolidates what you learned. Use the tools from the session to build it. UNFOLD is one answer to that brief."
          }
        ]
      }
    ],

    glossary: [
      { term: "Fork", def: "Make your own copy of someone else's repo on your GitHub account, so you can change it without affecting the original." },
      { term: "Clone", def: "Copy a repo from GitHub down onto your computer so you can edit the files locally." },
      { term: "Commit", def: "Save a snapshot of your changes with a short note. It saves locally, not on GitHub." },
      { term: "Push", def: "Send the commits saved on your computer up to GitHub, so the online copy is up to date." },
      { term: "Pull request", def: "Propose your changes and ask teammates to review them before they join the main project." },
      { term: "Merge", def: "Approve a pull request's changes and combine them into the main version of the project." }
    ],

    /* Visual identity for this session inside the UNFOLD system */
    theme: { motif: "pixels", primary: "cobalt", secondary: "pink", label: "Build blocks" },
    /* Editorial cover type: big condensed lines + an italic serif line */
    cover: { lines: ["Vibe", "Coding"], sub: "with LaunchLab" },

    /* Concepts the game measures. "chapter" = which Learn chapter to revisit. */
    concepts: {
      workflow: { name: "Design → Build → Deploy", chapter: 0 },
      prompting: { name: "Structured prompting", chapter: 0 },
      handoff: { name: "Handoff to Claude Code", chapter: 0 },
      files: { name: "HTML, CSS and JS roles", chapter: 1 },
      github: { name: "What GitHub stores", chapter: 1 },
      git: { name: "Commit, push, PR, merge", chapter: 1 },
      vercel: { name: "Deploying with Vercel", chapter: 1 },
      backend: { name: "Frontend limits & backend", chapter: 2 },
      auth: { name: "How logging in works", chapter: 2 }
    },

    /* Rule types: plays · pct · flag (set by the game engine) · terms */
    achievements: [
      { id: "s01-first-commit", name: "First commit", desc: "Finish the concept drill once.", rule: { type: "plays", min: 1 } },
      { id: "s01-deployed", name: "Deployed", desc: "Reach 80% accuracy in a concept drill run.", rule: { type: "pct", min: 80 } },
      { id: "s01-bug-hunter", name: "Bug hunter", desc: "Get every Debug Your Thinking drill challenge fully right in one run.", rule: { type: "flag", flag: "stage:debug" } },
      { id: "s01-no-hints", name: "No peeking", desc: "Finish a drill run without opening a single hint.", rule: { type: "flag", flag: "noHints" } },
      { id: "s01-clean-merge", name: "Clean merge", desc: "Get every drill challenge fully right in one run.", rule: { type: "flag", flag: "perfect" } },
      { id: "s01-commit-often", name: "Commit often", desc: "Play the concept drill three times.", rule: { type: "plays", min: 3 } },
      { id: "s01-glossary", name: "Fully unfolded", desc: "Open every GitHub term card in the Learn tab.", rule: { type: "terms" } },
      { id: "s01-shipped", name: "Shipped", desc: "Complete the SHIP IT mission.", rule: { type: "missionPlays", min: 1 } },
      { id: "s01-clean-ship", name: "Clean ship", desc: "Make every SHIP IT decision right first time.", rule: { type: "mission", min: 4 } }
    ],

    /* BUILD MODE is the section; SHIP IT is its main game; the drill is the original 18 challenges */
    mode: "BUILD MODE",

    /* ------------------------------------------------------------------
       SHIP IT — a four-stage mission. Every step, clue and outcome below
       comes from the session deck; "source" names the slide.
       ------------------------------------------------------------------ */
    mission: {
      name: "SHIP IT",
      tagline: "A four-stage mission from idea to a live site. About four minutes.",
      brief: {
        situation: "The session ended with a task: build a website with a tab for each guest-speaker session, each with a game. You have the idea. Nothing is designed, built or online yet.",
        objective: "Take the site from idea to a live link that updates on every push.",
        tools: [
          { name: "Claude Design", role: "Lays out how the site looks, without code" },
          { name: "Claude Code", role: "Builds the files and runs the git commands" },
          { name: "GitHub", role: "Stores your code and its history" },
          { name: "Vercel", role: "Builds the site from your repo and hosts it" },
          { name: "Supabase", role: "Sign-up, login and a database for users" }
        ],
        source: "Task · Part 1 Summary · Intro to Vercel · Supabase"
      },
      workflow: {
        prompt: "Build the pipeline. Pick the five steps that take the site live, in order.",
        steps: [
          { id: "design", text: "Describe the look in Claude Design" },
          { id: "handoff", text: "Share menu → “Handoff to Claude Code…”" },
          { id: "build", text: "Claude Code builds the site files" },
          { id: "push", text: "Push the project to a public GitHub repo" },
          { id: "deploy", text: "Import the repo in Vercel and click Deploy" }
        ],
        decoys: [
          { id: "pptx", text: "Export the design as PPTX", why: "PPTX is for slides. The bridge from Claude Design to Claude Code is “Handoff to Claude Code…” in the Share menu." },
          { id: "commit", text: "Commit on your laptop and stop", why: "A commit only saves a snapshot on your computer. Nothing reaches GitHub, or Vercel, until you push." },
          { id: "zip", text: "Upload a fresh zip to Vercel after every change", why: "Once Vercel watches your GitHub repo, every push rebuilds the live site. You never upload manually." }
        ],
        /* rules[k] explains why step k must come before step k+1 */
        rules: [
          "The handoff sends a finished design, so the design comes first.",
          "Claude Code builds from the design it receives in the handoff.",
          "You can only push files that exist. Claude Code builds them, then pushes.",
          "Vercel imports a GitHub repository, so the code has to be on GitHub before you deploy."
        ],
        success: "Design, hand off, build, push, deploy. From here, every push to GitHub updates the live site automatically.",
        source: "Part 1 Summary · Export Your Design · Step 1 · Step 2"
      },
      incidents: [
        {
          id: "push", concept: "git", title: "The live site didn't change",
          report: "A teammate edited the homepage heading, committed it and said it was done. The live site still shows the old heading.",
          clues: [
            { id: "laptop", label: "Teammate's laptop", lines: ["$ git log --oneline -2", "a41f2c  Update homepage heading", "9be013  Initial site", "", "$ git status", "Your branch is ahead of 'origin/main' by {ahead} commit{s}."] },
            { id: "github", label: "GitHub repo", lines: ["main · latest commit", "9be013  Initial site"] },
            { id: "vercel", label: "Vercel", lines: ["Production · Ready", "Built from main @ 9be013"] }
          ],
          nodes: [
            { label: "Laptop", before: "a41f2c · ahead by {ahead}", after: "a41f2c · in sync" },
            { label: "GitHub", before: "9be013 Initial site", after: "a41f2c Update homepage heading" },
            { label: "Vercel", before: "Built from 9be013", after: "Rebuilt from a41f2c" },
            { label: "Live site", before: "Old heading", after: "New heading" }
          ],
          actions: [
            { id: "push", text: "Push the commit to GitHub", correct: true, result: "Pushed. GitHub now has a41f2c, Vercel saw the new commit and rebuilt the live site. The new heading is up." },
            { id: "commit", text: "Commit again", effect: "ahead", result: "Another snapshot saved on the laptop. It's now further ahead of GitHub, and the live site still hasn't changed. Commits stay local until you push." },
            { id: "upload", text: "Upload the files to Vercel by hand", result: "Vercel builds from the GitHub repo, and the repo still doesn't have the commit. Connecting Vercel to GitHub is what replaces manual uploads." },
            { id: "newproj", text: "Create a new Vercel project", result: "A new project would import the same GitHub repo, which still has the old heading. The commit has to reach GitHub first." }
          ],
          explain: "A commit saves a snapshot on your computer. Push sends it to GitHub, and Vercel rebuilds the live site on every push.",
          source: "Key Terms · How It Works · Intro to Vercel"
        },
        {
          id: "memory", concept: "backend", title: "Players lose their scores",
          report: "The site has a game now. Players say their scores disappear when they close the tab, and they want to sign in to keep them.",
          clues: [
            { id: "code", label: "script.js", lines: ["let score = 0;", "function addPoints(n) {", "  score += n;", "}", "// nothing is saved anywhere"] },
            { id: "files", label: "Project files", lines: ["index.html", "styles.css", "script.js", "", "No backend connected."] },
            { id: "note", label: "From the session", lines: ["Your site forgets everyone:", "close the tab and it has no idea who you were.", "It can't keep track of users or saved games."] }
          ],
          nodes: [
            { label: "Browser", before: "score lost on close", after: "shows a token on each request" },
            { label: "Front end", before: "HTML · CSS · JS only", after: "HTML · CSS · JS" },
            { label: "Backend", before: "none", after: "Supabase: auth + database" },
            { label: "User table", before: "—", after: "email · scrambled password" }
          ],
          actions: [
            { id: "supabase", text: "Add a backend: Supabase for sign-up, login and a user database", correct: true, result: "Connected. Signing up now adds a row to the user table with an email and a scrambled password. Logging in hands the browser a token, so the site knows who's playing." },
            { id: "css", text: "Keep the score in styles.css", result: "styles.css controls the look: colours, fonts, spacing. It can't remember anything about a player." },
            { id: "redeploy", text: "Redeploy on Vercel", result: "Redeploying publishes the same front-end files. The site still forgets everyone when the tab closes, because nothing stores their data." },
            { id: "html", text: "Write the score into index.html", result: "index.html holds the words and structure people read. It doesn't save anything when a player closes the tab." }
          ],
          explain: "A front end on its own forgets everyone. Keeping users and their data needs a backend, such as Supabase for authentication and a database.",
          source: "Two Things Your Site Still Can't Do · How Logging In Works · Supabase"
        }
      ],
      ship: {
        intro: "Everything is fixed on your laptop. Push to main and watch the pipeline you built carry it live.",
        nodes: ["Laptop", "GitHub", "Vercel", "Live"],
        log: [
          { node: 0, text: "git push → origin main" },
          { node: 1, text: "GitHub · main updated" },
          { node: 2, text: "Vercel · new push detected, building" },
          { node: 2, text: "Vercel · build ready" },
          { node: 3, text: "Live · public link updated" }
        ],
        final: {
          id: "pr", concept: "vercel",
          prompt: "It's live. A classmate opens a pull request that restyles the homepage. How does the team check it before merging?",
          options: [
            { id: "preview", text: "Open the pull request's Vercel preview link", correct: true, result: "Every pull request gets its own preview link, so the team sees the change before it's merged into the live site." },
            { id: "merge", text: "Merge it, then check the live site", result: "That puts an unreviewed change straight onto the live site. A pull request is there so teammates can review first, and Vercel gives each one a preview link." },
            { id: "zip", text: "Ask them to send a zip of their files", result: "The change already lives in the pull request on GitHub, and Vercel builds a preview link for it. Nothing needs to be sent around." }
          ],
          source: "Push vs Pull Request · Intro to Vercel"
        }
      },
      decisions: [
        { id: "workflow", label: "Pipeline built", concepts: ["workflow", "handoff"] },
        { id: "push", label: "Live site out of date", concepts: ["git"] },
        { id: "memory", label: "Players lose their scores", concepts: ["backend"] },
        { id: "pr", label: "Checked before merging", concepts: ["vercel"] }
      ],
      recap: [
        { concept: "workflow", title: "Design → hand off → build → push → deploy", text: "Claude Design sets the look, the Share menu hands it to Claude Code, Claude Code builds and pushes, Vercel deploys from GitHub." },
        { concept: "git", title: "Commit saves. Push publishes.", text: "A commit is a snapshot on your computer. Push sends it to GitHub, where Vercel can see it." },
        { concept: "backend", title: "Remembering people needs a backend", text: "A front end forgets everyone when the tab closes. Supabase adds sign-up, login with a token and a user database." },
        { concept: "vercel", title: "Preview before you merge", text: "Vercel rebuilds on every push and gives every pull request its own preview link." }
      ],
      ratings: [
        { min: 4, name: "Shipped clean", line: "Every decision right first time." },
        { min: 3, name: "Shipped", line: "One decision needed a second look." },
        { min: 2, name: "Shipped with fixes", line: "Two decisions needed another try. The explanations are what stick." },
        { min: 0, name: "Shipped the hard way", line: "Most decisions took a retry. Run it again and it'll feel obvious." }
      ],
      xpPerDecision: 125
    },

    game: {
      name: "CONCEPT DRILL",
      tagline: "Eighteen quick challenges in five rounds. Each round is harder and worth more.",
      bonus: 0.25, /* +25% on a fully correct challenge answered without a hint */
      titles: [
        { min: 95, name: "Ship-it legend" },
        { min: 80, name: "Deployed" },
        { min: 60, name: "Pushed, not merged" },
        { min: 40, name: "Committed locally" },
        { min: 0, name: "Still in design" }
      ],
      stages: [
        {
          id: "warmup",
          label: "Round 01",
          title: "Warm up",
          brief: "Three quick ones to load the basics.",
          points: 50,
          challenges: [
            {
              type: "mcq", concept: "workflow",
              prompt: "You want to see how your site should look before any code exists. Which tool comes first?",
              options: [
                { id: "a", text: "Claude Design" },
                { id: "b", text: "GitHub" },
                { id: "c", text: "Vercel" },
                { id: "d", text: "Supabase" }
              ],
              answer: "a",
              hint: "The workflow has three moves. The first one is about how the site looks.",
              explain: "Design comes first. Claude Design builds the visual shell from your description, with no code.",
              source: "Part 1 Summary"
            },
            {
              type: "mcq", concept: "files",
              prompt: "You want your main button to be orange. Which file do you open?",
              options: [
                { id: "a", text: "index.html" },
                { id: "b", text: "styles.css" },
                { id: "c", text: "script.js" },
                { id: "d", text: "README.md" }
              ],
              answer: "b",
              hint: "One file holds the words, one the look, one the behaviour. Colour is part of the look.",
              explain: "styles.css controls the look: colours, fonts, spacing and how layouts change on a phone.",
              source: "Some File Types To Remember"
            },
            {
              type: "mcq", concept: "github",
              prompt: "On GitHub, what is a repository?",
              options: [
                { id: "a", text: "The live public website" },
                { id: "b", text: "The place that keeps all your project files and their history" },
                { id: "c", text: "A list of your teammates" },
                { id: "d", text: "The login table for your users" }
              ],
              answer: "b",
              hint: "Look at GitHub's first job: Store.",
              explain: "A repository holds every project file and its history in one location. It isn't a website on its own.",
              source: "What is GitHub"
            }
          ]
        },
        {
          id: "call",
          label: "Round 02",
          title: "Make the call",
          brief: "Real situations. Pick the best next step.",
          points: 100,
          challenges: [
            {
              type: "mcq", concept: "handoff",
              prompt: "Your design in Claude Design is finished. What's the next move to turn it into a working site?",
              options: [
                { id: "a", text: "Export as PDF and send it to a developer" },
                { id: "b", text: "Open the Share menu and choose “Handoff to Claude Code…”" },
                { id: "c", text: "Send to Canva and rebuild it there" },
                { id: "d", text: "Create a Vercel project from the design link" }
              ],
              answer: "b",
              hint: "The session called one export option “the bridge” between two tools.",
              explain: "“Handoff to Claude Code…” in the Share menu sends the finished design into Claude Code, which builds the real site.",
              source: "Export Your Design"
            },
            {
              type: "mcq", concept: "prompting",
              prompt: "You're about to prompt for a course website. Which prompt should you send?",
              options: [
                { id: "a", text: "“Create a website for my course”" },
                { id: "b", text: "“Create a modern website for my coding course with a homepage and lessons.”" },
                { id: "c", text: "A prompt that sets the role, goal, audience, core pages, design style, outputs and key features" },
                { id: "d", text: "The shortest prompt possible, then fix everything afterwards" }
              ],
              answer: "c",
              hint: "The session labelled two of these as bad prompting.",
              explain: "Both short prompts were shown as bad examples. The strong prompt spelled out role, goal, target audience, core pages, design style, required outputs and key features.",
              source: "The Art of Prompting"
            },
            {
              type: "mcq", concept: "git",
              prompt: "You're on a team of three. You want teammates to check your changes before they reach the main project. What do you do?",
              options: [
                { id: "a", text: "Push straight to main" },
                { id: "b", text: "Open a pull request" },
                { id: "c", text: "Clone the repo again" },
                { id: "d", text: "Fork your own repo" }
              ],
              answer: "b",
              hint: "One option is a direct action with no review. The other is a request.",
              explain: "A pull request lets teammates comment, suggest edits and approve or reject before anything is merged. A push skips review.",
              source: "Push vs Pull Request"
            },
            {
              type: "mcq", concept: "workflow",
              prompt: "Your site is built and you want it on tiiny.host. What do you ask Claude Code to do?",
              options: [
                { id: "a", text: "Put the files in one folder and zip it, with index.html at the top level" },
                { id: "b", text: "Open a pull request on tiiny.host" },
                { id: "c", text: "Convert the site to a PPTX" },
                { id: "d", text: "Delete script.js to make the upload smaller" }
              ],
              answer: "a",
              hint: "tiiny.host takes an upload. Which file does a host open first?",
              explain: "The session's prompt: zip all the website files in one folder with index.html at the top level, then upload the zip to tiiny.host.",
              source: "Part 1 Summary"
            }
          ]
        },
        {
          id: "debug",
          label: "Round 03",
          title: "Debug your thinking",
          brief: "Someone got something wrong. Find it.",
          points: 150,
          challenges: [
            {
              type: "spot", concept: "git",
              prompt: "A teammate wrote these Git notes. Which one is wrong?",
              statements: [
                "Clone copies a repo from GitHub down onto your computer.",
                "A commit uploads your changes to GitHub.",
                "A fork is your own copy of someone else's repo on your GitHub account.",
                "Merge combines approved pull request changes into the main project."
              ],
              wrong: 1,
              hint: "Ask where each action happens: on your computer, or on GitHub.",
              explain: "A commit saves a snapshot on your computer only. Push is what sends commits up to GitHub.",
              source: "Key Terms"
            },
            {
              type: "mcq", concept: "vercel",
              prompt: "“We pushed our code to GitHub, so our website is live now.” What's the mistake?",
              options: [
                { id: "a", text: "Nothing. Pushing to GitHub publishes the website." },
                { id: "b", text: "GitHub stores code. Something like Vercel has to build and host it at a public link." },
                { id: "c", text: "They should have committed instead of pushing" },
                { id: "d", text: "Websites can only go live from Lovable" }
              ],
              answer: "b",
              hint: "Look at the session's slide on the difference between GitHub and Vercel.",
              explain: "GitHub stores every file and version, but nothing there is a website yet. Vercel reads the repo, builds the site and hosts it.",
              source: "Intro to Vercel"
            },
            {
              type: "spot", concept: "backend",
              prompt: "Here's a plan for a Wordle clone with logins. Which line won't work?",
              statements: [
                "Logging in sends a request to another computer and gets an answer back.",
                "Supabase can handle authentication and a database for our users.",
                "We'll keep players' streaks in script.js so they survive closing the tab.",
                "Logging out throws the token away."
              ],
              wrong: 2,
              hint: "What did the session say a front end does when you close the tab?",
              explain: "A front end forgets everyone once the tab closes. Saved streaks need a backend database, such as Supabase.",
              source: "Two Things Your Site Still Can't Do"
            },
            {
              type: "spot", concept: "vercel",
              prompt: "Which of these claims about Vercel is wrong?",
              statements: [
                "You sign in to Vercel with GitHub so it can see your repos.",
                "Every pull request gets its own preview link.",
                "After connecting, you upload a new zip every time you change the site.",
                "Vercel auto-detects your setup when you click Deploy."
              ],
              wrong: 2,
              hint: "The session had a bold line about uploading after Step 2.",
              explain: "Once connected, every push to GitHub rebuilds the live site automatically. You never upload anything manually again.",
              source: "Step 2: Connect To Vercel"
            }
          ]
        },
        {
          id: "flow",
          label: "Round 04",
          title: "Build the flow",
          brief: "Put the steps in the right order. Each correct position scores.",
          points: 150,
          challenges: [
            {
              type: "order", concept: "workflow",
              prompt: "From idea to a live site on tiiny.host.",
              items: [
                "Describe the look in Claude Design",
                "Choose “Handoff to Claude Code…”",
                "Claude Code builds the site files",
                "Zip the files with index.html at the top level",
                "Upload the zip to tiiny.host"
              ],
              hint: "Design → Build → Deploy. The zip only makes sense once the files exist.",
              explain: "Design in Claude Design, hand off, let Claude Code build, then zip with index.html at the top and upload.",
              source: "Part 1 Summary"
            },
            {
              type: "order", concept: "git",
              prompt: "Contributing a change to a team repo.",
              items: [
                "Clone the repo to your computer",
                "Edit the files locally",
                "Commit a snapshot with a short note",
                "Push your commits up to GitHub",
                "Open a pull request for review",
                "Merge the approved changes into main"
              ],
              hint: "Commits happen on your computer, review happens on GitHub.",
              explain: "Clone down, edit, commit locally, push up, then a pull request gets reviewed and merged.",
              source: "How It Works · Key Terms"
            },
            {
              type: "order", concept: "auth",
              prompt: "The life of a login.",
              items: [
                "Sign up creates a row with your email and a scrambled password",
                "Log in checks your email and password against the user table",
                "Your browser receives a token",
                "Your browser shows the token on every request",
                "Log out throws the token away"
              ],
              hint: "A token can only be shown after it's been handed over.",
              explain: "Sign up writes the row, log in verifies it and hands over a token, the token is shown on each request, and logging out discards it.",
              source: "How Logging In Works"
            }
          ]
        },
        {
          id: "ship",
          label: "Final round",
          title: "Ship it",
          brief: "Your team is shipping a site where students sign up and keep their scores. Use everything.",
          points: 200,
          challenges: [
            {
              type: "match", concept: "workflow",
              prompt: "Give each job to the right tool.",
              categories: ["Claude Design", "Claude Code", "GitHub", "Vercel", "Supabase"],
              items: [
                { text: "Lay out how the pages look, without code", answer: "Claude Design" },
                { text: "Turn the design into working files and run the git commands", answer: "Claude Code" },
                { text: "Store every file and version for the team", answer: "GitHub" },
                { text: "Host the site at a public link that updates on every push", answer: "Vercel" },
                { text: "Let students sign up and keep their scores", answer: "Supabase" }
              ],
              hint: "One tool per job. Work out the two you're sure of first.",
              explain: "Claude Design for the look, Claude Code to build and push, GitHub to store, Vercel to host, Supabase for accounts and data.",
              source: "Parts 1–3"
            },
            {
              type: "match", concept: "backend",
              prompt: "Which part of the site handles each of these?",
              categories: ["Front end files", "Backend"],
              items: [
                { text: "Heading and button text", answer: "Front end files" },
                { text: "Colours and the phone layout", answer: "Front end files" },
                { text: "What happens when a button is clicked", answer: "Front end files" },
                { text: "A user table with emails and scrambled passwords", answer: "Backend" },
                { text: "Remembering a student after they close the tab", answer: "Backend" }
              ],
              hint: "Ask whether it needs to survive after the tab closes, or live on another computer.",
              explain: "HTML, CSS and JS handle words, look and behaviour. Anything about stored users or remembering people needs a backend.",
              source: "File Types · Two Things Your Site Still Can't Do"
            },
            {
              type: "order", concept: "vercel",
              prompt: "Ship it: from finished build to live link.",
              items: [
                "Create a new public repository on github.com",
                "Ask Claude Code to initialise, commit and push to the repo URL",
                "Refresh the repo page to check the files arrived",
                "Sign in to vercel.com with GitHub",
                "New Project → Import Git Repository",
                "Click Deploy and get a live public link"
              ],
              hint: "Step 1 is all GitHub. Step 2 is all Vercel.",
              explain: "Make the repo, push, check it worked. Then sign in to Vercel with GitHub, import the repo and deploy.",
              source: "Step 1 · Step 2"
            },
            {
              type: "mcq", concept: "vercel",
              prompt: "The site is live. A classmate opens a pull request that changes the colours. How does the team see it before merging?",
              options: [
                { id: "a", text: "Merge it and check the live site" },
                { id: "b", text: "Open the pull request's own Vercel preview link" },
                { id: "c", text: "Download the repo as a PDF" },
                { id: "d", text: "There's no way to see it before merging" }
              ],
              answer: "b",
              hint: "Vercel's third job, after Connect and Deploy.",
              explain: "Every pull request gets its own preview link, so the team can see changes before merging them.",
              source: "Intro to Vercel"
            }
          ]
        }
      ]
    }
  },

  /* ------------------------------------------------------------------------
     SESSION 02 — Building an AI Marketing Team (Nick Goh, 30 Oct)
     Source: the presentation deck only. "source" fields name the deck section
     the content comes from. The Terra case is the deck's fictional scenario.
     ------------------------------------------------------------------------ */
  {
    id: "s02",
    number: "02",
    status: "live",
    title: "Building an AI Marketing Team",
    shortTitle: "AI Marketing Team",
    host: "Yellow Pages",
    event: "ESSEC MMD × Yellow Pages",
    dateLabel: "30 Oct",
    presenters: ["Nick Goh"],
    topics: ["Agentic workflow", "Claude Projects & Skills", "Brief to Big Idea", "Key visuals", "Creative review"],
    summary:
      "A lite agentic workflow with Claude. Six specialised agents pass the work along a handoff chain, from Brief Writer to Reviewer, with you approving the strategy in the middle. The session ran one fictional luxury handbag launch, Terra, through the whole chain: brief, validation, strategy, messaging, key visuals and creative scoring.",

    objectives: [
      "Name the six steps of the handoff chain and what each agent produces.",
      "Explain why the Brief Validator works in a fresh chat.",
      "Tell apart the three layers of the Terra Big Idea: stance, visual territory and proof pillar.",
      "Decide what the Marketing Director approves and saves before production starts.",
      "Split the production work correctly between the Designer / Art Director and the Copywriter.",
      "Review creative work against the brief, the Big Idea and brand voice, catching placeholders and unverified claims."
    ],

    takeaways: [
      "Split the work into specialised agents: a planning team (Brief Writer, Brief Validator, Strategist) and a production team (Designer / Art Director, Copywriter, Reviewer).",
      "Each agent does one job and hands one output to the next: draft brief, verdict and top fixes, Big Idea one-pager, approved strategy, KVs and channel copy, edits and sign-off.",
      "Validate the brief in a new chat, with fresh eyes, before anything is created.",
      "You stay in the chain: approve the strategy and save it to the knowledge base before production starts.",
      "Agents shouldn't invent. Missing inputs are marked [to confirm], unproven claims [to verify], and a hypothesis stays labelled as a hypothesis.",
      "Score the creative against the brief and the Big Idea, then act on the one change that lifts the work most."
    ],

    chapters: [
      {
        label: "Part 1",
        title: "The planning team",
        intro: "Three agents turn a request into a strategy. Each one has a single job and a single output.",
        blocks: [
          {
            h: "Who does what",
            ordered: true,
            items: [
              { t: "Brief Writer", d: "Drafts the brief from Project context. Needs goal, audience, budget and timing. Output: a draft brief." },
              { t: "Brief Validator", d: "Critiques the brief in a fresh chat. Checks objective, audience, message and metric. Output: a verdict and top fixes." },
              { t: "Strategist", d: "Digests the validated brief and develops the Big Idea. Output: a Big Idea one-pager." }
            ]
          },
          {
            h: "New chat, fresh eyes",
            p: "The Brief Validator doesn't work in the chat that wrote the brief. It critiques the draft in a fresh chat, and the Strategist only starts once the brief is validated."
          },
          {
            h: "The speaker",
            items: [
              { t: "Nick Goh", d: "CEO, INSPIRO Consulting. CMO, Yellow Pages Singapore, and Marketing Lead, YP Academy." },
              { t: "Background", d: "Agency leadership across Lowe & Partners, Euro RSCG (now Havas) and local agencies. Focus: brand strategy, consumer behaviour, digital marketing and AI solutions." }
            ]
          }
        ]
      },
      {
        label: "Part 2",
        title: "The production team and the handoff chain",
        intro: "Three more agents make and check the work. Then the whole team runs as one chain of six handoffs, with you in the middle.",
        blocks: [
          {
            h: "The production team",
            items: [
              { t: "Designer / Art Director", d: "Creates the key visuals (KVs). Uses connectors, for example Higgsfield. Output: KV concepts and assets." },
              { t: "Copywriter", d: "Builds the messaging hierarchy and adapts it per channel and platform. Output: channel-by-channel copy." },
              { t: "Reviewer", d: "Checks work against brand voice and confirms it delivers the brief and the Big Idea. Output: edits and sign-off." }
            ]
          },
          {
            h: "The handoff chain",
            ordered: true,
            items: [
              { t: "Brief Writer", d: "Drafts the brief." },
              { t: "Brief Validator", d: "New chat, fresh eyes." },
              { t: "Strategist", d: "Digests the brief, shapes the Big Idea." },
              { t: "You", d: "Approve and save to the knowledge base." },
              { t: "Designer + Copywriter", d: "KVs via Higgsfield, plus channel messaging." },
              { t: "Reviewer", d: "Checks brand voice." }
            ]
          },
          {
            h: "Why step 4 is you",
            p: "The chain has one human step, and it sits between strategy and production. You approve the strategy and save it to the knowledge base, which is what the production agents then work from."
          },
          { h: "Key terms", special: "glossary" }
        ]
      },
      {
        label: "Part 3",
        title: "Setting it up in Claude",
        intro: "The team lives in one Claude Project, with saved Skills for the jobs in the chain. A scheduled task can start the chain from an email.",
        blocks: [
          {
            h: "Inside the Project",
            items: [
              { t: "Instructions", d: "How the Project should behave." },
              { t: "Context", d: "The documents the agents work from: 28 files in the session's Project, including the brief and the brand guide and campaign research." },
              { t: "Memory and Scheduled", d: "What the Project remembers, and tasks that run on a timetable." }
            ]
          },
          {
            h: "The Skills shown",
            items: [
              { t: "Marketing Brief Builder", d: "Drafts a structured marketing brief from objectives, audience and Project context." },
              { t: "Brief validator", d: "Scores a brief against a checklist that includes objective, audience, message and channels." },
              { t: "Researcher Strategist", d: "Researches a brand or product to find differentiation and key selling points." },
              { t: "Messaging Hierarchy Builder", d: "Builds the messaging hierarchy: core promise, supporting messages and proof points." },
              { t: "KV Concept Builder", d: "Turns the approved brief and Big Idea into several key visual concepts." },
              { t: "Creative Review Scorer", d: "Scores creative work against the approved brief." },
              { t: "Governance Compliance Check", d: "Checks content against the Singapore Code of Advertising Practice." }
            ]
          },
          {
            h: "The email trigger",
            p: "A scheduled task runs the Marketing Brief Builder every day. It finds the latest email labelled “Marketing Brief”, drafts the brief from it and saves the draft to the Project. In the session, the thread also held an older email with a different brief; Claude used the latest one and said so."
          },
          {
            h: "Marking, not inventing",
            p: "Anything the email didn't state, such as the budget split and exact dates, was marked [to confirm] rather than invented. The draft ended with 11 open questions, and the next step was the Brief Validator in a fresh chat."
          },
          {
            h: "The toolkit",
            items: [
              { t: "Claude", d: "The Project, the Skills and the agents." },
              { t: "ChatGPT", d: "Also listed in the session's AI marketing team toolkit." },
              { t: "Higgsfield / Cinema Studio", d: "Image and video generation, reached as a connector." }
            ]
          }
        ]
      },
      {
        label: "Part 4",
        title: "The Terra case, step by step",
        intro: "The session ran one campaign through the chain: a Singapore social media launch for Terra, a fictional luxury handbag.",
        blocks: [
          {
            h: "Fictional scenario",
            note: "From the deck's own disclaimer: this is a fictional marketing scenario developed for educational and training purposes. Louis Vuitton Terra, its specifications and campaign details are invented and are not affiliated with or endorsed by Louis Vuitton."
          },
          {
            h: "1 · The brief",
            items: [
              { t: "Project", d: "Social media campaign for the launch of Terra, a women's luxury handbag. Primary market: Singapore." },
              { t: "Numbers in the brief", d: "Proposed launch September 2027. Three months. Indicative budget S$300,000. Retail price S$5,800. An initial allocation of 1,000 bags." },
              { t: "The challenge", d: "Create awareness, desirability and consideration for Terra while establishing its environmental credentials without compromising luxury positioning." },
              { t: "A rule in the brief", d: "The environmental credentials are hypothetical. All environmental claims must be substantiated before any advertising is published." }
            ]
          },
          {
            h: "2 · The validation fixes",
            items: [
              { t: "Success metrics", d: "Each metric gets a definition, data source, baseline slot and tracking method." },
              { t: "Objectives", d: "Consideration (boutique enquiries) becomes the primary objective, with the rest supporting." },
              { t: "Channels and message", d: "Two platforms, Instagram and TikTok, each tied to an objective. The message becomes one desirability-led sentence." },
              { t: "A flag", d: "The 1M reach target looked too high for Singapore's affluent, targetable audience, so it was flagged for restating as a share of the audience." }
            ]
          },
          {
            h: "3 · Research and strategy",
            p: "The Research & Strategy Foundation's hidden motivation truth is marked as a hypothesis: “She does not want a sustainable bag; she wants a bag she never has to justify.” Terra's green claims are listed as unverified."
          },
          {
            h: "The Big Idea, in three layers",
            items: [
              { t: "Nothing to Explain", d: "Stance (the idea). Object first: confidence, restraint, no defensive green headline." },
              { t: "The Art of Renewal", d: "Visual territory (how it looks). Material transformation shown as a striking final object." },
              { t: "Made to Be Kept", d: "Proof pillar (why believe it). Longevity and care as the luxury argument." }
            ]
          },
          {
            h: "4 · The messaging hierarchy",
            items: [
              { t: "Core promise", d: "Terra is a Louis Vuitton handbag so beautifully made that you never have to explain it, with considered materials you can quietly stand behind." },
              { t: "Supporting messages", d: "“Is this really Louis Vuitton?” · “What is it made of, and can I trust that?” · “Why this bag, and will it last?”" },
              { t: "Call to action", d: "“Book an appointment to see Terra.” The alternative is “Discover Terra”." }
            ]
          },
          {
            h: "5 · The key visual concepts",
            items: [
              { t: "Held", d: "Nothing to Explain, weeks 1–3. Quiet tailoring, the bag held by its handle against a cream studio backdrop. No caption and no material claim." },
              { t: "Reassembled", d: "The Art of Renewal, weeks 4–6 and TikTok. Panels drift and resolve into the finished bag. The most shareable, but the riskiest on claims and the most expensive to produce." },
              { t: "Years", d: "Made to Be Kept, weeks 7–12. The same bag at three moments in one Singapore day, ending on the appointment call to action." }
            ]
          },
          {
            h: "Why Held went forward",
            p: "It carries no unverified material claim, so it can be approved fastest and costs the least. In the session, Claude also declined to put a real brand ambassador's face, or a real product photo, into the generated images: the person hadn't agreed to Terra, and the images could be taken for a real advertisement."
          },
          {
            h: "6 · The creative score",
            items: [
              { t: "Instagram Story, 5.7/10", d: "Follows the hierarchy: object first, then craft, then a soft invitation. Weakness: the desert setting works against the research." },
              { t: "Instagram post, 4.3/10", d: "Restrained caption with no environmental claim. Weaknesses: a generic image, and placeholders still in the caption." },
              { t: "The one change", d: "Move away from the desert scene and use the Held concept, so the idea is visible in the picture rather than only in the headline." },
              { t: "This scored higher", d: "A hand on the clasp, the moment just before she opens the bag: 6.7/10." }
            ]
          },
          {
            h: "The session's question",
            p: "The deck closed this section by asking: what does this tell you?"
          }
        ]
      }
    ],

    glossary: [
      { term: "Agentic workflow", def: "Specialised AI agents that each do one job and hand their output to the next, as in the six-step handoff chain." },
      { term: "Brief", def: "The document the team works from. The Brief Writer needs goal, audience, budget and timing to draft it." },
      { term: "Big Idea", def: "The Strategist's output, developed from the validated brief and written up as a one-pager." },
      { term: "Key visual (KV)", def: "A lead image concept for the campaign. The Designer / Art Director creates KV concepts and assets." },
      { term: "Messaging hierarchy", def: "The Copywriter's structure: a core promise, supporting messages and a call to action, adapted per channel and platform." },
      { term: "Knowledge base", def: "The files saved in the Claude Project that later agents work from. Step 4 is approving the strategy and saving it there." },
      { term: "Skill", def: "A saved set of instructions Claude runs on request, such as the Marketing Brief Builder or the Creative Review Scorer." },
      { term: "Connector", def: "A link from Claude to another tool. The Designer uses connectors such as Higgsfield to make visuals." },
      { term: "Scheduled task", def: "A task Claude runs on a timetable. Here, the Marketing Brief Builder runs daily on the latest “Marketing Brief” email." },
      { term: "Simulated, not automated", note: true, def: "The agents represent specialised roles in an AI marketing workflow. Their outputs are scripted for this learning experience, allowing you to focus on delegation, creative judgement and human oversight." }
    ],

    theme: { motif: "agency", primary: "pink", secondary: "mint", label: "Handoff chain" },
    cover: { lines: ["AI", "Team"], sub: "for marketing, with Nick Goh" },

    /* Concepts the games measure. "chapter" = which Learn chapter to revisit. */
    concepts: {
      chain: { name: "The six-step handoff chain", chapter: 1 },
      planning: { name: "What the Brief Writer needs", chapter: 0 },
      validation: { name: "Fresh-chat validation", chapter: 0 },
      bigidea: { name: "Big Idea: stance, territory, proof", chapter: 3 },
      approval: { name: "Approve and save to the knowledge base", chapter: 1 },
      production: { name: "Designer and Copywriter roles", chapter: 1 },
      review: { name: "Reviewing against brief and Big Idea", chapter: 3 },
      setup: { name: "Projects, Skills and triggers", chapter: 2 },
      claims: { name: "[to confirm], [to verify] and hypotheses", chapter: 3 }
    },

    achievements: [
      { id: "s02-first-handoff", name: "Final Sign-off", desc: "Sign off the Terra campaign in THE HANDOFF.", rule: { type: "agencyPlays", min: 1 } },
      { id: "s02-signed-off", name: "Signed off clean", desc: "Make every THE HANDOFF decision right first time.", rule: { type: "agency", min: 7 } },
      { id: "s02-gap-spotter", name: "Brief Architect", desc: "Spot every [to confirm] gap in the Brief Writer's draft on your first try.", rule: { type: "agencyFlag", flag: "gaps" } },
      { id: "s02-quality-controller", name: "Quality Controller", desc: "Run the Brief Validator's desk right first time, unsupported claim included.", rule: { type: "agencyFlag", flag: "validator" } },
      { id: "s02-big-idea", name: "Big Idea Thinker", desc: "Run the Strategist's desk right first time, and turn down the off-brand idea.", rule: { type: "agencyFlag", flag: "strategy" } },
      { id: "s02-human-loop", name: "Human in the Loop", desc: "Approve, save and route the strategy right first time at your desk.", rule: { type: "agencyFlag", flag: "oversight" } },
      { id: "s02-creative-director", name: "Creative Director", desc: "Run both production desks right first time: KVs and copy.", rule: { type: "agencyFlag", flag: "production" } },
      { id: "s02-quality-gate", name: "Quality gate", desc: "Catch all three blocking issues in creative review on your first try.", rule: { type: "agencyFlag", flag: "review" } },
      { id: "s02-drilled", name: "Briefed", desc: "Finish the Session 02 concept drill once.", rule: { type: "plays", min: 1 } },
      { id: "s02-sharp", name: "Fresh eyes", desc: "Reach 80% accuracy in a Session 02 drill run.", rule: { type: "pct", min: 80 } },
      { id: "s02-no-hints", name: "No brief needed", desc: "Finish a Session 02 drill run without opening a hint.", rule: { type: "flag", flag: "noHints" } },
      { id: "s02-glossary", name: "Knowledge base", desc: "Open every Session 02 term card in the Learn tab.", rule: { type: "terms" } }
    ],

    mode: "AGENCY MODE",

    /* THE HANDOFF: the main game. One station per handoff step; each station is
       one director decision made of one to three steps. A decision counts as
       right first time only if every step in it is answered correctly on the
       first try. Step types: pick · multi · match · order. */
    agency: {
      name: "THE HANDOFF",
      tagline: "Six agents, one human, one campaign. You're the Marketing Director. About eight minutes.",
      simNote: "This is a simulation of the session's agentic marketing workflow, not six autonomous AI agents. Every agent output is scripted from the session's material, and no AI runs on this page.",
      boot: ["AGENCY OS 2.6 · initialising", "Opening the Claude Project · 28 files in context", "Six agents online: Architect, Critic, Thinker, Visualist, Wordsmith, Gatekeeper", "TERRA CAMPAIGN DETECTED", "MARKETING DIRECTOR ACCESS GRANTED"],
      role: "Marketing Director",
      brief: {
        situation: "A brief has landed: the Singapore social media launch of Terra, a luxury handbag. Your AI marketing team is set up in a Claude Project, one agent per job. Every output passes through your hands on its way down the chain.",
        objective: "Get the campaign from email to signed-off creative, making the right call at every handoff.",
        disclaimer: "Terra is the session's fictional scenario, developed for educational and training purposes. Its specifications and campaign details are invented and are not affiliated with or endorsed by Louis Vuitton.",
        source: "The handoff chain · The Email Trigger"
      },
      stations: [
        {
          id: "writer", agent: "Brief Writer", team: "Planning", after: [],
          code: "01", persona: "The Architect", style: "A structured brief, with every gap marked [to confirm].", input: "The latest email labelled “Marketing Brief”, plus Project context",
          personality: "Builds structure out of whatever the client sends. Never fills a gap with a guess.",
          does: "Drafts the brief from Project context, using the Marketing Brief Builder skill.", output: "Draft brief",
          memo: "In the session, a scheduled task ran the Marketing Brief Builder on the latest email labelled “Marketing Brief”. Its draft is on your desk.",
          steps: [
            {
              type: "multi", concept: "planning", skill: "decision",
              prompt: "Which four inputs does the Brief Writer need?",
              options: [
                { id: "goal", text: "Goal", correct: true },
                { id: "audience", text: "Audience", correct: true },
                { id: "budget", text: "Budget", correct: true },
                { id: "timing", text: "Timing", correct: true },
                { id: "bigidea", text: "The Big Idea", why: "The Strategist develops the Big Idea later, from the validated brief." },
                { id: "kv", text: "The key visuals", why: "KVs come from the Designer / Art Director in production." },
                { id: "signoff", text: "The Reviewer's sign-off", why: "Sign-off is the last step of the chain, not an input to the first." }
              ],
              explain: "The deck's Brief Writer needs goal, audience, budget and timing, and drafts from the Project context.",
              source: "The planning team"
            },
            {
              type: "multi", concept: "claims", skill: "gaps", doc: "draft",
              prompt: "Review the draft. Which sections still need the client's input?",
              options: [
                { id: "objective", text: "Objective", why: "The objective is stated: it's the client's challenge, word for word." },
                { id: "audience", text: "Audience", why: "The audience is stated: affluent women in Singapore." },
                { id: "keyMessage", text: "Key message", correct: true },
                { id: "channels", text: "Channels", correct: true },
                { id: "budget", text: "Budget", correct: true },
                { id: "timeline", text: "Timeline", correct: true },
                { id: "successMetrics", text: "Success metrics", correct: true }
              ],
              explain: "Five sections are marked [to confirm]: the message, the platforms, the budget split, the exact dates and the metric definitions. The email didn't state them, so the Brief Writer marked them instead of inventing them.",
              source: "Setting it up in Claude · Marking, not inventing"
            },
            {
              type: "pick", concept: "validation", skill: "decision",
              prompt: "The draft has open questions. What happens next?",
              options: [
                { id: "validate", text: "Hand it to the Brief Validator in a fresh chat, with the gaps still marked [to confirm]", correct: true, result: "Right. Anything the email didn't state stays [to confirm], and the next step in the chain is the Brief Validator, in a fresh chat." },
                { id: "guess", text: "Fill the gaps with sensible guesses so the brief looks complete", result: "Agents shouldn't invent. In the session, anything the email didn't state, such as the budget split and exact dates, was marked [to confirm]." },
                { id: "strategy", text: "Send it straight to the Strategist to save time", result: "The Strategist digests the validated brief. Validation comes first, before anything is created." }
              ],
              source: "The handoff chain · Marking, not inventing"
            }
          ]
        },
        {
          id: "validator", agent: "Brief Validator", team: "Planning", after: ["writer"],
          code: "02", persona: "The Critic", style: "A verdict, pass and flag checks, and the top fixes.", input: "Draft brief",
          personality: "Reads with fresh eyes in a new chat. Polite, exacting and hard to impress.",
          does: "Critiques the brief and checks objective, audience, message and metric.", output: "Verdict and top fixes",
          memo: "The draft brief is saved to the Project. Time to have it checked.",
          steps: [
            {
              type: "pick", concept: "validation", skill: "decision",
              prompt: "Where should the Brief Validator critique the draft?",
              options: [
                { id: "fresh", text: "In a new chat, with fresh eyes", correct: true, result: "Right. The validator critiques the brief in a fresh chat, not in the conversation that wrote it." },
                { id: "same", text: "In the same chat that wrote it, so it keeps the context", result: "The chain's rule for step 2 is “new chat, fresh eyes”. The validator works away from the conversation that drafted the brief." },
                { id: "skip", text: "Skip it and send the draft to the Strategist", result: "The Strategist digests the validated brief. Validation comes first, before anything is created." }
              ],
              source: "The handoff chain"
            },
            {
              type: "multi", concept: "validation", skill: "improve",
              prompt: "The validator has scored the draft against its checklist. Which fixes go back to the Brief Writer?",
              report: [
                { name: "Objective", ok: false, reason: "Three objectives, and none of them is primary." },
                { name: "Audience", ok: true, reason: "Stated: affluent women in Singapore." },
                { name: "Message", ok: false, reason: "No single message yet." },
                { name: "Channels", ok: false, reason: "“Social media” names no platform." },
                { name: "Metric", ok: false, reason: "One reach number, with no definition, data source or baseline." }
              ],
              options: [
                { id: "objective", text: "Objectives: make consideration (boutique enquiries) primary, with the rest supporting", correct: true },
                { id: "audience", text: "Audience: rewrite it from scratch", why: "The audience passed the check. Sound sections stay as they are." },
                { id: "message", text: "Message: one desirability-led sentence", correct: true },
                { id: "channels", text: "Channels: two platforms, Instagram and TikTok, each tied to an objective", correct: true },
                { id: "metrics", text: "Success metrics: a definition, data source, baseline slot and tracking method for each", correct: true }
              ],
              explain: "Four checks were flagged, so four fixes go back: objectives, message, channels and metrics. These are the session's top fixes. The audience passed, so it stays.",
              source: "Marketing Brief Revision · The Skills shown (Brief validator)"
            },
            {
              type: "pick", concept: "validation", skill: "review",
              prompt: "The validator adds one more flag, on the reach target. What should happen to it?",
              output: { label: "Validator flag", title: "“1M reach” looks too high", lines: ["The target looks too high for Singapore's affluent, targetable audience."] },
              options: [
                { id: "share", text: "Restate it as a share of the targetable audience", correct: true, result: "Right. In the session, the 1M reach target was flagged as too high for Singapore's affluent, targetable audience, and restated as a share of that audience." },
                { id: "keep", text: "Keep 1M: a big number impresses the client", result: "A target the audience can't support sets the campaign up to fail. The session flagged it and restated it as a share of the audience." },
                { id: "drop", text: "Drop reach from the metrics altogether", result: "Reach still matters for awareness. The fix is to make it realistic, as a share of the targetable audience, not to delete it." }
              ],
              revised: { title: "Validated brief: the top fixes applied", lines: ["Objectives: consideration (boutique enquiries) is primary, the rest support it.", "Message: one desirability-led sentence.", "Channels: Instagram and TikTok, each tied to an objective.", "Metrics: definition, data source, baseline slot and tracking method for each. Reach restated as a share of the audience."] },
              source: "Marketing Brief Revision"
            }
          ]
        },
        {
          id: "strategist", agent: "Strategist", team: "Planning", after: ["validator"],
          code: "03", persona: "The Thinker", style: "A one-page Big Idea, with hunches labelled as hypotheses.", input: "Validated brief",
          personality: "Digs for the truth behind the purchase, and labels a hunch as a hunch.",
          does: "Digests the validated brief and develops the Big Idea.", output: "Big Idea one-pager",
          memo: "The validated brief is in the Project. The Strategist has digested it and written the Research & Strategy Foundation.",
          steps: [
            {
              type: "match", concept: "bigidea", skill: "strategy",
              prompt: "The Big Idea has three layers. Match each direction to its role.",
              categories: ["Stance (the idea)", "Visual territory (how it looks)", "Proof pillar (why believe it)"],
              items: [
                { text: "Nothing to Explain", answer: "Stance (the idea)" },
                { text: "The Art of Renewal", answer: "Visual territory (how it looks)" },
                { text: "Made to Be Kept", answer: "Proof pillar (why believe it)" }
              ],
              explain: "Nothing to Explain is the stance: object first, no defensive green headline. The Art of Renewal is how it looks. Made to Be Kept is the proof: longevity and care.",
              source: "Messaging Hierarchy"
            },
            {
              type: "pick", concept: "claims", skill: "strategy",
              prompt: "“She does not want a sustainable bag; she wants a bag she never has to justify.” How does the Foundation label this?",
              options: [
                { id: "hyp", text: "As a hypothesis", correct: true, result: "Right. It's the hidden motivation truth, marked “(hypothesis)”. It guides the work without being presented as a proven finding." },
                { id: "fact", text: "As a verified research finding", result: "The Foundation marks it “(hypothesis)”. Treating it as proven would carry an assumption into every downstream output." },
                { id: "headline", text: "As the campaign headline", result: "It's the hidden motivation truth behind the strategy, marked as a hypothesis, not a line for the ads." }
              ],
              source: "Research / Strategy"
            },
            {
              type: "pick", concept: "bigidea", skill: "strategy",
              prompt: "The Strategist floats one more direction. Does it go to the Marketing Director?",
              output: { label: "Strategist · alternative direction", title: "“The eco-luxury bag”", lines: ["Lead every asset with Terra's sustainability story.", "Headline the materials: renewal, recycling, conscience."], note: "A simulated proposal written for this exercise. It is not from the deck." },
              options: [
                { id: "back", text: "Send it back: it contradicts the stance and rests on unverified claims", correct: true, result: "Right. The stance is Nothing to Explain: object first, no defensive green headline. The green claims are unverified, so headlining them breaks the guardrails. The three-layer Big Idea goes forward instead." },
                { id: "approve", text: "Pass it on: sustainability is in the brief, so lead with it", result: "Sustainability is part of the challenge, but the insight is that she wants a bag she never has to justify. Leading with green claims is the defensive headline the stance rules out, and the claims aren't verified." },
                { id: "merge", text: "Merge it into The Art of Renewal as the headline", result: "The research warns that The Art of Renewal can drift into an environmental headline. That's the drift to avoid, not a merger to make." }
              ],
              revised: { title: "Back to the three-layer Big Idea", lines: ["Stance: Nothing to Explain", "Visual territory: The Art of Renewal", "Proof pillar: Made to Be Kept"] },
              source: "Messaging Hierarchy · Research guardrails"
            }
          ]
        },
        {
          id: "you", agent: "You", team: "Director", after: ["strategist"],
          code: "HQ", persona: "Marketing Director", style: "Decisions: approve, send back, save, dispatch.", input: "Big Idea one-pager",
          personality: "The one human in the chain. Nothing reaches production without your approval.",
          does: "Approve and save to the knowledge base, then dispatch the work to production.", output: "Approved strategy in the Project",
          memo: "The Big Idea one-pager is on your desk. Terra's green claims are unverified, and the motivation truth is a hypothesis.",
          steps: [
            {
              type: "pick", concept: "approval", skill: "oversight",
              prompt: "What do you do with the strategy?",
              options: [
                { id: "approve", text: "Approve it and save it to the knowledge base, with the hypothesis and [to verify] marks kept", correct: true, result: "Approved and saved. The production agents now work from the strategy in the Project, with its open claims still visibly marked." },
                { id: "chat", text: "Paste it straight to the Designer and Copywriter without saving it", result: "Step 4 is approve and save to the knowledge base. The later agents work from what's saved in the Project, so an unsaved strategy never reaches them reliably." },
                { id: "strip", text: "Approve it and delete the [to verify] marks to speed up production", result: "The research's guardrails say The Art of Renewal can drift into an environmental headline and Made to Be Kept needs tested durability claims. Neither may be used as a claim until approved." },
                { id: "self", text: "Ask the Strategist to approve its own work", result: "Step 4 is the one human step in the chain: you approve and save." }
              ],
              source: "The handoff chain · Messaging Hierarchy"
            },
            {
              type: "match", concept: "production", skill: "oversight",
              prompt: "Approved and saved. Now dispatch the work: route each task to the right production agent.",
              categories: ["Designer / Art Director", "Copywriter"],
              items: [
                { text: "Create the key visual concepts", answer: "Designer / Art Director" },
                { text: "Generate KV assets through the Higgsfield connector", answer: "Designer / Art Director" },
                { text: "Build the messaging hierarchy", answer: "Copywriter" },
                { text: "Adapt the copy per channel and platform", answer: "Copywriter" }
              ],
              explain: "The Designer / Art Director creates the KVs, using connectors such as Higgsfield. The Copywriter builds the messaging hierarchy and adapts it per channel and platform.",
              source: "The production team"
            }
          ]
        },
        {
          id: "designer", agent: "Designer / Art Director", team: "Production", after: ["you"],
          code: "04", persona: "The Visualist", style: "Key visual concepts, moodboards and renders.", input: "Approved strategy from the knowledge base",
          personality: "Thinks in pictures first, and builds key visual concepts through connectors such as Higgsfield.",
          does: "Creates the key visuals (KVs), using connectors such as Higgsfield.", output: "KV concepts and assets",
          memo: "The approved strategy is in the knowledge base. Your routing note: create the key visual concepts. The Copywriter is working in parallel.",
          steps: [
            {
              type: "match", concept: "bigidea", skill: "strategy",
              prompt: "Each KV concept carries one layer of the Big Idea. Match them.",
              categories: ["Nothing to Explain", "The Art of Renewal", "Made to Be Kept"],
              items: [
                { text: "Held", answer: "Nothing to Explain" },
                { text: "Reassembled", answer: "The Art of Renewal" },
                { text: "Years", answer: "Made to Be Kept" }
              ],
              explain: "Held carries Nothing to Explain in weeks 1–3. Reassembled carries The Art of Renewal in weeks 4–6 and on TikTok. Years carries Made to Be Kept in weeks 7–12.",
              source: "Key Visuals"
            },
            {
              type: "pick", concept: "claims", skill: "decision", cards: true,
              prompt: "Three KV concepts came back. Which goes forward as the master visual?",
              options: [
                { id: "held", art: "held", text: "Held: the bag held by its handle against a cream backdrop, no caption", meta: "Nothing to Explain · weeks 1–3 · no caption, no material claim", correct: true, result: "Right. Held carries no unverified material claim, so it can be approved fastest and costs the least. The other two follow in later phases." },
                { id: "reassembled", art: "reassembled", text: "Reassembled: panels drift and resolve into the finished bag", meta: "The Art of Renewal · weeks 4–6 and TikTok · most shareable, riskiest on claims, most expensive", result: "It's the most shareable concept, but also the riskiest on claims and the most expensive to produce. It was planned for weeks 4–6 and TikTok." },
                { id: "years", art: "years", text: "Years: the same bag at three moments in one Singapore day", meta: "Made to Be Kept · weeks 7–12 · ends on the appointment call to action", result: "Years carries Made to Be Kept in weeks 7–12. It follows later, once the master visual is approved." }
              ],
              source: "Key Visuals"
            },
            {
              type: "pick", concept: "claims", skill: "oversight",
              prompt: "A request comes in for the KV shoot. What does the Designer do?",
              output: { label: "Request in the project chat", title: "“Can we put a real brand ambassador's face on the model?”", lines: [] },
              options: [
                { id: "decline", text: "Decline: the person hasn't agreed to Terra, and the image could pass for a real advertisement", correct: true, result: "Right. In the session, Claude declined exactly this: the person hadn't agreed to Terra, and the image could be taken for a real advertisement once it leaves the class." },
                { id: "class", text: "Do it, but only for the class presentation", result: "Once an image exists, it can leave the class. Consent, and the risk of looking like a real ad, don't change with the audience." },
                { id: "photo", text: "Use a real product photo instead", result: "The session declined real product photos for the same reason: the generated images could be taken for a real advertisement." }
              ],
              source: "Why Held went forward"
            }
          ]
        },
        {
          id: "copywriter", agent: "Copywriter", team: "Production", after: ["you"],
          code: "05", persona: "The Wordsmith", style: "A messaging hierarchy, then copy for each channel.", input: "Approved strategy from the knowledge base",
          personality: "Weighs every word. Builds the hierarchy first, then adapts it channel by channel.",
          does: "Builds the messaging hierarchy and adapts it per channel and platform.", output: "Channel-by-channel copy",
          memo: "The approved strategy is in the knowledge base. Your routing note: build the messaging hierarchy, then adapt it per channel. The Designer is working in parallel.",
          steps: [
            {
              type: "order", concept: "production", skill: "decision",
              prompt: "Put Terra's messaging hierarchy in order, top to bottom.",
              items: [
                "Core promise: “so beautifully made that you never have to explain it”",
                "Lead message: “Is this really Louis Vuitton?”",
                "“What is it made of, and can I trust that?”",
                "“Why this bag, and will it last?”",
                "Call to action: “Book an appointment to see Terra”"
              ],
              explain: "The core promise sits on top, then the three supporting messages (the first is the lead message in every asset), then the call to action.",
              source: "Messaging Hierarchy"
            },
            {
              type: "pick", concept: "claims", skill: "oversight",
              prompt: "The Art of Renewal pulls towards a headline about Terra's materials. What does the Copywriter do?",
              options: [
                { id: "hold", text: "Keep material claims out of the copy until they're substantiated, and leave them marked [to verify]", correct: true, result: "Right. The research's guardrails warn that The Art of Renewal can drift into an environmental headline. Terra's environmental credentials are hypothetical, and the brief says every environmental claim must be substantiated before anything is published." },
                { id: "claim", text: "Write the environmental headline: it's the visual territory, so the copy should say it", result: "The Art of Renewal is how it looks, not a licence to claim. The stance is Nothing to Explain: no defensive green headline, and no environmental claim until it's substantiated." },
                { id: "later", text: "Write it anyway and let the Reviewer catch it", result: "The Reviewer checks the work, but every agent works inside the guardrails. Writing an unsubstantiated claim on purpose only moves the risk down the chain." }
              ],
              source: "Messaging Hierarchy · Research guardrails"
            },
            {
              type: "pick", concept: "production", skill: "improve",
              prompt: "The first Instagram caption draft is in. What do you tell the Copywriter?",
              output: { label: "Copywriter draft · Instagram caption", title: "“Discover luxury, redefined. Shop the new icon today.”", lines: [], note: "A simulated draft written for this exercise." },
              options: [
                { id: "revise", text: "Revise: it could sell any bag. Build it from the hierarchy: the lead message, the promise, then the appointment call to action", correct: true, result: "Right. Generic luxury language carries none of Terra's promise. The hierarchy puts the lead message in every asset and ends on the appointment call to action." },
                { id: "ok", text: "Approve it: it's short and on-trend", result: "Short isn't the test. Nothing in it comes from the messaging hierarchy, so it could sell any bag." },
                { id: "green", text: "Add an environmental line to make it specific", result: "Specific, but unsubstantiated: environmental claims stay out of the copy until they're verified." }
              ],
              revised: { title: "Revised to the hierarchy", lines: ["Lead: “Is this really Louis Vuitton?”", "Promise: so beautifully made that you never have to explain it", "Call to action: “Book an appointment to see Terra.”"] },
              source: "Messaging Hierarchy"
            }
          ]
        },
        {
          id: "reviewer", agent: "Reviewer", team: "Production", after: ["designer", "copywriter"],
          code: "06", persona: "The Gatekeeper", style: "Scores, annotated notes, and sign-off or send-back.", input: "KVs and copy from both production desks",
          personality: "Checks every asset against brand voice, the brief and the Big Idea. Signs off only when it's ready.",
          does: "Checks the work against brand voice, the brief and the Big Idea.", output: "Edits and sign-off",
          memo: "The Instagram Story and post are back for review, with the Creative Review Scorer's notes. Check them against the strategy you approved.",
          steps: [
            {
              type: "multi", concept: "review", skill: "review",
              prompt: "Which issues block sign-off on the Instagram post? Pick three.",
              options: [
                { id: "tags", text: "Placeholder hashtag and tag still in the caption: #[LV ambassador] and @LV Ambassador", correct: true },
                { id: "fact", text: "The material-fact line is a placeholder with no approved fact", correct: true },
                { id: "bag", text: "The bag in the image doesn't match the Terra renders", correct: true },
                { id: "noclaim", text: "The caption makes no environmental claim", why: "That's a strength in the review: the caption stays inside the brief's rule." },
                { id: "cta", text: "It ends on a clear next step, “Discover Terra”", why: "The review lists the clear next step as a strength." },
                { id: "alt", text: "It includes alt text", why: "Alt text is listed as a strength, not a problem." }
              ],
              explain: "The post looked unfinished: placeholders in the caption, an unfilled material-fact line, and a bag that didn't match the Terra renders.",
              source: "Creative Score · The Reveal"
            },
            {
              type: "pick", concept: "review", skill: "improve",
              prompt: "The Story scored 5.7/10 and the post 4.3/10. What's the one change that lifts both most?",
              options: [
                { id: "held", text: "Move away from the desert scene and use the Held concept, tight on the bag", correct: true, result: "Right. The review's one change: drop the desert setting and use Held, so the idea is visible in the picture rather than only in the headline. A hand-on-the-clasp image later scored 6.7/10." },
                { id: "green", text: "Add an environmental headline to explain the materials", result: "That cuts against the stance, Nothing to Explain, and against the guardrails: no environmental claim until it's substantiated." },
                { id: "face", text: "Swap a real brand ambassador's face onto the model", result: "In the session Claude declined this: the person hadn't agreed to Terra, and the image could be taken for a real advertisement once it leaves the class." }
              ],
              source: "Creative Score · Key Visuals"
            }
          ]
        }
      ],
      /* Scripted briefs. The draft is what the Marketing Brief Builder produced from the email, as far as the deck
         shows it; anything the deck doesn't show is [to confirm]. The validated brief applies the session's top fixes. */
      draft: {
        title: "Terra social media launch, Singapore (draft)",
        objective: "Create awareness, desirability and consideration for Terra while establishing its environmental credentials without compromising luxury positioning.",
        audience: "Affluent women in Singapore.",
        keyMessage: "[to confirm] Not yet set as one message.",
        channels: "Social media. Platforms [to confirm].",
        budget: "Indicative S$300,000. Split by channel [to confirm].",
        timeline: "Proposed launch September 2027, three months. Exact dates [to confirm].",
        successMetrics: "Reach target: 1M. Definitions, data sources and baselines [to confirm].",
        mandatories: "Terra's environmental credentials are hypothetical: all environmental claims must be substantiated before any advertising is published. Retail price S$5,800; an initial allocation of 1,000 bags."
      },
      validated: {
        title: "Terra social media launch, Singapore (validated)",
        objective: "Primary: consideration (boutique enquiries). Awareness and desirability support it.",
        audience: "Affluent women in Singapore.",
        keyMessage: "One desirability-led sentence.",
        channels: "Instagram and TikTok, each tied to an objective.",
        budget: "Indicative S$300,000. Split by channel [to confirm].",
        timeline: "Proposed launch September 2027, three months. Exact dates [to confirm].",
        successMetrics: "Each metric has a definition, data source, baseline slot and tracking method. Reach restated as a share of the targetable audience.",
        mandatories: "Terra's environmental credentials are hypothetical: all environmental claims must be substantiated before any advertising is published. Retail price S$5,800; an initial allocation of 1,000 bags."
      },
      reveal: {
        headline: "Nothing to explain.",
        promise: "Terra is a Louis Vuitton handbag so beautifully made that you never have to explain it, with considered materials you can quietly stand behind.",
        cta: "Book an appointment to see Terra.",
        note: "Working copy from the session's fictional Terra scenario, not an official line."
      },
      recap: [
        { concept: "chain", title: "Six agents, one chain", text: "Brief Writer, Brief Validator, Strategist, you, then Designer and Copywriter in parallel, then Reviewer. Each hands one output to the next." },
        { concept: "validation", title: "New chat, fresh eyes", text: "The validator critiques the brief away from the chat that wrote it, before anything is created." },
        { concept: "approval", title: "You approve and save", text: "The one human step sits between strategy and production. What you save is what production works from." },
        { concept: "claims", title: "Mark it, don't invent it", text: "[to confirm] for missing inputs, [to verify] for unproven claims, and a hypothesis stays a hypothesis." }
      ],
      /* Agency ranks, by desks right first time (7 desks). */
      ratings: [
        { min: 7, name: "Agency Principal", line: "Seven desks, every call right first time. You ran the agency." },
        { min: 5, name: "Marketing Director", line: "A desk or two needed a second look. The campaign shipped on your call." },
        { min: 3, name: "Account Director", line: "Several handoffs came back. The explanations are what stick." },
        { min: 0, name: "Account Executive", line: "Most handoffs needed another pass. Run it again and the chain will feel natural." }
      ],
      xpPerDecision: 100
    },

    /* The concept drill: the existing drill engine. Stage ids reuse the drill's
       art direction (warmup · call · debug · flow). */
    game: {
      name: "CONCEPT DRILL",
      tagline: "Twelve quick challenges in four rounds. Each round is harder and worth more.",
      bonus: 0.25,
      titles: [
        { min: 95, name: "Signed off clean" },
        { min: 80, name: "Strategy approved" },
        { min: 60, name: "Brief validated" },
        { min: 40, name: "Draft brief" },
        { min: 0, name: "Still in the inbox" }
      ],
      stages: [
        {
          id: "warmup",
          label: "Round 01",
          title: "Meet the team",
          brief: "Three quick ones on who does what.",
          points: 50,
          challenges: [
            {
              type: "mcq", concept: "chain",
              prompt: "Which agent develops the Big Idea?",
              options: [
                { id: "a", text: "Brief Writer" },
                { id: "b", text: "Brief Validator" },
                { id: "c", text: "Strategist" },
                { id: "d", text: "Copywriter" }
              ],
              answer: "c",
              hint: "It works from the validated brief.",
              explain: "The Strategist digests the validated brief and develops the Big Idea. Its output is a Big Idea one-pager.",
              source: "The planning team"
            },
            {
              type: "mcq", concept: "production",
              prompt: "Who creates the key visuals, using connectors such as Higgsfield?",
              options: [
                { id: "a", text: "Designer / Art Director" },
                { id: "b", text: "Copywriter" },
                { id: "c", text: "Reviewer" },
                { id: "d", text: "Strategist" }
              ],
              answer: "a",
              hint: "KV stands for key visual.",
              explain: "The Designer / Art Director creates the KVs, uses connectors such as Higgsfield, and outputs KV concepts and assets.",
              source: "The production team"
            },
            {
              type: "mcq", concept: "chain",
              prompt: "What does the Reviewer produce?",
              options: [
                { id: "a", text: "A draft brief" },
                { id: "b", text: "A verdict and top fixes" },
                { id: "c", text: "Channel-by-channel copy" },
                { id: "d", text: "Edits and sign-off" }
              ],
              answer: "d",
              hint: "It's the last step of the chain.",
              explain: "The Reviewer checks work against brand voice, confirms it delivers the brief and the Big Idea, and outputs edits and sign-off.",
              source: "The production team"
            }
          ]
        },
        {
          id: "call",
          label: "Round 02",
          title: "Make the call",
          brief: "You're the Marketing Director. Choose well.",
          points: 75,
          challenges: [
            {
              type: "mcq", concept: "validation",
              prompt: "The draft brief is ready. Where should it be validated?",
              options: [
                { id: "a", text: "In the same chat, so the validator keeps every detail" },
                { id: "b", text: "In a new chat, with fresh eyes" },
                { id: "c", text: "Nowhere: the Strategist can fix it later" },
                { id: "d", text: "By the Reviewer at the end" }
              ],
              answer: "b",
              hint: "Step 2 of the chain has a three-word rule.",
              explain: "The Brief Validator critiques the brief in a fresh chat: new chat, fresh eyes.",
              source: "The handoff chain"
            },
            {
              type: "mcq", concept: "claims",
              prompt: "The email gives no exact dates. How should the draft brief show that?",
              options: [
                { id: "a", text: "Leave the dates out without comment" },
                { id: "b", text: "Pick reasonable dates" },
                { id: "c", text: "Mark them [to confirm]" },
                { id: "d", text: "Copy dates from an older brief" }
              ],
              answer: "c",
              hint: "The agents mark gaps instead of filling them.",
              explain: "Anything the email didn't state, such as the budget split and exact dates, was marked [to confirm] rather than invented.",
              source: "Marketing Brief Builder"
            },
            {
              type: "mcq", concept: "claims",
              prompt: "Which KV went forward as the master visual, and why?",
              options: [
                { id: "a", text: "Reassembled, because it's the most shareable" },
                { id: "b", text: "Held, because it carries no unverified material claim" },
                { id: "c", text: "Years, because it ends on the call to action" },
                { id: "d", text: "None: the Reviewer rejected all three" }
              ],
              answer: "b",
              hint: "The fastest one to approve.",
              explain: "Held carries no unverified material claim, so it can be approved fastest and costs the least. Reassembled is the riskiest on claims.",
              source: "Key Visuals"
            }
          ]
        },
        {
          id: "debug",
          label: "Round 03",
          title: "Spot the mistake",
          brief: "Someone's notes on the session have one error each.",
          points: 100,
          challenges: [
            {
              type: "spot", concept: "chain",
              prompt: "A classmate's notes on the handoff chain. Which one is wrong?",
              statements: [
                "The Brief Writer drafts the brief from Project context.",
                "The Brief Validator checks objective, audience, message and metric.",
                "The Strategist approves its own Big Idea and saves it to the knowledge base.",
                "The Designer and Copywriter work in parallel."
              ],
              wrong: 2,
              hint: "One step in the chain is always human.",
              explain: "Step 4 is you: you approve the strategy and save it to the knowledge base. The Strategist doesn't approve its own work.",
              source: "The handoff chain"
            },
            {
              type: "spot", concept: "bigidea",
              prompt: "Notes on the Terra Big Idea. Which one is wrong?",
              statements: [
                "Nothing to Explain is the stance.",
                "The Art of Renewal is the proof pillar.",
                "Made to Be Kept argues longevity and care.",
                "The stance means no defensive green headline."
              ],
              wrong: 1,
              hint: "One layer is about how it looks.",
              explain: "The Art of Renewal is the visual territory. Made to Be Kept is the proof pillar.",
              source: "Messaging Hierarchy"
            },
            {
              type: "spot", concept: "setup",
              prompt: "Notes on the Claude setup. Which one is wrong?",
              statements: [
                "The Project held saved Skills such as the Brief validator and the KV Concept Builder.",
                "A scheduled task ran the Marketing Brief Builder daily.",
                "It drafted from the latest email labelled “Marketing Brief”.",
                "When the thread had two briefs, it merged them into one."
              ],
              wrong: 3,
              hint: "Look at what happened to the older email in the thread.",
              explain: "The thread held an older email with a different brief. Claude used only the latest “Marketing Brief” email and said so.",
              source: "Marketing Brief Builder"
            }
          ]
        },
        {
          id: "flow",
          label: "Round 04",
          title: "Run the chain",
          brief: "Put things in order and match them up. Every correct position scores.",
          points: 125,
          challenges: [
            {
              type: "order", concept: "chain",
              prompt: "The six steps of the handoff chain.",
              items: [
                "Brief Writer drafts the brief",
                "Brief Validator: new chat, fresh eyes",
                "Strategist shapes the Big Idea",
                "You approve and save to the knowledge base",
                "Designer + Copywriter: KVs and channel messaging",
                "Reviewer checks brand voice"
              ],
              hint: "Planning, then you, then production.",
              explain: "Brief Writer, Brief Validator, Strategist, you, Designer + Copywriter, Reviewer.",
              source: "The handoff chain"
            },
            {
              type: "match", concept: "chain",
              prompt: "Match each agent to its output.",
              categories: ["Draft brief", "Verdict and top fixes", "Big Idea one-pager", "Channel-by-channel copy"],
              items: [
                { text: "Brief Writer", answer: "Draft brief" },
                { text: "Brief Validator", answer: "Verdict and top fixes" },
                { text: "Strategist", answer: "Big Idea one-pager" },
                { text: "Copywriter", answer: "Channel-by-channel copy" }
              ],
              hint: "Each agent has exactly one output.",
              explain: "Brief Writer: draft brief. Brief Validator: verdict and top fixes. Strategist: Big Idea one-pager. Copywriter: channel-by-channel copy.",
              source: "The planning team · The production team"
            },
            {
              type: "match", concept: "review",
              prompt: "Sort the review notes on the Instagram post.",
              categories: ["Strength", "Blocks sign-off"],
              items: [
                { text: "The caption makes no environmental claim", answer: "Strength" },
                { text: "It includes alt text and a clear next step", answer: "Strength" },
                { text: "#[LV ambassador] is still in the hashtags", answer: "Blocks sign-off" },
                { text: "The bag doesn't match the Terra renders", answer: "Blocks sign-off" }
              ],
              hint: "Would you publish it with a placeholder in it?",
              explain: "The restrained caption and the alt text are strengths. Placeholders and a mismatched bag mean it isn't ready to sign off.",
              source: "Creative Score"
            }
          ]
        }
      ]
    }
  },

  /* ------------------------------------------------------------------------
     SESSION 03 · Find the Audience (FIELD MODE · THE DIG)
     Source: the 29-slide teaching deck "Session 5 · 13 November 2026".
     Section One (Audience, Insights & Optimisation) is taught in full.
     Section Two (LinkedIn guest session) is a topic note from the slides only:
     the deck has the session title and the speaker's bio, not the talk.
     Section Three (GEO) is on the agenda but has no slides: acknowledged only.
     Everything in THE DIG marked illustrative (the Sephora brief, leads,
     evidence findings, audience estimates, budgets, profit figures) is invented
     for the game. It is not Sephora's data or any platform's.
     ------------------------------------------------------------------------ */
  {
    id: "s03",
    number: "03",
    status: "live",
    title: "Find the Audience",
    shortTitle: "Find the Audience",
    host: "LinkedIn",
    event: "ESSEC · Digital Platforms Test Drive",
    dateLabel: "13 Nov",
    presenters: ["Cindy Leong, LinkedIn (guest session)"],
    topics: ["Audience insight vs size", "Research tools", "AI and synthetic audiences", "Audience sizing", "Customer quality & ROI"],
    summary:
      "Find the right people before you spend a dollar. A campaign is ready to go, the creative is in, and nobody can say who it's for. That's your job: dig up who the audience really is, sort the evidence from the noise, push back on the AI, size what you can reach and decide which customers deserve the money.",

    landing: {
      tagline: "Find the right people before you spend a dollar.",
      kicker: "The Dig · Field Mode",
      cards: [
        { k: "You're investigating", h: "Who the campaign is really for", p: "An illustrative Sephora brief with a big gap in the middle: the audience. You'll question it, research it and size it." },
        { k: "You'll build", h: "An Audience Dossier", p: "Target audience, evidence, an audience estimate, a customer priority and an investment call. Every line comes from what you did in the game." },
        { k: "You'll walk away with", h: "A planner's instincts", p: "Insight vs size. The right tool for the question. Why AI answers are hypotheses. Why the biggest audience is rarely the best investment." }
      ],
      learn: { h: "Learn", p: "The ideas, laid out properly: diagrams, a few toys to poke at, and the frameworks from the session. Read it before or after you play." },
      play: { h: "Play Field Mode", p: "THE DIG. Seven stages, one case, about 15 minutes. Drag evidence, build an audience, split a budget, file the dossier." },
      cta: "Read it. Now go <em>dig</em>."
    },

    objectives: [
      "Place media planning in a campaign, and tell a strategy from a plan.",
      "Tell audience insight from audience size, and match each question to the tool that can answer it.",
      "Treat AI research as a fast first draft that real data has to confirm.",
      "Read a platform's audience estimate for what it is, including LinkedIn's thresholds.",
      "Back customers on quality and long-term value, not on reach."
    ],

    takeaways: [
      "Every stage of a media plan is a decision. Educated ones are what make stakeholders trust the plan.",
      "Insight tells you who people are and why they act. Size tells you how many you can reach. You need both.",
      "Knowing the audience is how you stop paying to reach people who were never going to care. That's media wastage.",
      "No subscription tools? Google Trends, Think with Google, TikTok, Meta, Reddit and AI chatbots will get you a long way.",
      "AI is brilliant at hypotheses and unreliable as proof. Validate with real data, and keep synthetic respondents to 10–20% of a sample.",
      "A platform's estimate is still the best guide to size, but AI targeting has changed what the number means.",
      "Reach isn't value. Some customers cost little to win and give back even less."
    ],

    chapters: [
      {
        label: "Part 1",
        title: "Before anyone spends",
        intro: "Media planning has a place in the campaign, and a running order. Get these straight and the rest of the session makes sense.",
        blocks: [
          { h: "Where media sits in a campaign", p: "Tap a step. The brief comes in, two teams research, they agree on a strategy, then content and media split into their own tracks.", special: "dig-lifecycle" },
          { h: "Strategy or plan?", p: "People use the words interchangeably. Planners don't. Sort these and see why.", special: "dig-strategy" },
          {
            h: "Six stages, one direction",
            ordered: true,
            items: [
              { t: "Business context", d: "" }, { t: "Audience insights", d: "" }, { t: "Channel decisioning", d: "" },
              { t: "Investment decisioning", d: "" }, { t: "Measurement plan", d: "" }, { t: "Media plan", d: "" }
            ],
            note: "The plan is the last stage, not the first. Each stage needs an educated decision, and that's what gives stakeholders confidence in the plan."
          },
          {
            h: "Why it's hard",
            p: "Six pressures from the session, all pulling at once: a media landscape that keeps changing, tight budgets, competing stakeholder priorities, finding the audience at all, platforms and channels splintering, and measurement that won't sit still. With this much data the risk is paralysis. The skill is cutting through it."
          }
        ]
      },
      {
        label: "Part 2",
        title: "Insight vs size",
        intro: "Audience understanding is two different jobs. Mix them up and you'll either know your audience intimately and have no idea how many there are, or the reverse.",
        blocks: [
          { h: "Two questions, two kinds of tool", p: "Insight is qualitative: who they are, what they care about, how they decide. Size is quantitative: how many you can actually reach where you'll buy media. Tap a tool to see which job it does.", special: "dig-tools" },
          {
            h: "Why bother? Media wastage",
            p: "Wastage is media activity reaching people outside the audience you wanted. Every one of those impressions is budget that could have done something. Understanding the audience is how you cut it, and how results and ROI go up."
          },
          {
            h: "The eight questions to ask",
            p: "Straight from the session, in its own words. Answer these and you know enough to choose channels, targeting and ad types.",
            items: [
              { t: "What are their online behaviours?", d: "" }, { t: "What channels do they use?", d: "" },
              { t: "How do they research products online?", d: "" }, { t: "What influences their decision to purchase?", d: "" },
              { t: "What type of content do they consume?", d: "" }, { t: "What interests do they have affinity with?", d: "" },
              { t: "Case studies for similar campaigns?", d: "" }, { t: "What are their attitude towards brands?", d: "" }
            ]
          },
          { h: "The audience mining flow", p: "Five steps from a vague target to a size and a budget. Open each one.", special: "dig-mining" }
        ]
      },
      {
        label: "Part 3",
        title: "AI: quick to guess, slow to prove",
        intro: "Research tools now ship with AI built in, and a new kind of research has arrived: synthetic audiences. Both are fast. Neither is proof.",
        blocks: [
          {
            h: "What's changed",
            items: [
              { t: "Deep research agents", d: "ChatGPT deep research, Gemini Deep Research and Perplexity read hundreds of sources and draft an audience brief in minutes. Check what they cite." },
              { t: "AI inside the tools", d: "GWI Spark answers audience questions in plain language. Meltwater Mira and Nielsen Ad Intel AI summarise conversations and competitor ads. Google Trends Explore suggests comparisons with Gemini." },
              { t: "New names, same tools", d: "Facebook IQ is now Meta Foresight. Think with Google lives on business.google.com. Semrush is part of Adobe." },
              { t: "Synthetic audiences", d: "AI “twins” of consumers answer surveys in hours: Simile (US$2B valuation), Aaru (EY alliance), Evidenza. Aveeno cut a strategy brief from 30 days to 3." }
            ]
          },
          { h: "Now look at the proof", p: "The session paired the hype with the evidence. These are the figures it quoted.", special: "dig-proof" },
          { h: "How to use it", p: "Use AI to explore and form hypotheses fast, then validate them with real data: GWI, platform insights, surveys, sales. And keep synthetic respondents to 10–20% of a sample.", special: "dig-cap" }
        ]
      },
      {
        label: "Part 4",
        title: "Sizing the audience",
        intro: "The ad platforms will tell you how many people you can reach. They're still the best guide. The trick is knowing what each number is counting.",
        blocks: [
          { h: "Try it: filters shrink audiences", p: "Add filters and watch an illustrative LinkedIn estimate fall. LinkedIn's guidance is on the bar.", special: "dig-sizer" },
          {
            h: "What each platform's number means",
            items: [
              { t: "Meta", d: "With Advantage+ audience, age, interests and lookalikes are only suggestions, so the estimate shows the broad reachable pool. Detailed-targeting exclusions went in 2025." },
              { t: "LinkedIn", d: "Campaign Manager shows estimated members as you build. Minimum 300 to serve, 50,000+ recommended. Location comes first: it's required." },
              { t: "TikTok", d: "Audience Insights counts accounts that saw ads in the last 30 days. Accounts, not people, and no under-18s." },
              { t: "Google", d: "Keyword Planner forecasts at campaign level, by city and device. Reach Planner adds industry benchmarks for weekly frequency." }
            ]
          },
          {
            h: "So what",
            p: "Size the market with research tools. Size the reachable audience with platform tools. Then let the platform's AI find the people inside it, guided by your data and your creative."
          }
        ]
      },
      {
        label: "Part 5",
        title: "Who deserves the budget?",
        intro: "Whatever the objective, the session named four principles that hold for most brands. Two of them come with real detail.",
        blocks: [
          {
            h: "Four principles",
            items: [
              { t: "Annual ROI and sustained profitability", d: "Judge media spend over a year, not a week. Keep a long-term focus, and track performance continuously so ROI stays high all year." },
              { t: "Customer quality", d: "Winning a customer is an investment. It can be worth spending more than the price of a product if they'll keep buying. And some customers are worth little even when they're cheap to win: they switch brands, or only buy on discount." },
              { t: "Design to learn", d: "" },
              { t: "Long-term incrementality", d: "" }
            ],
            note: "The deck names the last two without explaining them, so UNFOLD doesn't either."
          },
          { h: "The customer quality matrix", p: "Two questions: how much value does the customer get, and how much do they give back? Tap a quadrant.", special: "dig-matrix" },
          { h: "ROI, worked", p: "Return on investment = (Profit − Ad Spend) / Ad Spend. Move the numbers. The figures are illustrative.", special: "dig-roi" },
          {
            h: "The Sephora question",
            p: "The session closed with three real-sounding Sephora customers: a creator who rarely shops but moves her followers, a deal-hunter who waits for promotions, and a loyalty member who buys several times a year, often at full price. Which should Sephora prioritise? The deck leaves it to the class. THE DIG makes you answer it."
          },
          { h: "Key terms", special: "glossary" }
        ]
      },
      {
        label: "Part 6",
        title: "The LinkedIn guest session",
        intro: "An honest note, not a lesson.",
        blocks: [
          {
            h: "LinkedIn in the Era of LLM: from SEO to GEO",
            p: "Section Two was a guest session from LinkedIn with Cindy Leong, Head of Scaled Agency Development, APAC. The deck carries the session title and her bio, not the talk, so UNFOLD doesn't reconstruct what she said. What the slides do give: LinkedIn has more than 1 billion members, including executives from every Fortune 500 company, and Cindy leads LinkedIn's Scaled Agency Team in APAC, focused on empowering independent agencies."
          },
          {
            h: "And GEO?",
            p: "Generative Engine Optimisation is on the session agenda and in the guest-session title, but there are no GEO slides in the deck. It isn't taught or tested here. LinkedIn's audience guidance from Section One (300 to serve, 50,000+ recommended, location first) is in Part 4 and in the game."
          }
        ]
      }
    ],

    glossary: [
      { term: "Media strategy", def: "The high-level approach: how, where and when to reach the right audience to hit the brand's objectives." },
      { term: "Media plan", def: "The strategy made tactical: specific channels and platforms, budget allocation and timing." },
      { term: "Audience insight", def: "Qualitative understanding of the audience. Shapes targeting, messaging and even channels." },
      { term: "Audience size", def: "Quantitative: the potential reach and scope of the media strategy, best taken from the platforms where you'll buy." },
      { term: "Media wastage", def: "Media activity reaching people outside the audience you wanted. Cut it and results and ROI go up." },
      { term: "Proxy audience", def: "Your target audience rebuilt from the attributes a tool offers: first in market insight tools, then in media buying platforms." },
      { term: "DSP", def: "Where inventory is bought, such as Meta, DV360 or TikTok. Gives addressable audience sizes." },
      { term: "Synthetic audience", def: "AI “twins” of consumers that answer surveys in hours. Good for hypotheses. Cap them at 10–20% of a sample." },
      { term: "ROI", def: "Return on investment = (Profit − Ad Spend) / Ad Spend." },
      { term: "Simulated, not real data", note: true, def: "THE DIG uses Sephora because the session's class discussion does. The brief, leads, evidence, audience estimates, budgets and profit figures in the game are illustrative, made for learning. They are not Sephora's or any platform's data, and no research tool or AI is being run." }
    ],
    theme: { motif: "field", primary: "mint", secondary: "pink", label: "Investigation board" },
    cover: { lines: ["Find the", "Audience"], sub: "The Dig · Field Mode" },

    concepts: {
      lifecycle: { name: "Campaign lifecycle and planning stages", chapter: 0 },
      insight: { name: "Audience insight vs audience size", chapter: 1 },
      tools: { name: "Choosing research tools", chapter: 1 },
      questions: { name: "The eight audience questions", chapter: 1 },
      mining: { name: "The audience mining flow", chapter: 1 },
      ai: { name: "AI research and synthetic audiences", chapter: 2 },
      sizing: { name: "Reading platform audience estimates", chapter: 3 },
      investment: { name: "ROI and investment principles", chapter: 4 },
      quality: { name: "Customer quality", chapter: 4 },
      linkedin: { name: "LinkedIn, per the slides", chapter: 3 }
    },

    achievements: [
      { id: "s03-first-clue", name: "First Clue", desc: "Turn up your first piece of real evidence in the research lab.", rule: { type: "fieldFlag", flag: "clue" } },
      { id: "s03-signal", name: "Signal over Noise", desc: "Spot a weak signal for what it is, first time.", rule: { type: "fieldFlag", flag: "signal" } },
      { id: "s03-tool-master", name: "Tool Master", desc: "Match all five research questions to a right tool, with one miss at most.", rule: { type: "fieldFlag", flag: "tools" } },
      { id: "s03-sceptic", name: "AI Sceptic", desc: "Catch every unsupported AI claim, first time.", rule: { type: "fieldFlag", flag: "sceptic" } },
      { id: "s03-sweet-spot", name: "The Sweet Spot", desc: "Lock an audience that's at least 70% on target and big enough to run (60,000+).", rule: { type: "fieldFlag", flag: "sweet" } },
      { id: "s03-budget-brain", name: "Budget Brain", desc: "Lock a split with ROI of 100% or more, and work out the ROI right first time.", rule: { type: "fieldFlag", flag: "budget" } },
      { id: "s03-case-closed", name: "Case Closed", desc: "File the Audience Dossier.", rule: { type: "fieldPlays", min: 1 } },
      { id: "s03-master", name: "Master Planner", desc: "Score 950 XP or more in THE DIG.", rule: { type: "fieldPct", min: 95 } },
      { id: "s03-drilled", name: "Field Notes", desc: "Finish the Session 03 concept drill once.", rule: { type: "plays", min: 1 } },
      { id: "s03-sharp", name: "Sharp Eye", desc: "Reach 80% accuracy in a Session 03 drill run.", rule: { type: "pct", min: 80 } },
      { id: "s03-no-hints", name: "No Hints Needed", desc: "Finish a Session 03 drill run without opening a hint.", rule: { type: "flag", flag: "noHints" } },
      { id: "s03-glossary", name: "Field Glossary", desc: "Open every Session 03 term card in the Learn tab.", rule: { type: "terms" } }
    ],

    mode: "FIELD MODE",
    field: {
      v: 2,
      name: "THE DIG",
      role: "Field Investigator",
      tagline: "A campaign is ready to go live. Nobody can say who it's for. Seven stages, one case, about 15 minutes.",
      simNote: "A simulation built for learning. Sephora is here because the session's class discussion uses it. The brief, leads, evidence, audience estimates, budgets and profit figures are illustrative, not Sephora's or any platform's data, and no research tool or AI runs on this page.",
      budget: 60000,
      currency: "S$",
      max: 1000,
      caseId: "CASE 03 · SEPHORA SG",
      ranks: [
        { min: 95, name: "Master Planner", line: "Airtight. Every call is backed by evidence, and the money goes where the value is." },
        { min: 85, name: "Field Strategist", line: "Sharp work. A couple of calls took a second look, but the dossier holds up." },
        { min: 70, name: "Audience Detective", line: "You found the audience. Tighten the evidence and the budget call and you're there." },
        { min: 50, name: "Signal Seeker", line: "You can see the signals. Now separate them from the noise more often." },
        { min: 0, name: "Rookie Investigator", line: "The case is closed, but it's thin. Run it again: the method sticks fast." }
      ],
      brief: {
        title: "Sephora · new-shopper discovery",
        stamp: "Incomplete",
        from: "From: Sephora brand team (illustrative)",
        body: "Creative's done. Media can't spend until someone works out who this is for.",
        note: "Illustrative brief built around the session's Sephora discussion. Not a real Sephora brief."
      },
      objective: "Work out who Gen Z women at the start of their beauty journey really are, what moves them and how many we can reach in Singapore, before any of the S$60,000 moves.",

      stages: [
        {
          id: "case", code: "01", name: "The Case File", alias: "Open the file",
          mechanic: "Investigation board",
          intro: "The brief is a mess of facts, wishes and someone's half-written media plan. Sort it onto the board, find the holes, and work out where you are.",
          tasks: [
            {
              id: "frags", type: "sort", layout: "board", pts: 60, cat: "evidence",
              h: "Sort the brief",
              ask: "Drag each line from the brief onto the board. Anything that's already deciding channels and budgets goes in the last box.",
              zones: [
                { id: "business", label: "Business context" },
                { id: "objective", label: "Campaign objective" },
                { id: "audience", label: "Audience" },
                { id: "media", label: "Media considerations" },
                { id: "plan", label: "Too early: that's the plan", tone: "warn" }
              ],
              items: [
                { id: "f1", text: "Sephora wants new shoppers in Singapore, not just more visits from existing members.", zone: ["business"], pts: 8, ok: "Business context first. Everything else hangs off this.", bad: "Read it again: this is why the business needs the campaign at all. That's context." },
                { id: "f2", text: "Beauty is crowded, and rivals run promotions constantly.", zone: ["business"], pts: 7, ok: "The market you're walking into. Context.", bad: "Competitors and the market are business context." },
                { id: "f3", text: "Grow awareness and consideration among people who don't shop with Sephora yet.", zone: ["objective"], pts: 8, ok: "That's the job the campaign has to do.", bad: "This is what success looks like: the objective." },
                { id: "f4", text: "Gen Z women, early in their beauty journey.", zone: ["audience"], pts: 8, ok: "The audience, in one line. Notice how little it tells you.", bad: "Who it's for: the audience box." },
                { id: "f5", text: "Mostly people who've never bought from Sephora.", zone: ["audience"], pts: 7, ok: "Audience. And it means your own site data won't know them yet.", bad: "This describes the people, so it's audience." },
                { id: "f6", text: "S$60,000 across social platforms, over eight weeks.", zone: ["media"], pts: 8, ok: "Budget, channel family and timing: media considerations.", bad: "Money, platforms and timing are media considerations." },
                { id: "f7", text: "Run 15-second TikToks to women 18–24, S$20,000 in weeks one to three.", zone: ["plan"], pts: 7, ok: "Good catch. Specific targeting and numbers is the media plan. Nobody's earned it yet.", bad: "Exact targeting, format and spend? That's the media plan, and it comes last." },
                { id: "f8", text: "Split it 40/40/20 across TikTok, Instagram and YouTube.", zone: ["plan"], pts: 7, ok: "Budget split before research. Parked, rightly.", bad: "A channel split with no research behind it is a plan arriving too early." }
              ],
              well: "You kept the brief's half-written media plan out of the context. That's the strategy-before-plan instinct.",
              improve: "Some media-plan detail slipped into the context. Strategy first: specific channels and numbers come last."
            },
            {
              id: "gaps", type: "multi", pts: 30, cat: "thinking", need: 3,
              h: "Find the holes",
              ask: "Three folders on the board are empty. What doesn't the brief tell you yet? Pick three.",
              options: [
                { id: "g1", text: "What motivates them, and how they research beauty products", correct: true },
                { id: "g2", text: "How many of them you can actually reach on each platform", correct: true },
                { id: "g3", text: "Where they spend their time online", correct: true },
                { id: "g4", text: "How much there is to spend" },
                { id: "g5", text: "What the campaign is trying to achieve" },
                { id: "g6", text: "Which market it's for" }
              ],
              ok: "Insight, size and where they are. That's the investigation.",
              bad: "The brief already covers budget, objective and market. Look for what nobody's said about the people.",
              well: "You spotted exactly what the brief was missing: insight, size and where the audience spends time.",
              improve: "Read briefs for what's absent. Budget and objective were there; the audience detail wasn't."
            },
            {
              id: "pin", type: "pin", pts: 30, cat: "thinking",
              h: "Pin where you are",
              ask: "The brief's been received and clarified. Drop the pin on the moment this investigation happens.",
              nodes: [
                { id: "brief", label: "Brief received", sub: "clarified with marketing" },
                { id: "research", label: "Research", sub: "content and media", correct: true },
                { id: "align", label: "Align", sub: "on the upfront strategy" },
                { id: "strategy", label: "Media strategy", sub: "approach, channels, budgets" },
                { id: "plan", label: "Media plan", sub: "targeting, numbers" },
                { id: "live", label: "Live", sub: "media team sets it up" }
              ],
              feedback: {
                brief: "That's done. The brief's in and clarified. What comes next?",
                research: "Right. Brief in, research next. The strategy can't exist until you've done this.",
                align: "Aligning needs something to align on. Research comes first.",
                strategy: "Strategy is built on research. You're one step early.",
                plan: "The plan needs targeting and numbers you don't have yet.",
                live: "Nothing's live. Nothing's even planned."
              },
              well: "You knew the research comes before strategy and plan.",
              improve: "Remember the running order: brief, research, align, strategy, plan, live."
            }
          ]
        },
        {
          id: "ask", code: "02", name: "The Interrogation", alias: "Question the audience",
          mechanic: "Question stack",
          intro: "The brand team is on a call and you get to ask. Some questions on the stack are research. Some are people jumping straight to channels. Ask the first kind. Park the second.",
          tasks: [
            {
              id: "stack", type: "sort", layout: "stack", pts: 120, cat: "evidence",
              h: "Ask or park?",
              ask: "Drag the top card to Ask or Park. Every question you ask unlocks a lead.",
              zones: [
                { id: "ask", label: "Ask now", sub: "audience research" },
                { id: "park", label: "Park it", sub: "channel or plan detail, later", tone: "warn" }
              ],
              leadNote: "Leads from the brand team call. Illustrative, and not proof: stage 03 checks them.",
              items: [
                { id: "q1", text: "What are their online behaviours?", zone: ["ask"], pts: 10, slide: true, lead: "Long evening scrolls. They save tutorials to try later.", ok: "One of the session's eight. Behaviour shapes targeting.", bad: "That's one of the eight audience questions from the session. Ask it." },
                { id: "x1", text: "Which TikTok ad format has the cheapest CPM?", zone: ["park"], pts: 10, ok: "Parked. A format question before you know the audience is the plan talking.", bad: "That's buying detail. It assumes TikTok and skips the audience. Park it." },
                { id: "q2", text: "What channels do they use?", zone: ["ask"], pts: 10, slide: true, lead: "Short-form video first, Instagram second, barely any Facebook.", ok: "Ask it. Notice the difference: it's about them, not about what you'd like to buy.", bad: "This one's about the audience's habits, not your media choice. It's one of the eight." },
                { id: "q3", text: "How do they research products online?", zone: ["ask"], pts: 10, slide: true, lead: "They search reviews and dupes, then watch someone try it.", ok: "Good. How they research tells you where to show up.", bad: "One of the eight. It's research about them." },
                { id: "x2", text: "Can we just reuse last year's media plan?", zone: ["park"], pts: 10, ok: "Parked. Last year's plan was for last year's audience.", bad: "Reusing a plan skips the research entirely. Park it." },
                { id: "q4", text: "What influences their decision to purchase?", zone: ["ask"], pts: 10, slide: true, lead: "Creator reviews, friends, and a low-risk first try.", ok: "Ask. Influences shape the message and the ad type.", bad: "This is straight from the session's list. Ask it." },
                { id: "q5", text: "What type of content do they consume?", zone: ["ask"], pts: 10, slide: true, lead: "Get-ready-with-me videos, skincare routines, honest reviews.", ok: "Ask. Content habits point to ad types.", bad: "One of the eight questions. It tells you which ads will feel native." },
                { id: "x3", text: "Should we put everything on Instagram?", zone: ["park"], pts: 10, ok: "Parked. Picking the channel before the audience is the classic shortcut.", bad: "That's channel selection, and you haven't found the audience yet. Park it." },
                { id: "q6", text: "What interests do they have affinity with?", zone: ["ask"], pts: 10, slide: true, lead: "Skincare, makeup tutorials, fashion.", ok: "Ask. Affinities become targeting later.", bad: "Interests are research. It's one of the eight." },
                { id: "q7", text: "Case studies for similar campaigns?", zone: ["ask"], pts: 10, slide: true, lead: "A past discovery push did best with creator-led content.", ok: "Ask. Someone's probably done this before.", bad: "Looking at similar campaigns is on the session's list. Ask." },
                { id: "x4", text: "How many posts a week should we run?", zone: ["park"], pts: 10, ok: "Parked. Frequency is a plan decision.", bad: "Posting frequency is execution detail. Park it." },
                { id: "q8", text: "What are their attitude towards brands?", zone: ["ask"], pts: 10, slide: true, lead: "Wary of polished ads. Loyal once something works.", ok: "Ask. Attitudes decide how hard you can sell.", bad: "The last of the eight. Attitudes matter before you pick a tone or a channel." }
              ],
              well: "You asked about the people before the platforms. All eight questions from the session made it onto your list.",
              improve: "Channel and plan questions slipped into your research. Ask about the audience first; channels come out of the answers."
            }
          ]
        },
        {
          id: "lab", code: "03", name: "Follow the Evidence", alias: "Research lab",
          mechanic: "Research lab",
          intro: "The leads are just leads. Take each research question to a tool that can answer it, collect what it turns up, then file every card on the board for what it really is.",
          tasks: [
            {
              id: "tools", type: "tools", pts: 90, cat: "tools",
              h: "Run the research",
              ask: "Pick a question, then open the tool that can answer it. Wrong tool? It'll tell you why.",
              tools: [
                { id: "gwi", name: "GWI", group: "Subscription", does: "Consumer research, behavioural data, market trends." },
                { id: "nielsen", name: "Nielsen", group: "Subscription", does: "Media measurement, audience insights, TV ratings." },
                { id: "semrush", name: "Semrush", group: "Subscription", does: "Keyword research, competitive analysis, SEO. Now part of Adobe." },
                { id: "meltwater", name: "Meltwater", group: "Subscription", does: "News, social and PR monitoring, sentiment." },
                { id: "ga4", name: "GA4", group: "Site analytics", does: "Who visits your own site or app: demographics, affinities, in-market segments." },
                { id: "trends", name: "Google Trends", group: "Free", does: "Search trends around categories and brands." },
                { id: "twg", name: "Think with Google", group: "Free", does: "Market research and digital trends. Now on business.google.com." },
                { id: "tiktok", name: "TikTok", group: "Free", does: "Viral trends, hashtags, comment sections." },
                { id: "meta", name: "Meta", group: "Free", does: "Meta Foresight (formerly Facebook IQ) studies and research." },
                { id: "reddit", name: "Reddit", group: "Free", does: "Unfiltered opinions and pain points in relevant subreddits." },
                { id: "forecast", name: "Platform forecasters", group: "Ad platforms", does: "TikTok Ads Manager, Meta, LinkedIn Campaign Manager, Google Ads: addressable audience size where you'd buy." }
              ],
              questions: [
                {
                  id: "r1", text: "What do beauty-curious Gen Z women in Singapore do and care about online?", from: "q1", tools: ["gwi", "nielsen"], pts: 18,
                  card: "e1",
                  why: { ga4: "GA4 only sees your own site's visitors, and this audience mostly hasn't visited yet. That's the point of a discovery brief.", forecast: "Forecasters count heads. They're silent on what people care about.", trends: "Trends shows what's searched, not who's searching or why.", reddit: "A few loud threads won't give you a profile. A lead at best.", tiktok: "You'd see what's viral, not who this audience is.", semrush: "Keywords and competitors, not people.", meltwater: "Conversation monitoring, not an audience profile.", meta: "Close, but a study someone else ran isn't a profile of your audience. Try a consumer research tool.", twg: "Broad market trends. You need the audience itself." }
                },
                {
                  id: "r2", text: "Who already lands on sephora.sg, and what are they in-market for?", from: "q3", tools: ["ga4"], pts: 18,
                  card: "e2",
                  why: { gwi: "GWI is the market. This question is about your own visitors. That's site analytics.", nielsen: "Nielsen measures media audiences, not your website's visitors.", forecast: "Forecasters size ad audiences. Your site data lives somewhere else.", _: "That tool can't see who visits sephora.sg. Site-side analytics can." }
                },
                {
                  id: "r3", text: "Is search interest in skincare routines rising or fading?", from: "q6", tools: ["trends", "semrush"], pts: 18,
                  card: "e3",
                  why: { gwi: "Possible, but slow and pricey for a search question. A search trends tool answers it free.", forecast: "Forecasters estimate reach, not interest over time.", ga4: "Your site can't see the whole market's searches.", _: "This is a search question. Use a tool that tracks searches." }
                },
                {
                  id: "r4", text: "How many of them can we actually reach on the platforms we'd buy?", from: "q2", tools: ["forecast"], pts: 18,
                  card: "e4",
                  why: { gwi: "GWI sizes the market. The reachable audience comes from the platform where you'll buy.", nielsen: "Research tools size markets. Platforms size what you can actually buy.", ga4: "Your site's visitors are a sliver of who you can reach.", _: "Size comes from the platforms where inventory is bought." }
                },
                {
                  id: "r5", text: "What are people saying about Sephora and its rivals right now?", from: "q8", tools: ["meltwater"], pts: 18,
                  card: "e5",
                  why: { reddit: "You'd get one corner of the conversation. A monitoring tool sees news and social together.", tiktok: "One platform's comments aren't the whole conversation.", ga4: "Site analytics can't hear what people say elsewhere.", _: "You need news, social and sentiment in one place: a monitoring tool." }
                }
              ],
              well: "You picked tools for the question in front of you: research tools for insight, platforms for size.",
              improve: "A few questions went to the wrong tool. Ask what you need to know first, then which tool can see it."
            },
            {
              id: "tags", type: "sort", layout: "board", pts: 90, cat: "evidence",
              h: "File the evidence",
              ask: "Drag each card into the column it belongs in. Two cards turned up on their own. Be careful with those.",
              zones: [
                { id: "insight", label: "Audience insight", sub: "qualitative" },
                { id: "size", label: "Audience size", sub: "quantitative" },
                { id: "context", label: "Context", sub: "supporting information" },
                { id: "weak", label: "Weak signal", sub: "needs validating", tone: "warn" }
              ],
              items: [
                { id: "e1", src: "GWI", text: "Over-index on short-form video and skincare tutorials. Rate honest reviews above brand claims.", zone: ["insight"], pts: 13, ok: "Who they are and what they value: insight.", bad: "This tells you what makes them tick, not how many there are. It's insight." },
                { id: "e2", src: "GA4", text: "Visitors aged 18–24 browse skincare most, arrive from social and drop off at checkout.", zone: ["insight"], pts: 13, ok: "Site analytics, qualitative read: insight.", bad: "It's about behaviour and interests, not reach. Insight." },
                { id: "e3", src: "Google Trends", text: "Searches for skincare routines in Singapore climbed steadily over 12 months, peaking around payday sales.", zone: ["context"], pts: 13, ok: "Useful, but it's about the category, not these people. Context.", bad: "It's about the market's searches, not who this audience is or how many you can reach. File it as context." },
                { id: "e4", src: "Platform forecaster", text: "About 200,000–250,000 reachable accounts: women 18–24, Singapore, on TikTok.", zone: ["size"], pts: 13, ok: "A number from the platform you'd buy on. That's size.", bad: "A reachable count is quantitative. Size." },
                { id: "e5", src: "Meltwater", text: "Conversation spikes around sales events. Rivals push discounts hard.", zone: ["context"], pts: 13, ok: "Market noise you need to know about. Context.", bad: "It's about the market and rivals, not your audience's profile. Context." },
                { id: "e6", src: "TikTok", text: "A viral video says “nobody under 25 pays full price for beauty any more”. 2M views. No data.", zone: ["weak"], pts: 13, unsolicited: true, ok: "Signal, not proof. Two million views isn't a sample.", bad: "Views aren't evidence. A loud claim with no data is a weak signal." },
                { id: "e7", src: "Reddit", text: "One thread, 40 comments: Sephora feels intimidating for first-timers.", zone: ["weak"], pts: 12, unsolicited: true, ok: "Worth following up. Forty people in one thread isn't the audience.", bad: "It might be true. It's also one thread. Weak signal until something backs it up." }
              ],
              well: "You filed the evidence cleanly: insight from research tools, size from the platform, and the viral noise kept in quarantine.",
              improve: "Some cards landed in the wrong column. Insight explains people, size counts them, and loud anecdotes are weak signals."
            }
          ]
        },
        {
          id: "ai", code: "04", name: "The AI Trap", alias: "Reality check",
          mechanic: "Fact-check desk",
          intro: "Someone ran the brief through an AI research agent. It's confident, fast and beautifully formatted. Check every claim against your evidence before any of it reaches the client.",
          report: {
            name: "DEEPBRIEF",
            meta: "AI audience brief · generated in 4 min · simulated",
            note: "A scripted AI report for the game. No AI is running here."
          },
          tasks: [
            {
              id: "claims", type: "sort", layout: "claims", pts: 120, cat: "thinking",
              h: "Check the claims",
              ask: "Open a claim to inspect it, then drag it to Verified, Hypothesis or Unsupported.",
              zones: [
                { id: "verified", label: "Verified", sub: "keep it" },
                { id: "hypothesis", label: "Hypothesis", sub: "keep, but test it" },
                { id: "unsupported", label: "Unsupported", sub: "reject or rework", tone: "warn" }
              ],
              items: [
                { id: "c1", text: "Short-form video is where this audience discovers beauty.", zone: ["verified"], pts: 17, check: "Matches your GWI card from stage 03, and the brand team's lead. Two sources agree.", ok: "Verified. Your own research backs it up.", bad: "Check your locker: the GWI evidence says the same thing. This one's earned its place." },
                { id: "c2", text: "Their visits to Sephora's site skew towards skincare.", zone: ["verified"], pts: 17, check: "Your GA4 card says 18–24 visitors browse skincare most.", ok: "Verified by your GA4 evidence.", bad: "You've got GA4 data saying exactly this. It's verified." },
                { id: "c3", text: "Creator reviews will outperform brand ads for this audience.", zone: ["hypothesis"], pts: 17, check: "Fits the leads (creator reviews influence them), but nobody has tested it.", ok: "A good hypothesis. Test it in-market before you bet the budget on it.", bad: "There's support for it, but no proof. Plausible and untested is a hypothesis." },
                { id: "c4", text: "Synthetic twins confirm 92% would pay 20% more for exclusive drops.", zone: ["unsupported"], pts: 17, check: "Source: the agent's own synthetic panel. Strat7 found synthetic willingness-to-pay ran 16% too high.", exhibit: "strat7", ok: "Rejected. Synthetic willingness-to-pay has run high before.", bad: "Synthetic respondents overstated willingness-to-pay by 16% in Strat7's work. This isn't evidence." },
                { id: "c5", text: "They all prefer clean beauty. Opinion is basically unanimous.", zone: ["unsupported"], pts: 17, check: "No source. Pew found AI twins flattened opinion: 98% versus 42% on one question.", exhibit: "pew", ok: "Rejected. Unanimous is what flattened AI opinion looks like.", bad: "Real audiences disagree. Pew found AI twins said 98% where people said 42%. Unsupported." },
                { id: "c6", text: "Interest in glass-skin routines will triple next quarter.", zone: ["unsupported"], pts: 17, check: "A forecast with no source. Strat7 found synthetic trend calls right only 47% of the time.", exhibit: "strat7", ok: "Rejected. A confident forecast with nothing behind it.", bad: "No source, a precise number, and AI trend calls were right less than half the time. Unsupported." },
                { id: "c7", text: "Price may put first-timers off.", zone: ["hypothesis"], pts: 18, check: "Echoes two weak signals: the Reddit thread and the viral TikTok. Worth testing.", ok: "Hypothesis. Run it past a survey or sales data.", bad: "Weak signals point this way, so don't throw it out. Don't call it verified either. Hypothesis." }
              ],
              well: "You treated the AI report like a first draft: kept what your evidence backs, flagged what needs testing, threw out the rest.",
              improve: "Some AI claims got more trust than they'd earned. If you can't point to evidence, it's a hypothesis at best."
            },
            {
              id: "cap", type: "slider", pts: 50, cat: "thinking",
              h: "Size the panel",
              ask: "You'll test the hypotheses with a 1,000-person survey. The client wants it fast, and the vendor can fill seats with synthetic twins. Use as many as the session's guidance allows, and no more.",
              min: 0, max: 600, step: 50, start: 400, sample: 1000, lo: 100, hi: 200,
              unit: "synthetic respondents",
              ok: "Inside the 10–20% cap. Fast enough, and still mostly real people.",
              low: "Safe, but slower than it needs to be. The guidance allows 10–20% of a sample.",
              high: "Over the cap. Above 10–20% of a sample, synthetic answers start steering your results.",
              well: "You kept synthetic respondents inside the 10–20% cap.",
              improve: "Synthetic respondents go up to 10–20% of a sample, no further."
            }
          ]
        },
        {
          id: "build", code: "05", name: "Build the Audience", alias: "Audience lab",
          mechanic: "Audience builder",
          intro: "Now rebuild the audience inside an ad platform. Every filter moves the estimate. Too loose and you pay for strangers. Too tight and there's nobody left to reach.",
          tasks: [
            {
              id: "builder", type: "builder", pts: 140, cat: "audience",
              h: "Find the sweet spot",
              ask: "Set the filters. Watch the estimate, the on-target share and the wasted spend. Lock it when it's right for the brief.",
              well: "Your audience was on target and still big enough to run. That balance is the whole game.",
              improve: "Your audience gave up too much relevance or too much scale. Find the overlap of the brief and enough people."
            },
            {
              id: "li", type: "linkedin", pts: 40, cat: "audience",
              h: "Side brief: LinkedIn",
              ask: "Sephora's corporate team wants HR and talent leaders in Singapore for a staff-gifting programme (illustrative). LinkedIn is built for this. Build it.",
              well: "Your LinkedIn audience cleared the 50,000+ LinkedIn recommends, with location set first.",
              improve: "Your LinkedIn audience could serve, but it sat under the 50,000+ LinkedIn recommends."
            }
          ]
        },
        {
          id: "invest", code: "06", name: "Who Deserves the Budget?", alias: "Investment room",
          mechanic: "Portfolio and budget",
          intro: "Five Sephora customers, one budget. Place each on the customer quality matrix, then decide where the money goes. The biggest crowd isn't automatically the best bet.",
          tasks: [
            {
              id: "matrix", type: "sort", layout: "matrix", pts: 60, cat: "investment",
              h: "Place the customers",
              ask: "Drag each customer to a quadrant. Across: how profitable they are to Sephora. Up: how much value they get back.",
              zones: [
                { id: "free", label: "Free riders", sub: "low profit · high satisfaction" },
                { id: "star", label: "Star customers", sub: "high profit · high satisfaction" },
                { id: "lost", label: "Lost causes", sub: "low profit · low satisfaction" },
                { id: "vulnerable", label: "Vulnerable customers", sub: "high profit · low satisfaction" }
              ],
              items: [
                { id: "p1", name: "The creator", slide: true, text: "Rarely shops, but buys a few key products and features them on TikTok and Instagram. High engagement. Tags Sephora, joins beauty challenges.", zone: ["star", "free"], pts: 12, ok: "Defensible. The deck leaves this one to the class: low direct spend says free rider, her influence says star. Your call goes in the dossier.", bad: "She's clearly happy with Sephora, so she's on the top row. Is her influence worth more than her spend? That's the call." },
                { id: "p2", name: "The deal-hunter", slide: true, text: "Hauls during promotions and sales. Loves free samples, birthday gifts and rewards. Waits for a deal. Buys high-end only when it's discounted.", zone: ["free"], pts: 12, ok: "Free rider: very happy, not very profitable. Textbook.", bad: "Takes every offer and rarely pays full price. Happy, yes. Profitable, no. Free rider." },
                { id: "p3", name: "The loyalist", slide: true, text: "Shops several times a year, loyalty member. Follows trends, engages with Sephora's social, reviews and tutorials. Buys bestsellers and launches, often at full price.", zone: ["star"], pts: 12, ok: "Star: gets real value, gives real value.", bad: "Frequent, full price and engaged. That's high profit and high satisfaction. Star." },
                { id: "p4", name: "The quiet regular", slide: false, text: "Buys full-price skincare every month. Has complained twice about late deliveries. Ignores Sephora's emails.", zone: ["vulnerable"], pts: 12, ok: "Vulnerable: valuable to Sephora, not getting much back. One bad week from leaving.", bad: "She pays full price every month, so she's profitable. But she's unhappy. Vulnerable." },
                { id: "p5", name: "The one-timer", slide: false, text: "Used a first-order code once, returned the product, never opened the app again.", zone: ["lost"], pts: 12, ok: "Lost cause. Little value either way.", bad: "No profit, no satisfaction. Cheap to reach, and still not worth much. Lost cause." }
              ],
              well: "You read customer quality from behaviour, not from how loud or how big each group is.",
              improve: "A couple of customers landed in the wrong quadrant. Ask two things: do they pay, and are they happy?"
            },
            {
              id: "alloc", type: "alloc", pts: 50, cat: "investment",
              h: "Split the budget",
              ask: "Share S$60,000 across the four quadrants. Watch reach and profit pull in different directions.",
              well: "Your split backed long-term value over cheap reach.",
              improve: "Too much of the budget chased reach. Free riders and lost causes look cheap, then give little back."
            },
            {
              id: "roi", type: "roi", pts: 30, cat: "investment",
              h: "Run the ROI",
              ask: "Use the session's formula on your own split. Round to the nearest whole percent.",
              well: "You ran the ROI formula correctly on your own numbers.",
              improve: "ROI is (Profit − Ad Spend) / Ad Spend: take the spend off the profit first, then divide by the spend."
            },
            {
              id: "why", type: "pick", pts: 20, cat: "investment",
              h: "Say why",
              ask: "The client asks why the money went where it went. Your one-line answer:",
              options: [
                { id: "w1", text: "We backed the customers who stay profitable over time, stars and the vulnerable ones worth keeping, not the cheapest reach.", correct: true, ok: "That's customer quality and long-term profitability in one sentence." },
                { id: "w2", text: "Free riders give the biggest reach for the money, so they got the most.", bad: "Reach isn't value. Free riders are happy because they pay so little." },
                { id: "w3", text: "We split it evenly so every segment feels included.", bad: "Even isn't neutral. It puts the same money behind customers who give back very different amounts." },
                { id: "w4", text: "Lost causes are cheap to reach, so they're good value.", bad: "Cheap to reach, and they give almost nothing back." }
              ],
              well: "Your rationale was about customer quality, not reach.",
              improve: "The rationale needs to be about long-term value, not reach or fairness."
            }
          ]
        },
        {
          id: "dossier", code: "07", name: "The Final Dossier", alias: "Case closed",
          mechanic: "Submission",
          intro: "Everything you've found goes into one file. Add what should happen next, check it over, and submit.",
          tasks: [
            {
              id: "next", type: "multi", pts: 70, cat: "recs", need: 3,
              h: "What happens next?",
              ask: "Pick the three recommendations for the next stage of media planning.",
              options: [
                { id: "n1", text: "Move to channel decisioning: use where they spend time to choose the platforms.", correct: true },
                { id: "n2", text: "Validate the AI hypotheses with real data: a survey, platform insights, sales.", correct: true },
                { id: "n3", text: "Agree the measurement plan before anything goes live.", correct: true },
                { id: "n4", text: "Launch now using the AI report's numbers." },
                { id: "n5", text: "Expand to all of Asia-Pacific for more reach." },
                { id: "n6", text: "Move the free-rider budget into bigger discounts." }
              ],
              ok: "The next stages in order, with the AI checked first. That's a plan someone can sign off.",
              bad: "Look at what comes after audience insight in the six stages, and what the AI report still owes you.",
              well: "Your next steps follow the six stages, with the AI claims validated first.",
              improve: "Next steps should follow the planning stages (channels, investment, measurement) and validate the AI first."
            }
          ]
        }
      ],

      builder: {
        floor: 20000, sweet: 60000, minRel: 0.55, sweetRel: 0.7,
        locations: [
          { id: "apac", name: "Asia-Pacific", base: 900000000, inTarget: 0.004 },
          { id: "sgmy", name: "Singapore + Malaysia", base: 22000000, inTarget: 0.16 },
          { id: "sg", name: "Singapore", base: 3600000, inTarget: 1 }
        ],
        platforms: [
          { id: "tiktok", name: "TikTok", factor: 0.75, unit: "accounts", fit: true, note: "TikTok counts accounts that saw ads in the last 30 days. Accounts, not people, and no under-18s." },
          { id: "meta", name: "Meta", factor: 0.95, unit: "people", fit: true, note: "With Advantage+ audience, your age and interest choices are suggestions. The estimate is the broad reachable pool." },
          { id: "linkedin", name: "LinkedIn", factor: 0.3, unit: "members", fit: false, note: "LinkedIn targets by job title, industry, company size and professional interests. Built for B2B and careers." }
        ],
        ages: [
          { id: "a18", name: "18–24", share: 0.17, w: 1 },
          { id: "a25", name: "25–34", share: 0.21, w: 0.25 },
          { id: "a35", name: "35–44", share: 0.2, w: 0 },
          { id: "a45", name: "45+", share: 0.42, w: 0 }
        ],
        women: 0.51,
        interests: [
          { id: "beauty", name: "Beauty & skincare", share: 0.3, prec: 0.8 },
          { id: "makeup", name: "Makeup tutorials", share: 0.2, prec: 0.85 },
          { id: "fashion", name: "Fashion", share: 0.35, prec: 0.55 },
          { id: "luxury", name: "Luxury goods", share: 0.1, prec: 0.5 },
          { id: "fitness", name: "Fitness", share: 0.25, prec: 0.3 },
          { id: "gaming", name: "Gaming", share: 0.3, prec: 0.1 }
        ],
        basePrec: 0.3,
        behaviours: [
          { id: "engaged", name: "Engaged with beauty content (30 days)", reach: 0.4, sharpen: 0.4 },
          { id: "shoppers", name: "Online shoppers", reach: 0.6, sharpen: 0.85 }
        ],
        lifestyle: [
          { id: "students", name: "Students", reach: 0.45 },
          { id: "youngpro", name: "Young professionals", reach: 0.4 }
        ]
      },

      linkedin: {
        min: 300, rec: 50000,
        locations: [
          { id: "sg", name: "Singapore", base: 3000000, ok: true },
          { id: "apac", name: "Asia-Pacific", base: 260000000, ok: false }
        ],
        functions: [
          { id: "hr", name: "Human resources", share: 0.06, need: true },
          { id: "mkt", name: "Marketing", share: 0.08 },
          { id: "sales", name: "Sales", share: 0.1 }
        ],
        seniority: [
          { id: "any", name: "Any", share: 1 },
          { id: "mgr", name: "Manager and above", share: 0.35 },
          { id: "dir", name: "Director and above", share: 0.12 }
        ],
        narrow: [
          { id: "size", name: "Company size 1,000+", share: 0.3 },
          { id: "retail", name: "Industry: retail only", share: 0.04 }
        ]
      },

      invest: {
        quads: [
          { id: "star", name: "Stars", mult: 2.6, reachPerK: 900 },
          { id: "vulnerable", name: "Vulnerable", mult: 2.2, reachPerK: 700 },
          { id: "free", name: "Free riders", mult: 0.9, reachPerK: 2600 },
          { id: "lost", name: "Lost causes", mult: 0.3, reachPerK: 1500 }
        ],
        start: { star: 25, vulnerable: 25, free: 25, lost: 25 },
        fullAt: 1.2,
        note: "Illustrative: each quadrant's profit per S$1 over a year and reach per S$1,000 are invented to show the trade-off."
      },

      exhibits: {
        pew: { k: "Exhibit · Pew Research", h: "AI twins flattened opinion", stat: [98, 42], labels: ["AI twins", "Real people"], text: "On one question, AI twins answered 98% one way where real respondents split 42%." },
        strat7: { k: "Exhibit · Strat7", h: "Synthetic data ran hot", text: "Strat7 found synthetic willingness-to-pay 16% too high, and trend calls right only 47% of the time." }
      },

      recap: [
        { title: "Strategy before plan", text: "Context, audience, then channels. Specific targeting and numbers come last." },
        { title: "Insight and size", text: "Research tools explain people. Ad platforms count the ones you can reach." },
        { title: "AI drafts, data decides", text: "Validate AI hypotheses with real data. Synthetic respondents stay at 10–20% of a sample." },
        { title: "Reach isn't value", text: "Back customer quality. ROI = (Profit − Ad Spend) / Ad Spend." }
      ]
    },

    game: {
      name: "CONCEPT DRILL",
      tagline: "Twelve quick challenges in four rounds. Each round is harder and worth more.",
      bonus: 0.25,
      titles: [
        { min: 95, name: "Lead Investigator" },
        { min: 80, name: "Senior Planner" },
        { min: 60, name: "Field Analyst" },
        { min: 40, name: "Research Trainee" },
        { min: 0, name: "Still reading the brief" }
      ],
      stages: [
        {
          id: "warmup", label: "Round 01", title: "Insight or size", brief: "Three quick ones on the basics.", points: 50,
          challenges: [
            {
              type: "mcq", concept: "insight",
              prompt: "Audience insights are…",
              options: [
                { id: "a", text: "Quantitative information about potential reach" },
                { id: "b", text: "Qualitative information to understand the target audience better" },
                { id: "c", text: "The budget needed to reach an audience" },
                { id: "d", text: "A list of platforms" }
              ],
              answer: "b", hint: "Insight is about understanding, not counting.",
              explain: "Audience insights are qualitative information to understand the target audience better. Audience size is the quantitative side.",
              source: "Audience understanding"
            },
            {
              type: "mcq", concept: "insight",
              prompt: "Where is audience size best generated?",
              options: [
                { id: "a", text: "GWI and Nielsen" },
                { id: "b", text: "Google Analytics 4" },
                { id: "c", text: "The DSPs where inventory will be bought, such as Meta, DV360 and TikTok" },
                { id: "d", text: "Reddit" }
              ],
              answer: "c", hint: "Where would you actually buy the media?",
              explain: "Audience sizing is best generated from the DSPs where inventory will be bought, because they provide addressable audience sizes.",
              source: "Audience understanding"
            },
            {
              type: "mcq", concept: "lifecycle",
              prompt: "What does the media plan detail that the media strategy doesn't?",
              options: [
                { id: "a", text: "How, where and when to reach the audience" },
                { id: "b", text: "Specific channels and platforms, budget allocation and timing" },
                { id: "c", text: "The brand's marketing objectives" },
                { id: "d", text: "The creative idea" }
              ],
              answer: "b", hint: "Strategy is the approach; the plan is the execution.",
              explain: "The media strategy defines how, where and when. The media plan is its tactical execution: specific channels and platforms, budget allocation and timing.",
              source: "Media strategy vs media plan"
            }
          ]
        },
        {
          id: "call", label: "Round 02", title: "Make the call", brief: "Pick the best answer.", points: 75,
          challenges: [
            {
              type: "mcq", concept: "ai",
              prompt: "What does the slide recommend as a cap for synthetic respondents?",
              options: [
                { id: "a", text: "None: AI twins can replace surveys" },
                { id: "b", text: "50% of a sample" },
                { id: "c", text: "10–20% of a sample" },
                { id: "d", text: "Only for B2B research" }
              ],
              answer: "c", hint: "A small share, then validate.",
              explain: "Use AI to explore and form hypotheses fast, then validate with real data. Cap synthetic respondents at 10–20% of a sample.",
              source: "AI for audience insights"
            },
            {
              type: "mcq", concept: "sizing",
              prompt: "What does LinkedIn Campaign Manager need before it can serve a campaign?",
              options: [
                { id: "a", text: "At least 300 members, with location set" },
                { id: "b", text: "At least 1 million members" },
                { id: "c", text: "A lookalike audience" },
                { id: "d", text: "An Advantage+ setting" }
              ],
              answer: "a", hint: "There's a minimum and a recommendation.",
              explain: "Minimum 300 members to serve, 50,000+ recommended. Set location first: it is required.",
              source: "Audience sizing in the AI era"
            },
            {
              type: "mcq", concept: "quality",
              prompt: "A customer who takes every offer and discount, is very happy, but isn't very profitable, is a…",
              options: [
                { id: "a", text: "Star customer" },
                { id: "b", text: "Vulnerable customer" },
                { id: "c", text: "Free rider" },
                { id: "d", text: "Lost cause" }
              ],
              answer: "c", hint: "Happy, but riding on the promotions.",
              explain: "Free riders take advantage of all the offers, discounts and promotions, so they're very happy, but not very profitable.",
              source: "Customer quality"
            }
          ]
        },
        {
          id: "debug", label: "Round 03", title: "Spot the mistake", brief: "Someone's notes on the session have one error each.", points: 100,
          challenges: [
            {
              type: "spot", concept: "ai",
              prompt: "Notes on AI for audience insights. Which one is wrong?",
              statements: [
                "Deep research agents read hundreds of sources: always check the sources they cite.",
                "Pew found AI twins flattened opinion: 98% vs 42% on one question.",
                "Strat7 found synthetic willingness-to-pay was accurate to within 1%.",
                "Facebook IQ is now Meta Foresight."
              ],
              wrong: 2, hint: "Check the Strat7 figure.",
              explain: "Strat7 found willingness-to-pay 16% too high, and trends right only 47% of the time.",
              source: "AI for audience insights"
            },
            {
              type: "spot", concept: "sizing",
              prompt: "Notes on platform estimates. Which one is wrong?",
              statements: [
                "TikTok counts accounts that saw ads in the last 30 days, not people.",
                "With Meta's Advantage+ audience, interests are only suggestions.",
                "LinkedIn recommends 50,000+ members.",
                "Google Ads keyword forecast counts the people in your audience."
              ],
              wrong: 3, hint: "Keywords, not people.",
              explain: "Google Ads' keyword forecast predicts clicks, impressions and costs for keywords, and forecasts search volumes. It doesn't count people.",
              source: "Estimating audience size"
            },
            {
              type: "spot", concept: "insight",
              prompt: "Notes on audience understanding. Which one is wrong?",
              statements: [
                "Media wastage is exposure of media activity beyond the desired audience.",
                "Audience insights can inform targeting, messaging and channel decisions.",
                "Site-side analytics like GA4 can identify high-value audiences in your ecosystem.",
                "Audience size is best generated from subscription research tools like GWI."
              ],
              wrong: 3, hint: "Where do addressable sizes come from?",
              explain: "Audience size is best generated from the DSPs where inventory will be bought (Meta, DV360, TikTok). GWI is a research tool for insights.",
              source: "Audience understanding"
            }
          ]
        },
        {
          id: "flow", label: "Round 04", title: "Run the method", brief: "Put things in order and match them up. Every correct position scores.", points: 125,
          challenges: [
            {
              type: "order", concept: "mining",
              prompt: "The audience mining flow chart, in order.",
              items: [
                "Identify the target audience",
                "Define the audience on market insight tools",
                "Identify key audience behaviour and insights",
                "Define the audience on media buying platforms",
                "Identify key audience sizes and potential budget requirements"
              ],
              hint: "Insight tools before buying platforms.",
              explain: "Target audience, proxy on market insight tools, behaviour and insights, proxy on media buying platforms, then sizes and budget.",
              source: "Audience mining flow chart"
            },
            {
              type: "order", concept: "lifecycle",
              prompt: "The stages of media planning, in order.",
              items: ["Business context", "Audience insights", "Channel decisioning", "Investment decisioning", "Measurement plan", "Media plan"],
              hint: "It starts with the business and ends with the plan.",
              explain: "Business context, audience insights, channel decisioning, investment decisioning, measurement plan, media plan.",
              source: "The stages of media planning"
            },
            {
              type: "match", concept: "tools",
              prompt: "Match each free tool to what it's for.",
              categories: ["Search trends", "Unfiltered opinions", "Trending content", "Research synthesis"],
              items: [
                { text: "Google Trends", answer: "Search trends" },
                { text: "Reddit", answer: "Unfiltered opinions" },
                { text: "TikTok", answer: "Trending content" },
                { text: "AI chatbots", answer: "Research synthesis" }
              ],
              hint: "Each tool has one strength.",
              explain: "Google Trends: search trends around categories and brands. Reddit: unfiltered opinions and pain points. TikTok: viral trends and comments. AI chatbots: synthesising trends and concerns from public data.",
              source: "There are free ones available"
            }
          ]
        }
      ]
    }
  },

  /* ------------------------------------------------------------------------
     PLACEHOLDERS — sessions that haven't run yet or have no materials.
     Keep status "upcoming" and title null until the materials arrive.
     ------------------------------------------------------------------------ */
];

/* ------------------------------------------------------------------------
   WHO AM I?? — the personal section at the very end of the homepage.
   Edit anything here. Text written inside [square brackets] shows on the
   page as a marked placeholder, so nothing is made up: replace it with your
   own words (and drop the brackets) when you're ready.
   ------------------------------------------------------------------------ */
window.UNFOLD_WHOAMI = {
  title: "WHO AM I??",
  kicker: "Last fold · the person behind UNFOLD",
  hello: "Hi, I'm Srujathi. I made this.",
  folds: [
    {
      k: "Fold 01", h: "The person", kind: "cards",
      lead: "Off the clock, roughly in order of how fast I'll bring them up. Tap a card for the footnote.",
      cards: [
        { tag: "Fuel", t: "Coffee", p: "Less a drink, more a personality trait at this point.", more: "Any plan gets better with a coffee stop in it." },
        { tag: "16+ years", t: "Kuchipudi", p: "Kuchipudi is an Indian classical dance form, and I've been learning it for more than sixteen years.", more: "Still learning, still in love with it. At this point it's less something I do and more a part of who I am." },
        { tag: "Current obsession", t: "Solo travelling", wide: true, p: "Completely, unapologetically in love with it. Somewhere new, just me, figuring it out as I go, wrong turns included. The freedom of that never gets old.", more: "I'm usually planning the next trip before I've properly unpacked from the last one.", meter: "Next trip · planning in progress" },
        { tag: "Wardrobe lab", t: "Fashion & style", p: "Dresses, putting outfits together, and the small joy of a look that just works.", more: "Personal style is my favourite ongoing experiment. Not every experiment works. That's the fun part." },
        { tag: "The counterweight", t: "Yoga & Pilates", p: "The calm that balances out all that coffee.", more: "A reset button for body and brain." },
        { tag: "Non-negotiable", t: "Dogs", p: "I love dogs. That's it, that's the card.", more: "Yes, I will stop to say hi to yours." },
        { tag: "Always on", t: "Curiosity", p: "Creativity, culture, people, experiences. Mostly, I want to know what makes people tick.", more: "Fair warning: I ask a lot of follow-up questions." }
      ]
    },
    {
      k: "Fold 02", h: "Why UNFOLD", kind: "log",
      lead: "The patch notes nobody asked for.",
      log: [
        { v: "v0.1", t: "The assignment", p: "UNFOLD started as my weekly assignment update for the guest sessions in my Digital Platforms course. The job was simple: write up what I learnt from each session and share it." },
        { v: "v0.2", t: "The problem", p: "I didn't want to make another neat pile of notes that nobody opens twice. Least of all me." },
        { v: "v0.3", t: "The plot twist", p: "Somewhere in the middle of building it, I realised I was genuinely enjoying myself. Quite a lot, actually." },
        { v: "v1.0", t: "Insert coin", p: "So I borrowed from the retro games I love. The sessions became things you explore and play through, not just read about." },
        { v: "v2.0", t: "Where it is now", p: "Somewhere along the way it stopped being just an assignment update. It's something I come back to myself, send to friends and classmates, and leave open for anyone curious enough to wander in." }
      ],
      end: "A small weekly requirement, one entire website later. Scope creep, but the fun kind."
    },
    {
      k: "Fold 03", h: "What's next", kind: "snaps",
      lead: "Where I'm heading: experiential marketing and brand experiences. The kind of thing people don't just see, but step into, take part in, remember and tell their friends about. A few snapshots of how I got pointed this way. Tap one to develop it.",
      snaps: [
        { t: "Events", p: "Bringing people together, and watching an idea on paper turn into something people actually experience. Still one of my favourite things to see." },
        { t: "Client servicing", p: "Learning to understand brands, clients and people, and what it really takes to get an idea out of a meeting and into the world." },
        { t: "Marketing & campaigns", p: "Thinking about audiences: who they are, what they notice, and how a brand earns a real connection with them." },
        { t: "Building UNFOLD", p: "Taking an idea from a blank page to something people click, drag and play through. Turns out I really enjoy building things people get to take part in." }
      ],
      end: "Next stop: helping brands create experiences people take part in, feel connected to and remember long after they've gone home. I'm still exploring, still learning, and very much building towards it.",
      status: "Status · work in progress (the good kind)"
    }
  ],
  facts: [
    ["Name", "Srujathi Jayanthy"],
    ["Made", "UNFOLD"],
    ["From", "India"]
  ],
  linkedin: "https://www.linkedin.com/in/srujathi-jayanthy-47849821a/",
  cta: "Let's connect on LinkedIn"
};
