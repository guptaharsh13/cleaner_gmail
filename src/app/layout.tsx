import "./globals.css";
import { Inter } from "next/font/google";
import ClientProvider from "../components/ClientProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Gmail-like App",
  description: "A minimal Gmail-like application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
