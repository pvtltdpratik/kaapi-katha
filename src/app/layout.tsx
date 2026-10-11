import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Space_Mono, Noto_Serif_Devanagari } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz"],
});

const devanagari = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600"],
  variable: "--font-deva",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Kaapi Katha — A Little More India in Every Pour",
  description:
    "An interactive 3D coffee experience: filter kaapi, steel tumblers and café rituals, reimagined for today. A creative project by Pratik Prashant Kolhe.",
  keywords: [
    "filter coffee",
    "kaapi",
    "Indian café",
    "specialty coffee",
    "3D website",
    "Three.js",
    "Next.js",
  ],
  authors: [{ name: "Pratik Prashant Kolhe" }],
  creator: "Pratik Prashant Kolhe",
};

export const viewport: Viewport = {
  themeColor: "#120C09",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${fraunces.variable} ${devanagari.variable} ${spaceMono.variable} bg-[#120C09] text-white antialiased`}
        suppressHydrationWarning
      >
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
