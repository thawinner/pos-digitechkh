# Cashier / POS — v2 UI/UX Design Plan

> **Portal ID:** `posPortal`
> **Existing Folder:** `frontend/roles/05-cashier-pos/`
> **Last Updated:** 2026-09-25
> **Archetype:** A — Touch & Floor Console

---

## 1. Role Identity

| Property | Value |
|---|---|
| **Archetype** | A — Touch & Floor Console |
| **Primary Color** | Teal/Cyan `#0891b2` |
| **Accent Color** | Emerald `#10b981` (confirm / paid / success) |
| **Warning Color** | Amber `#f59e0b` (variance alerts, pending states) |
| **Danger Color** | Rose `#f43f5e` (voids, errors, overage) |
| **Background Tone** | Dark slate `#0f172a` for the POS terminal itself; Light `#f0fdfa` for admin pages |
| **UI Style** | Archetype A: full-screen panels, 48px+ touch targets, barcode-scan-first, minimal text, maximum visual clarity under bright retail lighting |
| **Font Weight Usage** | Product names: `600`; Prices in cart: `700` bold; Totals: `800` extra-bold; Labels: `500`; Small metadata: `400` |
| **Key Persona** | Retail Cashier — processes 20–100 transactions per shift. Works under time pressure. Needs zero-thought UI: scan → cart → pay → done. Cannot see history from other shifts, cannot see cost prices, cannot access management features. |

### Critical Data Rules

> **RULE 1 — SHIFT LOCK:** The Cashier can ONLY see data from their **current active shift**. Any data from previous shifts (even same day) is completely hidden and inaccessible. Attempting to access previous shift data returns a `403 Forbidden` state with message: `ទិន្នន័យវេនផ្សេងត្រូវបានការពារ`.

> **RULE 2 — NO COST PRICES:** Purchase cost price (`ថ្លៃដើមទិញ`) must **NEVER** appear on any screen, receipt, modal, or print output for this role. Products display only their selling price.

> **RULE 3 — TOUCH FIRST:** Every interactive element must have a minimum touch target of **48×48px**. No hover-only interactions. All actions must be completable by tapping alone (no right-click, no keyboard shortcuts assumed).

> **RULE 4 — NO ANALYTICS:** No revenue charts, no monthly history, no trend graphs, no comparative data. Cashier sees only what they need RIGHT NOW.

---

## 2. Sidebar Navigation

The POS terminal (`pos-terminal.html`) does **NOT** use the standard portal sidebar layout. It uses a dedicated full-screen split layout (detailed below). The sidebar only appears on secondary pages (`receipts.html`, `close-shift.html`).

| # | ID | Label (KH) | Icon (MDI) | href Target | Badge/Alert |
|---|---|---|---|---|---|
| 1 | `nav-pos` | ផ្ទាំងគិតលុយ | `mdi:point-of-sale` | `pos-terminal.html` | None (always primary) |
| 2 | `nav-receipts` | វិក្កយបត្រក្នុងវេន | `mdi:receipt-text-outline` | `receipts/receipts.html` | Yes — today's transaction count (teal pill) |
| 3 | `nav-close-shift` | បិទវេន និងរាប់សាច់ប្រាក់ | `mdi:cash-lock-open` | `close-shift.html` | None |

### Sidebar Design Notes (Secondary Pages Only)

- Sidebar width: `220px` (slightly narrower than standard — maximizes content area)
- Background: `#0f172a` (dark slate) with teal active state
- Active item: teal left border `4px`, background `rgba(8, 145, 178, 0.2)`, teal icon + label
- Inactive item: white icon + label at 60% opacity
- Footer: `[🚪 ចេញពីវេន]` logout/end-shift shortcut button
- On small screens: sidebar collapses to bottom tab bar (3 icons only)

---

## 3. Pages & Layouts

---

### 3.1 POS Terminal (`pos-terminal.html`)

**Purpose:** The primary real-time transaction screen — a cashier's entire workflow lives here: find product, build cart, take payment, issue receipt.

**Layout:** Full-screen split-panel layout. **This page does NOT use the standard portal layout template.** It has its own base HTML structure with class `archetype-a-layout`. The page occupies 100% of viewport height and width with no scroll on the outer shell.

