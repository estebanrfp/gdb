// Type definitions for genosdb
// GenosDB is written in modern JavaScript; these typings describe its public,
// documented API surface (docs/genosdb-api-reference.md and module guides).
// Queries are intentionally permissive: the engine is dynamic, so filters are
// open objects — known operators are listed for discoverability, and any field
// name is allowed.

declare module "genosdb" {
  // ── Nodes ──────────────────────────────────────────────────────────

  /** Hybrid Logical Clock timestamp. */
  export interface HLC {
    physical: number
    logical: number
  }

  /** A stored node as returned by queries and reactive callbacks. */
  export interface NodeObject<V = any> {
    id: string
    value: V
    /** Ids of nodes this node links to. */
    edges: string[]
    timestamp: HLC | number
  }

  // ── Queries ────────────────────────────────────────────────────────

  /**
   * Comparison / logical operators understood by the query engine
   * (Operators.js). A filter value can be a literal (equality) or an
   * object combining these operators.
   */
  export interface QueryOperators {
    $eq?: any
    $ne?: any
    $gt?: number | string
    $gte?: number | string
    $lt?: number | string
    $lte?: number | string
    $in?: any[]
    $between?: [any, any]
    $exists?: boolean
    $startsWith?: string
    $endsWith?: string
    $contains?: string
    /** Full-text, accent-insensitive match on a field. */
    $text?: string
    $like?: string
    $regex?: string | RegExp
    $not?: Query
    $and?: Query[]
    $or?: Query[]
    /** Recursive graph traversal: sub-query applied to every descendant. */
    $edge?: Query
    /** Proximity search by Haversine distance, radius in km. */
    $near?: { latitude: number; longitude: number; radius: number }
  }

  /** MongoDB-style filter: field names to literals or operator objects. */
  export type Query = { [field: string]: any } & QueryOperators

  export interface QueryOptions {
    /** Filter. Defaults to `{}` (all nodes). */
    query?: Query
    /** Sort field. */
    field?: string
    /** Sort order. Defaults to `'asc'`. */
    order?: "asc" | "desc"
    /** Limit the number of results. */
    $limit?: number
    /** Paginate after a specific node id. */
    $after?: string
    /** Paginate before a specific node id. */
    $before?: string
    /** Explicitly enable/disable real-time mode. */
    realtime?: boolean
  }

  /** Event delivered to a real-time `map` callback. */
  export interface MapEvent<V = any> extends NodeObject<V> {
    action: "initial" | "added" | "updated" | "removed"
  }

  export type MapCallback<V = any> = (event: MapEvent<V>) => void

  export interface MapResult<V = any> {
    results: NodeObject<V>[]
    /** Present when real-time mode is active. */
    unsubscribe?: () => void
  }

  export interface GetResult<V = any> {
    result: NodeObject<V> | null
    /** Present when a callback was provided (reactive mode). */
    unsubscribe?: () => void
  }

  // ── Room (GenosRTC) ────────────────────────────────────────────────

  export interface RoomChannel<T = any> {
    /** Send to all peers or specific ids. `meta` requires a binary payload. */
    send(
      data: T,
      targets?: string | string[],
      meta?: Record<string, any>,
      onProgress?: (fraction: number, peerId: string, meta?: any) => void
    ): void
    on(event: "message", handler: (data: T, peerId: string, meta?: any) => void): void
    /** Incoming payload still arriving. `fraction` runs 0 → 1. */
    on(event: "progress", handler: (fraction: number, peerId: string, meta?: any) => void): void
    off(event: string, handler: (...args: any[]) => void): void
  }

  export interface RoomEvents {
    /**
     * A peer joined. `type` is the peer's declared kind — `'superpeer'`
     * for a Fallback Server, `undefined` for regular peers.
     * Informational only: never use it for trust decisions.
     */
    "peer:join": (peerId: string, type?: string) => void
    "peer:leave": (peerId: string) => void
    "stream:add": (stream: MediaStream, peerId: string, meta?: any) => void
    "track:add": (track: MediaStreamTrack, stream: MediaStream, peerId: string, meta?: any) => void
    /** Cellular Mesh: local overlay state (cellId, isBridge, bridges…). */
    "mesh:state": (state: any) => void
    /** Cellular Mesh: gossiped remote peer state. */
    "mesh:peer-state": (data: any) => void
  }

