import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** If url is an Amazon product image with a small size (e.g. _AC_SS115_, _AC_SX60_), return URL with larger size (_AC_SL1500_) for display. */
export function amazonImageUrlToLarge(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return url ?? null
  if (!url.includes('media-amazon.com/images/')) return url
  return url.replace(/\._AC_[A-Z]{2}\d+_\./g, '._AC_SL1500_.').split('?')[0]
}
