#!/usr/bin/env python3
"""Generate deck.html (1920x1080 slides, Khmer) from the slide list below. Print to PDF with Chrome."""
import html, os
HERE = os.path.dirname(os.path.abspath(__file__))

CSS = """
@page{size:1920px 1080px;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Kantumruy Pro','Khmer Sangam MN',sans-serif;color:#1c2321;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.s{width:1920px;height:1080px;page-break-after:always;position:relative;overflow:hidden;padding:100px 112px 120px;display:flex;flex-direction:column;background:#f7f8f6}
.dark{background:#0B2B22;color:#eef3f0}
.eyebrow{font-size:28px;font-weight:600;color:#047857;margin-bottom:14px}
.dark .eyebrow{color:#6ee7b7}
h1{font-size:104px;font-weight:700;line-height:1.35}
h2{font-size:64px;font-weight:700;line-height:1.35;margin-bottom:40px}
h3{font-size:36px;font-weight:600;margin-bottom:10px;line-height:1.4}
p,li{font-size:30px;line-height:1.55;color:#4a5551}
.dark p,.dark li{color:#bfd8cf}
.grid{display:grid;gap:28px}.c2{grid-template-columns:repeat(2,1fr)}.c3{grid-template-columns:repeat(3,1fr)}.c4{grid-template-columns:repeat(4,1fr)}
.card{background:#fff;border:1px solid #dfe5e2;border-radius:20px;padding:36px}
.dark .card{background:#12382d;border-color:#245a49}.dark .card h3{color:#fff}
.num{font-size:76px;font-weight:700;color:#047857;line-height:1.2}
.foot{position:absolute;left:112px;right:112px;bottom:44px;display:flex;justify-content:space-between;font-size:24px;color:#8a948f}
.dark .foot{color:#7fa597}
ul{list-style:none}li{padding-left:34px;position:relative;margin-bottom:14px}
li:before{content:"";position:absolute;left:0;top:19px;width:14px;height:14px;border-radius:50%;background:#047857}
.dark li:before{background:#6ee7b7}
.pill{display:inline-block;background:#e4f3ec;color:#047857;border-radius:999px;padding:4px 24px;font-size:26px;font-weight:600;margin-bottom:16px}
.split{display:flex;gap:48px;flex:1;align-items:center}
.txt{flex:1}
.shot{border-radius:18px;border:1px solid #cfd8d4;box-shadow:0 18px 50px rgba(11,43,34,.18);overflow:hidden;background:#fff}
.shot img{display:block;width:100%}
.dark .shot{border-color:#245a49;box-shadow:0 18px 50px rgba(0,0,0,.4)}
.cap{font-size:24px;color:#8a948f;margin-top:14px}
table{border-collapse:collapse;width:100%}
th,td{font-size:28px;padding:16px 22px;text-align:center;border-bottom:1px solid #dfe5e2;color:#4a5551}
th{background:#0B2B22;color:#fff;font-weight:600}
td:first-child,th:first-child{text-align:left}
td.y{color:#047857;font-weight:700}
.crop{position:relative;overflow:hidden;width:900px;aspect-ratio:1592/1080}
.full{width:1040px}
.crop img{position:absolute;left:-20.6%;top:0;width:120.6%}
.en{font-family:'Kantumruy Pro',sans-serif}
"""


slides = []
def add(cls, body): slides.append((cls, body))
def foot(label="DIGITECHKH POS"): return f'<div class="foot"><span>{label}</span><span>{{N}}</span></div>'
def lis(items): return "<ul>" + "".join(f"<li>{i}</li>" for i in items) + "</ul>"
def shot(name, crop=True):
    if crop: return f'<div class="shot crop"><img src="shots/{name}.png"></div>'
    return f'<div class="shot full"><img src="shots/{name}.png"></div>'
