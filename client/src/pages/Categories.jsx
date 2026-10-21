import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { useApi } from '../lib/api.js'
import { CATEGORY_IMAGES } from '../lib/images.js'
import { ErrorState, Img, Loading, PageHeader } from '../components/ui.jsx'
import { EASE } from '../motion/ease.js'

export default function Categories() {
  const { data, error, loading, retry } = useApi('/categories')
  if (error) return <ErrorState error={error} onRetry={retry} />
  return (
    <div className="page">
      <PageHeader
        eyebrow="Moods"
        lines={['What are you', <em key="mood">in the mood for?</em>]}
        description="Pick a feeling. We’ll find the quest."
      />
      {loading ? (
        <Loading label="Loading moods" />
      ) : (
        <div className="mood-grid">
          {data.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, delay: (index % 4) * 0.07, ease: EASE }}
            >
              <Link
                to={`/categories/${category.name.toLowerCase()}`}
                className="mood-tile"
                data-cursor="Open"
              >
                <Img src={CATEGORY_IMAGES[category.name]} sizes="(min-width: 1024px) 25vw, 50vw" />
                <span className="mood-name">{category.name}</span>
                <span className="mood-count">
                  {category.questCount} {category.questCount === 1 ? 'quest' : 'quests'}
                  <ArrowUpRight size={16} />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
