# Cells — Technical Documentation

## Introduction

**Cells** is a P2P cellular mesh protocol that organizes peers into interconnected cells to achieve efficient and scalable broadcast communication.

### Key Features

- **Cellular Architecture**: Peers grouped into cells with bridges connecting adjacent cells
- **Epoch-Sealed Topology**: The whole layout derives from a sealed roster — zero coordination traffic
- **Deterministic Bridges**: Per-cell hash ranking; the full rank order doubles as the succession line
- **Total Cell Isolation**: Each cell is an independent mesh; data crosses only through elected bridges
- **Dynamic TTL**: Message time-to-live calculated from the topology
- **Deduplication**: Duplicate message prevention with tracking sets

---

## Architecture

### Cell Topology

Peers are organized into a chain of cells, with power-of-two skip links between cells keeping the network diameter at O(log C):

```
cell-0 ←──→ cell-1 ←──→ cell-2 ←──→ cell-3 ←──→ cell-4
   │           │           │           │           │
 peers       peers       peers       peers       peers
```

### Peer-to-Cell Assignment

Each peer maps to the cell where its rendezvous (HRW) hash score is highest:

```javascript
// cell(peer) = argmax over c of hash(`${peerId}:${c}`)
const cellId = `cell-${computeCellForPeer(peerId, totalCells)}`;
```

Assignment is deterministic and churn-stable: every peer derives the same mapping from the shared roster, and changing the cell count relocates only a minimal fraction of peers.

### Bridges

Bridges are peers selected to connect adjacent cells. Only bridges can forward messages between cells.

```
cell-0          cell-1
┌─────┐        ┌─────┐
│ A   │        │ D   │
│ B ●─┼────────┼─● E │  ← B and E are bridges
│ C   │        │ F   │
└─────┘        └─────┘
```

#### Bridge Selection

The top-ranked member of each cell — by a per-cell hash — serves **all** of that cell's edges: exactly one bridge per cell, and every edge covered from both sides (one bridge per side, each relaying in both directions).

```javascript
const rank = id => hash(`${id}@${cellIdx}`); // per-cell ranking
```

Every peer derives the same election independently, so connection admission stays symmetric with no coordination messages. The full rank order is also the **succession line**: when a titular drops from the census, the next candidate takes over at the following seal — no negotiation, no messages.

---

## Epoch-Sealed Topology

The topology is a pure function of a **sealed roster**. Each peer snapshots the census (announce-based, fed over the relays) into an epoch; cells, bridges, succession and channel audiences all derive from that snapshot with the same math on every peer — so no topology data ever travels the wire, and two peers with the same roster compute identical layouts.

Between seals the topology is immutable: a joining peer holds no role — no links, no frames — until the next seal admits it. Departures send a `bye` beacon that clears the census in one relay hop (urgent reseal); silent crashes fall back to the census timeout.

| Trigger | Seal delay |
|---------|-----------|
| Growth, certain departure (`bye`), dead edge-bridge | first 2s quiet gap of the roster (10s cap) |
| Pure shrink (suspected drop) | 30s suspicion window |
| Grace after each seal | 5s — then links outside the new topology are pruned |

Cell isolation is enforced at three independent layers: connections exist only along sealed roles, frames are audience-targeted at the sender, and receivers drop anything outside their role.

---

## Configuration

```javascript
import { gdb } from 'genosdb';

// Cells with default options
const db = await gdb('mydb', { rtc: { cells: true } });

// Cells with a custom cell size
const db = await gdb('mydb', { 
  rtc: { 
    cells: { cellSize: 5 }  // default 10 peers per cell
  }
});

// With custom relay + cells
const db = await gdb('mydb', { 
  rtc: { 
    relayUrls: ['wss://my-relay.com'],
    cells: { cellSize: 10 }
  }
});

// Access room and mesh
const room = db.room;
const mesh = room.mesh;
const selfId = db.selfId;
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cellSize` | `number` | `10` | Peers per cell — the room forms `ceil(N / cellSize)` cells |

> Unknown options are ignored. Logging follows GenosDB's shared flag: `gdb('mydb', { debug: true })` enables it across core, plugins and GenosRTC.

> **Note:** For direct usage with GenosRTC (without GenosDB), see [genosrtc-guide.md](genosrtc-guide.md).

---

## Cell Count

The room divides exactly by the configured `cellSize` (default 10):

```javascript
const totalCells = Math.ceil(peerCount / cellSize);
```

### Calculation Table

| Peers | `cellSize` | Cells |
|-------|-----------|-------|
| 10 | 10 (default) | 1 |
| 11 | 10 (default) | 2 |
| 100 | 10 (default) | 10 |
| 12 | 5 | 3 |
| 25 | 5 | 5 |

