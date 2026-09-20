# Security — building on the zero-trust model

The engine's guarantees, each pinned by a test, are in [SECURITY.md](https://github.com/estebanrfp/gdb/blob/main/SECURITY.md); what is signed, verified and encrypted, and the twelve boundaries of the design, in [CRYPTOGRAPHY.md](https://github.com/estebanrfp/gdb/blob/main/CRYPTOGRAPHY.md); the model explained in [docs/zero-trust-security-model.md](https://github.com/estebanrfp/gdb/blob/main/docs/zero-trust-security-model.md); published audits in [docs/audits](https://github.com/estebanrfp/gdb/blob/main/docs/audits/index.md).

## The model in one paragraph

Any peer may run modified code, and the network — relays, superpeers, other peers — is hostile. A peer decides on its own copy only: every operation travels with its author's signature and is judged by every receiver on every path (live, delta, full state), and nothing a peer cannot verify is applied. There is no server to trust and none to compromise. **Out of scope:** a stolen mnemonic or an unlocked device — that is the identity itself. **Open by design:** a signature is valid in every room that authorizes that address, so two rooms sharing a superadmin share its authority (rooms that must stay isolated carry distinct constitutions); a tombstone lives only in the operation window, so state older than it can return through a laggard's full state; and **a room opened without `sm` has no gate at all** — anyone writes, by design.

The consequence for an application: authorization is a property of the receiver, not of the sender. A malicious client can write anything into its own copy; what matters is whether *other* peers apply it — and they will not.

## The constitution

`sm: { superAdmins: ["0x…"] }` is the constitution: the addresses whose signed decisions every peer obeys. It is local configuration that **must be identical on every peer and on the Fallback Server**. An empty list, or a placeholder address, means nobody can ever be promoted. Never derive it from the graph, a channel message or a URL.

## Roles

Default ladder, each inheriting the one below:

| role | can | inherits |
|---|---|---|
| `guest` | `read`, `sync` | — |
| `user` | `write`, `link`, `sync` | guest |
| `manager` | `publish` | user |
| `admin` | `delete` | manager |
| `superadmin` | `assignRole`, `deleteAny` | admin |

Operations map to permissions: `put` → `write`, `remove` → `delete`, `link` / `unlink` → `link`, catch-up → `sync`, role grants → `assignRole`. `publish` and anything application-specific are checked only by `db.sm.executeWithPermission(name)`. `customRoles` replaces the whole table — keep the full ladder when promotion still matters.

**What zero trust does to a new user.** A fresh identity is a `guest`: it may write once to create its own `user:<address>` node (role forced to `guest`) and nothing else. **Its writes succeed locally and every other peer refuses them.** A role is set only by a superadmin's signed decision — `db.sm.assignRole(address, role, expiresAt?)` or a governance rule — and the newest decision is the role on every peer: an older one never rolls a node back. An expired role reads as `guest` on every peer, with nobody connected and no engine anywhere.

**Open platform (anyone writes).** Grant the base role directly; authenticity, ownership and role-setting stay fixed:

```js
sm: { superAdmins: [ADMIN], customRoles: { guest: { can: ["read", "sync", "write", "link"] } } }   // add "delete" if users remove their own nodes
```

Give every node an `owner`, so the residual is spam, never takeover.

## Ownership and ACLs

With `sm` on, a node whose value carries `owner` is enforced on every path: only the owner, or an address in `collaborators` with a sufficient level, may write, link or delete it. The engine names generated ids `${owner}:…`; choose your own ids with the same prefix for the same protection. **A collaborator writes content, never policy**: a non-owner's write that changes `owner`, `collaborators` or the envelope table is refused by every peer — spreading the node's value keeps them intact — and an existing node without an owner takes one only from a role that could delete it.

`sm: { acls: true }` adds the helpers: `acls.set(value, id?)` · `grant(nodeId, address, "read" | "write" | "delete")` (owner only; `read ⊂ write ⊂ delete`; one level per address, granting again replaces it) · `revoke(nodeId, address)` (owner only) · `delete(nodeId)` (owner or a `delete` collaborator) · `getPermissions(nodeId)`. `read` on a plain node is intent, not confidentiality: every peer holds the bytes. **Moderation is granted, never inherited**: a superadmin cannot delete another owner's node unless granted `delete` — grant it at creation when the app needs moderation.

