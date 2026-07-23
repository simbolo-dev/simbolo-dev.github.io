// ============================================================
//  AI CLONE — hero chat bar
//  With no endpoint configured it replies in demo mode; with
//  CONFIG.CHAT_ENDPOINT it does POST {message} → {reply}.
//  Also cues the character: listen while typing, nod on reply.
//  Replies follow the site language (see i18n.js); the keyword
//  matchers accept both English and Spanish.
// ============================================================
import { CONFIG } from './config.js';
import { getLang } from './i18n.js';

// keyword-based demo replies, bilingual (edit to taste)
const DEMO = [
  {
    re: /proyecto|project|work|trabajo|portafolio|portfolio/i,
    en: "Check out 'View Projects' up top — I mix generative AI (ComfyUI), interactive 3D web with Three.js, and AI automation. More projects landing soon. 🚀",
    es: "Mirá 'Ver Proyectos' arriba — mezclo IA generativa (ComfyUI), web 3D interactiva con Three.js y automatización con IA. Pronto suben más proyectos. 🚀",
  },
  {
    re: /cv|curr[ií]culum|resume/i,
    en: "You can grab my CV with the 'Download CV' button. Short version: I blend IT Ops with creative technology.",
    es: "Podés bajar mi CV con el botón 'Descargar CV'. Versión corta: combino IT Ops con tecnología creativa.",
  },
  {
    re: /skills?|habilidad|sabes hacer|tecnolog[ií]as|stack|tech/i,
    en: "Technical: IT Operations, JavaScript, Three.js, React, Remotion, APIs/automation, applied AI. Creative: motion graphics, visual design, branding, storytelling.",
    es: "Técnico: IT Operations, JavaScript, Three.js, React, Remotion, APIs/automatización, IA aplicada. Creativo: motion graphics, diseño visual, branding, storytelling.",
  },
  {
    re: /hobbies?|pasi[oó]n|tiempo libre|gusta hacer|outdoor/i,
    en: "Four things drive me: art, humanities, technology, and the outdoors. I live at the crossroads of all four.",
    es: "Cuatro cosas me mueven: arte, humanidades, tecnología y outdoors. Vivo en el cruce de las cuatro.",
  },
  {
    re: /personalidad|c[oó]mo eres|c[oó]mo piensas|mbti|personality/i,
    en: "Curious and multidisciplinary — comfortable between systematic thinking (IT/Ops) and the creative side. I learn fast and connect ideas across fields.",
    es: "Curioso y multidisciplinario — cómodo entre el pensamiento sistemático (IT/Ops) y el lado creativo. Aprendo rápido y conecto ideas de campos distintos.",
  },
  {
    re: /contrat|trabajar juntos|presupuesto|precio|cotiz|hire|freelance|servicio|collaborat/i,
    en: "For work or collaboration, email Alan directly at alanalarconoviedo@gmail.com — the human answers those, not me. 😄",
    es: "Para trabajo o colaboración, escribile directo a Alan a alanalarconoviedo@gmail.com — eso lo responde el humano, no yo. 😄",
  },
  {
    re: /qui[eé]n|who|eres|about|ti mismo|yourself/i,
    en: "I'm Alan's clone: creative technologist, half art, half code. Ask me about his projects, skills, hobbies, or how to reach him.",
    es: "Soy el clon de Alan: creative technologist, mitad arte, mitad código. Preguntame por sus proyectos, skills, hobbies o cómo contactarlo.",
  },
  {
    re: /contact|contacto|email|correo|reach/i,
    en: "Email Alan at alanalarconoviedo@gmail.com — the human replies slower than me, but he replies. 😄",
    es: "Escribile a Alan a alanalarconoviedo@gmail.com — el humano responde más lento que yo, pero responde. 😄",
  },
  {
    re: /gracias|thanks|thank you/i,
    en: "Anytime! 🙌 Anything else you'd like to know?",
    es: "¡De nada! 🙌 ¿Algo más que quieras saber?",
  },
  {
    re: /hola|hello|hi|hey/i,
    en: "Hey! 👋 I'm Alan's AI clone. Want to hear about his projects, skills, hobbies, or how to reach him?",
    es: "¡Hola! 👋 Soy el clon IA de Alan. ¿Querés saber de sus proyectos, skills, hobbies o cómo contactarlo?",
  },
];

const FALLBACK = {
  en: "I'm still a demo version of Alan's clone — ask me about his projects, skills, hobbies, the CV, or how to reach him, and I'll actually help. 🙂",
  es: "Todavía soy una versión demo del clon de Alan — preguntame por sus proyectos, skills, hobbies, el CV o cómo contactarlo, ahí sí te respondo bien. 🙂",
};
const TYPING = { en: 'typing…', es: 'escribiendo…' };
const ENDPOINT_ERR = {
  en: "Oops, my stack isn't responding right now. Try again in a bit. 🔌",
  es: "Ups, mi stack no responde ahora mismo. Intentá de nuevo en un rato. 🔌",
};

export function initChat({ onUserTyping, onUserSend, onBotReply } = {}) {
  const form = document.getElementById('clone-form');
  const input = document.getElementById('clone-input');
  const thread = document.getElementById('clone-thread');

  input.addEventListener('focus', () => onUserTyping?.(true));
  input.addEventListener('blur', () => onUserTyping?.(false));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    addMsg(thread, 'user', text);
    onUserSend?.();

    const typing = addMsg(thread, 'bot typing', TYPING[getLang()]);
    const reply = await getReply(text);
    typing.classList.remove('typing');
    typing.textContent = reply;
    thread.scrollTop = thread.scrollHeight;
    onBotReply?.();
  });
}

function addMsg(thread, cls, text) {
  const el = document.createElement('div');
  el.className = 'msg ' + cls;
  el.textContent = text;
  thread.appendChild(el);
  thread.scrollTop = thread.scrollHeight;
  return el;
}

async function getReply(message) {
  const lang = getLang();
  if (CONFIG.CHAT_ENDPOINT) {
    try {
      const r = await fetch(CONFIG.CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, lang }),
      });
      const data = await r.json();
      return data.reply || FALLBACK[lang];
    } catch {
      return ENDPOINT_ERR[lang];
    }
  }
  // demo mode: small pause so it feels alive
  await new Promise((res) => setTimeout(res, 600 + Math.random() * 700));
  const hit = DEMO.find((d) => d.re.test(message));
  return hit ? hit[lang] : FALLBACK[lang];
}
