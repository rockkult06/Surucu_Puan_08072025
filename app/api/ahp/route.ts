import { type NextRequest, NextResponse } from "next/server"
import {
  saveAHPEvaluation,
  getAllAHPEvaluations,
  getAHPEvaluationByUser,
  deleteAHPEvaluation,
  deleteMultipleAHPEvaluations,
  deleteAllAHPEvaluations,
  getStorageStats,
  getConnectionStatus,
} from "@/lib/neon-db"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")
  const userName = searchParams.get("userName")

  console.log("=== GET REQUEST START ===")
  console.log("Action:", action)
  console.log("UserName:", userName)

  try {
    switch (action) {
      case "getAll":
        console.log("Fetching all evaluations...")
        const allEvaluations = await getAllAHPEvaluations()
        console.log(`Found ${allEvaluations.length} evaluations`)
        return NextResponse.json({
          success: true,
          data: allEvaluations,
        })

      case "getByUser":
        if (!userName) {
          return NextResponse.json({ success: false, error: "userName parameter is required" }, { status: 400 })
        }
        console.log(`Fetching evaluation for user: ${userName}`)
        const userEvaluation = await getAHPEvaluationByUser(userName)
        console.log(`User evaluation found: ${!!userEvaluation}`)
        return NextResponse.json({
          success: true,
          data: userEvaluation,
        })

      case "stats":
        console.log("Fetching storage stats...")
        const stats = await getStorageStats()
        const connectionStatus = getConnectionStatus()
        console.log("Stats:", stats)
        console.log("Connection status:", connectionStatus)
        return NextResponse.json({
          success: true,
          data: { ...stats, connectionStatus },
        })

      default:
        console.log("Invalid action or no action specified")
        return NextResponse.json({ success: false, error: "Invalid action parameter" }, { status: 400 })
    }
  } catch (error) {
    console.error("GET request error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: {
          action,
          userName,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 },
    )
  } finally {
    console.log("=== GET REQUEST END ===")
  }
}

export async function POST(request: NextRequest) {
  console.log("=== POST REQUEST START ===")

  try {
    const body = await request.json()
    console.log("Request body keys:", Object.keys(body))

    const { userName, criteriaWeights, globalWeights, consistencyResults, hierarchyData } = body

    // Validation
    if (!userName) {
      console.log("Validation failed: userName is required")
      return NextResponse.json({ success: false, error: "userName is required" }, { status: 400 })
    }

    if (!criteriaWeights || !globalWeights || !consistencyResults || !hierarchyData) {
      console.log("Validation failed: Missing required data")
      return NextResponse.json({ success: false, error: "Missing required evaluation data" }, { status: 400 })
    }

    console.log(`Saving evaluation for user: ${userName}`)
    console.log("Data summary:", {
      criteriaWeightsKeys: Object.keys(criteriaWeights || {}),
      globalWeightsKeys: Object.keys(globalWeights || {}),
      consistencyResultsKeys: Object.keys(consistencyResults || {}),
      hierarchyDataKeys: Object.keys(hierarchyData || {}),
    })

    const savedEvaluation = await saveAHPEvaluation(
      userName,
      criteriaWeights,
      globalWeights,
      consistencyResults,
      hierarchyData,
    )

    console.log("Evaluation saved successfully:", savedEvaluation.id)

    return NextResponse.json({
      success: true,
      data: savedEvaluation,
    })
  } catch (error) {
    console.error("POST request error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 },
    )
  } finally {
    console.log("=== POST REQUEST END ===")
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")
  const id = searchParams.get("id")
  const ids = searchParams.get("ids")

  console.log("=== DELETE REQUEST START ===")
  console.log("Action:", action)
  console.log("ID:", id)
  console.log("IDs:", ids)

  try {
    switch (action) {
      case "single":
        if (!id) {
          console.log("Validation failed: id parameter is required for single delete")
          return NextResponse.json({ success: false, error: "id parameter is required" }, { status: 400 })
        }

        console.log(`Attempting to delete single evaluation with ID: ${id}`)
        const singleDeleteResult = await deleteAHPEvaluation(id)
        console.log(`Single delete result: ${singleDeleteResult}`)

        return NextResponse.json({
          success: singleDeleteResult,
          message: singleDeleteResult
            ? "Evaluation deleted successfully"
            : "Evaluation not found or could not be deleted",
        })

      case "multiple":
        if (!ids) {
          console.log("Validation failed: ids parameter is required for multiple delete")
          return NextResponse.json({ success: false, error: "ids parameter is required" }, { status: 400 })
        }

        let evaluationIds: string[]
        try {
          evaluationIds = JSON.parse(ids)
          if (!Array.isArray(evaluationIds)) {
            throw new Error("ids must be an array")
          }
        } catch (parseError) {
          console.log("JSON parse error for ids:", parseError)
          return NextResponse.json(
            { success: false, error: "Invalid ids format. Expected JSON array." },
            { status: 400 },
          )
        }

        console.log(`Attempting to delete multiple evaluations:`, evaluationIds)
        const multipleDeleteResult = await deleteMultipleAHPEvaluations(evaluationIds)
        console.log(`Multiple delete result: ${multipleDeleteResult}`)

        return NextResponse.json({
          success: multipleDeleteResult,
          message: multipleDeleteResult
            ? `${evaluationIds.length} evaluations deleted successfully`
            : "Some or all evaluations could not be deleted",
        })

      case "all":
        console.log("Attempting to delete all evaluations")
        const allDeleteResult = await deleteAllAHPEvaluations()
        console.log(`Delete all result: ${allDeleteResult}`)

        return NextResponse.json({
          success: allDeleteResult,
          message: allDeleteResult ? "All evaluations deleted successfully" : "Could not delete all evaluations",
        })

      default:
        console.log("Invalid delete action:", action)
        return NextResponse.json({ success: false, error: "Invalid action parameter" }, { status: 400 })
    }
  } catch (error) {
    console.error("DELETE request error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: {
          action,
          id,
          ids,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 },
    )
  } finally {
    console.log("=== DELETE REQUEST END ===")
  }
}
