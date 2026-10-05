/* ===== ទិន្នន័យម្ចាស់ហាង (ផ្ទុកតែលើទំព័រ admin/* ប៉ុណ្ណោះ) =====
   ឯកសាររចនាលេខ 03៖ ថ្លៃដើម និងប្រាក់ចំណេញ មានតែម្ចាស់ហាងប៉ុណ្ណោះដែលឃើញ។
   data.js និង manager-data.js មិនដែលផ្ទុកថ្លៃដើមទេ ដូច្នេះអ្នកគិតលុយ និងអ្នកគ្រប់គ្រងមិនអាចមើលឃើញ។
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
const STOCK_COSTS_KEY = 'pos_stock_costs';
const ADMIN_LOG_KEY = 'pos_admin_log';

function getStockCosts() {
    return posRead(STOCK_COSTS_KEY, {});
}

function isStockMoveConfirmed(move) {
    if (!move) return false;
    const costs = getStockCosts();
    return Boolean(costs[move.id] || move.costConfirmed);
}

function stockMoveUnitCost(move) {
    if (!move) return 0;
    const costs = getStockCosts();
    if (costs[move.id] && costs[move.id].cost != null) {
        return Number(costs[move.id].cost);
    }
    return costOf(move.sku);
}

function allStockMovesList() {
    if (typeof mgrStockMoves === 'function') {
        return mgrStockMoves();
    }
    const stored = typeof storedStockMoves === 'function' ? storedStockMoves() : [];
    const histGen = typeof generateStockHistory === 'function' ? generateStockHistory() : null;
    const hist = histGen && histGen.historicMoves ? histGen.historicMoves : (Array.isArray(histGen) ? histGen : []);
    return stored.concat(hist);
}

/* ប្រមូលការទទួលស្តុកចូលទាំងអស់ (ទាំងទិន្នន័យផ្ទុក និងប្រវត្តិ) ចងក្រងតាមវិក្កយបត្រ */
function allStockInShipments() {
    const all = allStockMovesList().filter(m => m.type === 'stock_in');
    const groups = {};

    all.forEach(m => {
        const inv = m.invoice || m.ref || ('IN-' + (m.date || m.at.slice(0, 10)));
        if (!groups[inv]) {
            groups[inv] = {
                id: inv,
                invoice: inv,
                supplier: m.supplier || 'អ្នកផ្គត់ផ្គង់ទូទៅ',
                date: m.date || m.at.slice(0, 10),
                at: m.at,
                by: m.by || ME_MANAGER,
                note: m.note || '',
                lines: [],
                totalQty: 0,
                totalCost: 0,
                confirmed: true,
                unconfirmedCount: 0
            };
        }
        const g = groups[inv];
        g.lines.push(m);
        g.totalQty += Number(m.qty) || 0;
        const unitCost = stockMoveUnitCost(m);
        g.totalCost += (Number(m.qty) || 0) * unitCost;
        if (!isStockMoveConfirmed(m)) {
            g.confirmed = false;
            g.unconfirmedCount += 1;
        }
        if (m.at > g.at) g.at = m.at;
    });

    return Object.values(groups).sort((a, b) => b.at.localeCompare(a.at));
}

function unconfirmedStockInCount() {
    return allStockInShipments().filter(s => !s.confirmed).length;
}

function findStockInShipment(invoice) {
    return allStockInShipments().find(s => s.invoice === invoice || s.id === invoice) || null;
}

