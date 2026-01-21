'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FlightSimulator, FlightState, Aircraft } from '@/utils/flightPhysics';
import PFD from '@/components/tools/PFD';
import MovingMap from '@/components/tools/MovingMap';

type EngineType = 'piston' | 'jet';

const PISTON_AIRCRAFT: Aircraft = {
  engineType: 'piston',
  weight: 2650,
  maxThrust: 180,
  dragCoefficient: 0.025,
};

const JET_AIRCRAFT: Aircraft = {
  engineType: 'jet',
  weight: 8500,
  maxThrust: 4000,
  dragCoefficient: 0.02,
};

export default function GlassCockpit() {
  const [engineType, setEngineType] = useState<EngineType>('piston');
  const [flightState, setFlightState] = useState<FlightState | null>(() => {
    const aircraft = PISTON_AIRCRAFT;
    const sim = new FlightSimulator(aircraft);
    return sim.getState();
  });
  const [isFlying, setIsFlying] = useState(false);
  const [navFreq, setNavFreq] = useState('113.90');
  const [navCourse, setNavCourse] = useState(90);
  const [trackHistory, setTrackHistory] = useState<Array<{ lat: number; lon: number; alt: number }>>([]);
  const [latitude, setLatitude] = useState(37.7749);
  const [longitude, setLongitude] = useState(-122.4194);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);
  const engineOscRef = useRef<OscillatorNode | null>(null);
  const simRef = useRef<FlightSimulator | null>(null);
  const animationRef = useRef<number | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Initialize simulator
  useEffect(() => {
    const aircraft = engineType === 'piston' ? PISTON_AIRCRAFT : JET_AIRCRAFT;
    const sim = new FlightSimulator(aircraft);
    simRef.current = sim;

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engineType]);

  // Main simulation loop
  useEffect(() => {
    if (!isFlying || !simRef.current) return;

    const animate = () => {
      const keys = keysRef.current;

      // Control inputs from keyboard
      let pitchInput = 0;
      let rollInput = 0;
      let throttle = simRef.current!.getState().throttle;

      // Pitch: ArrowUp = up, ArrowDown = down
      if (keys['arrowup']) pitchInput += 1;
      if (keys['arrowdown']) pitchInput -= 1;

      // Roll: ArrowLeft = left, ArrowRight = right
      if (keys['arrowleft']) rollInput += 1;
      if (keys['arrowright']) rollInput -= 1;

      // Throttle: A = increase, Z = decrease
      if (keys['a']) throttle += 0.01;
      if (keys['z']) throttle -= 0.01;

      // Reset: R key
      if (keys['r']) {
        simRef.current!.reset();
      }

      const newState = simRef.current!.update(pitchInput, rollInput, 0, throttle);
      setFlightState(newState);

      // Update position based on heading and groundspeed
      const groundSpeed = newState.groundSpeed || newState.airspeed * 0.8;
      const headingRad = (newState.heading * Math.PI) / 180;
      const nmPerSec = groundSpeed / 3600;
      const latDelta = (nmPerSec * Math.cos(headingRad)) / 60;
      const lonDelta = (nmPerSec * Math.sin(headingRad)) / (60 * Math.cos((latitude * Math.PI) / 180));

      const newLat = latitude + latDelta / 60;
      const newLon = longitude + lonDelta / 60;

      setLatitude(newLat);
      setLongitude(newLon);

      // Add to track history with new position
      setTrackHistory((hist) => {
        const newHist = [...hist, { lat: newLat, lon: newLon, alt: newState.altitude }];
        return newHist.slice(-300);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isFlying]);

  const toggleFlight = () => {
    setIsFlying(!isFlying);
  };

  // Manage engine sound
  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (engineOscRef.current) {
        engineOscRef.current.stop();
        engineOscRef.current.disconnect();
        engineOscRef.current = null;
      }
      if (engineGainRef.current) {
        engineGainRef.current.disconnect();
        engineGainRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!flightState) return;

    // Lazy init audio on first interaction (button click already happened)
    const ensureAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (!engineGainRef.current) {
        engineGainRef.current = ctx.createGain();
        engineGainRef.current.gain.value = 0;
        engineGainRef.current.connect(ctx.destination);
      }
      if (!engineOscRef.current) {
        engineOscRef.current = ctx.createOscillator();
        engineOscRef.current.type = 'sawtooth';
        engineOscRef.current.connect(engineGainRef.current);
        engineOscRef.current.start();
      }
    };

    ensureAudio();
    const ctx = audioCtxRef.current;
    const gain = engineGainRef.current;
    const osc = engineOscRef.current;
    if (!ctx || !gain || !osc) return;

    // Map RPM to frequency and volume
    const rpm = Math.max(800, Math.min(2700, flightState.rpm || 0));
    const freq = 60 + (rpm - 800) * (320 - 60) / (2700 - 800); // ~60-320 Hz
    const vol = isFlying ? Math.min(0.12, 0.04 + flightState.throttle * 0.12) : 0;

    osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.05);
    gain.gain.setTargetAtTime(vol, ctx.currentTime, 0.1);

    if (isFlying && ctx.state === 'suspended') {
      ctx.resume();
    }
  }, [flightState, isFlying]);

  // Simple NAV1 CDI based on heading vs selected OBS (no position model available)
  const navHeading = flightState?.heading ?? 0;
  const navDiff = ((navHeading - navCourse + 540) % 360) - 180; // -180..180
  const navDeflection = Math.max(-1, Math.min(1, navDiff / 10)); // ±10° = full-scale
  const navFlag: 'TO' | 'FROM' | 'OFF' = Math.abs(navDiff) > 175 ? 'OFF' : Math.abs(navDiff) < 90 ? 'TO' : 'FROM';

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      {/* Header - Cessna C152 Style */}
      <div className="bg-gray-800 border-b border-gray-600 p-3 flex justify-between items-center">
        <div>
          <h1 className="text-white text-xl font-bold">🛩️ Cessna C152 Cockpit Simulator</h1>
          <p className="text-gray-400 text-xs mt-1">Single-Engine Piston Aircraft | Max Altitude: 14,700 ft | Cruise Speed: 109 knots</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={toggleFlight}
            className={`px-6 py-2 rounded font-bold text-white transition-colors text-sm ${
              isFlying
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isFlying ? '⏹ ENGINE OFF' : '▶ START ENGINE'}
          </button>
        </div>
      </div>

      {/* Main Cockpit View - Split: PFD left, Moving Map right */}
      <div className="flex-1 flex gap-2 bg-gray-950 overflow-hidden p-2">
        {/* Left: Instrument Panel */}
        <div className="flex-1 flex flex-col relative">
          {/* PFD */}
          <div className="flex-1 flex relative">
            {flightState && (
              <>
                <PFD
                  flightState={flightState}
                  navFreq={navFreq}
                  navCourse={navCourse}
                  navDeflection={navDeflection}
                  navFlag={navFlag}
                />
                {/* Throttle overlay on instrument panel (right center) */}
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 bg-gray-800/80 rounded px-3 py-2 border border-gray-700 shadow-lg">
                  <div className="text-white text-xs font-bold">THROTTLE</div>
                  <div className="w-12 h-28 border-2 border-gray-600 bg-gray-700 rounded relative overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-green-500"
                      style={{ height: `${Math.max(0, Math.min(1, flightState.throttle)) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-200 font-mono">{Math.round((flightState?.throttle ?? 0) * 100)}%</div>
                </div>
              </>
            )}
          </div>

          {/* Control Yoke & Pedals Visualization */}
          <div className="bg-gradient-to-r from-yellow-800 to-yellow-700 border-t-4 border-gray-600 p-4 h-24 flex items-center justify-center gap-8">
            {/* Control Yoke */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-white text-sm font-bold">CONTROL YOKE</div>
              <div className="w-16 h-16 border-4 border-gray-700 rounded-full bg-gray-600 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div className="text-xs text-gray-700 font-mono">
                Pitch: {flightState ? Math.round(flightState.pitch) : 0}° | Roll: {flightState ? Math.round(flightState.roll) : 0}°
              </div>
            </div>

            {/* Engine Controls */}
            <div className="flex gap-6">
              {/* RPM */}
              <div className="flex flex-col items-center gap-1">
                <div className="text-white text-xs font-bold mb-1">RPM</div>
                <div className="w-12 h-20 border-2 border-gray-700 bg-gray-600 rounded relative overflow-hidden flex items-end justify-center">
                  <div className="text-white text-xs font-bold">{flightState ? Math.round(flightState.rpm / 100) : 0}</div>
                </div>
                <div className="text-xs text-gray-700 font-mono">{flightState ? Math.round(flightState.rpm) : 0}</div>
              </div>

              {/* Fuel Flow */}
              <div className="flex flex-col items-center gap-1">
                <div className="text-white text-xs font-bold mb-1">FUEL FLOW</div>
                <div className="w-12 h-20 border-2 border-gray-700 bg-gray-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-mono font-bold">{flightState ? flightState.fuelFlow.toFixed(1) : '0.0'}</span>
                </div>
                <div className="text-xs text-gray-700 font-mono">GPH</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Moving Map */}
        <div className="flex-1 flex relative">
          {flightState && (
            <MovingMap 
              flightState={{ ...flightState, latitude, longitude }} 
              trackHistory={trackHistory} 
            />
          )}
        </div>
      </div>

      {/* Bottom Control Panel - horizontal layout */}
      <div className="bg-gray-800 border-t border-gray-600 px-4 py-3 text-xs">
        <div className="flex flex-row flex-wrap items-start gap-6 overflow-x-auto">
          <div className="min-w-[160px]">
            <h3 className="text-yellow-400 font-bold mb-1">Flight Controls</h3>
            <div className="text-gray-300 space-y-0.5 text-xs">
              <p><span className="text-green-400 font-mono">↑/↓</span> - Pitch</p>
              <p><span className="text-green-400 font-mono">←/→</span> - Roll</p>
              <p><span className="text-green-400 font-mono">A/Z</span> - Throttle</p>
              <p><span className="text-green-400 font-mono">R</span> - Reset</p>
            </div>
          </div>
          <div className="min-w-[160px]">
            <h3 className="text-yellow-400 font-bold mb-1">Engine Info</h3>
            {flightState && (
              <div className="text-gray-300 space-y-0.5 text-xs font-mono">
                <p>RPM: {Math.round(flightState.rpm)}</p>
                <p>MP: {flightState.throttle.toFixed(1)}</p>
                <p>CHT: 165°F</p>
              </div>
            )}
          </div>
          <div className="min-w-[160px]">
            <h3 className="text-yellow-400 font-bold mb-1">Aircraft Status</h3>
            {flightState && (
              <div className="text-gray-300 space-y-0.5 text-xs font-mono">
                <p>Fuel: {(100 - flightState.altitude / 300).toFixed(0)}%</p>
                <p>Oil Temp: 185°F</p>
                <p>Oil Pres: 45 PSI</p>
              </div>
            )}
          </div>
          <div className="min-w-[160px]">
            <h3 className="text-yellow-400 font-bold mb-1">Flight Mode</h3>
            <div className="text-gray-300 space-y-0.5 text-xs font-mono">
              <p>Status: {isFlying ? <span className="text-green-400">FLYING</span> : <span className="text-red-400">GROUND</span>}</p>
              <p>G-Load: {flightState ? flightState.g.toFixed(1) : '1.0'}G</p>
              <p>Stall Risk: {flightState && flightState.airspeed < 40 ? <span className="text-red-400">⚠️ HIGH</span> : <span className="text-green-400">OK</span>}</p>
            </div>
          </div>
          <div className="min-w-[200px]">
            <h3 className="text-yellow-400 font-bold mb-1">NAV1 (VOR)</h3>
            <div className="text-gray-300 space-y-1 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span>FREQ</span>
                <input
                  value={navFreq}
                  onChange={(e) => setNavFreq(e.target.value)}
                  className="bg-gray-700 text-white text-xs px-2 py-1 rounded w-24 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span>OBS</span>
                <input
                  type="number"
                  min="0"
                  max="359"
                  value={navCourse}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setNavCourse(Math.max(0, Math.min(359, val)));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseInt((e.target as HTMLInputElement).value) || 0;
                      setNavCourse(((val % 360) + 360) % 360);
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="bg-gray-700 text-white text-xs px-2 py-1 rounded w-16 text-center focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="0-359"
                />
              </div>
              <div className="text-gray-400 text-[11px]">CDI couples to heading vs OBS (±10° scale)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
