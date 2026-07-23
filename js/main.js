// ============================================================
//  MAIN — wires the background and the 3 scroll-driven avatars:
//
//   · Act 1 (name/tagline) → Polygon Man      (character.js)
//   · Act 2 (About Me)     → Avatar_escalador  (avatar-escalador.js)
//   · Act 3 (chat)         → Iron Sentinel     (sentinel.js)
//
//  Each fades out and hands off to the next — see scroll-reveal.js
//  for the exact timing of the two transitions.
// ============================================================
import { initBackground, updateBackground } from './background.js';
import { initStage, renderStage, camera } from './stage.js';
import * as char from './character.js';
import { initChat } from './chat.js';
import { initCursor, updateCursor } from './cursor.js';
import { initScrollReveal, updateScrollReveal } from './scroll-reveal.js';
import { initAvatarEscalador, getEscaladorDebug } from './avatar-escalador.js';
import { initSentinel, getSentinelDebug } from './sentinel.js';
import { initI18n } from './i18n.js';

const loaderEl = document.getElementById('stage-loader');
const pctEl = document.getElementById('stage-loader-pct');

initI18n();   // English by default; toggle button switches to Spanish
initBackground();
initStage();
initCursor();
initScrollReveal();
initAvatarEscalador();
initSentinel();

// ---- load the act-1 character (Polygon Man) ----
char.loadCharacter((p) => { pctEl.textContent = Math.round(p * 100) + '%'; })
  .then(() => {
    loaderEl.classList.add('hide');
  })
  .catch((err) => {
    console.error('Error loading character:', err);
    pctEl.textContent = ':(';
  });

// ---- clicking any button → agree nod (Polygon Man, act 1) ----
document.querySelectorAll('.btn').forEach((b) =>
  b.addEventListener('click', () => char.agree())
);

// ---- "Get in touch": mailto → Gmail → copy, in a cascade ----
// mailto: depends on the VISITOR having a mail client. With none set
// (common when using Gmail in the browser) the click does nothing visible.
// So: try the native client, and if ~1s later the window never lost focus
// (nothing opened), open Gmail compose in a new tab; either way, copy the
// address and show it in a toast so the click always does something.
const mailLink = document.querySelector('.nav a[href^="mailto:"]');
if (mailLink) {
  const email = mailLink.getAttribute('href').slice('mailto:'.length);
  const gmailCompose = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(email);
  let toast = null;
  let toastTimer = null;

  mailLink.addEventListener('click', () => {
    // Gmail fallback if the mailto opened nothing (focus never left the window)
    let focusLost = false;
    const onBlur = () => { focusLost = true; };
    addEventListener('blur', onBlur);
    setTimeout(() => {
      removeEventListener('blur', onBlur);
      if (!focusLost && !document.hidden) open(gmailCompose, '_blank', 'noopener');
    }, 1000);

    // copy + toast, always
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'mail-toast';
      document.body.appendChild(toast);
    }
    const show = (text) => {
      toast.textContent = text;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
    };
    // clipboard can fail (permissions / insecure context) — then the toast
    // just shows the address, which is what matters
    if (navigator.clipboard) {
      navigator.clipboard.writeText(email)
        .then(() => show(email + '  — copied ✓'))
        .catch(() => show(email));
    } else {
      show(email);
    }
  });
}

initChat({
  onUserSend: () => char.agree(),
});

// ---- render loop ----
let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  updateBackground(now / 1000);
  char.updateCharacter(dt);
  updateCursor();
  updateScrollReveal(dt);
  renderStage();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// debug/test API from the console
window.__hero = {
  agree: char.agree,
  // advance the simulation by hand (for environments without rAF, e.g. tests)
  step(dt = 1 / 60, steps = 1) {
    for (let i = 0; i < steps; i++) {
      last += dt * 1000;
      updateBackground(last / 1000);
      char.updateCharacter(dt);
      updateCursor();
      updateScrollReveal(dt);
    }
    renderStage();
  },
  debug: {
    camZ: () => camera.position.z,
    yaw: char.getYawDebug,
    polygonOpacity: char.getOpacityDebug,
    escalador: getEscaladorDebug,
    sentinel: getSentinelDebug,
  },
};
