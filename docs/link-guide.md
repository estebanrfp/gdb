### **Method: `link(sourceId, targetId)`**

#### **Description**
The `link` method creates a **directed edge** from one existing node to another, turning flat records into a true graph. The edge is stored on the source node, persisted to storage, and synchronized with peers in real time, just like any other change. Linked nodes can then be explored with recursive graph traversal queries using the `$edge` operator in `db.map()`.

This method is useful for modeling relationships between records (e.g., users and groups, orders and products, parents and children).

---

#### **Parameters**

1. **`sourceId`** (required):

   - Type: String
   - Description: The unique identifier of the node the edge starts from (the _parent_).

2. **`targetId`** (required):
   - Type: String
   - Description: The unique identifier of the node the edge points to (the _child_).

---

#### **Behavior**

1. **Validation**:

   - Both nodes must already exist. If either `id` is not found, a warning is logged (`⚠️ One or both nodes (<sourceId>, <targetId>) do not exist.`) and the method exits without making changes.

2. **Directed Edge**:

   - `link(a, b)` creates `a → b` only. The relationship is one-way; for a bidirectional relationship, call `link` in both directions.

3. **Timestamping**:

   - The operation is stamped with the Hybrid Logical Clock (HLC), so concurrent changes resolve deterministically across peers.

4. **Persistence**:

   - Changes are saved to persistent storage (e.g., OPFS).

5. **Notification**:
   - The method emits an event to notify listeners and peers of the change. This is useful for real-time synchronization in distributed systems.

---

#### **Returns**

- **Nothing**:
  - The method does not return any value. However, it logs a warning if either of the specified nodes does not exist.

---

#### **Examples**

```javascript
// (rtc: true) for realtime updates
const db = await gdb("my-db", { rtc: true })
```

##### **Example 1: Linking Two Nodes**

```javascript
// Add two nodes to the graph
const groupId = await db.put({ name: "Developers", type: "Group" })
const userId = await db.put({ name: "Alice", type: "User", age: 25 })

// Create the relationship: Group → User ("has member")
await db.link(groupId, userId)
```

In this example:

- Two nodes are created with `db.put()`.
- A directed edge is created from the group to the user.

---

##### **Example 2: Bidirectional Relationship**

```javascript
const aliceId = await db.put({ name: "Alice", type: "User" })
const bobId = await db.put({ name: "Bob", type: "User" })

// Friendship goes both ways: create one edge in each direction
await db.link(aliceId, bobId)
await db.link(bobId, aliceId)
```

In this example:

- Each `link` call creates a single one-way edge.
- Calling it in both directions models a mutual relationship.

---

##### **Example 3: Querying Linked Nodes with `$edge`**

```javascript
// Find all adult users reachable from the "Developers" group
const { results } = await db.map({
  query: {
    type: "Group",
    name: "Developers", // 1. Conditions to find the starting node(s)
    $edge: { type: "User", age: { $gte: 18 } }, // 2. Filter applied to the descendants
  },
})

console.log(results) // Array of matching descendant nodes
```

In this example:

- The main part of the query selects the **starting node(s)** for the traversal.
- The `$edge` sub-query filters their **descendants** (children, grandchildren, etc.), which are returned as the result.

---

##### **Example 4: Linking a Non-Existent Node**

```javascript
await db.link("group_1", "non_existent_id")

// Output: ⚠️ One or both nodes (group_1, non_existent_id) do not exist.
```

In this example:

- The method logs a warning because the target node does not exist, and no changes are made.

---

#### **Key Notes**

1. **Direction Matters**:

   - Edges are followed _outward_ from the starting nodes during `$edge` traversals. The parent belongs in the **main** query and the children's filter inside `$edge`. Inverting them (e.g., `{ $edge: { id: parentId } }`) asks for descendants _equal to_ the parent, which is almost always empty.

2. **Edges Live on the Source Node**:

   - Each node carries an `edges` array of target IDs. `db.map()` callbacks expose it alongside `id`, `value`, and `timestamp`.

3. **Edge Cleanup**:

   - When a node is deleted with `db.remove()`, references to it in other nodes' edges are cleaned up automatically — no dangling edges.

4. **Persistence & Notifications**:
   - All changes made by `link` are persisted to storage and emitted to listeners and peers, keeping the graph consistent across the network.

---

#### **Use Cases**

1. **Modeling Relationships**: Use `link` to connect records (e.g., users to groups, orders to products, documents to revisions).
2. **Graph Traversal**: Combine `link` with the `$edge` operator to resolve deep, multi-hop relationships in a single declarative query.
3. **Hierarchies**: Build trees (categories, organizations, threads) by consistently linking from parent to child.

---

#### **Best Practices**

- **Create Nodes First**: Ensure both nodes exist (`db.put()`) before linking them; the method does not create missing nodes.
- **Choose Meaningful Directions**: Prefer natural directions (`order → items`, `group → members`, `parent → children`) so `$edge` traversals read intuitively.
- **Await the Call**: The method is asynchronous — always `await` it so ordering with subsequent queries is guaranteed.

---

This documentation provides a clear and concise explanation of the `link` method, including its behavior, parameters, error handling, and practical examples. Let me know if you'd like further clarification or additional examples! 😊
