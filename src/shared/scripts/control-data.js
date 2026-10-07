/* ===== ច្រកអ្នកគ្រប់គ្រងប្រព័ន្ធ (pos_control) — ទំព័រ control/* តែប៉ុណ្ណោះ =====
   DIGITECHKH លក់ប្រព័ន្ធឱ្យហាងច្រើន។ ឯកសារនេះរក្សា៖ កញ្ចប់ (តម្លៃ និងដែនកំណត់) · ហាងដែលជាវ (ម្ចាស់ហាង កញ្ចប់
   ថ្ងៃផុតកំណត់ ការប្រើប្រាស់) · ការបង់ប្រាក់ · កំណត់ហេតុសកម្មភាព · ការចូលមើលដើម្បីជួយ។
   គ្មានការលក់ ថ្លៃដើម ឬបុគ្គលិករបស់ហាងនៅទីនេះទេ (មានតែចំនួនប្រើប្រាស់)។
   ស្ថានភាពការជាវរបស់ហាងគំរូ SHOP-01 / SHOP-02 សរសេរទៅ pos_ctl_status ដែល data.js អាន ដើម្បីបិទការចូលប្រើ
   (subscriptionStatus · shopBlocked ក្នុង data.js)។ ហាងផ្សេងទៀតជាទិន្នន័យគំរូក្នុងច្រកនេះប៉ុណ្ណោះ។
   ប្រព័ន្ធពិត៖ មូលដ្ឋានទិន្នន័យ pos_control (ឯកសារផែនការ Phase 1B · P8-xx) */

const CTL_KEYS = {
    companies: 'pos_ctl_companies',
    payments: 'pos_ctl_payments',
    plans: 'pos_ctl_plans',
    log: 'pos_ctl_log',
    support: 'pos_ctl_support',
    status: 'pos_ctl_status'
};

/* កញ្ចប់៖ តម្លៃប្រចាំខែ · ប្រចាំឆ្នាំ = 10 ខែ (ឥតគិតថ្លៃ 2 ខែ) · សាកល្បង 14 ថ្ងៃ ឥតគិតថ្លៃ */
const PLAN_SEED = SUB_PLANS_DEFAULT;         // data.js (ម្ចាស់ហាងក៏មើលឃើញតម្លៃដដែល)
const YEAR_PAID_MONTHS = PLAN_YEAR_MONTHS;
const TRIAL_DAYS = 14;
const SUPPORT_MINUTES = 30;

