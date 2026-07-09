# Product Requirements Document (PRD) — Carry Construction

**Business:** Property Sale · Resale · Construction Services (design → execution)
**Domain:** www.carryconstruction.com · **Market:** India · **Currency:** INR
**Hosting:** Hostinger **VPS** (self-managed) · **Managed by:** developer / technical owner
**Version:** 3.0 (deployment + design finalized) · **Date:** 2026-07-08

---

## 1. Final Technology Stack

```
Frontend:   React (Vite) + Tailwind CSS
Backend:    Fastify (Node.js + TypeScript)
Database:   Neon (PostgreSQL)   [or self-hosted Postgres on the VPS — see §9]
ORM:        Prisma
Auth:       Firebase Authentication
API docs:   Swagger / OpenAPI (@fastify/swagger + swagger-ui)
Maps:       Mappls (MapmyIndia)
Images:     Cloudinary (CDN + auto-optimization)
Email:      Resend (lead notifications)
Messaging:  WhatsApp click-to-chat (wa.me)
Hosting:    Hostinger VPS — Nginx (frontend + reverse proxy) + PM2 (Fastify)
Process:    PM2 (keeps Node running) · Nginx (web server + SSL termination)
SSL:        Let's Encrypt (Certbot) — free auto-renewing HTTPS
Analytics:  Google Analytics 4 + Search Console
```

**Everything lives on one Hostinger VPS.** Nginx serves the built React site and reverse-proxies `/api` calls to the Fastify server (kept alive by PM2). Neon (or local Postgres) holds the data. External APIs (Firebase, Mappls, Cloudinary, Resend) are called from the backend.

---

## 2. Deployment Architecture (Hostinger VPS)

```
                         www.carryconstruction.com
                                    │  (DNS A record → VPS IP)
                                    ▼
        ┌──────────────────────── Hostinger VPS (Ubuntu) ─────────────────────────┐
        │                                                                          │
        │   ┌─────────── Nginx (port 80/443, Let's Encrypt SSL) ──────────────┐    │
        │   │   /            → serves React build  (dist/ static files)       │    │
        │   │   /api/*       → reverse-proxy → http://localhost:4000 (Fastify)│    │
        │   │   /api/docs    → Swagger UI                                     │    │
        │   └──────────────────────────────┬──────────────────────────────────┘   │
        │                                   │                                      │
        │                        ┌──────────▼──────────┐                           │
        │                        │  Fastify (PM2)      │  Node + TypeScript        │
        │                        │  localhost:4000     │  Prisma client            │
        │                        └──────────┬──────────┘                           │
        └───────────────────────────────────┼──────────────────────────────────────┘
                                             │
              ┌──────────────┬───────────────┼────────────────┬───────────────┐
              ▼              ▼               ▼                ▼               ▼
          Neon PG        Firebase        Mappls           Cloudinary       Resend
        (or local PG)     Auth          (maps/geocode)     (images)        (email)
```

**Why this layout:** one server, one bill (already paid), full control, HTTPS free, and Nginx handles both the static site and the API under the same domain — so the browser only ever talks to `carryconstruction.com` (clean, no CORS headaches, keys stay server-side).

---

## 3. Design Direction — "Not AI-Generated"

This is a deliberate anti-generic design system. **No purple, indigo, violet, no rainbow/blurry gradients, no glassmorphism blobs, no emoji-as-icons.** The look is architectural, grounded, and premium — driven by real project photography.

### 3.1 Color palette — warm architectural
| Role | Color | Hex | Use |
|---|---|---|---|
| **Ink** (primary) | Warm near-black | `#1C1B18` | Headings, text, footer |
| **Bone** (base) | Warm off-white | `#F5F1E9` | Page background |
| **Concrete** (muted) | Warm grey | `#8B857A` | Secondary text, borders |
| **Sand** (surface) | Soft beige | `#E7E0D3` | Cards, section bands |
| **Ochre** (accent) | Confident amber | `#B87333` | Buttons, links, highlights |
| **Steel** (support) | Deep slate | `#2E3A40` | Contrast sections, headers |

