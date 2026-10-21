import { useEffect, useRef, useState } from 'react'
import {
  animate,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from 'motion/react'
import { EASE } from './ease.js'

export function Reveal({ children, className = '', delay = 0, y = 32, as = 'div', ...rest }) {
  const Component = motion[as]
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </Component>
  )
}

// Pulls toward the pointer while hovered, then springs back.
export function Magnetic({ children, strength = 0.3, className = '' }) {
  const x = useSpring(0, { stiffness: 220, damping: 16, mass: 0.5 })
  const y = useSpring(0, { stiffness: 220, damping: 16, mass: 0.5 })
  const reduced = useReducedMotion()
  function move(event) {
    if (reduced || event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    x.set((event.clientX - rect.left - rect.width / 2) * strength)
    y.set((event.clientY - rect.top - rect.height / 2) * strength)
  }
  function leave() {
    x.set(0)
    y.set(0)
  }
  return (
    <motion.span
      className={`magnetic ${className}`}
      style={{ x, y }}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      {children}
    </motion.span>
  )
}

// An endless ribbon of text whose speed and direction follow the scroll.
export function Marquee({ items, speed = 3.5, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref)
  const reduced = useReducedMotion()
  const base = useMotionValue(0)
  const { scrollY } = useScroll()
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 })
  const boost = useTransform(velocity, [-1500, 0, 1500], [-5, 0, 5], { clamp: false })
  const direction = useRef(-1)
  const x = useTransform(base, (value) => `${wrap(-50, 0, value)}%`)
  useAnimationFrame((_, delta) => {
    if (reduced || !inView) return
    const factor = boost.get()
    if (factor < -0.05) direction.current = 1
    else if (factor > 0.05) direction.current = -1
    const step = direction.current * speed * (delta / 1000)
    base.set(base.get() + step + step * Math.abs(factor))
  })
  return (
    <div ref={ref} className={`marquee ${className}`} aria-hidden="true">
      <motion.div className="marquee-track" style={{ x }}>
        {[0, 1].map((copy) => (
          <div className="marquee-group" key={copy}>
            {items.map((item) => (
              <span className="marquee-item" key={item}>
                {item}
                <svg className="marquee-star" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
                </svg>
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// An image that drifts inside its frame as the page scrolls.
export function Parallax({ src, srcSet, sizes, alt = '', className = '', amount = 0.12, eager }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [`${-amount * 100}%`, `${amount * 100}%`])
  const [loaded, setLoaded] = useState(false)
  return (
    <div ref={ref} className={`parallax ${className}`}>
      {src && (
        <motion.img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : undefined}
          decoding="async"
          onLoad={() => setLoaded(true)}
          data-loaded={loaded}
          style={{ y, scale: 1 + amount * 2.2 }}
        />
      )}
    </div>
  )
}

// Counts up once when scrolled into view.
export function Counter({ value, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(reduced ? value : 0)
  useEffect(() => {
    if (!inView) return
    if (reduced) {
      setShown(value)
      return
    }
    const controls = animate(0, value, {
      duration: 1.2,
      ease: EASE,
      onUpdate: (latest) => setShown(Math.round(latest)),
    })
    return () => controls.stop()
  }, [inView, value, reduced])
  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  )
}
