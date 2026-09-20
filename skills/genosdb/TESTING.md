# Testing — proving that peers sync, without fooling yourself

Verify a GenosDB application with Playwright (`@playwright/test`), not by eye in one browser. These rules are the ones the engine's own conformance suite enforces, in real browsers over real WebRTC; break one and a green test may prove nothing.

## The rules

1. **A peer is a `BrowserContext`, never a tab.** Each context has its own OPFS, localStorage, IndexedDB, cookies and BroadcastChannel. Two tabs of one origin share all of them: they are one peer wearing two hats, and "it synced" between them proves nothing about the network.
2. **A fresh room per test.** The graph also lives on the wire: any peer still holding the previous state — another run, a stray tab, a Fallback Server — replicates it straight back into a "clean" context. Derive the database name from a per-run id.
3. **Discovery is local.** Run the Fallback Server with `--relay` (an embedded Nostr relay on `$PORT`) and point every peer's `rtc.relayUrls` at it; no public relay decides whether two peers meet, and nothing leaves the machine. Start it from `playwright.config` `webServer` alongside a static server.
4. **No sleeps.** Web-first assertions retry (`await expect(locator).toHaveText(…)`, `expect.poll`) and are exactly right for eventual consistency; raise `expect.timeout` (convergence takes seconds: relay discovery, then governance cycles). A time-based rule states its condition explicitly instead of sleeping.
5. **No vacuous negatives.** "Nothing changed" is only meaningful after a **sentinel**: a legitimate write, sent by the same path after the refused one, that must arrive. A refusal that cannot be told from a disconnection is not a result.
6. **Assert the transport.** "The data appeared on the other peer" can come from shared storage. Wrap `RTCPeerConnection` before any page script runs, then read `getStats()` after the app-level assertion: a `candidate-pair` with `state: "succeeded"` and non-zero `bytesSent` / `bytesReceived` proves ICE negotiated a real path. Expect many more constructions than connected peers (pooled offers): assert on succeeded pairs, never on constructions.
7. **Open roles only where RBAC would mask the verdict** (ACL and envelope tests); everywhere else keep the strict ladder so a refusal means what it says.
8. **Test the negative too.** In a zero-trust system "nothing was granted without a signature" is a requirement, and the assertion that catches an accidentally permissive constitution.
9. **Assert against the rendered UI**, never through `page.evaluate(() => import(...))`: a dynamic import from the console can resolve to a different module instance than the running app's.

## Techniques

- **Transport stats** — `context.addInitScript(() => { const N = window.RTCPeerConnection; window.__pcs = []; window.RTCPeerConnection = class extends N { constructor(...a) { super(...a); window.__pcs.push(this) } }; Object.setPrototypeOf(window.RTCPeerConnection, N) })`, then `page.evaluate(async () => { for (const pc of window.__pcs) for (const s of (await pc.getStats()).values()) if (s.type === "candidate-pair" && s.state === "succeeded") return { bytesSent: s.bytesSent, bytesReceived: s.bytesReceived } })`.
- **Passkeys, headless** — Playwright 1.61+ ships a virtual authenticator: `const cdp = await context.newCDPSession(page); await cdp.send("WebAuthn.enable"); await cdp.send("WebAuthn.addVirtualAuthenticator", { options: { protocol: "ctap2", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: true, hasPrf: true } })`. `hasPrf: true` matters: without PRF the engine refuses to protect the key. A passkey session survives reloads, which a mnemonic session does not — worth more here than in most apps.
- **A returning device** — `chromium.launchPersistentContext(userDataDir)`: OPFS, oplog and clock survive `context.close()` and a relaunch. A fresh context is a new device.
- **A partitioned peer** — open it with an **unreachable relay** (`relayUrls: ["ws://127.0.0.1:9"]`): it signs and queues its writes and nobody hears; reopen it with the real relay to deliver them. Do **not** use `rtc: false` for this: a local-only database neither signs nor queues, so nothing ships later.
- **Offline-first** — `context.setOffline(true)` cuts fetch and WebSocket (so, the relay); an already-open WebRTC data channel may outlive it. Assert that the peer count actually drops before trusting the partition, or use the unreachable-relay technique.
- **A skewed clock** — override `Date` with `context.addInitScript` before navigation. Keep the skew under 60 s (the relay filters `created_at` against the subscriber's clock) and under two hours (the gate refuses operations further ahead).
- **Deterministic governance** — run the Fallback Server with `GDB_SM_KEY` and `GDB_SM_RULES` as the always-on superadmin, so promotions do not depend on a browser tab staying open; it persists the graph in SQLite. The browser engine has a settle delay and cycles every 4 s: assert the promotion with a generous timeout, not a sleep.
- **The 200 ms save debounce** — a write made just before a power-off must reach the disk; state the timed condition (`expect.poll(() => Date.now() - t0).toBeGreaterThan(1_500)`) rather than sleeping blindly.

## A skeleton

```js
// playwright.config.js: workers: 1 · expect: { timeout: 60_000 } · timeout: 300_000 · trace: "on-first-retry"
// webServer: a static server for the app + `GDB_RELAY=1 PORT=5606 bun node_modules/genosdb/dist/genossrv.min.js <any-name>` for discovery
import { test, expect } from "@playwright/test"
const RELAY = "ws://127.0.0.1:5606"
const room = () => `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
const open = async (browser, room, who) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(`http://localhost:5605/app.html?room=${room}&who=${who}&relay=${RELAY}`)   // the app reads room, identity and relay from the query
  await expect(page.locator("#status")).toHaveText("ready")
  return { page, context }
}
test("a write reaches the other peer over WebRTC", async ({ browser }) => {
  const r = room()
  const alice = await open(browser, r, "alice"), bob = await open(browser, r, "bob")
  await expect.poll(() => bob.page.evaluate(() => window.app.peerCount()), { timeout: 90_000 }).toBeGreaterThanOrEqual(1)
  await alice.page.getByRole("button", { name: "Add" }).click()
  await expect(bob.page.getByRole("listitem")).toHaveCount(1)     // the app-level assertion first…
  // …then the transport: at least one succeeded candidate pair with bytes on bob's side
  await alice.context.close(); await bob.context.close()
})
```

Give the app a tiny test surface (`window.app.peerCount()`, a `#status` that reads `ready`, `data-node="<id>"` rows) — locators scoped to regions, role and label selectors — and keep the demo identities of the design guide (§4.5) so every test signs in the same way a user does.
