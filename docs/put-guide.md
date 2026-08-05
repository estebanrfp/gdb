### **Method: `put(value, id)`**

#### **Description**
The `put` method inserts or updates a node in the graph with the specified `value` and `id`. If no `id` is provided, it generates a unique hash based on the `value` to serve as the node's identifier. The method ensures that changes are persisted to storage and notifies listeners of the update.

This method is useful for adding new nodes or updating existing ones in the graph.
---

#### **Parameters**

1. **`value`** (required):

   - Type: Any serializable data (e.g., object, string, number, etc.)
   - Description: The value to be stored in the node. This represents the data associated with the node.

2. **`id`** (optional):
   - Type: String
   - Description: The unique identifier for the node. If not provided, the method will automatically generate a hash based on the `value`.

---

#### **Returns**

- **`id`**:
  - Type: String
  - Description: The unique identifier (`id`) of the inserted or updated node. If the `id` was not provided, this will be the generated hash.

---

#### **Behavior**

1. **Insertion or Update**:

   - If a node with the given `id` already exists, its `value` is updated.
   - If no node exists with the given `id`, a new node is created.

2. **Automatic ID Generation**:

   - If no `id` is provided, the method generates a unique hash using the `generateHash` function and the serialized `value`.

3. **Persistence**:

   - Changes are saved to persistent storage (e.g., OPFS) using `saveGraphToOPFS`.

4. **Notification**:
   - The method emits an event to notify listeners of the change using `sendData` and `emit`.

---

#### **Examples**

```javascript
// (rtc: true) for realtime updates
const db = await gdb("my-db", { rtc: true })
```

##### **Example 1: Inserting a New Node**

```javascript
// Add a new node with a specific value
const newNodeId = await db.put({ name: "Alice", age: 25 })

console.log("New Node ID:", newNodeId)
// Output: New Node ID: <generated-hash>
```

In this example:

- A new node is created with the value `{ name: "Alice", age: 25 }`.
- Since no `id` is provided, a unique hash is generated and returned.

---

##### **Example 2: Updating an Existing Node**

```javascript
// Add a node with a specific ID
await db.put({ name: "Bob", age: 30 }, "user_123")

// Update the node's value
await db.put({ name: "Bob", age: 31 }, "user_123")

console.log("Updated Node ID:", "user_123")
// Output: Updated Node ID: user_123
```

In this example:

- A node with the ID `"user_123"` is first created.
- Later, the same node is updated with a new value (`age: 31`).

---

##### **Example 3: Automatic ID Generation**

```javascript
// Add a node without specifying an ID
const nodeId = await db.put({ product: "Laptop", price: 999 })

console.log("Generated Node ID:", nodeId)
// Output: Generated Node ID: <hash-based-on-value>
```

In this example:

- The method automatically generates a unique hash for the node based on the serialized value `{ product: "Laptop", price: 999 }`.

---

##### **Example 4: Using a Custom ID**

```javascript
// Add a node with a custom ID
await db.put({ category: "Electronics" }, "custom_id_456")

console.log("Custom Node ID:", "custom_id_456")
// Output: Custom Node ID: custom_id_456
```

In this example:

- A node is created with a custom ID `"custom_id_456"`.

---

#### **Key Notes**

- **Persistence**: All changes made by `put` are persisted to storage using `saveGraphToOPFS`. This ensures durability of the data.
- **Notifications**: The method emits events to notify listeners of the change. This is useful for real-time updates in applications.
- **Hash Generation**: If no `id` is provided, the method uses `generateHash` to create a unique identifier based on the serialized `value`.

---

#### **Error Handling**

- If the `value` cannot be serialized (e.g., contains circular references), the method may throw an error during hash generation or storage.
- Ensure that the `id` provided (if any) is unique to avoid overwriting existing nodes unintentionally.

---

#### **Use Cases**

1. **Adding New Data**: Use `put` to insert new nodes into the graph when creating records (e.g., users, products).
2. **Updating Existing Data**: Use `put` to modify the value of an existing node by providing its `id`.
3. **Automatic ID Management**: When you don't need to manage IDs manually, rely on the automatic hash generation feature.

---
