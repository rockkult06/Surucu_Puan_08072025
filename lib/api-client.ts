// API client functions for AHP evaluations

export interface AHPEvaluation {
  id: number
  user_name: string
  evaluation_date: string
  criteria_weights: Record<string, number>
  global_weights: Record<string, number>
  consistency_results: Record<string, any>
  hierarchy_data: Record<string, number[][]>
}

// Save AHP evaluation
export async function saveAHPEvaluation(
  userName: string,
  criteriaWeights: Record<string, number>,
  globalWeights: Record<string, number>,
  consistencyResults: Record<string, any>,
  hierarchyData: Record<string, number[][]>,
): Promise<void> {
  const response = await fetch("/api/ahp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "save",
      user_name: userName,
      criteria_weights: criteriaWeights,
      global_weights: globalWeights,
      consistency_results: consistencyResults,
      hierarchy_data: hierarchyData,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to save AHP evaluation")
  }
}

// Get AHP evaluation by user
export async function getAHPEvaluationByUser(userName: string): Promise<AHPEvaluation | null> {
  const response = await fetch(`/api/ahp?action=getByUser&user_name=${encodeURIComponent(userName)}`)

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    throw new Error("Failed to fetch AHP evaluation")
  }

  return response.json()
}

// Get all AHP evaluations
export async function getAllAHPEvaluations(): Promise<AHPEvaluation[]> {
  const response = await fetch("/api/ahp?action=getAll")

  if (!response.ok) {
    throw new Error("Failed to fetch AHP evaluations")
  }

  return response.json()
}

// Delete AHP evaluation
export async function deleteAHPEvaluation(id: number): Promise<void> {
  const response = await fetch("/api/ahp", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "delete",
      id,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to delete AHP evaluation")
  }
}

// Delete multiple AHP evaluations
export async function deleteMultipleAHPEvaluations(ids: number[]): Promise<void> {
  const response = await fetch("/api/ahp", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "deleteMultiple",
      ids,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to delete AHP evaluations")
  }
}

// Delete all AHP evaluations
export async function deleteAllAHPEvaluations(): Promise<void> {
  const response = await fetch("/api/ahp", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "deleteAll",
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to delete all AHP evaluations")
  }
}

// Calculate average weights from selected evaluations
export async function calculateAverageWeights(selectedEvaluationIds: number[]): Promise<Record<string, number>> {
  const response = await fetch("/api/ahp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "calculateAverage",
      evaluation_ids: selectedEvaluationIds,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to calculate average weights")
  }

  const result = await response.json()
  return result.averageWeights || {}
}
