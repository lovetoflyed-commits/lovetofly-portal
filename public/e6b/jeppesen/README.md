# Jeppesen E6B Assets

Place your high-resolution Jeppesen E6B images here to achieve authentic analog calculator fidelity.

## Required Assets

### 1. `ruler.svg` or `ruler.png`
- **Description**: Linear ruler background with dual speed scales
- **Features**:
  - Left column: LOW scale (40-120 kt) with GS curves
  - Right column: HIGH scale (120-240 kt) with GS curves
  - Drift marks and correction columns
  - Time/distance/fuel markings
- **Dimensions**: 800x650px recommended
- **Format**: Transparent PNG or SVG preferred
- **How to capture**: Photograph or scan the flat ruler portion of your physical E6B

### 2. `inner-disc.svg` or `inner-disc.png`
- **Description**: Rotatable inner disc with 360° markings
- **Features**:
  - Degree markings every 1° (or 5°/10° ticks)
  - Wind correction angle (WCA) radial lines
  - True course/heading reference marks
  - Center grommet hole (transparent)
- **Dimensions**: 800x650px recommended
- **Format**: Transparent PNG or SVG (background must be transparent!)
- **How to capture**: Photograph the rotating disc against a light background, then remove the background

### 3. `outer-disc.svg` or `outer-disc.png` (Optional)
- **Description**: Static outer frame/ring
- **Features**:
  - Reference markings
  - Cardinal directions (N, E, S, W)
  - Outer scale or manufacturer branding
- **Dimensions**: 800x650px
- **Format**: Transparent PNG or SVG
- **Note**: This is optional; adds realism but not required for functionality

### 4. `slide.svg` or `slide.png` (Optional)
- **Description**: Transparent overlay showing slide cursor/window
- **Features**:
  - Vertical cursor line or window
  - Additional reference marks
- **Dimensions**: 240px width, 650px height
- **Format**: Transparent PNG or SVG
- **Note**: Only if your physical E6B has a distinct slide overlay

## Image Preparation Tips

### Using a Real Jeppesen E6B
1. **Photography**:
   - Use bright, even lighting
   - Position camera directly above to avoid perspective distortion
   - Use highest resolution possible (at least 300 DPI if scanning)
   - Ensure the E6B is completely flat

2. **Background Removal** (for transparent discs):
   - Use Photoshop, GIMP, or online tools like remove.bg
   - For inner disc: Remove everything except the disc itself
   - Keep the center grommet area transparent
   - Save as PNG with transparency

3. **Alignment**:
   - Center the disc in the 800x650 canvas
   - For ruler: align vertically centered, with scale columns visible
   - Test in the app and use calibration controls to fine-tune

### Alternative: Create SVG from Measurements
If you don't have a physical E6B to photograph:
1. Measure or research the Jeppesen E6B dimensions
2. Create vector graphics in Inkscape or Adobe Illustrator
3. Include:
   - Accurate speed scales with logarithmic spacing
   - GS curves matching Jeppesen design
   - Drift correction columns
   - Degree markings every 1°

## Current State

Currently, placeholder SVG files are present. Replace them with real Jeppesen E6B images for authentic appearance and accurate calculations.

## Testing After Adding Images

1. Navigate to http://localhost:3000/tools/e6b/analog
2. Use calibration controls to align:
   - Transform Origin X/Y (to adjust rotation center)
   - Disc Scale (to resize the inner disc)
   - Slide Top/Height (to position the ruler band)
3. Test rotation with mouse drag or arrow keys
4. Verify cursor movement along the ruler tracks speed correctly
5. Check that degree markings align (use "Mostrar overlay de graus" option)

## Example Workflow

```bash
# 1. Place your images
cp ~/Desktop/jeppesen-ruler.png ./ruler.png
cp ~/Desktop/jeppesen-inner-disc.png ./inner-disc.png
cp ~/Desktop/jeppesen-outer-ring.png ./outer-disc.png

# 2. Start dev server
cd ../../../..
yarn dev

# 3. Open analog E6B
# http://localhost:3000/tools/e6b/analog

# 4. Calibrate if needed using the "Calibrar" button
```

## Licensing Note

Jeppesen E6B images are proprietary. Only use images from E6Bs you own or have explicit permission to reproduce. For production deployment, ensure you have proper licensing or use original artwork.
