# STANDARD-03: Data Dictionary & Permission Matrix
**Version:** 2.0 | **Date:** 2026-09-29 | **Status:** Planning — No Code

---

## Purpose

Two things in one document:
1. **Data Dictionary** — every entity, its fields, and field-level visibility rules (Zero Data Leakage).
2. **Permission Matrix** — which roles can Create / Read / Update / Delete each entity.

---

## Part A: Permission Matrix (CRUD)

### Symbol Key
- **C** = Create  
- **R** = Read (list + detail)  
- **U** = Update  
- **D** = Delete (soft-delete / archive only — no hard delete in prototype)  
- **A** = Approve / Reject only  
- **—** = No access  
- **R\*** = Read own records only  
- **R!** = Read but with field restrictions (see Data Dictionary)

### Roles Abbreviation Key
| Code | Role |
|---|---|
| SA | Super Admin |
| GM | General Manager / Admin |
| SM | Sales Manager |
| SE | Sales Executive |
| CAS | Cashier / POS |
| PM | Procurement Manager |
| WM | Warehouse Manager |
| WS | Warehouse Staff |
| CA | Chief Accountant |
| APAR | AP/AR Accountant |
| IA | Internal Auditor |
| CS | Customer Support |
| SUP | Supplier (External Portal) |
| CUST | Customer (External Portal — future) |

### Entity Permission Matrix

| Entity | SA | GM | SM | SE | CAS | PM | WM | WS | CA | APAR | IA | CS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Customer** | CRUD | CRUD | CRU | CRU | R | — | — | — | R | R | R | CRUD |
| **Product / SKU** | CRUD | CRUD | R | R | R | R | CRUD | R! | R | R | R | R |
| **Product Price** | CRUD | CRUD | R | R! | — | R! | — | — | R | R | R | — |
| **Product Cost** | CRUD | CRUD | — | — | — | R | R | — | R | R | R | — |
| **Quotation** | CRUD | CRUD | CRUD A | CRUD | — | — | — | — | R | — | R | R |
| **Invoice** | CRUD | CRUD | CRUD | CRU | R | — | — | — | R | R | R | R |
| **Receipt / Payment** | CRUD | CRUD | R | R | CRUD | — | — | — | CRUD | CRUD | R | R |
| **Credit Note** | CRUD | CRUD | CRUD A | CRU | R | — | — | — | CRUD | CRUD | R | R |
| **Purchase Request** | CRUD | CRUD A | — | — | — | CRUD | — | — | R | R | R | — |
| **Purchase Order** | CRUD | CRUD | — | — | — | CRUD | R | R! | R | CRUD | R | — |
| **GRN (Goods Receipt)** | CRUD | CRUD | — | — | — | R | CRUD | CRU | R | R | R | — |
| **Vendor Invoice (Bill)** | CRUD | CRUD | — | — | — | R | — | — | R | CRUD | R | — |
| **Payment Voucher** | CRUD | CRUD A | — | — | — | R | — | — | CRUD A | CRUD | R | — |
| **Journal Entry** | CRUD | R | — | — | — | — | — | — | CRUD | CRU | R | — |
| **Stock Movement** | CRUD | R | — | — | — | R | CRUD | CRU | — | — | R | — |
| **Stock Level** | CRUD | CRUD | R! | R! | — | CRUD | CRUD | R | — | — | R | — |
| **Supplier** | CRUD | CRUD | — | — | — | CRUD | — | — | R | CRUD | R | — |
| **User Account** | CRUD | CRU | — | — | — | — | — | — | — | — | — | — |
| **Notification** | CRUD | R* | R* | R* | R* | R* | R* | R* | R* | R* | R* | R* |
| **Audit Log** | R | R | — | — | — | — | — | — | R | — | CRUD | — |
| **System Settings** | CRUD | R | — | — | — | — | — | — | — | — | — | — |
| **Exchange Rate** | CRUD | CRUD | — | — | — | — | — | — | CRUD | R | R | — |

