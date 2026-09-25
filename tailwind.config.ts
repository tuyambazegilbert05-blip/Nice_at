import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        foreground: '#0f172a',
        nice: {
          surface: '#ffffff',
          'surface-warm': '#fbfcfd',
          'surface-subtle': '#f8fafc',
          'surface-blue': '#f0f7ff',
          border: '#e2e8f0',
          'border-focus': '#0284c7',
          blue: {
            50: '#f0f7ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0284c7', // Primary scientific blue
            600: '#0369a1',
            700: '#075985',
            800: '#0c4a6e',
            900: '#082f49',
          },
          emerald: {
            50: '#ecfdf5',
            100: '#d1fae5',
            500: '#10b981', // Clean energy green
            600: '#059669',
            700: '#047857',
          },
          cyan: {
            50: '#ecfeff',
            500: '#06b6d4',
            600: '#0891b2',
          },
          amber: {
            50: '#fffbeb',
            500: '#f59e0b',
            600: '#d97706',
          },
          slate: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
          }
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.02)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'energy': '0 0 15px -3px rgba(2, 132, 199, 0.25)',
      },
    },
  },
  plugins: [],
}

export default config
