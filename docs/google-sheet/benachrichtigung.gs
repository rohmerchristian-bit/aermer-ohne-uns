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
 * Außerdem hält es im Formular die Auswahlliste „Für welche Einrichtung tragt ihr ein weiteres
 * Projekt ein?“ aktuell: Dort stehen alle Einrichtungen, deren Eintrag „Freigeben“ angehakt hat.
 *
 * Die E-Mail enthält bewusst nur Name und Bereich, keine Kontaktdaten.
 * Einrichtung: siehe docs/google-sheet/README.md
 *
 * Funktionen zum Ausführen im Apps-Script-Editor (oben Funktion wählen → „Ausführen“):
 *   einrichten()  – prüft die Überschriften und legt „Status“ / „Zuletzt eingegangen“ an
 *   probelauf()   – schickt eine Test-Mail zur letzten Zeile, ändert nichts im Sheet
 *   aktualisiereEinrichtungsliste() – füllt die Auswahlliste im Formular neu
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
const SPALTE_WEG_BEGINNT_MIT = 'Was möchtet ihr eintragen';
const SPALTE_AUSWAHL_BEGINNT_MIT = 'Für welche Einrichtung tragt ihr';
const SPALTE_PROJEKT_BEGINNT_MIT = 'Betroffenes Projekt / Angebot';

/** Titel der Auswahlliste im Formular (Abschnitt „Weiteres Projekt“). */
const FRAGE_EINRICHTUNGSLISTE = 'Für welche Einrichtung tragt ihr ein weiteres Projekt ein?';

// ---- Ab hier nichts ändern -------------------------------------------------

function kopfzeile_(sheet) {
  return sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map((h) => String(h).trim());
}

/**
 * Alle Spalten (1-basiert), deren Überschrift mit `anfang` beginnt. Wird eine Frage im Formular gelöscht und neu
 * angelegt, behält Google die alte Spalte – dieselbe Überschrift kann dann mehrfach vorkommen.
 */
function spaltenBeginnenMit_(header, anfang) {
  return header.map((h, i) => (h.startsWith(anfang) ? i + 1 : 0)).filter(Boolean);
}

/** Erster nicht leerer Wert einer Zeile aus mehreren Spalten (Werte als Array der ganzen Zeile, 0-basiert). */
function ersterWert_(zeile, spalten) {
  for (const c of spalten) {
    const v = String(zeile[c - 1] ?? '').trim();
    if (v) return v;
  }
  return '';
}

/** Einmal ausführen: prüft die benötigten Überschriften und ergänzt fehlende Hilfsspalten. */
function einrichten(e) {
  // Ist der Trigger „Bei Formularübermittlung“ versehentlich auf diese Funktion gesetzt, wird die Antwort
  // trotzdem richtig verarbeitet. Bitte den Trigger auf beiFormularAntwort umstellen.
  if (e && e.range) {
    console.warn('einrichten() wurde vom Formular-Trigger aufgerufen – bitte Trigger auf „beiFormularAntwort“ umstellen.');
    beiFormularAntwort(e);
    return;
  }
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
    const n = spaltenBeginnenMit_(header, anfang).length;
    if (n === 0) probleme.push(`Überschrift „${anfang}…“ fehlt.`);
    // Mehrfach ist kein Fehler: das Skript nimmt pro Zeile die Spalte, in der etwas steht.
    if (n > 1) console.log(`Hinweis: Überschrift „${anfang}…“ kommt ${n}-mal vor (alte und neue Frage) – wird zusammengeführt.`);
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
  // Ohne e.range kommt der Aufruf nicht vom Formular (z. B. Trigger „Beim Öffnen“ oder „Ausführen“ im Editor).
  if (!e || !e.range) {
    console.warn('beiFormularAntwort() ohne Formularantwort aufgerufen – Trigger muss „Bei Formularübermittlung“ sein. Zum Testen probelauf() nutzen.');
    return;
  }
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  const header = kopfzeile_(sheet);

  const spalte = (name) => header.indexOf(name) + 1;

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

  const zeile = sheet.getRange(row, 1, 1, header.length).getValues()[0];
  const wert = (anfang) => ersterWert_(zeile, spaltenBeginnenMit_(header, anfang));
  const einrichtung = wert(SPALTE_NAME_BEGINNT_MIT) || wert(SPALTE_AUSWAHL_BEGINNT_MIT) || '(ohne Namen)';
  const projekt = wert(SPALTE_PROJEKT_BEGINNT_MIT);
  const name = projekt && projekt !== einrichtung ? `${einrichtung} – ${projekt}` : einrichtung;
  const bereich = wert(SPALTE_BEREICH_BEGINNT_MIT);
  const link = `${SpreadsheetApp.getActive().getUrl()}#gid=${sheet.getSheetId()}&range=A${row}`;

  const zeilen = [
    geaendert ? 'Ein Eintrag wurde geändert:' : 'Neuer Eintrag im Formular:',
    '',
    `Einrichtung: ${einrichtung}`,
    projekt ? `Projekt: ${projekt}` : null,
    bereich ? `Bereich: ${bereich}` : null,
    `Zeile: ${row}`,
    '',
    freigabeZurueckgesetzt
      ? 'Der Eintrag war freigegeben. Die Freigabe wurde zurückgenommen, bis die Änderung geprüft ist.'
      : null,
    `Zur Zeile im Sheet: ${link}`,
  ].filter((z) => z !== null);

  if (freigabeZurueckgesetzt) aktualisiereEinrichtungslisteSicher_();

  MailApp.sendEmail({
    to: EMPFAENGER.join(','),
    subject: `${test ? '[TEST] ' : ''}#ÄrmerOhneUns: ${geaendert ? 'Änderung' : 'Neuer Eintrag'} – ${name}`,
    body: zeilen.join('\n'),
  });
}

