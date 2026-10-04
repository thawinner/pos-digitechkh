# POS Manager (Shift Supervisor) — UI/UX Spec

> **Portal ID:** `managerPortal`
> **Folder:** `src/manager/<feature>/<page>.html` (two levels below `src/`, `data-role-root="../.."`)
> **Date:** 2026-10-03 · **Status:** Built 2026-10-04 (see §12 for what differs from this spec)
> **Inputs:** [v1-role_cashier_pos.md](v1-role_cashier_pos.md) (permission table, workflow 4), [01-cashier-pos.md](01-cashier-pos.md) §3.3,
> [../research/pos-market-research.md](../research/pos-market-research.md) (cited as **R§n**), [../planning/cashier-improvements.md](../planning/cashier-improvements.md) (cited as **C n**)

The cashier sells. The manager covers everything the cashier is not allowed to do alone: approve, override, move cash,
review the close. This document defines the pages, the shared components and the data needed to build the role in this
prototype.

---

## 1. Role identity

| Property | Value |
|---|---|
| **Khmer role name** | «អ្នកគ្រប់គ្រងវេន». Already used on the Z-report signature block (`close-shift.html:790`). Decision D5 in the cashier plan |
| **Persona** | Supervises 1–4 registers in one branch. Splits time between the shop floor (tablet) and the back office (PC). Interrupted all shift long to approve things at a till. Wants: what needs me now, which register is short or overloaded, and who keeps generating exceptions |
| **Layout** | Standard sidebar portal (light), like the cashier's receipts / close-shift pages. **Not** Archetype A. The one exception is the override dialog, which appears on the cashier's dark terminal |
| **Accent** | Distinct from the cashier's teal, so a screenshot shows which role it is. Proposal: indigo `#4f46e5` for active nav, primary buttons and charts. Keep emerald / amber / rose for status |
| **Devices** | Must work at 1280 px (back office) and 768 px (tablet on the floor). 390 px should be usable for the approvals queue |

### Data rules

> **M-RULE 1 — BRANCH SCOPE:** sees every register, cashier and shift in **its own branch**, any date. Not other branches.

> **M-RULE 2 — NO COST:** like the cashier, never sees `costPrice`, margin or P&L (`standards/03` §products: cost is
> PM/CA/APAR/GM/SA only). Reports show selling prices, quantities and counts.

> **M-RULE 3 — NO SELF-APPROVAL:** a manager can't approve a request on a sale they rang up themselves, or override on their
> own shift. Same principle as `standards/02` ("no self-approval at any amount").

> **M-RULE 4 — APPROVE, DON'T EDIT:** the manager never edits a completed sale's lines or amounts. A correction is a new
> transaction (void, refund) with its own record. Every approval, rejection and override is logged with approver, time
> and reason, and can't be undone.

> **M-RULE 5 — BLIND IS FOR THE CASHIER:** the manager *does* see expected drawer amounts (dashboard, X-report). The
> cashier must not see them on the shared terminal before counting (**C1**).

---

## 2. Authority matrix

| Action | Cashier | Manager | Notes |
|---|:---:|:---:|---|
| Sell, scan, take cash / KHQR | ✅ | ✅ | |
| Remove a line / clear cart **before payment** | ✅ logged | ✅ | Event `line_removed` / `cart_cleared` (**C9**) |
| Hold / resume a sale | ✅ | ✅ | Discard needs a reason |
| Discount up to the cashier's limit | ✅ + reason | ✅ | Limit per cashier in settings |
| Discount above the limit | ❌ | ✅ PIN at the till | **C6** |
| Price override (line) | ❌ | ✅ PIN at the till | P2 |
| Void a completed sale | request | ✅ approve | On the spot or from the queue (**C5**) |
| Sales return / refund | request | ✅ approve | Original receipt required (decision D3) |
| Open drawer with no sale | ❌ | ✅ PIN | Needs hardware, P2 |
| Issue opening float | ❌ | ✅ | Cashier counts it in (**C3**) |
| Safe drop | ✅ starts it | ✅ confirms receipt | Unconfirmed drop blocks close (**R§4**) |
| Pay-out / pay-in | ❌ | ✅ | Reason + amount per currency |
| Close shift (blind count) | ✅ | — | |
| Review and countersign a closed shift | ❌ | ✅ | Note required above tolerance |
| Reopen a closed shift | ❌ | ✅ reason | Decision D6 (spec 01 says GM only) |
| X-report on an open shift | ❌ | ✅ | Read-only, nothing saved |
| Set rate of the day, limits, reason lists | ❌ | ✅ | All changes audited |
| Reset a cashier's PIN | ❌ | ✅ | |

