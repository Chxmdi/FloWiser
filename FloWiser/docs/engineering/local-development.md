# Local Development

## Requirements
- Node 20
- Docker / Docker Compose
- npm 10+

## Setup
1. Copy all `.env.example` files to `.env`
2. Run `docker compose up -d`
3. Run `npm install`
4. Run `npm run dev`

## Local services
- TimescaleDB/Postgres on `localhost:5432`
- MQTT broker on `localhost:1883`
- Redis on `localhost:6379`
- Mailpit on `localhost:8025`

## Developer rules
- never commit a real `.env`
- keep local credentials disposable
- run lint, test, typecheck, and build before opening a PR
- use the health route and migration runner as early smoke checks
