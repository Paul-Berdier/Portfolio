import type { Locale } from './index';

const messages = {
  skip: ['Aller au contenu', 'Skip to content', 'Ir al contenido'],
  home: ['accueil', 'home', 'inicio'],
  navigation: ['Navigation principale', 'Main navigation', 'Navegación principal'],
  project: ['Parlons de votre projet', 'Let’s discuss your project', 'Hablemos de tu proyecto'],
  openMenu: ['Ouvrir le menu', 'Open menu', 'Abrir menú'],
  closeMenu: ['Fermer le menu', 'Close menu', 'Cerrar menú'],
  close: ['Fermer', 'Close', 'Cerrar'],
  mobileNavigation: ['Navigation mobile', 'Mobile navigation', 'Navegación móvil'],
  explore: ['Explorons ensemble', 'Let’s explore', 'Exploremos juntos'],
  yourProject: ['Votre projet', 'Your project', 'Tu proyecto'],
  idea: [
    'Une idée, un besoin, un point de départ.',
    'An idea, a need, a starting point.',
    'Una idea, una necesidad, un punto de partida.',
  ],
  footerFirst: ['Et si on lui', 'What if we', '¿Y si le'],
  footerSecond: ['donnait', 'gave it', 'damos'],
  footerEmphasis: ['forme ?', 'shape?', 'forma?'],
  contact: ['Parler de votre projet', 'Discuss your project', 'Hablemos de tu proyecto'],
  singleContact: [
    'Un interlocuteur. Du premier échange',
    'One point of contact. From the first conversation',
    'Un interlocutor. Desde la primera conversación',
  ],
  lastDetail: ['au dernier détail.', 'to the last detail.', 'hasta el último detalle.'],
  legal: ['Mentions légales', 'Legal notice', 'Aviso legal'],
  privacy: ['Confidentialité', 'Privacy', 'Privacidad'],
  animation: ['Animations', 'Motion', 'Animaciones'],
  motionPreference: ['Préférence d’animations', 'Motion preference', 'Preferencia de animaciones'],
  automatic: ['Automatiques', 'Automatic', 'Automáticas'],
  reduced: ['Réduites', 'Reduced', 'Reducidas'],
  off: ['Désactivées', 'Off', 'Desactivadas'],
  preview: [
    'Version de préproduction · Nom commercial et informations légales en cours de validation.',
    'Preview version · Trading name and legal information pending validation.',
    'Versión preliminar · Nombre comercial e información legal pendientes de validación.',
  ],
  language: ['Langue du site', 'Website language', 'Idioma del sitio'],
} as const;

export function ui(locale: Locale, key: keyof typeof messages): string {
  return messages[key][locale === 'en' ? 1 : locale === 'es' ? 2 : 0];
}
