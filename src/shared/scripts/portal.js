/* ច្រកគ្រប់គ្រងផ្នែកលក់ — Shared runtime
ផ្ទុក៖ ថតរបារចំហៀងចល័ត, តម្រងកាលបរិច្ឆេទរួម (ស្តង់ដារលេខ 3), ម៉ឺនុយសកម្មភាពជួរតារាង (ស្តង់ដារលេខ 9) */

/* ===== 0. របារចំហៀង — បង្កើតចេញពីប្រភពតែមួយ =====
ទំព័រនីមួយៗគ្រាន់តែដាក់ <div id="sidebarHost"></div> ហើយកំណត់
data-role-root និង data-active លើ <body> ប៉ុណ្ណោះ។ ដោយសារ HTML
ត្រូវបង្កើតចេញពីអនុគមន៍តែមួយ របារចំហៀងគ្រប់ទំព័រដូចគ្នា 100%
ដោយស្វ័យប្រវត្តិ ទោះស្ថិតក្នុងថតជាន់ផ្សេងគ្នាក៏ដោយ។ */

// អនុវត្ត dark mode ភ្លាមៗដើម្បីការពារ flash of light mode (FOUC)
try {
    if (localStorage.getItem('bms_theme') === 'dark') {
        document.documentElement.classList.add('dark');
        if (document.body) document.body.classList.add('dark');
    }
} catch (e) {}

// ផ្ទុក Iconify MDI Web Component ដោយស្វ័យប្រវត្តិ
if (!document.querySelector('script[src*="iconify"]')) {
    const iconifyScript = document.createElement('script');
    iconifyScript.src = 'https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js';
    document.head.appendChild(iconifyScript);
}

function getIconHtml(icon, extraClass = '') {
    if (!icon) return '';
    if (icon.startsWith('mdi:') || icon.startsWith('mdi-')) {
        const iconName = icon.startsWith('mdi-') ? `mdi:${icon.replace('mdi-', '')}` : icon;
        return `<iconify-icon icon="${iconName}" class="${extraClass} text-lg inline-block align-middle"></iconify-icon>`;
    }
    return `<i class="fas ${icon} ${extraClass}"></i>`;
}

const PORTAL_CONFIGS = {
    posPortal: {
        sidebarV2: true,
        title: 'ច្រកគិតលុយលក់រាយ',
        roleName: 'អ្នកគិតលុយ',
        roleIcon: 'mdi:cash-register',
        userInitials: 'ចម',
        userName: 'ចន្ទ មករា',
        userRole: 'អ្នកគិតលុយ',
        policyNote: 'ជាប់សោរត្រឹមវេនបច្ចុប្បន្ន។ មិនអាចរុករកប្រតិបត្តិការ ឬចំណូលពីវេនមុនបានឡើយ។ ការលុបចោល ការប្រគល់ទំនិញវិញ និងការបញ្ចុះតម្លៃលើសកំណត់ ត្រូវការការអនុម័តពីអ្នកគ្រប់គ្រង។',
        nav: [
            { id: 'pos', label: 'ផ្ទាំងគិតលុយ', icon: 'mdi:point-of-sale', href: 'cashier/terminal/pos-terminal.html' },
            { id: 'receipts', label: 'វិក្កយបត្រក្នុងវេន', icon: 'mdi:receipt-text-outline', href: 'cashier/receipts/receipts.html', badge: true },
            { id: 'close-shift', label: 'បិទវេន និងរាប់សាច់ប្រាក់', icon: 'mdi:lock-outline', href: 'cashier/shift/close-shift.html' }
        ]
    },
    /* អ្នកគ្រប់គ្រង (ឯកសាររចនាលេខ 02 ផ្នែក 4)
       badgeFn = ឈ្មោះអនុគមន៍ក្នុង manager-data.js ដែលត្រឡប់ចំនួនសម្រាប់ផ្លាកលេខ */
    managerPortal: {
        sidebarV2: true,
        title: 'អ្នកគ្រប់គ្រង',
        roleName: 'អ្នកគ្រប់គ្រង',
        roleIcon: 'mdi:shield-account-outline',
        userInitials: 'សវ',
        userName: 'សុខ វណ្ណា',
        userRole: 'អ្នកគ្រប់គ្រង',
        policyNote: 'មើលឃើញគ្រប់វេនក្នុងសាខា · មិនមើលឃើញថ្លៃដើម · មិនអាចអនុម័តសំណើរបស់ខ្លួនឯង · រាល់ការអនុម័តត្រូវបានកត់ត្រា ហើយមិនអាចត្រឡប់វិញបាន។',
        nav: [
            { group: 'ថ្ងៃនេះ', id: 'dashboard', label: 'ផ្ទាំងគ្រប់គ្រង', icon: 'mdi:view-dashboard-outline', href: 'manager/dashboard/dashboard.html' },
            { id: 'approvals', label: 'សំណើរង់ចាំអនុម័ត', icon: 'mdi:shield-check-outline', href: 'manager/approvals/approvals.html', badgeFn: 'mgrPendingApprovalCount', badgeTone: 'amber' },
            { id: 'shifts', label: 'វេន និងបញ្ជរគិតលុយ', icon: 'mdi:cash-register', href: 'manager/shifts/shifts.html', badgeFn: 'mgrAwaitingReviewCount', badgeTone: 'amber' },
            { id: 'cash', label: 'ចលនាសាច់ប្រាក់', icon: 'mdi:safe', href: 'manager/cash/cash.html', badgeFn: 'mgrPendingDropCount', badgeTone: 'amber' },
            { group: 'ស្តុក', id: 'stock', label: 'ស្តុកទំនិញ', icon: 'mdi:package-variant-closed', href: 'manager/stock/stock.html', badgeFn: 'mgrLowStockCount', badgeTone: 'amber' },
            { id: 'stock-history', label: 'ប្រវត្តិស្តុក', icon: 'mdi:history', href: 'manager/stock-history/stock-history.html' },
            { id: 'stock-count', label: 'រាប់ស្តុក', icon: 'mdi:clipboard-check-outline', href: 'manager/stock-count/stock-count.html' },
            { group: 'បុគ្គលិក', id: 'roster', label: 'កាលវិភាគវេន', icon: 'mdi:calendar-account-outline', href: 'manager/roster/roster.html' },
            { group: 'វិភាគ', id: 'exceptions', label: 'ករណីមិនប្រក្រតី', icon: 'mdi:alert-octagon-outline', href: 'manager/exceptions/exceptions.html' },
            { id: 'reports', label: 'របាយការណ៍លក់', icon: 'mdi:chart-box-outline', href: 'manager/reports/sales-report.html' },
            { group: 'ប្រព័ន្ធ', id: 'settings', label: 'ការកំណត់', icon: 'mdi:cog-outline', href: 'manager/settings/settings.html' }
        ]
    },
    /* ម្ចាស់ហាង (ឯកសាររចនាលេខ 03) — ទិដ្ឋភាពអាជីវកម្ម បុគ្គលិក ទំនិញ ច្បាប់ និងសវនកម្ម
       មិនឈរបញ្ជរ · អាចប្តូរទៅទិដ្ឋភាពអ្នកគ្រប់គ្រងដើម្បីជួយសម្រេចពេលចាំបាច់ */
    adminPortal: {
        sidebarV2: true,
        title: 'ម្ចាស់ហាង',
        roleName: 'ម្ចាស់ហាង',
        roleIcon: 'mdi:crown-outline',
        userInitials: 'ហច',
        userName: 'ហេង ចាន់ថា',
        userRole: 'ម្ចាស់ហាង',
        policyNote: 'មើលឃើញថ្លៃដើម ប្រាក់ចំណេញ និងប្រវត្តិទាំងអស់ · កំណត់បុគ្គលិក តម្លៃ និងច្បាប់សាច់ប្រាក់ · មិនអាចកែ ឬលុបប្រតិបត្តិការដែលបានកត់ត្រារួច · រាល់ការកែប្រែត្រូវកត់ត្រាក្នុងសវនកម្ម។',
        nav: [
            { group: 'អាជីវកម្ម', id: 'dashboard', label: 'ទិដ្ឋភាពរួម', icon: 'mdi:view-dashboard-outline', href: 'admin/dashboard/dashboard.html' },
            { id: 'reports', label: 'ចំណូល និងប្រាក់ចំណេញ', icon: 'mdi:finance', href: 'admin/reports/profit-report.html' },
            { group: 'ស្តុក', id: 'stock-in', label: 'បញ្ជាក់ថ្លៃដើមស្តុកចូល', icon: 'mdi:truck-delivery-outline', href: 'admin/stock/stock-in.html', badgeFn: 'unconfirmedStockInCount', badgeTone: 'amber' },
            { id: 'stock-value', label: 'តម្លៃស្តុកសរុប', icon: 'mdi:chart-pie', href: 'admin/reports/stock-value.html' },
            { id: 'shrinkage', label: 'ការខាតបង់ស្តុក', icon: 'mdi:package-variant-closed-remove', href: 'admin/reports/shrinkage.html' },
            { group: 'គ្រប់គ្រង', id: 'staff', label: 'បុគ្គលិក និងតួនាទី', icon: 'mdi:account-group-outline', href: 'admin/staff/staff.html' },
            { id: 'payroll', label: 'ម៉ោងការងារ និងប្រាក់បៀវត្សរ៍', icon: 'mdi:cash-multiple', href: 'admin/reports/payroll.html' },
            { id: 'products', label: 'ទំនិញ និងតម្លៃ', icon: 'mdi:tag-outline', href: 'admin/products/products.html' },
            { id: 'settings', label: 'ច្បាប់ និងការកំណត់', icon: 'mdi:tune-variant', href: 'admin/settings/settings.html' },
            { group: 'ត្រួតពិនិត្យ', id: 'audit', label: 'កំណត់ហេតុសវនកម្ម', icon: 'mdi:clipboard-text-clock-outline', href: 'admin/audit/audit.html' }
        ]
    }
};

const NAV_ACTIVE_CLASS = 'flex items-center justify-between p-3 bg-white/15 text-white rounded-xl shadow-sm transition-all whitespace-nowrap border border-white/10';
const NAV_IDLE_CLASS = 'flex items-center justify-between p-3 text-sky-100 hover:bg-white/10 hover:text-white rounded-xl transition-all whitespace-nowrap';

function getRoleRoot() {
    if (document.body.dataset.roleRoot) {
        return document.body.dataset.roleRoot;
    }
    const loc = window.location.pathname.replace(/\\/g, '/');
    const isSub = /\/(stock-[a-z]+|movements|approvals|pipeline|reports|companies|subscriptions|audit-logs|users|company-profile|system-settings|customers|quotes|invoices|receipts|purchase-orders|vendor-bills|suppliers|financial-statements|tax-reports|vouchers|ledger)(\/|$)/.test(loc);
    return isSub ? '..' : '.';
}

/* ===== របារចំហៀងកំណែទី 2 =====
   បើកដោយដាក់ sidebarV2: true ក្នុងការកំណត់ច្រកនីមួយៗ។
   កែលម្អធៀបនឹងកំណែដើម៖
     • បង្ហាញអ្នកប្រើដែលកំពុងចូល (ប្រើ userName/userInitials/userRole ដែលមានស្រាប់)
     • បង្រួមបាន ហើយចងចាំស្ថានភាព
     • ផ្លាកលេខលាក់ពេលគ្មានអ្វី
     • ធាតុសកម្មមានបន្ទាត់សម្គាល់ និង aria-current
     • សេចក្តីណែនាំគោលការណ៍បត់បាន ដើម្បីសន្សំទីធ្លា */

