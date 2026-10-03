# POS Research — Cashier and Manager Roles

> **Date:** 2026-10-03
> **Purpose:** Evidence base for the two follow-up documents. Each finding ends with what it means for DIGITECHKH.
> - [../planning/cashier-improvements.md](../planning/cashier-improvements.md): the cashier gap list and backlog
> - [../spec/02-manager-pos.md](../spec/02-manager-pos.md): the manager / supervisor spec

Sources are vendor documentation (Microsoft Dynamics 365 Commerce, Toast, ROLLER, StoreHub, Shopify, Square),
loss-prevention write-ups, and Cambodian tax and payment references. Some are vendor blogs; treat them as industry
practice, not standards. **Have an accountant confirm the tax points in §9 before they reach production.**

---

## 1. Manager approval happens at the till, with the manager's own PIN

- Mature POS systems keep a **separate setting per sensitive action**: void, refund, discount, price override. Each one
  can be *allowed*, *needs manager*, or *disabled*. Turning on approval for discounts does not turn it on for voids.
  (StoreHub, ROLLER)
- The approver types **their own personal PIN** on the cashier's screen. There is no shared "manager code". The
  system logs **who approved, what and when** in the activity log. (ROLLER)
- Approval is a **permission granted to a role**, not a separate login. Admin and manager roles have it by default.

**For DIGITECHKH:** build one shared override component that the cashier terminal calls
(`showManagerOverride()`). It asks for a reason, the manager's name and their PIN, and writes an audit entry. It
does not replace the remote approval queue. The queue is still needed for requests raised after the customer has left
(see §3).

## 2. Hold / park a sale

- Square for Retail calls it **Saved Carts**. Restaurants call it Open Tickets. Retail staff use it to serve the next
  customer while the first one fetches a forgotten item. The pain it fixes: *"the transaction times out, forcing them to
  unwrap and re-enter everything."*

**For DIGITECHKH:** already in the v1 spec (workflow 3) and `planning/pos-enhancements.md`, but not built. A held
sale belongs to the shift and must be resumed or discarded before the shift can close.

## 3. Returns and refunds start from the original receipt

- Shopify POS: **find the order by search or receipt scan**, pick the items to return, choose full or partial refund,
  then refund to the original payment method or as store credit. Items can be restocked.
- Refunds are the **most abused exception** (see §6): refunds without a receipt, outside normal hours, or to stored value.

**For DIGITECHKH:** a refund needs (a) the original receipt number, (b) the lines returned, (c) a reason, (d) manager
approval, and (e) for cash, money out of the drawer, which lowers the shift's expected cash. The cashier's shift lock
forbids *browsing* other shifts. Looking up **one receipt by its exact number** to refund it is a different action. It
is listed as a decision in the cashier plan (D3).

## 4. The shift lifecycle and its cash movements

Microsoft Dynamics 365 Commerce has the most complete public model. The operations:

| Operation | Meaning | Who |
|---|---|---|
| Declare start amount | Opening float counted into the drawer | Cashier, with the cash handed over by the manager |
| Float entry / Tender removal | Cash moved into / out of a drawer, each side reconciled by the other person | Cashier ↔ manager |
| Safe drop | Excess cash moved from the drawer to the safe mid-shift. The POS **warns when the drawer exceeds a limit** | Cashier drops, manager receives |
| Bank drop | Cash moved from the safe to the bank | Manager |
| Paid-in / paid-out | Cash in or out for a non-sale reason (petty expense, top-up) | Needs a reason and a record |
| Tender declaration | Final count of each tender | Cashier |
| Blind close | Cashier closes **without seeing expected totals** and is logged off. The **manager finishes the close** | Cashier → manager |
| X-report | Same layout as the Z-report, **shift stays open, nothing saved** | Usually manager |
| Z-report | Immutable record produced when the shift closes | System |

Two rules worth copying:
- **A shift cannot close while a cash movement is unreconciled.** A safe drop the manager has not confirmed blocks the
  close.
