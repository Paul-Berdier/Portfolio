import type { Project } from './projects';

type ProjectCopy = Omit<Project, 'slug' | 'number' | 'services' | 'href' | 'preview' | 'published'>;

export const spanishProjects: Record<string, ProjectCopy> = {
  'flux-documents': {
    title: 'Cada documento en su lugar.',
    category: 'Automatización',
    type: 'Demostración',
    status: 'Disponible en el laboratorio',
    summary:
      'Tres documentos sintéticos, una regla explícita y dos destinos. Un pequeño flujo que puedes poner en marcha.',
    tags: ['Flujo local', 'Reglas de negocio', 'JSON'],
    context:
      'Este experimento se ha creado para este portfolio. Ilustra una lógica de procesamiento de documentos con datos sintéticos, sin cliente ni sistema externo.',
    problem:
      '¿Cómo hacer comprensible una secuencia de operaciones y mostrar sus excepciones, en lugar de ocultar todo el proceso detrás de un botón?',
    scope: [
      'Tres objetos de datos que representan documentos ficticios.',
      'Comprobación de la referencia, el tipo y el importe.',
      'Clasificación según reglas deterministas y exportación local en JSON.',
    ],
    role: 'Proyecto personal para el portfolio de Paul: definición de la demostración, diseño de la interfaz e integración. El código se ha realizado con la asistencia de Codex.',
    solution:
      'Un flujo muestra cada paso y el resultado real de las reglas aplicadas en JavaScript. La visualización acompaña estas operaciones locales. La descarga contiene los datos procesados, sin transmisión por la red.',
    architecture: [
      { title: 'Datos de origen', description: 'Tres objetos sintéticos incluidos en la página.' },
      { title: 'Validación', description: 'Referencia presente, tipo «pedido» e importe válido.' },
      { title: 'Clasificación', description: 'Dos elementos listos y uno pendiente de revisión.' },
      { title: 'Salida', description: 'Un archivo JSON generado en tu navegador.' },
    ],
    result: [
      'Las tres entradas producen dos elementos listos para exportar y uno pendiente de revisión.',
      'El JSON exportado conserva las entradas e indica la decisión de clasificación.',
      'Las operaciones no requieren cuenta ni servicio externo.',
    ],
    limits:
      'No se procesan PDF reales: los nombres de archivo representan objetos sintéticos. No se ejecuta ninguna lectura de archivos, extracción OCR, transmisión ni conexión con un sistema de negocio. El ritmo de los pasos es una representación visual del cálculo local.',
  },
  'atelier-data': {
    title: 'De las filas a una visión clara.',
    category: 'Datos',
    type: 'Demostración',
    status: 'Disponible en el laboratorio',
    summary:
      'Un pequeño archivo imperfecto se convierte en una vista útil: normalizar, detectar anomalías, filtrar y visualizar.',
    tags: ['CSV', 'Calidad de los datos', 'Visualización'],
    context:
      'Una demostración creada para este portfolio con importes y categorías completamente sintéticos. No representa una actividad real ni resultados comerciales.',
    problem:
      'Un gráfico puede resultar convincente mientras oculta entradas incoherentes. ¿Cómo hacer visibles las reglas de limpieza y las filas que descartan?',
    scope: [
      'Edición de un CSV sencillo de hasta 100 filas.',
      'Normalización de categorías e importes; detección de duplicados y entradas no válidas.',
      'Filtro por categoría, importes agregados y tabla detallada.',
    ],
    role: 'Proyecto personal para el portfolio de Paul: definición de las reglas, diseño de la presentación e integración. El código se ha realizado con la asistencia de Codex.',
    solution:
      'El procesamiento separa las filas válidas, los duplicados y las anomalías. El gráfico y la tabla comparten los mismos datos, y el visitante puede modificar el archivo de origen para observar el efecto de las reglas.',
    architecture: [
      { title: 'CSV editable', description: 'Un conjunto sintético separado por puntos y coma.' },
      {
        title: 'Normalización',
        description: 'Espacios, mayúsculas y separadores decimales homogéneos.',
      },
      { title: 'Comprobación', description: 'Identificadores únicos e importes válidos.' },
      { title: 'Presentación', description: 'Agregación por categoría y filtro interactivo.' },
    ],
    result: [
      'El conjunto incluido contiene nueve filas: seis conservadas, un duplicado y dos anomalías.',
      'Las categorías agrupan los importes reales de las filas conservadas.',
      'El procesamiento se realiza en el navegador y los datos introducidos no se envían.',
    ],
    limits:
      'Este lector acepta un formato CSV sencillo, sin comillas ni campos de varias líneas. No sustituye un proceso de datos en producción. Los importes ilustran el tratamiento y no miden ningún resultado comercial.',
  },
  'recherche-documentaire': {
    title: 'Búsqueda documental',
    category: 'IA',
    type: 'Demostración',
    status: 'Borrador no publicado',
    summary: 'Una idea pendiente de documentación y evaluación.',
    tags: [],
    context: '',
    problem: '',
    scope: [],
    role: '',
    solution: '',
    architecture: [],
    result: [],
    limits: '',
  },
};
