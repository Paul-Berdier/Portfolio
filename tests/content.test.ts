import { describe, expect, it } from 'vitest';
import { projects, publishedProjects } from '../src/content/projects';
import { services } from '../src/content/services';

describe('intégrité des contenus publics', () => {
  it('exclut les brouillons de la source utilisée par les routes', () => {
    expect(projects.some(project => !project.published)).toBe(true);
    expect(publishedProjects.every(project => project.published)).toBe(true);
    expect(publishedProjects.map(project => project.slug)).not.toContain('recherche-documentaire');
  });
  it('documente le statut et les limites des démonstrateurs publiés', () => {
    for (const project of publishedProjects) {
      expect(project.type).toBe('Démonstrateur');
      expect(project.context).toMatch(/synthétique/);
      expect(project.scope.length).toBeGreaterThan(0);
      expect(project.architecture.length).toBe(4);
      expect(project.result.length).toBeGreaterThan(0);
      expect(project.limits.length).toBeGreaterThan(50);
      expect(project.role).toContain('Codex');
      expect(project.services.every(slug => services.some(service => service.slug === slug))).toBe(true);
    }
  });
  it('n’expose que les quatre expertises commerciales prévues', () => {
    expect(services.map(service => service.slug)).toEqual(['developpement-web', 'automatisation', 'data', 'intelligence-artificielle']);
    expect(new Set(projects.map(project => project.slug)).size).toBe(projects.length);
  });
});
