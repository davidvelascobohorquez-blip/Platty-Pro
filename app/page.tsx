// app/page.tsx
import Link from 'next/link'
import Brand from '@/components/Brand'
import Button from '@/components/Button'
import { site } from '@/site.config'

export default function Page() {
  return (
    <main className="container py-10 md:py-14">
      {/* HEADER */}
      <header className="flex items-center justify-between">
        {/* centrado en mobile, izquierda en desktop */}
        <Brand className="mx-auto md:mx-0" />
        {/* oculto en mobile para que no “se monte”; visible en md+ */}
        <nav className="hidden md:block text-sm text-stone">
          <a href="#como" className="mr-6 hover:text-charcoal">Cómo funciona</a>
          <a href="#para-quien" className="mr-6 hover:text-charcoal">Para quién</a>
          <a href="#precios" className="hover:text-charcoal">Precios</a>
        </nav>
      </header>

      {/* HERO */}
      <section className="mt-10 md:mt-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-center md:text-left">
            Tu menú semanal más barato, en 1 clic
          </h1>
          <p className="mt-5 text-lg text-graphite text-center md:text-left">
            Usamos <strong>IA</strong> para planificar 7 días con ingredientes locales, cantidades en <strong>g/ml/ud</strong> y <strong>costo estimado</strong> según tu ciudad.
          </p>

          {/* CTA arriba: educar primero */}
          <div className="mt-6 flex justify-center md:justify-start">
            <a href="#como" className="underline decoration-amber decoration-4 underline-offset-4">
              Ver cómo funciona ↓
            </a>
          </div>

          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-graphite">
            <li className="bg-card rounded-2xl p-4 shadow-soft border border-line">Listas con cantidades (g/ml/ud)</li>
            <li className="bg-card rounded-2xl p-4 shadow-soft border border-line">Costo estimado por ciudad</li>
            <li className="bg-card rounded-2xl p-4 shadow-soft border border-line">PDF + compartir por WhatsApp</li>
          </ul>
        </div>

        {/* Vista previa dummy cuidada */}
        <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
          <div className="text-sm text-stone mb-2">Vista previa</div>
          <div className="rounded-2xl border border-line p-4 text-sm">
            <div className="font-semibold">Día 1: Arroz con pollo</div>
            <div className="text-graphite">Ingredientes: 180 g arroz, 280 g pollo, 140 g tomate…</div>
            <div className="text-stone mt-1">Estimado (Bogotá): COP 9.200</div>
          </div>
        </div>
      </section>

      {/* PARA QUIÉN */}
      <section id="para-quien" className="mt-24">
        <h2 className="text-3xl font-bold text-center md:text-left">Ideal para</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="text-xl font-semibold">Almuerzos para llevar</div>
            <p className="text-graphite mt-2">Si no tienes tiempo y llevas porta, te armamos menús prácticos y variados.</p>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="text-xl font-semibold">Hogar sin quebrarte la cabeza</div>
            <p className="text-graphite mt-2">Para quien se cansa de pensar cada día qué cocinar y quiere optimizar compras.</p>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="text-xl font-semibold">Presupuesto cuidado</div>
            <p className="text-graphite mt-2">Minimizamos desperdicios, consolidamos lista y estimamos el costo total.</p>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como" className="mt-24">
        <h2 className="text-3xl font-bold text-center md:text-left">¿Cómo lo hacemos con IA?</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="font-semibold mb-2">1) Entendemos tu contexto</div>
            <p className="text-graphite">Ciudad, personas, tiempo de cocina, equipo (electrodomésticos) y preferencias.</p>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="font-semibold mb-2">2) Generamos 7 días variados</div>
            <p className="text-graphite">Rotamos proteínas (pollo, res, cerdo, pescado/atún, huevo/legumbres).</p>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="font-semibold mb-2">3) Estimamos costo</div>
            <p className="text-graphite">Precios base por ciudad y total por categorías con buffer del 10%.</p>
          </div>
        </div>

        {/* CTA principal después de educar */}
        <div className="mt-10 flex flex-col items-center md:items-start gap-3">
          <Link href="/demo"><Button>Probar gratis ({site.trials.free} intentos)</Button></Link>
          <div className="text-sm text-graphite text-center md:text-left">
            Acceso <strong>de por vida</strong> por ${site.pricing.lifetimeUSD} USD — vuelve cada semana y genera tu nuevo plan.
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="mt-24">
        <h2 className="text-3xl font-bold text-center md:text-left">Lo que dicen</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-6 text-graphite">
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">“Por fin dejo de improvisar. Ahorro y varío.”</div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">“Las cantidades exactas me ahorran tiempo y plata.”</div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">“Perfecto para mis almuerzos de oficina.”</div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" className="mt-24">
        <h2 className="text-3xl font-bold text-center md:text-left">Precio</h2>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="text-2xl font-bold">Gratis</div>
            <div className="text-graphite mt-2">Incluye {site.trials.free} intentos.</div>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border-2 border-amber p-6">
            <div className="text-2xl font-bold">De por vida</div>
            <div className="text-graphite mt-2">Acceso ilimitado — vuelve cada semana.</div>
            <div className="mt-4 text-3xl font-extrabold">${site.pricing.lifetimeUSD} <span className="text-base font-semibold text-stone">USD</span></div>
            <p className="text-sm text-stone mt-2">{site.copy?.lifetimePitch ?? 'Acceso de por vida. 3 intentos gratis para probar.'}</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-24 py-10 text-sm text-stone text-center md:text-left">
        © {new Date().getFullYear()} {site.brand} · {site.domain}
      </footer>
    </main>
  )
}

