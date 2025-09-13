'use client'
import { useMemo, useState } from 'react'
import Brand from '@/components/Brand'
import Button from '@/components/Button'
import StepperDots from '@/components/StepperDots'
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image as PDFImage } from '@react-pdf/renderer'
import { site } from '@/site.config'

type Unit = 'g'|'ml'|'ud'
type ItemQty = { name: string; qty: number; unit: Unit; estCOP?: number }
type Plan = {
  menu: { dia: number; plato: string; ingredientes: ItemQty[]; pasos: string[]; tip: string }[]
  lista: Record<string, ItemQty[]>
  batch: { baseA: string; baseB: string }
  sobrantes: string[]
  meta: { ciudad: string; personas: number; modo: string; moneda: 'COP' }
  costos?: { porCategoria: Record<string, number>; total: number; nota: string }
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 12, fontFamily: 'Helvetica' },
  h1: { fontSize: 22, marginBottom: 8 },
  h2: { fontSize: 16, marginTop: 12, marginBottom: 4 },
  small: { fontSize: 10, color: '#555' },
  listItem: { marginBottom: 4 }
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
            <Text>Total: {fmtCOP(plan.costos.total)} — {plan.costos.nota}</Text>
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
  const [ciudad, setCiudad] = useState('Bogotá, CO')
  const [personas, setPersonas] = useState(2)
  const [modo, setModo] = useState<'30 min'|'45 min'|'Sin preferencia'>('30 min')
  const [equipo, setEquipo] = useState<'Todo ok'|'Sin horno'|'Sin licuadora'>('Sin horno')
  const [prefs, setPrefs] = useState<string[]>(['Económico'])
  const [plan, setPlan] = useState<Plan | null>(null)
  const ready = step > total

  async function generarPlan() {
    const res = await fetch('/api/generate-menu', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ ciudad, personas, modo, equipo, prefs })
    })
    const data = await res.json()
    setPlan(data)
    setStep(total+1)
  }

  const whatsUrl = useMemo(() => {
    if (!plan) return '#'
    const msg = `Menú semanal ${site.brand} — ${plan.meta.ciudad} · ${plan.meta.modo} · ${plan.meta.personas} pers. Estimado total: ${fmtCOP(plan.costos?.total)}. Pruébalo en ${site.domain}`
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }, [plan])

  return (
    <main className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <Brand />
        <StepperDots step={Math.min(step, total)} total={total} />
      </div>

      {/* Botón Volver */}
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
              <input
                className="mt-4 w-full rounded-2xl border border-line px-4 py-3"
                value={ciudad}
                onChange={e=>setCiudad(e.target.value)}
                placeholder="Ej: Bogotá, CO"
              />
              <div className="mt-6 flex gap-3">
                <Button onClick={()=>setStep(2)}>Siguiente</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <h2 className="text-2xl font-bold">¿Para cuántas personas?</h2>
              <p className="text-sm text-stone mt-1">El plan escalará cantidades (g/ml/ud) según tu elección.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[1,2,3,4,5,6].map(n => (
                  <button key={n} onClick={()=>setPersonas(n)}
                    className={`px-4 py-2 rounded-2xl border transition-colors ${personas===n?'bg-amber border-amber text-charcoal':'border-line hover:border-amber'}`}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <Button onClick={()=>setStep(3)}>Siguiente</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <h2 className="text-2xl font-bold">Tiempo y equipo</h2>
              <p className="text-sm text-stone mt-1">Selecciona <strong>una</strong> opción por línea.</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {['30 min','45 min','Sin preferencia'].map(m => (
                  <button key={m} onClick={()=>setModo(m as any)} className={`px-4 py-2 rounded-2xl border transition-colors ${modo===m?'bg-amber border-amber text-charcoal':'border-line hover:border-amber'}`}>{m}</button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {['Todo ok','Sin horno','Sin licuadora'].map(m => (
                  <button key={m} onClick={()=>setEquipo(m as any)} className={`px-4 py-2 rounded-2xl border transition-colors ${equipo===m?'bg-amber border-amber text-charcoal':'border-line hover:border-amber'}`}>{m}</button>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <Button onClick={()=>setStep(4)}>Siguiente</Button>
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
              <div className="mt-6 flex gap-3">
                <Button onClick={generarPlan}>Confirmar y generar plan</Button>
              </div>
            </div>
          )}

          {/* Resumen lateral */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <h3 className="text-xl font-bold">Resumen</h3>
            <ul className="mt-3 text-graphite">
              <li>Ciudad: {ciudad}</li>
              <li>Personas: {personas}</li>
              <li>Modo: {modo}</li>
              <li>Equipo: {equipo}</li>
              <li>Prefs: {prefs.join(', ') || '—'}</li>
            </ul>
            <p className="text-sm text-stone mt-3">Al confirmar, generamos tu semana completa, la lista consolidada y el costo estimado según tu ciudad.</p>
          </div>
        </div>
      )}

      {/* Resultado */}
      {ready && plan && (
        <div className="grid gap-6" style={{ animation: 'fadeIn .25s ease' }}>
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <h2 className="text-2xl font-extrabold">Menú (Día 1–7)</h2>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              {plan.menu.map(d => (
                <div key={d.dia} className="rounded-2xl border border-line p-4">
                  <div className="font-semibold">Día {d.dia}: {d.plato}</div>
                  <div className="text-sm text-graphite">Ingredientes: {d.ingredientes.map(i => `${i.qty} ${i.unit} ${i.name}`).join(', ')}</div>
                  <div className="text-sm text-graphite">Pasos: {d.pasos.join(' | ')}</div>
                  <div className="text-sm text-black/80 mt-1">💡 {d.tip}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <h3 className="text-xl font-bold">Lista de compras (consolidada)</h3>
            <div className="mt-2 grid md:grid-cols-3 gap-4 text-sm">
              {Object.entries(plan.lista).map(([cat, items]) => (
                <div key={cat} className="rounded-2xl border border-line p-4">
                  <div className="font-semibold">{cat}</div>
                  <div className="text-graphite">{items.map(i => `${i.qty} ${i.unit} ${i.name}`).join(', ')}</div>
                  {items.some(i => i.estCOP) && (
                    <div className="text-stone mt-1">Estimado cat.: {fmtCOP(items.reduce((a,i)=>a+(i.estCOP||0),0))}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Costos */}
          {plan.costos && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <div className="font-semibold">Costo estimado ({plan.meta.ciudad})</div>
              <div className="text-2xl font-extrabold mt-1">{fmtCOP(plan.costos.total)}</div>
              <p className="text-sm text-stone mt-1">{plan.costos.nota}</p>
            </div>
          )}

          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="font-semibold">Batch cooking</div>
            <div className="text-graphite text-sm">Base A: {plan.batch.baseA}</div>
            <div className="text-graphite text-sm">Base B: {plan.batch.baseB}</div>
            <div className="mt-6 flex flex-wrap gap-3">
              <PDFDownloadLink document={<PlanPDF plan={plan}/>} fileName={`PLATY_menu_${plan.meta.ciudad}.pdf`}>
                {({ loading }) => <Button disabled={loading}>{loading ? 'Generando PDF…' : 'Descargar PDF'}</Button>}
              </PDFDownloadLink>
              <a href={whatsUrl} target="_blank" rel="noreferrer">
                <Button>Compartir por WhatsApp</Button>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Animación básica */}
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px);} to {opacity:1; transform:none;} }
      `}</style>
    </main>
  )
}

