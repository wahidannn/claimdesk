import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: '#E6EAE8',
        surface: '#ffffff',
        muted: '#F7F8FA',
        sidebar: '#F3F6F5',
        ink: '#17352E',
        mutedText: '#7C8A86',
        accent: '#079669',
        accentSoft: '#E8F6EF',
      },
      boxShadow: {
        card: '0 10px 30px rgba(23, 53, 46, 0.045)',
        dropdown: '0 18px 44px rgba(23, 53, 46, 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
