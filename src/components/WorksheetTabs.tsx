import { useState } from 'react'
import type { DataRow, WorksheetResponses } from '../types/lkpd'

interface Props {
  responses: WorksheetResponses
  onChange: (next: WorksheetResponses) => void
  currentData: Omit<DataRow, 'id'>
  onExport: () => void
}

const tabs = ['Identitas', 'Eksperimen', 'Analisis HOTS', 'Kesimpulan'] as const
type Tab = typeof tabs[number]

export default function WorksheetTabs({ responses, onChange, currentData, onExport }: Props) {
  const [active, setActive] = useState<Tab>('Identitas')

  return (
    <section className="card worksheet-card">
      <div className="section-heading">
        <div><span className="eyebrow">LEMBAR KERJA PESERTA DIDIK</span><h2>Jelajahi &amp; simpulkan</h2></div>
        <span className="step-count">{tabs.indexOf(active) + 1} / {tabs.length}</span>
      </div>
      <div className="tabs" role="tablist" aria-label="Bagian lembar kerja">
        {tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={active === tab} className={active === tab ? 'active' : ''} onClick={() => setActive(tab)}>{tab}</button>)}
      </div>

      {active === 'Identitas' && <div className="tab-content">
        <p className="muted">Isi identitas sebelum memulai penyelidikan.</p>
        <div className="form-grid">
          <label>Nama lengkap<input value={responses.identity.name} onChange={(event) => onChange({ ...responses, identity: { ...responses.identity, name: event.target.value } })} placeholder="Nama peserta didik" /></label>
          <label>Kelas<input value={responses.identity.className} onChange={(event) => onChange({ ...responses, identity: { ...responses.identity, className: event.target.value } })} placeholder="XII IPA 1" /></label>
          <label>Kelompok<input value={responses.identity.group} onChange={(event) => onChange({ ...responses, identity: { ...responses.identity, group: event.target.value } })} placeholder="Kelompok 1" /></label>
        </div>
        <div className="prompt-box"><b>Pertanyaan pemantik</b><p>Bagaimana perubahan kecepatan putar dinamo memengaruhi besar GGL induksi yang dihasilkan?</p></div>
      </div>}

      {active === 'Eksperimen' && <div className="tab-content">
        <p className="muted">Catat hasil pada beberapa kecepatan sudut. Nilai puncak dihitung dari εmaks = N·B·A·ω.</p>
        <div className="data-actions"><span>ω saat ini: <b>{currentData.omega.toFixed(1)} rad/s</b></span><button type="button" className="small-button" onClick={() => onChange({ ...responses, dataRows: [...responses.dataRows, { ...currentData, id: Date.now() }] })}>＋ Catat data</button></div>
        <div className="table-scroll"><table><thead><tr><th>No.</th><th>ω (rad/s)</th><th>εmaks (V)</th><th>Φ saat ini (Wb)</th><th>Aksi</th></tr></thead>
          <tbody>{responses.dataRows.length === 0 ? <tr><td colSpan={5} className="empty-cell">Belum ada data. Atur parameter lalu catat hasil.</td></tr> : responses.dataRows.map((row, index) => <tr key={row.id}><td>{index + 1}</td><td>{row.omega.toFixed(1)}</td><td>{row.emf.toFixed(3)}</td><td>{row.flux.toFixed(3)}</td><td><button type="button" className="delete-button" aria-label={`Hapus data ${index + 1}`} onClick={() => onChange({ ...responses, dataRows: responses.dataRows.filter((item) => item.id !== row.id) })}>×</button></td></tr>)}</tbody>
        </table></div>
        <label className="textarea-label">Pengamatan awal<textarea value={responses.observations} onChange={(event) => onChange({ ...responses, observations: event.target.value })} placeholder="Apa pola yang kamu temukan?" rows={3} /></label>
      </div>}

      {active === 'Analisis HOTS' && <div className="tab-content quiz-content">
        <p className="muted">Gunakan bukti dari simulasi untuk menjawab.</p>
        <label>1. Ketika ω diperbesar dua kali, bagaimana perubahan εmaks? Jelaskan berdasarkan persamaan.<textarea value={responses.quiz.q1} onChange={(event) => onChange({ ...responses, quiz: { ...responses.quiz, q1: event.target.value } })} rows={3} placeholder="Tuliskan penalaranmu..." /></label>
        <label>2. Pada posisi kumparan apa fluks magnetik maksimum? Bagaimana GGL induksinya saat itu?<textarea value={responses.quiz.q2} onChange={(event) => onChange({ ...responses, quiz: { ...responses.quiz, q2: event.target.value } })} rows={3} placeholder="Hubungkan perubahan fluks dan GGL..." /></label>
        <label>3. Bandingkan keluaran komutator dan cincin geser. Apa perbedaan bentuk tegangan keluarannya?<textarea value={responses.quiz.q3} onChange={(event) => onChange({ ...responses, quiz: { ...responses.quiz, q3: event.target.value } })} rows={3} placeholder="Jelaskan hasil pengamatan..." /></label>
      </div>}

      {active === 'Kesimpulan' && <div className="tab-content">
        <div className="prompt-box"><b>Rangkuman konsep</b><p>Fluks magnetik Φ = B·A·cos θ. GGL induksi muncul karena perubahan fluks; pada kumparan berputar, εmaks = N·B·A·ω. Besaran yang lebih besar menghasilkan GGL maksimum lebih besar.</p></div>
        <label className="textarea-label">Tuliskan kesimpulan berdasarkan eksperimen<textarea value={responses.conclusion} onChange={(event) => onChange({ ...responses, conclusion: event.target.value })} rows={6} placeholder="Berdasarkan data dan analisis, saya menyimpulkan bahwa..." /></label>
        <button type="button" className="export-button" onClick={onExport}>⇩ Ekspor laporan belajar</button>
      </div>}
    </section>
  )
}
