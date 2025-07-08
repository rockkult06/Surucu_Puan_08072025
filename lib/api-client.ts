// API istemci fonksiyonları

export interface AHPEvaluation {
  id: string
  user_name: string
  criteria_weights: Record<string, number>
  global_weights: Record<string, number>
  consistency_results: Record<string, any>
  hierarchy_data: Record<string, number[][]>
  created_at: string
  updated_at: string
}

// AHP değerlendirmesini kaydet
export async function saveAHPEvaluation(
  userName: string,
  criteriaWeights: Record<string, number>,
  globalWeights: Record<string, number>,
  consistencyResults: Record<string, any>,
  hierarchyData: Record<string, number[][]>,
): Promise<AHPEvaluation> {
  const response = await fetch("/api/ahp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userName,
      criteriaWeights,
      globalWeights,
      consistencyResults,
      hierarchyData,
    }),
  })

  if (!response.ok) {
    throw new Error("Kaydetme hatası")
  }

  return response.json()
}

// Tüm AHP değerlendirmelerini getir
export async function getAllAHPEvaluations(): Promise<AHPEvaluation[]> {
  const response = await fetch("/api/ahp", {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error("Veri getirme hatası")
  }

  return response.json()
}

// Belirli kullanıcının AHP değerlendirmesini getir
export async function getAHPEvaluationByUser(userName: string): Promise<AHPEvaluation | null> {
  const response = await fetch(`/api/ahp?user=${encodeURIComponent(userName)}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error("Kullanıcı verisi getirme hatası")
  }

  return response.json()
}

// Değerlendirmeyi sil
export async function deleteAHPEvaluation(evaluationId: string): Promise<boolean> {
  const response = await fetch(`/api/ahp?id=${evaluationId}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Silme hatası")
  }

  const result = await response.json()
  return result.success
}

// Çoklu değerlendirme silme
export async function deleteMultipleAHPEvaluations(evaluationIds: string[]): Promise<boolean> {
  const response = await fetch("/api/ahp?action=deleteMultiple", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids: evaluationIds }),
  })

  if (!response.ok) {
    throw new Error("Toplu silme hatası")
  }

  const result = await response.json()
  return result.success
}

// Tüm değerlendirmeleri silme
export async function deleteAllAHPEvaluations(): Promise<boolean> {
  const response = await fetch("/api/ahp?action=deleteAll", {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Tümünü silme hatası")
  }

  const result = await response.json()
  return result.success
}

// Seçilen kullanıcıların ağırlıklarının ortalamasını hesapla
export function calculateAverageWeights(evaluations: AHPEvaluation[]): Record<string, number> {
  if (evaluations.length === 0) return {}

  const allWeights = evaluations.map((evaluation) => evaluation.global_weights)
  const criteriaIds = Object.keys(allWeights[0] || {})
  const averageWeights: Record<string, number> = {}

  criteriaIds.forEach((criteriaId) => {
    const weights = allWeights.map((w) => w[criteriaId] || 0)
    averageWeights[criteriaId] = weights.reduce((sum, weight) => sum + weight, 0) / weights.length
  })

  return averageWeights
}
