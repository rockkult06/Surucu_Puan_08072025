// Kriter hiyerarşisi ve yardımcı fonksiyonlar

export interface Criterion {
  id: string
  name: string
  level: number
  parentId?: string
  children: string[]
  isLeaf: boolean
  type: "benefit" | "cost"
  description: string
  excelAliases?: string[] // Excel sütun isimleri için alternatif isimler
}

export const criteriaHierarchy: Record<string, Criterion> = {
  // Ana Kriterler (Seviye 1)
  admin: {
    id: "admin",
    name: "İdari Değerlendirme",
    level: 1,
    children: ["attendance", "overtime", "accident", "discipline"],
    isLeaf: false,
    type: "benefit",
    description: "Sürücünün idari kurallara ve şirket politikalarına uyumunu ölçer",
  },
  technical: {
    id: "technical",
    name: "Teknik Değerlendirme (Telemetri)",
    level: 1,
    children: ["acceleration", "speed", "engine", "idle"],
    isLeaf: false,
    type: "benefit",
    description: "Sürücünün araç kullanım alışkanlıklarını telemetri verileri ile ölçer",
  },

  // İdari Değerlendirme Alt Kriterleri (Seviye 2)
  attendance: {
    id: "attendance",
    name: "Sağlık Sebebiyle Devamsızlık Durumu",
    level: 2,
    parentId: "admin",
    children: [],
    isLeaf: true,
    type: "cost",
    description: "Sürücünün sağlık raporu nedeniyle işe gelmediği gün sayısı",
    excelAliases: ["Sağlık Sebebiyle Devamsızlık Durumu"],
  },
  overtime: {
    id: "overtime",
    name: "Fazla Mesaili Çalışma Gayreti",
    level: 2,
    parentId: "admin",
    children: ["normal_overtime", "weekend_overtime", "holiday_overtime"],
    isLeaf: false,
    type: "benefit",
    description: "Sürücünün fazla mesaiye kalma istekliliği ve performansı",
  },
  accident: {
    id: "accident",
    name: "Yapılan Km'ye Göre Kaza Durumu (Atölye Dışı)",
    level: 2,
    parentId: "admin",
    children: ["fatal_accident", "injury_accident", "material_damage_accident"],
    isLeaf: false,
    type: "cost",
    description: "Sürücünün yaptığı kilometreye oranla karıştığı kaza sayısı ve türü",
  },
  discipline: {
    id: "discipline",
    name: "Yapılan Km'ye Göre Disiplin Durumu",
    level: 2,
    parentId: "admin",
    children: [
      "first_degree_dismissal",
      "second_degree_dismissal",
      "third_degree_dismissal",
      "fourth_degree_dismissal",
    ],
    isLeaf: false,
    type: "cost",
    description: "Sürücünün yaptığı kilometreye oranla aldığı disiplin cezalarının derecesi",
  },

  // Fazla Mesai Alt Kriterleri (Seviye 3)
  normal_overtime: {
    id: "normal_overtime",
    name: "Normal Fazla Mesai",
    level: 3,
    parentId: "overtime",
    children: [],
    isLeaf: true,
    type: "benefit",
    description: "Hafta içi yapılan normal fazla mesai süresi",
    excelAliases: ["Normal Fazla Mesai"],
  },
  weekend_overtime: {
    id: "weekend_overtime",
    name: "Hafta Tatili Mesaisi",
    level: 3,
    parentId: "overtime",
    children: [],
    isLeaf: true,
    type: "benefit",
    description: "Hafta sonu tatillerinde yapılan mesai süresi",
    excelAliases: ["Hafta Tatili Mesaisi"],
  },
  holiday_overtime: {
    id: "holiday_overtime",
    name: "Resmi Tatil Mesaisi",
    level: 3,
    parentId: "overtime",
    children: [],
    isLeaf: true,
    type: "benefit",
    description: "Resmi tatillerde yapılan mesai süresi",
    excelAliases: ["Resmi Tatil Mesaisi"],
  },

  // Kaza Alt Kriterleri (Seviye 3)
  fatal_accident: {
    id: "fatal_accident",
    name: "Ölümle Sonuçlanan Kaza",
    level: 3,
    parentId: "accident",
    children: [],
    isLeaf: true,
    type: "cost",
    description: "Ölümle sonuçlanan kaza sayısı",
    excelAliases: ["Ölümle Sonuçlanan Kaza"],
  },
  injury_accident: {
    id: "injury_accident",
    name: "Yaralanmalı Kaza",
    level: 3,
    parentId: "accident",
    children: [],
    isLeaf: true,
    type: "cost",
    description: "Yaralanma ile sonuçlanan kaza sayısı",
    excelAliases: ["Yaralanmalı Kaza"],
  },
  material_damage_accident: {
    id: "material_damage_accident",
    name: "Maddi Hasarlı Kaza",
    level: 3,
    parentId: "accident",
    children: [],
    isLeaf: true,
    type: "cost",
    description: "Sadece maddi hasarla sonuçlanan kaza sayısı",
    excelAliases: ["Maddi Hasarlı Kaza"],
  },

  // Disiplin Alt Kriterleri (Seviye 3)
  first_degree_dismissal: {
    id: "first_degree_dismissal",
    name: "1'nci Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı",
    level: 3,
    parentId: "discipline",
    children: [],
    isLeaf: true,
    type: "cost",
    description: "En hafif disiplin ihlallerinden sevk sayısı",
    excelAliases: ["1'nci Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı"],
  },
  second_degree_dismissal: {
    id: "second_degree_dismissal",
    name: "2'nci Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı",
    level: 3,
    parentId: "discipline",
    children: [],
    isLeaf: true,
    type: "cost",
    description: "Orta düzey disiplin ihlallerinden sevk sayısı",
    excelAliases: ["2'nci Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı"],
  },
  third_degree_dismissal: {
    id: "third_degree_dismissal",
    name: "3'ncü Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı",
    level: 3,
    parentId: "discipline",
    children: [],
    isLeaf: true,
    type: "cost",
    description: "Ciddi disiplin ihlallerinden sevk sayısı",
    excelAliases: [
      "3'ncü Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı",
      "3'nci Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı",
    ],
  },
  fourth_degree_dismissal: {
    id: "fourth_degree_dismissal",
    name: "4'ncü Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı",
    level: 3,
    parentId: "discipline",
    children: [],
    isLeaf: true,
    type: "cost",
    description: "En ağır disiplin ihlallerinden sevk sayısı",
    excelAliases: [
      "4'ncü Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı",
      "4'nci Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı",
    ],
  },

  // Teknik Değerlendirme Alt Kriterleri (Seviye 2)
  acceleration: {
    id: "acceleration",
    name: "Hatalı Hızlanma Sayısı",
    level: 2,
    parentId: "technical",
    children: [],
    isLeaf: true,
    type: "cost",
    description: "Ani ve gereksiz hızlanma sayısı",
    excelAliases: ["Hatalı Hızlanma Sayısı"],
  },
  speed: {
    id: "speed",
    name: "Hız İhlal Sayısı",
    level: 2,
    parentId: "technical",
    children: [],
    isLeaf: true,
    type: "cost",
    description: "Belirlenen hız limitlerinin aşılma sayısı",
    excelAliases: ["Hız İhlal Sayısı"],
  },
  engine: {
    id: "engine",
    name: "Motor (Kırmızı Lamba) Uyarısı",
    level: 2,
    parentId: "technical",
    children: [],
    isLeaf: true,
    type: "cost",
    description: "Motor arızası veya kritik uyarı lambasının yanma sayısı",
    excelAliases: ["Motor (Kırmızı Lamba) Uyarısı", "Motor (KırmızıLamba) Uyarısı"],
  },
  idle: {
    id: "idle",
    name: "Rölanti İhlal Sayısı",
    level: 2,
    parentId: "technical",
    children: [],
    isLeaf: true,
    type: "cost",
    description: "Aracın gereksiz yere rölantide çalışma süresi veya sayısı",
    excelAliases: ["Rölanti İhlal Sayısı"],
  },
}

