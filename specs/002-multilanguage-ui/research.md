# Research: Multilanguage UI

**Feature**: 002-multilanguage-ui
**Date**: 2026-03-09

## Decision 1: i18n Approach

**Decision**: Custom lightweight React Context + JSON files (no external library).

**Rationale**: The scope is small (4 languages, ~80 keys). A custom `LanguageContext` with `useLanguage()` hook is simpler, has zero bundle size overhead, and avoids the complexity of full i18n libraries (react-i18next, react-intl) which are designed for much larger translation sets with features like pluralization, interpolation, and ICU message format that we don't need.

**Alternatives considered**:
- `react-i18next`: Full-featured but overkill for 4 languages × 80 keys. Adds ~15KB gzipped.
- `react-intl` (FormatJS): Even heavier, designed for complex ICU formatting.
- `next-intl`: Next.js specific, not applicable (Vite project).

## Decision 2: Translation File Format

**Decision**: Flat JSON key-value pairs with dot-notation namespacing.

**Rationale**: Flat JSON is the simplest format to author, review, and load. Dot-notation keys (e.g., `"landing.hero.title"`) provide logical grouping without nested objects, making lookups a single property access.

**Alternatives considered**:
- Nested JSON objects: Slightly more readable but requires recursive lookup logic.
- YAML: Needs a parser dependency. No benefit for simple key-value pairs.

## Decision 3: Language Persistence

**Decision**: `localStorage` with key `holalingo-lang`.

**Rationale**: localStorage is synchronous (no flash of wrong language on load), persists across sessions, and requires zero backend changes. The stored value is the language code (`en`, `es`, `fr`, `ru`).

**Alternatives considered**:
- Cookies: Unnecessary server-side visibility. Adds HTTP overhead.
- URL parameter (`?lang=es`): Good for shareability but adds complexity; not requested.
- Backend user preference: Requires auth system. Overkill for MVP.

## Decision 4: Translation Key Extraction Strategy

**Decision**: Manually extract all hardcoded English strings from each page/component and convert them to translation keys.

**Rationale**: With only 6 pages and ~5 components, manual extraction is faster and more accurate than automated tools. Each page's strings are grouped under a namespace (e.g., `landing.*`, `profile.*`, `booking.*`).

**Alternatives considered**:
- Automated string extraction tools: Require additional tooling setup for a small codebase.
- Gradual migration: Could leave inconsistent half-translated pages.

## Decision 5: Flag Emoji Rendering

**Decision**: Use Unicode flag emoji characters directly in JSX.

**Rationale**: Flag emoji are universally supported on modern browsers and operating systems (Windows 10+, macOS, iOS, Android, Linux with Noto Color Emoji). No image assets or SVG flags needed; they render natively.

**Alternatives considered**:
- SVG flag icons: Adds asset management complexity. Unnecessary for 4 flags.
- CSS flag sprites: Outdated technique. Poor DX.
