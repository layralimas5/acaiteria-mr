import { toppingGroups } from '../data/products'
import { OrderButton } from './OrderButton'

export function Toppings() {
  return (
    <section id="montar" className="scroll-mt-24 bg-acai-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-acai-600">Monte o seu</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Mais de 18 complementos
          </h2>
          <p className="mt-3 text-base text-muted">
            A quantidade inclusa muda conforme o tamanho. Complemento extra sai por R$ 2,50 cada.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {toppingGroups.map((group) => (
            <div key={group.title} className="rounded-card border border-acai-100 bg-white p-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-acai-700">{group.title}</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-full bg-acai-50 px-3 py-1.5 text-sm font-medium text-acai-800"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <OrderButton>Montar meu açaí</OrderButton>
        </div>
      </div>
    </section>
  )
}
