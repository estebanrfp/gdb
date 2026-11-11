# Scope: Being in Parts of the Graph

Every peer of a room replicates the whole graph. `db.scope(field, values)` puts a replica in parts of it instead. Each value is a sync room of its own, where the nodes whose value carries `field` with that value are synced among the replicas that are in it. Two replicas that share no value are in no room together: they are never connected — no link, not a byte. One database, one graph — and a replica that states no scope is in the whole graph, exactly as before.

```js
const db = await gdb("workspace", { rtc: true, scope: ["channel", ["general", "design"]] })

await db.put({ type: "message", channel: "design", text: "…" }) // said in the room of #design
db.scope("channel", ["general", "random"])                      // whenever the parts change: leaves #design, enters #random
```

It fits any graph whose parts are places a peer is in: the channels of a chat, the documents of a workspace, the lands of a world, the tiles of a map.

## What the engine does

- **A room for each value.** Entering a part joins its room; leaving it leaves the room. Stated when the database opens, the replica never joins the room of the whole graph.
- **In each room, what it always does** — with the nodes of that part alone. A link that comes up makes each replica say hello there: the newest clock it holds of that part, and a digest of it. In step: silence. Behind: the oplog window of that part — a write when its node is in the part now, a removal when the node it removed was, a link when its source is — or, when the window is not enough, the part whole. Nothing new travels on the wire.
- **An answer is for the one that said hello.** In the room of the whole graph an answer is said to the room; in the room of a part it goes to that peer alone, so those already there exchange nothing when someone arrives.
- **A replica that holds nothing of a part asks one peer** — the first it meets there, alone: every other would answer with the same. Its repeat, two seconds later, is said to the room, and whoever still differs answers.
- **The door.** A node this replica does not hold, of no part it is in, is not applied.
- **A write is said in the rooms of its node's parts** — those it was of and those it is of, when the write moves it — among the ones this replica is in.
- **Leaving deletes nothing.** The replica stops hearing that part. What it holds of it stays, in memory and on disk: it may be the only copy.
- **Several parts.** The field may be a list: `{ zone: ["a", "b"] }` is of both, and is held wherever one of them is.
- **What carries no field has no room.** It stays in the replica that wrote it.

## What it costs

| | |
|---|---|
| when no scope is stated | nothing: the same rooms, the same messages |
| each part a replica is in | one sync room: its subscriptions on each signaling relay, and a connection to each peer that is in it |
| replicas in step | nothing: no answer |
| a replica that arrives in a part | receives that part, from the peer it asks |
| a replica that comes back behind | receives the recent operations of that part |
| entering a part | as long as a link takes to come up |
| persisted | nothing new: the application states the scope when it opens |

## What an application must do

- **State the scope when the database opens** — the `scope` option — and call `db.scope` again whenever the parts change. It is not persisted.
- **Tag a node when it is created.** The field names the parts it is of.
- **Put what everyone needs in a part everyone is in.** What carries no field does not travel.
- **Move a node from a replica that is in both parts.** The write that moves it is said in both rooms: it arrives in the new part at once and is still written in the old one — never a stale copy. A writer that is not in the new part has no room to say it in: the node arrives there the next time a replica that holds it says hello in that room. The same goes for a node written into a part its writer is not in.
- **Link a node only to one of the same part.** A link changes its source and is applied where both nodes are held.
- **Make sure someone is in each part.** A part is held by the replicas that have been in it, and nowhere else.
- **Keep every tab of a browser in the same parts.** The tabs of one browser share the stored graph: a replica is a browser, not a tab. Keep what is followed in `localStorage`.

## Known limits

- **Granted roles do not travel.** Role nodes (`user:…`) carry no field, so a replica with a scope sees every other as a guest, save the superadmins of its constitution. It fits where a guest may write; an application that depends on granted roles cannot use a scope yet. Encrypted records (`db.sm.put`) show no field either.
- **There is no `db.room`.** Presence and the application's own channels go through the room of each part: `db.rooms.get(value).room`.
- **A replica with a scope never meets one without it, nor [GenosSRV](genosdb-fallback-server.md).** They are in different rooms: the Fallback Server is in the room of the whole graph and holds no part.
- **Nothing is forgotten yet.** Leaving a part deletes nothing and there is no call that does: the disk grows with every part visited.
- **Over the [Cellular Mesh](genosrtc-cells.md), what a replica wrote of a part while out of it may not reach every peer of that part's room** when it enters. An answer is for the one that said hello, and there only the peers that get a new link say it: the others are sent it the next time they say hello in that room. Live writes, and what the replica itself is sent, cross every cell.

## What stays as it was

- **It is not access control.** Any peer may be in any part. Confidentiality is cryptographic, as ever.
- **One field at a time.** A `scope` with another field replaces the previous one.
- **A difference that comes back is answered with everything** — once, to that peer alone — in the room of a part as in the room of the whole graph.
- **A tombstone lives only in the oplog window.** A node removed while a replica was out of its part for longer than that can come back through it, as a removed node always could.
- **Authorship is judged as ever.** The door only refuses: whatever is applied passed the same gate, signature by signature.

Pinned by `lib/tests/partial/scope.spec.js`: two replicas in different parts are never connected — no link, no ICE pair, not a byte, nothing said — while one that is in both is linked to each; a replica holds the parts it is in, entering one brings what was there, leaving it deletes nothing and what carries no field does not travel; a replica that arrives in a part is sent that part and nothing else; those already there exchange nothing when someone arrives; a write a replica missed is brought to it by the next hello said there; a node of several parts, a removal and a link; a node that moves to another part arrives at once when its writer is in both, and with the next hello said there when it is not; the only replica of a part writes it alone, leaves and comes back holding it, and a visitor is sent it; a replica that comes back behind is sent, of the oplog window, the writes, removals and links of that part and nothing else; one that comes back to a part after more of it changed than a window holds is sent the part whole; and one whose newest write of a part is its own is sent the part whole the next time it says hello there. The [channels example](../examples/channels.html) is the reference, driven by `lib/tests/examples/channels.spec.js`.
