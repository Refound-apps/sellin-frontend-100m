import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { getRequestHost, isTenantHost } from "@/lib/prodejomat/host";
import { buildProdejomatMetadata, prodejomatViewport } from "@/lib/prodejomat/seo";
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

export const viewport: Viewport = prodejomatViewport;

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const shopDomainHeader = headersList.get('x-shop-domain');
  const host = await getRequestHost();

  if (!isTenantHost(host, shopDomainHeader)) {
    return buildProdejomatMetadata({ host });
  }

  try {
    const shop = await resolveShopFromRequest();
    if (!shop) {
      return buildProdejomatMetadata({ host });
    }
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
    };
  } catch {
    return buildProdejomatMetadata({ host });
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const shopDomainHeader = headersList.get('x-shop-domain');
  const host = await getRequestHost();
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
