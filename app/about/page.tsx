"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Target, Calculator, TrendingUp, Database, Code, Users, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
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
                <h1 className="text-2xl font-bold text-gray-900">Sistem Hakkında</h1>
                <p className="text-sm text-gray-600">Sürücü Performans Değerlendirme Sistemi Detayları</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Sistem Amacı */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Sistem Amacı
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Bu sistem, toplu taşıma şirketlerinde çalışan sürücülerin performansını objektif ve bilimsel yöntemlerle
                değerlendirmek amacıyla geliştirilmiştir. Geleneksel subjektif değerlendirme yöntemlerinin yerine, çok
                kriterli karar verme tekniklerini kullanarak adil ve tutarlı bir performans ölçümü sağlar.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Ana Hedefler</h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• Objektif performans değerlendirmesi</li>
                    <li>• Çok boyutlu analiz imkanı</li>
                    <li>• Adil ve tutarlı sıralama</li>
                    <li>• Veri odaklı karar verme</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Faydalar</h4>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li>• İnsan kaynaklarında etkinlik</li>
                    <li>• Performans tabanlı ödüllendirme</li>
                    <li>• Eğitim ihtiyaçlarının belirlenmesi</li>
                    <li>• Operasyonel verimliliğin artırılması</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kullanılan Yöntemler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Kullanılan Yöntemler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AHP Yöntemi */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="default">AHP</Badge>
                  Analitik Hiyerarşi Prosesi (Analytic Hierarchy Process)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <p className="text-gray-700">
                    Thomas Saaty tarafından geliştirilen AHP yöntemi, karmaşık karar problemlerini hiyerarşik yapıya
                    dönüştürerek kriterlerin önem ağırlıklarını belirlemek için kullanılır.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Özellikler:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• İkili karşılaştırma matrisleri</li>
                        <li>• Tutarlılık kontrolü (CR ≤ 0.10)</li>
                        <li>• Hiyerarşik yapı desteği</li>
                        <li>• Subjektif değerlendirmelerin objektifleştirilmesi</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Uygulama Alanları:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Kriter ağırlıklarının belirlenmesi</li>
                        <li>• Uzman görüşlerinin toplanması</li>
                        <li>• Grup kararlarında konsensüs</li>
                        <li>• Çok seviyeli değerlendirme</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* TOPSIS Yöntemi */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="secondary">TOPSIS</Badge>
                  İdeal Çözüme Benzerliğe Göre Sıralama (Technique for Order Preference by Similarity to Ideal Solution)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <p className="text-gray-700">
                    Hwang ve Yoon tarafından geliştirilen TOPSIS yöntemi, alternatifleri ideal pozitif çözüme en yakın
                    ve ideal negatif çözümden en uzak olma prensibine göre sıralar.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Çalışma Prensibi:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Karar matrisinin normalizasyonu</li>
                        <li>• Ağırlıklı normalize matris</li>
                        <li>• İdeal pozitif/negatif çözümler</li>
                        <li>• Yakınlık katsayısı hesaplama</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Avantajlar:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Matematiksel olarak sağlam</li>
                        <li>• Kolay anlaşılır sonuçlar</li>
                        <li>• Çok sayıda alternatif desteği</li>
                        <li>• Fayda/maliyet kriteri ayrımı</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Değerlendirme Mantığı */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Değerlendirme Mantığı
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">1</div>
                  <h4 className="font-semibold text-blue-900 mb-2">Kriter Belirleme</h4>
                  <p className="text-sm text-blue-800">İdari ve teknik kriterlerin hiyerarşik yapıda tanımlanması</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">2</div>
                  <h4 className="font-semibold text-green-900 mb-2">Ağırlık Hesaplama</h4>
                  <p className="text-sm text-green-800">AHP yöntemi ile kriterlerin önem ağırlıklarının belirlenmesi</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">3</div>
                  <h4 className="font-semibold text-purple-900 mb-2">Performans Sıralaması</h4>
                  <p className="text-sm text-purple-800">TOPSIS yöntemi ile sürücülerin nihai performans sıralaması</p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">Hibrit Yaklaşım</h4>
                <p className="text-sm text-yellow-800">
                  Sistem, AHP ve TOPSIS yöntemlerini entegre ederek hibrit bir çözüm sunar. AHP ile elde edilen kriter
                  ağırlıkları, TOPSIS analizinde kullanılarak sürücülerin objektif performans skorları hesaplanır.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Kriterler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Değerlendirme Kriterleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ana Kriterler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* İdari Değerlendirme */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">İdari Değerlendirme</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Sürücünün idari kurallara ve şirket politikalarına uyumunu ölçer
                  </p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm">Sağlık Sebebiyle Devamsızlık</h4>
                      <p className="text-xs text-gray-500">
                        Sağlık raporu nedeniyle işe gelmediği gün sayısı (Maliyet)
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm">Fazla Mesaili Çalışma Gayreti</h4>
                      <p className="text-xs text-gray-500">Fazla mesaiye kalma istekliliği (Fayda)</p>
                      <ul className="text-xs text-gray-400 ml-4 mt-1">
                        <li>• Normal Fazla Mesai</li>
                        <li>• Hafta Tatili Mesaisi</li>
                        <li>• Resmi Tatil Mesaisi</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm">Kaza Durumu</h4>
                      <p className="text-xs text-gray-500">Yapılan km'ye göre kaza sayısı (Maliyet)</p>
                      <ul className="text-xs text-gray-400 ml-4 mt-1">
                        <li>• Ölümle Sonuçlanan Kaza</li>
                        <li>• Yaralanmalı Kaza</li>
                        <li>• Maddi Hasarlı Kaza</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm">Disiplin Durumu</h4>
                      <p className="text-xs text-gray-500">Yapılan km'ye göre disiplin cezası (Maliyet)</p>
                      <ul className="text-xs text-gray-400 ml-4 mt-1">
                        <li>• 1. Derece Disiplin İhlali</li>
                        <li>• 2. Derece Disiplin İhlali</li>
                        <li>• 3. Derece Disiplin İhlali</li>
                        <li>• 4. Derece Disiplin İhlali</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Teknik Değerlendirme */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-green-600">Teknik Değerlendirme (Telemetri)</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Sürücünün araç kullanım alışkanlıklarını telemetri verileri ile ölçer
                  </p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm">Hatalı Hızlanma Sayısı</h4>
                      <p className="text-xs text-gray-500">Ani ve gereksiz hızlanma sayısı (Maliyet)</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm">Hız İhlal Sayısı</h4>
                      <p className="text-xs text-gray-500">Belirlenen hız limitlerinin aşılma sayısı (Maliyet)</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm">Motor Uyarısı</h4>
                      <p className="text-xs text-gray-500">Motor arızası veya kritik uyarı sayısı (Maliyet)</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm">Rölanti İhlal Sayısı</h4>
                      <p className="text-xs text-gray-500">Gereksiz rölanti çalışma süresi (Maliyet)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Kriter Tipleri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Badge variant="default" className="mb-2">
                      Fayda Kriterleri
                    </Badge>
                    <p className="text-sm text-gray-600">
                      Yüksek değerlerin daha iyi performansı gösterdiği kriterler (örn: fazla mesai saatleri)
                    </p>
                  </div>
                  <div>
                    <Badge variant="destructive" className="mb-2">
                      Maliyet Kriterleri
                    </Badge>
                    <p className="text-sm text-gray-600">
                      Düşük değerlerin daha iyi performansı gösterdiği kriterler (örn: kaza sayısı, disiplin cezası)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Veri Yapısı */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Veri Yapısı ve Teknoloji
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Veri Modeli */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Veri Modeli</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">AHP Değerlendirmeleri</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Kullanıcı bilgileri</li>
                        <li>• Karşılaştırma matrisleri</li>
                        <li>• Kriter ağırlıkları</li>
                        <li>• Tutarlılık sonuçları</li>
                        <li>• Zaman damgaları</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Sürücü Verileri</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Sürücü kimlik bilgileri</li>
                        <li>• Performans metrikleri</li>
                        <li>• Telemetri verileri</li>
                        <li>• İdari kayıtlar</li>
                        <li>• TOPSIS skorları</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Teknoloji Stack */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Teknoloji Yığını</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Frontend</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Next.js 14 (App Router)</li>
                      <li>• React 18</li>
                      <li>• TypeScript</li>
                      <li>• Tailwind CSS</li>
                      <li>• Shadcn/ui</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Backend</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Next.js API Routes</li>
                      <li>• Neon PostgreSQL</li>
                      <li>• Server Actions</li>
                      <li>• JSON veri formatı</li>
                      <li>• RESTful API</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Özellikler</h4>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• Excel dosya desteği</li>
                      <li>• CSV export</li>
                      <li>• Responsive tasarım</li>
                      <li>• Real-time hesaplama</li>
                      <li>• Çoklu kullanıcı</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Frontend ve Backend Özellikler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Sistem Özellikleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Frontend Özellikler */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="outline">Frontend</Badge>
                  Kullanıcı Arayüzü Özellikleri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">İnteraktif Karşılaştırma</h4>
                      <p className="text-sm text-gray-600">
                        Slider tabanlı ikili karşılaştırma arayüzü ile kolay kriter değerlendirmesi
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Gerçek Zamanlı Hesaplama</h4>
                      <p className="text-sm text-gray-600">
                        Kullanıcı girişleri anında işlenerek tutarlılık kontrolü ve ağırlık hesaplaması
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Görsel Geri Bildirim</h4>
                      <p className="text-sm text-gray-600">
                        İlerleme çubukları, renkli göstergeler ve durum rozetleri ile kullanıcı deneyimi
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">Responsive Tasarım</h4>
                      <p className="text-sm text-gray-600">
                        Masaüstü, tablet ve mobil cihazlarda optimum görüntüleme deneyimi
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Veri Görselleştirme</h4>
                      <p className="text-sm text-gray-600">
                        Tablolar, grafikler ve istatistiksel özetlerle sonuçların görsel sunumu
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Dosya İşleme</h4>
                      <p className="text-sm text-gray-600">
                        Excel dosya yükleme ve CSV formatında sonuç indirme desteği
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Backend Özellikler */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Backend</Badge>
                  Sunucu Tarafı Özellikleri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">Matematiksel Hesaplamalar</h4>
                      <p className="text-sm text-gray-600">
                        AHP ve TOPSIS algoritmalarının TypeScript ile optimize edilmiş implementasyonu
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Veri Persistansı</h4>
                      <p className="text-sm text-gray-600">
                        PostgreSQL veritabanında JSON formatında esnek veri saklama
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">API Güvenliği</h4>
                      <p className="text-sm text-gray-600">
                        Veri doğrulama, hata yönetimi ve güvenli API endpoint'leri
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">Performans Optimizasyonu</h4>
                      <p className="text-sm text-gray-600">
                        Veritabanı indeksleme, önbellekleme ve optimize edilmiş sorgular
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Ölçeklenebilirlik</h4>
                      <p className="text-sm text-gray-600">
                        Çok kullanıcılı ortam desteği ve büyük veri setleri için optimize edilmiş yapı
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Veri İntegrasyonu</h4>
                      <p className="text-sm text-gray-600">
                        Excel dosya parsing, veri validasyonu ve format dönüştürme işlemleri
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kullanım Senaryoları */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Kullanım Senaryoları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">İnsan Kaynakları Departmanı</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Yıllık performans değerlendirmeleri</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Terfi ve ödüllendirme kararları</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Eğitim ihtiyaçlarının belirlenmesi</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Objektif performans raporlaması</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Operasyon Yönetimi</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Filo verimliliğinin artırılması</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Güvenlik performansının izlenmesi</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Yakıt tüketimi optimizasyonu</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Operasyonel maliyet azaltma</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
