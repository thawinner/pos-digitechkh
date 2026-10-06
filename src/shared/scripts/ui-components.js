/**
 * DIGITECHKH - Custom UI Components
 * Replaces native browser elements (alert, confirm, select) with elegant enterprise-grade UI
 */

// 1. Toast Notification System (Replaces window.alert)
function showToast(message, type = 'success', duration = 3200, options = null) {
    if (typeof duration === 'object' && duration !== null) {
        options = duration;
        duration = options && options.action ? 6000 : 3200;
    } else if (options && options.action && duration === 3200) {
        duration = 6000;
    }

    /* ទីតាំង៖ ខាងក្រោមស្តាំ (មិនបាំងប៊ូតុងក្បាលទំព័រ) · ផ្ទាំងគិតលុយ៖ ខាងក្រោមឆ្វេង (មិនបាំងសរុប និងប៊ូតុងទូទាត់)
       ទូរស័ព្ទ៖ ពេញទទឹងខាងក្រោម · សារថ្មីនៅខាងក្រោមគេ */
    let container = document.getElementById('bmsToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'bmsToastContainer';
        container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite');
        const terminal = document.body.classList.contains('pos-shell');
        container.className = `fixed bottom-5 ${terminal ? 'left-5' : 'right-5'} max-sm:left-3 max-sm:right-3 max-sm:bottom-3 z-[9999] flex flex-col items-stretch gap-2 pointer-events-none select-none`;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'bms-toast pointer-events-auto bg-white rounded-xl pl-4 pr-2 py-3 shadow-lg border border-slate-200 flex items-center gap-3 sm:w-[360px] transition-all duration-200 ease-out opacity-0 translate-y-2';

    const TOAST_ICON = {
        success: ['fa-circle-check', 'text-emerald-600'],
        error: ['fa-circle-xmark', 'text-rose-600'],
        danger: ['fa-circle-xmark', 'text-rose-600'],
        warning: ['fa-triangle-exclamation', 'text-amber-600'],
        info: ['fa-circle-info', 'text-slate-400']
    };
    const [icon, tone] = TOAST_ICON[type] || TOAST_ICON.info;
    const iconHtml = `<i class="fas ${icon} ${tone} text-[17px] flex-shrink-0"></i>`;

    const actionHtml = (options && options.action && options.action.label)
        ? `<button type="button" data-toast-action class="bms-toast-action px-2.5 h-8 font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition flex-shrink-0 cursor-pointer">${options.action.label}</button>`
        : '';

    toast.innerHTML = `
        ${iconHtml}
        <div class="bms-toast-text flex-1 min-w-0 text-slate-800">${message}</div>
        ${actionHtml}
        <button type="button" aria-label="បិទ" onclick="this.parentElement.remove()" class="w-8 h-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition flex-shrink-0 inline-flex items-center justify-center cursor-pointer">
            <i class="fas fa-xmark text-[13px]"></i>
        </button>
    `;

    if (options && options.action && typeof options.action.onClick === 'function') {
        const actBtn = toast.querySelector('[data-toast-action]');
        if (actBtn) {
            actBtn.onclick = (e) => {
                e.stopPropagation();
                options.action.onClick();
                toast.remove();
            };
        }
    }

    container.appendChild(toast);
    // ចូលពីក្រោម · ច្រើនបំផុត 3 សារ (សារចាស់បំផុតចេញមុន)
    requestAnimationFrame(() => toast.classList.remove('opacity-0', 'translate-y-2'));
    while (container.children.length > 3) container.firstElementChild.remove();
    // ដាក់កណ្តុរលើ = មិនបាត់ (អានសារវែងទាន់)
    let hovered = false;
    toast.addEventListener('mouseenter', () => { hovered = true; });
    toast.addEventListener('mouseleave', () => { hovered = false; });

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

    const leave = () => {
        if (hovered) return setTimeout(leave, 800);
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 220);
    };
    setTimeout(leave, duration);
}

// 2. Custom Confirm Dialog (Replaces window.confirm)
/* ===== ស្តង់ដារប្រអប់សន្ទនា (គ្រប់ប្រអប់ក្នុងប្រព័ន្ធ) =====
   ផ្ទៃសតម្រឹមឆ្វេង · ចំណងជើង + សារ · ប៊ូតុងពីរស្មើគ្នា៖ បោះបង់ (ស៊ុម) | សកម្មភាពមេ (ខៀវ · ក្រហមតែពេលមិនអាចត្រឡប់វិញ)
   Esc = បោះបង់ · Enter = បញ្ជាក់ · ចុចខាងក្រៅ = បោះបង់ · បិទរួច ការផ្តោតត្រឡប់ទៅកន្លែងដើម (ឧ. ប្រអប់ស្កេនបាកូដ) */
const BMS_DIALOG = {
    backdrop: 'fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto',
    panel: 'bms-dialog w-full bg-white rounded-xl shadow-2xl border border-slate-200 p-5 sm:p-6 text-left',
    title: 'bms-dialog-title text-slate-900',
    message: 'bms-dialog-msg text-slate-600 mt-1.5',
    cancel: 'h-11 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition',
    primary: 'h-11 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition',
    danger: 'h-11 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition'
};

function bmsDialogOpen(id) {
    let modal = document.getElementById(id);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = id;
        document.body.appendChild(modal);
    }
    modal.__returnFocus = document.activeElement;
    modal.className = BMS_DIALOG.backdrop;
    modal.style.display = 'flex';
    return modal;
}

function bmsDialogClose(modal) {
    modal.style.display = 'none';
    modal.innerHTML = '';
    if (modal.__keyHandler) {
        document.removeEventListener('keydown', modal.__keyHandler, true);
        modal.__keyHandler = null;
    }
    const back = modal.__returnFocus;
    modal.__returnFocus = null;
    if (back && typeof back.focus === 'function' && document.contains(back)) {
        try { back.focus({ preventScroll: true }); } catch (e) { /* មិនអាចផ្តោត */ }
    }
}

function showCustomConfirm(options = {}) {
    return new Promise((resolve) => {
        const title = options.title || 'បញ្ជាក់ការប្រតិបត្តិ';
        const message = options.message || 'តើលោកអ្នកពិតជាចង់បន្តសកម្មភាពនេះមែនទេ?';
        const confirmText = options.confirmText || options.okText || 'យល់ព្រម';
        const cancelText = options.cancelText || 'បោះបង់';
        const isDanger = options.danger === true || options.type === 'danger' || options.type === 'error';
        const modal = bmsDialogOpen('bmsCustomConfirmModal');

        modal.innerHTML = `
            <div role="alertdialog" aria-modal="true" aria-labelledby="bmsConfirmTitle" class="${BMS_DIALOG.panel} max-w-sm" onclick="event.stopPropagation()">
                <h4 id="bmsConfirmTitle" class="${BMS_DIALOG.title}">${title}</h4>
                <p class="${BMS_DIALOG.message}">${message}</p>
                <div class="grid ${options.hideCancel ? 'grid-cols-1' : 'grid-cols-2'} gap-2.5 mt-5">
                    ${options.hideCancel ? '' : `<button id="bmsConfirmCancelBtn" type="button" class="${BMS_DIALOG.cancel}">${cancelText}</button>`}
                    <button id="bmsConfirmOkBtn" type="button" class="${isDanger ? BMS_DIALOG.danger : BMS_DIALOG.primary}">${confirmText}</button>
                </div>
            </div>`;

        const close = confirmed => {
            bmsDialogClose(modal);
            if (confirmed && typeof options.onConfirm === 'function') options.onConfirm();
            if (!confirmed && typeof options.onCancel === 'function') options.onCancel();
            resolve(confirmed);
        };
        const cancelBtn = document.getElementById('bmsConfirmCancelBtn');
        const okBtn = document.getElementById('bmsConfirmOkBtn');
        if (cancelBtn) cancelBtn.onclick = () => close(false);
        okBtn.onclick = () => close(true);
        modal.onclick = () => { if (!options.hideCancel) close(false); };
        modal.__keyHandler = e => {
            if (e.key === 'Escape' && !options.hideCancel) { e.preventDefault(); e.stopPropagation(); close(false); }
            else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); (document.activeElement === cancelBtn ? cancelBtn : okBtn).click(); }
        };
        document.addEventListener('keydown', modal.__keyHandler, true);
        // សកម្មភាពគ្រោះថ្នាក់៖ ផ្តោតលើបោះបង់ (ចុច Enter ដោយចៃដន្យមិនលុប)
        (isDanger && cancelBtn ? cancelBtn : okBtn).focus();
    });
}

// 2b. Reason Prompt — ប្រអប់សួរមូលហេតុ (ប្រើសម្រាប់បដិសេធ លុបចោល ដែលតម្រូវឱ្យមានមូលហេតុ — ឯកសារ 15)
// ត្រឡប់ Promise<string|null>: អត្ថបទមូលហេតុ ឬ null បើអ្នកប្រើបោះបង់ · options.reasons = ឃ្លាដែលប្រើញឹកញាប់ (ស្រេចចិត្ត)
function showReasonPrompt(options = {}) {
    return new Promise((resolve) => {
        const title = options.title || 'បញ្ចូលមូលហេតុ';
        const message = options.message || '';
        const placeholder = options.placeholder || 'សូមបញ្ចូលមូលហេតុ...';
        const confirmText = options.confirmText || 'បញ្ជាក់';
        const cancelText = options.cancelText || 'បោះបង់';
        const isDanger = options.danger === true;
        const quick = options.reasons || [];
        const modal = bmsDialogOpen('bmsReasonModal');

        modal.innerHTML = `
            <div role="dialog" aria-modal="true" aria-labelledby="bmsReasonTitle" class="${BMS_DIALOG.panel} max-w-md" onclick="event.stopPropagation()">
                <h4 id="bmsReasonTitle" class="${BMS_DIALOG.title}">${title}</h4>
                ${message ? `<p class="${BMS_DIALOG.message}">${message}</p>` : ''}
                <label for="bmsReasonInput" class="block bms-dialog-label text-slate-700 mt-4 mb-1.5">មូលហេតុ <span class="text-rose-600">*</span></label>
                ${quick.length ? `<div class="flex flex-wrap gap-1.5 mb-2">${quick.map(r => `<button type="button" data-quick class="h-8 px-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 bms-dialog-chip">${r}</button>`).join('')}</div>` : ''}
                <textarea id="bmsReasonInput" rows="3" placeholder="${placeholder}"
                    class="bms-dialog-input w-full bg-white border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition resize-none"></textarea>
                <p id="bmsReasonError" class="hidden bms-dialog-msg text-rose-600 font-semibold mt-1.5"><i class="fas fa-circle-exclamation mr-1"></i>សូមសរសេរមូលហេតុជាមុនសិន</p>
                <div class="grid grid-cols-2 gap-2.5 mt-5">
                    <button id="bmsReasonCancelBtn" type="button" class="${BMS_DIALOG.cancel}">${cancelText}</button>
                    <button id="bmsReasonOkBtn" type="button" class="${isDanger ? BMS_DIALOG.danger : BMS_DIALOG.primary}">${confirmText}</button>
                </div>
            </div>`;

        const input = document.getElementById('bmsReasonInput');
        const error = document.getElementById('bmsReasonError');
        const close = value => { bmsDialogClose(modal); resolve(value); };
        const submit = () => {
            const text = input.value.trim();
            if (!text) { error.classList.remove('hidden'); input.focus(); return; }
            close(text);
        };
        document.getElementById('bmsReasonCancelBtn').onclick = () => close(null);
        document.getElementById('bmsReasonOkBtn').onclick = submit;
        modal.querySelectorAll('[data-quick]').forEach(b => b.onclick = () => {
            input.value = input.value.trim() ? `${input.value.trim()} · ${b.textContent}` : b.textContent;
            error.classList.add('hidden');
            input.focus();
        });
        modal.onclick = () => close(null);
        // Enter = បញ្ជាក់ · Shift+Enter = បន្ទាត់ថ្មី · Esc = បោះបង់
        modal.__keyHandler = e => {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(null); }
            else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); submit(); }
        };
        document.addEventListener('keydown', modal.__keyHandler, true);
        input.oninput = () => error.classList.add('hidden');
        input.focus();
    });
}

