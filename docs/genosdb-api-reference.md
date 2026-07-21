# 📘 API Reference

> Minimalist Graph Database with P2P support and real-time querying.

## 📦 Installation

```bash
npm install genosdb
```

## 📥 Import

### 1. Via NPM

```javascript
import { gdb } from "genosdb"
```

### 2. Direct use in browser from a CDN

```html
<script type="module">
  import { gdb } from "https://cdn.jsdelivr.net/npm/genosdb@latest/dist/index.min.js"
</script>
```

---

## ⚙️ Async Factory Function (for top-level await)

### `await gdb(name, options?)`

Creates and configures a database connection.

- **Parameters**:
  - `name` `{string}` – Database name (used for local storage or sync).
  - `options` `{Object}` _(optional)_:
    - `rtc` `{boolean | Object}` – If `true`, enables real-time P2P networking and relay connections.  
      To customize relays or TURN servers, pass an object:  
      `{ relayUrls, turnConfig }`
      - `relayUrls` `{string[]}` – Custom list of secure WebSocket relay URLs (for Nostr), now passed inside the `rtc` object.
      - `turnConfig` `{Array<Object>}` – Configuration for TURN servers, now passed inside the `rtc` object.
      - `cells` `{boolean | Object}` – Enable Cellular Mesh overlay for massive scalability. Pass `true` for defaults or an object with options: `{ cellSize, bridgesPerEdge, maxCellSize, targetCells, debug }`.
    - `sm` `{Object}` – Enables and configures the Security Manager. Provide at least `superAdmins` (an array of authorized addresses).
    - `ai` `{boolean}` – If `true`, loads the AI module.
    - `nlq` `{boolean}` – If `true`, loads the Natural Language for Queries module.
    - `geo` `{boolean}` – If `true`, loads the Geo module.
    - `audit` `{boolean}` – If `true`, loads the Audit module.
    - `password` `{string}` – Optional encryption key.
    - `debug` `{boolean}` _(optional)_ – If `true`, enables GenosDB's internal debug logging (persistence, synchronization, networking and module activity). The console stays fully silent by default. Defaults to `false`.
    - `saveDelay` `{number}` _(optional)_ – The debounce delay in milliseconds for saving the graph to persistent storage. Higher values reduce disk I/O under heavy write loads but increase the risk of data loss if the browser crashes. Defaults to `200`.
    - `oplogSize` `{number}` _(optional)_ – The maximum number of recent operations to keep in the operation log for delta-based P2P synchronization. Larger values allow peers to sync efficiently after longer disconnections but consume more memory. Defaults to `20`.

- **Returns**: `gdb` object.

#### Initialize without a password

```js
const db = await gdb("my-db")
```

#### Initialize with a password (optional)

```js
const secureDb = await gdb("secure-db", { password: "secret" })
```

#### `rtc` To explicitly enable the P2P networking module (opcional) 

```javascript
// Initialize with P2P networking enabled
const db = await gdb("my-db", { rtc: true }); // (rtc: true) for realtime updates
```

#### `relayUrls` (opcional)

To specify custom relays for Nostr when initializing the database:

```javascript
const db = await gdb("my-db", {
  rtc: {
    relayUrls: ["wss://relay1.example.com", "wss://relay2.example.com"]
  }
})
```

#### `turnConfig` (optional)

Once you have a TURN server, configure GenosDB with it like this:

```javascript
const db = await gdb("my-db", {
  rtc: {
    turnConfig: [
      {
        // single string or list of strings of URLs to access TURN server
        urls: ["turn:your-turn-server.ok:1979"],
        username: "username",
        credential: "password",
      }
    ]
  }
})
```

#### `cells` (optional) – Cellular Mesh Network

Enable the Cellular Mesh overlay for massive P2P scalability. This architecture organizes peers into logical "cells" with bridge nodes for inter-cell communication, reducing connection complexity from O(N²) to O(N).

```javascript
// Cells with default options
const db = await gdb("my-db", {
  rtc: { cells: true }
})

// Cells with custom configuration
const db = await gdb("my-db", {
  rtc: {
    cells: {
      cellSize: "auto",      // "auto" or fixed number (default: "auto")
      bridgesPerEdge: 2,     // redundancy between cells (default: 2)
      maxCellSize: 50,       // upper limit per cell (default: 50)
      targetCells: 100,      // target number of cells (default: 100)
      debug: false           // enable debug logging (default: false)
    }
  }
})

// Combined with custom relays and TURN
const db = await gdb("my-db", {
  rtc: {
    relayUrls: ["wss://relay.example.com"],
    turnConfig: [{ urls: ["turn:server.com:3478"], username: "user", credential: "pass" }],
    cells: { cellSize: 10, debug: true }
  }
})

```

