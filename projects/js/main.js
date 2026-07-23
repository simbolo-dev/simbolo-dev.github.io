// ============================================================
//  PROJECTS — reuses the home's shader background and custom cursor
//  (../../js/background.js, ../../js/cursor.js) so both pages feel like
//  one site. imgPath is passed explicitly because the "assets/..."
//  relative path inside the module resolves against THIS page (one level
//  deeper than the home), not against the .js file's location.
// ============================================================
import { initBackground, updateBackground } from '../../js/background.js';
import { initCursor, updateCursor } from '../../js/cursor.js';
import { initI18n } from '../../js/i18n.js';

initI18n();   // English by default; toggle button switches to Spanish
initBackground('../assets/background.jpg');
initCursor();

function loop(now) {
  updateBackground(now / 1000);
  updateCursor();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
