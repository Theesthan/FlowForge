import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: [
          'var(--font-geist-mono)',
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'monospace',
        ],
      },
      colors: {
        // FlowForge design system accents
        accent: {
          indigo: '#6366f1',
          cyan: '#06b6d4',
          rose: '#f43f5e',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