**Notes:**
- WS (Warehouse Staff) cannot see `unitCost` or `sellingPrice` on any entity (Zero Data Leakage).
- SE (Sales Executive) cannot see `costPrice` — only `sellingPrice` for their assigned customer tier.
- R! on Product Price for SE means they can see the price for their assigned customer tier only, not all tier prices.
- Supplier portal: CRUD on own Bills only, Read own POs only, no access to any internal entity.

---

## Part B: Data Dictionary

> **ID formats:** the "Format:" notes below are superseded by the canonical ID table in eBMS `20-shared-mock-data-architecture.md` §4 (e.g. customers are `CUST-NNNN`, suppliers `SUP-NNN`, products use the SKU code). Field visibility rules in this document remain authoritative and become the whitelists for role projections (doc 20 §5).

### Entity 1: Customer

| Field | Type | Visible To | Notes |
|---|---|---|---|
| customerId | string | All (except WS, WM) | Format: CUST-YYYY-NNNN |
| customerName | string | All | Full legal name |
| customerCode | string | All (except WS) | Short code for quick search |
| phone | string | SM, SE, CS, GM, SA | Not visible to financial roles unless needed |
| email | string | SM, SE, CS, GM, SA | |
| address | string | SM, SE, CS, CAS, GM, SA | |
| customerTier | enum | SM, SE, CA, APAR, GM, SA | Values: RETAIL, WHOLESALE, VIP, CONTRACT |
| creditLimit | number | SM, CA, APAR, GM, SA | USD |
| currentBalance | number | CA, APAR, GM, SA | AR balance — financial only |
| assignedSalesExec | string | SM, SE, CS, GM, SA | |
| notes | string | SM, SE, CS | |
| createdAt | datetime | GM, SA, IA | |
| updatedAt | datetime | GM, SA, IA | |

### Entity 2: Product / SKU

| Field | Type | Visible To | Notes |
|---|---|---|---|
| productId | string | All | Format: PRD-NNNNNN |
| productName | string | All | In Khmer |
| productNameEn | string | All | Optional English name |
| productCode | string | All | SKU code |
| category | string | All | |
| unit | string | All | e.g., ដំណក់, ហ្វ្លេស, ចំណែក |
| currentStock | number | All except SE (sees only availability Y/N) | Zero Data Leakage: WS sees qty, not price |
| reorderPoint | number | WM, WS, PM, GM, SA | |
| maxStockLevel | number | WM, WS, PM, GM, SA | |
| warehouseLocation | string | WM, WS, PM | Bin/shelf location |
| costPrice | number | **PM, CA, APAR, GM, SA ONLY** | **NEVER visible to SE, WS, WM, CS, CAS** |
| sellingPriceRetail | number | SM, SE, CAS, CA, APAR, GM, SA | |
| sellingPriceWholesale | number | SM, SE (own tier), CA, APAR, GM, SA | |
| sellingPriceVIP | number | SM, CA, APAR, GM, SA | SE sees only if customer is VIP tier |
| sellingPriceContract | number | SM, CA, APAR, GM, SA | Contract-specific pricing |
| supplierId | string | PM, WM, CA, APAR, GM, SA | |
| isActive | boolean | All | |
| imageUrl | string | All | |

### Entity 3: Quotation

| Field | Type | Visible To | Notes |
|---|---|---|---|
| quotationId | string | SM, SE, CA, APAR, IA, GM, SA | Format: QT-YYYY-NNNN |
| customerId | string | SM, SE, CA, APAR, CS, GM, SA | |
| customerName | string | All with access | |
| createdBy | string | SM, SE, GM, SA | Sales Exec who created |
| status | enum | SM, SE, CA, APAR, CS, GM, SA | See state glossary in `02-cross-role-workflows.md` |
| validityDate | date | SM, SE, CA, CS, GM, SA | |
| lineItems | array | SM, SE, CA, APAR, GM, SA | Array of: {productId, productName, qty, unitPrice, discountPct, lineTotal} |
| subtotal | number | SM, SE, CA, APAR, GM, SA | Before discount/VAT |
| downPayment | number | SM, SE, CA, APAR, GM, SA | |
| specialDiscount | number | SM, CA, APAR, GM, SA | SM-only field in UI |
| vatAmount | number | SM, SE, CA, APAR, GM, SA | Always 10% |
| grandTotal | number | SM, SE, CA, APAR, GM, SA | |
| paymentTerms | string | SM, SE, CA, APAR, GM, SA | e.g., "Net 30", "50% upfront" |
| approvedBy | string | SM, CA, APAR, IA, GM, SA | Populated after approval |
| approvedAt | datetime | SM, CA, APAR, IA, GM, SA | |
| rejectionReason | string | SM, SE, GM, SA | |
| auditTrail | array | IA, GM, SA | [{changedBy, changedAt, oldStatus, newStatus, reason}] |

