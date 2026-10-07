# Production Build Plan: from prototype to a real POS

**Date:** 2026-10-07 · **Status:** draft for the team to review

> **Update 2026-10-07:** stack decided: Angular `web`, NestJS + TypeORM `api`, Express `file` service, PostgreSQL
> (`pos_db` + `pos_control`), in `Projects/pos/`. The live task list for that stack (110 tasks, with status) is the
> tracker at https://claude.ai/artifact/3w5zSfSihUg4z1C6WNjQnJ. Phases below still describe the order and reasoning.

The prototype in `src/` is a complete, clickable spec: 36 pages, three roles, and all business rules running in the
browser on `localStorage`. This plan turns it into a real product with a server, a database, real payments and real
hardware. It lists the work in build order, as tasks a developer can pick up.

**What carries over:** the screens, the Khmer wording, the flows, the business rules and the maths (`saleTotals`,
`splitChange`, `summarizeShift`, `onHandLevels`, payroll). The docs in `docs/spec/` remain the source of truth.
**What gets rebuilt:** storage, login, permissions, PINs, KHQR confirmation, printing and offline mode. In the
prototype these run in the browser, where they can't be trusted.

Sizes: **S** ≈ 1–2 days · **M** ≈ 3–5 days · **L** ≈ 1–2 weeks, for one developer.

---

## Rules for the real build

1. **The server decides.** Totals, change, discounts, permissions, stock and cash expected are computed or checked on
   the server. The browser only shows them.
2. **Nothing reaches a browser that the role may not see.** Cashier and manager API responses never include cost, other
   shifts' history (for cashiers) or PINs. The prototype keeps these apart by splitting files (`data.js` /
   `manager-data.js` / `admin-data.js`); the real build enforces it in the API.
3. **Money and stock are ledgers.** Sales, cash movements and stock moves are append-only. A correction is a new record
   (void, return, adjustment), never an edit. Stock on hand is derived, as in `onHandLevels()`.
4. **Every sensitive action is audited** (who, when, what, reason, approving manager) in a table the app can't update
   or delete from.
5. **Every sale has a client-generated ID** so a retry or an offline sync can't create it twice.
6. **Same UI rules as the prototype:** CLAUDE.md, GEMINI.md, `.ai/ui-rules.md` and
   `standards/06-page-definition-of-done.md` still apply to every screen.

---

## Phase 0 · Decisions and setup (1–2 weeks)

Nothing in later phases should start before P0-1 to P0-4 are answered.

| # | Task | Size | Done when |
|---|---|---|---|
| P0-1 | **Pick the stack.** Recommendation: reuse the eBMS backend stack if one exists, so one team runs both. Otherwise PostgreSQL + a TypeScript API (NestJS or Fastify) + a Vite SPA (Vue or React) with the same Tailwind config, served as a PWA | S | Decision written in this file |
| P0-2 | **Scope of version 1.** Single shop or multi-branch? Single tenant or SaaS for many shops? Recommendation: single shop, but put `tenant_id` and `branch_id` on every table from day 1 | S | Written down, signed by the owner |
| P0-3 | **KHQR provider.** Bakong Open API (NBC) vs. a bank gateway (ABA PayWay, ACLEDA, …). Needs a merchant account and API credentials, and that paperwork is slow, so start it now | M | Provider chosen, sandbox access requested |
| P0-4 | **Hardware list.** Till device (Windows PC, Android tablet, iPad?), 80mm printer model, cash drawer, barcode scanner, second screen for the customer display | S | Models bought for the dev bench |
| P0-5 | **Close open decisions:** D-P1 night rate 200 % vs 130 %, D-P3 shortage deductions, D-P4 NSSF / salary tax (ask an accountant), D3 refund from an earlier shift, M4 branch scope, VAT invoice rules (C16) | M | Every row in the spec decision tables has an answer |
| P0-6 | **Repo and environments:** monorepo (`apps/web`, `apps/api`, `packages/shared`), dev / staging / production, secrets store, domain | M | `main` deploys to staging automatically |
| P0-7 | **CI:** lint, type check, unit tests, build, preview deploy per pull request | S | A failing test blocks a merge |
| P0-8 | Keep the prototype live on Vercel as the reference; tag it `prototype-v1` | S | Tag pushed |

