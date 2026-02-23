# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Svět v perspektivě** is a static data-journalism website in Czech, deployed on Netlify. It uses no frameworks — pure HTML5, CSS3 (CSS variables), and Vanilla JS (ES6+). Content is data-driven, sourced from static JSON files.

## Development

This is a purely static site — no build step, no package manager. Open the HTML files directly in a browser, or use any static server:

```bash
# Simple local server (Python)
python -m http.server 8000

# Or any other static server (npx serve, VS Code Live Server, etc.)
```

There are no tests, no linting setup, and no CI beyond Netlify deployment (configured in `netlify.toml`).

## Architecture

### Content Flow

1. `data/manifest.json` — ordered list of published article slugs (determines homepage display order)
2. `articles/<slug>.json` — individual article data files
3. `data/categories.json` — topic definitions (10 fixed tags, with colors and SVG icons)
4. `data/debunker.json` — rotating "Myth vs. Data" cards in the hero section

Article pages are driven by `clanek.html`, which reads the `?slug=` query parameter and fetches the corresponding JSON from `articles/`.

### JS Architecture

- `components.js` — injects the shared `<header>` and `<footer>` into all pages (including nav, logo, dark mode toggle). Loaded last on every page.
- `perspektiva-stats.js` — SVG chart rendering for the "States in Data" section (World Bank data visualization)
- `perspektiva-data.js` — large static data object with historical World Bank indicators (life expectancy, literacy, etc.)
- Inline `<script>` blocks in each HTML file handle page-specific initialization

### CSS

- `perspektiva-theme.css` — single source for all CSS custom properties (colors, fonts, shadows). Defines both light and dark mode variables. Dark mode is applied via `.dark` class on `<html>`.
- Anti-flash script in each HTML `<head>` applies `.dark` before rendering based on `localStorage('svp-theme')`.

## Adding Articles

1. Create `articles/<slug>.json` using `articles/paradox-globalni-bezpecnosti.json` as the master template
2. Add the slug to `data/manifest.json` (position in array = display order on homepage)

### Article JSON rules

- **Topics:** Use only the 10 allowed slugs from `data/categories.json`: `zdraví`, `ekonomika`, `inovace`, `energie`, `bezpečnost`, `demokracie`, `výzvy`, `mýty`, `česko`, `svět`. Tags must match exactly including diacritics.
- **Tag order:** `česko` and `svět` always go **last** in the `topics` array. Primary thematic tags (e.g. `demokracie`, `ekonomika`) come first.
- **`title_short`:** Required when `title` is long — used on article cards on the homepage (no ellipsis).
- **`key_stats[0]`:** Always a single stat + short label. For `mýty` articles: verdict (`Pravda`/`Nepravda`/`Zavádějící`) with colors `good`/`bad`/`warning`.
- **`key_stats[].color`:** Use `good` (green), `bad` (red), or `neutral`/`warning` (blue/orange).
- **`sources`:** List sources only in the `sources` array — never duplicate into `content` HTML. The component renders them automatically.
- **`share_card`:** Required object. First stats column is 230px wide — keep values/labels short enough to avoid overlap.
- **`status`:** Must be `"published"` to appear on the site.
- File encoding: UTF-8 (critical for Czech diacritics).

### Highlight boxes in `content` HTML

Use these CSS classes for callout boxes:
- `.highlight-box.hb-blue` — blue/info
- `.highlight-box.hb-green` — green/positive
- `.highlight-box.hb-red` — red/warning

### Inline bar charts in `content` HTML

Standard pattern for chart containers (matches dark mode overrides in `clanek.html`):

```html
<div style="background:#f8f9fa;border-radius:8px;padding:1.2rem 1.5rem;margin:1.5rem 0;border:1px solid #e9ecef;">
  <p style="font-weight:700;margin-bottom:0.2rem;color:#333;font-size:0.95rem;">Název grafu</p>
  <p style="font-size:0.78rem;color:#555;margin-bottom:1.25rem;">Podnázev · Zdroj: ...</p>
  <!-- bar row -->
  <div style="margin-bottom:0.7rem;">
    <div style="display:flex;align-items:center;gap:0.75rem;">
      <span style="font-size:0.82rem;color:#555;width:195px;flex-shrink:0;">Popisek</span>
      <div style="flex:1;background:#dee2e6;border-radius:4px;height:22px;overflow:hidden;">
        <div style="background:#27ae60;height:100%;width:50%;border-radius:4px;"></div>
      </div>
      <span style="font-size:0.85rem;font-weight:700;color:#333;width:44px;text-align:right;">42</span>
    </div>
  </div>
</div>
```

Dark-mode-safe bar colors (already overridden in `clanek.html`): `#27ae60`, `#2980b9`, `#e67e22`, `#c0392b`, `#e74c3c`. Track color: `#dee2e6`. Background: `#f8f9fa`.

### `share_card.stats` labels

Labels should be **descriptive and contextual**, not just short slugs — see `globalni-emise-zpomaleni.json` for reference style. Example: `"světové populace dnes žije v autokraciích — úroveň jako v roce 1985"` instead of just `"světové populace v autokraciích"`.

### Dark mode for inline chart styles

If article `content` contains inline styles (e.g., chart divs with `background:#f8f9fa`), `clanek.html` already has override rules for common colors. If new inline colors are added, add corresponding dark-mode overrides in `clanek.html`'s `<style>` block using `html.dark .article-body ... { ... !important }`.

## JSON Authoring — Pitfalls

### Quote escaping in `content`
The `content` field is a JSON string containing HTML. Any ASCII double quote `"` (U+0022) inside it **must** be escaped as `\"`. This applies to:
- HTML attribute values: `style=\"...\"`, `class=\"...\"`
- Inline quotation marks in article text — **use Czech typographic quotes instead**: `„opening"` (U+201E) and `"closing"` (U+201C), which are safe in JSON without escaping.

Never use raw ASCII `"` for quotation marks in article prose — rephrase or use typographic alternatives.

### Validating JSON after writing
Always validate immediately after creating or editing a JSON file:
```bash
node -e "JSON.parse(require('fs').readFileSync('articles/<slug>.json','utf8')); console.log('OK')"
```

### Never use PowerShell to read/write article files
PowerShell's `WriteAllText` with `[System.Text.Encoding]::UTF8` adds a UTF-8 BOM, which breaks JSON parsing. Use the Write/Edit tools exclusively for file operations. PowerShell is only acceptable for targeted in-place string replacement when the Write tool cannot be used.

## Critical Rules

- **Never delete content without explicit instruction** — no words, paragraphs, or sources.
- **Never use inline styles** unless required for dynamic calculations (graphs).
- **Never add external libraries** without explicit request.
- **Never modify beyond what's asked** — no unsolicited design or content improvements.
- **When reading truncated files:** Do not use truncated content to overwrite files. Read to completion using offset/limit before writing.
- **Before writing JSON:** Verify file size hasn't unexpectedly shrunk.