---

## 🧩 Core Methods

### `use(middleware)`

Registers a middleware function to process or transform incoming P2P messages before they are applied to the local database. Middlewares are executed in the order they are registered.

- **Parameters**:
  - `middleware` `async {Function}` – An asynchronous function that receives an array of incoming operations. It **must** return a (potentially modified) array of operations to be processed. Returning an empty array `[]` will effectively discard the incoming batch.
- **Returns**: `{void}`

```js
// Middleware to log all incoming operations
db.use(async (operations) => {
  console.log('Received P2P operations:', operations);
  // Return the operations to allow them to be processed
  return operations;
});

// Middleware to block all 'remove' operations
db.use(async (operations) => {
  const filteredOps = operations.filter(op => op.type !== 'remove');
  console.log(`Filtering out ${operations.length - filteredOps.length} 'remove' operations.`);
  return filteredOps;
});
```

---

## 🧩 Core Methods

### `async put(value, id?)`

Inserts or updates a node.

- **Parameters**:
  - `value` `{Object}` – Node content (must be serializable).
  - `id` `{string}` _(optional)_ – If provided, updates the node.
- **Returns**: `{Promise<string>}` – Node ID (hash or custom).

```js
const id = await db.put({ type: "User", name: "Ana" })
await db.put({ name: "Ana B" }, id)
```

> **More examples**: See [PUT Guide](put-guide.md).

---

### `async get(id, callback?)`

Retrieves a node by its ID. If a `callback` is provided, it enters reactive mode, invoking the callback immediately with the node's state and on any subsequent changes.

- **Parameters**:
  - `id` `{string}`
  - `callback` `{Function}` _(optional)_ – The callback function, which receives the full node object (`{ id, value, edges, timestamp }`) or `null` if the node is deleted.
- **Returns**: `{Promise<Object>}` – A promise resolving to an object with:
  - `result`: The initial node state.
  - `unsubscribe`: A function to stop listening for updates (if in reactive mode).

```js
const { result } = await db.get(id)
```

> **More examples**: See [GET Guide](get-guide.md).

---

### `async link(sourceId, targetId)`

Creates a directed relationship between two nodes.

- **Parameters**:
  - `sourceId` `{string}`
  - `targetId` `{string}`
- **Returns**: `{Promise<void>}`

```js
await db.link(sourceId, targetId)
```

---

### `async remove(id)`

Deletes a node and its references.

- **Parameters**:
  - `id` `{string}`
- **Returns**: `{Promise<void>}`

```js
await db.remove(id)
```

---

### `async map(...args)`

Queries nodes and can listen for real-time updates.
It flexibly accepts zero or more arguments. Typically, these are:

- An **options object** (for `queryConfig`) to define filtering, sorting, etc.
- A **callback function** to process real-time updates.

The order of these arguments does not matter.

