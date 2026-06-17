import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'PNMC Management System',
  description: 'Pakistan Nursing & Midwifery Council Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
