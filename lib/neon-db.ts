import { neon } from "@neondatabase/serverless"

/* ------------------------------------------------------------------ */
/*  Neon connection (or in-memory fallback)                           */
/* ------------------------------------------------------------------ */
let sql: ReturnType<typeof neon> | null = null
let neonReady = false
let connectionError: string | null = null

// DATABASE_URL validation
function validateDatabaseUrl(url: string): boolean {
  try {
    // Neon URL should start with postgresql:// or postgres://
    if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
      return false
    }

    // Basic URL validation
    const urlObj = new URL(url)
    return urlObj.hostname && urlObj.pathname
  } catch {
    return false
  }
}

try {
  if (process.env.DATABASE_URL) {
    console.log("DATABASE_URL found, validating...")

    if (!validateDatabaseUrl(process.env.DATABASE_URL)) {
      throw new Error("Invalid DATABASE_URL format. Expected postgresql:// or postgres:// URL")
    }

    console.log("DATABASE_URL is valid, creating Neon connection...")
    sql = neon(process.env.DATABASE_URL)
    neonReady = true
    console.log("Neon connection created successfully")
  } else {
    console.log("No DATABASE_URL found, using in-memory storage")
    connectionError = "DATABASE_URL environment variable not found"
  }
} catch (e) {
  console.error("Neon connection initialization error:", e)
  connectionError = e instanceof Error ? e.message : "Unknown connection error"
  neonReady = false
}

