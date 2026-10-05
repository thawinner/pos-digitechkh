/* ទំព័រការកំណត់ — ប្រើរួមដោយអ្នកគ្រប់គ្រង (manager/settings) និងម្ចាស់ហាង (admin/settings)
   ឯកសាររចនាលេខ 02 ផ្នែក 5.7 និងលេខ 03 (តួនាទីម្ចាស់ហាង)
   • អ្នកគ្រប់គ្រងកែបានតែការប្រចាំថ្ងៃ៖ អត្រាប្តូរប្រាក់ ទំនិញញឹកញាប់ បញ្ជីមូលហេតុ
   • ច្បាប់សាច់ប្រាក់ គំរូវេន និងដែនកំណត់បញ្ជរ ជាសិទ្ធិម្ចាស់ហាង (អ្នកគ្រប់គ្រងឃើញតែអាន)
   រចនា៖ ម៉ឺនុយផ្នែកខាងឆ្វេង · ជួរការកំណត់មួយៗ · តម្លៃដែលបានកែមានសញ្ញាចំណុច · រក្សាទុកដោយលេខសម្ងាត់ · កត់ត្រាប្រវត្តិ */

const IS_ADMIN_PAGE = document.body.id === 'adminPortal';

let draft = clone(posSettings());
let section = new URLSearchParams(location.search).get('s') || 'money';
const DOW_KH = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
const REASON_GROUPS = [['void', 'លុបចោលវិក្កយបត្រ', 'fa-ban'], ['return', 'ប្រគល់ទំនិញវិញ', 'fa-rotate-left'], ['discount', 'បញ្ចុះតម្លៃ', 'fa-tag'], ['payout', 'ដកប្រាក់ចំណាយ', 'fa-money-bill-transfer'], ['holdDiscard', 'បោះបង់ការលក់ព្យួរ', 'fa-pause']];

const ALL_SECTIONS = [
    { id: 'money', icon: 'fa-money-bill-transfer', label: 'អត្រាប្ដូរប្រាក់', keys: ['fxRate', 'nbcRate'] },
    { id: 'cash', icon: 'fa-vault', label: 'សាច់ប្រាក់ក្នុងថត', keys: ['varianceTolerance', 'drawerLimitUSD', 'drawerLimitKHR', 'defaultFloatUSD', 'defaultFloatKHR'], admin: true },
    { id: 'shifts', icon: 'fa-clock', label: 'គំរូវេន', keys: ['shiftTemplates'], admin: true },
    { id: 'till', icon: 'fa-cash-register', label: 'ដែនកំណត់បញ្ជរ', keys: ['khqrSeconds', 'holdLimit', 'discountLimits'], admin: true },
    { id: 'stock', icon: 'fa-boxes-stacked', label: 'ស្តុក', keys: ['allowNegativeStock', 'adjustLimitQty', 'adjustLimitUSD', 'countSchedule'], admin: true },
    { id: 'quick', icon: 'fa-bolt', label: 'ទំនិញញឹកញាប់', keys: ['quickKeys'] },
    { id: 'reasons', icon: 'fa-list-check', label: 'បញ្ជីមូលហេតុ', keys: ['reasons'] },
    { id: 'rules', icon: 'fa-lock', label: 'ច្បាប់ពីម្ចាស់ហាង', keys: [], managerOnly: true },
    { id: 'history', icon: 'fa-clock-rotate-left', label: 'ប្រវត្តិការកែប្រែ', keys: [] }
];
const SECTIONS = ALL_SECTIONS.filter(s => IS_ADMIN_PAGE ? !s.managerOnly : !s.admin);
if (!SECTIONS.some(x => x.id === section)) section = 'money';

/* ===== ជំនួយការ ===== */

/* តួនាទីនីមួយៗរក្សាទុកបានតែគ្រាប់ចុចនៃផ្នែករបស់ខ្លួន (អ្នកគ្រប់គ្រងមិនអាចប្តូរច្បាប់សាច់ប្រាក់) */
const EDITABLE_KEYS = SECTIONS.flatMap(s => s.keys);

function changedKeys() {
    const cur = posSettings();
    return Object.keys(draft).filter(k => EDITABLE_KEYS.includes(k) && JSON.stringify(cur[k]) !== JSON.stringify(draft[k]));
}

function isChanged(key) {
    return JSON.stringify(posSettings()[key]) !== JSON.stringify(draft[key]);
}

function fmtInt(n) {
    return Number(n || 0).toLocaleString('en-US');
}

function changedDot(key) {
    return isChanged(key) ? '<span class="w-2 h-2 rounded-full bg-amber-500 inline-block ml-1.5 align-middle" aria-label="បានកែ"></span>' : '';
}

/* ជួរការកំណត់៖ ស្លាក + ការពន្យល់ខាងឆ្វេង · ប្រអប់ខាងស្តាំ */
function row(key, label, help, control, note) {
    return `<div class="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-3 md:gap-8 py-5 border-b border-slate-100 last:border-0">
        <div class="min-w-0">
            <p class="sm-value text-slate-800">${label}${key ? changedDot(key) : ''}</p>
            <p class="sm-td-sub text-slate-500 mt-0.5">${help}</p>
        </div>
        <div>${control}${note ? `<p class="sm-td-sub text-slate-500 mt-1.5" id="note-${key}">${note}</p>` : ''}</div>
    </div>`;
}

/* ប្រអប់លេខមានក្បៀសខ្ទង់ពាន់ — វាយបានតែលេខ */
function numInput(key, unit, opts) {
    const o = opts || {};
    const v = draft[key];
    return `<div class="relative">
        ${o.prefix ? `<span class="absolute left-3.5 top-1/2 -translate-y-1/2 sm-value text-slate-400">${o.prefix}</span>` : ''}
        <input type="text" inputmode="decimal" value="${v === '' || v == null || (o.blankZero && !v) ? '' : fmtInt(v)}" placeholder="${o.placeholder || '0'}"
            oninput="numChanged('${key}', this)" onblur="this.value = draft['${key}'] || ${o.blankZero ? "''" : 0} ? fmtInt(draft['${key}']) : ''"
            class="sm-value w-full h-12 ${o.prefix ? 'pl-8' : 'pl-3.5'} pr-16 rounded-xl border ${isChanged(key) ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-slate-50'} text-right sm-figure focus:outline-none focus:border-indigo-500 focus:bg-white transition">
        <span class="absolute right-3.5 top-1/2 -translate-y-1/2 sm-td-sub text-slate-400">${unit}</span>
    </div>`;
}

function numChanged(key, el) {
    const raw = el.value.replace(/[^0-9.]/g, '');
    draft[key] = raw === '' ? 0 : Number(raw);
    refreshNotes();
    const pv = document.getElementById('fxPreview');
    if (pv && key === 'fxRate') pv.innerHTML = fxPreview();
    renderSaveBar();
}