// 3. Custom Dropdown Helpers (Fixed Floating Dropdown Elevation System)
function openFloatingDropdown(btn, menu) {
    if (!btn || !menu) return;

    // Close any other open floating dropdowns first
    closeAllFloatingDropdowns();

    // Store trigger element reference and timestamp on menu
    menu._triggerBtn = btn;
    menu._openedAt = Date.now();
    btn.setAttribute('data-floating-trigger', 'true');

    // វាស់ទីតាំងប៊ូតុងមុនបង្ហាញម៉ឺនុយ ហើយដាក់ position: fixed មុនដោះ hidden —
    // បើមិនដូច្នេះទេ ម៉ឺនុយនៅក្នុងលំហូរធម្មតាមួយភ្លែត ពង្រីកជួរក្បាលទំព័រ (items-center)
    // រុញប៊ូតុងឡើងលើ ~85px ហើយម៉ឺនុយត្រូវដាក់ហួសគែមខាងលើអេក្រង់
    const rect = btn.getBoundingClientRect();
    menu.style.setProperty('position', 'fixed', 'important');
    menu.style.setProperty('top', `${rect.bottom + 8}px`, 'important');

    // Mark active and unhide
    menu.classList.remove('hidden');
    menu.dataset.floatingActive = 'true';
    const vHeight = window.innerHeight;
    const vWidth = window.innerWidth;

    const spaceBelow = vHeight - rect.bottom;
    const spaceAbove = rect.top;

    const isHeaderMenu = menu.id === 'portalNotifMenu' || menu.id === 'portalProfileMenu' || !!btn.closest('header');
    const isNotif = menu.id === 'portalNotifMenu';
    const isProfile = menu.id === 'portalProfileMenu';
    const isProductPicker = menu.id === 'globalProductPicker' || menu.classList.contains('product-picker');

    // Width calculation
    // ទទឹងអប្បបរមាមិនត្រូវលើសទទឹងអេក្រង់ឡើយ បើមិនដូច្នេះទេ
    // ការគណនាទីតាំងនឹងហូសគែម ហើយម៉ឺនុយត្រូវខ្ទាស់ទៅឆ្ងាយពីប៊ូតុង
    const roomy = vWidth - 32;
    let minWidth = Math.min(280, roomy);
    if (isNotif) minWidth = Math.min(380, roomy);
    else if (isProfile) minWidth = Math.min(260, roomy);
    else if (isProductPicker) minWidth = Math.min(340, roomy);

    const targetWidth = Math.min(Math.max(rect.width, minWidth), vWidth - 32);

    // Apply fixed viewport styles to escape all parent containers, overflows & tables
    menu.style.setProperty('position', 'fixed', 'important');
    menu.style.setProperty('z-index', '999999', 'important');
    menu.style.setProperty('width', `${targetWidth}px`, 'important');
    // រចនាប័ទ្មក្នុងបន្ទាត់ !important ឈ្នះ CSS ទាំងអស់ ដូច្នេះត្រូវជ្រើសពណ៌តាមទម្រង់ (ភ្លឺ · ងងឹត) នៅទីនេះ
    menu.style.setProperty('background-color', document.documentElement.classList.contains('dark') ? '#171717' : '#ffffff', 'important');
    menu.style.setProperty('margin-top', '0px', 'important');
    menu.style.setProperty('margin-bottom', '0px', 'important');

    // Horizontal positioning: align right if on right side of screen or header menu
    const isRightSided = (rect.left + rect.width / 2) > (vWidth / 2);
    const shouldAlignRight = isHeaderMenu || isRightSided || (rect.left + targetWidth > vWidth - 16);

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
        let left = Math.max(16, rect.left);
        if (left + targetWidth > vWidth - 16) {
            left = Math.max(16, vWidth - targetWidth - 16);
        }
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

    const trigger = menu._triggerBtn;
    menu._triggerBtn = null;
    const container = (trigger ? (trigger.closest('.bms-custom-select, .product-select-container') || trigger.parentElement) : null) || menu.closest('.bms-custom-select, .product-select-container') || menu.parentElement;
    if (container) {
        container.classList.remove('z-50');
        const arrow = (trigger ? trigger.querySelector('.fa-chevron-down, .bms-custom-select-arrow, .bms-custom-arrow') : null) || container.querySelector('.fa-chevron-down, .bms-custom-select-arrow, .bms-custom-arrow');
        if (arrow) arrow.classList.remove('rotate-180');
        const tr = (trigger || container).closest('tr');
        if (tr) tr.classList.remove('z-40', 'relative', 'bms-row-active');
        const td = (trigger || container).closest('td');
        if (td) td.classList.remove('z-40', 'relative', 'bms-cell-active');
    }
}

