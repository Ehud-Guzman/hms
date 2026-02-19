// Master theme configuration - Change these values to customize the entire app
export const theme = {
  // Brand Colors - Change these to match your hospital's brand
  colors: {
    primary: {
      DEFAULT: '#2563eb', // Main brand color
      light: '#3b82f6',
      dark: '#1d4ed8',
      foreground: '#ffffff' // Text color on primary backgrounds
    },
    secondary: {
      DEFAULT: '#64748b',
      light: '#94a3b8',
      dark: '#475569',
      foreground: '#ffffff'
    },
    accent: {
      DEFAULT: '#10b981',
      light: '#34d399',
      dark: '#059669',
      foreground: '#ffffff'
    },
    danger: {
      DEFAULT: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      foreground: '#ffffff'
    },
    warning: {
      DEFAULT: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      foreground: '#ffffff'
    },
    success: {
      DEFAULT: '#22c55e',
      light: '#4ade80',
      dark: '#16a34a',
      foreground: '#ffffff'
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    }
  },

  // Typography
  fonts: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },

  // Spacing
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem'
  },

  // Border radius
  radius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px'
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  },

  // Animation
  animation: {
    duration: {
      fast: '150ms',
      DEFAULT: '200ms',
      slow: '300ms'
    },
    easing: {
      DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)'
    }
  },

  // Breakpoints for responsive design
  screens: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },

  // Z-index scale
  zIndex: {
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    auto: 'auto'
  },

  // Status colors (for badges, alerts, etc.)
  status: {
    info: {
      bg: '#dbeafe',
      text: '#1e40af',
      border: '#93c5fd'
    },
    success: {
      bg: '#dcfce7',
      text: '#166534',
      border: '#86efac'
    },
    warning: {
      bg: '#fef3c7',
      text: '#92400e',
      border: '#fcd34d'
    },
    error: {
      bg: '#fee2e2',
      text: '#991b1b',
      border: '#fca5a5'
    }
  }
}

// Utility function to get nested theme values
export const getThemeValue = (path, defaultValue = '') => {
  return path.split('.').reduce((obj, key) => obj?.[key], theme) || defaultValue
}