/**
 * DIGITECHKH - Custom UI Components
 * Replaces native browser elements (alert, confirm, select) with elegant enterprise-grade UI
 */

// 1. Toast Notification System (Replaces window.alert)
function showToast(message, type = 'success', duration = 3200) {
    let container = document.getElementById('bmsToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'bmsToastContainer';
        container.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none select-none';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto bg-white rounded-2xl p-3.5 px-4 shadow-2xl border flex items-center gap-3 text-sm min-w-[280px] max-w-md transition-all duration-300 transform translate-y-0 opacity-100';

    let iconHtml = '';
    let borderClass = 'border-slate-100';

    if (type === 'success') {
        iconHtml = '<div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 text-base"><i class="fas fa-circle-check"></i></div>';
        borderClass = 'border-emerald-100';
    } else if (type === 'error' || type === 'danger') {
        iconHtml = '<div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 text-base"><i class="fas fa-circle-xmark"></i></div>';
        borderClass = 'border-rose-100';
    } else if (type === 'warning') {
        iconHtml = '<div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 text-base"><i class="fas fa-triangle-exclamation"></i></div>';
        borderClass = 'border-amber-100';
    } else {
        iconHtml = '<div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 text-base"><i class="fas fa-circle-info"></i></div>';
        borderClass = 'border-indigo-100';
    }

    toast.classList.add(borderClass);
    toast.innerHTML = `
        ${iconHtml}
        <div class="flex-1 font-medium text-slate-800 text-xs leading-relaxed">${message}</div>
        <button onclick="this.parentElement.remove()" class="text-slate-300 hover:text-slate-600 p-1 rounded-lg transition ml-auto flex-shrink-0 cursor-pointer">
            <i class="fas fa-xmark text-xs"></i>
        </button>
    `;

    container.appendChild(toast);

    // Auto-record user action in BMSActionTracker if it's a recorded action
    if (window.BMSActionTracker && typeof window.BMSActionTracker.record === 'function') {
        const isActionKeyword = /បាន|រក្សាទុក|អនុម័ត|បដិសេធ|លុប|បង្កើត|ទូទាត់|ចាកចេញ|ប្តូរ/.test(message);
        if (isActionKeyword && !message.includes('កំណត់ទៅសភាពដើម')) {
            window.BMSActionTracker.record({
                title: message,
                detail: 'ប្រតិបត្តិការត្រូវបានកត់ត្រាក្នុងសម័យបច្ចុប្បន្ន',
                type: (type === 'danger' || type === 'error') ? 'error' : (type === 'warning' ? 'warning' : 'success')
            });
        }
    }

    setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-2');
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 300);
    }, duration);
}

