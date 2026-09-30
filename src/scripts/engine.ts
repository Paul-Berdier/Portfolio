import * as THREE from 'three';
import { gsap } from 'gsap';
import { motion } from '../config/motion';
import { ribbonPoint, ribbonStops } from '../brand/ribbon.mjs';
import { palette } from '../brand/palette.mjs';

type Mode = 'brand' | 'web' | 'automation' | 'data' | 'ai';
type Point = [number, number, number];
type Panel = { x: number; y: number; z: number; width: number; height: number; color: THREE.Color };
const MODES: Mode[] = ['brand', 'web', 'automation', 'data', 'ai'];
const PANEL_COUNT = 24;
const instances = new WeakMap<HTMLElement, () => void>();
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const stopColors = ribbonStops.map(([offset, color]) => ({
  offset: Number(offset),
  color: new THREE.Color(String(color)),
}));

/** Pigments canoniques interpolés dans l'espace linéaire utilisé par Three. */
export function sampleRibbonColor(progress: number, target = new THREE.Color()): THREE.Color {
  const value = clamp(progress);
  for (let index = 1; index < stopColors.length; index++) {
    const right = stopColors[index]!;
    if (value <= right.offset) {
      const left = stopColors[index - 1]!;
      return target
        .copy(left.color)
        .lerp(right.color, (value - left.offset) / (right.offset - left.offset));
    }
  }
  return target.copy(stopColors[stopColors.length - 1]!.color);
}

/** Relief uniquement Z : aucune modification de la projection XY du logo. */
export function ribbonSurfacePoint(u: number, v: number, formation = 1): Point {
  const progress = clamp(formation);
  const [x = 0, y = 0] = ribbonPoint(u, v, progress);
  const depth =
    Math.sin(Math.PI * v) * (3.4 + 1.8 * Math.sin(u * Math.PI * 2)) +
    1.1 * Math.sin(u * Math.PI * 4 + v * Math.PI);
  return [x - 240, 120 - y, depth * progress];
}

/** Surface indexée, sans tube ni extrusion. UV = longueur / largeur du ruban. */
export function createRibbonGeometry(segments = 160, crossSegments = 10): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const count = (segments + 1) * (crossSegments + 1);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const indices: number[] = [];
  const color = new THREE.Color();
  for (let row = 0; row <= segments; row++) {
    const u = row / segments;
    for (let column = 0; column <= crossSegments; column++) {
      const v = column / crossSegments;
      const index = row * (crossSegments + 1) + column;
      positions.set(ribbonSurfacePoint(u, v), index * 3);
      uv.set([u, v], index * 2);
      const [x = 0, y = 0] = ribbonPoint(u, v, 1);
      // Axe identique au gradient SVG dans son viewBox 480 × 240.
      const gradient = ((x - 20) * 422 - (y - 225) * 163) / (422 ** 2 + 163 ** 2);
      sampleRibbonColor(gradient, color).multiplyScalar(1.015 - v * 0.075);
      colors.set([color.r, color.g, color.b], index * 3);
      if (row < segments && column < crossSegments) {
        const next = index + crossSegments + 1;
        indices.push(index, index + 1, next, index + 1, next + 1, next);
      }
    }
  }
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
  );
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function serviceCenter(u: number, mode: Exclude<Mode, 'brand'>): [number, number] {
  if (mode === 'web') {
    const angle = u * Math.PI * 2;
    const curve = (value: number) => Math.sign(value) * Math.abs(value) ** 0.42;
    return [240 + curve(Math.cos(angle)) * 169, 129 + curve(Math.sin(angle)) * 83];
  }
  if (mode === 'automation') return [35 + u * 410, 133 + Math.sin(u * Math.PI * 2) * 34];
  if (mode === 'data') return [46 + u * 388, 211 - Math.sin(u * Math.PI) * 6];
  return [43 + u * 394, 138 + Math.sin(u * Math.PI * 2 - 0.3) * 24];
}

