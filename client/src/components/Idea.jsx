import { useRef } from 'react'
import { gsap, useScrollMotion } from '../motion/gsap.js'
import { Marquee } from '../motion/effects.jsx'

const STATEMENT = 'Most cities get visited. Nairobi deserves to be *explored.*'
const PLACES = ['Karura', 'Karen', 'Westlands', 'Museum Hill', 'KICC', 'Kilimani', 'Gigiri']

// The lime break after the hero. Its diagonal edge flattens as it arrives and the
// statement fills in word by word with the scroll.
export default function Idea() {
  const ref = useRef(null)
  const words = STATEMENT.split(' ')

  useScrollMotion(ref, ({ motion }) => {
    const section = ref.current
    if (!motion) {
      gsap.from(section.querySelectorAll('.idea-fade'), {
        opacity: 0,
        duration: 0.4,
        scrollTrigger: { trigger: section, start: 'top 75%' },
      })
      return
    }
    gsap.fromTo(
      section,
      { '--cut': '16vw' },
      {
        '--cut': '0vw',
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 25%', scrub: true },
      },
    )
    gsap.fromTo(
      section.querySelectorAll('.idea-word'),
      { opacity: 0.14, y: '0.18em' },
      {
        opacity: 1,
        y: 0,
        stagger: 0.12,
        ease: 'none',
        scrollTrigger: {
          trigger: section.querySelector('.idea-text'),
          start: 'top 82%',
          end: 'bottom 48%',
          scrub: true,
        },
      },
    )
    gsap.from(section.querySelectorAll('.idea-fade'), {
      y: 24,
      opacity: 0,
      duration: 0.9,
      stagger: 0.1,
      ease: 'expo.out',
      scrollTrigger: { trigger: section, start: 'top 60%' },
    })
  })

  return (
    <section ref={ref} className="idea" id="idea" aria-labelledby="idea-label">
      <div className="idea-inner">
        <p className="idea-label idea-fade" id="idea-label">
          <span aria-hidden="true">(01)</span> The idea
        </p>
        <p className="idea-text">
          <span className="sr-only">{STATEMENT.replaceAll('*', '')}</span>
          <span aria-hidden="true">
            {words.map((word, index) => {
              const accent = word.startsWith('*')
              const clean = word.replaceAll('*', '')
              return (
                <span className="idea-word" key={index}>
                  {accent ? <em>{clean}</em> : clean}{' '}
                </span>
              )
            })}
          </span>
        </p>
        <div className="idea-foot">
          <p className="idea-fade">
            Kenya Quest turns the city into five small adventures: real places, five tasks each, and
            progress that stays on your phone.
          </p>
          <p className="idea-fade idea-note">No account. No booking. Just go.</p>
        </div>
      </div>
      <Marquee items={PLACES} className="idea-marquee" />
    </section>
  )
}