- **Arguments (`...args`)**:

  - `options` `{Object}` _(optional)_ – Configuration for the query. If an object is passed, its properties will be merged with the default query options.
    - `query` `{Object}` – MongoDB-style filter. Defaults to `{}` (all nodes). Supports advanced operators, including the recursive `$edge` operator for graph traversal.
    - `field` `{string}` _(optional)_ – Sort field.
    - `order` `{string}` _(optional)_ – `'asc'` | `'desc'`. Defaults to `'asc'`.
    - `$limit` `{number}` _(optional)_ – Limit the number of results.
    - `$after` `{string}` _(optional)_ – Paginate after a specific node ID.
    - `$before` `{string}` _(optional)_ – Paginate before a specific node ID.
    - `realtime` `{boolean}` _(optional)_ – Explicitly enable or disable real-time mode. If a `callback` is provided and `realtime` is not explicitly set to `false` in options, real-time mode is automatically enabled. Defaults to `false`.
  - `callback` `{Function}` _(optional)_ – If provided, enables real-time mode (unless `realtime: false` is in options). This function is invoked with an event object for:

    1.  Each node initially matching the query (`action: 'initial'`).
    2.  Any subsequent changes (additions, updates, removals) to nodes that match the query.

    - The callback receives a single event object argument. **It's common and recommended to destructure the properties you need directly in the function's signature. The most frequent and often sufficient signature is `({ id, value, action })`**.
    - This full event object contains:

      - `id` `{string}` – The ID of the node.
      - `value` `{Object}` – The content of the node. For the `'removed'` action, `value` will be `null`.
      - `edges` `{Array}` – An array of edges connected to the node. The developer can choose to use this data based on application needs.
      - `timestamp` `{Object}` – The node's Hybrid Logical Clock (HLC) timestamp (e.g., `{ physical: number, logical: number }`). For the 'removed' action, this is the HLC of the removal event.

      - `action` `{string}` – Indicates the type of event:
        - `'initial'`: For existing nodes matching the query when `map` is first subscribed. This provides the initial dataset directly to the callback, often making separate handling of the `results` array (returned by `map`) unnecessary for real-time UI updates.
        - `'added'`: When a new node matching the query is inserted.
        - `'updated'`: When an existing node matching the query is modified.
        - `'removed'`: When a node matching the query is deleted.

    - **If you also need `edges` or `timestamp`, you can easily include them in the destructuring: `({ id, value, action, edges, timestamp })`.**

---

- **Returns**: `Promise<Object>` – A Promise that resolves to an object containing:

  - `results`: `Array<Object>` – An array of nodes that match the query at the time of the call. Each node object includes `id`, `value`, `edges`, and `timestamp`.

  - `unsubscribe`: `Function` _(optional)_ – If real-time mode is active, this function is provided to stop listening for updates. Calling it will remove the real-time listener.

---

### Recursive Graph Traversal Queries with the `$edge` Operator

This is one of the most powerful features of GenosDB. The `$edge` operator transforms a standard query into a **graph exploration tool**. It uses the initial matching nodes as starting points to traverse their entire descendant tree (children, grandchildren, and so on), returning a final, flat list of all descendant nodes that match the specified criteria.

This allows you to perform complex, multi-hop graph traversals within a single, declarative query.

##### How It Works

A query with `$edge` has two logical parts:

1.  **The Starting Point Query:** The main part of the query object (`type`, `name`, etc.) is used to find the node(s) from which the traversal will begin.
2.  **The Descendant Filter:** The object provided as the value for `$edge` is a sub-query that will be applied to **every single node** found during the exploration of the descendant tree.

The final result of `db.map()` will be an array of the descendant nodes that matched the `$edge` sub-query, not the starting nodes.

##### Syntax and Example

```javascript
// From a 'Folder' node named 'Documents', find all descendant 'File' nodes
// that are either images or have a size greater than 1024 bytes.

const { results } = await db.map({
  query: {
    // 1. This part finds the starting point(s) for the traversal.
    type: "Folder",
    name: "Documents",

    // 2. This operator starts the exploration from the found folder(s).
    $edge: {
      // 3. This sub-query is applied to EVERY descendant.
      // It can use any operator, including logical ones.
      type: "File",
      $or: [{ extension: "jpg" }, { size: { $gt: 1024 } }],
    },
  },
})

// `results` will be an array containing only the File nodes that matched the
// $or condition, regardless of their depth in the folder structure.
console.log(results)
```

This approach gives you complete control to pinpoint specific nodes within complex, nested structures, making it an essential tool for any graph-based application.

```js
// --- Static Query ---
// Get filtered and sorted nodes (options object)
const { results } = await db.map({
  query: { type: "user" },
  field: "name",
  order: "asc",
})
console.log("Sorted users:", results)

// --- Real-time Query ---
// Listen to all nodes in real-time (only callback function)
// Note: The `map` call also returns `results` containing the initial data set.
// const { results: initialData, unsubscribe } = await db.map(...);

// Notice how the callback in the example below uses the concise `({ id, value, action })` signature
// to process events, destructuring only the necessary properties.
const { unsubscribe } = await db.map(({ id, value, action }) => {
  // In this example, 'edges' and 'timestamp' are available in the event object
  // but are not explicitly destructured or used for brevity.
  if (action === "initial") {
    console.log(`[INITIAL DATA] ID: ${id}`, value)
  }
  if (action === "added") {
    console.log(`[NODE ADDED] ID: ${id}`, value)
  }
  if (action === "updated") {
    console.log(`[NODE UPDATED] ID: ${id}`, value)
  }
  if (action === "removed") {
    console.log(`[NODE REMOVED] ID: ${id}`) // 'value' might be null or last known state
  }
})

// To stop listening for real-time updates:
// if (unsubscribe) unsubscribe();

// Best practice: When using db.map() callback, prefer destructuring parameters like `({ id, value, action }) => { ... }`.
// This approach improves readability by directly extracting properties from the event object,
// making the code cleaner and easier to maintain.
```

