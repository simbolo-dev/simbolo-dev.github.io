// ============================================================
//  MOBILE ESCALADOR — standalone 3D viewer of the climber avatar,
//  shown inside About Me on MOBILE ONLY. Desktop shows the climber via
//  the shared cinematic stage instead (see avatar-escalador.js); the
//  heavier Iron Sentinel stays desktop-only. This viewer has its own
//  renderer/scene so it never touches the desktop flow.
// ============================================================
import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { CONFIG } from './config.js';

const CHAR_H = 1.78;   // same scene height as the other avatars

// called once from main.js — only runs on mobile (where #about-canvas is
// shown by CSS) and not with reduced-motion. matchMedia matches the CSS
// breakpoint, so it doesn't depend on layout timing.
export function initMobileEscalador() {
  const canvas = document.getElementById('about-canvas');
  if (!canvas) return;
  if (!matchMedia('(max-width: 880px)').matches) return;             // desktop: shared stage handles it
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; // no motion: skip the animated model

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  // centered camera (no left offset like the main stage) — this canvas is
  // the character's own box, so it sits dead center
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 1.05, 4.6);
  camera.lookAt(0, 0.9, 0);

  scene.add(new THREE.HemisphereLight(0xfff6ea, 0xb8a68a, 1.05));
  const key = new THREE.DirectionalLight(0xfff8f0, 1.2);
  key.position.set(2.5, 4, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xf0d9b5, 0.55);
  rim.position.set(-3, 2, -2.5);
  scene.add(rim);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  let mixer = null;
  let modelRef = null;
  const loader = new GLTFLoader();
  loader.loadAsync(CONFIG.ESCALADOR.model).then((gltf) => {
    const model = gltf.scene;
    modelRef = model;

    model.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material.metalness = 0;
        o.material.roughness = 0.95;
      }
    });

    // scale to CHAR_H by measuring the posed, skinned mesh (same approach
    // as character.js) and ground it at y=0, centered on X/Z
    model.updateMatrixWorld(true);
    const bb = new THREE.Box3();
    const meshBox = new THREE.Box3();
    model.traverse((o) => {
      if (o.isSkinnedMesh) {
        o.computeBoundingBox();
        meshBox.copy(o.boundingBox).applyMatrix4(o.matrixWorld);
        bb.union(meshBox);
      }
    });
    const s = CHAR_H / (bb.max.y - bb.min.y);
    model.scale.setScalar(s);
    model.position.set(
      -(bb.min.x + bb.max.x) * 0.5 * s,
      -bb.min.y * s,
      -(bb.min.z + bb.max.z) * 0.5 * s
    );

    mixer = new THREE.AnimationMixer(model);
    scene.add(model);

    loader.loadAsync(CONFIG.ESCALADOR.walk)
      .then((g) => mixer.clipAction(g.animations[0]).play())
      .catch((err) => console.warn('Mobile walk animation unavailable:', err));
  }).catch((err) => console.warn('Mobile escalador unavailable:', err));

  let last = performance.now();
  function frame(dt) {
    if (mixer) mixer.update(dt);
    renderer.render(scene, camera);
  }
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    frame(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // debug hook (also used to force frames where rAF is paused, e.g. tests)
  window.__mobEsc = {
    frame,
    modelLoaded: () => !!modelRef,
    sceneChildren: () => scene.children.length,
    scale: () => (modelRef ? modelRef.scale.x : null),
  };
}
