import { supabase } from '../lib/supabase'

/**
 * Avaliações que os clientes enviam depois de receber o pedido.
 *
 * A avaliação entra no banco no momento em que o cliente envia, então a loja
 * vê todas no painel, em qualquer aparelho. Publicar é um segundo passo, feito
 * pela loja: só o que ela marcar como publicado aparece na seção de
 * depoimentos do site, e o RLS garante que o resto ninguém vê.
 */

export interface Review {
  readonly id: string
  /** Número do pedido avaliado. */
  readonly orderCode: string | null
  /** Nota de 1 a 5. */
  readonly rating: number
  readonly text: string
  readonly customerName: string
  /** Bairro de quem escreveu, para dar contexto no depoimento. */
  readonly district: string
  /** true quando o cliente liberou o depoimento para o site. */
  readonly mayPublish: boolean
  /** true quando a loja publicou de fato. */
  readonly published: boolean
  readonly createdAt: string
}

interface ReviewRow {
  id: string
  order_code: string | null
  rating: number
  comment: string
  customer_name: string
  district: string
  may_publish: boolean
  published: boolean
  created_at: string
}

const SELECT = 'id, order_code, rating, comment, customer_name, district, may_publish, published, created_at'

const toReview = (row: ReviewRow): Review => ({
  id: row.id,
  orderCode: row.order_code,
  rating: row.rating,
  text: row.comment,
  customerName: row.customer_name,
  district: row.district,
  mayPublish: row.may_publish,
  published: row.published,
  createdAt: row.created_at,
})

/** Tudo que chegou. Só a loja enxerga, e só depois de entrar no painel. */
export const listReviews = async (): Promise<readonly Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select(SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as ReviewRow[]).map(toReview)
}

/** O que o site mostra na seção de depoimentos. Aberto a qualquer visitante. */
export const listPublishedReviews = async (): Promise<readonly Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select(SELECT)
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as ReviewRow[]).map(toReview)
}

export interface NewReview {
  readonly orderCode: string
  readonly rating: number
  readonly text: string
  readonly customerName: string
  readonly mayPublish: boolean
}

export const saveReview = async (review: NewReview): Promise<void> => {
  const { error } = await supabase.from('reviews').insert({
    order_code: review.orderCode,
    rating: review.rating,
    comment: review.text.trim(),
    customer_name: review.customerName.trim(),
    may_publish: review.mayPublish,
    // Publicar é decisão da loja, sempre. O cliente só autoriza.
    published: false,
  })
  if (error) throw error
}

/** Liga e desliga o depoimento na seção do site. */
export const setReviewPublished = async (id: string, published: boolean): Promise<void> => {
  const { error } = await supabase.from('reviews').update({ published }).eq('id', id)
  if (error) throw error
}

/** Bairro exibido junto do depoimento. A loja preenche ao publicar. */
export const setReviewDistrict = async (id: string, district: string): Promise<void> => {
  const { error } = await supabase.from('reviews').update({ district: district.trim() }).eq('id', id)
  if (error) throw error
}

export const removeReview = async (id: string): Promise<void> => {
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw error
}

/** Média das notas recebidas. `null` enquanto não houver nenhuma. */
export const averageRating = (reviews: readonly Review[]): number | null => {
  if (reviews.length === 0) return null
  return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
}
