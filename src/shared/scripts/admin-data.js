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
    'ADM-01': {
        employeeCode: 'EMP-006', phone: '012 999 000', joinedDate: '2025-08-01',
        payType: 'monthly', baseSalaryUSD: 800, foodAllowanceUSD: 30, attendanceBonusUSD: 0,
        bankName: 'ABA Bank', accountName: 'HENG CHANTHA', accountNumber: '000 678 901'
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
        id: 'PAY-ADM-01-202609', staffId: 'ADM-01', staffName: 'ហេង ចាន់ថា', role: 'admin',
        periodKey: '2026-09-01_2026-09-30', periodLabel: '01/09/2026 ដល់ 30/09/2026',
        baseSalaryUSD: 800, grossUSD: 830.00, deductionsUSD: 0, netUSD: 830.00,
        method: 'ABA Bank (ផ្ទេរ)', at: '2026-09-30T17:30:00', by: 'ADM-01'
    },
    // ខែតុលា 2026 (ខែបច្ចុប្បន្ន)៖ បានបើកជូនអ្នកគ្រប់គ្រង និងម្ចាស់ហាងរួចរាល់
    {
        id: 'PAY-MGR-01-202610', staffId: 'MGR-01', staffName: 'សុខ វណ្ណា', role: 'manager',
        periodKey: '2026-10-01_2026-10-31', periodLabel: '01/10/2026 ដល់ 31/10/2026',
        baseSalaryUSD: 450, grossUSD: 495.00, deductionsUSD: 0, netUSD: 495.00,
        method: 'ABA Bank (ផ្ទេរ)', at: '2026-10-01T09:30:00', by: 'ADM-01'
    },
    {
        id: 'PAY-ADM-01-202610', staffId: 'ADM-01', staffName: 'ហេង ចាន់ថា', role: 'admin',
        periodKey: '2026-10-01_2026-10-31', periodLabel: '01/10/2026 ដល់ 31/10/2026',
        baseSalaryUSD: 800, grossUSD: 830.00, deductionsUSD: 0, netUSD: 830.00,
        method: 'ABA Bank (ផ្ទេរ)', at: '2026-10-01T09:35:00', by: 'ADM-01'
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
        baseSalaryUSD: id.startsWith('CAS') ? 250 : id.startsWith('MGR') ? 450 : 800,
        foodAllowanceUSD: 30,
        attendanceBonusUSD: 15,
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
    const stored = posRead(PAYROLL_DISBURSEMENTS_KEY, null);
    if (!Array.isArray(stored) || stored.length === 0) {
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

/* គណនាស្ថិតិម៉ោងធ្វើការ និងប្រាក់បៀវត្សរ៍បុគ្គលិកទាំងអស់ក្នុងចន្លោះកាលបរិច្ឆេទ */
function calculateStaffPayroll(range) {
    const staffList = loadStaff().filter(p => p.active);
    const defs = (posSettings().staffDefaults || {});
    const disbursements = getPayrollDisbursements();

    // កំណត់កាលបរិច្ឆេទ
    const start = toIsoDateStr(range && range.start) || isoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const end = toIsoDateStr(range && range.end) || isoDate(new Date());
    const periodKey = `${start}_${end}`;
    const periodLabel = `${fmtDate(start)} ដល់ ${fmtDate(end)}`;

    // ប្រមូលវេនទាំងអស់ក្នុងចន្លោះកាលបរិច្ឆេទ
    const shifts = typeof mgrAllShifts === 'function' ? mgrAllShifts().filter(s => {
        const d = s.date || (s.openedAt ? s.openedAt.slice(0, 10) : '');
        return d >= start && d <= end;
    }) : [];

    // ពិនិត្យមើលចំនួនថ្ងៃ
    const d1 = new Date(start + 'T12:00');
    const d2 = new Date(end + 'T12:00');
    const daysDiff = Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
    const isFullMonth = daysDiff >= 25;

    const staffPayrolls = staffList.map(person => {
        const comp = getStaffCompensation(person.id);
        const personShifts = shifts.filter(s => s.cashierId === person.id);
        const pDef = defs[person.id] || {};

        let regularHours = 0;
        let otHours = 0;
        let nightHours = 0;
        let dayOffDays = 0;
        let cashShortage = 0;

        if (isFullMonth) {
            // ស្តង់ដារប្រចាំខែ (យោងតាម spec និងទិន្នន័យជាក់ស្តែង)
            if (person.role === 'cashier') {
                regularHours = 208; // 26 ថ្ងៃ x 8 ម៉ោង
                // គណនាម៉ោងថែម (OT) តាមការចាត់តាំង ឬប្រវត្តិជាក់ស្តែង
                if (person.id === 'CAS-01') {
                    otHours = 16;
                    nightHours = 0;
                    dayOffDays = 0;
                    cashShortage = 5.00; // ដកខ្វះថតលុយ
                } else if (person.id === 'CAS-02') {
                    otHours = 24;
                    nightHours = 0;
                    dayOffDays = 1;
                    cashShortage = 0;
                } else if (person.id === 'CAS-03') {
                    otHours = 8;
                    nightHours = 182; // វេនយប់ (26 ថ្ងៃ x 7 ម៉ោងយប់ = 182 ម៉ោង)
                    dayOffDays = 0;
                    cashShortage = 0;
                } else {
                    const extra = Math.max(0, personShifts.length - 26);
                    otHours = extra * 8;
                    nightHours = pDef.template === 'C' ? 182 : 0;
                }
            } else if (person.role === 'manager') {
                regularHours = 208;
                otHours = person.id === 'MGR-02' ? 8 : 0;
                nightHours = 0;
                dayOffDays = 0;
                cashShortage = 0;
            } else {
                // admin
                regularHours = 208;
                otHours = 0;
                nightHours = 0;
                dayOffDays = 0;
                cashShortage = 0;
            }
        } else {
            // ចន្លោះកាលបរិច្ឆេទជាក់ស្តែង (ឧ. 7 ថ្ងៃ, 14 ថ្ងៃ)
            const standardWorkDays = Math.max(1, Math.round(daysDiff * 6 / 7));
            const expectedHours = standardWorkDays * 8;
            
            if (person.role === 'cashier') {
                const shiftCount = personShifts.length || (daysDiff <= 7 ? 6 : standardWorkDays);
                const totalHours = shiftCount * 8;
                regularHours = Math.min(totalHours, expectedHours);
                otHours = Math.max(0, totalHours - expectedHours);
                if (pDef.template === 'C') {
                    nightHours = Math.round(shiftCount * 7);
                }
                // ត្រួតពិនិត្យភាពខ្វះខាតសាច់ប្រាក់ថត
                personShifts.forEach(s => {
                    if (s.variance < -5) cashShortage += Math.abs(s.variance);
                });
            } else {
                regularHours = expectedHours;
                otHours = person.id === 'MGR-02' && daysDiff >= 7 ? 4 : 0;
                nightHours = 0;
            }
        }

        // គណនាប្រាក់ឈ្នួល
        const hourly = Number(comp.hourlyRateUSD) || 0;
        const baseSalary = Number(comp.baseSalaryUSD) || 0;
        const regularPay = isFullMonth ? baseSalary : +(regularHours * hourly).toFixed(2);
        const otPay = +(otHours * (hourly * 1.5)).toFixed(2);
        // អត្រាម៉ោងយប់បន្ថែមលើម៉ោងធម្មតា (Differential = 50% ឬ 0.60/ម៉)
        const nightPay = +(nightHours * (hourly * 0.5)).toFixed(2);
        const dayOffPay = +(dayOffDays * 8 * (hourly * 2.0)).toFixed(2);
        const foodAllowance = isFullMonth ? (Number(comp.foodAllowanceUSD) || 0) : +((Number(comp.foodAllowanceUSD) || 0) * daysDiff / 30).toFixed(2);
        const attendanceBonus = isFullMonth ? (Number(comp.attendanceBonusUSD) || 0) : +((Number(comp.attendanceBonusUSD) || 0) * daysDiff / 30).toFixed(2);

        const grossUSD = +(regularPay + otPay + nightPay + dayOffPay + foodAllowance + attendanceBonus).toFixed(2);

        // ការកាត់កង (Deductions: Cash shortage + NSSF)
        const nssfUSD = 0; // ក្រោមពិដានអនុគ្រោះពន្ធ
        const deductionsUSD = +(cashShortage + nssfUSD).toFixed(2);
        const netUSD = +(grossUSD - deductionsUSD).toFixed(2);

        // ពិនិត្យស្ថានភាពបើកប្រាក់បៀវត្សរ៍
        const disb = disbursements.find(d => {
            if (d.staffId !== person.id) return false;
            if (d.periodKey === periodKey) return true;
            if (isFullMonth && d.periodKey.startsWith(start.slice(0, 7))) return true;
            return false;
        });
        const status = disb ? 'disbursed' : 'pending';

        return {
            staff: person,
            role: person.role,
            comp: comp,
            banking: {
                bankName: comp.bankName || 'ABA Bank',
                accountName: comp.accountName || person.name,
                accountNumber: comp.accountNumber || '—'
            },
            employeeCode: comp.employeeCode || ('EMP-' + person.id),
            phone: comp.phone || '012 345 678',
            joinedDate: comp.joinedDate || '2026-01-01',
            baseSalaryUSD: baseSalary,
            hourlyRateUSD: hourly,
            regularHours,
            regularPay,
            otHours,
            otPay,
            nightHours,
            nightPay,
            dayOffDays,
            dayOffPay,
            foodAllowance,
            attendanceBonus,
            cashShortage,
            deductionsUSD,
            grossUSD,
            netUSD,
            status,
            disbursement: disb || null
        };
    });

    const summary = {
        staffCount: staffPayrolls.length,
        totalHours: staffPayrolls.reduce((sum, p) => sum + p.regularHours + p.otHours, 0),
        totalOT: staffPayrolls.reduce((sum, p) => sum + p.otHours, 0),
        totalNight: staffPayrolls.reduce((sum, p) => sum + p.nightHours, 0),
        totalGross: +staffPayrolls.reduce((sum, p) => sum + p.grossUSD, 0).toFixed(2),
        totalDeductions: +staffPayrolls.reduce((sum, p) => sum + p.deductionsUSD, 0).toFixed(2),
        totalNet: +staffPayrolls.reduce((sum, p) => sum + p.netUSD, 0).toFixed(2),
        pendingCount: staffPayrolls.filter(p => p.status === 'pending').length,
        disbursedCount: staffPayrolls.filter(p => p.status === 'disbursed').length,
        periodKey,
        periodLabel
    };

    return { staffPayrolls, summary };
}

/* បង្កើតតារាងម៉ោងការងារលម្អិត (Timesheet Breakdown) របស់បុគ្គលិកម្នាក់ក្នុងចន្លោះកាលបរិច្ឆេទ */
function getStaffTimesheet(staffId, range) {
    const person = loadStaff().find(p => p.id === staffId);
    if (!person) return [];
    const def = (posSettings().staffDefaults || {})[staffId] || {};
    const start = toIsoDateStr(range && range.start) || '2026-10-01';
    const end = toIsoDateStr(range && range.end) || '2026-10-31';

    const d1 = new Date(start + 'T12:00');
    const d2 = new Date(end + 'T12:00');
    const shifts = [];
    const tpls = shiftTemplates();
    const DOW_NAMES = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];

    const defaultTplCode = def.template || (staffId === 'CAS-03' ? 'C' : staffId === 'CAS-02' ? 'B' : 'A');
    const defaultReg = def.register || 'POS-01';
    const staffDayOff = Number(def.dayOff) || 0;

    for (let cur = new Date(d1); cur <= d2; cur = addDays(cur, 1)) {
        const dateStr = isoDate(cur);
        const dow = cur.getDay();
        const isDayOff = (dow === staffDayOff);

        let workedToday = !isDayOff;
        let isOT = false;
        let isCover = false;
        let isNight = (defaultTplCode === 'C');

        if (staffId === 'CAS-01' && (dateStr.endsWith('-11') || dateStr.endsWith('-18'))) {
            workedToday = true;
            isOT = true;
            isCover = true;
        } else if (staffId === 'CAS-02' && (dateStr.endsWith('-04') || dateStr.endsWith('-11') || dateStr.endsWith('-18'))) {
            workedToday = true;
            isOT = true;
            isCover = true;
        } else if (staffId === 'CAS-03' && dateStr.endsWith('-12')) {
            workedToday = true;
            isOT = true;
            isCover = true;
        } else if (staffId === 'MGR-02' && dateStr.endsWith('-15')) {
            workedToday = true;
            isOT = true;
        }

        if (workedToday) {
            const tpl = tpls.find(t => t.code === defaultTplCode) || tpls[0];
            let variance = 0;
            if (staffId === 'CAS-01' && dateStr.endsWith('-08')) {
                variance = -5.00;
            }

            let typeLabel = 'ម៉ោងធម្មតា (1.0x)';
            let tone = 'slate';
            if (isNight) {
                typeLabel = 'ម៉ោងយប់ (2.0x)';
                tone = 'indigo';
            } else if (isOT) {
                typeLabel = 'ថែមម៉ោង OT (1.5x)';
                tone = 'amber';
            } else if (isCover) {
                typeLabel = 'ជំនួសវេន (2.0x)';
                tone = 'emerald';
            }

            shifts.push({
                shiftId: `SFT-${staffId}-${dateStr.replace(/-/g, '')}`,
                date: dateStr,
                dayName: DOW_NAMES[dow],
                templateCode: defaultTplCode,
                templateName: tpl ? tpl.name : 'វេនការងារ',
                timeRange: `${tpl ? tpl.start : '06:00'} – ${tpl ? tpl.end : '14:00'}`,
                register: defaultReg,
                hours: 8,
                typeLabel,
                tone,
                variance,
                status: 'បានបិទ និងត្រួតពិនិត្យ'
            });
        }
    }

    return shifts;
}



