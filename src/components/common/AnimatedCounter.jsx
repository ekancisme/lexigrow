import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function AnimatedCounter({ value = 0, duration = 1.2, format = 'number', className = '' }) {
  const spanRef = useRef(null)
  const objRef = useRef({ val: 0 })

  useEffect(() => {
    const targetVal = typeof value === 'number' ? value : parseFloat(value) || 0
    const el = spanRef.current
    if (!el) return

    gsap.to(objRef.current, {
      val: targetVal,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        if (!spanRef.current) return
        const current = objRef.current.val
        if (format === 'percent') {
          spanRef.current.textContent = `${Math.round(current)}%`
        } else if (format === 'compact') {
          spanRef.current.textContent = Math.round(current).toLocaleString('vi-VN')
        } else {
          spanRef.current.textContent = Math.round(current)
        }
      }
    })
  }, [value, duration, format])

  return <span ref={spanRef} className={className}>{value}</span>
}
