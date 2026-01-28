import { ko, type TranslationKeys } from './ko';
import { en } from './en';

export type { TranslationKeys };
export type Language = 'ko' | 'en';

export const translations: Record<Language, TranslationKeys> = {
  ko,
  en,
};

// Type-safe nested key accessor
type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}` | K
        : K;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<TranslationKeys>;

// Get nested value from object using dot notation
export function getNestedValue<T>(obj: T, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // Return the key if not found
    }
  }

  return typeof current === 'string' ? current : path;
}

// Interpolate variables in translation string
export function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;

  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return params[key]?.toString() ?? `{{${key}}}`;
  });
}
