import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { COMPANY_INFO } from '@/lib/constants'
import { registerPDFFonts } from '@/lib/pdf/fonts'
import { arabicStyle } from '@/lib/pdf/smartText'
import type { Order, Payment } from '@/types'

registerPDFFonts()

const S = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 24, fontSize: 11, fontFamily: 'NotoSans' },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  companyBlock: { flexDirection: 'column', gap: 2 },
  companyName: { fontSize: 20, fontFamily: 'NotoSans', fontWeight: 'bold', color: '#1c1917' },
  orderBlock: { flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  orderNum: { fontSize: 17, fontFamily: 'NotoSans', fontWeight: 'bold', color: '#1c1917' },
  orderDate: { fontSize: 10, color: '#78716c' },
  divider: { borderBottom: '1 solid #e7e5e4', marginBottom: 12 },
  // Items grid
  itemsSection: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  itemCard: { width: 170, flexDirection: 'column', borderRadius: 4, border: '1 solid #e7e5e4', overflow: 'hidden' },
  itemImage: { width: 170, height: 110, backgroundColor: '#f5f5f4', objectFit: 'cover' },
  itemBody: { padding: 8, flexDirection: 'column', gap: 3 },
  itemModel: { fontSize: 13, fontFamily: 'NotoSans', fontWeight: 'bold', color: '#1c1917' },
  itemRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  itemLabel: { fontSize: 9, color: '#a8a29e', fontFamily: 'NotoSans', fontWeight: 'bold' },
  itemValue: { fontSize: 10, color: '#44403c' },
  // Footer
  footer: { flexDirection: 'row', gap: 12, marginTop: 'auto' },
  footerCard: { flex: 1, padding: 10, backgroundColor: '#fafaf9', borderRadius: 4, border: '1 solid #e7e5e4', flexDirection: 'column', gap: 4 },
  footerTitle: { fontSize: 11, fontFamily: 'NotoSans', fontWeight: 'bold', color: '#1c1917', marginBottom: 2 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footerLabel: { fontSize: 10, color: '#78716c' },
  footerValue: { fontSize: 10, color: '#1c1917', fontFamily: 'NotoSans', fontWeight: 'bold' },
  footerText: { fontSize: 10, color: '#44403c' },
})

function fmt(n: number) {
  return '€ ' + n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(s: string | null | undefined) {
  if (!s) return '—'
  const d = new Date(s)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function OrderPDF({ order, trueRemaining, payments, showPrices = true }: { order: Order; trueRemaining?: number; payments?: Payment[]; showPrices?: boolean }) {
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
            <Text style={S.orderNum}>Bestellung / Order #{order.order_number}</Text>
            <Text style={S.orderDate}>Datum / Date: {fmtDate(order.order_date)}</Text>
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
                <Text style={[S.itemModel, arabicStyle(item.model_name)]}>{item.model_name}</Text>
                <Text style={{ fontSize: 9, color: '#78716c' }}>{item.category}</Text>
                {item.sofa_configuration ? (
                  <View style={S.itemRow}>
                    <Text style={S.itemLabel}>Sitz / Config:</Text>
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
                  {showPrices ? (
                    <>
                      <Text style={[S.itemLabel, { marginLeft: 8 }]}>Preis:</Text>
                      <Text style={S.itemValue}>{fmt(item.unit_price * item.quantity)}</Text>
                    </>
                  ) : null}
                </View>
                {item.customization_note ? (
                  <View style={{ backgroundColor: '#fef3c7', borderRadius: 3, padding: 4, marginTop: 2 }}>
                    <Text style={{ fontSize: 9, color: '#92400e', fontFamily: 'NotoSans', fontWeight: 'bold' }}>Notiz / Note:</Text>
                    <Text style={[{ fontSize: 9, color: '#78350f' }, arabicStyle(item.customization_note)]}>{item.customization_note}</Text>
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
            <Text style={S.footerTitle}>Kunde / Customer</Text>
            {customer ? (
              <>
                <Text style={[S.footerText, arabicStyle(customer.name)]}>{customer.name}</Text>
                {customer.address ? <Text style={[S.footerText, arabicStyle(customer.address)]}>{customer.address}</Text> : null}
                {customer.city ? <Text style={[S.footerText, arabicStyle(customer.city)]}>{customer.postal_code ?? ''} {customer.city}</Text> : null}
                {customer.phone ? <Text style={S.footerText}>{customer.phone}</Text> : null}
                {customer.email ? <Text style={S.footerText}>{customer.email}</Text> : null}
              </>
            ) : (
              <Text style={S.footerText}>—</Text>
            )}
          </View>

          {/* Payment */}
          <View style={S.footerCard}>
            <Text style={S.footerTitle}>Zahlung / Payment</Text>
            <View style={S.footerRow}>
              <Text style={S.footerLabel}>Gesamt / Total:</Text>
              <Text style={S.footerValue}>{fmt(order.total_price)}</Text>
            </View>
            <View style={S.footerRow}>
              <Text style={S.footerLabel}>Anzahlung / Down:</Text>
              <Text style={S.footerValue}>{fmt(order.down_payment)}</Text>
            </View>
            {(payments ?? []).map((p, i) => (
              <View key={i} style={S.footerRow}>
                <Text style={S.footerLabel}>Zahlung {fmtDate(p.payment_date)}:</Text>
                <Text style={S.footerValue}>{fmt(p.amount)}</Text>
              </View>
            ))}
            <View style={S.footerRow}>
              <Text style={S.footerLabel}>Restbetrag / Rest:</Text>
              <Text style={S.footerValue}>{fmt(trueRemaining ?? order.remaining_balance)}</Text>
            </View>
            {order.payment_method ? (
              <View style={S.footerRow}>
                <Text style={S.footerLabel}>Methode:</Text>
                <Text style={S.footerValue}>{order.payment_method}</Text>
              </View>
            ) : null}
          </View>

          {/* Notes */}
          <View style={S.footerCard}>
            <Text style={S.footerTitle}>Notizen / Notes</Text>
            {order.factory_notes ? (
              <Text style={[S.footerText, arabicStyle(order.factory_notes)]}>{order.factory_notes}</Text>
            ) : null}
            {order.internal_notes ? (
              <Text style={[S.footerText, { color: '#78716c' }, arabicStyle(order.internal_notes)]}>{order.internal_notes}</Text>
            ) : null}
            {order.expected_delivery_date ? (
              <Text style={S.footerText}>Lieferung / Delivery: {fmtDate(order.expected_delivery_date)}</Text>
            ) : null}
            {order.delivery_address ? (
              <Text style={[S.footerText, arabicStyle(order.delivery_address)]}>{order.delivery_address}</Text>
            ) : null}
            {!order.factory_notes && !order.internal_notes && !order.expected_delivery_date ? (
              <Text style={{ fontSize: 10, color: '#a8a29e' }}>—</Text>
            ) : null}
          </View>
        </View>

      </Page>
    </Document>
  )
}
