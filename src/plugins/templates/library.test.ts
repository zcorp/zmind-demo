import { describe, expect, it } from 'vitest';
import { getTemplates } from '../registry';

describe('demo template library', () => {
  it('builds a complete, connected tree for every available template', () => {
    for (const template of getTemplates()) {
      const nodes = template.build({ originX: 500, originY: 300, parentId: null });
      const roots = Object.values(nodes).filter(node => node.parentId === null);

      expect(roots, template.meta.name).toHaveLength(1);
      expect(Object.keys(nodes).length, template.meta.name).toBeGreaterThan(4);

      for (const [id, node] of Object.entries(nodes)) {
        expect(node.id, `${template.meta.name}: node key`).toBe(id);
        for (const childId of node.children) {
          expect(nodes[childId], `${template.meta.name}: missing child ${childId}`).toBeDefined();
          expect(nodes[childId].parentId, `${template.meta.name}: invalid parent for ${childId}`).toBe(id);
        }
        if (node.parentId) {
          expect(nodes[node.parentId], `${template.meta.name}: missing parent ${node.parentId}`).toBeDefined();
          expect(nodes[node.parentId].children, `${template.meta.name}: parent does not link to ${id}`).toContain(id);
        }
      }
    }
  });

  it('includes concrete examples in featured templates', () => {
    const templates = new Map(getTemplates().map(template => [template.meta.id, template]));
    const textsFor = (id: string) => Object.values(
      templates.get(id)!.build({ originX: 0, originY: 0, parentId: null })
    ).map(node => node.text);

    expect(textsFor('swot')).toContain('Prototype déjà testé');
    expect(textsFor('weekly-review')).toContain('Ma semaine · exemple');
    expect(textsFor('okr-quarterly')).toContain('Ex. lancer l’app avec succès');
    expect(textsFor('timeline-history')).toContain('14 juillet 1789 · Bastille');
  });

  it('does not expose project-only templates in the public demo', () => {
    expect(getTemplates().filter(template => template.category === 'project')).toHaveLength(0);
  });

  it('keeps the learning-method map text-only and several levels deep', () => {
    const template = getTemplates().find(item => item.meta.id === 'illustrated-learning-method');
    expect(template).toBeDefined();
    const nodes = template!.build({ originX: 500, originY: 300, parentId: null });
    const root = Object.values(nodes).find(node => node.parentId === null)!;
    const imageNodes = Object.values(nodes).filter(node => node.attachments?.some(attachment => attachment.type === 'image'));
    const nodeDepth = (nodeId: string): number => {
      const node = nodes[nodeId];
      return node.parentId ? nodeDepth(node.parentId) + 1 : 0;
    };

    expect(root.text).toBe('Apprendre efficacement');
    expect(root.children.map(id => nodes[id].text)).toEqual(['Comprendre', 'Mémoriser', 'S’entraîner']);
    expect(imageNodes).toHaveLength(0);
    expect(Math.max(...Object.keys(nodes).map(nodeDepth))).toBeGreaterThanOrEqual(3);
  });

  it('keeps illustrations in the atlas and timeline while text-only models stay text-only', () => {
    const templates = new Map(getTemplates().map(template => [template.meta.id, template]));
    const illustratedExamples = [
      { id: 'illustrated-history-timeline', imageCount: 4 },
      { id: 'illustrated-solar-system-atlas', imageCount: 9 },
    ];

    for (const { id, imageCount } of illustratedExamples) {
      const template = templates.get(id);
      expect(template, `missing template ${id}`).toBeDefined();
      const nodes = template!.build({ originX: 500, originY: 300, parentId: null });
      const root = Object.values(nodes).find(node => node.parentId === null)!;
      const branches = root.children.map(childId => nodes[childId]);
      const imageNodes = Object.values(nodes).filter(node => node.attachments?.some(attachment => attachment.type === 'image'));
      const imageUrls = imageNodes.map(node => node.attachments!.find(attachment => attachment.type === 'image')!.value);

      expect(imageNodes, `${id}: image count`).toHaveLength(imageCount);
      expect(new Set(imageUrls).size, `${id}: images should be distinct`).toBe(imageCount);
      expect(imageUrls.every(url => url.startsWith('https://')), `${id}: images should use HTTPS`).toBe(true);
      expect(new Set(imageNodes.map(node => node.attachmentPosition)).size, `${id}: image positions should vary`).toBeGreaterThan(1);
      expect(template!.preview, `${id}: preview chips should match top-level branches`).toEqual(branches.map(branch => branch.text));
    }

    for (const id of ['illustrated-ancient-egypt', 'illustrated-learning-method']) {
      const template = templates.get(id);
      expect(template, `missing template ${id}`).toBeDefined();
      const nodes = template!.build({ originX: 500, originY: 300, parentId: null });
      const root = Object.values(nodes).find(node => node.parentId === null)!;
      const imageNodes = Object.values(nodes).filter(node => node.attachments?.some(attachment => attachment.type === 'image'));
      const depths = Object.keys(nodes).map(nodeId => {
        let depth = 0;
        let node = nodes[nodeId];
        while (node.parentId) {
          depth += 1;
          node = nodes[node.parentId];
        }
        return depth;
      });

      expect(imageNodes, `${id}: model should be text-only`).toHaveLength(0);
      expect(Math.max(...depths), `${id}: tree should have several levels`).toBeGreaterThanOrEqual(3);
      expect(template!.preview).toEqual(root.children.map(childId => nodes[childId].text));
    }
  });
});
