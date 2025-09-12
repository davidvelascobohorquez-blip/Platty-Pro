import Link from 'next/link'
import Brand from '@/components/Brand'
import Button from '@/components/Button'
import { site } from '@/site.config'

export default function Page() {
  return (
    <main className="container py-14">
      <header className="flex items-center justify-between">
        <Brand />
        <nav className="text-sm text-stone">
          <a href="#como" className="mr-6 hover:text-charcoal">Cómo funciona</a>
          <a href="#precios" className="hover:text-charcoal">Precios</a>
        </nav>
      </header>

      <section className="mt-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
            Tu menú semanal más barato, en 1 clic
          </h1>
          <p className="mt-5 text-lg text-graphite">
            Ingredientes locales, cantidades con unidades y <strong>costo estimado</strong> para tu ciudad.
          </p>
          <div className="mt-8 flex gap-4">
            <Link href="/demo"><Button>Probar gratis ({site.trials.free} intentos)</Button></Link>
            <a href="#precios" className="underline decoration-amber decoration-4 underline-offset-4">
              {site.copy.lifetimePitch}
            </a>
          </div>
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-graphite">
            <li className="bg-card rounded-2xl p-4 shadow-soft border border-line">Cenas en 30–45 min</li>
            <li className="bg-card rounded-2xl p-4 shadow-soft border border-line">Lista consolidada (g/ml/ud)</li>
            <li className="bg-card rounded-2xl p-4 shadow-soft border border-line">PDF + WhatsApp</li>
          </ul>
        </div>

        <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
          <div className="text-sm text-stone mb-2">Vista previa</div>
          <div className="rounded-2xl border border-line p-4 text-sm">
            <div className="font-semibold">Día 1: Arroz con pollo</div>
            <div className="text-graphite">Ingredientes: 180 g arroz, 280 g pollo, 140 g tomate…</div>
            <div className="text-stone mt-1">Estimado (Bogotá): COP 9.200</div>
          </div>
        </div>
      </section>

      <section id="como" className="mt-24">
        <h2 className="text-3xl font-bold">Cómo funciona</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">1) Dinos ciudad, personas y preferencias.</div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">2) Recibe Menú Día 1–7 + cantidades + costos.</div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">3) Descarga PDF y comparte por WhatsApp.</div>
        </div>
      </section>

      <section id="precios" className="mt-24">
        <h2 className="text-3xl font-bold">Precio</h2>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="text-2xl font-bold">Gratis</div>
            <div className="text-graphite mt-2">Incluye {site.trials.free} intentos.</div>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border-2 border-amber p-6">
            <div className="text-2xl font-bold">De por vida</div>
            <div className="text-graphite mt-2">Acceso ilimitado. Soporte básico.</div>
            <div className="mt-4 text-3xl font-extrabold">${site.pricing.lifetimeUSD} <span className="text-base font-semibold text-stone">USD</span></div>
            <p className="text-sm text-stone mt-2">{site.copy.lifetimePitch}</p>
          </div>
        </div>
      </section>

      <footer className="mt-24 py-10 text-sm text-stone">
        © {new Date().getFullYear()} {site.brand} · {site.domain}
      </footer>
    </main>
  )
}
