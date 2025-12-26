'use client';

import { FlightState } from '@/utils/flightPhysics';
import { useEffect, useRef } from 'react';

interface PFDProps {
  flightState: FlightState;
  navFreq: string;
  navCourse: number; // OBS selected course in degrees
  navDeflection: number; // CDI deflection -1 (full left) to +1 (full right)
  navFlag: 'TO' | 'FROM' | 'OFF';
}

// Helper function to draw instrument frame
function drawInstrumentFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Outer bezel (dark)
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();

  // Inner shadow
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x + 3, y + 3, w - 6, h - 6, 6);
  ctx.stroke();

  // Highlight
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x + 1, y + 1, w - 2, h - 2, 7);
  ctx.stroke();
}

function drawAirspeedIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  state: FlightState
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const radius = Math.min(w, h) / 2 - 15;

  // White face
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Color arcs
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, radius - 8, -Math.PI / 2, -Math.PI / 2 + (10 / 200) * Math.PI * 2);
  ctx.lineTo(cx, cy);
  ctx.fill();

  ctx.fillStyle = '#00aa00';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, radius - 8, -Math.PI / 2 + (10 / 200) * Math.PI * 2, -Math.PI / 2 + (150 / 200) * Math.PI * 2);
  ctx.lineTo(cx, cy);
  ctx.fill();

  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, radius - 8, -Math.PI / 2 + (150 / 200) * Math.PI * 2, -Math.PI / 2 + (200 / 200) * Math.PI * 2);
  ctx.lineTo(cx, cy);
  ctx.fill();

  // Markings
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 200; i += 20) {
    const angle = -Math.PI / 2 + (i / 200) * Math.PI * 2;
    const x1 = cx + Math.cos(angle) * (radius - 12);
    const y1 = cy + Math.sin(angle) * (radius - 12);
    const x2 = cx + Math.cos(angle) * (radius - 3);
    const y2 = cy + Math.sin(angle) * (radius - 3);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    if (i % 40 === 0) {
      const textX = cx + Math.cos(angle) * (radius - 25);
      const textY = cy + Math.sin(angle) * (radius - 25);
      ctx.fillText(i.toString(), textX, textY);
    }
  }

  // Needle
  const needleAngle = -Math.PI / 2 + (state.airspeed / 200) * Math.PI * 2;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(needleAngle) * (radius - 20), cy + Math.sin(needleAngle) * (radius - 20));
  ctx.stroke();

  // Center circle
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('AIRSPEED', cx, y + h - 15);
  ctx.fillText('KT', cx, y + h - 3);
}

function drawAltimeterIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  state: FlightState
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const radius = Math.min(w, h) / 2 - 15;

  // White face
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Markings (0-35,000 ft)
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 35000; i += 5000) {
    const angle = -Math.PI / 2 + (i / 35000) * Math.PI * 2;
    const x1 = cx + Math.cos(angle) * (radius - 12);
    const y1 = cy + Math.sin(angle) * (radius - 12);
    const x2 = cx + Math.cos(angle) * (radius - 3);
    const y2 = cy + Math.sin(angle) * (radius - 3);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    if (i % 10000 === 0) {
      const textX = cx + Math.cos(angle) * (radius - 25);
      const textY = cy + Math.sin(angle) * (radius - 25);
      ctx.fillText((i / 1000).toString(), textX, textY);
    }
  }

  // Needle
  const needleAngle = -Math.PI / 2 + (state.altitude / 35000) * Math.PI * 2;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(needleAngle) * (radius - 20), cy + Math.sin(needleAngle) * (radius - 20));
  ctx.stroke();

  // Center circle
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('ALTIMETER', cx, y + h - 15);
  ctx.fillText('FT', cx, y + h - 3);
}

function drawHeadingIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  state: FlightState,
  navFreq: string,
  navCourse: number,
  navDeflection: number,
  navFlag: 'TO' | 'FROM' | 'OFF'
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const radius = Math.min(w, h) / 2 - 15;

  // White face
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Rotating compass card
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((state.heading * Math.PI) / 180);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < 360; i += 10) {
    const angle = (i * Math.PI) / 180;
    const x1 = Math.cos(angle - Math.PI / 2) * (radius - 12);
    const y1 = Math.sin(angle - Math.PI / 2) * (radius - 12);
    const x2 = Math.cos(angle - Math.PI / 2) * (radius - 3);
    const y2 = Math.sin(angle - Math.PI / 2) * (radius - 3);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = i % 30 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    if (i % 30 === 0) {
      const label = i === 0 ? 'N' : i === 90 ? 'E' : i === 180 ? 'S' : i === 270 ? 'W' : Math.round(i / 10).toString();
      const textX = Math.cos(angle - Math.PI / 2) * (radius - 25);
      const textY = Math.sin(angle - Math.PI / 2) * (radius - 25);
      ctx.fillText(label, textX, textY);
    }
  }

  // Course pointer (magenta) for NAV reference (selected OBS)
  const courseDeg = navCourse;
  const courseAngle = (courseDeg * Math.PI) / 180 - Math.PI / 2;
  const courseRadius = radius - 6;
  ctx.fillStyle = '#ff00ff';
  ctx.beginPath();
  ctx.moveTo(Math.cos(courseAngle) * courseRadius, Math.sin(courseAngle) * courseRadius);
  ctx.lineTo(Math.cos(courseAngle + 0.08) * (courseRadius - 12), Math.sin(courseAngle + 0.08) * (courseRadius - 12));
  ctx.lineTo(Math.cos(courseAngle - 0.08) * (courseRadius - 12), Math.sin(courseAngle - 0.08) * (courseRadius - 12));
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Reference bug (top pointer)
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.moveTo(cx, y + 10);
  ctx.lineTo(cx - 8, y + 20);
  ctx.lineTo(cx + 8, y + 20);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.stroke();

  // VOR frequency/OBS readout (static demo: 113.90 / CRS 090) moved left to avoid N pointer overlap
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('VOR 113.90 | CRS 090', cx - radius + 12, y + 22);

  // CDI deviation bar (magenta) relative to selected course
  const cdiOffset = Math.max(-1, Math.min(1, navDeflection)) * (radius - 35) * 0.5;

  ctx.fillStyle = '#ff00ff';
  ctx.beginPath();
  ctx.roundRect(cx + cdiOffset - 4, cy - 25, 8, 50, 3);
  ctx.fill();

  // TO/FROM flag
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(navFlag, cx, y + h - 30);

  // Label
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('HEADING / NAV', cx, y + h - 15);
  ctx.fillText('DEG | CDI', cx, y + h - 3);
}

function drawVerticalSpeedIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  state: FlightState
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const radius = Math.min(w, h) / 2 - 15;

  // White face
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Markings (-2000 to +2000 fpm)
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = -2000; i <= 2000; i += 500) {
    const angle = (-Math.PI / 2) + ((i + 2000) / 4000) * Math.PI * 2;
    const x1 = cx + Math.cos(angle) * (radius - 12);
    const y1 = cy + Math.sin(angle) * (radius - 12);
    const x2 = cx + Math.cos(angle) * (radius - 3);
    const y2 = cy + Math.sin(angle) * (radius - 3);

    ctx.strokeStyle = i === 0 ? '#ff0000' : '#000000';
    ctx.lineWidth = i === 0 ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    if (i % 1000 === 0) {
      const textX = cx + Math.cos(angle) * (radius - 25);
      const textY = cy + Math.sin(angle) * (radius - 25);
      ctx.fillText((i / 1000).toString(), textX, textY);
    }
  }

  // Needle
  const needleAngle = (-Math.PI / 2) + ((state.verticalSpeed + 2000) / 4000) * Math.PI * 2;
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(needleAngle) * (radius - 20), cy + Math.sin(needleAngle) * (radius - 20));
  ctx.stroke();

  // Center circle
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('VERTICAL SPEED', cx, y + h - 15);
  ctx.fillText('FPM', cx, y + h - 3);
}

function drawArtificialHorizon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  state: FlightState
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const radius = Math.min(w, h) / 2 - 15;

  // White face
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Sky and ground
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  ctx.translate(cx, cy);
  ctx.rotate((state.roll * Math.PI) / 180);

  const pitchOffset = (state.pitch / 90) * (radius / 2);

  // Sky (blue)
  ctx.fillStyle = '#1a5490';
  ctx.beginPath();
  ctx.moveTo(-radius, -radius);
  ctx.lineTo(radius, -radius);
  ctx.lineTo(radius, pitchOffset);
  ctx.lineTo(-radius, pitchOffset);
  ctx.closePath();
  ctx.fill();

  // Ground (brown)
  ctx.fillStyle = '#6b5344';
  ctx.beginPath();
  ctx.moveTo(-radius, pitchOffset);
  ctx.lineTo(radius, pitchOffset);
  ctx.lineTo(radius, radius);
  ctx.lineTo(-radius, radius);
  ctx.closePath();
  ctx.fill();

  // Pitch ladder
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#ffffff';
  ctx.font = '9px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let pitch = -80; pitch <= 80; pitch += 10) {
    const yOffset = (pitch / 90) * (radius / 2);
    const width = 40 - Math.abs(pitch) / 2;

    ctx.beginPath();
    ctx.moveTo(-width, yOffset);
    ctx.lineTo(width, yOffset);
    ctx.stroke();

    if (pitch !== 0 && pitch % 20 === 0) {
      ctx.fillText(Math.abs(pitch).toString(), -width - 15, yOffset);
      ctx.fillText(Math.abs(pitch).toString(), width + 15, yOffset);
    }
  }

  // Horizon line
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-radius, 0);
  ctx.lineTo(radius, 0);
  ctx.stroke();

  ctx.restore();

  // Aircraft symbol (fixed at center)
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy);
  ctx.lineTo(cx - 10, cy);
  ctx.lineTo(cx - 5, cy - 5);
  ctx.lineTo(cx + 5, cy - 5);
  ctx.lineTo(cx + 10, cy);
  ctx.lineTo(cx + 20, cy);
  ctx.stroke();

  ctx.fillRect(cx - 3, cy, 6, 10);

  // Outer circle
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Label
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('ATTITUDE', cx, y + h - 15);
  ctx.fillText('INDICATOR', cx, y + h - 3);
}