---

## Phase 1 · Foundation (3–4 weeks)

| # | Task | Size | Done when |
|---|---|---|---|
| P1-1 | **Database schema** from the localStorage keys (see the table at the end). Migrations tool, seed script built from `STAFF_SEED` / the catalogue | L | `migrate` + `seed` give the demo shop |
| P1-2 | **Shared logic package:** port `saleTotals`, `splitChange`, `summarizeShift`, `fxForDate`, `onHandLevels`, payroll maths to TypeScript with unit tests. Used by both API and UI | L | Tests cover the worked examples in the specs (change, variance, payroll §6.1) |
| P1-3 | **Login:** email or phone + password, hashed (argon2/bcrypt), session or short-lived JWT + refresh, 5 tries → 1 min lock, logout. Same screen as `index.html` | M | Login works; passwords never stored in plain text |
| P1-4 | **PINs:** 6-digit, hashed, unique per person, rate-limited; used only for manager approval and unlocking the till | M | Wrong PIN 5× locks that PIN; PIN never returned by any API |
| P1-5 | **Roles and permissions** in the API (cashier / manager / owner) following `spec/02` §2 and `spec/03` §2. Test every endpoint per role | L | A cashier token can't read another shift, costs or staff pay |
| P1-6 | **Audit log** table + middleware that writes one row per sensitive action | M | Owner audit page reads from it |
| P1-7 | **App shell:** port `portal.js` sidebar, header, theme, notifications, toasts, dialogs (`showManagerOverride`, `showReasonPrompt`, …), pager, list memory into components | L | Shell pages match the prototype at 1440 / 768 / 390 px, light and dark |
| P1-8 | **Settings service:** `posSettings()` on the server (shop info, VAT, exchange rate, change mode, discount limits, shift templates, banks, CFD messages) | M | Both settings pages save to the server |

---

## Phase 2 · Owner setup: staff and catalogue (2 weeks)

| # | Task | Size | Done when |
|---|---|---|---|
| P2-1 | Staff list + view-staff: add, edit profile, reset password / PIN, change role, deactivate, discount limit, pay settings | L | Matches `admin/staff/*`; every change audited |
| P2-2 | Products: price, active / paused, category, barcode, image upload, min stock | M | Paused products disappear from the till |
| P2-3 | Unit cost (owner only), cost history | S | Cost never appears in a non-owner response |
| P2-4 | Product import from CSV / Excel (a real shop has hundreds of items) | M | 500 products import with errors listed per row |

---

## Phase 3 · Cashier core: sell and close a shift (4–5 weeks)

The most important phase; a shop can start a pilot after it.

| # | Task | Size | Done when |
|---|---|---|---|
| P3-1 | Registers (tills) as records; roster-aware open-shift with `openShiftBlocker()` rules enforced in the API | M | Two people can't open the same register, even at the same second |
| P3-2 | Open shift: float count with `cashCounter`, manager PIN | M | Matches `cashier/shift/open-shift.html` |
| P3-3 | Terminal: product grid, categories, search, barcode input, cart, hold / resume, discount (manager override above the limit) | L | 1 sale in under 10 s with a scanner |
| P3-4 | Cash payment: USD + KHR, Riel change rounded to 100, rate stamped on the sale | M | Server recomputes totals and rejects a mismatch |
| P3-5 | **Sale endpoint:** idempotent (client UUID), receipt number sequence per register, writes sale + lines + stock moves in one transaction | M | Double-click / retry never makes 2 sales |
| P3-6 | Receipts page (current shift only), reprint, void / return requests | M | Cashier sees only own shift |
| P3-7 | Terminal lock / unlock with own PIN, safe drop | S | |
| P3-8 | Close shift: blind count, one recount, variance, Z-report (A4) | L | Expected cash per currency matches `summarizeShift` tests |
| P3-9 | Receipt printing v1 via browser `@media print` 80mm (silent printing comes in phase 8) | S | Prints on the bench printer |

