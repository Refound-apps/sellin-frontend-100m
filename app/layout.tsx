import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sellin.cz - Správa nabídek",
  description: "Moderní rozhraní pro správu vašich nabídek na bazarech",
};

const MAIN_DOMAINS = new Set([
  'sellin.cz',
  'www.sellin.cz',
  'app.sellin.cz',
  'bazar.sellin.cz',
  'stage.sellin.cz',
  'dev.sellin.cz',
  'prodejomat.cz',
  'www.prodejomat.cz',
  'app.prodejomat.cz',
  'bazar.prodejomat.cz',
  'stage.prodejomat.cz',
  'dev.prodejomat.cz',
  'localhost',
  '127.0.0.1',
]);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const shopDomainHeader = headersList.get('x-shop-domain');
  const rawHost = headersList.get('x-forwarded-host') || headersList.get('host') || '';
  const host = rawHost.toLowerCase().split(':')[0].trim();

  let isTenant = Boolean(shopDomainHeader);
  if (!isTenant && host) {
    if (host.includes('.localhost')) {
      isTenant = true;
    } else if (host.endsWith('.sellin.cz')) {
      const subdomain = host.replace('.sellin.cz', '');
      if (!['app', 'www', 'stage', 'dev', 'bazar'].includes(subdomain)) {
        isTenant = true;
      }
    } else if (host.endsWith('.prodejomat.cz')) {
      const subdomain = host.replace('.prodejomat.cz', '');
      if (!['app', 'www', 'stage', 'dev', 'bazar'].includes(subdomain)) {
        isTenant = true;
      }
    } else if (!MAIN_DOMAINS.has(host) && !host.endsWith('.vercel.app')) {
      isTenant = true;
    }
  }

  return (
    <html
      lang="cs"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[hsl(210_28%_97%)] font-sans text-[hsl(222_47%_11%)]">
        {!isTenant && <Navigation />}
        {children}
      </body>
    </html>
  );
}
