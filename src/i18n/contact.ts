import type { Locale } from './index';

/** Explicit supported values only; the payload and storage stay identical. */
export const contactLocale = (value: unknown): Locale =>
  value === 'en' || value === 'es' ? value : 'fr';

export const contactOptions = {
  es: {
    needs: {
      web: 'Sitio o aplicación web',
      automation: 'Automatización e integraciones',
      data: 'Datos y paneles de control',
      ai: 'Inteligencia artificial',
      discuss: 'Una necesidad por concretar',
    },
    budgets: {
      undecided: 'Por definir juntos',
      'under-3000': 'Menos de 3.000 €',
      '3000-7000': 'De 3.000 a 7.000 €',
      '7000-15000': 'De 7.000 a 15.000 €',
      'over-15000': 'Más de 15.000 €',
    },
    deadlines: {
      flexible: 'Por definir / flexible',
      '1-month': 'En un mes',
      '3-months': 'En los próximos tres meses',
      later: 'Más adelante, lo estoy preparando',
    },
  },
  fr: {
    needs: {
      web: 'Site ou application web',
      automation: 'Automatisation et intégrations',
      data: 'Données et tableau de bord',
      ai: 'Intelligence artificielle',
      discuss: 'Un besoin à préciser',
    },
    budgets: {
      undecided: 'À déterminer ensemble',
      'under-3000': 'Moins de 3 000 €',
      '3000-7000': '3 000 à 7 000 €',
      '7000-15000': '7 000 à 15 000 €',
      'over-15000': 'Plus de 15 000 €',
    },
    deadlines: {
      flexible: 'À définir / flexible',
      '1-month': 'D’ici un mois',
      '3-months': 'Dans les trois mois',
      later: 'Plus tard, je prépare le terrain',
    },
  },
  en: {
    needs: {
      web: 'Website or web application',
      automation: 'Automation and integrations',
      data: 'Data and dashboards',
      ai: 'Artificial intelligence',
      discuss: 'A need to explore together',
    },
    budgets: {
      undecided: 'To discuss together',
      'under-3000': 'Under €3,000',
      '3000-7000': '€3,000–€7,000',
      '7000-15000': '€7,000–€15,000',
      'over-15000': 'Over €15,000',
    },
    deadlines: {
      flexible: 'To be decided / flexible',
      '1-month': 'Within a month',
      '3-months': 'Within three months',
      later: 'Later, I’m planning ahead',
    },
  },
} as const;

export const contactValidationCopy = {
  es: {
    text: 'Este campo debe contener texto.',
    controlCharacters: 'Este campo no debe contener caracteres de control.',
    maxLength: (max: number) => `Este campo debe contener un máximo de ${max} caracteres.`,
    name: 'Indica tu nombre (al menos 2 caracteres).',
    email: 'Indica una dirección de correo válida.',
    phone: 'Revisa este número de teléfono.',
    need: 'Elige el tipo de proyecto.',
    budget: 'Elige un presupuesto orientativo.',
    deadline: 'Elige un plazo.',
    messageMin: 'Describe tu proyecto con al menos 20 caracteres.',
    messageMax: 'La descripción no debe superar los 5.000 caracteres.',
    messageCharacters: 'La descripción contiene un carácter no admitido.',
    rejected: 'Envío no aceptado.',
    reload: 'Recarga la página antes de volver a intentarlo.',
    fields: 'La solicitud contiene campos no admitidos o un formato no válido.',
  },
  fr: {
    text: 'Ce champ doit contenir du texte.',
    controlCharacters: 'Ce champ ne doit pas contenir de caractères de contrôle.',
    maxLength: (max: number) => `Ce champ doit contenir au maximum ${max} caractères.`,
    name: 'Indiquez votre nom (au moins 2 caractères).',
    email: 'Indiquez une adresse email valide.',
    phone: 'Vérifiez ce numéro de téléphone.',
    need: 'Choisissez le type de besoin.',
    budget: 'Choisissez un budget indicatif.',
    deadline: 'Choisissez une échéance.',
    messageMin: 'Décrivez votre besoin en au moins 20 caractères.',
    messageMax: 'Votre description doit rester sous 5 000 caractères.',
    messageCharacters: 'La description contient un caractère non accepté.',
    rejected: 'Soumission non acceptée.',
    reload: 'Rechargez la page avant de réessayer.',
    fields: 'La demande contient des champs non acceptés ou un format non valide.',
  },
  en: {
    text: 'This field must contain text.',
    controlCharacters: 'This field must not contain control characters.',
    maxLength: (max: number) => `This field must contain no more than ${max} characters.`,
    name: 'Enter your name (at least 2 characters).',
    email: 'Enter a valid email address.',
    phone: 'Check this phone number.',
    need: 'Choose the type of project.',
    budget: 'Choose an estimated budget.',
    deadline: 'Choose a timeframe.',
    messageMin: 'Describe your project in at least 20 characters.',
    messageMax: 'Keep your description under 5,000 characters.',
    messageCharacters: 'The description contains an unsupported character.',
    rejected: 'Submission not accepted.',
    reload: 'Reload the page before trying again.',
    fields: 'The request contains unsupported fields or an invalid format.',
  },
} as const;

