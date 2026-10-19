/**
 * #ÄrmerOhneUns – Benachrichtigung bei neuen und geänderten Formular-Einträgen
 *
 * Läuft im Google Sheet (Erweiterungen → Apps Script), nicht auf der Website.
 * Bei jeder Formular-Antwort:
 *   1. setzt die Spalte „Status“ auf „Neu – bitte prüfen“ bzw. „Geändert – bitte prüfen“,
 *   2. trägt das Datum in „Zuletzt eingegangen“ ein,
 *   3. nimmt bei GEÄNDERTEN Einträgen das Häkchen „Freigeben“ wieder heraus
 *      (sonst ginge eine Änderung ungeprüft online),
 *   4. schickt eine kurze E-Mail an das Prüf-Team mit Link zur Zeile.
 *
 * Die E-Mail enthält bewusst nur Name und Bereich, keine Kontaktdaten.
 * Einrichtung: siehe docs/google-sheet/README.md
 */

// ---- Einstellungen ---------------------------------------------------------

/** Wer benachrichtigt wird. Mehrere Adressen möglich. */
const EMPFAENGER = ['pruefteam@example.org'];

/** Geänderte Einträge müssen neu freigegeben werden (empfohlen: true). */
const FREIGABE_BEI_AENDERUNG_ZURUECKSETZEN = true;

/** Spaltenköpfe im Blatt mit den Formularantworten (genau so, wie sie in Zeile 1 stehen). */
const SPALTE_STATUS = 'Status';
const SPALTE_ZEIT = 'Zuletzt eingegangen';
const SPALTE_FREIGABE = 'Freigeben';
const SPALTE_NAME_BEGINNT_MIT = 'Name der Institution';
const SPALTE_BEREICH_BEGINNT_MIT = 'Zu welchem Bereich';

// ---- Ab hier nichts ändern -------------------------------------------------

/** Wird vom Trigger „Bei Formularübermittlung“ aufgerufen. */
function beiFormularAntwort(e) {
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  const header = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map((h) => String(h).trim());

  const spalte = (name) => header.indexOf(name) + 1;
  const spalteBeginntMit = (anfang) => header.findIndex((h) => h.startsWith(anfang)) + 1;

  const statusCol = spalte(SPALTE_STATUS);
  const zeitCol = spalte(SPALTE_ZEIT);
  if (!statusCol || !zeitCol) {
    throw new Error(`Spalten „${SPALTE_STATUS}“ und „${SPALTE_ZEIT}“ fehlen in Zeile 1.`);
  }

  // Bei einer bearbeiteten Antwort steht in „Status“ schon etwas.
  const geaendert = String(sheet.getRange(row, statusCol).getValue()).trim() !== '';
  sheet.getRange(row, statusCol).setValue(geaendert ? 'Geändert – bitte prüfen' : 'Neu – bitte prüfen');
  sheet.getRange(row, zeitCol).setValue(new Date());

  let freigabeZurueckgesetzt = false;
  const freigabeCol = spalte(SPALTE_FREIGABE);
  if (geaendert && FREIGABE_BEI_AENDERUNG_ZURUECKSETZEN && freigabeCol) {
    const zelle = sheet.getRange(row, freigabeCol);
    if (zelle.isChecked()) {
      zelle.uncheck();
      freigabeZurueckgesetzt = true;
    }
  }

  const wert = (col) => (col ? String(sheet.getRange(row, col).getValue()).trim() : '');
  const name = wert(spalteBeginntMit(SPALTE_NAME_BEGINNT_MIT)) || '(ohne Namen)';
  const bereich = wert(spalteBeginntMit(SPALTE_BEREICH_BEGINNT_MIT));
  const link = `${SpreadsheetApp.getActive().getUrl()}#gid=${sheet.getSheetId()}&range=A${row}`;

  const zeilen = [
    geaendert ? 'Ein Eintrag wurde geändert:' : 'Neuer Eintrag im Formular:',
    '',
    `Einrichtung: ${name}`,
    bereich ? `Bereich: ${bereich}` : null,
    `Zeile: ${row}`,
    '',
    freigabeZurueckgesetzt
      ? 'Der Eintrag war freigegeben. Die Freigabe wurde zurückgenommen, bis die Änderung geprüft ist.'
      : null,
    `Zur Zeile im Sheet: ${link}`,
  ].filter((z) => z !== null);

  MailApp.sendEmail({
    to: EMPFAENGER.join(','),
    subject: `#ÄrmerOhneUns: ${geaendert ? 'Änderung' : 'Neuer Eintrag'} – ${name}`,
    body: zeilen.join('\n'),
  });
}
