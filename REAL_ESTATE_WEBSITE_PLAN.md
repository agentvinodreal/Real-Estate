# Real Estate Website — Technical Specification & Build Plan

**Business scope:** Property Sale · Resale · Construction Services (design → execution)
**Market:** India · **Currency:** INR · **Managed by:** developer / technical owner
**Document version:** 1.0 · **Date:** 2026-07-08

---

## 1. Product Overview

A single website serving three business lines:

1. **Sale** — new/primary properties (builder inventory, new projects).
2. **Resale** — secondary-market listings (individual owners, ready-to-move).
3. **Construction Services** — turnkey design-to-execution (home construction, interiors, project management).

**Three goals the whole site is optimized for:**
- **SEO** — buyers discover you on Google ("2 BHK flats in <city>", "home construction cost <city>").
- **Lead capture** — turn visitors into calls, WhatsApp chats, and inquiry-form submissions.
- **Trust** — RERA numbers, real project photos, testimonials, transparent pricing.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | SSR/SSG for SEO; single codebase for site + API routes. |
| UI | **Tailwind CSS + shadcn/ui** | Fast, consistent, responsive components. |
| Database | **PostgreSQL via Supabase** | Listings, leads, users, projects. Includes auth + storage. |
| ORM | **Prisma** | Type-safe DB access, easy migrations. |
| Auth (admin) | **Supabase Auth** | Protects the admin dashboard. |
| Image storage/CDN | **Cloudinary** | Auto-resize/compress property galleries (critical for speed). |
| Maps | **Google Maps JavaScript API** | Property location + nearby amenities. |
| Transactional email | **Resend** | Lead notifications to your team + auto-reply to user. |
| Messaging | **WhatsApp click-to-chat** (`wa.me`) | Primary lead channel in India. |
| Hosting | **Vercel** (frontend/API) + **Supabase** (DB) | Git-push deploys, generous free tier. |
| Analytics | **Google Analytics 4 + Search Console** | Traffic + SEO monitoring. |
| Forms validation | **React Hook Form + Zod** | Client + server validation. |
| CI | **GitHub + Vercel preview deploys** | Every branch gets a preview URL. |

**Why no heavy CMS?** Since a developer maintains it, a custom admin dashboard over Supabase is lighter and cheaper than Sanity/Strapi. If a non-technical team takes over later, we can layer Sanity on top without re-architecting.

---

## 3. Site Map / Pages

```
/                         Home (hero, search, featured, services, testimonials)
/properties               Listing grid + filters (sale / resale)
/properties/[slug]        Property detail page
/construction             Construction services overview
/construction/[slug]      Individual project case study (design→execution)
/about                    Company story, team, RERA/credentials
/testimonials             Client reviews
/blog                     SEO articles (buying guides, locality guides)
/blog/[slug]              Article
/contact                  Contact form, office map, phone, WhatsApp
/admin                    Protected dashboard (listings, leads, projects)
/admin/login             Admin auth
```

---

## 4. Core Features

### 4.1 Property Search & Filters
- Free-text (locality / project name)
- Filters: **listing type** (sale / resale / under-construction), **property type** (apartment / villa / plot / commercial), **BHK** (1/2/3/4+), **price range (INR)**, **area (sq ft / acre for plots)**, **city / locality**, **status** (ready-to-move / under-construction), **furnishing**.
- Sort: price, newest, area.
- URL-based filters (shareable, SEO-friendly): `/properties?city=pune&bhk=2&type=apartment`.

### 4.2 Property Detail Page
- Image gallery (Cloudinary) + optional video/virtual tour link
- Price (INR), price/sq ft, BHK, carpet & built-up area, floor, facing
- **RERA registration number** (compliance + trust)
- Amenities list, floor plan image
- Google Map with location + nearby (schools, metro, hospitals)
- **Lead actions:** Inquiry form · Call button · WhatsApp button · "Request site visit"
- Similar/nearby properties

### 4.3 Construction Services
- Service pillars: Architecture & Design · Structural Construction · Interiors · Turnkey Project Management
- **Process timeline:** Consultation → Design → Approvals → Construction → Handover
- Project portfolio with before/after and stage-wise photos
- Cost estimator / "Get a quote" form (plot size, floors, package tier)
- Packages table (e.g., Basic / Premium / Luxury per sq ft)

### 4.4 Lead Management
- Every form writes to `leads` table + emails the team (Resend)
- Lead fields: name, phone, email, source page, property/project ref, message, timestamp
- Admin can view, mark status (new / contacted / site-visit / closed)
- WhatsApp and call clicks fire GA4 events (measure real intent)

### 4.5 Admin Dashboard (`/admin`)
- Auth-gated (Supabase)
- CRUD: properties, construction projects, blog posts, testimonials
- Image upload → Cloudinary
- Leads inbox with status pipeline
- Publish/unpublish toggle (draft vs live)

