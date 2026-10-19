// Runs the Google Apps Scripts in docs/google-sheet/ against a small FormApp mock that reproduces
// the live form (7 sections, as of 19.10.2026) and checks the result of the one-off rebuild.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const T = {
  TEXT: 'TEXT', PARAGRAPH_TEXT: 'PARAGRAPH_TEXT', LIST: 'LIST', CHECKBOX: 'CHECKBOX',
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE', PAGE_BREAK: 'PAGE_BREAK', FILE_UPLOAD: 'FILE_UPLOAD',
} as const;

type Choice = { v: string; nav?: MockItem };

class MockItem {
  help = '';
  required = false;
  goTo: MockItem | null = null;
  choices: Choice[] | null = null;
  constructor(public type: string, public title: string, private list: MockItem[]) {}
  getTitle() { return this.title; }
  setTitle(t: string) { this.title = t; return this; }
  setHelpText(h: string) { this.help = h; return this; }
  setRequired(r: boolean) { this.required = r; return this; }
  getType() { return this.type; }
  getIndex() { return this.list.indexOf(this); }
  asPageBreakItem() { return this; }
  asCheckboxItem() { return this; }
  asMultipleChoiceItem() { return this; }
  asListItem() { return this; }
  setGoToPage(p: MockItem) { this.goTo = p; return this; }
  setChoiceValues(v: string[]) { this.choices = v.map((x) => ({ v: x })); return this; }
  createChoice(v: string, nav: MockItem) { return { v, nav }; }
  setChoices(c: Choice[]) { this.choices = c; return this; }
}

function liveForm() {
  const items: MockItem[] = [];
  const q = (type: string, title: string, required = false) => {
    const i = new MockItem(type, title, items);
    i.required = required;
    items.push(i);
    return i;
  };
  q(T.TEXT, 'Name der Institution / Einrichtung ', true);
  q(T.LIST, 'Zu welchem Bereich gehört eure Einrichtung?', true);
  q(T.TEXT, 'Standort / Adresse', true);
  q(T.TEXT, 'Ansprechperson für das Bündnis (Format: Vorname, Nachname, Funktion)', true);
  q(T.TEXT, ' E-Mail-Adresse für Rückfragen & Bündnisarbeit ', true);
  q(T.TEXT, ' Website / Social-Media-Kanäle');
  q(T.PAGE_BREAK, 'Aufgaben & Bedeutung für Erlangen');
  q(T.PARAGRAPH_TEXT, 'Was tut eure Institution in Kürze? (Kurzbeschreibung der Arbeit)', true);
  q(T.PARAGRAPH_TEXT, 'Wen erreicht eure Arbeit? (Zielgruppen & Reichweite in Zahlen)');
  q(T.PAGE_BREAK, 'Geplante Kürzungen & Konkrete Folgen');
  q(T.TEXT, 'Geplante Kürzung in Euro pro Jahr');
  q(T.PARAGRAPH_TEXT, 'Welche Zuschüsse / Mittel sollen gestrichen oder gekürzt werden?');
  q(T.PARAGRAPH_TEXT, 'Betroffenes Projekt / Angebot: Welche konkreten Folgen hat die Kürzung?');
  q(T.PARAGRAPH_TEXT, 'Prägnantes Zitat / Statement zur Lage (Short Quote)');
  q(T.CHECKBOX, 'Wie könnte man Euch helfen, wenn es zur Einsparung kommt?');
  q(T.TEXT, 'Link zu weiterführenden Informationen / Stellungnahmen / Petitionen ');
  q(T.PAGE_BREAK, 'Medien & Material für die Plattform');
  q(T.FILE_UPLOAD, 'Logo-Upload für euer Profil auf der Plattform', true);
  q(T.PAGE_BREAK, 'Vernetzung & Bündnisarbeit');
  q(T.PARAGRAPH_TEXT, 'Plant ihr eigene Aktionen, Proteste oder Veranstaltungen zur Kürzungswelle? Wenn ja, welche?');
  q(T.MULTIPLE_CHOICE, 'Wärt ihr bereit, Räume oder Infrastruktur für Treffen des Bündnisses bereitzustellen?');
  q(T.PAGE_BREAK, 'Demo // 18.11.2026 / 15 Uhr / Rathausplatz');
  q(T.CHECKBOX, 'Ich möchte dabei sein und als Teil des Bündnis "ÄrmerOhneUns" an dem Demo mit meiner Organisation teilnehmen (kostenlos).');
  q(T.PAGE_BREAK, ' Einverständnisse & Datenschutz');
  q(T.CHECKBOX, 'Freigabe zur Veröffentlichung', true);
  q(T.CHECKBOX, ' Aufnahme in den Bündnis-Verteiler');
  q(T.CHECKBOX, 'Mit dem Hochladen bestätigen wir, dass wir die erforderlichen Nutzungsrechte …', true);

  const add = (type: string) => () => { const i = new MockItem(type, '', items); items.push(i); return i; };
  const form = {
    getItems: (t?: string) => (t ? items.filter((i) => i.type === t) : [...items]),
    moveItem: (from: number, to: number) => { const [i] = items.splice(from, 1); items.splice(to, 0, i!); },
    addTextItem: add(T.TEXT), addListItem: add(T.LIST), addPageBreakItem: add(T.PAGE_BREAK),
    addMultipleChoiceItem: add(T.MULTIPLE_CHOICE),
  };
  return { items, form };
}