function togglePolicyNote() {
    const box = document.getElementById('sbPolicyBody');
    const icon = document.getElementById('sbPolicyIcon');
    if (!box) return;
    const hidden = box.classList.toggle('hidden');
    if (icon) icon.setAttribute('icon', hidden ? 'mdi:chevron-down' : 'mdi:chevron-up');
}

/* អ្នកដែលបានចូលប្រើ (data.js) ជំនួសឈ្មោះថេរក្នុងការកំណត់ច្រក
   ប៊ូតុងប្តូរតួនាទីបង្ហាញលើផ្ទាំងគិតលុយ តែពេលអ្នកចូលប្រើជាអ្នកគ្រប់គ្រងប៉ុណ្ណោះ */
const ROLE_VIEW = {
    admin: { label: 'ម្ចាស់ហាង', icon: 'mdi:crown-outline', href: 'admin/dashboard/dashboard.html', portal: 'adminPortal' },
    manager: { label: 'អ្នកគ្រប់គ្រង', icon: 'mdi:shield-account-outline', href: 'manager/dashboard/dashboard.html', portal: 'managerPortal' },
    cashier: { label: 'ផ្ទាំងគិតលុយ', icon: 'mdi:point-of-sale', href: 'cashier/terminal/pos-terminal.html', portal: 'posPortal' }
};

function sessionPortalConfig(cfg, portalId) {
    if (typeof posSession !== 'function') return cfg;
    const session = posSession();
    const person = session && personById(session.userId);
    if (!person) return cfg;
    const role = roleOf(person.id);
    const out = Object.assign({}, cfg, {
        userId: person.id,
        userInitials: person.initials,
        userName: person.name,
        userRole: role === 'admin' ? 'ម្ចាស់ហាង'
            : role === 'manager'
                ? (portalId === 'posPortal' ? `អ្នកគ្រប់គ្រង · ${typeof MY_REGISTER !== 'undefined' ? MY_REGISTER : 'POS'}` : 'អ្នកគ្រប់គ្រង')
                : (portalId === 'posPortal' && typeof MY_REGISTER !== 'undefined' ? `អ្នកគិតលុយ · ${MY_REGISTER}` : 'អ្នកគិតលុយ')
    });
    // ទិដ្ឋភាពដែលអ្នកប្រើម្នាក់ៗអាចប្តូរបាន៖ ម្ចាស់ហាង ↔ អ្នកគ្រប់គ្រង · អ្នកគ្រប់គ្រង ↔ ផ្ទាំងគិតលុយ
    const views = { admin: ['admin', 'manager'], manager: ['manager', 'cashier'], cashier: [] }[role];
    out.views = views.map(v => Object.assign({ id: v, current: ROLE_VIEW[v].portal === portalId }, ROLE_VIEW[v]));
    return out;
}

/* ស្ថានភាពផ្ទាល់ក្រោមឈ្មោះម៉ាក៖ អ្នកគិតលុយឃើញវេន និងពេលនៅសល់ · អ្នកគ្រប់គ្រងឃើញបញ្ជរបើក និងការលក់ថ្ងៃនេះ */
function sidebarStatusHtml() {
    const portal = document.body.id;
    if (portal === 'posPortal' && typeof currentShift === 'function') {
        const sh = currentShift();
        if (!sh) {
            return `<p class="sm-nav-note sb-accent-soft">មិនទាន់បើកវេន · ${typeof MY_REGISTER !== 'undefined' ? MY_REGISTER : ''}</p>`;
        }
        const now = Date.now();
        const start = new Date(sh.openedAt).getTime();
        const end = shiftEndDate(sh).getTime();
        const pct = Math.min(Math.max((now - start) / (end - start) * 100, 0), 100);
        const left = end - now;
        return `<div class="flex items-center justify-between gap-2">
                <span class="sm-nav-label text-white truncate">${sh.templateName} · ${sh.register}</span>
                <span class="w-2 h-2 rounded-full ${left < 0 ? 'bg-rose-400' : 'bg-emerald-400'} flex-shrink-0"></span>
            </div>
            <p class="sm-nav-note sb-accent-soft mt-0.5 whitespace-nowrap">${left < 0 ? `ហួសម៉ោងបិទ ${fmtDuration(-left)}` : `បិទ ${sh.end} · នៅសល់ ${Math.floor(left / 3600000)}:${pad2(Math.floor(left / 60000) % 60)}`}</p>
            <div class="h-1 rounded-full bg-white/10 mt-2 overflow-hidden"><div class="h-full ${left < 0 ? 'bg-rose-400' : 'sb-progress'}" style="width:${pct}%"></div></div>`;
    }
    if (portal === 'adminPortal' && typeof profitOf === 'function') {
        const today = profitOf(salesInRange(mgrToday()));
        return `<div class="flex items-center justify-between gap-2">
                <span class="sm-nav-note sb-accent-soft">លក់សុទ្ធថ្ងៃនេះ</span>
                <span class="sm-nav-label text-white sm-figure">${fmtUSD(today.gross)}</span>
            </div>
            <div class="flex items-center justify-between gap-2 mt-1">
                <span class="sm-nav-note sb-accent-soft">ប្រាក់ចំណេញដុល</span>
                <span class="sm-nav-label text-emerald-300 sm-figure">${fmtUSD(today.profit)} · ${today.margin.toFixed(0)}%</span>
            </div>`;
    }
    if (portal === 'managerPortal' && typeof mgrAllShifts === 'function') {
        const open = mgrAllShifts().filter(x => x.status === 'open').map(x => x.register);
        const net = typeof aggregateSales === 'function' ? aggregateSales(salesInRange(mgrToday())).netSales : 0;
        return `<div class="flex items-center justify-between gap-2">
                <span class="sm-nav-note sb-accent-soft">បញ្ជរកំពុងបើក</span>
                <span class="flex items-center gap-1">${REGISTERS.map(r => `<span class="w-2 h-2 rounded-full ${open.includes(r) ? 'bg-emerald-400' : 'bg-white/20'}"></span>`).join('')}
                    <span class="sm-nav-note text-white sm-figure ml-1">${open.length}/${REGISTERS.length}</span></span>
            </div>
            <div class="flex items-center justify-between gap-2 mt-1">
                <span class="sm-nav-note sb-accent-soft">លក់សុទ្ធថ្ងៃនេះ</span>
                <span class="sm-nav-label text-white sm-figure">${fmtUSD(net || 0)}</span>
            </div>`;
    }
    return '';
}

function refreshSidebarStatus() {
    const box = document.getElementById('sbStatus');
    if (!box) return;
    const html = sidebarStatusHtml();
    box.innerHTML = html;
    box.classList.toggle('hidden', !html);
}

/* ===== ម៉ឺនុយលេចចេញពីរបារចំហៀង (ប្តូរតួនាទី · គណនី) =====
   ប្រើទីតាំង fixed ដូច្នេះមិនត្រូវកាត់ដោយរបាររំកិល */
function openSidebarMenu(btn, menuId, placement) {
    const menu = document.getElementById(menuId);
    if (!menu) return;
    const wasOpen = !menu.classList.contains('hidden');
    closeSidebarMenus();
    if (wasOpen) return;
    const r = btn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.classList.remove('hidden');
    const h = menu.offsetHeight;
    menu.style.left = `${r.left}px`;
    menu.style.width = `${Math.max(r.width, 232)}px`;
    menu.style.top = placement === 'up' ? `${r.top - h - 6}px` : `${r.bottom + 6}px`;
    btn.setAttribute('aria-expanded', 'true');
}

function closeSidebarMenus() {
    document.querySelectorAll('.sb-menu').forEach(m => m.classList.add('hidden'));
    document.querySelectorAll('[data-sb-menu]').forEach(b => b.setAttribute('aria-expanded', 'false'));
}

document.addEventListener('click', e => {
    if (!e.target.closest('.sb-menu') && !e.target.closest('[data-sb-menu]')) closeSidebarMenus();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebarMenus(); });

/* ===== ការគ្រប់គ្រងការបង្រួម/ពង្រីករបារចំហៀង (Sidebar Collapse Controller) ===== */
function isSidebarCollapsed() {
    try {
        return localStorage.getItem('bms_sidebar_collapsed') === '1';
    } catch (e) {
        return false;
    }
}

function setSidebarCollapsed(collapsed) {
    const sb = document.getElementById('portalSidebar');
    if (sb) {
        sb.classList.toggle('is-collapsed', !!collapsed);
    }
    const icon = document.getElementById('sidebarToggleIcon');
    if (icon) {
        icon.setAttribute('icon', collapsed ? 'mdi:menu-open' : 'mdi:menu');
    }
    const brandIcon = document.getElementById('sbBrandToggleIcon');
    if (brandIcon) {
        brandIcon.setAttribute('icon', collapsed ? 'mdi:chevron-double-right' : 'mdi:chevron-double-left');
    }
    try {
        localStorage.setItem('bms_sidebar_collapsed', collapsed ? '1' : '0');
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('bms-sidebar-toggle', { detail: { collapsed } }));
    if (window.echarts) {
        setTimeout(() => {
            document.querySelectorAll('[_echarts_instance_]').forEach(el => {
                const chart = echarts.getInstanceByDom(el);
                if (chart) chart.resize();
            });
        }, 250);
    }
}

function toggleSidebarCollapse() {
    if (window.innerWidth < 1024) {
        const aside = document.querySelector('aside');
        if (aside && aside.classList.contains('mobile-open')) {
            closePortalDrawer();
        } else {
            openPortalDrawer();
        }
        return;
    }
    const sb = document.getElementById('portalSidebar');
    const currentlyCollapsed = sb ? sb.classList.contains('is-collapsed') : isSidebarCollapsed();
    setSidebarCollapsed(!currentlyCollapsed);
}

document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleSidebarCollapse();
    }
});

