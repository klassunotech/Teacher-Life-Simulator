# Teacher Life Simulator 3.4.2 → 4.0.0 Audit

## Source audit

The supplied archive contains 99 entries: a static HTML entry point, one stylesheet, ES-module JavaScript, JSON data, a Service Worker, web manifest, icon assets, Node tests, simulation/fuzz tools, save fixtures and prior delivery/audit documentation. The runtime is client-only (no backend), uses ES modules and browser LocalStorage, and is deployed under a GitHub Pages project path with relative asset URLs.

### Existing core retained

- `game-engine.js`: game state, monthly settlement, contracts, promotions, career transitions, school management, year-end and endings.
- `ui.js`: screen rendering, navigation, actions, event dialogs, finance/career/people pages.
- `monthly-system.js`, `career-system.js`, `salary-system.js`, `health-system.js`, `finance-system.js`: existing AP settlement, rank/pay, health and finance calculations.
- `event-engine.js`, `scenes.js`, `data/events.json`: existing story/scenario engine and pixel-art scenes.
- `save-system.js`: LocalStorage serialization and state validation.
- `sw.js`, `manifest.webmanifest`, icons: existing PWA shell.

## Risk findings and changes

1. Existing save wrapper used `saveVersion=1`; 4.0 now writes schema version 2 while accepting version 1. `gameVersion` is migrated to `4.0.0`; old progress fields remain and missing ecosystem state is hydrated.
2. Core simulation uses a deterministic RNG stream. The new ecosystem now owns a separate seeded RNG state stored under `state.causal.rngState`, preventing new student/staff random draws from perturbing legacy career/event RNG outcomes.
3. School transfers can replace the school object. Ecosystem monthly settlement now hydrates missing identity, health, admission and development-cycle structures to avoid stale-school crashes.
4. The original mobile navigation, sticky HUD, relative asset paths and Service Worker strategy are retained; the new ecosystem module is added to the precache list and the cache key is bumped.
5. Policy and legal compliance: the new administration examples are labelled as game workflows, not universal EDB rules. Banding is explicitly described as fictional game positioning.

## Architecture/data flow

`game-engine.js` initializes and owns the ecosystem state. On monthly settlement, the existing character/workload/finance settlement runs first, then `ecosystem-engine.js` updates individual student trajectories, KPI, delayed causal events, school admission indicators, staff relations and annual development records. The UI calls engine actions only; calculation remains in the engine. All ecosystem state is part of the normal serialized game state.

## Known limitations

- The 48 student agents are representative cohort members, not a full roll of every student in a school of hundreds.
- SEN and risk tracking are simulation signals, not clinical diagnoses; a complete safeguarding case lifecycle and crisis escalation workflow is not yet implemented.
- The staff graph and individual memories are implemented, but formal appointment/removal/allowance and staffing establishment workflows are incomplete.
- School finance/admission values are currently simplified indicators, not a complete grant, fee, staffing or SSPA allocation model.
- The current subject modifier is coarse; separate DSE grade distributions, paper difficulty calibration and subject-specific teaching curves remain incomplete.
- The 2026 salary/pay system is retained from 3.4.2; this tranche did not independently re-audit every current salary rule.
- Real browser, iOS/Android installation and offline tests are not claimed as passed.
