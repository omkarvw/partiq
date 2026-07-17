# Part Management — UI Prototype

Industrial Precision design system (teal `#00685f`, navy sidebar, Public Sans + JetBrains Mono).

## Run

```bash
cd part-management
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Login → Continue to dashboard.

## Screens

| Route | Screen |
|-------|--------|
| `/login` | Login |
| `/dashboard` | Production signals + Est/Act chart |
| `/parts` | Parts list + Create Part modal |
| `/parts/empty-demo` | Empty parts state |
| `/parts/part-mid-3060` | Part detail + process sequence |
| `/parts/part-mid-3060/files` | Files hub (grouped by process) |
| `/parts/part-mid-3060/processes/proc-cnc-1` | Process entry (MHR, times, Add field, files) |
| `.../viewer` | G-code program viewer |
| `.../audit` | Audit trail |
| `.../versions` | Process version history |
| `/settings` | Plant defaults placeholder |

Dummy data only — no database yet. Partner review before schema work.