---

## 3. Two ways to approve

The research is clear that both are needed (**R§1**, **R§7**).

### A. On the spot — override at the till

The cashier hits something that needs approval (discount above limit, void while the customer is still there, safe drop,
float). The terminal opens a dark full-screen dialog **on the cashier's screen**:

```
┌──────────────────────────────────────────────┐
│ 🔐  ទាមទារការអនុម័តពីអ្នកគ្រប់គ្រងវេន          │
│                                              │
│  សកម្មភាព   បញ្ចុះតម្លៃ 10%  · − $1.25          │
│  វិក្កយបត្រ   RCP-1003-0010 · ចន្ទ មករា          │
│                                              │
│  មូលហេតុ    [ ជ្រើសរើស ▾ ]  (custom dropdown)  │
│  អ្នកអនុម័ត  [ ជ្រើសរើស ▾ ]                     │
│  លេខសម្ងាត់  [ • • • • ]   ← big keypad       │
│                                              │
│  [ បោះបង់ ]                  [ អនុម័ត ✓ ]     │
└──────────────────────────────────────────────┘
```

- On-screen numeric keypad (touch). The PIN field is `type="password" inputmode="numeric"`, 4–6 digits.
- **3 wrong PINs** → the dialog locks for 60 s and logs `override_denied`.
- An approver equal to the current cashier is not offered (M-RULE 3).
- Success: toast «បានអនុម័តដោយ ‹name›», the action completes, and the audit entry gets `mode: 'onsite'`.
- Prototype only: the demo PIN for each mock manager appears in `data.js`. Don't show it in the UI.

### B. Remote — the approvals queue

Requests raised from the receipts list when no manager is present (**C5**) land in `pos_approvals` with
`status: 'pending'`. The manager handles them on the approvals page (§5.2). The cashier's row badge and notifications
update through the `storage` event (DoD §G).

---

## 4. Sidebar navigation (`PORTAL_CONFIGS.managerPortal`)

| # | id | Label | Icon (MDI) | href (relative to `src/`) | Badge |
|---|---|---|---|---|---|
| 1 | `dashboard` | ផ្ទាំងគ្រប់គ្រង | `mdi:view-dashboard-outline` | `manager/dashboard/dashboard.html` | — |
| 2 | `approvals` | សំណើរង់ចាំអនុម័ត | `mdi:shield-check-outline` | `manager/approvals/approvals.html` | pending count (amber) |
| 3 | `shifts` | វេន និងបញ្ជរគិតលុយ | `mdi:cash-register` | `manager/shifts/shifts.html` | closed shifts awaiting review |
| 4 | `cash` | ចលនាសាច់ប្រាក់ | `mdi:safe` | `manager/cash/cash.html` | unconfirmed drops |
| 5 | `exceptions` | ករណីមិនប្រក្រតី | `mdi:alert-octagon-outline` | `manager/exceptions/exceptions.html` | — |
| 6 | `reports` | របាយការណ៍លក់ | `mdi:chart-box-outline` | `manager/reports/sales-report.html` | — |
| 7 | `settings` | ការកំណត់ | `mdi:cog-outline` | `manager/settings/settings.html` | — |

`policyNote`: «មើលឃើញគ្រប់វេនក្នុងសាខា · មិនមើលឃើញថ្លៃដើម · មិនអាចអនុម័តសំណើរបស់ខ្លួនឯង»

Check every label against `standards/05` before building, and add any new term there first (glossary maintenance rule).

---

## 5. Pages

Every list page uses: one `⋮` menu per row, the shared date-range picker (GEMINI §3), the empty state and the
"no results + «ជម្រះតម្រង»" state (DoD §E). Detail views are **full pages** (`view-*.html`), not modals (DoD §B).

