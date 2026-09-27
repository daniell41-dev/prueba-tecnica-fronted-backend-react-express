import type { FieldErrorProps } from '../../types/props.js';

export function FieldError({ message }: FieldErrorProps) {
  if (!message) {
    return null;
  }
  return <p className="field-error">{message}</p>;
}
