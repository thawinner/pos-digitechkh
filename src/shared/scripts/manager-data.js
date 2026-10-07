/* អ្នកគ្រប់គ្រង — ទិន្នន័យប្រវត្តិ និងការគណនា (ឯកសាររចនាលេខ 02 ផ្នែក 7)

   ផ្ទុកតែលើទំព័រ manager/* ប៉ុណ្ណោះ (បន្ទាប់ពី data.js) ដូច្នេះទំព័រអ្នកគិតលុយមិនដែលទទួលបាន
   ទិន្នន័យវេនផ្សេងឡើយ — ការចាក់សោរត្រឹមវេនពិតប្រាកដ មិនមែនត្រឹមលាក់លើអេក្រង់។

   ប្រភពទិន្នន័យពីរ៖
   • ប្រវត្តិដែលបង្កើតដោយកូដ (14 ថ្ងៃ × 3 បញ្ជរ × គំរូវេន) — ថេរ ព្រោះគ្រាប់ពូជផ្អែកលើកាលបរិច្ឆេទ
     ហើយការសម្រេចរបស់អ្នកគ្រប់គ្រងលើកំណត់ត្រាទាំងនេះរក្សាទុកជា «ស្រទាប់កែប្រែ» (pos_overlay)
   • ទិន្នន័យរស់ពី localStorage (វេន POS-01 ដែលអ្នកគិតលុយកំពុងប្រើ សំណើ ចលនាសាច់ប្រាក់)
   គ្មានថ្លៃដើម ឬប្រាក់ចំណេញនៅទីនេះទេ (ច្បាប់ M-RULE 2)។ */

const HISTORY_DAYS = 14;
const SAFE_START = { usd: 1500, khr: 6000000 };
const OVERLAY_KEY = 'pos_overlay';
const MGR_SEED_KEY = 'pos_mgr_seed_v2';

function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}

/* ថ្ងៃប្រតិបត្តិការ — មុនវេនដំបូងនៅព្រឹក ចាត់ទុកថាជាថ្ងៃមុន */
function businessDate() {
    const now = new Date();
    const first = shiftTemplates().map(t => minutesOf(t.start)).sort((a, b) => a - b)[0] || 0;
    const m = now.getHours() * 60 + now.getMinutes();
    return isoDate(m < first ? addDays(now, -1) : now);
}

/* ===== ការបង្កើតប្រវត្តិ =====
   ធ្វើត្រាប់តាមហាងលក់រាយតូចមួយនៅភ្នំពេញ៖ មនុស្សច្រើនពេលព្រឹក ថ្ងៃត្រង់ និងល្ងាច ស្ងាត់ពេលយប់ជ្រៅ
   កន្ត្រកភាគច្រើនមាន 1 ទៅ 2 មុខ ទំនិញលក់ដាច់ (ទឹក កាហ្វេ នំ) លក់ច្រើនជាងគ្រឿងអគ្គិសនីឆ្ងាយ */

/* អត្រាប្តូរប្រាក់ប្រចាំថ្ងៃ៖ ថ្ងៃនេះ = តម្លៃក្នុងការកំណត់ ថ្ងៃមុនៗប្រែប្រួលតិចៗ (ជំហាន 5 រៀល) */
function fxForDate(dateStr) {
    const base = Number(posSettings().fxRate) || 4100;
    if (dateStr >= businessDate()) return base;
    const r = rngFor(`fx|${dateStr}`)();
    return base + Math.round((r - 0.5) * 6) * 5;
}

function genShift(dateStr, register, tpl, cashierId, ctx) {
    const rng = rngFor(`${dateStr}|${register}|${tpl.code}`);
    const id = `SHIFT-${dateStr.replace(/-/g, '')}-${register.replace('-', '')}-${tpl.code}`;
    const start = dateAt(dateStr, tpl.start);
    let end = dateAt(dateStr, tpl.end);
    if (end <= start) end = addDays(end, 1);
    // អ្នកដែលមានករណីមិនប្រក្រតីញឹកជាងគេ (ម្នាក់ក្នុងមួយសាខា ឬហាង)
    const risky = ['CAS-03', 'CAS-09', 'CAS-12', 'CAS-15'].includes(cashierId);
    const managers = MANAGERS.map(m => m.id);
    const st = posSettings();
    const reasons = st.reasons;

    const rate = fxForDate(dateStr);
    // ភាគច្រើនបើកវេនមុនម៉ោង 2 ទៅ 10 នាទី ម្តងម្កាលយឺត (អ្នកមានហានិភ័យយឺតញឹកជាង)
    const late = rng() < (risky ? 0.18 : 0.06);
    let openOffset = late ? 8 + Math.floor(rng() * 20) : -2 - Math.floor(rng() * 9);
    // បញ្ជរដែលអ្នកវេនមុនទើបបិទ៖ បើកចាប់ពីម៉ោងចាប់ផ្តើម (0–4 នាទី)
    if (ctx.notBefore && openOffset < 0) openOffset = Math.floor(rng() * 5);
    const shift = {
        id, date: dateStr, register, cashierId,
        templateCode: tpl.code, templateName: tpl.name, start: tpl.start, end: tpl.end,
        openedAt: isoLocal(new Date(start.getTime() + openOffset * 60000)),
        fxRate: rate, floatUSD: 200, floatKHR: 400000, floatIssuedUSD: 200, floatIssuedKHR: 400000,
        floatApprovedBy: pick(rng, managers), status: 'open', generated: true
    };

    const nowMs = Date.now();
    // ចំនួនការលក់តាមម៉ោង (ចុងសប្តាហ៍មនុស្សច្រើនជាង) · ម៉ោងលក់ត្រូវគ្នានឹងទម្រង់ម៉ោងមមាញឹក
    const dow = start.getDay();
    const dayFactor = (dow === 6 ? 1.15 : dow === 0 ? 1.1 : 1) * (0.85 + rng() * 0.3);
    const lastSaleMs = Math.min(end.getTime() - 5 * 60000, ctx.closeBy ? ctx.closeBy - 2 * 60000 : Infinity);
    const times = genSaleTimes(rng, new Date(shift.openedAt).getTime() + 2 * 60000, lastSaleMs, dayFactor);
    const prefix = receiptPrefix(register, start);
    const sales = [];
    const events = [];
    const approvals = [];
    const ev = (type, at, extra) => events.push(Object.assign({
        id: `EVG-${id}-${events.length}`, type, at: isoLocal(new Date(at)), shiftId: id, register,
        actorId: cashierId, cashierId, approverId: '', saleId: '', amount: 0, reason: '', note: ''
    }, extra || {}));

    times.forEach((t, i) => {
        if (t > nowMs) return;
        const lines = genBasket(rng);
        let discountPercent = 0;
        let discountReason = '';
        let discountApproverId = '';
        const dr = rng();
        if (dr < 0.05) {
            discountPercent = pick(rng, [2, 3, 5]);
            discountReason = pick(rng, reasons.discount);
        } else if (dr < (risky ? 0.075 : 0.06)) {
            discountPercent = 10;
            discountReason = pick(rng, reasons.discount);
            discountApproverId = pick(rng, managers);
        }
        const due = saleTotals(lines, discountPercent).gross;
        const pay = genPay(rng, due, rate);
        const sale = {
            id: prefix + String(i + 1).padStart(4, '0'), time: isoLocal(new Date(t)), shiftId: id, cashierId, register,
            fxRate: rate, items: lines, pay, discountPercent, discountReason, discountApproverId, customerId: '',
            status: 'completed', generated: true
        };
        sale.change = splitChange(paidTotal(pay, rate) - due, rate, defaultChangeMode(pay));

        if (rng() < (risky ? 0.12 : 0.05)) ev('line_removed', t - 60000, { amount: pick(rng, PRODUCTS).price });
        if (rng() < 0.012) ev('cart_cleared', t - 90000, { amount: 2 + rng() * 10 });
        if (discountPercent) {
            ev('discount', t, { saleId: sale.id, amount: due * discountPercent / (100 - discountPercent), reason: discountReason, approverId: discountApproverId, note: `${discountPercent}%` });
            if (discountApproverId) ev('override_approved', t - 30000, { approverId: discountApproverId, actorId: discountApproverId, amount: due * 0.1, reason: discountReason, note: `បញ្ចុះតម្លៃ ${discountPercent}%` });
        }
        if (rng() < (risky ? 0.012 : 0.003)) ev('override_denied', t - 45000, { approverId: pick(rng, managers) });
        if (rng() < 0.03) {
            ev('hold', t - 300000, { amount: 3 + rng() * 8 });
            if (rng() < 0.4) ev('hold_discarded', t + 600000, { amount: 3 + rng() * 8, reason: pick(rng, reasons.holdDiscard) });
        }

        const vr = rng();
        const approver = pick(rng, managers);
        const mode = rng() < 0.6 ? 'onsite' : 'remote';
        const decidedAt = isoLocal(new Date(t + (mode === 'onsite' ? 60000 : (5 + rng() * 30) * 60000)));
        if (vr < (risky ? 0.045 : 0.012)) {
            const reason = pick(rng, reasons.void);
            Object.assign(sale, { status: 'voided', voidedBy: approver, voidedAt: decidedAt, voidReason: reason });
            approvals.push({ id: `REQG-${sale.id}`, type: 'void', saleId: sale.id, amount: due, reason, shiftId: id, register, cashierId,
                raisedAt: isoLocal(new Date(t + 30000)), status: 'approved', decidedBy: approver, decidedAt, mode, generated: true });
            ev(mode === 'onsite' ? 'override_approved' : 'request_approved', t + 60000, { saleId: sale.id, approverId: approver, actorId: approver, amount: due, reason, note: 'លុបចោលវិក្កយបត្រ' });
        } else if (vr < (risky ? 0.06 : 0.022)) {
            const line = lines[0];
            const amount = Math.round(linePrice(line) * (1 - discountPercent / 100) * 100) / 100;
            const method = methodOf(sale) === 'split' ? 'usdCash' : methodOf(sale);
            const reason = pick(rng, reasons.return);
            sale.returns = [{ id: `REQG-${sale.id}`, lines: [{ sku: line.sku, qty: 1 }], amount, method,
                amountKHR: method === 'khrCash' ? Math.round(amount * rate / 100) * 100 : 0, reason, approvedBy: approver, at: decidedAt }];
            approvals.push({ id: `REQG-${sale.id}`, type: 'return', saleId: sale.id, lines: [{ sku: line.sku, qty: 1 }], amount, method, reason,
                shiftId: id, register, cashierId, raisedAt: isoLocal(new Date(t + 30000)), status: 'approved', decidedBy: approver, decidedAt, mode, generated: true });
            ev(mode === 'onsite' ? 'override_approved' : 'request_approved', t + 60000, { saleId: sale.id, approverId: approver, actorId: approver, amount, reason, note: 'ប្រគល់ទំនិញវិញ' });
        } else if (vr < 0.026) {
            approvals.push({ id: `REQG-R-${sale.id}`, type: 'void', saleId: sale.id, amount: due, reason: pick(rng, reasons.void),
                shiftId: id, register, cashierId, raisedAt: isoLocal(new Date(t + 30000)), status: 'rejected', decidedBy: approver,
                decidedAt, decisionNote: 'អតិថិជនបានយកទំនិញទៅហើយ', mode: 'remote', generated: true });
            ev('request_rejected', t + 90000, { saleId: sale.id, approverId: approver, actorId: approver, amount: due });
        }
        sales.push(sale);
    });

    const movements = [{
        id: `MVG-${id}-F`, type: 'float', register, shiftId: id, usd: 200, khr: 400000, reason: '', ref: '',
        createdBy: shift.floatApprovedBy, createdAt: shift.openedAt, status: 'confirmed', confirmedBy: cashierId, confirmedAt: shift.openedAt,
        receivedUSD: 200, receivedKHR: 400000, generated: true
    }];
    const usdIn = sales.filter(s => !isVoided(s)).reduce((n, s) => n + s.pay.usdCash, 0);
    if (usdIn > 120 && sales.length > 6) {
        const at = new Date(sales[Math.floor(sales.length * 0.7)].time).getTime();
        const pending = !ctx.closed && rng() < 0.7;
        const dropUSD = Math.max(Math.floor((usdIn * 0.7 - 20) / 50) * 50, 50);
        movements.push({
            id: `MVG-${id}-D`, type: 'drop', register, shiftId: id, usd: dropUSD, khr: 0, reason: '', ref: '',
            createdBy: cashierId, createdAt: isoLocal(new Date(at)), status: pending ? 'pending' : 'confirmed', generated: true,
            confirmedBy: pending ? '' : pick(rng, managers), confirmedAt: pending ? '' : isoLocal(new Date(at + 15 * 60000)),
            receivedUSD: pending ? 0 : dropUSD, receivedKHR: 0
        });
    }
    if (rng() < 0.15 && sales.length) {
        const at = new Date(sales[Math.floor(sales.length / 2)].time).getTime();
        const usd = 2 + Math.floor(rng() * 7);
        movements.push({
            id: `MVG-${id}-P`, type: 'payout', register, shiftId: id, usd, khr: 0, reason: pick(rng, reasons.payout), ref: `PO-${Math.floor(rng() * 900 + 100)}`,
            createdBy: pick(rng, managers), createdAt: isoLocal(new Date(at)), status: 'confirmed', generated: true
        });
    }

    if (ctx.closed) {
        const s = summarizeShift(shift, sales, movements);
        const vr = rng();
        let dUSD = 0;
        let dKHR = 0;
        if (vr < (risky ? 0.15 : 0.04)) dUSD = -(6 + Math.floor(rng() * 10));
        else if (vr < 0.18) dUSD = -(1 + Math.floor(rng() * 3));
        else if (vr < 0.26) dUSD = 1;
        if (rng() < 0.2) dKHR = pick(rng, [-1000, -500, 500, 1000]);
        const countedUSD = Math.round(s.expectedUSD) + dUSD;
        const countedKHR = Math.round(s.expectedKHR / 100) * 100 + dKHR;
        const v = varianceOf(countedUSD, countedKHR, s.expectedUSD, s.expectedKHR, rate);
        let closedAt = new Date(end.getTime() + (3 + Math.floor(rng() * 15)) * 60000);
        // បិទមុនថតប្រាក់បន្ទាប់លើបញ្ជរដដែល ឬមុនអ្នកដដែលបើកវេនបន្ទាប់
        if (ctx.closeBy && closedAt.getTime() > ctx.closeBy) closedAt = new Date(ctx.closeBy);
        Object.assign(shift, {
            status: 'closed', closedAt: isoLocal(closedAt), countedUSD, countedKHR,
            expectedUSD: s.expectedUSD, expectedKHR: s.expectedKHR, variance: v.diff,
            reason: v.level === 'large' ? pick(rng, ['អាប់ប្រាក់ខុសពេលមនុស្សច្រើន មិនដឹងថាវិក្កយបត្រណា', 'ប្រហែលជាទទួលក្រដាសប្រាក់ក្លែងក្លាយមួយសន្លឹក', 'ភ្លេចកត់ត្រាប្រាក់ចំណាយទិញទឹកកកពីថត'])
                : v.level === 'small' ? 'ទទួលស្គាល់ភាពខុសគ្នាតូច' : ''
        });
        if (ctx.reviewed) {
            const reviewer = pick(rng, managers);
            Object.assign(shift, {
                status: 'reviewed', reviewedBy: reviewer,
                reviewedAt: isoLocal(new Date(closedAt.getTime() + (20 + rng() * 600) * 60000)),
                reviewNote: v.level === 'large' ? 'បានជជែកជាមួយអ្នកគិតលុយ · តាមដានវេនបន្ទាប់' : ''
            });
        }
        if (rng() < 0.5) ev('reprint', end.getTime() - 3600000);
    }

    return { shift, sales, events, approvals, movements };
}

