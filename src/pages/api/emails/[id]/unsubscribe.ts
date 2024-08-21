import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { google } from "googleapis";
import { authOptions } from "../../../../lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { id } = req.query;

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });

    const gmail = google.gmail({ version: "v1", auth });

    const message = await gmail.users.messages.get({
      userId: "me",
      id: id as string,
    });

    const headers = message.data.payload?.headers;
    const unsubscribeHeader = headers?.find(
      (header) => header.name === "List-Unsubscribe"
    );

    if (unsubscribeHeader) {
      const unsubscribeLink = unsubscribeHeader.value;
      res.status(200).json({ unsubscribeLink });
    } else {
      res.status(404).json({ error: "No unsubscribe link found" });
    }
  } catch (error) {
    console.error("Error unsubscribing:", error);
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
}
