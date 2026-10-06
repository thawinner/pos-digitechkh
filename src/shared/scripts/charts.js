/* ===== ក្រាហ្វ (ECharts) — រចនាប័ទ្មរួមសម្រាប់គ្រប់ទំព័រ =====
   ទំព័រផ្ទុក echarts.min.js ពី cdnjs មុនឯកសារនេះ។ posChart(el, option) បង្កើត ឬធ្វើបច្ចុប្បន្នភាពក្រាហ្វ
   ជាមួយពុម្ពអក្សរ Kantumruy Pro ពណ៌អ័ក្សស្ងប់ស្ងាត់ និងប្រអប់ព័ត៌មានងងឹត (មិនមែនប្រអប់ព័ត៌មានដើមរបស់កម្មវិធីរុករក)។
   ក្រាហ្វប្តូរទំហំតាមប្រអប់ដោយស្វ័យប្រវត្តិ ហើយគូរជា SVG ដូច្នេះបោះពុម្ពបានច្បាស់។ */

const CHART_FONT = "'Kantumruy Pro', sans-serif";
/* ស៊េរីទិន្នន័យប្រើពណ៌ខៀវចម្បងតែមួយ (accent) ជាមួយប្រផេះ · លឿង និងក្រហមសម្រាប់តែការព្រមាន */
const CHART_TONE = {
    accent: '#047857', accentSoft: '#a7f3d0', accentStrong: '#065f46',
    slate: '#a2a2a2', amber: '#f59e0b', rose: '#e11d48'
};

function chartIsDark() {
    return document.documentElement.classList.contains('dark');
}

function chartBase() {
    const dark = chartIsDark();
    return {
        animationDuration: 350,
        textStyle: { fontFamily: CHART_FONT, color: dark ? '#d4d4d4' : '#545454' },
        grid: { left: 4, right: 8, top: 16, bottom: 4, containLabel: true },
        tooltip: {
            trigger: 'axis',
            confine: true,
            backgroundColor: '#171717',
            borderWidth: 1,
            borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            padding: [8, 12],
            textStyle: { color: '#fafafa', fontFamily: CHART_FONT, fontSize: 13 },
            extraCssText: 'border-radius:8px;box-shadow:0 8px 24px rgba(23,23,23,.18)',
            axisPointer: { type: 'shadow', shadowStyle: { color: dark ? 'rgba(255,255,255,.05)' : 'rgba(23,23,23,.04)' } }
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
        axisLine: { lineStyle: { color: dark ? '#404040' : '#e7e7e7' } },
        axisLabel: { color: dark ? '#a2a2a2' : '#737373', fontSize: 12, fontFamily: CHART_FONT }
    }, extra || {});
}

/* អ័ក្សតម្លៃ — fmt កំណត់ទម្រង់ស្លាក (ឧ. ដុល្លារ ឬភាគរយ) */
function chartValueAxis(fmt, extra) {
    const dark = chartIsDark();
    return Object.assign({
        type: 'value',
        splitNumber: 4,
        axisLabel: { color: dark ? '#a2a2a2' : '#737373', fontSize: 11, fontFamily: CHART_FONT, formatter: fmt || (v => v) },
        splitLine: { lineStyle: { color: dark ? '#292929' : '#f4f4f4' } }
    }, extra || {});
}

/* ជួរមួយក្នុងប្រអប់ព័ត៌មាន៖ ចំណុចពណ៌ · ស្លាក · តម្លៃ */
function chartTipRow(color, label, value) {
    return `<div style="display:flex;align-items:center;gap:8px;min-width:170px;margin-top:3px">
        <span style="width:8px;height:8px;border-radius:2px;background:${color}"></span>
        <span style="flex:1;color:#d4d4d4">${label}</span><b style="font-weight:600">${value}</b></div>`;
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
