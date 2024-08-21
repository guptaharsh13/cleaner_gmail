import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Email } from "../types";

export function useGmailApi() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      fetchEmails();
    }
  }, [session]);

  const fetchEmails = async () => {
    try {
      const response = await fetch("/api/emails");
      const data = await response.json();
      setEmails(data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch emails");
      setLoading(false);
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      await fetch(`/api/emails/${emailId}/read`, { method: "POST" });
      setEmails(emails.filter((email) => email.id !== emailId));
    } catch (err) {
      setError("Failed to mark email as read");
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
        setError("No unsubscribe link found");
      }
    } catch (err) {
      setError("Failed to unsubscribe");
    }
  };

  return { emails, loading, error, markAsRead, unsubscribe };
}
