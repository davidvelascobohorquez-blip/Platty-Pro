export default function StepperDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map(n => (
        <div key={n} className={`h-2 w-8 rounded-full ${n <= step ? 'bg-amber' : 'bg-line'}`} />
      ))}
    </div>
  )
}
