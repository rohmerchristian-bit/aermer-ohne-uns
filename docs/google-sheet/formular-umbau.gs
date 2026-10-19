/**
 * #ÄrmerOhneUns – einmaliger Umbau des Formulars auf „mehrere Projekte pro Einrichtung“
 * (Plan: docs/formular-fragen.md)
 *
 * Als ZWEITE Datei ins selbe Apps-Script-Projekt wie benachrichtigung.gs einfügen
 * (im Editor links „+“ → Skript → Name „formular-umbau“).
 *
 * 1. umbauPruefen()  – ändert NICHTS, schreibt nur ins Protokoll, was gefunden wurde und was passieren würde
 * 2. umbauAusfuehren() – führt den Umbau durch. Löscht keine Frage; bestehende Antworten bleiben erhalten.
 *
 * Nicht per Skript möglich (Google-Einschränkung): die neue Datei-Upload-Frage
 * „Bild oder Logo für dieses Projekt“ – sie wird danach von Hand im Abschnitt „Betroffenes Projekt / Angebot“
 * vor „Bildnachweis zum Projektbild“ angelegt.
 */

const UMBAU = {
  start: 'Was möchtet ihr eintragen?',
  wegNeu: 'Unsere Einrichtung ist neu hier – wir tragen die Einrichtung und ein erstes betroffenes Projekt ein',
  wegWeiteres: 'Ein weiteres betroffenes Projekt für eine bereits eingetragene Einrichtung',
  abschnittEinrichtung: 'Eure Einrichtung',
  abschnittWeiteres: 'Weiteres Projekt für eine eingetragene Einrichtung',
  abschnittProjekt: 'Betroffenes Projekt / Angebot',
};

// ---- Hilfsfunktionen ------------------------------------------------------

function formular_() {
  const url = SpreadsheetApp.getActive().getFormUrl();
  if (!url) throw new Error('Mit dieser Tabelle ist kein Formular verknüpft.');
  return FormApp.openByUrl(url);
}

const titel_ = (item) => item.getTitle().replace(/\s+/g, ' ').trim();

/**
 * Erste Frage, deren Titel mit `anfang` beginnt. Abschnitte (Seitenumbrüche) werden nur gefunden, wenn
 * `typ` = PAGE_BREAK ist – sonst würde z. B. „Geplante Kürzung“ den Abschnitt „Geplante Kürzungen …“ treffen.
 */
function finde_(form, anfang, typ) {
  const items = typ ? form.getItems(typ) : form.getItems().filter((i) => i.getType() !== FormApp.ItemType.PAGE_BREAK);
  return items.find((i) => titel_(i).startsWith(anfang)) || null;
}

/** Frage (kein Abschnitt) mit genau diesem Titel. */
function genau_(form, titel) {
  return form.getItems().find((i) => i.getType() !== FormApp.ItemType.PAGE_BREAK && titel_(i) === titel) || null;
}

/** Verschiebt `item` direkt hinter `nach` (beide Items). */
function hinter_(form, item, nach) {
  const von = item.getIndex();
  const ziel = nach.getIndex();
  form.moveItem(von, von < ziel ? ziel : ziel + 1);
}

/** Verschiebt `item` direkt vor `vor`. */
function vor_(form, item, vor) {
  const von = item.getIndex();
  const ziel = vor.getIndex();
  form.moveItem(von, von < ziel ? ziel - 1 : ziel);
}

/** Alle Fragen, die das Skript braucht – bricht mit klarer Meldung ab, wenn etwas fehlt. */
function bestandsaufnahme_(form) {
  const q = {
    name: finde_(form, 'Name der Institution'),
    bereich: finde_(form, 'Zu welchem Bereich gehört'),
    abschnittAufgaben: finde_(form, 'Aufgaben & Bedeutung', FormApp.ItemType.PAGE_BREAK),
    abschnittKuerzung:
      finde_(form, 'Geplante Kürzungen', FormApp.ItemType.PAGE_BREAK) ||
      finde_(form, UMBAU.abschnittProjekt, FormApp.ItemType.PAGE_BREAK),
    kuerzung: finde_(form, 'Geplante Kürzung'),
    zuschuesse: finde_(form, 'Welche Zuschüsse'),
    folgen: finde_(form, 'Betroffenes Projekt / Angebot: Welche konkreten Folgen') || genau_(form, 'Welche konkreten Folgen hat die Kürzung?'),
    zitat: finde_(form, 'Prägnantes Zitat'),
    helfen: finde_(form, 'Wie könnte man Euch helfen'),
    link: finde_(form, 'Link zu weiterführenden'),
    abschnittMedien: finde_(form, 'Medien & Material', FormApp.ItemType.PAGE_BREAK),
    logo: finde_(form, 'Logo-Upload') || finde_(form, 'Logo der Einrichtung'),
    abschnittDemo: finde_(form, 'Demo', FormApp.ItemType.PAGE_BREAK),
    abschnittEinverstaendnis: finde_(form, 'Einverständnisse', FormApp.ItemType.PAGE_BREAK),
    bildrechte: finde_(form, 'Mit dem Hochladen bestätigen wir'),
  };
  const fehlt = Object.entries(q)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (fehlt.length) throw new Error(`Im Formular nicht gefunden: ${fehlt.join(', ')}. Umbau abgebrochen, nichts geändert.`);
  if (finde_(form, 'Kürzung in den Folgejahren') && !finde_(form, UMBAU.start)) {
    console.warn('Hinweis: Einige neue Fragen gibt es schon – sie werden weiterverwendet, nicht doppelt angelegt.');
  }
  return q;
}

