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
