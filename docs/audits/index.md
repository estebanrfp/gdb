# GenosDB Security Audits

Published security audits of GenosDB, its transport (GenosRTC) and its Fallback Server (GenosSRV): date, reviewer, scope, what held, what was found and how it was fixed. Every guarantee the engine makes is in [SECURITY.md](../../SECURITY.md); what it does cryptographically is in [CRYPTOGRAPHY.md](../../CRYPTOGRAPHY.md). Researchers and organizations who review GenosDB are invited to have their report listed here — see the README's [Verification and Audits](../../README.md#verification-and-audits).

| date | audited | reviewer · method | scope | result | report |
|---|---|---|---|---|---|
| 2026-09-19 | GenosDB 0.36.0 · GenosRTC 0.31.2 · GenosSRV 0.12.0 | Cloudflare `security-audit` skill, quick profile: independent verifier per candidate, every rejection re-read by a second verifier; an independent black-box matrix of 46 cases with a different toolchain | engine, examples, release chain; transport and signaling; Fallback Server | 4 findings, 4 fixed in 0.36.1 with a test red first · 2 candidates disproved · 12 units closed clean · 5 deferred | [2026-09-19 — GenosDB 0.36.0](2026-09-19-genosdb-0.36.0.md) |

## Reports

  - 🔎 [Security audit — GenosDB 0.36.0](2026-09-19-genosdb-0.36.0.md) (September 2026: method, what held, the four findings and their fixes in 0.36.1, the two disproved candidates, what was not covered, evidence)
