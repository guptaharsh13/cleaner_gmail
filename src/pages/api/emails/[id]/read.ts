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

    await gmail.users.messages.modify({
      userId: "me",
      id: id as string,
      requestBody: {
        removeLabelIds: ["UNREAD"],
      },
    });

    res.status(200).json({ message: "Email marked as read" });
  } catch (error) {
    console.error("Error marking email as read:", error);
    res.status(500).json({ error: "Failed to mark email as read" });
  }
}
