# POS Manager (shift supervisor) — not built yet

The second POS role. The cashier cannot void, refund, change a price or give a discount above their limit;
the manager approves those, moves cash (float, safe drops, payouts) and reviews and countersigns each closed shift.

**Spec:** [docs/spec/02-manager-pos.md](../../docs/spec/02-manager-pos.md). Read it before building any page here.
The cashier-side changes the manager depends on are in [docs/planning/cashier-improvements.md](../../docs/planning/cashier-improvements.md).

Pages go here as `manager/<feature>/<page>.html`, at the same depth as the cashier pages, with `data-role-root="../.."`:

```
manager/dashboard/dashboard.html
manager/approvals/approvals.html, view-request.html
manager/shifts/shifts.html, view-shift.html
manager/cash/cash.html, create-movement.html
manager/exceptions/exceptions.html
manager/reports/sales-report.html
manager/settings/settings.html
```

To add the role: add a `managerPortal` entry to `PORTAL_CONFIGS` in `shared/scripts/portal.js`, give the pages
`<body id="managerPortal" ...>`, and load `shared/scripts/manager-data.js` after `data.js` on manager pages only.