function closeAllFloatingDropdowns(excludeMenu = null) {
    // [data-floating-active] គ្របម៉ឺនុយគ្រប់ប្រភេទដែលបើកដោយ openFloatingDropdown()
    // រួមទាំងម៉ឺនុយសកម្មភាពជួរតារាង (⋮) ដែលមិនមានថ្នាក់ .bms-custom-select-menu
    const now = Date.now();
    document.querySelectorAll('[data-floating-active="true"], .bms-custom-select-menu:not(.hidden)').forEach(menu => {
        if (menu === excludeMenu) return;
        // Do not auto-close if the menu was opened in this exact event cycle (within 80ms)
        if (menu._openedAt && (now - menu._openedAt < 80)) return;
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
                <button type="button" onclick="setSinglePickerToday('${id}')" class="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition">
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
            cell.innerHTML = `<span class="w-7 h-7 rounded-full bg-[#047857] text-white flex items-center justify-center font-bold text-xs shadow-xs">${d}</span>`;
        } else if (isToday) {
            cell.innerHTML = `<span class="w-7 h-7 rounded-full border border-blue-500 text-blue-600 flex items-center justify-center font-bold text-xs hover:bg-blue-50">${d}</span>`;
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
                             e.target.closest('[data-floating-trigger]') ||
                             e.target.closest('button[onclick*="Dropdown"]') ||
                             e.target.closest('button[onclick*="Picker"]') ||
                             e.target.closest('button[onclick*="Menu"]');
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
            badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/60',
            icon: 'fa-server',
            iconBg: 'bg-blue-50 text-blue-600'
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

/* ============================================================================
   ប្រអប់សម្រាប់ផ្ទាំងគិតលុយ និងអ្នកគ្រប់គ្រង
   ----------------------------------------------------------------------------
   • showManagerOverride() — អ្នកគ្រប់គ្រងវាយលេខសម្ងាត់ផ្ទាល់ខ្លួននៅលើអេក្រង់អ្នកគិតលុយ
     (ឯកសាររចនាលេខ 02 ផ្នែក 3 ក · ស្រាវជ្រាវ §1)
   • showPinConfirm()      — បញ្ជាក់ដោយលេខសម្ងាត់របស់អ្នកប្រើម្នាក់ (បិទវេន ចុះហត្ថលេខា រក្សាការកំណត់)
   • showReasonPicker()    — ជ្រើសរើសមូលហេតុពីបញ្ជី ឬវាយផ្សេង
   • showOptionDialog()    — ជម្រើសច្រើន (ឧ. អ្នកគ្រប់គ្រងនៅទីនេះ ឬផ្ញើសំណើ)
   ប្រអប់ទាំងអស់ប្រើពណ៌ងងឹតលើផ្ទាំងគិតលុយ (dark: true) និងពណ៌ភ្លឺលើទំព័រផ្សេង។
   ========================================================================== */

const POS_DIALOG_THEME = {
    dark: {
        panel: 'bg-[#171717] border border-white/10 text-slate-100',
        title: 'text-white',
        sub: 'text-slate-400',
        box: 'bg-white/5 border border-white/10',
        chip: 'bg-transparent border-white/15 text-slate-200 hover:border-white/30',
        chipOn: 'bg-transparent border-blue-500 text-blue-300',
        key: 'bg-white/5 hover:bg-white/10 active:bg-white/15 text-white border border-white/10',
        input: 'bg-[#292929] border-white/10 text-white placeholder-slate-500 focus:border-blue-500',
        ghost: 'bg-transparent border border-white/15 hover:bg-white/5 text-slate-200',
        primary: 'bg-blue-600 hover:bg-blue-500 text-white',
        disabled: 'bg-white/5 text-slate-500 cursor-not-allowed',
        pinBox: 'bg-[#121212] border-white/10',
        dot: 'bg-blue-400',
        dotOff: 'bg-white/15'
    },
    light: {
        panel: 'bg-white border border-slate-200 text-slate-800',
        title: 'text-slate-900',
        sub: 'text-slate-500',
        box: 'bg-slate-50 border border-slate-200',
        chip: 'bg-white border-slate-200 text-slate-700 hover:border-slate-300',
        chipOn: 'bg-white border-blue-600 text-blue-700',
        key: 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border border-slate-200',
        input: 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-blue-500',
        ghost: 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700',
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        disabled: 'bg-slate-100 text-slate-400 cursor-not-allowed',
        pinBox: 'bg-white border-slate-300',
        dot: 'bg-slate-900',
        dotOff: 'bg-slate-200'
    }
};

function getPosDialogTheme(opts = {}) {
    if (opts && opts.dark !== undefined) {
        return POS_DIALOG_THEME[opts.dark ? 'dark' : 'light'];
    }
    const isDark = (typeof isDarkMode === 'function' && isDarkMode()) ||
                   document.documentElement.classList.contains('dark') ||
                   (document.body && document.body.classList.contains('dark'));
    return POS_DIALOG_THEME[isDark ? 'dark' : 'light'];
}

function posDialogHost(id) {
    let host = document.getElementById(id);
    if (!host) {
        host = document.createElement('div');
        host.id = id;
        document.body.appendChild(host);
    }
    host.__returnFocus = document.activeElement;
    host.className = 'fixed inset-0 z-[9998] bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto';
    host.style.display = 'flex';
    return host;
}

function posDialogClose(host) {
    host.style.display = 'none';
    host.innerHTML = '';
    if (host.__keyHandler) {
        document.removeEventListener('keydown', host.__keyHandler, true);
        host.__keyHandler = null;
    }
    const back = host.__returnFocus;
    host.__returnFocus = null;
    if (back && typeof back.focus === 'function' && document.contains(back)) {
        try { back.focus({ preventScroll: true }); } catch (e) { /* មិនអាចផ្តោត */ }
    }
}

function posEsc(t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ការចាក់សោរបន្ទាប់ពីវាយលេខសម្ងាត់ខុស 3 ដង — រក្សាទុកត្រឹមផ្ទាំងនេះ */
const POS_PIN_GUARD = { fails: 0, lockedUntil: 0 };

/* ផ្ទាំងលេខ — ប្រើរួមដោយការអនុម័ត និងការបញ្ជាក់លេខសម្ងាត់ */
function posKeypadHtml(th) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];
    return `<div class="grid grid-cols-3 gap-2 mt-3">
        ${keys.map(k => `<button type="button" data-key="${k}" aria-label="${k === 'C' ? 'សម្អាតទាំងអស់' : k === '⌫' ? 'លុបមួយខ្ទង់' : k}"
            class="h-14 rounded-lg ${th.key} ${k === 'C' || k === '⌫' ? 'sm-td-sub font-semibold' : 'text-xl font-semibold'} transition select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">${k === 'C' ? 'សម្អាត' : k === '⌫' ? '<i class="fas fa-delete-left text-lg"></i>' : k}</button>`).join('')}
    </div>`;
}

/* លេខសម្ងាត់ (PIN) មានលេខ 6 ខ្ទង់ជានិច្ច */
const POS_PIN_LEN = 6;

/* ប្រអប់លេខសម្ងាត់ (ចំណុច) — ដូចទំព័រចូលប្រើ៖ 6 ចំណុច · ខៀវពេលកំពុងវាយ · ក្រហមពេលខុស */
function posPinFieldHtml(th, pin, err, msg) {
    const n = POS_PIN_LEN;
    return `<div class="h-14 rounded-lg border flex items-center justify-center gap-3.5 transition-colors ${err ? 'border-rose-400' : pin.length ? 'border-blue-500 ring-2 ring-blue-500/15 ' + th.pinBox.split(' ')[0] : th.pinBox}">
            ${Array.from({ length: n }, (_, i) => `<span class="w-3.5 h-3.5 rounded-full ${i < pin.length ? (err ? 'bg-rose-500' : th.dot) : th.dotOff}"></span>`).join('')}
        </div>
        <p class="sm-td-sub mt-1.5 min-h-[22px] ${err ? 'text-rose-600 font-semibold' : th.sub}" aria-live="polite">${msg}</p>`;
}

function posKbdHint(th) {
    return `<p class="sm-td-sub ${th.sub} text-center mt-3 max-md:hidden"><span class="kbd">Enter</span> បញ្ជាក់ · <span class="kbd">Esc</span> បោះបង់</p>`;
}

/*
 * opts: { title, lines: [[label, value]], reasons: [] | null, reason: 'មូលហេតុកំណត់រួច',
 *         excludeIds: ['CAS-01'], dark: true, confirmText }
 * ត្រឡប់ Promise<{ approverId, approverName, reason } | null>
 */
function showManagerOverride(opts = {}) {
    return new Promise(resolve => {
        const th = getPosDialogTheme(opts);
        const host = posDialogHost('posOverrideModal');
        const managers = (typeof MANAGERS !== 'undefined' ? MANAGERS : [])
            .filter(m => !(opts.excludeIds || []).includes(m.id));
        const reasons = opts.reason ? [] : (opts.reasons || []);
        const state = { approverId: managers.length === 1 ? managers[0].id : '', reason: opts.reason || '', other: '', pin: '', msg: '', tick: null };

        const render = () => {
            const lockedFor = Math.ceil((POS_PIN_GUARD.lockedUntil - Date.now()) / 1000);
            const locked = lockedFor > 0;
            const needReason = reasons.length && !state.reason && !state.other.trim();
            const ready = !locked && state.approverId && !needReason && state.pin.length === POS_PIN_LEN;

            host.innerHTML = `
                <div role="dialog" aria-modal="true" class="w-full max-w-md rounded-xl shadow-2xl ${th.panel} p-5 sm:p-6" onclick="event.stopPropagation()">
                    <div>
                        <p class="sm-card-title ${th.title}">${posEsc(opts.title || 'ទាមទារការអនុម័តពីអ្នកគ្រប់គ្រង')}</p>
                        <p class="sm-td-sub ${th.sub} mt-0.5">អ្នកគ្រប់គ្រងវាយលេខសម្ងាត់ផ្ទាល់ខ្លួន</p>
                    </div>

                    ${(opts.lines || []).length ? `<div class="mt-4 rounded-lg ${th.box} px-3 py-2.5 space-y-1">
                        ${opts.lines.map(([l, v]) => `<div class="flex justify-between gap-3"><span class="sm-td-sub ${th.sub}">${l}</span><span class="sm-td ${th.title} sm-figure text-right">${v}</span></div>`).join('')}
                    </div>` : ''}

                    ${reasons.length ? `<div class="mt-4">
                        <p class="sm-td-sub ${th.sub} mb-1.5">មូលហេតុ</p>
                        <div class="flex flex-wrap gap-2">
                            ${reasons.map((r, i) => `<button type="button" data-reason="${i}" class="sm-badge h-9 px-3 rounded-full border transition ${state.reason === r ? th.chipOn + ' font-semibold' : th.chip}">${posEsc(r)}</button>`).join('')}
                        </div>
                        <input id="posOvOther" type="text" value="${posEsc(state.other)}" placeholder="ឬវាយមូលហេតុផ្សេង..."
                            class="sm-td w-full mt-2 px-3 h-11 rounded-lg border ${th.input} focus:outline-none transition">
                    </div>` : opts.reason ? `<p class="sm-td-sub ${th.sub} mt-3">មូលហេតុ៖ <span class="${th.title}">${posEsc(opts.reason)}</span></p>` : ''}

                    <div class="mt-4">
                        <p class="sm-td-sub ${th.sub} mb-1.5">អ្នកអនុម័ត</p>
                        <div class="flex flex-wrap gap-2">
                            ${managers.map(m => `<button type="button" data-approver="${m.id}" role="radio" aria-checked="${state.approverId === m.id}" class="sm-badge h-11 pl-1.5 pr-3 rounded-lg border transition inline-flex items-center gap-2 ${state.approverId === m.id ? th.chipOn + ' font-semibold' : th.chip}">
                                ${typeof avatarHtml === 'function' ? avatarHtml(m.id, 'w-7 h-7') : ''}${m.name}</button>`).join('')}
                        </div>
                    </div>

                    <div class="mt-4">
                        <div class="flex items-baseline justify-between mb-1.5"><p class="sm-td-sub font-semibold ${th.title}">លេខសម្ងាត់</p><p class="sm-td-sub ${th.sub}">${POS_PIN_LEN} ខ្ទង់</p></div>
                        ${posPinFieldHtml(th, state.pin, locked || !!state.msg, locked ? `<i class="fas fa-lock mr-1.5"></i>វាយខុស 3 ដង · សូមរង់ចាំ ${lockedFor} វិនាទី` : state.msg ? `<i class="fas fa-circle-exclamation mr-1.5"></i>${state.msg}` : '')}
                        ${posKeypadHtml(th)}
                    </div>

                    <div class="grid grid-cols-2 gap-2.5 mt-4">
                        <button type="button" data-act="cancel" class="sm-value h-12 rounded-lg ${th.ghost} font-semibold transition">បោះបង់</button>
                        <button type="button" data-act="ok" ${ready ? '' : 'disabled'} class="sm-value h-12 rounded-lg font-semibold transition inline-flex items-center justify-center gap-2 ${ready ? th.primary : th.disabled}">
                            ${posEsc(opts.confirmText || 'អនុម័ត')}
                        </button>
                    </div>
                    ${posKbdHint(th)}
                </div>`;

            host.querySelectorAll('[data-reason]').forEach(b => b.onclick = () => {
                state.reason = reasons[Number(b.dataset.reason)];
                state.other = '';
                render();
            });
            const other = host.querySelector('#posOvOther');
            if (other) other.oninput = () => {
                state.other = other.value;
                if (state.other.trim()) state.reason = '';
                const okBtn = host.querySelector('[data-act="ok"]');
                const okNow = !locked && state.approverId && (state.reason || state.other.trim()) && state.pin.length === POS_PIN_LEN;
                if (okBtn) {
                    okBtn.disabled = !okNow;
                    okBtn.className = `sm-value h-12 rounded-lg font-semibold transition inline-flex items-center justify-center gap-2 ${okNow ? th.primary : th.disabled}`;
                }
                host.querySelectorAll('[data-reason]').forEach(b => b.className = `sm-badge h-9 px-3 rounded-full border transition ${th.chip}`);
            };
            host.querySelectorAll('[data-approver]').forEach(b => b.onclick = () => {
                state.approverId = b.dataset.approver;
                state.msg = '';
                render();
            });
            host.querySelectorAll('[data-key]').forEach(b => b.onclick = () => press(b.dataset.key));
            host.querySelectorAll('[data-act="cancel"]').forEach(b => { b.onclick = () => finish(null); });
            host.querySelector('[data-act="ok"]').onclick = submit;

            clearTimeout(state.tick);
            if (locked) state.tick = setTimeout(render, 1000);
        };

        const press = k => {
            if (POS_PIN_GUARD.lockedUntil > Date.now()) return;
            if (k === 'C') state.pin = '';
            else if (k === '⌫') state.pin = state.pin.slice(0, -1);
            else if (state.pin.length < POS_PIN_LEN) state.pin += k;
            state.msg = '';
            render();
        };

        const submit = () => {
            if (POS_PIN_GUARD.lockedUntil > Date.now()) return;
            const reason = state.reason || state.other.trim();
            if (!state.approverId) { state.msg = 'សូមជ្រើសរើសអ្នកអនុម័ត'; return render(); }
            if (reasons.length && !reason) { state.msg = 'សូមជ្រើសរើសមូលហេតុ'; return render(); }
            if (typeof verifyPin === 'function' && verifyPin(state.approverId, state.pin)) {
                POS_PIN_GUARD.fails = 0;
                const m = managers.find(x => x.id === state.approverId);
                finish({ approverId: state.approverId, approverName: m ? m.name : '', reason: reason || opts.reason || '' });
                return;
            }
            POS_PIN_GUARD.fails += 1;
            state.pin = '';
            if (typeof logPosEvent === 'function') {
                logPosEvent('override_denied', { approverId: state.approverId, note: opts.title || '' });
            }
            if (POS_PIN_GUARD.fails >= 3) {
                POS_PIN_GUARD.fails = 0;
                POS_PIN_GUARD.lockedUntil = Date.now() + 60000;
                state.msg = '';
            } else {
                state.msg = `លេខសម្ងាត់មិនត្រឹមត្រូវ · នៅសល់ ${3 - POS_PIN_GUARD.fails} ដង`;
            }
            render();
        };

        const finish = value => {
            clearTimeout(state.tick);
            posDialogClose(host);
            resolve(value);
        };

        host.__keyHandler = e => {
            if (document.activeElement && document.activeElement.id === 'posOvOther') return;
            if (/^[0-9]$/.test(e.key)) { press(e.key); e.preventDefault(); e.stopPropagation(); }
            else if (e.key === 'Backspace') { press('⌫'); e.preventDefault(); e.stopPropagation(); }
            else if (e.key === 'Enter') { submit(); e.preventDefault(); e.stopPropagation(); }
            else if (e.key === 'Escape') { finish(null); e.preventDefault(); e.stopPropagation(); }
        };
        document.addEventListener('keydown', host.__keyHandler, true);
        host.onclick = () => finish(null);
        render();
    });
}

/* opts: { title, message, userId, dark, confirmText, danger } → Promise<boolean> */
function showPinConfirm(opts = {}) {
    return new Promise(resolve => {
        const th = getPosDialogTheme(opts);
        const host = posDialogHost('posPinModal');
        const person = typeof personById === 'function' ? personById(opts.userId) : null;
        const state = { pin: '', msg: '', tick: null };

        const render = () => {
            const lockedFor = Math.ceil((POS_PIN_GUARD.lockedUntil - Date.now()) / 1000);
            const locked = lockedFor > 0;
            const ready = !locked && state.pin.length === POS_PIN_LEN;
            host.innerHTML = `
                <div role="dialog" aria-modal="true" class="w-full max-w-sm rounded-xl shadow-2xl ${th.panel} p-5 sm:p-6" onclick="event.stopPropagation()">
                    <p class="sm-card-title ${th.title}">${posEsc(opts.title || 'បញ្ជាក់ដោយលេខសម្ងាត់')}</p>
                    ${opts.message ? `<p class="sm-td-sub ${th.sub} mt-1 leading-relaxed">${opts.message}</p>` : ''}
                    ${person ? `<div class="mt-4 rounded-lg ${th.box} px-3 py-2.5 flex items-center gap-3">${avatarHtml(person.id, 'w-9 h-9')}
                        <span class="min-w-0"><span class="sm-td font-semibold ${th.title} block truncate">${person.name}</span><span class="sm-td-sub ${th.sub} block">វាយលេខសម្ងាត់របស់អ្នក</span></span></div>` : ''}
                    <div class="mt-4">
                        <div class="flex items-baseline justify-between mb-1.5"><p class="sm-td-sub font-semibold ${th.title}">លេខសម្ងាត់</p><p class="sm-td-sub ${th.sub}">${POS_PIN_LEN} ខ្ទង់</p></div>
                        ${posPinFieldHtml(th, state.pin, locked || !!state.msg, locked ? `<i class="fas fa-lock mr-1.5"></i>វាយខុស 3 ដង · សូមរង់ចាំ ${lockedFor} វិនាទី` : state.msg ? `<i class="fas fa-circle-exclamation mr-1.5"></i>${state.msg}` : '')}
                        ${posKeypadHtml(th)}
                    </div>
                    <div class="grid grid-cols-2 gap-2.5 mt-4">
                        <button type="button" data-act="cancel" class="sm-value h-12 rounded-lg ${th.ghost} font-semibold transition">បោះបង់</button>
                        <button type="button" data-act="ok" ${ready ? '' : 'disabled'} class="sm-value h-12 rounded-lg font-semibold transition ${ready ? (opts.danger ? 'bg-rose-600 hover:bg-rose-700 text-white' : th.primary) : th.disabled}">${posEsc(opts.confirmText || 'បញ្ជាក់')}</button>
                    </div>
                    ${posKbdHint(th)}
                </div>`;
            host.querySelectorAll('[data-key]').forEach(b => b.onclick = () => press(b.dataset.key));
            host.querySelectorAll('[data-act="cancel"]').forEach(b => { b.onclick = () => finish(false); });
            host.querySelector('[data-act="ok"]').onclick = submit;
            clearTimeout(state.tick);
            if (locked) state.tick = setTimeout(render, 1000);
        };

        const press = k => {
            if (POS_PIN_GUARD.lockedUntil > Date.now()) return;
            if (k === 'C') state.pin = '';
            else if (k === '⌫') state.pin = state.pin.slice(0, -1);
            else if (state.pin.length < POS_PIN_LEN) state.pin += k;
            state.msg = '';
            render();
        };

        const submit = () => {
            if (POS_PIN_GUARD.lockedUntil > Date.now() || state.pin.length !== POS_PIN_LEN) return;
            if (typeof verifyPin === 'function' && verifyPin(opts.userId, state.pin)) {
                POS_PIN_GUARD.fails = 0;
                finish(true);
                return;
            }
            POS_PIN_GUARD.fails += 1;
            state.pin = '';
            if (POS_PIN_GUARD.fails >= 3) {
                POS_PIN_GUARD.fails = 0;
                POS_PIN_GUARD.lockedUntil = Date.now() + 60000;
            } else {
                state.msg = `លេខសម្ងាត់មិនត្រឹមត្រូវ · នៅសល់ ${3 - POS_PIN_GUARD.fails} ដង`;
            }
            render();
        };

        const finish = value => {
            clearTimeout(state.tick);
            posDialogClose(host);
            resolve(value);
        };

        host.__keyHandler = e => {
            if (/^[0-9]$/.test(e.key)) { press(e.key); e.preventDefault(); e.stopPropagation(); }
            else if (e.key === 'Backspace') { press('⌫'); e.preventDefault(); e.stopPropagation(); }
            else if (e.key === 'Enter') { submit(); e.preventDefault(); e.stopPropagation(); }
            else if (e.key === 'Escape') { finish(false); e.preventDefault(); e.stopPropagation(); }
        };
        document.addEventListener('keydown', host.__keyHandler, true);
        host.onclick = () => finish(false);
        render();
    });
}

/* opts: { title, message, reasons: [], dark, confirmText, danger } → Promise<string|null> */
function showReasonPicker(opts = {}) {
    return new Promise(resolve => {
        const th = getPosDialogTheme(opts);
        const host = posDialogHost('posReasonPickerModal');
        const reasons = opts.reasons || [];
        let picked = '';

        host.innerHTML = `
            <div role="dialog" aria-modal="true" class="w-full max-w-md rounded-xl shadow-2xl ${th.panel} p-5 sm:p-6" onclick="event.stopPropagation()">
                <div>
                    <div class="min-w-0">
                        <p class="sm-card-title ${th.title}">${posEsc(opts.title || 'ជ្រើសរើសមូលហេតុ')}</p>
                        ${opts.message ? `<p class="sm-td-sub ${th.sub} mt-0.5">${opts.message}</p>` : ''}
                    </div>
                </div>
                <div class="flex flex-wrap gap-2 mt-4" id="posRpChips">
                    ${reasons.map((r, i) => `<button type="button" data-i="${i}" class="sm-badge h-9 px-3 rounded-full border transition ${th.chip}">${posEsc(r)}</button>`).join('')}
                </div>
                <textarea id="posRpOther" rows="2" placeholder="${reasons.length ? 'ឬវាយមូលហេតុផ្សេង / ព័ត៌មានបន្ថែម...' : 'សូមបញ្ចូលមូលហេតុ...'}"
                    class="sm-td w-full mt-3 px-3 py-2.5 rounded-xl border ${th.input} focus:outline-none transition resize-none"></textarea>
                <p id="posRpErr" class="hidden sm-td-sub text-rose-500 mt-1">សូមជ្រើសរើស ឬវាយមូលហេតុជាមុនសិន</p>
                <div class="grid grid-cols-2 gap-2.5 mt-4">
                    <button type="button" data-act="cancel" class="sm-value h-12 rounded-lg ${th.ghost} font-semibold transition">បោះបង់</button>
                    <button type="button" data-act="ok" class="sm-value h-12 rounded-lg font-semibold transition ${opts.danger ? 'bg-rose-600 hover:bg-rose-700 text-white' : th.primary}">${posEsc(opts.confirmText || 'បន្ត')}</button>
                </div>
            </div>`;

        const other = host.querySelector('#posRpOther');
        const err = host.querySelector('#posRpErr');
        host.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
            picked = reasons[Number(b.dataset.i)];
            host.querySelectorAll('[data-i]').forEach(x => x.className = `sm-badge h-9 px-3 rounded-full border transition ${x === b ? th.chipOn : th.chip}`);
            err.classList.add('hidden');
        });
        other.oninput = () => err.classList.add('hidden');
        const finish = v => { posDialogClose(host); resolve(v); };
        host.querySelectorAll('[data-act="cancel"]').forEach(b => { b.onclick = () => finish(null); });
        host.querySelector('[data-act="ok"]').onclick = () => {
            const extra = other.value.trim();
            const text = picked && extra ? `${picked} · ${extra}` : (picked || extra);
            if (!text) { err.classList.remove('hidden'); return; }
            finish(text);
        };
        host.onclick = () => finish(null);
        host.__keyHandler = e => { if (e.key === 'Escape') { finish(null); e.stopPropagation(); } };
        document.addEventListener('keydown', host.__keyHandler, true);
    });
}

