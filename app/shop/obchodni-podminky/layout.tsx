import type { Metadata } from 'next';
import { generateShopStaticMetadata } from '@/lib/shop/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return generateShopStaticMetadata('obchodni-podminky');
}

export default function ObchodniPodminkyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
