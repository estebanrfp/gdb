# Streaming with GenosRTC

The **Streaming** feature in `GDB`, powered by **GenosRTC**, enables real-time communication and data synchronization between connected peers. This functionality is particularly useful for applications that require live updates, such as collaborative tools, multiplayer games, or real-time tracking systems.

## Overview

### Verify that WebRTC is enabled

GenosDB requires an active WebRTC environment to establish peer-to-peer connections.  
You can quickly check whether your browser supports WebRTC using the following external tool:

#### WebRTC Leak Test

URL: https://browserleaks.com/webrtc  
Description: This page detects whether your browser has WebRTC enabled and shows the IP addresses exposed through WebRTC. If the tool reports that WebRTC is disabled or blocked, GenosDB will not be able to initiate P2P communication.

##### Finding public, private, and paid Nostr relays

When using custom relay configurations through the `relayUrls` option, developers may need a reliable directory of active Nostr relays. This is useful for selecting high-availability relays, building private relay sets, or evaluating which relays to include for production environments.

You can explore and filter available relays using the following external resource:

###### Nostr Relay Finder
  
URL: https://legacy.nostr.watch/relays/find  
Description: A searchable directory of Nostr relays that includes information about availability, latency, geographic distribution, access policies, pricing, and stability. This resource helps developers select the appropriate relays to include in the `relayUrls` array when configuring GenosDB.

Streaming allows peers (clients) to send and receive data in real time through shared communication channels. Each peer can publish data to a channel, and all other connected peers will receive the updates instantly. This ensures that all participants in the system stay synchronized with minimal latency.

### Key Concepts

- **Peers**: Clients connected to the same `room`. Each peer has a unique identifier (`peerId`) to distinguish it from others.
- **Data Channels**: Logical communication pathways where structured data is exchanged. Peers create or connect to a named channel to send and receive messages.
- **Media Streams**: Media flows (audio/video) that can be sent directly to other peers.

## How It Works

1.  **Initialization**:

    - A peer initializes `GDB`. The database name serves as the `room` ID.
    - Upon instantiation, the peer automatically joins the room and begins discovering other peers.

2.  **Data Publishing**:

    - A peer can send data through a named data channel (`Data Channel`).
    - The data is broadcast to all other peers in the room or to specific targets.

3.  **Data Subscription**:

    - Peers listen for `message` events on a channel to receive incoming data.
    - When new data is received, the peer processes it according to its application logic.

4.  **Peer Lifecycle**:
    - Peers can join or leave the room dynamically.
    - The system provides events (`peer:join`, `peer:leave`) to notify when a peer connects or disconnects.

## Use Cases

- **Real-Time Collaboration**: Enable multiple users to edit or interact with shared content simultaneously.
- **Live Tracking**: Track the movement or status of objects in real time, such as GPS coordinates or game character positions.
- **Notifications**: Broadcast alerts or updates to all connected clients instantly.

## Example Workflow

Below is a generic example demonstrating how to use the Streaming feature in your application, adapted to the **GenosRTC** API.

```javascript
// 1. Import the GenosDB library
import { gdb } from "https://cdn.jsdelivr.net/npm/genosdb@latest/dist/index.min.js"

// 2. Initialize GenosDB (the name is the room ID)
const db = await gdb("p2p-db", { rtc: true }) // (rtc: true) for realtime updates

const room = db.room

// 3. Create a channel for data messages
const dataChannel = room.channel("example-action")

// 4. Listen for peer lifecycle events
room.on("peer:join", (peerId) => console.log(`${peerId} joined the channel`))
room.on("peer:leave", (peerId) => console.log(`${peerId} left the channel`))

// 5. Publish data to the channel
function publishData(data) {
  console.log(`Publishing data: ${JSON.stringify(data)}`)
  dataChannel.send(data) // Send to all peers
}

// 6. Subscribe to incoming data
dataChannel.on("message", (data, peerId) => {
  console.log(`Received data from ${peerId}: ${JSON.stringify(data)}`)
  // Process the received data here
})

// Example usage
window.addEventListener("userAction", (event) => {
  const data = { action: event.type, payload: event.detail }
  publishData(data) // Send user action data to all peers
})
```

