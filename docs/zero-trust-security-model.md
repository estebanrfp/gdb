## Understanding GenosDB Zero-Trust Security Model: From Guest to SuperAdmin

<div align="center">
  <a href="https://www.youtube.com/watch?v=srSmcNLWMus">
    <img src="https://img.youtube.com/vi/srSmcNLWMus/0.jpg" alt="GenosDB Presentation" width="100%" />
  </a>
</div>

In a decentralized system, robust security isn't a feature—it's the foundation. Our GenosDB (GDB) Security Manager (SM) is built on a "zero-trust with a single welcome exception" principle. Every action must be cryptographically signed and explicitly authorized. There are no shortcuts.

This model elegantly solves the classic "chicken-and-egg" problem: how can a new user join the network if they need permission to announce their existence? Let's break down what each user role can and cannot do within this secure framework.

### The Core Principle: Signed and Authorized

Before any operation is even considered, it must pass a rigorous cryptographic check:
1.  **Valid Signature:** The operation must be signed by a valid Ethereum private key.
2.  **Identity Match:** The signature must correspond to the `originEthAddress` claimed in the message.

If these checks fail, the operation is immediately discarded. Only cryptographically verified operations proceed to the permission layer.

---

### Scenario 1: The Brand-New User (`Guest`)

This is a user whose Ethereum address has never been seen before. Their address does not exist in the database (i.e., there is no `user:[their_eth_address]` node).

#### The ONE Thing They CAN Do:

A new user is granted a single, highly-specific "welcome exception" to solve the bootstrap problem. They can perform **ONE** `write` (`upsert`) operation to create their own user profile. This action is strictly governed by three rules:

1.  **The Action MUST be `write`:** No other operation type is allowed.
2.  **The Target MUST be their own node:** The `id` of the node being created must be exactly `user:[their_own_eth_address]`.
3.  **The user MUST NOT already exist:** This is a one-time-only ticket into the network.

**Crucially**, even in this single permitted operation, the system does not trust the incoming data. Our code **forcefully overwrites** the `role` in this new node to `guest`, neutralizing any attempt at self-privilege escalation.

#### Everything They CANNOT Do:

*   **CANNOT choose their role.** If they try to submit `{ "role": "superadmin" }` in their first `write`, the system will ignore it and set the role to `guest`.
*   **CANNOT write to any other node.** Attempting to create a node with `id: "anything_else"` will be denied.
*   **CANNOT delete anything (`remove`).** The `'delete'` action is not permitted for the `guest` role.
*   **CANNOT link nodes (`link`).** The `'link'` action is not permitted for the `guest` role.

---

### Scenario 2: The Existing User with `Guest` Role

This user has already performed their initial bootstrap operation and now has a `user:[their_address]` node with `role: "guest"`.

#### What They CAN Do:

Their capabilities are now strictly limited to the permissions explicitly defined for the `guest` role. Based on our default configuration, this includes:

*   **`read`**: They can read public graph data.
*   **`sync`**: They can participate in the data synchronization protocol with other peers. This is essential for them to receive network updates, including a potential future role promotion.

#### Everything They CANNOT Do:

*   **CANNOT write anymore.** The bootstrap condition is now `false` because their user node exists, and the permission check `can('guest', 'write')` returns `false`. Their write access is closed until a SuperAdmin promotes them.
*   **CANNOT delete, link, or assign roles.** They are confined to the minimal permissions of a guest.

---

### Scenario 3: The Promoted User (Roles: `user`, `manager`, `admin`)

This is a user who has been granted a higher-level role by a `SuperAdmin`.

#### What They CAN Do:

They can perform exactly what their role (and any inherited roles) allows. The system checks every operation against the `can(their_role, action)` function:
*   A `user` can `write` and `link`.
*   A `manager` can do the above and also `publish`.
*   An `admin` can do all of the above and also `delete`.

#### Everything They CANNOT Do:

*   **Perform actions of a higher role.** A `user` cannot `delete`. An `admin` cannot `assignRole` (by default). The system enforces a strict and predictable hierarchy.

---

### Scenario 4: The `SuperAdmin`

This is a user whose Ethereum address is hard-coded into the node's configuration. They are the root of trust in the permission system.

#### What They CAN Do:

*   **Virtually anything.** Their `superadmin` role grants them permission for all defined actions, including the most critical one:
    *   **Assigning roles to other users (`assignRole`).** This is the action that promotes `guest` users and builds the permission hierarchy of the network.

#### Everything They CANNOT Do:

*   **Forge another user's signature.** Their power resides in their own cryptographic identity. They cannot act on behalf of others.

---

### Permission Summary Table

| Action / Role | New `Guest` (First `write`) | Existing `Guest` | `User` | `Admin` | `SuperAdmin` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Create Own User Node** | ✳️ **Yes** (One time only) | ❌ No | (Already exists) | (Already exists) | (Already exists) |
| **Write/Modify Data** | ❌ No (except above) | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Sync/Read Data** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Link Nodes** | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Delete Nodes** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Assign Roles** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ **Yes** |

In summary, our Security Manager implements a secure, one-way entry portal for new users. It allows them to introduce themselves to the network by creating their identity card, but the system immediately takes the pen away, waiting for a trusted authority (`SuperAdmin`) to grant them real permissions. This model is robust, secure, and ready for decentralized collaboration.

---

### Opening It Up: Public Platforms

The portal above is the **secure default**, where a `SuperAdmin` decides who can
write. For apps that are open by design — public forums, polls, comment boards —
grant the base `guest` role `write` (and `link`) permissions via the SM's
`customRoles` option, and anyone can post immediately. This opens **authorization,
not authenticity**: every operation is still signed and peer-verified, so forged
writes are rejected — you are only letting unpromoted identities participate.

---

> **See also — [Governance](governance.md):** how role *promotions* (guest → user → …) can be driven by declared rules and granted by a present superadmin. Governance is the structured counterpart to the manual promotion described above.