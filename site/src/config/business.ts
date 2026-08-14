/**
 * Ponto único de configuração da loja.
 * Trocar os valores aqui muda o site inteiro — nenhum componente guarda
 * telefone, link ou endereço hardcoded.
 */

export type WeekDay = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'

export interface OpeningHour {
  readonly label: string
  readonly days: readonly WeekDay[]
  readonly opensAt: string
  readonly closesAt: string
}

export interface BusinessConfig {
  readonly name: string
  readonly shortName: string
  readonly tagline: string
  readonly description: string
  readonly siteUrl: string
  /** Telefone só com dígitos, com DDI. Ex: 5511999999999 */
  readonly whatsappNumber: string
  readonly whatsappMessage: string
  readonly instagramHandle: string
  readonly address: {
    readonly street: string
    readonly district: string
    readonly city: string
    readonly state: string
    readonly zip: string
    readonly mapsUrl: string
  }
  readonly hours: readonly OpeningHour[]
  readonly delivery: {
    /** URL da loja no iFood. Vazio esconde o botão automaticamente. */
    readonly ifoodUrl: string
    readonly freeShippingFrom: number | null
    readonly averageMinutes: number
  }
}

export const business: BusinessConfig = {
  name: 'Açaiteria MR',
  shortName: 'MR',
  tagline: 'Açaí de verdade, do jeito que você monta',
  description:
    'Açaí cremoso batido na hora, com complementos generosos e entrega rápida. Escolha o tamanho, monte do seu jeito e receba em casa.',
  siteUrl: 'https://acaiteriamr.com.br',
  whatsappNumber: '5500000000000',
  whatsappMessage: 'Oi! Quero fazer um pedido na Açaiteria MR.',
  instagramHandle: 'acaiteriamr',
  address: {
    street: 'Rua Exemplo, 123',
    district: 'Centro',
    city: 'Sua Cidade',
    state: 'SP',
    zip: '00000-000',
    mapsUrl: 'https://maps.google.com/?q=Açaiteria+MR',
  },
  hours: [
    { label: 'Segunda a sexta', days: ['seg', 'ter', 'qua', 'qui', 'sex'], opensAt: '13:00', closesAt: '22:00' },
    { label: 'Sábado e domingo', days: ['sab', 'dom'], opensAt: '14:00', closesAt: '23:00' },
  ],
  delivery: {
    ifoodUrl: '',
    freeShippingFrom: 40,
    averageMinutes: 35,
  },
}
