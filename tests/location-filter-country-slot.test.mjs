import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLocationFilter } from '../scan.mjs';

const filter = buildLocationFilter({
  always_allow: ['united states'],
  block: ['india', 'bengaluru', 'canada', 'toronto', 'germany', 'berlin'],
});

test('a trailing ISO country code is not read as a US state', () => {
  for (const location of [
    'Bengaluru, Karnataka, IN',
    'Bengaluru, KA, IN',
    'Toronto, ON, CA',
    'Berlin, BE, DE',
  ]) {
    assert.equal(filter(location), false, `${location} stays blocked`);
  }
});

test('US states still rescue City, ST and City, ST, Country forms', () => {
  for (const location of ['Dublin, OH', 'Austin, TX, US', 'Columbus, OH, USA', 'Portland, OR, United States']) {
    assert.equal(filter(location), true, `${location} passes`);
  }
  const usBlock = buildLocationFilter({ always_allow: ['united states'], block: ['dublin'] });
  assert.equal(usBlock('Dublin, OH, US'), true);
  assert.equal(usBlock('Dublin, D, IE'), false);
});

test('explicit positive target geography can rescue a mixed location unless block_hard matches', () => {
  const mixed = buildLocationFilter({ always_allow: ['Italy', 'EU'], block: ['United States'] });
  const eligibility = { candidateEligibility: 'ELIGIBLE' };
  assert.equal(mixed('Remote — United States', undefined, 'Backend Engineer', eligibility), true);

  const hard = buildLocationFilter({ always_allow: ['Italy', 'EU'], block: ['United States'], block_hard: ['United States'] });
  assert.equal(hard('Remote — United States', undefined, 'Backend Engineer', eligibility), false);
});