> **More examples**: See - [MAP Guide](map-guide.md) for logical operators and pagination.

---

### `async clear()`

Removes all nodes and indexes.

- **Returns**: `{Promise<void>}`

```js
await db.clear()
```

---

### GenosRTC API Reference

> **Note:** All features described in this section are available only when the database is initialized with the `{ rtc: true }` option, as this enables the GenosRTC module.

Every `GDB` object includes a `db.room` object, powered by the internal **GenosRTC** module, for real-time peer-to-peer communication.

The `db.room` object allows you to handle peer connections, send data, and stream audio/video directly between users.

#### Key Concepts

- **Joining a Room**: A room is automatically created and joined when you instantiate `GDB`. The database name serves as the room identifier.
- **Events**: Use `db.room.on(eventName, callback)` to react to events.
- **Data Channels**: Use `db.room.channel(type)` to send and receive any kind of data.
- **Media Streams**: Use `db.room.addStream(stream)` to send audio or video.

---

#### Handling Peer Connections

Listen for peers joining or leaving the room.

```javascript
// A peer joins the room
db.room.on("peer:join", (peerId) => {
  console.log(`Peer ${peerId} has joined.`)
})

// A peer leaves the room
db.room.on("peer:leave", (peerId) => {
  console.log(`Peer ${peerId} has left.`)
})
```

---

#### Sending & Receiving Data

Create a named channel to send and receive data like chat messages or game states.

```javascript
// Create a channel for cursor positions
const cursorChannel = db.room.channel("cursor-positions")

// Listen for data from other peers
cursorChannel.on("message", (position, peerId) => {
  console.log(`Peer ${peerId} moved their cursor to:`, position)
  // Example: update cursor position in the UI
})

// Send your data to all peers
window.addEventListener("mousemove", (e) => {
  cursorChannel.send({ x: e.clientX, y: e.clientY })
})
```

---

#### Streaming Audio & Video

Capture the user's webcam and stream it to other peers in the room.

```javascript
// Get user's camera and microphone
const localStream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
})

// Send the stream to everyone in the room
db.room.addStream(localStream)

// Listen for streams from other peers
db.room.on("stream:add", (stream, peerId) => {
  console.log(`Receiving a video stream from ${peerId}.`)
  // Example: create a <video> element and attach the stream
})
```