/* ការពន្យល់ដែលប្រែប្រួលតាមតម្លៃ (សមមូលរូបិយប័ណ្ណ ការមើលជាមុន) */
function noteFor(key) {
    const r = draft.fxRate || 4100;
    switch (key) {
        case 'fxRate': return `ឧទាហរណ៍៖ $10.00 = ${fmtKHR(10 * r)} · $2.38 អាប់ជា ${fmtChange(splitChange(2.38, r, 'mixed'))}`;
        case 'nbcRate': return draft.nbcRate ? `ខុសពីអត្រាប្រើ ${fmtSigned(r - draft.nbcRate, n => fmtInt(n) + ' ៛', 0.5)}` : 'វាយអត្រាដែលធនាគារជាតិផ្សាយថ្ងៃនេះ ដើម្បីប្រៀបធៀប';
        case 'drawerLimitKHR': return `ប្រមាណ ${fmtUSD(draft.drawerLimitKHR / r)}`;
        case 'defaultFloatKHR': return `ប្រមាណ ${fmtUSD(draft.defaultFloatKHR / r)} · សរុបបាតថត ${fmtUSD(draft.defaultFloatUSD + draft.defaultFloatKHR / r)}`;
        case 'varianceTolerance': return `ខុសលើស ${fmtUSD(draft.varianceTolerance)} ត្រូវពន្យល់យ៉ាងតិច 20 តួអក្សរ ហើយអ្នកគ្រប់គ្រងត្រូវកត់ចំណាំ`;
        case 'khqrSeconds': return `${Math.floor(draft.khqrSeconds / 60)} នាទី ${draft.khqrSeconds % 60} វិនាទី · បាគងណែនាំមិនលើស 10 នាទី`;
        case 'adjustLimitQty': return 'លើសចំនួននេះ អ្នកគ្រប់គ្រងត្រូវកត់ត្រាមូលហេតុច្បាស់លាស់';
        case 'adjustLimitUSD': return 'លើសទឹកប្រាក់នេះ ត្រូវបង្ហាញជាករណីមិនប្រក្រតី';
        default: return '';
    }
}

function refreshNotes() {
    ['fxRate', 'nbcRate', 'drawerLimitKHR', 'defaultFloatKHR', 'varianceTolerance', 'khqrSeconds', 'adjustLimitQty', 'adjustLimitUSD'].forEach(k => {
        const el = document.getElementById('note-' + k);
        if (el) el.textContent = noteFor(k);
    });
}

function sectionHead(s, sub) {
    const keys = s.keys.filter(isChanged);
    return `<div class="px-5 sm:px-6 py-5 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3">
        <div><h3 class="sm-card-title text-slate-800">${s.label}</h3><p class="sm-card-sub text-slate-500">${sub}</p></div>
        ${s.keys.length ? `<button onclick="resetSection('${s.id}')" type="button" class="sm-badge h-9 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-semibold inline-flex items-center gap-2"><i class="fas fa-rotate-left text-[11px]"></i> លំនាំដើម</button>` : ''}
    </div>`;
}

/* ===== ផ្នែកនីមួយៗ ===== */

/* តម្លៃទូទៅជារៀល (បង្គត់ 100 ៛) — មើលឃើញភ្លាមពេលវាយអត្រាថ្មី */
function fxPreview() {
    const r = draft.fxRate || 4100;
    const cur = posSettings().fxRate || 4100;
    return `<table class="w-full sm-td sm-figure">
        <thead><tr class="sm-td-sub text-slate-400"><th class="text-left font-medium py-1.5">ដុល្លារ</th><th class="text-right font-medium">អត្រាបច្ចុប្បន្ន</th><th class="text-right font-medium">អត្រាថ្មី</th></tr></thead>
        <tbody>${[0.5, 1, 2.38, 5, 10, 20].map(a => {
            const was = Math.round(a * cur / 100) * 100;
            const now = Math.round(a * r / 100) * 100;
            return `<tr class="border-t border-slate-100"><td class="py-1.5 text-slate-700">${fmtUSD(a)}</td><td class="text-right text-slate-500">${fmtKHR(was)}</td>
                <td class="text-right font-semibold ${now === was ? 'text-slate-700' : 'text-amber-700'}">${fmtKHR(now)}</td></tr>`;
        }).join('')}</tbody>
    </table>`;
}

/* អត្រាដែលបានប្រើពិតប្រាកដក្នុងថ្ងៃប្រតិបត្តិការនីមួយៗ (យកពីវេន) */
function fxHistory() {
    const byDay = {};
    mgrAllShifts().forEach(x => { if (x.fxRate && !byDay[x.date]) byDay[x.date] = x.fxRate; });
    const days = Object.keys(byDay).sort().slice(-8);
    return days.slice(1).reverse().map(d => {
        const i = days.indexOf(d);
        const diff = byDay[d] - byDay[days[i - 1]];
        return `<tr class="border-t border-slate-100"><td class="py-1.5 text-slate-600">${fmtDate(d + 'T12:00')}</td>
            <td class="text-right font-semibold text-slate-700">${fmtInt(byDay[d])} ៛</td>
            <td class="text-right ${diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-rose-600' : 'text-slate-400'}">${diff ? (diff > 0 ? '+' : '−') + Math.abs(diff) : '0'}</td></tr>`;
    }).join('');
}

function renderMoney(s) {
    const last = settingsHistory().find(h => h.changes.some(c => c.key === 'fxRate'));
    return sectionHead(s, 'រាល់ការលក់ថ្មីបោះត្រាអត្រានេះ · វិក្កយបត្រចាស់រក្សាអត្រាដើម') + `<div class="px-5 sm:px-6">
        <div class="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-1 pb-5 border-b border-slate-100">
            <p class="sm-td-sub text-slate-500">កំពុងប្រើនៅគ្រប់បញ្ជរ</p>
            <p class="text-[26px] font-semibold text-slate-800 sm-figure leading-tight">1 ដុល្លារ = ${fmtInt(posSettings().fxRate)} ៛</p>
            <p class="sm-td-sub text-slate-500">${last ? `កែចុងក្រោយដោយ ${personName(last.by)} · ${fmtDate(last.at)} ${fmtTime(last.at)}` : 'តម្លៃលំនាំដើម · មិនទាន់មានអ្នកកែ'}</p>
        </div>
        ${row('fxRate', 'អត្រាប្រើនៅបញ្ជរ', 'ប្រើគណនាប្រាក់រៀលត្រូវបង់ និងប្រាក់អាប់ · ហាងភាគច្រើនប្រើ 4,000 ឬ 4,100', numInput('fxRate', '៛'), noteFor('fxRate'))}
        ${row('nbcRate', 'អត្រាផ្លូវការធនាគារជាតិ', 'ស្រេចចិត្ត · សម្រាប់ជាឯកសារយោងពេលត្រួតពិនិត្យ', numInput('nbcRate', '៛', { blankZero: true, placeholder: 'មិនបានកំណត់' }), noteFor('nbcRate'))}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 py-5">
            <div>
                <p class="sm-value text-slate-800">តម្លៃទូទៅជាប្រាក់រៀល</p>
                <p class="sm-td-sub text-slate-500 mb-2">បង្គត់ 100 ៛ ដូចនៅបញ្ជរ</p>
                <div id="fxPreview">${fxPreview()}</div>
            </div>
            <div>
                <p class="sm-value text-slate-800">អត្រាដែលបានប្រើ 7 ថ្ងៃចុងក្រោយ</p>
                <p class="sm-td-sub text-slate-500 mb-2">យកពីវេនដែលបានបើកក្នុងថ្ងៃនីមួយៗ</p>
                <table class="w-full sm-td sm-figure"><thead><tr class="sm-td-sub text-slate-400"><th class="text-left font-medium py-1.5">ថ្ងៃ</th><th class="text-right font-medium">អត្រា</th><th class="text-right font-medium">ប្រែប្រួល</th></tr></thead>
                <tbody>${fxHistory()}</tbody></table>
            </div>
        </div>
    </div>`;
}

