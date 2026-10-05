# Staff Work Time & Payroll — Spec

> **Date:** 2026-10-05 · **Status:** built (owner payroll page, real-time engine); open decisions in §9
> **Code:** `shared/scripts/admin-data.js` (`PAY_RULES`, `classifyWork`, `attendanceRows`, `calculateStaffPayroll`,
> `getStaffTimesheet`) · `admin/reports/payroll.html` · `admin/staff/staff.html` (pay settings)
> **Related:** [02-manager-pos.md §11](02-manager-pos.md) (shift model),
> [planning/shift-scheduling-ux.md](../planning/shift-scheduling-ux.md) (roster, short shifts),
> [research/pos-market-research.md](../research/pos-market-research.md) (labour law, cited as **R§11**)

The first version of this spec paid from fixed numbers per person (`otHours = 16` for CAS-01 and so on) and a
timesheet invented from the day of the month. This version pays from **real time**: when the cashier actually opened
and closed their drawer.

---

## 1. Principles

1. **Real time, not planned time.** A cashier's worked time is the drawer shift from `openedAt` to `closedAt`. The
   roster only says what was *expected*; the difference between the two is attendance (late, early, absent).
2. **One rule set, in one place.** Every multiplier and limit lives in `PAY_RULES` (`admin-data.js`). The payroll page,
   the timesheet, the payslip and the staff pay preview all read it.
3. **Show the working.** Every amount on the payroll page can be traced to hours, and every hour to a dated shift in
   the timesheet. Nothing is a lump sum.
4. **Never take money silently.** Deductions that need a judgement (cash shortages) are shown, not deducted, until the
   owner decides (§9 D-P3).
5. **Who sees what.** Owner: everything. Manager: hours in the roster, no pay. Cashier: only their own hours (§7.3),
   never pay rates of others. Pay data stays in `admin-data.js`, which only owner pages load.

---

## 2. Where time comes from

| Source | Field | Used for |
|---|---|---|
| Drawer shift (`pos_shifts` + generated history via `mgrAllShifts()`) | `openedAt`, `closedAt`, `date`, `templateCode`, `register`, `variance` | real hours, night hours, cash shortage |
| Open drawer shift | `openedAt`, no `closedAt` | counted **up to now**, marked «កំពុងធ្វើ» |
| Roster (`rosterFor(date, code)`) | `cashierId`, `register`, `cover`, `from` / `until` (short shift) | expected start and end, absences |
| Staff defaults (`posSettings().staffDefaults`) | `dayOff` | rest-day work |
| Pay settings (`pos_staff_compensation`) | base salary, allowances, bank | pay |

A drawer shift belongs to its **business date** (`shift.date`), so a night shift 22:00–06:00 counts on the day it
started.

**Managers** sell on the till only to cover; most of their work is not on a drawer. They are paid a **fixed monthly
salary** and their hours are not tracked for pay (the page shows «ប្រាក់ខែថេរ · មិនគិតម៉ោង»). **The owner** is not on
the payroll.

---

## 3. Rules (`PAY_RULES`)

| Rule | Value | Source |
|---|---|---|
| Normal hours per day | 8 h | Labour Law, R§11 |
| Normal hours per week (Monday–Sunday) | 48 h | Labour Law, R§11 |
| Working days per month | 26 (so the hourly rate = base ÷ 208) | spec v1 |
| Overtime, daytime | 150 % | Labour Law |
| Overtime, at night | 200 % | Labour Law |
| Night work 22:00–05:00 | 200 % (**to confirm**, D-P1) | R§11 |
| Work on the weekly rest day | 200 % | R§11 |
| Grace before «late» / «left early» counts | 10 min | product rule |
| Attendance bonus | no absence and at most 3 lates in the period | product rule |
| Max per day / min rest | 12 h / 11 h, enforced when **rostering and opening**, not in pay | [shift-scheduling-ux.md](../planning/shift-scheduling-ux.md) |

---

## 4. How each minute is classified

`classifyWork(personId, start, end)` walks every drawer shift in 5-minute steps, starting from the Monday of the
first week so the weekly limit is right, and puts each step in exactly one bucket:

```
if the shift's date is the person's weekly day off      → dayOff
else add the step to the day counter and the week counter
     if day > 8 h or week > 48 h                         → ot      (otNight if 22:00–05:00)
     else                                                 → regular (night  if 22:00–05:00)
```

