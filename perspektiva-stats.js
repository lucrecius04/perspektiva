/* =============================================================
   perspektiva-stats.js
   Svět v perspektivě – Widget "Státy v datech"
   Obsahuje: vyhledávání zemí, statistiky, graf (SVG), filtrování článků
   Závislosti: perspektiva-data.js (musí být načteno dříve)
   ============================================================= */

// ── METRICS CONFIG ───────────────────────────────────────────────
const METRICS_CONFIG = {
    life:         { label:'Délka života',         unit:'roky',    yLabel:'Roky',      source:'World Bank – SP.DYN.LE00.IN',           scale:{min:40,max:90},   wbId:null,                  title:'Očekávaná délka života (1960–2023)' },
    infant:       { label:'Kojen. úm.',           unit:'na 1000', yLabel:'Na 1000',   source:'World Bank / UN IGME – SP.DYN.IMRT.IN', scale:{min:0,max:150},   wbId:null,                  title:'Kojenecká úmrtnost (1990–2023)' },
    pop_growth:   { label:'Popul. přírůstek',     unit:'%',       yLabel:'%',         source:'World Bank – SP.POP.GROW',              scale:'dynamic',         wbId:'SP.POP.GROW',         title:'Populační přírůstek / úbytek (% ročně)' },
    gdp:          { label:'HDP/obyvatele',        unit:'USD',     yLabel:'USD',       source:'World Bank – NY.GDP.PCAP.CD',           scale:'dynamic',         wbId:'NY.GDP.PCAP.CD',      title:'HDP na obyvatele (nominální USD)' },
    gdp_growth:   { label:'Růst HDP',             unit:'%',       yLabel:'%',         source:'World Bank – NY.GDP.MKTP.KD.ZG',        scale:'dynamic',         wbId:'NY.GDP.MKTP.KD.ZG',   title:'Růst HDP (% ročně)' },
    inflation:    { label:'Inflace',              unit:'%',       yLabel:'%',         source:'World Bank – FP.CPI.TOTL.ZG',           scale:'dynamic',         wbId:'FP.CPI.TOTL.ZG',      title:'Inflace, spotřebitelské ceny (% ročně)' },
    unemployment: { label:'Nezaměstnanost',       unit:'%',       yLabel:'%',         source:'World Bank – SL.UEM.TOTL.ZS',           scale:{min:0,max:35},    wbId:'SL.UEM.TOTL.ZS',      title:'Nezaměstnanost (% pracovní síly)' },
    co2:          { label:'Emise CO₂/os.',        unit:'t/os.',   yLabel:'t/os.',     source:'World Bank – EN.ATM.CO2E.PC',           scale:'dynamic',         wbId:'EN.ATM.CO2E.PC',      title:'Emise CO₂ na osobu (tuny)' },
    population:   { label:'Populace',             unit:'mil.',    yLabel:'mil. os.',  source:'World Bank – SP.POP.TOTL',              scale:'dynamic',         wbId:'SP.POP.TOTL',         title:'Celková populace (miliony)' },
    density:      { label:'Hustota zalidnění',    unit:'os./km²', yLabel:'os./km²',   source:'World Bank – EN.POP.DNST',              scale:'dynamic',         wbId:'EN.POP.DNST',         title:'Hustota zalidnění (obyvatel na km²)' },
    hdi:          { label:'HDI',                  unit:'index',   yLabel:'HDI (0–1)', source:'Our World in Data / UNDP',              scale:{min:0, max:1},    wbId:'UNDP.HDI.XD',         title:'Index lidského rozvoje (HDI, 0–1)',                                     subtitle:'Složený index UNDP — vzdělání, délka života a příjem na obyvatele. 0 = nejnižší, 1 = nejvyšší úroveň rozvoje.' },
    democracy:    { label:'Demokracie (VA)',       unit:'skóre',   yLabel:'Skóre',     source:'World Bank / WGI – VA.EST',             scale:{min:-2.5,max:2.5},wbId:'VA.EST',              title:'Demokracie – hlas a zodpovědnost (WGI)',                               subtitle:'Měří svobodu slova, svobodu tisku a vliv občanů na výběr vlády. Jiný index než EIU Democracy Index, který třídí státy na plné / vadné demokracie → hybridní režimy → autokracie.' },
    democracy_eiu:{ label:'Demokracie (EIU)',      unit:'0–10',    yLabel:'Skóre',     source:'Our World in Data / Economist Intelligence Unit', scale:{min:0,max:10},   wbId:null,                  title:'Index demokracie EIU (0–10)',                                          subtitle:'8–10: plná demokracie · 6–8: vadná demokracie · 4–6: hybridní režim · 0–4: autoritářský režim. Populárnější a čtenářsky srozumitelnější než WGI index.' },
    fertility:    { label:'Porodnost',            unit:'d/ž',     yLabel:'Děti/ženu', source:'World Bank – SP.DYN.TFRT.IN',           scale:{min:0,max:8},     wbId:'SP.DYN.TFRT.IN',      title:'Úhrnná plodnost (průměrný počet dětí na ženu)' },
    gini:         { label:'Gini (nerovnost)',     unit:'Gini',    yLabel:'Gini',      source:'World Bank – SI.POV.GINI',              scale:{min:20,max:70},   wbId:'SI.POV.GINI',         title:'Gini koeficient – příjmová nerovnost',                                 subtitle:'0 = dokonalá rovnost příjmů, 100 = vše vlastní jeden člověk. Data jsou řídká — Světová banka sbírá z národních průzkumů domácností, ne každý rok.' },
    urbanization: { label:'Urbanizace',           unit:'%',       yLabel:'%',         source:'World Bank – SP.URB.TOTL.IN.ZS',        scale:{min:0,max:100},   wbId:'SP.URB.TOTL.IN.ZS',   title:'Podíl populace žijící ve městech (%)' },
};

