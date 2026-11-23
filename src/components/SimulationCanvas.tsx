import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { SimulationConfig } from '../types/lkpd'
import { getPeakEmf, toDegrees } from '../core/physicsEngine'

interface Props {
  config: SimulationConfig
  elapsed: number
  running: boolean
}

type Point3 = [number, number, number]
type Point2 = { x: number; y: number; depth: number }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function project(point: Point3, yaw: number, pitch: number, scale: number, originX: number, originY: number): Point2 {
  const [x, y, z] = point
  const rotatedX = x * Math.cos(yaw) - z * Math.sin(yaw)
  const depth = x * Math.sin(yaw) + z * Math.cos(yaw)
  const vertical = y * Math.cos(pitch) - depth * Math.sin(pitch)
  return { x: originX + rotatedX * scale, y: originY - vertical * scale, depth }
}

export default function SimulationCanvas({ config, elapsed, running }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<{ x: number; y: number; pointerId: number } | null>(null)
  const [camera, setCamera] = useState({ yaw: -0.42, pitch: 0.22 })
  const [xray, setXray] = useState(0.72)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const bounds = canvas.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(bounds.width * dpr)
    canvas.height = Math.round(bounds.height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const width = bounds.width
    const height = bounds.height
    const scale = Math.min(width / 7.4, height / 4.7)
    const originX = width * 0.48
    const originY = height * 0.82
    const { yaw, pitch } = camera
    const p = (point: Point3) => project(point, yaw, pitch, scale, originX, originY)
    const line = (points: Point3[], color: string, lineWidth = 2, dash: number[] = []) => {
      if (points.length < 2) return
      ctx.beginPath()
      points.forEach((point, index) => {
        const pos = p(point)
        if (index === 0) ctx.moveTo(pos.x, pos.y)
        else ctx.lineTo(pos.x, pos.y)
      })
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.setLineDash(dash)
      ctx.stroke()
      ctx.setLineDash([])
    }
    const polygon = (points: Point3[], fill: string, stroke?: string, lineWidth = 1) => {
      if (points.length < 3) return
      ctx.beginPath()
      points.forEach((point, index) => {
        const pos = p(point)
        if (index === 0) ctx.moveTo(pos.x, pos.y)
        else ctx.lineTo(pos.x, pos.y)
      })
      ctx.closePath()
      ctx.fillStyle = fill
      ctx.fill()
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke() }
    }
    const dot = (point: Point3, radius: number, fill: string, stroke?: string) => {
      const pos = p(point)
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = fill
      ctx.fill()
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke() }
    }
    const text = (value: string, point: Point3, color = '#e2e8f0', size = 10, align: CanvasTextAlign = 'center') => {
      const pos = p(point)
      ctx.font = `700 ${size}px ui-sans-serif, system-ui, sans-serif`
      ctx.textAlign = align
      ctx.fillStyle = color
      ctx.fillText(value, pos.x, pos.y)
    }
    const arrow = (from: Point3, to: Point3, color: string, label?: string, width = 2) => {
      line([from, to], color, width)
      const a = p(from); const b = p(to)
      const angle = Math.atan2(b.y - a.y, b.x - a.x)
      const head = 7
      ctx.beginPath()
      ctx.moveTo(b.x, b.y)
      ctx.lineTo(b.x - head * Math.cos(angle - 0.48), b.y - head * Math.sin(angle - 0.48))
      ctx.lineTo(b.x - head * Math.cos(angle + 0.48), b.y - head * Math.sin(angle + 0.48))
      ctx.closePath(); ctx.fillStyle = color; ctx.fill()
      if (label) text(label, [to[0], to[1] + 0.15, to[2]], color, 10)
    }
    const ring = (center: Point3, radius: number, color: string, lineWidth = 3, segments = 72) => {
      const points: Point3[] = []
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2
        points.push([center[0] + radius * Math.cos(angle), center[1] + radius * Math.sin(angle), center[2]])
      }
      line(points, color, lineWidth)
    }
    const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, colors: [string, string, string], stroke?: string) => {
      const v: Point3[] = [[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]
      polygon([v[0],v[1],v[2],v[3]], colors[0], stroke)
      polygon([v[0],v[4],v[7],v[3]], colors[1], stroke)
      polygon([v[1],v[5],v[6],v[2]], colors[2], stroke)
      polygon([v[4],v[5],v[6],v[7]], colors[0], stroke)
    }
    const tube = (a: Point3, b: Point3, color: string, radius = 4) => {
      line([a, b], '#07111f', radius + 2)
      line([a, b], color, radius)
      dot(a, radius / 2, color)
      dot(b, radius / 2, color)
    }

    const background = ctx.createLinearGradient(0, 0, width, height)
    background.addColorStop(0, '#071526')
    background.addColorStop(0.56, '#10243a')
    background.addColorStop(1, '#1b2940')
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width, height)

    // Subtle ground grid communicates depth while keeping the apparatus readable.
    for (let i = -4; i <= 4; i++) {
      line([[i * 0.55, 0.02, -1.5], [i * 0.55, 0.02, 2.2]], 'rgba(125,211,252,.08)', 1)
    }
    for (let i = -2; i <= 4; i++) {
      line([[-2.3, 0.02, i * 0.45], [2.8, 0.02, i * 0.45]], 'rgba(125,211,252,.08)', 1)
    }

    // Plywood base, feet, and A-frame supports, modeled as shaded 3D faces.
    box(-2.45, 0.12, -0.75, 2.55, 0.27, 0.9, ['#b9824b', '#80552f', '#d2a06b'], '#edc28b')
    box(-2.15, 0.27, -0.52, -1.98, 1.22, -0.34, ['#c9955d', '#916036', '#d8ad78'], '#e6bb85')
    box(-2.15, 0.27, 0.38, -1.98, 1.22, 0.56, ['#bd8952', '#80552f', '#d5a56e'], '#e6bb85')
    box(-2.15, 1.05, -0.46, -1.98, 1.2, 0.5, ['#d3a26b', '#916036', '#e3b982'], '#edc28b')
    line([[-2.16,0.28,-0.43],[-1.4,1.04,-0.43],[-2.16,1.04,-0.43],[-2.16,0.28,-0.43]], '#9b6b3f', 6)
    line([[-2.16,0.28,0.46],[-1.4,1.04,0.46],[-2.16,1.04,0.46],[-2.16,0.28,0.46]], '#9b6b3f', 6)

    const angle = elapsed * config.omega
    const wheelCenter: Point3 = [-1.25, 1.75, 0]
    const wheelRadius = 1.03
    // Wheel rim: two concentric wooden rings with depth separation and spokes.
    ring([wheelCenter[0], wheelCenter[1], -0.12], wheelRadius, '#7b4728', 17)
    ring([wheelCenter[0], wheelCenter[1], -0.15], wheelRadius, '#d6a86f', 9)
    ring([wheelCenter[0], wheelCenter[1], 0.12], wheelRadius, '#704226', 12)
    ring([wheelCenter[0], wheelCenter[1], 0.15], wheelRadius, '#c38b50', 6)
    for (let i = 0; i < 6; i++) {
      const spokeAngle = angle + (i * Math.PI) / 3
      const end: Point3 = [wheelCenter[0] + Math.cos(spokeAngle) * 0.91, wheelCenter[1] + Math.sin(spokeAngle) * 0.91, 0.02]
      tube([wheelCenter[0], wheelCenter[1], 0.02], end, '#d8b27d', 9)
      line([[end[0],end[1],-0.02],[end[0],end[1],0.07]], '#f0d7ae', 1)
    }
    ring([wheelCenter[0], wheelCenter[1], 0.2], 0.23, '#e8d1a9', 10)
    dot([wheelCenter[0], wheelCenter[1], 0.24], 8, '#dce4e8', '#64748b')

    // Crank arm and rotating hand grip on the front face.
    const crankAngle = angle + 0.4
    const crankEnd: Point3 = [wheelCenter[0] + Math.cos(crankAngle) * 0.78, wheelCenter[1] + Math.sin(crankAngle) * 0.78, 0.27]
    tube([wheelCenter[0], wheelCenter[1], 0.27], crankEnd, '#aeb8bf', 7)
    tube([crankEnd[0], crankEnd[1], 0.27], [crankEnd[0] + 0.28, crankEnd[1], 0.27], '#f3a712', 9)

    // Drive belt and the small pulley attached to the dynamo shaft.
    const pulley: Point3 = [0.78, 1.05, 0]
    ring([pulley[0], pulley[1], -0.03], 0.25, '#171b22', 9)
    ring([pulley[0], pulley[1], 0.1], 0.2, '#8e9ba5', 5)
    line([[-1.02, 2.73, 0.02],[0.78,1.31,0.02]], '#141a21', 12)
    line([[-1.02, 2.73, 0.04],[0.78,1.31,0.04]], '#333a40', 5)
    line([[-1.48, 0.75, 0.02],[0.78,0.8,0.02]], '#141a21', 12)
    line([[-1.48, 0.75, 0.04],[0.78,0.8,0.04]], '#333a40', 5)

    // Dynamo can and mounting feet. The shell opacity is the X-ray control.
    box(0.38, 0.61, -0.5, 1.55, 1.36, 0.5, [`rgba(95,112,124,${0.96 - xray * 0.78})`,`rgba(45,58,68,${0.98 - xray * 0.75})`,`rgba(143,157,164,${0.9 - xray * 0.68})`], 'rgba(215,232,239,.75)')
    box(0.5, 0.43, -0.42, 0.68, 0.62, 0.4, ['#5b6670','#3d454d','#7b8790'])
    box(1.25, 0.43, -0.42, 1.43, 0.62, 0.4, ['#5b6670','#3d454d','#7b8790'])
    // End caps and cooling ribs on the metal housing.
    box(0.31, 0.68, -0.54, 0.42, 1.29, 0.54, ['#aebac0','#65737b','#d3dde0'], '#e4ecee')
    box(1.51, 0.68, -0.54, 1.62, 1.29, 0.54, ['#87949a','#58666d','#b6c3c8'], '#dce7ea')
    for (let rib = 0; rib < 5; rib++) {
      const x = 0.57 + rib * 0.16
      line([[x,0.7,-0.53],[x,1.27,-0.53]], 'rgba(226,237,240,.42)', 2)
      line([[x,0.7,0.53],[x,1.27,0.53]], 'rgba(43,55,62,.7)', 2)
    }

    // X-ray internal stator magnets, 3-D field lines, rotor coil and current arrows.
    if (xray > 0.08) {
      const visibility = clamp(xray, 0, 1)
      const fieldColor = `rgba(99,210,255,${0.25 + visibility * 0.64})`
      for (let j = -1; j <= 1; j++) {
        const z = j * 0.2
        line([[0.55,1.08,z],[0.7,1.08,z],[0.78,1.2,z],[1.16,1.2,z],[1.25,1.08,z],[1.39,1.08,z]], fieldColor, 1.6, [4,4])
        arrow([0.89,1.2,z],[1.08,1.2,z],fieldColor,undefined,1.3)
      }
      box(0.55, 0.87, -0.24, 0.78, 1.28, 0.24, [`rgba(220,58,54,${visibility})`,`rgba(130,24,33,${visibility})`,`rgba(255,103,87,${visibility})`], '#ffc1b8')
      box(1.16, 0.87, -0.24, 1.39, 1.28, 0.24, [`rgba(56,126,222,${visibility})`,`rgba(27,65,136,${visibility})`,`rgba(113,169,255,${visibility})`], '#c6dcff')
      text('N', [0.66,1.08,0.27], '#fff', 10)
      text('S', [1.27,1.08,0.27], '#fff', 10)

      const rotorX = 0.97
      const rotorY = 1.08
      const coilW = 0.2
      const coilH = 0.36
      const coilPoints: Point3[] = []
      for (const [u,v] of [[-coilW,-coilH],[coilW,-coilH],[coilW,coilH],[-coilW,coilH],[-coilW,-coilH]]) {
        const rx = u * Math.cos(angle) - v * Math.sin(angle)
        const ry = u * Math.sin(angle) + v * Math.cos(angle)
        coilPoints.push([rotorX + rx, rotorY + ry, 0.32])
      }
      line(coilPoints, '#ffc94a', 5)
      line(coilPoints.map(([x,y,z]) => [x,y,z - 0.48] as Point3), '#cf9a34', 3)
      for (let k = 0; k < 4; k++) line([coilPoints[k], [coilPoints[k][0],coilPoints[k][1],coilPoints[k][2] - 0.48]], '#e6b342', 3)
      const normalEnd: Point3 = [rotorX + Math.cos(angle) * 0.32, rotorY + Math.sin(angle) * 0.32, 0.42]
      arrow([rotorX,rotorY,0.42],normalEnd,'#d7c6ff','n',2)
      text(`θ ${toDegrees(angle).toFixed(0)}°`, [rotorX,0.71,0.4], '#e8dcff', 9)

      const rawCurrent = Math.sin(angle)
      const current = config.ringType === 'commutator' ? Math.abs(rawCurrent) : rawCurrent
      const currentColor = current >= 0 ? '#fb7185' : '#67e8f9'
      const currentAlpha = 0.3 + Math.abs(current) * 0.7
      const currentPath: Point3[] = current >= 0 ? [coilPoints[0],coilPoints[1],coilPoints[2]] : [coilPoints[2],coilPoints[1],coilPoints[0]]
      line(currentPath, `rgba(${current >= 0 ? '251,113,133' : '103,232,249'},${currentAlpha})`, 2 + Math.abs(current) * 3)
      arrow(currentPath[0], currentPath[1], currentColor, 'I', 1.5 + Math.abs(current) * 2)
      // Slip rings / split-ring commutator are visible behind the rotor.
      ring([rotorX, rotorY, -0.36], 0.12, config.ringType === 'commutator' ? '#f5ad43' : '#9fd8e8', 5, 48)
      ring([rotorX, rotorY, -0.43], 0.17, config.ringType === 'commutator' ? '#f5ad43' : '#9fd8e8', 4, 48)
      if (config.ringType === 'commutator') line([[rotorX,rotorY - 0.12,-0.35],[rotorX,rotorY + 0.12,-0.35]], '#17212a', 3)
    }

    // Lamp pedestal, red/blue body and glowing LED globe driven by instantaneous electrical power.
    box(1.92, 0.28, -0.34, 2.48, 1.08, 0.34, ['#17507a','#0d3151','#287ab0'], '#8bb6ce')
    box(1.84, 0.25, -0.38, 2.56, 0.36, 0.38, ['#c79358','#8d6037','#d6aa73'], '#e5c08e')
    const peak = Math.max(getPeakEmf(config), 0.0001)
    const rawEmf = peak * Math.sin(angle)
    const emf = config.ringType === 'commutator' ? Math.abs(rawEmf) : rawEmf
    const brightness = clamp(Math.abs(emf) / peak, 0, 1)
    const bulbCenter: Point3 = [2.2, 1.47, 0]
    const bulb = p(bulbCenter)
    const glow = ctx.createRadialGradient(bulb.x, bulb.y, 3, bulb.x, bulb.y, 42 + brightness * 36)
    glow.addColorStop(0, `rgba(255,255,226,${0.28 + brightness * 0.68})`)
    glow.addColorStop(0.35, `rgba(255,226,126,${0.12 + brightness * 0.38})`)
    glow.addColorStop(1, 'rgba(255,214,99,0)')
    ctx.fillStyle = glow
    ctx.beginPath(); ctx.arc(bulb.x, bulb.y, 82, 0, Math.PI * 2); ctx.fill()
    dot([2.2,1.15,0], 15, '#d9e0e1', '#fff1c8')
    const bulbGradient = ctx.createRadialGradient(bulb.x - 7, bulb.y - 9, 2, bulb.x, bulb.y, 27)
    bulbGradient.addColorStop(0, `rgba(255,255,245,${0.65 + brightness * 0.35})`)
    bulbGradient.addColorStop(1, `rgba(255,${Math.round(235 - brightness * 60)},${Math.round(210 - brightness * 120)},${0.55 + brightness * 0.45})`)
    ctx.beginPath(); ctx.ellipse(bulb.x, bulb.y, 24, 29, 0, 0, Math.PI * 2); ctx.fillStyle = bulbGradient; ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,.72)'; ctx.lineWidth = 1.3; ctx.stroke()
    text(`${Math.round(brightness * 100)}%`, [2.2,1.93,0], '#fff4bd', 9)

    // Flexible leads join the generator output to the lamp terminals.
    tube([1.54,0.78,0.47],[1.72,0.63,0.49],'#e24b48',3)
    tube([1.56,0.69,0.48],[1.87,0.57,0.49],'#242b32',3)

    // Clear glass-like front casing when X-ray is off; fade lets internal assembly show through.
    if (xray < 0.92) {
      const alpha = (1 - xray) * 0.2
      box(0.38,0.61,0.51,1.55,1.36,0.59,[`rgba(144,205,225,${alpha})`,`rgba(84,150,180,${alpha})`,`rgba(195,232,244,${alpha})`],`rgba(218,245,255,${0.12 + alpha})`)
    }

    // Labels and status overlay.
    ctx.fillStyle = 'rgba(3,10,20,.48)'
    ctx.fillRect(12, 12, 150, 43)
    ctx.fillStyle = '#e2e8f0'; ctx.font = '700 10px ui-sans-serif,system-ui'; ctx.textAlign = 'left'
    ctx.fillText('MODEL 3D · DINAMO ENGKOL', 22, 29)
    ctx.fillStyle = running ? '#34d399' : '#fbbf24'
    ctx.beginPath(); ctx.arc(24, 43, 3, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#cbd5e1'; ctx.font = '9px ui-sans-serif,system-ui'
    ctx.fillText(running ? 'Rotor bergerak' : 'Rotor dijeda', 33, 46)
  }, [camera, config, elapsed, running, xray])

  const startOrbit = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    dragRef.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const moveOrbit = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return
    const dx = event.clientX - dragRef.current.x
    const dy = event.clientY - dragRef.current.y
    dragRef.current = { ...dragRef.current, x: event.clientX, y: event.clientY }
    setCamera((value) => ({ yaw: value.yaw + dx * 0.008, pitch: clamp(value.pitch + dy * 0.006, -0.45, 0.8) }))
  }
  const endOrbit = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null
    setIsDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return (
    <div className="canvas-wrap three-dynamo-wrap">
      <canvas
        ref={canvasRef}
        aria-label="Simulasi 3D dinamo engkol dengan roda, sabuk, generator, magnet dan lampu. Seret untuk mengorbitkan kamera."
        onPointerDown={startOrbit}
        onPointerMove={moveOrbit}
        onPointerUp={endOrbit}
        onPointerCancel={endOrbit}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      />
      <div className="dynamo-tools" onPointerDown={(event) => event.stopPropagation()}>
        <label className="xray-control"><span>✦ X-RAY</span><input aria-label="Transparansi casing dinamo" type="range" min="0" max="100" value={Math.round(xray * 100)} onChange={(event) => setXray(Number(event.target.value) / 100)} /><b>{Math.round(xray * 100)}%</b></label>
        <button type="button" className="camera-reset" onClick={() => setCamera({ yaw: -0.42, pitch: 0.22 })} aria-label="Reset sudut kamera">↻ Kamera</button>
      </div>
      <div className="canvas-caption"><span>RODA · SABUK · DINAMO · LED</span><span>{config.ringType === 'commutator' ? 'KOMUTATOR · DC BERDENYUT' : 'CINCIN LUNCUR · AC'}</span></div>
      <div className="orbit-hint">SERET UNTUK MEMUTAR KAMERA</div>
    </div>
  )
}