NOTE = "ទិន្នន័យគំរូ ពីប្រព័ន្ធពិតប្រាកដ"
def split(eyebrow, title, items, img, dark=False, crop=True, note=NOTE):
    return (("dark " if dark else ""),
        f'<div class="eyebrow">{eyebrow}</div><h2>{title}</h2><div class="split"><div class="txt">{lis(items)}</div>'
        f'<div style="flex:none">{shot(img, crop)}<div class="cap">{note}</div></div></div>{foot()}')

# 1 cover
add("dark", f'''<div style="display:flex;align-items:center;gap:64px;flex:1">
<div style="flex:1"><img src="logo-mark-transparent.png" style="width:110px;height:110px;background:#fff;border-radius:24px;padding:12px;margin-bottom:48px">
<div class="eyebrow">ប្រព័ន្ធគិតលុយសម្រាប់ហាងលក់រាយ</div><h1 style="font-size:76px">DIGITECHKH<br>POS System</h1>
<p style="margin-top:32px;font-size:34px">លក់លឿន គ្រប់គ្រង Stock ច្បាស់ លុយមិនបាត់បង់</p></div>
<div style="width:880px;flex:none">{shot("terminal", False).replace("full","")}</div></div>
<div class="foot"><span>ការបង្ហាញទូទៅ · Overview</span><span>អភិវឌ្ឍដោយ DIGITECHKH</span></div>''')

# 2 problems
add("", f'''<div class="eyebrow">បញ្ហាដែលយើងដោះស្រាយ</div><h2>ម្ចាស់ហាងជួបបញ្ហាទាំងនេះរាល់ថ្ងៃ</h2><div class="grid c3">
<div class="card"><h3>លុយក្នុងថតមិនត្រូវ</h3><p>មិនដឹងថាអ្នកណាខ្វះ ឬលើស នៅពេលបិទ Shift</p></div>
<div class="card"><h3>Stock មិនច្បាស់</h3><p>ទំនិញអស់មិនដឹងខ្លួន ឬបាត់បង់ដោយគ្មានមូលហេតុ</p></div>
<div class="card"><h3>គ្មានការត្រួតពិនិត្យ</h3><p>Void វិក្កយបត្រ និងបញ្ចុះតម្លៃ ដោយគ្មានអ្នកអនុម័ត</p></div>
<div class="card"><h3>មិនដឹងប្រាក់ចំណេញ</h3><p>ដឹងតែចំនួនលក់ តែមិនដឹងចំណេញពិតប្រាកដ</p></div>
<div class="card"><h3>លុយពីរប្រភេទ</h3><p>ដុល្លារ និងរៀល ត្រូវគណនាអាប់ដូរដោយដៃ</p></div>
<div class="card"><h3>Report យឺត</h3><p>ត្រូវរង់ចាំចុងខែ ទើបដឹងស្ថានភាពហាង</p></div></div>
<p style="margin-top:44px;font-size:34px;color:#047857;font-weight:600">DIGITECHKH POS ដោះស្រាយទាំងអស់នេះ ក្នុងប្រព័ន្ធតែមួយ</p>{foot()}''')

# 3 roles
add("dark", f'''<div class="eyebrow">ដំណោះស្រាយ</div><h2>មួយប្រព័ន្ធ សម្រាប់ 3 តួនាទី</h2><div class="grid c3">
<div class="card"><div class="pill" style="background:#0B2B22;color:#6ee7b7">Cashier</div><h3>លក់ និងទទួលលុយ</h3><p>អេក្រង់លក់ងាយស្រួល ទទួលសាច់ប្រាក់ និង KHQR បើក Shift និងបិទ Shift</p></div>
<div class="card"><div class="pill" style="background:#0B2B22;color:#6ee7b7">Manager</div><h3>អនុម័ត និងត្រួតពិនិត្យ</h3><p>អនុម័ត Void បញ្ចុះតម្លៃ ត្រួតពិនិត្យលុយ Stock និងកាលវិភាគ</p></div>
<div class="card"><div class="pill" style="background:#0B2B22;color:#6ee7b7">Owner</div><h3>ឃើញចំណេញ គ្រប់គ្រងអ្វីៗ</h3><p>ប្រាក់ចំណេញ តម្លៃ Stock បុគ្គលិក តម្លៃលក់ និង Audit Log</p></div></div>
<p style="margin-top:48px;font-size:32px">ម្នាក់ៗឃើញតែអ្វីដែលខ្លួនត្រូវការ Owner ចូលមើលតួនាទីផ្សេងបានដោយចុចតែម្តង</p>{foot()}''')