```
┌─────────────────────────────────────────────────────────────────┐
│ TOP BAR: Shift info + Cashier name + Clock + Quick nav icons     │
├────────────────────────────────┬────────────────────────────────┤
│                                │                                 │
│   LEFT PANEL (60%)             │   RIGHT PANEL (40%)             │
│   Product Grid                 │   Cart & Checkout               │
│                                │                                 │
│   [Search / Barcode Input]     │   Cart item list                │
│   [Category filter pills]      │   ─────────────────             │
│                                │   Customer (optional)           │
│   ┌──┐ ┌──┐ ┌──┐ ┌──┐        │   Discount field                │
│   │  │ │  │ │  │ │  │        │   ─────────────────             │
│   └──┘ └──┘ └──┘ └──┘        │   Subtotal / VAT / Total        │
│   ┌──┐ ┌──┐ ┌──┐ ┌──┐        │   ─────────────────             │
│   │  │ │  │ │  │ │  │        │   [💵 Cash] [📱 KHQR] [💳 Card]│
│   └──┘ └──┘ └──┘ └──┘        │   Cash input / Change           │
│                                │   ─────────────────             │
│                                │   [✓ បញ្ចប់ការទូទាត់]          │
└────────────────────────────────┴────────────────────────────────┘
```

---

#### Section A — Top Bar (Full Width)

- Height: `56px`, background `#0f172a`, fixed at top
- **Left:** App logo/mark (small, 24px) + text `eBMS POS`
- **Center:** Current shift info — `វេន: #2026-09-25-01` | `ចាប់ផ្តើម: 08:00` | live clock `HH:MM:SS`
- **Right:** Cashier name + avatar initial (teal circle) + icon buttons: `[📋 Receipts]` `[🔒 Close Shift]` (these link to the respective pages)
- The top bar navigation icons replace the sidebar for this page only

---

#### Section B — LEFT PANEL (60% width) — Product Grid

**Background:** Dark `#1e293b`

##### B1 — Search / Barcode Scan Input

- Full-width input, height `56px`, at the very top of the left panel
- Background: `#334155`, border-radius `8px`, text color white
- Placeholder: `ស្វែងរក ឬស្កែន Barcode...` (with `mdi:barcode-scan` icon prefix)
- **Auto-focused on page load** and re-focused after every transaction completion
- Input accepts:
  - Text search (product name — live filter as user types, debounced 200ms)
  - Barcode input (if barcode scanner is used, it will type the barcode string and press Enter — intercepted and treated as product lookup by barcode)
- On barcode match: product is automatically added to cart (qty 1) without any extra tap needed

##### B2 — Category Filter Pills

- Horizontal scrollable pill row below the search bar
- Each pill: category name, `36px` height, `12px` horizontal padding
- Pills: `ទាំងអស់` (always first) + all product categories from data
- Active pill: teal fill `#0891b2`, white text; Inactive: `#334155` background, gray text
- Pills scroll horizontally with momentum on touch (no arrows needed)

##### B3 — Product Card Grid

- Grid: **4 columns on desktop, 3 columns on tablet (768px–1024px), 2 columns on phone**
- Gap: `12px`
- Overflow: vertical scroll within left panel only

**Each Product Card:**
- Background: `#1e293b`, border `1px solid #334155`, border-radius `12px`
- **Minimum touch target: 100% of card area, minimum height `120px`**
- On tap: immediate add-to-cart (no confirmation modal) with visual "flash" feedback (brief scale + teal border glow)
- On long-press (500ms): show product detail tooltip (name, SKU, stock) — NOT on quick tap

**Card content:**
1. **Product Image / Icon Area** (top 60% of card):
   - If product has image: show image, `object-fit: cover`
   - If no image: show large category icon in teal, centered on `#0f172a` background
2. **Product Name** (bottom section): `12px`, `600` weight, white, max 2 lines with ellipsis
3. **Selling Price** (below name): `14px`, teal color `#22d3ee`, bold — e.g. `$2.50`
4. **Stock Count Badge** (top-right corner of card):
   - Stock > 10: `small green pill with count`
   - Stock 1–10: `amber pill` with count (low stock warning)
   - Stock = 0: `red "OUT"` pill + card is dimmed (50% opacity) + not tappable

**Out of Stock behavior:** Tapping an out-of-stock card triggers a brief vibration (if supported) and shows a toast: `ទំនិញអស់ស្តុក — មិនអាចបន្ថែមបាន`

