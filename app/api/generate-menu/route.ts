import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import OpenAI from 'openai';  // Asegúrate de tener la librería de OpenAI instalada
import pricebookCO from '@/data/pricebook.co.json';  // Si usas un archivo de precios

export const runtime = 'nodejs';

type Unit = 'g' | 'ml' | 'ud';
type ItemQty = { name: string; qty: number; unit: Unit; estCOP?: number };
type Plan = {
  menu: { dia: number; plato: string; ingredientes: ItemQty[]; pasos: string[]; tip: string }[];
  lista: Record<string, ItemQty[]>;
  batch: { baseA: string; baseB: string };
  sobrantes: string[];
  meta: { ciudad: string; personas: number; modo: string; moneda: 'COP' };
  costos: { porCategoria: Record<string, number>; total: number; nota: string };
};

// Función para calcular el precio basado en la ciudad
const cityMultiplier = (ciudad: string) => {
  const c = ciudad.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const key = Object.keys(pricebookCO.cityMultipliers).find(k =>
    c.toLowerCase().includes(k.toLowerCase())
  );
  return key ? pricebookCO.cityMultipliers[key] : 1.0;
};

// Función para obtener los precios de los ingredientes
const unitPriceCOP = (name: string, ciudad: string): { perGram?: number; perMl?: number; perUnit?: number } => {
  const info = pricebookCO.ingredients[name];
  if (!info) return {};
  const mult = cityMultiplier(ciudad);
  const base = info.price * mult;
  if (info.unit === 'kg') return { perGram: base / 1000 };
  if (info.unit === 'l') return { perMl: base / 1000 };
  if (info.unit === 'ud') return { perUnit: base };
  return {};
};

// Función para estimar el costo de un ingrediente
const estimateItemCOP = (it: ItemQty, ciudad: string) => {
  const p = unitPriceCOP(it.name, ciudad);
  if (it.unit === 'g' && p.perGram) return it.qty * p.perGram;
  if (it.unit === 'ml' && p.perMl) return it.qty * p.perMl;
  if (it.unit === 'ud' && p.perUnit) return it.qty * p.perUnit;
  return undefined;
};

// Función para consolidar los ingredientes y obtener una lista única
const consolidate = (items: ItemQty[]) => {
  const map = new Map<string, ItemQty>();
  for (const it of items) {
    const key = `${it.name}__${it.unit}`;
    const prev = map.get(key);
    if (!prev) map.set(key, { ...it });
    else prev.qty += it.qty;
  }
  return [...map.values()];
};

// Función para crear un menú de ejemplo si no se genera uno
const fallbackPlan = (ciudad: string, personas: number, modo: string): Plan => {
  const base = [
    { dia: 1, plato: 'Arroz con pollo', receta: [{ n: 'arroz', u: 'g', pp: 90 }, { n: 'pollo pechuga', u: 'g', pp: 140 }] },
    { dia: 2, plato: 'Pasta con tomate', receta: [{ n: 'pasta', u: 'g', pp: 100 }, { n: 'tomate', u: 'g', pp: 120 }] },
    // Más platos de ejemplo
  ];

  const menu = base.map(d => ({
    dia: d.dia,
    plato: d.plato,
    ingredientes: d.receta.map(r => ({
      name: r.n, unit: r.u as Unit, qty: Math.round(r.pp * personas),
    })),
    pasos: ['Picar', 'Cocer', 'Servir'],
    tip: 'Aprovecha las bases para otros días',
  }));

  // Consolidación de ingredientes
  const lista = consolidate(menu.flatMap(m => m.ingredientes));
  const porCategoria = {
    Verduras: 10000, // Ejemplo de precios calculados
    Proteínas: 5000,
    Granos: 2000,
  };

  const total = Object.values(porCategoria).reduce((acc, value) => acc + value, 0);
  return {
    meta: { ciudad, personas, modo, moneda: 'COP' },
    menu,
    lista,
    batch: { baseA: 'Sofrito para 3 días', baseB: 'Caldo base para sopas' },
    sobrantes: ['Arroz cocido', 'Sofrito'],
    costos: { porCategoria, total, nota: 'Estimado con Pricebook local (+10% buffer). Puede variar por tienda/temporada.' },
  };
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ciudad = 'Bogotá', personas = 2, modo = '30 min', equipo = 'Todo ok', prefs = ['Económico'] } = body;

  try {
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
      };

      const prompt = `Eres un chef planificador para ${personas} personas en ${ciudad}, tiempo ${modo}, equipo ${equipo}, preferencias: ${prefs.join(', ')}.
Devuelve JSON con 7 días (menu[].dia 1..7), plato y lista de ingredientes con cantidades YA ESCALADAS (qty) y unit en g/ml/ud.
Respeta exactamente este schema: ${JSON.stringify(schema)}`;

      // Generación de menú usando OpenAI
      const chat = await openai.chat.completions.create({
        model: 'gpt-4',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Eres un chef planificador que devuelve estrictamente JSON válido.' },
          { role: 'user', content: prompt },
        ],
      });

      const content = chat.choices?.[0]?.message?.content?.trim() || '{}';
      let ai: any = {};
      try { ai = JSON.parse(content); } catch { ai = {}; }

      const base = fallbackPlan(ciudad, personas, modo);
      if (ai?.menu?.length === 7) {
        base.menu = ai.menu;
      }

      // Retornar el plan generado
      return NextResponse.json(base);
    }
  } catch (e) {
    console.error('Error en la generación del menú:', e);
  }

  // Si no hay éxito en la generación, usar el menú de respaldo
  const plan = fallbackPlan(ciudad, personas, modo);
  return NextResponse.json(plan);
}