/* បញ្ជាក់ថ្លៃដើមសម្រាប់ការទទួលស្តុកមួយវិក្កយបត្រ */
function confirmStockInShipment(invoice, lineCostMap, note) {
    const costs = getStockCosts();
    const shipment = findStockInShipment(invoice);
    const nowIso = isoLocal(new Date());

    if (shipment) {
        shipment.lines.forEach(line => {
            const unitCost = Number(lineCostMap[line.id] != null ? lineCostMap[line.id] : (lineCostMap[line.sku] != null ? lineCostMap[line.sku] : stockMoveUnitCost(line)));
            costs[line.id] = { cost: unitCost, by: ME_MANAGER, at: nowIso };
            // ធ្វើបច្ចុប្បន្នភាពថ្លៃដើមទំនិញចុងក្រោយ
            setCost(line.sku, unitCost, note || `បញ្ជាក់ថ្លៃដើមតាមវិក្កយបត្រ ${invoice}`);
        });
    } else {
        Object.keys(lineCostMap).forEach(k => {
            const unitCost = Number(lineCostMap[k]);
            costs[k] = { cost: unitCost, by: ME_MANAGER, at: nowIso };
        });
    }

    posWrite(STOCK_COSTS_KEY, costs);

    // ប្រសិនបើមានក្នុង storedStockMoves កត់ត្រាជា costConfirmed: true
    const stored = typeof storedStockMoves === 'function' ? storedStockMoves() : [];
    let storedChanged = false;
    stored.forEach(m => {
        if ((m.invoice === invoice || m.ref === invoice) && m.type === 'stock_in') {
            m.costConfirmed = true;
            storedChanged = true;
        }
    });
    if (storedChanged && typeof STOCK_KEYS !== 'undefined') {
        posWrite(STOCK_KEYS.moves, stored);
    }

    adminLog('stock_cost', note || `បញ្ជាក់ថ្លៃដើមវិក្កយបត្រ ${invoice} (${Object.keys(lineCostMap).length} មុខ)`, { invoice });
}

/* គណនាតម្លៃស្តុកសរុបគិតជាថ្លៃដើម ($) */
function totalStockValueAtCost() {
    const levels = typeof onHandLevels === 'function' ? onHandLevels() : {};
    let totalValue = 0;
    let totalUnits = 0;
    let unconfirmedCount = 0;
    const byCategory = {};
    const productList = [];

    CATEGORIES.forEach(c => {
        byCategory[c.id] = { id: c.id, label: c.label, units: 0, value: 0, products: 0 };
    });

    PRODUCTS.forEach(p => {
        const qty = levels[p.sku] != null ? levels[p.sku] : (p.opening || 0);
        const cost = costOf(p.sku);
        const val = Math.max(0, qty) * cost;
        const status = typeof stockStatusOf === 'function' ? stockStatusOf(p, qty) : 'ok';
        const confirmed = COST_SEED[p.sku] != null || posRead(COSTS_KEY, {})[p.sku] != null;

        totalValue += val;
        totalUnits += Math.max(0, qty);
        if (!confirmed) unconfirmedCount += 1;

        if (byCategory[p.category]) {
            byCategory[p.category].units += Math.max(0, qty);
            byCategory[p.category].value += val;
            byCategory[p.category].products += 1;
        }

        productList.push({
            sku: p.sku,
            name: p.name,
            category: p.category,
            unit: p.unit,
            price: p.price,
            cost,
            qty,
            value: val,
            status,
            confirmed,
            minStock: p.minStock || 5,
            reorderQty: p.reorderQty || 12
        });
    });

    return {
        totalValue,
        totalUnits,
        productCount: PRODUCTS.length,
        unconfirmedCount,
        byCategory: Object.values(byCategory),
        products: productList
    };
}