---

## Phase 4 · Manager controls (3–4 weeks)

| # | Task | Size | Done when |
|---|---|---|---|
| P4-1 | On-the-spot override at the till (manager PIN), M-RULE 3: no approving own sales | M | |
| P4-2 | Approvals queue + view-request; approve / reject with reason; `applyApprovalToSale` on the server | L | Voids and returns write stock moves (restock or damaged) |
| P4-3 | **Live updates:** WebSocket or SSE for new requests, nav badges, dashboard | M | A request shows on the manager screen within 2 s |
| P4-4 | Shifts list + view-shift, review / countersign, reopen with reason | M | |
| P4-5 | Cash movements (safe drop, pay-out, float top-up) + safe balance | M | |
| P4-6 | Exceptions (variances, many voids, big discounts, …) computed on the server | M | Same rules as `manager-data.js` |
| P4-7 | Roster: templates, default shifts, covers, pins, labour-law guards (12 h / 48 h) | L | See `planning/shift-scheduling-ux.md` |
| P4-8 | Manager dashboard + sales report with ECharts | M | Figures match a SQL check |

---

## Phase 5 · Real KHQR payments (2–3 weeks, depends on P0-3)

| # | Task | Size | Done when |
|---|---|---|---|
| P5-1 | Bank accounts in settings (`payBanks`), one default | S | |
| P5-2 | Generate KHQR on the server (`buildKhqrPayload` port), with amount, currency, bill number, expiry | M | Scans in ABA, ACLEDA, Wing apps |
| P5-3 | **Automatic confirmation:** poll the Bakong / bank API by MD5 hash or receive a webhook; push "paid" to the terminal and customer display | L | Sale completes without the cashier pressing a button |
| P5-4 | Failure cases: expired QR, paid twice, paid wrong amount, network down → manager-approved manual confirm with reference | M | Each case has a screen and an audit row |
| P5-5 | Daily reconciliation report: KHQR sales vs bank settlement per bank | M | |

---

## Phase 6 · Stock (2–3 weeks)

Follow `planning/stock-management.md`; the data model is already decided.

| # | Task | Size |
|---|---|---|
| P6-1 | Stock moves table (sale, void, return, stock_in, adjust, count) and on-hand view / materialised query | M |
| P6-2 | Manager: stock list, stock-in, adjustment with reason, history | L |
| P6-3 | Stock count (blind count, variance, approval) | M |
| P6-4 | Owner: confirm stock-in cost, stock value report, shrinkage report | M |
| P6-5 | Low / out-of-stock status on the till (status only, no quantities) | S |

---

## Phase 7 · Owner reports and payroll (2–3 weeks)

| # | Task | Size |
|---|---|---|
| P7-1 | Owner dashboard, profit report (`saleProfit`, `adminDays`) as SQL / views | L |
| P7-2 | Audit log page with filters and paging (50 rows) | S |
| P7-3 | Work time from real shift open / close and lock events; payroll per `spec/04` | L |
| P7-4 | Payslip print / PDF; mark period paid; export to Excel for the accountant | M |
| P7-5 | Cashier own-hours view (`spec/04` §7.3) | S |

---

## Phase 8 · Hardware and offline (3–4 weeks)

| # | Task | Size | Done when |
|---|---|---|---|
| P8-1 | **Silent printing** to the 80mm printer (ESC/POS over USB / network). Options: QZ Tray, a small local print agent, or a native wrapper (Electron / Capacitor). Decide with P0-4 | L | Receipt prints in under 2 s with no dialog |
| P8-2 | Cash drawer kick through the printer; "no sale" open needs manager PIN and is logged (C21) | S | |
| P8-3 | Barcode scanner: keyboard-wedge handling, scale barcodes if the shop sells by weight | S | |
| P8-4 | Customer display on a second screen, kiosk mode (`planning/customer-display-setup.md`), fed by WebSocket instead of `storage` events | M | |
| P8-5 | **Offline mode (PWA):** cache catalogue, prices, settings, open shift; queue sales in IndexedDB; sync with idempotent IDs; banner «ធ្វើការដោយគ្មានអ៊ីនធឺណិត». KHQR is unavailable offline; cash only | L | Unplug the network for 1 hour, sell 50 sales, reconnect: all 50 arrive once, stock and Z-report are right |
| P8-6 | Conflict rules for offline: price changed meanwhile (sale keeps the price it was sold at), product paused, shift closed by a manager | M | Written + tested |

