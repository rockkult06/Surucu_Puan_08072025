"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Scale, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  criteriaHierarchy,
  findCriterionById,
  getChildrenCriteria,
  getCriterionPath,
  getLeafCriteria,
  type Criterion,
} from "@/lib/criteria-hierarchy"
import { calculateAHPWeights, type ConsistencyResult } from "@/lib/ahp"
import { UserLoginDialog } from "@/components/user-login-dialog"
import { saveAHPEvaluation, getAHPEvaluationByUser } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

// Helper to convert slider value to AHP scale (1-9, 1/9-1)
// Slider range: -8 to 8
// AHP scale: 1/9, 1/8, ..., 1/2, 1, 2, ..., 8, 9
const sliderToAHPValue = (sliderValue: number): number => {
  if (sliderValue === 0) return 1
  if (sliderValue > 0) return sliderValue + 1 // 1 -> 2, 8 -> 9
  return 1 / (Math.abs(sliderValue) + 1) // -1 -> 1/2, -8 -> 1/9
}

// Helper to convert AHP value to slider value
const ahpValueToSlider = (ahpValue: number): number => {
  if (ahpValue === 1) return 0
  if (ahpValue > 1) return ahpValue - 1 // 2 -> 1, 9 -> 8
  return -(1 / ahpValue - 1) // 1/2 -> -1, 1/9 -> -8
}

