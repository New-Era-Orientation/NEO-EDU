import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NEO EDU | Learning Management System",
  description: "Self-hosted, offline-first Learning Management System. Free and open source.",
  keywords: ["LMS", "education", "learning", "courses", "offline-first", "PWA"],
  authors: [{ name: "NEO EDU Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NEO EDU",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "NEO EDU",
    title: "NEO EDU | Learning Management System",
    description: "Self-hosted, offline-first Learning Management System",
    images: [
      {
        url: "/assets/logo.png",
        width: 512,
        height: 512,
        alt: "NEO EDU Logo",
      },
    ],
  },
  icons: {
    icon: "/assets/logo.png",
    shortcut: "/assets/logo.png",
    apple: "/assets/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/assets/logo.png" />
        <link rel="apple-touch-icon" href="/assets/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
