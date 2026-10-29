import { describe, expect, it } from 'vitest';
import { toggleTaskStatus } from './tasks';

describe('task status toggling', () => {
  it('switches an open task to done and a done task back to open', () => {
    expect(toggleTaskStatus('open')).toBe('done');
    expect(toggleTaskStatus('done')).toBe('open');
  });
});