export default function HierarchicalComparisonPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [userName, setUserName] = useState<string | null>(null)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [comparisonMatrices, setComparisonMatrices] = useState<Record<string, number[][]>>({})
  const [consistencyResults, setConsistencyResults] = useState<Record<string, ConsistencyResult>>({})
  const [criteriaWeights, setCriteriaWeights] = useState<Record<string, number>>({}) // Local weights for each matrix
  const [globalWeights, setGlobalWeights] = useState<Record<string, number>>({}) // Global weights for all leaf criteria

  // Load user from localStorage on initial render
  useEffect(() => {
    const storedUserName = localStorage.getItem("ahp_user_name")
    if (storedUserName) {
      setUserName(storedUserName)
      fetchUserData(storedUserName)
    } else {
      setIsLoginDialogOpen(true)
    }
  }, [])

  const fetchUserData = async (user: string) => {
    try {
      const evaluation = await getAHPEvaluationByUser(user)
      if (evaluation) {
        setComparisonMatrices(evaluation.hierarchy_data)
        setConsistencyResults(evaluation.consistency_results)
        setCriteriaWeights(evaluation.criteria_weights)
        setGlobalWeights(evaluation.global_weights)
        toast({
          title: "Veriler Yüklendi",
          description: `${user} kullanıcısının önceki değerlendirmeleri yüklendi.`,
        })
      } else {
        toast({
          title: "Bilgi",
          description: `${user} için kayıtlı değerlendirme bulunamadı. Yeni bir değerlendirme başlatılıyor.`,
        })
      }
    } catch (error) {
      console.error("Kullanıcı verileri yüklenirken hata:", error)
      toast({
        title: "Hata",
        description: "Önceki değerlendirmeler yüklenirken bir sorun oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleLogin = (name: string) => {
    setUserName(name)
    localStorage.setItem("ahp_user_name", name)
    fetchUserData(name)
  }

  // Generate comparison steps dynamically
  const comparisonSteps = useMemo(() => {
    const steps: {
      id: string
      name: string
      description: string
      criteria: string[]
      parentId: string | null
    }[] = []

    const traverse = (criteria: Criterion[], parentId: string | null) => {
      if (criteria.length > 1) {
        steps.push({
          id: parentId || "main",
          name: findCriterionById(parentId || "main")?.name || "Ana Kriterler",
          description:
            parentId === null
              ? "İdari ve Teknik Değerlendirme karşılaştırması"
              : `${findCriterionById(parentId)?.name} alt kriterlerinin karşılaştırması`,
          criteria: criteria.map((c) => c.id),
          parentId: parentId,
        })
      }
      criteria.forEach((criterion) => {
        if (criterion.children && criterion.children.length > 0) {
          traverse(criterion.children, criterion.id)
        }
      })
    }

    traverse(criteriaHierarchy[0].children || [], criteriaHierarchy[0].id)
    return steps
  }, [])

  const currentStep = comparisonSteps[currentStepIndex]
  const currentCriteria = useMemo(() => currentStep?.criteria.map((id) => findCriterionById(id)!), [currentStep])

  // Initialize matrix for current step if not exists
  useEffect(() => {
    if (currentStep && !comparisonMatrices[currentStep.id]) {
      const size = currentStep.criteria.length
      const initialMatrix = Array(size)
        .fill(0)
        .map(() => Array(size).fill(0))
      for (let i = 0; i < size; i++) {
        initialMatrix[i][i] = 1 // Diagonal elements are 1
      }
      setComparisonMatrices((prev) => ({
        ...prev,
        [currentStep.id]: initialMatrix,
      }))
    }
  }, [currentStep, comparisonMatrices])

  const updateComparison = useCallback(
    (i: number, j: number, sliderValue: number) => {
      if (!currentStep) return

      const newMatrices = { ...comparisonMatrices }
      const matrix = newMatrices[currentStep.id] || []

      const ahpValue = sliderToAHPValue(sliderValue)

      // Log for debugging
      console.log(
        `Slider Value: ${sliderValue}, AHP Value: ${ahpValue}, Criteria: ${currentCriteria[i]?.name} vs ${currentCriteria[j]?.name}`,
      )

      // Corrected logic:
      // If sliderValue is positive, it means criterion j is more important than i.
      // So, matrix[i][j] should be 1/ahpValue and matrix[j][i] should be ahpValue.
      // If sliderValue is negative, it means criterion i is more important than j.
      // So, matrix[i][j] should be ahpValue and matrix[j][i] should be 1/ahpValue.
      if (sliderValue > 0) {
        // Right criterion (j) is more important
        matrix[i][j] = 1 / ahpValue
        matrix[j][i] = ahpValue
        console.log(
          `Setting ${currentCriteria[j]?.name} as ${ahpValue}x more important than ${currentCriteria[i]?.name}`,
        )
      } else if (sliderValue < 0) {
        // Left criterion (i) is more important
        matrix[i][j] = ahpValue
        matrix[j][i] = 1 / ahpValue
        console.log(
          `Setting ${currentCriteria[i]?.name} as ${ahpValue}x more important than ${currentCriteria[j]?.name}`,
        )
      } else {
        // Equal importance
        matrix[i][j] = 1
        matrix[j][i] = 1
        console.log(`Setting ${currentCriteria[i]?.name} and ${currentCriteria[j]?.name} as equally important`)
      }

      setComparisonMatrices(newMatrices)
    },
    [currentStep, comparisonMatrices, currentCriteria],
  )

  // Calculate weights and consistency for the current matrix
  useEffect(() => {
    if (!currentStep || !comparisonMatrices[currentStep.id]) return

    const matrix = comparisonMatrices[currentStep.id]
    const criteriaIds = currentStep.criteria

    try {
      const { weights, consistencyRatio, isConsistent } = calculateAHPWeights(matrix)

      setConsistencyResults((prev) => ({
        ...prev,
        [currentStep.id]: { consistencyRatio, isConsistent },
      }))

      setCriteriaWeights((prev) => {
        const newWeights = { ...prev }
        criteriaIds.forEach((id, index) => {
          newWeights[id] = weights[index]
        })
        return newWeights
      })
    } catch (error) {
      console.error(`AHP hesaplama hatası (${currentStep.id}):`, error)
      setConsistencyResults((prev) => ({
        ...prev,
        [currentStep.id]: { consistencyRatio: Number.NaN, isConsistent: false },
      }))
      setCriteriaWeights((prev) => {
        const newWeights = { ...prev }
        criteriaIds.forEach((id) => {
          newWeights[id] = 0 // Hata durumunda ağırlığı sıfırla
        })
        return newWeights
      })
    }
  }, [currentStep, comparisonMatrices])

  // Calculate global weights
  useEffect(() => {
    const calculateGlobalWeights = () => {
      const newGlobalWeights: Record<string, number> = {}

      // Tüm leaf kriterleri al
      const leafCriteria = getLeafCriteria()

      leafCriteria.forEach((leaf) => {
        const path = getCriterionPath(leaf.id)
        if (!path) {
          newGlobalWeights[leaf.id] = 0
          return
        }

        let currentGlobalWeight = 1
        for (let i = 0; i < path.length; i++) {
          const criterionId = path[i]
          const weight = criteriaWeights[criterionId]
          if (weight !== undefined) {
            currentGlobalWeight *= weight
          } else {
            // Eğer bir üst kriterin ağırlığı henüz hesaplanmadıysa, bu yaprak kriterin ağırlığı 0 olur.
            currentGlobalWeight = 0
            break
          }
        }
        newGlobalWeights[leaf.id] = currentGlobalWeight
      })
      setGlobalWeights(newGlobalWeights)
    }

    calculateGlobalWeights()
  }, [criteriaWeights])

  const handleNextStep = async () => {
    if (!currentStep) return

    const currentConsistency = consistencyResults[currentStep.id]
    if (!currentConsistency || !currentConsistency.isConsistent) {
      toast({
        title: "Tutarlılık Hatası",
        description: "Mevcut karşılaştırma matrisi tutarlı değil. Lütfen düzeltin.",
        variant: "destructive",
      })
      return
    }

    if (currentStepIndex < comparisonSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      // Son adımsa, verileri kaydet
      if (userName) {
        try {
          await saveAHPEvaluation({
            user_name: userName,
            comparison_matrices: comparisonMatrices,
            local_weights: criteriaWeights,
            global_weights: globalWeights,
            consistency_results: consistencyResults,
          })
          toast({
            title: "Değerlendirme Kaydedildi",
            description: "AHP değerlendirmeniz başarıyla kaydedildi.",
          })
          router.push("/collective-weights") // Toplu ağırlıklar sayfasına yönlendir
        } catch (error) {
          console.error("Değerlendirme kaydedilirken hata:", error)
          toast({
            title: "Kaydetme Hatası",
            description: "Değerlendirme kaydedilirken bir sorun oluştu.",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Uyarı",
          description: "Değerlendirmeyi kaydetmek için lütfen giriş yapın.",
          variant: "destructive",
        })
        setIsLoginDialogOpen(true)
      }
    }
  }

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    } else {
      router.push("/") // İlk adımdaysa ana sayfaya dön
    }
  }

  if (!currentStep || !currentCriteria) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  const currentMatrix = comparisonMatrices[currentStep.id] || []
  const currentConsistency = consistencyResults[currentStep.id]
  const isCurrentStepConsistent = currentConsistency?.isConsistent ?? false

  return (
    <div className="min-h-screen bg-gray-50">
      <UserLoginDialog
        isOpen={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
        onLogin={handleLogin}
        currentUserName={userName}
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Ana Sayfa
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AHP Hiyerarşik Karşılaştırma</h1>
                <p className="text-sm text-gray-600">
                  Adım {currentStepIndex + 1} / {comparisonSteps.length} - Kullanıcı: {userName || "Misafir"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Panel - Karşılaştırma Adımları */}
          <Card className="lg:col-span-1 h-fit sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Karşılaştırma Adımları
              </CardTitle>
              <CardDescription>Hiyerarşideki kriter çiftlerini karşılaştırın.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {comparisonSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                    index === currentStepIndex ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setCurrentStepIndex(index)}
                >
                  <div>
                    <p className="font-medium">{step.name}</p>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                  {consistencyResults[step.id]?.isConsistent && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sağ Panel - Karşılaştırma Arayüzü */}
          <div className="lg:col-span-2 space-y-8">
            {/* Genel İlerleme */}
            <Card>
              <CardHeader>
                <CardTitle>Genel İlerleme</CardTitle>
                <CardDescription>
                  {currentStepIndex + 1} / {comparisonSteps.length} Tamamlandı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={((currentStepIndex + 1) / comparisonSteps.length) * 100} className="h-2" />
              </CardContent>
            </Card>

            {/* Mevcut Karşılaştırma */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  {currentStep.name}
                </CardTitle>
                <CardDescription>{currentStep.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentCriteria.map((criterion1, i) =>
                  currentCriteria.slice(i + 1).map((criterion2, jOffset) => {
                    const j = i + 1 + jOffset
                    const value = currentMatrix[i]?.[j] || 1 // Default to 1 if not set
                    const sliderValue = ahpValueToSlider(value)

                    const importanceText = (val: number, crit1Name: string, crit2Name: string) => {
                      if (val === 1) return "Eşit Önemli"
                      if (val > 1) return `${crit1Name} ${val}x Önemli`
                      return `${crit2Name} ${Math.round(1 / val)}x Önemli`
                    }

                    const displayValue = sliderToAHPValue(sliderValue)

                    return (
                      <div key={`${criterion1.id}-${criterion2.id}`} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{criterion1.name}</span>
                          <span className="text-sm text-gray-500">vs</span>
                          <span className="font-medium">{criterion2.name}</span>
                        </div>
                        <Slider
                          defaultValue={[sliderValue]}
                          min={-8}
                          max={8}
                          step={1}
                          onValueChange={(newValue) => updateComparison(i, j, newValue[0])}
                        />
                        <span className="text-sm text-gray-500">
                          {importanceText(displayValue, criterion1.name, criterion2.name)}
                        </span>
                      </div>
                    )
                  }),
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
