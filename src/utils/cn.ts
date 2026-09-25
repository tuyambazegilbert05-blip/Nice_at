import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind and custom CSS class names safely without conflict.
 */
export function cn(...inputs: ClassValue[]): string {
  try {
    return twMerge(clsx(inputs))
  } catch {
    return clsx(inputs)
  }
}
