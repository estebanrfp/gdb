#!/usr/bin/env node
/**
 * GenosDB conformance vectors — an independent verifier.
 *
 * Proves spec ⇔ vectors: every value in this folder is re-derived from CRYPTOGRAPHY.md alone,
 * with WebCrypto (HKDF, AES-GCM), @noble/curves (secp256k1), @noble/hashes (keccak-256),
 * @msgpack/msgpack and node:zlib — no GenosDB code, no ethers. The vectors themselves were
 * produced by executing the reference engine with public test keys; meta.json pins the SHA-256
 * of the dist/ files it ran beside, so the bundle you hold can be bound to them.
 *
 * Run:  node tests/vectors/verify.mjs [--dist <dir>]      (Node 20 or later)
 *       after `npm install` in a clone, or with `@noble/curves`, `@noble/hashes` and
 *       `@msgpack/msgpack` installed beside this folder. `--dist` points at an extracted
 *       tarball's dist/ (default: ../../dist). One line per check; exit code 1 on any difference.
 *
 * Sections replayed: §3.2 §4.1 §4.3 §4.4 §5.1 §5.2 §6.1 §6.5 §7.2 §7.3 §7.5 §13. Not replayed here:
 * §3.1 (phrase → key; tests/vectors/verify.html proves it through the bundle) and §6.2 (no vector).
 */
import { existsSync, readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { inflateSync } from "node:zlib"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { secp256k1 } from "@noble/curves/secp256k1"
import { keccak_256 } from "@noble/hashes/sha3"
import { decode } from "@msgpack/msgpack"

const DIR = dirname(fileURLToPath(import.meta.url))
const distArg = process.argv.indexOf("--dist")
const DIST = distArg > 0 ? resolve(process.cwd(), process.argv[distArg + 1]) : resolve(DIR, "../../dist")
const subtle = globalThis.crypto?.subtle
if (!subtle) throw new Error("Node 20 or later is required: this verifier uses WebCrypto for HKDF and AES-GCM")
const load = (file) => JSON.parse(readFileSync(resolve(DIR, file), "utf8"))

let passed = 0, failed = 0
const check = (name, ok, detail = "") => { ok ? passed++ : failed++; console.log(`${ok ? "✓" : "✗"} ${name}${ok || !detail ? "" : ` — ${detail}`}`) }
const throws = async (fn) => { try { await fn(); return false } catch { return true } }
const attempt = async (fn) => { try { return await fn() } catch (e) { return `threw: ${e.message}` } } // a failure is a ✗ line, never a crash

// ── bytes ──
const bytes = (h) => Uint8Array.from((h.startsWith("0x") ? h.slice(2) : h).match(/../g) ?? [], (b) => parseInt(b, 16))
const hex = (u8) => "0x" + Array.from(u8, (b) => b.toString(16).padStart(2, "0")).join("")
const utf8 = (s) => new TextEncoder().encode(s)
const cat = (...parts) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length } return out }

// §4.1 — keys sorted recursively (UTF-16 code units; integer-like keys first, as JS orders them), JSON.stringify.
const sortKeys = (v) => Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v
const canonical = (v) => JSON.stringify(sortKeys(v))
const eq = (a, b) => canonical(a) === canonical(b)

// §3.2 — address = EIP55(last 20 bytes of keccak256(uncompressed public key without 0x04)).
const eip55 = (lower40) => { const h = hex(keccak_256(utf8(lower40))).slice(2); return "0x" + [...lower40].map((c, i) => parseInt(h[i], 16) >= 8 ? c.toUpperCase() : c).join("") }
const parseAddress = (a) => { if (!/^0x[0-9a-fA-F]{40}$/.test(a)) throw new Error("not an address"); const n = eip55(a.slice(2).toLowerCase()); if (a !== a.toLowerCase() && a !== a.toUpperCase().replace("0X", "0x") && a !== n) throw new Error("bad checksum"); return n }
const addressOf = (pub) => eip55(hex(keccak_256(secp256k1.ProjectivePoint.fromHex(pub).toRawBytes(false).slice(1)).slice(-20)).slice(2))

