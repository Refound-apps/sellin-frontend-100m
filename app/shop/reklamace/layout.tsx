import type { Metadata } from 'next';
import { generateShopStaticMetadata } from '@/lib/shop/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return generateShopStaticMetadata('reklamace');
}

export default function ReklamaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
