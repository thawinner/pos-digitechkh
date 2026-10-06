#!/usr/bin/env python3
"""Generate deck-workflow.html (workflow diagrams, Khmer + English keywords). Reuses the CSS from build.py."""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
CSS = re.search(r'CSS = """(.*?)"""', open(os.path.join(HERE, 'build.py')).read(), re.S).group(1)
CSS += """
.flow{display:flex;align-items:stretch;gap:0}
.st{flex:1;background:#fff;border:1px solid #dfe5e2;border-radius:20px;padding:38px 30px;min-width:0}
.dark .st{background:#12382d;border-color:#245a49}.dark .st h3{color:#fff}
.st h3{font-size:40px;margin-bottom:12px}.st p{font-size:30px;line-height:1.5}
.ar{width:44px;flex:none;display:flex;align-items:center;justify-content:center}
.ar:after{content:"";border-left:18px solid #047857;border-top:12px solid transparent;border-bottom:12px solid transparent}
.dark .ar:after{border-left-color:#6ee7b7}
.tag{display:inline-block;font-size:26px;font-weight:600;border-radius:999px;padding:3px 22px;margin-bottom:18px;background:#e4f3ec;color:#047857}
.tag.m{background:#eceff1;color:#455a64}.tag.o{background:#0B2B22;color:#6ee7b7}
.dark .tag{background:#0B2B22;color:#6ee7b7}
.lane{display:flex;align-items:stretch;gap:24px;margin-bottom:30px}
.lane .lab{width:230px;flex:none;border-radius:18px;background:#0B2B22;color:#fff;font-size:34px;font-weight:700;display:flex;align-items:center;justify-content:center;text-align:center;padding:12px}
.lane .flow{flex:1}
.note{background:#e4f3ec;border-radius:16px;padding:26px 34px;font-size:32px;color:#0B2B22;margin-top:36px}
.wrap{flex:1;display:flex;flex-direction:column;justify-content:center;padding-bottom:30px}
.dark .note{background:#12382d;color:#bfd8cf}
.sw th,.sw td{font-size:31px;padding:26px 24px;vertical-align:top;text-align:left;line-height:1.5}
.sw td:first-child{font-weight:700;color:#0B2B22;width:16%}
"""
slides = []
def add(cls, body): slides.append((cls, body))
def foot(): return '</div><div class="foot"><span>DIGITECHKH POS · Workflow</span><span>{N}</span></div>'
def step(t, p, tag=None, cls=""):
    tg = f'<div class="tag {cls}">{tag}</div>' if tag else ""
    return f'<div class="st">{tg}<h3>{t}</h3><p>{p}</p></div>'
def flow(steps): return '<div class="flow">' + '<div class="ar"></div>'.join(steps) + '</div>'
def head(eyebrow, title): return f'<div class="eyebrow">{eyebrow}</div><h2 style="margin-bottom:34px">{title}</h2><div class="wrap">'

# 1 cover
add("dark", '''<div style="flex:1;display:flex;flex-direction:column;justify-content:center">
<img src="logo-mark-transparent.png" style="width:110px;height:110px;background:#fff;border-radius:24px;padding:12px;margin-bottom:48px">
<div class="eyebrow">DIGITECHKH POS</div><h1 style="font-size:92px">Workflow<br>ដំណើរការងារក្នុងប្រព័ន្ធ</h1>
<p style="margin-top:32px;font-size:34px">ពីបើកហាង រហូតដល់ Owner សម្រេចចិត្ត</p></div>
<div class="foot"><span>Workflow Overview</span><span>អភិវឌ្ឍដោយ DIGITECHKH</span></div>''')

# 2 one day
add("", head("ទិដ្ឋភាពរួម", "មួយថ្ងៃក្នុងហាង ដំណើរការបែបនេះ") +
 flow([step("Roster","កំណត់អ្នកធ្វើវេន","Manager","m"), step("Open Shift","រាប់ Float ហើយបញ្ជាក់","Cashier"), step("លក់","ទទួលលុយ ចេញ Receipt","Cashier"), step("Close Shift","Blind Count និង Z-Report","Cashier"), step("Review","ត្រួតពិនិត្យ និងចុះហត្ថលេខា","Manager","m"), step("Report","ចំណេញ ការខាតបង់","Owner","o")]) +
 '<div class="note">ដំណើរការនេះធ្វើម្តងទៀតរាល់ Shift · រាល់សកម្មភាពមានកំណត់ត្រា អ្នកធ្វើ និងពេលវេលា</div>' + foot())