// ── GLOBALS ──────────────────────────────────────────────────────
let currentCountry       = { code:'WLD', name:'Svět' };
let currentMetric        = 'life';
let currentRangeStart    = null;              // null | 1980 | 1990 | 2000 | 2010
let currentCompareCountry  = null;            // null | { code, name }
let currentCompareCountry2 = null;            // null | { code, name }
const extendedDataCache   = {};               // "WLD-gdp" → [{year, value}, ...]

// ── LOCAL DATA CACHE ─────────────────────────────────────────────
let wbLatestData     = null;       // obsah data/wb-latest.json po načtení
let wbLatestPromise  = null;       // probíhající fetch (sdílený)
const wbSeriesCache  = {};         // metric → obsah wb-series-{metric}.json
const wbSeriesPromise = {};        // metric → probíhající fetch (sdílený)

async function loadWBLatest() {
    if (wbLatestData)    return wbLatestData;
    if (wbLatestPromise) return wbLatestPromise;
    wbLatestPromise = fetch('data/wb-latest.json')
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(d => { wbLatestData = d; return d; })
        .catch(() => { wbLatestData = {}; return {}; });
    return wbLatestPromise;
}

async function loadWBSeries(metric) {
    if (wbSeriesCache[metric])   return wbSeriesCache[metric];
    if (wbSeriesPromise[metric]) return wbSeriesPromise[metric];
    wbSeriesPromise[metric] = fetch(`data/wb-series-${metric}.json`)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(d => { wbSeriesCache[metric] = d; return d; })
        .catch(() => { wbSeriesCache[metric] = {}; return {}; });
    return wbSeriesPromise[metric];
}

// ── INIT ─────────────────────────────────────────────────────────
(function() {
    loadWBLatest(); // předběžné načtení – nezablokuje render
    setupSearch();
    document.getElementById('countrySearch').value = 'Svět';
    loadCountryData('WLD', 'Svět');

    // Překreslit graf při přepnutí tématu
    new MutationObserver(() => updateChart())
        .observe(document.documentElement, { attributeFilter: ['class'] });

    filterArticles('all');
    addTopicBadges();
    populateCompareCountrySelect();

    // Sync hero čísla týdne with real data
    setTimeout(() => {
        const wldLife = getLatestValue('WLD', 'life');
        if (wldLife && document.getElementById('heroLifeExp')) {
            document.getElementById('heroLifeExp').textContent = wldLife.value.toFixed(1);
        }
    }, 100);
})();

// ── SEARCH ───────────────────────────────────────────────────────
function setupSearch() {
    const searchInput = document.getElementById('countrySearch');
    const dropdown    = document.getElementById('countryDropdown');

    searchInput.addEventListener('focus', () => showDropdown(''));
    searchInput.addEventListener('input', (e) => showDropdown(e.target.value));
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.country-selector')) {
            dropdown.classList.remove('active');
        }
    });
}

function showDropdown(searchTerm) {
    const dropdown = document.getElementById('countryDropdown');
    let filtered = ALL_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'cs'));

    const priority    = ['WLD', 'CZE'];
    const prioritized = [];
    const rest        = [];
    filtered.forEach(c => {
        if (priority.includes(c.code)) prioritized.push(c);
        else rest.push(c);
    });
    prioritized.sort((a, b) => priority.indexOf(a.code) - priority.indexOf(b.code));
    const finalList = [...prioritized, ...rest];

    dropdown.innerHTML = finalList.map((c, index) => {
        const divider = index === prioritized.length && rest.length > 0
            ? '<div class="country-divider"></div>'
            : '';
        return divider + `
            <div class="country-option ${c.code === currentCountry.code ? 'selected' : ''}"
                 onclick="selectCountry('${c.code}', '${c.name.replace(/'/g, "\\'")}')">
                <span class="country-flag">${c.flag}</span>
                <span>${c.name}</span>
            </div>
        `;
    }).join('');

    dropdown.classList.add('active');
}