// 2. Custom Confirm Dialog (Replaces window.confirm)
function showCustomConfirm(options = {}) {
    return new Promise((resolve) => {
        const title = options.title || 'បញ្ជាក់ការប្រតិបត្តិ';
        const message = options.message || 'តើលោកអ្នកពិតជាចង់បន្តសកម្មភាពនេះមែនទេ?';
        const confirmText = options.confirmText || options.okText || 'យល់ព្រម';
        const cancelText = options.cancelText || 'បោះបង់';
        const isDanger = options.danger === true || options.type === 'danger' || options.type === 'error';
        const onConfirm = options.onConfirm || null;
        const onCancel = options.onCancel || null;

        let modal = document.getElementById('bmsCustomConfirmModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'bmsCustomConfirmModal';
            document.body.appendChild(modal);
        }

        modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 select-none';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.right = '0';
        modal.style.bottom = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '9999';

        const iconHtml = isDanger
            ? '<div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-xl mx-auto mb-3"><i class="fas fa-triangle-exclamation"></i></div>'
            : '<div class="w-12 h-12 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center text-xl mx-auto mb-3"><i class="fas fa-circle-question"></i></div>';

        const confirmBtnClass = isDanger
            ? 'bg-rose-600 hover:bg-rose-700 text-white'
            : 'bg-primary hover:bg-primary-dark text-white';

        modal.innerHTML = `
            <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center transform transition-all animate-[bmsModalIn_0.18s_ease-out]">
                ${iconHtml}
                <h4 class="text-base font-bold text-slate-900 mb-1.5">${title}</h4>
                <p class="text-xs text-slate-500 leading-relaxed mb-6">${message}</p>
                <div class="flex items-center justify-center gap-2.5">
                    <button id="bmsConfirmCancelBtn" type="button" class="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer">
                        ${cancelText}
                    </button>
                    <button id="bmsConfirmOkBtn" type="button" class="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium ${confirmBtnClass} shadow-sm transition cursor-pointer">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        modal.classList.add('flex');

        const closeConfirm = (confirmed) => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            modal.style.display = 'none';
            if (confirmed) {
                if (typeof onConfirm === 'function') {
                    onConfirm();
                }
                resolve(true);
            } else {
                if (typeof onCancel === 'function') {
                    onCancel();
                }
                resolve(false);
            }
        };

        const cancelBtn = document.getElementById('bmsConfirmCancelBtn');
        const okBtn = document.getElementById('bmsConfirmOkBtn');

        if (cancelBtn) cancelBtn.onclick = () => closeConfirm(false);
        if (okBtn) okBtn.onclick = () => closeConfirm(true);
    });
}

// 2b. Reason Prompt — ប្រអប់សួរមូលហេតុ (ប្រើសម្រាប់បដិសេធ លុបចោល ដែលតម្រូវឱ្យមានមូលហេតុ — ឯកសារ 15)
// ត្រឡប់ Promise<string|null>: អត្ថបទមូលហេតុ ឬ null បើអ្នកប្រើបោះបង់
function showReasonPrompt(options = {}) {
    return new Promise((resolve) => {
        const title = options.title || 'បញ្ចូលមូលហេតុ';
        const message = options.message || '';
        const placeholder = options.placeholder || 'សូមបញ្ចូលមូលហេតុ...';
        const confirmText = options.confirmText || 'បញ្ជាក់';
        const cancelText = options.cancelText || 'បោះបង់';
        const isDanger = options.danger === true;

        let modal = document.getElementById('bmsReasonModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'bmsReasonModal';
            document.body.appendChild(modal);
        }

        modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 select-none';
        modal.style.display = 'flex';

        const iconClass = isDanger ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-primary';
        const btnClass = isDanger ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-primary hover:bg-primary-dark text-white';

        modal.innerHTML = `
            <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 text-center">
                <div class="w-12 h-12 rounded-2xl ${iconClass} flex items-center justify-center text-xl mx-auto mb-3"><i class="fas fa-pen-to-square"></i></div>
                <h4 class="text-base font-bold text-slate-900 mb-1.5">${title}</h4>
                ${message ? `<p class="text-xs text-slate-500 leading-relaxed mb-4">${message}</p>` : ''}
                <textarea id="bmsReasonInput" rows="3" placeholder="${placeholder}"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 text-left focus:outline-none focus:border-primary transition resize-none select-text"></textarea>
                <p id="bmsReasonError" class="hidden text-[11px] text-rose-600 text-left mt-1.5">សូមបញ្ចូលមូលហេតុជាមុនសិន</p>
                <div class="flex items-center justify-center gap-2.5 mt-5">
                    <button id="bmsReasonCancelBtn" type="button" class="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer">${cancelText}</button>
                    <button id="bmsReasonOkBtn" type="button" class="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium ${btnClass} shadow-sm transition cursor-pointer">${confirmText}</button>
                </div>
            </div>`;

        const input = document.getElementById('bmsReasonInput');
        const error = document.getElementById('bmsReasonError');
        const close = value => {
            modal.style.display = 'none';
            modal.innerHTML = '';
            resolve(value);
        };

        document.getElementById('bmsReasonCancelBtn').onclick = () => close(null);
        document.getElementById('bmsReasonOkBtn').onclick = () => {
            const text = input.value.trim();
            if (!text) {
                error.classList.remove('hidden');
                input.focus();
                return;
            }
            close(text);
        };
        input.oninput = () => error.classList.add('hidden');
        input.focus();
    });
}

// 3. Custom Dropdown Helpers (Fixed Floating Dropdown Elevation System)
function openFloatingDropdown(btn, menu) {
    if (!btn || !menu) return;

    // Close any other open floating dropdowns first
    closeAllFloatingDropdowns();

    // Mark active and unhide
    menu.classList.remove('hidden');
    menu.dataset.floatingActive = 'true';

    const rect = btn.getBoundingClientRect();
    const vHeight = window.innerHeight;
    const vWidth = window.innerWidth;

    const spaceBelow = vHeight - rect.bottom;
    const spaceAbove = rect.top;

    const isHeaderMenu = menu.id === 'portalNotifMenu' || menu.id === 'portalProfileMenu' || !!btn.closest('header');
    const isNotif = menu.id === 'portalNotifMenu';
    const isProfile = menu.id === 'portalProfileMenu';

    // Width calculation
    // ទទឹងអប្បបរមាមិនត្រូវលើសទទឹងអេក្រង់ឡើយ បើមិនដូច្នេះទេ
    // ការគណនាទីតាំងនឹងហូសគែម ហើយម៉ឺនុយត្រូវខ្ទាស់ទៅឆ្ងាយពីប៊ូតុង
    const roomy = vWidth - 32;
    let minWidth = Math.min(280, roomy);
    if (isNotif) minWidth = Math.min(380, roomy);
    else if (isProfile) minWidth = Math.min(260, roomy);

    const targetWidth = Math.min(Math.max(rect.width, minWidth), vWidth - 32);

    // Apply fixed viewport styles to escape all parent containers, overflows & tables
    menu.style.setProperty('position', 'fixed', 'important');
    menu.style.setProperty('z-index', '999999', 'important');
    menu.style.setProperty('width', `${targetWidth}px`, 'important');
    menu.style.setProperty('background-color', '#ffffff', 'important');
    menu.style.setProperty('margin-top', '0px', 'important');
    menu.style.setProperty('margin-bottom', '0px', 'important');

    // Horizontal positioning: align right if on right side of screen or header menu
    const shouldAlignRight = isHeaderMenu || (rect.right > vWidth / 2);

    if (shouldAlignRight) {
        let right = vWidth - rect.right;
        if (right < 16) right = 16;
        if (right + targetWidth > vWidth - 16) {
            // ម៉ឺនុយមិនអាចតម្រឹមតាមប៊ូតុងដោយមិនហូសគែមឆ្វេង —
            // រុញត្រឹមតែប៉ុណ្ណោះដែលល្មមចូល ដើម្បីនៅជិតប៊ូតុងបំផុត
            right = Math.max(16, vWidth - targetWidth - 16);
        }
        menu.style.setProperty('right', `${right}px`, 'important');
        menu.style.setProperty('left', 'auto', 'important');
    } else {
        let left = rect.left;
        if (left + targetWidth > vWidth - 16) {
            left = Math.max(16, vWidth - targetWidth - 16);
        }
        if (left < 16) left = 16;
        menu.style.setProperty('left', `${left}px`, 'important');
        menu.style.setProperty('right', 'auto', 'important');
    }

    // Determine direction: Pop UP if space below is too tight (< 200px) and there's more space above
    const popUp = !isHeaderMenu && (spaceBelow < 200 && spaceAbove > spaceBelow);

    if (popUp) {
        const maxH = Math.max(160, Math.min(spaceAbove - 20, 420));
        menu.style.setProperty('top', 'auto', 'important');
        menu.style.setProperty('bottom', `${vHeight - rect.top + 6}px`, 'important');
        menu.style.setProperty('max-height', `${maxH}px`, 'important');
        menu.style.setProperty('transform-origin', shouldAlignRight ? 'bottom right' : 'bottom left', 'important');
        menu.classList.remove('top-full', 'mt-1');
        menu.classList.add('bottom-full', 'mb-1');
    } else {
        const maxH = Math.max(160, Math.min(spaceBelow - 20, isNotif ? 460 : 380));
        menu.style.setProperty('bottom', 'auto', 'important');
        menu.style.setProperty('top', `${rect.bottom + 8}px`, 'important');
        menu.style.setProperty('max-height', `${maxH}px`, 'important');
        menu.style.setProperty('transform-origin', shouldAlignRight ? 'top right' : 'top left', 'important');
        menu.classList.remove('bottom-full', 'mb-1');
        menu.classList.add('top-full', 'mt-1');
    }

    // Rotate chevron arrow
    const container = btn.closest('.bms-custom-select, .product-select-container') || btn.parentElement;
    const arrow = (container ? container.querySelector('.fa-chevron-down, .bms-custom-select-arrow, .bms-custom-arrow') : null) || btn.querySelector('.fa-chevron-down');
    if (arrow) arrow.classList.add('rotate-180');

    // Elevation marking on active row/card for visual consistency
    if (container) {
        container.classList.add('z-50', 'relative');
        const tr = container.closest('tr');
        if (tr) tr.classList.add('z-40', 'relative', 'bms-row-active');
        const td = container.closest('td');
        if (td) td.classList.add('z-40', 'relative', 'bms-cell-active');
    }
}

function closeFloatingDropdown(menu) {
    if (!menu) return;
    menu.classList.add('hidden');
    menu.removeAttribute('data-floating-active');
    menu.style.removeProperty('position');
    menu.style.removeProperty('z-index');
    menu.style.removeProperty('left');
    menu.style.removeProperty('right');
    menu.style.removeProperty('top');
    menu.style.removeProperty('bottom');
    menu.style.removeProperty('width');
    menu.style.removeProperty('max-height');
    menu.style.removeProperty('margin-top');
    menu.style.removeProperty('margin-bottom');
    menu.style.removeProperty('transform-origin');

    const container = menu.closest('.bms-custom-select, .product-select-container') || menu.parentElement;
    if (container) {
        container.classList.remove('z-50');
        const arrow = container.querySelector('.fa-chevron-down, .bms-custom-select-arrow, .bms-custom-arrow');
        if (arrow) arrow.classList.remove('rotate-180');
        const tr = container.closest('tr');
        if (tr) tr.classList.remove('z-40', 'relative', 'bms-row-active');
        const td = container.closest('td');
        if (td) td.classList.remove('z-40', 'relative', 'bms-cell-active');
    }
}

function closeAllFloatingDropdowns() {
    // [data-floating-active] គ្របម៉ឺនុយគ្រប់ប្រភេទដែលបើកដោយ openFloatingDropdown()
    // រួមទាំងម៉ឺនុយសកម្មភាពជួរតារាង (⋮) ដែលមិនមានថ្នាក់ .bms-custom-select-menu
    document.querySelectorAll('[data-floating-active="true"], .bms-custom-select-menu:not(.hidden)').forEach(menu => {
        closeFloatingDropdown(menu);
    });
    document.querySelectorAll('.bms-card-active').forEach(c => c.classList.remove('bms-card-active'));
}

window.openFloatingDropdown = openFloatingDropdown;
window.closeFloatingDropdown = closeFloatingDropdown;
window.closeAllFloatingDropdowns = closeAllFloatingDropdowns;

function toggleCustomDropdown(dropdownId) {
    const container = document.getElementById(dropdownId);
    if (!container) return;
    const menu = container.querySelector('.bms-custom-select-menu') || container.querySelector('.bms-custom-menu');
    if (!menu) return;
    const btn = container.querySelector('button') || container.firstElementChild || container;
    const isCurrentlyOpen = menu.dataset.floatingActive === 'true' && !menu.classList.contains('hidden');

    if (isCurrentlyOpen) {
        closeFloatingDropdown(menu);
    } else {
        openFloatingDropdown(btn, menu);
    }
}

function selectCustomOption(dropdownId, value, displayText) {
    const container = document.getElementById(dropdownId);
    if (!container) return;
    const hiddenInput = container.querySelector('input[type="hidden"]');
    const labelElem = container.querySelector('.selected-label') || container.querySelector('.dropdown-label');
    const menu = container.querySelector('.bms-custom-select-menu') || container.querySelector('.bms-custom-menu');

    if (hiddenInput) {
        hiddenInput.value = value;
        hiddenInput.dispatchEvent(new Event('change'));
    }
    if (labelElem) {
        if (displayText && (displayText.includes('<') || displayText.includes('<img'))) {
            labelElem.innerHTML = displayText;
        } else {
            labelElem.textContent = displayText || value;
        }
        labelElem.classList.remove('text-slate-400');
        labelElem.classList.add('text-slate-800', 'font-medium');
    }

    container.querySelectorAll('.checkmark').forEach(cm => cm.classList.add('opacity-0'));
    const evt = (typeof event !== 'undefined' && event) ? event : (window.event || null);
    if (evt) {
        const itemEl = evt.currentTarget || (evt.target ? evt.target.closest('button, [onclick*="selectCustomOption"]') : null);
        if (itemEl) {
            const activeCheck = itemEl.querySelector('.checkmark');
            if (activeCheck) activeCheck.classList.remove('opacity-0');
        }
    }

    if (menu) closeFloatingDropdown(menu);
}

function selectCustomCustomer(dropdownId, customerId, name, phone, avatar, company) {
    const displayText = `<div class="flex items-center gap-2 text-left"><img src="${avatar}" alt="${name}" class="w-6 h-6 rounded-full object-cover border border-slate-200 flex-shrink-0" /><span class="font-medium text-slate-800 text-xs truncate">${name} (${phone})</span></div>`;
    selectCustomOption(dropdownId, name, displayText);
}

function toggleProductDropdown(btn) {
    const container = btn.closest('.bms-custom-select, .product-select-container');
    if (!container) return;
    const menu = container.querySelector('.bms-custom-select-menu');
    if (!menu) return;
    const isCurrentlyOpen = menu.dataset.floatingActive === 'true' && !menu.classList.contains('hidden');

    if (isCurrentlyOpen) {
        closeFloatingDropdown(menu);
    } else {
        openFloatingDropdown(btn, menu);
    }
}
window.toggleProductDropdown = toggleProductDropdown;

function selectProductOption(optElem, name, price, cost) {
    const container = optElem.closest('.bms-custom-select, .product-select-container');
    if (!container) return;
    const tr = container.closest('tr');
    const td = container.closest('td');
    const hiddenInput = container.querySelector('.item-product-val');
    const labelElem = container.querySelector('.product-selected-label');
    const menu = container.querySelector('.bms-custom-select-menu') || optElem.closest('.bms-custom-select-menu');

    if (hiddenInput) {
        hiddenInput.value = name;
        hiddenInput.dataset.price = price;
        hiddenInput.dataset.cost = cost;
    }
    if (labelElem) {
        labelElem.textContent = name;
        labelElem.classList.remove('text-slate-400');
        labelElem.classList.add('text-slate-800', 'font-medium');
    }
    if (menu) closeFloatingDropdown(menu);

    if (tr) {
        const priceInput = tr.querySelector('.item-price');
        if (priceInput) priceInput.value = price.toFixed(2);
        if (typeof recalcQuote === 'function') recalcQuote();
        if (typeof recalcPageQuote === 'function') recalcPageQuote();
        if (typeof recalcInvoice === 'function') recalcInvoice();
        if (typeof recalcPageInvoice === 'function') recalcPageInvoice();
    }
}

// 4. Custom Single Date Picker System (100% Khmer UI, Zero Browser Native Defaults)
const BMS_SINGLE_PICKERS = {};
const KHMER_MONTHS_LIST = [
    'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
    'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
];

function formatBmsDisplayDate(d) {
    if (!d || isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatBmsIsoDate(d) {
    if (!d || isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
}

function parseBmsDate(val) {
    if (!val) return new Date();
    if (typeof val === 'string') {
        if (val.includes('/')) {
            const parts = val.split('/');
            if (parts.length === 3) {
                return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
            }
        } else if (val.includes('-')) {
            const parts = val.split('-');
            if (parts.length === 3) {
                return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            }
        }
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
}

function initSingleDatePicker(id) {
    const input = document.getElementById(id);
    if (!input) return;

    const container = input.closest('.bms-date-picker') || input.parentElement;
    const initialDate = parseBmsDate(input.value);

    BMS_SINGLE_PICKERS[id] = {
        selectedYear: initialDate.getFullYear(),
        selectedMonth: initialDate.getMonth() + 1,
        selectedDay: initialDate.getDate(),
        viewYear: initialDate.getFullYear(),
        viewMonth: initialDate.getMonth() + 1
    };

    // Ensure display label is set
    const display = document.getElementById(`${id}-display`) || (container ? container.querySelector('.bms-date-label') : null);
    if (display) {
        display.textContent = formatBmsDisplayDate(initialDate);
    }

    // Ensure popover structure exists inside container
    let popover = document.getElementById(`${id}-popover`);
    if (!popover && container) {
        popover = document.createElement('div');
        popover.id = `${id}-popover`;
        popover.className = 'bms-date-popover absolute right-0 top-full mt-1.5 w-[280px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-3.5 hidden select-none';
        popover.onclick = (e) => e.stopPropagation();
        popover.innerHTML = `
            <div class="flex items-center justify-between mb-2.5 px-1">
                <span id="${id}-month-label" class="text-xs font-bold text-slate-800"></span>
                <div class="flex items-center gap-1">
                    <button type="button" onclick="changeSinglePickerMonth('${id}', -1)" class="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition">
                        <i class="fas fa-chevron-left text-[10px]"></i>
                    </button>
                    <button type="button" onclick="changeSinglePickerMonth('${id}', 1)" class="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition">
                        <i class="fas fa-chevron-right text-[10px]"></i>
                    </button>
                </div>
            </div>
            <div class="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 mb-1.5">
                <span>ច</span><span>អ</span><span>ព</span><span>ព្រ</span><span>សុ</span><span>ស</span><span>អា</span>
            </div>
            <div id="${id}-days-grid" class="grid grid-cols-7 text-center text-xs gap-y-1"></div>
            <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <button type="button" onclick="setSinglePickerToday('${id}')" class="text-xs font-semibold text-primary hover:text-primary-dark px-2 py-1 rounded-lg hover:bg-emerald-50 transition">
                    ថ្ងៃនេះ
                </button>
                <button type="button" onclick="closeSingleDatePicker('${id}')" class="text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition">
                    បិទ
                </button>
            </div>
        `;
        container.appendChild(popover);
    }

    // Intercept input.value changes via script so display stays in sync
    if (!input._hasBmsValueSync) {
        input._hasBmsValueSync = true;
        const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        Object.defineProperty(input, 'value', {
            get: function() {
                return descriptor.get.call(this);
            },
            set: function(newVal) {
                descriptor.set.call(this, newVal);
                const d = parseBmsDate(newVal);
                if (display) display.textContent = formatBmsDisplayDate(d);
                if (BMS_SINGLE_PICKERS[id]) {
                    BMS_SINGLE_PICKERS[id].selectedYear = d.getFullYear();
                    BMS_SINGLE_PICKERS[id].selectedMonth = d.getMonth() + 1;
                    BMS_SINGLE_PICKERS[id].selectedDay = d.getDate();
                }
            }
        });
    }
}

function toggleSingleDatePicker(id) {
    let popover = document.getElementById(`${id}-popover`);
    if (!popover) {
        initSingleDatePicker(id);
        popover = document.getElementById(`${id}-popover`);
    }
    if (!popover) return;

    const isHidden = popover.classList.contains('hidden');

    // Close all other date popovers and select dropdowns
    document.querySelectorAll('.bms-date-popover').forEach(p => {
        if (p !== popover) p.classList.add('hidden');
    });
    document.querySelectorAll('.bms-date-picker').forEach(c => {
        if (!c.contains(popover)) c.classList.remove('z-50');
    });

    if (isHidden) {
        if (!BMS_SINGLE_PICKERS[id]) {
            initSingleDatePicker(id);
        } else {
            BMS_SINGLE_PICKERS[id].viewYear = BMS_SINGLE_PICKERS[id].selectedYear;
            BMS_SINGLE_PICKERS[id].viewMonth = BMS_SINGLE_PICKERS[id].selectedMonth;
        }

        renderSingleDatePickerGrid(id);
        const container = popover.closest('.bms-date-picker');
        if (container) container.classList.add('z-50');
        popover.classList.remove('hidden');

        // Default align right directly underneath the calendar icon
        popover.classList.remove('left-0');
        popover.classList.add('right-0');

        // Prevent boundary overflow if window is very narrow and left is clipped
        const rect = popover.getBoundingClientRect();
        if (rect.left < 12) {
            popover.classList.remove('right-0');
            popover.classList.add('left-0');
        }
    } else {
        popover.classList.add('hidden');
        const container = popover.closest('.bms-date-picker');
        if (container) container.classList.remove('z-50');
    }
}

function closeSingleDatePicker(id) {
    const popover = document.getElementById(`${id}-popover`);
    if (popover) {
        popover.classList.add('hidden');
        const container = popover.closest('.bms-date-picker');
        if (container) container.classList.remove('z-50');
    }
}

function changeSinglePickerMonth(id, delta) {
    if (!BMS_SINGLE_PICKERS[id]) initSingleDatePicker(id);
    const state = BMS_SINGLE_PICKERS[id];
    state.viewMonth += delta;
    if (state.viewMonth > 12) {
        state.viewMonth = 1;
        state.viewYear += 1;
    } else if (state.viewMonth < 1) {
        state.viewMonth = 12;
        state.viewYear -= 1;
    }
    renderSingleDatePickerGrid(id);
}

function setSinglePickerToday(id) {
    const today = new Date();
    selectSinglePickerDate(id, today.getFullYear(), today.getMonth() + 1, today.getDate());
}

function selectSinglePickerDate(id, y, m, d) {
    const input = document.getElementById(id);
    const container = input ? (input.closest('.bms-date-picker') || input.parentElement) : null;
    const display = document.getElementById(`${id}-display`) || (container ? container.querySelector('.bms-date-label') : null);
    const dateObj = new Date(y, m - 1, d);

    if (!BMS_SINGLE_PICKERS[id]) {
        BMS_SINGLE_PICKERS[id] = {};
    }
    BMS_SINGLE_PICKERS[id].selectedYear = y;
    BMS_SINGLE_PICKERS[id].selectedMonth = m;
    BMS_SINGLE_PICKERS[id].selectedDay = d;
    BMS_SINGLE_PICKERS[id].viewYear = y;
    BMS_SINGLE_PICKERS[id].viewMonth = m;

    if (input) {
        input.value = formatBmsIsoDate(dateObj);
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (display) {
        display.textContent = formatBmsDisplayDate(dateObj);
    }

    closeSingleDatePicker(id);
}

function setSingleDate(id, dateStr) {
    const d = parseBmsDate(dateStr);
    selectSinglePickerDate(id, d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function renderSingleDatePickerGrid(id) {
    const state = BMS_SINGLE_PICKERS[id];
    if (!state) return;
    const grid = document.getElementById(`${id}-days-grid`);
    const monthLabel = document.getElementById(`${id}-month-label`);
    if (!grid) return;

    if (monthLabel) {
        monthLabel.textContent = `${KHMER_MONTHS_LIST[state.viewMonth - 1]} ${state.viewYear}`;
    }

    grid.innerHTML = '';

    const daysInMonth = new Date(state.viewYear, state.viewMonth, 0).getDate();
    const firstDayIndex = new Date(state.viewYear, state.viewMonth - 1, 1).getDay();
    const leadingBlanks = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    for (let i = 0; i < leadingBlanks; i++) {
        const emptyCell = document.createElement('span');
        grid.appendChild(emptyCell);
    }

    const today = new Date();
    const isCurrentMonthThisMonth = today.getFullYear() === state.viewYear && (today.getMonth() + 1) === state.viewMonth;

    for (let d = 1; d <= daysInMonth; d++) {
        const isSelected = state.selectedYear === state.viewYear &&
                           state.selectedMonth === state.viewMonth &&
                           state.selectedDay === d;
        const isToday = isCurrentMonthThisMonth && today.getDate() === d;

        const cell = document.createElement('div');
        cell.className = 'flex items-center justify-center cursor-pointer h-7';
        cell.onclick = () => selectSinglePickerDate(id, state.viewYear, state.viewMonth, d);

        if (isSelected) {
            cell.innerHTML = `<span class="w-7 h-7 rounded-full bg-[#0f2b5c] text-white flex items-center justify-center font-bold text-xs shadow-xs">${d}</span>`;
        } else if (isToday) {
            cell.innerHTML = `<span class="w-7 h-7 rounded-full border border-primary text-primary flex items-center justify-center font-bold text-xs hover:bg-emerald-50">${d}</span>`;
        } else {
            cell.innerHTML = `<span class="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-700 flex items-center justify-center transition text-xs">${d}</span>`;
        }
        grid.appendChild(cell);
    }
}

function initAllSingleDatePickers() {
    document.querySelectorAll('.bms-date-picker').forEach(container => {
        const input = container.querySelector('input[type="hidden"]');
        if (input && input.id) {
            initSingleDatePicker(input.id);
        }
    });
}

// Global click handler to close all custom select dropdown menus and single date pickers when clicked outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.bms-date-picker')) {
        document.querySelectorAll('.bms-date-popover').forEach(p => p.classList.add('hidden'));
        document.querySelectorAll('.bms-date-picker').forEach(c => c.classList.remove('z-50'));
    }
    const isInsideDropdown = e.target.closest('.bms-custom-select') ||
                             e.target.closest('.bms-custom-select-menu') ||
                             e.target.closest('.product-select-container') ||
                             e.target.closest('button[onclick*="Dropdown"]');
    if (!isInsideDropdown) {
        closeAllFloatingDropdowns();
    }
});

// Close floating dropdowns on page or table scroll (while allowing internal scroll within menu)
window.addEventListener('scroll', (e) => {
    if (e.target && (e.target.classList?.contains('bms-custom-select-menu') || e.target.closest?.('.bms-custom-select-menu'))) {
        return;
    }
    closeAllFloatingDropdowns();
}, true);

// Close floating dropdowns on window resize
window.addEventListener('resize', () => {
    closeAllFloatingDropdowns();
});

// Close floating dropdowns on Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllFloatingDropdowns();
    }
});

// Auto initialize single date pickers on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSingleDatePickers);
} else {
    initAllSingleDatePickers();
}

/**
 * Global BMSActionTracker (Action Process Recording & Refresh-to-Default)
 */
(function() {
    if (window.BMSActionTracker) return;

    const BMS_DEFAULT_ACTIONS = [
        {
            id: 'ACT-003',
            type: 'approve',
            title: 'បានអនុម័តប័ណ្ណចំណាយ EXP-2026-0018',
            detail: 'អនុម័តដោយ សុខ ចាន់ថន • $450.00',
            time: '09:45',
            badge: 'បានអនុម័ត',
            badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/60',
            icon: 'fa-circle-check',
            iconBg: 'bg-blue-50 text-blue-600'
        },
        {
            id: 'ACT-002',
            type: 'invoice',
            title: 'ចេញវិក្កយបត្រ INV-2026-0042',
            detail: 'អតិថិជន: ហេង វិច្ឆិកា • $12,800.00',
            time: '09:15',
            badge: 'វិក្កយបត្រ',
            badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
            icon: 'fa-file-invoice-dollar',
            iconBg: 'bg-emerald-50 text-emerald-600'
        },
        {
            id: 'ACT-001',
            type: 'system',
            title: 'ប្រព័ន្ធត្រូវបានចាប់ផ្ដើមដោយជោគជ័យ',
            detail: 'ម៉ាស៊ីនបម្រើ និងមូលដ្ឋានទិន្នន័យដំណើរការធម្មតា',
            time: '08:30',
            badge: 'ប្រព័ន្ធ',
            badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
            icon: 'fa-server',
            iconBg: 'bg-indigo-50 text-indigo-600'
        }
    ];

    // Single source of truth for the flyout's tab classes. sidebar.js builds the
    // initial markup from these too, so switching tabs no longer changes the
    // tab's padding/size the way two divergent class strings used to.
    const TAB_BASE = 'bms-nf-tab flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap overflow-hidden border-b-2 transition-colors';

    window.BMSActionTracker = {
        actions: JSON.parse(JSON.stringify(BMS_DEFAULT_ACTIONS)),
        activeTab: 'actions',

        TAB_ACTIVE: TAB_BASE + ' is-active border-primary text-primary bg-primary/5',
        TAB_INACTIVE: TAB_BASE + ' border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70',

        record: function(opts) {
            if (!opts) return;

            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const currentTime = `${hours}:${minutes}`;

            let defaultIcon = 'fa-check';
            let defaultIconBg = 'bg-emerald-50 text-emerald-600';
            let defaultBadgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
            let defaultBadge = 'ជោគជ័យ';

            if (opts.type === 'error' || opts.type === 'danger' || opts.type === 'reject') {
                defaultIcon = 'fa-xmark';
                defaultIconBg = 'bg-rose-50 text-rose-600';
                defaultBadgeClass = 'bg-rose-50 text-rose-700 border border-rose-200/60';
                defaultBadge = 'បានបដិសេធ';
            } else if (opts.type === 'warning') {
                defaultIcon = 'fa-triangle-exclamation';
                defaultIconBg = 'bg-amber-50 text-amber-600';
                defaultBadgeClass = 'bg-amber-50 text-amber-700 border border-amber-200/60';
                defaultBadge = 'ជូនដំណឹង';
            } else if (opts.type === 'approve' || opts.type === 'approve_all') {
                defaultIcon = 'fa-circle-check';
                defaultIconBg = 'bg-emerald-50 text-emerald-600';
                defaultBadgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
                defaultBadge = 'បានអនុម័ត';
            } else if (opts.type === 'delete') {
                defaultIcon = 'fa-trash-can';
                defaultIconBg = 'bg-rose-50 text-rose-600';
                defaultBadgeClass = 'bg-rose-50 text-rose-700 border border-rose-200/60';
                defaultBadge = 'បានលុប';
            } else if (opts.type === 'create') {
                defaultIcon = 'fa-plus';
                defaultIconBg = 'bg-emerald-50 text-emerald-600';
                defaultBadgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
                defaultBadge = 'បានបង្កើត';
            }

            const newAction = {
                id: 'ACT-' + Date.now().toString().slice(-4),
                type: opts.type || 'success',
                title: opts.title || 'សកម្មភាពថ្មី',
                detail: opts.detail || 'ប្រតិបត្តិដោយ សុខ ចាន់ថន',
                time: opts.time || currentTime,
                badge: opts.badge || defaultBadge,
                badgeClass: opts.badgeClass || defaultBadgeClass,
                icon: opts.icon || defaultIcon,
                iconBg: opts.iconBg || defaultIconBg,
                isNew: true
            };

            this.actions.unshift(newAction);
            this.renderTimeline();
            this.updateBadge();
            this.triggerBellIndicator();

            window.dispatchEvent(new CustomEvent('bmsActionRecorded', { detail: newAction }));
            return newAction;
        },

        getHistory: function() {
            return this.actions;
        },

        resetToDefault: function() {
            this.actions = JSON.parse(JSON.stringify(BMS_DEFAULT_ACTIONS));
            this.renderTimeline();
            this.updateBadge();

            if (typeof window.resetApprovalsToDefault === 'function') {
                window.resetApprovalsToDefault();
            }

            if (typeof window.showToast === 'function') {
                window.showToast('ទិន្នន័យ និងប្រវត្តិនៃសកម្មភាពត្រូវបានកំណត់ទៅសភាពដើមវិញ!', 'info');
            }

            window.dispatchEvent(new CustomEvent('bmsActionReset'));
        },

        switchTab: function(tabName) {
            this.activeTab = tabName;
            const tabActionsBtn = document.getElementById('bmsTabActionsBtn');
            const tabNotifsBtn = document.getElementById('bmsTabNotifsBtn');
            const actionContainer = document.getElementById('bmsActionTimelineList');
            const notifContainer = document.getElementById('bmsNotificationItemsList');

            const showActions = tabName === 'actions';
            if (tabActionsBtn) tabActionsBtn.className = showActions ? this.TAB_ACTIVE : this.TAB_INACTIVE;
            if (tabNotifsBtn) tabNotifsBtn.className = showActions ? this.TAB_INACTIVE : this.TAB_ACTIVE;
            if (tabActionsBtn) tabActionsBtn.setAttribute('aria-selected', String(showActions));
            if (tabNotifsBtn) tabNotifsBtn.setAttribute('aria-selected', String(!showActions));
            if (actionContainer) actionContainer.classList.toggle('hidden', !showActions);
            if (notifContainer) notifContainer.classList.toggle('hidden', showActions);

            if (showActions) this.renderTimeline();
            if (typeof window.syncNotifScrollFade === 'function') window.syncNotifScrollFade();
        },

        updateBadge: function() {
            const badge = document.getElementById('bmsActionCountBadge');
            if (badge) {
                const count = this.actions.length;
                badge.textContent = `${count}`;
            }
        },

        triggerBellIndicator: function() {
            const bellPings = document.querySelectorAll('header button .animate-ping');
            bellPings.forEach(p => {
                if (p.parentElement) p.parentElement.style.display = 'flex';
            });
        },

        renderTimeline: function(containerId = 'bmsActionTimelineList') {
            const container = document.getElementById(containerId);
            if (!container) return;

            if (this.actions.length === 0) {
                container.innerHTML = `
                    <div class="py-14 px-6 text-center">
                        <i class="fas fa-clipboard-list text-3xl text-slate-200 mb-3"></i>
                        <p class="nf-title text-slate-500">មិនទាន់មានសកម្មភាពត្រូវបានកត់ត្រានៅឡើយទេ</p>
                        <p class="nf-sub text-slate-400 mt-1">សកម្មភាពរបស់លោកអ្នកនឹងបង្ហាញនៅទីនេះ</p>
                    </div>
                `;
                this.updateBadge();
                return;
            }

            let html = '';
            this.actions.forEach((act, idx) => {
                const isLast = idx === this.actions.length - 1;
                // Icons are drawn bare (no tinted chip), so keep only the text-* half
                // of the stored iconBg pair and brighten it a step.
                const iconColor = (act.iconBg || '')
                    .split(' ')
                    .filter(c => c.startsWith('text-'))
                    .join(' ')
                    .replace('-600', '-500') || 'text-slate-500';

                const newPulse = act.isNew
                    ? '<span class="nf-chip inline-flex items-center px-1.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">ទើបធ្វើ</span>'
                    : '';

                html += `
                    <div class="relative flex items-start gap-3.5 px-4 py-3 hover:bg-slate-50 transition-colors group">
                        ${!isLast ? '<div class="absolute left-[26px] top-[34px] bottom-0 w-px bg-slate-100"></div>' : ''}

                        <i class="fas ${act.icon} nf-icon ${iconColor} w-5 text-center flex-shrink-0 mt-0.5 relative z-10"></i>

                        <div class="flex-1 min-w-0">
                            <div class="flex items-baseline justify-between gap-2">
                                <h5 class="nf-title text-slate-700 truncate">${act.title}</h5>
                                <span class="nf-time text-slate-400 flex-shrink-0">${act.time}</span>
                            </div>
                            <p class="nf-sub text-slate-400 truncate mt-0.5">${act.detail}</p>
                            <div class="mt-1.5 flex items-center gap-1.5">
                                <span class="nf-chip px-2 py-0.5 rounded-full font-medium ${act.badgeClass}">${act.badge}</span>
                                ${newPulse}
                            </div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
            this.updateBadge();
            if (typeof window.syncNotifScrollFade === 'function') window.syncNotifScrollFade();
        }
    };
})();

