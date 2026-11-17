/** A single checkpoint task within an exploration quest */
export interface QuestTask {
  id: string
  label: string
}

/** Complete quest definition with geo-coordinates, stops, and checkpoints */
export interface Quest {
  id: string
  title: string
  location: string
  category: string[]
  description: string
  duration: string
  budget: string
  difficulty: string
  lat: number
  lng: number
  image: string
  mapUrl: string
  tasks: QuestTask[]
  nearbyPlaces: string[]
}

/** Curated place or venue with metadata and linked quests */
export interface Place {
  id: string
  name: string
  type: string
  description: string
  location: string
  price: string
  openingInfo: string | null
  website: string | null
  mapsUrl: string
  lat: number
  lng: number
  image: string
  relatedQuests: string[]
}

/** Venue promotion or special deal linked to a place */
export interface Deal {
  id: string
  title: string
  placeId: string
  description: string
  priceRange: string
}

/** Distinct neighbourhood or area in Nairobi */
export interface Location {
  id: string
  name: string
  tagline: string
  description: string
  lat: number
  lng: number
  image: string
}

/** Cloudflare Worker environment bindings */
export interface Env {
  ALLOWED_ORIGINS?: string
}