# 3 swimlane table
add("", head("តួនាទី", "អ្នកណាធ្វើអ្វី ក្នុងមួយថ្ងៃ") +
 '''<table class="sw"><tr><th style="width:16%"></th><th>មុនបើក</th><th>ពេលលក់</th><th>ពេលបិទ</th></tr>
<tr><td>Cashier</td><td>Login · Open Shift រាប់ Float</td><td>លក់ · Hold · Cash Drop · ស្នើ Void ឬ Refund</td><td>Close Shift រាប់លុយ បោះពុម្ព Z-Report</td></tr>
<tr><td>Manager</td><td>កំណត់អត្រាប្តូរប្រាក់ · ត្រួតពិនិត្យ Roster</td><td>អនុម័ត Void Refund និងបញ្ចុះតម្លៃ · បញ្ជាក់ Cash Drop</td><td>Review Shift ដែលបិទ · ដោះស្រាយ Exceptions</td></tr>
<tr><td>Owner</td><td>កំណត់តម្លៃ ច្បាប់ បុគ្គលិក និងធនាគារ</td><td>មើល Dashboard ចំណូល និងចំណេញ</td><td>មើល Report Stock និង Audit Log</td></tr></table>''' + foot())

# 4 sale flow
add("", head("Cashier · Sale Flow", "ដំណើរការលក់ មួយវិក្កយបត្រ") +
 flow([step("ស្កេន","Barcode ឬប៉ះផលិតផល"), step("កន្ត្រក","កែចំនួន ឬលុបមុនបង់ប្រាក់"), step("ទូទាត់","សាច់ប្រាក់ USD KHR ឬ KHQR តាមធនាគារ"), step("អាប់ដូរ","គិតជា USD និងរៀល"), step("Receipt","បោះពុម្ព 80mm និង Customer Display")]) +
 '''<div class="grid c2" style="margin-top:36px"><div class="card"><h3>បញ្ចុះតម្លៃលើសកំណត់?</h3><p>ត្រូវបញ្ចូល PIN របស់ Manager នៅលើអេក្រង់ Cashier</p></div>
<div class="card"><h3>មានអតិថិជនបន្ទាប់?</h3><p>Hold ការលក់ ហើយបន្តវិញពេលក្រោយ</p></div></div>''' + foot())

# KHQR flow
add("dark", head("KHQR Payment Flow", "ទទួលប្រាក់តាម KHQR ចូលគណនីធនាគារហាង") +
 flow([step("ជ្រើស «ធនាគារ»","Cashier ជ្រើសវិធីទូទាត់"), step("ជ្រើសគណនី","ABA ACLEDA ... លំនាំដើម = ធនាគារទីមួយ"), step("បង្ហាញ KHQR","លើអេក្រង់ Cashier និង Customer Display"), step("អតិថិជនស្កេន","ពីកម្មវិធីធនាគារណាក៏បាន"), step("បានទទួលប្រាក់","Cashier បញ្ជាក់ ហើយចេញ Receipt")]) +
 '''<div class="grid c3" style="margin-top:36px"><div class="card"><h3>ផុតកំណត់ 5 នាទី</h3><p>ចុចបង្កើតកូដថ្មី លេខវិក្កយបត្រដដែល</p></div>
<div class="card"><h3>ប្តូរធនាគារ</h3><p>បង្កើតកូដថ្មី ចូលគណនីដែលអតិថិជនចង់បាន</p></div>
<div class="card"><h3>Report តាមធនាគារ</h3><p>Close Shift Dashboard និង Sales Report បំបែកតាមធនាគារ</p></div></div>''' + foot())