*Alternate accent options if you prefer (pick one, keep it consistent):* Terracotta `#A64B2A` (bolder, earthy) or Deep Teal `#1F5C57` (cooler, modern). Amber/ochre is the recommended default — it reads "construction + premium" without being cliché safety-orange.

### 3.2 Typography (avoids the default AI "Inter everywhere" look)
- **Headings:** an editorial serif or strong grotesque — recommended **Fraunces** (characterful serif) *or* **Archivo** (architectural sans). Big, confident, tight tracking.
- **Body:** clean, readable sans — **Inter** or **IBM Plex Sans**.
- **Numbers/specs:** optional mono (**IBM Plex Mono**) for prices, areas, stats — gives an architectural blueprint feel.
- All self-hostable (Google Fonts / Fontsource) so no external dependency.

### 3.3 Layout & feel principles
1. **Photography-led** — full-bleed real project/property photos carry the design. Commission or shoot real images; no generic stock.
2. **Editorial grid** — magazine-style, asymmetric, generous whitespace. Not a centered "SaaS landing page."
3. **Restraint** — one accent color, lots of neutrals, thin architectural rule-lines, strong type hierarchy.
4. **Large stats** — "12+ years · 40 projects · 2.5M sq ft delivered" in big type = trust.
5. **Sharp corners / minimal shadows** — architectural, not the soft rounded "friendly app" look.
6. **Subtle motion only** — gentle fades/parallax on scroll; nothing bouncy or flashy.
7. **Real copy** — no lorem ipsum, no emoji, no icon soup.

> Net effect: looks like a design/build studio's portfolio site, not a template.

---

## 4. Objectives & Success Metrics

**Objectives:** generate qualified leads (sale/resale/construction), rank locally on Google, present a trustworthy premium brand.

| Metric (first 6 months) | Target |
|---|---|
| Organic sessions/month | 3,000+ |
| Leads/month (form + WhatsApp + call) | 60+ |
| Detail → inquiry conversion | ≥ 4% |
| Page load (LCP) | < 2.5s |
| Listings indexed by Google | 100% |

---

## 5. Functional Requirements

### 5.1 Public site
- **Home:** photographic hero + search, featured listings, services, stats band, testimonials, CTA.
- **Listings (`/properties`):** filters — listing type (sale/resale/under-construction), property type (apartment/villa/plot/commercial), BHK, price (INR), area (sq ft/acre), city/locality, status, furnishing; sort; shareable URL filters.
- **Property detail:** gallery, price + price/sq ft, carpet & built-up area, BHK, floor, facing, **RERA number**, amenities, floor plan, **Mappls map + nearby**, inquiry form, **Call / WhatsApp / Request site visit**, similar properties.
- **Construction (`/construction`):** service pillars, process timeline (Consult → Design → Approvals → Build → Handover), package tiers (Basic/Premium/Luxury per sq ft), project case studies (before/after/stage photos), quote-request form.
- **Content:** About (RERA/credentials), Testimonials, Blog (SEO), Contact.
- **Global:** sticky mobile Call/WhatsApp bar, fully responsive.

### 5.2 Admin (`/admin`, Firebase-protected)
- CRUD: properties, construction projects, blog posts, testimonials.
- Cloudinary image upload; leads inbox with status pipeline; draft/publish toggle.

### 5.3 Leads
- Forms → `leads` table + Resend email + WhatsApp deep link; WhatsApp/call clicks → GA4 events.

---

## 6. API Design (Fastify + Swagger)

