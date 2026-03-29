'use client';

import styles from './FilterIconButton.module.css';

export type FilterIconAction = 'filter' | 'close' | 'clear';

type FilterIconButtonProps = {
  action: FilterIconAction;
  /** Figma: primary = blue fill + white icon; neutral = white + border + dark icon */
  variant: 'primary' | 'neutral';
  type?: 'button' | 'submit';
  className?: string;
  'aria-label'?: string;
  onClick?: () => void;
};

function FilterGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width={16} height={14} viewBox="0 0 16 14" fill="none" aria-hidden>
      <path
        d="M1 .5a.5.5 0 0 0-.46.31.5.5 0 0 0 .11.54l5.78 5.78a.25.25 0 0 1 .07.18V11c0 .13.05.26.15.35l2 2a.5.5 0 0 0 .54.11.5.5 0 0 0 .31-.46V7.31a.25.25 0 0 1 .07-.18L15.35 1.35a.5.5 0 0 0 .11-.54A.5.5 0 0 0 15 .5H1Zm-.92.12A1 1 0 0 1 1 0h14a1 1 0 0 1 .93.62 1 1 0 0 1-.22 1.09L10 7.42V13a1 1 0 0 1-.62.93 1 1 0 0 1-1.09-.22l-2-2A1 1 0 0 1 6 11l.003-3.58L.29 1.71A1 1 0 0 1 .08.62Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CloseGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width={12} height={12} viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M11.93.43a.25.25 0 0 0-.35-.35L6 5.65.43.07a.25.25 0 0 0-.36.36L5.65 6 .07 11.57a.25.25 0 0 0 .36.36L6 6.35l5.57 5.58a.25.25 0 0 0 .36-.36L6.35 6l5.58-5.57Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ClearGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 0c4.42 0 8 3.58 8 8s-3.58 8-8 8a8 8 0 0 1-7.26-4.64.25.25 0 0 1 .12-.34.25.25 0 0 1 .33.12A7.5 7.5 0 0 0 8 15.5 7.5 7.5 0 0 0 15.5 8 7.5 7.5 0 0 0 8 .5a7.49 7.49 0 0 0-5.37 2.23L.85 4.5H4.75a.25.25 0 0 1 0 .5H.25A.25.25 0 0 1 0 4.75V.25a.25.25 0 0 1 .5 0v3.9L2.28 2.37A8 8 0 0 1 8 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FilterIconButton({
  action,
  variant,
  type = 'button',
  className,
  'aria-label': ariaLabel,
  onClick,
}: FilterIconButtonProps) {
  const rootClass = [styles.btn, variant === 'primary' ? styles.primary : styles.neutral, className]
    .filter(Boolean)
    .join(' ');

  const icon =
    action === 'filter' ? (
      <FilterGlyph className={styles.icon} />
    ) : action === 'close' ? (
      <CloseGlyph className={styles.iconNarrow} />
    ) : (
      <ClearGlyph className={styles.icon} />
    );

  return (
    <button type={type} className={rootClass} onClick={onClick} aria-label={ariaLabel}>
      {icon}
    </button>
  );
}
