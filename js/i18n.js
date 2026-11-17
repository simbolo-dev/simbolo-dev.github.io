// ============================================================
//  I18N — tiny bilingual layer (English default, Spanish on toggle),
//  no framework. Shared by the home and the projects page.
//
//  How it works:
//   · Elements to translate carry data-i18n="key" (swaps textContent),
//     optionally with data-i18n-attr="placeholder" (swaps that attribute).
//   · The toggle button carries data-lang-toggle; its label shows the
//     language you'd switch TO.
//   · The choice is stored in localStorage so it carries across pages.
//
//  Keys are namespaced loosely (hero* / proj*) so both pages can share
//  one dictionary — applyLang only touches elements present on the page.
// ============================================================
const KEY = 'site-lang';

const BIO_EN =
  "I'm Alan Alarcón — AI Solutions Engineer. I connect AI agents to a company's real data, " +
  "safely, and turn the answers into something the business can act on. Most recently: a custom " +
  "MCP server that lets an executive query the company ERP by voice, behind a read-only role, a " +
  "column allowlist and query logging. Before that, three years in IT operations, leading P1/P2 " +
  "incident bridges in English. I also come from visual design and photography, so I care about " +
  "systems people actually understand and use. Off the screen, hiking, cycling and a lot of indoor " +
  "climbing are how I come back to my body.";

const BIO_ES =
  "Soy Alan Alarcón — AI Solutions Engineer. Conecto agentes de IA a los datos reales de una " +
  "empresa, de forma segura, y convierto las respuestas en algo con lo que el negocio puede actuar. " +
  "Lo más reciente: un servidor MCP propio para que un directivo consulte el ERP de la empresa por " +
  "voz, con un rol de solo lectura, una lista blanca de columnas y registro de cada consulta. Antes, " +
  "tres años en operaciones de TI, dirigiendo puentes de incidentes P1/P2 en inglés. También vengo " +
  "del diseño visual y la fotografía, por eso me importa que la gente entienda y use los sistemas. " +
  "Fuera de la pantalla, el senderismo, la bici y mucha escalada indoor son mi forma de volver al cuerpo.";

