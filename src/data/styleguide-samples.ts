import type { Institution } from './types';

// Fictional entries for the styleguide only. Clearly marked as examples.

export const styleguideSamples: Institution[] = [
  {
    slug: 'beispiel-theater-am-fluss',
    name: 'Beispiel: Theater am Fluss',
    area: 'kultur',
    project: 'Kindertheater-Reihe „Bühne frei“',
    amount: 45000,
    amountKind: 'verified',
    amountSource: 'Sparliste der Stadt, Vorlage II/056/2026',
    description: 'Fiktiver Eintrag für den Styleguide.',
    quote: 'Ohne die Förderung fällt jede zweite Vorstellung für Schulklassen weg.',
    consequences:
      'Die Reihe für Grundschulen müsste eingestellt werden. Rund 3.000 Kinder pro Jahr verlieren ihren ersten Theaterbesuch; zwei Teilzeitstellen in der Theaterpädagogik entfallen.',
    website: 'https://example.org',
    infoLink: null,
    image: null,
    featured: true,
  },
  {
    slug: 'beispiel-lernwerkstatt',
    name: 'Beispiel: Lernwerkstatt Nord',
    area: 'bildung',
    project: 'Hausaufgabenhilfe',
    amount: 18500,
    amountKind: 'reported',
    amountSource: null,
    description: null,
    quote: 'Wir sind oft der einzige ruhige Ort zum Lernen.',
    consequences: 'Die Nachmittagsbetreuung für 60 Kinder an drei Tagen pro Woche entfällt.',
    website: 'https://example.org',
    infoLink: 'https://example.org/stellungnahme',
    image: null,
    featured: false,
  },
  {
    slug: 'beispiel-stadtteilverein',
    name: 'Beispiel: Gemeinnütziger Stadtteil- und Begegnungsverein Erlangen-Bruck-Anger',
    area: 'soziales',
    project:
      'Offener Mittagstisch, Sozialberatung, Seniorentreff und Sprachcafé mit ehrenamtlicher Begleitung für Neuzugezogene',
    amount: 132000,
    amountKind: 'verified',
    amountSource: 'Haushaltsentwurf 2027, Produktbereich Soziale Hilfen, Zeile 412',
    description: null,
    quote:
      'Wenn der Treff schließt, verlieren viele ältere Menschen im Viertel den einzigen Ort, an dem sie täglich jemanden treffen, mit dem sie reden können – und das merkt man nicht sofort, sondern erst, wenn es zu spät ist.',
    consequences:
      'Der Mittagstisch mit rund 80 Essen pro Tag müsste schließen, die Sozialberatung würde auf einen Tag pro Woche reduziert, das Sprachcafé entfiele vollständig. Ehrenamtliche verlieren ihre Anlaufstelle, Kooperationen mit Schulen und Kitas im Stadtteil enden. Langfristig steigen die Kosten an anderer Stelle, weil Probleme später und teurer aufgefangen werden müssen.',
    website: 'https://example.org',
    infoLink: null,
    image: null,
    featured: false,
  },
  {
    slug: 'beispiel-jugendhaus',
    name: 'Beispiel: Jugendhaus Ost',
    area: 'jugend',
    project: 'Offener Treff am Wochenende',
    amount: null,
    amountKind: null,
    amountSource: null,
    description: null,
    quote: null,
    consequences: 'Der Samstagstreff würde gestrichen.',
    website: null,
    infoLink: null,
    image: null,
    featured: false,
  },
];
