# Tasks: Multilanguage UI

**Input**: Design documents from `/specs/002-multilanguage-ui/`
**Prerequisites**: plan.md (✅), spec.md (✅), research.md (✅), data-model.md (✅), quickstart.md (✅)

**Tests**: Not requested — test tasks excluded.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the i18n directory structure and the foundational language system

- [x] T001 Create i18n directory structure at `frontend/src/i18n/` and `frontend/src/i18n/locales/`
- [x] T002 Create `LANGUAGES` constant array and TypeScript types in `frontend/src/i18n/index.ts` defining supported languages (en, es, fr, ru) with codes, native names, and flag emojis
- [x] T003 Create English translation file with all UI string keys in `frontend/src/i18n/locales/en.json` — extract every hardcoded English string from all pages and components into dot-notation keys (nav.*, landing.*, profile.*, booking.*, dashboard.*, payment.*, notfound.*, common.*)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the React context provider and translation hook that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement `LanguageContext` and `LanguageProvider` in `frontend/src/i18n/index.ts` — React context that holds the current language code and the loaded translation dictionary, reads initial language from `localStorage` key `holalingo-lang`, falls back to `en` if invalid
- [x] T005 Implement `useLanguage()` hook in `frontend/src/i18n/index.ts` — returns `{ language, setLanguage, t }` where `t(key)` looks up the translation key and returns the translated string (falls back to English if key missing)
- [x] T006 Wrap the entire app with `<LanguageProvider>` in `frontend/src/App.tsx` — must be outside the Router so language state is shared across all pages

**Checkpoint**: Foundation ready — the i18n system exists and can be consumed by components. User story implementation can now begin.

---

## Phase 3: User Story 1 - Select Display Language (Priority: P1) 🎯 MVP

**Goal**: Student can click a flag emoji in the navbar, see a dropdown with 4 languages, and switch the entire interface language instantly.

**Independent Test**: Click the flag in the header → select a language → verify all visible text on the current page updates to the selected language without page reload.

### Implementation for User Story 1

- [x] T007 [US1] Create `LanguageSelector` component in `frontend/src/components/LanguageSelector.tsx` — renders the current language's flag emoji as a clickable button in the navbar; on click, shows a dropdown/popover listing all 4 languages as flag emoji + native name (🇬🇧 English, 🇪🇸 Español, 🇫🇷 Français, 🇷🇺 Русский); clicking a language calls `setLanguage()` from the hook and closes the dropdown; dropdown should close on outside click
- [x] T008 [US1] Integrate `LanguageSelector` into the header navbar on the `LandingPage` in `frontend/src/pages/LandingPage.tsx` — place in the top-right nav area next to the "Get Started" button; replace all hardcoded English strings with `t()` calls using keys from `en.json`
- [x] T009 [P] [US1] Replace all hardcoded English strings with `t()` calls in `frontend/src/pages/ProfilePage.tsx`
- [x] T010 [P] [US1] Replace all hardcoded English strings with `t()` calls in `frontend/src/pages/BookingPage.tsx`
- [x] T011 [P] [US1] Replace all hardcoded English strings with `t()` calls in `frontend/src/pages/DashboardPage.tsx`
- [x] T012 [P] [US1] Replace all hardcoded English strings with `t()` calls in `frontend/src/pages/PaymentStatus.tsx`
- [x] T013 [P] [US1] Replace all hardcoded English strings with `t()` calls in `frontend/src/pages/NotFound.tsx`
- [x] T014 [P] [US1] Replace all hardcoded English label strings with `t()` calls in `frontend/src/components/TeacherProfile.tsx`
- [x] T015 [US1] Add the `LanguageSelector` component to the header/nav of every page that has its own header (`ProfilePage`, `BookingPage`, `DashboardPage`) so the selector is visible on all pages — if pages share a header component, add it once there instead

**Checkpoint**: At this point, clicking the flag selector should switch all text to English keys — but only English works since other locale files don't exist yet. The dropdown and instant-switch mechanism is fully functional.

---

## Phase 4: User Story 2 - Persist Language Preference (Priority: P2)

**Goal**: The selected language is remembered across browser sessions via localStorage.

**Independent Test**: Select Russian → close browser → reopen site → verify the interface loads in Russian automatically.

### Implementation for User Story 2

