import type { Metadata } from 'next';
import { Suspense } from 'react';
import ShopCatalog from '@/components/shop/ShopCatalog';

export const metadata: Metadata = {
  title: 'Pneu a disky | E-shop',
  description: 'Prodej prověřených pneumatik a disků se zárukou. Osobní odběr na provozovně, možnost přezutí i zaslání poštou.',
};

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopCatalog />
    </Suspense>
  );
}
