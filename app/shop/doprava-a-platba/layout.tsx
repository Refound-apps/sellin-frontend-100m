import type { Metadata } from 'next';
import { generateShopStaticMetadata } from '@/lib/shop/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return generateShopStaticMetadata('doprava-a-platba');
}

export default function DopravaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
