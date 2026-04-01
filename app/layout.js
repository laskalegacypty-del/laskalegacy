import './globals.css';

export const metadata = {
  title: 'Laska Legacy | Leather & Canvas for Horse & Rider',
  description: 'Handcrafted stock bridles, breastplates, paracord reins, and canvas bags. Made in South Africa.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
