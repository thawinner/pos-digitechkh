# DIGITECHKH - Project Guidelines & Mandatory Standards

ឯកសារនេះជាគោលការណ៍ណែនាំ និងស្តង់ដារកាតព្វកិច្ចដែលត្រូវអនុវត្តលើ**គ្រប់ទំព័រទាំងអស់ (ALL Pages)** នៃគម្រោង DIGITECHKH ដោយគ្មានការលើកលែង។

---

## 1. គោលការណ៍ភាសាខ្មែរសុទ្ធសាធ និងការប្រើប្រាស់លេខអង់គ្លេស (100% Strict Khmer Language & English Numerals)
* អត្ថបទទាំងអស់លើ UI ទាំងមូល (ចំណងជើង, ស្លាក, ប៊ូតុង, តារាង, ដំណឹង Toast, Dialog, Placeholder) និងរាល់ការពន្យល់ឆ្លើយតបជាមួយអ្នកប្រើប្រាស់ ត្រូវតែជា**ភាសាខ្មែរសុទ្ធសាធ 100%**។
* ហាមដាច់ខាតការសរសេរពាក្យអង់គ្លេសលាយឡំ ឬពាក្យក្នុងរង្វង់ក្រចកជាភាសាអង់គ្លេស។
* **ស្តង់ដារលេខ (English Numerals Standard)**៖ លេខទាំងអស់ក្នុងប្រព័ន្ធទាំងមូល (កាលបរិច្ឆេទ, តម្លៃទឹកប្រាក់, លេខរៀង, លេខកូដឯកសារ, លេខទូរស័ព្ទ, ភាគរយ, ចំនួនស្តុក) ត្រូវតែប្រើប្រាស់លេខអង់គ្លេស/អារ៉ាប់ (`0, 1, 2, 3, 4, 5, 6, 7, 8, 9`) ជានិច្ច មិនប្រើប្រាស់លេខខ្មែរឡើយ។

---

## 2. ស្តង់ដារកម្ពស់ក្បាលទំព័រ និងក្បាល Sidebar ស្មើគ្នាពិតប្រាកដ (Header Height Alignment)
* ទាំងក្បាល Sidebar ម៉ាកយីហោ (`div`) និង Content Header ខាងស្តាំ (`header`) ត្រូវកំណត់កម្ពស់ថេរ **`h-[72px] px-6 flex-shrink-0`** ដូចគ្នា 100% ដើម្បីឱ្យបន្ទាត់បាត (Border divider line) រត់ត្រង់ជួរផ្ដេកតែមួយឥតខ្ចោះ (Pixel-perfect seamless line)។
* **Sidebar Brand Container**:
  ```html
  <div class="h-[72px] px-6 flex items-center gap-3 border-b border-white/10 flex-shrink-0">
      <div class="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center p-1 shadow-sm overflow-hidden flex-shrink-0">
          <img src="[path_to_assets]/logo-mark-transparent.png" alt="DIGITECHKH" class="w-full h-full object-contain">
      </div>
      <h1 class="text-xl font-semibold tracking-wider whitespace-nowrap">DIGITECHKH</h1>
  </div>
  ```
* **Content Top Header**:
  ```html
  <header class="bg-white px-6 h-[72px] flex justify-between items-center shadow-sm z-10 flex-shrink-0">
      <div>
          <h2 class="text-xl font-semibold text-gray-800 leading-tight">ចំណងជើងទំព័រ</h2>
          <p class="text-xs font-normal text-gray-500 mt-0.5">ការពិពណ៌នាសង្ខេបអំពីទំព័រ</p>
      </div>
      ...
  </header>
  ```

---

