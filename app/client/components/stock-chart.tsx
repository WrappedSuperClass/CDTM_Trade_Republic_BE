"use client"

import { useEffect, useRef } from "react"

export default function StockChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Chart data points (simplified version of the chart in the image)
    const data = [
      { x: 0, y: 180 },
      { x: 20, y: 150 },
      { x: 40, y: 170 },
      { x: 60, y: 140 },
      { x: 80, y: 160 },
      { x: 100, y: 130 },
      { x: 120, y: 150 },
      { x: 140, y: 120 },
      { x: 160, y: 140 },
      { x: 180, y: 160 },
      { x: 200, y: 130 },
      { x: 220, y: 150 },
      { x: 240, y: 170 },
      { x: 260, y: 90 },
      { x: 280, y: 60 },
      { x: 300, y: 100 },
      { x: 320, y: 40 },
      { x: 340, y: 80 },
      { x: 360, y: 120 },
      { x: 380, y: 100 },
      { x: 400, y: 140 },
      { x: 420, y: 120 },
      { x: 440, y: 160 },
      { x: 460, y: 140 },
      { x: 480, y: 120 },
      { x: 500, y: 140 },
      { x: 520, y: 130 },
      { x: 540, y: 140 },
      { x: 560, y: 130 },
      { x: 580, y: 140 },
    ]

    // Scale data to fit canvas
    const width = rect.width
    const height = rect.height
    const baselineY = height * 0.7 // Position of the baseline

    // Draw baseline (dotted line)
    ctx.beginPath()
    ctx.strokeStyle = "#333"
    ctx.setLineDash([2, 2])
    ctx.moveTo(0, baselineY)
    ctx.lineTo(width, baselineY)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw time labels
    const timeLabels = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"]
    ctx.fillStyle = "#666"
    ctx.font = "10px Arial"
    ctx.textAlign = "center"

    timeLabels.forEach((label, index) => {
      const x = (width / (timeLabels.length - 1)) * index
      ctx.fillText(label, x, height - 5)
    })

    // Draw chart line
    ctx.beginPath()
    ctx.strokeStyle = "#22c55e" // Green color
    ctx.lineWidth = 2

    // Scale data points to fit canvas
    const scaleX = width / (data.length - 1)
    const minY = Math.min(...data.map((point) => point.y))
    const maxY = Math.max(...data.map((point) => point.y))
    const scaleY = (height * 0.6) / (maxY - minY)

    // Start point
    const startX = data[0].x * (width / 580)
    const startY = height - (data[0].y - minY) * scaleY - height * 0.2
    ctx.moveTo(startX, startY)

    // Draw curved line using bezier curves
    for (let i = 0; i < data.length - 1; i++) {
      const currentX = data[i].x * (width / 580)
      const currentY = height - (data[i].y - minY) * scaleY - height * 0.2

      const nextX = data[i + 1].x * (width / 580)
      const nextY = height - (data[i + 1].y - minY) * scaleY - height * 0.2

      // Control points for the curve
      const cpX1 = currentX + (nextX - currentX) / 2
      const cpY1 = currentY
      const cpX2 = currentX + (nextX - currentX) / 2
      const cpY2 = nextY

      // Draw the curve
      ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, nextX, nextY)
    }

    ctx.stroke()

    // Add gradient fill under the line
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, "rgba(34, 197, 94, 0.2)")
    gradient.addColorStop(1, "rgba(34, 197, 94, 0)")

    // Complete the path for filling
    const lastX = data[data.length - 1].x * (width / 580)
    const lastY = height - (data[data.length - 1].y - minY) * scaleY - height * 0.2

    ctx.lineTo(lastX, height)
    ctx.lineTo(startX, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />
}