/* របាយការណ៍ការខាតបង់ស្តុក ($) តាមចន្លោះកាលបរិច្ឆេទ */
function shrinkageStats(range) {
    const all = allStockMovesList();
    const startStr = range && range.start ? range.start : '';
    const endStr = range && range.end ? range.end : '';

    const list = [];
    all.forEach(m => {
        const mDate = (m.date || m.at.slice(0, 10));
        if (startStr && mDate < startStr) return;
        if (endStr && mDate > endStr) return;

        let isShrink = false;
        let shrinkReason = m.reason || '';

        if (m.type === 'adjust' && STOCK_ADJUST_REASONS[m.reason] && STOCK_ADJUST_REASONS[m.reason].shrink) {
            isShrink = true;
        } else if (m.type === 'count' && m.qty < 0) {
            isShrink = true;
            shrinkReason = 'count_shortage';
        }

        if (isShrink) {
            const p = getProduct(m.sku);
            const unitCost = stockMoveUnitCost(m);
            const qty = Math.abs(m.qty);
            const costValue = qty * unitCost;
            const retailValue = qty * (p ? p.price : 0);

            list.push({
                id: m.id,
                sku: m.sku,
                name: p ? p.name : m.sku,
                category: p ? p.category : '',
                unit: p ? p.unit : 'ឯកតា',
                qty,
                unitCost,
                costValue,
                retailValue,
                reason: shrinkReason,
                by: m.by || ME_MANAGER,
                at: m.at,
                ref: m.ref || '',
                note: m.note || ''
            });
        }
    });

    list.sort((a, b) => b.at.localeCompare(a.at));

    const totalValue = list.reduce((s, x) => s + x.costValue, 0);
    const totalQty = list.reduce((s, x) => s + x.qty, 0);
    const totalRetail = list.reduce((s, x) => s + x.retailValue, 0);

    const byReason = {};
    const byStaff = {};
    const byCategory = {};
    const byProduct = {};

    list.forEach(x => {
        // មូលហេតុ
        const rk = x.reason || 'other';
        const rLabel = rk === 'count_shortage' ? 'ខ្វះពេលរាប់ស្តុក' : (STOCK_ADJUST_REASONS[rk] ? STOCK_ADJUST_REASONS[rk].label : rk);
        byReason[rk] = byReason[rk] || { key: rk, label: rLabel, count: 0, qty: 0, value: 0 };
        byReason[rk].count += 1;
        byReason[rk].qty += x.qty;
        byReason[rk].value += x.costValue;

        // បុគ្គលិក
        const sk = x.by || ME_MANAGER;
        byStaff[sk] = byStaff[sk] || { key: sk, label: personName(sk), count: 0, qty: 0, value: 0 };
        byStaff[sk].count += 1;
        byStaff[sk].qty += x.qty;
        byStaff[sk].value += x.costValue;

        // ប្រភេទ
        const ck = x.category || 'other';
        byCategory[ck] = byCategory[ck] || { key: ck, label: categoryLabel(ck), count: 0, qty: 0, value: 0 };
        byCategory[ck].count += 1;
        byCategory[ck].qty += x.qty;
        byCategory[ck].value += x.costValue;

        // មុខទំនិញ
        byProduct[x.sku] = byProduct[x.sku] || { sku: x.sku, name: x.name, count: 0, qty: 0, value: 0, unit: x.unit };
        byProduct[x.sku].count += 1;
        byProduct[x.sku].qty += x.qty;
        byProduct[x.sku].value += x.costValue;
    });

    return {
        totalValue,
        totalQty,
        totalRetail,
        eventsCount: list.length,
        byReason: Object.values(byReason).sort((a, b) => b.value - a.value),
        byStaff: Object.values(byStaff).sort((a, b) => b.value - a.value),
        byCategory: Object.values(byCategory).sort((a, b) => b.value - a.value),
        byProduct: Object.values(byProduct).sort((a, b) => b.value - a.value),
        list
    };
}

/* ===== កំណត់ហេតុសវនកម្ម — រួមបញ្ចូលការអនុម័ត ការកំណត់ បុគ្គលិក ទំនិញ ស្តុក និងព្រឹត្តិការណ៍សំខាន់ៗ ===== */

const AUDIT_KINDS = {
    approval: { label: 'ការអនុម័ត', icon: 'fa-shield-halved', tone: 'indigo' },
    settings: { label: 'ការកំណត់', icon: 'fa-sliders', tone: 'slate' },
    staff: { label: 'បុគ្គលិក', icon: 'fa-user-gear', tone: 'emerald' },
    catalog: { label: 'ទំនិញ និងតម្លៃ', icon: 'fa-tag', tone: 'amber' },
    stock: { label: 'ស្តុកទំនិញ', icon: 'fa-boxes-stacked', tone: 'blue' },
    shift: { label: 'វេន', icon: 'fa-cash-register', tone: 'cyan' },
    roster: { label: 'កាលវិភាគ', icon: 'fa-calendar-days', tone: 'indigo' },
    security: { label: 'សុវត្ថិភាព', icon: 'fa-key', tone: 'rose' }
};