// §4.3 — EIP-191 digest; deterministic ECDSA (RFC 6979, low s), 65 bytes r ‖ s ‖ v with v ∈ {27, 28}.
const eip191 = (message) => keccak_256(cat(utf8(`\x19Ethereum Signed Message:\n${message.length}`), message))
const sign = (digest, privHex) => { const s = secp256k1.sign(digest, bytes(privHex), { lowS: true }); return hex(cat(s.toCompactRawBytes(), Uint8Array.of(27 + s.recovery))) }
const recover = (digest, sigHex) => { try { const s = bytes(sigHex); return addressOf(secp256k1.Signature.fromCompact(s.slice(0, 64)).addRecoveryBit(s[64] - 27).recoverPublicKey(digest).toRawBytes(false)) } catch (e) { return `unrecoverable: ${e.message}` } }
const signedForm = (obj) => eip191(utf8(canonical(obj)))

// §4.2 / §5.1 — the signed payload is the operation without signature, originEthAddress and base, with originUser inside.
const signedPayload = ({ signature, originEthAddress, base, ...rest }) => rest
const verifyOp = (op) => {
  if (!op?.signature || !op?.originEthAddress || !op?.originUser) return { ok: false, reason: "missing-fields" }
  let normalized
  try { normalized = parseAddress(op.originEthAddress); if (parseAddress(op.originUser) !== normalized) return { ok: false, reason: "address-mismatch" } } catch { return { ok: false, reason: "invalid-address" } }
  if (recover(signedForm(signedPayload(op)), op.signature) !== normalized) return { ok: false, reason: "invalid-signature" }
  const { originUser, ...payload } = signedPayload(op)
  return { ok: true, normalizedOriginEthAddress: normalized, payload: op.base === undefined ? payload : { ...payload, base: op.base } }
}
const CONTAINERS = new Set(["sync", "deltaSync", "fullStateSync"]) // §5.2

// §6.5 — a signed value verifies to `from` iff kind == "app", |now − at| ≤ maxAge and the envelope without `signature` recovers to `from`.
const verifyEnvelope = ({ signature, ...env }, now, maxAge) => env.kind === "app" && Math.abs(now - env.at) <= maxAge && !!signature && recover(signedForm(env), signature) === env.from ? env.from : null

// §6.1 — the hybrid logical clock.
const HLC = (wall) => { let physical = wall(), logical = 0; return {
  now: () => { physical = Math.max(physical, wall()); logical += 1; return { physical, logical } },
  update: (r) => { if (!r || typeof r.physical !== "number" || typeof r.logical !== "number") return; physical = Math.max(physical, r.physical); logical = Math.max(logical, r.logical) + 1 },
} }
const compare = (a, b) => !a && !b ? 0 : !a ? -1 : !b ? 1 : a.physical !== b.physical ? (a.physical < b.physical ? -1 : 1) : a.logical === b.logical ? 0 : a.logical < b.logical ? -1 : 1

// §7.2 / §7.3 / §7.5 — HKDF-SHA-256 (empty salt) → AES-256-GCM; content = DEFLATE(MessagePack(value)).
const hkdfKey = async (ikm, info, extractable = false) => subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: new Uint8Array(), info }, await subtle.importKey("raw", ikm, "HKDF", false, ["deriveKey"]), { name: "AES-GCM", length: 256 }, extractable, ["decrypt"])
const gcmOpen = async (key, ivHex, ctHex) => new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv: bytes(ivHex) }, key, bytes(ctHex)))
const openSealed = async (key, ivHex, ctHex) => decode(inflateSync(await gcmOpen(key, ivHex, ctHex)))
const unwrap = async (privHex, env, myPubHex) => { // §7.3: ikm = x-coordinate of ECDH; info = purpose ‖ p ‖ my compressed key, raw bytes
  if (env.v !== 2) throw new Error("sealed before 0.36.0 — re-save the record.")
  const shared = secp256k1.getSharedSecret(bytes(privHex), bytes(env.p), true).slice(1, 33)
  return hex(await gcmOpen(await hkdfKey(shared, cat(utf8("genosdb/envelope/v2"), bytes(env.p), bytes(myPubHex))), env.i, env.c))
}
const selfKey = (privHex) => hkdfKey(bytes(privHex), utf8("genosdb/self-encrypt/v3"), true) // §7.5
const selfDecrypt = async (key, text) => { const { iv, encrypted, type } = JSON.parse(text); if (type !== "aes-gcm-self-ssm-v3") throw new Error("unsupported type"); if (!iv || !encrypted) throw new Error("missing fields"); return openSealed(key, iv, encrypted) }