function selectCountry(code, name) {
    currentCountry = { code, name };
    document.getElementById('countrySearch').value = name;
    document.getElementById('countryDropdown').classList.remove('active');
    loadCountryData(code, name);
}

// ── METRIC SELECTOR ──────────────────────────────────────────────
function showChart(metric) {
    currentMetric = metric;
    document.querySelectorAll('.stat-box').forEach(s => s.classList.remove('active'));
    const box = document.querySelector(`[data-metric="${metric}"]`);
    if (box) box.classList.add('active');
    updateChart();
}

// ── RANGE FILTER ─────────────────────────────────────────────────
function setRange(year) {
    currentRangeStart = year;
    document.querySelectorAll('.range-btn').forEach(btn => btn.classList.remove('active'));
    const key = year === null ? 'null' : String(year);
    const activeBtn = document.querySelector(`.range-btn[data-range="${key}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    updateChart();
}

// ── COMPARE COUNTRY ──────────────────────────────────────────────
function setCompareCountry(code) {
    if (!code) {
        currentCompareCountry = null;
    } else {
        const country = ALL_COUNTRIES.find(c => c.code === code);
        currentCompareCountry = country ? { code, name: country.name } : null;
    }
    updateCompareResetBtns();
    updateChart();
}

function setCompareCountry2(code) {
    if (!code) {
        currentCompareCountry2 = null;
    } else {
        const country = ALL_COUNTRIES.find(c => c.code === code);
        currentCompareCountry2 = country ? { code, name: country.name } : null;
    }
    updateCompareResetBtns();
    updateChart();
}

function resetCompare(n) {
    if (n === 1) {
        currentCompareCountry = null;
        const sel = document.getElementById('compareCountrySelect');
        if (sel) sel.value = '';
    } else {
        currentCompareCountry2 = null;
        const sel = document.getElementById('compareCountrySelect2');
        if (sel) sel.value = '';
    }
    updateCompareResetBtns();
    updateChart();
}

function updateCompareResetBtns() {
    const b1 = document.getElementById('compareReset1');
    const b2 = document.getElementById('compareReset2');
    if (b1) {
        b1.classList.toggle('active', !!currentCompareCountry);
        b1.title = currentCompareCountry ? `Odstranit ${currentCompareCountry.name}` : '';
    }
    if (b2) {
        b2.classList.toggle('active', !!currentCompareCountry2);
        b2.title = currentCompareCountry2 ? `Odstranit ${currentCompareCountry2.name}` : '';
    }
}

function populateCompareCountrySelect() {
    const priority    = ['WLD', 'CZE'];
    const sorted      = [...ALL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, 'cs'));
    const prioritized = sorted.filter(c => priority.includes(c.code))
                              .sort((a, b) => priority.indexOf(a.code) - priority.indexOf(b.code));
    const rest        = sorted.filter(c => !priority.includes(c.code));
    const allOrdered  = [...prioritized, ...rest];

    ['compareCountrySelect', 'compareCountrySelect2'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        sel.innerHTML = '<option value="">— žádná</option>';
        allOrdered.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.code;
            opt.textContent = c.name;
            sel.appendChild(opt);
        });
    });
}

// ── STATIC DATA HELPERS ──────────────────────────────────────────
function getLatestValue(countryCode, metric) {
    if (!HISTORICAL_DATA[countryCode] || !HISTORICAL_DATA[countryCode][metric]) return null;
    const data  = HISTORICAL_DATA[countryCode][metric];
    const years = Object.keys(data).map(Number).sort((a, b) => b - a);
    return { value: data[years[0]], year: years[0] };
}

function getChartData(countryCode, metric) {
    if (!HISTORICAL_DATA[countryCode] || !HISTORICAL_DATA[countryCode][metric]) return [];
    const data = HISTORICAL_DATA[countryCode][metric];
    return Object.entries(data)
        .map(([year, value]) => ({ year: parseInt(year), value }))
        .sort((a, b) => a.year - b.year);
}

// ── WORLD BANK API ───────────────────────────────────────────────
async function fetchWBData(countryCode, wbIndicator) {
    const ssKey = `wb-${countryCode}-${wbIndicator}`;
    try {
        const cached = sessionStorage.getItem(ssKey);
        if (cached) return JSON.parse(cached);
    } catch(e) {}

    const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${wbIndicator}?format=json&per_page=70`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`WB API ${resp.status}`);
    const json = await resp.json();

    const data = ((json[1]) || [])
        .filter(d => d.value !== null)
        .map(d => ({
            year:  parseInt(d.date),
            value: wbIndicator === 'SP.POP.TOTL' ? d.value / 1e6 : d.value
        }))
        .sort((a, b) => a.year - b.year);

    try { sessionStorage.setItem(ssKey, JSON.stringify(data)); } catch(e) {}
    return data;
}

