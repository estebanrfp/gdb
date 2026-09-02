# Migration Guide: from `new GDB()` to `await gdb(...)`

This guide helps you migrate from the class-based API (`new GDB()`) to the new async factory function (`await gdb(...)`). It covers key changes, before/after examples, Security Manager (SM) integration, and common pitfalls.

---

## Version upgrade notes

Changes between engine versions are documented in the [CHANGELOG](CHANGELOG.md). Two releases require action beyond updating:

- **0.27.0** — owned nodes written by earlier versions carry no provenance and stop travelling through catch-up: re-save an identity's owned nodes once after upgrading, and redeploy GenosSRV alongside your clients.
- **0.28.0** — `db.sm.put` records use the key-envelope format exclusively: records encrypted by earlier releases no longer decrypt, so re-save durable encrypted data once after upgrading.
- **0.32.0** — every node, tombstone and edge travels with its author's signature; state written by earlier versions carries none and stops travelling through catch-up until a superadmin signs in once, which re-signs everything it holds. Only an identity or a superadmin may write a `user:` node. Redeploy GenosSRV 0.10.0 with `GDB_SUPERADMINS` set. Passkeys created earlier keep working and gain PRF protection when protected again.

---

## Key changes

- Support for `new GDB()` has been removed.
  - Initialize with the async function: `const db = await gdb(name, options)`.
  - If you use `new GDB()`, an error will be thrown pointing to the correct call.
- Public operations API remains stable:
  - `put`, `get`, `map`, `remove`, `link`, `clear` keep their signatures and behavior.
- Internals exposed for module compatibility:
  - `db.hybridClock`, `db.graph`, `db.syncChannel` are available as read-only getters.
  - `db.ready` may exist for legacy uses, but prefer `await gdb(...)`.

---

## Quick migration (before → after)

### Basic initialization

Before:

```js
import { GDB } from 'genosdb';
const db = new GDB('my-db');
```

After:

```js
import { gdb } from 'genosdb';
const db = await gdb('my-db', { rtc: true }); // rtc: true for realtime comunication
```

### Using `map` (real-time subscription)

Before:

```js
const { unsubscribe } = await db.map(({ id, value, action }) => {
  // render
});
```

After (same API; ensure initialization via `await gdb(...)`):

```js
const { unsubscribe } = await db.map(({ id, value, action }) => {
  // render
});
```

### Using `get` (point-in-time and reactive)

Before:

```js
const { result } = await db.get(nodeId);
// or reactive
const { unsubscribe } = await db.get(nodeId, (node) => { /* ... */ });
```

After (no signature changes):

```js
const { result } = await db.get(nodeId);
// or reactive
const { unsubscribe } = await db.get(nodeId, (node) => { /* ... */ });
```

### Write and delete

Before:

```js
await db.put({ text: 'hello' });
await db.remove(nodeId);
```

After (no signature changes):

```js
await db.put({ text: 'hello' });
await db.remove(nodeId);
```

---

## Security Manager (SM) and RBAC integration

### Recommended initialization

```js
const db = await gdb("my-db", {
  rtc: true, 
  sm: {
    superAdmins: ["0x1...", "0x2..."] // superadmin addresses
  }
});

const sm = db.sm; // provided by SM module

```

Key points:
- `sm` is injected when passing `{ sm: { superAdmins: ['0x1...', '0x2...'] } }` at initialization. Access it via `db.sm`.
- Internals expected by SM (now exposed): `db.hybridClock`, `db.graph`, `db.syncChannel`.
- Standardized actions (recommended): `read`, `write`, `link`, `sync`, `delete`.

### Permission check (example)

```js
const active = sm.getActiveEthAddress();
if (!active) throw new Error('Login required');

// if not superadmin, validate permission
await sm.executeWithPermission('delete');
await db.remove(id);
```

---

## Browser usage (ESM)

- Using the local bundle:

```html
<script type="module">
  import { gdb } from "../dist/index.js";

  </script>
```

- Using the NPM package (if applicable):

```js
import { gdb } from 'genosdb';

```

---

## Common pitfalls and fixes

- Error: `db.map is not a function` or `db.put is not a function`
  - Cause: using `db` before initialization completes.
  - Fix: use `const db = await gdb('name')` before calling any method.

- SM error: `Cannot read properties of undefined (reading 'now')`
  - Cause: module expected `db.hybridClock` which was not exposed.
  - Status: Fixed; `hybridClock`, `graph`, and `syncChannel` are exposed as getters.

- `map` doesn’t emit after loading the graph
  - Ensure you call `await gdb(...)` before `db.map(...)`.
  - Confirm your `query`/$limit doesn’t filter out all nodes.

---

## Migration checklist

1) Replace all occurrences of `new GDB(name, options)` with `await gdb(name, options)`.
2) Ensure the first use of `db` always happens after `await gdb(...)`.
3) If you use SM:
   - Initialize with `{ sm: { superAdmins: ['0x1...', '0x2...'] } }` (mandatory `superAdmins` array).
   - The security context is set up automatically; no additional calls needed.
4) Review RBAC and use standardized actions (`read`, `write`, `link`, `sync`, `delete`).
5) Test end-to-end: initial load, `put`, update, `remove`, `link`, and P2P sync when applicable.

---

## FAQ

- Can I still use `db.ready`?
  - It may exist in some contexts, but it’s not recommended. Prefer `await gdb(...)`.

- Did `map` or `get` signatures change?
  - No. They still return `{ results, unsubscribe }` or `{ result, unsubscribe }` accordingly.

- How do I filter and order in `map`?
  - Use options: `{ query: {...}, field: 'timestamp', order: 'asc'|'desc', $limit, $after, $before }`.

---

## Full example (To‑Do List)

Before:

```html
<script type="module">
  import { GDB } from "../dist/index.js";
  const db = new GDB('todoList');
  const { unsubscribe } = await db.map(({ id, value, action }) => { /* ... */ });
</script>
```

After:

```html
<script type="module">
  import { gdb } from "../dist/index.js";
  const db = await gdb('todoList', { rtc: true });
  const { unsubscribe } = await db.map(({ id, value, action }) => { /* ... */ });
</script>
```

---

Need help? Open an issue with before/after code and the observed error; we’ll help you migrate quickly.