function renderPortalSidebarV2(host, cfg, roleRoot, activeId, sharedRoot) {
    const portalId = document.body.id;

    let lastGroup = null;
    const navHtml = cfg.nav.map(item => {
        let groupHtml = '';
        const group = item.group || (portalId === 'posPortal' ? 'វេនរបស់ខ្ញុំ' : lastGroup);
        if (group && group !== lastGroup) {
            groupHtml = `<p class="sb-group px-3 ${lastGroup ? 'pt-5' : 'pt-1'} pb-1.5">${group}</p>`;
            lastGroup = group;
        }
        const isActive = item.id === activeId;
        let badgeHtml = '';
        if (item.badge) badgeHtml += '<span id="navQueueBadge" class="sb-badge sb-count hidden">0</span>';
        if (item.alertBadge) badgeHtml += '<span id="navAlertBadge" class="sb-badge sb-count sb-count-warn hidden">0</span>';
        if (item.badgeFn) badgeHtml += `<span data-badge-fn="${item.badgeFn}" class="sb-badge sb-count ${item.badgeTone === 'amber' ? 'sb-count-warn' : ''} hidden">0</span>`;
        return `${groupHtml}
            <a href="${roleRoot}/${item.href}" ${isActive ? 'aria-current="page"' : ''} title="${item.label}" class="sb-nav-item sb-row relative">
                <span class="sb-icon w-5 flex items-center justify-center flex-shrink-0">${getIconHtml(item.icon)}</span>
                <span class="sb-label flex-1 truncate">${item.label}</span>
                ${badgeHtml}
            </a>`;
    }).join('');

    const avatar = cfg.userId && typeof avatarHtml === 'function'
        ? avatarHtml(cfg.userId, 'w-8 h-8')
        : `<div class="w-8 h-8 rounded-full sb-avatar border flex items-center justify-center font-semibold text-xs flex-shrink-0">${cfg.userInitials}</div>`;
    const roleLabel = { adminPortal: 'ម្ចាស់ហាង', managerPortal: 'អ្នកគ្រប់គ្រង', posPortal: 'ផ្ទាំងគិតលុយ' }[portalId] || cfg.title;
    const canSwitch = (cfg.views || []).length > 1;
    const menuItem = (icon, label, attrs, tone) => `<button type="button" ${attrs}
        class="sb-menu-item w-full flex items-center gap-3 px-3 py-2 rounded-md text-left ${tone || ''}">
        <iconify-icon icon="${icon}" class="text-[18px] flex-shrink-0 opacity-80"></iconify-icon><span class="flex-1">${label}</span></button>`;

    host.outerHTML = `
        <aside id="portalSidebar" class="w-[272px] text-white flex flex-col flex-shrink-0 select-none z-20 border-r border-white/[0.06]">
            <div class="sb-brand h-[72px] px-6 flex items-center justify-between flex-shrink-0 border-b border-white/[0.06]">
                <button type="button" data-sb-menu onclick="if(isSidebarCollapsed()){toggleSidebarCollapse();}else if(${canSwitch}){openSidebarMenu(this, 'sbRoleMenu', 'down');}" aria-haspopup="${canSwitch ? 'menu' : 'false'}" aria-expanded="false"
                    class="sb-switcher relative -mx-2 px-2 py-1.5 flex-1 min-w-0 flex items-center gap-3 rounded-lg hover:bg-white/[0.06] text-left transition-colors cursor-pointer" title="${roleLabel}">
                    <span class="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center flex-shrink-0">
                        <img src="${sharedRoot}/assets/logo-mark-transparent.png" alt="DIGITECHKH" class="w-5 h-5 object-contain">
                    </span>
                    <span class="min-w-0 flex-1 sb-brand-text">
                        <span class="block text-[15px] font-semibold text-white leading-tight tracking-wide">DIGITECHKH</span>
                        <span class="block sb-sub truncate">${roleLabel}</span>
                    </span>
                    ${canSwitch ? '<iconify-icon icon="mdi:unfold-more-horizontal" class="text-lg sb-muted flex-shrink-0"></iconify-icon>' : ''}
                </button>
                <button type="button" onclick="toggleSidebarCollapse()" title="បង្រួម/ពង្រីករបារចំហៀង (Ctrl+B)" class="sb-brand-text sb-collapse-btn w-7 h-7 rounded-lg text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center transition flex-shrink-0 cursor-pointer ml-1">
                    <iconify-icon id="sbBrandToggleIcon" icon="mdi:chevron-double-left" class="text-base"></iconify-icon>
                </button>
            </div>
            ${canSwitch ? `<div id="sbRoleMenu" role="menu" class="sb-menu hidden z-[70] p-1.5 rounded-lg border border-white/10 shadow-2xl text-white">
                <p class="px-3 pt-1.5 pb-1 sb-group">ប្តូរទិដ្ឋភាព</p>
                ${cfg.views.map(v => v.current
                    ? `<div class="sb-menu-item flex items-center gap-3 px-3 py-2 rounded-md bg-white/[0.06]">
                        <iconify-icon icon="${v.icon}" class="text-[18px] opacity-80"></iconify-icon><span class="flex-1">${v.label}</span>
                        <iconify-icon icon="mdi:check" class="text-[18px] text-emerald-400"></iconify-icon></div>`
                    : menuItem(v.icon, v.label, `onclick="location.href='${roleRoot}/${v.href}'"`)).join('')}
            </div>` : ''}

            <div id="sbStatus" class="mx-3 mt-3 px-3 py-2.5 rounded-lg bg-white/[0.04]"></div>

            <nav aria-label="ម៉ឺនុយរុករក" class="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-hide">
                ${navHtml}
            </nav>

            <div class="sb-foot p-2.5 border-t">
                <button type="button" data-sb-menu onclick="openSidebarMenu(this, 'sbUserMenu', 'up')" aria-haspopup="menu" aria-expanded="false"
                    class="sb-user sb-row relative w-full !h-auto text-left rounded-xl transition-colors cursor-pointer" title="${cfg.userName} (${cfg.userRole})">
                    <div class="relative flex-shrink-0">
                        ${avatar}
                        <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 sb-presence"></span>
                    </div>
                    <span class="min-w-0 flex-1 user-meta">
                        <span class="block text-[14.5px] font-medium text-white leading-tight truncate">${cfg.userName}</span>
                        <span class="block sb-sub text-[12px] text-white/70 leading-snug mt-0.5" title="${cfg.userRole}">${cfg.userRole}</span>
                    </span>
                    <iconify-icon icon="mdi:dots-horizontal" class="text-lg sb-muted flex-shrink-0"></iconify-icon>
                </button>
            </div>

            <div id="sbUserMenu" role="menu" class="sb-menu hidden z-[70] p-1.5 rounded-lg border border-white/10 shadow-2xl text-white">
                <div class="flex items-center gap-3 px-3 py-2.5">
                    ${avatar}
                    <span class="min-w-0"><span class="block text-[14.5px] font-medium truncate">${cfg.userName}</span><span class="block sb-sub text-[12px] text-white/70 mt-0.5">${cfg.userRole}</span></span>
                </div>
                <div class="h-px bg-white/[0.08] my-1"></div>
                ${(cfg.views || []).filter(v => !v.current).map(v => menuItem(v.icon, `ប្តូរទៅ${v.label}`, `onclick="location.href='${roleRoot}/${v.href}'"`)).join('')}
                ${menuItem('mdi:theme-light-dark', 'ទម្រង់ភ្លឺ ឬងងឹត', 'onclick="toggleDarkMode(); closeSidebarMenus()"')}
                ${menuItem('mdi:shield-check-outline', 'គោលការណ៍សិទ្ធិ', "onclick=\"document.getElementById('sbPolicyBody').classList.toggle('hidden')\"")}
                <p id="sbPolicyBody" class="hidden mx-3 mb-1.5 mt-0.5 sb-sub leading-relaxed">${cfg.policyNote}</p>
                <div class="h-px bg-white/[0.08] my-1"></div>
                ${menuItem('mdi:logout', 'ចាកចេញ', 'onclick="handleLogout()"', 'text-rose-300 hover:!bg-rose-500/15')}
            </div>
        </aside>`;
}

/* ===== ក្បាលទំព័ររួម =====
   ទំព័រគ្រាន់តែដាក់ <div id="headerHost" data-title="..." data-subtitle="..."></div>
   រួចក្បាលទំព័របង្កើតចេញពីអនុគមន៍តែមួយ ដូច្នេះគ្រប់ទំព័រដូចគ្នា 100%។
   រចនា៖ ចំណងជើង និងចំណងជើងរងខាងឆ្វេង · ជូនដំណឹង និងប្រវត្តិរូបខាងស្តាំ។

   ទិន្នន័យជូនដំណឹងមកពីអនុគមន៍ portalNotifications() ក្នុង data.js របស់តួនាទី
   នីមួយៗ (ស្រេចចិត្ត)។ បើគ្មាន ប្រអប់នឹងបង្ហាញសារថាគ្មានដំណឹងថ្មី។ */

function portalNotificationList() {
    if (typeof portalNotifications === 'function') {
        try {
            return portalNotifications() || [];
        } catch (e) {
            return [];
        }
    }
    return [];
}

/* ទំព័រខ្លះកំណត់ចំណងជើង និងចំណងជើងរងតាមទិន្នន័យពេលដំណើរការ (ឧ. លេខវេន ឬលេខវិក្កយបត្រ) */
function setPortalSubtitle(text) {
    const el = document.getElementById('portalSubtitle');
    if (el) el.textContent = text;
}

function setPortalTitle(text) {
    const el = document.getElementById('portalTitle');
    if (el) el.textContent = text;
}

/* ប្តូរគោលដៅប៊ូតុងត្រឡប់ក្រោយពេលដំណើរការ (ទំព័រកែប្រែខ្លះត្រឡប់ទៅទំព័រលម្អិត) */
function setPortalBackHref(href) {
    const el = document.getElementById('portalBackBtn');
    if (el) el.href = href;
}

function isDarkMode() {
    try {
        return localStorage.getItem('bms_theme') === 'dark';
    } catch (e) {
        return false;
    }
}

function updateDarkModeUI(isDark) {
    const icons = document.querySelectorAll('#darkModeIcon, [data-dark-toggle-icon]');
    icons.forEach(icon => {
        icon.setAttribute('icon', isDark ? 'mdi:weather-sunny' : 'mdi:weather-night');
        icon.className = isDark ? 'text-xl text-amber-400' : 'text-xl text-slate-500';
    });
    if (isDark) {
        document.documentElement.classList.add('dark');
        if (document.body) document.body.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
        if (document.body) document.body.classList.remove('dark');
    }

    // Call page callbacks if defined
    if (typeof window.onThemeChanged === 'function') {
        try { window.onThemeChanged(isDark); } catch (e) { console.error(e); }
    }
    if (typeof window.renderAll === 'function') {
        try { window.renderAll(); } catch (e) { console.error(e); }
    }

    // Dispatch custom event for pages with specialized widgets
    window.dispatchEvent(new CustomEvent('bms-theme-change', { detail: { isDark } }));

    // Trigger chart resize / update if chart exists
    if (window.echarts) {
        const charts = document.querySelectorAll('[_echarts_instance_]');
        charts.forEach(el => {
            const chart = echarts.getInstanceByDom(el);
            if (chart) {
                chart.resize();
            }
        });
    }
}

function toggleDarkMode() {
    const nextDark = !isDarkMode();
    try {
        localStorage.setItem('bms_theme', nextDark ? 'dark' : 'light');
    } catch (e) {}
    updateDarkModeUI(nextDark);
    if (typeof showToast === 'function') {
        showToast(nextDark ? 'បានប្តូរទៅទម្រង់ងងឹត' : 'បានប្តូរទៅទម្រង់ភ្លឺ', 'info');
    }
}

function initDarkMode() {
    updateDarkModeUI(isDarkMode());
}

const NOTE_TONE_MAP = {
    info: 'bg-sky-100 text-sky-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700'
};

/* បង្កើតបញ្ជីជូនដំណឹងឡើងវិញ — ហៅពេលបើកទំព័រ និងពេលឃ្លាំងទិន្នន័យផ្លាស់ប្តូរ (រួមទាំងពីផ្ទាំងរុករកផ្សេង) */
function refreshPortalNotifications() {
    const rowsEl = document.getElementById('portalNotifRows');
    if (!rowsEl) return;
    const notes = portalNotificationList();

    rowsEl.innerHTML = notes.length
        ? notes.map(n => {
            const tone = NOTE_TONE_MAP[n.tone] || NOTE_TONE_MAP.info;
            const inner = `
                <span class="w-9 h-9 rounded-xl ${tone} flex items-center justify-center flex-shrink-0">
                    <iconify-icon icon="${n.icon || 'mdi:bell-outline'}" class="text-lg"></iconify-icon>
                </span>
                <div class="min-w-0 flex-1">
                    <p class="text-[13px] font-semibold text-slate-800 leading-snug">${n.title}</p>
                    ${n.note ? `<p class="text-[12px] text-slate-500 mt-0.5 leading-relaxed">${n.note}</p>` : ''}
                    ${n.time ? `<p class="text-[11px] text-slate-400 font-medium mt-1 inline-flex items-center gap-1"><iconify-icon icon="mdi:clock-outline" class="text-[12px]"></iconify-icon>${n.time}</p>` : ''}
                </div>
                ${n.href ? '<iconify-icon icon="mdi:chevron-right" class="text-slate-300 text-lg flex-shrink-0 self-center"></iconify-icon>' : ''}`;
            const cls = 'flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition';
            return n.href ? `<a href="${n.href}" class="${cls}">${inner}</a>` : `<div class="${cls}">${inner}</div>`;
        }).join('')
        : `<div class="py-10 text-center">
               <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                   <iconify-icon icon="mdi:bell-check-outline" class="text-2xl"></iconify-icon>
               </div>
               <p class="text-[13px] font-semibold text-slate-700">គ្មានដំណឹងថ្មីទេ</p>
               <p class="text-[12px] text-slate-400 mt-0.5">អ្វីៗដំណើរការធម្មតា</p>
           </div>`;

    const unread = typeof unreadNotificationCount === 'function' ? unreadNotificationCount() : notes.length;
    const dot = document.getElementById('portalNotifDot');
    if (dot) dot.classList.toggle('hidden', !unread);
    const count = document.getElementById('portalNotifCount');
    if (count) {
        count.textContent = notes.length;
        count.classList.toggle('hidden', !notes.length);
    }
    const readBtn = document.getElementById('portalNotifReadBtn');
    if (readBtn) readBtn.classList.toggle('hidden', !(unread && typeof markNotificationsRead === 'function'));
}