---

## Phase 9 · Hardening (2 weeks, run alongside phases 6–8)

| # | Task | Size |
|---|---|---|
| P9-1 | Security review: OWASP checks, rate limits, CSRF/CORS, session expiry, HTTPS only, penetration test of role boundaries | M |
| P9-2 | Backups (daily, tested restore), point-in-time recovery for the database | S |
| P9-3 | Monitoring: error tracking, uptime, slow queries, alerts to the dev team | S |
| P9-4 | Load test: busy-hour curve (`HOUR_WEIGHT`) × number of registers × 3 | S |
| P9-5 | End-to-end tests (Playwright) for: open shift → sell cash → sell KHQR → void with PIN → close shift → manager review | M |
| P9-6 | Khmer text and numerals check on every page; DoD checklist per page | S |
| P9-7 | Privacy: staff personal data, bank details and phone numbers access-limited and logged | S |

---

## Phase 10 · Pilot and launch (3–4 weeks)

| # | Task | Size |
|---|---|---|
| P10-1 | Install at one pilot shop: devices, printer, drawer, network, KHQR account | M |
| P10-2 | Load real data: products, prices, costs, staff, opening stock count | M |
| P10-3 | Training: one short Khmer guide + video per role (cashier, manager, owner) | M |
| P10-4 | Run in parallel with the shop's old method for 1 week; compare cash and stock every day | M |
| P10-5 | Fix list from the pilot, then go live; support contact and response time agreed | M |
| P10-6 | Write the owner's operating guide: daily close, what to do when internet / printer / KHQR fails | S |

---

## Prototype storage → database tables

| Prototype (`localStorage`) | Table(s) |
|---|---|
| `pos_staff`, `STAFF_SEED`, `pos_passwords`, `pos_pins` | `users`, `user_credentials` (hashed), `user_roles`, `staff_pay` |
| `pos_session`, `pos_login_guard` | `sessions`, `login_attempts` |
| `pos_settings` | `settings`, `shift_templates`, `bank_accounts`, `cfd_messages`, `exchange_rates` (per day) |
| `pos_catalog`, catalogue in `data.js` | `products`, `categories`, `product_prices` (history) |
| `pos_costs`, `pos_stock_costs` | `product_costs` (owner only) |
| `pos_roster` | `roster_entries`, `registers` |
| `pos_shifts` | `drawer_shifts` (open → closed → reviewed), `cash_counts` |
| `pos_shift_sales` | `sales`, `sale_lines`, `sale_payments` |
| `pos_held_sales` | `held_sales` |
| `pos_approvals` | `approval_requests` |
| `pos_cash_movements` | `cash_movements` |
| `pos_stock_opening`, `pos_stock_moves`, `pos_stock_counts` | `stock_moves`, `stock_counts`, `stock_count_lines` |
| `pos_events`, `pos_admin_log` | `audit_log` (append-only) |
| `pos_overlay` | not needed: decisions are written on the real records |
| `pos_cfd`, `pos_terminal_lock` | real-time channel, `terminal_state` |

Every table carries `tenant_id`, `branch_id`, `created_at`, `created_by`.

---

## Rough timeline

With 2–3 developers and one person testing in Khmer: phases 0–3 in about **3 months** gives a shop that can sell and
close shifts (a possible early pilot with cash only). Phases 4–7 add **2–3 months**, phases 8–10 another **2 months**.
About **7–8 months** to a full launch. Phases 5 (KHQR paperwork) and 8 (hardware) carry the most risk, so start their
research in phase 0.
