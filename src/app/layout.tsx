
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Use Inter as a close approximation to Instagram's font
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { cn } from '@/lib/utils'; // Import cn utility

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'InstaVoice', // Updated app title
  description: 'Instagram Clone with Voice Rooms', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        {children}
        <Toaster /> {/* Add Toaster component here */}
      </body>
    </html>
  );
}
