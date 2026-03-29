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
    <svg className={className} width={24} height={21} viewBox="0 0 16 14" fill="none" aria-hidden>
      <path
        d="M1.00024 0.5C0.797113 0.5 0.615863 0.621875 0.537738 0.809375C0.459613 0.996875 0.503363 1.2125 0.647113 1.35313L6.42836 7.13437C6.47524 7.18125 6.50024 7.24375 6.50024 7.3125V11C6.50024 11.1313 6.55336 11.2594 6.64711 11.3531L8.64711 13.3531C8.79086 13.4969 9.00649 13.5375 9.19086 13.4625C9.37524 13.3875 9.50024 13.2031 9.50024 13V7.30937C9.50024 7.24375 9.52524 7.17813 9.57211 7.13125L15.3534 1.35C15.4971 1.20625 15.5377 0.990625 15.4627 0.80625C15.3877 0.621875 15.2034 0.5 15.0002 0.5H1.00024ZM0.0752379 0.61875C0.231488 0.24375 0.597113 0 1.00024 0H15.0002C15.4034 0 15.769 0.24375 15.9252 0.61875C16.0815 0.99375 15.994 1.42187 15.7096 1.70937L10.0002 7.41562V13C10.0002 13.4031 9.75649 13.7688 9.38149 13.925C9.00649 14.0813 8.57836 13.9938 8.29086 13.7094L6.29086 11.7094C6.10336 11.5219 5.99711 11.2688 5.99711 11.0031L6.00024 7.41562L0.293988 1.70625C0.00648788 1.42188 -0.0778871 0.990625 0.0752379 0.61875Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CloseGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width={18} height={18} viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M11.9289 0.428906C12.0258 0.332031 12.0258 0.172656 11.9289 0.0757812C11.832 -0.0210938 11.6727 -0.0210938 11.5758 0.0757812L6.00078 5.64766L0.428906 0.0726562C0.332031 -0.0242188 0.172656 -0.0242188 0.0757813 0.0726562C-0.0210937 0.169531 -0.0210937 0.328906 0.0757813 0.425781L5.64766 6.00078L0.0726562 11.5727C-0.0242188 11.6695 -0.0242188 11.8289 0.0726562 11.9258C0.169531 12.0227 0.328906 12.0227 0.425781 11.9258L6.00078 6.35391L11.5727 11.9289C11.6695 12.0258 11.8289 12.0258 11.9258 11.9289C12.0227 11.832 12.0227 11.6727 11.9258 11.5758L6.35391 6.00078L11.9289 0.428906Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ClearGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width={24} height={24} viewBox="0 0 16 16" fill="none" aria-hidden>
      <g clipPath="url(#clear-clip)">
        <path
          d="M8 0C12.4187 0 16 3.58125 16 8C16 12.4187 12.4187 16 8 16C4.78125 16 2.00625 14.1 0.7375 11.3594C0.678125 11.2344 0.734375 11.0844 0.859375 11.0281C0.984375 10.9719 1.13437 11.025 1.19062 11.15C2.38125 13.7188 4.98438 15.5 8 15.5C12.1406 15.5 15.5 12.1406 15.5 8C15.5 3.85938 12.1406 0.5 8 0.5C5.98438 0.5 4.05312 1.3 2.62812 2.725L0.853125 4.5H4.75C4.8875 4.5 5 4.6125 5 4.75C5 4.8875 4.8875 5 4.75 5H0.25C0.1125 5 0 4.8875 0 4.75V0.25C0 0.1125 0.1125 0 0.25 0C0.3875 0 0.5 0.1125 0.5 0.25V4.14687L2.275 2.37188C3.79375 0.853125 5.85313 0 8 0Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clear-clip">
          <rect width={16} height={16} fill="white" />
        </clipPath>
      </defs>
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
