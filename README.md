# DIGITECHKH POS

A point-of-sale prototype for a small Cambodian retail shop, written entirely in Khmer. It is a static HTML/CSS/JS
site: there is no build step, no backend and no `package.json`. Every screen works, and every action changes real
state, which the browser keeps in `localStorage`.

It covers the whole day of a shop with three people roles:

| Role | Khmer | Who | Home page |
|---|---|---|---|
| **Cashier** | អ្នកគិតលុយ | Stands at one register and sells | `cashier/terminal/pos-terminal.html` |
| **Shift manager** | អ្នកគ្រប់គ្រងវេន | Runs the floor: approves, reviews shifts, plans the roster, manages cash | `manager/dashboard/dashboard.html` |
| **Owner (admin)** | ម្ចាស់ហាង | Owns the business: profit, staff, prices and shop rules | `admin/dashboard/dashboard.html` |

The project was split out of the eBMS repo (`ebms_digitechkh/frontend/roles/05-cashier-pos/`, commit `54d8e94`,
2026-10-02) and has grown its own manager and owner roles since.

---

## Contents

1. [Run it](#run-it)
2. [Demo accounts](#demo-accounts)
3. [What each role can do](#what-each-role-can-do)
4. [A day in the shop (end-to-end flow)](#a-day-in-the-shop)
5. [Pages](#pages)
6. [Money, currency and tax rules](#money-currency-and-tax-rules)
7. [Shifts and roster](#shifts-and-roster)
8. [Data model and storage](#data-model-and-storage)
9. [Demo data](#demo-data)
10. [Project structure](#project-structure)
11. [How a page is built](#how-a-page-is-built)
12. [UI standards](#ui-standards)
13. [Testing](#testing)
14. [Deploy](#deploy)
15. [What a real deployment still needs](#what-a-real-deployment-still-needs)
16. [Documentation](#documentation)

---

## Run it

```bash
python3 -m http.server 8000 --directory src
```

Open <http://localhost:8000>. That opens the login page: pick a person, then type a PIN.

Serve the site over HTTP. Under `file://`, browser storage is unreliable. To wipe all state and regenerate the demo
data, use the «កំណត់ទិន្នន័យគំរូឡើងវិញ» button on the login page, under «ព័ត៌មានសម្រាប់គំរូសាកល្បង».

## Demo accounts

| Person | Role | PIN | Default shift |
|---|---|---|---|
| ចន្ទ មករា | Cashier | 1111 | Morning 06:00–14:00 · POS-01 · Sunday off |
| សុខ ដារ៉ា | Cashier | 2222 | Afternoon 14:00–22:00 · POS-02 · Monday off |
| លី សុភា | Cashier | 3333 | Night 22:00–06:00 · POS-03 · Tuesday off |
| សុខ វណ្ណា | Shift manager | 2468 | Covers a register on a cashier's day off |
| ម៉ៅ ស្រីនាង | Shift manager | 1357 | Covers a register on a cashier's day off |
| ហេង ចាន់ថា | Owner | 9999 | Does not work the till |

The login page always shows the current PINs. If the owner resets someone's PIN, the list updates.

## What each role can do

Each role can see what the role below it sees, plus more. Two rules hold for the whole system:

- **Cost and profit are visible to the owner only.** `data.js` and `manager-data.js` contain no cost prices. Costs
  live in `admin-data.js`, which only owner pages load.
- **A cashier sees only their own shift.** `data.js` never holds other shifts' history, so the cashier's shift lock
  is real, not just hidden.

| Capability | Cashier | Manager | Owner |
|---|:-:|:-:|:-:|
| Sell, hold, take cash (USD/KHR) and KHQR | ✓ | ✓ (on a register) | – |
| Discount up to own limit | ✓ | ✓ | – |
| Request a void or return | ✓ | ✓ | – |
| Approve overrides, voids and returns (PIN) | – | ✓ (never their own sale) | ✓ |
| Open and close own shift, safe drops | ✓ | ✓ | – |
| Review and countersign closed shifts | – | ✓ | ✓ |
| Roster: default shifts, covers, days off | – | ✓ | ✓ |
| Cash office: safe, drops, payouts | – | ✓ | ✓ |
| Exceptions and sales reports | – | ✓ | ✓ |
| Daily exchange rate, quick keys, reason lists | – | ✓ | ✓ |
| Cash rules: variance tolerance, drawer limits, standard float | – | read-only | ✓ |
| Shift templates, KHQR timeout, hold limit, discount limits | – | read-only | ✓ |
| Profit, cost and margin | – | – | ✓ |
| Add staff, change role, reset PIN, deactivate | – | – | ✓ |
| Change prices and costs, pause products | – | – | ✓ |
| Full audit log | – | – | ✓ |

The sidebar shows which role you are in through its colour: navy for the cashier, indigo for the manager and dark
green for the owner. Its brand block switches between the views a person may use: owner ⇄ manager, and
manager ⇄ cashier. Page guards in `data.js` enforce access:

- `cashier/*` needs any session; an owner is sent to the owner home instead.
- `manager/*` needs a manager or owner session.
- `admin/*` needs an owner session.

Anything else redirects to `index.html?next=…`, and after login the user returns to that page when their role
allows it.

## A day in the shop

1. **Open shift.** The cashier logs in, and the register comes from the roster. They count the float by note (USD
   and KHR), and a manager confirms with a PIN. With no rostered shift, the page offers a cover shift on a free
   register.
2. **Sell.** Scan a barcode (a scanner that types plus Enter works), tap a product tile or a quick key, or search.
   Then choose the payment:
   - **Cash:** USD, KHR or both. Change is split into dollars plus Riel rounded to 100 ៛.
   - **KHQR:** a timed QR code (simulated; the cashier confirms payment by hand).

   Receipts print at 80 mm.
3. **Exceptions at the till.**
   - A discount above the cashier's limit needs a manager PIN on the spot.
   - Voids and returns are approved on the spot or sent to the approvals queue.
   - Each of these needs a reason from the configured list.
4. **Cash control.** When the drawer passes its limit, the cashier is asked to make a safe drop. The till locks
   during breaks.
5. **Close shift.** A blind count: the cashier does not see the expected amount and gets one recount. The system then
   prints the Z-report (A4) with the per-currency variance.
6. **Review.** The manager reviews the closed shift and countersigns it, or reopens it. Large variances show up on
   the dashboard and in the exceptions report.
7. **Owner.** The owner checks:
   - revenue, gross profit and margin against the same weekday last week;
   - cash variance by person;
   - low-margin products.

   The owner adjusts prices and costs, manages staff, and reads the audit log of everything above.

## Pages

Every page sits at exactly `src/<role>/<feature>/<page>.html`.

**Login:** `index.html`, a three-step flow (person → PIN → enter) with a live register status panel. Three wrong
PINs lock the pad for 60 seconds.

**Cashier** (`cashier/`)

| Page | Purpose |
|---|---|
| `terminal/pos-terminal.html` | Product grid with photos or colour tiles, categories, search, quick keys, cart, hold and recall, discount, payment (cash with Riel change, KHQR), safe drop, lock |
| `receipts/receipts.html` | This shift's receipts, reprint, void and return requests |
| `shift/open-shift.html` | Float count by denomination, register choice, manager approval |
| `shift/close-shift.html` | Blind count with one recount, then the Z-report |

**Manager** (`manager/`)

| Page | Purpose |
|---|---|
| `dashboard/dashboard.html` | Live registers, today's sales by hour, to-do list (approvals, reviews, drops) |
| `approvals/approvals.html` · `view-request.html` | Approvals queue; approve or reject with a reason |
| `shifts/shifts.html` · `view-shift.html` | All shifts; review, countersign or reopen; variance per currency |
| `roster/roster.html` | Weekly roster: default shifts, covers, days off, weekly hours |
| `cash/cash.html` · `create-movement.html` | Safe balance, drops to confirm, payouts and transfers |
| `exceptions/exceptions.html` | Each cashier's voids, returns, overrides, removed lines and wrong PINs against the team average |
| `reports/sales-report.html` | Sales by day, hour, cashier, category, payment and product (no cost) |
| `settings/settings.html` | Exchange rate, quick keys, reasons; the owner's rules shown read-only |

**Owner** (`admin/`)

| Page | Purpose |
|---|---|
| `dashboard/dashboard.html` | Revenue, gross profit, average basket and cash variance with comparison; 14-day profit chart; "needs attention" list; results by staff; top products by profit |
| `reports/profit-report.html` | Revenue (ex-VAT), cost, gross profit and margin by day, category, product and staff; prints on A4 |
| `staff/staff.html` | Add staff (generated PIN shown once), rename, change role, reset PIN, discount limit, deactivate or reactivate. Safeguards: you can't deactivate yourself, the shop always keeps one owner, and a person with an open shift can't be deactivated |
| `products/products.html` | Price, cost, profit per unit and margin for every product, with 14-day units sold. Price and cost dialogs preview the new margin while you type. You can pause or resume a product |
| `settings/settings.html` | Every setting: exchange rate, cash rules, shift templates, till limits, quick keys, reasons, history |
| `audit/audit.html` | Read-only log of approvals, settings, staff, catalogue, shift reviews and security events, filterable by type and person |

Pages for viewing or creating a record are full pages with a back button, never modals. Every table row has a single
⋮ menu.

## Money, currency and tax rules

- **Prices include VAT.** Shelf prices include 10 % VAT. `saleTotals()` breaks a sale down in this order: subtotal →
  down payment → special discount → VAT 10 % → grand total.
- **Two currencies.** Amounts are shown in USD and KHR. The manager sets the daily exchange rate, and every sale
  stores the `fxRate` it used.
- **Change.** `splitChange()` gives dollars plus Riel rounded to 100 ៛, as Cambodian shops do.
- **Price snapshot.** Every sale line stores `price`. A later price change never alters old receipts or reports.
  `linePrice(line)` reads it.
- **Profit (owner only).** Revenue is taken ex-VAT (`price / 1.10`), after discounts and returns, minus unit cost × qty.
  Voided sales count as zero.
- **Cash variance.** `summarizeShift()` computes the expected cash per currency (float + cash sales − change − drops −
  payouts). `varianceOf()` compares it with the count against the variance tolerance.

## Shifts and roster

The model has four layers (full detail in `docs/spec/02-manager-pos.md` §11):

1. **Shift template:** a time window. The defaults are morning 06:00–14:00, afternoon 14:00–22:00 and night
   22:00–06:00; the night shift runs overnight.
2. **Staff default:** each cashier's usual template, register and day off.
3. **Roster per date:** generated from the defaults. On a cashier's day off, a manager covers the register, marked
   `cover`. Managers can move people for a day.
4. **Drawer shift:** one cashier, one register, one drawer. Its states are open → closed → reviewed.

A login resolves its register from the roster (`MY_REGISTER`).

## Data model and storage

All state lives in the browser. Keys start with `pos_`:

| Key | Holds |
|---|---|
| `pos_session` | Logged-in person |
| `pos_settings` | Settings values plus change history (who, when, from → to) |
| `pos_staff` | Staff added by the owner plus changes (name, role, active) layered on the seed list |
| `pos_pins` | PINs reset by the owner |
| `pos_catalog` | Price and active-state edits per SKU |
| `pos_costs` | Unit-cost edits per SKU (owner only) |
| `pos_roster` | Roster changes per date and template |
| `pos_shifts`, `pos_shift_sales`, `pos_held_sales`, `pos_cash_movements`, `pos_approvals`, `pos_events` | Live records created while using the prototype |
| `pos_terminal_lock` | Locked till |
| `pos_overlay` | Manager decisions on generated history (reviews, approvals) |
| `pos_admin_log` | Owner actions (staff, PINs, prices, costs) |
| `pos_seed_v*`, `pos_mgr_seed_v*` | Seed version markers |

Session storage holds `pos_cart` and `pos_pending_khqr`. A `storage` event redraws other open tabs
(`window.onStoreChanged`), so the manager sees a cashier's request appear without a reload.

Scripts:

| File | Loaded by | Contains |
|---|---|---|
| `shared/scripts/ui-components.js` | all | Toast, confirm, reason prompt and picker, option dialog, form dialog, manager-PIN override, PIN confirm, number pad, dropdowns |
| `shared/scripts/data.js` | all | Catalogue, staff and PINs, settings, shift model, live records, receipt and Z-report HTML, page guards, demo-data generators |
| `shared/scripts/manager-data.js` | manager and owner | 14 days of history, merged views (`mgrAllShifts/Sales/…`), overlays, exceptions, aggregates, safe balance |
| `shared/scripts/admin-data.js` | owner | Unit costs, profit maths, per-day series, staff/catalogue/cost edits, audit trail |
| `shared/scripts/portal.js` | all | Sidebar, header, notifications, role switcher, mobile drawer, ⋮ menus, date-range picker, custom select |
| `shared/scripts/settings-page.js` | both settings pages | Settings UI; sections filtered by role |
| `shared/scripts/charts.js` | pages with charts | `posChart()` wrapper around ECharts: shared font, axes, dark tooltip, SVG rendering, auto-resize |

## Demo data

The demo data is deterministic: the same seed always produces the same data. It is generated to behave like a real
small shop:

- **Traffic:** about 5.5 sales an hour on average, shaped by hour (morning and evening peaks, a quiet night) and by
  weekday.
- **Baskets:** about 2.4 items, average ≈ $3.20, weighted toward everyday items (water outsells phone cables by
  about 20 to 1).
- **Payments:** a realistic mix of USD, KHR, mixed cash and KHQR. Cash is tendered in real notes.
- **Exchange rate:** drifts between 4,090 and 4,115 ៛ per dollar.
- **Exceptions:** occasional voids, returns, discounts, wrong PINs and small count variances. A few shifts are still
  waiting for review.

## Project structure

```
pos-digitechkh/
├── README.md                    this file
├── CLAUDE.md                    guidance for AI assistants working in this repo
├── GEMINI.md                    authoritative UI standards (13 rules)
├── .ai/ui-rules.md              UI rules (subset of GEMINI.md)
├── docs/                        spec, planning, research, standards (see docs/README.md)
├── vercel.json                  Vercel deploy config (publishes src/)
└── src/                         the whole website
    ├── index.html               login
    ├── 404.html
    ├── cashier/   terminal/ receipts/ shift/
    ├── manager/   dashboard/ approvals/ shifts/ roster/ cash/ exceptions/ reports/ settings/
    ├── admin/     dashboard/ reports/ staff/ products/ settings/ audit/
    └── shared/
        ├── scripts/             ui-components, data, manager-data, admin-data, portal, settings-page
        ├── styles/custom.css    global styles (overrides Tailwind's type scale)
        ├── styles/portal.css    portal type scale, sidebar, role colours, print rules
        └── assets/              favicon, logo, avatars/<personId>.svg, products/<sku>.png
```

## How a page is built

- **Fixed depth.** Every page is two levels below `src/` and carries `data-role-root="../.."`. Shared files are
  always `../../shared/...`. A page at another depth breaks nav, avatar and image paths.
- **Body id picks the portal.** `<body id>` selects the portal config: `posPortal` (cashier), `managerPortal` or
  `adminPortal`. `data-active` selects the highlighted nav item. Navigation is defined once in `PORTAL_CONFIGS` in
  `portal.js`, never in pages.
- **Shell.** A page provides `<div id="sidebarHost">` and `<div id="headerHost" data-title data-subtitle
  [data-back]>`, and `portal.js` renders both.
- **Script order:** `ui-components.js` → `data.js` → `manager-data.js` → `admin-data.js` → `portal.js` → the page
  script. Manager pages skip `admin-data.js`; cashier pages skip both.
- **Styling:** Tailwind Play CDN, Kantumruy Pro, Font Awesome and Iconify.
- **Charts:** every chart uses ECharts 5 (cdnjs). A chart page loads `echarts.min.js` and then `charts.js`, and draws
  through `posChart(el, option)`. Today that covers the owner dashboard and profit report, and the manager dashboard
  (sales by hour, payment donut) and sales report.
- **Steppers:** multi-step flows (login, open shift, close shift) share `bmsStepper()` from `portal.js` with the same
  settings (`variant: 'icon'`, `tone: 'amber'`, `doneTone: 'brand'`; `dark: true` on the dark open-shift page). Completed
  steps can be clicked to go back.

## UI standards

Read [GEMINI.md](GEMINI.md) and [.ai/ui-rules.md](.ai/ui-rules.md) before changing a page. The short version:

- **Language.** 100 % Khmer UI text with Arabic numerals (0-9). Brand names such as KHQR and Bakong are fine.
- **No native UI.** No `<select>`, `alert()`, `confirm()` or `title` tooltips. Use the shared dialogs and the custom
  dropdown.
- **Reasons.** Voiding, rejecting, deactivating or pausing always asks for a reason.
- **Layout.**
  - `<main>` is full width.
  - The header and sidebar brand block are `h-[72px]`.
  - The back button is icon-only.
  - Each table row has one ⋮ menu.
- **Professional look.** Flat surfaces with modest corner radius. No gradients or coloured glows. The sidebar uses
  36 px rows and can't be collapsed.
- **`custom.css` traps.**
  - It forces `.hidden` with `!important`, so `hidden md:block` never shows. Use `max-md:hidden` instead.
  - It overrides `.text-xs/sm/base` sizes.
  - It hides `header p` on phones.

## Testing

There is no automated test suite. Verify changes in a browser over HTTP, at desktop size and at phone width
(the sidebar becomes a drawer below 1024 px). You can also drive headless Chrome over the DevTools protocol. A useful
check for any page:

- no console errors;
- no broken images or links;
- a role that should be denied is redirected to login;
- the action's result shows up on the pages that read it. For example, a paused product disappears from the till and
  appears in the audit log.

## Deploy

`src/` is the whole site. **Don't move `index.html` to the repo root.**

The site is deployed on **Vercel**: `vercel.json` sets `outputDirectory: "src"` with no build command (framework
preset Other). Every push to `main` redeploys.

All paths are relative, so the site works at a domain root or under a subpath. `404.html` sends lost visitors back to
the login page.

## What a real deployment still needs

This is a working prototype, not production software. Before real use, it needs:

- **Server and database.** Each browser keeps its own data. A real shop needs a backend so every till, the manager and
  the owner see the same records, and nothing is lost when a browser is cleared.
- **Real authentication.** PINs are checked in the browser and seeded in the page source. They must be hashed and
  verified on a server, with per-device registration.
- **Bakong KHQR.** The QR payload is simulated and payment is confirmed by hand. Production needs a merchant account,
  real KHQR generation, and payment confirmation by MD5 from the Bakong API.
- **Hardware.** Receipts print through the browser's print dialog. ESC/POS thermal printers, the cash-drawer kick and
  customer displays need a print bridge or a native wrapper. Keyboard-wedge barcode scanners already work.
- **Stock.** Product stock counts are static. Purchasing, receiving and stock deduction belong to eBMS.
- **Offline mode, backups, and an accountant's review** of the receipt format against GDT rules.

## Documentation

[docs/README.md](docs/README.md) indexes everything. The main documents:

- [docs/spec/01-cashier-pos.md](docs/spec/01-cashier-pos.md): cashier spec
- [docs/spec/02-manager-pos.md](docs/spec/02-manager-pos.md): manager spec, authority matrix and shift model (§11)
- [docs/spec/03-admin-pos.md](docs/spec/03-admin-pos.md): owner role spec
- [docs/planning/cashier-improvements.md](docs/planning/cashier-improvements.md): cashier backlog
- [docs/research/pos-market-research.md](docs/research/pos-market-research.md): market and Cambodia research
