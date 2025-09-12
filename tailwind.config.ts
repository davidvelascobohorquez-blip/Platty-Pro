import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#111827',
        graphite: '#374151',
        stone: '#6B7280',
        sand: '#F8FAFC',
        card: '#FFFFFF',
        amber: '#F59E0B',
        amberDark: '#B45309',
        line: '#E5E7EB'
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem'
      },
      boxShadow: {
        soft: '0 12px 32px rgba(0,0,0,0.06)'
      },
      letterSpacing: {
        tight: '-0.02em'
      }
    }
  },
  plugins: []
}

export default config
