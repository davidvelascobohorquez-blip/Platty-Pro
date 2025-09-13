import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import pricebookCO from '@/data/pricebook.co.json' assert { type: 'json' }

export const runtime = 'nodejs'

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

const TRIALS_FREE = 3
const toCOP = (n: number) => Math.round(n)

function cityMultiplier(ciudad: string) {
  const c = ciudad.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const key = Object.keys((pricebookCO as any).cityMultipliers).find(k =>
    c.toLowerCase().includes(k.toLowerCase())
  )
  return key ? (pricebookCO as any).cityMultipliers[key] : 1.0
}

function unitPriceCOP(name: string, ciudad: string): { perGram?: number; perMl?: number; perUnit?: number } {
  const info = (pricebookCO as any).ingredients[name]
  if (!info) return {}
  const mult = cityMultiplier(ciudad)
  const base = info.price * mult
  if (info.unit === 'kg') return { perGram: base / 1000 }
  if (info.unit === 'l') return { perMl: base / 1000 }
  if (info.unit === 'ud') return { perUnit: base }
  return {}
}

function estimateItemCOP(it: ItemQty, ciudad: string) {
  const p = unitPriceCOP(it.name, ciudad)
  if (it.unit === 'g' && p.perGram) return it.qty * p.perGram
  if (it.unit === 'ml' && p.perMl) return it.qty * p.perMl
  if (it.unit === 'ud' && p.perUnit) return it.qty * p.perUnit
  return undefined
}

function consolidate(items: ItemQty[]) {
  const map = new Map<string, ItemQty>()
  for (const it of items) {
    const key = `${it.name}__${it.unit}`
    const prev = map.get(key)
    if (!prev) map.set(key, { ...it })
    else prev.qty += it.qty
  }
  return [...map.values()]
}

function friendlyQty(q: number, u: Unit) {
  if (u === 'g' || u === 'ml') return q < 100 ? Math.round(q / 25) * 25 : Math.round(q / 50) * 50
  return Math.round(q)
}

