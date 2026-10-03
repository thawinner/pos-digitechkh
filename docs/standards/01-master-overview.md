# DIGITECHKH eBMS v2 — Master UI/UX Design Overview

> **Document Version:** 2.0  
> **Last Updated:** 2026-09-25  
> **Status:** Active Planning Reference  
> **Audience:** Frontend Dev Team, UI Architect

---

## 1. V2 Design Philosophy

### The Three Core Rules

The v2 redesign was driven by three non-negotiable principles identified by the product owner. Every design decision in this system must be validated against all three rules before implementation.

---

**Rule 1 — No Cramped Sidebars**

Every role's sidebar is capped at **3–5 navigation items maximum**. In v1, sidebars grew unbounded as features were added, creating cognitive overload and poor mobile ergonomics. In v2, the sidebar represents *destinations*, not *features*. Sub-features, secondary views, and related functions live **inside pages as tab navigation**, not as separate sidebar entries. This means a developer should never add a sidebar item just because a new page was created — instead, ask: *"Does this belong as a tab inside an existing page?"*

---

**Rule 2 — Unique UI Identity Per Role**

Every role has a distinct visual identity: its own color accent, layout density, and interaction archetype. No two roles should feel like the same interface with a different logo. This is deliberate — users of one role should instantly recognize they are in their own workspace. The four archetypes (see Section 2) define the structural families, but within each archetype, color and typographic weight differentiate individual roles.

---

**Rule 3 — ECharts and Data Tables Are Separated from Dashboards**

The dashboard page is **not a reporting tool**. In v1, dashboards became cluttered with charts, tables, and KPI grids that tried to do everything. In v2, dashboards are stripped to their action-core. Charts live exclusively on dedicated **Reports** pages. Heavy data tables live on dedicated **List** pages. The dashboard asks: *"What does this user need to act on RIGHT NOW?"*

---

### The Action-First Command Center Philosophy

Every role's `dashboard.html` follows a single mental model: **the user opens the dashboard and immediately knows what needs their attention today.**

This is achieved by the strict Action-First layout pattern:

1. **System/Status Banner** *(role-specific, top of page)* — A slim contextual bar showing health, alerts, or the user's own quota/pipeline state. No charts. Text and badge only.
2. **3–4 KPI Cards** — Critical numbers only. Each card shows one metric, its trend direction (up/down arrow with color), and optionally a "view more" link to the relevant list page. Cards are **not clickable as a whole** — only the link inside them is.
3. **Quick Action Buttons** — A horizontal strip of 2–4 primary action buttons. These are the most frequent tasks this role performs. They must be reachable within 1 click from the dashboard.
4. **Urgent Task Queue** — A compact list (max 10 items) of items requiring this user's action. Each item has exactly one inline action button (Approve, Review, Process, etc.). If empty, show a friendly empty state.
5. **Recent Activity Feed** *(optional)* — Last 5 system events relevant to this role. Plain text list, no table structure, no pagination.

**What is FORBIDDEN on dashboard pages:**
- ECharts or any chart library rendering
- Full data tables with pagination
- Date range pickers or filter bars
- Modals triggered from dashboard cards
- More than 4 KPI cards

---

## 2. The 4 UI Archetypes

### Archetype A — Touch & Floor Console

**Description:**  
Designed for physical-environment users who operate in warehouses, stockrooms, or POS counters. These users often work with barcode scanners, touch screens, and have zero tolerance for small text or tight spacing. The UI must be operable with one hand or a scanner gun. Every tap target is oversized. The interface reduces cognitive load to near zero — it shows only what the user needs for the current task, nothing else.

**Visual Identity:**
- **Layout style:** Full-screen single-panel. No multi-column layouts. Content fills the entire viewport.
- **Button size:** Minimum h-14 (56px) for all primary action buttons. Barcode scan trigger buttons are h-16 (64px) or larger.
- **Typography:** Large body text (text-base minimum), short labels, no abbreviations.
- **Color strategy:** High-contrast status colors. Large colored badges for stock alerts. Muted backgrounds with strong foreground contrast.
- **Sidebar:** Minimal. Collapsed by default on small screens. Tab navigation for sub-features.
- **Zero price UI rule:** Cashier/POS does not display wholesale cost prices — only selling prices visible to operator.

**Roles using Archetype A:**
- Cashier / POS Operator
- Warehouse Staff

---

### Archetype B — Action & Pipeline Engine