/* opts: { title, message, options: [{ value, label, desc, icon }], dark } → Promise<value|null> */
function showOptionDialog(opts = {}) {
    return new Promise(resolve => {
        const th = getPosDialogTheme(opts);
        const host = posDialogHost('posOptionModal');
        host.innerHTML = `
            <div role="dialog" aria-modal="true" class="w-full max-w-md rounded-xl shadow-2xl ${th.panel} p-5 sm:p-6" onclick="event.stopPropagation()">
                <p class="sm-card-title ${th.title}">${posEsc(opts.title || 'ជ្រើសរើស')}</p>
                ${opts.message ? `<p class="sm-td-sub ${th.sub} mt-1">${opts.message}</p>` : ''}
                <div class="space-y-2.5 mt-4">
                    ${(opts.options || []).map((o, i) => `
                        <button type="button" data-i="${i}" class="w-full text-left px-4 py-3 rounded-lg border transition flex items-start gap-3 ${th.chip}">
                            <span class="w-10 h-10 rounded-xl ${th.box} flex items-center justify-center flex-shrink-0"><i class="fas ${o.icon || 'fa-circle'}"></i></span>
                            <span class="min-w-0">
                                <span class="sm-value block">${posEsc(o.label)}</span>
                                ${o.desc ? `<span class="sm-td-sub ${th.sub} block mt-0.5">${o.desc}</span>` : ''}
                            </span>
                        </button>`).join('')}
                </div>
                <button type="button" data-act="cancel" class="sm-value w-full h-12 mt-4 rounded-lg ${th.ghost} font-semibold transition">បោះបង់</button>
            </div>`;
        const finish = v => { posDialogClose(host); resolve(v); };
        host.querySelectorAll('[data-i]').forEach(b => b.onclick = () => finish(opts.options[Number(b.dataset.i)].value));
        host.querySelectorAll('[data-act="cancel"]').forEach(b => { b.onclick = () => finish(null); });
        host.onclick = () => finish(null);
        host.__keyHandler = e => { if (e.key === 'Escape') { finish(null); e.stopPropagation(); } };
        document.addEventListener('keydown', host.__keyHandler, true);
    });
}

/* opts: { title, message, icon, confirmText, fields: [{ key, label, value, type: 'text'|'number'|'pin', prefix, suffix, hint, step }],
           validate(values) → សារកំហុស ឬ '', preview(values) → html } → Promise<values|null>
   ប្រអប់បញ្ចូលទិន្នន័យខ្លីៗ (ឈ្មោះ តម្លៃ លេខសម្ងាត់) · preview បង្ហាញលទ្ធផលភ្លាមៗពេលវាយ (ឧ. អត្រាចំណេញថ្មី) */
