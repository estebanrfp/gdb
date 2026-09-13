# GenosDB Decisions

The design questions that are closed, each with the alternatives that were considered and rejected. A proposal that matches a rejected alternative is already answered: the engine reopens a question only on a violated invariant ([invariants.md](invariants.md)) or on the maintainer's explicit word. Versions are the release that decided; pins are in the invariants file.

### 1. One gate on every path (0.32.0)
**Decision.** A single authorship gate judges every operation — live, hydrated delta, full state — against the local node, after the resolver, on what would be applied. The Fallback Server and the native port run the same function.
**Why.** Catch-up used to apply by clock alone, so any peer could inject or delete data by relaying it. One function is one rule to verify, one battery to pin, one parity check.
**Rejected.** Per-path checks (three rules drift into three bugs); trusting the relaying peer (the relay is hostile by threat model); verifying at send time only (the receiver decides on its own copy).

### 2. Receipts stay on the node; operations travel as themselves (0.32.0, 0.35.2)
**Decision.** A node keeps the receipt of the op that wrote it — author, signature, the signed clock, and the signed value for role nodes — and catch-up rebuilds the op from it. A role node its subject rewrote stands for two ops, the superadmin's decision then the rewrite. No op carries another op's receipt.
**Why.** A node must travel through any peer without that peer's authority. Carrying the decision as a field on the rewrite hid it from the resolver, so a new device's newer bootstrap beat it; shipping the decision as the op it is removed a mechanism instead of adding one.
**Rejected.** Carried receipts (0.32.0–0.35.1, removed); a role stored outside the `user:` node (breaks every app, the same guarantee reached without it); trusting the node's stored value (not what was signed).

### 3. Role assignments beat clocks, and the constitution's decisions order themselves (0.32.0, 0.35.2)
**Decision.** A superadmin's assignment applies over a newer subject write (the priority path), and among superadmin decisions the newest by its own clock wins on every path; an identical re-delivery is a no-op.
**Why.** A promotion must beat the subject's fresh bootstrap on a new device, and a demotion or expiry must be final until the constitution decides again; both follow from one order, the decision's clock, which the subject cannot move.
**Rejected.** Dropping the priority path (the new device loses its role); comparing receipts in the resolver (security in the data layer, parity broken); a version counter per decision (needs coordination between superadmins that the clock already gives); leaving last-arrived-wins (a returning peer undid demotions on the whole room).

