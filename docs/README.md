# POS Documentation — Index

The standards and the cashier spec were copied from `ebms_digitechkh/documentation/` on 2026-10-03 and renumbered for
this project. Some links inside them still point at the eBMS repo layout. References marked "eBMS" (e.g. eBMS
`16-authority-and-notification-matrix.md`) are eBMS documents that were not copied here.

## Spec — start here
- [spec/01-cashier-pos.md](spec/01-cashier-pos.md) — cashier UI/UX plan: role identity, data rules, sidebar, every page section by section, developer notes (barcode scanner, KHQR, shift isolation)
- [spec/02-manager-pos.md](spec/02-manager-pos.md) — manager / shift supervisor spec: authority matrix, on-the-spot override and approval queue, 7 pages, shared components, data and build order
- [spec/v1-role_cashier_pos.md](spec/v1-role_cashier_pos.md) — original v1 deep study of the cashier role (offline PWA, 80mm printing, dual-currency maths, anti-theft controls)

## Planning
- [planning/cashier-improvements.md](planning/cashier-improvements.md) — gap list for the built cashier pages, prioritised backlog (C1–C22) and open decisions (D1–D7)
- [planning/pos-enhancements.md](planning/pos-enhancements.md) — earlier POS improvement ideas (hold orders, search, receipts, open shift)

## Research
- [research/pos-market-research.md](research/pos-market-research.md) — how mature POS products handle both roles, plus Cambodia specifics (KHQR, exchange rate, Riel change, tax invoices, shifts per day), with sources

## Standards — rules the POS must follow
- [standards/01-master-overview.md](standards/01-master-overview.md) — UI archetypes (the POS is Archetype A), global standards
- [standards/02-cross-role-workflows.md](standards/02-cross-role-workflows.md) — where POS sales hand off to stock and accounting
- [standards/03-data-dictionary-and-permissions.md](standards/03-data-dictionary-and-permissions.md) — what each role may see and change, Zero Data Leakage
- [standards/04-open-decisions-and-system-config.md](standards/04-open-decisions-and-system-config.md) — multi-currency, VAT/WHT, empty states
- [standards/05-khmer-glossary.md](standards/05-khmer-glossary.md) — the Khmer term to use for each concept
- [standards/06-page-definition-of-done.md](standards/06-page-definition-of-done.md) — checklist a page must pass
