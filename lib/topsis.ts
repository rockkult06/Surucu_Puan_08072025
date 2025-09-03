export interface TOPSISInput {
  alternatives: string[]
  criteria: string[]
  matrix: number[][]
  weights: number[]
  criteriaTypes: ("benefit" | "cost")[]
}

export interface TOPSISResult {
  alternative: string
  closenessCoefficient: number
  rank: number
  distanceTraveled?: number
}

export interface TOPSISDetailedResult {
  results: TOPSISResult[]
  decisionMatrix: number[][]
  normalizedMatrix: number[][]
  weightedMatrix: number[][]
  idealSolution: number[]
  negativeIdealSolution: number[]
  criteria: string[]
  alternatives: string[]
  weights: number[]
  criteriaTypes: ("benefit" | "cost")[]
}

export function calculateTOPSIS(input: TOPSISInput): TOPSISResult[] {
  const { alternatives, criteria, matrix, weights, criteriaTypes } = input

  if (!matrix || matrix.length === 0 || !matrix[0] || matrix[0].length === 0) {
    throw new Error("Geçersiz karar matrisi")
  }

  if (matrix.length !== alternatives.length) {
    throw new Error("Alternatif sayısı ile matris satır sayısı uyuşmuyor")
  }

  if (matrix[0].length !== criteria.length) {
    throw new Error("Kriter sayısı ile matris sütun sayısı uyuşmuyor")
  }

  if (weights.length !== criteria.length) {
    throw new Error("Ağırlık sayısı ile kriter sayısı uyuşmuyor")
  }

  if (criteriaTypes.length !== criteria.length) {
    throw new Error("Kriter tipi sayısı ile kriter sayısı uyuşmuyor")
  }

  // 1. Normalize the decision matrix
  const normalizedMatrix = normalizeMatrix(matrix)

  // 2. Calculate weighted normalized matrix
  const weightedMatrix = normalizedMatrix.map((row) => row.map((value, j) => value * weights[j]))

  // 3. Determine ideal and negative-ideal solutions
  const idealSolution: number[] = []
  const negativeIdealSolution: number[] = []

  for (let j = 0; j < criteria.length; j++) {
    const column = weightedMatrix.map((row) => row[j])

    if (criteriaTypes[j] === "benefit") {
      idealSolution[j] = Math.max(...column)
      negativeIdealSolution[j] = Math.min(...column)
    } else {
      idealSolution[j] = Math.min(...column)
      negativeIdealSolution[j] = Math.max(...column)
    }
  }

  // 4. Calculate distances to ideal and negative-ideal solutions
  const results: TOPSISResult[] = alternatives.map((alternative, i) => {
    const distanceToIdeal = Math.sqrt(
      weightedMatrix[i].reduce((sum, value, j) => sum + Math.pow(value - idealSolution[j], 2), 0),
    )

    const distanceToNegativeIdeal = Math.sqrt(
      weightedMatrix[i].reduce((sum, value, j) => sum + Math.pow(value - negativeIdealSolution[j], 2), 0),
    )

    // 5. Calculate closeness coefficient
    const closenessCoefficient = distanceToNegativeIdeal / (distanceToIdeal + distanceToNegativeIdeal)

    return {
      alternative,
      closenessCoefficient: isNaN(closenessCoefficient) ? 0 : closenessCoefficient,
      rank: 0, // Will be set after sorting
      distanceTraveled: undefined, // Will be set if distance data is available
    }
  })

  // 6. Sort by closeness coefficient (descending) and assign ranks
  results.sort((a, b) => {
    // First sort by closeness coefficient
    const coeffDiff = b.closenessCoefficient - a.closenessCoefficient

    // If closeness coefficients are very close (within 0.0001), use distance traveled as tie-breaker
    if (Math.abs(coeffDiff) < 0.0001 && a.distanceTraveled !== undefined && b.distanceTraveled !== undefined) {
      return (b.distanceTraveled || 0) - (a.distanceTraveled || 0)
    }

    return coeffDiff
  })

  // Assign ranks
  results.forEach((result, index) => {
    result.rank = index + 1
  })

  return results
}

