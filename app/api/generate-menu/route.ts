import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import pricebookCO from '@/data/pricebook.co.json' assert { type: 'json' }

export const runtime = 'nodejs'

type Unit = 'g'|'ml'|'ud'
type ItemQty = { name: string; qty: number; unit: Unit; estCOP?: number }
type Plan = {
  menu: { dia: number; plato: string; ingredientes: ItemQty[]; pasos: string[]; tip: string }[]
  lista: Record<string, ItemQty[]>
  batch: { baseA: string; baseB: string }
  sobrantes: string[]
  meta: { ciudad: string; personas: number; modo: string; moneda: 'COP' }
  costos: { porCategoria: Record<string, number>; total: number; nota: string }
  tiendas?: { sugerida: { nombre: string; tipo: 'hard-discount'|'supermercado' }, opciones: { nombre: string; tipo: 'hard-discount'|'supermercado' }[], mapsUrl: string }
}

const TRIALS_FREE = 3
const toCOP = (n:number) => Math.round(n)

// ---------- Normalización & helpers ----------
const normalize = (s:string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()

// index normalizado del pricebook
const PRICE_INDEX = (() => {
  const idx = new Map<string, any>()
  for (const [k,v] of Object.entries((pricebookCO as any).ingredients || {})) {
    idx.set(normalize(k), v)
  }
  return idx
})()

// sinónimos comunes -> “canónicos”
const SYNS: Record<string,string> = {
  'cebolla roja':'cebolla',
  'pimenton':'pimentón',
  'pimiento':'pimentón',
  'aceite de oliva':'aceite',
  'caldo de verduras':'caldo',
  'frijoles negros':'frijoles',
  'frijoles negros cocidos':'frijoles',
  'tomate triturado':'tomate',
  'tortillas de maiz':'tortilla',
  'tortillas de maíz':'tortilla',
  'queso parmesano':'parmesano',
  'queso rallado':'parmesano',
  'huevos':'huevo'
}

// categorías para agrupar + heurística
const CATS: Record<string,string[]> = {
  Verduras: ['tomate','cebolla','pimentón','zanahoria','pepino','brocoli','brócoli','papa','apio','cilantro','espinacas','limon','limón','ajo'],
  Proteína: ['pollo pechuga','huevo','queso','garbanzos','frijoles','lentejas','atun','atún','carne','pescado','tofu'],
  Granos: ['arroz','pasta','quinoa','tortilla','arepa','pan'],
  Abarrotes: ['aceite','sal','pimienta','salsa de soya','aceite de sesamo','caldo','parmesano','nueces','albahaca']
}
const fallCat = (name:string) => {
  const n = normalize(name)
  for (const [cat, arr] of Object.entries(CATS)) {
    if (arr.some(a => normalize(a) === n)) return cat
  }
  return 'Otros'
}

// precios fallback (COP) por categoría cuando no hay pricebook:
// valores escalables por ciudad (se multiplican por cityMultiplier)
const FALLBACK: Record<string,{perGram?:number; perMl?:number; perUnit?:number}> = {
  Verduras:  { perGram: 3 },      // ~3000 COP/kg
  Proteína:  { perGram: 12, perUnit: 1200 }, // pechuga ~12k/kg, huevo ~1200 u
  Granos:    { perGram: 5 },      // arroz/pasta ~5k/kg
  Abarrotes: { perGram: 6, perMl: 5, perUnit: 900 },
  Otros:     { perGram: 6, perMl: 5, perUnit: 900 },
}

function cityMultiplier(ciudad: string) {
  const c = normalize(ciudad)
  const entry = Object.keys((pricebookCO as any).cityMultipliers || {})
    .find(k => c.includes(normalize(k)))
  return entry ? (pricebookCO as any).cityMultipliers[entry] : 1.0
}

function categoryOf(name:string) {
  return fallCat(SYNS[normalize(name)] || name)
}

function unitPriceCOP(name: string, ciudad: string): { perGram?: number; perMl?: number; perUnit?: number } {
  const mult = cityMultiplier(ciudad)
  // lookup con sinónimos + normalizado
  const key = normalize(SYNS[normalize(name)] || name)
  const info = PRICE_INDEX.get(key)

  if (info) {
    const base = info.price * mult
    if (info.unit === 'kg') return { perGram: base / 1000 }
    if (info.unit === 'l')  return { perMl:  base / 1000 }
    if (info.unit === 'ud') return { perUnit: base }
  }

  // fallback por categoría
  const cat = categoryOf(name)
  const fb = FALLBACK[cat] || FALLBACK['Otros']
  return {
    perGram: fb.perGram ? fb.perGram * mult : undefined,
    perMl:   fb.perMl   ? fb.perMl   * mult : undefined,
    perUnit: fb.perUnit ? fb.perUnit * mult : undefined
  }
}

function estimateItemCOP(it: ItemQty, ciudad: string) {
  const p = unitPriceCOP(it.name, ciudad)
  if (it.unit === 'g' && p.perGram) return it.qty * p.perGram
  if (it.unit === 'ml' && p.perMl)  return it.qty * p.perMl
  if (it.unit === 'ud' && p.perUnit) return it.qty * p.perUnit
  return 0
}

function consolidate(items: ItemQty[]) {
  const map = new Map<string, ItemQty>()
  for (const it of items) {
    const key = `${normalize(it.name)}__${it.unit}`
    const prev = map.get(key)
    if (!prev) map.set(key, { ...it, name: (SYNS[normalize(it.name)] || it.name) })
    else prev.qty += it.qty
  }
  return [...map.values()]
}

type UnitStr = Unit
function friendlyQty(q: number, u: UnitStr) {
  if (u === 'g' || u === 'ml') return q < 100 ? Math.round(q/25)*25 : Math.round(q/50)*50
  return Math.round(q)
}

// ---------- Plan de respaldo ----------
function fallbackPlan(ciudad: string, personas: number, modo: string): Plan {
  const base = [
    { dia: 1, plato: 'Arroz con pollo', receta: [{n:'arroz',u:'g',pp:90},{n:'pollo pechuga',u:'g',pp:140},{n:'tomate',u:'g',pp:80},{n:'cebolla',u:'g',pp:60},{n:'ajo',u:'g',pp:6},{n:'aceite',u:'ml',pp:8}] },
    { dia: 2, plato: 'Pasta con tomate', receta: [{n:'pasta',u:'g',pp:100},{n:'tomate',u:'g',pp:120},{n:'cebolla',u:'g',pp:50},{n:'ajo',u:'g',pp:6},{n:'aceite',u:'ml',pp:8}] },
    { dia: 3, plato: 'Arepa con queso y huevo', receta: [{n:'arepa',u:'ud',pp:1},{n:'queso',u:'g',pp:40},{n:'huevo',u:'ud',pp:1}] },
    { dia: 4, plato: 'Salteado de verduras', receta: [{n:'brocoli',u:'g',pp:120},{n:'zanahoria',u:'g',pp:100},{n:'pimentón',u:'g',pp:80},{n:'cebolla',u:'g',pp:60},{n:'aceite',u:'ml',pp:10}] },
    { dia: 5, plato: 'Sopa casera', receta: [{n:'zanahoria',u:'g',pp:80},{n:'papa',u:'g',pp:150},{n:'cebolla',u:'g',pp:50},{n:'ajo',u:'g',pp:6}] },
    { dia: 6, plato: 'Tacos rápidos', receta: [{n:'tortilla',u:'ud',pp:2},{n:'pollo pechuga',u:'g',pp:120},{n:'pimentón',u:'g',pp:60},{n:'cebolla',u:'g',pp:50}] },
    { dia: 7, plato: 'Arroz frito con sobrantes', receta: [{n:'arroz',u:'g',pp:70},{n:'zanahoria',u:'g',pp:60},{n:'cebolla',u:'g',pp:40},{n:'huevo',u:'ud',pp:1}] }
  ]
  const menu = base.map(d => {
    const ingredientes: ItemQty[] = d.receta.map(r => ({
      name: r.n, unit: r.u as Unit, qty: friendlyQty(r.pp * personas, r.u as Unit)
    }))
    return { dia: d.dia, plato: d.plato, ingredientes, pasos: ['Picar','Saltear','Cocer','Servir'], tip: 'Aprovecha bases para otros días' }
  })

  // construir lista consolidada + costos
  const all = consolidate(menu.flatMap(m=>m.ingredientes)).map(it => ({...it, qty: friendlyQty(it.qty, it.unit)}))
  const lista: Record<string, ItemQty[]> = {}
  for (const it of all) {
    const cat = categoryOf(it.name)
    if (!lista[cat]) lista[cat] = []
    const est = estimateItemCOP(it, ciudad)
    lista[cat].push({...it, estCOP: toCOP(est)})
  }
  const porCategoria: Record<string,number> = {}
  for (const [cat, items] of Object.entries(lista)) {
    porCategoria[cat] = toCOP(items.reduce((acc,i)=>acc+(i.estCOP||0),0))
  }
  const subtotal = Object.values(porCategoria).reduce((a,b)=>a+b,0)
  const total = toCOP(subtotal*1.10)

  return {
    meta:{ciudad, personas, modo, moneda:'COP'},
    menu,
    lista,
    batch:{baseA:'Sofrito para 3 días', baseB:'Caldo base para sopas'},
    sobrantes:['Arroz cocido','Sofrito'],
    costos:{porCategoria, total, nota:`Estimado con pricebook local (+10% buffer). Puede variar por tienda/temporada. (${ciudad})`},
    tiendas:{
      sugerida:{nombre:'D1', tipo:'hard-discount'},
      opciones:[{nombre:'Ara', tipo:'hard-discount'},{nombre:'Justo & Bueno', tipo:'hard-discount'},{nombre:'Éxito', tipo:'supermercado'}],
      mapsUrl:`https://www.google.com/maps/search/supermercado+cerca+de+${encodeURIComponent(ciudad)}`
    }
  }
}

// ---------- Handler ----------
export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=> ({} as any))
  const { ciudad='Bogotá, CO', personas=2, modo='30 min', equipo='Todo ok', prefs=['Económico'] } = body || {}

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

  let base = fallbackPlan(ciudad, personas, modo)

  try {
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      const schema = {
        type:'object', properties:{
          menu:{type:'array',items:{type:'object',properties:{
            dia:{type:'number'}, plato:{type:'string'},
            ingredientes:{type:'array',items:{type:'object',properties:{
              name:{type:'string'}, qty:{type:'number'}, unit:{type:'string',enum:['g','ml','ud']}
            },required:['name','qty','unit']}},
            pasos:{type:'array',items:{type:'string'}}, tip:{type:'string'}
          },required:['dia','plato','ingredientes','pasos','tip']}}
        }, required:['menu']
      } as const

      const prompt = `Eres chef planificador para ${personas} personas en ${ciudad}, tiempo ${modo}, equipo ${equipo}, preferencias: ${prefs.join(', ')}.
Devuelve JSON con 7 días (menu[].dia 1..7), plato y lista de ingredientes con cantidades YA ESCALADAS (qty) y unit en g/ml/ud.
Respeta exactamente este schema: ${JSON.stringify(schema)}`

      const resp = await openai.responses.create({
        model: 'gpt-4o-mini',
        input: prompt,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })

      const ai = JSON.parse((resp.output_text || '{}').trim() || '{}')

      if (ai?.menu?.length === 7) {
        base.menu = ai.menu

        // reconstruir lista + costos con el motor actualizado (sinónimos+fallback)
        const all = consolidate(base.menu.flatMap((m:any)=>m.ingredientes))
          .map((it:any)=>({...it, qty: friendlyQty(it.qty, it.unit)}))

        const lista: Record<string, ItemQty[]> = {}
        for (const it of all) {
          const cat = categoryOf(it.name)
          if (!lista[cat]) lista[cat] = []
          const est = estimateItemCOP(it, ciudad)
          lista[cat].push({...it, estCOP: toCOP(est)})
        }
        const porCategoria: Record<string,number> = {}
        for (const [cat, items] of Object.entries(lista)) {
          porCategoria[cat] = toCOP(items.reduce((acc,i)=>acc+(i.estCOP||0),0))
        }
        const subtotal = Object.values(porCategoria).reduce((a,b)=>a+b,0)

        base.lista = lista
        base.costos = { porCategoria, total: toCOP(subtotal*1.10), nota:`Estimado con pricebook local (+10% buffer). Puede variar por tienda/temporada. (${ciudad})` }
      }
    }
  } catch {
    // si falla OpenAI, nos quedamos con fallbackPlan
  }

  const res = NextResponse.json(base, { headers: { 'x-platy-has-license': String(hasLicense), 'x-platy-trials': String(trials) } })
  if (hasLicense) res.cookies.set('platy_license', licenseHeader!, { httpOnly:true, sameSite:'lax', maxAge: 60*60*24*365 })
  else res.cookies.set('platy_trials', String(trials+1), { httpOnly:true, sameSite:'lax', maxAge: 60*60*24*365 })
  return res
}

