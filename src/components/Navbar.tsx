"use client";

import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const Navbar: React.FC = () => {
  const { data: session } = useSession();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="font-bold text-xl">Cleaner Gmail</div>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-bold">Keyboard controls:</span>
            <span className="ml-2">
              <span className="font-bold">R</span>{" "}
              <span className=" text-gray-300">Mark as Read</span> |
              <span className="font-bold"> U</span>{" "}
              <span className=" text-gray-300">Unsubscribe</span> |
              <span className="font-bold"> ↑↓</span>{" "}
              <span className=" text-gray-300">Navigate</span>
            </span>
          </div>
          {session ? (
            <div className="flex items-center space-x-2">
              <span>{session.user?.email}</span>
              <button
                onClick={() => signOut()}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
