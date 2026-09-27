import type { UserBadgeProps } from '../../types/props.js';

export function UserBadge({ user, onLogout }: UserBadgeProps) {
  if (!user) {
    return null;
  }
  return (
    <div className="user-badge">
      <span>{user.email}</span>
      <button type="button" onClick={onLogout}>
        Salir
      </button>
    </div>
  );
}
