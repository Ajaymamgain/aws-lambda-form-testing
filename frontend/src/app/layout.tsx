import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Providers from "@/lib/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Form Testing Dashboard",
  description: "Automated form testing platform using AWS Lambda and Playwright",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <Providers>
          <div className="min-h-screen bg-neutral-50">
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex flex-col flex-1 overflow-hidden md:pl-64">
                <Header />
                <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 md:p-6">
                  {children}
                </main>
              </div>
            </div>
            <Toaster 
              position="top-right" 
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#FFFFFF',
                  color: '#333333',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  borderRadius: '0.375rem',
                  padding: '0.75rem 1rem',
                },
                success: {
                  style: {
                    border: '1px solid #D1FAE5',
                    borderLeft: '4px solid #10B981',
                  },
                },
                error: {
                  style: {
                    border: '1px solid #FEE2E2',
                    borderLeft: '4px solid #EF4444',
                  },
                },
              }}
            />
          </div>
        </Providers>
      </body>
    </html>
  );
}
