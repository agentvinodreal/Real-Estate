# 🚀 Carry Construction — Pre-Deployment & Production Checklist

This checklist tracks items that must be completed **before** deploying the application to production.

---

## 📌 Critical Tasks Left Before Production

### 1. Redis Caching Tier
- [ ] **Setup Redis Client:** Register `@fastify/redis` (or standard `ioredis` client) in the Fastify container.
- [ ] **Edge Cache Public Read Routes:** Implement Redis cache-lookup and store strategies for:
  - `GET /properties`
  - `GET /blog`
  - `GET /materials`
  - `GET /testimonials`
- [ ] **Cache Invalidation:** Ensure that all admin updates (`POST`, `PATCH`, `DELETE` routes) trigger cache invalidations for relevant keys.

---

### 2. Static Asset Hosting & CDN Offloading
- [ ] **De-register static serving:** Remove `fastifyStatic` bindings in `apps/api/src/server.ts` that serve the client and admin portals from the API server.
- [ ] **Deploy Frontends to Edge CDN:**
  - Build `apps/web` and deploy to Cloudflare Pages (or Vercel/Netlify).
  - Build `apps/admin` and deploy to a secure custom subdomain (e.g., `admin.carryconstruction.com`) on Cloudflare Pages.
- [ ] **CORS Configuration:** Update `CORS_ORIGIN` env variable in the production API server environment to allow only the final production domains.

---

### 3. Database Connection Pooling (PgBouncer)
- [ ] Neon PostgreSQL is serverless and scales compute dynamically. However, connection counts can spike quickly. Update the production `DATABASE_URL` to point to Neon's **pooled connection string** (usually using port `5432` or the `?pgbouncer=true` parameter, or using Prisma Accelerate).

---

### 4. Clerk JWT Claims Customization
- [ ] Go to the **Clerk Dashboard** under **User & Organizations** > **Sessions** > **Customize Session Token**.
- [ ] Add the role mapping so the API can verify user roles without making outbound network requests:
  ```json
  {
    "role": "{{user.public_metadata.role}}"
  }
  ```

---

### 5. Compression & Payload Optimization
- [ ] Register `@fastify/compress` in Fastify to enable Brotli/Gzip compression on all API responses.
- [ ] Double-check that all Cloudinary URLs on the web app utilize the optimized delivery flags: `q_auto,f_auto`.
