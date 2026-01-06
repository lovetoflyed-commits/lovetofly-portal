#!/bin/bash

# ONE-COMMAND DEPLOYMENT FOR CHARTS
# This script opens everything you need to deploy charts in 5 minutes

clear
echo "
╔═══════════════════════════════════════════════════════════════╗
║     LOVETOFLY CHARTS - DEPLOY IN 5 MINUTES                     ║
╚═══════════════════════════════════════════════════════════════╝

📦 Charts ready: 715MB (1,900 PDFs)
🎯 Method: Netlify Drop (drag-and-drop)
⏱️  Time: ~5-10 minutes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"

# Check if dist folder exists
if [ ! -d "dist/charts" ]; then
    echo "📁 Creating dist folder with charts..."
    mkdir -p dist/charts
    cp -r public/charts/* dist/charts/
    cp public/e6b/jeppesen/README.md dist/ 2>/dev/null || true
    echo "✅ dist/charts ready"
fi

# Check if archive exists
if [ ! -f "charts-release.tar.gz" ]; then
    echo "📦 Creating compressed archive..."
    tar -czf charts-release.tar.gz -C public charts/
    echo "✅ charts-release.tar.gz ready ($(ls -lh charts-release.tar.gz | awk '{print $5}'))"
fi

echo "
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 NEXT STEPS (CHOOSE ONE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OPTION 1: Netlify Drop (FASTEST - 5 minutes)
─────────────────────────────────────────────
1. Opening: https://app.netlify.com/drop
2. Drag this folder: dist/
3. Wait for upload (~10 min)
4. Copy the URL Netlify gives you
5. Add to main site env vars: CHARTS_CDN_URL=[url]

OPTION 2: GitHub Releases (FREE FOREVER - 10 minutes)
──────────────────────────────────────────────────────
1. Opening: https://github.com/lovetoflyed-commits/lovetofly-portal/releases/new
2. Fill in:
   Tag: charts-v1.0
   Title: Aeronautical Charts v1.0
   Upload: charts-release.tar.gz (693MB)
3. Get URL: https://github.com/.../releases/download/charts-v1.0/charts-release.tar.gz
4. Add to env vars: CHARTS_CDN_URL=[url]

OPTION 3: Cloudflare R2 (FREE + BEST FOR PRODUCTION - 15 minutes)
──────────────────────────────────────────────────────────────────
1. Create account: https://dash.cloudflare.com/
2. Install: npm install -g wrangler
3. Login: wrangler login
4. Upload: wrangler r2 object put lovetofly-charts --file=charts-release.tar.gz
5. Enable public access
6. Add to env vars: CHARTS_CDN_URL=[r2-url]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📂 Ready files:
   ✅ dist/charts/ (715MB, uncompressed)
   ✅ charts-release.tar.gz (693MB, compressed)
   ✅ dist/index.html (charts CDN landing page)

🌐 Opening URLs now...
"

# Wait a moment
sleep 2

# Open Netlify Drop
echo "🚀 Opening Netlify Drop..."
open https://app.netlify.com/drop 2>/dev/null || echo "   Go to: https://app.netlify.com/drop"

# Open dist folder in Finder
echo "📂 Opening dist folder..."
open dist/ 2>/dev/null || echo "   Open: /Users/edsonassumpcao/Desktop/lovetofly-portal/dist"

# Wait
sleep 2

# Open GitHub releases
echo "📦 Opening GitHub Releases..."
open https://github.com/lovetoflyed-commits/lovetofly-portal/releases/new 2>/dev/null || echo "   Go to: https://github.com/lovetoflyed-commits/lovetofly-portal/releases/new"

echo "
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ EVERYTHING READY!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 RECOMMENDED: Drag 'dist' folder to Netlify Drop (fastest)

⏱️  After upload completes:
   1. Note the Netlify URL
   2. Go to main site settings
   3. Add env var: CHARTS_CDN_URL=[netlify-url]
   4. Redeploy (auto from GitHub)
   5. Test charts at: [your-site]/procedures/SBSP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need help? Read: FINAL_DEPLOYMENT_SOLUTION.md
"
