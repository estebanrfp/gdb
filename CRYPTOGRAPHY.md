# GenosDB Cryptographic Protocol Specification

**Applies to:** `genosdb@0.36.1` (browser bundle), GenosRTC as shipped inside it, GenosSRV 1:1 port.
**Status:** protocol description, written from the source and checked against the published bundle. Not an audit.
**Last revised:** 2026-09-20 — the protocol as shipped in 0.36.1.

---

## 0. Why this document exists, and how to check it

The security of GenosDB does not depend on the algorithm being secret. It depends only on the secrecy of private keys. This document therefore describes the whole protocol — what is signed, how keys are derived, how records are sealed and who can open them — so that anyone can evaluate the design without reading the source.

The source is proprietary. The published bundle is not hidden: it is **minified, not obfuscated and not encrypted**. Every constant named in this document — algorithm identifiers, iteration counts, salts, storage keys, the signing prefix — is present as a plain string literal in the files npm installs. Section 13 lists them with the exact `grep` that finds each one, so the reader can confirm that the bundle carries what this document names.

Two things this document does not do: it does not claim the implementation is free of bugs (that is what an external audit is for, and none has been performed yet), and it does not describe internal code structure, only observable protocol.

---

## 1. Scope

| In scope | Out of scope |
|---|---|
| Identity: key generation, addresses, publication of public keys | Bugs in the underlying libraries (ethers, @noble/curves, Web Crypto) |
| Operation signing and verification | Availability of relays or peers |
| Authorization: roles, ownership, per-node access, receipts | A stolen mnemonic or an unlocked device (the identity itself) |
| Ordering, replay and time bounds | Side channels inside the browser |
| Confidentiality of encrypted records | Anything a room opened **without** the Security Manager (`sm`) does — such a room has no gate |
| Key protection at rest (WebAuthn, mnemonic) | |
| Signaling, transport and topology, and what they do **not** protect | |
| Persistence at rest and what is and is not encrypted there | |

---

## 2. Primitives

| Purpose | Primitive | Parameters | Library |
|---|---|---|---|
| Identity keys | secp256k1 | 32-byte private key, 33-byte compressed public key | ethers 6.15 (`@noble/curves` underneath) |
| Address | keccak256 | last 20 bytes of `keccak256(uncompressed pubkey minus 0x04)`, EIP-55 checksum | ethers |
| Operation signatures | ECDSA over secp256k1, EIP-191 (`personal_sign`) | 65-byte `r‖s‖v`, public-key recovery | ethers `signMessage` / `verifyMessage` |
| Message hash | keccak256 | `"\x19Ethereum Signed Message:\n" ‖ len ‖ message` | ethers `hashMessage` |
| Record encryption | AES-256-GCM | 96-bit random IV, default 128-bit tag | Web Crypto |
| Key envelopes | ECDH over secp256k1 → HKDF-SHA-256 → AES-256-GCM | ephemeral sender key per envelope; `info` binds the purpose and both public keys; format v2 | ethers `computeSharedSecret` + Web Crypto |
| Key protection (WebAuthn) | HKDF-SHA-256 → AES-256-GCM | salt = credential id, info `"genosdb/webauthn/wrap/v3"`; non-extractable key | Web Crypto |
| Self-only field encryption | HKDF-SHA-256 → AES-256-GCM | info `"genosdb/self-encrypt/v3"`, no salt; format v3 | Web Crypto |
| Hardware secret | WebAuthn PRF extension | salt `"genosdb/webauthn/prf/v1"` | platform authenticator |
| Mnemonic | BIP-39 → BIP-32 | seed = PBKDF2-HMAC-SHA-512, 2 048 rounds, as the standard fixes it; path `m/44'/60'/0'/0/0` | ethers `HDNodeWallet` |
| Signaling identity | Schnorr over secp256k1 (BIP-340), NIP-01 events | ephemeral, per page session | `@noble/curves` |
| Signaling encryption | AES-256-GCM | key from SHA-256 or PBKDF2 (100 000) — see §9.4 | Web Crypto |
| Topic derivation | SHA-1 | identifier only, not a security function | Web Crypto |
| Topology placement | FNV-style 32-bit hash | **not cryptographic** — see §9.6 | inline |
| Randomness | `crypto.getRandomValues` | all keys, IVs, challenges, peer ids | Web Crypto |
| Serialization before encryption | MessagePack, then DEFLATE | | `@msgpack/msgpack`, `pako` |

Every cryptographic operation runs in the browser's Web Crypto API or in `@noble/curves`. GenosDB ships **no** cryptographic implementation of its own.

One rule governs key derivation: a key derived from a high-entropy secret — an ECDH point, a private key, an authenticator's PRF output — comes from HKDF-SHA-256 with a purpose string, so no secret yields a key outside the context it was derived for; PBKDF2 appears only where a human secret is stretched, the BIP-39 phrase and the room password (§9.4). Every sealed format carries a version, and a format this release does not write is refused with its reason, never opened.

