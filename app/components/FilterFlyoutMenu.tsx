'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FilterDropdowns, type FilterDropdownsFilterProps } from './FilterDropdowns';
import { FilterMobileActionBar } from './FilterMobileActionBar';
import styles from './FilterFlyoutMenu.module.css';

export type FilterFlyoutMenuProps = FilterDropdownsFilterProps & {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  /**
   * Figma default: actions at bottom. Variant2: actions at top above the filter list.
   */
  actionsPosition?: 'top' | 'bottom';
  className?: string;
};

export function FilterFlyoutMenu({
  open,
  onClose,
  onApply,
  onClear,
  actionsPosition = 'bottom',
  className,
  ...filterProps
}: FilterFlyoutMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const actions = (
    <FilterMobileActionBar
      placement={actionsPosition === 'top' ? 'flyoutHeader' : 'flyoutFooter'}
      onClose={onClose}
      onApply={onApply}
      onClear={onClear}
    />
  );

  const filters = (
    <div className={styles.filtersScroll}>
      <FilterDropdowns {...filterProps} layout="column" mobileFilterBar={false} />
    </div>
  );

  if (!mounted || !open) return null;

  return createPortal(
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <button type="button" className={styles.backdrop} aria-label="Close filters" onClick={onClose} />
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Search filters"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.panelInner}>
          {actionsPosition === 'top' && <div className={styles.panelHeader}>{actions}</div>}
          {filters}
          {actionsPosition === 'bottom' && <div className={styles.panelFooter}>{actions}</div>}
        </div>
      </aside>
    </div>,
    document.body
  );
}
