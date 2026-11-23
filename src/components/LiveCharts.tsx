import type { SimulationConfig } from '../types/lkpd'
import { getPeakEmf } from '../core/physicsEngine'

interface Props { config: SimulationConfig; elapsed: number }

export default function LiveCharts({ config, elapsed }: Props) {
  const peakFlux = config.turns * config.magneticField * config.area
  const peakEmf = getPeakEmf(config)
  const pointCount = 100

  const wave = (kind: 'flux' | 'emf') => Array.from({ length: pointCount }, (_, i) => {
    const theta = (i / (pointCount - 1)) * Math.PI * 4 + elapsed * config.omega
    const raw = kind === 'flux' ? Math.cos(theta) : Math.sin(theta)
    const value = kind === 'emf' && config.ringType === 'commutator' ? Math.abs(raw) : raw
    const y = 62 - value * 42
    return `${i === 0 ? 'M' : 'L'} ${(i / (pointCount - 1)) * 300} ${y}`
  }).join(' ')

  const fluxNow = peakFlux * Math.cos(elapsed * config.omega)
  const rawEmf = peakEmf * Math.sin(elapsed * config.omega)
  const emfNow = config.ringType === 'commutator' ? Math.abs(rawEmf) : rawEmf

  return (
    <section className="card chart-card">
      <div className="section-heading">
        <div><span className="eyebrow">PENGAMATAN REAL-TIME</span><h2>Grafik besaran induksi</h2></div>
        <span className="live-dot">LIVE</span>
      </div>
      <div className="chart-grid">
        <div className="chart-panel">
          <div className="chart-title"><span className="legend flux" />Fluks magnetik Φ (Wb)<strong>{fluxNow.toFixed(3)}</strong></div>
          <svg viewBox="0 0 300 124" role="img" aria-label="Grafik fluks magnetik sinusoidal"><path className="gridline" d="M0 20H300M0 62H300M0 104H300"/><path className="wave flux-wave" d={wave('flux')} /></svg>
        </div>
        <div className="chart-panel">
          <div className="chart-title"><span className="legend emf" />GGL induksi ε (V)<strong>{emfNow.toFixed(3)}</strong></div>
          <svg viewBox="0 0 300 124" role="img" aria-label="Grafik GGL induksi"><path className="gridline" d="M0 20H300M0 62H300M0 104H300"/><path className="wave emf-wave" d={wave('emf')} /></svg>
        </div>
      </div>
      <p className="chart-note">Hukum Faraday: ε = −N · dΦ/dt. Puncak |ε| = N·B·A·ω = <b>{peakEmf.toFixed(3)} V</b>.</p>
    </section>
  )
}
