# POS Manager (shift supervisor)

Built. Spec and build status: [docs/spec/02-manager-pos.md](../../docs/spec/02-manager-pos.md) (§11 shift model, §12 status).

```
manager/dashboard/dashboard.html         registers, approvals, exceptions today, sales by hour, payment mix
manager/approvals/approvals.html         request queue · view-request.html (receipt, cashier context, approve/reject)
manager/shifts/shifts.html               all drawer shifts · view-shift.html (reconciliation, countersign, reopen, X-report)
manager/roster/roster.html               default shifts, covers, weekly hours
manager/cash/cash.html                   safe balance, drops to receive, movement log · create-movement.html
manager/exceptions/exceptions.html       per-cashier vs team average, by approver, drill-down
manager/reports/sales-report.html        by day / hour / cashier / category / payment / product
manager/settings/settings.html           rate, cash limits, templates, till, reasons, staff, history
```

Pages use `<body id="managerPortal" data-role-root="../..">` and load `shared/scripts/manager-data.js` after
`data.js`. They need a manager login (PIN 2468 or 1357 in the demo).
