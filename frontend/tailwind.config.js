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
        surface: 'var(--bg-color)',
        'surface-white': 'var(--bg-color)',
        'border-soft': 'var(--border-color)',
        'text-main': 'var(--text-main)',
        card: 'var(--card-bg)',
        // Dim Dark theme tokens
        background: 'var(--bg-color)',
        sidebar: 'var(--sidebar-bg)',
        'card-surface': 'var(--card-bg)',
        textPrimary: 'var(--text-main)',
        textSecondary: 'var(--text-secondary)',
        accent: 'var(--accent)',
        buttonPrimary: 'var(--btn-primary)',
        buttonHover: 'var(--btn-hover)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        border: 'var(--border-color)',
        'tm-indigo': '#6366F1',
        'tm-teal': '#6366F1',
        'tm-teal-2': '#4f46e5',
        'tm-pink': '#ff6b6b',
        'tm-orange': '#ff8e53',
        'tm-bg-dark': '#0a0e27'
      },
      boxShadow: {
        'tm-neon': '0 8px 30px rgba(0,255,204,0.08), 0 0 40px rgba(0,255,204,0.04)'
      },
      borderRadius: {
        // Centralized: square with soft edges across the portal
        none: '0',
        sm: '0.25rem',    // 4px
        DEFAULT: '0.375rem', // 6px — soft square default
        md: '0.375rem',   // 6px
        lg: '0.5rem',     // 8px
        xl: '0.5rem',     // 8px (was 12px)
        '2xl': '0.625rem', // 10px (was 16px)
        '3xl': '0.75rem', // 12px (was 24px)
        full: '9999px',
        'xl-2': '0.625rem' // legacy token
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
