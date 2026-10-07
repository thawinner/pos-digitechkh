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

/* ===== ទិន្នន័យដាច់ដោយឡែកតាមហាង =====
   ហាងនីមួយៗមានការលក់ វេន ទំនិញ ស្តុក ការកំណត់ និងកំណត់ហេតុរបស់ខ្លួន (គ្រាប់ចុច pos_xxx@SHOP-NN)។
   ហាងគំរូ SHOP-01 ប្រើគ្រាប់ចុចដើម (pos_xxx) ដូច្នេះទិន្នន័យគំរូនៅដដែល · ហាងផ្សេងចាប់ផ្តើមទទេ (គ្មានទិន្នន័យគំរូ)។
   ទិន្នន័យរួមទូទាំងប្រព័ន្ធ (មិនបែងចែក)៖ គណនីមនុស្ស ពាក្យសម្ងាត់ លេខកូដ PIN វគ្គចូលប្រើ ឧបករណ៍ ហាង និងច្រកអ្នកគ្រប់គ្រងប្រព័ន្ធ។
   ហាងដែលកំពុងប្រើ = វគ្គចូលប្រើ → ឧបករណ៍បញ្ជរ → SHOP-01 (អានផ្ទាល់ ព្រោះ posRead ខ្លួនឯងត្រូវការវា)
   ប្រព័ន្ធពិត៖ ជួរ tenant_id លើគ្រប់តារាង */
const ACTIVE_SHOP_ID = (() => {
    try {
        const s = JSON.parse(localStorage.getItem('pos_session') || 'null');
        if (s && s.control) return 'SHOP-01';
        if (s && s.shopId) return s.shopId;
        const id = JSON.parse(localStorage.getItem('pos_device') || 'null');
        const dev = (JSON.parse(localStorage.getItem('pos_devices') || '[]') || []).find(d => d.id === id);
        return dev ? dev.shopId : 'SHOP-01';
    } catch (e) {
        return 'SHOP-01';
    }
})();
const IS_DEMO_SHOP = ACTIVE_SHOP_ID === 'SHOP-01';

/* សាខា៖ ហាងមួយមានសាខាច្រើន (BR-01 = សាខាដំបូង)។ ទំនិញ តម្លៃ ការកំណត់ បុគ្គលិក និងកំណត់ហេតុម្ចាស់ហាងរួមគ្នាទូទាំងហាង
   វេន ការលក់ បញ្ជរ ស្តុក ចលនាសាច់ប្រាក់ និងសំណើ ដាច់តាមសាខា (គ្រាប់ចុច pos_xxx@SHOP-NN#BR-NN · សាខាដំបូងគ្មាន #)
   សាខាដែលកំពុងប្រើ = វគ្គចូលប្រើ → ឧបករណ៍បញ្ជរ → BR-01 */
const ACTIVE_BRANCH_ID = (() => {
    try {
        // សង្ខេបសាខា (iframe លាក់នៅផ្ទាំងម្ចាស់ហាង)៖ អានសាខាផ្សេងដោយមិនប្តូរវគ្គចូលប្រើ
        const q = new URLSearchParams(location.search).get('summaryBranch');
        if (q && /\/admin\/branches\/branch-summary\.html$/.test(location.pathname)) return q;
        const s = JSON.parse(localStorage.getItem('pos_session') || 'null');
        if (s && s.control) return 'BR-01';
        if (s && s.branchId) return s.branchId;
        const id = JSON.parse(localStorage.getItem('pos_device') || 'null');
        const dev = (JSON.parse(localStorage.getItem('pos_devices') || '[]') || []).find(d => d.id === id);
        return dev && dev.shopId === ACTIVE_SHOP_ID && dev.branchId ? dev.branchId : 'BR-01';
    } catch (e) {
        return 'BR-01';
    }
})();
/* ទិន្នន័យគំរូ (ប្រវត្តិ 14 ថ្ងៃ វេនបើក ការលក់)៖ សាខាទាំងបីនៃ DIGITECHKH និងហាងកាហ្វេ
   តម្លៃ = ទំហំការលក់ និងស្តុកធៀបនឹងសាខាកណ្តាល · ហាង ឬសាខាផ្សេងទៀតចាប់ផ្តើមទទេ */
const DEMO_SCOPES = { 'SHOP-01|BR-01': 1, 'SHOP-01|BR-02': 0.6, 'SHOP-01|BR-03': 0.4, 'SHOP-02|BR-01': 0.8 };
const DEMO_SCALE = DEMO_SCOPES[`${ACTIVE_SHOP_ID}|${ACTIVE_BRANCH_ID}`] || 0;
const IS_DEMO_DATA = DEMO_SCALE > 0;
// គ្រាប់ពូជចៃដន្យដាច់តាមសាខា (សាខាកណ្តាលរក្សាប្រវត្តិដដែល)
const DEMO_SALT = ACTIVE_SHOP_ID === 'SHOP-01' && ACTIVE_BRANCH_ID === 'BR-01' ? '' : `|${ACTIVE_SHOP_ID}|${ACTIVE_BRANCH_ID}`;
const BRANCH_KEYS = ['pos_shifts', 'pos_shift_sales', 'pos_held_sales', 'pos_approvals', 'pos_cash_movements', 'pos_events',
    'pos_terminal_lock', 'pos_roster', 'pos_stock_opening', 'pos_stock_moves', 'pos_stock_counts', 'pos_stock_costs',
    'pos_overlay', 'pos_seed_v3', 'pos_mgr_seed_v2', 'pos_cfd', 'pos_new_shift_notice', 'pos_purchase_orders'];
const GLOBAL_KEYS = ['pos_session', 'pos_devices', 'pos_device', 'pos_device_seed', 'pos_login_guard', 'pos_last_login', 'pos_last_shop', 'pos_last_branch',
    'pos_staff', 'pos_pins', 'pos_passwords', 'pos_shop_profile', 'pos_shop_setup', 'pos_shops'];

function storeKey(key, branchId, shopId) {
    if (!key.startsWith('pos_') || key.startsWith('pos_ctl_') || GLOBAL_KEYS.includes(key)) return key;
    const shop = shopId || ACTIVE_SHOP_ID;
    const b = branchId || ACTIVE_BRANCH_ID;
    return key + (shop === 'SHOP-01' ? '' : `@${shop}`) + (BRANCH_KEYS.includes(key) && b !== 'BR-01' ? `#${b}` : '');
}