export const I18N = {
  en: {
    // --- home ---
    heroTitle: 'Alan Alarcón · AI Solutions Engineer · Creative Technologist',
    heroDesc: "Alan Alarcón — AI Solutions Engineer. I connect AI agents to a company's real data, safely. Background in IT operations and design. Talk to my AI clone or download my CV.",
    navContact: 'Get in touch',
    tagline: 'AI Solutions Engineer · Creative Technologist',
    btnProjects: 'View Projects',
    btnCv: 'Download CV',
    aboutTitle: 'About Me',
    aboutText: BIO_EN,
    cloneTitle: 'Talk to my AI Clone',
    cloneTagline: 'Ask me anything',
    clonePlaceholder: 'Ask me anything...',
        cloneSend: 'Send',
    cloneVoice: 'Or talk to me out loud →',
    avatarLabel: "Alan's 3D avatar",
    climberLabel: "Alan's 3D climber avatar",
    // --- projects ---
    projTitle: 'Projects · Alan Alarcón',
    projDesc: 'Projects by Alan Alarcón — AI Solutions Engineer. AI agents on real business data, voice, and interactive 3D web.',
    navHome: '← Home',
    projectsTitle: 'Projects',
    projectsTagline: "Things I've built",
    badgeLive: 'In production',
    badgeWip: 'In progress',
    ctaClient: 'Client work · details on request',
    cardErpTitle: 'Voice agent for a company ERP',
    cardErpDesc: "A custom MCP server that lets a non-technical executive ask the company's ERP questions in plain language, by voice. A read-only database role with a column allowlist keeps sensitive fields out of reach; every query is logged; login runs on OAuth. The same data layer sends daily reports by email and WhatsApp.",
    cardCloneTitle: 'AI voice clone',
    cardCloneDesc: 'The clone on this site: ask it about my work by text or out loud. A retrieval-grounded assistant running on Cloudflare Workers.',
    cardCloneCta: 'Talk to it →',
    cardWaTitle: 'WhatsApp sales agents',
    cardWaDesc: 'AI sales agents on WhatsApp for clinics and spas, covering the funnel from first contact to close.',
    cardPlanetTitle: 'Interactive 3D portfolio',
    cardPlanetDesc: 'An explorable low-poly planet: you walk around with a 3D character, approach 5 points of interest (About me, Personality, Hobbies, Skills, CV) and toggle day/night.',
    cardPlanetCta: 'Coming soon 🔒',
  },
  es: {
    // --- home ---
    heroTitle: 'Alan Alarcón · AI Solutions Engineer · Creative Technologist',
    heroDesc: 'Alan Alarcón — AI Solutions Engineer. Conecto agentes de IA a los datos reales de una empresa, de forma segura. Vengo de operaciones de TI y diseño. Habla con mi clon IA o descarga mi CV.',
    navContact: 'Contacto',
    tagline: 'AI Solutions Engineer · Creative Technologist',
    btnProjects: 'Ver Proyectos',
    btnCv: 'Descargar CV',
    aboutTitle: 'Sobre mí',
    aboutText: BIO_ES,
    cloneTitle: 'Habla con mi Clon IA',
    cloneTagline: 'Pregúntame lo que quieras',
    clonePlaceholder: 'Pregúntame lo que quieras...',
       cloneSend: 'Enviar',
    cloneVoice: 'O háblame en voz alta →',
    avatarLabel: 'Avatar 3D de Alan',
    climberLabel: 'Avatar 3D de Alan escalando',
    // --- projects ---
    projTitle: 'Proyectos · Alan Alarcón',
    projDesc: 'Proyectos de Alan Alarcón — AI Solutions Engineer. Agentes de IA sobre datos reales de negocio, voz y web 3D interactiva.',
    navHome: '← Inicio',
    projectsTitle: 'Proyectos',
    projectsTagline: 'Cosas que construí',
    badgeLive: 'En producción',
    badgeWip: 'En progreso',
    ctaClient: 'Trabajo para cliente · detalles a petición',
    cardErpTitle: 'Agente de voz para el ERP de una empresa',
    cardErpDesc: 'Un servidor MCP propio para que un directivo sin perfil técnico le pregunte al ERP de la empresa en lenguaje natural, por voz. Un rol de solo lectura con lista blanca de columnas deja fuera los datos sensibles; cada consulta queda registrada; el acceso es con OAuth. La misma capa de datos manda reportes diarios por correo y WhatsApp.',
    cardCloneTitle: 'Clon de voz con IA',
    cardCloneDesc: 'El clon de este sitio: pregúntale por mi trabajo escribiendo o en voz alta. Un asistente que responde con base en mi perfil, sobre Cloudflare Workers.',
    cardCloneCta: 'Háblale →',
    cardWaTitle: 'Agentes de venta por WhatsApp',
    cardWaDesc: 'Agentes de venta con IA por WhatsApp para clínicas y spas, del primer contacto al cierre.',
    cardPlanetTitle: 'Portafolio 3D interactivo',
    cardPlanetDesc: 'Un planeta low-poly explorable: caminas con un personaje 3D, te acercas a 5 puntos de interés (Sobre mí, Personalidad, Hobbies, Skills, CV) y alternas entre día y noche.',
    cardPlanetCta: 'Próximamente 🔒',
  },
};

export function getLang() {
  const stored = localStorage.getItem(KEY);
  return stored === 'es' ? 'es' : 'en';   // English is the default
}

export function applyLang(lang) {
  const dict = I18N[lang] || I18N.en;
  localStorage.setItem(KEY, lang);
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const val = dict[el.getAttribute('data-i18n')];
    if (val == null) return;
    const attr = el.getAttribute('data-i18n-attr');
    if (attr) el.setAttribute(attr, val);
    else el.textContent = val;
  });

  // the toggle shows the language you'd switch TO
  document.querySelectorAll('[data-lang-toggle]').forEach((b) => {
    b.textContent = lang === 'en' ? 'ES' : 'EN';
    b.setAttribute('aria-label', lang === 'en' ? 'Cambiar a español' : 'Switch to English');
  });
}

// call once from each page's entry module
export function initI18n() {
  applyLang(getLang());
  document.querySelectorAll('[data-lang-toggle]').forEach((b) =>
    b.addEventListener('click', () => applyLang(getLang() === 'en' ? 'es' : 'en'))
  );
}