let MGR_CACHE = null;

function generateHistory() {
    if (MGR_CACHE) return MGR_CACHE;
    const out = { shifts: [], sales: [], events: [], approvals: [], movements: [] };
    // ហាងថ្មីគ្មានប្រវត្តិគំរូ · មានតែអ្វីដែលបុគ្គលិកពិតជាធ្វើ
    if (!IS_DEMO_DATA) return (MGR_CACHE = out);
    const live = liveShifts();
    const liveKeys = new Set();
    live.forEach(s => { liveKeys.add(`${s.date}|${s.templateCode}|${s.cashierId}`); liveKeys.add(`${s.date}|${s.templateCode}|${s.register}`); });
    const now = new Date();
    const bdate = businessDate();
    const tpls = shiftTemplates();
    // ពេលដែលបញ្ជរនីមួយៗជាប់ថតប្រាក់ (ពិត + គំរូ) ដើម្បីកុំឱ្យបញ្ជរមួយមានថតប្រាក់ពីរក្នុងពេលតែមួយ
    const spanEnd = s => s.closedAt ? new Date(s.closedAt).getTime() : Infinity;
    const taken = live.map(s => ({ register: s.register, from: new Date(s.openedAt).getTime(), to: spanEnd(s), live: true }));
    const regTaken = (r, from, to) => taken.some(x => x.register === r && x.from < to && from < x.to && !(x.live && x.from >= from + 60 * 60000));
    // ថតប្រាក់ពិតដែលបើកលើបញ្ជរនេះក្រោយវេនគំរូចាប់ផ្តើម → វេនគំរូត្រូវបិទមុននោះ
    const nextOnRegister = (r, from) => {
        const nxt = taken.filter(x => x.live && x.register === r && x.from >= from + 60 * 60000).map(x => x.from - 60000);
        return nxt.length ? Math.min(...nxt) : 0;
    };

    for (let d = HISTORY_DAYS; d >= 0; d--) {
        const date = addDays(new Date(bdate + 'T12:00'), -d);
        const dateStr = isoDate(date);
        // ប្រវត្តិធ្វើតាមកាលវិភាគវេន ដូច្នេះម៉ោងធ្វើការ និងបញ្ជរត្រូវគ្នាជានិច្ច
        tpls.forEach(tpl => {
            rosterSeats(dateStr, tpl.code).forEach(a => {
                if (liveKeys.has(`${dateStr}|${tpl.code}|${a.cashierId}`)) return;
                const start = dateAt(dateStr, tpl.start);
                let end = dateAt(dateStr, tpl.end);
                if (end <= start) end = addDays(end, 1);
                if (start > now) return;
                // ចាត់តាំងក្រោយវេនចាប់ផ្តើម = គេមិនទាន់មកបើកថតប្រាក់ · កុំបង្កើតថតប្រាក់គំរូ
                if (a.at && new Date(a.at) > start) return;
                const from = start.getTime();
                // អ្នកដដែលបើកថតប្រាក់ពិតក្រោយវេននេះចាប់ផ្តើម → វេនគំរូបិទមុននោះ · បើកមុន → គ្មានវេនគំរូ
                const own = live.filter(s => s.cashierId === a.cashierId && spanEnd(s) > from && new Date(s.openedAt).getTime() < end.getTime() + 20 * 60000);
                if (own.some(s => new Date(s.openedAt).getTime() <= from)) return;
                let closeBy = own.length ? Math.min(...own.map(s => new Date(s.openedAt).getTime() - 60000)) : 0;
                if (closeBy && closeBy < from + 60 * 60000) return;
                // ចប់ម៉ោងវេន = បិទថតប្រាក់ (ដើម្បីឱ្យអ្នកវេនបន្ទាប់បើកលើបញ្ជរដដែលបាន)
                const closed = !!closeBy || now >= end;
                const to = closed ? (closeBy || end.getTime()) : Infinity;
                // មួយបញ្ជរ មួយថតប្រាក់ក្នុងពេលតែមួយ៖ បញ្ជរដែលស្នើជាប់ → បញ្ជរទំនេរផ្សេង → គ្មានវេនគំរូ
                const register = [a.register].concat(REGISTERS).find(r => !regTaken(r, from, to));
                if (!register) return;
                if (!closeBy) closeBy = nextOnRegister(register, from);
                const closedFinal = closed || (!!closeBy && now.getTime() >= closeBy);
                // ប្តូរវេនលើបញ្ជរដដែល៖ អ្នកចេញបិទមុន អ្នកចូលបើកក្រោយ (មិនបើកមុនម៉ោង)
                const prev = taken.filter(x => x.gen && x.register === register && x.to <= from + 60000 && x.to >= from - 60 * 60000).pop();
                // ត្រួតពិនិត្យរួច លើកលែងតែវេនចុងក្រោយនៃថ្ងៃប្រតិបត្តិការ (អ្នកគ្រប់គ្រងពិនិត្យនៅព្រឹកបន្ទាប់)
                // អ្នកគ្រប់គ្រងពិនិត្យវេននៅព្រឹកបន្ទាប់ · វេនដែលបិទក្នុង 14 ម៉ោងចុងក្រោយនៅរង់ចាំត្រួតពិនិត្យ
                const reviewed = closedFinal && end.getTime() < now.getTime() - 14 * 3600000;
                const g = genShift(dateStr, register, tpl, a.cashierId, { closed: closedFinal, reviewed, closeBy: closeBy || (closedFinal ? now.getTime() - 60000 : 0), notBefore: prev ? from : 0 });
                if (prev) {
                    const openMs = new Date(g.shift.openedAt).getTime();
                    if (prev.shift.closedAt && new Date(prev.shift.closedAt).getTime() >= openMs) prev.shift.closedAt = isoLocal(new Date(openMs - 60000));
                }
                taken.push({ register, from, to: closedFinal ? end.getTime() : Infinity, gen: true, shift: g.shift });
                out.shifts.push(g.shift);
                out.sales.push(...g.sales);
                out.events.push(...g.events);
                out.approvals.push(...g.approvals);
                out.movements.push(...g.movements);
            });
        });
        // ដាក់ប្រាក់ចូលធនាគារព្រឹកថ្ងៃបន្ទាប់ ≈ 90% នៃសាច់ប្រាក់សុទ្ធដែលលក់បានក្នុងថ្ងៃ (បង្គត់ចុះ)
        // ដូច្នេះសមតុល្យទូដែកមិនដែលអវិជ្ជមាន ហើយកើនឡើងបន្តិចៗតាមការលក់
        if (d >= 1) {
            const ids = new Set(out.shifts.filter(x => x.date === dateStr).map(x => x.id));
            let usd = 0;
            let khr = 0;
            out.sales.filter(x => ids.has(x.shiftId) && !isVoided(x)).forEach(x => {
                const ch = saleChange(x);
                usd += x.pay.usdCash - ch.usd;
                khr += x.pay.khrCash - ch.khr;
            });
            const at = isoLocal(new Date(addDays(date, 1).setHours(9, 30, 0, 0)));
            const depUSD = Math.floor(usd * 0.9 / 50) * 50;
            const depKHR = Math.floor(khr * 0.9 / 100000) * 100000;
            if (new Date(at) <= now && (depUSD || depKHR)) {
                const r = rngFor(`bank|${dateStr}`);
                out.movements.push({
                    id: `MVG-BANK-${dateStr}`, type: 'bank', register: '', shiftId: '', usd: depUSD, khr: depKHR,
                    reason: 'ដាក់ប្រាក់ប្រចាំថ្ងៃ', ref: `ACLEDA-${dateStr.replace(/-/g, '')}`, createdBy: pick(r, MANAGERS.map(m => m.id)),
                    createdAt: at, status: 'confirmed', generated: true
                });
            }
        }
    }
    MGR_CACHE = out;
    return out;
}

/* ===== ស្រទាប់កែប្រែ និងការចូលប្រើរួម ===== */

function overlay() {
    return posRead(OVERLAY_KEY, { sales: {}, shifts: {}, movements: {} });
}