function auditTrail() {
    const out = [];
    adminLogList().forEach(x => out.push({
        at: x.at, by: x.by, kind: x.type === 'pin' ? 'security' : x.type === 'cost' || x.type === 'stock_cost' ? 'stock' : x.type,
        title: x.note, detail: x.extra && x.extra.invoice ? `វិក្កយបត្រ: ${x.extra.invoice}` : ''
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
        if (e.type === 'roster_assign') out.push({ at: e.at, by: e.actorId, kind: 'roster', title: `ចាត់តាំង ${personName(e.personId)} ទៅ ${e.templateName || e.templateCode}`, detail: `${e.date} · ${e.register}${e.reason ? ' · ' + e.reason : ''}${e.movedFrom ? ' · ផ្លាស់ពី ' + e.movedFrom : ''}${e.replaced ? ' · ជំនួស ' + personName(e.replaced) : ''}` });
        if (e.type === 'roster_remove') out.push({ at: e.at, by: e.actorId, kind: 'roster', title: `ដក ${personName(e.personId)} ចេញពី ${e.templateName || e.templateCode}`, detail: `${e.date} · ${e.register}` });
        if (e.type === 'roster_undo') out.push({ at: e.at, by: e.actorId, kind: 'roster', title: 'មិនធ្វើវិញនូវការកែប្រែកាលវិភាគ', detail: `${e.date || ''} · ${e.note || ''}` });
        if (e.type === 'roster_default') out.push({ at: e.at, by: e.actorId, kind: 'roster', title: `កែវេនប្រចាំរបស់ ${personName(e.personId)}`, detail: `${e.note || ''}` });
        if (e.type === 'shift_blocked') out.push({ at: e.at, by: e.actorId || e.cashierId, kind: 'shift', title: `រារាំងការបើកវេន (លើស 12 ម៉ោង)`, detail: `${personName(e.cashierId)} · ${e.templateCode} · ធ្វើការរួច ${e.workedHours || ''} ម៉ោង`, tone: 'rose' });
        if (e.type === 'shift_short') out.push({ at: e.at, by: e.approverId || e.actorId, kind: 'shift', title: `បើកវេនខ្លី (អនុម័ត)`, detail: `${e.shiftId} · បញ្ចប់ ${e.end}` });
    });
    mgrAllShifts().filter(s => s.status === 'reviewed' && s.reviewedBy && s.generated).forEach(s => out.push({
        at: s.reviewedAt, by: s.reviewedBy, kind: 'shift', title: `ចុះហត្ថលេខាត្រួតពិនិត្យ ${s.id}`, detail: personName(s.cashierId)
    }));

    // បន្ថែមចលនាស្តុកទាំងអស់ក្នុងសវនកម្ម (គ្មានដែនកំណត់ 14 ថ្ងៃ)
    allStockMovesList().forEach(m => {
        const p = getProduct(m.sku);
        const pName = p ? p.name : m.sku;
        let title = '';
        let detail = '';

        if (m.type === 'stock_in') {
            title = `ទទួលទំនិញចូលស្តុក ${m.invoice || m.ref || ''}`;
            detail = `${m.supplier ? m.supplier + ' · ' : ''}${pName} +${m.qty} · ${m.by ? personName(m.by) : ''}`;
        } else if (m.type === 'adjust') {
            const rLabel = STOCK_ADJUST_REASONS[m.reason] ? STOCK_ADJUST_REASONS[m.reason].label : m.reason;
            title = `កែតម្រូវស្តុក (${rLabel})`;
            detail = `${pName} ${m.qty > 0 ? '+' : ''}${m.qty} · ${m.note || ''}`;
        } else if (m.type === 'count') {
            title = `រាប់ស្តុក ${m.ref || ''}`;
            detail = `${pName} ${m.qty > 0 ? '+' : ''}${m.qty} · ${m.note || ''}`;
        } else if (m.type === 'void') {
            title = `លុបចោលវិក្កយបត្រ ${m.ref || ''}`;
            detail = `${pName} +${m.qty}`;
        } else if (m.type === 'return') {
            title = `ប្រគល់ទំនិញវិញ ${m.ref || ''}`;
            detail = `${pName} +${m.qty}`;
        }

        if (title) {
            out.push({
                at: m.at,
                by: m.by || ME_MANAGER,
                kind: 'stock',
                title,
                detail
            });
        }
    });

    return out.filter(x => x.at).sort((a, b) => b.at.localeCompare(a.at));
}

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

