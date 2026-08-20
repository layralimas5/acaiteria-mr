import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../../cart/CartContext'
import type { CartItem } from '../../cart/CartContext'
import type { DeliveryArea } from '../../config/business'
import {
  cheapestDeliveryArea,
  deliveryFee,
  findDeliveryArea,
  formatPrice,
  missingForFreeShipping,
  whatsappUrl,
} from '../../lib/order'
import { errorMessage } from '../../lib/supabase'
import { saveLastOrder } from '../../orders/lastOrder'
import { orderMessage } from '../../orders/messages'
import { createOrder } from '../../orders/store'
import type { Customer, Order } from '../../orders/types'
import { CheckoutForm } from '../CheckoutForm'

type Stage = 'cart' | 'checkout' | 'done'

interface OrderPanelProps {
  /** Volta para a montagem, seja para somar outro item ou recomeçar. */
  readonly onBuildMore: () => void
  /** Dados de quem já pediu daqui, para o checkout começar preenchido. */
  readonly knownCustomer: Customer | null
  /** true logo depois de somar um item, para a tela confirmar o que aconteceu. */
  readonly justAdded: boolean
}

/**
 * O pedido dentro do próprio painel do montador: terminou a etapa 5, a mesma
 * caixa passa a mostrar a sacola, o pagamento e a confirmação. Nada de seção
 * nova nem de gaveta lateral.
 */