function setOverlay(kind, id, patch) {
    const o = overlay();
    o[kind] = o[kind] || {};
    o[kind][id] = Object.assign({}, o[kind][id] || {}, patch);
    posWrite(OVERLAY_KEY, o);
}

function withOverlay(list, kind) {
    const o = overlay()[kind] || {};
    return list.map(x => o[x.id] ? Object.assign({}, x, o[x.id]) : x);
}

function mgrAllShifts() {
    return withOverlay(generateHistory().shifts, 'shifts').concat(liveShifts())
        .sort((a, b) => b.openedAt.localeCompare(a.openedAt));
}

function mgrAllSales() {
    return withOverlay(generateHistory().sales, 'sales').concat(liveSales());
}

function mgrAllMovements() {
    return withOverlay(generateHistory().movements, 'movements').concat(liveMovements())
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function mgrAllApprovals() {
    return generateHistory().approvals.concat(liveApprovals())
        .sort((a, b) => b.raisedAt.localeCompare(a.raisedAt));
}

function mgrAllEvents() {
    return generateHistory().events.concat(liveEvents());
}

function findAnySale(id) {
    return mgrAllSales().find(s => s.id === id) || null;
}

function findAnyShift(id) {
    return mgrAllShifts().find(s => s.id === id) || null;
}

function updateAnySale(id, patch) {
    if (findLiveSale(id)) return updateLiveSale(id, patch);
    setOverlay('sales', id, patch);
    return findAnySale(id);
}

function updateAnyShift(id, patch) {
    if (liveShifts().some(s => s.id === id)) return patchById(POS_KEYS.shifts, id, patch);
    setOverlay('shifts', id, patch);
    return findAnyShift(id);
}

function updateAnyMovement(id, patch) {
    if (liveMovements().some(m => m.id === id)) return patchById(POS_KEYS.movements, id, patch);
    setOverlay('movements', id, patch);
    return mgrAllMovements().find(m => m.id === id);
}

function salesOfAnyShift(shiftId) {
    return mgrAllSales().filter(s => s.shiftId === shiftId).sort((a, b) => b.time.localeCompare(a.time));
}

function movementsOfAnyShift(shiftId) {
    return mgrAllMovements().filter(m => m.shiftId === shiftId);
}

function summaryOf(shift) {
    return summarizeShift(shift, salesOfAnyShift(shift.id), movementsOfAnyShift(shift.id));
}

function shiftVariance(shift) {
    if (shift.countedUSD == null) return null;
    const s = summaryOf(shift);
    return varianceOf(shift.countedUSD, shift.countedKHR, s.expectedUSD, s.expectedKHR, shift.fxRate || 4100);
}

/* សំណើទាំងពីរ (ប្រវត្តិ + រស់) — សំណើរង់ចាំអាចមកពីប្រវត្តិ (គំរូ) ឬពីអ្នកគិតលុយផ្ទាល់ */
function pendingApprovals() {
    return liveApprovals().filter(a => a.status === 'pending')
        .sort((a, b) => a.raisedAt.localeCompare(b.raisedAt));
}

/* ===== គំរូសំណើរង់ចាំ (បង្កើតម្តងពេលបើកទំព័រអ្នកគ្រប់គ្រងលើកដំបូង) ===== */

function ensureManagerSeed() {
    if (!IS_DEMO_DATA || posRead(MGR_SEED_KEY, null)) return;
    const shifts = withOverlay(generateHistory().shifts, 'shifts').filter(s => s.register === (REGISTERS[1] || REGISTERS[0]));
    const target = shifts.sort((a, b) => b.openedAt.localeCompare(a.openedAt))[0];
    if (target) {
        const sales = withOverlay(generateHistory().sales, 'sales')
            .filter(s => s.shiftId === target.id && !isVoided(s) && !(s.returns || []).length)
            .sort((a, b) => b.time.localeCompare(a.time));
        const reasons = posSettings().reasons;
        // សំណើគំរូពីកំណែមុនចង្អុលទៅវិក្កយបត្រដែលលែងមាន
        const list = liveApprovals().filter(a => !String(a.id).startsWith('REQ-SEED-'));
        if (sales[1]) {
            const s = sales[1];
            list.push({ id: 'REQ-SEED-01', type: 'void', saleId: s.id, amount: saleTotals(s.items, s.discountPercent).gross,
                reason: reasons.void[0], shiftId: target.id, register: target.register, cashierId: target.cashierId,
                raisedAt: isoLocal(new Date(new Date(s.time).getTime() + 4 * 60000)), status: 'pending', mode: 'remote' });
        }
        if (sales[3]) {
            const s = sales[3];
            const line = s.items[0];
            const amount = Math.round(linePrice(line) * (1 - (s.discountPercent || 0) / 100) * 100) / 100;
            const method = methodOf(s) === 'split' ? 'usdCash' : methodOf(s);
            list.push({ id: 'REQ-SEED-02', type: 'return', saleId: s.id, lines: [{ sku: line.sku, qty: 1 }], amount, method,
                reason: reasons.return[0], shiftId: target.id, register: target.register, cashierId: target.cashierId,
                raisedAt: isoLocal(new Date(new Date(s.time).getTime() + 9 * 60000)), status: 'pending', mode: 'remote' });
        }
        posWrite(POS_KEYS.approvals, list);
    }
    posWrite(MGR_SEED_KEY, { at: isoLocal(new Date()) });
}

/* ===== ការសម្រេចលើសំណើ ===== */

/* extra៖ ព័ត៌មានបន្ថែមពីការសម្រេច (ឧ. restock = ទំនិញប្រគល់វិញចូលស្តុកវិញ ឬខូច) */
function decideApproval(reqId, approve, approverId, note, extra) {
    const req = liveApprovals().find(a => a.id === reqId);
    if (!req || req.status !== 'pending') return null;
    const at = isoLocal(new Date());
    const rec = Object.assign({}, req, extra || {}, { status: approve ? 'approved' : 'rejected', decidedBy: approverId, decidedAt: at, decisionNote: note || '' });
    saveApproval(rec);
    if (approve) applyApprovalToSale(rec, approverId, updateAnySale);
    logPosEvent(approve ? 'request_approved' : 'request_rejected', {
        shiftId: req.shiftId, register: req.register, cashierId: req.cashierId, actorId: approverId,
        approverId, saleId: req.saleId, amount: req.amount, reason: note || req.reason, note: APPROVAL_TYPE[req.type].label
    });
    return rec;
}

/* ===== ទូដែក ===== */

function safeBalance() {
    let usd = SAFE_START.usd;
    let khr = SAFE_START.khr;
    mgrAllMovements().forEach(m => {
        if (m.type === 'float') { usd -= m.usd; khr -= m.khr; }
        if (m.type === 'drop' && m.status === 'confirmed') { usd += m.receivedUSD != null ? m.receivedUSD : m.usd; khr += m.receivedKHR != null ? m.receivedKHR : m.khr; }
        if (m.type === 'bank') { usd -= m.usd; khr -= m.khr; }
    });
    mgrAllShifts().forEach(s => {
        if (s.countedUSD != null && s.status !== 'open') { usd += s.countedUSD; khr += s.countedKHR; }
    });
    return { usd, khr };
}

/* ===== ជួរកាលបរិច្ឆេទ ===== */

function inRange(iso, range) {
    if (!range || !range.start) return true;
    const d = iso.slice(0, 10);
    const s = toIsoDateStr(range.start);
    const e = toIsoDateStr(range.end || range.start);
    return d >= s && d <= e;
}

function rangeOfDays(n) {
    const end = new Date(businessDate() + 'T12:00');
    return { start: addDays(end, -(n - 1)), end };
}

/* ===== ករណីមិនប្រក្រតី — ប្រៀបធៀបអ្នកគិតលុយនីមួយៗជាមួយមធ្យមក្រុម (ស្រាវជ្រាវ §6) ===== */

const EXCEPTION_COLS = [
    { key: 'voids', label: 'លុបចោល', unit: 'per100' },
    { key: 'returns', label: 'ប្រគល់វិញ', unit: 'per100' },
    { key: 'overrides', label: 'បញ្ចុះលើសកំណត់', unit: 'per100' },
    { key: 'lineRemovals', label: 'ដកទំនិញមុនទូទាត់', unit: 'per100' },
    { key: 'cartCleared', label: 'សម្អាតកន្ត្រក', unit: 'per100' },
    { key: 'holdDiscards', label: 'បោះបង់ការលក់ព្យួរ', unit: 'per100' },
    { key: 'wrongPins', label: 'លេខសម្ងាត់ខុស', unit: 'per100' }
];

function exceptionStats(range) {
    const rows = {};
    CASHIERS.forEach(c => {
        rows[c.id] = { cashierId: c.id, shifts: 0, tx: 0, sales: 0, voids: 0, voidAmount: 0, returns: 0, returnAmount: 0,
            overrides: 0, overrideAmount: 0, lineRemovals: 0, cartCleared: 0, holdDiscards: 0, wrongPins: 0,
            variance: 0, largeVariances: 0, afterHours: 0 };
    });
    mgrAllShifts().filter(s => inRange(s.openedAt, range) && rows[s.cashierId]).forEach(sh => {
        const r = rows[sh.cashierId];
        r.shifts += 1;
        const v = shiftVariance(sh);
        if (v) { r.variance += v.diff; if (v.level === 'large') r.largeVariances += 1; }
        const end = shiftEndDate(sh).getTime();
        const start = dateAt(sh.date, sh.start).getTime();
        salesOfAnyShift(sh.id).forEach(s => {
            const t = saleTotals(s.items, s.discountPercent);
            const at = new Date(s.time).getTime();
            if (at < start || at > end) r.afterHours += 1;
            if (isVoided(s)) { r.voids += 1; r.voidAmount += t.gross; r.tx += 1; return; }
            r.tx += 1;
            r.sales += t.gross;
            if ((s.returns || []).length) { r.returns += s.returns.length; r.returnAmount += returnedAmount(s); }
            if (s.discountApproverId) { r.overrides += 1; r.overrideAmount += t.discount; }
        });
    });
    mgrAllEvents().filter(e => inRange(e.at, range)).forEach(e => {
        const r = rows[e.cashierId];
        if (!r) return;
        if (e.type === 'line_removed') r.lineRemovals += 1;
        if (e.type === 'cart_cleared') r.cartCleared += 1;
        if (e.type === 'hold_discarded') r.holdDiscards += 1;
        if (e.type === 'override_denied') r.wrongPins += 1;
    });
    const list = Object.values(rows).filter(r => r.shifts || r.tx);
    const rate = (r, k) => r.tx ? r[k] / r.tx * 100 : 0;
    const avg = {};
    EXCEPTION_COLS.forEach(c => {
        const tx = list.reduce((n, r) => n + r.tx, 0);
        avg[c.key] = tx ? list.reduce((n, r) => n + r[c.key], 0) / tx * 100 : 0;
    });
    list.forEach(r => {
        r.rates = {};
        r.ratios = {};
        EXCEPTION_COLS.forEach(c => {
            r.rates[c.key] = rate(r, c.key);
            r.ratios[c.key] = avg[c.key] > 0 ? r.rates[c.key] / avg[c.key] : 0;
        });
    });
    return { rows: list, avg };
}

function approverStats(range) {
    const rows = {};
    MANAGERS.forEach(m => { rows[m.id] = { approverId: m.id, approved: 0, rejected: 0, onsite: 0, remote: 0, overrides: 0 }; });
    mgrAllApprovals().filter(a => a.status !== 'pending' && inRange(a.decidedAt || a.raisedAt, range)).forEach(a => {
        const r = rows[a.decidedBy];
        if (!r) return;
        r[a.status] += 1;
        r[a.mode === 'onsite' ? 'onsite' : 'remote'] += 1;
    });
    mgrAllSales().filter(s => s.discountApproverId && inRange(s.time, range)).forEach(s => {
        if (rows[s.discountApproverId]) rows[s.discountApproverId].overrides += 1;
    });
    return Object.values(rows);
}

/* ===== ស្តុកទំនិញ និងប្រវត្តិ 14 ថ្ងៃ (Phase 2) ===== */

/* ===== អ្នកផ្គត់ផ្គង់ (pos_suppliers · រួមទូទាំងហាង) =====
   { id, name, phone, telegram, leadDays, skus, note, active } · ហាងគំរូមាន 6 · ហាងថ្មីចាប់ផ្តើមទទេ */
const SUPPLIERS_KEY = 'pos_suppliers';
const SUPPLIER_SEED = (() => {
    const by = cat => PRODUCTS_SEED_SKUS.filter(s => s.cat === cat).map(s => s.sku);
    return [
        { id: 'SUP-01', name: 'ក្រុមហ៊ុន ភេសជ្ជៈកម្ពុជា', phone: '023 880 101', telegram: '@khbeverage', leadDays: 2, skus: by('drink').filter(s => !['8850001', '8850008'].includes(s)), active: true },
        { id: 'SUP-02', name: 'ក្រុមហ៊ុន ទឹកសុទ្ធ វីតាល់', phone: '023 880 202', telegram: '@vitalwater', leadDays: 1, skus: ['8850001', '8850008'], active: true },
        { id: 'SUP-03', name: 'ក្រុមហ៊ុន ចែកចាយអាហារសម្រន់ ភ្នំពេញ', phone: '012 660 303', telegram: '', leadDays: 3, skus: by('snack'), active: true },
        { id: 'SUP-04', name: 'ហាងលក់ដុំ របស់ប្រើប្រាស់ ស្រីមុំ', phone: '096 440 404', telegram: '@sreymom_ws', leadDays: 3, skus: by('household'), active: true },
        { id: 'SUP-05', name: 'ហាងលក់ដុំ សម្ភារសិក្សា ចំណេះ', phone: '081 550 505', telegram: '', leadDays: 2, skus: by('stationery'), active: true },
        { id: 'SUP-06', name: 'ក្រុមហ៊ុន អេឡិចត្រូនិក រស្មី', phone: '010 770 606', telegram: '@rasmey_elec', leadDays: 5, skus: by('electronic'), active: true }
    ];
})();
/* អ្នកផ្គត់ផ្គង់គំរូរបស់ហាងកាហ្វេ */
const SHOP_SUPPLIER_SEED = {
    'SHOP-02': [
        { id: 'SUP-01', name: 'រោងកិនកាហ្វេ មណ្ឌលគិរី', phone: '012 735 410', telegram: '@mondulkiri_beans', leadDays: 3, skus: ['1001', '1002', '1003', '1004', '1005', '1006', '1007'], active: true },
        { id: 'SUP-02', name: 'ហាងលក់ដុំ តែ និងទឹកដោះគោ សុខា', phone: '096 520 337', telegram: '', leadDays: 2, skus: ['1101', '1102', '1103', '1104', '1105'], active: true },
        { id: 'SUP-03', name: 'ហាងនំ ប៉ាន់ឌីស', phone: '017 448 902', telegram: '@pandis_bakery', leadDays: 1, skus: ['1201', '1202', '1203', '1204', '1205'], active: true },
        { id: 'SUP-04', name: 'ក្រុមហ៊ុន ទឹកសុទ្ធ វីតាល់', phone: '023 880 202', telegram: '@vitalwater', leadDays: 1, skus: ['1301', '1302'], active: true }
    ]
};

function shopSuppliers() {
    const list = posRead(SUPPLIERS_KEY, null);
    return list || (IS_DEMO_SHOP ? SUPPLIER_SEED : SHOP_SUPPLIER_SEED[ACTIVE_SHOP_ID] || []);
}

function saveSuppliers(list) {
    posWrite(SUPPLIERS_KEY, list);
}

function supplierById(id) {
    return shopSuppliers().find(s => s.id === id) || null;
}

/* ===== ការបញ្ជាទិញ (pos_purchase_orders · តាមសាខា) =====
   { id, supplierId, lines: [{ sku, qty, received }], expectedOn, note, status: ordered|partial|received|closed,
     createdBy, createdAt, receipts: [{ at, by, invoice, lines: [{ sku, qty }] }], closeReason }
   ទទួលទំនិញតាមការបញ្ជាទិញ = ទទួលស្តុកធម្មតា (stock_in) ដូច្នេះម្ចាស់ហាងបញ្ជាក់ថ្លៃដើមដូចមុន */
const PO_KEY = 'pos_purchase_orders';
const PO_STATUS = {
    ordered: { label: 'រង់ចាំដឹក', cls: 'bg-slate-50 text-slate-700 border-slate-200' },
    partial: { label: 'ទទួលខ្លះ', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    received: { label: 'ទទួលគ្រប់', cls: 'bg-slate-50 text-slate-700 border-slate-200' },
    closed: { label: 'បិទ · ទទួលមិនគ្រប់', cls: 'bg-slate-50 text-slate-600 border-slate-200' }
};

function purchaseOrders() {
    return (posRead(PO_KEY, []) || []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function poById(id) {
    return purchaseOrders().find(p => p.id === id) || null;
}

function poOpen(po) {
    return po.status === 'ordered' || po.status === 'partial';
}

function poLate(po) {
    return poOpen(po) && po.expectedOn < isoDate(new Date());
}

function lateOrderCount() {
    return purchaseOrders().filter(poLate).length;
}

function poUnits(po, key) {
    return po.lines.reduce((n, l) => n + (Number(l[key]) || 0), 0);
}

function savePOs(list) {
    posWrite(PO_KEY, list);
}

function createPO(supplierId, lines, expectedOn, note) {
    const list = posRead(PO_KEY, []) || [];
    const d = isoDate(new Date()).replace(/-/g, '').slice(2);
    const po = { id: `PO-${d}-${pad2(list.filter(x => x.id.includes(d)).length + 1)}`, supplierId, expectedOn, note: note || '',
        lines: lines.map(l => ({ sku: l.sku, qty: Number(l.qty), received: 0 })), status: 'ordered',
        createdBy: currentActorId(), createdAt: isoLocal(new Date()), receipts: [] };
    list.push(po);
    savePOs(list);
    logPosEvent('po_created', { ref: po.id, note: `${(supplierById(supplierId) || {}).name || ''} · ${po.lines.length} មុខ` });
    return po;
}

function receivePO(id, qtys, invoice) {
    const list = posRead(PO_KEY, []) || [];
    const po = list.find(x => x.id === id);
    if (!po || !poOpen(po)) return null;
    const sup = supplierById(po.supplierId) || { name: '' };
    // អ្នកផ្គត់ផ្គង់អាចដឹកលើសការបញ្ជាទិញ · extra = ចំនួនលើសនៅសល់ (កត់លើការទទួល)
    const got = po.lines.map(l => {
        const qty = Math.max(0, Number(qtys[l.sku]) || 0);
        return { sku: l.sku, qty, extra: Math.max(0, qty - Math.max(0, l.qty - l.received)) };
    }).filter(l => l.qty > 0);
    if (!got.length) return null;
    got.forEach(g => { po.lines.find(l => l.sku === g.sku).received += g.qty; });
    const at = isoLocal(new Date());
    po.receipts.push({ at, by: currentActorId(), invoice: invoice || '', lines: got });
    po.status = po.lines.every(l => l.received >= l.qty) ? 'received' : 'partial';
    savePOs(list);
    saveStockMoves(got.map(g => stockMove({ type: 'stock_in', sku: g.sku, qty: g.qty, at, supplier: sup.name, invoice: invoice || po.id,
        date: isoDate(new Date()), costConfirmed: false, reason: 'ទទួលតាមការបញ្ជាទិញ', ref: po.id })));
    return po;
}

function closePO(id, reason) {
    const list = posRead(PO_KEY, []) || [];
    const po = list.find(x => x.id === id);
    if (!po) return;
    Object.assign(po, { status: 'closed', closeReason: reason, closedAt: isoLocal(new Date()), closedBy: currentActorId() });
    savePOs(list);
}

/* សារបញ្ជាទិញជាភាសាខ្មែរ សម្រាប់ចម្លងទៅតេឡេក្រាម ឬសារ SMS */
function poMessage(po) {
    const sup = supplierById(po.supplierId) || { name: '' };
    return [`សួស្តី ${sup.name}`, `${MERCHANT.nameKh}${shopBranches().length > 1 ? ` (${MERCHANT.branch})` : ''} សូមបញ្ជាទិញ៖`]
        .concat(po.lines.map((l, i) => { const p = getProduct(l.sku) || { name: l.sku, unit: '' }; return `${i + 1}. ${p.name} × ${l.qty} ${p.unit}`; }))
        .concat([`សូមដឹកមកដល់ថ្ងៃ ${fmtDate(po.expectedOn)}`, `ទំនាក់ទំនង៖ ${MERCHANT.phone || ''}`, `លេខបញ្ជាទិញ៖ ${po.id}`]).join('\n');
}

/* ទំនិញជិតអស់ ឬអស់ ដែលអ្នកផ្គត់ផ្គង់នេះលក់ (មិនរាប់ទំនិញដែលកំពុងបញ្ជាទិញរួច) */
// sku → { qty, expectedOn, poId } still to arrive on open orders
function onOrderBySku() {
    const out = {};
    purchaseOrders().filter(poOpen).forEach(po => po.lines.forEach(l => {
        const left = l.qty - l.received;
        if (left <= 0) return;
        const o = out[l.sku] || (out[l.sku] = { qty: 0, expectedOn: po.expectedOn, poId: po.id });
        o.qty += left;
        if (po.expectedOn < o.expectedOn) { o.expectedOn = po.expectedOn; o.poId = po.id; }
    }));
    return out;
}

/* ===== ចំនួនណែនាំឱ្យបញ្ជាទិញ តាមល្បឿនលក់ =====
   លក់ជាមធ្យមក្នុងមួយថ្ងៃ (14 ថ្ងៃចុងក្រោយ) × (ថ្ងៃដឹកជញ្ជូនរបស់អ្នកផ្គត់ផ្គង់ + 7 ថ្ងៃរហូតដល់ការបញ្ជាទិញបន្ទាប់)
   + ស្តុកអប្បបរមា − ស្តុកមាន − កំពុងបញ្ជាទិញ · ទំនិញមិនទាន់មានការលក់ = ចំនួនបញ្ជាទិញលំនាំដើម (reorderQty) */
const REORDER_CYCLE_DAYS = 7;
const VELOCITY_DAYS = 14;
let VELOCITY_CACHE = null;

function salesVelocity() {
    const now = Date.now();
    if (VELOCITY_CACHE && now - VELOCITY_CACHE.at < 2000) return VELOCITY_CACHE.map;
    const from = isoLocal(new Date(now - VELOCITY_DAYS * 86400000));
    const units = {};
    mgrAllSales().forEach(sale => {
        if (sale.time < from || isVoided(sale)) return;
        sale.items.forEach(l => { units[l.sku] = (units[l.sku] || 0) + Math.max(0, l.qty - returnedQty(sale, l.sku)); });
    });
    const map = {};
    Object.keys(units).forEach(sku => { map[sku] = units[sku] / VELOCITY_DAYS; });
    VELOCITY_CACHE = { at: now, map };
    return map;
}

function supplierOfSku(sku) {
    return shopSuppliers().find(s => s.active !== false && (s.skus || []).includes(sku)) || null;
}

/* → { qty, daily, coverDays } */
function suggestOrderQty(p, levels, onOrder) {
    const daily = salesVelocity()[p.sku] || 0;
    const sup = supplierOfSku(p.sku);
    const coverDays = (Number(sup && sup.leadDays) || 1) + REORDER_CYCLE_DAYS;
    const have = Math.max(0, ((levels || onHandLevels())[p.sku]) || 0) + (((onOrder || {})[p.sku] || {}).qty || 0);
    const qty = daily > 0 ? Math.max(0, Math.ceil(daily * coverDays + (p.minStock || 0) - have)) : (p.reorderQty || 12);
    return { qty: daily > 0 ? Math.max(1, qty) : qty, daily, coverDays };
}

/* "លក់ ~3.5/ថ្ងៃ · គ្រប់ 9 ថ្ងៃ" — ពន្យល់ពីមូលហេតុនៃចំនួនណែនាំ */
function suggestNote(sg, unit) {
    if (!sg.daily) return 'មិនទាន់មានការលក់ · ចំនួនលំនាំដើម';
    const d = sg.daily >= 10 ? Math.round(sg.daily) : Math.round(sg.daily * 10) / 10;
    return `លក់ ~${d} ${unit || ''}/ថ្ងៃ · គ្រប់ ${sg.coverDays} ថ្ងៃ`;
}

function lowStockForSupplier(sup) {
    const levels = onHandLevels();
    const onOrder = new Set(Object.keys(onOrderBySku()));
    return (sup.skus || []).map(getProduct).filter(p => p && p.active !== false && !onOrder.has(p.sku) && stockStatusOf(p, levels[p.sku] || 0) !== 'ok');
}

let MGR_STOCK_CACHE = null;

function generateStockHistory() {
    if (MGR_STOCK_CACHE) return MGR_STOCK_CACHE;
    // ហាង ឬសាខាថ្មីគ្មានប្រវត្តិស្តុកគំរូ (ការទទួល ការកែតម្រូវ ការរាប់) · មានតែអ្វីដែលបុគ្គលិកពិតជាធ្វើ
    if (!IS_DEMO_DATA) return (MGR_STOCK_CACHE = { historicMoves: [], stockCounts: [] });
    const history = generateHistory();
    const openingAt = stockOpeningAt();
    const pastSales = history.sales.filter(s => s.time < openingAt);
    const pastApprovals = history.approvals.filter(a => (a.decidedAt || a.raisedAt) < openingAt && a.status === 'approved');

    // ប្រមូលចលនាពីប្រវត្តិលក់ និងការអនុម័តមុនពេលស្តុកបើក
    const movesBySku = {};
    PRODUCTS.forEach(p => { movesBySku[p.sku] = []; });

    pastSales.forEach(s => {
        (s.items || []).forEach(l => {
            if (!movesBySku[l.sku]) return;
            movesBySku[l.sku].push({
                id: `SMG-SALE-${s.id}-${l.sku}`,
                type: 'sale',
                sku: l.sku,
                qty: -l.qty,
                at: s.time,
                by: s.cashierId,
                ref: s.id,
                reason: '',
                note: ''
            });
        });
    });

    pastApprovals.forEach(a => {
        if (a.type === 'void') {
            const s = pastSales.find(x => x.id === a.saleId);
            if (s) {
                (s.items || []).forEach(l => {
                    if (!movesBySku[l.sku]) return;
                    movesBySku[l.sku].push({
                        id: `SMG-VOID-${a.id}-${l.sku}`,
                        type: 'void',
                        sku: l.sku,
                        qty: l.qty,
                        at: a.decidedAt || a.raisedAt,
                        by: a.decidedBy,
                        ref: s.id,
                        reason: a.reason || 'លុបចោលវិក្កយបត្រ',
                        note: ''
                    });
                });
            }
        } else if (a.type === 'return') {
            (a.lines || []).forEach(l => {
                if (!movesBySku[l.sku]) return;
                movesBySku[l.sku].push({
                    id: `SMG-RET-${a.id}-${l.sku}`,
                    type: 'return',
                    sku: l.sku,
                    qty: l.qty,
                    at: a.decidedAt || a.raisedAt,
                    by: a.decidedBy,
                    ref: a.saleId,
                    reason: a.reason || 'ប្រគល់ទំនិញវិញ',
                    note: ''
                });
            });
        }
    });

    // បង្កើតការទទួលស្តុក (Stock In) និងការកែតម្រូវ ដើម្បីឱ្យសមតុល្យថយក្រោយមិនធ្លាក់ក្រោម minStock/2
    const allHistoricMoves = [];
    const generatedCounts = [];
    const seedDate = new Date(openingAt);

    // វគ្គរាប់ស្តុកគំរូមួយ 7 ថ្ងៃមុន
    const countSessionDate = addDays(seedDate, -7);
    const countSessionTime = isoLocal(new Date(countSessionDate.setHours(15, 0, 0, 0)));
    const countSessionLines = [];

    PRODUCTS.forEach((p, idx) => {
        const rng = rngFor(`stock|${p.sku}|v3`);
        const pMoves = movesBySku[p.sku] || [];

        // តម្រៀបពីថ្មីទៅចាស់ (ថយក្រោយពី opening)
        pMoves.sort((a, b) => b.at.localeCompare(a.at));

        let runningBackward = openingQty(p) || 20;
        const reorderQty = p.reorderQty || 24;
        const minStock = p.minStock || 5;
        const safeFloor = Math.max(2, Math.floor(minStock / 2));

        const injectedMoves = [];

        // ដើរថយក្រោយតាមថ្ងៃ (14 ថ្ងៃ)
        for (let d = 1; d <= HISTORY_DAYS; d++) {
            const dayDate = addDays(new Date(openingAt), -d);
            const dayStr = isoDate(dayDate);

            // ពិនិត្យចលនាក្នុងថ្ងៃនេះ
            const dayMoves = pMoves.filter(m => m.at.startsWith(dayStr));
            dayMoves.forEach(m => {
                runningBackward = runningBackward - m.qty;
            });

            // បើកាលបរិច្ឆេទដល់ថ្ងៃរាប់ស្តុក (7 ថ្ងៃមុន)
            if (d === 7 && idx === 0) {
                const diff = -1;
                injectedMoves.push({
                    id: `SMG-COUNT-${dayStr}-${p.sku}`,
                    type: 'count',
                    sku: p.sku,
                    qty: diff,
                    at: countSessionTime,
                    by: demoManagerId(),
                    ref: 'SC-SEED-01',
                    reason: 'រាប់ស្តុកជាក់ស្តែង',
                    note: 'រកឃើញខ្វះ 1 ឯកតា'
                });
                runningBackward = runningBackward - diff;
            }

            // បន្ថែមការកែតម្រូវខូចខាតម្តងម្កាល (ថ្ងៃទី 4 ឬ 10)
            if ((d === 4 || d === 10) && rng() < 0.35) {
                const adjReason = pick(rng, ['damaged', 'expired']);
                const adjAt = isoLocal(new Date(dayDate.setHours(16, 30, 0, 0)));
                injectedMoves.push({
                    id: `SMG-ADJ-${dayStr}-${p.sku}`,
                    type: 'adjust',
                    sku: p.sku,
                    qty: -1,
                    at: adjAt,
                    by: demoManagerId(),
                    ref: '',
                    reason: adjReason,
                    note: adjReason === 'damaged' ? 'ទំនិញខូចខាតពេលដឹក' : 'ទំនិញជិតផុតកំណត់'
                });
                runningBackward = runningBackward - (-1);
            }

            // បើ runningBackward ឡើងខ្ពស់ ឬរៀងរាល់ 4-5 ថ្ងៃ -> ដាក់ការទទួលស្តុក (stock_in)
            if (d % 5 === 0 || runningBackward > (openingQty(p) + reorderQty * 0.8)) {
                let delivQty = reorderQty;
                if (runningBackward - delivQty < safeFloor) {
                    delivQty = Math.max(6, runningBackward - safeFloor);
                }
                const carriers = shopSuppliers().filter(x => (x.skus || []).includes(p.sku));
                const sup = (carriers[0] || pick(rng, shopSuppliers()) || { name: 'អ្នកផ្គត់ផ្គង់' }).name;
                const invNum = `INV-${dayStr.replace(/-/g, '')}-${Math.floor(rng() * 800 + 100)}`;
                const delivAt = isoLocal(new Date(dayDate.setHours(8, 30, 0, 0)));
                injectedMoves.push({
                    id: `SMG-IN-${dayStr}-${p.sku}`,
                    type: 'stock_in',
                    sku: p.sku,
                    qty: delivQty,
                    at: delivAt,
                    by: demoManagerId(),
                    supplier: sup,
                    invoice: invNum,
                    date: dayStr,
                    // only the last 3 days wait for the owner to confirm cost
                    costConfirmed: dayStr < isoDate(new Date(Date.now() - 3 * 86400000)),
                    ref: invNum,
                    reason: 'ទទួលទំនិញចូលស្តុក',
                    note: ''
                });
                runningBackward = runningBackward - delivQty;
            }
        }

        // ចងក្រងចលនាប្រវត្តិទាំងអស់នៃ SKU នេះ ពីចាស់ទៅថ្មី
        const combinedHistoric = pMoves.concat(injectedMoves);
        combinedHistoric.sort((a, b) => a.at.localeCompare(b.at));

        // ដើរទៅមុខពី 14 ថ្ងៃមុន រហូតដល់ openingAt ដើម្បីគណនា balanceAfter
        let runningForward = runningBackward;
        combinedHistoric.forEach(m => {
            runningForward += m.qty;
            m.balanceAfter = runningForward;
        });

        allHistoricMoves.push(...combinedHistoric);

        // កត់ត្រាចូលបន្ទាត់រាប់ស្តុក 7 ថ្ងៃមុន
        const countDiff = (idx === 0) ? -1 : 0;
        const countedUnits = Math.max(0, runningForward + countDiff);
        countSessionLines.push({
            sku: p.sku,
            system: runningForward,
            first: countedUnits,
            counted: countedUnits,
            diff: countDiff
        });
    });

    generatedCounts.push({
        id: 'SC-SEED-01',
        at: countSessionTime,
        by: demoManagerId(),
        status: 'completed',
        lines: countSessionLines,
        generated: true
    });

    MGR_STOCK_CACHE = {
        historicMoves: allHistoricMoves,
        stockCounts: generatedCounts
    };
    return MGR_STOCK_CACHE;
}

function mgrAllStockCounts() {
    const gen = generateStockHistory().stockCounts || [];
    return storedStockCounts().concat(gen).sort((a, b) => b.at.localeCompare(a.at));
}

function mgrStockMoves(range) {
    const openingAt = stockOpeningAt();
    const historic = generateStockHistory().historicMoves;
    const live = liveStockMoves();

    // គណនា balanceAfter សម្រាប់ live moves ទៅមុខពីស្តុកបើករបស់សាខានេះ
    const liveBySku = {};
    PRODUCTS.forEach(p => { liveBySku[p.sku] = []; });
    live.forEach(m => {
        if (liveBySku[m.sku]) liveBySku[m.sku].push(m);
    });

    const liveWithBalance = [];
    PRODUCTS.forEach(p => {
        const moves = liveBySku[p.sku] || [];
        moves.sort((a, b) => a.at.localeCompare(b.at));
        let running = openingQty(p);
        moves.forEach(m => {
            running += m.qty;
            m.balanceAfter = running;
            liveWithBalance.push(m);
        });
    });

    const all = historic.concat(liveWithBalance).sort((a, b) => b.at.localeCompare(a.at));
    return range ? all.filter(m => inRange(m.at, range)) : all;
}

/* ការរាប់មួយប្រភេទ (រាប់ជាផ្នែក) · scope = 'all' ឬ id ប្រភេទ */
function countScopeLabel(scope) {
    if (!scope || scope === 'all') return 'ទំនិញទាំងអស់';
    return (CATEGORIES.find(c => c.id === scope) || {}).label || scope;
}

/* កាលវិភាគរាប់ស្តុកគិតតែការរាប់ពេញ (ទំនិញទាំងអស់) · ការរាប់មួយប្រភេទមិនកំណត់ថ្ងៃរាប់ឡើងវិញទេ */
function stockCountScheduleStatus() {
    const st = posSettings();
    const sched = st.countSchedule || 'weekly';
    const intervalDays = sched === 'monthly' ? 30 : 7;
    const allCounts = mgrAllStockCounts().filter(c => !c.scope || c.scope === 'all');
    const lastAt = allCounts.length > 0 ? allCounts[0].at : stockOpeningAt();
    const lastDate = new Date(lastAt);
    const nextDueDate = addDays(lastDate, intervalDays);
    const now = new Date();
    const diffMs = now.getTime() - nextDueDate.getTime();
    const diffDays = Math.floor(diffMs / (24 * 3600 * 1000));
    const isDue = now >= nextDueDate;
    const isOverdue = diffDays >= 2;
    return {
        schedule: sched,
        intervalDays,
        lastAt,
        nextDueDate: isoDate(nextDueDate),
        isDue,
        isOverdue,
        overdueDays: Math.max(0, diffDays)
    };
}

function stockExceptionStats(range) {
    const moves = mgrStockMoves(range);
    const events = mgrAllEvents().filter(e => inRange(e.at, range));
    const st = posSettings();
    const limitQty = st.adjustLimitQty || 10;
    const limitUSD = st.adjustLimitUSD || 50;

    const mismatches = events.filter(e => e.type === 'stock_mismatch');
    const mismatchByCashier = {};
    mismatches.forEach(e => {
        const c = e.cashierId || 'unknown';
        mismatchByCashier[c] = mismatchByCashier[c] || { cashierId: c, count: 0, totalAmount: 0, items: [] };
        mismatchByCashier[c].count += 1;
        mismatchByCashier[c].totalAmount += (e.amount || 0);
        mismatchByCashier[c].items.push(e);
    });

    const largeAdjustments = moves.filter(m => {
        if (m.type !== 'adjust') return false;
        const p = getProduct(m.sku);
        const price = p ? p.price : 0;
        const absQty = Math.abs(m.qty);
        return absQty > limitQty || (absQty * price) > limitUSD;
    }).map(m => {
        const p = getProduct(m.sku);
        const price = p ? p.price : 0;
        return Object.assign({}, m, {
            valueUSD: Math.abs(m.qty) * price,
            productName: p ? p.name : m.sku
        });
    });

    const countDifferences = moves.filter(m => m.type === 'count' && m.qty !== 0).map(m => {
        const p = getProduct(m.sku);
        const price = p ? p.price : 0;
        return Object.assign({}, m, {
            valueUSD: Math.abs(m.qty) * price,
            productName: p ? p.name : m.sku
        });
    });

    const sched = stockCountScheduleStatus();

    return {
        mismatches: Object.values(mismatchByCashier),
        mismatchList: mismatches,
        largeAdjustments,
        countDifferences,
        sched
    };
}

/* ===== ការលក់តាមជួរ ===== */

/* ថ្ងៃប្រតិបត្តិការនៃការលក់ = ថ្ងៃដែលវេនចាប់ផ្តើម (ការលក់ក្រោយពាក់កណ្តាលអធ្រាត្រក្នុងវេនយប់ ជារបស់ថ្ងៃមុន) */
let SHIFT_DATE_CACHE = null;
function saleBizDate(sale) {
    if (!SHIFT_DATE_CACHE) {
        SHIFT_DATE_CACHE = {};
        mgrAllShifts().forEach(x => { SHIFT_DATE_CACHE[x.id] = x.date; });
    }
    return SHIFT_DATE_CACHE[sale.shiftId] || sale.time.slice(0, 10);
}
window.addEventListener('bms-store-changed', () => {
    SHIFT_DATE_CACHE = null;
    MGR_STOCK_CACHE = null;
});

function salesInRange(range, filter) {
    const f = filter || {};
    return mgrAllSales().filter(s => inRange(saleBizDate(s), range)
        && (!f.register || s.register === f.register)
        && (!f.cashierId || s.cashierId === f.cashierId));
}

function aggregateSales(sales) {
    const acc = { tx: 0, gross: 0, net: 0, vat: 0, discount: 0, qty: 0, returns: 0, voids: 0, usdCash: 0, khrCashUSD: 0, khqr: 0, byBank: {} };
    sales.forEach(s => {
        const t = saleTotals(s.items, s.discountPercent);
        if (isVoided(s)) { acc.voids += 1; return; }
        acc.tx += 1;
        acc.gross += t.gross;
        acc.net += t.net;
        acc.vat += t.vat;
        acc.discount += t.discount;
        acc.qty += t.qty;
        acc.returns += returnedAmount(s);
        // ចែកតាមវិធីទូទាត់ ដោយដកប្រាក់អាប់ចេញពីសាច់ប្រាក់
        const paid = paidTotal(s.pay, s.fxRate);
        const scale = paid > 0 ? t.gross / paid : 0;
        acc.usdCash += s.pay.usdCash * scale;
        acc.khrCashUSD += toUSD(s.pay.khrCash, s.fxRate) * scale;
        acc.khqr += s.pay.khqr * scale;
        if (s.pay.khqr > 0.005) {
            const b = acc.byBank[s.pay.bank || ''] || (acc.byBank[s.pay.bank || ''] = { amount: 0, count: 0 });
            b.amount += s.pay.khqr * scale;
            b.count += 1;
        }
    });
    acc.netSales = acc.gross - acc.returns;
    acc.avg = acc.tx ? acc.gross / acc.tx : 0;
    return acc;
}

/* ===== ផ្លាកលេខ និងការជូនដំណឹងរបស់អ្នកគ្រប់គ្រង ===== */

function mgrPendingApprovalCount() {
    return pendingApprovals().length;
}

function mgrAwaitingReviewCount() {
    return mgrAllShifts().filter(s => s.status === 'closed').length;
}

function mgrPendingDropCount() {
    return mgrAllMovements().filter(m => m.type === 'drop' && m.status === 'pending').length;
}

/* ទំនិញដែលត្រូវបញ្ជាទិញ៖ ជិតអស់ ឬអស់ ហើយមិនទាន់មានក្នុងការបញ្ជាទិញដែលកំពុងរង់ចាំ
   សាខាដែលមិនទាន់កត់ត្រាស្តុកសោះ = គ្មាន (ដូច stockStatus) · ផ្លាកលេខ ផ្ទាំងគ្រប់គ្រង និងផ្ទាំង «ត្រូវបញ្ជាទិញ» ប្រើរួមគ្នា */
function mgrReorderProducts(levels) {
    if (!stockTracked()) return [];
    const lv = levels || onHandLevels();
    const onOrder = onOrderBySku();
    return sellableProducts().filter(p => !onOrder[p.sku] && stockStatusOf(p, lv[p.sku] || 0) !== 'ok');
}

/* ===== ទំនិញជិតផុតកំណត់ =====
   ការទទួលស្តុកអាចមានកាលបរិច្ឆេទផុតកំណត់ (expiry)។ ស្តុកដែលនៅមានសន្មតថាមកពីការទទួលចុងក្រោយ
   (លក់ចាស់មុន) ដូច្នេះការទទួលចាស់ដែលស្តុកលក់អស់ហើយ មិនរំខានទៀតទេ។
   → [{ sku, qty, expiry, daysLeft, moveId }] ផុតកំណត់ក្នុង EXPIRY_WARN_DAYS ថ្ងៃ ឬហួសរួច */
const EXPIRY_WARN_DAYS = 7;

function expiringLots(days) {
    const within = days == null ? EXPIRY_WARN_DAYS : days;
    const today = isoDate(new Date());
    const limit = isoDate(new Date(Date.now() + within * 86400000));
    const ins = mgrStockMoves().filter(m => m.type === 'stock_in');
    if (!ins.some(m => m.expiry)) return [];
    const levels = onHandLevels();
    const bySku = {};
    ins.forEach(m => (bySku[m.sku] = bySku[m.sku] || []).push(m));
    const out = [];
    Object.keys(bySku).forEach(sku => {
        let left = Math.max(0, levels[sku] || 0);
        bySku[sku].sort((a, b) => b.at.localeCompare(a.at)).forEach(m => {
            const take = Math.min(left, Number(m.qty) || 0);
            left -= take;
            if (take > 0 && m.expiry && m.expiry <= limit) {
                out.push({ sku, qty: take, expiry: m.expiry, moveId: m.id,
                    daysLeft: Math.round((new Date(m.expiry) - new Date(today)) / 86400000) });
            }
        });
    });
    return out.sort((a, b) => a.expiry.localeCompare(b.expiry));
}

/* ===== ស្តុក៖ ការងារត្រូវធ្វើ (ទំព័រស្តុក) =====
   ការងារដែលរង់ចាំអ្នកគ្រប់គ្រង មួយបន្ទាត់ក្នុងមួយការងារ ជាមួយប៊ូតុងតែមួយ (root = ផ្លូវទៅ src/)
   → [{ key, icon, tone: 'rose'|'amber'|'slate', title, note, cta, href | action }] */
function stockTodo(root) {
    const out = [];
    const r = root || '../..';
    if (!stockTracked()) return out;
    const today = isoDate(new Date());
    const n = (x, unit) => `${x} ${unit}`;

    const incoming = incomingTransfers();
    if (incoming.length) {
        const t = incoming[0];
        out.push({ key: 'transfer', icon: 'fa-right-to-bracket', tone: 'amber',
            title: incoming.length > 1 ? `ទំនិញផ្ទេរ ${incoming.length} លើកកំពុងមកដល់` : `ទំនិញផ្ទេរពី ${branchName(t.from)} កំពុងមកដល់`,
            note: 'រាប់ទំនិញដែលមកដល់ ហើយបញ្ជាក់ការទទួល', cta: 'ទទួល',
            href: incoming.length > 1 ? `${r}/manager/stock-transfer/transfers.html?tab=in` : `${r}/manager/stock-transfer/view-transfer.html?id=${t.id}` });
    }

    const open = purchaseOrders().filter(poOpen);
    if (open.length) {
        const late = open.filter(poLate).length;
        const dueToday = open.filter(po => po.expectedOn === today).length;
        out.push({ key: 'receive', icon: 'fa-truck-ramp-box', tone: late ? 'rose' : 'slate',
            title: `ការបញ្ជាទិញ ${open.length} កំពុងរង់ចាំដឹក`,
            note: [late ? `យឺត ${late}` : '', dueToday ? `មកដល់ថ្ងៃនេះ ${dueToday}` : '', !late && !dueToday ? 'ពេលទំនិញមកដល់ ចុចទទួល' : ''].filter(Boolean).join(' · '),
            cta: 'ទទួលទំនិញ', action: `openReceiveChooser('${r}')` });
    }

    const reorder = mgrReorderProducts();
    if (reorder.length) {
        const out0 = reorder.filter(p => stockStatus(p.sku) === 'out').length;
        const sups = new Set(reorder.map(p => (supplierOfSku(p.sku) || {}).id || '-')).size;
        out.push({ key: 'order', icon: 'fa-cart-arrow-down', tone: out0 ? 'rose' : 'amber',
            title: `${n(reorder.length, 'មុខ')}ត្រូវបញ្ជាទិញ`,
            note: [out0 ? `អស់ ${out0}` : '', reorder.slice(0, 3).map(p => p.name).join(' · ') + (reorder.length > 3 ? ' …' : ''), sups > 1 ? `${sups} អ្នកផ្គត់ផ្គង់` : ''].filter(Boolean).join(' · '),
            cta: 'បញ្ជាទិញ', href: `${r}/manager/purchase/create-order.html` });
    }

    const exp = expiringLots();
    if (exp.length) {
        const gone = exp.filter(x => x.daysLeft < 0).length;
        out.push({ key: 'expiry', icon: 'fa-calendar-xmark', tone: gone ? 'rose' : 'amber',
            title: gone ? `${n(gone, 'មុខ')}ផុតកំណត់ហើយ` : `${n(exp.length, 'មុខ')}ជិតផុតកំណត់`,
            note: gone ? 'ដកចេញពីធ្នើ ហើយកាត់ចេញពីស្តុក' : 'ដាក់លក់មុនគេ', cta: 'មើល', href: `${r}/manager/stock/stock.html#expiry` });
    }

    const sched = stockCountScheduleStatus();
    if (sched.isDue) {
        out.push({ key: 'count', icon: 'fa-clipboard-check', tone: sched.isOverdue ? 'rose' : 'slate',
            title: sched.isOverdue ? `រាប់ស្តុកហួសកំណត់ ${sched.overdueDays} ថ្ងៃ` : 'ដល់ថ្ងៃរាប់ស្តុក',
            note: `រាប់${sched.schedule === 'monthly' ? 'ប្រចាំខែ' : 'ប្រចាំសប្តាហ៍'} · ទំនិញទាំងអស់`, cta: 'រាប់ស្តុក', href: `${r}/manager/stock-count/create-count.html` });
    }
    // បន្ទាន់មុន (ក្រហម → លឿង → ធម្មតា)
    const rank = { rose: 0, amber: 1, slate: 2 };
    return out.sort((a, b) => rank[a.tone] - rank[b.tone]);
}

/* ទំនិញមកដល់៖ សួរថាមកពីការបញ្ជាទិញណា (ឬគ្មានការបញ្ជាទិញ) → ទៅទំព័រទទួលត្រឹមត្រូវ
   ប៊ូតុង «ទទួលទំនិញ» តែមួយ ជំនួសការជ្រើសរវាង «បញ្ជាទិញ» និង «ទទួលស្តុកថ្មី» */
async function openReceiveChooser(root) {
    const r = root || '../..';
    const manual = `${r}/manager/stock/create-stock-in.html`;
    const today = isoDate(new Date());
    const open = purchaseOrders().filter(poOpen).sort((a, b) => a.expectedOn.localeCompare(b.expectedOn));
    if (!open.length) { location.href = manual; return; }
    const when = po => po.expectedOn < today ? `យឺត · ត្រូវមកដល់ ${fmtDate(po.expectedOn)}` : po.expectedOn === today ? 'ត្រូវមកដល់ថ្ងៃនេះ' : `ត្រូវមកដល់ ${fmtDate(po.expectedOn)}`;
    const v = await showOptionDialog({
        title: 'ទំនិញមកពីណា?',
        message: 'ជ្រើសការបញ្ជាទិញ ដើម្បីទទួល និងបិទវា · ដឹកមកដោយមិនបានបញ្ជាទិញ ជ្រើសខាងក្រោមគេ',
        options: open.slice(0, 6).map(po => ({ value: po.id, icon: 'fa-truck-ramp-box',
            label: (supplierById(po.supplierId) || {}).name || 'អ្នកផ្គត់ផ្គង់',
            desc: `${po.lines.length} មុខ · ${when(po)}${po.status === 'partial' ? ' · ទទួលខ្លះហើយ' : ''}` }))
            .concat([{ value: 'manual', icon: 'fa-box-open', label: 'គ្មានការបញ្ជាទិញ', desc: 'ទំនិញមកដល់ដោយមិនបានបញ្ជាទិញក្នុងប្រព័ន្ធ' }])
    });
    if (!v) return;
    location.href = v === 'manual' ? manual : `${r}/manager/purchase/view-order.html?id=${encodeURIComponent(v)}#receive`;
}

function mgrLowStockCount() {
    return mgrReorderProducts().length;
}

/* ផ្លាកលេខរបស់អ្នកគិតលុយមិនប្រើនៅទីនេះ */
function totalPending() {
    return 0;
}

/* ការផ្ទេរស្តុកដែលរង់ចាំសាខានេះទទួល (ផ្លាកលេខ · ការជូនដំណឹង) */
function mgrIncomingTransferCount() {
    return typeof incomingTransfers === 'function' ? incomingTransfers().length : 0;
}

function portalNotifications() {
    const root = document.body.dataset.roleRoot || '../..';
    const list = [];
    purchaseOrders().filter(poLate).slice(0, 3).forEach(po => list.push({
        icon: 'mdi:truck-alert-outline', tone: 'warning',
        title: `${(supplierById(po.supplierId) || {}).name || ''} ដឹកយឺត`,
        note: `ត្រូវមកដល់ ${fmtDate(po.expectedOn)} · ${po.lines.length} មុខ · ទូរស័ព្ទសួរ ឬបិទការបញ្ជាទិញ`,
        href: `${root}/manager/purchase/view-order.html?id=${po.id}`
    }));
    incomingTransfers().forEach(t => list.push({
        icon: 'mdi:truck-delivery-outline', tone: 'warning',
        title: `ស្តុកពី ${branchName(t.from)} រង់ចាំទទួល`,
        note: `${t.lines.length} មុខ · ${t.lines.reduce((n, l) => n + l.qty, 0)} ឯកតា · រាប់ហើយបញ្ជាក់ការទទួល`,
        time: fmtTime(t.sentAt), href: `${root}/manager/stock-transfer/view-transfer.html?id=${t.id}`
    }));
    // ការជាវរបស់ហាង (ម្ចាស់ហាងតែប៉ុណ្ណោះ)៖ ជិតផុតកំណត់ · ហួសកំណត់ · សាកល្បងជិតចប់ · បង់តាមរយៈ DIGITECHKH
    if (document.body.id === 'adminPortal' && typeof shopSubscription === 'function') {
        const sub = shopSubscription(CURRENT_SHOP_ID);
        const st = subscriptionStatus(sub);
        const left = sub ? daysUntil(sub.endsOn) : 99;
        if (st === 'overdue') list.push({ icon: 'mdi:store-alert-outline', tone: 'danger', title: `ការជាវហួសកំណត់ ${-left} ថ្ងៃ`,
            note: `ហាងនឹងចូលប្រើមិនបានក្នុង ${SUB_GRACE_DAYS + left} ថ្ងៃ · សូមបង់ប្រាក់ទៅ DIGITECHKH`, href: `${root}/admin/subscription/subscription.html` });
        else if (st === 'expiring' || (st === 'trial' && left <= SUB_WARN_DAYS)) list.push({ icon: 'mdi:calendar-clock', tone: 'warning',
            title: st === 'trial' ? `សាកល្បងនៅសល់ ${left} ថ្ងៃ` : `ការជាវផុតកំណត់ក្នុង ${left} ថ្ងៃ`,
            note: `${st === 'trial' ? 'ជាវដើម្បីបន្តប្រើ' : 'បង់ប្រាក់ដើម្បីបន្ត'} · មើលវិធីបង់`, time: fmtDate(sub.endsOn), href: `${root}/admin/subscription/subscription.html` });
    }
    pendingApprovals().slice(0, 4).forEach(a => list.push({
        icon: 'mdi:shield-alert-outline', tone: 'warning',
        title: `${APPROVAL_TYPE[a.type].label} · ${fmtUSD(a.amount)}`,
        note: `${personName(a.cashierId)} · ${a.register} · ${escapeText(a.reason)}`,
        time: `${fmtDuration(new Date() - new Date(a.raisedAt))}មុន`,
        href: `${root}/manager/approvals/view-request.html?id=${a.id}`
    }));
    mgrAllMovements().filter(m => m.type === 'drop' && m.status === 'pending').slice(0, 2).forEach(m => list.push({
        icon: 'mdi:safe', tone: 'warning', title: `ប្រាក់ផ្ទេរចូលទូដែករង់ចាំទទួល · ${m.register}`,
        note: `${fmtUSD(m.usd)} · ${fmtKHR(m.khr)} ពី ${personName(m.createdBy)}`, time: fmtTime(m.createdAt),
        href: `${root}/manager/cash/cash.html`
    }));
    mgrAllShifts().filter(s => s.status === 'closed').slice(0, 3).forEach(s => {
        const v = shiftVariance(s);
        list.push({
            icon: v && v.level === 'large' ? 'mdi:alert-octagon-outline' : 'mdi:clipboard-check-outline',
            tone: v && v.level === 'large' ? 'danger' : 'info',
            title: `វេន ${s.register} ${s.templateName} រង់ចាំត្រួតពិនិត្យ`,
            note: `${personName(s.cashierId)} · ${fmtDate(s.openedAt)}${v ? ` · ${DIRECTION_LABEL[v.direction]} ${fmtUSD(v.abs)}` : ''}`,
            href: `${root}/manager/shifts/view-shift.html?id=${s.id}`
        });
    });
    mgrAllShifts().filter(s => s.status === 'open' && new Date() > shiftEndDate(s)).forEach(s => list.push({
        icon: 'mdi:clock-alert-outline', tone: 'warning', title: `${s.register} ហួសម៉ោងវេន ${fmtDuration(new Date() - shiftEndDate(s))}`,
        note: `${personName(s.cashierId)} · ${s.templateName} ត្រូវបិទម៉ោង ${s.end}`,
        href: `${root}/manager/shifts/view-shift.html?id=${s.id}`
    }));

    const expiring = expiringLots();
    if (expiring.length) {
        const gone = expiring.filter(x => x.daysLeft < 0).length;
        list.push({
            icon: 'mdi:calendar-alert',
            tone: gone ? 'danger' : 'warning',
            title: gone ? `ទំនិញ ${gone} មុខផុតកំណត់ហើយ` : `ទំនិញ ${expiring.length} មុខជិតផុតកំណត់`,
            note: 'ដកចេញពីធ្នើ ឬលក់មុនគេ',
            href: `${root}/manager/stock/stock.html#expiry`
        });
    }

    const lowCount = mgrLowStockCount();
    if (lowCount > 0) {
        list.push({
            icon: 'mdi:package-variant-remove',
            tone: 'warning',
            title: `ទំនិញ ${lowCount} មុខជិតអស់ មិនទាន់បញ្ជាទិញ`,
            note: 'បើកបញ្ជីត្រូវបញ្ជាទិញ',
            href: `${root}/manager/stock/stock.html?tab=reorder`
        });
    }

    const sched = stockCountScheduleStatus();
    if (sched.isDue) {
        list.push({
            icon: 'mdi:clipboard-alert-outline',
            tone: sched.isOverdue ? 'danger' : 'warning',
            title: sched.isOverdue ? `ការរាប់ស្តុកហួសកំណត់ ${sched.overdueDays} ថ្ងៃ` : 'ដល់កាលបរិច្ឆេទរាប់ស្តុក',
            note: `កាលវិភាគ${sched.schedule === 'monthly' ? 'ប្រចាំខែ' : 'ប្រចាំសប្តាហ៍'}`,
            time: fmtDate(sched.nextDueDate),
            href: `${root}/manager/stock-count/stock-count.html`
        });
    }

    return list;
}

/* ===== សមាសធាតុ UI រួមសម្រាប់ទំព័រអ្នកគ្រប់គ្រង ===== */

function statusChip(meta) {
    return `<span class="sm-badge inline-flex items-center px-2.5 py-0.5 rounded-full border whitespace-nowrap ${meta.cls}">${meta.label}</span>`;
}

function personChip(id) {
    const p = personById(id);
    if (!p) return '<span class="text-slate-400">—</span>';
    return `<span class="inline-flex items-center gap-2 min-w-0">${avatarHtml(id, 'w-7 h-7')}<span class="truncate">${p.name}</span></span>`;
}

/* tone លើតួលេខ៖ យកតែពណ៌ព្រមាន (លឿង · ក្រហម) ពេលត្រូវការការយកចិត្តទុកដាក់ប៉ុណ្ណោះ
   ពណ៌បៃតង ឬខៀវលើតួលេខធម្មតាត្រូវបានមិនអើពើ ដូច្នេះផ្ទាំងស្ងប់ ហើយការព្រមានលេចធ្លោ */
function kpiCard(label, value, sub, tone, href) {
    if (!/rose|red|amber/.test(tone || '')) tone = '';
    // href៖ កាតក្លាយជាតំណទៅបញ្ជី ឬរបាយការណ៍នៅពីក្រោយតួលេខ
    const tag = href ? `a href="${href}"` : 'div';
    return `<${tag} class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm min-w-0 ${href ? 'block group hover:border-slate-300 transition' : ''}">
        <span class="sm-kpi-label text-slate-500 flex items-center justify-between gap-2">${label}${href ? '<i class="fas fa-arrow-right text-[10px] text-slate-300 group-hover:text-slate-600 transition"></i>' : ''}</span>
        <h3 class="sm-kpi-value ${tone || 'text-slate-800'} mt-1 sm-figure">${value}</h3>
        <p class="sm-kpi-sub text-slate-500 mt-1">${sub || ''}</p>
    </${href ? 'a' : 'div'}>`;
}

function emptyState(icon, title, note, action) {
    return `<div class="py-14 px-6 text-center">
        <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3"><i class="fas ${icon} text-2xl"></i></div>
        <h3 class="sm-card-title text-slate-700">${title}</h3>
        <p class="sm-card-sub text-slate-500 mt-1">${note || ''}</p>
        ${action || ''}
    </div>`;
}

function mgrToday() {
    return { start: new Date(businessDate() + 'T12:00'), end: new Date(businessDate() + 'T12:00') };
}

ensureManagerSeed();

/* ===== ការអនុម័ត ឬបដិសេធពីទំព័រអ្នកគ្រប់គ្រង (ឯកសាររចនាលេខ 02 ផ្នែក 3 ខ) =====
   ពិនិត្យច្បាប់ M-RULE 3 (មិនអនុម័តការលក់របស់ខ្លួនឯង) មុនសួរលេខសម្ងាត់ */

async function mgrDecide(reqId, approve) {
    const req = liveApprovals().find(a => a.id === reqId);
    if (!req || req.status !== 'pending') {
        showToast('សំណើនេះត្រូវបានសម្រេចរួចហើយ', 'warning');
        return null;
    }
    if (req.cashierId === ME_MANAGER) {
        showToast('លោកអ្នកមិនអាចសម្រេចលើសំណើពីការលក់របស់ខ្លួនឯងបានទេ · សូមឱ្យអ្នកគ្រប់គ្រងម្នាក់ទៀតសម្រេច', 'error');
        return null;
    }
    let note = '';
    if (!approve) {
        note = await showReasonPrompt({
            title: `បដិសេធ${APPROVAL_TYPE[req.type].label}`,
            message: `${req.saleId} · ${fmtUSD(req.amount)} · មូលហេតុនឹងបង្ហាញទៅអ្នកគិតលុយ`,
            placeholder: 'ឧទាហរណ៍៖ អតិថិជនបានយកទំនិញទៅហើយ · ត្រូវមានវិក្កយបត្រដើម...',
            confirmText: 'បន្ត',
            danger: true
        });
        if (!note) return null;
    }
    let extra = null;
    if (approve && req.type === 'return') {
        const restock = await askReturnOutcome(req.lines);
        if (restock == null) return null;
        extra = { restock };
    }
    const ok = await showPinConfirm({
        title: approve ? `អនុម័ត${APPROVAL_TYPE[req.type].label}` : `បដិសេធ${APPROVAL_TYPE[req.type].label}`,
        message: `${req.saleId} · ${fmtUSD(req.amount)} · ${personName(req.cashierId)}<br>ការសម្រេចនេះមិនអាចត្រឡប់វិញបានទេ`,
        userId: ME_MANAGER,
        confirmText: approve ? 'អនុម័ត' : 'បដិសេធ',
        danger: !approve
    });
    if (!ok) return null;
    const rec = decideApproval(reqId, approve, ME_MANAGER, note, extra);
    showToast(`${approve ? 'បានអនុម័ត' : 'បានបដិសេធ'}${APPROVAL_TYPE[req.type].label} ${req.saleId}`, approve ? 'success' : 'info');
    return rec;
}

/* ===== ក្បួនវាយតម្លៃ និងចាត់ចំណាត់ថ្នាក់បុគ្គលិកសម្រាប់វេន (ផែនការកែលម្អ S4, S17, S22) ===== */

function weeklyHoursFor(refDate) {
    const d = new Date(refDate);
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(start.getDate() - day);
    start.setHours(12, 0, 0, 0);
    const h = {};
    const staff = CASHIERS.concat(MANAGERS);
    staff.forEach(p => { h[p.id] = 0; });
    for (let i = 0; i < 7; i++) {
        const curDate = isoDate(addDays(start, i));
        shiftTemplates().forEach(t => {
            rosterFor(curDate, t.code).forEach(a => {
                if (h[a.cashierId] != null) {
                    if (a.until && a.from) {
                        let span = minutesOf(a.until) - minutesOf(a.from);
                        if (span <= 0) span += 1440;
                        h[a.cashierId] += span / 60;
                    } else if (a.until) {
                        let span = minutesOf(a.until) - minutesOf(t.start);
                        if (span <= 0) span += 1440;
                        h[a.cashierId] += span / 60;
                    } else {
                        h[a.cashierId] += templateHours(t);
                    }
                }
            });
        });
    }
    return h;
}

function rosterCheck(personId, dateStr, code) {
    const t = shiftTemplates().find(x => x.code === code);
    const tHours = t ? templateHours(t) : 8;
    const dow = new Date(dateStr + 'T12:00').getDay();
    const def = (posSettings().staffDefaults || {})[personId] || {};
    const isDayOff = Number(def.dayOff) === dow;
    const isManager = isManagerId(personId);
    const weekHrsMap = weeklyHoursFor(dateStr);
    const weekHrs = Math.round((weekHrsMap[personId] || 0) * 10) / 10;
    const newWeekHrs = Math.round((weekHrs + tHours) * 10) / 10;
    const over48 = newWeekHrs > 48;

    // ម៉ោងថ្ងៃនេះ = ម៉ោងបានធ្វើ + ម៉ោងដែលនៅសល់នៃថតប្រាក់កំពុងបើក (ប៉ាន់ដល់ម៉ោងបិទវេន មិនមែនត្រឹមឥឡូវ)
    const openDrawerNow = posRead(POS_KEYS.shifts, []).find(s => s.status === 'open' && s.cashierId === personId && s.date === dateStr && s.templateCode !== code);
    const openRemain = openDrawerNow ? Math.max(0, (shiftEndDate(openDrawerNow) - new Date()) / 3600000) : 0;
    const workedHrs = Math.round((hoursWorkedToday(personId, dateStr) + openRemain) * 10) / 10;
    const todayTotal = Math.round((workedHrs + tHours) * 10) / 10;
    const over12 = todayTotal > 12;
    const remainHours = Math.max(0, 12 - workedHrs);
    const capM = t ? Math.floor((minutesOf(t.start) + remainHours * 60) / 10) * 10 : 0;
    const capTime = `${pad2(Math.floor((capM % 1440) / 60))}:${pad2(capM % 60)}`;
    const partialAllowed = over12 && remainHours >= 2;
    // វេនខ្លី៖ ម៉ោងក្នុងសប្តាហ៍គិតតែម៉ោងដែលធ្វើពិត
    const weekAfter = partialAllowed ? Math.round((weekHrs + ((capM - minutesOf(t.start) + 1440) % 1440) / 60) * 10) / 10 : newWeekHrs;

    // វេនផ្សេងដែលចាប់ផ្តើមរួច (ឬកំពុងបើក) នៅដដែល = វេនទ្វេ · មានតែវេនមិនទាន់ចាប់ផ្តើមទេ ដែលត្រូវផ្លាស់ចេញ
    const started = x => dateAt(dateStr, x.start) <= new Date();
    const otherTpls = shiftTemplates().filter(x => x.code !== code && !started(x) && rosterFor(dateStr, x.code).some(a => a.cashierId === personId));

    // សម្រាកយ៉ាងហោច 11 ម៉ោងរវាងវេន (D-S3) · វេនយប់ម្សិលមិញ → វេនព្រឹកថ្ងៃនេះ = ធ្វើការជាប់គ្នា
    let backToBack = false;
    if (t) {
        const prevDate = isoDate(addDays(new Date(dateStr + 'T12:00'), -1));
        shiftTemplates().filter(x => minutesOf(x.end) <= minutesOf(x.start)).forEach(n => {
            if (!rosterFor(prevDate, n.code).some(a => a.cashierId === personId)) return;
            let rest = minutesOf(t.start) - minutesOf(n.end);
            if (rest < 0) rest += 1440;
            if (rest < 11 * 60) backToBack = true;
        });
    }

    const blocked = (over12 && !partialAllowed) || backToBack;

    let reason = '';
    if (backToBack) reason = 'ទើបចេញពីវេនយប់ · សម្រាកមិនគ្រប់ 11 ម៉ោង';
    else if (over12 && !partialAllowed) reason = `${todayTotal} ម៉ោងថ្ងៃនេះ · លើស 12 ម៉ោង`;
    else if (partialAllowed) reason = `ធ្វើការ ${workedHrs} ម៉ោងរួច · ធ្វើបានត្រឹម ${capTime}`;
    else if (openDrawerNow) reason = `កំពុងធ្វើការ${openDrawerNow.templateName} លើ ${openDrawerNow.register}`;
    else if (over48) reason = `${newWeekHrs} ម៉ោងក្នុងសប្តាហ៍ · លើស 48`;

    return {
        ok: !blocked,
        blocked,
        reason,
        over48,
        over12,
        partialAllowed,
        capTime,
        remainHours: Math.round(remainHours * 10) / 10,
        hoursBefore: weekHrs,
        hoursAfter: weekAfter,
        workedToday: workedHrs,
        todayTotal,
        isDayOff,
        isManager,
        leavesGap: otherTpls.map(x => x.name).join(' · '),
        otherTpls,
        openDrawerNow,
        backToBack
    };
}

function rankCandidates(dateStr, code) {
    const t = shiftTemplates().find(x => x.code === code);
    const currentRoster = rosterFor(dateStr, code);
    const staff = CASHIERS.concat(MANAGERS).filter(p => !currentRoster.some(a => a.cashierId === p.id));

    const ranked = staff.map(p => {
        const check = rosterCheck(p.id, dateStr, code);
        let rank = 1;
        let chip = 'ទំនេរ';
        let tone = 'emerald';

        if (check.blocked) {
            rank = 99;
            chip = check.backToBack ? 'ធ្វើការជាប់គ្នា' : 'លើស 12 ម៉ោង';
            tone = 'rose';
        } else if (check.partialAllowed) {
            rank = 6;
            chip = `ជំនួសត្រឹម ${t ? t.start : '14:00'}–${check.capTime}`;
            tone = 'amber';
        } else if (check.leavesGap) {
            rank = 5;
            chip = `ផ្លាស់ពី${check.leavesGap} · បង្កើតចន្លោះ`;
            tone = 'amber';
        } else if (check.over48) {
            rank = check.isDayOff ? 4 : 3;
            chip = 'លើស 48 ម៉ោង';
            tone = 'amber';
        } else if (check.isDayOff) {
            rank = 3;
            chip = 'ថ្ងៃឈប់ · ម៉ោងបន្ថែម';
            tone = 'amber';
        } else if (check.isManager) {
            rank = 2;
            chip = 'អ្នកគ្រប់គ្រង';
            tone = 'slate';
        } else {
            rank = 1;
            chip = 'ទំនេរ';
            tone = 'emerald';
        }

        return Object.assign({
            id: p.id,
            name: p.name,
            rank,
            chip,
            tone
        }, check);
    });

    return ranked.sort((a, b) => {
        if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
        if (a.rank !== b.rank) return a.rank - b.rank;
        return a.hoursBefore - b.hoursBefore;
    });
}

function weekGaps(weekStart) {
    const gaps = [];
    const ds = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    ds.forEach(d => {
        const dateStr = isoDate(d);
        shiftTemplates().forEach(t => {
            const list = rosterFor(dateStr, t.code);
            if (!list.length) {
                const candidates = rankCandidates(dateStr, t.code);
                const best = candidates.find(c => !c.blocked);
                gaps.push({
                    date: dateStr,
                    dow: d.getDay(),
                    template: t,
                    suggested: best || null
                });
            }
        });
    });
    return gaps;
}

