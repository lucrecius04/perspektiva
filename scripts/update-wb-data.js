#!/usr/bin/env node
/**
 * scripts/update-wb-data.js
 * Svět v perspektivě – WB Data Updater
 *
 * Stáhne aktuální data z World Bank API (+ OWID pro HDI) pro všechny země
 * widgetu a uloží je do statických souborů v data/:
 *   - data/wb-latest.json        (nejnovější hodnoty, ~30 KB)
 *   - data/wb-series-{m}.json    (historické řady, ~50–190 KB každý)
 *
 * Spuštění: node scripts/update-wb-data.js
 * Vyžaduje: Node 18+ (bez externích závislostí)
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── Konfigurace zemí (shodné s ALL_COUNTRIES v perspektiva-data.js) ────
const COUNTRY_CODES = new Set([
    'WLD','AFG','ALB','DZA','ARG','AUS','AUT','BEL','BGD','BGR',
    'BOL','BRA','CAN','CHE','CHL','CHN','COL','CZE','DEU','DNK',
    'DOM','ECU','EGY','ESP','EST','ETH','FIN','FRA','GBR','GRC',
    'GTM','HND','HRV','HUN','IDN','IND','IRL','IRN','IRQ','ISL',
    'ISR','ITA','JAM','JPN','KEN','KOR','LTU','LVA','MAR','MEX',
    'MYS','NGA','NIC','NLD','NOR','NZL','PAK','PER','PHL','POL',
    'PRT','ROU','RUS','SAU','SGP','SRB','SVK','SVN','SWE','THA',
    'TUR','UKR','USA','VEN','VNM','ZAF',
]);

// ── Metriky ke stažení ────────────────────────────────────────────────
// source: 'wb'   → World Bank API (výchozí)
// source: 'owid' → Our World in Data CSV (pro HDI)
const METRICS = [
    { key: 'pop_growth',   source: 'wb',   wbId: 'SP.POP.GROW',       scale: null  },
    { key: 'gdp',          source: 'wb',   wbId: 'NY.GDP.PCAP.CD',    scale: null  },
    { key: 'gdp_growth',   source: 'wb',   wbId: 'NY.GDP.MKTP.KD.ZG', scale: null  },
    { key: 'inflation',    source: 'wb',   wbId: 'FP.CPI.TOTL.ZG',    scale: null  },
    { key: 'unemployment', source: 'wb',   wbId: 'SL.UEM.TOTL.ZS',    scale: null  },
    { key: 'population',   source: 'wb',   wbId: 'SP.POP.TOTL',        scale: 1e-6  }, // → miliony
    { key: 'density',      source: 'wb',   wbId: 'EN.POP.DNST',        scale: null  },
    { key: 'hdi',          source: 'owid', owidUrl: 'https://ourworldindata.org/grapher/human-development-index.csv', owidCol: 'Human Development Index' },
    { key: 'democracy',    source: 'wb',   wbId: 'VA.EST',              scale: null  },
    { key: 'democracy_eiu', source: 'owid', owidUrl: 'https://ourworldindata.org/grapher/democracy-index-eiu.csv', owidCol: 'Democracy Index' },
    { key: 'fertility',    source: 'wb',   wbId: 'SP.DYN.TFRT.IN',      scale: null  },
    { key: 'gini',         source: 'wb',   wbId: 'SI.POV.GINI',          scale: null  },
    { key: 'urbanization', source: 'wb',   wbId: 'SP.URB.TOTL.IN.ZS',   scale: null  },
];

const DATA_DIR = path.join(__dirname, '..', 'data');
const TODAY    = new Date().toISOString().slice(0, 10);

// ── HTTP helpers ────────────────────────────────────────────────────────
function fetchText(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'Accept': '*/*', 'User-Agent': 'Node.js/wb-updater' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // Sleduj redirect
                return fetchText(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                res.resume();
                return;
            }
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(body));
        }).on('error', reject);
    });
}

function fetchJSON(url) {
    return fetchText(url).then(body => {
        try { return JSON.parse(body); }
        catch(e) { throw new Error(`JSON parse error: ${e.message}\nURL: ${url}\nBody: ${body.slice(0, 300)}`); }
    });
}

// ── Stáhnout z World Bank API ──────────────────────────────────────────
async function fetchFromWB(metric) {
    const { key, wbId, scale } = metric;
    const url = `https://api.worldbank.org/v2/country/all/indicator/${wbId}?format=json&per_page=20000`;

    const json = await fetchJSON(url);

    if (!json[1] || !Array.isArray(json[1])) {
        console.warn(`  WARN: žádná data pro ${key} (${wbId})`);
        return {};
    }

    const meta = json[0];
    if (meta.pages > 1) {
        console.warn(`  WARN: ${key} má ${meta.pages} stránek (${meta.total} záznamů) — zvyšte per_page!`);
    }

    const byCountry = {};
    for (const row of json[1]) {
        const code = row.countryiso3code || (row.country && row.country.id);
        if (!code || !COUNTRY_CODES.has(code)) continue;
        if (row.value === null || row.value === undefined) continue;

        const year  = parseInt(row.date, 10);
        if (isNaN(year)) continue;

        const value = scale ? row.value * scale : row.value;

        if (!byCountry[code]) byCountry[code] = [];
        byCountry[code].push({ year, value });
    }

    for (const code of Object.keys(byCountry)) {
        byCountry[code].sort((a, b) => a.year - b.year);
    }
    return byCountry;
}

