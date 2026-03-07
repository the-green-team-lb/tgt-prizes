import type { Metadata } from "next";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import Nav from "@/components/Nav";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Green Team Prizes - Provably Fair Prize Draws",
  description: "Provably fair prize draws. Every draw is cryptographically verifiable.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`min-h-screen flex flex-col ${inter.className}`}>
        <ConvexClientProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-brand-border py-6 mt-8">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <p className="text-brand-gold font-bold">
                THE GREEN TEAM PRIZES - PROVABLY FAIR
              </p>
            </div>
          </footer>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
