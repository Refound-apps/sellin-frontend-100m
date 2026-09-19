<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Projektová vize a architektura (Sellin.cz)

Tato aplikace slouží jako **centrální engine, PIM a sklad** (obdoba Shopify) pro prodejce:
- **Centrální sklad:** Prodejci si sem nahrávají a centrálně spravují veškeré své zboží (pneu, disky, autodíly, auta, elektronika atd.) na jednom místě.
- **Vlastní E-shopy:** Z této centrální platformy se generují a napojují storefronty / e-shopy (např. `/shop` pro pneu/disky).
- **Inzertní portály:** Backend automaticky synchronizuje a propisuje nabídky na externí inzertní weby (Bazoš.cz, Bazoš.sk, Sbazar.cz atd.).
- **Marketing a sociální sítě:** Propojení na reklamní a sociální platformy (Facebook Marketplace / Meta Ads, Google Shopping / Ads, TikTok atd.).

