/* ===== សកម្មភាពលើបុគ្គលិក (ទំព័របុគ្គលិក និងទំព័រមើលបុគ្គលិក) =====
   មានតែម្ចាស់ហាងប៉ុណ្ណោះដែលកែឈ្មោះ ប្តូរតួនាទី កំណត់លេខសម្ងាត់ ឬផ្អាកគណនី។
   ទំព័រនីមួយៗកំណត់ renderAll() ដើម្បីគូរឡើងវិញបន្ទាប់ពីការកែ។
   ម្ចាស់ហាងមិនស្ថិតក្នុងតារាងបៀវត្សរ៍ទេ ដូច្នេះគ្មានប្រាក់ខែ ឬព័ត៌មានធនាគារ។ */

const ROLE_DESC = {
    cashier: 'លក់ ទទួលប្រាក់ បើក និងបិទវេនខ្លួនឯង',
    manager: 'អនុម័ត ត្រួតពិនិត្យវេន កាលវិភាគ និងអត្រាប្ដូរប្រាក់',
    admin: 'ប្រាក់ចំណេញ បុគ្គលិក តម្លៃទំនិញ និងច្បាប់ហាង'
};
const ROLE_ICON = { admin: 'fa-crown', manager: 'fa-user-shield', cashier: 'fa-cash-register' };
const DOW_KH = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];

function staffRefresh() {
    if (typeof window.renderAll === 'function') window.renderAll();
}

function findStaff(id) {
    return loadStaff().find(p => p.id === id);
}

/* ម្ចាស់ហាងមិនបើកប្រាក់ខែតាមតារាងបៀវត្សរ៍ */
function staffOnPayroll(p) {
    return !!p && p.role !== 'admin';
}

function staffAvatar(p, cls) {
    return `<span class="${cls || 'w-9 h-9'} rounded-full overflow-hidden inline-flex items-center justify-center flex-shrink-0 bg-slate-200 text-slate-600 font-semibold text-[11px] relative ${p.active ? '' : 'grayscale opacity-60'}">${p.initials}<img src="${avatarSrc(p.id)}" alt="" class="absolute inset-0 w-full h-full object-cover" onerror="this.remove()"></span>`;
}

function staffShiftText(p) {
    const d = (posSettings().staffDefaults || {})[p.id];
    const t = d && shiftTemplates().find(x => x.code === d.template);
    if (!t) return `<span class="text-slate-400">${{ cashier: 'មិនទាន់កំណត់', manager: 'ជំនួសពេលចាំបាច់', admin: 'មិនឈរបញ្ជរ' }[p.role]}</span>`;
    return `<span class="text-slate-700">${t.name} <span class="sm-figure">${t.start}–${t.end}</span></span><span class="block sm-td-sub text-slate-400">ឈប់ថ្ងៃ${DOW_KH[Number(d.dayOff) || 0]}</span>`;
}

function staffStatusChip(p) {
    return p.active
        ? '<span class="sm-badge inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-white text-slate-700 border-slate-200"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>សកម្ម</span>'
        : '<span class="sm-badge inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-slate-100 text-slate-500 border-slate-200"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>បានផ្អាក</span>';
}

function staffMenuItem(icon, label, act, id, danger) {
    return `<button type="button" onclick="closeAllFloatingDropdowns(); ${act}('${id}')" class="sm-row-menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50'}">
        <i class="fas ${icon} w-4 text-center text-[13px] ${danger ? '' : 'text-slate-400'}"></i>${label}</button>`;
}

