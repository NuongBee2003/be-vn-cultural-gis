# be-vn-cultural-gis

Node.js + Express backend organized in a simple MVC-style structure.

## Quick start

```bash
npm install
npm run dev
```

- Health check: `GET http://localhost:3000/health`

## Structure

- `src/server.js` — process entrypoint
- `src/app.js` — Express app wiring
- `src/routes/` — route definitions
- `src/controllers/` — request handlers
- `src/models/` — data access / domain models (placeholder)
- `src/middlewares/` — error + 404 handlers

## Prisma

- Prisma schema: `prisma/schema.prisma`
- Set `DATABASE_URL` (see `.env.example`)
- Generate client:

```bash
npm run prisma:generate
```
