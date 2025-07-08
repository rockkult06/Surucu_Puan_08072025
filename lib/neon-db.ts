import { neon } from "@neondatabase/serverless"

/* ------------------------------------------------------------------ */
/*  Neon connection (or in-memory fallback)                           */
/* ------------------------------------------------------------------ */
let sql: ReturnType<typeof neon> | null = null
let neonReady = false

try {
  if (process.env.DATABASE_URL) {
    sql = neon(process.env.DATABASE_URL)
    neonReady = true
  }
} catch {
  neonReady = false
}

/* ------------------------------------------------------------------ */
/*  One-time table creation promise                                   */
/* ------------------------------------------------------------------ */
async function createTables() {
  if (!neonReady) return // in-memory mode

  try {
    // Create table first
    await sql!`
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
    await sql!`
      CREATE INDEX IF NOT EXISTS idx_ahp_evaluations_user_name
      ON ahp_evaluations(user_name)
    `

    await sql!`
      CREATE INDEX IF NOT EXISTS idx_ahp_evaluations_updated_at
      ON ahp_evaluations(updated_at)
    `

    console.log("Neon: ahp_evaluations table ready")
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
  await initPromise // retained for backward compatibility
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

    const existing = await sql!`
      SELECT id FROM ahp_evaluations WHERE user_name = ${userName}
    `

    if (existing.length) {
      const res = await sql!`
        UPDATE ahp_evaluations SET
          criteria_weights   = ${criteriaWeights},
          global_weights     = ${globalWeights},
          consistency_results= ${consistencyResults},
          hierarchy_data     = ${hierarchyData},
          updated_at         = ${now}
        WHERE user_name      = ${userName}
        RETURNING *
      `
      return parse(res[0])
    }

    const res = await sql!`
      INSERT INTO ahp_evaluations (
        id, user_name, criteria_weights, global_weights,
        consistency_results, hierarchy_data, created_at, updated_at
      ) VALUES (
        ${generateId()}, ${userName}, ${criteriaWeights}, ${globalWeights},
        ${consistencyResults}, ${hierarchyData}, ${now}, ${now}
      )
      RETURNING *
    `
    return parse(res[0])
  } catch (error) {
    console.error("AHP kaydetme hatası:", error)
    throw error
  }
}

/* READ - all */
export async function getAllAHPEvaluations(): Promise<AHPEvaluation[]> {
  if (!neonReady) return mem

  try {
    await initPromise
    const res = await sql!`SELECT * FROM ahp_evaluations ORDER BY updated_at DESC`
    return res.map(parse)
  } catch (error) {
    console.error("AHP verilerini getirme hatası:", error)
    throw error
  }
}

/* READ - by user */
export async function getAHPEvaluationByUser(userName: string): Promise<AHPEvaluation | null> {
  if (!neonReady) return memFindByUser(userName)

  try {
    await initPromise
    const res = await sql!`SELECT * FROM ahp_evaluations WHERE user_name = ${userName}`
    return res.length ? parse(res[0]) : null
  } catch (error) {
    console.error("Kullanıcı AHP verisi getirme hatası:", error)
    throw error
  }
}

/* DELETE single */
export async function deleteAHPEvaluation(id: string): Promise<boolean> {
  if (!neonReady) {
    const i = mem.findIndex((e) => e.id === id)
    if (i !== -1) mem.splice(i, 1)
    return true
  }

  try {
    await initPromise
    await sql!`DELETE FROM ahp_evaluations WHERE id = ${id}`
    return true
  } catch (error) {
    console.error("Silme hatası:", error)
    return false
  }
}

/* DELETE multiple */
export async function deleteMultipleAHPEvaluations(evaluationIds: string[]): Promise<boolean> {
  if (!neonReady) {
    evaluationIds.forEach((id) => {
      const i = mem.findIndex((r) => r.id === id)
      if (i !== -1) mem.splice(i, 1)
    })
    return true
  }

  try {
    if (evaluationIds.length === 0) return true
    await initPromise
    await sql!`DELETE FROM ahp_evaluations WHERE id = ANY(${evaluationIds})`
    return true
  } catch (error) {
    console.error("Toplu silme hatası:", error)
    return false
  }
}

/* DELETE all */
export async function deleteAllAHPEvaluations(): Promise<boolean> {
  if (!neonReady) {
    mem.length = 0
    return true
  }

  try {
    await initPromise
    await sql!`DELETE FROM ahp_evaluations`
    return true
  } catch (error) {
    console.error("Tümünü silme hatası:", error)
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
    }
  } catch (error) {
    console.error("İstatistik alma hatası:", error)
    return {
      totalEvaluations: 0,
      lastUpdated: null,
    }
  }
}

/* Database connection check */
export async function checkDatabaseConnection(): Promise<boolean> {
  return neonReady
}

/* ------------------------------------------------------------------ */
/*  Utility                                                           */
/* ------------------------------------------------------------------ */
function parse(row: any): AHPEvaluation {
  const safe = (v: any) =>
    typeof v === "string"
      ? (() => {
          try {
            return JSON.parse(v)
          } catch {
            return v
          }
        })()
      : v

  return {
    id: row.id,
    user_name: row.user_name,
    criteria_weights: safe(row.criteria_weights),
    global_weights: safe(row.global_weights),
    consistency_results: safe(row.consistency_results),
    hierarchy_data: safe(row.hierarchy_data),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
