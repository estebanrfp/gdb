# Cells — Technical Documentation

## Introduction

**Cells** is a P2P cellular mesh protocol that organizes peers into interconnected cells to achieve efficient and scalable broadcast communication.

### Key Features

- **Cellular Architecture**: Peers grouped into cells with bridges connecting adjacent cells
- **Dynamic CellSize**: Automatically adjusts based on network size
- **Deterministic Bridges**: Bridge election is a pure function of the shared roster (per-edge hash ranking)
- **Dynamic TTL**: Message time-to-live calculated based on topology
- **Deduplication**: Duplicate message prevention with tracking sets
- **Heartbeat**: Periodic synchronization and cleanup of inactive peers

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

Bridges are elected per edge `(lo, hi)` as a pure function of the shared roster: candidates from both cells are ranked by a per-edge hash, and the best candidate from **each side** is always included — guaranteeing egress in both directions — before filling up to `bridgesPerEdge`.

```javascript
const rank = id => hash(`${id}@${lo}~${hi}`); // per-edge ranking spreads load
```

Every peer derives the same election independently, so connection admission stays symmetric with no coordination messages.

---

## Configuration

```javascript
import { gdb } from 'genosdb';

// Cells with default options
const db = await gdb('mydb', { rtc: { cells: true } });

// Cells with custom options
const db = await gdb('mydb', { 
  rtc: { 
    cells: { 
      cellSize: 'auto',
      bridgesPerEdge: 2,
      maxCellSize: 50,
      targetCells: 100,
      debug: false
    }
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
| `cellSize` | `'auto'` \| `number` | `'auto'` | Number of peers per cell. In `'auto'` mode it's calculated dynamically |
| `bridgesPerEdge` | `number` | `2` | Number of bridges per connection between adjacent cells |
| `maxCellSize` | `number` | `50` | Maximum peers per cell in auto mode |
| `targetCells` | `number` | `100` | Target number of cells in the network (auto mode) |
| `debug` | `boolean` | `false` | Enables debug logs in console |

> **Note:** For direct usage with GenosRTC (without GenosDB), see [genosrtc-guide.md](genosrtc-guide.md).

---

## Dynamic CellSize

When `cellSize: 'auto'`, the cell size is calculated automatically:

```javascript
const computeOptimalCellSize = (peerCount, targetCells, maxCellSize) => {
  if (peerCount <= 10) return Math.max(2, peerCount); // single cell until 11 peers
  const computed = Math.ceil(peerCount / targetCells);
  return Math.max(10, Math.min(maxCellSize, computed));
}
```

### Calculation Table

| Peers | Formula | cellSize |
|-------|---------|----------|
| 10 | single cell | 10 |
| 100 | 100/100 = 1 → floor | 10 |
| 500 | 500/100 = 5 → floor | 10 |
| 1,000 | 1000/100 = 10 | 10 |
| 5,000 | 5000/100 = 50 | 50 |
| 10,000 | 10000/100 = 100 → capped | 50 |

The cellSize is recalculated on each `refreshState()` to adapt to network changes.

---

## Metrics System (PeerMetrics)

Each peer keeps health metrics for monitoring and diagnostics (bridge election itself is deterministic — see above):

```javascript
class PeerMetrics {
  peerId         // Unique peer ID
  joinedAt       // Initial connection timestamp
  lastSeen       // Last recorded activity
  rttSamples[]   // Last 10 latency samples
  stability      // 0.0 - 1.0 (decreases with reconnections)
  reconnects     // Reconnection counter
  isResponsive   // true if responded to last ping
  connectedCells // Set of cells where peer has been seen
}
```

### Computed Properties

| Property | Calculation |
|----------|-------------|
| `uptime` | `Date.now() - joinedAt` |
| `avgRtt` | Average of `rttSamples` (∞ if empty) |
| `isStale` | `Date.now() - lastSeen > 30000` |
| `healthScore` | Composite score 0.0 - 1.0 |

### Health Score

```javascript
healthScore = 
  (rttScore * 0.25) +           // 25%: Low latency = better
  (uptimeScore * 0.25) +        // 25%: Longer connected = better
  (stabilityScore * 0.30) +     // 30%: Fewer reconnections = better
  (responsivenessScore * 0.20)  // 20%: Responds to pings = better
```

---

## Dynamic TTL

The message Time-To-Live is calculated based on network size:

```javascript
const dynamicTTL = () => {
  const totalCells = Math.ceil(roster.length / cellSize);
  return Math.min(150, Math.ceil(Math.log2(totalCells + 1)) * 2 + 3);
}
```

| Peers | Cells | TTL |
|-------|-------|-----|
| 50 | 5 | 9 |
| 200 | 20 | 13 |
| 1,000 | 100 | 17 |
| 10,000 | 200 | 19 |

TTL decreases by 1 per hop. Messages with TTL ≤ 0 are not forwarded.

---

## Message Flow

### Internal Message Types

| Type | Purpose |
|------|---------|
| `state` | Peer state broadcast (cell, bridges, health) |
| `msg` | User message (payload from `mesh.send()`) |
| `ping` | Latency measurement request |
| `pong` | Ping response with timestamp |

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

## Heartbeat

The system periodically broadcasts state and cleans up inactive peers:

```javascript
const HEARTBEAT_INTERVAL = 2000;  // 2 seconds
const PEER_TIMEOUT = 30000;       // 30 seconds

