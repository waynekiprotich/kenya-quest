// Point-cloud generators for the particle world. Everything is procedural and seeded,
// so the scene looks the same on every visit and needs no downloaded assets.

// Tones pick a colour and behaviour in the particle shader.
export const TONE = { ink: 0, lime: 1, dim: 2, light: 3, water: 4 }

export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const TAU = Math.PI * 2
const lerp = (a, b, t) => a + (b - a) * t
export const smoothstep = (e0, e1, x) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
  return t * t * (3 - 2 * t)
}

// Smooth seeded value noise, enough for terrain and gentle wobble.
export function noise2(seed = 1) {
  const hash = (x, y) => {
    let h = (x * 374761393 + y * 668265263 + seed * 144665) | 0
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
  }
  return (x, y) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = x - xi
    const yf = y - yi
    const u = xf * xf * (3 - 2 * xf)
    const v = yf * yf * (3 - 2 * yf)
    return (
      lerp(
        lerp(hash(xi, yi), hash(xi + 1, yi), u),
        lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u),
        v,
      ) *
        2 -
      1
    )
  }
}

// Collects points with a tone and an optional fall height (for water and drips).
export class Cloud {
  constructor(seed = 1) {
    this.rand = rng(seed)
    this.positions = []
    this.tones = []
    this.flows = []
  }
  get count() {
    return this.tones.length
  }
  add(x, y, z, tone = TONE.ink, flow = 0) {
    this.positions.push(x, y, z)
    this.tones.push(tone)
    this.flows.push(flow)
  }
  jitter(amount) {
    return (this.rand() - 0.5) * amount
  }
  line([ax, ay, az], [bx, by, bz], n, tone, spread = 0.006) {
    for (let i = 0; i < n; i++) {
      const t = this.rand()
      this.add(
        lerp(ax, bx, t) + this.jitter(spread),
        lerp(ay, by, t) + this.jitter(spread),
        lerp(az, bz, t) + this.jitter(spread),
        tone,
      )
    }
  }
  ring([cx, cy, cz], radius, n, tone, spread = 0.01) {
    for (let i = 0; i < n; i++) {
      const a = this.rand() * TAU
      this.add(
        cx + Math.cos(a) * radius + this.jitter(spread),
        cy + this.jitter(spread * 0.5),
        cz + Math.sin(a) * radius + this.jitter(spread),
        tone,
      )
    }
  }
  disc([cx, cy, cz], radius, n, tone) {
    for (let i = 0; i < n; i++) {
      const a = this.rand() * TAU
      const r = Math.sqrt(this.rand()) * radius
      this.add(cx + Math.cos(a) * r, cy, cz + Math.sin(a) * r, tone)
    }
  }
  // Surface of a cylinder or truncated cone. `ribs` concentrates points on vertical lines.
  cylinder([cx, cy, cz], r0, r1, height, n, tone, ribs = 0) {
    for (let i = 0; i < n; i++) {
      const t = this.rand()
      let a = this.rand() * TAU
      if (ribs && this.rand() < 0.7) a = (Math.floor(this.rand() * ribs) / ribs) * TAU
      const r = lerp(r0, r1, t)
      this.add(cx + Math.cos(a) * r, cy + t * height, cz + Math.sin(a) * r, tone)
    }
  }
  // Points along the 12 edges of a box, plus an optional window grid on the faces.
  box([cx, cy, cz], [w, h, d], n, tone, windows = 0, windowTone = TONE.light) {
    const edges = []
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        edges.push([
          [sx, 0, sz],
          [sx, 1, sz],
        ])
    for (const y of [0, 1])
      for (const s of [-1, 1]) {
        edges.push([
          [-1, y, s],
          [1, y, s],
        ])
        edges.push([
          [s, y, -1],
          [s, y, 1],
        ])
      }
    for (let i = 0; i < n; i++) {
      const [a, b] = edges[Math.floor(this.rand() * edges.length)]
      const t = this.rand()
      this.add(
        cx + (lerp(a[0], b[0], t) * w) / 2,
        cy + lerp(a[1], b[1], t) * h,
        cz + (lerp(a[2], b[2], t) * d) / 2,
        tone,
      )
    }
    const rows = Math.max(2, Math.round(h / 0.07))
    for (let i = 0; i < windows; i++) {
      const face = Math.floor(this.rand() * 4)
      const along = (Math.floor(this.rand() * 4) + 0.5) / 4 - 0.5
      const y = cy + ((Math.floor(this.rand() * rows) + 0.5) / rows) * h * 0.92
      if (face < 2)
        this.add(cx + along * w * 0.9, y, cz + (face ? 1 : -1) * (d / 2 + 0.004), windowTone)
      else
        this.add(cx + (face === 2 ? 1 : -1) * (w / 2 + 0.004), y, cz + along * d * 0.9, windowTone)
    }
  }
  ellipsoid([cx, cy, cz], [rx, ry, rz], n, tone, pick) {
    for (let i = 0; i < n; i++) {
      const u = this.rand() * 2 - 1
      const a = this.rand() * TAU
      const s = Math.sqrt(1 - u * u)
      const shell = 0.86 + this.rand() * 0.14
      const x = cx + s * Math.cos(a) * rx * shell
      const y = cy + u * ry * shell
      const z = cz + s * Math.sin(a) * rz * shell
      this.add(x, y, z, pick ? pick(this.rand) : tone)
    }
  }
  // Upper half of an ellipsoid, for hills and domes.
  dome([cx, cy, cz], radius, height, n, tone) {
    for (let i = 0; i < n; i++) {
      const a = this.rand() * TAU
      const r = Math.sqrt(this.rand()) * radius
      const y = height * Math.sqrt(Math.max(0, 1 - (r / radius) ** 2))
      this.add(cx + Math.cos(a) * r, cy + y, cz + Math.sin(a) * r, tone)
    }
  }
  scale(factor, [ox, oy, oz] = [0, 0, 0]) {
    for (let i = 0; i < this.positions.length; i += 3) {
      this.positions[i] = this.positions[i] * factor + ox
      this.positions[i + 1] = this.positions[i + 1] * factor + oy
      this.positions[i + 2] = this.positions[i + 2] * factor + oz
    }
    for (let i = 0; i < this.flows.length; i++) this.flows[i] *= factor
    return this
  }
  merge(other) {
    this.positions.push(...other.positions)
    this.tones.push(...other.tones)
    this.flows.push(...other.flows)
    return this
  }
}

