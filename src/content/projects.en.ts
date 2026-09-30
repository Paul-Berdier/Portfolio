import type { Project } from './projects';

type ProjectCopy = Omit<Project, 'slug' | 'number' | 'services' | 'href' | 'preview' | 'published'>;

/** Translations preserve the scope and synthetic results of the French case studies. */
export const englishProjects: Record<string, ProjectCopy> = {
  'flux-documents': {
    title: 'Every document in the right place.',
    category: 'Automation',
    type: 'Demo',
    status: 'Available in the lab',
    summary:
      'Three synthetic documents, an explicit rule and two destinations. A small workflow you can run yourself.',
    tags: ['Local workflow', 'Business rules', 'JSON'],
    context:
      'This experiment was built for this portfolio. It illustrates document processing logic with a synthetic dataset, without a client or any third-party system.',
    problem:
      'How can a sequence of operations be made understandable, with visible exceptions, instead of hiding the whole process behind a button?',
    scope: [
      'Three data objects representing fictional documents.',
      'Checks on the reference, type and amount.',
      'Routing based on deterministic rules and a local JSON export.',
    ],
    role: 'A personal project for Paul’s portfolio: defining the demonstration, designing the interface and integrating it. The code was built with assistance from Codex.',
    solution:
      'A workflow exposes each step and the actual result of the rules applied in JavaScript. The visualisation accompanies these local operations. The download contains the processed data, with no network transmission.',
    architecture: [
      { title: 'Source data', description: 'Three synthetic objects included in the page.' },
      {
        title: 'Validation',
        description: 'A reference is present, the type is “order”, and the amount is valid.',
      },
      { title: 'Routing', description: 'Two items ready and one item requiring review.' },
      { title: 'Output', description: 'A JSON file generated in your browser.' },
    ],
    result: [
      'The three inputs produce two items ready to export and one item requiring review.',
      'The exported JSON preserves the inputs and records the routing decision.',
      'The operations require no account or external service.',
    ],
    limits:
      'This does not process actual PDFs: the filenames represent synthetic objects. No file reading, OCR extraction, transmission or business integration takes place. The timing of the steps is a visual presentation of the local calculation.',
  },
  'atelier-data': {
    title: 'From rows to a clear picture.',
    category: 'Data',
    type: 'Demo',
    status: 'Available in the lab',
    summary:
      'A small, imperfect file becomes a useful view: normalise, identify anomalies, filter and visualise.',
    tags: ['CSV', 'Data quality', 'Visualisation'],
    context:
      'A demonstration built for this portfolio using entirely synthetic amounts and categories. It does not represent a real business or commercial results.',
    problem:
      'A chart can look convincing while hiding inconsistent inputs. How can the cleaning rules and the rows they exclude be made visible?',
    scope: [
      'Edit a simple CSV containing up to 100 rows.',
      'Normalise categories and amounts; detect duplicates and invalid entries.',
      'Filter by category, with aggregated amounts and a detailed table.',
    ],
    role: 'A personal project for Paul’s portfolio: defining the rules, designing the presentation and integrating it. The code was built with assistance from Codex.',
    solution:
      'Processing separates valid rows, duplicates and anomalies. The chart and table share the same data, and visitors can edit the source file to observe how the rules affect the result.',
    architecture: [
      { title: 'Editable CSV', description: 'A synthetic dataset separated by semicolons.' },
      {
        title: 'Normalisation',
        description: 'Consistent spaces, letter case and decimal separators.',
      },
      { title: 'Checks', description: 'Unique identifiers and valid amounts.' },
      { title: 'Presentation', description: 'Aggregation by category and an interactive filter.' },
    ],
    result: [
      'The supplied dataset contains nine rows: six kept, one duplicate and two anomalies.',
      'The categories aggregate the actual amounts from the retained rows.',
      'Processing takes place in the browser, and the data you enter is not sent anywhere.',
    ],
    limits:
      'This reader accepts a simple CSV format without quoted or multiline fields. It does not replace a production pipeline. The amounts illustrate the processing and do not measure any commercial performance.',
  },
  'recherche-documentaire': {
    title: 'Document search',
    category: 'AI',
    type: 'Demo',
    status: 'Unpublished draft',
    summary: 'An idea that still needs documentation and evaluation.',
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
