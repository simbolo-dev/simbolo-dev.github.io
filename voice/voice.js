// ============================================================
//  VOICE — mantén presionado, habla, suelta.
//  Graba con MediaRecorder y manda el audio al Worker, que lo
//  transcribe Y responde en la misma llamada.
// ============================================================

const ENDPOINT = 'https://clone-api.alanalarconoviedo.workers.dev';
const MAX_SECONDS = 20;    // corta solo: protege tu cuota diaria
const MAX_HISTORY = 12;

const mic = document.getElementById('mic');
const statusEl = document.getElementById('status');
const thread = document.getElementById('thread');

const history = [];
let recorder = null;
let chunks = [];
let stream = null;
let cutoff = null;
let busy = false;

// Reusamos el idioma que el visitante ya eligió en tu sitio.
const lang = () => (localStorage.getItem('site-lang') === 'es' ? 'es' : 'en');

const T = {
  idle:   { es: 'Mantén presionado para hablar',      en: 'Press and hold to speak' },
  listen: { es: 'Te escucho…',                        en: 'Listening…' },
  think:  { es: 'Pensando…',                          en: 'Thinking…' },
  denied: { es: 'No me diste acceso al micrófono.',   en: 'Microphone access was denied.' },
  nomic:  { es: 'Tu navegador no deja grabar aquí.',  en: "Your browser won't allow recording here." },
  short:  { es: 'Muy corto. Inténtalo otra vez.',     en: 'Too short. Try again.' },
  oops:   { es: 'Algo falló. Intenta otra vez.',      en: 'Something broke. Try again.' },
};
const say = (k) => { statusEl.textContent = T[k][lang()]; };

function bubble(cls, text) {
  const el = document.createElement('div');
  el.className = 'msg ' + cls;
  el.textContent = text;
  thread.appendChild(el);
  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// Chrome y Firefox graban en webm; Safari en mp4. Gemini acepta los
// dos, así que no convertimos nada: preguntamos qué soporta este
// navegador y mandamos eso tal cual.
function pickMime() {
  for (const m of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) {
    if (window.MediaRecorder?.isTypeSupported?.(m)) return m;
  }
  return '';
}

async function startRecording() {
  if (busy || recorder) return;
  if (!navigator.mediaDevices?.getUserMedia) { say('nomic'); return; }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    say('denied');
    return;
  }

  const mimeType = pickMime();
  recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  chunks = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  recorder.onstop = handleStop;
  recorder.start();

  mic.classList.add('recording');
  say('listen');
  startViz(stream);

  // Freno de mano: si alguien deja el botón presionado, cortamos solos.
  cutoff = setTimeout(stopRecording, MAX_SECONDS * 1000);
}

function stopRecording() {
  clearTimeout(cutoff);
  mic.classList.remove('recording');
  if (recorder && recorder.state !== 'inactive') recorder.stop();
}

async function handleStop() {
  // Soltar el micrófono apaga el indicador del sistema. Si no lo
  // haces, el puntito rojo se queda prendido y el visitante siente
  // que lo sigues grabando. Es la promesa del pie de página.
  stream?.getTracks().forEach((tr) => tr.stop());
  stream = null;
  recorder = null;

  const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' });
  chunks = [];
  if (blob.size < 2000) { say('short'); return; }

    busy = true;
  mic.disabled = true;
  say('think');
  vizMode = 'thinking';

  try {
    const audio = await blobToBase64(blob);
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio,
        audioMime: blob.type.split(';')[0] || 'audio/webm',
        mode: 'voice',
        lang: lang(),
        messages: history,
      }),
    });
    const data = await r.json();
    const text = data.reply || T.oops[lang()];

       bubble('clone', text);
    speak(text);
    history.push({ role: 'user', content: '(pregunta por voz)' });
    history.push({ role: 'assistant', content: text });
    if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);

    say('idle');
   } catch {
    say('oops');
    vizMode = 'idle';
  } finally {
    busy = false;
    mic.disabled = false;
  }
}

// FileReader devuelve "data:audio/webm;base64,AAAA…".
// Nos quedamos con lo de después de la coma, que es lo que espera la API.
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(',')[1]);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

// pointerdown cubre mouse, dedo y lápiz con un solo juego de eventos.
// El "soltar" va en window, no en el botón: así, si mueves el dedo
// un poco fuera del círculo antes de soltar, igual se detiene bien.

