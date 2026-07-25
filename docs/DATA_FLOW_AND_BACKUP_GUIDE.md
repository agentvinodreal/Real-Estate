# 🏗️ Carry Construction — Architecture, Data Flow, & Backup Guide

This document explains the architecture, database layout, asset hosting, and local backup configuration of the Carry Construction codebase. It serves as a guide for subsequent AI agents to understand the system flow.

---

## 🗺️ System Architecture Flowchart

```mermaid
graph TD
    subgraph Data & Media Storage
        DB[(Neon PostgreSQL Database)]
        Cloudinary[Cloudinary CDN Account: piwpzbke]
    end

    subgraph Backend Service [Fastify API - Port 4000]
        API[Fastify App]
        Prisma[Prisma Client]
        API <--> Prisma
        Prisma <--> DB
    end

    subgraph Frontends [Client Tier]
        Web[Vite Web App - Port 5173]
        Admin[Vite Admin Portal - Port 5174]
    end

    %% Queries and Mutation streams
    Web -->|GET /properties| API
    Admin -->|GET /properties| API
    Admin -->|POST / PATCH properties| API

    %% Cloudinary Upload & Display resolution
    Admin -->|Direct Image Upload| Cloudinary
    Cloudinary -->|Returns secure_url / publicId| Admin
    Admin -->|Saves publicId to Database| API

    %% Image display resolution
    Web -.->|Resolves publicId via 'piwpzbke' CDN| Cloudinary
    Admin -.->|Resolves publicId via 'piwpzbke' CDN| Cloudinary
```

---

## 🗄️ Database Configuration & Sync (Neon PostgreSQL)

### 1. Connection Parameters
- The backend API connects to a Neon PostgreSQL instance via `DATABASE_URL` declared in [apps/api/.env](file:///Users/yashswisingh/Documents/New project/Real-Estate/apps/api/.env).
- **Environment Separation:**
  * **Development (`carry_dev`):** Local development uses the `carry_dev` database (configured in `.env`). Database pushes (`npm run prisma:push`) and seeds (`npm run seed`) should only be executed against `carry_dev`.
  * **Production (`neondb`):** The live deployed environment connects to the `neondb` database. A backup of the production configurations is stored locally in `.env.production` (which is git-ignored).
- **The Field Ops panel does NOT share this database.** An earlier version of this
  guide claimed `neondb` was shared with `carry-admin-suryansh.web.app`. It is not:
  `neondb` holds only this project's seed data (1 placeholder agent, 0 labour, 0
  shops), while the Field Ops panel has its own live agents, labour, and shops.
  The two systems are connected only by the manual export/import described in
  "Field Ops → Website Publish Flow" below.

### 2. Marketing Tables Synchronization
- The following marketing-specific tables were created locally and synced safely using `npx prisma db push` to `carry_dev` (development) and then to `neondb` (production):
  * `leads`
  * `testimonials`
  * `materials`
  * `blog_posts`
- Because these are entirely new tables, they do not impact the existing schema accessed by the external admin panel.

