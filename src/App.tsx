import { useEffect, useState } from 'react'
import ControlPanel from './components/ControlPanel'
import LiveCharts from './components/LiveCharts'
import SimulationCanvas from './components/SimulationCanvas'
import WorksheetTabs from './components/WorksheetTabs'
import { DEFAULT_CONFIG, getPeakEmf, getSnapshot } from './core/physicsEngine'
import { downloadReport } from './services/exportService'
import { loadState, saveState } from './services/storageService'
import type { WorksheetResponses } from './types/lkpd'

const emptyResponses: WorksheetResponses = {
  identity: { name: '', className: '', group: '' },
  observations: '',
  dataRows: [],
  quiz: { q1: '', q2: '', q3: '' },
  conclusion: '',
}

export default function App() {
  const [initial] = useState(() => loadState())
  const [config, setConfig] = useState(initial?.config ?? DEFAULT_CONFIG)
  const [running, setRunning] = useState(initial?.running ?? false)
  const [responses, setResponses] = useState(initial?.responses ?? emptyResponses)
  const [elapsed, setElapsed] = useState(0)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setElapsed((time) => time + 0.04), 40)
    return () => window.clearInterval(timer)
  }, [running])

  useEffect(() => {
    saveState({ config, running, responses, savedAt: Date.now() })
  }, [config, running, responses])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const snapshot = getSnapshot(config, elapsed)
  const exportReport = () => {
    downloadReport({ config, responses, exportedAt: new Date() })
    setToast('Laporan belajar berhasil disiapkan.')
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="FisikaLab, ke halaman awal"><span className="brand-icon">Φ</span><span>FISIKA<span className="brand-light">LAB</span></span></a>
        <span className="topbar-tag">LKPD DIGITAL · KELAS XII</span>
        <span className="save-indicator"><i /> Tersimpan otomatis</span>
      </header>
      <div className="page" id="top">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow">ELEKTROMAGNETISME · INKUIRI TERBIMBING</span>
            <h1>Energi dari<br /><em>putaran</em> tangan.</h1>
            <p>Selidiki bagaimana dinamo sederhana mengubah energi mekanik menjadi energi listrik melalui induksi elektromagnetik.</p>
            <div className="hero-tags"><span>⏱ 30–40 menit</span><span>⚡ Simulasi interaktif</span><span>📘 Fisika kelas XII</span></div>
          </div>
          <div className="hero-orbit" aria-hidden="true"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core">Φ</div><span className="orbit-label label-top">MAGNET</span><span className="orbit-label label-bottom">GERAK → GGL</span></div>
        </section>

        <section className="simulation-layout" aria-label="Simulasi dinamo">
          <div className="visual-column">
            <SimulationCanvas config={config} elapsed={elapsed} running={running} />
            <LiveCharts config={config} elapsed={elapsed} />
            <div className="metric-row">
              <div className="metric card"><span>FLUKS SAAT INI</span><b>{snapshot.flux.toFixed(4)} <small>Wb</small></b></div>
              <div className="metric card"><span>GGL INSTANTAN</span><b>{snapshot.emf.toFixed(4)} <small>V</small></b></div>
              <div className="metric card"><span>GGL MAKSIMUM</span><b>{getPeakEmf(config).toFixed(4)} <small>V</small></b></div>
            </div>
          </div>
          <div className="side-column">
            <ControlPanel config={config} onChange={setConfig} running={running} onToggle={() => setRunning((value) => !value)} onReset={() => { setConfig(DEFAULT_CONFIG); setElapsed(0); setRunning(false); setToast('Parameter dikembalikan ke nilai awal.') }} />
            <div className="theory-card"><span className="theory-icon">∫</span><div><b>Ingat konsep</b><p>Fluks magnetik Φ = B·A·cos θ. GGL induksi mengikuti laju perubahan fluks.</p></div></div>
          </div>
        </section>

        <WorksheetTabs responses={responses} onChange={setResponses} currentData={{ omega: config.omega, emf: getPeakEmf(config), flux: snapshot.flux }} onExport={exportReport} />
        <footer><span>FISIKALAB · BELAJAR DENGAN MENYELIDIKI</span><span>Dirancang untuk pembelajaran Fisika SMA Kelas XII</span></footer>
      </div>
      {toast && <div className="toast" role="status">✓ {toast}</div>}
    </main>
  )
}
