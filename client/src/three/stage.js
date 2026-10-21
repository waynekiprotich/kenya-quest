import * as THREE from 'three'
import { gsap } from 'gsap'
import {
  Cloud,
  ISLAND,
  TONE,
  createTerrain,
  formation,
  islandCloud,
  landmarkCloud,
  rng,
  siteAngles,
  smoothstep,
} from './shapes.js'

// One fixed, transparent canvas behind the home page. Each part of the page binds a DOM
// element; the stage renders that element's scene into its on-screen rectangle, so the
// hero world, the quest sculptures, the mood field and the contour shader share a context.

const THEMES = {
  dark: {
    ink: '#f1efe7',
    lime: '#d4ff3a',
    dim: '#56648c',
    light: '#fff3c2',
    water: '#8fb6ff',
    opacity: 1,
    additive: true,
    topo: '#d4ff3a',
    topoBackground: '#0b1022',
  },
  light: {
    ink: '#0b1020',
    lime: '#5f7d00',
    dim: '#8a93a8',
    light: '#0b1020',
    water: '#2c56c9',
    opacity: 0.92,
    additive: false,
    topo: '#0b1020',
    topoBackground: '#e1dfd5',
  },
}
const MOODS = ['rings', 'canopy', 'spiral', 'grid', 'ridges']
const CAMERA_AZIMUTH = 0.62
const WORK_TARGET = new THREE.Vector3(0, 0.45, 0)
const ORIGIN = new THREE.Vector3()
const damp = THREE.MathUtils.damp
const clamp01 = (t) => Math.min(Math.max(t, 0), 1)
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

const POINT_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uScale;
uniform float uSize;
uniform float uForm;
uniform float uBoost;
uniform float uOpacity;
uniform vec3 uPointer;
uniform float uPointerStrength;
uniform vec3 uInk;
uniform vec3 uLime;
uniform vec3 uDim;
uniform vec3 uLight;
uniform vec3 uWater;
attribute float aTone;
attribute float aSeed;
attribute float aFlow;
attribute vec3 aScatter;
#ifdef MORPH
attribute vec3 aTo;
uniform float uMorph;
#endif
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 p = position;
  #ifdef MORPH
  float m = clamp(uMorph * 1.35 - aSeed * 0.35, 0.0, 1.0);
  p = mix(position, aTo, m * m * (3.0 - 2.0 * m));
  #endif
  vec3 color = uInk;
  float alpha = 0.78;
  float size = 1.0;
  if (aTone > 0.5 && aTone < 1.5) { color = uLime; alpha = 1.0; size = 1.3; }
  else if (aTone > 1.5 && aTone < 2.5) { color = uDim; alpha = 0.55; size = 0.85; }
  else if (aTone > 2.5 && aTone < 3.5) {
    color = uLight;
    alpha = 0.3 + 0.65 * step(0.2, sin(uTime * (0.5 + aSeed * 1.6) + aSeed * 40.0));
    size = 1.1;
  }
  else if (aTone > 3.5) { color = uWater; alpha = 0.85; }
  if (aFlow > 0.0) {
    float f = fract(uTime * 0.3 + aSeed * 7.0);
    p.y -= f * aFlow;
    alpha *= sin(f * 3.14159);
  }
  p += vec3(
    sin(uTime * 0.9 + aSeed * 60.0),
    cos(uTime * 0.7 + aSeed * 45.0),
    sin(uTime * 0.8 + aSeed * 30.0)
  ) * 0.005;
  vec3 d = p - uPointer;
  float near = uPointerStrength * exp(-dot(d.xz, d.xz) * 4.0);
  p.y += near * 0.2;
  p.xz += normalize(d.xz + 0.0001) * near * 0.07;
  float t = clamp(uForm * 1.6 - aSeed * 0.6, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  p = mix(aScatter, p, t);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.0, uSize * size * (1.0 + near * 0.9 + uBoost * 0.35) * uScale / -mv.z);
  vColor = mix(color, uLime, near * 0.7);
  vAlpha = alpha * uOpacity * mix(0.2, 1.0, t) * (1.0 + uBoost * 0.35);
}`

const POINT_FRAGMENT = /* glsl */ `
uniform vec2 uFade;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c);
  if (d > 0.25) discard;
  float edge = smoothstep(uFade.x, uFade.x + uFade.y, gl_FragCoord.x);
  gl_FragColor = vec4(vColor, vAlpha * edge * smoothstep(0.25, 0.02, d));
  #include <colorspace_fragment>
}`

const DUST_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uScroll;
uniform float uScale;
uniform vec2 uPointer;
uniform float uOpacity;
uniform vec3 uInk;
uniform vec3 uLime;
attribute float aSeed;
attribute float aTone;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec3 p = position;
  float depth = clamp((-p.z - 3.0) / 16.0, 0.0, 1.0);
  float speed = mix(1.6, 0.35, depth);
  p.y = mod(p.y + uScroll * speed + uTime * 0.04 * (0.4 + aSeed) + 9.0, 18.0) - 9.0;
  p.x += sin(uTime * 0.1 + aSeed * 20.0) * 0.12 + uPointer.x * mix(0.6, 0.1, depth);
  p.y += uPointer.y * mix(0.4, 0.08, depth);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.0, (0.035 + aSeed * 0.03) * uScale / -mv.z);
  vColor = aTone > 0.5 ? uLime : uInk;
  float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed * 2.0) + aSeed * 90.0);
  vAlpha = uOpacity * twinkle * mix(0.55, 0.18, depth);
}`

