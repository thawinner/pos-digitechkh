/* ===== ទិន្នន័យម្ចាស់ហាង (ផ្ទុកតែលើទំព័រ admin/* ប៉ុណ្ណោះ) =====
   ឯកសាររចនាលេខ 03៖ ថ្លៃដើម និងប្រាក់ចំណេញ មានតែម្ចាស់ហាងប៉ុណ្ណោះដែលឃើញ។
   data.js និង manager-data.js មិនដែលផ្ទុកថ្លៃដើមទេ ដូច្នេះអ្នកគិតលុយ និងអ្នកគ្រប់គ្រងវេនមិនអាចមើលឃើញ។
   លំដាប់ស្គ្រីប៖ ui-components → data → manager-data → admin-data → portal */

/* ថ្លៃដើមក្នុងមួយឯកតា (ដុល្លារ) — ប្រហែល 55–75% នៃតម្លៃលក់ តាមប្រភេទទំនិញ */
const COST_SEED = {
    '8850001': 0.30, '8850002': 0.85, '8850003': 1.25, '8850004': 1.55,
    '8860001': 0.95, '8860002': 0.80, '8860003': 0.62, '8860004': 1.60,
    '8870001': 2.55, '8870002': 3.10, '8870003': 1.25, '8870004': 1.95,
    '8880001': 0.45, '8880002': 0.18, '8880003': 1.05,
    '8890001': 1.55, '8890002': 2.10, '8890003': 1.40,
    '8850005': 0.42, '8850006': 0.38, '8850007': 0.58, '8850008': 0.62, '8860005': 0.26, '8860006': 0.72,
    '8860007': 0.30, '8860008': 1.90, '8870005': 1.35, '8870006': 0.70, '8870007': 0.85, '8880004': 0.12,
    '8880005': 0.20, '8880006': 0.48, '8890004': 2.90, '8890005': 4.20, '8890006': 2.05
};
const COSTS_KEY = 'pos_costs';
const ADMIN_LOG_KEY = 'pos_admin_log';

function costOf(sku) {
    const edits = posRead(COSTS_KEY, {});
    return edits[sku] != null ? edits[sku] : (COST_SEED[sku] || 0);
}

/* តម្លៃមិនរួមអាករ (តម្លៃលក់រួមអាករ 10%) */
function exVat(amount) {
    return amount / 1.10;
}

function marginOf(p) {
    const net = exVat(p.price);
    return net > 0 ? (net - costOf(p.sku)) / net * 100 : 0;
}

/* ចំណូល ថ្លៃដើម និងប្រាក់ចំណេញដុល នៃការលក់មួយ (ដកការប្រគល់វិញ · វិក្កយបត្រលុបចោល = 0) */
function saleProfit(s) {
    if (isVoided(s)) return { net: 0, cost: 0, profit: 0, qty: 0 };
    const keep = 1 - (Math.min(Math.max(Number(s.discountPercent) || 0, 0), 100) / 100);
    let net = 0;
    let cost = 0;
    let qty = 0;
    s.items.forEach(l => {
        const q = l.qty - returnedQty(s, l.sku);
        if (q <= 0) return;
        net += exVat(linePrice(l) * q * keep);
        cost += costOf(l.sku) * q;
        qty += q;
    });
    return { net, cost, profit: net - cost, qty };
}

function profitOf(sales) {
    const acc = { tx: 0, net: 0, cost: 0, profit: 0, qty: 0, gross: 0, voids: 0 };
    sales.forEach(s => {
        if (isVoided(s)) { acc.voids += 1; return; }
        const p = saleProfit(s);
        acc.tx += 1;
        acc.net += p.net;
        acc.cost += p.cost;
        acc.profit += p.profit;
        acc.qty += p.qty;
        acc.gross += p.net * 1.10;
    });
    acc.margin = acc.net > 0 ? acc.profit / acc.net * 100 : 0;
    acc.avg = acc.tx ? acc.gross / acc.tx : 0;
    return acc;
}

/* ថ្ងៃប្រតិបត្តិការ n ចុងក្រោយ (ចាស់ → ថ្មី) ជាមួយលក់ ប្រាក់ចំណេញ និងភាពខុសគ្នាសាច់ប្រាក់ */
function adminDays(n) {
    const today = businessDate();
    const byDay = {};
    mgrAllSales().forEach(s => {
        const d = saleBizDate(s);
        (byDay[d] = byDay[d] || []).push(s);
    });
    const variance = {};
    mgrAllShifts().forEach(sh => {
        const v = shiftVariance(sh);
        if (v) variance[sh.date] = (variance[sh.date] || 0) + v.diff;
    });
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = isoDate(addDays(new Date(today + 'T12:00'), -i));
        out.push(Object.assign({ date: d, variance: variance[d] || 0 }, profitOf(byDay[d] || [])));
    }
    return out;
}

function sumDays(days) {
    const acc = { tx: 0, net: 0, cost: 0, profit: 0, gross: 0, variance: 0, voids: 0 };
    days.forEach(d => Object.keys(acc).forEach(k => { acc[k] += d[k] || 0; }));
    acc.margin = acc.net > 0 ? acc.profit / acc.net * 100 : 0;
    acc.avg = acc.tx ? acc.gross / acc.tx : 0;
    return acc;
}

function pctChange(now, before) {
    if (!before) return null;
    return (now - before) / Math.abs(before) * 100;
}

/* ===== ការកែប្រែដោយម្ចាស់ហាង (បុគ្គលិក ទំនិញ) — រាល់ការកែត្រូវកត់ត្រាក្នុងកំណត់ហេតុសវនកម្ម ===== */

