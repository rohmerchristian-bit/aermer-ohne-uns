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
 *
 * Funktionen zum Ausführen im Apps-Script-Editor (oben Funktion wählen → „Ausführen“):
 *   einrichten()  – prüft die Überschriften und legt „Status“ / „Zuletzt eingegangen“ an
 *   probelauf()   – schickt eine Test-Mail zur letzten Zeile, ändert nichts im Sheet
 */

// ---- Einstellungen ---------------------------------------------------------

/** Wer benachrichtigt wird. Mehrere Adressen möglich. */
const EMPFAENGER = ['pruefteam@example.org'];

/** Geänderte Einträge müssen neu freigegeben werden (empfohlen: true). */
const FREIGABE_BEI_AENDERUNG_ZURUECKSETZEN = true;

/** Name des Tabs mit den Formularantworten. */
const BLATT = 'Formularantworten';

/** Spaltenköpfe im Blatt mit den Formularantworten (genau so, wie sie in Zeile 1 stehen). */
const SPALTE_STATUS = 'Status';
const SPALTE_ZEIT = 'Zuletzt eingegangen';
const SPALTE_FREIGABE = 'Freigeben';
const SPALTE_NAME_BEGINNT_MIT = 'Name der Institution';
const SPALTE_BEREICH_BEGINNT_MIT = 'Zu welchem Bereich';

// ---- Ab hier nichts ändern -------------------------------------------------

function kopfzeile_(sheet) {
  return sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map((h) => String(h).trim());
}

/** Einmal ausführen: prüft die benötigten Überschriften und ergänzt fehlende Hilfsspalten. */
function einrichten() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(BLATT);
  if (!sheet) throw new Error(`Tab „${BLATT}“ nicht gefunden.`);
  let header = kopfzeile_(sheet);

  for (const name of [SPALTE_STATUS, SPALTE_ZEIT]) {
    if (!header.includes(name)) {
      const col = sheet.getLastColumn() + 1;
      sheet.getRange(1, col).setValue(name);
      console.log(`Spalte „${name}“ angelegt (Spalte ${col}).`);
      header = kopfzeile_(sheet);
    }
  }

  const probleme = [];
  if (!header.includes(SPALTE_FREIGABE)) probleme.push(`Spalte „${SPALTE_FREIGABE}“ fehlt.`);
  for (const anfang of [SPALTE_NAME_BEGINNT_MIT, SPALTE_BEREICH_BEGINNT_MIT]) {
    const n = header.filter((h) => h.startsWith(anfang)).length;
    if (n !== 1) probleme.push(`Überschrift „${anfang}…“ ${n === 0 ? 'fehlt' : `kommt ${n}-mal vor`}.`);
  }
  if (probleme.length) throw new Error(probleme.join(' '));
  console.log('Alles bereit. Jetzt den Trigger „Bei Formularübermittlung“ für beiFormularAntwort anlegen.');
}

/** Test ohne Formular: Mail zur letzten Zeile mit „[TEST]“ im Betreff, das Sheet bleibt unverändert. */
function probelauf() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(BLATT);
  if (!sheet || sheet.getLastRow() < 2) throw new Error('Keine Antwortzeile zum Testen vorhanden.');
  beiFormularAntwort({ range: sheet.getRange(sheet.getLastRow(), 1) }, true);
  console.log(`Test-Mail an ${EMPFAENGER.join(', ')} verschickt (Zeile ${sheet.getLastRow()}).`);
}

/** Wird vom Trigger „Bei Formularübermittlung“ aufgerufen. `test` nur für probelauf(). */
function beiFormularAntwort(e, test = false) {
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  const header = kopfzeile_(sheet);

  const spalte = (name) => header.indexOf(name) + 1;
  const spalteBeginntMit = (anfang) => header.findIndex((h) => h.startsWith(anfang)) + 1;

  const statusCol = spalte(SPALTE_STATUS);
  const zeitCol = spalte(SPALTE_ZEIT);
  if (!statusCol || !zeitCol) {
    throw new Error(`Spalten „${SPALTE_STATUS}“ und „${SPALTE_ZEIT}“ fehlen in Zeile 1.`);
  }

  // Bei einer bearbeiteten Antwort steht in „Status“ schon etwas.
  const geaendert = String(sheet.getRange(row, statusCol).getValue()).trim() !== '';
  if (!test) {
    sheet.getRange(row, statusCol).setValue(geaendert ? 'Geändert – bitte prüfen' : 'Neu – bitte prüfen');
    sheet.getRange(row, zeitCol).setValue(new Date());
  }

  let freigabeZurueckgesetzt = false;
  const freigabeCol = spalte(SPALTE_FREIGABE);
  if (!test && geaendert && FREIGABE_BEI_AENDERUNG_ZURUECKSETZEN && freigabeCol) {
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
    subject: `${test ? '[TEST] ' : ''}#ÄrmerOhneUns: ${geaendert ? 'Änderung' : 'Neuer Eintrag'} – ${name}`,
    body: zeilen.join('\n'),
  });
}