### 4. Last-write-wins with a deterministic tie, and no anti-entropy (0.31.1)
**Decision.** LWW per node by HLC; an exact tie breaks on the value's JSON, strictly greater wins. Convergence is guaranteed by the sync protocol on every encounter, not by a periodic anti-entropy sweep.
**Why.** "Ties favour local" left two peers rejecting each other forever while the digest called them converged. A periodic sweep would hide protocol defects behind repair traffic.
**Rejected.** Ties favouring local; CRDTs for values (the loser's rescue covers the collaborative case without a library); periodic anti-entropy (vetoed).

### 5. The whole window, never a slice; the tombstone guard on the delta path; no oplog dedupe in JS (0.22.12, 0.24.1, 0.35.2)
**Decision.** A delta reply ships the entire oplog window; the receiver drops what it holds. An upsert of an absent node is blocked by a newer-or-equal removal in the window on the delta path too. Re-deliveries are stopped by the resolver, including on the priority path, so the oplog never records a duplicate and needs no dedupe.
**Why.** A watermark proves what a peer has seen, not what it holds: concurrent writes older than the mark were stranded forever by a slice. The removed-node pair used to double per encounter until the window was poison.
**Rejected.** Slicing the window by watermark; a dedupe in `Oplog.add` as a second guard (the resolver already refuses; the native port keeps one as hardening).

### 6. A clock too far ahead is refused, not clamped (0.33.7, 0.33.8)
**Decision.** A stamp more than two hours ahead applies nothing and moves no clock — in an op, in a catch-up envelope, in the edge set inside a full-state node — until the receiver's time reaches it.
**Why.** Clamping stored a different stamp on each replica for the same op; refusing keeps one stamp everywhere and lets the op return through catch-up.
**Rejected.** Clamping to `now + 2 h`; a larger or smaller window (two hours absorbs real skew and bounds the room's clock, R3).

### 7. Edges are a signed set on the source (0.33.0–0.33.3)
**Decision.** A `link`/`unlink` signs the resulting edge set and applies it whole; the set's receipt stays on the source; a removal rewrites no other node's set; reads resolve edges to the targets held.
**Why.** Full state used to copy edges unsigned, so a peer could hand a newcomer invented relations. A set is the natural unit: newest signed set wins, as values do.
**Rejected.** Signing each edge (no total order among edges of one node); stripping edges to removed nodes (the set would stop matching its receipt).

### 8. The loser's rescue: your own edit only, decided at the write (0.34.0–0.34.2)
**Decision.** When an op wins over a value this peer wrote from the same base, this peer merges its own edit over the winner and re-writes it as an ordinary signed op. Only a value it wrote itself (`mine`), decided at the `put`, never a value it received.
**Why.** Two people editing one paragraph must both keep their letters; a CRDT library would cost more than the whole engine. A peer that merely watched a collision must sign nothing — on an owned node that write is refused everywhere, and it poisoned catch-up.
**Rejected.** CRDT text types; rescuing by receipt (the receipt lands after the signing debounce, so the rescue refused itself); rescuing for others.

### 9. A reciprocal full state is terminal (0.33.6)
**Decision.** A peer answers a full state with its own only when it holds nodes the sender lacked, and never answers a reciprocal one.
**Why.** Two peers whose gates refused each other's nodes traded full states without end.
**Rejected.** Reciprocating always (the storm); never reciprocating (union convergence would take another encounter).

### 10. Envelope encryption per reader, no compatibility with older records (0.28.0, 0.28.1)
**Decision.** An encrypted record has one key, wrapped per reader in an ECDH envelope; `grant` wraps, `revoke` rotates. Records written by the previous scheme are not read or migrated.
**Why.** Read revocation must be cryptographic in a network where every peer holds every byte. A migration path would keep the weaker scheme alive in the core.
**Rejected.** Reading legacy records on the read path (proposed twice, refused three times); a shared room key (revocation impossible); selective replication as a control (a modified peer receives everything).

### 11. `base` outside the signature (0.34.0)
**Decision.** An upsert carries the stamp of the value it wrote over, outside the signed payload and outside verification.
**Why.** Peers already holding signed ops could not have re-signed them; the field decides only the loser's rescue.
**Rejected.** Signing `base` (a wire break for every stored op); deriving it at the receiver (the receiver does not know what the writer saw).

### 12. The sign-in sweep re-signs only your own nodes; old state is reset, not repaired (0.35.0)
**Decision.** At sign-in an identity re-broadcasts its own nodes that lost their receipt. Nobody repairs someone else's node; state written before receipts existed is reset by its owner.
**Why.** A superadmin's sweep signed other identities' nodes, which every peer refused, and hid them from their owner's own repair.
**Rejected.** A superadmin sweep of everything; a migration that stamps unsigned legacy state as trusted.

### 13. Subscribers hear of a change before it is saved; apps integrate the graph before writing (0.35.2)
**Decision.** A remote change notifies `map` and reactive `get` subscribers at once, coalesced per frame; persistence runs behind. An application that writes from UI state reads the graph first.
**Why.** Waiting for the debounced save held a remote edit back for up to `saveDelay`; an app's own save in that window overwrote it with no collision to rescue. The frame the notification still costs is the app's to close.
**Rejected.** Synchronous notification per operation (a paste of two hundred lines would re-run every query two hundred times); a notification per persisted state (the same window, by design).

### 14. The API is frozen; `sign`/`verify` was the one exception (0.35.1)
**Decision.** No new public methods. `db.sm.sign(value)` / `db.sm.verify(envelope, maxAge)` were added once, for the ephemeral channel, and they label — they never decide nor persist.
**Why.** Every method is a promise to keep across the browser, the server and the port. The signed value was the one capability applications could not build from outside.
**Rejected.** Signing channel messages inside the transport (the transport must stay authorship-agnostic); a per-message permission model (authorization belongs to the graph).

### 15. No compatibility layers in the core; one version per room (0.28.0, 0.34.0, 0.35.2)
**Decision.** A mechanism a release makes redundant is deleted in that release. Rooms run one version, the latest; the Fallback Server is redeployed with the clients. From the CDN, apps load `@latest` plain or pin a version — never a cache-buster on the core alone.
**Why.** The core stays light; a compatibility branch is untested code that carries the old defect. The engine resolves its plugins beside the URL it was loaded from, and a query on `index.min.js` refreshed the core while a visitor's cached plugin stayed a release behind.
**Rejected.** Keeping the carried receipt beside the shipped decision; reading legacy encrypted records; a version-tagged plugin import as a substitute for the rule (a candidate, not a need).

### 16. The cellular overlay retries nothing (0.28, 0.33.5)
**Decision.** In a cellular room `send` returns a resolved promise and a frame to a peer that is not connected is lost; the graph's own sync repairs data.
**Why.** Retention in the overlay would flood a large room with repeats of every ephemeral frame; data has its own repair path, and ephemeral frames are ephemeral by definition.
**Rejected.** Per-frame acknowledgement and retry; buffering for peers about to reconnect.

### 17. The Fallback Server is a peer, never an authority (0.32.0 / GenosSRV 0.10.0)
**Decision.** The server runs the same gate, needs the constitution from its environment to accept a role, verifies live operations and refuses what it cannot verify; it adds availability and persistence, not trust.
**Why.** A trusted server would be the single point every other layer removes.
**Rejected.** A server that signs on behalf of clients; a server that skips verification for speed.

### 18. Moderation is granted, never inherited (0.33.x)
**Decision.** A superadmin cannot write or delete another owner's node unless that owner granted it, like any collaborator.
**Why.** Ownership is answered before role; a role that overrode ownership would make every owned node the constitution's.
**Rejected.** A `deleteAny` that bypasses ownership on the wire (it exists only for local convenience over own data).

### 19. Owner-named ids (0.33.1)
**Decision.** An id that begins with an address and a colon names its owner, on a peer that never saw the node too; the engine generates owned ids that way.
**Why.** A fresh peer had no owner to check against and could be handed a squatted node.
**Rejected.** A registry of ids; trusting the first writer of an unseen id.

### 20. Governance is last-match-wins, superadmins immune, no-ops never written (0.14–0.31)
**Decision.** Rules ordered easy → hard; the last matching rule decides; losing a condition demotes through the same path; a superadmin is never re-assigned; a node whose role would not change is not written.
**Why.** One choice makes promotion and demotion the same mechanism, and a no-op write per cycle would flicker the graph forever.
**Rejected.** First-match-wins; explicit demotion rules; a governance engine with authority of its own (it signs with the superadmin's key or not at all).
