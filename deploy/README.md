# Self-hosting (Calq fork)

This fork adds what upstream needs to run outside Vercel:

- `DATABASE_DRIVER=pg`: plain Postgres instead of the Neon driver in production.
- `STORAGE_PROVIDER=s3`: AWS S3 instead of Cloudflare R2.
- `MAIL_PROVIDER=ses` with `MAIL_DOMAIN`: Amazon SES instead of Resend.
- Stripe only initialises on the cloud version.
- `/widget.js`: a script-tag build of the React widget for sites without React.

## Run

    cp .env.example .env   # fill in
    docker compose build web
    docker compose up -d postgres
    docker compose --profile migrate run --rm migrate
    docker compose up -d

## Embed on a site

    <script src="https://<instance>/widget.js" data-project-id="proj_..." data-lang="nl" defer></script>

The widget only appears for visitors who open the site through a review link (`?ff_token=...`).
