// HAL 9000 Inspired Theme
// Dark, elegant, with subtle red accents

export const colors = {
  // Background layers
  background: {
    primary: '#0d0d0d',      // Deep black
    secondary: '#151515',    // Slightly lighter
    tertiary: '#1f1f1f',     // Card backgrounds
    elevated: '#252525',     // Elevated surfaces
  },
  
  // HAL 9000 reds
  hal: {
    primary: '#cc0000',      // HAL eye red
    glow: '#ff1a1a',         // Bright glow
    subtle: '#661a1a',       // Subtle red tint
    dark: '#330d0d',         // Very dark red
  },
  
  // Accent colors
  accent: {
    primary: '#ff3b30',      // Primary action (send button)
    secondary: '#ff6b5e',    // Secondary accent
    success: '#32d74b',      // Connected status
    warning: '#ff9f0a',      // Connecting status
    error: '#ff453a',        // Error state
  },
  
  // Text colors
  text: {
    primary: '#ffffff',
    secondary: '#a1a1a6',
    tertiary: '#636366',
    inverse: '#000000',
    subtle: '#48484a',
  },
  
  // Message bubbles
  bubble: {
    user: '#ff3b30',         // User messages - HAL red
    assistant: '#1c1c1e',    // Assistant messages
    assistantBorder: '#2c2c2e',
    system: '#2a1515',       // System messages with red tint
  },
  
  // Borders
  border: {
    primary: '#2c2c2e',
    subtle: '#1c1c1e',
    focus: '#ff3b30',
  },
};

export const typography = {
  // Font sizes
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 28,
    title: 34,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  
  // Font weights
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  glow: {
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
};

export const animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  spring: {
    gentle: { damping: 15, stiffness: 150 },
    bouncy: { damping: 10, stiffness: 200 },
    stiff: { damping: 20, stiffness: 300 },
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
};