  export interface Room {
    on<E extends keyof RoomEvents>(event: E, handler: RoomEvents[E]): void
    on(event: string, handler: (...args: any[]) => void): void
    off(event: string, handler: (...args: any[]) => void): void
    /** Named data channel (identifier UTF-8, max 12 bytes). */
    channel<T = any>(name: string): RoomChannel<T>
    /** Connected peer ids mapped to their RTC connections. */
    getPeers(): Record<string, unknown>
    /** Disconnect from the room and all peers. */
    leave(): void
    addStream(stream: MediaStream, targets?: string | string[], meta?: any): void
    removeStream(stream: MediaStream, targets?: string | string[]): void
    /** Add a single track to a stream already shared with peers. */
    addTrack(
      track: MediaStreamTrack,
      stream: MediaStream,
      targets?: string | string[],
      meta?: any
    ): void
    /** Stop sending a single track. */
    removeTrack(track: MediaStreamTrack, targets?: string | string[]): void
    /** Replace a track in place; the peer is located from `oldTrack`. */
    replaceTrack(
      oldTrack: MediaStreamTrack,
      newTrack: MediaStreamTrack,
      targets?: string | string[],
      meta?: any
    ): void
    /** Cellular Mesh overlay handle (present with `rtc: { cells }`). */
    mesh?: any
  }

  // ── Security Manager ───────────────────────────────────────────────

  export interface CustomRole {
    can: string[]
    inherits?: string[]
  }

  export interface SMOptions {
    /** Constitution: authorized superadmin addresses. */
    superAdmins: string[]
    /** Role → permissions map overriding the built-in ladder. */
    customRoles?: Record<string, CustomRole>
    /** Governance rules (`{ if: <query>, then: { assignRole } }`). */
    governanceRules?: any[]
    [option: string]: any
  }

  export interface ACLs {
    /** Create (value only) or update (value + id). `owner` and `collaborators` are engine-managed: they are stripped from the value and re-based on the stored node. */
    set(value: any, id?: string): Promise<string>
    /** Owner-only. One level per address; granting again replaces the previous level. */
    grant(nodeId: string, ethAddress: string, permission: "read" | "write" | "delete"): Promise<any>
    revoke(nodeId: string, ethAddress: string): Promise<any>
    delete(nodeId: string): Promise<any>
  }

  /** State pushed to `setSecurityStateChangeCallback` on every session change. */
  export interface SecurityState {
    /** A local signer is active: writes can be signed. */
    isActive: boolean
    activeAddress: string | null
    /** Abbreviated address (`0x1234...abcd`) for display. */
    abbrAddr: string
    /** The active session was opened via WebAuthn. */
    isWebAuthnProtected: boolean
    /** A freshly generated identity is held in memory, not yet secured. */
    hasVolatileIdentity: boolean
    /** This device has a WebAuthn registration to log in with. */
    hasWebAuthnHardwareRegistration: boolean
  }

