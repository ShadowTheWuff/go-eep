# go-eep 🛏️

A tiny Cloudflare Worker that pings a webhook every night telling you to go to sleep.

Runs on a Cron Trigger, handles daylight saving time, and costs nothing on the Workers free plan.

## Quick start

You need Node.js and a Cloudflare account.

```bash
git clone https://github.com/YOUR_USERNAME/go-eep.git
cd go-eep
npm install
npx wrangler login
npx wrangler secret put WEBHOOK_URL     # paste your webhook URL
npm run deploy
```

That's it. It'll ping you at 11pm Central every night.

## Getting a webhook URL

**Discord:** Server Settings → Integrations → Webhooks → New Webhook → pick a channel → Copy Webhook URL.

**Slack:** create an app with Incoming Webhooks enabled, then change the body in `src/index.js` from `{ content: ... }` to `{ text: ... }`.

## Configuration

Edit the `[vars]` block in `wrangler.toml`:

| Var | Default | What it does |
|---|---|---|
| `TIMEZONE` | `America/Chicago` | Your IANA time zone |
| `BEDTIME_HOUR` | `23` | Local hour (0–23) to send the ping |
| `MESSAGE` | `go eep 🛏️` | The message text |
| `DISCORD_USER_ID` | *(unset)* | Your Discord user ID, so the ping @'s you and your phone buzzes |

Secrets (set with `npx wrangler secret put NAME`):

- `WEBHOOK_URL` (required)
- `TEST_KEY` (optional) enables `https://go-eep.<you>.workers.dev/ping?key=TEST_KEY` for a manual test ping

### Changing the time

Cron runs in UTC. The worker fires at two UTC hours (one for daylight time, one for standard time) and only sends when the local hour matches `BEDTIME_HOUR`.

If you change `BEDTIME_HOUR`, update the cron too. For Central time, local hour `H` maps to UTC hours `H+5` and `H+6` (mod 24). Examples:

| Bedtime | Cron |
|---|---|
| 10pm | `0 3,4 * * *` |
| 11pm | `0 4,5 * * *` |
| midnight | `0 5,6 * * *` |

## Testing locally

```bash
cp .dev.vars.example .dev.vars    # fill in your webhook URL
npm run dev
```

Then trigger the cron by opening `http://localhost:8787/__scheduled?cron=0+4,5+*+*+*`. It only sends if it's actually bedtime, so for a guaranteed ping use `/ping?key=YOUR_TEST_KEY` instead.

## Auto-deploy from GitHub (optional)

`.github/workflows/deploy.yml` deploys on every push to `main`. Add two repo secrets under Settings → Secrets and variables → Actions:

- `CLOUDFLARE_API_TOKEN` — create one at dash.cloudflare.com/profile/api-tokens with the **Edit Cloudflare Workers** template
- `CLOUDFLARE_ACCOUNT_ID` — shown on the Workers & Pages overview page

The `WEBHOOK_URL` secret lives in Cloudflare, not GitHub, so set it once with wrangler and it stays put across deploys.