# 4 terminal
add(*split("Cashier · POS Terminal", "លក់បានលឿន ក្នុងប៉ុន្មានប៉ះ",
 ["ស្កេន Barcode ឬប៉ះរូបផលិតផល", "ទំនិញលក់ញឹកញាប់ នៅខាងលើ", "ស្លាក «ជិតអស់» ប្រាប់មុនអស់ Stock", "Hold ការលក់ ដើម្បីបម្រើអតិថិជនបន្ទាប់", "គ្រាប់ចុចរហ័ស F2 F8 លើប៊ូតុង"], "terminal", crop=False))

# 5 payment
add(*split("Cashier · Payment", "ទទួលលុយបានគ្រប់ប្រភេទ",
 ["សាច់ប្រាក់ដុល្លារ និងរៀល", "អាប់ដូររៀល បង្គត់ជិត 100 រៀល", "KHQR ជ្រើសគណនីធនាគារ ABA ACLEDA ...", "បង់ចម្រុះ៖ សាច់ប្រាក់ និង KHQR ក្នុងវិក្កយបត្រតែមួយ", "ប៊ូតុងបង្ហាញឈ្មោះធនាគារ មុនចុច"], "paybank", crop=False))

# 6 KHQR + customer display
add("dark", f'''<div class="eyebrow">KHQR · Customer Display</div><h2>អតិថិជនស្កេន KHQR ចូលគណនីហាងផ្ទាល់</h2>
<div class="grid c2" style="gap:40px;flex:1;align-items:start">
<div>{shot("khqr", False).replace("full","")}<div class="cap">អេក្រង់ Cashier · កូដ KHQR តាមស្តង់ដារបាគង</div></div>
<div>{shot("cfdkhqr", False).replace("full","")}<div class="cap">Customer Display · អតិថិជនស្កេនពីកម្មវិធីធនាគារណាក៏បាន</div></div></div>
<div class="grid c3" style="margin-top:8px"><div class="card" style="padding:26px 30px"><h3>កូដមានសុពលភាព 5 នាទី</h3><p>ផុតកំណត់ ចុចបង្កើតកូដថ្មី</p></div>
<div class="card" style="padding:26px 30px"><h3>ប្តូរធនាគារបាន</h3><p>អតិថិជនចង់បង់ចូលគណនីផ្សេង</p></div>
<div class="card" style="padding:26px 30px"><h3>Cashier បញ្ជាក់</h3><p>ចុច «បានទទួលប្រាក់» ពេលឃើញការជូនដំណឹងពីធនាគារ</p></div></div>{foot()}''')

# 6 shift flow
add("", f'''<div class="eyebrow">Cashier · Shift</div><h2>លុយក្នុងថតត្រូវជានិច្ច</h2>
<div class="grid c4"><div class="card"><div class="num">1</div><h3>Open Shift</h3><p>រាប់លុយចាប់ផ្តើម (Float) ហើយ Manager បញ្ជាក់</p></div>
<div class="card"><div class="num">2</div><h3>លក់</h3><p>រាល់ការលក់កត់ត្រាតាម Shift និងបញ្ជរ</p></div>
<div class="card"><div class="num">3</div><h3>Cash Drop</h3><p>ផ្ទេរលុយលើសចូលទូដែក កុំឲ្យថតមានលុយច្រើនពេក</p></div>
<div class="card"><div class="num">4</div><h3>Close Shift</h3><p>រាប់លុយដោយមិនមើលចំនួនរំពឹងទុក រួចបោះពុម្ព Z-Report</p></div></div>
<div class="grid c3" style="margin-top:36px"><div class="card"><h3>មួយថត មួយអ្នក</h3><p>មួយបញ្ជរ មាន Cashier តែម្នាក់ក្នុងមួយពេល</p></div>
<div class="card"><h3>ដុល្លារ និងរៀល</h3><p>រាប់ដោយឡែកពីគ្នា ហើយប្រៀបធៀបជាមួយចំនួនរំពឹងទុក</p></div>
<div class="card"><h3>ដឹងភ្លាមៗ</h3><p>ខុសគ្នាលើសកំណត់ ត្រូវមានកំណត់ចំណាំពី Manager</p></div></div>{foot()}''')