# 5 approval flow
add("dark", head("Approval Flow", "Void និង Refund ត្រូវមានអ្នកអនុម័ត") +
 '''<div class="lane"><div class="lab">នៅកន្លែង<br>គិតលុយ</div><div class="flow">''' +
 step("Cashier ស្នើ","ជ្រើសមូលហេតុ") + '<div class="ar"></div>' + step("Manager បញ្ចូល PIN","នៅលើអេក្រង់ Cashier") + '<div class="ar"></div>' + step("រួចរាល់","Stock និងកំណត់ត្រាធ្វើបច្ចុប្បន្នភាព") + '''</div></div>
<div class="lane"><div class="lab">តាមជួរ<br>រង់ចាំ</div><div class="flow">''' +
 step("Cashier ស្នើ","អតិថិជនចាកចេញហើយ") + '<div class="ar"></div>' + step("ចូល Approvals","បង្ហាញលើ Dashboard ក្នុងលំដាប់ប្រញាប់") + '<div class="ar"></div>' + step("Manager សម្រេច","អនុម័ត ឬបដិសេធ ដោយមានមូលហេតុ") + '''</div></div>
<div class="note">Manager មិនអាចអនុម័តការលក់ខ្លួនឯង · PIN ខុស 3 ដង ចាក់សោ 60 វិនាទី · មិនអាចលុបកំណត់ត្រាបាន</div>''' + foot())

# 6 shift lifecycle
add("", head("Shift Lifecycle", "Shift មួយ ឆ្លងកាត់ 3 ស្ថានភាព") +
 flow([step("Open","Cashier រាប់ Float · Manager បញ្ជាក់ · មួយបញ្ជរ មួយ Cashier","កំពុងលក់"), step("Closed","Cashier រាប់លុយដោយមិនមើលចំនួនរំពឹងទុក · រាប់ឡើងវិញបានម្តង · Z-Report","រង់ចាំ Review","m"), step("Reviewed","Manager ចុះហត្ថលេខា · ត្រូវមានកំណត់ចំណាំ បើខុសលើសកំណត់","បានបញ្ជាក់","o")]) +
 '''<div class="grid c3" style="margin-top:36px"><div class="card"><h3>Open Shift</h3><p>មិនអាចបើកពីរ Shift លើបញ្ជរតែមួយ ឬអ្នកតែមួយ</p></div>
<div class="card"><h3>Close Shift</h3><p>Cash Drop ដែលមិនទាន់បញ្ជាក់ ត្រូវបញ្ចប់មុន</p></div>
<div class="card"><h3>Reopen</h3><p>Manager បើកឡើងវិញបាន ដោយមានមូលហេតុ</p></div></div>''' + foot())

# 7 cash flow
add("dark", head("Cash Flow", "លុយចេញចូល តាមដានគ្រប់ជំហាន") +
 flow([step("Float","លុយចាប់ផ្តើម USD និង KHR"), step("លក់ជាសាច់ប្រាក់","លុយចូលថត"), step("Cash Drop","Cashier ផ្ទេរចូលទូដែក"), step("Manager បញ្ជាក់","ទទួលលុយទម្លាក់"), step("Close Shift","រាប់ ប្រៀបធៀប ចំនួនរំពឹងទុក")]) +
 '''<div class="grid c2" style="margin-top:36px"><div class="card"><h3>ខុសក្នុងកម្រិតអនុញ្ញាត</h3><p>បិទបានធម្មតា</p></div>
<div class="card"><h3>ខុសលើសកំណត់</h3><p>ត្រូវមានកំណត់ចំណាំពី Manager ហើយបង្ហាញលើ Dashboard របស់ Owner</p></div></div>
<div class="note">KHQR ចូលគណនីធនាគាររបស់ហាងផ្ទាល់ · មិនរាប់ក្នុងថតប្រាក់ពេល Close Shift</div>''' + foot())

# 8 stock flow
add("", head("Stock Flow", "Stock មិនត្រូវបានកែដោយដៃ ទាំងស្រុង") +
 flow([step("Stock ដើម","ចំនួនចាប់ផ្តើម"), step("ការលក់","ដកចេញដោយស្វ័យប្រវត្តិ"), step("ចលនា","Stock In · Adjust · Count · Void · Return"), step("ជិតអស់","ជូនដំណឹង Manager"), step("ទទួលទំនិញ","Stock In ធ្វើបច្ចុប្បន្នភាព Stock")]) +
 '''<div class="grid c3" style="margin-top:36px"><div class="card"><h3>Cashier</h3><p>ឃើញតែ «អស់» ឬ «ជិតអស់»</p></div>
<div class="card"><h3>Manager</h3><p>ទទួលទំនិញ រាប់ Stock កែតម្រូវ</p></div>
<div class="card"><h3>Owner</h3><p>តម្លៃ Stock សរុប និងការខាតបង់</p></div></div>''' + foot())

