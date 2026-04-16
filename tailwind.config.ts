import type { Config } from 'tailwindcss';

/** OKLCH semantic tokens in CSS vars — alpha via relative color syntax (Tailwind 3.4+). */
const fromVar = (token: string) => `oklch(from var(${token}) l c h / <alpha-value>)`;

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: fromVar('--border'),
        input: fromVar('--input'),
        ring: fromVar('--ring'),
        background: fromVar('--background'),
        foreground: fromVar('--foreground'),
        primary: {
          DEFAULT: fromVar('--primary'),
          foreground: fromVar('--primary-foreground'),
        },
        secondary: {
          DEFAULT: fromVar('--secondary'),
          foreground: fromVar('--secondary-foreground'),
        },
        destructive: {
          DEFAULT: fromVar('--destructive'),
          foreground: fromVar('--destructive-foreground'),
        },
        muted: {
          DEFAULT: fromVar('--muted'),
          foreground: fromVar('--muted-foreground'),
        },
        accent: {
          DEFAULT: fromVar('--accent'),
          foreground: fromVar('--accent-foreground'),
        },
        popover: {
          DEFAULT: fromVar('--popover'),
          foreground: fromVar('--popover-foreground'),
        },
        card: {
          DEFAULT: fromVar('--card'),
          foreground: fromVar('--card-foreground'),
        },
        chart: {
          1: fromVar('--chart-1'),
          2: fromVar('--chart-2'),
          3: fromVar('--chart-3'),
          4: fromVar('--chart-4'),
          5: fromVar('--chart-5'),
        },
        sidebar: {
          DEFAULT: fromVar('--sidebar'),
          foreground: fromVar('--sidebar-foreground'),
          primary: fromVar('--sidebar-primary'),
          'primary-foreground': fromVar('--sidebar-primary-foreground'),
          accent: fromVar('--sidebar-accent'),
          'accent-foreground': fromVar('--sidebar-accent-foreground'),
          border: fromVar('--sidebar-border'),
          ring: fromVar('--sidebar-ring'),
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      spacing: {
        'touch-min': 'var(--touch-target-min)',
      },
      maxWidth: {
        container: 'var(--container-max-width)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
