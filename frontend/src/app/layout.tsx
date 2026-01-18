import type { Metadata } from "next";
import Providers from "@/components/Providers";
import Navigation from "@/components/Navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tank Management System",
  description: "Feedstock tank level management and monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ErrorBoundary>
            <div className="page-shell">
              <Navigation>{children}</Navigation>
            </div>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