  export interface SecurityManager {
    startNewUserRegistration(): Promise<any>
    loginCurrentUserWithWebAuthn(): Promise<any>
    loginOrRecoverUserWithMnemonic(mnemonic: string): Promise<any>
    protectCurrentIdentityWithWebAuthn(ethPrivateKeyForProtection?: string): Promise<any>
    hasExistingWebAuthnRegistration(): boolean | Promise<boolean>
    isCurrentSessionProtectedByWebAuthn(): boolean
    isSecurityActive(): boolean
    getActiveEthAddress(): string | null
    /** Mnemonic held in memory right after registration or recovery, for one-time display. */
    getMnemonicForDisplayAfterRegistrationOrRecovery(): string | null
    clearSecurity(): Promise<void>
    setSecurityStateChangeCallback(callback: (state: SecurityState) => void): void
    setGovernanceStateChangeCallback(callback: (state: any) => void): void
    assignRole(targetUserEthAddress: string, role: string, expiresAt?: number | string): Promise<any>
    executeWithPermission(operationName: string): Promise<any>
    /** Signed write (same shape as `db.put`). */
    put(value: any, id?: string): Promise<string>
    /** Read with security context (same shape as `db.get`). */
    get(id: string, callback?: (node: NodeObject | null) => void): Promise<GetResult>
    /**
     * Query encrypted nodes: decrypts them all, then applies the same query
     * engine as `db.map()`. Realtime mode is not supported — there is no
     * callback and each call performs a fresh decrypt-and-query cycle.
     */
    map(options?: QueryOptions): Promise<MapResult>
    /** Delete an encrypted node by id; the internal SM prefix is handled for you. */
    remove(id: string): Promise<void>
    /** Abbreviate an address (`0x1234...abcd`) for display. */
    abbrAddr(address: string): string
    encryptDataForCurrentUser(data: any): Promise<any>
    decryptDataForCurrentUser(encrypted: any): Promise<any>
    /** Node-level access control lists. */
    acls: ACLs
    [member: string]: any
  }

  // ── Options ────────────────────────────────────────────────────────

  export interface CellsOptions {
    cellSize?: "auto" | number
    bridgesPerEdge?: number
    maxCellSize?: number
    targetCells?: number
    debug?: boolean
  }

  export interface RTCOptions {
    /** Custom Nostr signaling relay URLs (wss://…). */
    relayUrls?: string[]
    /** TURN servers for NAT traversal. */
    turnConfig?: RTCIceServer[]
    /** Cellular Mesh overlay for large rooms. */
    cells?: boolean | CellsOptions
  }

  export interface GDBOptions {
    /** Enable P2P networking. `true` for defaults, object to customize. */
    rtc?: boolean | RTCOptions
    /** Enable the Security Manager (zero-trust, WebAuthn, governance). */
    sm?: SMOptions
    /** Optional encryption key. */
    password?: string
    /** Enable internal debug logging. Defaults to `false`. */
    debug?: boolean
    /** Debounce (ms) for persisting the graph. Defaults to `200`. */
    saveDelay?: number
    /** Max operations kept for delta P2P sync. Defaults to `20`. */
    oplogSize?: number
  }

  // ── Database ───────────────────────────────────────────────────────

  export interface GDB {
    /** Insert (or update, when `id` is given) a node. Resolves to its id. */
    put(value: any, id?: string): Promise<string>
    /** Read a node; pass a callback for reactive mode. */
    get(id: string, callback?: (node: NodeObject | null) => void): Promise<GetResult>
    /**
     * Query nodes. Accepts an options object and/or a callback in any
     * order; providing a callback enables real-time mode.
     */
    map(options?: QueryOptions, callback?: MapCallback): Promise<MapResult>
    map(callback: MapCallback, options?: QueryOptions): Promise<MapResult>
    map(...args: Array<QueryOptions | MapCallback>): Promise<MapResult>
    /** Create a directed edge between two nodes. */
    link(sourceId: string, targetId: string): Promise<void>
    /** Remove a directed edge between two nodes; both nodes stay. */
    unlink(sourceId: string, targetId: string): Promise<void>
    /** Delete a node and its references. */
    remove(id: string): Promise<void>
    /** Delete every node and index. */
    clear(): Promise<void>
    /**
     * Middleware over incoming P2P operation batches. Receives the batch and a
     * Map of each node's previous state; return the (filtered) batch, or
     * nothing to discard the whole message.
     */
    use(
      middleware: (
        operations: any[],
        previousStates: Map<string, any>
      ) => Promise<any[] | void> | any[] | void
    ): void
    /** P2P room (present when `rtc` is enabled). */
    room?: Room
    /** This peer's id (present when `rtc` is enabled). */
    selfId?: string
    /** Security Manager (present when `sm` is configured). */
    sm?: SecurityManager
    [module: string]: any
  }

  /**
   * Create (or open) a database.
   *
   * ```ts
   * import { gdb } from "genosdb"
   * const db = await gdb("my-app", { rtc: true })
   * ```
   */
  export function gdb(name: string, options?: GDBOptions): Promise<GDB>
}
