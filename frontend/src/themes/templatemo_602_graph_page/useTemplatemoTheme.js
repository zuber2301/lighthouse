import { useEffect } from 'react'

export default function useTemplatemoTheme() {
  useEffect(() => {
    function drawMiniChart(canvasId, color) {
      const canvas = document.getElementById(canvasId)
      if (!canvas) return
      const ctx = canvas.getContext && canvas.getContext('2d')
      if (!ctx) return

      // set logical size
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.floor(canvas.offsetWidth * dpr)
      canvas.height = Math.floor(canvas.offsetHeight * dpr)
      canvas.style.width = `${canvas.offsetWidth}px`
      canvas.style.height = `${canvas.offsetHeight}px`
      ctx.scale && ctx.scale(dpr, dpr)

      // generate simple random-ish data
      const points = []
      const h = canvas.offsetHeight
      for (let i = 0; i < 10; i++) {
        points.push(10 + Math.random() * (h - 20))
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 2

      points.forEach((p, i) => {
        const x = (canvas.offsetWidth / (points.length - 1)) * i
        const y = p
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      // fill
      ctx.lineTo(canvas.offsetWidth, canvas.offsetHeight)
      ctx.lineTo(0, canvas.offsetHeight)
      ctx.closePath()
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight)
      gradient.addColorStop(0, color + '40')
      gradient.addColorStop(1, color + '00')
      ctx.fillStyle = gradient
      ctx.fill()
    }

    // init charts
    const initTimeout = window.setTimeout(() => {
      drawMiniChart('miniChart1', '#00ffcc')
      drawMiniChart('miniChart2', '#ff0080')
      drawMiniChart('miniChart3', '#00ccff')
    }, 120)

    // animate stat cards into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target
          if (entry.isIntersecting) {
            el.style.transform = 'translateY(0)'
            el.style.opacity = '1'
          }
        })
      },
      { threshold: 0.35 }
    )

    document.querySelectorAll('[data-theme="graph-stat-card"]').forEach((el) => observer.observe(el))

    // cleanup
    return () => {
      window.clearTimeout(initTimeout)
      observer.disconnect()
    }
  }, [])
}
