import '@radix-ui/themes/styles.css';
import './globals.css';
import { Theme } from '@radix-ui/themes';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find My Chiro',
  description: 'Find a chiropractor near you',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Global Design System Settings 
            Configured to align with Apple-inspired design tokens
            - accentColor: "blue" matches Apple's primary blue
            - grayColor: "gray" provides neutral foundation
            - radius: "large" for generous, Apple-style rounded corners
            - scaling: "100%" maintains standard sizing
        */}
        <Theme 
          accentColor="blue" 
          grayColor="gray" 
          radius="large" 
          scaling="100%"
        >
          {children}
          
          {/* Optional: Adds a popup to test themes in dev mode */}
          {/* <ThemePanel /> */}
        </Theme>
      </body>
    </html>
  );
}

