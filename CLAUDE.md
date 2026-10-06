# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A **static HTML/CSS/JS prototype of the DIGITECHKH POS**, in Khmer, with a PIN login and three roles: **cashier**,
**manager / shift supervisor** and **owner (admin)**. It was split out of the eBMS repo (`ebms_digitechkh`, role 05) and covers only the POS.
There is no build system, no tests and no backend: all state lives in the browser's `localStorage`.

```bash
python3 -m http.server 8000 --directory src   # then open localhost:8000 (login page)
```

Login: email or phone + password (`verifyLogin()` in `data.js`). Demo accounts: phone/email/password per person in
`STAFF_SEED` (e.g. 012 345 678 · makara@digitechkh.com · makara2026; owner 012 999 000 · chantha2026). The 4-digit PIN
is only for manager approvals and unlocking the till. Demo PINs: ចន្ទ មករា 1111 · សុខ ដារ៉ា 2222 · លី សុភា 3333 · ពេជ្រ សុវណ្ណារី 4444 · គឹម វិសាល 5555 · ឈឹម រតនា 6666
(cashiers) · សុខ វណ្ណា 2468 · ម៉ៅ ស្រីនាង 1357 · នួន សុខលី 8642 (managers) · ហេង ចាន់ថា 9999 (owner).
Default roster: morning CAS-01 + CAS-05, afternoon CAS-02 + CAS-04, night CAS-03 + CAS-06 (both off Tuesday, so a
manager covers that night).
Accounts are listed on the login page under «ព័ត៌មានសម្រាប់គំរូសាកល្បង» (a click fills the form), next to the reset-demo-data button.

Deploy: Vercel only; `vercel.json` publishes `src/` as the site root. Never move pages out of `src/`, and keep every path relative so the site works under a subpath.

Verification is visual: open the page in a browser, or drive headless Chrome over the DevTools protocol. Serve over
HTTP; `file://` storage is unreliable.

Branding: DIGITECHKH is the dev team, not the shop. Staff screens show the shop from `MERCHANT` (`nameKh`, `branch`,
`logo`; demo shop = «DIGITECHKH» with the team logo; Latin `name` only for KHQR). Static markup uses `.shop-name` / `.shop-branch` /
`img.shop-logo`, filled by `portal.js`. DIGITECHKH appears only as «អភិវឌ្ឍដោយ DIGITECHKH» (login footer, splash, payslip).
Page titles start with «ប្រព័ន្ធគិតលុយ - ».

## Layout

```
src/
├── index.html                      login: top bar (brand + theme), one card with illustration + email-or-phone / password form (session in localStorage `pos_session`)
├── cashier/terminal/pos-terminal   sell, hold, discount override, Riel change, in-terminal KHQR, safe drop, lock
├── cashier/receipts/receipts       shift receipts, void / return requests (manager PIN on the spot or queued)
├── cashier/shift/{open,close}-shift  float count + manager PIN · blind close with one recount + Z-report
├── manager/{dashboard,approvals,shifts,roster,cash,stock,stock-count,stock-history,exceptions,reports,settings}/…  (view-request, view-shift, create-movement, create-stock-in, create-adjustment, create-count)
├── admin/{dashboard,reports,staff,products,settings,audit,stock}/…   owner: profit, stock value, shrinkage, stock-in cost, staff, prices, rules, audit log (view-stock-in, view-staff)
└── shared/{scripts,styles,assets}  assets/avatars/<personId>.svg = profile images
```

- **Every page is exactly two levels below `src/`** and carries `data-role-root="../.."` (path to `src/`). A page at
  another depth breaks nav, logo, avatar and product-image paths.
- Nav hrefs in `PORTAL_CONFIGS` (`portal.js`) are relative to `src/`. Links in a page's own markup are relative to the page.
- `data.js` guards pages at load: `cashier/*` needs a session (an owner is sent to the owner home), `manager/*` needs a
  manager or owner session, `admin/*` needs an owner session; otherwise it redirects to `index.html?next=…`. Logout
  clears the session.

## How a page is assembled

