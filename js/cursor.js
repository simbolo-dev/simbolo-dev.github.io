// ============================================================
//  CURSOR — custom dot (Linear/Vercel style): follows the mouse
//  with slight inertia, grows and fades over interactive elements,
//  and shrinks on click for tactile feedback.
//
//  Only active with a real mouse (hover:hover + pointer:fine);
//  touch/mobile keeps the native cursor.
// ============================================================
const FINE_POINTER = matchMedia('(hover: hover) and (pointer: fine)').matches;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = REDUCED ? 1 : 0.22;   // 1 = no inertia (snaps instantly)

const HOVER_SELECTOR = 'a, button, input, .btn, .clone-bar, #stage';

let dot = null, inner = null;
let tx = 0, ty = 0, x = 0, y = 0;
let active = false;

export function initCursor() {
  if (!FINE_POINTER) return;   // touch/tablet: native cursor, no change

  document.body.classList.add('custom-cursor');

  dot = document.createElement('div');
  dot.className = 'cursor-dot';
  inner = document.createElement('div');
  inner.className = 'cursor-dot-inner';
  dot.appendChild(inner);
  document.body.appendChild(dot);

  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!active) { x = tx; y = ty; active = true; dot.classList.add('visible'); }
  });
  addEventListener('pointerdown', () => inner.classList.add('pressed'));
  addEventListener('pointerup', () => inner.classList.remove('pressed'));
  document.addEventListener('mouseleave', () => dot.classList.remove('visible'));
  document.addEventListener('mouseenter', () => { if (active) dot.classList.add('visible'); });

  // grow over interactive elements (delegated: works for anything loaded later)
  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest(HOVER_SELECTOR);
    inner.classList.toggle('hover', !!el && !el.classList.contains('btn-disabled'));
  });
}

export function updateCursor() {
  if (!dot) return;
  x += (tx - x) * EASE;
  y += (ty - y) * EASE;
  dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}