---

#### Section C — RIGHT PANEL (40% width) — Cart & Checkout

**Background:** `#0f172a` (darkest tone, to make this panel stand out as the "action zone")

##### C1 — Cart Item List

- Scrollable area for cart items (grows as items added, fixed max-height with scroll)
- **Empty state:** Large teal cart icon + text `Cart ទទេ — ចុចលើទំនិញដើម្បីបន្ថែម` (centered)

**Each cart row:**
- Product name (white, `14px`, `600`)
- **Qty controls (must be 48px+ touch targets):**
  - `[−]` button (round, `48×48px`, teal outline) — decrement; at qty 1, pressing removes the item
  - Qty number (white, `18px`, `700`, centered in `48px` wide display)
  - `[+]` button (round, `48×48px`, teal fill) — increment
- Unit price (gray `#94a3b8`, `12px`)
- Line total (white, `14px`, `700`, right-aligned)
- Swipe-left gesture on row: reveals `[🗑️]` delete button (48px red button)

- **Clear All button:** `[🗑️ លុបទាំងអស់]` small button at top-right of cart section — requires single tap confirmation (color changes to red, tap again to confirm)

##### C2 — Customer Selector (Optional)

- Collapsed by default — shows as: `[👤 + បន្ថែមអតិថិជន (ស្នើ)]`
- Tap to expand: shows searchable customer dropdown
- Only credit customers appear in this list (customers with credit_limit > 0)
- If selected: customer name shows with credit limit info
- For walk-in cash customers: leave empty

##### C3 — Discount Field

- Label: `ការបញ្ចុះតម្លៃ (%)`
- Input: number input, `0–[max_discount_pct]` — max is defined per cashier profile (e.g. 5%)
- If cashier tries to enter discount above their allowed %, input is capped with toast warning: `អ្នកអាចបញ្ចុះតម្លៃបានតែ X% ប៉ុណ្ណោះ`
- Default: 0

##### C4 — Financial Summary

- Fixed section, always visible at bottom of right panel
- Background: `#1e293b`, top border `2px solid #0891b2`
- Rows:
  - `សរុបរង:` ........... `$XX.XX` (white, normal)
  - `ការបញ្ចុះតម្លៃ:` ...... `-$X.XX` (amber, if applied)
  - `VAT 10%:` ........... `$X.XX` (white, normal)
  - `══════════════════`
  - **`សរុប:` ............... `$XX.XX`** — **Extra bold `28px`, teal `#22d3ee`** — THE most prominent number on screen

##### C5 — Payment Method Selector

- Three large equal-width buttons, stacked or in a 3-column row:
  - `[💵 សាច់ប្រាក់]` — selected state: teal fill, white text; unselected: dark outline
  - `[📱 KHQR]` — selected state: teal fill
  - `[💳 ABA/WING]` — selected state: teal fill
- Button height: `56px` minimum, `14px` label, icon `24px`
- Only one can be active at a time (radio behavior)
- Default: `សាច់ប្រាក់` (cash) pre-selected

**If Cash selected — Cash Input Panel:**
- Large number input: `ទទួលបានសាច់ប្រាក់:` — labeled clearly
- Input height `56px`, font `22px` bold, centered
- Pre-populate suggestions: common denomination buttons `[$5]` `[$10]` `[$20]` `[$50]` (teal pill buttons, 48px height) — tap to fill input
- **Change display:** `ប្រាក់អាប់ (Change): $X.XX` — auto-calculated, large text, emerald color
- If cash entered < total: `Change` shows `0.00` and confirm button is disabled with tooltip: `ប្រាក់មិនគ្រប់`

**If KHQR selected — KHQR Panel:**
- `[បង្ហាញ KHQR]` button (large, teal) → triggers KHQR modal
- Description: `QR Code នឹងបង្ហាញសម្រាប់ចំនួន $XX.XX`

**If ABA/WING selected:**
- Input field: `លេខយោង / Reference` (optional)
- Cashier manually confirms physical payment received, then taps complete

##### C6 — Complete Transaction Button

- `[✓ បញ្ចប់ការទូទាត់]`
- Full width of right panel, height `64px`
- Background: `#10b981` (emerald green) when all conditions met
- Background: `#374151` (disabled gray) when cart is empty or payment conditions not met
- Font: `18px`, `700`, white
- On tap: brief loading spinner (0.5s), then success state

