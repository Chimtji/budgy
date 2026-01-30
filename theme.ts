'use client';

import { createTheme } from '@mantine/core';

export const theme = createTheme({
  autoContrast: true,
  cursorType: 'pointer',
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
  primaryColor: 'cyan',
  other: {
    colorMatches: [
      ['orange', 'red', 'yellow', 'pink', 'grape'],
      ['blue', 'indigo', 'cyan', 'teal', 'green'],
    ],
  },
  /* Put your mantine theme override here */
});