function markPortalNotificationsRead() {
    if (typeof markNotificationsRead === 'function') markNotificationsRead();
}

function renderPortalHeader() {
    const host = document.getElementById('headerHost');
    if (!host) return;

    const portalId = document.body.dataset.portal || document.body.id || 'smPortal';
    const cfg = PORTAL_CONFIGS[portalId] || PORTAL_CONFIGS.smPortal;
    const title = host.dataset.title || '';
    const subtitle = host.dataset.subtitle || '';
    const backHref = host.dataset.back || '';
    const avatarSrc = `${getRoleRoot()}/shared/assets/avatars/${portalId}.jpg`;

    const notes = portalNotificationList();

    const backBtn = backHref
        ? `<a id="portalBackBtn" href="${backHref}" aria-label="ត្រឡប់ក្រោយ"
              class="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition border border-slate-200/70 flex-shrink-0">
               <i class="fas fa-arrow-left text-sm"></i>
           </a>`
        : '';

    host.outerHTML = `
        <header class="bg-white px-6 h-[72px] flex justify-between items-center shadow-sm z-10 flex-shrink-0 w-full transition-colors duration-200">
            <div class="flex items-center gap-4 min-w-0">
                ${backBtn}
                <div class="min-w-0">
                    <h2 id="portalTitle" class="text-xl font-semibold text-gray-800 leading-tight truncate">${title}</h2>
                    <p id="portalSubtitle" class="text-xs text-gray-400 mt-0.5 truncate">${subtitle}</p>
                </div>
            </div>

            <div class="flex items-center gap-1.5 flex-shrink-0">
                <!-- Dark Mode Toggle Button -->
                <button onclick="toggleDarkMode()" type="button" aria-label="ប្តូររវាងទម្រង់ភ្លឺ និងទម្រង់ងងឹត" id="darkModeToggleBtn"
                    class="w-10 h-10 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer">
                    <iconify-icon id="darkModeIcon" icon="mdi:weather-night" class="text-xl"></iconify-icon>
                </button>

                <!-- Notification Menu -->
                <div class="relative">
                    <button onclick="toggleRowActionMenu(event, 'portalNotifMenu')" type="button" aria-label="ការជូនដំណឹង"
                        class="relative w-10 h-10 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer">
                        <iconify-icon icon="mdi:bell-outline" class="text-xl"></iconify-icon>
                        <span id="portalNotifDot" class="hidden absolute top-2 right-2.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white"></span>
                    </button>
                    <div id="portalNotifMenu" class="hidden bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 text-left z-50">
                        <div class="px-3 pt-2 pb-2.5 mb-1 border-b border-slate-100 flex items-center justify-between gap-2">
                            <span class="flex items-center gap-2">
                                <span class="text-[14px] font-bold text-slate-800">ការជូនដំណឹង</span>
                                <span id="portalNotifCount" class="text-[11px] font-bold min-w-[22px] h-[22px] px-1.5 rounded-full bg-rose-500 text-white inline-flex items-center justify-center">0</span>
                            </span>
                            <button id="portalNotifReadBtn" onclick="markPortalNotificationsRead()" type="button" class="hidden text-[11px] font-medium text-sky-700 hover:text-sky-900">សម្គាល់ថាបានអានទាំងអស់</button>
                        </div>
                        <div id="portalNotifRows" class="max-h-[380px] overflow-y-auto scrollbar-hide space-y-0.5"></div>
                    </div>
                </div>
            </div>
        </header>`;

    refreshPortalNotifications();
    initDarkMode();
}

function renderPortalSidebar() {
    // ច្រកខាងក្រៅ (អតិថិជន/អ្នកផ្គត់ផ្គង់) មាន <aside> ផ្ទាល់ខ្លួន ដូច្នេះមិនជំនួសទេ
    const host = document.getElementById('sidebarHost');
    if (!host) return;

    const portalId = document.body.dataset.portal || document.body.id || 'smPortal';
    const cfg = PORTAL_CONFIGS[portalId] || PORTAL_CONFIGS.smPortal;
    const roleRoot = getRoleRoot();
    const activeId = document.body.dataset.active || '';
    const sharedRoot = `${roleRoot}/shared`;

    if (cfg.sidebarV2) {
        renderPortalSidebarV2(host, sessionPortalConfig(cfg, portalId), roleRoot, activeId, sharedRoot);
        if (isSidebarCollapsed()) {
            setSidebarCollapsed(true);
        }
        refreshSidebarStatus();
        setInterval(refreshSidebarStatus, 60000);
        return;
    }

    const navHtml = cfg.nav.map(item => {
        const isActive = item.id === activeId;
        let badgeHtml = '';
        if (item.badge) {
            badgeHtml += '<span id="navQueueBadge" class="sm-badge bg-rose-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">0</span>';
        }
        if (item.alertBadge) {
            badgeHtml += '<span id="navAlertBadge" class="sm-badge bg-amber-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">0</span>';
        }
        if (badgeHtml) badgeHtml = `<span class="flex items-center gap-1 flex-shrink-0">${badgeHtml}</span>`;
        return `
            <a href="${roleRoot}/${item.href}" class="${isActive ? NAV_ACTIVE_CLASS : NAV_IDLE_CLASS}">
                <span class="flex items-center min-w-0">
                    <span class="w-6 flex items-center justify-center text-sky-300 flex-shrink-0">
                        ${getIconHtml(item.icon)}
                    </span>
                    <span class="ml-3 sm-nav-label truncate">${item.label}</span>
                </span>
                ${badgeHtml}
            </a>`;
    }).join('');

    host.outerHTML = `
        <aside class="w-64 bg-[#1e3a5f] text-white flex flex-col flex-shrink-0 select-none z-20 border-r border-slate-700">
            <div class="h-[72px] px-6 flex items-center gap-3 border-b border-white/10 flex-shrink-0">
                <div class="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <img src="${sharedRoot}/assets/logo-mark-transparent.png" alt="DIGITECHKH" class="w-full h-full object-contain">
                </div>
                <div class="min-w-0">
                    <h1 class="text-lg font-semibold tracking-wider whitespace-nowrap text-white">DIGITECHKH</h1>
                    <span class="sm-nav-note font-medium text-sky-300 uppercase tracking-wider block">${cfg.title}</span>
                </div>
            </div>

            <div class="px-5 py-3 border-b border-white/5 bg-black/15">
                <div class="flex items-center justify-between">
                    <span class="sm-nav-note text-sky-200">តួនាទី:</span>
                    <span class="sm-badge inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30">
                        ${getIconHtml(cfg.roleIcon, 'text-[13px]')} ${cfg.roleName}
                    </span>
                </div>
            </div>

            <nav class="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-hide">
                ${navHtml}
                <div class="p-3 rounded-xl bg-white/5 border border-white/10 sm-nav-note text-sky-200 mt-6 flex items-start gap-2">
                    <iconify-icon icon="mdi:information-outline" class="text-sky-300 text-base mt-0.5 flex-shrink-0"></iconify-icon>
                    <span>${cfg.policyNote}</span>
                </div>
            </nav>

            <div class="p-3.5 border-t border-white/10 bg-black/20">
                <button onclick="handleLogout()" type="button"
                    class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-rose-600 text-sky-100 hover:text-white text-sm font-semibold transition border border-white/10 shadow-sm cursor-pointer group">
                    <iconify-icon icon="mdi:logout" class="text-lg text-rose-300 group-hover:text-white group-hover:translate-x-0.5 transition-transform"></iconify-icon>
                    <span>ចាកចេញ</span>
                </button>
            </div>
        </aside>`;
}

function handleLogout() {
    showCustomConfirm({
        title: 'ចាកចេញពីប្រព័ន្ធ',
        message: 'តើលោកអ្នកពិតជាចង់ចាកចេញពីប្រព័ន្ធមែនទេ?',
        confirmText: 'ចាកចេញ',
        cancelText: 'បោះបង់',
        danger: true,
        onConfirm: () => {
            if (typeof posLogout === 'function') posLogout();
            showToast('កំពុងចាកចេញពីប្រព័ន្ធ...', 'info');
            const roleRoot = getRoleRoot();
            setTimeout(() => {
                window.location.href = `${roleRoot}/index.html`;
            }, 400);
        }
    });
}

/* ===== 1. របារចំហៀងចល័តសម្រាប់អេក្រង់តូច (< 1024px) ===== */
function initPortalMobileDrawer() {
    const aside = document.querySelector('aside');
    const header = document.querySelector('header');
    if (!aside || !header) return;

    let backdrop = document.getElementById('bmsMobileBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'bmsMobileBackdrop';
        backdrop.onclick = closePortalDrawer;
        document.body.appendChild(backdrop);
    }

    // ទំព័ររងដែលមានប៊ូតុងត្រឡប់ក្រោយស្រាប់ មិនបញ្ចូលប៊ូតុងម៉ឺនុយទេ ដើម្បីកុំឱ្យក្បាលទំព័ររញ៉េរញ៉ៃ
    const hasBackButton = header.querySelector('a i.fa-arrow-left');
    if (!hasBackButton && !document.getElementById('bmsMobileMenuBtn')) {
        const btn = document.createElement('button');
        btn.id = 'bmsMobileMenuBtn';
        btn.type = 'button';
        btn.title = 'បើកម៉ឺនុយ';
        btn.className = 'lg:hidden w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition border border-slate-200/70 flex-shrink-0 mr-3';
        btn.innerHTML = '<i class="fas fa-bars text-sm"></i>';
        btn.onclick = openPortalDrawer;
        header.insertBefore(btn, header.firstElementChild);
    }

    if (!document.getElementById('bmsSidebarCloseBtn')) {
        const brand = aside.firstElementChild;
        if (brand) {
            const close = document.createElement('button');
            close.id = 'bmsSidebarCloseBtn';
            close.type = 'button';
            close.title = 'បិទម៉ឺនុយ';
            close.className = 'lg:hidden w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition flex-shrink-0 ml-auto';
            close.innerHTML = '<i class="fas fa-xmark text-sm"></i>';
            close.onclick = closePortalDrawer;
            brand.appendChild(close);
        }
    }
}

function openPortalDrawer() {
    const aside = document.querySelector('aside');
    const backdrop = document.getElementById('bmsMobileBackdrop');
    if (aside) aside.classList.add('mobile-open');
    if (backdrop) backdrop.classList.add('active');
}

function closePortalDrawer() {
    const aside = document.querySelector('aside');
    const backdrop = document.getElementById('bmsMobileBackdrop');
    if (aside) aside.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
}

