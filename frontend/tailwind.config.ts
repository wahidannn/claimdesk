import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: '#d9e2ec',
        surface: '#ffffff',
        muted: '#f4f7fb',
        ink: '#18212f',
        accent: '#2563eb',
      },
    },
  },
  plugins: [],
} satisfies Config;
