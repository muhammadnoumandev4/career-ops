import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyLocationEligibility } from '../lib/location-eligibility.mjs';

test('mixed worldwide and European location tags preserve multi-region scope and Italy eligibility', () => {
  const result = classifyLocationEligibility({
    title: 'Full-Stack Engineer',
    location: 'Remote; Europe; Ireland; Poland; United Kingdom; United States',
    remote: true,
  });
  assert.equal(result.candidateEligibility, 'ELIGIBLE');
  assert.equal(result.geographicScope.classification, 'MULTI_REGION');
  assert.deepEqual(result.geographicScope.eligibleRegions, ['EUROPE', 'UK']);
  assert.equal(result.workArrangement.value, 'REMOTE');
});

test('a finite remote-country list with no Italy is ineligible when the posting says it is a hiring list', () => {
  const result = classifyLocationEligibility({
    location: 'Poland; Germany; Ireland; Portugal',
    remote: true,
    description: 'We are open to candidates currently living in: Poland, Germany, Portugal, Ireland.',
  });
  assert.equal(result.candidateEligibility, 'INELIGIBLE');
  assert.deepEqual(result.geographicScope.eligibleCountries.sort(), ['DE', 'IE', 'PL', 'PT']);
});

test('a narrow country list and remote-within restriction outrank broader EU marketing', () => {
  const finiteList = classifyLocationEligibility({
    location: 'Remote — EU',
    description: 'We are open to candidates currently living in: Poland, Germany, Ireland, Portugal.',
  });
  assert.equal(finiteList.candidateEligibility, 'INELIGIBLE');
  assert.match(finiteList.eligibilityReason, /narrower hiring-country restriction/i);

  const withinUs = classifyLocationEligibility({
    location: 'Remote',
    description: 'Remote within the United States only.',
  });
  assert.equal(withinUs.candidateEligibility, 'INELIGIBLE');
});

test('an EU hiring region with an explicit Italy exclusion is not rescued by the EU match', () => {
  const result = classifyLocationEligibility({
    location: 'Remote, EU',
    remote: true,
    description: 'Remote from anywhere in the EU except Italy.',
  });
  assert.equal(result.candidateEligibility, 'INELIGIBLE');
  assert.deepEqual(result.geographicScope.eligibleRegions, ['EU']);
  assert.deepEqual(result.geographicScope.eligibleCountries, []);
  assert.deepEqual(result.geographicScope.excludedCountries, ['IT']);
});

test('structured EU and country values are normalized, while CET remains only a timezone constraint', () => {
  const italy = classifyLocationEligibility({
    location: 'Spain; Italy; Portugal',
    countries: ['ES', 'IT', 'PT'],
    work_mode: 'remote',
    employment_type: 'contract',
    description: 'Remote – within European time zones (CET).',
  });
  assert.equal(italy.candidateEligibility, 'ELIGIBLE');
  assert.equal(italy.employmentModel, 'CONTRACTOR');
  assert.equal(italy.timeZoneRequirement, 'CET');
  assert.equal(italy.geographicScope.eligibleRegions.includes('EUROPE'), false);

  const timezoneOnly = classifyLocationEligibility({ location: 'Remote CET', remote: true });
  assert.equal(timezoneOnly.candidateEligibility, 'UNKNOWN');
  assert.equal(timezoneOnly.geographicScope.classification, 'UNSPECIFIED');
  assert.equal(timezoneOnly.timeZoneRequirement, 'CET');
});

test('right-to-work and sponsorship remain independent; the EEA is recognized as a region', () => {
  const result = classifyLocationEligibility({
    location: 'Remote — EEA',
    regions: ['eea'],
    remote: true,
    employment_type: 'full_time',
    description: 'Right to work in the UK or EU without sponsorship is required.',
  }, { authorizedCountries: ['Italy'] });
  assert.equal(result.candidateEligibility, 'ELIGIBLE');
  assert.equal(result.geographicScope.classification, 'EEA');
  assert.deepEqual(result.geographicScope.eligibleRegions, ['EEA']);
  assert.equal(result.hiringEligibility.workAuthorization, 'REQUIRED');
  assert.deepEqual(result.hiringEligibility.workAuthorizationRegions, ['EU', 'UK']);
  assert.equal(result.hiringEligibility.candidateWorkAuthorization, 'REVIEW_REQUIRED');
  assert.equal(result.hiringEligibility.sponsorship, 'NOT_AVAILABLE');
  assert.equal(result.employmentModel, 'EMPLOYEE');
});

test('remote and an EU time zone do not prove Italy hiring access', () => {
  const result = classifyLocationEligibility({
    location: 'Berlin / Remote',
    remote: true,
    description: 'Remote within European time zones (CET).',
  });
  assert.equal(result.candidateEligibility, 'UNKNOWN');
  assert.equal(result.geographicScope.eligibleRegions.length, 0);
  assert.equal(result.timeZoneRequirement, 'CET');
});

