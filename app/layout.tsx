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
            appearance: "light" | "dark" | "inherit"
            accentColor: The main brand color (e.g., "crimson", "indigo", "teal")
            grayColor: The shade of gray (e.g., "slate", "sand", "mauve")
            radius: Border radius for buttons/cards ("small" | "medium" | "large" | "full")
        */}
        <Theme 
          accentColor="blue" 
          grayColor="sand" 
          radius="full" 
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

