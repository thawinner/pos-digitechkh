/* អ្នកគ្រប់គ្រងវេន — ទិន្នន័យប្រវត្តិ និងការគណនា (ឯកសាររចនាលេខ 02 ផ្នែក 7)

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
const MGR_SEED_KEY = 'pos_mgr_seed_v1';

/* ===== លេខចៃដន្យដែលអាចបង្កើតឡើងវិញបាន ===== */

function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
}

function rngFor(key) {
    let a = hashStr(key);
    return () => {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function pick(rng, list) {
    return list[Math.floor(rng() * list.length)];
}

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

/* ===== ការបង្កើតប្រវត្តិ ===== */

function genPay(rng, due) {
    const r = rng();
    const rate = 4100;
    if (r < 0.42) {
        const opts = [Math.ceil(due), Math.ceil(due / 5) * 5, Math.ceil(due / 10) * 10];
        let usd = pick(rng, opts);
        if (usd < due) usd = Math.ceil(due);
        return { usdCash: usd, khrCash: 0, khqr: 0 };
    }
    if (r < 0.67) {
        const k = due * rate;
        return { usdCash: 0, khrCash: pick(rng, [Math.ceil(k / 1000) * 1000, Math.ceil(k / 5000) * 5000, Math.ceil(k / 10000) * 10000]), khqr: 0 };
    }
    if (r < 0.93) return { usdCash: 0, khrCash: 0, khqr: Math.round(due * 100) / 100 };
    const usd = Math.floor(due);
    return { usdCash: usd, khrCash: Math.ceil((due - usd) * rate / 1000) * 1000 || 1000, khqr: 0 };
}

function genShift(dateStr, register, tpl, cashierId, ctx) {
    const rng = rngFor(`${dateStr}|${register}|${tpl.code}`);
    const id = `SHIFT-${dateStr.replace(/-/g, '')}-${register.replace('-', '')}-${tpl.code}`;
    const start = dateAt(dateStr, tpl.start);
    let end = dateAt(dateStr, tpl.end);
    if (end <= start) end = addDays(end, 1);
    const risky = cashierId === 'CAS-03';
    const managers = MANAGERS.map(m => m.id);
    const st = posSettings();
    const reasons = st.reasons;

    const shift = {
        id, date: dateStr, register, cashierId,
        templateCode: tpl.code, templateName: tpl.name, start: tpl.start, end: tpl.end,
        openedAt: isoLocal(new Date(start.getTime() + Math.floor(rng() * 8) * 60000)),
        fxRate: 4100, floatUSD: 200, floatKHR: 400000, floatIssuedUSD: 200, floatIssuedKHR: 400000,
        floatApprovedBy: pick(rng, managers), status: 'open', generated: true
    };

    const nowMs = Date.now();
    const count = 18 + Math.floor(rng() * 22);
    const span = end - start - 15 * 60000;
    const times = Array.from({ length: count }, () => start.getTime() + 10 * 60000 + rng() * span).sort((a, b) => a - b);
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
        const lines = [];
        const n = 1 + Math.floor(rng() * 4);
        for (let k = 0; k < n; k++) {
            const p = pick(rng, PRODUCTS);
            if (lines.some(l => l.sku === p.sku)) continue;
            lines.push({ sku: p.sku, qty: 1 + Math.floor(rng() * (p.category === 'stationery' ? 6 : 3)) });
        }
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
        const pay = genPay(rng, due);
        const sale = {
            id: prefix + String(i + 1).padStart(4, '0'), time: isoLocal(new Date(t)), shiftId: id, cashierId, register,
            fxRate: 4100, items: lines, pay, discountPercent, discountReason, discountApproverId, customerId: '',
            status: 'completed', generated: true
        };
        sale.change = splitChange(paidTotal(pay, 4100) - due, 4100, defaultChangeMode(pay));

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
            const amount = Math.round(getProduct(line.sku).price * (1 - discountPercent / 100) * 100) / 100;
            const method = methodOf(sale) === 'split' ? 'usdCash' : methodOf(sale);
            const reason = pick(rng, reasons.return);
            sale.returns = [{ id: `REQG-${sale.id}`, lines: [{ sku: line.sku, qty: 1 }], amount, method,
                amountKHR: method === 'khrCash' ? Math.round(amount * 4100 / 100) * 100 : 0, reason, approvedBy: approver, at: decidedAt }];
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
    if (usdIn > 150 && sales.length > 6) {
        const at = new Date(sales[Math.floor(sales.length * 0.7)].time).getTime();
        const pending = !ctx.closed && rng() < 0.7;
        movements.push({
            id: `MVG-${id}-D`, type: 'drop', register, shiftId: id, usd: 100, khr: 0, reason: '', ref: '',
            createdBy: cashierId, createdAt: isoLocal(new Date(at)), status: pending ? 'pending' : 'confirmed', generated: true,
            confirmedBy: pending ? '' : pick(rng, managers), confirmedAt: pending ? '' : isoLocal(new Date(at + 15 * 60000)),
            receivedUSD: pending ? 0 : 100, receivedKHR: 0
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
        const v = varianceOf(countedUSD, countedKHR, s.expectedUSD, s.expectedKHR, 4100);
        const closedAt = new Date(end.getTime() + (3 + Math.floor(rng() * 15)) * 60000);
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
    const live = liveShifts();
    const liveDays = new Set(live.map(s => `${s.date}|${s.register}`));
    const now = new Date();
    const bdate = businessDate();
    const tpls = shiftTemplates();

    for (let d = HISTORY_DAYS; d >= 0; d--) {
        const date = addDays(new Date(bdate + 'T12:00'), -d);
        const dateStr = isoDate(date);
        // ប្រវត្តិធ្វើតាមកាលវិភាគវេន ដូច្នេះម៉ោងធ្វើការ និងបញ្ជរត្រូវគ្នាជានិច្ច
        tpls.forEach(tpl => {
            rosterFor(dateStr, tpl.code).forEach(a => {
                const register = a.register;
                if (liveDays.has(`${dateStr}|${register}`)) return;
                const start = dateAt(dateStr, tpl.start);
                let end = dateAt(dateStr, tpl.end);
                if (end <= start) end = addDays(end, 1);
                if (start > now) return;
                const closed = now >= new Date(end.getTime() + 20 * 60000);
                // ត្រួតពិនិត្យរួច លើកលែងតែវេនចុងក្រោយនៃថ្ងៃប្រតិបត្តិការ (អ្នកគ្រប់គ្រងពិនិត្យនៅព្រឹកបន្ទាប់)
                const reviewed = closed && !(d === 0 && tpl.code === tpls[tpls.length - 1].code);
                const g = genShift(dateStr, register, tpl, a.cashierId, { closed, reviewed });
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
    if (posRead(MGR_SEED_KEY, null)) return;
    const shifts = withOverlay(generateHistory().shifts, 'shifts').filter(s => s.register === 'POS-02');
    const target = shifts.sort((a, b) => b.openedAt.localeCompare(a.openedAt))[0];
    if (target) {
        const sales = withOverlay(generateHistory().sales, 'sales')
            .filter(s => s.shiftId === target.id && !isVoided(s) && !(s.returns || []).length)
            .sort((a, b) => b.time.localeCompare(a.time));
        const reasons = posSettings().reasons;
        const list = liveApprovals();
        if (sales[1]) {
            const s = sales[1];
            list.push({ id: 'REQ-SEED-01', type: 'void', saleId: s.id, amount: saleTotals(s.items, s.discountPercent).gross,
                reason: reasons.void[0], shiftId: target.id, register: target.register, cashierId: target.cashierId,
                raisedAt: isoLocal(new Date(new Date(s.time).getTime() + 4 * 60000)), status: 'pending', mode: 'remote' });
        }
        if (sales[3]) {
            const s = sales[3];
            const line = s.items[0];
            const amount = Math.round(getProduct(line.sku).price * (1 - (s.discountPercent || 0) / 100) * 100) / 100;
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

function decideApproval(reqId, approve, approverId, note) {
    const req = liveApprovals().find(a => a.id === reqId);
    if (!req || req.status !== 'pending') return null;
    const at = isoLocal(new Date());
    const rec = Object.assign({}, req, { status: approve ? 'approved' : 'rejected', decidedBy: approverId, decidedAt: at, decisionNote: note || '' });
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
    const s = isoDate(range.start);
    const e = isoDate(range.end || range.start);
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
window.addEventListener('bms-store-changed', () => { SHIFT_DATE_CACHE = null; });

function salesInRange(range, filter) {
    const f = filter || {};
    return mgrAllSales().filter(s => inRange(saleBizDate(s), range)
        && (!f.register || s.register === f.register)
        && (!f.cashierId || s.cashierId === f.cashierId));
}

function aggregateSales(sales) {
    const acc = { tx: 0, gross: 0, net: 0, vat: 0, discount: 0, qty: 0, returns: 0, voids: 0, usdCash: 0, khrCashUSD: 0, khqr: 0 };
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

/* ផ្លាកលេខរបស់អ្នកគិតលុយមិនប្រើនៅទីនេះ */
function totalPending() {
    return 0;
}

function portalNotifications() {
    const root = document.body.dataset.roleRoot || '../..';
    const list = [];
    pendingApprovals().slice(0, 4).forEach(a => list.push({
        icon: 'mdi:shield-alert-outline', tone: 'warning',
        title: `${APPROVAL_TYPE[a.type].label} ${a.saleId} · ${fmtUSD(a.amount)}`,
        note: `${personName(a.cashierId)} · ${a.register} · ${escapeText(a.reason)}`,
        time: `${fmtDate(a.raisedAt)} ${fmtTime(a.raisedAt)}`,
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

function kpiCard(label, value, sub, tone) {
    return `<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm min-w-0">
        <span class="sm-kpi-label text-slate-500">${label}</span>
        <h3 class="sm-kpi-value ${tone || 'text-slate-800'} mt-1 sm-figure">${value}</h3>
        <p class="sm-kpi-sub text-slate-500 mt-1">${sub || ''}</p>
    </div>`;
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
    const ok = await showPinConfirm({
        title: approve ? `អនុម័ត${APPROVAL_TYPE[req.type].label}` : `បដិសេធ${APPROVAL_TYPE[req.type].label}`,
        message: `${req.saleId} · ${fmtUSD(req.amount)} · ${personName(req.cashierId)}<br>ការសម្រេចនេះមិនអាចត្រឡប់វិញបានទេ`,
        userId: ME_MANAGER,
        confirmText: approve ? 'អនុម័ត' : 'បដិសេធ',
        danger: !approve
    });
    if (!ok) return null;
    const rec = decideApproval(reqId, approve, ME_MANAGER, note);
    showToast(`${approve ? 'បានអនុម័ត' : 'បានបដិសេធ'}${APPROVAL_TYPE[req.type].label} ${req.saleId}`, approve ? 'success' : 'info');
    return rec;
}
