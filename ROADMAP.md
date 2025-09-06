# GenosDB Roadmap

[](https://github.com/estebanrfp/gdb)

Welcome to the roadmap for **GenosDB**, a decentralized P2P graph database powering modern Web3 applications, including our 3D metaverse built with Babylon.js. This document outlines our vision and next steps. Share your feedback in [GitHub Discussions](https://github.com/estebanrfp/gdb/discussions)!

## Vision

To empower developers to build secure, real-time decentralized applications—from chats and Kanban boards to immersive 3D metaverses—without relying on centralized servers, with a simple API and a focus on security and performance.

## Current Status (Stable Beta)

As of today, GenosDB is in a stable beta phase, offering a robust set of features for building decentralized applications.

-   **Key Features**:
    -   Graph database with `put`, `get`, `link`, `map`, `remove` operations ([See details](https://medium.com/genosdb/genosdb-distributed-graph-based-database-7f03b878507b)).
    -   Recursive graph traversal with the `$edge` operator for complex queries ([See article](https://medium.com/genosdb/introducing-recursive-graph-traversal-queries-in-genosdb-7a2eff62c5bf)).
    -   GenosRTC: P2P streaming for real-time audio, video, and file transfers.
    -   Advanced Security Module: Featuring Role-Based Access Control (RBAC), WebAuthn biometric authentication, and a solution to the Distributed Trust Paradox ([See RBAC](https://medium.com/genosdb/role-based-access-control-rbac-in-genosdb-bde218a1a0df), [See Trust Paradox](https://medium.com/genosdb/how-genosdb-solved-the-distributed-trust-paradox-a-guide-to-p2p-security-a552aa3e3318)).
    -   Intelligent Delta Synchronization via an oplog, compressed payloads, full-state fallback, and signaling over the Nostr network for maximum efficiency ([See article](https://medium.com/genosdb/genosdb-v0-4-0-introducing-oplog-driven-intelligent-delta-sync-and-full-state-fallback-741fe8ff132c)).
    -   High-performance asynchronous engine capable of handling tens of thousands of writes per second ([See article](https://medium.com/genosdb/genosdbs-new-async-engine-unlocking-unparalleled-performance-and-simplicity-in-a-real-time-c666f1a9a5d2)).
    -   Flagship Use Case: A 3D metaverse built with Babylon.js, using GenosDB for avatar sync, chat, and object management ([OVGrid](https://ovgrid.com)).
-   **Availability**: Free, minified builds are available via NPM and CDN for immediate use ([Repo](https://github.com/estebanrfp/gdb)).
-   **Demos & Tutorials**: A rich collection of practical examples, including real-time chats, to-do lists, and Kanban boards ([See all tutorials](https://medium.com/genosdb)).
-   **Limitations**: The API is stable but may undergo minor changes before v1.0. The source code is private to protect IP, while the builds remain free to use.

## Achievements (Historical Milestones)

Based on our [CHANGELOG.md](https://github.com/estebanrfp/gdb/blob/main/CHANGELOG.md), here are key features and enhancements that have shaped GenosDB's evolution. *(Note: Please adjust dates to reflect reality.)*

-   **v0.9.8 (July 2024)**: Instantaneous P2P network startup with hybrid relay management for faster peer discovery and resilience.
-   **v0.9.7 (June 2024)**: Autonomous Governance Engine for automated enforcement of business logic and data policies.
-   **v0.9.6 (May 2024)**: Secure-by-default user onboarding with instantaneous superadmin recognition.
-   **v0.9.5 (April 2024)**: Streamlined API encapsulation and reduced bundle size for better performance.
-   **v0.8.0 (March 2024)**: Achieved unprecedented write performance, handling tens of thousands of operations per second.
-   **v0.7.0 (February 2024)**: Migration to an async factory function (`await gdb()`) for robust initialization and extensibility.
-   **v0.6.0 (January 2024)**: New channel-based communication architecture for reliable real-time data exchange.
-   **v0.5.0 (December 2023)**: Introduced recursive graph traversal queries with the powerful `$edge` operator.
-   **v0.4.0 (November 2023)**: Launched the intelligent delta synchronization engine with oplog and full-state fallback.
-   **v0.3.0 (October 2023)**: Improved internal write operations with upsert logic for better data handling.
-   **v0.2.0 (August 2023)**: Core graph operations and foundational API established.
-   **v0.0.31 (June 2023)**: Introduction of `put()` method and link functionality for node relationships.

These milestones demonstrate steady progress in performance, security, and usability. See [CHANGELOG.md](https://github.com/estebanrfp/gdb/blob/main/CHANGELOG.md) for full details.

## Roadmap

This roadmap outlines our planned features and goals. It is a living document and will be updated based on project progress and community feedback.

### Short Term (Q4 2024)

-   `[ ]` Launch a public, interactive demo of the 3D metaverse built with Babylon.js and GenosDB.
-   `[ ]` Publish a detailed technical article on the metaverse architecture.
-   `[ ]` Further optimize GenosRTC for mobile browsers (iOS/Android) based on community testing and feedback.

### Mid Term (Q1-Q2 2025)

-   `[ ]` Release **GenosDB v1.0**, featuring a stable, production-ready API governed by Semantic Versioning.
-   `[ ]` Expand the documentation with advanced guides and more complex real-world examples.
-   `[ ]` Grow the community through active engagement in GitHub Discussions and other platforms.

### Long Term (2025+)

-   `[ ]` Explore monetization models, such as premium support or dedicated consulting for enterprise metaverse and P2P applications.
-   `[ ]` Conduct external, third-party security audits to further harden the system for enterprise adoption.
-   `[ ]` Research and develop dedicated fallback/cache nodes to enhance network stability and performance in very large P2P clusters.

## How to Contribute

Although the core source code is proprietary, your contributions are vital to the ecosystem's growth:

-   **Test and Report**: Use the minified builds in your projects and report any bugs or issues in [GitHub Issues](https://github.com/estebanrfp/gdb/issues).
-   **Create Demos and Examples**: Build applications, demos, or tutorials on platforms like JSFiddle, CodePen, or your own blog. Share them with the community! ([See Contribution Guidelines](https://github.com/estebanrfp/gdb/blob/main/CONTRIBUTING.md)).
-   **Share Feedback**: Your ideas and feedback are crucial. Join the conversation in [GitHub Discussions](https://github.com/estebanrfp/gdb/discussions).
-   **Write About GenosDB**: If you've built something cool or have insights to share, write an article on Medium or Dev.to.

## Contact

-   Got ideas or want to collaborate? Reach out via [estebanrfp@gmail.com](mailto:estebanrfp@gmail.com) or start a conversation in [Discussions](https://github.com/estebanrfp/gdb/discussions).
-   Follow project updates on [Medium](https://medium.com/genosdb) and [GenosDB.com](https://genosdb.com).

## Notes

-   This roadmap will be updated quarterly to reflect our progress and shifting priorities.
-   Thank you for your interest and support in GenosDB