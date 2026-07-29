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
  "I'm Alan Alarcón — creative technologist. I come from IT operations and years of freelance " +
  "creative work, and I'm obsessed with how systems work: taking them apart, understanding every " +
  "piece, and rebuilding them into something new. Today that means generative AI pipelines, " +
  "interactive 3D web, and AI-powered automation. What drives me is the intersection of art and " +
  "technology — art as the space where I discover and express what I can't say any other way, " +
  "technology as the craft of turning those ideas into systems that make people's lives genuinely " +
  "easier. Both are bottomless fields, and it's easy to lose yourself in them: hiking, cycling, and " +
  "lately a lot of indoor climbing are how I come back to my body.";

const BIO_ES =
  "Soy Alan Alarcón — creative technologist. Vengo de IT Ops y de años de proyectos creativos " +
  "freelance, y me obsesiona entender cómo funcionan los sistemas: desarmarlos, entender cada pieza " +
  "y volver a armarlos en algo nuevo. Hoy eso significa pipelines de IA generativa, web 3D " +
  "interactiva y automatización. Lo que me mueve es el cruce entre arte y tecnología — el arte como " +
  "el espacio donde descubro y expreso lo que no puedo decir de otra forma, la tecnología como el " +
  "oficio de convertir esas ideas en sistemas que hacen la vida de la gente genuinamente más fácil. " +
  "Ambos son campos sin fondo, y es fácil perderse en ellos: el senderismo, la bici y últimamente " +
  "mucha escalada indoor son mi forma de volver al cuerpo.";

export const I18N = {
  en: {
    // --- home ---
    heroTitle: 'Alan Alarcón · Creative Technology & Design',
    heroDesc: 'Alan Alarcón — creative technologist. Generative AI, interactive 3D web, and automation. Talk to my AI clone or download my CV.',
    navContact: 'Get in touch',
    tagline: 'Creative Technology & Design',
    btnProjects: 'View Projects',
    btnCv: 'Download CV',
    aboutTitle: 'About Me',
    aboutText: BIO_EN,
    cloneTitle: 'Talk to my AI Clone',
    cloneTagline: 'Ask me anything',
    clonePlaceholder: 'Ask me anything...',
    cloneSend: 'Send',
    avatarLabel: "Alan's 3D avatar",
    climberLabel: "Alan's 3D climber avatar",
    // --- projects ---
    projTitle: 'Projects · Alan Alarcón',
    projDesc: "Projects by Alan Alarcón — creative technologist. Generative AI, interactive 3D web, and automation.",
    navHome: '← Home',
    projectsTitle: 'Projects',
    projectsTagline: "Things I've built",
    cardBadge: 'Coming soon',
    cardPlanetTitle: 'Interactive 3D portfolio',
    cardPlanetDesc: 'An explorable low-poly planet: you walk around with a 3D character, approach 5 points of interest (About me, Personality, Hobbies, Skills, CV) and toggle day/night.',
    cardPlanetCta: 'In progress 🔒',
    emptySlot: '+ Your next project here',
  },
  es: {
    // --- home ---
    heroTitle: 'Alan Alarcón · Tecnología Creativa & Diseño',
    heroDesc: 'Alan Alarcón — creative technologist. IA generativa, web 3D interactiva y automatización. Habla con mi clon IA o descarga mi CV.',
    navContact: 'Contacto',
    tagline: 'Tecnología Creativa & Diseño',
    btnProjects: 'Ver Proyectos',
    btnCv: 'Descargar CV',
    aboutTitle: 'Sobre mí',
    aboutText: BIO_ES,
    cloneTitle: 'Habla con mi Clon IA',
    cloneTagline: 'Pregúntame lo que quieras',
    clonePlaceholder: 'Pregúntame lo que quieras...',
    cloneSend: 'Enviar',
    avatarLabel: 'Avatar 3D de Alan',
    climberLabel: 'Avatar 3D de Alan escalando',
    // --- projects ---
    projTitle: 'Proyectos · Alan Alarcón',
    projDesc: 'Proyectos de Alan Alarcón — creative technologist. IA generativa, web 3D interactiva y automatización.',
    navHome: '← Inicio',
    projectsTitle: 'Proyectos',
    projectsTagline: 'Cosas que construí',
    cardBadge: 'Próximamente',
    cardPlanetTitle: 'Portafolio 3D interactivo',
    cardPlanetDesc: 'Un planeta low-poly explorable: caminás con un personaje 3D, te acercás a 5 puntos de interés (Sobre mí, Personalidad, Hobbies, Skills, CV) y alternás entre día y noche.',
    cardPlanetCta: 'En construcción 🔒',
    emptySlot: '+ Tu próximo proyecto acá',
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