/* អានទិន្នន័យសាខាផ្សេង (ផ្ទាំងម្ចាស់ហាងប្រៀបធៀបសាខា) ឬហាងផ្សេង (ច្រកអ្នកគ្រប់គ្រងប្រព័ន្ធ រាប់ការប្រើប្រាស់) */
function posReadAt(key, fallback, branchId, shopId) {
    try {
        const raw = localStorage.getItem(storeKey(key, branchId, shopId));
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}

function posRead(key, fallback) {
    try {
        const raw = localStorage.getItem(storeKey(key));
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}

function posWrite(key, value) {
    try {
        localStorage.setItem(storeKey(key), JSON.stringify(value));
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

/* ===== ហាងច្រើនក្នុងប្រព័ន្ធតែមួយ (លក់ឱ្យហាងច្រើន) =====
   ប្រព័ន្ធពិត៖ pos_control រក្សាមនុស្ស (គណនីមួយក្នុងម្នាក់ · អ៊ីមែល និងលេខទូរស័ព្ទមិនជាន់គ្នាទូទាំងប្រព័ន្ធ)
   ដែលនីមួយៗជារបស់ហាងតែមួយ។ ម្ចាស់មានទីតាំងច្រើន = សាខាក្នុងហាងតែមួយ មិនមែនហាងទីពីរ។
   គំរូនេះមានទិន្នន័យតែមួយឈុត៖ ហាងទីពីរប្រើវេន ការលក់ និងស្តុកដូចហាងទីមួយ (ខុសតែឈ្មោះ និងសាខា)
   MERCHANT ប្តូរទៅជាហាងដែលកំពុងប្រើ (មើល CURRENT_SHOP_ID ខាងក្រោម) */
const SHOPS = [
    Object.assign({ id: 'SHOP-01' }, MERCHANT),
    { id: 'SHOP-02', nameKh: 'កាហ្វេ សុគន្ធា', name: 'SOKUNTHEA COFFEE', branch: 'សាខាបឹងកេងកង ភ្នំពេញ', tin: 'K001-907654321', phone: '023 777 666', account: 'sokuntheacoffee@aclb', city: 'PHNOM PENH' }
];

/* ហាងដែលអ្នកគ្រប់គ្រងប្រព័ន្ធបង្កើត (control-data.js ctlCreateCompany → pos_shops) */
(function addCreatedShops() {
    (posRead('pos_shops', []) || []).forEach(sh => { if (!SHOPS.some(x => x.id === sh.id)) SHOPS.push(Object.assign({}, sh)); });
})();

function shopById(id) {
    return SHOPS.find(s => s.id === id) || null;
}

/* ឡូហ្គោហាង៖ រូបដែលម្ចាស់ហាងផ្ទុកឡើង (data:… ក្នុង pos_shop_profile) · ឯកសារក្នុង shared/assets (ហាងគំរូ)
   · បើគ្មាន → អក្សរកាត់ពីឈ្មោះ KHQR លើផ្ទៃបៃតង ដូច្នេះហាងនីមួយៗមានរូបសម្គាល់ខ្លួនឯងជានិច្ច
   root = ផ្លូវទៅ src/ (data-role-root) */
function shopLogoSrc(shop, root) {
    shop = shop || {};
    if (shop.logo && shop.logo.startsWith('data:')) return shop.logo;
    if (shop.logo) return `${root || (document.body && document.body.dataset.roleRoot) || '.'}/${shop.logo}`;
    const words = String(shop.name || shop.nameKh || '?').trim().split(/\s+/);
    const letters = (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#047857"/><text x="32" y="41" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="700" fill="#fff">${letters.replace(/[<&>]/g, '')}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/* អានឡូហ្គោដែលម្ចាស់ហាងជ្រើស → រូបការ៉េ 160px (រក្សាសមាមាត្រ ផ្ទៃថ្លា) ជា data URL តូច
   ប្រព័ន្ធពិត៖ ផ្ញើទៅសេវាឯកសារ (file service) ហើយរក្សាតែតំណ */
function readLogoFile(file) {
    return new Promise((resolve, reject) => {
        if (!file || !/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) return reject('សូមជ្រើសឯកសាររូបភាព');
        if (file.size > 3 * 1024 * 1024) return reject('រូបភាពធំពេក · សូមជ្រើសរូបតូចជាង 3 មេកាបៃ');
        const reader = new FileReader();
        reader.onerror = () => reject('អានរូបភាពមិនបាន');
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject('អានរូបភាពមិនបាន');
            img.onload = () => {
                const S = 160, c = document.createElement('canvas');
                c.width = S; c.height = S;
                const k = Math.min(S / img.width, S / img.height);
                const w = img.width * k, h = img.height * k;
                c.getContext('2d').drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
                resolve(c.toDataURL('image/png'));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

/* ព័ត៌មានហាងដែលម្ចាស់ហាងបញ្ចូលនៅការរៀបចំហាង (pos_shop_profile) ឈ្នះលើតម្លៃគំរូ */
(function applyShopProfiles() {
    const prof = posRead('pos_shop_profile', {}) || {};
    SHOPS.forEach(sh => Object.assign(sh, prof[sh.id] || {}));
})();

function saveShopProfile(shopId, patch) {
    const all = posRead('pos_shop_profile', {}) || {};
    all[shopId] = Object.assign({}, all[shopId] || {}, patch);
    posWrite('pos_shop_profile', all);
}

/* ===== ការរៀបចំហាងលើកដំបូង (admin/setup/setup.html) =====
   ម្ចាស់ហាងនៃហាងថ្មីចូលលើកដំបូង → ជំនួយការរៀបចំ 3 ជំហាន (ហាង · ទទួលប្រាក់ · បញ្ជរ និងវេន)
   ទំព័រម្ចាស់ហាងផ្សេងទៀតបញ្ជូនមកទីនេះ រហូតដល់រួចរាល់ ឬជ្រើស «ធ្វើពេលក្រោយ» (ចងចាំក្នុងផ្ទាំងកម្មវិធីរុករកនេះ)
   ហាងចាស់ SHOP-01 រៀបចំរួចហើយ · SHOP-02 ជាហាងសាកល្បងថ្មី */
const SETUP_SEED = { 'SHOP-01': { done: true }, 'SHOP-02': { done: true, registers: 2, hours: 'day' } };

function shopSetup(shopId) {
    return (posRead('pos_shop_setup', {}) || {})[shopId] || SETUP_SEED[shopId] || { done: false };
}

function saveShopSetup(shopId, patch) {
    const all = posRead('pos_shop_setup', {}) || {};
    all[shopId] = Object.assign({}, shopSetup(shopId), patch);
    posWrite('pos_shop_setup', all);
}

/* ===== ចាប់ផ្តើមប្រើ (ម្ចាស់ហាង) =====
   ជំហានដែលហាងថ្មី ឬសាខាថ្មីត្រូវធ្វើមុនលក់បាន · ពិនិត្យដោយស្វ័យប្រវត្តិ (មិនមែនធីកដោយដៃ)
   href ទាក់ទងពីទំព័រក្នុង admin/* · លាក់បានក្រោយរួចរាល់ទាំងអស់ */
function startChecklist() {
    const dev = deviceList().some(d => d.shopId === ACTIVE_SHOP_ID && (d.branchId || 'BR-01') === ACTIVE_BRANCH_ID);
    return [
        { done: shopSetup(ACTIVE_SHOP_ID).done, icon: 'fa-store', title: 'ព័ត៌មានហាង', note: 'ឈ្មោះ ឡូហ្គោ គណនី KHQR និងម៉ោងបើក', href: '../setup/setup.html', action: 'រៀបចំហាង' },
        { done: PRODUCTS.length > 0, icon: 'fa-tags', title: 'បន្ថែមទំនិញ', note: 'ទំនិញ តម្លៃ និងលេខកូដ · ប្រើរួមគ្រប់សាខា', href: '../products/create-product.html', action: 'បន្ថែមទំនិញ' },
        { done: stockTracked(), icon: 'fa-boxes-stacked', title: 'ទទួលស្តុក', note: `ចំនួនទំនិញក្នុង${shopBranches().length > 1 ? ` ${branchName(ACTIVE_BRANCH_ID)}` : 'ហាង'}`, href: '../../manager/stock/create-stock-in.html', action: 'ទទួលស្តុក' },
        { done: CASHIERS.length > 0, icon: 'fa-user-plus', title: 'បន្ថែមអ្នកគិតលុយ', note: 'ម្នាក់មានលេខកូដ PIN ផ្ទាល់ខ្លួន', href: '../staff/staff.html', action: 'បន្ថែមបុគ្គលិក' },
        { done: dev, icon: 'fa-cash-register', title: 'ចុះឈ្មោះកុំព្យូទ័របញ្ជរ', note: 'ធ្វើលើកុំព្យូទ័រនៅបញ្ជរ · អ្នកគិតលុយចូលដោយ PIN', href: '../settings/settings.html?s=devices', action: 'ចុះឈ្មោះបញ្ជរ' },
        { done: liveSales().length > 0, icon: 'fa-receipt', title: 'លក់លើកដំបូង', note: 'អ្នកគិតលុយចូលដោយ PIN លើបញ្ជរ បើកវេន ហើយលក់', href: '', action: '' }
    ];
}

function checklistHidden() {
    return !!(posRead('pos_checklist_hidden', {}) || {})[ACTIVE_BRANCH_ID];
}

function hideChecklist() {
    const m = posRead('pos_checklist_hidden', {}) || {};
    m[ACTIVE_BRANCH_ID] = true;
    posWrite('pos_checklist_hidden', m);
}

function setupLater() {
    try { return sessionStorage.getItem('pos_setup_later') === '1'; } catch (e) { return false; }
}

/* ===== ការជាវរបស់ហាង =====
   DIGITECHKH គ្រប់គ្រងការជាវនៅច្រកអ្នកគ្រប់គ្រងប្រព័ន្ធ (control/* · control-data.js) ហើយសរសេរស្ថានភាពទៅ pos_ctl_status។
   ទំព័រហាងអានតែស្ថានភាពហាងខ្លួនឯង៖ ផ្អាក ឬផុតកំណត់ = ចូលប្រើមិនបាន · ជិតផុតកំណត់ = ម្ចាស់ហាងឃើញការជូនដំណឹង
   ហួសកំណត់បង់ = នៅប្រើបាន SUB_GRACE_DAYS ថ្ងៃទៀត មុនផុតកំណត់ (ប្រព័ន្ធពិត៖ ម៉ាស៊ីនមេបដិសេធ) */
const SUB_GRACE_DAYS = 7;
const SUB_WARN_DAYS = 7;

function addDaysIso(n, from) {
    const d = from ? new Date(from + 'T12:00') : new Date();
    d.setDate(d.getDate() + n);
    return isoDate(d);
}

function daysUntil(dateStr) {
    return Math.round((new Date(dateStr + 'T12:00') - new Date(isoDate(new Date()) + 'T12:00')) / 86400000);
}

/* limits = ដែនកំណត់កញ្ចប់ដែលហាងត្រូវដឹង (ច្រកអ្នកគ្រប់គ្រងប្រព័ន្ធសរសេរជាមួយស្ថានភាព) */
const DEFAULT_SHOP_SUBS = {
    'SHOP-01': { plan: 'multi', planName: 'ច្រើនសាខា', cycle: 'month', trial: false, endsOn: addDaysIso(23), suspended: false, limits: { registers: 10, staff: 50, branches: 3 } },
    'SHOP-02': { plan: 'standard', planName: 'ស្តង់ដារ', cycle: 'month', trial: false, endsOn: addDaysIso(12), suspended: false, limits: { registers: 3, staff: 15, branches: 1 } }
};

function shopLimits(shopId) {
    const sub = shopSubscription(shopId);
    return (sub && sub.limits) || { registers: 3, staff: 99, branches: 1 };
}

function shopSubscription(shopId) {
    return (posRead('pos_ctl_status', {}) || {})[shopId] || DEFAULT_SHOP_SUBS[shopId] || null;
}

/* active · trial · expiring (ជិតផុត) · overdue (ផុតហើយ តែក្នុងរយៈពេលអនុគ្រោះ) · expired · suspended */
function subscriptionStatus(sub) {
    if (!sub) return 'active';
    if (sub.suspended) return 'suspended';
    const left = daysUntil(sub.endsOn);
    if (sub.trial) return left < 0 ? 'expired' : 'trial';
    if (left < -SUB_GRACE_DAYS) return 'expired';
    if (left < 0) return 'overdue';
    return left <= SUB_WARN_DAYS ? 'expiring' : 'active';
}

/* ===== កញ្ចប់ និងការបង់ប្រាក់ជាមួយ DIGITECHKH (ម្ចាស់ហាងមើលនៅ admin/subscription) =====
   តម្លៃកញ្ចប់ និងការបង់ប្រាក់របស់ហាងខ្លួនឯង · ច្រកអ្នកគ្រប់គ្រងប្រព័ន្ធប្រើបញ្ជីកញ្ចប់ដដែល (control-data.js)
   ប្រព័ន្ធពិត៖ ម៉ាស៊ីនមេផ្តល់តែវិក្កយបត្ររបស់ហាងនេះ */
const SUB_PLANS_DEFAULT = [
    { id: 'basic', name: 'ចាប់ផ្តើម', price: 15, branches: 1, registers: 1, staff: 5, note: 'ហាងតូច បញ្ជរមួយ' },
    { id: 'standard', name: 'ស្តង់ដារ', price: 29, branches: 1, registers: 3, staff: 15, note: 'ហាងមធ្យម បញ្ជរច្រើន' },
    { id: 'multi', name: 'ច្រើនសាខា', price: 59, branches: 3, registers: 10, staff: 50, note: 'ហាងមានសាខាច្រើន' }
];
const PLAN_YEAR_MONTHS = 10;   // ប្រចាំឆ្នាំ = តម្លៃ 10 ខែ
/* គណនីទទួលប្រាក់របស់ DIGITECHKH (គំរូ) */
const VENDOR_PAY = { khqr: 'digitechkh@aclb', bank: 'ABA', account: '002 345 678', accountName: 'DIGITECHKH' };

function subPlans() {
    return posRead('pos_ctl_plans', SUB_PLANS_DEFAULT) || SUB_PLANS_DEFAULT;
}

function subPlan(id) {
    return subPlans().find(p => p.id === id) || subPlans()[0];
}

function subPrice(planId, months) {
    const p = subPlan(planId);
    return Math.floor(months / 12) * p.price * PLAN_YEAR_MONTHS + (months % 12) * p.price;
}

function shopSubPayments(shopId) {
    return (posRead('pos_ctl_payments', []) || []).filter(p => p.companyId === shopId).sort((a, b) => b.at.localeCompare(a.at));
}

/* សំណើពីម្ចាស់ហាងទៅ DIGITECHKH៖ claim = ខ្ញុំបានបង់ប្រាក់ (រង់ចាំផ្ទៀងផ្ទាត់) · plan = ស្នើប្តូរកញ្ចប់
   { id, shopId, type, status: pending|done|rejected, by, at, months, method, amount, ref, planId, note, doneAt, doneBy, answer } */
function subRequests(shopId) {
    return (posRead('pos_ctl_requests', []) || []).filter(r => !shopId || r.shopId === shopId).sort((a, b) => b.at.localeCompare(a.at));
}

function addSubRequest(req) {
    const list = posRead('pos_ctl_requests', []) || [];
    const r = Object.assign({ id: newId('RQ'), shopId: ACTIVE_SHOP_ID, status: 'pending', by: (posRead('pos_session', {}) || {}).userId || '', at: isoLocal(new Date()) }, req);
    list.push(r);
    posWrite('pos_ctl_requests', list);
    return r;
}

function shopBlocked(shopId) {
    const st = subscriptionStatus(shopSubscription(shopId));
    return st === 'suspended' || st === 'expired';
}

/* បុគ្គលិក៖ តួនាទី 3 — ម្ចាស់ហាង (admin) · អ្នកគ្រប់គ្រង (manager) · អ្នកគិតលុយ (cashier)
   លេខសម្ងាត់សម្រាប់គំរូសាកល្បងប៉ុណ្ណោះ — ប្រព័ន្ធពិតរក្សាទុកជាសញ្ញាកូដនៅម៉ាស៊ីនមេ។
   ម្ចាស់ហាងបន្ថែមបុគ្គលិក ប្តូរតួនាទី ឬផ្អាកគណនីនៅទំព័រ «បុគ្គលិក» (រក្សាក្នុង pos_staff)។
   គណនីដែលផ្អាកមិនអាចចូលប្រើបាន ប៉ុន្តែឈ្មោះនៅតែបង្ហាញក្នុងប្រវត្តិ (personById រកឃើញជានិច្ច)។ */
/* គណនីចូលប្រើ៖ អ៊ីមែល ឬលេខទូរស័ព្ទ + ពាក្យសម្ងាត់ (ទំព័រចូលប្រើ) · pin = លេខកូដ 6 ខ្ទង់សម្រាប់អនុម័ត និងដោះសោផ្ទាំងគិតលុយ */
const STAFF_SEED = [
    { id: 'CAS-01', name: 'ចន្ទ មករា', initials: 'ចម', pin: '111111', phone: '012 345 678', email: 'makara@digitechkh.com', password: 'makara2026', role: 'cashier' },
    { id: 'CAS-02', name: 'សុខ ដារ៉ា', initials: 'សដ', pin: '222222', phone: '098 765 432', email: 'dara@digitechkh.com', password: 'dara2026', role: 'cashier' },
    { id: 'CAS-03', name: 'លី សុភា', initials: 'លស', pin: '333333', phone: '015 888 999', email: 'sophea@digitechkh.com', password: 'sophea2026', role: 'cashier' },
    { id: 'CAS-04', name: 'ពេជ្រ សុវណ្ណារី', initials: 'ពស', pin: '444444', phone: '016 727 340', email: 'sovannary@digitechkh.com', password: 'sovannary2026', role: 'cashier' },
    { id: 'CAS-05', name: 'គឹម វិសាល', initials: 'គវ', pin: '555555', phone: '070 515 662', email: 'visal@digitechkh.com', password: 'visal2026', role: 'cashier' },
    { id: 'CAS-06', name: 'ឈឹម រតនា', initials: 'ឈរ', pin: '666666', phone: '096 330 184', email: 'ratana@digitechkh.com', password: 'ratana2026', role: 'cashier' },
    { id: 'MGR-01', name: 'សុខ វណ្ណា', initials: 'សវ', pin: '246810', phone: '077 222 333', email: 'vanna@digitechkh.com', password: 'vanna2026', role: 'manager' },
    { id: 'MGR-02', name: 'ម៉ៅ ស្រីនាង', initials: 'មស', pin: '135791', phone: '089 444 555', email: 'sreynang@digitechkh.com', password: 'sreynang2026', role: 'manager' },
    { id: 'MGR-03', name: 'នួន សុខលី', initials: 'នស', pin: '864201', phone: '011 606 275', email: 'sokly@digitechkh.com', password: 'sokly2026', role: 'manager' },
    { id: 'ADM-01', name: 'ហេង ចាន់ថា', initials: 'ហច', pin: '999999', phone: '012 999 000', email: 'chantha@digitechkh.com', password: 'chantha2026', role: 'admin' },
    // ម្ចាស់ហាងទីពីរ (ហាងថ្មីសាកល្បង) · ម្ចាស់ម្នាក់ = ហាងមួយ · ទីតាំងច្រើន = សាខា
    // DIGITECHKH សាខាទួលគោក (BR-02) និងសាខាសែនសុខ (BR-03)
    { id: 'MGR-04', name: 'ហ៊ុន សុផល', initials: 'ហស', pin: '242424', phone: '012 470 118', email: 'sophal@digitechkh.com', password: 'sophal2026', role: 'manager', branchId: 'BR-02' },
    { id: 'CAS-07', name: 'ស៊ាង ស្រីល័ក្ខ', initials: 'សស', pin: '121212', phone: '093 210 447', email: 'sreyleak@digitechkh.com', password: 'sreyleak2026', role: 'cashier', branchId: 'BR-02' },
    { id: 'CAS-08', name: 'ម៉ី ច័ន្ទរ៉ា', initials: 'មច', pin: '131313', phone: '097 556 120', email: 'chanra@digitechkh.com', password: 'chanra2026', role: 'cashier', branchId: 'BR-02' },
    { id: 'CAS-09', name: 'ឡុង សុខា', initials: 'ឡស', pin: '141414', phone: '010 338 905', email: 'sokha@digitechkh.com', password: 'sokha2026', role: 'cashier', branchId: 'BR-02' },
    { id: 'CAS-10', name: 'ទូច បញ្ញា', initials: 'ទប', pin: '151515', phone: '086 702 331', email: 'panha@digitechkh.com', password: 'panha2026', role: 'cashier', branchId: 'BR-02' },
    { id: 'MGR-05', name: 'កែវ ចិន្តា', initials: 'កច', pin: '252525', phone: '017 845 209', email: 'chenda@digitechkh.com', password: 'chenda2026', role: 'manager', branchId: 'BR-03' },
    { id: 'CAS-11', name: 'ផល ស្រីនិច', initials: 'ផស', pin: '161616', phone: '088 913 274', email: 'sreynich@digitechkh.com', password: 'sreynich2026', role: 'cashier', branchId: 'BR-03' },
    { id: 'CAS-12', name: 'រស់ វិចិត្រ', initials: 'រវ', pin: '171717', phone: '069 420 583', email: 'vichet@digitechkh.com', password: 'vichet2026', role: 'cashier', branchId: 'BR-03' },
    // ហាងទីពីរ «កាហ្វេ សុគន្ធា» · ម្ចាស់ម្នាក់ = ហាងមួយ · ទីតាំងច្រើន = សាខា
    { id: 'ADM-02', name: 'លឹម សុគន្ធា', initials: 'លស', pin: '777777', phone: '012 888 111', email: 'sokunthea@gmail.com', password: 'sokunthea2026', role: 'admin', shopId: 'SHOP-02' },
    { id: 'MGR-06', name: 'ចាន់ សុភ័ក្ត្រ', initials: 'ចស', pin: '262626', phone: '092 635 018', email: 'sopheak.coffee@gmail.com', password: 'sopheak2026', role: 'manager', shopId: 'SHOP-02' },
    { id: 'CAS-13', name: 'អ៊ុំ ស្រីពេជ្រ', initials: 'អស', pin: '181818', phone: '096 184 552', email: 'sreypich.coffee@gmail.com', password: 'sreypich2026', role: 'cashier', shopId: 'SHOP-02' },
    { id: 'CAS-14', name: 'សេង ពិសិដ្ឋ', initials: 'សព', pin: '191919', phone: '070 291 846', email: 'piseth.coffee@gmail.com', password: 'piseth2026', role: 'cashier', shopId: 'SHOP-02' },
    { id: 'CAS-15', name: 'ណុប ម៉ានិត', initials: 'ណម', pin: '202020', phone: '081 557 903', email: 'manith.coffee@gmail.com', password: 'manith2026', role: 'cashier', shopId: 'SHOP-02' }
];
const STAFF_KEY = 'pos_staff';

/* អ្នកគ្រប់គ្រងប្រព័ន្ធ (ក្រុម DIGITECHKH)៖ មិនមែនបុគ្គលិកហាង គ្មានសមាជិកភាពហាង · ចូលទៅច្រក control/* តែប៉ុណ្ណោះ
   មិនឃើញការលក់ ថ្លៃដើម ឬបុគ្គលិករបស់ហាង (មើល control-data.js) */
const CONTROL_ACCOUNTS = [
    { id: 'SA-01', name: 'ស៊ាន វិចិត្រ', initials: 'សវ', phone: '010 888 777', email: 'admin@digitechkh.com', password: 'control2026' }
];

function isControlId(id) {
    return CONTROL_ACCOUNTS.some(a => a.id === id);
}

function staffStore() {
    return posRead(STAFF_KEY, { added: [], changes: {} });
}

/* ហាងរបស់មនុស្សម្នាក់៖ គណនីមួយ = ហាងមួយ (p.shopId · គំរូ = SHOP-01) · ហាងមានទីតាំងច្រើន = សាខា មិនមែនហាងទីពីរ */
function personShopIds(p) {
    return [p.shopId || 'SHOP-01'];
}

/* បញ្ជីមនុស្សទាំងអស់ក្នុងប្រព័ន្ធ (ចូលប្រើ · លេខទូរស័ព្ទ និងអ៊ីមែលមិនជាន់គ្នា) */
function loadAllPeople() {
    const st = staffStore();
    return STAFF_SEED.concat(st.added || []).map(p => {
        const x = Object.assign({ active: true }, p, (st.changes || {})[p.id] || {});
        // បុគ្គលិកដែលបន្ថែមមុនពេលប្តូរទៅ 6 ខ្ទង់៖ បន្ថែមខ្ទង់ពីរដំបូងនៅខាងចុង (4821 → 482148)
        if (x.pin && !/^\d{6}$/.test(x.pin)) x.pin = (x.pin + x.pin).slice(0, 6);
        return x;
    });
}

/* បុគ្គលិករបស់ហាងដែលកំពុងប្រើ (ទំព័របុគ្គលិក ប្រាក់បៀវត្សរ៍ កាលវិភាគ) */
function loadStaff() {
    return loadAllPeople().filter(p => personShopIds(p).includes(ACTIVE_SHOP_ID));
}

/* ===== សាខា (pos_branches ក្នុងហាង) =====
   { id, name, address, phone, registers } · registers = ចំនួនបញ្ជរនៃសាខា
   លេខបញ្ជររត់ជាប់គ្នាទូទាំងហាង (សាខាទី 1 POS-01..03 · សាខាទី 2 POS-04..) ដូច្នេះលេខវិក្កយបត្រមិនជាន់គ្នារវាងសាខា
   មុនពេលម្ចាស់ហាងបន្ថែមសាខា មានតែសាខាដំបូងដែលយកពីព័ត៌មានហាង */
const BRANCHES_KEY = 'pos_branches';

function shopBranches(shopId) {
    const shop = shopId || ACTIVE_SHOP_ID;
    const list = shop === ACTIVE_SHOP_ID ? posRead(BRANCHES_KEY, null) : posReadAt(BRANCHES_KEY, null, 'BR-01', shop);
    if (list && list.length) return list;
    const sh = shopById(shop) || {};
    // ហាងគំរូ DIGITECHKH មានបីសាខា (កញ្ចប់ច្រើនសាខា · 6/10 បញ្ជរ)
    if (shop === 'SHOP-01') return [
        { id: 'BR-01', name: sh.branch || 'សាខាកណ្តាល ភ្នំពេញ', address: 'ផ្លូវ 271 សង្កាត់ទឹកថ្លា ខណ្ឌសែនសុខ', phone: sh.phone || '023 999 888', registers: 3 },
        { id: 'BR-02', name: 'សាខាទួលគោក', address: 'ផ្លូវ 516 សង្កាត់បឹងកក់ 1 ខណ្ឌទួលគោក', phone: '023 999 777', registers: 2, shiftCodes: ['A', 'B'] },
        { id: 'BR-03', name: 'សាខាសែនសុខ', address: 'ផ្លូវ 1986 សង្កាត់ភ្នំពេញថ្មី ខណ្ឌសែនសុខ', phone: '023 999 666', registers: 1, shiftCodes: ['A', 'B'] }
    ];
    return [{ id: 'BR-01', name: sh.branch || 'សាខាទី 1', address: '', phone: sh.phone || '',
        registers: shop === 'SHOP-01' ? 3 : Math.max(1, Math.min(shopLimits(shop).registers, shopSetup(shop).registers || 1)) }];
}

function saveBranches(list) {
    posWrite(BRANCHES_KEY, list);
}

function branchById(id) {
    return shopBranches().find(b => b.id === id) || null;
}

function branchName(id) {
    return (branchById(id || 'BR-01') || {}).name || '—';
}

function currentBranch() {
    return branchById(ACTIVE_BRANCH_ID) || shopBranches()[0];
}

/* បញ្ជរដែលធ្លាប់ប្រើក្នុងហាង (ដើម្បីកុំឱ្យលេខបញ្ជរសាខាថ្មីជាន់លេខចាស់) */
function branchRegisters(branchId) {
    const list = shopBranches();
    let offset = 0;
    for (const b of list) {
        const n = Math.max(1, Number(b.registers) || 1);
        if (b.id === branchId) return Array.from({ length: n }, (_, i) => `POS-${String(offset + i + 1).padStart(2, '0')}`);
        offset += n;
    }
    return ['POS-01'];
}

const ALL_STAFF = loadAllPeople();
const SHOP_STAFF = loadStaff();
/* បុគ្គលិកនៃសាខាដែលកំពុងប្រើ (p.branchId · គំរូ BR-01) · ម្ចាស់ហាងជាកម្មសិទ្ធិគ្រប់សាខា */
const BRANCH_STAFF = SHOP_STAFF.filter(p => p.role === 'admin' || (p.branchId || 'BR-01') === ACTIVE_BRANCH_ID);
const CASHIERS = BRANCH_STAFF.filter(p => p.active && p.role === 'cashier');
const MANAGERS = BRANCH_STAFF.filter(p => p.active && p.role === 'manager');
const ADMINS = SHOP_STAFF.filter(p => p.active && p.role === 'admin');

const REGISTERS = branchRegisters(ACTIVE_BRANCH_ID);
const ALL_REGISTERS = REGISTERS;


const ROLE_NAME = {
    cashier: 'អ្នកគិតលុយ',
    manager: 'អ្នកគ្រប់គ្រង',
    admin: 'ម្ចាស់ហាង'
};

function personById(id) {
    return ALL_STAFF.find(p => p.id === id) || CONTROL_ACCOUNTS.find(a => a.id === id) || null;
}

function personName(id) {
    const p = personById(id);
    return p ? p.name : '—';
}

/* សមាជិកភាព៖ ហាងតែមួយដែលគណនីនេះជាកម្មសិទ្ធិ ឬធ្វើការ */
function membershipsOf(personId) {
    const p = personById(personId);
    if (!p || !p.active || isControlId(personId)) return [];
    return [{ personId, shopId: p.shopId || 'SHOP-01', role: p.role }];
}

function isMemberOf(personId, shopId) {
    return membershipsOf(personId).some(m => m.shopId === shopId);
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
/* លេខសម្ងាត់ចាស់ 4 ខ្ទង់ដែលកំណត់មុនពេលប្តូរទៅ 6 ខ្ទង់ មិនប្រើទៀតទេ · ត្រឡប់ទៅលេខលំនាំដើម */
(function migratePins() {
    const custom = posRead('pos_pins', null);
    if (!custom) return;
    const kept = {};
    Object.keys(custom).forEach(id => { if (/^\d{6}$/.test(custom[id])) kept[id] = custom[id]; });
    if (Object.keys(kept).length !== Object.keys(custom).length) posWrite('pos_pins', kept);
})();

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
    const all = ALL_STAFF.concat(CONTROL_ACCOUNTS);
    if (q.includes('@')) return all.find(p => (p.email || '').toLowerCase() === q.toLowerCase()) || null;
    const d = normPhone(q);
    return d.length >= 9 ? all.find(p => p.phone && normPhone(p.phone) === d) || null : null;
}

/* ត្រឡប់ { person } ពេលត្រឹមត្រូវ · { error: 'bad' } មិនប្រាប់ថាខុសត្រង់ណា · { error: 'inactive' } គណនីផ្អាក */
/* ការចូលប្រើដោយពាក្យសម្ងាត់ · dev = បញ្ជរដែលបានចុះឈ្មោះលើកុំព្យូទ័រនេះ ឬ null
   អ្នកគ្រប់គ្រងប្រព័ន្ធ (DIGITECHKH) ចូលបានតែនៅទំព័រចូលទូទៅ (កុំព្យូទ័រមិនមែនបញ្ជរ)
   នៅទំព័រចូលរបស់ហាង (បញ្ជរ) គណនីនេះចាត់ទុកដូចពាក្យសម្ងាត់ខុស (មិនប្រាប់ថាមានគណនី) */
function verifyLogin(identifier, password, dev) {
    const p = findAccount(identifier);
    if (!p || !effectivePassword(p.id) || effectivePassword(p.id) !== String(password)) return { error: 'bad' };
    if (isControlId(p.id)) return dev ? { error: 'bad' } : { control: p };
    if (!p.active) return { error: 'inactive', person: p };
    return { person: p };
}

/* ការចូលប្រើតឹងរ៉ឹង (ពាក្យសម្ងាត់ និង PIN)៖
   · បញ្ជរដែលបានចុះឈ្មោះ = ទំព័រចូលរបស់ហាងមួយ៖ តែបុគ្គលិកនៃហាង និងសាខានោះ ឬម្ចាស់ហាង
   · ឧបករណ៍ផ្សេង៖ អ្នកគ្រប់គ្រង និងម្ចាស់ហាងចូលបាន · អ្នកគិតលុយលក់តែលើបញ្ជររបស់ហាង
   លទ្ធផល៖ '' = អនុញ្ញាត · shop · branch · till */
function loginBlockReason(p, dev) {
    if (!p || isControlId(p.id)) return 'shop';
    if (dev) {
        if (dev.shopId !== (p.shopId || 'SHOP-01')) return 'shop';
        if (p.role !== 'admin' && (p.branchId || 'BR-01') !== (dev.branchId || 'BR-01')) return 'branch';
        return '';
    }
    return p.role === 'cashier' ? 'till' : '';
}

function isManagerPage() {
    return !!document.body && (document.body.id === 'managerPortal' || document.body.id === 'adminPortal');
}

function currentActorId() {
    return isManagerPage() ? ME_MANAGER : ME_CASHIER;
}

/* ===== ការកំណត់ (អ្នកគ្រប់គ្រងកែប្រែនៅទំព័រការកំណត់ — ឯកសាររចនាលេខ 02 ផ្នែក 5.7) ===== */

/* ធនាគារនៅកម្ពុជាដែលភ្ជាប់បាគង (កូដ KHQR មួយ អតិថិជនស្កេនពីកម្មវិធីធនាគារណាក៏បាន)
   ហាងជ្រើសគណនីទទួលប្រាក់នៅការកំណត់ → អ្នកគិតលុយជ្រើសធនាគារពេលបង្ហាញកូដ · ការលក់រក្សា pay.bank
   short = អក្សរកាត់ (ពេលគ្មានឡូហ្គោ) · logo = រូបការ៉េក្នុង shared/assets · ការលក់ចាស់គ្មាន bank → «បាគង» */
const PAY_BANKS = {
    aba: { name: 'ABA', short: 'ABA', logo: 'shared/assets/ABA.png' },
    acleda: { name: 'ACLEDA', short: 'AC', logo: 'shared/assets/AC.png' },
    wing: { name: 'Wing', short: 'W' },
    canadia: { name: 'Canadia', short: 'CB' },
    prince: { name: 'Prince', short: 'PB' },
    sathapana: { name: 'Sathapana', short: 'SB' },
    chipmong: { name: 'Chip Mong', short: 'CM' }
};

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
    /* គណនីធនាគារដែលហាងទទួលប្រាក់តាមកូដស្កេន KHQR (លំដាប់ = លំដាប់នៅបញ្ជរ) · account = លេខសម្គាល់បាគង */
    payBanks: [
        { id: 'aba', account: 'digitechkh@abaa', on: true },
        { id: 'acleda', account: 'digitechkh@aclb', on: true },
        { id: 'wing', account: '', on: false },
        { id: 'canadia', account: '', on: false },
        { id: 'prince', account: '', on: false },
        { id: 'sathapana', account: '', on: false },
        { id: 'chipmong', account: '', on: false }
    ],
    /* សារនៅអេក្រង់អតិថិជនពេលគ្មានការលក់ (អតិបរមា 5) · icon៖ fa-tag fa-qrcode fa-money-bill-wave fa-receipt */
    cfdMessages: [
        { icon: 'fa-money-bill-wave', text: 'ទទួលសាច់ប្រាក់ជាដុល្លារ និងរៀល', on: true },
        { icon: 'fa-qrcode', text: 'ទូទាត់ងាយស្រួលដោយស្កេនបាគង', on: true },
        { icon: 'fa-receipt', text: 'សូមទទួលវិក្កយបត្រគ្រប់ពេលទិញទំនិញ', on: true }
    ],
    discountLimits: { 'CAS-01': 5, 'CAS-02': 5, 'CAS-03': 3, 'CAS-04': 5, 'CAS-05': 3, 'CAS-06': 3, 'CAS-07': 5, 'CAS-08': 3, 'CAS-09': 3, 'CAS-10': 3, 'CAS-11': 5, 'CAS-12': 3 },
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
       វេនយប់ (22:00–05:00 ជាម៉ោងយប់) ត្រូវបង់ប្រាក់ឈ្នួល 130% · ម៉ោងបន្ថែមពេលយប់ 200% (ប្រកាសលេខ 80 ឆ្នាំ 1999) */
    staffDefaults: {
        'CAS-01': { template: 'A', dayOff: 0 },
        'CAS-02': { template: 'B', dayOff: 1 },
        'CAS-03': { template: 'C', dayOff: 2 },
        'CAS-04': { template: 'B', dayOff: 4 },
        'CAS-05': { template: 'A', dayOff: 3 },
        'CAS-06': { template: 'C', dayOff: 2 },
        'MGR-01': { template: '', dayOff: 6 },
        'MGR-02': { template: '', dayOff: 0 },
        'MGR-03': { template: '', dayOff: 3 },
        // សាខាទួលគោក និងសែនសុខ បើក 06:00–22:00 (គ្មានវេនយប់)
        'CAS-07': { template: 'A', dayOff: 1 },
        'CAS-08': { template: 'A', dayOff: 4 },
        'CAS-09': { template: 'B', dayOff: 2 },
        'CAS-10': { template: 'B', dayOff: 5 },
        'MGR-04': { template: '', dayOff: 0 },
        'CAS-11': { template: 'A', dayOff: 0 },
        'CAS-12': { template: 'B', dayOff: 3 },
        'MGR-05': { template: '', dayOff: 6 }
    }
};

/* ការកំណត់គំរូរបស់ហាងផ្សេង (ជំនួសតម្លៃលំនាំដើមខាងលើ) · ហាងកាហ្វេបើក 06:00–21:00 ពីរវេន */
const SHOP_SETTINGS_SEED = {
    'SHOP-02': {
        fxRate: 4100,
        payBanks: [{ id: 'aba', account: 'sokuntheacoffee@aba', on: true }, { id: 'acleda', account: 'sokuntheacoffee@aclb', on: true }],
        shiftTemplates: [
            { code: 'A', name: 'វេនព្រឹក', start: '06:00', end: '14:00' },
            { code: 'B', name: 'វេនល្ងាច', start: '14:00', end: '21:00' }
        ],
        staffDefaults: {
            'CAS-13': { template: 'A', dayOff: 1 },
            'CAS-14': { template: 'A', dayOff: 4 },
            'CAS-15': { template: 'B', dayOff: 2 },
            'MGR-06': { template: '', dayOff: 0 }
        },
        discountLimits: { 'CAS-13': 5, 'CAS-14': 3, 'CAS-15': 3 },
        quickKeys: ['1001', '1004', '1002', '1101', '1201', '1301'],
        cfdMessages: [
            { icon: 'fa-mug-hot', text: 'សូមស្វាគមន៍មកកាន់ កាហ្វេ សុគន្ធា', on: true },
            { icon: 'fa-qrcode', text: 'ទូទាត់ងាយស្រួលដោយស្កេនបាគង', on: true },
            { icon: 'fa-tag', text: 'ទិញ 10 កែវ ថែម 1 កែវ', on: true }
        ]
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
    payBanks: 'ធនាគារទទួលប្រាក់',
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
    const defaults = clone(POS_SETTINGS_DEFAULTS);
    // ហាងថ្មី៖ គ្មានគណនីធនាគាររបស់ហាងគំរូ · គ្មានវេនប្រចាំរបស់បុគ្គលិកគំរូ (បំពេញនៅការរៀបចំហាង)
    if (!IS_DEMO_SHOP) {
        defaults.payBanks = defaults.payBanks.map(b => Object.assign(b, { account: '', on: false }));
        defaults.staffDefaults = {};
        defaults.discountLimits = {};
        Object.assign(defaults, clone(SHOP_SETTINGS_SEED[ACTIVE_SHOP_ID] || {}));
    }
    const base = IS_DEMO_SHOP ? POS_SETTINGS_DEFAULTS : (SHOP_SETTINGS_SEED[ACTIVE_SHOP_ID] || {});
    const s = Object.assign(defaults, (stored && stored.values) || {});
    if (!s.reasons) s.reasons = clone(POS_SETTINGS_DEFAULTS.reasons);
    if (!s.reasons.cover) s.reasons.cover = clone(POS_SETTINGS_DEFAULTS.reasons.cover);
    if (!s.shiftCodeSeq) s.shiftCodeSeq = 4;
    // ការកំណត់ដែលរក្សាទុកមុនពេលបន្ថែមបុគ្គលិកថ្មី៖ បុគ្គលិកដែលមិនទាន់មានក្នុងនោះប្រើតម្លៃលំនាំដើម
    s.staffDefaults = Object.assign(clone(base.staffDefaults || {}), s.staffDefaults || {});
    s.discountLimits = Object.assign(clone(base.discountLimits || {}), s.discountLimits || {});
    // ធនាគារដែលបន្ថែមក្នុងបញ្ជីក្រោយពេលរក្សាទុក → បិទជាលំនាំដើម
    const banks = (s.payBanks || []).filter(b => PAY_BANKS[b.id]);
    Object.keys(PAY_BANKS).forEach(id => { if (!banks.some(b => b.id === id)) banks.push({ id, account: '', on: false }); });
    s.payBanks = banks;
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

/* វេនដែលសាខានេះប្រើ៖ វេនទូទាំងហាង ឬតែវេនក្នុង branch.shiftCodes (ឧ. សាខាបិទពេលយប់) */
function shiftTemplates() {
    const all = posSettings().shiftTemplates || [];
    const b = currentBranch();
    const codes = b && b.shiftCodes;
    return codes && codes.length ? all.filter(t => codes.includes(t.code)) : all;
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
/* ទំនិញគំរូ (ប្រើសម្រាប់អ្នកផ្គត់ផ្គង់គំរូ) — រក្សាទុកមុនពេលហាងថ្មីសម្អាតបញ្ជីទំនិញគំរូ */
const PRODUCTS_SEED_SKUS = PRODUCTS.map(p => ({ sku: p.sku, cat: p.category }));
const CATALOG_KEY = 'pos_catalog';
const PRODUCTS_KEY = 'pos_products';

/* ហាងគំរូទីពីរ «កាហ្វេ សុគន្ធា»៖ ប្រភេទ និងមុខទំនិញផ្ទាល់ខ្លួន (ភេសជ្ជៈឆុង រាប់ជាកែវ) */
const SHOP_CATALOG_SEED = {
    'SHOP-02': {
        categories: [
            { id: 'coffee', label: 'កាហ្វេ', icon: 'fa-mug-hot' },
            { id: 'tea', label: 'តែ និងភេសជ្ជៈ', icon: 'fa-leaf' },
            { id: 'bakery', label: 'នំ', icon: 'fa-bread-slice' },
            { id: 'bottle', label: 'ភេសជ្ជៈដប', icon: 'fa-bottle-water' }
        ],
        products: [
            ['1001', 'កាហ្វេទឹកដោះគោទឹកកក', 'coffee', 1.75, 'កែវ', 300, 10, 'កាហ្វេដោះគោ', 0.55],
            ['1002', 'កាហ្វេខ្មៅទឹកកក', 'coffee', 1.25, 'កែវ', 200, 6, 'កាហ្វេខ្មៅ', 0.35],
            ['1003', 'អាមេរិកាណូ', 'coffee', 1.75, 'កែវ', 150, 4, 'អាមេរិកាណូ', 0.45],
            ['1004', 'ឡាតេទឹកកក', 'coffee', 2.25, 'កែវ', 220, 7, 'ឡាតេ', 0.75],
            ['1005', 'កាពូឈីណូក្តៅ', 'coffee', 2.25, 'កែវ', 100, 3, 'កាពូឈីណូ', 0.70],
            ['1006', 'ម៉ូកាទឹកកក', 'coffee', 2.50, 'កែវ', 100, 3, 'ម៉ូកា', 0.85],
            ['1007', 'ការ៉ាមែលម៉ាគីយ៉ាតូ', 'coffee', 2.75, 'កែវ', 80, 2, 'ការ៉ាមែល', 0.95],
            ['1101', 'តែបៃតងទឹកដោះគោទឹកកក', 'tea', 2.00, 'កែវ', 160, 5, 'តែបៃតង', 0.65],
            ['1102', 'តែក្រូចឆ្មាទឹកកក', 'tea', 1.50, 'កែវ', 100, 3, 'តែក្រូចឆ្មា', 0.40],
            ['1103', 'សូកូឡាទឹកកក', 'tea', 2.25, 'កែវ', 100, 3, 'សូកូឡា', 0.75],
            ['1104', 'តែទឹកដោះគោគុជ', 'tea', 2.25, 'កែវ', 130, 4, 'តែគុជ', 0.70],
            ['1105', 'ទឹកក្រូចច្របាច់', 'tea', 2.00, 'កែវ', 60, 2, 'ទឹកក្រូច', 0.80],
            ['1201', 'នំក្រូសង់', 'bakery', 1.50, 'ដុំ', 30, 4, 'ក្រូសង់', 0.70],
            ['1202', 'នំបុ័ងសាច់ក្រក', 'bakery', 1.75, 'ដុំ', 20, 2.5, 'នំបុ័ង', 0.85],
            ['1203', 'នំខេកសូកូឡា', 'bakery', 2.50, 'ចំណិត', 16, 1.5, 'នំខេក', 1.10],
            ['1204', 'នំម៉ាហ្វីនប្លូបឺរី', 'bakery', 1.25, 'ដុំ', 18, 2, 'ម៉ាហ្វីន', 0.55],
            ['1205', 'នំខូឃីសូកូឡា', 'bakery', 0.75, 'ដុំ', 40, 2, 'ខូឃី', 0.30],
            ['1301', 'ទឹកសុទ្ធ 500 មីលីលីត្រ', 'bottle', 0.50, 'ដប', 96, 3, 'ទឹកសុទ្ធ', 0.25],
            ['1302', 'ទឹកដូងស្រស់', 'bottle', 1.25, 'ផ្លែ', 24, 1, 'ទឹកដូង', 0.70]
        ]
    }
};
const SHOP_CATALOG = SHOP_CATALOG_SEED[ACTIVE_SHOP_ID] || null;
// ថ្លៃដើមគំរូរបស់ហាងនេះ (admin-data.js បញ្ចូលទៅក្នុង COST_SEED)
const SHOP_COST_SEED = {};
if (SHOP_CATALOG) {
    CATEGORIES.splice(1, CATEGORIES.length - 1, ...SHOP_CATALOG.categories);
    SHOP_CATALOG.products.forEach(([sku, name, category, price, unit, opening, weight, short, cost]) => {
        PRODUCT_WEIGHT[sku] = weight;
        SHOP_COST_SEED[sku] = cost;
    });
}

(function loadShopProducts() {
    if (!IS_DEMO_SHOP) PRODUCTS.length = 0;
    if (SHOP_CATALOG) SHOP_CATALOG.products.forEach(([sku, name, category, price, unit, opening]) =>
        PRODUCTS.push({ sku, barcode: sku, name, category, price, unit, opening }));
    (posRead(PRODUCTS_KEY, []) || []).forEach(p => PRODUCTS.push(Object.assign({}, p)));
})();
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
const CATEGORY_TILE = { drink: '#3f6f8f', snack: '#9a6a3a', household: '#4f7a68', stationery: '#5a6690', electronic: '#7a5f80',
    coffee: '#6b4f3a', tea: '#4f7a68', bakery: '#9a6a3a', bottle: '#3f6f8f' };
if (SHOP_CATALOG) SHOP_CATALOG.products.forEach(x => { PRODUCT_SHORT[x[0]] = x[7]; });

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
                  style="background:${CATEGORY_TILE[p.category] || '#737373'};font-size:clamp(9px,17cqmin,22px)">${label}</span>
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

function bankName(id) {
    return PAY_BANKS[id] ? PAY_BANKS[id].name : 'បាគង';
}

/* ឡូហ្គោធនាគារ (ឬអក្សរកាត់ពេលគ្មានរូប) · size = ថ្នាក់ទំហំ · tile = ថ្នាក់ប្រអប់អក្សរកាត់តាមផ្ទៃ */
function bankMark(id, size, tile) {
    const b = PAY_BANKS[id];
    const sz = size || 'w-9 h-9';
    if (b && b.logo) {
        const root = (document.body && document.body.dataset.roleRoot) || '.';
        return `<img src="${root}/${b.logo}" alt="${b.name}" class="${sz} rounded-lg object-cover flex-shrink-0">`;
    }
    return `<span class="${sz} rounded-lg border ${tile || 'border-slate-200 bg-slate-50 text-slate-600'} text-[12px] font-bold flex items-center justify-center flex-shrink-0">${b ? b.short : 'KH'}</span>`;
}

/* គណនីដែលបើក និងមានលេខសម្គាល់ — បញ្ជីទទេ = ហាងមិនទទួលកូដស្កេន */
function activePayBanks() {
    return posSettings().payBanks.filter(b => b.on && String(b.account || '').trim());
}

function payBankAccount(id) {
    const b = posSettings().payBanks.find(x => x.id === id);
    return (b && b.account) || MERCHANT.account;
}

/* «ស្កេនកូដ ABA» · ការលក់ចាស់គ្មានធនាគារ → «ស្កេនកូដបាគង» */
function khqrLabel(pay) {
    return pay && PAY_BANKS[pay.bank] ? `ស្កេនកូដ ${PAY_BANKS[pay.bank].name}` : PAY_LABEL.khqr;
}

/* សរុបតាមធនាគារពី summary.byBank (ឬ aggregate ដែលមាន byBank ដូចគ្នា) តាមលំដាប់ធនាគារ */
function bankLines(sum) {
    const by = (sum && sum.byBank) || {};
    const order = Object.keys(PAY_BANKS).concat(['']);
    return Object.keys(by).sort((x, y) => order.indexOf(x) - order.indexOf(y))
        .map(id => ({ id, label: khqrLabel({ bank: id }), amount: by[id].amount, count: by[id].count }));
}

function payMethodLabel(pay) {
    const parts = ['usdCash', 'khrCash', 'khqr'].filter(k => pay[k] > 0).map(k => k === 'khqr' ? khqrLabel(pay) : PAY_LABEL[k]);
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

/* សារលទ្ធផលបន្ទាប់ពីទំព័រទម្រង់រក្សាទុក ហើយត្រឡប់ទៅបញ្ជី (បង្ហាញម្តងនៅទំព័របន្ទាប់) */
function flashToast(msg) {
    try { sessionStorage.setItem('pos_flash', msg); } catch (e) { /* មិនអាចរក្សាទុក */ }
}
document.addEventListener('DOMContentLoaded', () => {
    let msg = '';
    try { msg = sessionStorage.getItem('pos_flash') || ''; sessionStorage.removeItem('pos_flash'); } catch (e) { return; }
    if (msg && typeof showToast === 'function') setTimeout(() => showToast(msg, 'success'), 300);
});

function findLiveSale(id) {
    return liveSales().find(s => s.id === id) || null;
}

/* ===== ប្រគល់ទំនិញពីវេនមុន (សម្រេច D3) =====
   អ្នកគិតលុយមិនអាចរុករកវេនមុនបានទេ៖ ត្រូវវាយលេខវិក្កយបត្រពេញលេញ ហើយប្រព័ន្ធផ្តល់តែវិក្កយបត្រមួយនោះ
   អ្នកគ្រប់គ្រងត្រូវអនុម័តជានិច្ច · ប្រាក់សងចេញពីថតនៃវេនបច្ចុប្បន្ន · ក្នុងរយៈ RETURN_WINDOW_DAYS ថ្ងៃ
   ប្រព័ន្ធពិត៖ ម៉ាស៊ីនមេស្វែងរកតាមលេខពិតប្រាកដ (គំរូនេះរកបានតែការលក់ដែលកត់ត្រាលើកម្មវិធីរុករកនេះ) */
const RETURN_WINDOW_DAYS = 7;

function normReceiptNo(q) {
    let v = String(q || '').toUpperCase().replace(/\s+/g, '');
    if (v && !v.startsWith('RCP-')) v = 'RCP-' + v;
    return v;
}

function findSaleByReceipt(q) {
    const no = normReceiptNo(q);
    return no.length >= 14 ? findLiveSale(no) : null;
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
            reason: req.reason, approvedBy: approverId, at, restock: req.restock !== false,
            // វេនដែលចេញប្រាក់សង (វេនបច្ចុប្បន្ន) · ប្រគល់ពីវេនមុន = មិនមែនវេននៃវិក្កយបត្រ
            shiftId: req.shiftId || sale.shiftId, register: req.register || sale.register
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
        try { localStorage.removeItem(storeKey(POS_KEYS.lock)); } catch (e) { /* មិនអាចសម្អាត */ }
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
        byBank: {},
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
        if (s.pay.khqr > 0.005) {
            acc.khqrCount += 1;
            const b = acc.byBank[s.pay.bank || ''] || (acc.byBank[s.pay.bank || ''] = { amount: 0, count: 0 });
            b.amount += s.pay.khqr;
            b.count += 1;
        }
        if (t.discount > 0.005) acc.discountCount += 1;
        if (s.discountApproverId) acc.overrideCount += 1;
        const ch = saleChange(s);
        acc.changeUSD += ch.usd;
        acc.changeKHR += ch.khr;
        acc.roundingKHR += ch.roundingKHR || 0;
        (s.returns || []).filter(r => !shift || (r.shiftId || s.shiftId) === shift.id).forEach(addReturn);
    });
    // ប្រគល់ទំនិញពីវេនមុនដែលវេននេះចេញប្រាក់សង (ប្រាក់ចេញពីថតនេះ មិនមែនពីថតនៃវិក្កយបត្រ)
    if (shift) liveSales().filter(x => x.shiftId !== shift.id).forEach(x => (x.returns || []).filter(r => r.shiftId === shift.id).forEach(addReturn));
    function addReturn(r) {
        acc.returnCount += 1;
        acc.returnAmount += r.amount;
        if (r.method === 'usdCash') acc.refundUSD += r.amount;
        else if (r.method === 'khrCash') acc.refundKHR += r.amountKHR || 0;
        else acc.refundKHQR += r.amount;
    }
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
    count: { label: 'រាប់ស្តុក', icon: 'fa-clipboard-check', tone: 'slate' },
    transfer_out: { label: 'ផ្ទេរទៅសាខា', icon: 'fa-right-from-bracket', tone: 'slate' },
    transfer_in: { label: 'ទទួលពីសាខា', icon: 'fa-right-to-bracket', tone: 'slate' }
};

/* ===== ផ្ទេរស្តុករវាងសាខា (pos_transfers · រួមទូទាំងហាង ដូច្នេះសាខាទាំងពីរឃើញ) =====
   ផ្ញើ៖ ស្តុកចេញពីសាខាផ្ញើភ្លាម (transfer_out) · ទទួល៖ អ្នកគ្រប់គ្រងសាខាទទួលរាប់ ហើយបញ្ជាក់
   មានតែចំនួនដែលទទួលពិតប្រាកដចូលស្តុក (transfer_in) · ខ្វះ = កត់លើការផ្ទេរ (បាត់ ឬខូចតាមផ្លូវ)
   { id, from, to, lines: [{ sku, qty, received }], status: sent|received, note, sentBy, sentAt, receivedBy, receivedAt, receiveNote } */
const TRANSFERS_KEY = 'pos_transfers';

function shopTransfers() {
    return (posRead(TRANSFERS_KEY, []) || []).slice().sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

function transferById(id) {
    return shopTransfers().find(t => t.id === id) || null;
}

function incomingTransfers() {
    return shopTransfers().filter(t => t.to === ACTIVE_BRANCH_ID && t.status === 'sent');
}

function sendTransfer(to, lines, note) {
    const list = posRead(TRANSFERS_KEY, []) || [];
    const d = isoDate(new Date()).replace(/-/g, '').slice(2);
    const seq = list.filter(t => t.id.includes(d)).length + 1;
    const t = { id: `TR-${d}-${pad2(seq)}`, from: ACTIVE_BRANCH_ID, to, lines: lines.map(l => ({ sku: l.sku, qty: Number(l.qty) })),
        status: 'sent', note: note || '', sentBy: currentActorId(), sentAt: isoLocal(new Date()) };
    list.push(t);
    posWrite(TRANSFERS_KEY, list);
    saveStockMoves(t.lines.map(l => stockMove({ type: 'transfer_out', sku: l.sku, qty: -l.qty, ref: t.id, reason: `ផ្ទេរទៅ ${branchName(to)}`, note: t.note })));
    return t;
}

function receiveTransfer(id, received, note) {
    const list = posRead(TRANSFERS_KEY, []) || [];
    const t = list.find(x => x.id === id);
    if (!t || t.status !== 'sent' || t.to !== ACTIVE_BRANCH_ID) return null;
    t.lines.forEach(l => { l.received = Math.max(0, Math.min(l.qty, Number(received[l.sku]) || 0)); });
    Object.assign(t, { status: 'received', receivedBy: currentActorId(), receivedAt: isoLocal(new Date()), receiveNote: note || '' });
    posWrite(TRANSFERS_KEY, list);
    saveStockMoves(t.lines.filter(l => l.received > 0).map(l => stockMove({ type: 'transfer_in', sku: l.sku, qty: l.received, ref: t.id, reason: `ទទួលពី ${branchName(t.from)}`, note: t.receiveNote })));
    return t;
}

/* ការផ្ទេរគំរូរបស់ DIGITECHKH៖ សាខាកណ្តាល → ទួលគោក (ទទួលរួច ខ្វះ 2) · សាខាកណ្តាល → សែនសុខ (កំពុងដឹក)
   ចលនាស្តុកសរសេរទៅសាខានីមួយៗផ្ទាល់ (ដូចការផ្ញើ និងការទទួលពិត) */
function ensureDemoTransfers() {
    if (!IS_DEMO_SHOP || posRead(TRANSFERS_KEY, null)) return;
    const at = (days, h) => { const d = new Date(); d.setDate(d.getDate() - days); d.setHours(h, 15, 0, 0); return isoLocal(d); };
    const list = [
        { id: 'TR-SEED-01', from: 'BR-01', to: 'BR-02', status: 'received', note: 'ទំនិញលក់ដាច់សម្រាប់ចុងសប្តាហ៍',
            lines: [{ sku: '8850001', qty: 48, received: 48 }, { sku: '8850005', qty: 24, received: 24 }, { sku: '8860005', qty: 30, received: 28 }],
            sentBy: 'MGR-01', sentAt: at(2, 9), receivedBy: 'MGR-04', receivedAt: at(2, 14), receiveNote: 'កញ្ចប់មីបែក 2' },
        { id: 'TR-SEED-02', from: 'BR-01', to: 'BR-03', status: 'sent', note: '',
            lines: [{ sku: '8860002', qty: 12 }, { sku: '8860003', qty: 12 }, { sku: '8850002', qty: 12 }],
            sentBy: 'MGR-02', sentAt: at(0, 8) }
    ];
    const write = (branchId, moves) => {
        const key = storeKey(STOCK_KEYS.moves, branchId);
        try {
            const cur = JSON.parse(localStorage.getItem(key) || '[]');
            localStorage.setItem(key, JSON.stringify(cur.concat(moves)));
        } catch (e) { /* ការផ្ទុកត្រូវបានបិទ */ }
    };
    list.forEach(t => {
        write(t.from, t.lines.map((l, i) => ({ id: `SM-${t.id}-O${i}`, type: 'transfer_out', sku: l.sku, qty: -l.qty, at: t.sentAt, by: t.sentBy,
            ref: t.id, reason: `ផ្ទេរទៅ ${branchName(t.to)}`, note: t.note })));
        if (t.status === 'received') write(t.to, t.lines.filter(l => l.received > 0).map((l, i) => ({ id: `SM-${t.id}-I${i}`, type: 'transfer_in', sku: l.sku,
            qty: l.received, at: t.receivedAt, by: t.receivedBy, ref: t.id, reason: `ទទួលពី ${branchName(t.from)}`, note: t.receiveNote })));
    });
    posWrite(TRANSFERS_KEY, list);
}

function transferShort(t) {
    return t.status === 'received' ? t.lines.reduce((n, l) => n + (l.qty - (l.received || 0)), 0) : 0;
}

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

/* ស្តុកបើក៖ សាខាដំបូង = p.opening · សាខាគំរូផ្សេងតាមទំហំ · សាខាថ្មីគ្មាន */
function openingQty(p) {
    if (ACTIVE_BRANCH_ID === 'BR-01') return p.opening || 0;
    return IS_DEMO_DATA ? Math.round((p.opening || 0) * DEMO_SCALE) : 0;
}

/* ចំនួននៅក្នុងហាងបច្ចុប្បន្ន { sku: qty } — អាចអវិជ្ជមាន ពេលលក់លើសស្តុកក្នុងប្រព័ន្ធ */
function onHandLevels() {
    const lv = {};
    // ស្តុកបើកមានតែសាខាដំបូង · សាខាថ្មីទទួលស្តុកតាមការនាំចូល ឬការរាប់ស្តុក
    PRODUCTS.forEach(p => { lv[p.sku] = openingQty(p); });
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

/* សាខាដែលមិនទាន់កត់ត្រាស្តុកសោះ (សាខាថ្មី)៖ មិនបង្ហាញ «អស់» លើគ្រប់ទំនិញទេ ព្រោះជាការរំខាន មិនមែនការពិត
   នៅពេលទទួលស្តុក ឬរាប់ស្តុកលើកដំបូង ស្ថានភាពស្តុកដំណើរការធម្មតា */
function stockTracked() {
    return PRODUCTS.some(p => openingQty(p) > 0) || liveStockMoves().some(m => m.type !== 'sale');
}

function stockStatus(sku, levels) {
    const p = getProduct(sku);
    if (!p || !stockTracked()) return 'ok';
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
        <div style="display:flex;justify-content:space-between;gap:8px;${strong ? 'font-weight:600;padding-top:4px;border-top:1px dashed #a2a2a2;' : ''}">
            <span>${label}</span><span>${value}</span>
        </div>`;

    const items = sale.items.map(l => {
        const p = getProduct(l.sku);
        const back = returnedQty(sale, l.sku);
        return `
            <div style="margin-bottom:6px;">
                <div>${p.name}</div>
                <div style="display:flex;justify-content:space-between;gap:8px;color:#545454;">
                    <span>${l.qty} ${p.unit} × ${fmtUSD(linePrice(l))}${back ? ` · ប្រគល់វិញ ${back}` : ''}</span>
                    <span>${fmtUSD(lineTotal(l))}</span>
                </div>
            </div>`;
    }).join('');

    const payLines = [
        sale.pay.usdCash > 0 ? row(PAY_LABEL.usdCash, fmtUSD(sale.pay.usdCash)) : '',
        sale.pay.khrCash > 0 ? row(PAY_LABEL.khrCash, fmtKHR(sale.pay.khrCash)) : '',
        sale.pay.khqr > 0 ? row(khqrLabel(sale.pay), fmtUSD(sale.pay.khqr)) : '',
        (ch.usd > 0.005 || ch.khr >= 1) ? row('ប្រាក់អាប់', fmtChange(ch)) : ''
    ].join('');

    const returns = (sale.returns || []).map(r =>
        row(`ប្រគល់វិញ ${fmtTime(r.at)}`, '− ' + fmtUSD(r.amount))).join('');

    const customer = sale.customerId ? getCreditCustomer(sale.customerId) : null;
    const taxInvoice = customer && customer.vattin;

    return `
        <div class="receipt-ticket" style="width:72mm;max-width:100%;margin:0 auto;font-family:'Kantumruy Pro',sans-serif;font-size:12px;line-height:1.5;color:#171717;position:relative;background:#ffffff;">
            <div style="text-align:center;padding-bottom:8px;border-bottom:1px dashed #a2a2a2;">
                <div style="font-size:15px;font-weight:700;">${MERCHANT.nameKh}</div>
                <div style="color:#545454;">${MERCHANT.branch}</div>
                <div style="color:#545454;">លេខអត្តសញ្ញាណកម្មអាករ ${MERCHANT.tin}</div>
                <div style="color:#545454;">ទូរស័ព្ទ ${MERCHANT.phone}</div>
                <div style="margin-top:6px;font-weight:600;">${taxInvoice ? 'វិក្កយបត្រអាករ' : 'វិក្កយបត្រ'}</div>
            </div>

            ${voided ? `<div style="margin:8px 0;padding:6px;border:2px solid #e11d48;color:#e11d48;text-align:center;font-weight:700;">បានលុបចោល · ${fmtTime(sale.voidedAt)}</div>` : ''}

            <div style="padding:8px 0;border-bottom:1px dashed #a2a2a2;">
                ${row('លេខវិក្កយបត្រ', sale.id)}
                ${row('កាលបរិច្ឆេទ', fmtDate(sale.time))}
                ${row('ម៉ោង', fmtTime(sale.time))}
                ${row('អ្នកគិតលុយ', personName(sale.cashierId))}
                ${row('ម៉ាស៊ីន', sale.register || MY_REGISTER)}
                ${customer ? row('អតិថិជន', customer.name) : ''}
                ${taxInvoice ? row('លេខអត្តសញ្ញាណកម្មអាករអតិថិជន', customer.vattin) : ''}
                ${taxInvoice ? `<div style="color:#545454;">${customer.address}</div>` : ''}
            </div>

            <div style="padding:8px 0;border-bottom:1px dashed #a2a2a2;">${items}</div>

            <div style="padding:8px 0;border-bottom:1px dashed #a2a2a2;">
                ${row('ចំនួនឯកតា', t.qty)}
                ${t.discount > 0.005 ? row('តម្លៃមុនបញ្ចុះ', fmtUSD(t.list)) : ''}
                ${t.discount > 0.005 ? row(`ការបញ្ចុះតម្លៃ ${t.discountPercent}%`, '− ' + fmtUSD(t.discount)) : ''}
                ${row('តម្លៃមុនអាករ', fmtUSD(t.net))}
                ${row('អាករលើតម្លៃបន្ថែម 10%', fmtUSD(t.vat))}
                ${row('សរុបត្រូវបង់', fmtUSD(t.gross), true)}
                ${row('គិតជារៀល', fmtKHR(toKHR(t.gross, rate)))}
            </div>

            <div style="padding:8px 0;border-bottom:1px dashed #a2a2a2;">${payLines}${returns}</div>

            <div style="text-align:center;padding-top:10px;color:#545454;">
                <div>អត្រាប្តូរប្រាក់ 1 ដុល្លារ = ${rate.toLocaleString('en-US')} ៛</div>
                <div style="margin-top:6px;font-weight:600;color:#171717;">សូមអរគុណ · ជួបគ្នាពេលក្រោយ</div>
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
            color: #171717;
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
                ${bankLines(s).map(b => line(`${b.label} · ${b.count} វិក្កយបត្រ`, fmtUSD(b.amount))).join('') || line('ស្កេនកូដបាគង · 0 វិក្កយបត្រ', fmtUSD(0))}
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

function buildKhqrPayload(receiptId, amount, createdAt, expiresAt, bank) {
    const tlv = (tag, value) => `${tag}${String(value.length).padStart(2, '0')}${value}`;
    const amt = Number(amount).toFixed(2);
    const account = payBankAccount(bank);
    const body = [
        tlv('00', '01'),
        tlv('01', '12'),                                        // 12 = កូដប្រើម្តង (មានទឹកប្រាក់)
        tlv('29', tlv('00', account)),                          // គណនីបាគង
        tlv('52', '5999'),                                      // ប្រភេទអាជីវកម្ម៖ លក់រាយទូទៅ
        tlv('53', '840'),                                       // USD
        tlv('54', amt),
        tlv('58', 'KH'),
        tlv('59', MERCHANT.name.slice(0, 25)),
        tlv('60', MERCHANT.city.slice(0, 15)),
        tlv('62', tlv('01', receiptId.slice(0, 25))),           // លេខវិក្កយបត្រ
        tlv('99', tlv('00', String(createdAt)) + tlv('01', String(expiresAt)))
    ].join('') + '6304';
    return body + crc16(body);
}

/* CRC16-CCITT (0x1021, ចាប់ផ្តើម 0xFFFF) តាមស្តង់ដារ EMV QR — ស្លាក 63 */
function crc16(text) {
    let crc = 0xFFFF;
    for (let i = 0; i < text.length; i++) {
        crc ^= text.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
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
    let a = hashStr(key.startsWith('fx|') ? key : key + DEMO_SALT);
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
        const n = Math.round(HOUR_WEIGHT[new Date(h).getHours()] * SALES_PER_HOUR * (DEMO_SCALE || 1) * (dayFactor || 1) * (0.7 + rng() * 0.6));
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
    if (r < 0.93) {
        // ធនាគារ៖ ABA ~65% · ACLEDA ~35% (មិនប្រើ rng ដើម្បីកុំឱ្យប្រវត្តិផ្សេងទៀតប្រែប្រួល)
        const bank = hashStr(`${due.toFixed(2)}|${r}`) % 100 < 65 ? 'aba' : 'acleda';
        return { usdCash: 0, khrCash: 0, khqr: Math.round(due * 100) / 100, bank };
    }
    const usd = Math.floor(due);
    return { usdCash: usd, khrCash: Math.ceil((due - usd) * rate / 1000) * 1000 || 1000, khqr: 0 };
}

/* ===== ទិន្នន័យគំរូសម្រាប់ការបង្ហាញ =====
   ពេលបើកលើកដំបូង បង្កើតវេនដែលកំពុងបើកសម្រាប់អ្នកនៅបញ្ជរ POS-01 តាមកាលវិភាគ (ឬអ្នកដំបូងក្នុងវេន)
   រួមទាំងការលក់តាមម៉ោងមមាញឹកចាប់ពីបើកវេនដល់ឥឡូវ។ បើមុនម៉ោងវេនដំបូង ឬគ្មាននរណាក្នុងវេន
   គ្មានវេនបើកទេ ហើយផ្ទាំងគិតលុយនាំទៅទំព័របើកវេន។ */

/* អ្នកគ្រប់គ្រងសាខាសម្រាប់ទិន្នន័យគំរូ (អ្នកបើកប្រាក់បាតថត ទទួលស្តុក រាប់ស្តុក) */
function demoManagerId() {
    return (MANAGERS[0] || ADMINS[0] || { id: 'MGR-01' }).id;
}

function ensurePosSeed() {
    ensureDemoTransfers();
    if (!IS_DEMO_DATA || posRead(POS_KEYS.seed, null)) return;
    const now = new Date();
    const tpl = templateAt(now) || lastStartedTemplate(now);
    const crew = tpl ? rosterFor(templateDateFor(tpl, now), tpl.code) : [];
    const seats = tpl ? rosterSeats(templateDateFor(tpl, now), tpl.code) : [];
    const lead = seats.find(a => a.register === 'POS-01') || seats[0];
    if (tpl && lead) {
        const dateStr = templateDateFor(tpl, now);
        const rng = rngFor(`live|${dateStr}|${tpl.code}`);
        const openedAt = new Date(dateAt(dateStr, tpl.start).getTime() - (2 + Math.floor(rng() * 8)) * 60000);
        const rate = Number(posSettings().fxRate) || POS_SETTINGS_DEFAULTS.fxRate;
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
            floatApprovedBy: demoManagerId(),
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
            usd: 200, khr: 400000, reason: '', ref: '', createdBy: demoManagerId(), createdAt: shift.openedAt,
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

/* វគ្គចូលប្រើ { userId, shopId, via: 'password'|'pin', deviceId, at } · ផុតពេលគណនីផ្អាក ឬលែងជាសមាជិកហាង */
function posSession() {
    const s = posRead(SESSION_KEY, null);
    if (!s || !s.userId) return null;
    if (s.control) return isControlId(s.userId) ? s : null;
    // ហាងត្រូវបានផ្អាក ឬការជាវផុតកំណត់ពេលកំពុងប្រើ → ចេញពីប្រព័ន្ធនៅទំព័របន្ទាប់
    if (!isMemberOf(s.userId, s.shopId || 'SHOP-01') || shopBlocked(s.shopId || 'SHOP-01')) return null;
    // ច្បាប់ចូលប្រើដដែលគ្រប់ទំព័រ៖ បញ្ជរត្រូវបានដកចេញ ឬប្តូរហាង → អ្នកគិតលុយត្រូវចូលម្តងទៀត
    const p = personById(s.userId);
    return loginBlockReason(p, thisDevice()) || tillBusyFor(p, thisDevice()) ? null : s;
}

function posLoginControl(userId) {
    posWrite(SESSION_KEY, { userId, control: true, via: 'password', at: isoLocal(new Date()) });
}

/* សាខានៃវគ្គចូលប្រើ៖ បញ្ជរដែលបានចុះឈ្មោះ → សាខារបស់បុគ្គលិក → សាខាចុងក្រោយដែលម្ចាស់ហាងប្រើ → BR-01 */
function posLogin(userId, shopId, via, branchId) {
    const dev = thisDevice();
    const shop = shopId || 'SHOP-01';
    const p = personById(userId) || {};
    const lastBranch = (posRead('pos_last_branch', {}) || {})[`${userId}|${shop}`];
    const branch = branchId || (dev && dev.shopId === shop && via === 'pin' ? dev.branchId || 'BR-01' : '')
        || (p.role !== 'admin' && p.shopId === shop ? p.branchId : '') || (p.role !== 'admin' && !p.shopId && shop === 'SHOP-01' ? p.branchId : '')
        || lastBranch || 'BR-01';
    posWrite(SESSION_KEY, { userId, shopId: shop, branchId: branch, via: via || 'password', deviceId: dev ? dev.id : null, at: isoLocal(new Date()) });
    const last = posRead('pos_last_shop', {});
    last[userId] = shop;
    posWrite('pos_last_shop', last);
    const lb = posRead('pos_last_branch', {}) || {};
    lb[`${userId}|${shop}`] = branch;
    posWrite('pos_last_branch', lb);
}

/* ម្ចាស់ហាងប្តូរសាខា (របារចំហៀង → ប្តូរសាខា · ផ្ទាំងម្ចាស់ហាង → ប្រៀបធៀបសាខា) */
function posSwitchBranch(branchId) {
    const s = posRead(SESSION_KEY, null);
    if (!s) return;
    posLogin(s.userId, s.shopId, s.via, branchId);
}

/* ===== ឧបករណ៍បញ្ជរដែលបានចុះឈ្មោះ =====
   ម្ចាស់ហាងចុះឈ្មោះកុំព្យូទ័របញ្ជរម្តង (ការកំណត់ → ឧបករណ៍បញ្ជរ)។ ឧបករណ៍ចងចាំហាង និងបញ្ជររបស់ខ្លួន
   ដូច្នេះអ្នកគិតលុយចូលដោយលេខកូដ PIN 6 ខ្ទង់តែប៉ុណ្ណោះ (PIN ត្រូវមិនជាន់គ្នាតែក្នុងហាងមួយ)។
   ឧបករណ៍ដែលមិនបានចុះឈ្មោះ (ទូរស័ព្ទ ឬកុំព្យូទ័រផ្ទាល់ខ្លួន) ចូលបានតែដោយអ៊ីមែល ឬលេខទូរស័ព្ទ + ពាក្យសម្ងាត់។
   ដកឧបករណ៍ចេញ (ឧ. បាត់) = ការចូលដោយ PIN លើឧបករណ៍នោះឈប់ភ្លាម។
   ប្រព័ន្ធពិត៖ ម៉ាស៊ីនមេផ្តល់សោឧបករណ៍ · គំរូនេះ៖ pos_devices (បញ្ជី) + pos_device (ឧបករណ៍នេះ) */
const DEVICES_KEY = 'pos_devices';
const THIS_DEVICE_KEY = 'pos_device';

function deviceList() {
    return posRead(DEVICES_KEY, []);
}

function thisDevice() {
    const id = posRead(THIS_DEVICE_KEY, null);
    return id ? deviceList().find(d => d.id === id) || null : null;
}

/* បញ្ជរមួយ = ឧបករណ៍មួយ · ចុះឈ្មោះថ្មីលើបញ្ជរដដែល ជំនួសឧបករណ៍ចាស់ */
function registerThisDevice(shopId, register, byId, branchId) {
    const old = thisDevice();
    const list = deviceList().filter(d => !(old && d.id === old.id) && !(d.shopId === shopId && d.register === register));
    const dev = { id: newId('DEV'), shopId, branchId: branchId || (shopId === ACTIVE_SHOP_ID ? ACTIVE_BRANCH_ID : 'BR-01'), register, at: isoLocal(new Date()), by: byId };
    list.push(dev);
    posWrite(DEVICES_KEY, list);
    posWrite(THIS_DEVICE_KEY, dev.id);
    return dev;
}

function removeDevice(id) {
    posWrite(DEVICES_KEY, deviceList().filter(d => d.id !== id));
}

/* ចូលដោយ PIN លើឧបករណ៍ដែលបានចុះឈ្មោះ៖ រកតែក្នុងចំណោមសមាជិកហាងរបស់ឧបករណ៍ */
/* បញ្ជរនៃសាខាមួយ៖ បុគ្គលិកនៃសាខានោះ ឬម្ចាស់ហាង */
/* បញ្ជរកំពុងប្រើ៖ ថតប្រាក់បើកលើបញ្ជរនេះដោយអ្នកផ្សេង → មានតែម្ចាស់ថតប្រាក់ចូលបាន (រួមទាំងអ្នកគ្រប់គ្រង និងម្ចាស់ហាង)
   អ្នកផ្សេងប្រើបញ្ជរទំនេរ · ការអនុម័តនៅបញ្ជរនេះប្រើផ្ទាំង PIN អ្នកគ្រប់គ្រង មិនមែនការចូលប្រើ */
function tillBusyFor(p, dev) {
    if (!p || !dev) return null;
    const open = (posReadAt('pos_shifts', [], dev.branchId || 'BR-01', dev.shopId) || [])
        .find(s => s.status === 'open' && s.register === dev.register);
    return open && open.cashierId !== p.id ? open : null;
}

/* បញ្ជរទំនេរក្នុងសាខានៃបញ្ជរនេះ (គ្មានថតប្រាក់បើក) */
function freeTillsNear(dev) {
    if (!dev) return [];
    const busy = (posReadAt('pos_shifts', [], dev.branchId || 'BR-01', dev.shopId) || []).filter(s => s.status === 'open').map(s => s.register);
    return branchRegisters(dev.branchId || 'BR-01').filter(r => r !== dev.register && !busy.includes(r));
}

function verifyPinLogin(pin, shopId, branchId) {
    const dev = { shopId, branchId: branchId || 'BR-01' };
    return ALL_STAFF.find(p => p.active && !loginBlockReason(p, dev) && verifyPin(p.id, pin)) || null;
}

/* ឧបករណ៍គំរូ៖ កម្មវិធីរុករកនេះជាបញ្ជរ POS-01 នៃហាងទីមួយ (ម្ចាស់ហាងដកចេញបាននៅការកំណត់) */
/* បញ្ជរគំរូទាំងអស់បានចុះឈ្មោះ (មួយកុំព្យូទ័រ មួយបញ្ជរ) · កម្មវិធីរុករកនេះ = POS-01 នៃ DIGITECHKH
   ប្តូរកុំព្យូទ័រនេះនៅផ្ទាំងគំរូនៃទំព័រចូល · កម្មវិធីរុករកដែលមានទិន្នន័យចាស់ទទួលបញ្ជរដែលខ្វះម្តង (pos_device_seed) */
const DEMO_DEVICES = [
    ['DEV-01', 'SHOP-01', 'BR-01', 'POS-01', 'ADM-01'], ['DEV-02', 'SHOP-01', 'BR-01', 'POS-02', 'ADM-01'], ['DEV-03', 'SHOP-01', 'BR-01', 'POS-03', 'ADM-01'],
    ['DEV-04', 'SHOP-01', 'BR-02', 'POS-04', 'ADM-01'], ['DEV-05', 'SHOP-01', 'BR-02', 'POS-05', 'ADM-01'], ['DEV-06', 'SHOP-01', 'BR-03', 'POS-06', 'ADM-01'],
    ['DEV-07', 'SHOP-02', 'BR-01', 'POS-01', 'ADM-02'], ['DEV-08', 'SHOP-02', 'BR-01', 'POS-02', 'ADM-02']
];
(function seedDevice() {
    const fresh = posRead(DEVICES_KEY, null) === null;
    if (!fresh && posRead('pos_device_seed', null)) return;
    const list = posRead(DEVICES_KEY, []) || [];
    const at = isoLocal(new Date());
    DEMO_DEVICES.forEach(([id, shopId, branchId, register, by]) => {
        if (!list.some(d => d.id === id || (d.shopId === shopId && d.register === register))) list.push({ id, shopId, branchId, register, at, by });
    });
    posWrite(DEVICES_KEY, list);
    if (fresh) posWrite(THIS_DEVICE_KEY, 'DEV-01');
    posWrite('pos_device_seed', { at });
})();

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
/* កុំព្យូទ័របញ្ជរដែលបានចុះឈ្មោះក្នុងហាង និងសាខានេះ = បញ្ជរមួយថេរ (មួយកុំព្យូទ័រ មួយថតប្រាក់)
   '' = មិនមែនបញ្ជរ (ឧ. អ្នកគ្រប់គ្រងលើកុំព្យូទ័រផ្ទាល់ខ្លួន) → ជ្រើសបញ្ជរបាន */
function deviceRegister() {
    const d = thisDevice();
    return d && d.shopId === ACTIVE_SHOP_ID && (d.branchId || 'BR-01') === ACTIVE_BRANCH_ID && REGISTERS.includes(d.register) ? d.register : '';
}

function resolveRegister(personId) {
    // នៅលើបញ្ជរ៖ ទំព័រអ្នកគិតលុយធ្វើការតែលើថតប្រាក់នៃបញ្ជរនេះ មិនមែនវេនដែលបើកនៅបញ្ជរផ្សេង
    const devReg = deviceRegister();
    if (devReg) return devReg;
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
    // ឧបករណ៍ដែលបានចុះឈ្មោះ = បញ្ជរពិតដែលអ្នកចូលប្រើកំពុងឈរ · បើកវេនបានតែលើបញ្ជរនេះ (ទោះកំពុងប្រើក៏ដោយ → បង្ហាញថាជាប់)
    const me = posRead(SESSION_KEY, null) || {};
    const devReg = deviceRegister();
    if (devReg && me.userId === personId) return devReg;
    const mine = list.find(a => a.cashierId === personId);
    if (mine && mine.pin && free(mine.register)) return mine.register;
    const pinnedByOthers = list.filter(a => a.pin && a.cashierId !== personId).map(a => a.register);
    const u = usualRegister(personId);
    if (free(u) && !pinnedByOthers.includes(u)) return u;
    return REGISTERS.find(r => free(r) && !pinnedByOthers.includes(r))
        || REGISTERS.find(free) || REGISTERS[REGISTERS.length - 1];
}

const SESSION = posSession();
/* ហាងដែលកំពុងប្រើ៖ វគ្គចូលប្រើ → ឧបករណ៍បញ្ជរ → ហាងទីមួយ · ឈ្មោះ សាខា ឡូហ្គោលើគ្រប់ទំព័រមកពី MERCHANT */
const CURRENT_SHOP_ID = (SESSION && SESSION.shopId) || (thisDevice() || {}).shopId || 'SHOP-01';
Object.assign(MERCHANT, shopById(CURRENT_SHOP_ID) || {});
MERCHANT.logo = (shopById(CURRENT_SHOP_ID) || {}).logo || '';
// សាខាដែលកំពុងប្រើ៖ ឈ្មោះលើវិក្កយបត្រ អេក្រង់អតិថិជន និងរបារចំហៀង
if (CURRENT_SHOP_ID === ACTIVE_SHOP_ID) {
    const br = currentBranch();
    MERCHANT.branchId = br.id;
    MERCHANT.branch = br.name;
    if (br.phone) MERCHANT.phone = br.phone;
}
const ME_CASHIER = SESSION ? SESSION.userId : 'CAS-01';
// ម្ចាស់ហាងអាចមើលទំព័រអ្នកគ្រប់គ្រង ហើយសម្រេចក្នុងនាមខ្លួនឯង
const ME_MANAGER = SESSION && (isManagerId(SESSION.userId) || isAdminId(SESSION.userId)) ? SESSION.userId : 'MGR-01';
const MY_REGISTER = resolveRegister(ME_CASHIER);

/* ការពារទំព័រ៖ ទំព័រអ្នកគិតលុយ = អ្នកគិតលុយ ឬអ្នកគ្រប់គ្រង (ម្ចាស់ហាងមិនឈរបញ្ជរ)
   ទំព័រអ្នកគ្រប់គ្រង = អ្នកគ្រប់គ្រង ឬម្ចាស់ហាង · ទំព័រម្ចាស់ហាង = ម្ចាស់ហាងប៉ុណ្ណោះ */
(function guardPage() {
    const path = location.pathname;
    const area = path.includes('/cashier/') ? 'cashier' : path.includes('/manager/') ? 'manager' : path.includes('/admin/') ? 'admin' : path.includes('/control/') ? 'control' : '';
    if (!area) return;
    // អ្នកគ្រប់គ្រងប្រព័ន្ធចូលបានតែ control/* · អ្នកផ្សេងចូល control/* មិនបាន
    if (SESSION && SESSION.control) {
        if (area !== 'control') location.replace('../../control/dashboard/dashboard.html');
        return;
    }
    // ច្រកអ្នកគ្រប់គ្រងប្រព័ន្ធ៖ ចូលនៅទំព័រចូលទូទៅ (មិនមែនបញ្ជរ) · ហាងចូលទីនេះមិនបាន
    if (area === 'control') {
        location.replace(SESSION ? `../../${ROLE_HOME[roleOf(SESSION.userId)]}` : `../../index.html?next=${encodeURIComponent(path.split('/').slice(-3).join('/'))}`);
        return;
    }
    const role = SESSION ? roleOf(SESSION.userId) : '';
    if (area === 'cashier' && role === 'admin' && !path.includes('/display/')) {
        location.replace(`../../${ROLE_HOME.admin}`);
        return;
    }
    const ok = area === 'cashier' ? !!SESSION : area === 'manager' ? role === 'manager' || role === 'admin' : role === 'admin';
    if (!ok) location.replace(`../../index.html?next=${encodeURIComponent(path.split('/').slice(-3).join('/'))}`);
    // ហាងថ្មីដែលមិនទាន់រៀបចំ៖ ម្ចាស់ហាងទៅជំនួយការរៀបចំមុន
    else if (area === 'admin' && !path.includes('/setup/') && !shopSetup(CURRENT_SHOP_ID).done && !setupLater()) location.replace('../../admin/setup/setup.html');
})();


ensurePosSeed();
stockOpeningAt();
