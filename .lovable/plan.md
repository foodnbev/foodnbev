
# Food n Bev — Industrial F&B Projects Portal

A directory portal where the community and an admin track food & beverage construction projects (newbuilds, extensions, refurbishments) across breweries, distilleries and food processing facilities. Centered around projects with rich contractor metadata, search, and community scoring.

## Design direction

- Logo: uploaded "food n bev" wordmark (black + #eab676 + #abdbe3) in the header.
- Palette: `#eab676` (warm sand — primary accent), `#abdbe3` (soft teal — secondary accent), black, white. Light, clean, editorial-industrial feel. Crisp cards, generous whitespace, subtle shadows, rounded corners.
- Typography: a clean modern sans (e.g. Outfit / Inter) for UI, with a slightly heavier display weight for project names.
- All colors as semantic tokens in `src/styles.css`; no hardcoded hex in components.

## Tech & backend

- TanStack Start (existing template) + Lovable Cloud (Postgres, Auth, Storage).
- Email/password auth + Google sign-in. Registration captures: alias*, email*, involved (yes/no)*, full name, mobile.
- Roles via `user_roles` table + `has_role` security definer (admin role for the admin).
- Project images: use a placeholder by facility type for v1 (Google Street View / Places needs an API key & billing — can be added later behind a setting). Users may also upload a cover image to Cloud Storage.

## Data model (Postgres)

- `profiles` — id (= auth.users.id), alias, full_name, email, mobile, involved bool.
- `user_roles` — (user_id, role) with enum `app_role` ('admin','user').
- `projects` — id, created_by, name, address, lat/lng (optional), description, status enum, facility_type enum ('brewery','distillery','food_processing'), facility_subtype enum ('meat','fish','snacks','coldroom','other', nullable), work_type enum ('newbuild','extension','refurbishment','modification'), cover_image_url, created_at.
- `project_parties` — id, project_id, created_by, category enum (end_user, architect, general_contractor, me, real_estate_planner, consultant, flooring, groundworks, drainage, other), other_label (for "other"), company, contact_name, email, phone, spec_description. Unique (project_id, category) EXCEPT "other" which allows multiple.
- `project_ratings` — id, project_id, user_id, hotness (0–100), accuracy (0–100). Unique (project_id, user_id). Completeness is computed.

RLS:
- Public can SELECT minimal columns on `projects` (name, address, description, status, facility type) and a "presence map" of categories (boolean per category) — implemented via a Postgres VIEW + policy. They cannot read `project_parties` rows.
- Authenticated users can SELECT full `projects`, `project_parties`, `project_ratings`.
- INSERT project: any authenticated user. DELETE project: only `created_by` OR admin.
- INSERT party row: authenticated, only if no existing row for that (project, category) — enforced via unique index for non-"other" categories. "Other" always insertable.
- DELETE party row: only `created_by` of that row OR admin. No UPDATE by others.
- Ratings: each user one row per project, upsert allowed by self.

All `public.*` tables get GRANTs to `authenticated` + `service_role`; `projects` (minimal view) also gets `anon SELECT`.

## Scoring

- Hotness & Accuracy: average of user ratings, shown 0–100.
- Completeness (auto): weighted score based on filled optional categories + spec descriptions + cover image. Computed in a server function / SQL view.

## Pages / routes

- `/` — landing with hero, search bar, latest/hot projects.
- `/projects` — list + filters (keyword, area, status, facility type, work type, company name, category presence). Server-side search via `ilike` + joins.
- `/projects/$id` — project detail. Public sees gated view; authed sees full + can add/remove party rows in unclaimed categories, rate, etc.
- `/projects/new` — authed only, create project.
- `/auth` — sign in / sign up (email+password & Google). Signup form with required fields.
- `/account` — manage profile + see projects I created.
- `/admin` — admin-only: manage all projects/users (delete anything).
- `/_authenticated/*` layout gate.

## Search implementation

Single server function `searchProjects({ q, area, status, facilityType, workType, company, category })`:
- `q` matches name/description/address.
- `company` joins `project_parties.company ilike`.
- `category` filters projects that have (or don't have) a row in that category.

## Build order

1. Enable Lovable Cloud.
2. Design system + logo asset + shell (header w/ logo, footer).
3. Migration: enums, tables, RLS, grants, has_role, public view, completeness function.
4. Auth pages + profile trigger on signup.
5. Projects list + detail (public gated view).
6. Create project + add/remove party rows.
7. Ratings UI + completeness display.
8. Admin page.
9. Sitemap/robots, SEO metadata per route.

## Clarifying questions

I'll ask a few before building (admin identity, Google image API, etc.).
