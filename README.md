# DIGITECHKH POS

Static HTML/CSS/JS prototype of the DIGITECHKH point-of-sale system, entirely in Khmer. Two roles:

- **Cashier** — sells, takes cash / KHQR payment, reprints receipts, closes the shift. Built.
- **Manager (supervisor)** — approves voids, refunds and discounts, countersigns the Z-report. Not built yet; see [src/manager/README.md](src/manager/README.md).

Split out of the eBMS repo (`ebms_digitechkh/frontend/roles/05-cashier-pos/`, commit `54d8e94`, 2026-10-02).
No build step, no `package.json`, no backend. Pages use the Tailwind Play CDN and `custom.css`.

## Run

```bash
python3 -m http.server 8000 --directory src
```

Open <http://localhost:8000>. It redirects to the cashier terminal.
Serve over HTTP. The cart, sales and shift state live in `sessionStorage` / `localStorage`, which is unreliable under `file://`.

## Structure

```
pos-digitechkh/
├── .ai/ui-rules.md              UI rules (subset of GEMINI.md)
├── GEMINI.md                    authoritative project standards (13 rules)
├── CLAUDE.md                    guidance for AI assistants working in this repo
├── docs/
│   ├── README.md                docs index
│   ├── spec/                    the POS spec (v2) and the original v1 role study
│   ├── standards/               cross-cutting rules that apply to the POS
│   └── planning/                proposed POS enhancements
└── src/
    ├── index.html               redirects to the cashier terminal
    ├── cashier/
    │   ├── terminal/pos-terminal.html    sell: product grid, cart, payment
    │   ├── terminal/khqr-payment.html    Bakong KHQR payment screen
    │   ├── receipts/receipts.html        current shift receipts
    │   └── shift/close-shift.html        end of shift wizard + Z-report
    ├── manager/                 manager pages (planned)
    └── shared/
        ├── scripts/data.js            mock data, money/date helpers, storage
        ├── scripts/ui-components.js   toasts, confirm dialog, dropdowns, date picker
        ├── scripts/portal.js          sidebar renderer, mobile drawer, ⋮ menus
        ├── styles/custom.css          global styles (overrides Tailwind's type scale)
        ├── styles/portal.css          ID-scoped type scale + print rules
        └── assets/                    favicon, logo, product images
```

Every page sits at `src/<role>/<feature>/<page>.html`, so every page reaches shared code the same way: `../../shared/...`.
