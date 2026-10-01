# Team Randomizer

Randomly divides **45 students into 15 teams of 3**. Upload a CSV, generate teams, lock them,
then download the result as CSV or PDF. Everything runs in the browser: no database, no server
upload.

## Project structure

```
team-randomizer/
  app/
    layout.tsx          Root layout, font, metadata
    page.tsx            All state and the upload -> generate -> lock -> export flow
    globals.css         Tailwind layers, glass style, animations
  components/
    Hero.tsx            Landing hero with the UPLOAD CSV button
    HeroMosaic.tsx      15 x 3 dot preview shown in the hero
    CompactHeader.tsx   Slim header with RESET once a CSV is loaded
    StatsBar.tsx        TOTAL STUDENTS / TOTAL TEAMS / STUDENTS PER TEAM
    UploadZone.tsx      Drag-and-drop area and upload error panel
    StudentPreview.tsx  Preview table of the uploaded students
    TeamCard.tsx        One team card (3 students)
    ActionBar.tsx       Shuffle again, lock/unlock, download CSV/PDF
    ConfirmDialog.tsx   Confirmation for unlock and reset
    Toast.tsx           Small confirmation messages
  lib/
    config.ts           45 / 15 / 3 constants
    types.ts            Student, Team and result types
    csv.ts              CSV parsing, validation and CSV export
    teams.ts            Fisher-Yates shuffle, team generation, validation
    pdf.ts              PDF export (jsPDF)
    download.ts         Browser download helpers
    storage.ts          Optional session restore (localStorage)
    hue.ts              Per-team accent colour
  public/sample-students.csv   Valid 45-student sample file
  tests/verify.ts              Automated checks (npm run verify)
```

## Install

Requires Node.js 18.18 or newer.

```bash
cd team-randomizer
npm install
```

To create the project from scratch instead, run
`npx create-next-app@15 team-randomizer --typescript --tailwind --app`
then `npm install papaparse jspdf geist` and
`npm install -D @types/papaparse tsx tailwindcss@3 postcss autoprefixer`,
and copy the files above over the generated ones.

## Run locally

```bash
npm run dev
```

Open http://localhost:3000 and upload `public/sample-students.csv` to try it.

## Verify

```bash
npm run verify   # 26 automated checks: CSV rules, shuffle quality, team invariants, export
npm run lint     # TypeScript type-check
```

## Build for production

```bash
npm run build
npm start
```

## Deploy to Vercel

Option A, from the command line:

```bash
npm install -g vercel
vercel          # first deploy (preview)
vercel --prod   # production deploy
```

Option B, from GitHub: push this folder to a repository, open https://vercel.com/new,
import the repository and press Deploy. Vercel detects Next.js automatically; no settings
or environment variables are needed.

## CSV rules

- File must end in `.csv`. Exactly 45 student rows are required.
- The name column is found automatically (`Name`, `Student Name`, `Full Name`, ...).
  A roll column (`Roll Number`, `Roll No`, `Reg No`, `ID`, ...) is optional.
- Column order does not matter; extra columns, blank rows and a UTF-8 BOM are ignored.
- Duplicate roll numbers are rejected. Without a roll column, duplicate names are rejected.
  Two students with the same name but different roll numbers are allowed (a warning is shown).

## Notes

- Randomisation uses Fisher-Yates driven by `crypto.getRandomValues` (falls back to
  `Math.random`). Teams are only generated when you press the button.
- The current session (CSV, teams, lock state) is saved in your own browser's localStorage so a
  refresh does not lose teams during an event. RESET clears it.
- The PDF uses built-in fonts, which cover Latin characters (including accents). Characters
  outside that range, such as Devanagari, print as "?" in the PDF; the CSV keeps them intact.
- Excel may drop leading zeros in roll numbers when opening the exported CSV. Import the
  column as Text, or use the PDF for sharing.