## 3. ស្តង់ដារតម្រងកាលបរិច្ឆេទរួម (Unified Date Range Picker Standard)
* រាល់ទំព័រទាំងអស់ដែលមានតម្រងកាលបរិច្ឆេទ (ដូចជា វិក្កយបត្រ, សម្រង់តម្លៃ, ផ្ទាំងគ្រប់គ្រង Dashboard, របាយការណ៍, លទ្ធកម្ម, ស្តុកទំនិញ) **ត្រូវតែប្រើប្រាស់ Component ដូចគ្នាបេះបិទ 100% តាមគំរូទំព័រវិក្កយបត្រ (`invoice.html`)**៖
  1. **ប៊ូតុងចុចបើក (Trigger Button)**:
     * ស្លាកអត្ថបទមុខ៖ `<span class="text-xs text-slate-400 hidden sm:inline">កាលបរិច្ឆេទ:</span>`
     * ប៊ូតុង Trigger៖ `h-9 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all focus:outline-none cursor-pointer`
     * រូបតំណាងប្រតិទិន៖ `<i class="fas fa-calendar-days text-primary text-xs"></i>`
     * អត្ថបទកាលបរិច្ឆេទសកម្ម៖ `<span id="selectedDateLabel" class="font-medium text-slate-800">1 កញ្ញា - 30 កញ្ញា</span>`
     * សញ្ញាព្រួញបង្វិល៖ `<i class="fas fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200 ml-0.5" id="datePickerChevron"></i>`
  2. **ផ្ទាំងទម្លាក់ចុះពីរជួរឈរ (Popover `w-[480px]`)**:
     * **ជួរឈរខាងឆ្វេង (Presets 10 ជម្រើសរហ័ស)**៖ ថ្ងៃនេះ, ម្សិលមិញ, សប្តាហ៍នេះ, សប្តាហ៍មុន, ខែនេះ (Default Active `bg-[#0f2b5c] text-white`), ខែមុន, ឆ្នាំនេះ, 7 ថ្ងៃចុងក្រោយ, 14 ថ្ងៃចុងក្រោយ, 30 ថ្ងៃចុងក្រោយ។
     * **ជួរឈរខាងស្តាំ (Dynamic Calendar Grid)**៖
       - ក្បាលខែឆ្នាំ មានប៊ូតុងរំកិលខែ `< >`
       - ឈ្មោះថ្ងៃជាភាសាខ្មែរ ចាប់ផ្តើមពីថ្ងៃចន្ទ (`ច`, `អ`, `ព`, `ព្រ`, `សុ`, `ស`, `អា`)
       - ក្រឡាប្រតិទិនគណនាស្វ័យប្រវត្តិ អាចចុចជ្រើសរើសចន្លោះកាលបរិច្ឆេទ (Range Selection) មានរង្វង់មូល Navy `#0f2b5c` នៅថ្ងៃចាប់ផ្តើម/បញ្ចប់ និងផ្ទៃពណ៌ `bg-slate-100` នៅចន្លោះកណ្តាល។
     * **ផ្នែកខាងក្រោម (Footer Bar)**៖
       - Capsule Pill Tag បង្ហាញកាលបរិច្ឆេទដែលបានរើសជាមួយប៊ូតុង `x` សម្អាត
       - ប៊ូតុង «បោះបង់» និងប៊ូតុង «ជ្រើសរើស» (`bg-[#0f2b5c] text-white`)
  3. **Script ដំណើរការ**:
     - ប្រើប្រាស់អនុគមន៍ `toggleDatePicker()`, `changeCalendarMonth()`, `renderCalendarGrid()`, `handleDateClick()`, `selectPreset()`, `clearRangeTag()`, `applyDateRange()` ដូចគ្នាបេះបិទ។

---

## 4. រចនាសម្ព័ន្ធថតតាមលំដាប់លំហូរការងារ និងម៉ូឌុល (Ordered Workflow & Modular Feature Standard)
* រាល់ថតទំព័រក្នុង `frontend/src/pages/` ត្រូវបានរៀបចំតាមលេខរៀងលំដាប់លំហូរនៃម៉ឺនុយចំហៀង (Sidebar Navigation Flow)៖
  1. `1-login/` (`login.html`)
  2. `2-home/` (`dashboard.html`, `approvals.html`)
  3. `3-sales/` (`1-invoice/`, `2-quote/`, `3-customer/`, `4-payment/`)
  4. `4-buy/` (`1-bills/`, `2-suppliers/`, `3-disbursement/`)
  5. `5-stock/` (`1-balance/`, `2-catalog/`, `3-movement/`)
  6. `6-reports/` (`1-overview/`, `2-sales/`, `3-purchases/`, `4-stock/`, `reports.html`)
  7. `7-settings/` (`1-company/`, `2-users/`, `3-tax/`, `4-notifications/`, `5-system/`, `settings.html`)
