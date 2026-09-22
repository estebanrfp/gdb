# Governance — how a role is earned, and who signs it

A newcomer is a `guest`, and nothing it writes to its own role is worth anything: a role exists only when a superadmin's key has signed it. Governance is the superadmin declaring, up front and identically on every peer, the rules under which that signature is given — and the engine applying them while a superadmin is present. The canonical treatment is [docs/governance.md](https://github.com/estebanrfp/gdb/blob/main/docs/governance.md) and the reference file [`examples/governance.html`](https://github.com/estebanrfp/gdb/blob/main/examples/governance.html) ([live](https://estebanrfp.github.io/gdb/examples/governance.html)); the methods are in [API.md](API.md), the model in [SECURITY.md](SECURITY.md). Every rule below is the fix for a mistake that a green test suite caught in a full application ([dMessenger](https://github.com/estebanrfp/dMessenger), whose README shows each one live).

> Rules describe **intent**. Only a verifiable superadmin **signature** grants a role — and the engine writes it at most once per node per cycle, only when it changes.

## The constitution comes before the rules

Start from what the application *does*, not from the role names. List every user action and what it costs; the lowest tier that may do each is the constitution.

| the user… | operation | permission |
|---|---|---|
| writes or edits a node | `put` | `write` |
| takes it back — a message, a reaction, a vouch | `remove` | `delete` |
| relates two nodes | `link` / `unlink` | `link` |
| catches up with peers | delta / full state | `sync` |
| does something the app defines — publish, create a room, moderate | `db.sm.executeWithPermission(name)` | that name, granted to a tier |
| promotes someone | `db.sm.assignRole` | `assignRole` — superadmin only |

- **`customRoles` replaces the whole table.** Keep the full ladder (`guest` → `user` → `manager` → `admin` → `superadmin`, each inheriting the one below); a tier nobody can reach is a feature nobody has.
- **The floor is a decision, not a default.** A `guest` that may `read` and `sync` only cannot speak until promoted — right for a moderated forum, wrong for anything that must work before a superadmin has ever been online. The open-platform floor (`guest: { can: ["read", "sync", "write", "link"] }`) lets a newcomer act on its own nodes; ownership already keeps it off everyone else's.
- **`remove` costs `delete`, and a guest usually needs it.** Without `delete` at the floor, a newcomer cannot retract its own reaction or message: the op succeeds locally and every other peer refuses it. Ownership already limits deleting to one's own nodes, so putting `delete` at the floor risks nothing but a user changing their mind. Reserve `deleteAny` — moderation of nodes you do not own — for a higher tier.
- **Give every node an `owner`** (id `${owner}:…`). It is what makes an open floor safe: the residual is spam, never takeover, and a forged node in somebody else's name lands in the forger's copy and nowhere else.

## The rules

`governanceRules: [{ if: <query over user:<address> nodes>, then: { assignRole }, offsetTimestamp? }]` — evaluated every 4 s, all of them, **last match wins**. Order them easy → hard and keep a **floor rule** so losing a condition demotes; then no demotion rule is ever written. Superadmins are immune.

```js
{ if: { role: "guest" }, offsetTimestamp: 8000, then: { assignRole: "user" } },                      // onboarding: time, unforgeable
{ if: { role: { $in: ["user", "manager"] } }, then: { assignRole: "user" } },                          // floor
{ if: { role: { $in: ["user", "manager"] }, vouches: { $gte: 2 } }, then: { assignRole: "manager" } }, // climb
```