# 9 exceptions
add("", head("Control", "អ្វីដែលធ្វើឲ្យកើត Exception") +
 '''<div class="grid c3"><div class="card"><div class="tag m">Void</div><h3>លុបវិក្កយបត្រ</h3><p>ត្រូវមានមូលហេតុ និងអនុម័ត</p></div>
<div class="card"><div class="tag m">Refund</div><h3>ប្រគល់ទំនិញ</h3><p>ជ្រើស Restock ឬខូច</p></div>
<div class="card"><div class="tag m">Discount</div><h3>បញ្ចុះតម្លៃលើសកំណត់</h3><p>ត្រូវមាន PIN</p></div>
<div class="card"><div class="tag m">Line Removed</div><h3>ដកទំនិញមុនទូទាត់</h3><p>កត់ត្រាជា Event</p></div>
<div class="card"><div class="tag m">PIN</div><h3>PIN ខុស</h3><p>ចាក់សោបណ្តោះអាសន្ន</p></div>
<div class="card"><div class="tag m">Variance</div><h3>លុយខុសពេលបិទ</h3><p>លើសកំណត់ត្រូវមានចំណាំ</p></div></div>
<div class="note">ទាំងអស់បង្ហាញក្នុង «ករណីមិនប្រក្រតី» របស់ Manager និង Audit Log របស់ Owner</div>''' + foot())

# 10 owner
add("dark", head("Owner · Decision Flow", "Owner ឃើញអ្វី ហើយសម្រេចអ្វី") +
 flow([step("Dashboard","ចំណូល ចំណេញ ខុសសាច់ប្រាក់"), step("Report","Profit · Stock Value · Shrinkage"), step("វិភាគ","ទំនិញចំណេញទាប បុគ្គលិកមានបញ្ហា"), step("សម្រេច","កែតម្លៃ កែសិទ្ធិ កែច្បាប់"), step("Audit Log","កត់ត្រារាល់ការផ្លាស់ប្តូរ")]) +
 '<div class="note">តម្លៃដើម និងប្រាក់ចំណេញ មានតែ Owner មើលឃើញ · Cashier និង Manager មិនឃើញ</div>' + foot())

# 11 end
add("dark", '''<div style="flex:1;display:flex;flex-direction:column;justify-content:center"><div class="eyebrow">សង្ខេប</div>
<h1 style="font-size:80px">លក់លឿន · លុយត្រូវ · ត្រួតពិនិត្យបាន</h1>
<div class="grid c3" style="margin-top:52px"><div class="card"><h3>Cashier</h3><p>លក់ និងបិទ Shift ដោយស្មោះត្រង់</p></div>
<div class="card"><h3>Manager</h3><p>អនុម័ត និងត្រួតពិនិត្យរាល់ថ្ងៃ</p></div>
<div class="card"><h3>Owner</h3><p>ដឹងចំណេញ និងគ្រប់គ្រងច្បាប់</p></div></div></div>
<div class="foot"><span>សូមអរគុណ</span><span>អភិវឌ្ឍដោយ DIGITECHKH</span></div>''')

TR = str.maketrans('០១២៣៤៥៦៧៨៩', '0123456789')
out = ['<!doctype html><html lang="km"><head><meta charset="utf-8"><title>DIGITECHKH POS Workflow</title>'
 '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&display=swap">'
 f'<style>{CSS}</style></head><body>']
for i, (cls, body) in enumerate(slides, 1):
    out.append(f'<div class="s {cls}">{body.replace("{N}", str(i))}</div>')
out.append('</body></html>')
open(os.path.join(HERE, 'deck-workflow.html'), 'w').write("\n".join(out).translate(TR))
print(len(slides), 'slides')
