// ... importaciones existentes
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image as PDFImage } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: 'Helvetica' },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 12 },
  brand: { width: 180 },
  meta: { color:'#555' },
  h1: { fontSize: 20, marginTop: 6, marginBottom: 4, fontFamily:'Helvetica-Bold' },
  h2: { fontSize: 14, marginTop: 10, marginBottom: 6, fontFamily:'Helvetica-Bold' },
  card: { borderWidth:1, borderColor:'#e6e6e6', borderRadius:8, padding:10, marginBottom:8 },
  grid2: { flexDirection:'row', gap:8 },
  col: { flex:1 },
  row: { flexDirection:'row' },
  th: { fontFamily:'Helvetica-Bold', backgroundColor:'#f7f7f7', padding:6, borderRightWidth:1, borderColor:'#e6e6e6' },
  td: { padding:6, borderTopWidth:1, borderColor:'#efefef', borderRightWidth:1, borderRightColor:'#f2f2f2' },
  right: { textAlign:'right' },
  small: { fontSize:9, color:'#666' },
  foot: { position:'absolute', bottom:24, left:36, right:36, flexDirection:'row', justifyContent:'space-between', alignItems:'center' }
})

function fmtCOP(n?: number) {
  if (typeof n !== 'number') return '-'
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

export function PlanPDF({ plan }: { plan: any }) {
  // aplanar lista de compras a filas [cat, item, qty, unit, est]
  const rows: {cat:string; name:string; qty:number; unit:string; est?:number}[] = []
  Object.entries(plan.lista || {}).forEach(([cat, items]: any) => {
    (items || []).forEach((i:any) => rows.push({cat, name:i.name, qty:i.qty, unit:i.unit, est:i.estCOP}))
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.header}>
          <PDFImage src="/brand/PLATY_wordmark_1800.png" style={styles.brand} />
          <View>
            <Text style={styles.meta}>{plan.meta.ciudad} · {plan.meta.modo} · {plan.meta.personas} pers</Text>
            <Text style={styles.meta}>Incluye cantidades (g/ml/ud) y costo estimado por ciudad.</Text>
          </View>
        </View>

        {/* Resumen / Tienda sugerida */}
        <View style={[styles.grid2, { marginBottom: 6 }]}>
          <View style={styles.col}>
            <View style={styles.card}>
              <Text style={styles.h2}>Resumen</Text>
              <Text>Ciudad: {plan.meta.ciudad}</Text>
              <Text>Personas: {plan.meta.personas}</Text>
              <Text>Tiempo: {plan.meta.modo}</Text>
            </View>
          </View>
          {plan.tiendas && (
            <View style={styles.col}>
              <View style={styles.card}>
                <Text style={styles.h2}>Dónde comprar (sugerido)</Text>
                <Text>• {plan.tiendas.sugerida.nombre} ({plan.tiendas.sugerida.tipo})</Text>
                <Text>• Alternativas: {plan.tiendas.opciones.map((o:any)=>o.nombre).join(', ')}</Text>
                <Text style={styles.small}>Maps: {plan.tiendas.mapsUrl}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Menú */}
        <Text style={styles.h1}>Menú · Días 1–7</Text>
        {plan.menu.map((d:any) => (
          <View key={d.dia} style={styles.card}>
            <Text style={{ fontFamily:'Helvetica-Bold' }}>Día {d.dia}: {d.plato}</Text>
            <Text>Ingredientes: {d.ingredientes.map((i:any)=>`${i.qty} ${i.unit} ${i.name}`).join('; ')}</Text>
            <Text>Pasos: {d.pasos.join(' · ')}</Text>
            <Text>Tip: {d.tip}</Text>
          </View>
        ))}

        {/* Lista de compras en tabla */}
        <Text style={styles.h1}>Lista de compras (consolidada)</Text>
        <View style={{ borderWidth:1, borderColor:'#e6e6e6', borderRadius:8, overflow:'hidden' }}>
          <View style={styles.row}>
            <Text style={[styles.th, {flex:1}]}>Categoría</Text>
            <Text style={[styles.th, {flex:2}]}>Producto</Text>
            <Text style={[styles.th, {flex:1, textAlign:'right'}]}>Cantidad</Text>
            <Text style={[styles.th, {flex:1, textAlign:'right'}]}>Est. COP</Text>
          </View>
          {rows.map((r, idx) => (
            <View key={idx} style={styles.row}>
              <Text style={[styles.td, {flex:1}]}>{r.cat}</Text>
              <Text style={[styles.td, {flex:2}]}>{r.name}</Text>
              <Text style={[styles.td, {flex:1, textAlign:'right'}]}>{r.qty} {r.unit}</Text>
              <Text style={[styles.td, {flex:1, textAlign:'right'}]}>{fmtCOP(r.est)}</Text>
            </View>
          ))}
        </View>

        {/* Costos por categoría */}
        {plan.costos && (
          <>
            <Text style={styles.h1}>Costos estimados</Text>
            <View style={{ borderWidth:1, borderColor:'#e6e6e6', borderRadius:8, overflow:'hidden' }}>
              <View style={styles.row}>
                <Text style={[styles.th, {flex:2}]}>Categoría</Text>
                <Text style={[styles.th, {flex:1, textAlign:'right'}]}>COP</Text>
              </View>
              {Object.entries(plan.costos.porCategoria).map(([cat, val]: any) => (
                <View key={cat} style={styles.row}>
                  <Text style={[styles.td, {flex:2}]}>{cat}</Text>
                  <Text style={[styles.td, {flex:1, textAlign:'right'}]}>{fmtCOP(val as number)}</Text>
                </View>
              ))}
              <View style={styles.row}>
                <Text style={[styles.td, {flex:2, fontFamily:'Helvetica-Bold'}]}>Total</Text>
                <Text style={[styles.td, {flex:1, textAlign:'right', fontFamily:'Helvetica-Bold'}]}>
                  {fmtCOP(plan.costos.total)}
                </Text>
              </View>
            </View>
            <Text style={[styles.small, { marginTop: 4 }]}>* {plan.costos.nota}</Text>
          </>
        )}

        {/* Footer */}
        <View style={styles.foot}>
          <Text style={styles.small}>© {new Date().getFullYear()} {site.brand} · {site.domain}</Text>
          <PDFImage src="/brand/PLATY_logo_icon_1024.png" style={{ width: 22, height: 22 }} />
        </View>
      </Page>
    </Document>
  )
}