// ─── Landmarks ───────────────────────────────────────────────────────────────
// Each fits in a unit cell: base at y = 0, roughly one unit tall. `n` is a budget.

function kicc(c, n) {
  c.cylinder([0, 0.08, 0], 0.11, 0.1, 0.78, n * 0.3, TONE.ink, 16)
  for (let y = 0.16; y < 0.84; y += 0.07) c.ring([0, y, 0], 0.112, n * 0.011, TONE.light, 0.004)
  c.ring([0, 0.88, 0], 0.21, n * 0.07, TONE.ink, 0.006)
  c.disc([0, 0.87, 0], 0.2, n * 0.04, TONE.dim)
  c.cylinder([0, 0.86, 0], 0.21, 0.1, 0.05, n * 0.03, TONE.ink)
  c.line([0, 0.9, 0], [0, 1.08, 0], n * 0.02, TONE.lime, 0.004)
  c.ellipsoid([0, 1.09, 0], [0.018, 0.018, 0.018], n * 0.01, TONE.lime)
  // The conical plenary hall beside the tower.
  c.cylinder([0.36, 0.08, 0.12], 0.22, 0.03, 0.26, n * 0.18, TONE.ink, 20)
  c.box([0.05, 0, 0.05], [0.84, 0.08, 0.46], n * 0.1, TONE.dim)
  c.ring([0.05, 0, 0.05], 0.6, n * 0.07, TONE.dim, 0.02)
  c.ring([0.05, 0, 0.05], 0.68, n * 0.04, TONE.lime, 0.004)
}

