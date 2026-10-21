// Quest ideas from the contact form. There is no server inbox, so ideas are only
// validated and kept in this browser's storage; the form says so plainly.

export const IDEAS_KEY = 'kenya-quest:ideas'
export const BUDGETS = [
  'Under KSh 1,000',
  'KSh 1,000 – 3,000',
  'KSh 3,000 – 6,000',
  'Over KSh 6,000',
  'Not sure yet',
]
export const IDEA_LIMIT = 1200
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateIdea({ name = '', email = '', idea = '', budget = '' }) {
  const errors = {}
  if (name.trim().length < 2) errors.name = 'Add your name (at least two letters).'
  if (!EMAIL.test(email.trim())) errors.email = 'Add an email address, like name@example.com.'
  const length = idea.trim().length
  if (length < 20) errors.idea = 'Tell us a little more: at least 20 characters.'
  else if (length > IDEA_LIMIT) errors.idea = `Keep it under ${IDEA_LIMIT} characters.`
  if (!BUDGETS.includes(budget)) errors.budget = 'Choose a budget range.'
  return errors
}

// Returns true when the idea reached storage, false when storage is blocked.
export function saveIdea(storage, fields, now = new Date()) {
  const entry = {
    name: fields.name.trim(),
    email: fields.email.trim(),
    idea: fields.idea.trim(),
    budget: fields.budget,
    savedAt: now.toISOString(),
  }
  if (!storage) return false
  let list = []
  try {
    const current = JSON.parse(storage.getItem(IDEAS_KEY) ?? '[]')
    if (Array.isArray(current)) list = current
  } catch {
    // A damaged list is replaced rather than blocking the new idea.
  }
  try {
    storage.setItem(IDEAS_KEY, JSON.stringify([...list, entry].slice(-20)))
    return true
  } catch {
    return false
  }
}
