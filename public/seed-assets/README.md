# Seed Assets - Local Images for Test Data

This directory contains local copies of all images used in database seed files, ensuring test data remains reliable even if external services go offline.

## 📁 Directory Structure

```
seed-assets/
├── avatars/          # User profile pictures (15 files)
├── hangars/          # Hangar listing photos (30+ files)
├── companies/        # Company logos (12 files)
└── README.md         # This file
```

## 🖼️ Required Images

### Avatars (public/seed-assets/avatars/)

User profile pictures - 200x200px recommended:

- `admin.jpg` - Admin Sistema
- `carlos-silva.jpg` - Commercial Pilot
- `maria-santos.jpg` - ATPL Captain
- `joao-oliveira.jpg` - Private Pilot
- `roberto-costa.jpg` - Aircraft Owner
- `ana-ferreira.jpg` - Aircraft Owner
- `paulo-martins.jpg` - Aviation Mechanic
- `lucas-almeida.jpg` - Flight Student
- `fernanda-lima.jpg` - Aviation Enthusiast
- `juliana-rocha.jpg` - Flight Attendant
- `ricardo-mendes.jpg` - Air Traffic Controller
- `patricia-gomes.jpg` - Aviation Manager
- `gustavo-barbosa.jpg` - Safety Inspector
- `michael-johnson.jpg` - Corporate Pilot (US)
- `sofia-rodriguez.jpg` - Flight Instructor (Spain)

### Hangars (public/seed-assets/hangars/)

Hangar photos - 800x600px recommended, multiple photos per listing:

**Congonhas Premium (roberto-costa):**
- `congonhas-premium-1.jpg` - Exterior view
- `congonhas-premium-2.jpg` - Interior wide shot
- `congonhas-premium-3.jpg` - Amenities/office

**GRU Corporate (roberto-costa):**
- `gru-corporate-1.jpg` - Large hangar exterior
- `gru-corporate-2.jpg` - Interior with aircraft

**Jundiaí Executive (ana-ferreira):**
- `jundiai-executive-1.jpg` - Modern hangar

**Viracopos Shared (ana-ferreira):**
- `viracopos-shared-1.jpg` - Shared space

**Campo Marte Workshop (paulo-martins):**
- `campo-marte-workshop-1.jpg` - Workshop equipment
- `campo-marte-workshop-2.jpg` - Work area

**Santos Dumont Compact (fernanda-lima):**
- `santos-dumont-compact-1.jpg` - Bay view

**Congonhas Box (lucas-almeida):**
- `congonhas-box-1.jpg` - Tie-down area

**GRU Premium Widebody (michael-johnson):**
- `gru-premium-widebody-1.jpg` - Luxury hangar exterior
- `gru-premium-widebody-2.jpg` - Executive lounge
- `gru-premium-widebody-3.jpg` - Hangar interior

**Porto Alegre Salgado Filho (carlos-silva):**
- `porto-alegre-hangar-1.jpg` - Regional hangar

**Confins BH Tancredo Neves (maria-santos):**
- `confins-hangar-1.jpg` - Modern facility exterior
- `confins-hangar-2.jpg` - Interior view

### Companies (public/seed-assets/companies/)

Company logos - 200x200px recommended, transparent PNG preferred:

- `latam.png` - LATAM Airlines Group
- `azul.png` - Azul Linhas Aéreas
- `gol.png` - GOL Linhas Aéreas
- `executive-jets.png` - Executive Jets Brasil
- `helibras.png` - Helibras Helicopters
- `aeroclube-sp.png` - AeroClube de São Paulo
- `tam-executiva.png` - TAM Aviação Executiva
- `vasp-manutencao.png` - VASP Manutenção
- `embraer.png` - Embraer Executive Jets
- `skydive.png` - SkyDive Brasil
- `helisul.png` - Helisul Táxi Aéreo
- `aeromot.png` - Aeromot Aircraft

