# tools/

Reusable command-line helpers for High End Fire.

## yt-transcript.mjs — YouTube transcript reader (via Apify)

Fetches the transcript of any YouTube video using an Apify actor, so it can be
reused for content research, AI outreach copy, blog posts, etc.

### One-time setup

1. **Get an Apify token:** https://console.apify.com → Settings → Integrations →
   API tokens. It looks like `apify_api_xxxxxxxx`.

2. **Store it as an env var** (never hardcode it):

   ```bash
   export APIFY_TOKEN=apify_api_xxxxxxxx
   ```

   For repeatable local use, add it to a `.env` file (already git-ignored) and
   load it, or keep it in your shell profile.

3. **Network access (Claude Code on the web only):** the remote environment must
   allow egress to `api.apify.com`. If it doesn't, calls fail with
   `Host not in allowlist`. Add `api.apify.com` to the environment's egress
   allowlist when creating/editing it. See:
   https://code.claude.com/docs/en/claude-code-on-the-web
   (Running locally needs no allowlist — normal internet access is enough.)

### Usage

```bash
# Plain transcript text
APIFY_TOKEN=apify_api_xxx node tools/yt-transcript.mjs https://youtu.be/qsUksdDNbv0

# Bare video id also works
APIFY_TOKEN=apify_api_xxx node tools/yt-transcript.mjs qsUksdDNbv0

# Raw JSON from the actor (for debugging shapes)
APIFY_TOKEN=apify_api_xxx node tools/yt-transcript.mjs qsUksdDNbv0 --json

# Use a different Apify actor
APIFY_TOKEN=apify_api_xxx node tools/yt-transcript.mjs qsUksdDNbv0 --actor streamers~youtube-scraper
```

Default actor: `pintostudio~youtube-transcript-scraper`. Any Apify actor that
accepts `{ "videoUrl": "..." }` and returns transcript-shaped items will work.

### Requirements

- Node 18+ (uses the built-in global `fetch`).
- A funded/free Apify account with the chosen actor available.

### Security

- The token is read only from `APIFY_TOKEN` and sent only to `api.apify.com`.
- Do not paste tokens into chat or commit them. `.env*` is git-ignored.
