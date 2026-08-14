import { Delivery } from './components/Delivery'
import { FloatingOrder } from './components/FloatingOrder'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Location } from './components/Location'
import { Marquee } from './components/Marquee'
import { Products } from './components/Products'
import { Toppings } from './components/Toppings'

export default function App() {
  return (
    <>
      <a
        href="#produtos"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-acai-700 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para o cardápio
      </a>

      <Header />

      <main className="pb-20 sm:pb-0">
        <Hero />
        <Marquee />
        <Products />
        <Toppings />
        <Delivery />
        <Location />
      </main>

      <Footer />
      <FloatingOrder />
    </>
  )
}
