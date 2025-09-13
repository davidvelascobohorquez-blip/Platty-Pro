'use client'

import { useMemo, useState, useEffect } from 'react'
import Brand from '@/components/Brand'
import Button from '@/components/Button'
import StepperDots from '@/components/StepperDots'
import { pdf, Document, Page, Text, View, StyleSheet, Image as PDFImage } from '@react-pdf/renderer'
import { site } from '@/site.config'

/** =========================
 *  Tipos
 *  ========================= */
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

type Meals = 'Desayunos' | 'Almuerzos' | 'Cenas'
type Objetivo = 'Ahorrar' | 'Balanceado' | 'Alto en proteína' | 'Ligero'
type Dieta = 'Ninguna' | 'Vegetariana' | 'Vegana' | 'Keto' | 'Sin gluten'
type Equipo =
  | 'Horno'
  | 'Airfryer'
  | 'Microondas'
  | 'Licuadora'
  | 'Olla a presión'
  | 'Parrilla'
  | 'Ninguno'

/** =========================
 *  Utils
 *  ========================= */
function fmtCOP(n?: number) {
  if (typeof n !== 'number') return '-'
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

const fancyEasings = {
  fadeIn: 'fadeIn .25s ease',
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 12, fontFamily: 'Helvetica' },
  h1: { fontSize: 22, marginBottom: 8 },
  h2: { fontSize: 16, marginTop: 12, marginBottom: 6 },
  small: { fontSize: 10, color: '#555' },
  listItem: { marginBottom: 4 },
  table: { marginTop: 6, borderWidth: 1, borderColor: '#dddddd', borderRadius: 6, overflow: 'hidden' },
  tr: { flexDirection: 'row', alignItems: 'stretch' },
  th: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#f3f3f3',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#dddddd',
  },
  td: {
    fontSize: 11,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    borderRightWidth: 1,
    borderRightColor: '#eeeeee',
  },
})

/** =========================
 *  PDF
 *  ========================= */
