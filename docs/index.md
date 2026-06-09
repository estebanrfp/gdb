# GenosDB Documentation

Welcome to the official technical documentation for GenosDB.

## API Reference & Advanced Documentation 

  - 📘 [GDB API Reference](genosdb-api-reference.md) (Detailed API documentation)
  - 🤝 [Distributed Trust Model](genosdb-distributed-trust-model.md) (P2P trust via cryptographic identity, signed ops, and RBAC enforcement)
  - 🔒 [Zero Trust Security Model](zero-trust-security-model.md) (Understanding GenosDB Zero-Trust Security Model: From Guest to SuperAdmin)
 
  - 🧪 [GenosDB Examples](genosdb-examples.md) (Live demos and community projects)
  - ✨ [GenosDB Features](genosdb-features.md) (Comprehensive feature overview and architecture)
  - ↔️ [Cursor-Based-Pagination](cursor‐based-pagination.md) (Efficient paging with $after/$before/$limit)
  - 📚 [Resources](genosdb-resources.md) (Helpful links: whitepaper, docs, wiki, npm, discussions)

---

  - 🛠️ [CRUD Operation Guide](crud-operations-guide.md) (Overview of CRUD APIs with links to detailed guides)
  - 📤 [PUT Guide](put-guide.md) (Insert/update nodes; auto ID, persistence, and events)
  - 📥 [GET Guide](get-guide.md) (Retrieve nodes by ID; optional real-time subscription)
  - 🗺️ [MAP Guide](map-guide.md) (Query language, real-time subscriptions, and $edge traversal)
  - 🗑️ [REMOVE Guide](remove-guide.md) (Delete nodes and clean up edges; persistence and notifications)
  - 🔗 [LINK Guide](link-guide.md) (Create directed relationships between nodes)

## API Reference (Modules)

  - 🔐 [Security Manager (SM API Reference)](sm-api-reference.md) (RBAC, identity (WebAuthn/mnemonic), signing/verification)
  - 📡 [GenosRTC API Reference](genosrtc-api-reference.md) (P2P WebRTC API: rooms, data channels, audio/video)
  - 🛰️ [Nostr Relay Deployment Guide](nostr-guide.md) (How to run your own Nostr signaling relay for GenosDB/GenosRTC)
  - ⚙️ [GenosRTC Architecture](genosrtc-architecture.md) (A technical breakdown of GenosDB's GenosRTC Module architecture, explaining its key components, including the decentralized signaling layer with Nostr, the P2P transport layer with WebRTC, and the communication abstractions for data and media.)
  - 🔷 [GenosRTC Cells](genosrtc-cells.md) (Cellular mesh overlay: architecture, bridges, TTL, metrics, and scalability)

  ---

  - 🧭 [GenosRTC Guide (rtc)](genosrtc-guide.md) (Tutorials for data channels and media streaming)
  - 🌳 [Radix Tree (rx)](rx-radix-tree.md) (Prefix index with $startsWith and searchByPrefix)
  - 🕵️ [Audit Option (audit)](audit.md) (Asynchronous moderation of the oplog with custom prompt)
  - 🤖 [NLQ Module](nlq-module.md) (Natural Language for Queries in db.map using prompts)
  - 📍 [GEO Query Module (geo)](geo-module.md) (Geo queries with $near and $bbox operators)
  - 🔒 [GenosDB SM ACLs Module (acls)](sm-acls-module.md) (Node-level permissions and access control)
  - 🏛️ [Governance (Role Promotion)](governance.md) (Rule-based promotion of users from guest to higher roles, driven by GenosDB queries and signed by a present superadmin)

  ---


  - ⚙️ [GenosDB Worker Architecture](genosdb-worker-architecture.md) (Technical overview of the persistence worker, covering its tiered storage strategy and data integrity mechanisms.)

  - 🔄 [GenosDB Hybrid Delta Protocol](genosdb-hybrid-delta-protocol.md) (Details the dual-mode engine ensuring real-time speed via delta updates and reliability via a full-state fallback.)

  - 🕰️ [GenosDB Hybrid Logical Clock (HLC)](genosdb-hybrid-logical-clock.md) (An advanced timestamping system that blends physical time with a logical counter to ensure causal event ordering and enable robust, deterministic conflict resolution.)

  - 🧯 [GenosDB Fallback Server](genosdb-fallback-server.md) (Optional superpeer Node.js service to improve availability)

  - 📦 [Bundler Configuration](bundler-configuration.md) (Vite, Webpack, Bun, esbuild, and CDN usage)


## Roadmap & Whitepaper

- 🧭 [ROADMAP.md](../ROADMAP.md) (Planned features and milestones)
- 📄 [WHITEPAPER.md](../WHITEPAPER.md) (Architecture and design paper)
- 📜 [PHILOSOPHY.md](../PHILOSOPHY.md) (Project philosophy, founder history, and coreprinciples)

## Root Documentation

- 🏠 [README.md](../README.md) (Project overview, installation, and docs)
- 🧾 [CHANGELOG.md](../CHANGELOG.md) (Release notes and version history)
- 🤝 [CONTRIBUTING.md](../CONTRIBUTING.md) (How to contribute examples and guidelines)
- 🔀 [MIGRATION.md](../MIGRATION.md) (Migrate from "new GDB()" to "await gdb(...)")
- 🛡️ [SECURITY.md](../SECURITY.md) (Security policy and vulnerability reporting)
- ⚖️ [THIRD_PARTY_LICENSES](../THIRD_PARTY_LICENSES.md) (Third-party and project licenses)

