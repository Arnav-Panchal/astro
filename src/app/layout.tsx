"use client";
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { app } from '@/lib/firebase'; // Assuming a firebase config might exist or be added.
import { useEffect } from 'react';


// export const metadata: Metadata = { // This line is removed
//   title: 'AstroConnect',
//   description: 'Connect with your astrologer for insightful guidance.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    if (typeof window !== 'undefined' && app) {
      // Initialize Firebase services here if needed, e.g., Analytics
      // const analytics = getAnalytics(app);
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <title>AstroConnect</title>
        <meta name="description" content="Connect with your astrologer for insightful guidance." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
