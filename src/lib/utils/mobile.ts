/**
 * Mobile optimization utilities
 */

// Check if device is mobile (client-side only)
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

// Touch-friendly button classes
export const touchTarget = "min-h-[44px] min-w-[44px]";

// Responsive text sizes
export const responsiveText = {
  xs: "text-xs sm:text-sm",
  sm: "text-sm sm:text-base",
  base: "text-base sm:text-lg",
  lg: "text-lg sm:text-xl",
  xl: "text-xl sm:text-2xl",
  "2xl": "text-2xl sm:text-3xl",
  "3xl": "text-3xl sm:text-4xl",
};

// Responsive spacing
export const responsivePadding = {
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-6",
  lg: "p-6 sm:p-8",
};

// Responsive grid
export const responsiveGrid = {
  "2col": "grid-cols-1 sm:grid-cols-2",
  "3col": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "4col": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};
