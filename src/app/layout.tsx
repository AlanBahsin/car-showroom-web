import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'AutoDrive Showroom',
  description: 'Katalog Mobil & Sistem Rekomendasi SAW',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}