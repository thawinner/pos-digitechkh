# 03 — Owner (Admin) POS Spec

The third POS role: **ម្ចាស់ហាង** (shop owner). The cashier sells and the shift manager runs the floor; the owner
decides the money, people and rules of the business. Pages live under `src/admin/`, body id `adminPortal`, sidebar
colour dark green (`#0f2b25`, accent emerald).

## 1. Decisions (agreed 2026-10-04)

| # | Decision |
|---|---|
| D1 | **Cost, profit and margin are visible to the owner only.** Costs live in `admin-data.js`, which only `admin/*` pages load. `data.js` and `manager-data.js` never hold costs. |
| D2 | **The manager sets the daily exchange rate.** The owner can also set it, but the daily routine belongs to the manager. |
| D3 | **One branch**, with room to grow. `MERCHANT.branch` is a single value; nothing assumes one register per shop. |
| D4 | **The owner stays off the till.** An owner session opening `cashier/*` is sent to the owner dashboard. The owner can open manager pages through the sidebar role switcher. |
| D5 | **One demo owner account:** ហេង ចាន់ថា, `ADM-01`, PIN 9999. |

## 2. Authority

| Action | Cashier | Manager | Owner |
|---|:-:|:-:|:-:|
| Profit, cost, margin | – | – | ✓ |
| Add staff, change role, reset any PIN, deactivate or reactivate | – | – | ✓ |
| Discount limit per cashier | – | read-only | ✓ |
| Prices, costs, pause or resume a product | – | – | ✓ |
| Cash rules (variance tolerance, drawer limits, standard float) | – | read-only | ✓ |
| Shift templates, KHQR timeout, hold limit | – | read-only | ✓ |
| Exchange rate, quick keys, reason lists | – | ✓ | ✓ |
| Approvals, shift review, roster, cash office | – | ✓ | ✓ (through the manager view) |
| Audit log | – | – | ✓ |

The authority rules are enforced in four places:

- **Guards:** `data.js` restricts `admin/*` to an owner session; `manager/*` accepts a manager or owner session.
- **Editable settings:** `settings-page.js` shows the owner-only sections (cash, shifts, till) only on the owner page.
  `EDITABLE_KEYS` stops a manager page from saving those keys. The manager page shows them read-only under
  «ច្បាប់ពីម្ចាស់ហាង».
- **Login:** after a PIN, `next` is honoured only inside the role's areas: owner → admin or manager; manager → manager
  or cashier; cashier → cashier.

## 3. Dashboard — `admin/dashboard/dashboard.html`

- **Period tabs:** today, 7 days, 14 days.
  - **Today** compares with the same weekday last week, cut at the same time of day. A day still in progress is never
    compared with a full day.
  - **7 days** compares with the 7 days before.
  - **14 days** has no comparison.
- **KPIs:**
  - revenue (incl. VAT) with the number of receipts;
  - gross profit with margin and a margin bar;
  - average basket with voids;
  - cash variance across counted shifts. Shows «—» when no shift has been counted yet.
- **14-day chart** (ECharts). Bars stack cost and gross profit, which together make ex-VAT revenue. Click a day to
  see its revenue, profit, margin and receipts above the chart. Today's bar is lighter because the day is still in
  progress.
- **Needs attention:** each row links to where the problem is fixed. Only rows with something pending show:
  - pending approvals;
  - shifts awaiting review;
  - unconfirmed safe drops;
  - shifts over the variance tolerance in the last 7 days;
  - products under 20 % margin;
  - an exchange rate not updated today.
- **Results by staff:** shifts, sales, average basket, voids and cash variance per person for the period.
- **Top products by profit:** ranked by gross profit, not by units.

## 4. Profit report — `admin/reports/profit-report.html`

- Date range picker and four views: by day, category, product and staff.
- KPIs: ex-VAT revenue, cost of goods sold, gross profit (with a daily average), and margin.
- Chart (ECharts): stacked cost + profit bars, and a margin line on the right axis.
- Table: label, count, revenue, cost, profit, and a margin bar. A totals row closes the table.
- Prints to A4.

Profit maths (`admin-data.js`):

- Revenue = `linePrice × (qty − returned) × (1 − discount %) ÷ 1.10`.
- Cost = `costOf(sku) × (qty − returned)`.
- Voided sales count as zero.

## 5. Staff — `admin/staff/staff.html`

- **Filter tabs** with counts: all, cashiers, managers, owners, deactivated. There is also a search box.
- **Table columns:** person, role, default shift (from the roster settings), discount limit, last shift, and status.
  On phones the table becomes cards.
- **⋮ menu:** rename, change role, reset PIN, discount limit (cashiers only), and deactivate. Deactivated rows offer
  reactivate.