> For more details and advanced options, please refer to the complete **[GenosRTC API Reference](https://github.com/estebanrfp/gdb/wiki/GenosRTC-API-Reference)** documentation.

---

## 🧪 API Status: Stable Beta

> The GenosDB API is currently in a stable beta. We are actively adding features and improving stability.
> We recommend checking the [CHANGELOG](https://github.com/estebanrfp/gdb/blob/main/CHANGELOG.md) as we continue to refine the API for its first stable release.

---

## 💡 Best Practices & UI/UX Patterns

### 1. Embrace Top-level `await` for Cleaner Code

GenosDB is initialized using an **Async Factory Function**: `await gdb(...)`. In modern environments like `<script type="module">`, you should leverage **Top-level `await`**.

This allows you to use `await` directly at the top level of your script, avoiding unnecessary `async` function wrappers and leading to simpler, more readable code.

**Recommended Practice: Direct Initialization**

Initialize the database and set up your listeners directly. The code flows naturally from top to bottom.

```javascript
// Inside <script type="module">
import { gdb } from "genosdb";

// 1. Initialize the database directly.
const db = await gdb("my-app");

// 2. Set up real-time listeners immediately after.
await db.map({ query: { type: "user" } }, (event) => {
  console.log(`User event: ${event.action}`, event.value);
  // Update UI based on the event
});

// The 'db' instance is now ready for use anywhere else in your script.
```

Only wrap logic in an `async` function when it needs to be triggered by a user action that occurs after the initial page load, like a button click.

### 2. Use Destructuring in Callbacks for Clarity

The event object passed to your `db.map()` callback contains properties like `id`, `value`, and `action`. Using JavaScript's object destructuring directly in the function signature makes your code more readable and self-documenting.

**Recommended Practice:** Extract only the properties you need.

```javascript
// ✅ Clear and direct
await db.map({ query: { type: "post" } }, ({ id, value, action }) => {
  if (action === "added") {
    console.log(`New post added with ID ${id}:`, value.title);
  }
});
```

This makes it immediately clear which parts of the event your logic depends on.

---

### 3. Always Clean Up Subscriptions to Prevent Memory Leaks

When you use `db.map()` with a callback, it creates an active listener that runs until you stop it. Failing to stop the listener when it's no longer needed (e.g., when a user navigates away) will cause memory leaks.

**Recommended Practice:** Always store the returned `unsubscribe` function and call it when the component or view is destroyed.

```javascript
// 1. Store the function when you subscribe.
const { unsubscribe } = await db.map(
  { query: { type: "task" } },
  (event) => { /* ... update UI ... */ }
);

// 2. Call it when you're done.
// For example, in a Single-Page Application (SPA) when a component unmounts:
// onCleanup(() => {
//   unsubscribe();
//   console.log("Task listener stopped.");
// });
```

This is crucial for building stable, long-running applications.

### 4. Distinguish Between Persistent State and Ephemeral Events

GenosDB offers two distinct channels for P2P communication. Using the right one is crucial for performance and building a scalable application.

Ask yourself: **"Does this data need to survive a page refresh?"**

#### 1. Database Sync (for Persistent State)

If the answer is **YES**, use the core database methods. This is for data that represents the shared state of your application.

-   **Use:** `db.put()`, `db.link()`, `db.remove()`
-   **Examples:** User profiles, document content, to-do list items.

```javascript
// This data is saved and synced permanently.
await db.put({ type: 'todo', text: 'Buy milk', completed: false });
```

#### 2. Real-time Messaging with `db.room` (for Ephemeral Events)

If the answer is **NO**, use `db.room`. This is for high-frequency, temporary messages that do not need to be stored.

-   **Use:** `db.room.channel(...).send()`
-   **Examples:** Live cursor positions, "user is typing" notifications, temporary alerts.

```javascript
// This message is sent to peers but does NOT touch the database.
const cursorChannel = db.room.channel("cursors"); // Channel identifier in UTF‑8 (max 12 bytes).
cursorChannel.send({ x: 120, y: 345 });
```

This distinction prevents you from overloading the database with temporary data and ensures your application remains fast and efficient.
---

### 5. Code for Modernity, Clarity, and Performance

To get the most out of GenosDB, we recommend adopting a modern and efficient coding style. Prioritize ES2020+ features like `async/await`, destructuring, and optional chaining (`?.`) to write code that is both **compact and highly readable**.

Emphasize immutability and favor high-performance patterns, such as using array methods (`.map`, `.filter`) over traditional loops. This approach not only improves the maintainability and reliability.

---

### 🚀 What's Next? Your Journey with GenosDB

You now have the tools and best practices to build powerful, real-time, and decentralized applications. Whether you're creating a collaborative tool, a social platform, or the next big P2P game, the reactive and simple API of GenosDB is designed to help you succeed.

We're excited to see what you'll create. Here are some next steps to continue your journey:

*   **📖 Explore Practical Examples:** Dive into our [examples guide](https://github.com/estebanrfp/gdb/blob/main/docs/genosdb-examples.md) to see complete, working code for common use cases.
*   **🛰️ Master Real-Time Communication:** For advanced P2P features like video and audio streaming, consult the full **[GenosRTC API Reference](https://github.com/estebanrfp/gdb/blob/main/docs/genosdb-api-reference.md)**.
*   **🐞 Report Bugs & Contribute:** Your feedback is invaluable. If you find a bug or have an idea, please [open an issue on GitHub](https://github.com/estebanrfp/gdb/issues). Contributions are always welcome!

### 🧪 API Status: Stable Beta

The GenosDB API is currently in a **stable beta**. We are actively adding features and improving stability. As we work towards our first major release, we recommend checking the [CHANGELOG](https://github.com/estebanrfp/gdb/blob/main/CHANGELOG.md) for the latest updates.

Happy hacking

