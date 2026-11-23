import type { SimulationConfig } from '../types/lkpd'

export interface PhysicsSnapshot {
  angle: number
  flux: number
  emf: number
}

export const DEFAULT_CONFIG: SimulationConfig = {
  turns: 100,
  magneticField: 0.50,
  area: 0.020,
  omega: 2.0,
  ringType: 'commutator',
}

export function calculateFlux(config: SimulationConfig, angleRad: number): number {
  return config.turns * config.magneticField * config.area * Math.cos(angleRad)
}

export function calculateInstantEmf(config: SimulationConfig, angleRad: number): number {
  const raw = config.turns * config.magneticField * config.area * config.omega * Math.sin(angleRad)
  // Commutator reverses the negative half-cycle, while slip rings preserve AC polarity.
  return config.ringType === 'commutator' ? Math.abs(raw) : raw
}

export function getPeakEmf(config: SimulationConfig): number {
  return config.turns * config.magneticField * config.area * config.omega
}

export function getSnapshot(config: SimulationConfig, elapsedSeconds: number): PhysicsSnapshot {
  const angle = config.omega * elapsedSeconds
  return {
    angle,
    flux: calculateFlux(config, angle),
    emf: calculateInstantEmf(config, angle),
  }
}

export function toDegrees(radians: number): number {
  return ((radians * 180 / Math.PI) % 360 + 360) % 360
}
