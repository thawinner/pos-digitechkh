# Shift Scheduling UX — Improvement Plan

> **Date:** 2026-10-05 · **Status:** Built (commit `bf39e59`), reviewed and corrected 2026-10-05; see §0
> **Scope:** the two places where a shift gets added:
> 1. **Roster** «កាលវិភាគវេន» (`manager/roster/roster.html`): putting a person on a shift for a date, removing
>    them, and editing their default shift «វេនប្រចាំ».
> 2. **Shift templates** «គំរូវេន» (`shared/scripts/settings-page.js`, section `shifts`): adding, editing and removing
>    a time window.
>
> Out of scope: the cashier's open-shift page (`cashier/shift/open-shift.html`), which is already covered by C3 / C22
> in [cashier-improvements.md](cashier-improvements.md).
> **Inputs:** the code as of commit `8e5a77e`, [spec/02-manager-pos.md §11](../spec/02-manager-pos.md) (shift model),
> [research/pos-market-research.md §11](../research/pos-market-research.md) (labour-law limits).

Line numbers are as of 2026-10-05 and will drift. Item IDs use the prefix **S** (shift scheduling).

---

## 0. Review of the build (2026-10-05)

The plan was built in `bf39e59`. A review in the browser (1440×900 and 390×844, clock set to 06:05, 09:00 and 14:10)
found and fixed:

| Area | Problem found | Fix |
|---|---|---|
| Roster rules | Night shift → next morning (0 h rest, 16 h straight) was **recommended** | Rest < 11 h now blocks («ធ្វើការជាប់គ្នា») |
| Roster rules | A cashier with an open drawer was blocked outright, so the partial cover (§5.2) never appeared; hours counted only to *now* | Open drawer is projected to its end; the dialog offers «ជំនួសត្រឹម 14:00–17:50» |
| Roster rules | `assignShift()` still removed people from shifts that had already started | Only shifts that haven't started are moved; started ones stay (double shift) |
| Roster rules | Weekly hours for a partial cover counted the full 8 h | Counts the short shift's real length |
| Assign dialog | Over-48 h and back-to-back people listed under «ណែនាំ»; list jumped to top on every click; «(OT)»; native tooltips; a checkbox for a choice that wasn't optional | Three groups (recommended / with caveats / blocked); scroll kept; Khmer only; day bar only when relevant, short shift stated as a fact |
| Roster grid | 7th day cut off at 1440 px; 21 dashed «បន្ថែម» buttons; names truncated; «ត្រឡប់ទៅលំនាំដើម» spilling into the next day | Fixed-width columns fit the week; «បន្ថែម» only on filled cells and on hover; compact chips; «ជំនួស / ដល់» on the second line |
| Roster phone | Five staff cards before the schedule | Schedule first, staff cards after |
| Dashboard coverage | English «(Shift Coverage)»; 6 «មិនមានវេន + ចាត់តាំង» filler rows contradicting «គ្រប់វេនមានបុគ្គលិក»; a no-show shown as «បានបញ្ចប់»; «នឹងលើស 12 ម៉ោង» never fired | Only real people listed; «មិនបានបើកវេន» / «បានបិទវេន» / «យឺត 12 នាទី»; projected hours |
| Login schedule | Active shift header wrapped into 4 lines | One line, «ឥឡូវនេះ» |
| Open-shift | `capFor()` guard never fired, so a short shift under 2 h could open | Uses `partialAllowed` |
| Terminal | Next shift showed the template end instead of the short shift's end | Shows `from`–`until` |
| Content `<aside>` | Global sidebar CSS painted side panels dark (create-movement, view-stock-in, open-shift) | Side panels use `<div>` |

Still open: the sidebar became collapsible in `be4f02c`, which CLAUDE.md forbids («The sidebar is never collapsible»).

**Follow-up (D-S6, same day): registers are no longer planned.** The roster says who works when (up to one person
per register); each cashier picks a free register at open-shift, and the manager can optionally pin someone.
This removes the cause of §2.4 (two people planned on one register). One open drawer per register and per person is
enforced in `openShiftRecord()`, and generated demo history never puts two drawers on one register at once.

## 1. The goal in one sentence

A manager should fix a gap in the roster with **one tap on the gap and one tap on the suggested person**, see the
consequences (hours, day off, the hole it leaves elsewhere) **before** confirming, and be able to undo it.

Benchmarks for "good": the manager never has to remember who is free, never creates a new gap by accident, and never
has to type a time in `HH:MM`.

---

## 2. What the manager does today

### 2.1 Adding a person to a shift (roster)

