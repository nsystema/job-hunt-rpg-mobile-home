import { City, Country } from 'country-state-city';

export const Grey = 'rgba(148,163,184,.95)';

export const PLATFORMS = [
  'Company website',
  'LinkedIn Jobs',
  'Jobup',
  'Indeed',
  'Jobscout24',
  'Monster',
  'Jobtic',
  'Tietalent',
  'Stepstone',
  'Glassdoor',
  'JobCloud',
  'Work.swiss',
];

export const STATUSES = [
  { key: 'Applied', hint: 'Sent' },
  { key: 'Applied with referral', hint: 'Referral' },
  { key: 'Interview', hint: 'Stage' },
  { key: 'Ghosted', hint: 'No reply' },
  { key: 'Rejected', hint: 'Closed' },
];

const COUNTRIES_DATA = Country.getAllCountries();

export const COUNTRIES = COUNTRIES_DATA
  .map((country) => country.name)
  .filter(Boolean)
  .sort((a, b) => a.localeCompare(b));

const COUNTRY_CODE_LOOKUP = new Map(
  COUNTRIES_DATA.map((country) => [country.name, country.isoCode]),
);

const cityCache = new Map();

export const getCitiesForCountry = (countryName) => {
  if (!countryName || !COUNTRY_CODE_LOOKUP.has(countryName)) {
    return [];
  }
  if (cityCache.has(countryName)) {
    return cityCache.get(countryName);
  }
  const isoCode = COUNTRY_CODE_LOOKUP.get(countryName);
  const cities = Array.from(
    new Set(
      City.getCitiesOfCountry(isoCode)
        .map((city) => city.name)
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));
  cityCache.set(countryName, cities);
  return cities;
};
