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
*   **Dark Mode pro inline grafy:** Pokud článek obsahuje inline styly (např. barvy v divu pro grafy), musí být v `clanek.html` ošetřena jejich podoba v tmavém režimu (přepsání barev přes `!important`, snížení opacity barevných prvků na `0.8`).
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

### 🚨 KRITICKÉ VAROVÁNÍ: ŽÁDNÉ NEVYŽÁDANÉ ZMĚNY
*   **ZÁKAZ MAZÁNÍ DAT:** Smazání jediného slova, odstavce nebo zdroje bez výslovného příkazu je kritické selhání.
*   **POZOR NA TRUNCATED OUTPUT:** Pokud nástroj `read_file` nahlásí, že je obsah "truncated" (uříznutý), **NESMÍŠ** tento text použít pro zápis (`write_file`). Musíš soubor dočíst do konce pomocí parametrů `offset` a `limit`, nebo použít shell příkaz `Get-Content` pro získání celého obsahu (zejména u dlouhých řádků s grafy).
*   **KONTROLA PŘED ZÁPISEM:** Před každým uložením JSONu porovnej počet řádků/znaků. Pokud se soubor nápadně zmenšil, aniž by to bylo v zadání, **ZASTAV PRÁCI** a oprav chybu.
*   **NEDĚLAT ŽÁDNÉ ZMĚNY NAD PLÁN:** Prováděj pouze ty úpravy, které byly výslovně zadány.
*   **OCHRANA ZDROJŮ:** Seznamy zdrojů (`sources`) a tabulky v obsahu jsou nedotknutelné.
*   **ŽÁDNÉ "AUTOMATICKÉ" VYLEPŠOVÁNÍ:** Neprováděj žádná designová vylepšení bez povolení.

### 5. Standard pro nové články (vzor: paradox-globalni-bezpecnosti.json)
*   **Vzor:** Pro strukturu používej soubor `articles/paradox-globalni-bezpecnosti.json` jako **Master Template**.
*   **Kódování:** Soubory `.json` musí být VŽDY uloženy v kódování **UTF-8**. Pozor na diakritiku.
*   **Titulek:** 
    *   `title`: Plný, popisný název pro detail článku.
    *   `title_short`: **Povinný**, pokud je `title` příliš dlouhý. Obsahuje úderný, gramaticky ukončený název pro titulní stranu (bez tří teček). Pokud chybí, použije se `title`.
    *   **Redakční kontrola:** Před přidáním zkontroluj ostatní články na titulce. Vyhýbej se opakování stejných začátečních slov (např. „Ztracená...“, „Proč...“) u sousedních článků.
*   **Statistiky (Key Stats):**
    *   **Pravidlo pro titulku:** V prvním slotu (`key_stats[0]`) musí být VŽDY jen jeden konkrétní údaj a stručný popis, co znamená.
    *   **Výjimka pro Mýty:** Pokud má článek tag „mýty“, první slot obsahuje verdikt: **Pravda** (zelená, ikona ✅), **Nepravda** (červená, ikona ❌) nebo **Zavádějící** (oranžová, ikona ⚠️).
    *   **Ikony pro Data:** Pro běžné články používej pro první slot tyto ikony:
        *   `good`: ✅
        *   `bad`: ❗ (v kódu jako SVG vykřičník v kroužku)
        *   `neutral`/`warning`: ⚠️ nebo 📈
    *   **Formát:** „[Číslo] [Stručný význam]“ (např. „96,7 % úspěšnost léčby“).
    *   `label`: Musí být extrémně stručný, aby se na kartě na titulce vešel na 1–2 řádky (max. 42px výška lišty).
    *   `color`: Explicitně používej `good` (zelená), `bad` (červená) nebo `neutral` (modrá/oranžová).
*   **Share Card:**
    *   Objekt `share_card` je povinný.
    *   `quote_text`: Musí být úderný a krátký, aby se vešel do grafiky.
    *   `stats` na kartičce: Explicitně definuj barvu čísel pomocí `"color": "red"`, `"green"` nebo `"blue"`.
    *   **Layout:** První sloupec statistik má šířku **230px**. Pokud je hodnota delší (např. „2,2 mil. $“), text popisku musí být úměrně zkrácen, aby nedošlo k překryvu.
*   **Tagy (Topics):**
    *   **ZÁKAZ VYMÝŠLENÍ TAGŮ:** Používej výhradně existujících 10 tagů z `data/categories.json`. Žádné jiné tagy (`data`, `finance`, atd.) nejsou povoleny.
    *   Seznam povolených: `zdraví`, `ekonomika`, `inovace`, `energie`, `bezpečnost`, `demokracie`, `výzvy`, `mýty`, `česko`, `svět`.
    *   Musí přesně odpovídat (včetně diakritiky), jinak se nenačtou barvy.
*   **Zdroje (Sources):**
    *   Seznam zdrojů uváděj **POUZE** v poli `sources`.
    *   **ZÁKAZ DUPLIKACE:** Nevkládej zdroje do HTML obsahu (`content`), pokud to není výslovně vyžádáno. Komponenta je vykresluje automaticky.
*   **Proces přidání:**
    1.  Vytvořit JSON v `articles/`.
    2.  Přidat `slug` (název souboru bez přípony) do `data/manifest.json`.
