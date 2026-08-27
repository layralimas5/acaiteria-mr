import { formatPrice } from '../lib/order'

interface CreditCardInfoProps {
  /** Total do pedido, taxa de entrega incluída. */
  readonly total: number
}

/**
 * O que o cliente precisa saber antes de ir para o cartão.
 *
 * Os dados do cartão nunca passam por este site: quem coleta número, validade
 * e CVV é a tela da InfinitePay, que já é certificada para isso. Guardar cartão
 * aqui seria assumir uma responsabilidade que a loja não tem como cumprir.
 *
 * Por isso o bloco explica o pulo para a outra tela antes de o cliente clicar:
 * ninguém gosta de ser jogado num domínio estranho sem aviso na hora de pagar.
 */
export function CreditCardInfo({ total }: CreditCardInfoProps) {
  return (
    <div className="rounded-2xl border border-acai-100 bg-acai-50/70 p-4">
      <p className="text-sm font-bold text-ink">Pague {formatPrice(total)} no cartão</p>

      <ol className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
        <li className="flex gap-2.5">
          <Step n={1} />
          <span>
            Você confirma o pedido aqui embaixo e ele já entra no sistema da loja com o número.
          </span>
        </li>
        <li className="flex gap-2.5">
          <Step n={2} />
          <span>
            Abre a tela de pagamento da <strong className="font-semibold text-ink">InfinitePay</strong>,
            onde você digita os dados do cartão. Crédito em até 12x ou débito.
          </span>
        </li>
        <li className="flex gap-2.5">
          <Step n={3} />
          <span>
            Assim que o pagamento é aprovado, o pedido aparece pago na loja e entra na fila de
            preparo. Chega em casa sem nada para acertar.
          </span>
        </li>
      </ol>

      <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs leading-relaxed text-muted">
        Os dados do cartão são digitados na tela da InfinitePay, não aqui. Este site nunca vê nem
        guarda o número do seu cartão.
      </p>
    </div>
  )
}

function Step({ n }: { readonly n: number }) {
  return (
    <span
      aria-hidden="true"
      className="mt-px grid size-4 shrink-0 place-items-center rounded-full bg-acai-800 text-[10px] font-bold text-white"
    >
      {n}
    </span>
  )
}
