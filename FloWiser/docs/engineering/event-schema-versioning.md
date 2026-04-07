# Event Schema Versioning

## Rule
Every normalized event contract must include a schema version field.

## Convention
- additive, backward-compatible changes bump the **minor** version
- breaking changes bump the **major** version
- deprecated fields remain for at least one full delivery cycle before removal

## Operational requirement
Decoder changes and downstream consumer updates must be tracked together so replay and reprocessing stay safe.
