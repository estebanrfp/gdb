# GenosDB Whitepaper

[](https://github.com/estebanrfp/gdb)

# GenosDB: A Decentralized P2P Graph Database for Modern Web Applications

## Abstract

GenosDB is a lightweight, decentralized peer-to-peer (P2P) graph database designed for real-time web applications. Built with modern web technologies, it integrates a flexible graph data model, real-time P2P synchronization via GenosRTC, advanced query capabilities, and robust security through a zero-trust model — Role-Based Access Control (RBAC), node-level Access Control Lists (ACLs), rule-based Governance, and WebAuthn authentication. Its modular architecture leverages WebRTC, Nostr, MessagePack, and Last-Write-Wins (LWW) Conflict-Free Replicated Data Types (CRDTs) to ensure scalability, performance, and developer simplicity. This whitepaper explores GenosDB’s architecture, query system, extensible modules, security features, and use cases.

To protect proprietary algorithms and maintain a focused development path, the source code is not publicly shared. Instead, GenosDB is distributed as a free-to-use minified bundle via NPM and CDN, accompanied by comprehensive public documentation and a transparent test suite. This approach builds trust through verifiable functionality and rigorous testing while safeguarding intellectual property, positioning GenosDB as a robust solution for developers seeking secure and scalable decentralized data management.

## 1. Introduction

The modern web demands decentralized, serverless data management solutions that prioritize real-time performance, security, and scalability. Traditional databases, reliant on centralized infrastructure, are ill-suited for P2P applications requiring low-latency synchronization and trustless operation. GenosDB addresses these challenges with a browser-native graph database that leverages WebRTC for P2P communication, Nostr for peer discovery, and LWW-CRDTs for conflict resolution. Its intuitive API, advanced query capabilities, modular extensibility, and cryptographic security make it ideal for building secure, scalable applications with minimal complexity.

This whitepaper details GenosDB’s technical architecture, query system, and module ecosystem, drawing from its public APIs and extensive documentation ([github.com/estebanrfp/gdb](https://github.com/estebanrfp/gdb)). While the source code remains proprietary, GenosDB is offered as a free minified bundle, enabling unrestricted use. Public unit tests and comprehensive documentation ensure transparency and build confidence in its reliability, positioning it as a robust solution for enterprise-grade decentralized data management.

## 2. Architecture

GenosDB’s architecture is modular and optimized for browser environments, integrating a graph database engine, P2P streaming, security, and persistence layers.

### 2.1 Core Components

-   **GDB (Graph Database Engine)**: A lightweight engine supporting CRUD operations (`put`, `get`, `link`, `map`, `remove`, `clear`) and recursive graph traversal via the `$edge` operator. It uses MessagePack for serialization and Gzip (via `pako`) for compression, minimizing network and storage overhead.
-   **GenosRTC**: A P2P streaming module built on WebRTC, enabling real-time data, audio, and video transfers through named data channels. It uses Nostr relays for peer discovery.
-   **Security Module (SM)**: Implements RBAC with hierarchical roles (`guest`, `user`, `manager`, `admin`, `superadmin`) and WebAuthn for passwordless authentication, plus optional node-level ACLs and a rule-based Governance engine. Operations are cryptographically signed and verified, and per-node ACL / role checks are enforced against malicious peers — not just the honest client.
-   **Oplog**: A persistent operation log, supporting delta synchronization with a configurable window. It ensures efficient P2P sync by sharing recent changes.
-   **Conflict Resolution**: Employs LWW-CRDTs with Hybrid Logical Clocks (HLCs) to resolve conflicts, with a customizable `resolveConflict` hook for advanced scenarios.
-   **Persistence**: Uses the Origin Private File System (OPFS) for local storage, with cross-tab synchronization via `BroadcastChannel`.

### 2.2 Data Pipeline

1.  **Serialization**: Data is serialized using MessagePack for compact representation.
2.  **Compression**: Gzip (`pako`) compresses serialized data for efficient P2P transfer.
3.  **Networking**: WebRTC handles P2P communication, with Nostr relays for peer discovery and optional TURN servers for NAT traversal.
4.  **Persistence**: OPFS stores graph data and indexes, with `BroadcastChannel` ensuring cross-tab consistency.
5.  **Conflict Resolution**: LWW-CRDTs with HLCs (capped at a 2-hour drift limit) ensure consistent state across peers.

### 2.3 Diagram

```plaintext
+-------------------+       +-------------------+       +-------------------+
|   GDB (GenosDB)   |<----->|  GenosRTC (P2P)   |<----->| Security Manager  |
| put, get, link,   |       | WebRTC, Nostr,    |       | RBAC, WebAuthn,   |
| map, remove, clear|       | Data Channels     |       | Signing/Verify    |
+-------------------+       +-------------------+       +-------------------+
          |                          |                          |
          v                          v                          v
+-------------------+       +-------------------+       +-------------------+
|     Oplog         |       |  BroadcastChannel |       |      OPFS         |
| Delta Sync,       |       | Cross-Tab Sync    |       | Persistent Storage|
| Conflict Resolver |       |                   |       | Indexes (Radix)   |
+-------------------+       +-------------------+       +-------------------+
          |
          v
+---------------------------+
|    Audit Module  Analysis |
+---------------------------+
```

## 3. Query Capabilities

GenosDB’s query system is a cornerstone of its flexibility, supporting both simple CRUD operations and advanced graph traversals. The `map` method, combined with operators, enables powerful querying of nodes and relationships.

### 3.1 Core Operations

-   **put(value, id?)**: Inserts or updates a node with a value and optional ID.
-   **get(id, callback?)**: Retrieves a node by ID, with optional reactive updates.
-   **link(sourceId, targetId)**: Creates a directed edge between two nodes.
-   **remove(id)**: Deletes a node and its edges.
-   **map(...args)**: Queries nodes with logical operators, pagination, sorting, and real-time updates.
-   **clear()**: Removes all nodes and indexes.

**Example (Storing and Querying Nodes)**:
```javascript
const db = await gdb("my-db", { rtc: true, password: "secure-key" });
const id = await db.put({ name: "Alice", age: 30 });
await db.link(id, "group1");
const results = await db.map({ query: { name: { $eq: "Alice" } }, $limit: 10 });
```

### 3.2 Query Operators

GenosDB supports a rich set of operators for filtering and traversing data:
-   **Comparison**: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$between`, `$exists`.
-   **Text Search**: `$text` (global or field-specific, case-insensitive, diacritic-normalized).
-   **Pattern Matching**: `$like`, `$regex`.
-   **Logical**: `$and`, `$or`, `$not`.
-   **Graph Traversal**: `$edge` for recursive multi-hop queries.

**Example (Text Search and Graph Traversal)**:
```javascript
// Search for nodes with "ali" in any field
const results = await db.map({ query: { $text: "ali" } });
// Traverse edges to find nodes connected to a group
const groupMembers = await db.map({ query: { type: "Group", name: "group1", $edge: { type: "User" } } });
```

### 3.3 Advanced Query Features

-   **Pagination**: Use `$limit`, `$after`, `$before` to control result sets.
-   **Sorting**: Specify `field` and `order` (asc/desc) for sorted results.
-   **Nested Properties**: Access nested fields using dot notation (e.g., `profile.name`).
-   **Prefix Search**: With the Radix Indexer module, `searchByPrefix` enables efficient prefix-based queries.

**Example (Paginated and Sorted Query)**:
```javascript
const results = await db.map({
  query: { age: { $between: [20, 40] } },
  field: "age",
  order: "asc",
  $limit: 10,
  $after: "user10"
});
```

## 4. Modular Architecture

GenosDB’s extensibility is driven by its modular design, allowing developers to enable optional features during initialization.

### 4.1 Available Modules

-   **Security Module (SM)**: Enabled with `{ sm: { superAdmins: ["0x1234..."] } }`. Provides RBAC and WebAuthn.
-   **Radix Indexer**: Enabled with `rx: true`. Uses a Radix Tree for efficient prefix-based indexing and enhances queries with `$startsWith`.
-   **Inverted Index**: Enabled with `ii: true`. Supports full-text search.
-   **Geo Module**: Enabled with `geo: true`. Adds geospatial indexing and queries.
-   **Audit Module**: Enabled with `audit: true`. Analyzes oplog data for problematic content.

**Example (Enabling Modules)**:
```javascript
const db = await gdb("my-db", {
  rtc: true,
  sm: { superAdmins: ["0x1234..."], customRoles: { editor: { can: ["write"], inherits: ["guest"] } } },
  rx: true,
  audit: { prompt: "detect offensive content or spam" }
});
```

## 5. Real-Time P2P Streaming (GenosRTC)

GenosRTC, exposed via `db.room`, enables real-time P2P communication using WebRTC. Its architecture prioritizes decentralization, simplicity, and security, abstracting WebRTC complexities while leveraging Nostr for peer discovery and end-to-end encryption.

### 5.1 Architectural Principles

-   **Decentralization First**: Direct peer connections via WebRTC, with Nostr relays for discovery.
-   **Simplicity through Abstraction**: A clean API hides low-level details like ICE negotiation and SDP.
-   **Room-Based Scoping**: Logical rooms for managing peer groups, with the database name as the room ID.
-   **Secure by Design**: End-to-end encryption for signaling and data channels.

### 5.2 Data Channels, Media Streams, and File Transfer

GenosRTC supports named channels for sending JSON or binary data, P2P audio/video streaming, and file transfers with metadata.

**Example (Chat Application)**:
```javascript
const db = await gdb("chat-room", { rtc: true, password: "secure-key" });
const chatChannel = db.room.channel("messages");
chatChannel.on("message", (msg, peerId) => console.log(`${peerId}: ${msg.text}`));
chatChannel.send({ text: "Hello, everyone!" });
```

### 5.3 Cellular Mesh for Horizontal Scalability

The traditional full-mesh topology, while optimal for latency, creates O(N²) connections—impractical beyond ~100 peers. GenosRTC addresses this with an optional **Cellular Mesh Overlay**:

-   **Topology**: Peers are organized into logical cells via consistent hashing. Each cell maintains a local full-mesh, while designated bridge nodes interconnect adjacent cells.
-   **Complexity Reduction**: Connections per peer are reduced from O(N) to O(cell_size), enabling large-scale networks.
-   **Trade-off**: Message delivery shifts from single-hop to multi-hop (approximately log(N)), introducing slight latency in exchange for massive scalability.
-   **Activation**: Enabled via `{ rtc: { cells: true } }` with configurable parameters for cell size, bridge redundancy, and TTL.

```plaintext
┌─────────┐       ┌─────────┐       ┌─────────┐
│ Cell A  │◄─────►│ Cell B  │◄─────►│ Cell C  │
│ (mesh)  │bridges│ (mesh)  │bridges│ (mesh)  │
└─────────┘       └─────────┘       └─────────┘
```

## 6. Security

The Security Module (SM) ensures trust and access control in P2P environments through a zero-trust model where every action is cryptographically signed and explicitly authorized.

### 6.1 Role-Based Access Control (RBAC)

RBAC defines hierarchical roles with permissions, enforced via cryptographic signatures:
-   **guest**: `read`, `sync`.
-   **user**: `write`, `link`, `sync`.
-   **manager**: `publish`, inherits `user`.
-   **admin**: `delete`, inherits `manager`.
-   **superadmin**: `assignRole`, `deleteAny`, inherits `admin`.

Roles are stored in the graph and synchronized P2P, with `superadmin` addresses configured at initialization.

### 6.2 WebAuthn Authentication & Cryptographic Signing

WebAuthn enables passwordless authentication using biometrics or hardware keys, securing the private keys used to sign all operations.

### 6.3 Access Control Lists (ACLs)

As an optional extension to RBAC, ACLs provide fine-grained, node-level permissions. Enabled with `acls: true`, this allows node owners to grant specific permissions ('read', 'write', 'delete') to other users for individual nodes, complementing the global role hierarchy with per-node access control. Crucially, these checks are enforced against **any** peer, not merely the honest client: since 0.14.0 the cryptographically-verified author of every incoming operation is propagated to the per-node middleware, so a modified peer cannot write a node it does not own.

### 6.4 Governance (Role Promotion & Demotion)

As an optional extension, the Governance engine lets a superadmin declare the rules of advancement up front. Each rule is a declarative `{ if, then: { assignRole } }`, where `if` is a **native GenosDB query** (the same operators as `db.map`). While a superadmin is online, the engine evaluates the rules and signs every role change, which each peer then verifies — zero-trust, with no central server.

Roles resolve by **last-match-wins**: ordered easy→hard, the rules form a merit ladder where reaching a higher tier overrides the lower ones and losing the condition **auto-demotes**, so no explicit demotion rules are needed. This turns reputation thresholds, e-mail whitelists or activity objectives into a few declarative rules.

## 7. Distributed Trust Model

GenosDB's distributed trust model establishes trust without a central authority through three foundational principles:

-   **Cryptographic Identity**: Each user is identified by a unique cryptographic keypair.
-   **Verifiable Actions**: Every operation is digitally signed, ensuring authenticity and integrity.
-   **Shared Constitution**: Rules (roles, permissions) are embedded in the software and enforced locally by each peer.

The "chicken-and-egg" problem of a new user joining is solved with a "zero-trust with a single welcome exception," allowing a new user one `write` operation to create their profile, after which the system enforces the default `guest` role to prevent privilege escalation.

## 8. Synchronization and Conflict Resolution

GenosDB uses an oplog for delta synchronization, storing recent operations. Conflicts are resolved using LWW-CRDTs with Hybrid Logical Clocks. The synchronization engine intelligently switches between modes:

-   **Delta Sync**: Shares recent changes for active peers, minimizing bandwidth.
-   **Full-State Fallback**: Transmits the entire graph state when peers are too far behind or for new peers, ensuring eventual consistency.

## 9. Use Cases

-   **Real-Time Collaboration**: Chat applications, Kanban boards, and to-do lists.
-   **Streaming Applications**: P2P video conferencing and secure file sharing.
-   **Data-Driven Applications**: Inventory management systems and social networks.

## 10. Competitive Analysis

Compared to alternatives like GunDB and OrbitDB, GenosDB offers:
-   A simpler, more intuitive API.
-   Integrated P2P streaming via GenosRTC.
-   Advanced query operators (`$text`, `$edge`) and indexing modules.
-   Robust, built-in security with RBAC and WebAuthn.
-   A modular architecture for greater flexibility.

## 11. Roadmap and Project Status

GenosDB is currently in a stable beta. Core features are implemented and validated by a comprehensive public test suite. The immediate focus is on hardening the API and optimizing performance for a v1.0 release. Long-term goals include expanding the module ecosystem, conducting third-party security audits, and enhancing enterprise-grade features. For a detailed, up-to-date plan, please refer to our public [ROADMAP.md](https://github.com/estebanrfp/gdb/blob/main/ROADMAP.md).

## 12. Building Trust Through Transparency and Testing

GenosDB prioritizes trust by providing comprehensive public unit tests and documentation, while protecting its core intellectual property.

### 12.1 Public Unit Tests and Validation

-   **Comprehensive Test Suite**: A publicly available test suite covers all core functionalities, with results published via GitHub Actions at [estebanrfp.github.io/gdb/tests/html/test-results.html](https://estebanrfp.github.io/gdb/tests/html/test-results.html).
-   **Transparency in Functionality**: Detailed API references, architecture docs, and examples allow developers to validate GenosDB's capabilities independently.

### 12.2 Intellectual Property Protection and Free Distribution

-   **Proprietary Source Code**: To protect core algorithms and maintain a focused development trajectory, only optimized, minified bundles are distributed.
-   **Free Access Model**: All modules are available at no cost via NPM and CDN, promoting widespread adoption and experimentation.

## 13. Conclusion

GenosDB is a powerful, developer-friendly platform for decentralized applications, combining a flexible graph database, real-time P2P streaming, advanced query capabilities, and robust security. Its modular design and rich ecosystem make it ideal for a wide range of use cases. By offering its functional builds for free while protecting its core IP, GenosDB presents a compelling solution for developers and enterprises building the next generation of the web.

**Get Started**:
-   Repository: [github.com/estebanrfp/gdb](https://github.com/estebanrfp/gdb)
-   Documentation: [/docs](https://github.com/estebanrfp/gdb/blob/main/docs/index.md)
-   Tutorials: [Medium](https://medium.com/genosdb)
-   Community: [GitHub Discussions](https://github.com/estebanrfp/gdb/discussions)

## 14. References

*(Note: Please adjust publication years to their actual values.)*

1.  estebanrfp, “GenosDB: Distributed Graph-Based Database,” Medium, 2024. [Link](https://medium.com/genosdb/genosdb-distributed-graph-based-database-7f03b878507b)
2.  estebanrfp, “Designing a Next-Generation P2P Protocol Architecture,” Medium, 2024. [Link](https://medium.com/genosdb/designing-a-next-generation-p2p-protocol-architecture-for-genosdb-4833c1f6e069)
3.  estebanrfp, “How GenosDB Solved the Distributed Trust Paradox,” Medium, 2024. [Link](https://medium.com/genosdb/how-genosdb-solved-the-distributed-trust-paradox-a-guide-to-p2p-security-a552aa3e3318)
4.  estebanrfp, “GenosDB and the Nostr Network,” Medium, 2024. [Link](https://medium.com/genosdb/genosdb-and-the-nostr-network-powering-the-future-of-decentralized-data-93db03b7c2d7)
5.  estebanrfp, “GenosDB v0.4.0: Oplog-Driven Delta Sync,” Medium, 2024. [Link](https://medium.com/genosdb/genosdb-v0-4-0-introducing-oplog-driven-intelligent-delta-sync-and-full-state-fallback-741fe8ff132c)
6.  GenosDB Public Test Results, GitHub, 2024. [Link](https://estebanrfp.github.io/gdb/tests/html/test-results.html)
7.  GenosDB Documentation, GitHub, 2024. [Link](https://github.com/estebanrfp/gdb/tree/main/docs)