// ── sm.json: identity, canonical forms, signatures, verification ──
const sm = load("sm.json")
const pk0 = sm.identity.find((c) => c.name === "privkey-address")
check("sm.json · privkey-address (§3.2)", addressOf(secp256k1.getPublicKey(bytes(pk0.input.key), false)) === pk0.expected)
console.log("· sm.json · mnemonic-address (§3.1): phrase → key is BIP-39/32; proven through the bundle by verify.html, not here")
for (const c of sm.canonicalize) check(`sm.json · canonicalize · ${c.name} (§4.1)`, canonical(c.input) === c.expected, canonical(c.input))
for (const c of sm.sign) {
  const payload = { ...c.input, originUser: c.signer }
  const signature = sign(signedForm(payload), pk0.input.key)
  check(`sm.json · sign · ${c.name} re-signed byte-exact (§4.3)`, signature === c.expected.signature, signature)
  check(`sm.json · sign · ${c.name} recovers to the signer (§4.3)`, recover(signedForm(payload), c.expected.signature) === c.signer)
  check(`sm.json · sign · ${c.name} wire form (§4.4)`, eq({ ...payload, originEthAddress: c.signer, signature }, c.expected))
}
for (const c of sm.verify) check(`sm.json · verify · ${c.name} (§5.1)`, eq(verifyOp(c.input), c.expected), canonical(verifyOp(c.input)))

// ── sm-protocol.json: outgoing batches and the signed value ──
const sp = load("sm-protocol.json")
for (const c of sp.sign) c.expected.forEach((op, i) => {
  const input = c.input[i]
  if (CONTAINERS.has(op.type) || input.signature) check(`sm-protocol.json · sign · ${c.name}[${i}] passes through untouched (§5.2)`, eq(op, input) && (CONTAINERS.has(op.type) ? !op.signature : recover(signedForm(signedPayload(op)), op.signature) === parseAddress(op.originEthAddress)))
  else check(`sm-protocol.json · sign · ${c.name}[${i}] signed by ${c.key} byte-exact (§4.3)`, op.originUser === sp.addresses[c.key] && op.originEthAddress === op.originUser && sign(signedForm(signedPayload(op)), sp.keys[c.key]) === op.signature && eq({ ...input, originUser: op.originUser, originEthAddress: op.originUser, signature: op.signature }, op))
})
const sv = sp.signed_value, env = { kind: "app", from: sp.addresses.A, at: sv.at_ms, value: sv.value }
check("sm-protocol.json · signed value re-signed byte-exact (§6.5)", eq({ ...env, signature: sign(signedForm(env), sp.keys.A) }, sv.envelope))
for (const c of sv.verify) check(`sm-protocol.json · signed value · ${c.name} (§6.5)`, verifyEnvelope(c.envelope, c.now_ms, c.max_age_ms) === c.expected, String(verifyEnvelope(c.envelope, c.now_ms, c.max_age_ms)))

// ── hlc.json: the clock ──
const hlc = load("hlc.json")
for (const c of hlc.compare) check(`hlc.json · compare · ${c.name} (§6.1)`, compare(c.input.a, c.input.b) === c.expected)
for (const c of hlc.now) { const seq = [...c.input.wall_sequence]; let last; const clock = HLC(() => (last = seq.length ? seq.shift() : last)); check(`hlc.json · now · ${c.name} (§6.1)`, eq(Array.from({ length: c.input.calls }, () => clock.now()), c.expected)) }
for (const c of hlc.update) { const clock = HLC(() => c.input.wall_now_ms); const out = []; for (const [op, ts] of c.input.ops) op === "now" ? out.push(clock.now()) : clock.update(ts); check(`hlc.json · update · ${c.name} (§6.1)`, eq(out, c.expected), canonical(out)) }

