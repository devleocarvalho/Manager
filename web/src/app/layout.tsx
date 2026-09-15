import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { SubscriptionGate } from "../components/SubscriptionGate";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Manager - Gestão Comercial SaaS",
  description: "Sistema de gestão inteligente para estabelecimentos gastronômicos e comerciais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <SubscriptionGate>
            {children}
          </SubscriptionGate>
        </AuthProvider>
      </body>
    </html>
  );
}
