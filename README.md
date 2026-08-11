# PartIq — Founder Demo Prototype

Industrial Precision design system (teal `#00685f`, navy sidebar, Public Sans + JetBrains Mono).

**PartIq** is a frontend-only decision prototype: a dummy factory calculation graph drives explainable Machine Hour Rate, impact analysis, and scenarios — while RFQs, quotations, process costing, and G-code remain as the commercial / shopfloor downstream.

## Run

```bash
cd part-management
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Login → Continue to dashboard.

Start with **Demo Guide** in the sidebar for the ~12 minute founder walkthrough.

## Demo spine

1. `/dashboard` — Decision KPIs (capacity, plant ₹/hr, profit, quotes at risk)
2. `/factory/machines/mch-brother-vmc` — Clickable MHR breakup (Brother VMC golden case)
3. `/impact` — Change electricity or utilization → live cascade
4. `/parts/part-mid-3060` — Derived MHR on processes + G-code still available
5. `/parts/part-mid-3060/commercial` — Live quote margins vs graph cost
6. `/scenarios` — Baseline / Night shift / Solar / Salary +15%

## Screens

| Route | Screen |
|-------|--------|
| `/login` | Login |
| `/guide` | Founder demo script |
| `/dashboard` | Decision dashboard |
| `/factory` | Factory overview + machines |
| `/factory/machines/[machineId]` | Explainable MHR |
| `/impact` | Impact lab |
| `/scenarios` | Scenario compare |
| `/customers` | Customer master |
| `/parts` | Parts list |
| `/parts/[partId]` | Part + process sequence (live graph cost) |
| `/parts/.../commercial` | RFQ / quotation / response hub |
| `/parts/.../processes/...` | Process entry (derived MHR) |
| `.../viewer` | G-code program viewer |
| `.../audit` | Audit trail |
| `.../versions` | Process version history |
| `/settings` | Formula legend + session assumptions |

Dummy data only — no database. Session lever/scenario edits reset on refresh or via **Reset baseline**.
