import { type NextRequest, NextResponse } from "next/server"
import {
  saveAHPEvaluation,
  getAllAHPEvaluations,
  getAHPEvaluationByUser,
  deleteAHPEvaluation,
  deleteMultipleAHPEvaluations,
  deleteAllAHPEvaluations,
  initializeDatabase,
} from "@/lib/neon-db"

// Veritabanını başlat
initializeDatabase().catch(console.error)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userName, criteriaWeights, globalWeights, consistencyResults, hierarchyData } = body

    if (!userName || !criteriaWeights || !globalWeights || !consistencyResults || !hierarchyData) {
      return NextResponse.json({ error: "Eksik parametreler" }, { status: 400 })
    }

    const result = await saveAHPEvaluation(userName, criteriaWeights, globalWeights, consistencyResults, hierarchyData)

    return NextResponse.json(result)
  } catch (error) {
    console.error("POST /api/ahp error:", error)
    return NextResponse.json({ error: "Kaydetme hatası" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userName = searchParams.get("user")

    if (userName) {
      const result = await getAHPEvaluationByUser(userName)
      return NextResponse.json(result)
    } else {
      const result = await getAllAHPEvaluations()
      return NextResponse.json(result)
    }
  } catch (error) {
    console.error("GET /api/ahp error:", error)
    return NextResponse.json({ error: "Veri getirme hatası" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const action = searchParams.get("action")

    if (action === "deleteAll") {
      const success = await deleteAllAHPEvaluations()
      return NextResponse.json({ success })
    } else if (action === "deleteMultiple") {
      const body = await request.json()
      const { ids } = body
      if (!ids || !Array.isArray(ids)) {
        return NextResponse.json({ error: "Geçersiz ID listesi" }, { status: 400 })
      }
      const success = await deleteMultipleAHPEvaluations(ids)
      return NextResponse.json({ success })
    } else if (id) {
      const success = await deleteAHPEvaluation(id)
      return NextResponse.json({ success })
    } else {
      return NextResponse.json({ error: "ID veya action parametresi gerekli" }, { status: 400 })
    }
  } catch (error) {
    console.error("DELETE /api/ahp error:", error)
    return NextResponse.json({ error: "Silme hatası" }, { status: 500 })
  }
}
