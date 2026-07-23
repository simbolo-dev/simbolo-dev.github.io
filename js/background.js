// ============================================================
//  BACKGROUND — custom WebGL shader: a flat warm-paper base, and as
//  the mouse moves a TRAIL of liquid blobs (each smaller and fainter
//  than the last) reveals the real carved-relief photo
//  (assets/background.jpg) — never seen in full, only the trail the
//  cursor leaves behind.
// ============================================================
const MAX_TRAIL = 20;      // how many points the trail remembers
const TRAIL_FADE = 0.45;   // seconds until a point fully fades

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
#extension GL_OES_standard_derivatives : enable
precision highp float;

#define MAX_TRAIL ${MAX_TRAIL}

uniform vec2      uRes;               // canvas size in px
uniform float     uTime;              // seconds
uniform float     uMouseOn;           // 0/1: cursor is active
uniform sampler2D uImg;               // the real photo (background.jpg)
uniform vec2      uImgSize;           // real image size in px
uniform float     uImgReady;          // 0/1: texture has loaded
uniform vec2      uTrailPos[MAX_TRAIL];  // recent cursor positions (0 = newest)
uniform float     uTrailAge[MAX_TRAIL];  // 0 = just created .. 1 = fully faded

const vec3 PAPER = vec3(0.980, 0.973, 0.957);   // #faf8f4 warm white

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}
// cheap version (2 octaves) to distort each trail point — with up to
// MAX_TRAIL points per pixel, each one should stay lightweight
float fbm2(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 2; i++) {
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

// liquid mask of ONE trail point: shrinks and fades as it ages, with a
// crisp edge (fwidth, no blur)
float blobMask(vec2 p, vec2 center, float age, float t) {
  if (age >= 1.0) return 0.0;
  vec2 rel = p - center;
  float shrink = mix(1.0, 0.22, age);
  float lobes = (fbm2(rel * 6.0 + vec2(t, -t * 0.6)) - 0.5) * 0.16 * shrink;
  float d = length(rel);
  float radius = 0.10 * shrink;
  float aa = fwidth(d) * 1.5 + 0.0015;
  float cut = 1.0 - smoothstep(radius - aa + lobes, radius + aa + lobes, d);
  return cut * (1.0 - age);
}

// "cover" mapping (like background-size:cover) so the photo isn't stretched.
// The overflowing dimension is cropped (zoom-in), NOT enlarged — otherwise
// on very tall screens the UV leaves [0,1] and CLAMP_TO_EDGE repeats the
// last edge pixel (looks "streaked").
vec2 coverUV(vec2 uv, vec2 res, vec2 img) {
  float ra = res.x / res.y, ia = img.x / img.y;
  vec2 scale = ra > ia ? vec2(1.0, ia / ra) : vec2(ra / ia, 1.0);
  return (uv - 0.5) * scale + 0.5;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = uTime * 0.035;

  // --- BASE: flat warm paper with fine grain (almost uniform) ---
  float paperN = fbm(p * 5.0);
  vec3 col = PAPER * (0.985 + 0.015 * paperN);

  // --- CURSOR MASK: TRAIL of liquid blobs, CRISP EDGE ---
  // (no blur gradient): uTrailPos[0] is the current position, the rest are
  // recent positions that shrink and fade -> reads as flowing liquid that
  // leaves a trail, not a blob that just teleports. Its own faster clock so
  // each blob morphs quickly.
  float tm = uTime * 0.35;
  float mask = 0.0;
  for (int i = 0; i < MAX_TRAIL; i++) {
    vec2 tp = vec2(uTrailPos[i].x * aspect, uTrailPos[i].y);
    mask = max(mask, blobMask(p, tp, uTrailAge[i], tm));
  }
  mask *= uMouseOn * uImgReady;

  if (mask > 0.001) {
    vec2 iuv = coverUV(uv, uRes, uImgSize);
    vec3 imgCol = texture2D(uImg, iuv).rgb;
    col = mix(col, imgCol, mask);
  }

  // very subtle vignette for depth
  float vig = smoothstep(1.25, 0.35, length(uv - 0.5));
  col *= 0.96 + 0.04 * vig;

  // animated film grain (over the whole canvas)
  float g = hash(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5;
  col += g * 0.022;

  gl_FragColor = vec4(col, 1.0);
}
`;

let gl, canvas, prog;
let uRes, uTime, uMouseOn, uImg, uImgSize, uImgReady, uTrailPos, uTrailAge;
let reduced = false;
let dpr = 1;
let imgReady = 0;

const mouse = { x: 0.5, y: 0.5, on: 0 };
const smooth = { x: 0.5, y: 0.5 };

// trail: ring buffer of recent cursor positions (newest last)
let trail = [];
const trailPosArr = new Float32Array(MAX_TRAIL * 2);
const trailAgeArr = new Float32Array(MAX_TRAIL).fill(1);   // 1 = empty/invisible

export function initBackground(imgPath = 'assets/background.jpg') {
  canvas = document.getElementById('bg-canvas');
  gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: true });
  if (!gl) { console.warn('WebGL unavailable; background disabled'); return; }

  reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  gl.getExtension('OES_standard_derivatives');   // needed for fwidth() in WebGL1

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Shader link error:', gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  uRes = gl.getUniformLocation(prog, 'uRes');
  uTime = gl.getUniformLocation(prog, 'uTime');
  uMouseOn = gl.getUniformLocation(prog, 'uMouseOn');
  uImg = gl.getUniformLocation(prog, 'uImg');
  uImgSize = gl.getUniformLocation(prog, 'uImgSize');
  uImgReady = gl.getUniformLocation(prog, 'uImgReady');
  uTrailPos = gl.getUniformLocation(prog, 'uTrailPos');
  uTrailAge = gl.getUniformLocation(prog, 'uTrailAge');

  loadTexture(imgPath);

  resize();
  addEventListener('resize', resize);
  if (!reduced) {
    addEventListener('pointermove', (e) => {
      mouse.x = e.clientX / innerWidth;
      mouse.y = e.clientY / innerHeight;
      mouse.on = 1;
    });
  }

  if (reduced) draw(0);
}

function loadTexture(src) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // 1x1 placeholder while the real image loads
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([250, 248, 244, 255]));

  const img = new Image();
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform2f(uImgSize, img.naturalWidth, img.naturalHeight);
    imgReady = 1;
    if (reduced) draw(0);
  };
  img.onerror = () => console.warn('Could not load background:', src);
  img.src = src;

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(uImg, 0);
}

function compile(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(s));
  }
  return s;
}

function resize() {
  if (!innerWidth || !innerHeight || !gl) return;
  dpr = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
  gl.viewport(0, 0, canvas.width, canvas.height);
  if (reduced) draw(0);
}

export function updateBackground(t) {
  if (!gl || reduced) return;
  draw(t);
}

function draw(t) {
  smooth.x += (mouse.x - smooth.x) * 0.06;
  smooth.y += (mouse.y - smooth.y) * 0.06;

  // drop a trail point every frame at the current smoothed position;
  // old points drop off on their own as they expire (see below)
  if (mouse.on) {
    trail.push({ x: smooth.x, y: 1.0 - smooth.y, born: t });
    if (trail.length > MAX_TRAIL) trail.shift();
  }
  trail = trail.filter((p) => t - p.born < TRAIL_FADE);

  // newest first (index 0) — empty slots stay "empty" (age=1, invisible)
  for (let i = 0; i < MAX_TRAIL; i++) {
    const p = trail[trail.length - 1 - i];
    if (p) {
      trailPosArr[i * 2] = p.x;
      trailPosArr[i * 2 + 1] = p.y;
      trailAgeArr[i] = Math.min(1, (t - p.born) / TRAIL_FADE);
    } else {
      trailAgeArr[i] = 1;
    }
  }

  gl.uniform2f(uRes, canvas.width, canvas.height);
  gl.uniform1f(uTime, t);
  gl.uniform1f(uMouseOn, mouse.on);
  gl.uniform1f(uImgReady, imgReady);
  gl.uniform2fv(uTrailPos, trailPosArr);
  gl.uniform1fv(uTrailAge, trailAgeArr);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