**On Success:**
- Animate: cart clears with a "whoosh" effect
- Show success overlay: `✅ ទូទាត់ជោគជ័យ!` + amount + change
- Print/show digital receipt options: `[🖨️ បោះពុម្ពបង្កាន់ដៃ]` `[📱 បញ្ជូន SMS]` `[ឆ្លងកាត់]`
- After 3 seconds (or tap "ឆ្លងកាត់"): return to empty cart, re-focus barcode input for next transaction

---

#### Section D — KHQR Modal

- Triggered when KHQR payment method is selected and checkout is initiated
- Full-screen overlay (dark background `rgba(0,0,0,0.85)`) or bottom sheet on mobile
- **Content:**
  - QR Code image (large, centered) — dynamically generated for the exact transaction amount
  - Amount: `$XX.XX` (large, teal, below QR)
  - Countdown timer: `⏱ XX:XX` remaining (default 5 minutes; amber → red as time decreases)
  - Status indicator: `⏳ រង់ចាំការទូទាត់...` → `✅ បានទូទាត់!` (auto-detected via payment webhook or polling)
  - `[❌ បោះបង់]` button — returns to payment method selection
- On payment detection: modal auto-closes, transaction completes with success overlay
- On timeout: modal closes with message `QR Code ផុតអាយុ — សូមព្យាយាមម្តងទៀត`

**Rules/Constraints:**
- This page has NO standard sidebar — it uses only the top bar for navigation
- Left panel and right panel do NOT scroll the outer shell; each panel scrolls independently
- No cost prices anywhere
- No revenue analytics, no shift comparison, no monthly history
- Barcode scan must work within 500ms of page load (auto-focus)
- Touch targets: all interactive elements ≥ 48×48px, preferably 56px for critical actions
- On desktop mouse use: hover states are fine as enhancement but not required for functionality

**Files to Create/Modify:**
- `frontend/roles/05-cashier-pos/pos-terminal.html`
- Add `archetype-a-layout` CSS class handling

---

### 3.2 Current Shift Receipts (`receipts/receipts.html`)

**Purpose:** Allow the cashier to view, search, and reprint receipts from the **current shift only**. No historical data access.

**Layout:** Standard sidebar layout (sidebar on left, content on right). Clean, minimal, readable. `w-full` — full-width content area per project standards (no max-width constraint).

---

#### Section A — Shift Summary Header

- Full-width card at top of content area
- Background: teal `#0891b2`, text white
- **Displayed metrics (inline row):**
  - `🕐 វេនចាប់ផ្តើម:` [start datetime]
  - `🧾 ចំនួនប្រតិបត្តិការ:` [count] transactions
  - `💵 សាច់ប្រាក់:` $XX.XX total
  - `📱 KHQR:` $XX.XX total
  - `💳 ABA/WING:` $XX.XX total
- All figures are from the current shift only
- A subtle label: `ព័ត៌មានចំពោះវេនបច្ចុប្បន្នប៉ុណ្ណោះ` (Current Shift Only indicator)

---

#### Section B — Search Bar

- Single input: `ស្វែងរកបង្កាន់ដៃ...`
- Searches within: receipt number, customer name, amount
- Search scope is **hard-limited to current shift** (backend enforces this — no parameter can override)

---

#### Section C — Receipts List

- **Table or card list** (table preferred for density on tablet)
- Columns:

| Column | Detail |
|---|---|
| `#បង្កាន់ដៃ` | Receipt number e.g. `RCP-2026-09-25-001` |
| `ម៉ោង` | Time only (HH:MM) — not full date (it's always today's shift) |
| `អតិថិជន` | Customer name or `Walk-in` for anonymous |
| `ចំនួន` | Total amount paid (USD) |
| `វិធីទូទាត់` | Icon + label: 💵 / 📱 / 💳 |
| `[បោះពុម្ព]` | Reprint button — teal outlined, `48px` height |

- Row tap (anywhere except Reprint button): expand inline receipt summary OR navigate to receipt detail modal
- Sorted: newest first
- No pagination needed for typical shift (20–100 receipts); infinite scroll or simple scroll within fixed height

