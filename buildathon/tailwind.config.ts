/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#05060a',
          2: '#0a0c14',
          3: '#11141f',
        },
        cy: '#22f2ff',
        vi: '#a855f7',
        em: '#ff7a1a',
        fe: '#ff3d81',
        bio: '#3dffb5',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
        'scroll-hint': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(200%)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.2s cubic-bezier(0.2,0.6,0.3,1) infinite',
        float: 'float 6s ease-in-out infinite',
        blink: 'blink 1s steps(1) infinite',
        'scroll-hint': 'scroll-hint 1.8s cubic-bezier(0.6,0,0.4,1) infinite',
      },
      backgroundOpacity: {
        3: '0.03',
        8: '0.08',
        12: '0.12',
      },
    },
  },
  plugins: [],
};

module.exports = config;
