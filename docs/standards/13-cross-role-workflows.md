# PLANNING-13: Cross-Role Workflow Connections
**Version:** 2.0 | **Date:** 2026-09-29 | **Status:** Planning — No Code

---

## Purpose

This document maps every workflow that crosses a role boundary, defining the exact sequence of handoffs, state changes, and data passed between roles. It is the authoritative reference for UI state machines and mock data design.

---

## Workflow 1: Quote-to-Cash (Q2C)

### Roles Involved
Sales Executive (SE) → Sales Manager (SM) → Customer (portal) → AP/AR Accountant (APAR) → Chief Accountant (CA)

**Who records the payment:** B2B invoices on credit terms are paid by bank transfer or KHQR and recorded by **AP/AR** as a receipt (`10-apar-accountant/receipts/`). The **Cashier** records only walk-in retail sales at the POS terminal (`05-cashier-pos/`), which do not go through quotation approval. Wherever "CAS" appears in the state machine below for B2B invoices, read "APAR".

### State Machine

```
[DRAFT]
  SE creates quotation
  ↓ SE submits
[PENDING_APPROVAL]
  SM receives notification: "New quotation #Q-XXXX requires approval"
  ↓ SM approves
[APPROVED]
  SE sends quotation to customer (Customer Portal)
  ↓
[SENT_TO_CUSTOMER]
  Customer accepts in portal (or SE records acceptance for walk-in / phone customers)
  ↓
[ACCEPTED_BY_CUSTOMER]
  SE converts quotation → Invoice
  ↓
[INVOICE_ISSUED]
  Invoice sent to customer
  Customer pays → CAS records payment
  ↓ OR customer pays online (KHQR)
[PAYMENT_RECEIVED]
  CAS confirms receipt
  ↓
[RECEIPT_POSTED]
  CA reviews & posts to ledger
  ↓
[LEDGER_CONFIRMED]
  APAR reconciles AR balance
  ↓
[CLOSED]
```

### Rejection Paths

| Step | Actor | Action | Result |
|---|---|---|---|
| SM rejects quotation | SM | Reject with reason | → [REJECTED], SE notified |
| SE revises rejected quotation | SE | Edit + resubmit | → [PENDING_APPROVAL] again |
| Customer declines quotation | Customer | Decline in portal | → [DECLINED_BY_CUSTOMER], SE + SM notified |
| CA disputes receipt | CA | Flag discrepancy | → [DISPUTED], CAS + SE notified |

### Data Passed at Each Handoff

| Handoff | Data Passed |
|---|---|
| SE → SM (quotation approval) | quotationId, customerId, customerTier, lineItems (productId, qty, unitPrice, discountPct), subtotal, downPayment, specialDiscount, VAT10, grandTotal, paymentTerms, validityDate |
| SM approval decision → SE | approvalStatus (approved/rejected), rejectionReason?, approvedBy, approvedAt |
| SE → CAS (invoice created from quotation) | invoiceId, quotationId, customerId, customerName, lineItems, grandTotal, paymentMethod, dueDate |
| CAS → CA (payment confirmed) | receiptId, invoiceId, amountReceived, paymentMethod (Cash/KHQR/Bank Transfer), receivedAt, cashierId |
| CA → APAR (ledger entry) | journalEntryId, accountCode (AR 1100), debitAmount, creditAmount, period |

### Approval Authority Thresholds (Q2C)

| Quotation Grand Total | Required Approver |
|---|---|
| ≤ $5,000 | Sales Manager (no self-approval at any amount) |
| $5,001 – $20,000 | Sales Manager + General Manager co-sign |
| > $20,000 | Sales Manager + General Manager + Director |

**Note:** See `16-authority-and-notification-matrix.md` for the full threshold table across all workflows.

---

## Workflow 2: Purchase-to-Pay (P2P)

### Roles Involved
Procurement Manager (PM) → General Manager (GM) → Supplier (External) → Warehouse Manager (WM) → Warehouse Staff (WS) → AP/AR Accountant (APAR) → Chief Accountant (CA)

### State Machine

```
[PR_DRAFT]
  PM creates Purchase Request (PR)
  ↓ PM submits
[PR_PENDING_APPROVAL]
  GM approves PR
  ↓
[PR_APPROVED]
  PM creates Purchase Order (PO) from approved PR
  ↓ PM sends PO to supplier
[PO_SENT]
  Supplier views PO in Supplier Portal
  ↓ Supplier confirms PO
[PO_CONFIRMED]
  Supplier ships goods
  Supplier creates Vendor Invoice (Bill) in Supplier Portal
  ↓
[AWAITING_DELIVERY]
  Warehouse Manager / Warehouse Staff receives goods
  WM creates Goods Receipt Note (GRN)
  ↓
[GRN_CREATED]
  APAR performs 3-Way Match: PO ↔ GRN ↔ Vendor Invoice
  ↓ All 3 match
[3WAY_MATCHED]
  APAR creates Payment Voucher (PV)
  ↓ CA approves PV
[PV_APPROVED]
  Payment sent to supplier (Bank Transfer / KHQR)
  ↓
[PAID]
  CA posts to ledger
  ↓
[LEDGER_POSTED]
  APAR reconciles AP balance
  ↓
[CLOSED]
```

### 3-Way Match Failure Paths

