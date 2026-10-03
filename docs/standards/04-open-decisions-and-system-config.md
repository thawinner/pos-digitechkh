# PLANNING-18: Open Decisions & System Configuration
**Version:** 2.0 | **Date:** 2026-09-29 | **Status:** Planning — No Code

---

## Purpose

Resolves all open product-owner questions from `00-v2-planning-enhancement.md §4`, plus specifies multi-currency handling, PWA/offline requirements, empty/error state standards, and the date picker dynamic computation rule.

---

## Part A: Answers to the 6 Open Product-Owner Questions

From `00-v2-planning-enhancement.md §4`:

### Q1: Does the cashier portal need offline mode?

**Decision: YES — but scoped to POS only, Phase 3**

**Reasoning:** The system documentation spec (`documentation/v1/`) explicitly states "PWA offline POS — cashier/POS terminal is expected to keep working offline 72+ hours." This is a confirmed business requirement.

**What this means for the prototype:**
- v2 prototype: No PWA/offline implementation. The cashier portal is online-only.
- The prototype demonstrates the UI and workflow, not offline resilience.
- A visual badge "កំពុងភ្ជាប់អ៊ីនធឺណិត" (online) can be added to the POS header as a placeholder.

**Phase 3 scope:**
- Register `frontend/roles/05-cashier-pos/` as a PWA (`manifest.json` + `service-worker.js`)
- Service worker caches: product list, customer list, last 100 invoices, receipt HTML template
- Sync queue: queued transactions push to server when back online
- Offline indicator replaces online badge with "ធ្វើការដោយគ្មានអ៊ីនធឺណិត"
- 80mm thermal printer: handled via `window.print()` with custom `@media print` CSS for 80mm paper width

---

### Q2: Is commission tracked per sales executive?

**Decision: YES — tracked but not enforced**

**Reasoning:** Sales executive compensation is commission-based in Cambodian SME sales operations. The SE dashboard should show their own pipeline value and monthly performance. Commission rate is set per-employee by GM.

**What this means for the prototype:**
- SE `data.js` includes `commissionRate: 0.03` (3% of closed deal value) per sales executive.
- SE dashboard shows "គោលដៅ" (target) and "ការអនុវត្ត" (actual performance) KPIs.
- Commission calculation: `closedDealsThisMonth.reduce(sum grandTotal) × commissionRate`.
- Commission amount is visible to SE (their own only) and SM (all SEs).
- GM sees aggregate commission liability as a financial summary.
- Commission is NOT tied to payment vouchers in the prototype — it is a display-only metric.

---

### Q3: Who owns the budget (GM or PM)?

**Decision: GM owns budget, PM operates within it**

**Reasoning:** Budget is a strategic financial control owned by the General Manager (or Director). The Procurement Manager operates tactically — they know the budget limit and must stay within it, but they cannot change it.

**What this means for the prototype:**
- GM Dashboard shows "Budget vs. Actual" spending card (quarterly view).
- PM Dashboard shows "Budget Remaining" KPI (read-only, derived from GM-set value in data.js).
- If a PR would exceed the remaining budget, PM sees a yellow warning badge — but can still submit (budget enforcement is advisory in prototype).
- `data.js` for GM portal includes: `{ quarterlyBudget: 150000, spentToDate: 87450 }`.
- `data.js` for PM portal includes: `{ budgetRemaining: 62550 }` (pre-computed mock, not live).

---

### Q4: Does the supplier portal need a registration/onboarding flow?

**Decision: NO registration flow — SA creates supplier accounts**

**Reasoning:** Supplier onboarding is a controlled process. New suppliers are vetted by the Procurement Manager and created by the Super Admin. A self-registration flow would require email verification, document upload, and approval — too complex for v2 prototype.

**What this means for the prototype:**
- PM creates supplier record in PM portal: `procurement-manager/suppliers/create-supplier.html`.
- SA assigns portal login credentials in SA user management.
- No self-registration page in the supplier portal.
- Login page: Supplier uses `Username: supplier01`, Password: pre-set (demo only).

---

### Q5: What is the exact VAT/WHT behavior on documents?

