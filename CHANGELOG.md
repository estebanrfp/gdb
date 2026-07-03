# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.19.0] - 2026-07-03

### Added

- **Opt-in debug logging: `gdb(name, { debug: true })`.** GenosDB's internal logs (~170 call sites: OPFS persistence, delta sync, security manager, plugins, GenosRTC network events) are now **silent by default and switchable at runtime** — previously they were stripped from the build entirely, so integrators could never surface them. Passing `debug: true` enables the full internal log stream across the core, **every lazy-loaded plugin bundle and the GenosRTC transport**. The logger is a build-injected, bundle-scoped shim (`log.info/warn/error` → gated `console`), so it adds **zero imports to the source, nothing to the page's globals, and ~1 KB gzip** to the main bundle; native `console` methods are bound directly, preserving the caller's `file:line` in DevTools. The production console is now **completely clean** — even the attribution banner only prints in debug mode. Host applications' own `console` is never touched.

### Fixed

- **`rtc: { cells: { debug: true } }` was a silent no-op in production.** The cellular overlay's verbose logger (`console.debug('[cells]', …)`, gated by the public `debug` option documented in the API) was stripped from `dist/genosrtc-cells.min.js` by the build's console dropping, so enabling the option never printed anything. Console stripping is removed from the build pipeline (logging is now runtime-gated), which brings the option back to life; the `[cells]` channel uses `console.debug`, so it lands in DevTools' "Verbose" level.

### Changed

- **Worker persistence errors report through one channel.** The OPFS worker's direct `console.error` calls are removed; failures already reach the main thread via the existing `postMessage({ type: 'error' })` → rejected-promise path, where they are logged (gated) with full context.

## [0.18.0] - 2026-07-03

### Added

