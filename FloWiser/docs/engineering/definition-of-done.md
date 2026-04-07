# Definition of Done

A story is not done until:

- code is merged to `main`
- lint passes
- tests pass
- typecheck passes
- build passes
- docs are updated when behavior or workflow changed
- migrations are included when schema changed
- environment variables are documented when added
- observability and rollback implications are considered
- acceptance criteria are demonstrably met

A platform or infrastructure story is also not done until:
- the operator path is documented
- failure mode is understood
- ownership is clear
