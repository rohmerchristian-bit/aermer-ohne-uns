// Donation status for the WirWunder campaign.
// Today the numbers are maintained by hand in the "Einstellungen" sheet. To fetch them
// automatically later, replace the body of getDonationStatus (e.g. with a build-time request
// in scripts/prepare-data.ts that writes the same fields) – the component stays unchanged.

import type { Settings } from './settings.ts';

export interface DonationStatus {
  /** null → campaign not live yet: show "Spendenaktion startet in Kürze". */
  url: string | null;
  /** Second online option (BetterPlace); null hides the button. */
  betterplaceUrl: string | null;
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
  return { url: settings.wirwunderUrl, betterplaceUrl: settings.betterplaceUrl, current, goal, asOf: settings.donationDate, percent };
}

/**
 * Central donation account at the Erlanger Bürgerstiftung (cooperation of the alliance, team text of 28.10.2026).
 * The Bürgerstiftung manages the money; a board of trustees ("Kuratorium") decides which clubs and projects receive it.
 */
export const DONATION_ACCOUNT = {
  recipient: 'Bürgerstiftung Erlangen',
  iban: 'DE40763500000060156059',
  bic: 'BYLADEM1ERH',
  reference: 'ÄrmerOhneUns',
} as const;

/** "DE40 7635 0000 0060 1560 59" – groups of four for reading and copying. */
export function formatIban(iban: string): string {
  return iban.replace(/(.{4})(?=.)/g, '$1 ');
}

/** ISO 13616 checksum: guards against a typo in the account number. */
export function isValidIban(iban: string): boolean {
  const compact = iban.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(compact)) return false;
  const digits = (compact.slice(4) + compact.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  return [...digits].reduce((rest, d) => (rest * 10 + Number(d)) % 97, 0) === 1;
}

/**
 * Content of the "GiroCode" (EPC QR code, version 002, UTF-8): banking apps fill in recipient,
 * IBAN, BIC and reference; the donor only enters the amount.
 */
export function giroCodePayload(account: typeof DONATION_ACCOUNT): string {
  return ['BCD', '002', '1', 'SCT', account.bic, account.recipient, account.iban, '', '', '', account.reference].join('\n');
}
