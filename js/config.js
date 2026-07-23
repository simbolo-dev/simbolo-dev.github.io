// ============================================================
//  CONFIG — all hero settings in one place
// ============================================================
export const CONFIG = {
  // Act 1 avatar (name/tagline) — Polygon Man: listen loop + agree nod.
  CHARACTER: {
    listen: 'assets/models/polygon-man/listen.glb',  // model + idle listen loop
    agree:  'assets/models/polygon-man/agree.glb',   // nods when a button is clicked
  },

  // Act 2 avatar (About Me) — climber outfit; walks in a loop and spins
  // 360° into act 3. `walk` is just the AnimationClip (same skeleton as
  // `model`, stripped of mesh/texture to keep it tiny).
  ESCALADOR: {
    model: 'assets/models/avatar-escalador/model.glb',  // mesh + texture
    walk:  'assets/models/avatar-escalador/walk.glb',   // walk loop clip
  },

  // Act 3 avatar (chat) — replaces ESCALADOR. Single GLB with an
  // 8s "Charged Axe Chop" entrance clip (LoopOnce).
  SENTINEL: 'assets/models/iron-sentinel/entrance.glb',

  // AI clone endpoint. Empty = local demo replies.
  // When wired up: should accept POST {message} and return {reply}.
  CHAT_ENDPOINT: '',

  // The background is a custom WebGL shader — see js/background.js.
};