- **Add staff:**
  1. Pick a role.
  2. Fill in name, PIN and, for a cashier, the discount limit. The PIN is pre-generated.
  3. The PIN is then shown once, to be told to the person in person.
- **Validation:**
  - Khmer name of at least 2 characters.
  - A PIN of exactly 6 digits. Easy PINs are refused (`111111`, `123456`, `987654`), and so is a PIN another active person uses.
  - Discount limit between 0 and 20 %.
- **Safeguards:**
  - The owner cannot deactivate their own account.
  - The shop always keeps at least one active owner.
  - Nobody with an open shift can be deactivated.
  - Changing a role or deactivating asks for a reason.
  - Changing your own role logs you out.
  - Deactivating someone with a default shift warns that the shift is now uncovered.
- **Storage:** `pos_staff` holds `{ added, changes }` layered over `STAFF_SEED`. Reset PINs go in `pos_pins`. Every
  change is logged in `pos_admin_log`.

## 6. Products — `admin/products/products.html`

- **KPIs:**
  - products on sale;
  - margin weighted by the last 14 days of sales;
  - products under 20 % margin;
  - paused products.
- **Tabs:** categories, plus «ចំណេញទាប» (low margin) and «បានផ្អាក» (paused). There is also a search box.
- **Table columns:** product, price (with the old price struck through if changed), cost, profit per unit, margin
  bar, and units sold in 14 days. Margin colours: under 20 % is rose, 20–25 % amber, 25 % and above green.
- **⋮ menu:** change price, edit cost, pause or resume.
  - The price and cost dialogs preview the ex-VAT price, profit per unit and margin while typing.
  - A price below cost needs a second confirmation.
  - Pausing asks for a reason. A paused product disappears from the till grid, the quick keys and barcode lookup.
- **Price history stays intact.** A sale stores its line price, so old receipts and reports keep the price they were
  sold at.

## 7. Stock Management

### 7.1 Confirm Stock In Cost — `admin/stock/stock-in.html` & `view-stock-in.html`
- Lists Stock In deliveries grouped by supplier invoice.
- Status badge: «រង់ចាំបញ្ជាក់ថ្លៃដើម» (amber) or «បានបញ្ជាក់» (emerald).
- Owner enters unit cost per line in dedicated page `view-stock-in.html`, defaulting to last known cost (`costOf(sku)`).
- Confirming with manager PIN updates `pos_stock_costs`, calls `setCost(sku, unitCost)` so it becomes the new last known cost, updates stored moves, and writes an entry to `pos_admin_log`.

### 7.2 Stock Value Report — `admin/reports/stock-value.html`
- Shows inventory value at cost by category and by individual product.
- Formula: `onHand(sku) × costOf(sku)`.
- ECharts category breakdown bar chart (`posChart`).
- Badges mark products with unconfirmed costs as «មិនទាន់បញ្ជាក់».
- A4 print support with `@media print`.

### 7.3 Shrinkage Report — `admin/reports/shrinkage.html`
- Tracks loss value at cost ($) from:
  - `adjust` moves with `shrink: true` (`damaged`, `expired`, `lost`);
  - negative `count` differences (`qty < 0`);
  - damaged returns (`restock === false`).
- Unified date range picker per GEMINI.md §3.
- Four views: by reason, by staff, by product, and detailed log.
- ECharts breakdown chart (`posChart`).
- A4 print support.

## 8. Settings — `admin/settings/settings.html`

This is the same `settings-page.js` as the manager page, with all sections:

- exchange rate
- cash in drawer
- shift templates
- till limits (KHQR timeout, hold limit, discount limits)
- stock rules (`allowNegativeStock`, `adjustLimitQty`, `adjustLimitUSD`, `countSchedule`)
- quick keys
- reasons
- history

## 9. Audit log — `admin/audit/audit.html`

- **Read-only.** It merges these sources (`auditTrail()`):
  - owner actions (`pos_admin_log`, including cost confirmations);
  - settings history;
  - approval decisions;
  - wrong manager PINs and discount overrides from events;
  - shift reviews;
  - stock movements (stock in, adjustments, counts, returns, voids) with no 14-day limit.
- **Filters:** type tabs with counts (approval, settings, staff, catalogue, stock, shift, security), person, and search.
- **Layout:** grouped by day (today, yesterday, then dates). It shows 60 entries at first, with «បង្ហាញបន្ថែម» for
  more.

## 9. Production notes

- Cost data must come from purchasing (supplier invoices, average or last cost) on the server, never from the browser.
- Staff and PIN changes must be server-side, with hashed PINs and an immutable audit table.
- Multi-branch would add a branch filter to every owner page and per-branch settings.