/* ------------------------------------------------------------------ */
/*  One-time table creation promise                                   */
/* ------------------------------------------------------------------ */
async function createTables() {
  if (!neonReady || !sql) {
    console.log("Skipping table creation - Neon not ready")
    return
  }

  try {
    console.log("Creating tables if they don't exist...")

    // Create table first
    await sql`
      CREATE TABLE IF NOT EXISTS ahp_evaluations (
        id TEXT PRIMARY KEY,
        user_name TEXT NOT NULL,
        criteria_weights JSONB NOT NULL,
        global_weights JSONB NOT NULL,
        consistency_results JSONB NOT NULL,
        hierarchy_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create indexes separately
    await sql`
      CREATE INDEX IF NOT EXISTS idx_ahp_evaluations_user_name
      ON ahp_evaluations(user_name)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_ahp_evaluations_updated_at
      ON ahp_evaluations(updated_at)
    `

    console.log("Neon: ahp_evaluations table and indexes created successfully")
  } catch (error) {
    console.error("Table creation error:", error)
    throw error
  }
}

const initPromise: Promise<void> = neonReady ? createTables() : Promise.resolve()

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  In-memory storage (used when Neon isn't configured)               */
/* ------------------------------------------------------------------ */
const mem: AHPEvaluation[] = []
const memFindByUser = (u: string) => mem.find((e) => e.user_name === u) ?? null
const memSave = (row: AHPEvaluation) => {
  const i = mem.findIndex((e) => e.user_name === row.user_name)
  i === -1 ? mem.push(row) : (mem[i] = row)
  return row
}

/* ------------------------------------------------------------------ */
/*  Public helpers                                                    */
/* ------------------------------------------------------------------ */
export async function initializeDatabase() {
  try {
    await initPromise
    console.log("Database initialization completed")
  } catch (error) {
    console.error("Database initialization failed:", error)
    throw error
  }
}

/* CREATE / UPDATE (upsert by user) */
export async function saveAHPEvaluation(
  userName: string,
  criteriaWeights: Record<string, number>,
  globalWeights: Record<string, number>,
  consistencyResults: Record<string, any>,
  hierarchyData: Record<string, number[][]>,
): Promise<AHPEvaluation> {
  const now = new Date().toISOString()

  /* In-memory mode -------------------------------------------------- */
  if (!neonReady) {
    console.log(`Neon DB not ready (${connectionError}), saving to in-memory for user: ${userName}`)
    const row: AHPEvaluation = {
      id: generateId(),
      user_name: userName,
      criteria_weights: criteriaWeights,
      global_weights: globalWeights,
      consistency_results: consistencyResults,
      hierarchy_data: hierarchyData,
      created_at: now,
      updated_at: now,
    }
    return memSave(row)
  }

  /* Neon mode ------------------------------------------------------- */
  try {
    await initPromise

    console.log(`Checking for existing evaluation for user: ${userName}`)
    const existing = await sql!`
      SELECT id FROM ahp_evaluations WHERE user_name = ${userName}
    `

    if (existing.length) {
      console.log(`Updating existing evaluation for user: ${userName}`)
      const res = await sql!`
        UPDATE ahp_evaluations SET
          criteria_weights   = ${JSON.stringify(criteriaWeights)},
          global_weights     = ${JSON.stringify(globalWeights)},
          consistency_results= ${JSON.stringify(consistencyResults)},
          hierarchy_data     = ${JSON.stringify(hierarchyData)},
          updated_at         = ${now}
        WHERE user_name      = ${userName}
        RETURNING *
      `
      console.log(`Neon: Updated evaluation for user ${userName}`)
      return parseRow(res[0])
    }

    console.log(`Creating new evaluation for user: ${userName}`)
    const res = await sql!`
      INSERT INTO ahp_evaluations (
        id, user_name, criteria_weights, global_weights,
        consistency_results, hierarchy_data, created_at, updated_at
      ) VALUES (
        ${generateId()}, ${userName}, ${JSON.stringify(criteriaWeights)}, ${JSON.stringify(globalWeights)},
        ${JSON.stringify(consistencyResults)}, ${JSON.stringify(hierarchyData)}, ${now}, ${now}
      )
      RETURNING *
    `
    console.log(`Neon: Inserted new evaluation for user ${userName}`)
    return parseRow(res[0])
  } catch (error) {
    console.error("AHP kaydetme hatası:", error)
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      userName,
      connectionError,
    })
    throw error
  }
}

/* READ - all */
export async function getAllAHPEvaluations(): Promise<AHPEvaluation[]> {
  if (!neonReady) {
    console.log(`Neon DB not ready (${connectionError}), getting all from in-memory. Count: ${mem.length}`)
    return [...mem] // Return a copy to avoid mutations
  }

  try {
    await initPromise
    console.log("Fetching all evaluations from Neon...")
    const res = await sql!`SELECT * FROM ahp_evaluations ORDER BY updated_at DESC`
    console.log(`Neon: Fetched ${res.length} evaluations`)
    return res.map(parseRow)
  } catch (error) {
    console.error("AHP verilerini getirme hatası:", error)
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      connectionError,
      neonReady,
    })

    // Fallback to in-memory if database fails
    console.log("Falling back to in-memory storage due to database error")
    return [...mem]
  }
}

/* READ - by user */
export async function getAHPEvaluationByUser(userName: string): Promise<AHPEvaluation | null> {
  if (!neonReady) {
    console.log(`Neon DB not ready (${connectionError}), getting by user from in-memory: ${userName}`)
    return memFindByUser(userName)
  }

  try {
    await initPromise
    console.log(`Fetching evaluation for user: ${userName}`)
    const res = await sql!`SELECT * FROM ahp_evaluations WHERE user_name = ${userName}`
    console.log(`Neon: Fetched evaluation for user ${userName}. Found: ${res.length > 0}`)
    return res.length ? parseRow(res[0]) : null
  } catch (error) {
    console.error("Kullanıcı AHP verisi getirme hatası:", error)
    console.error("Error details:", {
      message: error.message,
      userName,
      connectionError,
    })

    // Fallback to in-memory
    return memFindByUser(userName)
  }
}

/* DELETE single */
export async function deleteAHPEvaluation(id: string): Promise<boolean> {
  if (!neonReady) {
    console.log(`Neon DB not ready (${connectionError}), deleting from in-memory: ${id}`)
    const i = mem.findIndex((e) => e.id === id)
    if (i !== -1) {
      mem.splice(i, 1)
      console.log(`Deleted from in-memory. Remaining count: ${mem.length}`)
      return true
    }
    console.log("Item not found in in-memory storage")
    return false
  }

  try {
    await initPromise
    console.log(`Deleting evaluation with ID: ${id}`)
    const result = await sql!`DELETE FROM ahp_evaluations WHERE id = ${id} RETURNING id`
    const deleted = result.length > 0
    console.log(`Neon: Delete operation completed. Deleted: ${deleted}`)
    return deleted
  } catch (error) {
    console.error(`Neon: Error deleting single evaluation with ID ${id}:`, error)
    console.error("Error details:", {
      message: error.message,
      id,
      connectionError,
    })
    return false
  }
}

/* DELETE multiple */
export async function deleteMultipleAHPEvaluations(evaluationIds: string[]): Promise<boolean> {
  if (!neonReady) {
    console.log(
      `Neon DB not ready (${connectionError}), deleting multiple from in-memory: ${evaluationIds.length} items`,
    )
    let deletedCount = 0
    evaluationIds.forEach((id) => {
      const i = mem.findIndex((r) => r.id === id)
      if (i !== -1) {
        mem.splice(i, 1)
        deletedCount++
      }
    })
    console.log(`Deleted ${deletedCount} items from in-memory. Remaining count: ${mem.length}`)
    return deletedCount > 0
  }

  try {
    if (evaluationIds.length === 0) {
      console.log("Neon: No evaluation IDs provided for multiple delete")
      return true
    }

    await initPromise
    console.log(`Deleting multiple evaluations: ${evaluationIds.length} items`)
    const result = await sql!`DELETE FROM ahp_evaluations WHERE id = ANY(${evaluationIds}) RETURNING id`
    const deletedCount = result.length
    console.log(`Neon: Deleted ${deletedCount} out of ${evaluationIds.length} evaluations`)
    return deletedCount > 0
  } catch (error) {
    console.error(`Neon: Error deleting multiple evaluations:`, error)
    console.error("Error details:", {
      message: error.message,
      evaluationIds,
      connectionError,
    })
    return false
  }
}

/* DELETE all */
export async function deleteAllAHPEvaluations(): Promise<boolean> {
  if (!neonReady) {
    console.log(`Neon DB not ready (${connectionError}), deleting all from in-memory`)
    const previousCount = mem.length
    mem.length = 0
    console.log(`Deleted all ${previousCount} items from in-memory`)
    return true
  }

  try {
    await initPromise
    console.log("Deleting all evaluations from Neon...")
    const result = await sql!`DELETE FROM ahp_evaluations RETURNING id`
    const deletedCount = result.length
    console.log(`Neon: Deleted all ${deletedCount} evaluations`)
    return true
  } catch (error) {
    console.error("Neon: Error deleting all evaluations:", error)
    console.error("Error details:", {
      message: error.message,
      connectionError,
    })
    return false
  }
}

/* Calculate average weights */
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

/* Storage stats */
export async function getStorageStats() {
  if (!neonReady) {
    return {
      totalEvaluations: mem.length,
      lastUpdated:
        mem.length > 0
          ? mem.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0].updated_at
          : null,
      storage: "in-memory",
      connectionError,
    }
  }

  try {
    await initPromise
    const result = await sql!`
      SELECT 
        COUNT(*) as total_evaluations,
        MAX(updated_at) as last_updated
      FROM ahp_evaluations
    `

    return {
      totalEvaluations: Number(result[0].total_evaluations),
      lastUpdated: result[0].last_updated,
      storage: "neon",
      connectionError: null,
    }
  } catch (error) {
    console.error("İstatistik alma hatası:", error)
    return {
      totalEvaluations: 0,
      lastUpdated: null,
      storage: "error",
      connectionError: error.message,
    }
  }
}

/* Database connection check */
export async function checkDatabaseConnection(): Promise<boolean> {
  if (!neonReady) {
    console.log(`Database connection check failed: ${connectionError}`)
    return false
  }

  try {
    await initPromise
    // Test the connection with a simple query
    await sql!`SELECT 1 as test`
    console.log("Database connection test successful")
    return true
  } catch (error) {
    console.error("Database connection test failed:", error)
    return false
  }
}

/* ------------------------------------------------------------------ */
/*  Utility                                                           */
/* ------------------------------------------------------------------ */
function parseRow(row: any): AHPEvaluation {
  const safeJsonParse = (value: any, fallback: any = {}) => {
    if (typeof value === "object" && value !== null) {
      return value // Already parsed
    }

    if (typeof value === "string") {
      try {
        return JSON.parse(value)
      } catch (error) {
        console.error("JSON parse error for value:", value, error)
        return fallback
      }
    }

    return fallback
  }

  return {
    id: row.id,
    user_name: row.user_name,
    criteria_weights: safeJsonParse(row.criteria_weights, {}),
    global_weights: safeJsonParse(row.global_weights, {}),
    consistency_results: safeJsonParse(row.consistency_results, {}),
    hierarchy_data: safeJsonParse(row.hierarchy_data, {}),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// Export connection status for debugging
export function getConnectionStatus() {
  return {
    neonReady,
    connectionError,
    hasEnvironmentUrl: !!process.env.DATABASE_URL,
    urlValid: process.env.DATABASE_URL ? validateDatabaseUrl(process.env.DATABASE_URL) : false,
  }
}
