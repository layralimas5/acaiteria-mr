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
  /** Mensagem usada nos CTAs antes da inauguração. */
  readonly preLaunchMessage: string
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
  /**
   * Arte de fundo do banner. `src` é a versão grande (a partir de 768px) e
   * `srcSmall` a versão leve do celular. Com `src` vazio, o banner fica só
   * com o roxo da marca.
   */
  readonly heroImage: {
    readonly src: string
    readonly srcSmall: string
    readonly alt: string
  }
  /** Data de inauguração no formato AAAA-MM-DD. Antes dela o site fica em modo pré-lançamento. */
  readonly launchDate: string
  /** true enquanto a operação for só entrega, sem atendimento no balcão. */
  readonly deliveryOnly: boolean
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
    'Açaí cremoso batido na hora, com complementos generosos e entrega rápida. Escolha o tamanho, monte do seu jeito e receba em casa. Só delivery, sem fila e sem sair do sofá.',
  siteUrl: 'https://acaiteriamr.com.br',
  whatsappNumber: '5500000000000',
  whatsappMessage: 'Oi! Quero fazer um pedido na Açaiteria MR.',
  preLaunchMessage: 'Oi! Quero ser avisado quando a Açaiteria MR abrir, dia 05/09.',
  instagramHandle: 'acaiteriamr',
  address: {
    street: '',
    district: '',
    city: 'Cariacica',
    state: 'ES',
    zip: '',
    mapsUrl: 'https://maps.google.com/?q=Açaiteria+MR+Cariacica+ES',
  },
  hours: [
    { label: 'Segunda a sexta', days: ['seg', 'ter', 'qua', 'qui', 'sex'], opensAt: '13:00', closesAt: '22:00' },
    { label: 'Sábado e domingo', days: ['sab', 'dom'], opensAt: '14:00', closesAt: '23:00' },
  ],
  heroImage: {
    src: '/imagem/banner.webp',
    srcSmall: '/imagem/banner-960.webp',
    alt: 'Copos e potes de açaí da Açaiteria MR em vários tamanhos',
  },
  launchDate: '2026-09-05',
  deliveryOnly: true,
  delivery: {
    ifoodUrl: '',
    freeShippingFrom: 40,
    averageMinutes: 35,
  },
}
