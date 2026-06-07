# GrowthDash -- AI CMO Dashboard

A dark-terminal-aesthetic dashboard that aggregates PageSpeed, Search Console, Shopify, and Google Ads data across multiple projects into a single command-center view.

![Dashboard screenshot](docs/screenshot.png)

---

## Quick start

```bash
git clone <repo-url> && cd ai-cmo-dashboard
npm install
cp .env.example .env.local   # fill in your API keys
npm run dev                   # http://localhost:3000
```

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add every variable from `.env.example` to **Settings > Environment Variables**.
4. Deploy.

---

## Integrations

| Integration | Required env vars | Setup |
|---|---|---|
| PageSpeed Insights | `GOOGLE_PAGESPEED_API_KEY` | [Get a key](https://developers.google.com/speed/docs/insights/v5/get-started) |
| Search Console | `GOOGLE_SERVICE_ACCOUNT_JSON` | Create a service account, add it as a user in Search Console, base64-encode the JSON key |
| Shopify (FilaHive) | `FILAHIVE_SHOPIFY_DOMAIN`, `FILAHIVE_SHOPIFY_TOKEN` | Create a private app with read access to products and orders |
| Google Ads (APLUS) | `APLUS_GOOGLE_ADS_CID` | Customer ID for the Google Ads account |

---

## Add a new project

1. Open `src/config/projects.ts`.
2. Add a new entry to the `projects` array following the `ProjectConfig` interface.
3. Toggle `integrations.*` to `true` for the data sources you want.
4. Add the matching env vars to `.env.local`.
5. Restart the dev server.

---

## Tech stack

- **Next.js 14** (App Router)
- **Tailwind CSS** with a custom dark terminal palette
- **Chart.js** via react-chartjs-2
- **googleapis** for Search Console
