import type { TaskStatus } from '../types';

export function toggleTaskStatus(status: TaskStatus): TaskStatus {
  return status === 'done' ? 'open' : 'done';
}
