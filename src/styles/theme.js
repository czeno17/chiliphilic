export const theme = {
  colors: {
    primary: {
      DEFAULT: '#E63946',
      hover: '#C1121F',
      active: '#A4161A',
      light: '#FF6B6B',
      dark: '#8D0801',
    },
    background: {
      DEFAULT: '#0D0D0D',
      secondary: '#141414',
    },
    surface: {
      DEFAULT: '#1E1E1E',
      hover: '#2A2A2A',
      active: '#333333',
      elevated: '#282828',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
      tertiary: '#808080',
      inverse: '#0D0D0D',
    },
    border: {
      DEFAULT: '#333333',
      light: '#444444',
      hover: '#555555',
    },
    status: {
      success: '#4CAF50',
      warning: '#FFC107',
      danger: '#E63946',
      info: '#2196F3',
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
    fontFamilyMono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace',
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
      '4xl': '2.5rem',
    },
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    }
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px rgba(0, 0, 0, 0.5)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.5)',
  },
  transitions: {
    fast: '150ms ease',
    base: '250ms ease',
    slow: '350ms ease',
  }
};