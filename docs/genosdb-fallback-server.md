# GenosDB Fallback Server (GenosSRV)

GenosDB is designed to run without servers. The **Fallback Server** is an optional superpeer you can add to a room when you want guarantees no browser can give: being always on.

It ships as a **single file with zero dependencies** — `genossrv.min.js`, published with the GenosDB dist — and runs anywhere [Bun](https://bun.sh) runs.

## What it does

| | |
|---|---|
| ✅ **Durable memory** | Persists the room's graph in SQLite (WAL, crash-safe). Data survives even when every browser closes. |
| ✅ **Availability anchor** | Peers that were offline catch up from it (delta or full-state sync) the moment they return. |
| ✅ **Governance authority** *(optional)* | With a signing identity, it acts as an always-on superadmin: role assignments and governance rules run 24/7. |

The server behaves as just another peer in the network: it discovers and connects through the same Nostr relays as everyone else, and every operation it emits is verified by every browser like anyone else's. It does not centralize anything — it only adds the one guarantee no browser can offer, being always on.

## Quick start

```bash
# 1. Get the artifact (one file, zero dependencies)
curl -fsSL https://cdn.jsdelivr.net/npm/genosdb@latest/dist/genossrv.min.js -o genossrv.min.js

# 2. Run it — join the same database name your app uses
bun genossrv.min.js myAppDB
```

That's it. The server joins the room, syncs bidirectionally, and persists everything in `./data.sqlite`.

### CLI reference

```bash
bun genossrv.min.js <name> [--cells] [--room]
```

| Flag / env | Effect |
|---|---|
| `<name>` (or `GDB_ROOM`) | Database name — must match the browsers' `gdb(name, …)` |
| `--cells` (or `GDB_CELLS=1`) | Cellular Mesh transport — required when browsers use `rtc: { cells: … }` |
| `--room` | Also join `db.room` (presence): mesh monitors and presence UIs will show the server |
| `GDB_DB_PATH` | SQLite file path (default `./data.sqlite`) |
| `GDB_SM_KEY` | Signing identity: a BIP39 mnemonic or a `0x` private key (see Governance) |
| `GDB_SUPERADMINS` | Comma-separated superadmin addresses (the same list your clients ship) |
| `GDB_SM_RULES` | Governance rules: **inline JSON** (an array — or a single rule object — of the same shape the clients publish) or a path to a module whose default export is that array |

**Match the transport to your app.** A room where browsers use `rtc: { cells: … }` speaks over per-cell channels; start the server with `--cells` or it cannot receive browser writes (it will print a one-line warning telling you exactly this).

### As a module

Options mirror `gdb(name, options)` — same names, same shapes:

```js
import { gdbServer } from './genossrv.min.js'

const db = await gdbServer('myAppDB', {
  rtc: { cells: true },               // as in gdb(): true | { relayUrls, turnConfig, cells }
  room: true,                         // also join db.room (visible to monitors/presence)
  sm: {                               // superadmin identity — key via GDB_SM_KEY
    superAdmins: ['0x…'],             // the same constitution list your clients ship
    governanceRules: rules            // the same rules module your clients publish
  },
  password: 'optional-encryption',
  saveDelay: 200,
  oplogSize: 1000
}, './data.sqlite')
```

The full query engine is available server-side (`db.map` with every operator, realtime subscriptions, middleware via `db.use`) — identical to the browser's.

## Governance: an always-on superadmin

In the browser, the governance engine runs only while a superadmin keeps a tab open. The fallback server removes that limitation: give it a signing identity and it becomes the room's **24/7 governance authority** — promotions, demotions and role expirations no longer depend on anyone being connected.

### How authority works

```bash
# Rules inline (what one-click deploy forms use)…
GDB_SM_KEY="twelve word mnemonic …" \
GDB_SM_RULES='[{"if":{"role":"guest","posts":{"$gte":3}},"then":{"assignRole":"user"}}]' \
bun genossrv.min.js myAppDB

# …or from a module file (default export)
GDB_SM_KEY="twelve word mnemonic …" GDB_SM_RULES=./rules.js bun genossrv.min.js myAppDB
```

At boot the server logs `🛡️ SM: signing as 0x…` — add that address to your application's `sm.superAdmins` list (see the [Security Manager](./sm-api-reference.md) documentation), and every peer verifies the server's operations like any superadmin's: same signatures, same machinery. Revoking it is as simple as removing the address from that list.

### How rules work

**The server must carry the same rules your application declares** — one room, one policy: the server is simply its always-on executor. Each rule's `if` is a plain GenosDB query, evaluated every few seconds against the synced graph with **last-match-wins** resolution: order rules easy→hard, and the last matching rule decides the role. Losing a condition auto-demotes; superadmins are immune by construction. See the [Governance](./governance.md) documentation for the rule model.

```js
// rules.js — default export
export default [
  { if: { role: 'guest', posts: { $gte: 3 } },  then: { assignRole: 'user' } },
  { if: { role: 'user',  karma: { $gte: 100 } }, then: { assignRole: 'manager' } }
]
```

The engine boots prudently (it waits for the first sync exchanges to converge before ruling on the graph) and writes a node only when its resolved role actually changes.

### Key custody

The signing key lives on your server — treat it accordingly: use a **dedicated governance identity** (not your personal superadmin key), inject it through the environment or a secret manager, and never commit it. If the server is ever compromised, removing its address from your clients' `superAdmins` revokes it entirely.

## Deployment

Anywhere Bun runs. The artifact is self-contained, so deployment is: fetch one file, run one command.

**VPS / bare metal**

```bash
curl -fsSL https://cdn.jsdelivr.net/npm/genosdb@latest/dist/genossrv.min.js -o genossrv.min.js
GDB_DB_PATH=/var/lib/genossrv/data.sqlite bun genossrv.min.js myAppDB --cells
```

Run it under your process manager of choice (`systemd`, `pm2`, …) for restarts.

**Docker**

```dockerfile
FROM oven/bun:alpine
ADD https://cdn.jsdelivr.net/npm/genosdb@latest/dist/genossrv.min.js /srv/genossrv.min.js
WORKDIR /srv
VOLUME /srv/data
ENV GDB_DB_PATH=/srv/data/data.sqlite
ENTRYPOINT ["bun", "genossrv.min.js"]
CMD ["myAppDB"]
```

```bash
docker build -t genossrv . && docker run -d -v genossrv-data:/srv/data genossrv myAppDB --cells
```

Any container platform (Fly.io, Railway, Render, …) can deploy that Dockerfile directly.

### 🚀 Deploy to Heroku in one click

Every option — room, transport, identity, governance rules — is an environment variable, so the deploy form configures the whole server:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/estebanrfp/genossrv-deploy)

A fully governed superpeer, from nothing, in one command:

```bash
GDB_ROOM=myAppDB GDB_CELLS=1 \
GDB_SM_KEY="twelve word mnemonic …" \
GDB_SM_RULES='[{"if":{"role":"guest","posts":{"$gte":3}},"then":{"assignRole":"user"}}]' \
bun genossrv.min.js
```

