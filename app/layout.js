import './globals.css';

export const metadata = {
  title: "Queper — Know when it's your turn",
  description: 'Web-based digital queue notifications. No app. No account. No personal info.',
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#111111',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
