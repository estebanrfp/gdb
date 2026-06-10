## **GenosDB: Comprehensive Feature List**

### **1. Core System & Architecture**

*   **Modular Design:** The database is initialized with a lean core, allowing features to be enabled on-demand through modules to optimize performance and bundle size.
    *   `rtc`: Enables the GenosRTC module for all P2P synchronization and real-time communication.
    *   `sm`: Activates the Security Manager for identity, RBAC, and encryption.
    *   `ai`: Loads the AI module.
    *   `nlq`: Loads the Natural Language for Queries module.
    *   `rx`: Loads the Radix Index module.
    *   `ii`: Loads the Inverted Index module for efficient value-based searches.
    *   `geo`: Loads the Geo-spatial module.

*   **Storage and Persistence:**
    *   **Primary Storage Engine:** Utilizes **OPFS (Origin Private File System)** for high-performance, sandboxed, and persistent local storage directly in the browser.
    *   **Offline-First Capability:** The system is designed to work seamlessly offline. All changes are saved locally and automatically synchronized with peers upon reconnection.
    *   **Debounced Disk I/O:** Features a configurable `saveDelay` to batch write operations, reducing disk I/O under heavy loads and improving performance.

*   **Data Structure:**
    *   **Graph-Oriented Database:** A true graph database where data is stored in nodes, allowing for rich, interconnected data models.
    *   **Node Structure:** Each node consists of a unique `id` (custom or auto-generated hash), a JSON-serializable `value`, a list of outgoing `edges`, and a Hybrid Logical Clock (HLC) `timestamp` for conflict resolution.

*   **Advanced Internal Mechanisms:**
    *   **Web Worker Integration:** All intensive I/O operations, including storage access, serialization, and compression, are offloaded to a dedicated Web Worker. This ensures the main UI thread remains non-blocking and responsive.
    *   **Cross-Tab Communication:** Implements a `BroadcastChannel` to synchronize state and operations across multiple browser tabs from the same origin, preventing race conditions and ensuring data consistency.

### **2. Core API & Querying**

*   **Main Functionalities (CRUD & Graph Operations):**
    *   `put(value, id?)`: Creates or updates a node in the graph.
    *   `get(id, callback?)`: Retrieves a single node by its ID. Can enter a **reactive mode** by providing a callback, which will be invoked with any subsequent changes to that specific node.
    *   `remove(id)`: Deletes a node and removes all references (edges) to it from other nodes.
    *   `link(sourceId, targetId)`: Creates a directed relationship (edge) from a source node to a target node.
    *   `clear()`: Atomically removes all nodes and indexes from the database.

*   **Advanced Querying (`map`):**
    *   **Real-time & Static Queries:** The `map` function is a versatile query interface that can be used for both one-time data retrieval and real-time subscriptions.
    *   **MongoDB-Style Filtering:** Supports a rich query syntax with logical operators (`$or`, `$and`, etc.) and comparison operators (`$gt`, `$in`, etc.) for complex data filtering.
    *   **Recursive Graph Traversal:** Features the powerful **`$edge` operator**, which transforms a query into a graph traversal. It finds a set of starting nodes and then explores their entire descendant tree, returning a flat list of all descendants that match a nested sub-query.
    *   **Sorting & Pagination:** Provides full control over result sets with sorting (`field`, `order`) and efficient pagination (`$limit`, `$after`, `$before`).
    *   **Real-time Event Subscription:** When a callback is provided, `map` streams live updates for any changes matching the query, with event actions: `'initial'`, `'added'`, `'updated'`, and `'removed'`.

### **3. P2P Real-Time Communication (GenosRTC Module)**

*   **Real-time Database Synchronization:**
    *   **P2P Sync Engine:** Powered by the internal **GenosRTC** module, enabling automatic, real-time, delta-based synchronization of all graph operations between connected peers.
    *   **Cellular Mesh Scalability:** Optional cellular network topology that organizes peers into cells with bridge nodes, enabling horizontal scaling to large-scale networks while maintaining efficient message propagation.
    *   **Efficient Resynchronization:** Uses a configurable operation log (`oplogSize`) to allow peers to efficiently "catch up" after being disconnected, transmitting only the missed operations.
    *   **Robust Connectivity:** Supports custom **Nostr relays** (`relayUrls`) for peer discovery and **TURN servers** (`turnConfig`) to traverse restrictive NATs and firewalls.
    *   **Optional Encryption:** The P2P signaling and communication layer can be encrypted by providing a `password` during initialization.

