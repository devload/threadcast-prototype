import { Modal } from '../feedback/Modal';
import { useTranslation } from '../../hooks/useTranslation';
import { useUIStore, type Language } from '../../stores/uiStore';
import { clsx } from 'clsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useUIStore();

  const languageOptions: { value: Language; label: string; flag: string }[] = [
    { value: 'ko', label: t('settings.languageKo'), flag: '🇰🇷' },
    { value: 'en', label: t('settings.languageEn'), flag: '🇺🇸' },
  ];

  const themeOptions: { value: 'light' | 'dark' | 'system'; label: string; icon: string }[] = [
    { value: 'light', label: t('settings.themeLight'), icon: '☀️' },
    { value: 'dark', label: t('settings.themeDark'), icon: '🌙' },
    { value: 'system', label: t('settings.themeSystem'), icon: '💻' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('settings.title')}
      size="sm"
    >
      <div className="space-y-6">
        {/* Language Setting */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            {t('settings.language')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {languageOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setLanguage(option.value)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
                  language === option.value
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-300'
                )}
              >
                <span className="text-xl">{option.flag}</span>
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme Setting */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            {t('settings.theme')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={clsx(
                  'flex flex-col items-center gap-1 px-3 py-3 rounded-lg border-2 transition-all',
                  theme === option.value
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-300'
                )}
              >
                <span className="text-lg">{option.icon}</span>
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
