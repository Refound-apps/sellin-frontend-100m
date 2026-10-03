import type { MetadataRoute } from 'next';
import { PRODEJOMAT_DESCRIPTION, PRODEJOMAT_NAME, PRODEJOMAT_TAGLINE } from '@/lib/prodejomat/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${PRODEJOMAT_NAME} – ${PRODEJOMAT_TAGLINE}`,
    short_name: 'Prodejomat',
    description: PRODEJOMAT_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#020617',
    lang: 'cs',
    dir: 'ltr',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