- **Cash management works per currency.** Each currency has its own start amount, drops and declaration. That fits
  USD + KHR drawers.

**For DIGITECHKH:** the formula in v1 §7.3 already assumes these movements:
`expected = float + cash sales − cash refunds − payouts − drops + pay-ins`. Only float and cash sales exist today.

## 5. Count blind

- *"The person counting should not see the POS expected total first."* Seeing it first causes anchoring (the count
  drifts toward the number) and makes skimming easy. Count by denomination, and **keep a running over/short log per
  cashier**, because patterns over weeks matter more than a single night. (beancount.io, Dynamics 365)

**For DIGITECHKH:** the v1 spec requires a blind count (§3 principle 4 and §12.1). The built close-shift page shows cash
received in USD and KHR in step 1, *before* the count. Spec 01 §3.3 asked for that step 1, so the two specs conflict.
This is decision D1 in the cashier plan.

## 6. Exception reporting is the manager's main tool

What loss-prevention teams track (Agilence, Toast, LifeLong POS, iVend):

| Exception | Pattern to flag |
|---|---|
| Voids / post-voids | Many by one cashier, voids on cash sales, voids after the customer left |
| Refunds | High volume, no receipt, outside hours, to stored value |
| Discounts / comps | Ineligible items, manager comps covering personal purchases, stacking |
| Price overrides | Outside normal thresholds |
| No-sale drawer opens | Opening the drawer without a sale, often cover for skimming |
| Removed items | Lines scanned and then removed before payment |
| Cash variance | Small variances adding up across shifts |
| Timing | Transactions before opening, after closing, at shift change |

How to present it:
- **Compare each cashier with the team average.** *"A single void isn't suspicious, but a cashier with three times the void
  rate of peers is."* (Agilence)
- Break every exception down **by cashier and by approver** (Toast). An approver who approves everything is also a
  signal.
- Link each exception to the underlying receipt.

**For DIGITECHKH:** the manager needs an exceptions page built on a per-cashier table with peer comparison. The
cashier side must start *recording* the events: line removals, cleared carts, discounts with reasons, voids, refunds and
drawer opens. Nothing is logged today.

## 7. The manager dashboard is live and per register

Common elements (Square, Odoo POS dashboards, item.com):
- Sales, transaction count, average ticket, payment-method split, sales by hour
- **Per register:** open/closed, cashier, expected drawer amount vs. limit
- **Pending approvals** queue
- Sales per employee, items per order

**For DIGITECHKH:** a "register board" with one card per terminal plus the approvals queue covers most of a shift
supervisor's day. Monthly trends belong on a reports page, not the dashboard. The page DoD bans ECharts on dashboards.

## 8. Cambodia: KHQR, exchange rate, Riel change

**Bakong KHQR (dynamic QR)**
- Dynamic QR carries a creation and an expiry timestamp in tag 99. The default expiry is **300 seconds**. Keep it at
  ≤ 10 minutes for good UX and bounded polling.
- Each generated QR has an **MD5 hash**. Payment status is checked by MD5, full hash or short hash
  (`/v1/check_transaction_by_md5` and siblings), up to 50 at once. **Store the MD5, the order ID and the expiry** with the
  pending payment so status can be re-checked after a reload.

**Exchange rate**
- The National Bank of Cambodia publishes an **official rate daily** (dated for the next day). Tax and accounting refer
  to it, and GDT republishes it. In shops, 4,000 or 4,100 ៛ per dollar is the informal convention.
- **For DIGITECHKH:** `FX_RATE = 4100` is a constant. Make it a **rate of the day set by the manager**, and **stamp it
  on each sale**, so a reprint shows the rate that applied at the time.

**Riel change**
- In practice the smallest note handed out is **100 ៛**. 50 ៛ notes exist but are rarely seen. Shops give change as
  whole dollars plus the remainder in riel.