// En iOS y Android, speechSynthesis solo despierta si lo llamas dentro
// de un gesto real del usuario. Nuestra respuesta llega segundos
// después, cuando el navegador ya "olvidó" que tocaste la pantalla, y
// bloquea el audio sin avisar.
//
// La vacuna: al presionar el botón le mandamos una frase muda. Eso
// cuenta como gesto y deja el sintetizador despierto el resto de la
// sesión. En escritorio no hace falta, pero tampoco estorba.
let ttsUnlocked = false;
function unlockTTS() {
  if (ttsUnlocked || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  window.speechSynthesis.speak(u);
  ttsUnlocked = true;
}

mic.addEventListener('pointerdown', (e) => { e.preventDefault(); unlockTTS(); startRecording(); });
window.addEventListener('pointerup', stopRecording);
window.addEventListener('pointercancel', stopRecording);

say('idle');


// ============================================================
//  LA VOZ — speechSynthesis vive dentro del navegador.
//  No gasta cuota, no viaja a ningún servidor, y empieza a sonar
//  al instante. Por eso descartamos el TTS de Gemini: daba 10
//  peticiones al día y además habría agregado segundos de espera.
// ============================================================

let voices = [];
const loadVoices = () => { voices = window.speechSynthesis?.getVoices() || []; };
loadVoices();
// En Chrome la lista llega tarde; sin esto, la primera respuesta
// sonaría con la voz equivocada o con ninguna.
if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = loadVoices;

// El idioma lo decide lo que el clon RESPONDIÓ, no lo que tu sitio
// tenga configurado: si alguien te habla en español, contesta en
// español aunque la interfaz esté en inglés.
function guessLang(text) {
  if (/[áéíóúñ¿¡]/i.test(text)) return 'es';
  if (/\b(que|para|con|pero|como|cuando|dónde|esto|eso|soy|hice)\b/i.test(text)) return 'es';
  return 'en';
}

// Orden de preferencia por nombre. Aquí me equivoqué antes: asumí que
// las voces "local" sonaban mejor, y en Windows es al revés — las
// Microsoft Helena/Laura/Pablo son SAPI viejo. Las de Google viven en
// la red y suenan muy por encima.
//
// La de Estados Unidos va primero a propósito: trae acento latino.
// Las demás en español son es-ES, de España, y el clon sonaba peninsular.
const PREFERRED = [
  'Google español de Estados Unidos',
  'Google español',
  'Google US English',
  'Google UK English Female',
];

function chooseVoice(matches) {
  if (!matches.length) return null;
  for (const name of PREFERRED) {
    const hit = matches.find((v) => v.name === name);
    if (hit) return hit;
  }
  // Si no está ninguna de las favoritas, cualquier Google antes que
  // cualquier otra cosa.
  return matches.find((v) => /google/i.test(v.name)) || matches[0];
}

function speak(text) {
  const synth = window.speechSynthesis;
    if (!synth) { vizMode = 'idle'; return; }

  const start = () => {
    // Pedimos la lista fresca cada vez. La guardada puede estar vacía
    // si el navegador todavía no la había cargado en el primer intento.
     const list = synth.getVoices() || [];
    const code = guessLang(text);
    const matches = list.filter((v) => v.lang.toLowerCase().startsWith(code));
    const voice = chooseVoice(matches);

    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : (code === 'es' ? 'es-MX' : 'en-US');
    u.rate = 1.03;   // el default suena arrastrado
       u.onstart = () => { vizMode = 'speaking'; };
    u.onend = () => { vizMode = 'idle'; };
    u.onerror = (e) => { vizMode = 'idle'; console.warn('speechSynthesis error:', e.error); };
    synth.speak(u);
  };

  // AQUÍ ESTABA EL BUG. Chrome descarta la frase si cancelas y hablas
  // en el mismo instante. Solo cancelamos si de verdad hay algo
  // sonando, y le damos un respiro antes de la siguiente.
  if (synth.speaking || synth.pending) {
    synth.cancel();
    setTimeout(start, 120);
  } else {
    start();
  }
}


// ============================================================
//  VISUALIZADOR
//  Mientras grabas, las barras son tu voz de verdad: salen de un
//  AnalyserNode conectado al micrófono.
//  Mientras el clon habla, son sintéticas — speechSynthesis no
//  expone su audio a Web Audio, así que nadie puede medirlo. Lo
//  digo para que lo sepas tú, no para que lo sepa el visitante.
// ============================================================

const viz = document.getElementById('viz');
const vctx = viz.getContext('2d');
const BARS = 44;

let audioCtx = null;
let analyser = null;
let freq = null;
let vizMode = 'idle';   // idle · listening · thinking · speaking

function startViz(mediaStream) {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const src = audioCtx.createMediaStreamSource(mediaStream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.72;   // sin esto las barras tiemblan
  src.connect(analyser);
  freq = new Uint8Array(analyser.frequencyBinCount);
  vizMode = 'listening';
}

function drawViz() {
  requestAnimationFrame(drawViz);

  const w = viz.width, h = viz.height, mid = h / 2;
  vctx.clearRect(0, 0, w, h);

  const gap = 6;
  const bw = (w - gap * (BARS - 1)) / BARS;
  const now = performance.now() / 1000;

  if (vizMode === 'listening' && analyser) analyser.getByteFrequencyData(freq);

  vctx.fillStyle = '#221f1c';
  vctx.globalAlpha = vizMode === 'idle' ? 0.22 : 0.8;

  for (let i = 0; i < BARS; i++) {
    let v;
    if (vizMode === 'listening' && analyser) {
      // Nos quedamos con el tercio grave-medio del espectro: es donde
      // vive la voz. Las frecuencias altas casi no se mueven y harían
      // que el lado derecho se viera muerto.
      const idx = Math.floor((i / BARS) * freq.length * 0.45);
      v = (freq[idx] / 255) ** 0.8;
    } else if (vizMode === 'speaking') {
      v = 0.15 + 0.32 * Math.abs(Math.sin(now * 7 + i * 0.45) * Math.sin(now * 2.1 + i * 0.17));
    } else if (vizMode === 'thinking') {
      v = 0.05 + 0.04 * Math.sin(now * 3 - i * 0.3);
    } else {
      v = 0.02;
    }

    const bh = Math.max(4, v * h * 0.92);
    const x = i * (bw + gap);
    const y = mid - bh / 2;
    if (vctx.roundRect) {
      vctx.beginPath();
      vctx.roundRect(x, y, bw, bh, bw / 2);
      vctx.fill();
    } else {
      vctx.fillRect(x, y, bw, bh);
    }
  }
  vctx.globalAlpha = 1;
}
drawViz();