function museum(c, n) {
  c.dome([0, 0, 0], 0.62, 0.3, n * 0.26, TONE.dim)
  c.box([0.06, 0.2, 0.02], [0.58, 0.17, 0.26], n * 0.12, TONE.ink, n * 0.06)
  for (let i = 0; i < 6; i++)
    c.line([-0.18 + i * 0.1, 0.2, 0.17], [-0.18 + i * 0.1, 0.37, 0.17], n * 0.01, TONE.ink, 0.003)
  // A fossil spiral standing on the hill.
  const count = n * 0.3
  for (let i = 0; i < count; i++) {
    const t = c.rand()
    const theta = t * Math.PI * 5
    const r = 0.018 * Math.exp(0.21 * theta)
    const tube = 0.012 + r * 0.14
    const a = c.rand() * TAU
    c.add(
      -0.2 + Math.cos(theta) * r + Math.cos(a) * tube,
      0.7 + Math.sin(theta) * r + Math.sin(a) * tube,
      -0.02 + c.jitter(0.05),
      c.rand() < 0.75 ? TONE.lime : TONE.ink,
    )
  }
  for (let k = 0; k < 14; k++) {
    const theta = (k / 14) * Math.PI * 5
    const r = 0.018 * Math.exp(0.21 * theta)
    c.line(
      [-0.2 + Math.cos(theta) * r * 0.55, 0.7 + Math.sin(theta) * r * 0.55, -0.02],
      [-0.2 + Math.cos(theta) * r, 0.7 + Math.sin(theta) * r, -0.02],
      n * 0.005,
      TONE.lime,
      0.004,
    )
  }
  c.ring([0, 0, 0], 0.72, n * 0.05, TONE.dim, 0.02)
}

function forest(c, n) {
  const trees = [
    [0, 0, 0.8],
    [-0.28, 0.12, 0.62],
    [0.22, -0.2, 0.7],
    [-0.08, -0.34, 0.5],
    [0.36, 0.18, 0.46],
    [-0.42, -0.14, 0.42],
    [0.08, 0.36, 0.55],
    [-0.3, 0.38, 0.38],
  ]
  trees.forEach(([x, z, h], index) => {
    const tone = index % 3 === 1 ? TONE.lime : TONE.ink
    for (let tier = 0; tier < 3; tier++) {
      const base = h * (0.18 + tier * 0.22)
      const radius = (0.17 - tier * 0.04) * (0.7 + h * 0.4)
      c.cylinder([x, base, z], radius, 0.01, h * 0.42, (n * 0.07) / 3, tone)
    }
    c.line([x, 0, z], [x, h * 0.2, z], n * 0.004, TONE.dim, 0.003)
  })
  // Waterfall: points start on the ledge and fall in the shader.
  c.box([0.5, 0.36, -0.2], [0.24, 0.1, 0.16], n * 0.03, TONE.dim)
  for (let i = 0; i < n * 0.14; i++)
    c.add(0.5 + c.jitter(0.1), 0.42 + c.jitter(0.02), -0.1 + c.jitter(0.03), TONE.water, 0.42)
  c.ring([0.5, 0.01, -0.02], 0.1, n * 0.04, TONE.water, 0.03)
  const trail = (t) => [-0.6 + t * 1.1, 0.005, Math.sin(t * 5) * 0.14 + 0.52 - t * 0.5]
  for (let i = 0; i < n * 0.05; i++) {
    const [x, y, z] = trail(c.rand())
    c.add(x, y, z, TONE.lime)
  }
  c.ring([0, 0, 0], 0.7, n * 0.04, TONE.dim, 0.03)
}