More peers means **more cells, never bigger cells** — per-peer connections stay `O(cellSize)` at any scale. The layout is recomputed at each seal. Note: HRW assigns peers statistically, so small rooms show uneven cells (e.g. 12 peers as 7+3+2); the spread evens out as N grows, in exchange for churn-stable placement.

---

## Dynamic TTL

The message Time-To-Live is calculated based on network size:

```javascript
const dynamicTTL = () =>
  Math.min(150, Math.ceil(Math.log2(sealedCells + 1)) * 2 + 3);
```

| Peers | Cells | TTL |
|-------|-------|-----|
| 50 | 5 | 9 |
| 200 | 20 | 13 |
| 1,000 | 100 | 17 |
| 10,000 | 1,000 | 23 |

TTL decreases by 1 per hop. Messages with TTL ≤ 0 are not forwarded.

---

## Message Flow

### Internal Message Types

| Type | Purpose |
|------|---------|
| `msg` | User message (payload from `mesh.send()`) |
| `ping` | Latency measurement request |
| `pong` | Ping response with timestamp |

No topology type exists: cells, bridges and peer states are derived locally from the seal, never transmitted.

### Message Structure

```javascript
{
  t: 'msg',              // Type
  id: 'abc:123:456',     // Unique ID (selfId:timestamp:seq)
  ttl: 53,               // Time-to-live
  data: { ... },         // Payload
  origin: 'peer-abc',    // Originating peer
  originCell: 'cell-0'   // Origin cell
}
```

### Routing

1. **Message in my cell**: Delivered locally and bridges forward to neighboring cells
2. **Message from neighbor cell**: Bridge injects into its cell and forwards to other neighbors
3. **Deduplication**: Already seen messages (`seen` set) are not processed again

Every frame is **audience-targeted**: it is sent only to the sealed members of its cell channel plus that cell's elected bridges — surviving direct cross-cell links carry nothing. Receivers apply a **role guard**: frames outside their own channel (or a channel they bridge) are dropped before processing. Directed sends (`channel().send(data, targets)`) take a direct fast path when every target is a live link, and are otherwise forwarded by bridges without being delivered to them.

```
┌─────────────────────────────────────────────────────────────┐
│  Peer A sends message from cell-0                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  cell-0 ──→ cell-1 ──→ cell-2 ──→ cell-3                   │
│    │   B01    │   B12    │   B23    │                      │
│    ↓          ↓          ↓          ↓                      │
│  [A,B,C]    [D,E]     [F,G,H]    [I,J]                     │
│                                                             │
│  Route: A → cell-0 → B01 → cell-1 → B12 → cell-2 → ...    │
└─────────────────────────────────────────────────────────────┘
```

---

## Seal Cadence

A 2s tick compares the census against the sealed roster and reseals when due — nothing is ever sent over the network for this:

```javascript
setInterval(() => {
  // urgent (growth, bye, dead edge-bridge): seal at the first 2s quiet gap,
  // 10s cap if the roster never settles; pure shrink waits 30s
  tick();
  // re-emit local mesh:peer-state events every ~30s (local listeners only)
}, HEARTBEAT_INTERVAL);
```

Each seal rebuilds `peerInfo` from the roster, opens the channels the new role requires, and — after a 5s grace window that absorbs seal skew between peers — prunes every connection the sealed topology does not recognize.

---

## Protections

### Deduplication

```javascript
const seen = new Set();      // Message IDs for relay (max 5000)
const delivered = new Set(); // Message IDs delivered to handlers
```

### Audience Targeting

Every outgoing frame carries an explicit target list — the sealed members and elected bridges of its cell channel, narrowed to live connections. An unsealed or out-of-role link receives nothing.

### Role Guard

A receiver only processes frames from its own cell channel, or from a neighbor channel it was elected to bridge. Anything else is dropped on arrival — inter-cell data flows exclusively through bridges.

---

## Public API

### Connection

```javascript
import { gdb } from 'genosdb';

const db = await gdb('mydb', { rtc: { cells: true } });
const room = db.room;
const mesh = room.mesh;
const selfId = db.selfId;
```

### Messaging

```javascript
// Send broadcast message
mesh.send({ type: 'chat', text: 'Hello world' });

// Receive messages
const unsubscribe = mesh.on('message', (data, fromPeerId) => {
  console.log(`Message from ${fromPeerId}:`, data);
});

// Stop listening
unsubscribe();
```

### State

```javascript
const state = mesh.getState();
// {
//   epoch: 42,
//   cellId: "cell-2",
//   isBridge: true,
//   bridges: ["cell-1", "cell-3"],
//   roster: ["peer-a", "peer-b", ...],  // the sealed membership
//   cellSize: 5,
//   dynamicTTL: 23,
//   totalCells: 20,
//   knownCells: 18
// }
```

