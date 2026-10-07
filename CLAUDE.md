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
`STAFF_SEED` (e.g. 012 345 678 · makara@digitechkh.com · makara2026; owner 012 999 000 · chantha2026). The 6-digit PIN (`POS_PIN_LEN` in `ui-components.js`)
is for manager approvals, unlocking the till and logging in **on a registered till device** (see Many shops below). Demo PINs: ចន្ទ មករា 111111 · សុខ ដារ៉ា 222222 · លី សុភា 333333 · ពេជ្រ សុវណ្ណារី 444444 · គឹម វិសាល 555555 · ឈឹម រតនា 666666
(cashiers) · សុខ វណ្ណា 246810 · ម៉ៅ ស្រីនាង 135791 · នួន សុខលី 864201 (managers) · ហេង ចាន់ថា 999999 (owner).
Default roster: morning CAS-01 + CAS-05, afternoon CAS-02 + CAS-04, night CAS-03 + CAS-06 (both off Tuesday, so a
manager covers that night).
Accounts are listed on the login page under «ព័ត៌មានសម្រាប់គំរូសាកល្បង» (a click fills the form), next to the reset-demo-data button.

Deploy: Vercel only; `vercel.json` publishes `src/` as the site root. Never move pages out of `src/`, and keep every path relative so the site works under a subpath.

Verification is visual: open the page in a browser, or drive headless Chrome over the DevTools protocol. Serve over
HTTP; `file://` storage is unreliable.

