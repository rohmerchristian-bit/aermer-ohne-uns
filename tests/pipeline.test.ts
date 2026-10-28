import { describe, expect, it } from 'vitest';
import { columns, findColumn, normalizeHeader, PRIVATE_KEYS, type ColumnKey } from '../src/data/columns.ts';
import { DataError, extractUrls, parseImageRef, runPipeline, stripQuotes } from '../src/data/pipeline.ts';
import { parseSettings } from '../src/data/settings.ts';

const OPTIONS = { allowSampleImages: false };

/** Builds a sheet from {key: value} rows using the exact form titles. */
function sheet(keys: ColumnKey[], rows: Array<Partial<Record<ColumnKey, string>>>, headerPrefix = ''): string[][] {
  const header = keys.map((k) => headerPrefix + columns.find((c) => c.key === k)!.header);
  return [header, ...rows.map((r) => keys.map((k) => r[k] ?? ''))];
}

const BASE_KEYS: ColumnKey[] = ['name', 'area', 'consentPublish', 'approved'];
const ok = { consentPublish: 'Ja, einverstanden', approved: 'TRUE' };

describe('column mapping', () => {
  it('normalises headers: whitespace, case, BOM', () => {
    expect(normalizeHeader('﻿  Geplante   Kürzung in Euro pro Jahr ')).toBe('geplante kürzung in euro pro jahr');
    expect(findColumn('  Betroffenes Projekt / Angebot')?.key).toBe('project');
    expect(findColumn('BETRAG_GEPRÜFT')?.key).toBe('amountVerified');
  });

  it('recognises the image consent column by the start of its long consent text', () => {
    const title =
      'Mit dem Hochladen bestätigen wir, dass wir die erforderlichen Nutzungsrechte an den eingereichten Bildern und Logos besitzen und dass alle erkennbar abgebildeten Personen mit der Veröffentlichung einverstanden sind …';
    expect(findColumn(title)?.key).toBe('consentImages');
    expect(findColumn(' Name der Institution / Einrichtung ')?.key).toBe('name');
  });

  it('knows the titles used in the live form', () => {
    expect(findColumn('Betroffenes Projekt / Angebot: Welche konkreten Folgen hat die Kürzung?')?.key).toBe('consequences');
    expect(findColumn('Betroffenes Projekt / Angebot')?.key).toBe('project');
    expect(findColumn('Absagen von Angeboten, Stellenabbau, Schließzeiten, etc.')?.key).toBe('consequences');
    expect(findColumn('Freigeben')?.key).toBe('approved');
    expect(findColumn('Logo-Upload für euer Profil auf der Plattform')?.key).toBe('imageUrls');
    // New private questions must be recognised as private, not as "unknown".
    expect(findColumn('E-Mail-Adresse')?.visibility).toBe('private');
    expect(findColumn('Ich möchte dabei sein und als Teil des Bündnis "ÄrmerOhneUns" an dem Demo mit meiner Organisation teilnehmen (kostenlos).')?.key).toBe('demo');
    expect(findColumn('Wie könnte man Euch helfen, wenn es zur Einsparung kommt?')?.visibility).toBe('private');
    expect(findColumn(' Aufnahme in den Bündnis-Verteiler')?.key).toBe('mailingList');
  });

  it('has unique keys and unique headers', () => {
    expect(new Set(columns.map((c) => c.key)).size).toBe(columns.length);
    const titles = columns.flatMap((c) => [c.header, ...(c.aliases ?? [])].map(normalizeHeader));
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('maps headers with leading spaces', () => {
    const result = runPipeline(sheet([...BASE_KEYS, 'project'], [{ name: 'A', area: 'Kultur', project: 'P', ...ok }], '  '), OPTIONS);
    expect(result.projects[0]!.project.name).toBe('P');
  });

  it('stops with a German error when a required column is missing', () => {
    const table = sheet(['name', 'area', 'approved'], [{ name: 'A', area: 'Kultur', approved: 'TRUE' }]);
    expect(() => runPipeline(table, OPTIONS)).toThrow(DataError);
    expect(() => runPipeline(table, OPTIONS)).toThrow(/Pflichtspalten: „Freigabe zur Veröffentlichung“/);
  });

  it('explains formula errors in the published sheet', () => {
    expect(() => runPipeline([['#REF!']], OPTIONS)).toThrow(/Formel im Blatt „SHEET_PUBLIC_CSV“ liefert den Fehler „#REF!“/);
  });

  it('ignores a repeated header row', () => {
    const table = sheet(BASE_KEYS, [{ name: 'A', area: 'Kultur', ...ok }]);
    table.splice(1, 0, [...table[0]!]);
    const result = runPipeline(table, OPTIONS);
    expect(result.projects.map((e) => e.project.name)).toEqual(['A']);
    expect(result.messages.some((m) => m.message.includes('wiederholt die Kopfzeile'))).toBe(true);
  });

  it('merges several columns of the same field: first non-empty value per row', () => {
    const table = [
      ['Name der Institution / Einrichtung', 'Zu welchem Bereich gehört eure Einrichtung?', 'Freigabe zur Veröffentlichung', 'Freigeben',
        'Absagen von Angeboten, Stellenabbau, Schließzeiten, etc.', 'Welche konkreten Folgen hat die Kürzung?'],
      ['A', 'Kultur & Kunst', 'ja', 'TRUE', 'alt', ''],
      ['B', 'Kultur & Kunst', 'ja', 'TRUE', '', 'neu'],
    ];
    const result = runPipeline(table, OPTIONS);
    expect(result.projects.map((e) => e.project.consequences)).toEqual(['alt', 'neu']);
    expect(result.messages.some((m) => m.message.includes('doppelt'))).toBe(false);
  });

  it('reads the organisation name from whichever duplicate name column is filled', () => {
    const table = [
      ['Name der Institution / Einrichtung', 'Zu welchem Bereich gehört eure Einrichtung?', 'Name der Institution / Einrichtung',
        'Freigabe zur Veröffentlichung', 'Freigeben'],
      ['Alt', 'Kultur & Kunst', '', 'ja', 'TRUE'],
      ['', 'Kultur & Kunst', 'Neu', 'ja', 'TRUE'],
    ];
    const result = runPipeline(table, OPTIONS);
    expect(result.organisations.map((o) => o.organisation.name)).toEqual(['Alt', 'Neu']);
    expect(result.stats.invalid).toBe(0);
  });

  it('warns about unknown columns and ignores them', () => {
    const table = sheet(BASE_KEYS, [{ name: 'A', area: 'Kultur', ...ok }]);
    table[0]!.push('Neue Frage');
    table[1]!.push('egal');
    const result = runPipeline(table, OPTIONS);
    expect(result.messages.some((m) => m.message.includes('Unbekannte Spalte „Neue Frage“'))).toBe(true);
  });
});

describe('privacy allowlist', () => {
  // A deliberately misconfigured "SHEET_PUBLIC_CSV" sheet that publishes EVERY column.
  const ALL_KEYS = columns.map((c) => c.key);
  const SECRET: Partial<Record<ColumnKey, string>> = {
    submittedAt: '01.10.2026 10:00:00 GEHEIM-ZEIT',
    contact: 'Erika GEHEIM-Mustermann, Vorstand',
    email: 'geheim-adresse@private.test',
    actions: 'GEHEIM-AKTION am Rathaus',
    rooms: 'GEHEIM-RAUM Keller',
    mailingList: 'GEHEIM-VERTEILER ja',
    demo: 'GEHEIM-DEMO Redebeitrag',
    help: 'GEHEIM-HILFE Spende',
  };
  const row = {
    ...SECRET,
    name: 'Öffentlicher Verein',
    area: 'Soziales',
    project: 'Projekt',
    amountReported: '10.000 €',
    consentImages: 'ja',
    imageUrls: 'https://drive.google.com/open?id=abcdefghijklmnop',
    ...ok,
  };

  it('never copies private fields into the output, even if the sheet publishes them', () => {
    const result = runPipeline(sheet(ALL_KEYS, [row]), OPTIONS);
    expect(result.projects).toHaveLength(1);
    const output = JSON.stringify(result);
    for (const [key, secret] of Object.entries(SECRET)) {
      expect(output, `private field ${key} leaked`).not.toContain(secret);
      expect(output).not.toMatch(/GEHEIM/);
    }
  });

  it('warns loudly for every private column found in the sheet', () => {
    const result = runPipeline(sheet(ALL_KEYS, [row]), OPTIONS);
    const privateWarnings = result.messages.filter((m) => m.message.includes('private Spalte'));
    expect(privateWarnings).toHaveLength(PRIVATE_KEYS.size);
  });

  it('outputs exactly the public organisation and project fields', () => {
    const result = runPipeline(sheet(ALL_KEYS, [row]), OPTIONS);
    expect(Object.keys(result.organisations[0]!.organisation).sort()).toEqual(
      ['address', 'description', 'links', 'logo', 'name', 'reach', 'slug', 'website'].sort(),
    );
    expect(Object.keys(result.projects[0]!.project).sort()).toEqual(
      [
        'id', 'anchor', 'orgSlug', 'orgName', 'name', 'area', 'cutDescription', 'amount', 'amountKind', 'amountSource',
        'amountLater', 'amountPercent', 'nonMonetary', 'consequences', 'quote', 'infoLink', 'contactEmail', 'contactPhone', 'image', 'ownImage', 'featured',
      ].sort(),
    );
  });

  it('drops entries that are not approved or have no publication consent', () => {
    const table = sheet(BASE_KEYS, [
      { name: 'Freigegeben', area: 'Kultur', ...ok },
      { name: 'Nicht angehakt', area: 'Kultur', consentPublish: 'Ja', approved: 'FALSE' },
      { name: 'Leer', area: 'Kultur', consentPublish: 'Ja', approved: '' },
      { name: 'Ohne Zustimmung', area: 'Kultur', consentPublish: '', approved: 'TRUE' },
      { name: 'Nein', area: 'Kultur', consentPublish: 'Nein, bitte nicht', approved: 'WAHR' },
    ]);
    const result = runPipeline(table, OPTIONS);
    expect(result.projects.map((e) => e.project.name)).toEqual(['Freigegeben']);
    expect(result.stats).toMatchObject({ projects: 1, organisations: 1, notApproved: 2, noConsent: 2 });
  });

  it('accepts German checkbox values (WAHR)', () => {
    const result = runPipeline(sheet(BASE_KEYS, [{ name: 'A', area: 'Kultur', consentPublish: 'x', approved: 'WAHR' }]), OPTIONS);
    expect(result.projects).toHaveLength(1);
  });

  it('uses images only with image consent', () => {
    const keys: ColumnKey[] = [...BASE_KEYS, 'imageUrls', 'projectImageUrls', 'consentImages'];
    const img = 'https://drive.google.com/open?id=abcdefghijklmnop';
    const img2 = 'https://drive.google.com/open?id=qrstuvwxyz123456';
    const result = runPipeline(
      sheet(keys, [
        { name: 'Mit', area: 'Kultur', imageUrls: img, projectImageUrls: img2, consentImages: 'Ja, das bestätigen wir.', ...ok },
        { name: 'Ohne', area: 'Kultur', imageUrls: img, projectImageUrls: img2, consentImages: '', ...ok },
      ]),
      OPTIONS,
    );
    expect(result.organisations.map((o) => o.logoRef)).toEqual([{ kind: 'drive', id: 'abcdefghijklmnop' }, null]);
    expect(result.projects.map((p) => p.imageRef)).toEqual([{ kind: 'drive', id: 'qrstuvwxyz123456' }, null]);
  });
});

describe('field rules', () => {
  const keys: ColumnKey[] = [...BASE_KEYS, 'amountReported', 'amountVerified', 'amountSource', 'quote', 'links', 'featured'];

  it('prefers the verified amount and keeps the source', () => {
    const [e] = runPipeline(
      sheet(keys, [{ name: 'A', area: 'Kultur', amountReported: '40.000', amountVerified: '45.000', amountSource: 'Vorlage', ...ok }]),
      OPTIONS,
    ).projects;
    expect(e!.project).toMatchObject({ amount: 45000, amountKind: 'verified', amountSource: 'Vorlage' });
  });

  it('falls back to the reported amount and warns about unreadable values', () => {
    const result = runPipeline(
      sheet(keys, [
        { name: 'A', area: 'Kultur', amountReported: 'ca. 25 Tsd.', ...ok },
        { name: 'B', area: 'Kultur', amountReported: 'weiß nicht', ...ok },
      ]),
      OPTIONS,
    );
    expect(result.projects.map((e) => [e.project.amount, e.project.amountKind])).toEqual([
      [25000, 'reported'],
      [null, null],
    ]);
    expect(result.messages.some((m) => m.message.includes('Betrag nicht lesbar („weiß nicht“)'))).toBe(true);
  });

  it('sorts unknown areas into Sonstiges with a warning', () => {
    const result = runPipeline(sheet(keys, [{ name: 'A', area: 'Kunst & Soziales', ...ok }]), OPTIONS);
    expect(result.projects[0]!.project.area).toBe('sonstiges');
    expect(result.messages.some((m) => m.message.includes('Unbekannter Bereich „Kunst & Soziales“'))).toBe(true);
  });

  it('maps the area answers exactly as offered in the form', () => {
    const answers = [
      ['Kultur & Kunst', 'kultur'],
      ['Bildung & Schule / Weiterbildung', 'bildung'],
      ['Soziales, Familie & Senioren', 'soziales'],
      ['Kinder & Jugend', 'jugend'],
      ['Sport & Freizeit', 'sport'],
      ['Umwelt & Nachhaltigkeit', 'umwelt'],
      ['Sonstiges', 'sonstiges'],
    ];
    const result = runPipeline(sheet(keys, answers.map(([area], i) => ({ name: `E${i}`, area, ...ok }))), OPTIONS);
    expect(result.projects.map((e) => e.project.area)).toEqual(answers.map(([, slug]) => slug));
    expect(result.messages.filter((m) => m.message.includes('Unbekannter Bereich'))).toHaveLength(0);
  });

  it('matches areas case-insensitively', () => {
    const result = runPipeline(sheet(keys, [{ name: 'A', area: ' BILDUNG ', ...ok }]), OPTIONS);
    expect(result.projects[0]!.project.area).toBe('bildung');
  });

  it('creates unique organisation slugs for different names with the same slug', () => {
    const result = runPipeline(
      sheet(keys, [
        { name: 'Café Mitte', area: 'Kultur', ...ok },
        { name: 'Cafe Mitte', area: 'Kultur', ...ok },
      ]),
      OPTIONS,
    );
    expect(result.organisations.map((o) => o.organisation.slug)).toEqual(['cafe-mitte', 'cafe-mitte-2']);
  });

  it('merges an organisation entered twice as new and keeps both projects', () => {
    const result = runPipeline(
      sheet([...keys, 'project'], [
        { name: 'Jugendhaus Süd', area: 'Jugend', project: 'Treff', ...ok },
        { name: 'Jugendhaus  SÜD', area: 'Jugend', project: 'Treff', ...ok },
      ]),
      OPTIONS,
    );
    expect(result.organisations).toHaveLength(1);
    expect(result.projects.map((e) => e.project.id)).toEqual(['jugendhaus-sued--treff', 'jugendhaus-sued--treff-2']);
    expect(result.messages.some((m) => m.message.includes('mehrfach als neu eingetragen'))).toBe(true);
  });

  it('strips quotation marks around quotes and reads featured', () => {
    const [e] = runPipeline(sheet(keys, [{ name: 'A', area: 'Kultur', quote: ' „Wir bleiben.“ ', featured: 'TRUE', ...ok }]), OPTIONS)
      .projects;
    expect(e!.project.quote).toBe('Wir bleiben.');
    expect(e!.project.featured).toBe(true);
  });
});

describe('several projects per organisation', () => {
  const NEW = 'Unsere Einrichtung ist neu hier – wir tragen die Einrichtung und ein erstes betroffenes Projekt ein';
  const MORE = 'Ein weiteres betroffenes Projekt für eine bereits eingetragene Einrichtung';
  const keys: ColumnKey[] = [
    ...BASE_KEYS, 'entryType', 'orgSelect', 'project', 'amountReported', 'amountLater', 'amountPercent', 'nonMonetary',
  ];

  it('attaches additional projects to their organisation, whatever the row order', () => {
    const result = runPipeline(
      sheet(keys, [
        { entryType: MORE, orgSelect: 'E-Werk', project: 'Streetwork', area: 'Soziales, Familie & Senioren', amountReported: '11.000', amountPercent: '10 %', ...ok },
        { entryType: NEW, name: 'E-Werk', project: 'Kulturzentrum', area: 'Kultur & Kunst', amountReported: '50.000', amountLater: '2028: 85.000 €', ...ok },
        { entryType: MORE, orgSelect: ' e-werk ', project: 'Saal', area: 'Kultur & Kunst', nonMonetary: 'Wegfall der Mietzuschüsse', ...ok },
      ]),
      OPTIONS,
    );
    expect(result.organisations.map((o) => o.organisation.name)).toEqual(['E-Werk']);
    expect(result.projects.map((e) => [e.project.orgSlug, e.project.name, e.project.area, e.project.amount])).toEqual([
      ['e-werk', 'Kulturzentrum', 'kultur', 50000],
      ['e-werk', 'Streetwork', 'soziales', 11000],
      ['e-werk', 'Saal', 'kultur', null],
    ]);
    expect(result.projects[0]!.project.amountLater).toBe('2028: 85.000 €');
    expect(result.projects[1]!.project.amountPercent).toBe('10 %');
    expect(result.projects[2]!.project.nonMonetary).toBe('Wegfall der Mietzuschüsse');
  });

  it('skips additional projects for organisations that are not approved', () => {
    const result = runPipeline(
      sheet(keys, [
        { entryType: NEW, name: 'Verein', project: 'A', area: 'Kultur & Kunst', consentPublish: 'ja', approved: 'FALSE' },
        { entryType: MORE, orgSelect: 'Verein', project: 'B', area: 'Kultur & Kunst', ...ok },
      ]),
      OPTIONS,
    );
    expect(result.projects).toHaveLength(0);
    expect(result.organisations).toHaveLength(0);
    expect(result.messages.some((m) => m.message.includes('nicht (mehr) freigegeben'))).toBe(true);
  });

  it('treats answers from before the form was split as new organisations', () => {
    const result = runPipeline(sheet(keys, [{ entryType: '', name: 'Alt', area: 'Kultur & Kunst', ...ok }]), OPTIONS);
    expect(result.projects.map((e) => [e.project.name, e.project.orgName])).toEqual([['Alt', 'Alt']]);
  });

  it('warns about very long project names (old combined question)', () => {
    const result = runPipeline(sheet(keys, [{ name: 'A', area: 'Kultur & Kunst', project: 'x '.repeat(60), ...ok }]), OPTIONS);
    expect(result.messages.some((m) => m.message.includes('Projektname ist sehr lang'))).toBe(true);
  });
});

describe('helpers', () => {
  it('extracts only http(s) links', () => {
    expect(extractUrls('Web: www.example.org, Insta https://instagram.com/x; javascript:alert(1)')).toEqual([
      'https://www.example.org/',
      'https://instagram.com/x',
    ]);
    expect(extractUrls('keine Website')).toEqual([]);
  });

  it('reads Google Drive links in all common forms', () => {
    expect(parseImageRef('https://drive.google.com/open?id=1AbC_dEf-GhIjKl', OPTIONS)).toEqual({ kind: 'drive', id: '1AbC_dEf-GhIjKl' });
    expect(parseImageRef('https://drive.google.com/file/d/1AbC_dEf-GhIjKl/view', OPTIONS)).toEqual({ kind: 'drive', id: '1AbC_dEf-GhIjKl' });
    expect(parseImageRef('https://drive.google.com/open?id=FIRST123456, https://drive.google.com/open?id=SECOND12345', OPTIONS)).toEqual({
      kind: 'drive',
      id: 'FIRST123456',
    });
  });

  it('allows sample paths only in sample mode and never path traversal', () => {
    expect(parseImageRef('bilder/a.jpg', OPTIONS)).toBeNull();
    expect(parseImageRef('bilder/a.jpg', { allowSampleImages: true })).toEqual({ kind: 'sample', path: 'bilder/a.jpg' });
    expect(parseImageRef('../geheim.jpg', { allowSampleImages: true })).toBeNull();
    expect(parseImageRef('https://example.org/bild.jpg', { allowSampleImages: true })).toBeNull();
  });

  it('stripQuotes removes outer pairs only and keeps inner quotation marks', () => {
    expect(stripQuotes('"Sie sagen „nie wieder“"')).toBe('Sie sagen „nie wieder“');
    expect(stripQuotes('»„Doppelt“«')).toBe('Doppelt');
    expect(stripQuotes('Wir sagen „nein“')).toBe('Wir sagen „nein“');
  });
});

describe('settings', () => {
  it('uses defaults for empty values and parses known keys', () => {
    const { settings, messages } = parseSettings([
      ['Schlüssel', 'Wert'],
      ['spenden_stand_euro', '87.450 €'],
      ['wirwunder_url', ''],
      ['kontakt_email', 'kein-mail'],
      ['hashtags', 'ÄrmerOhneUns, #Erlangen'],
      ['tippfehler', 'x'],
    ]);
    expect(settings.donationCurrent).toBe(87450);
    expect(settings.donationGoal).toBe(500000);
    expect(settings.wirwunderUrl).toBeNull();
    expect(settings.contactEmail).toBeNull();
    expect(settings.hashtags).toEqual(['#ÄrmerOhneUns', '#Erlangen']);
    expect(messages.map((m) => m.message).join('\n')).toMatch(/unbekannter Schlüssel „tippfehler“/);
    expect(messages.map((m) => m.message).join('\n')).toMatch(/keine gültige E-Mail-Adresse/);
  });
});