// ---- Auswahlliste „Für welche Einrichtung …?“ -------------------------------

/**
 * Schreibt alle freigegebenen Einrichtungen (Weg „neu“ bzw. ältere Antworten ohne Weg) alphabetisch
 * in die Auswahlliste des Formulars. Wird automatisch aufgerufen, wenn „Freigeben“ geändert wird
 * (Trigger „Bei Bearbeitung“ → beiBearbeitung), kann aber auch von Hand ausgeführt werden.
 */
function aktualisiereEinrichtungsliste() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(BLATT);
  if (!sheet) throw new Error(`Tab „${BLATT}“ nicht gefunden.`);
  const header = kopfzeile_(sheet);
  const nameCols = spaltenBeginnenMit_(header, SPALTE_NAME_BEGINNT_MIT);
  const freiCol = header.indexOf(SPALTE_FREIGABE);
  const wegCol = header.findIndex((h) => h.startsWith(SPALTE_WEG_BEGINNT_MIT));
  if (!nameCols.length || freiCol < 0) throw new Error('Spalten „Name der Institution“ oder „Freigeben“ fehlen.');

  const zeilen = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues() : [];
  const namen = [
    ...new Set(
      zeilen
        .filter((z) => z[freiCol] === true && (wegCol < 0 || !/weiteres/i.test(String(z[wegCol]))))
        .map((z) => ersterWert_(z, nameCols))
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, 'de'));

  const formUrl = ss.getFormUrl();
  if (!formUrl) throw new Error('Mit dieser Tabelle ist kein Formular verknüpft.');
  const item = FormApp.openByUrl(formUrl)
    .getItems(FormApp.ItemType.LIST)
    .find((i) => i.getTitle().trim() === FRAGE_EINRICHTUNGSLISTE);
  if (!item) throw new Error(`Im Formular gibt es keine Drop-down-Frage „${FRAGE_EINRICHTUNGSLISTE}“.`);

  item.asListItem().setChoiceValues(namen.length ? namen : ['(noch keine freigegebene Einrichtung)']);
  console.log(`${namen.length} Einrichtung(en) in der Auswahlliste.`);
}

/** Trigger „Bei Bearbeitung“: aktualisiert die Liste, wenn „Freigeben“ oder ein Name geändert wurde. */
function beiBearbeitung(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== BLATT) return;
  const header = kopfzeile_(sheet);
  const betroffen = [header.indexOf(SPALTE_FREIGABE) + 1, ...spaltenBeginnenMit_(header, SPALTE_NAME_BEGINNT_MIT)];
  if (betroffen.some((c) => c >= e.range.getColumn() && c <= e.range.getLastColumn())) aktualisiereEinrichtungslisteSicher_();
}

/** Wie aktualisiereEinrichtungsliste, aber ohne Abbruch, solange es die Frage im Formular noch nicht gibt. */
function aktualisiereEinrichtungslisteSicher_() {
  try {
    aktualisiereEinrichtungsliste();
  } catch (error) {
    console.warn(`Auswahlliste nicht aktualisiert: ${error.message}`);
  }
}
