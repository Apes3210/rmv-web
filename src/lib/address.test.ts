import { describe, expect, it } from 'vitest';

import { formatPersonName, parsePinnedSiteAddress } from './address';

describe('parsePinnedSiteAddress', () => {
  it('maps a landmark address into official site address fields', () => {
    expect(parsePinnedSiteAddress('Luvers Resort, San Rafael, Montalban, Rizal, Calabarzon, 1860, Philippines')).toEqual({
      street: 'Luvers Resort',
      barangay: 'San Rafael',
      city: 'Montalban',
      province: 'Rizal',
      zip: '1860',
    });
  });

  it('keeps street blank when the pinned address starts at barangay level', () => {
    expect(parsePinnedSiteAddress('San Rafael, Montalban, Rizal, Calabarzon, 1860, Philippines')).toEqual({
      street: '',
      barangay: 'San Rafael',
      city: 'Montalban',
      province: 'Rizal',
      zip: '1860',
    });
  });

  it('ignores region and country tokens even without a zip code', () => {
    expect(parsePinnedSiteAddress('Barangay 1, Quezon City, Metro Manila, NCR, Philippines')).toEqual({
      street: '',
      barangay: 'Barangay 1',
      city: 'Quezon City',
      province: 'Metro Manila',
      zip: '',
    });
  });
});

describe('formatPersonName', () => {
  it('normalizes inconsistent stored customer name casing for display', () => {
    expect(formatPersonName('gene', 'legaspi')).toBe('Gene Legaspi');
    expect(formatPersonName('CARL', 'JOHNSON')).toBe('Carl Johnson');
  });
});
