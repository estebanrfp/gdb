// Compile-time smoke test: every snippet mirrors the official docs.
// If this file typechecks, the typings accept the documented usage.
import { gdb } from "genosdb"

// ── gdb() options (api-reference) ───────────────────────────────────
const db = await gdb("my-db")
const db2 = await gdb("secure-db", { password: "secret" })
const db3 = await gdb("my-db", { rtc: true, debug: true, saveDelay: 200, oplogSize: 20 })
const db4 = await gdb("my-db", {
  rtc: {
    relayUrls: ["wss://relay1.example.com"],
    turnConfig: [{ urls: ["turn:server.com:3478"], username: "user", credential: "pass" }],
    cells: { cellSize: "auto", bridgesPerEdge: 2, maxCellSize: 50, targetCells: 100, debug: false },
  },
  sm: { superAdmins: ["0xE5639DfE345F8ab845bEBE63a1C7322F9c6fF5c7"] },
  geo: true,
  nlq: true,
  audit: true,
})

// ── CRUD ────────────────────────────────────────────────────────────
const id = await db.put({ type: "User", name: "Ana" })
await db.put({ name: "Ana B" }, id)
const { result } = await db.get(id)
if (result) console.log(result.value, result.edges, result.id)
const { unsubscribe: stopGet } = await db.get(id, (node) => console.log(node?.value))
stopGet?.()
await db.link(id, id)
await db.remove(id)
await db.clear()

// ── Queries: operators, $edge, sort, pagination ─────────────────────
const { results } = await db.map({
  query: {
    type: "Folder",
    name: "Documents",
    $edge: { type: "File", $or: [{ extension: "jpg" }, { size: { $gt: 1024 } }] },
  },
})
results.forEach((n) => console.log(n.id, n.value, n.timestamp))

await db.map({ query: { type: "user" }, field: "name", order: "asc" })
await db.map({ query: { category: "news" }, field: "timestamp", order: "desc", $limit: 15, $after: "d5f3g2", realtime: true })
await db.map({ query: { age: { $gte: 18, $lte: 65 }, name: { $startsWith: "A" }, bio: { $text: "engineer" }, tags: { $in: ["a", "b"] }, score: { $between: [1, 10] }, active: { $exists: true } } })

// ── Real-time map: callback-first and options-first ─────────────────
const { unsubscribe } = await db.map(({ id, value, action }) => {
  if (action === "added") console.log(id, value)
})
unsubscribe?.()
await db.map({ query: { type: "post" } }, ({ id, value, action, edges, timestamp }) => {
  if (action === "removed") console.log(id, edges, timestamp)
})

// ── Middleware ──────────────────────────────────────────────────────
db.use(async (operations) => operations.filter((op) => op.type !== "remove"))

// ── db.room (genosrtc-api-reference) ────────────────────────────────
const room = db3.room!
room.on("peer:join", (peerId, type) => {
  if (type === "superpeer") console.log(`${peerId} is a Fallback Server`)
})
room.on("peer:leave", (peerId) => console.log(peerId))
room.on("stream:add", (stream, peerId) => console.log(stream.id, peerId))
const cursorChannel = room.channel<{ x: number; y: number }>("cursors")
cursorChannel.on("message", (position, peerId) => console.log(position.x, peerId))
cursorChannel.send({ x: 120, y: 345 })
room.getPeers()
room.leave()

// ── Security Manager (sm-api-reference) ─────────────────────────────
const sm = db4.sm!
await sm.startNewUserRegistration()
await sm.loginCurrentUserWithWebAuthn()
await sm.loginOrRecoverUserWithMnemonic("panic now afford carbon donate lecture drift excite collect essay stuff prosper")
sm.isSecurityActive()
sm.getActiveEthAddress()
sm.setSecurityStateChangeCallback(({ isActive, activeAddress }) => console.log(isActive, activeAddress))
await sm.assignRole("0xbfDe0eCEC5332Fd86D2570085571D6051Df098dA", "user", Date.now() + 3600_000)
await sm.executeWithPermission("write")
const sid = await sm.put({ private: "data" })
await sm.get(sid)
await sm.acls.set(sid, { owner: "0xbfDe0eCEC5332Fd86D2570085571D6051Df098dA" })
await sm.acls.grant(sid, "0x1111111111111111111111111111111111111111")
await sm.acls.revoke(sid, "0x1111111111111111111111111111111111111111")
await sm.acls.delete(sid)
await sm.clearSecurity()

console.log(db2.selfId)
