import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { COMPANY_INFO } from '@/lib/constants'
import { registerPDFFonts } from '@/lib/pdf/fonts'
import type { Order } from '@/types'

registerPDFFonts()

const S = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 24, fontSize: 11, fontFamily: 'NotoSans' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  companyBlock: { flexDirection: 'column', gap: 2 },
  companyName: { fontSize: 20, fontFamily: 'NotoSans', fontWeight: 'bold', color: '#1c1917' },
  orderBlock: { flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  orderNum: { fontSize: 17, fontFamily: 'NotoSans', fontWeight: 'bold', color: '#1c1917' },
  orderDate: { fontSize: 10, color: '#78716c' },
  badge: { backgroundColor: '#fef3c7', borderRadius: 4, padding: '3 8', border: '1 solid #fde68a', alignSelf: 'flex-end' },
  badgeText: { fontSize: 9, color: '#92400e', fontFamily: 'NotoSans', fontWeight: 'bold' },
  divider: { borderBottom: '1 solid #e7e5e4', marginBottom: 10 },
  // Items
  itemsSection: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  itemCard: { width: 165, flexDirection: 'column', borderRadius: 4, border: '1 solid #e7e5e4', overflow: 'hidden' },
  itemImage: { width: 165, height: 105, backgroundColor: '#f5f5f4', objectFit: 'cover' },
  itemBody: { padding: 7, flexDirection: 'column', gap: 3 },
  itemModel: { fontSize: 13, fontFamily: 'NotoSans', fontWeight: 'bold', color: '#1c1917' },
  itemCat: { fontSize: 9, color: '#78716c' },
  itemRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  itemLabel: { fontSize: 9, color: '#a8a29e', fontFamily: 'NotoSans', fontWeight: 'bold' },
  itemValue: { fontSize: 10, color: '#44403c' },
  noteBox: { backgroundColor: '#fef3c7', borderRadius: 3, padding: 4, marginTop: 2 },
  noteLabel: { fontSize: 9, color: '#92400e', fontFamily: 'NotoSans', fontWeight: 'bold' },
  noteText: { fontSize: 9, color: '#78350f' },
  // Footer
  footer: { flexDirection: 'row', gap: 10, marginTop: 'auto' },
  footerCard: { flex: 1, padding: 10, backgroundColor: '#fafaf9', borderRadius: 4, border: '1 solid #e7e5e4', flexDirection: 'column', gap: 4 },
  footerTitle: { fontSize: 11, fontFamily: 'NotoSans', fontWeight: 'bold', color: '#1c1917', marginBottom: 2 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footerLabel: { fontSize: 10, color: '#78716c' },
  footerValue: { fontSize: 10, color: '#1c1917', fontFamily: 'NotoSans', fontWeight: 'bold' },
  footerText: { fontSize: 10, color: '#44403c' },
  remainingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4, borderTop: '1 solid #e7e5e4', marginTop: 2 },
  remainingLabel: { fontSize: 11, color: '#78716c', fontFamily: 'NotoSans', fontWeight: 'bold' },
  remainingValue: { fontSize: 12, color: '#1c1917', fontFamily: 'NotoSans', fontWeight: 'bold' },
})

function fmt(n: number) {
  return '€ ' + n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function FactoryPDF({ order, trueRemaining }: { order: Order; trueRemaining?: number }) {
  const items = order.order_items ?? []
  const customer = order.customer

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={S.page}>

        {/* HEADER */}
        <View style={S.header}>
          <View style={S.companyBlock}>
            <Text style={S.companyName}>{COMPANY_INFO.name}</Text>
          </View>
          <View style={S.orderBlock}>
            <View style={S.badge}>
              <Text style={S.badgeText}>FACTORY ORDER / FABRİKA SİPARİŞİ</Text>
            </View>
            <Text style={S.orderNum}>Order / Sipariş #{order.order_number}</Text>
            <Text style={S.orderDate}>Date / Tarih: {fmtDate(order.order_date)}</Text>
          </View>
        </View>

        <View style={S.divider} />

        {/* ITEMS */}
        <View style={S.itemsSection}>
          {items.map((item, i) => (
            <View key={i} style={S.itemCard}>
              {item.image_url ? (
                <Image src={item.image_url} style={S.itemImage} />
              ) : (
                <View style={[S.itemImage, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#a8a29e', fontSize: 10 }}>No Image</Text>
                </View>
              )}
              <View style={S.itemBody}>
                <Text style={S.itemModel}>{item.model_name}</Text>
                <Text style={S.itemCat}>{item.category}</Text>
                {item.sofa_configuration ? (
                  <View style={S.itemRow}>
                    <Text style={S.itemLabel}>Config / Konfigürasyon:</Text>
                    <Text style={S.itemValue}>{item.sofa_configuration}</Text>
                  </View>
                ) : null}
                {item.color ? (
                  <View style={S.itemRow}>
                    <Text style={S.itemLabel}>Color / Renk:</Text>
                    <Text style={S.itemValue}>{item.color}</Text>
                  </View>
                ) : null}
                <View style={S.itemRow}>
                  <Text style={S.itemLabel}>Qty / Adet:</Text>
                  <Text style={S.itemValue}>{item.quantity}</Text>
                </View>
                {item.customization_note ? (
                  <View style={S.noteBox}>
                    <Text style={S.noteLabel}>Note / Not:</Text>
                    <Text style={S.noteText}>{item.customization_note}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <View style={S.divider} />

        {/* FOOTER */}
        <View style={S.footer}>
          {/* Customer */}
          <View style={S.footerCard}>
            <Text style={S.footerTitle}>Customer / Müşteri</Text>
            {customer ? (
              <>
                <Text style={S.footerText}>{customer.name}</Text>
                {customer.address ? <Text style={S.footerText}>{customer.address}</Text> : null}
                {customer.city ? <Text style={S.footerText}>{customer.postal_code ?? ''} {customer.city}</Text> : null}
                {customer.phone ? <Text style={S.footerText}>{customer.phone}</Text> : null}
              </>
            ) : (
              <Text style={S.footerText}>—</Text>
            )}
          </View>

          {/* Delivery + Notes */}
          <View style={S.footerCard}>
            <Text style={S.footerTitle}>Delivery / Teslimat</Text>
            {order.expected_delivery_date ? (
              <View style={S.footerRow}>
                <Text style={S.footerLabel}>Expected / Beklenen:</Text>
                <Text style={S.footerValue}>{fmtDate(order.expected_delivery_date)}</Text>
              </View>
            ) : null}
            {order.delivery_address ? (
              <Text style={S.footerText}>{order.delivery_address}</Text>
            ) : null}
            {order.factory_notes ? (
              <>
                <Text style={[S.footerLabel, { marginTop: 4 }]}>Notes / Notlar:</Text>
                <Text style={S.footerText}>{order.factory_notes}</Text>
              </>
            ) : null}
            {!order.expected_delivery_date && !order.delivery_address && !order.factory_notes ? (
              <Text style={{ fontSize: 10, color: '#a8a29e' }}>—</Text>
            ) : null}
          </View>

          {/* Remaining only */}
          <View style={S.footerCard}>
            <Text style={S.footerTitle}>Payment / Ödeme</Text>
            <View style={S.remainingRow}>
              <Text style={S.remainingLabel}>Remaining / Kalan:</Text>
              <Text style={S.remainingValue}>{fmt(trueRemaining ?? order.remaining_balance)}</Text>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  )
}
