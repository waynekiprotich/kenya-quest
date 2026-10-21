import { Link } from 'react-router-dom'
import { ArrowUp, ArrowUpRight } from 'lucide-react'
import { Wordmark } from './Nav.jsx'
import { Magnetic } from '../motion/effects.jsx'
import { useLenis } from '../motion/SmoothScroll.jsx'

const EXPLORE = [
  ['/quests', 'Quests'],
  ['/places', 'Places'],
  ['/locations', 'Neighbourhoods'],
  ['/categories', 'Moods'],
  ['/search', 'Search'],
]
// Accounts do not exist yet; these are labelled placeholders, not links.
const SOCIAL = ['Instagram', 'TikTok', 'YouTube']

export default function Footer() {
  const lenis = useLenis()
  const year = new Date().getFullYear()

  function toTop() {
    if (lenis) lenis.scrollTo(0, { duration: 1.2 })
    else window.scrollTo({ top: 0 })
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <Link to="/" className="footer-brand" aria-label="Kenya Quest home">
            <Wordmark />
          </Link>
          <p className="footer-tag">
            Go somewhere. Do something. Make a <em>memory.</em>
          </p>
          <Magnetic strength={0.25}>
            <Link to="/quests" className="button button-lime" data-cursor="Go">
              Pick a quest <ArrowUpRight size={17} />
            </Link>
          </Magnetic>
        </div>
        <div className="footer-grid">
          <nav aria-label="Footer">
            <p className="footer-label">Explore</p>
            <ul>
              {EXPLORE.map(([to, label]) => (
                <li key={to}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="footer-label">Follow</p>
            <ul className="footer-social">
              {SOCIAL.map((name) => (
                <li key={name}>
                  {name} <span>Soon</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="footer-label">Good to know</p>
            <p>Progress and saved ideas stay on this device. No account, no tracking.</p>
            <p>Venue details and offers are guide estimates. Confirm before you go.</p>
          </div>
          <div>
            <p className="footer-label">Credits</p>
            <p>
              Nairobi skyline:{' '}
              <a href="https://commons.wikimedia.org/wiki/File:Nairobi_skyline_from_Uhuru_Park.jpg">
                Ephymbaya
              </a>
              , <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Other
              photos via Unsplash. Map data © OpenStreetMap contributors.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {year} Kenya Quest</span>
          <span>Nairobi, Kenya · 1°17′S 36°49′E</span>
          <button type="button" className="text-link" onClick={toTop}>
            Back to top <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  )
}