function PlanPDF({ plan }: { plan: Plan }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          {/* Ajusta el path de tu marca si la tienes en /public/brand */}
          <PDFImage src="/brand/PLATY_wordmark_1800.png" style={{ width: 280 }} />
        </View>

        <Text style={styles.h1}>
          Menú semanal — {plan.meta.ciudad} · {plan.meta.modo} · {plan.meta.personas} pers
        </Text>
        <Text style={styles.small}>Incluye lista consolidada, cantidades (g/ml/ud) y costo estimado.</Text>

        <Text style={styles.h2}>Menú (Día 1–7)</Text>
        {plan.menu.map((d) => (
          <View key={d.dia} style={{ marginBottom: 8 }}>
            <Text>• Día {d.dia}: {d.plato}</Text>
            <Text>  Ingredientes: {d.ingredientes.map(i => `${i.qty} ${i.unit} ${i.name}`).join('; ')}</Text>
            <Text>  Pasos: {d.pasos.join(' | ')}</Text>
            <Text>  Tip: {d.tip}</Text>
          </View>
        ))}

        <Text style={styles.h2}>Lista de compras (consolidada)</Text>
        {Object.entries(plan.lista).map(([cat, items]) => (
          <Text key={cat} style={styles.listItem}>
            {cat}: {items.map((i) => `${i.qty} ${i.unit} ${i.name}`).join('; ')}
          </Text>
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
                <Text style={[styles.td, { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>
                  {fmtCOP(plan.costos.total)}
                </Text>
              </View>
            </View>
            <Text style={[styles.small, { marginTop: 4 }]}>{plan.costos.nota}</Text>
          </>
        )}

        {plan.tiendas && (
          <>
            <Text style={styles.h2}>Dónde comprar (sugerido)</Text>
            <Text>• Sugerido: {plan.tiendas.sugerida.nombre} ({plan.tiendas.sugerida.tipo})</Text>
            <Text>• Alternativas: {plan.tiendas.opciones.map((o) => o.nombre).join(', ')}</Text>
            <Text style={styles.small}>Búscalo en mapas: {plan.tiendas.mapsUrl}</Text>
          </>
        )}

        <View
          style={{
            position: 'absolute',
            bottom: 24,
            left: 32,
            right: 32,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Text style={styles.small}>
            {site.brand} · wa.me/{site.whatsapp} · {site.domain}
          </Text>
          <PDFImage src="/brand/PLATY_logo_icon_1024.png" style={{ width: 28, height: 28 }} />
        </View>
      </Page>
    </Document>
  )
}

/** =========================
 *  Página
 *  ========================= */
export default function DemoPage() {
  // Pasos del wizard
  const STEPS = [
    'Ciudad',
    'Comidas',
    'Personas',
    'Tiempo',
    'Equipo',
    'Preferencias',
    'Presupuesto',
    'Resumen',
  ] as const

  const [step, setStep] = useState(1)
  const total = STEPS.length

  // Estado de formulario
  const [ciudad, setCiudad] = useState('Bogotá, CO')
  const [comidas, setComidas] = useState<Meals[]>(['Almuerzos'])
  const [personas, setPersonas] = useState(2)
  const [modo, setModo] = useState<'15 min' | '30 min' | '45 min' | '60 min'>('30 min')
  const [equipo, setEquipo] = useState<Equipo[]>(['Microondas'])
  const [dieta, setDieta] = useState<Dieta>('Ninguna')
  const [alergias, setAlergias] = useState<string[]>([])
  const [objetivo, setObjetivo] = useState<Objetivo>('Ahorrar')
  const [presupuesto, setPresupuesto] = useState<number | ''>('' as any)

  // Backend-expecting fields
  const [prefs, setPrefs] = useState<string[]>(['Económico'])

  // Resultado
  const [plan, setPlan] = useState<Plan | null>(null)

  // Estados de carga
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [loadingPDF, setLoadingPDF] = useState(false)

  // Email
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  // Resumen incremental visible
  const [showLiveSummary, setShowLiveSummary] = useState(true)

  // Progreso real (sin superponer en mobile)
  useEffect(() => {
    document.documentElement.style.setProperty('--safe-top', 'env(safe-area-inset-top)')
  }, [])

  // Helpers de multi-select
  function toggleArray<T>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
  }

  // Prefs internas (mapeo rápido)
  useEffect(() => {
    const base: string[] = []
    if (objetivo === 'Ahorrar') base.push('Económico')
    if (dieta === 'Vegetariana') base.push('Vegetariano')
    if (dieta === 'Vegana') base.push('Vegano')
    if (dieta === 'Keto') base.push('Keto')
    if (dieta === 'Sin gluten') base.push('Sin gluten')
    if (alergias.length) base.push(`Alergias: ${alergias.join(', ')}`)
    if (comidas.length && comidas.length < 3) base.push(`Solo ${comidas.join(' y ')}`)
    setPrefs(base.length ? base : ['Económico'])
  }, [objetivo, dieta, alergias, comidas])

  // Generar plan
  async function generarPlan() {
    setLoadingPlan(true)
    setPlan(null)
    try {
      const res = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ciudad,
          personas,
          modo,
          equipo: equipo.length ? equipo.join(', ') : 'Ninguno',
          prefs, // pasa todo esto al prompt del backend/IA
          // extras no obligatorios, por si luego backend los usa:
          comidas,
          dieta,
          alergias,
          objetivo,
          presupuesto,
        }),
      })
      const data = await res.json()
      if (data?.error) {
        alert(data.error)
        setLoadingPlan(false)
        return
      }
      setPlan(data)
      setStep(total) // ir a resumen
    } catch (e) {
      alert('Uy… no pudimos generar el plan. Intenta de nuevo 🙏')
    } finally {
      setLoadingPlan(false)
    }
  }

  // Descargar PDF (cliente)
  async function descargarPDF() {
    if (!plan) return
    setLoadingPDF(true)
    try {
      const blob = await pdf(<PlanPDF plan={plan} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `PLATY_menu_${plan.meta.ciudad}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('No pudimos crear el PDF. Intenta otra vez.')
    } finally {
      setLoadingPDF(false)
    }
  }

  // WhatsApp share
  const whatsUrl = useMemo(() => {
    if (!plan) return '#'
    const totalTxt = plan.costos?.total ? ` · Total aprox: ${fmtCOP(plan.costos.total)}` : ''
    const msg = `Menú semanal ${site.brand} — ${plan.meta.ciudad} · ${plan.meta.modo} · ${plan.meta.personas} pers${totalTxt}. Incluye cantidades y costo estimado por ciudad. Ver en ${site.domain}`
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }, [plan])

  // Email
  async function enviarEmail() {
    if (!plan || !email) return
    setSending(true)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan }),
      })
      const j = await res.json()
      alert(j.ok ? 'Enviado ✅ Revisa tu correo.' : `No se pudo enviar: ${j.error || 'Error'}`)
    } catch (e: any) {
      alert('Error enviando email')
    } finally {
      setSending(false)
    }
  }

  const categoriaCards = useMemo(() => {
    if (!plan?.lista) return []
    const entries = Object.entries(plan.lista)
    return entries.map(([cat, items]) => {
      const totalCat = (plan.costos?.porCategoria?.[cat] ?? 0) as number
      return { cat, items, totalCat }
    })
  }, [plan])

  const showResumen = step >= 1 && showLiveSummary

  return (
    <main className="container py-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Brand />
          <div className="hidden sm:block text-xs text-stone">Demo · Personaliza y genera tu PDF</div>
        </div>
        <div className="min-w-[120px] flex justify-end">
          <StepperDots step={Math.min(step, total)} total={total} />
        </div>
      </div>

      {/* VOLVER */}
      {step > 1 && step < total && (
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="mb-4 inline-flex items-center gap-2 text-sm text-graphite hover:text-charcoal transition-colors"
          aria-label="Volver al paso anterior"
        >
          <span aria-hidden>←</span> Volver
        </button>
      )}

      {/* WIZARD */}
      {step < total && (
        <div className="grid md:grid-cols-2 gap-6" style={{ animation: fancyEasings.fadeIn }}>
          {/* Paso activo */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            {step === 1 && (
              <>
                <h2 className="text-2xl font-bold">¿En qué ciudad/país estás?</h2>
                <p className="text-sm text-stone mt-1">
                  Usamos tu ciudad para estimar <strong>precios locales</strong> y sugerir tiendas cercanas.
                </p>
                <input
                  className="mt-4 w-full rounded-2xl border border-line px-4 py-3"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Ej: Bogotá, CO"
                />
                <div className="mt-6"><Button onClick={() => setStep(2)}>Siguiente</Button></div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-2xl font-bold">¿Qué comidas quieres planear?</h2>
                <p className="text-sm text-stone mt-1">Puedes elegir <strong>una o varias</strong> (armamos 7 días igual).</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(['Desayunos', 'Almuerzos', 'Cenas'] as Meals[]).map((m) => {
                    const on = comidas.includes(m)
                    return (
                      <button
                        key={m}
                        onClick={() => setComidas((arr) => toggleArray(arr, m))}
                        className={`px-4 py-2 rounded-2xl border transition-colors ${
                          on ? 'bg-amber border-amber text-charcoal' : 'border-line hover:border-amber'
                        }`}
                      >
                        {m}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-6"><Button onClick={() => setStep(3)}>Siguiente</Button></div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-2xl font-bold">¿Para cuántas personas?</h2>
                <p className="text-sm text-stone mt-1">
                  Escalamos cantidades (g/ml/ud) y consolidamos compras para evitar desperdicios.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
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
                <div className="mt-6"><Button onClick={() => setStep(4)}>Siguiente</Button></div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="text-2xl font-bold">¿Cuánto tiempo quieres invertir?</h2>
                <p className="text-sm text-stone mt-1">Elige <strong>una</strong> opción. Afecta la dificultad y técnica.</p>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['15 min', '30 min', '45 min', '60 min'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setModo(m)}
                      className={`px-4 py-2 rounded-2xl border transition-colors ${
                        modo === m ? 'bg-amber border-amber text-charcoal' : 'border-line hover:border-amber'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="mt-6"><Button onClick={() => setStep(5)}>Siguiente</Button></div>
              </>
            )}

            {step === 5 && (
              <>
                <h2 className="text-2xl font-bold">¿Qué equipo tienes?</h2>
                <p className="text-sm text-stone mt-1">Puedes seleccionar <strong>varios</strong>. Adaptamos técnicas y recetas.</p>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['Horno','Airfryer','Microondas','Licuadora','Olla a presión','Parrilla','Ninguno'] as Equipo[]).map((m) => {
                    const on = equipo.includes(m)
                    return (
                      <button
                        key={m}
                        onClick={() => setEquipo((arr) => toggleArray(arr, m))}
                        className={`px-4 py-2 rounded-2xl border transition-colors ${
                          on ? 'bg-amber border-amber text-charcoal' : 'border-line hover:border-amber'
                        }`}
                      >
                        {m}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-6"><Button onClick={() => setStep(6)}>Siguiente</Button></div>
              </>
            )}

            {step === 6 && (
              <>
                <h2 className="text-2xl font-bold">Preferencias y alergias</h2>
                <p className="text-sm text-stone mt-1">
                  Selecciona <strong>dieta</strong> y marca alergias (si aplica). Esto guía al planificador.
                </p>
                <div className="mt-4">
                  <div className="text-sm font-semibold mb-2">Dieta</div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(['Ninguna','Vegetariana','Vegana','Keto','Sin gluten'] as Dieta[]).map(d => (
                      <button
                        key={d}
                        onClick={() => setDieta(d)}
                        className={`px-4 py-2 rounded-2xl border transition-colors ${
                          dieta === d ? 'bg-amber border-amber text-charcoal' : 'border-line hover:border-amber'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-semibold mb-2">Alergias / evita</div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {['Lácteos','Gluten','Mariscos','Frutos secos','Picante'].map(a => {
                      const on = alergias.includes(a)
                      return (
                        <button
                          key={a}
                          onClick={() => setAlergias(arr => toggleArray(arr, a))}
                          className={`px-4 py-2 rounded-2xl border transition-colors ${
                            on ? 'bg-amber border-amber text-charcoal' : 'border-line hover:border-amber'
                          }`}
                        >
                          {a}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-6"><Button onClick={() => setStep(7)}>Siguiente</Button></div>
              </>
            )}

            {step === 7 && (
              <>
                <h2 className="text-2xl font-bold">Objetivo & presupuesto</h2>
                <p className="text-sm text-stone mt-1">
                  Ajustamos ingredientes y técnicas según tu meta. El presupuesto ayuda a priorizar.
                </p>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Ahorrar','Balanceado','Alto en proteína','Ligero'] as Objetivo[]).map(o => (
                    <button
                      key={o}
                      onClick={() => setObjetivo(o)}
                      className={`px-4 py-2 rounded-2xl border transition-colors ${
                        objetivo === o ? 'bg-amber border-amber text-charcoal' : 'border-line hover:border-amber'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="text-sm text-stone">Presupuesto semanal (opcional, COP)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="mt-2 w-full rounded-2xl border border-line px-4 py-3"
                    value={presupuesto}
                    onChange={(e) => setPresupuesto(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ej: 120000"
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button onClick={() => setStep(8)} variant="secondary">Ver resumen</Button>
                  <Button onClick={generarPlan}>Confirmar y generar plan</Button>
                </div>

                {/* hint de carga */}
                {loadingPlan && (
                  <p className="text-xs text-stone mt-2">Estamos cocinando tu plan… puede tardar unos segundos 🍳</p>
                )}
              </>
            )}
          </div>

          {/* Resumen en vivo (columna derecha) */}
          {showResumen && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Resumen</h3>
                <button
                  className="text-xs underline decoration-amber underline-offset-4"
                  onClick={() => setShowLiveSummary((v) => !v)}
                >
                  {showLiveSummary ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <ul className="mt-3 text-graphite text-sm leading-6">
                <li><strong>Ciudad:</strong> {ciudad || '—'}</li>
                <li><strong>Comidas:</strong> {comidas.length ? comidas.join(', ') : '—'}</li>
                <li><strong>Personas:</strong> {personas}</li>
                <li><strong>Tiempo:</strong> {modo}</li>
                <li><strong>Equipo:</strong> {equipo.length ? equipo.join(', ') : '—'}</li>
                <li><strong>Dieta:</strong> {dieta}</li>
                <li><strong>Alergias:</strong> {alergias.length ? alergias.join(', ') : '—'}</li>
                <li><strong>Objetivo:</strong> {objetivo}</li>
                <li><strong>Presupuesto:</strong> {presupuesto ? fmtCOP(presupuesto) : '—'}</li>
              </ul>
              <p className="text-xs text-stone mt-3">
                Generaremos 7 {comidas.length === 1 ? comidas[0].toLowerCase() : 'días'}
                {' '}con cantidades exactas, lista consolidada y costo estimado por ciudad.
              </p>
            </div>
          )}
        </div>
      )}

      {/* RESULTADO */}
      {step === total && plan && (
        <div className="grid gap-6" style={{ animation: fancyEasings.fadeIn }}>
          {/* Encabezado */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-2xl font-extrabold">Tu menú semanal</h2>
              <p className="text-sm text-stone">
                {plan.meta.ciudad} · {plan.meta.modo} · {plan.meta.personas} pers
              </p>
            </div>
            <div className="flex gap-2">
              <a href={whatsUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary">Compartir WhatsApp</Button>
              </a>
              <Button onClick={descargarPDF} disabled={loadingPDF}>
                {loadingPDF ? 'Generando PDF…' : 'Descargar PDF'}
              </Button>
            </div>
          </div>

          {/* Vista previa: resumen por categoría */}
          {plan.lista && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <h3 className="text-xl font-bold">Resumen de compras por categoría</h3>
              <p className="text-sm text-stone">
                Perfecto para ir directo al pasillo correcto. Totales incluyen <strong>precios estimados</strong>.
              </p>
              <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {categoriaCards.map(({ cat, items, totalCat }) => (
                  <div key={cat} className="rounded-2xl border border-black/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{cat}</div>
                      <div className="text-black/70 text-sm">{fmtCOP(totalCat)}</div>
                    </div>
                    <ul className="mt-3 text-sm text-graphite space-y-1 max-h-40 overflow-auto pr-1">
                      {items.map((i, idx) => (
                        <li key={idx}>
                          {i.qty} {i.unit} · {i.name} {i.estCOP ? <span className="text-stone">({fmtCOP(i.estCOP)})</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {plan.costos && (
                <div className="mt-4 rounded-2xl border border-amber p-4 flex items-center justify-between">
                  <div className="font-semibold">Total estimado ({plan.meta.ciudad})</div>
                  <div className="text-2xl font-extrabold">{fmtCOP(plan.costos.total)}</div>
                </div>
              )}
              <p className="text-xs text-stone mt-2">
                * {plan.costos?.nota ?? 'Precios estimados por ciudad. Pueden variar por tienda/temporada.'}
              </p>
            </div>
          )}

          {/* Menú detallado */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <h3 className="text-xl font-bold">Menú (Día 1–7)</h3>
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

          {/* Acciones finales */}
          <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
            <div className="font-semibold">Batch cooking</div>
            <div className="text-graphite text-sm">Base A: {plan.batch.baseA}</div>
            <div className="text-graphite text-sm">Base B: {plan.batch.baseB}</div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Tu correo (para enviarte el PDF)"
                className="rounded-2xl border border-line px-4 py-3 w-full sm:w-80"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={enviarEmail} disabled={sending || !email}>
                {sending ? 'Enviando…' : 'Enviar por email'}
              </Button>
            </div>
            <p className="text-xs text-stone mt-2">Te enviaremos el PDF generado a tu correo.</p>
          </div>
        </div>
      )}

      {/* OVERLAY de carga al generar plan */}
      {loadingPlan && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-soft border border-line p-6 w-full max-w-sm text-center">
            <div className="animate-spin mx-auto mb-3 h-8 w-8 rounded-full border-2 border-amber border-t-transparent" />
            <div className="text-lg font-bold">¡Estamos preparando tu menú!</div>
            <p className="text-sm text-stone mt-1">
              Picando cebolla sin llorar… 🧅 Mezclando IA con sazón casera… 👩‍🍳
            </p>
            <p className="text-xs text-stone mt-2">Suele tardar ~10–20 seg según tu ciudad y preferencias.</p>
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

