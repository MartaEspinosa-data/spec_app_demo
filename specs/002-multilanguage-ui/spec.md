# Feature Specification: Multilanguage UI

**Feature Branch**: `002-multilanguage-ui`  
**Created**: 2026-03-09  
**Status**: Draft  
**Input**: User description: "Multilanguage system with language selector for English, Spanish, French, and Russian so students can choose between different languages"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select Display Language (Priority: P1)

A student visits the platform and sees a language icon (globe/word symbol) in the top navigation bar. They click it and a dropdown appears showing four language options: English, Spanish, French, and Russian. Upon selecting a language, all interface text (headings, buttons, labels, descriptions) immediately updates to the chosen language without a page reload.

**Why this priority**: This is the core interaction — without a functional language selector, the feature does not exist. It unlocks the entire multilanguage experience for international students.

**Independent Test**: Can be fully tested by clicking the language icon, selecting a language, and verifying that all visible interface text changes to the selected language instantly.

**Acceptance Scenarios**:

1. **Given** the student is on any page, **When** they click the current language flag emoji in the header, **Then** a dropdown/popover appears showing English, Spanish, French, and Russian with their flag emojis (🇬🇧/🇪🇸/🇫🇷/🇷🇺) and native names.
2. **Given** the language dropdown is open, **When** the student selects "Français", **Then** all interface labels, headings, and button text update to French immediately without page reload.
3. **Given** the student has not selected a language (first visit), **When** the page loads, **Then** the default language is English.

---

### User Story 2 - Persist Language Preference (Priority: P2)

Once a student selects a language, the platform remembers their choice. When they return to the site later (new session or browser refresh), the interface is displayed in the language they previously selected.

**Why this priority**: Without persistence, students would need to re-select their language every visit, creating unnecessary friction. This is a "quality of life" enhancement that builds on the core selector.

**Independent Test**: Can be tested by selecting a language preference, closing the browser, reopening the site, and verifying the previously chosen language is still active.

**Acceptance Scenarios**:

1. **Given** the student selects Russian as their language, **When** they close and reopen the browser, **Then** the interface loads in Russian automatically.
2. **Given** the student clears their browser data, **When** they visit the site, **Then** the interface defaults back to English.

---

### User Story 3 - Localized Content Completeness (Priority: P3)

All user-facing text across every page — Landing Page, Profile Page, Booking Page, Dashboard, Payment Status pages, and the 404 page — must be fully translated into each supported language. No English text should "leak" through when a non-English language is selected.

**Why this priority**: Partial translations create an unprofessional and confusing experience. Complete translation coverage ensures the product feels polished in every language.

**Independent Test**: Can be tested by switching to each non-English language and navigating through all pages, verifying no untranslated English labels appear.

**Acceptance Scenarios**:

1. **Given** the student selects Spanish, **When** they navigate from the Landing Page through to the Dashboard, **Then** all interface text on every page is displayed in Spanish.
2. **Given** the student is viewing a page in French, **When** they navigate to a different page, **Then** the new page also renders entirely in French.

---

### Edge Cases

- What happens when a student navigates to a page and their stored language preference refers to a language that has been removed from the supported list? → System falls back to English.
- How does the system handle content from the teacher (bio, lesson notes) which is authored in one language? → Teacher-generated content is NOT translated; only platform UI labels are translated. Teacher content remains in its original language.
- What happens if a translation string is missing for a specific key? → The system falls back to the English translation for that specific key.
- How does the language selector behave on mobile? → The dropdown should be touch-friendly with adequately sized tap targets.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a language selector as a flag emoji (🇬🇧/🇪🇸/🇫🇷/🇷🇺) of the currently active language in the top navigation bar, visible on all pages. Clicking it opens a dropdown showing all four languages with their flag emoji and native name.
- **FR-002**: System MUST support exactly four languages: English (default), Spanish, French, and Russian.
- **FR-003**: Each language option MUST display its flag emoji followed by the language name in its native script (e.g., "🇪🇸 Español", "🇫🇷 Français", "🇷🇺 Русский").
- **FR-004**: Selecting a language MUST update all platform UI text instantly without requiring a page reload or navigation.
- **FR-005**: System MUST persist the selected language preference in the user's browser across sessions.
- **FR-006**: System MUST fall back to English when a stored language preference is invalid or unavailable.
- **FR-007**: System MUST translate all user-facing platform text including headers, labels, buttons, placeholders, and status messages.
- **FR-008**: Teacher-authored content (bios, lesson notes) MUST NOT be translated — it remains in its original language.
- **FR-009**: The language selector dropdown MUST be accessible via keyboard navigation and screen readers.
- **FR-010**: The language selector MUST function correctly on both desktop and mobile viewports.

### Key Entities

- **Language**: A supported display language, identified by a code (en, es, fr, ru), with a native name and optional flag/icon.
- **Translation Dictionary**: A collection of key-value pairs mapping interface text keys to their translated values, organized per language.
- **User Language Preference**: The currently active language setting, stored locally in the user's browser.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch the interface language in under 3 seconds (click icon → select language → see updated text).
- **SC-002**: 100% of platform UI labels are translated across all four languages with no English text leaking through when a non-English language is selected.
- **SC-003**: Language preference persists across browser sessions — a returning user sees the site in their last-selected language 100% of the time.
- **SC-004**: The language selector is accessible via keyboard (Tab → Enter) and works on both desktop and mobile viewports.
- **SC-005**: Switching language does not cause a page reload, flicker, or visible layout shift.

## Assumptions

- The multilanguage system applies to **platform UI text only** — not to teacher-authored content or dynamic data from the backend.
- Language persistence uses browser-local storage (e.g., localStorage or cookies) — no backend changes or user authentication required.
- Translations are bundled with the frontend as static assets — no external translation service is required for MVP.
- Right-to-left (RTL) layout is not required since none of the four supported languages (English, Spanish, French, Russian) use RTL scripts.

## Clarifications

### Session 2026-03-09

- Q: What visual style should the language selector use? → A: Current language flag emoji (🇬🇧/🇪🇸/🇫🇷/🇷🇺) — click opens dropdown with all languages displayed as flag + native name.
- Q: How are translations sourced? → A: All translations are pre-written and bundled as static assets in the frontend. No external translation API or service is used.