// ---- 1. Probelauf ---------------------------------------------------------

function umbauPruefen() {
  const form = formular_();
  if (finde_(form, UMBAU.start)) {
    console.log('Der Umbau wurde bereits ausgeführt („Was möchtet ihr eintragen?“ ist vorhanden). Nichts zu tun.');
    return;
  }
  const q = bestandsaufnahme_(form);
  console.log('Alle benötigten Fragen gefunden:');
  Object.entries(q).forEach(([k, v]) => console.log(`  ${k}: „${titel_(v)}“ (Position ${v.getIndex() + 1})`));
  if (finde_(form, 'Absagen von Angeboten')) {
    console.warn('Es gibt eine eigene Frage „Absagen von Angeboten …“. Sie bleibt unverändert – bitte danach prüfen.');
  }
  console.log(`
Geplante Änderungen (nichts wird gelöscht):
  • Neu ganz vorn: Frage „${UMBAU.start}“ mit zwei Wegen
  • Neuer Abschnitt „${UMBAU.abschnittEinrichtung}“ vor „Name der Institution …“
  • „${titel_(q.bereich)}“ → in den Projekt-Abschnitt, Titel „Zu welchem Bereich gehört das Projekt / Angebot?“
  • „${titel_(q.logo)}“ → Titel „Logo der Einrichtung“, dahinter neu „Bildnachweis zum Logo“
  • Neuer Abschnitt „${UMBAU.abschnittWeiteres}“ (Auswahlliste + Ansprechperson) vor dem Projekt-Abschnitt
  • Abschnitt „${titel_(q.abschnittKuerzung)}“ → Titel „${UMBAU.abschnittProjekt}“, ans Ende vor „Einverständnisse“
  • Neu: „Betroffenes Projekt / Angebot“, „Kürzung in den Folgejahren“, „Kürzung in Prozent“,
    „Falls es nicht um einen Geldbetrag geht: Was fällt weg?“, „Quelle des Betrags“, „Bildnachweis zum Projektbild“
  • „${titel_(q.kuerzung)}“ → „Geplante Kürzung 2027 in Euro“
  • „${titel_(q.folgen)}“ → „Welche konkreten Folgen hat die Kürzung?“ (bisherige Antworten bleiben dort)
  • Nach „Demo“ weiter zum Projekt-Abschnitt
  • „Mit dem Hochladen bestätigen wir …“ → keine Pflichtfrage mehr
Danach von Hand: Datei-Upload-Frage „Bild oder Logo für dieses Projekt“.`);
}

// ---- 2. Umbau ---------------------------------------------------------------