**Description:**  
Designed for sales-facing and procurement roles whose primary workflow is moving deals, orders, and requests through a status pipeline. These users live in Kanban-style views, quick-entry forms, and status-transition workflows. Speed of data entry is paramount. The UI should feel like a task-management tool combined with a CRM — energetic, fast, and progress-oriented.

**Visual Identity:**
- **Layout style:** Split panels, Kanban columns, or horizontal pipeline stages. Two-column layouts for detail views.
- **Button size:** Standard (h-10 / 40px). High-frequency actions use icon+label buttons. Less frequent actions collapse to ⋮ menus.
- **Typography:** Semi-bold status labels. Pipeline stage chips use color-coded backgrounds.
- **Color strategy:** Each pipeline stage has its own color band. Warm accent colors (amber, emerald, sky) signal urgency and completion.
- **Sidebar:** 4–5 items. Pipeline/board views are primary destinations.
- **Key interaction:** Drag-to-stage on Kanban (optional). Status badge tap/click triggers transition confirmation.

**Roles using Archetype B:**
- Sales Executive
- Sales Manager
- Procurement Manager

---

### Archetype C — Executive Command & Governance

**Description:**  
Designed for users with high authority and read-heavy workflows. These users approve, review, and govern — they rarely create raw data. The UI must project authority, clarity, and trust. Data is dense but well-organized. Approvals are the primary action. The interface must prevent accidental actions through clear confirmation flows. Read-only enforcement is strict — these users should never be able to accidentally edit operational data they only need to review.

**Visual Identity:**
- **Layout style:** Wide single-column for dashboards. Detail pages use structured card sections, not raw forms. Approval queues dominate the layout.
- **Button size:** Standard (h-10). Approval buttons are color-coded: green for Approve, red for Reject. Destructive actions are always in a visually separated Danger Zone.
- **Typography:** heavier font weights for authority cues. Data labels in font-medium text-slate-500. Values in font-semibold text-slate-800.
- **Color strategy:** Deep, desaturated tones — indigo, slate, stone. No bright accent colors except for alert badges and approval actions.
- **Sidebar:** 3–4 items. Audit trail always present as a sidebar item.
- **Key interaction:** Approval triage is the hero workflow. Read-only detail views must be clearly distinguishable from editable forms.

**Roles using Archetype C:**
- Super Admin
- Admin / General Manager
- Internal Auditor

---

### Archetype D — Financial Ledger & Reconciliation

**Description:**  
Designed for accounting roles whose world is numbers, journals, aging tables, and reconciliation workflows. These users need maximum data density without sacrificing readability. Every number must be right-aligned, formatted with thousands separators, and linked to its source document. The UI is structured like a professional accounting workstation — systematic, precise, and audit-ready.

**Visual Identity:**
- **Layout style:** Full-width ledger tables are primary. Split-panel for journal entry vs. ledger preview. Aging tables use sticky headers and column totals.
- **Button size:** Standard (h-10). Post/Reverse/Reconcile are the key actions — always clearly labeled, never icon-only.
- **Typography:** Monospace or tabular-nums class for all financial figures. Labels font-medium text-slate-600. Posted status uses a bold green chip; Draft uses amber.
- **Color strategy:** Neutral white/slate background. Financial status badges use standard accounting colors: green = posted/paid, amber = pending/draft, red = overdue/rejected.
- **Sidebar:** 4–5 items. Chart of Accounts and Journals are always primary destinations.
- **Key interaction:** Journal posting workflow. Ledger drill-down from any posted amount. Aging table filter by due date bucket.

**Roles using Archetype D:**
- Chief Accountant
- AP/AR Accountant

---

## 3. Global Design Standards

These standards apply to **every role, every page, every component** in the v2 system. They are non-negotiable and must be enforced during code review.

---

### 3.1 Sidebar