/* ===== 2. តម្រងកាលបរិច្ឆេទរួម (ស្តង់ដារលេខ 3) =====
   ទម្រង់ HTML ត្រូវបានបង្កើតចេញពីអនុគមន៍តែមួយ ដូច្នេះគ្រប់ទំព័រទាំងអស់ដូចគ្នាបេះបិទ 100% ដោយស្វ័យប្រវត្តិ */

const MONTH_NAMES_KH = {
    1: 'មករា', 2: 'កុម្ភៈ', 3: 'មីនា', 4: 'មេសា',
    5: 'ឧសភា', 6: 'មិថុនា', 7: 'កក្កដា', 8: 'សីហា',
    9: 'កញ្ញា', 10: 'តុលា', 11: 'វិច្ឆិកា', 12: 'ធ្នូ'
};

const DATE_PRESETS = [
    'ថ្ងៃនេះ', 'ម្សិលមិញ', 'សប្តាហ៍នេះ', 'សប្តាហ៍មុន', 'ខែនេះ',
    'ខែមុន', 'ឆ្នាំនេះ', '7 ថ្ងៃចុងក្រោយ', '14 ថ្ងៃចុងក្រោយ', '30 ថ្ងៃចុងក្រោយ'
];

let rangeStartDate = null;
let rangeEndDate = null;
let selectingRangeStart = false;
/* ច្រកដែលបានផ្លាស់ទៅប្រើឃ្លាំងរួច (មាន store.js) ប្រើ BMS_TODAY ពិត និងជួរ «ខែនេះ» ដល់ថ្ងៃនេះ (ឯកសារ 18 ផ្នែក C)
   ច្រកដែលមិនទាន់ផ្លាស់ទៅ នៅរក្សាអាកប្បកិរិយាដើម (BMS_TODAY ក្នុង data.js របស់ខ្លួន ឬថ្ងៃពិត) រហូតដល់ត្រូវផ្លាស់ */
const PORTAL_USES_STORE = typeof BMS_STORE !== 'undefined';

function portalToday() {
    return typeof BMS_TODAY !== 'undefined' ? new Date(BMS_TODAY) : new Date(new Date().setHours(0, 0, 0, 0));
}

// ទិន្នន័យគំរូក្នុងឃ្លាំងរួចត្រូវបង្កើតធៀបនឹងថ្ងៃនេះ ដូច្នេះ 30 ថ្ងៃចុងក្រោយ តែងតែមានទិន្នន័យ ទោះថ្ងៃដើមខែក៏ដោយ
const DEFAULT_PRESET = PORTAL_USES_STORE ? '30 ថ្ងៃចុងក្រោយ' : 'ខែនេះ';
let currentPresetName = DEFAULT_PRESET;
let calCurrentMonth = portalToday().getMonth() + 1;
let calCurrentYear = portalToday().getFullYear();

function renderDateRangePicker(hostId) {
    const host = document.getElementById(hostId);
    if (!host) return;

    const presetButtons = DATE_PRESETS.map(name => {
        const isDefault = name === DEFAULT_PRESET;
        const cls = isDefault
            ? 'preset-btn w-full text-left px-3 py-1.5 rounded-lg bg-[#0f2b5c] text-white font-medium shadow-sm transition-colors'
            : 'preset-btn w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600';
        return `<button class="${cls}" onclick="selectPreset('${name}')">${name}</button>`;
    }).join('');

    host.classList.add('relative');
    host.innerHTML = `
        <span class="text-xs text-slate-400 hidden sm:!inline mr-1.5">កាលបរិច្ឆេទ:</span>
        <button onclick="toggleDatePicker(event)" class="h-9 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-xl inline-flex items-center gap-2 shadow-sm transition-all focus:outline-none cursor-pointer">
            <i class="fas fa-calendar-days text-primary text-xs"></i>
            <span id="selectedDateLabel" class="font-medium text-slate-800"></span>
            <i class="fas fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200 ml-0.5" id="datePickerChevron"></i>
        </button>
        <div id="datePickerPopover" onclick="event.stopPropagation()" class="hidden absolute right-0 top-full mt-1.5 w-[480px] max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 select-none">
            <div class="grid grid-cols-[140px_1fr]">
                <div class="p-3 border-r border-slate-100 space-y-0.5 text-xs">${presetButtons}</div>
                <div class="p-3.5">
                    <div class="flex items-center justify-between mb-2">
                        <button onclick="changeCalendarMonth(-1)" class="w-6 h-6 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition">
                            <i class="fas fa-chevron-left text-[10px]"></i>
                        </button>
                        <span id="calMonthYearLabel" class="text-xs font-semibold text-slate-800"></span>
                        <button onclick="changeCalendarMonth(1)" class="w-6 h-6 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition">
                            <i class="fas fa-chevron-right text-[10px]"></i>
                        </button>
                    </div>
                    <div class="grid grid-cols-7 gap-y-1 text-center text-[10px] text-slate-400 font-semibold mb-1">
                        <span>ច</span><span>អ</span><span>ព</span><span>ព្រ</span><span>សុ</span><span>ស</span><span>អា</span>
                    </div>
                    <div id="calendarDaysGrid" class="grid grid-cols-7 gap-y-1 text-center text-xs"></div>
                </div>
            </div>
            <div class="flex items-center justify-between gap-2 p-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-medium text-slate-700">
                    <span id="rangeTagLabel"></span>
                    <button onclick="clearRangeTag()" class="text-slate-400 hover:text-rose-500 transition"><i class="fas fa-xmark text-[10px]"></i></button>
                </span>
                <div class="flex items-center gap-2">
                    <button onclick="toggleDatePicker(event)" class="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 text-[11px] font-medium transition">បោះបង់</button>
                    <button onclick="applyDateRange()" class="px-3.5 py-1.5 rounded-lg bg-[#0f2b5c] hover:bg-[#0a1d3f] text-white text-[11px] font-semibold shadow-sm transition">ជ្រើសរើស</button>
                </div>
            </div>
        </div>`;

    selectPreset(DEFAULT_PRESET);
}

function toggleDatePicker(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const popover = document.getElementById('datePickerPopover');
    const chevron = document.getElementById('datePickerChevron');
    if (!popover) return;
    if (popover.classList.contains('hidden')) {
        popover.classList.remove('hidden');
        if (chevron) chevron.classList.add('rotate-180');
        renderCalendarGrid();
    } else {
        popover.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
    }
}

function changeCalendarMonth(delta) {
    calCurrentMonth += delta;
    if (calCurrentMonth > 12) { calCurrentMonth = 1; calCurrentYear += 1; }
    else if (calCurrentMonth < 1) { calCurrentMonth = 12; calCurrentYear -= 1; }
    renderCalendarGrid();
}

function updateRangeLabels(btnText, tagText) {
    const btnEl = document.getElementById('selectedDateLabel');
    const tagEl = document.getElementById('rangeTagLabel');
    if (btnEl) btnEl.textContent = btnText;
    if (tagEl) tagEl.textContent = tagText;
}

function highlightPresetButton(name) {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        if (name && btn.textContent.trim() === name) {
            btn.className = 'preset-btn w-full text-left px-3 py-1.5 rounded-lg bg-[#0f2b5c] text-white font-medium shadow-sm transition-colors';
        } else {
            btn.className = 'preset-btn w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600';
        }
    });
}

function handleDateClick(year, month, day) {
    const clickedDate = new Date(year, month - 1, day);
    clickedDate.setHours(0, 0, 0, 0);

    if (!selectingRangeStart || (rangeStartDate && rangeEndDate)) {
        rangeStartDate = clickedDate;
        rangeEndDate = null;
        selectingRangeStart = true;
        currentPresetName = null;
        const tagEl = document.getElementById('rangeTagLabel');
        if (tagEl) tagEl.textContent = `${day} ${MONTH_NAMES_KH[month]} (សូមជ្រើសថ្ងៃបញ្ចប់)`;
    } else {
        if (clickedDate < rangeStartDate) {
            rangeEndDate = rangeStartDate;
            rangeStartDate = clickedDate;
        } else {
            rangeEndDate = clickedDate;
        }
        selectingRangeStart = false;

        const sD = rangeStartDate.getDate();
        const sM = MONTH_NAMES_KH[rangeStartDate.getMonth() + 1];
        const eD = rangeEndDate.getDate();
        const eM = MONTH_NAMES_KH[rangeEndDate.getMonth() + 1];
        const rangeText = `${sD} ${sM} - ${eD} ${eM}`;
        updateRangeLabels(rangeText, rangeText);
    }

    highlightPresetButton(null);
    renderCalendarGrid();
}

function renderCalendarGrid() {
    const grid = document.getElementById('calendarDaysGrid');
    const monthLabel = document.getElementById('calMonthYearLabel');
    if (!grid) return;

    monthLabel.textContent = `${MONTH_NAMES_KH[calCurrentMonth]} ${calCurrentYear}`;
    grid.innerHTML = '';

    const daysInMonth = new Date(calCurrentYear, calCurrentMonth, 0).getDate();
    const firstDayIndex = new Date(calCurrentYear, calCurrentMonth - 1, 1).getDay();
    const leadingBlanks = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    for (let i = 0; i < leadingBlanks; i++) {
        grid.appendChild(document.createElement('span'));
    }

    let effectiveStart = rangeStartDate ? new Date(rangeStartDate) : null;
    let effectiveEnd = rangeEndDate ? new Date(rangeEndDate) : null;
    if (effectiveStart) effectiveStart.setHours(0, 0, 0, 0);
    if (effectiveEnd) effectiveEnd.setHours(0, 0, 0, 0);

    for (let d = 1; d <= daysInMonth; d++) {
        const currentD = new Date(calCurrentYear, calCurrentMonth - 1, d);
        currentD.setHours(0, 0, 0, 0);

        const isStart = effectiveStart && currentD.getTime() === effectiveStart.getTime();
        const isEnd = effectiveEnd && currentD.getTime() === effectiveEnd.getTime();
        const isInRange = effectiveStart && effectiveEnd && currentD > effectiveStart && currentD < effectiveEnd;

        const cell = document.createElement('div');
        cell.className = 'flex items-center justify-center cursor-pointer h-7';
        cell.onclick = () => handleDateClick(calCurrentYear, calCurrentMonth, d);

        if (isStart && isEnd) {
            cell.innerHTML = `<span class="w-7 h-7 rounded-full bg-[#0f2b5c] text-white flex items-center justify-center font-bold text-xs shadow">${d}</span>`;
        } else if (isStart && effectiveEnd) {
            cell.className += ' bg-slate-100 rounded-l-full';
            cell.innerHTML = `<span class="w-7 h-7 rounded-full bg-[#0f2b5c] text-white flex items-center justify-center font-bold text-xs shadow">${d}</span>`;
        } else if (isStart && !effectiveEnd) {
            cell.innerHTML = `<span class="w-7 h-7 rounded-full bg-[#0f2b5c] text-white flex items-center justify-center font-bold text-xs ring-2 ring-primary/30 shadow">${d}</span>`;
        } else if (isEnd) {
            cell.className += ' bg-slate-100 rounded-r-full';
            cell.innerHTML = `<span class="w-7 h-7 rounded-full bg-[#0f2b5c] text-white flex items-center justify-center font-bold text-xs shadow">${d}</span>`;
        } else if (isInRange) {
            cell.className += ' bg-slate-100 text-slate-800 font-medium text-xs';
            cell.innerHTML = `<span>${d}</span>`;
        } else {
            cell.className += ' rounded-lg hover:bg-slate-100 text-slate-700 transition text-xs';
            cell.innerHTML = `<span>${d}</span>`;
        }

        grid.appendChild(cell);
    }
}

