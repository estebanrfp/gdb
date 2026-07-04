# GenosDB 📌 `.map()` Method Documentation

---

### **Updated Documentation for `db.map`**

The `db.map` function is a powerful and flexible tool for querying data from your database. It supports both **static queries** and **real-time updates**, ensuring a seamless experience for developers. Below is the complete documentation with examples and usage details.

---

### **Examples**

```javascript
// (rtc: true) for realtime updates
const db = await gdb("my-db", { rtc: true })
```

### **1. Ways to Call `map`**

#### **a) Without Callback (Static Mode)**

You can call `map` without passing a callback. In this case, the function will return an object containing the filtered results as an array under the `results` property.

```javascript
const { results } = await db.map({
  query: { field: "value" },
  order: "desc",
  $limit: 10,
})
console.log(results)
```

- **Supported Parameters**:
  - An object with configuration options (`query`, `order`, `$limit`, etc.).
  - The `realtime` mode will not be activated.

---

#### **b) With Callback (Real-Time Mode)**

If you pass a callback, the function can automatically activate `realtime` mode unless you explicitly set `realtime: false`. The callback will handle real-time updates.

```javascript
const { unsubscribe } = await db.map(
  {
    query: { field: "value" },
    realtime: true,
  },
  (data) => {
    console.log(data.id, data.value)
  }
)

// Cancel the subscription when no longer needed
unsubscribe()
```

- **Supported Parameters**:
  - An object with configuration options.
  - A callback that handles the results.

---

#### **c) Callback with Detailed Notifications**

The callback receives **one object per node** — the node's data plus the `action` that triggered the notification — letting you react to each kind of change:

| Action | When it fires |
| --------- | ------------------------------------------------------------------------------------------------------- |
| `initial` | Once per node already matching the query when the subscription starts, delivered in `field`/`order` order. |
| `added`   | A node starts matching the query (created locally or received from a peer).                               |
| `updated` | A matching node's value, edges or timestamp changed.                                                      |
| `removed` | A node was deleted or stopped matching the query.                                                         |

> With `$limit`, `added` and `removed` also fire when a node enters or falls out of the result window.

```javascript
const { results, unsubscribe } = await db.map(
  {
    query: { field: "value" },
    realtime: true,
  },
  ({ id, value, action }) => {
    if (action === "initial") {
      console.log(`Existing node: ${id}`, value)
    } else if (action === "added") {
      console.log(`Node added: ${id}`, value)
    } else if (action === "removed") {
      console.log(`Node removed: ${id}`)
    } else if (action === "updated") {
      console.log(`Node updated: ${id}`, value)
    }
  }
)

// Cancel the subscription when no longer needed
unsubscribe()
```

- **Supported Parameters**:
  - An object with configuration options.
  - A callback receiving a single object per node: `{ id, value, edges, timestamp, action }`.

---

#### **d) Flexible Argument Order**

Arguments can be passed in any order, as long as an object is used for the options and a function for the callback.

```javascript
// Option 1: Callback first
await db.map(
  (data) => {
    console.log(data.id, data.value)
  },
  {
    query: { field: "value" },
    order: "asc",
  }
)

// Option 2: Options first
await db.map(
  {
    query: { field: "value" },
    order: "asc",
  },
  (data) => {
    console.log(data.id, data.value)
  }
)
```

---

### **2. Supported Parameters**

#### **a) Configuration Options**

Options are passed as an object and can include the following fields:

| Field        | Type              | Description                                                |
| ------------ | ----------------- | ---------------------------------------------------------- |
| `realtime`   | `boolean`         | Enables or disables real-time mode.                        |
| `query`      | `object`          | Defines conditions to filter nodes.                        |
| `field`      | `string`          | Field by which to order the results.                       |
| `order`      | `'asc' \| 'desc'` | Sorting direction.                                         |
| `$limit`     | `number`          | Maximum number of results to return.                       |
| `$after`     | `string`          | ID of the node after which to start.                       |
| `$before`    | `string`          | ID of the node before which to end.                        |
| `strictMode` | `boolean`         | Throws errors if attempting to access non-existent fields. |

Example:

```javascript
{
  query: { age: { $gt: 18 }, status: 'active' },
  field: 'name',
  order: 'asc',
  $limit: 5,
  $after: 'node123',
  strictMode: true
}
```

---

#### **b) Query Language**

The `query` field supports an advanced query language with special operators:

| Operator   | Description                                                                                  | Example                                                  |
| ---------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `$eq`      | Exact equality                                                                               | `{ age: { $eq: 25 } }`                                   |
| `$ne`      | Not equal                                                                                    | `{ age: { $ne: 25 } }`                                   |
| `$gt`      | Greater than                                                                                 | `{ age: { $gt: 18 } }`                                   |
| `$gte`     | Greater than or equal                                                                        | `{ age: { $gte: 18 } }`                                  |
| `$lt`      | Less than                                                                                    | `{ age: { $lt: 30 } }`                                   |
| `$lte`     | Less than or equal                                                                           | `{ age: { $lte: 30 } }`                                  |
| `$in`      | Value within an array                                                                        | `{ status: { $in: ['active', 'pending'] } }`             |
| `$between` | Value between two numbers or dates                                                           | `{ age: { $between: [18, 30] } }`                        |
| `$exists`  | Checks if a field exists                                                                     | `{ name: { $exists: true } }`                            |
| `$text`    | Text search within fields                                                                    | `{ $text: 'search term' }`                               |
| `$like`    | SQL-like pattern matching                                                                    | `{ name: { $like: 'J%' } }`                              |
| `$regex`   | Regular expression matching                                                                  | `{ name: { $regex: '^John' } }`                          |
| `$and`     | All conditions must be true                                                                  | `{ $and: [{ age: { $gt: 18 } }, { status: 'active' }] }` |
| `$or`      | At least one condition must be true                                                          | `{ $or: [{ age: { $gt: 18 } }, { status: 'active' }] }`  |
| `$not`     | Negates a condition                                                                          | `{ $not: { age: { $gt: 18 } } }`                         |
| `$edge`    | Performs a recursive graph traversal, returning all descendant nodes that match a sub-query. | { $edge: { type: 'Person', age: { $gt: 18 } } }          |