`addTo()` in [roster.html:192](../../src/manager/roster/roster.html#L192):

1. Tap «បន្ថែម» in a cell.
2. Dialog 1: a flat list of every staff member not already in the cell. The only hint per person is «ទំនេរ»,
   «ផ្លាស់ពី…» or «ថ្ងៃឈប់សម្រាក · ធ្វើការបន្ថែម».
3. Dialog 2 (only if more than one register is free): pick a register.
4. Saved immediately. Toast.

### 2.2 Problems found

| # | Problem | Where | Effect on the manager |
|---|---|---|---|
| P1 | **Moving a person silently empties their other shift.** `assignShift()` removes them from every other template that day, with no warning beyond the small «ផ្លាស់ពី…» line | [data.js:1853](../../src/shared/scripts/data.js#L1853) | Fixing one gap creates another, which they only notice later as an amber cell (or not at all) |
| P2 | **No hours shown at decision time.** Weekly hours and the 48 h flag live in the cards above the grid, not in the picker. Back-to-back shifts (night 22:00–06:00 then morning 06:00) are not flagged | roster.html:192–221 | Labour-law breaches are planned without noticing; spec §11 then blocks the cashier at open-shift, on the day |
| P3 | **No suggestion.** The list is in staff order, not ranked by who is the best fit | roster.html:203 | The manager does the mental work every time |
| P4 | **All registers taken = dead end.** A toast says no, and there is no "replace" | [roster.html:199](../../src/manager/roster/roster.html#L199) | They have to ✕ someone, then add, in two steps |
| P5 | **✕ removes instantly, with no undo and no audit.** `removeAt()` writes the roster and nothing else; roster changes never call `logPosEvent()` | [roster.html:223](../../src/manager/roster/roster.html#L223) | A misclick loses an entry; the owner's audit log can't show who changed the roster |
| P6 | **✕ is allowed on a running shift with an open drawer.** Only past shifts hide the button | roster.html:160 | The roster says "nobody", while a drawer is open on that register |
| P7 | **No reason is kept for a cover** (sick, swap, busy day) | roster entry shape | Later nobody knows why the plan changed |
| P8 | **One day at a time.** A cashier on leave for 5 days = 5 × (remove + add + register) | — | 15+ taps for a common case |
| P9 | **Default-shift editor is 3 dialogs + PIN in sequence**, with no summary and no preview of the weekly hours it produces | [roster.html:117](../../src/manager/roster/roster.html#L117) | Easy to lose the thread; one cancel throws everything away |
| P10 | **Phones get a 1000 px table** that scrolls sideways | [roster.html:47](../../src/manager/roster/roster.html#L47) | A shift supervisor on the shop floor can't use it |
| P11 | **«លំនាំដើម» under every untouched cell** is noise; the useful signal (a changed cell) is the exception | [roster.html:170](../../src/manager/roster/roster.html#L170) | The grid looks busier than it is |

### 2.3 Adding a shift template (settings)

`addTemplate()` in [settings-page.js:396](../../src/shared/scripts/settings-page.js#L396) and `renderShifts()` at
line 208.

| # | Problem | Where | Effect |
|---|---|---|---|
| P12 | **«បន្ថែមវេន» always adds «វេនយប់» 21:00–05:00**, whatever exists. With the default three templates it duplicates the name and overlaps two shifts | settings-page.js:398 | The first thing the owner must do is fix what the button just did |
| P13 | **Template codes are reused.** Delete B, add a new one → it gets code B, and every saved roster entry `date\|B` reattaches to the new template | settings-page.js:397 | Old covers appear in a shift they were never meant for (data bug) |
| P14 | **Times are free-text `HH:MM`**, validated on blur. `7:00`, `7`, `730` are all rejected | settings-page.js:215–216 | Typing on a phone keypad is slow and error-prone |
| P15 | **Overlaps and gaps are only visible in the colour bar**, never stated. «ហាងបើក N ម៉ោង» adds the template lengths, so overlaps are counted twice | settings-page.js:221 | "Open 26 hours a day" when two shifts overlap |
| P16 | **At 4 templates the button just disappears**, with no reason | settings-page.js:228 | Looks like a bug |
| P17 | **After saving a new template, nobody is on it.** Every day of the week shows an amber gap, and the only link is a small text link | settings-page.js:229 | The task feels finished but the roster is broken |
| P18 | **Deleting or retiming a template in use** only mentions default shifts. Future custom roster entries and a drawer shift open on it right now are not mentioned | settings-page.js:402 | Silent orphaned data, or a running shift whose window changes under it |
| P19 | **Spec and code disagree on who owns templates.** Spec §11 says the manager; `SECTIONS` marks `shifts` as `admin: true` (owner only, manager read-only) | settings-page.js:17 | Needs a decision (D-S1 below) |

### 2.4 Reported case: two cashiers on the afternoon, only one register opens

**Reported 2026-10-05.** The login page showed this for Monday:

| Shift | Roster | Registers |
|---|---|---|
| វេនព្រឹក 06:00–14:00 (now) | «មិនមានអ្នកចាត់តាំង» | POS-01 **open**, ចន្ទ មករា since 05:53 |
| វេនរសៀល 14:00–22:00 | ចន្ទ មករា «ជំនួស» POS-01 · ម៉ៅ ស្រីនាង «ជំនួស» POS-02 | — |
| វេនយប់ 22:00–06:00 | លី សុភា POS-03 | — |

At 14:00 only ម៉ៅ ស្រីនាង could open a register. Reproduced in headless Chrome with the clock set to 06:05, then
14:10:

1. 05:53: ចន្ទ មករា (CAS-01) opens the morning shift on POS-01 (their default).
2. Monday is សុខ ដារ៉ា's (CAS-02) day off, so the afternoon is empty. The manager adds ចន្ទ មករា and ម៉ៅ ស្រីនាង to the
   afternoon.
3. `assignShift()` removes ចន្ទ មករា from the morning **without asking** (P1), although their drawer is open on it (P6).
   The morning row now says «មិនមានអ្នកចាត់តាំង» while POS-01 is open.
4. 14:10: ចន្ទ មករា signs in and lands on the **terminal of their still-open morning shift**, because
   `currentShift()` finds it ([open-shift.html:490](../../src/cashier/shift/open-shift.html#L490)). Nothing tells them
   that their afternoon shift is waiting.
5. They close the morning (8.3 h worked) and returns to open-shift. The afternoon is **blocked**: 8.3 h + 8 h > 12 h a
   day ([open-shift.html:282](../../src/cashier/shift/open-shift.html#L282)).
6. ម៉ៅ ស្រីនាង opens POS-02 without a problem.

**Conclusion.** Several cashiers per shift already works: adding a second cashier who is free opens fine (also tested).
The real failure is that **the roster accepts a plan that open-shift will refuse**: 16 h in one day for one person.
The rule is only checked at the till, at 14:00, when nobody can fix the plan any more.

**Root causes and fixes**

| # | Cause | Where | Fix |
|---|---|---|---|
| P20 | The roster doesn't check the **12 h per day** rule. Only open-shift does | roster.html `addTo()` | S17: `rosterCheck()` (§7) runs in the assign dialog. A pick that makes the day > 12 h is **disabled** with «ធ្វើការ 16 ម៉ោងថ្ងៃនេះ · លើស 12 ម៉ោង». Counts the open drawer's real hours, not just the roster |
| P21 | Moving someone **off a shift they are working right now** is allowed and silent | data.js `assignShift()` | S2 + S5: a person with an open drawer on another shift that day can't be moved; the dialog says «កំពុងធ្វើការវេនព្រឹក លើ POS-01» |
| P22 | The login page's schedule shows the roster only, so a live drawer with no roster entry looks like «មិនមានអ្នកចាត់តាំង» | [index.html:442](../../src/index.html#L442) | S18: merge open drawer shifts into each row; a person working without a roster entry shows with «មិនមានក្នុងកាលវិភាគ» in amber |
| P23 | A cashier with an earlier shift still open is sent to the terminal with no hint that their next shift starts | open-shift.html:490 | S19: if their open shift has passed its end and they are rostered on a later one, the terminal shows a banner «វេនរសៀលរបស់អ្នកចាប់ផ្តើមហើយ · បិទវេនព្រឹកសិន» with a button to close-shift |
| P24 | When open-shift blocks on 12 h, it says only «លើស 12 ម៉ោង» and leaves the shift uncovered | open-shift.html:271, 282 | S20: show hours worked and the limit (8.3 + 8 = 16.3 > 12), say «សូមឱ្យអ្នកគ្រប់គ្រងរកអ្នកជំនួស», and raise a manager notification so the gap shows on the dashboard at once |
| P25 | After a past shift, open-shift preselects the **ended** morning shift when the person has no current one | [open-shift.html:497](../../src/cashier/shift/open-shift.html#L497) (`mine[0]` fallback) | S21: fall back to the current template, never one whose state is `past` |

---

## 3. Target experience

### 3.1 Roster: fill a gap in two taps

**Empty cell (amber).** Instead of only «គ្មានអ្នកគិតលុយ · ត្រូវរកអ្នកជំនួស», the cell shows the best candidate:

```
┌──────────────────────────────┐
│ ⚠ គ្មានអ្នកគិតលុយ              │
│ [👤 ចាត់ សុខ វណ្ណា]  ជ្រើសផ្សេង │
│ 40 → 48 ម៉ោង · ទំនេរ           │
└──────────────────────────────┘
```

- «ចាត់ <name>» assigns the top suggestion on their default register (or the first free one). Toast with undo.
- «ជ្រើសផ្សេង» opens the assign dialog (3.2).

**Ranking rule** (`rankCandidates(date, code)` in `manager-data.js`), best first:

| Rank | Condition | Chip |
|---|---|---|
| 1 | Not working that day, not their day off, weekly hours + this shift ≤ 48 | «ទំនេរ» emerald |
| 2 | A manager (cover is their job per spec §11), same conditions | «អ្នកគ្រប់គ្រង» indigo |
| 3 | Day off, still ≤ 48 h | «ថ្ងៃឈប់ · ម៉ោងបន្ថែម» amber |
| 4 | Working another shift that day (moving them leaves a gap) | «ផ្លាស់ពី<វេន> · បង្កើតចន្លោះ» amber |
| — | Would pass 48 h/week, 12 h/day, or work back-to-back with no rest | «លើស 48 ម៉ោង» / «ធ្វើការជាប់គ្នា» rose, **listed but disabled** with the reason |

Ties break on fewest hours this week, so work spreads evenly.

### 3.2 Assign dialog: one screen instead of a chain

Replace the two `showOptionDialog()` calls with one dialog, `showAssignDialog()` in `ui-components.js` (light theme,
same look as the other `pos*` dialogs):

```
បន្ថែមអ្នកគិតលុយ · វេនរសៀល
ព្រហស្បតិ៍ 08/10/2026 · 14:00–22:00
────────────────────────────────────
ណែនាំ
 ◉ 👤 សុខ វណ្ណា      40 → 48 ម៉ោង   [ទំនេរ]
 ○ 👤 ម៉ៅ ស្រីនាង     32 → 40 ម៉ោង   [អ្នកគ្រប់គ្រង]
ផ្សេងទៀត
 ○ 👤 ចន្ទ មករា      48 → 48 ម៉ោង   [ផ្លាស់ពីវេនព្រឹក · បង្កើតចន្លោះ]
 ⊘ 👤 លី សុភា       48 → 56 ម៉ោង   [លើស 48 ម៉ោង]
────────────────────────────────────
បញ្ជរ     [POS-02 ✓] [POS-03]
មូលហេតុ   [ឈប់សម្រាក] [ឈឺ] [ប្តូរវេនគ្នា] [ពេលមមាញឹក] [ផ្សេងៗ]
────────────────────────────────────
⚠ វេនព្រឹក ថ្ងៃនេះនឹងគ្មានអ្នកគិតលុយ        (only when moving someone)
                         [បោះបង់] [ចាត់តាំង]
```

- The best candidate is **preselected**; the register defaults to their default register if free. Most of the time
  the manager just presses «ចាត់តាំង».
- Hours show **before → after** this assignment, so the 48 h rule is visible, not remembered.
- Moving someone shows the hole it leaves **as a warning line above the button** (fixes P1), never silently.
- **All registers taken** (P4): the register row shows the occupied registers too, labelled with the current person;
  picking one turns the button into «ជំនួស <name>» and the warning line says who is taken off.
- Reason chips are optional, one tap, stored as `reason` on the roster entry and shown in the cell's sub-line
  (P7). Seed list goes into `posSettings().reasons.cover` so it is editable like the other reason lists.
- No PIN: the manager is already signed in, and every change is logged (3.4). Keyboard: ↑ ↓ to move, Enter to
  confirm, Esc to cancel.

### 3.3 Remove with undo, never on a live drawer

- ✕ removes immediately and shows a toast «បានដក <name> ចេញពីវេន» with a **«មិនធ្វើវិញ»** button for 6 s
  (P5). `showToast()` gets an optional `{ action: { label, onClick } }`; the toast container already exists.
- If that person has an **open drawer shift** on that register (P6), ✕ is replaced by a lock icon; tapping it says
  «<name> កំពុងបើកថតប្រាក់ · ត្រូវបិទវេនសិន» and links to `view-shift.html`.
- After a removal leaves the cell empty, the cell immediately shows the suggestion from 3.1, so the next step is one
  tap away.

### 3.4 Audit every roster change

`assignShift()` and `saveRoster()` callers log through `logPosEvent()`:

| Event | Detail |
|---|---|
| `roster_assign` | date, template, person, register, reason, moved-from template if any, replaced person if any |
| `roster_remove` | date, template, person, register |
| `roster_undo` | the event it reverted |
| `roster_default` | person, before → after (template, register, day off) |

The owner's audit page (`auditTrail()` in `admin-data.js`) lists them under a «កាលវិភាគ» filter.

### 3.5 Leave and multi-day changes

A ⋮ menu on each staff card above the grid:

- «កត់ត្រាការឈប់សម្រាក»: a `showFormDialog()` with a from/to date range and a reason. It removes the person from
  those dates, then lists the gaps it created with a suggested cover for each (3.1 ranking) and one
  «ចាត់តាំងទាំងអស់» button. Each suggestion can be changed or skipped before confirming (P8).
- «ប្តូរវេនជាមួយ…»: pick a colleague and a date; the two swap shift and register for that day in one step.

A bar above the grid sums the week: «សប្តាហ៍នេះខ្វះ 3 វេន» with «បំពេញដោយស្វ័យប្រវត្តិ», which opens the same
review list as the leave flow. Nothing is saved until the manager confirms the list.

### 3.6 Default shift: one form, live preview

Replace the three chained dialogs (P9) with one dialog that shows all three fields at once:

```
វេនប្រចាំ · ចន្ទ មករា
វេន       [វេនព្រឹក 06:00–14:00 ✓] [វេនរសៀល] [វេនយប់] [គ្មាន]
បញ្ជរ     [POS-01 ✓] [POS-02] [POS-03]
ថ្ងៃឈប់    [អា ✓] [ច] [អ] [ពុ] [ព្រ] [សុ] [ស]
──────────────────────────────
48 ម៉ោង / សប្តាហ៍ · ម៉ោងយប់ 0 ម៉ោង
⚠ POS-01 វេនព្រឹក ជាវេនប្រចាំរបស់ ម៉ៅ ស្រីនាង រួចហើយ   (when it clashes)
ការផ្លាស់ប្តូរតាមថ្ងៃដែលបានកែរួច 2 ថ្ងៃ មិនប៉ះពាល់
                          [បោះបង់] [រក្សាទុក]
```

- Chips, not lists; current values preselected; the manager changes only what's different.
- The preview line updates live (weekly hours, night hours from `nightHours()`).
- The PIN stays, because this is a standing rule, not a one-day change. It is asked once, after «រក្សាទុក».

### 3.7 Phones: day view

Below `md`, replace the 7-column table (P10) with:

- a row of 7 day pills (today highlighted, an amber dot on days with a gap);
- one card per template for the selected day, each listing its people and the 3.1 suggestion when empty.

Same functions, same dialogs; only the layout changes. Desktop keeps the week grid.

### 3.8 Calmer grid

- Drop «លំនាំដើម» from untouched cells (P11). Mark **changed** cells instead with a small indigo dot and «បានកែ»,
  and give them a ⋮ item «ត្រឡប់ទៅលំនាំដើម» (deletes the custom key).
- Desktop only, later (S11): drag a person chip to another cell to move them, with the same warnings as 3.2 shown
  before the drop is saved.

---

## 4. Target experience: adding a shift template

### 4.1 «បន្ថែមវេន» proposes something that fits

`addTemplate()` (P12) picks the **largest uncovered gap** in the 24-hour bar:

- gap found → the new template fills it, capped at 8 h;
- no gap → it starts at the end of the last template, 8 h long, and the overlap warning (4.3) appears at once.

The name comes from the start time, and gets a number if taken:

| Start | Name |
|---|---|
| 05:00–10:59 | វេនព្រឹក |
| 11:00–16:59 | វេនរសៀល |
| 17:00–21:59 | វេនល្ងាច |
| 22:00–04:59 | វេនយប់ |

The new row scrolls into view with its name field focused.

### 4.2 Times without typing

Replace the free-text inputs (P14) with a time control per field:

```
ចាប់ផ្តើម  [−]  06:00  [+]
```

- − / + step 30 minutes and wrap past midnight.
- Tapping the time still allows typing; on blur it normalises `7` → `07:00`, `730` → `07:30`, `19.5` → `19:30`.
- A row of presets above the list for a fresh setup:
  «ហាងបើក 24 ម៉ោង · 3 វេន», «ហាងបើក 06:00–22:00 · 2 វេន», «ហាងបើក 07:00–21:00 · 2 វេន».
  Choosing one asks `showCustomConfirm()` before replacing the list.

### 4.3 Say what the bar shows

Under the 24-hour bar, plain sentences (P15):

- «ចន្លោះ 22:00–06:00 គ្មានវេន» (amber), one line per gap;
- «វេនព្រឹក និងវេនរសៀល ជាន់គ្នា 1 ម៉ោង» (amber; allowed for handover, but stated);
- «ហាងបើក N ម៉ោងក្នុងមួយថ្ងៃ», computed as the **union** of the windows, not the sum.

### 4.4 Limits are explained, not hidden

At 4 templates the button stays, disabled, with «អតិបរមា 4 វេនក្នុងមួយថ្ងៃ» next to it (P16).

### 4.5 Saving leads to the next step

After a save that **added** a template or **changed its times** (P17), the success toast is followed by a card at the
top of the section:

> វេនល្ងាច មិនទាន់មានអ្នកគិតលុយ 7 ថ្ងៃខាងមុខ · [ចាត់តាំងឥឡូវ]

«ចាត់តាំងឥឡូវ» opens `../roster/roster.html?template=<code>`, which scrolls to and highlights that row and runs the
«បំពេញដោយស្វ័យប្រវត្តិ» review (3.5) for it.

### 4.6 Safe delete and retime

- Codes are **never reused** (P13): new templates get the next unused code from a counter stored in settings
  (`shiftCodeSeq`), not the first free letter. Old roster keys for a deleted code stay inert.
- Delete confirmation lists everything it touches (P18): default shifts that become «គ្មានវេនប្រចាំ», future dates with
  custom roster entries, and **blocks** the delete while a drawer shift is open on that template.
- Changing the times of a template that has an open drawer shift today shows «ការផ្លាស់ប្តូរនេះចាប់ផ្តើមពីវេនបន្ទាប់»;
  the running shift keeps the window it opened with (stored on the drawer shift already: `start` / `end`).

---

## 5. Handover and long days: the manager's and the cashier's view

§2.4 showed the gap: the plan and the till disagree, and the person at the till finds out last. This section designs
the whole day, for both roles, so that a long day or a register handover never ends with a cashier stuck on a
"no".

### 5.1 Principles

1. **Catch it when planning, not at the till.** The 12 h/day rule (and 48 h/week) is checked in the roster, with the
   hours already worked on an open drawer counted.
2. **Every "no" comes with a next step.** A blocked cashier gets a way forward (a shorter shift, or the manager is
   alerted); a blocked manager gets alternatives (a partial cover, or another person).
3. **Each role sees only what it needs.** The manager sees everyone's hours. The cashier sees their own day, plus the
   names and registers of their crew (already shown today), never other people's hours.
4. **One drawer, one person, one shift.** A double shift is still two drawer shifts with two counts. The UX makes the
   step between them one guided flow, not a restart.

### 5.2 Manager, when planning: show the person's day, offer a partial cover

In the assign dialog (3.2), each candidate row expands to a **day bar** when selected:

```
ចន្ទ មករា
ថ្ងៃនេះ  ▓▓▓▓▓▓▓▓▒▒▒▒░░░░░░   8.3 / 12 ម៉ោង
        កំពុងធ្វើការវេនព្រឹក · POS-01 · បើកពី 05:53
⊘ វេនរសៀលពេញ 8 ម៉ោង នឹងលើស 12 ម៉ោង (16.3)
   [ជំនួសត្រឹម 14:00–17:40]
```

- ▓ worked (from the open or closed drawer shifts), ▒ already rostered, ░ free up to 12 h.
- When the full shift breaks the 12 h rule but some hours are left, the row offers **«ជំនួសត្រឹម <start>–<cap>»**: a
  **partial cover** that ends when the person reaches 12 h. It is rounded down to 10 minutes, and offered only if at
  least 2 hours are left (D-S5).
- After a partial cover, the cell shows the person with «ដល់ 17:40» and an amber line
  **«ខ្វះ 17:40–22:00»** with the next suggested person (3.1) for the rest of the shift. That person's entry gets
  `from: '17:40'`.
- A person who is **working a shift right now** can be added to a later shift (that's a double shift), but is never
  *moved* off the current one (P21).

### 5.3 Manager, during the day: a live coverage board

The manager dashboard gets a «វេនថ្ងៃនេះ» card: one row per template, one line per register, with the **plan next to
reality**:

```
វេនព្រឹក 06:00–14:00                                ឥឡូវនេះ
  POS-01  ចន្ទ មករា        ● កំពុងធ្វើការ · 8 ម៉ោង 15 នាទី
វេនរសៀល 14:00–22:00                              ក្នុង 25 នាទី
  POS-01  ចន្ទ មករា        ⚠ នឹងលើស 12 ម៉ោង   [រកអ្នកជំនួស]
  POS-02  ម៉ៅ ស្រីនាង      ○ ប្រាក់បាតថតត្រៀមរួច
```

Chip per line, in this order of severity:

| State | Chip | Colour |
|---|---|---|
| Rostered, would pass 12 h (open drawer + this shift) | «នឹងលើស 12 ម៉ោង» + «រកអ្នកជំនួស» | rose |
| Slot in the current or next shift has nobody | «ខ្វះអ្នក» + «ចាត់តាំង» | rose |
| Shift started > 10 min ago, drawer not opened | «យឺត 12 នាទី» | amber |
| Drawer open without a roster entry | «មិនមានក្នុងកាលវិភាគ» | amber |
| Drawer open | «កំពុងធ្វើការ · <duration>» | emerald |
| Before start, float issued | «ប្រាក់បាតថតត្រៀមរួច» | slate |
| Before start, no float issued | «មិនទាន់ចេញប្រាក់បាតថត» + «ចេញ» | slate |

Each action button opens the assign dialog (or create-movement for the float) **prefilled for that slot**. The same
chips feed the sidebar badge, so a rose state is visible from any manager page.

**Handover card.** From 30 minutes before a shift change, a card sits at the top of the dashboard:

```
ប្តូរវេនម៉ោង 14:00 · នៅសល់ 25 នាទី
បិទ   ចន្ទ មករា · POS-01 · ការលក់ព្យួរ 1 · ប្រាក់ទម្លាក់មិនទាន់ទទួល 0
បើក   ម៉ៅ ស្រីនាង · POS-02 · ប្រាក់បាតថតត្រៀមរួច
⚠ ចន្ទ មករា មិនអាចបន្តវេនរសៀលបានពេញម៉ោង     [រកអ្នកជំនួស]
```

It lists only what can block the change (held sales, unconfirmed drops, no float, rule breaches), so the manager can fix
them before 14:00 and not at 14:00.

### 5.4 Manager, when a cashier is blocked anyway

If a cashier still hits a block at open-shift (5.8), the till logs a `shift_blocked` event. Manager pages show:

- a notification «ចន្ទ មករា មិនអាចបើកវេនរសៀល · លើស 12 ម៉ោង · POS-01 ទំនេរ», with «រកអ្នកជំនួស» opening the
  assign dialog for that slot;
- the slot on the coverage board turns rose «ខ្វះអ្នក».

### 5.5 Cashier, at sign-in: «វេនរបស់ខ្ញុំថ្ងៃនេះ»

When a cashier signs in **with a drawer shift still open whose end time has passed**, and they are rostered on a later
shift today, they don't land silently on the old terminal (P23). The terminal opens with a panel first:

```
វេនរបស់អ្នកថ្ងៃនេះ
✓ វេនព្រឹក  06:00–14:00 · POS-01   កំពុងបើក · ហួសម៉ោង 10 នាទី
→ វេនរសៀល  14:00–17:40 · POS-01   ចាប់ផ្តើមហើយ
ថ្ងៃនេះធ្វើការបាន 8.3 ម៉ោង · អតិបរមា 12 ម៉ោង

      [បិទវេនព្រឹក ហើយបន្តវេនរសៀល]
      បន្តលក់លើវេនព្រឹកសិន
```

- The primary button goes to close-shift with `?next=B`, which carries the next step through the close (5.7).
- The secondary link closes the panel; the shift chip stays amber «ហួសម៉ោងវេន», as today.
- With no later shift, the panel isn't shown; the existing overrun chip and notification are enough.

### 5.6 Cashier, before the end of the shift

The terminal already turns the shift chip amber after the end time and adds a notification 15 minutes before. Add:

- **From 30 minutes before the end**, the chip names what comes next:
  - same person, next shift: «បិទម៉ោង 14:00 · បន្តវេនរសៀល»;
  - someone else on this register: «បិទម៉ោង 14:00 · បន្ទាប់៖ ម៉ៅ ស្រីនាង»;
  - nobody next: «បិទម៉ោង 14:00».
- **From 15 minutes before**, a slim bar above the cart lists what would block the close, with a button for each:
  «ការលក់ព្យួរ 1 · [មើល]», «ប្រាក់ទម្លាក់មិនទាន់ទទួល · [ប្រាប់អ្នកគ្រប់គ្រង]». The cashier sorts these out while
  it's quiet, not after the next cashier is already waiting.
- On the last sale before the end, nothing interrupts: a sale in progress is never blocked by the clock.

### 5.7 Cashier, double shift: close and open as one flow

Close-shift already ends on «បើកវេនថ្មី» ([close-shift.html:161](../../src/cashier/shift/close-shift.html#L161)).
When the cashier is rostered on the next shift (or arrived with `?next=`), that end screen changes to:

```
✓ បានបិទវេនព្រឹក · SHIFT-…-A
បន្ទាប់៖ វេនរសៀល 14:00–17:40 · POS-01
[បើកវេនរសៀល]            បោះពុម្ពរបាយការណ៍ Z
```

«បើកវេនរសៀល» opens open-shift with the template **preselected** and the overview step already confirmed, so the
cashier goes straight to counting the new float. The count and the manager PIN stay: a new drawer shift always starts
from a counted float.

### 5.8 Cashier, when the 12 h rule blocks: a way forward, not a toast

Replace the red toast and one-line note (P24) with a card in the overview step:

```
⊘ មិនអាចបើកវេនរសៀលពេញម៉ោងបានទេ
ថ្ងៃនេះអ្នកធ្វើការរួច 8.3 ម៉ោង · ច្បាប់អនុញ្ញាតអតិបរមា 12 ម៉ោង
▓▓▓▓▓▓▓▓░░░░   អាចធ្វើបានទៀត 3 ម៉ោង 40 នាទី

[បើកវេនខ្លី ដល់ម៉ោង 17:40]
[ជូនដំណឹងអ្នកគ្រប់គ្រង]          ចាកចេញ
```

- **«បើកវេនខ្លី»** (if ≥ 2 h left, D-S5) opens a normal drawer shift whose `end` is the cap instead of the template
  end. The manager PIN that open-shift already needs also approves the short end, and the override dialog shows it
  as a line («បញ្ចប់ 17:40 · វេនខ្លី»). Everything downstream already reads `shift.end`: the terminal chip,
  the 15-minute warning and the overrun colours work without change. The roster entry gets `until`, so the manager
  sees «ខ្វះ 17:40–22:00» at once (5.2, 5.3).
- **«ជូនដំណឹងអ្នកគ្រប់គ្រង»** logs `shift_blocked` (5.4) and confirms «បានជូនដំណឹង ម៉ៅ ស្រីនាង» (the manager on
  duty, if rostered).
- If less than 2 h is left, only the second button shows.

### 5.9 Cashier, register still in use (handover on one register)

When the next cashier's register still has the previous cashier's drawer open, `regBusy()` today shows a red toast.
Instead, the overview step shows:

```
POS-01 នៅបើកដោយ ចន្ទ មករា (វេនព្រឹក)
រង់ចាំឱ្យបិទវេន · ទំព័រនេះនឹងបន្តដោយស្វ័យប្រវត្តិ
                         ឬ  [ប្រើបញ្ជរទំនេរ POS-03]
```

- The page listens to `onStoreChanged`; when that shift closes, the card disappears and «រាប់ប្រាក់បាតថត» is enabled.
- «ប្រើបញ្ជរទំនេរ» lists free registers. It is recorded as a cover on that register, with the same manager PIN as
  the open.

### 5.10 The reported day, replayed with this design

| Time | Who | What they see |
|---|---|---|
| 09:00 | Manager | Adds ចន្ទ មករា to the afternoon. The dialog shows 8.3 / 12 h and offers «ជំនួសត្រឹម 14:00–17:40»; the manager takes it. The cell shows «ខ្វះ 17:40–22:00» with a suggestion, and the manager adds ម៉ៅ ស្រីនាង on POS-02 for the full shift and សុខ វណ្ណា on POS-01 from 17:40 |
| 13:30 | Manager | Handover card: one held sale on POS-01, POS-02 float ready |
| 13:30 | ចន្ទ មករា | Chip: «បិទម៉ោង 14:00 · បន្តវេនរសៀល»; at 13:45 the bar points to the held sale |
| 14:02 | ចន្ទ មករា | Closes the morning; the end screen offers «បើកវេនរសៀល»; counts the float; the manager PIN approves a shift ending at 17:40 |
| 14:05 | ម៉ៅ ស្រីនាង | Opens POS-02 as today |
| 17:40 | ចន្ទ មករា → សុខ វណ្ណា | Handover on POS-01: សុខ វណ្ណា's open-shift waits until ចន្ទ មករា closes, then continues |

Both registers are open all afternoon, nobody passes 12 h, and nobody hits a dead end.

---

## 6. Backlog

| ID | Item | Fixes | Priority | Size |
|---|---|---|---|---|
| S1 | Template codes never reused (`shiftCodeSeq`) | P13 | **P0 (data bug)** | S |
| S2 | Block ✕ on a register with an open drawer | P6 | **P0** | S |
| S3 | Roster events in `logPosEvent()` + audit filter | P5 | P1 | S |
| S4 | `rankCandidates()` + suggestion in empty cells | P2, P3 | P1 | M |
| S5 | `showAssignDialog()`: ranked list, hours before → after, register, move warning, replace, reason | P1, P2, P4, P7 | P1 | M |
| S6 | Toast undo action; ✕ with undo | P5 | P1 | S |
| S7 | Smart «បន្ថែមវេន» default + name by time | P12 | P1 | S |
| S8 | Time stepper + input normalising + gap / overlap sentences + union hours | P14, P15 | P1 | M |
| S9 | One-form default-shift dialog with live preview | P9 | P2 | M |
| S10 | Post-save «ចាត់តាំងឥឡូវ» card + `?template=` on roster | P17 | P2 | S |
| S11 | Leave range, swap, «បំពេញដោយស្វ័យប្រវត្តិ» review list | P8 | P2 | L |
| S12 | Phone day view | P10 | P2 | M |
| S13 | Changed-cell marker, «ត្រឡប់ទៅលំនាំដើម», drop «លំនាំដើម» | P11 | P3 | S |
| S14 | Delete / retime impact list; disabled button at 4 | P16, P18 | P3 | S |
| S15 | Templates presets | P14 | P3 | S |
| S16 | Drag and drop on desktop | — | P3 | M |
| S17 | 12 h/day check (incl. hours already worked on an open drawer) in the roster | P20 | **P0 (reported)** | S |
| S18 | Login-page schedule merges live drawers | P22 | P1 | S |
| S19 | Terminal banner: next rostered shift has started, close this one | P23 | P1 | S |
| S20 | Clear 12 h block message on open-shift + manager notification | P24 | P1 | S |
| S21 | Open-shift never preselects an ended shift | P25 | P2 | S |
| S22 | Day bar + partial cover «ជំនួសត្រឹម» in the assign dialog; «ខ្វះ <from>–<to>» cells (5.2) | P20 | P1 | M |
| S23 | Dashboard coverage board with plan vs live chips (5.3) | P22 | P1 | M |
| S24 | Dashboard handover card, 30 min before a change (5.3) | — | P2 | S |
| S25 | `shift_blocked` event + manager notification (5.4) | P24 | P1 | S |
| S26 | Terminal «វេនរបស់ខ្ញុំថ្ងៃនេះ» panel (5.5, replaces S19) | P23 | P1 | S |
| S27 | Terminal "what's next" chip and pre-close blocker bar (5.6) | — | P2 | S |
| S28 | Close-shift → «បើកវេន<next>» with template preselected (5.7) | — | P1 | S |
| S29 | Open-shift 12 h card with «បើកវេនខ្លី» and notify (5.8, replaces S20) | P24 | P1 | M |
| S30 | Open-shift waits for a busy register, or switches to a free one (5.9) | — | P2 | S |

Suggested order: **S17, S2 and S21 first** (they fix the reported case), then S29 + S22 (the short shift / partial cover pair), S26 + S28 (the cashier's double-shift flow) and S25, then S1, S3, then S4–S6 together (they share the ranking and are the core of "easy"), then
S7–S8, then the rest.

---

## 7. Data changes

| Where | Change |
|---|---|
| Roster entry (`pos_roster[date\|code][]`) | add optional `reason`, `by`, `at`. Existing entries stay valid |
| `posSettings()` | add `reasons.cover` (seed: ឈប់សម្រាក, ឈឺ, ប្តូរវេនគ្នា, ពេលមមាញឹក, ផ្សេងៗ) and `shiftCodeSeq` |
| `data.js` | `assignShift()` returns `{ movedFrom, replaced }` so callers can log and undo; new `unassignShift()` that logs |
| `manager-data.js` | `rankCandidates(date, code)`, `weekGaps(weekStart)`, `rosterCheck(personId, date, code)` returning the 48 h / 12 h / back-to-back verdict. Reuse it in open-shift so the rule lives in one place |
| `ui-components.js` | `showAssignDialog()`, toast `action` option |
| Roster entry, partial cover | optional `from` / `until` (`HH:MM`) inside the template window. Absent = the full template |
| Drawer shift (`pos_shifts`) | `end` may be earlier than the template end; add `short: true` and `plannedEnd` (the template end) so reports can tell a short shift from a template change |
| `pos_events` | `shift_blocked` `{ cashierId, templateCode, workedHours, capAt }`, `shift_short` `{ shiftId, end, approverId }` |
| `data.js` | `hoursWorkedToday(personId)` (from drawer shifts, open ones up to now) and `capFor(personId)` = latest end time that keeps the day ≤ 12 h. Only the cashier's **own** hours, so this is safe in `data.js`; the manager's view of other people's hours stays in `manager-data.js` |
| Reset demo data | nothing new: everything stays under existing `pos_*` keys |

The cashier role gains nothing: `rankCandidates()` reads weekly hours of other staff, so it belongs in
`manager-data.js`, never `data.js` (keeps the shift lock real; see CLAUDE.md).

---

## 8. Decisions needed

| ID | Question | Recommendation |
|---|---|---|
| D-S1 | Who edits shift templates: manager (spec §11) or owner only (current code)? | **Owner** edits, manager reads, as the code does now; templates drive pay (night hours, overtime). Update spec §11 to match |
| D-S2 | Is going over 48 h/week a hard block in the roster, or a warning? | **Hard block** in the dialog with the reason shown, matching open-shift. Overtime by agreement can come later as an owner setting |
| D-S3 | Minimum rest between two shifts for one person | **11 h**, flagged as «ធ្វើការជាប់គ្នា»; confirm against the research doc before building |
| D-S4 | Does a one-day roster change need a PIN? | **No**, logged instead (3.4). The default-shift change keeps its PIN |
| D-S5 | Allow short shifts and partial covers? Minimum length? | **Yes, at least 2 h**, approved by the same manager PIN as the open. Shorter leftovers go to the manager instead |
| D-S6 | Plan registers in the roster, or let the cashier choose? | **Decided 2026-10-05: cashier chooses** a free register at open-shift; optional manager pin |

---

## 9. Acceptance checks

Verify in a browser (serve `src/` over HTTP) at 1440×900 and 390×844, signed in as សុខ វណ្ណា (246810) for the roster
and ហេង ចាន់ថា (9999) for templates.

- [ ] Reported case (§2.4): with ចន្ទ មករា's morning drawer open, the roster won't let them be added to the afternoon,
      and says why. A second, free cashier added to the afternoon can open their register at 14:00.
- [ ] Same case with this design (§5.10): the manager is offered «ជំនួសត្រឹម 14:00–17:40»; the rest shows as «ខ្វះ
      17:40–22:00» with a suggestion.
- [ ] A cashier signing in after their shift's end, with a later shift rostered, sees «វេនរបស់អ្នកថ្ងៃនេះ» and can
      close and open the next shift without going back to the login page.
- [ ] Blocked by 12 h with 3 h 40 left, open-shift offers «បើកវេនខ្លី ដល់ម៉ោង 17:40»; the terminal then warns at 17:25
      and turns amber after 17:40.
- [ ] «ជូនដំណឹងអ្នកគ្រប់គ្រង» makes the slot rose on the manager dashboard.
- [ ] A cashier whose register is still open by someone else sees who and waits; the page continues by itself when
      that shift closes.
- [ ] Cashier pages never show another person's hours.
- [ ] On a cashier's day off, the empty cell shows a suggested person; one tap fills it and the toast offers undo.
- [ ] Picking someone who works another shift that day shows «… នឹងគ្មានអ្នកគិតលុយ» before confirming.
- [ ] A person at 48 h is listed but cannot be picked, and the reason is shown.
- [ ] With every register taken, the dialog offers «ជំនួស <name>» instead of a dead-end toast.
- [ ] ✕ on a cashier with an open drawer is blocked with a link to the shift.
- [ ] Every add / remove / undo appears in the owner's audit log.
- [ ] «បន្ថែមវេន» never duplicates a name. On a 2-template 06:00–22:00 setup it proposes «វេនយប់» 22:00–06:00; on
      the default three (no gap) the new row shows the overlap warning at once.
- [ ] Delete template B, add a new one: no old covers appear on it.
- [ ] Typing `7` in a time field becomes `07:00`; − / + step 30 minutes across midnight.
- [ ] «ហាងបើក N ម៉ោង» never exceeds 24.
- [ ] On a phone, the roster is usable without sideways scrolling.
- [ ] All new text is Khmer, Arabic numerals, no native `<select>` / `alert()` / tooltips (CLAUDE.md rules).
