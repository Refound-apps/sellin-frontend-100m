import type { Metadata } from 'next';
import { buildProdejomatMetadata } from '@/lib/prodejomat/seo';

export const metadata: Metadata = buildProdejomatMetadata({
  path: '/create',
  title: 'Nová nabídka',
  description: 'Vytvoření nové nabídky a inzerce v Prodejomatu.',
  noIndex: true,
});

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
