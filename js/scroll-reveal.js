// ============================================================
//  SCROLL REVEAL — 3-act cinematic transition inside the extra 330vh
//  of `.hero-scroll` (`.hero` is pinned with position: sticky while it
//  scrolls). 3 avatars, one per act — 2 transitions, each SEQUENTIAL
//  (never two things at once in the same spot): the outgoing one fades
//  fully before the incoming one starts to appear.
//
//  - ACT 1 (0 → 1/3): Polygon Man (`.stage`, character.js) crosses right
//    while spinning (yaw) with a camera push-in; `.intro` fades in place.
//    Near the end (introP 0.7→1) he fades too, making room for
//    Avatar_escalador.
//  - ACT 2 (1/3 → 2/3): Avatar_escalador (avatar-escalador.js) appears as
//    the act starts (aboutInP 0→0.3) and walks the rest — same spot/camera
//    Polygon Man left. `.about` slides in toward the left/center.
//  - ACT 3 (2/3 → 1), in two halves: first (2/3→5/6) `.about` fades AND
//    Avatar_escalador spins 360° on its axis (walking throughout), fading
//    only near the end; then (5/6→1) the Iron Sentinel (sentinel.js, also
//    spins on entry) appears with its entrance animation, and `.clone`
//    (the chat) fades AND slides in — `.clone` is fixed, so it "appears"
//    instead of scrolling up with the document.
//
//  Everything is a pure function of progress → reversible by scrolling
//  back. Avatar_escalador loads from startup alongside Polygon Man. The
//  Sentinel (much heavier) only starts downloading on entering act 2, so
//  nobody pays that weight in the initial load.
//
//  Disabled on mobile (a one-column layout has no left/right to animate)
//  and with prefers-reduced-motion: both add the .static class and the CSS
//  leaves everything in place (camera/yaw/Escalador/Sentinel stay at their
//  resting values — and neither Escalador nor Sentinel downloads there,
//  see their modules).
// ============================================================
import { updateCameraPush } from './stage.js';
import { setScrollYaw, setActOpacity } from './character.js';
import { updateAvatarEscalador } from './avatar-escalador.js';
import { ensureSentinelLoading, updateSentinel } from './sentinel.js';

const MOBILE_BREAKPOINT = 880;
const skipScrub = matchMedia('(prefers-reduced-motion: reduce)').matches || innerWidth <= MOBILE_BREAKPOINT;

// how far avatar and text cross (% of each one's own width) — tuned by eye
// in the preview until the crossover looked right
const STAGE_SWING_PCT = 72;    // .stage slides right
const ABOUT_SWING_PCT = -115;  // .about slides left/center
const CLONE_SWING_PCT = -45;   // .clone slides in from the left

const THIRD = 1 / 3;
const TWO_THIRDS = 2 / 3;
const ACT3_MID = 5 / 6;   // midpoint of act 3: everything fades out first, then the Sentinel enters

let wrap, stageEl, introEl, aboutEl, shadowEl, cloneEl;
let active = false;

export function initScrollReveal() {
  wrap = document.getElementById('hero-scroll');
  stageEl = document.getElementById('stage');
  introEl = document.getElementById('intro');
  aboutEl = document.getElementById('about');
  shadowEl = document.querySelector('.stage-shadow');
  cloneEl = document.querySelector('.clone');
  if (!wrap) return;

  if (skipScrub) {
    wrap.classList.add('static');
    return;   // the .static CSS already places everything; nothing to animate
  }
  active = true;
}

// smooths 0..1 (ease-in-out) — feels more cinematic than linear
const smoothstep = (x) => x * x * (3 - 2 * x);

function getProgress() {
  const total = wrap.offsetHeight - innerHeight;   // how much scroll the pin "consumes"
  if (total <= 0) return 0;
  const scrolled = -wrap.getBoundingClientRect().top;
  return smoothstep(Math.min(1, Math.max(0, scrolled / total)));
}

// called every frame from main.js — cheap when there's nothing to animate
export function updateScrollReveal(dt) {
  if (!active) return;
  const p = getProgress();

  // ---- ACT 1: intro fades + Polygon Man crosses/spins/pushes in ----
  const introP = Math.min(1, p / THIRD);

  introEl.style.opacity = 1 - introP;
  introEl.style.pointerEvents = introP > 0.5 ? 'none' : 'auto';

  if (stageEl) stageEl.style.transform = `translateX(${STAGE_SWING_PCT * introP}%)`;
  updateCameraPush(introP);
  setScrollYaw(introP);
  if (shadowEl) shadowEl.style.transform = `translateX(-50%) scale(${1 + 0.1 * introP})`;

  // Polygon Man fades over the last 30% of act 1 — by the time act 2 starts
  // (introP reaches 1) he's already at opacity 0
  const polygonOutP = Math.min(1, Math.max(0, (introP - 0.7) / 0.3));
  setActOpacity(1 - polygonOutP);

  // ---- ACT 2: Avatar_escalador appears + About Me appears ----
  const aboutInP = Math.min(1, Math.max(0, (p - THIRD) / THIRD));

  // Avatar_escalador enters fast at the start of act 2 (Polygon Man already
  // faded out just before, in act 1 — the two are never visible at once)
  const escaladorInP = Math.min(1, aboutInP / 0.3);

  // the avatar's final position lands where About Me's original column
  // starts — if the slide moved at the same rate as the fade, you'd see it
  // pass behind/over the now-still avatar. So it slides FASTER than it fades
  // (finishes the trip early, still fairly transparent) and only keeps
  // brightening afterward, already clear of it.
  const aboutSlideP = Math.min(1, aboutInP / 0.35);
  aboutEl.style.transform = `translateX(${ABOUT_SWING_PCT * aboutSlideP}%)`;

  // ---- ACT 3a (2/3→5/6): About Me fades + Avatar_escalador spins 360°
  // (inside updateAvatarEscalador) and only fades near the end — you see the
  // full spin, not a flat crossfade ----
  const act3OutP = Math.min(1, Math.max(0, (p - TWO_THIRDS) / (THIRD / 2)));
  const spinFadeP = Math.min(1, Math.max(0, (act3OutP - 0.6) / 0.4));   // fade only the last 40% of the spin
  const aboutOpacity = aboutInP * (1 - act3OutP);

  aboutEl.style.opacity = aboutOpacity;
  aboutEl.style.pointerEvents = aboutOpacity > 0.5 ? 'auto' : 'none';

  const escaladorOpacity = escaladorInP * (1 - spinFadeP);
  updateAvatarEscalador(dt, escaladorOpacity, act3OutP);

  // ---- ACT 3b (5/6→1): Iron Sentinel + the chat enter ----
  const act3InP = Math.min(1, Math.max(0, (p - ACT3_MID) / (THIRD / 2)));

  if (p >= THIRD) ensureSentinelLoading();   // start the background download on entering act 2
  updateSentinel(dt, act3InP);

  // the chat ("Talk to my AI clone") appears with the Sentinel, fading AND
  // sliding (like About Me) instead of a flat fade — .clone is fixed (see
  // hero.css), so it "appears" instead of scrolling up with the document
  if (cloneEl) {
    cloneEl.style.opacity = act3InP;
    cloneEl.style.pointerEvents = act3InP > 0.5 ? 'auto' : 'none';
    cloneEl.style.transform = `translateY(-50%) translateX(${CLONE_SWING_PCT * (1 - act3InP)}%)`;
  }
}
