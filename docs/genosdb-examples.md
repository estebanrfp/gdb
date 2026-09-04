[![image](https://i.imgur.com/orglGSe.png)](https://i.imgur.com/orglGSe.png)
# GenosDB Examples and Community Projects

This page showcases various examples demonstrating GenosDB's capabilities, followed by more complex projects, applications, or tools that utilize GenosDB, created by us or the community.

These are simple, typically single-file demonstrations designed to illustrate core GenosDB functionalities. They are usually hosted directly from this repository's [examples](https://github.com/estebanrfp/gdb/tree/main/examples) directory.

---

## Examples

### [Basic To-Do List](https://estebanrfp.github.io/gdb/examples/todolist.html)
A simple real-time app to manage pending tasks. Ideal as a minimal example.

### [One Node, Live in Every Tab](https://estebanrfp.github.io/gdb/examples/singleNode.html)
The smallest thing GenosDB does, and the shape of everything else: `db.get(id, callback)` is a subscription rather than a fetch, so the callback fires again on every change to that node — from this tab, another tab, or a peer. The input never writes to the screen; it writes to the graph, and the screen is redrawn by the same path a remote change takes. Open it twice to watch it.

### [Two Live Queries Over One Graph](https://estebanrfp.github.io/gdb/examples/status-lists.html)
Two `db.map()` subscriptions watching different filters, side by side. A node belongs to whichever query it currently matches, so flipping one field makes the engine work both out for you — `removed` from one list, `added` to the other, in the same write. Press a button in one column and watch the row appear in the other: no routing code, because the queries **are** the routing.

### [Advanced To-Do List](https://estebanrfp.github.io/gdb/examples/advanced-todolist.html)
A complete task management app, featuring real-time syncing, task filtering (all/active/completed), inline editing, persistent storage, and a clean responsive UI. Ideal for showcasing reactive CRUD operations.

### [Real-Time Chat](https://estebanrfp.github.io/gdb/examples/chat.html)
A basic chat with real-time updates.

### [Real-Time Kanban](https://estebanrfp.github.io/gdb/examples/kanban.html)
A basic kanban with real-time updates.

### [Real-Time Paste](https://estebanrfp.github.io/gdb/examples/paste.html)
A textarea that syncs content in real-time with GenosDB.

### [P2P Collaborative Whiteboard](https://estebanrfp.github.io/gdb/examples/whiteboard.html)
Build complex real-time apps without a backend. This collaborative whiteboard runs entirely peer-to-peer, powered by the simplicity of GenosDB.

### [Real-time IoT Thermostat Control powered by GenosDB](https://estebanrfp.github.io/gdb/examples/thermostat.html)
A real-time peer-to-peer thermostat control demo showcasing GenosDB's reactive synchronization. Multiple users can adjust target temperature, toggle eco-mode (Leaf), and set away status — all changes instantly sync across connected browsers without any backend server. Demonstrates `db.put()`, reactive `db.get()` subscriptions, and P2P room events for peer counting.

### [Infinite Scroll](https://estebanrfp.github.io/gdb/examples/infinite-scroll.html)
Example of dynamic content loading while scrolling.

### [Pagination](https://estebanrfp.github.io/gdb/examples/pagination.html)
Blog Grid with Mixed Pagination and Persistence.

### [Custom Cursor](https://estebanrfp.github.io/gdb/examples/cursor.html)
Move your mouse cursor in realtime.

### [Tic Tac Toe Game](https://estebanrfp.github.io/gdb/examples/tictactoc.html)
A Tic Tac Toe game using GenosDB for real-time player synchronization.

### [Real-time location sharing](https://estebanrfp.github.io/gdb/examples/share-locations.html)
An interactive example that enables multiple users to share their live location on a map in real time, using Leaflet for visualization and GenosRTC as the P2P transport layer.
Each participant can start or stop location sharing, track their own path, and follow other connected users’ movements live.

### [Real-Time Audio Room](https://estebanrfp.github.io/gdb/examples/audio-streaming.html)
A real-time peer-to-peer audio streaming app using GenosDB’s room feature. Supports microphone broadcasting, automatic peer discovery, and live audio playback between multiple users in the same session. Includes real-time voice activity detection to visually indicate when a peer is speaking.

### [Real-Time Video Room](https://estebanrfp.github.io/gdb/examples/video-streaming.html)
A real-time peer-to-peer video streaming app using GenosDB’s room feature. Supports webcam broadcasting, automatic peer discovery, and live video playback between multiple users in the same session.

### [Real-Time File Streaming](https://estebanrfp.github.io/gdb/examples/file-streaming.html)
A real-time peer-to-peer File Streaming app using GenosDB’s room feature.

### [Motion Control — A Gesture Is the Interface](https://estebanrfp.github.io/gdb/examples/motion-control.html)
Move a 3D part with your phone's gyroscope or with your bare hand, and watch it move in every other browser. Nothing is persisted: the part exists only while a sensor is reporting it, so what travels over the ephemeral channel is the tracking state as much as the pose — a lost hand empties the stage everywhere, and finding it again fills it back. Close your fist and the part is yours, following your hand and copying its turn in every axis; open your hand and you leave it there. The camera is a sensor and never a backdrop: it is used for tracking and never shown. Demonstrates `db.room.channel()` for pose at 30 Hz, targeted sends to greet an arriving peer, and `peer:join` / `peer:leave` for presence.

### [Real-Time collaborative rich‑text editor powered by GenosDB](https://estebanrfp.github.io/gdb/examples/collab.html)
A real-time collaborative rich‑text editor powered by GenosDB: live typing sync, remote cursors/selections, RBAC + WebAuthn auth, Markdown/HTML split preview with draggable splitter, version history panel, file sharing, and video room.

### [Block Editor — Collaborative Text Without a CRDT](https://estebanrfp.github.io/gdb/examples/block-editor.html)
A continuous document — the Notion model — over the plain GenosDB API. One node per paragraph, so block-level LWW means edits on different paragraphs never collide; fractional order keys, so concurrent inserts into the same gap both survive, identically ordered everywhere; Enter splits a paragraph into two nodes, Backspace at its start merges them back. What Yjs calls *awareness* rides one ephemeral GenosRTC channel: named colour carets, live selections, and the paragraph being typed broadcast keystroke by keystroke — the character-by-character experience of a CRDT editor, while the debounced graph write remains the truth that persists and repairs. No server and no CRDT library; measured beside the public Yjs/Automerge demos, edits land with less latency and less work per keystroke.

### [Gaze Heat Map — Where a Page Actually Gets Read](https://estebanrfp.github.io/gdb/examples/gaze-heatmap.html)
Calibrate against nine dots and your eyes become a point on the page; read it, and where you looked accumulates into a heat map every other browser shares. The camera is a sensor and never a backdrop: no frame leaves the browser, and what travels is two numbers and the radius of their error — the privacy argument a hosted analytics tool cannot make. Each visit is one node rewritten whole by its own peer, so last-write-wins never has to resolve anything and the sum is done by whoever reads; written once every three seconds from the tracking loop rather than thirty times a second, because nothing ticks while nobody is being tracked. Every contribution is spread by the error that peer measured for itself, so badly calibrated eyes leave a vaguer mark. Wink to leave one: left eye, right eye or both, ringing on every screen at once. While a visit is being measured, nobody else's gaze is drawn over it — a dot moving in the periphery pulls the eye by reflex, and the map would be recording where the dots went. Demonstrates `db.put` and `db.map` for the shared map and `db.room.channel()` for the live layer, with the page under test inside the same file.

---

## Security

### [Passkeys — WebAuthn Identity](https://estebanrfp.github.io/gdb/examples/webauthn.html)
The identity lifecycle on its own, with nothing else on the page: generate a mnemonic, wrap it in a **passkey** (`protectCurrentIdentityWithWebAuthn`), log out, and get back in with the device alone (`loginCurrentUserWithWebAuthn`) — the phrase never typed a second time. Reports what the Security Manager says about the session as it changes, so the difference between *the phrase is the identity* and *the passkey only unlocks it here* is on screen rather than in a comment. Needs HTTPS or `localhost`: an IP address is never a valid Relying Party ID, and the page says so instead of failing.

### [How Permissions Travel — SM Testbed](https://estebanrfp.github.io/gdb/examples/sm-testbed.html)
A role in GenosDB is not a live permission check against a server — it is a **signed grant**, and signed data spreads like any other data. The guided scenario proves it: promote Bob **while Bob is offline and the superadmin's browser is closed**, and watch Alice relay the grant when Bob returns, verified against a signature from someone who was never there. Three public identities, one click each; the roster is a plain `db.map({ query: { role: { $exists: true } } })`, and your own role comes from `db.get('user:<address>')`, so both update on their own when a grant arrives. Run it in three separate browsers — tabs sync locally and would fake the result.

### [Chat RBAC — Roles Govern Verbs, Not Nodes](https://estebanrfp.github.io/gdb/examples/rbac-chat.html)
A role grants **verbs**, never ownership: `delete` means "this signer may remove nodes", full stop, so a moderator here can delete *any* message and the familiar "delete your own" affordance is not something RBAC can express — that is what the ACL layer is for (`acls.html`, `docs.html`). The room sits beside the ladder it obeys: five roles on a progress line, the verbs each one declares, and your own rung marked, all drawn from the same `customRoles` object that configures the database — so the rules on screen cannot drift from the rules in force. Sign in with one click as the demo superadmin and the moderation controls light up; generate an identity instead and you arrive as a `guest`, four rungs below, with the gated controls explaining themselves. The role is read reactively from `user:<address>`, so a promotion signed in another window climbs the line on its own.

### [Permission as Data — ACLs Testbed](https://estebanrfp.github.io/gdb/examples/acls.html)
Where `docs.html` shows sharing as a product — press Share, someone gains access, and what got written stays out of sight — this bench shows the ACL itself: pick a note and you get the table, one row per address, the level it holds, and the four writes that change it. Three mechanisms stack up, and all three have to open: a new identity is a `guest` and cannot write at all, the superadmin's engine promotes it to `user`, and a `user` still only touches the nodes it owns or was granted. Sign in as Bob and open a note Alice granted `read`: the field is inert — not because the page disabled it, but because the middleware on every peer would reject the write.

### [Collaborative Docs — Node-Level ACLs in a Real App](https://estebanrfp.github.io/gdb/examples/docs.html)
What the ACLs module looks like once it stops being a testbed and becomes an application. Every document is a node whose `owner` and `collaborators` decide who may read, edit or delete it — re-checked by every peer against the cryptographically verified signer, so a tampered client changes nothing. Open it in two windows **side by side**: create a document, grant another address `read`, `write` or `delete` with `db.sm.acls.grant`, and watch each window's controls reflect exactly what that address may do, gated but never hidden. Moderation is **granted, not inherited**: a new document hands the demo superadmin `delete` at creation — visible in the access panel and revocable by the owner — because a superadmin role carries no power over someone else's node. Also the reference implementation of the [Design Guide](https://github.com/estebanrfp/gdb/blob/main/docs/genosdb-design-guide.md): design tokens, identity `<dialog>`, one `db.map` subscription handling the four actions. Full guide: [SM ACLs Module](https://github.com/estebanrfp/gdb/blob/main/docs/sm-acls-module.md).

### [Governance — Role Promotion & Demotion](https://estebanrfp.github.io/gdb/examples/governance.html)
A live viewer of GenosDB's governance engine, which resolves each user's role by **last-match-wins**. Open it in two windows: one becomes the demo superadmin with a single button and runs the engine; the other logs in as Alice (or Bob) — a zero-trust guest promoted to `user` in ~5 seconds — then votes 👍 to climb a merit ladder (`user` → `manager` at 2 points → `admin` at 4 points) and 👎 to **auto-demote** (no explicit demotion rules — losing the condition simply lets a lower rule win). A live role roster and a signed role-transition log show every promotion and demotion. Full guide: [Governance](https://github.com/estebanrfp/gdb/blob/main/docs/governance.md).

### [Encrypted Notes — What Peers Actually Hold](https://estebanrfp.github.io/gdb/examples/sm-encrypted-notes.html)
**Encrypt the field, not the record.** A note is an ordinary node — `title` and `owner` in the clear, one `secret` field holding a string only its author's key opens — so every peer reads *that a note exists, what it is called and whose it is*, and nobody else reads what it says. Select one and the panel shows both readings: the body if it is yours to open, the ciphertext either way.

That choice is what keeps it **live**. Encrypting the whole record with `db.sm.put` would hide the title too and force reads through `db.sm.map`, which is not reactive; encrypting one field leaves the node ordinary, so a single reactive `db.map()` carries titles, owners and ciphertext to every peer as they change — edits appear in a second browser immediately, and the owner edits in place with autosave.

Ownership is **tested, not trusted**: `db.sm.decryptDataForCurrentUser` throws for anyone else, which is the honest check — the `owner` field is plain, and any peer with a write role could set it. Ships with the canonical identity door (mnemonic + WebAuthn passkeys).

---

## Tools & Testbeds

### [Query Builder — From a Form to a Query](https://estebanrfp.github.io/gdb/examples/query-builder.html)
The problem every app with a search box has to solve: a handful of optional controls, and one query assembled from whichever the reader actually filled in. The field above the results is rewritten on every keystroke, so what you watch is the **translation** — fill one age box and it reads `$gte`, fill both and the two collapse into a single `$between`. Controls that are contributing a clause are outlined, tying the form to the JSON without reading it. Runs against 50 real people from a public API, with `field` / `order` / `$limit` travelling in the same options object.

### [Query Operators — The Catalogue](https://estebanrfp.github.io/gdb/examples/query-operators.html)
Every operator the query language has, each one a preset you can run against a seeded graph of companies and employees: `$edge` traversals (including one nested inside another), `$eq` / `$gte` / `$between` / `$in` / `$exists`, `$and` / `$or` / `$not`, `$regex`. Picking a preset drops it into an editable field before it runs, so every example is also a starting point.

### [How Deep `$edge` Goes — Traversal Depth](https://estebanrfp.github.io/gdb/examples/traversal-depth.html)
Two chains of 50 linked nodes, and a single `db.map()` that walks one of them end to end: `$edge` takes the filter you would have applied at each hop and pushes it into the traversal, so depth costs one query instead of one round trip per level. The second chain is never a starting point and never appears in the result — which is the part worth watching.

### [The Graph, Drawn and Queried](https://estebanrfp.github.io/gdb/examples/graph.html)
Every other example hands you a graph someone else seeded; here you build it. Add a node, `Shift`+click a second one to link them — or unlink, if already linked — double-click to delete — on the canvas or in the list, they answer the same gestures. Then ask a question: the query runs and the matching nodes **light up on the drawing**, which is the only way `$edge` really lands — you watch it walk the links you just made. Nothing draws in response to a click: a click writes to the graph, the graph notifies, and the drawing follows, so a second window draws what you do in the first.

### [Geo Queries — The Shape of the Question](https://estebanrfp.github.io/gdb/examples/query-geo.html)
Geo queries drawn rather than listed: `$near` is a circle of N kilometres and a rectangle is two `$between` range checks, so both are rendered over the map as a dashed outline with the matching places inside them. Run the one that matches nothing and the circle is still drawn — you can see exactly where you were looking. The last preset puts a `$regex` beside the geo clause, because a geo operator is one clause among others.

### [Nearby — Where You Actually Are](https://estebanrfp.github.io/gdb/examples/geo-nearby.html)
The other half of the geo pair: the playground runs `$near` against coordinates you type, this one takes them from the device. `watchPosition` reports where you are, six nodes are seeded around you — so it works in Tokyo as readily as in Toledo — and the query is asked again every time you move. The radius is a slider, the assembled query is on the page rather than in the console, and each result carries its distance so you can see why it qualified. A denied permission is treated as an ordinary answer: it says so and offers a sample position.

### [To-Do List on Cellular Mesh](https://estebanrfp.github.io/gdb/examples/todolist-cell.html)
The same to-do app, with one option added: `rtc: { cells: { cellSize: 5 } }`. Beside it, the overlay reorganising itself in real time — peers landing in cells, bridges being elected and naming the cells they reach, and the count of connections this peer actually holds staying flat while the number of peers it knows keeps climbing. That gap is what cells buy you, and `db.put`, `db.map` and `db.remove` never change. Open it in six tabs to watch a second cell appear.

### [GenosDB - Mesh Cells Reach Probe](https://estebanrfp.github.io/gdb/examples/mesh-cells-reach-probe.html)
A minimal instrument for observing how peers partition into cells. Open it in several tabs — each is a peer; past 10 peers the mesh organizes into cells linked by elected bridges, and the panel reports how many peers land in each cell and who bridges them. Press **PING** to broadcast a `hello` that every peer answers with `world`, so **reach N/N** confirms the message still reaches every peer across the cells, with the coverage latency.

### [GenosDB - Mesh Network Monitor](https://estebanrfp.github.io/gdb/examples/mesh-cells-monitor.html)
**The reference monitor** for GenosDB networks: an interactive force-directed graph (D3.js) of the Cellular Mesh topology — cells, bridges, peers you can drag — with live network metrics, dynamic TTL, a per-cell peer roster, and Fallback Servers identified as violet `SRV` nodes. Uniquely, it also taps the sync protocol itself (`db.use`): every real database operation (PUT / DEL / LINK) is animated traveling across cells and bridges, so you watch GenosDB work — not just its chat channel. Messages and network events are logged side by side, so a burst of joins never buries the conversation.

### [Cellular Mesh Graph (D3)](https://estebanrfp.github.io/gdb/examples/graph-p2p.html)
The compact companion to the Mesh Network Monitor: a D3 force graph of the **real** peers in your room (`db.room`), coloured by cell, with bridge peers and cross-cell links styled from the engine's own cellular state. Open it in several tabs and watch the mesh partition as peers arrive. ~170 lines — the smallest complete reading of `rtc: { cells }`.

### [Benchmark — Throughput and the Sync Protocol](https://estebanrfp.github.io/gdb/examples/perf-stress-test.html)
A dedicated environment for benchmarking GenosDB under high-load scenarios: chunked mass insertions with honest metrics (**ops/s over pure write time**, fulfilled vs failed), realtime subscription counters, configurable `saveDelay` / `oplogSize` knobs, and a **Sync Protocol Observatory** that counts `sync` / `deltaSync` / `fullStateSync` messages live so you can watch the Hybrid Delta Protocol switch between delta and full-state catch-up across browsers.

### [Sync Observatory — What Each Encounter Costs](https://estebanrfp.github.io/gdb/examples/sync-observatory.html)
The Benchmark's minimal companion: a working to-do list with the sync layer's decisions counted live — **digest gate** (both sides held identical state, nothing was sent), **delta** (just the missing changes), **full state** (the whole graph). Converge two windows and reload one: every encounter gates green. Then press *Reset replica* — `db.clear()` is local by design, so connected peers sync the graph straight back while the counters narrate the catch-up; a row's 🗑️ (`db.remove`) is the opposite, a replicated write that wins everywhere, even performed offline. Point it at any room with `?db=<name>`.

### [Automated Tester — Write Pressure](https://estebanrfp.github.io/gdb/examples/todo-tester.html)
A load generator for the `todoList` graph: it inserts, updates and deletes at a chosen interval and reports every write as it happens. Open it beside `todolist.html` and the list fills, changes and empties on its own — replication with nobody typing. The page only writes and never subscribes; what watches the result is the other window.

---

## Awesome Projects & Showcases

A curated list of more complex or notable projects, applications, or tools built with or for GenosDB. Contributions are welcome!

---

### [To-Do-List](https://github.com/estebanrfp/To-Do-List)
Distributed To-Do List Application with GenosDB and Vanilla Javascript

_By: [Esteban Fuster Pozzi (estebanrfp)](https://github.com/estebanrfp)_

### [dChat](https://github.com/estebanrfp/dChat)
Distributed Chat Application with GenosDB and Vanilla Javascript.

_By: [Esteban Fuster Pozzi (estebanrfp)](https://github.com/estebanrfp)_

### [dGroup](https://github.com/estebanrfp/dGroup)
Distributed Group Chat Application with GenosDB and Vanilla JavaScript

_By: [Esteban Fuster Pozzi (estebanrfp)](https://github.com/estebanrfp)_

### [dKanban](https://github.com/estebanrfp/dKanban)
Distributed Real-time Kanban board that stores data in GenosDB.

_By: [Esteban Fuster Pozzi (estebanrfp)](https://github.com/estebanrfp)_

### [dCMS](https://github.com/estebanrfp/dCMS)
Distributed CMS Application with GenosDB and Vanilla JavaScript

_By: [Esteban Fuster Pozzi (estebanrfp)](https://github.com/estebanrfp)_

### [dVoting](https://github.com/estebanrfp/dVoting)
Distributed Voting Application with GenosDB and Vanilla Javascript

_By: [Esteban Fuster Pozzi (estebanrfp)](https://github.com/estebanrfp)_

### [dProp](https://github.com/estebanrfp/dProp)
Real-Time P2P Real Estate Proof of Concept powered by GenosDB

_By: [Esteban Fuster Pozzi (estebanrfp)](https://github.com/estebanrfp)_

### [dSocial](https://github.com/estebanrfp/dSocial)
A from-scratch decentralized social network and the most complete GenosDB showcase: communities, posts, polls, votes, karma + badges, zero-trust governance (signed role promotion), end-to-end encrypted chat with hybrid public/private rooms, 1:1 P2P file transfer, live typing/presence and field-level `$text` search — vanilla JavaScript, one dependency, no framework. **[▶ Live demo](https://dsocial-genosdb.netlify.app)**.

_By: [Esteban Fuster Pozzi (estebanrfp)](https://github.com/estebanrfp)_

### [Pixel-Painting](https://github.com/estebanrfp/Pixel-Painting)
Distributed Pixel Painting Application with GenosDB and Vanilla Javascript

_By: [Esteban Fuster Pozzi (estebanrfp)](https://github.com/estebanrfp)_

### [dMarket](https://github.com/estebanrfp/dMarket)
A GenosDB × blockchain showcase: a live Polygon (Amoy) NFT marketplace **mirrored into GenosDB** — the chain is the source of truth, while GenosDB is the reactive, offline-capable, P2P read layer (`db.map`). The Security Manager identity doubles as the on-chain wallet, so **one key signs both your P2P operations and your Polygon transactions** (no MetaMask). Faithfully extracted from OVGrid's marketplace — UI and all — as a ~1,600-line, no-build reference that points back to the full project below. Vanilla JavaScript.

_By: [Esteban Fuster Pozzi (estebanrfp)](https://github.com/estebanrfp)_

### [dCampaigns](https://estebanrfp.github.io/dCampaigns/) · [source](https://github.com/estebanrfp/dCampaigns)
A three-sided marketplace with no backend: an operator, clients who commission work, and creators who deliver it — **all three over one signed graph**. Roles are not rows in a table but **signed grants earned through governance**, so a newcomer declares a side and is promoted by rule, verified locally by every peer. Each client works in its **own room, isolated by transport** (the access code encrypts the signaling, so without it no replica is ever exchanged — something an ACL denying `read` cannot achieve). The core idea is in the approval model: a delivery stays the creator's node and is never rewritten by the reviewer, while the **verdict is a separate node owned by whoever decided it** — two claims by two people, each verifiable on its own. Stats are live client-side aggregations of signed operations, not a service. The Playwright suite runs **every peer in its own browser context** (separate OPFS, localStorage, IndexedDB) and includes the adversarial case: a rejected creator running a tampered client, signing an approval of their own work, refused by every honest peer. Vanilla JavaScript + Vite.

_By: [Esteban Fuster Pozzi (estebanrfp)](https://github.com/estebanrfp)_

### [OVGrid - Open Virtual Grid](https://ovgrid.com/)
WebXR Educational Virtual World - Real-time shared experiences. ~ By [estebanrfp](https://github.com/estebanrfp)
Project progress videos - [@ovgrid](https://odysee.com/@ovgrid:d)

### [Hōkō — Community BMTC Bus Tracking](https://github.com/soulsam480/hoko)
A community-driven, serverless bus tracking app for Bangalore (BMTC): riders inside a bus become live GPS "feeders" over **GenosRTC data channels** (one channel per route), while everyone else watches buses move on a Leaflet map — with a city-wide presence channel for feeder discovery across routes, 50 m haversine clustering of nearby buses, and smart session revive. Built with Preact + Signals and local SQLite (sqlocal/OPFS) for GTFS data; **GenosDB replaced the project's entire custom WebSocket backend (~1,000 lines) in a single evening**.

_By: [Sambit Sahoo (soulsam480)](https://github.com/soulsam480)_

### [NNOOTTEESS — P2P Synced Notes in Your New Tab](https://github.com/soulsam480/nnootteess)
A Chrome extension that turns every new tab into a notes workspace: write Markdown, keep code snippets, organise them into tabs and a sidebar, and find the same notes waiting in every browser you use. **There is no account and no server — a passphrase is the whole login**, and notes travel directly between your own devices.

_By: [Sambit Sahoo (soulsam480)](https://github.com/soulsam480)_

---

## Integrations

Plugins, bridges, and adapters that bring GenosDB into other platforms, engines, and frameworks. *(Different from GenosDB's own optional **modules** — SM, GEO, audit.)*

### [godot-genosdb — Serverless P2P multiplayer for Godot](https://github.com/estebanrfp/godot-genosdb)
A drop-in **Godot 4** plugin that adds real-time **P2P multiplayer** to Web exports via GenosDB — no backend. The API **mirrors GenosDB** (`join` / `send` / `put` / `map` / `remove`), so using it teaches the real GenosDB API. Ships with a cozy Stardew-style co-op farm demo (chop trees in a shared world, P2P chat). **[▶ Live demo](https://estebanrfp.github.io/godot-genosdb/)**.

_By: [Esteban Fuster Pozzi (estebanrfp)](https://github.com/estebanrfp)_

---

**Contributing to Awesome Projects:**
If you have a project using GenosDB that you'd like to showcase, please [open an issue](https://github.com/estebanrfp/gdb/issues) with the details, or submit a pull request to this page!
