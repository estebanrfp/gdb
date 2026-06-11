# **`db.link()` Method Documentation**

The `db.link()` method creates a **directed edge** between two existing nodes, turning flat records into a true graph. Edges are first-class data: they persist locally (OPFS), synchronize peer-to-peer like any other change, and power recursive traversals with the [`$edge` operator](map-guide.md).

---

## **Method Signature**
```javascript
async db.link(sourceId, targetId)
```

---

## **Parameters**
1. **`sourceId`** (string, required):
   - The ID of the node the edge starts from (the *parent*).

2. **`targetId`** (string, required):
   - The ID of the node the edge points to (the *child*).

> **Both nodes must already exist.** If either ID is not found, the method logs a warning and performs no change — create the nodes with [`db.put()`](put-guide.md) first.

---

## **Key Semantics**

1. **Directed (one-way).** `db.link(a, b)` creates `a → b` only. For a bidirectional relationship, link both ways:
   ```javascript
   await db.link(userId, groupId);
   await db.link(groupId, userId);
   ```

2. **Timestamped & synchronized.** Each link operation is stamped with the [Hybrid Logical Clock](genosdb-hybrid-logical-clock.md), persisted, and propagated to all peers in real time — exactly like a `put`.

3. **Idempotent in practice.** Linking the same pair again does not duplicate the relationship.

4. **Cleaned up on removal.** When a node is deleted with [`db.remove()`](remove-guide.md), references to it in other nodes' edges are removed as well — no dangling edges.

---

## **Usage Examples**

### **1. Build a Simple Relationship**
```javascript
const aliceId = await db.put({ name: "Alice", type: "User" });
const groupId = await db.put({ name: "Developers", type: "Group" });

await db.link(groupId, aliceId); // Group → Alice ("has member")
```

### **2. Query Linked Nodes with `$edge`**
The main query selects the **starting node(s)**; the `$edge` sub-query filters their **descendants** (children, grandchildren, …):

```javascript
// All adult users reachable from the "Developers" group
const { results } = await db.map({
  query: {
    type: "Group", name: "Developers",      // 1. starting point(s)
    $edge: { type: "User", age: { $gte: 18 } } // 2. filter applied to descendants
  }
});
```

> ⚠️ **Direction matters.** `$edge` follows edges *outward* from the starting nodes. A query like `{ $edge: { id: "parent-id" } }` looks for descendants *equal to* the parent — almost always empty. Put the parent in the **main** query and the children's filter inside `$edge`.

### **3. Real-World Pattern: Version History**
Used by the [collaborative editor example](https://estebanrfp.github.io/gdb/examples/collab.html) — each saved version is a node linked **from** the document:

```javascript
// Save a version
const versionId = `version-${Date.now()}`;
await db.put({ content, timestamp: new Date().toISOString() }, versionId);
await db.link(docId, versionId);                  // doc → version

// Restore the full history (newest first)
const { results } = await db.map({
  query: { id: docId, $edge: { content: { $exists: true } } },
  field: "timestamp",
  order: "desc"
});
```

---

## **Error Handling**
- If `sourceId` or `targetId` does not exist, a warning is logged (`⚠️ One or both nodes … do not exist.`) and nothing is written.
- The method is asynchronous — always `await` it so ordering with subsequent queries is guaranteed.

---

## **Key Notes**
1. **Edges live on the source node.** Each node carries an `edges` array of target IDs; `db.map` callbacks expose it alongside `id`, `value` and `timestamp`.
2. **Model relationships explicitly.** Prefer meaningful directions (`order → items`, `doc → versions`, `group → members`) so `$edge` traversals read naturally.
3. **Traversals are recursive.** `$edge` explores the entire descendant tree, not just direct children — see the [MAP guide](map-guide.md) and the [`$edge` testbed](https://estebanrfp.github.io/gdb/examples/edge-operator-testbed.html).
