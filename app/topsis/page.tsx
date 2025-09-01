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
import { calculateTOPSIS, addDistanceDataToResults, type TOPSISResult } from "@/lib/topsis"
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [minDistance, setMinDistance] = useState<number | "">("")
  const [filteredDriverData, setFilteredDriverData] = useState<DriverData[]>([])

  const leafCriteria = getLeafCriteria()

  // URL parametrelerini parse et ve selectedIds'i ayarla
  useEffect(() => {
    const idsParam = searchParams.get("selectedIds")
    console.log("🔍 URL parametresi:", idsParam)

    if (idsParam && !isInitialized) {
      try {
        const ids = JSON.parse(decodeURIComponent(idsParam))
        console.log("✅ Parse edilen ID'ler:", ids)
        setSelectedIds(ids)
        setIsInitialized(true)
      } catch (error) {
        console.error("❌ URL parametresi parse hatası:", error)
        setError("URL parametresi geçersiz")
      }
    }
  }, [searchParams, isInitialized])

  // selectedIds değiştiğinde değerlendirmeleri yükle
  useEffect(() => {
    if (selectedIds.length > 0 && isInitialized) {
      console.log("📤 Değerlendirmeler yükleniyor, ID'ler:", selectedIds)
      loadSelectedEvaluations()
    }
  }, [selectedIds, isInitialized])

  const loadSelectedEvaluations = async () => {
    if (selectedIds.length === 0) {
      console.log("⚠️ Seçili ID yok, yükleme atlanıyor")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("📤 API'den tüm değerlendirmeler getiriliyor...")
      const allEvaluations = await getAllAHPEvaluations()
      console.log("✅ Toplam değerlendirme sayısı:", allEvaluations.length)

      // Veri yapısını kontrol et
      if (allEvaluations.length > 0) {
        console.log("🔍 İlk değerlendirmenin yapısı:")
        console.log("  - global_weights:", allEvaluations[0].global_weights)
        console.log("  - global_weights keys:", Object.keys(allEvaluations[0].global_weights || {}))
      }

      const selected = allEvaluations.filter((evaluation) => selectedIds.includes(evaluation.id))
      console.log("✅ Seçilen değerlendirme sayısı:", selected.length)

      if (selected.length === 0) {
        throw new Error(`Seçilen ID'lerle eşleşen değerlendirme bulunamadı. Aranan ID'ler: ${selectedIds.join(", ")}`)
      }

      setEvaluations(selected)

      console.log("🧮 Ortalama ağırlıklar hesaplanıyor...")
      const avgWeights = calculateAverageWeights(selected)
      console.log("✅ Hesaplanan ortalama ağırlıklar:", avgWeights)
      console.log("📊 Sıfır olmayan ağırlık sayısı:", Object.values(avgWeights).filter((w) => w > 0).length)
      console.log("🔍 Debug: avgWeights tipi:", typeof avgWeights)
      console.log("🔍 Debug: avgWeights null/undefined kontrolü:", avgWeights === null, avgWeights === undefined)
      console.log("🔍 Debug: avgWeights boş obje kontrolü:", Object.keys(avgWeights).length === 0)
      console.log("🔍 Debug: avgWeights içeriği detay:", JSON.stringify(avgWeights, null, 2))

      if (Object.values(avgWeights).filter((w) => w > 0).length === 0) {
        throw new Error(
          "Hiçbir kriter için geçerli ağırlık bulunamadı. AHP değerlendirmelerinde global_weights verisi eksik olabilir.",
        )
      }

      setAverageWeights(avgWeights)
      console.log("✅ averageWeights state'e set edildi:", avgWeights)
    } catch (error) {
      console.error("❌ Değerlendirmeler yüklenirken hata:", error)
      setError(
        `Değerlendirmeler yüklenirken hata oluştu: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
      )
    } finally {
      setIsLoading(false)
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

        console.log("✅ Excel verisi yüklendi:", parsedData.length, "satır")
        setDriverData(parsedData)
        setIsAnalysisComplete(false)
        setResults([])
      } catch (error) {
        console.error("❌ Dosya okuma hatası:", error)
        setError("Excel dosyası okunamadı. Lütfen dosya formatını kontrol edin.")
      } finally {
        setIsLoading(false)
      }
    }

    reader.readAsArrayBuffer(file)
  }, [])

  const runTOPSISAnalysis = useCallback(() => {
    const dataToUse = filteredDriverData.length > 0 ? filteredDriverData : driverData
    
    if (dataToUse.length === 0) {
      setError("Sürücü verisi gerekli")
      return
    }

    if (Object.keys(averageWeights).length === 0) {
      setError("Ağırlık verisi gerekli")
      return
    }

    const validWeights = Object.values(averageWeights).filter((w) => (w as number) > 0)
    if (validWeights.length === 0) {
      setError("Geçerli ağırlık bulunamadı. Lütfen AHP değerlendirmelerini kontrol edin.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("🚀 TOPSIS analizi başlatılıyor...")
      console.log("📊 Sürücü verisi:", dataToUse.length, "satır")
      console.log("⚖️ Ağırlık sayısı:", Object.keys(averageWeights).length)
      console.log("✅ Geçerli ağırlık sayısı:", validWeights.length)

      // Excel'den sürücü isimlerini al (ilk sütun genellikle Sicil No)
      const firstColumnKey = Object.keys(dataToUse[0])[0]
      const alternatives = dataToUse.map((driver: DriverData) => String(driver[firstColumnKey] || ""))

      // Kriter isimlerini ve tiplerini al - sadece geçerli ağırlığı olanlar
      const criteriaNames: string[] = []
      const criteriaTypes: ("benefit" | "cost")[] = []
      const weights: number[] = []

      console.log("🔍 Debug: averageWeights içeriği:", averageWeights)
      console.log("🔍 Debug: leafCriteria içeriği:", leafCriteria.map(c => ({ id: c.id, name: c.name })))
      console.log("🔍 Debug: averageWeights keys:", Object.keys(averageWeights))
      console.log("🔍 Debug: averageWeights values:", Object.values(averageWeights))

      leafCriteria.forEach((criterion) => {
        const weight = averageWeights[criterion.id]
        console.log(`🔍 Debug: Kriter ${criterion.id} (${criterion.name}) için ağırlık:`, weight)
        console.log(`🔍 Debug: averageWeights[${criterion.id}] = ${weight} (tip: ${typeof weight})`)
        if (weight && weight > 0) {
          criteriaNames.push(criterion.name)
          criteriaTypes.push(criterion.type)
          weights.push(weight)
          console.log(`✅ Kriter eklendi: ${criterion.name} = ${weight}`)
        } else {
          console.log(`⚠️ Kriter atlandı: ${criterion.name} = ${weight}`)
        }
      })

      // Eğer leafCriteria ile eşleşme yoksa, global_weights'ten direkt al
      if (criteriaNames.length === 0) {
        console.log("⚠️ leafCriteria ile eşleşme bulunamadı, global_weights'ten direkt alınıyor...")
        console.log("🔍 Debug: Fallback - Tüm global_weights içeriği:")
        Object.entries(averageWeights).forEach(([criterionId, weight]) => {
          console.log(`  - ${criterionId}: ${weight} (tip: ${typeof weight})`)
        })
        
        // ID mapping tablosu - AHP'deki ID'leri TOPSIS ID'lerine eşleştir
        const idMapping: Record<string, { name: string; type: "benefit" | "cost" }> = {
          // AHP'den gelen gerçek ID'ler (artık criteria-hierarchy ile eşleşiyor)
          "idle": { name: "Rölanti Süresi", type: "cost" },
          "speed": { name: "Hız Aşımı", type: "cost" },
          "engine": { name: "Motor Performansı", type: "cost" },
          "attendance": { name: "Devam Durumu", type: "benefit" },
          "acceleration": { name: "Hızlanma", type: "cost" },
          "fatal_accident": { name: "Ölümlü Kaza", type: "cost" },
          "injury_accident": { name: "Yaralanmalı Kaza", type: "cost" },
          "normal_overtime": { name: "Normal Fazla Mesai", type: "benefit" },
          "holiday_overtime": { name: "Tatil Fazla Mesai", type: "benefit" },
          "weekend_overtime": { name: "Hafta Sonu Fazla Mesai", type: "benefit" },
          "first_degree_dismissal": { name: "Birinci Derece Uzaklaştırma", type: "cost" },
          "third_degree_dismissal": { name: "Üçüncü Derece Uzaklaştırma", type: "cost" },
          "fourth_degree_dismissal": { name: "Dördüncü Derece Uzaklaştırma", type: "cost" },
          "second_degree_dismissal": { name: "İkinci Derece Uzaklaştırma", type: "cost" },
          "material_damage_accident": { name: "Maddi Hasarlı Kaza", type: "cost" }
        }
        
        Object.entries(averageWeights).forEach(([criterionId, weight]) => {
          if ((weight as number) > 0) {
            // ID mapping tablosundan kriter bilgilerini al
            const mappedCriterion = idMapping[criterionId]
            if (mappedCriterion) {
              criteriaNames.push(mappedCriterion.name)
              criteriaTypes.push(mappedCriterion.type)
              weights.push(weight as number)
              console.log(`✅ Kriter eklendi (ID mapping ile): ${mappedCriterion.name} = ${weight}`)
            } else {
              // Mapping bulunamazsa, ID'yi direkt kullan
              criteriaNames.push(criterionId)
              criteriaTypes.push("cost") // Varsayılan olarak cost
              weights.push(weight as number)
              console.log(`✅ Kriter eklendi (fallback): ${criterionId} = ${weight}`)
            }
          }
        })
      }

      if (criteriaNames.length === 0) {
        throw new Error("Hiçbir kriter için geçerli ağırlık bulunamadı")
      }

      console.log("📋 Kullanılacak kriterler:", criteriaNames.length)
      console.log("⚖️ Ağırlıklar:", weights)

      // Excel verilerinden kriter değerlerini çıkar
      const matrix: number[][] = []
      const distanceData: Record<string, number> = {}

      dataToUse.forEach((driver: DriverData, driverIndex: number) => {
        const row: number[] = []
        let distanceTraveled = 0

        // Sürücü ID'sini al (Sicil No)
        const firstColumnKey = Object.keys(driver)[0]
        const driverID = String(driver[firstColumnKey] || "")

        // Çalışılan Saat verisini bul
        const distanceKeys = Object.keys(driver).filter(
          (key) => key.toLowerCase().includes("çalışılan saat") || key.toLowerCase().includes("çalışılan st"),
        )
        if (distanceKeys.length === 0) {
          // Fallback: hala kilometre arıyorsa
          const fallbackKeys = Object.keys(driver).filter(
            (key) => (key.toLowerCase().includes("saat") || key.toLowerCase().includes("st")) &&
                     !key.toLowerCase().includes("oran") && !key.toLowerCase().includes("ratio")
          )
          if (fallbackKeys.length > 0) {
            distanceTraveled = Number(driver[fallbackKeys[0]]) || 0
          }
        } else {
          distanceTraveled = Number(driver[distanceKeys[0]]) || 0
        }
        
        // Sürücü ID'sine göre map'e ekle
        distanceData[driverID] = distanceTraveled

        // Her kriter için Excel'den değer bul
        criteriaNames.forEach((criteriaName, criteriaIndex) => {
          // Excel sütun başlığını kriter ismiyle eşleştirmeye çalış
          const excelKeys = Object.keys(driver)
          let value = 0

          // Tam eşleşme ara
          let matchingKey = excelKeys.find((key) => key.trim() === criteriaName.trim())

          // Kısmi eşleşme ara
          if (!matchingKey) {
            matchingKey = excelKeys.find((key) => key.toLowerCase().includes(criteriaName.toLowerCase()))
          }

          if (matchingKey) {
            value = Number(driver[matchingKey]) || 0
          }

          row.push(value)

          if (driverIndex === 0) {
            // Sadece ilk sürücü için log
            console.log(`📊 Kriter "${criteriaName}" için Excel sütunu: "${matchingKey}" = ${value}`)
          }
        })

        matrix.push(row)
      })

      console.log("📊 Karar matrisi boyutu:", matrix.length, "x", matrix[0]?.length || 0)

      // Matris geçerliliğini kontrol et
      if (matrix.length === 0 || !matrix[0] || matrix[0].length === 0) {
        throw new Error("Karar matrisi oluşturulamadı. Excel verilerini kontrol edin.")
      }

      // TOPSIS analizi çalıştır
      const topsisResults = calculateTOPSIS({
        alternatives,
        criteria: criteriaNames,
        matrix,
        weights,
        criteriaTypes,
      })

      // Çalışılan Saat verisi ile tie-breaking uygula
      const finalResults = addDistanceDataToResults(topsisResults, distanceData)

      console.log("✅ TOPSIS analizi tamamlandı, sonuç sayısı:", finalResults.length)
      setResults(finalResults)
      setIsAnalysisComplete(true)
    } catch (error) {
      console.error("❌ TOPSIS analizi hatası:", error)
      setError("TOPSIS analizi sırasında hata oluştu: " + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [driverData, filteredDriverData, averageWeights, leafCriteria])

  // driverData değiştiğinde filtre uygula
  useEffect(() => {
    if (minDistance === "" || isNaN(Number(minDistance))) {
      setFilteredDriverData(driverData)
    } else {
      // Sadece minimum saati geçenler
      setFilteredDriverData(
        driverData.filter((driver: DriverData) => {
          const excelKeys = Object.keys(driver)
          let distanceKey = excelKeys.find(
            (key) => key.trim().toLowerCase() === "çalışılan saat" || key.trim().toLowerCase() === "çalışılan st"
          )
          if (!distanceKey) {
            distanceKey = excelKeys.find(
              (key) =>
                (key.toLowerCase().includes("saat") || key.toLowerCase().includes("st")) &&
                !key.toLowerCase().includes("oran") &&
                !key.toLowerCase().includes("ratio")
            )
          }
          if (distanceKey) {
            const distanceTraveled = Number(driver[distanceKey]) || 0
            return distanceTraveled >= Number(minDistance)
          }
          return false
        })
      )
    }
  }, [driverData, minDistance])

  const handleMinDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "") setMinDistance("")
    else setMinDistance(Number(value))
  }

  const handleApplyFilter = () => {
    // Sadece filtreyi tetiklemek için, useEffect zaten filtreliyor
    setFilteredDriverData((prev: DriverData[]) => [...prev])
  }

  const exportResults = useCallback(() => {
    if (results.length === 0) return

    try {
      const wb = XLSX.utils.book_new()

      // Ana sonuçlar sayfası
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

      // Dosyayı indir
      const fileName = `topsis_sonuclari_${new Date().toISOString().split("T")[0]}.xlsx`
      XLSX.writeFile(wb, fileName)

      console.log("✅ Sonuçlar Excel'e aktarıldı:", fileName)
    } catch (error) {
      console.error("❌ Export hatası:", error)
      setError("Sonuçlar dışa aktarılırken hata oluştu")
    }
  }, [results])

  // Debug bilgileri
  console.log("🔍 Debug - Current State:", {
    selectedIds: selectedIds.length,
    evaluations: evaluations.length,
    averageWeights: Object.keys(averageWeights).length,
    isInitialized,
    isLoading,
    error,
  })

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
                Sonuçları İndir
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Debug Bilgileri */}
          {process.env.NODE_ENV === "development" && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">Debug Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-yellow-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>Seçili ID Sayısı: {selectedIds.length}</div>
                  <div>Yüklenen Değerlendirme: {evaluations.length}</div>
                  <div>Ağırlık Sayısı: {Object.keys(averageWeights).length}</div>
                  <div>Başlatıldı: {isInitialized ? "Evet" : "Hayır"}</div>
                  <div>Yükleniyor: {isLoading ? "Evet" : "Hayır"}</div>
                  <div>Hata: {error ? "Var" : "Yok"}</div>
                </div>
                {selectedIds.length > 0 && (
                  <div className="mt-2">
                    <strong>Seçili ID'ler:</strong> {selectedIds.join(", ")}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Seçilen Değerlendirmeler Özeti */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Seçilen AHP Değerlendirmeleri
                {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
              </CardTitle>
              <CardDescription>
                TOPSIS analizinde kullanılacak {evaluations.length} değerlendirmenin ortalama ağırlıkları
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Değerlendirmeler yükleniyor...</p>
                </div>
              ) : evaluations.length > 0 ? (
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
                  <p className="text-gray-600">
                    {selectedIds.length === 0
                      ? "URL'den seçili değerlendirme ID'si alınamadı."
                      : "Seçilen değerlendirmeler yüklenemedi."}
                  </p>
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
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{driverData.length} sürücü verisi yüklendi</span>
                    </div>
                    
                    {/* Filtreleme */}
                    <div className="space-y-2">
                      <Label htmlFor="min-distance">Çalışılan Minimum Saat:</Label>
                      <Input
                        id="min-distance"
                        type="number"
                        placeholder="Minimum saat değeri girin"
                        value={minDistance}
                        onChange={handleMinDistanceChange}
                      />
                      <Button onClick={handleApplyFilter} variant="outline" size="sm">
                        Filtre Uygula
                      </Button>
                      {filteredDriverData.length !== driverData.length && (
                        <div className="text-sm text-blue-600">
                          Filtre uygulandı: {filteredDriverData.length} sürücü gösteriliyor
                        </div>
                      )}
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
                          <TableCell>{result.closenessCoefficient.toFixed(8)}</TableCell>
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
