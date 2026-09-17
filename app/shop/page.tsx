import type { Metadata } from 'next';
import { Suspense } from 'react';
import ShopCatalog from '@/components/shop/ShopCatalog';

export const metadata: Metadata = {
  title: 'Pneu a disky Plzeň | Duplux',
  description: 'Rodinný prodej pneu a disků v Plzni. Osobní odběr Plzeň Jih, domluva po telefonu.',
};

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopCatalog />
    </Suspense>
  );
}