- **For DIGITECHKH:** v1 §7.2 already specifies this: `$2.00 + 1,600 ៛`, rounded to 100 ៛. The terminal instead shows
  the whole change twice, once in USD and once in KHR, without rounding (e.g. `1,558 ៛`). A cashier cannot hand that over.

## 9. Cambodia: what a POS receipt must carry

- A VAT-registered seller may issue a **tax invoice** (for VAT-registered buyers, who can then claim input credit) or a
  **commercial invoice** (for end consumers). GDT has separate templates for computer/POS-printed invoices, and has
  issued instructions on commercial invoices issued by retail businesses.
- A tax invoice needs: seller name, address and VATTIN; a **sequential number** and date; buyer name, address and
  VATTIN when the buyer is a taxpayer; description, quantity and price; total **excluding** tax and the tax **separately**.
- E-invoicing: **CamInvoice** went live for B2G in May 2025. Phase 2 in 2026 makes it mandatory for selected companies
  (by risk, size or sector). It validates UBL/XML against GDT rules.

**For DIGITECHKH:** the receipt already prints the seller's tax number, a sequential number, the net amount and VAT
on separate lines, so a walk-in commercial invoice is covered. Missing: buyer VATTIN for credit customers who are
VAT-registered (no such field in `CREDIT_CUSTOMERS`). Keep the sale record structured (lines, net, VAT, buyer) so it
can later be serialised for CamInvoice.

## 10. Checkout UX basics

- Show only what is needed to finish the sale. Remove optional fields. Make the **total due** the most prominent element.
  Label the discount control clearly. (DesignCrowd, Stripe)

**For DIGITECHKH:** the terminal already follows this. The remaining wins are in grid density and hold/resume (cashier
plan C4, C11).

## 11. How many shifts per day

- **Labour law:** in Cambodia the normal working day is 8 hours (48 h per week, six days). Including overtime a day may
  not exceed **12 hours**. Night time (22:00–05:00) and rest-day work pay at 200 %. (Rivermate, WageIndicator)
- **Every handover is a full count.** A count is due whenever drawer responsibility changes. The handover record holds
  expected, counted, variance, outgoing and incoming cashier, time and approval. **One drawer, one accountable cashier.**
  Sharing a drawer makes accountability "quietly break down". (Taqtics, BMI Leisure, Odoo shift-handover modules)
- **Breaks are not handovers.** During a break the drawer is secured and the register locked. No count, no new shift.

**For DIGITECHKH:** the number of shifts follows **opening hours ÷ about 8 h**, so it is a branch setting, not a
constant:

| Shop hours | Shifts per register per day | Pattern |
|---|---|---|
| ~07:00–21:00 (most retail) | **2** | morning 07:00–14:00 · afternoon 14:00–21:00 |
| 24 hours (mini-mart, petrol station) | **3** | 06:00–14:00 · 14:00–22:00 · 22:00–06:00 |
| Part-time staffing | 4 (6 h each) | Legal, but 4 blind counts and 4 manager reviews per register per day |

Four changes a day is possible but costly. Each close stops the register for a 10–15 min count, and each handover is a
point where cash can go missing. Prefer 2 or 3, and cover breaks with a terminal lock.

---

## Sources

