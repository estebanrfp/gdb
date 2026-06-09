# 🏛️ Governance (Role Promotion)

> **Status: Preview / in active development.** This document describes the **purpose** and the **mechanism** of GenosDB Governance. The technical API and configuration are intentionally left out for now: the module and its reference example are being developed together, and the setup details will be documented once the design is finalized.

## What is Governance?

Governance is the layer of the Security Manager that decides **how a `guest` earns a higher role** in a GenosDB network — turning the zero-trust idea of "promotion" into a structured, rule-driven process.

It answers a question that the [Zero-Trust Security Model](zero-trust-security-model.md) raises but does not, by itself, solve operationally: *in a serverless, peer-to-peer network where every newcomer starts as a read-only `guest`, who decides when and how that user becomes a writer — and how does the whole network trust that decision?*

## The problem it solves

In GenosDB's [zero-trust model](zero-trust-security-model.md):

- A brand-new identity is a **`guest`**: it can `read` and `sync`, plus a single "welcome" write to create its own user node. It **cannot write application data**.
- To do more, the guest must be **promoted** to a role such as `user`.
- Only a **`superadmin`** holds the `assignRole` permission, and every operation is **cryptographically signed** — so a promotion is valid only when a superadmin signs it. There is no central server to delegate this to.

Manually promoting every newcomer does not scale, and hard-coding "everyone can write" throws the security away. Governance is the middle path: the superadmin **declares the rules of advancement up front**, and the network applies them consistently.

## How it works (conceptually)

1. **The superadmin declares the objectives.** A superadmin defines clear, public *rules* — the conditions a guest must satisfy to earn a given role (for example: *"a guest who has set up a profile and stayed active for a period becomes a `user`"*). These objectives are explicit and identical for everyone.
2. **The guest works within its limits.** Using only what a `guest` is allowed to do (read, sync, create its own user node), the newcomer fulfills the declared objectives.
3. **A present superadmin grants the promotion.** When the objectives are met **and a superadmin is online**, the superadmin's authority promotes the user — `guest → user` (or higher) — by signing the role change. Because the signature comes from a superadmin's key, every honest peer accepts the new role; nobody else could have minted it.
4. **Superadmins are immune.** The root of trust can never be downgraded by a rule: governance never modifies a superadmin's own role.

## Why promotion requires a present superadmin

The authority to promote lives in the **superadmin's private key** — not in a rule, and not in a server. So the governance evaluation runs **on a superadmin's node**: promotions can only be created while a superadmin is online to sign them. This is deliberate and central to the [Distributed Trust Model](genosdb-distributed-trust-model.md):

> Rules describe **intent**. Only a verifiable superadmin **signature** grants a role.

A lagging peer might briefly not recognize a freshly promoted user, but once the signed promotion propagates, every node accepts it — security is prioritized over instant availability.

## Where it fits

- It builds directly on the **[Zero-Trust Security Model](zero-trust-security-model.md)** (guest → superadmin) and the **[Distributed Trust Model](genosdb-distributed-trust-model.md)** (signed, serverless authority).
- It uses the Security Manager's **RBAC roles and role assignment** (see [SM Architecture](sm-architecture.md)).
- It is **complementary to [ACLs](sm-acls-module.md)**: ACLs gate *per-node* access (who may read or write a specific node); Governance gates *role promotion* (whether a user may act at all, and at what level). One controls individual documents; the other controls how a user advances through the trust hierarchy.

## Roadmap

Governance is being built alongside its reference example so the mechanism can be validated end-to-end before its configuration is frozen. Once finalized, this page will be expanded with the full setup — how to declare rules, the available options, and a working example. Until then, treat the above as the **design contract**:

> **Declared objectives → fulfilled by a guest → promoted by a present, signing superadmin.**
