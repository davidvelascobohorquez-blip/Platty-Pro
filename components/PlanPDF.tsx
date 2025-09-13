'use client'

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PDFImage,
  Font,
  pdf
} from '@react-pdf/renderer'
import { site } from '@/site.config'

// =======================
// Tipos (alineados al API)
// =======================
type Unit = 'g' | 'ml' | 'ud'
type ItemQty = { name: string; qty: number; unit: Unit; estCOP?: number }
export type Plan = {
  menu: { dia: number; plato: string; ingredientes: ItemQty[]; pasos: string[]; tip: string }[]
  lista: Record<string, ItemQty[]>
  batch: { baseA: string; baseB: string }
  sobrantes: string[]
  meta: { ciudad: string; personas: number; modo: string; moneda: 'COP' }
  costos: { porCategoria: Record<string, number>; total: number; nota: string }
  // opcional, por si luego lo agregamos en el endpoint
  tiendas?: { sugerida: { nombre: string; tipo: 'hard-discount' | 'supermercado' }; opciones: { nombre: string; tipo: 'hard-discount' | 'supermercado' }[]; mapsUrl?: string }
}

// =======================
// Fuentes & estilos
// =======================
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fv.ttf' }, // Regular
  ]
})

const AMBER = '#F59E0B'
const INK = '#1F2937'
const STONE = '#6B7280'
const LINE = '#E5E7EB'
const CARD = '#FAFAFA'

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 36,
    paddingHorizontal: 32,
    fontFamily: 'Helvetica',
    color: INK,
    fontSize: 11,
    lineHeight: 1.35
  },
  headerWrap: {
    alignItems: 'center',
    marginBottom: 12
  },
  wordmark: {
    width: 240
  },
  title: {
    fontSize: 22,
    marginTop: 6,
    marginBottom: 2
  },
  subtitle: {
    fontSize: 11,
    color: STONE
  },
  hr: {
    marginTop: 10,
    marginBottom: 14,
    height: 1,
    backgroundColor: LINE
  },
  h2: {
    fontSize: 14,
    marginBottom: 6
  },
  chip: {
    backgroundColor: CARD,
    borderColor: LINE,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6
  },
  row: {
    flexDirection: 'row',
    gap: 10
  },
  col: {
    flexDirection: 'column',
    flexGrow: 1
  },
  small: {
    fontSize: 9,
    color: STONE
  },
  // Tabla genérica
  table: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 6,
    overflow: 'hidden'
  },
  trHead: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB'
  },
  th: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRightColor: LINE,
    borderRightWidth: 1
  },
  tr: {
    flexDirection: 'row',
    borderTopColor: LINE,
    borderTopWidth: 1
  },
  td: {
    fontSize: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRightColor: LINE,
    borderRightWidth: 1
  },
  tdRight: { textAlign: 'right' },
  totalRow: {
    backgroundColor: '#FEF3C7'
  },
  badge: {
    color: AMBER,
    fontFamily: 'Helvetica-Bold'
  },
  // Tarjeta día
  dayCard: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8
  },
  footer: {
    position: 'absolute',
    left: 32,
    right: 32,
    bottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
})

function fmtCOP(n?: number) {
  if (typeof n !== 'number') return '—'
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}
function qtyTxt(q: number, u: Unit) {
  const su = u === 'ud' ? 'ud' : u
  return `${q} ${su}`
}
function byCostDesc(a: [string, number], b: [string, number]) {
  return b[1] - a[1]
}

// =======================
// Componente principal
// =======================
function Cover({ plan }: { plan: Plan }) {
  return (
    <View>
      <View style={styles.headerWrap}>
        {/* Wordmark centrado (no mostramos el ícono chico para evitar el "doble logo") */}
        <PDFImage src="/brand/PLATY_wordmark_1800.png" style={styles.wordmark} />
        <Text style={styles.title}>Menú semanal</Text>
        <Text style={styles.subtitle}>
          {plan.meta.ciudad} · {plan.meta.modo} · {plan.meta.personas} {plan.meta.personas === 1 ? 'persona' : 'personas'}
        </Text>
      </View>
      <View style={styles.hr} />
    </View>
  )
}

function Costos({ plan }: { plan: Plan }) {
  const entries = Object.entries(plan.costos.porCategoria).sort(byCostDesc)
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.h2}>Costo estimado por categoría</Text>
      <View style={styles.table}>
        <View style={styles.trHead}>
          <Text style={[styles.th, { flex: 2 }]}>Categoría</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Estimado ({plan.meta.moneda})</Text>
        </View>
        {entries.map(([cat, val]) => (
          <View key={cat} style={styles.tr}>
            <Text style={[styles.td, { flex: 2 }]}>{cat}</Text>
            <Text style={[styles.td, { flex: 1 }, styles.tdRight]}>{fmtCOP(val)}</Text>
          </View>
        ))}
        <View style={[styles.tr, styles.totalRow]}>
          <Text style={[styles.td, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>Total</Text>
          <Text style={[styles.td, { flex: 1, fontFamily: 'Helvetica-Bold' }, styles.tdRight]}>{fmtCOP(plan.costos.total)}</Text>
        </View>
      </View>
      <Text style={[styles.small, { marginTop: 4 }]}>
        * {plan.costos.nota} (Ciudad: {plan.meta.ciudad}).</Text>
    </View>
  )
}

