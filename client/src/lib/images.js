// Catalog photos come from the API. Unsplash URLs are resized on request; other
// hosts (the Wikimedia skyline) are already a fixed-size thumbnail.
export function imageUrl(src, width = 800) {
  if (!src) return null
  if (!src.startsWith('https://images.unsplash.com/')) return src
  return `${src}?auto=format&fit=crop&w=${width}&q=72`
}

// 240 and 320 keep the small thumbnails (the area list, the rail) from reaching
// for a 480 px file they will never show at full size.
export function imageSet(src, widths = [240, 320, 480, 800, 1200]) {
  if (!src?.startsWith('https://images.unsplash.com/')) return undefined
  return widths.map((width) => `${imageUrl(src, width)} ${width}w`).join(', ')
}

const U = (id) => `https://images.unsplash.com/photo-${id}`

// Categories are names, not catalog records, so their mood photos live here.
export const CATEGORY_IMAGES = {
  Food: U('1504674900247-0877df9cc836'),
  Adventure: U('1448375240586-882707db888b'),
  Culture: U('1554907984-15263bfd63bd'),
  Nature: U('1441974231531-c6227db76b6e'),
  Nightlife: U('1414235077428-338989a2e8c0'),
  Date: U('1521017432531-fbd92d768814'),
  Family: U('1547721064-da6cfb341d50'),
  Budget: U('1533900298318-6b8da08a523e'),
}

export const FOREST_PATH = U('1448375240586-882707db888b')
