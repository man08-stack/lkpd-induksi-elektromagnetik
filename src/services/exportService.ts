import type { SimulationConfig, WorksheetResponses } from '../types/lkpd'

export interface ReportData { config: SimulationConfig; responses: WorksheetResponses; exportedAt: Date }

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)
const reportText = (value: string): string => escapeHtml(value || '—').replace(/\r?\n/g, '<br>')

export function createReportHtml({ config, responses, exportedAt }: ReportData): string {
  const rows = responses.dataRows.map((row, index) => `<tr><td>${index + 1}</td><td>${row.omega.toFixed(1)}</td><td>${row.emf.toFixed(3)}</td><td>${row.flux.toFixed(3)}</td></tr>`).join('') || '<tr><td colspan="4">Belum ada data eksperimen</td></tr>'
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Laporan LKPD Induksi Elektromagnetik</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:800px;margin:32px auto;padding:0 20px;color:#172033}h1{color:#0e7490}h2{border-bottom:1px solid #dbe3ec;padding-bottom:6px;margin-top:28px}.meta{color:#64748b}table{width:100%;border-collapse:collapse}td,th{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#ecfeff}.box{background:#f1f5f9;padding:12px;border-radius:8px}@media print{body{margin:0}}</style></head><body><h1>LKPD Digital: Induksi Elektromagnetik</h1><p class="meta">Diekspor ${escapeHtml(exportedAt.toLocaleString('id-ID'))}</p><h2>Identitas</h2><p>Nama: ${reportText(responses.identity.name)}<br>Kelas: ${reportText(responses.identity.className)}<br>Kelompok: ${reportText(responses.identity.group)}</p><h2>Parameter simulasi</h2><p>N = ${config.turns} lilitan · B = ${config.magneticField} T · A = ${config.area} m² · ω = ${config.omega} rad/s · ${config.ringType === 'commutator' ? 'Komutator' : 'Cincin geser'}</p><h2>Data eksperimen</h2><table><thead><tr><th>No.</th><th>ω (rad/s)</th><th>εmaks (V)</th><th>Φ (Wb)</th></tr></thead><tbody>${rows}</tbody></table><h2>Pengamatan</h2><div class="box">${reportText(responses.observations)}</div><h2>Analisis HOTS</h2><p><b>1.</b> ${reportText(responses.quiz.q1)}</p><p><b>2.</b> ${reportText(responses.quiz.q2)}</p><p><b>3.</b> ${reportText(responses.quiz.q3)}</p><h2>Kesimpulan</h2><div class="box">${reportText(responses.conclusion)}</div><p class="meta">Cetak atau simpan sebagai PDF melalui menu cetak browser.</p></body></html>`
}

export function downloadReport(data: ReportData): void {
  const blob = new Blob([createReportHtml(data)], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'laporan-lkpd-induksi-elektromagnetik.html'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
