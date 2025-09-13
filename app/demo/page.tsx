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

/* ========= PDF (igual de antes, sólo se usa para el download) ========= */
const pdfStyles = StyleSheet.create({
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
      <Page size="A4" style={pdfStyles.page}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <PDFImage src="/brand/PLATY_wordmark_1800.png" style={{ width: 240 }} />
        </View>

        <Text style={pdfStyles.h1}>Menú semanal — {plan.meta.ciudad} · {plan.meta.modo} · {plan.meta.personas} pers</Text>
        <Text style={pdfStyles.small}>Incluye lista consolidada, cantidades (g/ml/ud) y costo estimado.</Text>

        <Text style={pdfStyles.h2}>Menú (Día 1–7)</Text>
        {plan.menu.map(d => (
          <View key={d.dia} style={{ marginBottom: 8 }}>
            <Text>• Día {d.dia}: {d.plato}</Text>
            <Text>  Ingredientes: {d.ingredientes.map(i => `${i.qty} ${i.unit} ${i.name}`).join('; ')}</Text>
            <Text>  Pasos: {d.pasos.join(' | ')}</Text>
            <Text>  Tip: {d.tip}</Text>
          </View>
        ))}

        <Text style={pdfStyles.h2}>Lista de compras (consolidada)</Text>
        {Object.entries(plan.lista).map(([cat, items]) => (
          <Text key={cat} style={pdfStyles.listItem}>{cat}: {items.map(i => `${i.qty} ${i.unit} ${i.name}`).join('; ')}</Text>
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

        <View style={{ position: 'absolute', bottom: 24, left: 32, right: 32, flexDirection:'row', justifyContent:'space-between' }}>
          <Text style={pdfStyles.small}>{site.brand} · wa.me/{site.whatsapp} · {site.domain}</Text>
          <PDFImage src="/brand/PLATY_logo_icon_1024.png" style={{ width: 28, height: 28 }} />
        </View>
      </Page>
    </Document>
  )
}

/* ===================== PAGE ===================== */
export default function DemoPage() {
  const [step, setStep] = useState(1)
  const totalSteps = 4

  const [ciudad, setCiudad] = useState('Bogotá, CO')
  const [personas, setPersonas] = useState(2)
  const [modo, setModo] = useState<'30 min'|'45 min'|'Sin preferencia'>('30 min')
  const [equipo, setEquipo] = useState<'Todo ok'|'Sin horno'|'Sin licuadora'>('Sin horno')
  const [prefs, setPrefs] = useState<string[]>(['Económico'])

  const [plan, setPlan] = useState<Plan | null>(null)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  const ready = step > totalSteps
  const pct = Math.max(0, Math.min(1, (Math.min(step, totalSteps) - 1) / (totalSteps - 1))) * 100

  async function generarPlan() {
    const res = await fetch('/api/generate-menu', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ ciudad, personas, modo, equipo, prefs })
    })
    const data = await res.json()
    setPlan(data)
    setStep(totalSteps + 1)
  }

  // Recalcular costos si vienen vacíos o en 0
  const costosSafe = useMemo(() => {
    if (!plan) return null
    const fromServer = plan.costos
    const hasServerTotals =
      fromServer &&
      Object.values(fromServer.porCategoria || {}).some(v => (v || 0) > 0) &&
      (fromServer.total || 0) > 0

    if (hasServerTotals) return fromServer!

    // Recalcular desde la lista
    const porCat: Record<string, number> = {}
    for (const [cat, items] of Object.entries(plan.lista || {})) {
      porCat[cat] = items.reduce((acc, it) => acc + (it.estCOP || 0), 0)
    }
    const subtotal = Object.values(porCat).reduce((a, b) => a + b, 0)
    return {
      porCategoria: porCat,
      total: Math.round(subtotal * 1.1),
      nota: 'Estimado con pricebook local (+10% buffer). Puede variar por tienda/temporada.'
    }
  }, [plan])

  const whatsUrl = useMemo(() => {
    if (!plan) return '#'
    const totalTxt = costosSafe?.total ? ` · Total aprox: ${fmtCOP(costosSafe.total)}` : ''
    const msg =
      `Menú semanal ${site.brand} — ${plan.meta.ciudad} · ${plan.meta.modo} · ` +
      `${plan.meta.personas} pers${totalTxt}. Incluye cantidades y costo estimado por ciudad. Ver en ${site.domain}`
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }, [plan, costosSafe])

  async function enviarEmail() {
    if (!plan || !email) return
    setSending(true)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, plan })
      })
      const j = await res.json()
      alert(j.ok ? 'Enviado ✅ Revisa tu correo.' : `No se pudo enviar: ${j.error || 'Error'}`)
    } catch {
      alert('Error enviando email')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="container py-10">
      {/* Header + progreso */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <Brand />
          <div className="hidden md:block">
            <StepperDots step={Math.min(step, totalSteps)} total={totalSteps} />
          </div>
        </div>
        <div className="md:hidden mt-4">
          <div className="h-1 w-full bg-line rounded-full overflow-hidden">
            <div className="h-1 bg-amber rounded-full transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Volver */}
      {step > 1 && step <= totalSteps && (
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          className="mb-4 inline-flex items-center gap-2 text-sm text-graphite hover:text-charcoal transition-colors"
        >
          <span aria-hidden>←</span> Volver
        </button>
      )}

      {/* ==== Pasos ==== */}
      {step <= totalSteps && (
        <div className="grid md:grid-cols-2 gap-6" style={{ animation: 'fadeIn .25s ease' }}>
          {step === 1 && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <h2 className="text-2xl font-bold">¿En qué ciudad/país estás?</h2>
              <p className="text-sm text-stone mt-1">Usamos tu ciudad para estimar precios locales.</p>
              <input
                className="mt-4 w-full rounded-2xl border border-line px-4 py-3"
                value={ciudad}
                onChange={e=>setCiudad(e.target.value)}
                placeholder="Ej: Bogotá, CO"
              />
              <div className="mt-6 flex gap-3"><Button onClick={()=>setStep(2)}>Siguiente</Button></div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <h2 className="text-2xl font-bold">¿Para cuántas personas?</h2>
              <p className="text-sm text-stone mt-1">El plan escalará cantidades (g/ml/ud) según tu elección.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[1,2,3,4,5,6].map(n => (
                  <button
                    key={n}
                    onClick={()=>setPersonas(n)}
                    className={`px-4 py-2 rounded-2xl border transition-colors ${personas===n?'bg-amber border-amber text-charcoal':'border-line hover:border-amber'}`}
                  >{n}</button>
                ))}
              </div>
              <div className="mt-6 flex gap-3"><Button onClick={()=>setStep(3)}>Siguiente</Button></div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <h2 className="text-2xl font-bold">Tiempo y equipo</h2>
              <p className="text-sm text-stone mt-1">Selecciona <strong>una</strong> opción por línea.</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {['30 min','45 min','Sin preferencia'].map(m => (
                  <button
                    key={m}
                    onClick={()=>setModo(m as any)}
                    className={`px-4 py-2 rounded-2xl border transition-colors ${modo===m?'bg-amber border-amber text-charcoal':'border-line hover:border-amber'}`}
                  >{m}</button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {['Todo ok','Sin horno','Sin licuadora'].map(m => (
                  <button
                    key={m}
                    onClick={()=>setEquipo(m as any)}
                    className={`px-4 py-2 rounded-2xl border transition-colors ${equipo===m?'bg-amber border-amber text-charcoal':'border-line hover:border-amber'}`}
                  >{m}</button>
                ))}
              </div>
              <div className="mt-6 hidden md:flex gap-3"><Button onClick={()=>setStep(4)}>Siguiente</Button></div>
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
                    <button
                      key={p}
                      onClick={()=>setPrefs(on?prefs.filter(x=>x!==p):[...prefs,p])}
                      className={`px-4 py-2 rounded-2xl border text-left transition-colors ${on?'bg-amber border-amber text-charcoal':'border-line hover:border-amber'}`}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
              <div className="mt-6 hidden md:flex gap-3"><Button onClick={generarPlan}>Confirmar y generar plan</Button></div>
            </div>
          )}

          {/* Resumen + CTA móvil al final */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <h3 className="text-xl font-bold">Resumen</h3>
            <ul className="mt-3 text-graphite">
              <li>Ciudad: {ciudad}</li>
              <li>Personas: {personas}</li>
              <li>Modo: {modo}</li>
              <li>Equipo: {equipo}</li>
              <li>Prefs: {prefs.join(', ') || '—'}</li>
            </ul>
            <p className="text-sm text-stone mt-3">Generamos 7 almuerzos/cenas con cantidades, lista consolidada y costo estimado por ciudad.</p>
            {step === 3 && <div className="md:hidden mt-4"><Button onClick={()=>setStep(4)}>Siguiente</Button></div>}
            {step === 4 && <div className="md:hidden mt-4"><Button onClick={generarPlan}>Confirmar y generar plan</Button></div>}
          </div>
        </div>
      )}

      {/* ==== Resultado (resumen por categoría + preview PDF) ==== */}
      {ready && plan && (
        <div className="grid gap-6" style={{ animation: 'fadeIn .25s ease' }}>
          {/* Preview del PDF + CTA principal */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Mock mini del PDF */}
              <div className="flex-1">
                <div className="rounded-2xl border border-line p-4 bg-white">
                  <div className="flex items-center gap-3">
                    <img src="/brand/PLATY_wordmark_1800.png" alt="PLATY" className="h-6 opacity-90" />
                    <span className="text-[11px] text-stone">Vista previa</span>
                  </div>
                  <div className="mt-3 h-2 w-9/12 bg-black/10 rounded"></div>
                  <div className="mt-2 h-2 w-7/12 bg-black/10 rounded"></div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="h-16 rounded border border-line"></div>
                    <div className="h-16 rounded border border-line"></div>
                    <div className="h-16 rounded border border-line"></div>
                  </div>
                  <div className="mt-3 h-2 w-8/12 bg-black/10 rounded"></div>
                </div>
              </div>

              <div className="md:w-60">
                <PDFDownloadLink document={<PlanPDF plan={plan}/>} fileName={`PLATY_menu_${plan.meta.ciudad}.pdf`}>
                  {({ loading }) => <Button disabled={loading}>{loading ? 'Generando PDF…' : 'Descargar PDF'}</Button>}
                </PDFDownloadLink>
                <a href={whatsUrl} target="_blank" rel="noreferrer" className="block mt-3">
                  <Button>Compartir por WhatsApp</Button>
                </a>
              </div>
            </div>
          </div>

          {/* Resumen por categoría */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <h2 className="text-2xl font-extrabold">Resumen de compras por categoría</h2>
            <p className="text-sm text-stone mt-1">
              Cantidades expresadas en g/ml/ud cuando aplica. Estimados de precio por ciudad.
            </p>

            <div className="mt-5 grid md:grid-cols-2 gap-4">
              {Object.entries(plan.lista).map(([cat, items]) => {
                const top = items.slice(0, 4)
                const subtotal = costosSafe?.porCategoria?.[cat] ?? items.reduce((a,b)=>a+(b.estCOP||0),0)
                return (
                  <div key={cat} className="rounded-2xl border border-line p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">{cat}</div>
                      <div className="text-black/70">{fmtCOP(subtotal)}</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {top.map((i, idx) => (
                        <span key={idx} className="text-xs rounded-full border border-line px-3 py-1 bg-white">
                          {i.qty} {i.unit} {i.name}
                        </span>
                      ))}
                      {items.length > top.length && (
                        <span className="text-xs text-stone">+{items.length - top.length} ítems</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total */}
            <div className="mt-5 rounded-2xl border border-amber p-4 flex items-center justify-between">
              <div className="font-semibold">Total estimado ({plan.meta.ciudad})</div>
              <div className="text-2xl font-extrabold">{fmtCOP(costosSafe?.total)}</div>
            </div>
            <p className="text-xs text-stone mt-2">* {costosSafe?.nota}</p>
          </div>

          {/* Envío por email */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <h3 className="text-xl font-bold">¿Te lo enviamos por correo?</h3>
            <div className="mt-3 flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Tu correo"
                className="rounded-2xl border border-line px-4 py-3 w-full sm:w-80"
                value={email}
                onChange={e=>setEmail(e.target.value)}
              />
              <Button onClick={enviarEmail} disabled={sending || !email}>Enviar por email</Button>
            </div>
            <p className="text-xs text-stone mt-2">Recibirás el PDF generado con tu plan.</p>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px);} to {opacity:1; transform:none;} }
      `}</style>
    </main>
  )
}