* រាល់មុខងារកូននីមួយៗក្នុងម៉ូឌុលត្រូវមានថតរងដាច់ដោយឡែក (Subfolder per child feature) ដោយមានលេខរៀងសម្គាល់លំដាប់មុខងារ។
* ថតរងនីមួយៗត្រូវរៀបចំឯកសារជា 4 ទំព័រគោល៖
  1. `[feature].html` (ឧ. `invoice.html`, `quote.html`)៖ ទំព័រតារាងបញ្ជីទិន្នន័យមេ (List View)
  2. `create-[feature].html` (ឧ. `create-invoice.html`, `create-quote.html`)៖ ទំព័រទម្រង់បង្កើតទិន្នន័យថ្មី (Create Form Page)
  3. `edit-[feature].html` (ឧ. `edit-invoice.html`, `edit-quote.html`)៖ ទំព័រទម្រង់កែប្រែទិន្នន័យ (Edit Form Page)
  4. `view-[feature].html` (ឧ. `view-invoice.html`, `view-quote.html`)៖ ទំព័របង្ហាញព័ត៌មានលម្អិតពេញលេញ (Full View Detail Page)
* ហាមដាច់ខាតការដាក់ឯកសារលាយឡំគ្នាក្នុង Root Folder ដោយគ្មានការបែងចែកថតរង ដើម្បីភាពស្អាត និងងាយស្រួលគ្រប់គ្រង (Clean & Modular Architecture)។

---

## 5. គោលការណ៍ទម្រង់បង្កើត កែប្រែ និងបង្ហាញព័ត៌មានលម្អិត (Dedicated Pages for Create, Edit & View Detail)
* **ហាមដាច់ខាតការប្រើប្រាស់ Modal Dialog Pop-up** សម្រាប់ទម្រង់បង្កើតថ្មី (Add/Create), ទម្រង់កែប្រែ (Edit), ឬការបង្ហាញព័ត៌មានលម្អិត (View Detail)។
* រាល់ទម្រង់ Add/Create, Edit និង View Detail ត្រូវតែជា**ទំព័រពេញលេញដាច់ដោយឡែក (Dedicated Full Page)** ដែលមានប៊ូតុងត្រឡប់ក្រោយស្តង់ដាររួម ប្លង់ទម្រង់ទូលាយកម្រិតសហគ្រាស (Enterprise Layout), ប៊ូតុងសកម្មភាពរហ័ស (ដូចជា កែប្រែ, បោះពុម្ព, បម្លែង)។
* **ស្តង់ដារប៊ូតុងត្រឡប់ក្រោយ (Unified Back Button Standard)**៖
  គ្រប់ទំព័ររង (ដូចជា `create-[feature].html`, `edit-[feature].html`, `view-[feature].html`) ត្រូវតែប្រើប្រាស់ប៊ូតុងត្រឡប់ក្រោយជាប្រអប់មូលកោងមានរូបសញ្ញាព្រួញតែមួយគត់ (Icon-only rounded-square button) ដូចគ្នាបេះបិទ 100%៖
  ```html
  <a href="[feature].html" 
     class="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition border border-slate-200/70" 
     title="ត្រឡប់ទៅ...">
      <i class="fas fa-arrow-left text-sm"></i>
  </a>
  ```
  ហាមដាច់ខាតការសរសេរអក្សរវែងក្នុងប៊ូតុង ឬការប្រើប្រាស់របារខណ្ឌ (`divider`) ដើម្បីធានាបាននូវភាពស្អាតស្អំ ស្រាលភ្នែក និងស៊ីសង្វាក់គ្នាជាសកល។

---

## 6. ហាមដាច់ខាតការប្រើប្រាស់ Browser Native UI (Default Elements)
* **ហាមប្រើ Native `<select>`**៖ ត្រូវប្រើ Custom Dropdown Component ជានិច្ច (មាន Avatar, Checkmark, Hover Effect, និង Stacking Context `z-50`)។
* **ហាមប្រើ `window.alert()`**៖ ត្រូវប្រើ `showToast(message, type)` ជានិច្ច (អណ្តែតជ្រុងលើស្តាំ គែមស្រាល ចលនា Slide-in)។
* **ហាមប្រើ `window.confirm()`**៖ ត្រូវប្រើ `showCustomConfirm(options)` ជានិច្ច (Modal សួរបញ្ជាក់កណ្តាលអេក្រង់ ស្អាតតាមប្រព័ន្ធ)។

---

