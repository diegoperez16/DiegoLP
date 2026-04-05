import { useRef, useEffect, useLayoutEffect, Children, useState } from 'react'
import { gsap } from 'gsap'
import './CardSwap.css'

// ── Internal Card wrapper ─────────────────────────────────────────
export function Card({ children, style, className = '' }) {
  return (
    <div className={`cs-card ${className}`} style={style}>
      {children}
    </div>
  )
}

// ── CardSwap core ─────────────────────────────────────────────────
export function CardSwap({
  children,
  cardDistance = 55,
  verticalDistance = 60,
  delay = 4500,
  pauseOnHover = true,
  onCardClick,
  activeIndex,
}) {
  const containerRef = useRef(null)
  const cardRefs = useRef([])
  const intervalRef = useRef(null)
  const isAnimating = useRef(false)
  const [order, setOrder] = useState(() => Children.toArray(children).map((_, i) => i))

  const cards = Children.toArray(children)
  const total = cards.length

  function getZIndex(posInStack) {
    return total - posInStack
  }

  function applyLayout(currentOrder, animate = true) {
    currentOrder.forEach((cardIndex, stackPos) => {
      const el = cardRefs.current[cardIndex]
      if (!el) return

      const isTop = stackPos === 0
      const xOffset = stackPos * (cardDistance * 0.18)
      const yOffset = stackPos * (verticalDistance * 0.22)
      const scale = 1 - stackPos * 0.055
      const rotateY = isTop ? 0 : -8 - stackPos * 4
      const rotateX = isTop ? 0 : 6 + stackPos * 2

      const props = {
        x: xOffset,
        y: yOffset,
        z: -stackPos * cardDistance,
        scale,
        rotateY,
        rotateX,
        zIndex: getZIndex(stackPos),
        opacity: Math.max(0.25, 1 - stackPos * 0.2),
        duration: animate ? 0.7 : 0,
        ease: 'power3.out',
      }

      gsap.to(el, props)
    })
  }

  function cycleToNext() {
    if (isAnimating.current) return
    isAnimating.current = true

    setOrder(prev => {
      const next = [...prev.slice(1), prev[0]]
      applyLayout(next, true)
      setTimeout(() => { isAnimating.current = false }, 750)
      return next
    })
  }

  useLayoutEffect(() => {
    applyLayout(order, false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const start = () => {
      intervalRef.current = setInterval(cycleToNext, delay)
    }
    const stop = () => clearInterval(intervalRef.current)

    start()
    if (pauseOnHover) {
      const el = containerRef.current
      el?.addEventListener('mouseenter', stop)
      el?.addEventListener('mouseleave', start)
    }
    return () => {
      clearInterval(intervalRef.current)
      const el = containerRef.current
      el?.removeEventListener('mouseenter', stop)
      // eslint-disable-next-line react-hooks/exhaustive-deps
      el?.removeEventListener('mouseleave', start)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, pauseOnHover])

  function handleCardClick(cardIndex, stackPos) {
    if (stackPos === 0) {
      // Top card clicked → select it
      onCardClick?.(cardIndex)
    } else {
      // Non-top card clicked → bring to front
      const el = cardRefs.current[order[0]]
      if (el) {
        gsap.to(el, { x: -60, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: cycleToNext })
      } else {
        cycleToNext()
      }
    }
  }

  return (
    <div className="cs-container" ref={containerRef}>
      {cards.map((child, cardIndex) => {
        const stackPos = order.indexOf(cardIndex)
        const isActive = activeIndex === cardIndex
        return (
          <div
            key={cardIndex}
            ref={el => { cardRefs.current[cardIndex] = el }}
            className={`cs-card-wrapper ${isActive ? 'cs-active' : ''}`}
            onClick={() => handleCardClick(cardIndex, stackPos)}
          >
            {child}
          </div>
        )
      })}
    </div>
  )
}
