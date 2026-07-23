// ============================================================
//  STAGE — transparent Three.js scene the character lives in
// ============================================================
import * as THREE from 'three';

export let scene, camera, renderer;
let canvas;

const CAM_Z_BASE = 4.6;    // resting distance
const CAM_Z_PUSH = 0.4;    // how far it dollies in at 100% scroll (subtle push-in)

export function initStage() {
  canvas = document.getElementById('char-canvas');

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();

  // camera offset left → character sits on the right of the canvas,
  // hugging the name text
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(-0.42, 1.05, CAM_Z_BASE);
  camera.lookAt(-0.42, 0.82, 0);

  // warm lighting to match the cream/wood background
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0xb8a68a, 1.05));
  const key = new THREE.DirectionalLight(0xfff8f0, 1.2);
  key.position.set(2.5, 4, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xf0d9b5, 0.55);
  rim.position.set(-3, 2, -2.5);
  scene.add(rim);

  resize();
  addEventListener('resize', resize);
}

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// cinematic push-in tied to scroll progress (0→1) — see scroll-reveal.js.
// Position only: no updateProjectionMatrix needed (that's for fov/aspect).
export function updateCameraPush(p) {
  camera.position.z = CAM_Z_BASE - CAM_Z_PUSH * p;
}

export function renderStage() {
  renderer.render(scene, camera);
}
