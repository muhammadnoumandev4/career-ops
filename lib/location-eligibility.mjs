// Explainable location and hiring-eligibility extraction shared by the two
// discovery pipelines. This is deliberately evidence-first: timezone or the
// word "remote" alone never proves that Italy is an allowed hiring country.
import { COUNTRY_ALPHA2_CODES, countryNameFromIso } from '../providers/_country.mjs';

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isoNameEntries = COUNTRY_ALPHA2_CODES
  .map((code) => [code, countryNameFromIso(code)])
  .filter(([, name]) => name)
  .sort((a, b) => b[1].length - a[1].length);

const COUNTRY_ALIASES = new Map([
  ['UK', 'GB'], ['U.K.', 'GB'], ['Britain', 'GB'], ['Great Britain', 'GB'],
  ['England', 'GB'], ['Scotland', 'GB'], ['Wales', 'GB'], ['Northern Ireland', 'GB'],
  ['USA', 'US'], ['U.S.A.', 'US'],
  ['UAE', 'AE'], ['The Netherlands', 'NL'], ['Holland', 'NL'],
  ['Czech Republic', 'CZ'], ['Türkiye', 'TR'], ['Turkey', 'TR'],
]);
const COUNTRY_PATTERNS = [
  ...isoNameEntries.map(([code, name]) => ({ code, name, pattern: new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(name)}(?![\\p{L}\\p{N}])`, 'giu') })),
  ...[...COUNTRY_ALIASES].map(([name, code]) => ({ code, name, pattern: new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(name)}(?![\\p{L}\\p{N}])`, 'giu') })),
  { code: 'US', name: 'US', pattern: /(?<![\p{L}\p{N}])US(?![\p{L}\p{N}])/gu },
  { code: 'US', name: 'U.S.', pattern: /(?<![\p{L}\p{N}])U\.S\.(?![\p{L}\p{N}])/giu },
];
const ITALIAN_CITY_PATTERNS = [
  ['Milan', /(?<![\p{L}\p{N}])(?:Milan|Milano)(?![\p{L}\p{N}])/giu],
  ['Rome', /(?<![\p{L}\p{N}])(?:Rome|Roma)(?![\p{L}\p{N}])/giu],
  ['Turin', /(?<![\p{L}\p{N}])(?:Turin|Torino)(?![\p{L}\p{N}])/giu],
  ['Bologna', /(?<![\p{L}\p{N}])Bologna(?![\p{L}\p{N}])/giu],
  ['Florence', /(?<![\p{L}\p{N}])(?:Florence|Firenze)(?![\p{L}\p{N}])/giu],
  ['Naples', /(?<![\p{L}\p{N}])(?:Naples|Napoli)(?![\p{L}\p{N}])/giu],
  ['Venice', /(?<![\p{L}\p{N}])(?:Venice|Venezia)(?![\p{L}\p{N}])/giu],
  ['Verona', /(?<![\p{L}\p{N}])Verona(?![\p{L}\p{N}])/giu],
  ['Padua', /(?<![\p{L}\p{N}])(?:Padua|Padova)(?![\p{L}\p{N}])/giu],
  ['Genoa', /(?<![\p{L}\p{N}])(?:Genoa|Genova)(?![\p{L}\p{N}])/giu],
  ['Bergamo', /(?<![\p{L}\p{N}])Bergamo(?![\p{L}\p{N}])/giu],
  ['Brescia', /(?<![\p{L}\p{N}])Brescia(?![\p{L}\p{N}])/giu],
  ['Parma', /(?<![\p{L}\p{N}])Parma(?![\p{L}\p{N}])/giu],
  ['Modena', /(?<![\p{L}\p{N}])Modena(?![\p{L}\p{N}])/giu],
  ['Trieste', /(?<![\p{L}\p{N}])Trieste(?![\p{L}\p{N}])/giu],
  ['Trento', /(?<![\p{L}\p{N}])Trento(?![\p{L}\p{N}])/giu],
  ['Bolzano', /(?<![\p{L}\p{N}])Bolzano(?![\p{L}\p{N}])/giu],
  ['Bari', /(?<![\p{L}\p{N}])Bari(?![\p{L}\p{N}])/giu],
  ['Palermo', /(?<![\p{L}\p{N}])Palermo(?![\p{L}\p{N}])/giu],
  ['Cagliari', /(?<![\p{L}\p{N}])Cagliari(?![\p{L}\p{N}])/giu],
  ['Pisa', /(?<![\p{L}\p{N}])Pisa(?![\p{L}\p{N}])/giu],
  ['Perugia', /(?<![\p{L}\p{N}])Perugia(?![\p{L}\p{N}])/giu],
  ['Lecce', /(?<![\p{L}\p{N}])Lecce(?![\p{L}\p{N}])/giu],
].map(([city, pattern]) => ({ city, pattern }));