async function getChartDataForMetric(countryCode, metric) {
    const cfg = METRICS_CONFIG[metric];
    if (!cfg) return [];

    let data;
    // Legacy statická data (life, infant, electricity, literacy)
    data = getChartData(countryCode, metric);
    if (!data || data.length === 0) {
        const cacheKey = `${countryCode}-${metric}`;
        if (extendedDataCache[cacheKey]) {
            data = extendedDataCache[cacheKey];
        } else {
            // Zkus lokální series soubor (WB nebo OWID zdroj)
            try {
                const series = await loadWBSeries(metric);
                if (series && series[countryCode] && series[countryCode].length > 0) {
                    data = series[countryCode];
                }
            } catch(e) {}
            // Fallback: živé WB API (jen pokud má wbId)
            if ((!data || data.length === 0) && cfg.wbId) {
                data = await fetchWBData(countryCode, cfg.wbId);
            }
            extendedDataCache[cacheKey] = data || [];
        }
    }

    if (currentRangeStart) {
        data = data.filter(d => d.year >= currentRangeStart);
    }
    return data;
}

// ── LOAD COUNTRY DATA ────────────────────────────────────────────
function loadCountryData(countryCode, countryName) {
    document.getElementById('statsTitle').textContent = `Státy v datech – ${countryName}`;

    const life = getLatestValue(countryCode, 'life');
    if (life) {
        document.getElementById('lifeExpectancy').textContent = life.value.toFixed(1);
        document.getElementById('lifeExpYear').textContent = `(${life.year})`;
    }
    const infant = getLatestValue(countryCode, 'infant');
    if (infant) {
        document.getElementById('infantMortality').textContent = infant.value.toFixed(1);
        document.getElementById('infantMortYear').textContent = `(${infant.year})`;
    }

    // Extended stat boxes (async, non-blocking)
    ['gdp', 'inflation', 'unemployment', 'population',
     'density', 'hdi', 'democracy_eiu', 'fertility', 'gini', 'urbanization'].forEach(m => {
        loadExtendedStatBox(countryCode, m);
    });

    updateChart();
}

async function loadExtendedStatBox(countryCode, metric) {
    const cfg    = METRICS_CONFIG[metric];
    const numEl  = document.getElementById(`stat-${metric}`);
    const yearEl = document.getElementById(`stat-${metric}-year`);
    if (!numEl || !cfg) return;

    numEl.textContent = '…';
    if (yearEl) yearEl.textContent = '';

    try {
        // Zkus nejdříve lokální data (wb-latest.json)
        const latest = await loadWBLatest();
        if (latest && latest[countryCode] && latest[countryCode][metric]) {
            const { v, y } = latest[countryCode][metric];
            numEl.textContent = formatValue(v, metric);
            if (yearEl) yearEl.textContent = `(${y})`;
            return;
        }
        // Fallback: živé WB API (jen pro metriky s wbId)
        if (!cfg.wbId) { numEl.textContent = '–'; return; }
        const data = await fetchWBData(countryCode, cfg.wbId);
        if (data && data.length > 0) {
            const last = data[data.length - 1];
            numEl.textContent = formatValue(last.value, metric);
            if (yearEl) yearEl.textContent = `(${last.year})`;
        } else {
            numEl.textContent = '–';
            if (yearEl) yearEl.textContent = '';
        }
    } catch(e) {
        numEl.textContent = '–';
        if (yearEl) yearEl.textContent = '';
    }
}

// ── FORMAT VALUE ─────────────────────────────────────────────────
function formatValue(value, metric) {
    const cfg = METRICS_CONFIG[metric];
    if (!cfg) return value.toFixed(1);
    const u = cfg.unit;
    if (u === '%')       return value.toFixed(2) + '%';
    if (u === 'roky')    return value.toFixed(1);
    if (u === 'na 1000') return value.toFixed(1);
    if (u === 'USD')     return value >= 10000 ? (value / 1000).toFixed(1) + 'k' : value.toFixed(0);
    if (u === 'mil.')    return value.toFixed(1) + ' mil.';
    if (u === 't/os.')   return value.toFixed(2) + ' t';
    if (u === 'os./km²') return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toFixed(0);
    if (u === 'index')   return value.toFixed(3);
    if (u === 'skóre')   return value.toFixed(2);
    if (u === 'd/ž')     return value.toFixed(2);
    if (u === 'Gini')    return value.toFixed(1);
    return value.toFixed(1);
}

