# CRUD Operations Guide

## GenosDB provides several CRUD operations. Each has its own dedicated guide:

| Method                           | Description                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `put(value, id)`                 | Inserts or updates a node with the provided value. If `id` is not specified, it is automatically generated using a hash of the value. Triggers real-time synchronization.                                                            |
| `get(id, callback)`              | Retrieves the node with the specified ID and handles it using a callback function.                                                                                                                                                                                  |
| `get(id)`                        | Retrieves the node with the specified ID and returns its value directly.                                                                                                                                                                                            |
| `link(sourceId, targetId)`       | Creates a unidirectional relationship between two nodes identified by `sourceId` and `targetId`. Ensures both nodes exist before creating the link.                                                                                                                 |
| `map({}, ({ ...fields }) => {})` | Iterates over all nodes in the database. Executes callback for each node with destructured fields (e.g., id, value, edges, timestamp, action). If realtime is true, listens for future updates. If iterable is false, passes all nodes as an array to the callback. |
| `remove(id)`                     | Deletes a node by its ID. Also removes references to this node in other nodes' edges. Triggers real-time synchronization.                                                                                                            |
| `clear()`                        | Deletes all nodes, relationships, and indexes from the database. Removes associated files from OPFS.                                                                                                                                                                |

---

### Secure CRUD Operations (SM Module)

When the Security Manager (SM) is enabled, encrypted variants of the CRUD operations are available under `db.sm`. These methods automatically handle encryption, decryption, and the internal SM node prefix.

| Method                  | Description                                                                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db.sm.put(value, id)`  | Encrypts the value with the current user's key and stores it as a secure node. Returns the node ID (without SM prefix).                              |
| `db.sm.get(id, callback)` | Retrieves and decrypts a secure node. If the current user is the owner, the plaintext is returned; otherwise, the ciphertext. Supports realtime callbacks. |
| `db.sm.map(options)`    | Queries encrypted nodes using the same query language as `db.map()`. Decrypts all SM nodes in parallel, then applies `query`, `field`, `order`, and `$limit` on the decrypted data. Does not support realtime mode. |
| `db.sm.remove(id)`      | Deletes a secure node by its ID, automatically handling the internal SM prefix.                                                                      |

---

- [PUT Guide](put-guide.md)
- [GET Guide](get-guide.md)
- [MAP Guide](map-guide.md)
- [REMOVE Guide](remove-guide.md)
- [LINK Guide](link-guide.md)
