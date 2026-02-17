# GenosDB Copilot Instructions

## Architecture Overview
GenosDB is a decentralized P2P graph database with real-time sync via GenosRTC (WebRTC + Nostr signaling). Core components:
- **gdb/**: Main DB engine with OPFS storage, MessagePack serialization, and CRDT-based conflict resolution.
- **GenosRTC/src/**: P2P communication layer handling rooms, peers, and data channels.
- **gdb-server/**: Node.js server with WebRTC polyfills for server-side P2P.

Data flows: Queries → Engine → Sync deltas via GenosRTC → Peers reconcile via oplog.

For detailed architecture: See docs/genosdb-features.md (features overview), docs/genosrtc-architecture.md (GenosRTC layers), docs/genosdb-worker-architecture.md (persistence worker).

## Key Workflows
- **Build**: `bun esbun.js` (bundles to dist/, gzips files).
- **Dev**: `bun run --watch` (hot reload).
- **Test**: `bash tests/run.sh` (real browser tests via agent-browser with P2P sync verification).
- **Debug P2P**: Use console logs in room.js for peer events.

## Project Conventions
- **Modules**: ES6 imports/exports; no classes, prefer factory functions (e.g., room.js exports a function).
- **Data Structures**: Use Maps for peers/actions (e.g., `peers = new Map()` in room.js).
- **WebRTC Handling**: Polyfill RTCPeerConnection for Node (webrtc-polyfill); chunk large data (16KB chunks in room.js).
- **Serialization**: MessagePack via @msgpack/msgpack; compress with Pako.
- **Nostr Signaling**: List of relays in nostr.js; use for peer discovery/announce.
- **Error Handling**: Custom mkErr in helpers.js; retry logic with SEND_RETRY_LIMIT.
- **Security**: WebAuthn for auth; RBAC/ACLs in SM module.

## Integration Points
- **External Deps**: ethers for crypto, pako for compression.
- **Cross-Component**: GenosRTC integrates via rtc: true in gdb init; sync uses BroadcastChannel locally.
- **Examples**: See examples/ for HTML demos (e.g., chat.html uses joinRoom from GenosRTC).

Reference: gdb/README.md for features; GenosRTC/README.md for API.

## Documentation References
- **API & Guides**: docs/genosdb-api-reference.md (API details), docs/crud-operations-guide.md (CRUD overview), docs/map-guide.md (query language).
- **Modules**: docs/sm-architecture.md (Security Manager), docs/ai-module.md (AI queries), docs/geo-module.md (geo queries), docs/rx-radix-tree.md (indexing).
- **P2P & Sync**: docs/genosrtc-guide.md (GenosRTC usage), docs/genosdb-hybrid-delta-protocol.md (sync protocol), docs/genosdb-distributed-trust-model.md (trust model).
- **Advanced**: docs/genosdb-hybrid-logical-clock.md (HLC for CRDTs), docs/zero-trust-security-model.md (security), docs/genosdb-fallback-server.md (superpeer server).

## Code Style and Programming Philosophy

The primary goal of this project is to generate modern JavaScript (ES2020+) that is **exceptionally compact, high-performance, and highly readable**. Copilot must strictly adhere to the following rules when generating or modifying code.

### 1. Syntax and Paradigms
- **Core Syntax**: Always use arrow functions (`=>`), destructuring, optional chaining (`?.`), nullish coalescing (`??`), `async/await` for asynchronous code, dynamic `import()`, and template literals.
- **Forbidden Patterns**: Avoid `var` (use `const` or `let`), traditional callbacks (prefer Promises and async/await), jQuery, and any deprecated APIs.
- **Paradigms**: Always favor **immutability** (do not modify existing data), **pure functions** (no side effects), and **function composition** over class-based inheritance.

### 2. Naming Conventions
- **Clarity**: Variable and function names must be descriptive, semantic, and in English. For example, `isLoading`, `fetchUserProfile`, `peerConnection`.
- **Avoid**: Cryptic or single-letter names (except for simple iterators like `i` or `e`).

### 3. Compact & Efficient Code
- **Minimal Lines**: Solutions should be concise and direct, with no redundant code.
- **Functional Methods**: Prefer functional array methods (`.map`, `.filter`, `.reduce`) over traditional `for` loops.
- **Early Returns**: Use "early returns" or guard clauses to reduce nesting and improve readability.

### 4. Performance
- **Optimization**: Minimize repeated variable or DOM lookups. Cache values where appropriate.
- **Concurrency**: Use `Promise.allSettled()` or `Promise.all()` to handle multiple promises efficiently.
- **Lazy Loading**: Implement code splitting and lazy load modules with dynamic `import()` to improve initial load times.

### 5. Documentation
- **Language**: All comments, logs, and messages must be in **English**.
- **Format**: Use the **JSDoc** format (`/** ... */`) for all public functions, explaining their purpose, parameters (`@param`), and return values (`@returns`).
- **Quality**: Avoid obvious comments that only repeat what the code does. Comments should explain the *why* (the intent), not the *what*.

### 6. Guiding Principle: The Best Solution
- **Critical Thinking**: When generating code, Copilot must prioritize the most optimal, correct, and secure solution. If a request seems ambiguous or suboptimal, a better alternative that aligns with these principles should be proposed.
- **Priority**: The goal is always to produce the **definitive solution**: the most compact, optimized, readable, and high-performance code that meets the requirements.