- Daily and weekly overtime are **never counted twice**: one counter crossing its limit is enough.
- Rest-day minutes don't add to the week counter (they are already paid at 200 %).
- The page shows: **ម៉ោងពិត** = all buckets · **ធម្មតា** = regular + night · **បន្ថែម** = ot + otNight ·
  **យប់** = night + otNight · **ថ្ងៃឈប់** = dayOff.

---

## 5. Attendance: plan against reality

`attendanceRows(personId, start, end)` lists every roster entry for the person, and matches it with a drawer shift
on the same date and template.

| Case | Rule | Shown as |
|---|---|---|
| Rostered, shift ended, no drawer shift | absent | «អវត្តមាន» rose |
| Opened more than 10 min after the planned start | late, minutes kept | «យឺត 18 នាទី» amber |
| Closed more than 10 min before the planned end | left early | «ចេញមុន 25 នាទី» amber |
| Drawer shift with no roster entry | worked, unplanned | «មិនមានក្នុងកាលវិភាគ» amber |
| Roster entry marked `cover` | worked as cover | «ជំនួស» amber |
| Short shift (`until`) | planned end = `until`, not the template end | normal |
| Rostered in the future | not listed | — |

---

## 6. Pay

All amounts in USD, rounded to cents at the end of each line. `hourly = base ÷ 208`.

| Line | Monthly cashier | Manager |
|---|---|---|
| Base salary | `base × share` (share = 1 for a full calendar month, else days ÷ days in month) | same |
| Overtime | `ot × hourly × 1.5 + otNight × hourly × 2.0` | — |
| Night premium | `night × hourly × (2.0 − 1)`: the base already pays the hour, only the extra is added | — |
| Rest-day work | `dayOff × hourly × 2.0` (these hours are outside the 26 paid days) | — |
| Food allowance | `allowance × share` | same |
| Attendance bonus | `bonus × share` if no absence and ≤ 3 lates, else 0 («គ្មានរង្វាន់វត្តមាន») | same |
| **Deduction:** absence | `absent days × base ÷ 26` | — |
| Cash shortage | **shown, not deducted** («ខ្វះថត $3.24 · មិនកាត់») | — |
| NSSF, salary tax | $0.00 (not built, D-P4) | same |

`net = base + overtime + night + rest-day + allowance + bonus − absence`.

Once a period is **disbursed**, the row shows the paid amount from `pos_payroll_disbursements`. If a later
recalculation differs (a reopened shift, a corrected roster), the row adds «គណនាថ្មី $…» so the owner sees the gap
instead of the paid figure changing under them.

### 6.1 Worked examples (base $250, hourly ≈ $1.2019)

**Double day (the case from shift-scheduling-ux §2.4).** ចន្ទ មករា opens the morning at 05:53, closes at 14:00, then
works a short afternoon shift 14:00–17:50.

| Bucket | Hours | Pay |
|---|---|---|
| regular (first 8 h) | 8.0 | in base |
| ot (beyond 8 h that day) | 3.9 | 3.9 × 1.2019 × 1.5 = **$7.03** |
| total real time | 11.9 | the 12 h cap held |

**Night shift.** លី សុភា opens 22:14, closes 06:10 (late 14 min).

| Bucket | Hours | Pay |
|---|---|---|
| night (22:14–05:00) | 6.8 | 6.8 × 1.2019 × 1.0 = **$8.17** premium |
| regular (05:00–06:10) | 1.2 | in base |
| attendance | late 14 min | counts toward the 3-late limit |

---

## 7. Screens

### 7.1 Owner: `admin/reports/payroll.html` «ម៉ោងការងារ និងប្រាក់បៀវត្សរ៍»

- **Toolbar:** tabs (all / cashiers / managers / to pay / paid), date range (default: this month), «បើកប្រាក់ខែទាំងអស់»,
  «បោះពុម្ពតារាង». There is **no demo-data reset button** on this page; the login page's reset covers it.
- **KPIs** (shared `kpiCard()`, no icons): amount to pay · real hours (overtime, night) · absences (lates) · paid count.
- **Sub-title** states the period and whether base pay is prorated, e.g. «01/10/2026 ដល់ 31/10/2026 · ខែពេញ · ម៉ោងគិតដល់ថ្ងៃនេះ».
- **Table:** ល.រ · បុគ្គលិក (role, code) · ម៉ោងពិត (shifts, «កំពុងធ្វើ») · បែងចែកម៉ោង (chips) · វត្តមាន (chips) ·
  ប្រាក់ខែគោល · ប្រាក់បន្ថែម · កាត់កង · ត្រូវបើក · ស្ថានភាព · ⋮
