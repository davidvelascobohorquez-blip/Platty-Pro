// components/PlanPDF.tsx
// PDF bonito, bilingüe y multimoneda — by Platty 💛
// Requiere: @react-pdf/renderer ya instalado (ya lo tienes en package.json)

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image
} from '@react-pdf/renderer'

// ============================
// Tipos esperados del backend
// ============================
type Unit = 'g' | 'ml' | 'ud'
type ItemQty = { name: string; qty: number; unit: Unit; estCOP?: number }
export type Plan = {
  menu: { dia: number; plato: string; ingredientes: ItemQty[]; pasos: string[]; tip: string }[]
  lista: Record<string, ItemQty[]>
  batch: { baseA: string; baseB: string }
  sobrantes: string[]
  meta: { ciudad: string; personas: number; modo: string; moneda: 'COP' }
  costos: { porCategoria: Record<string, number>; total: number; nota: string }
}

// ============================
// Fuentes gratuitas (sistémicas)
// ============================
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1Z7bx1vZ7r4.woff2' }, // Regular
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQsn1fB3VQXt5f6tZVtw.woff2', fontWeight: 600 }, // SemiBold
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQkA7iG5WIrZgA8W8.woff2', fontWeight: 800 }, // ExtraBold
  ],
})

// ============================
// I18N (ES / EN)
// ============================
type Lang = 'es' | 'en'
const i18n: Record<Lang, Record<string, string>> = {
  es: {
    weeklyMenu: 'Menú semanal',
    includes: 'Incluye lista consolidada, cantidades (g/ml/ud) y costo estimado.',
    city: 'Ciudad',
    people: 'Personas',
    time: 'Tiempo',
    currency: 'Moneda',
    costSummary: 'Resumen de costos',
    category: 'Categoría',
    estimated: 'Estimado',
    total: 'TOTAL',
    menuDays: 'Menú (Día 1–7)',
    shoppingList: 'Lista de compras (consolidada)',
    tips: 'Recomendaciones',
    storesYouMayLike: 'Tiendas recomendadas en tu ciudad',
    note: 'Estimado con pricebook local (+10% buffer). Puede variar por tienda/temporada.',
    day: 'Día',
  },
  en: {
    weeklyMenu: 'Weekly menu',
    includes: 'Includes consolidated list, exact quantities (g/ml/ud) and estimated cost.',
    city: 'City',
    people: 'People',
    time: 'Time',
    currency: 'Currency',
    costSummary: 'Cost summary',
    category: 'Category',
    estimated: 'Estimated',
    total: 'TOTAL',
    menuDays: 'Menu (Day 1–7)',
    shoppingList: 'Shopping list (consolidated)',
    tips: 'Recommendations',
    storesYouMayLike: 'Suggested stores in your city',
    note: 'Estimated with local pricebook (+10% buffer). Actual store/season may vary.',
    day: 'Day',
  },
}

// ============================
/** Cambio de moneda (simple) desde COP.
 * Estos ratios son aproximados para lanzamiento y se pueden ajustar en .env o API.
 * Definimos "perCOP": cuántas unidades de la moneda objetivo equivale 1 COP.
 * Ej: USD: si 1 USD ≈ 4100 COP, entonces perCOP = 1/4100.
 */
const FX: Record<string, { symbol: string; perCOP: number; locale: string; name: string }> = {
  COP: { symbol: '$', perCOP: 1, locale: 'es-CO', name: 'Colombian Peso' },
  MXN: { symbol: '$', perCOP: 1 / 240, locale: 'es-MX', name: 'Mexican Peso' },
  CLP: { symbol: '$', perCOP: 1 / 5, locale: 'es-CL', name: 'Chilean Peso' },   // ~1 CLP ≈ 5 COP
  PEN: { symbol: 'S/', perCOP: 1 / 1100, locale: 'es-PE', name: 'Peruvian Sol' },
  ARS: { symbol: '$', perCOP: 1 / 10, locale: 'es-AR', name: 'Argentine Peso' }, // muy variable
  USD: { symbol: '$', perCOP: 1 / 4100, locale: 'en-US', name: 'US Dollar' },
  EUR: { symbol: '€', perCOP: 1 / 4600, locale: 'es-ES', name: 'Euro' },
}

