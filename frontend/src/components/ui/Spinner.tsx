import type { SpinnerProps } from '../../types/props.js';

export function Spinner({ label = 'Cargando…' }: SpinnerProps) {
  return (
    <div className="spinner" role="status">
      <span className="spinner__circle" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
