# #ÄrmerOhneUns – Kampagnen-Website

> Die vollständige Anleitung für das Team (Google Sheet, Alltag, Spendenstand, Social-Media-Kacheln, Fehlerbehebung) folgt in Phase 7.

## Für Entwickler*innen: lokal starten

Voraussetzung: Node.js in der Version aus `.nvmrc` (24.22.0). Mit [fnm](https://github.com/Schniz/fnm) genügt `fnm use` im Projektordner.

```bash
npm ci          # Abhängigkeiten exakt nach package-lock.json installieren
npm run dev     # Entwicklungsserver auf http://localhost:4321
npm test        # Tests
npm run check   # Typprüfung
npm run build   # statische Website nach dist/
```

Konfiguration: `.env.example` nach `.env` kopieren und ausfüllen.

## Daten

`npm run data` (läuft automatisch vor `dev`, `build` und `check`) lädt die Tabellen, prüft sie und schreibt
`src/generated/*.json` sowie die optimierten Bilder nach `public/media/`. Beides ist nicht im Repository.

- `DATA_SOURCE=sample` (Standard): Beispieldaten aus `data/sample/` – zehn fiktive Zeilen, davon acht veröffentlicht,
  eine nicht freigegeben, eine ohne Zustimmung.
- `DATA_SOURCE=remote`: die veröffentlichten CSV-Links aus `SHEET_PUBLIC_CSV_URL` und `SHEET_SETTINGS_CSV_URL`.

Am Ende steht eine Zusammenfassung („8 Einrichtungen veröffentlicht … 4 Warnungen“), die auch in
`.cache/build-report.json` landet. Bei einem Fehler (z. B. fehlende Pflichtspalte) bricht der Schritt mit einer
deutschen Meldung ab, und es wird nichts veröffentlicht.

| Was | Datei |
|---|---|
| Fragetitel → interne Felder, öffentlich/privat | `src/data/columns.ts` |
| Regeln für Einträge (Freigabe, Beträge, Bilder) | `src/data/pipeline.ts` |
| Einstellungen und Standardwerte | `src/data/settings.ts` |
| Bilder herunterladen und optimieren (mit Cache) | `src/lib/images.ts` |

**Datenschutz-Sicherheitsnetz:** Private Formularfelder (E-Mail, Ansprechperson, Zeitstempel, Aktionen, Räume,
Verteiler) werden nie gelesen, auch wenn das Blatt „Öffentlich“ sie versehentlich enthält. Der Build warnt dann
ausdrücklich. Ein Test (`tests/pipeline.test.ts`) prüft das.

## Styleguide

`/styleguide/` zeigt Farben, Schrift, Buttons und die Kachel. Die Seite ist nicht verlinkt und hat `noindex`.

## Gestaltung – wo was liegt

| Was | Datei |
|---|---|
| Alle Farben (einzige Quelle) | `src/design/colors.ts` → wird zu `/tokens.css` |
| Bereiche (Name, Slug) | `src/data/areas.ts` |
| Schrift, Abstände, Größen | `src/styles/tokens.css` |
| Grundstil, Buttons, Raster | `src/styles/base.css`, `buttons.css`, `layout.css` |
| Kachel | `src/components/Tile.astro`, `src/scripts/tile-flip.ts` |
| Ansicht ohne JavaScript | `public/styles/noscript.css` |

## Schrift

Archivo (variabel, Breiten- und Gewichtsachse), selbst gehostet unter `public/fonts/archivo/`. Lizenz: SIL Open Font License 1.1 (`public/fonts/archivo/OFL.txt`).
