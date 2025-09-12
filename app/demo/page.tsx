'use client'
import { useEffect, useMemo, useState } from 'react'
import Brand from '@/components/Brand'
import Button from '@/components/Button'
import StepperDots from '@/components/StepperDots'
import { Document, Page, Text, View, StyleSheet, Image as PDFImage, PDFDownloadLink } from '@react-pdf/renderer'
import { site } from '@/site.config'

type Unit = 'g'|'ml'|'ud'
type ItemQty = { name: string; qty: number; unit: Unit; estCOP?: number }
type Plan = {
  menu: { dia: number; plato: string; ingredientes: ItemQty[]; pasos: string[]; tip: string }[]
  lista: Record<string, ItemQty[]>
  batch: { baseA: string; baseB: string }
  sobrantes: string[]
  meta: { ciudad: string; personas: number; modo: string; moneda: 'COP' }
  costos: { porCategoria: Record<string, number>; total: number; nota: string }
}

const colors = {
  charcoal: '#111827', graphite: '#374151', stone: '#6B7280',
  sand: '#F8FAFC', line: '#E5E7EB', amber: '#F59E0B'
}
const styles = StyleSheet.create({
  page: { padding: 28, backgroundColor: '#FFFFFF', fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bar: { height: 4, backgroundColor: colors.amber, borderRadius: 2, marginBottom: 12 },
  h1: { fontSize: 20, color: colors.charcoal, fontWeight: 800 },
  h2: { fontSize: 14, color: colors.charcoal, fontWeight: 700, marginBottom: 6, marginTop: 10 },
  small: { fontSize: 9, color: colors.stone },
  body: { fontSize: 11, color: colors.graphite },
  card: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 10, backgroundColor: '#FFFFFF' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  sep: { height: 1, backgroundColor: colors.line, marginVertical: 8 },
  chip: { fontSize: 9, color: colors.charcoal, backgroundColor: colors.sand, paddingVertical: 3, paddingHorizontal: 6, borderRadius: 999, marginRight: 6 },
  footer: { position: 'absolute', left: 28, right: 28, bottom: 20, flexDirection: 'row', justifyContent: 'space-between' }
})
const fmtCOP = (v:number) => (typeof v === 'number' ? v : 0).toLocaleString('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 })

function PlanPDF({ plan }: { plan: Plan }) {
  const total = plan?.costos?.total || 0
  const metaLine = `${plan.meta.ciudad} · ${plan.meta.modo} · ${plan.meta.personas} pers`
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <PDFImage src="/brand/PLATY_logo_icon_1024.png" style={{ width: 28, height: 28, borderRadius: 6 }} />
            <PDFImage src="/brand/PLATY_wordmark_1800.png" style={{ width: 120, height: 22 }} />
          </View>
        </View>
        <View style={styles.bar} />
        <Text style={styles.h1}>Menú semanal</Text>
        <Text style={styles.small}>{metaLine}</Text>
        <View style={[styles.card, { marginTop: 10 }]}>
          <View style={styles.row}>
            <Text style={{ fontSize: 12, fontWeight: 700, color: colors.charcoal }}>Resumen</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, color: colors.charcoal }}>{fmtCOP(total)}</Text>
          </View>
          <View style={styles.sep} />
          <Text style={styles.small}>Incluye cantidades (g/ml/ud), lista consolidada por categorías y costo estimado local (+10% buffer).</Text>
        </View>
        <Text style={styles.h2}>Menú (Día 1–7)</Text>
        <View>
          {plan.menu.map((d) => (
            <View key={d.dia} style={[styles.card, { marginBottom: 8 }]}>
              <Text style={{ fontSize: 12, fontWeight: 700, color: colors.charcoal }}>Día {d.dia}: {d.plato}</Text>
              <View style={{ marginTop: 4 }}>
                <Text style={styles.small}>Ingredientes</Text>
                <Text style={styles.body}>
                  {d.ingredientes.map((i) => `${i.qty}${i.unit} ${i.name}`).join(' · ')}
                </Text>
              </View>
              <View style={{ marginTop: 4 }}>
                <Text style={styles.small}>Pasos</Text>
                <Text style={styles.body}>{d.pasos.join(' → ')}</Text>
              </View>
              <View style={{ marginTop: 4 }}>
                <Text style={styles.small}>Tip</Text>
                <Text style={styles.body}>{d.tip}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.h2}>Lista de compras (consolidada)</Text>
        <View>
          {Object.entries(plan.lista).map(([cat, items]) => (
            <View key={cat} style={{ marginBottom: 6 }}>
              <View style={styles.row}>
                <Text style={{ fontSize: 12, fontWeight: 700, color: colors.charcoal }}>{cat}</Text>
                <Text style={styles.small}>{fmtCOP(plan.costos.porCategoria[cat] || 0)}</Text>
              </View>
              <Text style={styles.body}>
                {items.map((i) => `${i.qty}${i.unit} ${i.name}`).join(' · ')}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.h2}>Batch cooking & Sobrantes</Text>
        <View style={[styles.card, { marginBottom: 8 }]}>
          <Text style={styles.body}>Base A: {plan.batch.baseA}</Text>
          <Text style={styles.body}>Base B: {plan.batch.baseB}</Text>
          <View style={{ marginTop: 6, flexDirection: 'row', flexWrap: 'wrap' }}>
            {plan.sobrantes.map((s) => (
              <Text key={s} style={styles.chip}>{s}</Text>
            ))}
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.small}>© {new Date().getFullYear()} PLATY · {plan.meta.moneda} · {plan.meta.ciudad}</Text>
          <Text style={styles.small}>wa.me/{site.whatsapp} · {site.domain}</Text>
        </View>
      </Page>
    </Document>
  )
}

export default function DemoPage() {
  const [step, setStep] = useState(1)
  const total = 5
  const [ciudad, setCiudad] = useState('Bogotá, CO')
  const [personas, setPersonas] = useState(2)
  const [modo, setModo] = useState<'30 min'|'45 min'|'Sin preferencia'>('30 min')
  const [equipo, setEquipo] = useState<'Todo ok'|'Sin horno'|'Sin licuadora'>('Todo ok')
  const [prefs, setPrefs] = useState<string[]>(['Económico'])
  const [nivel, setNivel] = useState<'Básico'|'Intermedio'|'Avanzado'>('Básico')
  const [alergias, setAlergias] = useState('')
  const [email, setEmail] = useState('')
  const [whats, setWhats] = useState('')

  const [license, setLicense] = useState('')
  const [trials, setTrials] = useState<number>(0)
  const [hasLicense, setHasLicense] = useState(false)

  const [plan, setPlan] = useState<Plan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const ready = step > total

  useEffect(() => {
    const saved = localStorage.getItem('platy_license') || ''
    if (saved) setLicense(saved)
  }, [])

  async function generarPlan() {
    setError(null)
    const headers: Record<string,string> = { 'Content-Type': 'application/json' }
    if (license) headers['x-platy-license'] = license
    const res = await fetch('/api/generate-menu', {
      method: 'POST',
      headers,
      body: JSON.stringify({ ciudad, personas, modo, equipo, prefs, nivel, alergias, email, whats })
    })
    if (res.status === 402) {
      const data = await res.json()
      const t = res.headers.get('x-platy-trials') || '0'
      setTrials(Number(t)); setHasLicense(false); setError(data?.error || 'Superaste los intentos gratis.'); return
    }
    const data = await res.json()
    setPlan(data); setStep(total + 1)
    const t = res.headers.get('x-platy-trials') || '0'
    const hl = res.headers.get('x-platy-has-license') === 'true'
    setTrials(Number(t)); setHasLicense(hl)
  }

  function saveLicense() { localStorage.setItem('platy_license', license) }

  const whatsUrl = useMemo(() => {
    if (!plan) return '#'
    const total = plan?.costos?.total ? ` · Total estimado: ${plan.costos.total.toLocaleString('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 })}` : ''
    const msg = [
      `Menú semanal ${site.brand}`,
      `${plan.meta.ciudad} · ${plan.meta.personas} pers · ${plan.meta.modo}${total}`,
      `Incluye cantidades (g/ml/ud) y lista consolidada.`,
      `Descárgalo aquí: ${site.domain}`
    ].join(' — ')
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }, [plan])

  return (
    <main className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <Brand />
        <StepperDots step={Math.min(step, total)} total={total} />
      </div>

      <div className="mb-6 grid md:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm">
          <div className="font-semibold">Estado</div>
          <div className="text-black/70 mt-1">
            {hasLicense ? 'Acceso de por vida activo.' : `Intentos usados: ${trials}/${site.trials.free} (gratis)`}
          </div>
        </div>
        <div className="rounded-2xl border border-amber/50 bg-amber/10 p-4 text-sm">
          <div className="font-semibold">¿Tienes código de por vida?</div>
          <div className="mt-2 flex gap-2">
            <input className="flex-1 rounded-2xl border border-black/10 px-3 py-2" placeholder="Ingresa tu código" value={license} onChange={e=>setLicense(e.target.value)} />
            <Button variant="secondary" onClick={saveLicense}>Guardar</Button>
          </div>
          <div className="text-black/60 mt-2">Precio único: USD {site.pricing.lifetimeUSD}. {site.copy.lifetimePitch}</div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-amber bg-amber/10 text-amber-900 p-4 text-sm">
          {error} Si ya compraste, pega tu código arriba y vuelve a intentar.
        </div>
      )}

      {step <= total && (
        <div className="grid md:grid-cols-2 gap-6">
          {step === 1 && (
            <div className="bg-white rounded-3xl shadow-soft p-6 border border-black/10">
              <h2 className="text-2xl font-bold">Estoy en…</h2>
              <input className="mt-4 w-full rounded-2xl border border-black/10 px-4 py-3" value={ciudad} onChange={e=>setCiudad(e.target.value)} placeholder="Ciudad, País" />
              <div className="mt-6 flex gap-3"><Button onClick={()=>setStep(2)}>Siguiente</Button></div>
            </div>
          )}
          {step === 2 && (
            <div className="bg-white rounded-3xl shadow-soft p-6 border border-black/10">
              <h2 className="text-2xl font-bold">Somos…</h2>
              <div className="mt-4 flex gap-2">
                {[1,2,3,4,5,6].map(n => (
                  <button key={n} onClick={()=>setPersonas(n)} className={`px-4 py-2 rounded-2xl border ${personas===n?'bg-amber border-amber text-charcoal':'border-black/10'}`}>{n}</button>
                ))}
              </div>
              <div className="mt-6 flex gap-3"><Button onClick={()=>setStep(3)}>Siguiente</Button></div>
            </div>
          )}
          {step === 3 && (
            <div className="bg-white rounded-3xl shadow-soft p-6 border border-black/10">
              <h2 className="text-2xl font-bold">Mi cocina</h2>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {['30 min','45 min','Sin preferencia'].map(m => (
                  <button key={m} onClick={()=>setModo(m as any)} className={`px-4 py-2 rounded-2xl border ${modo===m?'bg-amber border-amber text-charcoal':'border-black/10'}`}>{m}</button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {['Todo ok','Sin horno','Sin licuadora'].map(m => (
                  <button key={m} onClick={()=>setEquipo(m as any)} className={`px-4 py-2 rounded-2xl border ${equipo===m?'bg-amber border-amber text-charcoal':'border-black/10'}`}>{m}</button>
                ))}
              </div>
              <div className="mt-6 flex gap-3"><Button onClick={()=>setStep(4)}>Siguiente</Button></div>
            </div>
          )}
          {step === 4 && (
            <div className="bg-white rounded-3xl shadow-soft p-6 border border-black/10">
              <h2 className="text-2xl font-bold">Preferencias</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {['Económico','Vegetariano','Sin lácteos','Sin picante','Bajo en sodio','Ninguna'].map(p => {
                  const on = prefs.includes(p)
                  return (
                    <button key={p} onClick={()=>setPrefs(on?prefs.filter(x=>x!==p):[...prefs,p])}
                      className={`px-4 py-2 rounded-2xl border text-left ${on?'bg-amber border-amber text-charcoal':'border-black/10'}`}>{p}</button>
                  )
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <select className="rounded-2xl border border-black/10 px-4 py-3" value={nivel} onChange={e=>setNivel(e.target.value as any)}>
                  {['Básico','Intermedio','Avanzado'].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Alergias (ej. maní, gluten…)" value={alergias} onChange={e=>setAlergias(e.target.value)} />
              </div>
              <div className="mt-6 flex gap-3"><Button onClick={()=>setStep(5)}>Siguiente</Button></div>
            </div>
          )}
          {step === 5 && (
            <div className="bg-white rounded-3xl shadow-soft p-6 border border-black/10">
              <h2 className="text-2xl font-bold">Envíamelo</h2>
              <input className="mt-4 w-full rounded-2xl border border-black/10 px-4 py-3" placeholder="Tu email (opcional)" value={email} onChange={e=>setEmail(e.target.value)} />
              <input className="mt-3 w-full rounded-2xl border border-black/10 px-4 py-3" placeholder="WhatsApp (opcional)" value={whats} onChange={e=>setWhats(e.target.value)} />
              <div className="mt-6 flex gap-3"><Button onClick={generarPlan}>Confirmar y generar plan</Button></div>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-soft p-6 border border-black/10">
            <h3 className="text-xl font-bold">Resumen</h3>
            <ul className="mt-3 text-black/70 text-sm">
              <li>Ciudad: {ciudad}</li>
              <li>Personas: {personas}</li>
              <li>Tiempo: {modo}</li>
              <li>Equipo: {equipo}</li>
              <li>Prefs: {prefs.join(', ') || '—'}</li>
            </ul>
            <p className="text-sm text-black/60 mt-3">Tras confirmar, verás cantidades, costos estimados y podrás descargar el PDF o compartir por WhatsApp.</p>
          </div>
        </div>
      )}

      {ready && plan && (
        <div className="grid gap-6">
          <div className="bg-white rounded-3xl shadow-soft p-6 border border-black/10">
            <h2 className="text-2xl font-extrabold">Menú (Día 1–7)</h2>
            <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
              {plan.menu.map(d => (
                <div key={d.dia} className="rounded-2xl border border-black/10 p-4">
                  <div className="font-semibold">Día {d.dia}: {d.plato}</div>
                  <div className="text-black/70 mt-1">
                    Ingredientes: {d.ingredientes.map(i=>`${i.qty}${i.unit} ${i.name}`).join(', ')}
                  </div>
                  <div className="text-black/70">Pasos: {d.pasos.join(' | ')}</div>
                  <div className="text-black/80 mt-1">💡 {d.tip}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-soft p-6 border border-black/10">
            <h3 className="text-xl font-bold">Lista de compras (consolidada)</h3>
            <div className="mt-2 grid md:grid-cols-3 gap-4 text-sm">
              {Object.entries(plan.lista).map(([cat, items]) => (
                <div key={cat} className="rounded-2xl border border-black/10 p-4">
                  <div className="font-semibold flex items-center justify-between">
                    <span>{cat}</span>
                    <span className="text-black/60">{fmtCOP(plan.costos.porCategoria[cat] || 0)}</span>
                  </div>
                  <ul className="text-black/70 mt-2 space-y-1">
                    {items.map(it => (
                      <li key={`${it.name}-${it.unit}`}>{it.qty}{it.unit} {it.name} {it.estCOP ? `· ${fmtCOP(it.estCOP)}` : ''}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right font-semibold">Total estimado: {fmtCOP(plan.costos.total)}</div>
            <div className="text-xs text-black/60">{plan.costos.nota}</div>
          </div>

          <div className="bg-white rounded-3xl shadow-soft p-6 border border-black/10">
            <div className="font-semibold">Batch cooking</div>
            <div className="text-black/70 text-sm">Base A: {plan.batch.baseA}</div>
            <div className="text-black/70 text-sm">Base B: {plan.batch.baseB}</div>
            <div className="mt-6 flex flex-wrap gap-3">
              <PDFDownloadLink document={<PlanPDF plan={plan}/>} fileName={`PLATY_menu_${plan.meta.ciudad}.pdf`}>
                {({ loading }) => <Button disabled={loading}>{loading ? 'Generando PDF…' : 'Descargar PDF'}</Button>}
              </PDFDownloadLink>
              <a href={whatsUrl} target="_blank" rel="noreferrer"><Button variant="secondary">Compartir por WhatsApp</Button></a>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
