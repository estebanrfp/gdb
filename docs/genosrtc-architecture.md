# GenosDB's GenosRTC Module Architecture Overview

## Introduction

**GenosRTC** is the integrated peer-to-peer (P2P) communication module within the GenosDB (`GDB`) ecosystem. It is designed to provide developers with a high-level, robust, and decentralized framework for building real-time applications directly in the browser. By abstracting the complexities of WebRTC and leveraging a resilient, community-maintained signaling network, GenosRTC enables seamless data, audio, and video streaming between peers.

The core architectural goal of GenosRTC is to deliver a "serverless" communication model where peers connect directly to one another, minimizing latency, enhancing privacy, and eliminating the need for centralized data-handling servers.

---

## Core Architectural Principles

The design of GenosRTC is guided by several key principles:

1.  **Decentralization First**: The architecture prioritizes decentralized patterns. While helper services (signaling relays) are used for peer discovery, the actual data and media exchange occurs directly between peers, ensuring no central point of failure or data bottleneck.
2.  **Simplicity through Abstraction**: GenosRTC exposes a clean, event-driven API (`db.room`) that hides the intricate low-level details of WebRTC, such as ICE negotiation, session description protocols (SDP), and connection state management. This allows developers to focus on application logic rather than P2P plumbing.
3.  **Room-Based Scoping**: All P2P interactions are scoped within a logical "room." This concept provides a natural container for managing a group of connected peers, simplifying session management, broadcasting, and peer lifecycle events. Architecturally, the room ID (which corresponds to the GDB database name) acts as a shared topic for discovery.
4.  **Secure by Design**: Communication is designed to be private and secure, with built-in support for end-to-end encryption for both signaling messages and data channel communications.
5.  **Community-Driven Infrastructure**: The module's health and decentralization are enhanced by relying on a publicly maintained list of signaling relays. This allows the global developer community to contribute to the network's resilience by suggesting and vetting relays, ensuring the network remains robust and distributed over time.

---

## Architectural Components

GenosRTC is composed of several distinct logical layers that work together to establish and maintain P2P connections.

### 1. Signaling Layer (Peer Discovery)

Unlike traditional WebRTC implementations that rely on a custom, centralized WebSocket server for signaling, **GenosRTC utilizes the decentralized Nostr (Notes and Other Stuff from Transmitted Relays) network**. This layer is architected with a simple, resilient strategy for selecting relays, ensuring instant startup and maximum flexibility.

-   **Function**: The signaling layer is responsible for the "handshake" process where peers discover each other and exchange the necessary metadata (like network addresses and media capabilities) to establish a direct connection.
-   **Relay Selection Mechanism**: GenosRTC employs a non-blocking strategy: it connects to every configured relay in parallel and treats each one independently.

    1.  **Developer-Provided or Built-in Relays (Instant Connection)**: The initial connection is always immediate.
        -   **Developer Control (Highest Priority)**: Developers can pass a `relayUrls` array during GDB initialization (e.g., `gdb('dbName', { rtc: { relayUrls: [...] } })`). GenosRTC will use this custom set of relays. This is ideal for private networks or applications that rely on a curated list of high-performance relays.
        -   **Default Behavior**: If no custom list is provided, GenosRTC immediately connects to a built-in list of curated relays, each one empirically verified to relay the ephemeral events GenosRTC uses for signaling. This strategy eliminates any network latency for fetching remote lists, guaranteeing the fastest possible application startup.

    2.  **Independent, Non-Blocking Connections**: Every relay connection is established independently — subscription and announcements begin on each relay the moment it connects. A slow or unreachable relay cannot delay or block discovery on the healthy ones, so peers find each other at the speed of the fastest relay.