## 7. លាក់របាររំកិលទាំងអស់ជាសកល (Globally Hidden Scrollbars)
* រាល់ទំព័រទាំងអស់ត្រូវលាក់របាររំកិលទាំងផ្ដេក និងបញ្ឈរ (Horizontal & Vertical Scrollbars) តាមរយៈ CSS ក្នុង `frontend/src/styles/custom.css` ដោយនៅតែរក្សាដំណើរការរំកិលបានយ៉ាងរលូន 100%។

---

## 8. ប្លង់ទំព័រពេញទទឹងអេក្រង់ (Full Width Layout)
* គ្រប់ទំព័រទាំងអស់ រាល់មាតិកាក្នុង `<main>` ត្រូវតែប្រើប្រាស់ `w-full` ដើម្បីលាតសន្ធឹងពេញផ្ទៃអេក្រង់ 100% ហាមដាច់ខាតការប្រើប្រាស់ `max-w-* mx-auto` (ដូចជា `max-w-5xl` ឬ `max-w-7xl`)។

---

## 9. ជួរឈរសកម្មភាពក្នុងតារាង (Table Row Actions)
* ជួរឈរសកម្មភាពក្នុងតារាងទាំងអស់ ត្រូវប្រើប្រាស់ប៊ូតុង **`⋮`** តែមួយគត់ជាមួយ Floating Action Dropdown Menu (`#rowActionDropdown`) ដែលមានរចនាបថ Capsule Header, រូបតំណាងក្នុងប្រអប់មូលតូច, Hover Effect ស្រស់ស្អាត, និងតំណភ្ជាប់ទៅកាន់ទំព័រ `edit-[feature].html?id=...`។

---

## 10. គោលការណ៍តម្លៃឌីណាមិកតាមអតិថិជន និងអ្នកផ្គត់ផ្គង់ (Dynamic Customer & Supplier Pricing)
* មុខទំនិញ ឬផលិតផលនីមួយៗមិនមានតម្លៃថេរបរិបូរណ៍តែមួយមុខនោះឡើយ។ តម្លៃលក់ និងថ្លៃដើមទិញ ត្រូវប្រែប្រួល និងអាស្រ័យលើ៖
  1. **ផ្នែកលក់ (អតិថិជន)**៖ តម្លៃលក់អាស្រ័យលើកម្រិតអតិថិជន (អតិថិជនទូទៅ/រាយ, អតិថិជនដុំ, តំណាងចែកចាយ), តម្លៃតាមកិច្ចសន្យា ឬប្រវត្តិតម្លៃដែលធ្លាប់លក់ជូនអតិថិជននោះពីមុន ព្រមទាំងអនុញ្ញាតឱ្យកែសម្រួលតម្លៃឯកតាជាក់ស្តែងលើបន្ទាត់វិក្កយបត្រ ឬសម្រង់តម្លៃ។
  2. **ផ្នែកទិញ (អ្នកផ្គត់ផ្គង់)**៖ ថ្លៃដើមទិញអាស្រ័យលើអ្នកផ្គត់ផ្គង់នីមួយៗ (អ្នកផ្គត់ផ្គង់ផ្សេងគ្នាផ្តល់ថ្លៃទិញខុសគ្នា) និងប្រវត្តិនៃការបញ្ជាទិញចូលជាក់ស្តែង ដែលជាមូលដ្ឋានក្នុងការគណនាថ្លៃដើមមធ្យមនៃស្តុក។

---

