# 🎨 GenosDB Design Guide

Opinionated UI patterns, design tokens and page architectures for applications built on GenosDB — written for **humans and AIs alike**. If you (or your AI assistant) are building a GenosDB application and want it to look and behave like a first-class citizen of the ecosystem, follow this guide.

The goal is coherence without complexity: every rule here is implementable in plain HTML + CSS + JavaScript, with no UI framework required.

### Two deployment shapes, one design language

GenosDB applications ship in two shapes, and this guide applies equally to both:

- **No-build (examples, testbeds, prototypes):** three files — `index.html`, `styles.css`, `app.js` — importing GenosDB from a CDN. Zero tooling.
- **Bundled (production apps):** installed from npm and bundled into the app. **Bun is the recommended bundler and runtime** — `bun build` inlines GenosDB's core, and the engine's optional `*.min.js` plugins are copied next to the output bundle. See [Bundler Configuration](bundler-configuration.md) for Bun, Vite, Webpack and esbuild setups.

The design language is identical in both — tokens and patterns don't care how the bytes arrived.

---

## 1. Philosophy

1. **Content is the protagonist.** Chrome (navigation, session, widgets) stays visually quiet; data takes the full viewport height. Never let a fixed panel steal reading space.
2. **Dark, minimal, precise.** One dark theme, generous whitespace, subtle borders instead of shadows, restrained color reserved for meaning (roles, status, actions).
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

### Color mode: dark only

GenosDB applications ship **dark-only by default**. A light mode or a sun/moon toggle doubles the CSS surface, adds persistent state, and dilutes visual identity — complexity the ecosystem does not want in examples, testbeds or reference apps. If a production application truly needs a light theme, implement it by swapping the token values under a `[data-theme="light"]` selector; the component CSS must not change.

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
4. Optional demo/superadmin shortcut for showcases.

Wiring rules:

```javascript
openBtn.onclick = () => modal.showModal()
closeBtn.onclick = () => modal.close()
// Backdrop click closes (the dialog itself is the event target then)
modal.onclick = (e) => { if (e.target === modal) modal.close() }
```

…and the security state callback closes it on login — the user never dismisses it manually after authenticating.

### 4.2 Session: always top-right

An authenticated session renders as a **pill anchored to the top-right** of the content area (the universal convention users scan for):

```
[ 0x1234...abcd  ROLE  Logout ]
```

- Signed out → the same spot shows a single `Sign in / Register` button that opens the modal.
- The top bar is `position: sticky` over the content scroll, with a subtle bottom border.
- `db.sm.setSecurityStateChangeCallback(...)` is the **single source of truth**: it toggles the pill/button, closes the modal, and resets the mnemonic textarea on logout. No UI state duplicates it.

### 4.3 Role badges

The live role (watched reactively on the `user:<address>` node) renders as an uppercase pill. Map **ascending trust tiers** to a fixed color ramp so every GenosDB app reads the same way:

| Tier | Token | Meaning |
| --- | --- | --- |
| Base / guest | `--text-tertiary` (gray) | Read-only newcomer |
| First earned tier | `--ok` (green) | Can write |
| Mid tier | `--accent` (blue) | Extra capability (e.g. publish) |
| Elevated tier | `--warn` (orange) | Moderation powers |
| Superadmin | `--violet` | Root of trust — signs promotions |

Permission-gated controls (a "New post" button, a publish selector) show or hide from the same watched role — the UI *reflects* permissions, while the engine *enforces* them.

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

**Toast (never `alert()`):** fixed bottom-center pill, `--bg-elevated` + `--border-strong`, slides up on `.show`, `--danger` border for errors, auto-dismiss ~3s. All operation feedback (saved, deleted, permission denied) goes through it: security errors from `executeWithPermission` read cleanly in a toast.

**Modal:** native `<dialog>` + `::backdrop` dim with slight blur; `--bg-elevated`, `--radius-lg`, close ×, backdrop-click to dismiss.

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

Before shipping a GenosDB app or example, verify:

1. ☐ All colors/spacing/radii come from the token block — zero hardcoded values in components.
2. ☐ Dark theme only; no toggle unless the product truly requires it.
3. ☐ Login/registration lives in a centered `<dialog>` with the single-textarea mnemonic flow.
4. ☐ Session pill (abbrAddr + role badge + logout) sits top-right; signed-out shows one Sign-in button there.
5. ☐ Role badges follow the gray → green → blue → orange → violet trust ramp.
6. ☐ Addresses abbreviated + monospace; timestamps localized; remote content sanitized.
7. ☐ Content column takes full height; secondary lists are sidebar widgets, not fixed panels.
8. ☐ Feedback via toasts — no `alert()`/`confirm()` except destructive-action confirms.
9. ☐ Realtime: one subscription, four actions handled, ordering/window delegated to the engine.
10. ☐ Verified live with two browsers.

---

## Where this guide fits

- Token values and component contracts here are the **reference implementation targets** for the official examples and testbeds.
- Method-level identity flows: [SM API Reference](sm-api-reference.md) · query/realtime contracts: [MAP Guide](map-guide.md) · pagination: [Cursor-Based Pagination](cursor-based-pagination.md).
