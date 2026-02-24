import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Enclavr - Voice Chat',
  description: 'Self-hosted voice chat platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