*   **Direct P2P Communication API (`db.room`):**
    *   **Peer Lifecycle Management:** Provides events (`peer:join`, `peer:leave`) to track when peers connect and disconnect from the room.
    *   **Data Channels:** Allows creation of named channels (`db.room.channel(name)`) to send arbitrary JSON-serializable data directly between peers for features like chat, real-time cursors, or game state updates.
    *   **Audio/Video Streaming:** Natively supports broadcasting `MediaStream` objects (`db.room.addStream`) for building real-time voice and video conferencing applications.
    *   **File Streaming:** Facilitates direct peer-to-peer file transfers through data channels (requires user-implemented chunking for large files).

*   **Middleware System:**
    *   **P2P Message Interception:** Register custom asynchronous middleware functions via `db.use()` to process, validate, transform, or even block incoming P2P operations before they are applied to the local database, enabling advanced validation and security rules.

### **4. Security Manager (SM) Module & RBAC**

*   **Identity & Authentication:**
    *   **WebAuthn Integration:** Replaces traditional passwords with a secure, modern standard. Users can authenticate using biometrics (fingerprints, facial recognition) or physical security keys. Supports **silent session resume** for a seamless user experience on page reloads.
    *   **Mnemonic Phrase Support:** Implements BIP39 mnemonic phrases for deterministic key generation, allowing for user-friendly account creation and recovery.
    *   **Cryptographic Signatures:** User identities are based on Ethereum-style key pairs. All permissioned operations sent over the P2P network are cryptographically signed by the user and verified by peers.

*   **Role-Based Access Control (RBAC):**
    *   **Customizable Role System:** The entire role hierarchy and permission set can be fully customized during database initialization.
    *   **Default Role Hierarchy:** Provides a pre-defined, inheritable role structure for rapid development: `superadmin` > `admin` > `manager` > `user` > `guest`.
    *   **Granular Permissions:** A comprehensive set of default permissions including `read`, `write`, `link`, `publish`, `delete`, `deleteAny`, and `assignRole`.
    *   **Role Management:** The `assignRole` function allows authorized users to assign roles to other peers. Role assignments are stored securely within the graph and can be set with an optional **expiration date**.
    *   **Permission Guarding:** The `executeWithPermission` method provides a robust way to check if the current user has the required permissions before executing a protected client-side action.

*   **Access Control Lists (ACLs):**
    *   **Node-level permissions:** Beyond global roles, node owners grant/revoke per-node `read`/`write`/`delete` access to specific users via `db.sm.acls.set` / `grant` / `revoke`. Since **0.14.0** these are enforced against **malicious peers** — the cryptographically-verified author is checked on every incoming operation, so a modified peer cannot write a node it does not own.

*   **Governance (Role Promotion & Demotion):**
    *   **Rule-based, signed:** A superadmin declares advancement rules as native GenosDB queries; while online, the engine resolves each user's role by **last-match-wins** — a merit ladder where climbing overrides the lower tiers and losing the condition auto-demotes — signing every change for peers to verify.

*   **Encrypted Data Storage:**
    *   **User-Scoped Encryption:** Offers `db.sm.put()` and `db.sm.get()` methods to store and retrieve data that is automatically end-to-end encrypted. Only the user who created the data can decrypt it, providing a mechanism for private, secure notes or user-specific data.

### **5. Technical Implementation & Performance**

*   **Data Handling & Serialization:**
    *   **MessagePack:** Uses MessagePack for fast and compact binary serialization, reducing data size compared to JSON.
    *   **Pako Compression:** Further compresses the MessagePack output using the Pako (zlib) library to minimize both storage footprint and network payload size.
    *   **ID Generation:** Generates unique, content-addressable **SHA-256 hashes** for node IDs when one is not explicitly provided, ensuring data integrity.

*   **Synchronization & Consistency:**
    *   **Conflict Resolution:** Implements a **Hybrid Logical Clock (HLC)** system to assign a unique, partially-ordered timestamp to every operation. This allows for automatic, deterministic conflict resolution using a "last-write-wins" strategy, ensuring eventual consistency across all peers.
    *   **Real-time Change Propagation:** Utilizes an event-driven architecture with custom event listeners to propagate changes in real-time to both the local application and remote peers.

*   **Development & Code Quality:**
    *   **Modular Architecture:** The codebase is structured with a clear separation of concerns, making it extensible and maintainable.
    *   **Error Handling:** Implements comprehensive error checking and robust exception handling to ensure stability.
    *   **Backward Compatibility:** Aims to maintain backward compatibility where possible, with breaking changes documented in the changelog.