/** Detecta moneda por país o código dado en la ciudad. */
function pickCurrencyByLocation(input?: { city?: string; country?: string; currencyCode?: string }): {
  code: keyof typeof FX
  symbol: string
  locale: string
} {
  if (input?.currencyCode && FX[input.currencyCode]) {
    const fx = FX[input.currencyCode]
    return { code: input.currencyCode as keyof typeof FX, symbol: fx.symbol, locale: fx.locale }
  }
  const city = (input?.city || '').toLowerCase()
  const country = (input?.country || (city.includes(',') ? city.split(',').pop()!.trim() : '')).toUpperCase()

  const byCountry: Record<string, keyof typeof FX> = {
    CO: 'COP', COL: 'COP',
    MX: 'MXN', MEX: 'MXN',
    CL: 'CLP', CHL: 'CLP',
    PE: 'PEN', PER: 'PEN',
    AR: 'ARS', ARG: 'ARS',
    ES: 'EUR', ESP: 'EUR',
    US: 'USD', USA: 'USD',
  }

  const match =
    Object.entries(byCountry).find(([k]) => country === k)?.[1] ||
    (city.includes('bogotá') || city.includes('medellín') || city.includes('colombia') ? 'COP'
      : city.includes('ciudad de méxico') || city.includes('cdmx') ? 'MXN'
      : city.includes('santiago') ? 'CLP'
      : city.includes('lima') ? 'PEN'
      : city.includes('buenos aires') ? 'ARS'
      : city.includes('madrid') ? 'EUR'
      : city.includes('miami') || city.includes('new york') || city.includes('usa') ? 'USD'
      : 'COP')

  const fx = FX[match]
  return { code: match, symbol: fx.symbol, locale: fx.locale }
}

function moneyFmt(amountInCOP: number, target: keyof typeof FX): string {
  const fx = FX[target]
  const local = amountInCOP * fx.perCOP
  try {
    return new Intl.NumberFormat(fx.locale, { style: 'currency', currency: target }).format(local)
  } catch {
    // Fallback si Intl falla en @react-pdf
    const rounded = Math.round(local * 100) / 100
    return `${fx.symbol} ${rounded.toLocaleString()}`
  }
}

// ============================
// Tiendas sugeridas por ciudad
// ============================
function storeSuggestions(ciudad: string, lang: Lang): string[] {
  const c = ciudad.toLowerCase()
  const es = {
    bogotá: ['D1 (abarrotes económicos)', 'Plaza de Paloquemao (frutas/verduras)', 'Éxito / Carulla (marcas)'],
    'ciudad de méxico': ['Bodega Aurrerá', 'Chedraui', 'Mercado local (verduras frescas)'],
    santiago: ['Lider', 'Jumbo', 'La Vega Central (frutas/verduras)'],
    lima: ['Tottus', 'Plaza Vea', 'Mercado de Surquillo'],
    'buenos aires': ['Día', 'Carrefour', 'Verdulería de barrio'],
    madrid: ['Mercadona', 'Carrefour', 'Mercado municipal'],
    miami: ['Walmart', 'Publix', 'Sedano’s (latinos)'],
  }
  const enT = {
    bogotá: ['D1 (budget groceries)', 'Paloquemao Market (produce)', 'Éxito / Carulla (brands)'],
    'ciudad de méxico': ['Bodega Aurrerá', 'Chedraui', 'Local markets (produce)'],
    santiago: ['Lider', 'Jumbo', 'La Vega Central (produce)'],
    lima: ['Tottus', 'Plaza Vea', 'Surquillo Market'],
    'buenos aires': ['Día', 'Carrefour', 'Local greengrocer'],
    madrid: ['Mercadona', 'Carrefour', 'Municipal markets'],
    miami: ['Walmart', 'Publix', 'Sedano’s (Latino)'],
  }
  const map = lang === 'es' ? es : enT
  const key = (Object.keys(map) as (keyof typeof map)[]).find(k => c.includes(k))
  return key ? map[key] : lang === 'es'
    ? ['Supermercado económico + mercado local de barrio']
    : ['Budget supermarket + local fresh market']
}

// ============================
// Estilos
// ============================
const styles = StyleSheet.create({
  page: { padding: 28, fontFamily: 'Inter', fontSize: 10, color: '#111827' },
  header: { marginBottom: 16, alignItems: 'center' },
  brand: { fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 10, color: '#6B7280', textAlign: 'center' },

  chipsRow: { flexDirection: 'row', gap: 8, marginTop: 10, justifyContent: 'center', flexWrap: 'wrap' },
  chip: { border: '1px solid #E5E7EB', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8, color: '#374151' },

  section: { marginTop: 18 },
  h2: { fontSize: 12, fontWeight: 700, marginBottom: 8, color: '#0F172A' },

  grid2: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },

  card: { border: '1px solid #E5E7EB', borderRadius: 10, padding: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  hr: { borderBottom: '1px solid #E5E7EB', marginVertical: 6 },

  tableHeader: { flexDirection: 'row', fontWeight: 600, color: '#374151', marginBottom: 6 },
  thCat: { flex: 2 },
  thAmt: { flex: 1, textAlign: 'right' },

  catRow: { flexDirection: 'row', marginBottom: 4 },
  tdCat: { flex: 2, color: '#111827' },
  tdAmt: { flex: 1, textAlign: 'right', color: '#111827' },
  totalRow: { flexDirection: 'row', fontWeight: 800, marginTop: 6 },
  totalLabel: { flex: 2 },
  totalAmt: { flex: 1, textAlign: 'right' },

  pill: { backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, marginBottom: 8 },

  listItem: { marginBottom: 4, color: '#111827' },
  small: { fontSize: 9, color: '#6B7280' },
  footer: { marginTop: 16, textAlign: 'center', color: '#6B7280' },

  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  itemLeft: { flexDirection: 'row', gap: 6 },
  catHeader: { fontWeight: 700, marginTop: 8, marginBottom: 4, color: '#0F172A' },
})

