# Implementation Plan: Multilanguage UI

**Branch**: `002-multilanguage-ui` | **Date**: 2026-03-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-multilanguage-ui/spec.md`

## Summary

Add a multilanguage UI system to the Spanish Tutor Platform. A flag emoji language selector in the top navigation bar allows students to switch all platform interface text between English (default), Spanish, French, and Russian. Translations are pre-written and bundled as static JSON files. Language preference is persisted in localStorage.

## Technical Context

**Language/Version**: TypeScript (React frontend), Python 3.x (backend — no changes required)
**Primary Dependencies**: React, react-router-dom, Vite, Tailwind CSS v4
**Storage**: localStorage (browser-side persistence only — no database changes)
**Testing**: Manual verification across all pages and languages
**Target Platform**: Web (desktop + mobile browsers)
**Project Type**: Web application (frontend-only feature)
**Performance Goals**: Language switch must feel instant (<100ms re-render, no page reload)
**Constraints**: All translations bundled as static JSON — no external API calls
**Scale/Scope**: 4 languages × ~80 UI strings ≈ 320 translation entries across 6 pages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | ✅ Pass | Language switch is a single click. No login required. Selector is always visible in navbar. |
| II. Teacher-First Design | ✅ Pass | No impact — teacher-authored content is not translated. Teacher workflow unchanged. |
| III. Student Learning Focus | ✅ Pass | Multilanguage UI removes language barriers for international students. |
| IV. Mobile-First & Performance | ✅ Pass | Flag emoji dropdown works on mobile. No network calls — translations are bundled. Page loads unaffected. |
| V. Maintainable & Open Code | ✅ Pass | Translation files are simple JSON key-value pairs. Adding a new language means adding one JSON file. |

**Gate Decision**: ✅ All principles pass. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-multilanguage-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A — no API changes)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── i18n/
│   │   ├── index.ts              # i18n context provider, hook, and utilities
│   │   └── locales/
│   │       ├── en.json           # English translations (default/reference)
│   │       ├── es.json           # Spanish translations
│   │       ├── fr.json           # French translations
│   │       └── ru.json           # Russian translations
│   ├── components/
│   │   ├── LanguageSelector.tsx  # Flag emoji dropdown component (new)
│   │   └── ... (existing)
│   ├── pages/
│   │   └── ... (existing — updated to use translation keys)
│   └── App.tsx                   # Wrap with LanguageProvider
```

**Structure Decision**: Frontend-only feature. New `i18n/` directory holds the language context, hook, and locale JSON files. All existing pages are updated to reference translation keys instead of hardcoded English strings. No backend changes.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
