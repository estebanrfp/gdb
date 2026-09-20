# Patterns — modeling, realtime UI, lists, presence, app shapes, bundling

The reference for anything visual is [docs/genosdb-design-guide.md](https://github.com/estebanrfp/gdb/blob/main/docs/genosdb-design-guide.md): tokens, the identity door (§4.1), session and role badges (§4.2–4.3), gating by degrees (§4.4), demo identities (§4.5), page architecture by application type (§5), the canonical toast, confirm and buttons (§6), the realtime rules (§7), the checklist (§9). When the guide and a reference example disagree, **the example is right**.

## Modeling

- **One node per independently edited unit** — a paragraph, a card, a row, a message. Concurrent edits then land on different nodes. Two edits to one node at once also survive (the loser's rescue merges field by field, region by region in strings), but a value that changes as a whole — a ciphertext, a hash, a blob — is never spliced: the winner's stands.
- **Order with a fractional key**, never with array position: a `rank` (or `order`) string or number between neighbours; inserting between `a` and `b` is a key between the two, moving is one `put`. See [docs/ordered-lists.md](https://github.com/estebanrfp/gdb/blob/main/docs/ordered-lists.md).
- **Trees are links parent → child**, read with `$edge`; reparenting is `unlink(oldParent, id)` + `link(newParent, id)`. A removed node leaves its sources' edge sets alone; `unlink` is how to drop one for good.
- **Choose ids when identity matters** (a fixed `settings` node, `user:<address>`, a seed); let the engine generate them otherwise. Give shared nodes an `owner` so the id is `${owner}:…` and only that identity and its collaborators may change it.
- **Metrics that drive governance live on the `user:<address>` node** — spread when writing it; only the identity itself or a superadmin may write it, and a self-written metric is self-service promotion (see SECURITY.md).

## Realtime UI (design guide §7)

- **One subscription per view, for the life of the page.** A subscription created inside the session callback replaces the live one and the other window freezes.
- Handle the four actions explicitly; let the engine sort and window. The DOM is the state — never keep a parallel array you re-render from.
- **Autosave** (~600 ms debounce) with a quiet status word; no Save button.
- **Never repaint the field being typed in right now**: guard with `el === document.activeElement && document.hasFocus()` — `activeElement` alone freezes a window that lost the system focus.
- Never `alert()` / `confirm()` / `prompt()`. Toast for results, `<dialog method="dialog">` for questions.
- Call `unsubscribe()` when a view is torn down (a route change, a closed panel); a subscription that outlives its DOM is a leak and a phantom repaint.
- Show the live role by watching `user:<address>` reactively; derive every session branch from `setSecurityStateChangeCallback`.
- Render every peer-written value as text.
- Verify every data-path change with two real browsers or the Playwright setup in TESTING.md — an embedded preview pane hides animation frames, so nothing reactive arrives there.

## Pagination and windows

- Cursor pagination is `$limit` with `$after` / `$before` set to a node **id** from the previous page, always with an explicit `field` so the cursor is deterministic across peers ([docs/cursor-based-pagination.md](https://github.com/estebanrfp/gdb/blob/main/docs/cursor-based-pagination.md)). With realtime on, a node entering or leaving the window emits `added` / `removed`.
- Infinite scroll: load on scroll with `$after`; `map` without a callback is a one-shot read. A page that reads on load (no callback) re-reads only on reload or the next page — say so in the UI.

## Presence, cursors, awareness

- **One channel for the whole app**, multiplexed by `{ kind, … }`: many channels degrade the engine's own sync channel. Coalesce high-frequency sends to one per animation frame.
- Presence comes from `peer:seen` / `peer:lost` (relay announces, `seen` as heartbeat), deduplicated; connections are `peer:join` / `peer:leave`.
- A channel message proves nothing by itself. To show *who* is typing or pointing, send `await db.sm.sign({ kind: "caret", … })` and `verify` it on arrival; drop what does not verify. Never gate an action on a channel message — gate on the graph and the role.
- Gate by degrees (guide §4.4): watching needs nothing · broadcasting a camera needs a signed-in identity · contributing needs a `write` role · moderating needs an elevated tier. Disable gated controls with a `title`; do not hide them.

## Application shapes and their reference examples

Every example is a single self-contained HTML file importing the engine, dark by default, tokens only, no inline styles, no UI framework, peer content sanitized, and opens its `<script type="module">` with a comment naming the methods it demonstrates. Catalogue: [docs/genosdb-examples.md](https://github.com/estebanrfp/gdb/blob/main/docs/genosdb-examples.md).

| you are building | start from |
|---|---|
| an application with identity, roles and ACLs | `docs.html` — identity door, chrome in bands, toast, confirm, one subscription |
| a list or a board | `todolist.html`, `advanced-todolist.html`, `kanban.html`, `status-lists.html` |
| a collaborative editor | `block-editor.html` (one node per paragraph, fractional order, awareness on one channel), `collab.html` (rich text with RBAC and passkeys), `keystrokes.html` |
| a document with sections or a tree | `outliner.html`, `traversal-depth.html` (`$edge`) |
| a feed or a catalogue | `pagination.html` (the `$after` / `$before` / `$limit` reference), `infinite-scroll.html` |
| a chat or a realtime feed | `chat.html`, `rbac-chat.html` |
| presence, cursors, shared pointers | `cursor.html`, `share-locations.html`, `gaze-heatmap.html` |
| media | `audio-streaming.html`, `video-streaming.html`, `file-streaming.html`, `obs-overlay.html` |
| a spreadsheet or shared numbers | `spreadsheet.html`, `split-expenses.html` |
| encrypted data | `sm-encrypted-notes.html` (a sealed field, open base role), `acls.html`, `docs.html` |
| governance | `governance.html` |
| an instrument, bench or testbed | `todo-tester.html`, `sync-observatory.html`, `query-operators.html` (the operator catalogue), `query-geo.html`, `mesh-cells-monitor.html` |

## Layout rules learned the hard way (design guide §5)

Each was a visible defect before it became a rule. `minmax(0, 1fr)`, never bare `1fr` (a `1fr` track floors at `min-content`, so one unwrapped line is wider than a phone). `min-height: 0` and `min-width: 0` on every grid and flex child, or a child refuses to shrink and the column outgrows the viewport. The content column owns the viewport height: `overflow: hidden` on `body`, `overflow-y: auto` on the column — the page never scrolls, the column does. One breakpoint (`max-width: 820px`) collapses to a single column, still one screen high. `100dvh` alongside `100vh` for phone address bars. Chrome bands share one height (48px for top bar, list head and status bar alike). A component rule states only what differs from the base it sits on, and element selectors are scoped to their region. To centre a short page, `place-items: center`, not `place-content`.

## Before shipping (design guide §9)

Tokens only, zero hard-coded colours, spacing or radii · palette chosen by what the page shows, applied by redefining token values · the identity door of §4.1 verbatim, every button derived from the security state · session top-right as `abbrAddr [role]` · the canonical demo identities (§4.5), `superAdmins` never a placeholder · role badges on the gray → green → blue → orange → violet trust ramp · addresses abbreviated and monospace, timestamps localized, remote content sanitized · the content column full height, secondary lists as sidebar widgets · toasts and `<dialog>`, never `alert()` / `confirm()` · one subscription, four actions handled, ordering and windowing delegated to the engine · presence gated by degrees, gated controls disabled not hidden · **verified live with two browsers**.

## Bundling

`import { gdb } from "genosdb"` bundles the core; the engine loads its optional modules (`sm.min.js`, `sm-acls.min.js`, `sm-gov.min.js`, `genosrtc.min.js`) **relative to itself**, so `dist/` must stay intact next to the output. Zero runtime dependencies; uses top-level `await`. Vite: `optimizeDeps.exclude: ["genosdb"]` and `build.target: "es2022"`; Bun: copy the assets after `Bun.build`; details in [docs/bundler-configuration.md](https://github.com/estebanrfp/gdb/blob/main/docs/bundler-configuration.md). From a CDN, import `https://cdn.jsdelivr.net/npm/genosdb@<version>/dist/index.min.js` and pin the version in production.
