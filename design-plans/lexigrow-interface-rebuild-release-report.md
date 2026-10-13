# LexiGrow interface rebuild — release report

**Release date:** 2026-10-13  
**Production:** <https://lexigrow.ltcuong24.io.vn>  
**Branch:** `main`  
**Deployed image:** `lexigrow:e944c11`  
**Rollback container:** `lexigrow-rollback-f8b2737` (previous image `lexigrow:f8b2737`, stopped and retained)

## Outcome

LexiGrow’s interface was rebuilt around the supplied Eduvia reference: Urbanist typography, deep navy and bright accent colors, rounded controls and cards, a refreshed navigation/footer system, and redesigned page layouts and learning surfaces. The existing LexiGrow product remains the source of the page content, learning material, roles, data, and workflows. The redesign did not replace LexiGrow with Eduvia course copy or alter API/database contracts.

The final release also fixes cache behavior for public assets. Content-hashed Vite CSS/JS bundles remain immutable and long-lived; non-hashed `/assets` files such as `study-hero.jpg` must revalidate and are not stored by the browser. The service worker cache version is now `lexigrow-v7` so clients activate a fresh cache.

## Interface coverage

- **Shared surfaces:** design tokens and Urbanist font; application and standalone layouts; navigation, footer, buttons, cards, form controls, and responsive/focus styles.
- **Student learning:** home/dashboard, topic exploration and filters, vocabulary, writing session, progress views, pricing, and learning/game surfaces including daily quest, flashcards, vocabulary games, and Growth Garden.
- **Teacher workspace:** dashboard, classroom and assignment management, and writing feedback/review surfaces.
- **Parent workspace:** parent dashboard and child progress.
- **Administrator workspace:** dashboard and management surfaces for users, classes, pricing, vocabulary, announcements, AI monitoring, logs, and system prompts.
- **Account and payment flows:** authentication, onboarding/settings, and payment result screens retain their existing route and behavior.

Release screenshots:

- [Student home — desktop, 1440 px](lexigrow-interface-release-evidence/home-desktop.png)
- [Student home — mobile, 390 px](lexigrow-interface-release-evidence/home-mobile.png)
- [Explore — mobile, 390 px](lexigrow-interface-release-evidence/explore-mobile.png)

## Verification performed

| Check | Result |
|---|---|
| `npm run build` | Passed; Vite transformed 238 modules. |
| `npm run lint` | Passed with 0 errors and 101 warnings. Warnings are existing project-wide lint findings; the lint command exits successfully. |
| `cd server && npm test` | Passed: 57 test files, 375 tests. This includes regression checks for mutable public image headers and immutable hashed bundles. |
| Browser route smoke | 51 routes across student, teacher, parent, admin, authentication, pricing/payment, and settings surfaces; mocked API responses; no JavaScript exceptions or horizontal overflow in the recorded route pass. |
| Interaction checks | Explore search (`Travel` narrowed results to 2), B1 filter (3 results), and progress tab switching completed; checked duplicate IDs and console errors. |
| Responsive widths | Explore checked at 390, 768, 1024, and 1440 px with no horizontal overflow. Screenshots captured at 1440 and 390 px. |
| Live health | `GET /api/health` returned HTTP 200 and `success: true` after deployment. |
| Live image URL | `GET /assets/editorial/home/study-hero.jpg` returned HTTP 200, `image/jpeg`, and `Cache-Control: no-cache, no-store, must-revalidate`, `Pragma: no-cache`, `Expires: 0`. |
| Homepage | Production HTML returned successfully and includes the Urbanist font and LexiGrow page metadata. |
| Git release | `origin/main` points to `e944c1157c24d544edf082766325df10ea5c2c69`; deployed image was built from that commit. |

The browser route pass used local mocked API fixtures. It verifies rendering and navigation against representative responses, not live account data or payment/learning writes. No Lighthouse or performance benchmark was run.

## Commits deployed

- `6030072` — `feat(ui): rebuild LexiGrow interface across workspaces`
- `f8b2737` — `fix(assets): map legacy hero image URL to current artwork`
- `e944c11` — `fix(cache): revalidate public assets and refresh service worker`

## Deployment and recovery

The production image was built on the VPS from a streamed `git archive` of the pushed `main` commit. The prior running container was committed as `lexigrow:rollback-f8b2737` and retained as the stopped container `lexigrow-rollback-f8b2737`. The new container passed its internal health check before public checks were run. To roll back, replace the active `lexigrow` container with the retained `lexigrow-rollback-f8b2737` container and reconnect it to `web-net` with the `lexigrow` network alias.

## Known verification limits

- Route smoke used mocked API data; production user-specific records and write operations were not exercised.
- The project lint command reports 101 warnings, with no errors.
- No performance/Lighthouse benchmark was collected.
- The repository instructions request refreshing the `graft/` context graph after substantial changes. The `graft` executable was unavailable in this environment, so the graph could not be rebuilt.
- Existing unrelated, untracked user files were left untouched: `.gemini/`, `design-plans/editorial-rebuild-audit-evidence/`, `design-plans/editorial-rebuild-audit.md`, `design-plans/eduvia-research/`, and `opencode.json`.
