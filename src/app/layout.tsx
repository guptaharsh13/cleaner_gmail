// src/app/layout.tsx

import "./globals.css";
import { Inter } from "next/font/google";
import ClientProvider from "../components/ClientProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Cleaner Gmail",
  description: "A cleaner Gmail alternative",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-900 text-gray-300`}>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
