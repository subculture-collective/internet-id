# Prisma Schema - Single Source of Truth

⚠️ **IMPORTANT**: This is the **ONLY** Prisma schema file in the repository.

## Schema Location

- **Single source**: `prisma/schema.prisma` (this directory)
- **Do NOT duplicate**: Never create `web/prisma/schema.prisma` or any other schema copies

## How It Works

The single `schema.prisma` file generates two Prisma Clients:

1. **API/Scripts Client** (root project)
   - Generator: `client`
   - Output: `./node_modules/@prisma/client`
   - Used by: Express API, CLI scripts

2. **Web App Client** (Next.js)
   - Generator: `client-web`
   - Output: `../web/node_modules/.prisma/client` (relative to schema location)
   - Used by: Next.js web application

**Note**: The output path is relative to the schema file location (`prisma/schema.prisma`). This is a standard Prisma pattern for monorepos and ensures both clients are generated correctly regardless of which directory you run commands from.

## Commands

### Generate Both Clients

```bash
# From root directory
npm run db:generate

# Or directly
prisma generate
```

### Generate Only Web Client

```bash
# From web directory
npm run prisma:generate

# Or directly
prisma generate --schema ../prisma/schema.prisma --generator client-web
```

### Migrations

```bash
# From root directory
npm run db:migrate

# Or directly
prisma migrate dev --name <migration_name>
```

## Why Single Schema?

- **No Drift**: Schema changes are automatically reflected everywhere
- **No Duplication**: One file to maintain and version
- **Safer Migrations**: Single migration history prevents conflicts
- **Better DX**: Update once, generate twice

## Safeguards

If you accidentally create a duplicate schema:
1. Delete the duplicate immediately
2. Run `npm run db:generate` from root to regenerate clients
3. Verify both clients work with your imports
