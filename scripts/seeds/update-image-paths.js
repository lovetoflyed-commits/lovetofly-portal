#!/usr/bin/env node
/**
 * Update seed files to use local image paths instead of external URLs
 */

const fs = require('fs');
const path = require('path');

const SEEDS_DIR = path.join(__dirname);

console.log('🔄 Updating seed files to use local image assets...\n');

// Map of external URL patterns to local paths
const imageReplacements = {
  // User avatars
  "https://ui-avatars.com/api/?name=Admin+Sistema&background=0D8ABC&color=fff": "/seed-assets/avatars/admin.svg",
  "https://ui-avatars.com/api/?name=Carlos+Silva&background=1976d2&color=fff": "/seed-assets/avatars/carlos-silva.svg",
  "https://ui-avatars.com/api/?name=Maria+Santos&background=7b1fa2&color=fff": "/seed-assets/avatars/maria-santos.svg",
  "https://ui-avatars.com/api/?name=Joao+Oliveira&background=388e3c&color=fff": "/seed-assets/avatars/joao-oliveira.svg",
  "https://ui-avatars.com/api/?name=Roberto+Costa&background=f57c00&color=fff": "/seed-assets/avatars/roberto-costa.svg",
  "https://ui-avatars.com/api/?name=Ana+Ferreira&background=c2185b&color=fff": "/seed-assets/avatars/ana-ferreira.svg",
  "https://ui-avatars.com/api/?name=Paulo+Martins&background=455a64&color=fff": "/seed-assets/avatars/paulo-martins.svg",
  "https://ui-avatars.com/api/?name=Lucas+Almeida&background=0097a7&color=fff": "/seed-assets/avatars/lucas-almeida.svg",
  "https://ui-avatars.com/api/?name=Fernanda+Lima&background=5e35b1&color=fff": "/seed-assets/avatars/fernanda-lima.svg",
  "https://ui-avatars.com/api/?name=Juliana+Rocha&background=00796b&color=fff": "/seed-assets/avatars/juliana-rocha.svg",
  "https://ui-avatars.com/api/?name=Ricardo+Mendes&background=c62828&color=fff": "/seed-assets/avatars/ricardo-mendes.svg",
  "https://ui-avatars.com/api/?name=Patricia+Gomes&background=6a1b9a&color=fff": "/seed-assets/avatars/patricia-gomes.svg",
  "https://ui-avatars.com/api/?name=Gustavo+Barbosa&background=1565c0&color=fff": "/seed-assets/avatars/gustavo-barbosa.svg",
  "https://ui-avatars.com/api/?name=Michael+Johnson&background=2e7d32&color=fff": "/seed-assets/avatars/michael-johnson.svg",
  "https://ui-avatars.com/api/?name=Sofia+Rodriguez&background=d84315&color=fff": "/seed-assets/avatars/sofia-rodriguez.svg",
};

// Company logos
const companyReplacements = {
  "https://ui-avatars.com/api/?name=Executive+Jets&background=1a237e&color=fff&size=200": "/seed-assets/companies/executive-jets.svg",
  "https://ui-avatars.com/api/?name=Helibras&background=d32f2f&color=fff&size=200": "/seed-assets/companies/helibras.svg",
  "https://ui-avatars.com/api/?name=AeroClube+SP&background=388e3c&color=fff&size=200": "/seed-assets/companies/aeroclube-sp.svg",
  "https://ui-avatars.com/api/?name=TAM+Executiva&background=e53935&color=fff&size=200": "/seed-assets/companies/tam-executiva.svg",
  "https://ui-avatars.com/api/?name=VASP+MRO&background=ff6f00&color=fff&size=200": "/seed-assets/companies/vasp-manutencao.svg",
  "https://ui-avatars.com/api/?name=Embraer&background=0277bd&color=fff&size=200": "/seed-assets/companies/embraer.svg",
  "https://ui-avatars.com/api/?name=SkyDive+BR&background=43a047&color=fff&size=200": "/seed-assets/companies/skydive.svg",
  "https://ui-avatars.com/api/?name=Helisul&background=6a1b9a&color=fff&size=200": "/seed-assets/companies/helisul.svg",
  "https://ui-avatars.com/api/?name=Aeromot&background=00838f&color=fff&size=200": "/seed-assets/companies/aeromot.svg",
};

// Hangar photos - map unsplash URLs to local hangar images
const hangarReplacements = {};
let hangarCounter = 1;
const unsplashPatterns = [
  /https:\/\/images\.unsplash\.com\/photo-[0-9]+\?w=800/g,
  /https:\/\/images\.unsplash\.com\/photo-[\w-]+\?w=800/g
];

// Files to update
const filesToUpdate = [
  '001_seed_users.sql',
  '003_seed_companies.sql',
  '006_seed_hangar_listings.sql'
];

filesToUpdate.forEach(filename => {
  const filepath = path.join(SEEDS_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  Skipping ${filename} (not found)`);
    return;
  }
  
  let content = fs.readFileSync(filepath, 'utf8');
  let changes = 0;
  
  // Replace user avatars
  Object.keys(imageReplacements).forEach(oldUrl => {
    const newPath = imageReplacements[oldUrl];
    const regex = new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, newPath);
      changes += matches.length;
    }
  });
  
  // Replace company logos
  Object.keys(companyReplacements).forEach(oldUrl => {
    const newPath = companyReplacements[oldUrl];
    const regex = new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, newPath);
      changes += matches.length;
    }
  });
  
  // Replace hangar photos (unsplash URLs)
  unsplashPatterns.forEach(pattern => {
    content = content.replace(pattern, (match) => {
      const localPath = `/seed-assets/hangars/hangar-${hangarCounter}.svg`;
      hangarCounter++;
      if (hangarCounter > 30) hangarCounter = 1; // Reset after 30
      return localPath;
    });
  });
  
  // Write updated content back
  fs.writeFileSync(filepath, content, 'utf8');
  
  console.log(`✅ Updated ${filename} (${changes} replacements)`);
});

console.log('\n✅ All seed files updated to use local assets!');
console.log('\n📝 Next steps:');
console.log('   1. Run: npm run seed:dev');
console.log('   2. Test images in browser at http://localhost:3000');
console.log('');