test('a Prague overlap requirement is stored as timezone evidence, not a hiring location', () => {
  const result = classifyLocationEligibility({
    location: 'London',
    remote: true,
    description: 'Remote role. Candidates should be within two hours of Prague (CET).',
  });
  assert.equal(result.candidateEligibility, 'UNKNOWN');
  assert.match(result.timeZoneRequirement, /within two hours of Prague \(CET\)/i);
  assert.equal(result.geographicScope.eligibleRegions.length, 0);

  const eastern = classifyLocationEligibility({
    location: 'Remote',
    description: 'Must overlap at least four hours with US Eastern Time.',
  });
  assert.equal(eastern.candidateEligibility, 'UNKNOWN');
  assert.match(eastern.timeZoneRequirement, /four hours with US Eastern Time/i);
});

test('workplace type, sponsorship, and geography remain separate fields', () => {
  const result = classifyLocationEligibility({
    title: 'Senior Engineer — EU Remote',
    workplaceType: 'Hybrid',
    description: 'Visa sponsorship available for qualified applicants.',
    visaSponsorship: false,
  });
  assert.equal(result.candidateEligibility, 'ELIGIBLE');
  assert.equal(result.workArrangement.value, 'HYBRID');
  assert.equal(result.hiringEligibility.sponsorship, 'AVAILABLE');
  assert.equal(result.timeZoneRequirement, null);
});

test('an explicit Italy role can satisfy the profile authorization only for Italy', () => {
  const result = classifyLocationEligibility({
    location: 'Remote — Italy',
    remote: true,
    description: 'Existing right to work in Italy is required; sponsorship is not available.',
  }, { candidateCountry: 'Italy', authorizedCountries: ['IT'] });
  assert.equal(result.candidateEligibility, 'ELIGIBLE');
  assert.equal(result.hiringEligibility.workAuthorization, 'REQUIRED');
  assert.equal(result.hiringEligibility.candidateWorkAuthorization, 'SATISFIED_FOR_COUNTRY');
  assert.equal(result.hiringEligibility.sponsorship, 'NOT_AVAILABLE');
});

test('a city-only Italian location is recognized without treating the city as an explicit country', () => {
  const result = classifyLocationEligibility({ location: 'Milano — Hybrid' }, { candidateCountry: 'Italy', candidateCity: 'Milan' });
  assert.equal(result.candidateEligibility, 'ELIGIBLE');
  assert.equal(result.geographicScope.classification, 'CITY_SPECIFIC');
  assert.deepEqual(result.geographicScope.eligibleCountries, []);
  assert.deepEqual(result.geographicScope.inferredCountries, ['IT']);
  assert.deepEqual(result.geographicScope.eligibleCities, ['Milan']);
});

test('must-be-authorized language is separate from citizenship and sponsorship', () => {
  const result = classifyLocationEligibility({
    location: 'Remote — Worldwide',
    description: 'Applicants must be authorized to work in the EU. US citizens only for the export-controlled project.',
  });
  assert.equal(result.candidateEligibility, 'ELIGIBLE');
  assert.equal(result.hiringEligibility.workAuthorization, 'REQUIRED');
  assert.deepEqual(result.hiringEligibility.workAuthorizationRegions, ['EU']);
  assert.equal(result.hiringEligibility.citizenshipRequirement.status, 'REQUIRED');
  assert.deepEqual(result.hiringEligibility.citizenshipRequirement.countries, ['US']);
  assert.equal(result.hiringEligibility.sponsorship, 'UNKNOWN');

  const held = classifyLocationEligibility({
    location: 'Remote — Italy',
    description: 'Applicants must already hold the right to work in Italy.',
  }, { authorizedCountries: ['Italy'] });
  assert.equal(held.hiringEligibility.workAuthorization, 'REQUIRED');
  assert.deepEqual(held.hiringEligibility.workAuthorizationCountries, ['IT']);
});

test('office attendance and freelance model are captured independently from remote wording', () => {
  const result = classifyLocationEligibility({
    location: 'Remote — Italy',
    work_mode: 'remote',
    employment_type: 'freelance',
    description: 'Remote role with three days a week in the Milan office and quarterly travel to clients.',
  });
  assert.equal(result.workArrangement.value, 'HYBRID');
  assert.equal(result.officeAttendance.required, true);
  assert.equal(result.officeAttendance.daysPerWeek, 3);
  assert.match(result.officeAttendance.travelExpectation, /quarterly travel/i);
  assert.equal(result.employmentModel, 'FREELANCE');
  assert.ok(result.extractedAt);
});

