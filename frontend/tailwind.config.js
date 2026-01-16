module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/themes/**/*.{js,jsx}',
    './index.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: '#1e293b', // slate-800
        card: '#1f2937',    // custom card
        'tm-teal': '#00ffcc',
        'tm-teal-2': '#00ccff',
        'tm-pink': '#ff6b6b',
        'tm-orange': '#ff8e53',
        'tm-bg-dark': '#0a0e27'
      },
      boxShadow: {
        'tm-neon': '0 8px 30px rgba(0,255,204,0.08), 0 0 40px rgba(0,255,204,0.04)'
      },
      borderRadius: {
        'xl-2': '16px'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial'],
      },
      // Focus ring configuration: centralize color and widths so Tailwind utilities can be used
      ringColor: {
        primary: 'rgba(99,102,241,0.28)',
      },
      ringWidth: {
        // allow `ring-3` to produce a 3px ring
        3: '3px',
      },
      keyframes: {
        draw: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' }
        },
        grow: {
          '0%': { transform: 'scaleY(0)' },
          '100%': { transform: 'scaleY(1)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      },
      animation: {
        'draw': 'draw 1.2s ease-out forwards',
        'grow': 'grow .6s cubic-bezier(.2,.8,.2,1) forwards',
        'fade-in': 'fadeIn .45s ease-out forwards'
      }
    },
  },
  plugins: [],
}