---

## 5. Data Model (core tables)

```
properties
  id, slug, title, listing_type (sale|resale|under_construction),
  property_type (apartment|villa|plot|commercial),
  bhk, price_inr, price_per_sqft, carpet_area_sqft, builtup_area_sqft,
  city, locality, address, lat, lng,
  status (ready|under_construction), furnishing,
  rera_number, description, amenities[jsonb], images[jsonb],
  floor_plan_url, video_url, featured (bool), published (bool),
  created_at, updated_at

construction_projects
  id, slug, title, category, location, area_sqft, duration_months,
  package_tier, description, process_stages[jsonb],
  before_images[jsonb], after_images[jsonb], stage_images[jsonb],
  published, created_at

leads
  id, name, phone, email, source_page, property_id (nullable),
  project_id (nullable), message, status (new|contacted|visit|closed),
  created_at

blog_posts
  id, slug, title, excerpt, cover_image, body_mdx,
  meta_title, meta_description, published, created_at

testimonials
  id, name, location, rating, quote, avatar_url, published

admin_users        (handled by Supabase Auth)
```

---

## 6. SEO Plan (critical for a real estate site)

- **Server-render** all public pages (Next.js) — no client-only content for listings.
- **Dynamic metadata** per property/project/article (title, description, Open Graph image).
- **JSON-LD structured data:** `RealEstateListing` / `Product` + `Offer`, `LocalBusiness`, `BreadcrumbList`. This can earn rich results in Google.
- **Locality landing pages** — programmatic SEO: `/properties/pune/kharadi` etc. Huge for real estate.
- **Sitemap.xml + robots.txt** auto-generated.
- **Fast Core Web Vitals** — Cloudinary images, lazy loading, `next/image`.
- **Blog** targeting buyer-intent keywords ("stamp duty in Maharashtra", "home loan eligibility", "cost to build a house in <city>").
- Google **Business Profile** + Search Console setup.

---

## 7. Compliance & India-specific Notes

- **RERA:** display RERA registration numbers on projects where applicable; add a RERA disclaimer. Required for under-construction/promoted projects.
- **Units:** sq ft for built-up, carpet area shown separately (RERA mandates carpet area); acres/guntha for plots.
- **Pricing:** INR with lakh/crore formatting (e.g., ₹85 L, ₹1.2 Cr).
- **Lead channels:** WhatsApp first, then call, then form. Sticky mobile call/WhatsApp bar.
- **Consent:** basic privacy policy + form consent checkbox (DPDP Act awareness).

---

## 8. Build Roadmap

### Phase 0 — Setup (Week 1)
- Finalize brand (logo, colors, fonts), gather content (real photos, project data).
- Scaffold Next.js + Tailwind + Prisma + Supabase.
- Set up Cloudinary, Resend, Google Maps API keys.
- Deploy empty shell to Vercel (get preview pipeline working early).

### Phase 1 — Core listings (Weeks 2–3)
- DB schema + migrations.
- Property listing page with filters + search.
- Property detail page + gallery + map.
- Seed with real listings.

### Phase 2 — Construction + content (Week 4)
- Construction services pages + project case studies.
- Home page, About, Testimonials, Contact.

### Phase 3 — Leads + admin (Week 5)
- All forms → DB + Resend email + WhatsApp/call buttons.
- Admin dashboard (auth, CRUD, leads inbox, image upload).

### Phase 4 — SEO, blog, launch (Week 6)
- JSON-LD, metadata, sitemap, locality pages.
- Blog + first 3–5 articles.
- GA4 + Search Console, performance pass, cross-device QA.
- **Launch** + submit sitemap to Google.

*Timeline assumes one focused developer; adjust for part-time work.*

---

## 9. Estimated Running Costs (starting scale)

| Service | Free tier? | Paid when you grow |
|---|---|---|
| Vercel | Yes (hobby) | ~$20/mo Pro |
| Supabase | Yes | ~$25/mo Pro |
| Cloudinary | Yes (25 credits) | Pay as you grow |
| Resend | Yes (3k emails/mo) | ~$20/mo |
| Google Maps | $200/mo free credit | Usage-based after |
| Domain | — | ~₹800–1,200/yr |

**Start:** effectively ₹0–1,000/mo. **Scaled:** ~₹5,000–8,000/mo.

---

## 10. Next Steps

1. Confirm this plan / adjust scope.
2. Gather brand assets + a few real listings and one construction project (for realistic build).
3. Scaffold the Next.js project and stand up the DB schema.
4. Build Phase 1.

> When ready, say the word and we'll scaffold the actual project in this folder and start Phase 0/1.