function westlands(c, n) {
  const towers = [
    [0, 0, 0.18, 1, 0.18],
    [0.26, 0.1, 0.16, 0.7, 0.2],
    [-0.24, 0.08, 0.2, 0.56, 0.16],
    [0.06, -0.3, 0.2, 0.44, 0.18],
    [-0.12, 0.34, 0.14, 0.38, 0.14],
    [0.36, -0.22, 0.12, 0.32, 0.12],
  ]
  for (const [x, z, w, h, d] of towers) {
    const share = h / 3.4
    c.box([x, 0, z], [w, h, d], n * 0.34 * share, TONE.ink, n * 0.46 * share)
    c.ellipsoid([x, h + 0.03, z], [0.012, 0.012, 0.012], n * 0.004, TONE.lime)
  }
  for (let i = -2; i <= 2; i++) {
    c.line([-0.6, 0, i * 0.2 + 0.1], [0.6, 0, i * 0.2 + 0.1], n * 0.012, TONE.dim, 0.004)
    c.line([i * 0.24, 0, -0.55], [i * 0.24, 0, 0.55], n * 0.012, TONE.dim, 0.004)
  }
  // Lanterns over the late tables.
  for (let i = 0; i < n * 0.07; i++) {
    const a = c.rand() * TAU
    const r = 0.46 + c.rand() * 0.14
    c.add(Math.cos(a) * r, 0.03 + c.rand() * 0.05, Math.sin(a) * r, TONE.lime)
  }
}

function karen(c, n) {
  // Flat-topped acacia.
  const tx = 0.3
  const tz = -0.08
  c.line([tx, 0, tz], [tx, 0.34, tz], n * 0.03, TONE.ink, 0.008)
  for (const [bx, bz] of [
    [-0.18, 0.06],
    [0.16, 0.1],
    [0.04, -0.2],
    [0.2, -0.08],
  ])
    c.line([tx, 0.3, tz], [tx + bx, 0.5, tz + bz], n * 0.012, TONE.ink, 0.006)
  c.ellipsoid([tx, 0.54, tz], [0.36, 0.05, 0.28], n * 0.26, TONE.ink)
  // A giraffe at eye level, with lime spots.
  const gx = -0.24
  const spotted = (rand) => (rand() < 0.3 ? TONE.lime : TONE.ink)
  for (const [lx, lz] of [
    [-0.1, -0.05],
    [-0.1, 0.05],
    [0.09, -0.05],
    [0.09, 0.05],
  ])
    c.line([gx + lx, 0, lz], [gx + lx * 0.9, 0.44, lz * 0.8], n * 0.02, TONE.ink, 0.006)
  c.ellipsoid([gx, 0.52, 0], [0.16, 0.08, 0.075], n * 0.16, TONE.ink, spotted)
  for (let i = 0; i < n * 0.09; i++) {
    const t = c.rand()
    const a = c.rand() * TAU
    const r = lerp(0.045, 0.028, t)
    c.add(
      gx + lerp(0.12, 0.26, t) + Math.cos(a) * r * 0.6,
      lerp(0.56, 0.98, t) + Math.sin(a) * r * 0.3,
      Math.sin(a) * r,
      spotted(c.rand),
    )
  }
  c.ellipsoid([gx + 0.3, 1.0, 0], [0.07, 0.032, 0.034], n * 0.03, TONE.ink)
  c.line([gx + 0.25, 1.02, -0.012], [gx + 0.24, 1.08, -0.014], n * 0.004, TONE.lime, 0.003)
  c.line([gx + 0.25, 1.02, 0.012], [gx + 0.24, 1.08, 0.014], n * 0.004, TONE.lime, 0.003)
  c.line([gx - 0.16, 0.54, 0], [gx - 0.22, 0.34, 0], n * 0.008, TONE.ink, 0.004)
  // Grass.
  for (let i = 0; i < n * 0.1; i++) {
    const a = c.rand() * TAU
    const r = Math.sqrt(c.rand()) * 0.66
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    const h = 0.02 + c.rand() * 0.05
    c.add(x, h * c.rand(), z, TONE.dim)
  }
  c.ring([0, 0, 0], 0.72, n * 0.04, TONE.dim, 0.03)
}

