import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { google } from "googleapis";
import { authOptions } from "../../../lib/auth";

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
  if (payload.body?.data) {
    return {
      content: decodeBase64(payload.body.data),
      mimeType: payload.mimeType,
    };
  }

  if (payload.parts) {
    let htmlContent = null;
    let plainTextContent = null;

    for (const part of payload.parts) {
      if (part.mimeType === "text/html") {
        htmlContent = decodeBase64(part.body.data || "");
      } else if (part.mimeType === "text/plain") {
        plainTextContent = decodeBase64(part.body.data || "");
      } else if (part.parts) {
        const nestedContent = getBodyContent(part);
        if (nestedContent.mimeType === "text/html") {
          htmlContent = nestedContent.content;
        } else if (
          nestedContent.mimeType === "text/plain" &&
          !plainTextContent
        ) {
          plainTextContent = nestedContent.content;
        }
      }
    }

    if (htmlContent) {
      return { content: htmlContent, mimeType: "text/html" };
    } else if (plainTextContent) {
      return { content: plainTextContent, mimeType: "text/plain" };
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

  if (!session || !session.accessToken) {
    return res
      .status(401)
      .json({ error: "Not authenticated or missing access token" });
  }

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });

    const gmail = google.gmail({ version: "v1", auth });

    const response = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread",
      // maxResults: 10,
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

        const { content, mimeType } = getBodyContent(
          fullMessage.data.payload as BodyPart
        );

        return {
          id: message.id!,
          subject,
          body: content,
          mimeType,
        };
      })
    );

    res.status(200).json(emails);
  } catch (error) {
    console.error("Error fetching emails:", error);
    res.status(500).json({ error: "Failed to fetch emails" });
  }
}
