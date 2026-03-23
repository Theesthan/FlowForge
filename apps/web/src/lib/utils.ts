import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS class names with conflict resolution.
 * Use this for all className composition — never raw template literals.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