/* ម៉ឺនុយ ⋮ · opts.view = បន្ថែម «មើលព័ត៌មាន» (ទំព័របញ្ជី) · opts.noProfile = មានប៊ូតុង «កែព័ត៌មាន» នៅខាងក្រៅរួចហើយ */
function staffMenu(p, mid, opts) {
    opts = opts === true ? { view: true } : (opts || {});
    const sep = '<div class="h-px bg-slate-100 my-1"></div>';
    const items = (opts.view ? [staffMenuItem('fa-id-card', 'មើលព័ត៌មាន', 'openStaff', p.id), sep] : [])
        .concat(p.active ? [
            opts.noProfile ? '' : staffMenuItem('fa-pen', 'កែព័ត៌មាន', 'editProfile', p.id),
            staffMenuItem('fa-user-shield', 'ប្តូរតួនាទី', 'changeRole', p.id),
            staffMenuItem('fa-key', 'ពាក្យសម្ងាត់ និងលេខសម្ងាត់', 'resetAccess', p.id)
        ].concat(staffOnPayroll(p) ? [staffMenuItem('fa-money-bill-wave', 'ប្រាក់ខែ និងធនាគារ', 'editCompensation', p.id)] : [])
         .concat([sep, staffMenuItem('fa-user-slash', 'ផ្អាកគណនី', 'deactivate', p.id, true)])
            : [staffMenuItem('fa-user-check', 'បើកគណនីវិញ', 'reactivate', p.id)]);
    return `<div id="${mid}" class="hidden bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 text-left min-w-[240px]">${items.join('')}</div>`;
}

function openStaff(id) {
    location.href = `view-staff.html?id=${encodeURIComponent(id)}`;
}

/* ===== ផ្ទៀងផ្ទាត់ ===== */

function nameError(name) {
    if (name.length < 2) return 'សូមបញ្ចូលឈ្មោះពេញ';
    if (/[A-Za-z]/.test(name)) return 'សូមវាយឈ្មោះជាអក្សរខ្មែរ';
    return '';
}

function initialsOf(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('');
}

function pinError(pin, exceptId) {
    if (!new RegExp(`^\\d{${POS_PIN_LEN}}$`).test(pin)) return `លេខសម្ងាត់ត្រូវមានលេខ ${POS_PIN_LEN} ខ្ទង់`;
    if (/^(\d)\1+$/.test(pin) || '0123456789'.includes(pin) || '9876543210'.includes(pin)) return 'លេខសម្ងាត់នេះងាយទាយពេក · សូមជ្រើសលេខផ្សេង';
    if (pinTaken(pin, exceptId)) return 'លេខសម្ងាត់នេះមានអ្នកប្រើរួចហើយ';
    return '';
}

/* គណនីចូលប្រើ៖ ត្រូវមានលេខទូរស័ព្ទ ឬអ៊ីមែលយ៉ាងហោចណាស់មួយ · មិនជាន់អ្នកផ្សេង */
function accountError(phone, email, exceptId) {
    if (!phone && !email) return 'សូមបញ្ចូលលេខទូរស័ព្ទ ឬអ៊ីមែល ដើម្បីចូលប្រើ';
    if (phone && normPhone(phone).length < 9) return 'លេខទូរស័ព្ទមិនគ្រប់ខ្ទង់ · ឧ. 012 345 678';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវ';
    if (accountTaken('phone', phone, exceptId)) return 'លេខទូរស័ព្ទនេះមានបុគ្គលិកផ្សេងប្រើរួចហើយ';
    if (accountTaken('email', email, exceptId)) return 'អ៊ីមែលនេះមានបុគ្គលិកផ្សេងប្រើរួចហើយ';
    return '';
}

function passwordError(pw) {
    if (String(pw).length < 6) return 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច 6 តួ';
    if (!/\d/.test(pw) || !/[A-Za-z]/.test(pw)) return 'ពាក្យសម្ងាត់ត្រូវមានទាំងអក្សរ និងលេខ';
    return '';
}

function randomPassword() {
    const letters = 'abcdefghjkmnpqrstuvwxyz';
    let s = '';
    for (let i = 0; i < 5; i++) s += letters[Math.floor(Math.random() * letters.length)];
    return s + String(100 + Math.floor(Math.random() * 900));
}

async function showNewPassword(p, pw) {
    await showCustomConfirm({
        title: `ពាក្យសម្ងាត់របស់ ${p.name}`,
        message: `<span class="block text-2xl font-semibold tracking-wider text-slate-800 my-3 sm-figure">${pw}</span>សូមប្រាប់ផ្ទាល់ ហើយឱ្យគាត់ចងចាំ · ពាក្យនេះនឹងមិនបង្ហាញម្តងទៀតទេ`,
        confirmText: 'បានប្រាប់រួច',
        hideCancel: true,
        type: 'success'
    });
}