- **Cellular Mesh — partitioned WebRTC transport.** Rooms can now organize themselves into cells with deterministically elected bridge peers, so each peer keeps connections only to its own cell plus its bridge relations instead of the whole room: **connections per peer scale with cell size, not room size** (measured live: 13–18 connections at 16 peers where a full mesh holds 30 — and the gap widens with every peer that joins). Cell assignment uses rendezvous (HRW) hashing over the signaling census, bridge election is a pure function of the shared roster — both endpoints derive the same verdict independently, no coordination messages — with guaranteed egress on both sides of every edge, and cross-cell delivery rides bridge forwarding with per-message dedup: **100% delivery verified across cells and across browsers**. The overlay is self-tuning and production-calibrated: cells of 10 with the first split at 11 peers (small rooms keep the optimal direct mesh), ring+fingers neighborhood for O(log C) diameter, orderly wave-based bootstrap (bounded dialing with a global half-open cap), automatic recycling of connections that never establish (keeps the browser's per-process connection budget clean across long sessions), and a periodic state keep-alive so late joiners converge on the full roster within seconds. Opt-in per app with one line — `gdb(name, { rtc: { cells: { cellSize: 'auto', bridgesPerEdge: 2 } } })` — while `db.map`/`put`/`remove` and sync stay identical, and `rtc: true` keeps the classic full mesh untouched. See the one-line migration in [examples/todolist-cell.html](https://github.com/estebanrfp/gdb/blob/main/examples/todolist-cell.html) and the live topology in the mesh monitors. Rebuilds `dist/genosrtc-cells.min.js` and `dist/genosrtc.min.js`.

### Changed

- **Mesh monitors report engine truth with calm rendering.** All five cell monitors (d3, lite, modern, particles, retro) now read bridge roles straight from the engine's gossiped state (single source of truth), expire peers that leave silently, and repaint only when the visible model actually changes — steady graphs, exact bridge badges, lower CPU. [examples/graph-p2p.html](https://github.com/estebanrfp/gdb/blob/main/examples/graph-p2p.html) joins the cellular mesh with bridge and cross-cell link styling plus cell tags.

## [0.17.0] - 2026-06-27

### Fixed

- **P2P discovery could stall completely when a single signaling relay was unreachable.** GenosRTC's gateway gated the entire announce/discovery phase behind a `Promise.all` over every relay's readiness — and a relay socket that never opens (down, slow, or hanging the WebSocket handshake) leaves its `ready` promise *pending forever* rather than rejecting, so the `Promise.all` never resolved and **no announce was ever sent on any relay**, including the healthy ones. Because GenosDB joins with a fixed `appId` and every peer derived the **same** deterministic relay set, one dead relay stalled discovery for **all** peers at once: the room existed and `db.room` responded, but peers never found each other and P2P sync silently never started. Each relay now subscribes and announces **independently** the moment it connects; a relay that never opens leaves only its own task pending and can no longer block the others, so discovery proceeds on the first available relay. `gdb()` / `join()` stay synchronous — the top-level-`await` contract is unchanged, only the internal barrier is removed. Rebuilds `dist/genosrtc.min.js` and `dist/genosrtc-cells.min.js`.

### Changed

- **Default Nostr relay set curated and discovery retuned for faster, more reliable peer connection.** The built-in relay list is replaced with **10 relays verified empirically** — each one publish→echo round-trip tested with the ephemeral event kind GenosRTC actually uses — dropping relays that don't relay ephemeral kinds, require payment / NIP-05 / PoW, or were unreachable. `defaultRedundancy` is raised **5 → 10** so every peer connects to the whole verified list instead of a 5-relay slice: previously a deterministic `appId`-seeded shuffle silently discarded the most reliable relays (well-known relays were in the list but never used). The shuffle is disabled, so all peers use the same list in the same fastest-RTT-first order, maximizing the relay overlap that ephemeral signaling depends on. `ANNOUNCE_INTERVAL_MS` is lowered **5333 → 2500 ms** to shorten the discovery window for late-arriving peers (announce payloads are tiny, so the extra traffic is negligible). Together these cut the time-to-first-peer and remove the intermittent-connection behavior caused by landing on a fixed set of slow or dead relays. Rebuilds `dist/genosrtc.min.js` and `dist/genosrtc-cells.min.js`.

## [0.16.0] - 2026-06-21

### Added

- **SM-ACLs — delegated deletion.** `db.sm.acls.grant(nodeId, address, 'delete')` now works: an owner can grant another user permission to **delete** a specific node, closing the gap where the API reference advertised `'delete'` as a grantable permission while `grant` accepted only `'read'`/`'write'` (and so threw at runtime). A `'delete'` collaborator may now remove the node — via `db.sm.acls.delete(id)` or a `remove` op — and, since delete implies write, edit it too; the ACL middleware enforces this on **every** peer, so a non-owner *without* the grant is still rejected (the delegation is scoped, never global). Owner-only deletion and `'read'`/`'write'` grants are unchanged — fully backward-compatible. The ACLs testbed ([examples/acls.html](https://github.com/estebanrfp/gdb/blob/main/examples/acls.html)) demonstrates it: the owner grants `delete` per note and the recipient gets a **Delete** button on a note shared with them. Rebuilds `dist/sm-acls.min.js`.

## [0.15.2] - 2026-06-11

### Fixed

- **`db.clear()` left the peer silently divergent from the network.** Clearing wiped the local graph but kept the peer's sync watermark (`globalTimestamp` + its persisted `<dbName>_time` key) and its oplog. On reconnect the peer announced a recent watermark, so other peers computed an **empty delta** and the cleared peer never re-pulled pre-existing data — two peers in the same room could hold permanently different states with no error. The stale oplog could also serve "ghost" deltas referencing nodes that no longer existed locally. `clear()` now resets the watermark and empties the oplog (the Hybrid Logical Clock is deliberately untouched so new writes still win LWW), making its semantics coherent: *renounce the local copy and history, and take the documented full-state path on the next sync*. **Behavior change:** clearing while peers hold data means the data is restored from the network on reconnect — the correct P2P semantic (a distributed dataset cannot be deleted by wiping one local cache). Verified live: after `clear()`, the next handshake produces a `fullStateSync` on both sides and the room reconverges.
- **`db.clear()` now persists the cleared state through the worker instead of deleting the OPFS file directly.** The old main-thread `removeEntry` only knew about OPFS, so on browsers where the persistence worker had fallen back to IndexedDB the stored graph survived a clear and resurrected on reload. Clearing now saves the empty graph through the worker — which writes to whichever storage tier is actually in use, under the per-file lock — and its BroadcastChannel `update` makes other same-origin tabs reload the cleared state too. Less code, every tier covered.

### Changed

- **Perf & Realtime Stress Test (`examples/perf-stress-test.html`) reworked.** Honest metrics: fulfilled and rejected puts are counted separately, and **ops/s** is computed over pure write time (UI yields excluded), with write vs wall time shown side by side. New **Sync Protocol Observatory** card counts `sync` / `deltaSync` / `fullStateSync` messages live — connect a second browser, close it, insert, and reopen it to watch the Hybrid Delta Protocol switch between delta and full-state catch-up. `saveDelay` and `oplogSize` are now configurable knobs at init.

## [0.15.1] - 2026-06-11

### Fixed

- **Geo module — `$near` / `$bbox` queries returned no results (operators were disconnected from the query engine).** The module registered its operators on a property the engine never reads, so every geo query silently matched nothing (and the top-level `{ $near: … }` form crashed). The module now resolves geo conditions itself through a geo-aware `db.map` wrapper: geo conditions are extracted from the query (both documented forms — field-wrapped and top-level), every remaining filter is delegated to the engine untouched, and `field`/`order`/`$after`/`$before`/`$limit` are re-applied **after** the geo filter with the engine's exact semantics. Realtime subscriptions emit correct `added`/`updated`/`removed` actions as nodes enter or leave the queried area, and both documented coordinate formats (flat and nested `location`) now work. Queries without geo conditions pass through byte-for-byte. Rebuilds `dist/geo.min.js`; no core engine changes.
- **`dist/geo.min.js` was tracked as `Geo.min.js` (case mismatch).** The loader requests `./geo.min.js`, so on case-sensitive hosting (GitHub Pages, Linux) the dynamic import 404'd and `geo: true` failed to initialize. The tracked filename is now lowercase.
- **Geo examples completed:** `examples/sandbox-locations.html` reworked as the **Geo Query Playground** (documented `$near`/`$bbox` queries wired to `db.map`, live Leaflet markers, editable query box) and `examples/geo.html` now seeds nodes around your detected position and renders the 50 km `$near` matches on the map — both had been left with stubbed queries since the module never returned results.

## [0.15.0] - 2026-06-10

### Removed

- **Governance — rule-level role expiry (`then.expiresIn` / `then.expiresAt` / `then.expiresTo`) and the `revertExpiredRoles` auto-revert engine.** A self-reverting temporary role granted by a *standing* condition created a renewal loop (it expired, reverted, and the still-true condition re-granted it). The governance engine is now a pure **last-match-wins** resolver: a role is a function of the node's current state each cycle, and demotion/reversion is expressed as an ordinary rule. **SM-level expiry is unchanged** — `assignRole(addr, role, expiresAt)` still grants a time-limited role and the Security Manager still enforces it network-wide (`verifyUserRoleLocal` / `verifyIncomingOperations`); only the governance-rule sugar was removed. Rebuilds `dist/sm-gov.min.js`; docs updated in [docs/governance.md](https://github.com/estebanrfp/gdb/blob/main/docs/governance.md).

## [0.14.2] - 2026-06-10

### Changed

- **Governance — last-match-wins conflict resolution.** The engine now evaluates **all** rules each cycle and resolves every `user:<address>` node to a **single** role: the one proposed by the **last matching rule** in the list. Rules ordered easy→hard form a stable merit ladder where climbing a tier overrides the lower ones and losing the condition **auto-demotes** — no explicit demotion rules needed. Each node is written **at most once per cycle**, only when its role actually changes, eliminating the per-rule flicker and redundant ops of the previous sequential apply. Existing rule sets keep working (the last applicable rule already won de facto); the change makes it explicit, clean, and demotion-free. Docs: [docs/governance.md](https://github.com/estebanrfp/gdb/blob/main/docs/governance.md).
- **Governance viewer (`examples/governance.html`) reworked** to a 3-tier merit ladder — `user` → `manager` (≥2 pts) → `admin` (≥4 pts) — that demonstrates last-match-wins and automatic demotion (vote down). Removes the previous temporary-pass demo.

## [0.14.1] - 2026-06-10

### Added

- **Governance — `then.expiresTo` (auto-revert on expiry):** A temporary-role rule can now declare the role to fall back to when it expires. While a superadmin is online, the engine reverts any user whose `expiresAt` has passed to the rule's `expiresTo` role (opt-in — without it the stale label is left in place). Pairs with `expiresIn` / `expiresAt` (0.13.1) to model self-reverting temporary roles. Docs: [docs/governance.md](https://github.com/estebanrfp/gdb/blob/main/docs/governance.md).
- **Governance viewer (`examples/governance.html`) — temporary-role demo:** the viewer grants a 30-second "manager pass" funded by a point, with a live countdown and auto-revert to `user` via `expiresTo`. The point is **spent** on promotion, so the standing condition no longer holds and the pass does not auto-renew — earn another point to buy a new one.

## [0.14.0] - 2026-06-10

### Security

- **Node-level ACLs and role expiry are now enforced against malicious peers (Security-Manager hardening).** Previously these were honored only by the honest client: the cryptographically-verified author of an incoming operation was never propagated to the per-node middlewares, so a modified peer could write nodes it did not own and keep acting under an expired role. `verifyIncomingOperations` now (1) attaches the verified `signer` to every validated incoming operation, so the ACL middleware enforces per-node owner/collaborator permissions against **any** peer; (2) recognizes the real `upsert` write type and lets un-owned nodes through, so ordinary writes are unaffected; and (3) downgrades an expired role to `guest` when authorizing incoming operations, making role expiry (`expiresIn` / `expiresAt`) effective **network-wide**, not just locally. Completes the hardening flagged in 0.13.1. Verified with a compiled-bundle unit suite and a live three-browser adversarial test (a promoted peer's raw write to a note it does not own is rejected by the owner's peer, while its legitimate shares still deliver). **Behavior change:** cross-peer writes that were silently accepted before are now correctly rejected; legitimate owner/collaborator writes are unchanged.

## [0.13.1] - 2026-06-10

### Added

- **Governance — expiring roles (`then.expiresIn` / `then.expiresAt`):** A promotion rule can now grant a **temporary** role. Add `expiresIn` (duration in milliseconds, measured from the moment of promotion) or `expiresAt` (an absolute ISO string, `Date`, or epoch ms) to a rule's `then`, and the signed `assignRole` carries that expiry — enabling time-boxed moderators, trial accesses, temporary sanctions and event roles. Once the role expires the Security Manager stops honoring it locally (`verifyUserRoleLocal` rejects expired roles). Like the rest of the governance beta, expiry is enforced on the honest client; full P2P enforcement against a malicious peer is tracked for a later hardening pass. The engine does not revert the node's `role` field on expiry. Docs: [docs/governance.md](https://github.com/estebanrfp/gdb/blob/main/docs/governance.md).

## [0.13.0] - 2026-06-10

### Added

- **Governance engine (`sm-gov`) — rule-based role promotion:** The Security Manager can now promote (and demote) users automatically from declarative rules passed via `sm.governanceRules`. Each rule is `{ if, then: { assignRole }, offsetTimestamp? }`, where `if` is a **native GenosDB query** (the same language as `db.map`: `$gte`, `$lt`, `$and`, `$or`, `$regex`, …) evaluated against `user:<address>` nodes. The engine runs only while a superadmin is logged in — their key signs every `assignRole`, and every peer verifies it (zero-trust). Includes superadmin immunity and an optional `offsetTimestamp` (minimum time since the user node's last write). Full guide: [docs/governance.md](https://github.com/estebanrfp/gdb/blob/main/docs/governance.md).
- **Governance viewer example (`examples/governance.html`):** Interactive two-browser demo of the full cycle — time-based promotion (`guest → user`), merit-based promotion (`user → manager` on points) and demotion (`manager → user` when dropping below the threshold) — with a live role-transition log and a demo superadmin mnemonic for self-testing. Replaces the previous unfinished drafts.
- **Full security model showcase (`examples/acls.html`):** The ACLs testbed now demonstrates zero-trust + governance + node-level ACLs together: a one-button demo superadmin runs a governance console (live user/role list and signed promotions) while Alice & Bob join as write-blocked guests, get promoted by rule, and then create, share and revoke notes per user with `db.sm.acls.set` / `grant` / `revoke` / `delete`.
- **New examples:** `devconnect.html` (P2P developer network: SM identity behind a centered login modal, real-time directory via `db.map`, public/private chat over GenosRTC channels, GitHub profile import and Leaflet maps) and `collab-editor-basic.html` (minimal, no-login collaborative editor with live presence and debounced auto-save on top of GenosDB's automatic sync).

### Fixed

- **Governance rules were not evaluated:** the engine previously queried all nodes and ignored each rule's `if` condition, so role changes were not driven by the declared objectives. Conditions are now applied via the query engine and scoped to `user:<address>` nodes.
- **`examples/tictactoc.html` rework:** the previous version crashed on role selection (undefined `sendData`) and never synced state to late joiners; replaced with a typed `role`/`state`/`reset` message protocol, state broadcast on `peer:join`, a winner guard and a minimalist flat UI.
- **Docs — `db.room.getPeers()` return type:** corrected to a plain object keyed by `peerId` (it was documented as a `Map`).

## [0.12.10] - 2026-06-03

### Changed

- **Build-only dependencies moved to `devDependencies`:** `ethers`, `pako`, and `@msgpack/msgpack` are now `devDependencies`. The published package ships only the self-contained, pre-bundled `dist/` (these libraries are inlined at build time), so they are not required at runtime. As a result, `npm install genosdb` now pulls **zero** transitive dependencies.

### Security

- **Cleared false-positive `ws` advisory (GHSA-58qx-3vcg-4xpx, `ws <8.20.1`):** The alert originated from `ws` being pulled transitively through `ethers`, which GenosDB uses for cryptography only — its Node WebSocket provider is tree-shaken out, so no `ws` code ships in the bundle. Removing the runtime dependency surface means consumers are no longer flagged; a `ws >=8.20.1 <9` override keeps the dev/build tree clean. Resolves [#30](https://github.com/estebanrfp/gdb/issues/30).

## [0.12.8] - 2026-03-13

### Added

- **`db.sm.map(options)`:** New secure query method that decrypts SM-encrypted nodes in parallel and applies the same query engine as `db.map()` (`query`, `field`, `order`, `$limit`). Does not support realtime mode.
- **`db.sm.remove(id)`:** New secure remove method that deletes SM-encrypted nodes, automatically handling the internal `SM_ID_PREFIX_` prefix.

### Changed

- **SM `processNodeWrapperForResult`:** Extracted from `get()` to module scope so it can be shared by `get()` and `map()`, avoiding code duplication.

### Fixed

- **`createDebouncedTask` race condition (`gdb.js`):** Fixed a bug where rapid sequential operations (e.g., multiple `put`/`remove` calls) caused `TypeError: Cannot read properties of null (reading 'reject')`. The `deferred` reference is now captured locally before being nullified.

## [0.12.7] - 2026-02-18

### Changed

- **Testing Infrastructure:** Replaced Vitest/jsdom mock-based test suite with real browser testing via `agent-browser`. Tests now verify actual P2P sync between two browser sessions with screenshot evidence. Removed `vitest`, `@vitest/ui`, `jsdom` devDependencies, `setupTests.js`, `vitest.config.js`, and CI workflow.

## [0.12.0] - 2025-12-01

### 🚀 Major Feature: Cellular Mesh Overlay for Massive P2P Scalability

This release introduces a revolutionary **Cellular Mesh Network Architecture** to GenosRTC, enabling GenosDB to scale to tens of thousands of simultaneous peers while maintaining low latency and efficient message propagation.

### Added

- **Cellular Overlay System (`cells.js`):** A new P2P topology that organizes peers into logical "cells" with designated bridge nodes for inter-cell communication. This architecture reduces connection complexity from O(N²) to O(N) while maintaining network-wide message delivery.

- **Dynamic Cell Sizing:** The system automatically adjusts cell sizes based on network load using the formula `cellSize = ceil(sqrt(totalPeers / targetCells))`. This ensures optimal performance as the network grows or shrinks.

- **Automatic Bridge Election:** Peers are deterministically elected as bridges between adjacent cells using consistent hashing. Bridges maintain connections to neighboring cells, enabling efficient multi-hop message routing.

- **Configurable Overlay Options:** New `cells` configuration option in the `rtc` object:
  ```js
  const db = await gdb('mydb', {
    rtc: {
      cells: {
        cellSize: "auto",      // or fixed number
        bridgesPerEdge: 2,     // redundancy between cells
        maxCellSize: 50,       // upper limit per cell
        targetCells: 100,      // target number of cells
        debug: false           // enable debug logging
      }
    }
  })
  ```

- **Dynamic TTL Calculation:** Message Time-To-Live is automatically calculated based on network topology to ensure messages reach all cells without excessive propagation.

- **Mesh State Events:** New events for monitoring cellular topology:
  - `mesh:state` — Reports local peer's cell assignment, bridge status, and network metrics
  - `mesh:peer-state` — Reports remote peer states for visualization

- **Universal Network Monitor (`mesh-cells-monitor-d3.html`):** A powerful D3.js-based visualization tool that displays the cellular mesh topology in real-time and monitors **all** network traffic from any GenosDB application sharing the same database name.

### Changed

- **RTC Configuration Structure:** The `rtc` option now supports an extended object format for cellular networks:
  ```js
  // Basic RTC (no cells)
  rtc: true
  
  // RTC with cells (default options)
  rtc: { cells: true }
  
  // RTC with cells and custom options
  rtc: { cells: { cellSize: 10, debug: true } }
  
  // RTC with relay URLs and cells
  rtc: { relayUrls: [...], cells: { ... } }
  ```

- **Module Loading:** GenosDB now dynamically loads either `genosrtc.min.js` (standard) or `genosrtc-cells.min.js` (cellular) based on the `rtc.cells` configuration.

- **Public API Extended:** The `db` object now exposes:
  - `db.room` — The underlying room for advanced P2P operations
  - `db.selfId` — The local peer's unique identifier
  - `db.room.mesh` — The cellular mesh instance (when cells enabled)

### Improved

- **Network Efficiency:** Message propagation now follows optimized paths through bridge nodes, reducing redundant transmissions by up to 80% in large networks.

- **Scalability:** Tested architecture supports large-scale networks with O(√N) connection overhead per peer instead of O(N).

- **Bandwidth Optimization:** Deduplication via seen-message caching prevents message storms during high-traffic periods.

### Technical Details

| Metric | Without Cells | With Cells |
|--------|---------------|------------|
| Connections per peer | O(N) | O(√N) |
| Message hops (worst) | 1 | O(√N) |
| Network overhead | High | Low |
| Memory per peer | High | Constant |

### Migration Guide

Existing applications continue to work without changes. To enable the cellular mesh:

```js
// Before (still works)
const db = await gdb('mydb', { rtc: true })

// After (with cellular mesh)
const db = await gdb('mydb', { 
  rtc: { 
    cells: true  // or { cellSize: "auto", ... }
  } 
})
```

### Notes

- The cellular overlay is backward-compatible. Peers with and without cells enabled can coexist in the same network, though optimal performance requires all peers to use the cellular configuration.
- For networks under 100 peers, the standard RTC mode (`rtc: true`) may be simpler and equally performant.
- The `mesh-cells-monitor-d3.html ` monitor tool is invaluable for debugging and understanding network topology during development.

## [0.11.8] - 2025-10-12

### Improved
- **High-Performance OPFS Worker:** The persistence layer has been re-architected for maximum performance. It now uses **Transferable Objects** when communicating with the main thread, virtually eliminating data-copying overhead. This results in significantly faster load times for large databases and prevents UI blocking.
- **Intelligent Lock Management:** The OPFS worker now employs a more sophisticated locking strategy. It correctly identifies that asynchronous reads are safe to perform in parallel without a lock, while strictly enforcing locks for all writes and synchronous reads. This enhances concurrency and read performance, especially when an application is open in multiple tabs.

### Fixed
- **Cross-Tab Data Integrity:** Fixed a critical race condition where simultaneous writes from different browser tabs could lead to data corruption in OPFS. The new worker now uses the **Web Locks API** to ensure all write operations to a given file are serialized, guaranteeing data consistency across all sessions.

### Changed
- **Internal Worker Refactor:** The underlying code for the OPFS/IndexedDB worker has been completely rewritten to be more robust, maintainable, and readable, incorporating modern JavaScript features and best practices.

## [0.11.0] - 2025-09-11
### Added
- Security: container signing for `deltaSync` and `fullStateSync` when SM is active; verification on reception if signatures are present. Backward compatible with unsigned containers.
- Clear sync logs:
  - 💥 [FALLBACK TRIGGERED] Peer is too far behind. Sending FULL state as deltas.
  - 🚀 [DELTA SYNC SENDING] Found N new operations to send.

### Changed
- Sync protocol frozen (SM-agnostic):
  - Removed the “peer ahead” heuristic.
  - Send deltas only when there are operations since the peer’s timestamp.
  - Fallback to `fullStateSync` only if the requester has no reference (null/undefined) or is too far behind (older than oplog’s oldest).
  - `fullStateSync` is accepted when timestamps are equal; it is ignored only if local state is strictly newer.
- Compression: both `deltaSync` and `fullStateSync` travel compressed (MessagePack + pako).
- Core stays SM-agnostic: removed any governance-related mutation from delta handling.

### Fixed
- A–B–C propagation: preserved-signature relaying ensures role updates propagate even if the original signer goes offline.
- Avoided unnecessary full fallback when peers are already up-to-date.

### Notes
- Existing apps remain compatible. Zero-trust is enforced at container level when signatures are present, without changing GDB’s wire protocol.

## [0.10.2] - 2025-09-03

### Fixed
- **Role Propagation Issue:** Resolved a critical bug where roles assigned by superadmins could be lost during P2P synchronization due to timestamp conflicts. The issue has been fixed to ensure roles propagate correctly across peers without being overwritten.

### Improved
- **Conflict Resolution for Roles:** Enhanced the LWW strategy to handle role assignments more effectively, maintaining Zero Trust while fixing propagation in distributed scenarios.

### Notes
- This fix ensures that once a superadmin assigns a role, it persists and propagates reliably, even in complex P2P networks with multiple

## [0.10.0] - 2025-09-02  <!-- Usa la fecha actual -->

### Added
- **Access Control Lists (ACLs) Module:** Introduced a new optional ACL submodule for the Security Manager (`sm`). This feature enables node-level permissions (read/write) for collaborative applications. Users can grant/revoke access to specific nodes, with automatic enforcement via middleware. Configured via `acls: true` in SM options. Compatible with existing roles and P2P sync.

### Improved
- **Security Manager Extensibility:** Enhanced `sm.js` initialization to support dynamic module attachment (e.g., ACLs), ensuring `gdb.sm` is extensible before loading submodules. This resolves potential "object not extensible" errors and improves module loading reliability.

### Fixed
- **Module Loading Synchronization:** Fixed async timing issues in `gdb.js` and `sm.js` where submodules (like ACLs) could fail to attach due to premature object freezing. Now uses `await` for proper sequencing.

### Notes
- ACLs is backward-compatible and opt-in. Existing apps continue working without changes.
- Tested with `notesdev.html` for collaborative note sharing with permissions.

## [0.9.8] - 2025-08-30

### Improved
- **Instantaneous P2P Network Startup:** The GenosRTC signaling layer has been completely re-architected to a non-blocking, hybrid model. The system now connects immediately to a base set of relays (either user-provided or a built-in default list) without any initial network delay, resulting in a significantly faster application startup and peer discovery process.
- **Proactive Network Resilience:** A smart, dynamic fallback mechanism has been introduced. In parallel to the initial connection, the system schedules a connection to a secondary set of community-vetted relays from a local cache. The delay for this fallback is intelligently adjusted based on the health of the initial connections, ensuring the peer network proactively strengthens itself and remains robust even if primary relays fail.
- **Efficient Relay Management:** The system now actively manages its relay connections. It automatically detects and disconnects from relays that require Proof-of-Work (PoW) or are unresponsive, ensuring that signaling resources are always focused on the healthiest and most performant communication paths.

### Changed
- **Removed Blocking Relay Fetch:** The previous architecture, which relied on a blocking `fetch` call to retrieve a list of relays at startup, has been eliminated. The new non-blocking approach ensures that the application's initialization is never delayed by slow or unavailable network resources.

### Fixed
- **Security Manager Decryption Bug:** Fixed an issue in `sm.js` where the `get` function incorrectly referenced `ssm.signer` (a non-existent property), preventing decryption of user-owned data even when the session was active. This caused failures in applications like `sm-auth-demo.html` when loading encrypted notes. The fix updates the verification to use `ssm.localUserEthAddress`, ensuring proper session checks and maintaining zero-trust security without exposing sensitive internals.

## [0.9.7] - 2025-08-26

### Added

- **Autonomous Governance Engine (`governanceRules`):** Introduced a new, optional Governance Module that allows for the automatic enforcement of high-level business logic and data policies across the database. The engine is configured by passing a `governanceRules` array in the `sm` options. Operated exclusively by a logged-in `superadmin`, the engine periodically evaluates these rules, leveraging the full power of the `gdb.map` query engine to identify and act upon nodes that meet specific criteria.

### Changed

- **`sm` Configuration Extended for Governance:** The Security Manager configuration object now accepts a `governanceRules` property. This array of rule objects allows developers to define conditional logic using the same query syntax as `gdb.map`, enabling powerful, declarative data policies (e.g., role promotions, state changes, etc.).

### Improved

- **Hybrid Query Architecture for Governance Rules:** The governance engine employs a highly efficient hybrid strategy for rule evaluation. It first uses `gdb.map` to perform an optimized pre-filtering of candidate nodes based on indexable `value` properties (like `role`). It then applies more complex, non-indexable checks (such as time-based conditions on `node.timestamp.physical`) in-memory on the much smaller, pre-filtered set. This approach minimizes computational load while enabling sophisticated, multi-faceted rule definitions.

### Security

- **Strict Super Admin Control Over Governance:** The governance engine is designed as a trusted system component. It can only be activated and operated by a `superadmin` user who has successfully authenticated. This ensures that all automated data transformations are initiated and controlled exclusively by the highest authority within the network, maintaining a clear and secure chain of command.

## [0.9.6] - 2025-08-25

### Security

- **Enhanced "Secure-by-Default" User Onboarding:** The security model has been upgraded to enforce a principle of least privilege. New users now join with a `guest` role, ensuring read-only access until a `superadmin` explicitly promotes them. This architectural choice provides administrators with granular control over write permissions from the very start.
- **Instantaneous Super Admin Recognition:** The authority of `superadmin` users is now derived directly and exclusively from the static client configuration. This change guarantees that their administrative privileges are recognized immediately upon login, locally and without any dependency on network synchronization, solidifying a robust and predictable root of trust for the entire network.

### Changed

- **Streamlined Security State Management:** The internal API for managing user sessions and cryptographic signers has been refactored for superior encapsulation. All state transitions now flow through a single, well-defined public method, which enhances system stability and eliminates potential race conditions during login and logout sequences.

### Improved

- **Architectural Clarity in Role Verification:** The logic for role verification is now clearly delineated. `Superadmin` authority is confirmed via a static, immutable configuration, while all other user roles are dynamically verified against the distributed database. This clear separation of concerns makes the security model more auditable and easier to reason about.

## [0.9.5] - 2025-08-24

### Changed

- **Security Manager (SM) Initialization Hardened:** The configuration for the SM module has been made stricter to ensure secure and correct setups.
  - The `rtc: true` option is now **mandatory** when enabling the SM module, reinforcing that its core security features operate in a P2P context.
  - The module must be initialized with a full configuration object, including the mandatory `superAdmins` array (e.g., `sm: { superAdmins: [...] }`).

### Improved

- **API Encapsulation and Clarity:** The public API of the Security Manager (`db.sm`) has been significantly streamlined. Internal helper and utility functions are now properly encapsulated, resulting in a cleaner, more focused, and easier-to-use API for developers.
- **Bundle Size Reduction:** The improved encapsulation enhances tree-shaking, which can lead to a smaller final bundle size for applications that include the Security Manager module.

## [0.9.3] - 2025-08-21

### ⚠️ Breaking Change

- **P2P/RTC networking now requires explicit activation:**  
  The `rtc` flag must be set to `true` in the `gdb()` factory options to enable real-time P2P synchronization.  
  If omitted, the database will operate in local-only mode and will not connect to the network or relays.
  **Migration Guide:**  
  Update your initialization:
  ```js
  const db = await gdb("myDB", { rtc: true })
  ```
  Apps relying on automatic network sync must update their configuration to restore previous behavior.

### Changed

- **`relayUrls` and `turnConfig` options are now passed inside the `rtc` object:**  
  To customize relay URLs or TURN configuration, use:
  ```js
  const db = await gdb("myDB", {
    rtc: {
      relayUrls: ["wss://relay1.example.com", "wss://relay2.example.com"],
      turnConfig: [
        /* TURN server config objects */
      ],
    },
  })
  ```
  If you only want to enable RTC with default settings, simply use `rtc: true`.

### Improved

- Significantly reduced bundle size: GenosRTC is now dynamically imported only if RTC is required.
- Prevents unwanted network connections, improving privacy and audit scores.

## [0.9.0] - 2025-08-21

### ⚠️ Breaking Change

- **P2P/RTC networking now requires explicit activation:**  
  The `rtc` flag must be set to `true` in the `gdb()` factory options to enable real-time P2P synchronization.  
  If omitted, the database will operate in local-only mode and will not connect to the network or relays.
  **Migration Guide:**  
  Update your initialization:
  ```js
  const db = await gdb("myDB", { rtc: true })
  ```
  Apps relying on automatic network sync must update their configuration to restore previous behavior.

### Improved

- Significantly reduced bundle size: GenosRTC is now dynamically imported only if RTC is required.
- Prevents unwanted network connections, improving privacy and audit scores.

## [0.8.5] - 2025-08-20

### Added

- **Audit Parameter:** Introduced the `audit` parameter to the database factory. This enables real-time auditing of the operation log (oplog) using AI. The audit module can analyze, detect, and act on patterns or prohibited content in oplog entries, providing automated moderation and data integrity features.

## [0.8.3] - 2025-08-19

### Added

- **Modular Extension Support:** The GDB core now allows the creation and integration of new custom modules in a simple and secure way. The architecture enables extension without modifying the core.

### Changed

- **Secure Public API:** The public API exposes only the minimal resources required for extension and operation, without revealing internal method names or sensitive details, strengthening security and encapsulation.

### Notes

- Indexing modules are fully compatible with version 0.8.0 and above.

## [0.8.0] - 2025-08-19

### Added

- **Configurable Persistence Delay:** Added a `saveDelay` option to the `gdb()` factory function, allowing fine-grained control over the OPFS save debounce timing. This improves the balance between performance and data persistence.
- **Configurable Oplog Size:** Introduced the `oplogSize` option to configure the operation log's capacity, enabling optimization of delta-sync performance based on application needs.

### Changed

- **Unprecedented Write Performance:** The core engine's debouncing and asynchronous architecture have been optimized to handle extreme write loads. GDB can now process tens of thousands of operations per second across all modern browsers without blocking the main UI thread, ensuring a fluid user experience.
- **Performance:** Refactored the `createDebouncedTask` utility to be more concise and efficient. It continues to leverage `requestIdleCallback` to minimize main-thread impact during background tasks.

### Fixed

- **High-Throughput Stability:** Addressed potential UI hangs during massive batch operations. It is now recommended to set `saveDelay: 0` for such scenarios to ensure maximum stability and immediate persistence.

## [0.7.3] - 2025-08-18

### Fixed

- Fixed a bug affecting WebAuthn registration and login flows, which was introduced after refactoring core security modules to a factory pattern. This ensures that WebAuthn-protected identities can be created and accessed reliably.

### Notes

- If you encounter a similar error after updating, force a cache-less reload of your browser or append a version suffix to your import during development.

## [0.7.2] - 2025-08-18

### Changed

- Security modules moved to lightweight factory functions: `SoftwareSecurityManager` and `SoftwareWalletManager`. Public APIs preserved and behavior unchanged.
- `sm.js` updated to use the new factories, with idempotent middleware registration and a safer activation flow for signing/verification.
- Configuration is now passed explicitly as function parameters from GDB into composed modules (e.g., `sm`), avoiding hidden globals and enabling cleaner composition and testing.

Example (passing Security config into SM from GDB):

```js
const db = await gdb("rbacChatAppDB", {
  sm: {
    superAdmins: SUPERADMIN_ADDRESSES,
    customRoles: CHAT_APP_ROLES,
  },
})
const { sm } = db // Access the Security Manager
```

### Improved

- `sm.js` hardening around the middleware and storage path: middleware always returns an array; stable base IDs in `put()`; avoidance of double ID prefixes; `put()` returns the base ID consistently.
- Logging consistency across GDB core and Security Manager with unified icons/severity (❌/⚠️/✅/ℹ️). Messages during WebAuthn and security activation are clearer and less ambiguous.

### Fixed

- Avoided edge cases where `sm.put()` could generate malformed IDs.

### Notes

- Public `gdb.js` API unchanged. Builds passed; bundle sizes remain approximately the same.

## [0.7.0] - 2025-08-18

### ⚠️ Breaking Change

- Migrated GenosDB to an async factory function. You must now initialize the database using `const db = await gdb(...)` instead of `new GDB(...)`. This change enables asynchronous setup, better error handling, and future extensibility for remote and dynamic backends.

### Improved

- All database initialization is now promise-based, allowing for more robust startup flows and integration with async application logic.
- Updated documentation and examples to reflect the new async initialization pattern.

### Migration Guide

- Replace all instances of `new GDB(...)` with `await gdb(...)`.
- Ensure your application entry points and database-dependent logic are inside an `async` function or properly handle promises.

### Why?

- This change prepares GenosDB for advanced features such as remote initialization, dynamic configuration, and improved error reporting. It also aligns with modern JavaScript best practices for resource-heavy or network-dependent modules.

## [0.6.3] - 2025-08-13

### Improved

Optimized the peer synchronization protocol. The connection flow has been redesigned, making the newly connecting client responsible for initiating the sync process. This prevents the initial "sync storm," reducing network overhead and making the network join process more robust and efficient.

### Fixed

Fixed a critical synchronization loop that caused redundant data requests. A client reconnecting after being offline was not correctly updating its sync state (globalTimestamp), causing it to repeatedly request the same deltas or the full graph.
As a result of the above fix, the visual "flickering" effect in client applications has been resolved. Data is now processed in a single, coherent batch, ensuring smooth and atomic UI updates.

## [0.6.1] - 2025-08-11

### Fixed

- **RBAC Compatibility:** Restored full RBAC functionality by adapting the security module to the new GenosRTC P2P layer. The `rbac.js` component now correctly intercepts and signs outgoing messages via `syncChannel.send`, ensuring that role-based security and data signing operate as intended with the new architecture.

## [0.6.0] - 2025-08-11

### ⚠️ Breaking Change & Major Architectural Evolution

- **New Channel-Based Communication Architecture:** GenosRTC introduces a brand-new, event-driven real-time communication layer built from the ground up. All P2P interactions are now managed through a robust `channel` primitive, offering a unified, clear, and powerful interface for real-time data exchange.
  - **Example:** `const channel = room.channel('type'); channel.on('message', ...);`

### 🚀 Key Features & Capabilities

- **Standardized Event-Driven API:** The `channel` object delivers complete data payloads via the `on('message', ...)` event, providing a predictable and consistent interface for incoming data handling.
- **Built-in Transfer Progress Monitoring:** Supports an `on('progress', ...)` event for real-time monitoring of large data transfers without extra implementation.
- **Incomparable Network-Level Robustness:** Data transmission includes automatic timeouts and intelligent retries to prevent deadlocks and ensure reliability under unstable network conditions.
- **Encapsulated and Organized Communication:** Each communication type is fully encapsulated within its own `channel` object, formalizing data flow, reducing complexity, and strengthening overall system stability.

## [0.5.0] - 2025-08-10

### 🚀 Features & Major Enhancements

- **Introduced Recursive Graph Traversal Queries:** The query engine has been fundamentally enhanced with the new, recursive `$edge` operator. This powerful feature allows you to use an initial query to find starting points, then explore the entire descendant graph to return a complete list of all connected nodes that match a powerful sub-query. It resolves complex, multi-hop traversal logic within a single, declarative statement, eliminating the need for manual, client-side lookups.

### Changed

- **Internal Query Engine Architecture:** The core query processor has been re-architected to natively support recursive graph traversal. This architectural enhancement allows the query engine to evaluate and follow relational paths, making the new `$edge` operator possible within the `.map()` method.

## [0.4.3] - 2025‑08‑09

### 🚀 Features & Enhancements

- **Added `relayUrls` option to `GDB` constructor** — When provided, this replaces the default relay list and overrides relayRedundancy.

## [0.4.2] - 2025-08-08

### 🐛 Bug Fixes & Security Improvements

- **Fixed Critical P2P Authority Bug for Super Admins:** Resolved a fundamental flaw where a `superadmin` was incorrectly treated as a `guest` by receiving peers, causing legitimate administrative actions to be rejected. The permission system now correctly recognizes `superadmin` authority directly from the static configuration, allowing them to operate across the network without needing a pre-existing user node in the database.
- **Refactored and Simplified Permission Verification Logic:** The `verifyIncomingOperations` method in the `SecurityManager` has been significantly refactored. The complex, multi-stage logic for determining a sender's role has been replaced with a cleaner, hierarchical model. This not only fixes the Super Admin bug but also makes the entire permission validation process more robust and easier to audit for all roles.

### 🏛️ Architectural Notes & Security Design

- **Clarified "Source of Truth" for Permissions:** This version solidifies the security model for role-based permissions:
  1.  **Static Source of Truth (for Super Admins):** The ultimate authority for `superadmin` roles is the static list provided in the client configuration. This list is immutable during runtime and acts as the "root of trust" for the entire network, following a **Gobernanza por Consenso de Software** model. Each peer independently validates incoming super-admin actions against its own local copy of this list.
  2.  **Dynamic Source of Truth (for all other roles):** The authority for all other roles (`admin`, `manager`, `user`, etc.) is derived from data written to the distributed database itself (i.e., `user:*` nodes). These roles can only be assigned by a user who already holds the `assignRole` permission (typically a `superadmin`), creating a secure and auditable chain of trust.

## [0.4.1] - 2025-08-07

### 🐛 Bug Fixes & Stability Improvements

- **Fixed Critical RBAC Signature Verification Failure:** Resolved a bug where signature validation for incoming operations would incorrectly fail. The process for reconstructing the data payload for verification now correctly matches the payload that was originally signed, making P2P security checks reliable.
- **Resolved Distributed Permission Paradox in Delta Sync:** Corrected a critical logic flaw where a user could not receive their own role update from an authorized peer. The `SecurityManager` now correctly bases all permission checks for operations inside a delta on the **sender's role**, not the receiver's, ensuring permission changes propagate correctly across the network.
- **Enhanced RBAC Action Mapping:** Improved the `mapChangeTypeToRbacAction` helper function to be context-aware. It can now correctly distinguish a specific `assignRole` action from a generic `write` action, which was essential for fixing the permission paradox.

### Changed

- **Refactored Permission Logic:** The core permission validation logic within the `SecurityManager` has been refactored to be clearer and more robust, consistently using the sender's authority as the single source of truth for all permission checks.

## [0.4.0] - 2025-08-06

### 🚀 Features & Major Enhancements

- **Delta Synchronization Engine:** This version introduces a complete architectural overhaul of the P2P synchronization mechanism. GenosDB now uses a sliding-window Operation Log (Oplog) to exchange only the minimal set of required changes (deltas) between peers. This drastically improves network efficiency, reduces bandwidth consumption by up to 90%+, and makes real-time sync significantly faster, especially for large databases.
- **Robust Full-State Sync Fallback:** A smart fallback system has been implemented. If a peer is too far out of sync to be updated via deltas (e.g., after being offline for a long time), the system automatically detects this and sends the full, current state of the graph. This guarantees eventual consistency under all circumstances.
- **Compressed Delta Payloads:** All delta-sync network payloads are now compressed using `pako` (deflate) before transmission, further optimizing network performance and reducing latency.

### 🐛 Bug Fixes & Stability Improvements

- **Resolved Cross-Session Sync Corruption:** Fixed a critical bug where a rejoining peer could accidentally overwrite a more recent database state due to incorrect timestamp management on initialization. The system is now fully resilient to this scenario.
- **Eliminated Repetitive Sync Loops:** Corrected an issue where a peer could get stuck in a loop requesting deltas it had just received. `globalTimestamp` management is now more robust, ensuring a peer only requests data it genuinely lacks.
- **Enforced Strict Conflict Resolution:** Conflict resolution logic (LWW-CRDT) is now rigorously applied to all remote write operations (`upsert`, `remove`, `link`), preventing outdated messages from causing data loss.

### Changed

- **Internal Sync Protocol:** The internal `sync` message now initiates the new, more sophisticated delta-sync handshake protocol.

## [0.3.0] - 2025-08-05

### Changed

- Internal write operations now use a more descriptive `upsert` type instead of `insert`.
- Added backward compatibility to accept `insert` operations from older clients to ensure smooth network transition.

### Added

- Improved clarity and robustness in the internal write logic.

## [0.2.4] - 2025‑07‑30

### ⚠️ Breaking Change

- Package renamed from `gdb-p2p@0.2.3` to `genosdb@0.2.4`.
- Update imports accordingly:
  ```diff
  - import { GDB } from "gdb-p2p"
  + import { GDB } from "genosdb"
  ```

## [0.2.0] - 2025-07-30

### ⚠️ Breaking Change

- The database class has been renamed:

  ```js
  // Before
  import { GraphDB } from "gdb-p2p"
  const db = new GraphDB "todoList"

  // Now
  import { GDB } from "gdb-p2p"
  const db = new GDB "todoList"
  ```

## [0.0.31] - 2025-03-15

### Added

- New `put()` method for node creation.
- Link functionality for relationships between nodes.

### Fixed

- Fixed data deletion bug causing synchronization corruption with OPFS.

## [0.0.2] - 2025-05-05

### Changed

- Improved OPFS Worker module.
