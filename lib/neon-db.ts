import { neon } from "@neondatabase/serverless"

// Veritabanı bağlantısı
const sql = neon(process.env.DATABASE_URL!)

// Veritabanı başlatma promise'i
let initPromise: Promise<void> | null = null

// AHP değerlendirme tablosunu oluştur
async function initDatabase() {
  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    try {
      console.log("🔄 Veritabanı tabloları kontrol ediliyor...")

      // AHP değerlendirmeleri tablosunu oluştur
      await sql`
        CREATE TABLE IF NOT EXISTS ahp_evaluations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_name TEXT NOT NULL,
          comparison_matrices JSONB NOT NULL,
          local_weights JSONB NOT NULL,
          global_weights JSONB NOT NULL,
          consistency_results JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `

      console.log("✅ Veritabanı tabloları hazır")
    } catch (error) {
      console.error("❌ Veritabanı başlatma hatası:", error)
      throw error
    }
  })()

  return initPromise
}

// Veritabanı bağlantısını kontrol et
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // İlk olarak init işleminin tamamlanmasını bekle
    await initDatabase()

    // Basit bir sorgu ile bağlantıyı test et
    await sql`SELECT 1`
    console.log("✅ Veritabanı bağlantısı başarılı")
    return true
  } catch (error) {
    console.error("❌ Veritabanı bağlantı hatası:", error)
    return false
  }
}

// AHP değerlendirme tipi
export interface AHPEvaluation {
  id: string
  user_name: string
  comparison_matrices: Record<string, number[][]>
  local_weights: Record<string, Record<string, number>>
  global_weights: Record<string, number>
  consistency_results: Record<string, { cr: number; isConsistent: boolean }>
  created_at: string
  updated_at: string
}

// Yeni AHP değerlendirmesi kaydet
export async function saveAHPEvaluation(
  evaluation: Omit<AHPEvaluation, "id" | "created_at" | "updated_at">,
): Promise<string> {
  await initDatabase()

  console.log("💾 AHP değerlendirmesi kaydediliyor:", evaluation.user_name)

  try {
    const result = await sql`
      INSERT INTO ahp_evaluations (
        user_name, 
        comparison_matrices, 
        local_weights, 
        global_weights, 
        consistency_results
      )
      VALUES (
        ${evaluation.user_name},
        ${JSON.stringify(evaluation.comparison_matrices)},
        ${JSON.stringify(evaluation.local_weights)},
        ${JSON.stringify(evaluation.global_weights)},
        ${JSON.stringify(evaluation.consistency_results)}
      )
      RETURNING id
    `

    const id = result[0].id
    console.log("✅ AHP değerlendirmesi kaydedildi, ID:", id)
    return id
  } catch (error) {
    console.error("❌ AHP değerlendirmesi kaydetme hatası:", error)
    throw error
  }
}

// Tüm AHP değerlendirmelerini getir
export async function getAllAHPEvaluations(): Promise<AHPEvaluation[]> {
  await initDatabase()

  console.log("📋 Tüm AHP değerlendirmeleri getiriliyor...")

  try {
    const result = await sql`
      SELECT * FROM ahp_evaluations 
      ORDER BY updated_at DESC
    `

    console.log(`✅ ${result.length} adet AHP değerlendirmesi getirildi`)
    return result as AHPEvaluation[]
  } catch (error) {
    console.error("❌ AHP değerlendirmeleri getirme hatası:", error)
    throw error
  }
}

// Belirli bir AHP değerlendirmesini getir
export async function getAHPEvaluationById(id: string): Promise<AHPEvaluation | null> {
  await initDatabase()

  console.log("🔍 AHP değerlendirmesi getiriliyor, ID:", id)

  try {
    const result = await sql`
      SELECT * FROM ahp_evaluations 
      WHERE id = ${id}
    `

    if (result.length === 0) {
      console.log("⚠️ AHP değerlendirmesi bulunamadı, ID:", id)
      return null
    }

    console.log("✅ AHP değerlendirmesi getirildi, ID:", id)
    return result[0] as AHPEvaluation
  } catch (error) {
    console.error("❌ AHP değerlendirmesi getirme hatası:", error)
    throw error
  }
}