// ============================
// Utilidades de lista / costos
// ============================
function consolidateFromMenu(menu: Plan['menu']): Record<string, ItemQty[]> {
  // Simple categorización fallback si plan.lista viniera vacío
  const cats: Record<string, string[]> = {
    Verduras: ['tomate', 'cebolla', 'pimentón', 'zanahoria', 'brocoli', 'brócoli', 'papa', 'calabacín', 'apio', 'lechuga', 'pepino'],
    Proteína: ['pollo', 'pollo pechuga', 'huevo', 'carne', 'cerdo', 'queso', 'atún', 'garbanzos', 'lentejas'],
    Granos: ['arroz', 'pasta', 'quinoa', 'tortilla', 'arepa', 'pan'],
    Abarrotes: ['aceite', 'ajo', 'sal', 'pimienta', 'salsa de soya', 'nuez', 'nueces'],
    Otros: [],
  }
  const agg: Record<string, ItemQty[]> = {}
  for (const d of menu) {
    for (const it of d.ingredientes) {
      const key = `${it.name.toLowerCase()}__${it.unit}`
      let found = 'Otros'
      for (const [cat, arr] of Object.entries(cats)) {
        if (arr.some(n => key.startsWith(n))) { found = cat; break }
      }
      agg[found] = agg[found] || []
      const existing = agg[found].find(x => `${x.name.toLowerCase()}__${x.unit}` === key)
      if (existing) existing.qty += it.qty
      else agg[found].push({ ...it })
    }
  }
  return agg
}

function computeTotalsInCOP(lista: Record<string, ItemQty[]>, fallbackCostos?: Plan['costos']) {
  // Si los items ya traen estCOP desde el backend, usamos eso.
  const byCat: Record<string, number> = {}
  for (const [cat, items] of Object.entries(lista || {})) {
    let sum = 0
    for (const it of items) sum += it.estCOP || 0
    byCat[cat] = Math.round(sum)
  }
  const sumCats = Object.values(byCat).reduce((a, b) => a + b, 0)
  // Si vino vacío y el backend tenía totales, usamos eso:
  if (sumCats === 0 && fallbackCostos?.total) {
    return { porCategoria: fallbackCostos.porCategoria || {}, total: fallbackCostos.total }
  }
  // Buffer +10%
  const total = Math.round(sumCats * 1.10)
  return { porCategoria: byCat, total }
}

// ============================
// Componente principal PDF
// ============================
type Props = {
  plan: Plan
  brand?: string
  lang?: Lang
  cityCountry?: { city?: string; country?: string; currencyCode?: string }
  logoUrl?: string // opcional si quieres poner un logo en la portada
}

