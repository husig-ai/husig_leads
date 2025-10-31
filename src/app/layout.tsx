import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HuSig Lead Management - AI & Data Solutions",
  description:
    "Comprehensive lead management platform for HuSig's AI and data solution prospects",
  keywords:
    "lead management, AI solutions, data analytics, HuSig, CRM, B2B leads",
  authors: [{ name: "HuSig.ai" }],
  robots: "index, follow",
  openGraph: {
    title: "HuSig Lead Management",
    description: "Data, LLM & AI Solutions at Scale",
    type: "website",
    siteName: "HuSig",
  },
};

export const viewport = "width=device-width, initial-scale=1";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0ea5e9" />
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