function randomPin(exceptId) {
    let pin;
    do { pin = String(100000 + Math.floor(Math.random() * 900000)); } while (pinError(pin, exceptId));
    return pin;
}

async function showNewPin(p, pin) {
    await showCustomConfirm({
        title: `លេខសម្ងាត់របស់ ${p.name}`,
        message: `<span class="block text-3xl font-semibold tracking-[.35em] text-slate-800 my-3 sm-figure">${pin}</span>សូមប្រាប់ផ្ទាល់មាត់ ហើយឱ្យគាត់ចងចាំ · លេខនេះនឹងមិនបង្ហាញម្តងទៀតទេ`,
        confirmText: 'បានប្រាប់រួច',
        hideCancel: true,
        type: 'success'
    });
}

function activeAdmins() {
    return loadStaff().filter(p => p.active && p.role === 'admin');
}

function openShiftOf(id) {
    return liveShifts().find(s => s.cashierId === id && s.status === 'open');
}

/* ===== សកម្មភាព ===== */

/* ឈ្មោះ លេខទូរស័ព្ទ និងអ៊ីមែល ក្នុងផ្ទាំងតែមួយ */
async function editProfile(id) {
    const p = findStaff(id);
    const v = await showFormDialog({
        title: 'កែព័ត៌មាន', icon: 'fa-pen',
        message: `${p.name} · ឈ្មោះបង្ហាញលើវិក្កយបត្រ និងរបាយការណ៍ · ទូរស័ព្ទ ឬអ៊ីមែលប្រើសម្រាប់ចូលប្រើ`,
        fields: [
            { key: 'name', label: 'ឈ្មោះពេញ', value: p.name },
            { key: 'phone', label: 'លេខទូរស័ព្ទ', value: p.phone || '', hint: 'ឧ. 012 345 678' },
            { key: 'email', label: 'អ៊ីមែល', value: p.email || '', hint: 'មិនចាំបាច់' }
        ],
        validate: x => nameError(x.name) || accountError(x.phone, x.email, id)
            || (x.name === p.name && x.phone === (p.phone || '') && x.email.toLowerCase() === (p.email || '') ? 'មិនបានប្តូរអ្វីទេ' : '')
    });
    if (!v) return;
    const patch = { phone: v.phone, email: v.email.toLowerCase() };
    const notes = [];
    if (v.name !== p.name) { Object.assign(patch, { name: v.name, initials: initialsOf(v.name) }); notes.push(`ប្តូរឈ្មោះ ${p.name} → ${v.name}`); }
    if (v.phone !== (p.phone || '') || patch.email !== (p.email || '')) notes.push(`កែគណនីចូលប្រើរបស់ ${v.name}`);
    updateStaff(id, patch, notes.join(' · '));
    staffRefresh();
    showToast('បានរក្សាទុកព័ត៌មាន');
}

/* ពាក្យសម្ងាត់ (ចូលប្រើ) ឬលេខសម្ងាត់ (អនុម័ត និងដោះសោ) */
async function resetAccess(id) {
    const p = findStaff(id);
    const kind = await showOptionDialog({
        title: `កំណត់ថ្មីសម្រាប់ ${p.name}`,
        message: 'ជ្រើសអ្វីដែលត្រូវកំណត់ថ្មី · ចាស់ឈប់ដំណើរការភ្លាមៗ',
        options: [
            { value: 'password', label: 'ពាក្យសម្ងាត់', desc: 'ចូលប្រើប្រព័ន្ធជាមួយលេខទូរស័ព្ទ ឬអ៊ីមែល', icon: 'fa-lock' },
            { value: 'pin', label: 'លេខសម្ងាត់ 6 ខ្ទង់', desc: 'អនុម័តលើបញ្ជរ និងដោះសោផ្ទាំងគិតលុយ', icon: 'fa-key' }
        ]
    });
    if (kind === 'password') resetPassword(id);
    else if (kind === 'pin') resetPin(id);
}