function runScripts(form: unknown) {
  const code = ['benachrichtigung.gs', 'formular-umbau.gs']
    .map((f) => readFileSync(`docs/google-sheet/${f}`, 'utf8'))
    .join('\n');
  const logs: string[] = [];
  const quiet = { log: (m: string) => logs.push(m), warn: (m: string) => logs.push(m) };
  const env = {
    FormApp: { ItemType: T, openByUrl: () => form },
    SpreadsheetApp: { getActive: () => ({ getFormUrl: () => 'x', getSheetByName: () => null }) },
    console: quiet,
  };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fns = new Function(...Object.keys(env), `${code}\nreturn { umbauAusfuehren, umbauPruefen };`)(...Object.values(env));
  return { ...fns, logs } as { umbauAusfuehren: () => void; umbauPruefen: () => void; logs: string[] };
}

/** Sections as [title, [question titles]] after the rebuild. */
function sections(items: MockItem[]) {
  const out: Array<[string, string[]]> = [['(Start)', []]];
  for (const i of items) {
    if (i.type === T.PAGE_BREAK) out.push([i.title.trim(), []]);
    else out[out.length - 1]![1].push(i.title.trim());
  }
  return out;
}

describe('form rebuild script (docs/google-sheet/formular-umbau.gs)', () => {
  it('builds the planned 9 sections without deleting anything', () => {
    const { items, form } = liveForm();
    const before = [...items];
    const s = runScripts(form);
    s.umbauPruefen();
    expect(items.map((i) => i.title)).toEqual(before.map((i) => i.title)); // dry run changes nothing
    s.umbauAusfuehren();

    expect(before.every((i) => items.includes(i))).toBe(true);
    const result = sections(items);
    expect(result.map(([t]) => t)).toEqual([
      '(Start)', 'Eure Einrichtung', 'Aufgaben & Bedeutung für Erlangen', 'Medien & Material für die Plattform',
      'Vernetzung & Bündnisarbeit', 'Demo // 18.11.2026 / 15 Uhr / Rathausplatz',
      'Weiteres Projekt für eine eingetragene Einrichtung', 'Betroffenes Projekt / Angebot', 'Einverständnisse & Datenschutz',
    ]);
    expect(result[0]![1]).toEqual(['Was möchtet ihr eintragen?']);
    expect(result[1]![1][0]).toBe('Name der Institution / Einrichtung');
    expect(result[3]![1]).toEqual(['Logo der Einrichtung', 'Bildnachweis zum Logo']);
    expect(result[7]![1]).toEqual([
      'Betroffenes Projekt / Angebot', 'Zu welchem Bereich gehört das Projekt / Angebot?',
      'Welche Zuschüsse / Mittel sollen gestrichen oder gekürzt werden?', 'Geplante Kürzung 2027 in Euro',
      'Kürzung in den Folgejahren', 'Kürzung in Prozent', 'Falls es nicht um einen Geldbetrag geht: Was fällt weg?',
      'Quelle des Betrags', 'Welche konkreten Folgen hat die Kürzung?', 'Prägnantes Zitat / Statement zur Lage (Short Quote)',
      'Wie könnte man Euch helfen, wenn es zur Einsparung kommt?',
      'Link zu weiterführenden Informationen / Stellungnahmen / Petitionen', 'Bildnachweis zum Projektbild',
    ]);
  });

  it('wires both paths and the jump after the demo section', () => {
    const { items, form } = liveForm();
    runScripts(form).umbauAusfuehren();
    const start = items.find((i) => i.title === 'Was möchtet ihr eintragen?')!;
    expect(start.choices!.map((c) => c.nav!.title)).toEqual([
      'Eure Einrichtung', 'Weiteres Projekt für eine eingetragene Einrichtung',
    ]);
    const weiteres = items.find((i) => i.title === 'Weiteres Projekt für eine eingetragene Einrichtung')!;
    expect(weiteres.goTo!.title).toBe('Betroffenes Projekt / Angebot');
    expect(items.find((i) => i.title.startsWith('Mit dem Hochladen'))!.required).toBe(false);
  });

  it('does nothing when run a second time', () => {
    const { items, form } = liveForm();
    const s = runScripts(form);
    s.umbauAusfuehren();
    const after = items.map((i) => i.title);
    s.umbauAusfuehren();
    expect(items.map((i) => i.title)).toEqual(after);
    expect(s.logs.some((l) => l.includes('bereits ausgeführt'))).toBe(true);
  });
});