### Entity 4: Invoice

| Field | Type | Visible To | Notes |
|---|---|---|---|
| invoiceId | string | SM, SE, CAS, CA, APAR, CS, GM, SA | Format: INV-YYYY-NNNN |
| quotationId | string | SM, SE, CA, APAR, GM, SA | References source quotation if converted |
| customerId | string | All with access | |
| invoiceDate | date | All with access | |
| dueDate | date | All with access | |
| status | enum | All with access | DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED |
| lineItems | array | SM, SE, CAS, CA, APAR, GM, SA | Same structure as Quotation |
| subtotal | number | SM, SE, CAS, CA, APAR, GM, SA | |
| downPayment | number | SM, SE, CAS, CA, APAR, GM, SA | |
| specialDiscount | number | SM, CA, APAR, GM, SA | |
| vatAmount | number | All with access | |
| grandTotal | number | All with access | |
| amountPaid | number | CAS, CA, APAR, GM, SA | |
| balance | number | CAS, CA, APAR, GM, SA | grandTotal − amountPaid |
| paymentRecords | array | CAS, CA, APAR, GM, SA | Array of receipts linked to this invoice |
| createdBy | string | SM, SE, GM, SA | |
| approvedBy | string | SM, CA, APAR, IA, GM, SA | |

### Entity 5: Purchase Order

| Field | Type | Visible To | Notes |
|---|---|---|---|
| poId | string | PM, WM, WS*, CA, APAR, IA, GM, SA, SUP | WS sees poId + delivery info only; *no price fields |
| prId | string | PM, CA, APAR, GM, SA | Source Purchase Request |
| supplierId | string | PM, CA, APAR, GM, SA | |
| supplierName | string | PM, WM, CA, APAR, GM, SA | |
| poDate | date | PM, WM, CA, APAR, GM, SA, SUP | |
| expectedDelivery | date | PM, WM, WS, CA, APAR, GM, SA, SUP | |
| status | enum | PM, WM, WS*, CA, APAR, IA, GM, SA, SUP | WS sees status only (no amounts) |
| lineItems | array | PM, CA, APAR, GM, SA, SUP | {productId, productName, qty, **unitCost**, **lineTotal**} — WS EXCLUDED |
| totalAmount | number | PM, CA, APAR, GM, SA | **NEVER visible to WS, WM** |
| paymentTerms | string | PM, CA, APAR, GM, SA, SUP | |
| notes | string | PM, WM, CA, APAR, GM, SA, SUP | |
| approvedBy | string | PM, CA, APAR, IA, GM, SA | |
| grnId | string | PM, WM, CA, APAR, GM, SA | Populated after delivery |
| billId | string | PM, CA, APAR, GM, SA | Vendor invoice reference |
| pvId | string | CA, APAR, GM, SA | Payment voucher reference |

**Critical ZDL Rule:** WS and WM must never see `unitCost`, `totalAmount`, or any price field on POs. They only see: poId, supplierName (display only), lineItems (productName + orderedQty only), expectedDelivery, status.

### Entity 6: Goods Receipt Note (GRN)

| Field | Type | Visible To | Notes |
|---|---|---|---|
| grnId | string | PM, WM, WS, CA, APAR, IA, GM, SA | Format: GRN-YYYY-NNNN |
| poId | string | PM, WM, WS, CA, APAR, GM, SA | |
| receivedDate | date | PM, WM, WS, CA, APAR, GM, SA | |
| receivedBy | string | PM, WM, WS, CA, APAR, GM, SA | Warehouse Staff who received |
| lineItems | array | PM, WM, WS, CA, APAR, GM, SA | {productId, productName, orderedQty, receivedQty, condition, notes} — NO price |
| matchStatus | enum | PM, CA, APAR, GM, SA | PENDING, MATCHED, PARTIAL, DISPUTED |
| notes | string | PM, WM, WS, CA, APAR, GM, SA | |
| photos | array | PM, WM, WS, CA, APAR, GM, SA | Optional delivery proof photos (mock: static URLs) |

