// One look for the toggle pills in the quiz dialogs (subject chips, question
// counts), so a brand or dark-mode change is made in one place.
export const selectedPill =
  'border-brand bg-brand text-white dark:border-accent2-500 dark:bg-accent2-500 dark:text-brand';
export const idlePill =
  'border-gray-200 bg-white text-gray-700 hover:border-brand/50 dark:border-border dark:bg-card dark:text-foreground';

// Quiz set-up dialogs open as a bottom sheet on phones, where a thumb can reach
// the Start button, and as a centred card on larger screens.
export const sheetContent =
  'max-sm:inset-x-0 max-sm:bottom-0 max-sm:left-0 max-sm:top-auto max-sm:max-h-[92vh] max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-[28px] max-sm:border-x-0 max-sm:border-b-0 max-sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=open]:slide-in-from-left-0 max-sm:data-[state=closed]:slide-out-to-left-0 max-sm:data-[state=open]:zoom-in-100 max-sm:data-[state=closed]:zoom-out-100 sm:rounded-3xl';

// The Start button stays visible at the bottom of a long sheet.
export const stickyFooter =
  'sticky -bottom-6 -mx-6 -mb-6 mt-2 border-t border-gray-100 bg-background/95 px-6 py-4 backdrop-blur dark:border-border max-sm:-mb-[calc(1.5rem+env(safe-area-inset-bottom))] max-sm:pb-[calc(1rem+env(safe-area-inset-bottom))]';