- **⋮ menu:** ម៉ោងធ្វើការលម្អិត (cashiers) · ប័ណ្ណបើកប្រាក់ខែ · បើកប្រាក់ខែ (if unpaid). No native tooltips.
- **Timesheet:** one row per rostered or worked shift: date · shift · planned window · real window · hours · bucket
  chips · drawer variance · notes (late, early, absent, cover, working now).
- **Payslip:** earnings and deductions as in §6, real hours and shift count in the header, shortage as a note.

### 7.2 Owner: pay settings in `admin/staff/staff.html`

Base salary, food allowance, attendance bonus, bank. The live preview shows the hourly, overtime, night and
one-day-absence amounts, all from `PAY_RULES`.

### 7.3 Cashier: own hours (not built, P2)

The cashier sees only their own time, never money:

- terminal «វេនរបស់អ្នកថ្ងៃនេះ» and open-shift already show hours worked today against the 12 h limit;
- to add: a «ម៉ោងរបស់ខ្ញុំ» line on the close-shift result, «សប្តាហ៍នេះ 33 ម៉ោង · បន្ថែម 2.6 ម៉ោង · យឺត 1 ដង», so
  disputes are settled from the same numbers the owner pays from. This needs an own-hours helper in `data.js` that
  reads only the signed-in person's shifts.

---

## 8. Data

| Key / function | Content |
|---|---|
| `pos_staff_compensation` | `{ [staffId]: { baseSalaryUSD, foodAllowanceUSD, attendanceBonusUSD, payType, bankName, accountName, accountNumber, employeeCode, phone, joinedDate } }`; edits write `pos_admin_log` |
| `pos_payroll_disbursements` | `{ id, staffId, periodKey, periodLabel, baseSalaryUSD, grossUSD, deductionsUSD, netUSD, method, at, by }`; seeded with September 2026 |
| `PAY_RULES` | §3 |
| `workSessions(id, from, to)` | drawer shifts with open/close times (open = now) |
| `classifyWork(id, start, end)` | `{ totals, perShift }` in minutes per bucket |
| `attendanceRows(id, start, end)` | plan vs reality rows (§5) |
| `calculateStaffPayroll(range)` | `{ staffPayrolls[], summary }` |
| `getStaffTimesheet(id, range)` | rows for the timesheet dialog |

Mock history covers the last 14 days, so a month view before then has hours only for those days.

---

## 9. Decisions needed

| ID | Question | Recommendation |
|---|---|---|
| D-P1 | Night work premium: 200 % (research doc) or 130 % (some sources for non-overtime night work)? | **Confirm with an accountant**; it changes a night cashier's pay by ~$150 a month. One constant (`PAY_RULES.nightMult`) |
| D-P2 | Are breaks (terminal locked) unpaid time? | **No** for now: the lock is short and the cashier stays at the till. Revisit if locks over 30 min become common |
| D-P3 | Deduct cash shortages from pay? | **Only after** the manager's shift review says «cashier at fault» and the owner confirms per case. Until then: shown, not deducted |
| D-P4 | NSSF and salary tax | Build when a real payroll is run; amounts are $0.00 placeholders today |
| D-P5 | Should overtime need approval before it is paid? | **Yes, later:** overtime from a roster cover or short shift is pre-approved; overtime from staying late after the shift end shows «មិនទាន់អនុម័ត» and is paid once the manager approves |
| D-P6 | Round real time? | **No rounding** of clock times; hours shown to 0.1 h, pay to the cent |
| D-P7 | Hourly staff (`payType: 'hourly'`) | Not used by any demo person; when added, pay regular hours × rate instead of the base |

---

## 10. Status (2026-10-05)

| Item | Status |
|---|---|
| Real-time engine (§4–§6) | Done |
| Payroll page: real hours, chips, ⋮ menu, Khmer-only, KPIs without icons, demo reset removed | Done |
| Timesheet: plan vs real, buckets, attendance flags | Done |
| Payslip from real numbers, shortage as a note | Done |
| Paid periods show the paid amount and flag recalculation | Done |
| Cashier own-hours view (§7.3) | Not built |
| D-P1 – D-P7 | Open |
