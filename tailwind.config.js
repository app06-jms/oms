import tailwindcssAnimate from 'tailwindcss-animate';

const themeColor = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: themeColor('background'),
        foreground: themeColor('foreground'),
        card: {
          DEFAULT: themeColor('card'),
          foreground: themeColor('card-foreground'),
        },
        popover: {
          DEFAULT: themeColor('background'),
          foreground: themeColor('foreground'),
        },
        primary: {
          DEFAULT: themeColor('primary'),
          foreground: themeColor('primary-foreground'),
        },
        secondary: {
          DEFAULT: themeColor('secondary'),
          foreground: themeColor('secondary-foreground'),
        },
        muted: {
          DEFAULT: themeColor('muted'),
          foreground: themeColor('muted-foreground'),
        },
        accent: {
          DEFAULT: themeColor('accent'),
          foreground: themeColor('accent-foreground'),
        },
        destructive: {
          DEFAULT: themeColor('destructive'),
          foreground: themeColor('destructive-foreground'),
        },
        border: themeColor('border'),
        input: themeColor('input'),
        ring: themeColor('ring'),
        success: themeColor('success'),
        pending: themeColor('pending'),
        error: themeColor('error'),
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'collapsible-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'collapsible-down': 'collapsible-down 0.2s ease-out',
        'collapsible-up': 'collapsible-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
