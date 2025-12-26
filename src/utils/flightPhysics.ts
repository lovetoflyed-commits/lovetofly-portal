/**
 * Flight Physics Engine
 * Realistic aerodynamic and physical calculations for glass cockpit simulator
 */

export interface Aircraft {
  engineType: 'piston' | 'jet';
  weight: number; // lbs
  maxThrust: number; // lbs
  dragCoefficient: number;
}

export interface FlightState {
  // Position
  altitude: number; // feet
  latitude: number;
  longitude: number;

  // Attitude
  pitch: number; // degrees (-90 to +90)
  roll: number; // degrees (-180 to +180)
  heading: number; // degrees (0-360)

  // Velocity
  airspeed: number; // knots
  verticalSpeed: number; // feet per minute
  groundSpeed: number; // knots
  windHeading: number; // degrees
  windSpeed: number; // knots

  // Engine
  throttle: number; // 0-1
  rpm: number; // piston only
  n1: number; // jet N1 %
  n2: number; // jet N2 %
  fuelFlow: number; // lbs/hr

  // Control Inputs
  pitchInput: number; // -1 to +1
  rollInput: number; // -1 to +1
  rudderInput: number; // -1 to +1

  // Derived
  g: number; // g-loading
  bankAngle: number; // visual bank angle
}

const GRAVITY = 32.174; // ft/s²
const PISTON_CRUISE_POWER = 180; // hp
const JET_MAX_THRUST = 4000; // lbs

export class FlightSimulator {
  private state: FlightState;
  private aircraft: Aircraft;
  private deltaTime: number = 0.016; // 60 Hz

  constructor(aircraft: Aircraft) {
    this.aircraft = aircraft;
    this.state = this.getInitialState();
  }

  private getInitialState(): FlightState {
    return {
      altitude: 3000,
      latitude: 0,
      longitude: 0,
      pitch: 0,
      roll: 0,
      heading: 0,
      airspeed: 80,
      verticalSpeed: 0,
      groundSpeed: 80,
      windHeading: 270,
      windSpeed: 10,
      throttle: 0.3,
      rpm: 1200,
      n1: 30,
      n2: 50,
      fuelFlow: 15,
      pitchInput: 0,
      rollInput: 0,
      rudderInput: 0,
      g: 1,
      bankAngle: 0,
    };
  }

  /**
   * Main update loop - call this every frame
   */
  update(
    pitchInput: number,
    rollInput: number,
    rudderInput: number,
    throttle: number
  ): FlightState {
    this.state.pitchInput = Math.max(-1, Math.min(1, pitchInput));
    this.state.rollInput = Math.max(-1, Math.min(1, rollInput));
    this.state.rudderInput = Math.max(-1, Math.min(1, rudderInput));
    this.state.throttle = Math.max(0, Math.min(1, throttle));

    this.updateAttitude();
    this.updateThrust();
    this.updateAirspeed();
    this.updateAltitude();
    this.updateHeading();
    this.calculateGLoading();

    return { ...this.state };
  }

  /**
   * Update pitch and roll based on control inputs
   */
  private updateAttitude(): void {
    // Pitch dynamics - elevator
    const pitchRate = this.state.pitchInput * 3; // degrees per second
    this.state.pitch = Math.max(-90, Math.min(90, this.state.pitch + pitchRate * this.deltaTime));

    // Roll dynamics - ailerons with heading hold effect
    const rollRate = this.state.rollInput * 8; // degrees per second
    this.state.roll += rollRate * this.deltaTime;

    // Normalize roll to -180 to 180
    while (this.state.roll > 180) this.state.roll -= 360;
    while (this.state.roll < -180) this.state.roll += 360;

    // Bank angle visual (same as roll)
    this.state.bankAngle = this.state.roll;
  }

  /**
   * Calculate thrust based on throttle and engine type
   */
  private updateThrust(): void {
    if (this.aircraft.engineType === 'piston') {
      this.state.rpm = 600 + this.state.throttle * 2000; // 600-2600 RPM
      this.state.fuelFlow = 5 + this.state.throttle * 20; // 5-25 GPH
    } else {
      // Jet engine
      this.state.n1 = this.state.throttle * 100;
      this.state.n2 = this.state.throttle * 100;
      this.state.fuelFlow = this.state.throttle * 3000; // 0-3000 lbs/hr
    }
  }