async function changeRole(id) {
    const p = findStaff(id);
    const role = await showOptionDialog({
        title: `ប្តូរតួនាទីរបស់ ${p.name}`,
        message: `បច្ចុប្បន្ន៖ ${ROLE_NAME[p.role]}`,
        options: ['cashier', 'manager', 'admin'].filter(r => r !== p.role).map(r => ({ value: r, label: ROLE_NAME[r], desc: ROLE_DESC[r], icon: ROLE_ICON[r] }))
    });
    if (!role) return;
    if (p.role === 'admin' && activeAdmins().length <= 1) {
        showToast('ហាងត្រូវមានម្ចាស់ហាងយ៉ាងហោចណាស់ម្នាក់ · សូមបន្ថែមម្នាក់ទៀតជាមុនសិន', 'error');
        return;
    }
    const reason = await showReasonPicker({
        title: 'មូលហេតុប្តូរតួនាទី',
        message: `${p.name}៖ ${ROLE_NAME[p.role]} → ${ROLE_NAME[role]}${role === 'admin' ? ' · ម្ចាស់ហាងមិនស្ថិតក្នុងតារាងបៀវត្សរ៍' : ''}`,
        reasons: ['ដំឡើងតំណែង', 'ផ្លាស់ប្តូរការងារ', 'ជួយការងារបណ្តោះអាសន្ន'],
        confirmText: 'ប្តូរតួនាទី'
    });
    if (!reason) return;
    updateStaff(id, { role }, `ប្តូរតួនាទី ${p.name}៖ ${ROLE_NAME[p.role]} → ${ROLE_NAME[role]} · ${reason}`);
    if (id === ME_MANAGER) {
        showToast('តួនាទីរបស់លោកអ្នកបានប្តូរ · សូមចូលប្រើម្តងទៀត', 'warning');
        setTimeout(() => { posLogout(); location.href = '../../index.html'; }, 1400);
        return;
    }
    staffRefresh();
    showToast(`${p.name} ឥឡូវជា${ROLE_NAME[role]}`);
    // ចេញពីម្ចាស់ហាងមកជាបុគ្គលិក៖ មិនទាន់មានប្រាក់ខែ · សួរភ្លាមដើម្បីកុំឱ្យតារាងបៀវត្សរ៍ចេញ $0
    if (role !== 'admin' && !(Number(getStaffCompensation(id).baseSalaryUSD) > 0)) editCompensation(id);
}

async function resetPin(id) {
    const p = findStaff(id);
    const v = await showFormDialog({
        title: `លេខសម្ងាត់ថ្មីសម្រាប់ ${p.name}`, icon: 'fa-key',
        message: 'លេខសម្ងាត់ 6 ខ្ទង់ សម្រាប់អនុម័ត និងដោះសោផ្ទាំងគិតលុយ · លេខចាស់ឈប់ដំណើរការភ្លាមៗ',
        fields: [{ key: 'pin', label: 'លេខសម្ងាត់ថ្មី', value: randomPin(id), type: 'pin', hint: 'បង្កើតដោយស្វ័យប្រវត្តិ · អាចវាយលេខផ្សេងបាន' }],
        confirmText: 'កំណត់',
        validate: x => pinError(x.pin, id) || (x.pin === (posRead('pos_pins', {})[id] || p.pin) ? 'នេះជាលេខសម្ងាត់បច្ចុប្បន្ន' : '')
    });
    if (!v) return;
    setStaffPin(id, v.pin);
    staffRefresh();
    showToast('បានកំណត់លេខសម្ងាត់ថ្មី');
    await showNewPin(p, v.pin);
}