**Empty State:**
- Icon + text: `មិនទាន់មានប្រតិបត្តិការក្នុងវេននេះ — ចូលទៅបង្ហ្វាត [ផ្ទាំងគិតលុយ] ដើម្បីចាប់ផ្តើម`

**Rules/Constraints:**
- **Absolute data isolation:** The query for this page MUST include `shift_id = current_shift.id` as a required filter. There is no "view all" or "search across shifts" option.
- Cashier cannot delete or void a receipt from this page (can only reprint)
- Voiding a receipt requires GM/Admin action on a separate admin page
- NO cost prices, NO margin, NO revenue analysis
- NO data from previous shifts — even if same calendar day

**Actions:**
- `[↩ ត្រឡប់ POS]` — back link to `pos-terminal.html` (prominent, always visible)
- `[🖨️ បោះពុម្ព]` per row — triggers `window.print()` or receipt printer command for that receipt

**Files to Create/Modify:**
- `frontend/roles/05-cashier-pos/receipts/receipts.html`

---

### 3.3 End of Shift & Z-Report (`close-shift.html`)

**Purpose:** Guide the cashier through a structured, wizard-style shift closing process: review system totals → physically count cash → enter counts → see variance → confirm and lock the shift.

**Layout:** Standard sidebar layout (same sidebar as receipts.html). Content area uses a **step-by-step wizard** with numbered steps. `w-full px-6 lg:px-16` — full-width with generous padding per project standards.

---

#### Wizard Overview

- **Step indicator:** Horizontal stepper at top of content area showing 4 steps
- Current step: teal filled circle with number
- Completed steps: teal check circle
- Pending steps: gray outlined circle
- Step labels: brief, in Khmer

```
① ព័ត៌មានប្រព័ន្ធ → ② រាប់ប្រាក់ → ③ ភាពខុសគ្នា → ④ បញ្ជាក់ & បិទ
```

- Navigation: `[← ថយក្រោយ]` and `[ទៅមុខ →]` buttons at bottom of each step (48px height)
- Cannot skip to a later step; can go back to previous steps until final confirm

---

#### Step 1 — System Summary (`ព័ត៌មានប្រព័ន្ធ`)

**Purpose:** Show the cashier what the system recorded for their shift before they physically count.

**Note displayed at top:** `ចំណាំ: ទិន្នន័យខាងក្រោមគឺជាការគណនារបស់ប្រព័ន្ធ — សូមមើលមុនពេលរាប់ប្រាក់`

**Displayed data (read-only info cards):**

| Metric | Display |
|---|---|
| ចំនួនប្រតិបត្តិការ | Total transactions this shift |
| ចំនួនទឹកប្រាក់រួម | Total revenue (selling prices sum, NO cost data) |
| ចំនួនសាច់ប្រាក់ | Cash transactions total |
| ចំនួន KHQR | KHQR transactions total |
| ចំនួន ABA/WING | Card transactions total |
| ការបញ្ចុះតម្លៃ | Total discounts given |
| VAT ប្រមូលបាន | Total VAT collected |
| ការទូទាត់ត្រឡប់ (Voids) | Count and amount of voided transactions (if any) |

- Each metric is a labeled card with large bold value
- Color: emerald for positive totals, amber for voids

**Bottom:** `[ទៅមុខ → ចូលរាប់ប្រាក់]` button (teal, full width, 56px height)

---

#### Step 2 — Physical Cash Count (`រាប់ប្រាក់`)

**Purpose:** Cashier physically counts all cash in their drawer and enters the count by denomination.

**Header note:** `សូមរាប់ប្រាក់ក្នុងថតរបស់អ្នកឥឡូវនេះ ហើយបំពេញតម្លៃខាងក្រោម`

**Denomination Input Form:**

A clean form table with each row being one denomination:

| Denomination | Qty Input | Subtotal (auto-calculated) |
|---|---|---|
| $100 | [  ] | = $XXX |
| $50  | [  ] | = $XXX |
| $20  | [  ] | = $XXX |
| $10  | [  ] | = $XXX |
| $5   | [  ] | = $XXX |
| $1   | [  ] | = $XXX |
| $0.50 (50¢) | [  ] | = $X.XX |
| $0.25 (25¢) | [  ] | = $X.XX |
| $0.10 (10¢) | [  ] | = $X.XX |
| **សរុបរាប់** | — | **= $XXX.XX** (bold, live update) |

