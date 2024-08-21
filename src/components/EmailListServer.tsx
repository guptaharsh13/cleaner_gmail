// src/components/EmailListServer.tsx

import { getServerSession } from "next-auth/next";
import { google } from "googleapis";
import { authOptions } from "../lib/auth";
import EmailListClient from "./EmailListClient";
import { extractEmailContent, EmailPart } from "../utils/emailExtractor";

async function getEmails() {
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
      maxResults: 10,
    });

    const messages = response.data.messages || [];
    const emails = await Promise.all(
      messages.map(async (message) => {
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

          const { textContent, htmlContent } = extractEmailContent(
            fullMessage.data.payload as EmailPart
          );

          return {
            id: message.id!,
            subject,
            textContent,
            htmlContent,
          };
        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error);
          return null;
        }
      })
    );

    const validEmails = emails.filter(
      (email): email is NonNullable<typeof email> => email !== null
    );

    return { emails: validEmails };
  } catch (error) {
    console.error("Error fetching emails:", error);
    return { error: "Failed to fetch emails" };
  }
}

export default async function EmailListServer() {
  const { emails, error } = await getEmails();

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <EmailListClient initialEmails={emails} />;
}