function adminLog(type, note, extra) {
    const list = posRead(ADMIN_LOG_KEY, []);
    list.unshift(Object.assign({ id: newId('AL'), type, note, at: isoLocal(new Date()), by: ME_MANAGER }, extra || {}));
    posWrite(ADMIN_LOG_KEY, list.slice(0, 500));
}

function adminLogList() {
    return posRead(ADMIN_LOG_KEY, []);
}

function updateStaff(id, patch, note) {
    const st = staffStore();
    st.changes = st.changes || {};
    st.changes[id] = Object.assign({}, st.changes[id] || {}, patch);
    posWrite(STAFF_KEY, st);
    adminLog('staff', note, { target: id });
}

function nextStaffId(role) {
    const prefix = { cashier: 'CAS', manager: 'MGR', admin: 'ADM' }[role];
    const used = loadStaff().filter(p => p.id.startsWith(prefix)).map(p => Number(p.id.split('-')[1]) || 0);
    return `${prefix}-${String(Math.max(0, ...used) + 1).padStart(2, '0')}`;
}

function addStaff(person) {
    const st = staffStore();
    st.added = (st.added || []).concat([person]);
    posWrite(STAFF_KEY, st);
    adminLog('staff', `បន្ថែម${ROLE_NAME[person.role]} ${person.name}`, { target: person.id });
}

function setStaffPin(id, pin) {
    const pins = posRead('pos_pins', {});
    pins[id] = pin;
    posWrite('pos_pins', pins);
    const p = loadStaff().find(x => x.id === id);
    adminLog('pin', `កំណត់លេខសម្ងាត់ថ្មីឱ្យ ${p ? p.name : id}`, { target: id });
}

function pinTaken(pin, exceptId) {
    const custom = posRead('pos_pins', {});
    return loadStaff().some(p => p.id !== exceptId && p.active && (custom[p.id] || p.pin) === pin);
}

function updateCatalog(sku, patch, note) {
    const edits = posRead(CATALOG_KEY, {});
    edits[sku] = Object.assign({}, edits[sku] || {}, patch);
    posWrite(CATALOG_KEY, edits);
    adminLog('catalog', note, { target: sku });
}

function setCost(sku, cost, note) {
    const edits = posRead(COSTS_KEY, {});
    edits[sku] = cost;
    posWrite(COSTS_KEY, edits);
    adminLog('cost', note, { target: sku });
}

/* ===== កំណត់ហេតុសវនកម្ម — រួមបញ្ចូលការអនុម័ត ការកំណត់ បុគ្គលិក ទំនិញ និងព្រឹត្តិការណ៍សំខាន់ៗ ===== */

const AUDIT_KINDS = {
    approval: { label: 'ការអនុម័ត', icon: 'fa-shield-halved', tone: 'indigo' },
    settings: { label: 'ការកំណត់', icon: 'fa-sliders', tone: 'slate' },
    staff: { label: 'បុគ្គលិក', icon: 'fa-user-gear', tone: 'emerald' },
    catalog: { label: 'ទំនិញ និងតម្លៃ', icon: 'fa-tag', tone: 'amber' },
    shift: { label: 'វេន', icon: 'fa-cash-register', tone: 'cyan' },
    security: { label: 'សុវត្ថិភាព', icon: 'fa-key', tone: 'rose' }
};

function auditTrail() {
    const out = [];
    adminLogList().forEach(x => out.push({
        at: x.at, by: x.by, kind: x.type === 'pin' ? 'security' : x.type === 'cost' ? 'catalog' : x.type, title: x.note, detail: ''
    }));
    settingsHistory().forEach(h => h.changes.forEach(c => out.push(c.key === 'pin'
        ? { at: h.at, by: h.by, kind: 'security', title: `កំណត់លេខសម្ងាត់ថ្មីឱ្យ ${personName(c.who)}`, detail: '' }
        : { at: h.at, by: h.by, kind: 'settings', title: SETTING_LABELS[c.key] || c.key, detail: typeof c.to === 'object' ? 'បានកែ' : `${c.from} → ${c.to}` })));
    mgrAllApprovals().filter(a => a.decidedBy).forEach(a => out.push({
        at: a.decidedAt, by: a.decidedBy, kind: 'approval',
        title: `${a.status === 'approved' ? 'អនុម័ត' : 'បដិសេធ'}${APPROVAL_TYPE[a.type].label} ${a.saleId}`,
        detail: `${fmtUSD(a.amount)} · ${personName(a.cashierId)} · ${a.reason}`, tone: a.status === 'approved' ? '' : 'rose'
    }));
    mgrAllEvents().forEach(e => {
        if (e.type === 'override_denied') out.push({ at: e.at, by: e.approverId || e.actorId, kind: 'security', title: 'លេខសម្ងាត់អ្នកគ្រប់គ្រងខុស', detail: `${e.register || ''} · ${personName(e.cashierId)}` });
        if (e.type === 'shift_reviewed') out.push({ at: e.at, by: e.actorId, kind: 'shift', title: `ចុះហត្ថលេខាត្រួតពិនិត្យ ${e.shiftId}`, detail: personName(e.cashierId) });
        if (e.type === 'discount' && e.approverId) out.push({ at: e.at, by: e.approverId, kind: 'approval', title: `អនុម័តបញ្ចុះតម្លៃ ${e.note}`, detail: `${e.saleId} · ${e.reason}` });
    });
    mgrAllShifts().filter(s => s.status === 'reviewed' && s.reviewedBy && s.generated).forEach(s => out.push({
        at: s.reviewedAt, by: s.reviewedBy, kind: 'shift', title: `ចុះហត្ថលេខាត្រួតពិនិត្យ ${s.id}`, detail: personName(s.cashierId)
    }));
    return out.filter(x => x.at).sort((a, b) => b.at.localeCompare(a.at));
}