setInterval(() => {
  sendState();  // Gossip own state on change, plus a ~10s keep-alive
  
  // Remove stale peers
  for (const [id, metrics] of peerMetrics) {
    if (metrics.isStale) {
      peerInfo.delete(id);
      peerMetrics.delete(id);
    }
  }
}, HEARTBEAT_INTERVAL);
```

---

## Protections

### Deduplication

```javascript
const seen = new Set();      // Message IDs for relay (max 5000)
const delivered = new Set(); // Message IDs delivered to handlers
```

### Valid Peer Filtering

Before sending to specific targets, their existence is verified:

```javascript
const currentPeers = new Set(Object.keys(room.getPeers() || {}));
const validTargets = targets.filter(id => currentPeers.has(id));
```

### Stale Verification

Only peers with `lastSeen` within the last 30 seconds are considered active.

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
//   cellId: "cell-2",
//   isBridge: true,
//   bridges: ["cell-1", "cell-3"],
//   cellSize: 5,
//   dynamicTTL: 23,
//   totalCells: 20,
//   knownCells: 18,
//   health: {
//     cellId: "cell-2",
//     memberCount: 5,
//     avgHealth: 0.85,
//     responsiveRatio: 1.0
//   }
// }
```

### Metrics

```javascript
// Metrics for a specific peer
const metrics = mesh.getMetrics(peerId);
// { uptime, avgRtt, healthScore, isStale, stability, ... }

// Cell health
const health = mesh.getCellHealth('cell-2');
// { cellId, memberCount, avgHealth, responsiveRatio }

// Ping a peer (returns RTT in ms)
const rtt = await mesh.ping(peerId);
```

### Network Information

```javascript
// Info for all known peers
const peerInfo = mesh.getPeerInfo();
// Map<peerId, { cell, isBridge, bridges }>

// Roster of active peers (not stale)
const roster = mesh.getStableRoster();
// ['peer-a', 'peer-b', 'peer-c', ...]

// Known cells
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
  // Own state updated
  // { cellId, isBridge, bridges, dynamicTTL, cellSize }
});

room.on('mesh:peer-state', data => {
  // Remote peer state received
  // { id, cell, bridges, health, timestamp }
});

room.on('mesh:health', healthData => {
  // Cell health update
  // { cellId, isBridge, health: { memberCount, avgHealth, ... } }
});
```

---

## Internal Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `SEEN_MAX` | 5000 | Maximum IDs in `seen` set |
| `RTT_TIMEOUT` | 3000 | Ping timeout (ms) |
| `PEER_TIMEOUT` | 30000 | Time to mark peer as stale |
| `HEARTBEAT_INTERVAL` | 2000 | Heartbeat interval (ms) |

---

## Complete Example

```javascript
import { gdb } from 'genosdb';

async function main() {
  // Connect with cells enabled
  const db = await gdb('my-app', { 
    rtc: { 
      cells: { cellSize: 'auto', bridgesPerEdge: 2 } 
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

| Peers | Cells | Max Hops | Connections |
|-------|-------|----------|-------------|
| 100 | 10 | ~10 | ~459 |
| 1,000 | 100 | ~100 | ~4,599 |
| 10,000 | 200 | ~150 | ~45,999 |
| Large scale | 1,000+ | ~150 (max) | Scales linearly |

### Connection Formula

```
connections ≈ (peers × cellSize) + (cells × bridgesPerEdge × 2)
```

Compared to traditional mesh (`N × (N-1) / 2`), the reduction is **100x to 1000x** for large networks.

---

## Recommendations

| Use Case | GDB Configuration |
|----------|-------------------|
| General chat | `{ rtc: { cells: true } }` |
| Real-time games | `{ rtc: { cells: { cellSize: 5, bridgesPerEdge: 2 } } }` |
| IoT / Sensors | `{ rtc: { cells: { cellSize: 'auto', targetCells: 200 } } }` |
| Low latency | `{ rtc: { cells: { cellSize: 3, bridgesPerEdge: 2 } } }` |
| High scale | `{ rtc: { cells: { cellSize: 'auto', maxCellSize: 100 } } }` |

---

## Usage Comparison

| Configuration | Cells | Description |
|---------------|-------|-------------|
| `rtc: true` | ❌ No | Basic RTC without cellular mesh |
| `rtc: { cells: true }` | ✅ Yes | Cellular mesh with defaults |
| `rtc: { cells: { ... } }` | ✅ Yes | Cellular mesh with custom options |
