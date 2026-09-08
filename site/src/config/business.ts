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

/**
 * Bairro com taxa diferente da taxa base do município, normalmente porque é
 * mais longe. Os nomes são comparados sem acento e sem caixa, e o primeiro da
 * lista é o que o cliente lê na tela: os demais são só as variações que ele
 * costuma digitar.
 */
export interface DistrictFee {
  readonly districts: readonly string[]
  readonly fee: number
}

/** Município atendido e o que a entrega custa nele. */
export interface DeliveryArea {
  readonly city: string
  readonly state: string
  /** Taxa que vale nos bairros sem valor próprio em `districtFees`. */
  readonly fee: number
  /**
   * Bairros com taxa própria. Também funcionam como apelido do município no
   * checkout: quem escreve "Campo Grande" ou "Marcílio de Noronha" no campo de
   * município cai no município certo em vez de ouvir que não entregamos ali.
   */
  readonly districtFees?: readonly DistrictFee[]
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
  readonly pickup: {
    /** true quando o cliente pode buscar o pedido na loja. false esconde a opção. */
    readonly enabled: boolean
    /** Piso do tempo de preparo: o pedido fica pronto para buscar a partir daqui. */
    readonly minMinutes: number
    /**
     * O que o cliente lê ao escolher retirada, quando `address.street` ainda
     * está vazio e não há endereço para mostrar na tela.
     */
    readonly note: string
  }
  readonly payments: {
    /**
     * Chave Pix da loja, no formato exato em que o banco a reconhece. O código
     * copia e cola é montado com ela, então errar o formato faz o app do
     * cliente recusar o pagamento:
     *
     * - Telefone: com DDI e sinal, `+5527992853101`
     * - CPF ou CNPJ: só dígitos, `12345678000199`
     * - E-mail: em minúsculas
     * - Aleatória: a chave inteira, com os hifens
     *
     * Vazia esconde o Pix copia e cola: o cliente ainda escolhe Pix, mas
     * combina o pagamento pelo WhatsApp.
     */
    readonly pixKey: string
    /** Nome do recebedor que o app do banco mostra ao cliente. */
    readonly pixHolder: string
    /** Município do recebedor, exigido pelo padrão do Banco Central. */
    readonly pixCity: string
    /**
     * true quando a loja leva maquininha na entrega. A loja não tem maquininha:
     * cartão é passado no sistema, na hora do pedido.
     */
    readonly cardOnDelivery: boolean
    /** true quando a loja aceita dinheiro (e precisa levar troco). */
    readonly cash: boolean
    /**
     * Pagamento na hora, pelo site, no checkout da InfinitePay (Pix ou cartão
     * em até 12x). Ligar aqui só mostra a opção na tela: quem cobra de verdade
     * é a função servidor, e ela exige a variável INFINITEPAY_HANDLE
     * configurada no Netlify. Ligar sem a variável faz o cliente ver a opção e
     * receber erro na hora de pagar. Ver `docs/infinitepay.md`.
     */
    readonly onlineCheckout: boolean
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
      {
        city: 'Viana',
        state: 'ES',
        fee: 3,
        // Bairros de Viana. Os mais distantes custam 5; os de perto seguem nos 3
        // do município e ficam listados para o cliente que responde o bairro no
        // lugar do município ser reconhecido do mesmo jeito.
        districtFees: [
          { districts: ['Canaã'], fee: 5 },
          { districts: ['Bairro Universal', 'Universal'], fee: 5 },
          { districts: ['Marcílio de Noronha', 'Marcílio'], fee: 5 },
          { districts: ['Primavera'], fee: 5 },
          { districts: ['Nova Bethânia'], fee: 3 },
          { districts: ['Vila Bethânia'], fee: 3 },
          { districts: ['Vila Rica'], fee: 3 },
          { districts: ['Arlindo Villaschi'], fee: 3 },
          { districts: ['Vale do Sol'], fee: 3 },
          { districts: ['Areinha'], fee: 3 },
          { districts: ['Caxias do Sul'], fee: 3 },
        ],
      },
      {
        city: 'Cariacica',
        state: 'ES',
        fee: 6,
        districtFees: [{ districts: ['Campo Grande'], fee: 6 }],
      },
    ],
    freeShippingFrom: null,
    minMinutes: 40,
  },
  pickup: {
    enabled: true,
    minMinutes: 20,
    note: 'A gente manda o endereço exato da retirada no WhatsApp junto com a confirmação do pedido.',
  },
  payments: {
    pixKey: 'reginasoares0187@gmail.com',
    pixHolder: 'Açaiteria MR',
    pixCity: 'Viana',
    // A loja não leva maquininha na entrega: cartão só pelo sistema, na hora do
    // pedido. Dinheiro é aceito, com o cliente dizendo no checkout para quanto
    // precisa de troco.
    //
    // O cartão depende de INFINITEPAY_HANDLE, SUPABASE_URL e
    // SUPABASE_SERVICE_ROLE_KEY no Netlify: sem elas o cliente escolhe cartão e
    // leva erro na hora de pagar.
    cardOnDelivery: false,
    cash: true,
    onlineCheckout: true,
  },
}
