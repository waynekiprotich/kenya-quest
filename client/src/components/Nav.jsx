import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { ArrowUpRight, Search } from 'lucide-react'
import { useTheme } from '../lib/theme.js'
import { warmRoute } from '../lib/routes.js'
import { useLenis } from '../motion/SmoothScroll.jsx'
import { Magnetic } from '../motion/effects.jsx'
import { EASE } from '../motion/ease.js'

const LINKS = [
  { to: '/quests', label: 'Quests' },
  { to: '/places', label: 'Places' },
  { to: '/locations', label: 'Neighbourhoods' },
  { to: '/categories', label: 'Moods' },
]

export function Wordmark() {
  return (
    <span className="wordmark">
      kenya<em>quest</em>
      <span className="wordmark-dot">.</span>
    </span>
  )
}

// A circular night / paper switch: the filled half turns over with the theme.
function ThemeToggle() {
  const { isDark, toggle } = useTheme()
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={isDark ? 'Switch to paper theme' : 'Switch to night theme'}
      data-cursor={isDark ? 'Paper' : 'Night'}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" className="theme-toggle-ring" />
        <motion.path
          d="M12 3.5a8.5 8.5 0 0 1 0 17z"
          className="theme-toggle-half"
          initial={false}
          animate={{ rotate: isDark ? 0 : 180 }}
          transition={{ duration: 0.6, ease: EASE }}
          style={{ originX: '0%', originY: '50%' }}
        />
      </svg>
    </button>
  )
}

export default function Nav() {
  const { pathname } = useLocation()
  const lenis = useLenis()
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [solid, setSolid] = useState(false)
  const toggle = useRef(null)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (value) => {
    const previous = scrollY.getPrevious() ?? 0
    setSolid(value > 24)
    setHidden(value > 320 && value > previous + 2)
  })

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    lenis?.stop()
    document.body.style.overflow = 'hidden'
    const close = (event) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', close)
    const button = toggle.current
    return () => {
      lenis?.start()
      document.body.style.overflow = ''
      window.removeEventListener('keydown', close)
      button?.focus({ preventScroll: true })
    }
  }, [open, lenis])

  // Detail pages open on a full-bleed photo, so the bar starts light-on-dark there.
  const overPhoto = /^\/(quests|places|locations)\/[^/]+/.test(pathname) && !solid && !open
  return (
    <motion.header
      className="site-header"
      data-solid={solid || open}
      data-over-photo={overPhoto}
      animate={{ y: hidden && !open ? '-100%' : '0%' }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <nav className="nav" aria-label="Main">
        <Link to="/" className="nav-brand" aria-label="Kenya Quest home">
          <Wordmark />
        </Link>
        <div className="nav-links">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="nav-link"
              onPointerEnter={() => warmRoute(link.to)}
              onFocus={() => warmRoute(link.to)}
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <motion.span
                      className="nav-link-line"
                      layoutId="nav-line"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
        <div className="nav-actions">
          <Link to="/search" className="icon-button" aria-label="Search">
            <Search size={18} />
          </Link>
          <ThemeToggle />
          <Magnetic strength={0.25} className="nav-cta-wrap">
            <Link to="/quests" className="button button-lime nav-cta">
              Start a quest <ArrowUpRight size={16} />
            </Link>
          </Magnetic>
          <button
            ref={toggle}
            type="button"
            className="menu-button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(!open)}
          >
            <span className="menu-button-lines" data-open={open} aria-hidden="true">
              <span />
              <span />
            </span>
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="mobile-menu"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <nav aria-label="Mobile">
              {[{ to: '/', label: 'Discover' }, ...LINKS, { to: '/search', label: 'Search' }].map(
                (link, index) => (
                  <div className="line-mask" key={link.to}>
                    <motion.div
                      initial={{ y: '110%' }}
                      animate={{ y: '0%' }}
                      transition={{ duration: 0.7, delay: 0.15 + index * 0.05, ease: EASE }}
                    >
                      <Link to={link.to} className="mobile-link" autoFocus={index === 0}>
                        <small>{String(index + 1).padStart(2, '0')}</small>
                        {link.label}
                      </Link>
                    </motion.div>
                  </div>
                ),
              )}
            </nav>
            <motion.p
              className="mobile-menu-foot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Go somewhere. Do something. Make a memory.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