---

## 3. Identity

### 3.1 Key generation

A new identity is an Ethereum-compatible wallet: `Wallet.createRandom()` produces a BIP-39 mnemonic from 128 bits of `crypto.getRandomValues` entropy, and the private key is derived along BIP-32 path `m/44'/60'/0'/0/0`. Recovery from a mnemonic follows the same path. The mnemonic is held in memory only while the session is volatile (§8.5); it is never written to storage by the library.

### 3.2 Address

The identity of every actor — user, peer, server — is its Ethereum address:

```
address = EIP55( last_20_bytes( keccak256( uncompressed_pubkey[1..65] ) ) )
```

All addresses are normalised with EIP-55 checksum before comparison. Two addresses that differ only in case are the same identity.

### 3.3 Public key publication

Signatures are recoverable, so verifying an operation never requires knowing the author's public key in advance. The public key is needed only to **encrypt to** an identity (§7.3). For that, on sign-in every identity writes its **compressed 33-byte public key** into its own role node as `pub`:

```
user:<address>  →  { ethAddress, role, pub: "0x02…|0x03…", … }
```

The key is self-verifying: before any use, `computeAddress(pub) === address` is checked. A forged `pub` in a role node can only fail that check; it cannot redirect an envelope to a different key.

### 3.4 Server identity (GenosSRV)

A server peer takes its key from `GDB_SM_KEY`: a BIP-39 mnemonic (derived along the default path) or a `0x`-prefixed private key. It has no WebAuthn and no session; it is always signed in. Canonicalization, signing and verification are a line-for-line port of the browser implementation, so a browser verifies a server operation exactly as it verifies any peer's. The server always adds its own address to the constitution it enforces (§5.3).

---

## 4. Operation signing

### 4.1 Canonicalization

Before signing or verifying, the payload is canonicalized:

1. Object keys are sorted lexicographically, **recursively** at every depth — by UTF-16 code units, integer-like keys first in ascending order, as JavaScript orders properties.
2. Arrays keep their order; their elements are canonicalized.
3. Scalars are unchanged.
4. The result is serialized with `JSON.stringify`.
5. The string is encoded as UTF-8 bytes.

There is no other normalisation (no Unicode NFC, no whitespace rules beyond what `JSON.stringify` produces). Two payloads sign identically if and only if their canonical JSON is byte-identical.

### 4.2 What is signed, per operation type

The signed payload is the operation **without** `signature`, `originEthAddress` and `base`, **plus** `originUser` set to the author's address. Exactly:

| Type | Signed fields |
|---|---|
| `upsert`, `remove` | `{ type, id, value, timestamp, originUser }` |
| `link`, `unlink` | `{ type, sourceId, targetId, edges, timestamp, originUser }` |

`timestamp` is an HLC pair `{ physical, logical }` (§6.1). For `link`/`unlink`, `edges` is the **complete edge set** of the source after the operation, so what is signed is the resulting set, not a delta.

`base` (the timestamp of the value a write replaced, used for concurrent-write reconciliation) travels **outside** the signature and is never trusted for authorization.

### 4.3 Signature

```
message   = UTF8( canonical_json(payload) )
digest    = keccak256( "\x19Ethereum Signed Message:\n" ‖ decimal(len(message)) ‖ message )
signature = ECDSA_secp256k1_sign(digest)            // 65 bytes: r ‖ s ‖ v, hex
```

This is EIP-191 `personal_sign`. Signing is deterministic (RFC 6979) with a low `s`; `v` is 27 or 28. The `v` byte makes the public key — and therefore the address — recoverable from `(digest, signature)` alone.

### 4.4 Wire form

A signed operation carries three additional fields:

```
{ ...payload, originUser: <address>, originEthAddress: <address>, signature: <hex> }
```

`originUser` is inside the signature; `originEthAddress` is outside it and must equal `originUser` after normalisation. The redundancy is deliberate: the signed copy proves authorship, the unsigned copy lets a receiver reject a malformed operation before paying for a recovery.

---

## 5. Verification and authorization

Every incoming operation passes two gates, on **every** path by which an operation can arrive: live, delta catch-up and full-state catch-up.

### 5.1 Signature verification (gate 1)

1. `signature`, `originEthAddress` and `originUser` must all be present.
2. Both addresses must parse and must be equal after EIP-55 normalisation.
3. The payload is rebuilt (drop `signature`, `originEthAddress`, `base`), canonicalized, and the address recovered from the signature must equal `originEthAddress`.

Any failure discards the operation — named `missing-fields`, `invalid-address`, `address-mismatch` or `invalid-signature`. The signature fields are **kept** on the operation after verification, because gate 2 re-verifies against the local node and persists them as provenance.

### 5.2 Control messages and catch-up envelopes