function renderCash(s) {
    return sectionHead(s, 'ល្បឹមភាពខុសគ្នា ពិដានមុនផ្ទេរចូលទូដែក និងប្រាក់បាតថតស្តង់ដារ') + `<div class="px-5 sm:px-6">
        ${row('varianceTolerance', 'ល្បឹមភាពខុសគ្នាពេលបិទវេន', 'ខុសតិចជាងនេះ អ្នកគិតលុយគ្រាន់តែទទួលស្គាល់', numInput('varianceTolerance', 'ដុល្លារ', { prefix: '$' }), noteFor('varianceTolerance'))}
        ${row('drawerLimitUSD', 'ពិដានដុល្លារក្នុងថត', 'លើសនេះ ផ្ទាំងគិតលុយប្រាប់ឱ្យផ្ទេរចូលទូដែក', numInput('drawerLimitUSD', 'ដុល្លារ', { prefix: '$' }))}
        ${row('drawerLimitKHR', 'ពិដានរៀលក្នុងថត', 'ដូចខាងលើ សម្រាប់ថតរៀល', numInput('drawerLimitKHR', '៛'), noteFor('drawerLimitKHR'))}
        ${row('defaultFloatUSD', 'ប្រាក់បាតថតដុល្លារ', 'ចំនួនស្តង់ដារដែលចេញឱ្យបញ្ជរនីមួយៗពេលបើកវេន', numInput('defaultFloatUSD', 'ដុល្លារ', { prefix: '$' }))}
        ${row('defaultFloatKHR', 'ប្រាក់បាតថតរៀល', 'ក្រដាសប្រាក់តូចៗសម្រាប់អាប់', numInput('defaultFloatKHR', '៛'), noteFor('defaultFloatKHR'))}
    </div>`;
}

/* ម៉ោងដែលធ្លាក់ក្នុង 22:00–05:00 (ម៉ោងយប់តាមច្បាប់ការងារ) */
function nightHours(t) {
    let n = 0;
    let m = minutesOf(t.start);
    const span = templateHours(t) * 60;
    for (let i = 0; i < span; i += 30) {
        const x = (m + i) % 1440;
        if (x >= 1320 || x < 300) n += 0.5;
    }
    return n;
}

/* របារពេលវេលា 24 ម៉ោង — ឃើញភ្លាមថាម៉ោងណាគ្មានវេន ឬវេនជាន់គ្នា */
function timeline() {
    const colors = ['bg-amber-500', 'bg-cyan-500', 'bg-indigo-700', 'bg-emerald-500'];
    const segs = draft.shiftTemplates.flatMap((t, i) => {
        const s = minutesOf(t.start) / 1440 * 100;
        const e = minutesOf(t.end) / 1440 * 100;
        const bar = (l, w) => `<div class="absolute top-0 bottom-0 ${colors[i % 4]} rounded-md opacity-90 flex items-center justify-center overflow-hidden" style="left:${l}%;width:${w}%"><span class="text-[11px] text-white font-semibold truncate px-1">${escapeText(t.name)}</span></div>`;
        return e > s ? [bar(s, e - s)] : [bar(s, 100 - s), bar(0, e)];
    }).join('');
    return `<div class="mt-2">
        <div class="relative h-10 rounded-xl bg-slate-100 overflow-hidden">${segs}</div>
        <div class="flex justify-between mt-1 text-[11px] text-slate-400 sm-figure">${[0, 3, 6, 9, 12, 15, 18, 21, 24].map(h => `<span>${pad2(h)}:00</span>`).join('')}</div>
    </div>`;
}

function isMinuteInTemplate(m, t) {
    const s = minutesOf(t.start);
    const e = minutesOf(t.end);
    return s < e ? (m >= s && m < e) : (m >= s || m < e);
}

function timeStr(m) {
    const total = ((m % 1440) + 1440) % 1440;
    const h = Math.floor(total / 60);
    const mi = total % 60;
    return `${pad2(h)}:${pad2(mi)}`;
}

function shiftUnionHours(templates) {
    const minutes = new Uint8Array(1440);
    templates.forEach(t => {
        const s = minutesOf(t.start);
        const e = minutesOf(t.end);
        if (s < e) {
            for (let m = s; m < e; m++) minutes[m] = 1;
        } else if (s > e) {
            for (let m = s; m < 1440; m++) minutes[m] = 1;
            for (let m = 0; m < e; m++) minutes[m] = 1;
        }
    });
    let count = 0;
    for (let i = 0; i < 1440; i++) if (minutes[i]) count++;
    return Math.round((count / 60) * 10) / 10;
}

function shiftAnalysis(templates) {
    const gaps = [];
    const overlaps = [];
    const minutes = new Uint8Array(1440);
    templates.forEach(t => {
        const s = minutesOf(t.start);
        const e = minutesOf(t.end);
        if (s < e) {
            for (let m = s; m < e; m++) minutes[m]++;
        } else if (s > e) {
            for (let m = s; m < 1440; m++) minutes[m]++;
            for (let m = 0; m < e; m++) minutes[m]++;
        }
    });

    let inGap = false;
    let gapStart = 0;
    for (let m = 0; m < 1440; m++) {
        if (minutes[m] === 0 && !inGap) {
            inGap = true;
            gapStart = m;
        } else if (minutes[m] > 0 && inGap) {
            inGap = false;
            gaps.push({ start: gapStart, end: m });
        }
    }
    if (inGap) {
        gaps.push({ start: gapStart, end: 1440 });
    }
    if (gaps.length > 1 && gaps[0].start === 0 && gaps[gaps.length - 1].end === 1440) {
        const last = gaps.pop();
        gaps[0].start = last.start;
    }

    for (let i = 0; i < templates.length; i++) {
        for (let j = i + 1; j < templates.length; j++) {
            const t1 = templates[i];
            const t2 = templates[j];
            let count = 0;
            for (let m = 0; m < 1440; m++) {
                if (isMinuteInTemplate(m, t1) && isMinuteInTemplate(m, t2)) count++;
            }
            if (count > 0) {
                overlaps.push({ t1: t1.name, t2: t2.name, hours: Math.round((count / 60) * 10) / 10 });
            }
        }
    }

    return { gaps, overlaps };
}

