# 🎨 GenosDB Design Guide

Opinionated UI patterns, design tokens and page architectures for applications built on GenosDB — written for **humans and AIs alike**. If you (or your AI assistant) are building a GenosDB application and want it to look and behave like a first-class citizen of the ecosystem, follow this guide.

The goal is coherence without complexity: every rule here is implementable in plain HTML + CSS + JavaScript, with no UI framework required.

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
| **Data and measurements** — monitors, probes, benches, charts | **dark** | The background disappears and the data carries the page. §5.5 |
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

1. **One icon button** in the top bar, next to the session pill, with an `aria-label`. The icon shows the mode you'll switch **to** (🌙 while in light, ☀️ while in dark).
2. Implementation: a `data-theme` attribute on `<html>`, a `[data-theme="light"]` block that **redefines tokens only**, `localStorage` persistence, and `prefers-color-scheme` as the first-visit default.

```javascript
const applyTheme = (t) => {
  document.documentElement.dataset.theme = t
  localStorage.theme = t
  themeBtn.textContent = t === 'dark' ? '☀️' : '🌙'
}
applyTheme(localStorage.theme ?? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'))
themeBtn.onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')
```

3. **The golden rule:** if enabling the toggle requires touching any component CSS, the token system is broken — fix the tokens, never patch components. A well-built toggle costs ~25 lines total and doubles as living proof that the design tokens work.

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
  <p class="modal-foot">Demo writes are open. Real apps earn access [<a href="governance.html">governance</a>].</p>
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

#### Three phases, one function

Button visibility is derived from the phase — never toggled one button at a time from scattered handlers.

| Phase | Visible | Hidden |
| --- | --- | --- |
| Signed out | `Generate new identity` · `Login with mnemonic` · `Login with passkey` *(only if a registration exists)* · demo shortcut | `Protect with passkey` · the warning · the copy icon |
| After generating | `Login with mnemonic` *(must remain — no dead ends)* · `Protect with passkey` · the warning · the copy icon | `Generate new identity` *(one identity at a time)* · demo shortcut *(never invite abandoning an unsaved phrase)* |
| Session active | — the modal closes itself; a logout resets to phase 1 and reopens it | |

```javascript
const setModalPhase = (phase) => {
    const generated = phase === "generated"
    show(el.generate, !generated)
    show(el.passkeyProtect, generated && PASSKEYS_AVAILABLE)
    show(el.passkeyLogin, !generated && PASSKEYS_AVAILABLE && db.sm.hasExistingWebAuthnRegistration())
    show(el.demoLogin, !generated)      // hidden while a fresh phrase is unsaved
    show(el.phraseWarning, generated)   // only a fresh phrase can still be lost
    el.mnemonic.readOnly = generated
}

const resetModal = () => {
    el.mnemonic.value = ""
    el.mnemonic.readOnly = false
    syncClipAffordance()
    autoGrow()
    setModalPhase("signed-out")
}
```

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
    const identity = await db.sm.startNewUserRegistration()
    if (!identity) return toast("Could not generate an identity", "error")
    el.mnemonic.value = identity.mnemonic
    syncClipAffordance(); autoGrow()
    setModalPhase("generated")
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
// The SM emits several inactive notifications while generating or logging in.
// Only a real active → inactive transition tears the session down: resetting
// on every notification would wipe the freshly generated phrase before the
// user has saved it.
let wasActive = null

const onSecurityStateChange = ({ isActive, activeAddress, abbrAddr }) => {
    currentUser = isActive ? activeAddress : null

    el.sessionAddr.textContent = isActive ? abbrAddr : ""
    show(el.logout, isActive)
    el.newDoc.disabled = !isActive

    // The data subscription is NOT touched here. It is subscribed once at boot
    // and lives for the whole page: the query is the same signed in or out, and
    // re-subscribing on every session change is what tears down a live
    // subscription and leaves the other window frozen (§7.1).
    if (isActive) {
        el.modal.close()
        resetModal()
    } else if (wasActive) {
        resetModal()
        el.modal.showModal()          // signed out *is* the modal's state
    } else if (wasActive === null && !el.modal.open) {
        el.modal.showModal()          // first load without a session
    }

    wasActive = isActive
}

