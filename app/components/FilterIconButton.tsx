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
    <svg className={className} width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 3.5h11M5 8h6M7 12.5h2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width={12} height={16} viewBox="0 0 12 16" fill="none" aria-hidden>
      <path d="M2 4l8 8M10 4l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ClearGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4.25 7.25A3.75 3.75 0 1 1 8 11.5M4.25 7.25L2.5 5.5M4.25 7.25H2"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
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
