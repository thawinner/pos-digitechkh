/* ===== ក្រាហ្វ (ECharts) — រចនាប័ទ្មរួមសម្រាប់គ្រប់ទំព័រ =====
   ទំព័រផ្ទុក echarts.min.js ពី cdnjs មុនឯកសារនេះ។ posChart(el, option) បង្កើត ឬធ្វើបច្ចុប្បន្នភាពក្រាហ្វ
   ជាមួយពុម្ពអក្សរ Kantumruy Pro ពណ៌អ័ក្សស្ងប់ស្ងាត់ និងប្រអប់ព័ត៌មានងងឹត (មិនមែនប្រអប់ព័ត៌មានដើមរបស់កម្មវិធីរុករក)។
   ក្រាហ្វប្តូរទំហំតាមប្រអប់ដោយស្វ័យប្រវត្តិ ហើយគូរជា SVG ដូច្នេះបោះពុម្ពបានច្បាស់។ */

const CHART_FONT = "'Kantumruy Pro', sans-serif";
/* ស៊េរីទិន្នន័យប្រើពណ៌ខៀវចម្បងតែមួយ (accent) ជាមួយប្រផេះ · លឿង និងក្រហមសម្រាប់តែការព្រមាន */
const CHART_TONE = {
    accent: '#2563eb', accentSoft: '#bfdbfe', accentStrong: '#1d4ed8',
    slate: '#94a3b8', amber: '#f59e0b', rose: '#e11d48'
};

function chartIsDark() {
    return document.documentElement.classList.contains('dark');
}

function chartBase() {
    const dark = chartIsDark();
    return {
        animationDuration: 350,
        textStyle: { fontFamily: CHART_FONT, color: dark ? '#cbd5e1' : '#475569' },
        grid: { left: 4, right: 8, top: 16, bottom: 4, containLabel: true },
        tooltip: {
            trigger: 'axis',
            confine: true,
            backgroundColor: '#0f172a',
            borderWidth: 1,
            borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            padding: [8, 12],
            textStyle: { color: '#f8fafc', fontFamily: CHART_FONT, fontSize: 13 },
            extraCssText: 'border-radius:8px;box-shadow:0 8px 24px rgba(15,23,42,.18)',
            axisPointer: { type: 'shadow', shadowStyle: { color: dark ? 'rgba(255,255,255,.05)' : 'rgba(15,23,42,.04)' } }
        }
    };
}

/* អ័ក្សប្រភេទ (ថ្ងៃ ម៉ោង ឈ្មោះ) */
function chartCategoryAxis(data, extra) {
    const dark = chartIsDark();
    return Object.assign({
        type: 'category',
        data,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: dark ? '#334155' : '#e2e8f0' } },
        axisLabel: { color: dark ? '#94a3b8' : '#64748b', fontSize: 12, fontFamily: CHART_FONT }
    }, extra || {});
}

/* អ័ក្សតម្លៃ — fmt កំណត់ទម្រង់ស្លាក (ឧ. ដុល្លារ ឬភាគរយ) */
function chartValueAxis(fmt, extra) {
    const dark = chartIsDark();
    return Object.assign({
        type: 'value',
        splitNumber: 4,
        axisLabel: { color: dark ? '#94a3b8' : '#64748b', fontSize: 11, fontFamily: CHART_FONT, formatter: fmt || (v => v) },
        splitLine: { lineStyle: { color: dark ? '#1e293b' : '#f1f5f9' } }
    }, extra || {});
}

/* ជួរមួយក្នុងប្រអប់ព័ត៌មាន៖ ចំណុចពណ៌ · ស្លាក · តម្លៃ */
function chartTipRow(color, label, value) {
    return `<div style="display:flex;align-items:center;gap:8px;min-width:170px;margin-top:3px">
        <span style="width:8px;height:8px;border-radius:2px;background:${color}"></span>
        <span style="flex:1;color:#cbd5e1">${label}</span><b style="font-weight:600">${value}</b></div>`;
}

function chartTipTitle(text) {
    return `<div style="font-weight:600;margin-bottom:2px">${text}</div>`;
}

function posChart(el, option) {
    if (typeof el === 'string') el = document.getElementById(el);
    if (!el || typeof echarts === 'undefined') return null;
    /* ការគូរលើកដំបូងមានចលនាឡើង · ការធ្វើបច្ចុប្បន្នភាព (ប្តូរថ្ងៃ ប្តូរតម្រង) ផ្លាស់ប្តូរពីតម្លៃចាស់ដោយរលូន មិនលេងម្តងទៀត */
    let chart = echarts.getInstanceByDom(el);
    if (!chart) {
        chart = echarts.init(el, null, { renderer: 'svg' });
        if (typeof ResizeObserver === 'function') new ResizeObserver(() => chart.resize()).observe(el);
        chart.setOption(chartBase());
    }
    chart.setOption(option, { replaceMerge: ['series', 'xAxis', 'yAxis'] });
    return chart;
}

// ធ្វើបច្ចុប្បន្នភាពមូលដ្ឋានគ្រឹះក្រាហ្វពេលប្តូរស្បែក
if (typeof window !== 'undefined') {
    window.addEventListener('bms-theme-change', () => {
        if (window.echarts) {
            document.querySelectorAll('[_echarts_instance_]').forEach(el => {
                const chart = echarts.getInstanceByDom(el);
                if (chart) {
                    chart.setOption(chartBase());
                    chart.resize();
                }
            });
        }
    });
}
