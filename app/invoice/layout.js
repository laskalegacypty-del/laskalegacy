export const metadata = {
  title: 'Laska Legacy | Invoice',
  robots: { index: false, follow: false },
  manifest: '/invoice-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black',
    title: 'LL Invoice',
  },
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
};

export const viewport = {
  themeColor: '#000000',
};

export default function InvoiceLayout({ children }) {
  return children;
}
