import { useState, useMemo } from 'react'
import Brand from '@/components/Brand'
import Button from '@/components/Button'
import { site } from '@/site.config'

export default function Page() {
  const [step, setStep] = useState(1)
  const [generating, setGenerating] = useState(false)  // Estado para mostrar el spinner
  const total = 4
  const [ciudad, setCiudad] = useState('Bogotá, CO')
  const [personas, setPersonas] = useState(2)
  const [modo, setModo] = useState<'30 min'|'45 min'|'Sin preferencia'>('30 min')
  const [equipo, setEquipo] = useState<'Todo ok'|'Sin horno'|'Sin licuadora'>('Sin horno')
  const [prefs, setPrefs] = useState<string[]>(['Económico'])
  const [plan, setPlan] = useState<any | null>(null)

  // Función para simular la generación del plan
  const generarPlan = async () => {
    setGenerating(true)  // Mostrar el spinner
    // Aquí podrías hacer la llamada a la API para generar el menú
    // Simulamos la demora con un setTimeout
    setTimeout(() => {
      setPlan({ /* datos generados */ })
      setGenerating(false)  // Ocultar el spinner cuando se termine
    }, 3000);  // Simulando una carga de 3 segundos
  }

  return (
    <main className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <Brand />
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

      {/* Spinner de carga */}
      {generating && (
        <div className="loading-screen">
          <p className="text-center">¡Cocinando tu menú personalizado con magia de IA!</p>
          <div className="spinner"></div>
        </div>
      )}

      {/* Formulario de generación de plan */}
      {!generating && step <= total && (
        <div className="grid md:grid-cols-2 gap-6">
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
                <Button onClick={() => setStep(2)}>Siguiente</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <h2 className="text-2xl font-bold">¿Para cuántas personas?</h2>
              <p className="text-sm text-stone mt-1">El plan escalará cantidades (g/ml/ud) según tu elección.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[1,2,3,4,5,6].map(n => (
                  <button key={n} onClick={() => setPersonas(n)} 
                    className={`px-4 py-2 rounded-2xl border transition-colors ${personas === n ? 'bg-amber border-amber text-charcoal' : 'border-line hover:border-amber'}`}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <Button onClick={() => setStep(3)}>Siguiente</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <h2 className="text-2xl font-bold">Tiempo y equipo</h2>
              <p className="text-sm text-stone mt-1">Selecciona <strong>una</strong> opción por línea para el tiempo que quieres invertir cocinando.</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {['30 min', '45 min', 'Sin preferencia'].map(m => (
                  <button key={m} onClick={() => setModo(m as any)} 
                    className={`px-4 py-2 rounded-2xl border transition-colors ${modo === m ? 'bg-amber border-amber text-charcoal' : 'border-line hover:border-amber'}`}>
                    {m}
                  </button>
                ))}
              </div>
              <p className="text-sm text-stone mt-2">¿Tienes equipo específico en casa?</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {['Todo ok', 'Sin horno', 'Sin licuadora'].map(m => (
                  <button key={m} onClick={() => setEquipo(m as any)} 
                    className={`px-4 py-2 rounded-2xl border transition-colors ${equipo === m ? 'bg-amber border-amber text-charcoal' : 'border-line hover:border-amber'}`}>
                    {m}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <Button onClick={() => setStep(4)}>Siguiente</Button>
              </div>
            </div>
          )}

          {/* Preferencias y presupuesto */}
          {step === 4 && (
            <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
              <h2 className="text-2xl font-bold">Preferencias y presupuesto</h2>
              <p className="text-sm text-stone mt-1">Puedes seleccionar <strong>varias</strong> opciones.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {['Económico', 'Vegetariano', 'Sin lácteos', 'Sin picante', 'Bajo sodio', 'Ninguna'].map(p => {
                  const on = prefs.includes(p)
                  return (
                    <button key={p} onClick={() => setPrefs(on ? prefs.filter(x => x !== p) : [...prefs, p])} 
                      className={`px-4 py-2 rounded-2xl border text-left transition-colors ${on ? 'bg-amber border-amber text-charcoal' : 'border-line hover:border-amber'}`}>
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
        </div>
      )}

      {/* Resumen de generación */}
      {plan && !generating && (
        <div className="bg-card rounded-3xl shadow-soft border border-line p-6">
          <h3 className="text-xl font-bold">Resumen</h3>
          <ul className="mt-3 text-graphite">
            <li>Ciudad: {ciudad}</li>
            <li>Personas: {personas}</li>
            <li>Modo: {modo}</li>
            <li>Equipo: {equipo}</li>
            <li>Prefs: {prefs.join(', ') || '—'}</li>
          </ul>
          <div className="mt-3 text-center">
            <Button onClick={() => alert('Generando PDF...')}>Generar PDF</Button>
          </div>
        </div>
      )}

      <style jsx>{`
        .loading-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid #f3f3f3;
          border-top: 5px solid #3498db;
          border-radius: 50%;
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  )
}

