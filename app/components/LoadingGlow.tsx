interface LoadingGlowProps {
  compact?: boolean;
  overlay?: boolean;
  text?: string;
}

export default function LoadingGlow({ compact = false, overlay = false, text = 'loading...' }: LoadingGlowProps) {
  const textClass = compact ? 'loading-glow-text loading-glow-text--compact' : 'loading-glow-text';

  if (overlay) {
    return (
      <div className="loading-glow-overlay" aria-live="polite" aria-busy="true">
        <span className={textClass}>{text}</span>
      </div>
    );
  }

  if (compact) {
    return <span className={textClass}>{text}</span>;
  }

  return (
    <div className="flex items-center justify-center py-16">
      <span className={textClass}>{text}</span>
    </div>
  );
}
