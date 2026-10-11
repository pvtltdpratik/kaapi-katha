import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Noto_Serif_Devanagari } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz"],
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
  themeColor: "#14100d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${fraunces.variable} ${devanagari.variable} bg-[#14100d] text-[#efe6d6] antialiased`}
        suppressHydrationWarning
      >
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
