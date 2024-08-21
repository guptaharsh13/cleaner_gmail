import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { google } from "googleapis";
import { authOptions } from "../../../lib/auth";
import { refreshAccessToken } from "../../../lib/tokenRefresh";

function decodeBase64(data: string) {
  return Buffer.from(data, "base64").toString("utf-8");
}

interface BodyPart {
  mimeType: string;
  body: { data?: string };
  parts?: BodyPart[];
}

function getBodyContent(payload: BodyPart): {
  content: string;
  mimeType: string;
} {
  if (!payload) {
    return { content: "", mimeType: "text/plain" };
  }

  if (payload.body?.data) {
    return {
      content: decodeBase64(payload.body.data),
      mimeType: payload.mimeType,
    };
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/html") {
        return {
          content: decodeBase64(part.body?.data || ""),
          mimeType: "text/html",
        };
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain") {
        return {
          content: decodeBase64(part.body?.data || ""),
          mimeType: "text/plain",
        };
      }
    }
    for (const part of payload.parts) {
      if (part.parts) {
        const nestedContent = getBodyContent(part);
        if (nestedContent.content) {
          return nestedContent;
        }
      }
    }
  }

  return { content: "", mimeType: "text/plain" };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    let accessToken = session.accessToken as string;

    if (
      session.expiresAt &&
      session.expiresAt < Math.floor(Date.now() / 1000)
    ) {
      const refreshedTokens = await refreshAccessToken(
        session.refreshToken as string
      );
      accessToken = refreshedTokens.accessToken;
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

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
            headers?.find((header) => header.name?.toLowerCase() === "subject")
              ?.value || "No Subject";

          const { content, mimeType } = getBodyContent(
            fullMessage.data.payload as BodyPart
          );

          return {
            id: message.id!,
            subject,
            body: content,
            mimeType,
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

    res.status(200).json(validEmails);
  } catch (error) {
    console.error("Error fetching emails:", error);
    if (error.response?.status === 401) {
      res
        .status(401)
        .json({ error: "Authentication failed. Please sign in again." });
    } else {
      res.status(500).json({ error: "Failed to fetch emails" });
    }
  }
}
