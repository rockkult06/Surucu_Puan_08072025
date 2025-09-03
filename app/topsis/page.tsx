"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Upload, Download, Calculator, Trophy, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import * as XLSX from "xlsx"
import { calculateTOPSIS, calculateTOPSISDetailed, addDistanceDataToResults, type TOPSISResult, type TOPSISDetailedResult } from "@/lib/topsis"
import { getAllAHPEvaluations, calculateAverageWeights, type AHPEvaluation } from "@/lib/api-client"
import { getLeafCriteria } from "@/lib/criteria-hierarchy"

interface DriverData {
  [key: string]: string | number
}

export default function TOPSISPage() {
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [evaluations, setEvaluations] = useState<AHPEvaluation[]>([])
  const [averageWeights, setAverageWeights] = useState<Record<string, number>>({})
  const [driverData, setDriverData] = useState<DriverData[]>([])
  const [results, setResults] = useState<TOPSISResult[]>([])
  const [detailedResults, setDetailedResults] = useState<TOPSISDetailedResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false)

  const leafCriteria = getLeafCriteria()

  useEffect(() => {
    const idsParam = searchParams.get("selectedIds")
    if (idsParam) {
      try {
        const ids = JSON.parse(decodeURIComponent(idsParam))
        setSelectedIds(ids)
        loadSelectedEvaluations(ids)
      } catch (error) {
        console.error("URL parametresi parse hatası:", error)
      }
    }
  }, [searchParams])

  const loadSelectedEvaluations = async (ids: string[]) => {
    try {
      const allEvaluations = await getAllAHPEvaluations()
      const selected = allEvaluations.filter((evaluation) => ids.includes(evaluation.id))
      setEvaluations(selected)

      const avgWeights = calculateAverageWeights(selected)
      setAverageWeights(avgWeights)
    } catch (error) {
      console.error("Değerlendirmeler yüklenirken hata:", error)
      setError("Değerlendirmeler yüklenirken hata oluştu")
    }
  }

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

        if (jsonData.length < 2) {
          throw new Error("Excel dosyası en az 2 satır içermelidir (başlık + veri)")
        }

        const headers = jsonData[0] as string[]
        const rows = jsonData.slice(1)

        const parsedData: DriverData[] = rows
          .filter((row) => row.some((cell) => cell !== null && cell !== undefined && cell !== ""))
          .map((row) => {
            const obj: DriverData = {}
            headers.forEach((header, index) => {
              const value = row[index]
              if (value !== null && value !== undefined) {
                obj[header] = typeof value === "string" ? value : Number(value) || 0
              }
            })
            return obj
          })

        setDriverData(parsedData)
        setIsAnalysisComplete(false)
        setResults([])
      } catch (error) {
        console.error("Dosya okuma hatası:", error)
        setError("Excel dosyası okunamadı. Lütfen dosya formatını kontrol edin.")
      } finally {
        setIsLoading(false)
      }
    }

    reader.readAsArrayBuffer(file)
  }, [])

  const runTOPSISAnalysis = useCallback(() => {
    if (driverData.length === 0 || Object.keys(averageWeights).length === 0) {
      setError("Sürücü verisi ve ağırlıklar gerekli")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Excel'den sürücü isimlerini al (ilk sütun genellikle Sicil No)
      const firstColumnKey = Object.keys(driverData[0])[0]
      const alternatives = driverData.map((driver) => String(driver[firstColumnKey] || ""))

      // Kriter isimlerini ve tiplerini al
      const criteriaNames: string[] = []
      const criteriaTypes: ("benefit" | "cost")[] = []
      const weights: number[] = []

      leafCriteria.forEach((criterion) => {
        if (averageWeights[criterion.id]) {
          criteriaNames.push(criterion.name)
          criteriaTypes.push(criterion.type)
          weights.push(averageWeights[criterion.id])
        }
      })

             // Excel verilerinden kriter değerlerini çıkar
       const matrix: number[][] = []
       const distanceData: Record<string, number> = {}

      driverData.forEach((driver, driverIndex) => {
        const row: number[] = []
        let distanceTraveled = 0

        // Sürücü ID'sini al (Sicil No)
        const firstColumnKey = Object.keys(driver)[0]
        const driverID = String(driver[firstColumnKey] || "")

        // İlk sürücü için tüm sütun isimlerini logla
        if (driverIndex === 0) {
          console.log("🔍 Excel sütun isimleri:", Object.keys(driver))
        }

        // Çalışılan Saat verisini bul - önce tam eşleşme ara
        const exactKeys = Object.keys(driver).filter(
          (key) => key.trim().toLowerCase() === "çalışılan saat" || key.trim().toLowerCase() === "çalışılan st"
        )
        
        if (exactKeys.length > 0) {
          distanceTraveled = Number(driver[exactKeys[0]]) || 0
          if (driverIndex === 0) {
            console.log("✅ Tam eşleşme bulundu:", exactKeys[0], "=", distanceTraveled)
          }
        } else {
          // Kısmi eşleşme ara
          const partialKeys = Object.keys(driver).filter(
            (key) => key.toLowerCase().includes("çalışılan saat") || key.toLowerCase().includes("çalışılan st")
          )
          
          if (partialKeys.length > 0) {
            distanceTraveled = Number(driver[partialKeys[0]]) || 0
            if (driverIndex === 0) {
              console.log("✅ Kısmi eşleşme bulundu:", partialKeys[0], "=", distanceTraveled)
            }
          } else {
            // Fallback: saat içeren sütunları ara
            const fallbackKeys = Object.keys(driver).filter(
              (key) => (key.toLowerCase().includes("saat") || key.toLowerCase().includes("st")) &&
                       !key.toLowerCase().includes("oran") && !key.toLowerCase().includes("ratio")
            )
            
            if (fallbackKeys.length > 0) {
              distanceTraveled = Number(driver[fallbackKeys[0]]) || 0
              if (driverIndex === 0) {
                console.log("⚠️ Fallback eşleşme bulundu:", fallbackKeys[0], "=", distanceTraveled)
              }
            } else {
              if (driverIndex === 0) {
                console.log("❌ Çalışılan saat sütunu bulunamadı!")
                console.log("🔍 Mevcut sütunlar:", Object.keys(driver))
              }
            }
          }
        }
        
        // Sürücü ID'sine göre map'e ekle
        distanceData[driverID] = distanceTraveled

        // Her kriter için Excel'den değer bul
        leafCriteria.forEach((criterion) => {
          if (averageWeights[criterion.id]) {
            // Excel sütun başlığını kriter ismiyle eşleştirmeye çalış
            const excelKeys = Object.keys(driver)
            let value = 0

            // Tam eşleşme ara
            let matchingKey = excelKeys.find((key) => key.trim() === criterion.name.trim())

            // Kısmi eşleşme ara
            if (!matchingKey) {
              matchingKey = excelKeys.find((key) => key.toLowerCase().includes(criterion.name.toLowerCase()))
            }

            if (matchingKey) {
              value = Number(driver[matchingKey]) || 0
            }

            row.push(value)
          }
        })

        matrix.push(row)
      })

             // TOPSIS analizi çalıştır (detaylı)
       const topsisDetailed = calculateTOPSISDetailed({
         alternatives,
         criteria: criteriaNames,
         matrix,
         weights,
         criteriaTypes,
       })

       // Kilometre verisi ile tie-breaking uygula
       const finalResults = addDistanceDataToResults(topsisDetailed.results, distanceData)

       setDetailedResults(topsisDetailed)
       setResults(finalResults)
       setIsAnalysisComplete(true)
    } catch (error) {
      console.error("TOPSIS analizi hatası:", error)
      setError("TOPSIS analizi sırasında hata oluştu: " + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [driverData, averageWeights, leafCriteria])

    const exportResults = useCallback(() => {
    if (results.length === 0 || !detailedResults) {
      setError("Dışa aktarılacak sonuç bulunamadı")
      return
    }

    try {
      const wb = XLSX.utils.book_new()

      // 1. Ana sonuçlar sayfası
      const wsData = [
        ["Sıra", "Sürücü", "TOPSIS Puanı", "Çalışılan Saat"],
        ...results.map((result) => [
          result.rank,
          result.alternative,
          result.closenessCoefficient.toFixed(8),
          result.distanceTraveled || 0,
        ]),
      ]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      ws["!cols"] = [{ wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(wb, ws, "TOPSIS Sonuçları")

      // 2. Kriter ağırlıkları sayfası
      const weightsData = [
        ["Kriter", "Ağırlık", "Tip"],
        ...detailedResults.criteria.map((criterion, index) => [
          criterion,
          detailedResults.weights[index].toFixed(6),
          detailedResults.criteriaTypes[index] === "benefit" ? "Fayda" : "Maliyet"
        ])
      ]
      const wsWeights = XLSX.utils.aoa_to_sheet(weightsData)
      wsWeights["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 10 }]
      XLSX.utils.book_append_sheet(wb, wsWeights, "Kriter Ağırlıkları")

      // 3. Karar matrisi sayfası
      const decisionMatrixData = [
        ["Sürücü", ...detailedResults.criteria],
        ...detailedResults.alternatives.map((alternative, i) => [
          alternative,
          ...detailedResults.decisionMatrix[i].map(val => val.toFixed(4))
        ])
      ]
      const wsDecision = XLSX.utils.aoa_to_sheet(decisionMatrixData)
      XLSX.utils.book_append_sheet(wb, wsDecision, "Karar Matrisi")

      // 4. Normalize edilmiş matris sayfası
      const normalizedData = [
        ["Sürücü", ...detailedResults.criteria],
        ...detailedResults.alternatives.map((alternative, i) => [
          alternative,
          ...detailedResults.normalizedMatrix[i].map(val => val.toFixed(6))
        ])
      ]
      const wsNormalized = XLSX.utils.aoa_to_sheet(normalizedData)
      XLSX.utils.book_append_sheet(wb, wsNormalized, "Normalize Matris")

      // 5. Ağırlıklı normalize matris sayfası
      const weightedData = [
        ["Sürücü", ...detailedResults.criteria],
        ...detailedResults.alternatives.map((alternative, i) => [
          alternative,
          ...detailedResults.weightedMatrix[i].map(val => val.toFixed(6))
        ])
      ]
      const wsWeighted = XLSX.utils.aoa_to_sheet(weightedData)
      XLSX.utils.book_append_sheet(wb, wsWeighted, "Ağırlıklı Normalize Matris")

      // 6. İdeal çözümler sayfası
      const idealData = [
        ["Kriter", "İdeal Pozitif Çözüm", "İdeal Negatif Çözüm", "Tip"],
        ...detailedResults.criteria.map((criterion, index) => [
          criterion,
          detailedResults.idealSolution[index].toFixed(6),
          detailedResults.negativeIdealSolution[index].toFixed(6),
          detailedResults.criteriaTypes[index] === "benefit" ? "Fayda" : "Maliyet"
        ])
      ]
      const wsIdeal = XLSX.utils.aoa_to_sheet(idealData)
      wsIdeal["!cols"] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 10 }]
      XLSX.utils.book_append_sheet(wb, wsIdeal, "İdeal Çözümler")

      const fileName = `topsis_detayli_sonuclari_${new Date().toISOString().split("T")[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error("Export hatası:", error)
      setError("Sonuçlar dışa aktarılırken hata oluştu")
    }
  }, [results, detailedResults])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/collective-weights">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Toplu Ağırlıklar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TOPSIS Analizi</h1>
                <p className="text-sm text-gray-600">Çok Kriterli Karar Verme Analizi</p>
              </div>
            </div>
            {isAnalysisComplete && (
                              <Button onClick={exportResults} className="bg-green-600 hover:bg-green-700">
                  <Download className="h-4 w-4 mr-2" />
                  Detaylı Sonuçları İndir
                </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Seçilen Değerlendirmeler Özeti */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Seçilen AHP Değerlendirmeleri
              </CardTitle>
              <CardDescription>
                TOPSIS analizinde kullanılacak {evaluations.length} değerlendirmenin ortalama ağırlıkları
              </CardDescription>
            </CardHeader>
            <CardContent>
              {evaluations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leafCriteria.map((criterion) => {
                    const weight = averageWeights[criterion.id] || 0
                    return (
                      <div key={criterion.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium truncate" title={criterion.name}>
                            {criterion.name.length > 25 ? criterion.name.substring(0, 25) + "..." : criterion.name}
                          </span>
                          <span className="text-sm font-bold">{(weight * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={weight * 100} className="h-2" />
                        <div className="text-xs text-gray-500">
                          {criterion.type === "benefit" ? "Fayda Kriteri" : "Maliyet Kriteri"}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Seçilen değerlendirme bulunamadı.</p>
                  <Link href="/collective-weights">
                    <Button className="mt-4">Toplu Ağırlıklara Dön</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Veri Yükleme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Sürücü Performans Verilerini Yükle
              </CardTitle>
              <CardDescription>
                Sürücü performans verilerini içeren Excel dosyasını yükleyin. Dosya sürücü bilgileri ve performans
                kriterlerini içermelidir.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Excel Dosyası Seç</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                    className="mt-1"
                  />
                </div>

                {driverData.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{driverData.length} sürücü verisi yüklendi</span>
                    </div>
                    <Button
                      onClick={runTOPSISAnalysis}
                      disabled={isLoading || Object.keys(averageWeights).length === 0}
                      className="w-full"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {isLoading ? "Analiz Yapılıyor..." : "TOPSIS Analizini Başlat"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hata Mesajı */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Analiz Sonuçları */}
          {isAnalysisComplete && results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  TOPSIS Analiz Sonuçları
                </CardTitle>
                <CardDescription>
                                     Sürücü performans sıralaması (Aynı puana sahip sürücüler arasında çalışılan saat verisi yüksek olan
                   üst sırada yer alır)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Sıra</TableHead>
                        <TableHead>Sürücü</TableHead>
                        <TableHead>TOPSIS Puanı</TableHead>
                                                  <TableHead>Çalışılan Saat</TableHead>
                        <TableHead>Performans</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result) => (
                        <TableRow key={result.alternative}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {result.rank <= 3 && (
                                <Trophy
                                  className={`h-4 w-4 ${
                                    result.rank === 1
                                      ? "text-yellow-500"
                                      : result.rank === 2
                                        ? "text-gray-400"
                                        : "text-amber-600"
                                  }`}
                                />
                              )}
                              <span className="font-bold">{result.rank}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{result.alternative}</TableCell>
                          <TableCell>{result.closenessCoefficient.toFixed(4)}</TableCell>
                          <TableCell>{result.distanceTraveled || 0}</TableCell>
                          <TableCell>
                            <Badge variant={result.rank <= 3 ? "default" : result.rank <= 10 ? "secondary" : "outline"}>
                              {result.rank <= 3 ? "Mükemmel" : result.rank <= 10 ? "İyi" : "Ortalama"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
