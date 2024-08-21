import { google } from "googleapis";

export async function refreshAccessToken(refreshToken: string) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + "/api/auth/callback/google"
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token,
      expiresAt: Math.floor(
        Date.now() / 1000 + (credentials.expiry_date || 3600)
      ),
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
}
