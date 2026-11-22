import type { MetadataRoute } from 'next';

// Lets learners add DoLearnn to their phone's home screen and open it like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DoLearnn',
    short_name: 'DoLearnn',
    description: 'Exam prep for JAMB, WAEC, NECO and Post-UTME. Know what to fix. Prove you fixed it.',
    start_url: '/student',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#044272',
    categories: ['education'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Practice', url: '/student/practice', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'The Daily', url: '/daily', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