### 5.1 Dashboard — `manager/dashboard/dashboard.html`

**Purpose:** what needs me now, and how is today going.

```
┌ KPI row ─────────────────────────────────────────────────────────────┐
│ លក់ថ្ងៃនេះ $1,240 │ វិក្កយបត្រ 142 │ មធ្យម $8.73 │ សំណើរង់ចាំ 3 (amber) │
├ Register board ─────────────────────────────┬ Approvals (top 5) ──────┤
│ ┌ POS-01 ─────────┐ ┌ POS-02 ─────────┐      │ 10:42 លុបចោល $12.00   ⋮ │
│ │ ● កំពុងបើក        │ │ ● រង់ចាំត្រួតពិនិត្យ  │      │ 10:30 ប្រគល់វិញ $3.50  ⋮ │
│ │ ចន្ទ មករា 07:30    │ │ សុខ ដារ៉ា 14:00   │      │ …                      │
│ │ $640 · 71 វិក្កយបត្រ│ │ ខុសគ្នា −$3.00    │      ├ Exceptions today ───────┤
│ │ ថតប្រាក់ ▓▓▓▓░ $430│ │                  │      │ លុបចោល 2 · ប្រគល់វិញ 1   │
│ │ ព្យួរ 1           │ │                  │      │ បញ្ចុះលើសកំណត់ 1 · …     │
│ └─────────────────┘ └─────────────────┘      │                          │
├ Sales by hour (ECharts bar) ────────────────┴──────────────────────────┤
└──────────────────────────────────────────────────────────────────────────┘
```

- **Register card**:
  - status chip («កំពុងបើក» emerald, «រង់ចាំត្រួតពិនិត្យ» amber, «បានបិទ» slate, «មិនទាន់បើក» slate outline)
  - cashier, opened at, sales and count
  - **estimated cash in drawer vs. the drawer limit** as a bar, which turns rose over the limit with «ត្រូវផ្ទេរចូលទូដែក»
  - held-sale count and minutes since the last sale
  - a **shifts-today timeline** under the card: one segment per shift template (done / open / upcoming), amber if the
    open shift has run past its end time, rose past 12 h (legal cap, **R§11**)
  - ⋮ menu: «មើលវេន», «របាយការណ៍ពាក់កណ្តាលវេន» (X-report), «ចេញប្រាក់បាតថត» when no shift is open
- **Approvals panel:** oldest first, age in minutes (rose after 10 min). Tapping opens the request page.
- **Exceptions strip:** today's counts per type. Each links to the exceptions page filtered to that type.
- Sales by hour is an ECharts bar chart (the 2026-10-04 override allows ECharts on dashboards); the current hour is highlighted. Payment-method split is an ECharts donut with a legend:
  USD cash / KHR cash / KHQR.

### 5.2 Approvals — `manager/approvals/approvals.html` + `view-request.html`

**List:**
- Tabs «រង់ចាំអនុម័ត (n)» / «បានអនុម័ត» / «បានបដិសេធ», plus a date range and a cashier filter.
- Columns: ម៉ោង · ប្រភេទ (លុបចោល / ប្រគល់ទំនិញវិញ / បញ្ចុះតម្លៃ / បើកវេនឡើងវិញ) · វិក្កយបត្រ · អ្នកគិតលុយ · ទឹកប្រាក់ · មូលហេតុ · រយៈពេលរង់ចាំ · ⋮
- ⋮ → «មើលលម្អិត», «អនុម័ត», «បដិសេធ». Approve and reject from the list still go through the same confirm and PIN.

**`view-request.html?id=…`:**
- Left: the original receipt rendered with `receiptHtml(sale)` (the 80mm layout, scaled), with returned lines highlighted for a refund.
- Right:
  - request card: type, amount, reason, cashier, time raised
  - **context**: this cashier's voids, refunds and discount overrides today and this week, next to the team average
    (**R§6**: compare with peers)
  - actions:
    - «អនុម័ត»: `showCustomConfirm()` then the manager PIN
    - «បដិសេធ»: `showReasonPrompt()`, reason required
- After a decision: status badge, approver, time. Buttons are **hidden**, not disabled (DoD §E). The cashier gets a
  notification.
