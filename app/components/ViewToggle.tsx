'use client';

import { Flex, Text } from '@radix-ui/themes';

export type ViewMode = 'list' | 'map';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

function ListIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M1 3.5v10l4.5-2 5 2 4.5-2v-10l-4.5 2-5-2-4.5 2zM5.5 1.5v10M10.5 3.5v10"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <Flex className="view-toggle-group" role="radiogroup" aria-label="View mode">
      <button
        className={`view-toggle-btn${mode === 'list' ? ' view-toggle-btn--active' : ''}`}
        role="radio"
        aria-checked={mode === 'list'}
        onClick={() => onChange('list')}
      >
        <ListIcon />
        <Text size="2" weight="medium">List</Text>
      </button>
      <button
        className={`view-toggle-btn${mode === 'map' ? ' view-toggle-btn--active' : ''}`}
        role="radio"
        aria-checked={mode === 'map'}
        onClick={() => onChange('map')}
      >
        <MapIcon />
        <Text size="2" weight="medium">Map</Text>
      </button>
    </Flex>
  );
}