function drawTurnCoordinator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  state: FlightState
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const radius = Math.min(w, h) / 2 - 15;

  // White face
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Bank scale (-30 to +30 degrees)
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';
  ctx.font = 'bold 9px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let deg = -30; deg <= 30; deg += 10) {
    const angle = (deg * Math.PI) / 180 - Math.PI / 2;
    const x1 = cx + Math.cos(angle) * (radius - 12);
    const y1 = cy + Math.sin(angle) * (radius - 12);
    const x2 = cx + Math.cos(angle) * (radius - 3);
    const y2 = cy + Math.sin(angle) * (radius - 3);

    ctx.lineWidth = Math.abs(deg) === 30 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    if (deg !== 0) {
      const textX = cx + Math.cos(angle) * (radius - 25);
      const textY = cy + Math.sin(angle) * (radius - 25);
      ctx.fillText(Math.abs(deg).toString(), textX, textY);
    }
  }

  // Aircraft symbol (rotates with roll)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((state.roll * Math.PI) / 180);

  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.moveTo(-12, -8);
  ctx.lineTo(12, -8);
  ctx.lineTo(8, 0);
  ctx.lineTo(12, 8);
  ctx.lineTo(-12, 8);
  ctx.lineTo(-8, 0);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();

  // Outer circle
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Label
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('TURN', cx, y + h - 15);
  ctx.fillText('COORDINATOR', cx, y + h - 3);
}

const PFD = ({ flightState, navFreq, navCourse, navDeflection, navFlag }: PFDProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with panel color (Cessna beige)
    ctx.fillStyle = '#c9a961';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw panel frame
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    // Draw 6-pack layout (3 top row, 3 bottom row)
    const padding = 20;
    const instrumentW = (canvas.width - padding * 4) / 3;
    const instrumentH = (canvas.height - padding * 3) / 2;
    const topY = padding;
    const bottomY = padding * 2 + instrumentH;

    // Top Row - Airspeed, Attitude, Altimeter
    drawInstrumentFrame(ctx, padding, topY, instrumentW, instrumentH);
    drawAirspeedIndicator(ctx, padding, topY, instrumentW, instrumentH, flightState);

    drawInstrumentFrame(ctx, padding * 2 + instrumentW, topY, instrumentW, instrumentH);
    drawArtificialHorizon(ctx, padding * 2 + instrumentW, topY, instrumentW, instrumentH, flightState);

    drawInstrumentFrame(ctx, padding * 3 + instrumentW * 2, topY, instrumentW, instrumentH);
    drawAltimeterIndicator(ctx, padding * 3 + instrumentW * 2, topY, instrumentW, instrumentH, flightState);

    // Bottom Row - VSI, Heading, Turn Coordinator
    drawInstrumentFrame(ctx, padding, bottomY, instrumentW, instrumentH);
    drawVerticalSpeedIndicator(ctx, padding, bottomY, instrumentW, instrumentH, flightState);

    drawInstrumentFrame(ctx, padding * 2 + instrumentW, bottomY, instrumentW, instrumentH);
    drawHeadingIndicator(
      ctx,
      padding * 2 + instrumentW,
      bottomY,
      instrumentW,
      instrumentH,
      flightState,
      navFreq,
      navCourse,
      navDeflection,
      navFlag
    );

    drawInstrumentFrame(ctx, padding * 3 + instrumentW * 2, bottomY, instrumentW, instrumentH);
    drawTurnCoordinator(ctx, padding * 3 + instrumentW * 2, bottomY, instrumentW, instrumentH, flightState);

  }, [flightState]);

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={600}
      className="w-full"
      style={{ maxHeight: '100%', objectFit: 'contain' }}
    />
  );
};

export default PFD;