export const LANDMARK_BUILDERS = { kicc, museum, forest, westlands, karen }

export function landmarkCloud(kind, n, seed = 7) {
  const cloud = new Cloud(seed)
  LANDMARK_BUILDERS[kind](cloud, n)
  return cloud
}

// ─── The floating city ───────────────────────────────────────────────────────

export const ISLAND = { radius: 3.1, siteRadius: 1.85, siteScale: 0.62 }

// Hotspot sites around the island, in selection order.
export function siteAngles(count) {
  return Array.from({ length: count }, (_, i) => 0.35 - (i / count) * TAU)
}

export function createTerrain(seed = 11) {
  const n1 = noise2(seed)
  const n2 = noise2(seed + 9)
  const edge = (a) => ISLAND.radius + 0.22 * Math.sin(a * 3 + 0.6) + 0.12 * Math.sin(a * 5 - 1.2)
  const sites = siteAngles(5).map((a) => [
    Math.sin(a) * ISLAND.siteRadius,
    Math.cos(a) * ISLAND.siteRadius,
  ])
  const river = [
    [0.1, -0.1],
    [-0.4, -0.9],
    [-0.1, -1.7],
    [0.6, -2.4],
    [0.9, -3.3],
  ]
  const toRiver = (x, z) => {
    let best = Infinity
    for (let i = 1; i < river.length; i++) {
      const [ax, az] = river[i - 1]
      const [bx, bz] = river[i]
      const dx = bx - ax
      const dz = bz - az
      const t = Math.min(Math.max(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0), 1)
      best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t))
    }
    return best
  }
  function raw(x, z) {
    const a = Math.atan2(x, z)
    const r = Math.hypot(x, z)
    let h = 0.16 * n1(x * 0.55, z * 0.55) + 0.06 * n2(x * 1.6, z * 1.6)
    // A ridge of hills along one rim.
    const ridgeAngle = Math.atan2(Math.sin(a - 2.35), Math.cos(a - 2.35))
    const ridge = Math.exp(-((r - 2.45) ** 2) / 0.12) * smoothstep(1.3, 0, Math.abs(ridgeAngle))
    h += ridge * (0.5 + 0.18 * Math.sin(a * 11))
    h -= 0.16 * Math.exp(-(toRiver(x, z) ** 2) / 0.05)
    return h * smoothstep(1.02, 0.8, r / edge(a))
  }
  const plateaus = sites.map(([x, z]) => raw(x, z))
  function height(x, z) {
    let h = raw(x, z)
    sites.forEach(([sx, sz], i) => {
      const d = Math.hypot(x - sx, z - sz)
      h = lerp(h, plateaus[i] + 0.02, smoothstep(0.62, 0.3, d))
    })
    return h
  }
  return { edge, height, sites, river, toRiver }
}

