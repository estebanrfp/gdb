# GenosDB Invariants

The normative list of what the engine guarantees, one sentence each, with the test or vector that pins it. This file is the contract every audit checks against: **a finding is an invariant below, violated, with a reproduction inside the threat model** (a modified peer, a returning peer, a replayed message). Anything else is a proposal, not a finding — see [How this file is used](#how-this-file-is-used) and [decisions.md](decisions.md) for the questions already closed.

As of **0.35.2** every invariant here is pinned and green: the private conformance suite (`lib/tests`, 72 tests in real browsers over real WebRTC), the gate battery (87 verdicts, executed against the reference gate), and the native port's vectors (`conformance/vectors`, executed from the reference and replayed in Rust). Paths: **live** (an op on the sync channel), **delta** (a hydrated oplog window), **full** (a full state), **server** (the Fallback Server), **native** (the Rust port). Unless a row says otherwise, an invariant holds on all five.

## A. Authorship

- **A1** Every operation — upsert, remove, link, unlink — is signed by its author (EIP-191 over the canonical JSON of `{type, id | sourceId, targetId, edges, value, timestamp, originUser}`) and verified by every peer before it applies: the recovered address must equal `originUser`. What is not signed does not travel; an op that fails is dropped, never sanitised. *Pinned by* `acl-sync/authorship`, gate battery §1–2, `sm-gate.json`, port `sync_auth.rs`.
- **A2** Signature recovery is memoised by signature **and** payload, so a reused signature never lends its author to a different payload. *Pinned by* port `a_forged_clock_cannot_overwrite_an_owned_node` (0.32.1).
- **A3** `base` — the stamp of the value an upsert wrote over — rides outside the signature and outside verification; it decides only whether the receiver rescues its own edit, never whether the op applies. *Pinned by* `concurrency/rescue`, `sm-protocol.json` base cases (0.34.0).
- **A4** Catch-up envelopes (`deltaSync`, `fullStateSync`) are transport: admitted unsigned, verified if signed, and their content judged op by op by the same gate as live traffic. A `sync` handshake passes verbatim. *Pinned by* `catch-up/`, `sm-protocol.json`.
- **A5** A full state is applied as the operations its nodes stand for — `user:` nodes first — and a node without a receipt is an unsigned op: it does not apply. *Pinned by* `catch-up/`, gate battery §8, port `full_state_is_judged_as_the_ops_it_carries_roles_first`.
- **A6** An unknown identity's first write of its own `user:` node is admitted intact (the welcome), and the gate holds its role to `guest` — or `superadmin` by the constitution — whatever the node claims. *Pinned by* gate battery §1, `sm-protocol.json` welcome cases.

## B. Roles and the constitution

- **B1** The constitution (`superAdmins`) is local configuration on every peer, never data. A role is valid only with a superadmin's signature: an author's role is the constitution, else its `user:` node's `role`, and an expired or unknown role is `guest`. A brand-new identity is a write-blocked `guest`. *Pinned by* `role-attestation/` tests 1–2, gate battery §1–3, 12.
- **B2** The constitution's newest decision is the role, on every path and every device: a superadmin's op on a role node applies only if it is newer than the decision the node already holds, ordered by the decision's own clock — the subject's writes move the node's clock, never the decision's. An older or re-delivered decision never rolls a node back, and a re-delivery is a no-op. Two superadmins converge on the newest decision, not on the last to arrive. *Pinned by* `role-attestation/` test 5 (delta, full state, a returning peer's window), gate battery §18, `conflict.json` re-delivery cases (0.35.2).
- **B3** The subject rewrites its own `user:` node — its bootstrap freely, later as its role allows — without moving `role` or `expiresAt` beyond the decision the node holds; a self-write claiming more is refused with a receipt or without one. *Pinned by* `role-attestation/` tests 2, 4; gate battery §4–5, 9.
- **B4** A role node its subject rewrote travels as two operations — the superadmin's decision it proves, then the rewrite — so a device whose fresh bootstrap outranks the rewrite by clock still learns the room's role. No operation carries another's receipt. *Pinned by* `role-attestation/` tests 3, 6; port `a_role_node_the_subject_rewrote_still_carries_its_decision_to_a_new_device`.
- **B5** An expired role is a `guest` on every peer, live and on catch-up; a revocation by `expiresAt` is a decision like any other and an older, unexpired assignment cannot undo it. *Pinned by* `expiry/`, gate battery §18.
- **B6** Governance promotes and demotes only with a superadmin's signature, evaluating rules last-match-wins over `user:` nodes, superadmins immune, no-op writes never written — from a browser session or 24/7 from the Fallback Server. *Pinned by* `governance/`, `superpeer/`, `governance.json`.
- **B7** A grant of `superadmin` to an address outside the constitution is dropped by the verifier. *Pinned by* `sm-protocol.json` (with the documented sharp edge R12).

## C. Ownership, ACLs and confidentiality

- **C1** A node's owner is `value.owner`, else `value._meta.owner`, else the address a `0x…:` id begins with. RBAC is answered first; then only the owner and the collaborators granted `write` write it, only the owner and those granted `delete` delete it, and a new owned node must be created by its owner. *Pinned by* `acl-sync/`, gate battery §10, 15; port `collaborators_write_and_delete_as_granted`.
- **C2** Moderation is granted, never inherited: a superadmin writes or deletes another owner's node only if that owner granted it. *Pinned by* gate battery §16.
- **C3** An id that begins with its owner's address cannot be squatted or written by anyone else, on a peer that never saw it either. *Pinned by* gate battery §15, `acl-sync/`.
- **C4** Read access to an encrypted record (`db.sm.put`) is cryptographic: one key per record, wrapped for each reader in an ECDH envelope; `grant` wraps the key for a new reader, `revoke` rotates it and re-wraps for the rest; a revoked reader cannot open what follows. A reader's public key is self-verified against its address. *Pinned by* `envelopes/`, `sm-payload.json`, port envelope tests.

## D. Convergence

- **D1** Last-write-wins per node by hybrid logical clock; an exact tie breaks on the value's `JSON.stringify` — strictly greater wins — so every peer picks the same winner. *Pinned by* `conflict.json`, `hlc.json` (0.31.1).
- **D2** A clock more than two hours ahead of the receiver's, in an operation, in a catch-up envelope or in the edge set of a full-state node, applies nothing and moves no clock; it waits for the receiver's own time. *Pinned by* `catch-up/` and `superpeer/` ("ten years ahead"), `conflict.json` (0.33.7, 0.33.8).
- **D3** A removal is signed and travels with its receipt; a removal newer than or equal to an upsert of an absent node blocks its resurrection on every path while the removal is in the window. *Pinned by* `catch-up/`, port `catch_up_removals_are_judged_like_live_removes` (0.24.1, 0.32.0).
- **D4** Edges travel as the set the last `link`/`unlink` signed and apply whole; on catch-up a peer takes a set only from an author allowed to link on that node and only if newer than the one it holds; a removal rewrites no other node's set; a link to a node the peer lacks waits; every read resolves edges to the targets the peer holds. *Pinned by* `acl-sync/`, gate battery §14, port edge tests (0.33.0–0.33.3).
- **D5** Two writes over one base keep both contributions: the peer whose op lost re-applies its own edit over the winner — only an edit it wrote itself, decided at the write, never one it watched. *Pinned by* `concurrency/` (0.34.0–0.34.2).
- **D6** A sorted read orders exact ties by id, identically on every peer. *Pinned by* `query` vectors (0.33.9).

## E. Synchronisation

- **E1** On every join a peer says hello twice with its watermark and a digest of its whole `{id → clock}` set. Equal digests exchange nothing; a watermark older than the oldest entry of the window brings a full state; otherwise the reply is the whole window, hydrated — never a slice, because a watermark proves what a peer has seen, not what it holds. *Pinned by* `catch-up/`, `dialogue.json` (0.22.12, 0.30.0).
- **E2** A full state is answered with the receiver's own full state only when the receiver holds nodes the sender lacked, and a reciprocal full state is terminal. *Pinned by* `catch-up/` ("reconciliation terminates") (0.33.6).
- **E3** A re-delivered operation — the same clock, the same value — is a no-op on every path: neither re-applied nor re-recorded, role assignments included. *Pinned by* `conflict.json`, `dialogue.json` (0.24.1, 0.35.2).
- **E4** A remote change reaches subscribers before it is persisted, as a local write does; notifications are coalesced per animation frame. *Pinned by* `examples/block-editor` ("same paragraph at the same instant") (0.35.2).
- **E5** The oplog keeps a window of 200 operations in the browser (1000 on the server and natively), persisted on every change and flushed when the tab goes hidden, so the last write before a close still travels by delta. *Pinned by* `catch-up/` (0.33.4).
- **E6** `db.get(id, callback)` reports the node when it arrives and its removal once; it fires on a forward clock move (see R10). A database opened without a transport queues nothing. *Pinned by* `reads/`, `local-only/` (0.35.0).

## F. Identity and session

- **F1** A private key is derived from a mnemonic or protected by a passkey: with WebAuthn, the key material on disk is encrypted with a secret only the authenticator yields; a mnemonic session lives in memory. *Pinned by* `identity/`.
- **F2** At sign-in an identity re-signs only its own nodes whose receipt was lost to a reload; state written before receipts existed is reset, never repaired by another identity. *Pinned by* `acl-sync/provenance` (0.35.0).
- **F3** `db.sm.sign(value)` and `db.sm.verify(envelope, maxAge)` prove authorship of a value in time, never authorization; a graph operation never passes for an envelope nor an envelope for an operation. *Pinned by* `signature/`, `sm-protocol.json` `signed_value` (0.35.1).

## G. Transport (GenosRTC)

- **G1** Signalling authenticates nothing and decides nothing: a hostile relay or peer can deny discovery or observe metadata, never forge data, because every operation is judged by A1 on arrival. Offers and answers are encrypted with a key stretched from the room password; inflated payloads are capped at 32 MiB; a link that stops delivering is closed by the watchdog. *Pinned by* `signaling.json`, GenosRTC's own suite (0.31.0).
- **G2** In a cellular room the topology is a pure function of the sealed roster, isolation holds at three independent layers, and a frame sent to a peer that is not connected is lost by design — the graph's own sync repairs data, the overlay repairs nothing. *Pinned by* `cellular-mesh.json`, port S8/S14 (0.28, 0.33.5).

## H. The Fallback Server

- **H1** The Fallback Server is a peer with the same gate, byte-identical to the browser's: it relays proofs, never authority, needs the constitution to accept a role, verifies live operations like any peer and refuses what it cannot verify; it persists the graph and runs governance 24/7. *Pinned by* `superpeer/`, the gate battery's parity check, GenosSRV 0.10.0+.

## Residuals by design

Bounded, documented, not findings. Each was measured or reasoned in an audit ledger.

- **R1** A signature is valid in every room that authorises the address: rooms that share a superadmin share its authority. Rooms that must stay isolated carry distinct constitutions.
- **R2** A tombstone lives only in the window: state older than the window can return through a returning peer's full state.
- **R3** Among authorised writers, a clock up to two hours ahead wins by LWW and can move the room's clock up to two hours ahead of wall time; bounded by D2, not cumulative.
- **R4** A room opened without `sm` has no gate.
- **R5** Signalling exposes metadata and can be denied (G1).
- **R6** A signed but unauthorised operation costs each receiver one signature recovery before it is refused (about a millisecond).
- **R7** Sync replies and reciprocal full states are broadcast to the room: one hello can move one window per peer, once per encounter.
- **R8** An unsigned catch-up envelope's clock, when at most two hours ahead, moves the receiver's clock.
- **R9** A receipt lost by a reload inside the signing window is not repaired by re-delivery of the same op (E3); own nodes are repaired by F2.
- **R10** The reactive `get` fires on forward clock moves only: a role learned from an older decision (B4) is in the graph without firing it — read it, or watch it with `map`.
- **R11** Peers on different versions are not supported in one room: one version per room, and the latest.
- **R12** A `superadmin` grant with no usable `ethAddress` aborts the whole incoming batch in the verifier (B7's sharp edge, pinned as is).
- **R13** An app that writes from UI state which has not yet integrated the graph produces a sequential overwrite that LWW decides; apps integrate the graph before writing (E4).
- **R14** From the CDN, load `@latest` plain or pin a version; a cache-buster on `index.min.js` alone pairs a fresh core with a cached plugin.

## Closed tables

A table is closed when every cell of `local state × incoming operation` is pinned by an executed vector; nothing can be "found" in it without a new class of input.

| Table | Vectors |
|---|---|
| Role node: absent · bootstrap · superadmin-written · subject-rewritten × older · same · newer decision, expiry, welcome, moderation, owner-named ids, edges | `sm-gate.json`, 98 cases |
| Conflict resolution, priority path and ties | `conflict.json`, 23 |
| The verifier pipeline, welcome and the anti-superadmin policy; signed values | `sm-protocol.json`, 41 |
| ACL module, governance engine, RBAC, HLC, canonical form | `acls.json` 26, `governance.json` 11, `rbac.json`, `hlc.json`, `sm.json` |
| Envelope encryption | `sm-payload.json` |
| Two-peer sync dialogue, partitioned writers included | `dialogue.json`, 9 phases |
| Signalling derivations, cellular mesh, wire encoding, queries, map events | `signaling.json`, `cellular-mesh.json`, `encoding/`, `query/`, `map-events.json` |

Pinned by browser suites and not yet by vectors: the loser's rescue (`concurrency/`, four scenarios) and sync exchanges among three or more peers (`role-attestation/`, `catch-up/`). Closing them is a vector-extraction task, not a defect.

## How this file is used

1. **An audit is a conformance run.** Run the pins — `pnpm test` and `pnpm test:gate` in `lib/tests`, `cargo test --workspace` in the port — and read every invariant against its pin and against the docs. A pin missing or red, or a doc sentence that contradicts a row, is the audit's output.
2. **A finding is a violated invariant with a reproduction** inside the threat model. It names the row, carries the reproduction, and is closed by the smallest change that closes its class, in one release, test red first.
3. **Everything else is a proposal.** A different but equally valid design is not a finding. Write it as a decision draft — decision, why, alternatives rejected — and stop; the engine changes only when the maintainer reopens the question. Read [decisions.md](decisions.md) first: a proposal that matches a rejected alternative is already answered.
4. **New behaviour adds a row here** in the same release, with its pin.
