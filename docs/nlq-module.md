![image](https://github.com/user-attachments/assets/2c6e7853-07c0-4e63-851f-7f21f8be1f3a)

---

# NLQ Module Documentation

## Overview

The NLQ (Natural Language Query) module adds a thin prompt-to-query layer to GenosDB. Its only responsibility is to convert simple natural-language prompts into standard operator-based queries that GenosDB understands.

Important: NLQ does not perform AI, model inference, content generation, or value transformations. It only translates prompts into operator queries and executes them like any other query.

Language: Controlled English only. NLQ recognizes a fixed set of English patterns/keywords; other languages are not supported.

---

## Key Features

- Prompt-to-operator query translation only
- No external services or model calls
- Opt-in via `{ nlq: true }`

---

## Installation

Enable NLQ when initializing the database:

```javascript
import { gdb } from 'genosdb'

const db = await gdb('my-db', { rtc: true, nlq: true })
```

This enables NLQ. No additional imports or helpers are required.

---

## Usage

Provide a single `prompt` string. NLQ will translate it into an operator-based query and execute it.

```javascript
const { results } = await db.map({ prompt: 'Finds only Companies' })
```

Results are the same as any operator-based query in GenosDB. NLQ does not modify node values or add/remove fields.

---

## Supported Language (Cheat‑Sheet)

Below are the natural-language patterns that NLQ recognizes and how they map to GenosDB query objects. Examples here mirror the examples in the sandbox and the test suite.

### Types and Base Selection

- only X / a|an X (capitalized): sets `query.type` to the singular of X
  - “Finds only Companies” → `{ query: { type: 'Company' } }`
  - “Finds only Employees” → `{ query: { type: 'Employee' } }`

### Descendant Chains (`$edge`)

- X descendant / descendant of X / child of X / grandchild → builds nested `$edge` queries
- named|called|with name Y: sets `name: Y` at the current descendant level
- Example:
  - “Finds a Company, then finds a Developer descendant, then finds that Developers descendant named Bob.”
  - → `{ query: { type: 'Company', $edge: { role: 'Developer', $edge: { name: 'Bob' } } } }`

### Field Existence and Equality

- with FIELD exists / has|having FIELD / whose FIELD exists → `{ FIELD: { $exists: true } }`
- with FIELD VALUE → equality on FIELD
  - “Find a Company, then a descendant of type Employee with level Senior”
  - → `{ query: { type: 'Company', $edge: { $and: [{ type: 'Employee' }, { level: 'Senior' }] } } }`

### Contains and Membership

- FIELD contains X / whose FIELD contains "X" → `{ FIELD: { $regex: 'X' } }`
- FIELD includes X, Y / has X, Y → `{ FIELD: { $in: ['X','Y'] } }`

### Starts/Ends With, Like, Text

- FIELD starts with X → `{ FIELD: { $regex: '^X' } }`
- FIELD ends with X → `{ FIELD: { $regex: 'X$' } }`
- FIELD like "J%" → `{ FIELD: { $like: 'J%' } }`
- Full text search "term" / Text search "term" → best‑effort fallback to `$or` across common text fields (case‑insensitive):
  `{ $or: [ { name: { $regex: 'term' } }, { role: { $regex: 'term' } }, { level: { $regex: 'term' } }, { country: { $regex: 'term' } }, { title: { $regex: 'term' } }, { body: { $regex: 'term' } }, { tags: { $in: ['term'] } } ] }`
  - Notas: `$regex` es case‑insensitive; en `tags` se usa `$in` (coincidencia exacta del término en el array).
  - También acepta una sola palabra sin comillas (p. ej., `Full text search JavaScript`). Para frases con espacios, usa comillas.

### Comparators and Ranges

- FIELD > N / >= / < / <= / equals N → `$gt/$gte/$lt/$lte/eq`
- FIELD between A and B → `{ FIELD: { $between: [A, B] } }`
  - Numbers: “age between 30 and 40” → `{ age: { $between: [30, 40] } }`
  - Dates (ISO): “hireDate between 2020-01-01 and 2020-12-31” → `{ hireDate: { $between: ['2020-01-01','2020-12-31'] } }`

### Lists and OR

- FIELD in A, B, C → `{ FIELD: { $in: ['A','B','C'] } }`
- FIELD is A or B (or C) → `{ FIELD: { $in: [...] } }` (simple phrasing)
- Binary OR (two simple clauses): “FIELD1 is X or FIELD2 is Y” → `{ $or: [ { FIELD1: 'X' }, { FIELD2: 'Y' } ] }`

### IDs

- id 5 → `{ id: 5 }`
- ids 4, 5, 8 → `{ id: { $in: [4, 5, 8] } }`

### Sorting, Limit, Cursors

- order by FIELD asc|desc / order desc by FIELD → `field`, `order`
- limit N → `$limit: N`
- after <id> / starting after <id> → `$after: '<id>'`
- before <id> / until <id> → `$before: '<id>'`

#### Using Cursors Correctly ($after / $before)

Cursors operate over the current ordered result set. The id you provide must exist in that set; otherwise, the slice returns an empty list by design.

- Step 1: list with a stable order to obtain a real id
  - Example: “Get employees order asc by name limit 10”
- Step 2: apply the cursor with the same ordering
  - `$before`: “Get employees before <that-id> order asc by name limit 5” → up to 5 previous items
  - `$after`: “Get employees after <that-id> order asc by name limit 5” → up to 5 following items

Notes:
- Keep the same `order by …` between the listing and the cursor prompt so the index position is meaningful.
- If the id is at the start/end of the list, fewer items (or 0) may be returned.

### Output Normalization

- When multiple top-level conditions exist, NLQ normalizes to `$and`:
  - `{ type: 'Company', name: { $regex: '^G' } }`
  - → `{ $and: [ { type: 'Company' }, { name: { $regex: '^G' } } ] }`
- For descendant queries, nested `$and` is used when combining constraints at a given level.

### Return “Deepest” Nodes (Flattening)

- If your prompt specifies an additional “descendant named …” after a prior descendant step, NLQ flags the call to optionally flatten results to the deepest matching level (UI convenience).

---

## End‑to‑End Examples

These prompts are available in the sandbox and covered by tests:

- “Finds a Company, then finds descendant named Bob” → `{ type: 'Company', $edge: { name: 'Bob' } }`
- “finds descendant Developers” → `{ $edge: { role: 'Developer' } }`
- “Get posts order desc by id limit 3” → `{ field: 'id', order: 'desc', $limit: 3, query: {} }`
- “Find employees whose name starts with B order asc by name limit 10” → `{ name: { $regex: '^B' }, field: 'name', order: 'asc', $limit: 10 }`
- “Find employees whose name ends with son order asc by name limit 5” → `{ name: { $regex: 'son$' }, field: 'name', order: 'asc', $limit: 5 }`
- “Find employees whose age between 30 and 40 order asc by age limit 5” → `{ age: { $between: [30, 40] }, field: 'age', order: 'asc', $limit: 5 }`
- “Find employees whose hireDate between 2020-01-01 and 2020-12-31 order asc by hireDate limit 5” → `{ hireDate: { $between: ['2020-01-01', '2020-12-31'] }, field: 'hireDate', order: 'asc', $limit: 5 }`
- “Find a Company, then a descendant of type Employee whose tags includes JavaScript” → `{ type: 'Company', $edge: { $and: [ { type: 'Employee' }, { tags: { $in: ['JavaScript'] } } ] } }`
- “Find employees whose country is not USA” → `{ country: { $not: { $eq: 'USA' } } }`
- “Find employees whose name like \"J%\"” → `{ name: { $like: 'J%' } }`
- “Full text search \"Developer\"” → `{ $or: [ { name: { $regex: 'Developer' } }, { role: { $regex: 'Developer' } }, …, { tags: { $in: ['Developer'] } } ] }`
  - “Full text search \"developer\"” (case‑insensitive)
  - “Full text search \"JavaScript\"” (coincide también en `tags`)
  - “Full text search JavaScript” (una palabra sin comillas)
- “Get posts after node123 order asc by id limit 2” → `{ $after: 'node123', field: 'id', order: 'asc', $limit: 2, query: {} }`
- “Get posts before \"node-xyz\" limit 5” → `{ $before: 'node-xyz', $limit: 5, query: {} }`

---

## How It Works

1. You pass a `prompt` string to `db.map({ prompt })`.
2. NLQ parses it locally into `{ query, field?, order?, $limit?, $after?, $before? }`.
3. GenosDB executes it like any normal operator query.

---

## Best Practices

- Prefer explicit phrasing: “role in Developer, Designer” rather than “role is Developer or Designer”
- Quote multi-word values when possible: `named "John Doe"`
- Dates: use ISO (`YYYY-MM-DD`), optionally with time (`YYYY-MM-DDTHH:mm:ssZ`)
- NLQ is local and regex-based; keep prompts concise and unambiguous
- Language: use controlled English; non‑English words or unsupported forms may not be recognized

---

## Sandbox

- Live example: https://estebanrfp.github.io/gdb/examples/sandbox.html
- The sandbox includes all the prompts listed above and mirrors test coverage.