| Mismatch Type | Action | Who Acts |
|---|---|---|
| PO qty ≠ GRN qty | Partial delivery flag → PM notified, WM adds note | PM decides: accept partial or request re-delivery |
| GRN qty ≠ Invoice qty | Dispute invoice → Supplier notified via portal | PM + Supplier resolve → revised invoice submitted |
| PO price ≠ Invoice price | Hold payment → PM + CA notified | PM verifies with supplier; CA approves override if legitimate |
| All 3 match with tolerance ≤ 1% | Auto-proceed to PV creation | APAR creates PV |

### Data Passed at Each Handoff

| Handoff | Data Passed |
|---|---|
| PM → GM (PR approval) | prId, supplierId, lineItems (productId, productName, qty, unitCost, totalCost), totalAmount, justification, urgency |
| GM decision → PM | approvalStatus, rejectionReason?, approvedBy, approvedAt |
| PM → Supplier (PO) | poId, poDate, lineItems (productCode, productName, qty, unitCost, totalCost), deliveryAddress, deliveryDate, paymentTerms, notes |
| Supplier → WM (delivery) | poId, deliveryNote, actualDeliveryDate, lineItems (actualQtyDelivered) |
| WM/WS → APAR (GRN) | grnId, poId, receivedDate, lineItems (productId, orderedQty, receivedQty, condition), warehouseLocation, receivedBy |
| Supplier → APAR (Invoice) | billId, poId, grnId?, invoiceDate, dueDate, lineItems (productId, qty, unitPrice), subtotal, WHT?, netAmount, bankAccount |
| APAR → CA (Payment Voucher) | pvId, billId, poId, grnId, vendorId, grossAmount, whtRate, whtAmount, netAmount, paymentMethod, dueDate |
| CA decision → APAR | approvalStatus, approvedBy, approvedAt, notes |

### WHT (Withholding Tax) Rules — P2P

- **Rate:** 15% on services; 10% on goods (Cambodia standard rate — confirm with accountant at production)
- **Who deducts:** AP/AR Accountant at Payment Voucher creation
- **Who receives:** Supplier receives net amount (gross − WHT)
- **Document:** WHT Certificate must be printed and given to supplier at payment

---

## Workflow 3: Stock Replenishment (Auto-Reorder)

### Roles Involved
Warehouse Staff (WS) → Warehouse Manager (WM) → Procurement Manager (PM)

### State Machine

```
[STOCK_LOW]
  WS records stock-in / stock-out → System checks reorder point
  OR WS manually flags item as low stock
  ↓
[REORDER_SUGGESTED]
  WM reviews auto-reorder suggestions list
  ↓ WM approves suggestion
[REORDER_REQUESTED]
  PM receives notification: "X items require purchase request"
  PM creates PR → continues into P2P Workflow 2
  ↓
[PR_CREATED]
  → Merges into P2P from [PR_PENDING_APPROVAL]
```

### Reorder Point Logic (Mock Data Rule)
```
reorderPoint = Math.ceil(averageDailyUsage * leadTimeDays * 1.2)
suggestedOrderQty = maxStockLevel - currentStock
```

---

## Workflow 4: Sales Return (Credit Note)

### Roles Involved
Sales Executive (SE) → Sales Manager (SM) → Warehouse Manager (WM) → Cashier (CAS) → APAR

### State Machine

```
[RETURN_REQUESTED]
  SE logs customer return request, references original Invoice ID
  ↓ SM approves return
[RETURN_APPROVED]
  WM receives returned goods from customer
  WM creates Return Receipt
  ↓
[GOODS_RETURNED]
  SE creates Credit Note referencing original Invoice
  ↓ SM approves Credit Note
[CREDIT_NOTE_APPROVED]
  CAS processes refund or issues store credit
  ↓
[REFUND_ISSUED]
  APAR adjusts AR balance, posts credit note to ledger
  ↓
[CLOSED]
```

---

## Workflow 5: Delivery Coordination

### Roles Involved
Sales Executive (SE) → [Driver Role — see `17-missing-roles-and-external-portals.md`] → Warehouse Staff (WS)

**Status: DEFERRED** — Driver role not built in v2 prototype. Delivery status is simulated in SE pipeline page as static mock. See `17-missing-roles-and-external-portals.md` for decision on Driver role.

---

## Workflow 6: Leave & Payroll (HR)

### Roles Involved
All Roles → [HR Staff Role — see `17-missing-roles-and-external-portals.md`] → Chief Accountant (CA)

**Status: DEFERRED** — HR role not built in v2 prototype. See `17-missing-roles-and-external-portals.md` for decision.

---

## Workflow State Glossary

Khmer labels and badge colours for every state code live in **one place only**: `19-khmer-glossary.md` §2. Do not repeat them here or in any other doc — that is how they drifted before.

---

## Notes for UI Implementation

1. **Status badges:** Label and colour come from `19-khmer-glossary.md` §2. In code, this becomes a single shared `STATUS_META` map (see `20-shared-mock-data-architecture.md`), never per-page badge markup.

2. **Notification triggers:** Every state transition triggers a notification. See `16-authority-and-notification-matrix.md` for the full matrix.

3. **No state skipping:** The UI must enforce valid transitions. A DRAFT document cannot jump to PAID. Invalid transitions are blocked in JS, not just hidden.

4. **Audit trail:** Every state change records (changedBy, changedAt, previousState, newState, reason?). This is part of the mock data structure defined in `14-data-dictionary-and-permissions.md`.

5. **Workflows only connect through the shared store.** Today each role reads its own `data.js`, so a hand-off in this document (e.g. SE submits → SM sees it) cannot happen in the prototype. `20-shared-mock-data-architecture.md` is the prerequisite for every workflow above.
