import { strict as assert } from 'node:assert';
import {
  buildConsistentPairwiseMatrix,
  computeAhpWeights,
} from '../ahp';
import { computeTopsis, CriterionDefinition } from '../topsis';

type TestCriteria = 'price' | 'area' | 'distance_to_center';
type ApprovedCriteria =
  | 'price_per_m2'
  | 'distance_to_city'
  | 'listing_age_days'
  | 'area'
  | 'bedrooms'
  | 'bathrooms'
  | 'amenities_match_ratio'
  | 'owner_response_score'
  | 'review_rating_avg'
  | 'availability_flag';

const TEST_CRITERIA: Array<CriterionDefinition<TestCriteria>> = [
  { key: 'price', type: 'cost' },
  { key: 'area', type: 'benefit' },
  { key: 'distance_to_center', type: 'cost' },
];

const TEST_IMPORTANCE: Record<TestCriteria, number> = {
  price: 6,
  area: 4,
  distance_to_center: 5,
};

const TEST_ALTERNATIVES = [
  {
    id: 'A',
    values: { price: 9_000_000, area: 45, distance_to_center: 3 },
  },
  {
    id: 'B',
    values: { price: 8_000_000, area: 35, distance_to_center: 6 },
  },
  {
    id: 'C',
    values: { price: 7_000_000, area: 30, distance_to_center: 9 },
  },
];

function main() {
  testAhpWeightNormalization();
  testTopsisScoreRangeAndDeterminism();
  testApprovedAhpPriorities();
  // eslint-disable-next-line no-console
  console.log('MCDM tests passed');
}

function testAhpWeightNormalization() {
  const matrix = buildConsistentPairwiseMatrix(
    TEST_CRITERIA.map((c) => c.key),
    TEST_IMPORTANCE,
  );
  const result = computeAhpWeights(TEST_CRITERIA.map((c) => c.key), matrix);
  const sum = Object.values(result.weights).reduce((total, value) => total + value, 0);
  assert(
    Math.abs(sum - 1) < 1e-6,
    `AHP weights must sum to 1, received ${sum}`,
  );
}

function testTopsisScoreRangeAndDeterminism() {
  const matrix = buildConsistentPairwiseMatrix(
    TEST_CRITERIA.map((c) => c.key),
    TEST_IMPORTANCE,
  );
  const ahp = computeAhpWeights(TEST_CRITERIA.map((c) => c.key), matrix);
  const firstRun = computeTopsis(TEST_CRITERIA, TEST_ALTERNATIVES, ahp.weights);
  const secondRun = computeTopsis(TEST_CRITERIA, TEST_ALTERNATIVES, ahp.weights);

  firstRun.scores.forEach((row) => {
    assert(
      row.score >= 0 && row.score <= 1,
      `TOPSIS score must be between 0 and 1, received ${row.score}`,
    );
  });

  assert.deepStrictEqual(
    firstRun.scores.map((row) => row.score.toFixed(6)),
    secondRun.scores.map((row) => row.score.toFixed(6)),
    'TOPSIS output should be deterministic for identical inputs',
  );
}

function testApprovedAhpPriorities() {
  const priorities: Record<ApprovedCriteria, number> = {
    price_per_m2: 5,
    amenities_match_ratio: 4,
    distance_to_city: 4,
    area: 3,
    bedrooms: 2,
    bathrooms: 2,
    listing_age_days: 1,
    owner_response_score: 2,
    review_rating_avg: 2,
    availability_flag: 5,
  };

  const keys = Object.keys(priorities) as ApprovedCriteria[];
  const matrix = buildConsistentPairwiseMatrix(keys, priorities);
  const { weights } = computeAhpWeights(keys, matrix);
  const sum = Object.values(weights).reduce((total, value) => total + value, 0);

  assert(Math.abs(sum - 1) < 1e-6, 'Approved AHP weights must sum to 1');
  assert(
    weights.price_per_m2 > weights.area,
    'Price per m2 should be weighted higher than area',
  );
  assert(
    weights.availability_flag >= weights.bedrooms,
    'Availability must not be weighted less than bedrooms',
  );
}

main();
