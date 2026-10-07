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
    '8880005': 0.20, '8880006': 0.48, '8890004': 2.90, '8890005': 4.20, '8890006': 2.05,
    '8850009': 0.42, '8850010': 0.82, '8850011': 0.22, '8850012': 0.46, '8860009': 0.58, '8860010': 1.70,
    '8860011': 1.45, '8860012': 0.75, '8870008': 2.20, '8870009': 3.40, '8870010': 0.90, '8880007': 0.50,
    '8880008': 0.33, '8880009': 1.60, '8890007': 8.40, '8890008': 4.30, '8890009': 3.90
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
    const startStr = toIsoDateStr(range && range.start);
    const endStr = toIsoDateStr(range && range.end);

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
    approval: { label: 'ការអនុម័ត', icon: 'fa-shield-halved', tone: 'slate' },
    settings: { label: 'ការកំណត់', icon: 'fa-sliders', tone: 'slate' },
    staff: { label: 'បុគ្គលិក', icon: 'fa-user-gear', tone: 'slate' },
    catalog: { label: 'ទំនិញ និងតម្លៃ', icon: 'fa-tag', tone: 'slate' },
    stock: { label: 'ស្តុកទំនិញ', icon: 'fa-boxes-stacked', tone: 'slate' },
    shift: { label: 'វេន', icon: 'fa-cash-register', tone: 'slate' },
    roster: { label: 'កាលវិភាគ', icon: 'fa-calendar-days', tone: 'slate' },
    security: { label: 'សុវត្ថិភាព', icon: 'fa-key', tone: 'rose' }
};

