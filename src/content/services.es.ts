import type { Service, ServiceSlug } from './services';

/** Textos traducidos; los identificadores se conservan en services.ts. */
export const spanishServices: Record<ServiceSlug, Omit<Service, 'slug' | 'number'>> = {
  'developpement-web': {
    title: 'Desarrollo web',
    shortTitle: 'Web',
    description: 'Sitios que reflejan quién eres. Aplicaciones que hacen avanzar tu actividad.',
    promise: 'Una idea se convierte en una herramienta que da gusto usar.',
    tags: ['Sitios a medida', 'Aplicaciones', 'Herramientas de gestión', 'API'],
    needs: [
      'Tu sitio web ya no refleja lo que haces.',
      'Tu actividad ha crecido, pero tus herramientas no han seguido el ritmo.',
      'Quieres convertir una idea en una primera versión funcional.',
    ],
    deliverables: [
      {
        title: 'Sitios e interfaces',
        description:
          'Un recorrido claro, una identidad cuidada y una experiencia pensada para el móvil, el teclado y la rapidez.',
      },
      {
        title: 'Aplicaciones de gestión',
        description:
          'Una interfaz adaptada a tu forma de trabajar: seguir una actividad, centralizar información o simplificar una operación.',
      },
      {
        title: 'API e integraciones',
        description:
          'Intercambios bien definidos entre tus programas, con validación, gestión de errores y documentación.',
      },
    ],
    approach:
      'Parto de los usos y del contenido. Después construyo una primera versión que se pueda probar y afino contigo la interfaz y las bases técnicas.',
    boundaries:
      'El alcance, los navegadores compatibles, el alojamiento y el mantenimiento se definen al inicio. Una aplicación compleja se construye por etapas, con prioridades claras.',
  },
  automatisation: {
    title: 'Automatización',
    shortTitle: 'Automatización',
    description: 'Menos copiar y pegar. Herramientas conectadas y procesos que avanzan.',
    promise: 'Tus tareas repetitivas encuentran su camino.',
    tags: ['Flujos de trabajo', 'Documentos', 'Integraciones', 'Procesamiento'],
    needs: [
      'Introduces la misma información en varios programas.',
      'Tus archivos pasan de una persona a otra sin un seguimiento fiable.',
      'Una tarea repetitiva consume tiempo y atención.',
    ],
    deliverables: [
      {
        title: 'Procesos conectados',
        description:
          'Desencadenantes y reglas comprensibles para conectar tus programas y reducir las operaciones manuales.',
      },
      {
        title: 'Documentos y archivos',
        description:
          'Procesos para renombrar, comprobar, clasificar o transformar archivos según tus reglas de negocio.',
      },
      {
        title: 'Seguimiento y recuperación',
        description:
          'Un estado visible, errores que permitan actuar y una vía de recuperación cuando falla un paso.',
      },
    ],
    approach:
      'Analizo el proceso real antes de automatizarlo. Elegimos un primer flujo útil, sus excepciones y los puntos en los que sigue siendo necesaria una validación humana.',
    boundaries:
      'Los accesos a herramientas externas, sus cuotas y sus costes se estudian antes de la implementación. La automatización conserva los controles de negocio que siguen siendo necesarios.',
  },
  data: {
    title: 'Datos y paneles de control',
    shortTitle: 'Datos',
    description: 'De datos dispersos a información clara y útil para tomar decisiones.',
    promise: 'Del archivo original a una visión con sentido.',
    tags: ['Recopilación', 'Flujos de datos', 'Análisis', 'Paneles de control'],
    needs: [
      'Tus indicadores están dispersos en varios archivos.',
      'Dudas de la calidad o de la coherencia de los datos.',
      'Tienes las cifras, pero no la visión de conjunto.',
    ],
    deliverables: [
      {
        title: 'Recopilación y preparación',
        description:
          'Fuentes autorizadas, formatos homogéneos y reglas explícitas de calidad de los datos.',
      },
      {
        title: 'Flujos de datos',
        description:
          'Transformaciones reproducibles y documentadas, con seguimiento de las entradas y de las anomalías.',
      },
      {
        title: 'Paneles de control',
        description:
          'Indicadores definidos juntos, filtros útiles y visualizaciones fáciles de interpretar.',
      },
    ],
    approach:
      'Empiezo por la pregunta que deben responder los datos. Después compruebo las fuentes, su calidad y las definiciones antes de construir la visualización.',
    boundaries:
      'La calidad de un análisis depende de sus fuentes. Los datos ausentes, las hipótesis y los límites se hacen visibles; un indicador no es una promesa de resultados comerciales.',
  },
  'intelligence-artificielle': {
    title: 'Inteligencia artificial',
    shortTitle: 'IA',
    description:
      'Una IA basada en tus necesidades, tus documentos y resultados que se pueden comprobar.',
    promise: 'La información adecuada, con su fuente.',
    tags: ['Búsqueda documental', 'Extracción', 'LLM', 'Integración'],
    needs: [
      'Encontrar información en tus documentos lleva demasiado tiempo.',
      'Quieres extraer información para revisarla después.',
      'Buscas un uso útil de la IA con límites claros.',
    ],
    deliverables: [
      {
        title: 'Búsqueda documental',
        description:
          'Búsqueda en un conjunto autorizado de documentos, con referencias a las fuentes utilizadas.',
      },
      {
        title: 'Extracción asistida',
        description:
          'Información estructurada a partir de documentos, con validación y tratamiento de los casos inciertos.',
      },
      {
        title: 'Integración controlada',
        description:
          'Un modelo vinculado a un uso concreto, con un presupuesto de ejecución, una política de datos y criterios de evaluación.',
      },
    ],
    approach:
      'Primero compruebo si una solución más sencilla puede cubrir la necesidad. Si la IA aporta un valor real, construyo un prototipo acotado y lo evalúo con ejemplos representativos.',
    boundaries:
      'Un modelo puede equivocarse. Las fuentes, la revisión humana, la confidencialidad, los costes y los derechos de uso forman parte del alcance inicial. Ninguna decisión sensible se delega a ciegas en un modelo.',
  },
};
