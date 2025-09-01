import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")
  const id = searchParams.get("id")
  const user = searchParams.get("user")

  console.log("📤 GET isteği alındı:", { action, id, user })

  try {
    // Test connection endpoint
    if (action === "test-connection") {
      console.log("🔍 Veritabanı bağlantısı test ediliyor...")
      await sql`SELECT 1`
      console.log("✅ Veritabanı bağlantısı başarılı")
      return NextResponse.json({ success: true, message: "Database connection successful" })
    }

    // Get evaluation by user name
    if (user) {
      console.log("📤 Kullanıcı değerlendirmesi getiriliyor, User:", user)
      const result = await sql`
        SELECT * FROM ahp_evaluations 
        WHERE user_name = ${user}
        ORDER BY updated_at DESC
        LIMIT 1
      `

      if (result.length === 0) {
        console.log("⚠️ Kullanıcı değerlendirmesi bulunamadı, User:", user)
        return NextResponse.json({ error: "User evaluation not found" }, { status: 404 })
      }

      const evaluation = result[0]
      console.log("✅ Kullanıcı değerlendirmesi bulundu:", evaluation.user_name)

      return NextResponse.json({
        evaluation: {
          id: evaluation.id,
          user_name: evaluation.user_name,
          comparison_matrices: evaluation.comparison_matrices,
          local_weights: evaluation.local_weights,
          global_weights: evaluation.global_weights,
          consistency_results: evaluation.consistency_results,
          created_at: evaluation.created_at,
          updated_at: evaluation.updated_at,
        },
      })
    }

    // Get specific evaluation by ID
    if (id) {
      console.log("📤 Belirli değerlendirme getiriliyor, ID:", id)
      const result = await sql`
        SELECT * FROM ahp_evaluations 
        WHERE id = ${id}
      `

      if (result.length === 0) {
        console.log("⚠️ Değerlendirme bulunamadı, ID:", id)
        return NextResponse.json({ error: "Evaluation not found" }, { status: 404 })
      }

      const evaluation = result[0]
      console.log("✅ Değerlendirme bulundu:", evaluation.user_name)

      return NextResponse.json({
        evaluation: {
          id: evaluation.id,
          user_name: evaluation.user_name,
          comparison_matrices: evaluation.comparison_matrices,
          local_weights: evaluation.local_weights,
          global_weights: evaluation.global_weights,
          consistency_results: evaluation.consistency_results,
          created_at: evaluation.created_at,
          updated_at: evaluation.updated_at,
        },
      })
    }

    // Get all evaluations
    console.log("📤 Tüm değerlendirmeler getiriliyor...")
    const result = await sql`
      SELECT * FROM ahp_evaluations 
      ORDER BY updated_at DESC
    `

    console.log("✅ Toplam değerlendirme sayısı:", result.length)

    const evaluations = result.map((row: any) => ({
      id: row.id,
      user_name: row.user_name,
      comparison_matrices: row.comparison_matrices,
      local_weights: row.local_weights,
      global_weights: row.global_weights,
      consistency_results: row.consistency_results,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))

    return NextResponse.json({ evaluations })
  } catch (error) {
    console.error("❌ GET işlemi hatası:", error)
    return NextResponse.json(
      { error: "Database operation failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📤 POST isteği alındı, kullanıcı:", body.user_name)

    const { user_name, comparison_matrices, local_weights, global_weights, consistency_results } = body

    if (!user_name || !comparison_matrices || !local_weights || !global_weights || !consistency_results) {
      console.log("❌ Eksik veri:", {
        user_name: !!user_name,
        comparison_matrices: !!comparison_matrices,
        local_weights: !!local_weights,
        global_weights: !!global_weights,
        consistency_results: !!consistency_results,
      })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already has an evaluation
    console.log("🔍 Mevcut değerlendirme kontrol ediliyor...")
    const existingResult = await sql`
      SELECT id FROM ahp_evaluations 
      WHERE user_name = ${user_name}
    `

    if (existingResult.length > 0) {
      // Update existing evaluation
      const evaluationId = existingResult[0].id
      console.log("🔄 Mevcut değerlendirme güncelleniyor, ID:", evaluationId)

      await sql`
        UPDATE ahp_evaluations 
        SET 
          comparison_matrices = ${JSON.stringify(comparison_matrices)},
          local_weights = ${JSON.stringify(local_weights)},
          global_weights = ${JSON.stringify(global_weights)},
          consistency_results = ${JSON.stringify(consistency_results)},
          updated_at = NOW()
        WHERE id = ${evaluationId}
      `

      console.log("✅ Değerlendirme güncellendi, ID:", evaluationId)
      return NextResponse.json({ id: evaluationId, message: "Evaluation updated successfully" })
    } else {
      // Create new evaluation
      console.log("➕ Yeni değerlendirme oluşturuluyor...")

      const result = await sql`
        INSERT INTO ahp_evaluations (
          user_name, 
          comparison_matrices, 
          local_weights, 
          global_weights, 
          consistency_results,
          created_at,
          updated_at
        ) 
        VALUES (
          ${user_name}, 
          ${JSON.stringify(comparison_matrices)}, 
          ${JSON.stringify(local_weights)}, 
          ${JSON.stringify(global_weights)}, 
          ${JSON.stringify(consistency_results)},
          NOW(),
          NOW()
        )
        RETURNING id
      `

      const evaluationId = result[0].id
      console.log("✅ Yeni değerlendirme oluşturuldu, ID:", evaluationId)
      return NextResponse.json({ id: evaluationId, message: "Evaluation created successfully" })
    }
  } catch (error) {
    console.error("❌ POST işlemi hatası:", error)
    return NextResponse.json(
      { error: "Failed to save evaluation", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📤 DELETE isteği alındı:", body)

    // Delete all evaluations
    if (body.deleteAll) {
      console.log("🗑️ Tüm değerlendirmeler siliniyor...")
      const result = await sql`DELETE FROM ahp_evaluations`
      console.log("✅ Tüm değerlendirmeler silindi, etkilenen satır:", result.length)
      return NextResponse.json({ success: true, message: "All evaluations deleted successfully" })
    }

    // Delete multiple evaluations
    if (body.ids && Array.isArray(body.ids)) {
      console.log("🗑️ Birden fazla değerlendirme siliniyor, ID'ler:", body.ids)
      const result = await sql`
        DELETE FROM ahp_evaluations 
        WHERE id = ANY(${body.ids})
      `
      console.log("✅ Birden fazla değerlendirme silindi, etkilenen satır:", result.length)
      return NextResponse.json({ success: true, message: `${result.length} evaluations deleted successfully` })
    }

    // Delete single evaluation
    if (body.id) {
      console.log("🗑️ Tek değerlendirme siliniyor, ID:", body.id)
      const result = await sql`
        DELETE FROM ahp_evaluations 
        WHERE id = ${body.id}
      `

      if (result.length === 0) {
        console.log("⚠️ Silinecek değerlendirme bulunamadı, ID:", body.id)
        return NextResponse.json({ error: "Evaluation not found" }, { status: 404 })
      }

      console.log("✅ Değerlendirme silindi, ID:", body.id)
      return NextResponse.json({ success: true, message: "Evaluation deleted successfully" })
    }

    console.log("❌ Geçersiz silme isteği")
    return NextResponse.json({ error: "Invalid delete request" }, { status: 400 })
  } catch (error) {
    console.error("❌ DELETE işlemi hatası:", error)
    return NextResponse.json(
      { error: "Failed to delete evaluation", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
