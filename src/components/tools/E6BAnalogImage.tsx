'use client';

import { useRef, useState } from 'react';

type Ranges = {
  low: { min: number; max: number };
  high: { min: number; max: number };
};

const DEFAULT_RANGES: Ranges = {
  low: { min: 40, max: 120 },
  high: { min: 120, max: 240 }
};

export default function E6BAnalogImage({
  rulerSrc = '/e6b/jeppesen/ruler.svg',
  slideSrc = '/e6b/jeppesen/slide.svg',
  innerDiscSrc = '/e6b/jeppesen/inner-disc.svg',
  outerDiscSrc = '/e6b/jeppesen/outer-disc.svg',
  /** Backward-compat: if provided, used as inner disc */
  discSrc,
  ranges = DEFAULT_RANGES,
  showCursor = true
}: {
  rulerSrc?: string;
  slideSrc?: string;
  innerDiscSrc?: string;
  outerDiscSrc?: string;
  discSrc?: string;
  ranges?: Ranges;
  showCursor?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [cursorRatio, setCursorRatio] = useState(0.5); // 0 top, 1 bottom
  const [activeSide, setActiveSide] = useState<'low' | 'high'>('low');
  const [panel, setPanel] = useState<'wind' | 'converter'>('wind');
  const [snapDegree, setSnapDegree] = useState(true);
  const [rulerMissing, setRulerMissing] = useState(false);
  const [slideMissing, setSlideMissing] = useState(false);
  const [innerMissing, setInnerMissing] = useState(false);
  const [outerMissing, setOuterMissing] = useState(false);
  const [calibrateOpen, setCalibrateOpen] = useState(false);
  const [transformOriginX, setTransformOriginX] = useState(50);
  const [transformOriginY, setTransformOriginY] = useState(50);
  const [discScale, setDiscScale] = useState(1);
  const [bandTopPercent, setBandTopPercent] = useState(15);
  const [bandHeightPercent, setBandHeightPercent] = useState(70);
  const [showDegreeOverlay, setShowDegreeOverlay] = useState(false);
  const [slideOffset, setSlideOffset] = useState(0); // px translateY for ruler/slide band
  const [dragMode, setDragMode] = useState<'cursor' | 'slide'>('cursor');
  const [slideDragLastY, setSlideDragLastY] = useState<number | null>(null);

  // Map cursor ratio to speed based on chosen side
  const speed = (() => {
    const r = ranges[activeSide];
    return Math.round(r.min + (1 - cursorRatio) * (r.max - r.min));
  })();

  const onDragSlide = (e: { clientX: number; clientY: number }) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const top = rect.height * (bandTopPercent / 100);
    const bottom = rect.height * ((bandTopPercent + bandHeightPercent) / 100);
    const clamped = Math.max(top, Math.min(bottom, y));
    const ratio = 1 - (clamped - top) / (bottom - top);
    setCursorRatio(ratio);
  };

  const onDragRotate = (e: { clientX: number; clientY: number }) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
    let deg = angle + 90;
    // normalize to 0..359
    deg = ((deg % 360) + 360) % 360;
    setRotation(snapDegree ? Math.round(deg) : deg);
  };

  const handleDragSlide = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = e.clientY - rect.top;
    if (dragMode === 'cursor') {
      if (e.buttons === 1 || e.type === 'mousedown') {
        onDragSlide(e);
      }
    } else {
      if (e.type === 'mousedown') {
        setSlideDragLastY(y);
      } else if ((e.buttons === 1) && slideDragLastY !== null) {
        const delta = y - slideDragLastY;
        setSlideOffset(prev => Math.max(-200, Math.min(200, prev + delta)));
        setSlideDragLastY(y);
      }
    }
  };

  const handleDragRotate = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons === 1 || e.type === 'mousedown') {
      onDragRotate(e);
    }
  };

  const bandWidth = 240; // px
  const leftColX = `calc(50% - ${bandWidth / 2}px)`;
  const rightColX = `calc(50% + ${bandWidth / 2}px)`;

  const innerSrc = discSrc ?? innerDiscSrc;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-8">
      <div className="w-full max-w-4xl">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setPanel('wind')}
              className={`px-3 py-2 rounded-lg text-sm font-bold ${panel === 'wind' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-800'}`}
            >Wind Side</button>
            <button
              onClick={() => setPanel('converter')}
              className={`px-3 py-2 rounded-lg text-sm font-bold ${panel === 'converter' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-800'}`}
            >Converter Side</button>
            <button
              onClick={() => setActiveSide('low')}
              className={`px-3 py-2 rounded-lg text-sm font-bold ${activeSide === 'low' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-800'}`}
            >LOW {ranges.low.min}–{ranges.low.max} kt</button>
            <button
              onClick={() => setActiveSide('high')}
              className={`px-3 py-2 rounded-lg text-sm font-bold ${activeSide === 'high' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-800'}`}
            >HIGH {ranges.high.min}–{ranges.high.max} kt</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-700">GS/VS</div>
            <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded font-mono text-blue-900 font-bold">{speed} kt</div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={snapDegree} onChange={(e) => setSnapDegree(e.target.checked)} />
              Snap 1°
            </label>
            <input
              type="range" min={0} max={359} value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
              className="w-48"
            />
            <button
              onClick={() => setCalibrateOpen(!calibrateOpen)}
              className="px-3 py-2 rounded-lg text-sm font-bold bg-slate-200 text-slate-800"
            >{calibrateOpen ? 'Fechar' : 'Calibrar'}</button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-700">Modo:</span>
              <button
                onClick={() => setDragMode('cursor')}
                className={`px-2 py-1 rounded ${dragMode === 'cursor' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800'}`}
              >Cursor</button>
              <button
                onClick={() => setDragMode('slide')}
                className={`px-2 py-1 rounded ${dragMode === 'slide' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800'}`}
              >Régua</button>
            </div>
          </div>
        </div>

        {calibrateOpen && (
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div>
              <div className="text-sm font-bold text-slate-700 mb-1">Transform Origin X (%)</div>
              <input type="range" min={0} max={100} value={transformOriginX} onChange={(e) => setTransformOriginX(parseInt(e.target.value))} />
              <div className="text-xs text-slate-600">{transformOriginX}%</div>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-700 mb-1">Transform Origin Y (%)</div>
              <input type="range" min={0} max={100} value={transformOriginY} onChange={(e) => setTransformOriginY(parseInt(e.target.value))} />
              <div className="text-xs text-slate-600">{transformOriginY}%</div>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-700 mb-1">Disc Scale</div>
              <input type="range" min={80} max={120} value={Math.round(discScale * 100)} onChange={(e) => setDiscScale(parseInt(e.target.value) / 100)} />
              <div className="text-xs text-slate-600">{discScale.toFixed(2)}×</div>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-700 mb-1">Slide Top (%)</div>
              <input type="range" min={5} max={25} value={bandTopPercent} onChange={(e) => setBandTopPercent(parseInt(e.target.value))} />
              <div className="text-xs text-slate-600">{bandTopPercent}%</div>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-700 mb-1">Slide Height (%)</div>
              <input type="range" min={50} max={80} value={bandHeightPercent} onChange={(e) => setBandHeightPercent(parseInt(e.target.value))} />
              <div className="text-xs text-slate-600">{bandHeightPercent}%</div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-700">
                <input type="checkbox" checked={showDegreeOverlay} onChange={(e) => setShowDegreeOverlay(e.target.checked)} />
                Mostrar overlay de graus (10°)
              </label>
              <button onClick={() => { setTransformOriginX(50); setTransformOriginY(50); setDiscScale(1); setBandTopPercent(15); setBandHeightPercent(70); }} className="px-2 py-1 bg-slate-200 rounded text-xs">Reset</button>
            </div>
          </div>
        )}

        {/* Stage */}
        <div
          ref={containerRef}
          className="relative mx-auto bg-white border border-slate-200 rounded-xl shadow-sm outline-none"
          style={{ width: 800, height: 650 }}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setRotation(prev => ((prev - 1 + 360) % 360));
            if (e.key === 'ArrowRight') setRotation(prev => ((prev + 1) % 360));
            if (e.key === 'ArrowUp') setCursorRatio(prev => Math.min(1, prev + 0.02));
            if (e.key === 'ArrowDown') setCursorRatio(prev => Math.max(0, prev - 0.02));
          }}
        >
          {/* Static Ruler (background) */}
          {panel === 'wind' && (
            !rulerMissing ? (
              <img
                src={rulerSrc}
                alt="Ruler"
                className="absolute inset-0 w-full h-full object-contain select-none"
                style={{ transform: `translateY(${slideOffset}px)` }}
                onError={() => setRulerMissing(true)}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-center text-slate-500">
                <div>
                  <div className="font-bold">Place ruler image</div>
                  <div className="text-xs">public/e6b/jeppesen/ruler.png</div>
                </div>
              </div>
            )
          )}

          {/* Slide band hit-area (for dragging up/down) */}
          {panel === 'wind' && showCursor && (
            <div
              className="absolute left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
              style={{ top: `${bandTopPercent}%`, height: `${bandHeightPercent}%`, width: bandWidth, transform: `translateY(${slideOffset}px)` }}
              onMouseDown={handleDragSlide}
              onMouseMove={handleDragSlide}
              onTouchStart={(e) => { const t = e.touches[0]; if (t) onDragSlide({ clientX: t.clientX, clientY: t.clientY }); }}
              onTouchMove={(e) => { const t = e.touches[0]; if (t) onDragSlide({ clientX: t.clientX, clientY: t.clientY }); }}
            >
              {/* Cursor line */}
              <div
                className="absolute left-0 right-0 border-t-4 border-sky-500"
                style={{ top: `calc(${(1 - cursorRatio) * 70}% )` }}
              />
              {/* Pointer + label */}
              <div
                className={`absolute flex items-center gap-2 ${activeSide === 'low' ? 'left-2' : 'right-2 flex-row-reverse'}`}
                style={{ top: `calc(${(1 - cursorRatio) * 70}% - 18px)` }}
              >
                <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[12px] border-l-sky-500" style={{ transform: activeSide === 'low' ? 'none' : 'scaleX(-1)' }} />
                <div className="px-2 py-1 bg-sky-100 text-sky-800 rounded border border-sky-300 text-xs font-bold">{speed} kt</div>
              </div>
            </div>
          )}

          {/* Optional slide image overlay */}
          {panel === 'wind' && (!slideMissing ? (
            <img
              src={slideSrc}
              alt="Slide"
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
              style={{ top: '0%', height: '100%', width: bandWidth, transform: `translateY(${slideOffset}px)` }}
              onError={() => setSlideMissing(true)}
            />
          ) : null)}

          {/* Rotating Inner Disc */}
          <div
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            onMouseDown={handleDragRotate}
            onMouseMove={handleDragRotate}
            onTouchStart={(e) => { const t = e.touches[0]; if (t) onDragRotate({ clientX: t.clientX, clientY: t.clientY }); }}
            onTouchMove={(e) => { const t = e.touches[0]; if (t) onDragRotate({ clientX: t.clientX, clientY: t.clientY }); }}
          >
            {!innerMissing ? (
              <img
                src={innerSrc}
                alt="Inner Disc"
                className="absolute inset-0 w-full h-full object-contain select-none"
                style={{ transform: `rotate(${rotation}deg) scale(${discScale})`, transformOrigin: `${transformOriginX}% ${transformOriginY}%`, opacity: 0.9 }}
                onError={() => setInnerMissing(true)}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-center text-slate-500">
                <div>
                  <div className="font-bold">Place inner disc image</div>
                  <div className="text-xs">public/e6b/jeppesen/inner-disc.png</div>
                </div>
              </div>
            )}
          </div>

          {showDegreeOverlay && (
            <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 800 650">
              <g transform="translate(400,325)">
                {Array.from({ length: 36 }).map((_, i) => (
                  <line key={i} x1={0} y1={-220} x2={0} y2={-200} stroke="#64748b" strokeWidth={2} transform={`rotate(${i * 10})`} />
                ))}
              </g>
            </svg>
          )}
          <div className="absolute left-1/2 -translate-x-1/2 top-2 bg-white/80 border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-800">
            {Math.round(rotation)}°
          </div>

          {/* Static Outer Disc (frame) */}
          {!outerMissing ? (
            <img
              src={outerDiscSrc}
              alt="Outer Disc"
              className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
              style={{ opacity: 0.95 }}
              onError={() => setOuterMissing(true)}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-start p-2 text-slate-500 pointer-events-none">
              <div className="text-xs">Optional: public/e6b/jeppesen/outer-disc.png</div>
            </div>
          )}

          {/* Grommet (center pivot visual) */}
          <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <div className="w-6 h-6 rounded-full border-2 border-slate-700 bg-white" />
            <div className="w-2 h-2 rounded-full bg-slate-700 absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
          </div>
        </div>

        {/* Help box */}
        <div className="mt-4 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded p-3">
          <div className="font-bold text-slate-800 mb-1">Assets</div>
          <div>Drop your Jeppesen E6B images into <span className="font-mono">public/e6b/jeppesen/</span>:</div>
          <ul className="list-disc ml-6 mt-1">
            <li><span className="font-mono">ruler.png/svg</span> — static background ruler with dual scale (low left / high right)</li>
            <li><span className="font-mono">inner-disc.png/svg</span> — transparent rotatable inner disc (with 1° markings)</li>
            <li><span className="font-mono">outer-disc.png/svg</span> — static outer ring/frame</li>
            <li><span className="font-mono">slide.png/svg</span> — optional transparent slide overlay (if you have it)</li>
          </ul>
          <div className="mt-2 text-xs">Use Wind Side for scale + disc (drag up/down band, rotate disc). Use Converter Side for two discs (base static, top rotates).</div>
        </div>
      </div>
    </div>
  );
}
