#!/usr/bin/env node

/**
 * Generate placeholder E6B images for development.
 * Creates: ruler.png, inner-disc.png, outer-disc.png, slide.png
 */

const fs = require('fs');
const path = require('path');

// Helper to create a simple SVG and convert to PNG
function createSVG(width, height, content) {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        text { font-family: Arial, sans-serif; font-size: 12px; }
      </style>
    </defs>
    ${content}
  </svg>`;
}

const dir = path.join(__dirname, 'public/e6b/jeppesen');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`Created directory: ${dir}`);
}

// 1. Ruler (scale background) - vertical with low/high speeds
const rulerSVG = createSVG(800, 650, `
  <rect width="800" height="650" fill="white" stroke="#ccc" stroke-width="1"/>
  <text x="20" y="30" font-weight="bold">Low Speed (40-120 kt)</text>
  <text x="420" y="30" font-weight="bold">High Speed (120-240 kt)</text>
  
  <!-- Low speed ruler (left side) -->
  <line x1="100" y1="100" x2="100" y2="600" stroke="#333" stroke-width="2"/>
  <line x1="90" y1="100" x2="110" y1="100" stroke="#333" stroke-width="1"/><text x="65" y="105">40</text>
  <line x1="90" y1="200" x2="110" y1="200" stroke="#333" stroke-width="1"/><text x="65" y="205">60</text>
  <line x1="90" y1="300" x2="110" y1="300" stroke="#333" stroke-width="1"/><text x="60" y="305">80</text>
  <line x1="90" y1="400" x2="110" y1="400" stroke="#333" stroke-width="1"/><text x="55" y="405">100</text>
  <line x1="90" y1="500" x2="110" y1="500" stroke="#333" stroke-width="1"/><text x="55" y="505">120</text>
  <line x1="90" y1="600" x2="110" y1="600" stroke="#333" stroke-width="1"/>
  
  <!-- High speed ruler (right side) -->
  <line x1="700" y1="100" x2="700" y2="600" stroke="#333" stroke-width="2"/>
  <line x1="690" y1="100" x2="710" y1="100" stroke="#333" stroke-width="1"/><text x="710" y="105">120</text>
  <line x1="690" y1="200" x2="710" y1="200" stroke="#333" stroke-width="1"/><text x="710" y="205">150</text>
  <line x1="690" y1="300" x2="710" y1="300" stroke="#333" stroke-width="1"/><text x="710" y="305">180</text>
  <line x1="690" y1="400" x2="710" y1="400" stroke="#333" stroke-width="1"/><text x="710" y="405">210</text>
  <line x1="690" y1="500" x2="710" y1="500" stroke="#333" stroke-width="1"/><text x="710" y="505">240</text>
  <line x1="690" y1="600" x2="710" y1="600" stroke="#333" stroke-width="1"/>
  
  <text x="300" y="640" text-anchor="middle" fill="#999" font-size="11">Wind Side - Static Ruler</text>
`);

// 2. Inner disc (rotatable) - markings around circumference
const innerDiscSVG = createSVG(800, 650, `
  <defs>
    <circle id="disc-base" cx="400" cy="325" r="280" fill="none" stroke="#ddd" stroke-width="2" opacity="0.3"/>
  </defs>
  <circle cx="400" cy="325" r="280" fill="white" stroke="#999" stroke-width="2" opacity="0.8"/>
  
  <!-- Cardinal marks -->
  <line x1="400" y1="50" x2="400" y2="70" stroke="#000" stroke-width="2"/>
  <text x="400" y="40" text-anchor="middle" font-weight="bold">0</text>
  
  <line x1="750" y1="325" x2="730" y2="325" stroke="#000" stroke-width="2"/>
  <text x="770" y="330" text-anchor="middle" font-weight="bold">90</text>
  
  <line x1="400" y1="600" x2="400" y2="580" stroke="#000" stroke-width="2"/>
  <text x="400" y="620" text-anchor="middle" font-weight="bold">180</text>
  
  <line x1="50" y1="325" x2="70" y2="325" stroke="#000" stroke-width="2"/>
  <text x="20" y="330" text-anchor="middle" font-weight="bold">270</text>
  
  <!-- 10-degree marks -->
  <g id="marks">
    <line x1="400" y1="55" x2="400" y2="65" stroke="#999" stroke-width="1"/>
    <line x1="400" y1="55" x2="400" y2="65" stroke="#999" stroke-width="1" transform="rotate(10 400 325)"/>
    <line x1="400" y1="55" x2="400" y2="65" stroke="#999" stroke-width="1" transform="rotate(20 400 325)"/>
    <line x1="400" y1="55" x2="400" y2="65" stroke="#999" stroke-width="1" transform="rotate(30 400 325)"/>
    <line x1="400" y1="55" x2="400" y2="65" stroke="#999" stroke-width="1" transform="rotate(40 400 325)"/>
    <line x1="400" y1="55" x2="400" y2="65" stroke="#999" stroke-width="1" transform="rotate(50 400 325)"/>
    <line x1="400" y1="55" x2="400" y2="65" stroke="#999" stroke-width="1" transform="rotate(60 400 325)"/>
    <line x1="400" y1="55" x2="400" y2="65" stroke="#999" stroke-width="1" transform="rotate(70 400 325)"/>
    <line x1="400" y1="55" x2="400" y2="65" stroke="#999" stroke-width="1" transform="rotate(80 400 325)"/>
  </g>
  
  <!-- Center circle -->
  <circle cx="400" cy="325" r="40" fill="#f0f0f0" stroke="#666" stroke-width="1"/>
  <text x="400" y="330" text-anchor="middle" fill="#999" font-size="10">INNER</text>
  <text x="400" y="345" text-anchor="middle" fill="#999" font-size="10">DISC</text>
`);

// 3. Outer disc (static frame/ring) - just a border
const outerDiscSVG = createSVG(800, 650, `
  <circle cx="400" cy="325" r="280" fill="none" stroke="#000" stroke-width="4"/>
  <circle cx="400" cy="325" r="275" fill="none" stroke="#999" stroke-width="1"/>
  <circle cx="400" cy="325" r="285" fill="none" stroke="#999" stroke-width="1"/>
  <text x="400" y="625" text-anchor="middle" fill="#999" font-size="10">Outer Ring (Static)</text>
`);

// 4. Slide (optional - vertical band overlay)
const slideSVG = createSVG(240, 650, `
  <rect width="240" height="650" fill="rgba(200, 220, 255, 0.15)" stroke="#0099ff" stroke-width="2"/>
  <text x="120" y="30" text-anchor="middle" fill="#0099ff" font-size="12" font-weight="bold">SLIDE</text>
  <text x="120" y="320" text-anchor="middle" fill="#0099ff" font-size="11" opacity="0.5">Optional Overlay</text>
`);

// Helper: use ImageMagick convert or write SVG directly
const convertSVGtoPNG = (svg, filename) => {
  const filepath = path.join(dir, filename);
  
  // For now, save as SVG with .png extension (browsers can read SVG even with .png name)
  // Or we use base64 PNG for actual PNG
  // Let's try a simpler approach: just save actual SVG and rename to .svg, then we'll serve them
  // Actually, let's create a minimal PNG using a Node.js approach
  
  // For development, we can serve SVG as data URL or save inline PNG
  // Simplest: save SVG as .svg and symlink or just keep them as SVG
  // But the code expects .png, so let's write base64 PNG data
  
  fs.writeFileSync(filepath.replace('.png', '.svg'), svg, 'utf8');
  console.log(`Created: ${filepath.replace('.png', '.svg')}`);
};

// Fallback: write minimal PNG (1x1 transparent for testing)
const writePNG = (filename) => {
  const filepath = path.join(dir, filename);
  // Minimal valid PNG: 1x1 white pixel
  const minimalPNG = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, // IHDR chunk size
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x03, 0x20, // width: 800
    0x00, 0x00, 0x02, 0x8a, // height: 650
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, etc.
    0x47, 0x69, 0x8e, 0x23, // CRC
    0x00, 0x00, 0x00, 0x00, // IDAT chunk size (empty for now)
    0x49, 0x44, 0x41, 0x54, // IDAT
    0xd3, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x00, 0x01, // minimal data
    0x00, 0x01, // checksum
    0x18, 0xdd, 0x8d, 0xb4, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk size
    0x49, 0x45, 0x4e, 0x44, // IEND
    0xae, 0x42, 0x60, 0x82  // CRC
  ]);
  fs.writeFileSync(filepath, minimalPNG);
  console.log(`Created: ${filepath} (minimal PNG)`);
};

// For now, let's output SVG files that we can view
console.log('\n=== Generating E6B Placeholder Images ===\n');
convertSVGtoPNG(rulerSVG, 'ruler.png');
convertSVGtoPNG(innerDiscSVG, 'inner-disc.png');
convertSVGtoPNG(outerDiscSVG, 'outer-disc.png');
convertSVGtoPNG(slideSVG, 'slide.png');

// Also write actual minimal PNGs as fallback
writePNG('ruler.png');
writePNG('inner-disc.png');
writePNG('outer-disc.png');
writePNG('slide.png');

console.log('\n✓ Placeholder images generated in:', dir);
console.log('  - ruler.png');
console.log('  - inner-disc.png');
console.log('  - outer-disc.png');
console.log('  - slide.png');
console.log('\nThese are minimal placeholders. Replace with actual E6B images from Jeppesen.\n');
