#!/bin/bash

# COMPLETE DEPLOYMENT SOLUTION FOR CHARTS
# This script provides multiple deployment options

set -e

CHARTS_DIR="public/charts"
CHARTS_SIZE="715M"
CHARTS_COUNT=1900

echo "
╔══════════════════════════════════════════════════════════════╗
║        LOVETOFLY PORTAL - CHARTS DEPLOYMENT SOLUTION          ║
║                    715MB (1,900 PDF files)                    ║
╚══════════════════════════════════════════════════════════════╝

📊 Current Status:
   ✅ Code deployed to Netlify (via GitHub)
   ⚠️  Charts NOT deployed (too large for standard workflow)

🎯 Available Deployment Options:
"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "OPTION 1: Cloudflare R2 (RECOMMENDED - FREE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "
• Free 10GB storage (plenty for 715MB)
• Fast global CDN
• S3-compatible API
• No egress fees

Steps:
1. Create Cloudflare account (free): https://dash.cloudflare.com/
2. Create R2 bucket: Dashboard → R2 → Create Bucket
3. Install Wrangler CLI:
   npm install -g wrangler
4. Login:
   wrangler login
5. Upload charts:
   wrangler r2 object put lovetofly-charts/charts.tar.gz --file=charts-release.tar.gz
6. Enable public access in R2 settings
7. Update API to use R2 URL

Estimated time: 15 minutes
Cost: FREE
"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "OPTION 2: GitHub Releases (SIMPLE - FREE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "
• Use GitHub as CDN
• No additional services
• Good for versioning

Steps:
1. Compress charts (already done):
   $(ls -lh charts-release.tar.gz 2>/dev/null | awk '{print $5}' || echo "Run: tar -czf charts-release.tar.gz -C public charts/")
2. Create release:
   https://github.com/lovetoflyed-commits/lovetofly-portal/releases/new
3. Tag: charts-v1.0
4. Upload: charts-release.tar.gz
5. Use release URL:
   https://github.com/lovetoflyed-commits/lovetofly-portal/releases/download/charts-v1.0/charts-release.tar.gz

Estimated time: 10 minutes
Cost: FREE
Note: Max 2GB per file (our 693MB compressed fits!)
"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "OPTION 3: Backblaze B2 (CHEAPEST PAID)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "
• \$0.005/GB/month = ~\$3.50/month for 715MB
• S3-compatible
• Free 10GB download/day

Steps:
1. Create account: https://www.backblaze.com/b2/sign-up.html
2. Create bucket (public)
3. Install B2 CLI:
   brew install b2-tools
4. Authorize:
   b2 authorize-account
5. Upload:
   b2 sync public/charts b2://lovetofly-charts

Estimated time: 20 minutes
Cost: ~\$3.50/month
"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "OPTION 4: AWS S3 (STANDARD)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "
• Industry standard
• \$0.023/GB/month = ~\$16/month
• CloudFront CDN available

Steps:
1. AWS Console → S3 → Create Bucket
2. Install AWS CLI:
   brew install awscli
3. Configure:
   aws configure
4. Upload:
   aws s3 sync public/charts s3://lovetofly-charts --acl public-read

Estimated time: 25 minutes  
Cost: ~\$16/month
"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "OPTION 5: Manual Netlify Upload (TEMPORARY)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "
• Quick test solution
• Must repeat for each deploy

Steps:
1. Create static site build:
   mkdir -p dist && cp -r public/charts dist/
2. Deploy via Netlify Drop:
   https://app.netlify.com/drop
3. Note the URL
4. Update API to use Netlify subdomain

Estimated time: 5 minutes
Cost: FREE
Limitation: Manual, not persistent across code deploys
"

echo "
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 RECOMMENDED APPROACH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For immediate deployment (fastest):
→ OPTION 2: GitHub Releases (10 min, FREE, simple)

For production (best long-term):
→ OPTION 1: Cloudflare R2 (15 min, FREE, CDN)

For testing (quickest):
→ OPTION 5: Netlify Drop (5 min, temporary)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 QUICK START - GitHub Releases (Recommended Now):

1. Compress charts (if not already done):
   $ tar -czf charts-release.tar.gz -C public charts/

2. Go to:
   https://github.com/lovetoflyed-commits/lovetofly-portal/releases/new

3. Fill in:
   • Tag: charts-v1.0
   • Title: Aeronautical Charts Database v1.0
   • Description: 1,900 PDF charts for Brazilian airports (715MB)
   • Upload: charts-release.tar.gz

4. Update chart API (src/app/api/charts/route.ts):
   • Check if running in production
   • If charts not local, fetch from GitHub release URL
   • Extract and cache locally

5. Deploy API update:
   $ git add src/app/api/charts/route.ts
   $ git commit -m 'Update charts API to use GitHub releases'
   $ git push origin main

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need help with any option? Let me know!
"

# Check if charts archive exists
if [ ! -f "charts-release.tar.gz" ]; then
    echo "
⚙️  Creating charts archive now...
"
    tar -czf charts-release.tar.gz -C public charts/ && \
    echo "✅ Created: charts-release.tar.gz ($(ls -lh charts-release.tar.gz | awk '{print $5}'))"
fi

echo "
📦 Charts archive ready: charts-release.tar.gz
🔗 Next: Choose an option above and follow the steps!
"