export function OrderPanel({ onBuildMore, knownCustomer, justAdded }: OrderPanelProps) {
  const { items, total, count, increment, decrement, remove, clear } = useCart()
  const [stage, setStage] = useState<Stage>('cart')
  const [order, setOrder] = useState<Order | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Quem já pediu daqui volta com a cidade da última entrega; o resto só ganha
  // município no checkout. A taxa mora aqui porque o cabeçalho, o resumo e o
  // pedido gravado precisam da mesma conta.
  const [area, setArea] = useState<DeliveryArea | null>(() =>
    findDeliveryArea(knownCustomer?.city ?? ''),
  )

  // Sem cidade, a sacola mostra a menor taxa possível e avisa que é um piso:
  // é mais honesto do que fechar um valor que ainda pode subir.
  const feeIsEstimate = area === null
  const fee = deliveryFee(total, area ?? cheapestDeliveryArea())
  const missingForFree = missingForFreeShipping(total)
  const grandTotal = total + fee

  const handleSubmit = (customer: Customer) => {
    if (sending) return
    // A cidade vem no cliente, então a taxa é recalculada aqui: é ela que vai
    // para o banco, e não a que estava na tela antes de ele escolher.
    const chargedFee = deliveryFee(total, findDeliveryArea(customer.city ?? '') ?? area)

    setSending(true)
    setError(null)

    // A aba do WhatsApp precisa abrir agora, no clique: aberta depois da
    // resposta do banco, o navegador entende como popup e bloqueia. Ela abre
    // vazia e recebe o endereço quando o pedido tiver número.
    const tab = window.open('', '_blank', 'noopener,noreferrer')

    void createOrder(items, total, chargedFee, customer)
      .then((created) => {
        saveLastOrder(created)
        setOrder(created)
        setStage('done')
        clear()

        const url = whatsappUrl(orderMessage(created))
        if (tab) {
          tab.location.href = url
        } else {
          window.location.href = url
        }
      })
      .catch((cause: unknown) => {
        tab?.close()
        setError(errorMessage(cause))
      })
      .finally(() => setSending(false))
  }

  if (stage === 'done' && order) {
    return <OrderDone order={order} onBuildMore={onBuildMore} />
  }

  // Esvaziou a sacola pela lixeira ou pelo botão: volta a montar.
  if (items.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-base font-bold text-ink">Seu pedido está vazio</p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
          Monte um açaí ou sorvete do seu jeito, escolhendo tamanho, sabor e complementos.
        </p>
        <button
          type="button"
          onClick={onBuildMore}
          className="mt-5 rounded-full bg-acai-800 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-acai-900"
        >
          Montar meu pedido
        </button>
      </div>
    )
  }

  if (stage === 'checkout') {
    return (
      <div>
        <header className="mb-5">
          <h3 className="text-xl font-extrabold leading-tight tracking-tight text-ink sm:text-2xl">
            Pagamento e entrega
          </h3>
          <p className="mt-1 text-sm text-muted">
            {count} {count === 1 ? 'item' : 'itens'} ·{' '}
            {feeIsEstimate
              ? `a partir de ${formatPrice(grandTotal)}`
              : `total de ${formatPrice(grandTotal)}`}
          </p>
        </header>

        <CheckoutForm
          subtotal={total}
          area={area}
          onAreaChange={setArea}
          initialCustomer={knownCustomer}
          onSubmit={handleSubmit}
          onCancel={() => setStage('cart')}
          sending={sending}
          error={error}
        />
      </div>
    )
  }

  return (
    <div>
      <header className="mb-5">
        <h3 className="text-xl font-extrabold leading-tight tracking-tight text-ink sm:text-2xl">
          Seu pedido
        </h3>
        <p className={`mt-1 text-sm ${justAdded ? 'font-semibold text-green-700' : 'text-muted'}`}>
          {justAdded
            ? 'Item adicionado. Quer adicionar mais um pedido?'
            : `${count} ${count === 1 ? 'item' : 'itens'} na sacola.`}
        </p>
      </header>

      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl border border-acai-100 p-4"
            >
              <CartLine
                item={item}
                onIncrement={() => increment(item.id)}
                onDecrement={() => decrement(item.id)}
                onRemove={() => remove(item.id)}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <button
        type="button"
        onClick={onBuildMore}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-acai-200 px-5 py-4 text-sm font-bold text-acai-800 transition-colors hover:border-acai-400 hover:bg-acai-50"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          +
        </span>
        Quer adicionar mais um pedido?
      </button>

      <dl className="mt-6 space-y-1.5 border-t border-acai-100 pt-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Itens</dt>
          <dd className="font-semibold text-ink">{formatPrice(total)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Entrega</dt>
          <dd className={`font-semibold ${fee === 0 ? 'text-green-700' : 'text-ink'}`}>
            {fee === 0
              ? 'Grátis'
              : feeIsEstimate
                ? `a partir de ${formatPrice(fee)}`
                : formatPrice(fee)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-acai-100 pt-2">
          <dt className="text-base font-bold text-ink">
            {feeIsEstimate ? 'Total a partir de' : 'Total'}
          </dt>
          <dd className="text-2xl font-extrabold text-acai-800">{formatPrice(grandTotal)}</dd>
        </div>
      </dl>

      {missingForFree > 0 && (
        <p className="mt-3 rounded-xl bg-acai-50 px-3 py-2.5 text-xs font-semibold text-acai-800">
          Faltam {formatPrice(missingForFree)} para a entrega sair de graça.
        </p>
      )}

      <button
        type="button"
        onClick={() => setStage('checkout')}
        className="mt-5 w-full rounded-full bg-acai-800 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-acai-900/20 transition-colors hover:animate-pulse-soft hover:bg-acai-900"
      >
        Ir para o pagamento
      </button>

      <button
        type="button"
        onClick={clear}
        className="mt-2 w-full rounded-full px-6 py-2 text-xs font-semibold text-muted transition-colors hover:text-acai-800"
      >
        Esvaziar pedido
      </button>
    </div>
  )
}

interface CartLineProps {
  readonly item: CartItem
  readonly onIncrement: () => void
  readonly onDecrement: () => void
  readonly onRemove: () => void
}

function CartLine({ item, onIncrement, onDecrement, onRemove }: CartLineProps) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">{item.size.name}</p>
          <p className="text-xs text-muted">
            {item.product.baseLabel}: {item.base.name}
          </p>
        </div>
        <p className="shrink-0 text-sm font-extrabold text-acai-800">
          {formatPrice(item.unitPrice * item.quantity)}
        </p>
      </div>

      {item.toppings.length > 0 && (
        <p className="mt-2 text-xs leading-relaxed text-muted">
          {item.toppings.map((topping) => topping.name).join(' · ')}
        </p>
      )}

      {item.notes && (
        <p className="mt-2 rounded-xl bg-acai-50 px-3 py-2 text-xs leading-relaxed text-acai-800">
          <span className="font-bold">Obs.:</span> {item.notes}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDecrement}
            aria-label={`Diminuir ${item.size.name}`}
            className="grid size-8 place-items-center rounded-full border border-acai-200 text-acai-800"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-bold text-ink">{item.quantity}</span>
          <button
            type="button"
            onClick={onIncrement}
            aria-label={`Aumentar ${item.size.name}`}
            className="grid size-8 place-items-center rounded-full border border-acai-200 text-acai-800"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-semibold text-muted transition-colors hover:text-acai-800"
        >
          Remover
        </button>
      </div>
    </>
  )
}

function OrderDone({ order, onBuildMore }: { readonly order: Order; readonly onBuildMore: () => void }) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-green-100 text-green-700">
        <svg viewBox="0 0 20 20" aria-hidden="true" className="size-7 fill-none stroke-current stroke-[2.5]">
          <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      <p className="mt-4 text-lg font-extrabold text-ink">Pedido #{order.code} enviado</p>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Ele já entrou no sistema da loja. A confirmação e o tempo de entrega chegam pelo WhatsApp.
      </p>

      <a
        href={whatsappUrl(orderMessage(order))}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 rounded-full bg-acai-800 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-acai-900"
      >
        Abrir a conversa no WhatsApp
      </a>

      <button
        type="button"
        onClick={onBuildMore}
        className="mt-2 rounded-full px-6 py-2 text-xs font-semibold text-muted transition-colors hover:text-acai-800"
      >
        Fazer outro pedido
      </button>
    </div>
  )
}
