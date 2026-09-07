# Concurrent Writes: The Loser's Rescue

Two peers write the same node at the same instant, each over the same value. The store keeps one of the two — last-write-wins per node, ordered by the hybrid logical clock — and no edit is lost: the writer whose op lost the race re-applies its edit over the winner, as an ordinary signed write. No CRDT, no merged value that nobody signed.

## What the engine does

- A node remembers what it replaced. One step, in memory, never persisted.
- An op says what it wrote over: `base`, the stamp of the value it replaced. It travels in the op, outside the signature.
- An op arrives whose `base` is what the local value replaced: both wrote over the same value. The store keeps the winner, as always. If the local value lost, this peer merges the base, its own value and the winner, and writes the merge with `put` — signed by it, based on the winner. Every peer applies that write by the clock, as any other.
- If the local value won, nothing happens here: the other peer is the loser, and rescues its own edit.

## How two values merge

| Both changed… | The merge keeps |
|---|---|
| different fields of an object | each side's field |
| the same string, in different places | both edits, each in its place |
| the same span of a string | the winner's |
| a value that changes as a whole — a hash, a ciphertext, a replaced blob | the winner's: it never merges |
| anything else — arrays, numbers, booleans | the winner's |

A string merges by the one region each side changed, found by common prefix and suffix. A ciphertext or a hash changes end to end, so its regions always overlap and the winner keeps it: opaque values are safe by construction.

## What it costs

| | |
|---|---|
| when nothing is concurrent | one stamp comparison per applied op |
| metadata persisted | none: no per-field clocks, no per-character ids, no tombstones |
| on the wire | one stamp per op, `base` |
| in memory | the previous value of each node written in this session, one step |
| per collision | one extra signed write, from the loser |

## What stays as it was

- Divergence deeper than one step — the base is no longer what the other side replaced, or a peer reloaded and forgot — resolves by the clock, as before.
- Three writers at one instant: two rescue each other; the third may still lose.
- A removal beats an edit, as before.
- Peers that send no `base` neither rescue nor are rescued.
- Nothing unsigned is ever stored: the merge is written and signed by a writer who could write there.

## What an application must do

Nothing, unless it holds its own copy of a value while a person edits it. An editor that keeps a line in a text field must paint an incoming value over what is being typed without losing the keystrokes not yet written — otherwise its next write, based on the winner, undoes the rescue. The [block editor](../examples/block-editor.html) shows how.

Pinned by `lib/tests/concurrency/rescue.spec.js`: two peers write at the same instant from one base and both edits end on both peers; an undo made after seeing the other's edit stays undone; the fields of one object from two writers merge; two devices of one identity merge different fields of the node they own.