const GRID_VERTEX = /* glsl */ `
uniform float uRadius;
varying float vFade;
void main() {
  vFade = 1.0 - smoothstep(uRadius * 0.25, uRadius, length(position.xz));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const GRID_FRAGMENT = /* glsl */ `
uniform vec3 uDim;
uniform float uOpacity;
uniform float uForm;
uniform vec2 uFade;
varying float vFade;
void main() {
  float edge = smoothstep(uFade.x, uFade.x + uFade.y, gl_FragCoord.x);
  gl_FragColor = vec4(uDim, vFade * edge * 0.5 * uOpacity * uForm);
  #include <colorspace_fragment>
}`

// The contour-line shader from the previous footer, now drawn into the contact
// section's rectangle. It paints the section background too, so the section's own
// CSS background only shows when WebGL is unavailable.
const TOPO_VERTEX = /* glsl */ `
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`

const TOPO_FRAGMENT = /* glsl */ `
uniform vec2 uResolution;
uniform vec2 uOffset;
uniform vec2 uMouse;
uniform float uTime;
uniform float uHover;
uniform vec3 uLine;
uniform vec3 uBackground;
uniform float uOpacity;
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}
void main() {
  vec2 frag = gl_FragCoord.xy - uOffset;
  vec2 uv = frag / uResolution.y;
  vec2 mouse = uMouse / uResolution.y;
  float height = fbm(uv * 1.5 + vec2(uTime * 0.018, uTime * 0.011));
  vec2 toMouse = uv - mouse;
  height += uHover * 0.32 * exp(-dot(toMouse, toMouse) * 10.0);
  float level = height * 16.0;
  float distanceToLine = abs(fract(level + 0.5) - 0.5);
  float width = fwidth(level);
  float major = 1.0 - step(0.5, mod(floor(level + 0.5), 5.0));
  float line = 1.0 - smoothstep(width * (0.5 + major * 0.4), width * (1.4 + major * 0.6), distanceToLine);
  gl_FragColor = vec4(mix(uBackground, uLine, line * mix(0.14, 0.32, major) * uOpacity), 1.0);
  #include <colorspace_fragment>
}`

function qualityTier() {
  const width = window.innerWidth
  const cores = navigator.hardwareConcurrency || 4
  const memory = navigator.deviceMemory || 4
  if (width < 700 || cores <= 4 || memory <= 2) return { density: 0.55, dpr: 1.5 }
  if (width < 1200) return { density: 0.8, dpr: 1.75 }
  return { density: 1, dpr: 2 }
}

export function createStage(
  host,
  { theme = 'dark', reduced = false, kinds, onPick, onInteract, onStatus },
) {
  const tier = qualityTier()
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance',
  })
  let dpr = Math.min(window.devicePixelRatio || 1, tier.dpr)
  renderer.setPixelRatio(dpr)
  renderer.setClearColor(0x000000, 0)
  renderer.autoClear = false
  const canvas = renderer.domElement
  canvas.className = 'stage-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  host.append(canvas)

  const shared = {
    uTime: { value: 0 },
    uOpacity: { value: 1 },
    uInk: { value: new THREE.Color() },
    uLime: { value: new THREE.Color() },
    uDim: { value: new THREE.Color() },
    uLight: { value: new THREE.Color() },
    uWater: { value: new THREE.Color() },
    // Fades points out toward the left, in device pixels: (start, width).
    uFade: { value: new THREE.Vector2(-1e5, 1) },
  }
  const materials = []
  const disposables = []

  // Uniform objects are shared by reference, so one write reaches every material.
  function pointMaterial(view, local = {}, defines) {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        ...shared,
        uScale: view.uScale,
        uForm: view.uForm,
        uPointer: view.uPointer,
        uPointerStrength: view.uPointerStrength,
        uSize: { value: 0.02 },
        uBoost: { value: 0 },
        ...local,
      },
      vertexShader: POINT_VERTEX,
      fragmentShader: POINT_FRAGMENT,
      transparent: true,
      depthWrite: false,
      ...(defines && { defines }),
    })
    materials.push(material)
    disposables.push(material)
    return material
  }

  function geometryFrom(cloud, scatter = 5, seed = 1) {
    const rand = rng(seed)
    const count = cloud.count
    const seeds = new Float32Array(count)
    const scattered = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      seeds[i] = rand()
      const u = rand() * 2 - 1
      const a = rand() * Math.PI * 2
      const r = scatter * Math.cbrt(rand())
      const s = Math.sqrt(1 - u * u)
      scattered.set([Math.cos(a) * s * r, u * r, Math.sin(a) * s * r], i * 3)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(cloud.positions, 3))
    geometry.setAttribute('aTone', new THREE.Float32BufferAttribute(cloud.tones, 1))
    geometry.setAttribute('aFlow', new THREE.Float32BufferAttribute(cloud.flows, 1))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geometry.setAttribute('aScatter', new THREE.BufferAttribute(scattered, 3))
    disposables.push(geometry)
    return geometry
  }

  function points(geometry, material, parent) {
    const object = new THREE.Points(geometry, material)
    object.frustumCulled = false
    parent.add(object)
    return object
  }

  function makeView(key, fov = 30) {
    return {
      key,
      element: null,
      rect: null,
      visible: false,
      scene: new THREE.Scene(),
      camera: new THREE.PerspectiveCamera(fov, 1, 0.1, 100),
      uScale: { value: 1 },
      uForm: { value: 1 },
      uPointer: { value: new THREE.Vector3(0, -99, 0) },
      uPointerStrength: { value: 0 },
      pointer: new THREE.Vector2(),
      pointerTarget: new THREE.Vector2(),
      hover: false,
      listeners: [],
    }
  }

  // ─── Dust: the whole viewport ────────────────────────────────────────────
  const dust = makeView('dust', 55)
  {
    const rand = rng(21)
    const count = Math.round(1400 * tier.density)
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const tones = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions.set([(rand() * 2 - 1) * 13, (rand() * 2 - 1) * 9, -3 - rand() * 16], i * 3)
      seeds[i] = rand()
      tones[i] = rand() < 0.07 ? 1 : 0
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geometry.setAttribute('aTone', new THREE.BufferAttribute(tones, 1))
    dust.uniforms = {
      uTime: shared.uTime,
      uOpacity: shared.uOpacity,
      uInk: shared.uInk,
      uLime: shared.uLime,
      uScale: dust.uScale,
      uScroll: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
      uFade: shared.uFade,
    }
    const material = new THREE.ShaderMaterial({
      uniforms: dust.uniforms,
      vertexShader: DUST_VERTEX,
      fragmentShader: POINT_FRAGMENT,
      transparent: true,
      depthWrite: false,
    })
    materials.push(material)
    disposables.push(geometry, material)
    points(geometry, material, dust.scene)
  }

  // ─── Hero: the floating city ─────────────────────────────────────────────
  const hero = makeView('hero', 30)
  hero.uForm.value = reduced ? 1 : 0
  const terrain = createTerrain()
  const world = new THREE.Group()
  hero.scene.add(world)
  points(
    geometryFrom(islandCloud(terrain, tier.density), 7, 3),
    pointMaterial(hero, { uSize: { value: 0.024 } }),
    world,
  )
  const angles = siteAngles(kinds.length)
  const sites = kinds.map((kind, index) => {
    const [x, z] = terrain.sites[index]
    const y = terrain.height(x, z)
    const cloud = landmarkCloud(kind, Math.round(1500 * tier.density), 30 + index)
    const s = ISLAND.siteScale
    const angle = angles[index]
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    // Face each structure outward, so it turns toward the camera when selected.
    for (let i = 0; i < cloud.positions.length; i += 3) {
      const px = cloud.positions[i] * s
      const pz = cloud.positions[i + 2] * s
      cloud.positions[i] = x + px * cos + pz * sin
      cloud.positions[i + 1] = y + cloud.positions[i + 1] * s
      cloud.positions[i + 2] = z - px * sin + pz * cos
    }
    cloud.flows = cloud.flows.map((flow) => flow * s)
    const boost = { value: 0 }
    points(
      geometryFrom(cloud, 7, 40 + index),
      pointMaterial(hero, { uSize: { value: 0.022 }, uBoost: boost }),
      world,
    )
    return {
      x,
      z,
      y,
      angle,
      boost,
      screen: null,
      anchor: new THREE.Vector3(x, y + 1.12 * s + 0.1, z),
    }
  })

  // Routes loop between the sites; bright particles travel along them.
  const routes = sites.map((site, index) => {
    const next = sites[(index + 1) % sites.length]
    const mid = new THREE.Vector2((site.x + next.x) * 0.36, (site.z + next.z) * 0.36)
    const curve = new THREE.SplineCurve([
      new THREE.Vector2(site.x, site.z),
      mid,
      new THREE.Vector2(next.x, next.z),
    ])
    return curve
      .getSpacedPoints(160)
      .map((p) => new THREE.Vector3(p.x, terrain.height(p.x, p.y) + 0.035, p.y))
  })
  const riverPath = new THREE.SplineCurve(terrain.river.map(([x, z]) => new THREE.Vector2(x, z)))
    .getSpacedPoints(160)
    .map((p) => new THREE.Vector3(p.x, terrain.height(p.x, p.y) + 0.02, p.y))
  {
    const dots = new Cloud(61)
    for (const route of routes)
      for (let i = 0; i < route.length; i += 2)
        dots.add(route[i].x, route[i].y, route[i].z, TONE.dim)
    points(geometryFrom(dots, 7, 62), pointMaterial(hero, { uSize: { value: 0.02 } }), world)
  }
  const FLOW_PER_ROUTE = Math.round(22 * Math.max(tier.density, 0.7))
  const flows = []
  routes.forEach((route, index) => {
    for (let k = 0; k < FLOW_PER_ROUTE; k++)
      flows.push({ route, index, offset: k / FLOW_PER_ROUTE, speed: 0.05, water: false })
  })
  for (let k = 0; k < 26; k++)
    flows.push({ route: riverPath, index: -1, offset: k / 26, speed: 0.035, water: true })
  const flowCloud = new Cloud(71)
  for (const flow of flows) flowCloud.add(0, 0, 0, flow.water ? TONE.water : TONE.ink)
  const flowGeometry = geometryFrom(flowCloud, 7, 72)
  const flowPositions = flowGeometry.getAttribute('position')
  const flowTones = flowGeometry.getAttribute('aTone')
  points(flowGeometry, pointMaterial(hero, { uSize: { value: 0.04 } }), world)

  // A faint grid far below the island.
  {
    const size = 14
    const step = 0.7
    const vertices = []
    for (let v = -size / 2; v <= size / 2 + 0.001; v += step)
      vertices.push(-size / 2, 0, v, size / 2, 0, v, v, 0, -size / 2, v, 0, size / 2)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uDim: shared.uDim,
        uOpacity: shared.uOpacity,
        uForm: hero.uForm,
        uFade: shared.uFade,
        uRadius: { value: size / 2 },
      },
      vertexShader: GRID_VERTEX,
      fragmentShader: GRID_FRAGMENT,
      transparent: true,
      depthWrite: false,
    })
    materials.push(material)
    disposables.push(geometry, material)
    const grid = new THREE.LineSegments(geometry, material)
    grid.position.y = -3
    world.add(grid)
  }

  // Selection marker: a pulsing lime ring and a beam of light above the site.
  const marker = new THREE.Group()
  world.add(marker)
  const markerOpacity = { value: 1 }
  {
    const ring = new Cloud(81)
    ring.ring([0, 0.02, 0], 0.62, 140, TONE.lime, 0.004)
    for (let i = 0; i < 60; i++) ring.add(0, 0.9 + Math.pow(i / 60, 0.7) * 1.3, 0, TONE.lime)
    const material = pointMaterial(hero, {
      uSize: { value: 0.03 },
      uPointerStrength: { value: 0 },
      uForm: { value: 1 },
      uOpacity: markerOpacity,
    })
    points(geometryFrom(ring, 1, 82), material, marker)
  }

  // ─── Quest sculptures ────────────────────────────────────────────────────
  const works = kinds.map((kind, index) => {
    const view = makeView(`work:${index}`, 28)
    view.uForm.value = reduced ? 1 : 0
    const group = new THREE.Group()
    view.scene.add(group)
    const cloud = landmarkCloud(kind, Math.round(5200 * tier.density), 90 + index)
    cloud.ring([0, 0, 0], 1.02, 260 * tier.density, TONE.dim, 0.04)
    cloud.disc([0, -0.004, 0], 1.0, 520 * tier.density, TONE.dim)
    points(
      geometryFrom(cloud, 2.6, 100 + index),
      pointMaterial(view, { uSize: { value: 0.013 } }),
      group,
    )
    const orbit = new Cloud(110 + index)
    orbit.ring([0, 0, 0], 1.25, 300 * tier.density, TONE.lime, 0.004)
    const orbitGroup = new THREE.Group()
    orbitGroup.rotation.set(0.28, 0, 0.12 * (index % 2 ? -1 : 1))
    orbitGroup.position.y = 0.5
    group.add(orbitGroup)
    points(
      geometryFrom(orbit, 2.6, 120 + index),
      pointMaterial(view, { uSize: { value: 0.012 }, uPointerStrength: { value: 0 } }),
      orbitGroup,
    )
    Object.assign(view, { group, orbitGroup, yaw: index * 1.3 })
    return view
  })

  // ─── Mood field ──────────────────────────────────────────────────────────
  const moods = makeView('moods', 30)
  const moodCount = Math.round(4200 * tier.density)
  const shapes = ['globe', ...MOODS].map((name, i) => formation(name, moodCount, 50 + i))
  const moodGroup = new THREE.Group()
  moods.scene.add(moodGroup)
  const moodMorph = { value: 1 }
  const moodFade = { value: 1 }
  let moodIndex = 0
  let moodProgress = 1
  {
    const cloud = new Cloud(131)
    const rand = rng(132)
    for (let i = 0; i < moodCount; i++) {
      const r = rand()
      cloud.add(0, 0, 0, r < 0.2 ? TONE.lime : r < 0.3 ? TONE.dim : TONE.ink)
    }
    cloud.positions = Array.from(shapes[0])
    const geometry = geometryFrom(cloud, 3, 133)
    geometry.setAttribute('aTo', new THREE.BufferAttribute(shapes[0].slice(), 3))
    points(
      geometry,
      pointMaterial(
        moods,
        { uSize: { value: 0.022 }, uMorph: moodMorph, uOpacity: moodFade },
        { MORPH: '' },
      ),
      moodGroup,
    )
    moods.geometry = geometry
  }

  function morphTo(index) {
    if (index === moodIndex) return
    const from = moods.geometry.getAttribute('position')
    const to = moods.geometry.getAttribute('aTo')
    const seeds = moods.geometry.getAttribute('aSeed')
    // Freeze the current in-between shape as the new starting point.
    for (let i = 0; i < moodCount; i++) {
      let m = clamp01(moodProgress * 1.35 - seeds.array[i] * 0.35)
      m = m * m * (3 - 2 * m)
      for (let k = 0; k < 3; k++) {
        const j = i * 3 + k
        from.array[j] += (to.array[j] - from.array[j]) * m
      }
    }
    to.array.set(shapes[index])
    from.needsUpdate = true
    to.needsUpdate = true
    moodIndex = index
    // Reduced motion swaps the shape behind a short fade instead of morphing.
    moodProgress = reduced ? 1 : 0
    if (reduced) moodFade.value = 0
  }

  // ─── Contour field for the contact section ───────────────────────────────
  const contact = makeView('contact')
  contact.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const topoUniforms = {
    uResolution: { value: new THREE.Vector2(1, 1) },
    uOffset: { value: new THREE.Vector2() },
    uMouse: { value: new THREE.Vector2(-999, -999) },
    uTime: { value: 0 },
    uHover: { value: 0 },
    uLine: { value: new THREE.Color() },
    uBackground: { value: new THREE.Color() },
    uOpacity: { value: 1 },
  }
  {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
    )
    const material = new THREE.ShaderMaterial({
      uniforms: topoUniforms,
      vertexShader: TOPO_VERTEX,
      fragmentShader: TOPO_FRAGMENT,
      depthWrite: false,
      depthTest: false,
    })
    disposables.push(geometry, material)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.frustumCulled = false
    contact.scene.add(mesh)
  }

  const views = { hero, moods, contact }
  works.forEach((view) => (views[view.key] = view))

  // ─── State ───────────────────────────────────────────────────────────────
  let width = 1
  let height = 1
  let time = 0
  let last = performance.now()
  let paused = false
  let disposed = false
  let lost = false
  let awakeUntil = 0
  let lastScroll = -1
  const introStart = performance.now()
  let selected = 0
  let focused = false
  let auto = true
  let yaw = -0.6
  let yawTarget = CAMERA_AZIMUTH - angles[0] - 0.6
  let spin = 0
  let polar = 1.08
  let polarTarget = 1.08
  let drag = null
  let markers = []
  let frameCount = 0
  let slowFrames = 0
  const heroPointer = new THREE.Vector2()
  const heroPointerTarget = new THREE.Vector2()
  const focus = new THREE.Vector3(0, -0.3, 0)
  const focusTarget = focus.clone()
  const markerSpot = new THREE.Vector2(sites[0].x, sites[0].z)
  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const hit = new THREE.Vector3()
  const projected = new THREE.Vector3()
  const offset = new THREE.Vector3()
  const toCamera = new THREE.Vector3()
  const centre = new THREE.Vector3()

  function wake(ms = 1200) {
    awakeUntil = Math.max(awakeUntil, performance.now() + ms)
  }

  function applyTheme(name) {
    const palette = THEMES[name] ?? THEMES.dark
    shared.uInk.value.set(palette.ink)
    shared.uLime.value.set(palette.lime)
    shared.uDim.value.set(palette.dim)
    shared.uLight.value.set(palette.light)
    shared.uWater.value.set(palette.water)
    shared.uOpacity.value = palette.opacity
    moodFade.value = palette.opacity
    topoUniforms.uLine.value.set(palette.topo)
    topoUniforms.uBackground.value.set(palette.topoBackground)
    topoUniforms.uOpacity.value = name === 'light' ? 0.7 : 0.8
    const blending = palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending
    for (const material of materials) material.blending = blending
    wake()
  }

  function unwrap(target, current) {
    const full = Math.PI * 2
    return target + Math.round((current - target) / full) * full
  }

  function focusOn(index) {
    const site = sites[index]
    yawTarget = unwrap(CAMERA_AZIMUTH - site.angle, yawTarget)
    const c = Math.cos(yawTarget)
    const s = Math.sin(yawTarget)
    focusTarget.set(
      (site.x * c + site.z * s) * 0.72,
      site.y + 0.35,
      (-site.x * s + site.z * c) * 0.72,
    )
    focused = true
  }

  function release() {
    focused = false
    focusTarget.set(0, -0.3, 0)
  }

  // Pointer position inside a view, as normalised device coordinates.
  function toNdc(view, event) {
    const rect = view.region ?? view.element.getBoundingClientRect()
    return ndc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
  }

  function groundPoint(view, group, y = 0) {
    raycaster.setFromCamera(ndc, view.camera)
    group.updateMatrixWorld()
    plane.constant = -y
    if (!raycaster.ray.intersectPlane(plane, hit)) return null
    return group.worldToLocal(hit)
  }

  // ─── Hero input ──────────────────────────────────────────────────────────
  function heroDown(event) {
    if (event.button !== 0 || event.target.closest('button, a')) return
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startYaw: yawTarget,
      startPolar: polarTarget,
      moved: false,
      lastX: event.clientX,
      lastT: event.timeStamp,
      velocity: 0,
    }
  }
  function heroMove(event) {
    const rect = hero.element.getBoundingClientRect()
    heroPointerTarget.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      ((event.clientY - rect.top) / rect.height) * 2 - 1,
    )
    if (event.pointerType === 'mouse' && !drag) {
      hero.hover = true
      toNdc(hero, event)
      const local = groundPoint(hero, world, world.position.y)
      if (local) hero.uPointer.value.copy(local)
    }
    if (drag && drag.id === event.pointerId) {
      const dx = event.clientX - drag.x
      const dy = event.clientY - drag.y
      if (!drag.moved && Math.hypot(dx, dy) > 6) {
        drag.moved = true
        auto = false
        spin = 0
        release()
        hero.element.setPointerCapture?.(event.pointerId)
        hero.element.dataset.dragging = 'true'
        onInteract?.()
      }
      if (drag.moved) {
        yawTarget = drag.startYaw + dx * 0.0065
        polarTarget = THREE.MathUtils.clamp(drag.startPolar - dy * 0.003, 0.82, 1.3)
        const elapsed = Math.max(event.timeStamp - drag.lastT, 1)
        drag.velocity = ((event.clientX - drag.lastX) / elapsed) * 1000 * 0.0065
        drag.lastX = event.clientX
        drag.lastT = event.timeStamp
      }
    }
    wake()
  }
  function heroUp(event) {
    if (!drag || drag.id !== event.pointerId) return
    if (!drag.moved) {
      // A tap near a site selects it.
      const rect = hero.element.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      let best = null
      let bestDistance = 64
      sites.forEach((site, index) => {
        if (!site.screen) return
        const d = Math.hypot(site.screen.x - x, site.screen.y - y)
        if (d < bestDistance) {
          best = index
          bestDistance = d
        }
      })
      if (best !== null) onPick?.(best)
    } else if (!reduced) spin = THREE.MathUtils.clamp(drag.velocity, -4, 4)
    if (hero.element.hasPointerCapture?.(event.pointerId))
      hero.element.releasePointerCapture(event.pointerId)
    delete hero.element.dataset.dragging
    drag = null
    wake()
  }
  function heroLeave() {
    hero.hover = false
    heroPointerTarget.set(0, 0)
    wake()
  }

  // ─── Work, mood and contact input ────────────────────────────────────────
  function viewMove(view) {
    return (event) => {
      const rect = view.element.getBoundingClientRect()
      view.pointerTarget.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        ((event.clientY - rect.top) / rect.height) * 2 - 1,
      )
      view.hover = true
      if (view.group) {
        toNdc(view, event)
        const local = groundPoint(view, view.group, 0.35)
        if (local) view.uPointer.value.copy(local)
      }
      if (view === contact)
        topoUniforms.uMouse.value.set(
          (event.clientX - rect.left) * dpr,
          (rect.bottom - event.clientY) * dpr,
        )
      wake()
    }
  }
  function viewLeave(view) {
    return () => {
      view.hover = false
      view.pointerTarget.set(0, 0)
      wake()
    }
  }

  function listen(view, type, handler, options) {
    view.element.addEventListener(type, handler, options)
    view.listeners.push([type, handler, options])
  }

  function unbind(key) {
    const view = views[key]
    if (!view?.element) return
    for (const [type, handler, options] of view.listeners)
      view.element.removeEventListener(type, handler, options)
    view.listeners = []
    view.element = null
  }

  function bind(key, element) {
    const view = views[key]
    if (!view || view.element === element) return
    unbind(key)
    if (!element) return
    view.element = element
    if (view === hero) {
      listen(view, 'pointerdown', heroDown)
      listen(view, 'pointermove', heroMove)
      listen(view, 'pointerup', heroUp)
      listen(view, 'pointercancel', heroUp)
      listen(view, 'pointerleave', heroLeave)
    } else {
      listen(view, 'pointermove', viewMove(view), { passive: true })
      listen(view, 'pointerleave', viewLeave(view))
    }
    wake()
  }

  // ─── Frame ───────────────────────────────────────────────────────────────
  function measure(view) {
    if (!view.element) return (view.visible = false)
    const rect = view.element.getBoundingClientRect()
    view.rect = rect
    view.visible =
      rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < height && rect.right > 0
    return view.visible
  }

  // Sets the camera aspect and point scale, and returns the distance that frames `radius`.
  function fit(view, radius) {
    const { camera, rect } = view
    camera.aspect = rect.width / rect.height
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    view.uScale.value = (rect.height * dpr) / (2 * tan)
    return radius / (tan * Math.min(camera.aspect, 1))
  }

  function orbit(camera, target, distance, azimuth, polarAngle) {
    camera.position.set(
      target.x + Math.sin(polarAngle) * Math.sin(azimuth) * distance,
      target.y + Math.cos(polarAngle) * distance,
      target.z + Math.sin(polarAngle) * Math.cos(azimuth) * distance,
    )
    camera.lookAt(target)
    camera.updateProjectionMatrix()
  }

  function updateHero(dt, motion, now) {
    const { rect } = hero
    const intro = reduced ? 1 : easeOut(clamp01((now - introStart) / 2400))
    const scrolled = clamp01(-rect.top / Math.max(rect.height, 1))
    const leave = reduced ? 0 : smoothstep(0.25, 1, scrolled)
    hero.uForm.value = intro * (1 - leave * 0.85)

    if (motion && auto && !drag && !focused) yawTarget += dt * 0.06
    if (!drag && spin) {
      yawTarget += spin * dt
      spin *= Math.exp(-3.2 * dt)
      if (Math.abs(spin) < 0.01) spin = 0
    }
    // Reduced motion snaps the camera instead of gliding it.
    const snap = reduced ? 40 : 0
    yaw = damp(yaw, yawTarget, snap || 4.5, dt)
    polar = damp(polar, polarTarget, snap || 5, dt)
    heroPointer.x = damp(heroPointer.x, heroPointerTarget.x, 3, dt)
    heroPointer.y = damp(heroPointer.y, heroPointerTarget.y, 3, dt)
    hero.uPointerStrength.value = damp(hero.uPointerStrength.value, hero.hover ? 1 : 0, 6, dt)

    world.rotation.y = yaw
    world.rotation.x = reduced ? 0 : scrolled * 0.2
    world.position.y =
      (reduced ? 0 : -1.4 * (1 - intro) - scrolled * 0.8) +
      (motion ? Math.sin(time * 0.5) * 0.05 : 0)

    focus.x = damp(focus.x, focusTarget.x, snap || 3, dt)
    focus.y = damp(focus.y, focusTarget.y, snap || 3, dt)
    focus.z = damp(focus.z, focusTarget.z, snap || 3, dt)
    const base = fit(hero, width >= 900 ? 3.75 : 3.3)
    // The hero draws across the full width, so zoomed-in views are never cut at the
    // column edge; a soft fade keeps the headline clear. On wide screens the panel
    // sits bottom right, so the city leans up and left.
    const wide = width >= 900
    hero.lean = damp(hero.lean ?? 0, focused ? 1 : 0, snap || 3, dt)
    hero.camera.setViewOffset(
      rect.width,
      rect.height,
      (wide ? rect.width * (0.1 + hero.lean * 0.07) : 0) - rect.left,
      wide ? rect.height * (0.07 + hero.lean * 0.08) : 0,
      width,
      rect.height,
    )
    hero.region = { left: 0, top: rect.top, width, height: rect.height, bottom: rect.bottom }
    const goal = (focused ? base * 0.66 : base) + (reduced ? 0 : scrolled * 3)
    hero.distance = hero.distance == null ? goal : damp(hero.distance, goal, snap || 3, dt)
    orbit(
      hero.camera,
      focus,
      hero.distance,
      CAMERA_AZIMUTH + heroPointer.x * 0.06,
      polar + heroPointer.y * 0.03,
    )

    const site = sites[selected]
    markerSpot.x = damp(markerSpot.x, site.x, snap || 7, dt)
    markerSpot.y = damp(markerSpot.y, site.z, snap || 7, dt)
    marker.position.set(markerSpot.x, site.y, markerSpot.y)
    const beat = motion ? (time * 0.5) % 1 : 0.3
    marker.scale.set(1 + beat * 0.25, 1, 1 + beat * 0.25)
    markerOpacity.value = shared.uOpacity.value * (motion ? 1 - beat * 0.5 : 1)
    sites.forEach((item, index) => {
      item.boost.value = damp(item.boost.value, index === selected ? 1 : 0, 5, dt)
    })

    // Flowing particles along the routes; the selected site's routes glow lime.
    for (let i = 0; i < flows.length; i++) {
      const flow = flows[i]
      const t = (((flow.offset + time * flow.speed) % 1) + 1) % 1
      const route = flow.route
      const f = t * (route.length - 1)
      const a = route[Math.floor(f)]
      const b = route[Math.min(Math.ceil(f), route.length - 1)]
      const k = f - Math.floor(f)
      flowPositions.setXYZ(i, a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, a.z + (b.z - a.z) * k)
      if (!flow.water) {
        const lit = flow.index === selected || (flow.index + 1) % sites.length === selected
        flowTones.setX(i, lit ? TONE.lime : TONE.ink)
      }
    }
    flowPositions.needsUpdate = true
    flowTones.needsUpdate = true
  }

  function placeMarkers() {
    const { rect, camera } = hero
    world.updateMatrixWorld()
    centre.setFromMatrixPosition(world.matrixWorld)
    toCamera.copy(camera.position).sub(centre)
    sites.forEach((site, index) => {
      projected.copy(site.anchor)
      world.localToWorld(projected)
      const far = offset.copy(projected).sub(centre).dot(toCamera) < -0.6
      projected.project(camera)
      const x = (projected.x * 0.5 + 0.5) * width - rect.left
      const y = (-projected.y * 0.5 + 0.5) * rect.height
      site.screen = { x, y }
      const element = markers[index]
      if (!element) return
      element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      element.dataset.far = far ? 'true' : 'false'
      element.dataset.placed = 'true'
    })
  }

  function updateWork(view, dt, motion) {
    const entered = clamp01((height - view.rect.top) / (height * 0.75))
    view.uForm.value = reduced ? 1 : easeOut(entered)
    view.pointer.x = damp(view.pointer.x, view.pointerTarget.x, 4, dt)
    view.pointer.y = damp(view.pointer.y, view.pointerTarget.y, 4, dt)
    view.uPointerStrength.value = damp(view.uPointerStrength.value, view.hover ? 1 : 0, 6, dt)
    if (motion) view.yaw += dt * (view.hover ? 0.08 : 0.16)
    view.group.rotation.y = view.yaw + view.pointer.x * 0.7
    view.orbitGroup.rotation.y = motion ? time * 0.25 : 0
    orbit(view.camera, WORK_TARGET, fit(view, 1.3), 0.4, 1.12 + view.pointer.y * 0.12)
  }

  function updateMoods(dt, motion) {
    moodProgress = Math.min(1, moodProgress + dt / 1.5)
    moodMorph.value = moodProgress
    moodFade.value = damp(moodFade.value, shared.uOpacity.value, reduced ? 10 : 4, dt)
    moods.pointer.x = damp(moods.pointer.x, moods.pointerTarget.x, 3, dt)
    moods.pointer.y = damp(moods.pointer.y, moods.pointerTarget.y, 3, dt)
    if (motion) moodGroup.rotation.y += dt * 0.12
    moodGroup.rotation.x = moods.pointer.y * 0.3
    moodGroup.rotation.z = moods.pointer.x * -0.15
    const entered = clamp01((height - moods.rect.top) / (height * 0.8))
    moods.uForm.value = reduced ? 1 : easeOut(entered)
    orbit(moods.camera, ORIGIN, fit(moods, 1.9), 0.3, 1.25)
  }

  function renderView(view) {
    const rect = view.region ?? view.rect
    const x = Math.round(rect.left)
    const y = Math.round(height - rect.bottom)
    const w = Math.round(rect.width)
    const h = Math.round(rect.height)
    renderer.setViewport(x, y, w, h)
    renderer.setScissor(x, y, w, h)
    renderer.render(view.scene, view.camera)
  }

  function resize() {
    width = host.clientWidth || window.innerWidth
    height = host.clientHeight || window.innerHeight
    renderer.setSize(width, height, false)
    dust.camera.aspect = width / height
    dust.camera.updateProjectionMatrix()
    wake()
  }

  function tick() {
    if (disposed || lost) return
    const now = performance.now()
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    const motion = !reduced && !paused
    const scroll = window.scrollY
    const intro = !reduced && now - introStart < 2600
    // Without ambient motion, frames are drawn only when something changes.
    if (!motion && !intro && scroll === lastScroll && now > awakeUntil && !drag && !spin) return
    lastScroll = scroll
    if (motion) time += dt
    shared.uTime.value = time
    topoUniforms.uTime.value = time

    // Read every rectangle before writing to the DOM.
    const visible = Object.values(views).filter(measure)

    renderer.setScissorTest(false)
    renderer.setViewport(0, 0, width, height)
    renderer.clear()

    if (contact.visible) {
      const { rect } = contact
      topoUniforms.uResolution.value.set(rect.width * dpr, rect.height * dpr)
      topoUniforms.uOffset.value.set(rect.left * dpr, (height - rect.bottom) * dpr)
      topoUniforms.uHover.value = damp(topoUniforms.uHover.value, contact.hover ? 1 : 0, 3, dt)
      renderer.setScissorTest(true)
      renderView(contact)
      renderer.setScissorTest(false)
      renderer.setViewport(0, 0, width, height)
    }

    dust.uniforms.uScroll.value = reduced ? 0 : (scroll / Math.max(height, 1)) * 2.4
    dust.uniforms.uPointer.value.set(heroPointer.x, -heroPointer.y)
    dust.uScale.value = (height * dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(27.5)))
    renderer.render(dust.scene, dust.camera)

    renderer.setScissorTest(true)
    if (hero.visible) {
      updateHero(dt, motion, now)
      if (width >= 900) shared.uFade.value.set((hero.rect.left - 220) * dpr, 260 * dpr)
      renderView(hero)
      shared.uFade.value.set(-1e5, 1)
      placeMarkers()
    }
    for (const view of works)
      if (view.visible) {
        updateWork(view, dt, motion)
        renderView(view)
      }
    if (moods.visible) {
      updateMoods(dt, motion)
      renderView(moods)
    }
    renderer.setScissorTest(false)

    // Lower the resolution on devices that cannot keep up.
    if (motion && visible.length) {
      frameCount++
      if (dt > 0.024) slowFrames++
      if (frameCount >= 90) {
        if (slowFrames > 45 && dpr > 1) {
          dpr = Math.max(1, dpr - 0.25)
          renderer.setPixelRatio(dpr)
          resize()
        }
        frameCount = 0
        slowFrames = 0
      }
    }
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host)
  function onVisibility() {
    last = performance.now()
    wake()
  }
  document.addEventListener('visibilitychange', onVisibility)
  let lostTimer = 0
  function onContextLost(event) {
    event.preventDefault()
    lost = true
    lostTimer = window.setTimeout(() => onStatus?.('fallback'), 2500)
  }
  function onContextRestored() {
    window.clearTimeout(lostTimer)
    lost = false
    onStatus?.('ready')
    wake()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)
  canvas.addEventListener('webglcontextrestored', onContextRestored)

  applyTheme(theme)
  resize()
  gsap.ticker.add(tick)

  return {
    bind,
    unbind,
    setMarkers(elements) {
      markers = elements
      wake()
    },
    select(index, { focus: shouldFocus = true } = {}) {
      selected = index
      if (shouldFocus) {
        auto = false
        spin = 0
        focusOn(index)
      }
      wake(2600)
    },
    rotate(direction) {
      auto = false
      spin = 0
      release()
      yawTarget += direction * 0.7
      wake(2400)
    },
    setMood(index) {
      morphTo(index == null ? 0 : index + 1)
      wake(2000)
    },
    setTheme: applyTheme,
    setReducedMotion(value) {
      reduced = value
      if (value) {
        spin = 0
        hero.uForm.value = 1
      }
      wake()
    },
    setPaused(value) {
      paused = value
      last = performance.now()
      wake()
    },
    dispose() {
      disposed = true
      gsap.ticker.remove(tick)
      window.clearTimeout(lostTimer)
      Object.keys(views).forEach(unbind)
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      for (const item of disposables) item.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
