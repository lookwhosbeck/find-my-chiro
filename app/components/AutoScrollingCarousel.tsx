'use client';

import { Box, Flex } from '@radix-ui/themes';
import { Chiropractor } from '../lib/queries';
import { ChiropractorCard } from './ChiropractorCard';
import { useEffect, useRef } from 'react';

interface AutoScrollingCarouselProps {
  chiropractors: Chiropractor[];
}

export function AutoScrollingCarousel({ chiropractors }: AutoScrollingCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const styleIdRef = useRef<string | null>(null);

  if (chiropractors.length === 0) {
    return null;
  }

  // Duplicate items for seamless infinite scroll
  // We duplicate twice to ensure smooth looping
  const duplicatedItems = [...chiropractors, ...chiropractors, ...chiropractors];

  // Calculate animation values
  // Each card is 240px wide + 16px gap = 256px per item
  const cardWidth = 256; // 240px card + 16px gap
  const totalWidth = chiropractors.length * cardWidth;
  // Speed: pixels per second (adjust for desired speed)
  const pixelsPerSecond = 50; // Slower = lower number, faster = higher number
  const duration = totalWidth / pixelsPerSecond;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Generate unique ID for this carousel instance
    const uniqueId = `carousel-${Math.random().toString(36).substring(2, 11)}`;
    styleIdRef.current = uniqueId;

    // Create and inject styles
    const styleId = `carousel-style-${uniqueId}`;
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
      @keyframes carousel-scroll-${uniqueId} {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(-${totalWidth}px);
        }
      }
      .carousel-track-${uniqueId} {
        animation: carousel-scroll-${uniqueId} ${duration}s linear infinite;
        will-change: transform;
      }
      .carousel-track-${uniqueId}:hover {
        animation-play-state: paused;
      }
    `;

    track.classList.add(`carousel-track-${uniqueId}`);

    return () => {
      track.classList.remove(`carousel-track-${uniqueId}`);
      const style = document.getElementById(styleId);
      if (style) {
        document.head.removeChild(style);
      }
    };
  }, [duration, totalWidth]);

  return (
    <Box
      style={{
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        paddingBottom: '20px',
      }}
    >
      <Flex
        ref={trackRef}
        gap="4"
        style={{
          paddingLeft: '24px',
          paddingRight: '24px',
          width: 'max-content',
        }}
      >
        {duplicatedItems.map((chiropractor, index) => (
          <Box
            key={`${chiropractor.id}-${index}`}
            style={{
              width: '240px',
              flexShrink: 0,
            }}
          >
            <ChiropractorCard chiropractor={chiropractor} />
          </Box>
        ))}
      </Flex>
    </Box>
  );
}
