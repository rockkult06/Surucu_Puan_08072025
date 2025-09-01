// API istemci fonksiyonları

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
  console.log("📤 API: AHP değerlendirmesi kaydediliyor...")

  try {
    const response = await fetch("/api/ahp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(evaluation),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Bilinmeyen hata" }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    console.log("✅ API: AHP değerlendirmesi kaydedildi, ID:", result.id)
    return result.id
  } catch (error) {
    console.error("❌ API: AHP değerlendirmesi kaydetme hatası:", error)
    throw error
  }
}

// Tüm AHP değerlendirmelerini getir
export async function getAllAHPEvaluations(): Promise<AHPEvaluation[]> {
  console.log("📤 API: Tüm AHP değerlendirmeleri getiriliyor...")

  try {
    const response = await fetch("/api/ahp", {
      method: "GET",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Bilinmeyen hata" }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    console.log(`✅ API: ${result.evaluations.length} adet AHP değerlendirmesi getirildi`)
    return result.evaluations
  } catch (error) {
    console.error("❌ API: AHP değerlendirmeleri getirme hatası:", error)
    throw error
  }
}

// Belirli bir AHP değerlendirmesini getir
export async function getAHPEvaluationById(id: string): Promise<AHPEvaluation | null> {
  console.log("📤 API: AHP değerlendirmesi getiriliyor, ID:", id)

  try {
    const response = await fetch(`/api/ahp?id=${id}`, {
      method: "GET",
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.log("⚠️ API: AHP değerlendirmesi bulunamadı, ID:", id)
        return null
      }
      const errorData = await response.json().catch(() => ({ error: "Bilinmeyen hata" }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    console.log("✅ API: AHP değerlendirmesi getirildi, ID:", id)
    return result.evaluation
  } catch (error) {
    console.error("❌ API: AHP değerlendirmesi getirme hatası:", error)
    throw error
  }
}

// Kullanıcıya göre AHP değerlendirmesi getir
export async function getAHPEvaluationByUser(userName: string): Promise<AHPEvaluation | null> {
  console.log("📤 API: Kullanıcı AHP değerlendirmesi getiriliyor, User:", userName)

  try {
    const response = await fetch(`/api/ahp?user=${encodeURIComponent(userName)}`, {
      method: "GET",
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.log("⚠️ API: Kullanıcı AHP değerlendirmesi bulunamadı, User:", userName)
        return null
      }
      const errorData = await response.json().catch(() => ({ error: "Bilinmeyen hata" }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    console.log("✅ API: Kullanıcı AHP değerlendirmesi getirildi, User:", userName)
    return result.evaluation
  } catch (error) {
    console.error("❌ API: Kullanıcı AHP değerlendirmesi getirme hatası:", error)
    throw error
  }
}

// AHP değerlendirmesini sil
export async function deleteAHPEvaluation(id: string): Promise<boolean> {
  console.log("📤 API: AHP değerlendirmesi siliniyor, ID:", id)

  try {
    const response = await fetch("/api/ahp", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Bilinmeyen hata" }))
      console.error("❌ API: Silme işlemi başarısız:", errorData.error)
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    console.log("✅ API: AHP değerlendirmesi silindi, ID:", id, "Başarı durumu:", result.success)
    return result.success
  } catch (error) {
    console.error("❌ API: AHP değerlendirmesi silme hatası:", error)
    return false
  }
}

// Birden fazla AHP değerlendirmesini sil
export async function deleteMultipleAHPEvaluations(ids: string[]): Promise<boolean> {
  console.log("📤 API: Birden fazla AHP değerlendirmesi siliniyor, ID'ler:", ids)

  try {
    const response = await fetch("/api/ahp", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Bilinmeyen hata" }))
      console.error("❌ API: Toplu silme işlemi başarısız:", errorData.error)
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    console.log("✅ API: Birden fazla AHP değerlendirmesi silindi, Başarı durumu:", result.success)
    return result.success
  } catch (error) {
    console.error("❌ API: Birden fazla AHP değerlendirmesi silme hatası:", error)
    return false
  }
}

// Tüm AHP değerlendirmelerini sil
export async function deleteAllAHPEvaluations(): Promise<boolean> {
  console.log("📤 API: Tüm AHP değerlendirmeleri siliniyor...")

  try {
    const response = await fetch("/api/ahp", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deleteAll: true }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Bilinmeyen hata" }))
      console.error("❌ API: Tümünü silme işlemi başarısız:", errorData.error)
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    console.log("✅ API: Tüm AHP değerlendirmeleri silindi, Başarı durumu:", result.success)
    return result.success
  } catch (error) {
    console.error("❌ API: Tüm AHP değerlendirmeleri silme hatası:", error)
    return false
  }
}

// Ortalama ağırlıkları hesapla
export function calculateAverageWeights(evaluations: AHPEvaluation[]): Record<string, number> {
  console.log(`🧮 calculateAverageWeights çağrıldı - ${evaluations.length} değerlendirme`)

  if (evaluations.length === 0) {
    console.log("⚠️ Değerlendirme yok, boş obje döndürülüyor")
    return {}
  }

  // Her değerlendirmenin veri yapısını kontrol et
  evaluations.forEach((evaluation, index) => {
    console.log(`📋 Değerlendirme ${index + 1}:`)
    console.log(`  - ID: ${evaluation.id}`)
    console.log(`  - User: ${evaluation.user_name}`)
    console.log(`  - global_weights tipi: ${typeof evaluation.global_weights}`)
    console.log(`  - global_weights: ${JSON.stringify(evaluation.global_weights)}`)
    console.log(`  - global_weights keys: ${Object.keys(evaluation.global_weights || {}).join(", ")}`)
    console.log(`  - global_weights null/undefined kontrolü: ${evaluation.global_weights === null}, ${evaluation.global_weights === undefined}`)
    console.log(`  - global_weights boş obje kontrolü: ${Object.keys(evaluation.global_weights || {}).length === 0}`)
    if (evaluation.global_weights && typeof evaluation.global_weights === "object") {
      console.log(`  - global_weights değerleri:`)
      Object.entries(evaluation.global_weights).forEach(([key, value]) => {
        console.log(`    * ${key}: ${value} (tip: ${typeof value})`)
      })
    }
  })

  // Tüm kriterleri topla
  const allCriteria = new Set<string>()
  evaluations.forEach((evaluation) => {
    if (evaluation.global_weights && typeof evaluation.global_weights === "object") {
      Object.keys(evaluation.global_weights).forEach((criterion) => {
        allCriteria.add(criterion)
      })
    }
  })

  console.log(`📊 Bulunan toplam kriter sayısı: ${allCriteria.size}`)
  console.log(`🔍 Kriterler: ${Array.from(allCriteria).join(", ")}`)

  // Her kriter için ortalama hesapla
  const averageWeights: Record<string, number> = {}

  allCriteria.forEach((criterion) => {
    const weights = evaluations
      .map((evaluation) => {
        const weight = evaluation.global_weights?.[criterion]
        console.log(`  - ${evaluation.user_name} için ${criterion}: ${weight} (tip: ${typeof weight})`)
        return typeof weight === "number" ? weight : 0
      })
      .filter((weight) => weight > 0) // Sıfır olmayan ağırlıkları al

    if (weights.length > 0) {
      const average = weights.reduce((sum, weight) => sum + weight, 0) / weights.length
      averageWeights[criterion] = average
      console.log(`✅ ${criterion}: ${weights.length} değer, ortalama: ${average}`)
    } else {
      averageWeights[criterion] = 0
      console.log(`⚠️ ${criterion}: Geçerli değer yok, 0 atandı`)
    }
  })

  console.log("✅ Final ortalama ağırlıklar:", averageWeights)
  console.log("📊 Sıfır olmayan ağırlık sayısı:", Object.values(averageWeights).filter((w) => w > 0).length)

  return averageWeights
}
