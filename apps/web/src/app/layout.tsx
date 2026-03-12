import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "../index.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Providers from "@/components/providers";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://www.myeasypos.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "EasyPOS — Simple Point of Sale for Zimbabwean Businesses",
    template: "%s | EasyPOS",
  },
  description:
    "EasyPOS is a mobile-first point-of-sale app built for Zimbabwean businesses of all sizes. Manage sales, inventory, team, and receipts — no training needed.",
  keywords: [
    "POS Zimbabwe",
    "point of sale Zimbabwe",
    "EasyPOS",
    "small business POS",
    "inventory management Zimbabwe",
    "sales tracking app",
    "mobile POS app",
    "Zimbabwe business app",
    "receipt app Zimbabwe",
    "EcoCash POS",
  ],
  authors: [{ name: "Kin Leon Zinzombe", url: siteUrl }],
  creator: "Kin Leon Zinzombe",
  publisher: "EasyPOS",
  openGraph: {
    type: "website",
    locale: "en_ZW",
    url: siteUrl,
    siteName: "EasyPOS",
    title: "EasyPOS — Simple Point of Sale for Zimbabwean Businesses",
    description:
      "A mobile POS app built for Zimbabwean businesses. No training needed, no expensive hardware. Just download and start selling.",
    images: [
      {
        url: "/screenshots/dashboard/dashboard-home.jpg",
        width: 1080,
        height: 2340,
        alt: "EasyPOS dashboard showing daily sales and business metrics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EasyPOS — Simple Point of Sale for Zimbabwean Businesses",
    description:
      "A mobile POS app built for Zimbabwean businesses. No training needed, no expensive hardware. Just download and start selling.",
    images: ["/screenshots/dashboard/dashboard-home.jpg"],
    creator: "@kinzinzombe",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="EasyPOS" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          <div className="flex min-h-svh flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
