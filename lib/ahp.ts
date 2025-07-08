/**
 * Analytic Hierarchy Process helpers
 *
 * The file now contains BOTH the original hierarchical helpers
 * (calculateAHP, calculateHierarchicalAHP, slider converters …)
 * AND the newer lightweight helpers we added later (calculateWeights,
 * checkConsistency, createComparisonMatrix …).
 *
 * Nothing outside this file had to change – all previous imports keep working.
 */

/////////////////////
// Types & helpers //
/////////////////////

// --- generic (flat) helpers we added earlier -------------------------------

export interface ComparisonMatrix {
  [key: string]: number[]
}

export interface ConsistencyResult {
  consistencyIndex: number
  consistencyRatio: number
  isConsistent: boolean
  eigenVector: number[]
  maxEigenValue: number
}

// Saaty random index table (up to 15×15)
const RANDOM_INDEX = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49, 1.51, 1.48, 1.56, 1.57, 1.59]

/**
 * Calculate weights with the geometric-mean method.
 */
export function calculateWeights(matrix: number[][]): number[] {
  const n = matrix.length
  if (n === 0) return []

  const weights = new Array<number>(n).fill(0)
  for (let i = 0; i < n; i++) {
    let product = 1
    for (let j = 0; j < n; j++) product *= matrix[i][j]
    weights[i] = Math.pow(product, 1 / n)
  }
  const sum = weights.reduce((s, w) => s + w, 0)
  return sum === 0 ? new Array(n).fill(1 / n) : weights.map((w) => w / sum)
}

/**
 * Consistency ratio for a single comparison matrix.
 */
export function checkConsistency(matrix: number[][], weights: number[]): ConsistencyResult {
  const n = matrix.length
  if (n <= 2) {
    return {
      consistencyIndex: 0,
      consistencyRatio: 0,
      isConsistent: true,
      eigenVector: weights,
      maxEigenValue: n,
    }
  }

  let lambdaMax = 0
  for (let i = 0; i < n; i++) {
    let rowSum = 0
    for (let j = 0; j < n; j++) rowSum += matrix[i][j] * weights[j]
    lambdaMax += rowSum / weights[i]
  }
  lambdaMax /= n

  const ci = (lambdaMax - n) / (n - 1)
  const ri = RANDOM_INDEX[n] ?? RANDOM_INDEX[RANDOM_INDEX.length - 1]
  const cr = ri === 0 ? 0 : ci / ri

  return {
    consistencyIndex: ci,
    consistencyRatio: cr,
    isConsistent: cr < 0.1,
    eigenVector: weights,
    maxEigenValue: lambdaMax,
  }
}

/**
 * Build a full pairwise-comparison matrix from sparse input.
 */
export function createComparisonMatrix(comparisons: Record<string, number>, criteriaIds: string[]): number[][] {
  const n = criteriaIds.length
  const M = Array.from({ length: n }, () => Array(n).fill(1))

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const k1 = `${criteriaIds[i]}_${criteriaIds[j]}`
      const k2 = `${criteriaIds[j]}_${criteriaIds[i]}`

      if (comparisons[k1] !== undefined) {
        M[i][j] = comparisons[k1]
        M[j][i] = 1 / comparisons[k1]
      } else if (comparisons[k2] !== undefined) {
        M[j][i] = comparisons[k2]
        M[i][j] = 1 / comparisons[k2]
      }
    }
  }
  return M
}

/**
 * Utility: normalise any weight vector.
 */
export function normalizeWeights(weights: number[]): number[] {
  const sum = weights.reduce((s, w) => s + w, 0)
  return sum === 0 ? new Array(weights.length).fill(1 / weights.length) : weights.map((w) => w / sum)
}

/**
 * Misc helpers kept for compatibility.
 */
