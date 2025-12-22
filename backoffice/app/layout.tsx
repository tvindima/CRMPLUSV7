import "../styles/globals.css";
import type { Metadata } from "next";
import React from "react";
import { Poppins } from "next/font/google";
import { ClientProviders } from "../components/ClientProviders";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: "CRM PLUS — Backoffice",
  description: "Área administrativa e operacional do CRM PLUS para equipas internas.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" }
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={poppins.variable}>
      <body className={`${poppins.className} bg-[#070708] text-white`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
