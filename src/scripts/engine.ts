import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gsap } from 'gsap';
import { motion } from '../config/motion';

type Mode = 'web' | 'automation' | 'data' | 'ai';
type Pose = {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  sx: number;
  sy: number;
  sz: number;
};
const COUNT = 120;

function pose(index: number, mode: Mode): Pose {
  const base = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 0.2, sy: 0.2, sz: 0.2 };
  if (mode === 'web') {
    // A ribbed, folded browser frame. Each module keeps its identity through the four states.
    if (index < 24) {
      base.x = -2.15 + index * 0.187;
      base.y = 1.45;
      base.sx = 0.135;
      base.sy = 0.57;
      base.sz = 0.43;
    } else if (index < 48) {
      base.x = -2.15 + (index - 24) * 0.187;
      base.y = -1.45;
      base.sx = 0.135;
      base.sy = 0.57;
      base.sz = 0.43;
    } else if (index < 64) {
      base.x = -2.15;
      base.y = -1.25 + (index - 48) * 0.168;
      base.sx = 0.6;
      base.sy = 0.12;
      base.sz = 0.43;
    } else if (index < 80) {
      base.x = 2.15;
      base.y = -1.25 + (index - 64) * 0.168;
      base.sx = 0.6;
      base.sy = 0.12;
      base.sz = 0.43;
    } else if (index < 88) {
      base.x = -1.65 + (index - 80) * 0.47;
      base.y = 0.72;
      base.sx = 0.38;
      base.sy = 0.13;
      base.sz = 0.13;
      base.z = -0.13;
    } else if (index < 104) {
      const i = index - 88;
      base.x = -1.4 + (i % 4) * 0.38;
      base.y = 0.24 - Math.floor(i / 4) * 0.3;
      base.sx = 0.3;
      base.sy = 0.19;
      base.sz = 0.16;
      base.z = -0.1;
    } else {
      const i = index - 104;
      base.x = 0.48 + (i % 4) * 0.35;
      base.y = 0.24 - Math.floor(i / 4) * 0.3;
      base.sx = 0.28;
      base.sy = 0.19;
      base.sz = 0.16;
      base.z = 0.03;
    }
    base.z += 0.28 * Math.sin(base.x * 1.1 + base.y * 0.65);
    base.ry = -0.18 * Math.cos(base.x * 0.8);
    base.rx = 0.09 * Math.sin(base.y);
  } else if (mode === 'automation') {
    if (index < 108) {
      const group = Math.floor(index / 27),
        i = index % 27;
      base.x = (group % 2 ? 1.32 : -1.32) + ((i % 9) - 4) * 0.17;
      base.y = (group < 2 ? 1.05 : -1.05) + (Math.floor(i / 9) - 1) * 0.27;
      base.z = group % 2 ? 0.15 : -0.15;
      base.sx = 0.115;
      base.sy = 0.65;
      base.sz = 0.43;
    } else {
      const i = index - 108;
      base.x = i < 6 ? (i - 2.5) * 0.17 : 0.12;
      base.y = i < 6 ? 1.05 : (i - 8.5) * 0.26;
      base.sx = 0.11;
      base.sy = 0.11;
      base.sz = 0.11;
    }
  } else if (mode === 'data') {
    const col = Math.floor(index / 15),
      row = index % 15;
    const heights = [5, 8, 6, 11, 9, 15, 12, 14];
    const h = heights[col]!;
    base.x = (col - 3.5) * 0.54;
    base.y = -1.5 + Math.min(row, h - 1) * 0.22;
    base.z = row >= h ? -0.45 - (row - h) * 0.18 : 0;
    base.sx = 0.42;
    base.sy = 0.14;
    base.sz = 0.38;
    if (row >= h) {
      base.rx = 0.18;
      base.sy = 0.11;
    }
  } else {
    if (index < 96) {
      const doc = Math.floor(index / 32),
        i = index % 32;
      base.x = (doc - 1) * 1.65 + ((i % 4) - 1.5) * 0.3;
      base.y = 1.2 - Math.floor(i / 4) * 0.32 + (doc === 1 ? -0.4 : 0.1);
      base.z = doc === 1 ? 0.5 : -0.1;
      base.sx = 0.23;
      base.sy = 0.23;
      base.sz = 0.14;
      base.ry = (doc - 1) * -0.15;
    } else {
      const i = index - 96;
      base.x = -1.1 + (i % 12) * 0.2;
      base.y = i < 12 ? 1.65 : -1.65;
      base.z = 0.2;
      base.sx = 0.13;
      base.sy = 0.13;
      base.sz = 0.13;
    }
  }
  return base;
}