// ── UPDATE CHART ─────────────────────────────────────────────────
async function updateChart() {
    const cfg = METRICS_CONFIG[currentMetric];
    if (!cfg) return;

    const titleSuffix = currentRangeStart ? ` (${currentRangeStart}→)` : '';
    document.getElementById('chartTitle').textContent = cfg.title + titleSuffix;
    const subtitleEl = document.getElementById('chartSubtitle');
    if (subtitleEl) subtitleEl.textContent = cfg.subtitle || '';
    if (document.getElementById('chartSource')) {
        document.getElementById('chartSource').textContent =
            `Zdroj: ${cfg.source}, data.worldbank.org`;
    }

    // Loading placeholder for API metrics
    if (cfg.wbId !== null) {
        const svg = document.getElementById('dataChart');
        if (svg) {
            svg.innerHTML = '';
            const isDark = document.documentElement.classList.contains('dark');
            const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            t.setAttribute('x', '350');
            t.setAttribute('y', '170');
            t.setAttribute('text-anchor', 'middle');
            t.setAttribute('fill', isDark ? '#8b949e' : '#6b7280');
            t.setAttribute('font-size', '15');
            t.setAttribute('font-family', 'IBM Plex Sans');
            t.textContent = 'Načítám data…';
            svg.appendChild(t);
        }
    }

    try {
        const primaryData   = await getChartDataForMetric(currentCountry.code, currentMetric);
        let   secondaryData = null;
        let   tertiaryData  = null;
        if (currentCompareCountry) {
            secondaryData = await getChartDataForMetric(currentCompareCountry.code, currentMetric);
        }
        if (currentCompareCountry2) {
            tertiaryData = await getChartDataForMetric(currentCompareCountry2.code, currentMetric);
        }
        drawChart(primaryData, 'dataChart', secondaryData, tertiaryData);
    } catch(e) {
        console.error('Chart error:', e);
        drawChart([], 'dataChart');
    }
}

