# GenosDB SM ACLs Module

## Overview

The **Access Control Lists (ACLs)** module provides fine-grained, node-level permissions for GenosDB. Unlike role-based access control (RBAC) which applies global permissions, ACLs allow you to control access to individual nodes, enabling collaborative applications where different users can have different permissions on specific data.

### Key Features

- **Node-Level Permissions**: Grant/revoke permissions per user per node
- **Flexible Permission Types**: `read`, `write`, `delete`
- **Owner-Based Control**: Node creators are automatically owners with full permissions
- **Real-Time Synchronization**: Permission changes sync across all peers
- **Integration with RBAC**: Works alongside existing role-based permissions
- **Automatic Middleware**: Enforces permissions on all database operations

### How permissions work

```ascii
A node becomes ACL-protected the moment it is created with acls.set —
the caller is its owner, who then grants access to other addresses.

  Node
   │
   ├──► owner          full control — read · write · delete · grant / revoke
   │
   └──► collaborators  one access level per address, granted by the owner:
          read    →  read
          write   →  read + write
          delete  →  read + write + delete

   delete ⊃ write ⊃ read                    everyone else → no access

Every put / remove is re-checked by the ACL middleware on EVERY peer,
so a tampered client cannot touch a node it does not own:

   owner                       ──►  allow
   collaborator perm ≥ action  ──►  allow
   node has no owner (plain)   ──►  allow     (ACLs are opt-in per node)
   otherwise                   ──►  deny
```

## Quick Start

### 1. Enable ACLs

```javascript
import { gdb } from 'genosdb';

const db = await gdb('my-app', {
  rtc: true, // Required for P2P
  sm: {
    superAdmins: ['0x1234...'], // Required
    acls: true // Enable ACL module
  }
});
```

### 2. Create a Node with ACLs

```javascript
// Create a document with ACL protection
const docId = await db.sm.acls.set({
  title: 'Shared Document',
  content: 'This is a collaborative document',
  type: 'document'
});

// The creator becomes the owner automatically
```

### 3. Grant Permissions

```javascript
// Grant read permission to a specific user
await db.sm.acls.grant(docId, '0xUserAddress...', 'read');

// Grant write permission
await db.sm.acls.grant(docId, '0xUserAddress...', 'write');
```

### 4. Check Permissions in Your App

```javascript
// Get node data
const { result: node } = await db.get(docId);

// Check if current user can write
const currentUser = db.sm.getActiveEthAddress();
const canWrite = node.value.owner === currentUser ||
                 node.value.collaborators?.[currentUser] === 'write';

if (canWrite) {
  // Show edit controls
  showEditInterface(node.value);
} else {
  // Show read-only view
  showReadOnlyInterface(node.value);
}
```

## API Reference

### `db.sm.acls.set(value, id?)`

Creates or updates a node with ACL protection.

**Parameters:**
- `value` (object): The data to store
- `id` (string, optional): Node ID. Auto-generated if not provided

**Returns:** `Promise<string>` - The node ID

**Example:**
```javascript
// Create new node
const id = await db.sm.acls.set({
  title: 'My Note',
  content: 'Secret content',
  type: 'note'
});

// Update existing node
await db.sm.acls.set({
  title: 'Updated Note',
  content: 'Updated secret content'
}, id);
```

### `db.sm.acls.grant(nodeId, userAddress, permission)`

Grants a permission to a user for a specific node. Only the owner can grant permissions.

**Parameters:**
- `nodeId` (string): The node ID
- `userAddress` (string): Ethereum address of the user
- `permission` (string): `'read'`, `'write'`, or `'delete'`

**Returns:** `Promise<void>`

**Example:**
```javascript
await db.sm.acls.grant('node123', '0xUserAddress', 'write');
```

### `db.sm.acls.revoke(nodeId, userAddress)`

Revokes all permissions from a user for a specific node. Only the owner can revoke permissions.

**Parameters:**
- `nodeId` (string): The node ID
- `userAddress` (string): Ethereum address of the user

**Returns:** `Promise<void>`

**Example:**
```javascript
await db.sm.acls.revoke('node123', '0xUserAddress');
```

### `db.sm.acls.delete(nodeId)`

Deletes a node. Only the owner can delete their nodes.

**Parameters:**
- `nodeId` (string): The node ID to delete

**Returns:** `Promise<void>`

**Example:**
```javascript
await db.sm.acls.delete('node123');
```

### `db.sm.acls.getPermissions(nodeId)`

Gets the permission structure for a node.

**Parameters:**
- `nodeId` (string): The node ID

**Returns:** `Promise<{owner: string, collaborators: object}>`

**Example:**
```javascript
const permissions = await db.sm.acls.getPermissions('node123');
console.log(permissions);
// {
//   owner: '0xOwnerAddress',
//   collaborators: {
//     '0xUser1': 'read',
//     '0xUser2': 'write'
//   }
// }
```

## Permission Types

### `read`
- Allows viewing the node's value and edges
- Required for `db.get(nodeId)` operations
- Does not allow modifications

### `write`
- Includes `read` permissions
- Allows updating the node's value with `db.sm.acls.set()`
- Allows creating edges to/from the node

### `delete`
- Includes `read` and `write` permissions
- Allows deleting the node with `db.sm.acls.delete()`
- Note: `delete` permission is not automatically granted with `write`

## Integration with RBAC

ACLs work alongside GenosDB's Role-Based Access Control system:

```javascript
const db = await gdb('my-app', {
  rtc: true,
  sm: {
    superAdmins: ['0xAdmin...'],
    customRoles: {
      editor: { can: ['write'], inherits: ['user'] },
      user: { can: ['read'], inherits: ['guest'] },
      guest: { can: ['read'] }
    },
    acls: true // Enable ACLs
  }
});
```

