# Deployment Operations & Handoff — 2026-01-07

This record documents exactly what changed, how we deployed, known pitfalls, and how the next agent should proceed safely. The goal is to keep production in sync with localhost without risking charts.

## Quick Summary
- Portal site redeployed to production successfully (Next.js). Charts remained untouched.
- Portal production URL: https://lovetofly.com.br
- Latest deploy: https://app.netlify.com/projects/lovetofly-portal/deploys/695ddf29576533225c24719c
- Unique deploy URL: https://695ddf29576533225c24719c--lovetofly-portal.netlify.app
- Charts are a separate Netlify site (static). Do not redeploy via the portal pipeline.

## What Changed (Application)
- Classifieds feature updates are live:
  - Pages: `/classifieds/aircraft`, `/classifieds/avionics`, `/classifieds/parts` (browse, detail, create).
  - Supporting API routes under `src/app/api/classifieds/*` are present.
  - UI tweaks such as header/visibility adjustments on classifieds views.
- No intentional changes to charts content. Portal deploy did not upload charts files.
- Commit associated with previous push: 833e9fcd ("chore: deploy classifieds updates").

## Project + Deploy Topology
- Framework: Next.js 16 (App Router), React 19, TypeScript.
- Hosting: Netlify (two separate sites):
  - Portal site: "lovetofly-portal" (Next.js runtime, functions enabled).
    - Production URL: https://lovetofly.com.br
    - Site ID: 2bf20134-2d55-4c06-87bf-507f4c926697
    - Plugin: `@netlify/plugin-nextjs` (pinned major 5)
  - Charts site: "lovetofly-charts" (static, publishes from `charts/`).
    - Uses build command: `echo "No build needed - static files only"`
    - Publish dir: `charts/`
- Environment variables are defined via Netlify and `netlify.toml` (do not expose secret values in docs). Names used include: `DATABASE_URL`, `JWT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NETLIFY_USE_BLOBS`, `NETLIFY_NEXT_PLUGIN_SKIP_CACHE`.

## Charts: Current State & Guardrails
- Charts are managed and deployed separately from the portal. Do not re-upload charts via the portal site.
- Current inventory reference: `public/charts-manifest.json` (generatedAt: 2026-01-06T22:39:52.839Z). This is an index; it does not imply charts are bundled in the portal.
- Large archives (`charts-release.tar.gz`, `charts.tar.gz`) exist locally and must remain UNTRACKED. Do not add or push them.
- The last charts deploy logs show the "static files only" pipeline with publish path `charts/`. Keep using that flow for charts changes.

## Exactly How We Deployed the Portal (This Session)
1. Verified Netlify CLI installed and authenticated.
2. Ensured we were targeting the correct Netlify site (portal), not charts:
   - `netlify sites:list --json` to locate the portal site entry (id/name/URL).
   - `netlify link --id 2bf20134-2d55-4c06-87bf-507f4c926697` to link the local repo to the portal site.
   - `netlify status` should show the project as `lovetofly-portal`.
3. Ran a clean production deploy from the repo root:
   - `NETLIFY_NEXT_PLUGIN_SKIP_CACHE=1 netlify deploy --prod --message "redeploy portal main"`
   - Build output showed Next.js compiled successfully and one server function (`___netlify-server-handler`) was bundled.
4. Confirmed production went live at https://lovetofly.com.br and viewed the deploy logs in the Netlify UI.

## Why We Skipped/Bypassed Cache
- Earlier attempts hit `@netlify/plugin-nextjs` cache issues (ENOTEMPTY errors related to `.netlify` dir). Clearing `.netlify` and setting `NETLIFY_NEXT_PLUGIN_SKIP_CACHE=1` avoided the problem.
- If you see similar ENOTEMPTY errors locally, remove the `.netlify` directory at the repo root before re-running the deploy command. You may need elevated permissions on macOS.

## Issues Encountered & Resolutions
- Wrong site linkage (critical): CLI initially pointed to the charts site (`lovetofly-charts`). This would deploy the wrong project and risk charts flow.
  - Resolution: `netlify link` to the portal site ID (2bf20134-2d55-4c06-87bf-507f4c926697) and re-run deploy.
