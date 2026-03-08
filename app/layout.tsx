import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Karataş Oto - Servis Takip",
  description: "Karataş Oto Servis Takip Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "14px",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            },
          }}
        />
      </body>
    </html>
  );
}
