/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        alexa: {
          blue: '#00CAFF',
          darkBlue: '#0055FF',
          cyan: '#00FFEA',
          glow: '#00c6ff',
          ring: '#00a8e8',
          bg: '#0B0F19',
          card: '#111827',
          surface: '#1F2937',
          border: '#374151',
          accent: '#8B5CF6'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ring-rotate': 'ringSpin 8s linear infinite',
        'waveform': 'wave 1.2s ease-in-out infinite alternate',
      },
      keyframes: {
        ringSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        wave: {
          '0%': { height: '8px' },
          '100%': { height: '36px' },
        }
      }
    },
  },
  plugins: [],
}
