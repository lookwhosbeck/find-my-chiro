'use client';

import { useState, useRef, useEffect } from 'react';
import { Flex, Text, Checkbox } from '@radix-ui/themes';

function ChevronDownIcon() {
  return (
    <svg width={10} height={6} viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (option: string, checked: boolean) => void;
}

function MultiSelectDropdown({ label, options, selected, onChange }: MultiSelectDropdownProps) {
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

  return (
    <div className="filter-dropdown" ref={ref}>
      <button
        className={`filter-dropdown-trigger${open ? ' filter-dropdown-trigger--open' : ''}${count > 0 ? ' filter-dropdown-trigger--active' : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Text
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 500,
            color: count > 0 ? 'var(--color-accent)' : '#202020',
            letterSpacing: '-0.14px',
            lineHeight: '20px',
            whiteSpace: 'nowrap',
          }}
        >
          {displayLabel}
        </Text>
        <ChevronDownIcon />
      </button>
      {open && (
        <div className="filter-dropdown-menu" role="listbox" aria-multiselectable="true">
          {options.map((option) => (
            <label key={option} className="filter-dropdown-option">
              <Checkbox
                size="1"
                variant="surface"
                checked={selected.includes(option)}
                onCheckedChange={(checked) => onChange(option, checked as boolean)}
              />
              <Text
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  fontWeight: 400,
                  color: '#202020',
                  lineHeight: '20px',
                }}
              >
                {option}
              </Text>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

interface FilterDropdownsProps {
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

export function FilterDropdowns({
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
  return (
    <Flex className="filter-dropdowns-row" align="center" gap="1">
      <MultiSelectDropdown
        label="Techniques"
        options={modalityOptions}
        selected={selectedModalities}
        onChange={onModalityChange}
      />
      <MultiSelectDropdown
        label="Specialties"
        options={focusAreaOptions}
        selected={selectedFocusAreas}
        onChange={onFocusAreaChange}
      />
      <MultiSelectDropdown
        label="Philosophy"
        options={philosophyOptions}
        selected={selectedPhilosophies}
        onChange={onPhilosophyChange}
      />
      <MultiSelectDropdown
        label="Payment"
        options={paymentOptions}
        selected={selectedPayment}
        onChange={onPaymentChange}
      />
    </Flex>
  );
}
