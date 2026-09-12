# WP Wizard — LTD Company Accounts Working Papers

A standalone desktop app that turns your "LTD Company Working Papers" Excel template into a guided
wizard: pick which schedules a job needs, work through them one at a time, and export the finished
file as a single .xlsx styled like the original template.

## Modules

- **Dashboard** — every client, with a live view of jobs in progress / completed
- **Clients** — name, company number, accounting standard, and an optional folder path so exports
  save straight to the right place
- **Jobs** — one per accounting year end. Tick the schedules that apply (Trial Balance, Bank Rec,
  Fixed Assets, DLA, Corporation Tax, etc.), then the wizard walks through only those
- **Carry-forward** — starting a new job offers to bring forward last year's fixed asset register,
  DLA closing balance (as this year's opening), reserves, and prior-year TB comparatives
- **Paste-import** — paste a Trial Balance (or any grid schedule) straight from Xero, QuickBooks,
  Excel or a CSV export instead of typing it in row by row
- **Export** — one click produces a single .xlsx with a tab per included schedule, matching the
  original template's headers and formulas (live SUM/variance/NBV formulas, not just values)

## Tech Stack

Same stack as the main PJL Accounts app, but a fully separate installation, database and client
list — this doesn't touch that app's data.

- **Desktop**: Electron (Windows .exe installer)
- **Frontend**: Next.js 14 (React + TypeScript), Tailwind CSS
- **Database**: SQLite via Prisma (local file, no server needed)
- **Export**: ExcelJS

## Development

```bash
npm install
npm run db:push       # create the SQLite database
npm run db:seed       # optional: adds one example client
npm run dev            # http://localhost:3100
```

### Run as Desktop App

```bash
npm run electron:dev
```

### Build Windows Installer

```bash
npm run electron:build
# Output: dist/WP Wizard Setup.exe
```

## Exporting to a client folder

Set a **Client Folder Path** on the client record (e.g. a network drive path). When exporting from
the desktop app, if that folder exists on disk the file saves there directly with no dialog. If no
folder is set, or you're using the app in a browser, the usual Save As / Downloads behaviour
applies.

## Data

SQLite file at `./dev.db`. To reset everything:

```bash
rm dev.db
npm run db:push
npm run db:seed
```