// Yardımcı fonksiyonlar
export function getCriteriaById(id: string): Criterion | undefined {
  return criteriaHierarchy[id]
}

export function getMainCriteria(): Criterion[] {
  return Object.values(criteriaHierarchy).filter((c) => c.level === 1)
}

export function getLeafCriteria(): Criterion[] {
  return Object.values(criteriaHierarchy).filter((c) => c.isLeaf)
}

export function getCriteriaPath(criterionId: string): Criterion[] {
  const path: Criterion[] = []
  let current = getCriteriaById(criterionId)

  while (current) {
    path.unshift(current)
    current = current.parentId ? getCriteriaById(current.parentId) : undefined
  }

  return path
}

export function getCriteriaBenefitType(criterionId: string): "benefit" | "cost" {
  const criterion = getCriteriaById(criterionId)
  return criterion?.type || "benefit"
}

export function initializeHierarchyData(): Record<string, number[][]> {
  const hierarchyData: Record<string, number[][]> = {}

  // Ana kriterler için matris
  const mainCriteria = getMainCriteria()
  if (mainCriteria.length > 1) {
    hierarchyData["main"] = Array(mainCriteria.length)
      .fill(null)
      .map(() => Array(mainCriteria.length).fill(1))
  }

  // Her ana kriter için alt kriterler matrisi
  Object.values(criteriaHierarchy).forEach((criterion) => {
    if (!criterion.isLeaf && criterion.children.length > 1) {
      hierarchyData[criterion.id] = Array(criterion.children.length)
        .fill(null)
        .map(() => Array(criterion.children.length).fill(1))
    }
  })

  return hierarchyData
}

export function getExcelColumnMappings(): Record<string, string> {
  const leafCriteria = getLeafCriteria()
  const mappings: Record<string, string> = {}

  leafCriteria.forEach((criterion) => {
    mappings[criterion.name] = criterion.id
    // Excel aliases'ları da ekle
    if (criterion.excelAliases) {
      criterion.excelAliases.forEach((alias) => {
        mappings[alias] = criterion.id
      })
    }
  })

  return mappings
}

// Excel sütun ismi ile kriter ID'sini eşleştir
export function matchExcelColumnToCriteria(columnName: string): string | null {
  const leafCriteria = getLeafCriteria()

  // Önce tam eşleşme ara
  for (const criterion of leafCriteria) {
    if (criterion.excelAliases?.includes(columnName)) {
      return criterion.id
    }
  }

  // Sonra benzer isim ara (normalize edilmiş)
  const normalizedColumn = normalizeString(columnName)

  for (const criterion of leafCriteria) {
    // Kriter adı ile karşılaştır
    if (normalizeString(criterion.name) === normalizedColumn) {
      return criterion.id
    }

    // Excel aliases ile karşılaştır
    if (criterion.excelAliases) {
      for (const alias of criterion.excelAliases) {
        if (normalizeString(alias) === normalizedColumn) {
          return criterion.id
        }
      }
    }
  }

  return null
}

// String'i normalize et (boşlukları kaldır, küçük harfe çevir, özel karakterleri temizle)
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "") // Boşlukları kaldır
    .replace(/['"]/g, "") // Tırnak işaretlerini kaldır
    .replace(/[()]/g, "") // Parantezleri kaldır
    .trim()
}
