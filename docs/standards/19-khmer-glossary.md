# PLANNING-19: Khmer Terminology Glossary
**Version:** 2.0 | **Date:** 2026-09-29 | **Status:** Planning — No Code

---

## Purpose

One canonical Khmer term for every document, status, money label, action and role. Every page, `data.js` label, toast message, notification template and planning doc must use these exact strings.

**How the terms were chosen:** by counting what `frontend/roles/**` already uses (2026-09-29). The most-used correct term wins, so the migration touches as few pages as possible. The **Uses** column shows that count. A term marked **new** has no current usage and is being introduced.

---

## Rule 0 — What counts as "pure Khmer"

| Allowed in UI text | Not allowed in UI text |
|---|---|
| Brand and product names: `KHQR`, `Bakong`, `Dell UltraSharp`, `TP-Link Omada ER8411` | English abbreviations as labels: `PO`, `GRN`, `VAT`, `WHT`, `AR`, `AP`, `SKU`, `POS` |
| Document numbers: `QT-2026-0089`, `PO-2026-0045` (they are codes, not words) | English words in parentheses: `ការបញ្ជាទិញ (PO)`, `សាច់ប្រាក់ភ្លាមៗ (COD)` |
| Arabic numerals, `$`, `៛`, `%` | Transliterations: `ស៊ុបភើរ`, `ដាសបត` |
| | Khmer numerals `០-៩` anywhere |

**Known current violations to fix:** supplier-portal sidebar «ការបញ្ជាទិញ (PO)», create-bill label «យោងការបញ្ជាទិញ (PO)», customer-portal payment term «(COD)», login role 01 «ស៊ុបភើរ», procurement status «បានផ្គូផ្គង (Matched)», warehouse-manager toasts naming «PM» / «Procurement Manager» and button «(Batch PR)». Role names inside messages must use the Khmer role name (e.g. «អ្នកគ្រប់គ្រងលទ្ធកម្ម»).

---

## 1. Documents

| Concept | Canonical Khmer | Uses | Replace these variants |
|---|---|---|---|
| Quotation | សម្រង់តម្លៃ | 94 | ការដោះស្រាយ (wrong meaning) |
| Sales invoice | វិក្កយបត្រ | 281 | — |
| Receipt | បង្កាន់ដៃ | 23 | — |
| Credit note | លិខិតឥណទាន | 2 | — |
| Sales return | ការប្រគល់ទំនិញវិញ | new | ត្រឡប់ទំនិញ |
| Purchase request | សំណើទិញ | 4 | — |
| Purchase order | ការបញ្ជាទិញ | 99 | ការបញ្ជាទិញ (PO) |
| Goods receipt note | ប័ណ្ណទទួលទំនិញ | 5 | — |
| Supplier bill | វិក្កយបត្រអ្នកផ្គត់ផ្គង់ | 9 | វិក្កយបត្រទិញ |
| Payment voucher | ប័ណ្ណចំណាយ | 44 | ប័ណ្ណទូទាត់ |
| Withholding-tax certificate | លិខិតបញ្ជាក់ពន្ធកាត់ទុក | new | — |
| Stock adjustment | ការកែតម្រូវស្តុក | 3 | — |
| Journal entry | ការកត់ត្រាទិនានុប្បវត្តិ | new | — |
| Three-way match | ការផ្គូផ្គងឯកសារ 3 | new | ការផ្គូផ្គង 3-ផ្នែក |

## 2. Statuses

Status codes are defined in `15-approval-state-machine.md`. This is the only allowed label for each.

