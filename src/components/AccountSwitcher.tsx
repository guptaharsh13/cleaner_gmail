"use client";

import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const AccountSwitcher: React.FC = () => {
  const session = useSession();

  if (session.status === "authenticated") {
    return (
      <div>
        <p>Signed in as {session.data?.user?.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }
  return <button onClick={() => signIn("google")}>Sign in with Google</button>;
};

export default AccountSwitcher;
