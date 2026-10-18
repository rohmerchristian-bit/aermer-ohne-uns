// Donation status for the WirWunder campaign.
// Today the numbers are maintained by hand in the "Einstellungen" sheet. To fetch them
// automatically later, replace the body of getDonationStatus (e.g. with a build-time request
// in scripts/prepare-data.ts that writes the same fields) – the component stays unchanged.

import type { Settings } from './settings.ts';

export interface DonationStatus {
  /** null → campaign not live yet: show "Spendenaktion startet in Kürze". */
  url: string | null;
  current: number | null;
  goal: number | null;
  /** Date of the last update, as entered in the sheet. */
  asOf: string | null;
  /** 0–100, only when current and goal are known. */
  percent: number | null;
}

export function getDonationStatus(settings: Settings): DonationStatus {
  const current = settings.donationCurrent;
  const goal = settings.donationGoal;
  const percent = current !== null && goal ? Math.min(100, Math.round((current / goal) * 100)) : null;
  return { url: settings.wirwunderUrl, current, goal, asOf: settings.donationDate, percent };
}