-   **Key Advantages**: This approach provides several architectural benefits:
    -   **Instant Startup & Resilience**: By connecting to the entire relay list in parallel and treating every relay independently, the system offers an immediate user experience with no single point of failure, and is inherently more resilient to network disruptions or censorship.
    -   **Zero Infrastructure Overhead**: Developers are freed from the complexity and cost of deploying, scaling, and maintaining their own signaling servers, yet they retain the option to use them if needed.
    -   **Adaptive Network Intelligence**: The architecture is not passive; it actively manages its connections to the Nostr network. It can identify non-performant or restrictive relays—for example, those requiring Proof-of-Work (PoW)—and dynamically adapt. Upon detecting a PoW requirement or other connection-blocking issue, the system automatically disconnects from that specific relay and excludes it from future use during the session. This self-healing behavior ensures that resources are focused on healthy signaling paths, dramatically increasing the reliability and speed of peer discovery.

### 2. P2P Transport Layer (WebRTC)

This layer is the core of the P2P connection, powered by the browser's native WebRTC capabilities.

-   **Function**: It manages the establishment and maintenance of direct, low-latency `RTCPeerConnection`s between peers.
-   **Mechanism**: It leverages the standard WebRTC ICE (Interactive Connectivity Establishment) framework, using STUN and TURN protocols (if configured) to traverse NATs and firewalls, ensuring that a direct connection is possible in the majority of network environments. All data and media transported over this layer are encrypted by default (using DTLS-SRTP).

### 3. Session Management (The Room)

The `db.room` object serves as the primary interface for session management.

-   **Function**: It orchestrates the entire lifecycle of a P2P session. This includes managing the set of connected peers, handling new arrivals, and cleaning up after departures.
-   **Mechanism**: The room maintains a state of all active peer connections, forming a mesh network where each peer is connected to every other peer in the room. It emits lifecycle events (`peer:join`, `peer:leave`) that allow the application to react to changes in the room's participant list.

### 4. Communication Abstractions

Once a P2P connection is established, GenosRTC provides two distinct, high-level channels for communication, each optimized for a different type of data.

#### a. Data Channels (`db.room.channel`)

-   **Architecture**: Built on top of WebRTC's `RTCDataChannel` API, this abstraction is designed for sending arbitrary, structured data. It provides a reliable and ordered messaging system.
-   **Use Cases**: Ideal for chat messages, game state synchronization, real-time collaboration events (e.g., cursor positions, text edits), file transfer metadata, and any other form of application-specific data. Developers can create multiple named channels to logically separate different types of data streams (e.g., a "chat" channel and a "game-actions" channel).

#### b. Media Streams (`db.room.addStream`)

-   **Architecture**: This abstraction leverages WebRTC's `MediaStream` capabilities, which are highly optimized for real-time audio and video. It handles the negotiation of codecs and the efficient transport of media packets.
-   **Use Cases**: Designed specifically for applications like video conferencing, voice chat, live broadcasting, and screen sharing. The API simplifies the process of capturing media from a user's device (`getUserMedia`) and broadcasting it to all other peers in the room.

---

## Lifecycle of a Peer Connection

From an architectural perspective, the typical flow for a peer is as follows:

1.  **Initialization**: A client instantiates `GDB` with `rtc: true`, joining a specific room and optionally providing a custom list of relays.
2.  **Discovery**: The client instantly connects to the Nostr network using its relays (user-provided or built-in) and subscribes to the room's topic on each relay as soon as it opens.
3.  **Signaling Handshake**: The client securely exchanges connection offers, answers, and network candidates with other peers via the established Nostr relay connections.
4.  **Direct Connection**: A direct `RTCPeerConnection` is established with each peer. The signaling relay is no longer needed for communication between these two peers.
5.  **Communication**: The application uses the high-level Data Channel and Media Stream APIs to send and receive information directly with other peers.
6.  **Disconnection**: When a user leaves the room (e.g., closes the tab or calls `db.room.leave()`), the connections are torn down, and a `peer:leave` event is broadcast to the remaining peers.

## Cellular Mesh Architecture (Scalability Layer)

### The Scalability Problem