function stepTime(index, field, deltaMinutes) {
    const t = draft.shiftTemplates[index];
    let m = minutesOf(t[field]) + deltaMinutes;
    t[field] = timeStr(m);
    renderSaveBar();
    render();
}

function normalizeTime(val) {
    if (!val) return '00:00';
    let s = String(val).trim();
    if (s.includes(':')) {
        const parts = s.split(':');
        const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
        let mi = parseInt(parts[1], 10) || 0;
        if (parts[1].length === 1) mi = mi * 10;
        mi = Math.min(59, Math.max(0, mi));
        return `${pad2(h)}:${pad2(mi)}`;
    }
    if (s.includes('.')) {
        const n = parseFloat(s);
        const h = Math.min(23, Math.max(0, Math.floor(n)));
        const mi = Math.min(59, Math.round((n - Math.floor(n)) * 60));
        return `${pad2(h)}:${pad2(mi)}`;
    }
    const num = parseInt(s, 10);
    if (!isNaN(num)) {
        if (num <= 24) return `${pad2(num === 24 ? 0 : num)}:00`;
        if (num >= 100 && num <= 2359) {
            const h = Math.floor(num / 100);
            const mi = num % 100;
            return `${pad2(h)}:${pad2(Math.min(59, mi))}`;
        }
    }
    return val;
}

const SHIFT_PRESETS = [
    {
        label: 'ហាងបើក 24 ម៉ោង · 3 វេន',
        templates: [
            { code: 'A', name: 'វេនព្រឹក', start: '06:00', end: '14:00' },
            { code: 'B', name: 'វេនរសៀល', start: '14:00', end: '22:00' },
            { code: 'C', name: 'វេនយប់', start: '22:00', end: '06:00' }
        ]
    },
    {
        label: 'ហាងបើក 06:00–22:00 · 2 វេន',
        templates: [
            { code: 'A', name: 'វេនព្រឹក', start: '06:00', end: '14:00' },
            { code: 'B', name: 'វេនរសៀល', start: '14:00', end: '22:00' }
        ]
    },
    {
        label: 'ហាងបើក 07:00–21:00 · 2 វេន',
        templates: [
            { code: 'A', name: 'វេនព្រឹក', start: '07:00', end: '14:00' },
            { code: 'B', name: 'វេនរសៀល', start: '14:00', end: '21:00' }
        ]
    }
];

async function applyShiftPreset(presetIdx) {
    const p = SHIFT_PRESETS[presetIdx];
    if (!p) return;
    const ok = await showCustomConfirm({
        title: `ប្តូរទៅ «${p.label}»?`,
        message: 'គំរូវេនបច្ចុប្បន្ននឹងត្រូវជំនួសដោយគំរូថ្មីនេះ។ សូមចុចរក្សាទុកដើម្បីអនុវត្តជាផ្លូវការ។',
        confirmText: 'ប្តូរគំរូ'
    });
    if (!ok) return;
    draft.shiftTemplates = clone(p.templates);
    renderSaveBar();
    render();
}

