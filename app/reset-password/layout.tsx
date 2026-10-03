import type { Metadata } from 'next';
import { buildProdejomatMetadata } from '@/lib/prodejomat/seo';

export const metadata: Metadata = buildProdejomatMetadata({
  path: '/reset-password',
  title: 'Obnova hesla',
  description: 'Nastavení nového hesla k účtu Prodejomat.',
  noIndex: true,
});

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
