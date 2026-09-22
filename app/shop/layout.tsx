import { Suspense } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ShopProvider } from '@/components/shop/ShopContext';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-jakarta',
});

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${jakarta.variable} ${jakarta.className} shop-theme min-h-screen bg-white`}>
      <Suspense fallback={null}>
        <ShopProvider>{children}</ShopProvider>
      </Suspense>
    </div>
  );
}
