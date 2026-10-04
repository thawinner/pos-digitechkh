# Stock Management — Spec, Status and Handoff

This file is the single source for the stock feature. It is written so another developer (or AI assistant) can pick up
the work without the original conversation. Read [CLAUDE.md](../../CLAUDE.md) first (layout, page shell, rules), then
this file.

- Branch: `feat/stock-management` (not merged into `main` yet)
- Phase 1: **done** (commit `f7af380`)
- Phase 2 (manager pages): **done**
- Phase 3 (owner pages): **not started**

---

## 1. Requirements (agreed with the owner)

Keep the existing roles, PINs, approval flow, Exceptions and Audit.

### Cashier
- Every sale reduces stock automatically.
- Product buttons show «ជិតអស់» (Low) / «អស់» (Out) badges. No quantities anywhere on cashier pages.
- Selling at 0 stock is allowed (setting) but flagged in Exceptions as "stock mismatch".
- Approved void → stock returned automatically.
- Approved return → manager chooses «ចូលស្តុកវិញ» (back to stock) or «ខូច» (damaged).
- Cannot see stock quantities, edit stock, or do Stock In.

### Manager
- **Stock In:** supplier, invoice number, quantity, date. **No cost fields** (manager never sees costs).
- **Adjustments:** required reason (damaged, expired, lost, found, internal use). Adjustments over the limit (setting)
  are flagged in Exceptions.
- **Stock count:** blind count (system qty hidden), one recount allowed, differences go to Exceptions.
- **Low stock:** dashboard alert when at/below minimum level + reorder list.
- **Stock history:** every movement (sale, void, return, stock in, adjustment, count) with user, time, reason.
  14 days, same as reports.
- **Exceptions:** add stock mismatch, large adjustment, count difference.

### Owner
- Enter/confirm unit cost for each Stock In; default to last known cost until confirmed.
- Stock value report at cost, by product and category.
- Shrinkage report in $ (lost, damaged, count differences) by staff and reason.
- Products: minimum stock level and reorder quantity per product.
- Settings: adjustment limit (default 10 units or $50 retail value), allow selling below zero (on/off), count schedule
  (weekly/monthly).
- Audit: full stock history, no 14-day limit.

### Rules
- Stock quantity is never edited directly; it is calculated only from recorded movements.
- Every movement stores user, timestamp, type, quantity and reason.
- Unit costs stay owner-only everywhere (screens, reports, exports). Cost data lives only in `admin-data.js`.

### Decisions taken (do not re-ask)
| Topic | Decision |
|---|---|
| Sell below zero | Setting `allowNegativeStock`, **on** by default. On: sale goes through + `stock_mismatch` event. Off: card disabled, toast error. |
| Adjustment limit | Flag if **either** limit is exceeded: `adjustLimitQty` (10 units) **or** `adjustLimitUSD` ($50 at retail price). |
| Count schedule | `countSchedule` = `weekly` (default) or `monthly`. Manager dashboard shows "count due"; an Exception appears when a count is more than **2 days overdue**. |
| Unconfirmed cost | Stock In uses last known cost (`costOf(sku)`) until the owner confirms; reports mark it «មិនទាន់បញ្ជាក់». Owner dashboard shows how many Stock Ins wait for a cost. |
| Return outcome | Chosen at approval time; default/first option is «ចូលស្តុកវិញ». «ខូច» writes a damaged adjustment and counts as shrinkage against the cashier who made the sale. |
| Low stock | `onHand <= p.minStock`. Reorder list suggests `p.reorderQty`. |
| Cashier sees | Status only (`out` / `low`), never numbers — not in badges, toasts, number pad or notifications. |

---

## 2. Data model (built in phase 1)

All in [src/shared/scripts/data.js](../../src/shared/scripts/data.js), section `===== ស្តុក =====`.

### How on-hand is calculated
```
onHand(sku) = p.opening                                  (catalogue opening balance)
            + Σ live sales with time >= stockOpeningAt() (−qty, derived from receipts, not stored)
            + Σ pos_stock_moves                          (stored movements, ± qty)
```
- `p.opening` (was `p.stock`) in `PRODUCTS` is the balance at the moment in `pos_stock_opening` `{ at }`.
  `stockOpeningAt()` creates that timestamp once (called at the end of `data.js`). Sales before it are already in the
  opening balance.
