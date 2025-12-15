import { CriterionKey } from './ahp';

export type CriterionType = 'benefit' | 'cost';

export type CriterionDefinition<K extends CriterionKey> = {
  key: K;
  type: CriterionType;
};

export type DecisionAlternative<K extends CriterionKey, TPayload = unknown> = {
  id: string | number;
  values: Record<K, number>;
  payload?: TPayload;
};

export type TopsisScoreRow<K extends CriterionKey, TPayload = unknown> = {
  id: string | number;
  score: number;
  positiveDistance: number;
  negativeDistance: number;
  values: Record<K, number>;
  payload?: TPayload;
};

export type TopsisComputationResult<K extends CriterionKey, TPayload = unknown> = {
  positiveIdeal: Record<K, number>;
  negativeIdeal: Record<K, number>;
  scores: Array<TopsisScoreRow<K, TPayload>>;
};

/**
 * Computes TOPSIS scores for a list of alternatives.
 */
export function computeTopsis<K extends CriterionKey, TPayload = unknown>(
  criteria: Array<CriterionDefinition<K>>,
  alternatives: Array<DecisionAlternative<K, TPayload>>,
  weights: Record<K, number>,
): TopsisComputationResult<K, TPayload> {
  if (!alternatives.length) {
    return {
      positiveIdeal: {} as Record<K, number>,
      negativeIdeal: {} as Record<K, number>,
      scores: [],
    };
  }

  const keys = criteria.map((item) => item.key);
  validateWeights(keys, weights);

  const normalizationFactors = buildNormalizationFactors(alternatives, keys);
  const weightedNormalized = alternatives.map((alternative) => {
    const values = {} as Record<K, number>;
    keys.forEach((key) => {
      const normalized =
        normalizationFactors[key] === 0
          ? 0
          : alternative.values[key] / normalizationFactors[key];
      values[key] = normalized * weights[key];
    });
    return { ...alternative, values };
  });

  const { positiveIdeal, negativeIdeal } = deriveIdealSolutions(
    weightedNormalized,
    criteria,
  );

  const scores = weightedNormalized.map((alternative) => {
    const positiveDistance = calculateDistance(
      alternative.values,
      positiveIdeal,
      keys,
    );
    const negativeDistance = calculateDistance(
      alternative.values,
      negativeIdeal,
      keys,
    );
    const denominator = positiveDistance + negativeDistance;
    const score = denominator === 0 ? 0 : negativeDistance / denominator;
    return {
      id: alternative.id,
      values: alternative.values,
      positiveDistance,
      negativeDistance,
      score,
      payload: alternative.payload,
    };
  });

  return {
    positiveIdeal,
    negativeIdeal,
    scores: scores.sort((a, b) => b.score - a.score),
  };
}

function validateWeights<K extends CriterionKey>(
  keys: K[],
  weights: Record<K, number>,
) {
  keys.forEach((key) => {
    if (weights[key] === undefined) {
      throw new Error(`Missing weight for criterion "${String(key)}".`);
    }
  });
}

function buildNormalizationFactors<K extends CriterionKey>(
  alternatives: Array<DecisionAlternative<K>>,
  keys: K[],
): Record<K, number> {
  const factors = {} as Record<K, number>;
  keys.forEach((key) => {
    const sumOfSquares = alternatives.reduce(
      (sum, alternative) => sum + Math.pow(alternative.values[key] ?? 0, 2),
      0,
    );
    factors[key] = Math.sqrt(sumOfSquares);
  });
  return factors;
}

function deriveIdealSolutions<K extends CriterionKey>(
  alternatives: Array<DecisionAlternative<K>>,
  criteria: Array<CriterionDefinition<K>>,
) {
  const positiveIdeal = {} as Record<K, number>;
  const negativeIdeal = {} as Record<K, number>;

  criteria.forEach((criterion) => {
    const values = alternatives.map((alternative) => alternative.values[criterion.key]);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    if (criterion.type === 'benefit') {
      positiveIdeal[criterion.key] = maxValue;
      negativeIdeal[criterion.key] = minValue;
    } else {
      positiveIdeal[criterion.key] = minValue;
      negativeIdeal[criterion.key] = maxValue;
    }
  });

  return { positiveIdeal, negativeIdeal };
}

function calculateDistance<K extends CriterionKey>(
  values: Record<K, number>,
  ideal: Record<K, number>,
  keys: K[],
): number {
  const sumOfSquares = keys.reduce((sum, key) => {
    const diff = (values[key] ?? 0) - (ideal[key] ?? 0);
    return sum + diff * diff;
  }, 0);

  return Math.sqrt(sumOfSquares);
}
