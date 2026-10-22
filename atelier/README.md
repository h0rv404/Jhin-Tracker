# Jhin Atelier — Ranked Lab (Riot sync & rune pages)

A buildless personal League of Legends tracker for comparing Jhin strategies across accounts. Based on the supplied tracker, rebuilt around individual match records. No Riot API key is included. D1 stores encrypted connection keys; game records remain browser-local.

## Start

The app now includes a Vinext/Cloudflare server for Riot sync and an encrypted connection vault. The interface and calculation modules live in `public/`; `app/api/` holds the same-origin server endpoints. Existing `jhin_atelier_v4` data remains compatible at the same deployed origin.

Use the pinned pnpm version in package.json, install with the Sites installation helper (or `pnpm install` outside Work), and run `pnpm dev`. Production builds use `pnpm build`. Run tests with `node --test tests/*.test.js` and type checking with `pnpm exec tsc --noEmit`.

The hosting manifest enables D1 as `DB`. Apply the schema migration in `drizzle/` before running connection endpoints. Hosted Sites applies it during deployment. A stable runtime secret `RIOT_KEY_ENCRYPTION_SECRET` is required; see `.env.example` for names only. Do not rotate this secret without migrating saved keys. The hosted version already has its encryption secret configured.

The UI is also usable without the API server: serve `public/` as a static site to log manually and use the bundled catalog, but Connect Riot / Sync / catalog refresh require the backend. GitHub Pages alone cannot run those endpoints. No Riot API key is included in source, seed data or backups.

## Connect & sync

1. Open **Connect Riot**, follow the Riot developer portal link, and enter a Riot API key into the password field in the private tracker. This is not your Riot password. Development keys deactivate every 24 hours; for continued personal use, apply to Riot for a personal key. Stored keys are encrypted with AES-GCM in D1, scoped to the signed-in Site user. The key is never returned to the browser. It can be removed from Data & settings.
2. Press **Sync** beside an account. Supply the complete Riot ID (`Name#TAG`) and server once. After the first import, the PUUID is retained; subsequent fetches use it to survive display-name changes. Account links and game records persist in this browser; the encrypted API key is server-held.
3. The server fetches up to ten recent ranked solo/duo match IDs per batch and imports Jhin games only. Review the batch, then import. Use **Fetch older games** to catch up after a long break. Match IDs prevent duplicate imports. One matching manual game within three minutes and with the same result is reconciled, preserving its LP and note; ambiguous overlaps require review.
4. Current solo/duo rank, LP, level and W/L refresh. Account starting balances reconcile against imported records to avoid double counting. Use season labels aligned with the live ranked season when syncing; Riot does not report a separate W/L total for arbitrary custom season labels.
5. Performance, duration, items, lane champions and actual runes are imported. Historical per-game LP and queue time remain unknown unless entered; item imports are final inventories, not a reconstructed purchase order. W/L season totals can include games outside the fetched Jhin sample.
6. Create a named rune page in **Strategy lab**: choose a keystone and one rune from each primary row, two secondary runes from different rows, and three stat shards. Exactly one matching saved setup is automatically assigned to imported games; ambiguous matches remain unassigned. Strategy labels describe your experiment and do not change actual imported rune snapshots. Bulk assignment is available for unassigned games in the current filters.
7. Manual entry needs only account and result. LP is optional; expandable sections hold performance and notes. Enemy bot and allied support selectors contain all bundled champions. The catalog is refreshed from Riot Data Dragon when possible, with a bundled patch snapshot for offline use; there is also a Refresh catalog button.

The server enforces authenticated Site identity, same-origin mutation requests, provider host allowlists, bounded batches, a 15-second per-user sync cooldown, and readable Riot rate-limit / expired-key errors. Riot API calls use a header-held API key and fixed provider hosts. No OP.GG/Porofessor scraping is used. Automatic games are fetched on demand; the tracker does not need to stay open while you play.

## First use

1. In Accounts, edit account identity, default strategy, target rank, starting balances and profile links. Add a Riot ID including its #tag when known; the original nicknames do not provide tags.
2. In Strategy lab, create an experiment with a specific hypothesis. A match stores its strategy independently of account defaults.
3. Start a session. Log a match after each game; all entry buttons use the same form.
4. Enter signed LP, optional CS/K/D/A, game time, queue time, enemy ADC, allied support, keystone, other runes, items and a review note.
5. Use history to edit or delete errors. All tracked statistics recalculate; the latest successful data action can be undone until another action replaces it or the page reloads.
6. Set a rank checkpoint using the rank shown in the League client after promotions, demotions, placements or season resets.
7. Export JSON regularly from Data & settings. Import validates the whole workspace and downloads a pre-replacement backup before applying it.

