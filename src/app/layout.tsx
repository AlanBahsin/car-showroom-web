import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'AutoDrive Prestige | Certified Luxury & Performance Showroom',
  description: 'Showroom mobil pilihan dengan inspeksi bersertifikat, simulasi kredit transparan, dan sistem rekomendasi SAW.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#090b10] text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        <Navbar />
        {children}
      </body>
    </html>
  );
}