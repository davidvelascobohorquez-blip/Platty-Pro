import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import pricebookCO from '@/data/pricebook.co.json' assert { type: 'json' }

export const runtime = 'nodejs'

// Definir tipos, estructuras y la lógica como antes, pero optimizando la parte de IA y personalización.
const TRIALS_FREE = 3

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=> ({} as any))
  const { ciudad='Bogotá', personas=2, modo='30 min', equipo='Todo ok', prefs=['Económico'] } = body || {}

  // Similitud con lo que discutimos antes pero con un mejor flujo de IA.
  try {
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const prompt = `Eres un chef IA planificador que genera menús semanales ajustados a ${personas} personas. 
      Considera estas preferencias: ${prefs.join(', ')} y genera un menú de 7 días con ingredientes locales y cantidad ajustada en g/ml/ud, para la ciudad de ${ciudad}.`
      
      const chat = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        messages: [{ role: 'user', content: prompt }]
      })

      const content = chat.choices?.[0]?.message?.content?.trim() || '{}'
      let ai: any = {}
      try { ai = JSON.parse(content) } catch { ai = {} }

      // Generación de menú, cálculos de costo y retorno
      const plan = generatePlan(ciudad, personas, modo, ai.menu)
      return NextResponse.json(plan)
    }
  } catch (e) {
    console.error(e)
  }
  return NextResponse.json({ error: "Error generando el menú" }, { status: 500 })
}