async function resetPassword(id) {
    const p = findStaff(id);
    const v = await showFormDialog({
        title: `ពាក្យសម្ងាត់ថ្មីសម្រាប់ ${p.name}`, icon: 'fa-lock',
        message: 'ពាក្យសម្ងាត់ចាស់ឈប់ដំណើរការភ្លាមៗ',
        fields: [{ key: 'pw', label: 'ពាក្យសម្ងាត់ថ្មី', value: randomPassword(), hint: 'បង្កើតដោយស្វ័យប្រវត្តិ · យ៉ាងតិច 6 តួ មានអក្សរ និងលេខ' }],
        confirmText: 'កំណត់',
        validate: x => passwordError(x.pw) || (x.pw === effectivePassword(id) ? 'នេះជាពាក្យសម្ងាត់បច្ចុប្បន្ន' : '')
    });
    if (!v) return;
    setStaffPassword(id, v.pw);
    staffRefresh();
    showToast('បានកំណត់ពាក្យសម្ងាត់ថ្មី');
    await showNewPassword(p, v.pw);
}

async function editLimit(id) {
    const p = findStaff(id);
    const cur = discountLimitFor(id);
    const v = await showFormDialog({
        title: 'ដែនកំណត់បញ្ចុះតម្លៃ', icon: 'fa-percent',
        message: `${p.name} អាចបញ្ចុះតម្លៃដោយខ្លួនឯងរហូតដល់កម្រិតនេះ · លើសពីនេះត្រូវការលេខសម្ងាត់អ្នកគ្រប់គ្រង`,
        fields: [{ key: 'limit', label: 'ភាគរយអតិបរមា', value: String(cur), type: 'number', suffix: '%', hint: '0 = ត្រូវសុំការអនុម័តរាល់ពេល' }],
        validate: x => !(x.limit !== '' && Number(x.limit) >= 0 && Number(x.limit) <= 20) ? 'សូមបញ្ចូលចន្លោះ 0 ដល់ 20%' : Number(x.limit) === cur ? 'តម្លៃមិនបានប្តូរ' : ''
    });
    if (!v) return;
    const limits = clone(posSettings().discountLimits || {});
    limits[id] = Number(v.limit);
    savePosSettings({ discountLimits: limits }, ME_MANAGER);
    staffRefresh();
    showToast(`${p.name} បញ្ចុះបានរហូតដល់ ${Number(v.limit)}%`);
}

async function editCompensation(id) {
    const p = findStaff(id);
    if (!staffOnPayroll(p)) {
        showToast('ម្ចាស់ហាងមិនស្ថិតក្នុងតារាងបៀវត្សរ៍ទេ', 'info');
        return;
    }
    const comp = getStaffCompensation(id);
    const v = await showFormDialog({
        title: `ប្រាក់ខែ ${p.name}`,
        icon: 'fa-money-bill-wave',
        message: 'ប្រាក់ខែគោល ប្រាក់ឧបត្ថម្ភ និងគណនីធនាគារសម្រាប់ផ្ទេរប្រាក់ខែ',
        fields: [
            { key: 'baseSalary', label: 'ប្រាក់ខែគោល', value: String(comp.baseSalaryUSD || ''), type: 'number', prefix: '$', hint: 'គិតលើ 208 ម៉ោងក្នុងមួយខែ' },
            { key: 'foodAllowance', label: 'ប្រាក់ឧបត្ថម្ភថ្លៃបាយ', value: String(comp.foodAllowanceUSD != null ? comp.foodAllowanceUSD : '30'), type: 'number', prefix: '$' },
            { key: 'attendanceBonus', label: 'ប្រាក់រង្វាន់ឧស្សាហ៍', value: String(comp.attendanceBonusUSD != null ? comp.attendanceBonusUSD : '15'), type: 'number', prefix: '$' },
            { key: 'bankName', label: 'ធនាគារ', value: comp.bankName || 'ABA Bank' },
            { key: 'accountNumber', label: 'លេខគណនី', value: comp.accountNumber || '', hint: 'ឧ. 000 123 456' },
            { key: 'accountName', label: 'ឈ្មោះគណនី', value: comp.accountName || p.name }
        ],
        preview: vals => {
            const base = Number(vals.baseSalary) || 0;
            const hr = base / PAY_RULES.monthHours;
            const line = (label, mult) => `<div class="flex justify-between text-slate-600"><span>${label}</span><span class="font-semibold text-slate-800 sm-figure">$${(hr * mult).toFixed(2)}</span></div>`;
            return `<div class="p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                ${line('មួយម៉ោងធម្មតា', 1)}
                ${line('មួយម៉ោងបន្ថែម · 150%', PAY_RULES.otMult)}
                ${line('មួយម៉ោងយប់ ឬថ្ងៃឈប់ · 200%', PAY_RULES.nightMult)}
                ${line('កាត់អវត្តមានមួយថ្ងៃ', PAY_RULES.monthHours / PAY_RULES.workDays)}
            </div>`;
        },
        confirmText: 'រក្សាទុក',
        validate: x => !(Number(x.baseSalary) > 0) ? 'សូមបញ្ចូលប្រាក់ខែគោល' : ''
    });
    if (!v) return;
    saveStaffCompensation(id, {
        baseSalaryUSD: Number(v.baseSalary),
        foodAllowanceUSD: Number(v.foodAllowance) || 0,
        attendanceBonusUSD: Number(v.attendanceBonus) || 0,
        bankName: v.bankName,
        accountNumber: v.accountNumber,
        accountName: v.accountName
    }, `កែប្រាក់ខែ ${p.name} ($${Number(v.baseSalary)})`);
    staffRefresh();
    showToast(`បានរក្សាទុកប្រាក់ខែ ${p.name}`);
}