Base: `https://www.carryconstruction.com/api/v1` · Docs: `/api/docs` (Swagger UI).

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/properties` | public | List + filter + paginate |
| GET | `/properties/:slug` | public | Detail |
| POST/PATCH/DELETE | `/properties[/:id]` | admin | Manage |
| GET | `/construction-projects[/:slug]` | public | List/detail |
| POST/PATCH/DELETE | `/construction-projects[/:id]` | admin | Manage |
| GET | `/blog[/:slug]` · `/testimonials` | public | Content |
| POST/PATCH/DELETE | `/blog` · `/testimonials` | admin | Manage |
| POST | `/leads` | public | Submit inquiry/quote |
| GET · PATCH | `/leads[/:id]` | admin | Inbox + status |
| POST | `/uploads/sign` | admin | Cloudinary signed upload |
| GET | `/geocode` | public | Mappls proxy (key server-side) |

Swagger auto-generates OpenAPI from route schemas → interactive docs at `/api/docs` + exportable `openapi.json`. Firebase token verified via Fastify `preHandler` on admin routes. Security: rate-limit, CORS, helmet, validation, server-side keys.

---

## 7. Data Model (Prisma)

```
properties        id, slug, title, listing_type, property_type, bhk,
                  price_inr, price_per_sqft, carpet_area_sqft, builtup_area_sqft,
                  city, locality, address, lat, lng, status, furnishing,
                  rera_number, description, amenities(jsonb), images(jsonb),
                  floor_plan_url, video_url, featured, published, timestamps
construction_projects  id, slug, title, category, location, area_sqft,
                  duration_months, package_tier, description, process_stages(jsonb),
                  before_images(jsonb), after_images(jsonb), stage_images(jsonb),
                  published, timestamps
leads             id, name, phone, email, source_page, property_id?, project_id?,
                  message, status, created_at
blog_posts        id, slug, title, excerpt, cover_image, body,
                  meta_title, meta_description, published, created_at