test('city exclusions apply to a matching candidate city without excluding the whole country', () => {
  const result = classifyLocationEligibility({
    location: 'Europe',
    description: 'Hybrid role in Europe, excluding Milan.',
  }, { candidateCountry: 'Italy', candidateCity: 'Milan' });
  assert.equal(result.candidateEligibility, 'INELIGIBLE');
  assert.deepEqual(result.geographicScope.excludedCities, ['Milan']);
});

test('Employer of Record wording remains a possible employment mechanism', () => {
  const result = classifyLocationEligibility({
    location: 'Remote — Italy',
    description: 'The company may employ successful candidates through an Employer of Record.',
  });
  assert.equal(result.employmentModel, 'EOR_POSSIBLE');
});

test('a UK-residents-only posting is a country restriction, not a citizenship restriction', () => {
  const result = classifyLocationEligibility({ location: 'Remote', description: 'UK residents only.' });
  assert.equal(result.candidateEligibility, 'INELIGIBLE');
  assert.deepEqual(result.geographicScope.eligibleCountries, ['GB']);
  assert.deepEqual(result.geographicScope.eligibleRegions, ['UK']);
  assert.equal(result.hiringEligibility.citizenshipRequirement.status, 'UNKNOWN');
});

test('Europe remains positive when the UK and Switzerland are explicitly excluded', () => {
  const result = classifyLocationEligibility({ location: 'Remote — Europe, excluding the UK and Switzerland' });
  assert.equal(result.candidateEligibility, 'ELIGIBLE');
  assert.deepEqual(result.geographicScope.eligibleRegions, ['EUROPE']);
  assert.deepEqual(result.geographicScope.excludedCountries, ['CH', 'GB']);
});

test('EMEA is a positive Italy signal but stays distinct from Europe and the EU', () => {
  const result = classifyLocationEligibility({ location: 'Remote — EMEA' });
  assert.equal(result.candidateEligibility, 'ELIGIBLE');
  assert.equal(result.eligibilityDecision, 'ELIGIBLE_LIKELY');
  assert.equal(result.geographicScope.classification, 'EMEA');
  assert.deepEqual(result.geographicScope.eligibleRegions, ['EMEA']);

  const excluded = classifyLocationEligibility({ location: 'Remote — EMEA, excluding Italy' });
  assert.equal(excluded.candidateEligibility, 'INELIGIBLE');
});

test('a worldwide label does not override an explicit Italy exclusion', () => {
  const result = classifyLocationEligibility({
    location: 'Remote — Worldwide',
    description: 'Worldwide remote hiring, excluding Italy.',
  });
  assert.equal(result.candidateEligibility, 'INELIGIBLE');
  assert.deepEqual(result.geographicScope.eligibleRegions, ['WORLDWIDE']);
  assert.deepEqual(result.geographicScope.excludedCountries, ['IT']);
});

test('worldwide wording is a positive Italy signal but remains likely rather than confirmed', () => {
  const result = classifyLocationEligibility({
    location: 'Remote',
    description: 'Work from anywhere in the world; local employment availability varies by country.',
  });
  assert.equal(result.candidateEligibility, 'ELIGIBLE');
  assert.equal(result.eligibilityDecision, 'ELIGIBLE_LIKELY');
  assert.ok(result.confidence < 0.95);
});

test('distributed and remote-first wording indicates arrangement, not global hiring eligibility', () => {
  const result = classifyLocationEligibility({
    location: 'Remote',
    description: 'Join our globally distributed, remote-first, async-first team and work from home.',
  });
  assert.equal(result.workArrangement.value, 'REMOTE');
  assert.equal(result.candidateEligibility, 'UNKNOWN');
  assert.deepEqual(result.geographicScope.eligibleRegions, []);
});

test('AMER, MENA and GCC stay distinct geographic scopes', () => {
  const result = classifyLocationEligibility({
    location: 'Remote',
    regions: ['AMER', 'MENA', 'GCC'],
    remote: true,
  });
  assert.equal(result.candidateEligibility, 'UNKNOWN');
  assert.equal(result.geographicScope.classification, 'MULTI_REGION');
  assert.deepEqual(result.geographicScope.eligibleRegions, ['AMER', 'GCC', 'MENA']);
});

test('remote or office choice is flexible rather than confirmed remote', () => {
  const result = classifyLocationEligibility({
    location: 'Europe',
    description: 'Choose remote or office-based working for this role.',
  });
  assert.equal(result.candidateEligibility, 'ELIGIBLE');
  assert.equal(result.workArrangement.value, 'FLEXIBLE');

  const friendly = classifyLocationEligibility({
    location: 'Remote',
    description: 'The team is remote-friendly, but working from abroad is subject to local payroll availability.',
  });
  assert.equal(friendly.workArrangement.value, 'FLEXIBLE');
  assert.equal(friendly.candidateEligibility, 'UNKNOWN');
});

