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

const API_BASE = "/api/ahp"

// Enhanced error handling
class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: any,
  ) {
    super(message)
    this.name = "APIError"
  }
}

async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type")

  if (!contentType?.includes("application/json")) {
    throw new APIError(`Expected JSON response, got ${contentType}`, response.status, {
      url: response.url,
      status: response.status,
    })
  }

  const data = await response.json()

  if (!response.ok) {
    console.error("API Error Response:", {
      status: response.status,
      statusText: response.statusText,
      data,
      url: response.url,
    })

    throw new APIError(data.error || `HTTP ${response.status}: ${response.statusText}`, response.status, data.details)
  }

  if (!data.success) {
    console.error("API Logic Error:", data)
    throw new APIError(data.error || "API request failed", response.status, data.details)
  }

  return data
}

export async function saveAHPEvaluation(
  userName: string,
  criteriaWeights: Record<string, number>,
  globalWeights: Record<string, number>,
  consistencyResults: Record<string, any>,
  hierarchyData: Record<string, number[][]>,
): Promise<AHPEvaluation> {
  console.log("API Client: Saving AHP evaluation for user:", userName)

  try {
    const response = await fetch(API_BASE, {
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

    const data = await handleResponse(response)
    console.log("API Client: Save successful")
    return data.data
  } catch (error) {
    console.error("API Client: Save failed:", error)
    throw error
  }
}

export async function getAllAHPEvaluations(): Promise<AHPEvaluation[]> {
  console.log("API Client: Fetching all AHP evaluations")

  try {
    const response = await fetch(`${API_BASE}?action=getAll`, {
      method: "GET",
      cache: "no-store",
    })

    const data = await handleResponse(response)
    console.log(`API Client: Fetched ${data.data.length} evaluations`)
    return data.data
  } catch (error) {
    console.error("API Client: Fetch all failed:", error)
    throw error
  }
}

export async function getAHPEvaluationByUser(userName: string): Promise<AHPEvaluation | null> {
  console.log("API Client: Fetching AHP evaluation for user:", userName)

  try {
    const response = await fetch(`${API_BASE}?action=getByUser&userName=${encodeURIComponent(userName)}`, {
      method: "GET",
      cache: "no-store",
    })

    const data = await handleResponse(response)
    console.log("API Client: User evaluation fetch successful")
    return data.data
  } catch (error) {
    console.error("API Client: User evaluation fetch failed:", error)
    throw error
  }
}

export async function deleteAHPEvaluation(id: string): Promise<boolean> {
  console.log("API Client: Deleting single AHP evaluation:", id)

  try {
    const response = await fetch(`${API_BASE}?action=single&id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    })

    const data = await handleResponse(response)
    console.log("API Client: Single delete result:", data.success)
    return data.success
  } catch (error) {
    console.error("API Client: Single delete failed:", error)
    throw error
  }
}

export async function deleteMultipleAHPEvaluations(evaluationIds: string[]): Promise<boolean> {
  console.log("API Client: Deleting multiple AHP evaluations:", evaluationIds.length, "items")

  try {
    const idsParam = JSON.stringify(evaluationIds)
    const response = await fetch(`${API_BASE}?action=multiple&ids=${encodeURIComponent(idsParam)}`, {
      method: "DELETE",
    })

    const data = await handleResponse(response)
    console.log("API Client: Multiple delete result:", data.success)
    return data.success
  } catch (error) {
    console.error("API Client: Multiple delete failed:", error)
    throw error
  }
}

export async function deleteAllAHPEvaluations(): Promise<boolean> {
  console.log("API Client: Deleting all AHP evaluations")

  try {
    const response = await fetch(`${API_BASE}?action=all`, {
      method: "DELETE",
    })

    const data = await handleResponse(response)
    console.log("API Client: Delete all result:", data.success)
    return data.success
  } catch (error) {
    console.error("API Client: Delete all failed:", error)
    throw error
  }
}

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

export async function getStorageStats() {
  console.log("API Client: Fetching storage stats")

  try {
    const response = await fetch(`${API_BASE}?action=stats`, {
      method: "GET",
      cache: "no-store",
    })

    const data = await handleResponse(response)
    console.log("API Client: Storage stats fetched successfully")
    return data.data
  } catch (error) {
    console.error("API Client: Storage stats fetch failed:", error)
    throw error
  }
}
