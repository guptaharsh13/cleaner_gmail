"use client";

import { SessionProvider } from "next-auth/react";
import AccountSwitcher from "./AccountSwitcher";

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <header className="p-4 bg-gray-100">
        <AccountSwitcher />
      </header>
      {children}
    </SessionProvider>
  );
}