export const contactClientCopy = {
  es: {
    retry: 'Volver a enviar',
    interrupted:
      'El envío se ha interrumpido. Tus datos siguen en el formulario; puedes volver a intentarlo sin crear un duplicado.',
    saving: 'Guardando…',
    savingStatus: 'Se está guardando tu solicitud.',
    saved: 'Tu solicitud se ha guardado.',
    savedLabel: 'Solicitud guardada',
    failed: 'No se ha podido guardar tu solicitud. Vuelve a intentarlo.',
    network:
      'La conexión se ha interrumpido. Tus datos siguen en el formulario. Vuelve a intentarlo: repetir el mismo intento no creará dos solicitudes.',
    required: 'Completa este campo.',
    email: 'Indica una dirección de correo válida.',
    tooShort: (min: number) => `Introduce al menos ${min} caracteres.`,
    tooLong: (max: number) => `Introduce un máximo de ${max} caracteres.`,
    invalid: 'Revisa el valor de este campo.',
  },
  fr: {
    retry: 'Réessayer l’envoi',
    interrupted:
      'L’envoi a été interrompu. Votre saisie est conservée ; vous pouvez réessayer sans créer de doublon.',
    saving: 'Enregistrement…',
    savingStatus: 'Votre demande est en cours d’enregistrement.',
    saved: 'Votre demande est bien enregistrée.',
    savedLabel: 'Demande enregistrée',
    failed: 'Votre demande n’a pas pu être enregistrée. Réessayez.',
    network:
      'La connexion a été interrompue. Votre saisie est conservée. Réessayez : une même tentative ne créera pas deux demandes.',
    required: 'Renseignez ce champ.',
    email: 'Indiquez une adresse email valide.',
    tooShort: (min: number) => `Saisissez au moins ${min} caractères.`,
    tooLong: (max: number) => `Saisissez au maximum ${max} caractères.`,
    invalid: 'Vérifiez la valeur de ce champ.',
  },
  en: {
    retry: 'Try sending again',
    interrupted:
      'Sending was interrupted. Your entries are saved in this form; you can try again without creating a duplicate.',
    saving: 'Saving…',
    savingStatus: 'Your enquiry is being saved.',
    saved: 'Your enquiry has been saved.',
    savedLabel: 'Enquiry saved',
    failed: 'Your enquiry could not be saved. Please try again.',
    network:
      'The connection was interrupted. Your entries are saved in this form. Try again: repeating the same attempt will not create two enquiries.',
    required: 'Please fill in this field.',
    email: 'Enter a valid email address.',
    tooShort: (min: number) => `Enter at least ${min} characters.`,
    tooLong: (max: number) => `Enter no more than ${max} characters.`,
    invalid: 'Check the value in this field.',
  },
} as const;