- Qty inputs: large number inputs, `48px` height, numeric keyboard on touch devices (`inputmode="numeric"`)
- Subtotal per row updates live as qty is typed
- Running total at the bottom updates live
- All qty inputs default to 0
- If cashier doesn't deal in all denominations, they can leave them 0

**Riel section (optional):**
- Collapsible: `[+ បន្ថែមប្រាក់រៀល]` — expands similar denomination table for KHR if the business accepts Riel

**Bottom navigation:** `[← ថយក្រោយ]` `[ទៅមុខ → ពិនិត្យភាពខុសគ្នា →]`

---

#### Step 3 — Variance Display (`ភាពខុសគ្នា`)

**Purpose:** Automatically compare system-calculated cash total vs cashier-counted cash total and flag discrepancies.

**Comparison Table:**

| Label | Amount |
|---|---|
| ប្រព័ន្ធគណនា (System) | $XXX.XX |
| អ្នករាប់ (Counted) | $XXX.XX |
| **ភាពខុសគ្នា (Variance)** | **$X.XX** |

**Variance Display Rules:**

- **Variance = $0.00:** Large emerald checkmark `✅` + text `ត្រឹមត្រូវ! គ្មានភាពខុសគ្នា`
- **Variance ≤ $5.00:** Amber warning banner: `⚠ ភាពខុសគ្នាតូច — $X.XX — សូមត្រួតពិនិត្យ`
  - Cashier can still proceed but must acknowledge by tapping: `[ខ្ញុំបានពិនិត្យរួចហើយ — ទទួលស្គាល់]` checkbox
- **Variance > $5.00:** Red alert banner: `🚨 ភាពខុសគ្នាធំ — $X.XX — ទាមទារការពន្យល់`
  - A mandatory **Explanation Textarea** appears: `ហេតុផល / Reason for Variance` (required, min 20 chars)
  - GM/Admin will be notified automatically on shift close
  - Cashier can still close the shift but must fill explanation

**Short / Over Labels:**
- If counted > system: `ច្រើន (Over): +$X.XX` (amber)
- If counted < system: `ខ្វះ (Short): -$X.XX` (red)
- If equal: `ត្រឹម (Balance): $0.00` (emerald)

**Bottom navigation:** `[← ថយក្រោយ]` `[ទៅមុខ → បញ្ជាក់ →]`

---

#### Step 4 — Signature Confirmation & Close (`បញ្ជាក់ & បិទ`)

**Purpose:** Final review and confirmation before permanently locking the shift.

**Summary recap card:**
- Shift number, date, start time
- Cashier name
- Total transactions, total revenue
- Cash counted, system expected, variance
- Variance status (✅ / ⚠ / 🚨)

**Signature / PIN Confirmation:**
- Option 1: Digital signature pad (canvas element, draw signature with finger/mouse)
- Option 2: PIN re-entry `[Enter PIN to Confirm]` — `4–6 digit` numeric input
- Label: `ខ្ញុំបញ្ជាក់ថាការរាប់ខាងលើត្រឹមត្រូវ ហើយខ្ញុំព្រមបិទវេននេះ`

**Important warning box (amber):**
`⚠ ការបិទវេនមិនអាចត្រូវបានប្រតិស្ថាបនបានទេ — GM/Admin ប៉ុណ្ណោះអាចបើកវេនម្តងទៀត`

**[✓ បញ្ជាក់ & បិទវេន] button:**
- Full width, `64px` height
- Background: rose `#f43f5e` (intentionally serious/red — this is a destructive-in-scope action)
- Label: `✓ បញ្ជាក់ & បិទវេន`
- On tap: confirmation dialog: `"តើអ្នកប្រាកដជាចង់បិទវេននេះ?"` with `[ទេ]` and `[បាទ/ចា — បិទ]` buttons
- On confirm: shift is locked, system records: shift close time, cashier ID, counted amount, variance, reason (if any)

---

#### Section D — Z-Report Preview (After Closing)

- Shown after shift successfully closed
- Full-width panel: `ការបិទវេនបានជោគជ័យ ✅`
- Below: A4-format Z-Report preview card

**Z-Report includes (printable A4):**

