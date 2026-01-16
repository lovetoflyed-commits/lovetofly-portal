#!/bin/bash
# Generate placeholder images for seed data
# Requires ImageMagick: brew install imagemagick

set -e

echo "🎨 Generating placeholder images for seed data..."
echo ""

cd "$(dirname "$0")"
ASSETS_DIR="../public/seed-assets"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Please install it:"
    echo "   brew install imagemagick"
    exit 1
fi

# Create directories if they don't exist
mkdir -p "$ASSETS_DIR/avatars"
mkdir -p "$ASSETS_DIR/hangars"
mkdir -p "$ASSETS_DIR/companies"

echo "👤 Generating user avatars (15 images)..."

# User avatars with initials and colors
declare -A users=(
    ["admin"]="AS:#e53935"
    ["carlos-silva"]="CS:#1976d2"
    ["maria-santos"]="MS:#7b1fa2"
    ["joao-oliveira"]="JO:#388e3c"
    ["roberto-costa"]="RC:#f57c00"
    ["ana-ferreira"]="AF:#c2185b"
    ["paulo-martins"]="PM:#455a64"
    ["lucas-almeida"]="LA:#0097a7"
    ["fernanda-lima"]="FL:#5e35b1"
    ["juliana-rocha"]="JR:#00796b"
    ["ricardo-mendes"]="RM:#c62828"
    ["patricia-gomes"]="PG:#6a1b9a"
    ["gustavo-barbosa"]="GB:#1565c0"
    ["michael-johnson"]="MJ:#2e7d32"
    ["sofia-rodriguez"]="SR:#d84315"
)

for user in "${!users[@]}"; do
    IFS=':' read -r initials color <<< "${users[$user]}"
    convert -size 200x200 \
        -background "$color" \
        -fill white \
        -gravity center \
        -font "Helvetica-Bold" \
        -pointsize 64 \
        label:"$initials" \
        "$ASSETS_DIR/avatars/$user.jpg"
    echo "  ✓ $user.jpg"
done

echo ""
echo "🏠 Generating hangar photos (30 images)..."

# Hangar photos with labels
hangar_types=(
    "Premium Hangar"
    "Corporate Hangar"
    "Executive Hangar"
    "Shared Space"
    "Maintenance Bay"
    "Compact Storage"
    "Luxury Facility"
    "Regional Hangar"
    "Workshop"
    "Tie-Down Area"
)

for i in {1..30}; do
    type_index=$(( ($i - 1) % ${#hangar_types[@]} ))
    type="${hangar_types[$type_index]}"
    
    convert -size 800x600 \
        -background "#2c3e50" \
        -fill white \
        -gravity center \
        -font "Helvetica" \
        -pointsize 48 \
        label:"$type\n#$i" \
        "$ASSETS_DIR/hangars/hangar-$i.jpg"
    
    # Only show first 10 to avoid clutter
    if [ $i -le 10 ]; then
        echo "  ✓ hangar-$i.jpg"
    fi
done
echo "  ... (20 more)"

echo ""
echo "🏢 Generating company logos (12 images)..."

declare -A companies=(
    ["latam"]="LATAM:#e53935"
    ["azul"]="AZUL:#0d47a1"
    ["gol"]="GOL:#ff6f00"
    ["executive-jets"]="EJ:#1a237e"
    ["helibras"]="HELIBRAS:#d32f2f"
    ["aeroclube-sp"]="ACSP:#2e7d32"
    ["tam-executiva"]="TAM:#c62828"
    ["vasp-manutencao"]="VASP:#f57c00"
    ["embraer"]="EMBRAER:#1976d2"
    ["skydive"]="SKYDIVE:#43a047"
    ["helisul"]="HELISUL:#6a1b9a"
    ["aeromot"]="AEROMOT:#00838f"
)

for company in "${!companies[@]}"; do
    IFS=':' read -r name color <<< "${companies[$company]}"
    
    # Create with white background and colored text
    convert -size 200x200 \
        -background "white" \
        -fill "$color" \
        -gravity center \
        -font "Helvetica-Bold" \
        -pointsize 24 \
        label:"$name" \
        "$ASSETS_DIR/companies/$company.png"
    echo "  ✓ $company.png"
done

echo ""
echo "✅ Image generation complete!"
echo ""
echo "📊 Summary:"
echo "   Avatars:  $(ls -1 "$ASSETS_DIR/avatars" | wc -l | tr -d ' ') files"
echo "   Hangars:  $(ls -1 "$ASSETS_DIR/hangars" | wc -l | tr -d ' ') files"
echo "   Companies: $(ls -1 "$ASSETS_DIR/companies" | wc -l | tr -d ' ') files"
echo ""
echo "🌐 Test in browser:"
echo "   http://localhost:3000/seed-assets/avatars/carlos-silva.jpg"
echo "   http://localhost:3000/seed-assets/hangars/hangar-1.jpg"
echo "   http://localhost:3000/seed-assets/companies/latam.png"
echo ""
