import type { Service, ServiceSlug } from './services';

/** Copy only: canonical identifiers and ordering remain in services.ts. */
export const englishServices: Record<ServiceSlug, Omit<Service, 'slug' | 'number'>> = {
  'developpement-web': {
    title: 'Web development',
    shortTitle: 'Web',
    description:
      'Websites that reflect who you are. Applications that help your business move forward.',
    promise: 'An idea becomes a tool people enjoy using.',
    tags: ['Custom websites', 'Applications', 'Business tools', 'APIs'],
    needs: [
      'Your website no longer reflects what you do.',
      'Your business has grown, but your tools have not kept up.',
      'You want to turn an idea into a first working product.',
    ],
    deliverables: [
      {
        title: 'Websites & interfaces',
        description:
          'A clear journey, a considered visual identity and an experience designed for mobile, keyboard access and speed.',
      },
      {
        title: 'Business applications',
        description:
          'An interface shaped around how you work: tracking activity, bringing information together or simplifying an operation.',
      },
      {
        title: 'APIs & integrations',
        description:
          'Clearly defined exchanges between your applications, with validation, error handling and documentation.',
      },
    ],
    approach:
      'I start with how the tool will be used and what it needs to communicate. I then build a testable first version and refine the interface and technical foundations with you.',
    boundaries:
      'Scope, supported browsers, hosting and maintenance are agreed at the start. A complex application is built in stages, with clear decisions about priorities.',
  },
  automatisation: {
    title: 'Automation',
    shortTitle: 'Automation',
    description: 'Less copying and pasting. Connected tools and processes that move forward.',
    promise: 'Your repetitive tasks find their way.',
    tags: ['Workflows', 'Documents', 'Integrations', 'Processing'],
    needs: [
      'You enter the same information into several applications.',
      'Your files pass from person to person without reliable tracking.',
      'A repetitive task takes up time and attention.',
    ],
    deliverables: [
      {
        title: 'Connected processes',
        description:
          'Understandable triggers and rules that connect your applications and reduce manual work.',
      },
      {
        title: 'Documents & files',
        description:
          'Processes that rename, check, organise or transform files according to your business rules.',
      },
      {
        title: 'Tracking & recovery',
        description:
          'Visible progress, useful error information and a way to recover when a step fails.',
      },
    ],
    approach:
      'I map the actual process before automating it. Together, we choose a useful first workflow, define its exceptions and identify where human approval is still needed.',
    boundaries:
      'Access to third-party tools, their quotas and their costs are assessed before implementation. Automation keeps the business checks that remain necessary.',
  },
  data: {
    title: 'Data & dashboards',
    shortTitle: 'Data',
    description: 'Turn scattered data into clear information you can use to make decisions.',
    promise: 'From a raw file to a meaningful view.',
    tags: ['Data collection', 'Pipelines', 'Analysis', 'Dashboards'],
    needs: [
      'Your indicators are spread across several files.',
      'You are unsure about the quality or consistency of your data.',
      'You have the figures, but not the full picture.',
    ],
    deliverables: [
      {
        title: 'Collection & preparation',
        description: 'Authorised sources, consistent formats and explicit data quality rules.',
      },
      {
        title: 'Data pipelines',
        description:
          'Repeatable, documented transformations, with input tracking and visible anomalies.',
      },
      {
        title: 'Dashboards',
        description:
          'Indicators defined together, useful filters and visualisations that are easy to read.',
      },
    ],
    approach:
      'I start with the question the data needs to answer. I then check the sources, their quality and the definitions before building the visualisation.',
    boundaries:
      'An analysis is only as reliable as its sources. Missing data, assumptions and limitations are made visible; an indicator is not a promise of business results.',
  },
  'intelligence-artificielle': {
    title: 'Artificial intelligence',
    shortTitle: 'AI',
    description: 'AI grounded in your needs, your documents and results you can check.',
    promise: 'The right information, with its source.',
    tags: ['Document search', 'Extraction', 'LLMs', 'Integration'],
    needs: [
      'Finding information in your documents takes too long.',
      'You want to extract information before having it checked.',
      'You are looking for a useful application of AI with clear limits.',
    ],
    deliverables: [
      {
        title: 'Document search',
        description:
          'Search an authorised collection of documents, with references to the sources used.',
      },
      {
        title: 'Assisted extraction',
        description:
          'Structured information from documents, with validation and a process for uncertain cases.',
      },
      {
        title: 'Controlled integration',
        description:
          'A model connected to a specific task, with a usage budget, a data policy and evaluation criteria.',
      },
    ],
    approach:
      'I first check whether a simpler approach can meet the need. If AI offers real value, I build a limited prototype and evaluate it against representative examples.',
    boundaries:
      'A model can make mistakes. Sources, human review, confidentiality, costs and usage rights are part of the initial scope. Sensitive decisions are never handed over to a model without oversight.',
  },
};
