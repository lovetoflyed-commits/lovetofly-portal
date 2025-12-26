#!/usr/bin/env node

/**
 * Generate real PNG images using canvas (Node.js)
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public/e6b/jeppesen');

// 1. Ruler (800x650)
function generateRuler() {
  const canvas = createCanvas(800, 650);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 800, 650);
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, 800, 650);
  
  // Labels
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = '#333';
  ctx.fillText('Low Speed (40-120 kt)', 50, 30);
  ctx.fillText('High Speed (120-240 kt)', 500, 30);
  
  // Low Speed Ruler
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 80);
  ctx.lineTo(100, 620);
  ctx.stroke();
  
  const lowSpeeds = [40, 50, 60, 70, 80, 90, 100, 110, 120];
  lowSpeeds.forEach((speed, i) => {
    const y = 80 + i * 67.5;
    const isMajor = speed % 20 === 0;
    ctx.lineWidth = isMajor ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(85, y);
    ctx.lineTo(115, y);
    ctx.stroke();
    
    ctx.font = isMajor ? 'bold 14px Arial' : '11px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText(String(speed), 45, y + 5);
  });
  
  // High Speed Ruler
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(700, 80);
  ctx.lineTo(700, 620);
  ctx.stroke();
  
  const highSpeeds = [120, 140, 160, 180, 200, 220, 240];
  highSpeeds.forEach((speed, i) => {
    const y = 80 + i * 80;
    const isMajor = (speed - 120) % 40 === 0;
    ctx.lineWidth = isMajor ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(685, y);
    ctx.lineTo(715, y);
    ctx.stroke();
    
    ctx.font = isMajor ? 'bold 14px Arial' : '11px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText(String(speed), 720, y + 5);
  });
  
  ctx.font = '11px Arial';
  ctx.fillStyle = '#999';
  ctx.textAlign = 'center';
  ctx.fillText('Wind Side - Static Ruler', 400, 640);
  
  return canvas.toBuffer('image/png');
}

// 2. Inner Disc (800x650)
function generateInnerDisc() {
  const canvas = createCanvas(800, 650);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 800, 650);
  
  const cx = 400, cy = 325, r = 280;
  
  // Outer circle
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  
  // Cardinal marks (0°, 90°, 180°, 270°)
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  
  // 0°
  ctx.beginPath();
  ctx.moveTo(cx, cy - 280);
  ctx.lineTo(cx, cy - 260);
  ctx.stroke();
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.fillText('0°', cx, cy - 250);
  
  // 90°
  ctx.beginPath();
  ctx.moveTo(cx + 280, cy);
  ctx.lineTo(cx + 260, cy);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillText('90°', cx + 300, cy + 5);
  
  // 180°
  ctx.beginPath();
  ctx.moveTo(cx, cy + 280);
  ctx.lineTo(cx, cy + 260);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillText('180°', cx, cy + 300);
  
  // 270°
  ctx.beginPath();
  ctx.moveTo(cx - 280, cy);
  ctx.lineTo(cx - 260, cy);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillText('270°', cx - 300, cy + 5);
  
  // 10° tick marks
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#999';
  for (let angle = 10; angle < 360; angle += 10) {
    const rad = (angle * Math.PI) / 180;
    const x1 = cx + Math.cos(rad) * 280;
    const y1 = cy + Math.sin(rad) * 280;
    const x2 = cx + Math.cos(rad) * 265;
    const y2 = cy + Math.sin(rad) * 265;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  
  // Center circle
  ctx.fillStyle = '#e8e8e8';
  ctx.beginPath();
  ctx.arc(cx, cy, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.font = 'bold 12px Arial';
  ctx.fillStyle = '#666';
  ctx.textAlign = 'center';
  ctx.fillText('INNER', cx, cy - 5);
  ctx.fillText('DISC', cx, cy + 10);
  
  return canvas.toBuffer('image/png');
}

// 3. Outer Disc (800x650)
function generateOuterDisc() {
  const canvas = createCanvas(800, 650);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 800, 650);
  
  const cx = 400, cy = 325, r = 280;
  
  // Outer rings
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 5, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
  ctx.stroke();
  
  // Decorative circles
  ctx.strokeStyle = '#999';
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1.0;
  
  ctx.font = '12px Arial';
  ctx.fillStyle = '#999';
  ctx.textAlign = 'center';
  ctx.fillText('Outer Ring (Static)', cx, 625);
  
  return canvas.toBuffer('image/png');
}

// 4. Slide (240x650)
function generateSlide() {
  const canvas = createCanvas(240, 650);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 240, 650);
  
  // Semi-transparent blue overlay
  ctx.fillStyle = 'rgba(0, 153, 255, 0.15)';
  ctx.fillRect(0, 0, 240, 650);
  
  // Border
  ctx.strokeStyle = '#0099ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 240, 650);
  
  // Text
  ctx.font = 'bold 13px Arial';
  ctx.fillStyle = '#0099ff';
  ctx.textAlign = 'center';
  ctx.fillText('SLIDE', 120, 30);
  
  ctx.font = '11px Arial';
  ctx.globalAlpha = 0.6;
  ctx.fillText('Optional Overlay', 120, 325);
  ctx.globalAlpha = 1.0;
  
  return canvas.toBuffer('image/png');
}

// Generate all
console.log('\n=== Generating E6B PNG Images ===\n');

fs.writeFileSync(path.join(dir, 'ruler.png'), generateRuler());
console.log('✓ Created: ruler.png');

fs.writeFileSync(path.join(dir, 'inner-disc.png'), generateInnerDisc());
console.log('✓ Created: inner-disc.png');

fs.writeFileSync(path.join(dir, 'outer-disc.png'), generateOuterDisc());
console.log('✓ Created: outer-disc.png');

fs.writeFileSync(path.join(dir, 'slide.png'), generateSlide());
console.log('✓ Created: slide.png');

console.log('\n✓ All PNG images generated successfully!\n');
