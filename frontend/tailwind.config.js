module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './index.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: '#1e293b', // slate-800
        card: '#1f2937',    // custom card
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial'],
      },
      // Focus ring configuration: centralize color and widths so Tailwind utilities can be used
      ringColor: {
        primary: 'rgba(99,102,241,0.28)',
      },
      ringWidth: {
        // allow `ring-3` to produce a 3px ring (default util set does not include 3)
        3: '3px',
      },
    },
  },
  plugins: [],
}
