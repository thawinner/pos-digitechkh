# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A **static HTML/CSS/JS prototype of the DIGITECHKH POS**, in Khmer, with a PIN login and two roles: **cashier** and
**manager / shift supervisor**. It was split out of the eBMS repo (`ebms_digitechkh`, role 05) and covers only the POS.
There is no build system, no tests and no backend: all state lives in the browser's `localStorage`.

```bash
python3 -m http.server 8000 --directory src   # then open localhost:8000 (login page)
```

Demo PINs: ចន្ទ មករា 1111 · សុខ ដារ៉ា 2222 · លី សុភា 3333 (cashiers) · សុខ វណ្ណា 2468 · ម៉ៅ ស្រីនាង 1357 (managers).
They are listed on the login page under «ព័ត៌មានសម្រាប់គំរូសាកល្បង», next to the reset-demo-data button.

Verification is visual: open the page in a browser, or drive headless Chrome over the DevTools protocol. Serve over
HTTP; `file://` storage is unreliable.

## Layout

```
src/
├── index.html                      login: pick a person, enter PIN (session in localStorage `pos_session`)
├── cashier/terminal/pos-terminal   sell, hold, discount override, Riel change, in-terminal KHQR, safe drop, lock
├── cashier/receipts/receipts       shift receipts, void / return requests (manager PIN on the spot or queued)
├── cashier/shift/{open,close}-shift  float count + manager PIN · blind close with one recount + Z-report
├── manager/{dashboard,approvals,shifts,roster,cash,exceptions,reports,settings}/…  (view-request, view-shift, create-movement)
└── shared/{scripts,styles,assets}  assets/avatars/<personId>.svg = profile images
```

- **Every page is exactly two levels below `src/`** and carries `data-role-root="../.."` (path to `src/`). A page at
  another depth breaks nav, logo, avatar and product-image paths.
- Nav hrefs in `PORTAL_CONFIGS` (`portal.js`) are relative to `src/`. Links in a page's own markup are relative to the page.
- `data.js` guards pages at load: `cashier/*` needs a session, `manager/*` needs a manager session; otherwise it
  redirects to `index.html?next=…`. Logout clears the session.

## How a page is assembled

- Cashier: `<body id="posPortal" …>`; manager: `<body id="managerPortal" …>` (indigo sidebar, `badgeFn` nav badges).
  `data-active` picks the highlighted nav item. Change nav in `PORTAL_CONFIGS`, never in pages.
- Script order: `ui-components.js` → `data.js` → (`manager-data.js`, manager pages only) → `portal.js` → inline script.
- Manager pages are generated from a shared shell (head, sidebar host, header host, script tags); keep that shell
  identical when adding one. View/create pages are full pages with `data-back`, never modals.
- Shared dialogs in `ui-components.js`: `showManagerOverride` (manager PIN on the cashier's screen), `showPinConfirm`,
  `showReasonPicker`, `showOptionDialog`, plus the inherited `showToast` / `showCustomConfirm` / `showReasonPrompt`.

## Data

- **`data.js` (both roles)** holds only what a till needs: catalogue, people + PINs, settings (`posSettings()`), the
  shift model, live records, `summarizeShift()` (per-currency expected cash), `receiptHtml()`, `zReportHtml()`,
  `logPosEvent()`. It must never hold other shifts' history — that keeps the cashier's shift lock real.
- **`manager-data.js` (manager pages only)** generates 14 days of deterministic history from the roster, merges it with
  live data (`mgrAllShifts/Sales/Movements/Approvals/Events`), stores manager decisions on generated records as
  overlays (`pos_overlay`), and computes exceptions, sales aggregates and the safe balance.
- localStorage keys (all `pos_*`): `session`, `settings`, `roster`, `shifts`, `shift_sales`, `held_sales`, `approvals`,
  `cash_movements`, `events`, `terminal_lock`, `pins`, `overlay`, seeds. sessionStorage: `pos_cart`, `pos_pending_khqr`.
  A `storage` event re-renders other tabs (`window.onStoreChanged`).
- **Shift model** (see `docs/spec/02-manager-pos.md` §11): shift template (time window) → staff default shift →
  roster per date (covers marked `cover`; default templates morning / afternoon / night, the night one overnight) → drawer shift (one cashier, one register, one drawer: open → closed →
  reviewed). A login resolves its register from the roster (`MY_REGISTER`).
- Money: `saleTotals` (VAT-inclusive prices), `splitChange` ($ + ៛ rounded to 100), every sale stores `fxRate`,
  `cashierId`, `register`, `shiftId`, `change`. No cost price anywhere, for either role.

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

## `custom.css` traps

- It overrides Tailwind's type scale with `!important` (`.text-xs` = 14.5px, `.text-sm` = 15.5px, `.text-base` = 16.5px).
  Check it before debugging any font size. Restore hierarchy with ID-scoped rules (`#posPortal ...`).
- `hidden sm:inline` never shows; round elements are forced to 13.5px.
- It hides scrollbars globally and holds the `< 1024px` off-canvas drawer rules.
- On phones, `div:has(> a[href*="create-"])` is forced to `display: flex`, so a hidden ⋮ menu containing a link to a
  `create-*.html` page shows permanently. Use a `<button onclick="location.href=…">` inside menus instead.

## Docs

`docs/` holds the POS spec and the cross-cutting rules that apply to it — see [docs/README.md](docs/README.md).
The spec is the source of truth for what a page should contain; the manager role is specified in `docs/spec/02-manager-pos.md`, and the cashier backlog is in `docs/planning/cashier-improvements.md`.
