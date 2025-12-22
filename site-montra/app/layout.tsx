import "../styles/globals.css";
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { LanguageProvider } from '@/contexts/LanguageContext';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "CRM PLUS — Advanced CRM for Real Estate Agencies",
  description: "Streamline your operations, track leads, and grow. The most powerful CRM platform for real estate agencies with automation, collaboration and integration.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={inter.variable}>
      <body className="bg-black text-white antialiased font-sans">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
