### **Conflict Resolution System Documentation: Hybrid Logical Clock (HLC)**

![image](https://github.com/user-attachments/assets/0586162e-1800-4056-896b-865d89ae4df5)

#### **Overview**

This document outlines the architecture of the conflict resolution system, which is engineered to maintain data consistency and integrity across a distributed, peer-to-peer (P2P) network. The system's foundation is a **Last-Write-Wins (LWW)** strategy, but it is significantly enhanced by the implementation of a **Hybrid Logical Clock (HLC)**. This advanced timekeeping mechanism provides causally-ordered, monotonic timestamps for all operations, ensuring that conflict resolution is deterministic, reliable, and immune to the common pitfalls of physical clock desynchronization in distributed environments.

---

#### **The Hybrid Logical Clock Mechanism**

The Hybrid Logical Clock is a distributed timekeeping algorithm that combines two components to form a unique and ordered timestamp for every event in the system:

1.  **Physical Component**: This is a representation of physical wall-clock time, derived from the system's local clock. Its primary purpose is to keep timestamps generally aligned with real-world time, which is useful for logging, auditing, and ensuring that events do not drift indefinitely from physical reality.

2.  **Logical Component**: This is a sequential counter used as a tie-breaker to order events that occur within the same physical time unit (e.g., the same millisecond). It is the key to preserving the causal "happens-before" relationship between operations that occur in rapid succession.

The clock operates through two primary functions: generating new timestamps for local events and updating itself based on timestamps from remote events.

##### **Local Timestamp Generation**

When a new local operation (such as creating or modifying a node) occurs, the system requests a new timestamp from its HLC. The clock guarantees that this new timestamp is strictly greater than any it has previously generated or observed. This is achieved by first ensuring the physical component is monotonic (it never moves backward, even if the system clock is adjusted). Then, the logical component is incremented to create a unique timestamp for that specific operation.

##### **Clock Synchronization with Remote Events**

Maintaining causal order across the network is the HLC's most critical function. When a node receives data from a peer, it inspects the HLC timestamp of the incoming data. The local clock then performs a synchronization routine to "learn" from this remote time. The local clock's physical component is advanced to the maximum of its current value and the remote timestamp's physical value. Following this, the logical component is updated in a manner that ensures the local clock's next generated timestamp will be causally after the remote event it just observed. This update protocol is the core mechanism that propagates causal information through the network.

---

#### **The Last-Write-Wins (LWW) Resolution Process**

The LWW strategy uses the rich information from HLC timestamps to resolve conflicts deterministically when concurrent updates to the same data item are detected. This process is encapsulated within a dedicated conflict resolution function.

##### **Timestamp Comparison Logic**

When comparing two HLC timestamps to determine which is "later," a precise, two-step lexicographical comparison is performed:
1.  The **physical components** are compared first. The timestamp with the greater physical value is considered the winner.
2.  If, and only if, the physical components are identical, the **logical components** are then compared. The timestamp with the greater logical value wins the tie-break.

This hierarchical comparison ensures a total ordering of all events in the system.

##### **Mitigation of Clock Skew and Future Drift**

A significant challenge in distributed systems is clock skew, where a node's physical clock is inaccurate. A predefined threshold bounds how far ahead of the receiver's own clock an incoming timestamp may run: two hours. An operation, or a synchronisation envelope, whose physical component exceeds that threshold is not applied and does not advance the receiver's clock; it returns through catch-up once the receiver's clock reaches it, and a forged one never applies. Refusing, rather than capping, keeps every replica holding the same timestamp for the same operation, which is what makes last-write-wins deterministic across peers.

##### **Resolution Decision Flow**

The resolution process is triggered whenever an incoming update targets data that already exists locally.
1.  First, an incoming timestamp more than two hours ahead of the local clock is refused, as described above.
2.  Next, if no local version of the data exists, the incoming change is accepted unconditionally.
3.  If a local version does exist, the HLC timestamp of the incoming change is compared against the HLC timestamp of the local data.
4.  If the comparison determines the incoming timestamp is greater, the remote change "wins," and the local data is overwritten.
5.  Conversely, if the local timestamp is greater than or equal to the incoming one, the local data is preserved, and the remote change is discarded.

---

#### **System Integration and Data Flow**

The conflict resolution logic is seamlessly integrated into the network message processing pipeline. When a node receives a set of changes from a peer, each `update` operation is passed through the conflict resolution function. If the resolution outcome favors the remote change, two actions occur: the local graph database is updated with the new data, and critically, the local Hybrid Logical Clock is synchronized with the winning timestamp. This final step ensures the local node has "fast-forwarded" its clock past the event it just accepted, maintaining the system's causal consistency for all future operations.

By following this integrated flow, every node converges toward the same state independently, achieving eventual consistency in a robust and deterministic manner.