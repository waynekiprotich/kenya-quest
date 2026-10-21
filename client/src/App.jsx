import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'motion/react'
import Nav, { Wordmark } from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import Cursor from './motion/Cursor.jsx'
import { Loading } from './components/ui.jsx'
import { pages } from './lib/routes.js'
import { scrollToTop, SmoothScroll, useLenis } from './motion/SmoothScroll.jsx'
import { EASE } from './motion/ease.js'

const Page = Object.fromEntries(Object.entries(pages).map(([name, load]) => [name, lazy(load)]))

const LABELS = {
  '': 'Discover',
  quests: 'Quests',
  places: 'Places',
  locations: 'Neighbourhoods',
  categories: 'Moods',
  search: 'Search',
}

function Shell({ children, label, first }) {
  const reduced = useReducedMotion()
  const lenis = useLenis()
  const main = useRef(null)
  // The new page mounts while the curtain still covers the old one.
  useLayoutEffect(() => {
    scrollToTop(lenis)
    if (!first) main.current?.focus({ preventScroll: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <motion.main
      id="main-content"
      ref={main}
      tabIndex={-1}
      className="site-main"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1, transition: { duration: reduced ? 0 : 0.55 } }}
    >
      {children}
      {!reduced && (
        <motion.div
          className="curtain"
          aria-hidden="true"
          initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          exit={{ clipPath: ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'] }}
          transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.span
            className="curtain-label"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -30 }}
            exit={{ opacity: [0, 1], y: [30, 0] }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {label}
          </motion.span>
          <span className="curtain-mark">
            <Wordmark />
          </span>
        </motion.div>
      )}
    </motion.main>
  )
}

function Pages() {
  const location = useLocation()
  const first = useRef(true)
  useEffect(() => {
    first.current = false
  }, [])
  const section = location.pathname.split('/')[1] ?? ''
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Shell key={location.pathname} label={LABELS[section] ?? 'Kenya Quest'} first={first.current}>
        <Suspense fallback={<Loading label="Opening the next page" />}>
          <Routes location={location}>
            <Route path="/" element={<Page.Home />} />
            <Route path="/quests" element={<Page.Quests />} />
            <Route path="/quests/:id" element={<Page.QuestDetail />} />
            <Route path="/places" element={<Page.Places />} />
            <Route path="/places/:id" element={<Page.PlaceDetail />} />
            <Route path="/locations" element={<Page.Locations />} />
            <Route path="/locations/:id" element={<Page.LocationDetail />} />
            <Route path="/categories" element={<Page.Categories />} />
            <Route path="/categories/:category" element={<Page.CategoryDetail />} />
            <Route path="/search" element={<Page.Search />} />
            <Route path="*" element={<Page.NotFound />} />
          </Routes>
        </Suspense>
      </Shell>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Nav />
        <Pages />
        <Footer />
        <Cursor />
      </SmoothScroll>
    </MotionConfig>
  )
}