- `sync` carries no signature: it announces a timestamp horizon and a state digest. The digest is a non-cryptographic FNV-based XOR over `{id → timestamp}` and serves only to skip redundant transfers; nothing is trusted from it.
- `deltaSync` and `fullStateSync` are **containers**, and so is `sync`: never signed, never verified, and without a clock of their own. A container grants nothing: every operation and every node **inside** it is judged individually by gate 2, and what carries no valid signature does not apply. A relay therefore needs neither authority nor a session to serve state, and no container can move a receiver's clock.

### 5.3 Role resolution

An author's role, as the receiving peer sees it:

1. If the address is in the **constitution** — the `superAdmins` list the application ships, identical on every peer — the role is `superadmin`.
2. Otherwise the peer reads its own copy of `user:<address>`; the role is that node's `role`.
3. If the node has `expiresAt` in the past, or does not exist, the role is `guest`.

No peer ever asks another peer what someone's role is.

### 5.4 Roles and permissions

Default table (replaceable through `customRoles`, identically on every peer):

| Role | Grants | Inherits |
|---|---|---|
| `superadmin` | `assignRole`, `deleteAny` | admin |
| `admin` | `delete` | manager |
| `manager` | `publish` | user |
| `user` | `write`, `link`, `sync` | guest |
| `guest` | `read`, `sync` | — |

Inheritance is resolved recursively with loop detection. Operation types map to permissions: `upsert → write`, `remove → delete`, `link`/`unlink → link`.

### 5.5 Authorship gate (gate 2)

For an operation `c` against the receiver's local copy of the node `local`:

```
author := recover(signed_payload(c), c.signature)
reject unless author == c.originUser

if id starts with "user:"                          — a ROLE node
    r := valid role receipt on local (see §5.7)
    if author ∈ constitution:
        accept iff no receipt, or c.timestamp > r.ts   (monotonic: an older decision never rolls back)
    else:
        reject unless mode == write and author == the node's own address
        reject if local exists and can(role(author), write) is false
        accept iff c.value.role == r.role and c.value.expiresAt == r.expiresAt and c.value.priority is not true
                                                   (the subject may rewrite its node but never its role, nor carry the constitution's flag)

else                                               — a DATA node
    reject unless can(role(author), mode)          mode ∈ {write, link, delete}
    owner := local.value.owner ?? local.value._meta.owner ?? owner named by the id prefix "0x…:"
    if owner:
        write/link: accept iff author == owner or collaborators[author] ∈ {write, delete}
        write by a non-owner: additionally accept iff policy(c.value) == policy(local.value)
                    policy = {owner, collaborators, _meta.keys} in canonical JSON (sorted keys)
                                                   (a collaborator changes content, never policy)
        delete:     accept iff author == owner or collaborators[author] == delete
    else:
        accept iff c.value has no owner, or author == c.value.owner   (a new owned node is self-created)
        reject if local exists and can(role(author), delete) is false
                                                   (an existing un-owned node takes an owner only from a role that could delete it)
```

Consequences:

- Only a superadmin's signature can set a role, and its **newest** signed decision is the role, on every path and device.
- A node whose id begins with an address and a colon (`0x…:`) can only be created by that address on a peer that has never seen it. The engine names owned nodes this way when it generates ids.
- A collaborator's write carries the owner's policy unchanged — owner, collaborators and the envelope table — or is refused on every receiver; a `revoke` therefore cannot be undone by a write from a copy that predates it, whatever its stamp.
- Edges apply as the set their last `link`/`unlink` signed; on catch-up a peer takes a set only from an author allowed to link on that node and only if it is newer than the set it holds.

### 5.6 Two policies applied before the gate

- **Anti-superadmin:** an operation whose value assigns `role: "superadmin"` to an address not in the constitution is discarded regardless of who signed it.
- **Welcome exception:** an unknown identity may create its **own** `user:<address>` node. The gate holds its role to `guest`, so the exception grants presence, not permission.

### 5.7 Provenance receipts

After applying a signed operation, the peer stores on the node:

```
meta = { author, sig, ts, [edges: { author, sig, ts, type, targetId }], [value], [role] }
```

- `value` is kept only for role nodes (the resolver strips `priority`; for every other node the stored value **is** the signed value, so a tampered value fails verification by itself).
- `role` is a superadmin's receipt kept when the subject later rewrites its own node, so the superadmin's decision remains provable.
- `edges` is the receipt of the last signed link/unlink and outlives value rewrites.

Receipts are what let a node **travel**: on catch-up a node is shipped as the operations its authors signed, and the receiver verifies them without trusting the relaying peer. A node without a receipt does not travel.

### 5.8 Recovery cache

Signature recovery costs ~1 ms. Results are cached under the key `signature ‖ JSON(payload)`, so a signature reused over a different payload never inherits a cached author. The cache is cleared past 4 096 entries.

---

## 6. Time, ordering and replay

### 6.1 Hybrid Logical Clock

