const path = require('path');

const apiOrigin = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'development'
          ? 'http://localhost:4000/api'
          : 'https://dolearnn-backend-oi4r.onrender.com/api'),
    ).origin;
  } catch {
    return process.env.NODE_ENV === 'development'
      ? 'http://localhost:4000'
      : 'https://dolearnn-backend-oi4r.onrender.com';
  }
})();

const csp = [
  "default-src 'self'",   
  "base-uri 'self'",  
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''} https://accounts.google.com/gsi/client`,
  `connect-src 'self' ${apiOrigin} https://accounts.google.com https://oauth2.googleapis.com`,
  "frame-src 'self' https://accounts.google.com",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  outputFileTracingRoot: path.join(__dirname),
  // The parent workspace (/family) merged into the single learner account.
  // Old links (bookmarks, emails, shared Arena codes) land on the same page there.
  async redirects() {
    return [
      // The public warm-up became the Daily; shared links keep working.
      { source: '/practice', destination: '/daily', permanent: true },
      { source: '/family/quiz/:path*', destination: '/student/practice/:path*', permanent: true },
      { source: '/family/quiz', destination: '/student/practice', permanent: true },
      { source: '/family/children/:path*', destination: '/student/tutor', permanent: true },
      { source: '/family/children', destination: '/student/tutor', permanent: true },
      { source: '/family/learning', destination: '/student', permanent: true },
      { source: '/family/:path*', destination: '/student/:path*', permanent: true },
      { source: '/family', destination: '/student', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
