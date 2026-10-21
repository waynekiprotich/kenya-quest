import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { EASE } from './ease.js'

// Headings that rise line by line out of a mask. `lines` may contain markup.
// The trigger sits on the heading: masked lines are clipped, so they can't observe themselves.
export function Lines({
  as = 'h1',
  lines,
  className = '',
  delay = 0,
  stagger = 0.09,
  inView = false,
}) {
  const Tag = motion[as]
  const trigger = inView
    ? { whileInView: 'shown', viewport: { once: true, amount: 0.3 } }
    : { animate: 'shown' }
  return (
    <Tag className={className} initial="hidden" {...trigger}>
      {lines.map((line, index) => (
        <span className="line-mask" key={index}>
          <motion.span
            className="line-inner"
            variants={{
              hidden: { y: '108%', rotate: 2 },
              shown: {
                y: '0%',
                rotate: 0,
                transition: { duration: 1, delay: delay + index * stagger, ease: EASE },
              },
            }}
          >
            {line}
            {index < lines.length - 1 && ' '}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

// Paragraph copy that fades up word by word.
export function Words({ as: Tag = 'p', text, className = '', delay = 0, inView = true }) {
  const words = text.split(' ')
  const trigger = inView
    ? { initial: 'hidden', whileInView: 'shown', viewport: { once: true, amount: 0.4 } }
    : { initial: 'hidden', animate: 'shown' }
  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <motion.span
        aria-hidden="true"
        variants={{
          hidden: {},
          shown: { transition: { staggerChildren: 0.018, delayChildren: delay } },
        }}
        {...trigger}
      >
        {words.map((word, index) => (
          <motion.span
            key={index}
            className="word"
            variants={{ hidden: { opacity: 0, y: '0.5em' }, shown: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            {word}{' '}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  )
}

function Word({ progress, range, children }) {
  const opacity = useTransform(progress, range, [0.16, 1])
  return (
    <motion.span className="scrub-word" style={{ opacity }}>
      {children}{' '}
    </motion.span>
  )
}

// Words fill in as the paragraph scrolls through the viewport. *Starred* words
// render in the serif accent face.
export function ScrollWords({ text, className = '' }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.4'] })
  const words = text.split(' ')
  const plain = text.replaceAll('*', '')
  return (
    <p ref={ref} className={className}>
      <span className="sr-only">{plain}</span>
      <span aria-hidden="true">
        {words.map((word, index) => {
          const accent = word.startsWith('*')
          const clean = word.replaceAll('*', '')
          return (
            <Word
              key={index}
              progress={scrollYProgress}
              range={[index / words.length, (index + 1) / words.length]}
            >
              {accent ? <em>{clean}</em> : clean}
            </Word>
          )
        })}
      </span>
    </p>
  )
}
