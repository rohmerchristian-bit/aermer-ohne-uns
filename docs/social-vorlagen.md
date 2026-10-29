# Social-Media-Vorlagen (/intern/)

Werkzeug für Posts und Stories im Stil der Website. Adresse: **https://aermerohneuns.de/intern/**
(Benutzername `team`, Passwort beim Bündnis erfragen). Es läuft komplett im Browser – Texte und hochgeladene
Fotos verlassen den Computer nicht.

## So geht's

1. **Format** wählen: *Post* (4:5, 1080 × 1350 px) oder *Story* (9:16, 1080 × 1920 px).
2. **Vorlage** wählen:

   | | Post | Story |
   |---|---|---|
   | Betrag | **P1** – Bereichsfarbe, Kürzung groß | **S1** – Kürzung und kurzes Zitat |
   | Zitat / Bild | **P2** – Zitat im Mittelpunkt · **P3** – Foto + Kürzung | **S2** – Foto + Zitat |
   | Frei | **P4** – Kampagne, eine große Zahl oder Aussage | **S3** – Termin (Kundgebung, Sitzung …) |
   | Sparliste | – | **S4** – ein Punkt der offiziellen Sparliste |

3. **Inhalt** wählen: das Projekt (Texte, Farbe und Bild kommen aus dem freigegebenen Eintrag) oder bei S4
   eine Maßnahme aus der Sparliste. P4 und S3 sind frei.
4. **Texte anpassen** – die Vorschau rechts ändert sich beim Tippen. Zu lange Texte werden automatisch
   kleiner gesetzt. Leere Felder blenden den Teil aus (z. B. „Jahr der Kürzung“ leer = kein Jahres-Reiter).
   *Texte zurücksetzen* holt die Texte aus dem Eintrag zurück.
5. **Speichern**:
   - **Bild speichern** – das aktuelle Bild als PNG.
   - **Alle Vorlagen für dieses Projekt** – P1, P2, P3, S1 und S2 auf einmal (Vorlagen ohne Zitat oder
     Bild werden übersprungen).

Bei Stories zeigt *„Von Instagram verdeckte Bereiche zeigen“*, wo Instagram oben und unten Profil und
Antwortfeld einblendet. Die Vorlagen halten diese Bereiche frei.

## Speichern

Die Bilder werden heruntergeladen (Ordner „Downloads“). Eines als PNG mit Projektname und Datum im
Dateinamen, mehrere auf einmal als ZIP, das bereits den Projektordner enthält
(z. B. `Kulturzentrum E-Werk – Jugendtreff Fuxx/2026-10-28_P1-Betrag.png`; Sparliste und freie Vorlagen in
`Sparliste` bzw. `Allgemein`). ZIP entpacken und den Ordner in die gemeinsame Ablage ziehen.

Direkt in einen synchronisierten Ordner (Google Drive oder MS Teams) zu speichern, war eingebaut und ist
vorerst wieder entfernt (29.10.2026), bis die Ablage geklärt ist – der Code steht in der Git-Historie.

## Technik

Code: [`src/pages/intern/index.astro`](../src/pages/intern/index.astro),
[`src/scripts/social/`](../src/scripts/social/) (Vorlagen, Speichern), Gestaltung in
[`src/styles/social.css`](../src/styles/social.css). Passwortschutz und Deploy:
[`docs/deploy/README.md`](deploy/README.md#interner-bereich-intern-social-media-vorlagen).