// AHP değerlendirmesini güncelle
export async function updateAHPEvaluation(
  id: string,
  evaluation: Partial<Omit<AHPEvaluation, "id" | "created_at" | "updated_at">>,
): Promise<boolean> {
  await initDatabase()

  console.log("🔄 AHP değerlendirmesi güncelleniyor, ID:", id)

  try {
    const result = await sql`
      UPDATE ahp_evaluations 
      SET 
        user_name = COALESCE(${evaluation.user_name}, user_name),
        comparison_matrices = COALESCE(${evaluation.comparison_matrices ? JSON.stringify(evaluation.comparison_matrices) : null}, comparison_matrices),
        local_weights = COALESCE(${evaluation.local_weights ? JSON.stringify(evaluation.local_weights) : null}, local_weights),
        global_weights = COALESCE(${evaluation.global_weights ? JSON.stringify(evaluation.global_weights) : null}, global_weights),
        consistency_results = COALESCE(${evaluation.consistency_results ? JSON.stringify(evaluation.consistency_results) : null}, consistency_results),
        updated_at = NOW()
      WHERE id = ${id}
    `

    console.log("✅ AHP değerlendirmesi güncellendi, ID:", id)
    return true
  } catch (error) {
    console.error("❌ AHP değerlendirmesi güncelleme hatası:", error)
    return false
  }
}

// AHP değerlendirmesini sil
export async function deleteAHPEvaluation(id: string): Promise<boolean> {
  await initDatabase()

  console.log("🗑️ AHP değerlendirmesi siliniyor, ID:", id)

  try {
    const result = await sql`
      DELETE FROM ahp_evaluations 
      WHERE id = ${id}
    `

    console.log("✅ AHP değerlendirmesi silindi, ID:", id, "Etkilenen satır sayısı:", result.length)
    return true
  } catch (error) {
    console.error("❌ AHP değerlendirmesi silme hatası:", error)
    return false
  }
}

// Birden fazla AHP değerlendirmesini sil
export async function deleteMultipleAHPEvaluations(ids: string[]): Promise<boolean> {
  await initDatabase()

  console.log("🗑️ Birden fazla AHP değerlendirmesi siliniyor, ID'ler:", ids)

  try {
    const result = await sql`
      DELETE FROM ahp_evaluations 
      WHERE id = ANY(${ids})
    `

    console.log("✅ Birden fazla AHP değerlendirmesi silindi, Etkilenen satır sayısı:", result.length)
    return true
  } catch (error) {
    console.error("❌ Birden fazla AHP değerlendirmesi silme hatası:", error)
    return false
  }
}

// Tüm AHP değerlendirmelerini sil
export async function deleteAllAHPEvaluations(): Promise<boolean> {
  await initDatabase()

  console.log("🗑️ Tüm AHP değerlendirmeleri siliniyor...")

  try {
    const result = await sql`
      DELETE FROM ahp_evaluations
    `

    console.log("✅ Tüm AHP değerlendirmeleri silindi, Etkilenen satır sayısı:", result.length)
    return true
  } catch (error) {
    console.error("❌ Tüm AHP değerlendirmeleri silme hatası:", error)
    return false
  }
}

// Kullanıcıya göre AHP değerlendirmelerini getir
export async function getAHPEvaluationsByUser(userName: string): Promise<AHPEvaluation[]> {
  await initDatabase()

  console.log("👤 Kullanıcıya göre AHP değerlendirmeleri getiriliyor:", userName)

  try {
    const result = await sql`
      SELECT * FROM ahp_evaluations 
      WHERE user_name = ${userName}
      ORDER BY updated_at DESC
    `

    console.log(`✅ ${result.length} adet AHP değerlendirmesi getirildi (kullanıcı: ${userName})`)
    return result as AHPEvaluation[]
  } catch (error) {
    console.error("❌ Kullanıcıya göre AHP değerlendirmeleri getirme hatası:", error)
    throw error
  }
}
