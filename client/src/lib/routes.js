// One dynamic import per page. The router turns these into lazy components; the
// same loaders warm a single chunk when a link is hovered, so a visitor only ever
// downloads the pages they head towards.
export const pages = {
  Home: () => import('../pages/Home.jsx'),
  Quests: () => import('../pages/Quests.jsx'),
  QuestDetail: () => import('../pages/QuestDetail.jsx'),
  Places: () => import('../pages/Places.jsx'),
  PlaceDetail: () => import('../pages/PlaceDetail.jsx'),
  Locations: () => import('../pages/Locations.jsx'),
  LocationDetail: () => import('../pages/LocationDetail.jsx'),
  Categories: () => import('../pages/Categories.jsx'),
  CategoryDetail: () => import('../pages/CategoryDetail.jsx'),
  Search: () => import('../pages/Search.jsx'),
  NotFound: () => import('../pages/NotFound.jsx'),
}

// `/quests` -> the index page, `/quests/karura` -> the detail page.
const INDEX = {
  '': pages.Home,
  quests: pages.Quests,
  places: pages.Places,
  locations: pages.Locations,
  categories: pages.Categories,
  search: pages.Search,
}
const DETAIL = {
  quests: pages.QuestDetail,
  places: pages.PlaceDetail,
  locations: pages.LocationDetail,
  categories: pages.CategoryDetail,
}

const warmed = new Set()

// Fetch the chunk a link leads to, once, ahead of the click.
export function warmRoute(path) {
  const [, section = '', rest] = path.split('/')
  const load = (rest ? DETAIL[section] : null) ?? INDEX[section]
  if (!load || warmed.has(load)) return
  warmed.add(load)
  load().catch(() => warmed.delete(load))
}