// Regions that contain Italy, the candidate's country (Schengen and the EEA both include it).
const COVERS_CANDIDATE = ['WORLDWIDE', 'EEA', 'EU', 'EUROPE', 'EMEA', 'SCHENGEN'];

const REGION_PATTERNS = [
  ['WORLDWIDE', /(?<![\p{L}\p{N}])(?:worldwide|global|any country|anywhere(?!\s+in\b)|anywhere\s+in\s+(?:the\s+)?world)(?![\p{L}\p{N}])/giu],
  ['EEA', /(?<![\p{L}\p{N}])(?:EEA|European Economic Area)(?![\p{L}\p{N}])/giu],
  ['EU', /(?<![\p{L}\p{N}])(?:EU|European Union)(?![\p{L}\p{N}])/giu],
  ['UK', /(?<![\p{L}\p{N}])(?:UK|U\.K\.|United Kingdom|Great Britain)(?![\p{L}\p{N}])/giu],
  ['EUROPE', /(?<![\p{L}\p{N}])Europe(?:an)?(?![\p{L}\p{N}])(?!(?:\s+Union|\s+Economic\s+Area|\s+time\s*zones?|\s+timezones?|\s+hours?))/giu],
  ['EMEA', /(?<![\p{L}\p{N}])EMEA(?![\p{L}\p{N}])/giu],
  ['SCHENGEN', /(?<![\p{L}\p{N}])Schengen(?:\s+(?:area|zone|countries|region))?(?![\p{L}\p{N}])/giu],
  ['NORTH_AMERICA', /(?<![\p{L}\p{N}])North America(?![\p{L}\p{N}])/giu],
  ['AMER', /(?<![\p{L}\p{N}])(?:AMER|Americas)(?![\p{L}\p{N}])/giu],
  ['LATAM', /(?<![\p{L}\p{N}])(?:LATAM|Latin America)(?![\p{L}\p{N}])/giu],
  ['APAC', /(?<![\p{L}\p{N}])(?:APAC|Asia[- ]Pacific)(?![\p{L}\p{N}])/giu],
  ['MENA', /(?<![\p{L}\p{N}])MENA(?![\p{L}\p{N}])/giu],
  ['GCC', /(?<![\p{L}\p{N}])GCC(?![\p{L}\p{N}])/giu],
];
const ELIGIBILITY_CUE = /\b(?:based(?: in)?|located in|reside in|residents? only|resident of|candidates? (?:must be )?(?:based|located) in|open to (?:candidates|applicants|people)(?: currently)?(?: living)? in|open exclusively|exclusively|only in|only from|hire in|hiring in|can hire in|eligible to work in|work authorization in|work permit in|work from anywhere|remote(?: from| within| across)?|locations?|countr(?:y|ies)|regions?|within|must be in|must reside in)\b/i;
const EXCLUSION_CUE = /\b(?:excluding|except|not (?:available|open|eligible|hiring) in|cannot hire in|can't hire in|do not hire in|does not hire in|not from|outside)\b/i;
const RESTRICTIVE_GEO_CUE = /\b(?:only|exclusively|limited to|only candidates?|must reside in|must live in|must be (?:based|located) in|must be resident of|residents? only|remote (?:from|within|across)|hiring only in|can hire in|open to (?:candidates|applicants|people)(?: currently)?(?: living)? in)\b/i;
const TZ_WINDOW_RE = /\b(?:within\s+(?:\d+|one|two|three|four|five|six)\s+hours?\s+of\s+[^.;\n]{0,60}?|(?:overlap(?:ping)?(?:\s+at\s+least)?\s+)?(?:\d+|one|two|three|four|five|six)\s+hours?\s+(?:of|with|overlap\s+with)\s+[^.;\n]{0,60}?)\b(?:CET|CEST|UTC|GMT|(?:US|U\.S\.|American\s+)?(?:Eastern|Central|Pacific|Mountain)(?:\s+Time)?|European\s+time\s+zones?|(?:European|EMEA|US|Americas)\s+business\s+hours)\b\)?/i;
const TZ_RE = /\b(?:CET|CEST|UTC[+-]?\d{0,2}(?::?\d{2})?|GMT[+-]?\d{0,2}(?::?\d{2})?|within\s+\d+\s+hours?\s+of\s+[A-Z]{2,5}|(?:US|U\.S\.)\s+(?:Eastern|Central|Pacific|Mountain)(?:\s+Time)?|(?:European|EMEA|US|Americas|Pacific|Eastern|Central|Mountain)\s+(?:business\s+hours|(?:time\s+)?zones?|hours))\b/i;

