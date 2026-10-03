# DIGITECHKH POS

Static HTML/CSS/JS prototype of the DIGITECHKH point-of-sale system, entirely in Khmer. Two roles:

- **Cashier** — opens a shift with a counted float, sells (cash USD/KHR with Riel change, Bakong KHQR), holds sales,
  requests voids and returns, records safe drops, locks the till on breaks, and closes with a blind count.
- **Manager (shift supervisor)** — dashboard of registers, approvals queue, shift review and countersign, shift roster,
  cash movements and safe, exception report, sales report, settings. Can switch to the till and sell on their own
  register. Spec: [docs/spec/02-manager-pos.md](docs/spec/02-manager-pos.md).

Split out of the eBMS repo (`ebms_digitechkh/frontend/roles/05-cashier-pos/`, commit `54d8e94`, 2026-10-02).
No build step, no `package.json`, no backend. Pages use the Tailwind Play CDN and `custom.css`.

## Run

```bash
python3 -m http.server 8000 --directory src
```

Open <http://localhost:8000> to reach the login page. Demo PINs are under «ព័ត៌មានសម្រាប់គំរូសាកល្បង» on that page:

| Person | Role | PIN |
|---|---|---|
| ចន្ទ មករា | Cashier | 1111 |
| សុខ ដារ៉ា | Cashier | 2222 |
| លី សុភា | Cashier | 3333 |
| សុខ វណ្ណា | Shift manager | 2468 |
| ម៉ៅ ស្រីនាង | Shift manager | 1357 |

Serve over HTTP. All state lives in the browser's `localStorage`, which is unreliable under `file://`. The login page's
«កំណត់ទិន្នន័យគំរូឡើងវិញ» button wipes and regenerates it.

## Deploy

`src/` is the whole website (static files, no build). **Don't move `index.html` to the repo root.** Every page
reaches shared files through relative paths, so the host should publish `src/` as the site root instead:

| Host | Setup |
|---|---|
| GitHub Pages | `.github/workflows/deploy-pages.yml` publishes `src/` on every push to `main`. One-time: repo **Settings → Pages → Source: GitHub Actions**. Site: `https://thawinner.github.io/pos-digitechkh/` |
| Netlify | `netlify.toml` sets `publish = "src"`. Import the repo, no build command |
| Vercel | `vercel.json` sets `outputDirectory: "src"`. Framework preset: Other |
| Cloudflare Pages | Build command empty, output directory `src` |
| Any web server | Copy the contents of `src/` to the web root |

All paths are relative, so the site works at a domain root or under a subpath. `src/404.html` sends lost visitors
back to the login page. HTTPS is required in production (every host above provides it).

## What a real deployment still needs

This is a working prototype, not production software. Before real use:

- **Server and database.** Sales, shifts and approvals live in one browser's storage. A real store needs a backend so
  every till and the manager see the same data, and nothing is lost when a browser is cleared.
- **Real authentication.** PINs are checked in the browser and stored in the page source; they must be hashed and
  verified on the server.
- **Bakong KHQR integration.** The QR is a simulated payload, and the cashier confirms payment by hand. Production
  needs a merchant account, real KHQR generation and payment confirmation by MD5 from the Bakong API.
- **Hardware.** Receipts print through the browser's print dialog. Thermal printers (ESC/POS), cash drawer kick and
  barcode scanners need a print bridge or native wrapper. Scanners that type plus Enter already work.
- **Offline mode, backups and an accountant's review** of the receipt format against GDT rules.

## Structure

```
pos-digitechkh/
├── .ai/ui-rules.md              UI rules (subset of GEMINI.md)
├── GEMINI.md                    authoritative project standards (13 rules)
├── CLAUDE.md                    guidance for AI assistants working in this repo
├── docs/
│   ├── README.md                docs index
│   ├── spec/                    cashier spec, manager spec, original v1 role study
│   ├── planning/                cashier improvement backlog and earlier enhancement ideas
│   ├── research/                POS market and Cambodia research behind the plans
│   └── standards/               cross-cutting rules that apply to the POS
└── src/
    ├── index.html               login (pick a person, PIN pad)
    ├── cashier/
    │   ├── terminal/pos-terminal.html    sell: grid, cart, hold, discount, change, KHQR, drop, lock
    │   ├── receipts/receipts.html        current shift receipts, void / return requests
    │   ├── shift/open-shift.html         float count + manager approval
    │   └── shift/close-shift.html        blind count wizard + Z-report
    ├── manager/
    │   ├── dashboard/                    registers, approvals, exceptions, sales by hour
    │   ├── approvals/                    request queue + view-request
    │   ├── shifts/                       shift list + view-shift (review, countersign, reopen)
    │   ├── roster/                       default shifts, covers, weekly hours
    │   ├── cash/                         safe, drops, payouts + create-movement
    │   ├── exceptions/  reports/  settings/
    └── shared/
        ├── scripts/data.js            shared data: people, settings, shifts, sales, receipts, storage
        ├── scripts/manager-data.js    manager-only history, aggregates, overlays
        ├── scripts/ui-components.js   toasts, confirm dialog, dropdowns, date picker
        ├── scripts/portal.js          sidebar renderer, mobile drawer, ⋮ menus
        ├── styles/custom.css          global styles (overrides Tailwind's type scale)
        ├── styles/portal.css          ID-scoped type scale + print rules
        └── assets/                    favicon, logo, product images
```

Every page sits at `src/<role>/<feature>/<page>.html`, so every page reaches shared code the same way: `../../shared/...`.
