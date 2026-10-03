import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { buildShopPageMetadata, getShopHomeMetadata } from "@/lib/shop/seo";
import { resolveShopFromRequest } from "@/lib/shop/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

const DEFAULT_METADATA: Metadata = {
  title: {
    default: "Prodejomat.cz - Automat na inzerci a prodej",
    template: "%s | Prodejomat.cz",
  },
  description: "Centrální sklad a automatická inzerce nabídek na Bazoš, Sbazar i vlastní e-shopy pro prodejce",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
};

function isTenantHost(host: string, shopDomainHeader: string | null): boolean {
  if (shopDomainHeader) return true;
  if (!host) return false;
  if (host.includes('.localhost')) return true;
  if (host.endsWith('.sellin.cz')) {
    const subdomain = host.replace('.sellin.cz', '');
    return !['app', 'www', 'stage', 'dev', 'bazar'].includes(subdomain);
  }
  if (host.endsWith('.prodejomat.cz')) {
    const subdomain = host.replace('.prodejomat.cz', '');
    return !['app', 'www', 'stage', 'dev', 'bazar'].includes(subdomain);
  }
  return !MAIN_DOMAINS.has(host) && !host.endsWith('.vercel.app');
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const shopDomainHeader = headersList.get('x-shop-domain');
  const rawHost = headersList.get('x-forwarded-host') || headersList.get('host') || '';
  const host = rawHost.toLowerCase().split(':')[0].trim();

  if (!isTenantHost(host, shopDomainHeader)) {
    return DEFAULT_METADATA;
  }

  try {
    const shop = await resolveShopFromRequest();
    const home = getShopHomeMetadata(shop);
    return {
      ...buildShopPageMetadata(shop, {
        title: home.title,
        description: home.description,
        path: '/',
      }),
      title: {
        default: home.title,
        template: `%s | ${shop.shop_name || 'E-shop'}`,
      },
      icons: DEFAULT_METADATA.icons,
    };
  } catch {
    return DEFAULT_METADATA;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const shopDomainHeader = headersList.get('x-shop-domain');
  const rawHost = headersList.get('x-forwarded-host') || headersList.get('host') || '';
  const host = rawHost.toLowerCase().split(':')[0].trim();
  const isTenant = isTenantHost(host, shopDomainHeader);

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
