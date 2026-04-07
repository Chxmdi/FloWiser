# API Versioning

## Rule
Do not version internal-only routes prematurely. Version the API once the first external client contract is published.

## Planned convention
- prefix external APIs with `/api/v1`
- keep route and payload changes backward-compatible within a major version
- breaking changes require:
  - version bump
  - migration note
  - consumer impact note
  - release note entry

## Review check
Any PR that changes an external response shape must state whether the change is backward-compatible.
