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
    /** Geo module: proximity search (requires `geo: true`). */
    $near?: { center: [number, number]; radius: number }
    /** Geo module: bounding-box search (requires `geo: true`). */
    $bbox?: [number, number, number, number]
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
    /** Send data to all peers, or to specific peer ids. */
    send(data: T, targets?: string | string[]): void
    on(event: "message", handler: (data: T, peerId: string) => void): void
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
    "track:add": (track: MediaStreamTrack, stream: MediaStream, peerId: string) => void
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
    replaceTrack(
      oldTrack: MediaStreamTrack,
      newTrack: MediaStreamTrack,
      stream: MediaStream,
      targets?: string | string[]
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
    set(nodeId: string, acl: any): Promise<any>
    grant(nodeId: string, ethAddress: string, permissions?: any): Promise<any>
    revoke(nodeId: string, ethAddress: string): Promise<any>
    delete(nodeId: string): Promise<any>
  }

  export interface SecurityManager {
    startNewUserRegistration(): Promise<any>
    loginCurrentUserWithWebAuthn(): Promise<any>
    loginOrRecoverUserWithMnemonic(mnemonic: string): Promise<any>
    protectCurrentIdentityWithWebAuthn(ethPrivateKeyForProtection?: string): Promise<any>
    hasExistingWebAuthnRegistration(): boolean | Promise<boolean>
    isSecurityActive(): boolean
    getActiveEthAddress(): string | null
    clearSecurity(): Promise<void>
    setSecurityStateChangeCallback(
      callback: (state: { isActive: boolean; activeAddress: string | null }) => void
    ): void
    assignRole(targetUserEthAddress: string, role: string, expiresAt?: number | string): Promise<any>
    executeWithPermission(operationName: string): Promise<any>
    /** Signed write (same shape as `db.put`). */
    put(value: any, id?: string): Promise<string>
    /** Read with security context (same shape as `db.get`). */
    get(id: string, callback?: (node: NodeObject | null) => void): Promise<GetResult>
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
    /** Load the AI module. */
    ai?: boolean | object
    /** Load the Natural Language Queries module. */
    nlq?: boolean
    /** Load the Geo module ($near / $bbox operators). */
    geo?: boolean
    /** Load the Audit module. */
    audit?: boolean
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
    /** Delete a node and its references. */
    remove(id: string): Promise<void>
    /** Delete every node and index. */
    clear(): Promise<void>
    /** Middleware over incoming P2P operation batches. */
    use(middleware: (operations: any[]) => Promise<any[]> | any[]): void
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