  /**
   * Update airspeed based on thrust, altitude, and drag
   */
  private updateAirspeed(): void {
    // Calculate available thrust
    let thrustLbs = 0;
    if (this.aircraft.engineType === 'piston') {
      // Horsepower to thrust conversion (approximately)
      const hp = (this.state.rpm / 2600) * PISTON_CRUISE_POWER;
      thrustLbs = (hp * 375) / (this.state.airspeed + 1); // T = (HP * 375) / V
    } else {
      thrustLbs = this.state.throttle * JET_MAX_THRUST;
    }

    // Adjust for altitude (thinner air = less thrust)
    const altitudeEffect = Math.pow(1 - this.state.altitude / 36000, 1.2);
    thrustLbs *= altitudeEffect;

    // Calculate drag
    const dragLbs = 0.5 * this.aircraft.dragCoefficient * Math.pow(this.state.airspeed, 2);

    // Net force
    const netForce = thrustLbs - dragLbs;

    // Acceleration (F = ma)
    const accel = (netForce / this.aircraft.weight) * GRAVITY;

    // Update airspeed with damping for stability
    const speedChange = accel * this.deltaTime * 0.5; // Convert ft/s² to knots
    this.state.airspeed = Math.max(30, this.state.airspeed + speedChange);

    // Stall warning
    if (this.state.airspeed < 35) {
      this.state.airspeed = Math.max(30, this.state.airspeed - 2); // Descend when stalled
    }
  }

  /**
   * Update altitude based on vertical speed
   */
  private updateAltitude(): void {
    // Vertical speed in feet per minute based on pitch and airspeed
    const pitchEffect = (this.state.pitch / 90) * 1000; // max 1000 fpm climb
    const speedEffect = ((this.state.airspeed - 100) / 100) * 500; // speed reduces climb capability

    // Vertical speed target
    const vsTarget = pitchEffect + speedEffect * 0.5;

    // Smooth transition to target VS
    this.state.verticalSpeed += (vsTarget - this.state.verticalSpeed) * 0.1;

    // Update altitude
    const altitudeChange = (this.state.verticalSpeed / 60) * this.deltaTime;
    this.state.altitude = Math.max(0, this.state.altitude + altitudeChange);

    // Ground effect near runway
    if (this.state.altitude < 100 && this.state.pitch < 5) {
      this.state.verticalSpeed *= 0.95; // Reduce descent rate
    }
  }

  /**
   * Update heading based on roll and wind
   */
  private updateHeading(): void {
    // Heading change based on bank angle and airspeed
    const turnRate = (Math.sin((this.state.roll * Math.PI) / 180) * GRAVITY) / (this.state.airspeed + 1);
    this.state.heading += turnRate * this.deltaTime * 60;

    // Normalize heading to 0-360
    while (this.state.heading >= 360) this.state.heading -= 360;
    while (this.state.heading < 0) this.state.heading += 360;

    // Apply wind effect
    const windRadians = (this.state.windHeading * Math.PI) / 180;
    const windNorth = this.state.windSpeed * Math.cos(windRadians);
    const windEast = this.state.windSpeed * Math.sin(windRadians);

    const acRadians = (this.state.heading * Math.PI) / 180;
    const acNorth = this.state.airspeed * Math.cos(acRadians);
    const acEast = this.state.airspeed * Math.sin(acRadians);

    const gsNorth = acNorth + windNorth;
    const gsEast = acEast + windEast;
    this.state.groundSpeed = Math.sqrt(gsNorth * gsNorth + gsEast * gsEast);
  }

  /**
   * Calculate G-loading
   */
  private calculateGLoading(): void {
    // Vertical G's from pitch
    const pitchG = Math.cos((this.state.pitch * Math.PI) / 180);

    // Lateral G's from roll and turn
    const bankRad = (this.state.roll * Math.PI) / 180;
    const turnG = Math.sin(bankRad) * ((this.state.airspeed / 100) * 2);

    this.state.g = Math.sqrt(pitchG * pitchG + turnG * turnG);
  }

  getState(): FlightState {
    return { ...this.state };
  }

  setState(newState: Partial<FlightState>): void {
    this.state = { ...this.state, ...newState };
  }

  reset(): void {
    this.state = this.getInitialState();
  }
}