### 3. Graceful Property & Project Columns Handling
- **`processStages` (ConstructionProject):** This column is **not** present in the shared database. To prevent query execution crashes, it has been removed from [schema.prisma](file:///Users/binova/Documents/Projects/Suru/Real-Estate/apps/api/prisma/schema.prisma) and is instead handled dynamically in memory inside the serialization helper ([serialize.ts](file:///Users/binova/Documents/Projects/Suru/Real-Estate/apps/api/src/lib/serialize.ts)) with sensible fallback values (Foundation, Structure, Finishing stages).

---

## 🖼️ Cloudinary Image Asset Resolution

### 1. Storage Format
- Images are uploaded to Cloudinary directly from client applications.
- Only the **public ID** (or file slug) is stored in the PostgreSQL database array `images: String[]` (e.g. `["carry_res/qyzv3n..."]`).

### 2. Resolution Key
- The primary Cloudinary account holding all listing photos is **`piwpzbke`**.
- In the admin code, dynamic asset paths must always resolve against this cloud name:
  ```typescript
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? 'piwpzbke';
  const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${publicId}`;
  ```
- *Avoid using the API's private cloud name (`pvrehhhs`) for loading listing assets, as that accounts does not contain the production photos.*

---

## 🔁 Field Ops → Website Publish Flow (Webhook)

The Field Ops panel is a wholly separate system: its own frontend
(`carry-admin-suryansh.web.app`), its own backend (`carry-api-pink.vercel.app`),
its own database, and its own Clerk instance (`humble-blowfish-97` — ours is
`sweet-doberman-12`). Because the Clerk instances differ, a Clerk token cannot
authenticate between the two; the hop uses a **shared secret** instead.

```mermaid
graph LR
    FO[Field Ops Panel<br/>Publish button] --> FOAPI[carry-api-pink.vercel.app]
    FOAPI -->|POST /api/v1/sync<br/>x-sync-secret| API[This API]
    API --> DB[(Postgres)]
    DB --> Web[Website]
    DB --> Admin[apps/admin]
```

### This side — done

`POST /api/v1/sync` ([routes/sync.ts](apps/api/src/routes/sync.ts)) accepts one or
many items, upserts them by source `id`, and mirrors the exported `agent` first
(`Property.agentId` is a required FK that won't exist here on a first sync).
Existing `slug` values are preserved on update so live URLs never shift. **The
endpoint never deletes** — an unpublish arrives as `published: false` and simply
hides the row.

Set `SYNC_SECRET` in `apps/api/.env` locally, and in the API host's environment
variables for production.

### Field Ops side — still required

Someone with access to the Field Ops repo must fire this on publish/unpublish:

```ts
await fetch('https://<this-api-host>/api/v1/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-sync-secret': process.env.WEBSITE_SYNC_SECRET,
  },
  body: JSON.stringify({ properties: [property] }),  // or { projects: [...] }
})
```

The item shape is exactly what the panel already exports to `shared-data.json`,
including the nested `agent` object. Send the same call on unpublish with
`published: false`. Responses: `200` all synced, `207` partial (body lists
`failed` — safe to retry, upserts are idempotent), `401` bad secret, `503`
`SYNC_SECRET` not configured.

### Catch-up import

If the webhook was down, backfill from a `shared-data.json` export at the repo root:

```bash
npm run import:published -w apps/api            # → carry_dev
npm run import:published -w apps/api -- --prod  # → neondb
```

It shares its mapping with the webhook via
[syncImport.ts](apps/api/src/lib/syncImport.ts), so the two cannot drift.

---

## 🔓 Properties Draft & Visibility Logic

### 1. Frontend Web App Visibility
- The public site listing queries the backend at `GET /properties` which filters elements using `{ published: true }`. This ensures incomplete listings or draft items are hidden from consumers.

### 2. Admin Portal Visibility
- The Admin portal listings list also queries the backend at `GET /properties` (fetching only `{ published: true }` items by default).
- The backend Fastify controller in [properties.ts](file:///Users/binova/Documents/Projects/Suru/Real-Estate/apps/api/src/routes/properties.ts) supports `includeUnpublished=true` as a query parameter for debugging or future custom views, but the active admin listing view only lists published assets.

---

## 💾 Local JSON Backup System

Inside the admin portal's Properties page, admins can download a complete backup of all listings by clicking **"Backup JSON"**.

This triggers the client-side helper `exportJSONBackup(items: Property[])` which:
1. Iterates over every property listing.
2. Resolves all Cloudinary public IDs inside `images` to their absolute HTTPS URLs pointing to `piwpzbke`.
3. Packages the list into a self-contained JSON blob.
4. Triggers a browser download of `properties_db_backup_YYYY-MM-DD.json`.
