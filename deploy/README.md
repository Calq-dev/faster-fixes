# Self-hosting (Calq fork)

This fork adds what upstream needs to run outside Vercel:

- `DATABASE_DRIVER=pg`: plain Postgres instead of the Neon driver in production.
- `STORAGE_PROVIDER=s3`: AWS S3 instead of Cloudflare R2.
- `MAIL_PROVIDER=ses` with `MAIL_DOMAIN`: Amazon SES instead of Resend.
- Stripe only initialises on the cloud version.
- `SIGNUP_ALLOWED_EMAIL_DOMAINS`: closes open registration except for those domains and invited addresses.
- Security fixes: bulk inbox actions scoped to the caller's organisations, reviewers limited to their own feedback, reviewer token hashes no longer accepted or shown, input caps on the public API, no open redirect after login, client IP taken from X-Real-IP.
- Invitees skip onboarding: a pending invitation is accepted when the email address is verified, and no personal organisation is created for them.
- `/widget.js`: a script-tag build of the React widget for sites without React.

## Run

    cp .env.example .env   # fill in
    ./write-inngest-config.sh
    docker compose build web
    docker compose up -d postgres
    docker compose --profile migrate run --rm migrate
    docker compose up -d

## Embed on a site

    <script src="https://<instance>/widget.js" data-project-id="proj_..." data-lang="nl" defer></script>

For a light accent set the text colour too: `data-color="#FFFF00" data-text-color="#000000"`.

Add `data-capture-diagnostics="true"` to include console and network logs (off by default).

The widget only appears for visitors who open the site through a review link (`?ff_token=...`).
