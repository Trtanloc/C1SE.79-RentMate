export type CriterionKey = string;

export type PairwiseComparisonMatrix = number[][];

export type AhpComputationResult<K extends CriterionKey> = {
  weights: Record<K, number>;
  normalizedMatrix: number[][];
  lambdaMax: number;
  consistencyIndex: number;
  consistencyRatio?: number;
};

const RANDOM_INDEX: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0.58,
  4: 0.9,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49,
};

/**
 * Computes AHP weights using the principal eigenvector method.
 */
export function computeAhpWeights<K extends CriterionKey>(
  criteriaKeys: K[],
  matrix: PairwiseComparisonMatrix,
): AhpComputationResult<K> {
  validateMatrix(criteriaKeys, matrix);
  const normalizedMatrix = normalizeColumns(matrix);
  const eigenvector = powerMethod(matrix);
  const weightsRecord = buildWeightRecord(criteriaKeys, eigenvector);
  const lambdaMax = estimateLambdaMax(matrix, eigenvector);
  const consistencyIndex = computeConsistencyIndex(lambdaMax, criteriaKeys.length);
  const consistencyRatio = computeConsistencyRatio(consistencyIndex, criteriaKeys.length);

  return {
    weights: weightsRecord,
    normalizedMatrix,
    lambdaMax,
    consistencyIndex,
    consistencyRatio,
  };
}

export function buildConsistentPairwiseMatrix<K extends CriterionKey>(
  criteriaKeys: K[],
  importance: Record<K, number>,
): PairwiseComparisonMatrix {
  return criteriaKeys.map((rowKey) =>
    criteriaKeys.map((colKey) => {
      const numerator = importance[rowKey];
      const denominator = importance[colKey];
      if (denominator === 0) {
        throw new Error(`Importance for "${String(colKey)}" cannot be zero.`);
      }
      return numerator / denominator;
    }),
  );
}

function validateMatrix<K extends CriterionKey>(
  criteriaKeys: K[],
  matrix: PairwiseComparisonMatrix,
) {
  const dimension = criteriaKeys.length;
  if (!Array.isArray(matrix) || matrix.length !== dimension) {
    throw new Error(`Pairwise matrix must be square with dimension ${dimension}.`);
  }

  matrix.forEach((row, rowIndex) => {
    if (!Array.isArray(row) || row.length !== dimension) {
      throw new Error(`Row ${rowIndex} of the pairwise matrix must have length ${dimension}.`);
    }

    row.forEach((value, colIndex) => {
      if (value <= 0 || !Number.isFinite(value)) {
        throw new Error(`Matrix value at [${rowIndex}, ${colIndex}] must be a positive finite number.`);
      }
    });
  });
}

function normalizeColumns(matrix: PairwiseComparisonMatrix): number[][] {
  const columnSums = matrix[0].map((_, columnIndex) =>
    matrix.reduce((sum, row) => sum + row[columnIndex], 0),
  );

  return matrix.map((row) =>
    row.map((value, columnIndex) => value / columnSums[columnIndex]),
  );
}

function powerMethod(matrix: PairwiseComparisonMatrix): number[] {
  const size = matrix.length;
  let vector = new Array(size).fill(1 / size);
  const maxIterations = 1000;
  const tolerance = 1e-9;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const next = multiplyMatrixVector(matrix, vector);
    const normalized = normalizeVector(next);

    const delta = normalized.reduce(
      (diff, value, index) => diff + Math.abs(value - vector[index]),
      0,
    );

    vector = normalized;
    if (delta < tolerance) {
      break;
    }
  }

  return vector;
}

function multiplyMatrixVector(
  matrix: PairwiseComparisonMatrix,
  vector: number[],
): number[] {
  return matrix.map((row) =>
    row.reduce((sum, value, index) => sum + value * vector[index], 0),
  );
}

function normalizeVector(vector: number[]): number[] {
  const sum = vector.reduce((acc, value) => acc + value, 0);
  return vector.map((value) => value / sum);
}

function buildWeightRecord<K extends CriterionKey>(
  criteriaKeys: K[],
  vector: number[],
): Record<K, number> {
  const record = {} as Record<K, number>;
  criteriaKeys.forEach((key, index) => {
    record[key] = vector[index];
  });
  return record;
}

function estimateLambdaMax(
  matrix: PairwiseComparisonMatrix,
  eigenvector: number[],
): number {
  const weightedSum = multiplyMatrixVector(matrix, eigenvector);
  const ratios = weightedSum.map((value, index) => value / eigenvector[index]);
  const lambdaEstimate =
    ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
  return lambdaEstimate;
}

function computeConsistencyIndex(lambdaMax: number, size: number): number {
  if (size <= 1) {
    return 0;
  }
  return (lambdaMax - size) / (size - 1);
}

function computeConsistencyRatio(consistencyIndex: number, size: number) {
  const ri = RANDOM_INDEX[size];
  if (!ri) {
    return undefined;
  }
  return consistencyIndex / ri;
}
