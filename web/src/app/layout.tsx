import type { Metadata } from "next";
import { Inter, League_Spartan } from "next/font/google";
import "@/styles/globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/Footer";

// Le decimos a Next.js que no intente compilar esto estáticamente
export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spartan = League_Spartan({ subsets: ["latin"], variable: "--font-spartan", display: "swap" });

export const metadata: Metadata = {
  title: "American Way | Delivery & Menú",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${spartan.variable}`}>
      <body className="antialiased min-h-screen flex flex-col bg-[#121212]">
        <Header />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}