Every operation carries `{ physical: ms since epoch, logical: counter }`. A clock starts at `(Date.now(), 0)`. `now()` returns `max(local physical, Date.now())` with `logical` incremented; receiving a timestamp sets `physical` to the `max` of both and `logical` to the `max` of both plus one, and a timestamp missing either number is ignored. Comparison is lexicographic `(physical, logical)`; a missing timestamp sorts before every timestamp.

### 6.2 Future bound

An operation whose `physical` is more than **7 200 000 ms (two hours)** ahead of the receiver's wall clock neither applies nor moves the receiver's clock. It is not clamped — clamping would store a different timestamp on each replica — it waits until the receiver's own time reaches it. Containers carry no clock (§5.2), so only a signed and applied operation ever moves a receiver's clock.

### 6.3 Conflict resolution

Last-writer-wins by HLC at the node level. On an exact HLC tie between concurrent writers, the winner is chosen deterministically by comparing `JSON.stringify(value)`, so every peer picks the same one. When both sides wrote over the same base value, the loser re-applies its own edit over the winner as an ordinary signed write (`base` names the replaced value; it is never used for authorization).

Role nodes carry `priority: true`; they are routed through the role path of the resolver and the flag is stripped before storage.

### 6.4 Replay

Operations are idempotent under HLC: a re-delivered operation compares equal or older to what the receiver holds and is a no-op. There is no per-operation nonce beyond the HLC pair. A removal is a tombstone kept in the operation log; an `upsert` of an absent id is refused unless it is newer than the tombstone. The tombstone lives only as long as the log window (default 200 operations in the browser, 1 000 in GenosSRV), which is a stated limitation (§12).

### 6.5 Ephemeral channel envelopes

For values sent over the data channel rather than written to the graph, `db.sm.sign(value)` produces:

```
{ kind: "app", from: <address>, at: Date.now(), value, signature }
```

signed with the same canonicalization and EIP-191 scheme over the envelope without `signature`. `db.sm.verify(envelope, maxAge = 60 000 ms)` returns `from` only if `kind == "app"`, `|now − at| ≤ maxAge`, and the recovered address equals `from`. The key set `{kind, from, at}` is disjoint from an operation's `{type, timestamp, originUser}`, so an envelope can never pass as a graph operation or vice versa. Verification establishes authorship in time; **authorization stays the graph's**.

---

## 7. Confidentiality: encrypted records (`db.sm.put`)

Every peer in a room replicates the whole graph. What protects a record is encryption, never topology. Selective replication cannot be a control in a serverless network: a modified peer can always re-forward what it already holds.

### 7.1 Content key

Each encrypted node has a random 32-byte **content encryption key (CEK)** from `crypto.getRandomValues`. Updates by an authorized writer reuse the node's CEK so existing envelopes stay valid; a writer holding no envelope may never re-key (it would lock everyone else out).

### 7.2 Sealing

```
plaintext  = DEFLATE( MessagePack(value) )
iv         = 12 random bytes
ciphertext = AES-256-GCM(key = CEK, iv, plaintext)       // default 128-bit tag
```

Stored node value:

```
{
  _gdbWrapperType: "_gdbSecurePayloadV1",
  _payload:        <ciphertext, hex>,
  collaborators:   { <address>: "read" | "write" | "delete", … },
  _meta: {
    owner: <address>,
    iv:    <hex>,
    keys:  { <address>: <envelope>, … }
  }
}
```

The node id is stored with the internal prefix `SM_ID_PREFIX_`; the API exposes it without the prefix. Every hex field carries a lowercase `0x` prefix, and the 16-byte GCM tag follows the ciphertext.

### 7.3 Key envelopes

A reader holds the CEK **wrapped to its public key**. For each authorized address:

```
check       computeAddress(readerPub) == readerAddress          // self-verifying key, §3.3
eph         := random secp256k1 private key (32 bytes)
shared      := ECDH(eph, readerPub)                              // the x-coordinate, 32 bytes
kek         := HKDF-SHA-256( ikm = shared, salt = ∅,
                             info = "genosdb/envelope/v2" ‖ compressed(eph.pub) ‖ compressed(readerPub) )
iv          := 12 random bytes
wrapped     := AES-256-GCM(key = kek, iv, CEK)

envelope    = { v: 2, p: compressed(eph.pub), i: iv, c: wrapped, r: compressed(readerPub) }
```

The reader recomputes `kek` from `ECDH(readerPriv, p)` with its own compressed public key in `info`, and unwraps. `info` concatenates raw bytes: the 19-byte purpose, then the two 33-byte compressed keys. The ephemeral key is discarded; `r` is kept so the owner can re-wrap on rotation without re-reading the directory. Binding the purpose and both public keys into `info` means a shared secret never yields a key outside the envelope it was derived for. An envelope whose `v` is not `2` is refused with its reason: records sealed by an earlier release are re-saved, never opened.

### 7.4 Grant and revoke