**Decision: Standardized rules below — implement exactly as specified**

**VAT Rules (Sales side):**
- Rate: 10% flat.
- Applied on: (subtotal − downPayment − specialDiscount).
- Formula: `vatAmount = (subtotal - downPayment - specialDiscount) × 0.10`.
- Display: Separate line in financial summary block.
- Documents: Quotation, Invoice, Credit Note.

**WHT Rules (Purchase side):**
- Rate: Goods = 10%; Services = 15%.
- Applied on: gross invoice amount.
- Deducted by: AP/AR Accountant at Payment Voucher creation.
- Formula: `whtAmount = grossAmount × whtRate`; `netAmount = grossAmount − whtAmount`.
- WHT Certificate: Must print alongside Payment Voucher when paidAt is set.
- Documents: Payment Voucher only.

**Mock simplification:** All procurement in the prototype is treated as "goods" (10% WHT rate). Service procurement WHT (15%) is noted in the PV form but not a separate flow.

---

### Q6: Should there be a mobile app or only web?

**Decision: Web-only for v2 prototype; mobile-responsive for key roles**

**Responsive priority by role:**
| Role | Mobile Priority | Reason |
|---|---|---|
| Cashier / POS | HIGH | POS terminal may be tablet |
| Warehouse Staff | HIGH | Tablet on warehouse floor |
| Driver (Phase 3) | HIGH | Smartphone only |
| Sales Executive | MEDIUM | Sales staff may use phone in field |
| All other roles | LOW | Desktop-first workflows |

**Implementation rule:** All portals must render correctly at 375px (mobile) and 768px (tablet). The Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) are already in use. No separate mobile-only pages.

---

## Part B: Multi-Currency Specification

### Base Currency
- **Primary:** USD (United States Dollar)
- **Secondary:** KHR (Cambodian Riel)
- **All financial records stored in:** USD
- **Display:** USD is primary; KHR is shown in parentheses as reference

### Exchange Rate
- Stored in: `GM data.js` and `CA data.js` as `exchangeRate: { USD_KHR: 4100, updatedAt: "2026-09-29", updatedBy: "ca_01" }`.
- Who can update: CA and GM only.
- Frequency: Monthly update recommended; daily in live system.
- Exchange rate in prototype: **Fixed at 4,100 KHR per USD** for all pages.

### Display Rules

| Situation | Display Format |
|---|---|
| Price label (invoice, quotation) | `$1,250.00 (~5,125,000 រៀល)` |
| Amount input field | USD input only; KHR shown as computed label below field |
| Receipt printed (for customer) | Show both: USD bold, KHR in small text below |
| KHQR payment QR | Amount encoded in KHR (KHR = grandTotal × exchangeRate) |
| Dashboard KPI cards | USD only (cleaner display) |
| Financial reports | USD primary with KHR totals in footer |

### Number Formatting

- USD: `$1,250.00` — always 2 decimal places, comma thousand separator.
- KHR: `5,125,000 ៛` — no decimal places, comma separator, Riel symbol after number.
- **Always Arabic numerals** — never Khmer numerals regardless of locale.
- Percentage: `10%` — no space before `%`.

---

## Part C: Date Picker Dynamic Computation Rule

### Problem (Identified in Code Review)
`frontend/shared/scripts/portal.js` `selectPreset()` function (lines 574–585) has all date ranges hardcoded to September 3, 2026 as "today." As of September 29, 2026, the relative date ranges are wrong by 26 days.

### Rule
The date picker must compute all relative ranges from the **actual current date** (`new Date()`) at the moment the picker opens. No hardcoded date offsets.

### Preset Definitions (Khmer Labels → Correct Computation)

| Khmer Label | Preset ID | Computed Range |
|---|---|---|
| ថ្ងៃនេះ | today | `start = end = today` |
| ម្សិលមិញ | yesterday | `start = end = today - 1 day` |
| 7 ថ្ងៃចុងក្រោយ | last7days | `start = today - 6 days, end = today` |
| 30 ថ្ងៃចុងក្រោយ | last30days | `start = today - 29 days, end = today` |
| ខែនេះ | thismonth | `start = first day of current month, end = today` |
| ខែមុន | lastmonth | `start = first day of last month, end = last day of last month` |
| ត្រីមាសនេះ | thisquarter | `start = first day of current quarter, end = today` |

