import { getServerSession } from "next-auth/next";
import { authOptions } from "../lib/auth";
import { google } from "googleapis";
import EmailListClient from "./EmailListClient";

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
        const fullMessage = await gmail.users.messages.get({
          userId: "me",
          id: message.id!,
          format: "full",
        });

        const headers = fullMessage.data.payload?.headers;
        const subject =
          headers?.find((header) => header.name === "Subject")?.value ||
          "No Subject";

        let body = "";
        if (fullMessage.data.payload?.parts) {
          const textPart = fullMessage.data.payload.parts.find(
            (part) =>
              part.mimeType === "text/plain" || part.mimeType === "text/html"
          );
          if (textPart && textPart.body?.data) {
            body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
          }
        } else if (fullMessage.data.payload?.body?.data) {
          body = Buffer.from(
            fullMessage.data.payload.body.data,
            "base64"
          ).toString("utf-8");
        }

        return {
          id: message.id!,
          subject,
          body,
        };
      })
    );

    return { emails };
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
