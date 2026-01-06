#!/bin/bash

# Alternative deployment strategy for 715MB charts
# Uses GitHub Releases as CDN storage

CHARTS_DIR="public/charts"
REPO="lovetoflyed-commits/lovetofly-portal"
RELEASE_TAG="charts-v1.0"

echo "🚀 Deploying charts via GitHub Releases..."
echo "📊 Total size: $(du -sh $CHARTS_DIR | cut -f1)"

# Create release tarball
echo "📦 Creating compressed archive..."
tar -czf charts-release.tar.gz -C public charts/

echo "✅ Archive created: $(ls -lh charts-release.tar.gz | awk '{print $5}')"

echo "
📋 Next steps to deploy charts:

1. Create GitHub Release:
   - Go to: https://github.com/$REPO/releases/new
   - Tag: $RELEASE_TAG
   - Title: 'Aeronautical Charts v1.0'
   - Upload: charts-release.tar.gz (693MB)

2. Update API to fetch from release:
   - URL: https://github.com/$REPO/releases/download/$RELEASE_TAG/charts-release.tar.gz
   - Extract on server: tar -xzf charts-release.tar.gz -C public/

3. Or use CDN services:
   - Cloudflare R2: Free 10GB storage
   - AWS S3: ~\$0.023/GB/month (~\$16/month for 715MB)
   - Backblaze B2: \$0.005/GB/month (~\$3.5/month for 715MB)

4. Netlify Large Media (Git LFS):
   - Install: brew install git-lfs (requires Xcode update)
   - Init: git lfs install
   - Track: git lfs track '*.pdf'
   - Commit and push

🎯 Recommended: Use Cloudflare R2 (free tier) or GitHub Releases
"
