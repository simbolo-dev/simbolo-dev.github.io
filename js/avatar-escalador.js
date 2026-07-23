// ============================================================
//  AVATAR_ESCALADOR — 2nd character (Meshy, climbing outfit), the
//  act-2 avatar (About Me). Replaces Polygon Man at the end of act 1
//  and hands off to the Iron Sentinel at the end of act 2 with a 360°
//  spin on its own axis (see scroll-reveal.js for timing).
//
//  Walks in a loop the whole time it's visible, even during the exit
//  spin — it never switches animation.
//
//  Loads in the background from startup (small enough — no need to wait
//  for any act, unlike the much heavier Sentinel) and NEVER on
//  mobile/reduced-motion (it isn't shown there).
// ============================================================
import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { scene } from './stage.js';
import { CONFIG } from './config.js';

const CHAR_H = 1.78;        // same scene height as the other two characters — same camera framing

// Exit spin toward act 3 (see scroll-reveal.js): 2π = a full turn, so it
// ends facing exactly where it started (no jump at the end). ADDED to
// REST_YAW, the final angle Polygon Man left the scene at (continuity).
const REST_YAW = -0.45;
const SPIN_TURNS = 1;      // full turns — 1 = 360°

const MOBILE_BREAKPOINT = 880;
const skip = matchMedia('(prefers-reduced-motion: reduce)').matches || innerWidth <= MOBILE_BREAKPOINT;

let root = null;
let mixer = null;
let material = null;
let ready = false;

// called once from main.js — starts the background load (not on
// mobile/reduced-motion, where this character never shows)
export function initAvatarEscalador() {
  if (skip) return;

  const loader = new GLTFLoader();
  loader.loadAsync(CONFIG.ESCALADOR.model).then((gltf) => {
    const model = gltf.scene;

    model.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material.metalness = 0;
        o.material.roughness = 0.95;
        o.material.transparent = true;
        o.material.opacity = 0;   // starts invisible — act 1 still shows Polygon Man
        material = o.material;
      }
    });

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

    root = new THREE.Group();
    root.visible = false;
    root.add(model);
    scene.add(root);

    // walk loop — separate clip (same skeleton), already reduced. Never
    // stops, not even during the exit spin.
    loader.loadAsync(CONFIG.ESCALADOR.walk)
      .then((g) => {
        mixer.clipAction(g.animations[0]).play();
      })
      .catch((err) => console.warn('Walk animation (escalador) unavailable:', err));

    ready = true;
  }).catch((err) => console.warn('Avatar_escalador unavailable:', err));
}

// called every frame from scroll-reveal.js:
//  - opacity: 0→1 entering act 2 (replaces Polygon Man), stays 1 through
//    act 2, then 1→0 toward act 3
//  - spinP: 0→1 progress of the exit sub-phase (act 3a) — spins 360° on
//    its axis over that sub-phase, walking the whole time
export function updateAvatarEscalador(dt, opacity, spinP) {
  if (!ready) return;

  mixer.update(dt);
  root.visible = opacity > 0.001;
  root.rotation.y = REST_YAW + spinP * SPIN_TURNS * Math.PI * 2;
  if (material) material.opacity = opacity;
}

// debug/tests (environments without rAF) — see window.__hero in main.js
export const getEscaladorDebug = () => ({
  ready,
  opacity: material ? material.opacity : null,
  visible: root ? root.visible : null,
  yaw: root ? root.rotation.y : null,
});
