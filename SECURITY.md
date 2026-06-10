# Security Policy

## Introduction

Security is our priority. This document explains how we handle security issues.

## Security Model

GenosDB is **zero-trust and serverless**: every operation is cryptographically signed by its author and verified by every peer — there is no central authority to trust. Access is governed by layered, peer-enforced mechanisms:

- **RBAC** — a hierarchy of roles (`guest` → `user` → `manager` → `admin` → `superadmin`). A brand-new identity is a write-blocked `guest` until a superadmin signs a promotion.
- **Node-level ACLs** — per-node `read` / `write` / `delete` grants. Since 0.14.0 these are enforced **against malicious peers**: the verified author of every incoming operation is checked against the node's owner and collaborators, so a modified peer cannot write a node it does not own.
- **Governance** — a superadmin declares advancement rules up front; the engine resolves each user's role by **last-match-wins** (promotion and automatic demotion), signing every change for peers to verify.

Full details: [zero-trust security model](docs/zero-trust-security-model.md) · [SM architecture](docs/sm-architecture.md) · [ACLs](docs/sm-acls-module.md) · [Governance](docs/governance.md).

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