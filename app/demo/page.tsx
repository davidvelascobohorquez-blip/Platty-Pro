import { useState } from 'react';
import Button from '@components/Button';  // Asegúrate de que el componente Button esté correctamente importado
import { useRouter } from 'next/router';

export default function DemoPage() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const router = useRouter();

  const handleGeneratePlan = async () => {
    setLoading(true); // Indicamos que el plan está en proceso de generación
    try {
      // Aquí debes hacer la llamada al backend para generar el plan
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        body: JSON.stringify({
          ciudad: 'Bogotá', // Cambia esto a lo que el usuario seleccione
          personas: 4, // Lo mismo con el número de personas
          modo: '30 min', // Y el tiempo de cocina
          equipo: 'Sin horno', // Equipo
          prefs: ['Económico'], // Preferencias alimentarias
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setPlan(data); // Actualizamos el estado con el plan generado
    } catch (error) {
      console.error('Error al generar el plan:', error);
    } finally {
      setLoading(false); // Restablecemos el estado de carga
    }
  };

  return (
    <div className="demo-page">
      <h1>Genera tu plan de comidas</h1>
      <div className="preferences">
        {/* Aquí va el resto de los inputs del formulario */}
      </div>
      
      <Button onClick={handleGeneratePlan} disabled={loading}>
        {loading ? 'Generando...' : 'Confirmar y generar plan'}
      </Button>

      {plan && (
        <div className="plan">
          <h2>Resumen del plan generado</h2>
          <p>{JSON.stringify(plan, null, 2)}</p> {/* Aquí puedes formatear mejor la salida */}
        </div>
      )}
    </div>
  );
}

