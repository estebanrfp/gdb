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
| Examples | `todolist` · `singleNode` · `geo` · `paste` | `docs` · `acls` · `governance` · `collab` · `notesdev` |
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
| **Data and measurements** — monitors, probes, benches, charts | **dark** | The background disappears and the data carries the page. §5.4 |
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

### 4.1 Login & registration: a centered modal

Identity actions live in a **centered modal** (native `<dialog>`), not in a sidebar panel or a separate page. Rationale: the mnemonic flow is short, focused and security-critical — a modal isolates it, keeps the app visible behind a dimmed backdrop, and disappears the instant the session activates.

The modal contains, in order:

1. A one-paragraph hint explaining the trust model (e.g. what a guest can do, how roles are earned).
2. **One `<textarea>`** serving both purposes: paste an existing mnemonic, or display a freshly generated one (set `readOnly` after generating; `resize: none`).
3. Action row: `Generate identity` · `Copy phrase` · `Login with mnemonic` · `Protect with passkey` (after generating) · `Login with passkey` (only if `db.sm.hasExistingWebAuthnRegistration()`).
4. A demo/superadmin one-click shortcut, in examples and testbeds only (§4.5).

Wiring rules:

```javascript
// Backdrop click closes (the dialog itself is the event target then);
// Esc is native to <dialog>. No × close button in the corner: the modal
// is a door, not a window — a corner × reads as app-window chrome and,
// in the backup phase, invites closing before the phrase is saved.
modal.onclick = (e) => { if (e.target === modal) modal.close() }
```

…and the security state callback closes it on login — the user never dismisses it manually after authenticating.

**The modal is a three-phase state machine** (button visibility per phase):

| Phase | Visible | Hidden |
| --- | --- | --- |
| Signed out (fresh) | `Generate identity` · `Login with mnemonic` · `Login with passkey` *(only if a WebAuthn registration exists)* | `Copy phrase` · `Protect with passkey` |
| After generating | `Copy phrase` · `Protect with passkey` *(labelled Recommended)* · `Login with mnemonic` *(must remain — no dead ends)* | `Generate identity` *(one identity at a time)* |
| Session active | — modal auto-closes; on logout the textarea resets to editable and phase 1 returns | |

**No standing "Sign in" button — the modal IS the door.** A distributed app has no server-side login page, so don't emulate one with a persistent button. Open the identity modal automatically on **every load without an active session**: the newcomer immediately learns what an identity is and how roles are earned, and returning passkey users never see it — their session resumes silently and the security callback closes it.

```javascript
// Boot: signed-out state = the identity dialog (dismissible)
if (!db.sm.isSecurityActive()) identityModal.showModal()
```

- **Dismissible** (backdrop click, `Esc`) but with **no × close button** — the app stays fully usable as a read-only guest behind it.
- **Logging out returns to phase 1 with the modal open** — signed-out *is* the modal's state.
- **Re-entry without reloading is contextual**, not chrome: a clickable read-only status hint, or the explanatory affordance of a gated control, re-opens the modal. The top-right area belongs to the session chip alone and stays empty while signed out.

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

All layouts share the same skeleton: **sidebar (brand + nav + widgets) · sticky top bar (identity) · full-height content**. What changes is the content organism.

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

### 5.2 Admin panels & dashboards

Same skeleton; content organized as **stat cards first, tables second**. Tables use `--border-subtle` row separators (no zebra striping), mono for IDs/addresses, and row actions revealed on hover. Destructive actions are always `--danger` outline buttons, never filled by default.

### 5.3 Social / chat / realtime feeds

Single centered column (max-width ~680px) for the feed; composer pinned at the natural top or bottom of the column (not fixed over content). Presence ("N peers online") belongs in the top bar next to the session pill, in `--text-tertiary`.

### 5.4 Instruments & testbeds (monitors, probes, benches)

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
    toastsEl.append(node)

    while (toastsEl.children.length > MAX_TOASTS) toastsEl.firstElementChild.remove()
    if (!toastsEl.matches(":popover-open")) toastsEl.showPopover()

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
3. ☐ Login/registration lives in a centered `<dialog>` with the single-textarea mnemonic flow; it auto-opens on every session-less load (dismissible via backdrop/`Esc` — no × button) — no standing Sign-in button, re-entry via contextual CTAs.
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
