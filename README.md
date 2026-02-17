# GenosDB (GDB) – Decentralized P2P Graph Database

A lightweight, decentralized graph database designed for modern web applications, offering real-time peer-to-peer synchronization, SM ([Security Manager](https://github.com/estebanrfp/gdb/blob/main/docs/sm-architecture.md)) Provides WebAuthn-based authentication, role-based access control (RBAC), Access Control Lists ([ACLs](https://github.com/estebanrfp/gdb/blob/main/docs/sm-acls-module.md)), and efficient local storage utilizing OPFS.

![GenosDB](https://i.imgur.com/7Xqrht1.png)

---

[![NPM Version](https://img.shields.io/npm/v/genosdb.svg?style=for-the-badge)](https://www.npmjs.org/package/genosdb)
[![License-SourceCode-Proprietary](https://img.shields.io/badge/Source%20Code-Proprietary-blue.svg?style=for-the-badge)](https://github.com/estebanrfp/gdb/blob/main/LICENSE)

[![Production Build](https://img.shields.io/badge/Production%20Build-Free%20for%20personal%20%26%20commercial%20use-brightgreen.svg?style=for-the-badge)](https://github.com/estebanrfp/gdb/blob/main/docs/index.md)

![Downloads on NPM](https://img.shields.io/npm/dw/genosdb)
[![](https://data.jsdelivr.com/v1/package/npm/genosdb/badge)](https://www.jsdelivr.com/package/npm/genosdb)
[![Tests](https://img.shields.io/badge/Tests-passing-brightgreen)](https://estebanrfp.github.io/gdb/tests/report.html)

![Project Status](https://img.shields.io/badge/status-stable--beta-blue)

![NPM Unpacked Size (with version)](https://img.shields.io/npm/unpacked-size/genosdb/latest)

![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/genosdb)


<!-- ### Nostr.band Followers

![Nostr.band Followers](https://img.shields.io/nostr-band/followers/npub18c556t7n8xa3df2q82rwxejfglw5przds7sqvefylzjh8tjne28qld0we7) -->

## Table of Contents
- [Main Features](#main-features)
- [Project Status](#project-status)
- [Installation](#installation)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)
- [Business Inquiries Collaboration](#business-inquiries--collaboration)


## Main Features

### ✅ **GenosDB Core**

- **High-Performance Engine & Efficient Storage:** Utilizes OPFS for fast, local-first storage. The engine is optimized for extreme write loads, capable of processing tens of thousands of operations per second without blocking the main UI thread.
- **Powerful & Flexible Queries:** Supports standard CRUD operations for nodes and relationships, plus advanced, multi-hop recursive graph traversals to discover deep connections.
- **Real-time Synchronization:**
    - **Between Devices (P2P):** Employs an intelligent hybrid system (via GenosRTC) that combines real-time delta updates with a full-state fallback to ensure data consistency across all peers. This feature is enabled by initializing the database with the `{ rtc: true }` option.
    - **Between Tabs:** Uses BroadcastChannel for instant, local synchronization.
    - **Massive Scalability:** Optional Cellular Mesh topology (`{ rtc: { cells: true } }`) enables horizontal scaling to large-scale networks by organizing peers into cells with bridge interconnections. ([GenosRTC Cells](https://github.com/estebanrfp/gdb/blob/main/docs/genosrtc-cells.md))
- **Optimized Data Handling:** Efficiently serializes data with MessagePack and compresses it with Pako to reduce storage footprint and network payload.
- **Extensible & Modular:** The core is lightweight, but its capabilities can be easily extended with external modules for features like advanced indexing (e.g., Radix Tree).

## Project Status

- **Phase**: Stable Beta
- **Current Focus**: The project has completed its major feature development and has entered a hardening phase. Our current focus is on rigorous testing, performance tuning, and solidifying API stability for the first stable release.
- **Completed Features**:
  - Basic queries.
  - Advanced queries.
  - **Recursive Graph Traversal Queries:**
    Execute complex, multi-hop graph traversals using the recursive $edge operator. This operator uses the source nodes as a starting point to discover and return all connected nodes that match a powerful sub-query, regardless of their relational distance. The entire traversal logic is resolved within a single, declarative query, eliminating the need for manual, multi-step lookups in the application code. The query engine is designed to handle deeply nested relational paths with exceptional speed.
  - Distributed storage.
  - Conflict resolution module (LWW).
  - Performance optimization.
  - **Intelligent Hybrid Synchronization:**
    GenosDB overcomes the limitations of naive P2P sync with an intelligent, dual-mode engine. It automatically exchanges tiny, compressed Deltas between active peers using a sliding-window Oplog for blazing-fast, low-latency updates. For peers that are too far out of sync, it seamlessly switches to a robust Full-State Fallback, guaranteeing absolute data consistency for everyone, no matter how long they've been offline.
  - **Access Control Lists (ACLs):** Optional submodule for fine-grained, node-level permissions, allowing owners to grant/revoke specific permissions ('read', 'write', 'delete') to other users per node, complementing the existing RBAC system.

### 🧪 API Status: Stable Beta

> The GenosDB API is currently in a stable beta. We are actively adding features and improving stability.
> We recommend checking the [CHANGELOG](https://github.com/estebanrfp/gdb/blob/main/CHANGELOG.md) as we continue to refine the API for its first stable release.

### ✅ **Role Based Access Control (RBAC)**

- Customizable role hierarchy (`superadmin`, `admin`, etc)
- Biometric Registration and Authentication with WebAuthn
- Granular permissions (`read`/`write`/`delete`/`publish`)
- Role assignment with automatic expiration
- Cryptographic transaction verification

### ✅ **Security**

- Digital signature of critical operations
- Real-time permission validation
- Secure storage of roles in internal graph
- [Security Manager (SM Architecture)](https://github.com/estebanrfp/gdb/blob/main/docs/sm-architecture.md)

## A Note on P2P System Reliability

GenosDB operates in a real-world P2P environment, which exposes the system to network uncertainties by design. Our engineering focus is on mitigating these uncertainties within our software through robust conflict resolution (CRDTs) and synchronization logic. While we cannot control external network conditions, our commitment is to the continuous research and development required to ensure the highest possible resilience of the GenosDB engine.

---

## Installation

### 1. Via NPM

```bash
npm install genosdb
```

```javascript
import { gdb } from "genosdb"
```

### 2. Direct use in browser from a CDN

```html
<script type="module">
  import { gdb } from "https://cdn.jsdelivr.net/npm/genosdb@latest/dist/index.min.js"
</script>
```

## Documentation

- **Technical Docs**: Find API references and guides in [/docs](https://github.com/estebanrfp/gdb/blob/main/docs/index.md).

- **Introduction & Concepts**: Visit our [GitHub Wiki](https://github.com/estebanrfp/gdb/wiki) for an overview.

- **Tutorials**: Explore use cases on [Medium](https://medium.com/genosdb).


For interactive, AI-assisted GenosDB documentation: 

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/estebanrfp/gdb)

## Examples

We’ve created a collection of interactive examples to help you understand how GDB works in real-world scenarios. These examples cover everything from basic setup to advanced features like RBAC and P2P synchronization.

👉 [Explore /docs/Examples](https://github.com/estebanrfp/gdb/blob/main/docs/genosdb-examples.md)

## Project Documentation
- 🧭 [ROADMAP.md](https://github.com/estebanrfp/gdb/blob/main/ROADMAP.md) (Planned features and milestones)
- 📄 [WHITEPAPER.md](https://github.com/estebanrfp/gdb/blob/main/WHITEPAPER.md) (Architecture and design paper)
- 📜 [PHILOSOPHY.md](https://github.com/estebanrfp/gdb/blob/main/PHILOSOPHY.md) (Project philosophy, founder history, and coreprinciples)
- 🏠 [README.md](https://github.com/estebanrfp/gdb/blob/main/README.md) (Project overview, installation, and docs)
- 🧾 [CHANGELOG.md](https://github.com/estebanrfp/gdb/blob/main/CHANGELOG.md) (Release notes and version history)
- 🤝 [CONTRIBUTING.md](https://github.com/estebanrfp/gdb/blob/main/CONTRIBUTING.md) (How to contribute examples and guidelines)
- 🔀 [MIGRATION.md](https://github.com/estebanrfp/gdb/blob/main/MIGRATION.md) (Migrate from "new GDB()" to "await gdb(..)")
- 🛡️ [SECURITY.md](https://github.com/estebanrfp/gdb/blob/main/SECURITY.md) (Security policy and vulnerability reporting)

---

### **Internal Dependencies**

Below is a list of internal dependencies and their purposes within the project:

| Dependency         | Usage                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------|
| `@msgpack/msgpack` | Data serialization/deserialization in MessagePack format.                              |
| `pako`             | Data compression/decompression using gzip.                                            |
| `genosrtc`         | New Internal Module for P2P synchronization for sharing changes in real-time between tabs/devices.            |
| `BroadcastChannel` | Communication between browser tabs to notify local changes.                           |

#### Additional Information

- **`@msgpack/msgpack`**:  
  This library is used to efficiently serialize and deserialize data, reducing payload sizes for storage and transmission.

- **`pako`**:  
  Provides gzip compression to optimize data storage and network communication.

- **`GenosRTC`** (Internal Module for GenosDB) :  
  GenosRTC is the real-time communication module for GenosDB, implementing peer-to-peer connections via WebRTC with signaling over the Nostr protocol. For large-scale applications (100+ peers), GenosRTC includes an optional Cellular Mesh overlay that reduces connection complexity from O(N²) to O(N), enabling large-scale networks.

  This module was developed internally for the specific needs of GenosDB and leverages state-of-the-art cryptographic dependencies, such as `@noble/curves`, to ensure maximum security and performance.

  Enables peer-to-peer synchronization, ensuring real-time updates across multiple instances of the application.  
  > **Note**: Among the available networks supported by GenosRTC, this project specifically uses the **Nostr** protocol for decentralized communication.  
  >
  > **What is Nostr?**  
  > Nostr (Notes and Other Stuff Transmitted by Relays) is a decentralized protocol designed for censorship-resistant global communication. It operates without relying on centralized servers, instead using a network of relays to transmit signed messages between peers. Nostr is particularly well-suited for applications requiring secure, private, and scalable peer-to-peer interactions, such as social networks, messaging systems, or collaborative tools.

- **`BroadcastChannel`**:  
  Facilitates lightweight communication between browser tabs, allowing seamless updates without relying on external servers.

> **General Note**: These dependencies are integral to the project's performance and functionality, ensuring efficient data handling and real-time synchronization while leveraging decentralized technologies like Nostr.

## Presentation Video

<div align="center">
  <a href="https://www.youtube.com/watch?v=Lkw4hQpgt50">
    <img src="https://img.youtube.com/vi/Lkw4hQpgt50/0.jpg" alt="GenosDB Presentation" width="100%" />
  </a>
</div>

## Contributing

We value community contributions and welcome your help in improving GenosDB! Currently, contributions are focused on:

- 📝 Improving our documentation.
- 💡 Submitting usage examples and tutorials.
- 🐞 Reporting bugs or suggesting new features.

Please read our [Contribution Guidelines](https://github.com/estebanrfp/gdb/blob/main/CONTRIBUTING.md) for more details. We do not accept pull requests for the core source code at this time.

## Community

We value community contributions — get involved through:

- [Issues](https://github.com/estebanrfp/gdb/issues) — report bugs or request features  
- [Discussions](https://github.com/estebanrfp/gdb/discussions) — ask questions or share ideas

See the discussion on Product Hunt:

<a href="https://www.producthunt.com/products/genosdb?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-genosdb" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1015741&theme=light&t=1757737737388" alt="GenosDB - GenosDB&#0032;&#0040;GDB&#0041;&#0032;–&#0032;Distributed&#0032;P2P&#0032;Graph&#0032;Database | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

<a href="https://www.proofstories.io/directory/products/genosdb/" target="_blank" rel="noopener" style="height: 60px;"><img src="https://www.proofstories.io/directory/badges/l/genosdb.svg" alt="GenosDB badge" style="height: 60px;" /></a>

Feel free to ask questions, share ideas, or just say hello! 👋

For more details on contributing, check out our [Contributing Guidelines](https://github.com/estebanrfp/gdb/blob/main/CONTRIBUTING.md).

## Special Thanks

Being part of the GunDB community has given me the opportunity to contribute to and take part in incredible projects. GunDB and GenosDB belong to the same research effort in distributed systems. My sincerest gratitude to [Mark Nadal](https://github.com/amark/gun), Founder of GunDB, for his friendship and unconditional support.

A special mention to [William Blankenship](https://webai.com), Network Fellow at WebAI, for his initial support and kind words about the vision for GenosDB.

## License

### Project License

The production builds of GenosDB (GDB) are free to use for both personal and commercial projects. You can integrate them into your applications without any licensing fees.

However, the source code for GenosDB is proprietary and is not available under an open-source license. You do not have the right to decompile, reverse-engineer, or modify the core source code.

### Third-Party Licenses

This project includes third-party dependencies with their own respective licenses. For detailed information, see the [Third-Party Licenses page](https://github.com/estebanrfp/gdb/blob/main/THIRD_PARTY_LICENSES.md).

## Maintenance

This repository provides production builds of GenosDB (GDB), a decentralized P2P graph database designed for modern web applications. These builds are freely available for anyone to use and integrate into their projects. Please note that the source code is not publicly available at this time; only the production builds versions are provided. The project is actively maintained by Esteban Fuster Pozzi ([@estebanrfp](https://github.com/estebanrfp))

## Author

[Esteban Fuster Pozzi (@estebanrfp)](https://estebanrfp.com) — Full Stack JavaScript Developer and creator of [GenosDB (GDB)](https://www.npmjs.com/package/genosdb), a free-to-use real-time graph database built entirely with modern vanilla JavaScript.

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Festebanrfp%2Fgdb.svg?type=shield&issueType=security)](https://app.fossa.com/projects/git%2Bgithub.com%2Festebanrfp%2Fgdb?ref=badge_shield&issueType=security)

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Festebanrfp%2Fgdb.svg?type=large&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Festebanrfp%2Fgdb?ref=badge_large&issueType=license)

---

## Business Inquiries & Collaboration

GenosDB is an independently developed project with a long-term vision to power the next generation of secure, decentralized, and real-time applications.

For strategic partnerships, enterprise support inquiries, or discussions regarding the project's roadmap and future, please feel free to reach out directly.

**Contact:** [estebanrfp@gmail.com](mailto:estebanrfp@gmail.com) or start a conversation in [GitHub Discussions](https://github.com/estebanrfp/gdb/discussions).
