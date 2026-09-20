---
name: genosdb
description: Build applications on GenosDB — the serverless, peer-to-peer graph database for the browser with a zero-trust Security Manager. Use whenever code imports "genosdb", calls gdb(...), db.put / get / map / link, db.room channels, db.sm (roles, ownership, ACLs, passkeys, encrypted records, governance), or runs the Fallback Server (genossrv). Covers the frozen API, data modeling and realtime-UI patterns, the security model, how to prove peer-to-peer sync in tests, and how to diagnose "it doesn't sync".
---

# GenosDB — building applications

**Applies to `genosdb@0.36.2`.** This skill ships in the same commit as the engine. If the version in your `package.json` is newer, read the [CHANGELOG](https://github.com/estebanrfp/gdb/blob/main/CHANGELOG.md) for what changed since.

GenosDB is a graph database that runs entirely in the browser (OPFS, cross-tab), syncs peer to peer over WebRTC with Nostr signaling, and decides authorization on every device: **every operation is signed by its author and verified by every peer that receives it, and nothing a peer cannot verify is applied.** There is no server in the data path. The optional Fallback Server is an always-on peer that adds availability, never authority.

The public API is **frozen**. Never invent a method, an option or an operator: everything an application needs is in these files. `types/index.d.ts` in the package is the surface; the docs are its meaning.

**When GenosDB is the wrong tool** — say so instead of forcing it: a single authoritative server-side database with SQL, joins and transactions across tables; data that must be available when *no* client is online and nobody will run the always-on peer; authorization that must be enforced by a server rather than verified cryptographically at every peer; a dataset too large for a full replica in every browser.

## Files

| file | read when |
|---|---|
| [API.md](API.md) | you write any call — boot options, nodes, queries, `db.room`, `db.sm`, the Fallback Server |
| [PATTERNS.md](PATTERNS.md) | you model data, build a realtime UI, paginate, order a list, do presence, pick an app shape, bundle |
| [SECURITY.md](SECURITY.md) | the app has users — roles, ownership, ACLs, encryption, passkeys, governance, and the threat model |
| [TESTING.md](TESTING.md) | you must prove that peers sync — Playwright, one browser context per peer, nothing faked |
| [PITFALLS.md](PITFALLS.md) | "it doesn't sync", clocks, relays, caches, and the traps that cost hours |

## Boot — the one call

```js
import { gdb } from "genosdb"                 // CDN: https://cdn.jsdelivr.net/npm/genosdb@<version>/dist/index.min.js
const db = await gdb("room-name", {            // never `new GDB()`; top-level await is fine
  rtc: true,                                   // or { relayUrls, turnConfig, cells: true | { cellSize } }
  sm: { superAdmins: ["0x…"], acls: true },    // optional: identity, roles, ownership, ACLs, passkeys, governance
  debug: true,                                 // the only way to see the engine's own logs
})
```

The **name is the room**: every peer that opens the same name replicates the whole graph. Separate sharing scopes are separate names. One instance per page.

## Ten rules that prevent the usual disasters

1. **A node is the unit of concurrency.** One node per paragraph, card or item; order siblings with a fractional `rank` field, never by array position. Two edits to one node at the same instant keep both contributions (the loser's rescue), but separate nodes are simpler and always safe.
2. **`put` replaces the whole value.** Update one field by spreading the current value: `db.put({ ...node.value, done: true }, id)`.
3. **One subscription per view, for the life of the page.** Never re-subscribe inside a session callback. Handle `initial / added / updated / removed` explicitly and let the engine sort and window; the DOM is the state.
4. **A guest's write succeeds locally and every other peer refuses it.** With `sm`, a new identity is a `guest` until a superadmin's signed decision promotes it. "It doesn't sync" is almost always this: fix the constitution, not the `map` wiring.
5. **Give nodes an owner.** `value.owner = address` makes the engine name the id `${owner}:…`, and every peer enforces that only the owner and its collaborators may create, write, link or delete it.
6. **A collaborator writes content, never policy.** A non-owner's write must carry `owner`, `collaborators` and the envelope table unchanged, or every peer refuses it. Spreading the previous value does exactly that.
7. **The room replicates everything to everyone.** Confidentiality is cryptographic — encrypted records (`db.sm.put`) or a sealed field (`encryptDataForCurrentUser`) — never topological.
8. **Channel messages are transport, not facts.** Presence, cursors, typing go on `db.room.channel`; anything that must persist or be authorized goes in the graph. To label who is saying something *now*, `db.sm.sign` / `db.sm.verify`.
9. **A peer's value renders as text.** `textContent`, never `innerHTML`, for anything another peer wrote: no server sits between the writer and the reader.
10. **Never `alert()`, `confirm()` or `prompt()`** in a syncing page: they block the thread and the sync being demonstrated. A toast for results, `<dialog method="dialog">` for questions.

## Check the bundle you are building against

The engine ships minified; what it does is written down in [CRYPTOGRAPHY.md](https://github.com/estebanrfp/gdb/blob/main/CRYPTOGRAPHY.md) and checkable without trusting anyone. From a clone of the public repository:

```bash
npm pack genosdb@latest && tar xzf genosdb-*.tgz
node tests/vectors/verify.mjs --dist package/dist      # 98 checks re-derived from the spec, no GenosDB code
```

## Sources of truth, in order

1. `types/index.d.ts`, in the package — the surface.
2. [docs/index.md](https://github.com/estebanrfp/gdb/blob/main/docs/index.md) — the API reference and every module guide.
3. [CRYPTOGRAPHY.md](https://github.com/estebanrfp/gdb/blob/main/CRYPTOGRAPHY.md) and [SECURITY.md](https://github.com/estebanrfp/gdb/blob/main/SECURITY.md) — what is signed, verified and encrypted; the threat model; the verified guarantees.
4. [CHANGELOG.md](https://github.com/estebanrfp/gdb/blob/main/CHANGELOG.md) — what changed, when, and why.
5. [docs/genosdb-examples.md](https://github.com/estebanrfp/gdb/blob/main/docs/genosdb-examples.md) — the reference applications. When an example and a guide disagree, the example is right.
