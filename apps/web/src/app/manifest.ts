import type { MetadataRoute } from 'next';

// Lets people add the site to their phone's home screen ("Add to Home Screen"
// on iPhone, "Install app" on Android). It then opens full-screen, without the
// browser's address bar, under the name and icon below.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Click up CISS',
    short_name: 'Click up CISS',
    description: 'CISS task management',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
