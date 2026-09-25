# Sahaayak — standalone deployment

This version removes the Convex runtime and uses a normal Express + PostgreSQL backend.

## Local development

1. Install Node 20+ and PostgreSQL.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL` and `JWT_SECRET`.
4. Set `OTP_API_KEY` if you want real email OTPs. In development, leaving it empty prints the OTP in the server terminal.
5. Run `npm install`.
6. Run `npm run build`.
7. Run `npm start`.
8. Open `http://localhost:3000`.

The backend automatically creates its PostgreSQL tables on first start.

## Production

The included `Dockerfile` can be deployed to any container host with PostgreSQL.
`render.yaml` is included for a Render web service. Set `DATABASE_URL` and `OTP_API_KEY` in the host's secret/environment settings.

The frontend and API are served from the same origin, so there is no hard-coded localhost URL and no browser CORS configuration is required.

## API

- `GET /api/health`
- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/guest`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET/POST /api/mirror/events`
- `GET/POST /api/mirror/repairs`
- `GET/POST /api/mirror/sentences`
- `DELETE /api/mirror`