- Effects of approval:
  - **void** → sale `status: 'voided'`
  - **refund** → sale gains a `returns[]` entry, and a cash refund lowers expected cash (**C12**)
  - **reopen** → shift `status: 'open'`, with `reopenedBy` and `reason`

### 5.3 Shifts — `manager/shifts/shifts.html` + `view-shift.html`

**List:**
- Filters: date range, cashier, register, status.
- Statuses:

  | Status | Khmer | Colour |
  |---|---|---|
  | open | «កំពុងបើក» | emerald |
  | closed, not yet reviewed | «រង់ចាំត្រួតពិនិត្យ» | amber |
  | reviewed | «បានត្រួតពិនិត្យ» | indigo |
  | reopened | «បានបើកឡើងវិញ» | sky |

- Columns: កាលបរិច្ឆេទ · វេន · បញ្ជរ · អ្នកគិតលុយ · បើក–បិទ · លក់សរុប · ភាពខុសគ្នា (USD and KHR, coloured by tolerance) · ស្ថានភាព · ⋮
- Default sort: awaiting review first, then newest.

**`view-shift.html?id=…`:**
- **Header:** shift id, cashier, register, times, status.
- **Sections:**
  1. **Reconciliation per currency** (USD and KHR side by side):
     float, cash sales, change given, refunds, payouts, drops, pay-ins, **expected**, **counted**, **variance**.
     Uses the formula in **C12**.
  2. **Count detail:** denomination table, plus the first count if the cashier recounted (**C1**).
  3. **Cashier's explanation** if the variance is over tolerance.
  4. **Exceptions in this shift:** voids, refunds, overrides, line removals, held sales discarded. Each links to its receipt.
  5. **Cash movements:** float issued, drops (confirmed or not), payouts.
- **Actions:**
  - «ចុះហត្ថលេខាត្រួតពិនិត្យ»: PIN. A note is **required** when the variance exceeds tolerance.
    Blocked while a drop is unconfirmed.
  - «បើកវេនឡើងវិញ»: reason + PIN, audited.
  - «បោះពុម្ព»: A4 Z-report with **both** signature blocks filled (cashier at close, manager at review).
- An **open** shift shows the same page as an **X-report**: live figures, a banner «របាយការណ៍ពាក់កណ្តាលវេន · មិនទាន់បិទ»,
  no countersign, and nothing saved (**R§4**).
- Move `renderZReport()` out of `close-shift.html:717` into a shared script so both roles print the same document.

### 5.4 Cash movements — `manager/cash/cash.html` + `create-movement.html`

**Purpose:** follow every dollar and riel that moves outside a sale.

- **Top:** safe balance per currency (USD, KHR) and unconfirmed drops (amber).
- **Log:** time · ប្រភេទ (ចេញប្រាក់បាតថត / ផ្ទេរចូលទូដែក / ដកប្រាក់ចំណាយ / បញ្ចូលប្រាក់បន្ថែម / ដាក់ប្រាក់ចូលធនាគារ) ·
  បញ្ជរ / វេន · USD · KHR · ធ្វើដោយ · ទទួលដោយ · ស្ថានភាព · ⋮
- **Two-sided records (R§4):**
  - The cashier's drop is created «រង់ចាំទទួល». The manager counts it and confirms with ⋮ → «បញ្ជាក់ការទទួល».
  - A mismatch needs a reason, and the difference posts to that shift's variance.
  - The float the manager issues is matched by the cashier's opening count (**C3**).
- **`create-movement.html`** (full page, not a modal):
  - type, register/shift (custom dropdown), amount per currency (denomination helper optional), reason (required for
    payouts), receipt/reference no. for payouts.
  - Save → `showCustomConfirm()` → PIN.

### 5.5 Exceptions — `manager/exceptions/exceptions.html`

**Purpose:** find patterns, not single events (**R§6**).

- **Filters:** date range (default last 7 days), register, exception type.
- **Main table, one row per cashier:**
  - Columns: transactions, voids (n / $ / % of sales), refunds (n / $), discount overrides (n / $), line removals,
    carts cleared, held sales discarded, wrong-PIN attempts, sum of variances (USD, KHR).
  - Cells **≥ 2× the team average** turn amber, **≥ 3×** rose. A footer row shows the team average.