## 🎨 Image Sources

You can obtain placeholder images from:

### For Avatars:
1. **Professional Stock Photos** (recommended):
   - Unsplash: https://unsplash.com/s/photos/pilot
   - Pexels: https://www.pexels.com/search/aviation/
   
2. **AI-Generated Avatars**:
   - ThisPersonDoesNotExist.com
   - Generated Photos: https://generated.photos/

3. **Placeholder Services** (download and save locally):
   - UI Avatars: Generate and save from https://ui-avatars.com/api/
   - Pravatar: https://i.pravatar.cc/

### For Hangars:
1. **Aviation Stock Photos**:
   - Unsplash aviation hangar search
   - Pexels aircraft hangar search
   - Free aviation photo sites

2. **Sample Images**:
   - Aircraft maintenance facilities
   - Private hangar interiors
   - Airport infrastructure photos

### For Company Logos:
1. **Real Logos** (public domain/fair use for testing):
   - Official websites (save logo images)
   - Wikipedia company pages
   
2. **Generated Logos**:
   - Canva logo maker
   - Logo placeholder generators
   - Simple text-based logos in GIMP/Photoshop

## 📝 Naming Convention

Use kebab-case for all filenames:
- `firstname-lastname.jpg` for avatars
- `airport-type-number.jpg` for hangars
- `company-name.png` for logos

## ⚙️ After Adding Images

Once you've placed images in these directories, the seed files will automatically use them via local paths like:

- `/seed-assets/avatars/carlos-silva.jpg`
- `/seed-assets/hangars/congonhas-premium-1.jpg`
- `/seed-assets/companies/latam.png`

These paths are served by Next.js from the `public/` directory.

## 🔄 Quick Setup Script

To quickly generate placeholder images using ImageMagick:

```bash
cd public/seed-assets

# Generate avatar placeholders (200x200 with initials)
for name in admin carlos-silva maria-santos joao-oliveira roberto-costa ana-ferreira paulo-martins lucas-almeida fernanda-lima juliana-rocha ricardo-mendes patricia-gomes gustavo-barbosa michael-johnson sofia-rodriguez; do
  convert -size 200x200 -background "#0066cc" -fill white -gravity center -font Arial-Bold -pointsize 48 label:"${name:0:2}" "avatars/$name.jpg"
done

# Generate hangar placeholders (800x600)
for i in {1..30}; do
  convert -size 800x600 -background "#333333" -fill white -gravity center -font Arial -pointsize 36 label:"Hangar Photo $i" "hangars/hangar-$i.jpg"
done

# Generate company logo placeholders (200x200)
for company in latam azul gol executive-jets helibras aeroclube-sp tam-executiva vasp-manutencao embraer skydive helisul aeromot; do
  convert -size 200x200 -background "#ffffff" -fill "#000000" -gravity center -font Arial-Bold -pointsize 24 label:"$company" "companies/$company.png"
done
```

## ✅ Verification

After adding images, verify they're accessible:

```bash
# Check avatar count
ls -1 public/seed-assets/avatars/ | wc -l  # Should be 15

# Check hangar photos
ls -1 public/seed-assets/hangars/ | wc -l  # Should be 30+

# Check company logos
ls -1 public/seed-assets/companies/ | wc -l  # Should be 12
```

Then visit in browser:
- http://localhost:3000/seed-assets/avatars/carlos-silva.jpg
- http://localhost:3000/seed-assets/hangars/congonhas-premium-1.jpg
- http://localhost:3000/seed-assets/companies/latam.png

## 🎯 Benefits

✅ **Reliability** - No external dependencies  
✅ **Speed** - Local images load faster  
✅ **Offline** - Works without internet  
✅ **Control** - Full control over image content  
✅ **Privacy** - No tracking from external services  
✅ **Testing** - Consistent test environment

---

**Note**: Images should be appropriate for professional aviation business context. Use stock photos or AI-generated images to avoid copyright issues.