- Company header / letterhead
- **Z-REPORT / របាយការណ៍បិទវេន** title
- Shift info: date, shift #, cashier name, open time, close time
- Transaction breakdown:
  - Total transactions count
  - Sales by payment method (Cash / KHQR / Card)
  - Discounts total
  - VAT total
  - Net revenue total (selling prices — NO cost prices)
  - Void/refund count and amount
- Cash reconciliation:
  - System expected cash
  - Counted cash
  - Variance + status
- Signature block: Cashier / Supervisor
- Footer: print timestamp

**Actions on success screen:**
- `[🖨️ បោះពុម្ព Z-Report]` — `window.print()` targeting A4 report only
- `[🏠 ត្រឡប់ទំព័រដើម]` — returns to `pos-terminal.html` (but shift is locked, so a new shift must be opened first)
- `[🔓 ចាប់ផ្តើមវេនថ្មី]` — if authorized, opens new shift and returns to POS terminal

**Cannot-reopen rule:**
- If cashier navigates back to `pos-terminal.html` with a closed shift and no new shift, they see:
  - Full-screen lock overlay: `🔒 វេនត្រូវបានបិទ — សូមទំនាក់ទំនង GM ដើម្បីបើកវេនថ្មី`
  - No way to bypass this at cashier level

**Rules/Constraints:**
- Shift close is irreversible for the Cashier role
- Only GM / Admin / Super Admin can re-open a closed shift (from their respective portals)
- Z-Report is auto-saved to the server on close (not dependent on print)
- Cashier cannot modify any figures in the Z-Report
- Variance > $5 auto-creates a notification to the GM and Chief Accountant dashboards

**Files to Create/Modify:**
- `frontend/roles/05-cashier-pos/close-shift.html`

---

## 4. UI Identity Details

| Property | Value |
|---|---|
| **POS Terminal BG** | `#0f172a` (near-black dark slate) — high contrast for retail environments |
| **Left Panel BG** | `#1e293b` (dark blue-gray) |
| **Right Panel BG** | `#0f172a` (darkest) |
| **Primary Interactive Color** | `#0891b2` (Teal/Cyan) — buttons, category pills, selected states |
| **Total Amount Color** | `#22d3ee` (bright cyan) — the grand total must POP visually |
| **Success / Paid** | `#10b981` (Emerald) — complete button, success overlays |
| **Warning** | `#f59e0b` (Amber) — low stock, variance warnings |
| **Danger** | `#f43f5e` (Rose) — out of stock, voids, close-shift button |
| **Secondary Pages BG** | `#f0fdfa` (very light teal tint) — receipts, close-shift pages |

### Unique Design Elements (vs. Other Roles)

- **Full-screen split panel POS layout** — unique to this role, no other role has this
- **Dark mode terminal** — all other roles use light backgrounds; POS terminal is dark for usability under bright retail lighting and to reduce eye strain during long shifts
- **Auto-focused barcode field** — workflow optimized for scanner-first input
- **Denomination grid** for cash counting — structured physical process assistance
- **Wizard-based shift close** — step-by-step guided process unlike any other role's flat forms
- **Shift data isolation** — strict boundary that no other role has
- **Real-time change calculator** — immediate visual feedback for cash transactions
- **KHQR countdown timer** — live payment status detection

---

## 5. Developer Notes

### portal.js Changes

- `posPortal` nav config is **already correct** — no items need to change
- Badge on `nav-receipts`: bind to `currentShift.transaction_count` (updates live via polling or WebSocket)
- `pos-terminal.html` must **NOT** initialize the standard portal sidebar — it uses its own layout engine

```javascript
// In posPortal init — skip sidebar render for POS terminal
if (window.location.pathname.includes('pos-terminal.html')) {
  initPOSTerminalLayout(); // custom layout function
} else {
  initStandardPortalLayout(); // normal sidebar + content
}
```

### Archetype A Layout CSS

Create a dedicated CSS file or class block:

```css
/* archetype-a-layout — Touch POS Terminal */
.archetype-a-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.archetype-a-layout .pos-top-bar {
  height: 56px;
  flex-shrink: 0;
  background: #0f172a;
}

.archetype-a-layout .pos-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.archetype-a-layout .pos-left-panel {
  width: 60%;
  background: #1e293b;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.archetype-a-layout .pos-product-grid {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* smooth iOS scroll */
}

.archetype-a-layout .pos-right-panel {
  width: 40%;
  background: #0f172a;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.archetype-a-layout .pos-cart-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.archetype-a-layout .pos-checkout-footer {
  flex-shrink: 0;
}

/* Touch target minimum */
.archetype-a-layout button,
.archetype-a-layout .product-card,
.archetype-a-layout .qty-btn {
  min-height: 48px;
  min-width: 48px;
}
```

