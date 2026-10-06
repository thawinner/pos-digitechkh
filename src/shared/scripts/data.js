/* ច្រកគិតលុយលក់រាយ (POS) — ឃ្លាំងទិន្នន័យរួមសម្រាប់តួនាទីទាំងពីរ

   ⚠️ គោលការណ៍សុវត្ថិភាព
   • ឯកសារនេះផ្ទុកតែវេនដែលកំពុងដំណើរការលើម៉ាស៊ីននេះ (ទិន្នន័យរស់ក្នុង localStorage)។
     ប្រវត្តិវេនមុនៗ និងបញ្ជរផ្សេង មាននៅក្នុង manager-data.js ដែលផ្ទុកតែលើទំព័រអ្នកគ្រប់គ្រងប៉ុណ្ណោះ
     ដូច្នេះទំព័រអ្នកគិតលុយមិនដែលទទួលបានទិន្នន័យវេនផ្សេងឡើយ (ឯកសាររចនាលេខ 02 ផ្នែក 7.1)។
   • គ្មានថ្លៃដើមទិញនៅទីនេះទេ — ទាំងអ្នកគិតលុយ និងអ្នកគ្រប់គ្រងមិនមានសិទ្ធិមើល។
   • ពេលវេលាទាំងអស់គណនាធៀបនឹងម៉ោងពិត មិនប្រើកាលបរិច្ឆេទថេរឡើយ (បញ្ជីពិនិត្យលេខ 06 ផ្នែក ឃ)។ */

const BMS_TODAY = new Date();

const MONTHS_KH = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

/* ===== ទ្រង់ទ្រាយ ===== */

function pad2(n) {
    return String(n).padStart(2, '0');
}