function renderShifts(s) {
    const analysis = shiftAnalysis(draft.shiftTemplates);
    const unionH = shiftUnionHours(draft.shiftTemplates);

    const rows = draft.shiftTemplates.map((t, i) => {
        const h = templateHours(t);
        const valid = /^([01]\d|2[0-3]):[0-5]\d$/.test(t.start) && /^([01]\d|2[0-3]):[0-5]\d$/.test(t.end);
        const tone = !valid || h > 12 ? 'text-rose-600' : h > 8 ? 'text-amber-700' : 'text-emerald-700';
        return `<div class="grid grid-cols-[1fr_auto_auto_44px] gap-2 items-center py-3 border-b border-slate-100">
            <input value="${escapeText(t.name)}" oninput="draft.shiftTemplates[${i}].name=this.value; renderSaveBar()" onblur="render()" class="sm-td h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500">
            <div class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-1 h-11">
                <button type="button" onclick="stepTime(${i}, 'start', -30)" class="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"><i class="fas fa-minus text-[10px]"></i></button>
                <input value="${t.start}" inputmode="numeric" maxlength="5" oninput="draft.shiftTemplates[${i}].start=this.value" onblur="draft.shiftTemplates[${i}].start=normalizeTime(this.value); renderSaveBar(); render()" class="sm-value w-16 h-8 bg-transparent text-center sm-figure focus:outline-none">
                <button type="button" onclick="stepTime(${i}, 'start', 30)" class="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"><i class="fas fa-plus text-[10px]"></i></button>
            </div>
            <div class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-1 h-11">
                <button type="button" onclick="stepTime(${i}, 'end', -30)" class="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"><i class="fas fa-minus text-[10px]"></i></button>
                <input value="${t.end}" inputmode="numeric" maxlength="5" oninput="draft.shiftTemplates[${i}].end=this.value" onblur="draft.shiftTemplates[${i}].end=normalizeTime(this.value); renderSaveBar(); render()" class="sm-value w-16 h-8 bg-transparent text-center sm-figure focus:outline-none">
                <button type="button" onclick="stepTime(${i}, 'end', 30)" class="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"><i class="fas fa-plus text-[10px]"></i></button>
            </div>
            <button onclick="removeTemplate(${i})" type="button" aria-label="លុបវេន" class="w-11 h-11 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 ${draft.shiftTemplates.length <= 1 ? 'invisible' : ''}"><i class="fas fa-trash-can text-xs"></i></button>
            <p class="col-span-4 sm-td-sub ${tone} -mt-1"><i class="fas ${!valid || h > 12 ? 'fa-circle-exclamation' : h > 8 ? 'fa-triangle-exclamation' : 'fa-circle-check'} mr-1"></i>${!valid ? 'ម៉ោងត្រូវសរសេរជា 24 ម៉ោង ឧ. 07:00' : `${h} ម៉ោង${h > 12 ? ' · លើសកំណត់ច្បាប់ 12 ម៉ោង' : h > 8 ? ' · លើស 8 ម៉ោងធម្មតា ត្រូវគិតម៉ោងបន្ថែម' : ' · ក្នុងម៉ោងធម្មតា'}${nightHours(t) ? ` · ម៉ោងយប់ ${nightHours(t)} ម៉ោង (ប្រាក់ឈ្នួល 200%)` : ''}`}</p>
        </div>`;
    }).join('');

    const noticeRaw = sessionStorage.getItem('pos_new_shift_notice');
    let noticeHtml = '';
    if (noticeRaw) {
        try {
            const not = JSON.parse(noticeRaw);
            noticeHtml = `
                <div class="mb-4 p-3 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3">
                    <p class="sm-td text-indigo-900"><i class="fas fa-circle-info mr-1 text-indigo-600"></i>${escapeText(not.name)} មិនទាន់មានអ្នកគិតលុយ 7 ថ្ងៃខាងមុខ</p>
                    <a href="../roster/roster.html?template=${not.code}" class="sm-badge h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 flex-shrink-0">
                        ចាត់តាំងឥឡូវ <i class="fas fa-arrow-right text-[10px]"></i>
                    </a>
                </div>
            `;
        } catch (e) {}
    }

    return sectionHead(s, 'ចំនួនវេនក្នុងមួយថ្ងៃ = ម៉ោងបើកហាង ÷ ប្រមាណ 8 ម៉ោង · វេនមួយអាចមានអ្នកគិតលុយច្រើននាក់') + `<div class="px-5 sm:px-6 pb-5">
        ${noticeHtml}
        <div class="flex flex-wrap items-center gap-2 mb-3">
            <span class="text-xs text-slate-400">គំរូរហ័ស៖</span>
            ${SHIFT_PRESETS.map((p, pIdx) => `
                <button type="button" onclick="applyShiftPreset(${pIdx})" class="sm-badge h-8 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition">
                    ${p.label}
                </button>
            `).join('')}
        </div>
        ${timeline()}
        <div class="space-y-1 mt-2">
            <p class="sm-td-sub text-slate-600 font-medium">ហាងបើក ${unionH} ម៉ោងក្នុងមួយថ្ងៃ · ${draft.shiftTemplates.length} វេន</p>
            ${analysis.gaps.map(g => `<p class="sm-td-sub text-amber-700"><i class="fas fa-triangle-exclamation mr-1"></i>ចន្លោះ ${timeStr(g.start)}–${timeStr(g.end)} គ្មានវេន</p>`).join('')}
            ${analysis.overlaps.map(o => `<p class="sm-td-sub text-amber-700"><i class="fas fa-clock mr-1"></i>${escapeText(o.t1)} និង ${escapeText(o.t2)} ជាន់គ្នា ${o.hours} ម៉ោង</p>`).join('')}
        </div>
        <div class="grid grid-cols-[1fr_auto_auto_44px] gap-2 mt-5 sm-td-sub text-slate-400"><span>ឈ្មោះវេន</span><span class="text-center w-28">ចាប់ផ្តើម</span><span class="text-center w-28">បញ្ចប់</span><span></span></div>
        ${rows}
        <div class="flex flex-wrap items-center justify-between gap-3 mt-4">
            <div class="flex items-center gap-2">
                ${draft.shiftTemplates.length < 4
                    ? `<button onclick="addTemplate()" type="button" class="sm-badge h-10 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold"><i class="fas fa-plus mr-1"></i> បន្ថែមវេន</button>`
                    : `<button disabled type="button" class="sm-badge h-10 px-4 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed font-semibold"><i class="fas fa-plus mr-1"></i> បន្ថែមវេន</button><span class="sm-td-sub text-slate-400">អតិបរមា 4 វេនក្នុងមួយថ្ងៃ</span>`}
            </div>
            <a href="../roster/roster.html" class="sm-badge text-indigo-700 hover:text-indigo-900 font-semibold">ចាត់តាំងអ្នកគិតលុយក្នុងកាលវិភាគវេន <i class="fas fa-arrow-right text-[10px]"></i></a>
        </div>
    </div>`;
}

function renderTill(s) {
    return sectionHead(s, 'កូដស្កេនបាគង ការលក់ព្យួរ ដែនកំណត់បញ្ចុះតម្លៃ និងទំនិញញឹកញាប់') + `<div class="px-5 sm:px-6">
        ${row('khqrSeconds', 'សុពលភាពកូដស្កេនបាគង', 'ក្រោយពេលនេះ កូដផុតសុពលភាព ហើយអ្នកគិតលុយបង្កើតកូដថ្មី', numInput('khqrSeconds', 'វិនាទី'), noteFor('khqrSeconds'))}
        ${row('holdLimit', 'ការលក់ព្យួរក្នុងមួយវេន', 'ត្រូវបន្ត ឬបោះបង់ទាំងអស់មុនបិទវេន', numInput('holdLimit', 'ដង'))}
        ${row('discountLimits', 'ដែនកំណត់បញ្ចុះតម្លៃ', 'លើសនេះ អ្នកគ្រប់គ្រងត្រូវវាយលេខសម្ងាត់នៅបញ្ជរ', `<div class="space-y-2">${CASHIERS.map(c => `
            <div class="flex items-center gap-3">${avatarHtml(c.id, 'w-8 h-8')}<span class="sm-td text-slate-700 flex-1 truncate">${c.name}</span>
                <div class="relative w-28"><input type="text" inputmode="decimal" value="${draft.discountLimits[c.id] != null ? draft.discountLimits[c.id] : 5}"
                    oninput="draft.discountLimits['${c.id}'] = Number(this.value.replace(/[^0-9.]/g, '')) || 0; renderSaveBar()"
                    class="sm-value w-full h-11 pl-3 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-right focus:outline-none focus:border-indigo-500"><span class="absolute right-3 top-1/2 -translate-y-1/2 sm-td-sub text-slate-400">%</span></div></div>`).join('')}</div>`)}
    </div>`;
}