db.sm.setSecurityStateChangeCallback(onSecurityStateChange)
```

Three traps live in those fifteen lines:

- **`wasActive` is not bookkeeping.** The SM reports `isActive: false` several times while an identity is being generated. Reacting to the notification instead of to the *transition* clears the textarea between generating a phrase and reading it — the phrase is gone, and it was the only copy.
- **The starting value is `null`, not `false`.** First load and logout are different events: only the second closes an open document and resets state.
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
- The foot carries the trust model in one line, with the link where the reader reaches for it. Examples add the one-click demo shortcut of §4.5; production apps ship no mnemonic in their source.

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

All layouts share the same skeleton: **one full-width top bar (brand + identity) · a list column · full-height content**. What changes is the content organism.

### 5.0 The skeleton, and the order it boots in

Two things every full-profile app gets right or spends a day debugging: where the chrome lives, and what runs when.

**The layout is a two-row grid over a two-column grid.** One bar holds every piece of chrome so nothing competes for the corner; below it, the list and the content sit side by side and neither ever resizes the other.

```html
<div class="layout">
  <header class="topbar">
    <h1 class="brand">App name <span>· what it demonstrates</span></h1>
    <div class="session">
      <input id="search-input" class="search" type="text" placeholder="Search…" aria-label="Search">
      <span id="presence" class="presence">0 peers</span>
      <button id="session-addr" class="session-addr" title="Copy your full address"></button>
      <button id="theme-btn" class="icon-btn" title="Switch theme" aria-label="Switch theme">…</button>
      <button id="logout-btn" class="ghost hidden">Logout</button>
    </div>
  </header>

  <div class="body">
    <nav class="sidebar">
      <button id="new-btn" class="primary" disabled title="Sign in to create">New document</button>
      <ul id="item-list" class="doc-list"></ul>
      <p id="list-empty" class="list-empty hidden">Nothing matches that search.</p>
    </nav>

    <div class="main">
      <main class="content">
        <div id="empty-view" class="empty">…</div>
        <article id="editor-view" class="editor hidden">…</article>
      </main>
    </div>
  </div>
</div>
```

```css
body   { height: 100vh; overflow: hidden; background: var(--bg-primary); }
.layout  { display: grid; grid-template-rows: auto 1fr; height: 100vh; }
.topbar  { display: flex; align-items: center; justify-content: space-between;
           gap: var(--space-4); padding: var(--space-3) var(--space-5);
           background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); }
.body    { display: grid; grid-template-columns: var(--sidebar-width) 1fr; min-height: 0; }
.sidebar { display: flex; flex-direction: column; min-height: 0;
           background: var(--bg-secondary); border-right: 1px solid var(--border-subtle); }
.main    { display: flex; flex-direction: column; min-width: 0; min-height: 0;
           background: var(--bg-secondary); }
.content { flex: 1; min-height: 0; display: flex; flex-direction: column;
           overflow-y: auto; padding: var(--space-5); }
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

### 5.1 Collection apps (CMS, marketplace, gallery)

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

### 5.2 List + editor (documents, notes, records)

The organism behind the canonical full-profile app: a list on the left, one open item on the right, and neither ever resizes the other.

```
┌──────────────────────────────────────────┐
│ brand           search · peers · session │
├───────────┬──────────────────────────────┤
│ [New]     │  Title            READ owner │
│ ─────────╴│  ────────────────────────────│
│ ▍item     │                              │
│  item     │  the document, no border      │
│  item     │                              │
└───────────┴──────────────────────────────┘
```

- **List items are title + a two-line excerpt**, separated by `--border-subtle`, with the open one marked by a left accent border and `--bg-tertiary`. No checkboxes, no per-item action buttons: the row opens the item, and the actions live where the item is open.
- **Autosave, no Save button.** A debounce of ~600ms after the last keystroke, with a one-word status (`saving…` / `saved`) next to the title. A Save button in a P2P app is a lie about how the data travels — the graph has already accepted the write and told the peers. Guard the render against clobbering what the user is typing: skip it while `document.activeElement` is the field being edited.
- **Secondary actions open a dialog, they don't expand the view.** Sharing, permissions, history — a panel that unfolds inside the content column shifts the text the user is reading. Three buttons in the header (`Preview` · `Share` · `Delete`) and everything else behind them.
- **The editor has no borders** — it *is* the content, not a form field (§6). The empty state that precedes it is an icon over one line, centred on the whole canvas: an empty editor should read as waiting for you, not as a page that failed to load.
- **The permission is stated, not implied**: a quiet tag by the title (`READ` / `WRITE` / `DELETE`) plus the owner's abbreviated address. In a permissions app, the user must be able to see why the field is disabled without clicking it.