- **A rule that governs a tier owns it.** `assignRole(address, "manager")` by hand, on a tier the rules govern, is overwritten on the next cycle by whichever rule matches — usually the floor. It passes the moment you look and fails a minute later. Either earn the tier the way the rule describes, or keep rules to the tiers *below* the ones you assign by hand, floor included.
- **`offsetTimestamp` is the engine's own stopwatch** — how long it has watched the node's current stamp — never a timestamp a peer signed for itself, and any rewrite of the node restarts it. It is the one condition a modified client cannot forge, which is why onboarding keys on it.
- **A metric on `user:<address>` is self-reported.** The subject may rewrite everything on its node but `role` and `expiresAt`, so a rule on `points` or `vouches` is self-service promotion by construction, and no metric there resists a modified client. Tie such tiers to weak powers — `manager` may `publish`, never delete — and keep the *evidence* where it cannot be forged: one signed node per fact, owned by whoever produced it (a vouch owned by the voucher), counted independently by every peer. Show *declared* beside *verifiable*; a gap is self-promotion in the open.
- **Write a metric by spreading the node**: `db.put({ ...node.value, vouches: n }, id)`. A `put` without `role` wipes the role.
- **A rule decides over a term.** A role assigned with `expiresAt` becomes permanent when a rule matches its node, and an expired identity keeps its `role` label, so a rule matching the label revives it. Time-limited tiers must sit above every rule.
- **Peers first, rules second.** A metric has to reach the superadmin's copy before a rule can see it — seconds, not milliseconds. Never assert a promotion with a sleep; poll with a generous timeout.

## Who runs the engine

- **Only a signed-in superadmin's window**, or the Fallback Server as a 24/7 superadmin: `GDB_SM_KEY` (its mnemonic or private key), `GDB_SUPERADMINS` (the same list the clients ship) and `GDB_SM_RULES` (the same rules module). Every other peer never runs it.
- **The consequence is absolute: with no superadmin online, nobody is ever promoted.** A public demo whose superadmin is only its author shows visitors a ladder they can never climb. Say it on screen, as the reference example does — *Engine: running in this window — every promotion is signed here* versus *waiting for a superadmin window* — derived from the session's role, not from a flag.
- **Demos ship the canonical identities of design guide §4.5** — `SUPERADMIN`, `ALICE` and `BOB`, public throwaway mnemonics copied verbatim, `superAdmins: [SUPERADMIN.address]`, and **one quiet button per identity on the identity door** (`🛡️ Superadmin (demo)`), hidden during onboarding. Two windows, two clicks, and a visitor watches Alice arrive as `guest` and become `user` under the Superadmin's signature. Never a placeholder address, never an invented one, never a hidden button: a shortcut that makes any visitor a superadmin tells the opposite story.
- **Production ships no mnemonic.** The constitution is build-time configuration (`VITE_SUPERADMINS`-style, identical for every peer built from it) and the demo buttons disappear with it, because the canonical superadmin is no longer in the constitution.

## The application side

- **Gate by degrees, disabled not hidden** (guide §4.4): the control stays visible with a `title` that names the price — *Creating a group needs the publish permission, which arrives with the manager role — you are user*. A ladder the user cannot see is one they cannot climb.
- **Check app-defined verbs with `executeWithPermission(name)`** before the action: it resolves the address or rejects. It is a courtesy to the user, not the gate — the gate is every receiver's, and a `put` the UI allowed is still refused everywhere if the role does not carry it.
- **Show the role every peer agrees on**, not the one the client believes: ``db.get(`user:${address}`, cb)`` and paint the badge from the node. A superadmin's controls — an `assignRole` selector on other identities — appear only when the security state says so.

## Testing it

- The superadmin signs in through the **same one-click button a visitor uses**; its window runs the engine for the whole test.
- Assert the promotion on the **rendered badge** with a timeout that covers the whole path — `offsetTimestamp`, a 4 s cycle, and the decision travelling back: about 20 s end to end over public relays. A **third, uninvolved peer** must show the same role: the decision is the graph's, not a window's.
- **Earn governed tiers in the test the way the rule says** — two vouches from two identities, the subject publishes its count — never by `assignRole`: a manual assignment into a governed tier is the test that passes today and fails when the next cycle lands.
- For determinism without a browser window, run the Fallback Server as the superadmin (`GDB_SM_KEY`, `GDB_SM_RULES`) — see [TESTING.md](TESTING.md).
