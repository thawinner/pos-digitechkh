# POS Manager (supervisor) — not built yet

The second POS role. The cashier cannot void, refund, change a price or give an unauthorised discount;
the manager approves those and signs off the shift. Pages go here as `manager/<feature>/<page>.html`,
at the same depth as the cashier pages, with `data-role-root="../.."`.

Duties already described in the docs:

| Duty | Source |
|---|---|
| Approve a void / refund with a PIN or card scan | `docs/spec/v1-role_cashier_pos.md` — workflow 4 (Manager Void Workflow), permission table |
| Approve a line discount or price override | `docs/spec/v1-role_cashier_pos.md` — forbidden actions list |
| Review "Request Void" requests from receipts | `docs/planning/pos-enhancements.md` |
| Countersign the Z-report (Cashier / Supervisor signature block) | `docs/spec/05-cashier-pos.md` §3.3 Section D |
| See voids and variances across shifts | `docs/spec/05-cashier-pos.md` §3.3 |

To add the role: create the pages, add a `managerPortal` entry to `PORTAL_CONFIGS` in
`shared/scripts/portal.js`, and give the pages `<body id="managerPortal" ...>`.