- Netlify Next plugin ENOTEMPTY on local deploy: `Error: ENOTEMPTY: directory not empty, rmdir .../.netlify/functions-internal/.../node_modules/next`
  - Resolution: Clear `.netlify` and re-run with `NETLIFY_NEXT_PLUGIN_SKIP_CACHE=1`.
- Terminal environment noise: local zsh startup errors from `~/.zshrc` (bash completion/nvm). These are noisy but non-blocking for deployments.
- Large untracked chart archives present in repo root: could be mistakenly added if using `git add .`.
  - Resolution: Keep them untracked. Double-check with `git status` before commits.

## Verification Steps After Deploy
- Portal smoke tests (production):
  - `/classifieds/aircraft`, `/classifieds/avionics`, `/classifieds/parts` render and navigate (browse/detail/create flows visible).
  - Other core routes render (see Next.js route list from build logs if needed).
  - No console errors on initial load; serverless function responds for dynamic routes.
- Charts untouched:
  - Charts remain served by the charts site; no new chart uploads occurred from the portal deploy.
  - `public/charts-manifest.json` remains an index only; confirm it matches your expectations if the portal references it.

## Do / Don’t (Safety Rules)
- DO: Confirm CLI is linked to `lovetofly-portal` before deploying.
- DO: Use Netlify UI "Redeploy latest" for quick no-code redeploys.
- DO: Keep chart archives untracked and deploy charts only via the charts site when needed.
- DON’T: Push `charts-release.tar.gz` or `charts.tar.gz` to Git.
- DON’T: Change `netlify.toml` unless there’s a clear requirement.
- DON’T: Attempt to deploy charts through the portal site.

## Commands Reference
Use from repo root unless stated.

```bash
# Verify current project target (should be lovetofly-portal)
netlify status

# List sites and find portal ID
netlify sites:list --json | jq '.'

# Link local repo to the portal site explicitly
netlify link --id 2bf20134-2d55-4c06-87bf-507f4c926697

# Production deploy (skip plugin cache to avoid stale cache issues)
NETLIFY_NEXT_PLUGIN_SKIP_CACHE=1 netlify deploy --prod --message "redeploy portal main"

# Netlify UI fallback (no CLI): Sites → lovetofly-portal → Deploys → Redeploy latest
```

## Where to Look for Answers (Must Read)
- Documentation index: `DOCUMENTATION_INDEX.md`
- Deployment: `DEPLOYMENT.md`, `DEPLOYMENT_READY.md`
- Quick starts: `START_HERE.md`, `QUICK_START.md`, `QUICK_REFERENCE.md`
- HangarShare feature guides: `HANGARSHARE_COMPLETE_GUIDE.md`, `HANGARSHARE_ENHANCED.md`, `HANGARSHARE_DELIVERY_SUMMARY.md`
- Payments: `STRIPE_SETUP.md`, `STRIPE_QUICK_START.md`, `STRIPE_RESEND_SETUP_INSTRUCTIONS.md`, `PAYMENT_INTEGRATION.md`, `PAYMENT_INTEGRATION_COMPLETE.md`
- Emails: `EMAIL_SETUP_GUIDE.md`, `EMAIL_QUICK_REFERENCE.md`, `EMAIL_IMPLEMENTATION_COMPLETE.md`
- Database/Neon: `NEON_SETUP.md`, `SETUP_NEON.md`, `PRODUCAO_DB.md`, `SETUP_AND_CONNECTIONS.md`
- Known limitations/TODOs: See notes in the above docs and in `HANGARSHARE_*` files.

## Source Locations (Portal)
- App routes and pages: `src/app/**/*`
- APIs (co-located): `src/app/api/**/route.ts`
- Shared components: `src/components/*`
- Auth context: `src/context/AuthContext.tsx`
- DB connection: `src/config/db.ts`
- Tailwind config: `tailwind.config.js`
- Netlify config: `netlify.toml`

## Final Notes for the Next Agent
- Treat portal and charts as separate deploy systems.
- If the goal is "make production match localhost" without changing charts, redeploy the portal site only.
- Always double-check the linked Netlify site (`netlify status`) before running any deploy.
- Read the listed docs first; they capture architecture, flows, and constraints. This helps avoid repeating the site-link and charts mix-up that can endanger work.
