# Clean State Checkpoint

This document records the current repository hardening baseline after the integrity audit.

## What was tightened
- root and workspace Node/npm engine ranges are now explicit
- root `.npmrc` establishes consistent local install defaults
- CI, preview, staging, and migration workflows now install with `--no-audit --no-fund` for less noisy and more predictable runs
- preview artifact packaging now includes the shared `@flowiser/schemas` workspace and required root workspace files
- raw-event lookup prefers persistent storage when available before falling back to the in-memory hot archive
- backend startup logging now declares whether persistence is enabled and which services still run in mixed mode

## What is still intentionally not fully hardened
The following stores are still wired to in-memory implementations in the live bootstrap:
- raw-event archive hot cache
- idempotency store
- ordering state store
- dead-letter store
- registry store
- quality history store

That means the platform is structurally consistent but not yet fully persistence-consistent.

## Highest-value next hardening moves
1. Commit a real root lockfile and switch CI from `npm install` to `npm ci`
2. Replace the remaining in-memory operational stores with durable implementations
3. Run a full build, test, and migration pass against the current `main`
4. Only then continue with additional feature epics