- **Sales are not stored as movements** — `saleStockMoves(sale)` derives them from the receipt so there is one source
  of truth. Everything else is stored at the moment it happens.
- A void/return of an old (pre-opening) sale is still a stored movement dated at approval → stock comes back correctly.
- Known limitation: registers POS-02/03 history is simulated by `manager-data.js`; their generated sales after the
  opening do **not** move stock (cashier pages can't load that history, and cashier/manager must see the same status).

### localStorage keys
| Key | Content |
|---|---|
| `pos_stock_opening` | `{ at: 'YYYY-MM-DDTHH:mm' }` |
| `pos_stock_moves` | array of movements (below) |
| `pos_catalog` | owner edits per sku; may now also hold `minStock`, `reorderQty` |
| `pos_settings` | adds `allowNegativeStock`, `adjustLimitQty`, `adjustLimitUSD`, `countSchedule` |

### Movement record
```js
{
  id: 'SM-…',            // newId('SM'); derived sales use 'SMS-<saleId>-<sku>'
  type: 'sale' | 'void' | 'return' | 'stock_in' | 'adjust' | 'count',
  sku: '8850001',
  qty: -2,               // signed: + into stock, − out of stock
  at: '2026-10-04T20:33',
  by: 'MGR-01',          // who did it (cashier for sales, approver for void/return)
  reason: '',            // void/return: the request reason; adjust: key of STOCK_ADJUST_REASONS
  ref: '',               // request id, invoice number, count id …
  note: '',
  saleId, shiftId, register   // when linked to a sale
}
```
Planned extra fields for phase 2/3 (not built yet):
- `stock_in`: `supplier`, `invoice`, `date` (delivery date), `costConfirmed: false`. **Cost is NOT stored on the
  movement** — store owner-confirmed costs in an owner-only key (suggest `pos_stock_costs` `{ [moveId]: { cost, by, at } }`)
  read only from `admin-data.js`.
- `count`: `ref` = count session id; `qty` = counted − system (the difference); `note` may hold first count when recounted.

### Constants and functions available now
| Name | Purpose |
|---|---|
| `STOCK_MOVE_TYPE` | label / icon / tone per type |
| `STOCK_ADJUST_REASONS` | `damaged, expired, lost, found, internal` → `{ label, sign, shrink }` |
| `STOCK_STATUS` | `out / low / ok` → `{ label, cls }` chip classes |
| `stockOpeningAt()` | opening timestamp |
| `storedStockMoves()` / `saveStockMoves(list)` | read / append stored moves (append only — never edit or delete) |
| `stockMove(fields)` | builds a move with `id`, `at`, `by` (`currentActorId()`), defaults |
| `saleStockMoves(sale)` | derived sale moves |
| `liveStockMoves()` | all moves since opening, newest first |
| `onHandLevels()` → `{sku: qty}` / `onHand(sku)` | quantities (manager/owner pages only) |
| `stockStatusOf(p, qty)` / `stockStatus(sku, levels?)` | `'out' | 'low' | 'ok'` |
| `allowNegativeStock()` | setting |
| `recordApprovalStock(req, sale, approverId, at)` | called by `applyApprovalToSale` |
| `askReturnOutcome(lines, dark)` | dialog → `true` restock / `false` damaged / `null` cancel |
| `PRODUCT_WEIGHT` | moved above the catalogue; also drives default `minStock` / `reorderQty` |

Defaults per product (in `applyCatalogEdits`): `minStock = max(5, ceil(weight×4))`,
`reorderQty = max(12, round-up-to-6(weight×24))`. `pos_catalog` edits override them.

Event log: `logPosEvent()` now accepts `sku`. New event type `stock_mismatch` (in `EVENT_LABEL`), written by the
terminal's `completeSale` for each line where on-hand before the sale < qty sold.

### Files touched in phase 1
- `data.js` — stock section, settings defaults + `SETTING_LABELS`, `applyApprovalToSale` (records stock, `restock` flag
  on the return record), cashier `portalNotifications` (status only), `opening` field.
- `manager-data.js` — `decideApproval(reqId, approve, approverId, note, extra)`; `mgrDecide` asks the return outcome
  before the PIN.
- `cashier/receipts/receipts.html` — on-the-spot return asks the outcome after the manager PIN.
- `cashier/terminal/pos-terminal.html` — `leftAfterCart`, `cardStatus`, `stockBlocked`; badges; mismatch logging.
- `docs/spec/01-cashier-pos.md`, `CLAUDE.md`.

---

## 3. Phase 2 — Manager pages (to do)

Follow the manager page shell exactly (copy an existing page such as `manager/cash/cash.html` +
`manager/cash/create-movement.html`). Every page is two levels below `src/`, `data-role-root="../.."`, scripts in the
order `ui-components.js → data.js → manager-data.js → portal.js → inline`. Create/view pages are full pages with
`data-back`, never modals. 100% Khmer UI, Arabic numerals.

### 3.1 Nav (portal.js → `PORTAL_CONFIGS.managerPortal`)
Add a group, e.g. after «ចលនាសាច់ប្រាក់»:
```js
{ group: 'ស្តុក', id: 'stock', label: 'ស្តុកទំនិញ', icon: 'mdi:package-variant-closed', href: 'manager/stock/stock.html', badgeFn: 'mgrLowStockCount', badgeTone: 'amber' },
{ id: 'stock-history', label: 'ប្រវត្តិស្តុក', icon: 'mdi:history', href: 'manager/stock-history/stock-history.html' },
{ id: 'stock-count', label: 'រាប់ស្តុក', icon: 'mdi:clipboard-check-outline', href: 'manager/stock-count/stock-count.html' },
```

### 3.2 Pages
| Page | Content |
|---|---|
| `manager/stock/stock.html` | Table: product, category, on hand, min, status chip, reorder suggestion. Filters: all / low / out, category, search. Tab or section «បញ្ជីត្រូវបញ្ជាទិញ» (reorder list: status ≠ ok, suggested qty = `reorderQty`). Header buttons → Stock In, Adjustment. Row `⋮` → history of that product, adjust. |
| `manager/stock/create-stock-in.html` | Supplier (text + recent suppliers dropdown), invoice number, delivery date (default today), lines (product search + qty, several lines). No cost field. Save with manager PIN (`showPinConfirm`). Writes one `stock_in` move per line with shared `ref` = invoice. |
| `manager/stock/create-adjustment.html` | Product, direction from reason (`STOCK_ADJUST_REASONS[reason].sign`), qty, required reason, note. Preview "over limit" when `qty > adjustLimitQty` or `qty × price > adjustLimitUSD`. PIN to save. Writes `adjust` move. |
| `manager/stock-count/stock-count.html` | List of count sessions + «ចាប់ផ្តើមរាប់» button; shows next due date from `countSchedule`. |
| `manager/stock-count/create-count.html` | Blind count: products listed **without** system qty, manager enters counted qty. On submit compare to `onHand`; if any line differs, allow **one** recount of the differing lines only (same pattern as close-shift blind count + recount). Final save writes one `count` move per differing line (`qty = counted − system`), stores the session (suggest `pos_stock_counts` `{ id, at, by, lines:[{sku, system, first, counted}] }`). |
| `manager/stock-history/stock-history.html` | All movements, last 14 days (`HISTORY_DAYS`), filters by type, product, staff, date range (standard date picker per GEMINI.md §3). Columns: time, type chip, product, qty ±, balance after, user, reason/ref. |

### 3.3 manager-data.js additions
- `mgrStockMoves(range)` — `liveStockMoves()` plus **generated history** before the opening so the 14-day history is
  not empty: derive `sale` moves from `generateHistory().sales` with `time < stockOpeningAt()`, `void`/`return` moves
  from their `voidedAt` / `returns[].at` when before the opening, and a few generated `stock_in` deliveries +
  adjustments (deterministic with `rngFor`). Compute history balances **backwards** from the opening:
  `balanceBefore = balanceAfter − move.qty`. Place generated deliveries so backward balances never go below
  `minStock / 2` (walk days from newest to oldest; when the backward balance would get too high, put a delivery of
  `reorderQty` there).
- `mgrLowStockCount()` — products with `stockStatus !== 'ok'` (nav badge).
- Manager `portalNotifications()` — add low/out stock and "count due".
- Dashboard (`manager/dashboard/dashboard.html`) — low stock alert card linking to the reorder list; count due.

### 3.4 Exceptions (`manager/exceptions/exceptions.html` + `exceptionStats`)
Add three kinds. Suggest a separate «ស្តុក» section/table on the page instead of new per-cashier rate columns:
- `stock_mismatch` events (already logged) — per cashier count + value.
- Large adjustments — `adjust` moves where `|qty| > adjustLimitQty` or `|qty| × price > adjustLimitUSD`.
- Count differences — `count` moves (`qty ≠ 0`), value at retail price.
- Overdue count (> 2 days past schedule).

---

## 4. Phase 3 — Owner pages (completed)

Owner pages load `admin-data.js`; only they may read costs.

| Item | Where | Content |
|---|---|---|
| Confirm Stock In cost | new `admin/stock/stock-in.html` (+ `view-stock-in.html`) | List Stock Ins (group by invoice) with «រង់ចាំបញ្ជាក់ថ្លៃដើម» badge; owner enters unit cost per line, default `costOf(sku)` (last known); confirming writes `pos_stock_costs` and updates `pos_costs` via `setCost()` so it becomes the new last cost; `adminLog()` entry. |
| Stock value report | new `admin/reports/stock-value.html` | On hand × unit cost by product and by category; ECharts via `posChart()`; mark unconfirmed costs. |
| Shrinkage report | new `admin/reports/shrinkage.html` | $ at cost of `adjust` moves with `shrink: true` reasons + negative `count` differences + damaged returns; group by staff (`by`, and for damaged returns the sale's cashier) and by reason; date range. |
| Products | `admin/products/products.html` | Add `minStock` and `reorderQty` columns/edit via `updateCatalog(sku, { minStock, reorderQty }, note)`; show on hand + status. |
| Settings | `shared/scripts/settings-page.js` | New section `{ id: 'stock', icon: 'fa-boxes-stacked', label: 'ស្តុក', keys: ['allowNegativeStock', 'adjustLimitQty', 'adjustLimitUSD', 'countSchedule'], admin: true }` — on/off toggle, two number inputs, weekly/monthly option. Managers see it read-only via the existing «ច្បាប់ពីម្ចាស់ហាង» section. |
| Audit | `admin-data.js` `auditTrail()` + `admin/audit/audit.html` | Add all stock moves (stored + generated history, no 14-day limit), new `AUDIT_KINDS.stock`. |
| Owner dashboard | `admin/dashboard/dashboard.html` | Stock value KPI, count of Stock Ins awaiting cost, shrinkage this month. |
| Nav | `PORTAL_CONFIGS.adminPortal` | Add stock entries (stock-in confirmation, reports). |

All Phase 3 pages and features implemented, adhering to 100% Khmer UI, English numerals, dedicated pages, and unified date picker standard.

---

## 5. How to verify

```bash
python3 -m http.server 8000 --directory src   # open localhost:8000
```
- Login page → «កំណត់ទិន្នន័យគំរូឡើងវិញ» resets all `pos_*` data (demo PINs are on that page).
- Demo starts with: sandwich `8860001` and milk `8850004` **Low**, headphones `8890004` **Out**.
- Checks for phase 1: sell headphones → warning toast, `liveEvents()` has `stock_mismatch`; void that receipt →
  `onHand('8890004')` back up; approve a return as «ខូច» → `pos_stock_moves` gets `return +1` and `adjust −1 damaged`.
- Console helpers: `onHand(sku)`, `onHandLevels()`, `liveStockMoves()`, `storedStockMoves()`.
- Before committing: load every page and check the console for errors (headless Chrome over the DevTools protocol works).
- Grep that no cashier page prints a quantity: cashier pages must use only `stockStatus` / `cardStatus`.
