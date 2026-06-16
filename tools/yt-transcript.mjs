#!/usr/bin/env node
/**
 * yt-transcript.mjs — Fetch a YouTube transcript via the Apify API.
 *
 * Usage:
 *   APIFY_TOKEN=apify_api_xxx node tools/yt-transcript.mjs <youtube-url-or-id> [--json] [--actor <actor>]
 *
 * Examples:
 *   APIFY_TOKEN=apify_api_xxx node tools/yt-transcript.mjs https://youtu.be/qsUksdDNbv0
 *   APIFY_TOKEN=apify_api_xxx node tools/yt-transcript.mjs qsUksdDNbv0 --json
 *
 * Notes:
 *   - The token is read from the APIFY_TOKEN env var. Never hardcode it.
 *   - Requires Node 18+ (uses global fetch).
 *   - Requires network egress to api.apify.com (see tools/README.md).
 */

const DEFAULT_ACTOR = 'pintostudio~youtube-transcript-scraper';
const API = 'https://api.apify.com/v2';

function parseArgs(argv) {
  const args = { input: null, json: false, actor: DEFAULT_ACTOR };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') args.json = true;
    else if (a === '--actor') args.actor = argv[++i];
    else if (!args.input) args.input = a;
  }
  return args;
}

/** Accepts a full URL or a bare 11-char video id and returns a canonical watch URL. */
function toVideoUrl(input) {
  if (!input) return null;
  if (/^[\w-]{11}$/.test(input)) return `https://www.youtube.com/watch?v=${input}`;
  try {
    const u = new URL(input);
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/watch?v=${id}`;
    }
    const v = u.searchParams.get('v');
    if (v) return `https://www.youtube.com/watch?v=${v}`;
    return input; // hand it to the actor as-is
  } catch {
    return null;
  }
}

/** Pull readable transcript text out of whatever shape the actor returns. */
function extractTranscript(items) {
  const lines = [];
  const visit = (node) => {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (typeof node === 'object') {
      // Common shapes: {text}, {transcript:[{text}]}, {data:[{text}]}, {captions:[...]}
      if (typeof node.text === 'string') lines.push(node.text.trim());
      for (const key of ['transcript', 'data', 'captions', 'segments', 'items']) {
        if (node[key]) visit(node[key]);
      }
    }
  };
  visit(items);
  return lines.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const token = process.env.APIFY_TOKEN;

  if (!token) {
    console.error('Error: APIFY_TOKEN env var is not set.');
    console.error('Get one at https://console.apify.com → Settings → Integrations → API tokens');
    process.exit(2);
  }
  const videoUrl = toVideoUrl(args.input);
  if (!videoUrl) {
    console.error('Error: provide a YouTube URL or 11-char video id.');
    console.error('Usage: node tools/yt-transcript.mjs <youtube-url-or-id> [--json] [--actor <actor>]');
    process.exit(2);
  }

  const endpoint = `${API}/acts/${args.actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl }),
    });
  } catch (err) {
    console.error(`Network error reaching api.apify.com: ${err.message}`);
    console.error('If running inside Claude Code on the web, ensure api.apify.com is on the egress allowlist.');
    process.exit(1);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`Apify API returned ${res.status} ${res.statusText}`);
    if (body) console.error(body.slice(0, 1000));
    process.exit(1);
  }

  const items = await res.json();
  if (args.json) {
    console.log(JSON.stringify(items, null, 2));
    return;
  }

  const transcript = extractTranscript(items);
  if (!transcript) {
    console.error('No transcript text found. The video may have captions disabled,');
    console.error('or the actor returned an unexpected shape. Re-run with --json to inspect.');
    process.exit(1);
  }
  console.log(transcript);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
