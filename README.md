# C1SE.79-CapStone

Smart Rental Management Platform (RentMate) connects tenants and landlords through a web-based platform for listing, discovering, and managing rental properties. Sprint 1 delivers authentication, user management, and the property module, backed by a NestJS API and a Vite + React frontend.

## Project Structure

```
REnt/
+- docker-compose.yml
+- rentmate-backend/
   +- src/
   +- Dockerfile
   +- package.json
   +- .env.example
+- rentmate-frontend/
   +- src/
   +- package.json
   +- .env.example
```

## Prerequisites (Windows 10/11)
- Node.js 18+
- npm 9+
- Docker Desktop (with WSL2 backend)

## 1. Database (MySQL)

```powershell
# From repository root
docker-compose up -d
```

- Host: `localhost`
- Port: `3306`
- User: `root`
- Password: `123456`
- Database: `rentmate`

## 2. Backend (NestJS + TypeORM)

```powershell
cd rentmate-backend
cp .env.example .env  # update values if needed; set a strong JWT_SECRET
# Add GEMINI_API_KEY (Google AI Studio) and optionally GEMINI_MODEL (default: models/gemini-2.5-flash)
npm install
npm run start:dev
```

API served at `http://localhost:3000/api`.

### Email Delivery
- Copy `rentmate-backend/.env.example` to `.env` and fill `MAIL_*` variables.
- Gmail users must create a 16-character App Password (normal passwords are rejected with `535 Invalid login`). Follow `docs/email-setup.md`.
- For development-only testing, Mailtrap credentials work out of the box and avoid sending real messages.

### Available Endpoints (Sprint 1)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/users` (admin)
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id` (now performs a soft disable)
- `GET /api/admin/users` (admin)
- `PATCH /api/admin/users/:id/disable` (admin)
- `PATCH /api/admin/users/:id/enable` (admin)
- `GET /api/properties`
- `GET /api/properties/:id`
- `POST /api/properties` (landlord/admin)
- `PUT /api/properties/:id` (owner/admin)
- `DELETE /api/properties/:id` (owner/admin, soft delete -> hidden from listings)
- `GET /api/reviews` (public testimonials; admin can include pending via `includePending=true`)
- `POST /api/reviews` (property review or customer testimonial, requires login)
- `PATCH /api/reviews/:id/approve` (admin approve/hide)
- `GET /api/messages/:conversationId`
- `POST /api/messages`
- `POST /api/ai/chat`
- `POST /api/stats/track-visit` (public; records a page view)
- `GET /api/admin/traffic-stats` (admin)

### Backend Highlights
- Global validation (`class-validator`) and serialization (`ClassSerializerInterceptor`)
- JWT authentication with role-based access (`tenant`, `landlord`, `manager`, `admin`)
- Bcrypt password hashing
- Landlords manage only their properties; admins have full control
- Gemini-powered smart assistant that enriches answers with live data (contracts, transactions, listings)
- Messages API persists every chat bubble for the floating chat box
- Reset and payment tokens are stored hashed; checkout requires contract ownership; sensitive endpoints locked down

## 3. Frontend (React + Vite + TailwindCSS)

```powershell
cd rentmate-frontend
cp .env.example .env
npm install
npm run dev
```

Web app runs at `http://localhost:5173` with proxying to `/api`.

### Frontend Highlights
- Axios client with JWT interceptor
- Authentication context with persistent session storage
- Protected routes (dashboard)
- Responsive UI matching Sprint 1 design tokens (buttons, forms, property cards)
- Property dashboard for landlords/admins with create form and listing overview
- Floating "RentMate Virtual Assistant" chat widget for tenants (AI + owner chat modes)

## 4. Docker Images
- Backend Dockerfile located in `rentmate-backend/Dockerfile`
- Use `docker build -t rentmate-backend .` inside backend folder to create image

## Test Flow
1. Register a tenant or landlord account
2. Login to retrieve JWT
3. Landlord/Admin: create a property in the dashboard
4. Tenant: browse property list and inspect details
5. Admin: access `/api/users` to review user base

## Notes
- TypeORM `synchronize` should stay `false` in production; run migrations or the provided DB patch instead of drop/create.
- Set a strong `JWT_SECRET`; existing tokens are invalidated when it changes.
- Ensure `GEMINI_API_KEY` is configured on the backend server (never expose it to the frontend).
- Transactions list/detail are admin/manager-only; checkout requires the tenant/landlord of the contract.
- Use `npm run db:patch:hashed-tokens` (backend) to add hashed token columns if your DB predates this change.
- Property deletion is implemented as a soft delete (status set to `deleted`); deleted/inactive listings are omitted from public searches and stats.
- Stats and category aggregates are role-aware: tenants only see active listing counts; landlords see metrics for their own listings; admins retain full financial visibility.
- Admin console now includes visit tracking (`/api/stats/track-visit` + `/api/admin/traffic-stats`) and user lifecycle controls (disable/enable instead of hard delete); disabled accounts cannot log in or perform protected actions.