function ListaCompras({ plan }: { plan: Plan }) {
  const cats = Object.keys(plan.lista)
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.h2}>Lista de compras (consolidada por categoría)</Text>

      {cats.map((cat) => {
        const items = plan.lista[cat]
        return (
          <View key={cat} style={{ marginBottom: 8 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>{cat}</Text>
            <View style={styles.table}>
              <View style={styles.trHead}>
                <Text style={[styles.th, { flex: 2 }]}>Producto</Text>
                <Text style={[styles.th, { flex: 1 }]}>Cantidad</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Est. ({plan.meta.moneda})</Text>
              </View>
              {items.map((it, idx) => (
                <View key={cat + idx} style={styles.tr}>
                  <Text style={[styles.td, { flex: 2 }]}>{it.name}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{qtyTxt(it.qty, it.unit)}</Text>
                  <Text style={[styles.td, { flex: 1 }, styles.tdRight]}>{fmtCOP(it.estCOP)}</Text>
                </View>
              ))}
            </View>
          </View>
        )
      })}
    </View>
  )
}

function MenuDias({ plan }: { plan: Plan }) {
  return (
    <View style={{ marginTop: 6 }}>
      <Text style={styles.h2}>Menú día a día (7 días)</Text>
      {plan.menu.map(d => (
        <View key={d.dia} style={styles.dayCard}>
          <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>
            Día {d.dia}: {d.plato}
          </Text>
          <Text style={{ marginBottom: 2 }}>
            <Text style={styles.badge}>Ingredientes: </Text>
            {d.ingredientes.map(i => `${qtyTxt(i.qty, i.unit)} ${i.name}`).join(' · ')}
          </Text>
          <Text style={{ marginBottom: 2 }}>
            <Text style={styles.badge}>Pasos: </Text>
            {d.pasos.join('  •  ')}
          </Text>
          <Text>
            <Text style={styles.badge}>Tip: </Text>
            {d.tip}
          </Text>
        </View>
      ))}
    </View>
  )
}

function BatchAndExtras({ plan }: { plan: Plan }) {
  return (
    <View style={{ marginTop: 8 }}>
      <Text style={styles.h2}>Batch cooking & extras</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
        <Text style={styles.chip}>Base A: {plan.batch.baseA}</Text>
        <Text style={styles.chip}>Base B: {plan.batch.baseB}</Text>
      </View>
      {plan.sobrantes?.length ? (
        <Text style={styles.small}>Sobrantes que puedes reutilizar: {plan.sobrantes.join(', ')}.</Text>
      ) : null}
    </View>
  )
}

function Tiendas({ plan }: { plan: Plan }) {
  const t = (plan as any).tiendas
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.h2}>Dónde comprar (sugerido)</Text>
      {t ? (
        <>
          <Text>• Sugerido: {t.sugerida.nombre} ({t.sugerida.tipo}).</Text>
          {t.opciones?.length ? <Text>• Alternativas: {t.opciones.map((o: any) => o.nombre).join(', ')}.</Text> : null}
          {t.mapsUrl ? <Text style={styles.small}>Mapa: {t.mapsUrl}</Text> : null}
        </>
      ) : (
        <Text>Recomendación: empieza por un <Text style={styles.badge}>hard-discount</Text> cercano (D1, Ara, etc.) y compara con tu súper de confianza.</Text>
      )}
    </View>
  )
}

export default function PlanPDF({ plan }: { plan: Plan }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Cover plan={plan} />

        {/* Resumen superior */}
        <View style={[styles.row, { marginBottom: 12 }]}>
          <View style={styles.col}>
            <Text style={styles.h2}>Tu configuración</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <Text style={styles.chip}>Ciudad: {plan.meta.ciudad}</Text>
              <Text style={styles.chip}>Personas: {plan.meta.personas}</Text>
              <Text style={styles.chip}>Modo: {plan.meta.modo}</Text>
              <Text style={styles.chip}>Moneda: {plan.meta.moneda}</Text>
            </View>
          </View>
        </View>

        <Costos plan={plan} />
        <ListaCompras plan={plan} />
        <MenuDias plan={plan} />
        <BatchAndExtras plan={plan} />
        <Tiendas plan={plan} />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.small}>
            {site.brand} · {site.domain} · WhatsApp: wa.me/{site.whatsapp}
          </Text>
          {/* dejamos solo texto para evitar el “doble logo”; si quieres, agrega un ícono pequeño aquí */}
        </View>
      </Page>
    </Document>
  )
}

// ============================================
// Helper para generar el Blob del PDF (email)
// ============================================
export async function makePlanPdf(plan: Plan) {
  const instance = pdf(<PlanPDF plan={plan} />)
  const blob = await instance.toBlob()
  return blob
}
