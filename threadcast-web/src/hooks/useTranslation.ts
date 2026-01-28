import { useCallback } from 'react';
import { useUIStore } from '../stores/uiStore';
import { translations, getNestedValue, interpolate, type TranslationKey } from '../locales';

export function useTranslation() {
  const language = useUIStore((state) => state.language);
  const setLanguage = useUIStore((state) => state.setLanguage);

  const t = useCallback(
    (key: TranslationKey | string, params?: Record<string, string | number>): string => {
      const translation = getNestedValue(translations[language], key);
      return interpolate(translation, params);
    },
    [language]
  );

  return {
    t,
    language,
    setLanguage,
  };
}
