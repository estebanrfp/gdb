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

### [Status List](https://estebanrfp.github.io/gdb/examples/status-lists.html)
This example demonstrates running Multiple, query-filtered db.map() listeners in real-time.

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

### [Real-Time collaborative rich‑text editor powered by GenosDB](https://estebanrfp.github.io/gdb/examples/collab.html)
A real-time collaborative rich‑text editor powered by GenosDB: live typing sync, remote cursors/selections, RBAC + WebAuthn auth, Markdown/HTML split preview with draggable splitter, version history panel, file sharing, and video room.

### [Secure, Decentralized & Collaborative Notes App powered by GenosDB](https://estebanrfp.github.io/gdb/examples/notesdev.html)
Secure, Decentralized & Collaborative Notes App powered by GenosDB
A minimalist and secure note-taking app showcasing decentralized identity management (Mnemonic & WebAuthn Passkeys), real-time note sharing with granular read/write permissions enforced via P2P security middleware, live full-text search, and a responsive UI with light/dark modes.

### [Real-time IoT Thermostat Control powered by GenosDB](https://estebanrfp.github.io/gdb/examples/thermostat.html)
A real-time peer-to-peer thermostat control demo showcasing GenosDB's reactive synchronization. Multiple users can adjust target temperature, toggle eco-mode (Leaf), and set away status — all changes instantly sync across connected browsers without any backend server. Demonstrates `db.put()`, reactive `db.get()` subscriptions, and P2P room events for peer counting.

---

## Security Manager (SM) Examples

### [Secure Auth UX Demo](https://estebanrfp.github.io/gdb/examples/sm-auth-demo.html)
A self-contained example demonstrating a secure and intuitive user authentication (UX) flow using the GenosDB Security Manager (SM) module. It implements best practices for Mnemonic-based registration and WebAuthn (Passkeys) authentication, serving as a starter template for decentralized applications. [Secure Auth UX Demo v2](https://estebanrfp.github.io/gdb/examples/sm-auth-demo2.html)

### [Security Manager (SM Testbed)](https://estebanrfp.github.io/gdb/examples/sm-testbed.html)
Security Manager + Role-Based Access Control (RBAC) + WebAuthn Security.

### [SM RBAC Chat (WebAuthn Example)](https://estebanrfp.github.io/gdb/examples/chatrbac.html)
RBAC Chat with WebAuthn Security.

### [SM RBAC WebAuthn Example](https://estebanrfp.github.io/gdb/examples/webauthn.html)
RBAC Simple WebAuthn Security.

### [SM Encryption Example](https://estebanrfp.github.io/gdb/examples/encryption.html)
SM Encryption & Decryption Example

### [Oplog Audit Module](https://estebanrfp.github.io/gdb/examples/todolist-audit.html)
Provides real-time auditing of oplog entries, detect spam and prohibited content

### [SM Secure Notes](https://estebanrfp.github.io/gdb/examples/sm-secure-notes.html)
A single-page HTML application demonstrating secure, real-time, peer-to-peer note sharing. It utilizes GenosDB and its SM module for identity management, implicit client-side encryption of notes, and secure P2P data synchronization.

---

## Tools & Testbeds

### [GenosDB - Mesh Cells Monitor (D3)](https://estebanrfp.github.io/gdb/examples/mesh-cells-monitor-d3.html)
A real-time visualization tool that displays the Cellular Mesh topology, bridge nodes, routing paths, and network metrics using D3.js.

### [GenosDB - Mesh Cells Monitor (Lite)](https://estebanrfp.github.io/gdb/examples/mesh-cells-monitor-lite.html)
A lightweight Canvas-based real-time visualization of the Cellular Mesh topology. Optimized for performance with minimal resource usage, featuring animated message particles and network metrics.

### [GenosDB - Mesh Cells Monitor (Retro)](https://estebanrfp.github.io/gdb/examples/mesh-cells-monitor-retro.html)
A retro-styled ASCII terminal monitor displaying the Cellular Mesh network in 80s CRT aesthetic. Features green phosphor text, scanline effects, and real-time system metrics with minimal CPU overhead.

### [GenosDB - Mesh Cells Monitor (Modern)](https://estebanrfp.github.io/gdb/examples/mesh-cells-monitor-modern.html)
A clean, minimalist Canvas-based visualization with modern UI design. Features smooth particle animations, real-time metrics, and an elegant dark interface.

### [GenosDB - Mesh Cells Monitor (3D Particles)](https://estebanrfp.github.io/gdb/examples/mesh-cells-monitor-particles.html)
An immersive 3D visualization of the Cellular Mesh network using Three.js. Features rotating cell geometries, glowing peer nodes, animated message particles with trails, and interactive camera controls.

### [GenosDB - Perf & Stress Test](https://estebanrfp.github.io/gdb/examples/perf-stress-test.html)
A dedicated environment for benchmarking GenosDB under high-load scenarios. 
Allows you to test mass insertions, real-time P2P synchronization, and subscription performance. 
Ideal for evaluating throughput, latency, and the stability of GDB in demanding use cases.

### [GenosDB - Query Playground](https://estebanrfp.github.io/gdb/examples/sandbox.html)
A testing environment to experiment with GDB Operators and Natural Language for Queries examples

### [Edge Operator Testbed](https://estebanrfp.github.io/gdb/examples/edge-operator-testbed.html)
`$edge` Operator Testbed environment to experiment with GenosDB Operators

examples/edges-operator-testbed.html

### [Data Relationships](https://estebanrfp.github.io/gdb/examples/relations.html)
Visualization of graph relations in realtime.

### [Test Links](https://estebanrfp.github.io/gdb/examples/testlinks.html)
A tool to verify and validate the functionality of hyperlinks within the application.

---

## Awesome Projects & Showcases

A curated list of more complex or notable projects, applications, or tools built with or for GenosDB. Contributions are welcome!

*(Please replace the placeholder examples below with your actual projects and projects from third parties. Ensure you have permission or it's an open-source project if listing third-party work prominently.)*

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

### [Pixel-Painting](https://github.com/estebanrfp/Pixel-Painting)
Distributed Pixel Painting Application with GenosDB and Vanilla Javascript

_By: [Esteban Fuster Pozzi (estebanrfp)](https://github.com/estebanrfp)_

### [OVGrid - Open Virtual Grid](https://ovgrid.com/)
WebXR Educational Virtual World - Real-time shared experiences. ~ By [estebanrfp](https://github.com/estebanrfp)
Project progress videos - [@ovgrid](https://odysee.com/@ovgrid:d)
---
**Contributing to Awesome Projects:**
If you have a project using GenosDB that you'd like to showcase, please [open an issue](https://github.com/estebanrfp/gdb/issues) with the details, or submit a pull request to this page!