import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Inter, Noto_Serif_Devanagari } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";
import "./puppy.css";

/*
 * Brand typeface. To change it, drop a new file in src/fonts and edit `src`
 * (and `weight` if it ships more than Regular). Everything that uses
 * `.display` follows automatically.
 */
const brand = localFont({
  src: "../fonts/NgeticModern-Regular.otf",
  variable: "--font-brand",
  weight: "400",
  display: "swap",
});

const devanagari = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  weight: ["400"],
  variable: "--font-deva",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Kaapi Katha — A little more India in every pour",
  description:
    "A fictional filter-coffee café, built as an interactive 3D web experience by Pratik Prashant Kolhe.",
  authors: [{ name: "Pratik Prashant Kolhe" }],
  creator: "Pratik Prashant Kolhe",
};

export const viewport: Viewport = {
  themeColor: "#9e2b21",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${brand.variable} ${devanagari.variable} bg-espresso text-cream antialiased`}
        suppressHydrationWarning
      >
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