# 7 close shift
add(*split("Cashier · Close Shift", "Blind Count ស្មោះត្រង់ ដឹងភាពខុសគ្នាភ្លាមៗ",
 ["4 ជំហាន៖ ព័ត៌មាន រាប់ប្រាក់ ភាពខុសគ្នា បញ្ជាក់", "មិនបង្ហាញចំនួនរំពឹងទុក មុនរាប់លុយ", "រាប់ដុល្លារ និងរៀលដោយឡែក", "បោះពុម្ព Z-Report ទំហំ A4"], "closeshift"))

# 8 receipts
add(*split("Cashier · Receipts", "រកមើល Refund និង Void វិក្កយបត្របានភ្លាម",
 ["វិក្កយបត្រទាំងអស់ក្នុង Shift របស់ខ្លួន", "ស្នើ Void ឬ Refund ត្រូវមានមូលហេតុ", "Manager អនុម័តភ្លាមៗ ឬទុកក្នុងជួររង់ចាំ", "Stock ធ្វើបច្ចុប្បន្នភាពតាមការអនុម័ត"], "receipts"))

# 9 approvals
add(*split("Manager · Approvals", "សកម្មភាពសំខាន់ ត្រូវមានអ្នកអនុម័ត",
 ["បញ្ចុះតម្លៃលើសកំណត់ ត្រូវបញ្ចូល PIN 6 ខ្ទង់", "Manager មិនអាចអនុម័តការលក់ខ្លួនឯង", "រាល់ការអនុម័តមាន អ្នកអនុម័ត ពេល និងមូលហេតុ", "មិនអាចលុបកំណត់ត្រាបានទេ"], "approvals", dark=True))

# 10 manager dashboard
add(*split("Manager · Dashboard", "ដឹងថាត្រូវធ្វើអ្វី ពេលចូលមក",
 ["ការងាររង់ចាំអនុម័ត តាមលំដាប់ប្រញាប់", "ចំណូលថ្ងៃនេះ ប្រៀបធៀបម្សិលមិញ", "ស្ថានភាពបញ្ជរនីមួយៗ និង Cashier", "ចំណូលបំបែក សាច់ប្រាក់ និង KHQR តាមធនាគារ"], "mgr"))

# 11 roster
add(*split("Manager · Roster", "រៀបចំវេនបុគ្គលិក មិនជាន់គ្នា",
 ["Shift ព្រឹក រសៀល យប់", "ថ្ងៃឈប់ Manager ជំនួសអូតូ", "បញ្ជរមួយ មាន Cashier តែម្នាក់", "Cashier ជ្រើសបញ្ជរទំនេរពេល Open Shift"], "roster"))

# 12 cash
add(*split("Manager · Cash", "តាមដានលុយចេញចូលច្បាស់លាស់",
 ["ទូដែក៖ ដាក់ ដក និងទទួល Cash Drop", "Cash Drop ដែលមិនទាន់បញ្ជាក់ មិនឲ្យ Close Shift", "មូលហេតុ និងចំនួនជាដុល្លារ និងរៀល"], "cash", dark=True))

# 13 stock
add(*split("Stock", "Stock គណនាដោយស្វ័យប្រវត្តិ",
 ["ចំនួន Stock មិនត្រូវបានកែដោយដៃ", "គណនាពី Stock ដើម ការលក់ និងចលនា", "Stock In កែតម្រូវ និងរាប់ Stock មានកំណត់ត្រា", "Cashier ឃើញតែ «អស់» ឬ «ជិតអស់»"], "stock"))