function showFormDialog(opts = {}) {
    return new Promise(resolve => {
        const th = getPosDialogTheme(opts);
        const host = posDialogHost('posFormModal');
        const fields = opts.fields || [];
        const input = f => {
            const mode = f.type === 'number' ? 'inputmode="decimal"' : f.type === 'pin' ? `inputmode="numeric" maxlength="${POS_PIN_LEN}" autocomplete="off"` : '';
            return `<label class="block">
                <span class="sm-td-sub ${th.sub} block mb-1">${posEsc(f.label)}</span>
                <span class="flex items-center rounded-xl border ${th.input} focus-within:border-blue-500 transition">
                    ${f.prefix ? `<span class="pl-3 sm-td ${th.sub}">${posEsc(f.prefix)}</span>` : ''}
                    <input data-key="${f.key}" type="text" ${mode} value="${posEsc(f.value == null ? '' : f.value)}"
                        class="sm-value w-full h-11 px-3 bg-transparent focus:outline-none ${f.type === 'pin' ? 'tracking-[.4em] sm-figure' : ''} ${f.type === 'number' ? 'sm-figure' : ''}">
                    ${f.suffix ? `<span class="pr-3 sm-td ${th.sub} whitespace-nowrap">${posEsc(f.suffix)}</span>` : ''}
                </span>
                ${f.hint ? `<span class="sm-td-sub ${th.sub} block mt-1">${f.hint}</span>` : ''}
            </label>`;
        };
        host.innerHTML = `
            <div role="dialog" aria-modal="true" class="w-full max-w-md rounded-xl shadow-2xl ${th.panel} p-5 sm:p-6" onclick="event.stopPropagation()">
                <div class="flex items-start gap-3">
                    ${opts.icon ? `<div class="w-11 h-11 rounded-xl ${th.box} flex items-center justify-center flex-shrink-0"><i class="fas ${opts.icon}"></i></div>` : ''}
                    <div class="min-w-0">
                        <p class="sm-card-title ${th.title}">${posEsc(opts.title || '')}</p>
                        ${opts.message ? `<p class="sm-td-sub ${th.sub} mt-0.5">${opts.message}</p>` : ''}
                    </div>
                </div>
                <div class="space-y-3 mt-4">${fields.map(input).join('')}</div>
                <div id="posFormPreview" class="mt-3"></div>
                <p id="posFormErr" class="hidden sm-td-sub text-rose-500 mt-2"></p>
                <div class="grid grid-cols-2 gap-2.5 mt-4">
                    <button type="button" data-act="cancel" class="sm-value h-12 rounded-lg ${th.ghost} font-semibold transition">បោះបង់</button>
                    <button type="button" data-act="ok" class="sm-value h-12 rounded-lg font-semibold transition ${th.primary}">${posEsc(opts.confirmText || 'រក្សាទុក')}</button>
                </div>
            </div>`;
        const err = host.querySelector('#posFormErr');
        const values = () => {
            const out = {};
            host.querySelectorAll('[data-key]').forEach(i => { out[i.dataset.key] = i.value.trim(); });
            return out;
        };
        const refresh = () => {
            err.classList.add('hidden');
            if (opts.preview) host.querySelector('#posFormPreview').innerHTML = opts.preview(values()) || '';
        };
        host.querySelectorAll('[data-key]').forEach(i => {
            i.oninput = refresh;
            i.onkeydown = e => { if (e.key === 'Enter') host.querySelector('[data-act="ok"]').click(); };
        });
        const finish = v => { posDialogClose(host); resolve(v); };
        host.querySelectorAll('[data-act="cancel"]').forEach(b => { b.onclick = () => finish(null); });
        host.querySelector('[data-act="ok"]').onclick = () => {
            const v = values();
            const msg = opts.validate ? opts.validate(v) : '';
            if (msg) { err.textContent = msg; err.classList.remove('hidden'); return; }
            finish(v);
        };
        host.onclick = () => finish(null);
        host.__keyHandler = e => { if (e.key === 'Escape') { finish(null); e.stopPropagation(); } };
        document.addEventListener('keydown', host.__keyHandler, true);
        refresh();
        const first = host.querySelector('[data-key]');
        if (first) { first.focus(); first.select(); }
    });
}

/* opts: { title, subtitle, value, min, max, unit, dark } → Promise<number|null>
   ផ្ទាំងលេខសម្រាប់អេក្រង់ប៉ះ (ឧ. កំណត់ចំនួនទំនិញ 12 ដោយមិនចាំបាច់ចុច + 12 ដង) */
function showNumberPad(opts = {}) {
    return new Promise(resolve => {
        const th = getPosDialogTheme(opts);
        const host = posDialogHost('posNumberPadModal');
        const min = opts.min != null ? opts.min : 0;
        const max = opts.max != null ? opts.max : 9999;
        let val = '';
        const initial = opts.value != null ? String(opts.value) : '';

        const render = () => {
            const shown = val || initial || '0';
            const n = Number(val || initial || 0);
            const bad = val && (n < min || n > max);
            host.innerHTML = `
                <div role="dialog" aria-modal="true" class="w-full max-w-xs rounded-xl shadow-2xl ${th.panel} p-5" onclick="event.stopPropagation()">
                    <p class="sm-card-title ${th.title} text-center">${posEsc(opts.title || 'បញ្ចូលចំនួន')}</p>
                    ${opts.subtitle ? `<p class="sm-td-sub ${th.sub} text-center mt-0.5">${opts.subtitle}</p>` : ''}
                    <div class="mt-4 rounded-lg ${th.box} px-4 py-3 flex items-baseline justify-center gap-2">
                        <span class="text-[36px] font-bold leading-none sm-figure ${val ? th.title : 'opacity-40 ' + th.title}">${shown}</span>
                        ${opts.unit ? `<span class="sm-td-sub ${th.sub}">${posEsc(opts.unit)}</span>` : ''}
                    </div>
                    <p class="sm-td-sub text-center mt-1 min-h-[20px] ${bad ? 'text-rose-500' : th.sub}">${bad ? `ចន្លោះ ${min} ទៅ ${max}` : `អតិបរមា ${max}`}</p>
                    ${posKeypadHtml(th)}
                    <div class="grid grid-cols-2 gap-2 mt-3">
                        <button type="button" data-act="cancel" class="sm-value h-12 rounded-lg ${th.ghost} font-semibold">បោះបង់</button>
                        <button type="button" data-act="ok" class="sm-value h-12 rounded-lg font-semibold ${bad ? th.disabled : th.primary}">យល់ព្រម</button>
                    </div>
                </div>`;
            host.querySelectorAll('[data-key]').forEach(b => b.onclick = () => press(b.dataset.key));
            host.querySelectorAll('[data-act="cancel"]').forEach(b => { b.onclick = () => finish(null); });
            host.querySelector('[data-act="ok"]').onclick = submit;
        };
        const press = k => {
            if (k === 'C') val = '';
            else if (k === '⌫') val = val.slice(0, -1);
            else if (val.length < 5) val = (val + k).replace(/^0+(?=\d)/, '');
            render();
        };
        const submit = () => {
            if (!val) return finish(null);
            const n = Number(val);
            if (n < min || n > max) return render();
            finish(n);
        };
        const finish = v => { posDialogClose(host); resolve(v); };
        host.__keyHandler = e => {
            if (/^[0-9]$/.test(e.key)) { press(e.key); e.preventDefault(); e.stopPropagation(); }
            else if (e.key === 'Backspace') { press('⌫'); e.preventDefault(); e.stopPropagation(); }
            else if (e.key === 'Enter') { submit(); e.preventDefault(); e.stopPropagation(); }
            else if (e.key === 'Escape') { finish(null); e.preventDefault(); e.stopPropagation(); }
        };
        document.addEventListener('keydown', host.__keyHandler, true);
        host.onclick = () => finish(null);
        render();
    });
}

/* ===== ប្រអប់ចាត់តាំងវេន (ផែនការកែលម្អ S5, S22) =====
   បង្ហាញបញ្ជីបេក្ខជនតាមចំណាត់ថ្នាក់ ម៉ោងមុន→ក្រោយ របារម៉ោងថ្ងៃនេះ ជម្រើសវេនខ្លី មូលហេតុ និងការព្រមានចន្លោះ
   បញ្ជរមិនចាំបាច់ជ្រើសទេ (អ្នកគិតលុយជ្រើសពេលបើកវេន) · ភ្ជាប់បញ្ជរបានជាជម្រើស · វេនពេញ ត្រូវជ្រើសអ្នកដែលត្រូវជំនួស */
