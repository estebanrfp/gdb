## `map()` Method - Pagination Features Documentation

### 1. **Cursor-Based Pagination**

Optimized for infinite scroll and large datasets:

```javascript
{
  $after: "LAST_ELEMENT_ID",   // Get next page
  $before: "FIRST_ELEMENT_ID", // Get previous page
  $limit: 10                   // Items per page
}
```

- **Advantages:**
  - Efficient with large datasets (no offset)
  - Stable with real-time data changes
  - Ideal for consistent sorting

### 2. **Custom Sorting**

```javascript
{
  field: "timestamp",  // Sort field
  order: "desc"        // Direction (asc/desc)
}
```

- Supported fields: Any existing node property
- Defaults to insertion order if no field specified

### 3. **Real-Time Mode**

```javascript
{
  realtime: true // Enable live updates
}
```

- Callback notifications:
  - `added`: New matching elements
  - `removed`: Elements that no longer match query
- Returns `unsubscribe()` method to stop updates

### 4. **Result Control Parameters**

| Parameter | Type   | Description              | Default |
| --------- | ------ | ------------------------ | ------- |
| `$limit`  | number | Max results per page     | null    |
| `$after`  | string | Cursor for next page     | null    |
| `$before` | string | Cursor for previous page | null    |

### 5. **State Persistence**

Implementation example:

```javascript
// Save state
localStorage.setItem("currentCursor", lastCursor)
localStorage.setItem("prevCursors", JSON.stringify(cursors))

// Restore state
const lastCursor = localStorage.getItem("currentCursor")
```

### 6. **Key Features**

- **Bidirectional:** Forward/backward pagination
- **Efficient:** No full dataset scanning
- **Consistent:** Maintains integrity with changing data
- **Configurable:** Flexible parameter combinations

### 7. **Typical Workflow**

```
graph TD
    A[Initial Query] --> B{More data?}
    B -->|Yes| C[Show $limit items]
    C --> D[Save end cursor]
    B -->|No| E[Show "End of data"]
    D --> F[User scrolls]
    F --> G[Request next page with $after]
```

### 8. **Error Handling**

- **Invalid cursor:** Throws `Cursor not found` error
- **Invalid sort field:** Uses natural insertion order
- **Limit exceeded:** Auto-adjusts to max available

### 9. **Return Structure**

Real-time mode response:

```typescript
{
  results: Node[],       // Current matches
  unsubscribe: Function  // Stop updates
}
```

### Complete Usage Example

```javascript
// Basic pagination
const options = {
  field: "timestamp",
  order: "desc",
  $limit: 15,
  $after: "d5f3g2",
}

// With real-time updates
const { results, unsubscribe } = await db.map(
  { category: "news" },
  { ...options, realtime: true },
  (newResults) => updateUI(newResults)
)
```

This implementation follows:

- Observer Pattern for updates
- ACID criteria for data consistency
- Facebook/Twitter-style pagination
- Performance optimizations for large datasets

[Infinite Scroll Example](https://github.com/estebanrfp/gdb/blob/main/examples/infinite-scroll.html)