- Cashier: `<body id="posPortal" …>`; manager: `<body id="managerPortal" …>` (`badgeFn` nav badges); owner:
  `<body id="adminPortal" …>`. All three views share one dark slate sidebar
  (`portal.css` `--sb-*`: slate-800 #1e293b, slate-900 in dark mode). Never tint it per view. Everything else is neutral: white text, logo on a white tile,
  active item = white 13% fill, no accent bar, glow or coloured icons. A dot + the view name sit under the logo and in
  the view switcher. Nav
  badges stay neutral (red when urgent). No `title=` tooltips in the sidebar. The sidebar brand block switches views
  (`ROLE_VIEW`): owner ⇄ manager, manager ⇄ cashier. The sidebar is never collapsible.
  `data-active` picks the highlighted nav item. Change nav in `PORTAL_CONFIGS`, never in pages.
- Script order: `ui-components.js` → `data.js` → (`manager-data.js`, manager + owner pages) → (`admin-data.js`, owner
  pages only) → `portal.js` → (`echarts.min.js` from cdnjs + `charts.js`, chart pages) → (`settings-page.js`, both
  settings pages) → (`staff-actions.js`, staff list + view-staff) → inline script.
- Charts: always ECharts through `posChart(el, option)` in `charts.js` (owner override of the eBMS «no ECharts on
  dashboards» rule). Steppers: always `bmsStepper()` with `variant: 'icon'`, `tone: 'accent'`, `doneTone: 'accent'` (round icons;
  `dark: true` on dark pages) so open-shift and close-shift look the same. The login page has no stepper (minimal form, Stripe/Shopify style); it is one centred card with
  `shared/assets/pos-login.jpg` / `pos-login-dark.jpg` (resized from `pos.jpeg` / `pos_dark.jpeg`) and the form. Phone accepts any format (`normPhone`); phone and
  email are unique per active person (`accountError()` in `staff-actions.js`); the error never says which part is wrong;
  5 wrong tries lock it for 1 minute (`pos_login_guard`); the last email/phone is remembered (`pos_last_login`).
  Owners manage accounts in the staff ⋮ menu: «កែព័ត៌មាន» (name + phone + email, `editProfile`), «ពាក្យសម្ងាត់ និងលេខសម្ងាត់» (`resetAccess` → password in `pos_passwords` or PIN), role, pay, deactivate; the discount limit is edited on view-staff.
- Manager pages are generated from a shared shell (head, sidebar host, header host, script tags); keep that shell
  identical when adding one. View/create pages are full pages with `data-back`, never modals. A
  `?back=<relative path>` parameter overrides `data-back` (e.g. a shift opened from a staff profile returns to it).
- Shared dialogs in `ui-components.js`: `showManagerOverride` (manager PIN on the cashier's screen), `showPinConfirm`,
  `showReasonPicker`, `showOptionDialog`, `showFormDialog` (short inputs with validate + live preview), plus the inherited
  `showToast` / `showCustomConfirm` (`hideCancel` for one button) / `showReasonPrompt`. Toasts sit bottom-right (bottom-left
  on the terminal, clear of the cart and pay button; full width on phones), max 3, and stay while hovered.
- Cash counting: open-shift and close-shift both use `cashCounter(hostId, { usd, khr, onChange, onDone })`
  (`ui-components.js`); never build a separate note counter.
- Notifications: `portalNotifications()` items `{ icon, tone, title, note, time, href }` are grouped by tone (danger →
  warning → info) in `refreshPortalNotifications()`; `kind: 'status'` items show as a footer line, not a notification.
- List memory (`ui-components.js`): a list page saves its tab / filters / search with `saveListState(key, …)` (only
  after it restored them; guard with a `listReady` flag, because custom selects fire `onchange` at init) and restores
  them with `loadListState(key)`; a URL parameter from a dashboard link wins. View pages call `markRecordViewed(id)`;
  the list calls `flashViewedRow()` after rendering to scroll to and highlight that `data-row-id` row. Date ranges use
  `dateRangeSnapshot()` / `restoreDateRange()` (`portal.js`). `kpiCard(label, value, sub, tone, href)` links to the
  list behind the figure.
- Pagination (`ui-components.js`): any list that grows over time uses `pagerSlice(key, rows, { size, render, sig })`
  and puts `pg.html` in a `data-pager="key"` box under the table (25 rows; receipts 20, audit 50, detail lists 15).
  `sig` is the filter string (use `dateRangeKey()` for date ranges); the page is remembered per tab only after the
  user changes page, and resets when the filters change. The footer offers rows per page (10/25/50/100, remembered per
  list in `pos_pager_size`), «go to page» above 7 pages, and a compact `‹ 3 / 55 ›` on phones. Small fixed lists (staff,
  payroll, dashboards) are not paged.

## Data

- **`data.js` (both roles)** holds only what a till needs: catalogue, people + PINs, settings (`posSettings()`), the
  shift model, live records, `summarizeShift()` (per-currency expected cash), `receiptHtml()`, `zReportHtml()`,
  `logPosEvent()`. It must never hold other shifts' history — that keeps the cashier's shift lock real.
- **Mock data model** (`data.js`, shared by the live seed and the history): `genSaleTimes` follows the busy-hour curve
  `HOUR_WEIGHT`, `genBasket` uses popularity weights `PRODUCT_WEIGHT` (mostly 1–2 items, ≈ $3 average), and `genPay`
  sets the tender mix. On a cashier's day off, `defaultRoster` puts a shift supervisor on the till as cover.
  Historic exchange rates vary slightly per day (`fxForDate`). Shifts closed in the last 14 hours stay unreviewed.
- **`manager-data.js` (manager pages only)** generates 14 days of deterministic history from the roster, merges it with
  live data (`mgrAllShifts/Sales/Movements/Approvals/Events`), stores manager decisions on generated records as
  overlays (`pos_overlay`), and computes exceptions, sales aggregates and the safe balance.
- **`admin-data.js` (owner pages only)** holds unit costs (`COST_SEED`, `pos_costs`), profit maths (`saleProfit`,
  `profitOf`, `adminDays`), staff / catalogue / cost edits that write `pos_admin_log`, and `auditTrail()`. Pay data
  (`getStaffCompensation`, `calculateStaffPayroll`) covers cashiers and managers only: the owner has no salary, no bank
  details and no payroll record (`staffOnPayroll()` in `staff-actions.js`).
- Staff: `STAFF_SEED` + `pos_staff` `{ added, changes }` → `ALL_STAFF` (includes deactivated); `CASHIERS` / `MANAGERS` /
  `ADMINS` are active only. Use `loadStaff()` for a fresh list after an edit on the same page. Catalogue edits
  (`pos_catalog`: price, active) apply at load; `sellableProducts()` hides paused products.
- localStorage keys (all `pos_*`): `session`, `settings`, `roster`, `shifts`, `shift_sales`, `held_sales`, `approvals`,
  `cash_movements`, `events`, `terminal_lock`, `pins`, `passwords`, `login_guard`, `last_login`, `stock_opening`, `stock_moves`, `stock_counts`, `stock_costs`, `overlay`, `staff`, `catalog`, `costs`, `admin_log`, seeds. sessionStorage: `pos_cart`, `pos_pending_khqr`.
  A `storage` event re-renders other tabs (`window.onStoreChanged`).
- **Shift model** (see `docs/spec/02-manager-pos.md` §11): shift template (time window) → staff default shift →
  roster per date (covers marked `cover`; default templates morning / afternoon / night, the night one overnight) → drawer shift (one cashier, one register, one drawer: open → closed →
  reviewed). The roster holds people only (max = number of registers); the cashier picks any free register at
  open-shift (`suggestRegister()`: pinned → last used → first free). A manager may pin someone (`pin: true` +
  `register`). `openShiftBlocker()` enforces one open drawer per register and per person; `rosterSeats()` assigns
  registers for display and generated history without overlaps.
- **Stock** (`data.js`): quantity is never stored or edited, only derived — `onHandLevels()` = `p.opening` at
  `pos_stock_opening` + live sales since then (from the receipts) + `pos_stock_moves` (void, return, stock_in, adjust,
  count; each with `by`, `at`, `qty` ±, `reason`). Approvals write their moves in `applyApprovalToSale`; a return
  carries `restock` (false = damaged adjustment). Cashier pages use only `stockStatus()` (out / low by `p.minStock`),
  never quantities. Simulated registers' sales after the opening do not move stock.
- Money: `saleTotals` (VAT-inclusive prices), `splitChange` ($ + ៛ rounded to 100), every sale stores `fxRate`,
  `cashierId`, `register`, `shiftId`, `change`, and each line its `price` (read with `linePrice`). Cost prices exist
  only in `admin-data.js`; cashier and manager pages never see them.

## Inherited from eBMS

`portal.js`, `ui-components.js`, `custom.css` and `portal.css` came from eBMS `frontend/shared/`. Inactive branches
(e.g. `PORTAL_USES_STORE`, the non-V2 sidebar) remain; remove them only when touching that code.

## Mandatory standards

Read [GEMINI.md](GEMINI.md) and [.ai/ui-rules.md](.ai/ui-rules.md) before changing a page. Their file paths refer to the
old eBMS layout; the rules apply as-is. Condensed:

| Rule | Requirement |
|---|---|
| Language | 100% Khmer UI text. No English words, none in parentheses. Brand names (`KHQR`, `Bakong`) are fine. |
| Numerals | Arabic numerals (`0-9`) everywhere, never Khmer numerals. |
| No native UI | No `<select>`, `alert()`, `confirm()` or native tooltips. Use `showToast()`, `showCustomConfirm()`, the custom dropdown. |
| Reasons | Voiding or rejecting needs a reason: `showReasonPrompt()` in `ui-components.js`. |
| Header | Sidebar brand block and `<header>` are both `h-[72px] px-6 flex-shrink-0`. |
| Back button | Icon-only, byte-identical on every sub-page (GEMINI.md §5). |
| Full width | `<main>` uses `w-full`, never `max-w-* mx-auto`. |
| Table actions | One `⋮` button opening a floating menu. |
| Typography | `Kantumruy Pro`; headings `font-semibold`, rows `font-medium`; prefer `text-slate-700/600` in tables. |
| Money summary | subtotal → down payment → special discount → VAT 10% → grand total. Dual currency USD/KHR. |
| Printing | Receipts print to 80mm thermal, the Z-report to A4, via `@media print`. |
| Em dash | Don't put «—» between Khmer phrases; a lone «—» as an empty-value marker is fine. |
| Colour | One accent: blue (`primary` #2563EB, Tailwind `blue-*`) for primary buttons, active tabs, links, chart series. Green / amber / red only for status, and only on exceptions: normal or finished states (in stock, approved, confirmed, reviewed, payment method, roles, categories) are slate. No indigo, cyan, sky, teal or purple. `kpiCard()` ignores non-warning tones. |
| Theme | Light by default (`bms_theme` unset). The cashier terminal and open-shift are authored dark and get their light look from the `html:not(.dark)` layer in their `<style>`; never put a `:hover` selector inside `:is()` there (it raises specificity and beats the white-text restore). The login page is authored light like the portal pages (dark comes from `custom.css`); only its splash is dark, with an `html:not(.dark) #splash` rule. Sidebar is never collapsible. |

## UX/UI rules (for AI working on this repo)

This is a product for shop staff (cashiers, supervisors, owners), not a developer tool. Every change must make their
work faster, clearer or safer. Apply these on every page you add or touch:

**Look: simple, neutral, professional**
- White panels, thin slate borders, slate text. One accent colour (blue) for the primary action, the active tab and
  links. Nothing decorative: no gradients, glows, tinted cards, coloured icon boxes or coloured left borders.
- Colour carries meaning only. Red = error / loss / destructive, amber = needs attention / pending, green = live or
  positive change. Highlight exceptions only; a normal row (in stock, approved, paid in cash) stays slate.
- Figures are slate-800; colour a number only when it needs attention. Categories (payment method, role, movement
  type) are plain text or slate chips, never colour-coded.
- Compact and dense: table rows about 52px, no repeated intro text under the header subtitle, one ⋮ menu per row with a
  borderless icon button.

**Behaviour: designed for staff, not developers**
- Plain Khmer words staff use at the counter. No IDs, codes, internal statuses or debug detail unless staff act on them.
- Every screen answers "what do I do next": one obvious primary button, the next step named on it, a clear result
  after the action (toast, highlighted row, updated count).
- Show every state: empty (with the next action), loading, done, error with how to fix it. Never a blank area.
- Prevent mistakes before warning about them: sensible defaults, disabled buttons with the reason shown, confirmation
  only for actions that cannot be undone, a reason for void / reject.
- Fewest taps on the cashier screen: 48px touch targets, keyboard shortcuts shown on the buttons, focus back on the
  barcode field after every dialog.
- Keep context: return to the same tab, filter and scroll after viewing a record; a dashboard item opens the filtered
  list behind it.
- Light theme is the default; dark mode must still work. Check pages at desktop and phone width, in both themes,
  before calling a UI change done.

## `custom.css` traps

- It overrides Tailwind's type scale with `!important` (`.text-xs` = 14.5px, `.text-sm` = 15.5px, `.text-base` = 16.5px).
  Check it before debugging any font size. Restore hierarchy with ID-scoped rules (`#posPortal ...`).
- `.hidden` is `display:none !important`, so `hidden sm:inline` / `hidden md:block` never show; use `max-md:hidden`
  instead. Round elements are forced to 13.5px.
- On phones, `header p` is `display: none`. Use `<span class="block">` for text that must stay visible in a header.
- It hides scrollbars globally and holds the `< 1024px` off-canvas drawer rules.
- On phones (§17), every button inside a `main .bg-white` that contains a `button[type="submit"]` is forced to full width,
  and its child divs to `justify-content: stretch`. A compact form card needs its own background class (see `.login-card`).
- On phones, `main .grid.grid-cols-2.md:grid-cols-4` is forced to one column; use a page-level grid class instead.
- On phones, `div:has(> a[href*="create-"])` is forced to `display: flex`, so a hidden ⋮ menu containing a link to a
  `create-*.html` page shows permanently. Use a `<button onclick="location.href=…">` inside menus instead.

## Docs

`docs/` holds the POS spec and the cross-cutting rules that apply to it — see [docs/README.md](docs/README.md).
The spec is the source of truth for what a page should contain; the manager role is specified in `docs/spec/02-manager-pos.md`, the owner role in `docs/spec/03-admin-pos.md`, and the cashier backlog is in `docs/planning/cashier-improvements.md`.
Stock management (in progress on branch `feat/stock-management`) is planned and tracked in `docs/planning/stock-management.md` — read it before continuing that work.
