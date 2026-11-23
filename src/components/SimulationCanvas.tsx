import { useEffect, useRef } from 'react'
import type { SimulationConfig } from '../types/lkpd'
import { toDegrees } from '../core/physicsEngine'

interface Props { config: SimulationConfig; elapsed: number; running: boolean }

export default function SimulationCanvas({ config, elapsed }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const { width, height } = canvas.getBoundingClientRect()
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const w = width
    const h = height
    ctx.clearRect(0, 0, w, h)
    const gradient = ctx.createLinearGradient(0, 0, w, h)
    gradient.addColorStop(0, '#0f172a')
    gradient.addColorStop(1, '#172554')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(125,211,252,.22)'
    ctx.lineWidth = 1
    for (let i = 0; i < 7; i++) {
      ctx.beginPath()
      ctx.ellipse(w * 0.47, h * 0.49, 45 + i * 14, 30 + i * 12, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    const cx = w * 0.47
    const cy = h * 0.48
    const radius = Math.min(w, h) * 0.19
    const angle = elapsed * config.omega

    ctx.fillStyle = '#ef4444'; ctx.fillRect(cx - radius - 66, cy - 33, 54, 66)
    ctx.fillStyle = '#3b82f6'; ctx.fillRect(cx + radius + 12, cy - 33, 54, 66)
    ctx.fillStyle = '#fff'; ctx.font = 'bold 19px system-ui'; ctx.textAlign = 'center'
    ctx.fillText('N', cx - radius - 39, cy + 7)
    ctx.fillText('S', cx + radius + 39, cy + 7)

    const dx = Math.cos(angle) * radius
    const dy = Math.sin(angle) * radius * 0.55
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 6
    ctx.beginPath()
    ctx.ellipse(cx, cy, Math.abs(dx) + 10, Math.abs(dy) + 12, angle * 0.18, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = '#fde68a'
    ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 7, 0, Math.PI * 2); ctx.fill()

    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + 16 + Math.cos(angle) * 28, cy + 20 + Math.sin(angle) * 28)
    ctx.stroke()

    ctx.fillStyle = '#e2e8f0'; ctx.font = '12px system-ui'; ctx.textAlign = 'left'
    ctx.fillText(`θ = ${toDegrees(angle).toFixed(0)}°`, 16, 24)
    ctx.fillText(`N = ${config.turns} lilitan`, 16, h - 18)
    ctx.textAlign = 'right'; ctx.fillText('DINAMO ENGKOL', w - 16, 24)
  }, [config, elapsed])

  return (
    <div className="canvas-wrap">
      <canvas ref={canvasRef} aria-label="Animasi dinamo engkol tangan" />
      <div className="canvas-caption">
        <span>MODEL DINAMO SEDERHANA</span>
        <span>{config.ringType === 'commutator' ? 'KOMUTATOR · DC BERDENYUT' : 'CINCIN GESER · AC'}</span>
      </div>
    </div>
  )
}
