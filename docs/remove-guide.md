### **Method: `remove(id)`**

#### **Description**
The `remove` method deletes a node from the graph by its unique identifier (`id`). It also ensures that any references to the removed node (e.g., edges) are cleaned up, maintaining the integrity of the graph. Once the node is removed, the changes are persisted to storage, and listeners are notified of the deletion.

This method is useful for removing nodes from the graph while ensuring data consistency and real-time updates.

---

#### **Parameters**
1. **`id`** (required):  
   - Type: String  
   - Description: The unique identifier of the node to be removed. If the node with the specified `id` does not exist, an error message will be logged, and the method will exit without making changes.

---

#### **Behavior**
1. **Node Lookup**:
   - The method first checks if a node with the given `id` exists in the graph. If no such node is found, an error message is logged, and the method exits.

2. **Node Removal**:
   - The node with the specified `id` is deleted from the graph.

3. **Edge Cleanup**:
   - Any references to the removed node (e.g., edges pointing to it) are cleaned up from other nodes in the graph. This ensures that the graph remains consistent and free of dangling references.

4. **Persistence**:
   - Changes are saved to persistent storage (e.g., OPFS) using `saveGraphToOPFS`.

5. **Notification**:
   - The method emits an event to notify listeners of the deletion using `sendData` and `emit`. This is useful for real-time synchronization in distributed systems.

---

#### **Returns**
- **Nothing**:  
  - The method does not return any value. However, it logs an error message if the specified node does not exist.

---

#### **Examples**

```javascript
// (rtc: true) for realtime updates
const db = await gdb("my-db", { rtc: true });
```

##### **Example 1: Removing a Node**
```javascript
// Add a node to the graph
const nodeId = await db.put({ name: "Alice", age: 25 });

// Remove the node by its ID
await db.remove(nodeId);

console.log(`Node with ID '${nodeId}' has been removed.`);
```

In this example:
- A node is added to the graph with the value `{ name: "Alice", age: 25 }`.
- The node is then removed using its `id`.

---

##### **Example 2: Removing a Non-Existent Node**
```javascript
// Attempt to remove a non-existent node
await db.remove("non_existent_id");

// Output: Error: Nodo con ID 'non_existent_id' no encontrado.
```

In this example:
- The method logs an error message because no node with the specified `id` exists in the graph.

---

##### **Example 3: Cleaning Up Edges**
```javascript
// Add two nodes to the graph
const nodeId1 = await db.put({ name: "Alice", age: 25 });
const nodeId2 = await db.put({ name: "Bob", age: 30 });

// Remove node2
await db.remove(nodeId2);

console.log("Edges of node1 after removal:", db.graph.nodes[nodeId1].edges);
// Output: Edges of node1 after removal: []
```

In this example:
- A relationship (edge) is created between two nodes.
- When the second node is removed, the edge referencing it is automatically cleaned up.

---

#### **Key Notes**
1. **Error Handling**:
   - If the specified `id` does not exist in the graph, the method logs an error message (`Nodo con ID '<id>' no encontrado.`) and exits without making changes.

2. **Edge Cleanup**:
   - The method ensures that any edges pointing to the removed node are removed from other nodes. This prevents dangling references and maintains graph integrity.

3. **Persistence**:
   - All changes made by `remove` are persisted to storage using `saveGraphToOPFS`. This ensures durability of the graph.

4. **Notifications**:
   - The method emits events to notify listeners of the deletion. This is useful for real-time updates in distributed systems or collaborative applications.

---

#### **Use Cases**
1. **Deleting Records**: Use `remove` to delete nodes from the graph when records are no longer needed (e.g., users, products).
2. **Maintaining Graph Integrity**: The automatic cleanup of edges ensures that the graph remains consistent after a node is removed.
3. **Real-Time Updates**: The notification mechanism allows other parts of the application (or other peers) to react to the deletion in real time.

---

#### **Best Practices**
- **Validate IDs**: Always ensure that the `id` you pass to `remove` exists in the graph to avoid unnecessary error messages.
- **Handle Errors Gracefully**: If your application relies on the removal of nodes, consider wrapping the `remove` call in a try-catch block to handle errors programmatically.
- **Test Edge Cases**: Test scenarios where nodes have multiple edges or where the graph is heavily interconnected to ensure proper cleanup.

---

This documentation provides a clear and concise explanation of the `remove` method, including its behavior, parameters, error handling, and practical examples. Let me know if you'd like further clarification or additional examples! 😊