### 5.3 Admin panels & dashboards

Same skeleton; content organized as **stat cards first, tables second**. Tables use `--border-subtle` row separators (no zebra striping), mono for IDs/addresses, and row actions revealed on hover. Destructive actions are always `--danger` outline buttons, never filled by default.

### 5.4 Social / chat / realtime feeds

Single centered column (max-width ~680px) for the feed; composer pinned at the natural top or bottom of the column (not fixed over content). Presence ("N peers online") belongs in the top bar next to the session pill, in `--text-tertiary`.

### 5.5 Instruments & testbeds (monitors, probes, benches)

Centered narrow column (~440px), no sidebar. An uppercase eyebrow label, a large title, a one-line hint, then **stat cards in a row** (mono values) and proportional bars (grey track `--bg-tertiary`, solid `--accent` fill). These tools measure — every pixel should feel like an instrument, not a website.

### Hard layout rules (learned the hard way)

- The content column owns the full viewport height. No global fixed footers.
- One responsive breakpoint is enough for examples: at `max-width: 820px` collapse to a single column (sidebar becomes a top block).
- `overflow-y` lives on the content column, not on `body`.

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

.toast-icon { font-size: 18px; line-height: 1; }
.toast-text { flex: 1; min-width: 0; }

.toast.success { border-left-color: var(--ok); }
.toast.error   { border-left-color: var(--danger); }
.toast.warning { border-left-color: var(--warn); }

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
const TOAST_ICONS = { info: "ℹ️", success: "✓", error: "⚠️", warning: "⚠️" }

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

**Modal:** native `<dialog>` + `::backdrop` dim with slight blur; `--bg-elevated`, `--radius-lg`; backdrop-click / `Esc` to dismiss — no close ×.

**Forms:** labels above fields (small, `--text-secondary`, 600 weight); inputs on `--bg-secondary` with `--border-strong`, focus swaps border to `--accent` (no outlines, no glows). Read-only fields (e.g. auto-generated slugs) drop to `--text-tertiary` on `--bg-primary`.

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
3. ☐ Identity uses the canonical door of §4.1 verbatim — single-textarea flow, three phases, the `wasActive` guard in the session callback, passkeys gated on the RP ID; mandatory or dismissible per the table, never a × button, no standing Sign-in button, re-entry via contextual CTAs.
4. ☐ Session sits top-right in the `abbrAddr [role]` format (mono address, quiet tag, no filled pills); signed-out leaves that spot empty.
5. ☐ Examples use the canonical demo identities (§4.5) — `superAdmins` points at `SUPERADMIN.address`, never a placeholder, and each identity in the file has a one-click login button.
6. ☐ Role badges follow the gray → green → blue → orange → violet trust ramp.
7. ☐ Addresses abbreviated + monospace; timestamps localized; remote content sanitized.
8. ☐ Content column takes full height; secondary lists are sidebar widgets, not fixed panels.
9. ☐ Feedback via toasts — no `alert()`/`confirm()` except destructive-action confirms.
10. ☐ Realtime: one subscription, four actions handled, ordering/window delegated to the engine.
11. ☐ Presence gated by degrees: watch anonymously · broadcast with an identity · contribute with an earned role (gated controls disabled, not hidden).
12. ☐ Verified live with two browsers.

---

## Where this guide fits

- Token values and component contracts here are the **reference implementation targets** for the official examples and testbeds.
- Method-level identity flows: [SM API Reference](sm-api-reference.md) · query/realtime contracts: [MAP Guide](map-guide.md) · pagination: [Cursor-Based Pagination](cursor-based-pagination.md).
