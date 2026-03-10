import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal',
  description: 'Legal documents and policies for Yamme Tee website.',
};

export default function LegalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
