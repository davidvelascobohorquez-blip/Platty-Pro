# PLATY — Starter PRO

### Qué incluye
- Landing minimalista (Next 14 + Tailwind)
- Wizard `/demo` (datos, licencia de por vida, 3 intentos)
- API `/api/generate-menu` con OpenAI (o fallback) + cantidades + costos COP
- PDF diseñado con @react-pdf/renderer
- Pricebook local (`data/pricebook.co.json`)

### Variables de entorno
- `OPENAI_API_KEY` (recomendado)
- `PLATY_LIFETIME_CODE` (p. ej. PLATY-2025-LIFE)
- `NEXT_PUBLIC_DOMAIN` (opcional, para textos visibles)

### Dev local
```
npm i
npm run dev
```

### Deploy en Vercel
Importa el repo → añade variables → Deploy.
