# POS Documentation — Index

Copied from `ebms_digitechkh/documentation/` on 2026-10-03. Only documents relevant to the cashier / POS are kept.
Links inside them still point at the eBMS repo layout.

## Spec — start here
- [spec/05-cashier-pos.md](spec/05-cashier-pos.md) — v2 UI/UX plan: role identity, data rules, sidebar, every page section by section, developer notes (barcode scanner, KHQR, shift isolation)
- [spec/v1-role_cashier_pos.md](spec/v1-role_cashier_pos.md) — original v1 deep study of the role (offline PWA, 80mm printing). Also the main source for the **manager / supervisor** role: permission table, Manager Void Workflow

## Standards — rules the POS must follow
- [standards/00-MASTER-OVERVIEW.md](standards/00-MASTER-OVERVIEW.md) — UI archetypes (the POS is Archetype A), global standards
- [standards/13-cross-role-workflows.md](standards/13-cross-role-workflows.md) — where POS sales hand off to stock and accounting
- [standards/14-data-dictionary-and-permissions.md](standards/14-data-dictionary-and-permissions.md) — what the cashier may see and change, Zero Data Leakage
- [standards/18-open-decisions-and-system-config.md](standards/18-open-decisions-and-system-config.md) — multi-currency, VAT/WHT, empty states
- [standards/19-khmer-glossary.md](standards/19-khmer-glossary.md) — the Khmer term to use for each concept
- [standards/21-page-definition-of-done.md](standards/21-page-definition-of-done.md) — checklist a page must pass

## Planning
- [planning/pos-enhancements.md](planning/pos-enhancements.md) — proposed POS improvements (hold orders, search refinement, receipts)