- **Maximum items:** 5 per role. Hard cap. If a feature doesn't fit, it becomes a tab inside an existing page.
- **Sub-features:** Never create a sidebar item for a sub-feature. Use **tab navigation inside the destination page** instead.
- **Active state:** Left border accent (4px, role's color) + background highlight on the active item.
- **Sidebar brand header:** Must be exactly `h-[72px]` tall, matching the content area header height, ensuring perfect horizontal alignment across the layout.
- **Badge/Alert indicator:** Sidebar items with pending action counts show a small numeric badge (max display: 99+). Badge uses role's accent color.
- **Sidebar width:** Fixed at `w-64` (256px). No collapsible sidebar in v2 — the clean layout makes it unnecessary.

---

### 3.2 Dashboard Pages

- **Pattern:** Action-First Command Center (see Section 1 for full spec).
- **KPI Cards:** Maximum 4 cards per dashboard. Each card: icon, label (Khmer), value (Arabic numeral), trend indicator.
- **Quick Actions:** 2–4 buttons in a horizontal strip. Primary action uses role's accent color. Secondary actions use slate/neutral.
- **Urgent Task Queue:** Compact list. One action button per item. Max 10 items visible (no pagination on dashboard — link to full list page instead).
- **ECharts:** Absolutely forbidden on dashboard pages. If a chart is needed, it belongs on the Reports page.
- **Date range filter:** Not present on dashboard. Dashboard always shows "as of now" / "today" data.
- **Modals:** Not triggered from dashboard. Quick actions navigate to full pages.

---

### 3.3 Reports Pages

- **Purpose:** Every role that needs charts gets exactly one Reports page (or a Reports page with sub-tabs).
- **Required elements:**
  - Date range filter at the top (start date / end date inputs using custom date picker, not native browser input).
  - Download button (CSV/PDF export) in the top-right area.
  - ECharts charts (bar, line, pie as appropriate — see role-specific docs for chart types).
  - Summary table below charts showing the underlying data.
- **No editing** on Reports pages — read-only display only.
- **Filters:** Custom dropdown components only — no native `<select>` elements.

---

### 3.4 List Pages

- **Purpose:** Dedicated pages showing paginated tables of a specific data type (invoices, orders, companies, users, etc.).
- **Search bar:** Present on every list page. Searches across the most relevant fields.
- **Filter tabs:** Status-based tab strip (e.g., All / Active / Pending / Archived) above the table. NOT a sidebar filter panel.
- **Table structure:**
  - All action buttons for a row are hidden inside a **⋮ (ellipsis) dropdown menu** on the right of each row.
  - No inline Edit/Delete/View buttons visible by default.
  - Table headers are sortable where relevant (click to toggle ASC/DESC).
  - Checkbox column for bulk selection (where bulk actions are supported).
- **Floating action button:** For the primary create action — positioned in the top-right of the content header bar, not floating over the table.
- **Pagination:** Custom component. Shows: "Showing X–Y of Z results" + Previous/Next + page jump.

---

### 3.5 Create / Edit / View Pages

- **Always full pages:** Never use modal dialogs for Create, Edit, or View flows. Every form and detail view is a dedicated `filename.html` page.
- **Back button:** Standard component — `w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/70` — contains only an `arrow-left` icon. No text label on the back button itself.
- **Page title:** Displayed in the content header bar next to the back button. Font-semibold, text-xl.
- **Form sections:** Grouped into labeled card sections (e.g., "ព័ត៌មានក្រុមហ៊ុន", "ព័ត៌មានទំនាក់ទំនង"). Each section is a white rounded card with a section title.
- **Save button:** Always at the bottom of the form OR sticky in the header bar. Label in Khmer (role-specific). Uses role's primary accent color.
- **Danger Zone:** If destructive actions (delete, suspend, deactivate) exist on an edit page, they are placed in a visually isolated red-bordered card at the very bottom, labeled "តំបន់គ្រោះថ្នាក់".
- **View pages:** Read-only. All fields are displayed as text, not inputs. Edit button in the page header opens the Edit page. Use tab navigation for complex entities with multiple data categories.

---

### 3.6 Layout & Spacing

- **Full width:** All content areas use `w-full`. Never use `max-w-*` with `mx-auto` centering on any layout container. Content fills its container.
- **Content header height:** `h-[72px] px-6 flex-shrink-0` — applied to both the sidebar brand header and the content area top header. This ensures visual horizontal alignment.
- **Grid system:** Use Tailwind CSS grid or flex. Section cards use `p-6` internal padding. Gap between cards: `gap-6`.
- **Scrollbars:** Hidden globally via CSS (`scrollbar-width: none` for Firefox, `::-webkit-scrollbar { display: none }` for WebKit). Content still scrolls — the scrollbar is just invisible.

---

### 3.7 Typography

- **Font family:** Kantumruy Pro (loaded via Google Fonts). Applied globally.
- **Headings (h1–h3):** `font-semibold`
- **Table data cells:** `font-medium text-slate-700`
- **Labels / helper text:** `font-normal text-slate-500`
- **Financial figures:** `tabular-nums` class applied. Always right-aligned.
- **Status badges:** `font-medium text-xs` inside a colored `rounded-full px-2.5 py-0.5` pill.

---

### 3.8 Language & Numerals

- **All UI text:** 100% Khmer language. This includes: button labels, form field labels, placeholder text, empty states, error messages, status badge text, page titles, section headings, tab labels, and navigation items.
- **Numbers:** Always English/Arabic numerals (0–9). Khmer numerals are never used, even though the UI language is Khmer.
- **Dates:** Format as `DD/MM/YYYY`. Month names, if displayed, use Khmer month names.
- **Currency:** KHR displayed as `XXXXX ៛` or USD as `$XXX.XX`. Thousands separator: comma (`,`). Decimal: period (`.`).

---

### 3.9 Forbidden Patterns

The following patterns are explicitly banned in v2 and must be flagged in code review:

| Forbidden Pattern | Reason | v2 Alternative |
|---|---|---|
| Native `<select>` elements | Inconsistent cross-browser styling, cannot match design | Custom dropdown component |
| `alert()` / `confirm()` / `prompt()` | Browser native dialogs are unstyled and unpredictable | Custom toast notifications + confirmation modal component |
| Inline Edit/Delete/View buttons in table rows | Clutters the table, poor mobile experience | ⋮ action menu per row |
| ECharts on dashboard pages | Dashboard must be action-first, not analytics | Move charts to Reports page |
| `max-w-*` centering on layout containers | Creates narrow, wasted space in wide viewports | `w-full` always |
| Modal dialogs for Create/Edit/View flows | Modal forms lose browser back button, hard to validate | Full dedicated pages |
| More than 5 sidebar items | Navigation overload | Consolidate into tabs |
| Native browser date input for date range pickers | Inconsistent UI, cannot be styled to match design system | Custom date picker component |

---

## 4. Role Hierarchy Map

All 12 roles in the eBMS v2 system, with their archetype assignment, planned sidebar item count, primary color, and portal identifier:

| # | Role | Archetype | Sidebar Items | Primary Color | Portal ID |
|---|---|---|---|---|---|
| 01 | Super Admin | C — Executive Command & Governance | 4 | Indigo `#4338CA` | `saPortal` |
| 02 | Admin / General Manager | C — Executive Command & Governance | 4 | Navy `#0f2b5c` | `gmPortal` |
| 03 | Sales Manager | B — Action & Pipeline Engine | 4 | Royal Blue `#1d4ed8` | `smPortal` |
| 04 | Sales Executive | B — Action & Pipeline Engine | 3 | Navy `#1e3a5f` | `sePortal` |
| 05 | Cashier / POS | A — Touch & Floor Console | 3 | Teal-Cyan `#0891b2` | `posPortal` |
| 06 | Procurement Manager | B — Action & Pipeline Engine | 4 | Amber `#d97706` | `pmPortal` |
| 07 | Warehouse Manager | B+C — Hybrid Operations & Oversight | 4 | Slate `#475569` | `wmPortal` |
| 08 | Warehouse Staff | A — Touch & Floor Console | 3 | Stone `#78716c` | `wsPortal` |
| 09 | Chief Accountant | D — Financial Ledger & Reconciliation | 4 | Violet `#7c3aed` | `caPortal` |
| 10 | AP/AR Accountant | D — Financial Ledger & Reconciliation | 5 | Teal `#0d9488` | `apPortal` |
| 11 | Internal Auditor | C — Executive Command (Forensic R/O) | 4 | Rose Red `#dc2626` | `iaPortal` |
| 12 | Customer Support | B Variant — Support & Orders Lookup | 3 | Sky Blue `#0ea5e9` | `csPortal` |

> **Note:** Portal IDs map to the `PORTAL_CONFIGS` object in `portal.js`. Each portal ID controls sidebar navigation, role color accents, permissions, and data schemas for that session.

---

## 5. Page Naming Convention

A strict naming convention is enforced across all role folders. Deviating from this convention breaks the portal routing logic and internal linking.

| Pattern | Purpose | Example |
|---|---|---|
| `[feature].html` | List view — paginated table of records | `invoices.html`, `companies.html` |
| `create-[feature].html` | Create form — full page blank form | `create-invoice.html`, `create-company.html` |
| `edit-[feature].html` | Edit form — full page pre-filled form | `edit-invoice.html`, `edit-company.html` |
| `view-[feature].html` | Detail view — read-only full page display | `view-invoice.html`, `view-company.html` |
| `dashboard.html` | Role dashboard — always this exact filename | `dashboard.html` |
| `reports.html` | Reports & analytics page — ECharts live here | `reports.html` |
| `audit-logs.html` | Audit trail page (for roles that have it) | `audit-logs.html` |

**Feature naming examples (use the singular noun form for the feature segment):**

- `company` → `companies.html`, `create-company.html`, `view-company.html`
- `invoice` → `invoices.html`, `create-invoice.html`, `edit-invoice.html`, `view-invoice.html`
- `subscription` → `subscriptions.html`, `create-subscription.html`
- `purchase-order` → `purchase-orders.html`, `create-purchase-order.html`

**Sub-folder rule:** When a feature group has 3 or more related pages, they must be placed in a sub-folder named after the feature group.  
Example: `companies/companies.html`, `companies/create-company.html`, `companies/view-company.html`

---

## 6. Folder Structure for v2

All role UIs live under `frontend/roles/`. Each role has its own numbered folder. Sub-features with multiple pages get their own sub-folder.

```
frontend/
└── roles/
    ├── 01-super-admin/
    │   ├── dashboard.html
    │   ├── companies/
    │   │   ├── companies.html
    │   │   ├── create-company.html
    │   │   ├── edit-company.html
    │   │   └── view-company.html
    │   ├── subscriptions/
    │   │   └── subscriptions.html
    │   └── audit-logs/
    │       └── audit-logs.html
    │
    ├── 02-admin-general-manager/
    │   ├── dashboard.html
    │   ├── approvals/
    │   │   ├── approvals.html
    │   │   └── view-approval.html
    │   ├── users/
    │   │   ├── users.html
    │   │   ├── create-user.html
    │   │   └── edit-user.html
    │   └── settings/
    │       └── settings.html
    │
    ├── 03-sales-manager/
    │   ├── dashboard.html
    │   ├── approvals/
    │   │   ├── approvals.html
    │   │   └── view-approval.html
    │   ├── pipeline/
    │   │   └── pipeline.html
    │   └── reports/
    │       └── reports.html
    │
    ├── 04-sales-executive/
    │   ├── dashboard.html
    │   ├── customers/
    │   │   ├── customers.html
    │   │   ├── create-customer.html
    │   │   ├── edit-customer.html
    │   │   └── view-customer.html
    │   └── sales-documents/
    │       ├── sales-documents.html
    │       ├── create-quote.html
    │       ├── edit-quote.html
    │       ├── view-quote.html
    │       ├── create-invoice.html
    │       ├── edit-invoice.html
    │       └── view-invoice.html
    │
    ├── 05-cashier-pos/
    │   ├── pos.html
    │   ├── receipts/
    │   │   ├── receipts.html
    │   │   └── view-receipt.html
    │   └── close-shift/
    │       └── close-shift.html
    │
    ├── 06-procurement-manager/
    │   ├── dashboard.html
    │   ├── purchase-orders/
    │   │   ├── purchase-orders.html
    │   │   ├── create-po.html
    │   │   ├── edit-po.html
    │   │   └── view-po.html
    │   ├── vendors/
    │   │   ├── vendors.html
    │   │   ├── create-vendor.html
    │   │   ├── edit-vendor.html
    │   │   └── view-vendor.html
    │   └── reports/
    │       └── reports.html
    │
    ├── 07-warehouse-manager/
    │   ├── dashboard.html
    │   ├── balance/
    │   │   ├── balance.html
    │   │   ├── create-product.html
    │   │   ├── edit-product.html
    │   │   └── view-product.html
    │   ├── movements/
    │   │   ├── movements.html
    │   │   ├── create-transfer.html
    │   │   ├── view-transfer.html
    │   │   ├── create-adjustment.html
    │   │   ├── view-adjustment.html
    │   │   └── create-grn.html
    │   └── reports/
    │       └── reports.html
    │
    ├── 08-warehouse-staff/
    │   ├── pick-pack/
    │   │   └── pick-pack.html
    │   ├── receive/
    │   │   └── receive-stock.html
    │   └── count/
    │       └── stock-count.html
    │
    ├── 09-chief-accountant/
    │   ├── dashboard.html
    │   ├── ledger/
    │   │   ├── ledger.html
    │   │   ├── create-journal.html
    │   │   └── view-journal.html
    │   ├── tax/
    │   │   └── tax-reports.html
    │   └── reports/
    │       └── financial-reports.html
    │
    ├── 10-apar-accountant/
    │   ├── dashboard.html
    │   ├── ar/
    │   │   ├── ar.html
    │   │   ├── create-payment.html
    │   │   └── view-payment.html
    │   ├── ap/
    │   │   ├── ap.html
    │   │   ├── create-voucher.html
    │   │   └── view-voucher.html
    │   ├── bank-recon/
    │   │   └── bank-recon.html
    │   └── reports/
    │       └── reports.html
    │
    ├── 11-internal-auditor/
    │   ├── dashboard.html
    │   ├── audit-trail/
    │   │   ├── audit-trail.html
    │   │   └── view-audit-detail.html
    │   ├── internal-controls/
    │   │   └── internal-controls.html
    │   └── reports/
    │       └── reports.html
    │
    └── 12-customer-support/
        ├── dashboard.html
        ├── orders-lookup/
        │   └── orders-lookup.html
        ├── create-note.html
        └── delivery-status/
            └── delivery-status.html
```

---

## 7. Key Separation of Concerns

This table defines exactly what belongs on each role's dashboard versus their reports page, and explicitly calls out what was removed from dashboards compared to v1.

| # | Role | Dashboard Content (Action-First) | Reports Page Content (ECharts + Tables) | Removed from Dashboard vs v1 |
|---|---|---|---|---|
| 01 | Super Admin | System health banner, 4 KPI cards (tenants, expiring, suspended, errors), Quick Actions, Pending onboarding queue | Tenant Growth line chart, MRR bar chart, Plan distribution table (Subscriptions page) | Revenue charts, subscription analytics table |
| 02 | Admin / GM | Action Triage Banner, Pending Approvals strip (POs, discounts, adjustments), KPI row (4 metrics), Team Leaderboard cards, Period Lock status | Delegated to CA & SM dedicated reports pages | Sales charts, P&L summary, all ECharts |
| 03 | Sales Manager | Team Performance KPI strip (3 cards), Approvals waiting strip, Team Leaderboard, Credit Limit warning cards | 3 ECharts (Revenue Trend line, Team Target bar, Pipeline stage donut) | All charts, full orders table |
| 04 | Sales Executive | 2 Hero Action Buttons (72px New Quote / New Invoice), Quota progress strip, Urgent follow-ups list | — *(no reports page for SE — by design)* | Full sales tables, analytics charts, purchase cost prices |
| 05 | Cashier / POS | Full-screen Split POS Terminal (Order lines + Product catalog), Shift Status, Action buttons | — *(no reports page for cashier)* | Daily sales charts, complex tables |
| 06 | Procurement Manager | KPI strip (3 cards), Auto-Reorder suggestions, Recent PO feed, Vendor quick snapshot | ECharts Bar (Monthly Spend by Vendor), ECharts Donut (PO Pipeline Status), Vendor performance summary | Spend charts, supplier comparison tables |
| 07 | Warehouse Manager | 4 KPI cards (Total SKUs, Low Stock, Pending Approvals, Inbound Today), Low Stock Alerts, Pending Actions Queue | ECharts Bar (Turnover Rate), ECharts Line (Valuation Trend), Slow-moving & aging tables | Stock level charts, movement volume graphs |
| 08 | Warehouse Staff | Task-First Interface (Pick & Pack queue with giant checkboxes, Bin locations, Scan input) | — *(no reports page for warehouse staff)* | Zero financial data, zero charts |
| 09 | Chief Accountant | Full-width Trial Balance Status Banner, 3 KPI cards, Period Lock status card, Unposted Journal Entries queue | ECharts Line (Revenue Trend) on P&L tab, Financial Statements (P&L, Cash Flow, Balance Sheet) | All embedded charts on dashboard |
| 10 | AP/AR Accountant | AR & AP 5-Bucket Aging Cards side-by-side, Due Today strip, Quick Action buttons | ECharts Line (AR Aging Trend), ECharts Bar (Monthly AP by Vendor), Collection Efficiency | Aging tables on dashboard, payment charts |
| 11 | Internal Auditor | READ-ONLY banner, Red Flag alert cards (anomalies), Live Activity Feed, System Health KPIs | Grouped Bar (Financial Ratio vs Benchmark), YoY Trend Line, Forensic Revenue/Expense | All charts (read-only timeline on dashboard) |
| 12 | Customer Support | Hero Search Bar as #1 element, Live Ticket Queue with SLA Timers, Delayed Deliveries alert | — *(no reports page for CS — operational focus)* | Sales metrics, customer debt tables |

---

*End of Master Overview Document — eBMS v2*
