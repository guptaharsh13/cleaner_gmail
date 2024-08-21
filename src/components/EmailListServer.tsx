// src/components/EmailListServer.tsx

import { getServerSession } from "next-auth/next";
import { google } from "googleapis";
import { authOptions } from "../lib/auth";
import EmailListClient from "./EmailListClient";
import { extractEmailContent, EmailPart } from "../utils/emailExtractor";

interface Email {
  id: string;
  subject: string;
  textContent: string;
  htmlContent: string;
  from: string;
  date: Date;
}

async function getEmails(): Promise<{ emails: Email[] } | { error: string }> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return { error: "Not authenticated" };
  }

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });

    const gmail = google.gmail({ version: "v1", auth });

    const response = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread",
      maxResults: 50, // Increased to get more emails
    });

    const messages = response.data.messages || [];
    const emails = await Promise.all(
      messages.map(async (message): Promise<Email | null> => {
        try {
          const fullMessage = await gmail.users.messages.get({
            userId: "me",
            id: message.id!,
            format: "full",
          });

          const headers = fullMessage.data.payload?.headers;
          const subject =
            headers?.find((header) => header.name === "Subject")?.value ||
            "No Subject";
          const from =
            headers?.find((header) => header.name === "From")?.value ||
            "Unknown";
          const dateStr = headers?.find(
            (header) => header.name === "Date"
          )?.value;
          const date = dateStr ? new Date(dateStr) : new Date();

          const { textContent, htmlContent } = extractEmailContent(
            fullMessage.data.payload as EmailPart
          );

          return {
            id: message.id!,
            subject,
            textContent,
            htmlContent,
            from,
            date,
          };
        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error);
          return null;
        }
      })
    );

    const validEmails = emails.filter(
      (email): email is Email => email !== null
    );

    // Sort emails in reverse chronological order
    validEmails.sort((a, b) => b.date.getTime() - a.date.getTime());

    return { emails: validEmails };
  } catch (error) {
    console.error("Error fetching emails:", error);
    return { error: "Failed to fetch emails" };
  }
}

export default async function EmailListServer() {
  const result = await getEmails();

  if ("error" in result) {
    return <div>Error: {result.error}</div>;
  }

  return <EmailListClient initialEmails={result.emails} />;
}
