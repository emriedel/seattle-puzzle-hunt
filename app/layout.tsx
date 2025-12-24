import type { Metadata } from "next";
import { Caveat, Indie_Flower, Dancing_Script, Permanent_Marker } from "next/font/google";
import "./globals.css";

// Handwriting fonts for rich text
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-handwritten",
  display: "swap",
});

const indieFlower = Indie_Flower({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-handwritten-scrawl",
  display: "swap",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-handwritten-elegant",
  display: "swap",
});

const permanentMarker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-handwritten-graffiti",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Seattle Puzzle Hunt",
  description: "Explore Seattle through interactive puzzle hunts",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`antialiased ${caveat.variable} ${indieFlower.variable} ${dancingScript.variable} ${permanentMarker.variable}`}>
        {children}
      </body>
    </html>
  );
}
