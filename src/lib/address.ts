export type ParsedSiteAddress = {
  street: string;
  barangay: string;
  city: string;
  province: string;
  zip: string;
};

const COUNTRY_TOKENS = new Set(['philippines', 'ph']);
const REGION_TOKENS = new Set([
  'calabarzon',
  'ncr',
  'national capital region',
  'central luzon',
  'western visayas',
  'central visayas',
  'eastern visayas',
  'bicol region',
  'mimaropa',
  'caraga',
  'cordillera administrative region',
]);

function normalizeAddressToken(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function parsePinnedSiteAddress(address: string): ParsedSiteAddress {
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !COUNTRY_TOKENS.has(normalizeAddressToken(part)));

  const zipIndex = parts.findIndex((part) => /^\d{4}$/.test(part));
  const zip = zipIndex >= 0 ? (parts.splice(zipIndex, 1)[0] || '') : '';

  const withoutRegions = parts.filter((part) => !REGION_TOKENS.has(normalizeAddressToken(part)));
  const province = withoutRegions.pop() || '';
  const city = withoutRegions.pop() || '';
  const barangay = withoutRegions.pop() || '';
  const street = withoutRegions.join(', ');

  return { street, barangay, city, province, zip };
}

export function formatPersonName(firstName?: string, lastName?: string) {
  const fullName = [firstName, lastName]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');

  return fullName.replace(/\S+/g, (word) => (
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ));
}
