import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { COMPANY_INFO } from '@/lib/constants'
import { registerPDFFonts } from '@/lib/pdf/fonts'
import { arabicStyle } from '@/lib/pdf/smartText'
import type { Order } from '@/types'

registerPDFFonts()

const S = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 24, fontSize: 11, fontFamily: 'NotoSans' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  companyBlock: { flexDirection: 'column', gap: 2 },
  companyName: { fontSize: 20, fontFamily: 'NotoSans', fontWeight: 'bold', color: '#1c1917' },
  companyTag: { fontSize: 10, color: '#78716c' },
  orderBlock: { flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  orderNum: { fontSize: 17, fontFamily: 'NotoSans', fontWeight: 'bold', color: '#1c1917' },
  orderDate: { fontSize: 10, color: '#78716c' },
  divider: { borderBottom: '1 solid #e7e5e4', marginBottom: 12 },
  itemsSection: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  itemCard: { width: 170, flexDirection: 'column', borderRadius: 4, border: '1 solid #e7e5e4', overflow: 'hidden' },
  itemImage: { width: 170, height: 110, backgroundColor: '#f5f5f4', objectFit: 'cover' },
  itemBody: { padding: 8, flexDirection: 'column', gap: 3 },
  itemModel: { fontSize: 13, fontFamily: 'NotoSans', fontWeight: 'bold', color: '#1c1917' },
  itemRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  itemLabel: { fontSize: 9, color: '#a8a29e', fontFamily: 'NotoSans', fontWeight: 'bold' },
  itemValue: { fontSize: 10, color: '#44403c' },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  costLabel: { fontSize: 9, color: '#78716c' },
  costValue: { fontSize: 9, color: '#44403c', fontFamily: 'NotoSans', fontWeight: 'bold' },
  footer: { flexDirection: 'row', gap: 12, marginTop: 'auto' },
  footerCard: { flex: 1, padding: 10, backgroundColor: '#1c1917', borderRadius: 4, border: '1 solid #e7e5e4', flexDirection: 'column', gap: 4 },
  footerTitle: { fontSize: 11, fontFamily: 'NotoSans', fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footerLabel: { fontSize: 10, color: '#a8a29e' },
  footerValue: { fontSize: 10, color: '#FFFFFF', fontFamily: 'NotoSans', fontWeight: 'bold' },
  footerTotal: { flexDirection: 'row', justifyContent: 'space-between', borderTop: '1 solid #44403c', paddingTop: 6, marginTop: 2 },
  footerTotalLabel: { fontSize: 12, color: '#FFFFFF', fontFamily: 'NotoSans', fontWeight: 'bold' },
  footerTotalValue: { fontSize: 12, color: '#FFFFFF', fontFamily: 'NotoSans', fontWeight: 'bold' },
})

function fmt(n: number) {
  return '€ ' + n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(s: string | null | undefined) {
  if (!s) return '—'
  const d = new Date(s)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function ShowroomOrderPDF({ order }: { order: Order }) {
  const items = order.order_items ?? []
  const totalProduct = items.reduce((s, i) => s + (i.product_cost ?? 0) * i.quantity, 0)
  const totalLogistics = items.reduce((s, i) => s + (i.logistics_cost ?? 0) * i.quantity, 0)
  const grandTotal = totalProduct + totalLogistics

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={S.page}>

        {/* HEADER */}
        <View style={S.header}>
          <View style={S.companyBlock}>
            <Text style={S.companyName}>{COMPANY_INFO.name}</Text>
            <Text style={S.companyTag}>Show-Room Order / Schauraum-Bestellung</Text>
          </View>
          <View style={S.orderBlock}>
            <Text style={S.orderNum}>#{order.order_number}</Text>
            <Text style={S.orderDate}>Datum / Date: {fmtDate(order.order_date)}</Text>
          </View>
        </View>

        <View style={S.divider} />

        {/* ITEMS */}
        <View style={S.itemsSection}>
          {items.map((item, i) => {
            const itemProductCost = (item.product_cost ?? 0) * item.quantity
            const itemLogisticsCost = (item.logistics_cost ?? 0) * item.quantity
            const itemTotal = itemProductCost + itemLogisticsCost
            return (
              <View key={i} style={S.itemCard}>
                {item.image_url ? (
                  <Image src={item.image_url} style={S.itemImage} />
                ) : (
                  <View style={[S.itemImage, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: '#a8a29e', fontSize: 10 }}>No Image</Text>
                  </View>
                )}
                <View style={S.itemBody}>
                  <Text style={[S.itemModel, arabicStyle(item.model_name)]}>{item.model_name}</Text>
                  <Text style={{ fontSize: 9, color: '#78716c' }}>{item.category}</Text>
                  {item.sofa_configuration ? (
                    <View style={S.itemRow}>
                      <Text style={S.itemLabel}>Config:</Text>
                      <Text style={[S.itemValue, arabicStyle(item.sofa_configuration)]}>{item.sofa_configuration}</Text>
                    </View>
                  ) : null}
                  {item.color ? (
                    <View style={S.itemRow}>
                      <Text style={S.itemLabel}>Farbe / Color:</Text>
                      <Text style={[S.itemValue, arabicStyle(item.color)]}>{item.color}</Text>
                    </View>
                  ) : null}
                  <View style={S.itemRow}>
                    <Text style={S.itemLabel}>Menge / Qty:</Text>
                    <Text style={S.itemValue}>{item.quantity}</Text>
                  </View>
                  <View style={S.costRow}>
                    <Text style={S.costLabel}>Produktkosten:</Text>
                    <Text style={S.costValue}>{fmt(itemProductCost)}</Text>
                  </View>
                  <View style={S.costRow}>
                    <Text style={S.costLabel}>Logistik:</Text>
                    <Text style={S.costValue}>{fmt(itemLogisticsCost)}</Text>
                  </View>
                  <View style={[S.costRow, { borderTop: '1 solid #e7e5e4', paddingTop: 2, marginTop: 2 }]}>
                    <Text style={[S.costLabel, { fontFamily: 'NotoSans', fontWeight: 'bold' }]}>Gesamt:</Text>
                    <Text style={[S.costValue, { color: '#1c1917' }]}>{fmt(itemTotal)}</Text>
                  </View>
                  {item.customization_note ? (
                    <View style={{ backgroundColor: '#fef3c7', borderRadius: 3, padding: 4, marginTop: 2 }}>
                      <Text style={{ fontSize: 9, color: '#92400e', fontFamily: 'NotoSans', fontWeight: 'bold' }}>Notiz / Note:</Text>
                      <Text style={[{ fontSize: 9, color: '#78350f' }, arabicStyle(item.customization_note)]}>{item.customization_note}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )
          })}
        </View>

        <View style={S.divider} />

        {/* FOOTER — cost summary only, no payment */}
        <View style={S.footer}>
          <View style={S.footerCard}>
            <Text style={S.footerTitle}>Geschätzte Türkei-Kosten / Approx. Turkey Costs</Text>
            <View style={S.footerRow}>
              <Text style={S.footerLabel}>Produktkosten / Product Cost:</Text>
              <Text style={S.footerValue}>{fmt(totalProduct)}</Text>
            </View>
            <View style={S.footerRow}>
              <Text style={S.footerLabel}>Logistikkosten / Logistics Cost:</Text>
              <Text style={S.footerValue}>{fmt(totalLogistics)}</Text>
            </View>
            <View style={S.footerTotal}>
              <Text style={S.footerTotalLabel}>Gesamt / Grand Total:</Text>
              <Text style={S.footerTotalValue}>{fmt(grandTotal)}</Text>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  )
}
