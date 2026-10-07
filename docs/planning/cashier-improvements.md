# Cashier POS — Improvement Plan

> **Date:** 2026-10-03 · **Status:** Implemented 2026-10-04, except C16 (partly) and C17–C21; D3 built 2026-10-07; see §0
> **Inputs:** the four built pages (read and screenshotted at 1440×900 and 390×844), [spec/01-cashier-pos.md](../spec/01-cashier-pos.md),
> [spec/v1-role_cashier_pos.md](../spec/v1-role_cashier_pos.md), [research/pos-market-research.md](../research/pos-market-research.md) (cited below as **R§n**).
> **Companion:** [spec/02-manager-pos.md](../spec/02-manager-pos.md). Many cashier items here hand work to the manager.

Line numbers are as of 2026-10-03 and will drift.

---

## 0. Status (2026-10-04)

| Item | Status |
|---|---|
| C1 blind count, one logged recount, counts-only KPIs on receipts | Done |
| C2 change as $ + ៛ rounded to 100 | Done (two modes; no all-USD mode) |
| C3 open-shift page with float count + manager PIN | Done |
| C4 hold / resume (max per shift in settings, blocks close) | Done |
| C5 void / return requests, on-the-spot or queued | Done |
| C6 discount above limit → manager override, reason required | Done |
| C7 sale stores rate, cashier, register, shift | Done |
| C8 live data in localStorage, cross-tab refresh | Done |
| C9 event log | Done |
| C10 KHQR overlay in the terminal; `khqr-payment.html` removed | Done (confirmation still manual) |
| C11 denser grid + quick keys | Done |
| C12 per-currency expected cash | Done |
| C13 safe-drop banner + drop record, blocks close until received | Done |
| C14 receipt cards on phones | Done |
| C15 role names | Done |
| C16 VAT-registered credit customer prints a tax invoice | Done for the receipt; customer VATTIN is mock data |
| C22 shift templates, overrun chip, terminal lock | Done, extended into the roster model (manager spec §11) |
| C17–C21 | Not built |
| D3 | Built 2026-10-07: receipts → «ប្រគល់ពីវេនមុន» (`findSaleByReceipt`, `RETURN_WINDOW_DAYS` = 7) |

## 1. Where the cashier stood on 2026-10-03

| Page | Built well | Missing vs. spec and research |
|---|---|---|
| `terminal/pos-terminal.html` | Barcode-first search, category pills, stock-aware grid, cart drawer on phones, split tender USD + KHR + KHQR, quick-cash chips, success overlay, lock overlay after close | Hold / resume, manager override, mixed-currency change, any event logging |
| `terminal/khqr-payment.html` | QR, 5-minute countdown, restart, cancel | It is a separate **light** page, so the cashier leaves the dark terminal. No MD5 or expiry stored with the pending payment |
| `receipts/receipts.html` | Shift-locked list, tender tabs, search, ⋮ menu with detail and reprint | Request void / refund; voided status; card layout on phones (the table scrolls sideways at 390px) |
| `shift/close-shift.html` | 4-step wizard, denomination count USD + KHR, variance tiers with reason, PIN + checkbox, A4 Z-report | **Not blind** (C1), no opening-float step, no voids/refunds/movements in the formula, no manager countersign |
| *(none)* `shift/open-shift.html` | — | Whole page missing. The float is hard-coded in `SHIFT` |

The visual baseline is good: dark terminal, clear total, 48px+ targets, Khmer throughout, phone layouts work. Most of
the work below is **missing workflow**, not restyling.

---

## 2. P0 — controls and correctness

These either break the cash-control model or block the manager role.

### C1 · Make the close-shift count blind
- **Where:** `close-shift.html:361-371` `renderSystemSummary()`. Step 1 shows «លក់បានសរុប», «ទទួលជាសាច់ប្រាក់ដុល្លារ» and
  «ទទួលជាសាច់ប្រាក់រៀល» *before* the cashier counts. Float + those figures = the expected drawer.
- **Why:** v1 §3 principle 4 and §12.1 require a blind count. Industry does the same to prevent anchoring and skimming (**R§5**).
  Spec 01 §3.3 step 1 asks for these figures, so the two specs **conflict**. See decision D1.
- **Proposal:**
  - Step 1 shows only what the cashier can't use to back-solve cash: transaction count, items, KHQR total, duration,
    top sellers, and *unresolved held sales* (C4) as a blocker.
  - Hide gross sales too, since gross − KHQR = cash.
  - Step 3 reveals expected vs. counted **after** the count.
  - Going back to recount is allowed **once**. The first count is kept in the record as «ការរាប់លើកទី 1» so the manager sees both.
  - The receipts page has the same leak: its KPI row shows «លក់បានសរុប» and «ទទួលតាមបាគង». Replace the money KPIs
    there with counts (receipts, items, per-tender count), or accept the leak knowingly. The list itself can stay;
    blind counting is about not showing a ready-made expected total.