**Implementation note:** When `portal.js` `selectPreset()` is rewritten, it computes all ranges from `BMS_TODAY` (the single shared "today" defined in `20-shared-mock-data-architecture.md` §3). Mock data is seeded relative to the same date, so filters like "last 7 days" always return records. No static date strings.

---

## Part D: Empty and Error State Standards

Every list page, dashboard widget, and report must handle the "no data" case. This is a UI standard, not an afterthought.

### Empty State Design Pattern

```html
<!-- When a table or list has no data, replace the tbody with: -->
<tbody>
  <tr>
    <td colspan="{n}" class="py-16 text-center">
      <div class="flex flex-col items-center gap-3 text-slate-400">
        <i class="fas fa-{relevant-icon} text-4xl"></i>
        <p class="text-sm font-medium">គ្មានទិន្នន័យ</p>
        <p class="text-xs">{context-specific reason, e.g. "មិនទាន់មានការបញ្ជាទិញ"}</p>
        <!-- Optional: action button if role can create -->
        <a href="create-{entity}.html" class="mt-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-medium">
          + បង្កើតថ្មី
        </a>
      </div>
    </td>
  </tr>
</tbody>
```

### Empty State Icon Guide

| Entity | Icon |
|---|---|
| Quotations / Invoices | `fa-file-invoice` |
| Purchase Orders | `fa-file-contract` |
| Stock / Products | `fa-boxes-stacked` |
| Customers / Suppliers | `fa-users` |
| Payments | `fa-money-bill-wave` |
| Notifications | `fa-bell` |
| Reports (no data period) | `fa-chart-bar` |
| Search results (no match) | `fa-magnifying-glass` |

### Error State (Network / Script Error — Mock)

Since the prototype has no real backend, a "loading error" state is not strictly needed. However, for completeness:

- If `data.js` fails to parse (syntax error): The page should not show a blank white screen. Add a try/catch around data initialization with a fallback empty array.
- If a required DOM element is missing (script timing issue): Log a `console.warn` (not `console.error`) — do not call `window.alert`.

### Filter: No Results

When a user applies a date range or search filter and gets no results, show:

```
រកមិនឃើញលទ្ធផលដែលត្រូវនឹងការស្វែងរករបស់អ្នក
សូមសាកល្បងប្ដូរតម្រង ឬពាក្យស្វែងរក
[ជម្រះតម្រង]
```

The "Clear filter" button must reset all filter inputs and re-render the full list.

---

## Part E: Build Priority — Revised Phases

### Phase 1 (Complete — v2.0)
Internal role portals: SM, SE, CAS, PM, WM, WS, CA, APAR, IA, CS, GM, SA  
External portals: Supplier Portal (complete), Customer Portal (partial — quotation pages missing)  
Shared: portal.js, ui-components.js, custom.css, portal.css

### Phase 2 (Next Sprint)
Priority order (superseded in detail by `22-implementation-roadmap.md`):
1. Fix all code-review bugs from 2026-09-29 review (native selects, script order, date presets, max-width violations) — checklist in `21-page-definition-of-done.md`
2. Shared mock data store (`20-shared-mock-data-architecture.md`) — replaces the 14 isolated `data.js` stores so cross-role workflows actually connect
3. Apply the Khmer glossary (`19-khmer-glossary.md`) across all pages
4. Complete Customer Portal quotation pages (`my-quotes.html`, `view-quote.html`)
5. Notification bell reading from the shared store in all portals
6. Empty state components on all list pages

### Phase 3 (Future)
1. Driver Portal
2. HR Staff Portal  
3. PWA/Offline for Cashier POS
4. KHQR live integration (Bakong API)
5. ECharts on all Reports pages (currently only some roles have charts)
6. Global command search (Ctrl+K)
7. Localization: KHR display on all financial documents
