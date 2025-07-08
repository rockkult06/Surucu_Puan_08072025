"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, Users, FileSpreadsheet, Target, CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge variant="outline" className="mb-4">
              AHP + TOPSIS Hibrit Yaklaşım
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Sürücü Performans
              <span className="text-blue-600"> Değerlendirme</span>
              <br />
              Sistemi
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Toplu taşıma şirketlerinde çalışan sürücülerin performansını objektif ve bilimsel yöntemlerle
              değerlendiren kapsamlı analiz platformu
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/hierarchical-comparison">
                <Button size="lg" className="w-full sm:w-auto">
                  <Calculator className="mr-2 h-5 w-5" />
                  AHP Değerlendirmesi Başlat
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                  Sistem Hakkında
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sistem Özellikleri</h2>
            <p className="text-lg text-gray-600">
              Modern çok kriterli karar verme teknikleri ile güçlendirilmiş performans analizi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AHP Yöntemi */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>AHP Yöntemi</CardTitle>
                <CardDescription>
                  Analitik Hiyerarşi Prosesi ile kriter ağırlıklarının objektif belirlenmesi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    İkili karşılaştırma matrisleri
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Tutarlılık kontrolü (CR ≤ 0.10)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Hiyerarşik kriter yapısı
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* TOPSIS Analizi */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>TOPSIS Analizi</CardTitle>
                <CardDescription>İdeal çözüme benzerliğe göre sürücü performans sıralaması</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    İdeal pozitif/negatif çözümler
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Yakınlık katsayısı hesaplama
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Objektif performans sıralaması
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Çoklu Kullanıcı */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Çoklu Kullanıcı</CardTitle>
                <CardDescription>Birden fazla uzmanın değerlendirmelerinin toplu analizi</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Grup karar verme desteği
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Ortalama ağırlık hesaplama
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Konsensüs analizi
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Veri İşleme */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <FileSpreadsheet className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Veri İşleme</CardTitle>
                <CardDescription>Excel dosya desteği ve CSV formatında sonuç dışa aktarma</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Excel dosya yükleme
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Otomatik veri eşleştirme
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    CSV sonuç indirme
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Gerçek Zamanlı */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Gerçek Zamanlı</CardTitle>
                <CardDescription>Anlık hesaplama ve görsel geri bildirim sistemi</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Anlık tutarlılık kontrolü
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    İnteraktif karşılaştırma
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Görsel ilerleme takibi
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Responsive Tasarım */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Modern Tasarım</CardTitle>
                <CardDescription>Responsive ve kullanıcı dostu arayüz tasarımı</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Mobil uyumlu tasarım
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Kolay navigasyon
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Erişilebilir arayüz
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Değerlendirme Süreci</h2>
            <p className="text-lg text-gray-600">Üç adımda tamamlanan kapsamlı performans analizi</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AHP Karşılaştırma</h3>
              <p className="text-gray-600">Kriterlerin ikili karşılaştırması ile önem ağırlıklarının belirlenmesi</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Veri Yükleme</h3>
              <p className="text-gray-600">Sürücü performans verilerinin Excel dosyası ile sisteme aktarılması</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">TOPSIS Analizi</h3>
              <p className="text-gray-600">Sürücülerin objektif performans sıralaması ve detaylı raporlama</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Performans Değerlendirmenizi Başlatın</h2>
          <p className="text-lg text-gray-600 mb-8">
            Bilimsel yöntemlerle desteklenen objektif sürücü performans analizi için hemen başlayın
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/hierarchical-comparison">
              <Button size="lg" className="w-full sm:w-auto">
                <Calculator className="mr-2 h-5 w-5" />
                AHP Değerlendirmesi
              </Button>
            </Link>
            <Link href="/collective-weights">
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                <Users className="mr-2 h-5 w-5" />
                Toplu Ağırlıklar
              </Button>
            </Link>
            <Link href="/topsis">
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                <TrendingUp className="mr-2 h-5 w-5" />
                TOPSIS Analizi
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