function renderStock(s) {
    const neg = draft.allowNegativeStock;
    const sched = draft.countSchedule || 'weekly';
    return sectionHead(s, 'ដែនកំណត់នៃការកែតម្រូវស្តុក កាលវិភាគរាប់ស្តុក និងការលក់ពេលអស់ស្តុក') + `<div class="px-5 sm:px-6">
        ${row('allowNegativeStock', 'អនុញ្ញាតលក់ពេលស្តុកមិនគ្រប់', 'បើក៖ អនុញ្ញាតឱ្យអ្នកគិតលុយបន្តលក់ទោះបីស្តុកអស់ ឬអវិជ្ជមាន · បិទ៖ បញ្ឈប់ការលក់ពេលអស់ស្តុក', `
            <div class="flex items-center gap-2">
                <button type="button" onclick="draft.allowNegativeStock = true; renderSaveBar(); render()" class="sm-badge h-11 px-4 rounded-xl border font-semibold transition ${neg ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}"><i class="fas fa-check mr-1.5"></i>អនុញ្ញាត</button>
                <button type="button" onclick="draft.allowNegativeStock = false; renderSaveBar(); render()" class="sm-badge h-11 px-4 rounded-xl border font-semibold transition ${!neg ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}"><i class="fas fa-ban mr-1.5"></i>មិនអនុញ្ញាត</button>
            </div>
        `)}
        ${row('adjustLimitQty', 'ដែនកំណត់ចំនួនកែតម្រូវ', 'ចំនួនឯកតាអតិបរមាដែលអាចកែតម្រូវក្នុងមួយលើកដោយគ្មានការត្រួតពិនិត្យបន្ថែម', numInput('adjustLimitQty', 'ឯកតា'), noteFor('adjustLimitQty'))}
        ${row('adjustLimitUSD', 'ដែនកំណត់ទឹកប្រាក់កែតម្រូវ', 'ទឹកប្រាក់អតិបរមាគិតជាដុល្លារដែលអាចកែតម្រូវស្តុកក្នុងមួយលើក', numInput('adjustLimitUSD', 'ដុល្លារ', { prefix: '$' }), noteFor('adjustLimitUSD'))}
        ${row('countSchedule', 'កាលវិភាគរាប់ស្តុកទៀងទាត់', 'កំណត់ពេលវេលាដែលអ្នកគ្រប់គ្រងត្រូវរាប់ស្តុកជាក់ស្តែង', `
            <div class="flex items-center gap-2">
                <button type="button" onclick="draft.countSchedule = 'weekly'; renderSaveBar(); render()" class="sm-badge h-11 px-4 rounded-xl border font-semibold transition ${sched === 'weekly' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}"><i class="fas fa-calendar-week mr-1.5"></i>រៀងរាល់សប្តាហ៍ (7 ថ្ងៃ)</button>
                <button type="button" onclick="draft.countSchedule = 'monthly'; renderSaveBar(); render()" class="sm-badge h-11 px-4 rounded-xl border font-semibold transition ${sched === 'monthly' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}"><i class="fas fa-calendar-days mr-1.5"></i>រៀងរាល់ខែ (30 ថ្ងៃ)</button>
            </div>
        `)}
    </div>`;
}

function renderQuick(s) {
    return sectionHead(s, 'បង្ហាញខាងលើក្រឡាទំនិញនៅផ្ទាំងគិតលុយ · ចុចដើម្បីជ្រើស ឬដកចេញ') + `<div class="px-5 sm:px-6">
        ${row('quickKeys', 'ទំនិញញឹកញាប់', `អតិបរមា 8 មុខ · បានជ្រើស ${draft.quickKeys.length}`, `<div class="flex flex-wrap gap-1.5">${PRODUCTS.map(p => {
            const on = draft.quickKeys.includes(p.sku);
            return `<button onclick="toggleKey('${p.sku}')" type="button" class="sm-td-sub pl-1 pr-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 transition ${on ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-400'}">
                <span class="w-6 h-6 rounded-full bg-white/80 overflow-hidden inline-flex items-center justify-center">${productImgHtml(p, 'text-[10px]')}</span>${p.name.split(' ')[0]}</button>`; }).join('')}</div>`)}
    </div>`;
}

/* អ្នកគ្រប់គ្រងឃើញច្បាប់ដែលម្ចាស់ហាងកំណត់ (មិនអាចកែ) ដើម្បីដឹងថាហេតុអ្វីបញ្ជរដំណើរការបែបនេះ */
function renderRules(s) {
    const v = posSettings();
    const item = (label, value) => `<div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-1 md:gap-6 py-3.5 border-b border-slate-100 last:border-0">
        <span class="sm-td text-slate-600">${label}</span><span class="sm-value text-slate-800 sm-figure md:text-right">${value}</span></div>`;
    return sectionHead(s, 'កំណត់ដោយម្ចាស់ហាង · អ្នកគ្រប់គ្រងមើលបាន តែមិនអាចកែ') + `<div class="px-5 sm:px-6 py-2">
        ${item('ល្បឹមភាពខុសគ្នាពេលបិទវេន', fmtUSD(v.varianceTolerance))}
        ${item('ពិដានក្នុងថត', `${fmtUSD(v.drawerLimitUSD)} · ${fmtKHR(v.drawerLimitKHR)}`)}
        ${item('ប្រាក់បាតថតស្តង់ដារ', `${fmtUSD(v.defaultFloatUSD)} · ${fmtKHR(v.defaultFloatKHR)}`)}
        ${item('គំរូវេន', v.shiftTemplates.map(t => `${t.name} ${t.start}–${t.end}`).join(' · '))}
        ${item('សុពលភាពកូដស្កេនបាគង', `${Math.round(v.khqrSeconds / 60)} នាទី`)}
        ${item('ការលក់ព្យួរក្នុងមួយវេន', `${v.holdLimit} ដង`)}
        ${item('ដែនកំណត់បញ្ចុះតម្លៃ', CASHIERS.map(c => `${c.name} ${v.discountLimits[c.id] != null ? v.discountLimits[c.id] : 5}%`).join(' · '))}
        ${item('អនុញ្ញាតលក់ពេលស្តុកអវិជ្ជមាន', v.allowNegativeStock ? 'អនុញ្ញាត' : 'មិនអនុញ្ញាត')}
        ${item('ដែនកំណត់កែតម្រូវស្តុក', `${v.adjustLimitQty} ឯកតា · ${fmtUSD(v.adjustLimitUSD)}`)}
        ${item('កាលវិភាគរាប់ស្តុក', v.countSchedule === 'weekly' ? 'រៀងរាល់សប្តាហ៍ (7 ថ្ងៃ)' : 'រៀងរាល់ខែ (30 ថ្ងៃ)')}
        <p class="sm-td-sub text-slate-500 py-3.5"><i class="fas fa-lock mr-1.5 text-slate-400"></i>ចង់ប្តូរ? សូមស្នើទៅម្ចាស់ហាង ${ADMINS.map(a => a.name).join(' · ')}</p>
    </div>`;
}

function renderReasons(s) {
    return sectionHead(s, 'ជម្រើសដែលអ្នកគិតលុយ និងអ្នកគ្រប់គ្រងឃើញ · ចុច Enter ដើម្បីបន្ថែម') + `<div class="px-5 sm:px-6">
        ${REASON_GROUPS.map(([k, label, icon]) => row(null, `<i class="fas ${icon} text-slate-400 mr-1.5"></i>${label}`, `${draft.reasons[k].length} ជម្រើស`, `
            <div class="flex flex-wrap gap-1.5">${draft.reasons[k].map((r, i) => `<span class="sm-td-sub inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-slate-100 text-slate-700">${escapeText(r)}
                <button onclick="draft.reasons['${k}'].splice(${i},1); render()" type="button" aria-label="លុប" class="w-6 h-6 rounded-full hover:bg-rose-100 hover:text-rose-600"><i class="fas fa-xmark text-[10px]"></i></button></span>`).join('')}</div>
            <input placeholder="+ បន្ថែមមូលហេតុ" onkeydown="if(event.key==='Enter'&&this.value.trim()){draft.reasons['${k}'].push(this.value.trim()); render(); setTimeout(()=>document.querySelector('[data-r=${k}]').focus(),0)}" data-r="${k}"
                class="sm-td w-full h-10 mt-2 px-3 rounded-xl bg-white border border-dashed border-slate-300 focus:outline-none focus:border-indigo-500">`)).join('')}
    </div>`;
}

