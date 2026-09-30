import { describe, expect, it } from 'vitest';
import { profile, technologyGroups, additionalTechnologies } from '../src/content/profile';
import { selectedProjects, getSelectedProjects } from '../src/content/selected-projects';

describe('Public profile and source-backed projects', () => {
  for (const locale of ['fr', 'en', 'es'] as const) {
    it(`has complete public copy for ${locale}`, () => {
      const copy = profile[locale];
      for (const [key, value] of Object.entries(copy)) {
        if (typeof value === 'string') expect(value.trim().length, key).toBeGreaterThan(5);
      }
      expect(copy.education).toContain('Bac+5');
      expect(copy.experience).toContain('Prooftag');
      expect(copy.principles).toHaveLength(4);
      const projects = getSelectedProjects(locale);
      expect(projects).toHaveLength(3);
      for (const project of projects) {
        expect(project.summary.length).toBeGreaterThan(40);
        expect(project.role.length).toBeGreaterThan(40);
        expect(project.limits.length).toBeGreaterThan(40);
        expect(project.flow).toHaveLength(3);
        for (const url of [project.repository, project.source]) {
          expect(new URL(url).hostname).toBe('github.com');
          expect(new URL(url).protocol).toBe('https:');
          expect(new URL(url).pathname).toMatch(/^\/Paul-Berdier\//);
        }
      }
    });
  }
  it('keeps a unique identifier and separate contribution for each project', () => {
    expect(new Set(selectedProjects.map((p) => p.id)).size).toBe(3);
    const birdProject = getSelectedProjects('fr').find((p) => p.id === 'plumid');
    expect(birdProject?.kind).toMatch(/collectif/);
    expect(birdProject?.role).toMatch(/équipe/);
    expect(birdProject?.summary).toMatch(/plumes/);
    expect(getSelectedProjects('fr').find((p) => p.id === 'toile-dor')?.limits).toMatch(/fictif/);
  });
  it('groups technologies without invented proficiency scores', () => {
    expect(technologyGroups).toHaveLength(6);
    const groups = technologyGroups.map((g) => g.id);
    expect(new Set(groups).size).toBe(groups.length);
    const tools = technologyGroups.flatMap((g) => [...g.items]);
    expect(tools).toEqual(expect.arrayContaining(['Python', 'SQL', 'FastAPI', 'React', 'Power BI', 'Docker']));
    expect(additionalTechnologies).toContain('C#');
    expect(additionalTechnologies).toContain('QML');
    expect(JSON.stringify(profile)).not.toMatch(/ingénieur diplômé|diplôme d.ingénieur|100 % de réussite/i);
  });
});
