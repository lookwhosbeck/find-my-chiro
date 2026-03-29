'use client';

import { FilterIconButton } from './FilterIconButton';
import styles from './FilterMobileActionBar.module.css';

type FilterMobileActionBarProps = {
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  /** default: mobile sheet only. flyout*: map filter flyout (always visible). */
  placement?: 'default' | 'flyoutFooter' | 'flyoutHeader';
};

export function FilterMobileActionBar({
  onClose,
  onApply,
  onClear,
  placement = 'default',
}: FilterMobileActionBarProps) {
  const placementClass =
    placement === 'flyoutFooter'
      ? styles.placementFlyoutFooter
      : placement === 'flyoutHeader'
        ? styles.placementFlyoutHeader
        : styles.placementDefault;

  return (
    <div className={`${styles.actions} ${placementClass}`}>
      <FilterIconButton action="close" variant="neutral" onClick={onClose} aria-label="Hide filters" />
      <div className={styles.rightGroup}>
        <button type="button" className={styles.applyBtn} onClick={onApply}>
          Apply Filters
        </button>
        <FilterIconButton action="clear" variant="neutral" onClick={onClear} aria-label="Clear filters" />
      </div>
    </div>
  );
}
