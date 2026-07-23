import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const TEAL = '#0097b2';
const GREY = '#6b7280';
const GREY_LIGHT = '#e5e7eb';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: '#000000', fontFamily: 'Helvetica' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 36 },
  logo: { width: 64, height: 64, marginBottom: 10 },
  bizName: { fontSize: 12, fontWeight: 700, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  bizLine: { fontSize: 10, marginBottom: 2, color: '#000000' },
  invoiceLabel: { fontSize: 18, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  invoiceNumber: { fontSize: 18, fontFamily: 'Helvetica-Bold', textAlign: 'right', marginBottom: 20 },
  bankTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'right', marginBottom: 3 },
  bankLine: { fontSize: 10, textAlign: 'right', marginBottom: 2 },
  table: { borderWidth: 1, borderColor: GREY_LIGHT },
  headerRow: { flexDirection: 'row', backgroundColor: TEAL },
  headerCell: { padding: 8, fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  row: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: GREY_LIGHT },
  cell: { padding: 8, fontSize: 10 },
  colItem: { width: '40%' },
  colQty: { width: '20%', textAlign: 'center' },
  colPrice: { width: '20%', textAlign: 'center' },
  colTotal: { width: '20%', textAlign: 'center' },
  totalRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: GREY_LIGHT },
  totalLabelCell: { width: '80%', backgroundColor: TEAL, padding: 8, justifyContent: 'center' },
  totalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#ffffff', textAlign: 'center' },
  totalValueCell: { width: '20%', padding: 8, justifyContent: 'center' },
  totalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  footer: { marginTop: 60, textAlign: 'center', fontSize: 11, fontFamily: 'Helvetica-Bold' },
});

export default function InvoiceDocument({ invoiceNumber, items, total, logoDataUrl }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topRow}>
          <View>
            {logoDataUrl && <Image src={logoDataUrl} style={styles.logo} />}
            <Text style={styles.bizName}>Laska Legacy</Text>
            <Text style={styles.bizLine}>Plot 50 Buffeldooring Potchefstroom</Text>
            <Text style={styles.bizLine}>072 585 8288</Text>
            <Text style={styles.bizLine}>laskalegacy@gmail.com</Text>
          </View>
          <View>
            <Text style={styles.invoiceLabel}>INVOICE #</Text>
            <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
            <Text style={styles.bankTitle}>Bank details:</Text>
            <Text style={styles.bankLine}>FNB</Text>
            <Text style={styles.bankLine}>FIRST BUSINESS ZERO</Text>
            <Text style={styles.bankLine}>ACCOUNT</Text>
            <Text style={styles.bankLine}>63196690804</Text>
            <Text style={styles.bankLine}>Reference: Invoice number</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.colItem]}>Item</Text>
            <Text style={[styles.headerCell, styles.colQty]}>Quantity</Text>
            <Text style={[styles.headerCell, styles.colPrice]}>Price</Text>
            <Text style={[styles.headerCell, styles.colTotal]}>Total</Text>
          </View>
          {items.map((it, i) => (
            <View key={i} style={styles.row}>
              <Text style={[styles.cell, styles.colItem]}>{it.name}</Text>
              <Text style={[styles.cell, styles.colQty]}>{it.quantity}</Text>
              <Text style={[styles.cell, styles.colPrice]}>{it.price}</Text>
              <Text style={[styles.cell, styles.colTotal]}>{it.quantity * it.price}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <View style={styles.totalLabelCell}><Text style={styles.totalLabel}>Total</Text></View>
            <View style={styles.totalValueCell}><Text style={styles.totalValue}>{total}</Text></View>
          </View>
        </View>

        <Text style={styles.footer}>We appreciate your business and so do our horses (they demanded I add that)</Text>
      </Page>
    </Document>
  );
}
