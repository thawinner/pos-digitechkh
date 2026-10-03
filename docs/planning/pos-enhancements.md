# Cashier / POS — v2 Enhancement Proposals

> Extracted from `documentation/v2/00-v2-planning-enhancement.md` in the eBMS repo (Role 05 section only).

### Role 05 — Cashier / POS `posPortal`

**Current Pages (3 items sidebar):**
1. ផ្ទាំងគិតលុយ `pos-terminal.html`
2. វិក្កយបត្រក្នុងវេន `receipts/receipts.html`
3. បិទវេន និងរាប់សាច់ប្រាក់ `close-shift.html`

**Enhancement Ideas:**

#### 📌 Improve POS Terminal — Hold Orders
**"Hold" Feature**: Cashier can put a cart on hold (customer not ready to pay) and start a NEW order. Multiple holds possible (max 5 per shift). **Hold Queue button** in the terminal header reopens a held order.  
This is a real-world critical feature for retail — currently completely absent.

#### 📌 Improve POS Terminal — Product Search Refinement
Currently product grid with category pills.  
**Add Quick Search inside terminal**: Filter products by name/barcode without leaving the terminal. Currently scan-to-add works, but typed search is needed for products without barcode labels.

#### 📌 Improve `receipts/receipts.html`
Add **"Reprint Receipt"** button per row (currently mentioned but ensure it's explicit).  
**Add "Request Void"** button per receipt: Cashier cannot void directly — tapping this sends a void request to GM/Admin with a reason note. Creates a workflow trail.

#### 📌 Improve `close-shift.html`
Add **"Opening Float" recording at start of shift**: Before starting a new shift, cashier enters opening cash amount (e.g., $50 float). This becomes Step 0 in the close-shift wizard, and closing reconciliation becomes: Opening Float + Cash Sales − Cash Out = Expected Closing Cash.

#### 🆕 New Page → Open Shift `open-shift.html`
Currently undocumented. When cashier starts their shift:
- Select their name / confirm identity
- Enter opening float amount (counted physically)
- System records shift_start time and float
- "Start Shift" button → navigates to POS terminal

---

