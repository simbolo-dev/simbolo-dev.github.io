// ============================================================
//  SENTINEL — 3rd character (Iron Sentinel, Meshy) that replaces
//  Polygon Man in act 3 of the cinematic scroll (see scroll-reveal.js).
//  Lazy loaded: NOT downloaded at all on mobile/reduced-motion (never
//  shown there, and it's heavy), and on desktop the download starts only
//  on entering act 2, so it's ready in the background by act 3.
// ============================================================
import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { scene } from './stage.js';
import { CONFIG } from './config.js';

const CHAR_H = 1.78;   // same scene height as Polygon Man (character.js) — same camera framing
const ENTER_YAW = -0.45;   // continues Polygon Man's final angle (see character.js), a "handoff" feel
const SPIN_TURNS = 1;      // full turns on entry — mirrors Polygon Man's exit spin

const MOBILE_BREAKPOINT = 880;
const skip = matchMedia('(prefers-reduced-motion: reduce)').matches || innerWidth <= MOBILE_BREAKPOINT;

let root = null;
let mixer = null;
let action = null;
let material = null;
let loadStarted = false;
let ready = false;
let wasVisible = false;   // rising edge: re-triggers the animation on each re-entry

// called once from main.js — no-op on mobile/reduced-motion
export function initSentinel() {}

// called from scroll-reveal.js on entering act 2: kicks off the background
// download (idempotent — only starts once)
export function ensureSentinelLoading() {
  if (skip || loadStarted) return;
  loadStarted = true;

  new GLTFLoader().loadAsync(CONFIG.SENTINEL).then((gltf) => {
    const model = gltf.scene;

    model.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material.metalness = Math.min(o.material.metalness ?? 1, 0.6);
        o.material.roughness = Math.max(o.material.roughness ?? 0, 0.5);
        o.material.transparent = true;
        o.material.opacity = 0;
        material = o.material;   // single mesh in this model — direct reference
      }
    });

    // Scale to CHAR_H by measuring the POSED mesh (Box3 doesn't apply
    // skinning on Meshy GLBs) — same approach as character.js
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
      -bb.min.y * s,                             // feet at y=0
      -(bb.min.z + bb.max.z) * 0.5 * s
    );

    mixer = new THREE.AnimationMixer(model);
    action = mixer.clipAction(gltf.animations[0]);   // "Charged Axe Chop", the only clip
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;

    root = new THREE.Group();
    root.visible = false;
    root.add(model);
    scene.add(root);
    ready = true;
  }).catch((err) => console.warn('Iron Sentinel unavailable:', err));
}

// debug/tests (environments without rAF) — see window.__hero in main.js
export const getSentinelDebug = () => ({
  loadStarted, ready, wasVisible,
  opacity: material ? material.opacity : null,
  visible: root ? root.visible : null,
  animTime: action ? action.time : null,
  yaw: root ? root.rotation.y : null,
});

// called every frame from scroll-reveal.js with the act-3 fade-in progress
// 0→1. The animation (re)fires from the start each time it's ENTERED (rising
// edge: invisible→visible), so scrolling out and back in replays it without
// a reload. It runs in real time (not tied to scroll) until it finishes and
// clamps on its last frame.
//
// Spins as it enters (mirror of Polygon Man's exit spin): starts "wound up"
// one extra full turn and unwinds it as p advances, landing exactly on
// ENTER_YAW right as it reaches full opacity (2π ≡ 0 visually, no jump).
export function updateSentinel(dt, p) {
  if (!ready) return;

  const isVisible = p > 0.001;
  if (isVisible && !wasVisible) action.reset().play();
  wasVisible = isVisible;

  mixer.update(dt);
  root.visible = isVisible;
  root.rotation.y = ENTER_YAW + (1 - p) * SPIN_TURNS * Math.PI * 2;
  if (material) material.opacity = p;
}