function fmtVal(v) {
    if (Array.isArray(v)) return v.length && typeof v[0] === 'object' ? v.map(t => `${t.name} ${t.start}–${t.end}`).join(' · ') : `${v.length} ធាតុ`;
    if (v && typeof v === 'object') return Object.keys(v).map(k => `${personName(k) !== '—' ? personName(k) : k}: ${typeof v[k] === 'object' ? (Array.isArray(v[k]) ? v[k].length : (v[k].template || '—')) : v[k]}`).join(' · ');
    return typeof v === 'number' ? fmtInt(v) : String(v);
}

function renderHistory(s) {
    const h = settingsHistory();
    return sectionHead(s, 'រាល់ការកែប្រែ៖ តម្លៃចាស់ → តម្លៃថ្មី អ្នកកែ និងពេលវេលា · មិនអាចលុបបានទេ') + `<div class="divide-y divide-slate-100">${h.length ? h.map(x => `
        <div class="px-5 sm:px-6 py-4 flex gap-4">
            ${avatarHtml(x.by, 'w-9 h-9')}
            <div class="min-w-0 flex-1">
                <p class="sm-td text-slate-700">${personName(x.by)} <span class="sm-td-sub text-slate-400 sm-figure ml-1">${fmtDate(x.at)} ${fmtTime(x.at)}</span></p>
                ${x.changes.map(c => c.key === 'pin' ? `<p class="sm-td-sub text-slate-600 mt-1"><i class="fas fa-key text-amber-500 mr-1"></i>កំណត់លេខសម្ងាត់ថ្មីឱ្យ ${personName(c.who)}</p>`
                    : `<p class="sm-td-sub text-slate-600 mt-1"><span class="font-semibold text-slate-700">${SETTING_LABELS[c.key] || c.key}</span>៖ <span class="text-slate-400 line-through">${escapeText(fmtVal(c.from))}</span> <i class="fas fa-arrow-right text-[10px] text-slate-400 mx-1"></i> ${escapeText(fmtVal(c.to))}</p>`).join('')}
            </div>
        </div>`).join('') : emptyState('fa-clock-rotate-left', 'មិនទាន់មានការកែប្រែ', 'ការកំណត់ទាំងអស់នៅតម្លៃលំនាំដើម')}</div>`;
}

/* ===== គូរ ===== */

/* តម្លៃបច្ចុប្បន្នក្រោមឈ្មោះផ្នែក ដើម្បីឃើញការរៀបចំទាំងមូលដោយមិនចាំបាច់ចុច */
function navSummary(id) {
    const d = draft;
    switch (id) {
        case 'money': return `${fmtInt(d.fxRate)} ៛`;
        case 'cash': return `ល្បឹម ${fmtUSD(d.varianceTolerance)} · បាត ${fmtUSD(d.defaultFloatUSD)}`;
        case 'shifts': return `${d.shiftTemplates.length} វេន · ${d.shiftTemplates.map(t => t.start).join(' ')}`;
        case 'till': return `KHQR ${Math.round(d.khqrSeconds / 60)} នាទី · ព្យួរ ${d.holdLimit}`;
        case 'stock': return `${d.allowNegativeStock ? 'លក់អវិជ្ជមាន' : 'ស្តុកវិជ្ជមាន'} · ដែន ${d.adjustLimitQty} · ${d.countSchedule === 'weekly' ? 'សប្តាហ៍' : 'ខែ'}`;
        case 'quick': return `${d.quickKeys.length} មុខ`;
        case 'rules': return 'មើលតែប៉ុណ្ណោះ';
        case 'reasons': return `${Object.values(d.reasons).reduce((n, l) => n + l.length, 0)} មូលហេតុ`;
        case 'history': return `${settingsHistory().length} ដង`;
        default: return '';
    }
}

function renderNav() {
    document.getElementById('sectionNav').innerHTML = SECTIONS.map(s => {
        const n = s.keys.filter(isChanged).length;
        const on = s.id === section;
        return `<button onclick="goSection('${s.id}')" type="button"
            class="flex-shrink-0 lg:w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${on ? 'bg-indigo-50 text-indigo-800' : 'text-slate-600 hover:bg-slate-50'}">
            <i class="fas ${s.icon} w-5 text-center ${on ? 'text-indigo-600' : 'text-slate-400'}"></i>
            <span class="flex-1 min-w-0"><span class="sm-td font-medium whitespace-nowrap block">${s.label}</span>
                <span class="sm-td-sub ${on ? 'text-indigo-600/80' : 'text-slate-400'} whitespace-nowrap block truncate sm-figure">${navSummary(s.id)}</span></span>
            ${n ? `<span class="w-2 h-2 rounded-full bg-amber-500"></span>` : ''}
        </button>`;
    }).join('');
}

function render() {
    const s = SECTIONS.find(x => x.id === section) || SECTIONS[0];
    const fn = { money: renderMoney, cash: renderCash, shifts: renderShifts, till: renderTill, stock: renderStock, quick: renderQuick, reasons: renderReasons, rules: renderRules, history: renderHistory }[s.id];
    document.getElementById('sectionBody').innerHTML = fn(s);
    renderNav();
    renderSaveBar();
}

function goSection(id) {
    section = id;
    history.replaceState(null, '', `?s=${id}`);
    render();
    document.querySelector('main').scrollTop = 0;
}

function renderSaveBar() {
    const keys = changedKeys();
    const dirty = keys.length > 0;
    document.getElementById('dirtyDot').className = `w-2.5 h-2.5 rounded-full flex-shrink-0 ${dirty ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`;
    document.getElementById('dirtyNote').textContent = dirty
        ? `មិនទាន់រក្សាទុក ${keys.length}៖ ${keys.map(k => SETTING_LABELS[k] || k).join(' · ')}` : 'ការកំណត់ទាំងអស់បានរក្សាទុក';
    document.getElementById('dirtyNote').className = `sm-td-sub truncate ${dirty ? 'text-amber-700 font-semibold' : 'text-slate-500'}`;
    document.getElementById('saveBtn').disabled = !dirty;
    document.getElementById('saveBtn').className = `sm-value h-11 px-5 rounded-xl font-semibold inline-flex items-center gap-2 transition ${dirty ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`;
    document.getElementById('discardBtn').style.display = dirty ? '' : 'none';
    renderNav();
}

/* ===== សកម្មភាព ===== */

