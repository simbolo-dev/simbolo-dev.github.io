// ============================================================
//  CHARACTER — Meshy GLB (Polygon Man), the act-1 avatar only
//  (name/tagline). Two animations:
//
//   · listening (loop) → default state while visible
//   · agree (one-shot) → nods on a button click, then eases back
//                        to listening on its own
//
//  Fades out at the end of act 1 to hand off to Avatar_escalador
//  (avatar-escalador.js) in act 2 — see setActOpacity() and
//  scroll-reveal.js. The agree clip lives in a separate GLB (same
//  skeleton) loaded in the background.
// ============================================================
import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { scene } from './stage.js';
import { CONFIG } from './config.js';

const CHAR_H = 1.78;         // character height in scene units — sized to match the name/buttons
const FADE = 0.35;           // crossfade between listening and agree

// Drag to rotate (Y rotation of the root group; doesn't touch bones, so it
// never interferes with the animation mixer). The rotation STAYS where you
// leave it — no snap back. No angle limit (like spinning a figurine).
const DRAG_SENSITIVITY = 0.012;  // rad per dragged pixel

// real mouse only (hover + fine pointer) — excludes touch/mobile, where
// dragging the character would fight page scrolling and isn't wanted
const FINE_POINTER = matchMedia('(hover: hover) and (pointer: fine)').matches;

// Scroll-driven cinematic yaw (see scroll-reveal.js): ADDED to the drag
// yaw, not replacing it, so you can still spin with the mouse mid-scroll.
// Negative so the character ends up facing toward About Me on the left,
// as if presenting it.
const SCROLL_YAW_MAX = -0.45;    // rad (~-25.8°) at 100% scroll

let ready = false;
let root = null;
let mixer = null;
let material = null;
let actListen = null, actAgree = null;
let yaw = 0;
let scrollYaw = 0;
let dragging = false;
let lastX = 0;

export const isReady = () => ready;

const stageEl = document.getElementById('stage');
if (stageEl && FINE_POINTER) {
  stageEl.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    stageEl.setPointerCapture(e.pointerId);
  });
  stageEl.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    yaw += (e.clientX - lastX) * DRAG_SENSITIVITY;
    lastX = e.clientX;
  });
  const stopDrag = () => { dragging = false; };
  stageEl.addEventListener('pointerup', stopDrag);
  stageEl.addEventListener('pointercancel', stopDrag);
  stageEl.addEventListener('lostpointercapture', stopDrag);
}

export function loadCharacter(onProgress) {
  // Polygon Man is desktop-only — on mobile the climber (mobile-escalador.js)
  // is the single avatar, so skip this ~2.8MB download entirely.
  if (matchMedia('(max-width: 880px)').matches) return Promise.resolve();

  const loader = new GLTFLoader();

  return loader.loadAsync(CONFIG.CHARACTER.listen, (e) => {
    if (e.total) onProgress(e.loaded / e.total);
  }).then((gltf) => {
    const model = gltf.scene;

    // Meshy exports the material with metalness 1 (looks chrome): make it
    // matte for the low-poly look. transparent=true from the start (even
    // though opacity begins at 1) so it can fade out at the end of act 1
    // without recompiling the material mid-animation.
    model.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material.metalness = 0;
        o.material.roughness = 0.95;
        o.material.transparent = true;
        material = o.material;   // single mesh in this model — direct reference
      }
    });

    // listening loop from the first frame
    mixer = new THREE.AnimationMixer(model);
    actListen = mixer.clipAction(gltf.animations[0]);
    actListen.play();
    mixer.update(0);

    // Scale to CHAR_H by measuring the POSED, SKINNED mesh (Box3.setFromObject
    // doesn't apply skinning, and in Meshy GLBs the scale lives in the bones).
    // Measure BEFORE nesting in groups so world coords are local to the model.
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

    root = new THREE.Group();
    root.add(model);
    scene.add(root);
    ready = true;

    // the agree gesture arrives in the background, non-blocking
    loader.loadAsync(CONFIG.CHARACTER.agree)
      .then((g) => {
        actAgree = mixer.clipAction(g.animations[0]);
        actAgree.setLoop(THREE.LoopOnce, 1);
        actAgree.clampWhenFinished = true;
        mixer.addEventListener('finished', (e) => {
          if (e.action === actAgree) {
            actAgree.fadeOut(FADE);
            actListen.reset().fadeIn(FADE).play();
          }
        });
      })
      .catch((err) => console.warn('Agree gesture unavailable:', err));
  });
}

// nod (button click); no-op if the clip hasn't loaded yet
export function agree() {
  if (!ready || !actAgree) return;
  actListen.fadeOut(FADE);
  actAgree.reset().fadeIn(FADE).play();
}

// called from scroll-reveal.js with scroll progress 0→1
export function setScrollYaw(p) {
  scrollYaw = p * SCROLL_YAW_MAX;
}

// called from scroll-reveal.js at the end of act 1: Polygon Man fades
// (1→0) to hand off to Avatar_escalador (avatar-escalador.js) in act 2,
// in the same spot
export function setActOpacity(opacity) {
  if (material) material.opacity = opacity;
  if (root) root.visible = opacity > 0.001;
}

// debug/tests (environments without rAF) — see window.__hero in main.js
export const getYawDebug = () => ({ drag: yaw, scroll: scrollYaw, total: yaw + scrollYaw });
export const getOpacityDebug = () => (material ? material.opacity : null);

export function updateCharacter(dt) {
  if (mixer) mixer.update(dt);
  if (root) {
    root.rotation.y = yaw + scrollYaw;   // yaw stays where the user dragged it (no snap back)
  }
}