const SUB_STATUS = {
    active: { label: 'កំពុងប្រើ', cls: 'bg-slate-50 text-slate-700 border-slate-200' },
    trial: { label: 'សាកល្បង', cls: 'bg-slate-50 text-slate-700 border-slate-200' },
    expiring: { label: 'ជិតផុតកំណត់', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    overdue: { label: 'ហួសកំណត់បង់', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    expired: { label: 'ផុតកំណត់', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    suspended: { label: 'បានផ្អាក', cls: 'bg-rose-50 text-rose-700 border-rose-200' }
};

const PAY_METHODS = {
    khqr: { label: 'KHQR', icon: 'fa-qrcode', desc: 'ម្ចាស់ហាងស្កេនបង់ពីកម្មវិធីធនាគារ' },
    bank: { label: 'ផ្ទេរតាមធនាគារ', icon: 'fa-building-columns', desc: 'ផ្ទេរចូលគណនី DIGITECHKH' },
    cash: { label: 'សាច់ប្រាក់', icon: 'fa-money-bill-wave', desc: 'បង់ផ្ទាល់នៅការិយាល័យ' }
};

const CTL_LOG_TYPES = {
    payment: { label: 'ការបង់ប្រាក់', icon: 'fa-receipt' },
    plan: { label: 'កញ្ចប់', icon: 'fa-box' },
    status: { label: 'ផ្អាក និងបើកវិញ', icon: 'fa-store-slash' },
    support: { label: 'ចូលមើលដើម្បីជួយ', icon: 'fa-life-ring' },
    company: { label: 'ហាង', icon: 'fa-store' },
    reminder: { label: 'ការរំលឹក', icon: 'fa-bell' },
    note: { label: 'កំណត់ចំណាំ', icon: 'fa-note-sticky' }
};

const REMIND_CHANNELS = {
    call: { label: 'ទូរស័ព្ទ', icon: 'fa-phone' },
    telegram: { label: 'តេឡេក្រាម', icon: 'fa-paper-plane' },
    sms: { label: 'សារ SMS', icon: 'fa-comment-sms' }
};

const CITIES = ['ភ្នំពេញ', 'សៀមរាប', 'បាត់ដំបង', 'កំពត', 'តាខ្មៅ', 'ព្រះសីហនុ', 'កំពង់ចាម'];

/* ===== ទិន្នន័យគំរូ =====
   ថ្ងៃទាំងអស់គិតពីថ្ងៃនេះ ដូច្នេះគំរូនៅតែមានហាងជិតផុតកំណត់ ហួសកំណត់ និងសាកល្បងជានិច្ច */
function ctlSeedCompanies() {
    const c = (id, nameKh, city, branch, ownerName, ownerPhone, ownerEmail, plan, cycle, endsIn, createdAgo, usage, extra) => Object.assign({
        id, nameKh, city, branch, ownerName, ownerPhone, ownerEmail, plan, cycle, trial: false, suspended: false, suspendReason: '',
        endsOn: addDaysIso(endsIn), createdAt: addDaysIso(-createdAgo), usage
    }, extra || {});
    const demo = id => {
        const sub = shopSubscription(id);
        const sh = shopById(id);
        const owner = ADMINS[0] || {};
        return {
            id, nameKh: sh.nameKh, city: 'ភ្នំពេញ', branch: sh.branch, ownerName: owner.name, ownerPhone: owner.phone, ownerEmail: owner.email,
            plan: sub.plan, cycle: sub.cycle, trial: sub.trial, suspended: !!sub.suspended, suspendReason: sub.suspendReason || '',
            endsOn: sub.endsOn, createdAt: addDaysIso(id === 'SHOP-01' ? -210 : -9), usage: null, demo: true
        };
    };
    return [
        demo('SHOP-01'),
        demo('SHOP-02'),
        c('SHOP-03', 'ម៉ាតមីនី សុខសាន្ត', 'ភ្នំពេញ', 'សាខាសែនសុខ', 'សុខ សាន្ត', '012 410 220', 'sokhsan@gmail.com', 'standard', 'month', 17, 320, { branches: 1, registers: 2, staff: 9 }),
        c('SHOP-04', 'ឱសថស្ថាន ពេជ្រ', 'សៀមរាប', 'ផ្សារចាស់', 'ពេជ្រ ច័ន្ទតារា', '092 551 873', 'pechpharmacy@gmail.com', 'basic', 'month', 3, 145, { branches: 1, registers: 1, staff: 4 }),
        c('SHOP-05', 'ហាងនំបុ័ង មាស', 'បាត់ដំបង', 'ផ្សារណាត', 'មាស សុភ័ក្រ', '017 663 902', 'meas.bakery@gmail.com', 'basic', 'month', -4, 260, { branches: 1, registers: 1, staff: 5 }),
        c('SHOP-06', 'ផ្សារទំនើបតូច ស្រីពៅ', 'ភ្នំពេញ', 'ទួលគោក', 'ហុង ស្រីពៅ', '011 902 774', 'sreypov.mart@gmail.com', 'multi', 'year', 190, 400, { branches: 2, registers: 6, staff: 31 }),
        c('SHOP-07', 'កាហ្វេ ព្រឹកព្រលឹម', 'កំពត', 'មាត់ទន្លេ', 'លឹម វណ្ណៈ', '088 274 615', 'morningcafe.kp@gmail.com', 'basic', 'month', 11, 3, { branches: 1, registers: 1, staff: 3 }, { trial: true }),
        c('SHOP-08', 'ហាងទូរស័ព្ទ វិសាល', 'ភ្នំពេញ', 'អូរឫស្សី', 'ចាន់ វិសាល', '015 330 481', 'visalphone@gmail.com', 'standard', 'year', 301, 430, { branches: 1, registers: 2, staff: 7 }),
        c('SHOP-09', 'ហាងគ្រឿងសំអាង ស្រីមុំ', 'តាខ្មៅ', 'ផ្សារតាខ្មៅ', 'អ៊ុក ស្រីមុំ', '096 418 257', 'sreymom.beauty@gmail.com', 'basic', 'month', -26, 180, { branches: 1, registers: 1, staff: 2 }, { suspended: true, suspendReason: 'មិនបានបង់ប្រាក់ 3 សប្តាហ៍ក្រោយផុតកំណត់' }),
        c('SHOP-10', 'ភោជនីយដ្ឋាន ឆ្ងាញ់', 'ព្រះសីហនុ', 'ឆ្នេរអូរឈើទាល', 'គង់ ចាន់ណា', '070 812 336', 'chhngany.rest@gmail.com', 'standard', 'month', 26, 95, { branches: 1, registers: 3, staff: 14 }),
        c('SHOP-11', 'ហាងសៀវភៅ ចំណេះ', 'ភ្នំពេញ', 'បឹងកេងកង', 'នៅ ចំណេះ', '081 207 559', 'chamnes.books@gmail.com', 'basic', 'month', 20, 510, { branches: 1, registers: 1, staff: 3 }),
        c('SHOP-12', 'ម៉ាតមីនី 24 ម៉ោង តាខ្មៅ', 'តាខ្មៅ', 'ផ្លូវជាតិលេខ 2', 'ស៊ុន ដាវីត', '093 665 120', 'mart24.tk@gmail.com', 'multi', 'month', 9, 60, { branches: 3, registers: 9, staff: 44 }),
        c('SHOP-13', 'ហាងតែ ទឹកដោះគោ ផ្លែឈើ', 'កំពង់ចាម', 'ផ្សារធំ', 'ហេង លីដា', '010 554 318', 'teamilk.kc@gmail.com', 'basic', 'month', 6, 72, { branches: 1, registers: 1, staff: 5 }),
        c('SHOP-14', 'ហាងគ្រឿងទេស មរកត', 'ភ្នំពេញ', 'ផ្សារអូរឫស្សី', 'ម៉ម មរកត', '099 287 604', 'morakot.spice@gmail.com', 'basic', 'month', -6, 20, { branches: 1, registers: 1, staff: 2 }, { trial: true })
    ];
}

function ctlSeedPayments(companies) {
    const out = [];
    let n = 0;
    companies.filter(c => !c.trial).forEach(c => {
        const plan = PLAN_SEED.find(p => p.id === c.plan);
        if (c.cycle === 'year') {
            const from = addDaysIso(-365, c.endsOn);
            out.push(ctlPaymentRecord(c.id, from, 12, plan.price * YEAR_PAID_MONTHS, n++ % 2 ? 'bank' : 'khqr', from, c.endsOn));
            return;
        }
        // ប្រចាំខែ៖ ការបង់ 6 ខែចុងក្រោយ (ឬតាំងពីចុះឈ្មោះ) · ខែនីមួយៗបង់មុនថ្ងៃចាប់ផ្តើមបន្តិច
        for (let i = 1; i <= 6; i++) {
            const to = addDaysIso(-30 * (i - 1), c.endsOn);
            const from = addDaysIso(-30, to);
            if (from < c.createdAt) break;
            const paidOn = addDaysIso(-((n * 7) % 4), from);
            out.push(ctlPaymentRecord(c.id, paidOn, 1, plan.price, ['khqr', 'khqr', 'bank', 'cash'][n++ % 4], from, to));
        }
    });
    return out.sort((a, b) => b.at.localeCompare(a.at));
}

function ctlPaymentRecord(companyId, at, months, amount, method, from, to, ref, by) {
    const digits = String(Math.abs(hashStr(companyId + at + months)) % 1000000).padStart(6, '0');
    return {
        id: `PAY-${at.replace(/-/g, '').slice(2)}-${digits.slice(0, 3)}`, companyId, at, months, amount, method,
        ref: ref != null ? ref : method === 'cash' ? '' : `${method === 'khqr' ? 'KHQR' : 'ABA'}-${digits}`,
        periodFrom: from, periodTo: to, by: by || 'SA-01'
    };
}

function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
}

function ensureControlSeed() {
    if (posRead(CTL_KEYS.companies, null)) return;
    const companies = ctlSeedCompanies();
    posWrite(CTL_KEYS.plans, PLAN_SEED);
    posWrite(CTL_KEYS.companies, companies);
    posWrite(CTL_KEYS.payments, ctlSeedPayments(companies));
    posWrite(CTL_KEYS.log, [
        { id: 'CL-SEED-2', at: isoLocal(new Date(Date.now() - 26 * 3600000)), by: 'SA-01', companyId: 'SHOP-09', type: 'status', note: 'ផ្អាកហាង · មិនបានបង់ប្រាក់ 3 សប្តាហ៍ក្រោយផុតកំណត់' },
        { id: 'CL-SEED-1', at: isoLocal(new Date(Date.now() - 3 * 86400000)), by: 'SA-01', companyId: 'SHOP-07', type: 'company', note: 'បង្កើតហាង · សាកល្បង 14 ថ្ងៃ · កញ្ចប់ចាប់ផ្តើម' }
    ]);
    ctlSyncStatus(companies);
}

/* ===== អាន ===== */

function ctlPlans() {
    return posRead(CTL_KEYS.plans, PLAN_SEED);
}

function planById(id) {
    return ctlPlans().find(p => p.id === id) || ctlPlans()[0];
}

/* ការប្រើប្រាស់៖ ហាងគំរូរាប់ពីទិន្នន័យពិត (បុគ្គលិកសកម្ម ឧបករណ៍បញ្ជរ) · ហាងផ្សេងពីគំរូ */
function ctlUsage(c) {
    const staff = () => loadAllPeople().filter(p => p.active && personShopIds(p).includes(c.id)).length;
    // បញ្ជរ = ចំនួនបញ្ជរដែលបានកំណត់គ្រប់សាខា · សាខា = pos_branches របស់ហាង
    const branches = shopBranches(c.id);
    const regs = branches.reduce((n, b) => n + (Number(b.registers) || 1), 0);
    if (c.demo || c.live) return { branches: branches.length, registers: regs, staff: staff() };
    return c.usage || { branches: 1, registers: 1, staff: 1 };
}

function ctlCompanies() {
    return posRead(CTL_KEYS.companies, []).map(c => Object.assign({}, c, { usage: ctlUsage(c), status: subscriptionStatus(c) }));
}

function ctlCompany(id) {
    return ctlCompanies().find(c => c.id === id) || null;
}

function ctlPayments(companyId) {
    const all = posRead(CTL_KEYS.payments, []);
    return companyId ? all.filter(p => p.companyId === companyId) : all;
}

function ctlLog(companyId) {
    const all = posRead(CTL_KEYS.log, []);
    return companyId ? all.filter(x => x.companyId === companyId) : all;
}

/* ម្ចាស់ហាងបានបញ្ចប់ការរៀបចំហាងលើកដំបូងឬនៅ (ហាងគំរូអានពី data.js · ហាងផ្សេងពីគំរូ) */
function ctlSetupState(c) {
    if (c.demo || c.live) { const st = shopSetup(c.id); return { done: !!st.done, at: st.at || '' }; }
    return { done: c.setupDone !== false, at: '' };
}

function companyName(id) {
    const c = posRead(CTL_KEYS.companies, []).find(x => x.id === id);
    return c ? c.nameKh : id;
}

/* ថ្លៃប្រចាំខែ (ការជាវប្រចាំឆ្នាំ = តម្លៃឆ្នាំ ÷ 12) */
function monthlyValue(c) {
    const p = planById(c.plan);
    return c.cycle === 'year' ? p.price * YEAR_PAID_MONTHS / 12 : p.price;
}

function priceFor(planId, months) {
    const p = planById(planId);
    return Math.floor(months / 12) * p.price * YEAR_PAID_MONTHS + (months % 12) * p.price;
}

/* ចំណូលប្រចាំខែ = ហាងបង់ប្រាក់ដែលនៅប្រើ (មិនរាប់សាកល្បង ផុតកំណត់ ឬផ្អាក) */
function ctlMrr(list) {
    return (list || ctlCompanies()).filter(c => !c.trial && ['active', 'expiring', 'overdue'].includes(c.status))
        .reduce((s, c) => s + monthlyValue(c), 0);
}

/* ត្រូវតាមដាន៖ ជិតផុតកំណត់ · ហួសកំណត់បង់ · សាកល្បងនៅសល់ ≤ 7 ថ្ងៃ */
function needsAttention(c) {
    return c.status === 'expiring' || c.status === 'overdue' || (c.status === 'trial' && daysUntil(c.endsOn) <= SUB_WARN_DAYS);
}

function attentionText(c) {
    const left = daysUntil(c.endsOn);
    if (c.status === 'overdue') return `ហួសកំណត់ ${-left} ថ្ងៃ · ផ្អាកស្វ័យប្រវត្តិក្នុង ${SUB_GRACE_DAYS + left} ថ្ងៃ`;
    if (c.status === 'expiring') return left === 0 ? 'ផុតកំណត់ថ្ងៃនេះ' : `ផុតកំណត់ក្នុង ${left} ថ្ងៃ`;
    if (c.status === 'trial') return left === 0 ? 'សាកល្បងចប់ថ្ងៃនេះ' : `សាកល្បងនៅសល់ ${left} ថ្ងៃ`;
    if (c.status === 'expired') return c.trial ? `សាកល្បងចប់ ${-left} ថ្ងៃមុន · មិនទាន់ជាវ` : `ផុតកំណត់ ${-left} ថ្ងៃមុន`;
    if (c.status === 'suspended') return c.suspendReason || 'បានផ្អាក';
    return left <= 30 ? `ផុតកំណត់ក្នុង ${left} ថ្ងៃ` : `បន្តដល់ ${fmtDate(c.endsOn)}`;
}

function ctlAttentionCount() {
    return ctlCompanies().filter(needsAttention).length;
}

/* ត្រូវប្រមូលប្រាក់៖ ហាងបង់ប្រាក់ដែលផុតកំណត់ក្នុង 14 ថ្ងៃ ឬហួសកំណត់ · សាកល្បងដែលជិតចប់ */
function ctlDueList() {
    return ctlCompanies().filter(c => !c.suspended && c.status !== 'expired' && daysUntil(c.endsOn) <= 14)
        .sort((a, b) => a.endsOn.localeCompare(b.endsOn));
}

function ctlDueCount() {
    return ctlCompanies().filter(c => c.status === 'expiring' || c.status === 'overdue').length;
}

/* ការប្រើប្រាស់ធៀបនឹងដែនកំណត់កញ្ចប់ */
function usageLines(c) {
    const p = planById(c.plan);
    const u = c.usage;
    return [
        { key: 'registers', label: 'បញ្ជរ', used: u.registers, limit: p.registers },
        { key: 'staff', label: 'បុគ្គលិក', used: u.staff, limit: p.staff },
        { key: 'branches', label: 'សាខា', used: u.branches, limit: p.branches }
    ];
}

/* ត្រូវជួយរៀបចំ៖ ហាងសាកល្បងដែលមិនទាន់បញ្ចប់ការរៀបចំហាង (ទូរស័ព្ទជួយមុនសាកល្បងចប់) */
function needsSetupHelp(c) {
    return (c.status === 'trial' || c.status === 'expiring') && c.trial && !ctlSetupState(c).done;
}

/* គួរប្តូរកញ្ចប់៖ ហាងបង់ប្រាក់ដែលប្រើពេញដែនកំណត់ (បញ្ជរ បុគ្គលិក ឬសាខា) */
function upgradeHint(c) {
    if (c.trial || !['active', 'expiring', 'overdue'].includes(c.status)) return '';
    // សាខាតែមួយក្នុងកញ្ចប់សាខាតែមួយ គឺធម្មតា មិនមែនសញ្ញាត្រូវប្តូរកញ្ចប់ទេ
    const full = usageLines(c).filter(l => l.used >= l.limit && !(l.key === 'branches' && l.limit === 1)).map(l => l.label);
    const bigger = ctlPlans().find(p => p.price > planById(c.plan).price);
    return full.length && bigger ? `ប្រើពេញ ${full.join(' ')} · ស្នើកញ្ចប់${bigger.name}` : '';
}

/* អត្រាប្តូរពីសាកល្បងទៅជាវ៖ ហាងដែលធ្លាប់សាកល្បង ហើយឥឡូវបង់ប្រាក់ ធៀបនឹងសាកល្បងដែលចប់រួច */
function trialConversion() {
    const all = ctlCompanies();
    const converted = all.filter(c => !c.trial && ctlPayments(c.id).length && c.createdAt >= addDaysIso(-120)).length;
    const lost = all.filter(c => c.trial && c.status === 'expired').length;
    return { converted, lost, rate: converted + lost ? Math.round(converted / (converted + lost) * 100) : 0 };
}

/* ការរំលឹកចុងក្រោយ (ការបង់ប្រាក់) · កំណត់ចំណាំខាងក្នុង */
function lastReminder(c) {
    return ctlLog(c.id).find(x => x.type === 'reminder') || null;
}

function reminderText(c) {
    const r = lastReminder(c);
    if (!r) return '';
    const d = Math.max(0, Math.round((new Date() - new Date(r.at)) / 86400000));
    return `រំលឹក${d === 0 ? 'ថ្ងៃនេះ' : ` ${d} ថ្ងៃមុន`}`;
}

async function ctlRemindDialog(id) {
    const c = ctlCompany(id);
    const ch = await showOptionDialog({
        title: `រំលឹក ${c.nameKh}`,
        message: `${attentionText(c)} · ${escapeText(c.ownerName)} <span class="sm-figure">${escapeText(c.ownerPhone)}</span>${lastReminder(c) ? ` · ${reminderText(c)}` : ''}`,
        options: Object.keys(REMIND_CHANNELS).map(k => ({ value: k, icon: REMIND_CHANNELS[k].icon, label: REMIND_CHANNELS[k].label, desc: k === 'call' ? 'កត់ត្រាបន្ទាប់ពីនិយាយរួច' : 'កត់ត្រាបន្ទាប់ពីផ្ញើសាររួច' }))
    });
    if (!ch) return false;
    ctlAddLog(id, 'reminder', `រំលឹកតាម${REMIND_CHANNELS[ch].label} · ${attentionText(c)}`);
    showToast(`បានកត់ត្រាការរំលឹក ${c.nameKh}`, 'success');
    return true;
}

function ctlAddNote(id, text) {
    ctlAddLog(id, 'note', text);
}

/* សាខារបស់ហាងមួយ (ចំនួនប្រើប្រាស់តែប៉ុណ្ណោះ · គ្មានការលក់) · ហាងគំរូផ្សេងទៀតគ្មានសាខាដែលបានកត់ត្រា */
function ctlBranches(c) {
    if (!(c.demo || c.live)) return [{ id: 'BR-01', name: c.branch, address: c.city, registers: c.usage.registers, devices: null, staff: c.usage.staff }];
    return shopBranches(c.id).map(b => ({
        id: b.id, name: b.name, address: b.address || '', phone: b.phone || '', registers: Number(b.registers) || 1,
        devices: deviceList().filter(d => d.shopId === c.id && (d.branchId || 'BR-01') === b.id).length,
        staff: loadAllPeople().filter(p => p.active && p.role !== 'admin' && personShopIds(p).includes(c.id) && (p.branchId || 'BR-01') === b.id).length
    }));
}

/* ===== សំណើពីហាង (ម្ចាស់ហាងជូនដំណឹងថាបានបង់ · ស្នើប្តូរកញ្ចប់) ===== */
function ctlPendingRequests() {
    return subRequests().filter(r => r.status === 'pending');
}

function ctlRequestCount() {
    return ctlPendingRequests().length;
}

function ctlResolveRequest(id, status, answer) {
    const list = posRead('pos_ctl_requests', []) || [];
    const r = list.find(x => x.id === id);
    if (!r) return;
    Object.assign(r, { status, answer: answer || '', doneAt: isoLocal(new Date()), doneBy: ctlMe() });
    posWrite('pos_ctl_requests', list);
}

function requestText(r) {
    return r.type === 'claim'
        ? `ជូនដំណឹងថាបានបង់ ${fmtUSD(r.amount)} · ${r.months} ខែ · ${PAY_METHODS[r.method] ? PAY_METHODS[r.method].label : ''}${r.ref ? ` · ${r.ref}` : ''}`
        : `ស្នើប្តូរទៅកញ្ចប់${planById(r.planId).name}${r.note ? ` · ${r.note}` : ''}`;
}

async function ctlApprovePlanRequest(id) {
    const r = subRequests().find(x => x.id === id);
    const c = ctlCompany(r.shopId);
    const p = planById(r.planId);
    const over = [['registers', 'បញ្ជរ'], ['staff', 'បុគ្គលិក'], ['branches', 'សាខា']].filter(([k]) => c.usage[k] > p[k]);
    if (over.length) { showToast(`${c.nameKh} ប្រើលើសកញ្ចប់${p.name} (${over.map(o => o[1]).join(' ')})`, 'error'); return false; }
    const ok = await showCustomConfirm({ title: `ប្តូរ ${c.nameKh} ទៅកញ្ចប់${p.name}`, message: `${fmtUSD(p.price)}/ខែ · តម្លៃថ្មីគិតពីការបង់លើកក្រោយ · ម្ចាស់ហាងឃើញលទ្ធផលនៅទំព័រការជាវ`, confirmText: 'ប្តូរកញ្ចប់' });
    if (!ok) return false;
    ctlChangePlan(c.id, p.id);
    ctlResolveRequest(id, 'done', `បានប្តូរទៅកញ្ចប់${p.name}`);
    showToast(`${c.nameKh} ប្តូរទៅកញ្ចប់${p.name}`, 'success');
    return true;
}

async function ctlRejectRequest(id) {
    const reason = await showReasonPrompt({ title: 'បដិសេធសំណើ', message: 'ម្ចាស់ហាងឃើញមូលហេតុនេះនៅទំព័រការជាវ', reasons: ['រកមិនឃើញការបង់ប្រាក់នេះក្នុងគណនី', 'ចំនួនទឹកប្រាក់មិនត្រូវ', 'ការប្រើប្រាស់លើសកញ្ចប់ដែលស្នើ'], confirmText: 'បដិសេធ', danger: true });
    if (!reason) return false;
    const r = subRequests().find(x => x.id === id);
    ctlResolveRequest(id, 'rejected', reason);
    ctlAddLog(r.shopId, 'note', `បដិសេធសំណើ · ${reason}`);
    showToast('បានបដិសេធសំណើ', 'success');
    return true;
}

/* ===== សរសេរ ===== */

function ctlSaveCompanies(list) {
    const clean = list.map(c => { const x = Object.assign({}, c); delete x.status; if (x.demo) x.usage = null; return x; });
    posWrite(CTL_KEYS.companies, clean);
    ctlSyncStatus(clean);
}

/* ស្ថានភាពការជាវដែលទំព័រហាងត្រូវដឹង (data.js shopSubscription) */
function ctlSyncStatus(list) {
    const st = {};
    list.forEach(c => {
        const p = planById(c.plan);
        st[c.id] = { plan: c.plan, planName: p.name, cycle: c.cycle, trial: !!c.trial, endsOn: c.endsOn, suspended: !!c.suspended, suspendReason: c.suspendReason || '',
            limits: { registers: p.registers, staff: p.staff, branches: p.branches } };
    });
    posWrite(CTL_KEYS.status, st);
}

function ctlUpdate(id, patch) {
    const list = posRead(CTL_KEYS.companies, []);
    const i = list.findIndex(c => c.id === id);
    if (i < 0) return null;
    list[i] = Object.assign({}, list[i], patch);
    ctlSaveCompanies(list);
    return list[i];
}

function ctlAddLog(companyId, type, note) {
    const list = posRead(CTL_KEYS.log, []);
    list.unshift({ id: newId('CL'), at: isoLocal(new Date()), by: ctlMe(), companyId, type, note });
    posWrite(CTL_KEYS.log, list.slice(0, 1000));
}

function ctlMe() {
    return SESSION && SESSION.control ? SESSION.userId : 'SA-01';
}

/* កត់ត្រាការបង់ប្រាក់៖ រយៈពេលថ្មីចាប់ពីថ្ងៃផុតកំណត់ (ឬថ្ងៃនេះ បើផុតយូរហើយ) · សាកល្បង → ជាវ · ផ្អាកដោយសារមិនបង់ → បើកវិញ */
function ctlRecordPayment(id, opts) {
    const c = ctlCompany(id);
    const today = isoDate(new Date());
    const from = !c.trial && c.endsOn >= today ? c.endsOn : today;
    const to = addMonthsIso(from, opts.months);
    const pay = ctlPaymentRecord(id, today, opts.months, opts.amount, opts.method, from, to, opts.ref || '', ctlMe());
    pay.id = newId('PAY');
    const list = posRead(CTL_KEYS.payments, []);
    list.unshift(pay);
    posWrite(CTL_KEYS.payments, list);
    ctlUpdate(id, { trial: false, endsOn: to, cycle: opts.months >= 12 ? 'year' : 'month', suspended: false, suspendReason: '' });
    ctlAddLog(id, 'payment', `ទទួលប្រាក់ ${fmtUSD(opts.amount)} · ${opts.months} ខែ · ${PAY_METHODS[opts.method].label}${opts.ref ? ` · ${opts.ref}` : ''} · បន្តដល់ ${fmtDate(to)}`);
    return pay;
}

function addMonthsIso(from, months) {
    const d = new Date(from + 'T12:00');
    d.setMonth(d.getMonth() + months);
    return isoDate(d);
}

function ctlChangePlan(id, planId) {
    const c = ctlCompany(id);
    ctlUpdate(id, { plan: planId });
    ctlAddLog(id, 'plan', `ប្តូរកញ្ចប់ ${planById(c.plan).name} → ${planById(planId).name}`);
}

function ctlSuspend(id, reason) {
    ctlUpdate(id, { suspended: true, suspendReason: reason });
    ctlAddLog(id, 'status', `ផ្អាកហាង · ${reason}`);
}

function ctlResume(id) {
    ctlUpdate(id, { suspended: false, suspendReason: '' });
    ctlAddLog(id, 'status', 'បើកហាងវិញ');
}

function ctlExtendTrial(id, days) {
    const c = ctlCompany(id);
    const base = c.endsOn >= isoDate(new Date()) ? c.endsOn : isoDate(new Date());
    const to = addDaysIso(days, base);
    ctlUpdate(id, { endsOn: to });
    ctlAddLog(id, 'plan', `បន្ថែមសាកល្បង ${days} ថ្ងៃ · ដល់ ${fmtDate(to)}`);
}

function ctlNextCompanyId() {
    const n = posRead(CTL_KEYS.companies, []).map(c => Number(String(c.id).replace(/\D/g, '')) || 0);
    return `SHOP-${pad2(Math.max(0, ...n) + 1)}`;
}

function ctlCreateCompany(v) {
    const list = posRead(CTL_KEYS.companies, []);
    const c = {
        id: ctlNextCompanyId(), nameKh: v.nameKh, nameLatin: v.nameLatin, city: v.city, branch: v.branch,
        ownerName: v.ownerName, ownerPhone: v.ownerPhone, ownerEmail: v.ownerEmail,
        plan: v.plan, cycle: 'month', trial: true, suspended: false, suspendReason: '',
        endsOn: addDaysIso(TRIAL_DAYS), createdAt: isoDate(new Date()), usage: null, live: true
    };
    list.push(c);
    ctlSaveCompanies(list);
    // ហាងថ្មីលេចក្នុងបញ្ជីហាងរបស់ data.js (ឈ្មោះ សាខា) · ទិន្នន័យហាងចាប់ផ្តើមទទេ
    const shops = posRead('pos_shops', []);
    shops.push({ id: c.id, nameKh: c.nameKh, name: c.nameLatin, branch: c.branch, city: c.city, phone: c.ownerPhone, tin: '', account: '' });
    posWrite('pos_shops', shops);
    // គណនីម្ចាស់ហាង៖ ពាក្យសម្ងាត់បណ្តោះអាសន្ន (បង្ហាញម្តង) · ប្រព័ន្ធពិតផ្ញើតំណកំណត់ពាក្យសម្ងាត់តាមសារ
    const owner = ctlCreateOwner(c, v);
    ctlAddLog(c.id, 'company', `បង្កើតហាង · សាកល្បង ${TRIAL_DAYS} ថ្ងៃ · កញ្ចប់${planById(c.plan).name} · ម្ចាស់ ${c.ownerName}`);
    return { company: c, owner };
}

function ctlCreateOwner(c, v) {
    const people = loadAllPeople();
    const n = Math.max(0, ...people.filter(p => p.id.startsWith('ADM-')).map(p => Number(p.id.split('-')[1]) || 0)) + 1;
    const pin = String(100000 + Math.floor(Math.random() * 900000));
    const password = `${['shop', 'pos', 'start'][n % 3]}${1000 + Math.floor(Math.random() * 9000)}`;
    const words = v.ownerName.trim().split(/\s+/);
    const person = { id: `ADM-${pad2(n)}`, name: v.ownerName.trim(), initials: words.map(w => w[0]).join('').slice(0, 2),
        pin, phone: v.ownerPhone.trim(), email: (v.ownerEmail || '').trim().toLowerCase(), password, role: 'admin', shopId: c.id };
    const st = staffStore();
    st.added = (st.added || []).concat([person]);
    posWrite(STAFF_KEY, st);
    return { id: person.id, name: person.name, phone: person.phone, password, pin };
}

/* លេខទូរស័ព្ទ និងអ៊ីមែលមិនជាន់គ្នាទូទាំងប្រព័ន្ធ (មនុស្សម្នាក់ គណនីមួយ · P0-09) */
function ctlContactTaken(phone, email) {
    const ph = normPhone(phone);
    const em = String(email || '').trim().toLowerCase();
    const people = ALL_STAFF.concat(CONTROL_ACCOUNTS).map(p => ({ phone: p.phone, email: p.email }))
        .concat(posRead(CTL_KEYS.companies, []).filter(c => !c.demo).map(c => ({ phone: c.ownerPhone, email: c.ownerEmail })));
    if (ph && people.some(p => p.phone && normPhone(p.phone) === ph)) return 'លេខទូរស័ព្ទនេះមានគណនីរួចហើយ · ម្នាក់ប្រើគណនីតែមួយ (បន្ថែមហាងទៅគណនីដែលមានជំនួសវិញ)';
    if (em && people.some(p => (p.email || '').toLowerCase() === em)) return 'អ៊ីមែលនេះមានគណនីរួចហើយ';
    return '';
}

/* ===== ចូលមើលដើម្បីជួយ =====
   ត្រូវមានមូលហេតុ · មានសុពលភាព 30 នាទី · មើលតែប៉ុណ្ណោះ (ប្រព័ន្ធពិត)
   ម្ចាស់ហាងឃើញការចូលមើលក្នុងកំណត់ហេតុសវនកម្មរបស់ខ្លួន (pos_admin_log ប្រភេទ support) */
function ctlSupportSessions() {
    return posRead(CTL_KEYS.support, []);
}

function ctlActiveSupport(companyId) {
    const now = isoLocal(new Date());
    return ctlSupportSessions().find(s => s.companyId === companyId && !s.endedAt && s.until > now) || null;
}

function ctlStartSupport(companyId, reason) {
    const list = ctlSupportSessions();
    const s = { id: newId('SUP'), companyId, by: ctlMe(), reason, at: isoLocal(new Date()), until: isoLocal(new Date(Date.now() + SUPPORT_MINUTES * 60000)), endedAt: '' };
    list.unshift(s);
    posWrite(CTL_KEYS.support, list.slice(0, 200));
    ctlAddLog(companyId, 'support', `ចូលមើលដើម្បីជួយ ${SUPPORT_MINUTES} នាទី · ${reason}`);
    // ហាងគំរូ៖ ម្ចាស់ហាងឃើញក្នុងកំណត់ហេតុសវនកម្មរបស់ខ្លួន
    if (companyId === 'SHOP-01' || companyId === 'SHOP-02') {
        const log = posRead('pos_admin_log', []);
        log.unshift({ id: newId('AL'), type: 'support', note: `DIGITECHKH ចូលមើលដើម្បីជួយ (មើលតែប៉ុណ្ណោះ ${SUPPORT_MINUTES} នាទី) · ${reason}`, at: s.at, by: s.by });
        posWrite('pos_admin_log', log.slice(0, 500));
    }
    return s;
}

function ctlEndSupport(companyId) {
    const list = ctlSupportSessions();
    const s = list.find(x => x.companyId === companyId && !x.endedAt);
    if (!s) return;
    s.endedAt = isoLocal(new Date());
    posWrite(CTL_KEYS.support, list);
    ctlAddLog(companyId, 'support', 'បញ្ចប់ការចូលមើល');
}

/* ===== សមាសធាតុ UI រួម (ដូចទំព័រហាង តែមិនផ្ទុក manager-data.js) ===== */

function subChip(c) {
    const m = SUB_STATUS[c.status] || SUB_STATUS.active;
    return `<span class="sm-badge inline-flex items-center px-2.5 py-0.5 rounded-full border whitespace-nowrap ${m.cls}">${m.label}</span>`;
}

function kpiCard(label, value, sub, tone, href) {
    if (!/rose|red|amber/.test(tone || '')) tone = '';
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

function dotsBtn(mid) {
    return `<button onclick="toggleRowActionMenu(event, '${mid}')" type="button" aria-label="សកម្មភាព" class="w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 inline-flex items-center justify-center"><i class="fas fa-ellipsis-vertical text-sm"></i></button>`;
}

function menuItem(icon, label, act, danger) {
    return `<button type="button" onclick="closeAllFloatingDropdowns(); ${act}" class="sm-row-menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50'}">
        <i class="fas ${icon} w-4 text-center text-[13px] ${danger ? '' : 'text-slate-400'}"></i>${label}</button>`;
}

/* ⋮ សម្រាប់ហាងមួយ (បញ្ជីហាង · ផ្ទាំងគ្រប់គ្រង) · onDone = ឈ្មោះអនុគមន៍គូរឡើងវិញ */
function companyMenu(c, mid, onDone) {
    const sep = '<div class="h-px bg-slate-100 my-1"></div>';
    const items = [
        menuItem('fa-store', 'មើលព័ត៌មាន', `openCompany('${c.id}')`),
        sep,
        c.status !== 'suspended' ? menuItem('fa-receipt', 'កត់ត្រាការបង់ប្រាក់', `ctlOpenPayment('${c.id}')`) : '',
        needsAttention(c) || c.status === 'expired' ? menuItem('fa-bell', 'រំលឹក', `ctlRemindDialog('${c.id}').then(ok => ok && ${onDone}())`) : '',
        menuItem('fa-box', 'ប្តូរកញ្ចប់', `ctlPlanDialog('${c.id}').then(ok => ok && ${onDone}())`),
        c.trial && c.status !== 'suspended' ? menuItem('fa-hourglass-half', 'បន្ថែមថ្ងៃសាកល្បង', `ctlTrialDialog('${c.id}').then(ok => ok && ${onDone}())`) : '',
        sep,
        c.suspended ? menuItem('fa-store', 'បើកហាងវិញ', `ctlResumeDialog('${c.id}').then(ok => ok && ${onDone}())`)
            : menuItem('fa-store-slash', 'ផ្អាកហាង', `ctlSuspendDialog('${c.id}').then(ok => ok && ${onDone}())`, true)
    ];
    return `<div id="${mid}" class="hidden bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 text-left min-w-[230px]">${items.join('')}</div>`;
}

function openCompany(id) {
    const root = document.body.dataset.roleRoot || '../..';
    location.href = `${root}/control/companies/view-company.html?id=${encodeURIComponent(id)}`;
}

function planLabel(c) {
    const p = planById(c.plan);
    return `${p.name} · ${fmtUSD(p.price)}/ខែ${c.cycle === 'year' ? ' · ប្រចាំឆ្នាំ' : ''}`;
}

/* ===== ប្រអប់សកម្មភាព (ប្រើរួមគ្រប់ទំព័រ) — ត្រឡប់ true ពេលបានធ្វើ ===== */

/* កត់ត្រាការបង់ប្រាក់ជាទំព័រពេញ · ត្រឡប់មកទំព័រដែលបើកវា */
function ctlOpenPayment(id, claimId) {
    const here = location.pathname.split('/').slice(-2).join('/') + location.search;
    location.href = `${document.body.dataset.roleRoot || '../..'}/control/billing/create-payment.html?id=${encodeURIComponent(id)}${claimId ? `&claim=${encodeURIComponent(claimId)}` : ''}&back=${encodeURIComponent('../' + here)}`;
}

async function ctlPlanDialog(id) {
    const c = ctlCompany(id);
    if (!c) return false;
    const picked = await showOptionDialog({
        title: `ប្តូរកញ្ចប់ · ${c.nameKh}`,
        message: `ឥឡូវ៖ ${planLabel(c)} · តម្លៃថ្មីគិតពីការបង់លើកក្រោយ`,
        options: ctlPlans().filter(p => p.id !== c.plan).map(p => {
            const over = [['registers', 'បញ្ជរ'], ['staff', 'បុគ្គលិក'], ['branches', 'សាខា']].filter(([k]) => c.usage[k] > p[k]);
            return { value: p.id, icon: 'fa-box', label: `${p.name} · ${fmtUSD(p.price)}/ខែ`,
                desc: `${p.registers} បញ្ជរ · ${p.staff} បុគ្គលិក · ${p.branches} សាខា${over.length ? ` · <span class="text-amber-700">ប្រើលើស៖ ${over.map(o => o[1]).join(' ')}</span>` : ''}` };
        })
    });
    if (!picked) return false;
    const p = planById(picked);
    const over = [['registers', 'បញ្ជរ'], ['staff', 'បុគ្គលិក'], ['branches', 'សាខា']].filter(([k]) => c.usage[k] > p[k]);
    if (over.length) {
        await showCustomConfirm({
            title: 'ប្តូរទៅកញ្ចប់តូចមិនបាន',
            message: `${c.nameKh} កំពុងប្រើ ${over.map(([k, l]) => `${l} ${c.usage[k]} (កញ្ចប់${p.name} អនុញ្ញាត ${p[k]})`).join(' · ')}។ ម្ចាស់ហាងត្រូវដកឧបករណ៍ ឬផ្អាកបុគ្គលិកជាមុនសិន។`,
            confirmText: 'យល់ព្រម', hideCancel: true
        });
        return false;
    }
    ctlChangePlan(id, picked);
    showToast(`${c.nameKh} ប្តូរទៅកញ្ចប់${p.name}`, 'success');
    return true;
}

async function ctlTrialDialog(id) {
    const c = ctlCompany(id);
    const days = await showOptionDialog({
        title: `បន្ថែមថ្ងៃសាកល្បង · ${c.nameKh}`,
        message: `សាកល្បងបច្ចុប្បន្នដល់ ${fmtDate(c.endsOn)}`,
        options: [7, 14].map(d => ({ value: d, icon: 'fa-hourglass-half', label: `${d} ថ្ងៃ`, desc: `ដល់ ${fmtDate(addDaysIso(d, c.endsOn >= isoDate(new Date()) ? c.endsOn : isoDate(new Date())))}` }))
    });
    if (!days) return false;
    ctlExtendTrial(id, days);
    showToast(`បានបន្ថែមសាកល្បង ${days} ថ្ងៃ ឱ្យ ${c.nameKh}`, 'success');
    return true;
}

async function ctlSuspendDialog(id) {
    const c = ctlCompany(id);
    const reason = await showReasonPrompt({
        title: `ផ្អាក ${c.nameKh}`,
        message: 'បុគ្គលិក និងម្ចាស់ហាងនឹងចូលប្រើមិនបានភ្លាម។ ទិន្នន័យរបស់ហាងមិនត្រូវលុបទេ ហើយអាចបើកវិញពេលណាក៏បាន។',
        placeholder: 'មូលហេតុ…',
        reasons: ['មិនបានបង់ប្រាក់ក្រោយផុតកំណត់', 'ម្ចាស់ហាងស្នើសុំឈប់ប្រើបណ្តោះអាសន្ន', 'សង្ស័យការប្រើប្រាស់មិនត្រឹមត្រូវ'],
        confirmText: 'ផ្អាកហាង',
        danger: true
    });
    if (!reason) return false;
    ctlSuspend(id, reason);
    showToast(`បានផ្អាក ${c.nameKh}`, 'success');
    return true;
}

async function ctlResumeDialog(id) {
    const c = ctlCompany(id);
    const ok = await showCustomConfirm({
        title: `បើក ${c.nameKh} វិញ`,
        message: daysUntil(c.endsOn) < -SUB_GRACE_DAYS && !c.trial
            ? `ការជាវផុតកំណត់តាំងពី ${fmtDate(c.endsOn)}។ បើកវិញហើយ ហាងនៅតែចូលមិនបាន រហូតដល់កត់ត្រាការបង់ប្រាក់។`
            : 'បុគ្គលិក និងម្ចាស់ហាងនឹងចូលប្រើបានវិញភ្លាម។',
        confirmText: 'បើកវិញ'
    });
    if (!ok) return false;
    ctlResume(id);
    showToast(`បានបើក ${c.nameKh} វិញ`, 'success');
    return true;
}

/* ===== ការជូនដំណឹង (portal.js) ===== */
function portalNotifications() {
    const root = document.body.dataset.roleRoot || '../..';
    return ctlCompanies().filter(c => needsAttention(c) || c.status === 'expired')
        .sort((a, b) => a.endsOn.localeCompare(b.endsOn)).slice(0, 8).map(c => ({
            icon: c.status === 'overdue' || c.status === 'expired' ? 'mdi:store-alert-outline' : 'mdi:calendar-clock',
            tone: c.status === 'overdue' || c.status === 'expired' ? 'danger' : 'warning',
            title: c.nameKh,
            note: `${attentionText(c)} · ${planById(c.plan).name}`,
            href: `${root}/control/companies/view-company.html?id=${c.id}`
        }));
}

ensureControlSeed();
