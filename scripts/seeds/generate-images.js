#!/usr/bin/env node
/**
 * Generate placeholder images for seed data using Canvas (node-canvas)
 * No external dependencies - uses pure Node.js approach with SVG
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../../public/seed-assets');

// Colors for avatars
const AVATAR_COLORS = {
  'admin': '#e53935',
  'carlos-silva': '#1976d2',
  'maria-santos': '#7b1fa2',
  'joao-oliveira': '#388e3c',
  'roberto-costa': '#f57c00',
  'ana-ferreira': '#c2185b',
  'paulo-martins': '#455a64',
  'lucas-almeida': '#0097a7',
  'fernanda-lima': '#5e35b1',
  'juliana-rocha': '#00796b',
  'ricardo-mendes': '#c62828',
  'patricia-gomes': '#6a1b9a',
  'gustavo-barbosa': '#1565c0',
  'michael-johnson': '#2e7d32',
  'sofia-rodriguez': '#d84315'
};

const COMPANY_COLORS = {
  'latam': '#e53935',
  'azul': '#0d47a1',
  'gol': '#ff6f00',
  'executive-jets': '#1a237e',
  'helibras': '#d32f2f',
  'aeroclube-sp': '#2e7d32',
  'tam-executiva': '#c62828',
  'vasp-manutencao': '#f57c00',
  'embraer': '#1976d2',
  'skydive': '#43a047',
  'helisul': '#6a1b9a',
  'aeromot': '#00838f'
};

const COMPANY_NAMES = {
  'latam': 'LATAM',
  'azul': 'AZUL',
  'gol': 'GOL',
  'executive-jets': 'EJ',
  'helibras': 'HELIBRAS',
  'aeroclube-sp': 'ACSP',
  'tam-executiva': 'TAM',
  'vasp-manutencao': 'VASP',
  'embraer': 'EMBRAER',
  'skydive': 'SKYDIVE',
  'helisul': 'HELISUL',
  'aeromot': 'AEROMOT'
};

// Create directories
function ensureDirectories() {
  const dirs = [
    path.join(ASSETS_DIR, 'avatars'),
    path.join(ASSETS_DIR, 'hangars'),
    path.join(ASSETS_DIR, 'companies')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Generate SVG avatar
function generateAvatarSVG(initials, color) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="${color}"/>
  <text x="100" y="120" font-family="Arial, sans-serif" font-size="64" font-weight="bold" 
        fill="white" text-anchor="middle">${initials}</text>
</svg>`;
}

// Generate SVG hangar placeholder
function generateHangarSVG(number, type) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="600" fill="#2c3e50"/>
  <text x="400" y="280" font-family="Arial, sans-serif" font-size="48" 
        fill="white" text-anchor="middle">${type}</text>
  <text x="400" y="340" font-family="Arial, sans-serif" font-size="36" 
        fill="#95a5a6" text-anchor="middle">#${number}</text>
</svg>`;
}

// Generate SVG company logo
function generateCompanySVG(name, color) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="white"/>
  <text x="100" y="110" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
        fill="${color}" text-anchor="middle">${name}</text>
</svg>`;
}

// Get initials from name
function getInitials(name) {
  return name.split('-').map(part => part[0].toUpperCase()).join('');
}

console.log('🎨 Generating placeholder images for seed data...\n');

ensureDirectories();

// Generate avatars
console.log('👤 Generating user avatars (15 images)...');
Object.keys(AVATAR_COLORS).forEach(user => {
  const initials = getInitials(user);
  const color = AVATAR_COLORS[user];
  const svg = generateAvatarSVG(initials, color);
  const filepath = path.join(ASSETS_DIR, 'avatars', `${user}.svg`);
  fs.writeFileSync(filepath, svg);
  console.log(`  ✓ ${user}.svg`);
});

// Generate hangar photos
console.log('\n🏠 Generating hangar photos (30 images)...');
const hangarTypes = [
  'Premium Hangar',
  'Corporate Hangar',
  'Executive Hangar',
  'Shared Space',
  'Maintenance Bay',
  'Compact Storage',
  'Luxury Facility',
  'Regional Hangar',
  'Workshop',
  'Tie-Down Area'
];

for (let i = 1; i <= 30; i++) {
  const typeIndex = (i - 1) % hangarTypes.length;
  const type = hangarTypes[typeIndex];
  const svg = generateHangarSVG(i, type);
  const filepath = path.join(ASSETS_DIR, 'hangars', `hangar-${i}.svg`);
  fs.writeFileSync(filepath, svg);
  
  if (i <= 10) {
    console.log(`  ✓ hangar-${i}.svg`);
  }
}
console.log('  ... (20 more)');

// Generate company logos
console.log('\n🏢 Generating company logos (12 images)...');
Object.keys(COMPANY_COLORS).forEach(company => {
  const name = COMPANY_NAMES[company];
  const color = COMPANY_COLORS[company];
  const svg = generateCompanySVG(name, color);
  const filepath = path.join(ASSETS_DIR, 'companies', `${company}.svg`);
  fs.writeFileSync(filepath, svg);
  console.log(`  ✓ ${company}.svg`);
});

// Count files
const avatarCount = fs.readdirSync(path.join(ASSETS_DIR, 'avatars')).length;
const hangarCount = fs.readdirSync(path.join(ASSETS_DIR, 'hangars')).length;
const companyCount = fs.readdirSync(path.join(ASSETS_DIR, 'companies')).length;

console.log('\n✅ Image generation complete!\n');
console.log('📊 Summary:');
console.log(`   Avatars:   ${avatarCount} files`);
console.log(`   Hangars:   ${hangarCount} files`);
console.log(`   Companies: ${companyCount} files`);
console.log('\n🌐 Test in browser:');
console.log('   http://localhost:3000/seed-assets/avatars/carlos-silva.svg');
console.log('   http://localhost:3000/seed-assets/hangars/hangar-1.svg');
console.log('   http://localhost:3000/seed-assets/companies/latam.svg');
console.log('');
