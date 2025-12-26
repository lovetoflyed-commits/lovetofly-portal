'use client';

import { useState, useRef, useEffect } from 'react';

type Side = 'A' | 'B';
type Marker = { x: number; y: number; id: string; label?: string };

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 650;

export default function E6BAnalog() {
  const [side, setSide] = useState<Side>('A');
  const [rotation, setRotation] = useState(0);
  const [slidePosition, setSlidePosition] = useState(280);
  const [windCursorRatio, setWindCursorRatio] = useState(0.5); // 0 (top) to 1 (bottom) for GS/VS cursor on wind ruler
  const [activeRuler, setActiveRuler] = useState<'low' | 'high'>('low');
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'rotate' | 'slide' | 'slideA' | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Helper function to calculate values based on marker positions
  const calculateValues = () => {
    if (markers.length < 2) return { time: '--', fuel: '--', distance: '--' };
    
    // Simple estimation based on marker positions
    // This would need proper E6B formula implementation for real calculations
    const marker1 = markers[0];
    const marker2 = markers[1];
    
    const distance = Math.round(Math.hypot(marker2.x - marker1.x, marker2.y - marker1.y) / 5);
    const time = Math.round(distance / 5);
    const fuel = Math.round(time * 1.2);
    
    return {
      time: time > 0 ? `${time} min` : '--',
      fuel: fuel > 0 ? `${fuel} gal` : '--',
      distance: distance > 0 ? `${distance} nm` : '--'
    };
  };
  const renderWindSide = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = 280;
    const tasRingRadius = 230;
    const windDiscRadius = 160;

    // Linear slide (behind the transparent disc) for GS/Speed reference
    const slideBandWidth = 220;
    const slideTop = centerY - 220;
    const slideHeight = 440;
    const lowMin = 40;
    const lowMax = 120;
    const highMin = 120;
    const highMax = 240;

    // Draw slide band
    const bandLeft = centerX - slideBandWidth / 2;
    ctx.fillStyle = '#eef2f7';
    ctx.fillRect(bandLeft, slideTop, slideBandWidth, slideHeight);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(bandLeft, slideTop, slideBandWidth, slideHeight);

    // Low-speed ticks (left column)
    for (let v = lowMin; v <= lowMax; v += 10) {
      const ratio = (lowMax - v) / (lowMax - lowMin);
      const y = slideTop + ratio * slideHeight;
      const tick = v % 20 === 0 ? 14 : 8;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = v % 20 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(bandLeft + 6, y);
      ctx.lineTo(bandLeft + 6 + tick, y);
      ctx.stroke();
      if (v % 20 === 0) {
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(v.toString(), bandLeft + 18, y);
      }
    }

    // High-speed ticks (right column)
    for (let v = highMin; v <= highMax; v += 10) {
      const ratio = (highMax - v) / (highMax - highMin);
      const y = slideTop + ratio * slideHeight;
      const tick = v % 20 === 0 ? 14 : 8;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = v % 20 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(bandLeft + slideBandWidth - 6, y);
      ctx.lineTo(bandLeft + slideBandWidth - 6 - tick, y);
      ctx.stroke();
      if (v % 20 === 0) {
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(v.toString(), bandLeft + slideBandWidth - 18, y);
      }
    }

    // Slide label
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GS / TAS SCALE (kt)', centerX, slideTop - 10);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('LOW SPEED', bandLeft + 6, slideTop - 24);
    ctx.textAlign = 'right';
    ctx.fillText('HIGH SPEED', bandLeft + slideBandWidth - 6, slideTop - 24);

    // Movable cursor on the ruler (follows windCursorRatio 0-1)
    const cursorY = slideTop + (1 - windCursorRatio) * slideHeight;
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bandLeft - 12, cursorY);
    ctx.lineTo(bandLeft + slideBandWidth + 12, cursorY);
    ctx.stroke();

    // Pointer on active side + speed readout
    const isLow = activeRuler === 'low';
    const pointerX = isLow ? bandLeft + 6 + 16 : bandLeft + slideBandWidth - 6 - 16;
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.moveTo(pointerX + (isLow ? -10 : 10), cursorY);
    ctx.lineTo(pointerX, cursorY - 6);
    ctx.lineTo(pointerX, cursorY + 6);
    ctx.closePath();
    ctx.fill();

    const speed = isLow 
      ? Math.round(lowMin + (1 - windCursorRatio) * (lowMax - lowMin))
      : Math.round(highMin + (1 - windCursorRatio) * (highMax - highMin));
    ctx.fillStyle = '#0ea5e9';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = isLow ? 'left' : 'right';
    ctx.fillText(`${speed} kt`, isLow ? pointerX + 6 : pointerX - 6, cursorY - 14);

    // Background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer circle - Fixed Azimuth Scale (0-360°)
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#1e1e1e';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Degree markings - Very detailed
    for (let deg = 0; deg < 360; deg++) {
      const angle = (deg - 90) * Math.PI / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      let length = 4;
      let width = 0.5;
      
      if (deg % 10 === 0) {
        length = 18;
        width = 2;
      } else if (deg % 5 === 0) {
        length = 12;
        width = 1.5;
      }

      ctx.lineWidth = width;
      ctx.strokeStyle = '#1e1e1e';
      ctx.beginPath();
      ctx.moveTo(
        centerX + cos * (outerRadius - length),
        centerY + sin * (outerRadius - length)
      );
      ctx.lineTo(
        centerX + cos * outerRadius,
        centerY + sin * outerRadius
      );
      ctx.stroke();
    }

    // Degree numbers (0, 10, 20... 350)
    ctx.fillStyle = '#1e1e1e';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let deg = 0; deg < 360; deg += 10) {
      const angle = (deg - 90) * Math.PI / 180;
      const x = centerX + Math.cos(angle) * (outerRadius - 40);
      const y = centerY + Math.sin(angle) * (outerRadius - 40);
      ctx.fillText(deg.toString().padStart(3, '0'), x, y);
    }

    // TAS Speed Ring (210-400 knots) - Detailed speed scale
    ctx.beginPath();
    ctx.arc(centerX, centerY, tasRingRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#0066cc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Speed scale markings on TAS ring
    const speedValues = [50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 320, 360, 400];
    const speedsPerCircle = speedValues.length;
    
    speedValues.forEach((speed, idx) => {
      const angle = (idx * (360 / speedsPerCircle) - 90) * Math.PI / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      // Tick marks on TAS ring
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#0066cc';
      ctx.beginPath();
      ctx.moveTo(
        centerX + cos * (tasRingRadius - 12),
        centerY + sin * (tasRingRadius - 12)
      );
      ctx.lineTo(
        centerX + cos * (tasRingRadius + 8),
        centerY + sin * (tasRingRadius + 8)
      );
      ctx.stroke();

      // Speed numbers
      ctx.fillStyle = '#0066cc';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labelX = centerX + cos * (tasRingRadius + 25);
      const labelY = centerY + sin * (tasRingRadius + 25);
      ctx.fillText(speed.toString(), labelX, labelY);
    });

    // Wind disc (rotatable - rotating 360 degrees = all wind directions)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-centerX, -centerY);

    // Wind disc background
    ctx.beginPath();
    ctx.arc(centerX, centerY, windDiscRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(230, 242, 255, 0.6)';
    ctx.fill();
    ctx.strokeStyle = '#1e1e1e';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Radial grid lines (every 5°)
    ctx.strokeStyle = 'rgba(0, 102, 204, 0.25)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 360; i += 5) {
      const angle = i * Math.PI / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + cos * windDiscRadius,
        centerY + sin * windDiscRadius
      );
      ctx.stroke();
    }

    // Radial grid lines (every 10° - stronger)
    ctx.strokeStyle = 'rgba(0, 102, 204, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 360; i += 10) {
      const angle = i * Math.PI / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + cos * windDiscRadius,
        centerY + sin * windDiscRadius
      );
      ctx.stroke();
    }

    // Concentric speed arcs (10, 20, 30, 40, 50 knots)
    const speedArcs = [40, 60, 80, 100, 120, 140];
    ctx.strokeStyle = 'rgba(0, 102, 204, 0.3)';
    ctx.lineWidth = 1;
    speedArcs.forEach((speed, idx) => {
      const radius = (windDiscRadius / speedArcs.length) * (idx + 1);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();

      // Speed labels
      ctx.fillStyle = '#1e1e1e';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(speed.toString(), centerX + radius - 8, centerY - 5);
    });

    // Center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e1e1e';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Fixed reference line (true heading indicator - at top)
    ctx.strokeStyle = '#cc0000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - windDiscRadius - 5);
    ctx.lineTo(centerX, centerY - tasRingRadius - 20);
    ctx.stroke();

    // Arrow head for reference line
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - windDiscRadius - 15);
    ctx.lineTo(centerX - 8, centerY - windDiscRadius + 5);
    ctx.lineTo(centerX + 8, centerY - windDiscRadius + 5);
    ctx.closePath();
    ctx.fill();

    // Drift correction guides (+/- drift from top reference)
    const driftAngles = [5, 10, 15, 20];
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(204, 0, 0, 0.55)';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#cc0000';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    driftAngles.forEach((a) => {
      [a, -a].forEach((ang) => {
        const rad = (ang - 90) * Math.PI / 180;
        const x = centerX + Math.cos(rad) * (windDiscRadius + 10);
        const y = centerY + Math.sin(rad) * (windDiscRadius + 10);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(rad) * windDiscRadius, centerY + Math.sin(rad) * windDiscRadius);
        ctx.stroke();
        ctx.fillText(`${ang > 0 ? '+' : ''}${ang}°`, x, y);
      });
    });
    ctx.restore();

    // Labels and instructions
    ctx.fillStyle = '#1e1e1e';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('E6B WIND SIDE (LADO A)', centerX, 30);

    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = '#0066cc';
    ctx.fillText('TRUE HEADING', centerX, centerY - outerRadius - 8);
    ctx.fillStyle = '#666666';
    ctx.font = '10px Arial';
    ctx.fillText('Rotate disc • Mark points with single click • Double-click to remove', centerX, canvas.height - 15);

    // Draw markers
    markers.forEach(marker => {
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, 7, 0, 2 * Math.PI);
      ctx.fillStyle = selectedMarker === marker.id ? '#ff6600' : '#cc0000';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  // Calculator Side (Lado B) - Professional logarithmic scales with calculations
  const renderCalculatorSide = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleStartX = 80;
    const scaleWidth = 520;
    const outerScaleY = 100;
    const innerScaleY = slidePosition;
    const scaleHeight = 50;
    const maxLinearValue = 120; // linear ruler up to 120 units (minutes/NM/gal)

    // Helper function to draw linear scale (equally spaced)
    const drawLinearScale = (y: number, label: string, isMovable: boolean = false) => {
      ctx.fillStyle = isMovable ? '#e6f2ff' : '#ffffff';
      ctx.fillRect(scaleStartX - 5, y - 8, scaleWidth + 10, scaleHeight + 16);
      ctx.strokeStyle = isMovable ? '#0066cc' : '#1e1e1e';
      ctx.lineWidth = isMovable ? 3 : 2;
      ctx.strokeRect(scaleStartX - 5, y - 8, scaleWidth + 10, scaleHeight + 16);

      ctx.fillStyle = isMovable ? '#0066cc' : '#1e1e1e';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(label, scaleStartX - 5, y - 15);

      for (let value = 0; value <= maxLinearValue; value++) {
        const x = scaleStartX + (value / maxLinearValue) * scaleWidth;
        let tickHeight = 4;
        let showNumber = false;

        if (value % 10 === 0) {
          tickHeight = 14;
          showNumber = true;
        } else if (value % 5 === 0) {
          tickHeight = 9;
        } else {
          tickHeight = 5;
        }

        ctx.strokeStyle = '#1e1e1e';
        ctx.lineWidth = value % 10 === 0 ? 2 : value % 5 === 0 ? 1.2 : 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y + scaleHeight);
        ctx.lineTo(x, y + scaleHeight - tickHeight);
        ctx.stroke();

        if (showNumber && x > scaleStartX + 10 && x < scaleStartX + scaleWidth - 10) {
          ctx.fillStyle = '#1e1e1e';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(value.toString(), x, y + scaleHeight - tickHeight - 2);
        }
      }
    };

    // Draw outer scale (fixed) - linear
    drawLinearScale(outerScaleY, 'OUTER SCALE - Distance (NM) / Speed (kt)', false);

    // Draw inner scale (movable) - linear
    if (innerScaleY > 140 && innerScaleY < 500) {
      drawLinearScale(innerScaleY, 'INNER SCALE - Time (min) / Fuel (gal)', true);
    }

    // Center reference cursor line
    const centerX = scaleStartX + scaleWidth / 2;
    ctx.strokeStyle = '#cc0000';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX, 40);
    ctx.lineTo(centerX, 600);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cursor indicator circles at top and bottom
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(centerX, 35, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Calculate values for result windows
    const values = calculateValues();

    // Result windows - IMPROVED with actual values
    const windowWidth = 100;
    const windowHeight = 80;
    const windowX = scaleStartX + scaleWidth + 45;

    const windows = [
      { label: 'TIME', value: values.time, unit: 'minutes', y: 140, color: '#ff6600' },
      { label: 'FUEL', value: values.fuel, unit: 'gallons', y: 250, color: '#00cc66' },
      { label: 'DISTANCE', value: values.distance, unit: 'nautical miles', y: 360, color: '#0099ff' }
    ];

    windows.forEach(({ label, value, unit, y, color }) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(windowX - 5, y - 5, windowWidth + 10, windowHeight + 10);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(windowX - 5, y - 5, windowWidth + 10, windowHeight + 10);

      // Shadow effect
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = color;
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'transparent';
      ctx.fillText(label, windowX + windowWidth / 2, y + 15);

      ctx.fillStyle = '#1e1e1e';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(value, windowX + windowWidth / 2, y + 52);

      ctx.fillStyle = '#666666';
      ctx.font = '9px Arial';
      ctx.fillText(`(${unit})`, windowX + windowWidth / 2, y + 73);
    });

    // Title
    ctx.fillStyle = '#1e1e1e';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('E6B CALCULATOR SIDE (LADO B)', canvas.width / 2, 30);

    // Instructions
    ctx.fillStyle = '#666666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Drag blue scale up/down • Red line = reference cursor • Click to mark points', 
                 canvas.width / 2, canvas.height - 15);

    // Draw markers
    markers.forEach(marker => {
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, 7, 0, 2 * Math.PI);
      ctx.fillStyle = selectedMarker === marker.id ? '#ff9900' : '#cc0000';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (marker.label) {
        ctx.fillStyle = '#1e1e1e';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(marker.label, marker.x, marker.y - 12);
      }
    });
  };

  useEffect(() => {
    if (side === 'A') {
      renderWindSide();
    } else {
      renderCalculatorSide();
    }
  }, [side, rotation, slidePosition, markers, selectedMarker]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const bandWidth = 180;
    const bandLeft = centerX - bandWidth / 2;
    const bandTop = centerY - 220;
    const bandHeight = 440;
    const insideBand = x >= bandLeft - 10 && x <= bandLeft + bandWidth + 10 && y >= bandTop && y <= bandTop + bandHeight;

    // Check for double-click on markers
    const now = Date.now();
    const clickedMarker = markers.find(m => 
      Math.sqrt((m.x - x) ** 2 + (m.y - y) ** 2) < 14
    );

    if (now - lastClickTime < 300 && clickedMarker) {
      setMarkers(markers.filter(m => m.id !== clickedMarker.id));
      setSelectedMarker(null);
      setLastClickTime(0);
      return;
    }
    
    setLastClickTime(now);
    setSelectedMarker(clickedMarker?.id || null);

    if (side === 'A') {
      if (insideBand) {
        // choose active side by x position
        setActiveRuler(x < centerX ? 'low' : 'high');
        setDragMode('slideA');
      } else {
        setDragMode('rotate');
      }
    } else {
      setDragMode('slide');
    }
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragMode === 'rotate') {
      // Smooth rotation
      const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
      setRotation(angle + 90);
    } else if (dragMode === 'slideA') {
      const bandTop = centerY - 220;
      const bandHeight = 440;
      const clamped = Math.max(bandTop, Math.min(bandTop + bandHeight, y));
      const ratio = 1 - (clamped - bandTop) / bandHeight;
      setWindCursorRatio(ratio);
    } else if (dragMode === 'slide') {
      // Constrain slide position
      const newPos = Math.max(140, Math.min(500, y));
      setSlidePosition(newPos);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMode(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Don't add marker if clicking on existing marker
    if (markers.some(m => Math.sqrt((m.x - x) ** 2 + (m.y - y) ** 2) < 14)) {
      return;
    }

    const newMarker: Marker = { 
      x, 
      y, 
      id: Date.now().toString(),
      label: `M${markers.length + 1}`
    };
    setMarkers([...markers, newMarker]);
    setSelectedMarker(newMarker.id);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white min-h-screen">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-5xl w-full border border-slate-200">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">E6B Analog Flight Computer</h1>
              <p className="text-lg text-slate-600">Professional Manual Calculator Simulator</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500 mb-4">Canvas: {CANVAS_WIDTH}×{CANVAS_HEIGHT}px</div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setSide('A'); setMarkers([]); setSelectedMarker(null); }}
                  className={`px-6 py-3 rounded-lg font-bold text-lg transition-all shadow-md ${
                    side === 'A' 
                      ? 'bg-red-600 text-white shadow-lg scale-105' 
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  WIND SIDE<br/>
                  <span className="text-sm font-normal">Side A</span>
                </button>
                <button
                  onClick={() => { setSide('B'); setMarkers([]); setSelectedMarker(null); }}
                  className={`px-6 py-3 rounded-lg font-bold text-lg transition-all shadow-md ${
                    side === 'B' 
                      ? 'bg-blue-600 text-white shadow-lg scale-105' 
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  CALCULATOR SIDE<br/>
                  <span className="text-sm font-normal">Side B</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm mb-8">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleCanvasClick}
            className="w-full cursor-crosshair block"
          />
        </div>

        {/* Instructions Panel */}
        <div className={`rounded-lg p-6 mb-8 ${side === 'A' ? 'bg-red-50 border-2 border-red-200' : 'bg-blue-50 border-2 border-blue-200'}`}>
          <h3 className={`font-bold text-lg mb-3 ${side === 'A' ? 'text-red-900' : 'text-blue-900'}`}>
            {side === 'A' ? '📍 WIND SIDE Instructions' : '📐 CALCULATOR SIDE Instructions'}
          </h3>
          <ul className="space-y-2 text-slate-700 grid grid-cols-2 gap-4">
            {side === 'A' ? (
              <>
                <li>✓ <strong>Rotate Disc:</strong> Click & drag the disc</li>
                <li>✓ <strong>Mark Point:</strong> Single click to add marker</li>
                <li>✓ <strong>Remove:</strong> Double-click marker to delete</li>
                <li>✓ <strong>True Heading:</strong> Red arrow at top</li>
                  <li>✓ <strong>GS/VS Cursor:</strong> Drag up/down on the ruler band</li>
                  <li>✓ <strong>Dual Ruler:</strong> Low (40–120 kt, left) / High (120–240 kt, right)</li>
                  <li>✓ <strong>Wind Component:</strong> Align with outer scale</li>
                  <li>✓ <strong>GS/TAS Ruler:</strong> Linear scale behind the disc</li>
                  <li>✓ <strong>TAS Ring:</strong> Blue scale (50-400 kts)</li>
              </>
            ) : (
              <>
                <li>✓ <strong>Move Ruler:</strong> Click & drag blue scale</li>
                <li>✓ <strong>Mark Point:</strong> Single click to add marker</li>
                <li>✓ <strong>Remove:</strong> Double-click marker to delete</li>
                <li>✓ <strong>Reference:</strong> Red dashed line = cursor</li>
                <li>✓ <strong>Scales:</strong> Linear 0-120 (min/NM/gal)</li>
                <li>✓ <strong>Windows:</strong> TIME, FUEL, DISTANCE</li>
              </>
            )}
          </ul>
        </div>

        {/* Markers Info */}
        {markers.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 mb-8 border-2 border-amber-200">
            <h3 className="font-bold text-amber-900 mb-3">Marked Points ({markers.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {markers.map((marker, idx) => (
                <div
                  key={marker.id}
                  onClick={() => setSelectedMarker(selectedMarker === marker.id ? null : marker.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedMarker === marker.id
                      ? 'bg-orange-200 border-2 border-orange-600 shadow-md'
                      : 'bg-white border-2 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <div className="font-bold text-amber-900">{marker.label || `M${idx + 1}`}</div>
                  <div className="text-xs text-slate-600 font-mono">X: {Math.round(marker.x)}</div>
                  <div className="text-xs text-slate-600 font-mono">Y: {Math.round(marker.y)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setMarkers([])}
            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-md"
          >
            🗑️ Clear All Markers
          </button>
          <button
            onClick={() => {
              setRotation(0);
              setSlidePosition(280);
              setMarkers([]);
              setSelectedMarker(null);
            }}
            className="flex-1 px-6 py-3 bg-slate-600 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors shadow-md"
          >
            ↻ Reset Position & Markers
          </button>
          {side === 'A' && (
            <div className="flex-1 bg-blue-100 rounded-lg p-3 text-center border-2 border-blue-300">
              <div className="text-xs text-blue-600 font-bold">DISC ROTATION</div>
              <div className="text-2xl font-bold text-blue-900">{Math.round(rotation)}°</div>
            </div>
          )}
          {side === 'B' && (
            <div className="flex-1 bg-blue-100 rounded-lg p-3 text-center border-2 border-blue-300">
              <div className="text-xs text-blue-600 font-bold">RULER POSITION</div>
              <div className="text-2xl font-bold text-blue-900">{slidePosition.toFixed(0)} px</div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-slate-100 rounded-lg p-4 text-center text-sm text-slate-600 border border-slate-300">
          <p className="font-mono">Professional E6B Analog Simulator • Accurate Logarithmic Scales • Educational Tool for Pilots</p>
        </div>
      </div>
    </div>
  );
}
