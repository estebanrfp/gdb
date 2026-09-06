# 🔢 Ordered Lists — Fractional Order Keys

Paragraphs in a document, cards in a kanban column, siblings in an outline, tracks in a playlist: any list whose order the users control, shared by peers that insert, move and delete at the same time with no coordinator. GenosDB has no list type and needs none. Position is a **field on the node**, identity is the **node id**, and the engine guarantees that every peer reads the same order. This guide is the pattern the [block editor](https://estebanrfp.github.io/gdb/examples/block-editor.html) and the [outliner](https://estebanrfp.github.io/gdb/examples/outliner.html) run on, its one limit, and the rule the engine adds.

## What the engine guarantees

A sorted `map` — `{ field, order }` — returns the same order on every replica. Since 0.33.9 a tie on `field` breaks on the node id, in the direction of the sort, so `desc` is the exact reverse of `asc`, and `results`, the `initial` events and every `$limit` / `$after` / `$before` page agree between peers whatever order their nodes arrived in. `db.sm.map` and the Fallback Server apply the same rule.

The engine does not mint positions. `order` is a value your application writes, like any other field; what follows is how to write it.

## The pattern

Each item carries a numeric `order`. Inserting between two items means minting a key strictly inside their gap; moving an item means writing a new `order` on the **same id**; deleting is `remove`. One subscription renders the list:

```javascript
await db.map({ query: { type: "paragraph" }, field: "order", order: "asc" }, ({ id, value, action }) => {
  // place, move or drop the element for `id` by value.order
})
```

The keys come from one helper — the block editor's, four lines:

```javascript
// n fresh keys strictly between two neighbours: the gap is divided once into
// n slots and each key lands at a random point of the middle half of its slot.
// n = 1 is a single insert; `next` undefined appends, opening a fresh gap of 1.
const keysBetween = (prev, next, n = 1) => {
  const lo = prev ?? 0, step = ((next ?? lo + n) - lo) / n
  return Array.from({ length: n }, (_, i) => lo + step * (i + 0.25 + Math.random() * 0.5))
}
const keyBetween = (prev, next) => keysBetween(prev, next)[0]

const newId = await db.put({ type: "paragraph", text, order: keyBetween(orderOf(above), orderOf(below)) })
await db.put({ ...value, order: keyBetween(orderOf(newAbove), orderOf(newBelow)) }, id)   // a move: same id, new position
```

Concurrency falls out of the model:

- **Two peers insert into the same gap at once.** Each mints its own key at a random point of the gap, so both items survive, and the tie rule orders them identically everywhere. No counter to coordinate, no rebalancing to synchronise.
- **Two peers move the same item at once.** Both write the same node; last-write-wins on the hybrid logical clock keeps one `order`, deterministically, on every peer. One item, one place — never two copies.
- **One peer edits an item while another moves it.** Two fields of one node written concurrently resolve by the same rule at node level: the later write wins whole. Keep `text` and `order` in one node when that is the behaviour you want, and in two linked nodes when it is not.

## Where a float64 ends — and how a paste never gets there

A key is a double with 53 bits of mantissa. Every insert into the **same** gap keeps about half of what is left, so after roughly fifty successive inserts between the same two items the next key rounds onto a neighbour and the two tie (measured on the helper above: median 49, worst case 39). Typing a document top to bottom never gets there: every new item opens a fresh gap of 1. A multi-line paste into the middle of a list would, so it mints its keys in one batch — `keysBetween(prev, next, n)` — dividing the gap once into one slot per new line. Two hundred pasted lines spend about eight bits of mantissa, not all fifty-three.

![One gap between two items, split two ways. Panel A: one key per insert — each key lands in what is left of the same gap, about half of it, and after roughly fifty inserts a float64 key rounds onto a neighbour, a tie. Panel B: a paste of n lines divides the gap once into n slots, one key per slot at a random point inside it, so two hundred lines spend about eight bits of mantissa.](../assets/ordering-one-gap-two-splits.svg)

*Same gap, same scale. Inserting one key at a time halves what is left until a key lands on a neighbour; a paste divides the gap once and never gets close.*

When a tie does happen the list stays consistent — the engine orders the tied items by id, identically on every peer — but the tied item is no longer exactly where its writer put it. An application that can insert thousands of times into one gap of a very long list should re-key that region (rewrite the affected items' `order` with fresh keys, a batch of `put`s) or move to string keys. This pattern is sized for documents and boards: hundreds of items, occasional hot spots.

## Identity versus position

The same technique appears in collaborative spreadsheets, where [Bartosz Sypytkowski](https://www.bartoszsypytkowski.com/scaling-fractional-indexes/) scales fractional indexes to millions of rows, packing each key into eight bytes. In that design the key **is** the row's identity: to move a row you delete it and insert another, and two concurrent moves leave two rows unless a move CRDT — tombstones, a `moved` pointer per entry, a second key space — reconciles them. In GenosDB the id is the identity and `order` is a value the node carries, so a move is one `put` and concurrent moves resolve to one item in one place with no machinery at all.

![Where the key lives. Left, a fractional-index CRDT: the key names the row, so a move is a delete plus an insert, and two peers moving the same row leave two rows unless a move CRDT reconciles them. Right, GenosDB: the id names the item and order is a field, so each peer's move is one put on the same node and last-write-wins by hybrid logical clock keeps one item in one place.](../assets/ordering-identity-vs-position.svg)

*In a fractional-index CRDT the key names the row. In GenosDB the id names the item and position is a value it carries, so a move is the write the engine already knows how to do.*

The trade is explicit. His design pays that machinery to address a million rows by key; this pattern trades that scale for zero machinery at document scale. Should a million-row table be the target, his post is the map.

## See it running

- [block-editor.html](../examples/block-editor.html) — one node per paragraph; Enter and Backspace mint and merge, a multi-line paste mints its keys in one batch.
- [outliner.html](../examples/outliner.html) — siblings ordered by a fractional `rank`; Alt+↑/↓ reorders with one `put`, Tab and Shift+Tab move a branch with `link`/`unlink`.

Both are pinned by the conformance suites: a two-hundred-line paste lands as one node per line, in order and keyed strictly between its neighbours, on both peers; a sorted read orders exact ties identically on two peers whose nodes arrived in different orders.