function servicePoint(u: number, v: number, mode: Exclude<Mode, 'brand'>): Point {
  const [x, y] = serviceCenter(u, mode);
  const [beforeX, beforeY] = serviceCenter(u - 0.001, mode);
  const [afterX, afterY] = serviceCenter(u + 0.001, mode);
  const dx = afterX - beforeX,
    dy = afterY - beforeY;
  const length = Math.hypot(dx, dy) || 1;
  const width = mode === 'web' ? 7 : mode === 'data' ? 5 : 7 + Math.sin(u * Math.PI) * 8;
  const offset = (v - 0.5) * width;
  return [
    x - 240 - (dy / length) * offset,
    120 - y - (dx / length) * offset,
    Math.sin(v * Math.PI) * 2,
  ];
}

function panelsFor(mode: Mode): Panel[] {
  const panels: Panel[] = [];
  const add = (x: number, y: number, width: number, height: number, color: string, z = 4) => {
    panels.push({ x: x - 240, y: 120 - y, z, width, height, color: new THREE.Color(color) });
  };
  if (mode === 'web') {
    add(240, 84, 290, 2, palette.periwinkle);
    [107, 121, 135].forEach((x) => add(x, 66, 5, 5, palette.lavender));
    add(167, 131, 125, 66, palette.deepViolet);
    add(167, 122, 85, 6, palette.lavender, 5);
    add(151, 139, 53, 4, palette.periwinkle, 5);
    add(157, 153, 65, 4, palette.periwinkle, 5);
    add(310, 121, 117, 47, palette.periwinkle);
    add(310, 172, 117, 35, palette.violet);
    add(160, 183, 111, 7, palette.lavender);
  } else if (mode === 'automation') {
    for (const u of [0.14, 0.5, 0.86]) {
      const [x, y] = serviceCenter(u, mode);
      add(x, y, 68, 55, palette.deepViolet);
      add(x, y - 10, 34, 5, palette.ivory, 5);
      add(x, y + 4, 44, 3, palette.periwinkle, 5);
      add(x, y + 15, 24, 3, palette.lavender, 5);
    }
  } else if (mode === 'data') {
    [60, 101, 78, 143, 116, 158, 139].forEach((height, index) => {
      const x = 78 + index * 54;
      add(x, 207 - height / 2, 29, height, index % 2 ? palette.periwinkle : palette.violet);
      add(x, 207 - height, 29, 3, palette.lavender, 5);
    });
  } else if (mode === 'ai') {
    [108, 243, 374].forEach((x, index) => {
      const y = index === 1 ? 128 : 106;
      const height = index === 1 ? 116 : 91;
      add(x, y, index === 1 ? 90 : 70, height, index === 1 ? palette.violet : palette.deepViolet);
      add(x, y - height / 2 + 18, 42, 5, palette.ivory, 5);
      for (let line = 0; line < 3; line++)
        add(
          x - (line === 2 ? 6 : 0),
          y - 12 + line * 13,
          line === 2 ? 28 : 40,
          3,
          palette.periwinkle,
          5,
        );
      add(x + 18, y + height / 2 - 12, 9, 9, palette.lavender, 5);
    });
  }
  while (panels.length < PANEL_COUNT) {
    const [x, y, z] = ribbonSurfacePoint(panels.length / (PANEL_COUNT - 1), 0.5);
    panels.push({ x, y, z, width: 0, height: 0, color: new THREE.Color(palette.periwinkle) });
  }
  return panels;
}

