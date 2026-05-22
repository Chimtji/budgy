'use client';

import { createTheme } from '@mantine/core';

export const theme = createTheme({
  autoContrast: true,
  cursorType: 'pointer',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  primaryColor: 'violet',
  defaultRadius: 'md',
  breakpoints: {
    xxl: '120em',
  },
  colors: {
    'dark-blue': [
      '#f2f4f7',
      '#e4e7ec',
      '#d0d5dd',
      '#98a2b3',
      '#667085',
      '#475467',
      '#344054',
      '#1d2939',
      '#101828',
      '#0c111d',
    ],
  },
  components: {
    Paper: {
      defaultProps: {
        shadow: 'none',
        radius: 'md',
        withBorder: true,
      },
    },
    Card: {
      defaultProps: {
        shadow: 'none',
        radius: 'md',
        withBorder: true,
      },
    },
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
        overlayProps: { blur: 3 },
      },
    },
    Table: {
      defaultProps: {
        verticalSpacing: 'sm',
        horizontalSpacing: 'md',
      },
    },
  },
  other: {
    colorMatches: [
      ['orange', 'red', 'yellow', 'pink', 'grape'],
      ['blue', 'indigo', 'cyan', 'teal', 'green'],
    ],
  },
});