function fallbackPlan(ciudad: string, personas: number, modo: string): Plan {
  const base = [
    { dia: 1, plato: 'Arroz con pollo', receta: [{ n: 'arroz', u: 'g', pp: 90 }, { n: 'pollo pechuga', u: 'g', pp: 140 }, { n: 'tomate', u: 'g', pp: 80 }] },
    { dia: 2, plato: 'Pasta con tomate', receta: [{ n: 'pasta', u: 'g', pp: 100 }, { n: 'tomate', u: 'g', pp: 120 }, { n: 'cebolla', u: 'g', pp: 50 }] },
    // Add more days...
  ]

  const menu = base.map(d => {
    const ingredientes: ItemQty[] = d.receta.map(r => ({
      name: r.n, unit: r.u as Unit, qty: friendlyQty(r.pp * personas, r.u as Unit)
    }))
    return { dia: d.dia, plato: d.plato, ingredientes, pasos: ['Picar', 'Saltear', 'Cocer', 'Servir'], tip: 'Aprovecha bases para otros días' }
  })

  const cats: Record<string, string[]> = {
    Verduras: ['tomate', 'cebolla', 'zanahoria'],
    Proteína: ['pollo pechuga', 'huevo'],
    Granos: ['arroz', 'pasta'],
    Abarrotes: ['aceite', 'ajo'],
  }

  const all = consolidate(menu.flatMap(m => m.ingredientes)).map(it => ({ ...it, qty: friendlyQty(it.qty, it.unit) }))
  
  // Ahora generamos un objeto con claves dinámicas (no un arreglo)
  const lista: Record<string, ItemQty[]> = {}
  for (const it of all) {
    const cat = Object.keys(cats).find(k => cats[k].includes(it.name)) || 'Otros'
    if (!lista[cat]) lista[cat] = []
    const est = estimateItemCOP(it, ciudad)
    lista[cat].push({ ...it, estCOP: est !== undefined ? toCOP(est) : undefined })
  }

  const porCategoria: Record<string, number> = {}
  for (const [cat, items] of Object.entries(lista)) {
    porCategoria[cat] = toCOP(items.reduce((acc, i) => acc + (i.estCOP || 0), 0))
  }

  const subtotal = Object.values(porCategoria).reduce((a, b) => a + b, 0)
  const total = toCOP(subtotal * 1.10)

  return {
    meta: { ciudad, personas, modo, moneda: 'COP' },
    menu,
    lista,
    batch: { baseA: 'Sofrito para 3 días', baseB: 'Caldo base para sopas' },
    sobrantes: ['Arroz cocido', 'Sofrito'],
    costos: { porCategoria, total, nota: 'Estimado con Pricebook local (+10% buffer). Puede variar por tienda/temporada.' }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any))
  const { ciudad = 'Bogotá', personas = 2, modo = '30 min', equipo = 'Todo ok', prefs = ['Económico'] } = body || {}

  const store = cookies() // Aquí ya está la importación de cookies
  const trialsCookie = store.get('platy_trials')?.value
  const trials = Number(trialsCookie || 0)
  const licenseHeader = req.headers.get('x-platy-license') || store.get('platy_license')?.value
  const hasLicense = !!licenseHeader && licenseHeader === process.env.PLATY_LIFETIME_CODE

  if (!hasLicense && trials >= TRIALS_FREE) {
    return NextResponse.json(
      { error: `Has usado tus ${TRIALS_FREE} intentos gratis. Ingresa tu código de por vida para continuar.`, code: 'TRIALS_EXCEEDED' },
      { status: 402, headers: { 'x-platy-trials': String(trials), 'x-platy-has-license': 'false' } }
    )
  }

  try {
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const schema = {
        type: 'object', properties: {
          menu: { type: 'array', items: { type: 'object', properties: {
            dia: { type: 'number' }, plato: { type: 'string' },
            ingredientes: { type: 'array', items: { type: 'object', properties: {
              name: { type: 'string' }, qty: { type: 'number' }, unit: { type: 'string', enum: ['g', 'ml', 'ud'] }
            }, required: ['name', 'qty', 'unit'] }},
            pasos: { type: 'array', items: { type: 'string' }}, tip: { type: 'string' }
          }, required: ['dia', 'plato', 'ingredientes', 'pasos', 'tip'] }}
        }, required: ['menu']
      } as const

      const prompt = `Eres chef planificador para ${personas} personas en ${ciudad}, tiempo ${modo}, equipo ${equipo}, preferencias: ${prefs.join(', ')}.
Devuelve JSON con 7 días (menu[].dia 1..7), plato y lista de ingredientes con cantidades YA ESCALADAS (qty) y unit en g/ml/ud.
Respeta exactamente este schema: ${JSON.stringify(schema)}`

      // ===== FIX: usar Chat Completions en lugar de Responses =====
      const chat = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Eres un chef planificador que devuelve estrictamente JSON válido.' },
          { role: 'user', content: prompt }
        ]
      })

      const content = chat.choices?.[0]?.message?.content?.trim() || '{}'
      let ai: any = {}
      try { ai = JSON.parse(content) } catch { ai = {} }
      // ============================================================

      const base = fallbackPlan(ciudad, personas, modo)
      if (ai?.menu?.length === 7) {
        base.menu = ai.menu
        const all = consolidate(base.menu.flatMap((m: any) => m.ingredientes)).map((it: any) => ({ ...it, qty: friendlyQty(it.qty, it.unit) }))
        const cats: Record<string, string[]> = {
          Verduras: ['tomate', 'cebolla', 'pimentón', 'zanahoria', 'brocoli', 'papa'],
          Proteína: ['pollo pechuga', 'huevo', 'queso'],
          Granos: ['arroz', 'pasta', 'tortilla', 'arepa'],
          Abarrotes: ['aceite', 'ajo']
        }
        const lista: Record<string, ItemQty[]> = {}
        for (const it of all) {
          const cat = Object.keys(cats).find(k => cats[k].includes(it.name)) || 'Otros'
          if (!lista[cat]) lista[cat] = []
          const est = estimateItemCOP(it, ciudad)
          lista[cat].push({ ...it, estCOP: est !== undefined ? toCOP(est) : undefined })
        }
        const porCategoria: Record<string, number> = {}
        for (const [cat, items] of Object.entries(lista)) {
          porCategoria[cat] = toCOP(items.reduce((acc, i) => acc + (i.estCOP || 0), 0))
        }
        const subtotal = Object.values(porCategoria).reduce((a, b) => a + b, 0)
        base.lista = lista
        base.costos = { porCategoria, total: toCOP(subtotal * 1.10), nota: 'Estimado con Pricebook local (+10% buffer). Puede variar por tienda/temporada.' }
      }

      const res = NextResponse.json(base, { headers: { 'x-platy-has-license': String(hasLicense), 'x-platy-trials': String(trials) } })
      if (hasLicense) res.cookies.set('platy_license', licenseHeader!, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
      else res.cookies.set('platy_trials', String(trials + 1), { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
      return res
    }
  } catch {}

  const plan = fallbackPlan(ciudad, personas, modo)
  const res = NextResponse.json(plan, { headers: { 'x-platy-has-license': String(hasLicense), 'x-platy-trials': String(trials) } })
  if (hasLicense) res.cookies.set('platy_license', licenseHeader!, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
  else res.cookies.set('platy_trials', String(trials + 1), { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
  return res
}