test('an Italian office city supports city-specific on-site classification and attendance evidence', () => {
  const result = classifyLocationEligibility({
    location: 'Bologna',
    description: 'Must be on-site in Bologna with office attendance required five days per week; candidates must live near the office.',
  });
  assert.equal(result.candidateEligibility, 'ELIGIBLE');
  assert.equal(result.geographicScope.classification, 'CITY_SPECIFIC');
  assert.equal(result.workArrangement.value, 'ONSITE');
  assert.equal(result.officeAttendance.required, true);
  assert.equal(result.officeAttendance.daysPerWeek, 5);
  assert.match(result.officeAttendance.commutingDistance, /live near the office/i);
});

test('the lowercase pronoun “us” is not parsed as the United States country code', () => {
  const result = classifyLocationEligibility({
    location: 'Remote — Europe',
    description: 'Remote across Europe. Tell us about the product you shipped.',
  });
  assert.deepEqual(result.geographicScope.eligibleCountries, []);
  assert.deepEqual(result.geographicScope.eligibleRegions, ['EUROPE']);
});

test('an exclusion cue in one HTML bullet does not reach a place named in the next (Smartist React Engineer, missed 29 Oct)', () => {
  const result = classifyLocationEligibility({
    title: 'React Engineer',
    location: '',
    remote: true,
    description: '<ul><li>Design system instincts and fluency in Figma</li><li>You make things outside of work too</li></ul><h3>Why Smartist</h3><ul><li><strong>Work from anywhere.</strong> Fully remote, flexible hours.</li></ul>',
  }, { candidateCountry: 'IT', candidateCity: 'Milan' });
  assert.notEqual(result.candidateEligibility, 'INELIGIBLE');
  assert.deepEqual(result.geographicScope.excludedRegions, []);
});

test('an exclusion stays inside its own clause', () => {
  const kept = classifyLocationEligibility({ location: 'Remote', remote: true, description: 'Remote within Europe, except the UK and Switzerland.' });
  assert.deepEqual(kept.geographicScope.excludedCountries, ['CH', 'GB']);
  const italy = classifyLocationEligibility({ location: 'Remote', remote: true, description: 'Remote worldwide, excluding Italy.' }, { candidateCountry: 'IT' });
  assert.equal(italy.candidateEligibility, 'INELIGIBLE');
});

test('remote limited to named countries without Italy is ineligible (Codurance Brazil/Portugal, Procedure Tech Mumbai)', () => {
  const codurance = classifyLocationEligibility({ title: 'Senior GenAI Full-Stack Engineer - Brazil', location: 'Portugal (Remote)', remote: true, countries: ['br', 'pt'], regions: ['eu', 'latam'], description: '' }, { candidateCountry: 'IT' });
  assert.equal(codurance.candidateEligibility, 'INELIGIBLE');
  const mumbai = classifyLocationEligibility({ title: 'Senior AI Full Stack Engineer (React + Node)', location: 'Mumbai (Remote)', remote: true, countries: ['in'], regions: ['apac'], description: '' }, { candidateCountry: 'IT' });
  assert.equal(mumbai.candidateEligibility, 'INELIGIBLE');
});

test('a named country plus a covering region stays eligible, and a plain remote stays unknown', () => {
  const berlin = classifyLocationEligibility({ title: 'Senior Backend Engineer', location: 'Berlin, Germany (Remote)', remote: true, description: 'Fully remote across Europe.' }, { candidateCountry: 'IT' });
  assert.equal(berlin.candidateEligibility, 'ELIGIBLE');
  const plain = classifyLocationEligibility({ title: 'Senior Backend Engineer', location: 'Remote', remote: true, description: '' }, { candidateCountry: 'IT' });
  assert.equal(plain.candidateEligibility, 'UNKNOWN');
  const italy = classifyLocationEligibility({ title: 'Backend Engineer', location: 'Italy, Spain (Remote)', remote: true, description: '' }, { candidateCountry: 'IT' });
  assert.equal(italy.candidateEligibility, 'ELIGIBLE');
});

test('one rule for every country: remote with no restriction or a restriction that covers Italy (EU, EEA, EMEA, Europe, Schengen)', () => {
  const c = (location, description = '') => classifyLocationEligibility({ title: 'Senior Backend Engineer', location, remote: true, description }, { candidateCountry: 'IT' }).candidateEligibility;
  for (const l of ['Remote - LATAM', 'Remote (APAC)', 'Remote, MENA', 'Remote, North America', 'Remote, UK', 'Dubai, UAE (Remote)', 'Remote, Germany']) assert.equal(c(l), 'INELIGIBLE', l);
  for (const l of ['Remote - Schengen area', 'Remote - EMEA', 'Remote - UK & Europe', 'Worldwide', 'Remote, Italy']) assert.equal(c(l), 'ELIGIBLE', l);
  assert.equal(c('Remote'), 'UNKNOWN');
});
