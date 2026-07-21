// Negative type tests: each line below is a MISUSE of the documented API and
// MUST be a compile error. `@ts-expect-error` inverts the check — if a typing
// regression ever makes one of these compile, tsc fails the whole suite.
// Together with valid.ts this proves the typings actually check (not `any`).
import { gdb } from "genosdb"

// @ts-expect-error — gdb requires a database name
const nodb = await gdb()

const db = await gdb("typed-db", { rtc: true })

// @ts-expect-error — put requires a value
await db.put()

// @ts-expect-error — get requires an id
await db.get()

// @ts-expect-error — link takes string ids, not numbers
await db.link(1, 2)

// @ts-expect-error — order is 'asc' | 'desc'
await db.map({ order: "sideways" })

// @ts-expect-error — $limit is a number
await db.map({ $limit: "ten" })

const room = db.room!

// @ts-expect-error — leave takes no arguments
room.leave(1)

// @ts-expect-error — channel send requires the data payload
room.channel("cursors").send()

const sm = db.sm!

// @ts-expect-error — assignRole takes (address: string, role: string)
await sm.assignRole(123)

export {}
