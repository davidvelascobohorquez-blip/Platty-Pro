'use client'

import React, { useMemo, useState } from 'react'
import Brand from '@/components/Brand'
import Button from '@/components/Button'
import PlanPDF, { makePlanPdf } from '@/components/PlanPDF'

type Unit = 'g' | 'ml' | 'ud'
type ItemQty = { name: string; qty: number; unit: Unit; estCOP?: number }
type Plan = {
  menu: { dia: number; plato: string; ingredientes: ItemQty[]; pasos: string[]; tip: string }[]
  lista: Record<string, ItemQty[]>
  batch: { baseA: string; baseB: string }
  sobrantes: string[]
  meta: { ciudad: string; personas: number; modo: string; moneda: 'COP' }
  costos: { porCategoria: Record<string, number>; total: number; nota: string }
}

const moneyCO = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default function DemoPage() {
  // ====== FORM STATE (wizard) ======
  const [step, setStep] = useState<number>(1)

  const [ciudad, setCiudad] = useState('Bogotá')
  const [personas, setPersonas] = useState(2)

  const [tipoComida, setTipoComida] = useState<'Desayuno' | 'Almuerzo' | 'Cena'>('Almuerzo')
  const [modo, setModo] = useState('30 min')
  const [equipo, setEquipo] = useState<string[]>([]) // horno, airfryer, licuadora, olla presión...
  const [dieta, setDieta] = useState<string>('Normal')
  const [alergias, setAlergias] = useState<string[]>([])
  const [objetivo, setObjetivo] = useState<string>('Ahorro')

  // ====== RESULT STATE ======
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [makingPdf, setMakingPdf] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const progressPct = useMemo(() => {
    const total = 4
    return Math.round((Math.min(step, total) - 1) / (total - 1) * 100)
  }, [step])

  const prefs = useMemo(() => {
    // Enviamos señales útiles a la IA. El backend ignora campos desconocidos, pero "prefs" sí lo usa.
    const base: string[] = [objetivo, tipoComida]
    if (dieta !== 'Normal') base.push(dieta)
    if (alergias.length) base.push(`Alergias: ${alergias.join(', ')}`)
    if (equipo.length) base.push(`Equipo: ${equipo.join(', ')}`)
    return base
  }, [objetivo, tipoComida, dieta, alergias, equipo])

  async function handleGenerate() {
    setErrorMsg(null)
    setLoadingPlan(true)
    setPdfUrl(null)
    setPlan(null)
    try {
      const res = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ciudad,
          personas,
          modo,
          equipo: equipo.length ? equipo.join(', ') : 'Básico',
          prefs
        })
      })

      if (res.status === 402) {
        const j = await res.json().catch(() => ({}))
        setErrorMsg(j?.error || 'Has llegado al límite de pruebas gratis.')
        setLoadingPlan(false)
        return
      }

      if (!res.ok) throw new Error('No pudimos generar el plan. Intenta de nuevo.')
      const data: Plan = await res.json()
      setPlan(data)
      setStep(4)
    } catch (e: any) {
      setErrorMsg(e?.message || 'Ups, algo falló. Intenta otra vez.')
    } finally {
      setLoadingPlan(false)
    }
  }

  async function handleMakePdf() {
    if (!plan) return
    try {
      setMakingPdf(true)
      const { blob, filename } = await makePlanPdf(plan, {
        ciudad,
        tipoComida,
        objective: objetivo
      })
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)

      // Disparar descarga inmediata (además de dejar preview):
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
    } finally {
      setMakingPdf(false)
    }
  }

  return (
    <main className="container py-8">
      {/* HEADER */}
      <header className="flex items-center justify-between mb-6">
        <Brand />
        <div className="hidden sm:block text-sm text-stone">Demo</div>
      </header>

      {/* PROGRESS */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-stone mb-1">
          <span>Paso {Math.min(step, 4)} de 4</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-line overflow-hidden">
          <div
            className="h-2 bg-amber rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* WIZARD */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT: Steps */}
        <section className="lg:col-span-2">
          {/* STEP 1 */}
          {step === 1 && (
            <Card>
              <h2 className="text-2xl font-bold">¿Dónde y para cuántas personas?</h2>
              <p className="text-graphite mt-1">Con esto calculamos cantidades y precios locales.</p>

              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <Labeled label="Ciudad">
                  <input
                    className="input"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    placeholder="Ej: Bogotá, Medellín…"
                  />
                </Labeled>
                <Labeled label="Personas que comen">
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={personas}
                    onChange={(e) => setPersonas(Math.max(1, Number(e.target.value)))}
                  />
                </Labeled>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button onClick={() => setStep(2)}>Siguiente</Button>
              </div>
            </Card>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <Card>
              <h2 className="text-2xl font-bold">¿Qué comida, tiempo y equipo?</h2>
              <p className="text-graphite mt-1">
                Tiempo = cuánto quieres invertir cocinando. Equipo = electrodomésticos/herramientas que tienes.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Labeled label="Tipo de comida">
                  <div className="flex gap-2 flex-wrap">
                    {(['Desayuno', 'Almuerzo', 'Cena'] as const).map((t) => (
                      <Chip key={t} active={tipoComida === t} onClick={() => setTipoComida(t)}>{t}</Chip>
                    ))}
                  </div>
                </Labeled>

                <Labeled label="Tiempo de cocina">
                  <select className="input" value={modo} onChange={(e) => setModo(e.target.value)}>
                    <option>15 min</option>
                    <option>30 min</option>
                    <option>45 min</option>
                    <option>60 min</option>
                  </select>
                </Labeled>

                <Labeled label="Equipo disponible">
                  <div className="flex gap-2 flex-wrap">
                    {['Horno', 'Airfryer', 'Licuadora', 'Olla a presión', 'Sartén/Wok', 'Arrocera'].map((eq) => {
                      const on = equipo.includes(eq)
                      return (
                        <Chip
                          key={eq}
                          active={on}
                          onClick={() =>
                            setEquipo((cur) => (on ? cur.filter((x) => x !== eq) : [...cur, eq]))
                          }
                        >
                          {eq}
                        </Chip>
                      )
                    })}
                  </div>
                </Labeled>
              </div>

              <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>Volver</Button>
                <Button onClick={() => setStep(3)}>Siguiente</Button>
              </div>
            </Card>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <Card>
              <h2 className="text-2xl font-bold">Preferencias y restricciones</h2>
              <p className="text-graphite mt-1">Para variar el menú sin dramas.</p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Labeled label="Estilo/dieta">
                  <select className="input" value={dieta} onChange={(e) => setDieta(e.target.value)}>
                    <option>Normal</option>
                    <option>Saludable</option>
                    <option>Alta proteína</option>
                    <option>Vegetariano</option>
                    <option>Vegano</option>
                    <option>Sin gluten</option>
                    <option>Sin lactosa</option>
                  </select>
                </Labeled>

                <Labeled label="Objetivo">
                  <select className="input" value={objetivo} onChange={(e) => setObjetivo(e.target.value)}>
                    <option>Ahorro</option>
                    <option>Variedad</option>
                    <option>Express (muy rápido)</option>
                  </select>
                </Labeled>

                <Labeled label="Alergias (opcional)">
                  <div className="flex gap-2 flex-wrap">
                    {['Maní', 'Mariscos', 'Gluten', 'Lácteos', 'Huevo'].map((al) => {
                      const on = alergias.includes(al)
                      return (
                        <Chip
                          key={al}
                          active={on}
                          onClick={() =>
                            setAlergias((cur) => (on ? cur.filter((x) => x !== al) : [...cur, al]))
                          }
                        >
                          {al}
                        </Chip>
                      )
                    })}
                  </div>
                </Labeled>
              </div>

              <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>Volver</Button>
                <Button onClick={() => setStep(4)}>Continuar</Button>
              </div>
            </Card>
          )}

          {/* STEP 4: Confirm / Generate */}
          {step === 4 && !plan && (
            <Card>
              <h2 className="text-2xl font-bold">Confirma y genera tu menú</h2>
              <p className="text-graphite mt-1">Si ves todo bien, ¡dale al botón! 🔥</p>

              <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
                <li className="p-4 rounded-2xl bg-card border border-line">
                  <div className="font-semibold">Ciudad</div>
                  <div className="text-graphite">{ciudad}</div>
                </li>
                <li className="p-4 rounded-2xl bg-card border border-line">
                  <div className="font-semibold">Personas</div>
                  <div className="text-graphite">{personas}</div>
                </li>
                <li className="p-4 rounded-2xl bg-card border border-line">
                  <div className="font-semibold">Tipo de comida</div>
                  <div className="text-graphite">{tipoComida}</div>
                </li>
                <li className="p-4 rounded-2xl bg-card border border-line">
                  <div className="font-semibold">Tiempo</div>
                  <div className="text-graphite">{modo}</div>
                </li>
                <li className="p-4 rounded-2xl bg-card border border-line">
                  <div className="font-semibold">Equipo</div>
                  <div className="text-graphite">{equipo.length ? equipo.join(', ') : 'Básico'}</div>
                </li>
                <li className="p-4 rounded-2xl bg-card border border-line">
                  <div className="font-semibold">Preferencias</div>
                  <div className="text-graphite">{prefs.join(' · ')}</div>
                </li>
              </ul>

              {errorMsg && <div className="mt-4 text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl">{errorMsg}</div>}

              <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(3)}>Volver</Button>
                <Button onClick={handleGenerate}>Confirmar y generar</Button>
              </div>
            </Card>
          )}

          {/* RESULTS */}
          {plan && (
            <Card>
              <h2 className="text-2xl font-extrabold">¡Tu menú de 7 días está listo! 🍽️</h2>
              <p className="text-graphite mt-1">
                Ciudad: <strong>{plan.meta.ciudad}</strong> · Personas: <strong>{plan.meta.personas}</strong> · Tiempo: <strong>{plan.meta.modo}</strong>
              </p>

              {/* Menú por día */}
              <div className="mt-6 grid gap-3">
                {plan.menu.map((d) => (
                  <div key={d.dia} className="rounded-2xl border border-line p-4 bg-card">
                    <div className="font-semibold">Día {d.dia}: {d.plato}</div>
                    <div className="text-sm text-graphite">
                      Ingredientes: {d.ingredientes.map(i => `${i.qty} ${i.unit} ${i.name}`).join(', ')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen por categoría */}
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-3">Resumen por categoría</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(plan.lista).map(([cat, items]) => (
                    <div key={cat} className="rounded-2xl border border-line bg-white p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-semibold">{cat}</div>
                        <div className="text-sm text-stone">
                          {moneyCO.format(
                            items.reduce((acc, it) => acc + (it.estCOP || 0), 0)
                          )}
                        </div>
                      </div>
                      <ul className="text-sm text-graphite space-y-1">
                        {items.map((it, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span>{it.name} · {it.qty} {it.unit}</span>
                            <span className="text-stone">{it.estCOP ? moneyCO.format(it.estCOP) : '—'}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="font-semibold">Total estimado</div>
                  <div className="text-lg font-extrabold">{moneyCO.format(plan.costos.total)}</div>
                </div>
                <p className="text-sm text-stone mt-2">{plan.costos.nota}</p>
              </div>

              {/* PDF actions */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={handleMakePdf} disabled={makingPdf}>
                  {makingPdf ? 'Armando PDF… ⏳' : 'Descargar PDF'}
                </Button>
                {pdfUrl && (
                  <a
                    className="underline decoration-amber decoration-4 underline-offset-4 text-charcoal"
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver vista previa en pestaña nueva
                  </a>
                )}
              </div>

              {/* Inline PDF preview (si ya generamos) */}
              {pdfUrl && (
                <div className="mt-6 rounded-2xl overflow-hidden border border-line">
                  <iframe src={pdfUrl} className="w-full h-[600px]" />
                </div>
              )}
            </Card>
          )}
        </section>

        {/* RIGHT: Live Summary */}
        <aside className="lg:col-span-1">
          <Card>
            <h3 className="text-lg font-bold">Resumen rápido</h3>
            <ul className="mt-3 text-sm text-graphite space-y-2">
              <li><span className="font-semibold">Ciudad:</span> {ciudad}</li>
              <li><span className="font-semibold">Personas:</span> {personas}</li>
              <li><span className="font-semibold">Comida:</span> {tipoComida}</li>
              <li><span className="font-semibold">Tiempo:</span> {modo}</li>
              <li><span className="font-semibold">Equipo:</span> {equipo.length ? equipo.join(', ') : 'Básico'}</li>
              <li><span className="font-semibold">Dieta / objetivo:</span> {dieta} · {objetivo}</li>
              {alergias.length > 0 && <li><span className="font-semibold">Alergias:</span> {alergias.join(', ')}</li>}
            </ul>
            {!plan && (
              <p className="mt-3 text-xs text-stone">
                Tip: mientras avanzas, este resumen se va actualizando. Nada se guarda hasta que generes tu plan.
              </p>
            )}
          </Card>

          {/* Cute loading card while generando */}
          {loadingPlan && (
            <div className="mt-6 p-5 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="text-lg font-bold">Estamos cocinando tu menú…</div>
              <p className="text-graphite text-sm mt-1">
                Sacando la olla, pelando la cebolla y hablando con la IA 👩‍🍳🤖. Esto puede tardar unos segundos.
              </p>
              <div className="mt-4 animate-pulse text-4xl">⏳</div>
            </div>
          )}
        </aside>
      </div>

      {/* Floating loading overlay (opcional) */}
      {(loadingPlan || makingPdf) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="rounded-2xl bg-white p-6 shadow-xl border border-line w-[min(95vw,520px)]">
            <div className="text-xl font-bold">{loadingPlan ? 'Generando tu plan…' : 'Creando PDF…'}</div>
            <p className="text-stone mt-1">
              {loadingPlan
                ? 'Afilando cuchillos y pidiéndole ideas a la IA. Quédate por aquí…'
                : 'Acomodando letras, sumando ingredientes y dejando el PDF bonito.'}
            </p>
            <div className="mt-4 h-2 rounded-full bg-line overflow-hidden">
              <div className="h-2 bg-amber animate-[progress_1.6s_ease_infinite]" style={{ width: '60%' }} />
            </div>
          </div>
          <style jsx>{`
            @keyframes progress {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
          `}</style>
        </div>
      )}
    </main>
  )
}

/* ----------------- UI helpers ----------------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl shadow-soft border border-line p-6">
      {children}
    </div>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-semibold mb-2">{label}</div>
      {children}
    </label>
  )
}

function Chip({
  active,
  onClick,
  children
}: {
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 py-1.5 rounded-full border text-sm',
        active ? 'bg-amber/10 border-amber text-charcoal' : 'bg-white border-line text-graphite hover:bg-stone-50'
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function InputBase({ className = '', ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input ${className}`} {...rest} />
}

// Tailwind shortcuts used above
declare global {
  // This lets us use className "input" without TypeScript whining
  interface HTMLElementTagNameMap {
    input: HTMLInputElement
  }
}


