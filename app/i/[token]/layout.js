export const metadata = {
  title: 'Your Invoice | Laska Legacy',
  robots: { index: false, follow: false },
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
};

export const viewport = {
  themeColor: '#07050f',
};

export default function DigitalInvoiceLayout({ children }) {
  return children;
}
