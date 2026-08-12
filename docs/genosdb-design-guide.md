# 🎨 GenosDB Design Guide

Opinionated UI patterns, design tokens and page architectures for applications built on GenosDB — written for **humans and AIs alike**. If you (or your AI assistant) are building a GenosDB application and want it to look and behave like a first-class citizen of the ecosystem, follow this guide.

The goal is coherence without complexity: every rule here is implementable in plain HTML + CSS + JavaScript, with no UI framework required.

> **Read the reference app first: [`examples/docs.html`](../examples/docs.html)** ([live](https://estebanrfp.github.io/gdb/examples/docs.html)). It is one self-contained file, and it implements this guide end to end — the identity door (§4.1), the banded layout (§5), the toast and the confirm dialog (§6), the single realtime subscription (§7). Every rule below was extracted from it after being built and verified there, which is also the order to work in: copy from the file, use the text to understand *why*. **If the two disagree, the file is right** — the guide has fallen behind and that is a bug worth reporting.

### Two deployment shapes, one design language

GenosDB applications ship in two shapes, and this guide applies equally to both:

- **No-build (examples, testbeds, prototypes):** a single self-contained `.html` — the shape of every official example, so a reader can save one file and run it — or three files (`index.html`, `styles.css`, `app.js`) once it outgrows that. Zero tooling either way.
- **Bundled (production apps):** installed from npm and bundled into the app. **Bun is the recommended bundler and runtime** — `bun build` inlines GenosDB's core, and the engine's optional `*.min.js` plugins are copied next to the output bundle. See [Bundler Configuration](bundler-configuration.md) for Bun, Vite, Webpack and esbuild setups.

The design language is identical in both — tokens and patterns don't care how the bytes arrived.

### Two profiles, one language

How much of this guide applies depends on what the page is *for*, not on how it ships. There are two profiles, and they share the same tokens and the same palette — a reader must never feel they have landed on a different product.

| | **Minimal profile** | **Full profile** |
| --- | --- | --- |
| What it is | A page that teaches one API | An application: identity, permissions, state |
| Examples | `todolist` · `singleNode` · `geo` · `paste` | `docs` · `acls` · `governance` · `collab` |
| Chrome | None — one column, no sidebar, no top bar | Sidebar · sticky top bar · full-height content (§5) |
| Applies | §2 tokens · §3 data display · §7 realtime · §8 semantics | The whole guide |
| Skips | §4 identity · §5 architecture · §6 components it doesn't use | — |

**Which one?** If the page has a session, permissions, or more than one view, it is full. If it exists to show a call and its result, it is minimal. When in doubt, minimal: chrome a demo doesn't need is noise between the reader and the API.

The minimal profile is **not** a licence to improvise a palette — but neither does it drag the whole token block along. **Copy only the tokens you actually use**, with their exact values from §2. Four or five is normal; a demo whose CSS outweighs its lesson has lost the plot, and a 15-line example that spends 40 lines declaring tokens it never reads is worse than one with no CSS at all.

```css
:root {
    /* only what this page paints — same names, same values as §2 */
    --bg-primary: #0d0f12;
    --text-primary: #e8eaed;
    --accent: #4c8dff;
    --border-subtle: #262b33;
    --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
* { box-sizing: border-box; }
body {
    margin: 0;
    padding: var(--space-5);
    max-width: 640px;
    font: 14px/1.5 var(--font);
    background: var(--bg-primary);
    color: var(--text-primary);
}
h1 { font-size: 17px; }
input, button {
    font: inherit;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--bg-secondary);
    color: var(--text-primary);
}
button { background: var(--accent); border-color: var(--accent); color: var(--text-on-accent); cursor: pointer; }
ul { list-style: none; margin: 0; padding: 0; }
li { padding: var(--space-2) 0; border-bottom: 1px solid var(--border-subtle); }
```

Twenty lines buy a demo that belongs to the same product as the app next to it. That is the whole cost of coherence — which is why no example ships a palette of its own.

The floor is lower still: a page that paints nothing needs no CSS. `chat.html` teaches its API in 15 lines with **zero** style rules, and adding tokens it never reads would only bury the lesson. The rule is not "always include the starter" — it is **the CSS follows the DOM**. One input and one list produce ten lines on their own; if you find yourself writing eighty, you have built an application and belong in the full profile.

---

## 1. Philosophy

1. **Content is the protagonist.** Chrome (navigation, session, widgets) stays visually quiet; data takes the full viewport height. Never let a fixed panel steal reading space.
2. **Minimal, precise, one vocabulary.** Generous whitespace, subtle borders instead of shadows, restrained color reserved for meaning (roles, status, actions). One set of token *names* everywhere; the palette behind them is chosen by what the page shows (§2).
3. **The API dictates the UX.** GenosDB's methods have natural interface consequences — mnemonic identity wants a focused modal, the security state callback wants a reactive session pill, governance roles want visible badges, realtime deltas want live DOM. Design *from* the API, not against it.
4. **No UI frameworks, no dependencies for style.** Design tokens + plain CSS cover everything, whether the app is a three-file example or a Bun-bundled product. The only sanctioned UI dependencies are functional (e.g. DOMPurify for untrusted content).
5. **Small surface, strong opinions.** When in doubt, do less.

---

## 2. Design Tokens

Copy this `:root` block as-is. Every color, radius and spacing in your app must reference a token — never hardcode values in component rules.

```css
:root {
    /* Backgrounds (dark → elevated) */
    --bg-primary: #0d0f12;      /* page */
    --bg-secondary: #14171c;    /* cards, sidebar */
    --bg-tertiary: #1c2026;     /* inputs, hover, pills */
    --bg-elevated: #22262d;     /* modals, popovers */

    /* Text */
    --text-primary: #e8eaed;
    --text-secondary: #9aa3ad;
    --text-tertiary: #5c6570;   /* hints, timestamps, addresses */

    /* Accent & status */
    --accent: #4c8dff;          /* primary actions, links */
    --accent-hover: #6ba1ff;
    --ok: #34c77b;              /* success, earned tiers */
    --warn: #f5a623;            /* drafts, moderation, caution */
    --danger: #ef5350;          /* delete, errors */
    --violet: #a78bfa;          /* superadmin / root-of-trust */

    /* Borders */
    --border-subtle: #262b33;
    --border-strong: #333a44;

    /* Contrast pairs & elevation (text over accent, backdrop, floating panels) */
    --text-on-accent: #ffffff;
    --backdrop: rgba(0, 0, 0, .6);
    --shadow: 0 8px 24px rgba(0, 0, 0, .35);

    /* Shape & rhythm (8px grid) */
    --radius-sm: 6px;           /* buttons, inputs */
    --radius-md: 10px;          /* cards */
    --radius-lg: 14px;          /* modals */
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 24px;
    --space-6: 32px;

    /* Typography */
    --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", Arial, sans-serif;
    --mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace;
}
```

### Color mode: chosen by what the page shows

One vocabulary of tokens, two sets of values. The names above never change; a page picks its palette by **what the reader is looking at**, which is a property of the page, not a matter of taste:

| The reader is looking at… | Palette | Why |
| --- | --- | --- |
| **Data and measurements** — monitors, probes, benches, charts | **dark** | The background disappears and the data carries the page. §5.6 |
| **An interface built to be learned** — testbeds, playgrounds | **light** | It reads like interactive documentation, next to the docs it illustrates |
| **A product** — example applications | **dark** | It *is* the product; this is GenosDB's face |

Pick once, at the top of the file, and never mix. The light set redefines values only — no component rule ever changes:

```css
:root {
    /* Light values — same names, same roles */
    --bg-primary: #f4f6fa;      --bg-secondary: #ffffff;
    --bg-tertiary: #f1f3f7;     --bg-elevated: #ffffff;
    --text-primary: #1a1d24;    --text-secondary: #6b7280;
    --text-tertiary: #9aa1ad;
    --accent: #2563eb;          --accent-hover: #1d4ed8;
    --ok: #16a34a;              --warn: #b45309;
    --danger: #dc2626;          --violet: #7c3aed;
    --border-subtle: #e4e7ee;   --border-strong: #d4d9e3;
    --text-on-accent: #ffffff;  --backdrop: rgba(26, 29, 36, .45);
    --shadow: 0 6px 24px rgba(26, 29, 36, .07);
}
```

**If switching palettes forces you to touch a single component rule, the token system is broken — fix the tokens.** That is the whole point of having one vocabulary: `acls.html` (light testbed) and `docs.html` (dark application) should differ in fifteen values and nothing else.

For **consumer-facing product apps**, a runtime theme toggle is a sanctioned opt-in pattern on top of this, with exact rules:

1. **One icon button** in the top bar, next to the session pill, with an `aria-label`. It cycles **three** states — `system → light → dark` — and the icon shows the state you are *in*, not the one you would switch to: a sun for light, a moon for dark, a monitor for system.
2. **Three, not two, because "system" is not a palette — it is a deferral.** Two states force a choice on first visit and then ignore the reader who changes their OS at sunset. The third is also the honest default: nobody has expressed a preference yet.
3. **Two attributes, because they answer different questions.** `data-theme` is the palette in force and the only thing the CSS reads. `data-pref` is what the reader asked for, and only it distinguishes *"dark because I chose dark"* from *"dark because the OS is dark"* — without it the button cannot draw its own state.

```javascript
const THEME_ORDER = ['system', 'light', 'dark']
const systemTheme = matchMedia('(prefers-color-scheme: light)')

const applyTheme = (pref) => {
  const root = document.documentElement
  root.dataset.pref = pref
  root.dataset.theme = pref === 'system' ? (systemTheme.matches ? 'light' : 'dark') : pref
  localStorage.theme = pref
  themeBtn.title = `Theme: ${pref}`
}

// On `system` the OS can change under us — follow it without a reload.
systemTheme.addEventListener('change', () => {
  if (document.documentElement.dataset.pref === 'system') applyTheme('system')
})

applyTheme(localStorage.theme ?? 'system')
themeBtn.onclick = () =>
  applyTheme(THEME_ORDER[(THEME_ORDER.indexOf(document.documentElement.dataset.pref) + 1) % THEME_ORDER.length])
```

```css
/* Inline SVGs, one shown per preference. Never emoji: these sit beside the
   other line icons and must inherit the text colour like they do. */
.icon-moon, .icon-system { display: none; }
[data-pref="dark"]   .icon-sun { display: none; }
[data-pref="dark"]   .icon-moon { display: block; }
[data-pref="system"] .icon-sun { display: none; }
[data-pref="system"] .icon-system { display: block; }
```

4. **The golden rule:** if enabling the toggle requires touching any component CSS, the token system is broken — fix the tokens, never patch components. A well-built toggle costs ~25 lines total and doubles as living proof that the design tokens work.

---

## 3. Typography & Data Display

- **System font stack** for UI text; **monospace** (`--mono`) is *mandatory* for machine data: Ethereum addresses, node IDs, hashes, timestamps, peer IDs.
- **Addresses are never shown in full.** Always `db.sm.abbrAddr(address)` (e.g. `0x1234...abcd`), rendered in `--mono` + `--text-tertiary`.
- **Timestamps** localize with `new Date(ts).toLocaleString()` — never raw epoch numbers in the UI.
- **Untrusted content is always sanitized.** Anything a peer can write (titles, descriptions, markdown) is escaped before `innerHTML`, and rendered markdown passes through DOMPurify. A P2P app has no server to sanitize for you.
- Missing attribution (nodes created before identity existed) renders as `by unknown` — never a broken or empty label.

---

## 4. Identity & Session

This is the most GenosDB-specific chapter: the Security Manager's methods define the flow, the guide defines its shape. (Method-level best practices live in the [SM API Reference](sm-api-reference.md); this section covers the visual pattern.)

### 4.1 The identity door — the canonical implementation

Every GenosDB app opens the same way: there is no server to log into, so the "login screen" is a door onto a graph that is already on the visitor's machine. This is the whole flow — markup, styling and wiring — settled across several examples. **Copy it; do not redesign it.** The parts that look like arbitrary detail are each the fix for a specific failure, noted where it applies.

Identity actions live in a **centered modal** (native `<dialog>`), never a sidebar panel or a separate page: the mnemonic flow is short, focused and security-critical, and a modal isolates it, keeps the app visible behind a dimmed backdrop, and disappears the instant the session activates.

**No standing "Sign in" button — the modal IS the door.** A distributed app has no server-side login page, so don't emulate one with a persistent button. The modal opens automatically on every load without an active session; returning passkey users never see it, because their session resumes and the security callback closes it.

#### The markup

Four blocks, in this order. Anything that needs a paragraph goes to the foot, under the fold of attention.

```html
<dialog id="identity-modal">
  <h2 class="modal-title">App name</h2>
  <p class="modal-hint">One line on what this app is.</p>

  <div class="mnemonic-field">
    <textarea id="mnemonic-input"
      placeholder="Enter your 12-word mnemonic phrase to log in or recover…"></textarea>
    <button id="mnemonic-clip" class="field-action hidden" title="Copy phrase" aria-label="Copy phrase">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
  </div>

  <div class="modal-actions">
    <button id="generate-btn" class="primary">Generate new identity</button>
    <button id="login-btn" class="primary">Login with mnemonic</button>
    <button id="passkey-protect-btn" class="primary hidden">Protect with passkey</button>
    <button id="passkey-login-btn" class="hidden">Login with passkey</button>
    <button id="demo-login-btn" class="ghost">🛡️ Superadmin (demo)</button>
  </div>

  <p id="phrase-warning" class="modal-warn hidden">Save this phrase. There is no reset.</p>

  <!-- Guidance for whoever reads this file, deliberately not on screen:
       what this demo relaxes, and where the real pattern lives. -->
</dialog>
```

**One `<textarea>` does both jobs** — you paste an existing phrase into it, and a freshly generated one appears in it. Two fields would ask the visitor to understand the difference before they have one.

**The copy control is an icon inside the field, not a button in the stack.** It appears only once there is something to copy, and it only *copies*: `navigator.clipboard.readText()` raises a permission prompt while `writeText()` does not, so a paste button would make a demo ask for clipboard access before the visitor has done anything — for a gesture the keyboard already handles.

#### The CSS

```css
dialog {
  width: min(440px, calc(100vw - var(--space-6)));
  padding: var(--space-6);
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  text-align: center;
}
dialog::backdrop { background: var(--backdrop); backdrop-filter: blur(2px); }

.modal-title { margin: 0 0 var(--space-3); font-size: 26px; font-weight: 700; letter-spacing: -.02em; }
.modal-hint  { margin: 0 0 var(--space-5); font-size: 14px; color: var(--text-secondary); }

.mnemonic-field { position: relative; }

#mnemonic-input {
  min-height: 45px;       /* the exact height of an action button */
  display: block;         /* an inline-block textarea leaves 6px of descender below it */
  background: none;       /* it sits on the modal's own surface */
  padding-right: 32px;    /* the copy icon never sits on the last word */
  overflow: hidden;
  font-family: var(--mono);
  font-size: 13px;
  text-align: left;
}
#mnemonic-input:focus { border-color: var(--border-strong); }  /* no accent ring — see below */

.field-action {
  position: absolute; right: 6px; bottom: 6px;
  display: flex; padding: 5px;
  background: none; border: none; color: var(--text-tertiary);
}
.field-action svg { width: 15px; height: 15px; }
.field-action:hover:not(:disabled) { color: var(--text-primary); border-color: transparent; }

.modal-actions { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-2); }
.modal-actions button { width: 100%; padding: 13px var(--space-4); font-size: 14px; font-weight: 600; }

.modal-warn { display: grid; place-items: center; min-height: 45px; margin: var(--space-2) 0 0;
              font-size: 13px; font-weight: 600; color: var(--warn); }
.modal-foot { margin: var(--space-5) 0 0; font-size: 12px; color: var(--text-tertiary); }
```

Four measurements carry the layout, and each answers a defect:

- **`min-height: 45px` on the field, matching a button.** A logout empties the textarea, and `autoGrow` then measures nothing and collapses it to a single line — the modal visibly shrank on the way out. The floor keeps it the size of the stack it belongs to.
- **`display: block` on the textarea.** An `inline-block` textarea sits on the text baseline and leaves ~6px of descender beneath it, so any margin you set below it reads 6px larger than the number in the CSS.
- **`margin-top: var(--space-2)` above the actions, equal to the gap between them.** The field is the first step of one stack, not a separate block — a wider gap separates things that are not separate.
- **The warning is sized like a button** (`min-height: 45px` + the same gap). It takes over the slot the demo shortcut vacates when a phrase is generated, so the modal keeps its height across phases instead of jumping under the cursor.

**The mnemonic field keeps its ordinary grey border on focus** — the documented exception to the accent-on-focus rule for form fields (§6). The dialog focuses it on open, so the accent would fire before the visitor has done anything, spotlighting the one element that should stay quiet. In a text field the caret already says where you are.

#### Passkeys: gate on the RP ID, not just the secure context

WebAuthn derives its Relying Party ID from the hostname and requires a *domain*; an IP address never qualifies. `127.0.0.1` is a secure context, so `PublicKeyCredential` exists and every check you would think to write passes — and registration then fails with `SecurityError: This is an invalid domain`. Verified on the same page and the same code: `localhost` reaches the authenticator, `127.0.0.1` throws. Gate on all three conditions, or a developer testing on an IP meets a raw browser error:

```javascript
const PASSKEYS_AVAILABLE =
    window.isSecureContext &&
    !!window.PublicKeyCredential &&
    !/^\d{1,3}(\.\d{1,3}){3}$/.test(location.hostname) // an IP is never an RP ID
```

#### The phase comes from the state, not from a variable

**The SM already publishes the phase — do not track it yourself.** The state passed to the session callback carries six properties, and the [SM API Reference](sm-api-reference.md) is explicit that the UI is driven by them:

| Property | What it says |
| --- | --- |
| `isActive` | A session is open |
| `activeAddress` · `abbrAddr` | The address, raw and pre-abbreviated for display |
| `hasVolatileIdentity` | A freshly generated identity sits in memory, not yet secured |
| `hasWebAuthnHardwareRegistration` | This browser holds a WebAuthn credential |
| `isWebAuthnProtected` | The current session was opened or protected by a passkey |

Every button follows from those. An app that mirrors them in its own flags has built a second source of truth, and the day the two disagree is the day the freshly generated phrase gets wiped before it was written down.

| Phase | Visible | Hidden |
| --- | --- | --- |
| Signed out | `Generate new identity` · `Login with mnemonic` · `Login with passkey` *(only if a registration exists)* · demo shortcut | `Protect with passkey` · the warning · the copy icon |
| Onboarding (`hasVolatileIdentity && !isActive`) | `Login with mnemonic` *(must remain — no dead ends)* · `Protect with passkey` · the warning · the copy icon | `Generate new identity` *(one identity at a time)* · demo shortcut *(never invite abandoning an unsaved phrase)* |
| Session active | — the modal closes itself; a logout returns to phase 1 and reopens it | |

```javascript
const renderIdentityModal = ({ isActive, hasVolatileIdentity, hasWebAuthnHardwareRegistration, isWebAuthnProtected }) => {
    // `hasVolatileIdentity` stays true after signing in with a fresh phrase — the
    // identity lives in memory until a passkey secures it. Onboarding, though, ends
    // the moment you are in, and the phrase must not outlive it on screen.
    const onboarding = hasVolatileIdentity && !isActive

    show(el.generate, !onboarding)
    show(el.passkeyProtect, onboarding && PASSKEYS_AVAILABLE && !isWebAuthnProtected)
    show(el.passkeyLogin, !onboarding && PASSKEYS_AVAILABLE && hasWebAuthnHardwareRegistration)
    show(el.demoLogin, !onboarding)      // hidden while a fresh phrase is unsaved
    show(el.phraseWarning, onboarding)   // only a fresh phrase can still be lost
    el.mnemonic.readOnly = onboarding

    // The phrase is the SM's to hand over — the app never keeps a copy.
    if (onboarding) {
        el.mnemonic.value = db.sm.getMnemonicForDisplayAfterRegistrationOrRecovery() ?? el.mnemonic.value
    } else if (isActive || document.activeElement !== el.mnemonic) {
        el.mnemonic.value = ""   // signed in: always clear. Signed out: never mid-paste.
    }

    syncClipAffordance()
    autoGrow()
}
```

Two things fall out of rendering from the state instead of tracking it:

- **`hasWebAuthnHardwareRegistration` replaces `hasExistingWebAuthnRegistration()`** inside the callback. The method may return a `Promise`, which in a boolean expression is always truthy — the property is synchronous and already current.
- **There is no reset function and no `wasActive` flag.** The SM fires this callback several times while an identity is being generated, and that is harmless precisely because nothing here remembers anything: each pass redraws from the state, so a repeat is idempotent instead of destructive.

The field grows with its content, so an empty field is compact and a 24-word phrase is fully visible — you must be able to check a recovery phrase without scrolling it:

```javascript
const autoGrow = () => {
    const field = el.mnemonic
    field.style.height = "auto"
    // scrollHeight excludes borders, and box-sizing counts them in height.
    const borders = field.offsetHeight - field.clientHeight
    field.style.height = `${field.scrollHeight + borders}px`
}
```

#### The four actions

Each one is a single SM call plus a toast on failure. The success path never toasts here — the session callback is what tells the user they are in.

```javascript
const generateIdentity = async () => {
    if (!await db.sm.startNewUserRegistration()) return toast("Could not generate an identity", "error")
    // No UI here: the state change fires and renderIdentityModal draws it.
    toast("Identity generated — save the phrase before you leave", "success")
}

const loginWithMnemonic = async () => {
    const mnemonic = el.mnemonic.value.trim()
    if (!mnemonic) return toast("Paste a mnemonic phrase first", "error")
    try { await db.sm.loginOrRecoverUserWithMnemonic(mnemonic) }
    catch { toast("That mnemonic is not valid", "error") }
}

const protectWithPasskey = async () => {
    try {
        if (!await db.sm.protectCurrentIdentityWithWebAuthn()) toast("Passkey registration cancelled", "error")
    } catch { toast("Could not register the passkey", "error") }
}

const loginWithPasskey = async () => {
    try {
        if (!await db.sm.loginCurrentUserWithWebAuthn()) toast("Passkey login cancelled", "error")
    } catch { toast("Could not sign in with the passkey", "error") }
}
```

`loginOrRecoverUserWithMnemonic` is one method for both cases — a phrase the device has never seen recovers the identity rather than failing. There is no separate "recover" button, and the placeholder says so.

#### The session callback owns the whole session UI

`db.sm.setSecurityStateChangeCallback` is the **single source of truth**: it opens and closes the door, resets the field, and toggles every gated control. No other code path duplicates it, and nothing else calls `showModal()` — not even at boot.

```javascript
const onSecurityStateChange = (state) => {
    const { isActive, activeAddress, abbrAddr } = state
    currentUser = isActive ? activeAddress : null

    el.sessionAddr.textContent = isActive ? abbrAddr : ""
    show(el.logout, isActive)
    el.newDoc.disabled = !isActive

    renderIdentityModal(state)

    // The data subscription is NOT touched here. It is subscribed once at boot
    // and lives for the whole page: the query is the same signed in or out, and
    // re-subscribing on every session change is what tears down a live
    // subscription and leaves the other window frozen (§7.1).
    if (isActive) return el.modal.close()

    closeOpenItem()                          // no session, no open item — a no-op when none is
    if (!el.modal.open) el.modal.showModal() // signed out *is* the modal's state
}

db.sm.setSecurityStateChangeCallback(onSecurityStateChange)
```

Three things make those lines safe to run repeatedly:

- **The whole state object is passed on, not destructured away.** `renderIdentityModal(state)` gets every property; pulling out three and forwarding those three is how an app ends up re-deriving the rest by hand.
- **Every branch is idempotent.** The SM reports `isActive: false` several times while an identity is being generated, so a callback that *remembers* — a reset flag, a previous value — will eventually act on a repeat and wipe a phrase that was never written down. One that only redraws cannot.
- **The data subscription stays out of here.** Calling `db.map()` again on every session change is the most common way to break realtime in a GenosDB app: the new subscription replaces the live one, and the *other* window stops updating (§7.1).

#### Mandatory or dismissible

**Never a × close button** — a corner × reads as window chrome and, in the backup phase, invites closing before the phrase is saved. Beyond that, the door has two modes, and the app picks by what a visitor without an identity can actually *do*:

| | **Dismissible** | **Mandatory** |
| --- | --- | --- |
| When | A guest has real content to consume — a feed, a public board, a document shared with everyone | Nothing is usable without signing, or entering unsigned would mislead |
| Closing | Backdrop click and `Esc` | Neither; only a successful sign-in |
| Behind it | The app, fully usable read-only | The app, visible through the blur — it shows what you are about to join |

```javascript
// Dismissible: the backdrop is the dialog itself as event target.
modal.onclick = (e) => { if (e.target === modal) modal.close() }

// Mandatory: Esc is native to <dialog> and must be refused explicitly.
// There is no click handler at all — the backdrop does nothing.
modal.addEventListener("cancel", (e) => { if (!currentUser) e.preventDefault() })
```

Keeping the app visible behind the blur matters in both modes: a full-bleed login page hides the thing the newcomer came to see, and there is nothing to hide — the graph is already on their machine.

- **Logging out returns to phase 1 with the modal open** — signed-out *is* the modal's state.
- **Re-entry without reloading is contextual**, not chrome: a clickable read-only status hint, or the explanatory affordance of a gated control, re-opens the modal. The top-right area belongs to the session chip alone and stays empty while signed out.
- **Explain the demo in a comment, not on screen.** An example carries things a real app would not — guest writes left open, a known mnemonic, a relaxed role ladder — and they have to be stated somewhere or the reader copies them into production. That somewhere is an HTML comment next to the markup it concerns. The door stays four blocks and nothing else; the person who needs the caveat is reading the file, not looking at the screen. Examples also add the one-click demo shortcut of §4.5; production apps ship no mnemonic in their source.

### 4.2 Session: always top-right

An authenticated session renders **anchored to the top-right** of the content area (the universal convention users scan for), in the canonical format — abbreviated address first, role second:

```
0x1234...abcd [role]   Logout
```

The address is `--mono` + `--text-secondary`; the role reads as a quiet bracketed tag. **Restraint over decoration**: no saturated filled pills, no competing colors — the session area is chrome, not content.

- Signed out → the spot stays **empty**: the auto-opened modal is the door (§4.1), and contextual CTAs re-open it. No standing Sign-in button.
- The top bar is `position: sticky` over the content scroll, with a subtle bottom border.
- `db.sm.setSecurityStateChangeCallback(...)` is the **single source of truth**: it toggles the pill/button, closes the modal, and resets the mnemonic textarea on logout. No UI state duplicates it.

### 4.3 Role badges

The live role (watched reactively on the `user:<address>` node) renders as a quiet uppercase tag — **tier color applied to the text (or a subtle border), never a filled background**. Map ascending trust tiers to a fixed color ramp so every GenosDB app reads the same way:

| Tier | Token | Meaning |
| --- | --- | --- |
| Base / guest | `--text-tertiary` (gray) | Read-only newcomer |
| First earned tier | `--ok` (green) | Can write |
| Mid tier | `--accent` (blue) | Extra capability (e.g. publish) |
| Elevated tier | `--warn` (orange) | Moderation powers |
| Superadmin | `--violet` | Root of trust — signs promotions |

Permission-gated controls (a "New post" button, a publish selector) show or hide from the same watched role — the UI *reflects* permissions, while the engine *enforces* them.

### 4.4 Presence & contribution: gate by degrees

Realtime collaboration surfaces are not all equal. Gate each one by the **smallest trust step it actually needs** — read-only guests stay welcome, while every contribution becomes attributable:

| Surface | Requires | Why |
| --- | --- | --- |
| Watching (content, live updates, remote cursors) | Nothing | Zero-trust guests read for free |
| Broadcasting yourself (camera / mic streams) | A signed-in identity | Everyone should know *who* is on screen |
| Contributing content (edits, messages, files) | An earned `write` role | Persistent, signed, verified by peers |
| Moderating (deleting others' content) | An elevated tier | Same ramp as the role badges |

Two implementation rules:

- **Disable gated controls, don't hide them** (`disabled` + an explanatory `title` such as *"Sign in to share your camera"*): a visible-but-locked control teaches the trust model; a missing one just looks broken.
- Ephemeral channel traffic (GenosRTC) does **not** pass through the graph's RBAC — the role gate on the UI keeps honest peers silent, and the **signed graph remains the source of truth** that corrects any transient view.

**Moderation over node-level ACLs is granted, never inherited.** This one surprises people, and the surprise costs an afternoon. With `acls: true`, a node carries its own `owner` and `collaborators`, and every peer enforces *that* list — not the role ramp. A superadmin is the root of trust for **roles**; it is not an owner of other people's nodes, so it cannot delete them however high its tier sits. (`deleteAny` can be declared in `customRoles` and reads like the answer, but nothing in the engine evaluates it.)

The pattern that works is to grant the moderator at creation time, so the authority is written into the node itself:

```javascript
const id = await db.put({ type: "document", title, content, owner: currentUser })
// The moderator is a collaborator from the first moment, by the owner's own act.
if (!isSuperadmin(currentUser)) await db.sm.acls.grant(id, SUPERADMIN.address, "delete")
```

This is the zero-trust model being consistent, not a gap in it: authority over a node comes from the node, and a peer that never agreed to be moderated is not moderated. Design the UI accordingly — moderation powers are real only where the content granted them.

One asymmetry to expect in the same area: `acls.set` gates its local guard on `write` alone, so a collaborator holding `delete` — the *wider* permission — is refused by it and has to write through `db.put`. Split the save path on the permission rather than widening anyone's access.

### 4.5 Demo identities: one canonical set for every example

Examples and testbeds share **one fixed set of public, throwaway identities** so that any two windows of any demo can log in with a single click and already know each other — a device to show the trust model working, never part of a production app, which has no mnemonic in its source. Copy this block verbatim; never invent new addresses.

```javascript
// These are public, throwaway identities (they protect nothing) included so each
// window of this demo can log in with a single click.
const SUPERADMIN = {
  name: 'Superadmin', emoji: '🛡️',
  // TESTING ONLY: one-button governance authority for this demo.
  mnemonic: 'panic now afford carbon donate lecture drift excite collect essay stuff prosper',
  address: '0xbfDe0eCEC5332Fd86D2570085571D6051Df098dA',
}
const ALICE = {
  name: 'Alice', emoji: '👩‍🦰',
  mnemonic: 'prosper fossil kitten crisp view spread jeans shield prosper myself awake usage',
  address: '0x3546D4BA0ac3bfDea3F1511F82a078DDdb3F4931',
}
const BOB = {
  name: 'Bob', emoji: '👨‍🦱',
  mnemonic: 'salmon grant recall neutral banner glow pluck divert cactus theory rally ship captain shaft cactus',
  address: '0x8089C0480139d85D82c1E20eeF08a77EF8cD7DEC',
}
```

Rules:

- **`superAdmins` always references `SUPERADMIN.address`** — even when the demo's trust flows entirely through node-level ACLs and the superadmin never acts, the constitution still needs an authority. A placeholder address (`0x000…`, `0x111…`) is never acceptable.
- **The one-click login is a real button**, the demo shortcut of §4.1: a quiet `ghost` button on the same action row as `Login with mnemonic`, labelled with the identity's emoji and name (`🛡️ Superadmin (demo)`). It hides during the *after generating* phase so it never invites abandoning an unsaved phrase.
- Take only the identities the demo actually uses: a two-party sharing demo needs Alice and Bob, a governance demo needs the superadmin too. An unused mnemonic sitting in the file is dead code.
- Reuse the identities across examples rather than adding new ones — a reader who has already met Alice and Bob recognizes them in the next testbed.

---

## 5. Page Architecture by Application Type

> **The reference implementation is [`examples/docs.html`](../examples/docs.html)** ([live](https://estebanrfp.github.io/gdb/examples/docs.html)). Every rule in this chapter is taken from it and verified there. When the text and the file disagree, the file is right and the text is a bug — read it first, copy from it, and keep it in the other window while you build.

### 5.0 Chrome lives at the edges

Before any specific architecture, one rule governs all of them: **the content occupies the middle and nothing else does.** Chrome goes to the edges, in bands, and each band answers a different question. A control placed in the wrong band is not a cosmetic problem — it steals reading space, or it moves while someone is reading.

```
┌─────────────────────────────────────────────┐
│ ①  what this app is          who I am       │  ← identity of app + session
├──────────────┬──────────────────────────────┤
│ ② find/add   │                              │  ← the collection, and its search
│──────────────│  ③  the content, alone       │
│   item       │                              │
│   item       │                              │
│              ├──────────────────────────────┤
│              │ ④ this item      the network │  ← state, never actions
└──────────────┴──────────────────────────────┘
```

**① The top bar — the app and the session, nothing else.** Brand on the left; on the right the abbreviated address, theme and logout, as icons. Nothing here belongs to the open item, so the bar never changes as you work — and a bar that never changes is one the eye stops checking.

**② The list column — the collection, with its own search at its head.** Search belongs to the list it filters, not to the app: put it in the top bar and it claims a place among the session controls, where it is neither. It shares one band with the *new* action, reduced to a `＋` — a full-width button spends a whole band on a single word, and that band is the most valuable strip on the page.

**③ The content column — only the content.** No panel opens inside it, no toolbar appears, nothing resizes it. Anything that would push the text sideways goes in a `<dialog>` instead (§6).

**④ The status bar — what is true, never what you can do.** It reports and never acts: state of the open item on the left (permission, owner, timestamp), state of the network on the right (`3 peers`). A button here would make the reader watch the bottom edge, which defeats the point of having one.

Three rules make the bands hold:

- **Connection state belongs at the bottom right.** It is ambient, it changes on its own, and nobody acts on it — the diagonal opposite of the brand, and as far as it gets from the content. In the top bar it competes with the session, which is the one thing up there people do act on.
- **The status bar spans the content column only, not the sidebar.** The list then runs the full height of the window, unbroken, and the bar stays visually attached to the document it describes. A bar across the whole width cuts the list in two for information that has nothing to do with it.
- **One surface, borders divide.** Every band shares `--bg-secondary` with the content; only 1px borders separate them. Give the content a darker well and it reads as a separate pane — and the content is not a pane inside the app, it *is* the app.

**The rhythm is a single value: `--space-2` (8px).** Stacked controls, a field and the button under it, the gap between icons — all 8. Distinct blocks get `--space-4` or `--space-5`, never something in between. When two things sit 8px apart they read as one group; when the gap grows without a reason, the eye invents one.

**Icons for chrome, words for content actions.** Anything permanent and repeated on every screen — theme, logout, *new* — is a line icon with a `title` and an `aria-label`. Anything acting on the open item — `Preview`, `Share`, `Delete` — keeps its word, because it is read once, deliberately, and its consequences differ. Never emoji in either case: a line icon inherits the text colour like every other mark on the page (§6), and an emoji brings a palette of its own that no theme can touch.

### 5.1 The skeleton, and the order it boots in

Two things every full-profile app gets right or spends a day debugging: where the chrome lives, and what runs when.

**The layout is a two-row grid over a two-column grid.** One bar holds every piece of chrome so nothing competes for the corner; below it, the list and the content sit side by side and neither ever resizes the other.

```html
<div class="layout">
  <header class="topbar">
    <h1 class="brand">App name <span>· what it demonstrates</span></h1>
    <div class="session">
      <button id="session-addr" class="session-addr" title="Copy your full address"></button>
      <button id="theme-btn" class="icon-btn" title="Theme" aria-label="Theme">…</button>
      <button id="logout-btn" class="icon-btn hidden" title="Logout" aria-label="Logout">…</button>
    </div>
  </header>

  <div class="body">
    <nav class="sidebar">
      <div class="sidebar-head">
        <svg class="search-icon" aria-hidden="true">…</svg>
        <input id="search-input" class="search" type="text" placeholder="Search…" aria-label="Search">
        <button id="new-btn" class="icon-btn" disabled title="Sign in to create" aria-label="New">＋</button>
      </div>
      <ul id="item-list" class="doc-list"></ul>
      <p id="list-empty" class="list-empty hidden">Nothing matches that search.</p>
    </nav>

    <div class="main">
      <main class="content">
        <div id="empty-view" class="empty">…</div>
        <article id="editor-view" class="editor hidden">…</article>
      </main>

      <footer class="statusbar">
        <div class="editor-meta">…permission · owner · timestamp…</div>
        <span id="presence" class="presence">0 peers</span>
      </footer>
    </div>
  </div>
</div>
```

**Where each control lives, and why:**

- **Search heads the list it filters**, inside the sidebar, with *new* beside it as a `＋`. A full-width button spends a whole band on one word, and search belongs to the list, not to the app. The field drops its box, so a magnifier sits at its head to do the one job the border used to: say what the field is. It is a label, not a button — no hover, no hit area, `aria-hidden` because the input already carries the label.
- **The top bar holds only what is true of the session** — address, theme, logout — as icons. It never resizes and nothing in it belongs to the open item.
- **The status bar sits under the content column only**, not across the sidebar: the list runs the full height beside it, unbroken, and the bar stays with the document it describes. Item state on the left, connection state on the right.

```css
body   { height: 100vh; height: 100dvh; overflow: hidden; background: var(--bg-primary); }
.layout  { display: grid; grid-template-rows: auto 1fr; height: 100vh; height: 100dvh; }
.topbar  { display: flex; align-items: center; justify-content: space-between;
           gap: var(--space-4); min-height: 48px; padding: var(--space-2) var(--space-5);
           background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); }
.session { display: flex; align-items: center; gap: var(--space-3); margin-right: -6px; }
.body    { display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); min-height: 0; }
.sidebar { display: flex; flex-direction: column; min-width: 0; min-height: 0;
           background: var(--bg-secondary); border-right: 1px solid var(--border-subtle); }
.main    { display: flex; flex-direction: column; min-width: 0; min-height: 0;
           background: var(--bg-secondary); }
.content { flex: 1; min-height: 0; display: flex; flex-direction: column;
           overflow-y: auto; padding: var(--space-5); }

/* Search and "new" share one band at the head of the list. */
.sidebar-head { display: flex; align-items: center; gap: var(--space-2);
                min-height: 48px; padding: var(--space-2) var(--space-3);
                border-bottom: 1px solid var(--border-subtle); }
.sidebar-head .icon-btn { margin-right: -6px; }

/* No box: the band already delimits it. Needs the element in the selector to
   outrank `input[type="text"]`, which it ties with and which is declared later. */
.sidebar-head input.search { flex: 1; min-width: 0; border: none; background: none; font-size: 13px; }

/* The mirror of the top bar, under the content column only. */
.statusbar { display: flex; align-items: center; justify-content: space-between;
             gap: var(--space-4); min-height: 48px; padding: var(--space-2) var(--space-5);
             background: var(--bg-secondary); border-top: 1px solid var(--border-subtle); }

/* Stacked, and still one screen — see the hard layout rules below. */
@media (max-width: 820px) {
    .body { grid-template-columns: minmax(0, 1fr);
            grid-template-rows: minmax(0, 38vh) minmax(0, 1fr); }
    .sidebar { border-right: none; border-bottom: 1px solid var(--border-subtle); }
    .brand span { display: none; }   /* the subtitle is decoration; the width is not */
}
```

- **`min-height: 0` on every grid and flex child.** Without it a flex item refuses to shrink below its content, the column grows past the viewport, and `overflow-y` on `.content` never engages — the whole page scrolls instead of the list. This is the single most common layout bug in these apps.
- **One surface, borders divide.** Bar, list and content share `--bg-secondary`; only the 1px borders separate them. A darker well under the content reads as a separate pane, and the document is not a pane — it is the page.
- **`overflow: hidden` on `body`, `overflow-y: auto` on `.content`.** The page never scrolls; the column does.
- **The top bar holds all the chrome** — search, presence, address, theme, logout — so the content column stays pure and never resizes when something appears.

**The boot order is not arbitrary.** Everything hangs off `db`, so nothing can be wired before it exists, and the session callback must be able to fire the moment it is set:

```javascript
// 1. The database, with its constitution. Roles are declared here, once.
db = await gdb("room-name", {
    rtc: true,
    sm: { superAdmins: [SUPERADMIN.address], customRoles: { /* … */ }, acls: true }
})

// 2. Theme, before anything paints.
applyTheme(localStorage.theme ?? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"))

// 3. Every listener. Pure DOM wiring — no data, no session.
el.newDoc.addEventListener("click", createDocument)
// …

// 4. Presence, from the room.
db.room?.on("peer:join", updatePresence)
db.room?.on("peer:leave", updatePresence)
updatePresence()

// 5. The session callback LAST among the wiring — it fires immediately with the
//    current state, and it opens the door. Everything it touches must exist.
db.sm.setSecurityStateChangeCallback(onSecurityStateChange)

// 6. The data subscription, once, for the life of the page. Not inside the
//    session callback: read-only guests still see whatever peers replicated,
//    and re-subscribing is what freezes the other window (§7).
subscribeToItems()
```

The `<script type="module">` opens with a comment naming the methods the file demonstrates and where to find them. These files are read as documentation; the header is the table of contents.

### 5.2 Collection apps (CMS, marketplace, gallery)

```
┌─────────┬──────────────────────────────┐
│ brand   │                 [session pill]│
│ nav     │  H1                           │
│         │  ┌─────┐ ┌─────┐ ┌─────┐     │
│ widget: │  │card │ │card │ │card │     │
│ recent  │  └─────┘ └─────┘ └─────┘     │
└─────────┴──────────────────────────────┘
```

- Responsive card grid: `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`.
- Cards: `--bg-secondary`, `--border-subtle`, `--radius-md`, hover = `translateY(-2px)` + `--border-strong`. Image on top (`object-fit: cover`), title, two-line clamped description, footer row with author tag (mono) and owner-only actions.
- Secondary lists ("latest", "recent activity") are **sidebar widgets** — never a fixed bottom panel.

### 5.3 List + editor (documents, notes, records)

The organism behind the canonical full-profile app: a list on the left, one open item on the right, and neither ever resizes the other.

```
┌──────────────────────────────────────────┐
│ brand                  0x12…cd  ☀  ⏻     │
├───────────┬──────────────────────────────┤
│ search  ＋ │  Title      Preview Share Del│
│ ──────────│  ────────────────────────────│
│ ▍item     │                              │
│  item     │  the document, no border     │
│  item     │                              │
│           ├──────────────────────────────┤
│           │ READ owner 0x12…cd   3 peers │
└───────────┴──────────────────────────────┘
```

- **List items are title + a two-line excerpt**, separated by `--border-subtle`, with the open one marked by a left accent border and `--bg-tertiary`. No checkboxes, no per-item action buttons: the row opens the item, and the actions live where the item is open.
- **Autosave, no Save button.** A debounce of ~600ms after the last keystroke, with a one-word status (`saving…` / `saved`) next to the title. A Save button in a P2P app is a lie about how the data travels — the graph has already accepted the write and told the peers. Guard the render against clobbering what the user is typing: skip it while `document.activeElement` is the field being edited.
- **Secondary actions open a dialog, they don't expand the view.** Sharing, permissions, history — a panel that unfolds inside the content column shifts the text the user is reading. Three buttons in the header (`Preview` · `Share` · `Delete`) and everything else behind them.
- **The editor has no borders** — it *is* the content, not a form field (§6). The empty state that precedes it is an icon over one line, centred on the whole canvas: an empty editor should read as waiting for you, not as a page that failed to load.
- **The permission is stated, not implied**, in the status bar: a quiet tag (`READ` / `WRITE` / `DELETE`), the owner's abbreviated address and the timestamp. In a permissions app the user must be able to see why a field is disabled without clicking it — and reporting it below the text rather than above keeps it out of the way of the reading. Drop the address when the tag already reads `OWNER`: it is your own, and naming it says the same thing twice.

### 5.4 Admin panels & dashboards

Same skeleton; content organized as **stat cards first, tables second**. Tables use `--border-subtle` row separators (no zebra striping), mono for IDs/addresses, and row actions revealed on hover. Destructive actions are always `--danger` outline buttons, never filled by default.

### 5.5 Social / chat / realtime feeds

Single centered column (max-width ~680px) for the feed; composer pinned at the natural top or bottom of the column (not fixed over content). Presence ("N peers online") belongs in the top bar next to the session pill, in `--text-tertiary`.

### 5.6 Instruments & testbeds

Three shapes live here, and picking the wrong one is the most common mistake in this chapter. Ask what the reader *does* with the page:

| | **Reads it** | **Works at it** | **Watches it** |
| --- | --- | --- | --- |
| What it is | A lesson: explanation, one call, its result | A bench: you run something, look, adjust, run again | An instrument: it reports a process that changes on its own |
| Shape | **Centred column**, page scrolls | **Two panels**, input left / output right, each scrolling on its own | **Full-bleed**, page does not scroll |
| Width | The widest block that must be read intact: ~640px for prose, ~720px with code, ~440px for stat cards alone | ~380–440px for the input panel; the output takes the rest | The viewport |
| Examples | `todolist` · `paste` · `singleNode` | `edges-max_depth_demo` · `nlquery` · `sandbox` | `mesh-cells-monitor-d3` · `perf-stress-test` · `graph-p2p` |

**The bench is the default for anything that tests.** Its point is not extra space, it is **simultaneity**: the lesson of a testbed is *"this input produces this output"*, and a single column puts the two halves of that sentence a scroll apart — you run the query, scroll down to read the answer, scroll back up to change something, and never see both at once. Side by side, the comparison is free and a long result never pushes the controls out of reach.

Legibility is not the trade-off people expect, because **the panels stay narrow**: 420px of prose reads exactly as well inside a split as it does centred. What full-bleed costs, a bench does not.

```css
.bench {
    display: grid;
    grid-template-columns: minmax(0, 420px) minmax(0, 1fr);
    height: 100%;
}

/* Each panel scrolls itself; the page never does. */
.panel { min-width: 0; min-height: 0; overflow-y: auto; padding: var(--space-5); }
.input-panel { border-right: 1px solid var(--border-subtle); }

@media (max-width: 820px) {
    .bench { grid-template-columns: minmax(0, 1fr);
             grid-template-rows: minmax(0, 55%) minmax(0, 45%); }
    .input-panel { border-right: none; border-bottom: 1px solid var(--border-subtle); }
}
```

**The output panel is never blank.** Before the first run it says what will appear there — an icon and one line, centred — or the split reads as a page that failed to load rather than one waiting for you.

**Do not stretch a page you read.** Prose at 1900px stops being readable, and a five-line answer floating in that much space reads as an empty page rather than a result. The centred column is not a compromise for small screens — it is what a sequence of "explanation → call → result" asks for, and it is already responsive: `max-width` plus a scrolling page needs no breakpoint at all.

**Do not box an instrument.** A live graph or a moving metric belongs edge to edge, with the bands of §5.0 around it and the scrolling inside its panels. Boxing it wastes the space the data was going to occupy.

All three share the rest: an uppercase eyebrow label where one helps, a large title, a one-line hint, **stat cards in a row** with mono values, and proportional bars (grey track `--bg-tertiary`, solid `--accent` fill). These tools measure — every pixel should feel like an instrument, not a website.

### Hard layout rules (learned the hard way)

Each of these was a visible defect before it was a rule.

- **`minmax(0, 1fr)`, never bare `1fr`.** A `1fr` track floors at `min-content`, so one `white-space: nowrap` excerpt of 80 characters is wider than a phone: the column stretches to fit it and drags the document, its buttons and the status bar off the right edge. The text truncates correctly — it just has nothing to truncate against. Same disease as the missing `min-width: 0` on a flex child, and worth checking together.
- **`min-height: 0` and `min-width: 0` on every grid and flex child.** Without them a child refuses to shrink below its content, the column outgrows the viewport, and the `overflow` you set never engages. This is the single most common layout bug in these apps.
- **The content column owns the full viewport height.** `overflow: hidden` on `body`, `overflow-y: auto` on the content column. The page never scrolls; the column does. No global fixed footers.
- **Stacking is still one screen.** One breakpoint is enough — at `max-width: 820px` collapse to a single column — but do **not** let the layout fall to `height: auto` there. Handing scrolling back to the page pushes the status bar below the fold and leaves a band of page background under it, which reads as a broken app. Stack as grid rows inside the same full-height layout: `grid-template-rows: minmax(0, 38vh) minmax(0, 1fr)`, list scrolling in place, document taking the rest.
- **`100dvh` alongside `100vh`.** A phone's address bar is not part of the viewport, and the first thing it swallows is the status bar at the bottom.
- **Chrome bands share one height.** 48px for the top bar, the list head and the status bar alike. Three near-misses (70 / 48 / 43) read as carelessness; three identical values read as a system.
- **Align the mark, not the hit area.** An icon button pads itself — typically 6px — so an icon in a bar padded to 24px optically sits at 30 while the text on the other side sits at 24. Pull the row back by that padding (`margin-right: -6px`) so what lines up is what the eye can see.

---

## 6. Canonical Components

Minimal CSS contracts — copy and restyle only via tokens.

### Toast — the canonical implementation

**Never `alert()`.** It blocks the thread, so in a P2P app it freezes the very sync you are demonstrating, and it can be neither styled nor read politely by a screen reader. Every operation result — saved, deleted, permission denied, the errors thrown by `acls.*` and `executeWithPermission` — goes through the toast.

**Messages stack; they never replace each other.** This is the one place where a P2P app differs from an ordinary one: a peer connects, a document arrives, a role is signed — all asynchronously, none of it asking your permission. With a single slot, the event you did not trigger overwrites the confirmation you did, and the information is gone.

**Three at a time, rotating.** With a 3s life, three slots absorb one message per second sustained — far above the rate a person generates by saving, granting and deleting. Three is also as many as anyone reads at a glance before they start merely scanning, and on a phone it already occupies a third of the screen. The cap doubles as a design smell detector: **if an app routinely overflows it, the fix is not a bigger number** — those events belong in the presence counter or an activity panel, not in a transient notification. A genuine burst of twenty is no better served by five slots than by three; group them ("3 documents synced") or route them elsewhere.

Copy these three blocks verbatim. They are the whole component; there is nothing else to build.

```html
<div id="toasts" class="toast-stack" role="status" aria-live="polite" popover="manual"></div>
```

```css
/* The stack itself is the popover, so it joins the top layer once and paints
   above a modal <dialog>'s ::backdrop — which no z-index can beat. The
   inset/margin/padding/border resets undo the browser's popover defaults. */
.toast-stack {
    position: fixed;
    inset: auto;
    right: var(--space-5);
    bottom: var(--space-5);
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    overflow: visible;
}

.toast {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 280px;
    max-width: 360px;
    padding: 14px 18px;
    background: var(--bg-elevated);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-left: 3px solid var(--text-tertiary);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    animation: toast-in .3s ease;
    transition: opacity .4s, transform .4s;
}

/* Monochrome glyphs, not emoji: they inherit a token colour like every other
   mark in the interface, and echo the left border instead of introducing a
   palette of their own. */
.toast-icon { flex: 0 0 18px; text-align: center; font-size: 18px; line-height: 1; color: var(--text-tertiary); }
.toast-text { flex: 1; min-width: 0; }

.toast.success { border-left-color: var(--ok); }
.toast.error   { border-left-color: var(--danger); }
.toast.warning { border-left-color: var(--warn); }

.toast.success .toast-icon { color: var(--ok); }
.toast.error   .toast-icon { color: var(--danger); }
.toast.warning .toast-icon { color: var(--warn); }

/* The newest message sits at the bottom and reads at full strength; every
   older one steps back by the same amount to send the eye there. */
.toast:not(:last-child) { opacity: .6; }

.toast.out { opacity: 0; transform: translateX(20px); }

@keyframes toast-in {
    from { opacity: 0; transform: translateX(100%); }
    to   { opacity: 1; transform: translateX(0); }
}

@media (prefers-reduced-motion: reduce) {
    .toast { animation: none; }
    .toast.out { transform: none; }
}
```

```javascript
const MAX_TOASTS = 3
const TOAST_ICONS = { info: "ⓘ", success: "✓", error: "✕", warning: "!" }

const dropToast = (node) => {
    node.classList.add("out")
    setTimeout(() => {
        node.remove()
        if (!toastsEl.children.length && toastsEl.matches(":popover-open")) toastsEl.hidePopover()
    }, 400)
}

/** @param {string} message @param {'info'|'success'|'error'|'warning'} [kind='info'] */
const toast = (message, kind = "info") => {
    const node = document.createElement("div")
    node.className = `toast ${kind}`

    const icon = document.createElement("span")
    icon.className = "toast-icon"
    icon.textContent = TOAST_ICONS[kind] ?? TOAST_ICONS.info
    icon.setAttribute("aria-hidden", "true") // the text alone is the message

    const text = document.createElement("span")
    text.className = "toast-text"
    text.textContent = message

    node.append(icon, text)
    node.addEventListener("click", () => dropToast(node))
    // Show the stack first: a node appended while the container is still
    // display:none starts its animation frozen at translateX(100%).
    if (!toastsEl.matches(":popover-open")) toastsEl.showPopover()
    toastsEl.append(node)
    while (toastsEl.children.length > MAX_TOASTS) toastsEl.firstElementChild.remove()

    // Errors stay longer: the message you most need to read is the longest one.
    setTimeout(() => node.isConnected && dropToast(node), kind === "error" ? 5000 : 3000)
}
```

Why each decision, so nobody re-litigates them:

- **`popover` on the stack, not `z-index` on the toast.** A modal `<dialog>` lives in the top layer, and its `::backdrop` covers every element in the normal flow no matter how high you push `z-index`. Promoting the stack with `popover="manual"` puts it in the top layer too, *after* the dialog, so feedback about what just happened in a modal is actually readable. This is not theoretical: a toast saying *"Paste a mnemonic phrase first"* is triggered from inside the identity modal.
- **Bottom-right.** It clears the sidebar and the top-right session pill, the two places a GenosDB app puts chrome, and leaves the content column untouched while messages come and go.
- **Two durations, not one.** `Saved` is read at a glance; `🛡️ [SM-ACLs] Write denied for node b4dd25bd…` is not. A single timeout either rushes the message that matters or lingers on the one that doesn't.
- **Four kinds, one glance.** The 3px left bar carries the meaning — `--ok`, `--danger`, `--warn` — so severity is legible before the sentence is read. The icon is `aria-hidden`: the text alone is the message.
- **The stack has a focal point.** Every older message sits at `.6` while the newest stays at full strength, so the eye lands on what just happened instead of scanning three equals. One selector, no JavaScript, independent of the cap — and the existing `transition` animates the step-back as each new message arrives. Older messages fade *as a group*, all to the same value: grading them individually reads as a decay effect and pulls attention back up the stack, which is the opposite of the point. Keep it subtle; this is a reading hint, not a disabled state.
- **`role="status"` + `aria-live="polite"` on the container**, so every message appended to it is announced. Without them the app gives a screen reader no feedback at all, and `polite` (never `assertive`) waits for a pause instead of interrupting.
- **Click to dismiss**, one line and no markup — better than a `×` button that adds a node and a hit target to every message.
- **`prefers-reduced-motion`** drops the slide and keeps the message.

### Confirm — the other half of feedback

A toast reports what already happened; **`confirm()` is the same mistake as `alert()`, for the same reason.** It blocks the main thread for as long as the dialog is up: incoming peer messages queue, and `requestAnimationFrame` never runs — so the live interface a GenosDB demo exists to show freezes behind a browser chrome box that says `127.0.0.1:5503 says`. It also cannot be styled, themed or translated.

Ask with a `<dialog>` instead. `method="dialog"` puts each button's value into `returnValue`, so there is no click wiring and `Esc` already means *no*:

```html
<dialog id="confirm-modal">
  <h2 class="modal-title" id="confirm-title"></h2>
  <p class="modal-hint" id="confirm-text"></p>
  <form method="dialog" class="modal-actions">
    <button value="ok" id="confirm-ok" class="danger"></button>
    <button value="cancel" class="ghost">Cancel</button>
  </form>
</dialog>
```

```javascript
/** @returns {Promise<boolean>} whether the destructive action was accepted */
const confirmAction = ({ title, body, confirmLabel }) => new Promise((resolve) => {
    el.confirmTitle.textContent = title
    el.confirmText.textContent = body
    el.confirmOk.textContent = confirmLabel
    el.confirmModal.addEventListener(
        "close",
        () => resolve(el.confirmModal.returnValue === "ok"),
        { once: true }   // Esc and the backdrop both land here, as a "no"
    )
    el.confirmModal.showModal()
})

// At the call site it reads like the thing it replaces.
if (!await confirmAction({
    title: "Delete this document?",
    body: "It disappears for every peer, and there is no undo.",
    confirmLabel: "Delete"
})) return
```

Two rules for the wording: **the title asks, the body says what is lost**, and **the button names the act** (`Delete`, `Revoke`) rather than `OK` — a button labelled OK tells you nothing about what you are agreeing to. It carries `danger`; `Cancel` stays `ghost`, because the safe path should not compete.

**Modal:** native `<dialog>` + `::backdrop` dim with slight blur; `--bg-elevated`, `--radius-lg`; backdrop-click / `Esc` to dismiss — no close ×.

### Buttons — four weights, one vocabulary

Every button in a GenosDB app is one of four, and the weight says how much the app wants you to press it. Copy the four rules; do not invent a fifth.

```css
/* Secondary — the default. Quietly filled, bordered. */
button {
    font-family: inherit; font-size: 13px; font-weight: 500;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
    background: var(--bg-tertiary); color: var(--text-primary); cursor: pointer;
}
button:hover:not(:disabled) { border-color: var(--text-tertiary); }
button:disabled { opacity: .5; cursor: not-allowed; }

/* Primary — the one thing this screen is for. At most one per view. */
button.primary { background: var(--accent); border-color: var(--accent); color: var(--text-on-accent); }
button.primary:hover:not(:disabled) { background: var(--accent-hover); border-color: var(--accent-hover); }

/* Tertiary — no fill and no border until you reach for it. */
button.ghost { background: transparent; border-color: transparent; color: var(--text-secondary); }
button.ghost:hover:not(:disabled) { color: var(--text-primary); border-color: var(--border-strong); }

/* Destructive — outlined, never filled: the weight comes from the colour. */
button.danger { background: transparent; border-color: var(--border-strong); color: var(--danger); }
button.danger:hover:not(:disabled) { border-color: var(--danger); }
```

- **`danger` is outlined, not filled.** A red block reads as *the* action of the screen. Delete is available, not encouraged — the exception is the confirm dialog above, where destroying is the whole point of the button you just opened.
- **`ghost` has no border at rest.** It is for the escape hatch and the aside: a demo shortcut, a *cancel*. Give it a border and it becomes a second secondary button competing with the real one.
- In the identity door this maps exactly: `Generate` and `Login with mnemonic` are `primary`, `Login with passkey` is the default secondary, and the demo shortcut is `ghost`. If the demo button grows a border, it starts reading as a third way in.

**Forms:** labels above fields (small, `--text-secondary`, 600 weight); inputs on `--bg-secondary` with `--border-strong`, focus swaps border to `--accent`. Read-only fields (e.g. auto-generated slugs) drop to `--text-tertiary` on `--bg-primary`.

**The border carries focus, so the browser's ring has to go.** `outline: none` on inputs, textareas and selects, with `:focus { border-color: var(--accent) }` in its place. Leave the outline on and every field wears two focus indicators at once, one of them a colour no token controls and no theme can follow. Removing an outline is only acceptable *because* something visible replaces it in the same instant — never drop it without the border rule, or keyboard users lose their position entirely.

**Content fields are not form fields.** A field the user *asks something of* — a search box, an address to grant, a filter — is drawn: border, background, focus ring, because they must find it and know where to click. A field that **is the content** — the body of an editor, a document's title — is not drawn at all: no border, no background, transparent onto the page, sized like the text it holds. The reader is looking at their own writing, and a box around it only competes with it.

```css
/* The document IS the page: nothing frames it. */
.content-field {
    border: none;
    background: none;
    padding: 0;
    outline: none;
    color: var(--text-primary);
    font: inherit;
}
```

Two rules keep this honest: the field must still be obviously editable on hover or focus (a caret is enough for a body; a title can gain a faint `--bg-tertiary` on hover), and **a disabled content field must read as disabled** — drop it to `--text-secondary`, since without a border there is no frame to grey out. That last one matters in a permissions demo: a read-only document has to *look* read-only.

**Empty states:** one sentence in `--text-secondary` that tells the user how to earn the change they're looking at (e.g. *"No posts yet. Earn the author role and create one!"*) — in a governance world, empty states teach the ladder.

**Permission hints:** when a control is hidden by role, show a quiet `--warn`-tinted note explaining how to unlock it, instead of leaving users wondering.

---

## 7. Realtime UI Rules

1. **The DOM is the state.** Subscribe once with `db.map(options, callback)` and let deltas mutate the interface directly — no mirrored arrays or Maps for a single view. (An app-wide store fed by one subscription is legitimate when *many* views consume the same data.)
2. **Handle all four actions explicitly** — `initial`, `added`, `updated`, `removed` — each with its own branch. The canonical DOM gestures: `initial` → append (arrives already sorted when you pass `field`/`order`), `added` → prepend (newest by definition), `updated` → rebuild and move to top, `removed` → remove. The full event contract (`{ id, value, edges, timestamp, action }`) lives in the [MAP Guide](map-guide.md) — reference it, don't re-document it.
3. **Let the engine own the ordering and the window.** Pass `field` + `order` instead of sorting in the app; pass `$limit` and let the engine emit `added`/`removed` as nodes enter or leave the window. Cursors (`$after`/`$before`) are only meaningful over an explicit `field` order.
4. **Live-first verification:** after any data-loading change, test with two browsers — creation in one must appear in the other without reloads.

---

## 8. Accessibility & Semantics

- Semantic elements: `<dialog>`, `<nav>`, `<main>`, `<article>`, `<button>` (never clickable `<div>`s).
- Text contrast on `--bg-primary` meets WCAG AA with the token palette — don't lighten borders/text below the provided tertiary values.
- Every icon-only button carries `aria-label`.
- No inline styles; all styling flows from CSS classes and tokens.

---

## 9. Checklist (for AIs and humans)

Before shipping a GenosDB app or example, verify. The list is written for the **full profile**; a **minimal** example only owes 1, 2, 7, 9, 10 and 12 — and 5 as well if it logs anyone in:

1. ☐ All colors/spacing/radii come from the token block — zero hardcoded values in components.
2. ☐ Palette picked by what the page shows (§2) and applied by redefining token *values* only — never a component rule, never a second vocabulary. No runtime toggle unless the product truly requires it.
3. ☐ Identity uses the canonical door of §4.1 verbatim — single-textarea flow, **every button derived from the security state** (no local phase flags), passkeys gated on the RP ID; mandatory or dismissible per the table, never a × button, no standing Sign-in button, re-entry via contextual CTAs.
4. ☐ Session sits top-right in the `abbrAddr [role]` format (mono address, quiet tag, no filled pills); signed-out leaves that spot empty.
5. ☐ Examples use the canonical demo identities (§4.5) — `superAdmins` points at `SUPERADMIN.address`, never a placeholder, and each identity in the file has a one-click login button.
6. ☐ Role badges follow the gray → green → blue → orange → violet trust ramp.
7. ☐ Addresses abbreviated + monospace; timestamps localized; remote content sanitized.
8. ☐ Content column takes full height; secondary lists are sidebar widgets, not fixed panels.
9. ☐ Feedback via toasts, questions via `<dialog>` — **no `alert()` and no `confirm()`**, both block the thread and freeze the sync being demonstrated (§6).
10. ☐ Realtime: one subscription, four actions handled, ordering/window delegated to the engine.
11. ☐ Presence gated by degrees: watch anonymously · broadcast with an identity · contribute with an earned role (gated controls disabled, not hidden).
12. ☐ Verified live with two browsers.

---

## Where this guide fits

- Token values and component contracts here are the **reference implementation targets** for the official examples and testbeds.
- Method-level identity flows: [SM API Reference](sm-api-reference.md) · query/realtime contracts: [MAP Guide](map-guide.md) · pagination: [Cursor-Based Pagination](cursor-based-pagination.md).