/* ជួរកាលបរិច្ឆេទទាំងអស់គណនាពី BMS_TODAY (ឯកសារ 18 ផ្នែក C) មិនមានកាលបរិច្ឆេទចាក់សោរទេ
   ទិន្នន័យគំរូក៏ត្រូវបង្កើតធៀបនឹងថ្ងៃដដែល ដូច្នេះតម្រង «7 ថ្ងៃចុងក្រោយ» តែងតែមានកំណត់ត្រា។ */
function presetRange(name) {
    const t = portalToday();
    const at = (y, m, d) => new Date(y, m, d);
    const shift = days => at(t.getFullYear(), t.getMonth(), t.getDate() + days);
    const dow = (t.getDay() + 6) % 7; // ច័ន្ទ = 0
    switch (name) {
        case 'ថ្ងៃនេះ': return [t, t];
        case 'ម្សិលមិញ': return [shift(-1), shift(-1)];
        case 'សប្តាហ៍នេះ': return [shift(-dow), t];
        case 'សប្តាហ៍មុន': return [shift(-dow - 7), shift(-dow - 1)];
        case 'ខែនេះ': return [at(t.getFullYear(), t.getMonth(), 1), PORTAL_USES_STORE ? t : at(t.getFullYear(), t.getMonth() + 1, 0)];
        case 'ខែមុន': return [at(t.getFullYear(), t.getMonth() - 1, 1), at(t.getFullYear(), t.getMonth(), 0)];
        case 'ឆ្នាំនេះ': return [at(t.getFullYear(), 0, 1), PORTAL_USES_STORE ? t : at(t.getFullYear(), 11, 31)];
        case '7 ថ្ងៃចុងក្រោយ': return [shift(-6), t];
        case '14 ថ្ងៃចុងក្រោយ': return [shift(-13), t];
        case '30 ថ្ងៃចុងក្រោយ': return [shift(-29), t];
        default: return null;
    }
}

function rangeLabel(name, start, end) {
    if (name === 'ឆ្នាំនេះ') return `ឆ្នាំ ${start.getFullYear()}`;
    const part = d => `${d.getDate()} ${MONTH_NAMES_KH[d.getMonth() + 1]}`;
    return start.getTime() === end.getTime() ? part(start) : `${part(start)} - ${part(end)}`;
}

function selectPreset(name) {
    currentPresetName = name;
    selectingRangeStart = false;

    const range = presetRange(name);
    if (range) {
        rangeStartDate = range[0];
        rangeEndDate = range[1];
        calCurrentMonth = range[0].getMonth() + 1;
        calCurrentYear = range[0].getFullYear();
        const text = rangeLabel(name, range[0], range[1]);
        updateRangeLabels(text, text);
    }

    highlightPresetButton(name);
    renderCalendarGrid();
}

function clearRangeTag() {
    currentPresetName = 'ទាំងអស់';
    rangeStartDate = null;
    rangeEndDate = null;
    selectingRangeStart = false;
    updateRangeLabels('ទាំងអស់', 'ទាំងអស់');
    highlightPresetButton(null);
    renderCalendarGrid();
}

function applyDateRange() {
    if (selectingRangeStart && rangeStartDate && !rangeEndDate) {
        rangeEndDate = new Date(rangeStartDate);
        selectingRangeStart = false;
        const text = `${rangeStartDate.getDate()} ${MONTH_NAMES_KH[rangeStartDate.getMonth() + 1]}`;
        updateRangeLabels(text, text);
    }
    toggleDatePicker();
    const label = document.getElementById('selectedDateLabel');
    showToast('បានអនុវត្តតម្រងកាលបរិច្ឆេទ៖ ' + (label ? label.textContent : ''), 'info');
    notifyRangeChanged();
}

function getSelectedRange() {
    return { start: rangeStartDate, end: rangeEndDate };
}

function notifyRangeChanged() {
    if (typeof window.onDateRangeApplied === 'function') {
        window.onDateRangeApplied(getSelectedRange());
    }
}

/* ===== 3. ម៉ឺនុយសកម្មភាពជួរតារាង (ស្តង់ដារលេខ 9) ===== */
function toggleRowActionMenu(event, menuId) {
    if (event && event.stopPropagation) event.stopPropagation();
    const btn = event ? event.currentTarget : null;
    const menu = document.getElementById(menuId);
    if (!menu) return;

    if (menu.dataset.floatingActive === 'true') {
        if (typeof closeFloatingDropdown === 'function') closeFloatingDropdown(menu);
    } else {
        if (typeof openFloatingDropdown === 'function') openFloatingDropdown(btn, menu);
    }
}

function updatePortalBadges() {
    // ផ្លាកលេខបង្ហាញតែពេលមានចំនួនពិតប្រាកដ — លេខ 0 ជារំខាន
    const paint = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = value;
        el.classList.toggle('hidden', !value);
    };
    if (typeof totalPending === 'function') paint('navQueueBadge', totalPending());
    if (typeof totalAlerts === 'function') paint('navAlertBadge', totalAlerts());
    document.querySelectorAll('[data-badge-fn]').forEach(el => {
        const fn = window[el.dataset.badgeFn];
        const value = typeof fn === 'function' ? fn() : 0;
        el.textContent = value;
        el.classList.toggle('hidden', !value);
    });
}

/* ពេលឃ្លាំងទិន្នន័យផ្លាស់ប្តូរ (ក្នុងផ្ទាំងនេះ ឬផ្ទាំងរុករកផ្សេង) ធ្វើបច្ចុប្បន្នភាពផ្លាកលេខ ជូនដំណឹង
   និងទំព័រ (ទំព័រកំណត់ window.onStoreChanged ដើម្បីគូរបញ្ជីឡើងវិញ) */
window.addEventListener('bms-store-changed', e => {
    updatePortalBadges();
    refreshSidebarStatus();
    refreshPortalNotifications();
    if (typeof window.onStoreChanged === 'function') window.onStoreChanged(e.detail || {});
});

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    renderPortalSidebar();
    // ក្បាលទំព័រត្រូវបង្កើតមុនថតចល័ត ព្រោះថតចល័តបញ្ចូលប៊ូតុងម៉ឺនុយទៅក្នុងក្បាលទំព័រ
    renderPortalHeader();
    initPortalMobileDrawer();
    updatePortalBadges();

    document.addEventListener('click', (e) => {
        const popover = document.getElementById('datePickerPopover');
        if (popover && !popover.classList.contains('hidden') && !popover.contains(e.target)) {
            const trigger = e.target.closest('button');
            const isTrigger = trigger && trigger.querySelector('#selectedDateLabel');
            if (!isTrigger) {
                popover.classList.add('hidden');
                const chevron = document.getElementById('datePickerChevron');
                if (chevron) chevron.classList.remove('rotate-180');
            }
        }
    });
});

/* ============================================================================
   ធាតុជ្រើសរើសផ្ទាល់ខ្លួន (BMS Select) — ជំនួស <select> ដើមរបស់កម្មវិធីរុករក
   ----------------------------------------------------------------------------
   ច្បាប់ GEMINI.md §4 ហាមប្រើ <select> ដើម។ សមាសភាគនេះផ្តល់ជម្រើសតែមួយ
   ដែលប្រើក្នុងគ្រប់ទំព័រទាំងអស់ ដើម្បីកុំឲ្យនីមួយៗសរសេរកូដផ្ទាល់ខ្លួនម្តងទៀត។

   របៀបប្រើក្នុង HTML:
     <div id="statusFilter" data-bms-select
          data-placeholder="ទាំងអស់"
          data-onchange="refreshList()"
          data-options='[{"value":"all","label":"ទាំងអស់"}]'></div>

   បន្ទាប់ពីចាប់ផ្តើម ធាតុនេះមានលក្ខណសម្បត្តិ .value ដូច <select> ដើម
   ដូច្នេះកូដចាស់ដែលសរសេរ el.value ឬ el.value = 'x' នៅតែដំណើរការដដែល។

   សម្រាប់ជម្រើសដែលបង្កើតដោយ JavaScript សូមប្រើ៖
     bmsSetSelectOptions('adjSku', [{ value, label }], 'ជ្រើសរើស...')
   ========================================================================== */

const BMS_SELECT_STATE = {};

function bmsSelectOptions(hostId) {
    return (BMS_SELECT_STATE[hostId] || {}).options || [];
}

/** អត្ថបទដែលត្រូវបង្ហាញលើប៊ូតុង តាមតម្លៃបច្ចុប្បន្ន */
function bmsSelectLabel(hostId) {
    const st = BMS_SELECT_STATE[hostId];
    if (!st) return '';
    const hit = st.options.find(o => String(o.value) === String(st.value));
    return hit ? hit.label : (st.placeholder || '');
}

function bmsRenderSelect(hostId) {
    const host = document.getElementById(hostId);
    const st = BMS_SELECT_STATE[hostId];
    if (!host || !st) return;

    const chosen = st.options.find(o => String(o.value) === String(st.value));
    const label = chosen ? chosen.label : (st.placeholder || 'ជ្រើសរើស...');
    const muted = chosen ? 'text-slate-700' : 'text-slate-400';
    const menuId = `${hostId}__menu`;

    host.innerHTML = `
        <button type="button" onclick="toggleRowActionMenu(event, '${menuId}')"
            class="w-full h-full flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 hover:bg-slate-100 focus:border-sky-500 outline-none transition text-left">
            <span class="text-xs font-medium ${muted} truncate">${label}</span>
            <i class="fas fa-chevron-down text-[10px] text-slate-400 flex-shrink-0 transition-transform"></i>
        </button>
        <div id="${menuId}" class="hidden bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 text-left">
            ${st.title ? `<div class="px-3 py-2 mb-1 rounded-xl bg-slate-50 border border-slate-100">
                <p class="text-[11px] text-slate-400 font-medium">${st.title}</p>
            </div>` : ''}
            ${st.options.length
                ? st.options.map((o, i) => `
                    <button type="button" onclick="bmsPickSelect('${hostId}', ${i})"
                        class="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition text-left text-xs">
                        <span class="truncate">${o.label}</span>
                        ${String(o.value) === String(st.value) ? '<i class="fas fa-check text-[11px] text-emerald-600 flex-shrink-0"></i>' : ''}
                    </button>`).join('')
                : '<p class="px-3 py-4 text-center text-[11px] text-slate-400">គ្មានជម្រើស</p>'}
        </div>`;
}

function bmsPickSelect(hostId, index) {
    const st = BMS_SELECT_STATE[hostId];
    if (!st) return;
    const opt = st.options[index];
    if (!opt) return;

    st.value = opt.value;
    if (typeof closeAllFloatingDropdowns === 'function') closeAllFloatingDropdowns();
    bmsRenderSelect(hostId);

    const host = document.getElementById(hostId);
    if (host) host.dispatchEvent(new Event('change', { bubbles: true }));
    if (st.onChange) st.onChange();
}

/** កំណត់ជម្រើសថ្មី (សម្រាប់បញ្ជីដែលបង្កើតដោយ JavaScript) */
function bmsSetSelectOptions(hostId, options, placeholder) {
    const st = BMS_SELECT_STATE[hostId];
    if (!st) return;
    // រក្សាទុកវាលបន្ថែមទាំងអស់ (ឧ. ឯកតា, តម្លៃ) ដើម្បីឲ្យទំព័រអានបានវិញ
    st.options = (options || []).map(o =>
        (typeof o === 'string') ? { value: o, label: o } : Object.assign({}, o));
    if (placeholder !== undefined) st.placeholder = placeholder;
    // បើតម្លៃចាស់លែងមានក្នុងបញ្ជីថ្មី ត្រូវសម្អាតចោល
    if (!st.options.some(o => String(o.value) === String(st.value))) st.value = '';
    bmsRenderSelect(hostId);
}