export function calculateTOPSISDetailed(input: TOPSISInput): TOPSISDetailedResult {
  const { alternatives, criteria, matrix, weights, criteriaTypes } = input

  if (!matrix || matrix.length === 0 || !matrix[0] || matrix[0].length === 0) {
    throw new Error("Geçersiz karar matrisi")
  }

  if (matrix.length !== alternatives.length) {
    throw new Error("Alternatif sayısı ile matris satır sayısı uyuşmuyor")
  }

  if (matrix[0].length !== criteria.length) {
    throw new Error("Kriter sayısı ile matris sütun sayısı uyuşmuyor")
  }

  if (weights.length !== criteria.length) {
    throw new Error("Ağırlık sayısı ile kriter sayısı uyuşmuyor")
  }

  if (criteriaTypes.length !== criteria.length) {
    throw new Error("Kriter tipi sayısı ile kriter sayısı uyuşmuyor")
  }

  // 1. Normalize the decision matrix
  const normalizedMatrix = normalizeMatrix(matrix)

  // 2. Calculate weighted normalized matrix
  const weightedMatrix = normalizedMatrix.map((row) => row.map((value, j) => value * weights[j]))

  // 3. Determine ideal and negative-ideal solutions
  const idealSolution: number[] = []
  const negativeIdealSolution: number[] = []

  for (let j = 0; j < criteria.length; j++) {
    const column = weightedMatrix.map((row) => row[j])

    if (criteriaTypes[j] === "benefit") {
      idealSolution[j] = Math.max(...column)
      negativeIdealSolution[j] = Math.min(...column)
    } else {
      idealSolution[j] = Math.min(...column)
      negativeIdealSolution[j] = Math.max(...column)
    }
  }

  // 4. Calculate distances to ideal and negative-ideal solutions
  const results: TOPSISResult[] = alternatives.map((alternative, i) => {
    const distanceToIdeal = Math.sqrt(
      weightedMatrix[i].reduce((sum, value, j) => sum + Math.pow(value - idealSolution[j], 2), 0),
    )

    const distanceToNegativeIdeal = Math.sqrt(
      weightedMatrix[i].reduce((sum, value, j) => sum + Math.pow(value - negativeIdealSolution[j], 2), 0),
    )

    // 5. Calculate closeness coefficient
    const closenessCoefficient = distanceToNegativeIdeal / (distanceToIdeal + distanceToNegativeIdeal)

    return {
      alternative,
      closenessCoefficient: isNaN(closenessCoefficient) ? 0 : closenessCoefficient,
      rank: 0, // Will be set after sorting
      distanceTraveled: undefined, // Will be set if distance data is available
    }
  })

  // 6. Sort by closeness coefficient (descending) and assign ranks
  results.sort((a, b) => {
    // First sort by closeness coefficient
    const coeffDiff = b.closenessCoefficient - a.closenessCoefficient

    // If closeness coefficients are very close (within 0.0001), use distance traveled as tie-breaker
    if (Math.abs(coeffDiff) < 0.0001 && a.distanceTraveled !== undefined && b.distanceTraveled !== undefined) {
      return (b.distanceTraveled || 0) - (a.distanceTraveled || 0)
    }

    return coeffDiff
  })

  // Assign ranks
  results.forEach((result, index) => {
    result.rank = index + 1
  })

  return {
    results,
    decisionMatrix: matrix,
    normalizedMatrix,
    weightedMatrix,
    idealSolution,
    negativeIdealSolution,
    criteria,
    alternatives,
    weights,
    criteriaTypes
  }
}

function normalizeMatrix(matrix: number[][]): number[][] {
  const normalizedMatrix: number[][] = []

  // Calculate column sums for normalization
  const columnSums = matrix[0].map((_, j) => Math.sqrt(matrix.reduce((sum, row) => sum + Math.pow(row[j], 2), 0)))

  // Normalize each element
  for (let i = 0; i < matrix.length; i++) {
    normalizedMatrix[i] = []
    for (let j = 0; j < matrix[i].length; j++) {
      normalizedMatrix[i][j] = columnSums[j] === 0 ? 0 : matrix[i][j] / columnSums[j]
    }
  }

  return normalizedMatrix
}

export function addDistanceDataToResults(results: TOPSISResult[], distanceData: Record<string, number>): TOPSISResult[] {
  const updatedResults = results.map((result) => ({
    ...result,
    distanceTraveled: distanceData[result.alternative] || 0,
  }))

  // Re-sort with distance tie-breaking
  updatedResults.sort((a, b) => {
    const coeffDiff = b.closenessCoefficient - a.closenessCoefficient

    if (Math.abs(coeffDiff) === 0.0000 && a.distanceTraveled !== undefined && b.distanceTraveled !== undefined) {
      return (b.distanceTraveled || 0) - (a.distanceTraveled || 0)
    }

    return coeffDiff
  })

  // Re-assign ranks
  updatedResults.forEach((result, index) => {
    result.rank = index + 1
  })

  return updatedResults
}
