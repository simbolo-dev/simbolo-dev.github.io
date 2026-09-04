// ============================================================
//  AI CLONE — hero chat bar
//  With no endpoint configured it replies in demo mode; with
//  CONFIG.CHAT_ENDPOINT it does POST {messages, lang} → {reply},
//  sending the whole thread so follow-up questions work.
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
    en: "Check out 'View Projects' up top — they're all there. I build AI automations, WhatsApp agents, and this 3D site. More landing soon. 🚀",
    es: "Mira 'Ver Proyectos' arriba — ahí están. Construyo automatizaciones con IA, agentes de WhatsApp y este sitio 3D. Pronto suben más. 🚀",
  },
  {
    re: /cv|curr[ií]culum|resume/i,
    en: "You can grab my CV with the 'Download CV' button. Short version: technical support engineer who also builds AI tools.",
    es: "Puedes bajar mi CV con el botón 'Descargar CV'. Versión corta: ingeniero de soporte técnico que además construye herramientas con IA.",
  },
  {
    re: /skills?|habilidad|sabes hacer|tecnolog[ií]as|stack|tech/i,
    en: "My strongest ground: IT operations — P1/P2 incidents, ServiceNow, Active Directory, VMware. On the other side: Python, JavaScript, LLM API integration and automation.",
    es: "Lo más sólido: operaciones de TI — incidentes P1/P2, ServiceNow, Active Directory, VMware. Y del otro lado: Python, JavaScript, integración de APIs de LLM y automatización.",
  },
  {
    re: /hobbies?|pasi[oó]n|tiempo libre|gusta hacer|outdoor/i,
    en: "Four things drive me: art, humanities, technology, and the outdoors. Indoor climbing above all — it's how I get back into my body.",
    es: "Cuatro cosas me mueven: arte, humanidades, tecnología y outdoors. Sobre todo la escalada indoor — es mi forma de volver al cuerpo.",
  },
  {
    re: /personalidad|c[oó]mo eres|c[oó]mo piensas|mbti|personality/i,
    en: "Curious and multidisciplinary — comfortable between systematic thinking (IT/Ops) and the creative side. I learn fast and connect ideas across fields.",
    es: "Curioso y multidisciplinario — cómodo entre el pensamiento sistemático de IT/Ops y el lado creativo. Aprendo rápido y conecto ideas de campos distintos.",
  },
  {
    re: /contrat|trabajar juntos|presupuesto|precio|cotiz|hire|freelance|servicio|collaborat/i,
    en: "For work or collaboration, email Alan directly at alanalarconoviedo@gmail.com — the human answers those, not me. 😄",
    es: "Para trabajo o colaboración, escríbele directo a Alan a alanalarconoviedo@gmail.com — eso lo responde el humano, no yo. 😄",
  },
  {
    re: /qui[eé]n|who|eres|about|ti mismo|yourself/i,
    en: "I'm Alan's clone: technical support engineer who builds things with AI. Ask me about his projects, skills, hobbies, or how to reach him.",
    es: "Soy el clon de Alan: ingeniero de soporte técnico que construye cosas con IA. Pregúntame por sus proyectos, skills, hobbies o cómo contactarlo.",
  },
  {
    re: /contact|contacto|email|correo|reach/i,
    en: "Email Alan at alanalarconoviedo@gmail.com — the human replies slower than me, but he replies. 😄",
    es: "Escríbele a Alan a alanalarconoviedo@gmail.com — el humano responde más lento que yo, pero responde. 😄",
  },
  {
    re: /gracias|thanks|thank you/i,
    en: "Anytime! 🙌 Anything else you'd like to know?",
    es: "¡De nada! 🙌 ¿Algo más que quieras saber?",
  },
  {
    re: /hola|hello|hi|hey/i,
    en: "Hey! 👋 I'm Alan's AI clone. Want to hear about his projects, skills, hobbies, or how to reach him?",
    es: "¡Hola! 👋 Soy el clon IA de Alan. ¿Quieres saber de sus proyectos, skills, hobbies o cómo contactarlo?",
  },
];

const FALLBACK = {
  en: "I'm still a demo version of Alan's clone — ask me about his projects, skills, hobbies, the CV, or how to reach him, and I'll actually help. 🙂",
  es: "Todavía soy una versión demo del clon de Alan — pregúntame por sus proyectos, skills, hobbies, el CV o cómo contactarlo, ahí sí te respondo bien. 🙂",
};
const TYPING = { en: 'typing…', es: 'escribiendo…' };
const ENDPOINT_ERR = {
  en: "Oops, my stack isn't responding right now. Try again in a bit. 🔌",
  es: "Ups, mi stack no responde ahora mismo. Intenta de nuevo en un rato. 🔌",
};

export function initChat({ onUserTyping, onUserSend, onBotReply } = {}) {
  const form = document.getElementById('clone-form');
  const input = document.getElementById('clone-input');
  const thread = document.getElementById('clone-thread');

  // El hilo de la conversación. Sin esto el clon no entiende
  // preguntas de seguimiento ("¿y cuánto tiempo llevas en eso?").
  const history = [];

  input.addEventListener('focus', () => onUserTyping?.(true));
  input.addEventListener('blur', () => onUserTyping?.(false));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    addMsg(thread, 'user', text);
    onUserSend?.();
    history.push({ role: 'user', content: text });

    const typing = addMsg(thread, 'bot typing', TYPING[getLang()]);
    const reply = await getReply(history);
    typing.classList.remove('typing');
    typing.textContent = reply;
    thread.scrollTop = thread.scrollHeight;
    onBotReply?.();

    history.push({ role: 'assistant', content: reply });
    // el backend también recorta, pero no tiene caso mandar de más
    if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  });
}

const MAX_HISTORY = 12;

function addMsg(thread, cls, text) {
  const el = document.createElement('div');
  el.className = 'msg ' + cls;
  el.textContent = text;
  thread.appendChild(el);
  thread.scrollTop = thread.scrollHeight;
  return el;
}

async function getReply(history) {
  const lang = getLang();
  const lastMessage = history[history.length - 1]?.content ?? '';

  if (CONFIG.CHAT_ENDPOINT) {
    try {
      const r = await fetch(CONFIG.CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, lang }),
      });
      const data = await r.json();
      return data.reply || FALLBACK[lang];
    } catch {
      return ENDPOINT_ERR[lang];
    }
  }

  // modo demo: una pausa corta para que se sienta vivo
  await new Promise((res) => setTimeout(res, 600 + Math.random() * 700));
  const hit = DEMO.find((d) => d.re.test(lastMessage));
  return hit ? hit[lang] : FALLBACK[lang];
}
