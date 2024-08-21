"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import EmailList from "../components/EmailList";
import EmailContent from "../components/EmailContent";
import { useGmailApi } from "../hooks/useGmailApi";

export default function Home() {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const { emails, loading, error, markAsRead, unsubscribe } = useGmailApi();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "r":
          if (selectedEmailId) markAsRead(selectedEmailId);
          break;
        case "u":
          if (selectedEmailId) unsubscribe(selectedEmailId);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEmailId, markAsRead, unsubscribe]);

  if (status === "loading")
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  if (status === "unauthenticated")
    return (
      <div className="flex items-center justify-center h-screen">
        Please sign in to view your emails.
      </div>
    );
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading emails...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Error: {error}
      </div>
    );

  return (
    <main className="flex h-screen bg-gray-100">
      <EmailList
        emails={emails}
        selectedEmailId={selectedEmailId}
        setSelectedEmailId={setSelectedEmailId}
      />
      <EmailContent email={emails.find((e) => e.id === selectedEmailId)} />
    </main>
  );
}
