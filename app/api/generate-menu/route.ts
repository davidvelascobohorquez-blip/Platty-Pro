import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ciudad, personas, modo, equipo, prefs } = body;

  // Aquí va la lógica para generar el plan según las preferencias del usuario
  // Por ejemplo, llamando a OpenAI o utilizando tu lógica propia para calcular el plan

  const generatedPlan = {
    ciudad,
    personas,
    modo,
    equipo,
    prefs,
    menu: [
      {
        dia: 1,
        plato: 'Arroz con pollo',
        ingredientes: [
          { name: 'arroz', qty: 200, unit: 'g' },
          { name: 'pollo', qty: 150, unit: 'g' },
        ],
        pasos: ['Cocer', 'Servir'],
      },
      // Continúa con el menú de 7 días
    ],
  };

  return NextResponse.json(generatedPlan);
}

