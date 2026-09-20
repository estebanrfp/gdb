# API — the frozen surface

Everything here is declared in `types/index.d.ts` and documented in [docs/genosdb-api-reference.md](https://github.com/estebanrfp/gdb/blob/main/docs/genosdb-api-reference.md), [docs/sm-api-reference.md](https://github.com/estebanrfp/gdb/blob/main/docs/sm-api-reference.md), [docs/sm-acls-module.md](https://github.com/estebanrfp/gdb/blob/main/docs/sm-acls-module.md), [docs/governance.md](https://github.com/estebanrfp/gdb/blob/main/docs/governance.md) and [docs/genosrtc-api-reference.md](https://github.com/estebanrfp/gdb/blob/main/docs/genosrtc-api-reference.md). Nothing else exists.

## `await gdb(name, options?)` → `db`

| option | meaning |
|---|---|
| `rtc` | `true` for defaults, or `{ relayUrls?: string[], turnConfig?: RTCIceServer[], cells?: true \| { cellSize?: "auto" \| number, debug?: boolean } }`. Without it the database is local only (OPFS + cross-tab BroadcastChannel), keeps no send queue and signs nothing. |
| `sm` | `{ superAdmins: string[], customRoles?, governanceRules?, acls?: true, resume?: boolean }`. Needs `rtc` to mean anything on the wire. |
| `password` | Optional room password: encrypts the signaling handshake so only peers holding it can join. Not data encryption. |
| `debug` | `true` shows the engine's logs (`[SYNC-AUTH] … denied`, persistence, sync). Default `false`. |
| `saveDelay` | Debounce, ms, for persisting graph and oplog; flushed when the page goes hidden. Default `200`. |
| `oplogSize` | Operations kept for delta sync. Default `200`. |

Relays: with no `relayUrls` the peer fetches the public list at boot (cached in localStorage) and says so in the console when it cannot; one relay is enough. `turnConfig` for NAT traversal. Cellular Mesh (`cells`) is for rooms of 100+ peers: the same setting on every peer and on the Fallback Server (`--cells`); small rooms are one cell.

## Nodes and writes

A node is `{ id, value, edges, timestamp }`; `timestamp` is a hybrid logical clock `{ physical, logical }` — dates come from `timestamp.physical`. `edges` is the resolved list of ids this node links to: only targets this peer holds appear.

- `await db.put(value, id?)` → `id`. Generated ids are random UUIDs; if `value.owner` (or `value._meta.owner`) is set, the generated id is `${owner}:${uuid}` — an **owned id**, enforced on every peer. `put` **replaces the whole value**.
- `await db.remove(id)` — edges pointing at it vanish from every read; recreating the id restores its relations.
- `await db.link(a, b)` / `db.unlink(a, b)` — the directed edge `a → b`, stored on `a`; both nodes must exist (else a warning, no write). A mutual relation is two links. With `sm`, every link/unlink signs the resulting edge set of the source.
- `await db.clear()` — the local copy and its history; under `rtc` the data comes back from any peer that holds it.
- `db.use(async (operations, previousStates) => operations)` — middleware over incoming P2P batches; return the filtered batch, or nothing to drop the message. Filtering only: authorization is the gate's and runs regardless.

Concurrency: last-write-wins per node by the clock, deterministic tie. When two peers write the same node over the same base at the same instant, the store keeps the winner and the peer whose write lost merges base, its value and the winner — fields from whoever changed them, the one region each side changed in a string, the winner's for the same span or for any value that changes as a whole (a hash, a ciphertext) — and writes the merge as an ordinary signed `put`.

## Reads

- `const { result } = await db.get(id)`; reactive: `const { result, unsubscribe } = await db.get(id, node => …)`. The callback fires with the node now — `null` if the peer does not hold it yet — then again whenever the node's own clock moves, and `null` once when it is removed, after which the subscription ends. Subscribing before the node arrives is fine.
- `db.map(options?, callback?)` — either argument, any order; a callback turns realtime on unless `realtime: false`. Returns `{ results, unsubscribe? }`.
  - `options`: `query` (default all), `field` + `order` (`"asc"` default; strings collate, others numeric, missing → 0; a tie on `field` breaks on the node id in the same direction), `$limit`, `$after` / `$before` (cursors — a node id; only meaningful with an explicit `field`), `realtime`.
  - The callback receives **one event per node**, never an array: `{ id, value, edges, timestamp, action }`, `action` ∈ `initial` (once per current match, delivered sorted) · `added` · `updated` (value, edges or timestamp changed) · `removed` (`value` is `null`). With `$limit`, entering or leaving the window also emits `added` / `removed`.
- Notifications coalesce per animation frame; a hidden tab emits nothing until visible.

## Query language (inside `query`)

- A field literal is equality; dotted paths work (`"location.latitude"`). A key absent from `value` falls back to the node root: `{ id: /^user:/ }`, `{ "timestamp.physical": { $gt: t } }`. RegExp literals keep their flags.
- Comparison: `$eq $ne $gt $gte $lt $lte $between [a, b] $in [..] $exists`. An array field matches `$in` on any overlap.
- Text: `$startsWith $endsWith $contains`; `$text` (accent- and case-insensitive, punctuation stripped) is **field-level**: `{ title: { $text: q } }`, several fields through `$or`; `$like` (`%` `_`) and `$regex` are case-insensitive.
- Logic: `$and $or $not`.
- Geo: `{ location: { $near: { latitude, longitude, radius /* km */ } } }` — the value carries `latitude`/`longitude` or `location.{latitude,longitude}`; a bounding box is `$between` on both.
- `$edge`: the rest of the query selects the **start nodes**; `$edge: { … }` is applied to every **descendant** (outgoing edges, any depth, cycle-safe, missing targets skipped). The result is the matching descendants, deduplicated; `field / order / $limit` apply to them.

## `db.room` — ephemeral traffic (present with `rtc`; `db.selfId` is this peer)

- `const ch = db.room.channel(name)` — name UTF-8, at most 12 bytes. `ch.send(data, targets?, meta?, onProgress?)` (`meta` only with a binary payload; large payloads are chunked and compressed) · `ch.on("message", (data, peerId, meta) => …)` · `ch.on("progress", (fraction, peerId, meta) => …)` · `ch.off(event, handler)`.
- Events on the room: `peer:join (peerId, type?)` and `peer:leave (peerId)` are **connections** (`type === "superpeer"` is the Fallback Server, informational only); `peer:seen (peerId, type?)` and `peer:lost` are **presence** by relay announces (`seen` re-fires as a heartbeat, `lost` is the explicit farewell); `stream:add (stream, peerId, meta)`, `track:add (track, stream, peerId, meta)`; Cellular Mesh: `mesh:state`, `mesh:peer-state`.
- `getPeers()` → object keyed by peer id · `ping(peerId)` → RTT ms · `leave()` (the engine already leaves on `beforeunload`).
- Media: `addStream(stream, targets?, meta?)`, `removeStream(stream, targets?)`, `addTrack(track, stream, targets?, meta?)`, `removeTrack(track, targets?)`, `replaceTrack(oldTrack, newTrack, targets?, meta?)`.
- `db.room.mesh` (with `cells`): `send / on("message") / getState() / ping / getPeerInfo / getStableRoster / getKnownCells / getCellSize / destroy`.

## `db.sm` — the Security Manager (present with `sm`)

**Identity.** `startNewUserRegistration()` (a volatile identity and its mnemonic) · `loginOrRecoverUserWithMnemonic(m)` (one method for both) · `protectCurrentIdentityWithWebAuthn()` (a passkey; **returns `null` when the authenticator has no PRF extension** — the session stays a mnemonic session) · `loginCurrentUserWithWebAuthn()` · `hasExistingWebAuthnRegistration()` · `isCurrentSessionProtectedByWebAuthn()` · `isSecurityActive()` · `getActiveEthAddress()` · `getMnemonicForDisplayAfterRegistrationOrRecovery()` (one-time display right after registration or recovery) · `clearSecurity()` (logout) · `abbrAddr(address)`.

`setSecurityStateChangeCallback(({ isActive, activeAddress, abbrAddr, isWebAuthnProtected, hasVolatileIdentity, hasWebAuthnHardwareRegistration }) => …)` is the **single source of truth for session UI**: it fires immediately and on every change, so every branch must be idempotent and derived from the state, never from local flags.

**Roles.** `assignRole(address, role, expiresAt?)` — a superadmin's signed decision; the newest decision is the role on every peer, an older one never rolls a node back, and a re-delivered one is a no-op. `executeWithPermission(name)` checks a permission (inheritance honoured) for application-defined operations such as `publish`. `setGovernanceStateChangeCallback(cb)`.

**Ownership and ACLs** (`sm: { acls: true }`) — `db.sm.acls.set(value, id?)` (owner and collaborators are engine-managed: stripped from the value and re-based on the node) · `grant(nodeId, address, "read" | "write" | "delete")` (owner only; `read ⊂ write ⊂ delete`; one level per address, granting again replaces it) · `revoke(nodeId, address)` (owner only) · `getPermissions(nodeId)` → `{ owner, collaborators } | null` · `delete(nodeId)` (owner or a `delete` collaborator).

**Encrypted records.** `db.sm.put(value, id?)` seals the whole value under a per-record key wrapped for each reader · `db.sm.get(id, cb?)` decrypts for any session holding an envelope (`decrypted: false` plus ciphertext otherwise; reactive like `db.get`) · `db.sm.map(options)` decrypts then queries, **no realtime** · `db.sm.remove(id)`. Sharing is `acls.grant` (adds an envelope; the target must have signed in once), unsharing is `acls.revoke` (rotates the key; forward-only). Ids come back without the internal prefix and work in `db.link` / `unlink`.

**Sealed field.** `encryptDataForCurrentUser(data)` → a string to store in an ordinary node field; `decryptDataForCurrentUser(str)` — throws for anyone else, which is the ownership test. Cannot be shared.

**Signed values for the channel.** `await db.sm.sign(value)` → `{ kind: "app", from, at, value, signature }`; `db.sm.verify(envelope, maxAge = 60_000)` → the `from` address when the signature holds and `at` is within `maxAge` ms of now, else `null`. Who said something and when — never authorization, which stays the graph's. Throws without a session.

## Fallback Server — an always-on peer, in the package

```bash
bun node_modules/genosdb/dist/genossrv.min.js <name> [--cells] [--room] [--relay]
```

| | |
|---|---|
| `<name>` / `GDB_ROOM` | the database name the browsers open |
| `--cells` / `GDB_CELLS=1` | required when browsers use `rtc: { cells }` |
| `--room` | also join `db.room` (appears in presence as `type: "superpeer"`) |
| `--relay` / `GDB_RELAY=1` | serve an embedded signaling relay on `$PORT` (default 8080); point clients' `relayUrls` at it and nothing leaves your infrastructure |
| `GDB_DB_PATH` | SQLite file (default `./data.sqlite`) |
| `GDB_SM_KEY` | a BIP39 mnemonic or a `0x` private key: the server signs as that identity — list its address in the clients' `superAdmins` |
| `GDB_SUPERADMINS` | the same list the clients ship |
| `GDB_SM_RULES` | governance rules as inline JSON, or a path to the same rules module the app uses — the engine then runs 24/7 |
| `GDB_RELAY_URLS` | mirrors `rtc.relayUrls` |

As a module: `gdbServer(name, options, dbPath)` with the same option shapes as `gdb()`. Redeploy it together with the clients on every engine update.