- ROLLER: [Set up manager approval for POS actions](https://mysupport.roller.software/docs/set-up-manager-approval-for-pos-actions), [How to set the manager code](https://mysupport.roller.software/hc/en-us/articles/115001725474--How-to-Set-the-Manager-Code-on-POS-)
- StoreHub: [Cashier access control](https://care.storehub.com/en/articles/13398804)
- Microsoft: [Dynamics 365 Commerce — Cash management overview](https://learn.microsoft.com/en-us/dynamics365/commerce/cash-mgmt)
- LaunchMyStore: [POS shifts: opening, closing, X and Z reports](https://launchmystore.help.center/article/1116-pos-shifts-opening-closing-x-and-z-reports)
- beancount.io: [End-of-day close, Z reports and cash drawer reconciliation](https://beancount.io/blog/2026/09/14/end-of-day-close-z-reports-cash-drawer-daily-sales-reconciliation-guide)
- Agilence: [POS exception reporting](https://blog.agilenceinc.com/pos-exception-reporting-how-lp-teams-use-transaction-data-to-detect-fraud)
- Toast: [Cash and loss management reports](https://support.toasttab.com/en/article/Exceptions-Report-Overview)
- LifeLong POS: [Employee theft red flags](https://www.lifelongpos.com/resources/blog/employee-theft-red-flags-pos)
- iVend: [Loss prevention console](https://ivend.com/wp-content/uploads/2013/01/iVend-Mgmt-Console-help/toc446838163.html)
- Square: [Saving a checkout (Saved Carts)](https://community.squareup.com/t5/Questions-How-To/Saving-a-checkout/m-p/27406), [Real-time sales data](https://squareup.com/help/us/en/article/8142-get-real-time-sales-data-on-square-restaurants-pos)
- Shopify: [Returns and exchanges](https://help.shopify.com/manual/orders/refunds-returns/exchanges), [POS refunds and exchanges guide](https://cleverence.com/articles/shopify-us-documentation/managing-p-o-s-orders-refunds-and-exchanges-4837)
- item.com: [POS real-time dashboard](https://www.item.com/bookkeeper/pos-reporting-real-time-dashboard)
- KHQR: [khqr-php (Packagist)](https://packagist.org/packages/konthaina/khqr-php), [bakong-v2 (PyPI)](https://pypi.org/project/bakong-v2/1.1.6/), [Bakong KHQR skill notes](https://skills.sh/lowintechie/skills/bakong-khqr)
- Exchange rate: [GDT exchange rate page](https://www.tax.gov.kh/en/exchange-rate), [NBC rate summary](https://allratestoday.com/central-bank-rates-api/nbc/)
- Riel in practice: [Cambodian riel (Wikipedia)](https://en.wikipedia.org/wiki/Cambodian_riel), [Travelfish: Get riel](https://www.travelfish.org/beginners_detail/cambodia/51)
- Tax invoices: [DFDL — Cambodia tax invoice update](https://www.dfdl.com/insights/legal-and-tax-updates/cambodia-tax-alert-tax-invoice-update), [Mondaq — Tax invoices](https://www.mondaq.com/Tax/488790/Cambodia-Tax-Technical-Update-Tax-Invoices), [KPMG — Commercial invoices (2023)](https://assets.kpmg.com/content/dam/kpmg/kh/pdf/technical-update/2023/en/strengthening-the-implementation-of-procedures-for-the-use-of-commercial-invoices.pdf)
- E-invoicing: [vatcalc — Cambodia e-invoicing](https://www.vatcalc.com/cambodia/cambodia-e-invoicing-soft-launch/), [EDICOM — Cambodia](https://edicomgroup.com/electronic-invoicing/cambodia)
- Working hours: [Rivermate — Cambodia working hours](https://www.rivermate.com/guides/cambodia/working-hours), [WageIndicator — Compensation and working time](https://wageindicator.org/en-kh/ai/work-in-cambodia/labour-law/compensation-and-working-time/)
- Handover: [Taqtics — Cash drawer reconciliation checklist](https://taqtics.co/checklists/retail/cash-drawer-reconciliation-checklist/), [BMI Leisure — Cash accountability](https://support.bmileisure.com/support-center/working-with-cash-accountability), [Odoo POS shift handover](https://apps.odoo.com/apps/modules/18.0/tamadoo_pos_shift_handover)
- Checkout UX: [DesignCrowd — POS UX/UI](https://blog.designcrowd.com/article/2235/how-pos-ux-ui-shapes-in-store-customer-experience), [Stripe — checkout UI](https://stripe.com/en-gi/resources/more/mobile-checkout-ui)