### C2 · Give change the way Cambodian shops give it
- **Where:** `pos-terminal.html:940` and `:989` show `fmtKHR(toKHR(change))`. That is the *whole* change converted to riel, unrounded
  (e.g. `$2.38` → `9,758 ៛`, or `1,558 ៛` for the cents). Nobody can hand that over.
- **Why:** v1 §7.2 specifies whole dollars plus riel rounded to 100 ៛ (**R§8**).
- **Proposal:**
  - The default change line reads **`$2 + 1,600 ៛`**.
  - A three-way toggle: «ចម្រុះ» / «ដុល្លារទាំងអស់» / «រៀលទាំងអស់».
  - Round riel to the nearest 100 ៛ (direction is decision D4).
  - Store `change: { usd, khr, roundingKHR }` on the sale so the expected cash per currency stays exact. Today expected
    KHR ignores change paid out in riel.

### C3 · Open-shift page
- **Where:** new `cashier/shift/open-shift.html`. Today `data.js:41` hard-codes `openingFloatUSD: 200` / `openingFloatKHR`.
- **Proposal:**
  - Denomination count of the float (reuse the close-shift note rows).
  - Show the amount the manager issued. A mismatch needs a reason.
  - Manager confirms with a PIN (two-person rule, **R§4**).
  - Then «ចាប់ផ្តើមវេន» goes to the terminal.
  - When no shift is open, the terminal sends the cashier here instead of showing the lock overlay.
- Add it to the sidebar? No. Reach it only through that redirect, so it can't be opened mid-shift.

### C4 · Hold / resume a sale
- **Where:** cart header in `pos-terminal.html` (next to `cartClearBtn`), plus a top-bar chip.
- **Proposal:**
  - «ព្យួរការលក់» saves the cart (lines, discount, customer) with a short label and the time. Maximum **5 per shift**.
  - The top bar shows «ការលក់ព្យួរ (2)», which opens a list to resume or discard.
  - Discarding asks for a reason (`showReasonPrompt()`).
  - Held sales are a **step-1 blocker** on close-shift.
  - Storage: `pos_held_sales` in `localStorage`, keyed by shift id.

### C5 · Request a void or refund from the receipts list
- **Where:** `receipts.html:244-252` ⋮ menu. Today it has only detail and reprint.
- **Proposal:**
  - Add «ស្នើលុបចោលវិក្កយបត្រ» (whole sale) and «ស្នើប្រគល់ទំនិញវិញ» (chosen lines and quantities, money back).
    The labels follow `standards/05`: "sales return" = «ការប្រគល់ទំនិញវិញ», "void" = «លុបចោល».
  - Both use `showReasonPrompt()` with reason codes («វាយខុស», «អតិថិជនប្តូរចិត្ត», «ទំនិញខូច», other).
  - The request then goes one of two ways:
    1. **Manager is here:** `showManagerOverride()` approves on the spot.
    2. **Manager is not here:** the request is queued (`status: pending`). The row shows «រង់ចាំអនុម័ត».
  - An approved void marks the sale «បានលុបចោល» (strike-through amount, its own tab).
  - A cash refund lowers expected cash.
  - Close-shift step 1 and the Z-report list void / refund count and amount (spec 01 §3.3 step 1 asks for this; not built).

### C6 · Discount above the limit asks the manager instead of silently capping
- **Where:** `pos-terminal.html:768` `setDiscount()` caps at `SHIFT.discountLimit` with a warning toast.
- **Proposal:**
  - Any discount needs a reason code.
  - Above the limit, open `showManagerOverride({ action: 'discount' })`.
  - Store `discountReason` and `discountApproverId` on the sale. These feed the manager's exception report (**R§6**).

### C7 · Rate of the day, stamped on each sale
- **Where:** `data.js:16` `FX_RATE = 4100`. `receiptHtml()` reads the global at `data.js:512`, and `SHIFT.cashier` at `:492`.
- **Why:** NBC publishes an official rate daily (**R§8**). A reprint must show the rate and cashier of the original sale.
  Once the manager views other cashiers' receipts, the globals print the wrong name.
- **Proposal:**
  - The manager sets the rate in settings (manager spec §5.7).
  - The sale stores `fxRate`, `cashierId`, `terminal`, `shiftId`.
  - `receiptHtml()` and `saleTotals()` read from the sale, falling back to the global only for seed data.