testimonials      id, name, location, rating, quote, avatar_url, published
# Admin roles via Firebase custom claims
```

---

## 8. How We'll Build It — Step-by-Step Breakdown

### Phase 0 — Foundation (Week 1)
1. Create two repos/folders: `web/` (React+Vite+Tailwind) and `api/` (Fastify+TS).
2. Design tokens: put the §3 palette + fonts into Tailwind config (`theme.extend.colors`, font families).
3. Neon project + `DATABASE_URL`; Prisma schema (§7) + first migration.
4. Firebase project → Auth (Email/Google); grab config.
5. Get API keys: Mappls, Cloudinary, Resend. Store all secrets in `.env` (never in the frontend).
6. Fastify skeleton + `@fastify/swagger` serving `/api/docs`.
7. **VPS prep:** point `carryconstruction.com` DNS → VPS IP; install Node, Nginx, PM2, Certbot; issue SSL.

### Phase 1 — Core listings (Weeks 2–3)
8. Build Property API endpoints (list/filter/detail/CRUD) with Swagger schemas + validation.
9. React: design system components (buttons, cards, inputs) in the brand style.
10. Listings page: filter bar + results grid + pagination (URL-synced filters).
11. Property detail page: gallery, specs, RERA, Mappls map, lead buttons.
12. Seed 3–5 real listings to build against.

### Phase 2 — Construction + content (Week 4)
13. Construction overview: pillars, process timeline, package tiers.
14. Project case-study pages (before/after/stage photos).
15. Home (hero, featured, stats, testimonials), About, Contact — all in the editorial style.

### Phase 3 — Leads + admin (Week 5)
16. Lead API + Resend email + WhatsApp/call deep links + GA4 events + captcha.
17. Firebase-auth admin dashboard: CRUD for all entities, Cloudinary uploads, leads inbox pipeline.

### Phase 4 — SEO, polish, launch (Week 6)
18. Meta tags, JSON-LD (`RealEstateListing`, `LocalBusiness`), sitemap, robots, locality pages.
19. Blog + first 3–5 articles; GA4 + Search Console.
20. Performance pass (image sizing, lazy-load), cross-device QA, accessibility check.
21. **Deploy:** build React → Nginx serves `dist/`; Fastify under PM2; verify SSL; **go live**; submit sitemap to Google.

*Timeline assumes one focused developer; adjust for part-time.*

---

## 9. 💰 Cost Breakdown (with VPS + owned domain)

> Approximate, 2026, ≈ ₹83/$. Since the **Hostinger VPS and domain are already paid**, hosting adds nothing new.

### 9.1 Already covered
| Item | Cost to you now |
|---|---|
| Hostinger VPS (frontend + backend + optional DB) | **₹0 extra** (already have it) |
| Domain www.carryconstruction.com | **₹0 extra** (already own it) |
| SSL (Let's Encrypt) | **Free** |
| Swagger / OpenAPI | **Free** (open-source) |
| Google Analytics + Search Console | **Free** |

### 9.2 External services (free tiers cover launch)
| Service | Free tier | Pay only when you grow |
|---|---|---|
| **Neon (Postgres)** | 0.5 GB free | $19/mo (₹1,580) Launch — *or self-host on VPS = ₹0* |
| **Firebase Auth** | 50k MAU free (email/Google) | ~$0.003/MAU beyond |
| **Firebase phone OTP (SMS)** | billed per SMS ≈ ₹1–3 | avoid — use email/Google login |
| **Mappls (MapmyIndia)** | generous free dev quota | pay-per-transaction if you exceed |
| **Cloudinary** | 25 credits/mo (~25 GB) | Plus $89/mo only at high traffic |
| **Resend (email)** | 3,000 emails/mo | $20/mo for 50k |

### 9.3 Realistic monthly total (on top of your existing VPS)
| Stage | Extra monthly cost |
|---|---|
| **Launch** (all free tiers; Postgres on VPS or Neon free) | **≈ ₹0 / month** |
| **Growth** (Neon Launch + light Mappls/email overage) | **≈ ₹1,500–3,000 / month** |
| **Scale** (Neon Scale, Cloudinary paid, high email/maps) | **≈ ₹6,000–12,000 / month** |

**Bottom line:** because you already own the VPS and domain, you can **run the entire site for essentially ₹0/month extra at launch.** Costs only appear as traffic and leads grow. To keep it lowest: self-host Postgres on the VPS (skip Neon), and use email/Google login (skip paid SMS OTP).

### 9.4 Cost-saving option: self-host Postgres on the VPS
- **Pros:** ₹0 DB cost, data on your own server, no external dependency.
- **Cons:** you manage backups, updates, and tuning yourself.
- **Recommendation:** start on **Neon free tier** (managed, auto-backups, zero ops). Move to self-hosted Postgres only if you want to cut the eventual paid tier. Prisma makes switching trivial (just change `DATABASE_URL`).

---

## 10. Risks & Mitigations
| Risk | Mitigation |
|---|---|
| SPA SEO weakness | Pre-render/SSR the public marketing pages; strong meta + JSON-LD. |
| VPS ops burden (updates, uptime) | PM2 auto-restart, Nginx, automated Certbot renewal, scheduled DB backups. |
| Runaway API costs | Server-side keys, rate limiting, monitor Mappls/Cloudinary; avoid phone OTP. |
| "AI-generated" look | Follow §3 — real photos, warm palette (no purple), editorial layout, restraint. |
| Spam leads | Captcha + rate limit on `/leads`. |
| RERA/compliance | Show RERA numbers + disclaimer; display carpet area. |

---

## 11. Next Steps
1. Approve this PRD / tweak scope or accent color (§3.1).
2. Gather: logo + brand feel, 2–3 real listings, 1 construction project with photos.
3. Confirm VPS OS/access so we can prep DNS + Nginx + PM2 + SSL.
4. Scaffold **Phase 0** (React + Fastify + Prisma + Swagger) in this folder.

> Say the word and I'll scaffold Phase 0 here and wire up the design tokens (§3) so the look is locked in from day one.