function foundCountries(text) {
  const found = new Map();
  for (const { code, name, pattern } of COUNTRY_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of String(text ?? '').matchAll(pattern)) found.set(code, match[0] || name);
  }
  return [...found].map(([code, matched]) => ({ code, matched }));
}

function foundRegions(text) {
  const found = new Map();
  for (const [name, pattern] of REGION_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of String(text ?? '').matchAll(pattern)) found.set(name, match[0]);
  }
  return [...found].map(([code, matched]) => ({ code, matched }));
}

function foundItalianCities(text) {
  const found = new Map();
  for (const { city, pattern } of ITALIAN_CITY_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of String(text ?? '').matchAll(pattern)) found.set(city, match[0]);
  }
  return [...found].map(([city, matched]) => ({ city, matched }));
}

function normalizeCountry(value) {
  const raw = String(value ?? '').trim();
  if (/^[A-Za-z]{2,3}$/.test(raw)) {
    const code = raw.toUpperCase();
    const hit = foundCountries(countryNameFromIso(code));
    return hit[0]?.code ?? (code === 'GBR' ? 'GB' : code === 'USA' ? 'US' : code === 'ITA' ? 'IT' : '');
  }
  return foundCountries(raw).find((x) => x.matched.length === raw.length)?.code ?? '';
}

/** The words an exclusion cue governs: up to the end of its clause, so "outside of work" stays about work. */
function exclusionClause(line, cue) {
  const rest = line.slice(line.indexOf(cue[0]) + cue[0].length);
  return rest.split(/[;:!?()]|\.(?:\s|$)|\s+(?:but|while|and you|we|you)\s+/i)[0].slice(0, 120);
}

