import type { EmptyStateProps } from '../../types/props.js';

export function EmptyState({ message }: EmptyStateProps) {
  return <p className="empty-state">{message}</p>;
}