## Audio Streaming

Audio streaming allows peers to broadcast their microphone audio to other connected peers in real time. This is ideal for applications like voice chat, conference calls, or live audio broadcasting.

### Example: Real-Time Audio Streaming

```javascript
// Object to store audio instances for each peer
const peerAudios = {}

// Get access to the user's microphone
navigator.mediaDevices
  .getUserMedia({ audio: true, video: false })
  .then((selfStream) => {
    // Send the stream to all peers in the room. GenosRTC handles sending
    // it to current and future peers.
    db.room.addStream(selfStream)
  })
  .catch((error) => console.error("Error accessing microphone:", error))

// Handle incoming audio streams from other peers
db.room.on("stream:add", (stream, peerId) => {
  // Only process if the stream has audio tracks
  if (stream.getAudioTracks().length > 0) {
    console.log(`Received audio stream from peer ${peerId}`)
    // Create an audio element for the incoming stream
    const audio = new Audio()
    audio.srcObject = stream
    audio.autoplay = true

    // Store the audio instance for future reference
    peerAudios[peerId] = audio
  }
})

// Clean up when a peer leaves
db.room.on("peer:leave", (peerId) => {
  if (peerAudios[peerId]) {
    peerAudios[peerId].pause() // Pause the audio
    delete peerAudios[peerId] // Remove the reference
  }
})
```

### Explanation

1.  **Microphone Access**: `getUserMedia` captures the user's microphone audio.
2.  **Broadcasting Audio**: The `db.room.addStream(stream)` method sends the audio `MediaStream` to all peers in the room. GenosRTC automatically handles sending the stream to new peers who join later.
3.  **Receiving Audio**: The `db.room.on('stream:add', callback)` event fires for incoming streams. The audio is played back using an `<audio>` element.
4.  **Cleanup**: When a peer leaves (`peer:leave`), their audio stream is paused, and the reference is removed.

## Video Streaming

Video streaming allows peers to broadcast their webcam video to other connected peers in real time, ideal for video conferencing, live streaming, or remote collaboration.

### Example: Real-Time Video Streaming

```javascript
// Object to store video elements for each peer
const peerVideos = {}
const videoContainer = document.getElementById("videos")

// Get access to the user's webcam
navigator.mediaDevices
  .getUserMedia({ audio: true, video: true })
  .then((selfStream) => {
    // Send the stream to all peers in the room
    db.room.addStream(selfStream)
  })
  .catch((error) => console.error("Error accessing webcam:", error))

// Handle incoming video streams from other peers
db.room.on("stream:add", (stream, peerId) => {
  console.log(`Received video stream from peer ${peerId}`)
  let video = peerVideos[peerId]

  // If this peer hasn't sent a stream before, create a video element
  if (!video) {
    video = document.createElement("video")
    video.autoplay = true
    video.playsInline = true // Important for mobile browsers

    // Add the video element to the DOM
    videoContainer.appendChild(video)
    peerVideos[peerId] = video
  }

  // Set the incoming stream as the source for the video element
  video.srcObject = stream
})

// Clean up when a peer leaves
db.room.on("peer:leave", (peerId) => {
  if (peerVideos[peerId]) {
    peerVideos[peerId].remove() // Remove the video element from the DOM
    delete peerVideos[peerId] // Delete the reference
  }
})
```

### Explanation

1.  **Webcam Access**: `getUserMedia` captures the user's webcam video and audio.
2.  **Broadcasting Video**: `db.room.addStream(stream)` sends the `MediaStream` to all peers.
3.  **Receiving Video**: The `db.room.on('stream:add', ...)` event handles incoming streams, which are displayed using `<video>` elements.
4.  **Cleanup**: When a peer leaves (`peer:leave`), their video element is removed from the DOM.

## File Streaming

File streaming allows peers to send and receive files using GenosRTC's **Data Channels**. You can build support for metadata, progress updates, and secure encryption on top of this foundation.

