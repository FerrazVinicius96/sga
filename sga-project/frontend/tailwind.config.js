/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Prefeitura (SGA existente)
        'prefeitura-azul': 'rgb(23, 138, 219)',
        'prefeitura-verde': 'rgb(43, 180, 70)',
        'prefeitura-laranja': 'rgb(244, 147, 27)',
        'prefeitura-azul-degrade-inicio': 'rgb(23, 138, 219)',
        'prefeitura-azul-degrade-fim': 'rgb(21, 61, 183)',

        // GEPRO design system (extraído dos wireframes v2)
        gepro: {
          primary:        '#1e3a8a',
          'primary-hover':'#1e40af',
          accent:         '#fbbf24',
          'accent-dark':  '#f59e0b',
          success:        '#059669',
          'success-hover':'#047857',
          bg:             '#f5f7fa',
          surface:        '#ffffff',
          border:         '#e5e7eb',
          'border-light': '#f3f4f6',
          'text-primary': '#374151',
          'text-secondary':'#6b7280',
          'text-muted':   '#9ca3af',
        },

        // Status badges GEPRO
        'badge-success':    '#d1fae5',
        'badge-success-fg': '#065f46',
        'badge-pending':    '#fef3c7',
        'badge-pending-fg': '#92400e',
        'badge-info':       '#dbeafe',
        'badge-info-fg':    '#1e40af',
        'badge-danger':     '#fee2e2',
        'badge-danger-fg':  '#991b1b',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}