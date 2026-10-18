// Official figures from the city administration. Wording follows the source document;
// do not round or recalculate. The source title and URL are maintained in the
// "Einstellungen" sheet (quelle_vorlage_titel, quelle_vorlage_url).

export interface BudgetFact {
  value: string;
  label: string;
}

export const budgetFacts: BudgetFact[] = [
  { value: '10,8 Mio. €', label: 'zu erzielendes Einsparvolumen für den Haushalt 2027' },
  { value: '5,4 Mio. €', label: 'Einsparvolumen für 2026, das noch „in anderer Form“ zu erbringen ist' },
  { value: '8,483 Mio. €', label: 'Einsparvorschläge aus den Referatsklausuren – vorgegeben waren dort 8,648 Mio. €' },
  { value: 'Januar 2027', label: 'Beschluss im Haushalts-Stadtrat' },
];

/** Additional detail for the background page. */
export const budgetDetails: string[] = [
  'Von den 10,8 Mio. € für 2027 sind 2,2 Mio. € bereits in den Budgets des Haushaltsentwurfs berücksichtigt.',
  'Für die Referatsklausuren verblieben 8,648 Mio. €; identifiziert wurden 8,483 Mio. €, rechnerisch fehlen noch 0,165 Mio. €.',
  'Die Einsparvorschläge gehen zur Einzelabstimmung in die Fachausschüsse und den Haushalts-HFPA.',
  'Beschlossen wird der Haushalt im Haushalts-Stadtrat im Januar 2027.',
  'Für 2026 bleiben 5,4 Mio. € „in anderer Form“ noch zu erbringen.',
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
    date: 'Januar 2027',
    isoDate: '2027-01-01',
    title: 'Haushalts-Stadtrat',
    text: 'Der Stadtrat beschließt den Haushalt 2027.',
  },
];
