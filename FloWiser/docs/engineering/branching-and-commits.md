# Branching and Commits

## Branch strategy
- `main` is always deployable
- short-lived feature branches branch from `main`
- hotfix branches branch from `main`
- no long-running integration branch unless a release train requires it later

## Branch naming
- `feature/<ticket-or-scope>`
- `fix/<ticket-or-issue>`
- `chore/<scope>`
- `docs/<scope>`

## Commit style
Use imperative, scoped commits:
- `feat(backend): add health route`
- `chore(ci): add migration workflow`
- `docs(engineering): define api versioning`

## Merge rule
Prefer squash merges for feature branches unless preserving commit history is necessary for debugging or audit.
