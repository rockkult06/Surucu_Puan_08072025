"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Calculator, CheckCircle, AlertTriangle, Save, User } from "lucide-react"
import Link from "next/link"
import { criteriaHierarchy, getMainCriteria, getCriteriaById, initializeHierarchyData } from "@/lib/criteria-hierarchy"
import { calculateHierarchicalAHP, sliderToAHPValue, ahpValueToSlider, type HierarchicalAHPResult } from "@/lib/ahp"
import { saveAHPEvaluation, getAHPEvaluationByUser } from "@/lib/api-client"
import { UserLoginDialog } from "@/components/user-login-dialog"

export default function HierarchicalComparisonPage() {
  const [hierarchyData, setHierarchyData] = useState<Record<string, number[][]>>({})
  const [ahpResults, setAhpResults] = useState<HierarchicalAHPResult | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isCalculating, setIsCalculating] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userModifiedSteps, setUserModifiedSteps] = useState<Set<string>>(new Set())

  // Karşılaştırma adımlarını tanımla
  const comparisonSteps = [
    { id: "main", name: "Ana Kriterler", description: "İdari ve Teknik Değerlendirme karşılaştırması" },
    { id: "admin", name: "İdari Alt Kriterler", description: "İdari değerlendirme alt kriterlerinin karşılaştırması" },
    { id: "overtime", name: "Fazla Mesai Kriterleri", description: "Fazla mesai türlerinin karşılaştırması" },
    { id: "accident", name: "Kaza Kriterleri", description: "Kaza türlerinin karşılaştırması" },
    { id: "discipline", name: "Disiplin Kriterleri", description: "Disiplin derecelerinin karşılaştırması" },
    {
      id: "technical",
      name: "Teknik Alt Kriterler",
      description: "Teknik değerlendirme alt kriterlerinin karşılaştırması",
    },
  ]

  useEffect(() => {
    const initialData = initializeHierarchyData()
    setHierarchyData(initialData)
    // Başlangıçta hiçbir adım tamamlanmış olarak işaretlenmesin
    setUserModifiedSteps(new Set())
  }, [])

  useEffect(() => {
    if (Object.keys(hierarchyData).length > 0) {
      calculateResults()
    }
  }, [hierarchyData])

  const handleUserLogin = async (userName: string) => {
    setCurrentUser(userName)

    // Kullanıcının daha önceki değerlendirmesini yükle
    try {
      const existingEvaluation = await getAHPEvaluationByUser(userName)
      if (existingEvaluation) {
        setHierarchyData(existingEvaluation.hierarchy_data)
        // Mevcut değerlendirmede tüm adımları tamamlanmış olarak işaretle
        setUserModifiedSteps(new Set(comparisonSteps.map((step) => step.id)))
        console.log("Mevcut değerlendirme yüklendi:", existingEvaluation)
      }
    } catch (error) {
      console.error("Kullanıcı verisi yükleme hatası:", error)
    }
  }

  const calculateResults = async () => {
    setIsCalculating(true)
    try {
      const results = calculateHierarchicalAHP(hierarchyData, criteriaHierarchy)
      setAhpResults(results)
    } catch (error) {
      console.error("AHP hesaplama hatası:", error)
    } finally {
      setIsCalculating(false)
    }
  }

  const saveEvaluation = async () => {
    if (!currentUser || !ahpResults) return

    setIsSaving(true)
    try {
      await saveAHPEvaluation(
        currentUser,
        ahpResults.criteriaWeights,
        ahpResults.globalWeights,
        ahpResults.consistencyResults,
        hierarchyData,
      )
      alert("Değerlendirmeniz başarıyla kaydedildi!")
    } catch (error) {
      console.error("Kaydetme hatası:", error)
      alert("Kaydetme sırasında hata oluştu.")
    } finally {
      setIsSaving(false)
    }
  }

  const updateComparison = (stepId: string, i: number, j: number, value: number) => {
    const ahpValue = sliderToAHPValue(value)

    // Bu adımın kullanıcı tarafından değiştirildiğini işaretle
    setUserModifiedSteps((prev) => new Set([...prev, stepId]))

    setHierarchyData((prev) => {
      const newData = { ...prev }
      if (!newData[stepId]) return prev

      const newMatrix = newData[stepId].map((row) => [...row])
      newMatrix[i][j] = ahpValue
      newMatrix[j][i] = 1 / ahpValue

      return {
        ...newData,
        [stepId]: newMatrix,
      }
    })
  }

  const getCurrentStepData = () => {
    const step = comparisonSteps[currentStep]
    if (!step || !hierarchyData[step.id]) return null

    const matrix = hierarchyData[step.id]
    let criteria: any[] = []

    if (step.id === "main") {
      criteria = getMainCriteria()
    } else {
      const parentCriterion = getCriteriaById(step.id)
      if (parentCriterion && parentCriterion.children) {
        criteria = parentCriterion.children.map((childId) => getCriteriaById(childId)).filter(Boolean)
      }
    }

    return { matrix, criteria, step }
  }

  const isStepCompleted = (stepId: string) => {
    // Sadece kullanıcı tarafından değiştirilmiş VE tutarlı olan adımlar tamamlanmış sayılır
    const isModified = userModifiedSteps.has(stepId)
    const result = ahpResults?.consistencyResults[stepId]
    const isConsistent = result?.isConsistent || false

    return isModified && isConsistent
  }

  const getCompletedStepsCount = () => {
    return comparisonSteps.filter((step) => isStepCompleted(step.id)).length
  }

  const renderComparisonMatrix = () => {
    const stepData = getCurrentStepData()
    if (!stepData) return null

    const { matrix, criteria, step } = stepData
    const result = ahpResults?.consistencyResults[step.id]

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {step.name}
          </CardTitle>
          <CardDescription>{step.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Karşılaştırma Matrisi */}
          <div className="space-y-4">
            {criteria.map((criterion1, i) =>
              criteria.slice(i + 1).map((criterion2, j) => {
                const actualJ = i + j + 1
                const currentValue = ahpValueToSlider(matrix[i][actualJ])

                return (
                  <div key={`${i}-${actualJ}`} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-600">{criterion1.name}</span>
                      <span className="text-sm font-medium text-green-600">{criterion2.name}</span>
                    </div>
                    <div className="px-4">
                      <Slider
                        value={[currentValue]}
                        onValueChange={([value]) => updateComparison(step.id, i, actualJ, value)}
                        min={-8}
                        max={8}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Sol 9x Önemli</span>
                        <span>Eşit</span>
                        <span>Sağ 9x Önemli</span>
                      </div>
                      <div className="text-center text-sm mt-2">
                        {currentValue === 0 ? (
                          <Badge variant="secondary">Eşit Önemli</Badge>
                        ) : currentValue > 0 ? (
                          <Badge variant="default">
                            {criterion2.name} {Math.abs(currentValue) + 1}x Önemli
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {criterion1.name} {Math.abs(currentValue) + 1}x Önemli
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }),
            )}
          </div>

          {/* Tutarlılık Sonuçları */}
          {result && userModifiedSteps.has(step.id) && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Tutarlılık Analizi</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Tutarlılık Oranı (CR)</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{(result.consistencyRatio * 100).toFixed(2)}%</span>
                    {result.isConsistent ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Durum</p>
                  <Badge variant={result.isConsistent ? "default" : "destructive"}>
                    {result.isConsistent ? "Tutarlı" : "Tutarsız"}
                  </Badge>
                </div>
              </div>

              {!result.isConsistent && (
                <Alert className="mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Tutarlılık oranı %10'dan yüksek. Karşılaştırmalarınızı gözden geçirin.
                  </AlertDescription>
                </Alert>
              )}

              {/* Kriter Ağırlıkları */}
              <div className="mt-4">
                <h5 className="font-medium mb-2">Kriter Ağırlıkları</h5>
                <div className="space-y-2">
                  {criteria.map((criterion, index) => (
                    <div key={criterion.id} className="flex justify-between items-center">
                      <span className="text-sm">{criterion.name}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={result.weights[index] * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium w-12">{(result.weights[index] * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Karşılaştırma yapılmadığında uyarı */}
          {!userModifiedSteps.has(step.id) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Bu adımda henüz karşılaştırma yapmadınız. Kriterleri karşılaştırmak için yukarıdaki kaydırıcıları
                kullanın.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  const canProceed = () => {
    const step = comparisonSteps[currentStep]
    return isStepCompleted(step?.id)
  }

  const allStepsCompleted = () => {
    return getCompletedStepsCount() === comparisonSteps.length
  }

  if (!currentUser) {
    return <UserLoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onUserLogin={handleUserLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                  Adım {currentStep + 1} / {comparisonSteps.length} - Kullanıcı: {currentUser}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {allStepsCompleted() && (
                <>
                  <Button onClick={saveEvaluation} disabled={isSaving} variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Kaydediliyor..." : "Değerlendirmeyi Kaydet"}
                  </Button>
                  <Link href="/collective-weights">
                    <Button>
                      <User className="h-4 w-4 mr-2" />
                      Toplu Ağırlıklar
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sol Panel - Adım Navigasyonu */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Karşılaştırma Adımları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {comparisonSteps.map((step, index) => {
                    const isActive = index === currentStep
                    const isCompleted = isStepCompleted(step.id)
                    const isModified = userModifiedSteps.has(step.id)

                    return (
                      <button
                        key={step.id}
                        onClick={() => setCurrentStep(index)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          isActive
                            ? "border-blue-500 bg-blue-50"
                            : isCompleted
                              ? "border-green-500 bg-green-50"
                              : isModified
                                ? "border-yellow-500 bg-yellow-50"
                                : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{step.name}</p>
                            <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                          </div>
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : isModified ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          ) : null}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ana İçerik */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* İlerleme Çubuğu */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Genel İlerleme</span>
                    <span className="text-sm text-gray-600">
                      {getCompletedStepsCount()} / {comparisonSteps.length} Tamamlandı
                    </span>
                  </div>
                  <Progress value={(getCompletedStepsCount() / comparisonSteps.length) * 100} className="h-2" />
                </CardContent>
              </Card>

              {/* Karşılaştırma Matrisi */}
              {renderComparisonMatrix()}

              {/* Navigasyon Butonları */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  Önceki Adım
                </Button>
                <Button
                  onClick={() => setCurrentStep(Math.min(comparisonSteps.length - 1, currentStep + 1))}
                  disabled={currentStep === comparisonSteps.length - 1 || !canProceed()}
                >
                  Sonraki Adım
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