- **"By approver" table:** for each manager, approvals, rejections and approval rate. A 100 % approval rate on a high
  volume is itself a signal (**R§6**, Toast "by approver").
- **Drill-down:** clicking a cell lists the events (time, receipt, amount, reason, approver). ⋮ → «មើលវិក្កយបត្រ».
- **Timing flags:** sales before opening, after closing, or within 10 min of a shift change get a clock badge.
- This is a Reports-style page, so ECharts is allowed (DoD §B). A small multiples bar per exception type is enough.

### 5.6 Sales report — `manager/reports/sales-report.html`

- Date range, register and cashier filters.
- **Views (tabs):** by day, by hour, by cashier, by category, by payment method, top products.
- **Measures:** gross, net, VAT, discount, transactions, average ticket, items. **Selling prices only** (M-RULE 2).
- **Print:** A4 via `@media print`, with the 4-signature block per GEMINI §12 if it counts as an official document.
  Otherwise a plain report header.

### 5.7 Settings — `manager/settings/settings.html`

Grouped cards. Each save is confirmed and audited (old → new, who, when).

| Setting | Default | Used by |
|---|---|---|
| Shift templates per register «គំរូវេន» (code, Khmer name, start, end); each ≤ 8 h normal, never > 12 h | 2: «វេនព្រឹក» 07:00–14:00, «វេនរសៀល» 14:00–21:00 (3 for 24-hour shops) | open-shift, terminal reminder, dashboard timeline (**C22**, **R§11**) |
| Rate of the day «អត្រាប្ដូរប្រាក់ថ្ងៃនេះ» (+ optional NBC official reference) | 4,100 ៛ | every sale stamps it (**C7**) |
| Discount limit per cashier | 5 % | terminal (**C6**) |
| Variance tolerance | $5.00 / 20,000 ៛ | close-shift, shift review |
| Drawer cash limit before drop | $500 / 2,000,000 ៛ | terminal banner (**C13**), dashboard bar |
| KHQR expiry | 300 s | KHQR overlay (**C10**, **R§8**) |
| Held sales per shift | 5 | terminal (**C4**) |
| Reason lists: void, return, discount, payout, hold discard | seed lists | every reason prompt |
| Quick keys (favourite products) | — | terminal (**C11**) |
| Staff: cashiers and managers, active flag, PIN reset | — | override, open shift |

---

## 6. Shared components (`shared/scripts/ui-components.js`)

| Function | Returns | Notes |
|---|---|---|
| `showManagerOverride({ action, amount, receiptId, reasons, cashierId })` | `Promise<{ approverId, reason } \| null>` | §3A. Dark styling when `body#posPortal`, light otherwise. Writes the audit entry itself |
| `showPinPad({ title, userId })` | `Promise<boolean>` | Used by the override, the countersign and settings saves |
| `statusChip(code)` | HTML | Uses glossary colours, so pages don't hand-write badge classes (DoD §D) |

The existing `showReasonPrompt()` and `showCustomConfirm()` cover the rest.

---

## 7. Data

### 7.1 Keep the cashier's shift lock real by not shipping the data

`data.js` says it holds *only* the current shift (its header comment). Keep that true:

- `shared/scripts/data.js`: shared helpers, products, the current shift, storage access. Loaded by both roles.
- **`shared/scripts/manager-data.js`** (new): mock history (other registers, past 14 days of shifts and sales, generated
  relative to today), managers, settings, aggregation helpers. **Loaded only by manager pages.**
- Manager script order: `ui-components.js` → `data.js` → `manager-data.js` → `portal.js` → inline script.

### 7.2 Storage (all `localStorage`, every record carries `shiftId`; see **C8**)

| Key | Content |
|---|---|
| `pos_shift_sales` | sales (moved from `sessionStorage`) |
| `pos_held_sales` | held carts |
| `pos_approvals` | `{ id, type, saleId, lines?, amount, reason, cashierId, shiftId, raisedAt, status, decidedBy?, decidedAt?, decisionNote?, mode }` |
| `pos_cash_movements` | `{ id, type, registerId, shiftId, usd, khr, reason, ref?, createdBy, createdAt, status, confirmedBy?, confirmedAt?, diff? }` |
| `pos_events` | `{ id, type, shiftId, saleId?, actorId, approverId?, at, detail }` (the exception source) |
| `pos_settings` | §5.7 values + `history[]` |
| `pos_shift_state_v2` | extend with `reviewedBy`, `reviewedAt`, `reviewNote`, `firstCount`, `reopenedBy`, `reopenReason` |

