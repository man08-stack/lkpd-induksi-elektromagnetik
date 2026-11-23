import type { RingType, SimulationConfig } from '../types/lkpd'

interface Props {
  config: SimulationConfig
  onChange: (config: SimulationConfig) => void
  running: boolean
  onToggle: () => void
  onReset: () => void
}

const sliders = [
  { key: 'turns' as const, label: 'Jumlah lilitan', symbol: 'N', min: 20, max: 500, step: 10, unit: 'lilitan' },
  { key: 'magneticField' as const, label: 'Kuat medan magnet', symbol: 'B', min: 0.1, max: 1.2, step: 0.05, unit: 'T' },
  { key: 'area' as const, label: 'Luas kumparan', symbol: 'A', min: 0.005, max: 0.05, step: 0.001, unit: 'm²' },
  { key: 'omega' as const, label: 'Kecepatan sudut', symbol: 'ω', min: 0.5, max: 8, step: 0.1, unit: 'rad/s' },
]

export default function ControlPanel({ config, onChange, running, onToggle, onReset }: Props) {
  const setRing = (ringType: RingType) => onChange({ ...config, ringType })

  return (
    <section className="card controls-card">
      <div className="section-heading">
        <div><span className="eyebrow">LABORATORIUM VIRTUAL</span><h2>Atur parameter</h2></div>
        <button className={`run-button ${running ? 'is-running' : ''}`} onClick={onToggle}>{running ? 'Ⅱ Jeda' : '▶ Putar'}</button>
      </div>
      <p className="muted small">Ubah variabel, lalu amati perubahan fluks dan GGL induksi.</p>
      <div className="sliders">
        {sliders.map((item) => (
          <label className="slider-row" key={item.key}>
            <span className="slider-label">
              <span className="symbol">{item.symbol}</span><span>{item.label}</span>
              <b>{item.key === 'area' ? config[item.key].toFixed(3) : item.key === 'magneticField' ? config[item.key].toFixed(2) : config[item.key]} <small>{item.unit}</small></b>
            </span>
            <input type="range" min={item.min} max={item.max} step={item.step} value={config[item.key]} onChange={(event) => onChange({ ...config, [item.key]: Number(event.target.value) })} aria-label={item.label} />
          </label>
        ))}
      </div>
      <div className="ring-picker">
        <span className="field-label">Jenis cincin keluaran</span>
        <div className="segmented">
          <button className={config.ringType === 'commutator' ? 'selected' : ''} onClick={() => setRing('commutator')}>Komutator <small>DC berdenyut</small></button>
          <button className={config.ringType === 'slip-ring' ? 'selected' : ''} onClick={() => setRing('slip-ring')}>Cincin geser <small>AC bolak-balik</small></button>
        </div>
      </div>
      <button className="reset-button" onClick={onReset}>↺ Kembalikan parameter awal</button>
    </section>
  )
}