### Diagnostics

```javascript
// Ping a peer (returns RTT in ms — answered only by the target)
const rtt = await mesh.ping(peerId);
```

### Network Information

```javascript
// Info for all known peers
const peerInfo = mesh.getPeerInfo();
// Map<peerId, { cell, isBridge, bridges }>

// Sealed roster of the current epoch
const roster = mesh.getStableRoster();
// ['peer-a', 'peer-b', 'peer-c', ...]

// Known cells (lastSeen = seal timestamp)
const cells = mesh.getKnownCells();
// Map<cellId, { lastSeen, peerId }>

// Current cellSize
const size = mesh.getCellSize();
// 5
```

### Cleanup

```javascript
mesh.destroy();  // Stops heartbeat and cleans up resources
```

---

## Events

### Room Events (GenosRTC)

```javascript
room.on('peer:join', peerId => { ... });
room.on('peer:leave', peerId => { ... });
```

### Mesh Events

```javascript
room.on('mesh:state', state => {
  // Own state, emitted at each seal
  // { epoch, cellId, isBridge, bridges, roster, dynamicTTL, cellSize, totalCells }
});

room.on('mesh:peer-state', data => {
  // Remote peer state — derived locally from the seal (nothing travels
  // the wire), re-emitted every ~30s for freshness-window consumers
  // { id, cell, bridges, timestamp }
});
```

---

## Internal Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `SEEN_MAX` | 5000 | Maximum IDs in `seen` set |
| `RTT_TIMEOUT` | 3000 | Ping timeout (ms) |
| `HEARTBEAT_INTERVAL` | 2000 | Seal-cadence tick (ms) |
| `SEAL_QUIET_MS` | 2000 | Roster quiet gap that triggers an urgent seal |
| `SEAL_MAX_WAIT_MS` | 10000 | Urgent-seal cap if the roster never settles |
| `SEAL_SHRINK_MS` | 30000 | Suspicion window for unconfirmed departures |
| `GRACE_MS` | 5000 | Post-seal grace before pruning |
| `REEMIT_MS` | 30000 | Local re-emit of `mesh:peer-state` |

---

## Complete Example

```javascript
import { gdb } from 'genosdb';

async function main() {
  // Connect with cells enabled
  const db = await gdb('my-app', { 
    rtc: { 
      cells: true 
    }
  });

  const room = db.room;
  const mesh = room.mesh;
  const selfId = db.selfId;

  // Listen for events
  room.on('peer:join', id => console.log('New peer:', id));
  room.on('peer:leave', id => console.log('Peer left:', id));

  room.on('mesh:state', state => {
    console.log(`I'm in ${state.cellId}, bridge: ${state.isBridge}`);
  });

  // Receive messages
  mesh.on('message', (data, from) => {
    console.log(`[${from}]:`, data);
  });

  // Send message
  document.getElementById('sendBtn').onclick = () => {
    const text = document.getElementById('input').value;
    mesh.send({ type: 'chat', text, author: selfId });
  };

  // Monitoring
  setInterval(() => {
    const state = mesh.getState();
    console.log(`Cells: ${state.totalCells}, TTL: ${state.dynamicTTL}`);
  }, 10000);
}

main();
```

---

## Scalability

| Peers | Cells | Max Hops (TTL) | Connections |
|-------|-------|----------------|-------------|
| 100 | 10 | 9 | ~500 |
| 1,000 | 100 | 17 | ~5,000 |
| 10,000 | 1,000 | 23 | ~50,000 |
| Large scale | 10,000+ | O(log C), 150 cap | Scales linearly |

### Connection Formula

```
connections ≈ peers × (cellSize − 1) / 2   // intra-cell meshes
            + cells × log₂C                // bridge links to neighbor cells
```

Hops stay logarithmic thanks to the power-of-two skip links between cells.

Compared to traditional mesh (`N × (N-1) / 2`), the reduction is **100x to 1000x** for large networks.

---

## Recommendations

| Use Case | GDB Configuration |
|----------|-------------------|
| General chat | `{ rtc: { cells: true } }` |
| Demos / small rooms | `{ rtc: { cells: { cellSize: 5 } } }` |
| Low latency | `{ rtc: { cells: { cellSize: 3 } } }` |
| High scale | `{ rtc: { cells: { cellSize: 20 } } }` |

---

## Usage Comparison

| Configuration | Cells | Description |
|---------------|-------|-------------|
| `rtc: true` | ❌ No | Basic RTC without cellular mesh |
| `rtc: { cells: true }` | ✅ Yes | Cellular mesh with defaults |
| `rtc: { cells: { ... } }` | ✅ Yes | Cellular mesh with custom options |