| Code | Canonical Khmer | Badge colour |
|---|---|---|
| DRAFT | ព្រាង | slate |
| PENDING_APPROVAL | រង់ចាំអនុម័ត | amber |
| APPROVED | បានអនុម័ត | emerald |
| REJECTED | បានបដិសេធ | rose |
| SENT_TO_CUSTOMER | បានផ្ញើជូនអតិថិជន | sky |
| ACCEPTED_BY_CUSTOMER | អតិថិជនបានយល់ព្រម | emerald |
| DECLINED_BY_CUSTOMER | អតិថិជនបានបដិសេធ | slate |
| CONVERTED_TO_INVOICE | បានបំប្លែងជាវិក្កយបត្រ | indigo |
| EXPIRED | ផុតសុពលភាព | slate |
| CANCELLED | បានលុបចោល | slate |
| OVERDUE | ហួសកាលកំណត់ *(33 uses — replaces ហួសកំណត់, 6 uses)* | rose |
| PARTIALLY_PAID | បានទូទាត់ខ្លះ | amber |
| PAID | បានទូទាត់ *(21 uses — replaces បានបង់, បង់រួច)* | emerald |
| UNPAID | មិនទាន់ទូទាត់ *(added 2026-09-30 — invoice with no payment yet and not overdue)* | slate |
| AWAITING_DELIVERY | រង់ចាំទទួលទំនិញ | amber |
| IN_TRANSIT | កំពុងដឹកជញ្ជូន | sky |
| DELIVERED | បានទទួលទំនិញ | emerald |
| PARTIAL_DELIVERY | ទទួលទំនិញមិនគ្រប់ | amber |
| MATCHED | បានផ្គូផ្គង *(already used; drop the «(Matched)» suffix)* | purple |
| DISPUTED | មានវិសមភាព | rose |
| CLOSED | បានបិទ | slate |

## 3. Money labels — financial summary (fixed order per GEMINI.md)

| Order | Concept | Canonical Khmer | Uses |
|---|---|---|---|
| 1 | Subtotal | សរុបរង | 12 |
| 2 | Down payment | ប្រាក់កក់ | 2 |
| 3 | Special discount | បញ្ចុះតម្លៃពិសេស | 17 |
| 4 | VAT 10% | អាករលើតម្លៃបន្ថែម 10% | 18 |
| 5 | Grand total | សរុបត្រូវបង់ | 5 *(replaces សរុបចុងក្រោយ on documents)* |

Other money terms:

| Concept | Canonical Khmer | Uses |
|---|---|---|
| Withholding tax | ពន្ធកាត់ទុក | 27 |
| Amount (generic) | ទឹកប្រាក់សរុប | 42 |
| Balance due | ប្រាក់នៅសល់ត្រូវបង់ | new |
| Accounts receivable | បំណុលត្រូវទារ | 15 |
| Accounts payable | បំណុលត្រូវសង | 11 |
| US dollar / riel | ដុល្លារ / រៀល | — |
| Exchange rate | អត្រាប្ដូរប្រាក់ | — |

## 4. Actions (button text)

| Action | Canonical Khmer | Note |
|---|---|---|
| Create | បង្កើតថ្មី | List-page primary button |
| Save | រក្សាទុក | Saves as DRAFT |
| Submit for approval | ដាក់ស្នើ | DRAFT → PENDING_APPROVAL |
| Approve | អនុម័ត | |
| Reject | បដិសេធ | Requires reason |
| Cancel (leave form) | បោះបង់ | Does not change data |
| Void a document | លុបចោល | → CANCELLED, needs `showCustomConfirm()` |
| Edit | កែប្រែ | |
| View detail | មើលលម្អិត | Inside the ⋮ menu |
| Print | បោះពុម្ព | |
| Send to customer | ផ្ញើជូនអតិថិជន | |
| Convert to invoice | បំប្លែងជាវិក្កយបត្រ | |
| Search | ស្វែងរក | |
| Clear filters | ជម្រះតម្រង | |
| Back | *(icon only — no text)* | GEMINI.md §5 |

## 5. Roles

Canonical names are the login-page labels; the full table with paths is in `17-missing-roles-and-external-portals.md` Part D. Sidebar role badges and "approved by" lines must use the same strings.

## 6. Number and date formats (reminder)

| Item | Format | Example |
|---|---|---|
| USD | `$` + comma thousands + 2 decimals | `$1,250.00` |
| KHR | comma thousands, no decimals, `៛` after | `5,125,000 ៛` |
| Date in UI | `DD/MM/YYYY` | `29/09/2026` |
| Date in data | ISO `YYYY-MM-DD` | `2026-09-29` |
| Month name | Khmer month + Arabic numerals | `29 កញ្ញា 2026` |

---

## Maintenance

- Adding a new status or document type means adding a row here **first**.
- A page review (see `21-page-definition-of-done.md`) fails if it uses any variant from the "Replace these variants" column.
