import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';
import './global.css';

import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import Authentication from '@/providers/Authentication';
import Mantine from '@/providers/Mantine';
import ReactQuery from '@/providers/ReactQuery';

export const metadata = { title: 'Budgy', description: 'Online Budget helper tool' };

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript forceColorScheme="dark" defaultColorScheme="dark" />
      </head>
      <body>
        <Authentication>
          <ReactQuery>
            <Mantine>{children}</Mantine>
          </ReactQuery>
        </Authentication>
      </body>
    </html>
  );
};

export default RootLayout;