The traditional mesh topology described above connects every peer to every other peer. While this provides optimal latency (single-hop), it creates O(N²) connections. For 100 peers, this means ~10,000 connections—quickly becoming impractical for large-scale applications.

### Solution: Cellular Overlay

When enabled via `rtc: { cells: true }`, GenosRTC introduces a **Cellular Mesh Overlay** that organizes peers into logical "cells":

```
┌─────────────────────────────────────────────────────────────┐
│                     Cellular Mesh Network                    │
│                                                              │
│   ┌─────────┐         ┌─────────┐         ┌─────────┐       │
│   │ Cell A  │◄───────►│ Cell B  │◄───────►│ Cell C  │       │
│   │ ○ ○ ○   │ bridges │ ○ ○ ○   │ bridges │ ○ ○ ○   │       │
│   │  ○ ○    │         │  ○ ○    │         │  ○ ○    │       │
│   └─────────┘         └─────────┘         └─────────┘       │
│        ▲                                       ▲            │
│        └───────────────────────────────────────┘            │
│                    inter-cell bridges                       │
└─────────────────────────────────────────────────────────────┘
```

### Architectural Components

-   **Cells**: Logical groups of peers (10 by default in auto mode, up to `maxCellSize`) with full mesh connectivity within the cell. Small rooms stay a single direct mesh; the first split happens past 10 peers.
-   **Bridge Nodes**: Peers deterministically elected to maintain connections between neighboring cells — adjacent cells plus power-of-two skip links, giving the topology an O(log C) diameter. Multiple bridges per edge (configurable via `bridgesPerEdge`) provide redundancy, and the election always includes the best candidate from each side of an edge, guaranteeing egress in both directions.
-   **Dynamic TTL**: Message hop limit derived from the topology (`2 × log₂(cells + 1) + 3`, capped at 150), preventing infinite propagation while ensuring delivery.
-   **Rendezvous (HRW) Hashing**: Each peer maps to the cell with the highest `hash(peerId:cell)` score, so membership stays stable as peers join and leave, and a cell-count change relocates only a minimal fraction of peers.

### Message Propagation

1.  **Intra-cell**: Messages within a cell are delivered directly (single hop) via the local mesh.
2.  **Inter-cell**: Messages destined for other cells are forwarded through bridge nodes, hopping across cells until reaching the destination.
3.  **Broadcast**: Global broadcasts propagate through bridges with TTL decrementation and seen-message deduplication.

### Scalability Trade-offs

| Aspect | Traditional Mesh | Cellular Mesh |
|--------|------------------|---------------|
| Connections/peer | O(N) | O(cellSize) |
| Message latency | 1 hop | ~log(N) hops |
| Max practical peers | ~100 | Massive scale |
| Complexity | Simple | Higher |
| Use case | Small rooms | Large-scale apps |

### When to Use

-   **Traditional Mesh (`rtc: true`)**: Best for applications with < 100 concurrent peers where single-hop latency is critical.
-   **Cellular Mesh (`rtc: { cells: true }`)**: Recommended for applications expecting 100+ peers, or where horizontal scalability is a requirement.

---

## Security Model

Security is a fundamental component of the GenosRTC architecture.

-   **Transport Encryption**: All WebRTC communications (both data and media) are mandatorily encrypted using DTLS (Datagram Transport Layer Security) and SRTP (Secure Real-time Transport Protocol). This prevents eavesdropping on the P2P link.
-   **Signaling Encryption**: By providing an optional `password` during initialization, all signaling data exchanged over Nostr relays (connection offers, answers and candidates) is end-to-end encrypted with that shared secret — the relays never see connection metadata in plaintext, and only peers holding the password can complete a handshake into the room.
-   **Cellular Mesh Security**: In cellular mode, every inter-cell hop is a direct DTLS-encrypted peer link. Bridge peers — regular, password-authenticated members of the same room — relay messages between cells as part of normal forwarding, handling payloads exactly like any other room member; applications that require payload confidentiality across forwarding peers can encrypt at the application layer before sending.