---

2.c) Recursive Graph Traversal Queries: The $edge Operator
The $edge operator is the cornerstone of Recursive Graph Traversal Queries in GenosDB. It transforms a standard query into a powerful graph exploration tool. Instead of filtering the starting nodes, it uses them as entry points to traverse their entire descendant tree (children, grandchildren, etc.), returning a final list of all descendant nodes that match the specified criteria.
Basic Syntax
The operator is added as a key to your main query object. The value of $edge is a sub-query object that will be applied to every descendant node found during the traversal.

```javascript
// General structure
{
  // 1. Conditions to find the starting node(s)
  "type": "Family",
  "name": "Perez",

  // 2. The traversal operator with its sub-query
  "$edge": {
    // 3. This sub-query will be applied to ALL descendants.
    // Only descendants matching this filter will be in the final result.
    "type": "Person",
    "age": { "$gt": 18 }
  }
}
```

The main part of the query ("type": "Family", ...) identifies the starting points for the traversal.
The $edge operator initiates the exploration from those starting points.
The sub-query object inside $edge acts as a filter for the descendants. The final result of db.map() will be an array of these matching descendants, not the starting nodes.

### **3. Practical Examples**

#### **Example 1: Static Query**

```javascript
const { results } = await db.map({
  query: { age: { $gt: 18 }, status: "active" },
  field: "name",
  order: "asc",
  $limit: 5,
})
console.log(results)
```

#### **Example 2: Real-Time Query**

```javascript
const { results, unsubscribe } = await db.map(
  {
    query: { status: "active" },
    realtime: true,
  },
  ({ id, value, action }) => {
    console.log(`[${action}] ${id}`, value)
  }
)

// Cancel the subscription when no longer needed
unsubscribe()
```

#### **Example 3: Complex Query with Operators**

```javascript
const { results } = await db.map({
  query: {
    $and: [
      { age: { $gte: 18 } },
      { age: { $lte: 30 } },
      { status: { $in: ["active", "pending"] } },
    ],
  },
  field: "age",
  order: "desc",
})
console.log(results)
```

#### **Example 4: Using `$like` and `$regex`**

```javascript
const { results } = await db.map({
  query: {
    name: { $like: "J%" },
    email: { $regex: "@example\\.com$" },
  },
  field: "name",
  order: "asc",
})
console.log(results)
```

---

### **4. Return Object**

The `db.map` function always returns an object with the following properties:

| Property      | Type       | Description                                                                              |
| ------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `results`     | `array`    | The filtered results as an array.                                                        |
| `unsubscribe` | `function` | A function to cancel the real-time subscription (only present if `realtime` is enabled). |

---

### **Conclusion**

The `db.map` function has been designed to provide a consistent and intuitive interface for querying data. By always returning an object with `results` and optionally `unsubscribe`, it eliminates confusion and ensures a smooth developer experience. Whether you're working with static queries or real-time updates, `db.map` is a versatile tool that adapts to your needs.

---

### **Key Updates in This Version**

- Added support for `$like` (SQL-like pattern matching) and `$regex` (regular expressions).
- Enhanced `$text` operator for nested field searches.
- Improved `$between` to support date ranges.
- Maintained backward compatibility with existing operators while adding new functionality.

---

### **Secure Variant: `db.sm.map(options)`**

When the Security Manager (SM) is enabled, `db.sm.map()` provides the same query capabilities as `db.map()` but operates on encrypted data stored via `db.sm.put()`.

#### **How It Works**

1. Fetches all SM-encrypted nodes from GDB.
2. Decrypts them in parallel using the current user's key.
3. Applies `query`, `field`, `order`, and `$limit` on the decrypted data using the same query engine as `db.map()`.

> **Note:** `db.sm.map()` does not support realtime mode. Each call performs a fresh decrypt-and-query cycle.

#### **Example**

```javascript
const db = await gdb("my-db", {
  rtc: true,
  sm: { superAdmins: ["0x1..."] }
})

// Store encrypted data
await db.sm.put({ name: "Alice", age: 25, status: "active" }, "alice")
await db.sm.put({ name: "Bob", age: 30, status: "inactive" }, "bob")

// Query encrypted nodes (same syntax as db.map)
const { results } = await db.sm.map({
  query: { status: "active", age: { $gte: 18 } },
  field: "name",
  order: "asc",
  $limit: 10,
})

console.log(results)
// [{ id: "alice", value: { name: "Alice", age: 25, status: "active" }, decrypted: true, ... }]
```

#### **Return Object**

| Property  | Type    | Description                              |
| --------- | ------- | ---------------------------------------- |
| `results` | `array` | The filtered and decrypted results.      |

Each result includes a `decrypted` boolean field: `true` if the current user owns and successfully decrypted the node, `false` otherwise.