- [x] T016 [US2] Update `LanguageProvider` in `frontend/src/i18n/index.ts` to write the selected language code to `localStorage` key `holalingo-lang` whenever `setLanguage()` is called; on initial load, read from localStorage and validate the value is in the supported list (`en`, `es`, `fr`, `ru`); if invalid or missing, default to `en`

**Checkpoint**: Language persistence works. Refresh the page or reopen the browser — the last-selected language is remembered.

---

## Phase 5: User Story 3 - Localized Content Completeness (Priority: P3)

**Goal**: All platform UI text is fully translated in all 4 languages. No English text leaks through when a non-English language is selected.

**Independent Test**: Switch to each non-English language → navigate through all 6 pages → verify no untranslated English labels appear.

### Implementation for User Story 3

- [x] T017 [P] [US3] Create Spanish translation file `frontend/src/i18n/locales/es.json` — translate ALL keys from `en.json` into Spanish
- [x] T018 [P] [US3] Create French translation file `frontend/src/i18n/locales/fr.json` — translate ALL keys from `en.json` into French
- [x] T019 [P] [US3] Create Russian translation file `frontend/src/i18n/locales/ru.json` — translate ALL keys from `en.json` into Russian
- [x] T020 [US3] Verify translation completeness — cross-check that every key in `en.json` exists in `es.json`, `fr.json`, and `ru.json` with no missing entries

**Checkpoint**: All 4 languages are fully translated. Switching to any language shows a complete, polished interface with no English leak-through.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T021 [P] Style the `LanguageSelector` dropdown with Tailwind for a premium look — glassmorphism/backdrop-blur, smooth open/close animation, hover highlights, proper z-index layering, touch-friendly tap targets on mobile
- [x] T022 [P] Add keyboard accessibility to `LanguageSelector` — Tab to focus, Enter/Space to open, Arrow keys to navigate options, Escape to close
- [x] T023 [P] Update `<title>` tag and meta description to reflect the selected language in `frontend/index.html` or via a `useEffect` in `App.tsx`
- [x] T024 Verify all pages render correctly in all 4 languages — check for layout overflow (Russian text tends to be longer), truncation issues, and responsive behavior on mobile viewports
- [x] T025 Run quickstart.md validation — verify the documented workflow for adding new keys and new languages works as described

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) — can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Setup (Phase 1) for `en.json` key structure — can run in parallel with US1 and US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Requires Phase 2. No dependencies on other stories.
- **User Story 2 (P2)**: Requires Phase 2. Independent of US1 (persistence logic is in the provider).
- **User Story 3 (P3)**: Requires `en.json` from Phase 1 as reference. Independent of US1/US2.

### Within Each User Story

- Models/types before services
- Context/hooks before components
- Components before page integration
- Core implementation before polish

### Parallel Opportunities

- T009, T010, T011, T012, T013, T014 can ALL run in parallel (different page files)
- T017, T018, T019 can ALL run in parallel (different locale files)
- T021, T022, T023 can ALL run in parallel (different concerns)
- US1, US2, US3 can be worked on in parallel after Phase 2

---

## Parallel Example: User Story 1

```text
# After T008 (LandingPage integration), launch all remaining page translations together:
Task T009: "Replace strings in ProfilePage.tsx"
Task T010: "Replace strings in BookingPage.tsx"
Task T011: "Replace strings in DashboardPage.tsx"
Task T012: "Replace strings in PaymentStatus.tsx"
Task T013: "Replace strings in NotFound.tsx"
Task T014: "Replace strings in TeacherProfile.tsx"
```

## Parallel Example: User Story 3

```text
# All locale files can be authored simultaneously:
Task T017: "Create es.json"
Task T018: "Create fr.json"
Task T019: "Create ru.json"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006)
3. Complete Phase 3: User Story 1 (T007-T015)
4. **STOP and VALIDATE**: Language selector works, English strings display via `t()` keys
5. Deploy/demo if ready — other languages can be added incrementally

### Incremental Delivery

1. Setup + Foundational → i18n system ready
2. Add User Story 1 → Selector works with English → Deploy/Demo (MVP!)
3. Add User Story 2 → Persistence works → Deploy/Demo
4. Add User Story 3 → All 4 languages complete → Deploy/Demo
5. Polish → Premium styling, accessibility, validation → Final release

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Teacher-authored content (bios, notes) is NOT translated — only platform UI labels