Many shops (SaaS, decided 2026-10-07): one account per person, and **one shop per account** (decided 2026-10-07: an
owner with several locations uses branches, not a second shop). `SHOPS`, `membershipsOf()` and `personShopIds()` in
`data.js` return the person's single shop (`p.shopId`, default SHOP-01). The second demo shop «កាហ្វេ សុគន្ធា»
(SHOP-02) has its own owner ADM-02 (012 888 111 · sokunthea@gmail.com · sokunthea2026 · PIN 777777).
Demo data (`DEMO_SCOPES` in `data.js`, value = sales and stock scale) covers DIGITECHKH's three branches (BR-01 central
POS-01..03, BR-02 Toul Kork POS-04..05, BR-03 Sen Sok POS-06; BR-02/03 use only shifts A and B via `branch.shiftCodes`,
which `shiftTemplates()` applies) and the coffee shop (`SHOP_CATALOG_SEED`, `SHOP_SETTINGS_SEED`, `SHOP_SUPPLIER_SEED`:
coffee categories and 19 products, shifts 06:00–14:00 / 14:00–21:00, 4 suppliers, standard plan, set up). Branch staff:
MGR-04 + CAS-07..10 (BR-02), MGR-05 + CAS-11..12 (BR-03); coffee: MGR-06 + CAS-13..15. Generated history is salted per
branch (`DEMO_SALT` in `rngFor`; BR-01 unchanged), uses the branch's manager (`demoManagerId()`), and opening stock
scales with `openingQty(p)`. `ensureDemoTransfers()` seeds one received transfer (central → Toul Kork, 2 short) and one
in transit (central → Sen Sok). The owner dashboard's «សាខាទាំងអស់» card gets other branches' figures from hidden
iframes of `admin/branches/branch-summary.html?summaryBranch=…` (not a visible page; the only URL that overrides
`ACTIVE_BRANCH_ID`).
DIGITECHKH (SHOP-01) is the only demo shop with generated data. Every other shop has its own storage: `posRead`/`posWrite`
add `@SHOP-NN` to shop keys (`storeKey`, `ACTIVE_SHOP_ID`, `IS_DEMO_SHOP`); `GLOBAL_KEYS` (session, devices, people,
PINs, passwords, shop profiles/setup, `pos_shops`) and `pos_ctl_*` stay shared. A new shop starts empty: no products
(owner adds them on the products page, `pos_products`), no staff but its owner (`loadStaff()` = this shop's members,
`loadAllPeople()` = everyone, for login and unique phone/email), no generated history. Creating a shop in the Super Admin
console also creates the owner account (password shown once); the login demo panel lists every shop's accounts.
Each shop has its own name, KHQR name, branch, phone, TIN and logo (setup wizard or owner settings → «ព័ត៌មានហាង»,
`saveShopProfile`); draw logos only with `shopLogoSrc(shop, root)` (uploaded data URL, asset path, or a letter mark).
On a device that is not a registered till the login page shows neutral branding, never a shop.
Branches (Option B, 2026-10-07): a shop has branches (`pos_branches`: id, name, address, phone, registers; owner pages
`admin/branches/{branches,create-branch,edit-branch}`, capped by the plan's branches and total registers). Products, prices, settings, staff accounts and the
owner log are shop-wide; shifts, sales, roster, stock, cash, approvals and events are per branch (`BRANCH_KEYS`, key
suffix `#BR-NN`; the first branch has none). `ACTIVE_BRANCH_ID` comes from the session → till device → BR-01. Staff
carry `branchId` (owners work in every branch); `CASHIERS`/`MANAGERS` are the active branch's, `ADMINS` the shop's.
Register numbers run across the shop (`branchRegisters`: branch 1 POS-01..03, branch 2 POS-04..). Devices store
`branchId`; PIN login on a till accepts that branch's staff or an owner. The owner switches branch from the account
menu (`index.html?branch=1`, `posSwitchBranch`) or the dashboard's «សាខាទាំងអស់» card; `posReadAt(key, fb, branchId,
shopId)` reads another branch or shop. Stock transfer between branches: `manager/stock-transfer/{transfers,create-transfer,
view-transfer}` (nav item only when the shop has 2+ branches, `multiBranch` in `PORTAL_CONFIGS`; badge
`mgrIncomingTransferCount`). `pos_transfers` is shop-wide; `sendTransfer` writes `transfer_out` moves in the sending
branch at once, `receiveTransfer` writes `transfer_in` only for the counted quantity; a shortfall needs a reason and
stays on the transfer (`transferShort`); the owner's shrinkage report counts it as «ខ្វះពេលផ្ទេរ» for the sending
branch (`shrinkageStats`, `shrinkReasonLabel`).
Purchase orders: suppliers `manager/suppliers/{suppliers,create-supplier,edit-supplier}` (`pos_suppliers`, shop-wide;
`SUPPLIER_SEED` only in the demo shop; each supplier lists the products it sells and its delivery days) and orders
`manager/purchase/{purchase-orders,create-order,view-order}` (`pos_purchase_orders`, per branch). Creating an order
pre-fills the chosen supplier's low or out-of-stock products not already on order (`lowStockForSupplier`) and the
delivery date from its delivery days; the order page has a Khmer message to copy into Telegram/SMS (`poMessage`).
Receiving (`receivePO`, part deliveries allowed) writes normal `stock_in` moves, so the owner's cost confirmation still
applies; closing an open order needs a reason. `onOrderBySku()` (still to arrive per product) drives the stock list's
reorder column («បានបញ្ជាទិញ N · មកដល់» instead of a new suggestion; otherwise «ទិញ N» links to
`create-order.html?sku=…&supplier=…`), and stock-in shows a banner to receive against the supplier's open order. Late orders: badge `lateOrderCount` and a manager notification. Demo history (`IS_DEMO_DATA`) exists only in the demo shop's first branch; new
branches start empty with zero stock. A shop without a
manager lets its owner approve at the till (`showManagerOverride`). There is no shop picker or «ប្តូរហាង»: a login opens the
person's only shop. The session carries `shopId`; `CURRENT_SHOP_ID` copies that shop into `MERCHANT`.
Till devices: the owner registers a computer as a register in settings → «ឧបករណ៍បញ្ជរ» (`registerThisDevice()`,
`pos_devices` + `pos_device`); only a registered device offers PIN login (opens on the PIN pad, `verifyPinLogin()`).
Strict login (decided 2026-10-07), one rule for password and PIN, `loginBlockReason(person, device)` in `data.js`:
a registered till is that shop's login page, so only its shop's people log in there, and staff only at their own
branch's till (owners at any branch) → `shop` / `branch`; off a till, owners and managers may log in but cashiers may
not (`till`). The message appears only after a correct password. `posSession()` re-applies the rule on every page, so
removing or changing the till logs its cashier out. The demo seeds this browser as POS-01; the demo panel on the login
page switches it between tills of both shops or «កុំព្យូទ័រផ្ទាល់ខ្លួន» and greys out accounts that cannot log in there.

Super Admin (DIGITECHKH's own console, `control/*`, body `controlPortal`): demo login admin@digitechkh.com · control2026
(`CONTROL_ACCOUNTS` in `data.js`, no shop membership, can open only `control/*`). It has its own login page
`control/login/login.html` (`verifyControlLogin`, 5 wrong tries lock it for 5 minutes, `pos_ctl_login_guard`); the POS
login treats Super Admin credentials as wrong, `guardPage` sends `control/*` without a control session there, and the
console's logout returns there. Pages: dashboard, companies (+ view,
create), billing, plans, audit. Data in `control-data.js` (`pos_ctl_*`): plans with limits, subscribing shops, payments,
support sessions, its own log. It never shows a shop's sales, costs or staff, only usage counts. Subscription status
(`subscriptionStatus()` in `data.js`: active · trial · expiring · overdue (7-day grace) · expired · suspended) is mirrored to
`pos_ctl_status`; a suspended or expired shop cannot log in (password, PIN, shop picker), and the owner gets a
notification 7 days before the end. Support access needs a reason, lasts 30 minutes and appears in the owner's audit log.
The console brands itself DIGITECHKH (the vendor), the one place where that name is not «អភិវឌ្ឍដោយ».
It also lists each shop's branches (usage only), trial shops that have not finished setup (`needsSetupHelp`), shops
at their plan limit (`upgradeHint`), payment reminders (`ctlRemindDialog`, shown as «រំលឹក N ថ្ងៃមុន»), internal notes,
and the trial-to-paid rate (`trialConversion`).
Forms that create or edit a record are full pages (create-product, create/edit-branch, create-payment, edit-plan,
create-company), never pop-ups (`.ai/ui-rules.md` §2); after saving they return to the list with `flashToast(msg)`
(shown once on the next page) and `markRecordViewed(id)`. Pop-ups are only for short choices (pick a plan, branch,
channel, reason). The owner dashboard shows «ចាប់ផ្តើមប្រើ» (`startChecklist()`: shop, products, stock, cashier, till,
first sale; auto-detected, hideable once done). A branch with no stock records shows no «អស់» badges (`stockTracked`).
The account menu has «ជំនួយ និងទំនាក់ទំនង» (`showSupportInfo`).
Owner subscription page `admin/subscription/subscription.html` («ការជាវ និងការបង់ប្រាក់»): plan, status, end date,
usage vs limits, plan comparison with «ស្នើប្តូរ», DIGITECHKH payment details (`VENDOR_PAY`), payment history
(`shopSubPayments`), and the owner's requests. «ខ្ញុំបានបង់ប្រាក់» is a full page (`admin/subscription/create-payment`).
Requests (`pos_ctl_requests`, `addSubRequest`: claim | plan) reach the Super Admin dashboard («សំណើពីហាង», badge
`ctlRequestCount`); a claim opens `control/billing/create-payment.html?claim=…` prefilled and is closed on save, a plan
request is applied or refused with a reason the owner sees. Plan list and prices live in `data.js` (`SUB_PLANS_DEFAULT`,
`subPlans()`); `control-data.js` reuses them.
First-login setup (`admin/setup/setup.html`): until `shopSetup(shopId).done`, `guardPage` sends the owner's admin pages
there (unless «ធ្វើពេលក្រោយ» in this tab; the dashboard then shows a reminder). Steps: shop (name, KHQR name, branch,
phone, VAT TIN → `saveShopProfile`, which overrides `SHOPS`/`MERCHANT`) · payments (rate, bank, Bakong ID) · registers
(capped by `shopLimits()`) and opening hours · done with next steps. SHOP-01 counts as set up; SHOP-02 starts unset.
Plan limits reach the shop through `pos_ctl_status` (`shopLimits`); registering a till or adding / reactivating staff
beyond the plan is refused (`staffLimitReached()` in `staff-actions.js`).
Earlier-shift returns (D3): the cashier types the exact receipt number (`findSaleByReceipt`, no browsing), within
`RETURN_WINDOW_DAYS`; a manager always approves. Each return stores the `shiftId` that paid it, and `summarizeShift`
counts refunds in that shift's drawer, not the sale's.

Branding: DIGITECHKH is the dev team, not the shop. Staff screens show the shop from `MERCHANT` (`nameKh`, `branch`,
`logo`; demo shop = «DIGITECHKH» with the team logo; Latin `name` only for KHQR). Static markup uses `.shop-name` / `.shop-branch` /
`img.shop-logo`, filled by `portal.js`. DIGITECHKH appears only as «អភិវឌ្ឍដោយ DIGITECHKH» (login footer, splash, payslip).
Page titles start with «ប្រព័ន្ធគិតលុយ - ».

## Layout

```
src/
├── index.html                      login: top bar (brand + theme), one card with illustration + email-or-phone / password form, PIN pad on a registered till, shop picker (session in localStorage `pos_session`)
├── cashier/terminal/pos-terminal   sell, hold, discount override, Riel change, in-terminal KHQR, safe drop, lock
├── cashier/display/customer-display  customer-facing screen (CFD), opened from the terminal header; read-only mirror of `pos_cfd`
├── cashier/receipts/receipts       shift receipts, void / return requests (manager PIN on the spot or queued), return from an earlier shift by exact receipt number
├── cashier/shift/{open,close}-shift  float count + manager PIN · blind close with one recount + Z-report
├── manager/{dashboard,approvals,shifts,roster,cash,stock,stock-count,stock-history,stock-transfer,purchase,suppliers,exceptions,reports,settings}/…  (view-request, view-shift, create-movement, create-stock-in, create-adjustment, create-count, view-count)
├── admin/{setup,dashboard,reports,branches,staff,products,settings,subscription,audit,stock}/…   owner: first-login setup wizard, getting-started checklist, branches, profit, stock value, shrinkage, stock-in cost, staff, prices, rules, audit log (view-stock-in, view-staff, create-product, create/edit-branch)
├── control/{login,dashboard,companies,billing,plans,audit}/…   Super Admin (DIGITECHKH): own login, subscribing shops, payments, plans (view-company, create-company, create-payment, edit-plan)
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
  (`portal.css` `--sb-*`: dark green #0B2B22, black-gray #171717 in dark mode). Never tint it per view. Everything else is neutral: white text, logo on a white tile,
  active item = white 13% fill, no accent bar, glow or coloured icons. A dot + the view name sit under the logo and in
  the view switcher. Nav
  badges stay neutral (red when urgent). No `title=` tooltips in the sidebar. The sidebar brand block switches views
  (`ROLE_VIEW`): owner ⇄ manager, manager ⇄ cashier. The sidebar is never collapsible.
  `data-active` picks the highlighted nav item. Change nav in `PORTAL_CONFIGS`, never in pages.
- Script order: `ui-components.js` → `data.js` → (`manager-data.js`, manager + owner pages) → (`admin-data.js`, owner
  pages only) → (`control-data.js`, Super Admin pages only, never with manager/admin data) → `portal.js` → (`echarts.min.js` from cdnjs + `charts.js`, chart pages) → (`settings-page.js`, both
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
  `cash_movements`, `events`, `terminal_lock`, `pins`, `passwords`, `login_guard`, `last_login`, `last_shop`, `devices`, `device`, `ctl_*` (Super Admin), `stock_opening`, `stock_moves`, `stock_counts`, `stock_costs`, `overlay`, `staff`, `catalog`, `costs`, `admin_log`, seeds. sessionStorage: `pos_cart`, `pos_pending_khqr`.
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
  never quantities. Simulated registers' sales after the opening do not move stock. Generated stock-ins older than
3 days count as cost-confirmed, so the owner's queue holds only recent deliveries.
- **Customer display (CFD)**: the terminal's `syncCfd()` (called from `renderCart`, KHQR, success and lock handlers) writes a snapshot with `publishCfd()` to `pos_cfd` `{ stage: idle|sell|pay|khqr|thanks, items (sku, qty, price), totals, pay, khqr, thanks }`; the display listens to the `storage` event. The snapshot carries only what the customer should see: no cost, stock, PINs, reasons or staff names. The idle messages (max 5, with on/off and an icon) are `cfdMessages` in `posSettings()`, edited by the manager or owner in settings → «អេក្រង់អតិថិជន». The terminal republishes every 10 s as a heartbeat; the display falls back to idle after 30 s without an update. The owner may open the display page (exempt in `guardPage`).
- Banks: KHQR payments go to a shop bank account chosen at the till. `PAY_BANKS` (ABA, ACLEDA, Wing, …) + `payBanks` in
  `posSettings()` (owner settings → «ធនាគារទទួលប្រាក់»: on/off, Bakong account ID, order; first = default). The sale stores
  `pay.bank`; labels via `khqrLabel(pay)`, per-bank totals via `bankLines(summary)` (`byBank` in `summarizeShift` /
  `aggregateSales`). `buildKhqrPayload` emits a valid EMV KHQR string (tag 29 account, 52 MCC, 63 CRC16). The KHQR card
  follows the Bakong layout (20:29, red header with cut corner, name, amount, dashed line, QR); keep extra text outside it.
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
| Colour | One accent: emerald green (`primary` #047857). Each page's `tailwind.config` remaps `blue-*` to the emerald scale and `slate-*` to neutral gray (dark mode is black-gray, no blue tint), so keep writing `blue-*` / `slate-*` classes and never hard-code the old blue or slate hexes. Use it for primary buttons, active tabs, links, chart series. Status green (live, positive) only as a small dot or with a ▲ arrow so it is not mistaken for a button. Amber / red only for status, and only on exceptions: normal or finished states (in stock, approved, confirmed, reviewed, payment method, roles, categories) are slate. No indigo, cyan, sky, teal or purple. `kpiCard()` ignores non-warning tones. |
| Theme | Light by default (`bms_theme` unset). The cashier terminal and open-shift are authored dark and get their light look from the `html:not(.dark)` layer in their `<style>`; never put a `:hover` selector inside `:is()` there (it raises specificity and beats the white-text restore). The login page is authored light like the portal pages (dark comes from `custom.css`); its splash too (`html.dark` rules). The splash and top bar are filled by script before the splash fades (registered till = shop logo, name, branch · register; other devices = the emerald system mark `GENERIC_LOGO`); the full splash (1.1 s) shows once per browser tab (`pos_splash` in sessionStorage), later loads 0.3 s. Sidebar is never collapsible. |

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
