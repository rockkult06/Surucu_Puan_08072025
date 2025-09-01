// lib/criteria-hierarchy.ts
export interface Criterion {
  id: string
  name: string
  type: "benefit" | "cost"
  children?: Criterion[]
}

export const criteriaHierarchy: Criterion[] = [
  {
    id: "main",
    name: "Ana Kriterler",
    type: "benefit", // Ana kriterler için tipin bir önemi yok, sadece hiyerarşi için var
    children: [
      {
        id: "administrative_evaluation",
        name: "İdari Değerlendirme",
        type: "benefit",
        children: [
          {
            id: "overtime_criteria",
            name: "Fazla Mesai Kriterleri",
            type: "benefit",
            children: [
              { id: "unplanned_overtime", name: "Plansız Fazla Mesai", type: "cost" },
              { id: "planned_overtime", name: "Planlı Fazla Mesai", type: "benefit" },
            ],
          },
          {
            id: "accident_criteria",
            name: "Kaza Kriterleri",
            type: "benefit",
            children: [
              { id: "minor_accident", name: "Küçük Kaza", type: "cost" },
              { id: "major_accident", name: "Büyük Kaza", type: "cost" },
            ],
          },
          {
            id: "discipline_criteria",
            name: "Disiplin Kriterleri",
            type: "benefit",
            children: [
              { id: "warning", name: "Uyarı", type: "cost" },
              { id: "reprimand", name: "Kınama", type: "cost" },
              { id: "suspension", name: "Uzaklaştırma", type: "cost" },
            ],
          },
        ],
      },
      {
        id: "technical_evaluation",
        name: "Teknik Değerlendirme (Telemetri)",
        type: "benefit",
        children: [
          { id: "harsh_braking", name: "Sert Fren", type: "cost" },
          { id: "harsh_acceleration", name: "Sert Hızlanma", type: "cost" },
          { id: "harsh_cornering", name: "Sert Viraj", type: "cost" },
          { id: "speeding", name: "Hız Aşımı", type: "cost" },
          { id: "idle_time", name: "Rölanti Süresi", type: "cost" },
          { id: "fuel_consumption", name: "Yakıt Tüketimi", type: "cost" },
        ],
      },
    ],
  },
]

// Yardımcı fonksiyon: Tüm yaprak kriterleri düz bir liste olarak döndürür
export function getLeafCriteria(nodes: Criterion[] = criteriaHierarchy): Criterion[] {
  let leafCriteria: Criterion[] = []
  nodes.forEach((node) => {
    if (node.children && node.children.length > 0) {
      leafCriteria = leafCriteria.concat(getLeafCriteria(node.children))
    } else if (node.id !== "main") {
      // "main" kriterini hariç tut
      leafCriteria.push(node)
    }
  })
  return leafCriteria
}

// Yardımcı fonksiyon: Kriteri ID'ye göre bulur
export function findCriterionById(id: string, nodes: Criterion[] = criteriaHierarchy): Criterion | undefined {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }
    if (node.children) {
      const found = findCriterionById(id, node.children)
      if (found) {
        return found
      }
    }
  }
  return undefined
}

// Yardımcı fonksiyon: Bir kriterin alt kriterlerini döndürür
export function getChildrenCriteria(parentId: string): Criterion[] {
  const parent = findCriterionById(parentId)
  return parent?.children || []
}

// Yardımcı fonksiyon: Bir kriterin ebeveynini bulur
export function findParentCriterion(
  childId: string,
  nodes: Criterion[] = criteriaHierarchy,
  parent: Criterion | null = null,
): Criterion | null {
  for (const node of nodes) {
    if (node.id === childId) {
      return parent
    }
    if (node.children) {
      const found = findParentCriterion(childId, node.children, node)
      if (found) {
        return found
      }
    }
  }
  return null
}

// Yardımcı fonksiyon: Bir kriterin hiyerarşik yolunu döndürür (ID'ler)
export function getCriterionPath(
  criterionId: string,
  nodes: Criterion[] = criteriaHierarchy,
  path: string[] = [],
): string[] | null {
  for (const node of nodes) {
    const newPath = [...path, node.id]
    if (node.id === criterionId) {
      return newPath
    }
    if (node.children) {
      const foundPath = getCriterionPath(criterionId, node.children, newPath)
      if (foundPath) {
        return foundPath
      }
    }
  }
  return null
}
