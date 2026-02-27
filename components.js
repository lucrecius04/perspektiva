/* =============================================================
   Svět v perspektivě – Sdílené záhlaví a zápatí
   Změna zde = změna na VŠECH stránkách automaticky.
   ============================================================= */

(function () {

  var css = `
    html {
      height: 100%;
    }
    body {
      font-family: var(--font-sans);
      background: var(--color-bg);
      color: var(--color-text);
      line-height: 1.6;
      display: flex;
      flex-direction: column;
      min-height: 100%;
      margin: 0;
    }
    header {
      background: #1e293b;
      border-bottom: 1px solid #334155;
      position: sticky;
      top: 0;
      z-index: 100;
      height: 96px;
    }
    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 2rem;
      height: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 1rem;
      text-decoration: none;
      flex-shrink: 0;
    }
    .logo-icon { height: 90px; width: 90px; flex-shrink: 0; }
    .logo-text { display: flex; flex-direction: column; gap: 0; }
    .logo-title {
      font-family: 'IBM Plex Serif', serif;
      font-size: 2.4rem; font-weight: 700; color: #ffffff; line-height: 1;
    }
    .logo-subtitle {
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 0.78rem; font-weight: 400; color: #94a3b8;
      line-height: 1; letter-spacing: 0.04em; margin-top: 7px;
    }
    .header-right { display: flex; align-items: center; gap: 2rem; }
    nav ul { display: flex; gap: 2.5rem; list-style: none; margin: 0; padding: 0; }
    nav a { color: #e2e8f0; text-decoration: none; font-size: 0.95rem; font-weight: 500; transition: color 0.2s; }
    nav a:hover { color: #60a5fa; }
    nav a.nav-active { color: #60a5fa; }

    .theme-toggle {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.5rem;
      padding: 0.5rem;
      border-radius: 50%;
      transition: background 0.2s;
    }
    .theme-toggle:hover { background: rgba(255,255,255,0.1); }

    footer { 
      background: #1a1a1a; 
      color: #9ca3af; 
      padding: 3rem 0; 
      margin-top: auto;
    }
    .footer-content {
      max-width: 1400px; margin: 0 auto; padding: 0 2rem;
      display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 3rem;
    }
    .footer-brand { font-family: 'IBM Plex Serif', serif; font-size: 1.5rem; font-weight: 700; color: white; margin-bottom: 1rem; }
    .footer-description { font-size: 0.95rem; line-height: 1.6; }
    .footer-section h4 { color: white; font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }
    .footer-links { list-style: none; }
    .footer-links li { margin-bottom: 0.5rem; }
    .footer-links a { color: #9ca3af; text-decoration: none; font-size: 0.95rem; transition: color 0.2s; }
    .footer-links a:hover { color: white; }
    .footer-bottom { max-width: 1400px; margin: 2rem auto 0; padding: 2rem 2rem 0; border-top: 1px solid #374151; text-align: center; font-size: 0.875rem; }
    /* ── HAMBURGER TLAČÍTKO ── */
    .nav-hamburger {
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 4px;
      width: 34px;
      height: 34px;
      padding: 0;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      cursor: pointer;
      border-radius: 8px;
      transition: background 0.2s, border-color 0.2s;
      flex-shrink: 0;
    }
    .nav-hamburger:hover {
      background: rgba(255,255,255,0.13);
      border-color: rgba(96,165,250,0.4);
    }
    .nav-hamburger span {
      display: block;
      width: 16px;
      height: 1.5px;
      background: #cbd5e1;
      border-radius: 2px;
      transition: transform 0.28s ease, opacity 0.28s ease, width 0.28s ease;
      transform-origin: center;
    }
    header.nav-open .nav-hamburger span:nth-child(1) { transform: translateY(5.5px) rotate(45deg); width: 18px; }
    header.nav-open .nav-hamburger span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    header.nav-open .nav-hamburger span:nth-child(3) { transform: translateY(-5.5px) rotate(-45deg); width: 18px; }

    /* ── MOBILNÍ NAV PANEL ── */
    .mobile-nav-panel {
      display: none;
      position: fixed;
      left: 0; right: 0;
      top: 64px;
      background: #1e293b;
      border-bottom: 1px solid rgba(51,65,85,0.8);
      z-index: 99;
      transform: translateY(-4px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.2s ease, opacity 0.2s ease;
      box-shadow: 0 4px 16px rgba(0,0,0,0.35);
    }
    .mobile-nav-panel ul {
      list-style: none; margin: 0; padding: 0.2rem 0 0.3rem;
      display: flex; flex-direction: column;
    }
    .mobile-nav-panel ul li {
      border-bottom: 1px solid rgba(51,65,85,0.4);
    }
    .mobile-nav-panel ul li:last-child { border-bottom: none; }
    .mobile-nav-panel ul a {
      display: block;
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 500;
      padding: 0.55rem 1.25rem;
      transition: color 0.15s, background 0.15s;
      letter-spacing: 0.02em;
    }
    .mobile-nav-panel ul a:hover { color: #e2e8f0; background: rgba(255,255,255,0.04); }
    .mobile-nav-panel ul a.nav-active { color: #60a5fa; }

    header.nav-open .mobile-nav-panel {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    /* ── OVERLAY pro zavření menu kliknutím mimo ── */
    .mobile-nav-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      z-index: 98;
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
    }
    header.nav-open ~ .mobile-nav-overlay { display: block; }

    /* ── FOOTER ── */
    @media (max-width: 1024px) { .footer-content { grid-template-columns: 1fr 1fr; } }

    /* ── GLOBÁLNÍ OVERFLOW FIX ── */
    @media (max-width: 768px) {
      html { overflow-x: hidden; }
      body { overflow-x: hidden; max-width: 100vw; }
    }

    /* ── MOBILNÍ HEADER ── */
    @media (max-width: 768px) {
      nav { display: none; }
      .nav-hamburger { display: flex; }
      header { height: 68px; }
      .header-content { padding: 0 0.875rem; gap: 0; }
      .header-right { gap: 0.4rem; flex-shrink: 0; }
      .logo { gap: 0.55rem; flex-shrink: 1; min-width: 0; overflow: hidden; }
      .logo-icon { height: 48px !important; width: 48px !important; flex-shrink: 0; }
      .logo-title { font-size: 1.05rem !important; line-height: 1.15; white-space: nowrap; }
      .logo-subtitle { font-size: 0.6rem !important; margin-top: 3px !important; display: block !important; color: #94a3b8 !important; opacity: 1 !important; white-space: nowrap; }
      .logo-text { display: flex !important; flex-direction: column !important; min-width: 0; }
      .theme-toggle { font-size: 1.2rem !important; padding: 0.3rem !important; }
      .mobile-nav-panel { display: block; top: 68px; }
    }
    @media (max-width: 380px) {
      header { height: 64px; }
      .logo-icon { height: 42px !important; width: 42px !important; }
      .logo-title { font-size: 0.95rem !important; }
      .logo-subtitle { display: block !important; font-size: 0.55rem !important; }
      .mobile-nav-panel { top: 64px; }
    }
    @media (max-width: 600px) {
      .footer-content { grid-template-columns: 1fr; gap: 1.5rem; }
      .footer-bottom { margin-top: 1.5rem; }
    }
  `;

  /* --- URL detekce stránky --- */
  var path = window.location.pathname;
  var isArticle   = path.indexOf('clanek.html') !== -1;
  var isOProjectu = path.indexOf('o-projektu')     !== -1;
  var isArchiv    = path.indexOf('archiv')           !== -1;
  var isOffHome   = isArticle || isOProjectu || isArchiv;

  // Používáme kořenové cesty pro absolutní spolehlivost
  var root = window.location.origin + '/';
  var homeUrl    = isOffHome ? 'index.html' : '#home';
  var temaUrl    = isOffHome ? 'index.html#temata' : '#temata';
  var dataUrl    = isOffHome ? 'index.html#klicove-statistiky' : '#klicove-statistiky';
  var archivUrl  = 'archiv.html';
  var projektUrl = 'o-projektu.html';
  var kontaktUrl = 'o-projektu.html#kontakt';
  var navActiveOProj  = isOProjectu ? ' class="nav-active"' : '';
  var navActiveArchiv = isArchiv    ? ' class="nav-active"' : '';
  var navActiveOProj  = isOProjectu ? ' class="nav-active"' : '';
  var navActiveArchiv = isArchiv    ? ' class="nav-active"' : '';

  var headerHTML = '<div class="header-content">'
    + '<a href="' + homeUrl + '" class="logo">'
    +   '<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 48 48" class="logo-icon" aria-label="Logo">'
    + '<circle cx="24" cy="24" r="21" fill="#0c1a2e"/>'
    + '<line x1="24" y1="29" x2="7"  y2="46" stroke="#60a5fa" stroke-width="1"/>'
    + '<line x1="24" y1="29" x2="15" y2="46" stroke="#60a5fa" stroke-width="1"/>'
    + '<line x1="24" y1="29" x2="24" y2="46" stroke="#60a5fa" stroke-width="1.1"/>'
    + '<line x1="24" y1="29" x2="33" y2="46" stroke="#60a5fa" stroke-width="1"/>'
    + '<line x1="24" y1="29" x2="41" y2="46" stroke="#60a5fa" stroke-width="1"/>'
    + '<circle cx="24" cy="24" r="21" fill="none" stroke="#60a5fa" stroke-width="1.5"/>'
    + '<line x1="3"  y1="29" x2="45" y2="29" stroke="#60a5fa" stroke-width="1.2"/>'
    + '<rect x="8"    y="18" width="4" height="10" rx="1"   fill="#60a5fa"/>'
    + '<rect x="15"   y="13" width="4" height="15" rx="1"   fill="#60a5fa"/>'
    + '<rect x="21.5" y="8"  width="5" height="20" rx="1.5" fill="#ffffff"/>'
    + '<rect x="29"   y="15" width="4" height="13" rx="1"   fill="#60a5fa"/>'
    + '<rect x="36"   y="20" width="4" height="8"  rx="1"   fill="#60a5fa"/>'
    + '</svg>'
    +   '<div class="logo-text">'
    +     '<span class="logo-title">Sv\u011bt v perspektiv\u011b</span>'
    +     '<span class="logo-subtitle">Data \u00b7 Kontext \u00b7 Souvislosti</span>'
    +   '</div>'
    + '</a>'
    + '<div class="header-right">'
    + '<nav><ul>'
    +   '<li><a href="' + homeUrl + '">Dom\u016f</a></li>'
    +   '<li><a href="' + temaUrl + '">T\xe9mata</a></li>'
    +   '<li><a href="' + dataUrl + '">Data</a></li>'
    +   '<li><a href="' + archivUrl + '"'  + navActiveArchiv + '>Archiv</a></li>'
    +   '<li><a href="' + projektUrl + '"'  + navActiveOProj  + '>O projektu</a></li>'
    + '</ul></nav>'
    + '<button class="theme-toggle" id="themeToggle" title="P\u0159epnout tmav\xfd re\u017eim" aria-label="P\u0159epnout tmav\xfd re\u017eim">\uD83C\uDF19</button>'
    + '<button class="nav-hamburger" id="navHamburger" aria-label="Otev\u0159\xedt menu" aria-expanded="false">'
    +   '<span></span><span></span><span></span>'
    + '</button>'
    + '</div>'
    + '</div>'
    + '<nav class="mobile-nav-panel" id="mobileNavPanel">'
    + '<ul>'
    +   '<li><a href="' + homeUrl + '">Dom\u016f</a></li>'
    +   '<li><a href="' + temaUrl + '">T\xe9mata</a></li>'
    +   '<li><a href="' + dataUrl + '">Data</a></li>'
    +   '<li><a href="' + archivUrl + '"'  + navActiveArchiv + '>Archiv</a></li>'
    +   '<li><a href="' + projektUrl + '"'  + navActiveOProj  + '>O projektu</a></li>'
    + '</ul>'
    + '</nav>'
    + '<div class="mobile-nav-overlay" id="navOverlay"></div>';

  var footerHTML = '<div class="footer-content">'
    + '<div>'
    +   '<div class="footer-brand">Sv\u011bt v perspektiv\u011b</div>'
    +   '<p class="footer-description">Data-driven zpravodajstv\xed o glob\xe1ln\xedm pokroku. \u010c\xedsla vs. medi\xe1ln\xed obrazy.</p>'
    + '</div>'
    + '<div class="footer-section"><h4>Navigace</h4><ul class="footer-links">'
    +   '<li><a href="' + homeUrl + '">Dom\u016f</a></li>'
    +   '<li><a href="' + temaUrl + '">T\xe9mata</a></li>'
    +   '<li><a href="' + dataUrl + '">Data</a></li>'
    +   '<li><a href="' + projektUrl + '">O projektu</a></li>'
    + '</ul></div>'
    + '<div class="footer-section"><h4>Zdroje dat</h4><ul class="footer-links">'
    +   '<li><a href="https://data.worldbank.org/" target="_blank">World Bank</a></li>'
    +   '<li><a href="https://ourworldindata.org/" target="_blank">Our World in Data</a></li>'
    +   '<li><a href="https://data.un.org/" target="_blank">UN Data</a></li>'
    +   '<li><a href="https://www.who.int/data" target="_blank">WHO</a></li>'
    + '</ul></div>'
    + '<div class="footer-section"><h4>Informace</h4><ul class="footer-links">'
    +   '<li><a href="' + projektUrl + '">O projektu</a></li>'
    +   '<li><a href="' + kontaktUrl + '">Kontakt</a></li>'
    + '</ul></div>'
    + '</div>'
    + '<div class="footer-bottom">'
    +   '&copy; 2026 Sv\u011bt v perspektiv\u011b. Data z ve\u0159ejn\xfdch zdroj\u016f. AI asistovan\xfd obsah. Experiment\xe1ln\xed provoz.<br>'
    +   '<span style="font-size: 0.8rem; opacity: 0.7;">Data aktualizov\xe1na: \xfanor 2026</span>'
    + '</div>';

  /* --- Injektujeme styly a obsah --- */
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var existingHeader = document.querySelector('header');
  if (existingHeader) {
    existingHeader.innerHTML = headerHTML;
  } else {
    var h = document.createElement('header');
    h.innerHTML = headerHTML;
    document.body.insertBefore(h, document.body.firstChild);
  }

  var existingFooter = document.querySelector('footer');
  if (existingFooter) {
    existingFooter.innerHTML = footerHTML;
  } else {
    var f = document.createElement('footer');
    f.innerHTML = footerHTML;
    document.body.appendChild(f);
  }

  /* ── DARK MODE ── */
  var STORAGE_KEY = 'svp-theme';
  var html = document.documentElement;

  function applyTheme(dark) {
    html.classList.toggle('dark', dark);
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.textContent = dark ? '\u2600\uFE0F' : '\uD83C\uDF19';
      btn.title = dark ? 'P\u0159epnout sv\u011btl\xfd re\u017eim' : 'P\u0159epnout tmav\xfd re\u017eim';
      btn.setAttribute('aria-label', btn.title);
    }
  }

  function getInitialTheme() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark')  return true;
    if (stored === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // Okamžitá aplikace ještě před vykreslením → žádné probliknutí
  applyTheme(getInitialTheme());

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getInitialTheme());
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', function () {
        var next = !html.classList.contains('dark');
        localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
        applyTheme(next);
      });
    }

    /* ── HAMBURGER MENU ── */
    var hamburger = document.getElementById('navHamburger');
    var overlay   = document.getElementById('navOverlay');
    var headerEl  = document.querySelector('header');

    function openNav() {
      if (!headerEl) return;
      // Ulož aktuální scroll pozici a zamkni body
      var scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + scrollY + 'px';
      document.body.style.width = '100%';
      document.body.dataset.scrollY = scrollY;
      headerEl.classList.add('nav-open');
      if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
    }
    function closeNav() {
      if (!headerEl) return;
      // Obnov scroll pozici
      var scrollY = parseInt(document.body.dataset.scrollY || '0');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
      headerEl.classList.remove('nav-open');
      if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    }
    function toggleNav() {
      if (headerEl && headerEl.classList.contains('nav-open')) closeNav();
      else openNav();
    }

    if (hamburger) hamburger.addEventListener('click', toggleNav);
    if (overlay)   overlay.addEventListener('click', closeNav);

    /* Zavři menu při kliku na nav odkaz */
    var mobilePanel = document.getElementById('mobileNavPanel');
    if (mobilePanel) {
      mobilePanel.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') closeNav();
      });
    }

    /* Zavři menu při resize nad 768px */
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768) closeNav();
    });

    /* ── COUNTRY DROPDOWN TOGGLE: zavři při druhém kliknutí ── */
    var csInput = document.getElementById('countrySearch');
    var csDrop  = document.getElementById('countryDropdown');
    if (csInput && csDrop) {
      csInput.addEventListener('mousedown', function(e) {
        /* Pokud je dropdown viditelný, označ ho před tím než focus handler od stats.js ho otevře */
        csInput._wasOpen = csDrop.classList.contains('active');
      });
      csInput.addEventListener('click', function(e) {
        if (csInput._wasOpen) {
          csDrop.classList.remove('active');
          csInput.blur();
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    }
  });

})();
