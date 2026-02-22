# Projekt Perspektiva – Technická dokumentace

Tento soubor slouží jako hlavní kontext pro AI asistenty (Gemini CLI) při práci na tomto projektu. Obsahuje technologický stack, strukturu a pravidla pro modifikaci kódu.

## 🛠 Technologický stack
*   **Frontend:** Čisté HTML5, CSS3 (Moderní proměnné, Flexbox, Grid) a Vanilla JavaScript (ES6+).
*   **Frameworky:** Žádné (No-framework approach).
*   **Datová vrstva:** Statické JSON soubory (`data/`, `articles/`).
*   **Grafy:** Vlastní SVG vykreslování (v `perspektiva-stats.js`).
*   **Ikony:** Inline SVG (definované v `data/categories.json` nebo přímo v HTML).
*   **Písmo:** IBM Plex (Serif, Sans, Mono) z Google Fonts.

## 📂 Struktura projektu
*   `/articles/`: Jednotlivé články v JSON formátu. Každý článek má slug, titulek, perex, text a metadata.
*   `/data/`:
    *   `manifest.json`: Seznam slugů publikovaných článků (určuje pořadí a viditelnost).
    *   `categories.json`: Definice témat, barev a ikon pro rozcestník.
    *   `debunker.json`: Data pro rotující sekci "Mýtus vs. Data" na úvodní straně.
*   `perspektiva-data.js`: Velký statický objekt s historickými daty Světové banky (Life expectancy, Literacy atd.).
*   `perspektiva-theme.css`: Centrální CSS s definicí barevných schémat (Light/Dark mode) pomocí CSS proměnných.
*   `index.html`: Hlavní šablona webu.
*   `clanek.html`: Dynamická šablona pro zobrazení obsahu z JSONu v `/articles/`.

## 📜 Instrukce pro úpravy kódu

### 1. Přidávání obsahu
*   Při přidání článku vytvoř nový `.json` v `/articles/` a **vždy** přidej jeho slug do `data/manifest.json`.
*   Dodržuj strukturu JSONu (viz `articles/ai-v-medicine.json`).

### 2. Styling a design
*   Nikdy nepiš inline styly, pokud to není nezbytné pro dynamické výpočty (např. grafy).
*   Všechny barvy a fonty čerpej z CSS proměnných definovaných v `perspektiva-theme.css`.
*   Projekt používá systém **Dark Mode**, který se aplikuje pomocí třídy `.dark` na elementu `<html>`.

### 3. JavaScript a logika
*   Nepoužívej externí knihovny, pokud to není výslovně vyžádáno.
*   Logika je rozdělena: `perspektiva-stats.js` (grafy), `components.js` (UI prvky) a inline skripty v HTML pro inicializaci.
*   Při manipulaci s DOMem preferuj moderní metody (`querySelector`, `map`, `fetch`).

### 4. Konvence
*   Jazyk obsahu: **Čeština**.
*   Kód a komentáře: Míchané (většinou české názvy proměnných v datech, anglické v logice).
*   Při opravách chyb vždy nejprve ověř integritu JSON dat v `/data/`.