### C8 · Move shift sales to `localStorage`
- **Where:** `data.js:245-259`. `pos_shift_sales` lives in `sessionStorage`, which is per tab.
- **Why:** a manager tab can never see the cashier's sales. Closing the tab loses the sales, but the closed-shift state
  (already in `localStorage`) survives. That mismatch is a bug in its own right.
- **Proposal:**
  - Keep `pos_shift_sales`, `pos_held_sales`, `pos_approvals`, `pos_events` and `pos_cash_movements` in `localStorage`,
    each record carrying `shiftId`.
  - Listen to the `storage` event to refresh badges across tabs (DoD §G).
  - The cart and pending KHQR payment can stay in `sessionStorage`.

### C9 · Log the events the manager will audit
- **Proposal:** one helper, `logPosEvent(type, detail)`, appending to `pos_events`. Types:
  - `line_removed` (`removeLine()` `:568`)
  - `cart_cleared` (`askClearCart()` `:575`)
  - `discount`, `hold`, `hold_discarded`, `void_requested`, `refund_requested`, `override_approved`,
    `override_denied` (wrong PIN), `reprint`
- No UI on the cashier side. This is the input for the manager's exceptions page (**R§6**).

### C22 · Shift pattern (how many shifts a day) and terminal lock
- **Where:** `data.js` `SHIFT_OPEN_AT` always opens at 07:30, and `SHIFT.id` is `SHIFT-YYYYMMDD-A`. Opened in the
  evening, the terminal shows a shift running **15 h 55 min**. That is past Cambodia's 12-hour legal cap and is not a
  real pattern.
- **Why:** a shift = **one cashier, one drawer, open → blind close**. Every handover is a full count (**R§11**). How many
  shifts a day is decided by opening hours, not by the code.
- **Proposal:**
  - **Shift templates** are a branch setting (manager spec §5.7).
    - Default **2 per register**: «វេនព្រឹក» 07:00–14:00, «វេនរសៀល» 14:00–21:00.
    - **3** for 24-hour shops: «វេនព្រឹក» 06:00–14:00, «វេនរសៀល» 14:00–22:00, «វេនយប់» 22:00–06:00.
    - 4 is allowed, not recommended (**R§11**).
  - Shift id includes the register and template: `SHIFT-20261003-POS01-A`.
  - Mock data picks the template that contains "now". Outside opening hours, the terminal shows «ហាងបិទ» instead of a
    15-hour shift.
  - Top bar: «វេនព្រឹក · បិទម៉ោង 14:00». The existing close reminder fires 15 min before the template's end. Past the
    end, the chip turns amber «ហួសម៉ោងវេន 12 នាទី».
  - **Breaks:** a «ចាក់សោរបញ្ជរ» button in the top bar locks the terminal behind the *same* cashier's PIN. No count,
    no new shift, logged as `terminal_locked`/`unlocked`. Another cashier can't unlock it. They need their own
    shift (and drawer).
  - **Early leave / sickness:** the outgoing cashier does a normal blind close, and the incoming one opens a new shift
    with a counted float (C3). There is no "hand the drawer over without counting" path.

---

## 3. P1 — flow and UI quality

### C10 · KHQR inside the terminal
- **Where:** `pos-terminal.html:1022` navigates to the light-themed `khqr-payment.html`.
- **Proposal:**
  - A full-screen dark overlay on the terminal itself, with a large QR the customer can scan, the amount in USD and KHR,
    and a countdown bar (amber under 60s, rose under 15s).
  - «បង្កើតកូដថ្មី» on expiry, «បោះបង់» back to tender.
  - Store `md5`, `expiresAt` and `receiptId` with the pending payment so a reload can resume it (**R§8**).
  - Spec 01 §3.1 D already asks for an overlay. The DoD's "no modal" rule targets create/edit/view forms, not a payment step.
  - Retire the separate page once the overlay works.

### C11 · Product grid density and quick keys
- **Where:** `pos-terminal.html:54-55` `minmax(176px, 1fr)` with a tall image area. At 1440×900 only about 10 products
  show above the fold.
- **Proposal:**
  - Shorter image (about 4:3 instead of square) so 3 rows fit at 900px.
  - A «ទំនិញញឹកញាប់» row of 6–8 favourites above the grid, set by the manager.
  - Barcode stays primary. The grid is for unlabelled goods (bread, cake), so those should be easiest to reach.

