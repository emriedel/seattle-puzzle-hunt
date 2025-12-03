import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seattle Puzzle Hunt",
  description: "Explore Seattle through interactive puzzle hunts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
