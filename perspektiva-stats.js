/* =============================================================
   perspektiva-stats.js
   Svět v perspektivě – Widget "Státy v datech"
   Obsahuje: vyhledávání zemí, statistiky, graf (SVG), filtrování článků
   Závislosti: perspektiva-data.js (musí být načteno dříve)
   Použití: <script src="perspektiva-data.js"></script>
            <script src="perspektiva-stats.js"></script>
   ============================================================= */

        let currentCountry = {code:'WLD',name:'Svět'};
        let currentMetric = 'life';

        document.addEventListener('DOMContentLoaded', () => {
            setupSearch();
            document.getElementById('countrySearch').value = 'Svět';
            loadCountryData('WLD','Svět');

            // Překreslit graf při přepnutí tématu
            new MutationObserver(() => updateChart())
                .observe(document.documentElement, { attributeFilter: ['class'] });
            
            // Initialize article counter
            filterArticles('all');
            
            // Add article count badges to topic cards
            addTopicBadges();

            // Sync hero čísla týdne with real data
            setTimeout(() => {
                const wldLife = getLatestValue('WLD', 'life');
                if (wldLife && document.getElementById('heroLifeExp')) {
                    document.getElementById('heroLifeExp').textContent = wldLife.value.toFixed(1);
                }
            }, 100);

            // Sync article list height with data section
            function syncArticleHeight() {
                const dataSection = document.querySelector('.data-section');
                const topicsSection = document.querySelector('.topics-section');
                const articleList = document.querySelector('.article-list');
                if (!dataSection || !topicsSection || !articleList) return;
                const dataSectionH = dataSection.offsetHeight;
                // Subtract: topics header + topic-grid + articles-header + margins
                const topicsHeader = topicsSection.querySelector('.topics-header');
                const topicGrid = topicsSection.querySelector('.topic-grid');
                const articlesHeader = topicsSection.querySelector('.articles-header');
                const usedH = (topicsHeader ? topicsHeader.offsetHeight : 0)
                            + (topicGrid ? topicGrid.offsetHeight : 0)
                            + (articlesHeader ? articlesHeader.offsetHeight : 0)
                            + 60; // gaps and margins
                articleList.style.maxHeight = Math.max(200, dataSectionH - usedH) + 'px';
            }
            setTimeout(syncArticleHeight, 200);
            window.addEventListener('resize', syncArticleHeight);
        });

        function setupSearch() {
            const searchInput = document.getElementById('countrySearch');
            const dropdown = document.getElementById('countryDropdown');

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
            
            // Sort alphabetically (Czech locale)
            filtered.sort((a, b) => a.name.localeCompare(b.name, 'cs'));

            // PRIORITIZE: Svět first, then Česko, then others
            const priority = ['WLD', 'CZE'];
            const prioritized = [];
            const rest = [];
            
            filtered.forEach(c => {
                if (priority.includes(c.code)) {
                    prioritized.push(c);
                } else {
                    rest.push(c);
                }
            });
            
            // Sort priority items by priority order
            prioritized.sort((a, b) => priority.indexOf(a.code) - priority.indexOf(b.code));
            
            const finalList = [...prioritized, ...rest];

            dropdown.innerHTML = finalList.map((c, index) => {
                // Add divider after priority countries (before first non-priority)
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
            currentCountry = {code, name};
            document.getElementById('countrySearch').value = name;
            document.getElementById('countryDropdown').classList.remove('active');
            loadCountryData(code, name);
        }

        function showChart(metric) {
            currentMetric = metric;
            
            // Update active state
            document.querySelectorAll('.stat-box').forEach(stat => {
                stat.classList.remove('active');
            });
            document.querySelector(`[data-metric="${metric}"]`).classList.add('active');

            // Update chart
            updateChart();
        }

        function getLatestValue(countryCode, metric) {
            if (!HISTORICAL_DATA[countryCode] || !HISTORICAL_DATA[countryCode][metric]) {
                return null;
            }
            
            const data = HISTORICAL_DATA[countryCode][metric];
            const years = Object.keys(data).map(Number).sort((a, b) => b - a);
            const latestYear = years[0];
            
            return {
                value: data[latestYear],
                year: latestYear
            };
        }

        function loadCountryData(countryCode, countryName) {
            document.getElementById('statsTitle').textContent = `Státy v datech – ${countryName}`;

            // Load life expectancy
            const life = getLatestValue(countryCode, 'life');
            if (life) {
                document.getElementById('lifeExpectancy').textContent = life.value.toFixed(1);
                document.getElementById('lifeExpYear').textContent = `Rok: ${life.year}`;
            }

            // Load literacy
            const literacy = getLatestValue(countryCode, 'literacy');
            if (literacy) {
                document.getElementById('literacy').textContent = Math.round(literacy.value) + '%';
                document.getElementById('literacyYear').textContent = `Rok: ${literacy.year}`;
            }

            // Load electricity access
            const electricity = getLatestValue(countryCode, 'electricity');
            if (electricity) {
                document.getElementById('electricity').textContent = Math.round(electricity.value) + '%';
                document.getElementById('electricityYear').textContent = `Rok: ${electricity.year}`;
            }

            // Load infant mortality
            const infant = getLatestValue(countryCode, 'infant');
            if (infant) {
                document.getElementById('infantMortality').textContent = infant.value.toFixed(1);
                document.getElementById('infantMortYear').textContent = `Rok: ${infant.year}`;
            }

            updateChart();
        }

        function updateChart() {
            const titles = {
                life: 'Očekávaná délka života (1960-2023)',
                literacy: 'Gramotnost dospělých (1975-2023)',
                electricity: 'Přístup k elektřině (1998-2023)',
                infant: 'Kojenecká úmrtnost (1990-2023)'
            };
            const sources = {
                life: 'Zdroj: World Bank – Life expectancy at birth (SP.DYN.LE00.IN), data.worldbank.org',
                literacy: 'Zdroj: World Bank / UNESCO – Adult literacy rate (SE.ADT.LITR.ZS), data.worldbank.org',
                electricity: 'Zdroj: World Bank – Access to electricity (EG.ELC.ACCS.ZS), data.worldbank.org',
                infant: 'Zdroj: World Bank / UN IGME – Infant mortality rate (SP.DYN.IMRT.IN), data.worldbank.org'
            };
            
            document.getElementById('chartTitle').textContent = titles[currentMetric];
            if (document.getElementById('chartSource')) {
                document.getElementById('chartSource').textContent = sources[currentMetric];
            }
            
            const chartData = getChartData(currentCountry.code, currentMetric);
            drawChart(chartData, 'dataChart');
        }

        function getChartData(countryCode, metric) {
            if (!HISTORICAL_DATA[countryCode] || !HISTORICAL_DATA[countryCode][metric]) {
                return [];
            }

            const data = HISTORICAL_DATA[countryCode][metric];
            return Object.entries(data)
                .map(([year, value]) => ({
                    year: parseInt(year),
                    value: value
                }))
                .sort((a, b) => a.year - b.year);
        }

        function drawChart(data, svgId) {
            const svg = document.getElementById(svgId);
            svg.innerHTML = '';

            // Barvy podle aktuálního tématu
            const isDark = document.documentElement.classList.contains('dark');
            const axisColor  = isDark ? '#8b949e' : '#374151';
            const gridColor  = isDark ? '#30363d' : '#4b5563';
            const emptyColor = isDark ? '#8b949e' : '#6b7280';

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

            const width = 700, height = 340, paddingLeft = 55, paddingOther = 30;
            const padding = paddingOther;
            const chartWidth = width - paddingLeft - paddingOther, chartHeight = height - 2 * paddingOther;

            const years = data.map(d => d.year);
            const minYear = Math.min(...years), maxYear = Math.max(...years);

            // FIXED SCALES for visual comparison across countries
            const fixedScales = {
                life: {min: 40, max: 90},
                literacy: {min: 0, max: 100},
                electricity: {min: 0, max: 100},
                infant: {min: 0, max: 150}
            };
            
            const paddedMin = fixedScales[currentMetric].min;
            const paddedMax = fixedScales[currentMetric].max;

            const scaleX = (year) => paddingLeft + ((year - minYear) / (maxYear - minYear)) * chartWidth;
            const scaleY = (value) => height - paddingOther - ((value - paddedMin) / (paddedMax - paddedMin)) * chartHeight;

            // Grid lines
            const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            gridGroup.setAttribute('opacity', isDark ? '0.6' : '0.3');

            for (let i = 0; i <= 4; i++) {
                const y = paddingOther + (chartHeight / 4) * i;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', paddingLeft);
                line.setAttribute('y1', y);
                line.setAttribute('x2', width - paddingOther);
                line.setAttribute('y2', y);
                line.setAttribute('stroke', gridColor);
                line.setAttribute('stroke-width', '1');
                gridGroup.appendChild(line);

                const value = paddedMax - (paddedMax - paddedMin) * (i / 4);
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', paddingLeft - 8);
                text.setAttribute('y', y + 5);
                text.setAttribute('text-anchor', 'end');
                text.setAttribute('fill', axisColor);
                text.setAttribute('font-size', '14');
                text.setAttribute('font-weight', '500');
                text.setAttribute('font-family', 'IBM Plex Mono');
                text.textContent = value.toFixed(1);
                gridGroup.appendChild(text);
            }

            // X-axis grid
            const numXTicks = Math.min(6, years.length);
            for (let i = 0; i <= numXTicks; i++) {
                const x = paddingLeft + (chartWidth / numXTicks) * i;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x);
                line.setAttribute('y1', paddingOther);
                line.setAttribute('x2', x);
                line.setAttribute('y2', height - paddingOther);
                line.setAttribute('stroke', gridColor);
                line.setAttribute('stroke-width', '1');
                gridGroup.appendChild(line);

                const year = Math.round(minYear + (maxYear - minYear) * (i / numXTicks));
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', height - paddingOther + 20);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('fill', axisColor);
                text.setAttribute('font-size', '14');
                text.setAttribute('font-weight', '500');
                text.setAttribute('font-family', 'IBM Plex Mono');
                text.textContent = year;
                gridGroup.appendChild(text);
            }

            svg.appendChild(gridGroup);

            // Gradient
            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const chartColor = isDark ? '#14b8a6' : '#0f766e';

            gradient.innerHTML = `<linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:${chartColor};stop-opacity:${isDark ? 0.45 : 0.3}"/><stop offset="100%" style="stop-color:${chartColor};stop-opacity:0"/></linearGradient>`;
            svg.appendChild(gradient);

            // Area under the curve
            let areaPath = `M ${scaleX(data[0].year)} ${height - paddingOther}`;
            data.forEach(d => {
                areaPath += ` L ${scaleX(d.year)} ${scaleY(d.value)}`;
            });
            areaPath += ` L ${scaleX(data[data.length - 1].year)} ${height - paddingOther} Z`;

            const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            area.setAttribute('d', areaPath);
            area.setAttribute('fill', 'url(#chartGradient)');
            svg.appendChild(area);

            // Line
            let linePath = '';
            data.forEach((d, i) => {
                linePath += `${i === 0 ? 'M' : ' L'} ${scaleX(d.year)} ${scaleY(d.value)}`;
            });

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            line.setAttribute('d', linePath);
            line.setAttribute('stroke', chartColor);
            line.setAttribute('stroke-width', '3');
            line.setAttribute('fill', 'none');
            svg.appendChild(line);

            // Y-axis label
            const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            yLabel.setAttribute('x', 20);
            yLabel.setAttribute('y', paddingOther - 10);
            yLabel.setAttribute('fill', axisColor);
            yLabel.setAttribute('font-size', '12');
            yLabel.setAttribute('font-weight', '500');
            yLabel.setAttribute('font-family', 'IBM Plex Sans');
            const labels = {life: 'Roky', literacy: '%', electricity: '%', infant: 'Na 1000'};
            yLabel.textContent = labels[currentMetric];
            svg.appendChild(yLabel);
        }

        // Filter articles by topic
        function filterArticles(topic) {
            const articles = document.querySelectorAll('.article-card');
            const topicCards = document.querySelectorAll('.topic-card');
            
            // Remove active from all topic cards
            topicCards.forEach(card => card.classList.remove('active-category'));
            
            if (topic !== 'all') {
                const clicked = document.querySelector(`.topic-card[data-topic="${topic}"]`);
                if (clicked) clicked.classList.add('active-category');
            }
            
            // Show/hide articles — supports multi-value data-topic (space separated)
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
            
            // Update article counter
            const counter = document.getElementById('articleCount');
            if (counter) {
                if (topic === 'all') {
                    counter.textContent = `(${visibleCount})`;
                } else {
                    counter.textContent = `(${visibleCount} z ${articles.length})`;
                }
            }
        }
        
        function addTopicBadges() {
            const topicCards = document.querySelectorAll('.topic-card');
            const articles = document.querySelectorAll('.article-card');
            
            topicCards.forEach(card => {
                const topic = card.getAttribute('data-topic');
                if (!topic) return;
                
                // Count articles matching this topic
                let count = 0;
                articles.forEach(article => {
                    const articleTopics = (article.getAttribute('data-topic') || '').split(' ');
                    if (articleTopics.includes(topic)) {
                        count++;
                    }
                });
                
                // Add badge if count > 0
                if (count > 0) {
                    const badge = document.createElement('span');
                    badge.className = 'topic-badge';
                    badge.textContent = count;
                    card.appendChild(badge);
                }
            });
        }

// EOF perspektiva-stats.js
