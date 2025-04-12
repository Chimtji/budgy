import '@mantine/core/styles.css';

import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from '@mantine/core';

export const metadata = {
  title: 'Budgy',
  description: 'Online Budget helper tool',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  );
}
