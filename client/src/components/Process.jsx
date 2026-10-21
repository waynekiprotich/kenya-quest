import { useRef } from 'react'
import { gsap, useScrollMotion } from '../motion/gsap.js'

const STEPS = [
  {
    title: 'Pick your kind of day.',
    text: 'Forest, food, history or a giraffe at eye level. Every quest fits a mood, a budget and a corner of the city.',
  },
  {
    title: 'Go. Tick off five things.',
    text: 'Each quest links real places with five small tasks. Walk them in order or wander. There is no timer.',
  },
  {
    title: 'Keep the memory.',
    text: 'Progress stays on your device. Finish a quest, earn the stamp, and come back when the city calls again.',
  },
]

// Three oversized steps. Each number fills with lime as it scrolls through the
// viewport, and its rule draws across.
export default function Process({ completed = 0 }) {
  const ref = useRef(null)

  useScrollMotion(ref, ({ motion }) => {
    for (const step of gsap.utils.toArray('.process-step')) {
      const fill = step.querySelector('.process-number-fill')
      const parts = step.querySelectorAll('.process-reveal')
      if (!motion) {
        gsap.set(fill, { clipPath: 'inset(0% 0% 0% 0%)' })
        gsap.from(parts, {
          opacity: 0,
          duration: 0.35,
          scrollTrigger: { trigger: step, start: 'top 80%' },
        })
        continue
      }
      gsap.fromTo(
        fill,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          ease: 'none',
          scrollTrigger: { trigger: step, start: 'top 85%', end: 'center 45%', scrub: true },
        },
      )
      gsap.fromTo(
        step.querySelector('.process-rule'),
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: step, start: 'top 90%', end: 'top 40%', scrub: true },
        },
      )
      gsap.from(parts, {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: step, start: 'top 72%' },
      })
    }
  })

  return (
    <section ref={ref} className="process" id="how" aria-labelledby="process-title">
      <header className="process-head">
        <p className="eyebrow">(04) How it works</p>
        <h2 id="process-title">
          Three steps. <em>No sign-up.</em>
        </h2>
      </header>
      <ol className="process-list">
        {STEPS.map((step, index) => {
          const number = String(index + 1).padStart(2, '0')
          return (
            <li key={step.title} className="process-step">
              <span className="process-rule" aria-hidden="true" />
              <p className="process-number" aria-hidden="true">
                <span className="process-number-outline">{number}</span>
                <span className="process-number-fill">{number}</span>
              </p>
              <div className="process-copy">
                <h3 className="process-reveal">
                  <span className="sr-only">Step {index + 1}: </span>
                  {step.title}
                </h3>
                <p className="process-reveal">{step.text}</p>
              </div>
            </li>
          )
        })}
      </ol>
      {completed > 0 && (
        <p className="progress-note">
          You’ve completed {completed} {completed === 1 ? 'quest' : 'quests'}. There’s always
          another story.
        </p>
      )}
    </section>
  )
}
