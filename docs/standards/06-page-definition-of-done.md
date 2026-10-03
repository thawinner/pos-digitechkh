# STANDARD-06: Page Definition of Done
**Version:** 2.0 | **Date:** 2026-09-29 | **Status:** Planning — No Code

---

## Purpose

A page is not "done" when it looks right in one browser window. It is done when every box below is ticked. Every bug found in the 2026-09-29 code review would have been caught by this list — that is the reason it exists.

Use it: (1) when building a page, (2) when reviewing someone else's page, (3) at the end of each migration step in eBMS `20-shared-mock-data-architecture.md`.

---

## A. Structure (every page)

- [ ] `<body>` has the portal ID, `data-role-root` and `data-active`.
- [ ] Script order: `ui-components.js` → `seed.js` → `status-meta.js` → `store.js` → role `data.js` → `portal.js` → inline script.
- [ ] Header is `h-[72px] px-6 flex-shrink-0` and lines up with the sidebar brand block.
- [ ] Sub-pages use the byte-identical icon-only back button (GEMINI.md §5).
- [ ] `<main>` content is `w-full`. **No `max-w-* mx-auto` on forms or lists.** Only exception: the A4 paper preview on a `view-*` document page, which must also carry `print:max-w-full`.
- [ ] File is in its feature subfolder and named `[feature].html` / `create-` / `edit-` / `view-` (not loose in the role root, except Archetype A touch screens listed in eBMS `22-implementation-roadmap.md` §3).

## B. Forbidden patterns

- [ ] No `<select>` — use the floating dropdown from `ui-components.js`.
- [ ] No `alert()`, `confirm()`, `prompt()` — including fallbacks like `window.confirm` when a helper is missing.
- [ ] No native `title=""` tooltips.
- [ ] No modal for create / edit / view — full pages only.
- [ ] Table rows use one `⋮` menu, not inline buttons.
- [ ] No ECharts on a dashboard page (Reports pages only).

## C. Language

- [ ] Every visible string uses the terms in `05-khmer-glossary.md`; none of the "replace these variants" appear.
- [ ] No English abbreviations or English in parentheses (`(PO)`, `(COD)`, `VAT`) — brand names and document codes excepted.
- [ ] Arabic numerals only; money as `$1,250.00` / `5,125,000 ៛`; dates `DD/MM/YYYY`.
- [ ] Toasts and confirm dialogs are Khmer too.

## D. Data

- [ ] No number, name or date is typed into the HTML — everything comes from the role's projection functions.
- [ ] The page never reads the store directly and never sets `status` itself — it calls a `store.js` action.
- [ ] Only whitelisted fields for this role are rendered (`03-data-dictionary-and-permissions.md`). For Warehouse roles, search the rendered page for `$` — there must be none.
- [ ] Status badges come from `STATUS_META`, not hand-written classes.
- [ ] Dates and "overdue" logic use `BMS_TODAY`, never a literal date.
- [ ] A state change creates the notifications in eBMS `16-authority-and-notification-matrix.md` and an audit entry.

## E. States

- [ ] Empty list → empty-state block (`04-open-decisions-and-system-config.md` Part D).
- [ ] Filter/search with no match → "no results" block with a working «ជម្រះតម្រង».
- [ ] Buttons for transitions the current role may not perform are hidden (not just disabled) — per eBMS `15-approval-state-machine.md` UI tables.
- [ ] Reject requires a reason; void requires `showCustomConfirm()`.

## F. Output and devices

- [ ] Official documents print on A4 with sidebar, header and buttons hidden; rows and signature block don't split across pages; 4-signature block present on financial documents.
- [ ] Page works at 1280px, 768px and 375px without horizontal scrolling (priority roles in `18-…` Q6 must be fully usable at 375/768).
- [ ] Browser console shows no errors on load and after the main action.
- [ ] After «កំណត់ទិន្នន័យគំរូឡើងវិញ» the page still renders correctly.

## G. Cross-role check (pages that change status)

- [ ] Open the receiving role in a second tab; the change appears there (badge/list) without a manual refresh.

---

## Backlog: open findings from the 2026-09-29 code review

Line numbers are as of that review and may have moved.

| # | Where | Problem | Checklist item |
|---|---|---|---|
| 1 | `shared/scripts/portal.js` `handleLogout()` ~l.306 | Falls back to `window.confirm()` | B — **FIXED 2026-09-30** |
| 2 | `shared/scripts/portal.js` `selectPreset()` ~l.574–585 | Date presets fixed to 2026-09-03 | D (`BMS_TODAY`) — **FIXED 2026-09-30** (pages without `store.js` keep their own `BMS_TODAY` until migrated) |
| 3 | `shared/scripts/portal.js` `navigateSeamlessly()` ~l.745 | `new Function()` hides page functions from `window`; currently disabled — do not re-enable as is | A — **FIXED 2026-09-30** (dead SPA-navigation code deleted) |
| 4 | `10-apar-accountant/vouchers/view-voucher.html`, `receipts/view-receipt.html` | Wrong script order | A |
| 5 | AP/AR `create-voucher`, `create-receipt`; Procurement `create-po`, `create-supplier`, `purchase-orders`; Chief Accountant `approvals`; Supplier `create-bill` | 16 native `<select>` | B |
| 6 | Procurement `create-po`, `create-supplier`; AP/AR `create-voucher`; Supplier `create-bill` | `max-w-* mx-auto` on forms | A |
| 7 | `00-auth/login.html` `handleLoginSubmit()` ~l.647 | `includes('ar')` / `includes('ap')` routes almost any username to AP/AR | D |
| 8 | `00-auth/login.html` | Password field pre-filled with bullet characters; `selectDemoRole()` is dead code | — |
| 9 | Supplier Portal sidebar, `create-bill`; Customer Portal data; Procurement `purchase-orders`, `view-po`; Warehouse Manager `dashboard`, `movements`, `stock-alerts/alerts` | English in UI: `(PO)`, `(COD)`, `(Matched)`, `(Batch PR)`, «PM», «Procurement Manager» in toasts | C |
| 9b | Supplier Portal `purchase-orders.html` ~l.222 | Inline row button with native `title=""` tooltip | B |
| 10 | `documentation/v2/04-sales-executive.md` | Specifies a 960px centred dashboard — contradicts the full-width rule; update the doc to `w-full` | A — **FIXED 2026-09-30** |
| 11 | `documentation/v2/10-apar-accountant.md` | Portal ID written as `apPortal`; code uses `aparPortal` — fix the doc | — **FIXED 2026-09-30** |
