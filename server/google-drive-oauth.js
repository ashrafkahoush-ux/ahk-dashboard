import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from "path";
import { google } from "googleapis";

// Get project root (parent of server/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(projectRoot, ".env.local") });

/**
 * Google Drive OAuth2 authentication
 * 
 * Uses your personal Google account: ashraf.kahoush@gmail.com
 * This gives access to YOUR personal Google Drive files
 * 
 * Required env vars:
 * - GOOGLE_DRIVE_CLIENT_ID
 * - GOOGLE_DRIVE_CLIENT_SECRET
 * - GOOGLE_DRIVE_REDIRECT_URI
 * - GOOGLE_PERSONAL_REFRESH_TOKEN (or GOOGLE_REFRESH_TOKEN)
 */

const {
  GOOGLE_DRIVE_CLIENT_ID,
  GOOGLE_DRIVE_CLIENT_SECRET,
  GOOGLE_DRIVE_REDIRECT_URI,
  GOOGLE_PERSONAL_REFRESH_TOKEN,
  GOOGLE_REFRESH_TOKEN,
  EMMA_DRIVE_ACTIVE_USER
} = process.env;

// Validate required credentials
if (!GOOGLE_DRIVE_CLIENT_ID || !GOOGLE_DRIVE_CLIENT_SECRET || !GOOGLE_DRIVE_REDIRECT_URI) {
  throw new Error(
    "Missing Google Drive OAuth credentials in .env.local\n" +
    "Required: GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, GOOGLE_DRIVE_REDIRECT_URI"
  );
}

// Use personal refresh token (prioritize GOOGLE_PERSONAL_REFRESH_TOKEN)
const refreshToken = GOOGLE_PERSONAL_REFRESH_TOKEN || GOOGLE_REFRESH_TOKEN;

if (!refreshToken) {
  throw new Error(
    "Missing GOOGLE_PERSONAL_REFRESH_TOKEN or GOOGLE_REFRESH_TOKEN in .env.local\n" +
    "This token provides access to your personal Google Drive"
  );
}

console.log(`✅ Configuring OAuth2 for Google Drive: ${EMMA_DRIVE_ACTIVE_USER || 'ashraf.kahoush@gmail.com'}`);

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_DRIVE_CLIENT_ID,
  GOOGLE_DRIVE_CLIENT_SECRET,
  GOOGLE_DRIVE_REDIRECT_URI
);

// Set the refresh token
oauth2Client.setCredentials({
  refresh_token: refreshToken
});

// Create Drive API client
const drive = google.drive({
  version: "v3",
  auth: oauth2Client
});

// Test function to verify authentication
export async function testDriveAccess() {
  try {
    const response = await drive.about.get({
      fields: 'user(emailAddress, displayName)'
    });
    console.log(`✅ Google Drive connected: ${response.data.user.emailAddress}`);
    console.log(`   Display Name: ${response.data.user.displayName}`);
    return { success: true, user: response.data.user };
  } catch (error) {
    console.error('❌ Google Drive connection failed:', error.message);
    return { success: false, error: error.message };
  }
}

export { oauth2Client, drive };
export default drive;
