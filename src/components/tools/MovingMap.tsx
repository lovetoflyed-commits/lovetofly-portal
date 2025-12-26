'use client';

import { FlightState } from '@/utils/flightPhysics';
import { useEffect, useRef } from 'react';

interface MovingMapProps {
  flightState: FlightState;
  trackHistory: Array<{ lat: number; lon: number; alt: number }>;
}

// Simple procedural terrain noise
function noise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function perlinNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const n00 = noise(xi, yi);
  const n10 = noise(xi + 1, yi);
  const n01 = noise(xi, yi + 1);
  const n11 = noise(xi + 1, yi + 1);

  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);

  const nx0 = n00 * (1 - u) + n10 * u;
  const nx1 = n01 * (1 - u) + n11 * u;
  return nx0 * (1 - v) + nx1 * v;
}

function getTerrainAltitude(lat: number, lon: number): number {
  const scale = 0.01;
  let alt = 0;
  let amp = 1;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    alt += perlinNoise(lat * scale * freq, lon * scale * freq) * amp;
    amp *= 0.5;
    freq *= 2;
  }
  return alt * 5000; // Scale to feet
}

function getTerrainColor(alt: number): string {
  if (alt < 500) return '#1a5f2f';
  if (alt < 1500) return '#228b22';
  if (alt < 3000) return '#8b7355';
  if (alt < 5000) return '#a0826d';
  return '#b0a0a0';
}

const MovingMap = ({ flightState, trackHistory }: MovingMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mapHeight = canvas.height - 80; // Reserve 80px for altitude profile
    const profileHeight = 80;
    const profileY = mapHeight;

    // Clear with sky blue
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, canvas.width, mapHeight);

    // Profile background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, profileY, canvas.width, profileHeight);

    const centerX = canvas.width / 2;
    const centerY = mapHeight / 2;
    const scale = 0.05; // pixels per degree

    // Draw terrain grid
    const gridSize = 20; // degrees
    for (let lat = -gridSize; lat <= gridSize; lat += 2) {
      for (let lon = -gridSize; lon <= gridSize; lon += 2) {
        const mapLat = flightState.latitude + lat;
        const mapLon = flightState.longitude + lon;
        const alt = getTerrainAltitude(mapLat, mapLon);
        const color = getTerrainColor(alt);

        const x = centerX + lon * scale;
        const y = centerY - lat * scale;

        if (y > 0 && y < mapHeight) {
          ctx.fillStyle = color;
          ctx.fillRect(x - 8, y - 8, 16, 16);

          // Border for depth
          ctx.strokeStyle = 'rgba(0,0,0,0.1)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x - 8, y - 8, 16, 16);
        }
      }
    }

    // Draw track history (magenta line with glow)
    if (trackHistory.length > 1) {
      // Glow effect
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      let firstPoint = true;
      for (const point of trackHistory) {
        const x = centerX + (point.lon - flightState.longitude) * scale;
        const y = centerY - (point.lat - flightState.latitude) * scale;

        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Bright magenta line
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      firstPoint = true;
      for (const point of trackHistory) {
        const x = centerX + (point.lon - flightState.longitude) * scale;
        const y = centerY - (point.lat - flightState.latitude) * scale;

        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Draw track points (larger, brighter)
    ctx.fillStyle = '#ffff00';
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 2;
    for (let i = 0; i < trackHistory.length; i += Math.max(1, Math.floor(trackHistory.length / 20))) {
      const point = trackHistory[i];
      const x = centerX + (point.lon - flightState.longitude) * scale;
      const y = centerY - (point.lat - flightState.latitude) * scale;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Draw aircraft symbol (triangle pointing to heading) - follows the track trail
    const headingRad = (flightState.heading * Math.PI) / 180;
    // Aircraft position relative to current viewpoint (center of map)
    const aircraftX = centerX; // Always at center horizontally
    const aircraftY = centerY; // Always at center vertically
    
    ctx.save();
    ctx.translate(aircraftX, aircraftY);
    ctx.rotate(headingRad);

    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-8, 12);
    ctx.lineTo(8, 12);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Draw compass rose in corner
    const compassX = 50;
    const compassY = 50;
    const compassR = 30;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(compassX, compassY, compassR, 0, Math.PI * 2);
    ctx.stroke();

    // Cardinal directions
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', compassX, compassY - compassR - 5);
    ctx.fillText('S', compassX, compassY + compassR + 5);
    ctx.fillText('E', compassX + compassR + 5, compassY);
    ctx.fillText('W', compassX - compassR - 5, compassY);

    // Current heading indicator
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    const headingDeg = flightState.heading;
    const headingRad2 = (headingDeg * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(compassX, compassY);
    ctx.lineTo(
      compassX + Math.sin(headingRad2) * (compassR - 5),
      compassY - Math.cos(headingRad2) * (compassR - 5)
    );
    ctx.stroke();

    // Draw altitude profile at bottom
    if (trackHistory.length > 1) {
      const profileHeight = 80;
      const profileY = mapHeight;
      const profileWidth = canvas.width - 60;
      const profileX = 30;
      
      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = profileY + (profileHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(profileX, y);
        ctx.lineTo(profileX + profileWidth, y);
        ctx.stroke();
      }

      // Find min/max altitude in track history
      let minAlt = Math.min(...trackHistory.map(p => p.alt));
      let maxAlt = Math.max(...trackHistory.map(p => p.alt));
      const altRange = Math.max(maxAlt - minAlt, 1000); // Minimum 1000 ft range

      // Draw altitude profile line
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      
      let firstProfile = true;
      for (let i = 0; i < trackHistory.length; i++) {
        const point = trackHistory[i];
        const x = profileX + (i / trackHistory.length) * profileWidth;
        const altNorm = (point.alt - minAlt) / altRange;
        const y = profileY + profileHeight - (altNorm * profileHeight);

        if (firstProfile) {
          ctx.moveTo(x, y);
          firstProfile = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Fill area under profile
      ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
      ctx.lineTo(profileX + profileWidth, profileY + profileHeight);
      ctx.lineTo(profileX, profileY + profileHeight);
      ctx.closePath();
      ctx.fill();

      // Current altitude marker
      if (trackHistory.length > 0) {
        const lastAlt = trackHistory[trackHistory.length - 1].alt;
        const altNorm = (lastAlt - minAlt) / altRange;
        const markerX = profileX + profileWidth;
        const markerY = profileY + profileHeight - (altNorm * profileHeight);

        // Vertical line
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(markerX, profileY);
        ctx.lineTo(markerX, profileY + profileHeight);
        ctx.stroke();

        // Circle marker
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Altitude labels
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(maxAlt)} ft`, profileX - 5, profileY);
      ctx.fillText(`${Math.round(minAlt)} ft`, profileX - 5, profileY + profileHeight);
      
      // Distance/time label
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Altitude Profile', profileX + profileWidth / 2, profileY + profileHeight + 12);
    }

    // Draw altitude and speed overlay
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(canvas.width - 150, 10, 140, 60);

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`ALT: ${Math.round(flightState.altitude)} ft`, canvas.width - 140, 15);
    ctx.fillText(`SPD: ${Math.round(flightState.airspeed)} kt`, canvas.width - 140, 30);
    ctx.fillText(`HDG: ${Math.round(flightState.heading)}°`, canvas.width - 140, 45);
  }, [flightState, trackHistory]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={680}
      className="w-full h-full"
      style={{ objectFit: 'contain' }}
    />
  );
};

export default MovingMap;
