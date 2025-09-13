// app/demo/page.tsx
'use client'

import { useMemo, useState } from 'react'
import Brand from '@/components/Brand'
import Button from '@/components/Button'
import StepperDots from '@/components/StepperDots'
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image as PDFImage } from '@react-pdf/renderer'
import { site } from '@/site.config'

/* ===== Tipos ===== */
type Unit = 'g' | 'ml' | 'ud'
type ItemQty = { name: string; qty: number; unit: Unit; estCOP?: number }
type StoreOpt = { nombre: string; tipo: 'hard-discount' | 'supermercado' }
type Plan = {
  menu: { dia: number; plato: string; ingredientes: ItemQty[]; pasos: string[]; tip: string }[]
  lista: Record<string, ItemQty[]>
  batch: { baseA: string; baseB: string }
  sobrantes: string[]
  meta: { ciudad: string; personas: number; modo: string; moneda?: 'COP' }
  costos?: { porCategoria: Record<string, number>; total: number; nota: string }
  tiendas?: { sugerida: StoreOpt; opciones: StoreOpt[]; mapsUrl: string }
}

/* ===== Utilidades ===== */
const fmtCOP = (n?: number) =>
  typeof n === 'number' ? n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : '-'

/* ===== Estilos PDF ===== */
const pdfStyles = StyleSheet.create({
  page: { padding: 32, fontSize: 12, fontFamily: 'Helvetica' },
  h1: { fontSize: 22, marginBottom: 8 },
  h2: { fontSize: 16, marginTop: 12, marginBottom: 6 },
  small: { fontSize: 10, color: '#555' },
  listItem: { marginBottom: 4 },
  table: { marginTop: 6, borderWidth: 1, borderColor: '#dddddd', borderRadius: 6, overflow: 'hidden' },
  tr: { flexDirection: 'row', alignItems: 'stretch' },
  th: { fontSize: 11, fontFamily: 'Helvetica-Bold', backgroundColor: '#f3f3f3', paddingVertical: 6, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#dddddd' },
  td: { fontSize: 11, paddingVertical: 6, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: '#eeeeee', borderRightWidth: 1, borderRightColor: '#eeeeee' },
})

function PlanPDF({ plan }: { plan: Plan }) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <PDFImage src="/brand/PLATY_wordmark_1800.png" style={{ width: 240 }} />
        </View>

        <Text style={pdfStyles.h1}>
          Menú semanal — {plan.meta.ciudad} · {plan.meta.modo} · {plan.meta.personas} pers
        </Text>
        <Text style={pdfStyles.small}>Incluye lista consolidada, cantidades (g/ml/ud) y costo estimado.</Text>

        <Text style={pdfStyles.h2}>Menú (Día 1–7)</Text>
        {plan.menu.map((d) => (
          <View key={d.dia} style={{ marginBottom: 8 }}>
            <Text>• Día {d.dia}: {d.plato}</Text>
            <Text>  Ingredientes: {d.ingredientes.map((i) => `${i.qty} ${i.unit} ${i.name}`).join('; ')}</Text>
            <Text>  Pasos: {d.pasos.join(' | ')}</Text>
            <Text>  Tip: {d.tip}</Text>
          </View>
        ))}

        <Text style={pdfStyles.h2}>Lista de compras (consolidada)</Text>
        {Object.entries(plan.lista).map(([cat, items]) => (
          <Text key={cat} style={pdfStyles.listItem}>
            {cat}: {items.map((i) => `${i.qty} ${i.unit} ${i.name}`).join('; ')}
          </Text>
        ))}

        {plan.costos && (
          <>
            <Text style={pdfStyles.h2}>Costo estimado</Text>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tr}>
                <Text style={[pdfStyles.th, { flex: 2 }]}>Categoría</Text>
                <Text style={[pdfStyles.th, { flex: 1, textAlign: 'right' }]}>Estimado (COP)</Text>
              </View>
              {Object.entries(plan.costos.porCategoria).map(([cat, val]) => (
                <View key={cat} style={pdfStyles.tr}>
                  <Text style={[pdfStyles.td, { flex: 2 }]}>{cat}</Text>
                  <Text style={[pdfStyles.td, { flex: 1, textAlign: 'right' }]}>{fmtCOP(val)}</Text>
                </View>
              ))}
              <View style={pdfStyles.tr}>
                <Text style={[pdfStyles.td, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>Total</Text>
                <Text style={[pdfStyles.td, { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>{fmtCOP(plan.costos.total)}</Text>
              </View>
            </View>
            <Text style={[pdfStyles.small, { marginTop: 4 }]}>{plan.costos.nota}</Text>
          </>
        )}

        {plan.tiendas && (
          <>
            <Text style={pdfStyles.h2}>Dónde comprar (sugerido)</Text>
            <Text>• Sugerido: {plan.tiendas.sugerida.nombre} ({plan.tiendas.sugerida.tipo})</Text>
            <Text>• Alternativas: {plan.tiendas.opciones.map((o) => o.nombre).join(', ')}</Text>
            <Text style={pdfStyles.small}>Búscalo en mapas: {plan.tiendas.mapsUrl}</Text>
          </>
        )}

        <View style={{ position: 'absolute', bottom: 24, left: 32, right: 32, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={pdfStyles.small}>
            {site.brand} · wa.me/{site.whatsapp} · {site.domain}
          </Text>
          <PDFImage src="/brand/PLATY_logo_icon_1024.png" style={{ width: 28, height: 28 }} />
        </View>
      </Page>
    </Document>
  )
}

/* ===== Página ===== */
export default function DemoPage() {
  const totalSteps = 4
  const [step, setStep] = useState(1)

  // Entradas del usuario (progresivas)
  const [ciudad, setCiudad] = useState<string>('') // vacío para que no salga “prellenado”
  const [personas, setPersonas] = useState<number | null>(null)
  const [modo, setModo] = useState<'30 min' | '45 min' | 'Sin preferencia' | null>(null)
  const [equipo, setEquipo] = useState<'Todo ok' | 'Sin horno' | 'Sin licuadora' | null>(null)
  const [prefs, setPrefs] = useState<string[]>([])

  // Resultado
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(false)

  // Botón siguiente habilitado solo si hay dato en el paso
  const canNext = useMemo(() => {
    if (step === 1) return ciudad.trim().length > 1
    if (step === 2) return !!personas
    if (step === 3) return !!modo && !!equipo
    if (step === 4) return prefs.length > 0 || true // puede continuar sin preferencias
    return false
  }, [step, ciudad, personas, modo, equipo, prefs])

  // Lógica de generación
  async function generarPlan() {
    if (!ciudad || !personas || !modo || !equipo) return
    setLoading(true)
    setPlan(null)
    try {
      const res = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ciudad, personas, modo, equipo, prefs }),
      })
      const data = await res.json()
      setPlan(data)
      setStep(totalSteps + 1)
    } catch (e) {
      alert('No pudimos generar tu menú. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Costos: usa los del backend; si vienen 0 o no vienen, calcula en cliente con estCOP
  const costos = useMemo(() => {
    if (!plan) return null
    if (plan.costos && plan.costos.total > 0) return plan.costos

    const porCategoria: Record<string, number> = {}
    let subtotal = 0
    for (const [cat, items] of Object.entries(plan.lista || {})) {
      const catSum = items.reduce((acc, it) => acc + (it.estCOP || 0), 0)
      porCategoria[cat] = Math.round(catSum)
      subtotal += catSum
    }
    const total = Math.round(subtotal * 1.1)
    return {
      porCategoria,
      total,
      nota: 'Estimado calculado en cliente (+10% buffer). Puede variar por tienda/temporada.',
    }
  }, [plan])

  // Resumen progresivo
  const resumen = useMemo(() => {
    const rows: string[] = []
    if (ciudad) rows.push(`Ciudad: ${ciudad}`)
    if (personas) rows.push(`Personas: ${personas}`)
    if (modo) rows.push(`Modo: ${modo}`)
    if (equipo) rows.push(`Equipo: ${equipo}`)
    if (prefs.length) rows.push(`Prefs: ${prefs.join(', ')}`)
    return rows
  }, [ciudad, personas, modo, equipo, prefs])

  const ready = !!plan

  return (
    <main className="container py-8 md:py-10">
      {/* Header + Progreso */}
      <div className="flex items-center justify-between mb-5">
        <Brand />
        <div className="mt-2 md:mt-0">
          <StepperDots step={Math.min(step, totalSteps)} total={totalSteps} />
        </div>
      </div>

      {/* Volver */}
      {step > 1 && step <= totalSteps && (
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="mb-4 inline-flex items-center gap-2 text-sm text-graphite hover:text-charcoal transition-colors"
        >
          <span aria-hidden>←</span> Volver
        </button>
      )}

      {/* Pasos */}
      {step <= totalSteps && (
        <div className="grid md:grid-cols-2 gap-6" style={{ animation: 'fadeIn .25s ease' }}>
          {/* Card del paso */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            {step === 1 && (
              <>
                <h2 className="text-2xl font-bold">¿En qué ciudad/país estás?</h2>
                <p className="text-sm text-stone mt-1">Usamos tu ciudad para estimar precios locales.</p>
                <input
                  className="mt-4 w-full rounded-2xl border border-line px-4 py-3"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Ej: Bogotá, CO"
                />
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-2xl font-bold">¿Para cuántas personas?</h2>
                <p className="text-sm text-stone mt-1">Escoge el número de comensales.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => setPersonas(n)}
                      className={`px-4 py-2 rounded-2xl border transition-colors ${
                        personas === n ? 'bg-amber border-amber text-charcoal' : 'border-line hover:border-amber'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-2xl font-bold">Tiempo y equipo</h2>
                <p className="text-sm text-stone mt-1">Selecciona <strong>una</strong> opción por línea.</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {['30 min', '45 min', 'Sin preferencia'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setModo(m as any)}
                      className={`px-4 py-2 rounded-2xl border transition-colors ${
                        modo === m ? 'bg-amber border-amber text-charcoal' : 'border-line hover:border-amber'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {['Todo ok', 'Sin horno', 'Sin licuadora'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setEquipo(m as any)}
                      className={`px-4 py-2 rounded-2xl border transition-colors ${
                        equipo === m ? 'bg-amber border-amber text-charcoal' : 'border-line hover:border-amber'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="text-2xl font-bold">Preferencias y presupuesto</h2>
                <p className="text-sm text-stone mt-1">Puedes seleccionar <strong>varias</strong> opciones.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {['Económico', 'Vegetariano', 'Sin lácteos', 'Sin picante', 'Bajo sodio', 'Ninguna'].map((p) => {
                    const on = prefs.includes(p)
                    return (
                      <button
                        key={p}
                        onClick={() => setPrefs(on ? prefs.filter((x) => x !== p) : [...prefs, p])}
                        className={`px-4 py-2 rounded-2xl border text-left transition-colors ${
                          on ? 'bg-amber border-amber text-charcoal' : 'border-line hover:border-amber'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            <div className="mt-6">
              {step < totalSteps ? (
                <Button onClick={() => canNext && setStep((s) => Math.min(totalSteps, s + 1))} disabled={!canNext}>
                  Siguiente
                </Button>
              ) : (
                <Button onClick={generarPlan} disabled={!canNext || loading} aria-label="Confirmar y generar">
                  {loading ? 'Generando…' : 'Confirmar y generar plan'}
                </Button>
              )}
            </div>
          </div>

          {/* Resumen progresivo */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <h3 className="text-xl font-bold">Resumen</h3>
            {resumen.length === 0 ? (
              <p className="text-stone mt-3">Completa las opciones y verás aquí tu resumen.</p>
            ) : (
              <ul className="mt-3 text-graphite space-y-1">
                {resumen.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
            <p className="text-xs text-stone mt-3">
              Generamos 7 almuerzos/cenas con cantidades, lista consolidada y costo estimado por ciudad.
            </p>
          </div>
        </div>
      )}

      {/* Resultado */}
      {ready && plan && (
        <div className="grid gap-6" style={{ animation: 'fadeIn .25s ease' }}>
          {/* Vista previa + acciones principales */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="h-1 w-28 bg-amber/70 rounded-full mx-auto mb-6" />
            <div className="rounded-2xl border border-line p-5">
              <div className="flex items-center justify-center mb-4">
                <img src="/brand/PLATY_wordmark_1800.png" alt="PLATY" className="h-7 opacity-90" />
              </div>
              <div className="grid grid-cols-3 gap-3 opacity-70">
                <div className="h-4 rounded bg-black/10" />
                <div className="h-4 rounded bg-black/10" />
                <div className="h-4 rounded bg-black/10" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <PDFDownloadLink document={<PlanPDF plan={plan} />} fileName={`PLATY_menu_${plan.meta.ciudad}.pdf`}>
                {({ loading }) => <Button disabled={loading}>{loading ? 'Generando PDF…' : 'Descargar PDF'}</Button>}
              </PDFDownloadLink>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Menú semanal ${site.brand} — ${plan.meta.ciudad} · ${plan.meta.modo} · ${plan.meta.personas} pers${
                    costos?.total ? ` · Total aprox: ${fmtCOP(costos.total)}` : ''
                  }. Incluye cantidades y costo estimado por ciudad. Ver en ${site.domain}`
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button>Compartir por WhatsApp</Button>
              </a>
            </div>
          </div>

          {/* Menú */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <h2 className="text-2xl font-extrabold">Menú (Día 1–7)</h2>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              {plan.menu.map((d) => (
                <div key={d.dia} className="rounded-2xl border border-line p-4">
                  <div className="font-semibold">Día {d.dia}: {d.plato}</div>
                  <div className="text-sm text-graphite">
                    Ingredientes: {d.ingredientes.map((i) => `${i.qty} ${i.unit} ${i.name}`).join(', ')}
                  </div>
                  <div className="text-sm text-graphite">Pasos: {d.pasos.join(' | ')}</div>
                  <div className="text-sm text-black/80 mt-1">💡 {d.tip}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Costos */}
          {costos && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <h3 className="text-xl font-bold">Resumen de compras por categoría</h3>
              <p className="text-sm text-stone mt-1">
                Cantidades expresadas en g/ml/ud cuando aplica. Estimados de precio por ciudad.
              </p>
              <div className="mt-3 grid md:grid-cols-3 gap-4 text-sm">
                {Object.entries(costos.porCategoria).map(([cat, val]) => (
                  <div key={cat} className="rounded-2xl border border-black/10 p-4 flex items-center justify-between">
                    <div className="font-semibold">{cat}</div>
                    <div className="text-black/70">{fmtCOP(val)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-amber p-4 flex items-center justify-between">
                <div className="font-semibold">Total estimado ({plan.meta.ciudad})</div>
                <div className="text-2xl font-extrabold">{fmtCOP(costos.total)}</div>
              </div>
              <p className="text-xs text-stone mt-2">* {costos.nota}</p>
            </div>
          )}

          {/* Batch cooking */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="font-semibold">Batch cooking</div>
            <div className="text-graphite text-sm">Base A: {plan.batch.baseA}</div>
            <div className="text-graphite text-sm">Base B: {plan.batch.baseB}</div>
          </div>
        </div>
      )}

      {/* Loader global durante generación */}
      {loading && (
        <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-soft p-6 w-[90%] max-w-sm text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full border-4 border-amber border-t-transparent animate-spin" />
            <div className="text-lg font-semibold">Generando tu menú…</div>
            <div className="text-sm text-stone mt-1">Esto puede tardar unos segundos. Estamos optimizando cantidades y costos.</div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </main>
  )
}