/**
 * ជម្រើសពេញលេញដែលបានជ្រើសរើស — ជំនួស select.options[select.selectedIndex]
 * ត្រឡប់វត្ថុដើមទាំងមូល ដូច្នេះវាលបន្ថែមដូចជា unit ឬ price នៅតែអានបាន
 */
function bmsSelectedOption(hostId) {
    const st = BMS_SELECT_STATE[hostId];
    if (!st) return null;
    return st.options.find(o => String(o.value) === String(st.value)) || null;
}

function bmsGetSelect(hostId) {
    return (BMS_SELECT_STATE[hostId] || {}).value || '';
}

function bmsSetSelect(hostId, value) {
    const st = BMS_SELECT_STATE[hostId];
    if (!st) return;
    st.value = value;
    bmsRenderSelect(hostId);
}

/** ចាប់ផ្តើមធាតុជ្រើសរើសទាំងអស់ក្នុងទំព័រ */
function initBmsSelects(root) {
    (root || document).querySelectorAll('[data-bms-select]').forEach(host => {
        if (host.dataset.bmsReady === 'true') return;
        const id = host.id;
        if (!id) return;

        let options = [];
        try {
            options = JSON.parse(host.dataset.options || '[]');
        } catch (e) {
            console.warn(`[bmsSelect] ជម្រើសមិនត្រឹមត្រូវសម្រាប់ #${id}`, e);
        }
        options = options.map(o => (typeof o === 'string') ? { value: o, label: o } : o);

        const onchange = host.dataset.onchange || '';
        BMS_SELECT_STATE[id] = {
            options,
            value: host.dataset.value !== undefined ? host.dataset.value : (options[0] ? options[0].value : ''),
            placeholder: host.dataset.placeholder || '',
            title: host.dataset.title || '',
            onChange: onchange ? () => { try { (new Function(onchange))(); } catch (e) { console.error(e); } } : null
        };

        // ធ្វើឲ្យ .value ដំណើរការដូច <select> ដើម ដើម្បីកុំឲ្យកូដចាស់ខូច
        Object.defineProperty(host, 'value', {
            configurable: true,
            get() { return bmsGetSelect(id); },
            set(v) { bmsSetSelect(id, v); }
        });

        host.dataset.bmsReady = 'true';
        if (!host.classList.contains('relative')) host.classList.add('relative');
        bmsRenderSelect(id);
    });
}

document.addEventListener('DOMContentLoaded', () => initBmsSelects());

/* ============================================================================
   របារដំណាក់កាល (BMS Stepper) — បង្ហាញវឌ្ឍនភាព និងស្ថានភាព
   ----------------------------------------------------------------------------
   ប្រើសម្រាប់ទាំងទម្រង់ច្រើនជំហាន (ឧ. បិទវេន) និងការតាមដានស្ថានភាព
   (ឧ. ដំណាក់កាលដឹកជញ្ជូន) ដើម្បីកុំឲ្យទំព័រនីមួយៗសរសេរកូដផ្ទាល់ខ្លួនម្តងទៀត។

   bmsStepper('hostId', {
       steps:   [{ label: 'ចុះឈ្មោះ', icon: 'fa-user-plus' }, …],
       current: 2,                 // ជំហានបច្ចុប្បន្ន ចាប់ពី 1
       variant: 'numbered',        // 'numbered' (លេខ) ឬ 'icon' (រូបតំណាង)
       tone:    'teal',            // ពណ៌សម្គាល់ជំហានដែលបានបញ្ចប់
       onStep:  n => goStep(n),    // ទទេ = មិនអាចចុចបាន (សម្រាប់ស្ថានភាព)
       labelAt: 'side'             // 'side' (ក្បែរ) ឬ 'below' (ខាងក្រោម)
   });
   ========================================================================== */

const BMS_STEPPER_STATE = {};

/**
 * ពណ៌ត្រូវសរសេរជាឈ្មោះថ្នាក់ពេញលេញ មិនត្រូវផ្សំដោយអក្សរទេ
 * ព្រោះពេលប្តូរទៅ Tailwind ប្រភេទចងក្រង ថ្នាក់ដែលផ្សំពេលដំណើរការនឹងបាត់
 */
const BMS_STEPPER_TONES = {
    teal: { fill: 'bg-teal-600', ring: 'ring-teal-100', bar: 'bg-teal-600', text: 'text-teal-700', rgb: '13,148,136' },
    emerald: { fill: 'bg-emerald-600', ring: 'ring-emerald-100', bar: 'bg-emerald-600', text: 'text-emerald-700', rgb: '5,150,105' },
    sky: { fill: 'bg-sky-600', ring: 'ring-sky-100', bar: 'bg-sky-600', text: 'text-sky-700', rgb: '2,132,199' },
    purple: { fill: 'bg-purple-600', ring: 'ring-purple-100', bar: 'bg-purple-600', text: 'text-purple-700', rgb: '147,51,234' },
    indigo: { fill: 'bg-indigo-600', ring: 'ring-indigo-100', bar: 'bg-indigo-600', text: 'text-indigo-700', rgb: '79,70,229' },
    rose: { fill: 'bg-rose-600', ring: 'ring-rose-100', bar: 'bg-rose-600', text: 'text-rose-700', rgb: '225,29,72' },
    /*
     * ពណ៌លឿងតាមរូបគំរូ #E9A23B — ប៉ុន្តែរូបតំណាងពណ៌សលើពណ៌នេះមានកម្រិតពន្លឺ
     * ត្រឹម 2.17:1 (ត្រូវការ 3:1) ដូច្នេះរង្វង់ប្រើ #C88016 — ហ្វ័រដូចគ្នា (35.7°)
     * តែងងឹតល្មមសម្រាប់រូបតំណាងពណ៌ស (3.20:1)។ amber-600 មិនប្រើ ព្រោះវាទៅខាងពណ៌ទឹកក្រូច
     * អក្សរប្រើ amber-700 (5.02:1) ព្រោះ custom.css មានការកែពណ៌សម្រាប់ទម្រង់ងងឹតរួចហើយ
     */
    amber: { fill: 'bg-[#C88016]', ring: 'ring-amber-100', bar: 'bg-[#E9A23B]', text: 'bms-amber-text', rgb: '233,162,59' },
    /* ពណ៌ខៀវដែនរបស់ម៉ាក (btn-navy #16255C) — រូបតំណាងពណ៌សមានកម្រិតពន្លឺ 14.5:1 */
    navy: { fill: 'bms-navy-fill', ring: 'ring-indigo-100', bar: 'bms-navy-fill', text: 'bms-navy-text', rgb: '22,37,92' },
    /*
     * ពណ៌បៃតងរបស់ប្រព័ន្ធ (primary #24692D) — ដូចរបារចំហៀង និងប៊ូតុងចម្បង
     * ក្នុងភាសាពណ៌របស់ប្រព័ន្ធ បៃតង = បានបញ្ចប់ ឯលឿង = កំពុងរង់ចាំ ឬកំពុងដំណើរការ
     */
    brand: { fill: 'bms-brand-fill', ring: 'ring-emerald-100', bar: 'bms-brand-fill', text: 'bms-brand-text', rgb: '36,105,45' }
};
BMS_STEPPER_TONES.yellow = BMS_STEPPER_TONES.amber;

/**
 * ចលនាបន្ទាត់ «កំពុងដំណើរការ» — រត់ពីជំហានបច្ចុប្បន្នទៅជំហានបន្ទាប់ម្តងហើយម្តងទៀត
 * បញ្ចូលពី JavaScript ដើម្បីឲ្យសមាសភាគដំណើរការនៅគ្រប់ទំព័រ ដោយមិនពឹងលើឯកសារ CSS
 * អ្នកប្រើដែលបិទចលនា (prefers-reduced-motion) ឃើញបន្ទាត់ឈរនៅ 75% ជំនួសវិញ
 */
function bmsEnsureStepperStyles() {
    if (document.getElementById('bmsStepperStyles')) return;
    const style = document.createElement('style');
    style.id = 'bmsStepperStyles';
    style.textContent = `
        /* រត់ពីជំហាន ក ទៅ ខ — ឈប់បន្តិចពេលដល់ រួចចាប់ផ្តើមម្តងទៀត */
        @keyframes bmsStepRun {
            0%   { width: 0%;   opacity: 1; }
            75%  { width: 100%; opacity: 1; }
            88%  { width: 100%; opacity: 1; }
            100% { width: 100%; opacity: 0; }
        }
        /* រង្វង់ពន្លឺរីកចេញពីជំហានបច្ចុប្បន្ន តាមចង្វាក់ដូចបន្ទាត់ */
        @keyframes bmsStepHalo {
            0%   { transform: scale(1);    opacity: .55; }
            75%  { transform: scale(1.55); opacity: 0; }
            100% { transform: scale(1.55); opacity: 0; }
        }
        /*
         * ពណ៌ដែលមិនមានក្នុងក្ដារពណ៌ Tailwind — កំណត់ទាំងទម្រង់ភ្លឺ និងងឹត
         * ខៀវដែនលើផ្ទៃងងឹតស្ទើរមើលមិនឃើញ ដូច្នេះប្តូរទៅខៀវភ្លឺជាងក្នុងទម្រង់ងងឹត
         * #A46912 = ហ្វ័រដូចពណ៌លឿងរូបគំរូ តែងងឹតល្មមសម្រាប់អក្សរ (4.56:1)
         */
        .bms-navy-fill { background-color: #16255C; }
        .bms-navy-text { color: #16255C; }
        .bms-amber-text { color: #A46912; }
        .bms-brand-fill { background-color: #24692D; }
        .bms-brand-text { color: #1B5223; }
        html.dark .bms-brand-fill { background-color: #2F9E44; }
        html.dark .bms-brand-text { color: #86EFAC; }
        html.dark .bms-navy-fill { background-color: #4F63C4; }
        html.dark .bms-navy-text { color: #A5B4FC; }
        html.dark .bms-amber-text { color: #F5C26B; }
        /* ផ្លូវប្រផេះភ្លឺពេកលើផ្ទៃងងឹត ហើយរង្វង់ពណ៌ស្រាលមើលទៅធ្ងន់ — បន្ថយទាំងពីរ */
        .bms-step-track { background-color: #E2E8F0; }
        html.dark .bms-step-track { background-color: #334155; }
        .bms-step-track.bms-step-track-dark { background-color: rgba(255, 255, 255, .12); }
        html.dark .bms-step-now { --tw-ring-color: rgba(var(--bms-rgb), .28); }
        .bms-step-run  { animation: bmsStepRun 2s cubic-bezier(.4, 0, .2, 1) infinite; }
        .bms-step-halo { animation: bmsStepHalo 2s cubic-bezier(.4, 0, .2, 1) infinite; }
        @media (prefers-reduced-motion: reduce) {
            .bms-step-run  { animation: none; }
            .bms-step-halo { animation: none; opacity: 0; }
        }`;
    document.head.appendChild(style);
}

function bmsStepper(hostId, cfg) {
    const host = document.getElementById(hostId);
    if (!host) return;
    BMS_STEPPER_STATE[hostId] = cfg;
    bmsRenderStepper(hostId);
}

