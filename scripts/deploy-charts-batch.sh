#!/bin/bash

# Deploy charts in batches to avoid size limits
# This script uploads charts directory in chunks to Netlify

CHARTS_DIR="public/charts"
SITE_ID="6910448e-fb91-292c-9b83-99e9c6be8e5e"
BATCH_SIZE=50  # Files per batch

echo "🚀 Starting batch upload of charts to Netlify..."
echo "📊 Total files: $(find $CHARTS_DIR -name "*.pdf" | wc -l)"

# Create temporary directory for batches
TEMP_DIR="$(mktemp -d)"
echo "📁 Using temp directory: $TEMP_DIR"

# Counter for batches
batch_num=0

# Find all PDF files and process in batches
find "$CHARTS_DIR" -name "*.pdf" -print0 | while IFS= read -r -d '' file; do
    # Create batch directory
    batch_dir="$TEMP_DIR/batch_$(printf "%03d" $batch_num)"
    mkdir -p "$batch_dir/$(dirname "$file")"
    
    # Copy file to batch
    cp "$file" "$batch_dir/$file"
    
    # Check if batch is full
    file_count=$(find "$batch_dir" -name "*.pdf" | wc -l)
    if [ $file_count -ge $BATCH_SIZE ]; then
        echo "📦 Deploying batch $batch_num ($file_count files)..."
        netlify deploy --prod --dir="$batch_dir" --site="$SITE_ID" || echo "⚠️  Batch $batch_num failed"
        rm -rf "$batch_dir"
        batch_num=$((batch_num + 1))
    fi
done

# Deploy remaining files
if [ -d "$batch_dir" ]; then
    echo "📦 Deploying final batch..."
    netlify deploy --prod --dir="$batch_dir" --site="$SITE_ID"
fi

# Cleanup
rm -rf "$TEMP_DIR"
echo "✅ Batch upload complete!"
