'use client'

import { useState, useMemo } from 'react'
import Brand from '@/components/Brand'
import Button from '@/components/Button'
import { site } from '@/site.config'

export default function Page() {
  const [step, setStep] = useState(1)
  const [ciudad, setCiudad] = useState('Bogotá')
  const [personas, setPersonas] = useState(2)
  const [modo, setModo] = useState('30 min')
  const [equipo, setEquipo] = useState('Todo ok')
  const [prefs, setPrefs] = useState(['Económico'])
  const [loading, setLoading] = useState(false)
  const [menuGenerated, setMenuGenerated] = useState(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  // Function to handle the generation of the plan
  const handleGeneratePlan = async () => {
    setLoading(true)

    // Here would be the call to generate the plan based on the user's selection
    // Using a mock delay to simulate the processing time

    setTimeout(() => {
      setLoading(false)
      setStep(3)
      // Simulate a generated menu
      setMenuGenerated({
        menu: [
          { dia: 1, plato: 'Arroz con pollo', ingredientes: [{name: 'arroz', qty: 180, unit: 'g'}, {name: 'pollo', qty: 280, unit: 'g'}] },
          // Add more days of the week...
        ],
        costos: { total: 20000 },
      })
    }, 2000)
  }

  // Function to handle PDF generation
  const handleGeneratePDF = () => {
    setGeneratingPDF(true)

    // Mock PDF generation delay
    setTimeout(() => {
      setGeneratingPDF(false)
      alert('¡PDF generado exitosamente!')
    }, 3000)
  }

  return (
    <main className="container py-14">
      {/* HEADER */}
      <header className="flex items-center justify-between">
        <Brand />
      </header>

      {/* STEP 1: Select Time and Equipment */}
      {step === 1 && (
        <section className="mt-16 grid gap-6">
          <h2 className="text-3xl font-bold">Tiempo y equipo</h2>
          <div>
            <p className="text-lg">Selecciona el tiempo que quieres invertir cocinando:</p>
            <div className="flex gap-4 mt-4">
              <Button onClick={() => setModo('30 min')} variant={modo === '30 min' ? 'primary' : 'secondary'}>30 min</Button>
              <Button onClick={() => setModo('45 min')} variant={modo === '45 min' ? 'primary' : 'secondary'}>45 min</Button>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-lg">¿Tienes equipo específico en casa?</p>
            <div className="flex gap-4 mt-4">
              <Button onClick={() => setEquipo('Todo ok')} variant={equipo === 'Todo ok' ? 'primary' : 'secondary'}>Todo ok</Button>
              <Button onClick={() => setEquipo('Sin horno')} variant={equipo === 'Sin horno' ? 'primary' : 'secondary'}>Sin horno</Button>
              <Button onClick={() => setEquipo('Sin licuadora')} variant={equipo === 'Sin licuadora' ? 'primary' : 'secondary'}>Sin licuadora</Button>
            </div>
          </div>

          <div className="mt-8">
            <Button onClick={handleGeneratePlan} disabled={loading} className="w-full">
              {loading ? 'Generando menú...' : 'Siguiente'}
            </Button>
          </div>
        </section>
      )}

      {/* STEP 2: Preferences and Budget */}
      {step === 2 && (
        <section className="mt-16 grid gap-6">
          <h2 className="text-3xl font-bold">Preferencias y presupuesto</h2>
          <p className="text-lg">Selecciona tus preferencias alimenticias:</p>
          <div className="flex gap-4 mt-4">
            <Button onClick={() => setPrefs(['Económico'])} variant={prefs.includes('Económico') ? 'primary' : 'secondary'}>Económico</Button>
            <Button onClick={() => setPrefs(['Vegetariano'])} variant={prefs.includes('Vegetariano') ? 'primary' : 'secondary'}>Vegetariano</Button>
            <Button onClick={() => setPrefs(['Sin lácteos'])} variant={prefs.includes('Sin lácteos') ? 'primary' : 'secondary'}>Sin lácteos</Button>
          </div>

          <div className="mt-8">
            <Button onClick={handleGeneratePlan} disabled={loading} className="w-full">
              {loading ? 'Generando menú...' : 'Confirmar y generar plan'}
            </Button>
          </div>
        </section>
      )}

      {/* STEP 3: Display Results and Generate PDF */}
      {step === 3 && menuGenerated && (
        <section className="mt-16 grid gap-6">
          <h2 className="text-3xl font-bold">Tu menú semanal</h2>
          <div>
            {menuGenerated.menu.map((day) => (
              <div key={day.dia} className="mb-4">
                <h3 className="text-xl font-semibold">Día {day.dia}: {day.plato}</h3>
                <ul className="mt-2">
                  {day.ingredientes.map((ing, index) => (
                    <li key={index}>{ing.qty} {ing.unit} de {ing.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Button onClick={handleGeneratePDF} disabled={generatingPDF} className="w-full">
              {generatingPDF ? 'Generando PDF...' : 'Generar PDF'}
            </Button>
          </div>

          <div className="mt-4">
            <p className="text-lg">Costo estimado: {menuGenerated.costos.total} COP</p>
          </div>
        </section>
      )}
    </main>
  )
}