- `grant(id, address, level)` — every level includes read. The owner unwraps its own envelope, obtains the CEK, and adds an envelope for the new reader using the `pub` published on that reader's role node (a reader who has never signed in has no `pub` and cannot be granted yet).
- `revoke(id, address)` — the owner decrypts, generates a **new CEK**, re-seals the record, and re-wraps for the remaining readers only. From that write on, the revoked identity holds bytes it cannot open, no matter which peer relays them.

Revocation is **forward-only by nature**: what a reader could decrypt while authorized, it may have copied. Rotation protects everything written after.

### 7.5 Self-only field encryption (`encryptDataForCurrentUser`)

A separate path for values only their author will ever read — a field of an otherwise plain node:

```
kek        = HKDF-SHA-256( ikm = private key bytes, salt = ∅,
                           info = "genosdb/self-encrypt/v3" ) → AES-256-GCM (non-extractable)
plaintext  = DEFLATE( MessagePack(value) )
output     = { iv: <hex 12 bytes>, encrypted: <hex>, type: "aes-gcm-self-ssm-v3" }
```

The derivation is deterministic from the private key and the purpose string, so the same identity always derives the same key. No envelope exists; nobody else can be granted access. A field whose `type` is not `aes-gcm-self-ssm-v3` is refused by its tag before any key is derived.

---

## 8. Key protection at rest: WebAuthn

The private key must survive page reloads without being stored in the clear. GenosDB wraps it under a key that only the platform authenticator can reproduce.

### 8.1 Registration

`navigator.credentials.create` with:

| Parameter | Value |
|---|---|
| `rp.id` | the page's hostname |
| `user.id` | `keccak256(uncompressed pubkey)` (32 bytes) |
| `pubKeyCredParams` | ES256 (`-7`), RS256 (`-257`) |
| `authenticatorAttachment` | `platform` |
| `userVerification` | `required` |
| `residentKey` | `preferred` |
| `attestation` | `none` |
| `extensions.prf.eval.first` | salt `"genosdb/webauthn/prf/v1"` |

### 8.2 The secret and the derived key

The wrapping secret is the **32-byte PRF output** the authenticator returns for the fixed salt. If the platform does not evaluate PRF at creation but reports it enabled, one assertion is performed to obtain it. An authenticator that yields no PRF secret is **refused**: nothing is stored, the call returns `null`, and the session stays a mnemonic session (§8.5). The library never substitutes a secret the disk could hold.

```
wrapKey = HKDF-SHA-256( ikm = PRF secret,
                        salt = credential id,
                        info = "genosdb/webauthn/wrap/v3" ) → AES-256-GCM (non-extractable)
stored  = { iv: <base64url 12 bytes>, ciphertext: AES-256-GCM(wrapKey, iv, private key) }
```

### 8.3 Storage layout

| Store | Key | Content |
|---|---|---|
| `localStorage` | `gdb_ethereum_material_encrypted_webauthn_v3` | `{ iv, ciphertext }` — the wrapped private key |
| `localStorage` | `gdb_webauthn_registration_details_v3` | `{ credentialIdBase64Url }` |
| `sessionStorage` | `gdb_webauthn_session_secret_v3` | the PRF secret, for the life of the tab — never written with `sm: { resume: false }` |

Nothing the page persists decrypts the key. The PRF secret lives in the tab's session storage — which the browser may keep to restore that tab and drops with it — so a reload resumes silently and a new tab or session asks the authenticator again. An application that wants no secret outside the authenticator sets `sm: { resume: false }`: every page load then asks the authenticator, and the secret is never written anywhere. In either mode the library keeps no copy of the secret once the key is unwrapped: it holds the private key, for signing, and the credential id.

### 8.4 Login

`navigator.credentials.get` with a fresh 32-byte random challenge, `allowCredentials` restricted to the stored credential id, `userVerification: required`, and the PRF extension. The library checks that the returned `rawId` equals the stored id and that `clientDataJSON.challenge` equals the challenge it issued, then derives the wrapping key from the PRF result.

**The assertion signature itself is not verified locally, by design.** There is no relying-party session to protect and no stored authenticator public key: the only product of the assertion the library consumes is the PRF secret, and that secret is what AES-256-GCM authenticates when it unwraps the private key. An assertion that did not come from the registered authenticator yields a secret that opens nothing, so a verified signature would deny an attacker nothing the decryption does not already deny. The protection comes from the fact that the PRF secret exists nowhere but inside the authenticator.

### 8.5 Mnemonic sessions

A session opened from a mnemonic holds the key in memory only. It is not written to any storage; it ends with the page. Opening a second database re-initialises the Security Manager and clears the active signer.

---

## 9. Signaling, transport and topology (GenosRTC)

### 9.1 Peer id

A peer id is 20 characters from a 62-symbol alphabet drawn with `crypto.getRandomValues`, kept in `sessionStorage` so a reload keeps the same id. **It is not derived from, and has no cryptographic relation to, the identity address.** Authorship is established by operation signatures, never by peer id.

### 9.2 Nostr signaling

