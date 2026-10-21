// The five quests on the particle city, in hotspot order. `kind` picks the particle
// structure; the other fields are fallbacks for when the API has not answered yet.
export const LANDMARKS = [
  {
    id: 'kicc-city-quest',
    kind: 'kicc',
    name: 'KICC',
    title: 'KICC City Quest',
    area: 'Nairobi CBD',
    mood: 'Culture',
    line: 'Above the everyday.',
    detail: 'Rooftop views, market lanes and street food on the way down.',
  },
  {
    id: 'nairobi-museum-quest',
    kind: 'museum',
    name: 'Museum Hill',
    title: 'Nairobi Museum Quest',
    area: 'Nairobi CBD',
    mood: 'Culture',
    line: 'Old stories, new eyes.',
    detail: 'Fossils, a snake park and a tree collection, all on one hill.',
  },
  {
    id: 'karura-nature-quest',
    kind: 'forest',
    name: 'Karura',
    title: 'Karura Nature Quest',
    area: 'Gigiri',
    mood: 'Nature',
    line: 'Take the scenic route.',
    detail: 'A waterfall, caves and quiet trails inside the city.',
  },
  {
    id: 'westlands-food-quest',
    kind: 'westlands',
    name: 'Westlands',
    title: 'Westlands Food Quest',
    area: 'Westlands',
    mood: 'Food',
    line: 'Eat late. Stay later.',
    detail: 'Morning coffee to nyama choma under the lights.',
  },
  {
    id: 'karen-experience-quest',
    kind: 'karen',
    name: 'Karen',
    title: 'Karen Experience Quest',
    area: 'Karen',
    mood: 'Culture',
    line: 'A slower kind of day.',
    detail: 'Garden lunches, old stories and a giraffe at eye level.',
  },
]

export const KINDS = LANDMARKS.map((landmark) => landmark.kind)

// Merges live quest data over the fallback copy, keeping hotspot order.
export function questsInOrder(quests) {
  return LANDMARKS.map((landmark) => {
    const quest = quests?.find((item) => item.id === landmark.id)
    return {
      ...landmark,
      quest,
      title: quest?.title ?? landmark.title,
      description: quest?.description ?? landmark.detail,
      categories: quest?.category ?? [landmark.mood],
      area: quest?.locationName ?? landmark.area,
    }
  })
}