function auditTrail() {
    const out = [];
    adminLogList().forEach(x => out.push({
        at: x.at, by: x.by, kind: x.type === 'pin' || x.type === 'device' || x.type === 'support' ? 'security' : x.type === 'cost' || x.type === 'stock_cost' ? 'stock' : x.type,
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

/* ពាក្យសម្ងាត់ចូលប្រើ (ទំព័រចូលប្រើ) — រក្សាក្នុង pos_passwords ឈ្នះលើតម្លៃលំនាំដើម */
function setStaffPassword(id, password) {
    const pw = posRead('pos_passwords', {});
    pw[id] = password;
    posWrite('pos_passwords', pw);
    const p = loadStaff().find(x => x.id === id);
    adminLog('pin', `កំណត់ពាក្យសម្ងាត់ចូលប្រើថ្មីឱ្យ ${p ? p.name : id}`, { target: id });
}

/* អ៊ីមែល ឬលេខទូរស័ព្ទដែលបុគ្គលិកសកម្មផ្សេងប្រើរួច (ប្រើសម្រាប់ចូលប្រើ ដូច្នេះមិនអាចជាន់គ្នា) */
function accountTaken(field, value, exceptId) {
    if (!value) return false;
    const norm = field === 'phone' ? normPhone : v => String(v).trim().toLowerCase();
    return loadStaff().some(p => p.id !== exceptId && p.active && p[field] && norm(p[field]) === norm(value));
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

/* ===== គ្រប់គ្រងកម្រៃ ម៉ោងធ្វើការ និងប្រាក់បៀវត្សរ៍បុគ្គលិក (Staff Work Time & Payroll) ===== */
const COMPENSATION_KEY = 'pos_staff_compensation';
const PAYROLL_DISBURSEMENTS_KEY = 'pos_payroll_disbursements';

const DEFAULT_STAFF_COMPENSATION = {
    'CAS-01': {
        employeeCode: 'EMP-001', phone: '012 345 678', joinedDate: '2026-01-15',
        payType: 'monthly', baseSalaryUSD: 250, foodAllowanceUSD: 30, attendanceBonusUSD: 15,
        bankName: 'ABA Bank', accountName: 'CHAN MAKARA', accountNumber: '000 123 456'
    },
    'CAS-02': {
        employeeCode: 'EMP-002', phone: '098 765 432', joinedDate: '2026-02-01',
        payType: 'monthly', baseSalaryUSD: 250, foodAllowanceUSD: 30, attendanceBonusUSD: 15,
        bankName: 'ABA Bank', accountName: 'SOK DARA', accountNumber: '000 234 567'
    },
    'CAS-03': {
        employeeCode: 'EMP-003', phone: '015 888 999', joinedDate: '2026-03-10',
        payType: 'monthly', baseSalaryUSD: 250, foodAllowanceUSD: 30, attendanceBonusUSD: 15,
        bankName: 'ABA Bank', accountName: 'LY SOPHEAP', accountNumber: '000 345 678'
    },
    'MGR-01': {
        employeeCode: 'EMP-004', phone: '077 222 333', joinedDate: '2025-11-01',
        payType: 'monthly', baseSalaryUSD: 450, foodAllowanceUSD: 30, attendanceBonusUSD: 15,
        bankName: 'ABA Bank', accountName: 'SOK VANNA', accountNumber: '000 456 789'
    },
    'MGR-02': {
        employeeCode: 'EMP-005', phone: '089 444 555', joinedDate: '2026-01-05',
        payType: 'monthly', baseSalaryUSD: 450, foodAllowanceUSD: 30, attendanceBonusUSD: 15,
        bankName: 'ABA Bank', accountName: 'MAO SREYNANG', accountNumber: '000 567 890'
    },
    'CAS-04': {
        employeeCode: 'EMP-007', phone: '016 727 340', joinedDate: '2026-04-20',
        payType: 'monthly', baseSalaryUSD: 250, foodAllowanceUSD: 30, attendanceBonusUSD: 15,
        bankName: 'ACLEDA Bank', accountName: 'PECH SOVANNARY', accountNumber: '000 678 901'
    },
    'CAS-05': {
        employeeCode: 'EMP-008', phone: '070 515 662', joinedDate: '2026-06-01',
        payType: 'monthly', baseSalaryUSD: 240, foodAllowanceUSD: 30, attendanceBonusUSD: 15,
        bankName: 'ABA Bank', accountName: 'KIM VISAL', accountNumber: '000 789 012'
    },
    'CAS-06': {
        employeeCode: 'EMP-009', phone: '096 330 184', joinedDate: '2026-09-15',
        payType: 'monthly', baseSalaryUSD: 240, foodAllowanceUSD: 30, attendanceBonusUSD: 15,
        bankName: 'Wing Bank', accountName: 'CHHIM RATANA', accountNumber: '000 890 123'
    },
    'MGR-03': {
        employeeCode: 'EMP-010', phone: '011 606 275', joinedDate: '2026-05-10',
        payType: 'monthly', baseSalaryUSD: 420, foodAllowanceUSD: 30, attendanceBonusUSD: 15,
        bankName: 'ABA Bank', accountName: 'NUON SOKLY', accountNumber: '000 901 234'
    },
    // ម្ចាស់ហាង៖ មិនស្ថិតក្នុងតារាងបៀវត្សរ៍ · គ្មានប្រាក់ខែ ឬគណនីធនាគារ
    'ADM-01': {
        employeeCode: 'EMP-006', phone: '012 999 000', joinedDate: '2025-08-01',
        payType: 'none', baseSalaryUSD: 0, foodAllowanceUSD: 0, attendanceBonusUSD: 0,
        bankName: '', accountName: '', accountNumber: ''
    }
};

/* ទិន្នន័យគំរូបើកប្រាក់បៀវត្សរ៍ប្រវត្តិ និងខែបច្ចុប្បន្ន */
const SEED_PAYROLL_DISBURSEMENTS = [
    // ប្រវត្តិបើកប្រាក់បៀវត្សរ៍ខែកញ្ញា 2026 (កន្លងទៅ)
    {
        id: 'PAY-CAS-01-202609', staffId: 'CAS-01', staffName: 'ចន្ទ មករា', role: 'cashier',
        periodKey: '2026-09-01_2026-09-30', periodLabel: '01/09/2026 ដល់ 30/09/2026',
        baseSalaryUSD: 250, grossUSD: 318.80, deductionsUSD: 0, netUSD: 318.80,
        method: 'ABA Bank (ផ្ទេរ)', at: '2026-09-30T17:15:00', by: 'ADM-01'
    },
    {
        id: 'PAY-CAS-02-202609', staffId: 'CAS-02', staffName: 'សុខ ដារ៉ា', role: 'cashier',
        periodKey: '2026-09-01_2026-09-30', periodLabel: '01/09/2026 ដល់ 30/09/2026',
        baseSalaryUSD: 250, grossUSD: 338.20, deductionsUSD: 0, netUSD: 338.20,
        method: 'ABA Bank (ផ្ទេរ)', at: '2026-09-30T17:18:00', by: 'ADM-01'
    },
    {
        id: 'PAY-CAS-03-202609', staffId: 'CAS-03', staffName: 'លី សុភា', role: 'cashier',
        periodKey: '2026-09-01_2026-09-30', periodLabel: '01/09/2026 ដល់ 30/09/2026',
        baseSalaryUSD: 250, grossUSD: 418.60, deductionsUSD: 0, netUSD: 418.60,
        method: 'ABA Bank (ផ្ទេរ)', at: '2026-09-30T17:20:00', by: 'ADM-01'
    },
    {
        id: 'PAY-MGR-01-202609', staffId: 'MGR-01', staffName: 'សុខ វណ្ណា', role: 'manager',
        periodKey: '2026-09-01_2026-09-30', periodLabel: '01/09/2026 ដល់ 30/09/2026',
        baseSalaryUSD: 450, grossUSD: 495.00, deductionsUSD: 0, netUSD: 495.00,
        method: 'ABA Bank (ផ្ទេរ)', at: '2026-09-30T17:22:00', by: 'ADM-01'
    },
    {
        id: 'PAY-MGR-02-202609', staffId: 'MGR-02', staffName: 'ម៉ៅ ស្រីនាង', role: 'manager',
        periodKey: '2026-09-01_2026-09-30', periodLabel: '01/09/2026 ដល់ 30/09/2026',
        baseSalaryUSD: 450, grossUSD: 520.92, deductionsUSD: 0, netUSD: 520.92,
        method: 'ABA Bank (ផ្ទេរ)', at: '2026-09-30T17:25:00', by: 'ADM-01'
    },
    {
        id: 'PAY-CAS-04-202609', staffId: 'CAS-04', staffName: 'ពេជ្រ សុវណ្ណារី', role: 'cashier',
        periodKey: '2026-09-01_2026-09-30', periodLabel: '01/09/2026 ដល់ 30/09/2026',
        baseSalaryUSD: 250, grossUSD: 326.40, deductionsUSD: 0, netUSD: 326.40,
        method: 'ACLEDA Bank (ផ្ទេរ)', at: '2026-09-30T17:27:00', by: 'ADM-01'
    },
    {
        id: 'PAY-CAS-05-202609', staffId: 'CAS-05', staffName: 'គឹម វិសាល', role: 'cashier',
        periodKey: '2026-09-01_2026-09-30', periodLabel: '01/09/2026 ដល់ 30/09/2026',
        baseSalaryUSD: 240, grossUSD: 296.70, deductionsUSD: 0, netUSD: 296.70,
        method: 'ABA Bank (ផ្ទេរ)', at: '2026-09-30T17:29:00', by: 'ADM-01'
    },
    // ចូលធ្វើការថ្ងៃទី 15 កញ្ញា៖ បើកតាមចំនួនថ្ងៃធ្វើការពិត (ពាក់កណ្តាលខែ វេនយប់)
    {
        id: 'PAY-CAS-06-202609', staffId: 'CAS-06', staffName: 'ឈឹម រតនា', role: 'cashier',
        periodKey: '2026-09-01_2026-09-30', periodLabel: '01/09/2026 ដល់ 30/09/2026',
        baseSalaryUSD: 240, grossUSD: 187.40, deductionsUSD: 0, netUSD: 187.40,
        method: 'Wing Bank (ផ្ទេរ)', at: '2026-09-30T17:31:00', by: 'ADM-01'
    },
    {
        id: 'PAY-MGR-03-202609', staffId: 'MGR-03', staffName: 'នួន សុខលី', role: 'manager',
        periodKey: '2026-09-01_2026-09-30', periodLabel: '01/09/2026 ដល់ 30/09/2026',
        baseSalaryUSD: 420, grossUSD: 465.00, deductionsUSD: 0, netUSD: 465.00,
        method: 'ABA Bank (ផ្ទេរ)', at: '2026-09-30T17:33:00', by: 'ADM-01'
    },
    // ខែតុលា 2026 (ខែបច្ចុប្បន្ន)៖ បានបើកជូនអ្នកគ្រប់គ្រងម្នាក់រួចរាល់
    {
        id: 'PAY-MGR-01-202610', staffId: 'MGR-01', staffName: 'សុខ វណ្ណា', role: 'manager',
        periodKey: '2026-10-01_2026-10-31', periodLabel: '01/10/2026 ដល់ 31/10/2026',
        baseSalaryUSD: 450, grossUSD: 495.00, deductionsUSD: 0, netUSD: 495.00,
        method: 'ABA Bank (ផ្ទេរ)', at: '2026-10-01T09:30:00', by: 'ADM-01'
    }
];

function getStaffCompensationStore() {
    return posRead(COMPENSATION_KEY, {});
}

function getStaffCompensation(id) {
    const store = getStaffCompensationStore();
    const defaults = DEFAULT_STAFF_COMPENSATION[id] || {
        employeeCode: 'EMP-' + id,
        phone: '012 345 678',
        joinedDate: '2026-01-01',
        payType: 'monthly',
        baseSalaryUSD: id.startsWith('CAS') ? 250 : id.startsWith('MGR') ? 450 : 0,
        foodAllowanceUSD: id.startsWith('ADM') ? 0 : 30,
        attendanceBonusUSD: id.startsWith('ADM') ? 0 : 15,
        bankName: 'ABA Bank',
        accountName: '',
        accountNumber: ''
    };
    const comp = Object.assign({}, defaults, store[id] || {});
    const base = Number(comp.baseSalaryUSD) || 0;
    // គណនាអត្រាស្វ័យប្រវត្តិតាមច្បាប់ការងារ (26 ថ្ងៃ x 8 ម៉ោង = 208 ម៉ោង)
    comp.hourlyRateUSD = +(base / 208).toFixed(2);
    comp.overtimeRateUSD = +(comp.hourlyRateUSD * 1.5).toFixed(2);
    comp.nightRateUSD = +(comp.hourlyRateUSD * 2.0).toFixed(2);
    comp.holidayRateUSD = +(comp.hourlyRateUSD * 2.0).toFixed(2);
    return comp;
}

function saveStaffCompensation(id, patch, note) {
    const store = getStaffCompensationStore();
    store[id] = Object.assign({}, store[id] || DEFAULT_STAFF_COMPENSATION[id] || {}, patch);
    posWrite(COMPENSATION_KEY, store);
    const p = loadStaff().find(x => x.id === id);
    adminLog('staff_compensation', note || `កែប្រែកម្រៃ និងប្រាក់ខែ ${p ? p.name : id}`, { target: id });
}

function getPayrollDisbursements() {
    const stored = (posRead(PAYROLL_DISBURSEMENTS_KEY, null) || []).filter(d => d.role !== 'admin'); // ម្ចាស់ហាងមិនបើកប្រាក់ខែ
    if (!stored.length) {
        return SEED_PAYROLL_DISBURSEMENTS.slice();
    }
    const map = {};
    SEED_PAYROLL_DISBURSEMENTS.forEach(s => {
        map[`${s.staffId}_${s.periodKey}`] = s;
    });
    stored.forEach(s => {
        map[`${s.staffId}_${s.periodKey}`] = s;
    });
    return Object.values(map);
}

function recordPayrollDisbursement(item, note) {
    const list = getPayrollDisbursements();
    const existingIdx = list.findIndex(d => d.staffId === item.staffId && d.periodKey === item.periodKey);
    const nowIso = isoLocal(new Date());
    const record = Object.assign({
        id: item.id || `PAY-${item.staffId}-${item.periodKey.replace(/[^A-Za-z0-9]/g, '')}`,
        at: nowIso,
        by: ME_MANAGER
    }, item);
    if (existingIdx >= 0) {
        list[existingIdx] = record;
    } else {
        list.push(record);
    }
    posWrite(PAYROLL_DISBURSEMENTS_KEY, list);
    const p = loadStaff().find(x => x.id === item.staffId);
    adminLog('payroll_disbursement', note || `បើកប្រាក់បៀវត្សរ៍ ${p ? p.name : item.staffId} ចំនួន $${Number(item.netUSD).toFixed(2)} (${item.periodLabel || item.periodKey})`, {
        target: item.staffId,
        amount: item.netUSD,
        voucherId: record.id
    });
    return record;
}

function disburseAllPendingPayroll(payrollList, periodKey, periodLabel) {
    const records = [];
    payrollList.forEach(item => {
        if (item.status === 'pending') {
            const rec = recordPayrollDisbursement({
                staffId: item.staff.id,
                staffName: item.staff.name,
                role: item.staff.role,
                periodKey: periodKey,
                periodLabel: periodLabel,
                baseSalaryUSD: item.baseSalaryUSD,
                grossUSD: item.grossUSD,
                deductionsUSD: item.deductionsUSD,
                netUSD: item.netUSD,
                method: item.banking.bankName ? `${item.banking.bankName} (ផ្ទេរ)` : 'សាច់ប្រាក់សុទ្ធ'
            });
            records.push(rec);
        }
    });
    return records;
}

/* ===== ម៉ោងធ្វើការពិត និងប្រាក់បៀវត្សរ៍ (docs/spec/04-staff-worktime-payroll.md) =====
   ម៉ោងពិត = ពេលបើកថតប្រាក់ → ពេលបិទ (វេនកំពុងបើក គិតដល់ឥឡូវ) · មិនប្រើម៉ោងតាមកាលវិភាគទេ
   អ្នកគិតលុយ៖ គិតម៉ោងពិតលម្អិត · អ្នកគ្រប់គ្រង៖ ប្រាក់ខែថេរ (ការងារភាគច្រើនមិនមែនលើបញ្ជរ)
   ម្ចាស់ហាង៖ មិនស្ថិតក្នុងតារាងបៀវត្សរ៍ */
const PAY_RULES = {
    dayHours: 8,          // ម៉ោងធម្មតាក្នុងមួយថ្ងៃ
    weekHours: 48,        // ម៉ោងធម្មតាក្នុងមួយសប្តាហ៍ (ច័ន្ទ → អាទិត្យ)
    workDays: 26,         // ថ្ងៃធ្វើការក្នុងមួយខែ (ប្រាក់ខែ ÷ 26 = ប្រាក់មួយថ្ងៃ)
    monthHours: 208,      // 26 × 8
    otMult: 1.5,          // ម៉ោងបន្ថែមពេលថ្ងៃ
    nightOtMult: 2.0,     // ម៉ោងបន្ថែមពេលយប់
    nightMult: 1.3,       // ម៉ោងយប់ធម្មតា 22:00–05:00 = 130% (ប្រកាសលេខ 80 ឆ្នាំ 1999) · ម៉ោងបន្ថែមពេលយប់ = nightOtMult 200%
    dayOffMult: 2.0,      // ធ្វើការថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍
    graceMin: 10,         // យឺត ឬចេញមុន លើសពីនេះទើបរាប់
    bonusMaxLate: 3       // រង្វាន់ឧស្សាហ៍ព្យាយាម៖ គ្មានអវត្តមាន និងយឺតមិនលើស 3 ដង
};

function payWeekStart(dateStr) {
    const d = new Date(dateStr + 'T12:00');
    return isoDate(addDays(d, -((d.getDay() + 6) % 7)));
}

function payIsNight(ms) {
    const h = new Date(ms).getHours();
    return h >= 22 || h < 5;
}

/* វេនបញ្ជររបស់បុគ្គលិកម្នាក់ (ថ្ងៃប្រតិបត្តិការ from…to) តាមលំដាប់ពេលបើក */
function workSessions(personId, from, to) {
    const now = Date.now();
    return mgrAllShifts()
        .filter(s => s.cashierId === personId && s.openedAt && s.date >= from && s.date <= to)
        .map(s => ({ shift: s, open: new Date(s.openedAt).getTime(), close: s.closedAt ? new Date(s.closedAt).getTime() : now, live: !s.closedAt }))
        .filter(x => x.close > x.open)
        .sort((a, b) => a.open - b.open);
}

/* បែងចែកនាទីធ្វើការនីមួយៗជាប្រភេទ៖ ធម្មតា · យប់ · បន្ថែម · បន្ថែមពេលយប់ · ថ្ងៃឈប់
   ម៉ោងបន្ថែម = លើស 8 ម៉ោងក្នុងថ្ងៃ ឬលើស 48 ម៉ោងក្នុងសប្តាហ៍ (មិនរាប់ពីរដង) */
function classifyWork(personId, start, end) {
    const def = (posSettings().staffDefaults || {})[personId] || {};
    const dayOff = def.dayOff != null && def.dayOff !== '' ? Number(def.dayOff) : null;
    const STEP = 5 * 60000;
    const dayMin = {};
    const weekMin = {};
    const empty = () => ({ regular: 0, night: 0, ot: 0, otNight: 0, dayOff: 0, total: 0 });
    const totals = empty();
    const perShift = {};
    // ចាប់ពីថ្ងៃច័ន្ទនៃសប្តាហ៍ដំបូង ដើម្បីឱ្យកំណត់ 48 ម៉ោងត្រឹមត្រូវ
    workSessions(personId, payWeekStart(start), end).forEach(x => {
        const b = empty();
        const dk = x.shift.date;
        const wk = payWeekStart(dk);
        const off = dayOff !== null && new Date(dk + 'T12:00').getDay() === dayOff;
        for (let t = x.open; t < x.close; t += STEP) {
            const m = Math.min(STEP, x.close - t) / 60000;
            const night = payIsNight(t);
            let cat;
            if (off) cat = 'dayOff';
            else {
                dayMin[dk] = (dayMin[dk] || 0) + m;
                weekMin[wk] = (weekMin[wk] || 0) + m;
                const over = dayMin[dk] > PAY_RULES.dayHours * 60 || weekMin[wk] > PAY_RULES.weekHours * 60;
                cat = over ? (night ? 'otNight' : 'ot') : (night ? 'night' : 'regular');
            }
            b[cat] += m;
            b.total += m;
        }
        perShift[x.shift.id] = b;
        if (dk >= start) Object.keys(totals).forEach(k => { totals[k] += b[k]; });
    });
    return { totals, perShift };
}

/* កាលវិភាគធៀបនឹងវត្តមានពិត៖ ថ្ងៃនីមួយៗ វេននីមួយៗ (រួមទាំងវេនដែលមិនមានក្នុងកាលវិភាគ) */
function attendanceRows(personId, start, end) {
    const now = new Date();
    const sessions = workSessions(personId, start, end);
    const used = new Set();
    const rows = [];
    for (let d = new Date(start + 'T12:00'); isoDate(d) <= end; d = addDays(d, 1)) {
        const date = isoDate(d);
        shiftTemplates().forEach(t => {
            const a = rosterFor(date, t.code).find(x => x.cashierId === personId);
            if (!a) return;
            const planStart = dateAt(date, a.from || t.start);
            let planEnd = a.until ? dateAt(date, a.until) : shiftEndDate({ date, start: t.start, end: t.end });
            if (planEnd <= planStart) planEnd = addDays(planEnd, 1);
            const x = sessions.find(s => !used.has(s) && s.shift.date === date && s.shift.templateCode === t.code);
            if (x) used.add(x);
            rows.push({ date, template: t, register: x ? x.shift.register : '', cover: !!a.cover, planStart, planEnd, session: x || null });
        });
    }
    sessions.filter(s => !used.has(s)).forEach(x => {
        const t = shiftTemplates().find(y => y.code === x.shift.templateCode) || { code: x.shift.templateCode, name: x.shift.templateName, start: x.shift.start, end: x.shift.end };
        rows.push({ date: x.shift.date, template: t, register: x.shift.register, cover: true, unplanned: true, planStart: null, planEnd: null, session: x });
    });
    const grace = PAY_RULES.graceMin * 60000;
    rows.forEach(r => {
        const s = r.session;
        r.future = !s && r.planStart > now;
        r.absent = !s && !!r.planEnd && r.planEnd < now;
        r.lateMin = s && r.planStart && s.open - r.planStart > grace ? Math.round((s.open - r.planStart) / 60000) : 0;
        r.earlyMin = s && !s.live && r.planEnd && r.planEnd - s.close > grace ? Math.round((r.planEnd - s.close) / 60000) : 0;
    });
    return rows.sort((a, b) => a.date.localeCompare(b.date) || (a.planStart || a.session.open) - (b.planStart || b.session.open));
}

/* គណនាប្រាក់បៀវត្សរ៍តាមម៉ោងពិត សម្រាប់ចន្លោះកាលបរិច្ឆេទ */
function calculateStaffPayroll(range) {
    const today = isoDate(new Date());
    const start = toIsoDateStr(range && range.start) || isoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const end = toIsoDateStr(range && range.end) || today;
    const periodKey = `${start}_${end}`;
    const periodLabel = `${fmtDate(start)} ដល់ ${fmtDate(end)}`;
    const disbursements = getPayrollDisbursements();

    // ប្រាក់ខែថេរ៖ ខែពេញ = ប្រាក់ខែគោល · ចន្លោះខ្លី = តាមចំនួនថ្ងៃប្រតិទិន
    const s0 = new Date(start + 'T12:00');
    const days = Math.max(1, Math.round((new Date(end + 'T12:00') - s0) / 86400000) + 1);
    const monthDays = new Date(s0.getFullYear(), s0.getMonth() + 1, 0).getDate();
    const fullMonth = start.slice(8) === '01' && days === monthDays;
    const share = fullMonth ? 1 : Math.min(1, days / monthDays);
    const r2 = n => Math.round(n * 100) / 100;
    const h1 = m => Math.round(m / 6) / 10; // នាទី → ម៉ោង (ទសភាគ 1)

    const staffPayrolls = loadStaff().filter(p => p.active && p.role !== 'admin').map(person => {
        const comp = getStaffCompensation(person.id);
        const base = Number(comp.baseSalaryUSD) || 0;
        const hourly = base / PAY_RULES.monthHours;
        const tracked = person.role === 'cashier';
        const work = classifyWork(person.id, start, end);
        const w = work.totals;
        const att = attendanceRows(person.id, start, end);
        const shiftsWorked = att.filter(r => r.session).length;
        const absentDays = tracked ? new Set(att.filter(r => r.absent).map(r => r.date)).size : 0;
        const lateCount = att.filter(r => r.lateMin).length;
        const lateMinutes = att.reduce((n, r) => n + r.lateMin, 0);
        const earlyCount = att.filter(r => r.earlyMin).length;
        const live = att.some(r => r.session && r.session.live);

        const basePay = r2(base * share);
        const otPay = tracked ? r2(h1(w.ot) * hourly * PAY_RULES.otMult + h1(w.otNight) * hourly * PAY_RULES.nightOtMult) : 0;
        // ម៉ោងយប់ធម្មតា៖ ប្រាក់ខែគោលបានគ្របរួចហើយ ត្រូវបន្ថែមតែផ្នែកលើស (2.0 − 1.0)
        const nightPay = tracked ? r2(h1(w.night) * hourly * (PAY_RULES.nightMult - 1)) : 0;
        const dayOffPay = tracked ? r2(h1(w.dayOff) * hourly * PAY_RULES.dayOffMult) : 0;
        const foodAllowance = r2((Number(comp.foodAllowanceUSD) || 0) * share);
        const bonusOk = absentDays === 0 && lateCount <= PAY_RULES.bonusMaxLate;
        const attendanceBonus = bonusOk ? r2((Number(comp.attendanceBonusUSD) || 0) * share) : 0;
        const absencePay = r2(absentDays * base / PAY_RULES.workDays);
        // ខ្វះសាច់ប្រាក់ថត៖ បង្ហាញប៉ុណ្ណោះ មិនកាត់ដោយស្វ័យប្រវត្តិ (ត្រូវស៊ើបអង្កេតសិន · spec §4.3)
        const cashShortage = r2(att.reduce((n, r) => n + (r.session && r.session.shift.variance < -Number(posSettings().varianceTolerance || 5) ? -r.session.shift.variance : 0), 0));

        const grossUSD = r2(basePay + otPay + nightPay + dayOffPay + foodAllowance + attendanceBonus);
        const deductionsUSD = absencePay;
        const netUSD = r2(grossUSD - deductionsUSD);

        const disb = disbursements.find(d => d.staffId === person.id && (d.periodKey === periodKey || (fullMonth && d.periodKey.startsWith(start.slice(0, 7)))));
        return {
            staff: person,
            role: person.role,
            comp,
            tracked,
            banking: { bankName: comp.bankName || '', accountName: comp.accountName || person.name, accountNumber: comp.accountNumber || '—' },
            employeeCode: comp.employeeCode || person.id,
            phone: comp.phone || '',
            joinedDate: comp.joinedDate || '',
            baseSalaryUSD: base,
            hourlyRateUSD: r2(hourly),
            share,
            realHours: h1(w.total),
            shiftsWorked,
            live,
            regularHours: h1(w.regular + w.night),
            regularPay: basePay,
            otHours: h1(w.ot + w.otNight),
            otPay,
            nightHours: h1(w.night + w.otNight),
            nightPay,
            dayOffHours: h1(w.dayOff),
            dayOffDays: new Set(att.filter(r => r.session && work.perShift[r.session.shift.id] && work.perShift[r.session.shift.id].dayOff).map(r => r.date)).size,
            dayOffPay,
            foodAllowance,
            attendanceBonus,
            bonusLost: !bonusOk && (Number(comp.attendanceBonusUSD) || 0) > 0,
            absentDays,
            absencePay,
            lateCount,
            lateMinutes,
            earlyCount,
            cashShortage,
            deductionsUSD,
            grossUSD,
            netUSD,
            status: disb ? 'disbursed' : 'pending',
            disbursement: disb || null
        };
    });

    const sum = k => staffPayrolls.reduce((n, p) => n + p[k], 0);
    const summary = {
        staffCount: staffPayrolls.length,
        totalHours: Math.round(sum('realHours') * 10) / 10,
        totalOT: Math.round(sum('otHours') * 10) / 10,
        totalNight: Math.round(sum('nightHours') * 10) / 10,
        totalGross: r2(sum('grossUSD')),
        totalDeductions: r2(sum('deductionsUSD')),
        totalNet: r2(sum('netUSD')),
        absentDays: sum('absentDays'),
        lateCount: sum('lateCount'),
        pendingCount: staffPayrolls.filter(p => p.status === 'pending').length,
        disbursedCount: staffPayrolls.filter(p => p.status === 'disbursed').length,
        fullMonth,
        days,
        monthDays,
        periodKey,
        periodLabel
    };
    return { staffPayrolls, summary };
}

/* តារាងម៉ោងការងារលម្អិតរបស់បុគ្គលិកម្នាក់៖ កាលវិភាគធៀបនឹងម៉ោងពិត ថ្ងៃនីមួយៗ */
function getStaffTimesheet(staffId, range) {
    const start = toIsoDateStr(range && range.start) || isoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const end = toIsoDateStr(range && range.end) || isoDate(new Date());
    const work = classifyWork(staffId, start, end);
    const DOW = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
    const h1 = m => Math.round(m / 6) / 10;
    const hm = ms => `${pad2(new Date(ms).getHours())}:${pad2(new Date(ms).getMinutes())}`;
    return attendanceRows(staffId, start, end).filter(r => !r.future).map(r => {
        const s = r.session;
        const b = s ? (work.perShift[s.shift.id] || {}) : {};
        const parts = [];
        if (b.regular) parts.push({ label: `ធម្មតា ${h1(b.regular)}`, tone: 'slate' });
        if (b.night) parts.push({ label: `យប់ ${h1(b.night)}`, tone: 'slate' });
        if (b.ot || b.otNight) parts.push({ label: `បន្ថែម ${h1((b.ot || 0) + (b.otNight || 0))}`, tone: 'amber' });
        if (b.dayOff) parts.push({ label: `ថ្ងៃឈប់ ${h1(b.dayOff)}`, tone: 'emerald' });
        const flags = [];
        if (r.absent) flags.push({ label: 'អវត្តមាន', tone: 'rose' });
        if (r.unplanned) flags.push({ label: 'មិនមានក្នុងកាលវិភាគ', tone: 'amber' });
        else if (r.cover) flags.push({ label: 'ជំនួស', tone: 'amber' });
        if (r.lateMin) flags.push({ label: `យឺត ${r.lateMin} នាទី`, tone: 'amber' });
        if (r.earlyMin) flags.push({ label: `ចេញមុន ${r.earlyMin} នាទី`, tone: 'amber' });
        if (s && s.live) flags.push({ label: 'កំពុងធ្វើការ', tone: 'emerald' });
        return {
            shiftId: s ? s.shift.id : '',
            date: r.date,
            dayName: DOW[new Date(r.date + 'T12:00').getDay()],
            templateName: r.template.name,
            plan: r.planStart ? `${hm(r.planStart)}–${hm(r.planEnd)}` : '—',
            actual: s ? `${hm(s.open)}–${s.live ? 'ឥឡូវ' : hm(s.close)}` : '—',
            register: r.register,
            hours: s ? h1(b.total || 0) : 0,
            parts,
            flags,
            variance: s && typeof s.shift.variance === 'number' ? s.shift.variance : 0
        };
    });
}