function textLines(text) {
  // Descriptions often arrive as HTML: list items, paragraphs and headings are separate lines, so an exclusion cue in one
  // bullet ("things outside of work") never reaches a place named in the next one ("Work from anywhere").
  const plain = String(text ?? '')
    .replace(/<\/?(?:li|p|br|h[1-6]|ul|ol|div|tr|td|section|article)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&');
  return plain.split(/\n+|(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

function inferArrangement(job, fullText) {
  const type = String(job.workplaceType ?? job.work_mode ?? '').toLowerCase();
  const remoteStyle = /\b(?:remote|work from home|work from anywhere|anywhere in the world|home[- ]based|telecommut(?:e|ing)|teleworking|virtual position|off[- ]site|distributed team|fully distributed|globally distributed|location-independent)\b/i;
  if (/hybrid/.test(type)) return { value: 'HYBRID', evidence: String(job.workplaceType ?? job.work_mode) };
  if (/\b(?:choose|either|option of|available as)\b[^.!?\n]{0,50}\bremote\b[^.!?\n]{0,30}\b(?:or|and)\b[^.!?\n]{0,30}\b(?:office|on.?site|hybrid)\b/i.test(fullText)) {
    return { value: 'FLEXIBLE', evidence: fullText.match(/[^.!?\n]*\b(?:choose|either|option of|available as)\b[^.!?\n]{0,120}/i)?.[0]?.trim() ?? 'remote or office options in posting' };
  }
  if (/\bremote[- ]friendly\b/i.test(fullText)) {
    return { value: 'FLEXIBLE', evidence: fullText.match(/[^.!?\n]*\bremote[- ]friendly\b[^.!?\n]*/i)?.[0]?.trim() ?? 'remote-friendly work arrangement' };
  }
  if (/\bflexible (?:working|location|workplace|work arrangement)\b/i.test(fullText)) {
    return { value: 'FLEXIBLE', evidence: fullText.match(/[^.!?\n]*\bflexible (?:working|location|workplace|work arrangement)\b[^.!?\n]*/i)?.[0]?.trim() ?? 'flexible work arrangement' };
  }
  if (/\bhybrid\b/i.test(fullText)) return { value: 'HYBRID', evidence: fullText.match(/[^.!?\n]*\bhybrid\b[^.!?\n]*/i)?.[0]?.trim() ?? 'hybrid in posting text' };
  if (/\b(?:remote|work from home|home-based)\b/i.test(fullText)
    && /\b(?:\d+|one|two|three|four|five)\s+days?\s+(?:a|per)\s+week\b[^.!?\n]{0,80}\b(?:office|on.?site|in person)\b|\b(?:must|required|expected)\s+to\s+(?:attend|be)\s+(?:the\s+)?office\b/i.test(fullText)) {
    return { value: 'HYBRID', evidence: fullText.match(/[^.!?\n]*(?:office|on.?site|in person)[^.!?\n]*/i)?.[0]?.trim() ?? 'remote with required office attendance' };
  }
  if (/\b(?:on.?site|office-based|in office|must be in the office)\b/i.test(String(job.location ?? job.workplaceType ?? ''))
    || /\b(?:on.?site|office-based|in office|must be in the office)\b/i.test(fullText)) {
    return { value: 'ONSITE', evidence: fullText.match(/[^.!?\n]*\b(?:on.?site|office-based|in office|must be in the office)\b[^.!?\n]*/i)?.[0]?.trim() ?? 'on-site in posting text' };
  }
  if (remoteStyle.test(type) || job.remote === true) return { value: 'REMOTE', evidence: type || 'source remote flag' };
  if (/on.?site|office/.test(type)) return { value: 'ONSITE', evidence: type };
  if (remoteStyle.test(String(job.location ?? '')) || remoteStyle.test(String(job.title ?? '')) || remoteStyle.test(String(job.description ?? job.jd_text ?? ''))) return { value: 'REMOTE', evidence: 'remote work phrase in title, location, or description' };
  if (/\b(?:on.?site|in office|office-based)\b/i.test(fullText)) return { value: 'ONSITE', evidence: fullText.match(/[^.!?\n]*\b(?:on.?site|in office|office-based)\b[^.!?\n]*/i)?.[0]?.trim() ?? 'on-site in posting text' };
  return { value: 'UNKNOWN', evidence: '' };
}

function findEvidence(sources, field) {
  const result = [];
  for (const { source, text } of sources) {
    if (!text) continue;
    for (const line of textLines(text)) {
      const cue = line.match(EXCLUSION_CUE);
      const excludedPart = cue ? line.slice(line.indexOf(cue[0]) + cue[0].length) : '';
      const excludedCountryCodes = new Set(foundCountries(excludedPart).map((x) => x.code));
      const excludedRegionCodes = new Set(foundRegions(excludedPart).map((x) => x.code));
      const countries = foundCountries(line).filter((x) => !excludedCountryCodes.has(x.code));
      const regions = foundRegions(line).filter((x) => !excludedRegionCodes.has(x.code));
      if (!countries.length && !regions.length) continue;
      const citizenshipOnly = /\b(?:citizenship|citizen|citizens|nationality|national)\b/i.test(line) && !ELIGIBILITY_CUE.test(line);
      if (source === 'description' && (citizenshipOnly || (!ELIGIBILITY_CUE.test(line) && !RESTRICTIVE_GEO_CUE.test(line)))) continue;
      result.push({ field, source, text: line.slice(0, 280), countries: countries.map((x) => x.code), regions: regions.map((x) => x.code), restricted: RESTRICTIVE_GEO_CUE.test(line) });
    }
  }
  return result;
}

function employmentModel(text, structuredType = '') {
  if (/\bEOR\b|\bEmployer of Record\b/i.test(`${text} ${structuredType}`)) return 'EOR_POSSIBLE';
  if (/\b(?:freelance|freelancer)\b/i.test(`${text} ${structuredType}`)) return 'FREELANCE';
  if (/\b(?:contract|contractor|consultant)\b/i.test(structuredType)
    || /\b(?:independent contractor|contractor agreement|contracting|contract role|contract|B2B|partita IVA)\b/i.test(text)) return 'CONTRACTOR';
  if (/\b(?:employee|employment|full[- _]time|part[- _]time|permanent|payroll)\b/i.test(`${text} ${structuredType}`)) return 'EMPLOYEE';
  return 'UNKNOWN';
}

function sponsorship(text) {
  if (/\b(?:will not|cannot|can't|does not|do not) (?:provide|offer )?(?:visa )?sponsor(?:ship)?\b|\bno (?:visa )?sponsorship\b|\bwithout (?:visa )?sponsorship\b|\b(?:visa )?sponsorship (?:is )?(?:not available|unavailable)\b/i.test(text)) return 'NOT_AVAILABLE';
  if (/\b(?:sponsor(?:ship)? available|will sponsor|visa sponsorship provided|sponsorship provided)\b/i.test(text)) return 'AVAILABLE';
  return 'UNKNOWN';
}

function workAuthorization(text) {
  return /\b(?:must|need to|needs to|required to)\s+(?:already\s+)?(?:be\s+)?(?:legally\s+)?(?:authorized|authorised)\s+to\s+work\b|\b(?:must|need to|needs to|required to)\s+(?:already\s+)?(?:have|hold|possess)\s+(?:existing\s+)?(?:the\s+)?(?:right to work|work authorization|work permit)\b|\b(?:require|requires|requirement)\b[^.!?\n]{0,60}\b(?:right to work|work authorization|work permit|legally authorized to work)\b|\b(?:right to work|work authorization|work permit|legally authorized to work)\b[^.!?\n]{0,100}\b(?:required|must have|need to have|necessary|is a must)\b|\b(?:required|must have|need to have|necessary)\b[^.!?\n]{0,100}\b(?:right to work|work authorization|work permit|legally authorized to work)\b/i.test(text)
    ? 'REQUIRED'
    : 'UNKNOWN';
}

function officeAttendance(text) {
  const lines = textLines(text).filter((line) => /\b(?:office|on.?site|in person|commut(?:e|ing)|travel|visit|attendance)\b/i.test(line));
  const evidence = lines.map((line) => line.slice(0, 280));
  const frequencyLine = lines.find((line) => /\b(?:\d+|one|two|three|four|five)\s+days?\s+(?:(?:a|per)\s+week|[^.!?\n]{0,35}\b(?:office|on.?site|in person)\b)/i.test(line));
  const dayCount = frequencyLine?.match(/\b(\d+|one|two|three|four|five)\s+days?\b/i)?.[1]?.toLowerCase();
  const dayWords = { one: 1, two: 2, three: 3, four: 4, five: 5 };
  const commutingDistance = lines.find((line) => /\b(?:commut(?:e|ing) distance|within\s+\d+\s*(?:km|kilometers?|miles?)|(?:must|need to|expected to)\s+(?:live|reside|be based)\s+(?:near|within)|live near (?:the )?office)\b/i.test(line)) ?? null;
  const frequency = lines.find((line) => /\b(?:weekly|monthly|quarterly|annually|occasionally|once per (?:month|quarter|year))\b/i.test(line)) ?? null;
  const travel = lines.find((line) => /\b(?:travel|visit|in person)\b/i.test(line)) ?? null;
  const required = Boolean(dayCount) || /\b(?:must|required|expected|need to|needs to)\b[^.!?\n]{0,100}\b(?:attend|office|on.?site|in person|commut|travel|visit|live near|reside near)\b|\b(?:office|on.?site|in person)\b[^.!?\n]{0,100}\b(?:required|mandatory|must)\b/i.test(text);
  return {
    required: required ? true : (evidence.length ? null : false),
    daysPerWeek: dayCount ? (Number(dayCount) || dayWords[dayCount] || null) : null,
    frequency,
    commutingDistance,
    travelExpectation: travel,
    evidence,
  };
}

function citizenshipRequirement(text) {
  const lines = textLines(text).filter((line) => /\b(?:citizenship|citizen|citizens|nationality|national)\b/i.test(line));
  const requiredLines = lines.filter((line) => /\b(?:must|only|required|requirement|eligible|exclusively)\b/i.test(line));
  return {
    status: requiredLines.length ? 'REQUIRED' : lines.length ? 'MENTIONED' : 'UNKNOWN',
    countries: [...new Set(requiredLines.flatMap((line) => foundCountries(line).map(({ code }) => code)))].sort(),
    evidence: lines.map((line) => line.slice(0, 280)),
  };
}

/**
 * Extract separate, evidence-backed location dimensions from a job record.
 * candidateCountry accepts an ISO-3166 alpha-2 code or a country name.
 * @param {Record<string, any>} job
 * @param {{candidateCountry?: string, authorizedCountries?: string[]}} [options]
 */
export function classifyLocationEligibility(job = {}, options = {}) {
  const candidateCountry = normalizeCountry(options.candidateCountry ?? 'IT') || 'IT';
  const rawCandidateCity = String(options.candidateCity ?? '').trim();
  const candidateCity = foundItalianCities(rawCandidateCity)[0]?.city ?? rawCandidateCity;
  const authorizedCountries = [...new Set((Array.isArray(options.authorizedCountries) ? options.authorizedCountries : []).map(normalizeCountry).filter(Boolean))];
  const location = [job.location, ...(Array.isArray(job.secondaryLocations) ? job.secondaryLocations : [])].filter(Boolean).join(' | ');
  const description = String(job.description ?? job.jd_text ?? '');
  const title = String(job.title ?? '');
  const fullText = [location, title, description, job.employment_type].filter(Boolean).join('\n');
  const sources = [{ source: 'location', text: location }, { source: 'title', text: title }, { source: 'description', text: description }];
  const positiveEvidence = findEvidence([sources[0]], 'geographic_scope');
  const titleEvidence = findEvidence([sources[1]], 'geographic_scope');
  const descriptionEvidence = findEvidence([sources[2]], 'geographic_scope');
  const evidence = [...positiveEvidence, ...titleEvidence, ...descriptionEvidence];
  const cityEvidence = [
    ...foundItalianCities(location).map(({ city }) => ({ field: 'city_location', source: 'location_city_map', text: city, city, inferredCountry: 'IT' })),
    ...textLines(title).filter((line) => ELIGIBILITY_CUE.test(line)).flatMap((line) => foundItalianCities(line).map(({ city }) => ({ field: 'city_location', source: 'title_city_map', text: line.slice(0, 280), city, inferredCountry: 'IT' }))),
    ...textLines(description).filter((line) => ELIGIBILITY_CUE.test(line)).flatMap((line) => foundItalianCities(line).map(({ city }) => ({ field: 'city_location', source: 'description_city_map', text: line.slice(0, 280), city, inferredCountry: 'IT' }))),
  ];
  const structuredCountries = [...new Set([job.country, ...(Array.isArray(job.countries) ? job.countries : [])].map(normalizeCountry).filter(Boolean))];
  if (structuredCountries.length) evidence.unshift({ field: 'geographic_scope', source: 'structured_country', text: structuredCountries.join(', '), countries: structuredCountries, regions: [] });
  const regionMap = { GLOBAL: 'WORLDWIDE', WORLDWIDE: 'WORLDWIDE', EU: 'EU', EUROPEAN_UNION: 'EU', EEA: 'EEA', UK: 'UK', UNITED_KINGDOM: 'UK', EUROPE: 'EUROPE', EMEA: 'EMEA', SCHENGEN: 'SCHENGEN', NORTH_AMERICA: 'NORTH_AMERICA', AMER: 'AMER', AMERICAS: 'AMER', LATAM: 'LATAM', APAC: 'APAC', MENA: 'MENA', GCC: 'GCC' };
  const structuredRegions = [...new Set((Array.isArray(job.regions) ? job.regions : []).map((x) => regionMap[String(x).trim().toUpperCase().replace(/[ -]+/g, '_')]).filter(Boolean))];
  // A board's region tag is usually derived from the countries it lists (freehire tags Brazil + Portugal as "eu"), not
  // a statement that the employer hires across that region. With countries present, the countries decide.
  if (structuredRegions.length && !structuredCountries.length) evidence.unshift({ field: 'geographic_scope', source: 'structured_region', text: structuredRegions.join(', '), countries: [], regions: structuredRegions });
  const eligibleCountries = [...new Set(evidence.flatMap((e) => e.countries))].sort();
  const eligibleRegions = [...new Set(evidence.flatMap((e) => e.regions))].sort();

  const exclusionEvidence = [];
  for (const { source, text } of sources) {
    for (const line of textLines(text)) {
      const cue = line.match(EXCLUSION_CUE);
      if (!cue) continue;
      // A clause such as "excluding Italy" identifies only the terms after
      // the exclusion cue; do not turn the preceding region into an exclusion.
      const excludedPart = exclusionClause(line, cue);
      const countries = foundCountries(excludedPart);
      const regions = foundRegions(excludedPart);
      if (countries.length || regions.length) exclusionEvidence.push({ field: 'geographic_exclusion', source, text: line.slice(0, 280), countries: countries.map((x) => x.code), regions: regions.map((x) => x.code) });
    }
  }
  const excludedCountries = [...new Set(exclusionEvidence.flatMap((e) => e.countries))].sort();
  const excludedRegions = [...new Set(exclusionEvidence.flatMap((e) => e.regions))].sort();
  for (const { source, text } of sources) {
    for (const line of textLines(text)) {
      const cue = line.match(EXCLUSION_CUE);
      if (!cue) continue;
      const excludedPart = exclusionClause(line, cue);
      const cities = foundItalianCities(excludedPart).map(({ city }) => city);
      if (cities.length) exclusionEvidence.push({ field: 'geographic_exclusion', source, text: line.slice(0, 280), countries: [], regions: [], cities });
    }
  }
  const finalExcludedCities = [...new Set(exclusionEvidence.flatMap((e) => e.cities ?? []))].sort();
  // EMEA is distinct from Europe and the EU, but an explicit EMEA hiring
  // region is a positive Italy signal for discovery. Keep its decision likely
  // rather than confirmed unless the posting names Italy or a narrower region.
  const targetRegionCoversCandidate = eligibleRegions.some((r) => COVERS_CANDIDATE.includes(r));
  const exclusionRegionCoversCandidate = excludedRegions.some((r) => COVERS_CANDIDATE.includes(r));
  const candidateCityExcluded = candidateCity && finalExcludedCities.some((city) => city.toLowerCase() === candidateCity.toLowerCase());
  const restrictedEvidence = evidence.filter((entry) => entry.restricted && (entry.countries.length > 0 || entry.regions.length > 0));
  const candidateIncludedByRestriction = (entry) => entry.countries.includes(candidateCountry)
    || entry.regions.some((r) => COVERS_CANDIDATE.includes(r));
  const restrictiveListExcludesCandidate = restrictedEvidence.some((entry) => !candidateIncludedByRestriction(entry));
  let candidateEligibility = 'UNKNOWN';
  let eligibilityReason = 'No explicit hiring-country evidence for the candidate country.';
  if (excludedCountries.includes(candidateCountry) || exclusionRegionCoversCandidate || candidateCityExcluded || restrictiveListExcludesCandidate) {
    candidateEligibility = 'INELIGIBLE';
    eligibilityReason = candidateCityExcluded
      ? 'The posting explicitly excludes the candidate city.'
      : restrictiveListExcludesCandidate && !excludedCountries.includes(candidateCountry) && !exclusionRegionCoversCandidate
        ? 'A narrower hiring-country restriction does not include the candidate country.'
        : 'The posting explicitly excludes the candidate country or a region that contains it.';
  } else if (eligibleCountries.includes(candidateCountry) || targetRegionCoversCandidate || (candidateCountry === 'IT' && cityEvidence.length > 0)) {
    candidateEligibility = 'ELIGIBLE';
    eligibilityReason = eligibleCountries.includes(candidateCountry)
      ? 'The posting explicitly names the candidate country as a hiring location.'
      : candidateCountry === 'IT' && cityEvidence.length > 0
        ? `The posting names an Italian city (${cityEvidence.map((entry) => entry.city).join(', ')}).`
      : 'The posting names a region that includes the candidate country.';
  }

  // Limited to named places: the posting's own location fields (location, title, structured countries) name countries,
  // none of them the candidate's, and nothing anywhere names a region that covers it ("Mumbai (Remote)", "Brazil,
  // Portugal"). Remote here means remote within those places.
  if (candidateEligibility === 'UNKNOWN') {
    // Countries and regions named in the posting's own location fields; a board's derived region tag does not count.
    const placeEvidence = evidence.filter((e) => ['location', 'title', 'structured_country'].includes(e.source));
    const places = [...new Set(placeEvidence.flatMap((e) => [...e.countries, ...e.regions]))];
    if (places.length && !places.includes(candidateCountry) && !places.some((r) => COVERS_CANDIDATE.includes(r))) {
      candidateEligibility = 'INELIGIBLE';
      eligibilityReason = `The posting is limited to ${places.join(', ')}, which does not include the candidate country.`;
    }
  }

  const arrangement = inferArrangement(job, fullText);
  const scopeCodeCount = new Set([...eligibleCountries, ...eligibleRegions]).size;
  const scope = eligibleRegions.includes('WORLDWIDE') ? 'WORLDWIDE'
    : eligibleRegions.length > 1 ? 'MULTI_REGION'
      : eligibleRegions.includes('EEA') ? 'EEA'
        : eligibleRegions.includes('EU') ? 'EU'
          : eligibleRegions.includes('UK') ? 'UK'
            : eligibleRegions.includes('EUROPE') ? 'EUROPE'
              : eligibleRegions.includes('EMEA') ? 'EMEA'
                  : eligibleRegions.length === 1 ? eligibleRegions[0]
                : cityEvidence.length > 0 && eligibleCountries.length === 0 ? 'CITY_SPECIFIC'
                : eligibleCountries.length > 1 ? 'MULTI_COUNTRY'
                  : eligibleCountries.length === 1 ? 'COUNTRY_SPECIFIC'
                    : 'UNSPECIFIED';
  const tz = fullText.match(TZ_WINDOW_RE)?.[0]
    ?? fullText.match(/\b(?:CET|CEST|UTC[+-]?\d{0,2}(?::?\d{2})?|GMT[+-]?\d{0,2}(?::?\d{2})?)\b/i)?.[0]
    ?? fullText.match(TZ_RE)?.[0]
    ?? '';
  const textSponsorship = sponsorship(fullText);
  const auth = textSponsorship !== 'UNKNOWN' ? textSponsorship
    : typeof job.visaSponsorship === 'boolean' ? (job.visaSponsorship ? 'AVAILABLE' : 'NOT_AVAILABLE') : 'UNKNOWN';
  const authorizationRequirement = workAuthorization(fullText);
  const authorizationLines = textLines(fullText).filter((line) => workAuthorization(line) === 'REQUIRED');
  const authorizationCountries = [...new Set(authorizationLines.flatMap((line) => foundCountries(line).map(({ code }) => code)))].sort();
  const authorizationRegions = [...new Set(authorizationLines.flatMap((line) => foundRegions(line).map(({ code }) => code)))].sort();
  const candidateAuthorization = authorizationRequirement !== 'REQUIRED' ? 'NOT_STATED'
    : candidateEligibility === 'INELIGIBLE' ? 'NOT_ELIGIBLE'
      : eligibleCountries.length === 1 && eligibleCountries[0] === candidateCountry && authorizedCountries.includes(candidateCountry) ? 'SATISFIED_FOR_COUNTRY'
        : 'REVIEW_REQUIRED';
  const explicitLocationOrEligibility = evidence.some((e) => e.source !== 'description' || ELIGIBILITY_CUE.test(e.text));
  const confidence = candidateEligibility === 'UNKNOWN' ? (scopeCodeCount || arrangement.value !== 'UNKNOWN' ? 0.55 : 0.25)
    : candidateEligibility === 'ELIGIBLE' && (eligibleCountries.includes(candidateCountry) || eligibleRegions.some((r) => ['EEA', 'EU', 'EUROPE'].includes(r))) ? 0.95
      : explicitLocationOrEligibility ? 0.85 : 0.7;

  const decision = candidateEligibility === 'INELIGIBLE' ? 'NOT_ELIGIBLE'
    : candidateEligibility === 'UNKNOWN' ? 'REQUIRES_MANUAL_REVIEW'
      : descriptionEvidence.some((entry) => entry.countries.includes(candidateCountry) || entry.regions.some((r) => ['EEA', 'EU', 'EUROPE'].includes(r)))
        ? 'ELIGIBLE_CONFIRMED' : 'ELIGIBLE_LIKELY';
  const office = officeAttendance(fullText);
  const citizenship = citizenshipRequirement(description);

  return {
    schemaVersion: 1,
    candidateCountry,
    candidateCity: candidateCity || null,
    candidateEligibility,
    eligibilityDecision: decision,
    eligibilityReason,
    source: options.source ?? job.source ?? job.source_name ?? null,
    extractedAt: new Date().toISOString(),
    geographicScope: {
      classification: scope,
      eligibleCountries,
      excludedCountries,
      eligibleRegions,
      excludedRegions,
      eligibleCities: [...new Set(cityEvidence.map((entry) => entry.city))].sort(),
      excludedCities: finalExcludedCities,
      inferredCountries: [...new Set(cityEvidence.map((entry) => entry.inferredCountry))].sort(),
      evidence: [...evidence, ...cityEvidence, ...exclusionEvidence],
    },
    workArrangement: { value: arrangement.value, evidence: arrangement.evidence },
    hiringEligibility: {
      sponsorship: auth,
      workAuthorization: authorizationRequirement,
      workAuthorizationCountries: authorizationCountries,
      workAuthorizationRegions: authorizationRegions,
      candidateWorkAuthorization: candidateAuthorization,
      citizenshipRequirement: citizenship,
      evidence: [
        ...(typeof job.visaSponsorship === 'boolean' ? [{ source: 'structured_enrichment', text: `visa_sponsorship=${job.visaSponsorship}` }] : []),
        ...textLines(fullText).filter((line) => /\b(?:sponsor(?:ship)?|right to work|work authorization|work permit)\b/i.test(line)).map((text) => ({ source: 'posting_text', text: text.slice(0, 280) })),
      ],
    },
    employmentModel: employmentModel(fullText, job.employment_type),
    employmentModelEvidence: textLines(fullText).find((line) => /\b(?:employee|employment|full[- ]time|permanent|payroll|EOR|independent contractor|contractor|contract|freelance|B2B|partita IVA)\b/i.test(line))?.slice(0, 280) ?? String(job.employment_type ?? ''),
    timeZoneRequirement: tz || null,
    timeZoneEvidence: tz ? fullText.match(new RegExp(`[^.!?\\n]*${escapeRe(tz)}[^.!?\\n]*`, 'i'))?.[0]?.trim() ?? tz : null,
    officeAttendance: office,
    confidence,
  };
}

export { normalizeCountry as normalizeCountryCode };
