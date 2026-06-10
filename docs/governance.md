# 🏛️ Governance (Role Promotion)

> **Status: Beta.** The mechanism described here is implemented and validated end-to-end. Details may still be refined before the stable release — check the [CHANGELOG](https://github.com/estebanrfp/gdb/blob/main/CHANGELOG.md).

## What is Governance?

Governance is the layer of the Security Manager that decides **how a `guest` earns a higher role** in a GenosDB network — turning the zero-trust idea of "promotion" into a structured, rule-driven process.

It answers a question that the [Zero-Trust Security Model](zero-trust-security-model.md) raises but does not, by itself, solve operationally: *in a serverless, peer-to-peer network where every newcomer starts as a read-only `guest`, who decides when and how that user becomes a writer — and how does the whole network trust that decision?*

## The problem it solves

In GenosDB's [zero-trust model](zero-trust-security-model.md):

- A brand-new identity is a **`guest`**: it can `read` and `sync`, plus a single "welcome" write to create its own user node. It **cannot write application data**.
- To do more, the guest must be **promoted** to a role such as `user`.
- Only a **`superadmin`** holds the `assignRole` permission, and every operation is **cryptographically signed** — so a promotion is valid only when a superadmin signs it. There is no central server to delegate this to.

Manually promoting every newcomer does not scale, and hard-coding "everyone can write" throws the security away. Governance is the middle path: the superadmin **declares the rules of advancement up front**, and the engine applies them consistently — signing each promotion with the superadmin's key.

## How it works

1. **The superadmin declares the objectives** as rules in the app configuration — explicit, public, and identical for everyone.
2. **The guest works within its limits.** Using only what its role allows, the newcomer fulfills the declared objectives (time, activity, merit points…).
3. **A present superadmin grants the promotion.** While a superadmin is online, the governance engine evaluates the rules on their node and signs each role change. Because the signature comes from a superadmin's key, every honest peer accepts the new role.
4. **Superadmins are immune.** Governance never modifies a superadmin's own role.

> Rules describe **intent**. Only a verifiable superadmin **signature** grants a role.

## Enabling Governance

Governance is part of the Security Manager: pass `governanceRules` alongside `superAdmins` when initializing the database. No additional setup is required — the engine activates automatically when a superadmin logs in on that device, and pauses when they log out. Other peers never run the engine.

```javascript
import { gdb } from "genosdb"

const db = await gdb("my-app", {
  rtc: true, // Required for the SM module
  sm: {
    superAdmins: ["0xYourSuperAdminAddress..."],
    governanceRules: [
      // Onboarding: a guest becomes user after 5 seconds
      { if: { role: "guest" }, offsetTimestamp: 5000, then: { assignRole: "user" } },
      // Merit ladder — last-match-wins: the LAST matching rule sets the role, so climbing
      // overrides the floor and losing points auto-demotes (no explicit demotion rule needed).
      { if: { role: { $in: ["user", "manager"] } },                     then: { assignRole: "user" } },    // floor
      { if: { role: { $in: ["user", "manager"] }, points: { $gte: 1 } }, then: { assignRole: "manager" } }, // climb
    ],
  },
})
```

## Anatomy of a rule

| Field             | Required | Meaning                                                                                                                  |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `if`              | yes      | A standard GenosDB query (the same language used by `db.map`) evaluated against `user:<address>` nodes.                   |
| `then.assignRole` | yes      | The role to assign when the condition matches. Must be one of the defined roles.                                          |
| `then.expiresIn`  | no       | Makes the granted role **temporary**: a duration in milliseconds measured from the moment of promotion. See [Temporary roles](#temporary-roles-expiring-promotions). |
| `then.expiresAt`  | no       | Like `expiresIn`, but an **absolute** expiry — an ISO string, a `Date`, or epoch milliseconds. Takes precedence over `expiresIn` if both are present. |
| `then.expiresTo`  | no       | The role to **auto-revert to** when the temporary role expires (opt-in). While a superadmin is online the engine rewrites the stale label to this role; without it the expired label is left in place. |
| `offsetTimestamp` | no       | Minimum time in milliseconds since the user node's last write. The rule only fires once the node has been stable that long. |

## Conditions are GenosDB queries

The `if` block is passed verbatim to the query engine, so **every operator available in `db.map` works in a rule** — comparison (`$eq`, `$gt`, `$gte`, `$lt`, `$lte`, `$between`, `$in`, `$exists`), text (`$like`, `$regex`, `$text`) and logical (`$and`, `$or`, `$not`) operators, in any combination:

```javascript
// Reputation range
{ if: { role: "user", reputation: { $between: [50, 100] } }, then: { assignRole: "manager" } }

// Corporate e-mail whitelist
{ if: { role: "guest", email: { $regex: "@company\\.com$" } }, then: { assignRole: "user" } }

// Nested logic: points OR invitation
{ if: { $and: [ { role: "user" },
        { $or: [ { points: { $gte: 50 } }, { invitedBy: { $exists: true } } ] } ] },
  then: { assignRole: "manager" } }
```

Operators contributed by optional modules (for example the [geo module](geo-module.md)'s `$near` / `$bbox`) also work when the module is enabled.

## Temporary roles (expiring promotions)

By default a promotion is permanent. Add `expiresIn` (relative) or `expiresAt` (absolute) to a rule's `then` to grant a role that **expires on its own** — useful for time-boxed moderators, trial accesses, temporary sanctions or event-only roles.

```javascript
// Trial moderator: promote on 10 reports, valid for 7 days
{ if: { role: "user", reports: { $gte: 10 } },
  then: { assignRole: "manager", expiresIn: 7 * 24 * 60 * 60 * 1000 } }

// Event role with a fixed end date
{ if: { role: "user", ticket: "vip" },
  then: { assignRole: "vip", expiresAt: "2026-12-31T23:59:59Z" } }

// Self-reverting: a 30s "manager pass" that drops back to user on expiry
{ if: { role: "user", points: { $gte: 1 } },
  then: { assignRole: "manager", expiresIn: 30000, expiresTo: "user" } }
```

- `expiresIn` is measured **from the moment of promotion**; `expiresAt` is absolute and wins if both are set.
- The expiry is written onto the `user:<address>` node and signed by the superadmin, like any role change.
- Once expired, the Security Manager **stops honoring the role** — privileged operations from that user are rejected both locally (`verifyUserRoleLocal` throws *"Role has expired"*) and, since **0.14.0**, by every honest peer (incoming operations from an expired role are authorized as `guest`).
- By default the engine leaves the node's `role` label untouched on expiry; the role simply ceases to have effect. Add **`expiresTo`** to the rule's `then` to make the engine auto-revert the stale label to a base role (e.g. `expiresTo: "user"`) on a later cycle.
- **Avoid renewal loops:** if `expiresTo` reverts to a role that *still satisfies the granting condition*, the rule re-fires immediately and the role renews forever. Design the trigger to be **consumed** on promotion (spend the points/flag) so the condition no longer holds after revert — see the "manager pass" pattern in [`examples/governance.html`](https://estebanrfp.github.io/gdb/examples/governance.html).

> **Note:** since **0.14.0**, expiry is enforced **network-wide** — every honest peer downgrades to `guest` any incoming operation signed under an expired role, not just the local client. See the [CHANGELOG](https://github.com/estebanrfp/gdb/blob/main/CHANGELOG.md) Security section.

## Where the objective data lives

Rules are evaluated against the **`user:<address>` node** — the same node where the Security Manager stores the user's role. The application writes the user's metrics (points, reputation, counters…) into that node, and the rules read them from there. For objectives based on other data ("created 5 posts"), aggregate a counter into the user node whenever the action happens.

> **Important:** `db.put()` replaces the whole node value. Always spread the existing value when writing a metric, or you will wipe the user's `role`:
>
> ```javascript
> const id = `user:${address}`
> const { result } = await db.get(id)
> await db.put({ ...result.value, points: newPoints }, id)
> ```

## Conflict resolution: last-match-wins

When several rules match the same user node in a cycle, **the last one in the list wins**. Order your rules **easy → hard** so each tier overrides the ones above it — and a merit ladder then needs **no explicit demotion rules**: losing the condition simply lets a lower rule win again.

```javascript
const MEMBER = { $in: ["user", "manager", "admin"] } // any onboarded member
governanceRules: [
  { if: { role: "guest" }, offsetTimestamp: 5000, then: { assignRole: "user" } }, // onboarding gate
  { if: { role: MEMBER },                        then: { assignRole: "user" } },    // floor
  { if: { role: MEMBER, points: { $gte: 2 } },   then: { assignRole: "manager" } }, // climb
  { if: { role: MEMBER, points: { $gte: 4 } },   then: { assignRole: "admin" } },   // climb
]
```

A user with 4 points matches the floor, the manager rule **and** the admin rule → **admin** wins (the last match). Drop to 1 point and only the floor matches → back to **user**, automatically. The engine resolves each node to a single role and writes it **at most once per cycle**, only when it actually changes — no flicker, no redundant ops.

> **The floor rule matters.** It catches every onboarded member regardless of points, so a node that drops below the lowest threshold demotes cleanly instead of getting stuck at a stale tier.

## Engine behavior

- Runs **only while a superadmin is logged in** on that device — their key signs every `assignRole`.
- Evaluates **all** rules **every 4 seconds** and resolves each node by last-match-wins (above).
- Skips: nodes that are not `user:<address>`, **superadmins (immunity)**, and nodes more recent than `offsetTimestamp`. Writes only when the resolved role differs from the current one.
- P2P consistency: a metric must have synced to the superadmin's node before a rule can see it (typically a few seconds).

## Try it

The interactive viewer at **[examples/governance.html](https://estebanrfp.github.io/gdb/examples/governance.html)** demonstrates the last-match-wins ladder. Open it in **two browsers**: in one, log in as a superadmin (a demo mnemonic is included in the file); in the other, create a new guest. Watch the guest get promoted to `user` after 5 seconds, climb to `manager` at 2 points and `admin` at 4 points with 👍, and **auto-demote** back down with 👎 — every transition appears in the log.

## Where it fits

- It builds directly on the **[Zero-Trust Security Model](zero-trust-security-model.md)** (guest → superadmin) and the **[Distributed Trust Model](genosdb-distributed-trust-model.md)** (signed, serverless authority).
- It uses the Security Manager's **RBAC roles and role assignment** (see [SM Architecture](sm-architecture.md)).
- It is **complementary to [ACLs](sm-acls-module.md)**: ACLs gate *per-node* access (who may read or write a specific node); Governance gates *role promotion* (whether a user may act at all, and at what level). One controls individual documents; the other controls how a user advances through the trust hierarchy.