### Entity 7: Payment Voucher

| Field | Type | Visible To | Notes |
|---|---|---|---|
| pvId | string | CA, APAR, IA, GM, SA | Format: PV-YYYY-NNNN |
| billId | string | CA, APAR, GM, SA | |
| poId | string | CA, APAR, GM, SA | |
| grnId | string | CA, APAR, GM, SA | |
| vendorId | string | CA, APAR, GM, SA | |
| vendorName | string | CA, APAR, GM, SA | |
| pvDate | date | CA, APAR, GM, SA | |
| dueDate | date | CA, APAR, GM, SA | |
| grossAmount | number | CA, APAR, GM, SA | Before WHT |
| whtRate | number | CA, APAR, GM, SA | 0%, 10%, or 15% |
| whtAmount | number | CA, APAR, GM, SA | Computed: grossAmount × whtRate |
| netAmount | number | CA, APAR, GM, SA | grossAmount − whtAmount |
| paymentMethod | enum | CA, APAR, GM, SA | BANK_TRANSFER, KHQR, CASH, CHEQUE |
| bankAccount | string | CA, APAR, GM, SA | |
| status | enum | CA, APAR, IA, GM, SA | DRAFT, PENDING_APPROVAL, APPROVED, PAID, CANCELLED |
| approvedBy | string | CA, APAR, IA, GM, SA | CA approves |
| approvedAt | datetime | CA, APAR, IA, GM, SA | |
| paidAt | datetime | CA, APAR, GM, SA | |
| signatureBlock | object | CA, APAR, GM, SA | {preparer, chiefAccountant, director, payee} |
| qrCode | string | CA, APAR, GM, SA | KHQR verification QR (mock: static URL) |
| auditTrail | array | IA, GM, SA | |

### Entity 8: Supplier

| Field | Type | Visible To | Notes |
|---|---|---|---|
| supplierId | string | PM, CA, APAR, IA, GM, SA | Format: SUP-YYYY-NNNN |
| supplierName | string | PM, WM, CA, APAR, GM, SA | |
| contactPerson | string | PM, CA, APAR, GM, SA | |
| phone | string | PM, CA, APAR, GM, SA | |
| email | string | PM, CA, APAR, GM, SA | |
| address | string | PM, CA, APAR, GM, SA | |
| bankName | string | CA, APAR, GM, SA | For payment processing |
| bankAccount | string | CA, APAR, GM, SA | |
| taxId | string | CA, APAR, GM, SA | TIN — financial use only |
| whtExempt | boolean | CA, APAR, GM, SA | Whether WHT applies |
| paymentTerms | string | PM, CA, APAR, GM, SA | Default payment terms |
| portalUsername | string | SA, GM | Login credential for supplier portal |
| isActive | boolean | PM, CA, APAR, GM, SA | |

---

## Part C: Zero Data Leakage — Quick Reference

The following fields are **absolutely forbidden** from appearing in any UI component visible to WS, WM, Driver, or Customer:

| Forbidden Field | On Entity | Affects Roles |
|---|---|---|
| costPrice | Product | WS, WM, Driver — never |
| unitCost | PO line items | WS, WM, Driver — never |
| totalAmount | PO header | WS, WM, Driver — never |
| sellingPrice (any tier) | Product | WS, WM, Driver — never |
| grossAmount | Payment Voucher | WS, WM, CAS — never |
| whtAmount | Payment Voucher | WS, WM, CAS — never |
| currentBalance (AR/AP) | Customer/Supplier | SE, CAS, WS, WM, CS — never |
| journalEntry | Ledger | All non-accounting roles — never |

**Implementation rule:** When building data.js for WM or WS portals, these fields must be omitted from the exported mock objects entirely — do not set them to 0 or null, simply do not include the keys. This ensures a JS bug cannot accidentally render a price.