function showAssignDialog(opts = {}) {
    return new Promise(resolve => {
        const date = opts.date || isoDate(new Date());
        const code = opts.code || (shiftTemplates()[0] ? shiftTemplates()[0].code : 'A');
        const tpl = shiftTemplates().find(t => t.code === code) || { name: 'វេន', start: '06:00', end: '14:00' };
        const dow = new Date(date + 'T12:00').getDay();
        const DOW_KH = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];

        const candidates = typeof rankCandidates === 'function' ? rankCandidates(date, code) : [];
        if (!candidates.length) {
            showToast('គ្មានបុគ្គលិកដែលអាចចាត់តាំងបានទេ', 'warning');
            return resolve(null);
        }

        const host = posDialogHost('posAssignModal');
        const currentRoster = rosterFor(date, code);

        let selId = opts.preselectPersonId && candidates.some(c => c.id === opts.preselectPersonId && !c.blocked)
            ? opts.preselectPersonId
            : ((candidates.find(c => !c.blocked) || candidates[0]).id);

        let selCand = candidates.find(c => c.id === selId) || candidates[0];

        const full = currentRoster.length >= REGISTERS.length;
        let selReplace = opts.replace && currentRoster.some(a => a.cashierId === opts.replace) ? opts.replace : '';
        let selReg = '';

        const reasonsList = (posSettings().reasons && posSettings().reasons.cover) || ['ឈប់សម្រាក', 'ឈឺ', 'ប្តូរវេនគ្នា', 'ពេលមមាញឹក', 'ផ្សេងៗ'];
        let selReason = '';
        let isPartial = !!(selCand && selCand.partialAllowed);
        let showBlocked = false;
        let showMore = false;

        const renderDialog = () => {
            const prevList = host.querySelector('[data-list]');
            const listScroll = prevList ? prevList.scrollTop : 0;
            selCand = candidates.find(c => c.id === selId) || candidates[0];
            const isReplacing = !!selReplace;

            const recommended = candidates.filter(c => !c.blocked && c.rank <= 2);
            const others = candidates.filter(c => !c.blocked && c.rank > 2);
            const blockedList = candidates.filter(c => c.blocked);

            const toneMap = {
                emerald: 'bg-white text-slate-600 border-slate-200',
                indigo: 'bg-white text-slate-600 border-slate-200',
                amber: 'bg-amber-50 text-amber-700 border-amber-200',
                rose: 'bg-rose-50 text-rose-700 border-rose-200'
            };

            const candRow = c => {
                const isSelected = c.id === selId;
                const isBlocked = c.blocked;
                return `
                    <div data-cand="${c.id}" role="radio" aria-checked="${isSelected}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition ${isBlocked ? 'cursor-not-allowed border-slate-100 bg-slate-50' : (isSelected ? 'cursor-pointer border-blue-600 bg-white' : 'cursor-pointer border-slate-200 hover:border-slate-300 bg-white')}">
                        <div class="flex items-center justify-center w-5 flex-shrink-0">
                            ${isBlocked ? '<i class="fas fa-ban text-slate-300 text-xs"></i>' : `<span class="w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}">${isSelected ? '<span class="w-1.5 h-1.5 rounded-full bg-white"></span>' : ''}</span>`}
                        </div>
                        ${avatarHtml(c.id, 'w-8 h-8')}
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                                <span class="sm-td font-medium ${isBlocked ? 'text-slate-400' : 'text-slate-800'} truncate">${c.name}</span>
                                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${toneMap[c.tone] || 'border-slate-200 text-slate-600'}">${c.chip}</span>
                            </div>
                            <div class="text-[12px] text-slate-500 mt-0.5 sm-figure flex flex-wrap items-center gap-x-2">
                                <span class="whitespace-nowrap">សប្តាហ៍នេះ ${c.hoursBefore} → ${c.hoursAfter} ម៉ោង</span>
                                ${c.reason ? `<span class="${c.blocked ? 'text-rose-600' : 'text-amber-600 font-medium'} truncate">${c.reason}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            };

            // របារម៉ោងថ្ងៃនេះ៖ បង្ហាញតែពេលបុគ្គលិកបានធ្វើការរួចថ្ងៃនេះ (វេនទ្វេ) · ពេលនោះវេនខ្លីជាជម្រើសតែមួយ
            let dayBarHtml = '';
            if (selCand && (selCand.workedToday > 0 || selCand.partialAllowed)) {
                const worked = selCand.workedToday || 0;
                const shiftH = isPartial && selCand.capTime ? ((minutesOf(selCand.capTime) - minutesOf(tpl.start) + 1440) % 1440) / 60 : templateHours(tpl);
                const workedPct = Math.min(100, (worked / 12) * 100);
                const shiftPct = Math.min(100 - workedPct, (Math.max(0, shiftH) / 12) * 100);
                dayBarHtml = `
                    <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                        <div class="flex items-center justify-between gap-2 text-[13px]">
                            <span class="font-semibold text-slate-700">${selCand.name} · ថ្ងៃនេះ</span>
                            <span class="text-slate-600 sm-figure font-semibold">${Math.round((worked + shiftH) * 10) / 10} / 12 ម៉ោង</span>
                        </div>
                        <div class="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                            <div style="width: ${workedPct}%" class="bg-slate-500 h-full"></div>
                            <div style="width: ${shiftPct}%" class="bg-blue-500 h-full"></div>
                        </div>
                        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
                            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-slate-500"></span>${selCand.openDrawerNow ? `${selCand.openDrawerNow.templateName} ${worked} ម៉ោង` : `បានធ្វើ ${worked} ម៉ោង`}</span>
                            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-blue-500"></span>វេននេះ ${Math.round(shiftH * 10) / 10} ម៉ោង</span>
                        </div>
                        ${isPartial ? `
                            <p class="text-[13px] font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                <i class="fas fa-scissors mr-1.5 text-amber-600"></i>វេនខ្លី ${tpl.start}–${selCand.capTime} ដើម្បីកុំឱ្យលើស 12 ម៉ោង · ${selCand.capTime}–${tpl.end} នៅខ្វះអ្នក
                            </p>` : ''}
                    </div>
                `;
            }

            const warningLines = [];
            if (selCand && selCand.over48) {
                warningLines.push(`<p class="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2"><i class="fas fa-clock text-amber-600"></i><span>បុគ្គលិកនេះធ្វើការ ${selCand.hoursAfter} ម៉ោងក្នុងសប្តាហ៍នេះ · លើស 48 ម៉ោង ត្រូវបង់ម៉ោងបន្ថែម</span></p>`);
            }
            if (selCand && selCand.leavesGap) {
                warningLines.push(`<p class="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"><i class="fas fa-triangle-exclamation mr-1.5"></i>${selCand.leavesGap} ថ្ងៃនេះនឹងគ្មានអ្នកគិតលុយ</p>`);
            } else if (isReplacing) {
                warningLines.push(`<p class="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"><i class="fas fa-triangle-exclamation mr-1.5"></i>${personName(selReplace)} នឹងត្រូវដកចេញពី${tpl.name}</p>`);
            }
            const warningLine = warningLines.join('');

            const canSubmit = selCand && !selCand.blocked && (!full || selReplace);
            // មួយបញ្ជរ មួយអ្នកក្នុងវេន៖ បញ្ជរដែលអ្នកផ្សេងកំពុងប្រើ ឬភ្ជាប់រួច មិនអាចជ្រើសបានទេ
            const takenRegs = rosterTakenRegisters(date, code, selId);
            const pinOwner = r => takenRegs[r] && takenRegs[r] !== selReplace ? takenRegs[r] : '';
            if (selReg && pinOwner(selReg)) selReg = '';
            const chipCls = on => `h-9 px-3 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 ${on ? 'bg-white text-blue-700 border-blue-600' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}`;

            host.innerHTML = `
                <div role="dialog" aria-modal="true" class="w-full max-w-lg rounded-xl shadow-2xl bg-white text-slate-800 p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                    <div class="flex items-start justify-between border-b border-slate-100 pb-3">
                        <div>
                            <h3 class="sm-card-title text-slate-800 text-base font-semibold">បន្ថែមអ្នកគិតលុយ · ${tpl.name}</h3>
                            <p class="sm-td-sub text-slate-500 mt-0.5">${DOW_KH[dow]} ${fmtDate(date + 'T12:00')} · ${tpl.start}–${tpl.end}</p>
                        </div>
                        <button type="button" data-act="cancel" aria-label="បិទ" class="w-9 h-9 -mr-1.5 -mt-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 inline-flex items-center justify-center"><i class="fas fa-xmark"></i></button>
                    </div>

                    <div class="space-y-3">
                        <div data-list class="space-y-1.5 max-h-[min(340px,42vh)] overflow-y-auto pr-1">
                            ${recommended.length ? `
                                <p class="text-[12px] font-semibold text-slate-500">ណែនាំ</p>
                                ${recommended.map(candRow).join('')}
                            ` : ''}
                            ${others.length ? `
                                <p class="text-[12px] font-semibold text-slate-500 ${recommended.length ? 'pt-2' : ''}">អាចចាត់តាំងបាន តែមានចំណុចត្រូវដឹង</p>
                                ${others.map(candRow).join('')}
                            ` : ''}
                            ${blockedList.length ? `
                                <button type="button" data-toggle-blocked class="w-full flex items-center justify-between pt-2 text-[12px] font-semibold text-slate-500 hover:text-slate-700">
                                    <span>មិនអាចចាត់តាំង · ${blockedList.length} នាក់</span><i class="fas fa-chevron-${showBlocked ? 'up' : 'down'} text-[10px]"></i>
                                </button>
                                ${showBlocked ? blockedList.map(candRow).join('') : ''}
                            ` : ''}
                        </div>

                        ${dayBarHtml}

                        ${full ? `
                        <div>
                            <p class="text-[13px] font-semibold text-slate-600 mb-1.5">វេនពេញ ${REGISTERS.length}/${REGISTERS.length} នាក់ · ជំនួសអ្នកណា</p>
                            <div class="flex flex-wrap gap-2">
                                ${currentRoster.map(a => `
                                    <button type="button" data-replace="${a.cashierId}" class="${chipCls(selReplace === a.cashierId)}">
                                        ${avatarHtml(a.cashierId, 'w-5 h-5')}<span>${personName(a.cashierId)}</span>
                                    </button>`).join('')}
                            </div>
                        </div>` : ''}

                        ${showMore || selReg || selReason ? `<div class="space-y-4">
                        <div>
                            <p class="text-[13px] font-semibold text-slate-600 mb-1.5">បញ្ជរ <span class="font-normal text-slate-400">· អ្នកគិតលុយជ្រើសពេលបើកវេន</span></p>
                            <div class="flex flex-wrap gap-2">
                                <button type="button" data-reg="" class="${chipCls(!selReg)}">ណាមួយក៏បាន</button>
                                ${REGISTERS.map(r => {
                                    const owner = pinOwner(r);
                                    return owner
                                        ? `<span class="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-400 flex items-center gap-1.5 cursor-not-allowed">
                                            <i class="fas fa-lock text-[10px]"></i><span>${r}</span><span class="font-medium">· ${personName(owner)}</span></span>`
                                        : `<button type="button" data-reg="${r}" class="${chipCls(r === selReg)}">
                                            ${r === selReg ? '<i class="fas fa-thumbtack text-[10px]"></i>' : ''}<span>${r}</span>
                                        </button>`;
                                }).join('')}
                            </div>
                        </div>

                        <div>
                            <p class="text-[13px] font-semibold text-slate-600 mb-1.5">មូលហេតុ <span class="font-normal text-slate-400">· មិនចាំបាច់</span></p>
                            <div class="flex flex-wrap gap-1.5">
                                ${reasonsList.map(re => `
                                    <button type="button" data-reason="${re}" class="h-8 px-3 rounded-full border text-xs transition ${selReason === re ? 'bg-white text-blue-700 border-blue-600 font-semibold' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}">
                                        ${selReason === re ? '<i class="fas fa-check text-[10px] mr-1"></i>' : ''}${re}
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        </div>` : `<button type="button" data-more class="sm-td-sub font-semibold text-blue-700 hover:text-blue-900"><i class="fas fa-plus text-[10px] mr-1"></i>ភ្ជាប់បញ្ជរ ឬដាក់មូលហេតុ</button>`}

                        ${warningLine}
                    </div>

                    <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button type="button" data-act="cancel" class="sm-value h-11 px-5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition">បោះបង់</button>
                        <button type="button" data-act="ok" ${canSubmit ? '' : 'disabled'} class="sm-value h-11 px-6 rounded-lg font-semibold transition ${canSubmit ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}">
                            ${isReplacing ? `ជំនួស ${personName(selReplace)}` : 'ចាត់តាំង'}
                        </button>
                    </div>
                </div>
            `;

            const newList = host.querySelector('[data-list]');
            if (newList) newList.scrollTop = listScroll;

            host.querySelectorAll('[data-cand]').forEach(el => {
                el.onclick = () => {
                    const cid = el.dataset.cand;
                    const c = candidates.find(x => x.id === cid);
                    if (c && !c.blocked) {
                        selId = cid;
                        isPartial = !!c.partialAllowed;
                        renderDialog();
                    }
                };
            });

            const more = host.querySelector('[data-more]');
            if (more) more.onclick = () => { showMore = true; renderDialog(); };
            const tg = host.querySelector('[data-toggle-blocked]');
            if (tg) tg.onclick = () => { showBlocked = !showBlocked; renderDialog(); };

            host.querySelectorAll('[data-reg]').forEach(el => {
                el.onclick = () => {
                    selReg = el.dataset.reg;
                    renderDialog();
                };
            });

            host.querySelectorAll('[data-replace]').forEach(el => {
                el.onclick = () => {
                    selReplace = el.dataset.replace;
                    renderDialog();
                };
            });

            host.querySelectorAll('[data-reason]').forEach(el => {
                el.onclick = () => {
                    selReason = selReason === el.dataset.reason ? '' : el.dataset.reason;
                    renderDialog();
                };
            });


            // ប៊ូតុងបោះបង់មានពីរ (× និង «បោះបង់») — ភ្ជាប់ទាំងពីរ
            host.querySelectorAll('[data-act="cancel"]').forEach(b => { b.onclick = () => finish(null); });
            const okBtn = host.querySelector('[data-act="ok"]');
            if (okBtn) {
                okBtn.onclick = () => {
                    if (!canSubmit) return;
                    finish({
                        personId: selId,
                        register: selReg,
                        replace: selReplace,
                        reason: selReason,
                        partial: isPartial,
                        until: isPartial && selCand.capTime ? selCand.capTime : null,
                        from: tpl.start
                    });
                };
            }
        };

        const finish = v => { posDialogClose(host); resolve(v); };
        host.onclick = () => finish(null);
        host.__keyHandler = e => {
            if (e.key === 'Escape') { finish(null); e.stopPropagation(); }
            else if (e.key === 'Enter') {
                const btn = host.querySelector('[data-act="ok"]');
                if (btn && !btn.disabled) btn.click();
            }
        };
        document.addEventListener('keydown', host.__keyHandler, true);

        renderDialog();
    });
}

/* ===== ចងចាំស្ថានភាពបញ្ជី =====
   ពេលបើកមើលកំណត់ត្រាមួយ រួចចុចត្រឡប់ក្រោយ បញ្ជីត្រឡប់មកផ្ទាំង តម្រង ពាក្យស្វែងរក និងជួរកាលបរិច្ឆេទដដែល
   ហើយជួរដែលទើបមើលត្រូវរំកិលមកកណ្តាល និងបន្លិចមួយភ្លែត ដូច្នេះអ្នកប្រើមិនបាត់កន្លែងដែលកំពុងធ្វើ។
   រក្សាក្នុង sessionStorage (ផ្ទាំងកម្មវិធីរុករកនេះតែប៉ុណ្ណោះ ហើយសម្អាតពេលចាកចេញ)។
   ជួរនីមួយៗត្រូវមាន data-row-id="<លេខសម្គាល់>"។ */
function loadListState(key) {
    try { return JSON.parse(sessionStorage.getItem('pos_list_' + key)) || null; } catch (e) { return null; }
}

function saveListState(key, state) {
    try { sessionStorage.setItem('pos_list_' + key, JSON.stringify(state)); } catch (e) { /* មិនអាចរក្សាទុក */ }
}

/* ហៅពីទំព័រមើលលម្អិត ដើម្បីឱ្យបញ្ជីបន្លិចកំណត់ត្រានេះពេលត្រឡប់ទៅវិញ */
function markRecordViewed(id) {
    try { sessionStorage.setItem('pos_list_viewed', String(id)); } catch (e) { /* មិនអាចរក្សាទុក */ }
}

/* ហៅបន្ទាប់ពីគូរបញ្ជីរួច · ជួរដែលទើបមើលបន្លិចម្តង រួចភ្លេចវិញ */
function flashViewedRow() {
    let id = null;
    try { id = sessionStorage.getItem('pos_list_viewed'); sessionStorage.removeItem('pos_list_viewed'); } catch (e) { return; }
    if (!id) return;
    const row = [...document.querySelectorAll('[data-row-id]')].find(el => el.dataset.rowId === id && el.offsetParent !== null);
    if (!row) return;
    row.scrollIntoView({ block: 'center' });
    row.classList.add('row-flash');
    setTimeout(() => row.classList.remove('row-flash'), 2200);
}


/* ===== បែងចែកទំព័រ (Pagination) =====
   ប្រើ៖ const pg = pagerSlice('approvals', rows, { size: 25, render: 'renderList', sig: filterKey });
         គូរ pg.rows ហើយដាក់ pg.html ក្នុងប្រអប់ខាងក្រោមតារាង (ឧ. <div id="pager"></div>)។
   • sig៖ ខ្សែអក្សរតំណាងតម្រង — ពេលវាប្តូរ ត្រឡប់ទៅទំព័រទី 1 វិញ
   • ទំព័របច្ចុប្បន្នរក្សាក្នុង sessionStorage ដូច្នេះពេលត្រឡប់ពីទំព័រលម្អិត នៅទំព័រដដែល
   • render៖ ឈ្មោះអនុគមន៍សកលដែលត្រូវហៅពេលប្តូរទំព័រ
   • បើទិន្នន័យមិនលើសមួយទំព័រ pg.html ទទេ */
function pagerState() {
    try { return JSON.parse(sessionStorage.getItem('pos_pager')) || {}; } catch (e) { return {}; }
}

function pagerSave(st) {
    try { sessionStorage.setItem('pos_pager', JSON.stringify(st)); } catch (e) { /* មិនអាចរក្សាទុក */ }
}

/* ចំនួនជួរក្នុងមួយទំព័រដែលអ្នកប្រើជ្រើស — ចងចាំតាមបញ្ជីនីមួយៗ (localStorage ព្រោះជាចំណូលចិត្ត) */
const PAGER_SIZES = [10, 25, 50, 100];
function pagerSizes() {
    try { return JSON.parse(localStorage.getItem('pos_pager_size')) || {}; } catch (e) { return {}; }
}

function pagerSlice(key, list, opts = {}) {
    const defSize = opts.size || 25;
    const size = +pagerSizes()[key] || defSize;
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / size));
    const st = pagerState();
    // ទំព័រដែលបានចងចាំភ្ជាប់នឹងតម្រង (sig)៖ តម្រងផ្សេង → ទំព័រទី 1 · ទិន្នន័យថ្មីចូល មិនធ្វើឱ្យលោតទំព័រទេ
    // មិនសរសេរជាន់ទំព័រដែលបានចងចាំនៅទីនេះទេ ព្រោះការគូរដំបូង (មុនស្តារតម្រង) នឹងលុបវាចោល
    // ទំព័រត្រូវរក្សាទុកតែពេលអ្នកប្រើចុចប្តូរទំព័រ (pagerGo)
    const sig = String(opts.sig || '');
    const saved = st[key] || {};
    let cur = saved.sig === sig ? saved.page : 1;
    cur = Math.min(Math.max(cur || 1, 1), pages);
    st[key] = Object.assign({}, saved, { render: opts.render || '', curSig: sig, pages, cur });
    pagerSave(st);
    const from = (cur - 1) * size;
    const rows = list.slice(from, from + size);
    const sizes = [...new Set([...PAGER_SIZES, defSize])].sort((x, y) => x - y);
    // បាតតារាងបង្ហាញតែពេលមានជួរលើសជម្រើសតូចបំផុត (ដូច្នេះអ្នកប្រើអាចប្តូរចំនួនជួរត្រឡប់វិញបានជានិច្ច)
    if (total <= Math.min(size, sizes[0])) return { rows, html: '', page: cur, pages };

    const fmt = n => n.toLocaleString('en-US');
    // ប៊ូតុងលេខទំព័រ៖ ទី 1 · ±2 ជុំវិញទំព័របច្ចុប្បន្ន · ចុងក្រោយ (ចន្លោះជា «…»; ចន្លោះតែមួយលេខ បង្ហាញលេខនោះតែម្តង)
    const nums = [];
    for (let n = 1; n <= pages; n++) {
        const near = n === 1 || n === pages || Math.abs(n - cur) <= 2
            || (n === 2 && cur <= 5) || (n === pages - 1 && cur >= pages - 4);
        if (near) nums.push(n);
        else if (nums[nums.length - 1] !== '…') nums.push('…');
    }
    const base = 'sm-badge h-9 rounded-lg inline-flex items-center justify-center gap-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
    const num = n => `<button type="button" onclick="pagerGo('${key}', ${n})" ${n === cur ? 'aria-current="page"' : ''} aria-label="ទំព័រ ${n}"
        class="${base} min-w-[36px] px-2.5 sm-figure ${n === cur ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100 font-medium'}">${n}</button>`;
    const step = (dir, label) => {
        const n = cur + dir;
        const off = n < 1 || n > pages;
        const icon = `<i class="fas fa-chevron-${dir < 0 ? 'left' : 'right'} text-[11px]"></i>`;
        return `<button type="button" data-pg="${dir < 0 ? 'prev' : 'next'}" ${off ? 'disabled' : `onclick="pagerGo('${key}', ${n}, '${dir < 0 ? 'prev' : 'next'}')"`} aria-label="${label}"
            class="${base} px-2.5 ${off ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100 font-medium'}">${dir < 0 ? icon : ''}<span class="max-md:hidden">${label}</span>${dir > 0 ? icon : ''}</button>`;
    };
    const menuId = `pagerSize-${key}`;
    const sizeMenu = `<div class="relative inline-flex items-center gap-2">
        <span class="sm-td-sub text-slate-500 max-md:hidden">ជួរក្នុងមួយទំព័រ</span>
        <button type="button" onclick="pagerToggleSize(this, '${menuId}')" aria-label="ជួរក្នុងមួយទំព័រ"
            class="${base} px-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium sm-figure">${size}<i class="fas fa-chevron-down text-[10px] text-slate-400"></i></button>
        <div id="${menuId}" class="hidden bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 min-w-[96px]">
            ${sizes.map(n => `<button type="button" onclick="pagerSetSize('${key}', ${n})" class="sm-row-menu-item w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-left sm-figure ${n === size ? 'text-blue-700 font-semibold' : 'text-slate-700'}">${n}${n === size ? '<i class="fas fa-check text-[11px]"></i>' : ''}</button>`).join('')}
        </div>
    </div>`;
    // លោតទៅទំព័រ — តែបញ្ជីវែង (លើស 7 ទំព័រ) ប៉ុណ្ណោះ
    const jump = pages > 7 ? `<label class="inline-flex items-center gap-2 max-md:hidden">
        <span class="sm-td-sub text-slate-500">ទៅទំព័រ</span>
        <input type="text" inputmode="numeric" autocomplete="off" aria-label="ទៅទំព័រ" placeholder="${cur}"
            onkeydown="if(event.key==='Enter'){event.preventDefault();pagerJump('${key}', this.value)}" onblur="if(this.value)pagerJump('${key}', this.value)"
            class="sm-badge sm-figure w-14 h-9 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
    </label>` : '';
    const html = `<div class="pager flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 border-t border-slate-100">
        <div class="flex items-center gap-4 min-w-0">
            <p class="sm-td-sub text-slate-500 sm-figure whitespace-nowrap">${total > size ? `${fmt(from + 1)}–${fmt(Math.min(from + size, total))} នៃ ` : 'សរុប '}${fmt(total)}</p>
            ${sizeMenu}
        </div>
        ${pages > 1 ? `<div class="flex items-center gap-3">
            ${jump}
            <nav class="flex items-center gap-1" aria-label="ទំព័រ">
                ${step(-1, 'មុន')}
                <span class="max-md:hidden flex items-center gap-1">${nums.map(n => n === '…' ? '<span class="sm-badge px-1 text-slate-400">…</span>' : num(n)).join('')}</span>
                <span class="md:hidden sm-td-sub text-slate-600 sm-figure px-2 whitespace-nowrap">${cur} / ${pages}</span>
                ${step(1, 'បន្ទាប់')}
            </nav>
        </div>` : ''}
    </div>`;
    return { rows, html, page: cur, pages };
}

function pagerGo(key, page, focus) {
    const st = pagerState();
    if (!st[key]) return;
    const pages = st[key].pages || 1;
    page = Math.min(Math.max(Math.round(page) || 1, 1), pages);
    st[key].page = page;
    st[key].sig = st[key].curSig;
    pagerSave(st);
    const fn = window[st[key].render];
    if (typeof fn === 'function') fn();
    // ត្រឡប់ទៅក្បាលតារាងវិញ ដើម្បីអានទំព័រថ្មីពីដើម · រក្សាការផ្តោតលើប៊ូតុងដដែល (សម្រាប់ក្តារចុច)
    const pager = document.querySelector(`[data-pager="${key}"]`);
    const box = pager && (pager.closest('section, .bg-white') || pager);
    if (box) box.scrollIntoView({ block: 'start', behavior: 'smooth' });
    const target = pager && (pager.querySelector(`[data-pg="${focus}"]:not([disabled])`) || pager.querySelector('[aria-current="page"]'));
    if (target) target.focus({ preventScroll: true });
}

function pagerJump(key, value) {
    const n = parseInt(String(value).replace(/[^\d]/g, ''), 10);
    if (!n) return;
    const st = pagerState();
    if (st[key] && n === st[key].cur) return;
    pagerGo(key, n);
}

function pagerToggleSize(btn, menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) return;
    if (menu.dataset.floatingActive === 'true' && !menu.classList.contains('hidden')) closeFloatingDropdown(menu);
    else openFloatingDropdown(btn, menu);
}

function pagerSetSize(key, n) {
    closeAllFloatingDropdowns();
    const sizes = pagerSizes();
    sizes[key] = n;
    try { localStorage.setItem('pos_pager_size', JSON.stringify(sizes)); } catch (e) { /* មិនអាចរក្សាទុក */ }
    // ចំនួនជួរថ្មី → ត្រឡប់ទៅទំព័រទី 1 (ទំព័រចាស់គ្មានន័យទៀតទេ)
    pagerGo(key, 1);
}


/* ===== រាប់ក្រដាសប្រាក់ (cashCounter) — ប្រើរួមគ្នាលើទំព័របើកវេន និងបិទវេន =====
   cashCounter('hostId', { usd: countUSD, khr: countKHR, onChange, onDone, title, sub, action })
   • usd / khr៖ វត្ថុ { ក្រដាស: ចំនួនសន្លឹក } — កែតម្លៃផ្ទាល់ក្នុងវត្ថុនោះ ដូច្នេះទំព័រអានសរុបពីវត្ថុដដែល
   • កាតតែមួយ៖ ក្បាល (ចំណងជើង · ព័ត៌មាន · ប៊ូតុង) → តារាងពីរ ដុល្លារ | រៀល (ក្រដាស · ចំនួនសន្លឹក · ទឹកប្រាក់)
     កម្ពស់ស្មើគ្នា សរុបតម្រឹមគ្នានៅខាងក្រោម → បន្ទាត់ជំនួយក្តារចុច
   • ក្តារចុច៖ Enter / ↓ = ក្រដាសបន្ទាប់ · ↑ = មុន · + / − = បន្ថែម / បន្ថយ · Enter លើក្រដាសចុងក្រោយ = onDone
   • ប៊ូតុង 44px សម្រាប់អេក្រង់ប៉ះ · ពណ៌ស្របទម្រង់ភ្លឺ/ងងឹតតាម portal.css (.cc-*) */
function cashCounter(hostId, opts = {}) {
    const host = document.getElementById(hostId);
    if (!host) return;
    const maps = { usd: opts.usd || {}, khr: opts.khr || {} };
    const notes = c => c === 'usd' ? USD_NOTES : KHR_NOTES;
    const label = (c, n) => c === 'usd' ? '$' + n : n.toLocaleString('en-US') + ' ៛';
    const money = (c, v) => c === 'usd' ? fmtUSD(v) : fmtKHR(v);
    const total = c => notes(c).reduce((s, n) => s + n * (maps[c][n] || 0), 0);
    const sheets = c => notes(c).reduce((s, n) => s + (maps[c][n] || 0), 0);
    const cols = 'grid grid-cols-[minmax(84px,1fr)_auto_minmax(96px,1fr)] items-center gap-3';
    const stepBtn = (c, n, d) => `<button type="button" tabindex="-1" data-cc-bump="${c}:${n}:${d}" aria-label="${d > 0 ? 'បន្ថែម' : 'បន្ថយ'} ${label(c, n)}"
        class="cc-btn w-11 h-11 rounded-lg inline-flex items-center justify-center flex-shrink-0 transition"><i class="fas fa-${d > 0 ? 'plus' : 'minus'} text-[12px]"></i></button>`;
    const row = (c, n) => `<div data-cc-row="${c}:${n}" class="cc-row ${cols} px-5 h-[60px]">
        <span class="cc-note sm-value sm-figure">${label(c, n)}</span>
        <div class="flex items-center gap-1">
            ${stepBtn(c, n, -1)}
            <input data-cc-in="${c}:${n}" type="text" inputmode="numeric" autocomplete="off" placeholder="0" value="${maps[c][n] || ''}" aria-label="ចំនួនសន្លឹក ${label(c, n)}"
                class="cc-in sm-value sm-figure w-16 h-11 rounded-lg text-center font-semibold focus:outline-none">
            ${stepBtn(c, n, 1)}
        </div>
        <span data-cc-line="${c}:${n}" class="cc-line sm-td sm-figure text-right truncate"></span>
    </div>`;
    const panel = (c, title) => `<section class="flex flex-col min-w-0">
        <div class="px-5 pt-4 pb-2 flex items-center justify-between gap-3">
            <h3 class="cc-title sm-card-title">${title}</h3>
            <button type="button" data-cc-clear="${c}" class="hidden cc-clear sm-td-sub font-medium"><i class="fas fa-rotate-left text-[11px] mr-1"></i>សម្អាត</button>
        </div>
        <div class="cc-head ${cols} px-5 pb-2 sm-td-sub">
            <span>ក្រដាសប្រាក់</span><span class="text-center">ចំនួនសន្លឹក</span><span class="text-right">ទឹកប្រាក់</span>
        </div>
        <div class="cc-rows">${notes(c).map(n => row(c, n)).join('')}</div>
        <div class="cc-foot mt-auto px-5 py-3.5 flex items-baseline justify-between gap-3">
            <span class="sm-td-sub" data-cc-sheets="${c}"></span>
            <span class="cc-total sm-kpi-value sm-figure" data-cc-total="${c}"></span>
        </div>
    </section>`;

    host.innerHTML = `<div class="cash-counter cc-card rounded-xl overflow-hidden">
        ${opts.title ? `<div class="cc-header px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
                <p class="cc-title sm-card-title">${opts.title}</p>
                ${opts.sub ? `<p class="cc-sub sm-td-sub">${opts.sub}</p>` : ''}
            </div>
            ${opts.action || ''}
        </div>` : ''}
        <div class="cc-split grid grid-cols-1 lg:grid-cols-2">${panel('usd', 'ដុល្លារ')}${panel('khr', 'រៀល')}</div>
        <p class="cc-hint px-5 py-2.5 sm-td-sub max-md:hidden"><span class="kbd">Enter</span> ក្រដាសបន្ទាប់ · <span class="kbd">+</span> <span class="kbd">−</span> បន្ថែម ឬបន្ថយ</p>
    </div>`;

    const paint = () => {
        ['usd', 'khr'].forEach(c => {
            notes(c).forEach(n => {
                const q = maps[c][n] || 0;
                host.querySelector(`[data-cc-line="${c}:${n}"]`).textContent = q ? money(c, n * q) : '';
                host.querySelector(`[data-cc-row="${c}:${n}"]`).classList.toggle('cc-on', !!q);
            });
            host.querySelector(`[data-cc-total="${c}"]`).textContent = money(c, total(c));
            const sh = sheets(c);
            host.querySelector(`[data-cc-sheets="${c}"]`).textContent = sh ? `សរុប ${sh} សន្លឹក` : 'មិនទាន់រាប់';
            host.querySelector(`[data-cc-clear="${c}"]`).classList.toggle('hidden', !sh);
        });
        if (typeof opts.onChange === 'function') opts.onChange();
    };
    const set = (c, n, q) => {
        maps[c][n] = Math.max(0, Math.min(9999, q | 0));
        const input = host.querySelector(`[data-cc-in="${c}:${n}"]`);
        if (input && document.activeElement !== input) input.value = maps[c][n] || '';
        paint();
    };
    const inputs = () => [...host.querySelectorAll('[data-cc-in]')];

    host.onclick = e => {
        const b = e.target.closest('[data-cc-bump]');
        if (b) {
            const [c, n, d] = b.dataset.ccBump.split(':');
            set(c, +n, (maps[c][n] || 0) + (+d));
            host.querySelector(`[data-cc-in="${c}:${n}"]`).value = maps[c][n] || '';
            return;
        }
        const clr = e.target.closest('[data-cc-clear]');
        if (clr) {
            const c = clr.dataset.ccClear;
            notes(c).forEach(n => { maps[c][n] = 0; host.querySelector(`[data-cc-in="${c}:${n}"]`).value = ''; });
            paint();
        }
    };
    host.oninput = e => {
        const el = e.target.closest('[data-cc-in]');
        if (!el) return;
        el.value = el.value.replace(/[^\d]/g, '').slice(0, 4);
        const [c, n] = el.dataset.ccIn.split(':');
        set(c, +n, parseInt(el.value, 10) || 0);
    };
    host.onfocusin = e => { if (e.target.matches('[data-cc-in]')) e.target.select(); };
    host.onkeydown = e => {
        const el = e.target.closest('[data-cc-in]');
        if (!el) return;
        const all = inputs();
        const i = all.indexOf(el);
        const [c, n] = el.dataset.ccIn.split(':');
        if (e.key === 'Enter' || e.key === 'ArrowDown') {
            e.preventDefault();
            if (all[i + 1]) all[i + 1].focus();
            else if (e.key === 'Enter' && typeof opts.onDone === 'function') opts.onDone();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (all[i - 1]) all[i - 1].focus();
        } else if (e.key === '+' || e.key === '-') {
            e.preventDefault();
            set(c, +n, (maps[c][n] || 0) + (e.key === '+' ? 1 : -1));
            el.value = maps[c][n] || '';
        }
    };
    paint();
}


/* ===== ផ្ទាំងលោតក្នុងទំព័រ៖ Esc បិទផ្ទាំងខាងលើបំផុត =====
   ផ្ទាំងដាក់ data-modal="ឈ្មោះអនុគមន៍បិទ" (ឧ. data-modal="closeReceive") និង onclick នៅផ្ទៃខាងក្រោយ
   ប្រអប់រួម (posDialogHost / bmsDialogOpen) មានការគ្រប់គ្រង Esc ផ្ទាល់ខ្លួនរួចហើយ */
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const open = [...document.querySelectorAll('[data-modal]')].filter(m => getComputedStyle(m).display !== 'none');
    const top = open[open.length - 1];
    if (top && typeof window[top.dataset.modal] === 'function') {
        e.preventDefault();
        e.stopImmediatePropagation();
        window[top.dataset.modal]();
    }
});
