import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowDown } from 'lucide-react'
import { useApi } from '../lib/api.js'
import { KINDS } from '../lib/landmarks.js'
import { countCompletedTasks, useAllProgress } from '../lib/progress.js'
import { StageProvider } from '../components/Stage.jsx'
import HeroWorld from '../components/HeroWorld.jsx'
import Idea from '../components/Idea.jsx'
import SelectedQuests from '../components/SelectedQuests.jsx'
import Moods from '../components/Moods.jsx'
import Process from '../components/Process.jsx'
import Contact from '../components/Contact.jsx'
import { Lines, Words } from '../motion/text.jsx'
import { EASE } from '../motion/ease.js'
import { Magnetic } from '../motion/effects.jsx'

const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Nairobi',
  hour: '2-digit',
  minute: '2-digit',
})

function NairobiTime() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])
  return <time dateTime={now.toISOString()}>{clock.format(now)} EAT</time>
}

export default function Home() {
  const { data, error, retry } = useApi('/discover')
  const progress = useAllProgress()
  const completed = (data?.quests ?? []).filter(
    (quest) => countCompletedTasks(quest, progress[quest.id]) === quest.taskCount,
  ).length

  return (
    <StageProvider kinds={KINDS}>
      <div className="home">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <motion.p
              className="hero-meta"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            >
              <span>Nairobi, Kenya</span>
              <span>1°17′S 36°49′E</span>
              <NairobiTime />
            </motion.p>
            <h1 id="hero-title" className="sr-only">
              Go somewhere. Do something. Make a memory.
            </h1>
            <div aria-hidden="true">
              <Lines
                as="p"
                className="hero-title"
                delay={0.25}
                stagger={0.1}
                lines={[
                  'Go somewhere.',
                  'Do something.',
                  <>
                    Make a <em>memory.</em>
                  </>,
                ]}
              />
            </div>
            <Words
              className="hero-lede"
              delay={0.7}
              inView={false}
              text="Five small, real adventures across Nairobi. Turn the particle city, pick a numbered quest, and go."
            />
            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1, ease: EASE }}
            >
              <Magnetic>
                <a href="#quests" className="button button-lime button-large">
                  Explore the quests <ArrowDown size={18} />
                </a>
              </Magnetic>
              <a href="#how" className="button button-line button-large">
                How it works
              </a>
            </motion.div>
          </div>
          <HeroWorld quests={data?.quests} />
          <div className="scroll-cue" aria-hidden="true">
            <span>Scroll</span>
            <i />
          </div>
        </section>

        <Idea />
        <SelectedQuests quests={data?.quests} error={error} onRetry={retry} />
        <Moods data={data} />
        <Process completed={completed} />
        <Contact />
      </div>
    </StageProvider>
  )
}
