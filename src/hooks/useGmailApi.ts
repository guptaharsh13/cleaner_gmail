import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Email } from "../types";

export function useGmailApi() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session) {
      fetchEmails();
    }
  }, [session]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/emails");
      if (!response.ok) {
        if (response.status === 401) {
          signOut();
          throw new Error("Authentication failed. Please sign in again.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setEmails(data);
      } else {
        throw new Error("Invalid data format received from server");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch emails");
      console.error("Error fetching emails:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      setEmails((prevEmails) =>
        prevEmails.filter((email) => email.id !== emailId)
      );
      await fetch(`/api/emails/${emailId}/read`, { method: "POST" });
    } catch (err) {
      console.error("Error marking email as read:", err);
      setError("Failed to mark email as read");
      fetchEmails(); // Refresh the email list
    }
  };

  const unsubscribe = async (emailId: string) => {
    try {
      const response = await fetch(`/api/emails/${emailId}/unsubscribe`, {
        method: "POST",
      });
      const result = await response.json();
      if (result.unsubscribeLink) {
        const cleanLink = result.unsubscribeLink.replace(
          /^(https?:\/\/)?localhost:3000/,
          ""
        );
        const finalLink = cleanLink.startsWith("http")
          ? cleanLink
          : `${window.location.origin}${cleanLink}`;
        window.open(finalLink, "_blank");
      } else {
        setNotification("No unsubscribe link found");
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error("Error unsubscribing:", err);
      setNotification("Failed to unsubscribe");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return {
    emails,
    loading,
    error,
    notification,
    markAsRead,
    unsubscribe,
    fetchEmails,
  };
}