### Example: Real-Time File Streaming

This example demonstrates file transfer using `db.room.channel`.

```javascript
// 2. Initialize a secure room with encryption
const db = await gdb("file-room", { rtc: true, password: "secure-password" })

const room = db.room

// 3. Create a data channel for file transfers
const fileChannel = room.channel("file-transfer")

// 4. Handle incoming files
fileChannel.on("message", (message, peerId) => {
  // We expect the message to be an object with metadata and the file payload
  const { metadata, payload } = message
  console.log(
    `Received a file (${metadata.name}) from ${peerId} with type ${metadata.type}`
  )

  // Logic to save the file (e.g., create a Blob and a download link)
  const blob = new Blob([payload], { type: metadata.type })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = metadata.name
  link.click()
  URL.revokeObjectURL(link.href)
  alert(`Received and downloaded file: ${metadata.name}`)
})

// 5. Handle file selection and sending
document
  .getElementById("fileInput")
  .addEventListener("change", async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Read the file as an ArrayBuffer
    const buffer = await file.arrayBuffer()

    // Package the file data and metadata into a single object
    const message = {
      metadata: { name: file.name, type: file.type, id: `file-${Date.now()}` },
      payload: buffer,
    }

    // Send the object to all peers
    fileChannel.send(message)

    console.log("File sent successfully!")
  })
```

### Explanation

1.  **Data Channel**: We create a specific channel (`file-transfer`) to handle file transfers, keeping them separate from other data like chat messages.
2.  **Metadata Support**: Metadata (like file name, type, and a unique ID) is packaged into a single object along with the file content (`ArrayBuffer`). This entire object is what's sent through the channel.
3.  **Broadcasting Files**: The `fileChannel.send()` method transmits the object (metadata + payload) to all peers in the channel.
4.  **Receiving Files**: The `fileChannel.on('message', ...)` event receives the object. The recipient can then extract the metadata and payload to reconstruct and save the file.
5.  **Encryption**: By initializing `GDB` with a `password`, all data channel communications, including files, are end-to-end encrypted.

---

### Best Practices & Considerations

- **File Size Limits & Chunking**: WebRTC data channels have a message size limit (which varies by browser, but is often around 256KB). For larger files, you must implement "chunking": splitting the file into smaller pieces, sending them sequentially, and reassembling them on the receiver's end.
- **Progress Feedback**: The base `db.room.channel` API does not provide built-in progress tracking. If you implement chunking, you can also send progress messages through the same channel to create a progress bar. For example: `fileChannel.send({ type: 'progress', fileId: '...', percent: 50 })`.
- **Error Handling**: Add logic to manage cases where file transfers fail due to network issues or peer disconnections.
- **Handling Multiple Transfers**: To differentiate between simultaneous transfers, include a unique identifier in the metadata for each file (e.g., `{ id: 'unique-file-123' }`). This allows both sender and receiver to track the state and progress of each file independently.

---

## Cellular Mesh for Large-Scale Applications

For applications expecting **100+ concurrent peers**, GenosRTC includes a Cellular Mesh overlay that organizes peers into cells with bridge nodes, reducing connections from O(N²) to O(N).

```javascript
// Enable cellular mesh
const db = await gdb("large-event", { rtc: { cells: true } })

// The API remains identical - your existing code works unchanged
const chat = db.room.channel("chat")
chat.send({ text: "Hello everyone!" })
```

| Scenario | Recommendation |
|----------|----------------|
| Small team collaboration (< 50) | `rtc: true` |
| Medium rooms (50-100) | Either works |
| Large event/webinar (100+) | `rtc: { cells: true }` |
| Massive multiplayer (1000+) | `rtc: { cells: { bridgesPerEdge: 3 } }` |

For detailed configuration options, mesh API, and architecture documentation, see:
- **[genosrtc-api-reference.md](genosrtc-api-reference.md#-cellular-mesh-network)** — Quick API reference
- **[genosrtc-cells.md](genosrtc-cells.md)** — Full technical documentation (architecture, metrics, TTL, bridges)
