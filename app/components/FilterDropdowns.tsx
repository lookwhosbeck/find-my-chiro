'use client';

import { useState, useRef, useEffect } from 'react';
import { Flex } from '@radix-ui/themes';
import { FilterMobileActionBar } from './FilterMobileActionBar';

function ChevronDownIcon() {
  return (
    <svg width={10} height={6} viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type FilterDropdownLayout = 'row' | 'column';

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (option: string, checked: boolean) => void;
  layout: FilterDropdownLayout;
}

function MultiSelectDropdown({ label, options, selected, onChange, layout }: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const count = selected.length;
  const displayLabel = count > 0 ? `${label} (${count})` : label;
  const layoutClass = layout === 'column' ? 'filter-dropdown--column' : 'filter-dropdown--row';

  return (
    <div className={`filter-dropdown ${layoutClass}`} ref={ref}>
      <div className={`filter-dropdown-surface${open ? ' filter-dropdown-surface--open' : ''}`}>
        <button
          type="button"
          className={`filter-dropdown-trigger${open ? ' filter-dropdown-trigger--open' : ''}`}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className="filter-dropdown-label">{displayLabel}</span>
          <span className="filter-dropdown-chevron" aria-hidden>
            <ChevronDownIcon />
          </span>
        </button>
        {open && (
          <div className="filter-dropdown-list" role="listbox" aria-multiselectable="true">
            {options.map((option) => (
              <label key={option} className="filter-dropdown-option">
                <input
                  type="checkbox"
                  className="filter-dropdown-checkbox"
                  checked={selected.includes(option)}
                  onChange={(e) => onChange(option, e.target.checked)}
                />
                <span className="filter-dropdown-option-label">{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface FilterDropdownsProps {
  /** `row`: bordered pills in a horizontal wrap. `column`: top-border sections for stacked flyout menus. */
  layout?: FilterDropdownLayout;
  /** Figma 89:912 — mobile-only action row (close, apply, clear). Requires the three callbacks when enabled. */
  mobileFilterBar?: boolean;
  onMobileFilterClose?: () => void;
  onMobileFilterApply?: () => void;
  onMobileFilterClear?: () => void;
  modalityOptions: string[];
  focusAreaOptions: string[];
  philosophyOptions: string[];
  paymentOptions: string[];
  selectedModalities: string[];
  selectedFocusAreas: string[];
  selectedPhilosophies: string[];
  selectedPayment: string[];
  onModalityChange: (option: string, checked: boolean) => void;
  onFocusAreaChange: (option: string, checked: boolean) => void;
  onPhilosophyChange: (option: string, checked: boolean) => void;
  onPaymentChange: (option: string, checked: boolean) => void;
}

export type FilterDropdownsFilterProps = Omit<
  FilterDropdownsProps,
  | 'layout'
  | 'mobileFilterBar'
  | 'onMobileFilterClose'
  | 'onMobileFilterApply'
  | 'onMobileFilterClear'
>;

export function FilterDropdowns({
  layout = 'row',
  mobileFilterBar = false,
  onMobileFilterClose,
  onMobileFilterApply,
  onMobileFilterClear,
  modalityOptions,
  focusAreaOptions,
  philosophyOptions,
  paymentOptions,
  selectedModalities,
  selectedFocusAreas,
  selectedPhilosophies,
  selectedPayment,
  onModalityChange,
  onFocusAreaChange,
  onPhilosophyChange,
  onPaymentChange,
}: FilterDropdownsProps) {
  const rowClass = layout === 'column' ? 'filter-dropdowns-row filter-dropdowns-row--column' : 'filter-dropdowns-row';

  const showMobileBar =
    mobileFilterBar &&
    onMobileFilterClose &&
    onMobileFilterApply &&
    onMobileFilterClear;

  return (
    <div className={showMobileBar ? 'filter-dropdowns-with-mobile-bar' : undefined}>
      <Flex className={rowClass} align={layout === 'column' ? 'stretch' : 'center'} gap={layout === 'column' ? '0' : '1'}>
        <MultiSelectDropdown
          layout={layout}
          label="Techniques"
          options={modalityOptions}
          selected={selectedModalities}
          onChange={onModalityChange}
        />
        <MultiSelectDropdown
          layout={layout}
          label="Specialties"
          options={focusAreaOptions}
          selected={selectedFocusAreas}
          onChange={onFocusAreaChange}
        />
        <MultiSelectDropdown
          layout={layout}
          label="Philosophy"
          options={philosophyOptions}
          selected={selectedPhilosophies}
          onChange={onPhilosophyChange}
        />
        <MultiSelectDropdown
          layout={layout}
          label="Payment"
          options={paymentOptions}
          selected={selectedPayment}
          onChange={onPaymentChange}
        />
      </Flex>
      {showMobileBar && (
        <FilterMobileActionBar
          onClose={onMobileFilterClose}
          onApply={onMobileFilterApply}
          onClear={onMobileFilterClear}
        />
      )}
    </div>
  );
}
