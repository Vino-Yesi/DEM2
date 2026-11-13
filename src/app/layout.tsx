import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexusQuantum WMS | Enterprise PostgreSQL 18 Fulfilment Platform',
  description:
    'Full-stack Warehouse Management System with 12-schema PostgreSQL 18 architecture, ACID row-locked allocations, immutable stock ledger, Suzuki-Trotter Quantum Annealing, and Mini AI Advisors & Live Debugger.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
