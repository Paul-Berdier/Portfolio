import type { Locale } from './index';

const messages = {
  fr: {
    csvTooLong: 'Le jeu de données est limité à 20 000 caractères.',
    csvHeader: 'La première ligne doit être exactement : id;categorie;montant',
    csvTooManyRows: 'Le démonstrateur accepte 100 lignes maximum.',
    invalidRow: (line: number) => `Ligne ${line} : format, catégorie ou montant invalide.`,
    duplicateRow: (line: number) =>
      `Ligne ${line} : identifiant déjà rencontré, première ligne conservée.`,
    noExcludedRows: 'Aucune ligne écartée.',
    chartLabel: 'Montants synthétiques',
    dataStatus: (
      input: number,
      valid: number,
      duplicates: number,
      invalid: number,
      shown: number,
    ) =>
      `${input} lignes lues : ${valid} valides, ${duplicates} doublon(s), ${invalid} anomalie(s). ${shown} ligne(s) dans la vue actuelle.`,
    unreadableData: 'Impossible de lire ces données.',
    viewPreserved: 'La dernière vue valide est conservée.',
    sourceChanged: 'Source modifiée. Lancez « Transformer » pour actualiser la vue.',
    ready: 'Prêt à exporter',
    review: 'À vérifier',
    validReason: 'Référence et montant valides.',
    reviewReason: 'Type non pris en charge ou référence / montant à vérifier.',
    steps: [
      { label: 'Réception', detail: 'Lire les trois objets de démonstration.' },
      { label: 'Vérification', detail: 'Contrôler référence, type et montant.' },
      { label: 'Orientation', detail: 'Séparer les éléments complets et ceux à vérifier.' },
      { label: 'Export local', detail: 'Préparer un fichier JSON téléchargeable.' },
    ],
    idle: 'À lancer',
    interrupted: 'Traitement interrompu. Relancez le flux pour obtenir un résultat complet.',
    configurationChanged: 'Configuration modifiée. Relancez le flux pour calculer le résultat.',
    pending: 'En attente',
    running: 'En cours',
    stepStatus: (step: number, total: number, label: string) =>
      `Étape ${step} sur ${total} : ${label}.`,
    received: 'Reçu localement',
    done: 'Terminé',
    completed: (ready: number, review: number) =>
      `Traitement terminé : ${ready} document(s) prêt(s), ${review} à vérifier. Le JSON est disponible ; aucun document n’a été envoyé.`,
    downloadName: 'demonstrateur-documents.json',
    downloadRequested:
      'Le téléchargement du JSON synthétique a été demandé à votre navigateur. Aucun document n’a été envoyé.',
  },
  en: {
    csvTooLong: 'The dataset is limited to 20,000 characters.',
    csvHeader: 'The first line must be exactly: id;categorie;montant',
    csvTooManyRows: 'The demo accepts a maximum of 100 rows.',
    invalidRow: (line: number) => `Row ${line}: invalid format, category or amount.`,
    duplicateRow: (line: number) =>
      `Row ${line}: duplicate identifier; the first valid row was kept.`,
    noExcludedRows: 'No rows excluded.',
    chartLabel: 'Synthetic amounts',
    dataStatus: (
      input: number,
      valid: number,
      duplicates: number,
      invalid: number,
      shown: number,
    ) =>
      `${input} rows read: ${valid} valid, ${duplicates} duplicate(s), ${invalid} invalid. ${shown} row(s) in the current view.`,
    unreadableData: 'These data could not be read.',
    viewPreserved: 'The last valid view has been kept.',
    sourceChanged: 'Source changed. Select “Transform” to update the view.',
    ready: 'Ready to export',
    review: 'Needs review',
    validReason: 'Valid reference and amount.',
    reviewReason: 'Unsupported type, or reference / amount needs review.',
    steps: [
      { label: 'Receive', detail: 'Read the three sample objects.' },
      { label: 'Validate', detail: 'Check the reference, type and amount.' },
      { label: 'Route', detail: 'Separate complete items from those needing review.' },
      { label: 'Local export', detail: 'Prepare a downloadable JSON file.' },
    ],
    idle: 'Not started',
    interrupted: 'Processing interrupted. Run the workflow again for a complete result.',
    configurationChanged: 'Configuration changed. Run the workflow again to calculate the result.',
    pending: 'Pending',
    running: 'In progress',
    stepStatus: (step: number, total: number, label: string) =>
      `Step ${step} of ${total}: ${label}.`,
    received: 'Received locally',
    done: 'Complete',
    completed: (ready: number, review: number) =>
      `Processing complete: ${ready} document(s) ready, ${review} needing review. The JSON is available; no documents have been sent.`,
    downloadName: 'document-workflow-demo.json',
    downloadRequested:
      'Your browser has been asked to download the synthetic JSON. No documents have been sent.',
  },
  es: {
    csvTooLong: 'El conjunto de datos está limitado a 20 000 caracteres.',
    csvHeader: 'La primera línea debe ser exactamente: id;categorie;montant',
    csvTooManyRows: 'La demo admite un máximo de 100 filas.',
    invalidRow: (line: number) => `Fila ${line}: formato, categoría o importe no válido.`,
    duplicateRow: (line: number) =>
      `Fila ${line}: identificador duplicado; se conserva la primera fila válida.`,
    noExcludedRows: 'No se ha descartado ninguna fila.',
    chartLabel: 'Importes sintéticos',
    dataStatus: (
      input: number,
      valid: number,
      duplicates: number,
      invalid: number,
      shown: number,
    ) =>
      `${input} ${input === 1 ? 'fila leída' : 'filas leídas'}: ${valid} ${valid === 1 ? 'válida' : 'válidas'}, ${duplicates} ${duplicates === 1 ? 'duplicada' : 'duplicadas'}, ${invalid} ${invalid === 1 ? 'no válida' : 'no válidas'}. ${shown} ${shown === 1 ? 'fila' : 'filas'} en la vista actual.`,
    unreadableData: 'No se han podido leer estos datos.',
    viewPreserved: 'Se conserva la última vista válida.',
    sourceChanged: 'Datos modificados. Pulsa «Transformar» para actualizar la vista.',
    ready: 'Listo para exportar',
    review: 'Requiere revisión',
    validReason: 'Referencia e importe válidos.',
    reviewReason: 'Tipo no admitido, o referencia / importe que requiere revisión.',
    steps: [
      { label: 'Recepción', detail: 'Leer los tres objetos de ejemplo.' },
      { label: 'Validación', detail: 'Comprobar la referencia, el tipo y el importe.' },
      {
        label: 'Clasificación',
        detail: 'Separar los elementos completos de los que requieren revisión.',
      },
      { label: 'Exportación local', detail: 'Preparar un archivo JSON descargable.' },
    ],
    idle: 'Sin iniciar',
    interrupted:
      'Proceso interrumpido. Ejecuta de nuevo el flujo para obtener un resultado completo.',
    configurationChanged:
      'Configuración modificada. Ejecuta de nuevo el flujo para calcular el resultado.',
    pending: 'Pendiente',
    running: 'En curso',
    stepStatus: (step: number, total: number, label: string) =>
      `Paso ${step} de ${total}: ${label}.`,
    received: 'Recibido localmente',
    done: 'Completado',
    completed: (ready: number, review: number) =>
      `Proceso completado: ${ready} documento(s) listo(s), ${review} por revisar. El JSON está disponible; no se ha enviado ningún documento.`,
    downloadName: 'demo-flujo-documentos.json',
    downloadRequested:
      'Se ha solicitado a tu navegador la descarga del JSON sintético. No se ha enviado ningún documento.',
  },
} as const;

export const getLabMessages = (locale: Locale) => messages[locale];

/** Category values remain stable in the CSV and filter; only their display name changes. */
export const labCategoryLabel = (category: string, locale: Locale) =>
  category === 'Automatisation'
    ? { fr: 'Automatisation', en: 'Automation', es: 'Automatización' }[locale]
    : locale === 'es' && category === 'Data'
      ? 'Datos'
      : category;
