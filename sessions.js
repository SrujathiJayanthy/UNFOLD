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
     PLACEHOLDERS — sessions that haven't run yet or have no materials.
     Keep status "upcoming" and title null until the materials arrive.
     ------------------------------------------------------------------------ */
  { id: "s02", number: "02", status: "upcoming", title: null, theme: { motif: "blank" } },
  { id: "s03", number: "03", status: "upcoming", title: null, theme: { motif: "blank" } }
];
