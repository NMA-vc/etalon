# Self-Hosting

Deploy the ETALON cloud dashboard on your own infrastructure.

## Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [Supabase](https://supabase.com/) project (database + auth)
- A hosting platform (Vercel, Railway, Docker, etc.)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-side only) |
| `TRUSTED_PROXY` | ⚠️ | Set to `true` **only** if behind a trusted reverse proxy |

## Deployment

### Docker

```bash
# Build the Next.js dashboard
cd cloud/web
docker build -t etalon-dashboard .

# Run with environment variables
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  etalon-dashboard
```

### Vercel

1. Fork the [ETALON repository](https://github.com/NMA-vc/etalon)
2. Import into Vercel, set the root directory to `cloud/web`
3. Add the required environment variables
4. Deploy

## Security: TRUSTED_PROXY

> ⚠️ **Critical for self-hosted deployments**

The `TRUSTED_PROXY` environment variable controls how API rate limiting identifies client IPs:

- **`TRUSTED_PROXY=false` (default)**: Uses `request.ip` only. If unavailable, rejects the request entirely. This is the safest option.
- **`TRUSTED_PROXY=true`**: Falls back to `x-forwarded-for` and `x-real-ip` headers. **Only enable this if ETALON runs behind a trusted reverse proxy** (Cloudflare, Nginx, Traefik, AWS ALB) that sets these headers reliably.

If `TRUSTED_PROXY=true` is set in an environment without a trusted proxy, attackers can spoof their IP address to bypass rate limiting.