function umbauAusfuehren() {
  const form = formular_();
  if (finde_(form, UMBAU.start)) {
    console.log('Der Umbau wurde bereits ausgeführt. Nichts geändert.');
    return;
  }
  const q = bestandsaufnahme_(form);

  // Projekt-Abschnitt: umbenennen und mit allen Fragen ans Ende vor „Einverständnisse“.
  const pbProjekt = q.abschnittKuerzung.asPageBreakItem();
  pbProjekt
    .setTitle(UMBAU.abschnittProjekt)
    .setHelpText('Ein Projekt = eine Kachel auf der Plattform. Für jedes weitere Projekt das Formular bitte erneut ausfüllen.');
  const projektFragen = [q.kuerzung, q.zuschuesse, q.folgen, q.zitat, q.helfen, q.link];
  vor_(form, q.abschnittKuerzung, q.abschnittEinverstaendnis);
  let letzte = q.abschnittKuerzung;
  // Reihenfolge im Abschnitt: Projekt, Bereich, Zuschüsse, Kürzung 2027, Folgejahre, Prozent, Was fällt weg,
  // Quelle, Folgen, Zitat, Helfen, Link, Bildnachweis Projektbild
  const projektName = genau_(form, 'Betroffenes Projekt / Angebot') ||
    form.addTextItem().setTitle('Betroffenes Projekt / Angebot').setHelpText('Kurzer Name, z. B. „Jugendtreff Fuxx“').setRequired(true);
  hinter_(form, projektName, letzte); letzte = projektName;

  q.bereich.setTitle('Zu welchem Bereich gehört das Projekt / Angebot?');
  hinter_(form, q.bereich, letzte); letzte = q.bereich;

  hinter_(form, q.zuschuesse, letzte); letzte = q.zuschuesse;

  q.kuerzung
    .setTitle('Geplante Kürzung 2027 in Euro')
    .setHelpText('Nur die Zahl für 2027, z. B. 21.000. Sie fließt in die Gesamtsumme auf der Website ein.');
  hinter_(form, q.kuerzung, letzte); letzte = q.kuerzung;

  const neueTexte = [
    ['Kürzung in den Folgejahren', 'z. B. 2028: 85.000 €, 2029: 120.000 €'],
    ['Kürzung in Prozent', 'z. B. 10 % – wird zusätzlich zum Betrag gezeigt.'],
    ['Falls es nicht um einen Geldbetrag geht: Was fällt weg?', 'z. B. Wegfall der Mietzuschüsse für Vereine – steht auf der Kachel statt eines Betrags.'],
    ['Quelle des Betrags', 'z. B. Sparliste der Stadt, Vorlage II/056/2026; Schreiben des Kulturamts vom …; eigene Berechnung'],
  ];
  for (const [t, hilfe] of neueTexte) {
    const item = genau_(form, t) || form.addTextItem().setTitle(t).setHelpText(hilfe);
    hinter_(form, item, letzte); letzte = item;
  }

  q.folgen.setTitle('Welche konkreten Folgen hat die Kürzung?').setHelpText('z. B. Absagen von Angeboten, Stellenabbau, Schließzeiten');
  hinter_(form, q.folgen, letzte); letzte = q.folgen;
  for (const item of [q.zitat, q.helfen, q.link]) {
    hinter_(form, item, letzte); letzte = item;
  }
  const bildnachweisProjekt = genau_(form, 'Bildnachweis zum Projektbild') ||
    form.addTextItem().setTitle('Bildnachweis zum Projektbild').setHelpText('Nur ausfüllen, wenn ihr ein eigenes Bild für dieses Projekt hochladet.');
  hinter_(form, bildnachweisProjekt, letzte);

  // Medien: Logo umbenennen, Bildnachweis zum Logo dahinter.
  q.logo.setTitle('Logo der Einrichtung');
  const bildnachweisLogo = genau_(form, 'Bildnachweis zum Logo') || form.addTextItem().setTitle('Bildnachweis zum Logo');
  hinter_(form, bildnachweisLogo, q.logo);

  // Abschnitt „Weiteres Projekt“ direkt vor dem Projekt-Abschnitt.
  const pbWeiteres = form.addPageBreakItem().setTitle(UMBAU.abschnittWeiteres);
  vor_(form, pbWeiteres, pbProjekt);
  const liste = form
    .addListItem()
    .setTitle(FRAGE_EINRICHTUNGSLISTE)
    .setHelpText('Eure Einrichtung fehlt? Dann ist sie noch nicht freigegeben – bitte kurz warten oder den Weg „Unsere Einrichtung ist neu hier“ wählen.')
    .setRequired(true);
  liste.setChoiceValues(['(noch keine freigegebene Einrichtung)']);
  hinter_(form, liste, pbWeiteres);
  const ansprech = form.addTextItem().setTitle('Ansprechperson für dieses Projekt (Vorname, Nachname, Funktion)').setRequired(true);
  hinter_(form, ansprech, liste);
  // Nach „Demo“ (der Abschnitt vor „Weiteres Projekt“) direkt zum Projekt springen.
  pbWeiteres.setGoToPage(pbProjekt);

  // Neuer erster Abschnitt mit der Weg-Frage; die bisherigen Einrichtungsfragen bekommen einen eigenen Abschnitt.
  const pbEinrichtung = form.addPageBreakItem().setTitle(UMBAU.abschnittEinrichtung);
  form.moveItem(pbEinrichtung.getIndex(), 0);
  const start = form.addMultipleChoiceItem().setTitle(UMBAU.start).setRequired(true).setHelpText(
    'Jedes betroffene Projekt erscheint als eigene Kachel. Habt ihr mehrere Projekte? Dann tragt zuerst eure ' +
      'Einrichtung mit dem ersten Projekt ein und füllt das Formular danach für jedes weitere Projekt erneut aus.',
  );
  start.setChoices([start.createChoice(UMBAU.wegNeu, pbEinrichtung), start.createChoice(UMBAU.wegWeiteres, pbWeiteres)]);
  form.moveItem(start.getIndex(), 0);

  // Bildrechte: keine Pflicht mehr (die Website zeigt Bilder nur mit Häkchen).
  if (q.bildrechte.getType() === FormApp.ItemType.CHECKBOX) q.bildrechte.asCheckboxItem().setRequired(false);
  else if (q.bildrechte.getType() === FormApp.ItemType.MULTIPLE_CHOICE) q.bildrechte.asMultipleChoiceItem().setRequired(false);
  else console.warn('Bildrechte-Frage: Pflicht bitte von Hand ausschalten.');

  console.log('Umbau fertig. Jetzt von Hand: Datei-Upload-Frage „Bild oder Logo für dieses Projekt“ vor „Bildnachweis zum Projektbild“.');
  aktualisiereEinrichtungslisteSicher_();
}