### data.js Fields Required

- `shifts[]` → `{ id, cashier_id, start_time, end_time, status ('open'|'closed'), system_cash_total, counted_cash, variance, variance_reason }`
- `pos_transactions[]` → `{ id, shift_id, receipt_number, datetime, customer_id, line_items[], subtotal, discount, vat, total, payment_method, cash_received, change_given, status ('complete'|'voided') }`
- `products[]` → `{ id, sku, name, image_url, category_id, selling_price, stock_qty }` — **NO `cost_price` field**
- `categories[]` → `{ id, name, icon }`
- `cashiers[]` → `{ id, name, allowed_discount_pct, current_shift_id }`
- `customers[]` → `{ id, name_kh, phone, credit_limit, credit_used }` — credit customers only (no cost data)

### KHQR Modal (v1 → v2)

- **Keep:** existing KHQR generation logic, payment detection/polling, QR image rendering
- **Redesign:** update modal UI to match new dark `#0f172a` color scheme
- **Add:** countdown timer with visual progress bar (5-minute default, configurable)
- **Add:** auto-close on payment detection (no manual dismiss needed)
- **Change:** from a centered popup to a full bottom-sheet on screens < 768px

```javascript
// KHQR modal redesign notes
// v1: generic modal component
// v2: dedicated KHQRModal class with:
//   - countdown timer logic
//   - payment status polling (every 3 seconds)
//   - auto-resolve on payment detected
//   - timeout auto-dismiss
class KHQRModal {
  constructor(amount, onSuccess, onTimeout) { /* ... */ }
  open() { /* render QR, start countdown, start polling */ }
  startPolling() { /* poll every 3s, call onSuccess if paid */ }
  startCountdown(seconds) { /* update timer display, call onTimeout on 0 */ }
  close() { /* cleanup, remove overlay */ }
}
```

### Shift Data Isolation — Implementation

All API calls / data.js filters for the cashier role **MUST** pass `shift_id` as a mandatory parameter:

```javascript
// CORRECT — shift-scoped query
const receipts = data.pos_transactions.filter(t =>
  t.shift_id === currentUser.current_shift_id
);

// WRONG — never do this for cashier role
const receipts = data.pos_transactions.filter(t =>
  t.cashier_id === currentUser.id // this could leak other shifts' data!
);
```

Add a global guard in `posPortal` init that verifies `currentShift.status === 'open'` before rendering POS terminal. If shift is closed or null, redirect to shift-start page or show lock overlay.

### Barcode Scanner Integration

- The barcode search input must have `id="barcode-input"` and `autofocus` attribute
- A barcode scanner (USB HID mode) types the barcode string + Enter key press
- Intercept the Enter keydown event on this input: look up product by barcode field in data
- If found: add to cart programmatically (same as tapping the product card)
- If not found: show toast `Barcode មិនស្គាល់: [barcode_string]`
- Re-focus the input after every cart add (so cashier can immediately scan the next item)

```javascript
document.getElementById('barcode-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const barcode = e.target.value.trim();
    const product = findProductByBarcode(barcode);
    if (product) {
      addToCart(product, 1);
      e.target.value = ''; // clear input
    } else {
      showToast(`Barcode មិនស្គាល់: ${barcode}`, 'error');
    }
    e.target.focus(); // always re-focus
  }
});
```

### Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `≥ 1200px` | Product grid: 4 columns; standard split layout |
| `768px – 1199px` | Product grid: 3 columns; split layout maintained |
| `< 768px` | Stack layout: left panel on top (product grid), right panel below (cart); bottom tab bar replaces sidebar |

### Receipt Printer Integration

- Use `window.print()` as primary mechanism
- Add `@media print` CSS that renders only the A4 receipt card and hides all UI
- Future: ESC/POS thermal printer integration via browser serial API (note in code as `TODO: ESC/POS`)

---

*End of Cashier / POS v2 UI/UX Design Plan*