The "reset demo data" action must clear all of these keys.

### 7.3 Fields added to a sale

`cashierId`, `terminal`, `shiftId`, `fxRate`, `discountReason`, `discountApproverId`, `change: { usd, khr, roundingKHR }`,
`status: 'completed' | 'voided'`, `returns: [{ lines, amount, approvedBy, at }]`.
`receiptHtml()` must read the cashier, terminal and rate **from the sale** (**C7**).

### 7.4 Mock people

```js
const MANAGERS = [
  { id: 'MGR-01', name: 'សុខ វណ្ណា', initials: 'សវ', pin: '2468' },
  { id: 'MGR-02', name: 'ម៉ៅ ស្រីនាង', initials: 'មស', pin: '1357' }
];
const CASHIERS = [
  { id: 'CAS-01', name: 'ចន្ទ មករា', initials: 'ចម', discountLimit: 5 },   // the existing SHIFT cashier
  { id: 'CAS-02', name: 'សុខ ដារ៉ា', initials: 'សដ', discountLimit: 5 },
  { id: 'CAS-03', name: 'លី សុភា', initials: 'លស', discountLimit: 3 }
];
const REGISTERS = ['POS-01', 'POS-02', 'POS-03'];
```

Seed history so the exception page has something to find: give one cashier about 3× the team's void rate and one
shift a variance over tolerance that is still awaiting review.

---

## 8. Cross-role flows

```
VOID (manager absent)
Cashier: receipts ⋮ «ស្នើលុបចោលវិក្កយបត្រ» → reason → pos_approvals{pending} → row badge «រង់ចាំអនុម័ត»
Manager: sidebar badge +1 → approvals → view-request → «អនុម័ត» + PIN
         → sale.status = voided, event override_approved → cashier notification, row «បានលុបចោល»

DISCOUNT ABOVE LIMIT (manager present)
Cashier: types 10 % → showManagerOverride() on the terminal → manager picks reason, enters PIN
         → sale saved with discountApproverId → event discount{approver}

SAFE DROP
Terminal banner «សាច់ប្រាក់ក្នុងថតលើសកំណត់» → cashier records $300 → movement{pending}
Manager: cash page → counts → «បញ្ជាក់ការទទួល» (diff → shift variance)
Close-shift is blocked until confirmed

OPEN → CLOSE → REVIEW
Manager issues float (movement) → cashier open-shift counts it in + manager PIN
… shift …
Cashier blind close → status «រង់ចាំត្រួតពិនិត្យ»
Manager view-shift → reconciliation → note if over tolerance → «ចុះហត្ថលេខាត្រួតពិនិត្យ» → A4 print with both signatures
```

---

## 9. Build order

| Phase | Scope | Depends on |
|---|---|---|
| 1 · Foundation | C7, C8, C9; `manager-data.js`; `managerPortal` in `PORTAL_CONFIGS`; `showPinPad` / `showManagerOverride`; a role switch on `src/index.html` (no login page yet) | — |
| 2 · Approvals | §5.2 + C5 + C6 | 1 |
| 3 · Dashboard | §5.1 (register board, approvals panel, exceptions strip) | 1, 2 |
| 4 · Shift review | §5.3 + C1 + C3 + C12 + shared Z-report | 1 |
| 5 · Cash | §5.4 + C13 | 4 |
| 6 · Insight | §5.5 exceptions, §5.6 sales report | 1 (and seeded history) |
| 7 · Settings | §5.7, after which the hard-coded constants read from settings | 1 |

Each page passes [../standards/06-page-definition-of-done.md](../standards/06-page-definition-of-done.md), including §G (open
the cashier in a second tab and watch the badge change without a refresh).

---

## 10. Open decisions

