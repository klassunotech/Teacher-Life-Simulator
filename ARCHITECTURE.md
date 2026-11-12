# Architecture — Teacher Life Simulator 3.4.1

## Runtime

- `index.html` boots the application and links the PWA manifest.
- `js/main.js` loads local JSON and initializes the UI and game engine.
- `js/ui.js` renders the pixel-RPG interface and delegates actions to the engine.
- `js/game-engine.js` owns game state, monthly settlement, save migration, career, contract, school and Game Over flow.
- `js/monthly-system.js` applies AP allocation, work effects, stress, energy and monthly financial results.
- `js/career-system.js` defines career ranks, promotion eligibility, vacancy gates and course eligibility.
- `js/salary-system.js` defines 2026 MPS values, teacher grade ranges and salary presentation.
- `js/health-system.js` handles health, medical care, sick leave and retirement.
- `js/save-system.js` validates and serializes browser LocalStorage saves.

## Data

- `data/config.json`: AP categories, balance constants, role paths and vacancy probabilities.
- `data/careers.json`: 8 career routes, professional courses and family paths.
- `data/events.json`: original story and random event pool.
- `data/schools.json`: school types, school styles and generated school data.
- `data/subjects.json`: subject names.

## Resource separation

- AP is the monthly teacher-work resource.
- CP is the interpersonal communication resource.
- PD is the professional-development course resource.

## Save migration

The JSON wrapper version remains `SAVE_VERSION=1`; the in-state `meta.gameVersion` advances to `3.4.1`. `load()` fills newly introduced career, contract, communication, PD and school-health fields before validation/persistence. Existing history and character progress are retained.

## PWA

`sw.js` precaches local runtime files and deletes older cache names on activation. The current cache is `tls-3.4.1-shell-v1`. All paths remain relative for static hosting under a GitHub Pages project path.
