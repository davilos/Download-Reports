/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm ground with white cards; orange is reserved for controls that act now.
        ground: '#F6F1EA',
        card: '#FFFFFF',
        tile: '#EFE7DC',
        line: '#E4DACD',
        ink: {
          DEFAULT: '#2A2622',
          soft: '#6B6158',
        },
        action: {
          DEFAULT: '#CC4520',
          hover: '#B33C1B',
          soft: '#FBE5DB',
        },
        ok: {
          DEFAULT: '#2F7D4F',
          soft: '#E3F0E7',
        },
        warn: {
          DEFAULT: '#8A5A00',
          dot: '#D69A00',
          soft: '#FBEFD5',
        },
        danger: {
          DEFAULT: '#B42318',
          soft: '#FBE4E1',
        },
      },
      fontFamily: {
        sans: ['"Nunito Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '24px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(42, 38, 34, 0.04), 0 10px 24px -14px rgba(42, 38, 34, 0.18)',
        lift: '0 2px 4px rgba(42, 38, 34, 0.05), 0 18px 32px -16px rgba(42, 38, 34, 0.24)',
        dialog: '0 4px 8px rgba(42, 38, 34, 0.06), 0 32px 64px -24px rgba(42, 38, 34, 0.35)',
        bar: '0 -8px 24px -12px rgba(42, 38, 34, 0.18)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        // Soft spring for press feedback only; entrances never overshoot.
        spring: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
        'dialog-in': 'dialogIn 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        'sheet-in': 'sheetIn 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        'spin-slow': 'spin 1.1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        dialogIn: {
          '0%': { opacity: '0', transform: 'translate(-50%, -48%) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        sheetIn: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