async function deactivate(id) {
    const p = findStaff(id);
    if (id === ME_MANAGER) { showToast('លោកអ្នកមិនអាចផ្អាកគណនីខ្លួនឯងបានទេ', 'error'); return; }
    if (p.role === 'admin' && activeAdmins().length <= 1) { showToast('ហាងត្រូវមានម្ចាស់ហាងយ៉ាងហោចណាស់ម្នាក់', 'error'); return; }
    const open = openShiftOf(id);
    if (open) { showToast(`${p.name} កំពុងបើកវេននៅ ${open.register} · សូមបិទវេនជាមុនសិន`, 'error'); return; }
    const reason = await showReasonPicker({
        title: `ផ្អាកគណនី ${p.name}`,
        message: 'គណនីនឹងមិនអាចចូលប្រើបានទៀតទេ · ប្រវត្តិលក់នៅដដែល',
        reasons: ['លាឈប់', 'ផ្អាកការងារបណ្តោះអាសន្ន', 'បញ្ហាសុវត្ថិភាព'],
        confirmText: 'ផ្អាកគណនី',
        danger: true
    });
    if (!reason) return;
    updateStaff(id, { active: false }, `ផ្អាកគណនី ${p.name} · ${reason}`);
    staffRefresh();
    const d = (posSettings().staffDefaults || {})[id];
    const t = d && shiftTemplates().find(x => x.code === d.template);
    if (t) showToast(`បានផ្អាក · ${t.name} ខ្វះអ្នកប្រចាំម្នាក់ · សូមចាត់តាំងនៅកាលវិភាគវេន`, 'warning', 6000);
    else showToast(`បានផ្អាកគណនី ${p.name}`);
}

async function reactivate(id) {
    const p = findStaff(id);
    const ok = await showCustomConfirm({ title: `បើកគណនី ${p.name} វិញ?`, message: 'គាត់អាចចូលប្រើដោយលេខសម្ងាត់ចាស់', confirmText: 'បើកវិញ', type: 'success' });
    if (!ok) return;
    const pin = posRead('pos_pins', {})[id] || p.pin;
    updateStaff(id, { active: true }, `បើកគណនី ${p.name} វិញ`);
    staffRefresh();
    if (pinTaken(pin, id)) {
        showToast('លេខសម្ងាត់ចាស់មានអ្នកផ្សេងប្រើហើយ · សូមកំណត់លេខថ្មី', 'warning');
        resetPin(id);
    } else showToast(`បានបើកគណនី ${p.name} វិញ`);
}
