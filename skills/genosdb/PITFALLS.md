# Pitfalls — "it doesn't sync", and the traps that cost hours

## It doesn't sync — check in this order

1. **`debug: true`.** A line `[SYNC-AUTH] … denied (0x… as guest, owner 0x…)` is the authorship gate speaking: the signer is an unpromoted `guest`, or the node belongs to another identity. Fix the constitution (`superAdmins`, `customRoles`, a promotion), not the `map` wiring.
2. **Both windows visible, in real browsers.** Notifications coalesce per animation frame; a hidden tab emits nothing until it is visible again, and an embedded preview pane hides rAF entirely.
3. **Relays.** The console says when no relay list was fetched; `rtc: { relayUrls: ["wss://…"] }` pins one. A peer whose clock is more than **60 s** off is invisible through a relay: Nostr `created_at` is filtered against the subscriber's clock.
4. **The same transport on every peer and on the Fallback Server** — `cells` versus full mesh — and the same `superAdmins` and `customRoles` everywhere.
5. **Clocks.** An operation stamped more than **two hours ahead** of a receiver's clock is refused, never clamped. A peer with a wrong clock sees its own writes and nobody else does.
6. **One subscription** (not re-created on a session change); **no `leave()` on `pagehide`** (a frozen tab would drop the peer; the engine already leaves on `beforeunload`); **one channel** multiplexing every ephemeral kind.
7. **A wire-breaking release** (0.23, 0.27, 0.28, 0.32, 0.33, 0.36.0) needs every peer of the room updated together. A superadmin signing in once re-signs its own older state.

## Traps

- **Two tabs of one origin are one peer.** They share OPFS, localStorage and BroadcastChannel; "it synced" between them proves nothing about WebRTC. Use two browsers, or one BrowserContext per peer.
- **Without `rtc` there is no queue and no signature.** A local-only database applies and persists writes but neither signs nor queues them; reopening it with `rtc` later does not ship what was written as signed operations. A partitioned peer must be *online with nobody to hear it* — an unreachable relay — not local-only.
- **`db.clear()` is local.** Under `rtc` the data returns from any peer that holds it. Seed demo data with fixed ids and remove node by node.
- **A generated id is a random UUID, not a content hash.** Two `put`s of the same value make two nodes. Choose ids when identity matters.
- **`$text` is field-level only** — `{ title: { $text: q } }`, several fields through `$or`. **`$edge` selects descendants** of the nodes the rest of the query matches: parent in the main query, the children's filter inside `$edge`; inverted, it returns nothing.
- **`db.sm.map` has no realtime.** It decrypts, then queries, one call per read. When the UI must update live, keep the node public and reactive under `db.map` and seal only the private field with `encryptDataForCurrentUser`.
- **`grant` needs a published key.** The target must have signed in once on any peer, or `grant` throws `has no published key yet`.
- **Passkeys need a secure context *and a domain*.** `127.0.0.1` throws `SecurityError`; gate with `isSecureContext && PublicKeyCredential && !/^\d{1,3}(\.\d{1,3}){3}$/.test(location.hostname)`. Without the PRF extension `protectCurrentIdentityWithWebAuthn()` returns `null` and the session stays a mnemonic session — say so in the UI instead of reporting it protected.
- **A mnemonic session lives in memory** and dies on reload; a passkey session resumes silently on reload (`sm: { resume: false }` asks the authenticator every load; a *new tab* always needs `loginCurrentUserWithWebAuthn`, triggered by the user). A second `gdb` instance in the same page re-initialises the Security Manager and clears the active signer.
- **`@latest` on the CDN is cached at the edge for about twelve hours** after a publish. Pin a version in production; `@latest` is for demos.
- **A superadmin cannot moderate an owned node it was not granted.** Moderation is granted, never inherited: grant `delete` at creation if the application needs it.
- **Governance versus terms.** A rule's decision writes the role without `expiresAt`; a role assigned by hand with a term becomes permanent as soon as a rule matches its node, and an expired identity keeps its `role` label, so a rule matching that label revives it. Keep standing rules to the tiers below the ones you assign by hand, floor rule included.
- **`send` on a channel** rejects when it cannot deliver in a full-mesh room and always resolves in a Cellular Mesh room (best effort by design): never build retries on it.
- **In a Cellular Mesh room `peer:leave` is a connection closing**, not a departure. Model presence on `peer:seen` / `peer:lost` (`seen` re-fires about every 30 s as a heartbeat) and deduplicate.
- **`acls.set` refuses a `delete`-collaborator on its local guard**; that writer updates with `db.put({ ...node.value, … }, id)`, which every peer accepts because the policy fields travel unchanged.