## 11. ស្តង់ដារពុម្ពអក្សរ កម្រាស់ និងពណ៌អក្សរ (Typography, Font Weight & Color Standard)
* **ពុម្ពអក្សររួម (Global Font Family)**៖ ប្រើប្រាស់ **`Kantumruy Pro`** ជាអក្សរគោលទូទាំងគម្រោង (Global Default Font)។
* **ទំហំអក្សរគោល (Base Font Size)**៖ កំណត់ទំហំស្តង់ដារ **`15px` / `16px`** សម្រាប់តួអក្សរទូទៅ, ប្រអប់បញ្ចូល (Inputs), ប៊ូតុង និងទិន្នន័យតារាង។
* **កម្រាស់អក្សរសម្រាប់ចំណងជើងធំៗ (Titles & Headings)**៖ ប្រើប្រាស់កម្រាស់ **Semi-Bold (`font-semibold` / weight 600)** សម្រាប់ចំណងជើងទំព័រ, ចំណងជើងកាត/ផ្នែក, ក្បាលតារាង (`<th>`)។
* **កម្រាស់អក្សរសម្រាប់បញ្ជីទិន្នន័យ និងឈ្មោះក្នុងតារាង (Listing Names & Table Rows)**៖ ប្រើប្រាស់កម្រាស់ **Medium (`font-medium` / weight 500)** សម្រាប់ឈ្មោះអតិថិជន (ឧ. ហេង វិច្ឆិកា...), ឈ្មោះអ្នកផ្គត់ផ្គង់, ឈ្មោះមុខទំនិញ, ជួរទិន្នន័យក្នុងតារាង (`<td>`), បញ្ជីធាតុទិន្នន័យ (List Items), ម៉ឺនុយរុករក (Navigation items), និងផ្លាកព័ត៌មាន (Badges)។
* **កម្រិតពណ៌អក្សរក្នុងតារាង (Softened Text Color Standard)**៖ ជៀសវាងការប្រើពណ៌ខ្មៅដិតខ្លាំង (`text-slate-900` / `text-slate-800`) ក្នុងតារាងបញ្ជីទិន្នន័យ។ ត្រូវប្រើប្រាស់ **`text-slate-700` (`#334155`)** ឬ `text-slate-600` ដើម្បីឱ្យអក្សរខ្មែរមើលទៅស្រាលភ្នែក ស្អាត ស្រទន់ និងមានវិជ្ជាជីវៈកម្រិតខ្ពស់។

---

## 12. ស្តង់ដារបោះពុម្ពឯកសារផ្លូវការ (Official Document Printing Standard)
* រាល់ឯកសារផ្លូវការទាំងអស់ (វិក្កយបត្រលក់, សម្រង់តម្លៃ, វិក្កយបត្របញ្ជាទិញ, បង្កាន់ដៃទទួលប្រាក់, ប័ណ្ណចំណាយទូទាត់, ប័ណ្ណចលនាស្តុក) ត្រូវតែទ្រទ្រង់ការបោះពុម្ពកម្រិតសហគ្រាស (Enterprise A4 Print) តាមរយៈ `@media print` ក្នុង `custom.css`៖
  1. **លាក់ UI មិនពាក់ព័ន្ធ**៖ ហាមដាច់ខាតការបង្ហាញរបារចំហៀង Sidebar, ក្បាលទំព័រ Header, ប៊ូតុងរុករក, ប៊ូតុងកែប្រែ, និងប្រអប់ដំណឹងផ្សេងៗលើក្រដាសបោះពុម្ព។
  2. **ប្លង់សន្លឹក A4 ស្អាតបរិសុទ្ធ**៖ សន្លឹកឯកសារត្រូវលាតពេញទទឹងក្រដាស 100% ដោយគ្មានគែមប្រអប់គេហទំព័រ (No Web Borders/Shadows) គ្មានផ្ទៃប្រផេះ និងមានគម្លាតស្មើល្អ។
  3. **ការពារការដាច់ក្រដាសខុសជួរ**៖ ជួរតារាង (`tr`), ផ្នែកសង្ខេបទឹកប្រាក់ និងផ្នែកចុះហត្ថលេខា ត្រូវកំណត់ `page-break-inside: avoid` ដើម្បីការពារការដាច់កាត់ទំព័រពាក់កណ្តាល។
  4. **បាតកថាបោះពុម្ពផ្លូវការ**៖ ត្រូវមានបាតកថាបោះពុម្ព (`print-footer`) នៅផ្នែកខាងក្រោមនៃឯកសារ។

---

## 13. ស្តង់ដារតារាង និងការសង្ខេបហិរញ្ញវត្ថុ (Document Table & Financial Summary Standard)
* **តារាងមុខទំនិញ**៖ មិនប្រើប្រាស់ជួរឈរ «បញ្ចុះតម្លៃ» ក្នុងតារាងមុខទំនិញឡើយ ដើម្បីកាត់បន្ថយភាពរញ៉េរញ៉ៃ និងរក្សាភាពទូលាយនៃជួរឈរបរិយាយ និងតម្លៃ។
* **ផ្នែកសង្ខេបហិរញ្ញវត្ថុ**៖ ត្រូវរៀបចំតាមលំដាប់ស្តង់ដារ៖
  1. សរុបរងមុខទំនិញ
  2. **ចូលរួមមុន** (Down Payment)
  3. **ការបញ្ចុះតម្លៃពិសេស** (Special Discount)
  4. អាករលើតម្លៃបន្ថែម (អតប 10%)
  5. ទឹកប្រាក់សរុបចុងក្រោយ




