"use client";

import React, { useState, useEffect, useCallback } from "react";
import EmailContent from "./EmailContent";

interface Email {
  id: string;
  subject: string;
  textContent: string;
  htmlContent: string;
  from: string;
  date: Date;
}

interface EmailListClientProps {
  initialEmails: Email[];
}

export default function EmailListClient({
  initialEmails,
}: EmailListClientProps) {
  const [emails, setEmails] = useState(initialEmails);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(
    initialEmails[0]?.id || null
  );
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = useCallback(
    (message: string, duration: number = 3000) => {
      setNotification(message);
      setTimeout(() => setNotification(null), duration);
    },
    []
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedEmailId) return;

      switch (event.key.toLowerCase()) {
        case "r":
          markAsRead(selectedEmailId);
          break;
        case "u":
          unsubscribe(selectedEmailId);
          break;
        case "arrowup":
          moveSelection(-1);
          break;
        case "arrowdown":
          moveSelection(1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEmailId, emails]);

  const moveSelection = (direction: number) => {
    const currentIndex = emails.findIndex(
      (email) => email.id === selectedEmailId
    );
    const newIndex = Math.max(
      0,
      Math.min(emails.length - 1, currentIndex + direction)
    );
    setSelectedEmailId(emails[newIndex].id);
  };

  const markAsRead = async (emailId: string) => {
    const currentIndex = emails.findIndex((email) => email.id === emailId);

    // Optimistic update
    setEmails((prevEmails) =>
      prevEmails.filter((email) => email.id !== emailId)
    );

    // Select the next email, or the previous if it was the last one
    const nextEmailId =
      emails[currentIndex + 1]?.id || emails[currentIndex - 1]?.id || null;
    setSelectedEmailId(nextEmailId);

    try {
      await fetch(`/api/emails/${emailId}/read`, { method: "POST" });
    } catch (err) {
      console.error("Error marking email as read:", err);
      showNotification("Failed to mark email as read");
      // Revert the optimistic update
      setEmails((prevEmails) => {
        const updatedEmails = [...prevEmails];
        updatedEmails.splice(
          currentIndex,
          0,
          initialEmails.find((e) => e.id === emailId)!
        );
        return updatedEmails;
      });
      setSelectedEmailId(emailId);
    }
  };

  const unsubscribe = async (emailId: string) => {
    try {
      const response = await fetch(`/api/emails/${emailId}/unsubscribe`, {
        method: "POST",
      });
      const result = await response.json();
      if (result.unsubscribeLink) {
        const linkMatch = result.unsubscribeLink.match(/<(.+?)>/);
        if (linkMatch && linkMatch[1]) {
          const cleanLink = linkMatch[1].replace(
            /^(https?:\/\/)?localhost:3000/,
            ""
          );
          window.open(cleanLink, "_blank");
        } else {
          showNotification("Invalid unsubscribe link format");
        }
      } else {
        showNotification("No unsubscribe link found", 1000);
      }
    } catch (err) {
      console.error("Error unsubscribing:", err);
      showNotification("Failed to unsubscribe");
    }
  };

  return (
    <div className="flex h-full bg-gray-900 text-gray-300">
      <div className="w-1/3 h-full overflow-y-auto border-r border-gray-700">
        {emails.map((email) => (
          <div
            key={email.id}
            className={`p-3 cursor-pointer border-b border-gray-700 ${
              email.id === selectedEmailId ? "bg-gray-800" : "hover:bg-gray-800"
            }`}
            onClick={() => setSelectedEmailId(email.id)}
          >
            <h3 className="text-sm text-gray-300 truncate">{email.subject}</h3>
            <p className="text-xs text-gray-500 truncate">{email.from}</p>
            <p className="text-xs text-gray-500">
              {email.date.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      <EmailContent
        email={emails.find((e) => e.id === selectedEmailId)}
        onMarkAsRead={markAsRead}
        onUnsubscribe={unsubscribe}
      />
      {notification && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg">
          {notification}
        </div>
      )}
    </div>
  );
}