export function createEngine(host: HTMLElement): () => void {
  instances.get(host)?.();
  const mount = host.querySelector<HTMLElement>('.engine-canvas');
  if (!mount) return () => {};
  const mobile = innerWidth < 760;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      // Sur mobile, laisser le navigateur choisir le GPU et limiter le multisampling.
      antialias: !mobile,
      powerPreference: mobile ? 'default' : 'low-power',
    });
  } catch {
    host.dataset.fallback = 'webgl';
    return () => {};
  }
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-256, 256, 128, -128, 0.1, 1000);
  camera.position.set(0, 0, 500);
  camera.lookAt(0, 0, 0);
  renderer.setClearColor(palette.navy, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  scene.add(new THREE.AmbientLight(0xffffff, 1.12));
  const key = new THREE.DirectionalLight(palette.ivory, 0.5);
  key.position.set(-120, 190, 280);
  const fill = new THREE.DirectionalLight(palette.blueLight, 0.18);
  fill.position.set(170, -130, 120);
  scene.add(key, fill);

  const geometry = createRibbonGeometry(innerWidth < 760 ? 112 : 160, innerWidth < 760 ? 7 : 10);
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
  const material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    vertexColors: true,
    specular: palette.lavender,
    shininess: 78,
    side: THREE.DoubleSide,
  });
  const ribbon = new THREE.Mesh(geometry, material);
  ribbon.frustumCulled = false;
  scene.add(ribbon);

  const panelGeometry = new THREE.PlaneGeometry(1, 1);
  const panelMaterial = new THREE.MeshPhongMaterial({
    color: palette.ivory,
    specular: palette.lavender,
    shininess: 50,
    side: THREE.DoubleSide,
  });
  const panelMesh = new THREE.InstancedMesh(panelGeometry, panelMaterial, PANEL_COUNT);
  panelMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  panelMesh.frustumCulled = false;
  panelMesh.visible = false;
  scene.add(panelMesh);

  const impulseGeometry = new THREE.BufferGeometry();
  const impulsePositions = new THREE.BufferAttribute(new Float32Array(81 * 3), 3).setUsage(
    THREE.DynamicDrawUsage,
  );
  impulseGeometry.setAttribute('position', impulsePositions);
  const impulseMaterial = new THREE.LineBasicMaterial({
    color: palette.ivory,
    transparent: true,
    opacity: 0,
  });
  const impulse = new THREE.Line(impulseGeometry, impulseMaterial);
  impulse.frustumCulled = false;
  scene.add(impulse);

  const transition = { progress: 1 };
  const light = { x: 0, y: 0, sweep: 0.5 };
  let formation = 1;
  // Un choix effectué avant le chargement différé de Three reste prioritaire.
  let mode: Mode = MODES.includes(host.dataset.state as Mode)
    ? (host.dataset.state as Mode)
    : 'brand';
  let sourcePositions = new Float32Array(positions.array);
  let sourcePanels = panelsFor('brand');
  let targetPanels = panelsFor(mode);
  let currentPanels = sourcePanels;
  let modeTween: gsap.core.Tween | undefined;
  let pointerTween: gsap.core.Tween | undefined;
  let disposed = false,
    visible = false,
    connected = false,
    compiled = false,
    compiling = false,
    contextAvailable = true;
  let dirty = true,
    geometryDirty = true,
    compilationVersion = 0;
  let compilationTimer: ReturnType<typeof setTimeout> | undefined;
  const abort = new AbortController();
  const helper = new THREE.Object3D();
  const color = new THREE.Color();
  mount.append(renderer.domElement);

  const applyGeometry = () => {
    if (!geometryDirty) return;
    const progress = transition.progress;
    for (let index = 0; index < positions.count; index++) {
      const u = uv.getX(index),
        v = uv.getY(index);
      const target =
        mode === 'brand' ? ribbonSurfacePoint(u, v, formation) : servicePoint(u, v, mode);
      const offset = index * 3;
      positions.setXYZ(
        index,
        THREE.MathUtils.lerp(sourcePositions[offset]!, target[0], progress),
        THREE.MathUtils.lerp(sourcePositions[offset + 1]!, target[1], progress),
        THREE.MathUtils.lerp(sourcePositions[offset + 2]!, target[2], progress),
      );
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    let hasPanels = false;
    currentPanels = targetPanels.map((target, index) => {
      const from = sourcePanels[index]!;
      const panel = {
        x: THREE.MathUtils.lerp(from.x, target.x, progress),
        y: THREE.MathUtils.lerp(from.y, target.y, progress),
        z: THREE.MathUtils.lerp(from.z, target.z, progress),
        width: THREE.MathUtils.lerp(from.width, target.width, progress),
        height: THREE.MathUtils.lerp(from.height, target.height, progress),
        color: from.color.clone().lerp(target.color, progress),
      };
      helper.position.set(panel.x, panel.y, panel.z);
      helper.scale.set(panel.width, panel.height, 1);
      helper.updateMatrix();
      panelMesh.setMatrixAt(index, helper.matrix);
      panelMesh.setColorAt(index, color.copy(panel.color));
      hasPanels ||= panel.width > 0.05 && panel.height > 0.05;
      return panel;
    });
    panelMesh.visible = hasPanels;
    panelMesh.instanceMatrix.needsUpdate = true;
    if (panelMesh.instanceColor) panelMesh.instanceColor.needsUpdate = true;
    impulse.visible = mode === 'brand' && formation < 0.98;
    impulseMaterial.opacity = (1 - formation) ** 1.4 * 0.85;
    if (impulse.visible) {
      for (let index = 0; index <= 80; index++) {
        const point = ribbonSurfacePoint(index / 80, 0.5, formation);
        impulsePositions.setXYZ(index, point[0], point[1], point[2] + 0.1);
      }
      impulsePositions.needsUpdate = true;
    }
    geometryDirty = false;
  };

  const running = () => (modeTween?.isActive() ?? false) || (pointerTween?.isActive() ?? false);
  const canRun = () => !disposed && visible && !document.hidden && contextAvailable;
  const tick = () => {
    if (!canRun() || !compiled) {
      syncTicker();
      return;
    }
    if (dirty) {
      applyGeometry();
      key.position.set(-210 + light.sweep * 360 + light.x * 80, 170 + light.y * 60, 245);
      renderer.render(scene, camera);
      dirty = false;
      if (!renderer.getContext().isContextLost()) {
        host.dataset.ready = 'true';
        delete host.dataset.fallback;
      }
    }
    // Aucun flottement autonome : un état stabilisé retire le ticker.
    if (!dirty && !running() && connected) {
      gsap.ticker.remove(tick);
      connected = false;
    }
  };

  const compile = () => {
    compilationTimer = undefined;
    if (!canRun()) return;
    compiling = true;
    const version = ++compilationVersion;
    applyGeometry();
    const failed = () => {
      if (disposed || version !== compilationVersion) return;
      compiling = false;
      contextAvailable = false;
      delete host.dataset.ready;
      host.dataset.fallback = 'shader';
      syncTicker();
    };
    try {
      void renderer.compileAsync(scene, camera).then(() => {
        if (disposed || !contextAvailable || version !== compilationVersion) return;
        compiling = false;
        compiled = true;
        dirty = true;
        syncTicker();
      }, failed);
    } catch {
      failed();
    }
  };

  function syncTicker() {
    const active = canRun();
    if (active && !compiled && !compiling && compilationTimer === undefined)
      compilationTimer = setTimeout(compile, 0);
    else if (!active && compilationTimer !== undefined) {
      clearTimeout(compilationTimer);
      compilationTimer = undefined;
    }
    if (active && compiled) {
      modeTween?.resume();
      pointerTween?.resume();
      if ((dirty || running()) && !connected) {
        connected = true;
        gsap.ticker.add(tick);
      }
    } else {
      modeTween?.pause();
      pointerTween?.pause();
      if (connected) {
        gsap.ticker.remove(tick);
        connected = false;
      }
    }
  }

  const markDirty = (geometryChanged = false) => {
    dirty = true;
    geometryDirty ||= geometryChanged;
    syncTicker();
  };
  let drawingWidth = 0,
    drawingHeight = 0,
    drawingPixelRatio = 0;
  const resize = () => {
    if (disposed) return;
    const rect = mount.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const pixelRatio = Math.min(
      devicePixelRatio,
      innerWidth < 760 ? motion.pixelRatio.mobile : motion.pixelRatio.desktop,
    );
    if (
      rect.width === drawingWidth &&
      rect.height === drawingHeight &&
      pixelRatio === drawingPixelRatio
    )
      return;
    const aspect = rect.width / rect.height;
    // SVG correspondant : viewBox="-16 -8 512 256", xMidYMid meet.
    const halfWidth = Math.max(256, 128 * aspect),
      halfHeight = Math.max(128, 256 / aspect);
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setDrawingBufferSize(rect.width, rect.height, pixelRatio);
    drawingWidth = rect.width;
    drawingHeight = rect.height;
    drawingPixelRatio = pixelRatio;
    markDirty();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);
  resize();
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible) dirty = true;
      syncTicker();
    },
    { rootMargin: '0px' },
  );
  observer.observe(mount);
  document.addEventListener('visibilitychange', syncTicker, { signal: abort.signal });

  host.addEventListener(
    'engine:mode',
    (event: Event) => {
      const next = (event as CustomEvent<Mode>).detail;
      if (!MODES.includes(next) || next === mode) return;
      modeTween?.kill();
      // Partir du dernier maillage effectivement rendu : un événement du
      // contrôleur SVG peut avoir finalisé l'intro juste avant ce clic.
      sourcePositions = new Float32Array(positions.array);
      sourcePanels = currentPanels;
      targetPanels = panelsFor(next);
      mode = next;
      if (mode === 'brand') formation = 1;
      transition.progress = 0;
      modeTween = gsap.to(transition, {
        progress: 1,
        duration: 1.2,
        ease: motion.morphEase,
        paused: true,
        onUpdate: () => markDirty(true),
        onComplete: () => markDirty(true),
      });
      markDirty(true);
    },
    { signal: abort.signal },
  );

  host.addEventListener(
    'engine:progress',
    (event: Event) => {
      const detail = (event as CustomEvent<{ formation?: number; light?: number }>).detail;
      if (!detail || typeof detail !== 'object') return;
      let changed = false;
      if (typeof detail.formation === 'number' && Number.isFinite(detail.formation)) {
        const next = clamp(detail.formation);
        changed = mode === 'brand' && next !== formation;
        formation = next;
        if (mode === 'brand' && transition.progress < 1) {
          modeTween?.kill();
          modeTween = undefined;
          transition.progress = 1;
          changed = true;
        }
      }
      if (typeof detail.light === 'number' && Number.isFinite(detail.light))
        light.sweep = clamp(detail.light);
      markDirty(changed);
    },
    { signal: abort.signal },
  );

  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const moveLight = (x: number, y: number) => {
      pointerTween?.kill();
      pointerTween = gsap.to(light, {
        x,
        y,
        duration: 0.38,
        ease: 'power2.out',
        paused: true,
        onUpdate: () => markDirty(),
        onComplete: () => markDirty(),
      });
      syncTicker();
    };
    host.addEventListener(
      'pointermove',
      (event) => {
        const rect = host.getBoundingClientRect();
        moveLight(
          (event.clientX - rect.left) / rect.width - 0.5,
          (event.clientY - rect.top) / rect.height - 0.5,
        );
      },
      { signal: abort.signal, passive: true },
    );
    host.addEventListener('pointerleave', () => moveLight(0, 0), { signal: abort.signal });
  }

  const materials = [material, panelMaterial, impulseMaterial];
  renderer.domElement.addEventListener(
    'webglcontextlost',
    (event) => {
      event.preventDefault();
      delete host.dataset.ready;
      host.dataset.fallback = 'webgl';
      contextAvailable = false;
      compiled = false;
      compiling = false;
      compilationVersion++;
      materials.forEach((item) => item.dispose());
      syncTicker();
    },
    { signal: abort.signal },
  );
  renderer.domElement.addEventListener(
    'webglcontextrestored',
    () => {
      if (disposed) return;
      contextAvailable = true;
      dirty = true;
      drawingWidth = 0;
      resize();
      syncTicker();
    },
    { signal: abort.signal },
  );

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    compilationVersion++;
    if (compilationTimer !== undefined) clearTimeout(compilationTimer);
    abort.abort();
    observer.disconnect();
    resizeObserver.disconnect();
    gsap.ticker.remove(tick);
    modeTween?.kill();
    pointerTween?.kill();
    panelMesh.dispose();
    geometry.dispose();
    panelGeometry.dispose();
    impulseGeometry.dispose();
    materials.forEach((item) => item.dispose());
    renderer.renderLists.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    delete host.dataset.ready;
    if (instances.get(host) === dispose) instances.delete(host);
  };
  instances.set(host, dispose);
  return dispose;
}