### C12 · Expected-cash formula with movements
- Once the manager spec's cash movements exist:
  `expected[cur] = float[cur] + cashSales[cur] − changeGiven[cur] − cashRefunds[cur] − payouts[cur] − drops[cur] + payIns[cur]`.
- Compute it per currency (USD and KHR separately), not one converted total.
- Change `shiftSummary()` (`data.js:387`) to return per-currency figures.

### C13 · Safe-drop prompt
- When the estimated USD in the drawer passes the manager's limit (e.g. $500), show a rose banner on the terminal:
  «សាច់ប្រាក់ក្នុងថតលើសកំណត់ · សូមផ្ទេរចូលទូដែក».
- Tapping it records the drop amount per currency, pending the manager's receipt (manager spec §5.4).
- An unconfirmed drop blocks close-shift (**R§4**).

### C14 · Receipts list as cards below 640px
- **Where:** `receipts.html:73` `overflow-x-auto`. At 390px the payment-method column is cut off and scrolls sideways.
- **Proposal:** stack each receipt as a card (time + number, items, method badge, amount, ⋮). Keep the table from `sm:` up.

### C15 · Lock overlay and notifications name the right role
- **Where:** `pos-terminal.html:293`, `close-shift.html:121`, and `data.js:547` say «អ្នកគ្រប់គ្រងទូទៅ».
- Once the manager role exists, use the manager role name (decision D5).

### C16 · Credit-customer tax invoice
- `CREDIT_CUSTOMERS` (`data.js:233`) has no VATTIN or address.
- For a VAT-registered credit customer, the receipt must add buyer name, address and VATTIN to count as a tax invoice
  (**R§9**). Walk-in receipts already meet the commercial-invoice basics.

---

## 4. P2 — later

| # | Item | Note |
|---|---|---|
| C17 | Customer-facing display | `window.open` a second screen with cart, total and the KHQR. Valuable where KHQR is the main tender |
| C18 | Online/offline badge | Placeholder only, per `standards/04` Q1 (PWA is Phase 3) |
| C19 | Keyboard shortcuts on desktop | Optional extra, since spec 01 assumes touch: F2 search, F4 hold, F8 pay |
| C20 | Line-level discount and price override | Both behind the manager override. Cart-level discount covers the prototype |
| C21 | No-sale drawer open | Needs hardware. Log it as an event with a manager PIN when a drawer exists |

---

## 5. Decisions needed

| # | Question | Options | Recommendation |
|---|---|---|---|
| D1 | Blind count vs. spec 01 step 1 | (a) blind, as in v1 §12 and industry · (b) keep spec 01 | **(a)**, and update spec 01 §3.3 step 1 to match |
| D2 | Separate card / bank tender (ABA, ACLEDA, Wing)? | (a) add a tender with a reference no. · (b) treat as KHQR, since bank apps pay KHQR | **(b)** for now. Spec 01 lists ABA/WING. Confirm with the business |
| D3 | Refund of a sale from an earlier shift | (a) cashier enters the exact receipt no., system fetches that one sale, manager approves · (b) only the manager can refund | **(a)**. It keeps the "no browsing" shift lock while allowing returns |
| D4 | Riel change rounding | nearest 100 ៛ · always down (customer's favour) · always up | **Nearest 100 ៛**, rounding difference recorded per sale |
| D5 | Manager role name in Khmer | «អ្នកគ្រប់គ្រងវេន» (already on the Z-report signature, `close-shift.html:790`) · «អ្នកគ្រប់គ្រងហាង» | **«អ្នកគ្រប់គ្រងវេន»**. Add it to `standards/05` §5 |
| D6 | Who may reopen a closed shift | GM only (spec 01) · manager with reason | **Manager with reason + audit entry.** GM is not in this repo |
| D7 | Shifts per register per day | 2 · 3 · 4 | **A setting, default 2** (07:00–21:00 shop). 3 for 24-hour shops. 4 means 4 counts and 4 reviews per register a day, so use it only for part-time staffing (**R§11**) |

---

## 6. Suggested order

1. **Foundation:** C8 (storage), C7 (sale carries its context), C9 (event log). Invisible, but everything else needs them.
2. **Money correctness:** C2 (change), C1 (blind count), C12 (per-currency expected).
3. **Shift edges:** C22 (shift templates, terminal lock), C3 (open shift), C4 (hold).
4. **With the manager role:** C5, C6, C13 need `showManagerOverride()` and the approvals store from manager spec §6–7.
5. **Polish:** C10, C11, C14, C15, C16.

After each step, run the page through [standards/06-page-definition-of-done.md](../standards/06-page-definition-of-done.md) and
screenshot it at 1440, 768 and 390 px.
