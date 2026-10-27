// Official figures from the city administration. Wording follows the source document;
// do not round or recalculate. The source title and URL are maintained in the
// "Einstellungen" sheet (quelle_vorlage_titel, quelle_vorlage_url).

/** The year whose cut is shown on the tiles and added up (the "2027" amount in the form). */
export const AMOUNT_YEAR = 2027;

export interface BudgetFact {
  value: string;
  label: string;
}

/** Headline figure on the home page: savings target set by the Regierung von Mittelfranken (E-Werk team, 27.10.2026). */
export const headline = {
  /** Shown as "29 Mio. €"; counted up from 0 on the home page. */
  millions: 29,
  subtitle: 'weniger für Bildung, Familien, Kinder & Jugend, Kultur und Sport.',
  basis:
    'Derzeit geplante Einsparungen bis 2029 – diese Summe fordert die Regierung von Mittelfranken im Zuge der Haushaltskonsolidierung der Stadt Erlangen.',
};

export const budgetFacts: BudgetFact[] = [
  { value: '8.483.000 €', label: 'Einsparmöglichkeiten auf der Liste für 2027' },
  { value: '11.813.900 €', label: 'Einsparmöglichkeiten auf der Liste für 2028' },
  { value: '15.043.200 €', label: 'Einsparmöglichkeiten auf der Liste für 2029' },
  { value: 'Januar 2027', label: 'Der Stadtrat stimmt über die Sparliste ab.' },
];

/** Shown below the facts: the list holds more measures than the target requires. */
export const listNote =
  'Zusammen enthält die Liste Maßnahmen über rund 35,3 Mio. € – mehr als die geforderten 29 Mio. €. Welche davon umgesetzt werden, entscheidet der Stadtrat.';

/** Savings 2026–2029 by department ("Referat") with the largest cuts. */
export const affectedDepartments: BudgetFact[] = [
  { value: '1,1 Mio. €', label: 'Referat 1 · u. a. Sport' },
  { value: '3,7 Mio. €', label: 'Referat 4 · Kultur, Bildung und Freizeit' },
  { value: '11,5 Mio. €', label: 'Referat 5 · Jugend, Familie und Soziales' },
  { value: '0,4 Mio. €', label: 'Referat 7 · Umwelt und Klimaschutz' },
];

export interface TimelineStep {
  date: string;
  title: string;
  text: string;
  /** ISO date of the step, if exactly known – used to mark past steps. */
  isoDate?: string;
}

export const timeline: TimelineStep[] = [
  {
    date: '24.09.2026',
    isoDate: '2026-09-24',
    title: 'Mitteilung an den Stadtrat',
    text: 'Die Verwaltung bringt die Einsparmöglichkeiten zum Haushaltsentwurf 2027 ein (Vorlage II/056/2026).',
  },
  {
    date: 'Herbst 2026',
    title: 'Fachausschüsse und Haushalts-HFPA',
    text: 'Die Einsparvorschläge werden einzeln abgestimmt. Hier entscheidet sich, was gestrichen wird.',
  },
  {
    date: '18.11.2026',
    isoDate: '2026-11-18',
    title: 'Kundgebung am Rathausplatz',
    text: 'Mittwoch, 15:00 Uhr, Rathausplatz Erlangen.',
  },
  {
    date: 'Januar 2027',
    isoDate: '2027-01-01',
    title: 'Haushalts-Stadtrat',
    text: 'Der Stadtrat beschließt den Haushalt 2027.',
  },
];
