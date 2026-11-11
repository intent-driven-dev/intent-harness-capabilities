---
status: superseded
superseded-by: 0002-sqlite-storage.md
---
# Store application data in JSON files

## Context and Problem Statement

The initial application is small and needs persistent storage with minimal setup.

## Considered Options

- JSON files
- SQLite

## Decision Outcome

Chosen option: "JSON files", because they are simple to inspect and require no database dependency. This decision was originally accepted and is now superseded by [0002](0002-sqlite-storage.md).

### Consequences

- Good, because setup and debugging are simple.
- Bad, because concurrent read-modify-write operations caused lost updates.
- Bad, because updates spanning multiple records lacked transactional guarantees.
