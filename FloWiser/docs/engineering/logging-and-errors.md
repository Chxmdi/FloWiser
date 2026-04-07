# Logging and Errors

## Logging format
Use structured JSON logs for backend services.

### Required fields
- timestamp
- level
- service
- message
- request id where available
- tenant id / site id when available and safe
- error code when applicable

## Error code convention
Format: `FLOWISER_<DOMAIN>_<DETAIL>`

Examples:
- `FLOWISER_AUTH_UNAUTHORIZED`
- `FLOWISER_DEVICE_NOT_FOUND`
- `FLOWISER_ENV_INVALID`
- `FLOWISER_MIGRATION_FAILED`

## Logging rules
- never log secrets
- never log raw credentials or tokens
- log enough context to support triage
- use warnings for recoverable issues and errors for action-required failures