# 14 sales report
add(*split("Manager · Sales Report", "Report ការលក់ តាមថ្ងៃ ម៉ោង និងផលិតផល",
 ["លក់សុទ្ធ វិក្កយបត្រ និងមធ្យមក្នុងមួយវិក្កយបត្រ", "មើលតាម Cashier តាមប្រភេទទំនិញ និងវិធីទូទាត់", "ទំនិញលក់ដាច់", "បោះពុម្ពបាន"], "sales", dark=True))

# 15 owner dashboard
add(*split("Owner · Dashboard", "ដឹងប្រាក់ចំណេញពិតប្រាកដ",
 ["ចំណូល ប្រាក់ចំណេញ និងអត្រាចំណេញ", "តម្លៃ Stock សរុប តាមតម្លៃដើម", "ការខាតបង់ Stock ខែនេះ", "ខុសគ្នាសាច់ប្រាក់ ពី Shift ដែលបានរាប់", "តម្លៃដើម មានតែ Owner មើលឃើញ"], "admin"))

# 16 profit report
add(*split("Owner · Profit Report", "ចំណេញរាល់ថ្ងៃ តាមប្រភេទ ទំនិញ និងបុគ្គលិក",
 ["ចំណូល តម្លៃដើម និងប្រាក់ចំណេញដុល", "អត្រាចំណេញរៀងរាល់ថ្ងៃ", "មើលតាមថ្ងៃ ប្រភេទ ទំនិញ ឬបុគ្គលិក", "Report បន្ថែម៖ តម្លៃ Stock ការខាតបង់ ប្រាក់ខែ"], "profit"))

# 17 staff
add(*split("Owner · Staff", "គ្រប់គ្រងបុគ្គលិក និងសិទ្ធិ",
 ["បន្ថែមបុគ្គលិក កំណត់តួនាទី និងបិទគណនី", "កំណត់ដែនកំណត់បញ្ចុះតម្លៃរៀងខ្លួន", "ប្តូរពាក្យសម្ងាត់ និង PIN", "ប្រាក់ខែ និងម៉ោងធ្វើការ"], "staff", dark=True))

# owner banks
add(*split("Owner · ធនាគារទទួលប្រាក់", "Owner កំណត់គណនីធនាគារ សម្រាប់ KHQR",
 ["បើក ឬបិទធនាគារ ABA ACLEDA Wing Canadia ...", "លេខសម្គាល់គណនីបាគង របស់ហាង", "ធនាគារទីមួយ ជាលំនាំដើមនៅបញ្ជរ", "Report បំបែកចំណូលតាមធនាគារ"], "banks"))

# 18 audit
add(*split("Owner · Audit Log", "ដឹងថាអ្នកណាធ្វើអ្វី នៅពេលណា",
 ["កត់ត្រារាល់ការផ្លាស់ប្តូរតម្លៃ បុគ្គលិក និងច្បាប់", "មិនអាចលុប ឬកែបានទេ", "ស្វែងរកតាមអ្នកធ្វើ និងប្រភេទសកម្មភាព"], "audit"))

