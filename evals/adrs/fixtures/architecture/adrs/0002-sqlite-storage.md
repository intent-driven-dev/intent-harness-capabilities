---
status: accepted
supersedes: 0001-json-file-storage.md
---
# Store application data in SQLite

## Context and Problem Statement

Concurrent writes to JSON files caused lost updates, and multi-record updates lacked transactional guarantees. These concrete problems motivated replacing [0001](0001-json-file-storage.md).

## Considered Options

- Continue with JSON files and implement locking and transaction handling ourselves
- SQLite

## Decision Outcome

Chosen option: "SQLite", because database-managed transactions and write coordination address the observed problems without operating a separate database service. This accepted decision supersedes [0001](0001-json-file-storage.md).

### Consequences

- Good, because transactions support atomic multi-record updates and coordinated writes.
- Good, because deployment remains local without a database server.
- Bad, because the application gains a database dependency and schema migration work.
- Bad, because SQLite still permits only one writer at a time and contention needs handling.
