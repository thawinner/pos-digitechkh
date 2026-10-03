/* ច្រកគិតលុយលក់រាយ (POS) — ឃ្លាំងទិន្នន័យសាកល្បង

   ⚠️ គោលការណ៍សុវត្ថិភាពតឹងរ៉ឹង (Shift-Locked Data)
   ឯកសារនេះផ្ទុកតែប្រតិបត្តិការនៃ "វេនបច្ចុប្បន្នថ្ងៃនេះ" ប៉ុណ្ណោះ។
   គ្មានប្រវត្តិលក់ពីវេនមុន គ្មានចំណូលប្រចាំខែ ឬប្រចាំឆ្នាំ និងគ្មាន
   ថ្លៃដើមទិញឡើយ។ ហាមបញ្ចូលទិន្នន័យទាំងនោះចូលក្នុងឯកសារនេះជាដាច់ខាត។ */

/* ម៉ោងពិតប្រាកដ — មិនប្រើកាលបរិច្ឆេទថេរឡើយ (បញ្ជីពិនិត្យលេខ 06 ផ្នែក ឃ5)
   វេនចាប់ផ្តើមម៉ោង 07:30 ថ្ងៃនេះ។ បើពេលនេះនៅមុន 08:00 ចាត់ទុកវេនបានបើក 30 នាទីមុន
   ដើម្បីកុំឱ្យវេនមានរយៈពេលអវិជ្ជមាន។ */
const BMS_TODAY = new Date();

const MONTHS_KH = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

/* អត្រាប្តូរប្រាក់ប្រើក្នុងវេននេះ */
const FX_RATE = 4100;

function pad2(n) {
    return String(n).padStart(2, '0');
}

