import { useState, useRef, useEffect } from 'react';
import { useLanguage, LANGUAGES } from '../i18n';

const LanguageSelector = () => {
    const { language, setLanguage } = useLanguage();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false);
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((prev) => !prev);
        }
    };

    const handleSelect = (code: string) => {
        setLanguage(code);
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((prev) => !prev)}
                onKeyDown={handleKeyDown}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors text-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
                aria-label="Select language"
                aria-expanded={open}
                aria-haspopup="listbox"
            >
                <span className="text-xl">{current.flag}</span>
                <svg
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div
                    className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[9999] animate-[fadeIn_0.15s_ease-out]"
                    role="listbox"
                    aria-label="Language options"
                >
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleSelect(lang.code)}
                            role="option"
                            aria-selected={lang.code === language}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${lang.code === language
                                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                                    : 'text-gray-700 hover:bg-gray-50 font-medium'
                                }`}
                        >
                            <span className="text-xl">{lang.flag}</span>
                            <span className="text-sm">{lang.name}</span>
                            {lang.code === language && (
                                <span className="ml-auto text-indigo-500 text-xs">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