function isoLocal(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function isDateObj(d) {
    return d instanceof Date || (d != null && typeof d === 'object' && typeof d.getTime === 'function' && typeof d.getFullYear === 'function');
}

function isoDate(d) {
    if (!d) return '';
    if (typeof d === 'string') return d.slice(0, 10);
    if (isDateObj(d)) {
        if (isNaN(d.getTime())) return '';
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    }
    return '';
}

function toIsoDateStr(d) {
    if (!d) return '';
    if (isDateObj(d)) {
        if (isNaN(d.getTime())) return '';
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    }
    if (typeof d === 'string') {
        if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
        const parsed = new Date(d);
        if (!isNaN(parsed.getTime())) {
            return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
        }
        return d;
    }
    return '';
}

function fmtUSD(amount) {
    return '$' + Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtKHR(amount) {
    return Number(Math.round(amount || 0)).toLocaleString('en-US') + ' ៛';
}

/* លេខមានសញ្ញា — ប្រើសម្រាប់ភាពខុសគ្នា */
function fmtSigned(n, fmt, eps) {
    if (Math.abs(n) <= (eps || 0.005)) return fmt(0);
    return (n > 0 ? '+' : '−') + fmt(Math.abs(n));
}

function fmtKhDate(iso) {
    const d = new Date(iso);
    return `${d.getDate()} ${MONTHS_KH[d.getMonth()]} ${d.getFullYear()}`;
}

/* DD/MM/YYYY (ឯកសារស្តង់ដារលេខ 05 ផ្នែក 6) */
function fmtDate(iso) {
    if (!iso) return '—';
    if (isDateObj(iso)) {
        if (isNaN(iso.getTime())) return '—';
        return `${pad2(iso.getDate())}/${pad2(iso.getMonth() + 1)}/${iso.getFullYear()}`;
    }
    const str = String(iso);
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        const parts = str.slice(0, 10).split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function fmtTime(iso) {
    const d = new Date(iso);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function fmtDuration(ms) {
    const total = Math.max(Math.floor(ms / 60000), 0);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return h ? `${h} ម៉ោង ${m} នាទី` : `${m} នាទី`;
}

function escapeText(t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ===== ការផ្ទុក =====
   ទិន្នន័យដែលតួនាទីទាំងពីរត្រូវឃើញ ស្ថិតក្នុង localStorage (sessionStorage មួយផ្ទាំងមួយ
   ដូច្នេះផ្ទាំងអ្នកគ្រប់គ្រងមិនដែលឃើញការលក់ — ផែនការកែលម្អ C8)។
   មានតែកន្ត្រកបច្ចុប្បន្ន និងការទូទាត់ KHQR ដែលកំពុងរង់ចាំទេ ដែលនៅក្នុង sessionStorage។ */

const POS_KEYS = {
    seed: 'pos_seed_v3',
    settings: 'pos_settings',
    shifts: 'pos_shifts',
    sales: 'pos_shift_sales',
    held: 'pos_held_sales',
    approvals: 'pos_approvals',
    movements: 'pos_cash_movements',
    events: 'pos_events',
    lock: 'pos_terminal_lock',
    cart: 'pos_cart',
    pending: 'pos_pending_khqr'
};

function posRead(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}

function posWrite(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        // ការផ្ទុកត្រូវបានបិទ — ទិន្នន័យនៅរស់ត្រឹមទំព័របច្ចុប្បន្ន
    }
}

function sessRead(key, fallback) {
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}

function sessWrite(key, value) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        // មិនអាចរក្សាទុក
    }
}

function sessRemove(key) {
    try {
        sessionStorage.removeItem(key);
    } catch (e) {
        // មិនអាចសម្អាត
    }
}

function newId(prefix) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function upsertById(key, record) {
    const list = posRead(key, []);
    const i = list.findIndex(x => x.id === record.id);
    if (i >= 0) list[i] = record; else list.push(record);
    posWrite(key, list);
    return record;
}

function patchById(key, id, patch) {
    const list = posRead(key, []);
    const i = list.findIndex(x => x.id === id);
    if (i < 0) return null;
    list[i] = Object.assign({}, list[i], patch);
    posWrite(key, list);
    return list[i];
}

/* ផ្ទាំងរុករកផ្សេង (ឧ. អ្នកគ្រប់គ្រងអនុម័តសំណើ) កែទិន្នន័យ → ជូនដំណឹងទៅ portal.js
   ដើម្បីធ្វើបច្ចុប្បន្នភាពផ្លាកលេខ និងទំព័រ ដោយមិនចាំបាច់ផ្ទុកឡើងវិញ (បញ្ជីពិនិត្យលេខ 06 ផ្នែក ឆ) */
window.addEventListener('storage', e => {
    if (e.key && !e.key.startsWith('pos_')) return;
    window.dispatchEvent(new CustomEvent('bms-store-changed', { detail: { key: e.key } }));
});

/* ===== ហាង មនុស្ស និងបញ្ជរ ===== */

/* ព័ត៌មានហាង (ហាងគំរូសម្រាប់បង្ហាញ) — ហាងពិតកែតែនៅទីនេះ (ឈ្មោះ សាខា ឡូហ្គោ)
   nameKh បង្ហាញលើអេក្រង់ វិក្កយបត្រ និងរបាយការណ៍ · name (អក្សរឡាតាំង) សម្រាប់ KHQR តាមស្តង់ដារធនាគារ
   DIGITECHKH = ក្រុមអ្នកអភិវឌ្ឍប្រព័ន្ធ មិនមែនហាងទេ (បង្ហាញតែជា «អភិវឌ្ឍដោយ») */
const MERCHANT = {
    nameKh: 'DIGITECHKH',
    name: 'DIGITECHKH SHOP',
    logo: 'shared/assets/logo-mark-transparent.png',
    branch: 'សាខាកណ្តាល ភ្នំពេញ',
    tin: 'K001-901234567',
    phone: '023 999 888',
    account: 'digitechkh@aclb',
    city: 'PHNOM PENH'
};

/* បុគ្គលិក៖ តួនាទី 3 — ម្ចាស់ហាង (admin) · អ្នកគ្រប់គ្រង (manager) · អ្នកគិតលុយ (cashier)
   លេខសម្ងាត់សម្រាប់គំរូសាកល្បងប៉ុណ្ណោះ — ប្រព័ន្ធពិតរក្សាទុកជាសញ្ញាកូដនៅម៉ាស៊ីនមេ។
   ម្ចាស់ហាងបន្ថែមបុគ្គលិក ប្តូរតួនាទី ឬផ្អាកគណនីនៅទំព័រ «បុគ្គលិក» (រក្សាក្នុង pos_staff)។
   គណនីដែលផ្អាកមិនអាចចូលប្រើបាន ប៉ុន្តែឈ្មោះនៅតែបង្ហាញក្នុងប្រវត្តិ (personById រកឃើញជានិច្ច)។ */
/* គណនីចូលប្រើ៖ អ៊ីមែល ឬលេខទូរស័ព្ទ + ពាក្យសម្ងាត់ (ទំព័រចូលប្រើ) · pin = លេខកូដ 4 ខ្ទង់សម្រាប់អនុម័ត និងដោះសោផ្ទាំងគិតលុយ */
const STAFF_SEED = [
    { id: 'CAS-01', name: 'ចន្ទ មករា', initials: 'ចម', pin: '1111', phone: '012 345 678', email: 'makara@digitechkh.com', password: 'makara2026', role: 'cashier' },
    { id: 'CAS-02', name: 'សុខ ដារ៉ា', initials: 'សដ', pin: '2222', phone: '098 765 432', email: 'dara@digitechkh.com', password: 'dara2026', role: 'cashier' },
    { id: 'CAS-03', name: 'លី សុភា', initials: 'លស', pin: '3333', phone: '015 888 999', email: 'sophea@digitechkh.com', password: 'sophea2026', role: 'cashier' },
    { id: 'CAS-04', name: 'ពេជ្រ សុវណ្ណារី', initials: 'ពស', pin: '4444', phone: '016 727 340', email: 'sovannary@digitechkh.com', password: 'sovannary2026', role: 'cashier' },
    { id: 'CAS-05', name: 'គឹម វិសាល', initials: 'គវ', pin: '5555', phone: '070 515 662', email: 'visal@digitechkh.com', password: 'visal2026', role: 'cashier' },
    { id: 'CAS-06', name: 'ឈឹម រតនា', initials: 'ឈរ', pin: '6666', phone: '096 330 184', email: 'ratana@digitechkh.com', password: 'ratana2026', role: 'cashier' },
    { id: 'MGR-01', name: 'សុខ វណ្ណា', initials: 'សវ', pin: '2468', phone: '077 222 333', email: 'vanna@digitechkh.com', password: 'vanna2026', role: 'manager' },
    { id: 'MGR-02', name: 'ម៉ៅ ស្រីនាង', initials: 'មស', pin: '1357', phone: '089 444 555', email: 'sreynang@digitechkh.com', password: 'sreynang2026', role: 'manager' },
    { id: 'MGR-03', name: 'នួន សុខលី', initials: 'នស', pin: '8642', phone: '011 606 275', email: 'sokly@digitechkh.com', password: 'sokly2026', role: 'manager' },
    { id: 'ADM-01', name: 'ហេង ចាន់ថា', initials: 'ហច', pin: '9999', phone: '012 999 000', email: 'chantha@digitechkh.com', password: 'chantha2026', role: 'admin' }
];
const STAFF_KEY = 'pos_staff';

function staffStore() {
    return posRead(STAFF_KEY, { added: [], changes: {} });
}

function loadStaff() {
    const st = staffStore();
    return STAFF_SEED.concat(st.added || []).map(p => Object.assign({ active: true }, p, (st.changes || {})[p.id] || {}));
}

const ALL_STAFF = loadStaff();
const CASHIERS = ALL_STAFF.filter(p => p.active && p.role === 'cashier');
const MANAGERS = ALL_STAFF.filter(p => p.active && p.role === 'manager');
const ADMINS = ALL_STAFF.filter(p => p.active && p.role === 'admin');

const REGISTERS = ['POS-01', 'POS-02', 'POS-03'];


const ROLE_NAME = {
    cashier: 'អ្នកគិតលុយ',
    manager: 'អ្នកគ្រប់គ្រង',
    admin: 'ម្ចាស់ហាង'
};

function personById(id) {
    return ALL_STAFF.find(p => p.id === id) || null;
}

function personName(id) {
    const p = personById(id);
    return p ? p.name : '—';
}

/* រូបប្រវត្តិរូប — shared/assets/avatars/<លេខសម្គាល់>.svg (ឬ .jpg ពេលមានរូបថតពិត)
   បើឯកសារមិនមាន បង្ហាញអក្សរកាត់ឈ្មោះជំនួស ដូច្នេះមិនដែលឃើញរូបខូច */
function avatarSrc(id) {
    const root = (document.body && document.body.dataset.roleRoot) || '.';
    return `${root}/shared/assets/avatars/${id}.svg`;
}

function avatarHtml(id, cls) {
    const p = personById(id);
    if (!p) return '';
    const c = cls || 'w-8 h-8';
    return `<span class="${c} rounded-full overflow-hidden inline-flex items-center justify-center flex-shrink-0 bg-slate-200 text-slate-600 font-semibold text-[11px] relative">${p.initials}<img src="${avatarSrc(id)}" alt="${p.name}" class="absolute inset-0 w-full h-full object-cover" onerror="this.remove()"></span>`;
}

/* លេខសម្ងាត់ដែលអ្នកគ្រប់គ្រងកំណត់ឡើងវិញ (ទំព័រការកំណត់) ឈ្នះលើតម្លៃលំនាំដើម */
function effectivePin(id) {
    const custom = posRead('pos_pins', {});
    const p = personById(id);
    return custom[id] || (p ? p.pin : '');
}

function verifyPin(id, pin) {
    const p = personById(id);
    return !!p && p.active && String(pin) === effectivePin(id);
}

/* ===== គណនីចូលប្រើ៖ អ៊ីមែល ឬលេខទូរស័ព្ទ + ពាក្យសម្ងាត់ =====
   លេខទូរស័ព្ទវាយបានគ្រប់ទម្រង់ (012 345 678 · 012345678 · +855 12 345 678)
   ពាក្យសម្ងាត់ដែលកំណត់ឡើងវិញ (pos_passwords) ឈ្នះលើតម្លៃលំនាំដើម */
function normPhone(s) {
    let d = String(s || '').replace(/\D/g, '');
    if (d.startsWith('855')) d = d.slice(3);
    if (d && d[0] !== '0') d = '0' + d;
    return d;
}

function effectivePassword(id) {
    const custom = posRead('pos_passwords', {});
    const p = personById(id);
    return custom[id] || (p ? p.password || '' : '');
}

function findAccount(identifier) {
    const q = String(identifier || '').trim();
    if (!q) return null;
    if (q.includes('@')) return ALL_STAFF.find(p => (p.email || '').toLowerCase() === q.toLowerCase()) || null;
    const d = normPhone(q);
    return d.length >= 9 ? ALL_STAFF.find(p => p.phone && normPhone(p.phone) === d) || null : null;
}

/* ត្រឡប់ { person } ពេលត្រឹមត្រូវ · { error: 'bad' } មិនប្រាប់ថាខុសត្រង់ណា · { error: 'inactive' } គណនីផ្អាក */
function verifyLogin(identifier, password) {
    const p = findAccount(identifier);
    if (!p || !effectivePassword(p.id) || effectivePassword(p.id) !== String(password)) return { error: 'bad' };
    if (!p.active) return { error: 'inactive', person: p };
    return { person: p };
}

function isManagerPage() {
    return !!document.body && (document.body.id === 'managerPortal' || document.body.id === 'adminPortal');
}

function currentActorId() {
    return isManagerPage() ? ME_MANAGER : ME_CASHIER;
}

/* ===== ការកំណត់ (អ្នកគ្រប់គ្រងកែប្រែនៅទំព័រការកំណត់ — ឯកសាររចនាលេខ 02 ផ្នែក 5.7) ===== */

const POS_SETTINGS_DEFAULTS = {
    fxRate: 4100,
    nbcRate: 0,
    varianceTolerance: 5,
    drawerLimitUSD: 500,
    drawerLimitKHR: 2000000,
    defaultFloatUSD: 200,
    defaultFloatKHR: 400000,
    khqrSeconds: 300,
    holdLimit: 5,
    /* សារនៅអេក្រង់អតិថិជនពេលគ្មានការលក់ (អតិបរមា 5) · icon៖ fa-tag fa-qrcode fa-money-bill-wave fa-receipt */
    cfdMessages: [
        { icon: 'fa-money-bill-wave', text: 'ទទួលសាច់ប្រាក់ជាដុល្លារ និងរៀល', on: true },
        { icon: 'fa-qrcode', text: 'ទូទាត់ងាយស្រួលដោយស្កេនបាគង', on: true },
        { icon: 'fa-receipt', text: 'សូមទទួលវិក្កយបត្រគ្រប់ពេលទិញទំនិញ', on: true }
    ],
    discountLimits: { 'CAS-01': 5, 'CAS-02': 5, 'CAS-03': 3, 'CAS-04': 5, 'CAS-05': 3, 'CAS-06': 3 },
    /* វេនព្រឹក រសៀល យប់ — ហាងបើក 24 ម៉ោង · ចំនួនវេន = ម៉ោងបើកហាង ÷ ប្រមាណ 8 ម៉ោង (ស្រាវជ្រាវ §11) */
    shiftTemplates: [
        { code: 'A', name: 'វេនព្រឹក', start: '06:00', end: '14:00' },
        { code: 'B', name: 'វេនរសៀល', start: '14:00', end: '22:00' },
        { code: 'C', name: 'វេនយប់', start: '22:00', end: '06:00' }
    ],
    reasons: {
        void: ['វាយបញ្ចូលខុស', 'អតិថិជនប្តូរចិត្ត', 'ទូទាត់ខុសវិធី', 'ទំនិញខូច'],
        return: ['ទំនិញខូច ឬមានបញ្ហា', 'អតិថិជនប្តូរចិត្ត', 'ទិញខុសទំនិញ', 'ផុតកំណត់ប្រើប្រាស់'],
        discount: ['ទំនិញជិតផុតកំណត់', 'អតិថិជនប្រចាំ', 'កញ្ចប់ខូចបន្តិច', 'ការផ្សព្វផ្សាយ'],
        payout: ['ទិញទឹកកក', 'ថ្លៃដឹកជញ្ជូន', 'សម្ភារសម្អាត', 'ចំណាយផ្សេងៗ'],
        holdDiscard: ['អតិថិជនមិនត្រឡប់មកវិញ', 'អតិថិជនលែងចង់ទិញ', 'បង្កើតខុស'],
        cover: ['ឈប់សម្រាក', 'ឈឺ', 'ប្តូរវេនគ្នា', 'ពេលមមាញឹក', 'ផ្សេងៗ']
    },
    shiftCodeSeq: 4,
    quickKeys: ['8860001', '8860004', '8850001', '8850002', '8860002', '8880002'],
    /* ស្តុក៖ លក់បានទោះប្រព័ន្ធបង្ហាញថាអស់ (កត់ត្រាជាករណីមិនប្រក្រតី) · ការកែតម្រូវលើសដែនកំណត់
       ណាមួយ (ចំនួនឯកតា ឬតម្លៃលក់រាយ) ត្រូវបានកត់ត្រា · ការរាប់ស្តុកប្រចាំសប្តាហ៍ ឬប្រចាំខែ */
    allowNegativeStock: true,
    adjustLimitQty: 10,
    adjustLimitUSD: 50,
    countSchedule: 'weekly',
    /* វេនលំនាំដើមរបស់បុគ្គលិកម្នាក់ៗ — template '' = មិនមានវេនប្រចាំ (ឧ. អ្នកគ្រប់គ្រង)
       dayOff៖ 0 = អាទិត្យ … 6 = សៅរ៍ · ម្នាក់មួយវេន 8 ម៉ោង × 6 ថ្ងៃ = 48 ម៉ោង/សប្តាហ៍ (ត្រឹមកំណត់ច្បាប់)
       វេនព្រឹក និងរសៀលមានអ្នកគិតលុយពីរនាក់ ថ្ងៃឈប់ខុសគ្នា · វេនយប់ទាំងពីរនាក់ឈប់ថ្ងៃអង្គារ ដូច្នេះអ្នកគ្រប់គ្រងជំនួស
       វេនយប់ (22:00–05:00 ជាម៉ោងយប់) ត្រូវបង់ប្រាក់ឈ្នួល 200% តាមច្បាប់ការងារ — ស្រាវជ្រាវ §11 */
    staffDefaults: {
        'CAS-01': { template: 'A', dayOff: 0 },
        'CAS-02': { template: 'B', dayOff: 1 },
        'CAS-03': { template: 'C', dayOff: 2 },
        'CAS-04': { template: 'B', dayOff: 4 },
        'CAS-05': { template: 'A', dayOff: 3 },
        'CAS-06': { template: 'C', dayOff: 2 },
        'MGR-01': { template: '', dayOff: 6 },
        'MGR-02': { template: '', dayOff: 0 },
        'MGR-03': { template: '', dayOff: 3 }
    }
};

const SETTING_LABELS = {
    fxRate: 'អត្រាប្ដូរប្រាក់ថ្ងៃនេះ',
    nbcRate: 'អត្រាផ្លូវការធនាគារជាតិ',
    varianceTolerance: 'ល្បឹមភាពខុសគ្នាសាច់ប្រាក់',
    drawerLimitUSD: 'ពិដានសាច់ប្រាក់ដុល្លារក្នុងថត',
    drawerLimitKHR: 'ពិដានសាច់ប្រាក់រៀលក្នុងថត',
    defaultFloatUSD: 'ប្រាក់បាតថតស្តង់ដារជាដុល្លារ',
    defaultFloatKHR: 'ប្រាក់បាតថតស្តង់ដារជារៀល',
    khqrSeconds: 'សុពលភាពកូដស្កេនបាគង',
    holdLimit: 'ការលក់ព្យួរអតិបរមាក្នុងមួយវេន',
    cfdMessages: 'សារនៅអេក្រង់អតិថិជន',
    discountLimits: 'ដែនកំណត់បញ្ចុះតម្លៃរបស់អ្នកគិតលុយ',
    shiftTemplates: 'គំរូវេន',
    reasons: 'បញ្ជីមូលហេតុ',
    quickKeys: 'ទំនិញញឹកញាប់',
    allowNegativeStock: 'លក់បានពេលប្រព័ន្ធបង្ហាញថាអស់ស្តុក',
    adjustLimitQty: 'ដែនកំណត់កែតម្រូវស្តុកជាឯកតា',
    adjustLimitUSD: 'ដែនកំណត់កែតម្រូវស្តុកជាតម្លៃលក់រាយ',
    countSchedule: 'កាលវិភាគរាប់ស្តុក',
    staffDefaults: 'វេនលំនាំដើមរបស់បុគ្គលិក'
};

function clone(v) {
    return JSON.parse(JSON.stringify(v));
}

function posSettings() {
    const stored = posRead(POS_KEYS.settings, null);
    const s = Object.assign(clone(POS_SETTINGS_DEFAULTS), (stored && stored.values) || {});
    if (!s.reasons) s.reasons = clone(POS_SETTINGS_DEFAULTS.reasons);
    if (!s.reasons.cover) s.reasons.cover = clone(POS_SETTINGS_DEFAULTS.reasons.cover);
    if (!s.shiftCodeSeq) s.shiftCodeSeq = 4;
    // ការកំណត់ដែលរក្សាទុកមុនពេលបន្ថែមបុគ្គលិកថ្មី៖ បុគ្គលិកដែលមិនទាន់មានក្នុងនោះប្រើតម្លៃលំនាំដើម
    s.staffDefaults = Object.assign(clone(POS_SETTINGS_DEFAULTS.staffDefaults), s.staffDefaults || {});
    s.discountLimits = Object.assign(clone(POS_SETTINGS_DEFAULTS.discountLimits), s.discountLimits || {});
    return s;
}

function settingsHistory() {
    const stored = posRead(POS_KEYS.settings, null);
    return (stored && stored.history) || [];
}

function savePosSettings(values, actorId) {
    const before = posSettings();
    const stored = posRead(POS_KEYS.settings, { values: {}, history: [] });
    const changes = Object.keys(values)
        .filter(k => JSON.stringify(before[k]) !== JSON.stringify(values[k]))
        .map(k => ({ key: k, from: before[k], to: values[k] }));
    if (!changes.length) return [];
    stored.values = Object.assign({}, stored.values || {}, values);
    stored.history = [{ at: isoLocal(new Date()), by: actorId, changes }].concat(stored.history || []).slice(0, 50);
    posWrite(POS_KEYS.settings, stored);
    return changes;
}

function fxRate() {
    return Number(posSettings().fxRate) || 4100;
}

function discountLimitFor(cashierId) {
    const limits = posSettings().discountLimits || {};
    return Number(limits[cashierId] != null ? limits[cashierId] : 5);
}

function toKHR(usd, rate) {
    return usd * (rate || fxRate());
}

function toUSD(khr, rate) {
    return khr / (rate || fxRate());
}

/* ===== គំរូវេន ===== */

function minutesOf(hhmm) {
    const [h, m] = String(hhmm).split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

function shiftTemplates() {
    return posSettings().shiftTemplates || [];
}

/* គំរូវេនដែលគ្របដណ្តប់ពេលនេះ — គាំទ្រវេនយប់ដែលឆ្លងពាក់កណ្តាលអធ្រាត្រ */
function templateAt(date) {
    const m = date.getHours() * 60 + date.getMinutes();
    return shiftTemplates().find(t => {
        const s = minutesOf(t.start);
        const e = minutesOf(t.end);
        return s < e ? (m >= s && m < e) : (m >= s || m < e);
    }) || null;
}

/* គំរូវេនចុងក្រោយដែលបានចាប់ផ្តើមថ្ងៃនេះ (ប្រើពេលហាងហួសម៉ោងបិទ) */
function lastStartedTemplate(date) {
    const m = date.getHours() * 60 + date.getMinutes();
    const started = shiftTemplates().filter(t => minutesOf(t.start) <= m);
    return started.sort((a, b) => minutesOf(b.start) - minutesOf(a.start))[0] || null;
}

function templateHours(t) {
    let span = minutesOf(t.end) - minutesOf(t.start);
    if (span <= 0) span += 24 * 60;
    return span / 60;
}

function dateAt(dateStr, hhmm) {
    const [y, mo, d] = dateStr.split('-').map(Number);
    const [h, mi] = hhmm.split(':').map(Number);
    return new Date(y, mo - 1, d, h, mi, 0, 0);
}

/* ថ្ងៃដែលវេនចាប់ផ្តើម — វេនយប់ដែលបើកក្រោយពាក់កណ្តាលអធ្រាត្រជារបស់ថ្ងៃមុន */
function templateDateFor(tpl, now) {
    const start = dateAt(isoDate(now), tpl.start);
    const overnight = minutesOf(tpl.end) <= minutesOf(tpl.start);
    const m = now.getHours() * 60 + now.getMinutes();
    if (overnight && m < minutesOf(tpl.end)) start.setDate(start.getDate() - 1);
    return isoDate(start);
}

function shiftEndDate(shift) {
    const start = dateAt(shift.date, shift.start);
    const end = dateAt(shift.date, shift.end);
    if (end <= start) end.setDate(end.getDate() + 1);
    return end;
}

/* គណនាម៉ោងធ្វើការជាក់ស្តែងថ្ងៃនេះរបស់អ្នកគិតលុយ (វេនបិទ + វេនកំពុងបើក) */
function hoursWorkedToday(personId, dateStr) {
    const d = dateStr || isoDate(new Date());
    const shifts = posRead(POS_KEYS.shifts, []);
    let totalMinutes = 0;
    shifts.forEach(s => {
        if (s.cashierId !== personId) return;
        const shiftDate = s.date || (s.openedAt ? s.openedAt.slice(0, 10) : '');
        if (shiftDate !== d) return;
        if (s.status === 'open') {
            const startMs = new Date(s.openedAt).getTime();
            const nowMs = Date.now();
            if (nowMs > startMs) {
                totalMinutes += (nowMs - startMs) / 60000;
            }
        } else if (s.openedAt && s.closedAt) {
            const startMs = new Date(s.openedAt).getTime();
            const endMs = new Date(s.closedAt).getTime();
            if (endMs > startMs) {
                totalMinutes += (endMs - startMs) / 60000;
            }
        } else if (s.start && s.end) {
            let span = minutesOf(s.end) - minutesOf(s.start);
            if (span <= 0) span += 24 * 60;
            totalMinutes += span;
        }
    });
    return Math.round((totalMinutes / 60) * 10) / 10;
}

/* គណនាម៉ោងបញ្ចប់អតិបរមាដើម្បីកុំឱ្យលើស 12 ម៉ោង/ថ្ងៃ (D-S5: យ៉ាងហោចណាស់ 2 ម៉ោង) */
function capFor(personId, dateStr, startTime) {
    const d = dateStr || isoDate(new Date());
    const worked = hoursWorkedToday(personId, d);
    const remainHours = Math.max(0, 12 - worked);
    if (remainHours <= 0) {
        return { capTime: '', remainHours: 0, partialAllowed: false, workedHours: worked };
    }
    const startM = minutesOf(startTime || '00:00');
    const remainMinutes = Math.floor(remainHours * 60);
    // មូលចុះត្រឹម 10 នាទី (តាម D-S5 §5.2)
    const capMinutesTotal = startM + remainMinutes;
    const roundedCapM = Math.floor(capMinutesTotal / 10) * 10;
    const h = Math.floor((roundedCapM % 1440) / 60);
    const mi = roundedCapM % 60;
    const capTime = `${pad2(h)}:${pad2(mi)}`;
    const partialAllowed = remainHours >= 2.0;
    return { capTime, remainHours: Math.round(remainHours * 10) / 10, partialAllowed, workedHours: worked };
}

/* ===== កាតាឡុកទំនិញ — មានតែតម្លៃលក់រាយ គ្មានថ្លៃដើមទិញឡើយ ===== */

const CATEGORIES = [
    { id: 'all', label: 'ទាំងអស់', icon: 'fa-border-all' },
    { id: 'drink', label: 'ភេសជ្ជៈ', icon: 'fa-bottle-water' },
    { id: 'snack', label: 'អាហារសម្រន់', icon: 'fa-cookie-bite' },
    { id: 'household', label: 'របស់ប្រើប្រាស់', icon: 'fa-basket-shopping' },
    { id: 'stationery', label: 'សម្ភារសិក្សា', icon: 'fa-pen-ruler' },
    { id: 'electronic', label: 'អេឡិចត្រូនិក', icon: 'fa-plug' }
];

const PRODUCTS = [
    { sku: '8850001', barcode: '8850001', name: 'ទឹកសុទ្ធ វិតាល 500 មីលីលីត្រ', category: 'drink', price: 0.50, unit: 'ដប', opening: 240, icon: 'fa-bottle-water', tone: 'sky' },
    { sku: '8850002', barcode: '8850002', name: 'កាហ្វេកំប៉ុង នេស្ការ្វេ', category: 'drink', price: 1.25, unit: 'កំប៉ុង', opening: 96, icon: 'fa-mug-hot', tone: 'amber' },
    { sku: '8850003', barcode: '8850003', name: 'ទឹកក្រូច មីរិនដា 1.5 លីត្រ', category: 'drink', price: 1.75, unit: 'ដប', opening: 64, icon: 'fa-wine-bottle', tone: 'orange' },
    { sku: '8850004', barcode: '8850004', name: 'ទឹកដោះគោ ដាច់ឡាក់', category: 'drink', price: 2.10, unit: 'ប្រអប់', opening: 9, icon: 'fa-glass-water', tone: 'blue' },
    { sku: '8850005', barcode: '8850005', name: 'ភេសជ្ជៈកូកា-កូឡា កំប៉ុង 330 មីលីលីត្រ', category: 'drink', price: 0.65, unit: 'កំប៉ុង', opening: 180, icon: 'fa-bottle-water', tone: 'rose' },
    { sku: '8850006', barcode: '8850006', name: 'ភេសជ្ជៈប៉ូវកម្លាំង ការ៉ាបាវ', category: 'drink', price: 0.60, unit: 'កំប៉ុង', opening: 150, icon: 'fa-bolt', tone: 'yellow' },
    { sku: '8850007', barcode: '8850007', name: 'តែបៃតង អូអ៊ីស៊ី 500 មីលីលីត្រ', category: 'drink', price: 0.90, unit: 'ដប', opening: 90, icon: 'fa-leaf', tone: 'emerald' },
    { sku: '8850008', barcode: '8850008', name: 'ទឹកដូង 350 មីលីលីត្រ', category: 'drink', price: 1.00, unit: 'ដប', opening: 60, icon: 'fa-glass-water', tone: 'lime' },
    { sku: '8850009', barcode: '8850009', name: 'ភេសជ្ជៈស្ព្រាយ កំប៉ុង 330 មីលីលីត្រ', category: 'drink', price: 0.65, unit: 'កំប៉ុង', opening: 160, icon: 'fa-bottle-water', tone: 'slate' },
    { sku: '8850010', barcode: '8850010', name: 'ភេសជ្ជៈប៉ូវកម្លាំង រេដប៊ុល 250 មីលីលីត្រ', category: 'drink', price: 1.20, unit: 'កំប៉ុង', opening: 72, icon: 'fa-bolt', tone: 'slate' },
    { sku: '8850011', barcode: '8850011', name: 'ទឹកដោះគោជូរ យ៉ាគុលត៍ 80 មីលីលីត្រ', category: 'drink', price: 0.35, unit: 'ដប', opening: 120, icon: 'fa-bottle-droplet', tone: 'slate' },
    { sku: '8850012', barcode: '8850012', name: 'ទឹកដោះគោ មីឡូ 180 មីលីលីត្រ', category: 'drink', price: 0.70, unit: 'ប្រអប់', opening: 144, icon: 'fa-glass-water', tone: 'slate' },

    { sku: '8860001', barcode: '8860001', name: 'នំប៉័ង សាំងវិច', category: 'snack', price: 1.50, unit: 'ដុំ', opening: 12, icon: 'fa-bread-slice', tone: 'amber' },
    { sku: '8860002', barcode: '8860002', name: 'ដំឡូងបំពង លេយ៍', category: 'snack', price: 1.20, unit: 'កញ្ចប់', opening: 120, icon: 'fa-cookie-bite', tone: 'yellow' },
    { sku: '8860003', barcode: '8860003', name: 'សូកូឡា ស្នីកគ័រ', category: 'snack', price: 0.95, unit: 'ដុំ', opening: 150, icon: 'fa-candy-cane', tone: 'rose' },
    { sku: '8860004', barcode: '8860004', name: 'នំខេក ចម្រុះរសជាតិ', category: 'snack', price: 2.50, unit: 'ប្រអប់', opening: 28, icon: 'fa-cake-candles', tone: 'pink' },
    { sku: '8860005', barcode: '8860005', name: 'មីកញ្ចប់ មាម៉ា', category: 'snack', price: 0.40, unit: 'កញ្ចប់', opening: 300, icon: 'fa-bowl-food', tone: 'orange' },
    { sku: '8860006', barcode: '8860006', name: 'នំខូឃី អូរីអូ', category: 'snack', price: 1.10, unit: 'កញ្ចប់', opening: 80, icon: 'fa-cookie', tone: 'slate' },
    { sku: '8860007', barcode: '8860007', name: 'ស្ករគ្រាប់ មេនតូស', category: 'snack', price: 0.50, unit: 'បំពង់', opening: 140, icon: 'fa-candy-cane', tone: 'sky' },
    { sku: '8860008', barcode: '8860008', name: 'គ្រាប់ស្វាយចន្ទីលីង 100 ក្រាម', category: 'snack', price: 2.80, unit: 'កញ្ចប់', opening: 36, icon: 'fa-seedling', tone: 'amber' },
    { sku: '8860009', barcode: '8860009', name: 'សូកូឡា ឃីតខេត', category: 'snack', price: 0.90, unit: 'ដុំ', opening: 110, icon: 'fa-candy-cane', tone: 'slate' },
    { sku: '8860010', barcode: '8860010', name: 'ដំឡូងបំពង ព្រីងហ្គលស៍ 107 ក្រាម', category: 'snack', price: 2.50, unit: 'កំប៉ុង', opening: 30, icon: 'fa-cookie-bite', tone: 'slate' },
    { sku: '8860011', barcode: '8860011', name: 'នំឆូកូប៉ៃ អូរីយ៉ុន ប្រអប់ 6', category: 'snack', price: 2.20, unit: 'ប្រអប់', opening: 40, icon: 'fa-cookie', tone: 'slate' },
    { sku: '8860012', barcode: '8860012', name: 'ស្ករកៅស៊ូ ហារីបូ 80 ក្រាម', category: 'snack', price: 1.20, unit: 'កញ្ចប់', opening: 6, icon: 'fa-candy-cane', tone: 'slate' },

    { sku: '8870001', barcode: '8870001', name: 'សាប៊ូបោកខោអាវ 1 គីឡូក្រាម', category: 'household', price: 3.40, unit: 'កញ្ចប់', opening: 52, icon: 'fa-soap', tone: 'emerald' },
    { sku: '8870002', barcode: '8870002', name: 'ក្រដាសអនាម័យ 10 ដុំ', category: 'household', price: 4.20, unit: 'កញ្ចប់', opening: 40, icon: 'fa-toilet-paper', tone: 'slate' },
    { sku: '8870003', barcode: '8870003', name: 'ថ្នាំដុសធ្មេញ ខូលហ្គេត', category: 'household', price: 1.80, unit: 'ដប', opening: 88, icon: 'fa-tooth', tone: 'cyan' },
    { sku: '8870004', barcode: '8870004', name: 'សាប៊ូងូតទឹក ឡាក់ស៍', category: 'household', price: 2.75, unit: 'ដប', opening: 60, icon: 'fa-pump-soap', tone: 'purple' },
    { sku: '8870005', barcode: '8870005', name: 'ទឹកលាងចាន ស៊ុនឡាយ 750 មីលីលីត្រ', category: 'household', price: 1.95, unit: 'ដប', opening: 56, icon: 'fa-hand-sparkles', tone: 'lime' },
    { sku: '8870006', barcode: '8870006', name: 'ច្រាសដុសធ្មេញ ទន់', category: 'household', price: 1.10, unit: 'ដើម', opening: 70, icon: 'fa-tooth', tone: 'sky' },
    { sku: '8870007', barcode: '8870007', name: 'ក្រដាសជូតមុខ ហោប៉ៅ កញ្ចប់ 10', category: 'household', price: 1.30, unit: 'កញ្ចប់', opening: 90, icon: 'fa-box-tissue', tone: 'pink' },
    { sku: '8870008', barcode: '8870008', name: 'សាប៊ូកក់សក់ 340 មីលីលីត្រ', category: 'household', price: 3.20, unit: 'ដប', opening: 36, icon: 'fa-pump-soap', tone: 'slate' },
    { sku: '8870009', barcode: '8870009', name: 'ទឹកបោកខោអាវ 2 លីត្រ', category: 'household', price: 4.80, unit: 'ដប', opening: 24, icon: 'fa-bottle-droplet', tone: 'slate' },
    { sku: '8870010', barcode: '8870010', name: 'ថង់សំរាម រមូរ 20 សន្លឹក', category: 'household', price: 1.50, unit: 'រមូរ', opening: 48, icon: 'fa-trash-can', tone: 'slate' },

    { sku: '8880001', barcode: '8880001', name: 'សៀវភៅសរសេរ 100 ទំព័រ', category: 'stationery', price: 0.75, unit: 'ក្បាល', opening: 200, icon: 'fa-book', tone: 'blue' },
    { sku: '8880002', barcode: '8880002', name: 'ប៊ិច ខៀវ ដំណក់', category: 'stationery', price: 0.35, unit: 'ដើម', opening: 320, icon: 'fa-pen', tone: 'indigo' },
    { sku: '8880003', barcode: '8880003', name: 'ខ្មៅដៃខ្មៅ កញ្ចប់ 12 ដើម', category: 'stationery', price: 1.60, unit: 'កញ្ចប់', opening: 75, icon: 'fa-pencil', tone: 'amber' },
    { sku: '8880004', barcode: '8880004', name: 'ជ័រលុប', category: 'stationery', price: 0.25, unit: 'ដុំ', opening: 260, icon: 'fa-eraser', tone: 'pink' },
    { sku: '8880005', barcode: '8880005', name: 'បន្ទាត់ 30 សង់ទីម៉ែត្រ', category: 'stationery', price: 0.40, unit: 'ដើម', opening: 150, icon: 'fa-ruler', tone: 'cyan' },
    { sku: '8880006', barcode: '8880006', name: 'កាវបិទក្រដាស', category: 'stationery', price: 0.80, unit: 'ដើម', opening: 90, icon: 'fa-paste', tone: 'violet' },
    { sku: '8880007', barcode: '8880007', name: 'កន្ត្រៃ', category: 'stationery', price: 0.90, unit: 'ដើម', opening: 60, icon: 'fa-scissors', tone: 'slate' },
    { sku: '8880008', barcode: '8880008', name: 'ប៊ិចហ្វឺតពណ៌លឿង', category: 'stationery', price: 0.60, unit: 'ដើម', opening: 100, icon: 'fa-highlighter', tone: 'slate' },
    { sku: '8880009', barcode: '8880009', name: 'ម៉ាស៊ីនកិបក្រដាស', category: 'stationery', price: 2.50, unit: 'គ្រឿង', opening: 18, icon: 'fa-paperclip', tone: 'slate' },

    { sku: '8890001', barcode: '8890001', name: 'ថ្មពិល ទំហំតូច កញ្ចប់ 4', category: 'electronic', price: 2.40, unit: 'កញ្ចប់', opening: 66, icon: 'fa-battery-full', tone: 'lime' },
    { sku: '8890002', barcode: '8890002', name: 'ខ្សែសាកទូរស័ព្ទ 1 ម៉ែត្រ', category: 'electronic', price: 3.90, unit: 'ខ្សែ', opening: 44, icon: 'fa-plug', tone: 'violet' },
    { sku: '8890003', barcode: '8890003', name: 'អំពូលបំភ្លឺ 9 វ៉ាត់', category: 'electronic', price: 2.20, unit: 'គ្រាប់', opening: 58, icon: 'fa-lightbulb', tone: 'yellow' },
    { sku: '8890004', barcode: '8890004', name: 'កាសស្តាប់ចម្រៀង', category: 'electronic', price: 4.50, unit: 'គ្រឿង', opening: 0, icon: 'fa-headphones', tone: 'slate' },
    { sku: '8890005', barcode: '8890005', name: 'ក្បាលសាកទូរស័ព្ទ 20 វ៉ាត់', category: 'electronic', price: 6.50, unit: 'គ្រឿង', opening: 20, icon: 'fa-plug-circle-bolt', tone: 'indigo' },
    { sku: '8890006', barcode: '8890006', name: 'ពិលដៃ សាកបាន', category: 'electronic', price: 3.20, unit: 'ដើម', opening: 30, icon: 'fa-lightbulb', tone: 'amber' },
    { sku: '8890007', barcode: '8890007', name: 'ថ្មសាកបម្រុង 10000 មីលីអំពែរម៉ោង', category: 'electronic', price: 12.00, unit: 'គ្រឿង', opening: 12, icon: 'fa-battery-half', tone: 'slate' },
    { sku: '8890008', barcode: '8890008', name: 'ព្រីភ្លើង 8 រន្ធ', category: 'electronic', price: 6.50, unit: 'គ្រឿង', opening: 15, icon: 'fa-plug', tone: 'slate' },
    { sku: '8890009', barcode: '8890009', name: 'ឧបករណ៍ផ្ទុកទិន្នន័យ 32 ជីកាបៃ', category: 'electronic', price: 6.00, unit: 'គ្រឿង', opening: 20, icon: 'fa-hard-drive', tone: 'slate' }
];

/* ទម្ងន់លក់ដាច់របស់ទំនិញនីមួយៗ (ទិន្នន័យគំរូ និងកម្រិតស្តុកលំនាំដើម) */
const PRODUCT_WEIGHT = {
    '8850001': 10, '8850002': 7, '8850003': 3, '8850004': 3,
    '8860001': 4, '8860002': 5, '8860003': 4, '8860004': 1.5,
    '8870001': 1.2, '8870002': 1.5, '8870003': 1.2, '8870004': 0.8,
    '8880001': 2.5, '8880002': 3, '8880003': 0.8,
    '8890001': 1, '8890002': 0.5, '8890003': 0.6,
    '8850005': 6, '8850006': 5, '8850007': 3, '8850008': 1.5, '8860005': 5, '8860006': 2.5,
    '8860007': 2, '8860008': 0.8, '8870005': 1, '8870006': 0.8, '8870007': 1.5, '8880004': 1.5,
    '8880005': 1, '8880006': 0.7, '8890004': 0.3, '8890005': 0.3, '8890006': 0.3,
    '8850009': 4, '8850010': 2, '8850011': 3, '8850012': 4, '8860009': 2.5, '8860010': 1,
    '8860011': 1.2, '8860012': 1, '8870008': 0.8, '8870009': 0.5, '8870010': 1, '8880007': 0.6,
    '8880008': 1, '8880009': 0.3, '8890007': 0.2, '8890008': 0.2, '8890009': 0.25
};

/* ការកែកាតាឡុកដោយម្ចាស់ហាង (pos_catalog)៖ តម្លៃថ្មី ការផ្អាកលក់ កម្រិតស្តុកអប្បបរមា និងចំនួនបញ្ជាទិញ
   basePrice = តម្លៃដើមពេលបង្កើតទិន្នន័យគំរូ · ការលក់នីមួយៗរក្សាតម្លៃពេលលក់ (line.price)
   ដូច្នេះការប្តូរតម្លៃមិនប៉ះពាល់វិក្កយបត្រ ឬរបាយការណ៍ចាស់ឡើយ។
   opening = ស្តុកបើកពេលចាប់ផ្តើមកត់ត្រាស្តុក (មិនមែនស្តុកបច្ចុប្បន្នទេ — មើល onHandLevels)។
   លំនាំដើម៖ អប្បបរមា ≈ ការលក់ពាក់កណ្តាលថ្ងៃ · បញ្ជាទិញ ≈ ការលក់ 3 ទៅ 4 ថ្ងៃ (តាមទម្ងន់លក់ដាច់) */
const CATALOG_KEY = 'pos_catalog';
(function applyCatalogEdits() {
    const edits = posRead(CATALOG_KEY, {});
    PRODUCTS.forEach(p => {
        const w = PRODUCT_WEIGHT[p.sku] || 1;
        p.basePrice = p.price;
        p.active = true;
        p.minStock = Math.max(5, Math.ceil(w * 4));
        p.reorderQty = Math.max(12, Math.ceil(w * 24 / 6) * 6);
        Object.assign(p, edits[p.sku] || {});
    });
})();

function sellableProducts() {
    return PRODUCTS.filter(p => p.active !== false);
}

/* ក្រដាសប្រាក់សម្រាប់រាប់សាច់ប្រាក់ */
const USD_NOTES = [100, 50, 20, 10, 5, 1];
const KHR_NOTES = [100000, 50000, 20000, 10000, 5000, 1000, 500, 100];

function getProduct(sku) {
    return PRODUCTS.find(p => p.sku === sku);
}

function categoryLabel(id) {
    return (CATEGORIES.find(c => c.id === id) || {}).label || '—';
}

/* ===== រូបភាពទំនិញ =====
   រូបថតរក្សាទុកក្នុង shared/assets/products/<sku>.png ជាទម្រង់ដែលផ្ទៃខាងក្រោយថ្លា។
   ទំនិញដែលគ្មានរូបថត បង្ហាញក្រឡាពណ៌តាមប្រភេទ និងឈ្មោះខ្លី ដូចម៉ាស៊ីនគិតលុយទូទៅ
   (មិនស្នើរូបភាពដែលគ្មាន ដូច្នេះគ្មានកំហុស 404)។ ពេលបន្ថែមរូបថត ត្រូវបន្ថែមលេខកូដក្នុងបញ្ជីខាងក្រោម។ */

const PRODUCT_PHOTOS = [
    '8850001', '8850002', '8850003', '8850004', '8850005', '8850006', '8850007', '8850008',
    '8850009', '8850010', '8850011', '8850012', '8860001', '8860002', '8860003', '8860004',
    '8860005', '8860006', '8860007', '8860008', '8860009', '8860010', '8860011', '8860012',
    '8870001', '8870002', '8870003', '8870004', '8870005', '8870006', '8870007', '8870008',
    '8870009', '8870010', '8880001', '8880002', '8880003', '8880004', '8880005', '8880006',
    '8880007', '8880008', '8880009', '8890001', '8890002', '8890003', '8890004', '8890005',
    '8890006', '8890007', '8890008', '8890009'
];
const PRODUCT_SHORT = {
    '8870001': 'សាប៊ូម្សៅ', '8870002': 'ក្រដាស', '8870003': 'ថ្នាំដុស', '8870004': 'សាប៊ូ',
    '8880001': 'សៀវភៅ', '8880002': 'ប៊ិច', '8880003': 'ខ្មៅដៃ',
    '8890001': 'ថ្មពិល', '8890002': 'ខ្សែសាក', '8890003': 'អំពូល',
    '8850005': 'កូកា', '8850006': 'ប៉ូវកម្លាំង', '8850007': 'តែបៃតង', '8850008': 'ទឹកដូង',
    '8860005': 'មីកញ្ចប់', '8860006': 'ខូឃី', '8860007': 'ស្ករគ្រាប់', '8860008': 'ស្វាយចន្ទី',
    '8870005': 'ទឹកលាងចាន', '8870006': 'ច្រាសធ្មេញ', '8870007': 'ក្រដាសជូត', '8880004': 'ជ័រលុប',
    '8880005': 'បន្ទាត់', '8880006': 'កាវ', '8890004': 'កាស', '8890005': 'ក្បាលសាក',
    '8890006': 'ពិលដៃ',
    '8850009': 'ស្ព្រាយ', '8850010': 'រេដប៊ុល', '8850011': 'យ៉ាគុលត៍', '8850012': 'មីឡូ', '8860009': 'ឃីតខេត', '8860010': 'ព្រីងហ្គលស៍',
    '8860011': 'ឆូកូប៉ៃ', '8860012': 'ហារីបូ', '8870008': 'សាប៊ូកក់', '8870009': 'ទឹកបោកខោអាវ', '8870010': 'ថង់សំរាម', '8880007': 'កន្ត្រៃ',
    '8880008': 'ហ្វឺត', '8880009': 'ម៉ាស៊ីនកិប', '8890007': 'ថ្មបម្រុង', '8890008': 'ព្រីភ្លើង', '8890009': 'ផ្ទុកទិន្នន័យ'
};
const CATEGORY_TILE = { drink: '#3f6f8f', snack: '#9a6a3a', household: '#4f7a68', stationery: '#5a6690', electronic: '#7a5f80' };

function productImageSrc(p) {
    const root = (document.body && document.body.dataset.roleRoot) || '.';
    return `${root}/shared/assets/products/${p.sku}.png`;
}

function productImgHtml(p) {
    if (PRODUCT_PHOTOS.includes(p.sku)) {
        return `<img src="${productImageSrc(p)}" alt="${p.name}" loading="lazy" class="w-full h-full object-contain">`;
    }
    const label = PRODUCT_SHORT[p.sku] || p.name.split(' ')[0];
    return `<span class="w-full h-full flex items-center justify-center" style="container-type:size">
            <span class="w-[78%] h-[78%] rounded-md flex items-center justify-center text-white font-semibold text-center leading-tight px-[6%]"
                  style="background:${CATEGORY_TILE[p.category] || '#64748b'};font-size:clamp(9px,17cqmin,22px)">${label}</span>
        </span>`;
}

function findByBarcode(code) {
    const q = String(code).trim().toLowerCase();
    const list = sellableProducts();
    return list.find(p => p.barcode === q)
        || list.find(p => p.name.toLowerCase().includes(q));
}

/* ===== អតិថិជនឥណទាន =====
   មានតែឈ្មោះ ទូរស័ព្ទ ពិដានឥណទាន និងព័ត៌មានអាករ (សម្រាប់អតិថិជនដែលចុះបញ្ជីអាករ
   ដើម្បីឱ្យវិក្កយបត្រក្លាយជាវិក្កយបត្រអាករ — ស្រាវជ្រាវ §9)។ គ្មានថ្លៃដើម គ្មានប្រវត្តិទិញ។ */

const CREDIT_CUSTOMERS = [
    { id: 'POS-C-01', name: 'ហាង សុខសប្បាយ', phone: '012 884 221', creditLimit: 500 },
    { id: 'POS-C-02', name: 'ភោជនីយដ្ឋាន អង្គរថ្មី', phone: '017 332 908', creditLimit: 1200,
      vattin: 'K002-100045678', address: 'ផ្លូវ 271 សង្កាត់ទួលទំពូង ខណ្ឌចំការមន ភ្នំពេញ' },
    { id: 'POS-C-03', name: 'សាលារៀន ចំណេះដឹងថ្មី', phone: '078 554 110', creditLimit: 800 }
];

function getCreditCustomer(id) {
    return CREDIT_CUSTOMERS.find(c => c.id === id) || null;
}

/* ===== ការគណនាវិក្កយបត្រ ===== */

/* តម្លៃមួយឯកតាពេលលក់ (រក្សាក្នុងបន្ទាត់) · កន្ត្រកដែលមិនទាន់លក់ប្រើតម្លៃបច្ចុប្បន្ន */
function linePrice(line) {
    if (line && line.price != null) return line.price;
    const p = getProduct(line.sku);
    return p ? p.price : 0;
}

function lineTotal(line) {
    return linePrice(line) * line.qty;
}

/* អាករលើតម្លៃបន្ថែម 10% រួមក្នុងតម្លៃលក់រាយរួចហើយ ដូច្នេះត្រូវបំបែកចេញវិញ។
   ការបញ្ចុះតម្លៃកាត់លើតម្លៃរួមអាករ បន្ទាប់មកទើបបំបែកអាករចេញ។
   មិនកាត់ត្រឹមដែនកំណត់របស់អ្នកគិតលុយទេ — ការបញ្ចុះលើសកំណត់ដែលបានអនុម័តត្រូវតែគិតពេញ។ */
function saleTotals(items, discountPercent) {
    const list = items.reduce((sum, it) => sum + lineTotal(it), 0);
    const pct = Math.min(Math.max(Number(discountPercent) || 0, 0), 100);
    const discount = list * (pct / 100);
    const gross = list - discount;
    const net = gross / 1.10;
    return {
        qty: items.reduce((sum, it) => sum + it.qty, 0),
        list,
        discountPercent: pct,
        discount,
        net,
        vat: gross - net,
        gross
    };
}

function paidTotal(pay, rate) {
    return pay.usdCash + toUSD(pay.khrCash, rate) + pay.khqr;
}

/* ===== ប្រាក់អាប់តាមរបៀបហាងនៅកម្ពុជា (ផែនការកែលម្អ C2) =====
   «ចម្រុះ»៖ ដុល្លារគត់ + នៅសល់ជារៀលបង្គត់ទៅ 100 ៛ ជិតបំផុត (ឧ. $2.38 → $2 + 1,600 ៛)
   «រៀលទាំងអស់»៖ ប្រាក់អាប់ទាំងមូលជារៀលបង្គត់ទៅ 100 ៛
   មិនមានរបៀប «ដុល្លារទាំងអស់» ទេ ព្រោះកាក់សេនមិនចរាចរនៅកម្ពុជា។
   roundingKHR = រៀលដែលផ្តល់លើស (+) ឬខ្វះ (−) ពីការបង្គត់ — រក្សាទុកដើម្បីកុំឱ្យប៉ះពាល់ការផ្ទៀងផ្ទាត់ថត */

function splitChange(changeUSD, rate, mode) {
    const r = rate || fxRate();
    if (changeUSD < 0.005) return { usd: 0, khr: 0, roundingKHR: 0, mode: mode || 'mixed' };
    if (mode === 'riel') {
        const exact = changeUSD * r;
        const khr = Math.round(exact / 100) * 100;
        return { usd: 0, khr, roundingKHR: khr - exact, mode };
    }
    const usd = Math.floor(changeUSD + 1e-9);
    const exact = (changeUSD - usd) * r;
    const khr = Math.round(exact / 100) * 100;
    return { usd, khr, roundingKHR: khr - exact, mode: 'mixed' };
}

/* អតិថិជនបង់ជារៀលសុទ្ធ ជាធម្មតាចង់បានប្រាក់អាប់ជារៀល */
function defaultChangeMode(pay) {
    return pay.usdCash > 0.005 ? 'mixed' : 'riel';
}

function fmtChange(ch) {
    if (!ch || (ch.usd < 0.005 && ch.khr < 1)) return 'គ្មានប្រាក់អាប់';
    const parts = [];
    if (ch.usd > 0.005) parts.push(fmtUSD(ch.usd));
    if (ch.khr >= 1) parts.push(fmtKHR(ch.khr));
    return parts.join(' + ');
}

function saleChange(sale) {
    if (sale.change) return sale.change;
    const rate = sale.fxRate || fxRate();
    const t = saleTotals(sale.items, sale.discountPercent);
    return splitChange(paidTotal(sale.pay, rate) - t.gross, rate, defaultChangeMode(sale.pay));
}

const PAY_LABEL = {
    usdCash: 'សាច់ប្រាក់ដុល្លារ',
    khrCash: 'សាច់ប្រាក់រៀល',
    khqr: 'ស្កេនកូដបាគង'
};

function payMethodLabel(pay) {
    const parts = ['usdCash', 'khrCash', 'khqr'].filter(k => pay[k] > 0).map(k => PAY_LABEL[k]);
    if (!parts.length) return 'មិនកំណត់';
    return parts.length > 1 ? 'បែងចែក៖ ' + parts.join(' និង ') : parts[0];
}

function methodOf(sale) {
    const used = ['usdCash', 'khrCash', 'khqr'].filter(k => sale.pay[k] > 0);
    if (used.length > 1) return 'split';
    return used[0] || 'usdCash';
}

/* ===== វេន =====
   វេនមួយ = អ្នកគិតលុយម្នាក់ ថតប្រាក់មួយ ពីការបើកដល់ការបិទដោយរាប់បិទភ្នែក។
   ស្ថានភាព៖ open → closed (រង់ចាំត្រួតពិនិត្យ) → reviewed (អ្នកគ្រប់គ្រងបានចុះហត្ថលេខា)។ */

const SHIFT_STATUS = {
    open: { label: 'កំពុងបើក', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    closed: { label: 'រង់ចាំត្រួតពិនិត្យ', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    reviewed: { label: 'បានត្រួតពិនិត្យ', cls: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' }
};

function liveShifts() {
    return posRead(POS_KEYS.shifts, []);
}

function saveLiveShift(shift) {
    return upsertById(POS_KEYS.shifts, shift);
}

/* វេនដែលកំពុងបើកលើបញ្ជរនេះ */
function currentShift() {
    return liveShifts()
        .filter(s => s.register === MY_REGISTER && s.status === 'open')
        .sort((a, b) => b.openedAt.localeCompare(a.openedAt))[0] || null;
}

function lastShiftFor(register) {
    return liveShifts()
        .filter(s => s.register === register)
        .sort((a, b) => b.openedAt.localeCompare(a.openedAt))[0] || null;
}

/* វេនដែលទំព័រអ្នកគិតលុយបង្ហាញ — វេនបើក ឬបើគ្មាន វេនចុងក្រោយដែលទើបបិទ */
function cashierShift() {
    const last = lastShiftFor(MY_REGISTER);
    return currentShift() || (last && last.cashierId === ME_CASHIER ? last : null);
}

/* វេនដែលបើកលើបញ្ជរនេះដោយអ្នកផ្សេង — អ្នកចូលប្រើបច្ចុប្បន្នមិនអាចលក់លើថតប្រាក់របស់គេបានទេ */
function foreignShift() {
    const sh = currentShift();
    return sh && sh.cashierId !== ME_CASHIER ? sh : null;
}

function isShiftOpen() {
    return !!currentShift();
}

function shiftIdFor(dateStr, register, code) {
    const base = `SHIFT-${dateStr.replace(/-/g, '')}-${register.replace('-', '')}-${code}`;
    const taken = liveShifts().map(s => s.id);
    if (!taken.includes(base)) return base;
    let n = 2;
    while (taken.includes(`${base}${n}`)) n += 1;
    return `${base}${n}`;
}

/* មួយបញ្ជរ មួយថតប្រាក់ក្នុងពេលតែមួយ · មួយអ្នក មួយថតប្រាក់ · ត្រឡប់មូលហេតុ ឬ '' */
function openShiftBlocker(register, cashierId) {
    const open = liveShifts().filter(s => s.status === 'open');
    const onReg = open.find(s => s.register === register);
    if (onReg) return `${register} កំពុងប្រើដោយ ${personName(onReg.cashierId)}`;
    const mine = open.find(s => s.cashierId === cashierId);
    if (mine) return `${personName(cashierId)} កំពុងបើកវេនលើ ${mine.register} រួចហើយ`;
    return '';
}

function openShiftRecord(opts) {
    if (openShiftBlocker(opts.register, opts.cashierId)) return null;
    const now = new Date();
    const tpl = opts.template;
    const dateStr = templateDateFor(tpl, now);
    const shift = {
        id: shiftIdFor(dateStr, opts.register, tpl.code),
        date: dateStr,
        register: opts.register,
        cashierId: opts.cashierId,
        templateCode: tpl.code,
        templateName: tpl.name,
        start: tpl.start,
        end: opts.end || tpl.end,
        openedAt: isoLocal(now),
        fxRate: fxRate(),
        floatUSD: opts.floatUSD,
        floatKHR: opts.floatKHR,
        floatIssuedUSD: opts.floatIssuedUSD,
        floatIssuedKHR: opts.floatIssuedKHR,
        floatNote: opts.floatNote || '',
        floatApprovedBy: opts.approverId,
        status: 'open'
    };
    if (opts.short) {
        shift.short = true;
        shift.plannedEnd = opts.plannedEnd || tpl.end;
    }
    saveLiveShift(shift);
    return shift;
}

/* ===== ការលក់ ===== */

function liveSales() {
    return posRead(POS_KEYS.sales, []);
}

function salesOfShift(shiftId) {
    return liveSales()
        .filter(s => s.shiftId === shiftId)
        .sort((a, b) => b.time.localeCompare(a.time));
}

/* ការលក់ក្នុងវេនដែលអ្នកគិតលុយកំពុងមើល — ថ្មីមុនគេ */
function shiftSales() {
    const sh = cashierShift();
    return sh ? salesOfShift(sh.id) : [];
}

function saveSale(sale) {
    return upsertById(POS_KEYS.sales, sale);
}

function updateLiveSale(id, patch) {
    return patchById(POS_KEYS.sales, id, patch);
}

function findLiveSale(id) {
    return liveSales().find(s => s.id === id) || null;
}

/* RCP-01-1003-0012 = បញ្ជរ 01 · ថ្ងៃទី 3 ខែ 10 · លេខរៀងប្រចាំថ្ងៃ (លំដាប់ជាប់គ្នា — ស្រាវជ្រាវ §9) */
function receiptPrefix(register, date) {
    return `RCP-${register.slice(-2)}-${pad2(date.getMonth() + 1)}${pad2(date.getDate())}-`;
}

function nextReceiptNumber(register) {
    const reg = register || MY_REGISTER;
    const prefix = receiptPrefix(reg, new Date());
    const n = liveSales().filter(s => s.id.startsWith(prefix)).length + 1;
    return prefix + String(n).padStart(4, '0');
}

function isVoided(sale) {
    return sale.status === 'voided';
}

function returnedQty(sale, sku) {
    return (sale.returns || []).reduce((sum, r) =>
        sum + r.lines.filter(l => l.sku === sku).reduce((n, l) => n + l.qty, 0), 0);
}

function returnedAmount(sale) {
    return (sale.returns || []).reduce((sum, r) => sum + r.amount, 0);
}

/* ===== ការលក់ព្យួរ (ផែនការកែលម្អ C4) ===== */

function heldOfShift(shiftId) {
    return posRead(POS_KEYS.held, []).filter(h => h.shiftId === shiftId)
        .sort((a, b) => a.at.localeCompare(b.at));
}

function saveHeld(record) {
    return upsertById(POS_KEYS.held, record);
}

function removeHeld(id) {
    posWrite(POS_KEYS.held, posRead(POS_KEYS.held, []).filter(h => h.id !== id));
}

/* ===== សំណើអនុម័ត =====
   ប្រភេទ៖ void (លុបចោលវិក្កយបត្រ) · return (ប្រគល់ទំនិញវិញ)
   ស្ថានភាព៖ pending → approved | rejected
   mode៖ onsite (អ្នកគ្រប់គ្រងវាយលេខសម្ងាត់នៅបញ្ជរ) · remote (ពីបញ្ជីសំណើ) */

const APPROVAL_TYPE = {
    void: { label: 'លុបចោលវិក្កយបត្រ', icon: 'fa-ban', tone: 'rose' },
    return: { label: 'ប្រគល់ទំនិញវិញ', icon: 'fa-rotate-left', tone: 'amber' }
};

const APPROVAL_STATUS = {
    pending: { label: 'រង់ចាំអនុម័ត', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    approved: { label: 'បានអនុម័ត', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
    rejected: { label: 'បានបដិសេធ', cls: 'bg-rose-50 text-rose-700 border-rose-200' }
};

function liveApprovals() {
    return posRead(POS_KEYS.approvals, []);
}

function saveApproval(rec) {
    return upsertById(POS_KEYS.approvals, rec);
}

function pendingRequestFor(saleId) {
    return liveApprovals().find(a => a.saleId === saleId && a.status === 'pending') || null;
}

/* អនុវត្តលទ្ធផលនៃការអនុម័តលើការលក់ — ប្រើដោយទាំងការអនុម័តនៅបញ្ជរ និងពីបញ្ជីសំណើ
   updateFn ត្រូវបានផ្តល់ដោយ manager-data.js សម្រាប់ការលក់ក្នុងប្រវត្តិ */
function applyApprovalToSale(req, approverId, updateFn) {
    const update = updateFn || updateLiveSale;
    const at = isoLocal(new Date());
    const sale = typeof findAnySale === 'function' ? findAnySale(req.saleId) : findLiveSale(req.saleId);
    if (!sale) return;
    recordApprovalStock(req, sale, approverId, at);
    if (req.type === 'void') {
        update(req.saleId, { status: 'voided', voidedBy: approverId, voidedAt: at, voidReason: req.reason });
    } else if (req.type === 'return') {
        const returns = (sale.returns || []).concat([{
            id: req.id, lines: req.lines, amount: req.amount, method: req.method,
            amountKHR: req.method === 'khrCash' ? Math.round(toKHR(req.amount, sale.fxRate) / 100) * 100 : 0,
            reason: req.reason, approvedBy: approverId, at, restock: req.restock !== false
        }]);
        update(req.saleId, { returns });
    }
}

/* ===== ចលនាសាច់ប្រាក់ (ឯកសាររចនាលេខ 02 ផ្នែក 5.4) =====
   float៖ ប្រាក់បាតថតដែលអ្នកគ្រប់គ្រងចេញ (រង់ចាំរហូតដល់អ្នកគិតលុយរាប់ចូលពេលបើកវេន)
   drop៖ ផ្ទេរពីថតចូលទូដែក (អ្នកគិតលុយធ្វើ អ្នកគ្រប់គ្រងបញ្ជាក់ការទទួល)
   payout / payin៖ ដក ឬបញ្ចូលប្រាក់ក្រៅការលក់ · bank៖ ដាក់ប្រាក់ពីទូដែកចូលធនាគារ */

const MOVEMENT_TYPE = {
    float: { label: 'ចេញប្រាក់បាតថត', icon: 'fa-hand-holding-dollar', tone: 'slate' },
    drop: { label: 'ផ្ទេរចូលទូដែក', icon: 'fa-vault', tone: 'slate' },
    payout: { label: 'ដកប្រាក់ចំណាយ', icon: 'fa-money-bill-transfer', tone: 'slate' },
    payin: { label: 'បញ្ចូលប្រាក់បន្ថែម', icon: 'fa-circle-plus', tone: 'slate' },
    bank: { label: 'ដាក់ប្រាក់ចូលធនាគារ', icon: 'fa-building-columns', tone: 'slate' }
};

const MOVEMENT_STATUS = {
    pending: { label: 'រង់ចាំទទួល', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    confirmed: { label: 'បានបញ្ជាក់', cls: 'bg-slate-50 text-slate-600 border-slate-200' }
};

function liveMovements() {
    return posRead(POS_KEYS.movements, []);
}

function movementsOfShift(shiftId) {
    return liveMovements().filter(m => m.shiftId === shiftId);
}

function saveMovement(m) {
    return upsertById(POS_KEYS.movements, m);
}

function pendingFloatFor(register) {
    return liveMovements()
        .filter(m => m.type === 'float' && m.register === register && m.status === 'pending')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null;
}

/* ===== កំណត់ហេតុព្រឹត្តិការណ៍ (ផែនការកែលម្អ C9) =====
   ប្រភពទិន្នន័យសម្រាប់ទំព័រ «ករណីមិនប្រក្រតី» របស់អ្នកគ្រប់គ្រង។ អ្នកគិតលុយមិនឃើញវាទេ។ */

const EVENT_LABEL = {
    line_removed: 'ដកទំនិញចេញមុនទូទាត់',
    cart_cleared: 'សម្អាតកន្ត្រក',
    discount: 'បញ្ចុះតម្លៃ',
    hold: 'ព្យួរការលក់',
    hold_discarded: 'បោះបង់ការលក់ព្យួរ',
    void_requested: 'ស្នើលុបចោល',
    return_requested: 'ស្នើប្រគល់ទំនិញវិញ',
    override_approved: 'អនុម័តនៅបញ្ជរ',
    override_denied: 'លេខសម្ងាត់ខុស',
    request_approved: 'អនុម័តសំណើ',
    request_rejected: 'បដិសេធសំណើ',
    reprint: 'បោះពុម្ពឡើងវិញ',
    terminal_locked: 'ចាក់សោរបញ្ជរ',
    terminal_unlocked: 'ដោះសោរបញ្ជរ',
    shift_opened: 'បើកវេន',
    shift_closed: 'បិទវេន',
    shift_reviewed: 'ត្រួតពិនិត្យវេន',
    shift_reopened: 'បើកវេនឡើងវិញ',
    recount: 'រាប់ប្រាក់ឡើងវិញ',
    drop: 'ផ្ទេរចូលទូដែក',
    stock_mismatch: 'លក់លើសស្តុកក្នុងប្រព័ន្ធ',
    roster_assign: 'ចាត់តាំងកាលវិភាគ',
    roster_remove: 'ដកចេញពីកាលវិភាគ',
    roster_undo: 'មិនធ្វើវិញនូវការកែប្រែកាលវិភាគ',
    roster_default: 'កែវេនប្រចាំ',
    shift_blocked: 'រារាំងការបើកវេន (លើស 12 ម៉ោង)',
    shift_short: 'បើកវេនខ្លី'
};

function logPosEvent(type, detail) {
    const d = detail || {};
    const sh = d.shiftId ? null : currentShift();
    const list = posRead(POS_KEYS.events, []);
    list.push(Object.assign({
        id: newId('EV'),
        type,
        at: isoLocal(new Date()),
        shiftId: d.shiftId || (sh ? sh.id : ''),
        register: d.register || (sh ? sh.register : MY_REGISTER),
        actorId: d.actorId || currentActorId(),
        cashierId: d.cashierId || (sh ? sh.cashierId : ''),
        approverId: d.approverId || '',
        saleId: d.saleId || '',
        sku: d.sku || '',
        amount: d.amount || 0,
        reason: d.reason || '',
        note: d.note || ''
    }, d));
    posWrite(POS_KEYS.events, list.slice(-3000));
}

function liveEvents() {
    return posRead(POS_KEYS.events, []);
}

function posEvents() {
    return liveEvents();
}

/* ===== សោរបញ្ជរពេលសម្រាក (ផែនការកែលម្អ C22) ===== */

function terminalLock() {
    const lock = posRead(POS_KEYS.lock, null);
    const sh = currentShift();
    return lock && sh && lock.shiftId === sh.id ? lock : null;
}

function setTerminalLock(on) {
    const sh = currentShift();
    if (on && sh) posWrite(POS_KEYS.lock, { shiftId: sh.id, at: isoLocal(new Date()) });
    else {
        try { localStorage.removeItem(POS_KEYS.lock); } catch (e) { /* មិនអាចសម្អាត */ }
    }
}

/* ===== កន្ត្រក និងការទូទាត់បាគងដែលរង់ចាំ (sessionStorage) ===== */

function loadCart() {
    return sessRead(POS_KEYS.cart, null) || { items: [] };
}

function saveCart(state) {
    sessWrite(POS_KEYS.cart, state);
}

function clearCart() {
    sessRemove(POS_KEYS.cart);
}

function savePendingPayment(data) {
    sessWrite(POS_KEYS.pending, data);
}

function loadPendingPayment() {
    return sessRead(POS_KEYS.pending, null);
}

function clearPendingPayment() {
    sessRemove(POS_KEYS.pending);
}

/* ===== អេក្រង់អតិថិជន (CFD) =====
   ផ្ទាំងគិតលុយបោះផ្សាយរូបថតតូចមួយទៅ localStorage `pos_cfd` · ផ្ទាំងអតិថិជនអានតាមព្រឹត្តិការណ៍ storage
   មានតែអ្វីដែលអតិថិជនគួរឃើញ៖ ទំនិញ តម្លៃ ចំនួន ការទូទាត់ — គ្មានតម្លៃដើម ស្តុក លេខសម្ងាត់ ឬហេតុផលអនុម័តទេ
   stage៖ idle · sell · pay · khqr · thanks */
const CFD_KEY = 'pos_cfd';
const CFD_CMD_KEY = 'pos_cfd_cmd';
const CFD_ALIVE_KEY = 'pos_cfd_alive';

/* អេក្រង់អតិថិជនកំពុងបើក ប្រសិនបើវាបានផ្ញើសញ្ញាក្នុងរយៈពេល 6 វិនាទីចុងក្រោយ */
function cfdIsOpen() {
    return Date.now() - Number(localStorage.getItem(CFD_ALIVE_KEY) || 0) < 6000;
}

function publishCfd(state) {
    posWrite(CFD_KEY, { ...state, at: Date.now() });
}

function loadCfd() {
    return posRead(CFD_KEY, null);
}

/* ===== សង្ខេបវេន =====
   គណនាដាច់ដោយឡែកតាមរូបិយប័ណ្ណ (ផែនការកែលម្អ C12)៖
   រំពឹងទុក = បាតថត + ទទួលជាសាច់ប្រាក់ − ប្រាក់អាប់ − សងប្រាក់ − ផ្ទេរចូលទូដែក − ដកចំណាយ + បញ្ចូលបន្ថែម
   វិក្កយបត្រដែលបានលុបចោល មិនរាប់ចូលទេ ព្រោះប្រាក់ត្រូវបានប្រគល់ឱ្យអតិថិជនវិញទាំងស្រុង។ */

function summarizeShift(shift, sales, movements) {
    const acc = {
        count: 0, qty: 0, list: 0, gross: 0, net: 0, vat: 0, discount: 0,
        usdCash: 0, khrCash: 0, khqr: 0, changeUSD: 0, changeKHR: 0, roundingKHR: 0,
        khqrCount: 0, discountCount: 0, overrideCount: 0,
        voidCount: 0, voidAmount: 0, returnCount: 0, returnAmount: 0,
        refundUSD: 0, refundKHR: 0, refundKHQR: 0,
        dropUSD: 0, dropKHR: 0, payoutUSD: 0, payoutKHR: 0, payinUSD: 0, payinKHR: 0,
        pendingDrops: 0
    };
    sales.forEach(s => {
        const t = saleTotals(s.items, s.discountPercent);
        if (isVoided(s)) {
            acc.voidCount += 1;
            acc.voidAmount += t.gross;
            return;
        }
        acc.count += 1;
        acc.qty += t.qty;
        acc.list += t.list;
        acc.gross += t.gross;
        acc.net += t.net;
        acc.vat += t.vat;
        acc.discount += t.discount;
        acc.usdCash += s.pay.usdCash;
        acc.khrCash += s.pay.khrCash;
        acc.khqr += s.pay.khqr;
        if (s.pay.khqr > 0.005) acc.khqrCount += 1;
        if (t.discount > 0.005) acc.discountCount += 1;
        if (s.discountApproverId) acc.overrideCount += 1;
        const ch = saleChange(s);
        acc.changeUSD += ch.usd;
        acc.changeKHR += ch.khr;
        acc.roundingKHR += ch.roundingKHR || 0;
        (s.returns || []).forEach(r => {
            acc.returnCount += 1;
            acc.returnAmount += r.amount;
            if (r.method === 'usdCash') acc.refundUSD += r.amount;
            else if (r.method === 'khrCash') acc.refundKHR += r.amountKHR || 0;
            else acc.refundKHQR += r.amount;
        });
    });
    (movements || []).forEach(m => {
        if (m.type === 'drop') {
            acc.dropUSD += m.usd;
            acc.dropKHR += m.khr;
            if (m.status === 'pending') acc.pendingDrops += 1;
        } else if (m.type === 'payout') {
            acc.payoutUSD += m.usd;
            acc.payoutKHR += m.khr;
        } else if (m.type === 'payin') {
            acc.payinUSD += m.usd;
            acc.payinKHR += m.khr;
        }
    });
    const floatUSD = shift ? Number(shift.floatUSD) || 0 : 0;
    const floatKHR = shift ? Number(shift.floatKHR) || 0 : 0;
    acc.floatUSD = floatUSD;
    acc.floatKHR = floatKHR;
    acc.netSales = acc.gross - acc.returnAmount;
    acc.avgTicket = acc.count ? acc.gross / acc.count : 0;
    acc.rate = (shift && shift.fxRate) || fxRate();
    acc.expectedUSD = floatUSD + acc.usdCash - acc.changeUSD - acc.refundUSD - acc.dropUSD - acc.payoutUSD + acc.payinUSD;
    acc.expectedKHR = floatKHR + acc.khrCash - acc.changeKHR - acc.refundKHR - acc.dropKHR - acc.payoutKHR + acc.payinKHR;
    return acc;
}

function shiftSummary(shift) {
    const sh = shift || cashierShift();
    if (!sh) return summarizeShift(null, [], []);
    return summarizeShift(sh, salesOfShift(sh.id), movementsOfShift(sh.id));
}

/* ភាពខុសគ្នាសរុបគិតជាដុល្លារ តាមអត្រារបស់វេន */
function varianceOf(countedUSD, countedKHR, expectedUSD, expectedKHR, rate) {
    const dUSD = countedUSD - expectedUSD;
    const dKHR = countedKHR - expectedKHR;
    const diff = dUSD + toUSD(dKHR, rate);
    const abs = Math.abs(diff);
    const tol = Number(posSettings().varianceTolerance) || 5;
    return {
        dUSD, dKHR, diff, abs,
        level: abs <= 0.005 ? 'exact' : abs <= tol ? 'small' : 'large',
        direction: diff > 0.005 ? 'over' : diff < -0.005 ? 'short' : 'exact'
    };
}

const DIRECTION_LABEL = { over: 'លើសប្រាក់', short: 'ខ្វះប្រាក់', exact: 'ត្រឹមត្រូវគត់' };

function topSellers(sales, limit) {
    const tally = {};
    sales.filter(s => !isVoided(s)).forEach(s => {
        s.items.forEach(it => {
            tally[it.sku] = (tally[it.sku] || 0) + it.qty - returnedQty(s, it.sku);
        });
    });
    return Object.keys(tally)
        .map(sku => ({ product: getProduct(sku), qty: tally[sku] }))
        .filter(r => r.product && r.qty > 0)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, limit || 5);
}

/* ===== ស្តុក =====
   ចំនួនស្តុកមិនដែលកែដោយផ្ទាល់ទេ — គណនាតែពីចលនាដែលបានកត់ត្រា៖
   ស្តុកបើក (p.opening នៅពេល pos_stock_opening) + ចលនាទាំងអស់ក្រោយពេលនោះ។
   • ការលក់ គណនាពីវិក្កយបត្រផ្ទាល់ (មិនរក្សាទុកពីរដង)
   • ការលុបចោល ការប្រគល់វិញ ការទទួលស្តុក ការកែតម្រូវ និងការរាប់ស្តុក រក្សាទុកក្នុង pos_stock_moves
     នៅពេលវាកើតឡើង (រួមទាំងការលុបចោលវិក្កយបត្រចាស់ ដែលស្តុកត្រឡប់ចូលនៅថ្ងៃអនុម័ត)
   • ចលនានីមួយៗមាន អ្នកធ្វើ ពេលវេលា ប្រភេទ ចំនួន (+ ចូល · − ចេញ) និងមូលហេតុ
   បញ្ជរពីរទៀតក្នុងគំរូសាកល្បងជាការធ្វើត្រាប់ (manager-data.js) — ការលក់របស់វាក្រោយពេលស្តុកបើក
   មិនកាត់ស្តុកទេ ព្រោះទំព័រអ្នកគិតលុយមិនអាចមើលឃើញវា ហើយស្ថានភាពស្តុកត្រូវតែដូចគ្នាគ្រប់ទំព័រ។
   ទំព័រអ្នកគិតលុយប្រើតែ stockStatus() (អស់ · ជិតអស់) មិនបង្ហាញចំនួនឡើយ។ */

const STOCK_KEYS = { opening: 'pos_stock_opening', moves: 'pos_stock_moves', counts: 'pos_stock_counts' };

const STOCK_MOVE_TYPE = {
    sale: { label: 'លក់', icon: 'fa-cart-shopping', tone: 'slate' },
    void: { label: 'លុបចោលវិក្កយបត្រ', icon: 'fa-ban', tone: 'rose' },
    return: { label: 'ប្រគល់ទំនិញវិញ', icon: 'fa-rotate-left', tone: 'amber' },
    stock_in: { label: 'ទទួលស្តុក', icon: 'fa-truck-ramp-box', tone: 'slate' },
    adjust: { label: 'កែតម្រូវស្តុក', icon: 'fa-sliders', tone: 'slate' },
    count: { label: 'រាប់ស្តុក', icon: 'fa-clipboard-check', tone: 'slate' }
};

/* មូលហេតុកែតម្រូវ — sign = ទិសដៅនៃចលនា · shrink = រាប់ជាការបាត់បង់ */
const STOCK_ADJUST_REASONS = {
    damaged: { label: 'ខូចខាត', sign: -1, shrink: true },
    expired: { label: 'ផុតកំណត់', sign: -1, shrink: true },
    lost: { label: 'បាត់', sign: -1, shrink: true },
    found: { label: 'រកឃើញវិញ', sign: 1, shrink: false },
    internal: { label: 'ប្រើក្នុងហាង', sign: -1, shrink: false }
};

const STOCK_STATUS = {
    out: { label: 'អស់', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    low: { label: 'ជិតអស់', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    ok: { label: 'គ្រប់គ្រាន់', cls: 'bg-transparent text-slate-400 border-transparent' }
};

/* ពេលចាប់ផ្តើមកត់ត្រាស្តុក — បង្កើតម្តងគត់ ការលក់មុនពេលនេះរួមក្នុងស្តុកបើករួចហើយ */
function stockOpeningAt() {
    let o = posRead(STOCK_KEYS.opening, null);
    if (!o) {
        o = { at: isoLocal(new Date()) };
        posWrite(STOCK_KEYS.opening, o);
    }
    return o.at;
}

function storedStockMoves() {
    return posRead(STOCK_KEYS.moves, []);
}

function saveStockMoves(list) {
    if (!list.length) return;
    posWrite(STOCK_KEYS.moves, storedStockMoves().concat(list));
}

function storedStockCounts() {
    return posRead(STOCK_KEYS.counts, []);
}

function saveStockCount(session) {
    if (!session) return;
    const list = storedStockCounts();
    list.unshift(session);
    posWrite(STOCK_KEYS.counts, list);
}

function stockMove(fields) {
    return Object.assign({ id: newId('SM'), at: isoLocal(new Date()), by: currentActorId(), reason: '', ref: '', note: '' }, fields);
}

/* ចលនាលក់ពីវិក្កយបត្រ (ចំនួនអវិជ្ជមាន) */
function saleStockMoves(sale) {
    return sale.items.map(l => ({
        id: `SMS-${sale.id}-${l.sku}`, type: 'sale', sku: l.sku, qty: -l.qty, at: sale.time, by: sale.cashierId,
        reason: '', ref: sale.id, saleId: sale.id, shiftId: sale.shiftId, register: sale.register, note: ''
    }));
}

/* ចលនាស្តុកទាំងអស់ចាប់ពីស្តុកបើក — ថ្មីមុនគេ */
function liveStockMoves() {
    const from = stockOpeningAt();
    return liveSales().filter(s => s.time >= from).flatMap(saleStockMoves)
        .concat(storedStockMoves())
        .sort((a, b) => b.at.localeCompare(a.at));
}

/* ចំនួននៅក្នុងហាងបច្ចុប្បន្ន { sku: qty } — អាចអវិជ្ជមាន ពេលលក់លើសស្តុកក្នុងប្រព័ន្ធ */
function onHandLevels() {
    const lv = {};
    PRODUCTS.forEach(p => { lv[p.sku] = p.opening || 0; });
    liveStockMoves().forEach(m => { lv[m.sku] = (lv[m.sku] || 0) + m.qty; });
    return lv;
}

function onHand(sku) {
    return onHandLevels()[sku] || 0;
}

/* out = គ្មានក្នុងប្រព័ន្ធ · low = ត្រឹម ឬក្រោមកម្រិតអប្បបរមា */
function stockStatusOf(p, qty) {
    if (qty <= 0) return 'out';
    return qty <= (p.minStock || 0) ? 'low' : 'ok';
}

function stockStatus(sku, levels) {
    const p = getProduct(sku);
    if (!p) return 'ok';
    return stockStatusOf(p, (levels || onHandLevels())[sku] || 0);
}

function allowNegativeStock() {
    return posSettings().allowNegativeStock !== false;
}

/* ការលុបចោល → ស្តុកត្រឡប់ចូលទាំងអស់ (ដកចំនួនដែលបានប្រគល់វិញរួច)
   ការប្រគល់វិញ → ចូលស្តុកវិញ · បើអ្នកគ្រប់គ្រងសម្រេចថា «ខូច» កត់ត្រាការកែតម្រូវខូចខាតភ្លាម */
function recordApprovalStock(req, sale, approverId, at) {
    const base = { at, by: approverId, saleId: sale.id, shiftId: sale.shiftId, register: sale.register, ref: req.id };
    if (req.type === 'void') {
        saveStockMoves(sale.items
            .map(l => ({ sku: l.sku, qty: l.qty - returnedQty(sale, l.sku) }))
            .filter(l => l.qty > 0)
            .map(l => stockMove(Object.assign({}, base, { type: 'void', sku: l.sku, qty: l.qty, reason: req.reason }))));
    } else if (req.type === 'return') {
        const moves = [];
        req.lines.forEach(l => {
            moves.push(stockMove(Object.assign({}, base, { type: 'return', sku: l.sku, qty: l.qty, reason: req.reason })));
            if (req.restock === false) {
                moves.push(stockMove(Object.assign({}, base, { type: 'adjust', sku: l.sku, qty: -l.qty, reason: 'damaged', note: 'ទំនិញប្រគល់វិញខូច' })));
            }
        });
        saveStockMoves(moves);
    }
}

/* សួរអ្នកគ្រប់គ្រងពេលអនុម័តការប្រគល់វិញ → true (ចូលស្តុកវិញ) · false (ខូច) · null (បោះបង់) */
function askReturnOutcome(lines, dark) {
    const names = lines.map(l => `${(getProduct(l.sku) || {}).name || l.sku} × ${l.qty}`).join(' · ');
    return showOptionDialog({
        title: 'ទំនិញដែលប្រគល់វិញទៅណា?',
        message: escapeText(names),
        dark,
        options: [
            { value: 'restock', icon: 'fa-box-open', label: 'ចូលស្តុកវិញ', desc: 'ទំនិញនៅល្អ អាចលក់បន្តបាន' },
            { value: 'damaged', icon: 'fa-heart-crack', label: 'ខូច មិនអាចលក់បាន', desc: 'កត់ត្រាជាការខូចខាត ក្នុងរបាយការណ៍ការបាត់បង់' }
        ]
    }).then(v => v === 'restock' ? true : v === 'damaged' ? false : null);
}

/* ===== វិក្កយបត្រក្រដាសកម្តៅ 80mm =====
   អានអ្នកគិតលុយ បញ្ជរ និងអត្រាប្តូរប្រាក់ពីការលក់ផ្ទាល់ (ផែនការកែលម្អ C7)
   ដូច្នេះការបោះពុម្ពឡើងវិញ ឬការមើលពីទំព័រអ្នកគ្រប់គ្រង បង្ហាញព័ត៌មានពិតនៃពេលលក់ */

function receiptHtml(sale, options) {
    const opts = options || {};
    const rate = sale.fxRate || fxRate();
    const t = saleTotals(sale.items, sale.discountPercent);
    const ch = saleChange(sale);
    const voided = isVoided(sale);

    const row = (label, value, strong) => `
        <div style="display:flex;justify-content:space-between;gap:8px;${strong ? 'font-weight:600;padding-top:4px;border-top:1px dashed #94a3b8;' : ''}">
            <span>${label}</span><span>${value}</span>
        </div>`;

    const items = sale.items.map(l => {
        const p = getProduct(l.sku);
        const back = returnedQty(sale, l.sku);
        return `
            <div style="margin-bottom:6px;">
                <div>${p.name}</div>
                <div style="display:flex;justify-content:space-between;gap:8px;color:#475569;">
                    <span>${l.qty} ${p.unit} × ${fmtUSD(linePrice(l))}${back ? ` · ប្រគល់វិញ ${back}` : ''}</span>
                    <span>${fmtUSD(lineTotal(l))}</span>
                </div>
            </div>`;
    }).join('');

    const payLines = [
        sale.pay.usdCash > 0 ? row(PAY_LABEL.usdCash, fmtUSD(sale.pay.usdCash)) : '',
        sale.pay.khrCash > 0 ? row(PAY_LABEL.khrCash, fmtKHR(sale.pay.khrCash)) : '',
        sale.pay.khqr > 0 ? row(PAY_LABEL.khqr, fmtUSD(sale.pay.khqr)) : '',
        (ch.usd > 0.005 || ch.khr >= 1) ? row('ប្រាក់អាប់', fmtChange(ch)) : ''
    ].join('');

    const returns = (sale.returns || []).map(r =>
        row(`ប្រគល់វិញ ${fmtTime(r.at)}`, '− ' + fmtUSD(r.amount))).join('');

    const customer = sale.customerId ? getCreditCustomer(sale.customerId) : null;
    const taxInvoice = customer && customer.vattin;

    return `
        <div class="receipt-ticket" style="width:72mm;max-width:100%;margin:0 auto;font-family:'Kantumruy Pro',sans-serif;font-size:12px;line-height:1.5;color:#0f172a;position:relative;background:#ffffff;">
            <div style="text-align:center;padding-bottom:8px;border-bottom:1px dashed #94a3b8;">
                <div style="font-size:15px;font-weight:700;">${MERCHANT.nameKh}</div>
                <div style="color:#475569;">${MERCHANT.branch}</div>
                <div style="color:#475569;">លេខអត្តសញ្ញាណកម្មអាករ ${MERCHANT.tin}</div>
                <div style="color:#475569;">ទូរស័ព្ទ ${MERCHANT.phone}</div>
                <div style="margin-top:6px;font-weight:600;">${taxInvoice ? 'វិក្កយបត្រអាករ' : 'វិក្កយបត្រ'}</div>
            </div>

            ${voided ? `<div style="margin:8px 0;padding:6px;border:2px solid #e11d48;color:#e11d48;text-align:center;font-weight:700;">បានលុបចោល · ${fmtTime(sale.voidedAt)}</div>` : ''}

            <div style="padding:8px 0;border-bottom:1px dashed #94a3b8;">
                ${row('លេខវិក្កយបត្រ', sale.id)}
                ${row('កាលបរិច្ឆេទ', fmtDate(sale.time))}
                ${row('ម៉ោង', fmtTime(sale.time))}
                ${row('អ្នកគិតលុយ', personName(sale.cashierId))}
                ${row('ម៉ាស៊ីន', sale.register || MY_REGISTER)}
                ${customer ? row('អតិថិជន', customer.name) : ''}
                ${taxInvoice ? row('លេខអត្តសញ្ញាណកម្មអាករអតិថិជន', customer.vattin) : ''}
                ${taxInvoice ? `<div style="color:#475569;">${customer.address}</div>` : ''}
            </div>

            <div style="padding:8px 0;border-bottom:1px dashed #94a3b8;">${items}</div>

            <div style="padding:8px 0;border-bottom:1px dashed #94a3b8;">
                ${row('ចំនួនឯកតា', t.qty)}
                ${t.discount > 0.005 ? row('តម្លៃមុនបញ្ចុះ', fmtUSD(t.list)) : ''}
                ${t.discount > 0.005 ? row(`ការបញ្ចុះតម្លៃ ${t.discountPercent}%`, '− ' + fmtUSD(t.discount)) : ''}
                ${row('តម្លៃមុនអាករ', fmtUSD(t.net))}
                ${row('អាករលើតម្លៃបន្ថែម 10%', fmtUSD(t.vat))}
                ${row('សរុបត្រូវបង់', fmtUSD(t.gross), true)}
                ${row('គិតជារៀល', fmtKHR(toKHR(t.gross, rate)))}
            </div>

            <div style="padding:8px 0;border-bottom:1px dashed #94a3b8;">${payLines}${returns}</div>

            <div style="text-align:center;padding-top:10px;color:#475569;">
                <div>អត្រាប្តូរប្រាក់ 1 ដុល្លារ = ${rate.toLocaleString('en-US')} ៛</div>
                <div style="margin-top:6px;font-weight:600;color:#0f172a;">សូមអរគុណ · ជួបគ្នាពេលក្រោយ</div>
                ${opts.reprint ? '<div style="margin-top:6px;font-weight:600;">-- បោះពុម្ពឡើងវិញ --</div>' : ''}
            </div>
        </div>`;
}

/* ===== បោះពុម្ពវិក្កយបត្រលើក្រដាសតូច (Small Paper / 80mm Thermal Receipt Printer) =====
   គណនាកម្ពស់ជាក់ស្តែង និងកំណត់ទំហំក្រដាស 80mm x [height]mm (Small Paper) ដោយមិនឱ្យធ្លាក់ចូលក្រដាស A4 ឡើយ */
function printThermalReceipt(sale, options) {
    if (!sale) return;
    const content = receiptHtml(sale, options);

    // 1. Sync ជាមួយ #printArea ក្នុងទំព័រ
    const printArea = document.getElementById('printArea');
    if (printArea) {
        printArea.innerHTML = content;
    }

    // 2. វាស់កម្ពស់ជាក់ស្តែងនៃវិក្កយបត្រ (Dynamic Receipt Height Measurement)
    const measurer = document.createElement('div');
    measurer.style.position = 'fixed';
    measurer.style.left = '-9999px';
    measurer.style.top = '0';
    measurer.style.width = '72mm';
    measurer.style.padding = '0';
    measurer.style.margin = '0';
    measurer.style.fontFamily = "'Kantumruy Pro', sans-serif";
    measurer.style.fontSize = '12px';
    measurer.style.lineHeight = '1.5';
    measurer.style.visibility = 'hidden';
    measurer.innerHTML = content;
    document.body.appendChild(measurer);
    const measuredPx = measurer.scrollHeight || measurer.offsetHeight || 440;
    document.body.removeChild(measurer);

    // 96px = 25.4mm -> 1px = 0.2645833mm; បន្ថែម 8mm សុវត្ថិភាពដើម្បីកុំឱ្យដាច់ទៅទំព័រទី 2
    const heightMm = Math.max(90, Math.ceil(measuredPx * 0.2645833) + 8);

    // 3. កំណត់ @page លើទំព័រមេ ប្រសិនបើ browser បោះពុម្ពលើ parent window
    let dynamicStyle = document.getElementById('dynamicThermalPageStyle');
    if (!dynamicStyle) {
        dynamicStyle = document.createElement('style');
        dynamicStyle.id = 'dynamicThermalPageStyle';
        document.head.appendChild(dynamicStyle);
    }
    dynamicStyle.innerHTML = `
        @page {
            size: 80mm ${heightMm}mm !important;
            margin: 0mm !important;
        }
        @media print {
            @page {
                size: 80mm ${heightMm}mm !important;
                margin: 0mm !important;
            }
        }
    `;

    // 4. បង្កើត iFrame ដែលមានទំហំពិតប្រាកដ និងមិន hide/zero dimension ដែលនាំឱ្យ Chrome បដិសេធ
    let frame = document.getElementById('thermalReceiptPrintFrame');
    if (frame) {
        frame.remove();
    }
    frame = document.createElement('iframe');
    frame.id = 'thermalReceiptPrintFrame';
    frame.style.position = 'fixed';
    frame.style.left = '-9999px';
    frame.style.top = '0';
    frame.style.width = '80mm';
    frame.style.height = `${heightMm}mm`;
    frame.style.border = '0';
    frame.style.opacity = '0.01';
    frame.style.pointerEvents = 'none';
    document.body.appendChild(frame);

    const frameDoc = frame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(`<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <title>វិក្កយបត្រ - ${sale.id}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        @page {
            size: 80mm ${heightMm}mm;
            margin: 0;
        }
        @media print {
            @page {
                size: 80mm ${heightMm}mm;
                margin: 0;
            }
            html, body {
                width: 80mm !important;
                height: ${heightMm}mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .receipt-sheet {
                width: 76mm !important;
                margin: 0 auto !important;
                padding: 2mm 2mm 4mm 2mm !important;
            }
        }
        html, body {
            width: 80mm;
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-family: 'Kantumruy Pro', sans-serif;
            color: #0f172a;
            -webkit-font-smoothing: antialiased;
        }
        .receipt-sheet {
            width: 76mm;
            margin: 0 auto;
            padding: 2mm 2mm 4mm 2mm;
            box-sizing: border-box;
        }
    </style>
</head>
<body>
    <div class="receipt-sheet">
        ${content}
    </div>
</body>
</html>`);
    frameDoc.close();

    setTimeout(() => {
        try {
            frame.contentWindow.focus();
            frame.contentWindow.print();
        } catch (e) {
            window.print();
        }
    }, 280);
}

/* ===== របាយការណ៍បិទវេន A4 =====
   ប្រើរួមដោយទំព័របិទវេនរបស់អ្នកគិតលុយ និងទំព័រមើលវេនរបស់អ្នកគ្រប់គ្រង
   ដូច្នេះតួនាទីទាំងពីរបោះពុម្ពឯកសារតែមួយ (ឯកសាររចនាលេខ 02 ផ្នែក 5.3)។
   opts.live = true → របាយការណ៍ពាក់កណ្តាលវេន (វេននៅបើក មិនរក្សាទុក) */

function zReportHtml(shift, s, opts) {
    const o = opts || {};
    const live = !!o.live;
    const rate = shift.fxRate || fxRate();
    const v = shift.status !== 'open' && shift.countedUSD != null
        ? varianceOf(shift.countedUSD, shift.countedKHR, s.expectedUSD, s.expectedKHR, rate)
        : null;

    const line = (label, value, strong) => `
        <div class="flex justify-between gap-4 py-1.5 ${strong ? 'border-t border-slate-300 mt-1 pt-2' : ''}">
            <span class="${strong ? 'sm-value' : 'sm-td'} text-slate-600">${label}</span>
            <span class="${strong ? 'sm-value' : 'sm-td'} text-slate-800 sm-figure text-right">${value}</span>
        </div>`;

    const cashRow = (label, usd, khr, opts2) => {
        const x = opts2 || {};
        return `<tr class="${x.rule ? 'border-t border-slate-300' : ''}">
            <td class="py-1.5 pr-3 ${x.strong ? 'sm-value text-slate-800' : 'sm-td text-slate-600'}">${label}</td>
            <td class="py-1.5 px-3 text-right sm-figure ${x.strong ? 'sm-value' : 'sm-td'} ${x.usdTone || 'text-slate-800'}">${usd}</td>
            <td class="py-1.5 pl-3 text-right sm-figure ${x.strong ? 'sm-value' : 'sm-td'} ${x.khrTone || 'text-slate-800'}">${khr}</td>
        </tr>`;
    };
    const neg = (n, fmt) => n > 0.004 ? '− ' + fmt(n) : fmt(0);
    const tone = n => Math.abs(n) <= 0.5 ? 'text-emerald-700' : n > 0 ? 'text-amber-700' : 'text-rose-700';

    const reviewer = shift.reviewedBy ? personName(shift.reviewedBy) : '';

    return `
        <div class="text-center pb-5 border-b-2 border-slate-800">
            <p class="sm-card-title text-slate-800 text-[18px]">${MERCHANT.nameKh}</p>
            <p class="sm-card-sub text-slate-500">${MERCHANT.branch}</p>
            <p class="sm-card-sub text-slate-500">លេខអត្តសញ្ញាណកម្មអាករ ${MERCHANT.tin}</p>
            <p class="sm-card-title text-slate-800 text-[20px] mt-4">${live ? 'របាយការណ៍ពាក់កណ្តាលវេន' : 'របាយការណ៍បិទវេន'}</p>
            ${live ? '<p class="sm-td-sub text-amber-700 mt-1">វេននៅបើក · តួលេខនៅប្រែប្រួល · មិនរក្សាទុកឡើយ</p>' : ''}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 mt-5">
            <div>
                ${line('លេខវេន', shift.id)}
                ${line('ម៉ាស៊ីន', shift.register)}
                ${line('អ្នកគិតលុយ', personName(shift.cashierId))}
                ${line('គំរូវេន', `${shift.templateName} ${shift.start}–${shift.end}`)}
            </div>
            <div>
                ${line('កាលបរិច្ឆេទ', fmtDate(shift.openedAt))}
                ${line('បើកវេន', fmtTime(shift.openedAt))}
                ${line('បិទវេន', shift.closedAt ? fmtTime(shift.closedAt) : '—')}
                ${line('អត្រាប្តូរប្រាក់', `1 ដុល្លារ = ${rate.toLocaleString('en-US')} ៛`)}
            </div>
        </div>

        <div class="mt-6">
            <p class="sm-eyebrow text-slate-400 pb-2 border-b border-slate-200">ការលក់ក្នុងវេន</p>
            <div class="mt-2">
                ${line('ចំនួនវិក្កយបត្រ', `${s.count}`)}
                ${line('ចំនួនឯកតាលក់', `${s.qty}`)}
                ${line('តម្លៃមុនអាករ', fmtUSD(s.net))}
                ${line(`ការបញ្ចុះតម្លៃ · ${s.discountCount} វិក្កយបត្រ`, fmtUSD(s.discount))}
                ${line('អាករលើតម្លៃបន្ថែម 10%', fmtUSD(s.vat))}
                ${line('លក់បានសរុប', fmtUSD(s.gross), true)}
                ${line(`លុបចោល · ${s.voidCount} វិក្កយបត្រ`, fmtUSD(s.voidAmount))}
                ${line(`ប្រគល់ទំនិញវិញ · ${s.returnCount} ដង`, '− ' + fmtUSD(s.returnAmount))}
                ${line('លក់សុទ្ធក្រោយប្រគល់វិញ', fmtUSD(s.netSales), true)}
            </div>
        </div>

        <div class="mt-6">
            <p class="sm-eyebrow text-slate-400 pb-2 border-b border-slate-200">ទទួលតាមវិធីទូទាត់</p>
            <div class="mt-2">
                ${line('សាច់ប្រាក់ដុល្លារ', fmtUSD(s.usdCash))}
                ${line('សាច់ប្រាក់រៀល', fmtKHR(s.khrCash))}
                ${line(`ស្កេនកូដបាគង · ${s.khqrCount} វិក្កយបត្រ`, fmtUSD(s.khqr))}
            </div>
        </div>

        <div class="mt-6" style="page-break-inside: avoid">
            <p class="sm-eyebrow text-slate-400 pb-2 border-b border-slate-200">ការផ្ទៀងផ្ទាត់សាច់ប្រាក់តាមថត</p>
            <table class="w-full mt-1">
                <thead>
                    <tr class="border-b border-slate-200">
                        <th class="py-2 pr-3 text-left sm-td-sub text-slate-400 font-medium"></th>
                        <th class="py-2 px-3 text-right sm-td-sub text-slate-400 font-medium">ថតដុល្លារ</th>
                        <th class="py-2 pl-3 text-right sm-td-sub text-slate-400 font-medium">ថតរៀល</th>
                    </tr>
                </thead>
                <tbody>
                    ${cashRow('ប្រាក់បាតថត', fmtUSD(s.floatUSD), fmtKHR(s.floatKHR))}
                    ${cashRow('បូក ទទួលជាសាច់ប្រាក់', fmtUSD(s.usdCash), fmtKHR(s.khrCash))}
                    ${cashRow('ដក ប្រាក់អាប់', neg(s.changeUSD, fmtUSD), neg(s.changeKHR, fmtKHR))}
                    ${s.refundUSD || s.refundKHR ? cashRow('ដក សងប្រាក់ប្រគល់ទំនិញ', neg(s.refundUSD, fmtUSD), neg(s.refundKHR, fmtKHR)) : ''}
                    ${s.dropUSD || s.dropKHR ? cashRow('ដក ផ្ទេរចូលទូដែក', neg(s.dropUSD, fmtUSD), neg(s.dropKHR, fmtKHR)) : ''}
                    ${s.payoutUSD || s.payoutKHR ? cashRow('ដក ប្រាក់ចំណាយ', neg(s.payoutUSD, fmtUSD), neg(s.payoutKHR, fmtKHR)) : ''}
                    ${s.payinUSD || s.payinKHR ? cashRow('បូក បញ្ចូលបន្ថែម', fmtUSD(s.payinUSD), fmtKHR(s.payinKHR)) : ''}
                    ${cashRow('ប្រព័ន្ធរំពឹងទុក', fmtUSD(s.expectedUSD), fmtKHR(s.expectedKHR), { strong: true, rule: true })}
                    ${v ? cashRow('រាប់បានជាក់ស្តែង', fmtUSD(shift.countedUSD), fmtKHR(shift.countedKHR), { strong: true }) : ''}
                    ${v ? cashRow('ភាពខុសគ្នា', fmtSigned(v.dUSD, fmtUSD), fmtSigned(v.dKHR, fmtKHR, 0.5),
                        { rule: true, strong: true, usdTone: tone(v.dUSD * 100), khrTone: tone(v.dKHR) }) : ''}
                </tbody>
            </table>
            ${v ? `<div class="mt-2 pt-2 border-t-2 border-slate-300 flex justify-between gap-4">
                <span class="sm-value text-slate-700">សរុបគិតជាដុល្លារ · ${DIRECTION_LABEL[v.direction]}</span>
                <span class="sm-value sm-figure ${v.level === 'exact' ? 'text-emerald-700' : v.level === 'small' ? 'text-amber-700' : 'text-rose-700'}">${fmtSigned(v.diff, fmtUSD)}</span>
            </div>` : ''}
            ${shift.firstCount ? `
            <div class="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p class="sm-td-sub text-amber-800">ការរាប់លើកទី 1 (មុនរាប់ឡើងវិញ)</p>
                <p class="sm-td text-amber-900 mt-0.5 sm-figure">${fmtUSD(shift.firstCount.countedUSD)} · ${fmtKHR(shift.firstCount.countedKHR)}</p>
            </div>` : ''}
            ${shift.reason ? `
            <div class="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p class="sm-td-sub text-slate-500">ការពន្យល់របស់អ្នកគិតលុយ</p>
                <p class="sm-td text-slate-700 mt-1">${escapeText(shift.reason)}</p>
            </div>` : ''}
            ${shift.reviewNote ? `
            <div class="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                <p class="sm-td-sub text-blue-700">កំណត់ចំណាំរបស់អ្នកគ្រប់គ្រង</p>
                <p class="sm-td text-blue-900 mt-1">${escapeText(shift.reviewNote)}</p>
            </div>` : ''}
        </div>

        ${live ? '' : `
        <div class="grid grid-cols-2 gap-10 mt-10 pt-6 border-t border-slate-300 signature-block" style="page-break-inside: avoid">
            <div class="text-center">
                <div class="h-14 border-b border-slate-400 flex items-end justify-center pb-1">
                    ${shift.closedAt ? `<span class="sm-td-sub text-slate-500">បានបញ្ជាក់ដោយលេខសម្ងាត់ ${fmtDate(shift.closedAt)} ${fmtTime(shift.closedAt)}</span>` : ''}
                </div>
                <p class="sm-td text-slate-600 mt-2">អ្នកគិតលុយ</p>
                <p class="sm-td-sub text-slate-400">${personName(shift.cashierId)}</p>
            </div>
            <div class="text-center">
                <div class="h-14 border-b border-slate-400 flex items-end justify-center pb-1">
                    ${shift.reviewedAt ? `<span class="sm-td-sub text-slate-500">បានបញ្ជាក់ដោយលេខសម្ងាត់ ${fmtDate(shift.reviewedAt)} ${fmtTime(shift.reviewedAt)}</span>` : ''}
                </div>
                <p class="sm-td text-slate-600 mt-2">${ROLE_NAME.manager}</p>
                <p class="sm-td-sub text-slate-400">${reviewer || 'ហត្ថលេខា និងកាលបរិច្ឆេទ'}</p>
            </div>
        </div>`}

        <p class="sm-td-sub text-slate-400 text-center mt-6">
            បោះពុម្ព ${fmtDate(new Date())} ម៉ោង ${fmtTime(new Date())}
        </p>`;
}

/* ===== ការជូនដំណឹងសម្រាប់អ្នកគិតលុយ =====
   មិនបង្ហាញ «សាច់ប្រាក់រំពឹងទុកក្នុងថត» ឡើយ ព្រោះការរាប់បិទវេនត្រូវតែបិទភ្នែក (C1)។
   manager-data.js កំណត់អនុគមន៍នេះឡើងវិញសម្រាប់ទំព័រអ្នកគ្រប់គ្រង។ */

function portalNotifications() {
    const list = [];
    const sh = currentShift();

    if (!sh) {
        const last = lastShiftFor(MY_REGISTER);
        list.push({
            icon: 'mdi:lock-outline',
            tone: 'danger',
            title: last ? `វេន ${last.id} បានបិទរួចហើយ` : 'មិនទាន់មានវេនបើកទេ',
            note: 'សូមបើកវេនថ្មី ដោយរាប់ប្រាក់បាតថតជាមួយអ្នកគ្រប់គ្រង',
            href: `${document.body.dataset.roleRoot || '../..'}/cashier/shift/open-shift.html`
        });
        return list;
    }

    const now = new Date();
    const end = shiftEndDate(sh);
    const over = now - end;
    const opened = now - new Date(sh.openedAt);
    if (opened > 12 * 3600000) {
        list.push({ icon: 'mdi:alert-octagon-outline', tone: 'danger', title: 'វេនបើកលើស 12 ម៉ោង',
            note: 'លើសម៉ោងធ្វើការអតិបរមាតាមច្បាប់ · សូមបិទវេនឥឡូវនេះ' });
    } else if (over > 0) {
        list.push({ icon: 'mdi:clock-alert-outline', tone: 'warning', title: `ហួសម៉ោងវេន ${fmtDuration(over)}`,
            note: `${sh.templateName} ត្រូវបិទម៉ោង ${sh.end} · សូមបិទវេន` });
    } else if (-over <= 15 * 60000) {
        list.push({ icon: 'mdi:cash-lock-open', tone: 'warning', title: 'ដល់ពេលត្រៀមបិទវេនហើយ',
            note: `${sh.templateName} បិទម៉ោង ${sh.end} · នៅសល់ ${fmtDuration(-over)}` });
    }

    // លទ្ធផលសំណើដែលអ្នកគ្រប់គ្រងបានសម្រេច
    liveApprovals()
        .filter(a => a.shiftId === sh.id && a.status !== 'pending' && a.mode === 'remote')
        .sort((a, b) => (b.decidedAt || '').localeCompare(a.decidedAt || ''))
        .slice(0, 3)
        .forEach(a => list.push({
            icon: a.status === 'approved' ? 'mdi:check-decagram-outline' : 'mdi:close-octagon-outline',
            tone: a.status === 'approved' ? 'success' : 'danger',
            title: `${APPROVAL_TYPE[a.type].label} ${a.saleId} ${APPROVAL_STATUS[a.status].label}`,
            note: `ដោយ ${personName(a.decidedBy)}${a.decisionNote ? ' · ' + a.decisionNote : ''}`,
            time: fmtTime(a.decidedAt),
            href: `${document.body.dataset.roleRoot || '../..'}/cashier/receipts/receipts.html`
        }));

    const s = shiftSummary(sh);
    const st = posSettings();
    if (s.expectedUSD > st.drawerLimitUSD || s.expectedKHR > st.drawerLimitKHR) {
        list.push({ icon: 'mdi:safe', tone: 'warning', title: 'សាច់ប្រាក់ក្នុងថតលើសកំណត់',
            note: 'សូមផ្ទេរប្រាក់ខ្លះចូលទូដែក ហើយឱ្យអ្នកគ្រប់គ្រងទទួល' });
    }

    // អ្នកគិតលុយឃើញតែស្ថានភាព (អស់ · ជិតអស់) មិនឃើញចំនួនស្តុកឡើយ · រួមជាដំណឹងមួយក្នុងមួយស្ថានភាព
    const levels = onHandLevels();
    const byStatus = { out: [], low: [] };
    sellableProducts().forEach(p => { const st = stockStatus(p.sku, levels); if (byStatus[st]) byStatus[st].push(p.name); });
    const names = arr => arr.slice(0, 3).join(' · ') + (arr.length > 3 ? ` និង ${arr.length - 3} ទៀត` : '');
    if (byStatus.out.length) list.push({
        icon: 'mdi:package-variant-remove', tone: allowNegativeStock() ? 'warning' : 'danger',
        title: `ទំនិញ ${byStatus.out.length} មុខអស់ស្តុក`,
        note: `${names(byStatus.out)} · ${allowNegativeStock() ? 'នៅតែលក់បាន ប្រព័ន្ធជូនដំណឹងអ្នកគ្រប់គ្រងរួចហើយ' : 'មិនអាចលក់បានទេ'}`
    });
    if (byStatus.low.length) list.push({
        icon: 'mdi:package-variant', tone: 'warning',
        title: `ទំនិញ ${byStatus.low.length} មុខជិតអស់ស្តុក`,
        note: `${names(byStatus.low)} · សូមប្រាប់អ្នកគ្រប់គ្រង`
    });

    // ស្ថានភាពវេន — មិនមែនជាដំណឹងទេ បង្ហាញជាបន្ទាត់ខាងក្រោមផ្ទាំង
    list.push({
        kind: 'status',
        icon: 'mdi:clock-outline',
        title: `${sh.templateName} · ${sh.register} បើកបាន ${fmtDuration(opened)}`,
        note: `${s.count} វិក្កយបត្រ`
    });

    return list;
}

/* ផ្លាកលេខក្នុងម៉ឺនុយចំហៀងរបស់អ្នកគិតលុយ (ហៅដោយ portal.js) */
function totalPending() {
    return shiftSales().filter(s => !isVoided(s)).length;
}

/* ===== កូដ KHQR បាគង (គំរូសាកល្បង) =====
   ប្រព័ន្ធពិតបង្កើតកូដ KHQR តាមស្តង់ដារបាគង (ស្លាក 99 មានពេលបង្កើត និងពេលផុតកំណត់)
   ហើយពិនិត្យការទូទាត់តាម MD5 នៃកូដ (ស្រាវជ្រាវ §8)។ នៅទីនេះយើងគណនាសញ្ញាសម្គាល់សាមញ្ញ
   ដើម្បីរក្សាទុកជាមួយការទូទាត់ដែលរង់ចាំ — មិនមែន MD5 ពិតទេ។ */

function buildKhqrPayload(receiptId, amount, createdAt, expiresAt) {
    const amt = Number(amount).toFixed(2);
    const ts = `00${String(createdAt).length}${createdAt}01${String(expiresAt).length}${expiresAt}`;
    return [
        '00020101',
        '010212',
        `0212${MERCHANT.account}`,
        '5303840',
        `54${String(amt.length).padStart(2, '0')}${amt}`,
        '5802KH',
        `59${String(MERCHANT.name.length).padStart(2, '0')}${MERCHANT.name}`,
        `60${String(MERCHANT.city.length).padStart(2, '0')}${MERCHANT.city}`,
        `62${String(receiptId.length + 4).padStart(2, '0')}01${String(receiptId.length).padStart(2, '0')}${receiptId}`,
        `99${String(ts.length).padStart(2, '0')}${ts}`
    ].join('');
}

function simpleHash(text) {
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193;
    for (let i = 0; i < text.length; i++) {
        h1 = Math.imul(h1 ^ text.charCodeAt(i), 16777619) >>> 0;
        h2 = Math.imul(h2 + text.charCodeAt(i), 2246822519) >>> 0;
    }
    return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).repeat(2);
}

/* ===== ម៉ាស៊ីនបង្កើតទិន្នន័យគំរូ (ប្រើរួមដោយការលក់ក្នុងវេនបច្ចុប្បន្ន និងប្រវត្តិរបស់អ្នកគ្រប់គ្រង) =====
   ធ្វើត្រាប់តាមហាងលក់រាយតូចមួយនៅភ្នំពេញ៖ មនុស្សច្រើនពេលព្រឹក ថ្ងៃត្រង់ និងល្ងាច ស្ងាត់ពេលយប់ជ្រៅ
   កន្ត្រកភាគច្រើនមាន 1 ទៅ 2 មុខ ទំនិញលក់ដាច់ (ទឹក កាហ្វេ នំ) លក់ច្រើនជាងគ្រឿងអគ្គិសនីឆ្ងាយ។
   លេខចៃដន្យអាចបង្កើតឡើងវិញបាន ដូច្នេះទិន្នន័យដដែលរាល់ពេលបើក។ */

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

function pickWeighted(rng, list, weightOf) {
    const total = list.reduce((n, x) => n + weightOf(x), 0);
    let r = rng() * total;
    for (const x of list) {
        r -= weightOf(x);
        if (r <= 0) return x;
    }
    return list[list.length - 1];
}

const HOUR_WEIGHT = [0.35, 0.2, 0.12, 0.08, 0.1, 0.35, 0.8, 1.3, 1.2, 0.9, 0.85, 1.2, 1.4, 1.0, 0.8, 0.85, 1.0, 1.4, 1.6, 1.5, 1.2, 0.9, 0.7, 0.5];
const SALES_PER_HOUR = 5.5;

/* ម៉ោងលក់ចន្លោះ fromMs–toMs តាមទម្រង់ម៉ោងមមាញឹក (dayFactor៖ ចុងសប្តាហ៍ ឬថ្ងៃស្ងាត់) */
function genSaleTimes(rng, fromMs, toMs, dayFactor) {
    const times = [];
    const first = new Date(fromMs);
    first.setMinutes(0, 0, 0);
    for (let h = first.getTime(); h < toMs; h += 3600000) {
        const n = Math.round(HOUR_WEIGHT[new Date(h).getHours()] * SALES_PER_HOUR * (dayFactor || 1) * (0.7 + rng() * 0.6));
        for (let k = 0; k < n; k++) {
            const t = h + rng() * 3600000;
            if (t > fromMs && t < toMs) times.push(t);
        }
    }
    return times.sort((a, b) => a - b);
}

function genBasket(rng) {
    const lines = [];
    const br = rng();
    const n = br < 0.45 ? 1 : br < 0.75 ? 2 : br < 0.9 ? 3 : br < 0.97 ? 4 : 5;
    for (let k = 0; k < n; k++) {
        const p = pickWeighted(rng, PRODUCTS, x => PRODUCT_WEIGHT[x.sku] || 1); // ប្រវត្តិ៖ រួមទាំងទំនិញដែលផ្អាកលក់ពេលក្រោយ
        if (lines.some(l => l.sku === p.sku)) continue;
        const qr = rng();
        let qty = qr < 0.8 ? 1 : qr < 0.95 ? 2 : 3;
        if (p.category === 'stationery' && rng() < 0.25) qty = 2 + Math.floor(rng() * 9); // សិស្សទិញប៊ិច សៀវភៅ ជាឡូ
        lines.push({ sku: p.sku, qty, price: p.basePrice });
    }
    return lines;
}

/* របៀបបង់ប្រាក់៖ ដុល្លារ ~42% · រៀល ~25% · KHQR ~26% · ចម្រុះ ~7% */
function genPay(rng, due, rate) {
    const r = rng();
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

/* ===== ទិន្នន័យគំរូសម្រាប់ការបង្ហាញ =====
   ពេលបើកលើកដំបូង បង្កើតវេនដែលកំពុងបើកសម្រាប់អ្នកនៅបញ្ជរ POS-01 តាមកាលវិភាគ (ឬអ្នកដំបូងក្នុងវេន)
   រួមទាំងការលក់តាមម៉ោងមមាញឹកចាប់ពីបើកវេនដល់ឥឡូវ។ បើមុនម៉ោងវេនដំបូង ឬគ្មាននរណាក្នុងវេន
   គ្មានវេនបើកទេ ហើយផ្ទាំងគិតលុយនាំទៅទំព័របើកវេន។ */

function ensurePosSeed() {
    if (posRead(POS_KEYS.seed, null)) return;
    const now = new Date();
    const tpl = templateAt(now) || lastStartedTemplate(now);
    const crew = tpl ? rosterFor(templateDateFor(tpl, now), tpl.code) : [];
    const seats = tpl ? rosterSeats(templateDateFor(tpl, now), tpl.code) : [];
    const lead = seats.find(a => a.register === 'POS-01') || seats[0];
    if (tpl && lead) {
        const dateStr = templateDateFor(tpl, now);
        const rng = rngFor(`live|${dateStr}|${tpl.code}`);
        const openedAt = new Date(dateAt(dateStr, tpl.start).getTime() - (2 + Math.floor(rng() * 8)) * 60000);
        const rate = POS_SETTINGS_DEFAULTS.fxRate;
        const shift = {
            id: `SHIFT-${dateStr.replace(/-/g, '')}-${lead.register.replace('-', '')}-${tpl.code}`,
            date: dateStr,
            register: lead.register,
            cashierId: lead.cashierId,
            templateCode: tpl.code,
            templateName: tpl.name,
            start: tpl.start,
            end: tpl.end,
            openedAt: isoLocal(openedAt),
            fxRate: rate,
            floatUSD: 200,
            floatKHR: 400000,
            floatIssuedUSD: 200,
            floatIssuedKHR: 400000,
            floatApprovedBy: 'MGR-01',
            status: 'open'
        };
        // ការលក់ឈប់ត្រឹមម៉ោងបិទវេន ទោះហួសម៉ោងក៏ដោយ
        const endMs = Math.min(now.getTime() - 3 * 60000, shiftEndDate(shift).getTime());
        const dow = now.getDay();
        const times = genSaleTimes(rng, openedAt.getTime() + 4 * 60000, endMs, dow === 6 ? 1.15 : dow === 0 ? 1.1 : 1);
        const prefix = receiptPrefix(lead.register, now);
        const sales = times.map((t, i) => {
            const items = genBasket(rng);
            const due = saleTotals(items, 0).gross;
            const pay = genPay(rng, due, rate);
            const sale = {
                id: prefix + String(i + 1).padStart(4, '0'),
                time: isoLocal(new Date(t)),
                shiftId: shift.id,
                cashierId: lead.cashierId,
                register: lead.register,
                fxRate: rate,
                items,
                pay,
                discountPercent: 0,
                customerId: '',
                status: 'completed'
            };
            sale.change = splitChange(paidTotal(pay, rate) - due, rate, defaultChangeMode(pay));
            return sale;
        });
        posWrite(POS_KEYS.shifts, [shift]);
        posWrite(POS_KEYS.sales, sales);
        posWrite(POS_KEYS.movements, [{
            id: 'MV-SEED-FLOAT', type: 'float', register: lead.register, shiftId: shift.id,
            usd: 200, khr: 400000, reason: '', ref: '', createdBy: 'MGR-01', createdAt: shift.openedAt,
            status: 'confirmed', confirmedBy: lead.cashierId, confirmedAt: shift.openedAt
        }]);
    }
    posWrite(POS_KEYS.seed, { at: isoLocal(now) });
}

/* ប្រើដោយប៊ូតុង «កំណត់ទិន្នន័យគំរូឡើងវិញ» នៅទំព័រដើម */
function resetDemoData() {
    try {
        Object.keys(localStorage).filter(k => k.startsWith('pos_')).forEach(k => localStorage.removeItem(k));
        Object.keys(sessionStorage).filter(k => k.startsWith('pos_')).forEach(k => sessionStorage.removeItem(k));
    } catch (e) {
        // មិនអាចសម្អាត
    }
}

/* ===== ការចូលប្រើ =====
   ទំព័រដើម (index.html) ជាទំព័រចូលប្រើ៖ ជ្រើសរើសអ្នកប្រើ ហើយវាយលេខសម្ងាត់។
   អ្នកគ្រប់គ្រងអាចប្តូរទៅផ្ទាំងគិតលុយ ហើយលក់លើបញ្ជរផ្ទាល់ខ្លួន (POS-03)
   ព្រោះអ្នកគ្រប់គ្រងមិនអាចអនុម័តការលក់របស់ខ្លួនឯងបានទេ (ច្បាប់ M-RULE 3)។ */

const SESSION_KEY = 'pos_session';

function posSession() {
    const s = posRead(SESSION_KEY, null);
    if (!s || !s.userId) return null;
    const p = personById(s.userId);
    return p && p.active ? s : null;
}

function posLogin(userId) {
    posWrite(SESSION_KEY, { userId, at: isoLocal(new Date()) });
}

function posLogout() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* មិនអាចសម្អាត */ }
}

function isManagerId(id) {
    return MANAGERS.some(m => m.id === id);
}

function isAdminId(id) {
    return ADMINS.some(a => a.id === id);
}

function roleOf(id) {
    return isAdminId(id) ? 'admin' : isManagerId(id) ? 'manager' : 'cashier';
}

/* ទំព័រដើមរបស់តួនាទីនីមួយៗ (ពី src/) */
const ROLE_HOME = {
    admin: 'admin/dashboard/dashboard.html',
    manager: 'manager/dashboard/dashboard.html',
    cashier: 'cashier/terminal/pos-terminal.html'
};

/* ===== កាលវិភាគវេន =====
   កាលវិភាគកំណត់តែ «អ្នកណាធ្វើវេនណា» (អតិបរមា = ចំនួនបញ្ជរ)។ អ្នកគិតលុយជ្រើសបញ្ជរទំនេរណាមួយ
   ពេលបើកវេន ហើយបញ្ជរនោះជាប់នឹងគាត់រហូតដល់បិទវេន (មួយថត មួយអ្នកទទួលខុសត្រូវ — ស្រាវជ្រាវ §11)។
   អ្នកគ្រប់គ្រងអាចភ្ជាប់បុគ្គលិកម្នាក់ទៅបញ្ជរជាក់លាក់ (pin: true, register) ពេលចាំបាច់។ */

const ROSTER_KEY = 'pos_roster';

function rosterKey(dateStr, code) {
    return `${dateStr}|${code}`;
}

/* កាលវិភាគលំនាំដើមនៃថ្ងៃមួយ = បុគ្គលិកដែលមានវេនប្រចាំជាវេននេះ ហើយមិនមែនថ្ងៃឈប់ */
function defaultRoster(dateStr, code) {
    const dow = new Date(dateStr + 'T12:00').getDay();
    const defs = posSettings().staffDefaults || {};
    const owners = CASHIERS.concat(MANAGERS).filter(p => defs[p.id] && defs[p.id].template === code);
    const list = owners.filter(p => Number(defs[p.id].dayOff) !== dow)
        .map(p => ({ cashierId: p.id }));
    // ថ្ងៃឈប់សម្រាករបស់អ្នកគិតលុយ៖ អ្នកគ្រប់គ្រងឈរបញ្ជរជំនួស (ហាងតូចមិនទុកវេនទទេ)
    // ឆ្លាស់គ្នារវាងអ្នកគ្រប់គ្រង · ថ្ងៃមួយមានតែម្នាក់ជំនួស ដូច្នេះមិនលើស 12 ម៉ោង
    if (!list.length && owners.length && MANAGERS.length) {
        const off = owners[0];
        const day = Math.floor(new Date(dateStr + 'T12:00').getTime() / 86400000);
        list.push({ cashierId: MANAGERS[day % MANAGERS.length].id, cover: true });
    }
    return list;
}

/* បញ្ជរដើមរបស់បុគ្គលិក (តាមលំដាប់បុគ្គលិក) · ថេរ ដើម្បីឱ្យប្រវត្តិគំរូមិនផ្លាស់ប្តូរ */
function homeRegister(personId) {
    const i = CASHIERS.concat(MANAGERS).findIndex(p => p.id === personId);
    return REGISTERS[Math.max(0, i) % REGISTERS.length];
}

/* បញ្ជរដែលបុគ្គលិកប្រើជាធម្មតា៖ បញ្ជរចុងក្រោយដែលបានបើក បើគ្មាន បញ្ជរដើម */
function usualRegister(personId) {
    const last = posRead(POS_KEYS.shifts, []).filter(s => s.cashierId === personId)
        .sort((a, b) => b.openedAt.localeCompare(a.openedAt))[0];
    return last ? last.register : homeRegister(personId);
}

/* កន្លែងអង្គុយនៃវេនមួយ៖ ថតប្រាក់ដែលបើករួច → បញ្ជរដែលភ្ជាប់ → បញ្ជរធម្មតា → បញ្ជរទំនេរដំបូង
   ប្រើសម្រាប់ប្រវត្តិគំរូ និងការបង្ហាញ · កាលវិភាគខ្លួនឯងមិនរក្សាបញ្ជរទេ លើកលែងតែភ្ជាប់ */
function rosterSeats(dateStr, code) {
    const list = rosterFor(dateStr, code);
    const drawers = posRead(POS_KEYS.shifts, []).filter(s => s.date === dateStr && s.templateCode === code);
    const used = new Set();
    const seat = {};
    list.forEach(a => {
        const d = drawers.find(s => s.cashierId === a.cashierId);
        if (d) { seat[a.cashierId] = d.register; used.add(d.register); }
    });
    list.forEach(a => {
        if (!seat[a.cashierId] && a.pin && a.register && !used.has(a.register)) { seat[a.cashierId] = a.register; used.add(a.register); }
    });
    list.forEach(a => {
        if (seat[a.cashierId]) return;
        const u = homeRegister(a.cashierId);
        const r = !used.has(u) ? u : REGISTERS.find(x => !used.has(x));
        if (r) { seat[a.cashierId] = r; used.add(r); }
    });
    return list.filter(a => seat[a.cashierId]).map(a => Object.assign({}, a, { register: seat[a.cashierId] }));
}

/* ផ្លាស់បុគ្គលិកទៅវេនផ្សេងសម្រាប់ថ្ងៃមួយ (ជំនួសវេន)៖ ដកចេញពីវេនផ្សេងទៀតក្នុងថ្ងៃនោះ
   ហើយបន្ថែមទៅវេនថ្មី ជាមួយសញ្ញា cover ដើម្បីបង្ហាញថាមិនមែនវេនប្រចាំ
   pin = បញ្ជរភ្ជាប់ (មិនចាំបាច់) · meta.replace = អ្នកដែលត្រូវដកចេញ ពេលវេនពេញ */
function assignShift(dateStr, code, personId, pin, meta) {
    let movedFrom = '';
    shiftTemplates().forEach(t => {
        if (t.code === code) return;
        const list = rosterFor(dateStr, t.code);
        if (list.some(a => a.cashierId === personId)) {
            // P21: វេនដែលចាប់ផ្តើមរួច (កំពុងធ្វើ ឬជាប្រវត្តិ) មិនត្រូវដកចេញឡើយ · នេះជាវេនទ្វេ មិនមែនការផ្លាស់
            const hasDrawer = posRead(POS_KEYS.shifts, []).some(s => s.cashierId === personId && s.date === dateStr && s.templateCode === t.code);
            if (!hasDrawer && dateAt(dateStr, t.start) > new Date()) {
                saveRoster(dateStr, t.code, list.filter(a => a.cashierId !== personId));
                movedFrom = t.code;
            }
        }
    });
    const def = (posSettings().staffDefaults || {})[personId];
    const isDefault = def && def.template === code;
    const curList = rosterFor(dateStr, code);
    const replaced = meta && meta.replace && curList.some(a => a.cashierId === meta.replace && a.cashierId !== personId) ? meta.replace : '';
    // មួយបញ្ជរ មួយអ្នកក្នុងវេន៖ មិនអាចភ្ជាប់បញ្ជរដែលអ្នកផ្សេងកំពុងប្រើ ឬបានភ្ជាប់រួច (លើកលែងអ្នកដែលត្រូវជំនួស)
    const owner = pin ? rosterTakenRegisters(dateStr, code, personId)[pin] : '';
    if (owner && owner !== replaced) return { error: `${pin} ជារបស់ ${personName(owner)} ក្នុងវេននេះ` };
    const list = curList.filter(a => a.cashierId !== personId && a.cashierId !== replaced);
    const extra = Object.assign({}, meta || {});
    delete extra.replace;
    const entry = Object.assign({ cashierId: personId }, pin ? { register: pin, pin: true } : {}, isDefault ? {} : { cover: true }, extra, { at: isoLocal(new Date()) });
    list.push(entry);
    saveRoster(dateStr, code, list);
    const actorId = (meta && meta.by) || currentActorId();
    const tpl = shiftTemplates().find(t => t.code === code);
    logPosEvent('roster_assign', {
        date: dateStr,
        templateCode: code,
        templateName: tpl ? tpl.name : code,
        personId,
        register: pin || '',
        reason: (meta && meta.reason) || '',
        movedFrom,
        replaced,
        actorId
    });
    return { movedFrom, replaced };
}

function unassignShift(dateStr, code, personId, meta) {
    const list = rosterFor(dateStr, code).slice();
    const idx = list.findIndex(a => a.cashierId === personId);
    if (idx < 0) return null;
    const [removed] = list.splice(idx, 1);
    saveRoster(dateStr, code, list);
    const actorId = (meta && meta.by) || currentActorId();
    const tpl = shiftTemplates().find(t => t.code === code);
    logPosEvent('roster_remove', {
        date: dateStr,
        templateCode: code,
        templateName: tpl ? tpl.name : code,
        personId,
        register: removed.pin ? removed.register : '',
        actorId
    });
    return { removed };
}

function undoRosterAction(action) {
    if (!action) return;
    if (action.type === 'remove' && action.entry) {
        const list = rosterFor(action.date, action.code).slice();
        if (!list.some(a => a.cashierId === action.entry.cashierId)) {
            list.push(action.entry);
            saveRoster(action.date, action.code, list);
            logPosEvent('roster_undo', {
                date: action.date,
                templateCode: action.code,
                personId: action.entry.cashierId,
                note: `បានដាក់ ${personName(action.entry.cashierId)} ចូលកាលវិភាគវិញ`
            });
        }
    } else if (action.type === 'assign') {
        const list = rosterFor(action.date, action.code).filter(a => a.cashierId !== action.personId);
        if (action.replaced) {
            list.push({ cashierId: action.replaced, cover: true });
        }
        saveRoster(action.date, action.code, list);
        if (action.movedFrom) {
            const prevList = rosterFor(action.date, action.movedFrom).slice();
            if (!prevList.some(a => a.cashierId === action.personId)) {
                prevList.push({ cashierId: action.personId, cover: true });
                saveRoster(action.date, action.movedFrom, prevList);
            }
        }
        logPosEvent('roster_undo', {
            date: action.date,
            templateCode: action.code,
            personId: action.personId,
            note: `បានលុបចោលការចាត់តាំង ${personName(action.personId)}`
        });
    }
}

function rosterFor(dateStr, code) {
    const all = posRead(ROSTER_KEY, {});
    const k = rosterKey(dateStr, code);
    if (!Object.prototype.hasOwnProperty.call(all, k)) return defaultRoster(dateStr, code);
    // កាលវិភាគចាស់រក្សាបញ្ជរគ្រប់ធាតុ · ឥឡូវរក្សាតែបញ្ជរដែលភ្ជាប់
    return all[k].map(a => (a.register && !a.pin) ? Object.assign({}, a, { register: undefined }) : a);
}

/* បញ្ជរដែលជាប់ក្នុងវេនមួយ៖ ថតប្រាក់កំពុងបើកក្នុងវេននោះ ឬអ្នកដែលភ្ជាប់ · { register: personId }
   មួយបញ្ជរ មួយអ្នកក្នុងវេនមួយ */
function rosterTakenRegisters(dateStr, code, exceptPersonId) {
    const drawers = typeof mgrAllShifts === 'function' ? mgrAllShifts() : posRead(POS_KEYS.shifts, []);
    const taken = {};
    drawers.filter(s => s.status === 'open' && s.date === dateStr && s.templateCode === code && s.cashierId !== exceptPersonId)
        .forEach(s => { taken[s.register] = s.cashierId; });
    rosterFor(dateStr, code).filter(a => a.pin && a.register && a.cashierId !== exceptPersonId && !taken[a.register])
        .forEach(a => { taken[a.register] = a.cashierId; });
    return taken;
}

function isRosterFull(dateStr, code) {
    return rosterFor(dateStr, code).length >= REGISTERS.length;
}

function isRosterCustom(dateStr, code) {
    return Object.prototype.hasOwnProperty.call(posRead(ROSTER_KEY, {}), rosterKey(dateStr, code));
}

function saveRoster(dateStr, code, list) {
    const all = posRead(ROSTER_KEY, {});
    all[rosterKey(dateStr, code)] = list;
    posWrite(ROSTER_KEY, all);
}

/* វេនបច្ចុប្បន្ន ឬវេនបន្ទាប់ដែលត្រូវប្រើកាលវិភាគ */
function rosterSlotNow() {
    const now = new Date();
    const tpl = templateAt(now) || shiftTemplates().find(t => minutesOf(t.start) > now.getHours() * 60 + now.getMinutes()) || lastStartedTemplate(now) || shiftTemplates()[0];
    return tpl ? { date: templateDateFor(tpl, now), template: tpl } : null;
}

function assignmentFor(personId) {
    const slot = rosterSlotNow();
    if (!slot) return null;
    const a = rosterFor(slot.date, slot.template.code).find(x => x.cashierId === personId);
    return a ? Object.assign({ date: slot.date, template: slot.template }, a) : null;
}

/* បញ្ជររបស់អ្នកចូលប្រើ៖ ថតប្រាក់ដែលកំពុងបើកផ្ទាល់ខ្លួន → បញ្ជរដែលស្នើ (អ្នកគិតលុយអាចប្តូរនៅទំព័របើកវេន) */
function resolveRegister(personId) {
    const open = posRead(POS_KEYS.shifts, []).find(s => s.status === 'open' && s.cashierId === personId);
    if (open) return open.register;
    return suggestRegister(personId);
}

/* បញ្ជរដែលអាចបើកបាន = គ្មានថតប្រាក់កំពុងបើក */
function busyRegisters() {
    return posRead(POS_KEYS.shifts, []).filter(s => s.status === 'open');
}

/* បញ្ជរដែលស្នើ៖ បញ្ជរភ្ជាប់ → បញ្ជរធម្មតា → បញ្ជរទំនេរដែលអ្នកផ្សេងក្នុងវេនមិនភ្ជាប់ → បញ្ជរទំនេរដំបូង */
function suggestRegister(personId, dateStr, code) {
    const slot = dateStr ? { date: dateStr, template: { code } } : rosterSlotNow();
    const list = slot ? rosterFor(slot.date, slot.template.code) : [];
    const busy = busyRegisters().map(s => s.register);
    const free = r => r && !busy.includes(r);
    const mine = list.find(a => a.cashierId === personId);
    if (mine && mine.pin && free(mine.register)) return mine.register;
    const pinnedByOthers = list.filter(a => a.pin && a.cashierId !== personId).map(a => a.register);
    const u = usualRegister(personId);
    if (free(u) && !pinnedByOthers.includes(u)) return u;
    return REGISTERS.find(r => free(r) && !pinnedByOthers.includes(r))
        || REGISTERS.find(free) || REGISTERS[REGISTERS.length - 1];
}

const SESSION = posSession();
const ME_CASHIER = SESSION ? SESSION.userId : 'CAS-01';
// ម្ចាស់ហាងអាចមើលទំព័រអ្នកគ្រប់គ្រង ហើយសម្រេចក្នុងនាមខ្លួនឯង
const ME_MANAGER = SESSION && (isManagerId(SESSION.userId) || isAdminId(SESSION.userId)) ? SESSION.userId : 'MGR-01';
const MY_REGISTER = resolveRegister(ME_CASHIER);

/* ការពារទំព័រ៖ ទំព័រអ្នកគិតលុយ = អ្នកគិតលុយ ឬអ្នកគ្រប់គ្រង (ម្ចាស់ហាងមិនឈរបញ្ជរ)
   ទំព័រអ្នកគ្រប់គ្រង = អ្នកគ្រប់គ្រង ឬម្ចាស់ហាង · ទំព័រម្ចាស់ហាង = ម្ចាស់ហាងប៉ុណ្ណោះ */
(function guardPage() {
    const path = location.pathname;
    const area = path.includes('/cashier/') ? 'cashier' : path.includes('/manager/') ? 'manager' : path.includes('/admin/') ? 'admin' : '';
    if (!area) return;
    const role = SESSION ? roleOf(SESSION.userId) : '';
    if (area === 'cashier' && role === 'admin' && !path.includes('/display/')) {
        location.replace(`../../${ROLE_HOME.admin}`);
        return;
    }
    const ok = area === 'cashier' ? !!SESSION : area === 'manager' ? role === 'manager' || role === 'admin' : role === 'admin';
    if (!ok) location.replace(`../../index.html?next=${encodeURIComponent(path.split('/').slice(-3).join('/'))}`);
})();


ensurePosSeed();
stockOpeningAt();
