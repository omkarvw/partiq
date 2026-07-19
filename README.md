# PartIq — UI Prototype

Industrial Precision design system (teal `#00685f`, navy sidebar, Public Sans + JetBrains Mono).

**PartIq** tracks customers (master), parts, enquiries / RFQs, quotations, customer responses, process steps, MHR-driven cost, G-code, and production signals.

## Run

```bash
cd part-management
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Login → Continue to dashboard.

Start with **Guide** in the sidebar (or the help icon) for a walkthrough of the product flow.

## Screens

| Route | Screen |
|-------|--------|
| `/login` | Login |
| `/guide` | Product guide — end-to-end flow for demos |
| `/dashboard` | Plant KPIs, commercial pipeline analytics, part-wise charts |
| `/customers` | Customer master list + create modal |
| `/customers/[customerId]` | Customer detail, linked parts & RFQs |
| `/parts` | Parts list + Create Part modal |
| `/parts/empty-demo` | Empty parts state |
| `/parts/part-mid-3060` | Part detail + process sequence + commercial summary |
| `/parts/part-brk-118/commercial` | Commercial hub (enquiries, quotations, responses) |
| `/parts/.../enquiries/[enquiryId]` | Enquiry / RFQ detail + custom fields |
| `/parts/.../quotations/[quotationId]` | Quotation detail + margin vs process cost |
| `/parts/.../responses/[responseId]` | Customer response detail |
| `/parts/part-mid-3060/files` | Files hub (grouped by process) |
| `/parts/part-mid-3060/processes/proc-cnc-1` | Process entry (MHR, time unit, Add field) |
| `.../viewer` | G-code program viewer |
| `.../audit` | Audit trail |
| `.../versions` | Process version history |
| `/settings` | Plant defaults placeholder |

Dummy data only — no database yet. Create forms demonstrate UX but do not persist.
