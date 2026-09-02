# Security Policy

## Introduction

Security is our priority. This document explains how we handle security issues.

## Security Model

GenosDB is **zero-trust and serverless**: every operation is cryptographically signed by its author and verified by every peer — there is no central authority to trust. Access is governed by layered, peer-enforced mechanisms:

- **RBAC** — a hierarchy of roles (`guest` → `user` → `manager` → `admin` → `superadmin`). A brand-new identity is a write-blocked `guest` until a superadmin signs a promotion.
- **Node-level ACLs** — per-node `read` / `write` / `delete` grants, enforced **against malicious peers**: the verified author of every write is checked against the node's owner and collaborators, on every path a write can arrive by — live operations and state reconciliation alike. A modified peer cannot write a node it does not own.
- **Governance** — a superadmin declares advancement rules up front; the engine resolves each user's role by **last-match-wins** (promotion and automatic demotion), signing every change for peers to verify — from a browser session, or 24/7 via the always-on [Fallback Server](docs/genosdb-fallback-server.md).
- **Confidentiality** — every peer in a room replicates the full graph; what protects a record is encryption (`db.sm.put`), not who receives it. Selective replication cannot be a control in a serverless network: a modified peer can always re-forward what it already holds.

Full details: [zero-trust security model](docs/zero-trust-security-model.md) · [SM architecture](docs/sm-architecture.md) · [ACLs](docs/sm-acls-module.md) · [Governance](docs/governance.md).

## Threat model

Any peer may run modified code, and the network — relays, superpeers, other peers — is hostile. A peer decides on its own copy only; every other peer verifies what it receives and applies nothing it cannot verify. Out of scope: a stolen mnemonic or an unlocked device — that is the identity itself.

## Verified guarantees

Each guarantee is pinned by a conformance test run against the built engine, in real browsers over real WebRTC. Status as of 0.33.3.

| guarantee | status |
|---|---|
| Every operation is signed by its author and verified by every peer — live, delta and full state alike. What is not signed does not travel. | ✓ |
| A new identity is a write-blocked `guest` until a superadmin signs a promotion. Only a superadmin sets a role, on every path. | ✓ |
| A promotion reaches a peer that was away through any relay, receipt intact. | ✓ |
| Node ACLs hold against a modified peer, on live operations and on state reconciliation. | ✓ |
| Read access to encrypted records is cryptographic: `grant` wraps a key, `revoke` rotates it. | ✓ |
| Governance promotes only with a superadmin's signature, from a browser or 24/7 from the Fallback Server. | ✓ |
| An expired role is a guest on every peer. | ✓ |
| The Fallback Server relays proofs, never authority: it verifies incoming operations and refuses roles it cannot verify against its constitution. | ✓ |
| A passkey protects the private key with a secret only the authenticator yields; nothing on disk decrypts it. | ✓ |
| An id that begins with its owner's address (`0x…:`) is created and written only by that owner and its collaborators, on every peer — the engine names owned nodes that way when it generates the id. Under any other id, a node the receiver has never seen belongs to whoever creates it first. | ✓ |
| Edges travel as the set their last `link`/`unlink` signed; on catch-up a peer takes a set only from an author allowed to link on that node, and only if it is newer than the one it holds. A forged, stale or unsigned set is refused; a removal rewrites no other node's set. | ✓ |

## Supported Versions

We provide security updates for all versions of our project:

| Version | Supported          |
| ------- | ------------------ |
| All     | :white_check_mark: |

## Reporting a Vulnerability

If you find a vulnerability, report it so we can fix it quickly.

### What to Include

- Description of the issue  
- Steps to reproduce  
- Potential impact  
- Suggested fixes (if any)  

### Response Time

We’ll confirm your report within 48 hours and aim to respond within a week.

### Disclosure Policy

Do not publicly disclose the issue until we’ve fixed it.

## Security Practices

We follow these security practices to ensure the safety and reliability of our project:

- **Code Reviews:** All code changes are reviewed by the team to prevent vulnerabilities.
- **Automated Testing:** We use automated tests to detect potential security issues early.
- **Dependency Management:** We regularly update dependencies to address known vulnerabilities.
- **Secure Coding Standards:** We adhere to secure coding guidelines to minimize risks.
- **User Input Validation:** All user inputs are validated to prevent common attacks like injection.
- **Least Privilege Principle:** Access to sensitive resources is restricted to only what is necessary.