function bmsRenderStepper(hostId) {
    const host = document.getElementById(hostId);
    const cfg = BMS_STEPPER_STATE[hostId];
    if (!host || !cfg) return;
    bmsEnsureStepperStyles();

    const isDark = Boolean(cfg.dark || (typeof isDarkMode === 'function' && isDarkMode()));
    const steps = cfg.steps || [];
    const current = Number(cfg.current) || 1;
    const skin = BMS_STEPPER_TONES[cfg.tone] || BMS_STEPPER_TONES.teal;
    /*
     * doneTone: ពណ៌សម្រាប់ជំហានដែលបានបញ្ចប់ (ឧ. 'emerald')
     * បៃតង = បានបញ្ចប់, លឿង = កំពុងដំណើរការ, ប្រផេះ = មិនទាន់ដល់
     * បើមិនកំណត់ ជំហានបានបញ្ចប់ប្រើពណ៌ដូចជំហានបច្ចុប្បន្ន
     */
    const doneSkin = BMS_STEPPER_TONES[cfg.doneTone] || skin;
    const icons = cfg.variant === 'icon';
    const compact = cfg.compact === true;
    const below = icons || cfg.labelAt === 'below';
    const clickable = typeof cfg.onStep === 'function';

    // ទំហំរង្វង់ និងកម្រាស់បន្ទាត់ (ភីកសែល) — ប្រើគណនាទីតាំងបន្ទាត់ភ្ជាប់
    // size: 'md' = រូបតំណាងទំហំមធ្យម (48px) សម្រាប់ផ្ទាំងតូចដូចទំព័រចូលប្រើ
    const medium = icons && cfg.size === 'md';
    const R = compact ? 14 : (medium ? 24 : (icons ? 28 : 18));
    const T = compact ? 2 : (medium ? 4 : (icons ? 5 : 2));
    const circle = compact ? 'w-7 h-7' : (medium ? 'w-12 h-12' : (icons ? 'w-14 h-14' : 'w-9 h-9 text-xs'));
    /*
     * ទំហំរូបតំណាងត្រូវដាក់លើ <i> ផ្ទាល់ជារចនាប័ទ្មក្នុងជួរ
     * ព្រោះ custom.css មានច្បាប់ [class*="rounded-full"][class*="text-"]
     * ដែលបង្ខំធាតុមូលទាំងអស់ឲ្យទៅ 13.5px ដោយ !important
     */
    const iconPx = compact ? 11 : (medium ? 18 : 22);

    /*
     * បន្ទាត់ចេញពីជំហានបច្ចុប្បន្នបំពេញ 75% (វាស់ពីរូបគំរូ) ដើម្បីបង្ហាញថា
     * កំពុងធ្វើដំណើរទៅជំហានបន្ទាប់ — មិនទាន់ដល់ទេ ប៉ុន្តែកំពុងដំណើរការ
     * inProgress: false = ឈប់នៅជំហាននេះ (ឧ. ដឹកមិនជោគជ័យ) គ្មានវឌ្ឍនភាពទេ
     */
    const inProgress = cfg.inProgress !== false && current <= steps.length;
    const duration = Number(cfg.duration) > 0 ? Number(cfg.duration) : 2;
    const partial = Math.round((cfg.progress !== undefined ? cfg.progress : 0.75) * 100);
    const fillFor = (n, at) => n < at ? 100 : (n === at && inProgress ? partial : 0);

    // ចាំជំហានមុន ដើម្បីឲ្យបន្ទាត់រត់ពីទីតាំងចាស់ទៅទីតាំងថ្មីពេលប្តូរជំហាន
    const from = cfg._painted !== undefined ? cfg._painted : current;
    cfg._painted = current;
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animate = from !== current && !reduceMotion;

    const fill = n => {
        // បន្ទាត់ «កំពុងដំណើរការ» រត់ម្តងហើយម្តងទៀត — width ក្នុងជួរជាតម្លៃបម្រុង
        // សម្រាប់អ្នកប្រើដែលបិទចលនា (ចលនា CSS មានអាទិភាពលើ width ក្នុងជួរ)
        if (n === current && inProgress) {
            return `<span class="bms-step-run relative block h-full rounded-full ${skin.bar}"
                style="width:${partial}%;animation-duration:${duration}s;box-shadow:0 0 8px rgba(${skin.rgb},.45)"></span>`;
        }
        return `<span data-bms-fill="${fillFor(n, current)}" class="block h-full rounded-full ${doneSkin.bar}"
            style="width:${fillFor(n, animate ? from : current)}%;transition:width .7s cubic-bezier(.4,0,.2,1)"></span>`;
    };

    // current ធំជាងចំនួនជំហាន = បានបញ្ចប់គ្រប់ដំណាក់កាល
    const aria = current > steps.length
        ? 'បានបញ្ចប់គ្រប់ដំណាក់កាល'
        : `ដំណាក់កាល ${current} នៃ ${steps.length}៖ ${(steps[current - 1] || {}).label || ''}`;

    const face = n => {
        const done = n < current;
        const now = n === current;
        if (done) return `${doneSkin.fill} text-white`;
        if (now) return `${skin.fill} text-white ring-4 ${skin.ring} bms-step-now`;
        return isDark ? 'bg-white/5 text-slate-400 border border-white/15' : 'bg-slate-100 text-slate-500 border border-slate-200';
    };

    // ទម្រង់រូបតំណាងរក្សារូបតំណាងដើម ទោះជំហាននោះបានបញ្ចប់ក៏ដោយ
    // ព្រោះសញ្ញាធីកបាត់ព័ត៌មានថាជាដំណាក់កាលអ្វី
    const glyph = (s, n) => (icons && s.icon)
        ? `<i class="fas ${s.icon}" style="font-size:${iconPx}px"></i>`
        : (n < current ? '<i class="fas fa-check"></i>' : String(n));

    const labelTone = n => n === current
        ? `${skin.text} font-semibold`
        : (n < current ? (isDark ? 'text-slate-200 font-medium' : 'text-slate-700 font-medium') : (isDark ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'));

    const wrap = (n, inner, extra) => {
        const reachable = clickable && n <= current;
        return reachable
            ? `<button type="button" onclick="bmsStepperGo('${hostId}', ${n})" class="${extra} cursor-pointer">${inner}</button>`
            : `<span class="${extra}${clickable ? ' cursor-not-allowed' : ''}">${inner}</span>`;
    };

    if (below) {
        /*
         * ប្លង់អក្សរខាងក្រោម (ដូចរូបគំរូទី 1)
         * ជំហាននីមួយៗមានទទឹងស្មើគ្នា ហើយបន្ទាត់ភ្ជាប់ត្រូវគូរពីកណ្តាលរង្វង់មួយ
         * ទៅកណ្តាលរង្វង់បន្ទាប់ — ដូច្នេះបន្ទាត់ប៉ះរង្វង់ជានិច្ច
         * ទោះបីអក្សរវែងជាងរង្វង់ក៏ដោយ
         */
        host.innerHTML = `
            <ol role="group" aria-label="${aria}" class="flex w-full">
                ${steps.map((s, i) => {
                    const n = i + 1;
                    const connector = i < steps.length - 1
                        ? `<span aria-hidden="true" class="absolute rounded-full bms-step-track ${isDark ? 'bms-step-track-dark' : ''}"
                               style="top:${R - T / 2}px;height:${T}px;left:calc(50% + ${R}px);right:calc(-50% + ${R}px)">${fill(n)}</span>`
                        : '';
                    const halo = n === current && inProgress && !compact
                        ? `<span aria-hidden="true" class="bms-step-halo absolute inset-0 rounded-full"
                               style="background:rgba(${skin.rgb},.45);animation-duration:${duration}s"></span>`
                        : '';
                    // សញ្ញាធីកតូចបញ្ជាក់ថាបានបញ្ចប់ ដោយមិនលុបរូបតំណាងដើមចោល
                    const badge = n < current && icons && !compact && cfg.doneBadge === true
                        ? `<span aria-hidden="true" class="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-white flex items-center justify-center"
                               style="box-shadow:0 0 0 2px #fff,0 1px 3px rgba(15,23,42,.18)">
                               <span class="w-4 h-4 rounded-full ${doneSkin.fill} flex items-center justify-center">
                                   <i class="fas fa-check text-white" style="font-size:8px"></i>
                               </span>
                           </span>`
                        : '';
                    const body = `
                        <span class="relative z-10 flex-shrink-0">
                            ${halo}
                            <span class="relative ${circle} rounded-full flex items-center justify-center font-bold transition ${face(n)}" style="--bms-rgb:${skin.rgb}">${glyph(s, n)}</span>
                            ${badge}
                        </span>
                        ${compact ? '' : `<span class="${medium ? 'text-sm mt-2.5' : icons ? 'text-sm mt-3' : 'sm-badge mt-3'} px-1 text-center leading-snug ${labelTone(n)}">${s.label}</span>`}`;
                    return `<li class="relative flex-1 min-w-0 flex justify-center">
                        ${connector}
                        ${wrap(n, body, 'relative flex flex-col items-center')}
                    </li>`;
                }).join('')}
            </ol>`;
        bmsAnimateStepperFill(host, animate);
        return;
    }

    // ប្លង់អក្សរនៅក្បែរ — បន្ទាត់ជាធាតុដាច់ដោយឡែករវាងជំហាន
    host.innerHTML = `
        <div role="group" aria-label="${aria}" class="flex items-center overflow-x-auto scrollbar-hide">
            ${steps.map((s, i) => {
                const n = i + 1;
                const body = `
                    <span class="${circle} rounded-full flex items-center justify-center flex-shrink-0 font-bold transition ${face(n)}">${glyph(s, n)}</span>
                    <span class="sm-badge ${labelTone(n)}">${s.label}</span>`;
                const bar = i < steps.length - 1
                    ? `<span aria-hidden="true" class="w-6 sm:w-12 h-0.5 mx-2 sm:mx-3 rounded-full flex-shrink-0 bms-step-track ${isDark ? 'bms-step-track-dark' : ''} overflow-hidden">${fill(n)}</span>`
                    : '';
                return wrap(n, body, 'px-1 inline-flex items-center gap-2.5 flex-shrink-0') + bar;
            }).join('')}
        </div>`;
    bmsAnimateStepperFill(host, animate);
}

/**
 * បន្ទាត់ត្រូវគូរនៅទីតាំងចាស់សិន រួចទើបប្តូរទៅទីតាំងថ្មីនៅស៊ុមបន្ទាប់
 * បើមិនដូច្នេះទេ កម្មវិធីរុករកនឹងរំលងចលនា ព្រោះធាតុទើបតែបង្កើតថ្មី
 */
function bmsAnimateStepperFill(host, animate) {
    const settle = () => host.querySelectorAll('[data-bms-fill]').forEach(el => {
        el.style.width = el.dataset.bmsFill + '%';
    });
    if (!animate) return;
    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => requestAnimationFrame(settle));
    } else {
        setTimeout(settle, 30);
    }
}

function bmsStepperGo(hostId, n) {
    const cfg = BMS_STEPPER_STATE[hostId];
    if (!cfg || typeof cfg.onStep !== 'function') return;
    if (n > (Number(cfg.current) || 1)) return;   // មិនអាចរំលងទៅមុខទេ
    cfg.onStep(n);
}

/** ប្តូរជំហានបច្ចុប្បន្នដោយមិនចាំបាច់កំណត់រចនាសម្ព័ន្ធឡើងវិញ */
function bmsStepperSet(hostId, current) {
    const cfg = BMS_STEPPER_STATE[hostId];
    if (!cfg) return;
    cfg.current = current;
    bmsRenderStepper(hostId);
}

// ធ្វើបច្ចុប្បន្នភាព Stepper ឡើងវិញដោយស្វ័យប្រវត្តិតាមស្បែកងងឹត/ភ្លឺ
window.addEventListener('bms-theme-change', () => {
    if (typeof BMS_STEPPER_STATE !== 'undefined') {
        Object.keys(BMS_STEPPER_STATE).forEach(hostId => {
            bmsRenderStepper(hostId);
        });
    }
});