function toggleKey(sku) {
    const i = draft.quickKeys.indexOf(sku);
    if (i >= 0) draft.quickKeys.splice(i, 1);
    else if (draft.quickKeys.length >= 8) return showToast('ទំនិញញឹកញាប់អតិបរមា 8 មុខ', 'warning');
    else draft.quickKeys.push(sku);
    render();
}

function addTemplate() {
    if (draft.shiftTemplates.length >= 4) return;
    const seq = Number(draft.shiftCodeSeq || draft.shiftTemplates.length);
    const code = String.fromCharCode(65 + seq);
    draft.shiftCodeSeq = seq + 1;

    // រកចន្លោះធំបំផុតដែលគ្មានវេន (S7)
    const analysis = shiftAnalysis(draft.shiftTemplates);
    let startM = 360; // 06:00
    let endM = 840;   // 14:00

    if (analysis.gaps.length > 0) {
        const sortedGaps = analysis.gaps.map(g => {
            let len = g.end - g.start;
            if (len <= 0) len += 1440;
            return { start: g.start, end: g.end, len };
        }).sort((a, b) => b.len - a.len);

        const bestGap = sortedGaps[0];
        startM = bestGap.start;
        const dur = Math.min(bestGap.len, 480);
        endM = (startM + dur) % 1440;
    } else if (draft.shiftTemplates.length > 0) {
        const lastT = draft.shiftTemplates[draft.shiftTemplates.length - 1];
        startM = minutesOf(lastT.end);
        endM = (startM + 480) % 1440;
    }

    const startTime = timeStr(startM);
    const endTime = timeStr(endM);

    // ដាក់ឈ្មោះតាមម៉ោងចាប់ផ្តើម
    let name = 'វេនព្រឹក';
    if (startM >= 300 && startM < 660) name = 'វេនព្រឹក';
    else if (startM >= 660 && startM < 1020) name = 'វេនរសៀល';
    else if (startM >= 1020 && startM < 1320) name = 'វេនល្ងាច';
    else name = 'វេនយប់';

    const existingCount = draft.shiftTemplates.filter(t => t.name.startsWith(name)).length;
    if (existingCount > 0) name = `${name} ${existingCount + 1}`;

    draft.shiftTemplates.push({ code, name, start: startTime, end: endTime });
    renderSaveBar();
    render();
}

async function removeTemplate(i) {
    const t = draft.shiftTemplates[i];
    // ហាមដាច់ខាតការលុបវេនដែលកំពុងមានថតប្រាក់ដំណើរការ (P18 / S14)
    const openShifts = posRead(POS_KEYS.shifts, []).filter(s => s.status === 'open' && s.templateCode === t.code);
    if (openShifts.length > 0) {
        showToast(`មិនអាចលុប ${t.name} បានទេ ព្រោះកំពុងមានថតប្រាក់ ${openShifts[0].register} បើកដំណើរការ!`, 'error');
        return;
    }

    const used = Object.values(draft.staffDefaults || {}).filter(d => d.template === t.code).length;
    const ok = await showCustomConfirm({
        title: `លុប${t.name}?`,
        message: used
            ? `បុគ្គលិក ${used} នាក់មានវេននេះជាវេនប្រចាំ ហើយនឹងក្លាយជា «គ្មានវេនប្រចាំ»។ កាលវិភាគកន្លងមកមិនប៉ះពាល់ឡើយ។`
            : 'វេននេះនឹងត្រូវដកចេញពីបញ្ជីគំរូវេន។',
        confirmText: 'លុប',
        danger: true
    });
    if (!ok) return;
    draft.shiftTemplates.splice(i, 1);
    Object.values(draft.staffDefaults || {}).forEach(d => { if (d.template === t.code) { d.template = ''; } });
    renderSaveBar();
    render();
}

function resetSection(id) {
    const s = SECTIONS.find(x => x.id === id);
    s.keys.forEach(k => { draft[k] = clone(POS_SETTINGS_DEFAULTS[k]); });
    showToast(`បានដាក់ «${s.label}» ទៅតម្លៃលំនាំដើម · សូមចុចរក្សាទុក`, 'info');
    render();
}

function validate() {
    if (draft.fxRate < 3500 || draft.fxRate > 4500) return ['money', 'អត្រាប្ដូរប្រាក់គួរនៅចន្លោះ 3,500 ទៅ 4,500 ៛'];
    if (draft.khqrSeconds < 60 || draft.khqrSeconds > 600) return ['till', 'សុពលភាពកូដស្កេនត្រូវនៅចន្លោះ 60 ទៅ 600 វិនាទី'];
    if (draft.holdLimit < 1 || draft.holdLimit > 20) return ['till', 'ការលក់ព្យួរត្រូវនៅចន្លោះ 1 ទៅ 20'];
    for (const t of draft.shiftTemplates) {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(t.end)) return ['shifts', `ម៉ោងនៃ ${t.name} មិនត្រឹមត្រូវ (ឧ. 07:00)`];
        if (!t.name.trim()) return ['shifts', 'វេននីមួយៗត្រូវមានឈ្មោះ'];
        if (templateHours(t) > 12) return ['shifts', `${t.name} លើស 12 ម៉ោង ដែលជាកំណត់ច្បាប់`];
    }
    return null;
}

async function save() {
    const keys = changedKeys();
    if (!keys.length) return;
    const bad = validate();
    if (bad) { goSection(bad[0]); return showToast(bad[1], 'error'); }
    const ok = await showPinConfirm({ title: 'រក្សាទុកការកំណត់', message: keys.map(k => SETTING_LABELS[k] || k).join(' · '), userId: ME_MANAGER, confirmText: 'រក្សាទុក' });
    if (!ok) return;

    if (keys.includes('shiftTemplates')) {
        const prevTpls = posSettings().shiftTemplates || [];
        const added = draft.shiftTemplates.find(t => !prevTpls.some(p => p.code === t.code));
        if (added) {
            sessionStorage.setItem('pos_new_shift_notice', JSON.stringify({ name: added.name, code: added.code }));
        }
        // ពិនិត្យមើលថាតើមានវេនកំពុងដំណើរការដែលត្រូវបានកែម៉ោងដែរឬទេ
        const running = posRead(POS_KEYS.shifts, []).filter(s => s.status === 'open');
        if (running.some(r => draft.shiftTemplates.some(t => t.code === r.templateCode && (t.start !== r.start || t.end !== r.end)))) {
            showToast('ការកែសម្រួលម៉ោងវេននឹងចាប់ផ្តើមពីវេនបន្ទាប់', 'info');
        }
    }

    const values = {};
    keys.forEach(k => { values[k] = draft[k]; });
    savePosSettings(values, ME_MANAGER);
    draft = clone(posSettings());
    showToast(`បានរក្សាទុក ${keys.length} ការកំណត់`, 'success');
    render();
}

function resetForm() {
    draft = clone(posSettings());
    render();
    showToast('បានបោះបង់ការកែប្រែ', 'info');
}

document.addEventListener('DOMContentLoaded', render);
