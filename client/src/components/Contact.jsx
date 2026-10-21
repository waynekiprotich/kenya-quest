import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Check } from 'lucide-react'
import { BUDGETS, IDEA_LIMIT, saveIdea, validateIdea } from '../lib/ideas.js'
import { useStageView } from './stage-context.js'
import { gsap, useScrollMotion } from '../motion/gsap.js'
import { Magnetic } from '../motion/effects.jsx'
import { EASE } from '../motion/ease.js'

const EMPTY = { name: '', email: '', idea: '', budget: '' }
const ORDER = ['name', 'email', 'idea', 'budget']

function browserStorage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function Field({ id, label, error, children, hint }) {
  return (
    <div className="field" data-invalid={Boolean(error)}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}

// A suggestion form that works without a backend: it validates, then keeps the idea
// in this browser only, and says exactly that.
export default function Contact() {
  const section = useRef(null)
  const success = useRef(null)
  const inputs = useRef({})
  const returning = useRef(false)
  const [fields, setFields] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [attempted, setAttempted] = useState(false)
  const [result, setResult] = useState(null)
  useStageView('contact', section)

  useScrollMotion(section, ({ motion }) => {
    gsap.from('.contact-reveal', {
      y: motion ? 40 : 0,
      opacity: 0,
      duration: motion ? 1 : 0.35,
      stagger: 0.08,
      ease: 'expo.out',
      scrollTrigger: { trigger: section.current, start: 'top 70%' },
    })
  })

  function update(event) {
    const next = { ...fields, [event.target.name]: event.target.value }
    setFields(next)
    if (attempted) setErrors(validateIdea(next))
  }

  function submit(event) {
    event.preventDefault()
    const found = validateIdea(fields)
    setAttempted(true)
    setErrors(found)
    const first = ORDER.find((key) => found[key])
    if (first) {
      inputs.current[first]?.focus()
      return
    }
    const stored = saveIdea(browserStorage(), fields)
    setResult({ name: fields.name.trim().split(/\s+/)[0], stored })
    setFields(EMPTY)
    setAttempted(false)
    setErrors({})
  }

  const described = (key) => (errors[key] ? `idea-${key}-error` : undefined)
  const errorCount = Object.keys(errors).length

  return (
    <section ref={section} className="contact" id="contact" aria-labelledby="contact-title">
      <div className="contact-inner">
        <div className="contact-intro">
          <p className="eyebrow contact-reveal">(05) Suggest a quest</p>
          <h2 id="contact-title" className="contact-reveal">
            Have an idea <em>worth exploring?</em>
          </h2>
          <p className="contact-lede contact-reveal">
            A street, a view, a plate or a whole day in Nairobi. Describe it and we will shape it
            into five small tasks.
          </p>
          <p className="contact-note contact-reveal">
            Kenya Quest has no inbox yet. Ideas are saved in this browser only and are never sent
            anywhere.
          </p>
        </div>

        <div className="contact-panel contact-reveal">
          <AnimatePresence mode="wait" initial={false}>
            {result ? (
              <motion.div
                key="done"
                ref={success}
                tabIndex={-1}
                className="contact-success"
                role="status"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
                onAnimationStart={() => success.current?.focus()}
              >
                <span className="contact-success-mark" aria-hidden="true">
                  <Check size={26} strokeWidth={2.6} />
                </span>
                <h3>{result.stored ? `Saved, ${result.name}.` : `Thanks, ${result.name}.`}</h3>
                <p>
                  {result.stored
                    ? 'Your idea is stored in this browser. Nothing was sent to a server, because Kenya Quest does not have one for messages yet.'
                    : 'This browser blocks storage, so the idea could not be kept. Nothing was sent anywhere.'}
                </p>
                <button
                  type="button"
                  className="button button-line"
                  onClick={() => {
                    returning.current = true
                    setResult(null)
                  }}
                >
                  Write another idea
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                className="contact-form"
                noValidate
                onSubmit={submit}
                onAnimationStart={() => {
                  if (!returning.current) return
                  returning.current = false
                  inputs.current.name?.focus()
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {attempted && errorCount > 0 && (
                  <p className="form-alert" role="alert">
                    {errorCount === 1 ? 'One field needs' : `${errorCount} fields need`} a second
                    look.
                  </p>
                )}
                <div className="field-row">
                  <Field id="idea-name" label="Name" error={errors.name}>
                    <input
                      ref={(element) => {
                        inputs.current.name = element
                      }}
                      id="idea-name"
                      name="name"
                      autoComplete="name"
                      required
                      value={fields.name}
                      onChange={update}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={described('name')}
                    />
                  </Field>
                  <Field id="idea-email" label="Email" error={errors.email}>
                    <input
                      ref={(element) => {
                        inputs.current.email = element
                      }}
                      id="idea-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      required
                      value={fields.email}
                      onChange={update}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={described('email')}
                    />
                  </Field>
                </div>
                <Field
                  id="idea-text"
                  label="Your quest idea"
                  error={errors.idea}
                  hint={
                    <p className="field-hint" id="idea-text-count" aria-live="off">
                      {fields.idea.trim().length} / {IDEA_LIMIT}
                    </p>
                  }
                >
                  <textarea
                    ref={(element) => {
                      inputs.current.idea = element
                    }}
                    id="idea-text"
                    name="idea"
                    rows={5}
                    required
                    maxLength={IDEA_LIMIT + 200}
                    placeholder="Where would you send a friend, and what should they do there?"
                    value={fields.idea}
                    onChange={update}
                    aria-invalid={Boolean(errors.idea)}
                    aria-describedby={[described('idea'), 'idea-text-count']
                      .filter(Boolean)
                      .join(' ')}
                  />
                </Field>
                <fieldset
                  className="field budget"
                  data-invalid={Boolean(errors.budget)}
                  aria-describedby={described('budget')}
                >
                  <legend>Budget per person</legend>
                  <div className="budget-options">
                    {BUDGETS.map((budget, index) => (
                      <label key={budget} className="budget-option">
                        <input
                          ref={
                            index === 0
                              ? (element) => {
                                  inputs.current.budget = element
                                }
                              : undefined
                          }
                          type="radio"
                          name="budget"
                          value={budget}
                          checked={fields.budget === budget}
                          onChange={update}
                        />
                        <span>{budget}</span>
                      </label>
                    ))}
                  </div>
                  {errors.budget && (
                    <p id="idea-budget-error" className="field-error">
                      {errors.budget}
                    </p>
                  )}
                </fieldset>
                <div className="form-foot">
                  <Magnetic strength={0.2}>
                    <button type="submit" className="button button-lime button-large">
                      Save my idea <ArrowUpRight size={19} />
                    </button>
                  </Magnetic>
                  <p>Stored on this device only.</p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