/**
 * Mobile Date Range Picker Backdrop & Modal Portal Manager
 * Fixes stacking context on mobile (< 640px) by portaling popovers to document.body above the backdrop
 */
function initDateRangeBackdropObserver() {
    let backdrop = document.getElementById('bmsDateModalBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'bmsDateModalBackdrop';
        backdrop.className = 'hidden opacity-0 pointer-events-none';
        document.body.appendChild(backdrop);

        backdrop.addEventListener('click', () => {
            document.querySelectorAll('#datePickerPopover, .bms-date-popover').forEach(p => {
                p.classList.add('hidden');
            });
            document.querySelectorAll('#datePickerChevron').forEach(c => {
                c.classList.remove('rotate-180');
            });
            backdrop.classList.add('opacity-0', 'pointer-events-none');
            backdrop.classList.remove('opacity-100', 'pointer-events-auto');
            setTimeout(() => backdrop.classList.add('hidden'), 200);
            checkPopovers();
        });
    }

    const checkPopovers = () => {
        const popovers = Array.from(document.querySelectorAll('#datePickerPopover, .bms-date-popover'));
        const isMobile = window.innerWidth < 640;

        popovers.forEach(p => {
            const isOpen = !p.classList.contains('hidden') && window.getComputedStyle(p).display !== 'none';

            if (isMobile && isOpen) {
                // Teleport to document.body above backdrop if not already there
                if (p.parentElement !== document.body) {
                    if (!p.__portalPlaceholder) {
                        p.__portalPlaceholder = document.createComment('bms-date-popover-placeholder');
                    }
                    p.parentElement.insertBefore(p.__portalPlaceholder, p);
                    document.body.appendChild(p);
                }
            } else {
                // Restore to original container when closed or on desktop
                if (p.__portalPlaceholder && p.__portalPlaceholder.parentElement) {
                    p.__portalPlaceholder.parentElement.insertBefore(p, p.__portalPlaceholder);
                    p.__portalPlaceholder.remove();
                    delete p.__portalPlaceholder;
                }
            }
        });

        if (!isMobile) {
            if (backdrop) {
                backdrop.classList.add('hidden', 'opacity-0', 'pointer-events-none');
                backdrop.classList.remove('opacity-100', 'pointer-events-auto');
            }
            return;
        }

        const anyOpen = popovers.some(p => !p.classList.contains('hidden') && window.getComputedStyle(p).display !== 'none');

        if (backdrop) {
            if (anyOpen) {
                backdrop.classList.remove('hidden');
                requestAnimationFrame(() => {
                    backdrop.classList.remove('opacity-0', 'pointer-events-none');
                    backdrop.classList.add('opacity-100', 'pointer-events-auto');
                });
            } else {
                backdrop.classList.add('opacity-0', 'pointer-events-none');
                backdrop.classList.remove('opacity-100', 'pointer-events-auto');
                setTimeout(() => {
                    const stillOpen = Array.from(document.querySelectorAll('#datePickerPopover, .bms-date-popover'))
                        .some(p => !p.classList.contains('hidden'));
                    if (!stillOpen) backdrop.classList.add('hidden');
                }, 200);
            }
        }
    };

    const attachObservers = () => {
        const popovers = document.querySelectorAll('#datePickerPopover, .bms-date-popover');
        if (popovers.length > 0) {
            const observer = new MutationObserver(checkPopovers);
            popovers.forEach(p => {
                if (!p.__hasBmsObserver) {
                    p.__hasBmsObserver = true;
                    observer.observe(p, { attributes: true, attributeFilter: ['class', 'style'] });
                }
            });
        }
    };

    attachObservers();
    document.addEventListener('click', () => setTimeout(checkPopovers, 50));
    window.addEventListener('resize', checkPopovers);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDateRangeBackdropObserver);
} else {
    initDateRangeBackdropObserver();
}
