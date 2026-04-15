import type { ReactNode } from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div
      className="flex flex-col items-center gap-3"
      style={{
        flex: '0 1 262px',
        maxWidth: 262,
        padding: 'var(--space-2)',
      }}
    >
      {icon ? <div className="flex justify-center">{icon}</div> : null}
      <p
        className="m-0 text-center font-bold text-foreground"
        style={{
          fontSize: 13,
          lineHeight: '20px',
          fontFamily: 'var(--font-body)',
        }}
      >
        {title}
      </p>
      <p
        className="m-0 text-center text-foreground"
        style={{
          fontSize: 13,
          fontWeight: 400,
          lineHeight: '20px',
          fontFamily: 'var(--font-body)',
        }}
      >
        {description}
      </p>
    </div>
  );
}
