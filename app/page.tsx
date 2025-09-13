import Link from 'next/link'
import Brand from '@/components/Brand'
import Button from '@/components/Button'
import { site } from '@/site.config'
import { useState } from 'react'

export default function Page() {
  const [open, setOpen] = useState(false)

  return (
    <main className="min-h-screen bg-background">
      {/* HEADER sticky */}
      <header className="sticky top-0 z-40 border-b border-line bg-white/80 backdrop-blur">
        <div className="container mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Brand />
          <nav className="hidden md:flex items-center gap-6 text-sm text-graphite">
            <a href="#como" className="hover:text-charcoal">Cómo funciona</a>
            <a href="#para-quien" className="hover:text-charcoal">Para quién</a>
            <a href="#recibes" className="hover:text-charcoal">Qué recibes</a>
            <a href="#precios" className="hover:text-charcoal">Precio</a>
            <Link href="/demo"><Button>Probar gratis (3 intentos)</Button></Link>
          </nav>
          <button
            className="md:hidden inline-flex items-center justify-center rounded-xl border border-line px-3 py-2 text-sm"
            onClick={()=>setOpen(v=>!v)}
            aria-label="Abrir menú"
          >
            ☰
          </button>
        </div>
        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-line bg-white">
            <div className="container mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3 text-sm">
              <a href="#como" onClick={()=>setOpen(false)} className="hover:text-charcoal">Cómo funciona</a>
              <a href="#para-quien" onClick={()=>setOpen(false)} className="hover:text-charcoal">Para quién</a>
              <a href="#recibes" onClick={()=>setOpen(false)} className="hover:text-charcoal">Qué recibes</a>
              <a href="#precios" onClick={()=>setOpen(false)} className="hover:text-charcoal">Precio</a>
              <Link href="/demo" onClick={()=>setOpen(false)} className="mt-1">
                <Button className="w-full">Probar gratis (3 intentos)</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="container mx-auto max-w-6xl px-4 pt-12 pb-10 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
            Tu menú semanal más barato, en 1 clic
          </h1>
          <p className="mt-4 text-lg text-graphite">
            Usamos <strong>IA</strong> para planificar 7 días con ingredientes locales, cantidades en <strong>g/ml/ud</strong> y
            <strong> costo estimado</strong> según tu ciudad. Vuelve cada semana: <strong>acceso de por vida</strong>.
          </p>
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-graphite">
            <li className="bg-card rounded-2xl p-4 shadow-soft border border-line">Personaliza: dieta, alergias, equipo y tiempo</li>
            <li className="bg-card rounded-2xl p-4 shadow-soft border border-line">Lista consolidada por categorías</li>
            <li className="bg-card rounded-2xl p-4 shadow-soft border border-line">Costo por categoría y total</li>
            <li className="bg-card rounded-2xl p-4 shadow-soft border border-line">PDF listo para compartir</li>
          </ul>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/demo"><Button className="px-6 py-3 text-base">Generar mi menú ahora</Button></Link>
            <a href="#precios" className="text-sm underline decoration-amber decoration-4 underline-offset-4">
              Acceso de por vida por ${site.pricing?.lifetimeUSD ?? '9.97'} USD
            </a>
          </div>
        </div>

        <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
          <div className="text-sm text-stone mb-2">Vista previa</div>
          <div className="rounded-2xl border border-line p-4 text-sm bg-white">
            <div className="font-semibold">Día 1: Arroz con pollo</div>
            <div className="text-graphite">Ingredientes: 180 g arroz, 280 g pollo, 140 g tomate…</div>
            <div className="text-stone mt-1">Estimado (Bogotá): COP 9.200</div>
          </div>
        </div>
      </section>

      {/* PARA QUIÉN */}
      <section id="para-quien" className="container mx-auto max-w-6xl px-4 mt-8">
        <h2 className="text-3xl font-bold">Ideal para</h2>
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
            <p className="text-graphite mt-2">Minimizamos desperdicios, consolidamos lista y estimamos costos.</p>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como" className="container mx-auto max-w-6xl px-4 mt-16">
        <h2 className="text-3xl font-bold">¿Cómo lo hacemos con IA?</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="font-semibold mb-2">1) Entendemos tu contexto</div>
            <p className="text-graphite">Ciudad, personas, dieta, alergias, tiempo, equipo y preferencias.</p>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="font-semibold mb-2">2) Generamos 7 días</div>
            <p className="text-graphite">Platos con cantidades (g/ml/ud) y lista consolidada por categorías.</p>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="font-semibold mb-2">3) Estimamos costo</div>
            <p className="text-graphite">Usamos referencia por ciudad y mostramos subtotales y total.</p>
          </div>
        </div>
      </section>

      {/* QUÉ RECIBES */}
      <section id="recibes" className="container mx-auto max-w-6xl px-4 mt-16">
        <h2 className="text-3xl font-bold">Qué recibes</h2>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="text-xl font-semibold">Menú semanal (7 días)</div>
            <p className="text-graphite mt-2">Con instrucciones, tips y cantidades ajustadas a tus personas.</p>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="text-xl font-semibold">PDF listo para compartir</div>
            <p className="text-graphite mt-2">Resumen, lista consolidada, costos y recomendación de tienda.</p>
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" className="container mx-auto max-w-6xl px-4 mt-16">
        <h2 className="text-3xl font-bold">Precio</h2>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="text-2xl font-bold">Gratis</div>
            <div className="text-graphite mt-2">Incluye 3 intentos para probar.</div>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border-2 border-amber p-6">
            <div className="text-2xl font-bold">De por vida</div>
            <div className="text-graphite mt-2">Acceso ilimitado. Soporte básico.</div>
            <div className="mt-4 text-3xl font-extrabold">${site.pricing?.lifetimeUSD ?? '9.97'} <span className="text-base font-semibold text-stone">USD</span></div>
            <p className="text-sm text-stone mt-2">Vuelve cada semana y genera un nuevo menú.</p>
            <div className="mt-4"><Link href="/demo"><Button className="w-full">Generar mi menú</Button></Link></div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="container mx-auto max-w-6xl px-4 mt-16 py-10 text-sm text-stone">
        © {new Date().getFullYear()} {site.brand ?? 'PLATY'} · {site.domain ?? 'platy.app'}
      </footer>
    </main>
  )
}

