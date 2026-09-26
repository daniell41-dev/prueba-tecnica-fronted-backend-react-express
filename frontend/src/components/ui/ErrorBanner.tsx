import type { ErrorBannerProps } from '../../types/props.js';

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <p className="error-banner" role="alert">
      {message}
    </p>
  );
}
