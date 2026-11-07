import localFont from 'next/font/local';

/*
 * Every font the app uses, bundled with it instead of downloaded from Google
 * Fonts during the build, so a network hiccup can never fail a deploy.
 * All are open source (SIL Open Font License); the licences are in app/fonts.
 * Each file is a variable font covering every weight.
 */

/** Inter: the app's body text. */
export const inter = localFont({
  src: '../app/fonts/inter-latin-wght.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  fallback: ['system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
});

/** Montserrat: the brand typeface (logo wordmark and landing headings). */
export const montserrat = localFont({
  src: '../app/fonts/montserrat-latin-wght.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-display',
  fallback: ['Segoe UI', 'Arial', 'sans-serif'],
});

/** Fraunces: serif headlines on the sign-in / sign-up pages. */
export const frauncesAuth = localFont({
  src: [
    { path: '../app/fonts/fraunces-latin-wght.woff2', weight: '100 900', style: 'normal' },
    { path: '../app/fonts/fraunces-latin-wght-italic.woff2', weight: '100 900', style: 'italic' },
  ],
  display: 'swap',
  variable: '--f-serif',
  fallback: ['Georgia', 'serif'],
});

/** Fraunces: headlines on the public /practice page. */
export const frauncesPractice = localFont({
  src: [
    { path: '../app/fonts/fraunces-latin-wght.woff2', weight: '100 900', style: 'normal' },
    { path: '../app/fonts/fraunces-latin-wght-italic.woff2', weight: '100 900', style: 'italic' },
  ],
  display: 'swap',
  variable: '--practice-display',
  fallback: ['Georgia', 'serif'],
});

/** Manrope: body text on the public /practice page. */
export const manrope = localFont({
  src: '../app/fonts/manrope-latin-wght.woff2',
  weight: '200 800',
  style: 'normal',
  display: 'swap',
  variable: '--practice-body',
  fallback: ['Segoe UI', 'Arial', 'sans-serif'],
});