# 19 authority table
add("", f'''<div class="eyebrow">សុវត្ថិភាព · Permissions</div><h2>ម្នាក់ៗ ធ្វើបានតែអ្វីដែលខ្លួនមានសិទ្ធិ</h2>
<table><tr><th style="width:42%">សកម្មភាព</th><th>Cashier</th><th>Manager</th><th>Owner</th></tr>
<tr><td>លក់ និងទទួលលុយ</td><td class="y">បាន</td><td class="y">បាន</td><td>—</td></tr>
<tr><td>បញ្ចុះតម្លៃលើសកំណត់</td><td>មិនបាន</td><td class="y">បាន (PIN)</td><td class="y">បាន</td></tr>
<tr><td>អនុម័ត Void និង Refund</td><td>ស្នើ</td><td class="y">បាន</td><td class="y">បាន</td></tr>
<tr><td>ត្រួតពិនិត្យ Shift ដែលបិទ</td><td>មិនបាន</td><td class="y">បាន</td><td class="y">បាន</td></tr>
<tr><td>មើលតម្លៃដើម និងប្រាក់ចំណេញ</td><td>មិនបាន</td><td>មិនបាន</td><td class="y">បាន</td></tr>
<tr><td>កែតម្លៃលក់ និងបុគ្គលិក</td><td>មិនបាន</td><td>មិនបាន</td><td class="y">បាន</td></tr>
<tr><td>កំណត់ធនាគារទទួលប្រាក់</td><td>ជ្រើសពេលទូទាត់</td><td>មិនបាន</td><td class="y">បាន</td></tr></table>
<p style="margin-top:28px;font-size:28px">Login ដោយលេខទូរស័ព្ទ ឬ Email និងពាក្យសម្ងាត់ · ចាក់សោ 1 នាទី បើខុស 5 ដង</p>{foot()}''')

# 20 ease of use
add("dark", f'''<div class="eyebrow">បង្កើតមកសម្រាប់ហាងនៅកម្ពុជា</div><h2>ងាយប្រើ សម្រាប់បុគ្គលិកគ្រប់គ្នា</h2><div class="grid c3">
<div class="card"><h3>ភាសាខ្មែរ</h3><p>ពាក្យសាមញ្ញដែលបុគ្គលិកប្រើនៅតុគិតលុយ</p></div>
<div class="card"><h3>ដុល្លារ និងរៀល</h3><p>អត្រាប្តូរប្រាក់ប្រចាំថ្ងៃ</p></div>
<div class="card"><h3>គ្រប់ឧបករណ៍</h3><p>Desktop Tablet និងទូរស័ព្ទ មាន Light និង Dark Mode</p></div>
<div class="card"><h3>ប៊ូតុងធំៗ</h3><p>សម្រាប់ប៉ះលើអេក្រង់ និងគ្រាប់ចុចរហ័ស</p></div>
<div class="card"><h3>បោះពុម្ពស្តង់ដារ</h3><p>Receipt 80mm និង Z-Report ទំហំ A4</p></div>
<div class="card"><h3>គ្មានការតម្លើងស្មុគស្មាញ</h3><p>ដំណើរការលើ Browser</p></div></div>{foot()}''')

# 21 next steps
add("dark", f'''<div style="flex:1;display:flex;flex-direction:column;justify-content:center"><div class="eyebrow">ជំហានបន្ទាប់</div>
<h1 style="font-size:88px">សាកល្បងជាមួយហាងរបស់អ្នក</h1>
<div class="grid c3" style="margin-top:56px"><div class="card"><div class="num" style="color:#6ee7b7">1</div><h3>Demo ផ្ទាល់</h3><p>សាកល្បងជាមួយទិន្នន័យគំរូ</p></div>
<div class="card"><div class="num" style="color:#6ee7b7">2</div><h3>កំណត់ហាង</h3><p>ទំនិញ តម្លៃ និងបុគ្គលិក</p></div>
<div class="card"><div class="num" style="color:#6ee7b7">3</div><h3>បណ្តុះបណ្តាល</h3><p>បុគ្គលិកទាំងអស់ ត្រៀមប្រើ</p></div></div></div>
<div class="foot"><span>សូមអរគុណ</span><span>អភិវឌ្ឍដោយ DIGITECHKH</span></div>''')

TR=str.maketrans('០១២៣៤៥៦៧៨៩','0123456789')
out = ['<!doctype html><html lang="km"><head><meta charset="utf-8"><title>DIGITECHKH POS System</title>'
 '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&display=swap">'
 f'<style>{CSS}</style></head><body>']
for i, (cls, body) in enumerate(slides, 1):
    out.append(f'<div class="s {cls}">{body.replace("{N}", str(i))}</div>')
out.append('</body></html>')
open(os.path.join(HERE, 'deck.html'), 'w').write("\n".join(out).translate(TR))
print(len(slides), 'slides')
