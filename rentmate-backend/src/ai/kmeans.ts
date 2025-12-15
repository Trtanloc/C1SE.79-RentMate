export type KMeansResult = {
  assignments: number[];
  centroids: number[][];
};

/**
 * Runs a basic K-means clustering on the provided feature matrix.
 * - vectors: Array of feature vectors (each vector must have equal length).
 * - k: number of clusters to compute (automatically reduced when data is smaller).
 */
export function runKMeans(
  vectors: number[][],
  k: number,
  maxIterations = 100,
): KMeansResult {
  if (!vectors.length) {
    return { assignments: [], centroids: [] };
  }

  const dimension = vectors[0].length;
  const effectiveK = Math.max(1, Math.min(k, vectors.length));
  let centroids = initializeCentroids(vectors, effectiveK);
  let assignments = new Array(vectors.length).fill(0);

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const nextAssignments = vectors.map((vector) =>
      findClosestCentroid(vector, centroids),
    );

    const nextCentroids = recomputeCentroids(
      vectors,
      nextAssignments,
      effectiveK,
      dimension,
    );

    if (hasConverged(assignments, nextAssignments)) {
      assignments = nextAssignments;
      centroids = nextCentroids;
      break;
    }

    assignments = nextAssignments;
    centroids = nextCentroids;
  }

  return { assignments, centroids };
}

function initializeCentroids(vectors: number[][], k: number): number[][] {
  const centroids: number[][] = [];
  const usedIndexes = new Set<number>();
  while (centroids.length < k) {
    const index = centroids.length;
    if (!usedIndexes.has(index)) {
      usedIndexes.add(index);
      centroids.push([...vectors[index]]);
    }
  }
  return centroids;
}

function findClosestCentroid(vector: number[], centroids: number[][]): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  centroids.forEach((centroid, index) => {
    const distance = euclideanDistance(vector, centroid);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function recomputeCentroids(
  vectors: number[][],
  assignments: number[],
  k: number,
  dimension: number,
): number[][] {
  const sums = new Array(k).fill(0).map(() => new Array(dimension).fill(0));
  const counts = new Array(k).fill(0);

  vectors.forEach((vector, index) => {
    const cluster = assignments[index];
    counts[cluster] += 1;
    for (let dim = 0; dim < dimension; dim += 1) {
      sums[cluster][dim] += vector[dim];
    }
  });

  return sums.map((sumVector, clusterIndex) => {
    const count = counts[clusterIndex];
    if (count === 0) {
      return [...vectors[clusterIndex % vectors.length]];
    }
    return sumVector.map((value) => value / count);
  });
}

function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(
    a.reduce((total, value, index) => {
      const diff = value - b[index];
      return total + diff * diff;
    }, 0),
  );
}

function hasConverged(prev: number[], next: number[]): boolean {
  if (prev.length !== next.length) {
    return false;
  }
  return prev.every((value, index) => value === next[index]);
}