**Permission Evaluation Order:**
1. **RBAC Check**: User must have the required role permission
2. **ACL Check**: If RBAC passes, ACL permissions are checked
3. **Operation**: Only executes if both checks pass

## Real-World Examples

### Collaborative Document Editor

```javascript
class CollaborativeEditor {
  constructor(db) {
    this.db = db;
    this.currentDoc = null;
  }

  async createDocument(title, content) {
    const docId = await this.db.sm.acls.set({
      title,
      content,
      type: 'document',
      created: Date.now()
    });
    this.currentDoc = docId;
    return docId;
  }

  async shareWithUser(docId, userAddress, permission = 'read') {
    await this.db.sm.acls.grant(docId, userAddress, permission);
  }

  async loadDocument(docId) {
    const { result: doc } = await this.db.get(docId);
    if (!doc) throw new Error('Document not found');

    const currentUser = this.db.sm.getActiveEthAddress();
    const canEdit = doc.value.owner === currentUser ||
                   doc.value.collaborators?.[currentUser] === 'write';

    return {
      data: doc.value,
      canEdit,
      permissions: doc.value.collaborators || {}
    };
  }

  async updateDocument(docId, updates) {
    const currentUser = this.db.sm.getActiveEthAddress();
    const { result: existing } = await this.db.get(docId);

    if (!existing) throw new Error('Document not found');

    const canEdit = existing.value.owner === currentUser ||
                   existing.value.collaborators?.[currentUser] === 'write';

    if (!canEdit) throw new Error('No write permission');

    await this.db.sm.acls.set({
      ...existing.value,
      ...updates,
      modified: Date.now()
    }, docId);
  }
}
```

### Task Management System

```javascript
class TaskManager {
  constructor(db) {
    this.db = db;
  }

  async createTask(title, description, assignee = null) {
    const taskId = await this.db.sm.acls.set({
      title,
      description,
      status: 'pending',
      type: 'task',
      created: Date.now()
    });

    if (assignee) {
      await this.db.sm.acls.grant(taskId, assignee, 'write');
    }

    return taskId;
  }

  async assignTask(taskId, userAddress) {
    await this.db.sm.acls.grant(taskId, userAddress, 'write');
  }

  async updateTaskStatus(taskId, status) {
    const currentUser = this.db.sm.getActiveEthAddress();
    const { result: task } = await this.db.get(taskId);

    const canUpdate = task.value.owner === currentUser ||
                     task.value.collaborators?.[currentUser] === 'write';

    if (!canUpdate) throw new Error('Cannot update task');

    await this.db.sm.acls.set({
      ...task.value,
      status,
      updated: Date.now()
    }, taskId);
  }
}
```

## Security Considerations

### Owner Privileges
- **Automatic Ownership**: Node creators become owners with full permissions
- **Owner-Only Operations**: Only owners can grant/revoke permissions and delete nodes
- **No Self-Revocation**: Owners cannot revoke their own permissions

### Permission Validation
- **Middleware Enforcement**: All operations are validated through ACL middleware
- **Real-Time Checks**: Permissions are checked before each operation
- **Cryptographic Verification**: Operations are signed and verified by all peers
- **Enforced against malicious peers (since 0.14.0)**: incoming operations are checked in `verifyIncomingOperations` against the cryptographically-verified author, so a modified peer cannot write a node it does not own — even by bypassing the UI

### Best Practices

1. **Validate Permissions Client-Side**: Always check permissions before showing UI controls
2. **Handle Permission Errors**: Gracefully handle cases where users lose permissions
3. **Use Appropriate Permissions**: Grant minimal required permissions
4. **Monitor Access Patterns**: Log permission changes for security auditing
5. **Regular Cleanup**: Periodically review and revoke unnecessary permissions

## Troubleshooting

### Common Issues

**"No write permission" Error**
```javascript
// Check current permissions
const { result: node } = await db.get(nodeId);
const currentUser = db.sm.getActiveEthAddress();
console.log('Owner:', node.value.owner);
console.log('Collaborators:', node.value.collaborators);
console.log('Current user:', currentUser);
```

**Permissions not syncing**
- Ensure `rtc: true` is enabled
- Check that all peers are connected
- Verify user addresses are correct (case-sensitive)

**Owner cannot be changed**
- Owner is set at creation and cannot be modified
- To transfer ownership, create a new node and grant permissions

## Migration from Manual Permission Checks

If you're currently using manual permission checks:

```javascript
// Before (manual)
async function updateDocument(id, data) {
  const { result: doc } = await db.get(id);
  const user = db.sm.getActiveEthAddress();

  if (doc.value.owner !== user && !doc.value.collaborators?.[user]) {
    throw new Error('No permission');
  }

  await db.put(data, id);
}

// After (with ACLs)
async function updateDocument(id, data) {
  await db.sm.acls.set(data, id); // Automatic permission checking
}
```

## Performance Notes

- **Minimal Overhead**: ACL checks are performed only when necessary
- **Cached Results**: Permission checks use cached node data when available
- **Efficient Queries**: Use indexed queries to filter accessible nodes
- **Batch Operations**: Group permission checks to reduce network calls

## Browser Compatibility

- **Modern Browsers**: Full support for all features
- **HTTPS Required**: WebAuthn requires secure context
- **P2P Support**: WebRTC-enabled browsers for real-time sync
- **Storage**: OPFS support for persistent storage

---

For more examples and advanced usage, see the [testbed implementation](acls.html) in the examples directory.