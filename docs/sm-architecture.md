[![image](https://i.imgur.com/QPxGQEF.png)](https://i.imgur.com/QPxGQEF.png)

### **Overview of the GDB Security Manager (SM)**

The security architecture of GDB is designed to provide robust authentication, data integrity, and access control within a distributed, peer-to-peer (P2P) graph database environment. It is managed through the integrated **Security Manager (SM)**, which is activated during database initialization:

```javascript
const db = await gdb("my-db", {
  rtc: true, 
  sm: {
    superAdmins: ["0x1...", "0x2..."] // superadmin addresses
  }
});
```

The SM relies on a combination of Ethereum-based cryptographic identities, the WebAuthn standard for secure authentication, and a Role-Based Access Control (RBAC) system for granular authorization.

**Key Security Components:**

1.  **Identity Management (via `db.sm`)**
    *   **Ethereum Identities:** Each user is identified by a cryptographic key pair (public/private address). All actions are tied to this identity.
    *   **WebAuthn Protection:** Instead of traditional passwords, users' private keys are encrypted using secrets derived from WebAuthn interactions (e.g., biometrics, FIDO2 security keys). This provides passwordless, phishing-resistant security. The `db.sm.protectCurrentIdentityWithWebAuthn()` and `db.sm.loginCurrentUserWithWebAuthn()` functions manage this flow.
    *   **Mnemonic Recovery:** For account creation and backup, the SM supports standard BIP39 mnemonic phrases via `db.sm.startNewUserRegistration()` and `db.sm.loginOrRecoverUserWithMnemonic()`.
    *   **Session Management:** The SM's internal `SoftwareWalletManager` handles the creation of new identities, secure loading of existing ones, and session logout (`db.sm.clearSecurity()`). It ensures sensitive cryptographic material (the private key) is only held in memory when a user is actively authenticated.

2.  **P2P Operation Security & Enforcement**
    *   **Outgoing Operation Signing:** When an authenticated user performs a database modification (e.g., `put`, `remove`, `link`), the SM automatically uses the user's active private key to cryptographically sign the operation before broadcasting it to peers. This signature ensures **authenticity** (proof of origin) and **integrity** (proof the operation was not altered).
    *   **Incoming Operation Verification:** When a peer receives an operation, its SM performs two critical checks:
        1.  It verifies the cryptographic signature. If invalid, the operation is rejected.
        2.  If the signature is valid, it consults the RBAC system to determine if the sender (identified by their address) has the necessary permissions for the requested action. If permission is denied, the operation is rejected.
    *   **"Verifier-Only" Mode:** A GDB instance without an active local user session can still receive and verify operations from authenticated peers. Its SM acts in a "verifier-only" mode, applying the same security rules to maintain network-wide consistency.

3.  **Secure Data Storage (Local Encryption)**
    *   The SM provides simple, user-centric encryption via `db.sm.put()`, `db.sm.get()`, `db.sm.map()`, and `db.sm.remove()`.
    *   When an authenticated user calls `db.sm.put(data)`, the data is automatically encrypted with a key derived from their Ethereum identity before being stored in GDB.
    *   When the same user calls `db.sm.get(id)`, the SM attempts to decrypt the data. If successful, the original plaintext is returned; otherwise, the encrypted ciphertext is returned, ensuring data privacy.
    *   `db.sm.map(options)` allows querying encrypted nodes using the same query language as `db.map()`. It fetches all encrypted nodes, decrypts them in parallel, and then applies the query filters on the decrypted data. This method does not support realtime mode.
    *   `db.sm.remove(id)` deletes an encrypted node by its ID, automatically handling the internal SM prefix.

4.  **Role-Based Access Control (RBAC)**
    *   **Role and Permission Definition:** A hierarchy of roles (e.g., `guest`, `user`, `admin`, `superadmin`) with specific permissions (`read`, `write`, `delete`, `assignRole`) is established. This hierarchy can be customized during GDB initialization via the `sm.customRoles` configuration option.
    *   **Role Assignment:** Users (identified by their Ethereum address) are assigned roles, and these assignments are stored as nodes within GDB itself, making them part of the synchronized state. The `db.sm.assignRole()` function is used for this purpose.
    *   **Authorization:** Before executing a restricted action, the SM uses `db.sm.executeWithPermission(permissionName)` to check if the current user's role grants the necessary permission. This check is also performed automatically on incoming operations from peers.

5.  **Access Control Lists (ACLs) - Optional Extension**
    *   **Node-Level Permissions:** ACLs provide fine-grained, per-node access control beyond global RBAC roles. Each node can have its own set of permissions granted to specific users.
    *   **Ownership Model:** The creator of a node automatically becomes the owner with full permissions (`read`, `write`, `delete`). Owners can grant or revoke permissions to other users for their nodes.
    *   **Permission Types:** Supports granular permissions: `'read'` (view node), `'write'` (update node), `'delete'` (remove node).
    *   **Integration with RBAC:** ACL checks are performed in addition to RBAC. A user must have both the role permission and the ACL permission for the operation.
    *   **Automatic Middleware:** When enabled (`acls: true` in SM config), ACLs register middleware that enforces permissions on all database operations.
    *   **Enforced against malicious peers (since 0.14.0):** the cryptographically-verified author (`signer`) is propagated to the per-node middleware, so a modified peer cannot write a node it does not own — node-level ACLs are real security against any peer, not just an honest-client convenience.
    *   **API Methods:** Exposed via `db.sm.acls.set()`, `db.sm.acls.grant()`, and `db.sm.acls.revoke()` for creating nodes with ACLs and managing permissions.

6.  **Governance (Role Promotion & Demotion) - Optional Extension**
    *   **Declarative, signed rules:** A superadmin declares advancement rules (`sm.governanceRules`) whose `if` is a native GenosDB query. While a superadmin is online, its key signs every role change and each peer verifies it (zero-trust) — there is no central server.
    *   **Last-match-wins:** Each `user:<address>` node is resolved to a single role — the one proposed by the *last* matching rule in the list. Rules ordered easy→hard form a merit ladder where climbing a tier overrides the lower ones and losing the condition auto-demotes, so no explicit demotion rules are needed. See the [Governance guide](governance.md).

**P2P Security Flow:**

1.  A user on **Peer A** logs in (e.g., via `db.sm.loginCurrentUserWithWebAuthn()`), activating their signing capabilities.
2.  Peer A performs a write operation (e.g., `db.put(...)`).
3.  The SM on **Peer A** automatically signs the operation and sends it to the network.
4.  **Peer B** (receiver), regardless of whether it has an active local session, receives the operation.
5.  The SM on **Peer B**:
    a.  Verifies Peer A's signature.
    b.  If the signature is valid, it queries the local GDB state for Peer A's assigned role (an **expired** role is downgraded to `guest`), and the cryptographically-verified author is propagated to the per-node ACL middleware.
    c.  It uses the RBAC rules to confirm that Peer A's role permits the operation.
    d.  If both checks pass, the operation is applied to Peer B's local graph. Otherwise, it is rejected.
6.  Unsigned or invalid operations are discarded, preserving the integrity of the database.

**Security in Full State Synchronization (`syncReceive`):**

To mitigate the risk of invalid state propagation during a full graph synchronization between peers, additional strategies are employed:

*   **Origin Pre-validation:** Local permission checks are performed before an operation modifies the sender's local database, reducing the chance of invalid data being persisted and synchronized.
*   **Node Verification on Sync:** When a full graph is received, an attempt is made to verify the permissions of the `lastModifiedBy` user for nodes that are newer than the local version. Nodes failing this check may be skipped.
*   **(Optional) Trust in Sync Sender:** Acceptance of full graphs can be restricted to only peers that hold high-trust roles (e.g., `admin`).

**Conclusion:**

Security in GDB is multi-layered and integrated directly into the P2P fabric via the **Security Manager (SM)**. It combines the cryptographic strength of WebAuthn and Ethereum identities for user authentication with a flexible, data-driven RBAC system for authorization. Digital signatures on every operation ensure authenticity and integrity across the network, creating a robust framework for building secure, decentralized applications.

<div align="center">
  <a href="https://www.youtube.com/watch?v=Lkw4hQpgt50">
    <img src="https://img.youtube.com/vi/Lkw4hQpgt50/0.jpg" alt="GenosDB Presentation" width="100%" />
  </a>
</div>

**Live Demo / Testbed:**

You can see GDB with its security features in action at our live testbed environment:
[GenosDB - SM + RBAC (WebAuthn Example)](https://estebanrfp.github.io/gdb/examples/sm-testbed.html)
*(Please note: WebAuthn features require an HTTPS connection or localhost/127.0.0.1 for testing).*