Discovery uses public Nostr relays (the list is fetched from the repository at runtime and cached). Each page session generates a fresh, **ephemeral** Schnorr keypair (`@noble/curves`, BIP-340) unrelated to the GenosDB identity. Events are NIP-01:

```
id  = SHA-256( JSON([0, pubkey, created_at, kind, tags, content]) )
sig = Schnorr_secp256k1(id)
kind = 20000 + hash(topic) mod 10000        // ephemeral-event range
tags = [["x", topic]]
```

Relays that demand proof-of-work are ignored. Relays authenticate nothing about GenosDB identities.

### 9.3 Topics

```
root = base36bytes( SHA-1( "GenosRTC@" ‖ appId ‖ "@" ‖ roomId ) )
self = base36bytes( SHA-1( root_plaintext ‖ "@" ‖ peerId ) )
```

SHA-1 here is an identifier derivation, not a security function; collision resistance is irrelevant to it.

### 9.4 Encryption of SDP

Offers and answers (WebRTC SDP) are encrypted before being published to relays:

- **Without a room password:** `key = SHA-256(":" ‖ appId ‖ ":" ‖ roomId)` imported as AES-256-GCM. This key is **public by design**: anyone who knows `appId` and `roomId` can read the SDP. It hides the SDP from relays that do not know the room, nothing more.
- **With a room password:** `key = PBKDF2-HMAC-SHA-256(password, salt = appId ‖ ":" ‖ roomId, 100 000 iterations)`.

Each SDP is encrypted with a fresh 12-byte IV; wire format `iv_decimal_csv ‖ "$" ‖ base64(ciphertext)`. Presence announces (`{ peerId }`) travel in clear.

### 9.5 Transport

Data flows over WebRTC `RTCDataChannel`, which is DTLS-encrypted by the browser between the two endpoints. Default ICE uses Google and Cloudflare STUN; TURN is optional and application-supplied. The framing on top (12-byte type, 1-byte sequence nonce, chunking, optional DEFLATE) is not a security mechanism. Peer authentication at the transport layer is DTLS's; **data authenticity is the signature on each operation**, independent of which peer relayed it.

### 9.6 Cellular Mesh: determinism, not cryptography

The topology — cell assignment, bridge election, succession — is a pure function of the sealed roster and the cell count, computed identically by every peer with zero coordination traffic. Placement uses a 32-bit FNV-style hash (`h = imul(h ^ byte, 2654435761)`) over `peerId:cell` (rendezvous hashing) and `peerId@cell` (bridge rank). **This hash is not cryptographic and is not meant to be.** A peer chooses its own id, so a hostile peer could pick one that lands it in a given cell or wins a bridge election. The consequence is bounded to availability and metadata: a bridge can drop or observe frames, it cannot forge or alter operations, because every operation is signed and verified at its destination (§5). Frames on the mesh are deduplicated by id and carry no signature of their own.

---

## 10. Persistence at rest

| What | Where | Encrypted? |
|---|---|---|
| Graph (nodes, values, receipts) | OPFS, `<db>_graph.msgpack` | **No**, except values sealed by §7 |
| Operation log (sliding window) | `localStorage`, `gdb_oplog_<db>` | No; removals in it carry the signed value in clear |
| Global timestamp | `localStorage`, `<db>_time` | No |
| Private key | `localStorage` | Yes — §8 (AES-256-GCM under the WebAuthn-derived key) |
| PRF secret | `sessionStorage` | No — session-scoped by design; absent with `sm: { resume: false }` |
| Signaling relay list | `localStorage`, `genosrtc_relays` | No |

GenosDB relies on the browser's origin isolation for everything it does not encrypt itself. Cross-tab access is serialised with the Web Locks API; that is a consistency mechanism, not a security one.

---

## 11. Properties this protocol claims

Each of these is pinned by a conformance test in `SECURITY.md` and follows from the mechanisms above:

1. Every applied operation is signed by its author and verified by the applying peer — live, delta and full state alike. What is not signed does not travel.
2. A new identity is a write-blocked `guest` until a superadmin signs a promotion; only a superadmin's newest signed decision sets a role, and an older one never rolls back.
3. Node ACLs hold against a modified peer on every path; an owned node is written only by its owner and collaborators.
4. Read access to encrypted records is cryptographic: a grant wraps a key, a revoke rotates it.
5. An expired role is a guest on every peer.
6. A clock more than two hours ahead applies nothing and moves no clock.
7. A passkey protects the private key with a secret only the authenticator yields, or is refused; nothing the page persists decrypts the key, and an application may keep the secret out of the tab altogether.
8. A server peer relays proofs, never authority: it verifies incoming operations and refuses roles it cannot verify against its constitution.
9. An ephemeral-channel value verifies as its author within its window; a changed value, forged author or stale envelope verifies to nothing, and no graph operation passes for one.
10. Catch-up envelopes and the hello are containers: never signed, never verified, without a clock of their own; only a signed and applied operation moves a receiver's clock.
11. Every key derived from a secret is bound to its purpose by HKDF, every sealed format is versioned, and an earlier format is refused with its reason, never opened.