const PlanPDF: React.FC<Props> = ({ plan, brand = 'PLATY', lang = 'es', cityCountry, logoUrl }) => {
  const t = (k: string) => i18n[lang][k] || k
  const city = plan?.meta?.ciudad || cityCountry?.city || ''
  const { code: currencyCode } = pickCurrencyByLocation({ city, country: cityCountry?.country, currencyCode: cityCountry?.currencyCode })

  // Asegurar lista consolidada
  const lista = (plan?.lista && Object.keys(plan.lista).length > 0)
    ? plan.lista
    : consolidateFromMenu(plan.menu || [])

  const costos = computeTotalsInCOP(lista, plan?.costos)

  const now = new Date()
  const title = `${t('weeklyMenu')} — ${city || '—'}`
  const subtitle = `${plan?.meta?.modo || ''} · ${plan?.meta?.personas || 1} ${t('people')}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {logoUrl ? <Image src={logoUrl} style={{ width: 56, height: 56, marginBottom: 6 }} /> : null}
          <Text style={styles.brand}>{brand}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{t('includes')}</Text>
          <View style={styles.chipsRow}>
            <Text style={styles.chip}>{t('city')}: {city || '—'}</Text>
            <Text style={styles.chip}>{t('people')}: {plan?.meta?.personas ?? 1}</Text>
            <Text style={styles.chip}>{t('time')}: {plan?.meta?.modo ?? '—'}</Text>
            <Text style={styles.chip}>{t('currency')}: {currencyCode}</Text>
          </View>
        </View>

        {/* Resumen: Costos + Menú */}
        <View style={[styles.section, styles.grid2]}>
          {/* Costos */}
          <View style={styles.col}>
            <Text style={styles.h2}>{t('costSummary')}</Text>
            <View style={styles.card}>
              <View style={styles.tableHeader}>
                <Text style={styles.thCat}>{t('category')}</Text>
                <Text style={styles.thAmt}>{t('estimated')}</Text>
              </View>
              {Object.entries(costos.porCategoria).map(([cat, val]) => (
                <View key={cat} style={styles.catRow}>
                  <Text style={styles.tdCat}>{cat}</Text>
                  <Text style={styles.tdAmt}>{moneyFmt(val || 0, currencyCode)}</Text>
                </View>
              ))}
              <View style={styles.hr} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('total')}</Text>
                <Text style={styles.totalAmt}>{moneyFmt(costos.total || 0, currencyCode)}</Text>
              </View>
              <View style={{ marginTop: 6 }}>
                <Text style={styles.small}>{i18n[lang].note}</Text>
              </View>
            </View>
          </View>

          {/* Menú días */}
          <View style={styles.col}>
            <Text style={styles.h2}>{t('menuDays')}</Text>
            <View style={styles.card}>
              {plan.menu?.slice(0, 7).map((d) => (
                <View key={d.dia} style={{ marginBottom: 6 }}>
                  <Text style={{ fontWeight: 700 }}>{t('day')} {d.dia}: {d.plato}</Text>
                  <Text style={styles.small}>
                    {d.ingredientes?.slice(0, 4).map(i => `${i.qty} ${i.unit} ${i.name}`).join(' · ')}
                    {d.ingredientes && d.ingredientes.length > 4 ? '…' : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Lista por categorías */}
        <View style={styles.section}>
          <Text style={styles.h2}>{t('shoppingList')}</Text>
          <View style={styles.card}>
            {Object.entries(lista).map(([cat, items]) => (
              <View key={cat}>
                <Text style={styles.catHeader}>{cat}</Text>
                {items.map((it, idx) => (
                  <View key={`${cat}-${idx}`} style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <Text>•</Text>
                      <Text style={styles.listItem}>{`${it.qty} ${it.unit} ${it.name}`}</Text>
                    </View>
                    <Text style={styles.small}>
                      {typeof it.estCOP === 'number' ? moneyFmt(it.estCOP, currencyCode) : '—'}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Tips / tiendas */}
        <View style={styles.section}>
          <Text style={styles.h2}>{t('tips')}</Text>
          <View style={styles.card}>
            <Text style={styles.pill}>{i18n[lang].storesYouMayLike}</Text>
            {storeSuggestions(city || '', lang).map((s, i) => (
              <Text key={i} style={styles.listItem}>• {s}</Text>
            ))}
            {plan.batch?.baseA ? <Text style={[styles.listItem, { marginTop: 6 }]}>• {plan.batch.baseA}</Text> : null}
            {plan.batch?.baseB ? <Text style={styles.listItem}>• {plan.batch.baseB}</Text> : null}
            {Array.isArray(plan.sobrantes) && plan.sobrantes.length > 0 ? (
              <Text style={[styles.small, { marginTop: 6 }]}>
                {lang === 'es' ? 'Sobrantes previstos:' : 'Planned leftovers:'} {plan.sobrantes.join(', ')}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          {brand} · {now.toLocaleDateString()} · wa.me/573001112233 · platy.app
        </Text>
      </Page>
    </Document>
  )
}

export default PlanPDF

// ============================
// Helper para generar el PDF
// ============================
import { pdf } from '@react-pdf/renderer'

export async function makePlanPdf(
  plan: Plan,
  opts?: {
    brand?: string
    lang?: Lang
    city?: string
    country?: string
    currencyCode?: keyof typeof FX
    logoUrl?: string
    filenameHint?: string
  }
): Promise<{ blob: Blob; url: string; filename: string }> {
  const { brand = 'PLATY', lang = 'es', city, country, currencyCode, logoUrl, filenameHint } = opts || {}
  const doc = (
    <PlanPDF
      plan={plan}
      brand={brand}
      lang={lang}
      cityCountry={{ city, country, currencyCode }}
      logoUrl={logoUrl}
    />
  )
  const blob = await pdf(doc).toBlob()
  const safeCity = (city || plan?.meta?.ciudad || '').replace(/[^\w\-., ]/g, '')
  const filename = `${brand}_menu_${safeCity || 'mi-ciudad'}.pdf`
  const url = URL.createObjectURL(blob)
  return { blob, url, filename: filenameHint || filename }
}

// También exportamos utilidades por si luego quieres usarlas en UI
export function detectCurrencyFor(city?: string, country?: string, currencyCode?: string) {
  return pickCurrencyByLocation({ city, country, currencyCode })
}
