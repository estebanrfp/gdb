# Identity — the door every GenosDB app opens with

There is no server to log into: the "login screen" is a door onto a graph that is already on the visitor's machine, and the Security Manager (`db.sm`) defines the flow. The canonical implementation is [design guide §4.1–4.2](https://github.com/estebanrfp/gdb/blob/main/docs/genosdb-design-guide.md) and the reference file [`examples/docs.html`](https://github.com/estebanrfp/gdb/blob/main/examples/docs.html) ([live](https://estebanrfp.github.io/gdb/examples/docs.html)): **copy it, do not redesign it** — every detail below is the fix for a failure that happened. The methods and the state object are in [API.md](API.md); the model in [SECURITY.md](SECURITY.md).

## The door

- A **centered native `<dialog>`**, never a sidebar panel or a separate page. It opens by itself on every load without a session — from the callback, never by hand at boot — and closes the instant a session activates; returning passkey users never see it.
- **No standing "Sign in" button and never a × close.** Signed out *is* the modal's state; re-entry is contextual (a read-only hint, the affordance of a gated control), and the top-right belongs to the session chip alone.
- **Dismissible or mandatory**, by what a guest can actually do. Content to consume → backdrop click and Esc close it: `modal.onclick = (e) => { if (e.target === modal) modal.close() }`. Nothing usable unsigned → refuse `cancel` while there is no session: `modal.addEventListener("cancel", (e) => { if (!currentUser) e.preventDefault() })`. The app stays visible behind the blur in both modes.
- Four blocks, in order: title and a one-line hint · the signed-in facts (a `<dl>`: address with a copy icon, role, what unlocked the session, passkey on this browser) · **one `<textarea>`** with a copy icon inside it · the action row (`Generate new identity`, `Login with mnemonic`, `Protect with passkey`, `Login with passkey`, the demo shortcut, `Logout`) · the warning "Save this phrase. There is no reset."

## The state draws everything

`setSecurityStateChangeCallback` is the single source of truth. It fires immediately and on every change — several times with `isActive: false` while an identity is being generated — so the callback **only redraws from the state object**: no flags of its own, no `wasActive`, no reset function. A callback that remembers will one day act on a repeat and wipe a phrase nobody wrote down. Pass the whole state to the renderer, never three destructured fields.

| property | meaning |
|---|---|
| `isActive` · `activeAddress` · `abbrAddr` | a session is open; the address, raw and abbreviated for display |
| `hasVolatileIdentity` | a key sits in memory, not yet secured by a passkey — it stays `true` after signing in with a fresh phrase |
| `hasWebAuthnHardwareRegistration` | this browser holds a passkey; use it inside the callback, never `hasExistingWebAuthnRegistration()`, whose promise is always truthy |
| `isWebAuthnProtected` | the session was opened or protected by a passkey |

| phase | visible | hidden |
|---|---|---|
| signed out | Generate · Login with mnemonic · Login with passkey (only with a registration) · the demo shortcut | Protect with passkey · the warning · the copy icon |
| onboarding — `hasVolatileIdentity && !isActive` | **Login with mnemonic (never a dead end)** · Protect with passkey · the warning · the copy icon | Generate (one identity at a time) · the demo shortcut (never invite abandoning an unsaved phrase) |
| active | the modal closes itself; the session chip reopens it as the identity view: the facts, Protect with passkey while `hasVolatileIdentity && !isWebAuthnProtected`, Logout | the field and every sign-in action |

```js
const onboarding = hasVolatileIdentity && !isActive
show(el.field, !isActive); show(el.facts, isActive)
show(el.generate, !onboarding && !isActive); show(el.login, !isActive)
show(el.protect, PASSKEYS_AVAILABLE && !isWebAuthnProtected && (onboarding || (isActive && hasVolatileIdentity)))
show(el.passkeyLogin, !onboarding && !isActive && PASSKEYS_AVAILABLE && hasWebAuthnHardwareRegistration)
show(el.demoLogin, !onboarding && !isActive); show(el.warning, onboarding); el.field.readOnly = onboarding
if (onboarding) el.field.value = db.sm.getMnemonicForDisplayAfterRegistrationOrRecovery() ?? el.field.value
else if (isActive || document.activeElement !== el.field) el.field.value = ""   // signed in: always clear; signed out: never mid-paste
```

The data subscription is **not** touched in the callback: `db.map` is subscribed once at boot and lives for the whole page. Re-subscribing on a session change replaces the live subscription and freezes the other window.

## The phrase

- **One field does both jobs**: paste an existing phrase, or read a freshly generated one. `readOnly` during onboarding; it grows with its content, so a 24-word phrase is checked without scrolling.
- **The phrase is the SM's to hand over** (`getMnemonicForDisplayAfterRegistrationOrRecovery()`). The app never stores it, logs it or keeps a copy: it exists on screen during onboarding and nowhere else. A production app ships no mnemonic in its source; the public demo identities of guide §4.5 are for examples only.
- **The copy control is an icon inside the field, and it only copies** (`writeText`): `readText()` raises a permission prompt, so there is no paste button — the keyboard pastes.

## The four actions

One SM call each, a toast on failure only — the callback is what tells the user they are in:

```js
const generate = async () => { if (!await db.sm.startNewUserRegistration()) toast("Could not generate an identity", "error") }
const login = async () => {
  const m = el.field.value.trim(); if (!m) return toast("Paste a mnemonic phrase first", "error")
  try { await db.sm.loginOrRecoverUserWithMnemonic(m) } catch { toast("That mnemonic is not valid", "error") }   // one method: a phrase this device never saw recovers, it does not fail
}
const protect = async () => { try { if (!await db.sm.protectCurrentIdentityWithWebAuthn()) toast("Passkey registration cancelled", "error") } catch { toast("Could not register the passkey", "error") } }
const passkeyLogin = async () => { try { if (!await db.sm.loginCurrentUserWithWebAuthn()) toast("Passkey login cancelled", "error") } catch { toast("Could not sign in with the passkey", "error") } }
```

`protectCurrentIdentityWithWebAuthn()` returns `null` when cancelled **and when the authenticator has no PRF extension**: the session stays a mnemonic session — say so, never pretend it is protected.

## Signed in

- **The session chip, top-right**: `0x1234…abcd [role]  Logout` in `--mono`, quiet, no filled pills, empty while signed out. Use `abbrAddr`, never the 42 characters.
- The chip opens the same dialog as the **identity view**: the address with a copy icon (abbreviated on screen, complete on the clipboard), the role, what unlocked the session, whether this browser holds a passkey — and `Protect with passkey` **still offered** while `hasVolatileIdentity && !isWebAuthnProtected`, because a user who signed in with a phrase would otherwise never see the offer again and lose the session on every reload.
- Logout is `clearSecurity()`: the callback returns the door to its signed-out phase and reopens it.

## Passkeys and sessions

- `const PASSKEYS_AVAILABLE = isSecureContext && !!window.PublicKeyCredential && !/^\d{1,3}(\.\d{1,3}){3}$/.test(location.hostname)`: WebAuthn needs a *domain*. `127.0.0.1` passes every other check and throws `SecurityError`; gate every passkey control on it, or a developer testing on an IP meets a raw browser error.
- A mnemonic session lives in memory and dies on reload. A passkey session **resumes silently on reload** and never prompts; a **new tab** always needs `loginCurrentUserWithWebAuthn()` from a user gesture — never call it on load. `sm: { resume: false }` asks the authenticator on every load instead.
- A second `gdb` instance in the same page re-initialises the Security Manager and clears the active signer: one instance per page.