export function islandCloud(terrain, density = 1, seed = 5) {
  const c = new Cloud(seed)
  const spacing = 0.068 / Math.sqrt(density)
  const R = ISLAND.radius + 0.4
  for (let x = -R; x <= R; x += spacing)
    for (let z = -R; z <= R; z += spacing) {
      const px = x + c.jitter(spacing * 0.9)
      const pz = z + c.jitter(spacing * 0.9)
      const a = Math.atan2(px, pz)
      const r = Math.hypot(px, pz)
      const edge = terrain.edge(a)
      if (r > edge) continue
      const h = terrain.height(px, pz)
      const river = terrain.toRiver(px, pz) < 0.1
      const contour = Math.abs(((h * 11 + 10) % 1) - 0.5) > 0.4
      const rim = r > edge - 0.07
      if (river) c.add(px, h + 0.01, pz, TONE.water)
      else if (rim || contour) c.add(px, h, pz, TONE.ink)
      else if (c.rand() < 0.55) c.add(px, h, pz, TONE.dim)
    }
  // Underside: a rough rocky cone, dim, so the island floats.
  const under = Math.round(3200 * density)
  for (let i = 0; i < under; i++) {
    const a = c.rand() * TAU
    const t = Math.sqrt(c.rand())
    const edge = terrain.edge(a)
    const r = t * edge
    const depth = 2.2 * Math.pow(1 - t, 0.85) * (0.85 + 0.15 * Math.sin(a * 7 + t * 5))
    c.add(Math.sin(a) * r, -0.05 - depth, Math.cos(a) * r, c.rand() < 0.12 ? TONE.ink : TONE.dim)
  }
  // Drips falling from the underside tip.
  for (let i = 0; i < 90 * density; i++) {
    const a = c.rand() * TAU
    const r = c.rand() * 0.9
    c.add(Math.sin(a) * r, -1.2 - c.rand() * 0.6, Math.cos(a) * r, TONE.dim, 1.6)
  }
  return c
}

// ─── Mood formations ─────────────────────────────────────────────────────────
// Five shapes the ambient field morphs between, plus a neutral globe.

export const FORMATIONS = {
  globe(i, n, rand) {
    const y = 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const a = i * 2.39996
    const s = 1.35 + (rand() - 0.5) * 0.05
    return [Math.cos(a) * r * s, y * s, Math.sin(a) * r * s]
  },
  // Culture: stacked rings, like a rotunda seen from the street.
  rings(i, n, rand) {
    const ring = i % 9
    const a = rand() * Math.PI * 2
    const r = 0.4 + ring * 0.14
    const y = -0.9 + ring * 0.2 + Math.sin(a * 3) * 0.03
    return [Math.cos(a) * r, y, Math.sin(a) * r]
  },
  // Nature: a rolling canopy.
  canopy(i, n, rand) {
    const x = (rand() * 2 - 1) * 1.8
    const z = (rand() * 2 - 1) * 1.8
    const y = 0.35 * Math.sin(x * 2.2) * Math.cos(z * 1.8) + 0.18 * Math.sin((x + z) * 4) - 0.1
    return [x, y, z]
  },
  // Food: embers spiralling up.
  spiral(i, n, rand) {
    const t = i / n
    const a = t * Math.PI * 14 + rand() * 0.4
    const r = 0.25 + (1 - t) * 0.9 + rand() * 0.08
    return [Math.cos(a) * r, -1.2 + t * 2.4, Math.sin(a) * r]
  },
  // Nightlife: a grid of city lights.
  grid(i, n, rand) {
    const side = Math.ceil(Math.sqrt(n / 3))
    const layer = i % 3
    const k = Math.floor(i / 3)
    const x = ((k % side) / (side - 1)) * 3 - 1.5
    const z = (Math.floor(k / side) / (side - 1)) * 3 - 1.5
    return [x + (rand() - 0.5) * 0.02, -0.6 + layer * 0.5, z + (rand() - 0.5) * 0.02]
  },
  // Adventure: ridgelines of hills.
  ridges(i, n, rand) {
    const line = i % 7
    const x = (rand() * 2 - 1) * 1.9
    const z = -1.2 + line * 0.4
    const y =
      0.55 * Math.exp(-((x - 0.3 * Math.sin(line)) ** 2) * 1.4) * (1 - line * 0.08) +
      0.08 * Math.sin(x * 6 + line) -
      0.5
    return [x, y, z]
  },
}

export function formation(name, n, seed = 3) {
  const rand = rng(seed)
  const out = new Float32Array(n * 3)
  const make = FORMATIONS[name]
  for (let i = 0; i < n; i++) out.set(make(i, n, rand), i * 3)
  return out
}
