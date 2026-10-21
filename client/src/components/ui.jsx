import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { imageSet, imageUrl } from '../lib/images.js'
import { Lines, Words } from '../motion/text.jsx'

// A photo that fades in once decoded and falls back to a tinted panel.
export function Img({
  src,
  alt = '',
  sizes = '(min-width: 1024px) 33vw, 100vw',
  className = '',
  eager,
}) {
  const [state, setState] = useState('loading')
  return (
    <div className={`img ${className}`} data-state={state}>
      {src && state !== 'error' && (
        <img
          src={imageUrl(src)}
          srcSet={imageSet(src)}
          sizes={sizes}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : undefined}
          decoding="async"
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
        />
      )}
    </div>
  )
}

export function PageHeader({ eyebrow, lines, description, aside, children }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && (
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            {eyebrow}
          </motion.p>
        )}
        <Lines lines={lines} className="page-title" delay={0.15} />
        {description && (
          <Words text={description} className="page-description" delay={0.35} inView={false} />
        )}
        {children}
      </div>
      {aside && <div className="page-header-aside">{aside}</div>}
    </header>
  )
}

export function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map(([label, to], index) => (
        <span key={label}>
          {index > 0 && <span aria-hidden="true">/</span>}
          {to ? <Link to={to}>{label}</Link> : <span aria-current="page">{label}</span>}
        </span>
      ))}
    </nav>
  )
}

// Filter chips with a highlight that slides between the selected options.
export function Chips({ options, value, onChange, label, id }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            className="chip"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
          >
            {selected && (
              <motion.span
                className="chip-fill"
                layoutId={`chip-${id}`}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="chip-label">
              {option.label}
              {option.count != null && <small>{option.count}</small>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <Lines as="h2" lines={Array.isArray(title) ? title : [title]} inView />
      </div>
      {action}
    </div>
  )
}

export function Loading({ label = 'Loading' }) {
  return (
    <div className="loading" role="status">
      <span className="loading-bar" />
      {label}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <p className="eyebrow">Signal lost</p>
      <h2>We couldn’t load this adventure.</h2>
      <p>
        {error?.status === 404 ? 'This page could not be found.' : 'Please try again in a moment.'}
      </p>
      {onRetry && (
        <button type="button" className="button button-ink" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>
}
