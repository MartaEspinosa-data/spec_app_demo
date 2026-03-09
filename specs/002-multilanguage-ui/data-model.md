# Data Model: Multilanguage UI

**Feature**: 002-multilanguage-ui
**Date**: 2026-03-09

## Overview

This feature is frontend-only. No database entities are added or modified. All data structures exist in the React application's runtime memory and in static JSON files.

## Entities

### Language

Represents a supported display language in the platform.

| Field | Type | Description |
|-------|------|-------------|
| code | string | ISO 639-1 language code: `en`, `es`, `fr`, `ru` |
| name | string | Native name: "English", "Español", "Français", "Русский" |
| flag | string | Unicode flag emoji: 🇬🇧, 🇪🇸, 🇫🇷, 🇷🇺 |

**Lifecycle**: Static. Languages are defined as a constant array in the i18n module. No CRUD operations.

### Translation Dictionary

A flat JSON object mapping translation keys to translated strings for one language.

| Field | Type | Description |
|-------|------|-------------|
| key | string | Dot-notation namespaced key, e.g., `landing.hero.title` |
| value | string | Translated string in the target language |

**Storage**: One JSON file per language (`en.json`, `es.json`, `fr.json`, `ru.json`) in `frontend/src/i18n/locales/`.

**Key Namespaces**:
- `nav.*` — Navigation bar labels
- `landing.*` — Landing page content
- `profile.*` — Teacher profile page
- `booking.*` — Booking page
- `dashboard.*` — Student dashboard
- `payment.*` — Payment success/cancel pages
- `notfound.*` — 404 page
- `common.*` — Shared labels (e.g., "Back", "Loading...", "Error")

### User Language Preference

The currently selected language, stored client-side.

| Field | Type | Description |
|-------|------|-------------|
| holalingo-lang | string | Language code stored in localStorage |

**Default**: `en` (English) when no preference exists.
**Validation**: On load, if stored value is not in the supported list (`en`, `es`, `fr`, `ru`), reset to `en`.

## Relationships

```text
LanguageSelector → reads → LANGUAGES constant (list of Language objects)
LanguageSelector → writes → localStorage ("holalingo-lang")
LanguageProvider → reads → localStorage ("holalingo-lang")
LanguageProvider → loads → Translation Dictionary (JSON file for active language)
Pages/Components → consume → LanguageProvider via useLanguage() hook
```

## No Backend Changes

This feature does not modify:
- Database schema (no new tables or columns)
- API endpoints (no new routes or response formats)
- Backend models or services
