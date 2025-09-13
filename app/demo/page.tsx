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

// -------------------- PDF Styles + helpers --------------------
const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: 'Helvetica' },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 12 },
  brand: { width: 180 },
  meta: { color:'#555' },
  h1: { fontSize: 20, marginTop: 6, marginBottom: 4, fontFamily:'Helvetica-Bold' },
  h2: { fontSize: 14, marginTop: 10, marginBottom: 6, fontFamily:'Helvetica-Bold' },
  card: { borderWidth:1, borderColor:'#e6e6e6', borderRadius:8, padding:10, marginBottom:8 },
  grid2: { flexDirection:'row', gap:8 },
  col: { flex:1 },
  row: { flexDirection:'row' },
  th: { fontFamily:'Helvetica-Bold', backgroundColor:'#f7f7f7', padding:6, borderRightWidth:1, borderColor:'#e6e6e6' },
  td: { padding:6, borderTopWidth:1, borderColor:'#efefef', borderRightWidth:1, borderRightColor:'#f2f2f2' },
  right: { textAlign:'right' },
  small: { fontSize:9, color:'#666' },
  foot: { position:'absolute', bottom:24, left:36, right:36, flexDirection:'row', justifyContent:'space-between', alignItems:'center' }
})

function fmtCOP(n?: number) {
  if (typeof n !== 'number') return '-'
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

function PlanPDF({ plan }: { plan: Plan }) {
  // aplanar lista de compras a filas [cat, item, qty, unit, est]
  const rows: {cat:string; name:string; qty:number; unit:string; est?:number}[] = []
  Object.entries(plan.lista || {}).forEach(([cat, items]) => {
    (items || []).forEach((i) => rows.push({cat, name:i.name, qty:i.qty, unit:i.unit, est:i.estCOP}))
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.header}>
          <PDFImage src="/brand/PLATY_wordmark_1800.png" style={styles.brand} />
          <View>
            <Text style={styles.meta}>{plan.meta.ciudad} · {plan.meta.modo} · {plan.meta.personas} pers</Text>
            <Text style={styles.meta}>Incluye cantidades (g/ml/ud) y costo estimado por ciudad.</Text>
          </View>
        </View>

        {/* Resumen / Tienda sugerida */}
        <View style={[styles.grid2, { marginBottom: 6 }]}>
          <View style={styles.col}>
            <View style={styles.card}>
              <Text style={styles.h2}>Resumen</Text>
              <Text>Ciudad: {plan.meta.ciudad}</Text>
              <Text>Personas: {plan.meta.personas}</Text>
              <Text>Tiempo: {plan.meta.modo}</Text>
            </View>
          </View>
          {plan.tiendas && (
            <View style={styles.col}>
              <View style={styles.card}>
                <Text style={styles.h2}>Dónde comprar (sugerido)</Text>
                <Text>• {plan.tiendas.sugerida.nombre} ({plan.tiendas.sugerida.tipo})</Text>
                <Text>• Alternativas: {plan.tiendas.opciones.map((o)=>o.nombre).join(', ')}</Text>
                <Text style={styles.small}>Maps: {plan.tiendas.mapsUrl}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Menú */}
        <Text style={styles.h1}>Menú · Días 1–7</Text>
        {plan.menu.map((d) => (
          <View key={d.dia} style={styles.card}>
            <Text style={{ fontFamily:'Helvetica-Bold' }}>Día {d.dia}: {d.plato}</Text>
            <Text>Ingredientes: {d.ingredientes.map((i)=>`${i.qty} ${i.unit} ${i.name}`).join('; ')}</Text>
            <Text>Pasos: {d.pasos.join(' · ')}</Text>
            <Text>Tip: {d.tip}</Text>
          </View>
        ))}

        {/* Lista de compras en tabla */}
        <Text style={styles.h1}>Lista de compras (consolidada)</Text>
        <View style={{ borderWidth:1, borderColor:'#e6e6e6', borderRadius:8, overflow:'hidden' }}>
          <View style={styles.row}>
            <Text style={[styles.th, {flex:1}]}>Categoría</Text>
            <Text style={[styles.th, {flex:2}]}>Producto</Text>
            <Text style={[styles.th, {flex:1, textAlign:'right'}]}>Cantidad</Text>
            <Text style={[styles.th, {flex:1, textAlign:'right'}]}>Est. COP</Text>
          </View>
          {rows.map((r, idx) => (
            <View key={idx} style={styles.row}>
              <Text style={[styles.td, {flex:1}]}>{r.cat}</Text>
              <Text style={[styles.td, {flex:2}]}>{r.name}</Text>
              <Text style={[styles.td, {flex:1, textAlign:'right'}]}>{r.qty} {r.unit}</Text>
              <Text style={[styles.td, {flex:1, textAlign:'right'}]}>{fmtCOP(r.est)}</Text>
            </View>
          ))}
        </View>

        {/* Costos por categoría */}
        {plan.costos && (
          <>
            <Text style={styles.h1}>Costos estimados</Text>
            <View style={{ borderWidth:1, borderColor:'#e6e6e6', borderRadius:8, overflow:'hidden' }}>
              <View style={styles.row}>
                <Text style={[styles.th, {flex:2}]}>Categoría</Text>
                <Text style={[styles.th, {flex:1, textAlign:'right'}]}>COP</Text>
              </View>
              {Object.entries(plan.costos.porCategoria).map(([cat, val]) => (
                <View key={cat} style={styles.row}>
                  <Text style={[styles.td, {flex:2}]}>{cat}</Text>
                  <Text style={[styles.td, {flex:1, textAlign:'right'}]}>{fmtCOP(val as number)}</Text>
                </View>
              ))}
              <View style={styles.row}>
                <Text style={[styles.td, {flex:2, fontFamily:'Helvetica-Bold'}]}>Total</Text>
                <Text style={[styles.td, {flex:1, textAlign:'right', fontFamily:'Helvetica-Bold'}]}>
                  {fmtCOP(plan.costos.total)}
                </Text>
              </View>
            </View>
            <Text style={[styles.small, { marginTop: 4 }]}>* {plan.costos.nota}</Text>
          </>
        )}

        {/* Footer */}
        <View style={styles.foot}>
          <Text style={styles.small}>© {new Date().getFullYear()} {site.brand} · {site.domain}</Text>
          <PDFImage src="/brand/PLATY_logo_icon_1024.png" style={{ width: 22, height: 22 }} />
        </View>
      </Page>
    </Document>
  )
}

// -------------------- DEMO PAGE --------------------
export default function DemoPage() {
  const [step, setStep] = useState(1)
  const total = 4

  const [ciudad, setCiudad] = useState('Bogotá, CO')
  const [personas, setPersonas] = useState(2)
  const [modo, setModo] = useState<'30 min'|'45 min'|'Sin preferencia'>('30 min')
  const [equipo, setEquipo] = useState<'Todo ok'|'Sin horno'|'Sin licuadora'>('Sin horno')
  const [prefs, setPrefs] = useState<string[]>(['Económico'])

  const [plan, setPlan] = useState<Plan | null>(null)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

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
    const totalTxt = plan.costos?.total ? ` · Total aprox: ${fmtCOP(plan.costos.total)}` : ''
    const msg = `Menú semanal ${site.brand} — ${plan.meta.ciudad} · ${plan.meta.modo} · ${plan.meta.personas} pers${totalTxt}. Incluye cantidades y costo estimado por ciudad. Ver en ${site.domain}`
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }, [plan])

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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Brand />
        <StepperDots step={Math.min(step, total)} total={total} />
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
          {/* Paso 1 */}
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

          {/* Paso 2 */}
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
              <div className="mt-6 flex gap-3">
                <Button onClick={()=>setStep(3)}>Siguiente</Button>
              </div>
            </div>
          )}

          {/* Paso 3 */}
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
              <div className="mt-6 flex gap-3">
                <Button onClick={()=>setStep(4)}>Siguiente</Button>
              </div>
            </div>
          )}

          {/* Paso 4 */}
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
            <p className="text-sm text-stone mt-3">Generamos 7 almuerzos/cenas con cantidades, lista consolidada y costo estimado por ciudad.</p>
          </div>
        </div>
      )}

      {/* Resultado */}
      {ready && plan && (
        <div className="grid gap-6" style={{ animation: 'fadeIn .25s ease' }}>
          {/* Menú */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <h2 className="text-2xl font-extrabold">Menú (Día 1–7)</h2>
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

          {/* Costos */}
          {plan.costos && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <h3 className="text-xl font-bold">Costos estimados</h3>
              <div className="mt-2 grid md:grid-cols-3 gap-4 text-sm">
                {Object.entries(plan.costos.porCategoria).map(([cat, val]) => (
                  <div key={cat} className="rounded-2xl border border-black/10 p-4 flex items-center justify-between">
                    <div className="font-semibold">{cat}</div>
                    <div className="text-black/70">{fmtCOP(val)}</div>
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

          {/* Dónde comprar */}
          {plan.tiendas && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <h3 className="text-xl font-bold">Dónde comprar (sugerido)</h3>
              <p className="text-graphite mt-1">
                Sugerimos <strong>{plan.tiendas.sugerida.nombre}</strong> ({plan.tiendas.sugerida.tipo}). Alternativas: {plan.tiendas.opciones.map(o=>o.nombre).join(', ')}.
              </p>
              <a href={plan.tiendas.mapsUrl} target="_blank" className="inline-block mt-3 underline decoration-amber decoration-4 underline-offset-4">
                Ver en Google Maps
              </a>
            </div>
          )}

          {/* Acciones: PDF / Whats / Email */}
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

            {/* Enviar por email */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Tu correo (para enviarte el PDF)"
                className="rounded-2xl border border-line px-4 py-3 w-full sm:w-80"
                value={email}
                onChange={e=>setEmail(e.target.value)}
              />
              <Button onClick={enviarEmail} disabled={sending || !email}>
                {sending ? 'Enviando…' : 'Enviar por email'}
              </Button>
            </div>
            <p className="text-xs text-stone mt-2">Te enviaremos el PDF generado a tu correo.</p>
          </div>
        </div>
      )}

      {/* Animación global */}
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px);} to {opacity:1; transform:none;} }
      `}</style>
    </main>
  )
}

