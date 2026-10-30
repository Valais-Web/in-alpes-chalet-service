# Public website design polish

Goal: implement the seven design adjustments approved in conversation, retaining every home section and all seven reservation steps. Keep Bart's current photo until a portrait is supplied.

Approach: refine the existing React/Tailwind editorial system without dependencies or backend/database changes. Keep production prices; always render a price row with CHF — when absent. Prioritize travelers, with owner services at the end of the home page.

- [x] Reorder home: hero, apartments, destination, process, reviews, person, owners. Reduce section spacing and destination height; make seven steps readable at tablet widths.
- [x] Landscape apartment covers; separate capacity, bedrooms and price. Reuse one price display in cards, detail and mobile bar.
- [x] Use dark fir for primary buttons; improve visible focus and touch targets.
- [x] Keep mobile reservation access in header and add fixed detail availability/form shortcuts with safe-area clearance.
- [x] Align contact and booking field styles at 16px with readable labels, distinct errors and request guidance, in FR/EN/NL.
- [x] Verify formatting, TypeScript, production build and existing suite. Inspect rendering if browser tooling is available. No deployment or database writes.

Review focus: no lost sections; all seven steps retained; zero/missing price is a placeholder, positive price preserved; mobile controls fit narrow widths; fixed bar does not obscure final footer content; booking remains a request.

Verification: 90 existing tests passed; TypeScript and production build passed; ESLint passed for changed TS/TSX files; git diff --check passed. Chromium checked home and apartment detail at 320, 375, 768 and 1024px in FR/EN/NL, with no horizontal overflow and all seven steps retained; desktop checked at 1440px. Availability and booking anchors land below the sticky header. Positive tariff 185 and absent tariffs render correctly. Contact fields render at 16px. No browser JavaScript errors in the final price/render check.

Review fixes: contained visually hidden price labels within their positioned price wrapper to prevent carousel overflow; wrapped calendar legends and rating chips for narrow screens. Bart portrait remains pending. No dependency, database, publishing or git-history changes.

## User-directed second pass

Unify all green accents through the fir token; center hero copy with compact inline actions; enclose apartment images and text in one bordered card; add Lucide illustrations to all seven services; cap desktop apartment gallery height so title, facts and booking start above the fold. Preserve every section and existing booking behavior. Validate in Chromium and rerun existing checks.
