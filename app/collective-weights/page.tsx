"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Users, Calculator, TrendingUp, RefreshCw, Trash2, TrashIcon, Download } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import {
  getAllAHPEvaluations,
  calculateAverageWeights,
  deleteAHPEvaluation,
  deleteMultipleAHPEvaluations,
  deleteAllAHPEvaluations,
  type AHPEvaluation,
} from "@/lib/api-client"
import { getLeafCriteria } from "@/lib/criteria-hierarchy"
import { useToast } from "@/hooks/use-toast"
import { checkDatabaseConnection } from "@/lib/neon-db"

export default function CollectiveWeightsPage() {
  const [evaluations, setEvaluations] = useState<AHPEvaluation[]>([])
  const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([])
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([])
  const [averageWeights, setAverageWeights] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [fileName, setFileName] = useState("ahp_evaluations.xlsx")
  const [dbConnected, setDbConnected] = useState(false)
  const [debugMode, setDebugMode] = useState(process.env.NODE_ENV === "development")

  const router = useRouter()
  const { toast } = useToast()

  const debugLog = (message: string, data?: any) => {
    if (debugMode) {
      console.log(`[CollectiveWeights] ${message}`, data || "")
    }
  }

  useEffect(() => {
    loadEvaluations()
    checkDbStatus()
  }, [])

  useEffect(() => {
    calculateAverage()
  }, [selectedEvaluations, evaluations])

  const checkDbStatus = async () => {
    debugLog("Checking database connection...")
    const connected = await checkDatabaseConnection()
    setDbConnected(connected)
    debugLog("Database connection status:", connected)

    if (!connected) {
      toast({
        title: "Veritabanı Bağlantı Hatası",
        description: "Veritabanı bağlantısı kurulamadı. Veriler geçici olarak bellekte saklanacaktır.",
        variant: "destructive",
        duration: 8000,
      })
    }
  }

  const loadEvaluations = async () => {
    debugLog("Loading evaluations...")
    setIsLoading(true)
    try {
      const data = await getAllAHPEvaluations()
      debugLog("Loaded evaluations:", data)
      setEvaluations(data)
      setSelectedEvaluations(data.map((item) => item.id))
      setSelectedForDelete([])
    } catch (error) {
      debugLog("Error loading evaluations:", error)
      console.error("Değerlendirmeler yüklenirken hata:", error)
      toast({
        title: "Hata",
        description: "Değerlendirmeler yüklenirken bir sorun oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshEvaluations = async () => {
    debugLog("Refreshing evaluations...")
    setIsRefreshing(true)
    try {
      await loadEvaluations()
      toast({
        title: "Başarılı",
        description: "Değerlendirmeler güncellendi.",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const calculateAverage = () => {
    const selectedEvals = evaluations.filter((item) => selectedEvaluations.includes(item.id))
    const avgWeights = calculateAverageWeights(selectedEvals)
    setAverageWeights(avgWeights)
  }

  const handleEvaluationToggle = (evaluationId: string, checked: boolean) => {
    if (checked) {
      setSelectedEvaluations((prev) => [...prev, evaluationId])
    } else {
      setSelectedEvaluations((prev) => prev.filter((id) => id !== evaluationId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEvaluations(evaluations.map((item) => item.id))
    } else {
      setSelectedEvaluations([])
    }
  }

  const handleDeleteToggle = (evaluationId: string, checked: boolean) => {
    if (checked) {
      setSelectedForDelete((prev) => [...prev, evaluationId])
    } else {
      setSelectedForDelete((prev) => prev.filter((id) => id !== evaluationId))
    }
  }

  const handleSelectAllForDelete = (checked: boolean) => {
    if (checked) {
      setSelectedForDelete(evaluations.map((item) => item.id))
    } else {
      setSelectedForDelete([])
    }
  }

  const handleDeleteSingle = async (evaluationId: string) => {
    debugLog("Starting single delete for ID:", evaluationId)
    setIsDeleting(true)

    try {
      debugLog("Before delete - evaluations count:", evaluations.length)
      const success = await deleteAHPEvaluation(evaluationId)
      debugLog("Delete result:", success)

      if (success) {
        toast({
          title: "Başarılı",
          description: "Değerlendirme başarıyla silindi.",
        })
        debugLog("Delete successful, refreshing data...")
      } else {
        toast({
          title: "Hata",
          description: "Değerlendirme silinirken bir sorun oluştu.",
          variant: "destructive",
        })
        debugLog("Delete failed")
      }
    } catch (error) {
      debugLog("Delete error:", error)
      console.error("Silme hatası:", error)
      toast({
        title: "Hata",
        description: `Değerlendirme silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      debugLog("Refreshing evaluations after single delete...")
      await loadEvaluations()
      setIsDeleting(false)
      debugLog("Single delete operation completed")
    }
  }

  const handleDeleteMultiple = async () => {
    if (selectedForDelete.length === 0) return

    debugLog("Starting multiple delete for IDs:", selectedForDelete)
    setIsDeleting(true)

    try {
      debugLog("Before multiple delete - evaluations count:", evaluations.length)
      const success = await deleteMultipleAHPEvaluations(selectedForDelete)
      debugLog("Multiple delete result:", success)

      if (success) {
        toast({
          title: "Başarılı",
          description: `${selectedForDelete.length} adet değerlendirme başarıyla silindi.`,
        })
        debugLog("Multiple delete successful")
      } else {
        toast({
          title: "Hata",
          description: "Seçilen değerlendirmeler silinirken bir sorun oluştu.",
          variant: "destructive",
        })
        debugLog("Multiple delete failed")
      }
    } catch (error) {
      debugLog("Multiple delete error:", error)
      console.error("Toplu silme hatası:", error)
      toast({
        title: "Hata",
        description: `Seçilen değerlendirmeler silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      debugLog("Refreshing evaluations after multiple delete...")
      await loadEvaluations()
      setSelectedForDelete([])
      setIsDeleting(false)
      debugLog("Multiple delete operation completed")
    }
  }

  const handleDeleteAll = async () => {
    debugLog("Starting delete all operation")
    setIsDeleting(true)

    try {
      debugLog("Before delete all - evaluations count:", evaluations.length)
      const success = await deleteAllAHPEvaluations()
      debugLog("Delete all result:", success)

      if (success) {
        toast({
          title: "Başarılı",
          description: "Tüm değerlendirmeler başarıyla silindi.",
        })
        debugLog("Delete all successful")
      } else {
        toast({
          title: "Hata",
          description: "Tüm değerlendirmeler silinirken bir sorun oluştu.",
          variant: "destructive",
        })
        debugLog("Delete all failed")
      }
    } catch (error) {
      debugLog("Delete all error:", error)
      console.error("Tümünü silme hatası:", error)
      toast({
        title: "Hata",
        description: `Tüm değerlendirmeler silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      debugLog("Refreshing evaluations after delete all...")
      await loadEvaluations()
      setSelectedForDelete([])
      setIsDeleting(false)
      debugLog("Delete all operation completed")
    }
  }

  const handleProceedToTopsis = () => {
    if (selectedEvaluations.length === 0) {
      toast({
        title: "Uyarı",
        description: "TOPSIS analizine geçmek için en az bir değerlendirme seçmelisiniz.",
        variant: "default",
      })
      return
    }
    const selectedIdsParam = JSON.stringify(selectedEvaluations)
    router.push(`/topsis?selectedIds=${encodeURIComponent(selectedIdsParam)}`)
  }

  const exportToExcel = async () => {
    if (selectedEvaluations.length === 0) {
      toast({
        title: "Uyarı",
        description: "Excel'e aktarmak için en az bir değerlendirme seçmelisiniz.",
        variant: "default",
      })
      return
    }

    setIsExporting(true)
    try {
      const selectedEvals = evaluations.filter((evaluation) => selectedEvaluations.includes(evaluation.id))
      const leafCriteria = getLeafCriteria()

      const wb = XLSX.utils.book_new()

      selectedEvals.forEach((evaluation) => {
        const userData = []
        userData.push(["Kriter Adı", "Ağırlık (%)", "Kriter Tipi"])
        leafCriteria.forEach((criterion) => {
          const weight = evaluation.global_weights[criterion.id] || 0
          userData.push([
            criterion.name,
            (weight * 100).toFixed(2),
            criterion.type === "benefit" ? "Fayda Kriteri" : "Maliyet Kriteri",
          ])
        })
        const ws = XLSX.utils.aoa_to_sheet(userData)
        ws["!cols"] = [{ wch: 40 }, { wch: 15 }, { wch: 20 }]
        const sheetName = evaluation.user_name.substring(0, 31)
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      })

      const avgData = []
      avgData.push(["Kriter Adı", "Ortalama Ağırlık (%)", "Kriter Tipi", "Kullanılan Değerlendirme Sayısı"])
      leafCriteria.forEach((criterion) => {
        const weight = averageWeights[criterion.id] || 0
        avgData.push([
          criterion.name,
          (weight * 100).toFixed(2),
          criterion.type === "benefit" ? "Fayda Kriteri" : "Maliyet Kriteri",
          selectedEvals.length,
        ])
      })
      const avgWs = XLSX.utils.aoa_to_sheet(avgData)
      avgWs["!cols"] = [{ wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 25 }]
      XLSX.utils.book_append_sheet(wb, avgWs, "Ortalama Ağırlıklar")

      const wbArray = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Başarılı",
        description: "Değerlendirmeler Excel'e başarıyla aktarıldı.",
      })
    } catch (error) {
      console.error("Excel export hatası:", error)
      toast({
        title: "Hata",
        description: "Excel'e aktarılırken bir sorun oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const leafCriteria = getLeafCriteria()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Değerlendirmeler yükleniyor...</p>
        </div>
      </div>
    )
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
                <h1 className="text-2xl font-bold text-gray-900">Toplu Ağırlıklar</h1>
                <p className="text-sm text-gray-600">AHP Değerlendirmelerinin Toplu Analizi</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {debugMode && (
                <Button
                  onClick={() => setDebugMode(!debugMode)}
                  variant="outline"
                  size="sm"
                  className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
                >
                  Debug: {debugMode ? "ON" : "OFF"}
                </Button>
              )}
              {!dbConnected && (
                <Badge variant="destructive" className="mr-2">
                  Veritabanı Bağlantısı Yok!
                </Badge>
              )}
              <Button onClick={refreshEvaluations} disabled={isRefreshing} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Yenile
              </Button>
              {selectedEvaluations.length > 0 && (
                <Button
                  onClick={exportToExcel}
                  disabled={isExporting}
                  variant="outline"
                  size="sm"
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Dışa Aktarılıyor..." : "Excel'e Aktar"}
                </Button>
              )}
              <Button onClick={handleProceedToTopsis} disabled={selectedEvaluations.length === 0}>
                <TrendingUp className="h-4 w-4 mr-2" />
                TOPSIS Analizine Geç
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Debug Panel */}
          {debugMode && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">Debug Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Toplam Değerlendirme:</strong> {evaluations.length}
                  </div>
                  <div>
                    <strong>DB Bağlantısı:</strong> {dbConnected ? "✅ Bağlı" : "❌ Bağlı Değil"}
                  </div>
                  <div>
                    <strong>Seçili (Analiz):</strong> {selectedEvaluations.length}
                  </div>
                  <div>
                    <strong>Seçili (Silme):</strong> {selectedForDelete.length}
                  </div>
                  <div className="col-span-2">
                    <strong>Seçili ID'ler (Silme):</strong> {selectedForDelete.join(", ") || "Yok"}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Özet Bilgiler */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{evaluations.length}</p>
                    <p className="text-sm text-gray-600">Toplam Değerlendirme</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Calculator className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{selectedEvaluations.length}</p>
                    <p className="text-sm text-gray-600">Seçilen Değerlendirme</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{leafCriteria.length}</p>
                    <p className="text-sm text-gray-600">Değerlendirme Kriteri</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Değerlendirme Seçimi */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    AHP Değerlendirmeleri
                  </CardTitle>
                  <CardDescription>
                    TOPSIS analizinde kullanılacak değerlendirmeleri seçin. Seçilen değerlendirmelerin ağırlıkları
                    ortalaması alınacaktır.
                  </CardDescription>
                </div>
                {evaluations.length > 0 && (
                  <div className="flex items-center space-x-2">
                    {selectedForDelete.length > 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={isDeleting}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Seçilenleri Sil ({selectedForDelete.length})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Seçilen Değerlendirmeleri Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                              {selectedForDelete.length} adet değerlendirmeyi silmek istediğinizden emin misiniz? Bu
                              işlem geri alınamaz.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteMultiple} className="bg-red-600 hover:bg-red-700">
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isDeleting}>
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Tümünü Sil
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tüm Değerlendirmeleri Sil</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tüm AHP değerlendirmelerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve
                            tüm veriler kaybolacaktır.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">
                            Tümünü Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {evaluations.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Henüz AHP değerlendirmesi bulunmuyor.</p>
                  <Link href="/hierarchical-comparison">
                    <Button className="mt-4">İlk Değerlendirmeyi Yapın</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="select-all"
                          checked={selectedEvaluations.length === evaluations.length && evaluations.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium">
                          Tümünü Seç (Analiz)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="select-all-delete"
                          checked={selectedForDelete.length === evaluations.length && evaluations.length > 0}
                          onCheckedChange={handleSelectAllForDelete}
                        />
                        <label htmlFor="select-all-delete" className="text-sm font-medium text-red-600">
                          Tümünü Seç (Silme)
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Analiz</TableHead>
                          <TableHead className="w-12">Sil</TableHead>
                          <TableHead>Kullanıcı Adı</TableHead>
                          <TableHead>Değerlendirme Tarihi</TableHead>
                          <TableHead>Tutarlılık Durumu</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {evaluations.map((evaluation) => {
                          const isConsistent = Object.values(evaluation.consistency_results).every(
                            (result: any) => result.isConsistent,
                          )

                          return (
                            <TableRow key={evaluation.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedEvaluations.includes(evaluation.id)}
                                  onCheckedChange={(checked) =>
                                    handleEvaluationToggle(evaluation.id, checked as boolean)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Checkbox
                                  checked={selectedForDelete.includes(evaluation.id)}
                                  onCheckedChange={(checked) => handleDeleteToggle(evaluation.id, checked as boolean)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{evaluation.user_name}</TableCell>
                              <TableCell>{new Date(evaluation.updated_at).toLocaleDateString("tr-TR")}</TableCell>
                              <TableCell>
                                <Badge variant={isConsistent ? "default" : "destructive"}>
                                  {isConsistent ? "Tutarlı" : "Tutarsız"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <Button variant="ghost" size="sm">
                                    Detayları Gör
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Değerlendirmeyi Sil</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          "{evaluation.user_name}" kullanıcısının değerlendirmesini silmek
                                          istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteSingle(evaluation.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Sil
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ortalama Ağırlıklar */}
          {selectedEvaluations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Ortalama Kriter Ağırlıkları
                </CardTitle>
                <CardDescription>
                  Seçilen {selectedEvaluations.length} değerlendirmenin ortalama ağırlıkları
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
