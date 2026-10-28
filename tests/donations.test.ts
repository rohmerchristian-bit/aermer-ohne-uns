import { describe, expect, it } from 'vitest';
import { DONATION_ACCOUNT, formatIban, giroCodePayload, isValidIban } from '../src/data/donations.ts';

describe('donation account', () => {
  it('has a valid IBAN (catches typos in the account number)', () => {
    expect(isValidIban(DONATION_ACCOUNT.iban)).toBe(true);
    expect(isValidIban('DE40763500000060156058')).toBe(false);
    expect(isValidIban('DE40 7635 0000 0060 1560 59')).toBe(true);
  });

  it('shows the IBAN in groups of four', () => {
    expect(formatIban(DONATION_ACCOUNT.iban)).toBe('DE40 7635 0000 0060 1560 59');
  });

  it('builds a GiroCode that banking apps understand (EPC QR, version 002)', () => {
    const lines = giroCodePayload(DONATION_ACCOUNT).split('\n');
    expect(lines.slice(0, 4)).toEqual(['BCD', '002', '1', 'SCT']);
    expect(lines[4]).toBe('BYLADEM1ERH');
    expect(lines[5]).toBe('Bürgerstiftung Erlangen');
    expect(lines[6]).toBe('DE40763500000060156059');
    expect(lines[7]).toBe(''); // amount left to the donor
    expect(lines[10]).toBe('ÄrmerOhneUns');
    expect(lines).toHaveLength(11);
  });
});
