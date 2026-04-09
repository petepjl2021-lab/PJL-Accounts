# PJL Accounts — Practice Workflow Manager

A desktop app for UK accountancy practices to manage workflows, task tracking, and client trackers.

## Modules

- **Dashboard** — live overview of workload, deadlines, and pipeline
- **Clients** — client database with full detail view
- **Prospect Tracker** — pipeline from first contact to engagement
- **Client Onboarding** — AML/KYC, engagement letters, HMRC setup checklist
- **HMRC Authorisation Tracker** — 64-8 authorisations for SA, PAYE, CT, VAT, CIS, ITSA
- **Tax Return Tracker** — SA100, SA800, SA900, CT600, VAT returns with full progress workflow
- **Tasks** — priority task management linked to clients
- **Settings** — user management (Admin/Staff roles)

## Tech Stack

- **Desktop**: Electron (Windows .exe installer)
- **Frontend**: Next.js 14 (React + TypeScript)
- **Styling**: Tailwind CSS
- **Database**: SQLite via Prisma (local file, no server needed)
- **Auth**: NextAuth.js with bcrypt password hashing

## Development

### Prerequisites

- Node.js 18+

### Setup

```bash
npm install
npm run db:push       # Create/update SQLite database
npm run db:seed       # Load sample data (optional)
```

### Run (web browser mode)

```bash
npm run dev
# Open http://localhost:3000
```

### Run as Desktop App

```bash
npm run electron:dev
```

### Build Windows Installer

```bash
npm run electron:build
# Output: dist/PJL Accounts Setup.exe
```

## Default Login

After seeding:

| Role  | Email                        | Password   |
|-------|------------------------------|------------|
| Admin | admin@pjlaccounts.co.uk      | admin123   |
| Staff | staff@pjlaccounts.co.uk      | staff123   |

> **Change these passwords immediately after first login** via Settings → Change Password.

## Database

The SQLite database is stored at `./dev.db` (development) or in the app's data directory (production).

To reset all data:
```bash
rm dev.db
npm run db:push
npm run db:seed
```

## Sharing Data Across Computers

The app uses a local SQLite file. To share data across a team:

1. Place `dev.db` on a shared network drive
2. Set `DATABASE_URL="file:///path/to/shared/drive/pjl-accounts.db"` in `.env`
3. Each team member runs the app pointing to the same file

> Note: SQLite on a network share works best for small teams (2-5 users) with low concurrency.
> For larger teams with simultaneous editing, consider upgrading to PostgreSQL.