// ── Stáhnout z Our World in Data CSV ─────────────────────────────────
async function fetchFromOWID(metric) {
    const { key, owidUrl, owidCol } = metric;
    const csv = await fetchText(owidUrl);

    const lines  = csv.split('\n');
    const header = lines[0].split(',');
    const codeIdx = header.indexOf('Code');
    const yearIdx = header.indexOf('Year');
    const valIdx  = header.indexOf(owidCol);

    if (codeIdx < 0 || yearIdx < 0 || valIdx < 0) {
        throw new Error(`CSV pro ${key}: chybí sloupce. Hlavička: ${header.join(', ')}`);
    }

    const byCountry = {};
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length < Math.max(codeIdx, yearIdx, valIdx) + 1) continue;

        const code  = cols[codeIdx].trim();
        if (!code || !COUNTRY_CODES.has(code)) continue;

        const year  = parseInt(cols[yearIdx].trim(), 10);
        const value = parseFloat(cols[valIdx].trim());
        if (isNaN(year) || isNaN(value)) continue;

        if (!byCountry[code]) byCountry[code] = [];
        byCountry[code].push({ year, value });
    }

    for (const code of Object.keys(byCountry)) {
        byCountry[code].sort((a, b) => a.year - b.year);
    }
    return byCountry;
}

// ── Hlavní funkce ──────────────────────────────────────────────────────
async function main() {
    console.log('╔══════════════════════════════════════╗');
    console.log('║  Svět v perspektivě – WB Data Update ║');
    console.log('╚══════════════════════════════════════╝');
    console.log(`Datum:   ${TODAY}`);
    console.log(`Výstup:  ${DATA_DIR}`);
    console.log(`Metriky: ${METRICS.map(m => m.key).join(', ')}`);
    console.log('');

    const latestData = { _generated: TODAY };
    let errors = 0;

    for (const metric of METRICS) {
        process.stdout.write(`[${METRICS.indexOf(metric) + 1}/${METRICS.length}] ${metric.key.padEnd(14)} `);

        let byCountry;
        try {
            byCountry = metric.source === 'owid'
                ? await fetchFromOWID(metric)
                : await fetchFromWB(metric);
        } catch(e) {
            console.error(`CHYBA: ${e.message}`);
            errors++;
            continue;
        }

        const countryCount = Object.keys(byCountry).length;
        const totalPoints  = Object.values(byCountry).reduce((s, a) => s + a.length, 0);

        // Zapsat wb-series-{metric}.json
        const seriesOutput = { _generated: TODAY, _metric: metric.key };
        for (const code of COUNTRY_CODES) {
            if (byCountry[code] && byCountry[code].length > 0) {
                seriesOutput[code] = byCountry[code];
            }
        }
        const seriesPath = path.join(DATA_DIR, `wb-series-${metric.key}.json`);
        fs.writeFileSync(seriesPath, JSON.stringify(seriesOutput), 'utf8');

        // Akumulovat nejnovější hodnoty do latestData
        for (const [code, series] of Object.entries(byCountry)) {
            const latest = series[series.length - 1];
            if (!latestData[code]) latestData[code] = {};
            latestData[code][metric.key] = { v: latest.value, y: latest.year };
        }

        const sizeKB = Math.round(fs.statSync(seriesPath).size / 1024);
        const src    = metric.source === 'owid' ? 'OWID' : 'WB  ';
        console.log(`OK [${src}]  ${countryCount} zemí, ${totalPoints} bodů → ${sizeKB} KB`);

        // Zdvořilá prodleva mezi API voláními
        await new Promise(r => setTimeout(r, 300));
    }

    // Zapsat wb-latest.json
    const latestPath = path.join(DATA_DIR, 'wb-latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(latestData), 'utf8');
    const latestKB = Math.round(fs.statSync(latestPath).size / 1024);
    console.log('');
    console.log(`✓ wb-latest.json      → ${latestKB} KB`);

    if (errors > 0) {
        console.warn(`\n⚠ Dokončeno s ${errors} chybami.`);
        process.exit(1);
    } else {
        console.log(`\n✓ Vše dokončeno bez chyb.`);
    }
}

main().catch(e => { console.error('Fatální chyba:', e); process.exit(1); });
