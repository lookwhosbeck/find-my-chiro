import { userInitials } from '@/app/lib/user-initials';
import styles from './UserAvatar.module.css';

export type UserAvatarProps = {
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  /** Pixel size (width & height). */
  size: number;
  variant?: 'circle' | 'roundedSquare';
  /** `accountHero` = white initials on frosted account bar; `onDark` = light initials on dark CTAs (e.g. header My Account) */
  fallbackTone?: 'default' | 'accountHero' | 'onDark';
  className?: string;
  alt?: string;
};

export function UserAvatar({
  avatarUrl,
  firstName,
  lastName,
  email,
  size,
  variant = 'circle',
  fallbackTone = 'default',
  className,
  alt = '',
}: UserAvatarProps) {
  const initials = userInitials(firstName, lastName, email);
  const shape = variant === 'roundedSquare' ? styles.roundedSquare : styles.circle;
  const fallbackClass =
    fallbackTone === 'accountHero'
      ? styles.fallbackAccountHero
      : fallbackTone === 'onDark'
        ? styles.fallbackOnDark
        : styles.fallbackDefault;

  return (
    <span
      className={[styles.root, shape, className].filter(Boolean).join(' ')}
      style={{ width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.36)) }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote Supabase public URL; sizes vary
        <img className={[styles.img, shape].join(' ')} src={avatarUrl} alt={alt} width={size} height={size} />
      ) : (
        <span className={fallbackClass} aria-hidden={!alt}>
          {initials}
        </span>
      )}
    </span>
  );
}