| # | Question | Recommendation |
|---|---|---|
| M1 | Does `index.html` become a role picker? | Yes, two large tiles (cashier / manager) until a login page exists. Logout already goes to `index.html` |
| M2 | Can the manager also sell on a register? | Yes, on their own shift. M-RULE 3 then stops them approving their own exceptions; a second manager or GM must |
| M3 | Do variances become a cashier's personal liability? | Out of scope for software. Record the outcome note only; don't add a "deduct from salary" action without HR/legal input |
| M4 | Branch scope if a manager covers two branches | Single branch for the prototype. Add a branch switch in the header later |
| plus | D1–D7 in [../planning/cashier-improvements.md](../planning/cashier-improvements.md) §5 | |

---

## 11. Shift model

The word "shift" covers several things, and the system keeps them apart:

| Concept | Khmer | What it is | Who sets it |
|---|---|---|---|
| **Shift template** | វេន | A time window. Default: «វេនព្រឹក» 06:00–14:00, «វេនរសៀល» 14:00–22:00, «វេនយប់» 22:00–06:00 (24-hour shop). Shifts per day = opening hours ÷ about 8 h | Manager, in Settings → គំរូវេន |
| **Default shift** | វេនប្រចាំ | Each person's regular template, register and weekly day off | Manager, in the roster page (or Settings → បុគ្គលិក) |
| **Roster** | កាលវិភាគ | For each date and template: who works which register. Built from default shifts. The manager can change any date | Manager, in «កាលវិភាគវេន» |
| **Cover** | ជំនួសវេន | A roster entry that isn't the person's default. Marked «ជំនួស» | Manager (planned), or automatically when a cashier opens a shift they aren't rostered for, with manager PIN |
| **Drawer shift** | វេនបញ្ជរ | One cashier + one register + one drawer: open (counted float, manager PIN) → closed (blind count) → reviewed (manager countersign) | Cashier opens/closes, manager reviews |

Rules:

- **A template can have several cashiers**, each on their own register and drawer (one drawer, one accountable
  person; research §11). Two people never share a drawer. A mid-shift change is a close plus an open.
- **Breaks lock the terminal** with the cashier's own PIN. There is no count and no new shift.
- **Labour law guards:** a template longer than 12 h can't be saved (8–12 h shows an overtime warning). Opening a shift
  that would take a person over 12 h in a day is blocked. The roster shows weekly hours and flags anything over 48.
- **Login sends a person to their rostered register.** A manager with no roster entry gets the first free register.
- **Default staffing:** one cashier per shift, each on their own register (morning POS-01, afternoon POS-02, night
  POS-03): 8 h × 6 days = 48 h/week, exactly the legal limit. On each cashier's day off that shift is empty. The
  roster shows it in amber («ត្រូវរកអ្នកជំនួស») so the manager assigns a cover.
- **Night shift** crosses midnight. It belongs to the date it starts on, and the business day rolls over at the first
  template's start (06:00). Settings shows its night hours (22:00–05:00, paid at 200% under Cambodian labour law).

## 12. Build status (2026-10-04)

Everything in §§1–8 is built, plus these additions and deviations:

| Item | Status |
|---|---|
| Login page with PIN pad, session, page guards, logout | Added (spec M1 said role picker; a real login replaced it) |
| Profile images | Illustrated SVG avatars in `shared/assets/avatars/<id>.svg`, initials if missing |
| Roster page «កាលវិភាគវេន» + default shifts + covers | Added (§11) |
| Manager switches to the till | Sells on their own register; can't approve their own sales (M-RULE 3) |
| Demo PINs | Shown on the login page only, under a demo-info toggle, not inside the product screens |
| Change modes | Two: «ដុល្លារ + រៀល» and «រៀលទាំងអស់». An all-USD mode was dropped because coins don't circulate |
| Charts | ECharts everywhere via `posChart()` (`shared/scripts/charts.js`) |
| KHQR | In-terminal overlay with expiry and a stored QR hash; payment confirmation is manual (no Bakong API) |
| Decisions taken | D1 blind count yes · D2 no separate card tender · D3 not built (no cross-shift receipt lookup yet) · D4 nearest 100 ៛ · D5 «អ្នកគ្រប់គ្រងវេន» · D6 manager reopens with reason · D7 shifts are a setting, default 2 |
