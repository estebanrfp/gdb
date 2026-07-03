# GenosRTC API Reference

Every `GDB` instance includes a powerful internal P2P module called **GenosRTC**. This module is exposed via the `db.room` object and provides a high-level API for real-time peer-to-peer (P2P) communication using WebRTC. It is designed for sending data streams, audio, and video directly between users' browsers in a decentralized manner.

---

## Getting Started

To use the P2P functionalities, simply import and instantiate `GDB`. The GenosRTC API is automatically available via the `db.room` object on your database instance.

```javascript
// 1. Import GDB
import { gdb } from "./dist/index.js" // Adjust the path according to your project

// 2. Create a GDB instance

// The database name also serves as the room ID.
const db = await gdb("my-db", {
  rtc: true, // Required to enable the P2P module
  password: "secret-key", // Optional: encrypts signaling data
  relayUrls: ["wss://relay.example.com"], // Optional: for peer discovery
})

// 3. Access the room object
const room = db.room

console.log("GenosRTC is ready for P2P communication!")
```

---

## The `db.room` API

The `db.room` object is your main interface for all P2P interactions powered by GenosRTC.

### Event Handling

Listen to room events to know when peers join or leave, and when they send media streams.

#### `db.room.on(eventName, callback)`

Registers a callback function for a specific event.

- **`eventName`** `{string}`: The name of the event (`'peer:join'`, `'peer:leave'`, `'stream:add'`).
- **`callback`** `{Function}`: The function to execute.

**Available Events:**

- **`peer:join`**: Fires when a new peer joins the room.

  - **Callback:** `(peerId: string) => void`

  ```javascript
  db.room.on("peer:join", (peerId) => {
    console.log(`Peer ${peerId} has joined.`)
  })
  ```

- **`peer:leave`**: Fires when a peer disconnects.

  - **Callback:** `(peerId: string) => void`

  ```javascript
  db.room.on("peer:leave", (peerId) => {
    console.log(`Peer ${peerId} has left.`)
  })
  ```

- **`stream:add`**: Fires when a peer sends a `MediaStream` (audio/video).
  - **Callback:** `(stream: MediaStream, peerId: string, metadata?: any) => void`
  ```javascript
  db.room.on("stream:add", (stream, peerId) => {
    console.log(`Receiving stream from ${peerId}.`)
    // Logic to display the video/audio in the UI
  })
  ```

---

### Data Channels

Data channels are perfect for sending messages, coordinates, game states, or any kind of custom information.

#### `db.room.channel(type)`

Creates or connects to a named data channel. This is the recommended way to send structured data.

- **`type`** `{string}`: Channel identifier in UTF‑8 (max 12 bytes).
- **Returns**: A `channel` object.

#### `channel.send(data, targets?)`

Sends data through the channel.

- **`data`**: Any serializable data (JSON, string, binary).
- **`targets`** `{string | string[]}`: _(Optional)_ A single peer ID or an array of peer IDs. If omitted, sends to all.

#### `channel.on('message', callback)`

Registers a callback to fire when a full message is received.

- **Callback:** `(data, peerId) => void`

**Data Channel Example (Chat):**

```javascript
const chatChannel = db.room.channel("chat-messages")

// Listen for incoming messages
chatChannel.on("message", (message, peerId) => {
  console.log(`${peerId} says: ${message.text}`)
})

// Send a message to everyone
chatChannel.send({ text: "Hello, everyone!" })
```

---

### Media Streams (Audio/Video)

Methods for managing the sending of `MediaStream` objects.

- **`db.room.addStream(stream, targets?, meta?)`**: Sends your `MediaStream` (e.g., from a webcam) to peers.
- **`db.room.removeStream(stream, targets?)`**: Stops sending a stream.
- **`db.room.replaceTrack(oldTrack, newTrack, stream, targets?)`**: Replaces a track in a stream (e.g., to switch cameras or mute/unmute).

**Video Streaming Example:**

```javascript
async function startWebcam() {
  try {
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })

    // Display your local video (optional)
    // const selfVideo = document.getElementById('self-video');
    // selfVideo.srcObject = localStream;

    // Send your stream to everyone in the room
    db.room.addStream(localStream)
  } catch (err) {
    console.error("Error accessing webcam:", err)
  }
}

startWebcam()
```

---

### Room & Peer Management

- **`db.room.leave()`**: Disconnects the local user from the room and all peers.
- **`db.room.getPeers()`**: Returns an object of the active `RTCPeerConnection` objects, keyed by `peerId`.
- **`db.room.ping(peerId)`**: Measures the latency (in ms) to a specific peer. Returns a promise that resolves with the round-trip time.

---

## 🔷 Cellular Mesh Network

For massive scalability, GenosRTC includes a **Cellular Mesh Overlay** that organizes peers into "cells" with bridge nodes for inter-cell communication, reducing connections from O(N²) to O(N).

### Enabling

```javascript
const db = await gdb("my-app", {
  rtc: { cells: true }  // defaults
})

// With options
const db = await gdb("my-app", {
  rtc: {
    cells: {
      cellSize: "auto",      // "auto" or fixed number
      bridgesPerEdge: 2,     // bridge redundancy
      maxCellSize: 50,       // max peers per cell
      targetCells: 100,      // target cell count
      debug: false           // verbose logging
    }
  }
})
```

### Mesh API

```javascript
const mesh = db.room.mesh

// Send to all peers across all cells
mesh.send({ type: "chat", text: "Hello!" })

// Receive messages
mesh.on("message", (data, fromPeerId) => {
  console.log(`From ${fromPeerId}:`, data)
})
```

### Mesh Events

```javascript
// Your cell status
db.room.on("mesh:state", (state) => {
  // state: { cellId, isBridge, bridges, dynamicTTL, cellSize }
})

// Remote peer states (for visualization)
db.room.on("mesh:peer-state", (data) => {
  // data: { id, cell, bridges }
})
```

### Scalability

| Metric | Standard | Cellular (10k peers) |
|--------|----------|----------------------|
| Connections/peer | ~10,000 | ≈ cell size + bridges (tens) |
| Message hops | 1 | ~10 |
| Max peers | ~100 | Massive scale |

### When to Use

| Peers | Recommendation |
|-------|----------------|
| < 100 | `rtc: true` |
| 100+ | `rtc: { cells: true }` |

> **Note:** All peers should use the same `cells` configuration for optimal performance.