export function getReciprocalValue(v: number) {
  return v === 0 ? 0 : 1 / v
}
export function isValidComparisonValue(v: number) {
  const valid = [1 / 9, 1 / 8, 1 / 7, 1 / 6, 1 / 5, 1 / 4, 1 / 3, 1 / 2, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  return valid.some((x) => Math.abs(x - v) < 0.001)
}
export const scaleDescriptions: Record<number, string> = {
  1: "Eşit önemde",
  2: "Zayıf veya hafif üstünlük",
  3: "Orta derecede önemli",
  4: "Orta ile güçlü arası",
  5: "Güçlü önemde",
  6: "Güçlü ile çok güçlü arası",
  7: "Çok güçlü veya kanıtlanmış önemde",
  8: "Çok, çok güçlü",
  9: "Aşırı önemde",
}

/////////////////////////////
// Original hierarchical  ///
/////////////////////////////

export interface AHPResult {
  weights: number[]
  consistencyIndex: number
  consistencyRatio: number
  isConsistent: boolean
}

export interface HierarchicalAHPResult {
  criteriaWeights: Record<string, number>
  globalWeights: Record<string, number>
  consistencyResults: Record<string, AHPResult>
}

/**
 * Classic AHP (row-average normalisation variant).
 */
export function calculateAHP(matrix: number[][]): AHPResult {
  const n = matrix.length
  if (n <= 1) {
    return { weights: [1], consistencyIndex: 0, consistencyRatio: 0, isConsistent: true }
  }

  // column-normalise
  const columnSums = Array(n).fill(0)
  matrix.forEach((row) => row.forEach((v, j) => (columnSums[j] += v)))
  const normalised = matrix.map((row) => row.map((v, j) => v / columnSums[j]))

  // row averages = weights
  const weights = normalised.map((row) => row.reduce((s, v) => s + v, 0) / n)

  // consistency
  const { consistencyIndex, consistencyRatio } = calculateConsistency(matrix, weights)

  return { weights, consistencyIndex, consistencyRatio, isConsistent: consistencyRatio <= 0.1 }
}

function calculateConsistency(matrix: number[][], weights: number[]) {
  const n = matrix.length
  if (n <= 2) return { consistencyIndex: 0, consistencyRatio: 0 }

  let lambdaMax = 0
  for (let i = 0; i < n; i++) {
    let sum = 0
    for (let j = 0; j < n; j++) sum += matrix[i][j] * weights[j]
    lambdaMax += sum / weights[i]
  }
  lambdaMax /= n

  const ci = (lambdaMax - n) / (n - 1)
  const ri = RANDOM_INDEX[n] ?? RANDOM_INDEX[RANDOM_INDEX.length - 1]
  const cr = ci / ri
  return { consistencyIndex: ci, consistencyRatio: cr }
}

/**
 * Full hierarchical AHP.
 */
export function calculateHierarchicalAHP(
  hierarchyData: Record<string, number[][]>,
  criteriaHierarchy: Record<string, any>,
): HierarchicalAHPResult {
  const criteriaWeights: Record<string, number> = {}
  const globalWeights: Record<string, number> = {}
  const consistencyResults: Record<string, AHPResult> = {}

  // 1) main criteria
  if (hierarchyData.main) {
    const mainRes = calculateAHP(hierarchyData.main)
    consistencyResults.main = mainRes

    const mainCriteria = Object.values(criteriaHierarchy)
      .filter((c: any) => c.level === 1)
      .sort((a: any, b: any) => a.id.localeCompare(b.id))

    mainCriteria.forEach((c: any, idx: number) => (criteriaWeights[c.id] = mainRes.weights[idx]))
  }

  // 2) sub criteria
  for (const [criterionId, matrix] of Object.entries(hierarchyData)) {
    if (criterionId === "main") continue
    const res = calculateAHP(matrix)
    consistencyResults[criterionId] = res

    const criterion = criteriaHierarchy[criterionId]
    if (criterion?.children) {
      criterion.children.forEach((childId: string, idx: number) => {
        criteriaWeights[childId] = res.weights[idx]
      })
    }
  }

  // 3) global weights (leaf nodes)
  for (const criterion of Object.values<any>(criteriaHierarchy)) {
    if (!criterion.isLeaf) continue
    let gw = 1
    let current: any = criterion
    while (current) {
      if (criteriaWeights[current.id]) gw *= criteriaWeights[current.id]
      current = current.parentId ? criteriaHierarchy[current.parentId] : null
    }
    globalWeights[criterion.id] = gw
  }

  // normalise global weights
  const totalGW = Object.values(globalWeights).reduce((s, w) => s + w, 0)
  if (totalGW > 0) Object.keys(globalWeights).forEach((k) => (globalWeights[k] /= totalGW))

  return { criteriaWeights, globalWeights, consistencyResults }
}

///////////////////////////////
// Slider <-> Saaty helpers  //
///////////////////////////////

/**
 * DÜZELTME: Convert slider position (-8 … +8) to Saaty scale (1/9 … 9).
 *
 * DOĞRU MANTIK:
 * - Slider pozitif (+3): SAĞ kriter 4x önemli → matrix[i][j] = 1/4 (sol/sağ = 1/4)
 * - Slider negatif (-3): SOL kriter 4x önemli → matrix[i][j] = 4 (sol/sağ = 4/1)
 */
export function sliderToAHPValue(slider: number): number {
  if (slider === 0) return 1

  if (slider > 0) {
    // Pozitif slider: SAĞ kriter daha önemli
    // matrix[i][j] küçük olmalı (1/importance)
    return 1 / (slider + 1)
  } else {
    // Negatif slider: SOL kriter daha önemli
    // matrix[i][j] büyük olmalı (importance)
    return Math.abs(slider) + 1
  }
}

/**
 * DÜZELTME: Convert Saaty value back to slider position.
 */
export function ahpValueToSlider(val: number): number {
  if (Math.abs(val - 1) < 0.001) return 0

  if (val > 1) {
    // Sol kriter daha önemli
    return -(val - 1)
  } else {
    // Sağ kriter daha önemli
    return 1 / val - 1
  }
}

/////////////////
// debug print //
/////////////////
export function printMatrix(matrix: number[][], labels?: string[]) {
  console.log("Comparison Matrix")
  matrix.forEach((row, i) => {
    const label = labels ? labels[i] : i.toString()
    console.log(label, row.map((v) => v.toFixed(3)).join("  "))
  })
}

// TOPSIS için gerekli interface ve fonksiyon
export interface TOPSISResult {
  alternatives: Array<{
    id: string
    name: string
    closenessCoefficient: number
    rank: number
    distanceTraveled?: number
  }>
  idealSolution: number[]
  negativeIdealSolution: number[]
  distances: Array<{
    positiveDistance: number
    negativeDistance: number
  }>
}

// TOPSIS algoritması
export function calculateTOPSIS(
  alternatives: Array<Record<string, number>>,
  weights: Record<string, number>,
  criteriaTypes: Record<string, "benefit" | "cost">,
  distanceData?: Record<string, number>,
): TOPSISResult {
  if (alternatives.length === 0) {
    return {
      alternatives: [],
      idealSolution: [],
      negativeIdealSolution: [],
      distances: [],
    }
  }

  const criteriaIds = Object.keys(weights)
  const normalizedMatrix: number[][] = []

  // Normalize edilmiş karar matrisi oluştur
  alternatives.forEach((alt, i) => {
    normalizedMatrix[i] = []
    criteriaIds.forEach((criteriaId, j) => {
      const value = alt[criteriaId] || 0

      // Sütun toplamını hesapla
      const columnSum = Math.sqrt(alternatives.reduce((sum, a) => sum + Math.pow(a[criteriaId] || 0, 2), 0))

      normalizedMatrix[i][j] = columnSum > 0 ? value / columnSum : 0
    })
  })

  // Ağırlıklı normalize edilmiş matris
  const weightedMatrix: number[][] = normalizedMatrix.map((row) =>
    row.map((value, j) => value * (weights[criteriaIds[j]] || 0)),
  )

  // İdeal ve negatif ideal çözümler
  const idealSolution: number[] = []
  const negativeIdealSolution: number[] = []

  criteriaIds.forEach((criteriaId, j) => {
    const column = weightedMatrix.map((row) => row[j])
    const criteriaType = criteriaTypes[criteriaId] || "benefit"

    if (criteriaType === "benefit") {
      idealSolution[j] = Math.max(...column)
      negativeIdealSolution[j] = Math.min(...column)
    } else {
      idealSolution[j] = Math.min(...column)
      negativeIdealSolution[j] = Math.max(...column)
    }
  })

  // Mesafeleri hesapla
  const distances = alternatives.map((_, i) => {
    const positiveDistance = Math.sqrt(
      weightedMatrix[i].reduce((sum, value, j) => sum + Math.pow(value - idealSolution[j], 2), 0),
    )

    const negativeDistance = Math.sqrt(
      weightedMatrix[i].reduce((sum, value, j) => sum + Math.pow(value - negativeIdealSolution[j], 2), 0),
    )

    return { positiveDistance, negativeDistance }
  })

  // Yakınlık katsayıları ve sıralama
  const results = alternatives.map((alt, i) => {
    const { positiveDistance, negativeDistance } = distances[i]
    const closenessCoefficient = negativeDistance / (positiveDistance + negativeDistance) || 0

    return {
      id: alt.id?.toString() || i.toString(),
      name: alt.name?.toString() || `Alternative ${i + 1}`,
      closenessCoefficient,
      rank: 0,
      distanceTraveled: distanceData?.[alt.id?.toString() || i.toString()],
    }
  })

  // Sıralama (yakınlık katsayısına göre, eşitlik durumunda mesafeye göre)
  results.sort((a, b) => {
    const diff = b.closenessCoefficient - a.closenessCoefficient
    if (Math.abs(diff) < 0.0001) {
      // Eşitlik durumunda yapılan kilometre yüksek olan üstte
      return (b.distanceTraveled || 0) - (a.distanceTraveled || 0)
    }
    return diff
  })

  // Sıra numaralarını ata
  results.forEach((result, index) => {
    result.rank = index + 1
  })

  return {
    alternatives: results,
    idealSolution,
    negativeIdealSolution,
    distances,
  }
}
