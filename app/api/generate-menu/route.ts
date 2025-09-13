import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import pricebookCO from '@/data/pricebook.co.json' assert { type: 'json' }

export const runtime = 'nodejs'

type Unit = 'g' | 'ml' | 'ud'
type ItemQty = { name: string; qty: number; unit: Unit; estCOP?: number }

type StoreOpt = { nombre: string; tipo: 'hard-discount' | 'supermercado' }

type Plan = {
  menu: { dia: number; plato: string; ingredientes: ItemQty[]; pasos: string[]; tip: string }[]
  lista: Record<string, ItemQty[]>
  batch: { baseA: string; baseB: string }
  sobrantes: string[]
  meta: { ciudad: string; personas: number; modo: string; moneda: 'COP'; meal: string }
  costos: {
    porCategoria: Record<string, number>
    total: number
    nota: string
    detalle: { name: string; qty: number; unit: Unit; estCOP?: number }[]
  }
  tiendas: { sugerida: StoreOpt; opciones: StoreOpt[]; mapsUrl: string }
}

const TRIALS_FREE = 3
const toCOP = (n: number) => Math.round(n)

function deaccent(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
function norm(s: string) {
  return deaccent(s).toLowerCase().trim()
}

function cityMultiplier(ciudad: string) {
  const c = norm(ciudad)
  const cms = (pricebookCO as any).cityMultipliers || {}
  const key = Object.keys(cms).find(k => c.includes(norm(k)))
  return key ? cms[key] : 1.0
}

function unitPriceCOP(name: string, ciudad: string): { perGram?: number; perMl?: number; perUnit?: number } {
  const ing = (pricebookCO as any).ingredients || {}
  const info = ing[name] || ing[norm(name)] // tratar de calzar por nombre normalizado
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
    const key = `${norm(it.name)}__${it.unit}`
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

function categoriasMap() {
  // Mapeo flexible por normalización para agrupar más ingredientes
  return {
    'Frutas y verduras': ['tomate', 'cebolla', 'zanahoria', 'pimenton', 'pimentón', 'brocoli', 'brócoli', 'papa', 'limon', 'limón', 'cilantro', 'lechuga', 'pepino', 'banano', 'aguacate', 'ajo'],
    'Proteína': ['pollo pechuga', 'pollo', 'carne res', 'res', 'cerdo', 'pescado', 'atún', 'atun', 'huevo', 'queso', 'lentejas', 'frijol', 'garbanzo'],
    'Granos y harinas': ['arroz', 'pasta', 'tortilla', 'arepa', 'harina', 'pan'],
    'Lácteos y huevos': ['leche', 'yogur', 'mantequilla', 'huevo', 'queso'],
    'Abarrotes y condimentos': ['aceite', 'sal', 'azucar', 'azúcar', 'pimienta', 'comino', 'oregano', 'orégano', 'vinagre'],
    'Enlatados y conservas': ['atun', 'atún', 'maiz en lata', 'maíz en lata', 'salsa de tomate'],
  } as Record<string, string[]>
}

function catForIngredient(name: string): string {
  const n = norm(name)
  const cats = categoriasMap()
  for (const [cat, arr] of Object.entries(cats)) {
    if (arr.some(x => norm(x) === n)) return cat
  }
  // heurística por palabra clave
  if (/(pollo|res|cerdo|pavo|huevo|queso|pescad|atun|lenteja|frijol|garbanzo)/i.test(name)) return 'Proteína'
  if (/(arroz|pasta|tortilla|arepa|harina|pan)/i.test(name)) return 'Granos y harinas'
  if (/(leche|yogur|mantequilla)/i.test(name)) return 'Lácteos y huevos'
  if (/(tomate|cebolla|zanahoria|piment|brocol|papa|limon|cilantro|lechuga|pepino|aguacate)/i.test(name)) return 'Frutas y verduras'
  if (/(aceite|sal|azucar|pimienta|comino|oregano|vinagre|salsa)/i.test(name)) return 'Abarrotes y condimentos'
  return 'Otros'
}

function storesForCity(ciudad: string): { sugerida: StoreOpt; opciones: StoreOpt[]; mapsUrl: string } {
  // Heurística simple: prioriza hard-discount y da alternativas por Colombia.
  const hard = ['D1', 'Ara']
  const sup = ['Éxito', 'Jumbo', 'Carulla']
  const sugerida: StoreOpt = { nombre: hard[0], tipo: 'hard-discount' }
  const opciones: StoreOpt[] = [{ nombre: hard[1], tipo: 'hard-discount' }, ...sup.map(n => ({ nombre: n, tipo: 'supermercado' as const }))]

  const q = encodeURIComponent(`${sugerida.nombre} cerca de ${ciudad}`)
  const mapsUrl = `https://www.google.com/maps/search/${q}`
  return { sugerida, opciones, mapsUrl }
}

/** ---------------------------
 * Fallbacks variados por tipo
 * --------------------------- */
type Meal = 'Desayunos' | 'Almuerzos' | 'Cenas'
function fallbackRecipes(meal: Meal) {
  if (meal === 'Desayunos') {
    return [
      { dia: 1, plato: 'Arepa con huevo y queso', receta: [{ n: 'arepa', u: 'ud', pp: 1 }, { n: 'huevo', u: 'ud', pp: 1 }, { n: 'queso', u: 'g', pp: 30 }] },
      { dia: 2, plato: 'Avena con banano', receta: [{ n: 'avena', u: 'g', pp: 60 }, { n: 'leche', u: 'ml', pp: 200 }, { n: 'banano', u: 'ud', pp: 1 }] },
      { dia: 3, plato: 'Huevos pericos', receta: [{ n: 'huevo', u: 'ud', pp: 2 }, { n: 'tomate', u: 'g', pp: 60 }, { n: 'cebolla', u: 'g', pp: 40 }, { n: 'aceite', u: 'ml', pp: 6 }] },
      { dia: 4, plato: 'Tostadas con aguacate', receta: [{ n: 'pan', u: 'ud', pp: 2 }, { n: 'aguacate', u: 'g', pp: 80 }, { n: 'limón', u: 'ml', pp: 10 }] },
      { dia: 5, plato: 'Arepa con pollo desmechado', receta: [{ n: 'arepa', u: 'ud', pp: 1 }, { n: 'pollo pechuga', u: 'g', pp: 80 }, { n: 'cebolla', u: 'g', pp: 30 }] },
      { dia: 6, plato: 'Yogur con frutas', receta: [{ n: 'yogur', u: 'ml', pp: 200 }, { n: 'banano', u: 'ud', pp: 1 }] },
      { dia: 7, plato: 'Calentado ligero', receta: [{ n: 'arroz', u: 'g', pp: 80 }, { n: 'huevo', u: 'ud', pp: 1 }, { n: 'cebolla', u: 'g', pp: 30 }] },
    ]
  }
  // Por defecto (almuerzos/cenas)
  return [
    { dia: 1, plato: 'Arroz con pollo', receta: [{ n: 'arroz', u: 'g', pp: 90 }, { n: 'pollo pechuga', u: 'g', pp: 140 }, { n: 'tomate', u: 'g', pp: 80 }, { n: 'cebolla', u: 'g', pp: 60 }, { n: 'ajo', u: 'g', pp: 6 }, { n: 'aceite', u: 'ml', pp: 8 }] },
    { dia: 2, plato: 'Pasta con tomate', receta: [{ n: 'pasta', u: 'g', pp: 100 }, { n: 'tomate', u: 'g', pp: 120 }, { n: 'cebolla', u: 'g', pp: 50 }, { n: 'ajo', u: 'g', pp: 6 }, { n: 'aceite', u: 'ml', pp: 8 }] },
    { dia: 3, plato: 'Salteado de res con verduras', receta: [{ n: 'carne res', u: 'g', pp: 140 }, { n: 'zanahoria', u: 'g', pp: 80 }, { n: 'pimentón', u: 'g', pp: 60 }, { n: 'cebolla', u: 'g', pp: 50 }, { n: 'aceite', u: 'ml', pp: 10 }] },
    { dia: 4, plato: 'Lentejas estofadas', receta: [{ n: 'lentejas', u: 'g', pp: 90 }, { n: 'zanahoria', u: 'g', pp: 70 }, { n: 'tomate', u: 'g', pp: 80 }, { n: 'cebolla', u: 'g', pp: 50 }] },
    { dia: 5, plato: 'Cerdo al limón con arroz', receta: [{ n: 'cerdo', u: 'g', pp: 140 }, { n: 'arroz', u: 'g', pp: 80 }, { n: 'limón', u: 'ml', pp: 10 }, { n: 'ajo', u: 'g', pp: 6 }, { n: 'aceite', u: 'ml', pp: 8 }] },
    { dia: 6, plato: 'Tortillas con atún', receta: [{ n: 'tortilla', u: 'ud', pp: 2 }, { n: 'atún', u: 'g', pp: 90 }, { n: 'tomate', u: 'g', pp: 60 }, { n: 'cebolla', u: 'g', pp: 40 }] },
    { dia: 7, plato: 'Salteado de verduras + huevo', receta: [{ n: 'brocoli', u: 'g', pp: 120 }, { n: 'zanahoria', u: 'g', pp: 100 }, { n: 'cebolla', u: 'g', pp: 50 }, { n: 'huevo', u: 'ud', pp: 1 }, { n: 'aceite', u: 'ml', pp: 8 }] },
  ]
}

function fallbackPlan(ciudad: string, personas: number, modo: string, meal: Meal): Plan {
  const base = fallbackRecipes(meal)
  const menu = base.map(d => {
    const ingredientes: ItemQty[] = d.receta.map(r => ({
      name: r.n,
      unit: r.u as Unit,
      qty: friendlyQty(r.pp * personas, r.u as Unit),
    }))
    return {
      dia: d.dia,
      plato: d.plato,
      ingredientes,
      pasos: ['Picar', 'Saltear', 'Cocer', 'Servir'],
      tip: 'Optimiza para aprovechar sobrantes y bases.',
    }
  })

  // Consolidado y costos
  const all = consolidate(menu.flatMap(m => m.ingredientes)).map(it => ({ ...it, qty: friendlyQty(it.qty, it.unit) }))
  const lista: Record<string, ItemQty[]> = {}
  for (const it of all) {
    const cat = catForIngredient(it.name)
    if (!lista[cat]) lista[cat] = []
    const est = estimateItemCOP(it, ciudad)
    lista[cat].push({ ...it, estCOP: est !== undefined ? toCOP(est) : undefined })
  }
  // Totales por categoría
  const porCategoria: Record<string, number> = {}
  for (const [cat, items] of Object.entries(lista)) {
    porCategoria[cat] = toCOP(items.reduce((acc, i) => acc + (i.estCOP || 0), 0))
  }
  const subtotal = Object.values(porCategoria).reduce((a, b) => a + b, 0)
  const total = toCOP(subtotal * 1.10)

  const detalle = all
    .map(i => ({ name: i.name, qty: i.qty, unit: i.unit, estCOP: estimateItemCOP(i, ciudad) !== undefined ? toCOP(estimateItemCOP(i, ciudad)!) : undefined }))
    .sort((a, b) => (b.estCOP || 0) - (a.estCOP || 0))

  const tiendas = storesForCity(ciudad)

  return {
    meta: { ciudad, personas, modo, moneda: 'COP', meal },
    menu,
    lista,
    batch: { baseA: 'Sofrito para 3 días', baseB: 'Caldo base para sopas' },
    sobrantes: ['Arroz cocido', 'Sofrito'],
    costos: {
      porCategoria,
      total,
      nota: 'Estimado con pricebook local (+10% de buffer). Puede variar por tienda/temporada.',
      detalle,
    },
    tiendas,
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any))

  const {
    ciudad = 'Bogotá, CO',
    personas = 2,
    modo = '30 min',
    equipo = 'Todo ok',
    prefs = ['Económico'],
    // nuevos campos (opcionales)
    comidas = ['Almuerzos'],
    dieta = 'Ninguna',
    alergias = [],
    objetivo = 'Ahorrar',
    presupuesto,
  } = body || {}

  // Escoge UN tipo de comida para 7 días (si vienen varias, tomamos la primera)
  const meal: Meal = Array.isArray(comidas) && comidas.length ? (comidas[0] as Meal) : 'Almuerzos'

  // trials/licencia
  const store = cookies()
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

  // Intento con OpenAI (si hay API key), si no, fallback
  try {
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      // schema estricto: 7 días con ingredientes escalados
      const schema = {
        type: 'object',
        properties: {
          menu: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                dia: { type: 'number' },
                plato: { type: 'string' },
                ingredientes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      qty: { type: 'number' },
                      unit: { type: 'string', enum: ['g', 'ml', 'ud'] },
                    },
                    required: ['name', 'qty', 'unit'],
                  },
                },
                pasos: { type: 'array', items: { type: 'string' } },
                tip: { type: 'string' },
              },
              required: ['dia', 'plato', 'ingredientes', 'pasos', 'tip'],
            },
          },
        },
        required: ['menu'],
      } as const

      // Prompt con contexto completo (tiempo/equipo/dieta/alergias/objetivo/presupuesto)
      const prompt = `
Eres un chef planificador. Genera un menú de ${meal.toLowerCase()} para 7 días, para ${personas} personas en ${ciudad}.
Tiempo por preparación: ${modo}. Equipo disponible: ${equipo}. Dieta: ${dieta}. Alergias/evitar: ${Array.isArray(alergias) && alergias.length ? alergias.join(', ') : 'ninguna'}.
Objetivo: ${objetivo}. ${presupuesto ? `Presupuesto semanal objetivo: ${presupuesto} COP.` : ''}
Preferencias adicionales: ${Array.isArray(prefs) ? prefs.join(', ') : String(prefs)}.

Varía proteínas a lo largo de la semana (pollo, res, cerdo, huevo, pescado/atún y al menos 1 legumbre) respetando dieta/alergias.
Devuelve SOLO JSON con exactamente este schema (con cantidades ya escaladas por ${personas} personas y unidades en g/ml/ud):
${JSON.stringify(schema)}
      `.trim()

      const chat = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        response_format: { type: 'json_object' as const },
        messages: [
          { role: 'system', content: 'Eres un chef planificador que devuelve estrictamente JSON válido.' },
          { role: 'user', content: prompt },
        ],
      })

      const content = chat.choices?.[0]?.message?.content?.trim() || '{}'
      let ai: any = {}
      try {
        ai = JSON.parse(content)
      } catch {
        ai = {}
      }

      // Construimos plan base y lo enriquecemos si la IA respondió bien
      const base = fallbackPlan(ciudad, personas, modo, meal)
      if (ai?.menu?.length === 7) {
        // Reemplaza solo el menú; el resto lo recalculamos
        base.menu = ai.menu.map((d: any, i: number) => ({
          dia: typeof d.dia === 'number' ? d.dia : i + 1,
          plato: String(d.plato || `Día ${i + 1}`),
          ingredientes: Array.isArray(d.ingredientes)
            ? d.ingredientes.map((x: any) => ({
                name: String(x.name),
                qty: friendlyQty(Number(x.qty || 0), (x.unit as Unit) || 'g'),
                unit: (x.unit as Unit) || 'g',
              }))
            : [],
          pasos: Array.isArray(d.pasos) ? d.pasos.map((p: any) => String(p)) : ['Preparar', 'Cocinar', 'Servir'],
          tip: String(d.tip || 'Aprovecha sobrantes.'),
        }))

        const all = consolidate(base.menu.flatMap((m: any) => m.ingredientes)).map((it: any) => ({
          ...it,
          qty: friendlyQty(it.qty, it.unit),
        }))

        const lista: Record<string, ItemQty[]> = {}
        for (const it of all) {
          const cat = catForIngredient(it.name)
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

        const detalle = all
          .map((i: ItemQty) => ({
            name: i.name,
            qty: i.qty,
            unit: i.unit,
            estCOP: estimateItemCOP(i, ciudad) !== undefined ? toCOP(estimateItemCOP(i, ciudad)!) : undefined,
          }))
          .sort((a: any, b: any) => (b.estCOP || 0) - (a.estCOP || 0))

        base.lista = lista
        base.costos = {
          porCategoria,
          total,
          nota: 'Estimado con pricebook local (+10% de buffer). Puede variar por tienda/temporada.',
          detalle,
        }
        base.tiendas = storesForCity(ciudad)
      }

      const res = NextResponse.json(base, {
        headers: { 'x-platy-has-license': String(hasLicense), 'x-platy-trials': String(trials) },
      })
      if (hasLicense)
        res.cookies.set('platy_license', licenseHeader!, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
      else res.cookies.set('platy_trials', String(trials + 1), { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
      return res
    }
  } catch (e) {
    // cae a fallback abajo
  }

  // Fallback sin OpenAI
  const plan = fallbackPlan(ciudad, personas, modo, meal)
  const res = NextResponse.json(plan, {
    headers: { 'x-platy-has-license': String(hasLicense), 'x-platy-trials': String(trials) },
  })
  if (hasLicense)
    res.cookies.set('platy_license', licenseHeader!, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
  else res.cookies.set('platy_trials', String(trials + 1), { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
  return res
}