function isoLocal(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

const SHIFT_OPEN_AT = (() => {
    const d = new Date(BMS_TODAY);
    d.setHours(7, 30, 0, 0);
    const halfHourAgo = new Date(BMS_TODAY.getTime() - 30 * 60000);
    return d < halfHourAgo ? d : halfHourAgo;
})();

/* វេនបច្ចុប្បន្ន */
const SHIFT = {
    id: `SHIFT-${BMS_TODAY.getFullYear()}${pad2(BMS_TODAY.getMonth() + 1)}${pad2(BMS_TODAY.getDate())}-A`,
    cashier: 'ចន្ទ មករា',
    initials: 'ចម',
    terminal: 'POS-01',
    branch: 'សាខាកណ្តាល ភ្នំពេញ',
    openedAt: isoLocal(SHIFT_OPEN_AT),
    openingFloatUSD: 200,
    openingFloatKHR: 400000,
    /* ដែនកំណត់បញ្ចុះតម្លៃរបស់អ្នកគិតលុយ (ឯកសាររចនាលេខ 01 ផ្នែក 3.1 គ3) */
    discountLimit: 5
};

/* ល្បឹមភាពខុសគ្នាសាច់ប្រាក់ — លើសពីនេះត្រូវការការពន្យល់ជាលាយលក្ខណ៍អក្សរ */
const VARIANCE_TOLERANCE = 5;

const CATEGORIES = [
    { id: 'all', label: 'ទាំងអស់', icon: 'fa-border-all' },
    { id: 'drink', label: 'ភេសជ្ជៈ', icon: 'fa-bottle-water' },
    { id: 'snack', label: 'អាហារសម្រន់', icon: 'fa-cookie-bite' },
    { id: 'household', label: 'របស់ប្រើប្រាស់', icon: 'fa-basket-shopping' },
    { id: 'stationery', label: 'សម្ភារសិក្សា', icon: 'fa-pen-ruler' },
    { id: 'electronic', label: 'អេឡិចត្រូនិក', icon: 'fa-plug' }
];

/* កាតាឡុកទំនិញ — មានតែតម្លៃលក់រាយ គ្មានថ្លៃដើមទិញឡើយ */
const PRODUCTS = [
    { sku: '8850001', barcode: '8850001', name: 'ទឹកសុទ្ធ វិតាល 500 មីលីលីត្រ', category: 'drink', price: 0.50, unit: 'ដប', stock: 240, icon: 'fa-bottle-water', tone: 'sky' },
    { sku: '8850002', barcode: '8850002', name: 'កាហ្វេកំប៉ុង នេស្ការ្វេ', category: 'drink', price: 1.25, unit: 'កំប៉ុង', stock: 96, icon: 'fa-mug-hot', tone: 'amber' },
    { sku: '8850003', barcode: '8850003', name: 'ទឹកក្រូច មីរិនដា 1.5 លីត្រ', category: 'drink', price: 1.75, unit: 'ដប', stock: 64, icon: 'fa-wine-bottle', tone: 'orange' },
    { sku: '8850004', barcode: '8850004', name: 'ទឹកដោះគោ ដាច់ឡាក់', category: 'drink', price: 2.10, unit: 'ប្រអប់', stock: 48, icon: 'fa-glass-water', tone: 'blue' },

    { sku: '8860001', barcode: '8860001', name: 'នំប៉័ង សាំងវិច', category: 'snack', price: 1.50, unit: 'ដុំ', stock: 35, icon: 'fa-bread-slice', tone: 'amber' },
    { sku: '8860002', barcode: '8860002', name: 'ដំឡូងបំពង លេយ៍', category: 'snack', price: 1.20, unit: 'កញ្ចប់', stock: 120, icon: 'fa-cookie-bite', tone: 'yellow' },
    { sku: '8860003', barcode: '8860003', name: 'សូកូឡា ស្នីកគ័រ', category: 'snack', price: 0.95, unit: 'ដុំ', stock: 150, icon: 'fa-candy-cane', tone: 'rose' },
    { sku: '8860004', barcode: '8860004', name: 'នំខេក ចម្រុះរសជាតិ', category: 'snack', price: 2.50, unit: 'ប្រអប់', stock: 28, icon: 'fa-cake-candles', tone: 'pink' },

    { sku: '8870001', barcode: '8870001', name: 'សាប៊ូបោកខោអាវ 1 គីឡូក្រាម', category: 'household', price: 3.40, unit: 'កញ្ចប់', stock: 52, icon: 'fa-soap', tone: 'emerald' },
    { sku: '8870002', barcode: '8870002', name: 'ក្រដាសអនាម័យ 10 ដុំ', category: 'household', price: 4.20, unit: 'កញ្ចប់', stock: 40, icon: 'fa-toilet-paper', tone: 'slate' },
    { sku: '8870003', barcode: '8870003', name: 'ថ្នាំដុសធ្មេញ ខូលហ្គេត', category: 'household', price: 1.80, unit: 'ដប', stock: 88, icon: 'fa-tooth', tone: 'cyan' },
    { sku: '8870004', barcode: '8870004', name: 'សាប៊ូងូតទឹក ឡាក់ស៍', category: 'household', price: 2.75, unit: 'ដប', stock: 60, icon: 'fa-pump-soap', tone: 'purple' },

    { sku: '8880001', barcode: '8880001', name: 'សៀវភៅសរសេរ 100 ទំព័រ', category: 'stationery', price: 0.75, unit: 'ក្បាល', stock: 200, icon: 'fa-book', tone: 'blue' },
    { sku: '8880002', barcode: '8880002', name: 'ប៊ិច ខៀវ ដំណក់', category: 'stationery', price: 0.35, unit: 'ដើម', stock: 320, icon: 'fa-pen', tone: 'indigo' },
    { sku: '8880003', barcode: '8880003', name: 'ខ្មៅដៃខ្មៅ កញ្ចប់ 12 ដើម', category: 'stationery', price: 1.60, unit: 'កញ្ចប់', stock: 75, icon: 'fa-pencil', tone: 'amber' },

    { sku: '8890001', barcode: '8890001', name: 'ថ្មពិល ទំហំតូច កញ្ចប់ 4', category: 'electronic', price: 2.40, unit: 'កញ្ចប់', stock: 66, icon: 'fa-battery-full', tone: 'lime' },
    { sku: '8890002', barcode: '8890002', name: 'ខ្សែសាកទូរស័ព្ទ 1 ម៉ែត្រ', category: 'electronic', price: 3.90, unit: 'ខ្សែ', stock: 44, icon: 'fa-plug', tone: 'violet' },
    { sku: '8890003', barcode: '8890003', name: 'អំពូលបំភ្លឺ 9 វ៉ាត់', category: 'electronic', price: 2.20, unit: 'គ្រាប់', stock: 58, icon: 'fa-lightbulb', tone: 'yellow' }
];

/* ប្រតិបត្តិការដែលបានបញ្ចប់ក្នុងវេននេះប៉ុណ្ណោះ
   ម៉ោងលក់ចែកស្មើគ្នាចន្លោះពេលបើកវេន និងពេលឥឡូវនេះ
   ដូច្នេះវិក្កយបត្រតែងតែស្ថិតក្នុងអតីតកាល មិនថាបើកទំព័រនៅម៉ោងណាក៏ដោយ។ */

const SHIFT_SALE_SEED = [
    { items: [{ sku: '8850001', qty: 4 }, { sku: '8860002', qty: 2 }], pay: { usdCash: 5.00, khrCash: 0, khqr: 0 } },
    { items: [{ sku: '8870001', qty: 1 }, { sku: '8870003', qty: 2 }], pay: { usdCash: 0, khrCash: 30000, khqr: 0 } },
    { items: [{ sku: '8890002', qty: 1 }, { sku: '8890001', qty: 2 }], pay: { usdCash: 0, khrCash: 0, khqr: 8.70 } },
    { items: [{ sku: '8860001', qty: 3 }, { sku: '8850002', qty: 3 }, { sku: '8860003', qty: 2 }], pay: { usdCash: 11.00, khrCash: 0, khqr: 0 } },
    { items: [{ sku: '8880001', qty: 10 }, { sku: '8880002', qty: 12 }], pay: { usdCash: 5.00, khrCash: 30000, khqr: 0 } },
    { items: [{ sku: '8870002', qty: 2 }, { sku: '8870004', qty: 1 }], pay: { usdCash: 0, khrCash: 0, khqr: 11.15 } },
    { items: [{ sku: '8850003', qty: 2 }, { sku: '8860004', qty: 1 }], pay: { usdCash: 7.00, khrCash: 0, khqr: 0 } },
    { items: [{ sku: '8890003', qty: 4 }, { sku: '8880003', qty: 2 }], pay: { usdCash: 0, khrCash: 50000, khqr: 0 } },
    { items: [{ sku: '8850004', qty: 3 }, { sku: '8860003', qty: 4 }], pay: { usdCash: 4.00, khrCash: 0, khqr: 6.10 } }
];

const SHIFT_SALES = (() => {
    const openMs = SHIFT_OPEN_AT.getTime();
    const span = Math.max(BMS_TODAY.getTime() - openMs, 60000);
    const step = span / (SHIFT_SALE_SEED.length + 1);
    return SHIFT_SALE_SEED.map((sale, i) => {
        const at = new Date(openMs + step * (i + 1));
        return {
            id: `RCP-${pad2(BMS_TODAY.getMonth() + 1)}${pad2(BMS_TODAY.getDate())}-${String(i + 1).padStart(4, '0')}`,
            time: isoLocal(at),
            items: sale.items,
            pay: sale.pay
        };
    });
})();

/* ក្រដាសប្រាក់សម្រាប់រាប់សាច់ប្រាក់បិទវេន */
const USD_NOTES = [100, 50, 20, 10, 5, 1];
const KHR_NOTES = [100000, 50000, 20000, 10000, 5000, 1000, 500, 100];

/* ===== អនុគមន៍ធ្វើទ្រង់ទ្រាយ ===== */

function fmtUSD(amount) {
    return '$' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtKHR(amount) {
    return Number(Math.round(amount)).toLocaleString('en-US') + ' ៛';
}

function toKHR(usd) {
    return usd * FX_RATE;
}

function toUSD(khr) {
    return khr / FX_RATE;
}

function fmtKhDate(iso) {
    const d = new Date(iso);
    return `${d.getDate()} ${MONTHS_KH[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtTime(iso) {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getProduct(sku) {
    return PRODUCTS.find(p => p.sku === sku);
}

/* ===== រូបភាពទំនិញ =====
   រូបថតរក្សាទុកក្នុង shared/assets/products/<sku>.png ជាទម្រង់ដែលផ្ទៃខាងក្រោយថ្លា
   ដូច្នេះទំនិញអណ្តែតលើផ្ទៃងងឹតរបស់ផ្ទាំងគិតលុយ ដោយគ្មានប្លុកសជុំវិញ។
   បើឯកសារមិនទាន់មាន ប្រព័ន្ធបង្ហាញរូបតំណាងជំនួសដោយស្វ័យប្រវត្តិ
   ដូច្នេះផ្ទាំងគិតលុយមិនដែលបង្ហាញរូបភាពខូចឡើយ។ */

function productImageSrc(p) {
    const root = (document.body && document.body.dataset.roleRoot) || '.';
    return `${root}/shared/assets/products/${p.sku}.png`;
}

/* object-contain ដើម្បីបង្ហាញទំនិញទាំងមូល មិនកាត់ក្បាល ឬជើងដបឡើយ
   ព្រោះរូបថតទំនិញជាការេ ហើយទំនិញនៅចំកណ្តាល */
/* រូបតំណាងជំនួសពេលគ្មានរូបថត៖ ដាក់ក្នុងរង្វង់មានពណ៌ស្រាល
   ដើម្បីឱ្យក្រឡានោះនៅតែមើលទៅជាទំនិញមួយ មិនមែនជាប្រអប់ទទេដែលខូច។
   បើទុករូបតំណាងតូចអណ្តែតក្នុងការេធំ ក្រឡាពាក់កណ្តាលកាតាឡុកនឹងមើលទៅដូចបរាជ័យ។ */
function productImgHtml(p, iconSize) {
    return `
        <img src="${productImageSrc(p)}" alt="${p.name}" loading="lazy"
             class="w-full h-full object-contain"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <span style="display:none" class="w-full h-full items-center justify-center">
            <span class="w-[66%] aspect-square rounded-[22%] bg-${p.tone}-400/10 border border-${p.tone}-400/25 text-${p.tone}-300 flex items-center justify-center">
                <i class="fas ${p.icon} ${iconSize || 'text-2xl'}"></i>
            </span>
        </span>`;
}

function findByBarcode(code) {
    const q = String(code).trim().toLowerCase();
    return PRODUCTS.find(p => p.barcode === q)
        || PRODUCTS.find(p => p.name.toLowerCase().includes(q));
}

/* ===== ការគណនាវិក្កយបត្រ ===== */

function lineTotal(line) {
    const p = getProduct(line.sku);
    return p ? p.price * line.qty : 0;
}

/* អាករលើតម្លៃបន្ថែម 10% រួមបញ្ចូលក្នុងតម្លៃលក់រាយរួចហើយ ដូច្នេះត្រូវបំបែកចេញវិញ។
   ការបញ្ចុះតម្លៃកាត់លើតម្លៃរួមបញ្ចូលអាករ បន្ទាប់មកទើបបំបែកអាករចេញ។ */
function saleTotals(items, discountPercent) {
    const list = items.reduce((sum, it) => sum + lineTotal(it), 0);
    const pct = Math.min(Math.max(Number(discountPercent) || 0, 0), SHIFT.discountLimit);
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

function paidTotal(pay) {
    return pay.usdCash + toUSD(pay.khrCash) + pay.khqr;
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

/* ===== អតិថិជនឥណទាន =====
   ផ្ទាំងគិតលុយលក់អតិថិជនដើរចូលជាសាច់ប្រាក់ជាធម្មតា។
   បញ្ជីនេះមានតែអតិថិជនដែលមានគណនីឥណទាន ដើម្បីភ្ជាប់វិក្កយបត្រទៅគណនីរបស់គេ។
   គ្មានថ្លៃដើម គ្មានប្រវត្តិទិញ — មានត្រឹមឈ្មោះ ទូរស័ព្ទ និងពិដានឥណទានប៉ុណ្ណោះ។ */

const CREDIT_CUSTOMERS = [
    { id: 'POS-C-01', name: 'ហាង សុខសប្បាយ', phone: '012 884 221', creditLimit: 500 },
    { id: 'POS-C-02', name: 'ភោជនីយដ្ឋាន អង្គរថ្មី', phone: '017 332 908', creditLimit: 1200 },
    { id: 'POS-C-03', name: 'សាលារៀន ចំណេះដឹងថ្មី', phone: '078 554 110', creditLimit: 800 }
];

function getCreditCustomer(id) {
    return CREDIT_CUSTOMERS.find(c => c.id === id) || null;
}

/* ===== ប្រតិបត្តិការក្នុងវេន (រួមទាំងអ្វីដែលបានលក់ក្នុងវេនបច្ចុប្បន្ន) ===== */

const SALES_KEY = 'pos_shift_sales';

function loadNewSales() {
    try {
        return JSON.parse(sessionStorage.getItem(SALES_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveSale(sale) {
    const all = loadNewSales();
    all.push(sale);
    try {
        sessionStorage.setItem(SALES_KEY, JSON.stringify(all));
    } catch (e) {
        // វេនឯកជន ឬការផ្ទុកត្រូវបានបិទ — ការលក់នៅរស់ត្រឹមទំព័របច្ចុប្បន្ន
    }
}

/* ប្រតិបត្តិការទាំងអស់ក្នុងវេននេះ — ថ្មីមុនគេ */
function shiftSales() {
    return SHIFT_SALES.concat(loadNewSales())
        .sort((a, b) => new Date(b.time) - new Date(a.time));
}

function nextReceiptNumber() {
    const n = SHIFT_SALES.length + loadNewSales().length + 1;
    return `RCP-${pad2(BMS_TODAY.getMonth() + 1)}${pad2(BMS_TODAY.getDate())}-${String(n).padStart(4, '0')}`;
}

/* ===== កន្ត្រកទំនិញបច្ចុប្បន្ន ===== */

const CART_KEY = 'pos_cart';

function loadCart() {
    try {
        return JSON.parse(sessionStorage.getItem(CART_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveCart(items) {
    try {
        sessionStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (e) {
        // មិនអាចរក្សាទុក — កន្ត្រកនៅរស់ត្រឹមទំព័របច្ចុប្បន្ន
    }
}

function clearCart() {
    try {
        sessionStorage.removeItem(CART_KEY);
    } catch (e) {
        // មិនអាចសម្អាត — មិនប៉ះពាល់ដំណើរការទេ
    }
}

/* ការទូទាត់ KHQR ដែលកំពុងរង់ចាំ (បញ្ជូនរវាងទំព័រ) */
const PENDING_KEY = 'pos_pending_khqr';

function savePendingPayment(data) {
    try {
        sessionStorage.setItem(PENDING_KEY, JSON.stringify(data));
    } catch (e) {
        // មិនអាចរក្សាទុក
    }
}

function loadPendingPayment() {
    try {
        return JSON.parse(sessionStorage.getItem(PENDING_KEY));
    } catch (e) {
        return null;
    }
}

function clearPendingPayment() {
    try {
        sessionStorage.removeItem(PENDING_KEY);
    } catch (e) {
        // មិនអាចសម្អាត
    }
}

/* ===== ស្ថានភាពវេន =====
   ការបិទវេនត្រូវរក្សាទុក ដើម្បីឱ្យផ្ទាំងគិតលុយជាប់សោរពិតប្រាកដ
   មិនមែនត្រឹមសារជូនដំណឹងប៉ុណ្ណោះ (ឯកសាររចនាលេខ 01 ផ្នែក 3.3)។
   អ្នកគិតលុយមិនអាចបើកវេនឡើងវិញបានទេ — នោះជាសិទ្ធិរបស់អ្នកគ្រប់គ្រងទូទៅ។ */

const SHIFT_STATE_KEY = 'pos_shift_state_v2';

function shiftState() {
    try {
        const raw = JSON.parse(localStorage.getItem(SHIFT_STATE_KEY));
        if (raw && raw.shiftId === SHIFT.id) return raw;
    } catch (e) {
        // ការផ្ទុកមិនអាចអានបាន — ចាត់ទុកវេនជាបើក
    }
    return { shiftId: SHIFT.id, status: 'open' };
}

function isShiftOpen() {
    return shiftState().status !== 'closed';
}

function recordShiftClose(detail) {
    const payload = {
        shiftId: SHIFT.id,
        status: 'closed',
        closedAt: isoLocal(new Date()),
        ...detail
    };
    try {
        localStorage.setItem(SHIFT_STATE_KEY, JSON.stringify(payload));
    } catch (e) {
        // មិនអាចរក្សាទុក — ការបិទវេននៅរស់ត្រឹមទំព័របច្ចុប្បន្ន
    }
    return payload;
}

/* ប្រើដោយប៊ូតុង «កំណត់ទិន្នន័យគំរូឡើងវិញ» នៅទំព័រចូលប្រើ */
function resetShiftState() {
    try {
        localStorage.removeItem(SHIFT_STATE_KEY);
        sessionStorage.removeItem(SALES_KEY);
        sessionStorage.removeItem(CART_KEY);
        sessionStorage.removeItem(PENDING_KEY);
    } catch (e) {
        // មិនអាចសម្អាត
    }
}

/* រយៈពេលបើកវេនគិតជាម៉ោង និងនាទី */
function shiftDuration() {
    const ms = Math.max(new Date() - new Date(SHIFT.openedAt), 0);
    return { hours: Math.floor(ms / 3600000), minutes: Math.floor(ms / 60000) % 60 };
}

/* ===== សង្ខេបវេន (X/Z Report) ===== */

function shiftSummary() {
    const sales = shiftSales();
    const totals = sales.reduce((acc, s) => {
        const t = saleTotals(s.items, s.discountPercent);
        acc.gross += t.gross;
        acc.net += t.net;
        acc.vat += t.vat;
        acc.discount += t.discount;
        acc.usdCash += s.pay.usdCash;
        acc.khrCash += s.pay.khrCash;
        acc.khqr += s.pay.khqr;
        acc.qty += t.qty;
        return acc;
    }, { gross: 0, net: 0, vat: 0, discount: 0, usdCash: 0, khrCash: 0, khqr: 0, qty: 0 });

    return {
        ...totals,
        count: sales.length,
        avgTicket: sales.length ? totals.gross / sales.length : 0,
        expectedUSD: SHIFT.openingFloatUSD + totals.usdCash,
        expectedKHR: SHIFT.openingFloatKHR + totals.khrCash
    };
}

/* មុខទំនិញលក់ដាច់ក្នុងវេន */
function topSellers(limit = 5) {
    const tally = {};
    shiftSales().forEach(s => {
        s.items.forEach(it => {
            tally[it.sku] = (tally[it.sku] || 0) + it.qty;
        });
    });
    return Object.keys(tally)
        .map(sku => ({ product: getProduct(sku), qty: tally[sku] }))
        .filter(r => r.product)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, limit);
}

/* ផ្លាកលេខក្នុងម៉ឺនុយចំហៀង (ហៅដោយ portal.js) */
function totalPending() {
    return shiftSales().length;
}

/* ===== ស្តុកនៅសល់ក្នុងវេន ===== */

/* ចំនួនដែលបានលក់រួចក្នុងវេននេះ */
function soldQty(sku) {
    return shiftSales().reduce((sum, s) =>
        sum + s.items.filter(i => i.sku === sku).reduce((n, i) => n + i.qty, 0), 0);
}

/* ស្តុកដែលនៅអាចលក់បាន — ស្តុកដើមដកចេញនូវអ្វីដែលលក់រួច */
function availableStock(sku) {
    const p = getProduct(sku);
    return p ? Math.max(p.stock - soldQty(sku), 0) : 0;
}

/* ===== ទម្រង់វិក្កយបត្រក្រដាសកម្តៅ 80mm =====
   ប្រើរួមគ្នាដោយផ្ទាំងគិតលុយ និងទំព័របោះពុម្ពឡើងវិញ ដូច្នេះទម្រង់ដូចគ្នាជានិច្ច */
function receiptHtml(sale, options) {
    const opts = options || {};
    const t = saleTotals(sale.items, sale.discountPercent);
    const paid = paidTotal(sale.pay);
    const change = paid - t.gross;

    const row = (label, value, strong) => `
        <div style="display:flex;justify-content:space-between;gap:8px;${strong ? 'font-weight:600;padding-top:4px;border-top:1px dashed #94a3b8;' : ''}">
            <span>${label}</span><span>${value}</span>
        </div>`;

    const items = sale.items.map(l => {
        const p = getProduct(l.sku);
        return `
            <div style="margin-bottom:6px;">
                <div>${p.name}</div>
                <div style="display:flex;justify-content:space-between;gap:8px;color:#475569;">
                    <span>${l.qty} ${p.unit} × ${fmtUSD(p.price)}</span>
                    <span>${fmtUSD(lineTotal(l))}</span>
                </div>
            </div>`;
    }).join('');

    const payLines = [
        sale.pay.usdCash > 0 ? row(PAY_LABEL.usdCash, fmtUSD(sale.pay.usdCash)) : '',
        sale.pay.khrCash > 0 ? row(PAY_LABEL.khrCash, fmtKHR(sale.pay.khrCash)) : '',
        sale.pay.khqr > 0 ? row(PAY_LABEL.khqr, fmtUSD(sale.pay.khqr)) : '',
        change > 0.005 ? row('ប្រាក់អាប់', `${fmtUSD(change)} · ${fmtKHR(toKHR(change))}`) : ''
    ].join('');

    const customer = sale.customerId ? getCreditCustomer(sale.customerId) : null;

    return `
        <div style="width:72mm;margin:0 auto;font-family:'Kantumruy Pro',sans-serif;font-size:12px;line-height:1.5;color:#0f172a;">
            <div style="text-align:center;padding-bottom:8px;border-bottom:1px dashed #94a3b8;">
                <div style="font-size:15px;font-weight:700;">DIGITECHKH RETAIL</div>
                <div style="color:#475569;">${SHIFT.branch}</div>
                <div style="color:#475569;">លេខអត្តសញ្ញាណកម្មអាករ ${MERCHANT.tin}</div>
                <div style="color:#475569;">ទូរស័ព្ទ 023 999 888</div>
            </div>

            <div style="padding:8px 0;border-bottom:1px dashed #94a3b8;">
                ${row('លេខវិក្កយបត្រ', sale.id)}
                ${row('កាលបរិច្ឆេទ', fmtKhDate(sale.time))}
                ${row('ម៉ោង', fmtTime(sale.time))}
                ${row('អ្នកគិតលុយ', SHIFT.cashier)}
                ${row('ម៉ាស៊ីន', SHIFT.terminal)}
                ${customer ? row('អតិថិជន', customer.name) : ''}
            </div>

            <div style="padding:8px 0;border-bottom:1px dashed #94a3b8;">${items}</div>

            <div style="padding:8px 0;border-bottom:1px dashed #94a3b8;">
                ${row('ចំនួនឯកតា', t.qty)}
                ${t.discount > 0.005 ? row('តម្លៃមុនបញ្ចុះ', fmtUSD(t.list)) : ''}
                ${t.discount > 0.005 ? row(`ការបញ្ចុះតម្លៃ ${t.discountPercent}%`, '− ' + fmtUSD(t.discount)) : ''}
                ${row('តម្លៃមុនអាករ', fmtUSD(t.net))}
                ${row('អាករលើតម្លៃបន្ថែម 10%', fmtUSD(t.vat))}
                ${row('សរុបត្រូវបង់', fmtUSD(t.gross), true)}
                ${row('គិតជារៀល', fmtKHR(toKHR(t.gross)))}
            </div>

            <div style="padding:8px 0;border-bottom:1px dashed #94a3b8;">${payLines}</div>

            <div style="text-align:center;padding-top:10px;color:#475569;">
                <div>អត្រាប្តូរប្រាក់ 1 ដុល្លារ = ${FX_RATE.toLocaleString('en-US')} ៛</div>
                <div style="margin-top:6px;font-weight:600;color:#0f172a;">សូមអរគុណ · ជួបគ្នាពេលក្រោយ</div>
                ${opts.reprint ? '<div style="margin-top:6px;font-weight:600;">-- បោះពុម្ពឡើងវិញ --</div>' : ''}
            </div>
        </div>`;
}

/* ===== ការជូនដំណឹងសម្រាប់ក្បាលទំព័រ =====
   បង្កើតចេញពីទិន្នន័យវេនពិតប្រាកដ មិនមែនបញ្ជីថេរឡើយ */
function portalNotifications() {
    const list = [];
    const s = shiftSummary();

    // ទំនិញជិតអស់ស្តុក
    const low = PRODUCTS
        .map(p => ({ p, left: availableStock(p.sku) }))
        .filter(x => x.left <= 5)
        .sort((a, b) => a.left - b.left);

    low.slice(0, 3).forEach(x => {
        list.push({
            icon: x.left === 0 ? 'mdi:package-variant-remove' : 'mdi:alert-outline',
            tone: x.left === 0 ? 'danger' : 'warning',
            title: x.left === 0 ? `${x.p.name} អស់ស្តុក` : `${x.p.name} នៅសល់ ${x.left} ${x.p.unit}`,
            note: x.left === 0 ? 'មិនអាចលក់បន្ថែមបានទេ' : 'សូមជូនដំណឹងដល់ផ្នែកឃ្លាំង'
        });
    });

    // ព័ត៌មានវេនបច្ចុប្បន្ន
    const d = shiftDuration();
    if (!isShiftOpen()) {
        list.unshift({
            icon: 'mdi:lock-outline',
            tone: 'danger',
            title: `វេន ${SHIFT.id} ត្រូវបានបិទ`,
            note: 'សូមទាក់ទងអ្នកគ្រប់គ្រងទូទៅ ដើម្បីបើកវេនថ្មី'
        });
        return list;
    }

    list.push({
        icon: 'mdi:clock-outline',
        tone: 'info',
        title: `វេន ${SHIFT.terminal} បើកបាន ${d.hours} ម៉ោង ${d.minutes} នាទី`,
        note: `បើកម៉ោង ${fmtTime(SHIFT.openedAt)} · លក់បាន ${s.count} វិក្កយបត្រ`,
        time: fmtKhDate(SHIFT.openedAt)
    });

    // រំលឹកបិទវេន
    if (d.hours >= 6) {
        list.push({
            icon: 'mdi:cash-lock-open',
            tone: 'warning',
            title: 'ដល់ពេលត្រៀមបិទវេនហើយ',
            note: `រំពឹងទុកក្នុងថត ${fmtUSD(s.expectedUSD)} និង ${fmtKHR(s.expectedKHR)}`
        });
    }

    return list;
}

/* ===== កូដ KHQR បាគង (គំរូសាកល្បង) ===== */

const MERCHANT = {
    name: 'DIGITECHKH RETAIL',
    account: 'digitechkh@aclb',
    city: 'PHNOM PENH',
    tin: 'K001-901234567'
};

function buildKhqrPayload(receiptId, amount) {
    const amt = Number(amount).toFixed(2);
    return [
        '00020101',
        `0212${MERCHANT.account}`,
        '5303840',
        `54${String(amt.length).padStart(2, '0')}${amt}`,
        '5802KH',
        `59${String(MERCHANT.name.length).padStart(2, '0')}${MERCHANT.name}`,
        `60${String(MERCHANT.city.length).padStart(2, '0')}${MERCHANT.city}`,
        `62${String(receiptId.length + 4).padStart(2, '0')}01${String(receiptId.length).padStart(2, '0')}${receiptId}`
    ].join('');
}
