'use client'
import { useMemo, useState } from 'react'
import Brand from '@/components/Brand'
import Button from '@/components/Button'
import StepperDots from '@/components/StepperDots'
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image as PDFImage } from '@react-pdf/renderer'
import { site } from '@/site.config'

type Unit = 'g'|'ml'|'ud'
type ItemQty = { name: string; qty: number; unit: Unit; estCOP?: number }
type StoreOpt = { nombre: string; tipo: 'hard-discount'|'supermercado' }
type Plan = {
  menu: { dia: number; plato: string; ingredientes: ItemQty[]; pasos: string[]; tip: string }[]
  lista: Record<string, ItemQty[]>
  batch: { baseA: string; baseB: string }
  sobrantes: string[]
  meta: { ciudad: string; personas: number; modo: string; moneda?: 'COP' }
  costos?: { porCategoria: Record<string, number>; total: number; nota: string }
  tiendas?: { sugerida: StoreOpt; opciones: StoreOpt[]; mapsUrl: string }
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 12, fontFamily: 'Helvetica' },
  h1: { fontSize: 22, marginBottom: 8 },
  h2: { fontSize: 16, marginTop: 12, marginBottom: 6 },
  small: { fontSize: 10, color: '#555' },
  listItem: { marginBottom: 4 },
  table: { marginTop: 6, borderWidth: 1, borderColor: '#dddddd', borderRadius: 6, overflow: 'hidden' },
  tr: { flexDirection: 'row', alignItems: 'stretch' },
  th: { fontSize: 11, fontFamily: 'Helvetica-Bold', backgroundColor: '#f3f3f3', paddingVertical: 6, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#dddddd' },
  td: { fontSize: 11, paddingVertical: 6, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: '#eeeeee', borderRightWidth: 1, borderRightColor: '#eeeeee' }
})
function fmtCOP(n?: number) {
  if (typeof n !== 'number') return '-'
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

function PlanPDF({ plan }: { plan: Plan }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <PDFImage src="/brand/PLATY_wordmark_1800.png" style={{ width: 240 }} />
        </View>
        <Text style={styles.h1}>Menú semanal — {plan.meta.ciudad} · {plan.meta.modo} · {plan.meta.personas} pers</Text>
        <Text style={styles.small}>Incluye lista consolidada, cantidades (g/ml/ud) y costo estimado.</Text>

        <Text style={styles.h2}>Menú (Día 1–7)</Text>
        {plan.menu.map(d => (
          <View key={d.dia} style={{ marginBottom: 8 }}>
            <Text>• Día {d.dia}: {d.plato}</Text>
            <Text>  Ingredientes: {d.ingredientes.map(i => `${i.qty} ${i.unit} ${i.name}`).join('; ')}</Text>
            <Text>  Pasos: {d.pasos.join(' | ')}</Text>
            <Text>  Tip: {d.tip}</Text>
          </View>
        ))}

        <Text style={styles.h2}>Lista de compras (consolidada)</Text>
        {Object.entries(plan.lista).map(([cat, items]) => (
          <Text key={cat} style={styles.listItem}>{cat}: {items.map(i => `${i.qty} ${i.unit} ${i.name}`).join('; ')}</Text>
        ))}

        {plan.costos && (
          <>
            <Text style={styles.h2}>Costo estimado</Text>
            <View style={styles.table}>
              <View style={styles.tr}>
                <Text style={[styles.th, { flex: 2 }]}>Categoría</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Estimado (COP)</Text>
              </View>
              {Object.entries(plan.costos.porCategoria).map(([cat, val]) => (
                <View key={cat} style={styles.tr}>
                  <Text style={[styles.td, { flex: 2 }]}>{cat}</Text>
                  <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{fmtCOP(val)}</Text>
                </View>
              ))}
              <View style={styles.tr}>
                <Text style={[styles.td, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>Total</Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>{fmtCOP(plan.costos.total)}</Text>
              </View>
            </View>
            <Text style={[styles.small, { marginTop: 4 }]}>{plan.costos.nota}</Text>
          </>
        )}

        {plan.tiendas && (
          <>
            <Text style={styles.h2}>Dónde comprar (sugerido)</Text>
            <Text>• Sugerido: {plan.tiendas.sugerida.nombre} ({plan.tiendas.sugerida.tipo})</Text>
            <Text>• Alternativas: {plan.tiendas.opciones.map(o=>o.nombre).join(', ')}</Text>
            <Text style={styles.small}>Búscalo en mapas: {plan.tiendas.mapsUrl}</Text>
          </>
        )}

        <View style={{ position: 'absolute', bottom: 24, left: 32, right: 32, flexDirection:'row', justifyContent:'space-between' }}>
          <Text style={styles.small}>{site.brand} · wa.me/{site.whatsapp} · {site.domain}</Text>
          <PDFImage src="/brand/PLATY_logo_icon_1024.png" style={{ width: 28, height: 28 }} />
        </View>
      </Page>
    </Document>
  )
}

export default function DemoPage() {
  const [step, setStep] = useState(1)
  const total = 4
  const [ciudad, setCiudad] = useState('')
  const [personas, setPersonas] = useState<number | null>(null)
  const [modo, setModo] = useState<'30 min'|'45 min'|'Sin preferencia' | ''>('')
  const [equipo, setEquipo] = useState<'Todo ok'|'Sin horno'|'Sin licuadora' | ''>('')
  const [prefs, setPrefs] = useState<string[]>([])
  const [plan, setPlan] = useState<Plan | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const ready = step > total && !!plan

  const resumenTxt = {
    ciudad: ciudad || '—',
    personas: typeof personas === 'number' ? String(personas) : '—',
    modo: modo || '—',
    equipo: equipo || '—',
    prefs: (prefs.length ? prefs.join(', ') : '—')
  }

  async function generarPlan() {
    if (!ciudad || !personas || !modo || !equipo) return
    setLoading(true)
    setStep(total + 1)
    try {
      const res = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ ciudad, personas, modo, equipo, prefs })
      })
      const data = await res.json()
      setPlan(data)
    } catch {
      // fallback: ya lo maneja la API, pero dejamos el estado visible
    } finally {
      setLoading(false)
    }
  }

  const whatsUrl = useMemo(() => {
    if (!plan) return '#'
    const totalTxt = plan.costos?.total ? ` · Total aprox: ${fmtCOP(plan.costos.total)}` : ''
    const msg = `Menú semanal ${site.brand} — ${plan.meta.ciudad} · ${plan.meta.modo} · ${plan.meta.personas} pers${totalTxt}. Incluye cantidades y costo estimado por ciudad. Ver en ${site.domain}`
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }, [plan])

  return (
    <main className="container py-8 md:py-10">
      {/* HEADER compacto */}
      <div className="flex items-center justify-center md:justify-between mb-6">
        <Brand className="mx-auto md:mx-0" />
        <StepperDots className="hidden md:block" step={Math.min(step, total)} total={total} />
      </div>

      {/* Barra de progreso móvil */}
      <div className="md:hidden flex items-center justify-center gap-2 mb-4">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${i < step ? 'w-10 bg-amber' : 'w-8 bg-black/10'}`}
          />
        ))}
      </div>

      {/* Volver */}
      {step > 1 && step <= total && (
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          className="mb-4 inline-flex items-center gap-2 text-sm text-graphite hover:text-charcoal transition-colors"
        >
          <span aria-hidden>←</span> Volver
        </button>
      )}

      {/* Pasos */}
      {step <= total && (
        <div className="grid md:grid-cols-2 gap-6" style={{ animation: 'fadeIn .25s ease' }}>
          {step === 1 && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <h2 className="text-2xl font-bold">¿En qué ciudad/país estás?</h2>
              <p className="text-sm text-stone mt-1">Usamos tu ciudad para estimar precios locales.</p>
              <input className="mt-4 w-full rounded-2xl border border-line px-4 py-3" value={ciudad} onChange={e=>setCiudad(e.target.value)} placeholder="Ej: Bogotá, CO" />
              <div className="mt-6 flex gap-3">
                <Button onClick={()=>setStep(2)} disabled={!ciudad}>Siguiente</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <h2 className="text-2xl font-bold">¿Para cuántas personas?</h2>
              <p className="text-sm text-stone mt-1">Escalamos cantidades (g/ml/ud) según tu elección.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[1,2,3,4,5,6].map(n => (
                  <button key={n} onClick={()=>setPersonas(n)} className={`px-4 py-2 rounded-2xl border transition-colors ${personas===n?'bg-amber border-amber text-charcoal':'border-line hover:border-amber'}`}>{n}</button>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <Button onClick={()=>setStep(3)} disabled={!personas}>Siguiente</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <h2 className="text-2xl font-bold">Tiempo y equipo</h2>
              <p className="text-sm text-stone mt-1">Elige tu <strong>tiempo de cocina</strong> y con qué <strong>electrodomésticos</strong> cuentas.</p>

              <div className="mt-4">
                <div className="text-sm font-semibold mb-2">Tiempo que quieres invertir</div>
                <div className="grid grid-cols-3 gap-2">
                  {['30 min','45 min','Sin preferencia'].map(m => (
                    <button key={m} onClick={()=>setModo(m as any)} className={`px-4 py-2 rounded-2xl border transition-colors ${modo===m?'bg-amber border-amber text-charcoal':'border-line hover:border-amber'}`}>{m}</button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-semibold mb-2">¿Con qué electrodomésticos cuentas?</div>
                <div className="grid grid-cols-3 gap-2">
                  {['Todo ok','Sin horno','Sin licuadora'].map(m => (
                    <button key={m} onClick={()=>setEquipo(m as any)} className={`px-4 py-2 rounded-2xl border transition-colors ${equipo===m?'bg-amber border-amber text-charcoal':'border-line hover:border-amber'}`}>{m}</button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button onClick={()=>setStep(4)} disabled={!modo || !equipo}>Siguiente</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <h2 className="text-2xl font-bold">Preferencias y presupuesto</h2>
              <p className="text-sm text-stone mt-1">Puedes seleccionar <strong>varias</strong> opciones.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {['Económico','Vegetariano','Sin lácteos','Sin picante','Bajo sodio','Ninguna'].map(p => {
                  const on = prefs.includes(p)
                  return (
                    <button key={p} onClick={()=>setPrefs(on?prefs.filter(x=>x!==p):[...prefs,p])} className={`px-4 py-2 rounded-2xl border text-left transition-colors ${on?'bg-amber border-amber text-charcoal':'border-line hover:border-amber'}`}>
                      {p}
                    </button>
                  )
                })}
              </div>
              <div className="mt-6 flex gap-3">
                <Button onClick={generarPlan} disabled={!ciudad || !personas || !modo || !equipo}>
                  {loading ? 'Generando…' : 'Confirmar y generar plan'}
                </Button>
              </div>
            </div>
          )}

          {/* Resumen en vivo */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <h3 className="text-xl font-bold">Resumen</h3>
            <ul className="mt-3 text-graphite">
              <li>Ciudad: {resumenTxt.ciudad}</li>
              <li>Personas: {resumenTxt.personas}</li>
              <li>Tiempo de cocina: {resumenTxt.modo}</li>
              <li>Equipo: {resumenTxt.equipo}</li>
              <li>Preferencias: {resumenTxt.prefs}</li>
            </ul>
            <p className="text-sm text-stone mt-3">Generamos 7 almuerzos/cenas con cantidades, lista consolidada y costo estimado por ciudad.</p>
          </div>
        </div>
      )}

      {/* Resultado */}
      {ready && plan && (
        <div className="grid gap-6" style={{ animation: 'fadeIn .25s ease' }}>
          {/* Resumen por categoría primero */}
          {plan.costos && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <h3 className="text-xl font-bold">Resumen de compras por categoría</h3>
              <p className="text-sm text-stone">Cantidades expresadas en g/ml/ud cuando aplica. Estimados de precio por ciudad.</p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(plan.costos.porCategoria).map(([cat, val]) => (
                  <div key={cat} className="rounded-2xl border border-line p-4">
                    <div className="text-sm text-graphite">{cat}</div>
                    <div className="text-lg font-bold">{fmtCOP(val)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-amber p-4 flex items-center justify-between">
                <div className="font-semibold">Total estimado ({plan.meta.ciudad})</div>
                <div className="text-2xl font-extrabold">{fmtCOP(plan.costos.total)}</div>
              </div>
              <p className="text-xs text-stone mt-2">* {plan.costos.nota}</p>
            </div>
          )}

          {/* Menú detallado */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold">Menú (Día 1–7)</h2>
            </div>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              {plan.menu.map(d => (
                <div key={d.dia} className="rounded-2xl border border-line p-4">
                  <div className="font-semibold">Día {d.dia}: {d.plato}</div>
                  <div className="text-sm text-graphite">Ingredientes: {d.ingredientes.map(i=>`${i.qty} ${i.unit} ${i.name}`).join(', ')}</div>
                  <div className="text-sm text-graphite">Pasos: {d.pasos.join(' | ')}</div>
                  <div className="text-sm text-black/80 mt-1">💡 {d.tip}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="mt-2 flex flex-wrap gap-3">
              <PDFDownloadLink document={<PlanPDF plan={plan}/>} fileName={`PLATY_menu_${plan.meta.ciudad}.pdf`}>
                {({ loading }) => <Button disabled={loading}>{loading ? 'Generando PDF…' : 'Descargar PDF'}</Button>}
              </PDFDownloadLink>
              <a href={whatsUrl} target="_blank" rel="noreferrer"><Button>Compartir por WhatsApp</Button></a>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de “Generando…” */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="animate-pulse text-2xl font-bold mb-2">Generando tu menú…</div>
            <div className="text-stone">Tarda unos segundos mientras calculamos cantidades y costos.</div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px);} to {opacity:1; transform:none;} }
      `}</style>
    </main>
  )
}