## Confidentiality is cryptographic

The room replicates everything to everyone; the database name decides what travels, the envelope decides who reads. Two patterns:

- **Encrypted record** — `db.sm.put(value, id?)` seals the whole value under a per-record key wrapped for each reader; `db.sm.get` decrypts for any session holding an envelope; `db.sm.map` decrypts then queries, without realtime. Sharing is `acls.grant` (the target must have signed in once on any peer, or it throws `has no published key yet`); unsharing is `acls.revoke`, which rotates the key: forward-only — what a reader could open while authorized, it may have copied. Envelopes carry a format version; a record sealed by an earlier format is refused with its reason and re-saved once, never opened silently.
- **Sealed field** — `encryptDataForCurrentUser(data)` stores a string in an ordinary, public, reactive node; `decryptDataForCurrentUser` throws for anyone else, which is the ownership test. Cannot be shared. Use it when the node must stay live under `db.map` and only one field is private.

Neither is a substitute for the other, and neither hides metadata: ids, timestamps, edges and the set of readers are visible to every peer.

## Identity and passkeys

`startNewUserRegistration()` creates a volatile identity and its mnemonic (show it once with `getMnemonicForDisplayAfterRegistrationOrRecovery()`); `loginOrRecoverUserWithMnemonic(m)` opens a session that **lives in memory and dies on reload**. `protectCurrentIdentityWithWebAuthn()` wraps the private key under a secret only the authenticator yields (WebAuthn PRF) — **without PRF it returns `null` and nothing is stored**: report the session as unprotected, do not pretend. A passkey session resumes silently on reload; `sm: { resume: false }` asks the authenticator on every load; a new tab always needs `loginCurrentUserWithWebAuthn()`, triggered by the user, never on load. Passkeys need a secure context and a real domain (`127.0.0.1` throws). Drive every session branch from `setSecurityStateChangeCallback`.

## Signed values for the channel

A channel message is transport: it carries a colour, never a name GenosDB stands behind — until it is signed. `await db.sm.sign(value)` wraps who, when and what; `db.sm.verify(envelope, maxAge?)` answers *who* on any peer, or `null`. Use it to label presence, carets, typing. **A signed message is not a permission**: it never authorizes and never persists; authorization is the graph's, decided by every receiver.

## Governance

`governanceRules: [{ if: <query over user:<address> nodes>, then: { assignRole }, offsetTimestamp? }]`, evaluated every 4 s, **last match wins** — order rules easy → hard and keep a floor rule so losing a condition demotes; superadmins are immune; a no-op is never written. The engine runs while a superadmin is signed in on that device, or 24/7 on the Fallback Server (`GDB_SM_KEY` + `GDB_SM_RULES`), and signs every decision with the superadmin's key.

- `offsetTimestamp` is measured on the **engine's own observation** — how long it has watched the node's current stamp — never on the stamp a peer signed for itself; any rewrite of the node restarts the wait.
- Metrics a rule reads live on the `user:<address>` node, which its subject may rewrite (all but `role` and `expiresAt`): a metric the user writes is self-service promotion, and no metric on that node resists a modified client. Time objectives need no metric.
- **A rule decides over a term.** A role assigned by hand with `expiresAt` becomes permanent when a rule matches its node; an expired identity keeps its `role` label, so a rule matching the label revives it. If a tier must stay time-limited, let rules govern the tiers below it and match none of its labels.

## Five things never to do

1. Never trust a channel message, a query string or another peer's word for authorization: gate on the graph and the role.
2. Never put a secret in a room and rely on who joined: rooms replicate; encrypt.
3. Never render a peer-written value as markup.
4. Never ship a placeholder in `superAdmins`, and never let it differ between peers.
5. Never disable the gate to "make sync work": open the base role instead, and keep owners on nodes.