export const contactServerCopy = {
  es: {
    tooLarge: 'Tu solicitud es demasiado grande.',
    timeout: 'La solicitud ha caducado. Vuelve a intentarlo.',
    method: 'Método no permitido.',
    preview:
      'El formulario está desactivado en esta versión de preproducción. No se ha recogido ninguna solicitud.',
    disabled:
      'El formulario de contacto no está disponible temporalmente. No se ha recogido ninguna solicitud.',
    origin: 'No se permiten envíos desde este origen.',
    contentType: 'Este formato de solicitud no es compatible.',
    duplicateField: 'Un campo aparece varias veces.',
    invalid: 'No se ha podido leer la solicitud.',
    rateLimit:
      'Demasiados intentos. Tus datos siguen en el formulario; vuelve a intentarlo más tarde.',
    validation: 'Revisa los campos indicados. Tu solicitud no se ha guardado.',
    alreadyRecorded: 'Esta solicitud ya está guardada. No es necesario volver a enviarla.',
    recorded: 'Tu solicitud se ha guardado. Revisaré tu proyecto.',
    conflict:
      'Este intento corresponde a otra solicitud. Recarga la página para iniciar una nueva.',
    unavailable:
      'No se pueden guardar solicitudes en este momento. Tus datos siguen en el formulario; vuelve a intentarlo en unos instantes.',
    successTitle: 'Solicitud guardada',
    errorTitle: 'Envío interrumpido',
    successHeading: 'Tu solicitud se ha guardado.',
    errorHeading: 'Tu solicitud no se ha guardado.',
    thanks: 'Gracias por tu mensaje.',
    backHint: 'Usa el botón Atrás del navegador para volver a tus datos.',
    backLink: 'Volver al contacto',
  },
  fr: {
    tooLarge: 'Votre demande est trop volumineuse.',
    timeout: 'La requête a expiré. Réessayez.',
    method: 'Méthode non autorisée.',
    preview: 'Le formulaire est désactivé en préproduction. Aucune demande n’a été collectée.',
    disabled: 'Le contact est temporairement indisponible. Aucune demande n’a été collectée.',
    origin: 'Cette origine de soumission n’est pas autorisée.',
    contentType: 'Format de demande non accepté.',
    duplicateField: 'Un champ est présent plusieurs fois.',
    invalid: 'La demande n’est pas lisible.',
    rateLimit: 'Trop de tentatives. Votre saisie est conservée ; réessayez plus tard.',
    validation: 'Vérifiez les champs indiqués. Votre demande n’a pas été enregistrée.',
    alreadyRecorded: 'Cette demande est déjà enregistrée. Inutile de la renvoyer.',
    recorded: 'Votre demande est bien enregistrée. Je prendrai connaissance de votre projet.',
    conflict:
      'Cette tentative correspond à une demande différente. Rechargez la page pour démarrer un nouvel échange.',
    unavailable:
      'L’enregistrement est temporairement indisponible. Votre saisie est conservée ; réessayez dans quelques instants.',
    successTitle: 'Demande enregistrée',
    errorTitle: 'Envoi interrompu',
    successHeading: 'Votre demande est enregistrée.',
    errorHeading: 'Votre demande n’a pas été enregistrée.',
    thanks: 'Merci pour votre message.',
    backHint: 'Utilisez le bouton Retour de votre navigateur pour retrouver votre saisie.',
    backLink: 'Retour au contact',
  },
  en: {
    tooLarge: 'Your enquiry is too large.',
    timeout: 'The request timed out. Please try again.',
    method: 'Method not allowed.',
    preview: 'The form is disabled in this preview. No enquiry has been collected.',
    disabled: 'The contact form is temporarily unavailable. No enquiry has been collected.',
    origin: 'Submissions from this origin are not allowed.',
    contentType: 'This request format is not supported.',
    duplicateField: 'A field appears more than once.',
    invalid: 'The request could not be read.',
    rateLimit: 'Too many attempts. Your entries are saved in the form; please try again later.',
    validation: 'Check the highlighted fields. Your enquiry has not been saved.',
    alreadyRecorded: 'This enquiry has already been saved. There is no need to send it again.',
    recorded: 'Your enquiry has been saved. I will review your project.',
    conflict:
      'This attempt belongs to a different enquiry. Reload the page to start a new enquiry.',
    unavailable:
      'Enquiries cannot be saved right now. Your entries are saved in the form; please try again shortly.',
    successTitle: 'Enquiry saved',
    errorTitle: 'Sending interrupted',
    successHeading: 'Your enquiry has been saved.',
    errorHeading: 'Your enquiry has not been saved.',
    thanks: 'Thank you for your message.',
    backHint: 'Use your browser’s Back button to return to your entries.',
    backLink: 'Back to contact',
  },
} as const;
