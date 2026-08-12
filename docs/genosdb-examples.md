[![image](https://i.imgur.com/orglGSe.png)](https://i.imgur.com/orglGSe.png)
# GenosDB Examples and Community Projects

This page showcases various examples demonstrating GenosDB's capabilities. It's divided into:
1.  **Basic Examples:** Simple, self-contained examples illustrating specific features.
2.  **Awesome Projects & Showcases:** More complex projects, applications, or tools that utilize GenosDB, created by us or the community.

---

## Basic Examples

These are simple, typically single-file demonstrations designed to illustrate core GenosDB functionalities. They are usually hosted directly from this repository's [examples](https://github.com/estebanrfp/gdb/tree/main/examples) directory.

### [Basic To-Do List](https://estebanrfp.github.io/gdb/examples/todolist.html)
A simple real-time app to manage pending tasks. Ideal as a minimal example.

### [Advanced To-Do List](https://estebanrfp.github.io/gdb/examples/advanced-todolist.html)
A complete task management app, featuring real-time syncing, task filtering (all/active/completed), inline editing, persistent storage, and a clean responsive UI. Ideal for showcasing reactive CRUD operations.

### [One Node, Live in Every Tab](https://estebanrfp.github.io/gdb/examples/singleNode.html)
The smallest thing GenosDB does, and the shape of everything else: `db.get(id, callback)` is a subscription rather than a fetch, so the callback fires again on every change to that node — from this tab, another tab, or a peer. The input never writes to the screen; it writes to the graph, and the screen is redrawn by the same path a remote change takes. Open it twice to watch it.

### [Two Live Queries Over One Graph](https://estebanrfp.github.io/gdb/examples/status-lists.html)
Two `db.map()` subscriptions watching different filters, side by side. A node belongs to whichever query it currently matches, so flipping one field makes the engine work both out for you — `removed` from one list, `added` to the other, in the same write. Press a button in one column and watch the row appear in the other: no routing code, because the queries **are** the routing.

### [Infinite Scroll](https://estebanrfp.github.io/gdb/examples/infinite-scroll.html)
Example of dynamic content loading while scrolling.

### [Pagination](https://estebanrfp.github.io/gdb/examples/pagination.html)
Blog Grid with Mixed Pagination and Persistence.

### [Real-Time Chat](https://estebanrfp.github.io/gdb/examples/chat.html)
A basic chat with real-time updates.

### [Real-Time Kanban](https://estebanrfp.github.io/gdb/examples/kanban.html)
A basic kanban with real-time updates.

### [Custom Cursor](https://estebanrfp.github.io/gdb/examples/cursor.html)
Move your mouse cursor in realtime.

### [P2P Collaborative Whiteboard](https://estebanrfp.github.io/gdb/examples/whiteboard.html)
Build complex real-time apps without a backend. This collaborative whiteboard runs entirely peer-to-peer, powered by the simplicity of GenosDB.

### [Instant Search](https://estebanrfp.github.io/gdb/examples/search.html)
Implementation of a quick search for GDB Operator testing.

### [Real-Time Paste](https://estebanrfp.github.io/gdb/examples/paste.html)
A textarea that syncs content in real-time with GenosDB.

### [Tic Tac Toe Game](https://estebanrfp.github.io/gdb/examples/tictactoc.html)
A Tic Tac Toe game using GenosDB for real-time player synchronization.

### [Real-Time Audio Room](https://estebanrfp.github.io/gdb/examples/audio-streaming.html)
A real-time peer-to-peer audio streaming app using GenosDB’s room feature. Supports microphone broadcasting, automatic peer discovery, and live audio playback between multiple users in the same session. Includes real-time voice activity detection to visually indicate when a peer is speaking.

### [Real-Time Video Room](https://estebanrfp.github.io/gdb/examples/video-streaming.html)
A real-time peer-to-peer video streaming app using GenosDB’s room feature. Supports webcam broadcasting, automatic peer discovery, and live video playback between multiple users in the same session.

### [Real-Time File Streaming](https://estebanrfp.github.io/gdb/examples/file-streaming.html)
A real-time peer-to-peer File Streaming app using GenosDB’s room feature.

### [Real-time location sharing](https://estebanrfp.github.io/gdb/examples/share-locations.html)
An interactive example that enables multiple users to share their live location on a map in real time, using Leaflet for visualization and GenosRTC as the P2P transport layer.
Each participant can start or stop location sharing, track their own path, and follow other connected users’ movements live.

### [Real-Time Geolocation](https://estebanrfp.github.io/gdb/examples/geo.html)
Detects your current position, seeds sample nodes around it, and finds the ones within 50 km using the **Geo module's** `$near` operator — markers and results update on a Leaflet map wherever you are.

### [Real-Time collaborative rich‑text editor powered by GenosDB](https://estebanrfp.github.io/gdb/examples/collab.html)
A real-time collaborative rich‑text editor powered by GenosDB: live typing sync, remote cursors/selections, RBAC + WebAuthn auth, Markdown/HTML split preview with draggable splitter, version history panel, file sharing, and video room.

### [Basic Collaborative Editor powered by GenosDB](https://estebanrfp.github.io/gdb/examples/collab-editor-basic.html)
A minimal, no-login collaborative text editor — the basic counterpart to the rich-text editor above. Shows live presence (online peers) and debounced auto-save on top of GenosDB's automatic P2P sync: writes via `db.put()` and a reactive `db.get(id, callback)` subscription, with concurrent edits resolved by the Hybrid Logical Clock — no manual channels or timestamps.

### [Real-time IoT Thermostat Control powered by GenosDB](https://estebanrfp.github.io/gdb/examples/thermostat.html)
A real-time peer-to-peer thermostat control demo showcasing GenosDB's reactive synchronization. Multiple users can adjust target temperature, toggle eco-mode (Leaf), and set away status — all changes instantly sync across connected browsers without any backend server. Demonstrates `db.put()`, reactive `db.get()` subscriptions, and P2P room events for peer counting.

### [DevConnect — P2P Developer Network powered by GenosDB](https://estebanrfp.github.io/gdb/examples/devconnect.html)
A decentralized developer-networking app and full GenosDB showcase: passwordless identity via the Security Manager (mnemonic + WebAuthn passkeys) behind a centered login modal, a real-time developer directory powered by `db.map()`, public and private P2P chat over GenosRTC data channels, GitHub profile import, and interactive Leaflet maps with geo-tagged peers.

---

## Security Manager (SM) Examples

### [Encrypted Notes — What Peers Actually Hold](https://estebanrfp.github.io/gdb/examples/sm-encrypted-notes.html)
The same nodes, read two ways, side by side. On the left `db.sm.map()` decrypts what your key opens; on the right a plain `db.map()` reads the raw graph and needs no key at all — showing the `_gdbSecurePayloadV1` envelopes exactly as every peer replicates them. **Sign in as a second identity and the left panel empties while the right one stays as full as ever**: in a P2P database everyone already holds the bytes, and confidentiality comes from `db.sm.put` encrypting the value, never from the graph withholding it. Includes the canonical identity door (mnemonic + passkeys). Note the asymmetry it relies on: `db.sm.map()` decrypts and queries but is **not** reactive — one fresh pass per call — while `db.sm.get(id, callback)` *is* a live subscription over encrypted data.

### [Security Manager (SM Testbed)](https://estebanrfp.github.io/gdb/examples/sm-testbed.html)
A hands-on tour of the Security Manager — one-click demo identities, per-user encryption and RBAC — built around a **guided scenario** that shows how a signed role grant propagates **P2P to an offline user via a relay peer, with the superadmin offline**. Open it in three separate browsers to watch authority survive the signer going away.

### [SM RBAC Chat (WebAuthn Example)](https://estebanrfp.github.io/gdb/examples/chatrbac.html)
RBAC Chat with WebAuthn Security.

### [Passkeys — WebAuthn Identity](https://estebanrfp.github.io/gdb/examples/webauthn.html)
The identity lifecycle on its own, with nothing else on the page: generate a mnemonic, wrap it in a **passkey** (`protectCurrentIdentityWithWebAuthn`), log out, and get back in with the device alone (`loginCurrentUserWithWebAuthn`) — the phrase never typed a second time. Reports what the Security Manager says about the session as it changes, so the difference between *the phrase is the identity* and *the passkey only unlocks it here* is on screen rather than in a comment. Needs HTTPS or `localhost`: an IP address is never a valid Relying Party ID, and the page says so instead of failing.

### [SM Encryption Example](https://estebanrfp.github.io/gdb/examples/encryption.html)
SM Encryption & Decryption Example

### [Oplog Audit Module](https://estebanrfp.github.io/gdb/examples/todolist-audit.html)
Provides real-time auditing of oplog entries, detect spam and prohibited content

### [ACLs + Governance Testbed — The Full Security Model](https://estebanrfp.github.io/gdb/examples/acls.html)
The complete GenosDB security model in one demo — zero-trust, governance and node-level ACLs. Open it in two or three windows: one becomes the demo superadmin with a single button and runs a governance console (live user/role list and signed promotions); the others join as Alice & Bob — zero-trust guests that cannot write until the superadmin's governance rule promotes them to `user` — and then create, share and revoke notes per user with `db.sm.acls.set` / `grant` / `revoke` / `delete`. Referenced from the [SM ACLs Module guide](https://github.com/estebanrfp/gdb/blob/main/docs/sm-acls-module.md) and the [Governance guide](https://github.com/estebanrfp/gdb/blob/main/docs/governance.md).

### [Collaborative Docs — Node-Level ACLs in a Real App](https://estebanrfp.github.io/gdb/examples/docs.html)
What the ACLs module looks like once it stops being a testbed and becomes an application. Every document is a node whose `owner` and `collaborators` decide who may read, edit or delete it — re-checked by every peer against the cryptographically verified signer, so a tampered client changes nothing. Open it in two windows **side by side**: create a document, grant another address `read`, `write` or `delete` with `db.sm.acls.grant`, and watch each window's controls reflect exactly what that address may do, gated but never hidden. Moderation is **granted, not inherited**: a new document hands the demo superadmin `delete` at creation — visible in the access panel and revocable by the owner — because a superadmin role carries no power over someone else's node. Also the reference implementation of the [Design Guide](https://github.com/estebanrfp/gdb/blob/main/docs/genosdb-design-guide.md): design tokens, identity `<dialog>`, one `db.map` subscription handling the four actions. Full guide: [SM ACLs Module](https://github.com/estebanrfp/gdb/blob/main/docs/sm-acls-module.md).

### [Governance — Role Promotion & Demotion](https://estebanrfp.github.io/gdb/examples/governance.html)
A live viewer of GenosDB's governance engine, which resolves each user's role by **last-match-wins**. Open it in two windows: one becomes the demo superadmin with a single button and runs the engine; the other logs in as Alice (or Bob) — a zero-trust guest promoted to `user` in ~5 seconds — then votes 👍 to climb a merit ladder (`user` → `manager` at 2 points → `admin` at 4 points) and 👎 to **auto-demote** (no explicit demotion rules — losing the condition simply lets a lower rule win). A live role roster and a signed role-transition log show every promotion and demotion. Full guide: [Governance](https://github.com/estebanrfp/gdb/blob/main/docs/governance.md).

---

## Tools & Testbeds

### [GenosDB - Mesh Network Monitor](https://estebanrfp.github.io/gdb/examples/mesh-cells-monitor-d3.html)
**The reference monitor** for GenosDB networks: an interactive force-directed graph (D3.js) of the Cellular Mesh topology — cells, bridges, peers you can drag — with live network metrics, dynamic TTL, a per-cell peer roster, and Fallback Servers identified as violet `SRV` nodes. Uniquely, it also taps the sync protocol itself (`db.use`): every real database operation (PUT / DEL / LINK) is animated traveling across cells and bridges, so you watch GenosDB work — not just its chat channel.

**Visual variants** — same protocol, different aesthetics: [Lite](https://estebanrfp.github.io/gdb/examples/mesh-cells-monitor-lite.html) (lightweight Canvas) · [Retro](https://estebanrfp.github.io/gdb/examples/mesh-cells-monitor-retro.html) (ASCII CRT terminal) · [Modern](https://estebanrfp.github.io/gdb/examples/mesh-cells-monitor-modern.html) (minimalist Canvas) · [3D Particles](https://estebanrfp.github.io/gdb/examples/mesh-cells-monitor-particles.html) (Three.js).

### [GenosDB - Mesh Cells Reach Probe](https://estebanrfp.github.io/gdb/examples/mesh-cells-reach-probe.html)
A minimal instrument for observing how peers partition into cells. Open it in several tabs — each is a peer; past 10 peers the mesh organizes into cells linked by elected bridges, and the panel reports how many peers land in each cell and who bridges them. Press **PING** to broadcast a `hello` that every peer answers with `world`, so **reach N/N** confirms the message still reaches every peer across the cells, with the coverage latency.

### [GenosDB - Perf & Stress Test](https://estebanrfp.github.io/gdb/examples/perf-stress-test.html)
A dedicated environment for benchmarking GenosDB under high-load scenarios: chunked mass insertions with honest metrics (**ops/s over pure write time**, fulfilled vs failed), realtime subscription counters, configurable `saveDelay` / `oplogSize` knobs, and a **Sync Protocol Observatory** that counts `sync` / `deltaSync` / `fullStateSync` messages live so you can watch the Hybrid Delta Protocol switch between delta and full-state catch-up across browsers.

### [GenosDB - Query Playground](https://estebanrfp.github.io/gdb/examples/sandbox.html)
A testing environment to experiment with GDB Operators and Natural Language for Queries examples

### [GenosDB - Geo Query Playground](https://estebanrfp.github.io/gdb/examples/sandbox-locations.html)
An interactive playground for the **Geo module**: pick or edit `$near` / `$bbox` queries and watch the matching places render live on a Leaflet map of New York. Ideal for learning the documented geo query syntax.

### [Edge Operator Testbed](https://estebanrfp.github.io/gdb/examples/edge-operator-testbed.html)
`$edge` Operator Testbed environment to experiment with GenosDB Operators

### [Graph Traversal Depth Demo](https://estebanrfp.github.io/gdb/examples/edges-max_depth_demo.html)
How deep `$edge` really goes: seeds a 50-link chain of nodes, then resolves the descendants matching a filter in a **single** query — no manual hop-by-hop walking, no depth ceiling to configure. Useful before modelling anything recursive (folder trees, threaded replies, org charts), because it answers the first question everyone asks: does the traversal reach the far end?

### [$edge Traversal — Depth in One Query](https://estebanrfp.github.io/gdb/examples/edges-max_depth_demo.html)
Two chains of 50 linked nodes, and a single `db.map()` that walks one of them end to end: `$edge` takes the filter you would have applied at each hop and pushes it into the traversal, so depth costs one query instead of one round trip per level. The second chain is never a starting point and never appears in the result — which is the part worth watching.

### [Interactive Graph Playground](https://estebanrfp.github.io/gdb/examples/edges.html)
A hands-on tour of the graph itself: add nodes, link them with `db.link(source, target)`, and traverse the result with the **`$edge` operator** — the query it opens with returns every tag on the posts Ana wrote, two hops away. Ships a seeded example graph (users → posts → tags) so the traversal queries have something to walk before you type anything.

### [Natural Language Query Playground](https://estebanrfp.github.io/gdb/examples/nlquery.html)
The **`nlq` module** (`gdb(name, { nlq: true })`) turning plain English into GenosDB queries: load 50 real posts from DummyJSON, then run prompts like *"Get posts id between 4, 10"* or *"posts whose title contains the word And"* and see the query and its results side by side. Prompts are editable, so it doubles as a way to learn what the module can and cannot parse.

### [Cellular Mesh Graph (D3)](https://estebanrfp.github.io/gdb/examples/graph-p2p.html)
The compact companion to the Mesh Network Monitor: a D3 force graph of the **real** peers in your room (`db.room`), coloured by cell, with bridge peers and cross-cell links styled from the engine's own cellular state. Open it in several tabs and watch the mesh partition as peers arrive. ~170 lines — the smallest complete reading of `rtc: { cells }`.

### [Data Relationships](https://estebanrfp.github.io/gdb/examples/relations.html)
Visualization of graph relations in realtime.

### [Test Links](https://estebanrfp.github.io/gdb/examples/testlinks.html)
A tool to verify and validate the functionality of hyperlinks within the application.

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

Plugins, bridges, and adapters that bring GenosDB into other platforms, engines, and frameworks. *(Different from GenosDB's own optional **modules** — SM, NLQ, GEO, rx, audit.)*

### [godot-genosdb — Serverless P2P multiplayer for Godot](https://github.com/estebanrfp/godot-genosdb)
A drop-in **Godot 4** plugin that adds real-time **P2P multiplayer** to Web exports via GenosDB — no backend. The API **mirrors GenosDB** (`join` / `send` / `put` / `map` / `remove`), so using it teaches the real GenosDB API. Ships with a cozy Stardew-style co-op farm demo (chop trees in a shared world, P2P chat). **[▶ Live demo](https://estebanrfp.github.io/godot-genosdb/)**.

_By: [Esteban Fuster Pozzi (estebanrfp)](https://github.com/estebanrfp)_

---

**Contributing to Awesome Projects:**
If you have a project using GenosDB that you'd like to showcase, please [open an issue](https://github.com/estebanrfp/gdb/issues) with the details, or submit a pull request to this page!