## Migration from the original tracker

If `jhin_tracker_v3` exists at the same browser origin, migration runs automatically without deleting that original key. A newly hosted version has a different origin and cannot read data from the old site.

To transfer the original browser data, open the original tracker, open the browser developer console, and run this export snippet:

```js
const saved = localStorage.getItem('jhin_tracker_v3');
if (!saved) throw new Error('No saved original tracker data at this origin.');
const link = document.createElement('a');
const url = URL.createObjectURL(new Blob([saved], {type: 'application/json'}));
link.href = url;
link.download = 'jhin-original-backup.json';
link.click();
setTimeout(() => URL.revokeObjectURL(url), 1000);
```

Then import that JSON in the new app's Data & settings. This snippet only downloads the tracker JSON; it does not send it anywhere.

Migration subtracts imported recorded wins/losses from original account totals to establish starting balances, with a floor of zero and a warning when old totals contradict history. Legacy rune/support/matchup counters are preserved for download as an archive, but excluded from new analyses because they cannot be reliably matched to games. Old rune-tree labels remain as coarse labels. Current legacy rank is the migration-time baseline; earlier rank changes cannot be reconstructed reliably from the old snapshots.

## Data model and interpretation

- Workspace schema version: 4. Storage key: `jhin_atelier_v4`.
- Accounts hold starting W/L balances for a named season and a dated starting rank. Account tables add matching-season recorded W/L. New-season selection preserves earlier data.
- Match history is the source of tracked win rates, matchup/support/keystone analysis, CS/minute, KDA and LP metrics. Remakes are excluded from W/L and analytic game counts.
- Unknown numbers are null, never silently treated as measured zero. LP/game uses known-LP games. LP/hour uses only games with known LP and duration, including entered queue time. Coverage is shown.
- Aggregate KDA is (total kills + assists) / total deaths for complete K/D/A rows. Zero deaths displays Perfect. CS/minute divides total measured CS by total measured game duration.
- The LP curve shows separate cumulative recorded changes per account, each starting at zero; it is not a mixed-account average or a true MMR chart.
- Ranks are estimated using 100 LP per ordinary division and the latest dated checkpoint; actual game transition/protection rules can differ. Master/Grandmaster/Challenger share a common LP scale; an inferred apex result displays Master. Set exact apex tiers by checkpoint.
- Missing LP after a checkpoint makes current LP unknown until a newer checkpoint. Goal distance and games-to-target are estimates, the latter only when recorded LP/game is positive.
- Rank filters use reconstructed rank at match time and cannot include older games with no known baseline. Changing account region relabels its historical comparisons: create a separate account entry for a server transfer.
- Strategy win-rate intervals use Wilson 95% intervals. Small-sample flags are descriptive; comparisons do not establish causation.
- Sessions have a single active session and consistent time/season boundaries.

## Profile links and official sync

Accounts support HTTPS URLs on OP.GG and Porofessor domains. Links are shortcuts and do not sync data. OP.GG's help center states its game data is not provided to third parties:
https://help.op.gg/hc/en-us/articles/31091405109401-Can-I-use-OP-GG-data

The implemented sync uses Riot Account-v1, Summoner-v4, League-v4 and Match-v5 through authenticated server routes. It resolves Riot ID/tag to PUUID, fetches and maps objective Jhin game fields, and deduplicates imports. Real-account live sync cannot be verified until the user supplies their key and full account identity. Tests exercise routing, parsing, error handling, duplicate reconciliation and exact rune matching with synthetic Riot responses.

Official documentation: https://developer.riotgames.com/docs/portal

## Storage and recovery

Games are local to this browser and origin, not synchronized between devices. Site owner-only access protects the hosted page; it does not turn localStorage into a cloud database. Clearing site data can remove progress. A failed load pauses saving, with raw backup and validated recovery options. A failed write leaves the prior in-memory workspace unchanged and reports the failure. Cross-tab storage changes pause further saves to prevent silent overwrites.

User text is HTML-escaped, external profile URLs are restricted to HTTPS on approved provider domains, links use noopener/noreferrer, and inline JavaScript event handlers are avoided. Google Fonts is an optional external visual dependency; system fonts are the fallback. Runtime charts use inline SVG, without Chart.js or a network dependency.

The Sites hosting manifest and repository are separate from the user's original GitHub repository. No changes have been pushed to that original repository.