// ── envelope-encryption.json: key envelopes and the sealed record ──
const ee = load("envelope-encryption.json")
check("envelope-encryption.json · owner public key (§3.3)", hex(secp256k1.getPublicKey(bytes(ee.ownerPriv), true)) === ee.ownerPub)
check("envelope-encryption.json · reader public key (§3.3)", hex(secp256k1.getPublicKey(bytes(ee.readerPriv), true)) === ee.readerPub)
check("envelope-encryption.json · addresses (§3.2)", addressOf(bytes(ee.ownerPub)) === ee.ownerAddress && addressOf(bytes(ee.readerPub)) === ee.readerAddress)
check("envelope-encryption.json · the reader's key rides in r (§7.3)", ee.envelopeForReader.r === ee.readerPub && ee.envelopeForOwner.r === ee.ownerPub)
check("envelope-encryption.json · ECDH point owner × reader (§7.3)", hex(secp256k1.getSharedSecret(bytes(ee.ownerPriv), bytes(ee.readerPub), false)) === ee.dhSharedPointExample_owner_x_reader)
check("envelope-encryption.json · owner unwraps the CEK (§7.3)", await attempt(() => unwrap(ee.ownerPriv, ee.envelopeForOwner, ee.ownerPub)) === ee.cek)
check("envelope-encryption.json · reader unwraps the CEK (§7.3)", await attempt(() => unwrap(ee.readerPriv, ee.envelopeForReader, ee.readerPub)) === ee.cek)
const cekKey = await subtle.importKey("raw", bytes(ee.cek), "AES-GCM", false, ["decrypt"])
check("envelope-encryption.json · the sealed record opens to the plaintext (§7.2)", eq(await attempt(() => openSealed(cekKey, ee.sealed.iv, ee.sealed.encrypted)), ee.plaintext))
check("envelope-encryption.json · an envelope without v is refused with its reason (§7.3)", await unwrap(ee.readerPriv, { ...ee.envelopeForReader, v: undefined }, ee.readerPub).then(() => false, (e) => e.message === ee.refused.anEnvelopeWithoutVersion))

// ── sm-payload.json: self-only fields ──
const pl = load("sm-payload.json")
check("sm-payload.json · identity address (§3.2)", addressOf(secp256k1.getPublicKey(bytes(pl.identity.private_key), false)) === pl.identity.address)
const key = await selfKey(pl.identity.private_key)
check("sm-payload.json · the derived key is byte-exact (§7.5)", hex(new Uint8Array(await subtle.exportKey("raw", key))).slice(2) === pl.derivation.derived_key_hex && pl.derivation.info === "genosdb/self-encrypt/v3" && pl.derivation.salt === "")
for (const c of pl.decryptable) check(`sm-payload.json · decrypt · ${c.label} (§7.5)`, c.type === "aes-gcm-self-ssm-v3" && eq(await attempt(() => selfDecrypt(key, c.encrypted_string)), c.plaintext))
for (const c of pl.rejects) check(`sm-payload.json · refuse · ${c.label} (§7.5)`, c.rejected === true && (await throws(() => selfDecrypt(key, c.input))))

// ── meta.json: the bundle the vectors describe ──
const meta = load("meta.json")
for (const [file, sha] of Object.entries(meta.bundle)) {
  const path = resolve(DIST, file.replace(/^dist\//, ""))
  if (existsSync(path)) check(`meta.json · ${file} sha256 matches ${path} (§13)`, createHash("sha256").update(readFileSync(path)).digest("hex") === sha)
  else console.log(`· meta.json · ${file}: not found at ${path} — pass --dist <dir> to bind a downloaded bundle`)
}
console.log(`· vectors extracted from genosdb ${meta.references.genosdb.sha.slice(0, 7)} / genossrv ${meta.references.genossrv.sha.slice(0, 7)} at ${meta.generated_at}`)
console.log(`\n${passed + failed} checks, ${failed} failed`)
process.exit(failed ? 1 : 0)
