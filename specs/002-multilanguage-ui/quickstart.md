# Quickstart: Multilanguage UI

**Feature**: 002-multilanguage-ui

## What This Feature Does

Adds a language selector (flag emoji dropdown) to the platform header. Students can switch the entire interface between English, Spanish, French, and Russian. The preference is saved in the browser.

## How It Works

1. A `LanguageProvider` React context wraps the entire app.
2. The `useLanguage()` hook provides `t()` (translate function) and `setLanguage()` to any component.
3. Translation strings are stored in `frontend/src/i18n/locales/{en,es,fr,ru}.json`.
4. The `LanguageSelector` component renders a flag emoji in the navbar; clicking it opens a dropdown.
5. Language preference is persisted in `localStorage` under key `holalingo-lang`.

## Adding a New Translation Key

1. Add the key to `en.json` first (reference file).
2. Add the same key with translated values to `es.json`, `fr.json`, and `ru.json`.
3. Use `t('your.key.name')` in your component via the `useLanguage()` hook.

## Adding a New Language

1. Create a new JSON file in `frontend/src/i18n/locales/` (e.g., `de.json`).
2. Add the language to the `LANGUAGES` array in `frontend/src/i18n/index.ts`.
3. Translate all existing keys into the new language.

## Files Modified/Created

| File | Change |
|------|--------|
| `frontend/src/i18n/index.ts` | New — Language context, provider, hook |
| `frontend/src/i18n/locales/en.json` | New — English translations |
| `frontend/src/i18n/locales/es.json` | New — Spanish translations |
| `frontend/src/i18n/locales/fr.json` | New — French translations |
| `frontend/src/i18n/locales/ru.json` | New — Russian translations |
| `frontend/src/components/LanguageSelector.tsx` | New — Flag dropdown component |
| `frontend/src/App.tsx` | Modified — Wrap with LanguageProvider |
| `frontend/src/pages/*.tsx` | Modified — Replace hardcoded strings with `t()` calls |
| `frontend/src/components/TeacherProfile.tsx` | Modified — Replace hardcoded labels with `t()` calls |