export function createEngine(host: HTMLElement) {
  const mount = host.querySelector<HTMLElement>('.engine-canvas');
  if (!mount) return () => {};
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
  } catch {
    host.dataset.fallback = 'webgl';
    return () => {};
  }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(3.6, 2.4, 9.4);
  camera.lookAt(0, 0, 0);
  renderer.setClearColor(0x101110, 0);
  renderer.setPixelRatio(
    Math.min(
      devicePixelRatio,
      innerWidth < 760 ? motion.pixelRatio.mobile : motion.pixelRatio.desktop,
    ),
  );
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  // Direct studio lighting avoids a synchronous environment-map convolution on first paint.
  scene.add(new THREE.HemisphereLight(0xffe4cc, 0x332016, 1.6));
  const key = new THREE.DirectionalLight(0xffe8da, 3.2);
  key.position.set(-3, 5, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xfca877, 2);
  rim.position.set(4, 1, -3);
  scene.add(rim);
  const material = new THREE.MeshPhongMaterial({
    color: 0xd37948,
    specular: 0xfac19d,
    shininess: 65,
  });
  const geometry = new RoundedBoxGeometry(1, 1, 1, 1, 0.1);
  const mesh = new THREE.InstancedMesh(geometry, material, COUNT);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const group = new THREE.Group();
  group.add(mesh);
  group.rotation.z = -0.18;
  scene.add(group);
  const helper = new THREE.Object3D();
  const poses: Pose[] = Array.from({ length: COUNT }, (_, i) => pose(i, 'web'));
  const color = new THREE.Color();
  for (let i = 0; i < COUNT; i++)
    mesh.setColorAt(i, color.setHex(i % 13 === 0 ? 0xffc092 : i % 7 === 0 ? 0xbb6135 : 0xef8952));
  const tweens: gsap.core.Tween[] = [];
  let disposed = false,
    visible = false,
    connected = false,
    compiled = false,
    compiling = false,
    contextAvailable = true;
  let compilationVersion = 0;
  let compilationTimer: ReturnType<typeof setTimeout> | undefined;
  let pointerX = 0,
    pointerY = 0;
  const abort = new AbortController();
  mount.append(renderer.domElement);
  const applyMatrices = () => {
    poses.forEach((p, i) => {
      helper.position.set(p.x, p.y, p.z);
      helper.rotation.set(p.rx, p.ry, p.rz);
      helper.scale.set(p.sx, p.sy, p.sz);
      helper.updateMatrix();
      mesh.setMatrixAt(i, helper.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  const tick = (time: number) => {
    if (disposed || !compiled || !contextAvailable || !visible || document.hidden) return;
    group.rotation.y +=
      (pointerX * motion.pointerAmplitude + Math.sin(time * 0.24) * 0.035 - group.rotation.y) *
      0.055;
    group.rotation.x +=
      (-pointerY * motion.pointerAmplitude + Math.cos(time * 0.2) * 0.025 - group.rotation.x) *
      0.055;
    group.position.y = Math.sin(time * 0.5) * 0.035;
    applyMatrices();
    renderer.render(scene, camera);
    if (!host.dataset.ready && !renderer.getContext().isContextLost()) {
      host.dataset.ready = 'true';
      delete host.dataset.fallback;
    }
  };
  const compile = () => {
    compilationTimer = undefined;
    if (disposed || !contextAvailable || !visible || document.hidden) return;
    compiling = true;
    const version = ++compilationVersion;
    applyMatrices();
    // Compile in a separate task, then let KHR_parallel_shader_compile finish without
    // forcing the initial render to synchronously wait for linked shaders.
    const failed = () => {
      if (disposed || version !== compilationVersion) return;
      compiling = false;
      contextAvailable = false;
      host.dataset.fallback = 'shader';
      syncTicker();
    };
    try {
      void renderer.compileAsync(scene, camera).then(() => {
        if (disposed || !contextAvailable || version !== compilationVersion) return;
        compiling = false;
        compiled = true;
        syncTicker();
      }, failed);
    } catch {
      failed();
    }
  };
  const syncTicker = () => {
    const canRun = visible && !document.hidden && !disposed && contextAvailable;
    if (canRun && !compiled && !compiling && compilationTimer === undefined) {
      compilationTimer = setTimeout(compile, 0);
    } else if (!canRun && compilationTimer !== undefined) {
      clearTimeout(compilationTimer);
      compilationTimer = undefined;
    }
    const active = canRun && compiled;
    if (active && !connected) {
      connected = true;
      tweens.forEach((t) => t.resume());
      gsap.ticker.add(tick);
    } else if (!active && connected) {
      gsap.ticker.remove(tick);
      connected = false;
      tweens.forEach((t) => t.pause());
    }
  };
  const resize = () => {
    if (disposed) return;
    const rect = mount.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height, false);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);
  resize();
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      syncTicker();
    },
    { rootMargin: '40px' },
  );
  observer.observe(host);
  document.addEventListener('visibilitychange', syncTicker, { signal: abort.signal });
  const setMode = (event: Event) => {
    const mode = (event as CustomEvent<Mode>).detail;
    if (!['web', 'automation', 'data', 'ai'].includes(mode)) return;
    tweens.splice(0).forEach((t) => t.kill());
    poses.forEach((p, i) =>
      tweens.push(
        gsap.to(p, {
          ...pose(i, mode),
          duration: motion.duration.morph,
          delay: (i % 16) * 0.012,
          ease: motion.morphEase,
          paused: !connected,
        }),
      ),
    );
  };
  host.addEventListener('engine:mode', setMode, { signal: abort.signal });
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    host.addEventListener(
      'pointermove',
      (e) => {
        const r = host.getBoundingClientRect();
        pointerX = (e.clientX - r.left) / r.width - 0.5;
        pointerY = (e.clientY - r.top) / r.height - 0.5;
      },
      { signal: abort.signal, passive: true },
    );
    host.addEventListener(
      'pointerleave',
      () => {
        pointerX = pointerY = 0;
      },
      { signal: abort.signal },
    );
  }
  const contextLost = (event: Event) => {
    event.preventDefault();
    delete host.dataset.ready;
    contextAvailable = false;
    compiled = false;
    compiling = false;
    compilationVersion++;
    // Releasing the program also lets Three's pending compileAsync settle safely.
    material.dispose();
    syncTicker();
  };
  renderer.domElement.addEventListener('webglcontextlost', contextLost, { signal: abort.signal });
  renderer.domElement.addEventListener(
    'webglcontextrestored',
    () => {
      if (disposed) return;
      contextAvailable = true;
      resize();
      syncTicker();
    },
    { signal: abort.signal },
  );
  // Local, deterministic assembly; no content waits for it.
  poses.forEach((p, i) => {
    const target = { ...p };
    p.z += (Math.sin(i * 17.13) + 1) * 0.55;
    p.ry += 0.25;
    tweens.push(
      gsap.to(p, {
        ...target,
        duration: 1.3,
        delay: (i % 12) * 0.018,
        ease: 'power3.out',
        paused: true,
      }),
    );
  });
  return () => {
    disposed = true;
    compilationVersion++;
    if (compilationTimer !== undefined) clearTimeout(compilationTimer);
    abort.abort();
    observer.disconnect();
    resizeObserver.disconnect();
    gsap.ticker.remove(tick);
    tweens.forEach((t) => t.kill());
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    delete host.dataset.ready;
  };
}
