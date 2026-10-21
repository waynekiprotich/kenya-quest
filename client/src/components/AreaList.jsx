import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform, useVelocity } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { Img } from './ui.jsx'
import { prefetch } from '../lib/api.js'
import { EASE } from '../motion/ease.js'

const pad = (n) => String(n).padStart(2, '0')

// A typographic index of neighbourhoods. With a mouse, a photo trails the pointer
// and leans with its speed; touch screens show an inline thumbnail instead.
export default function AreaList({ areas }) {
  const list = useRef(null)
  const [active, setActive] = useState(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 160, damping: 20, mass: 0.6 })
  const springY = useSpring(y, { stiffness: 160, damping: 20, mass: 0.6 })
  const rotate = useTransform(useVelocity(springX), [-1400, 1400], [-14, 14], { clamp: true })

  function move(event) {
    if (event.pointerType !== 'mouse') return
    const rect = list.current.getBoundingClientRect()
    x.set(event.clientX - rect.left)
    y.set(event.clientY - rect.top)
  }

  return (
    <div
      ref={list}
      className="area-list"
      onPointerMove={move}
      onPointerLeave={() => setActive(null)}
    >
      {areas.map((area, index) => {
        const path = `/locations/${area.id}`
        return (
          <motion.div
            key={area.id}
            className="area-row-wrap"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: index * 0.06, ease: EASE }}
          >
            <Link
              to={path}
              className="area-row"
              data-active={active === index}
              data-dimmed={active !== null && active !== index}
              data-cursor="Explore"
              onPointerEnter={() => {
                setActive(index)
                prefetch(path)
              }}
              onFocus={() => prefetch(path)}
            >
              <span className="area-index">{pad(index + 1)}</span>
              <span className="area-name">{area.name}</span>
              <span className="area-tagline">{area.tagline}</span>
              <span className="area-count">
                {area.questCount} {area.questCount === 1 ? 'quest' : 'quests'} · {area.placeCount}{' '}
                places
              </span>
              <Img className="area-thumb" src={area.image} sizes="96px" />
              <ArrowUpRight className="area-arrow" size={26} />
            </Link>
          </motion.div>
        )
      })}
      <motion.div
        className="area-preview"
        style={{ x: springX, y: springY, rotate }}
        initial={false}
        animate={{ scale: active === null ? 0.4 : 1, opacity: active === null ? 0 : 1 }}
        transition={{ duration: 0.4, ease: EASE }}
        aria-hidden="true"
      >
        {areas.map((area, index) => (
          <motion.div
            key={area.id}
            className="area-preview-image"
            initial={false}
            animate={{ clipPath: active === index ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)' }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <Img src={area.image} sizes="320px" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
