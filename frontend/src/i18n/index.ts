import { createContext, useContext, useState, useEffect, createElement } from 'react';
import type { ReactNode } from 'react';
import en from './locales/en.json';

// --- Types ---
export interface Language {
    code: string;
    name: string;
    flag: string;
}

export const LANGUAGES: Language[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

type TranslationDict = Record<string, string>;

const STORAGE_KEY = 'holalingo-lang';
const SUPPORTED_CODES = LANGUAGES.map((l) => l.code);

// --- Locale loading ---
const localeModules: Record<string, () => Promise<{ default: TranslationDict }>> = {
    es: () => import('./locales/es.json'),
    fr: () => import('./locales/fr.json'),
    ru: () => import('./locales/ru.json'),
};

// --- Context ---
interface LanguageContextValue {
    language: string;
    setLanguage: (code: string) => void;
    t: (key: string, vars?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): string {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && SUPPORTED_CODES.includes(stored)) return stored;
    } catch {
        // localStorage unavailable
    }
    return 'en';
}

// --- Provider (uses createElement instead of JSX so file can stay .ts) ---
export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState(getInitialLanguage);
    const [translations, setTranslations] = useState<TranslationDict>(en as TranslationDict);

    useEffect(() => {
        if (language === 'en') {
            setTranslations(en as TranslationDict);
            return;
        }
        const loader = localeModules[language];
        if (loader) {
            loader().then((mod) => setTranslations(mod.default as TranslationDict));
        }
    }, [language]);

    const setLanguage = (code: string) => {
        if (!SUPPORTED_CODES.includes(code)) return;
        setLanguageState(code);
        try {
            localStorage.setItem(STORAGE_KEY, code);
        } catch {
            // localStorage unavailable
        }
    };

    const t = (key: string, vars?: Record<string, string>): string => {
        let value = translations[key] ?? (en as TranslationDict)[key] ?? key;
        if (vars) {
            Object.entries(vars).forEach(([k, v]) => {
                value = value.replace(`{${k}}`, v);
            });
        }
        return value;
    };

    return createElement(
        LanguageContext.Provider,
        { value: { language, setLanguage, t } },
        children
    );
}

// --- Hook ---
export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
    return ctx;
}
