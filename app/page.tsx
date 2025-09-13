// app/page.tsx
import Link from 'next/link'
import Brand from '@/components/Brand'
import Button from '@/components/Button'
import { site } from '@/site.config'

export default function Page() {
  return (
    <main className="container py-14">
      {/* HEADER */}
      <header className="flex items-center justify-between">
        <Brand />
        {/* Evita montado en móvil: oculto hasta md */}
        <nav className="hidden md:flex text-sm text-stone gap-8">
          <a href="#como" className="hover:text-charcoal">Cómo funciona</a>
          <a href="#para-quien" className="hover:text-charcoal">Para quién</a>
          <a href="#precios" className="hover:text-charcoal">Precios</a>
        </nav>
      </header>

      {/* HERO (sin CTA duro arriba) */}
      <section className="mt-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
            Tu menú semanal más barato, en 1 clic
          </h1>
          <p className="mt-5 text-lg text-graphite">
            Usamos <strong>IA</strong> para planificar 7 días con ingredientes locales, cantidades en <strong>g/ml/ud</strong> y <strong>costo estimado</strong> según tu ciudad.
          </p>

          {/* CTA suave: llevamos a "cómo funciona" */}
          <div className="mt-8">
            <a href="#como" className="inline-block underline decoration-amber decoration-4 underline-offset-4">
              Ver cómo funciona ↓
            </a>
          </div>

          {/* Value props rápidos */}
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-graphite">
            <li className="bg-card rounded-2xl p-4 shadow-soft border border-line">Listas con cantidades (g/ml/ud)</li>
            <li className="bg-card rounded-2xl p-4 shadow-soft border border-line">Costo estimado por ciudad</li>
            <li className="bg-card rounded-2xl p-4 shadow-soft border border-line">PDF + compartir por WhatsApp</li>
          </ul>
        </div>

        {/* Vista previa mini (calma la ansiedad) */}
        <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
          <div className="text-sm text-stone mb-2">Vista previa</div>
          <div className="rounded-2xl border border-line p-4 text-sm">
            <div className="font-semibold">Día 1: Arroz con pollo</div>
            <div className="text-graphite">Ingredientes: 180 g arroz, 280 g pollo, 140 g tomate…</div>
            <div className="text-stone mt-1">Estimado (Bogotá): COP 9.200</div>
          </div>
        </div>
      </section>

      {/* DOLOR → BENEFICIO */}
      <section className="mt-20">
        <h2 className="text-3xl font-bold">¿Te pasa esto?</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="text-xl font-semibold">“¿Qué cocino hoy?” todos los días</div>
            <p className="text-graphite mt-2">
              Olvida la improvisación: te damos 7 platos con cantidades exactas y pasos claros.
            </p>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="text-xl font-semibold">Poco tiempo para almuerzos</div>
            <p className="text-graphite mt-2">
              Menús aptos para <strong>llevar</strong> en porta, pensados para preparar en 30–45 min.
            </p>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="text-xl font-semibold">El mercado se dispara</div>
            <p className="text-graphite mt-2">
              Lista consolidada por categorías y <strong>costo estimado</strong> por ciudad para evitar extras.
            </p>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA (explicación + prueba social ligera) */}
      <section id="como" className="mt-24">
        <h2 className="text-3xl font-bold">¿Cómo lo hacemos con IA?</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="font-semibold mb-2">1) Entendemos tu contexto</div>
            <p className="text-graphite">Ciudad, personas, tiempo, equipo y preferencias.</p>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="font-semibold mb-2">2) Generamos 7 días</div>
            <p className="text-graphite">Platos con cantidades (g/ml/ud) y lista consolidada.</p>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="font-semibold mb-2">3) Estimamos costo</div>
            <p className="text-graphite">Precios de referencia locales y suma por categoría.</p>
          </div>
        </div>
        {/* Mensaje de prueba social corto */}
        <p className="text-sm text-stone mt-4">
          “Por fin dejo de improvisar. Ahorro y varío.” · “Perfecto para mis almuerzos de oficina.”
        </p>
      </section>

      {/* PARA QUIÉN */}
      <section id="para-quien" className="mt-24">
        <h2 className="text-3xl font-bold">Ideal para</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="text-xl font-semibold">Almuerzos para llevar</div>
            <p className="text-graphite mt-2">
              Menús prácticos que aguantan transporte y recalentado.
            </p>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="text-xl font-semibold">Hogar sin quebrarte la cabeza</div>
            <p className="text-graphite mt-2">
              Deja de pensar cada día qué hacer: semana resuelta en minutos.
            </p>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="text-xl font-semibold">Presupuesto cuidado</div>
            <p className="text-graphite mt-2">
              Menos desperdicio, compras precisas, costo total a la vista.
            </p>
          </div>
        </div>
      </section>

      {/* PRECIOS (oferta irresistible) */}
      <section id="precios" className="mt-24">
        <h2 className="text-3xl font-bold">Precio</h2>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="text-2xl font-bold">Gratis</div>
            <div className="text-graphite mt-2">Incluye {site.trials.free} intentos.</div>
            <p className="text-sm text-stone mt-2">
              Ideal para probar si se ajusta a tu estilo y ciudad.
            </p>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border-2 border-amber p-6">
            <div className="text-2xl font-bold">De por vida</div>
            <div className="text-graphite mt-2">Acceso ilimitado. Soporte básico.</div>
            <div className="mt-4 text-3xl font-extrabold">
              ${site.pricing.lifetimeUSD} <span className="text-base font-semibold text-stone">USD</span>
            </div>
            <p className="text-sm text-stone mt-2">
              {site.copy?.lifetimePitch ?? 'Acceso de por vida. 3 intentos gratis para probar.'}
            </p>
          </div>
        </div>
      </section>

      {/* CTA PRINCIPAL (ahora sí) */}
      <section id="prueba" className="mt-14 text-center">
        <div className="inline-flex flex-col items-center gap-4">
          <Link href="/demo">
            <Button>Probar gratis ({site.trials.free} intentos)</Button>
          </Link>
          <span className="text-xs text-stone">
            Sin tarjetas. Puedes cancelar cuando quieras. Resultados en segundos.
          </span>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-24">
        <h2 className="text-3xl font-bold">Preguntas frecuentes</h2>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="font-semibold">¿Los precios son exactos?</div>
            <p className="text-graphite mt-2">
              No, son estimados según tu ciudad y pueden variar por tienda/temporada.
            </p>
          </div>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="font-semibold">¿Puedo cambiar ingredientes?</div>
            <p className="text-graphite mt-2">Sí, puedes ajustar y volver a generar.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-24 py-10 text-sm text-stone">
        © {new Date().getFullYear()} {site.brand} · {site.domain}
      </footer>
    </main>
  )
}
