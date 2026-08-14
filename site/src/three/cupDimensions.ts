export interface CupDimensions {
  readonly radiusTop: number
  readonly radiusBottom: number
  readonly height: number
}

const byProduct: Readonly<Record<string, CupDimensions>> = {
  'copo-300': { radiusTop: 1, radiusBottom: 0.78, height: 1.45 },
  'copo-500': { radiusTop: 1.05, radiusBottom: 0.82, height: 1.8 },
  'copo-700': { radiusTop: 1.12, radiusBottom: 0.88, height: 2.05 },
  'pote-150': { radiusTop: 0.95, radiusBottom: 0.8, height: 1.1 },
  'pote-300': { radiusTop: 1, radiusBottom: 0.84, height: 1.35 },
  'pote-500': { radiusTop: 1.08, radiusBottom: 0.9, height: 1.6 },
  'barca-1l': { radiusTop: 1.35, radiusBottom: 1.08, height: 1.7 },
}

const fallback: CupDimensions = { radiusTop: 1.02, radiusBottom: 0.8, height: 1.6 }

export const dimensionsFor = (productId: string): CupDimensions => byProduct[productId] ?? fallback
