/**
 * Ponto único de configuração da loja.
 * Trocar os valores aqui muda o site inteiro: nenhum componente guarda
 * telefone, link ou endereço hardcoded.
 */

export type WeekDay = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'

export interface OpeningHour {
  readonly label: string
  readonly days: readonly WeekDay[]
  readonly opensAt: string
  readonly closesAt: string
}

/** Município atendido e o que a entrega custa nele. */
export interface DeliveryArea {
  readonly city: string
  readonly state: string
  readonly fee: number
}

export interface Artwork {
  readonly src: string
  readonly srcSmall: string
  readonly alt: string
  /** Chamada escrita por cima da arte, na galeria. Vazia deixa a arte limpa. */
  readonly headline?: string
  /** Linha de apoio da chamada, escondida em telas bem pequenas. */
  readonly subline?: string
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
  /**
   * Artes de fundo do banner, em rodízio. `src` é a versão grande (a partir de
   * 768px) e `srcSmall` a versão leve do celular. Lista vazia deixa o banner só
   * com o roxo da marca; com uma arte só, não há rodízio.
   */
  readonly heroImages: readonly Artwork[]
  /** Tempo de cada arte no ar, em milissegundos. */
  readonly heroRotationMs: number
  /**
   * Artes da marca exibidas inteiras na galeria, sem texto por cima.
   * Lista vazia esconde a seção.
   */
  readonly gallery: readonly Artwork[]
  /** true enquanto a operação for só entrega, sem atendimento no balcão. */
  readonly deliveryOnly: boolean
  readonly delivery: {
    /** URL da loja no iFood. Vazio esconde o botão automaticamente. */
    readonly ifoodUrl: string
    /**
     * Municípios atendidos, cada um com a própria taxa. O primeiro é o padrão
     * do checkout: é onde a loja fica e de onde vem a maioria dos pedidos.
     */
    readonly areas: readonly DeliveryArea[]
    /** Acima desse valor a taxa zera. `null` desliga a regra de frete grátis. */
    readonly freeShippingFrom: number | null
    /** Piso do prazo de entrega: o pedido chega a partir daqui, nunca antes. */
    readonly minMinutes: number
  }
  readonly payments: {
    /** Chave Pix mostrada no checkout. Vazia esconde o aviso. */
    readonly pixKey: string
    readonly pixHolder: string
    /** true quando a loja leva maquininha na entrega. */
    readonly cardOnDelivery: boolean
    /** true quando a loja aceita dinheiro (e precisa levar troco). */
    readonly cash: boolean
  }
}

export const business: BusinessConfig = {
  name: 'Açaiteria MR',
  shortName: 'MR',
  tagline: 'Açaí de verdade, do jeito que você monta',
  description:
    'Açaí cremoso batido na hora, com complementos generosos e entrega rápida. Escolha o tamanho, monte do seu jeito e receba em casa. Só delivery, sem fila e sem sair do sofá.',
  siteUrl: 'https://acaiteriamr.com.br',
  whatsappNumber: '5527992853101',
  whatsappMessage: 'Oi! Quero fazer um pedido na Açaiteria MR.',
  instagramHandle: 'mracai9',
  address: {
    street: '',
    district: '',
    city: 'Viana',
    state: 'ES',
    zip: '',
    mapsUrl: 'https://maps.google.com/?q=Açaiteria+MR+Viana+ES',
  },
  hours: [
    {
      label: 'Seg, ter, qua, sex e sáb',
      days: ['seg', 'ter', 'qua', 'sex', 'sab'],
      opensAt: '18:30',
      closesAt: '23:00',
    },
  ],
  heroImages: [
    {
      src: '/imagem/banner.webp',
      srcSmall: '/imagem/banner-960.webp',
      alt: 'Copos e potes de açaí da Açaiteria MR em vários tamanhos',
    },
    {
      src: '/imagem/banner-3.webp',
      srcSmall: '/imagem/banner-3-960.webp',
      alt: 'Casal comendo açaí da Açaiteria MR embaixo da logo da marca',
    },
  ],
  heroRotationMs: 5000,
  gallery: [
    {
      src: '/imagem/banner-2.webp',
      srcSmall: '/imagem/banner-2-960.webp',
      alt: 'Casal apaixonado olhando para um pote de açaí da Açaiteria MR',
      headline: 'Pote cheio, sem economia',
      subline: 'Açaí cremoso batido na hora, com 3 complementos grátis em qualquer tamanho.',
    },
    {
      src: '/imagem/banner-3.webp',
      srcSmall: '/imagem/banner-3-960.webp',
      alt: 'Casal comendo açaí da Açaiteria MR embaixo da logo da marca',
      headline: 'Pede um pra cada',
      subline: 'Você monta o seu do seu jeito, ele monta o dele. A gente entrega os dois quentinhos de frio.',
    },
  ],
  deliveryOnly: true,
  delivery: {
    ifoodUrl: '',
    areas: [
      { city: 'Viana', state: 'ES', fee: 3 },
      { city: 'Cariacica', state: 'ES', fee: 6 },
    ],
    freeShippingFrom: null,
    minMinutes: 40,
  },
  payments: {
    pixKey: '',
    pixHolder: 'Açaiteria MR',
    cardOnDelivery: true,
    cash: true,
  },
}
