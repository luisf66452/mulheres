import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rose',
    short_name: 'Rose',
    description:
      'Um ritual diário de 5 minutos para autoestima, imagem corporal e relação com a comida.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FBF6F0',
    theme_color: '#FBF6F0',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