// ── DRAW CHART ───────────────────────────────────────────────────
function drawChart(data, svgId, secondaryData, tertiaryData) {
    secondaryData = secondaryData || null;
    tertiaryData  = tertiaryData  || null;
    const svg = document.getElementById(svgId);
    svg.innerHTML = '';

    const isDark      = document.documentElement.classList.contains('dark');
    const axisColor   = isDark ? '#b0bcc9' : '#1e293b';
    const gridColor   = isDark ? '#4a5568' : '#4b5563';
    const emptyColor  = isDark ? '#8b949e' : '#6b7280';

    if (!data || data.length === 0) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '300');
        text.setAttribute('y', '150');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', emptyColor);
        text.setAttribute('font-size', '16');
        text.textContent = 'Data nejsou k dispozici';
        svg.appendChild(text);
        return;
    }

    const width       = 900, height = 420;
    const paddingLeft = 68, paddingOther = 34;
    const chartWidth  = width - paddingLeft - paddingOther;
    const chartHeight = height - 2 * paddingOther;

    const isCompare  = secondaryData && secondaryData.length > 0;
    const hasThird   = tertiaryData  && tertiaryData.length  > 0;
    const cfg        = METRICS_CONFIG[currentMetric];
    const chartColor   = isDark ? '#14b8a6' : '#0f766e';
    const compareColor = isDark ? '#fb923c' : '#e67e22';
    const thirdColor   = isDark ? '#c084fc' : '#9333ea';

    // ── Y scale (same metric → same scale for both countries) ────
    let paddedMin, paddedMax;

    if (cfg && cfg.scale !== 'dynamic') {
        paddedMin = cfg.scale.min;
        paddedMax = cfg.scale.max;
    } else {
        const allVals = [
            ...data.map(d => d.value),
            ...(isCompare ? secondaryData.map(d => d.value) : []),
            ...(hasThird  ? tertiaryData.map(d => d.value)  : [])
        ];
        const dMin  = Math.min(...allVals), dMax = Math.max(...allVals);
        const range = dMax - dMin || 1;
        paddedMin   = dMin - range * 0.05;
        paddedMax   = dMax + range * 0.05;
    }

    const yAxisLabel = cfg ? cfg.yLabel : '';

    // ── X range ──────────────────────────────────────────────────
    const allYears = [
        ...data.map(d => d.year),
        ...(isCompare ? secondaryData.map(d => d.year) : []),
        ...(hasThird  ? tertiaryData.map(d => d.year)  : [])
    ];
    const minYear   = Math.min(...allYears);
    const maxYear   = Math.max(...allYears);
    const yearRange = maxYear - minYear || 1;

    const scaleX = y => paddingLeft + ((y - minYear) / yearRange) * chartWidth;
    const scaleY = v => height - paddingOther - ((v - paddedMin) / (paddedMax - paddedMin || 1)) * chartHeight;

    // ── Grid ─────────────────────────────────────────────────────
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('opacity', isDark ? '0.85' : '0.5');

    for (let i = 0; i <= 4; i++) {
        const y = paddingOther + (chartHeight / 4) * i;

        const gline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gline.setAttribute('x1', paddingLeft);         gline.setAttribute('y1', y);
        gline.setAttribute('x2', width - paddingOther); gline.setAttribute('y2', y);
        gline.setAttribute('stroke', gridColor);       gline.setAttribute('stroke-width', '1');
        gridGroup.appendChild(gline);

        const val  = paddedMax - (paddedMax - paddedMin) * (i / 4);
        const gTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        gTxt.setAttribute('x', paddingLeft - 6);
        gTxt.setAttribute('y', y + 5);
        gTxt.setAttribute('text-anchor', 'end');
        gTxt.setAttribute('fill', axisColor);
        gTxt.setAttribute('font-size', '15');
        gTxt.setAttribute('font-family', 'IBM Plex Mono');
        gTxt.textContent = Math.abs(val) >= 10000 ? (val / 1000).toFixed(0) + 'k'
                         : Math.abs(val) >= 1000  ? (val / 1000).toFixed(1) + 'k'
                         : val.toFixed(1);
        gridGroup.appendChild(gTxt);
    }

    const numXTicks = Math.min(6, allYears.length);
    for (let i = 0; i <= numXTicks; i++) {
        const x = paddingLeft + (chartWidth / numXTicks) * i;

        const xline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xline.setAttribute('x1', x); xline.setAttribute('y1', paddingOther);
        xline.setAttribute('x2', x); xline.setAttribute('y2', height - paddingOther);
        xline.setAttribute('stroke', gridColor); xline.setAttribute('stroke-width', '1');
        gridGroup.appendChild(xline);

        const yr  = Math.round(minYear + yearRange * (i / numXTicks));
        const xt  = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xt.setAttribute('x', x);
        xt.setAttribute('y', height - paddingOther + 20);
        xt.setAttribute('text-anchor', 'middle');
        xt.setAttribute('fill', axisColor);
        xt.setAttribute('font-size', '15');
        xt.setAttribute('font-family', 'IBM Plex Mono');
        xt.textContent = yr;
        gridGroup.appendChild(xt);
    }

    svg.appendChild(gridGroup);

    // ── Gradient ─────────────────────────────────────────────────
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `<linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   style="stop-color:${chartColor};stop-opacity:${isDark ? 0.45 : 0.3}"/>
        <stop offset="100%" style="stop-color:${chartColor};stop-opacity:0"/>
    </linearGradient>`;
    svg.appendChild(defs);

    // ── Area (primary only) ──────────────────────────────────────
    if (!isCompare && !hasThird) {
        let aPath = `M ${scaleX(data[0].year)} ${height - paddingOther}`;
        data.forEach(d => { aPath += ` L ${scaleX(d.year)} ${scaleY(d.value)}`; });
        aPath += ` L ${scaleX(data[data.length - 1].year)} ${height - paddingOther} Z`;
        const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        area.setAttribute('d', aPath);
        area.setAttribute('fill', 'url(#chartGradient)');
        svg.appendChild(area);
    }

    // ── Primary line ─────────────────────────────────────────────
    const pPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.year)} ${scaleY(d.value)}`).join(' ');
    const pLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pLine.setAttribute('d', pPath);
    pLine.setAttribute('stroke', chartColor);
    pLine.setAttribute('stroke-width', '3');
    pLine.setAttribute('fill', 'none');
    svg.appendChild(pLine);

    // ── Secondary line (compare country) ─────────────────────────
    if (isCompare) {
        const sPath = secondaryData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.year)} ${scaleY(d.value)}`).join(' ');
        const sLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        sLine.setAttribute('d', sPath);
        sLine.setAttribute('stroke', compareColor);
        sLine.setAttribute('stroke-width', '2.5');
        sLine.setAttribute('fill', 'none');
        sLine.setAttribute('stroke-dasharray', '6,3');
        svg.appendChild(sLine);
    }

    // ── Tertiary line (third country) ─────────────────────────────
    if (hasThird) {
        const tPath = tertiaryData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.year)} ${scaleY(d.value)}`).join(' ');
        const tLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tLine.setAttribute('d', tPath);
        tLine.setAttribute('stroke', thirdColor);
        tLine.setAttribute('stroke-width', '2.5');
        tLine.setAttribute('fill', 'none');
        tLine.setAttribute('stroke-dasharray', '2,4');
        svg.appendChild(tLine);
    }

    // ── HTML legend (outside SVG) ─────────────────────────────────
    const legendEl = document.getElementById('chartLegend');
    if (legendEl) {
        if (isCompare || hasThird) {
            const pl = document.getElementById('legendPrimaryLine');
            const cl = document.getElementById('legendCompareLine');
            const tl = document.getElementById('legendThirdLine');
            const pn = document.getElementById('legendPrimaryName');
            const cn = document.getElementById('legendCompareName');
            const tn = document.getElementById('legendThirdName');
            const ti = document.getElementById('legendThirdItem');
            if (pl) pl.style.background = chartColor;
            if (cl) cl.style.borderTopColor = compareColor;
            if (tl) tl.style.borderTopColor = thirdColor;
            if (pn) pn.textContent = currentCountry.name;
            if (cn) cn.textContent = isCompare ? currentCompareCountry.name : '';
            if (tn) tn.textContent = hasThird  ? currentCompareCountry2.name : '';
            if (ti) ti.style.display = hasThird ? '' : 'none';
            legendEl.classList.add('visible');
        } else {
            legendEl.classList.remove('visible');
        }
    }

    // ── Y-axis label ─────────────────────────────────────────────
    const yLbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLbl.setAttribute('x', paddingLeft);
    yLbl.setAttribute('y', paddingOther - 10);
    yLbl.setAttribute('fill', axisColor);
    yLbl.setAttribute('font-size', '12');
    yLbl.setAttribute('font-family', 'IBM Plex Sans');
    yLbl.textContent = yAxisLabel;
    svg.appendChild(yLbl);

    // ── Tooltip overlay ──────────────────────────────────────────
    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    overlay.setAttribute('x', paddingLeft);
    overlay.setAttribute('y', paddingOther);
    overlay.setAttribute('width',  chartWidth);
    overlay.setAttribute('height', chartHeight);
    overlay.setAttribute('fill', 'transparent');
    overlay.style.cursor = 'crosshair';
    svg.appendChild(overlay);

    let ttGroup = null;

    overlay.addEventListener('mousemove', (e) => {
        const rect  = svg.getBoundingClientRect();
        // Respektuje viewBox + preserveAspectRatio="xMidYMid meet":
        // SVG se škáluje uniformně a centruje — musíme odečíst letterbox offset
        const scl   = Math.min(rect.width / width, rect.height / height);
        const xOff  = (rect.width  - width  * scl) / 2;
        const svgX  = (e.clientX - rect.left - xOff) / scl;
        const yearFloat = minYear + ((svgX - paddingLeft) / chartWidth) * yearRange;

        const closestP = data.reduce((p, c) =>
            Math.abs(c.year - yearFloat) < Math.abs(p.year - yearFloat) ? c : p);

        if (ttGroup) { svg.removeChild(ttGroup); ttGroup = null; }
        ttGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        ttGroup.setAttribute('pointer-events', 'none');

        const tx = scaleX(closestP.year);

        // Vertical guide line
        const vl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vl.setAttribute('x1', tx); vl.setAttribute('y1', paddingOther);
        vl.setAttribute('x2', tx); vl.setAttribute('y2', height - paddingOther);
        vl.setAttribute('stroke', isDark ? '#6b7280' : '#9ca3af');
        vl.setAttribute('stroke-width', '1');
        vl.setAttribute('stroke-dasharray', '4,2');
        ttGroup.appendChild(vl);

        // Primary dot
        const d1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        d1.setAttribute('cx', tx); d1.setAttribute('cy', scaleY(closestP.value));
        d1.setAttribute('r', '5');  d1.setAttribute('fill', chartColor);
        d1.setAttribute('stroke', isDark ? '#0d1117' : 'white'); d1.setAttribute('stroke-width', '2');
        ttGroup.appendChild(d1);

        const lines = [
            { text: `${currentCountry.name}: ${formatValue(closestP.value, currentMetric)} (${closestP.year})`, color: chartColor }
        ];

        if (isCompare && secondaryData) {
            const closestS = secondaryData.reduce((p, c) =>
                Math.abs(c.year - closestP.year) < Math.abs(p.year - closestP.year) ? c : p);
            const d2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            d2.setAttribute('cx', scaleX(closestS.year)); d2.setAttribute('cy', scaleY(closestS.value));
            d2.setAttribute('r', '4');  d2.setAttribute('fill', compareColor);
            d2.setAttribute('stroke', isDark ? '#0d1117' : 'white'); d2.setAttribute('stroke-width', '2');
            ttGroup.appendChild(d2);
            lines.push({ text: `${currentCompareCountry.name}: ${formatValue(closestS.value, currentMetric)} (${closestS.year})`, color: compareColor });
        }

        if (hasThird && tertiaryData) {
            const closestT = tertiaryData.reduce((p, c) =>
                Math.abs(c.year - closestP.year) < Math.abs(p.year - closestP.year) ? c : p);
            const d3 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            d3.setAttribute('cx', scaleX(closestT.year)); d3.setAttribute('cy', scaleY(closestT.value));
            d3.setAttribute('r', '4');  d3.setAttribute('fill', thirdColor);
            d3.setAttribute('stroke', isDark ? '#0d1117' : 'white'); d3.setAttribute('stroke-width', '2');
            ttGroup.appendChild(d3);
            lines.push({ text: `${currentCompareCountry2.name}: ${formatValue(closestT.value, currentMetric)} (${closestT.year})`, color: thirdColor });
        }

        const boxW = Math.max(150, lines.reduce((m, l) => Math.max(m, l.text.length * 6.8), 0) + 20);
        const boxH = 18 + lines.length * 18;
        let   boxX = svgX + 14;
        if (boxX + boxW > width - paddingOther) boxX = svgX - boxW - 14;
        boxX = Math.max(paddingLeft, Math.min(boxX, width - paddingOther - boxW));
        const boxY = paddingOther + 8;

        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', boxX); bg.setAttribute('y', boxY);
        bg.setAttribute('width', boxW); bg.setAttribute('height', boxH);
        bg.setAttribute('rx', '4');
        bg.setAttribute('fill',   isDark ? 'rgba(22,27,34,0.93)' : 'rgba(255,255,255,0.96)');
        bg.setAttribute('stroke', isDark ? '#30363d' : '#e5e7eb');
        bg.setAttribute('stroke-width', '1');
        ttGroup.appendChild(bg);

        lines.forEach(({ text, color }, i) => {
            const lt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            lt.setAttribute('x', boxX + 9);
            lt.setAttribute('y', boxY + 14 + i * 18);
            lt.setAttribute('fill',        color);
            lt.setAttribute('font-size',   '12');
            lt.setAttribute('font-family', 'IBM Plex Mono');
            lt.setAttribute('font-weight', i === 0 ? '600' : '500');
            lt.textContent = text;
            ttGroup.appendChild(lt);
        });

        svg.appendChild(ttGroup);
    });

    overlay.addEventListener('mouseleave', () => {
        if (ttGroup) { svg.removeChild(ttGroup); ttGroup = null; }
    });
}

// ── ARTICLE FILTER ───────────────────────────────────────────────
function filterArticles(topic) {
    const articles   = document.querySelectorAll('.article-card');
    const topicCards = document.querySelectorAll('.topic-card');

    topicCards.forEach(card => card.classList.remove('active-category'));
    if (topic !== 'all') {
        const clicked = document.querySelector(`.topic-card[data-topic="${topic}"]`);
        if (clicked) clicked.classList.add('active-category');
    }

    let visibleCount = 0;
    articles.forEach(article => {
        const articleTopics = (article.getAttribute('data-topic') || '').split(' ');
        if (topic === 'all' || articleTopics.includes(topic)) {
            article.style.display = 'block';
            article.style.opacity = '1';
            visibleCount++;
        } else {
            article.style.display = 'none';
        }
    });

    const counter = document.getElementById('articleCount');
    if (counter) {
        counter.textContent = topic === 'all'
            ? `(${visibleCount})`
            : `(${visibleCount} z ${articles.length})`;
    }
}

function addTopicBadges() {
    const topicCards = document.querySelectorAll('.topic-card');
    const articles   = document.querySelectorAll('.article-card');

    topicCards.forEach(card => {
        const topic = card.getAttribute('data-topic');
        if (!topic) return;

        let count = 0;
        articles.forEach(article => {
            const at = (article.getAttribute('data-topic') || '').split(' ');
            if (at.includes(topic)) count++;
        });

        if (count > 0) {
            const badge = document.createElement('span');
            badge.className = 'topic-badge';
            badge.textContent = count;
            card.appendChild(badge);
        }
    });
}

// EOF perspektiva-stats.js