---

## 12. Security model boundaries

A security model is defined as much by where it stops as by what it enforces. These are the edges of what this protocol claims. Each is a design decision, stated with its reason, so that an evaluator can tell a boundary from a defect: a boundary listed here is not a finding.

**Identity**

1. **The key is the identity.** A stolen mnemonic, an unlocked device or a compromised browser origin *is* the user: nothing in the protocol can distinguish an owner from someone holding the owner's key. Keys live where the user is, by design; there is no server to appeal to and no recovery authority to ask.

2. **An address is global; a room's authority over it is local.** A signature is valid in every room whose constitution authorizes that address. Rooms that must stay isolated carry distinct constitutions. This is what lets one identity work everywhere without re-registering anywhere.

3. **A brand-new identity may create its own role node.** The welcome exception grants presence — an address the graph can name — and never permission: the gate holds the role to `guest` until a superadmin signs otherwise.

**Authorization scope**

4. **A room opened without `sm` has no gate.** The Security Manager is a module. Rooms whose data needs no authority — public, anonymous, ephemeral — run without it and accept every well-formed operation. Whether a room carries a gate is the application's declaration, made identically on every peer.

**Ordering and history**

5. **Replay is absorbed by idempotence, not by nonces.** A re-delivered operation compares equal or older under HLC and is a no-op, so no nonce registry is needed. Ephemeral-channel envelopes leave no trace in the graph to compare against and are bounded by a time window instead (60 s by default).

6. **A tombstone lives as long as the operation-log window** (200 operations in the browser, 1 000 in GenosSRV). A bounded log is what keeps delta synchronisation proportional to the window rather than to history. State older than the window can return through a laggard's full state; it is then judged by the same gate as everything else.

**Confidentiality**

7. **Public rooms are readable by anyone who knows their name.** Joining by name and hiding discovery from name-holders are mutually exclusive. Without a room password the SDP key derives from `appId` and `roomId` alone (§9.4); a private room sets a password, and the key is then derived from it. Data integrity does not depend on this either way: operations are signed.

8. **Record encryption has no forward secrecy.** Reader keys are static — which is exactly what lets a reader who was offline open a record it was granted. Revocation rotates the content key and protects everything written after it; what a reader could open while authorized, it may have copied (§7.4).

9. **What is not sealed is not encrypted at rest.** The graph in OPFS and the operation log in `localStorage` rely on browser origin isolation; records sealed with `sm.put` and the wrapped private key carry their own encryption (§10). The graph must be readable before any session exists, so encryption at rest, where offered, is a session-bound capability rather than a property of the graph store.

10. **AES-GCM nonces are random 96-bit values, and a node's content key persists across its updates.** The standard bound of 2³² encryptions per key applies. It is orders of magnitude beyond any realistic update count for a single node, and it is stated because a bound exists.

**Signaling and topology**

11. **Signaling authenticates nothing, by construction.** Relays are untrusted infrastructure; the Nostr identity is ephemeral and unrelated to the GenosDB identity; presence announces are unauthenticated. A hostile relay or peer can deny discovery or observe metadata. It cannot forge data, because authority lives in operation signatures and never in the transport.

12. **A peer can influence its own placement in the mesh.** Placement is a deterministic function of the sealed roster of self-chosen peer ids (§9.6), which is what lets every member compute the same topology with no coordinator. A peer that grinds its id can choose its cell or make itself a bridge; the impact is bounded to availability and metadata, because operations are verified at their destination and a bridge relays frames it cannot forge. Binding placement to the GenosDB identity — so that only a verified role can be elected — is the transport change planned for 0.37 (§9.1, §9.5).

---

## 13. Verifying this document against the published bundle

Install the exact version and confirm the files are plain minified JavaScript:

```bash
npm pack genosdb@0.36.1 && tar xzf genosdb-0.36.1.tgz
ls package/dist/            # gdb.min.js  sm.min.js  genosrtc.min.js …
grep -c '_0x[0-9a-f]'  package/dist/sm.min.js     # 0 → no obfuscator patterns
```

Every constant below is a literal string in the bundle. Each command prints `1` or more if the bundle carries the constant:

```bash
cd package/dist

# §2, §7, §8 — primitives and parameters
grep -c 'AES-GCM'                                   sm.min.js
grep -c 'name:"AES-GCM",length:256'                 sm.min.js
grep -c 'name:"HKDF"'                               sm.min.js      # §7.3, §7.5, §8.2 — the one KDF for keys
grep -c 'hash:"SHA-256"'                            sm.min.js
grep -c 'genosdb/envelope/v2'                       sm.min.js      # §7.3 envelope purpose string
grep -c 'genosdb/self-encrypt/v3'                   sm.min.js      # §7.5 purpose string
grep -c 'aes-gcm-self-ssm-v3'                       sm.min.js      # §7.5 format tag
grep -c 'genosdb/webauthn/wrap/v3'                  sm.min.js      # §8.2 purpose string
grep -c 'PBKDF2'                                    sm.min.js      # 1: the BIP-39 seed inside ethers (§2), nothing else
grep -c 'getRandomValues(new Uint8Array(32))'       sm.min.js      # §7.1 CEK
grep -c 'computeSharedSecret'                       sm.min.js      # §7.3 ECDH
grep -c 'compressedPublicKey'                       sm.min.js      # §3.3, §7.3

# §4 — signing scheme
grep -c 'Ethereum Signed Message'                   sm.min.js      # EIP-191 prefix
grep -c 'signMessage'                               sm.min.js      # method name survives minification

# §5, §6 — authorization and ordering
grep -c 'superadmin'                                sm.min.js
grep -c 'user:'                                     sm.min.js
grep -c 'expiresAt'                                 sm.min.js
grep -c 'kind:"app"'                                sm.min.js      # §6.5 envelope
grep -c '6e4'                                       sm.min.js      # §6.5 60 000 ms window
grep -c '7200000'                                   gdb.min.js     # §6.2 two-hour bound
grep -c 'physical'                                  gdb.min.js
grep -c 'logical'                                   gdb.min.js

# §7.2 — record format
grep -c '_gdbSecurePayloadV1'                       sm.min.js
grep -c 'SM_ID_PREFIX_'                             sm.min.js

# §8 — WebAuthn
grep -c 'genosdb/webauthn/prf/v1'                   sm.min.js
grep -c 'gdb_ethereum_material_encrypted_webauthn_v3' sm.min.js
grep -c 'gdb_webauthn_registration_details_v3'      sm.min.js
grep -c 'gdb_webauthn_session_secret_v3'            sm.min.js
grep -c 'userVerification:"required"'               sm.min.js
grep -c 'alg:-7'                                    sm.min.js
grep -c 'alg:-257'                                  sm.min.js
grep -c 'attestation:"none"'                        sm.min.js
grep -c 'authenticatorAttachment:"platform"'        sm.min.js

# §9 — signaling and transport
grep -c 'AES-GCM'                                   genosrtc.min.js
grep -c 'iterations:1e5'                            genosrtc.min.js  # §9.4 password path
grep -c '"SHA-1"'                                   genosrtc.min.js  # §9.3 topics
grep -c 'getSharedSecret'                           genosrtc.min.js  # secp256k1 (noble)
grep -c 'created_at'                                genosrtc.min.js  # §9.2 NIP-01
grep -c '"REQ"'                                     genosrtc.min.js
grep -c 'wss://'                                    genosrtc.min.js
grep -c 'stun:'                                     genosrtc.min.js

# §10 — persistence keys
grep -c '_graph.msgpack'                            gdb.min.js
grep -c 'gdb_oplog_'                                gdb.min.js
```

A reader who wants to go further can pretty-print any of these files (`npx prettier --parser babel sm.min.js`) and follow the same identifiers this document uses.

The greps confirm the constants; the vectors confirm the arithmetic. [`tests/vectors/`](tests/vectors/) carries the cryptographic subset of the conformance vectors the native port replays, produced by executing the reference engine with public test keys: canonical forms, signatures, verification verdicts, key envelopes, a sealed record, self-encrypted fields, signed values and clock sequences. `node tests/vectors/verify.mjs` (Node 20 or later; `npm install` in a clone, or `@noble/curves`, `@noble/hashes` and `@msgpack/msgpack` beside the folder) re-derives every one of them from this document alone — WebCrypto, `@noble/curves`, `@noble/hashes`, `@msgpack/msgpack`, no GenosDB code — prints one line per check and exits non-zero on the first byte that differs; `meta.json` pins the SHA-256 of the three bundle files the vectors were extracted beside, and `--dist <dir>` binds an extracted tarball's `dist/` to them. [`tests/vectors/verify.html`](https://estebanrfp.github.io/gdb/tests/vectors/verify.html) drives the published bundle itself through its public API over the same vectors, in the browser, with nothing to install.

---

## 14. Revision history

| Date | Version covered | Change |
|---|---|---|
| 2026-09-15 | 0.36.0 | First public specification. |
| 2026-09-16 | 0.36.0 | §6.4, §12.6: the browser's default log window is 200 operations, not 50 (`oplogSize`, unchanged since 0.33.4). |
| 2026-09-16 | 0.36.0 | §13: conformance vectors under `tests/vectors/` with an independent verifier and the bundle's SHA-256 pinned; §4.1, §4.3, §5.1, §6.1, §6.5, §7.2, §7.3 state what the vectors made explicit. |
| 2026-09-20 | 0.36.1 | §5.5: a non-owner's write keeps the owner's policy (`owner`, `collaborators`, `_meta.keys`); the subject never carries `priority`; an existing un-owned node takes an owner only from a role that could delete it. |
