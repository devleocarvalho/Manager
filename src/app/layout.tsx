import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { SubscriptionGate } from "../components/common/SubscriptionGate";
import { BottomNav } from "../components/navigation/BottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Manager - Restaurant OS (Europa)",
  description: "Sistema inteligente de gestão para bares, restaurantes e esplanadas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-PT"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pb-16 md:pb-0">
        <AuthProvider>
          <SubscriptionGate>
            {children}
            <BottomNav />
          </SubscriptionGate>
        </AuthProvider>
      </body>
    </html>
  );
}
